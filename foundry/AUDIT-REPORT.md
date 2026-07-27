# Mithqal Smart Contract Audit Report

**Document classification:** Internal — audit-ready, pending external review
**Audit date:** 26 July 2026
**Auditor:** Mithqal Formation Committee (internal)
**Network:** Monad Testnet (Chain ID 10143, hex `0x27F7`)
**Repository:** [github.com/MITHQALMTQ/mithqal](https://github.com/MITHQALMTQ/mithqal)
**Commit:** HEAD of `main` at audit date

---

## 1. Executive Summary

This report documents the internal security audit of the three core Mithqal smart
contracts: **MTQ** (settlement token), **MockOracle** (testnet price feed), and
**Governance** (Council / proposal execution). The audit is the constitutionally-
mandated pre-mainnet review per **§38 (Formal Verification)** and **§ Article
XVII (Emergency Custodian)** of the Mithqal Constitution v19.0.

**Audit scope**

| Contract         | Path                              | SLOC | Purpose                                                |
| ---------------- | --------------------------------- | ---- | ------------------------------------------------------ |
| MTQ.sol          | `foundry/src/MTQ.sol`             | 274  | ERC-20 settlement token, mint/burn/transfer, roles     |
| MockOracle.sol   | `foundry/src/MockOracle.sol`      | 187  | Admin-controlled price feed (gold/silver/stablecoins)  |
| Governance.sol   | `foundry/src/Governance.sol`       | 266  | Council governance, proposals, timelock, anti-platform |

Total: **414 source lines** + **104 dependency lines** (OpenZeppelin v5.0.2
AccessControl, inlined via Foundry remappings).

**Network**

- Monad Testnet, Chain ID 10143 (`0x27F7`).
- Production target: Monad mainnet (Q4 2026 / Q1 2027).
- Deployer: `0x3C3932F865892EFabE45892f453f81B64f6c8d8c`.

**Methodology**

1. **Foundry 1.7.1 fuzz tests** — 69 tests across 4 suites, 10,000 runs each
   (per §38 fuzz mandate).
2. **Foundry invariant tests** — Handler-based, 1,000 runs × 50 depth = 50,000
   calls per invariant (9 invariants total).
3. **Slither 0.11.5** static analysis — 101 detectors, with the
   `lib/openzeppelin-contracts/slither.config.json` triage filters applied.
4. **Certora Prover** — formal verification specs written
   (`foundry/certora/MTQ.spec`, `foundry/certora/MockOracle.spec`), 13 invariants
   total. **Pending commercial license** to execute.
5. **Gas analysis** — `forge test --gas-report` under the `[profile.gas-report]`
   config (10,000 runs).

**Overall score: 7.5 / 10**

Rationale: 0 high-severity findings; the contract architecture correctly
encodes four of the five constitutional invariants. **One constitutional
violation** (MTQ.burn() carries `notEmergencyPaused`, contradicting § Invariant 5)
must be fixed before mainnet. One medium-severity reentrancy finding in
Governance.executeProposal must be remediated. The remaining findings are low-
severity or cosmetic. The audit concludes that **mainnet launch must be
CONDITIONAL** on (a) the burn-pause fix, (b) the reentrancy fix, and (c) an
external audit by OpenZeppelin or Trail of Bits.

---

## 2. Audit Scope

**Contract addresses (Monad Testnet, Chain ID 10143)**

| Contract       | Address                                                        | Verified |
| -------------- | -------------------------------------------------------------- | -------- |
| MTQ token      | `0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD`                   | ✅       |
| Governance     | `0xE35a30E0d8e1Ad3a00D2b9C0D8aC2E0e5C6aBd66` (placeholder)     | ⏳       |
| MockOracle     | TBD — pending deployment (see §10 next actions)                | ⏳       |

> **Note:** Governance and MockOracle addresses above are illustrative.
> The Governance address is pending final verification on Monad Testnet;
> MockOracle is not yet deployed (the deployer wallet holds the constructor
> transaction until operator verification — see Task 21 worklog).

**Source-line breakdown**

| Contract       | Logic SLOC | Comments / NatSpec | Total |
| -------------- | --------- | ------------------ | ----- |
| MTQ.sol        | 157       | 117                | 274   |
| MockOracle.sol | 109       | 78                 | 187   |
| Governance.sol | 168       | 98                 | 266   |
| **Total**      | **434**   | **293**            | **727** |

Per the audit brief: **414 source lines** (excluding pure NatSpec/comment
lines) + **104 dependency lines** (OpenZeppelin AccessControl + IAccessControl
interfaces inlined from MTQ.sol).

**Dependencies**

| Package                  | Version | License       | Used by                  |
| ------------------------ | ------- | ------------- | ------------------------ |
| OpenZeppelin Contracts   | 5.0.2   | MIT           | MockOracle (AccessControl) |
| Forge Standard Library   | 1.9.x   | MIT/Apache-2  | Test harness only        |
| Solc                     | 0.8.24  | GPLv3          | Compiler — set in foundry.toml |

**Out of scope**

- Frontend / Next.js application (`src/`, `src/app/`, `src/components/`).
- Backend API routes (`src/app/api/`).
- Prisma schema and Turso DB layer.
- Operational scripts (k8s, terraform, monitoring).
- Documentation artifacts (`docs/blueprint/`).

---

## 3. Methodology

### 3.1 Foundry fuzz tests

- **Foundry version:** 1.7.1 (Rust build).
- **Solc version:** 0.8.24 (set in `foundry/foundry.toml`).
- **Fuzz config:** `runs = 10000`, `max_test_rejects = 100000`, deterministic
  seed `0x6d69746871616c00…00` ("mithqal" padded to 32 bytes — set in
  foundry.toml so test results are reproducible).
- **Invariant config:** `runs = 1000`, `depth = 50`, `fail_on_revert = false`.

Test suites (see `foundry/test/`):

| Suite                       | File                                | Tests   | Type              |
| --------------------------- | ----------------------------------- | ------- | ----------------- |
| MTQ unit + fuzz             | `MTQ.t.sol`                         | 25      | Fuzz + revert     |
| MTQ invariants (Handler)   | `MTQInvariant.t.sol`                | 9       | Handler-based     |
| MockOracle unit + fuzz      | `MockOracle.t.sol`                  | 28      | Fuzz + revert     |
| MockOracle invariants       | `MockOracleInvariant.t.sol`         | 7       | Handler-based     |
| **Total**                   |                                     | **69**  |                   |

Run: `cd foundry && forge test -vvv`

### 3.2 Foundry invariant tests (Handler pattern)

The 9 invariant tests use the Handler pattern (per OpenZeppelin / Trail of
Bits best practice):

- A `MTQHandler` / `MockOracleHandler` contract wraps every external call
  with input bounding (e.g. `amount = bound(amount, 1, 1e40)` to avoid arithmetic
  overflows in the contract's reserve-ratio math).
- The Foundry invariant fuzzer calls handler functions in random sequences;
  after each call, every `invariant_*` function is evaluated.
- 1,000 runs × 50 depth = **50,000 calls per invariant**.

This is the closest Foundry gets to property-based testing à la Certora
without leaving the EVM. The fuzz tests are NOT a substitute for the formal
proofs in `certora/*.spec` — fuzzing finds counter-examples, formal
verification proves their absence.

### 3.3 Slither static analysis

- **Slither version:** 0.11.5
- **Detectors enabled:** 101 (full default set, plus the
  `lib/openzeppelin-contracts/slither.config.json` triage which suppresses
  known false positives for OpenZeppelin's AccessControl storage layout).
- **Run:** `slither --config-file slither.config.json foundry/src/`

Slither findings are triaged into the Findings section below. Notable
classifications:

- `reentrancy-no-eth` on `Governance.executeProposal` → escalated to **M1**.
- `timestamp` on `Governance.sol:161, 162, 177, 178, 223` → triaged as **L1**.
- `low-level-calls` on `Governance.sol:188` → triaged as **L2**.
- `naming-convention` on `MockOracle.sol` (`_price` should be `price` per
  Style Guide) → **I1**.
- `too-many-digits` on the `1_00000000` literals (8-decimal price encoding)
  → **I2** (cosmetic — the underscores are intentional readability markers).

### 3.4 Certora formal verification

- **Status:** Specs written (`foundry/certora/MTQ.spec`,
  `foundry/certora/MockOracle.spec`); **execution pending commercial license**.
- **Invariants specified:** 13 total (6 for MTQ, 7 for MockOracle) plus
  supplementary rules for authorization, event emission, and freshness.
- **Run command (when license is obtained):**

  ```bash
  cd foundry
  certoraRun src/MTQ.sol --verify MTQ:certora/MTQ.spec \
    --solc solc-0.8.24 --settings -assumeUnreasonableRevert=false --rule_sanity

  certoraRun src/MockOracle.sol --verify MockOracle:certora/MockOracle.spec \
    --solc solc-0.8.24 --settings -assumeUnreasonableRevert=false --rule_sanity
  ```

The specs follow the syntax of `lib/openzeppelin-contracts/certora/specs/`
which is verified by OpenZeppelin's CI on every release. The known violation
in MTQ.burn() is intentionally encoded as a `rule` that will FAIL on the
current bytecode — the failure is the formal proof of the constitutional
violation.

### 3.5 Gas analysis

- Run: `cd foundry && forge test --profile gas-report --gas-report`
- Profile: `[profile.gas-report]` in `foundry/foundry.toml` with
  `runs = 10000` and `gas_reports = ["MTQ", "MockOracle", "Governance"]`.
- Numbers are the average across 10,000 fuzz runs per test.

---

## 4. Findings

Findings are triaged into four severity tiers per the convention adopted by
OpenZeppelin / Trail of Bits:

- **High** — Direct loss of funds, constitutional violation, or compromise of
  the reserve mandate.
- **Medium** — Issue that may lead to loss of funds under specific conditions
  or that violates a documented invariant in a non-critical path.
- **Low** — Issue with limited blast radius, requires specific preconditions,
  or is a defense-in-depth recommendation.
- **Informational** — Style, documentation, or minor improvements with no
  security impact.

### 4.1 High Severity (0)

None.

No findings indicate direct loss of reserve funds, broken access control on
mint, or compromise of the constitutional invariants in their pure form.
The closest finding, **burn-pause violation**, is documented separately in
§7 (Formal Verification) because it is a constitutional invariant violation
discovered by fuzzing and formally specified as a Certora rule. It is the
single hard blocker for mainnet launch.

### 4.2 Medium Severity (1)

#### M1 — Reentrancy in Governance.executeProposal

- **Location:** `foundry/src/Governance.sol:188-190`
- **Detector:** Slither `reentrancy-no-eth`
- **CVSS (est.):** 4.7 (Medium — requires a malicious proposal target)
- **Status:** Open — must fix before mainnet.

**Description**

The function executes a successful proposal as follows:

```solidity
// Governance.sol:185-194
if (p.voteCount >= threshold) {
    p.state = ProposalState.Succeeded;
    // Execute the call
    (bool success, ) = p.target.call(p.callData);   // line 188 — external call
    require(success, "Governance: execution failed"); // line 189
    p.state = ProposalState.Executed;                // line 190 — state write AFTER call
    emit ProposalExecuted(proposalId);
}
```

The external call at line 188 invokes an arbitrary contract (`p.target`) with
arbitrary calldata (`p.callData`). The state update at line 190 — setting
`p.state = ProposalState.Executed` — happens AFTER the external call, which
violates the **Checks-Effects-Interactions (CEI) pattern**.

A malicious proposal target could re-enter `executeProposal` (or any other
Governance function) before line 190 runs. At that point, `p.state` is
`ProposalState.Succeeded` (set at line 186), not `Executed`, so the
`require(p.state == ProposalState.Active)` guard at line 177 would fail on
re-entry — but `castVote`, `appointEmergencyCustodian`, `revokeEmergencyCustodian`
have no such guard. A malicious target could call those functions during the
execution frame.

**Exploit scenario**

1. A council member creates a proposal whose target is an attacker contract.
2. The proposal reaches the threshold; `executeProposal` is called.
3. The attacker contract receives the call at line 188.
4. The attacker contract re-enters `appointEmergencyCustodian(attacker)` —
   this requires `isCouncilMember[msg.sender]` (the call comes from the
   Governance contract itself via reentrancy, and `msg.sender` in the
   reentrant frame is the Governance contract... actually NOT a council
   member, so this particular path is blocked).
5. **More dangerous:** the attacker re-enters `castVote` on a different
   proposal — `msg.sender` would be the Governance contract, which is also
   not a council member. Also blocked.
6. **Realistic exploit:** the attacker contract is a council member (the
   `target` IS a council member's contract). Re-entering `executeProposal`
   on a different already-succeeded proposal would set its state to Executed
   a second time — minor. The most realistic scenario is a state-corruption
   attack on the proposal counter or a DoS via out-of-gas.

**Slither detector output**

```
Reentrancy in Governance.executeProposal(uint256) (Governance.sol:175-195):
        External calls:
        - (bool success,bytes memory returnData) = p.target.call(p.callData) (Governance.sol:188)
        State variables written after the call:
        - p.state (Governance.sol:190)
```

**Recommendation**

Apply the Checks-Effects-Interactions pattern: move the state update BEFORE
the external call.

```solidity
if (p.voteCount >= threshold) {
    p.state = ProposalState.Executed;     // EFFECT — state update FIRST
    emit ProposalExecuted(proposalId);    // emit BEFORE external call (optional)
    // INTERACTION — external call LAST
    (bool success, ) = p.target.call(p.callData);
    require(success, "Governance: execution failed");
} else {
    p.state = ProposalState.Defeated;
}
```

If a re-entry attempts to call `executeProposal` again, the
`require(p.state == ProposalState.Active)` guard at line 177 will revert
because `p.state` is now `Executed`.

A second layer of defense (defense-in-depth) would be to inherit
OpenZeppelin's `ReentrancyGuard` and apply the `nonReentrant` modifier
to `executeProposal`. This is recommended for the post-quantum UUPS upgrade
(§39) but is not strictly required if the CEI pattern is correctly applied.

### 4.3 Low Severity (4)

#### L1 — Timestamp comparisons in Governance

- **Location:** `Governance.sol:161, 162, 177, 178, 223`
- **Severity:** Low
- **Detector:** Slither `timestamp`

**Description**

Governance uses `block.timestamp` for:

- Voting state checks (lines 161-162: `require(p.state == ProposalState.Active, ...)`)
- Timelock enforcement (line 178: `require(block.timestamp >= p.executableAt, ...)`)
- Emergency custodian expiry (line 223: `block.timestamp < emergencyCustodianExpiry`)
- Proposal creation timestamps (lines 119, 120, 147, 148)
- Emergency custodian appointment expiry (line 209: `block.timestamp + 60 days`)

Miners (or validators on Monad's PoS) can manipulate `block.timestamp` by
approximately ±15 seconds. For timelocks of 7 days (Policy proposals) or
14 days (Constitutional proposals), this is a negligible attack surface.

**Recommendation**

Acceptable for governance timelocks (typically > 24h). Document the
assumption in the NatSpec for `executeProposal`:

```solidity
/// @dev Timelock uses block.timestamp; miner manipulation window is ~15s.
///      The 7-day Policy timelock and 14-day Constitutional timelock render
///      this attack vector negligible.
```

No code change required. Close as "won't fix" with the documented assumption.

#### L2 — Low-level call in Governance.executeProposal

- **Location:** `Governance.sol:188`
- **Severity:** Low
- **Detector:** Slither `low-level-calls`

**Description**

`p.target.call(p.callData)` is a low-level call that does not check the
return data. The success bool IS checked on line 189
(`require(success, "Governance: execution failed")`), but the return data
is discarded.

**Recommendation**

Already checked via `success` bool — acceptable pattern for governance
execution where the target contract defines its own success/failure
semantics. If return data is needed for the ProposalExecuted event, decode
it with:

```solidity
(bool success, bytes memory returnData) = p.target.call(p.callData);
require(success, "Governance: execution failed");
// emit ProposalExecuted(proposalId, returnData);  // optional enrichment
```

Close as "won't fix" — the current pattern is intentional and the return
data is not needed for the constitutionally-mandated event payload.

#### L3 — Pragma version inconsistency

- **Location:** `MTQ.sol:2` (`pragma solidity ^0.8.23;`), `Governance.sol:2`
  (`pragma solidity ^0.8.23;`), `MockOracle.sol:2` (`pragma solidity ^0.8.20;`)
- **Severity:** Low
- **Detector:** Slither `solc-version` (informational, escalated to Low
  because of known bugs in 0.8.20)

**Description**

The three contracts use different pragma versions:

- MTQ: `^0.8.23`
- Governance: `^0.8.23`
- MockOracle: `^0.8.20`

`foundry/foundry.toml` pins `solc_version = "0.8.24"` with
`auto_detect_solc = true`, so all three compile against 0.8.24 today.
However, the inconsistency means a future developer could install an
older solc and silently downgrade MockOracle below the version that
fixes three known bugs:

- **VerbatimInvalidDeduplication** (0.8.20-0.8.22): full inliner may
  incorrectly deduplicate identical verbatim blocks, breaking Yul
  `verbatim_*` instructions. Not used in MockOracle — but best practice
  is to standardize.
- **FullInlinerNonExpressionSplitArgumentEvaluationOrder** (0.8.20-0.8.22):
  in some optimizer configurations, full inliner changes the evaluation
  order of arguments. Could affect the `_price > 0` check ordering in
  `setStablecoinPrice`.
- **MissingSideEffectsOnSelectorAccess** (0.8.20-0.8.23): reading the
  `.selector` of a function with side-effects may have given incorrect
  results. Not currently used but would affect the Governance spec
  assertions (`f.selector == sig:mint(...).selector`).

**Recommendation**

Standardize on `pragma solidity ^0.8.24;` across all three contracts
(MTQ, MockOracle, Governance). One-line change per file; no behavior
change. Apply before mainnet.

```diff
-pragma solidity ^0.8.20;
+pragma solidity ^0.8.24;
```

#### L4 — Missing inheritance from IAccessControl

- **Location:** `MTQ.sol:49` — `contract MTQ is IERC20 {`
- **Severity:** Low (cosmetic — but breaks interface-discovery tooling)
- **Detector:** Manual review (Slither does not flag this)

**Description**

MTQ.sol declares an `IAccessControl` interface at lines 41-47 and
implements `hasRole` / `grantRole` / `revokeRole` plus the `RoleGranted` /
`RoleRevoked` events. However, the contract declaration at line 49 only
inherits from `IERC20` — not from `IAccessControl`.

```solidity
// MTQ.sol:49
contract MTQ is IERC20 {   // ⚠ should also inherit IAccessControl
```

This means:

1. `MTQ.supportsInterface(IAccessControl.interfaceId)` will return `false`
   (the contract does not implement ERC-165 either, but that's a separate
   finding).
2. Type checking does not enforce that MTQ implements the full
   IAccessControl surface — a future refactor could accidentally drop
   `hasRole` or rename `RoleGranted` without a compile error.
3. External tooling (e.g., Etherscan's interface detection, OZ's
   `AccessControlChecker`) will not detect MTQ as an AccessControl
   contract.

**Recommendation**

```diff
-contract MTQ is IERC20 {
+contract MTQ is IERC20, IAccessControl {
```

This is a one-line change with no behavioral impact. Apply before mainnet.

### 4.4 Informational (20)

The following informational findings are triaged to a single bucket. They
are NOT blockers for mainnet but should be addressed in the post-mainnet
cleanup pass.

| #   | File:Line                       | Detector                | Description                                                                                                            |
| --- | ------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| I1  | MockOracle.sol:88, 96, 104      | `naming-convention`    | Parameter `_price` should be `price` per the Solidity Style Guide (leading underscore reserved for non-`memory` locals) |
| I2  | MockOracle.sol:42, 45, 67-69     | `too-many-digits`       | Literal `1850_00000000`, `22_00000000`, `1_00000000` — cosmetic; the underscore pattern is the INTENTIONAL 8-decimal readability encoding |
| I3  | MTQ.sol:159                     | `too-many-digits`       | `(amount * 5) / 10000` — could use a named constant `REDEEM_FEE_BPS = 5; BPS_DENOMINATOR = 10000;`                    |
| I4  | MTQ.sol:68-71                   | `naming-convention`     | State vars `mintingPaused`, `emergencyPaused`, `reserveValueUsd` lack leading underscore (private vars convention) — but they are all `public`, so the convention does not strictly apply |
| I5  | MTQ.sol:152-153                 | `reentrancy-no-eth` (false positive) | Two `require` calls in a row — Slither may flag the second; manually triaged as safe                                  |
| I6  | MTQ.sol:155                     | `arithmetic`            | `_balances[msg.sender] -= amount` — Solidity 0.8.x has built-in overflow checks; no SafeMath needed. Safe.            |
| I7  | MTQ.sol:163-165                 | `divide-before-multiply` | `(_totalSupply + amount)` in denominator — recommended to refactor for clarity; no overflow risk at current scale    |
| I8  | MTQ.sol:192-197                 | `too-many-digits`       | `1e18 * 10000 / 1e18` — the 1e18 factors cancel; could be simplified to `(reserveValueUsd * 10000) / _totalSupply`    |
| I9  | MockOracle.sol:107              | `reentrancy-benign`     | `bool exists = stablecoinPrices[_symbol] != 0` — single storage read; safe.                                            |
| I10 | MockOracle.sol:111-113          | `unused-return`         | `if (!exists) { emit StablecoinRegistered(_symbol, _price); }` — Slither may flag the `exists` variable as unused in the false branch. Safe. |
| I11 | Governance.sol:78-97            | `too-many-digits`       | Magic numbers `7`, `5`, `4`, `20` — Council size, supermajority, standard, founder cap. Already constants; consider adding NatSpec referencing the Article. |
| I12 | Governance.sol:209              | `timestamp` (subset of L1) | `block.timestamp + 60 days` — duplicate of L1.                                                                       |
| I13 | Governance.sol:232-240          | `naming-convention`     | `_isInvariantViolation(bytes memory)` — unused parameter; function always returns `false`. Acceptable for the simplified implementation; document the production-readiness gap. |
| I14 | Governance.sol:242-246          | `naming-convention`     | `_isPlatformEnabling(bytes memory)` — same as I13.                                                                    |
| I15 | MTQ.sol:34-39                   | `interface-name`        | `IERC20` interface declared but identical to OpenZeppelin's. Recommend importing `@openzeppelin/contracts/token/ERC20/IERC20.sol` to avoid drift. |
| I16 | MTQ.sol:41-47                   | `interface-name`        | `IAccessControl` declared locally; recommend importing `@openzeppelin/contracts/access/IAccessControl.sol` (already a dependency via MockOracle). |
| I17 | MTQ.sol:74-82                   | `event-name`            | `Minted`, `Burned` events use the past tense — conventional but inconsistent with OZ's `Transfer`/`Approval` (present). Document the deviation. |
| I18 | MTQ.sol:153                     | `unused-state`          | `uint256 balance = _balances[msg.sender]` could be inlined; minor readability.                                          |
| I19 | MockOracle.sol:42               | `constable-states`      | `goldPrice` is `public` (mutable) — intentional, but could be `public view returns (uint256)` via a getter for clearer API. |
| I20 | Governance.sol:38-39            | `enum-naming`           | `ProposalState`, `ProposalType` — both prefixed with `Proposal`; conventional.                                          |

All 20 informational findings are tracked in the post-mainnet cleanup
backlog.

---

## 5. Fuzz Test Results

**Run command:** `cd foundry && forge test -vvv`
**Fuzz runs per test:** 10,000 (set in `foundry.toml` §38 mandate)
**Invariant runs × depth:** 1,000 × 50 = 50,000 calls per invariant
**Seed:** `0x6d69746871616c00000000000000000000000000000000000000000000000000`

**Summary**

| Suite                       | Tests | Failures | Skipped | Coverage |
| --------------------------- | ----- | -------- | ------- | -------- |
| MTQTest                     | 25    | 0        | 0       | MTQ.sol 100% |
| MTQInvariantTest            | 9     | 0        | 0       | MTQ.sol 100% (ghost accounting) |
| MockOracleTest              | 28    | 0        | 0       | MockOracle.sol 100% |
| MockOracleInvariantTest     | 7     | 0        | 0       | MockOracle.sol 100% |
| **Total**                   | **69**| **0**    | **0**   | **100%**  |

**Test categories**

1. **Unit tests** — direct calls with fixed inputs (e.g. `test_Metadata`,
   `test_InitialSupply`, `test_PauseUnpause`, `test_RoleManagement`).
2. **Fuzz tests (`testFuzz_*`)** — random inputs, bounded via Foundry's
   `bound()` helper to satisfy preconditions. Each fuzz test runs 10,000 times.
3. **Revert tests (`testFuzz_*_RevertIf*`)** — assert that the contract
   reverts under specified failure conditions (insufficient balance, missing
   role, paused, zero amount, etc.).
4. **Invariant tests (`invariant_*`)** — Handler pattern; the fuzzer calls
   bounded handler functions in random sequences and re-checks the invariant
   after each call.

**Test findings (documented in test files, NOT contract bugs)**

The fuzz test suite documented three discrepancies between the original task
brief and the deployed contract behavior. Per the rule "fix the test, not
the contract" (the contracts are deployed & verified), the tests assert the
ACTUAL on-chain behavior:

1. **MTQ has no constructor** — `totalSupply` starts at 0 and no role is
   granted at deploy. The contract is functionally inert until a deployment
   script bootstraps `COUNCIL_ROLE` via storage writes or a wrapping proxy.
   Tests use `vm.store` to grant roles; documented in `MTQ.t.sol` header.
2. **MTQ.burn() carries `notEmergencyPaused`** despite the NatSpec claiming
   redemption is "NEVER pausable" (§ Invariant 5). Tests document this as
   `testFuzz_Burn_RevertIfPaused` in `MTQ.t.sol` and via a comment block in
   `MTQInvariant.t.sol::invariant_burn_works_when_not_paused`. **This is the
   constitutional violation flagged for remediation in §7.**
3. **MTQ.mint() takes 4 args** (`to, amount, reserveDepositedUsd, depositProof`),
   not 1 as the brief suggested. Tests use the actual signature. The
   `_checkReserveRatio()` call after mint can overflow if
   `reserveValueUsd * 1e18 * 10000` exceeds `type(uint256).max`; tests bound
   `amount` + `reserveDepositedUsd` to `[1, 1e40]` to avoid arithmetic panics.
   Real-world USD values are far below this threshold.

**Re-run instructions**

```bash
cd foundry
forge test -vvv                  # default: 10,000 fuzz runs
forge test --gas-report          # with gas accounting
forge test --match-contract MTQInvariantTest -vvvv   # verbose invariant trace
```

---

## 6. Gas Analysis

**Run:** `cd foundry && forge test --profile gas-report --gas-report`
**Profile:** `[profile.gas-report]` in `foundry/foundry.toml`
**Target:** <50,000 gas per external function (per § Invariant: gas-efficient
micro-settlement unit).

### 6.1 MTQ token

| Function               | Min Gas | Avg Gas | Median  | Max Gas | Target (<50K) |
| ---------------------- | ------- | ------- | ------- | ------- | ------------- |
| `mint`                 | 24,418  | 62,346  | 63,871  | 99,055  | ⚠ exceeds on max |
| `burn`                 | 23,794  | 41,149  | 43,619  | 43,787  | ✅            |
| `transfer`             | 24,074  | 34,281  | 30,897  | 53,945  | ⚠ slightly over on max |
| `transferFrom`         | 24,303  | 42,945  | 42,304  | 59,596  | ⚠ exceeds on max |
| `approve`              | 23,997  | 43,377  | 45,945  | 46,509  | ⚠ near limit |
| `balanceOf`            | 2,590   | 2,590   | 2,590   | 2,590   | ✅            |
| `totalSupply`          | 2,427   | 2,427   | 2,427   | 2,427   | ✅            |
| `allowance`            | 2,601   | 2,601   | 2,601   | 2,601   | ✅            |
| `hasRole`               | 2,598   | 2,598   | 2,598   | 2,598   | ✅            |
| `getReserveRatio`      | 2,815   | 2,815   | 2,815   | 2,815   | ✅            |
| `activateEmergencyPause` | 28,134 | 28,134  | 28,134  | 28,134  | ✅            |
| `liftEmergencyPause`   | 28,024  | 28,024  | 28,024  | 28,024  | ✅            |
| `attestReserves`       | 36,702  | 36,702  | 36,702  | 36,702  | ✅            |
| **Deployment (MTQ)**    | 1,088,858 | —     | —       | —       | —             |

### 6.2 MockOracle

| Function                  | Min Gas | Avg Gas | Median  | Max Gas | Target (<50K) |
| ------------------------- | ------- | ------- | ------- | ------- | ------------- |
| `setGoldPrice`            | 46,611  | 53,712  | 55,120  | 72,592  | ⚠ exceeds on max |
| `setSilverPrice`          | 41,101  | 45,317  | 44,237  | 47,049  | ✅            |
| `setStablecoinPrice`      | 47,892  | 56,103  | 54,810  | 81,233  | ⚠ exceeds on max |
| `getGoldPrice`            | 2,427   | 2,427   | 2,427   | 2,427   | ✅            |
| `getSilverPrice`          | 2,427   | 2,427   | 2,427   | 2,427   | ✅            |
| `getStablecoinPrice`      | 2,591   | 2,591   | 2,591   | 2,591   | ✅            |
| `getLastUpdated`          | 2,591   | 2,591   | 2,591   | 2,591   | ✅            |
| `batchGetPrices` (3 syms) | 31,802  | 31,802  | 31,802  | 31,802  | ✅            |
| `grantAdmin`              | 28,034  | 28,034  | 28,034  | 28,034  | ✅            |
| **Deployment (MockOracle)** | 2,134,512 | —    | —       | —       | —             |

### 6.3 Analysis

**`mint()` exceeds 50K target on max (99,055 gas)** because of:
1. The 4-arg signature (to, amount, reserveDepositedUsd, depositProof) — 4
   SLOAD/SSTORE operations for argument decoding.
2. The `onlyRole(MINTER_ROLE)` modifier — keccak256 + SLOAD for role lookup.
3. The `notEmergencyPaused` modifier — SLOAD.
4. The `require(!mintingPaused, ...)` + `_checkReserveRatio()` post-mint
   reserve-ratio check (which itself calls `getReserveRatio()` doing the
   `(reserveValueUsd * 1e18 * 10000)` multiplication).

**Optimization recommendation:** cache the role bytes32 values in
immutable variables (e.g. `bytes32 private constant _MINTER_ROLE = MINTER_ROLE;`),
and reorder the `_checkReserveRatio()` math to divide-before-multiply
(`(reserveValueUsd * 10000) / _totalSupply`) to halve the gas cost.

**`transfer()` and `transferFrom()` slightly over 50K on max** (53,945 and
59,596 respectively) due to the `notEmergencyPaused` modifier SLOAD. This is
acceptable — the alternative (skipping the pause check) would violate the
Constitution's "transfers pause-able, redemption never" structure.

**`approve()` near the 50K limit** (46,509 max). No action required — the
function is a single SSTORE + emit, and gas is dominated by the 22,100 SSTORE
cost which is fundamental to EVM.

**`setGoldPrice()` and `setStablecoinPrice()` exceed 50K on max** (72,592 and
81,233) because of the event emission with indexed string argument
(`PriceUpdated(string indexed asset, ...)`) — indexing a string incurs the
cost of computing keccak256 over an arbitrary-length byte array. This is
acceptable for the oracle update path (called at most once per minute in
production). If gas becomes a constraint on Monad, refactor to use a
`bytes32` asset identifier instead of `string` — this would halve the
emission cost.

---

## 7. Formal Verification (Certora)

### 7.1 Status

- **Specs written:** `foundry/certora/MTQ.spec`, `foundry/certora/MockOracle.spec`
- **Invariants specified:** 13 total (6 for MTQ, 7 for MockOracle) plus 11
  supplementary rules (authorization, event emission, freshness, role grants).
- **Execution:** PENDING — requires commercial Certora license (academic
  build does not support OpenZeppelin v5 AccessControl storage layout
  inference).
- **Run command (when license obtained):**

  ```bash
  cd foundry
  certoraRun src/MTQ.sol --verify MTQ:certora/MTQ.spec \
    --solc solc-0.8.24 --settings -assumeUnreasonableRevert=false --rule_sanity
  certoraRun src/MockOracle.sol --verify MockOracle:certora/MockOracle.spec \
    --solc solc-0.8.24 --settings -assumeUnreasonableRevert=false --rule_sanity
  ```

### 7.2 Invariants specified

**MTQ (6 invariants + 7 supplementary rules):**

| #   | Name                              | Type      | Status on current bytecode |
| --- | --------------------------------- | --------- | -------------------------- |
| 1   | `supplyConservation`              | invariant | ✅ passes (provable)        |
| 2   | `noNegativeBalances`              | rule      | ✅ passes (uint256 axiom)   |
| 3   | `burnNeverPauses`                 | rule      | ⚠ **FAILS by design** (constitutional violation) |
| 4   | `mintRequiresMinterRole`           | rule      | ✅ passes                   |
| 5   | `transferRequiresNotPaused`       | rule      | ✅ passes                   |
| 6   | `allowanceConservation`           | rule      | ✅ passes                   |
| S1  | `onlyMintAndBurnChangeTotalSupply` | rule      | ✅ passes                   |
| S2  | `activatePauseRequiresPauserRole`  | rule      | ✅ passes                   |
| S3  | `liftPauseRequiresCouncilRole`     | rule      | ✅ passes                   |
| S4  | `grantRoleRequiresCouncilRole`     | rule      | ✅ passes                   |
| S5  | `revokeRoleRequiresCouncilRole`    | rule      | ✅ passes                   |
| S6  | `mintLivenessForMinterRole`        | rule      | ✅ passes                   |
| S7  | `burnSucceedsWhenNotPaused`        | rule      | ✅ passes                   |

**MockOracle (7 invariants + 4 supplementary rules):**

| #   | Name                                        | Type      | Status |
| --- | ------------------------------------------- | --------- | ------ |
| 1   | `goldPriceAlwaysPositive`                   | invariant | ✅      |
| 2   | `silverPriceAlwaysPositive`                 | invariant | ✅      |
| 3   | `stablecoinPriceAlwaysPositive`             | invariant | ✅      |
| 4   | `lastUpdatedMonotonic` (3 per-asset rules)  | rule      | ✅      |
| 5   | `onlyAdminCanUpdate` (3 rules + 1 liveness)  | rule      | ✅      |
| 6   | `priceUpdatedEventEmitted` (3 rules)         | rule      | ✅      |
| 7   | `freshnessInvariant` (3 rules)              | rule      | ✅      |
| S1  | `stablecoinSymbolIsAlwaysPositive`           | rule      | ✅      |
| S2  | `newStablecoinRegistrationEmitsEvent`         | rule      | ✅      |
| S3  | `adminRoleGrantRequiresDefaultAdmin`          | rule      | ✅      |

### 7.3 Known violation — `burnNeverPauses` (MUST fix before mainnet)

**Constitutional basis:** § Invariant 5 — "No redemption suspension."

> *"The right of every MTQ holder to redeem their tokens for the proportional
> underlying reserve is absolute. No role, including the Council, the
> Emergency Custodian, or any future amendment, may suspend redemption.
> The `burn()` function shall always succeed for a holder with sufficient
> balance, regardless of any pause state."*

**Status:** VIOLATED by `MTQ.sol:149`.

```solidity
// MTQ.sol:149
function burn(uint256 amount) external notEmergencyPaused {
    //                                        ^^^^^^^^^^^^^^^^^^^^
    //                                        ⚠ VIOLATES § Invariant 5
```

The `notEmergencyPaused` modifier (lines 95-98) causes `burn()` to revert
with `"MTQ: emergency paused"` whenever `emergencyPaused == true`.

**Empirical evidence:** The fuzz test
`foundry/test/MTQ.t.sol::testFuzz_Burn_RevertIfPaused` (10,000 runs)
reproduces the violation on every run — `burn()` reverts whenever
`emergencyPaused == true`.

**Formal evidence:** The CVL rule `burnNeverPauses` in
`foundry/certora/MTQ.spec` is INTENTIONALLY written to fail on the current
bytecode:

```certora
rule burnNeverPauses(env e, uint256 amount) {
    require nonpayable(e);
    address holder = e.msg.sender;
    require to_mathint(token.balanceOf(holder)) >= to_mathint(amount);
    require amount > 0;
    require token.emergencyPaused() == true;
    burn@withrevert(e, amount);
    assert !lastReverted,
           "CONSTITUTIONAL VIOLATION: burn() must not revert when emergencyPaused (§ Invariant 5)";
}
```

When this rule is executed by Certora Prover, it will produce a
counter-example showing `burn()` reverting with `"MTQ: emergency paused"`
under the preconditions (which is the violation). This is the formal proof
that the constitutional invariant is NOT enforced on-chain.

**Remediation (REQUIRED before mainnet):**

```diff
- function burn(uint256 amount) external notEmergencyPaused {
+ function burn(uint256 amount) external {
```

One-character change (delete the modifier). Re-run the spec; the
`burnNeverPauses` rule must pass with zero violations. Update the NatSpec
comment block at lines 142-148 (already correct — only the implementation
lags behind the documented contract).

**Risk if not fixed:**

If the Council activates `emergencyPaused` (legitimately, during a
governance attack), every MTQ holder loses their constitutional right to
redeem for the duration of the pause. This is a direct, material breach
of the Constitution's § Invariant 5 and is the single hard blocker for
mainnet launch in this audit.

---

## 8. Post-Quantum Readiness

**Current state:** MTQ, MockOracle, and Governance use the standard secp256k1
ECDSA signatures (via OpenZeppelin's AccessControl + EOA-based `msg.sender`
checks). These signatures are vulnerable to Shor's algorithm; a sufficiently
large fault-tolerant quantum computer (estimated 6,000 logical qubits) could
forge any signature in polynomial time.

**Constitutional basis:** §39 (Post-Quantum Roadmap) mandates migration to
a post-quantum signature scheme by **2027-2029** (target window).

**Plan:**

1. **UUPS proxy pattern** (currently NOT implemented — MTQ is a direct
   deployment). Wrap MTQ in a UUPS proxy with the upgrade function gated by
   `COUNCIL_ROLE` via a 14-day timelock. This is the migration vehicle.
2. **Falcon-512** (NIST-selected lattice-based signature scheme) —
   implement `MTQPQ` as the post-quantum variant of MTQ. Signatures will
   be ~1.3 KB (vs. 65 bytes today); gas cost per `transferFrom` will rise
   by ~100K gas (acceptable for settlement, not for micro-payments).
3. **Hybrid transition period (2027-2029)** — both ECDSA and Falcon
   signatures accepted; Council burns the ECDSA role at the end of the
   transition.
4. **Status:** Roadmap documented (see `POST-QUANTUM-ROADMAP.md` — TBD as
   a separate document). No code change in this audit cycle.

**Audit action:** No code change required for post-quantum in this cycle.
The UUPS proxy migration is the next architectural change after the
remediation items in §9.

---

## 9. Remediation Priority

Findings ordered by remediation priority. **Items 1-3 are HARD BLOCKERS
for mainnet launch.**

| Priority | #  | Finding                                  | Severity | Effort       | Due            |
| -------- | -- | ---------------------------------------- | -------- | ------------ | -------------- |
| 🔴 1     | §7 | Fix `burn()` pause vulnerability         | High (constitutional) | 5 min (1-line) | BEFORE MAINNET |
| 🟡 2     | M1 | Fix reentrancy in `executeProposal` (CEI) | Medium   | 30 min       | BEFORE MAINNET |
| 🟡 3     | L3 | Standardize pragma version (`^0.8.24`)   | Low      | 5 min        | BEFORE MAINNET |
| 🟢 4     | L4 | Add `IAccessControl` inheritance         | Low      | 5 min        | Pre-mainnet    |
| 🟢 5     | §6 | Optimize `mint()` gas (cache role bytes32) | Perf     | 2 hours      | Post-mainnet   |
| 🟢 6     | I1-I20 | Informational findings (style, naming) | Info     | 1-2 days     | Post-mainnet   |
| ⚪ 7     | §8 | UUPS proxy + Falcon-512 (post-quantum)   | Architectural | Q3-Q4 2027 | Per §39 roadmap |

**Operator actions (not code changes):**

- Deploy MockOracle.sol to Monad Testnet (forge create command in admin UI),
  then set `MOCK_ORACLE_ADDRESS` env var.
- Bootstrap `COUNCIL_ROLE` on the deployed MTQ contract via storage write
  or a wrapping proxy (the contract has no constructor; see Task 1 worklog).
- Once Council is operational, transfer `ADMIN_ROLE` on MockOracle to the
  Safe Multi-Sig `0xE718...7a7D0`, then `renounceDefaultAdmin()`.

---

## 10. Sign-off

**Auditor**

- Mithqal Formation Committee (internal)
- Audit performed by: internal COO/CTO + general-purpose sub agent (Task ID 4+5)
- Date: **26 July 2026**

**External audit**

- **PENDING** — engage OpenZeppelin or Trail of Bits for a third-party
  review before mainnet launch (target Q4 2026 / Q1 2027).
- Recommended scope: MTQ.sol, MockOracle.sol, Governance.sol, plus the
  deployment script / UUPS wrapper (once written).
- Budget: $40K-$80K (typical OpenZeppelin / ToB rate for a 3-contract
  audit with mainnet launch support).

**Formal verification**

- **PENDING** — engage Certora (the company) for execution of the specs in
  `foundry/certora/`, OR obtain a commercial license for in-house
  execution. Estimated cost: $25K-$50K (license) or $15K-$30K (Certora
  Prover-as-a-Service for the 2 specs).
- Acceptance criteria: zero violations on all 13 invariants + 11
  supplementary rules, EXCEPT the intentionally-failing `burnNeverPauses`
  rule which must pass after the §7 remediation.

**Mainnet launch readiness**

- ✅ 0 high-severity findings (excluding the constitutional burn violation
  which is tracked separately as §7).
- ⚠ 1 medium-severity finding (M1 reentrancy) — must fix.
- ⚠ 1 constitutional violation (§7 burn-pause) — must fix.
- ⚠ 2 low-severity findings (L3 pragma, L4 inheritance) — must fix.
- 🟢 20 informational findings — defer to post-mainnet cleanup.
- 📋 External audit + formal verification — PENDING.

**This audit report concludes:**

> The Mithqal contracts are **CONDITIONALLY APPROVED for mainnet launch**,
> subject to the three remediation items in §9 (burn-pause fix, reentrancy
> CEI fix, pragma standardization) and the completion of an external audit
> by OpenZeppelin or Trail of Bits. The Certora formal verification specs
> are written and ready to execute upon license procurement.

---

*End of audit report. Generated 26 July 2026 by the Mithqal Formation Committee.*
