//
// ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │ Mithqal Settlement Token (MTQ) — Certora Verification Language (CVL) Specification                                    │
// │                                                                                                                       │
// │ Constitutional basis: §38 (Formal Verification mandate)                                                              │
// │   "Every externally callable function of the MTQ monetary engine, the oracle                                          │
// │    layer, and the governance layer shall be accompanied by a Certora spec                                              │
// │    describing the invariants it preserves. No mainnet release may proceed                                             │
// │    until each spec runs to ZERO violations on the deployed bytecode."                                                 │
// │                                                                                                                       │
// │ Spec scope: foundry/src/MTQ.sol (274 SLOC)                                                                            │
// │ Author:     Mithqal Formation Committee — internal audit (Task ID 4+5)                                               │
// │ Date:       26 July 2026                                                                                              │
// │ Status:     SPEC WRITTEN, pending commercial Certora license.                                                         │
// │                                                                                                                       │
// │ HOW TO RUN (once a license is obtained):                                                                              │
// │   cd foundry                                                                                                          │
// │   certoraRun src/MTQ.sol --verify MTQ:certora/MTQ.spec \                                                              │
// │     --solc solc-0.8.24 --settings -assumeUnreasonableRevert=false \                                                   │
// │     --rule_sanity                                                                                                     │
// │                                                                                                                       │
// │ Invariants specified: 6                                                                                                │
// │   1. supplyConservation              — totalSupply == sum of all balances (ERC-20 fundamental invariant)              │
// │   2. noNegativeBalances              — balanceOf(addr) >= 0 for all addr                                              │
// │   3. burnNeverPauses  ⚠ KNOWN VIOLATION — burn() MUST always succeed (Constitution § Invariant 5)                    │
// │   4. mintRequiresMinterRole          — mint() reverts if caller lacks MINTER_ROLE                                       │
// │   5. transferRequiresNotPaused       — transfer() reverts when emergencyPaused == true                                 │
// │   6. allowanceConservation          — allowance[owner][spender] only changes via approve/transferFrom                 │
// │                                                                                                                       │
// │ Source-level facts the spec relies on (verified by reading MTQ.sol):                                                  │
// │   - Line 54: uint256 private _totalSupply;            (slot 0)                                                         │
// │   - Line 57: mapping(address => uint256) private _balances;            (slot 1)                                        │
// │   - Line 58: mapping(address => mapping(address => uint256)) private _allowances; (slot 2)                              │
// │   - Line 61-63: MINTER_ROLE / PAUSER_ROLE / COUNCIL_ROLE constant hashes                                              │
// │   - Line 65:  mapping(bytes32 => mapping(address => bool)) private _roles; (slot 3)                                    │
// │   - Line 68:  bool public mintingPaused;               (slot 4)                                                        │
// │   - Line 69:  bool public emergencyPaused;             (slot 5)                                                        │
// │   - Line 70:  uint256 public reserveValueUsd;          (slot 6)                                                        │
// │   - Line 120: function mint(...) external onlyRole(MINTER_ROLE) notEmergencyPaused                                     │
// │   - Line 149: function burn(uint256) external notEmergencyPaused  ⚠ VIOLATES § Invariant 5                             │
// │   - Line 244: function transfer(...) external notEmergencyPaused                                                       │
// │   - Line 255: function transferFrom(...) external notEmergencyPaused                                                   │
// │   - Line 249: function approve(...) external — NOT gated by notEmergencyPaused                                          │
// │                                                                                                                       │
// │ ⚠ KNOWN VIOLATION (must be fixed before mainnet):                                                                     │
// │   MTQ.burn(uint256 amount) at line 149 carries the `notEmergencyPaused` modifier despite the NatSpec                  │
//   at line 142-146 stating "Redemption is NEVER suspended. This function cannot be paused by any role."                   │
// │   This is a direct violation of Constitution § Invariant 5 ("No redemption suspension").                              │
// │   The fuzz tests (foundry/test/MTQ.t.sol::testFuzz_Burn_RevertIfPaused) confirm the violation:                         │
// │   burn() reverts with "MTQ: emergency paused" when emergencyPaused == true.                                            │
// │                                                                                                                       │
// │   This spec includes the `burnNeverPauses` invariant, which will FAIL by design when run against                       │
// │   the current bytecode. The failure is the formal proof that the constitutional invariant is                          │
// │   violated. Remediation: remove `notEmergencyPaused` from burn()'s modifier list (line 149).                            │
// │                                                                                                                       │
// │ Bootstrapping caveat: MTQ has NO constructor — totalSupply starts at 0 and no role is                                 │
// │ granted at deploy. The production deployment script must use a wrapping proxy or storage                              │
// │ writes to bootstrap COUNCIL_ROLE first. The fuzz tests (foundry/test/MTQ.t.sol)                                      │
// │ demonstrate this pattern via vm.store; the Certora run harness will need to do the same                                │
// │ (or a test-only sub-harness that grants roles in its constructor must be added).                                       │
// └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
//

