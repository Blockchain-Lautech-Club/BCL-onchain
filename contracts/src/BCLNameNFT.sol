// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title BCLNameNFT
/// @notice ENS-style name registry where each `<label>.bcl` name is an ERC-721 NFT.
///
///  Key properties
///  ──────────────
///  • Each unique label maps to a stable token ID (keccak256(label) % (2^256-1)).
///    The same label always produces the same token ID; once minted it is never re-minted.
///  • Registrations are time-limited (1–MAX_YEARS years, 365-day years).
///  • 30-day grace period after expiry: only previous owner can renew; others can't register.
///  • Payment is in BCL tokens (ERC-20). Supports EIP-2612 permit for single-tx approvals.
///  • Names are fully transferable via standard ERC-721 transfers (NFT changes hands).
///    Resolver data is cleared on transfer.
///  • Reserved labels can only be registered by admin via adminRegister().
///  • Names can be used as wallet aliases anywhere in the BCL ecosystem.
///
///  Token ID scheme
///  ───────────────
///  tokenId = uint256(keccak256(bytes(label)))
///  This is deterministic, collision-resistant, and stable across contract versions.
///
///  Expired names
///  ─────────────
///  When a name expires (past grace period), the NFT is "burned" (owner cleared),
///  and the label is available for a new owner to re-register. The new owner gets
///  the SAME token ID re-minted to their address.
contract BCLNameNFT is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    AccessControlDefaultAdminRules,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;
    using Strings for uint256;

    // ─────────────────────── roles ───────────────────────────────────────────
    bytes32 public constant PAUSER_ROLE    = keccak256("PAUSER_ROLE");
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE"); // backend relayer

    // ─────────────────────── constants ───────────────────────────────────────
    uint256 public constant MAX_YEARS         = 10;
    uint256 public constant GRACE_PERIOD      = 30 days;
    uint256 public constant MIN_LABEL_LENGTH  = 3;
    uint256 public constant MAX_LABEL_LENGTH  = 63;
    uint256 public constant MAX_RESOLVER_BYTES = 1024;

    // ─────────────────────── state ───────────────────────────────────────────

    /// @notice BCL ERC-20 token used for payment.
    IERC20 public immutable bclToken;

    /// @notice Price in BCL tokens (18 decimals) per registration year.
    uint256 public pricePerYear;

    /// @notice Where collected BCL tokens are sent on withdrawal.
    address public treasury;

    struct NameRecord {
        address owner;      // current holder (mirrors NFT owner)
        uint64  expiresAt;  // unix timestamp
        string  resolverData;
    }

    /// @notice labelHash => NameRecord
    mapping(bytes32 => NameRecord) private _records;

    /// @notice labelHash => reserved (admin-only registration)
    mapping(bytes32 => bool) public reserved;

    /// @notice labelHash => label string (stored for off-chain convenience)
    mapping(bytes32 => string) private _labels;

    /// @notice tokenId => label string
    mapping(uint256 => string) private _tokenLabels;

    // ─────────────────────── events ──────────────────────────────────────────
    event NameRegistered(
        uint256 indexed tokenId,
        bytes32 indexed labelHash,
        string  label,
        address indexed owner,
        uint64  expiresAt,
        uint256 cost
    );
    event NameRenewed(uint256 indexed tokenId, string label, uint64 newExpiresAt, uint256 cost);
    event ResolverUpdated(uint256 indexed tokenId, string label, string data);
    event NameExpiredBurned(uint256 indexed tokenId, string label);
    event PriceUpdated(uint256 newPricePerYear);
    event TreasuryUpdated(address newTreasury);
    event ReservedUpdated(bytes32 indexed labelHash, string label, bool isReserved);
    event Withdrawn(address indexed to, uint256 amount);

    // ─────────────────────── errors ──────────────────────────────────────────
    error InvalidLabel();
    error InvalidDuration();
    error NotAvailable();
    error LabelReserved();
    error NotOwnerOrApproved();
    error ZeroAddress();
    error InsufficientAllowance(uint256 required, uint256 available);
    error ResolverDataTooLong();
    error NameExpired();
    error StillInGracePeriod();

    // ─────────────────────── constructor ─────────────────────────────────────

    constructor(
        address admin,
        uint48  adminTransferDelay,
        address bclToken_,
        uint256 pricePerYear_,
        address treasury_,
        string  memory baseURI_
    )
        ERC721("BCL Name", "BCLNAME")
        AccessControlDefaultAdminRules(adminTransferDelay, admin)
    {
        if (bclToken_  == address(0)) revert ZeroAddress();
        if (treasury_  == address(0)) revert ZeroAddress();

        bclToken      = IERC20(bclToken_);
        pricePerYear  = pricePerYear_;
        treasury      = treasury_;
        _baseURI_str  = baseURI_;

        _grantRole(PAUSER_ROLE,    admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    // ─────────────────────── metadata ────────────────────────────────────────

    string private _baseURI_str;

    function _baseURI() internal view override returns (string memory) {
        return _baseURI_str;
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseURI_str = newBaseURI;
    }

    // ─────────────────────── label utils ─────────────────────────────────────

    /// @notice Returns true if label is valid (lowercase a-z, 0-9, hyphen; 3-63 chars; no leading/trailing hyphen).
    function isValidLabel(string memory label) public pure returns (bool) {
        bytes memory b = bytes(label);
        uint256 len = b.length;
        if (len < MIN_LABEL_LENGTH || len > MAX_LABEL_LENGTH) return false;
        if (b[0] == 0x2d || b[len - 1] == 0x2d) return false;
        for (uint256 i; i < len; ++i) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) || (c >= 0x30 && c <= 0x39) || c == 0x2d;
            if (!ok) return false;
        }
        return true;
    }

    /// @notice Deterministic token ID for a label.
    function tokenIdOf(string memory label) public pure returns (uint256) {
        return uint256(keccak256(bytes(label)));
    }

    /// @notice Label hash (same as keccak of the label).
    function labelHash(string memory label) public pure returns (bytes32) {
        return keccak256(bytes(label));
    }

    // ─────────────────────── views ───────────────────────────────────────────

    /// @notice True if the label is valid, not reserved, and open for public registration.
    function available(string calldata label) external view returns (bool) {
        if (!isValidLabel(label)) return false;
        bytes32 lh = labelHash(label);
        return !reserved[lh] && _isOpen(lh);
    }

    /// @notice Current active owner, or address(0) if expired / not registered.
    function ownerOfLabel(string calldata label) external view returns (address) {
        NameRecord storage r = _records[labelHash(label)];
        return block.timestamp < r.expiresAt ? r.owner : address(0);
    }

    /// @notice Full resolution: (owner, resolverData, expiresAt). Owner is zero if expired.
    function resolve(string calldata label)
        external
        view
        returns (address owner, string memory data, uint64 expiresAt)
    {
        NameRecord storage r = _records[labelHash(label)];
        if (block.timestamp >= r.expiresAt) return (address(0), "", r.expiresAt);
        return (r.owner, r.resolverData, r.expiresAt);
    }

    /// @notice Raw record (ignores expiry). Used by backend reconciler.
    function recordOf(string calldata label)
        external
        view
        returns (address owner, uint64 expiresAt, string memory resolverData)
    {
        NameRecord storage r = _records[labelHash(label)];
        return (r.owner, r.expiresAt, r.resolverData);
    }

    /// @notice Quote the BCL token cost for numYears of registration.
    function quote(uint256 numYears) external view returns (uint256) {
        return pricePerYear * numYears;
    }

    /// @notice Label string for a given token ID.
    function labelOf(uint256 tokenId_) external view returns (string memory) {
        return _tokenLabels[tokenId_];
    }

    // ─────────────────────── user actions ────────────────────────────────────

    /// @notice Register a name. Caller must have pre-approved `quote(numYears)` BCL tokens.
    /// @param label    Normalized label (no ".bcl" suffix, lowercase).
    /// @param numYears Registration duration (1–MAX_YEARS).
    function register(string calldata label, uint256 numYears)
        external
        whenNotPaused
        nonReentrant
    {
        _doRegister(label, msg.sender, numYears, true);
    }

    /// @notice Register with EIP-2612 permit — single transaction, no prior approval needed.
    function registerWithPermit(
        string calldata label,
        uint256         numYears,
        uint256         deadline,
        uint8           v,
        bytes32         r,
        bytes32         s
    ) external whenNotPaused nonReentrant {
        uint256 cost = pricePerYear * numYears;
        // Apply the permit so we can pull tokens in the same tx.
        IERC20Permit(address(bclToken)).permit(msg.sender, address(this), cost, deadline, v, r, s);
        _doRegister(label, msg.sender, numYears, true);
    }

    /// @notice Renew an existing name. Only the current NFT owner can renew.
    function renew(string calldata label, uint256 numYears)
        external
        whenNotPaused
        nonReentrant
    {
        bytes32 lh = labelHash(label);
        NameRecord storage rec = _records[lh];

        // Must be within grace period (not fully released yet).
        if (rec.owner != msg.sender) revert NotOwnerOrApproved();
        if (block.timestamp >= uint256(rec.expiresAt) + GRACE_PERIOD) revert StillInGracePeriod();
        if (numYears == 0 || numYears > MAX_YEARS) revert InvalidDuration();

        uint256 newExpiry = uint256(rec.expiresAt) + numYears * 365 days;
        if (newExpiry > block.timestamp + MAX_YEARS * 365 days) revert InvalidDuration();

        uint256 cost = pricePerYear * numYears;
        if (cost > 0) {
            bclToken.safeTransferFrom(msg.sender, treasury, cost);
        }

        rec.expiresAt = uint64(newExpiry);
        uint256 tid = tokenIdOf(label);
        emit NameRenewed(tid, label, rec.expiresAt, cost);
    }

    /// @notice Update resolver data for a name you own.
    function setResolverData(string calldata label, string calldata data)
        external
        whenNotPaused
    {
        if (bytes(data).length > MAX_RESOLVER_BYTES) revert ResolverDataTooLong();
        bytes32 lh = labelHash(label);
        NameRecord storage rec = _records[lh];
        if (rec.owner != msg.sender || block.timestamp >= rec.expiresAt) revert NotOwnerOrApproved();
        rec.resolverData = data;
        emit ResolverUpdated(tokenIdOf(label), label, data);
    }

    /// @notice Burn an expired name so the slot can be re-registered. Anyone can call this.
    ///         The name must be past the grace period.
    function burnExpired(string calldata label) external {
        bytes32 lh = labelHash(label);
        NameRecord storage rec = _records[lh];
        if (block.timestamp < uint256(rec.expiresAt) + GRACE_PERIOD) revert StillInGracePeriod();
        uint256 tid = tokenIdOf(label);
        if (_ownerOf(tid) != address(0)) {
            _burn(tid);
        }
        delete _records[lh];
        emit NameExpiredBurned(tid, label);
    }

    // ─────────────────────── admin actions ───────────────────────────────────

    /// @notice Register any valid (including reserved) label to `to` without payment.
    function adminRegister(string calldata label, address to, uint256 numYears)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        nonReentrant
    {
        if (to == address(0)) revert ZeroAddress();
        _doRegister(label, to, numYears, false);
    }

    /// @notice Backend relayer can register on behalf of a user (gas-sponsored flow).
    function relayerRegister(string calldata label, address to, uint256 numYears)
        external
        onlyRole(REGISTRAR_ROLE)
        nonReentrant
    {
        if (to == address(0)) revert ZeroAddress();
        // BCL tokens are pulled from `to`; relayer pays gas only.
        _doRegister(label, to, numYears, true);
    }

    function setReserved(string[] calldata labels, bool isReserved_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        for (uint256 i; i < labels.length; ++i) {
            bytes32 lh = labelHash(labels[i]);
            reserved[lh] = isReserved_;
            emit ReservedUpdated(lh, labels[i], isReserved_);
        }
    }

    function setPricePerYear(uint256 newPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pricePerYear = newPrice;
        emit PriceUpdated(newPrice);
    }

    function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ─────────────────────── ERC-721 transfer hook ───────────────────────────

    /// @dev Clear resolver data when the NFT changes hands (transfer/sale).
    function _update(address to, uint256 tokenId_, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address from)
    {
        from = super._update(to, tokenId_, auth);

        // If this is a real transfer (not mint, not burn), clear resolver and update record.
        if (from != address(0) && to != address(0)) {
            string memory lbl = _tokenLabels[tokenId_];
            if (bytes(lbl).length > 0) {
                bytes32 lh = labelHash(lbl);
                _records[lh].owner = to;
                _records[lh].resolverData = "";
            }
        }
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    // ─────────────────────── ERC-721 URI ─────────────────────────────────────

    function tokenURI(uint256 tokenId_)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId_);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControlDefaultAdminRules)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ─────────────────────── internals ───────────────────────────────────────

    function _isOpen(bytes32 lh) internal view returns (bool) {
        NameRecord storage r = _records[lh];
        return r.owner == address(0) || block.timestamp >= uint256(r.expiresAt) + GRACE_PERIOD;
    }

    function _doRegister(
        string calldata label,
        address         to,
        uint256         numYears,
        bool            chargeBCL
    ) internal {
        if (!isValidLabel(label)) revert InvalidLabel();
        if (numYears == 0 || numYears > MAX_YEARS) revert InvalidDuration();

        bytes32 lh = labelHash(label);
        if (reserved[lh] && chargeBCL) revert LabelReserved(); // only admin can register reserved
        if (!_isOpen(lh)) revert NotAvailable();

        uint256 cost = chargeBCL ? pricePerYear * numYears : 0;
        if (cost > 0) {
            bclToken.safeTransferFrom(to, treasury, cost);
        }

        uint64  expiresAt = uint64(block.timestamp + numYears * 365 days);
        uint256 tid       = tokenIdOf(label);

        // If this token was previously burned (re-registration after expiry), re-mint it.
        if (_ownerOf(tid) == address(0)) {
            _mint(to, tid);
        } else {
            // Shouldn't happen due to _isOpen check, but defensive.
            revert NotAvailable();
        }

        _records[lh] = NameRecord({owner: to, expiresAt: expiresAt, resolverData: ""});
        _labels[lh]  = label;
        _tokenLabels[tid] = label;

        emit NameRegistered(tid, lh, label, to, expiresAt, cost);
    }
}
