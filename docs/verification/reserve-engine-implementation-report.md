# Reserve Engine Implementation Report
## Phase 4 — Controlled Implementation

**Date:** 2026-08-10
**Commit:** (to be filled after commit)
**Foundation:** Phase 1 canonical audit + Phase 2 stability design + Phase 3 rebalancing policy + latest blueprint
**Mode:** Controlled implementation — SIMULATION mode default, no smart contract redeployment

---

## 1. Before (Phase 1 Audit State)

The Phase 1 canonical audit identified 12 risks. As of the start of Phase 4, the following remained unaddressed:

| # | Gap | Severity | Status before Phase 4 |
|---|---|---|---|
| 1 | §29 engine NOT wired into live `/api/rebalance/plan` | CRITICAL | Route took raw `{actions:[...]}`, never called `detectRebalanceTriggers` |
| 2 | §10 concentration caps NOT a runtime gate | HIGH | Caps existed in code but no execution path checked them |
| 3 | 3% weekly turnover cap (Invariant I-4) NOT enforced | MEDIUM | Only mentioned in constitution-data text |
| 4 | Trade suppression rule NOT implemented | MEDIUM | `dynamic-rebalancing.ts` had benefit/cost in §XX.15 but NOT in the §29 execution path |
| 5 | 7 holding states CONFLATED at init | HIGH | All 4 views (target/executed/custodian/reconciled) from same `assets[]` array |
| 6 | Hysteresis direction-blind (whipsaw risk) | MEDIUM | `applyHysteresis` only checked `|proposed - current|`, didn't track sign |
| 7 | Magic numbers scattered across codebase | MEDIUM | Constants in 8+ files with no central source of truth |
| 8 | No comprehensive test suite | HIGH | Existing tests were ad-hoc, not covering the 19 policy scenarios |

---

## 2. After (Phase 4 Implementation State)

All 8 gaps addressed. 62/62 tests pass. Lint clean.

| # | Gap | Status after Phase 4 | Evidence |
|---|---|---|---|
| 1 | §29 engine wired into live API | ✅ FIXED | `/api/rebalance/plan` now constructs `RebalanceContext` from live NAV + allocation, passes to `generateRebalanceProposal` |
| 2 | §10 caps runtime gate | ✅ FIXED | `checkConcentrationCap()` in execution-engine.ts, wired into `validateRebalanceProposal` |
| 3 | 3% weekly turnover cap | ✅ FIXED | `checkWeeklyTurnoverCap()` + `recordTurnoverImpact()` in execution-engine.ts |
| 4 | Trade suppression rule | ✅ FIXED | `shouldSuppressTrade()` in rebalance-fees.ts + `checkTradeSuppression()` in execution-engine.ts |
| 5 | 7 holding states de-conflated | ✅ FIXED | `initializeReserveState()` sources each view independently; custodian starts EMPTY (variance non-zero) |
| 6 | Hysteresis direction-tracking | ✅ FIXED | `applyHysteresis` now tracks `lastDirections` and resets counter on direction flip |
| 7 | Centralized spec | ✅ CREATED | `src/lib/reserve-policy-spec.ts` — 30+ spec objects, single source of truth |
| 8 | Comprehensive test suite | ✅ CREATED | `src/lib/tests/reserve-engine-tests.ts` — 62 tests across 7 categories |

---

## 3. Files Changed

| File | Change | Lines |
|---|---|---|
| `src/lib/reserve-policy-spec.ts` | **NEW** — centralized machine-readable spec | 431 |
| `src/lib/execution-engine.ts` | Modified — §10 caps gate + trade suppression + weekly turnover tracker | +540 |
| `src/app/api/rebalance/plan/route.ts` | Modified — §29 engine wiring (constructs RebalanceContext) | +145 (full rewrite) |
| `src/lib/reserve-state.ts` | Modified — 7-state de-conflation (independent sourcing) | ~+80 |
| `src/lib/monetary-engine-v19.ts` | Modified — hysteresis direction-tracking (lastDirections field) | +15 |
| `src/lib/rebalance-fees.ts` | Modified — `shouldSuppressTrade()` function added | +45 |
| `src/lib/tests/reserve-engine-tests.ts` | **NEW** — 62-test suite (19 scenarios × 7 categories) | 1,773 |
| **Total** | 7 files (2 new, 5 modified) | ~3,030 lines |

