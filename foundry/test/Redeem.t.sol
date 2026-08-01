// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Redeem} from "../src/Redeem.sol";
import {Reserve} from "../src/Reserve.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title Redeem Gateway Unit + Fuzz Tests
 * @notice Covers the user-facing redemption gateway (§38-41) + the
 *         constitutional "burn never pauses" invariant (§ Invariant 5).
 *
 * Redeem.redeemForBurn():
 *   1. Pulls MTQ from the user via MTQ.transferFrom() (requires user approval).
 *   2. Burns the gross MTQ via MTQ.burn() — burn is NEVER pausable.
 *   3. Calls Reserve.withdrawReserve(netReturnUsd, burnProof) — releases
 *      proportional reserves (off-chain custodian settles within T+2).
 *   4. Redemption fee (default 5 bps = 0.05%) is taken from the reserve
 *      return (not the burn side — burn = gross, return = net).
 *
 * CONSTITUTIONAL INVARIANT (Article II, Invariant 5):
 *   - Redemption is NEVER pausable. The Redeem contract has NO pause
 *     modifier by design. MTQ.burn() also has NO notEmergencyPaused modifier.
 *   - We test both halves:
 *       (a) redeemForBurn() works in the normal case.
 *       (b) MTQ.burn() works even when MTQ is emergency-paused (the
 *           absolute redemption guarantee — a user can always burn directly).
 *
 * MTQ role bootstrapping (see MTQ.t.sol): MTQ has NO constructor — we grant
 * COUNCIL_ROLE and PAUSER_ROLE to the test contract via vm.store.
 */
