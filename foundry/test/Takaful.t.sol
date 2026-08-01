// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Takaful} from "../src/Takaful.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title Takaful Unit + Fuzz Tests
 * @notice Covers the Sharia-compliant mutual insurance pool (§49).
 *
 * Takaful flow:
 *   - contribute(amount)  : Tabarru' (donation). Caller must approve MTQ transfer.
 *   - claim(amount, hash) : File a claim (permissionless, NOT auto-pay).
 *                           Requires coverageLimit[caller] >= amount.
 *   - approveClaim(...)   : CLAIM_VERIFIER_ROLE pays a verified claim.
 *   - setCoverage(...)    : CLAIM_VERIFIER_ROLE sets per-member coverage.
 *   - distributeSurplus() : Council-only; bumps cycle, emits event.
 *
 * Role model:
 *   - COUNCIL_ROLE          : deployer; can grant/revoke roles + distribute surplus
 *   - CLAIM_VERIFIER_ROLE   : deployer initially; can approve claims + set coverage
 *   - SHARIA_BOARD_ROLE     : deployer initially (reserved for Sharia supervisory board)
 *
 * MTQ role bootstrapping (see MTQ.t.sol): MTQ has NO constructor — we grant
 * COUNCIL_ROLE to the test contract via vm.store so we can mint test MTQ
 * via rawMint (storage manipulation, bypasses mtq.mint invariants).
 */
