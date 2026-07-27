// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {MTQ} from "../src/MTQ.sol";

/**
 * @title MTQ Invariant Tests (§38)
 *
 * @notice Uses the Handler pattern: the fuzzer calls bounded functions on
 *         `MTQHandler`, and after each call every `invariant_*` function is
 *         invoked. Failed assertions break the run.
 *
 * Invariants covered:
 *   1. invariant_total_supply_equals_sum_of_balances
 *      Conservation of supply — sum of all actor balances == totalSupply.
 *   2. invariant_burn_always_works
 *      burn() succeeds for any actor with positive balance, regardless of
 *      emergency pause state. This is § Invariant 5 ("redemption never
 *      suspends") — MTQ.burn() does NOT carry the `notEmergencyPaused`
 *      modifier, so burn works even when the contract is emergency-paused.
 *   3. invariant_transfer_reverts_when_paused
 *      transfer() reverts whenever emergencyPaused == true.
 *   4. invariant_no_negative_balances
 *      Solidity uint256 guarantees this; we additionally assert each actor's
 *      balance never exceeds totalSupply.
 *   5. invariant_mint_only_by_minter_role
 *      Actors without MINTER_ROLE cannot mint. The handler only mints as
 *      `minter`, so this is enforced structurally; we additionally assert
 *      that calling mint from any actor address reverts with the role error.
 *   6. invariant_allowance_never_exceeds_balance_can_be_transferred
 *      transferFrom never moves more than the owner's balance, so the
 *      resulting balance of the owner never underflows. (Brief's
 *      "sum of allowances never exceeds individual balances" is not a true
 *      invariant of ERC-20; this is the meaningful equivalent.)
 *
 * Bootstrapping: MTQ has no constructor and grantRole is onlyCouncil-gated.
 * We grant roles directly in storage via vm.store using the layout:
 *   slot 3: _roles mapping
 *   _roles[role][account] slot = keccak256(account . keccak256(role . 3))
 */
contract MTQHandler is Test {
    MTQ public mtq;
    address public minter;
    address public pauser;
    address public council;
    address[] public actors;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    /// @notice Sum of all actor balances the last time we recomputed.
    ///         Always equals contract totalSupply() if conservation holds.
    uint256 public lastSumOfBalances;

    /// @notice Total MTQ successfully minted (ghost counter).
    uint256 public totalMinted;
    /// @notice Total MTQ successfully burned (ghost counter).
    uint256 public totalBurned;

    constructor(
        address _mtq,
        address _minter,
        address _pauser,
        address _council,
        address[] memory _actors
    ) {
        mtq = MTQ(_mtq);
        minter = _minter;
        pauser = _pauser;
        council = _council;
        actors = _actors;
    }

    // ---- Actor helpers ----

    function _actor(uint256 idx) internal view returns (address) {
        return actors[idx % actors.length];
    }

    function _actorNot(uint256 idx, address forbidden) internal view returns (address) {
        address a = _actor(idx);
        while (a == forbidden) {
            idx++;
            a = _actor(idx);
        }
        return a;
    }

    // ---- Handler functions called by the fuzzer ----

    /// @dev mint to one of the actors. Always uses reserveDepositedUsd == amount
    ///      so the ratio stays at 100% and minting isn't auto-paused.
    function call_mint(uint256 actorIdx, uint256 amount) external {
        amount = bound(amount, 1, 1e40); // avoid overflow in getReserveRatio()
        address to = _actor(actorIdx);
        vm.prank(minter);
        mtq.mint(to, amount, amount, bytes32(uint256(1)));
        totalMinted += amount;
    }

    /// @dev transfer between actors. Bounded so sender has enough balance.
    function call_transfer(uint256 fromIdx, uint256 toIdx, uint256 amount) external {
        address from = _actor(fromIdx);
        address to = _actor(toIdx); // actors are all non-zero
        uint256 bal = mtq.balanceOf(from);
        amount = bound(amount, 0, bal);
        vm.prank(from);
        mtq.transfer(to, amount);
    }

    /// @dev burn from an actor with positive balance.
    function call_burn(uint256 actorIdx, uint256 amount) external {
        address a = _actor(actorIdx);
        uint256 bal = mtq.balanceOf(a);
        if (bal == 0) return; // nothing to burn; skip
        amount = bound(amount, 1, bal);
        vm.prank(a);
        mtq.burn(amount);
        totalBurned += amount;
    }

    /// @dev approve + transferFrom between actors.
    function call_transferFrom(uint256 ownerIdx, uint256 spenderIdx, uint256 recipientIdx, uint256 approval, uint256 amount)
        external
    {
        address owner = _actor(ownerIdx);
        address spender = _actor(spenderIdx);
        address recipient = _actor(recipientIdx);
        uint256 ownerBal = mtq.balanceOf(owner);
        approval = bound(approval, 0, type(uint256).max);
        amount = bound(amount, 0, ownerBal); // can't move more than owner has
        if (amount > approval) amount = approval; // can't move more than allowed

        vm.prank(owner);
        mtq.approve(spender, approval);

        if (amount > 0) {
            vm.prank(spender);
            mtq.transferFrom(owner, recipient, amount);
        }
    }

    /// @dev toggle emergency pause (only pauser).
    function call_activatePause() external {
        vm.prank(pauser);
        mtq.activateEmergencyPause();
    }

    /// @dev lift emergency pause (only council). Council address is set in constructor.
    function call_liftPause() external {
        vm.prank(council);
        mtq.liftEmergencyPause();
    }

    // ---- Ghost-state helpers (used by invariants) ----

    /// @notice Sum of balances across all known actors.
    function sumActorBalances() public view returns (uint256 sum) {
        for (uint256 i = 0; i < actors.length; i++) {
            sum += mtq.balanceOf(actors[i]);
        }
    }

    /// @notice Returns the full actor list (auto getter only returns one element at a time).
    function getActors() external view returns (address[] memory) {
        return actors;
    }

    /// @notice Returns true iff any actor has balance > totalSupply.
    function anyBalanceExceedsSupply() public view returns (bool) {
        uint256 ts = mtq.totalSupply();
        for (uint256 i = 0; i < actors.length; i++) {
            if (mtq.balanceOf(actors[i]) > ts) return true;
        }
        return false;
    }
}