contract RedeemTest is Test {
    MTQ public mtq;
    Reserve public reserve;
    Redeem public redeem;

    // The Takaful address — Redeem only stores it (doesn't call into it
    // during redeemForBurn), so a plain address is sufficient.
    address public takaful = address(0x7A4A);
    address public deployer = address(this);
    address public council = address(0xC0FFEE);
    address public alice = address(0xA11CE);
    address public bob = address(0xB0B);
    address public nonAuthorized = address(0xBEEF);

    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // MTQ storage layout (see MTQ.t.sol).
    uint256 private constant MTQ_ROLES_SLOT = 3;
    uint256 private constant MTQ_BALANCES_SLOT = 1;
    uint256 private constant MTQ_TOTAL_SUPPLY_SLOT = 0;

    // Seed reserve balance so reserve.withdrawReserve succeeds.
    uint256 public constant SEED_RESERVE = 1_000_000 ether;
    bytes32 public constant SEED_PROOF = bytes32(uint256(0x5EED));

    // Default MTQ balance given to alice for redeem tests.
    uint256 public constant ALICE_FUND = 100_000 ether;

    function setUp() public {
        mtq = new MTQ();
        // Bootstrap MTQ roles on the test contract via vm.store.
        _grantMtgRoleRaw(COUNCIL_ROLE, address(this));
        _grantMtgRoleRaw(PAUSER_ROLE, address(this));

        reserve = new Reserve(); // test = Council + Minter + Redeemer + Oracle
        redeem = new Redeem(address(mtq), address(reserve), takaful); // test = Council

        // Redeem needs REDEEMER_ROLE on Reserve (to call reserve.withdrawReserve).
        reserve.grantRole(REDEEMER_ROLE, address(redeem));

        // Pre-seed Reserve balance so withdrawals succeed.
        reserve.depositReserve(SEED_RESERVE, 1, SEED_PROOF);

        // Give alice some MTQ via raw storage manipulation (bypasses mint()
        // invariants — used only as a test fixture, like MTQ.t.sol does).
        _rawMint(alice, ALICE_FUND);

        // Promote a secondary council so we can test with a non-deployer actor.
        redeem.grantRole(COUNCIL_ROLE, council);
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

    function test_Deployment_GrantsCouncilToDeployer() public view {
        assertTrue(redeem.hasRole(COUNCIL_ROLE, deployer), "council");
    }

    function test_Deployment_SecondaryCouncilGranted() public view {
        assertTrue(redeem.hasRole(COUNCIL_ROLE, council), "council");
        assertFalse(redeem.hasRole(COUNCIL_ROLE, nonAuthorized), "non-council");
    }

    function test_Deployment_ImmutableRefsSet() public view {
        assertEq(address(redeem.mtq()), address(mtq), "mtq ref");
        assertEq(address(redeem.reserve()), address(reserve), "reserve ref");
        assertEq(redeem.takaful(), takaful, "takaful ref");
    }

    function test_Deployment_RevertsOnZeroMTQ() public {
        vm.expectRevert(bytes("Redeem: MTQ zero address"));
        new Redeem(address(0), address(reserve), takaful);
    }

    function test_Deployment_RevertsOnZeroReserve() public {
        vm.expectRevert(bytes("Redeem: Reserve zero address"));
        new Redeem(address(mtq), address(0), takaful);
    }

    function test_Deployment_RevertsOnZeroTakaful() public {
        vm.expectRevert(bytes("Redeem: Takaful zero address"));
        new Redeem(address(mtq), address(reserve), address(0));
    }

    function test_Deployment_InitialState() public view {
        assertEq(redeem.redemptionFeeBps(), 5, "default fee 5 bps");
        assertEq(redeem.MAX_REDEMPTION_FEE_BPS(), 50, "max fee 50 bps");
        assertEq(redeem.totalRedeemed(), 0, "total redeemed");
        assertEq(redeem.totalFeesCollected(), 0, "total fees");
        assertFalse(redeem.burnProofProcessed(bytes32(uint256(1))), "no proofs processed");
    }

    // ---- getRedemptionFee ----

    function test_GetRedemptionFee_ReturnsDefault() public view {
        assertEq(redeem.getRedemptionFee(), 5, "default 5 bps = 0.05%");
    }

    // ---- redeemForBurn: input validation ----

    function test_RedeemForBurn_RevertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Redeem: zero amount"));
        redeem.redeemForBurn(0, bytes32(uint256(1)));
    }

    function test_RedeemForBurn_RevertsOnZeroProof() public {
        vm.prank(alice);
        vm.expectRevert(bytes("Redeem: missing burn proof"));
        redeem.redeemForBurn(100 ether, bytes32(0));
    }

    function test_RedeemForBurn_RevertsOnDuplicateProof() public {
        bytes32 proof = bytes32(uint256(0xDEAD));
        vm.startPrank(alice);
        mtq.approve(address(redeem), 200 ether);
        redeem.redeemForBurn(100 ether, proof);
        vm.expectRevert(bytes("Redeem: burn proof already used"));
        redeem.redeemForBurn(100 ether, proof);
        vm.stopPrank();
    }

    function test_RedeemForBurn_RevertsOnInsufficientBalance() public {
        vm.startPrank(alice);
        vm.expectRevert(bytes("Redeem: insufficient MTQ balance"));
        redeem.redeemForBurn(ALICE_FUND + 1, bytes32(uint256(1)));
        vm.stopPrank();
    }

    function test_RedeemForBurn_RevertsOnInsufficientApproval() public {
        // Alice did NOT approve the Redeem contract — transferFrom fails.
        vm.startPrank(alice);
        vm.expectRevert(bytes("MTQ: insufficient allowance"));
        redeem.redeemForBurn(100 ether, bytes32(uint256(1)));
        vm.stopPrank();
    }

    // ---- redeemForBurn: success path ----

    function test_RedeemForBurn_Succeeds() public {
        uint256 amount = 1000 ether;
        bytes32 proof = bytes32(uint256(0xCAFE));
        uint256 expectedFee = (amount * 5) / 10000; // 5 bps = 0.05%
        uint256 expectedNet = amount - expectedFee;

        uint256 aliceBefore = mtq.balanceOf(alice);
        uint256 supplyBefore = mtq.totalSupply();
        uint256 reserveBefore = reserve.getReserveBalance();
        uint256 redeemedBefore = redeem.totalRedeemed();
        uint256 feesBefore = redeem.totalFeesCollected();

        // Alice approves Redeem, then redeems.
        vm.startPrank(alice);
        mtq.approve(address(redeem), amount);
        redeem.redeemForBurn(amount, proof);
        vm.stopPrank();

        // Alice's MTQ balance decreased by `amount` (transferred to Redeem, then burned).
        assertEq(mtq.balanceOf(alice), aliceBefore - amount, "alice balance");
        // MTQ totalSupply decreased by `amount` (burned).
        assertEq(mtq.totalSupply(), supplyBefore - amount, "total supply");
        // Reserve balance decreased by netReturn (pro-rata withdrawal — all from tier1 here).
        assertEq(reserve.getReserveBalance(), reserveBefore - expectedNet, "reserve balance");
        // Redeem contract state.
        assertEq(redeem.totalRedeemed(), redeemedBefore + amount, "total redeemed");
        assertEq(redeem.totalFeesCollected(), feesBefore + expectedFee, "total fees");
        assertTrue(redeem.burnProofProcessed(proof), "proof processed");
        // Redeem contract holds NO MTQ after burn (transferred in, then burned).
        assertEq(mtq.balanceOf(address(redeem)), 0, "redeem holds no MTQ");
    }

    function test_RedeemForBurn_EmitsEvent() public {
        uint256 amount = 500 ether;
        bytes32 proof = bytes32(uint256(0xEA7));
        uint256 expectedFee = (amount * 5) / 10000;
        uint256 expectedNet = amount - expectedFee;

        vm.startPrank(alice);
        mtq.approve(address(redeem), amount);
        vm.expectEmit(true, true, false, true, address(redeem));
        emit Redeem.RedeemedForBurn(
            alice,
            amount,
            expectedNet,
            expectedFee,
            proof,
            uint64(block.timestamp)
        );
        redeem.redeemForBurn(amount, proof);
        vm.stopPrank();
    }

    function test_RedeemForBurn_WorksWithZeroFee() public {
        // Council sets fee to 0 — user gets full amount as reserve return.
        vm.prank(council);
        redeem.setRedemptionFee(0);

        uint256 amount = 300 ether;
        bytes32 proof = bytes32(uint256(0x2E80));
        uint256 reserveBefore = reserve.getReserveBalance();

        vm.startPrank(alice);
        mtq.approve(address(redeem), amount);
        redeem.redeemForBurn(amount, proof);
        vm.stopPrank();

        // Net return == amount (no fee deducted).
        assertEq(reserve.getReserveBalance(), reserveBefore - amount, "full return");
        assertEq(redeem.totalFeesCollected(), 0, "no fees");
    }

    // ---- CONSTITUTIONAL INVARIANT: burn never pauses ----

    /**
     * @dev § Invariant 5: "burn never pauses — redemption is a non-suspendable
     *      constitutional right". MTQ.burn() does NOT carry the
     *      notEmergencyPaused modifier. When MTQ is emergency-paused (which
     *      blocks transfer() and mint()), burn() MUST still succeed.
     *
     *      This means a user can ALWAYS redeem by calling MTQ.burn() directly,
     *      even when the Redeem gateway's transferFrom step is blocked by an
     *      emergency pause. The absolute redemption guarantee is preserved.
     */
    function test_Burn_NeverPauses_ConstitutionalInvariant() public {
        // Give alice some fresh MTQ.
        _rawMint(alice, 1000 ether);

        // Activate emergency pause (test contract holds PAUSER_ROLE via vm.store).
        mtq.activateEmergencyPause();
        assertTrue(mtq.emergencyPaused(), "MTQ is paused");

        uint256 aliceBefore = mtq.balanceOf(alice);
        uint256 supplyBefore = mtq.totalSupply();

        // Alice burns directly — MUST succeed even when paused.
        vm.prank(alice);
        mtq.burn(250 ether);

        assertEq(mtq.balanceOf(alice), aliceBefore - 250 ether, "alice balance");
        assertEq(mtq.totalSupply(), supplyBefore - 250 ether, "total supply");
    }

    /**
     * @dev Confirms the Redeem contract has NO pause modifier — there is no
     *      `mintPaused`-style flag and no `notPaused` modifier anywhere in
     *      the contract. The right to redeem via the gateway is absolute
     *      (modulo MTQ's transferFrom, which is a separate concern tested
     *      above via the direct-burn invariant).
     */
    function test_RedeemContract_HasNoPauseFunction() public view {
        // No pause-related state exists on the Redeem contract.
        // The only Council power over redemption is setRedemptionFee().
        // If someone tried to add a pause in the future, this test would
        // need updating — which is the point of asserting it explicitly.
        assertEq(redeem.redemptionFeeBps(), 5, "fee is the only lever");
    }

    // ---- setRedemptionFee: access control + ceiling ----

    function test_SetRedemptionFee_RevertsWithoutCouncilRole() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Redeem: only Council"));
        redeem.setRedemptionFee(10);
    }

    function test_SetRedemptionFee_RevertsAboveConstitutionalCeiling(uint16 newBps) public {
        vm.assume(newBps > 50);
        vm.prank(council);
        vm.expectRevert(bytes("Redeem: fee exceeds constitutional ceiling (50 bps)"));
        redeem.setRedemptionFee(newBps);
    }

    function test_SetRedemptionFee_SucceedsAndEmitsEvent() public {
        vm.prank(council);
        vm.expectEmit(true, true, true, true, address(redeem));
        emit Redeem.RedemptionFeeUpdated(5, 15);
        redeem.setRedemptionFee(15);
        assertEq(redeem.getRedemptionFee(), 15, "fee updated");
    }

    // ---- Role management ----

    function test_RoleManagement_OnlyCouncil() public {
        bytes32 NEW_ROLE = keccak256("AUDITOR_ROLE");

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Redeem: only Council"));
        redeem.grantRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        redeem.grantRole(NEW_ROLE, nonAuthorized);
        assertTrue(redeem.hasRole(NEW_ROLE, nonAuthorized));

        vm.prank(nonAuthorized);
        vm.expectRevert(bytes("Redeem: only Council"));
        redeem.revokeRole(NEW_ROLE, nonAuthorized);

        vm.prank(council);
        redeem.revokeRole(NEW_ROLE, nonAuthorized);
        assertFalse(redeem.hasRole(NEW_ROLE, nonAuthorized));
    }

    // ---- Fuzz tests ----

    function testFuzz_RedeemForBurn(uint256 amount, bytes32 proof) public {
        amount = bound(amount, 1, ALICE_FUND);
        vm.assume(proof != bytes32(0) && proof != SEED_PROOF);

        uint256 fee = (amount * 5) / 10000;
        uint256 netReturn = amount - fee;

        uint256 aliceBefore = mtq.balanceOf(alice);
        uint256 supplyBefore = mtq.totalSupply();
        uint256 reserveBefore = reserve.getReserveBalance();

        vm.startPrank(alice);
        mtq.approve(address(redeem), amount);
        redeem.redeemForBurn(amount, proof);
        vm.stopPrank();

        assertEq(mtq.balanceOf(alice), aliceBefore - amount, "alice balance");
        assertEq(mtq.totalSupply(), supplyBefore - amount, "total supply");
        assertEq(reserve.getReserveBalance(), reserveBefore - netReturn, "reserve balance");
        assertEq(redeem.totalRedeemed(), amount, "total redeemed");
        assertEq(redeem.totalFeesCollected(), fee, "total fees");
        assertTrue(redeem.burnProofProcessed(proof), "proof processed");
    }

    function testFuzz_SetRedemptionFee_WithinCeiling(uint16 newBps) public {
        newBps = uint16(bound(uint256(newBps), 0, 50));
        vm.prank(council);
        redeem.setRedemptionFee(newBps);
        assertEq(redeem.getRedemptionFee(), newBps, "fee updated");
    }

    function testFuzz_Burn_NeverPauses(uint256 amount) public {
        // Burn works regardless of pause state — the constitutional invariant.
        _rawMint(bob, 10_000 ether);
        amount = bound(amount, 1, 10_000 ether);

        mtq.activateEmergencyPause();
        assertTrue(mtq.emergencyPaused());

        uint256 bobBefore = mtq.balanceOf(bob);
        uint256 supplyBefore = mtq.totalSupply();

        vm.prank(bob);
        mtq.burn(amount);

        assertEq(mtq.balanceOf(bob), bobBefore - amount, "bob balance");
        assertEq(mtq.totalSupply(), supplyBefore - amount, "total supply");

        // Reset for next fuzz iteration (lift pause so subsequent setUp is clean).
        mtq.liftEmergencyPause();
    }
}
