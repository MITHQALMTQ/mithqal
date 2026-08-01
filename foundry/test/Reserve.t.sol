// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Reserve} from "../src/Reserve.sol";

/**
 * @title Reserve Unit + Fuzz Tests
 * @notice Covers §22-26 reserve-tiering invariants for the Reserve vault.
 *
 * Reserve is the SINGLE SOURCE OF TRUTH for the on-chain reserve balance.
 * It does NOT hold the assets themselves (those sit with qualified
 * custodians off-chain) — it maintains the cryptographic attestation ledger.
 *
 * Role model (simplified AccessControl, no OZ import):
 *   - COUNCIL_ROLE  : granted to deployer at construction; can grant/revoke
 *   - MINTER_ROLE   : granted to deployer at construction; can call depositReserve()
 *   - REDEEMER_ROLE : granted to deployer at construction; can call withdrawReserve()
 *   - ORACLE_ROLE   : granted to deployer at construction; can call attestReserves()
 *
 * Invariants tested:
 *   - depositReserve() reverts without MINTER_ROLE
 *   - withdrawReserve() reverts without REDEEMER_ROLE
 *   - Tier composition always sums to total reserve (conservation)
 *   - Withdrawals are pro-rata across tiers (preserves composition)
 *   - Reserve balance can NEVER go negative (Solidity 0.8.x checked math)
 */