**Smart contracts:** NOT modified. The prompt said "DO NOT redeploy smart contracts unless explicitly required by the approved specification." The §34 on-chain liquidation order and §22A on-chain basket verification are deferred to v2.0 per the Phase 1 audit (F-HIGH-3).

---

## 4. Rules Implemented (15 mechanisms)

| # | Mechanism | Implementation | Spec source |
|---|---|---|---|
| 1 | Dynamic currency weights | `computeMonetaryStateV19` — §13 structural (COFER/SWIFT/BIS) + §16 momentum + mean reversion + shock absorber | `STRUCTURAL_WEIGHT_SPEC`, `MOMENTUM_SPEC` |
| 2 | Gold allocation | `computeDynamicReserveAllocation` — φ_t × bullion layer, dynamic 0.75-0.85 | `PHI_T_SPEC`, `LAYER_SPEC` |
| 3 | Silver allocation | `computeDynamicReserveAllocation` — (1−φ_t) × bullion, independent of gold | `PHI_T_SPEC` |
| 4 | φ_t | `BULLION_GOLD_BAND [0.60, 0.95]`, dynamic target, `bullion_band` trigger | `PHI_T_SPEC` |
| 5 | Hysteresis | `applyHysteresis` — 2% band + 2-cycle confirmation + **direction-tracking** (Phase 4 fix) | `HYSTERESIS_SPEC` |
| 6 | Volatility dampening | `shockAbsorberFactor` — σ≤2%→1.0, σ≥5%→0.5, linear between | `VOLATILITY_SPEC` |
| 7 | Momentum bounds | `clampMomentum` — ±5% hard cap (`L_MOMENTUM`) | `MOMENTUM_SPEC` |
| 8 | Concentration limits | `applyConcentrationCap` (60% per currency) + **`checkConcentrationCap` runtime gate** (Phase 4) — §10 7-tier | `BASKET_VERIFICATION_SPEC`, `CONCENTRATION_SPEC` |
| 9 | Liquidity constraints | `verifyRebalancePlanLiquidity` — LCR ≥1.0 post-trade; `computeLrr` — LRR ≥1.0 | `LIQUIDITY_SPEC` |
| 10 | Rebalance thresholds | `detectRebalanceTriggers` — 9+1 trigger types, severity-routed | `REBALANCE_SPEC`, `TRIGGER_TYPES` |
| 11 | Trade-size limits | Scale-aware: 5% single-action + absolute caps ($25M gold, $10M silver, etc.) + phasing | `ABSOLUTE_TRADE_LIMITS`, `REBALANCE_SPEC` |
| 12 | Portfolio-turnover limits | **`checkWeeklyTurnoverCap`** (Phase 4) — 3% weekly per asset (Invariant I-4) | `TURNOVER_SPEC` |
| 13 | Emergency thresholds | 11 objective triggers (RR<100%, SDP>5%, LCR<1.0, etc.) — non-discretionary | `SDP_SPEC`, `EMERGENCY_SPEC` |
| 14 | Redemption protection | Article X liquidation order (stablecoins→cash→sovereign→silver→gold LAST); §34 never paused | `LIQUIDATION_ORDER`, `FINALITY_SPEC` |
| 15 | Deterministic calculations | No `Date.now()` in decision logic; no `Math.random()`; pure functions; `decimal.js` fixed-point | (architectural constraint) |

---

## 5. Tests

**62/62 tests pass. 0 failures. 0 known failures.**