using MTQ as token;

// ─────────────────────────────────────────────────────────────────────────────────────
// GHOST STATE — sum of all balances
// ─────────────────────────────────────────────────────────────────────────────────────
// The fundamental ERC-20 conservation invariant: totalSupply == Σ balances.
// Following the OpenZeppelin ERC20.spec pattern (lib/openzeppelin-contracts/certora/specs/ERC20.spec),
// we declare a ghost variable tracking the sum and hook every SLOAD/SSTORE on
// the _balances mapping (storage slot 1 in MTQ).

ghost mathint sumOfBalances {
    init_state axiom sumOfBalances == 0;
}

// Hook every read so that the prover can relate an individual balance to the sum.
// This prevents counter-examples where an initial corrupted balance exceeds
// totalSupply (which would break the conservation invariant on the first transfer).
hook Sload uint256 balance token._balances[KEY address addr] STORAGE {
    require sumOfBalances >= to_mathint(balance);
}

// Hook every write so that the sum stays in sync with the actual storage.
hook Sstore token._balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    sumOfBalances = sumOfBalances - oldValue + newValue;
}

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 1 — supplyConservation
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 1 (100%+ reserve mandate), § Invariant 2
// (No discretionary minting). The Constitution forbids minting without a
// matching deposit; the supply conservation invariant is the on-chain
// expression of "every MTQ in circulation corresponds to a real deposit."
//
// Source-level proof obligation:
//   - mint() (MTQ.sol:130-131) increments both _totalSupply and _balances[to]
//     by `amount` → both sides of the equation advance by the same delta.
//   - burn() (MTQ.sol:155-156) decrements both → both sides retreat by `amount`.
//   - transfer() (MTQ.sol:265-266) and transferFrom() move balance from one
//     account to another → sum-of-balances unchanged, _totalSupply unchanged.
// The ghost sumOfBalances tracks every balance write via the hook above, so
// this invariant reduces to: ghost sum == _totalSupply at all times.

invariant supplyConservation()
    to_mathint(token.totalSupply()) == sumOfBalances;

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 2 — noNegativeBalances
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 1 (100%+ reserve mandate). A negative
// balance would mean the contract allowed redeeming more than was deposited —
// a direct violation of the reserve mandate.
//
// In Solidity this is trivially true (uint256 cannot be negative — underflow
// panics in 0.8.x). This invariant formally proves it: for every address,
// balanceOf(addr) >= 0. Combined with invariant #1, it implies no account
// can ever hold more MTQ than the total supply (which would be an
// over-collateralization of one account against the rest).
//
// Implementation note: CVL has no built-in "forall address" quantifier in
// invariants; the property is encoded as two rules — one for arbitrary
// accountants, one asserting no balance exceeds totalSupply.

rule balanceOfIsNonNegative(address account) {
    calldataarg args;
    method f;
    f(args);
    assert to_mathint(token.balanceOf(account)) >= 0,
           "balanceOf must never be negative (uint256 axiom)";
}

rule noBalanceExceedsTotalSupply(address account) {
    requireInvariant supplyConservation();
    calldataarg args;
    method f;
    f(args);
    assert to_mathint(token.balanceOf(account)) <= to_mathint(token.totalSupply()),
           "no account balance may exceed totalSupply";
}

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 3 — burnNeverPauses  ⚠ KNOWN VIOLATION (do NOT silence)
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 5 — "No redemption suspension."
//   "The right of every MTQ holder to redeem their tokens for the proportional
//    underlying reserve is absolute. No role, including the Council, the
//    Emergency Custodian, or any future amendment, may suspend redemption.
//    The burn() function shall always succeed for a holder with sufficient
//    balance, regardless of any pause state."
//
// ⚠ STATUS: VIOLATED by MTQ.sol:149
//   `function burn(uint256 amount) external notEmergencyPaused {`
//   The `notEmergencyPaused` modifier (line 95-98) causes burn() to revert
//   with "MTQ: emergency paused" whenever emergencyPaused == true.
//   The fuzz test foundry/test/MTQ.t.sol::testFuzz_Burn_RevertIfPaused
//   demonstrates the violation empirically.
//
// This rule is INTENTIONALLY set up to FAIL on the current bytecode — the
// failure is the formal proof that the Constitution is not enforced on-chain.
// Remediation (REQUIRED before mainnet):
//   - Remove `notEmergencyPaused` from the modifier list of burn() at line 149.
//   - Re-run this spec; `burnNeverPauses` must pass with zero violations.
//   - Update the NatSpec at lines 142-148 (already correct — only the
//     implementation lags behind the documented contract).
//
// Once the fix lands, this rule will hold trivially. Until then, the
// CI gate on Certora verification (§38) MUST NOT pass for mainnet release.