contract ReserveTest is Test {
    Reserve public reserve;

    // Test actors
    address public deployer = address(this);
    address public minter = address(0xA11CE);
    address public redeemer = address(0xB0B);
    address public oracle = address(0x0AC1E);
    address public council = address(0xC0FFEE);
    address public nonAuthorized = address(0xBEEF);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    function setUp() public {
        reserve = new Reserve(); // deployer becomes Council + Minter + Redeemer + Oracle
        // Promote secondary addresses so we can test with non-deployer actors.
        reserve.grantRole(MINTER_ROLE, minter);
        reserve.grantRole(REDEEMER_ROLE, redeemer);
        reserve.grantRole(ORACLE_ROLE, oracle);
        reserve.grantRole(COUNCIL_ROLE, council);
    }

    // ---- Deployment + role assignment ----

    function test_Deployment_GrantsAllRolesToDeployer() public view {
        assertTrue(reserve.hasRole(COUNCIL_ROLE, deployer), "council");
        assertTrue(reserve.hasRole(MINTER_ROLE, deployer), "minter");
        assertTrue(reserve.hasRole(REDEEMER_ROLE, deployer), "redeemer");
        assertTrue(reserve.hasRole(ORACLE_ROLE, deployer), "oracle");
    }

    function test_Deployment_SecondaryRolesGranted() public view {
        assertTrue(reserve.hasRole(MINTER_ROLE, minter), "minter");
        assertTrue(reserve.hasRole(REDEEMER_ROLE, redeemer), "redeemer");
        assertTrue(reserve.hasRole(ORACLE_ROLE, oracle), "oracle");
        assertTrue(reserve.hasRole(COUNCIL_ROLE, council), "council");
        assertFalse(reserve.hasRole(MINTER_ROLE, nonAuthorized), "non-minter");
    }

    function test_Deployment_InitialBalancesAreZero() public view {
        assertEq(reserve.tier1Usd(), 0, "tier1");
        assertEq(reserve.tier2Usd(), 0, "tier2");
        assertEq(reserve.tier3Usd(), 0, "tier3");
        assertEq(reserve.totalReserveUsd(), 0, "total");
        assertEq(reserve.getReserveBalance(), 0, "balance");
        assertEq(reserve.lastAttestationTimestamp(), 0, "attestation ts");
        assertEq(reserve.lastPorHash(), bytes32(0), "por hash");
    }

    // ---- depositReserve ----

    function test_DepositReserve_RevertsWithoutMinterRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Reserve: unauthorized role"));
        reserve.depositReserve(100 ether, 1, bytes32(uint256(1)));
    }

    function test_DepositReserve_RevertsOnZeroAmount() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Reserve: zero deposit"));
        reserve.depositReserve(0, 1, bytes32(uint256(1)));
    }

    function test_DepositReserve_RevertsOnInvalidTier() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Reserve: invalid tier"));
        reserve.depositReserve(100 ether, 0, bytes32(uint256(1)));
    }

    function test_DepositReserve_RevertsOnZeroProof() public {
        vm.prank(minter);
        vm.expectRevert(bytes("Reserve: missing proof"));
        reserve.depositReserve(100 ether, 1, bytes32(0));
    }

    function test_DepositReserve_SucceedsTier1() public {
        uint256 amount = 1000 ether;
        bytes32 proof = bytes32(uint256(0xA1));
        vm.prank(minter);
        vm.expectEmit(true, true, true, true, address(reserve));
        emit Reserve.ReserveDeposited(minter, amount, uint8(1), proof);
        reserve.depositReserve(amount, 1, proof);

        assertEq(reserve.tier1Usd(), amount, "tier1");
        assertEq(reserve.tier2Usd(), 0, "tier2");
        assertEq(reserve.tier3Usd(), 0, "tier3");
        assertEq(reserve.totalReserveUsd(), amount, "total");
        assertEq(reserve.getReserveBalance(), amount, "balance");
    }

    function test_DepositReserve_SucceedsTier2() public {
        uint256 amount = 500 ether;
        vm.prank(minter);
        reserve.depositReserve(amount, 2, bytes32(uint256(0xA2)));
        assertEq(reserve.tier2Usd(), amount, "tier2");
        assertEq(reserve.tier1Usd(), 0, "tier1");
        assertEq(reserve.totalReserveUsd(), amount, "total");
    }

    function test_DepositReserve_SucceedsTier3() public {
        uint256 amount = 250 ether;
        vm.prank(minter);
        reserve.depositReserve(amount, 3, bytes32(uint256(0xA3)));
        assertEq(reserve.tier3Usd(), amount, "tier3");
        assertEq(reserve.tier1Usd(), 0, "tier1");
        assertEq(reserve.totalReserveUsd(), amount, "total");
    }

    // ---- withdrawReserve ----

    function test_WithdrawReserve_RevertsWithoutRedeemerRole() public {
        // Seed balance first.
        vm.prank(minter);
        reserve.depositReserve(1000 ether, 1, bytes32(uint256(1)));

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Reserve: unauthorized role"));
        reserve.withdrawReserve(100 ether, bytes32(uint256(2)));
    }

    function test_WithdrawReserve_RevertsOnZeroAmount() public {
        vm.prank(minter);
        reserve.depositReserve(1000 ether, 1, bytes32(uint256(1)));

        vm.prank(redeemer);
        vm.expectRevert(bytes("Reserve: zero withdrawal"));
        reserve.withdrawReserve(0, bytes32(uint256(2)));
    }

    function test_WithdrawReserve_RevertsOnZeroProof() public {
        vm.prank(minter);
        reserve.depositReserve(1000 ether, 1, bytes32(uint256(1)));

        vm.prank(redeemer);
        vm.expectRevert(bytes("Reserve: missing burn proof"));
        reserve.withdrawReserve(100 ether, bytes32(0));
    }

    function test_WithdrawReserve_RevertsOnInsufficientBalance() public {
        vm.prank(minter);
        reserve.depositReserve(100 ether, 1, bytes32(uint256(1)));

        vm.prank(redeemer);
        vm.expectRevert(bytes("Reserve: insufficient balance"));
        reserve.withdrawReserve(101 ether, bytes32(uint256(2)));
    }

    function test_WithdrawReserve_SucceedsAndUpdatesBalance() public {
        // Seed: 1000 in tier1, 500 in tier2, 500 in tier3 => total 2000.
        vm.startPrank(minter);
        reserve.depositReserve(1000 ether, 1, bytes32(uint256(0xD1)));
        reserve.depositReserve(500 ether, 2, bytes32(uint256(0xD2)));
        reserve.depositReserve(500 ether, 3, bytes32(uint256(0xD3)));
        vm.stopPrank();

        uint256 totalBefore = reserve.getReserveBalance();
        assertEq(totalBefore, 2000 ether, "seed total");

        // Withdraw 200 (10% of total) — pro-rata: 100 from tier1, 50 from tier2, 50 from tier3.
        uint256 withdrawAmount = 200 ether;
        bytes32 burnProof = bytes32(uint256(0xB1));

        vm.prank(redeemer);
        vm.expectEmit(true, true, true, true, address(reserve));
        emit Reserve.ReserveWithdrawn(redeemer, withdrawAmount, burnProof);
        reserve.withdrawReserve(withdrawAmount, burnProof);

        assertEq(reserve.tier1Usd(), 900 ether, "tier1 after");
        assertEq(reserve.tier2Usd(), 450 ether, "tier2 after");
        assertEq(reserve.tier3Usd(), 450 ether, "tier3 after");
        assertEq(reserve.totalReserveUsd(), 1800 ether, "total after");
        assertEq(reserve.getReserveBalance(), 1800 ether, "balance after");
    }

    // ---- attestReserves ----

    function test_AttestReserves_RevertsWithoutOracleRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Reserve: unauthorized role"));
        reserve.attestReserves(bytes32(uint256(1)));
    }

    function test_AttestReserve_RevertsOnZeroHash() public {
        vm.prank(oracle);
        vm.expectRevert(bytes("Reserve: missing PoR hash"));
        reserve.attestReserves(bytes32(0));
    }

    function test_AttestReserves_Succeeds() public {
        bytes32 porHash = keccak256("Q3-2026-AUDIT");
        vm.prank(oracle);
        vm.expectEmit(true, true, true, true, address(reserve));
        emit Reserve.ReserveAttested(0, porHash, uint64(block.timestamp));
        reserve.attestReserves(porHash);

        assertEq(reserve.lastPorHash(), porHash, "por hash");
        assertEq(reserve.lastAttestationTimestamp(), block.timestamp, "ts");
    }

    // ---- View functions ----

    function test_GetReserveBalance_ReturnsCorrectValue() public {
        assertEq(reserve.getReserveBalance(), 0);
        vm.prank(minter);
        reserve.depositReserve(750 ether, 1, bytes32(uint256(1)));
        assertEq(reserve.getReserveBalance(), 750 ether);
    }

    function test_GetTierComposition_ReturnsThreeTiers() public {
        vm.startPrank(minter);
        reserve.depositReserve(300 ether, 1, bytes32(uint256(0x11)));
        reserve.depositReserve(200 ether, 2, bytes32(uint256(0x22)));
        reserve.depositReserve(100 ether, 3, bytes32(uint256(0x33)));
        vm.stopPrank();

        (uint256 t1, uint256 t2, uint256 t3, uint256 total) = reserve.getTierComposition();
        assertEq(t1, 300 ether, "t1");
        assertEq(t2, 200 ether, "t2");
        assertEq(t3, 100 ether, "t3");
        assertEq(total, 600 ether, "total");
        // Conservation invariant: t1 + t2 + t3 == total
        assertEq(t1 + t2 + t3, total, "conservation");
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyCouncil() public {
        bytes32 NEW_ROLE = keccak256("AUDITOR_ROLE");

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Reserve: only Council"));
        reserve.grantRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        reserve.grantRole(NEW_ROLE, nonAuthorized);
        assertTrue(reserve.hasRole(NEW_ROLE, nonAuthorized));

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Reserve: only Council"));
        reserve.revokeRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        reserve.revokeRole(NEW_ROLE, nonAuthorized);
        assertFalse(reserve.hasRole(NEW_ROLE, nonAuthorized));
    }

    // ---- Fuzz tests ----

    function testFuzz_DepositReserve_Tier1(uint256 amount) public {
        amount = bound(amount, 1, 1e40);
        bytes32 proof = bytes32(uint256(0xF1));
        vm.prank(minter);
        reserve.depositReserve(amount, 1, proof);
        assertEq(reserve.tier1Usd(), amount, "tier1");
        assertEq(reserve.totalReserveUsd(), amount, "total");
        assertEq(reserve.getReserveBalance(), amount, "balance");
    }

    function testFuzz_DepositReserve_AllTiers(uint256 a1, uint256 a2, uint256 a3) public {
        a1 = bound(a1, 1, 1e36);
        a2 = bound(a2, 1, 1e36);
        a3 = bound(a3, 1, 1e36);

        vm.startPrank(minter);
        reserve.depositReserve(a1, 1, bytes32(uint256(0xF1)));
        reserve.depositReserve(a2, 2, bytes32(uint256(0xF2)));
        reserve.depositReserve(a3, 3, bytes32(uint256(0xF3)));
        vm.stopPrank();

        assertEq(reserve.tier1Usd(), a1, "tier1");
        assertEq(reserve.tier2Usd(), a2, "tier2");
        assertEq(reserve.tier3Usd(), a3, "tier3");
        assertEq(reserve.totalReserveUsd(), a1 + a2 + a3, "total");
    }

    function testFuzz_WithdrawReserve_ProRata(uint256 deposit, uint256 withdraw) public {
        // Single-tier deposit then withdraw — pro-rata means full amount from tier1.
        deposit = bound(deposit, 1, 1e36);
        withdraw = bound(withdraw, 1, deposit);

        vm.prank(minter);
        reserve.depositReserve(deposit, 1, bytes32(uint256(0xD1)));

        uint256 totalBefore = reserve.getReserveBalance();
        vm.prank(redeemer);
        reserve.withdrawReserve(withdraw, bytes32(uint256(0xB1)));

        assertEq(reserve.getReserveBalance(), totalBefore - withdraw, "balance after");
        assertEq(reserve.tier1Usd(), deposit - withdraw, "tier1 after");
        assertEq(reserve.tier2Usd(), 0, "tier2 unchanged");
        assertEq(reserve.tier3Usd(), 0, "tier3 unchanged");
    }

    function testFuzz_DepositReserve_RevertIfNotMinter(address notMinter, uint256 amount) public {
        vm.assume(notMinter != minter && notMinter != deployer);
        amount = bound(amount, 1, 1e36);
        vm.prank(notMinter);
        vm.expectRevert(bytes("Reserve: unauthorized role"));
        reserve.depositReserve(amount, 1, bytes32(uint256(1)));
    }

    function testFuzz_WithdrawReserve_RevertIfNotRedeemer(address notRedeemer, uint256 amount) public {
        vm.assume(notRedeemer != redeemer && notRedeemer != deployer);
        // Seed balance.
        vm.prank(minter);
        reserve.depositReserve(1_000_000 ether, 1, bytes32(uint256(1)));
        amount = bound(amount, 1, 1_000_000 ether);
        vm.prank(notRedeemer);
        vm.expectRevert(bytes("Reserve: unauthorized role"));
        reserve.withdrawReserve(amount, bytes32(uint256(2)));
    }
}
