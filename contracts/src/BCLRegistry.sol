// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BCLRegistry
/// @notice Registry for `<label>.bcl` names. Names are stored by label only ("philip" for "philip.bcl").
/// @dev Policy implemented (change before mainnet if the team decides otherwise):
///  - Renewable, time-limited registrations of 1..MAX_YEARS years (365-day years).
///  - 30-day grace period after expiry: only the previous owner can renew; nobody else can register.
///  - Labels: lowercase a-z, 0-9, hyphen; 3..63 chars; no leading/trailing hyphen. The backend MUST
///    normalize (lowercase, strip ".bcl") before calling; the contract rejects anything non-canonical.
///  - Transfers can be globally toggled by admin. Resolver data is cleared on transfer.
///  - Reserved labels can only be registered by the admin via `adminRegister`.
contract BCLRegistry is AccessControlDefaultAdminRules, Pausable, ReentrancyGuard {
    struct Record {
        address owner;
        uint64 expiresAt;
        string resolverData;
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_YEARS = 10;
    uint256 public constant GRACE_PERIOD = 30 days;
    uint256 public constant MIN_LABEL_LENGTH = 3;
    uint256 public constant MAX_LABEL_LENGTH = 63;
    uint256 public constant MAX_RESOLVER_BYTES = 1024;

    uint256 public pricePerYear; // in wei; 0 = free
    bool public transfersEnabled;

    mapping(bytes32 => Record) private _records;
    mapping(bytes32 => bool) public reserved;

    event NameRegistered(bytes32 indexed node, string label, address indexed owner, uint64 expiresAt, uint256 cost);
    event NameRenewed(bytes32 indexed node, string label, uint64 newExpiresAt, uint256 cost);
    event NameTransferred(bytes32 indexed node, string label, address indexed from, address indexed to);
    event ResolverUpdated(bytes32 indexed node, string label, string data);
    event NameReleased(bytes32 indexed node, string label, address indexed owner);
    event PriceUpdated(uint256 pricePerYear);
    event TransfersEnabledUpdated(bool enabled);
    event ReservedUpdated(bytes32 indexed node, string label, bool isReserved);
    event Withdrawn(address indexed to, uint256 amount);

    error InvalidLabel();
    error InvalidDuration();
    error NotAvailable();
    error Reserved();
    error NotOwner();
    error TransfersDisabled();
    error ZeroAddress();
    error InsufficientPayment(uint256 required, uint256 sent);
    error ResolverDataTooLong();
    error TransferFailed();

    constructor(address admin, uint48 adminTransferDelay, uint256 pricePerYear_, bool transfersEnabled_)
        AccessControlDefaultAdminRules(adminTransferDelay, admin)
    {
        pricePerYear = pricePerYear_;
        transfersEnabled = transfersEnabled_;
        _grantRole(PAUSER_ROLE, admin);
    }

    // ---------------------------------------------------------------- views

    function isValidLabel(string memory label) public pure returns (bool) {
        bytes memory b = bytes(label);
        uint256 len = b.length;
        if (len < MIN_LABEL_LENGTH || len > MAX_LABEL_LENGTH) return false;
        if (b[0] == 0x2d || b[len - 1] == 0x2d) return false; // '-'
        for (uint256 i; i < len; ++i) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x2d;
            if (!ok) return false;
        }
        return true;
    }

    function nodeOf(string memory label) public pure returns (bytes32) {
        return keccak256(bytes(label));
    }

    /// @notice True if `label` is valid, not reserved, and open for public registration.
    function available(string calldata label) external view returns (bool) {
        if (!isValidLabel(label)) return false;
        bytes32 node = nodeOf(label);
        return !reserved[node] && _isOpen(node);
    }

    /// @notice Current owner, or address(0) if unregistered/expired.
    function ownerOf(string calldata label) external view returns (address) {
        Record storage r = _records[nodeOf(label)];
        return block.timestamp < r.expiresAt ? r.owner : address(0);
    }

    /// @notice In-app resolution: (owner, resolverData, expiresAt). Owner is zero if not active.
    function resolve(string calldata label)
        external
        view
        returns (address owner, string memory data, uint64 expiresAt)
    {
        Record storage r = _records[nodeOf(label)];
        if (block.timestamp >= r.expiresAt) return (address(0), "", r.expiresAt);
        return (r.owner, r.resolverData, r.expiresAt);
    }

    /// @notice Raw stored record (ignores expiry). Used by the backend reconciler.
    function recordOf(string calldata label)
        external
        view
        returns (address owner, uint64 expiresAt, string memory resolverData)
    {
        Record storage r = _records[nodeOf(label)];
        return (r.owner, r.expiresAt, r.resolverData);
    }

    function quote(uint256 numYears) external view returns (uint256) {
        return pricePerYear * numYears;
    }

    // ---------------------------------------------------------------- user actions

    function register(string calldata label, uint256 numYears) external payable whenNotPaused nonReentrant {
        bytes32 node = nodeOf(label);
        if (reserved[node]) revert Reserved();
        uint256 cost = pricePerYear * numYears;
        if (msg.value < cost) revert InsufficientPayment(cost, msg.value);

        _register(label, node, msg.sender, numYears, cost);
        _refund(msg.value - cost);
    }

    function renew(string calldata label, uint256 numYears) external payable whenNotPaused nonReentrant {
        bytes32 node = nodeOf(label);
        Record storage r = _records[node];
        if (r.owner != msg.sender || block.timestamp >= uint256(r.expiresAt) + GRACE_PERIOD) revert NotOwner();
        if (numYears == 0 || numYears > MAX_YEARS) revert InvalidDuration();

        uint256 newExpiry = uint256(r.expiresAt) + numYears * 365 days;
        if (newExpiry > block.timestamp + MAX_YEARS * 365 days) revert InvalidDuration();

        uint256 cost = pricePerYear * numYears;
        if (msg.value < cost) revert InsufficientPayment(cost, msg.value);

        r.expiresAt = uint64(newExpiry);
        emit NameRenewed(node, label, r.expiresAt, cost);
        _refund(msg.value - cost);
    }

    function transfer(string calldata label, address newOwner) external whenNotPaused {
        if (!transfersEnabled) revert TransfersDisabled();
        if (newOwner == address(0)) revert ZeroAddress();
        (bytes32 node, Record storage r) = _activeOwned(label);

        address from = r.owner;
        r.owner = newOwner;
        r.resolverData = ""; // new owner starts clean
        emit NameTransferred(node, label, from, newOwner);
    }

    function setResolverData(string calldata label, string calldata data) external whenNotPaused {
        if (bytes(data).length > MAX_RESOLVER_BYTES) revert ResolverDataTooLong();
        (bytes32 node, Record storage r) = _activeOwned(label);
        r.resolverData = data;
        emit ResolverUpdated(node, label, data);
    }

    /// @notice Give up a name early; it becomes immediately available (no refund).
    function release(string calldata label) external whenNotPaused {
        (bytes32 node, Record storage r) = _activeOwned(label);
        address owner = r.owner;
        delete _records[node];
        emit NameReleased(node, label, owner);
    }

    // ---------------------------------------------------------------- admin

    /// @notice Register any valid label (including reserved) to `to` without payment.
    function adminRegister(string calldata label, address to, uint256 numYears)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (to == address(0)) revert ZeroAddress();
        _register(label, nodeOf(label), to, numYears, 0);
    }

    function setReserved(string[] calldata labels, bool isReserved) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i; i < labels.length; ++i) {
            bytes32 node = nodeOf(labels[i]);
            reserved[node] = isReserved;
            emit ReservedUpdated(node, labels[i], isReserved);
        }
    }

    function setPricePerYear(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pricePerYear = newPrice;
        emit PriceUpdated(newPrice);
    }

    function setTransfersEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        transfersEnabled = enabled;
        emit TransfersEnabledUpdated(enabled);
    }

    function withdraw(address payable to) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool ok,) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ---------------------------------------------------------------- internals

    function _isOpen(bytes32 node) internal view returns (bool) {
        Record storage r = _records[node];
        return r.owner == address(0) || block.timestamp >= uint256(r.expiresAt) + GRACE_PERIOD;
    }

    function _register(string calldata label, bytes32 node, address owner, uint256 numYears, uint256 cost) internal {
        if (numYears == 0 || numYears > MAX_YEARS) revert InvalidDuration();
        if (!isValidLabel(label)) revert InvalidLabel();
        if (!_isOpen(node)) revert NotAvailable();

        uint64 expiresAt = uint64(block.timestamp + numYears * 365 days);
        _records[node] = Record({owner: owner, expiresAt: expiresAt, resolverData: ""});
        emit NameRegistered(node, label, owner, expiresAt, cost);
    }

    /// @dev Caller must own the name and it must not be expired.
    function _activeOwned(string calldata label) internal view returns (bytes32 node, Record storage r) {
        node = nodeOf(label);
        r = _records[node];
        if (r.owner != msg.sender || block.timestamp >= r.expiresAt) revert NotOwner();
    }

    function _refund(uint256 amount) internal {
        if (amount == 0) return;
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }
}