rule burnNeverPauses(env e, uint256 amount) {
    require nonpayable(e);

    address holder = e.msg.sender;

    // Pre-condition: holder has enough balance to burn `amount`.
    // (burn() still reverts on insufficient balance — that's a separate,
    // legitimate guard, not a constitutional violation.)
    require to_mathint(token.balanceOf(holder)) >= to_mathint(amount);
    require amount > 0;

    // Force the contract into the paused state — this is the configuration
    // under which the violation manifests.
    require token.emergencyPaused() == true;

    burn@withrevert(e, amount);

    // The Constitution says burn MUST succeed regardless of pause.
    // ⚠ THIS ASSERTION CURRENTLY FAILS — see comment block above.
    assert !lastReverted,
           "CONSTITUTIONAL VIOLATION: burn() must not revert when emergencyPaused (§ Invariant 5)";
}

// Companion rule (sanity): when NOT paused, burn must succeed for a holder
// with sufficient balance. This guards against the spec being trivially
// satisfied by an always-reverting implementation.

rule burnSucceedsWhenNotPaused(env e, uint256 amount) {
    require nonpayable(e);

    address holder = e.msg.sender;
    require to_mathint(token.balanceOf(holder)) >= to_mathint(amount);
    require amount > 0;
    require token.emergencyPaused() == false;

    burn@withrevert(e, amount);
    assert !lastReverted,
           "burn() must succeed when not paused and holder has sufficient balance";
}

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 4 — mintRequiresMinterRole
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 2 — "No discretionary minting."
//   "Minting shall be permitted ONLY upon verified deposit of equivalent
//    value, attested by the Reserve Oracle. No role — not the Council,
//    not the Emergency Custodian — may mint MTQ without a deposit event."
// On-chain guard: `onlyRole(MINTER_ROLE)` modifier on mint() at line 120.
//
// This rule picks an arbitrary caller that does NOT have MINTER_ROLE and
// asserts the mint reverts. The complementary liveness rule below asserts
// that a MINTER_ROLE holder with valid deposit data can mint.

rule mintRevertsWithoutMinterRole(env e, address to, uint256 amount, uint256 reserveDepositedUsd, bytes32 depositProof) {
    require nonpayable(e);
    require !token.hasRole(MINTER_ROLE(), e.msg.sender);

    mint@withrevert(e, to, amount, reserveDepositedUsd, depositProof);
    assert lastReverted, "mint must revert when caller lacks MINTER_ROLE";
}

// Liveness: a MINTER_ROLE holder with a valid deposit (amount > 0,
// reserveDepositedUsd >= amount, depositProof != 0, contract not paused,
// reserve ratio >= 100%) can mint. This is the positive side of the
// authorization invariant.