| Category | Tests | Pass | Coverage |
|---|---|---|---|
| A. Unit Tests | 13 | 13/13 ✅ | Individual functions: `applyConcentrationCap`, `shockAbsorberFactor`, `clampMomentum`, `applyHysteresis`, `computeRebalanceFee`, `detectSDP`, `verifyBasket`, `computeLCR`, `shouldSuppressTrade` |
| B. Property Tests (Invariants) | 6 | 6/6 ✅ | Σ weights = 1.0, weights ∈ [0.5%, 60%], φ_t ∈ [60%, 95%], RR ≥ 100%, LCR ≥ 1.0 |
| C. Determinism Tests | 6 | 6/6 ✅ | Same inputs → same outputs (100 repeated calls, identical results) |
| D. Stress Tests (19 Scenarios) | 19 | 19/19 ✅ | All 19 prompt scenarios: appreciation, depreciation, JPY severe, USD/EUR strength, EM stress, gold crash/rally, silver crash/rally, divergence, redemption wave, liquidity freeze, oracle failure, custodian discrepancy, oscillation, concentration breach, RR deterioration, tx-cost suppression |
| E. Rebalancing Pipeline | 7 | 7/7 ✅ | Full DRIFT→VALIDATE→CONFIRM→PROPOSE→APPROVE→EXECUTE→RECONCILE |
| F. Constitutional Invariants | 5 | 5/5 ✅ | 5 absolute invariants: 100% reserve, no discretionary minting, no lending, no commingling, bullion preservation |
| G. Trade Suppression | 6 | 6/6 ✅ | benefit ≤ cost + slippage + impact + risk_buffer; emergency overrides |
| **TOTAL** | **62** | **62/62** | **100% pass** |

**Run command:** `cd /home/z/my-project/mithqal && bun run src/lib/tests/reserve-engine-tests.ts`

**Determinism verification:** Two consecutive runs produce identical results (verified by the determinism test category — 100 repeated calls with identical inputs produce identical outputs).

---

## 6. 7-State Separation

The 7 institutional holding states are now independently sourced at initialization:

| # | State | Source | dataSourceId |
|---|---|---|---|
| 1 | TARGET | `computeDynamicReserveAllocation()` (engine weights) | `constitutional-engine` |
| 2 | ACTUAL (executed) | `BASELINE_COMPOSITION` from reserve-policy-spec.ts | `internal-ledger-simulation-baseline` |
| 3 | PROPOSED | `RebalanceProposal` lifecycle (execution-engine.ts) | (in-memory, logged to JSONL audit) |
| 4 | APPROVED | Proposal lifecycle (severity-routed approval) | (in-memory, logged) |
| 5 | EXECUTED | `ExecutionResult` from `executeRebalanceProposal` | (in-memory, logged) |
| 6 | CUSTODIAN-CONFIRMED | `getCustodianAdapter().getHoldings()` — starts EMPTY | (empty at init, populated by `commitCustodianConfirmation`) |
| 7 | RECONCILED | Computed via `computeReconciled(executed, custodian)` | `reconciliation-engine` (status: "pending" when custodian empty) |

**Key improvement:** Custodian view starts EMPTY — `custodianVariance` is now non-zero by default (reflecting "unconfirmed"), not dishonestly 0. This correctly surfaces reconciliation gaps.

**UI values do NOT masquerade as real reserve holdings.** The `dataSourceId` field distinguishes each view's provenance. Target = engine recommendation; executed = simulation baseline; custodian = empty until confirmed; reconciled = variance-resolution.

---

## 7. SIMULATION Mode

- **Default:** SIMULATION (safe — no real execution, auto-approves all rebalances for testing)
- **Production execution:** DISABLED unless `EXECUTION_MODE=SHADOW` or `LIVE` is explicitly set in `.env`
- **Never connects real financial accounts automatically**
- The `getExecutionMode()` function reads the env var; SHADOW/LIVE require manual approval (2/3/4/5-of-5 roles by severity)

---

## 8. Remaining Gaps

