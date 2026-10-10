// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BCLRewards} from "../src/BCLRewards.sol";

contract BCLRewardsTest is Test {
    BCLRewards internal r;

    address internal admin  = makeAddr("admin");
    address internal minter = makeAddr("minter");
    address internal alice  = makeAddr("alice");
    address internal bob    = makeAddr("bob");

    // Precomputed token IDs (mirrors BCLRewards offset constants)
    uint256 internal constant LVL_5   = 1_000_005;  // level 5
    uint256 internal constant LVL_10  = 1_000_010;  // level 10
    uint256 internal constant TASK_1  = 2_000_001;  // task id 1
    uint256 internal constant STK_7   = 3_000_007;  // 7-day streak
    uint256 internal constant COMM_1  = 4_000_001;  // community milestone 1

    function setUp() public {
        r = new BCLRewards("https://meta.bcl/", admin, 0, minter);

        // Register milestones
        vm.startPrank(admin);
        r.registerMilestone(LVL_5,  1, "Level 5",          "ipfs://Qm.../level5.json");
        r.registerMilestone(LVL_10, 1, "Level 10",         "ipfs://Qm.../level10.json");
        r.registerMilestone(TASK_1, 2, "First Task",        "ipfs://Qm.../task1.json");
        r.registerMilestone(STK_7,  3, "7-Day Streak",      "ipfs://Qm.../streak7.json");
        r.registerMilestone(COMM_1, 4, "Community Pioneer", "ipfs://Qm.../comm1.json");
        vm.stopPrank();
    }

    // ───── registration ──────────────────────────────────────────────────────

    function test_milestoneRegistered() public view {
        BCLRewards.MilestoneInfo memory m = r.getMilestone(LVL_5);
        assertTrue(m.exists);
        assertEq(m.milestoneType, 1);
        assertEq(m.name, "Level 5");
        assertEq(m.metadataURI, "ipfs://Qm.../level5.json");
    }

    function test_doubleRegister_reverts() public {
        vm.prank(admin);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.MilestoneAlreadyRegistered.selector, LVL_5));
        r.registerMilestone(LVL_5, 1, "dup", "");
    }

    function test_wrongRange_reverts() public {
        // 1_000_999 is valid LEVEL range but we declare it as TASK (type 2) — should fail
        vm.prank(admin);
        vm.expectRevert();
        r.registerMilestone(1_000_999, 2, "bad", "");
    }

    function test_updateMilestone() public {
        vm.prank(admin);
        r.updateMilestone(LVL_5, "Level 5 (v2)", "ipfs://new.json");
        assertEq(r.getMilestone(LVL_5).name, "Level 5 (v2)");
        assertEq(r.uri(LVL_5), "ipfs://new.json");
    }

    function test_batchRegister() public {
        uint256[] memory ids   = new uint256[](2);
        uint256[] memory types = new uint256[](2);
        string[]  memory names = new string[](2);
        string[]  memory uris  = new string[](2);
        ids[0] = 1_000_020; types[0] = 1; names[0] = "Level 20"; uris[0] = "ipfs://lvl20.json";
        ids[1] = 3_000_030; types[1] = 3; names[1] = "30-Day Streak"; uris[1] = "ipfs://stk30.json";

        vm.prank(admin);
        r.registerMilestoneBatch(ids, types, names, uris);

        assertTrue(r.getMilestone(1_000_020).exists);
        assertTrue(r.getMilestone(3_000_030).exists);
    }

    // ───── claim — whitelist path ─────────────────────────────────────────────

    function test_whitelistAndClaim_level() public {
        vm.prank(minter);
        r.addToWhitelist(alice, LVL_5);
        assertTrue(r.isWhitelisted(alice, LVL_5));

        vm.prank(alice);
        r.claim(LVL_5);

        assertEq(r.balanceOf(alice, LVL_5), 1);
        assertTrue(r.hasClaimed(alice, LVL_5));
        assertFalse(r.isWhitelisted(alice, LVL_5));
    }

    function test_whitelistAndClaim_streak() public {
        vm.prank(minter);
        r.addToWhitelist(alice, STK_7);

        vm.prank(alice);
        r.claim(STK_7);
        assertEq(r.balanceOf(alice, STK_7), 1);
    }

    function test_claim_unregistered_reverts() public {
        uint256 unknownId = 1_000_050; // not registered
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.MilestoneNotRegistered.selector, unknownId));
        r.addToWhitelist(alice, unknownId);
    }

    function test_claim_notWhitelisted_reverts() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.NotWhitelisted.selector, alice, LVL_5));
        r.claim(LVL_5);
    }

    function test_doubleClaim_reverts() public {
        vm.prank(minter); r.addToWhitelist(alice, LVL_5);
        vm.prank(alice);  r.claim(LVL_5);

        vm.prank(minter); r.addToWhitelist(alice, LVL_5); // re-whitelist
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.AlreadyClaimed.selector, alice, LVL_5));
        r.claim(LVL_5);
    }

    function test_revokeWhitelist() public {
        vm.prank(minter); r.addToWhitelist(alice, TASK_1);
        vm.prank(minter); r.revokeWhitelist(alice, TASK_1);

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.NotWhitelisted.selector, alice, TASK_1));
        r.claim(TASK_1);
    }

    function test_batchWhitelist() public {
        address[] memory wallets = new address[](2);
        uint256[] memory ids     = new uint256[](2);
        wallets[0] = alice; ids[0] = LVL_5;
        wallets[1] = bob;   ids[1] = COMM_1;

        vm.prank(minter);
        r.addToWhitelistBatch(wallets, ids);

        assertTrue(r.isWhitelisted(alice, LVL_5));
        assertTrue(r.isWhitelisted(bob,   COMM_1));
    }

    // ───── admin mint path ────────────────────────────────────────────────────

    function test_adminMint_task() public {
        vm.prank(minter);
        r.adminMint(bob, TASK_1);
        assertEq(r.balanceOf(bob, TASK_1), 1);
        assertTrue(r.hasClaimed(bob, TASK_1));
    }

    function test_adminMint_unregistered_reverts() public {
        uint256 ghost = 2_999_999;
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(BCLRewards.MilestoneNotRegistered.selector, ghost));
        r.adminMint(alice, ghost);
    }

    function test_adminMintBatch_multiType() public {
        uint256[] memory ids = new uint256[](3);
        ids[0] = LVL_5; ids[1] = TASK_1; ids[2] = STK_7;

        vm.prank(minter);
        r.adminMintBatch(alice, ids);

        assertEq(r.balanceOf(alice, LVL_5),  1);
        assertEq(r.balanceOf(alice, TASK_1), 1);
        assertEq(r.balanceOf(alice, STK_7),  1);
    }

    function test_adminMintBatch_duplicate_reverts() public {
        uint256[] memory ids = new uint256[](2);
        ids[0] = LVL_5; ids[1] = LVL_5; // duplicate in same batch

        vm.prank(minter);
        vm.expectRevert(); // AlreadyClaimed on second id
        r.adminMintBatch(alice, ids);
    }

    // ───── soulbound ──────────────────────────────────────────────────────────

    function test_transfer_reverts() public {
        vm.prank(minter); r.adminMint(alice, LVL_5);
        vm.prank(alice);
        vm.expectRevert(BCLRewards.SoulboundToken.selector);
        r.safeTransferFrom(alice, bob, LVL_5, 1, "");
    }

    function test_batchTransfer_reverts() public {
        vm.prank(minter); r.adminMint(alice, LVL_5);
        uint256[] memory ids = new uint256[](1); ids[0] = LVL_5;
        uint256[] memory amt = new uint256[](1); amt[0] = 1;
        vm.prank(alice);
        vm.expectRevert(BCLRewards.SoulboundToken.selector);
        r.safeBatchTransferFrom(alice, bob, ids, amt, "");
    }

    // ───── metadata ───────────────────────────────────────────────────────────

    function test_uri_perMilestone() public view {
        assertEq(r.uri(LVL_5),  "ipfs://Qm.../level5.json");
        assertEq(r.uri(STK_7),  "ipfs://Qm.../streak7.json");
        assertEq(r.uri(COMM_1), "ipfs://Qm.../comm1.json");
    }

    function test_uri_baseURIFallback() public {
        // Register milestone without a custom URI
        vm.prank(admin);
        r.registerMilestone(1_000_006, 1, "Level 6", "");
        assertEq(r.uri(1_000_006), "https://meta.bcl/1000006.json");
    }

    // ───── helper functions ───────────────────────────────────────────────────

    function test_tokenIdHelpers() public view {
        assertEq(r.levelTokenId(5),     1_000_005);
        assertEq(r.taskTokenId(1),      2_000_001);
        assertEq(r.streakTokenId(7),    3_000_007);
        assertEq(r.communityTokenId(1), 4_000_001);
    }

    // ───── pause ──────────────────────────────────────────────────────────────

    function test_pauseBlocksClaimAndMint() public {
        vm.prank(minter); r.addToWhitelist(alice, LVL_5);
        vm.prank(admin);  r.pause();

        vm.prank(alice); vm.expectRevert(); r.claim(LVL_5);
        vm.prank(minter); vm.expectRevert(); r.adminMint(bob, LVL_10);
    }

    // ───── access control ─────────────────────────────────────────────────────

    function test_nonAdminCannotRegister() public {
        vm.prank(alice);
        vm.expectRevert();
        r.registerMilestone(1_000_099, 1, "x", "");
    }

    function test_nonMinterCannotWhitelist() public {
        vm.prank(alice);
        vm.expectRevert();
        r.addToWhitelist(bob, LVL_5);
    }
}
