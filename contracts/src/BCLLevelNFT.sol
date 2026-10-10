// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title BCLLevelNFT
/// @notice Level-up achievement NFT. One NFT per (wallet, level). Only MINTER_ROLE can mint.
/// @dev Soulbound-ness is fixed at deployment via `transferable`. Admin handover is two-step + delayed
///      (AccessControlDefaultAdminRules). Token metadata is per level: baseURI + level + ".json".
contract BCLLevelNFT is ERC721, AccessControlDefaultAdminRules, Pausable {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice If false, tokens can be minted but never transferred or burned (soulbound).
    bool public immutable transferable;

    /// @notice Number of NFTs minted so far; also the last token id (ids start at 1).
    uint256 public totalMinted;

    /// @notice wallet => level => tokenId (0 means "not minted"). Doubles as the duplicate guard.
    mapping(address => mapping(uint256 => uint256)) public tokenIdOf;

    /// @notice tokenId => level
    mapping(uint256 => uint256) public levelOf;

    string private _baseTokenURI;

    event LevelNFTMinted(address indexed recipient, uint256 indexed level, uint256 indexed tokenId);
    event BaseURIUpdated(string newBaseURI);

    error ZeroAddress();
    error InvalidLevel();
    error AlreadyMinted(address wallet, uint256 level);
    error SoulboundToken();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        address admin,
        uint48 adminTransferDelay,
        address minter,
        bool transferable_
    ) ERC721(name_, symbol_) AccessControlDefaultAdminRules(adminTransferDelay, admin) {
        _baseTokenURI = baseURI_;
        transferable = transferable_;
        if (minter != address(0)) _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Mint the NFT for `level` to `to`. Reverts if this wallet already has that level's NFT.
    function mintLevel(address to, uint256 level) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) revert ZeroAddress();
        if (level == 0) revert InvalidLevel();
        if (tokenIdOf[to][level] != 0) revert AlreadyMinted(to, level);

        tokenId = ++totalMinted;
        tokenIdOf[to][level] = tokenId;
        levelOf[tokenId] = level;

        // _mint (not _safeMint): a contract wallet without a receiver hook must not block a mint job forever.
        _mint(to, tokenId);
        emit LevelNFTMinted(to, level, tokenId);
    }

    function setBaseURI(string calldata newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory base = _baseTokenURI;
        if (bytes(base).length == 0) return "";
        return string.concat(base, levelOf[tokenId].toString(), ".json");
    }

    /// @dev Single choke point for mint/transfer/burn: enforces pause + soulbound policy.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        _requireNotPaused();
        if (!transferable && _ownerOf(tokenId) != address(0)) revert SoulboundToken();
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControlDefaultAdminRules)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
