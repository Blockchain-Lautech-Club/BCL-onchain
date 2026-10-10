// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {BCLLevelNFT} from "../src/BCLLevelNFT.sol";

contract BCLLevelNFTTest is Test {
    BCLLevelNFT nft;
    address admin = makeAddr("admin");
    address minter = makeAddr("minter");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    function setUp() public {
        nft = new BCLLevelNFT("BCL Level", "BCLL", "ipfs://base/", admin, 3 days, minter, false);
    }

    function test_MintLevel() public {
        vm.expectEmit(true, true, true, true);
        emit BCLLevelNFT.LevelNFTMinted(alice, 1, 1);
        vm.prank(minter);
        uint256 id = nft.mintLevel(alice, 1);

        assertEq(id, 1);
        assertEq(nft.ownerOf(1), alice);
        assertEq(nft.levelOf(1), 1);
        assertEq(nft.tokenIdOf(alice, 1), 1);
        assertEq(nft.totalMinted(), 1);
    }

    function test_RevertWhen_NonMinterMints() public {
        bytes32 role = nft.MINTER_ROLE();
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        vm.prank(alice);
        nft.mintLevel(alice, 1);
    }

    function test_RevertWhen_DuplicateWalletLevel() public {
        vm.startPrank(minter);
        nft.mintLevel(alice, 1);
        vm.expectRevert(abi.encodeWithSelector(BCLLevelNFT.AlreadyMinted.selector, alice, 1));
        nft.mintLevel(alice, 1);
        vm.stopPrank();
    }

    function test_DifferentLevelsAndWalletsAllowed() public {
        vm.startPrank(minter);
        nft.mintLevel(alice, 1);
        nft.mintLevel(alice, 2);
        nft.mintLevel(bob, 1);
        vm.stopPrank();
        assertEq(nft.totalMinted(), 3);
        assertEq(nft.balanceOf(alice), 2);
    }

    function test_RevertWhen_InvalidInputs() public {
        vm.startPrank(minter);
        vm.expectRevert(BCLLevelNFT.InvalidLevel.selector);
        nft.mintLevel(alice, 0);
        vm.expectRevert(BCLLevelNFT.ZeroAddress.selector);
        nft.mintLevel(address(0), 1);
        vm.stopPrank();
    }

    function test_SoulboundBlocksTransfer() public {
        vm.prank(minter);
        nft.mintLevel(alice, 1);
        vm.expectRevert(BCLLevelNFT.SoulboundToken.selector);
        vm.prank(alice);
        nft.transferFrom(alice, bob, 1);
    }

    function test_TransferableAllowsTransfer() public {
        BCLLevelNFT t = new BCLLevelNFT("BCL Level", "BCLL", "ipfs://base/", admin, 3 days, minter, true);
        vm.prank(minter);
        t.mintLevel(alice, 1);
        vm.prank(alice);
        t.transferFrom(alice, bob, 1);
        assertEq(t.ownerOf(1), bob);
        // transferring does not let alice be minted the same level again
        vm.prank(minter);
        vm.expectRevert(abi.encodeWithSelector(BCLLevelNFT.AlreadyMinted.selector, alice, 1));
        t.mintLevel(alice, 1);
    }

    function test_PauseBlocksMint() public {
        vm.prank(admin);
        nft.pause();
        vm.prank(minter);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        nft.mintLevel(alice, 1);

        vm.prank(admin);
        nft.unpause();
        vm.prank(minter);
        nft.mintLevel(alice, 1);
    }

    function test_TokenURIIsPerLevel() public {
        vm.startPrank(minter);
        nft.mintLevel(alice, 3);
        vm.stopPrank();
        assertEq(nft.tokenURI(1), "ipfs://base/3.json");
    }

    function test_SetBaseURI_OnlyAdmin() public {
        bytes32 role = nft.DEFAULT_ADMIN_ROLE();
        vm.expectRevert(abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role));
        vm.prank(alice);
        nft.setBaseURI("ipfs://evil/");

        vm.prank(admin);
        nft.setBaseURI("ipfs://new/");
        vm.prank(minter);
        nft.mintLevel(alice, 1);
        assertEq(nft.tokenURI(1), "ipfs://new/1.json");
    }

    function test_AdminHandoverIsTwoStep() public {
        vm.prank(admin);
        nft.beginDefaultAdminTransfer(bob);
        // not admin yet
        assertEq(nft.defaultAdmin(), admin);
        vm.warp(block.timestamp + 3 days + 1);
        vm.prank(bob);
        nft.acceptDefaultAdminTransfer();
        assertEq(nft.defaultAdmin(), bob);
    }

    function testFuzz_NeverMintsSameWalletLevelTwice(address to, uint256 level) public {
        vm.assume(to != address(0));
        level = bound(level, 1, type(uint32).max);
        vm.startPrank(minter);
        nft.mintLevel(to, level);
        vm.expectRevert(abi.encodeWithSelector(BCLLevelNFT.AlreadyMinted.selector, to, level));
        nft.mintLevel(to, level);
        vm.stopPrank();
    }
}
