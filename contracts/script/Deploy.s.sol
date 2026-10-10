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
///   ADMIN_ADDRESS, RELAYER_ADDRESS, NFT_BASE_URI
///   NAME_NFT_BASE_URI    — base URI for BCLNameNFT token metadata
///   BCL_INITIAL_SUPPLY   — initial BCL token supply (in 1e18 units, default 100_000_000e18)
///   BCL_MAX_SUPPLY       — hard cap (0 = uncapped, default 0)
///   NAME_PRICE_PER_YEAR  — BCL tokens per year per name (in 1e18 units, default 10e18)
///   TREASURY_ADDRESS     — where name registration fees go (defaults to admin)
///
/// After deployment:
///   1. python scripts/seed_milestones.py   -- register milestone types on BCLRewards
///   2. Set NAME_NFT_ADDRESS and BCL_TOKEN_ADDRESS in backend .env
contract Deploy is Script {
    function run()
        external
        returns (
            BCLRewards  rewards,
            BCLRegistry registry,
            BCLToken    bclToken,
            BCLNameNFT  nameNft
        )
    {
        address admin    = vm.envAddress("ADMIN_ADDRESS");
        address relayer  = vm.envAddress("RELAYER_ADDRESS");
        address treasury = vm.envOr("TREASURY_ADDRESS", admin);

        string memory rewardsBaseUri = vm.envString("NFT_BASE_URI");
        string memory nameNftBaseUri = vm.envOr("NAME_NFT_BASE_URI", string(""));

        uint48  delay            = uint48(vm.envOr("ADMIN_TRANSFER_DELAY", uint256(3 days)));
        uint256 domainPrice      = vm.envOr("DOMAIN_PRICE_PER_YEAR_WEI", uint256(0));
        bool    transfersEnabled = vm.envOr("DOMAIN_TRANSFERS_ENABLED", true);

        uint256 initialSupply    = vm.envOr("BCL_INITIAL_SUPPLY", uint256(100_000_000 * 1e18));
        uint256 maxSupply        = vm.envOr("BCL_MAX_SUPPLY",     uint256(0));
        uint256 namePricePerYear = vm.envOr("NAME_PRICE_PER_YEAR", uint256(10 * 1e18));

        vm.startBroadcast();

        // 1. BCL Rewards (ERC-1155 soulbound milestones)
        rewards  = new BCLRewards(rewardsBaseUri, admin, delay, relayer);

        // 2. BCL Registry (plain mapping-based domain registry, kept for compatibility)
        registry = new BCLRegistry(admin, delay, domainPrice, transfersEnabled);

        // 3. BCL Token (ERC-20 utility token)
        bclToken = new BCLToken(admin, delay, initialSupply, maxSupply);

        // 4. BCL Name NFT (ERC-721 ENS-style names, paid in BCL tokens)
        nameNft = new BCLNameNFT(
            admin,
            delay,
            address(bclToken),
            namePricePerYear,
            treasury,
            nameNftBaseUri
        );

        // Grant REGISTRAR_ROLE to the relayer (backend gas-sponsoring flow)
        nameNft.grantRole(keccak256("REGISTRAR_ROLE"), relayer);

        // Grant MINTER_ROLE on BCLToken to the relayer (reward users with BCL)
        bclToken.grantRole(keccak256("MINTER_ROLE"), relayer);

        vm.stopBroadcast();

        console2.log("BCLRewards  :", address(rewards));
        console2.log("BCLRegistry :", address(registry));
        console2.log("BCLToken    :", address(bclToken));
        console2.log("BCLNameNFT  :", address(nameNft));
        console2.log("Block       :", block.number);
        console2.log("");
        console2.log("Next steps:");
        console2.log("  1. python scripts/seed_milestones.py");
        console2.log("  2. Set NAME_NFT_ADDRESS and BCL_TOKEN_ADDRESS in backend .env");
    }
}
