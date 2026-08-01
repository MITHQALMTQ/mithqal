// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title MTQ Unit + Fuzz Tests
 * @notice Covers §38 audit-required fuzz coverage for the MTQ settlement token.
 *
 * Implementation notes (read before modifying):
 *   - MTQ.sol has NO constructor — totalSupply starts at 0 and NO role is
 *     granted at deploy. Furthermore, grantRole() is gated by onlyCouncil,
 *     and COUNCIL_ROLE itself is ungrantable through the public API.
 *     This is a deployment-bootstrapping gap in the deployed contract.
 *     Per the task brief ("FIX THE TEST, not the contract"), we set roles
 *     directly in storage via vm.store using the known layout:
 *       slot 0: _totalSupply
 *       slot 1: _balances (mapping)
 *       slot 2: _allowances (mapping)
 *       slot 3: _roles (mapping(bytes32 => mapping(address => bool)))
 *     _roles[role][account] storage slot =
 *       keccak256(abi.encode(account, keccak256(abi.encode(role, 3))))
 *
 *   - MTQ.burn(uint256 amount) does NOT carry the `notEmergencyPaused` modifier.
 *     This is the correct constitutional behavior: redemption (burn) is a
 *     non-suspendable right per § Invariant 5. The emergency pause applies
 *     ONLY to minting and transfers, never to burning. We test both halves:
 *       (a) burn succeeds even when emergencyPaused == true
 *       (b) mint and transfer revert when emergencyPaused == true
 *
 *   - mint() takes 4 args (to, amount, reserveDepositedUsd, depositProof),
 *     not 1 as the brief suggests. Fuzz tests use the actual signature.
 */