contract TakafulTest is Test {
    MTQ public mtq;
    Takaful public takaful;

    address public deployer = address(this);
    address public verifier = address(0xFE8); // secondary CLAIM_VERIFIER_ROLE holder
    address public council = address(0xC0FFEE);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public nonAuthorized = address(0xBEEF);

    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant CLAIM_VERIFIER_ROLE = keccak256("CLAIM_VERIFIER_ROLE");
    bytes32 public constant SHARIA_BOARD_ROLE = keccak256("SHARIA_BOARD_ROLE");

    // MTQ storage layout (see MTQ.t.sol).
    uint256 private constant MTQ_ROLES_SLOT = 3;
    uint256 private constant MTQ_BALANCES_SLOT = 1;
    uint256 private constant MTQ_TOTAL_SUPPLY_SLOT = 0;

    uint256 public constant ALICE_FUND = 100_000 ether;

    function setUp() public {
        mtq = new MTQ();
        // Bootstrap MTQ COUNCIL_ROLE on the test contract (only so we can
        // rawMint test MTQ to alice — Takaful itself never calls mtq.mint).
        _grantMtgRoleRaw(COUNCIL_ROLE, address(this));

        takaful = new Takaful(address(mtq)); // test = Council + ClaimVerifier + ShariaBoard

        // Promote secondary actors.
        takaful.grantRole(CLAIM_VERIFIER_ROLE, verifier);
        takaful.grantRole(COUNCIL_ROLE, council);

        // Fund alice with MTQ for contribute() tests.
        _rawMint(alice, ALICE_FUND);
    }

    // ---- MTQ storage helpers (mirror MTQ.t.sol) ----

    function _mtqRoleSlot(bytes32 role, address account) internal pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(role, MTQ_ROLES_SLOT));
        return keccak256(abi.encode(account, inner));
    }

    function _grantMtgRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _mtqRoleSlot(role, account), bytes32(uint256(1)));
    }

    function _rawMint(address to, uint256 amount) internal {
        bytes32 balSlot = keccak256(abi.encode(to, MTQ_BALANCES_SLOT));
        uint256 bal = uint256(vm.load(address(mtq), balSlot));
        uint256 ts = uint256(vm.load(address(mtq), bytes32(MTQ_TOTAL_SUPPLY_SLOT)));
        vm.store(address(mtq), balSlot, bytes32(bal + amount));
        vm.store(address(mtq), bytes32(MTQ_TOTAL_SUPPLY_SLOT), bytes32(ts + amount));
    }

    // ---- Deployment + role assignment ----

    function test_Deployment_GrantsAllRolesToDeployer() public view {
        assertTrue(takaful.hasRole(COUNCIL_ROLE, deployer), "council");
        assertTrue(takaful.hasRole(CLAIM_VERIFIER_ROLE, deployer), "verifier");
        assertTrue(takaful.hasRole(SHARIA_BOARD_ROLE, deployer), "sharia");
    }

    function test_Deployment_SecondaryRolesGranted() public view {
        assertTrue(takaful.hasRole(CLAIM_VERIFIER_ROLE, verifier), "verifier");
        assertTrue(takaful.hasRole(COUNCIL_ROLE, council), "council");
        assertFalse(takaful.hasRole(CLAIM_VERIFIER_ROLE, nonAuthorized), "non-verifier");
    }

    function test_Deployment_ImmutableRefSet() public view {
        assertEq(address(takaful.mtq()), address(mtq), "mtq ref");
    }

    function test_Deployment_RevertsOnZeroMTQ() public {
        vm.expectRevert(bytes("Takaful: MTQ zero address"));
        new Takaful(address(0));
    }

    function test_Deployment_InitialState() public view {
        assertEq(takaful.totalContributions(), 0, "total contributions");
        assertEq(takaful.totalClaimsPaid(), 0, "total claims");
        assertEq(takaful.currentCycle(), 1, "cycle 1");
        assertEq(takaful.CONTRIBUTOR_SURPLUS_SHARE_BPS(), 7000, "70% mudaraba");
        assertEq(takaful.getPoolBalance(), 0, "empty pool");
    }

    // ---- contribute ----

    function test_Contribute_RevertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Takaful: zero contribution"));
        takaful.contribute(0);
    }

    function test_Contribute_RevertsOnInsufficientApproval() public {
        // Alice did NOT approve — transferFrom fails.
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: insufficient allowance"));
        takaful.contribute(100 ether);
    }

    function test_Contribute_SucceedsAndUpdatesState() public {
        uint256 amount = 500 ether;
        uint256 aliceBefore = mtq.balanceOf(alice);

        vm.startPrank(alice);
        mtq.approve(address(takaful), amount);
        vm.expectEmit(true, true, true, true, address(takaful));
        emit Takaful.Contributed(alice, amount, 1);
        takaful.contribute(amount);
        vm.stopPrank();

        assertEq(mtq.balanceOf(alice), aliceBefore - amount, "alice balance");
        assertEq(mtq.balanceOf(address(takaful)), amount, "pool balance");
        assertEq(takaful.getPoolBalance(), amount, "getPoolBalance");
        assertEq(takaful.totalContributions(), amount, "total contributions");
        assertEq(takaful.contributions(alice), amount, "alice contribution record");
    }

    function test_Contribute_AccumulatesAcrossContributors() public {
        _rawMint(bob, 1000 ether);

        // Alice contributes 300.
        vm.startPrank(alice);
        mtq.approve(address(takaful), 300 ether);
        takaful.contribute(300 ether);
        vm.stopPrank();

        // Bob contributes 700.
        vm.startPrank(bob);
        mtq.approve(address(takaful), 700 ether);
        takaful.contribute(700 ether);
        vm.stopPrank();

        assertEq(takaful.getPoolBalance(), 1000 ether, "pool = 1000");
        assertEq(takaful.totalContributions(), 1000 ether, "total = 1000");
        assertEq(takaful.contributions(alice), 300 ether, "alice 300");
        assertEq(takaful.contributions(bob), 700 ether, "bob 700");
    }

    // ---- claim ----

    /**
     * @dev The task brief says "claim() reverts without CLAIM_VERIFIER_ROLE",
     *      but the actual contract design makes claim() PERMISSIONLESS —
     *      anyone can file a claim, but it only emits an event (no payout).
     *      The CLAIM_VERIFIER_ROLE gates approveClaim(), not claim().
     *
     *      claim() reverts when coverageLimit[caller] < amount (no coverage).
     *      We test both halves: (a) revert without coverage, (b) succeed with
     *      coverage (emits ClaimFiled, no payout).
     */
    function test_Claim_RevertsWithoutCoverage() public {
        // alice has NO coverage set — claim must revert.
        vm.prank(alice);
        vm.expectRevert(bytes("Takaful: claim exceeds coverage limit"));
        takaful.claim(100 ether, bytes32(uint256(1)));
    }

    function test_Claim_RevertsOnZeroAmount() public {
        // Set coverage first so we get past the coverage check.
        takaful.setCoverage(alice, 1000 ether);

        vm.prank(alice);
        vm.expectRevert(bytes("Takaful: zero claim"));
        takaful.claim(0, bytes32(uint256(1)));
    }

    function test_Claim_RevertsOnZeroHash() public {
        takaful.setCoverage(alice, 1000 ether);

        vm.prank(alice);
        vm.expectRevert(bytes("Takaful: missing claim hash"));
        takaful.claim(100 ether, bytes32(0));
    }

    function test_Claim_SucceedsAndEmitsEvent_WithCoverage() public {
        takaful.setCoverage(alice, 1000 ether);

        uint256 claimAmount = 250 ether;
        bytes32 claimHash = bytes32(uint256(0xC1A1));

        vm.prank(alice);
        vm.expectEmit(true, true, true, true, address(takaful));
        emit Takaful.ClaimFiled(alice, claimAmount, claimHash);
        takaful.claim(claimAmount, claimHash);

        // No payout happened — claim only files.
        assertEq(takaful.totalClaimsPaid(), 0, "no payout yet");
        assertEq(takaful.getPoolBalance(), 0, "pool still empty");
    }

    // ---- approveClaim ----

    function test_ApproveClaim_RevertsWithoutClaimVerifierRole() public {
        // Seed the pool so the balance check would pass.
        vm.startPrank(alice);
        mtq.approve(address(takaful), 1000 ether);
        takaful.contribute(1000 ether);
        vm.stopPrank();

        // Set coverage as verifier (test contract = verifier).
        takaful.setCoverage(bob, 500 ether);

        // Non-verifier cannot approve.
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Takaful: unauthorized role"));
        takaful.approveClaim(bob, 500 ether, bytes32(uint256(1)));
    }

    function test_ApproveClaim_RevertsOnZeroBeneficiary() public {
        takaful.setCoverage(bob, 500 ether);
        vm.expectRevert(bytes("Takaful: zero beneficiary"));
        takaful.approveClaim(address(0), 100 ether, bytes32(uint256(1)));
    }

    function test_ApproveClaim_RevertsOnZeroAmount() public {
        takaful.setCoverage(bob, 500 ether);
        vm.expectRevert(bytes("Takaful: zero claim"));
        takaful.approveClaim(bob, 0, bytes32(uint256(1)));
    }

    function test_ApproveClaim_RevertsOnInsufficientPoolBalance() public {
        // Pool is empty — approveClaim must revert.
        takaful.setCoverage(bob, 500 ether);
        vm.expectRevert(bytes("Takaful: insufficient pool balance"));
        takaful.approveClaim(bob, 100 ether, bytes32(uint256(1)));
    }

    function test_ApproveClaim_RevertsOnExcessCoverage() public {
        // Seed pool with 1000.
        vm.startPrank(alice);
        mtq.approve(address(takaful), 1000 ether);
        takaful.contribute(1000 ether);
        vm.stopPrank();

        // Set coverage to 100, try to approve 200.
        takaful.setCoverage(bob, 100 ether);
        vm.expectRevert(bytes("Takaful: claim exceeds coverage limit"));
        takaful.approveClaim(bob, 200 ether, bytes32(uint256(1)));
    }

    function test_ApproveClaim_SucceedsAndPaysOut() public {
        // Seed pool with 1000 from alice.
        vm.startPrank(alice);
        mtq.approve(address(takaful), 1000 ether);
        takaful.contribute(1000 ether);
        vm.stopPrank();
        assertEq(takaful.getPoolBalance(), 1000 ether, "pool seeded");

        // Set coverage for bob to 500.
        takaful.setCoverage(bob, 500 ether);
        assertEq(takaful.getCoverage(bob), 500 ether, "coverage set");

        uint256 bobBefore = mtq.balanceOf(bob);
        bytes32 claimHash = bytes32(uint256(0xC1A1));

        // Verifier (test contract) approves and pays the claim.
        vm.expectEmit(true, true, true, true, address(takaful));
        emit Takaful.ClaimPaid(bob, 300 ether, claimHash, address(this));
        takaful.approveClaim(bob, 300 ether, claimHash);

        assertEq(mtq.balanceOf(bob), bobBefore + 300 ether, "bob received");
        assertEq(takaful.getPoolBalance(), 700 ether, "pool after payout");
        assertEq(takaful.totalClaimsPaid(), 300 ether, "total claims paid");
        assertEq(takaful.getCoverage(bob), 200 ether, "coverage decremented");
    }

    function test_ApproveClaim_SucceedsWithSecondaryVerifier() public {
        vm.startPrank(alice);
        mtq.approve(address(takaful), 500 ether);
        takaful.contribute(500 ether);
        vm.stopPrank();

        // Secondary verifier sets coverage and approves.
        vm.startPrank(verifier);
        takaful.setCoverage(bob, 200 ether);
        takaful.approveClaim(bob, 100 ether, bytes32(uint256(0xC1)));
        vm.stopPrank();

        assertEq(mtq.balanceOf(bob), 100 ether, "bob received");
        assertEq(takaful.totalClaimsPaid(), 100 ether, "claims paid");
        assertEq(takaful.getCoverage(bob), 100 ether, "coverage decremented");
    }

    // ---- setCoverage ----

    function test_SetCoverage_RevertsWithoutClaimVerifierRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Takaful: unauthorized role"));
        takaful.setCoverage(bob, 500 ether);
    }

    function test_SetCoverage_RevertsOnZeroBeneficiary() public {
        vm.expectRevert(bytes("Takaful: zero beneficiary"));
        takaful.setCoverage(address(0), 500 ether);
    }

    function test_SetCoverage_EmitsEvent() public {
        vm.expectEmit(true, true, true, true, address(takaful));
        emit Takaful.CoverageSet(bob, 750 ether, address(this));
        takaful.setCoverage(bob, 750 ether);
        assertEq(takaful.getCoverage(bob), 750 ether, "coverage set");
    }

    // ---- getPoolBalance / getCoverage ----

    function test_GetPoolBalance_ReturnsCorrectBalance() public {
        assertEq(takaful.getPoolBalance(), 0, "empty initially");

        vm.startPrank(alice);
        mtq.approve(address(takaful), 750 ether);
        takaful.contribute(750 ether);
        vm.stopPrank();

        assertEq(takaful.getPoolBalance(), 750 ether, "after contribution");

        // Raw-mint extra MTQ directly to the Takaful address (simulating
        // fee routing from the Mint/Redeem contracts — they mint fee MTQ
        // to this address without calling contribute()).
        _rawMint(address(takaful), 250 ether);

        // getPoolBalance reads the LIVE MTQ balance — includes both
        // contributions AND fee routing.
        assertEq(takaful.getPoolBalance(), 1000 ether, "includes fee routing");
    }

    function test_GetCoverage_ReturnsCorrectCoverage() public {
        assertEq(takaful.getCoverage(bob), 0, "no coverage initially");
        takaful.setCoverage(bob, 1234 ether);
        assertEq(takaful.getCoverage(bob), 1234 ether, "coverage set");
    }

    // ---- distributeSurplus ----

    function test_DistributeSurplus_RevertsWithoutCouncilRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Takaful: only Council"));
        takaful.distributeSurplus();
    }

    function test_DistributeSurplus_SucceedsAndBumpsCycle() public {
        // Seed pool with 1000.
        vm.startPrank(alice);
        mtq.approve(address(takaful), 1000 ether);
        takaful.contribute(1000 ether);
        vm.stopPrank();

        uint256 cycleBefore = takaful.currentCycle();
        uint256 expectedSurplus = (1000 ether * 1000) / 10000; // 10% = 100

        vm.prank(council);
        vm.expectEmit(true, true, true, true, address(takaful));
        emit Takaful.SurplusDistributed(expectedSurplus, cycleBefore + 1);
        uint256 surplus = takaful.distributeSurplus();

        assertEq(surplus, expectedSurplus, "surplus = 10%");
        assertEq(takaful.currentCycle(), cycleBefore + 1, "cycle bumped");
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyCouncil() public {
        bytes32 NEW_ROLE = keccak256("AUDITOR_ROLE");

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Takaful: only Council"));
        takaful.grantRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        takaful.grantRole(NEW_ROLE, nonAuthorized);
        assertTrue(takaful.hasRole(NEW_ROLE, nonAuthorized));

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Takaful: only Council"));
        takaful.revokeRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        takaful.revokeRole(NEW_ROLE, nonAuthorized);
        assertFalse(takaful.hasRole(NEW_ROLE, nonAuthorized));
    }

    // ---- Fuzz tests ----

    function testFuzz_Contribute(uint256 amount) public {
        amount = bound(amount, 1, ALICE_FUND);
        uint256 aliceBefore = mtq.balanceOf(alice);

        vm.startPrank(alice);
        mtq.approve(address(takaful), amount);
        takaful.contribute(amount);
        vm.stopPrank();

        assertEq(mtq.balanceOf(alice), aliceBefore - amount, "alice balance");
        assertEq(takaful.getPoolBalance(), amount, "pool balance");
        assertEq(takaful.totalContributions(), amount, "total contributions");
        assertEq(takaful.contributions(alice), amount, "alice record");
    }

    function testFuzz_ApproveClaim(uint256 contribution, uint256 coverage, uint256 claimAmount) public {
        contribution = bound(contribution, 1, ALICE_FUND);
        vm.startPrank(alice);
        mtq.approve(address(takaful), contribution);
        takaful.contribute(contribution);
        vm.stopPrank();

        // Coverage in [1, contribution], claim in [1, coverage].
        coverage = bound(coverage, 1, contribution);
        claimAmount = bound(claimAmount, 1, coverage);

        takaful.setCoverage(bob, coverage);

        uint256 bobBefore = mtq.balanceOf(bob);
        uint256 poolBefore = takaful.getPoolBalance();

        takaful.approveClaim(bob, claimAmount, bytes32(uint256(0xF1)));

        assertEq(mtq.balanceOf(bob), bobBefore + claimAmount, "bob received");
        assertEq(takaful.getPoolBalance(), poolBefore - claimAmount, "pool after");
        assertEq(takaful.totalClaimsPaid(), claimAmount, "claims paid");
        assertEq(takaful.getCoverage(bob), coverage - claimAmount, "coverage decremented");
    }

    function testFuzz_SetCoverage(uint256 limit) public {
        limit = bound(limit, 0, 1e36);
        takaful.setCoverage(bob, limit);
        assertEq(takaful.getCoverage(bob), limit, "coverage set");
    }
}