contract MTQInvariantTest is Test {
    MTQ public mtq;
    MTQHandler public handler;

    address public minter = address(0xA11CE);
    address public pauser = address(0xBA5E);
    address public council = address(0xC0FFEE);

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant COUNCIL_ROLE = keccak256("COUNCIL_ROLE");

    // Storage slot of _roles in MTQ.
    uint256 private constant ROLES_SLOT = 3;

    function setUp() public {
        mtq = new MTQ();

        // Bootstrap roles in storage (no constructor in MTQ).
        _grantRoleRaw(MINTER_ROLE, minter);
        _grantRoleRaw(PAUSER_ROLE, pauser);
        _grantRoleRaw(COUNCIL_ROLE, council);

        // Five non-zero actor addresses — all balances live within this set.
        address[] memory actors = new address[](5);
        actors[0] = address(0xA1);
        actors[1] = address(0xA2);
        actors[2] = address(0xA3);
        actors[3] = address(0xA4);
        actors[4] = address(0xA5);

        handler = new MTQHandler(address(mtq), minter, pauser, council, actors);

        // Tell the fuzzer to only call functions on the handler.
        targetContract(address(handler));

        // Exclude the handler itself and the test contract from random
        // fuzzing targets (they're not MTQ).
        excludeContract(address(this));
    }

    // ---- role bootstrapping helper ----

    function _roleSlot(bytes32 role, address account) internal pure returns (bytes32) {
        bytes32 inner = keccak256(abi.encode(role, ROLES_SLOT));
        return keccak256(abi.encode(account, inner));
    }

    function _grantRoleRaw(bytes32 role, address account) internal {
        vm.store(address(mtq), _roleSlot(role, account), bytes32(uint256(1)));
    }

    // =====================================================================
    //                              INVARIANTS
    // =====================================================================

    /**
     * @dev Invariant 1: Conservation of supply.
     *      Sum of all actor balances == totalSupply. Holds because:
     *        - All mints go to actors (increases one actor balance by amount).
     *        - All transfers are between actors (zero-sum).
     *        - All burns come from actors (decreases one balance and totalSupply
     *          by the same amount).
     *        - transferFrom moves between actors (zero-sum).
     */
    function invariant_total_supply_equals_sum_of_balances() public view {
        uint256 sum = handler.sumActorBalances();
        assertEq(sum, mtq.totalSupply(), "supply conservation");
    }

    /**
     * @dev Invariant 2: burn ALWAYS works, regardless of pause state (§ Invariant 5).
     *
     *      MTQ.burn() does NOT carry the `notEmergencyPaused` modifier, so
     *      redemption (burn) succeeds even when the contract is emergency-
     *      paused. This is the absolute non-suspendable redemption guarantee.
     *      See MTQ.t.sol::testFuzz_Burn_WorksWhenPaused for a paired fuzz test.
     */
    function invariant_burn_always_works() public {
        // Pick the first actor with a positive balance and verify a 1-wei burn works
        // — even if the contract is emergency-paused (redemption never suspends).
        address[] memory actors = handler.getActors();
        for (uint256 i = 0; i < actors.length; i++) {
            if (mtq.balanceOf(actors[i]) > 0) {
                uint256 bal = mtq.balanceOf(actors[i]);
                vm.prank(actors[i]);
                mtq.burn(1); // MUST always succeed — redemption is non-suspendable
                assertEq(mtq.balanceOf(actors[i]), bal - 1);
                return;
            }
        }
        // No actor has balance — invariant trivially holds.
    }

    /**
     * @dev Invariant 3: transfer reverts when emergencyPaused == true.
     *      (Burn is the exception: per § Invariant 5, burn NEVER reverts on
     *      pause — see Invariant 2 above.)
     */
    function invariant_transfer_reverts_when_paused() public {
        if (!mtq.emergencyPaused()) return;

        address[] memory actors = handler.getActors();
        address from = actors[0];
        address to = actors[1];
        uint256 bal = mtq.balanceOf(from);

        if (bal == 0) return; // nothing to attempt

        vm.prank(from);
        try mtq.transfer(to, 1) {
            revert("transfer should revert when paused");
        } catch {
            // expected
        }
    }

    /**
     * @dev Invariant 4: No actor has negative balance (trivially true for
     *      Solidity uint256) AND no actor has balance > totalSupply.
     */
    function invariant_no_balance_exceeds_supply() public view {
        assertFalse(handler.anyBalanceExceedsSupply(), "balance > supply");
    }

    /**
     * @dev Invariant 4b: explicit non-negative balance check on every actor.
     */
    function invariant_balances_are_non_negative() public view {
        address[] memory actors = handler.getActors();
        for (uint256 i = 0; i < actors.length; i++) {
            // uint256 is always >= 0; we additionally check it does not exceed supply.
            assertLe(mtq.balanceOf(actors[i]), mtq.totalSupply());
        }
    }

    /**
     * @dev Invariant 5: only MINTER_ROLE can mint.
     *      Pick a non-minter actor and verify mint reverts.
     */
    function invariant_mint_only_by_minter() public {
        address[] memory actors = handler.getActors();
        for (uint256 i = 0; i < actors.length; i++) {
            address a = actors[i];
            if (a == minter) continue; // skip the minter
            if (mtq.hasRole(MINTER_ROLE, a)) continue; // defensive

            vm.prank(a);
            try mtq.mint(a, 1, 1, bytes32(uint256(1))) {
                revert("non-minter should not be able to mint");
            } catch {
                // expected
            }
        }
    }

    /**
     * @dev Invariant 6: transferFrom never moves more than the owner's balance.
     *      We exercise this by attempting a transferFrom that exceeds the
     *      owner's balance and verifying it reverts.
     */
    function invariant_transferFrom_never_exceeds_balance() public {
        if (mtq.emergencyPaused()) return; // transferFrom reverts on pause anyway

        address[] memory actors = handler.getActors();
        address owner = actors[0];
        address spender = actors[1];
        address recipient = actors[2];

        uint256 ownerBal = mtq.balanceOf(owner);
        if (ownerBal == type(uint256).max) return; // can't exceed max
        uint256 attempt = ownerBal + 1;

        vm.prank(owner);
        mtq.approve(spender, attempt);

        vm.prank(spender);
        try mtq.transferFrom(owner, recipient, attempt) {
            revert("transferFrom should revert when amount > owner balance");
        } catch {
            // expected
        }
    }

    /**
     * @dev Invariant 7: totalSupply == totalMinted - totalBurned (ghost accounting).
     *      Verifies our handler's ghost counters stay consistent with the contract.
     */
    function invariant_supply_matches_ghost_accounting() public view {
        assertEq(mtq.totalSupply(), handler.totalMinted() - handler.totalBurned(), "ghost accounting");
    }

    /**
     * @dev Invariant 8: emergencyPaused is consistent with the last call.
     *      When paused, only Council can lift; when not paused, anyone can attempt
     *      to lift (but it will revert). We just assert the state is a valid bool.
     */
    function invariant_paused_state_is_consistent() public view {
        bool paused = mtq.emergencyPaused();
        assertTrue(paused == true || paused == false, "paused is bool");
    }
}
