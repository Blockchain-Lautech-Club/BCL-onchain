// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {AccessControlDefaultAdminRules} from
    "@openzeppelin/contracts/access/extensions/AccessControlDefaultAdminRules.sol";

/// @title BCLToken
/// @notice ERC-20 utility token for the BCL ecosystem.
///         Used to pay for name registrations, renewals, and other platform services.
///
///  Supply model
///  ────────────
///  • Admin mints initial supply and can mint more up to a global cap (0 = uncapped).
///  • Users can burn their own tokens.
///  • Permit (EIP-2612) enabled so the NameNFT contract can pull tokens in one tx.
contract BCLToken is ERC20, ERC20Burnable, ERC20Permit, AccessControlDefaultAdminRules {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Hard cap in token units (18 decimals). 0 means uncapped.
    uint256 public immutable maxSupply;

    error SupplyCapExceeded(uint256 cap, uint256 attempted);

    constructor(
        address admin,
        uint48 adminTransferDelay,
        uint256 initialSupply,
        uint256 maxSupply_,
        address initialMinter
    )
        ERC20("BCL Token", "BCL")
        ERC20Permit("BCL Token")
        AccessControlDefaultAdminRules(adminTransferDelay, admin)
    {
        maxSupply = maxSupply_;
        _grantRole(MINTER_ROLE, admin);
        // Grant MINTER_ROLE to the relayer inside the constructor while msg.sender
        // (deployer) still has implicit authority via _grantRole (internal bypass).
        if (initialMinter != address(0) && initialMinter != admin) {
            _grantRole(MINTER_ROLE, initialMinter);
        }
        if (initialSupply > 0) {
            _requireUnderCap(initialSupply);
            _mint(admin, initialSupply);
        }
    }

    /// @notice Mint `amount` tokens to `to`. Caller must hold MINTER_ROLE.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _requireUnderCap(totalSupply() + amount);
        _mint(to, amount);
    }

    // ─────────────────── internals ────────────────────────────────────────

    function _requireUnderCap(uint256 newTotal) internal view {
        if (maxSupply != 0 && newTotal > maxSupply) {
            revert SupplyCapExceeded(maxSupply, newTotal);
        }
    }
}