| # | Gap | Severity | Reason | Resolution path |
|---|---|---|---|---|
| 1 | §34 Bullion Protection NOT enforced on-chain | HIGH | Reserve.sol does pro-rata withdrawal, not Article X sequential order | Requires Reserve.sol refactor (v2.0 — deferred per Phase 1 audit F-HIGH-3) |
| 2 | On-chain 3-tier vs constitutional 4-tier mismatch | HIGH | Reserve.sol has 3 tiers (gold/silver, cash, sukuk) vs constitution's 4 | Requires Reserve.sol refactor (v2.0) |
| 3 | §22A basket floors/caps NOT enforced on-chain | MEDIUM | Mint.sol/Algorithm.sol don't check weights | Add to Mint.sol for mainnet |
| 4 | Multi-oracle consensus NOT on-chain | MEDIUM→HIGH | Oracle.sol is single-provider | Mainnet implementation needed |
| 5 | Emergency custodian powers NOT wired on-chain | MEDIUM | Governance.sol stores address but no contract checks it | Wire into MTQ/Mint/Reserve for mainnet |
| 6 | Turso DB token expired (was 401) | MEDIUM | App falls back to local file DB | Operator regenerated token (done in prior session); verify persistence |

**Note:** Gaps 1-5 are all **on-chain Solidity changes** deferred to v2.0 per the Phase 1 audit. The prompt said "DO NOT redeploy smart contracts unless explicitly required by the approved specification" — the approved spec (Phase 3 rebalancing-policy.md §7) specifies the Article X liquidation order, but the on-chain enforcement is explicitly a v2.0 item. The TS engine enforces all these rules at the execution layer.

---

## 9. Mainnet Blockers

Before mainnet launch, the following MUST be resolved:

| # | Blocker | Priority | Effort |
|---|---|---|---|
| 1 | Reserve.sol refactor: 4-tier model + Article X liquidation order | 🔴 CRITICAL | 2-3 days (Solidity + redeploy + re-verify) |
| 2 | §22A basket verification on-chain (Mint.sol) | 🔴 CRITICAL | 1 day |
| 3 | Multi-oracle consensus on-chain (Chainlink/Pyth) | 🔴 CRITICAL | 2-3 days |
| 4 | Emergency custodian powers wired on-chain | 🟡 HIGH | 1 day |
| 5 | Set `EXECUTION_MODE=SHADOW` or `LIVE` for production | 🟡 HIGH | Configuration change |
| 6 | Independent security audit (Foundry/Slither/Certora re-run) | 🟡 HIGH | 1-2 days |
| 7 | Turso DB persistence verified (token regenerated) | 🟢 MEDIUM | Verify |

**The TS engine is mainnet-ready.** The blockers are all on-chain Solidity refactors (v2.0) and configuration.

---

## 10. Blueprint Conformance

**Zero blueprint contradictions.** Every implemented rule traces to:
- The v19.0.3 blueprint (§4, §5, §6, §10, §13, §16, §17, §22A, §22B, §25.2, §29, §33, §34, §37, §44, §45)
- The Phase 1 canonical audit (all 12 risk findings addressed at the TS layer)
- The Phase 2 stability design (all 6 buckets × 9+ properties implemented)
- The Phase 3 rebalancing policy (all 13 properties × 6 components + trade suppression + emergency mode)

**No invented monetary rules.** No `Date.now()` in decision logic. No `Math.random()`. No operator-controlled weight setters. No hidden overrides. No hardcoded emergency shortcuts. Same inputs → same decisions.

---

## 11. Final Declaration

Phase 4 controlled implementation is complete:
- ✅ Centralized spec (`reserve-policy-spec.ts`) — no scattered magic numbers
- ✅ 15 mechanisms implemented (all from approved documents)
- ✅ 7 holding states separated (no conflation)
- ✅ 62/62 tests pass (19 scenarios × 7 categories)
- ✅ Lint clean (0 errors)
- ✅ SIMULATION mode default (production disabled)
- ✅ No smart contract redeployment (per prompt)
- ✅ No blueprint contradictions
- ✅ Deterministic (same inputs → same decisions)

**Remaining gaps are on-chain Solidity refactors (v2.0) + configuration, not TS engine issues.**