rule mintLivenessForMinterRole(env e, address to, uint256 amount, uint256 reserveDepositedUsd, bytes32 depositProof) {
    require nonpayable(e);
    require token.hasRole(MINTER_ROLE(), e.msg.sender);
    require to != 0;
    require amount > 0;
    require to_mathint(reserveDepositedUsd) >= to_mathint(amount);
    require depositProof != 0;
    require token.emergencyPaused() == false;
    require token.mintingPaused() == false;

    mint@withrevert(e, to, amount, reserveDepositedUsd, depositProof);
    assert !lastReverted, "mint must succeed when caller has MINTER_ROLE and all pre-conditions hold";
}

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 5 — transferRequiresNotPaused
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 5 — "No redemption suspension" (only
// applies to burn). The Constitution explicitly permits the Council to
// pause *transfers* (but not redemption) during a governance attack or
// oracle failure. On-chain guard: `notEmergencyPaused` modifier on
// transfer() at line 244 and transferFrom() at line 255.
//
// These rules assert: when emergencyPaused == true, transfer and transferFrom
// revert. (Note: approve() is NOT paused — that is correct: an approval is
// a meta-operation, not a value transfer, and pausing it would prevent
// holders from preparing for an orderly un-pause.)

rule transferRevertsWhenPaused(env e, address to, uint256 amount) {
    require nonpayable(e);
    require token.emergencyPaused() == true;

    transfer@withrevert(e, to, amount);
    assert lastReverted, "transfer must revert when emergencyPaused";
}

rule transferFromRevertsWhenPaused(env e, address from, address to, uint256 amount) {
    require nonpayable(e);
    require token.emergencyPaused() == true;

    transferFrom@withrevert(e, from, to, amount);
    assert lastReverted, "transferFrom must revert when emergencyPaused";
}

// Complementary: approve must NOT be paused (so holders can revoke approvals
// during an emergency to prepare for the un-pause).
rule approveNotAffectedByPause(env e, address spender, uint256 amount) {
    require nonpayable(e);
    require token.emergencyPaused() == true;

    approve@withrevert(e, spender, amount);
    assert !lastReverted, "approve must remain callable when emergencyPaused";
}

// ─────────────────────────────────────────────────────────────────────────────────────
// INVARIANT 6 — allowanceConservation
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: §38 (audit-grade correctness), ERC-20 standard.
// The allowance mapping may ONLY be modified by:
//   (a) approve(owner, spender, amount) called BY the owner  → sets allowance to `amount`
//   (b) transferFrom(from, to, amount) called BY spender     → decrements allowance by `amount`
//   (c) permit(...) — N/A for MTQ (no EIP-2612 in this revision)
// No other external entry point may change allowance[owner][spender].
//
// Pattern adapted from OpenZeppelin's ERC20.spec::onlyHolderOfSpenderCanChangeAllowance.

rule allowanceOnlyChangedByApproveOrTransferFrom(env e, address owner, address spender) {
    requireInvariant supplyConservation();
    require nonpayable(e);

    method f;
    calldataarg args;

    uint256 allowanceBefore = token.allowance(owner, spender);
    f(e, args);
    uint256 allowanceAfter = token.allowance(owner, spender);

    // Allowance increased → must be approve() by the owner.
    assert (
        allowanceAfter > allowanceBefore
    ) => (
        f.selector == sig:approve(address, uint256).selector
        && e.msg.sender == owner
    );

    // Allowance decreased → must be approve() by the owner OR transferFrom() by the spender.
    assert (
        allowanceAfter < allowanceBefore
    ) => (
        (f.selector == sig:approve(address, uint256).selector       && e.msg.sender == owner) ||
        (f.selector == sig:transferFrom(address, address, uint256).selector && e.msg.sender == spender)
    );
}

// ─────────────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTARY RULE — onlyMintAndBurnChangeTotalSupply
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Invariant 2 — only mint() (with a verified deposit)
// may increase totalSupply. No external method (transfer, approve, etc.) may
// change totalSupply in either direction. burn() is the only way to decrease
// it. Adapted from OpenZeppelin's ERC20.spec::noChangeTotalSupply.

rule onlyMintAndBurnChangeTotalSupply(env e) {
    requireInvariant supplyConservation();
    require nonpayable(e);

    method f;
    calldataarg args;

    uint256 totalSupplyBefore = token.totalSupply();
    f(e, args);
    uint256 totalSupplyAfter = token.totalSupply();

    assert totalSupplyAfter > totalSupplyBefore => f.selector == sig:mint(address, uint256, uint256, bytes32).selector;
    assert totalSupplyAfter < totalSupplyBefore => f.selector == sig:burn(uint256).selector;
}

// ─────────────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTARY RULE — pauseStateRequiresAuthorizedCaller
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Article XVII (Emergency custodian). The emergency
// pause may only be activated by PAUSER_ROLE (the time-limited Emergency
// Custodian) and may only be lifted by COUNCIL_ROLE. This is the on-chain
// enforcement of the Constitution's "no single party may both pause and lift"
// separation of duties.

rule activatePauseRequiresPauserRole(env e) {
    require nonpayable(e);
    require !token.hasRole(PAUSER_ROLE(), e.msg.sender);

    activateEmergencyPause@withrevert(e);
    assert lastReverted, "activateEmergencyPause must revert when caller lacks PAUSER_ROLE";
}

rule liftPauseRequiresCouncilRole(env e) {
    require nonpayable(e);
    require !token.hasRole(COUNCIL_ROLE(), e.msg.sender);

    liftEmergencyPause@withrevert(e);
    assert lastReverted, "liftEmergencyPause must revert when caller lacks COUNCIL_ROLE";
}

// ─────────────────────────────────────────────────────────────────────────────────────
// SUPPLEMENTARY RULE — roleManagementRequiresCouncil
// ─────────────────────────────────────────────────────────────────────────────────────
// Constitutional basis: § Article XII (Council composition). Role grants and
// revokes are Council-only. No external method other than grantRole / revokeRole
// may change _roles[role][account], and both require COUNCIL_ROLE.

rule grantRoleRequiresCouncilRole(env e, bytes32 role, address account) {
    require nonpayable(e);
    require !token.hasRole(COUNCIL_ROLE(), e.msg.sender);

    grantRole@withrevert(e, role, account);
    assert lastReverted, "grantRole must revert when caller lacks COUNCIL_ROLE";
}

rule revokeRoleRequiresCouncilRole(env e, bytes32 role, address account) {
    require nonpayable(e);
    require !token.hasRole(COUNCIL_ROLE(), e.msg.sender);

    revokeRole@withrevert(e, role, account);
    assert lastReverted, "revokeRole must revert when caller lacks COUNCIL_ROLE";
}
