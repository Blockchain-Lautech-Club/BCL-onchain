// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title BCLRewards
/// @notice ERC-1155 soulbound milestone tokens for the BCL platform.
///
///  Token ID layout  (each milestone type owns a numeric range)
///  ─────────────────────────────────────────────────────────────
///  LEVEL      1_000_001 – 1_000_100   (one ID per level, max 100 levels)
///  TASK       2_000_001 – 2_999_999   (one ID per task milestone)
///  STREAK     3_000_001 – 3_000_365   (one ID per streak day count)
///  COMMUNITY  4_000_001 – 4_999_999   (one ID per community milestone)
///
///  New milestone types can be added by the admin via registerMilestone().
///
///  Claim model
///  ───────────
///  • Backend relayer calls addToWhitelist(wallet, tokenId)  → user calls claim(tokenId)
///  • OR relayer calls adminMint(to, tokenId) directly (gas-sponsored)
///
///  Soulbound — all transfers revert after mint.
contract BCLRewards is ERC1155, AccessControlDefaultAdminRules, Pausable {
    using Strings for uint256;

    // ─────────────────────────── roles ───────────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // ─────────────────────────── milestone types ──────────────────────────────
    /// @notice Numeric codes for each milestone category.
    uint256 public constant MT_LEVEL     = 1;
    uint256 public constant MT_TASK      = 2;
    uint256 public constant MT_STREAK    = 3;
    uint256 public constant MT_COMMUNITY = 4;

    /// @notice Base offsets for each type's token ID range.
    uint256 public constant LEVEL_OFFSET     = 1_000_000;
    uint256 public constant TASK_OFFSET      = 2_000_000;
    uint256 public constant STREAK_OFFSET    = 3_000_000;
    uint256 public constant COMMUNITY_OFFSET = 4_000_000;

    // ─────────────────────────── milestone registry ───────────────────────────
    struct MilestoneInfo {
        uint256 milestoneType;  // MT_* constant
        string  name;           // human-readable ("Level 5", "7-Day Streak", …)
        string  metadataURI;    // per-milestone IPFS/arweave URI (overrides base)
        bool    exists;
    }

    /// @notice tokenId => MilestoneInfo
    mapping(uint256 => MilestoneInfo) public milestones;

    // ─────────────────────────── claim state ─────────────────────────────────
    /// @notice wallet => tokenId => claimed?
    mapping(address => mapping(uint256 => bool)) public claimed;
    /// @notice wallet => tokenId => whitelisted for one claim?
    mapping(address => mapping(uint256 => bool)) public whitelist;

    string private _baseURI;

    // ─────────────────────────── events ──────────────────────────────────────
    event MilestoneRegistered(uint256 indexed tokenId, uint256 milestoneType, string name);
    event MilestoneUpdated(uint256 indexed tokenId, string name, string metadataURI);
    event Whitelisted(address indexed wallet, uint256 indexed tokenId);
    event WhitelistRevoked(address indexed wallet, uint256 indexed tokenId);
    event Claimed(address indexed wallet, uint256 indexed tokenId);
    event AdminMinted(address indexed to, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);

    // ─────────────────────────── errors ──────────────────────────────────────
    error ZeroAddress();
    error MilestoneNotRegistered(uint256 tokenId);
    error MilestoneAlreadyRegistered(uint256 tokenId);
    error InvalidTokenId(uint256 tokenId);
    error NotWhitelisted(address wallet, uint256 tokenId);
    error AlreadyClaimed(address wallet, uint256 tokenId);
    error SoulboundToken();

    // ─────────────────────────── constructor ─────────────────────────────────
    constructor(
        string memory baseURI_,
        address admin,
        uint48 adminTransferDelay,
        address minter
    )
        ERC1155(baseURI_)
        AccessControlDefaultAdminRules(adminTransferDelay, admin)
    {
        _baseURI = baseURI_;
        if (minter != address(0)) _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, admin);
    }

    // ─────────────────────── milestone registration ───────────────────────────

    /// @notice Admin registers a new milestone and its token ID before anyone can mint it.
    /// @param tokenId       Must fall within one of the four defined ranges.
    /// @param milestoneType One of MT_LEVEL / MT_TASK / MT_STREAK / MT_COMMUNITY.
    /// @param name          Human-readable label ("Level 5", "First Task", …).
    /// @param metadataURI   Full IPFS/arweave URI for this token's metadata. Pass "" to use baseURI fallback.
    function registerMilestone(
        uint256 tokenId,
        uint256 milestoneType,
        string calldata name,
        string calldata metadataURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (milestones[tokenId].exists) revert MilestoneAlreadyRegistered(tokenId);
        _validateTokenId(tokenId, milestoneType);

        milestones[tokenId] = MilestoneInfo({
            milestoneType: milestoneType,
            name: name,
            metadataURI: metadataURI,
            exists: true
        });
        emit MilestoneRegistered(tokenId, milestoneType, name);
    }

    /// @notice Batch register — useful for seeding all level milestones at deploy time.
    function registerMilestoneBatch(
        uint256[] calldata tokenIds,
        uint256[] calldata milestoneTypes,
        string[]  calldata names,
        string[]  calldata metadataURIs
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            tokenIds.length == milestoneTypes.length &&
            tokenIds.length == names.length &&
            tokenIds.length == metadataURIs.length,
            "length mismatch"
        );
        for (uint256 i; i < tokenIds.length; ++i) {
            if (milestones[tokenIds[i]].exists) revert MilestoneAlreadyRegistered(tokenIds[i]);
            _validateTokenId(tokenIds[i], milestoneTypes[i]);
            milestones[tokenIds[i]] = MilestoneInfo({
                milestoneType: milestoneTypes[i],
                name: names[i],
                metadataURI: metadataURIs[i],
                exists: true
            });
            emit MilestoneRegistered(tokenIds[i], milestoneTypes[i], names[i]);
        }
    }

    /// @notice Update a milestone's name or metadata URI after registration.
    function updateMilestone(
        uint256 tokenId,
        string calldata name,
        string calldata metadataURI
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (!milestones[tokenId].exists) revert MilestoneNotRegistered(tokenId);
        milestones[tokenId].name        = name;
        milestones[tokenId].metadataURI = metadataURI;
        emit MilestoneUpdated(tokenId, name, metadataURI);
    }

    // ──────────────────────── whitelist flow ─────────────────────────────────

    /// @notice Relayer whitelists wallet to claim one token. Milestone must be registered first.
    function addToWhitelist(address wallet, uint256 tokenId)
        external onlyRole(MINTER_ROLE)
    {
        if (wallet == address(0)) revert ZeroAddress();
        if (!milestones[tokenId].exists) revert MilestoneNotRegistered(tokenId);
        whitelist[wallet][tokenId] = true;
        emit Whitelisted(wallet, tokenId);
    }

    /// @notice Batch whitelist — e.g. multiple level-ups in one tx.
    function addToWhitelistBatch(address[] calldata wallets, uint256[] calldata tokenIds)
        external onlyRole(MINTER_ROLE)
    {
        require(wallets.length == tokenIds.length, "length mismatch");
        for (uint256 i; i < wallets.length; ++i) {
            if (wallets[i] == address(0)) revert ZeroAddress();
            if (!milestones[tokenIds[i]].exists) revert MilestoneNotRegistered(tokenIds[i]);
            whitelist[wallets[i]][tokenIds[i]] = true;
            emit Whitelisted(wallets[i], tokenIds[i]);
        }
    }

    function revokeWhitelist(address wallet, uint256 tokenId)
        external onlyRole(MINTER_ROLE)
    {
        whitelist[wallet][tokenId] = false;
        emit WhitelistRevoked(wallet, tokenId);
    }

    /// @notice User claims a token they have been whitelisted for.
    function claim(uint256 tokenId) external whenNotPaused {
        address wallet = msg.sender;
        if (!milestones[tokenId].exists) revert MilestoneNotRegistered(tokenId);
        if (!whitelist[wallet][tokenId])  revert NotWhitelisted(wallet, tokenId);
        if (claimed[wallet][tokenId])     revert AlreadyClaimed(wallet, tokenId);

        whitelist[wallet][tokenId] = false;
        claimed[wallet][tokenId]   = true;
        _mint(wallet, tokenId, 1, "");
        emit Claimed(wallet, tokenId);
    }

    // ───────────────────────── admin mint ────────────────────────────────────

    /// @notice Relayer mints directly (gas-sponsored path).
    function adminMint(address to, uint256 tokenId)
        external onlyRole(MINTER_ROLE) whenNotPaused
    {
        if (to == address(0)) revert ZeroAddress();
        if (!milestones[tokenId].exists) revert MilestoneNotRegistered(tokenId);
        if (claimed[to][tokenId])        revert AlreadyClaimed(to, tokenId);

        claimed[to][tokenId]   = true;
        whitelist[to][tokenId] = false;
        _mint(to, tokenId, 1, "");
        emit AdminMinted(to, tokenId);
    }

    /// @notice Batch admin mint — multiple milestone types in one tx.
    function adminMintBatch(address to, uint256[] calldata tokenIds)
        external onlyRole(MINTER_ROLE) whenNotPaused
    {
        if (to == address(0)) revert ZeroAddress();
        uint256[] memory amounts = new uint256[](tokenIds.length);
        for (uint256 i; i < tokenIds.length; ++i) {
            if (!milestones[tokenIds[i]].exists) revert MilestoneNotRegistered(tokenIds[i]);
            if (claimed[to][tokenIds[i]])        revert AlreadyClaimed(to, tokenIds[i]);
            claimed[to][tokenIds[i]]   = true;
            whitelist[to][tokenIds[i]] = false;
            amounts[i] = 1;
        }
        _mintBatch(to, tokenIds, amounts, "");
        for (uint256 i; i < tokenIds.length; ++i) {
            emit AdminMinted(to, tokenIds[i]);
        }
    }

    // ──────────────────────── soulbound ──────────────────────────────────────

    function safeTransferFrom(address, address, uint256, uint256, bytes memory)
        public pure override { revert SoulboundToken(); }

    function safeBatchTransferFrom(address, address, uint256[] memory, uint256[] memory, bytes memory)
        public pure override { revert SoulboundToken(); }

    // ──────────────────────── metadata ───────────────────────────────────────

    /// @notice Returns per-milestone URI if set, otherwise baseURI + tokenId + ".json".
    function uri(uint256 tokenId) public view override returns (string memory) {
        MilestoneInfo storage m = milestones[tokenId];
        if (bytes(m.metadataURI).length > 0) return m.metadataURI;
        if (bytes(_baseURI).length == 0) return "";
        return string.concat(_baseURI, tokenId.toString(), ".json");
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    // ─────────────────────────── pause ───────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    // ──────────────────────── view helpers ───────────────────────────────────

    /// @notice Compute the token ID for a level milestone.
    function levelTokenId(uint256 level) public pure returns (uint256) {
        require(level >= 1 && level <= 100, "level out of range");
        return LEVEL_OFFSET + level;
    }

    /// @notice Compute the token ID for a task milestone (use task's own numeric ID).
    function taskTokenId(uint256 taskId) public pure returns (uint256) {
        require(taskId >= 1 && taskId <= 999_999, "taskId out of range");
        return TASK_OFFSET + taskId;
    }

    /// @notice Compute the token ID for a streak milestone (streakDays = consecutive days).
    function streakTokenId(uint256 streakDays) public pure returns (uint256) {
        require(streakDays >= 1 && streakDays <= 365, "streakDays out of range");
        return STREAK_OFFSET + streakDays;
    }

    /// @notice Compute the token ID for a community milestone.
    function communityTokenId(uint256 communityId) public pure returns (uint256) {
        require(communityId >= 1 && communityId <= 999_999, "communityId out of range");
        return COMMUNITY_OFFSET + communityId;
    }

    function hasClaimed(address wallet, uint256 tokenId) external view returns (bool) {
        return claimed[wallet][tokenId];
    }

    function isWhitelisted(address wallet, uint256 tokenId) external view returns (bool) {
        return whitelist[wallet][tokenId];
    }

    function getMilestone(uint256 tokenId) external view returns (MilestoneInfo memory) {
        return milestones[tokenId];
    }

    // ─────────────────────── interface support ────────────────────────────────
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC1155, AccessControlDefaultAdminRules)
        returns (bool)
    { return super.supportsInterface(interfaceId); }

    // ──────────────────────── internal ───────────────────────────────────────

    /// @dev Validates tokenId falls in the correct range for its declared milestoneType.
    function _validateTokenId(uint256 tokenId, uint256 milestoneType) internal pure {
        if (milestoneType == MT_LEVEL) {
            require(tokenId > LEVEL_OFFSET && tokenId <= LEVEL_OFFSET + 100, "bad LEVEL id");
        } else if (milestoneType == MT_TASK) {
            require(tokenId > TASK_OFFSET && tokenId <= TASK_OFFSET + 999_999, "bad TASK id");
        } else if (milestoneType == MT_STREAK) {
            require(tokenId > STREAK_OFFSET && tokenId <= STREAK_OFFSET + 365, "bad STREAK id");
        } else if (milestoneType == MT_COMMUNITY) {
            require(tokenId > COMMUNITY_OFFSET && tokenId <= COMMUNITY_OFFSET + 999_999, "bad COMMUNITY id");
        } else {
            revert InvalidTokenId(tokenId);
        }
    }

    function _update(
        address from, address to,
        uint256[] memory ids, uint256[] memory values
    ) internal override {
        _requireNotPaused();
        super._update(from, to, ids, values);
    }
}
