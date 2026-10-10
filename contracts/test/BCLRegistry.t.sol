// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {BCLRegistry} from "../src/BCLRegistry.sol";

contract BCLRegistryTest is Test {
    BCLRegistry reg;
    address admin = makeAddr("admin");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    uint256 constant PRICE = 0.01 ether;

    function setUp() public {
        reg = new BCLRegistry(admin, 3 days, PRICE, true);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function _register(address who, string memory label, uint256 yrs) internal {
        vm.prank(who);
        reg.register{value: PRICE * yrs}(label, yrs);
    }

    function test_Register() public {
        vm.expectEmit(true, true, false, true);
        emit BCLRegistry.NameRegistered(reg.nodeOf("philip"), "philip", alice, uint64(block.timestamp + 365 days), PRICE);
        _register(alice, "philip", 1);

        assertEq(reg.ownerOf("philip"), alice);
        assertFalse(reg.available("philip"));
        (address o, string memory data, uint64 exp) = reg.resolve("philip");
        assertEq(o, alice);
        assertEq(data, "");
        assertEq(exp, block.timestamp + 365 days);
        assertEq(address(reg).balance, PRICE);
    }

    function test_RefundsOverpayment() public {
        uint256 before = alice.balance;
        vm.prank(alice);
        reg.register{value: 1 ether}("philip", 1);
        assertEq(before - alice.balance, PRICE);
    }

    function test_RevertWhen_Underpaid() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(BCLRegistry.InsufficientPayment.selector, PRICE * 2, PRICE));
        reg.register{value: PRICE}("philip", 2);
    }

    function test_LabelValidation() public view {
        assertTrue(reg.isValidLabel("abc"));
        assertTrue(reg.isValidLabel("a-b-c1"));
        assertFalse(reg.isValidLabel("ab")); // too short
        assertFalse(reg.isValidLabel("-abc"));
        assertFalse(reg.isValidLabel("abc-"));
        assertFalse(reg.isValidLabel("Abc")); // uppercase must be normalized off-chain
        assertFalse(reg.isValidLabel("a.bc"));
        assertFalse(reg.isValidLabel("a bc"));
        assertFalse(reg.isValidLabel("philip.bcl"));
        assertFalse(reg.isValidLabel("")); // empty
    }

    function test_RevertWhen_InvalidLabelRegistered() public {
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.InvalidLabel.selector);
        reg.register{value: PRICE}("Bad_Name", 1);
    }

    function test_RevertWhen_InvalidDuration() public {
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.InvalidDuration.selector);
        reg.register{value: 0}("philip", 0);
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.InvalidDuration.selector);
        reg.register{value: 1 ether}("philip", 11);
    }

    function test_RevertWhen_AlreadyRegistered() public {
        _register(alice, "philip", 1);
        vm.prank(bob);
        vm.expectRevert(BCLRegistry.NotAvailable.selector);
        reg.register{value: PRICE}("philip", 1);
    }

    function test_ExpiryAndGracePeriod() public {
        _register(alice, "philip", 1);
        vm.warp(block.timestamp + 365 days + 1);
        assertEq(reg.ownerOf("philip"), address(0)); // expired = no active owner
        assertFalse(reg.available("philip")); // but still in grace

        vm.prank(bob);
        vm.expectRevert(BCLRegistry.NotAvailable.selector);
        reg.register{value: PRICE}("philip", 1);

        vm.warp(block.timestamp + 30 days);
        assertTrue(reg.available("philip"));
        _register(bob, "philip", 1);
        assertEq(reg.ownerOf("philip"), bob);
    }

    function test_RenewExtendsFromExpiry() public {
        _register(alice, "philip", 1);
        (, , uint64 exp1) = reg.resolve("philip");
        vm.prank(alice);
        reg.renew{value: PRICE}("philip", 1);
        (, , uint64 exp2) = reg.resolve("philip");
        assertEq(exp2, exp1 + 365 days);
    }

    function test_OwnerCanRenewDuringGrace() public {
        _register(alice, "philip", 1);
        vm.warp(block.timestamp + 365 days + 10 days);
        vm.prank(alice);
        reg.renew{value: PRICE}("philip", 1);
        assertEq(reg.ownerOf("philip"), alice);
    }

    function test_RevertWhen_NonOwnerRenews() public {
        _register(alice, "philip", 1);
        vm.prank(bob);
        vm.expectRevert(BCLRegistry.NotOwner.selector);
        reg.renew{value: PRICE}("philip", 1);
    }

    function test_RevertWhen_RenewBeyondMaxHorizon() public {
        _register(alice, "philip", 10);
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.InvalidDuration.selector);
        reg.renew{value: PRICE}("philip", 1);
    }

    function test_TransferClearsResolver() public {
        _register(alice, "philip", 1);
        vm.startPrank(alice);
        reg.setResolverData("philip", '{"avatar":"x"}');
        reg.transfer("philip", bob);
        vm.stopPrank();
        (address o, string memory data,) = reg.resolve("philip");
        assertEq(o, bob);
        assertEq(data, "");
    }

    function test_RevertWhen_NonOwnerTransfersOrSetsResolver() public {
        _register(alice, "philip", 1);
        vm.startPrank(bob);
        vm.expectRevert(BCLRegistry.NotOwner.selector);
        reg.transfer("philip", bob);
        vm.expectRevert(BCLRegistry.NotOwner.selector);
        reg.setResolverData("philip", "x");
        vm.expectRevert(BCLRegistry.NotOwner.selector);
        reg.release("philip");
        vm.stopPrank();
    }

    function test_RevertWhen_TransfersDisabled() public {
        _register(alice, "philip", 1);
        vm.prank(admin);
        reg.setTransfersEnabled(false);
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.TransfersDisabled.selector);
        reg.transfer("philip", bob);
    }

    function test_RevertWhen_ExpiredOwnerActs() public {
        _register(alice, "philip", 1);
        vm.warp(block.timestamp + 366 days);
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.NotOwner.selector);
        reg.setResolverData("philip", "x");
    }

    function test_ResolverTooLong() public {
        _register(alice, "philip", 1);
        bytes memory big = new bytes(1025);
        for (uint256 i; i < big.length; ++i) big[i] = "a";
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.ResolverDataTooLong.selector);
        reg.setResolverData("philip", string(big));
    }

    function test_ReleaseMakesAvailable() public {
        _register(alice, "philip", 1);
        vm.prank(alice);
        reg.release("philip");
        assertTrue(reg.available("philip"));
        assertEq(reg.ownerOf("philip"), address(0));
    }

    function test_ReservedNames() public {
        string[] memory labels = new string[](1);
        labels[0] = "admin";
        vm.prank(admin);
        reg.setReserved(labels, true);

        assertFalse(reg.available("admin"));
        vm.prank(alice);
        vm.expectRevert(BCLRegistry.Reserved.selector);
        reg.register{value: PRICE}("admin", 1);

        vm.prank(admin);
        reg.adminRegister("admin", bob, 1);
        assertEq(reg.ownerOf("admin"), bob);
    }

    function test_AdminFunctionsRestricted() public {
        bytes32 role = reg.DEFAULT_ADMIN_ROLE();
        bytes memory err = abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, role);
        vm.startPrank(alice);
        vm.expectRevert(err);
        reg.setPricePerYear(0);
        vm.expectRevert(err);
        reg.setTransfersEnabled(false);
        vm.expectRevert(err);
        reg.withdraw(payable(alice));
        vm.expectRevert(err);
        reg.adminRegister("freebie", alice, 1);
        vm.stopPrank();
    }

    function test_Withdraw() public {
        _register(alice, "philip", 2);
        address payable treasury = payable(makeAddr("treasury"));
        vm.prank(admin);
        reg.withdraw(treasury);
        assertEq(treasury.balance, PRICE * 2);
        assertEq(address(reg).balance, 0);
    }

    function test_PauseBlocksRegistration() public {
        vm.prank(admin);
        reg.pause();
        vm.prank(alice);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        reg.register{value: PRICE}("philip", 1);
    }

    function testFuzz_AnyValidLabelRoundTrips(uint8 len) public {
        len = uint8(bound(len, 3, 63));
        bytes memory b = new bytes(len);
        for (uint256 i; i < len; ++i) b[i] = "a";
        string memory label = string(b);
        vm.prank(alice);
        reg.register{value: PRICE}(label, 1);
        assertEq(reg.ownerOf(label), alice);
    }
}