contract MTQTest is Test {
    MTQ public mtq;

    // Test actors
    address public deployer = address(this);
    address public minter = address(0xA11CE);
    address public pauser = address(0xBA5E);
    address public council = address(0xC0FFEE);
    address public alice = address(0xA);
    address public bob = address(0xB);
    address public carol = address(0xC);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    // Storage slot of _roles mapping in MTQ (see layout comment above).
    uint256 private constant ROLES_SLOT = 3;
    uint256 private constant BALANCES_SLOT = 1;
    uint256 private constant TOTAL_SUPPLY_SLOT = 0;

    function setUp() public {
        mtq = new MTQ();
        // Bootstrap roles by writing directly to storage (no constructor grants them).
        _grantRoleRaw(MINTER_ROLE, minter);
        _grantRoleRaw(MINTER_ROLE, council); // Council can also mint for self-test
        _grantRoleRaw(PAUSER_ROLE, pauser);
        _grantRoleRaw(COUNCIL_ROLE, council);
        _grantRoleRaw(COUNCIL_ROLE, address(this)); // test contract acts as council
    }

    // ---- Storage + address helpers ----

    /// @notice Bound an address to the range [1, type(uint160).max] (non-zero).
    function _boundAddr(address a) internal pure returns (address) {
        return address(uint160(bound(uint256(uint160(a)), 1, type(uint160).max)));
    }

    function _roleSlot(bytes32 role, address account) internal pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(role, ROLES_SLOT));
        return keccak256(abi.encode(account, inner));
    }

    function _grantRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _roleSlot(role, account), bytes32(uint256(1)));
    }

    function _revokeRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _roleSlot(role, account), bytes32(uint256(0)));
    }

    function _balanceSlot(address account) internal pure returns (bytes32) {
        return keccak256(abi.encode(account, BALANCES_SLOT));
    }

    /// @notice Mint tokens directly into an account by manipulating storage.
    ///         Used to set up transfer test fixtures without going through mint().
    function _rawMint(address to, uint256 amount) internal {
        bytes32 balSlot = _balanceSlot(to);
        uint256 bal = uint256(vm.load(address(mtq), balSlot));
        uint256 ts = uint256(vm.load(address(mtq), bytes32(TOTAL_SUPPLY_SLOT)));
        vm.store(address(mtq), balSlot, bytes32(bal + amount));
        vm.store(address(mtq), bytes32(TOTAL_SUPPLY_SLOT), bytes32(ts + amount));
        // Also bump reserveValueUsd proportionally so ratio stays at 100%
        // (not strictly required for transfer tests, but keeps state consistent).
        // reserveValueUsd is at slot 5; we leave it untouched here.
    }

    // ---- Metadata ----

    function test_Metadata() public view {
        // Contract reports the full name (brief asks for "MITHQAL" — actual is full).
        assertEq(mtq.name(), "Mithqal Settlement Token");
        assertEq(mtq.symbol(), "MTQ");
        assertEq(mtq.decimals(), 18);
    }

    // ---- Initial supply ----
    //
    // The brief expects "totalSupply > 0 (110 MTQ minted at deploy)". The
    // deployed MTQ contract has no constructor and mints nothing at deploy,
    // so totalSupply == 0. Per instructions, we test the contract's actual
    // behavior.

    function test_InitialSupply() public view {
        assertEq(mtq.totalSupply(), 0);
    }

    // ---- Mint (fuzz) ----

    function testFuzz_Mint(address to, uint256 amount, uint256 reserveDepositedUsd, bytes32 depositProof)
        public
    {
        // Bound inputs to satisfy the contract's preconditions.
        // Cap at 1e40 to avoid overflow in getReserveRatio():
        //   (reserveValueUsd * 1e18 * 10000) must not overflow uint256.
        to = _boundAddr(to); // not zero
        amount = bound(amount, 1, 1e40);
        reserveDepositedUsd = bound(reserveDepositedUsd, amount, 1e40);
        // Force depositProof non-zero.
        if (depositProof == bytes32(0)) depositProof = bytes32(uint256(1));

        uint256 supplyBefore = mtq.totalSupply();
        uint256 balBefore = mtq.balanceOf(to);
        uint256 reserveBefore = mtq.reserveValueUsd();

        vm.prank(minter);
        mtq.mint(to, amount, reserveDepositedUsd, depositProof);

        assertEq(mtq.totalSupply(), supplyBefore + amount, "supply");
        assertEq(mtq.balanceOf(to), balBefore + amount, "balance");
        assertEq(mtq.reserveValueUsd(), reserveBefore + reserveDepositedUsd, "reserve");
    }

    function testFuzz_Mint_RevertIfNotMinter(address notMinter, address to, uint256 amount) public {
        // Exclude ALL MINTER_ROLE holders (minter + council, granted in setUp).
        notMinter = _boundAddr(notMinter);
        vm.assume(notMinter != minter && notMinter != council);
        to = _boundAddr(to);
        amount = bound(amount, 1, 1e40);
        vm.prank(notMinter);
        vm.expectRevert(bytes("MTQ: unauthorized role"));
        mtq.mint(to, amount, amount, bytes32(uint256(1)));
    }

    function testFuzz_Mint_RevertIfZeroAmount(address to, uint256 reserveDepositedUsd) public {
        to = _boundAddr(to);
        reserveDepositedUsd = bound(reserveDepositedUsd, 1, 1e40);
        vm.prank(minter);
        vm.expectRevert(bytes("MTQ: zero mint"));
        mtq.mint(to, 0, reserveDepositedUsd, bytes32(uint256(1)));
    }

    function testFuzz_Mint_RevertIfInsufficientDeposit(address to, uint256 amount, uint256 reserveDepositedUsd)
        public
    {
        to = _boundAddr(to);
        amount = bound(amount, 2, 1e40);
        reserveDepositedUsd = bound(reserveDepositedUsd, 0, amount - 1);
        vm.prank(minter);
        vm.expectRevert(bytes("MTQ: insufficient deposit"));
        mtq.mint(to, amount, reserveDepositedUsd, bytes32(uint256(1)));
    }

    function testFuzz_Mint_RevertIfZeroDepositProof(address to, uint256 amount, uint256 reserveDepositedUsd)
        public
    {
        to = _boundAddr(to);
        amount = bound(amount, 1, 1e40);
        reserveDepositedUsd = bound(reserveDepositedUsd, amount, 1e40);
        vm.prank(minter);
        vm.expectRevert(bytes("MTQ: missing deposit proof"));
        mtq.mint(to, amount, reserveDepositedUsd, bytes32(0));
    }

    function testFuzz_Mint_RevertIfEmergencyPaused(address to, uint256 amount) public {
        to = _boundAddr(to);
        amount = bound(amount, 1, 1e40);
        // Pause.
        vm.prank(pauser);
        mtq.activateEmergencyPause();
        // Now mint should revert.
        vm.prank(minter);
        vm.expectRevert(bytes("MTQ: emergency paused"));
        mtq.mint(to, amount, amount, bytes32(uint256(1)));
    }

    // ---- Transfer (fuzz) ----

    function testFuzz_Transfer(address to, uint256 amount) public {
        to = _boundAddr(to);
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 0, fund);

        uint256 aliceBefore = mtq.balanceOf(alice);
        uint256 toBefore = mtq.balanceOf(to);

        vm.prank(alice);
        mtq.transfer(to, amount);

        // Self-transfer is a no-op (balance unchanged).
        if (to == alice) {
            assertEq(mtq.balanceOf(alice), aliceBefore, "self-transfer");
        } else {
            assertEq(mtq.balanceOf(alice), aliceBefore - amount, "sender bal");
            assertEq(mtq.balanceOf(to), toBefore + amount, "receiver bal");
        }
    }

    function testFuzz_Transfer_RevertIfInsufficientBalance(address to, uint256 amount) public {
        to = _boundAddr(to);
        uint256 fund = 100 ether;
        _rawMint(alice, fund);
        amount = bound(amount, fund + 1, type(uint256).max);

        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: insufficient balance"));
        mtq.transfer(to, amount);
    }

    function testFuzz_Transfer_RevertIfPaused(address to, uint256 amount) public {
        to = _boundAddr(to);
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 0, fund);

        vm.prank(pauser);
        mtq.activateEmergencyPause();

        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: emergency paused"));
        mtq.transfer(to, amount);
    }

    // ---- Burn (fuzz) ----
    //
    // Note: MTQ.burn() does NOT carry the `notEmergencyPaused` modifier — this
    // is the correct constitutional behavior. Redemption is a non-suspendable
    // right per § Invariant 5: burn ALWAYS works, even when emergencyPaused.
    // See testFuzz_Burn_WorksWhenPaused below for the paused-state assertion.

    function testFuzz_Burn(uint256 amount) public {
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 1, fund);

        uint256 supplyBefore = mtq.totalSupply();
        uint256 balBefore = mtq.balanceOf(alice);
        uint256 reserveBefore = mtq.reserveValueUsd();

        vm.prank(alice);
        mtq.burn(amount);

        assertEq(mtq.totalSupply(), supplyBefore - amount, "supply");
        assertEq(mtq.balanceOf(alice), balBefore - amount, "balance");
        // reserveValueUsd may stay 0 here since we minted via storage (not mint())
        // — only check it does not increase.
        assertLe(mtq.reserveValueUsd(), reserveBefore, "reserve not increase");
    }

    function testFuzz_Burn_RevertIfZero() public {
        _rawMint(alice, 100 ether);
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: zero burn"));
        mtq.burn(0);
    }

    function testFuzz_Burn_RevertIfInsufficientBalance(uint256 amount) public {
        uint256 fund = 100 ether;
        _rawMint(alice, fund);
        amount = bound(amount, fund + 1, type(uint256).max);
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: insufficient balance"));
        mtq.burn(amount);
    }

    /**
     * @dev CONSTITUTIONAL INVARIANT TEST — § Invariant 5:
     *      "burn never pauses — redemption is a non-suspendable constitutional right".
     *
     *      MTQ.burn() does NOT carry the `notEmergencyPaused` modifier. When
     *      the contract is emergency-paused (which blocks mint() and transfer()),
     *      burn() MUST still succeed. This is the absolute redemption guarantee.
     */
    function testFuzz_Burn_WorksWhenPaused(uint256 amount) public {
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 1, fund);

        vm.prank(pauser);
        mtq.activateEmergencyPause();
        assertTrue(mtq.emergencyPaused());

        uint256 supplyBefore = mtq.totalSupply();
        uint256 balBefore = mtq.balanceOf(alice);

        vm.prank(alice);
        mtq.burn(amount); // MUST NOT revert — redemption is non-suspendable

        assertEq(mtq.totalSupply(), supplyBefore - amount, "supply");
        assertEq(mtq.balanceOf(alice), balBefore - amount, "balance");
    }

    // ---- Approve + transferFrom (fuzz) ----

    function testFuzz_ApproveAndTransferFrom(address spender, uint256 approval, uint256 amount) public {
        spender = _boundAddr(spender);
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        approval = bound(approval, 0, type(uint256).max);
        // Cap amount at fund — alice cannot transferFrom more than she owns.
        amount = bound(amount, 0, fund);
        vm.assume(amount <= approval);

        // alice approves `spender`
        vm.prank(alice);
        mtq.approve(spender, approval);
        assertEq(mtq.allowance(alice, spender), approval);

        uint256 aliceBefore = mtq.balanceOf(alice);
        uint256 bobBefore = mtq.balanceOf(bob);

        vm.startPrank(spender);
        mtq.transferFrom(alice, bob, amount);
        vm.stopPrank();

        assertEq(mtq.balanceOf(alice), aliceBefore - amount, "alice");
        assertEq(mtq.balanceOf(bob), bobBefore + amount, "bob");
        assertEq(mtq.allowance(alice, spender), approval - amount, "allowance");
    }

    function testFuzz_TransferFrom_RevertIfInsufficientAllowance(address spender, uint256 approval, uint256 amount)
        public
    {
        spender = _boundAddr(spender);
        _rawMint(alice, 1_000_000 ether);
        approval = bound(approval, 0, type(uint256).max - 1);
        amount = bound(amount, approval + 1, type(uint256).max);
        vm.prank(alice);
        mtq.approve(spender, approval);

        vm.prank(spender);
        vm.expectRevert(bytes("MTQ: insufficient allowance"));
        mtq.transferFrom(alice, bob, amount);
    }

    function testFuzz_TransferFrom_RevertIfPaused(address spender, uint256 amount) public {
        spender = _boundAddr(spender);
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 0, fund);

        vm.prank(alice);
        mtq.approve(spender, amount);

        vm.prank(pauser);
        mtq.activateEmergencyPause();

        vm.prank(spender);
        vm.expectRevert(bytes("MTQ: emergency paused"));
        mtq.transferFrom(alice, bob, amount);
    }

    // ---- Pause / Unpause ----

    function test_PauseUnpause() public {
        // Initially unpaused.
        assertFalse(mtq.emergencyPaused());

        // Pause requires PAUSER_ROLE.
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: unauthorized role"));
        mtq.activateEmergencyPause();

        vm.prank(pauser);
        mtq.activateEmergencyPause();
        assertTrue(mtq.emergencyPaused());

        // Unpause requires COUNCIL_ROLE.
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: only Council"));
        mtq.liftEmergencyPause();

        vm.prank(council);
        mtq.liftEmergencyPause();
        assertFalse(mtq.emergencyPaused());
    }

    /**
     * @dev Brief asks: "paused state blocks transfer but NOT burn".
     *     MTQ applies notEmergencyPaused to transfer() (and transferFrom()
     *     and mint()), but NOT to burn() — per § Invariant 5. This test
     *     documents the "transfer blocked when paused" half of the invariant;
     *     see testFuzz_Burn_WorksWhenPaused for the "burn succeeds when paused"
     *     half.
     */
    function testFuzz_TransferRevertsWhenPaused(uint256 amount) public {
        uint256 fund = 1_000_000 ether;
        _rawMint(alice, fund);
        amount = bound(amount, 1, fund);

        vm.prank(pauser);
        mtq.activateEmergencyPause();

        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: emergency paused"));
        mtq.transfer(bob, amount);
    }

    // ---- Role management ----

    function test_RoleManagement() public {
        bytes32 NEW_ROLE = keccak256("SOME_ROLE");

        // hasRole returns true for granted, false otherwise.
        assertTrue(mtq.hasRole(MINTER_ROLE, minter));
        assertFalse(mtq.hasRole(MINTER_ROLE, alice));

        // Non-council cannot grant.
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: only Council"));
        mtq.grantRole(NEW_ROLE, bob);

        // Council grants.
        vm.prank(council);
        mtq.grantRole(NEW_ROLE, bob);
        assertTrue(mtq.hasRole(NEW_ROLE, bob));

        // Non-council cannot revoke.
        vm.prank(alice);
        vm.expectRevert(bytes("MTQ: only Council"));
        mtq.revokeRole(NEW_ROLE, bob);

        // Council revokes.
        vm.prank(council);
        mtq.revokeRole(NEW_ROLE, bob);
        assertFalse(mtq.hasRole(NEW_ROLE, bob));
    }

    function test_RoleEvents() public {
        vm.expectEmit(true, true, false, false, address(mtq));
        emit MTQ.RoleGranted(MINTER_ROLE, alice);
        vm.prank(council);
        mtq.grantRole(MINTER_ROLE, alice);

        vm.expectEmit(true, true, false, false, address(mtq));
        emit MTQ.RoleRevoked(MINTER_ROLE, alice);
        vm.prank(council);
        mtq.revokeRole(MINTER_ROLE, alice);
    }

    // ---- Reserve ratio & attestReserves ----

    function test_GetReserveRatio_ZeroSupply() public {
        // No supply → contract returns 100% (10000 bps).
        assertEq(mtq.getReserveRatio(), 10000);
    }

    function testFuzz_AttestReserves(uint256 reserveValue) public {
        // Mint some tokens first so ratio is computable.
        // The mint() call sets reserveValueUsd = amount (first attestation,
        // so prevValue = 1M after mint). The drift guard (§20) requires the
        // second attestation to be within ±10% of the first.
        uint256 amount = 1_000_000 ether;
        vm.prank(minter);
        mtq.mint(alice, amount, amount, bytes32(uint256(1)));

        // After mint, reserveValueUsd = 1M (the amount passed to mint).
        // The drift guard allows ±10%: [900K, 1.1M].
        // Bound the fuzzed value to this valid range so the test exercises
        // the happy path (attestation within drift threshold).
        uint256 prevValue = mtq.reserveValueUsd();
        uint256 lowerBound = prevValue * 90 / 100;  // -10%
        uint256 upperBound = prevValue * 110 / 100;  // +10%
        reserveValue = bound(reserveValue, lowerBound, upperBound);

        // Warp time forward past the rate limit (1 hour)
        vm.warp(block.timestamp + 3601);

        vm.prank(minter);
        mtq.attestReserves(reserveValue, bytes32(uint256(2)));
        assertEq(mtq.reserveValueUsd(), reserveValue);
        assertGt(mtq.lastProofOfReservesTimestamp(), 0);
    }

    /// @dev Fuzz test: attestation OUTSIDE the ±10% drift threshold must revert.
    /// This proves the drift guard (§20) is enforced.
    function testFuzz_AttestReserves_RevertIfDriftExceedsThreshold(uint256 overshootBps) public {
        uint256 amount = 1_000_000 ether;
        vm.prank(minter);
        mtq.mint(alice, amount, amount, bytes32(uint256(1)));

        uint256 prevValue = mtq.reserveValueUsd();
        // Overshoot by 11% to 100% (1101 to 20000 bps above prevValue)
        overshootBps = bound(overshootBps, 11001, 20000);
        uint256 excessiveValue = prevValue * overshootBps / 10000;

        vm.warp(block.timestamp + 3601);

        vm.prank(minter);
        vm.expectRevert("Reserve attestation drift exceeds 10% threshold - requires Council quorum");
        mtq.attestReserves(excessiveValue, bytes32(uint256(2)));
    }

    function testFuzz_AttestReserves_RevertIfNotMinter(address notMinter, uint256 value) public {
        notMinter = _boundAddr(notMinter);
        vm.assume(notMinter != minter && notMinter != council);
        value = bound(value, 1, 1e40);
        vm.prank(notMinter);
        vm.expectRevert();
        mtq.attestReserves(value, bytes32(uint256(1)));
    }
}
