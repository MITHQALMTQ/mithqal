// ============================================================
// Mithqal MTQ Token — Certora Formal Verification (CVL v2)
// ============================================================
//
// Spec target: foundry/src/MTQ.sol
//
// Proves two constitutional properties of the MTQ ERC-20:
//
//   1. burnZeroReverts     — burn(amount=0) always reverts (§ Invariant 5:
//                            redemption is never suspended, but a zero-amount
//                            burn is a no-op and MUST revert per the contract's
//                            `require(amount > 0, "MTQ: zero burn")` guard).
//
//   2. supplyEqualsBalances — Σ balances == totalSupply (conservation of
//                            token supply). Every mint increases both
//                            `_totalSupply` and a `_balances[user]` entry by
//                            the same amount; every burn decreases both by
//                            the same amount; every transfer leaves the sum
//                            unchanged (one balance down, another up by the
//                            same amount). Therefore the running sum of all
//                            `_balances` entries must always equal
//                            `_totalSupply` (== `totalSupply()`).
//
// ------------------------------------------------------------
// Why ghost state (and not balanceOf()?)
// ------------------------------------------------------------
//
// Naively one might write the conservation invariant as
//
//     invariant sum(balanceOf(u) for all u) == totalSupply()
//
// but `balanceOf` is an external view that performs an Sload per call.
// Certora cannot sum an arbitrary number of independent external calls —
// there is no fixed user set to enumerate, and each call is an isolated
// storage read with no link back to the writes that populated the storage.
//
// The standard Certora pattern is to declare a *ghost variable*
// `sumBalances` that shadows the running sum of `_balances`, and to keep
// it in sync with storage via Sload/Sstore hooks. Every time the contract
// reads `_balances[u]` we constrain the ghost (the read value cannot
// exceed the running sum); every time it writes `_balances[u]` we update
// the ghost by `− oldVal + newVal`. The invariant then becomes a single
// mathint comparison — no enumeration, no view-function indirection.
//
// This pattern is the canonical way to link an external view function
// (`totalSupply`, `balanceOf`) to the internal storage it ultimately reads
// (`_totalSupply`, `_balances`).
// ============================================================

using MTQ as token;

// ------------------------------------------------------------
// Ghost state — running sum of all `_balances` entries.
// ------------------------------------------------------------
// `init_state axiom` seeds the ghost at 0 (matches the contract's
// post-construction state: `_totalSupply == 0` and `_balances` is empty).
ghost mathint sumBalances {
    init_state axiom sumBalances == 0;
}

// ------------------------------------------------------------
// Sload hook — constrain reads of `_balances[user]`.
// ------------------------------------------------------------
// Whenever the contract reads `_balances[user]`, the value read (`bal`)
// must not exceed the running sum. This is a soundness constraint: an
// individual balance can never be larger than the total of all balances.
// It also forces Certora to consider every balance read when reasoning
// about the ghost, so the ghost cannot drift away from the actual
// storage values.
hook Sload uint256 bal token._balances[KEY address user] {
    require sumBalances >= to_mathint(bal);
}

// ------------------------------------------------------------
// Sstore hook — update the ghost on every `_balances[user]` write.
// ------------------------------------------------------------
// `oldVal` is the value being overwritten; `newVal` is the replacement.
// The ghost is updated by subtracting the old contribution and adding
// the new one, so it always equals Σ _balances[u] over all `u` that
// have ever been written.
hook Sstore token._balances[KEY address user] uint256 newVal (uint256 oldVal) {
    sumBalances = sumBalances - to_mathint(oldVal) + to_mathint(newVal);
}

// ============================================================
// Property 1 — supplyEqualsBalances (conservation invariant)
// ============================================================
// `totalSupply()` returns `_totalSupply` verbatim (no transformation),
// so `to_mathint(token.totalSupply(e))` is exactly the contract's
// internal `_totalSupply` value. The invariant asserts that this equals
// the ghost-tracked sum of all `_balances` entries, which is the
// conservation-of-supply property.
//
// This is an `invariant` (not a `rule`): it must hold at the end of
// every external function call, after every mint / burn / transfer.
invariant supplyEqualsBalances(env e)
    to_mathint(token.totalSupply(e)) == sumBalances;

// ============================================================
// Property 2 — burnZeroReverts (zero-amount redemption guard)
// ============================================================
// The Constitution makes redemption a non-suspendable right, but the
// contract still guards against a no-op zero-amount burn via
// `require(amount > 0, "MTQ: zero burn")`. This rule asserts that
// `burn(0)` always reverts, regardless of the caller's balance or the
// contract's pause state. `@withrevert` allows the call to revert without
// halting the rule; `lastReverted` then captures the outcome.
rule burnZeroReverts(env e) {
    token.burn@withrevert(e, 0);
    assert lastReverted, "burn(0) must revert";
}
