// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {BCLRewards}  from "../src/BCLRewards.sol";
import {BCLRegistry} from "../src/BCLRegistry.sol";
import {BCLToken}    from "../src/BCLToken.sol";
import {BCLNameNFT}  from "../src/BCLNameNFT.sol";

/// @dev forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify --account <keystore>
///
/// Required env vars:
///   ADMIN_ADDRESS     — the multisig / EOA that will own all contracts long-term
///   RELAYER_ADDRESS   — backend hot-wallet; receives MINTER_ROLE and REGISTRAR_ROLE
///   NFT_BASE_URI      — base metadata URI for BCLRewards
///   NAME_NFT_BASE_URI — base metadata URI for BCLNameNFT (optional, default "")
///   BCL_INITIAL_SUPPLY — initial BCL mint (18-decimal units, default 100 000 000e18)
///   BCL_MAX_SUPPLY    — hard cap, 0 = uncapped (default 0)
///   NAME_PRICE_PER_YEAR — BCL wei per name-year (default 10e18)
///   TREASURY_ADDRESS  — where registration fees go (default = ADMIN_ADDRESS)
///   ADMIN_TRANSFER_DELAY — AccessControl admin-transfer delay in seconds (default 3 days)
///   DOMAIN_PRICE_PER_YEAR_WEI — native-token price for the legacy BCLRegistry (default 0)
///   DOMAIN_TRANSFERS_ENABLED  — whether BCLRegistry allows transfers (default true)
///
/// WHY roles are granted inside the constructors
/// ─────────────────────────────────────────────
/// AccessControlDefaultAdminRules grants DEFAULT_ADMIN_ROLE to `admin`
/// immediately inside its constructor — NOT to msg.sender (the deployer).
/// So once `new SomeContract(admin, ...)` returns, the deployer no longer
/// holds DEFAULT_ADMIN_ROLE and calling grantRole() from the script reverts
/// with AccessControlUnauthorizedAccount.
///
/// The fix: BCLToken and BCLNameNFT accept an `initialMinter` / `initialRegistrar`
/// constructor parameter and call `_grantRole(ROLE, relayer)` internally.
/// `_grantRole` is an internal function that bypasses the access-control check,
/// so it works regardless of who deployed the contract.
///
/// After deployment:
///   1. python scripts/seed_milestones.py
///   2. Set NAME_NFT_ADDRESS and BCL_TOKEN_ADDRESS in backend .env
contract Deploy is Script {

    // Shared params stored in contract fields to keep each function's
    // stack frame small (avoids the 16-slot "stack too deep" limit).
    address internal _admin;
    address internal _relayer;
    address internal _treasury;
    uint48  internal _delay;

    function run()
        external
        returns (
            BCLRewards  rewards,
            BCLRegistry registry,
            BCLToken    bclToken,
            BCLNameNFT  nameNft
        )
    {
        _admin    = vm.envAddress("ADMIN_ADDRESS");
        _relayer  = vm.envAddress("RELAYER_ADDRESS");
        _treasury = vm.envOr("TREASURY_ADDRESS", _admin);
        _delay    = uint48(vm.envOr("ADMIN_TRANSFER_DELAY", uint256(3 days)));

        vm.startBroadcast();

        rewards  = _deployRewards();
        registry = _deployRegistry();
        bclToken = _deployToken();
        nameNft  = _deployNameNFT(address(bclToken));

        vm.stopBroadcast();

        _log(address(rewards), address(registry), address(bclToken), address(nameNft));
    }

    // ── internal deployers (each its own stack frame) ─────────────────────────

    /// BCLRewards already accepts relayer in its constructor → MINTER_ROLE granted there.
    function _deployRewards() internal returns (BCLRewards) {
        string memory baseUri = vm.envString("NFT_BASE_URI");
        return new BCLRewards(baseUri, _admin, _delay, _relayer);
    }

    function _deployRegistry() internal returns (BCLRegistry) {
        uint256 domainPrice      = vm.envOr("DOMAIN_PRICE_PER_YEAR_WEI", uint256(0));
        bool    transfersEnabled = vm.envOr("DOMAIN_TRANSFERS_ENABLED", true);
        return new BCLRegistry(_admin, _delay, domainPrice, transfersEnabled);
    }

    /// BCLToken: MINTER_ROLE is granted to both admin and relayer inside the
    /// constructor via _grantRole (internal, no access check), so the deployer
    /// never needs to call grantRole() post-construction.
    function _deployToken() internal returns (BCLToken) {
        uint256 initialSupply = vm.envOr("BCL_INITIAL_SUPPLY", uint256(100_000_000 * 1e18));
        uint256 maxSupply     = vm.envOr("BCL_MAX_SUPPLY",     uint256(0));
        return new BCLToken(_admin, _delay, initialSupply, maxSupply, _relayer);
    }

    /// BCLNameNFT: REGISTRAR_ROLE is granted to both admin and relayer inside the
    /// constructor via _grantRole (internal, no access check).
    function _deployNameNFT(address bclToken_) internal returns (BCLNameNFT) {
        uint256 namePricePerYear = vm.envOr("NAME_PRICE_PER_YEAR", uint256(10 * 1e18));
        string memory nameUri    = vm.envOr("NAME_NFT_BASE_URI", string(""));
        return new BCLNameNFT(
            _admin, _delay, bclToken_, namePricePerYear, _treasury, nameUri, _relayer
        );
    }

    function _log(
        address rewards,
        address registry,
        address bclToken,
        address nameNft
    ) internal view {
        console2.log("BCLRewards  :", rewards);
        console2.log("BCLRegistry :", registry);
        console2.log("BCLToken    :", bclToken);
        console2.log("BCLNameNFT  :", nameNft);
        console2.log("Block       :", block.number);
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. python scripts/seed_milestones.py");
        console2.log("  2. Set NAME_NFT_ADDRESS and BCL_TOKEN_ADDRESS in backend .env");
        console2.log("");
        console2.log("IMPORTANT: ADMIN_ADDRESS must call acceptDefaultAdminTransfer()");
        console2.log("on each contract after the transfer delay to fully take ownership.");
    }
}
