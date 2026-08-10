# On-Chain Constitutional Reserve Alignment
## Phase 5 — Architecture Document

**Date:** 2026-08-10
**Status:** Source code aligned — NOT deployed (per §37, deployment requires explicit authorization)
**Foundation:** Phase 1-4 approved documents + latest blueprint (v19.0.3)

---

## 1. Previous Architecture

The legacy `Reserve.sol` had a **3-tier model that contradicted the constitutional 4-tier model** (documented as F-HIGH-3 in the Phase 1 canonical audit):

| Legacy on-chain | Constitutional (blueprint) | Mismatch |
|---|---|---|
| Tier 1 = gold/silver | Tier 1 = Cash | WRONG asset class |
| Tier 2 = cash | Tier 2 = Sovereign | WRONG asset class |
| Tier 3 = sukuk | Tier 3 = Bullion (gold+silver) | WRONG asset class |
| (missing) | Tier 4 = Stablecoins | MISSING tier |

**Liquidation:** Pro-rata across all tiers (WRONG — Article X requires sequential: stablecoins → cash → sovereign → silver → gold LAST).

**Basket verification:** NOT implemented on-chain.

**Approval binding:** No proposal hash binding — approvals were not cryptographically linked to exact trade parameters.

---

## 2. Identified Contradictions

| # | Contradiction | Blueprint reference | Severity |
|---|---|---|---|
| 1 | On-chain 3-tier vs constitutional 4-tier | §22-26, Article III | HIGH |
| 2 | Pro-rata liquidation vs Article X sequential order | Article X, §34, Invariant 5 | CRITICAL |
| 3 | No §22A basket verification on-chain | §22A | HIGH |
| 4 | No approval hash binding (proposal can be altered post-approval) | §14, §29.2 | HIGH |
| 5 | No replay protection for proposals | §29.12 | MEDIUM |
| 6 | Oracle aliases bypass staleness (FIXED in prior task) | §31.4 | RESOLVED |
| 7 | SIMULATION auto-approve default (FIXED in prior task) | §29.2 | RESOLVED |

---

## 3. Exact Modifications

### 3.1 Reserve.sol — Full Refactor

**Tier model:** 3 tiers → 4 constitutional tiers + gold/silver split:

| Variable | Tier | Constitutional range | Policy target |
|---|---|---|---|
| `tier1CashUsd` | Tier 1: Central-Bank-Quality Cash | 25-60% | 40% |
| `tier2SovereignUsd` | Tier 2: Short-Duration Sovereign | 20-50% | 35% |
| `tier3GoldUsd` | Tier 3: Gold (within bullion) | φ_t ∈ [60%, 95%] of bullion | 80% of bullion |
| `tier3SilverUsd` | Tier 3: Silver (within bullion) | (1−φ_t) ∈ [5%, 40%] | 20% of bullion |
| `tier4StablecoinUsd` | Tier 4: Stablecoins | 0-10% | 5% |

**Liquidation order:** Pro-rata → Article X sequential:
1. Tier 4 (stablecoins) — until exhausted
2. Tier 1 (cash) — until exhausted
3. Tier 2 (sovereign) — until exhausted
4. Tier 3 Silver — until exhausted
5. Tier 3 Gold — LAST, requires Exhaustion Certificate (Invariant 5)

**Gold protection:** `goldLiquidationAuthorized` flag (false by default). Council must call `authorizeGoldLiquidation(certificateHash)` to enable. Auto-revoked after one liquidation event (single-use certificate).

**§22A basket verification:** `verifyBasket(totalBps, maxBps, minBps)` — on-chain check that proposed weights satisfy: Σ=10000, max≤6000, min≥50. Does NOT compute weights (off-chain engine does that) — only VERIFIES constitutional bounds.

**Approval binding:** `recordApproval(proposalHash)` + `verifyAndExecuteProposal(proposalHash)` — proposal hash binds to exact trade parameters. Changing any parameter → different hash → approval invalidated. `executedProposalHashes` mapping prevents replay.

### 3.2 Oracle.sol — Staleness Fix (prior task, confirmed)

`getGoldPrice()` and `getSilverPrice()` now enforce `MAX_STALENESS` (1 hour). Previously bypassed.

### 3.3 TS Engine — Liquidity/RR Verifiers Wired (prior task, confirmed)

`verifyRebalancePlanLiquidity()` and `verifyRebalancePlanReserveRatio()` now called in `validateRebalanceProposal()`.

### 3.4 EXECUTION_MODE Production Gate (prior task, confirmed)

`getExecutionMode()` refuses SIMULATION when `NODE_ENV=production`.

---

## 4. Off-Chain / On-Chain Boundary

The blockchain does NOT reproduce the macroeconomic model. The boundary is:

| Layer | Responsibility | Does NOT do |
|---|---|---|
| **Off-chain engine** | COFER/SWIFT/BIS, momentum, volatility, φ_t, SDP, hysteresis, trade suppression, fees | Does NOT enforce constitutional invariants |
| **Institutional governance** | Approval (2/3/4/5-of-5 by severity), Council resolutions | Does NOT compute monetary policy |
| **On-chain (Reserve.sol)** | RR ≥ 100%, basket bounds, sequential liquidation, gold protection, approval hash binding, replay protection | Does NOT compute weights, momentum, or φ_t |
| **Custodian** | Physical/institutional transaction completion | Does NOT determine reserve policy |
| **Reconciliation** | Verify reality matches authorized state | Does NOT execute trades |

---

## 5. Reserve-State Model (7 States)

The 7 states are maintained independently in the TS engine (`reserve-state.ts`):

| # | State | Source | Persisted? |
|---|---|---|---|
| 1 | TARGET | `computeDynamicReserveAllocation()` | No (recomputed) |
| 2 | ACTUAL (executed) | `BASELINE_COMPOSITION` (SIMULATION) / committed ledger (production) | In-memory (mainnet: persist to DB) |
| 3 | PROPOSED | `RebalanceProposal` lifecycle | In-memory (logged to JSONL audit) |
| 4 | APPROVED | Governance vote | In-memory (logged) |
| 5 | EXECUTED | `ExecutionResult` | In-memory (logged) |
| 6 | CUSTODIAN-CONFIRMED | `getCustodianAdapter().getHoldings()` — starts EMPTY | In-memory (mainnet: persist) |
| 7 | RECONCILED | `computeReconciled(executed, custodian)` | In-memory |

**Mainnet gap:** States 2, 3, 4, 5, 6 are in-memory. A process restart loses them. The §29.10 audit ledger IS persisted (JSONL), but is not replayed on restart. Mainnet requires persisting these to a durable store (Turso DB / Postgres).

---

## 6. Remaining Gaps

| # | Gap | Severity | Resolution |
|---|---|---|---|
| 1 | Reserve.sol NOT deployed (source only) | 🔴 BLOCKER | Explicit deployment authorization + storage migration |
| 2 | Mint.sol not updated to call verifyBasket | 🟡 HIGH | Add basket verification call before minting |
| 3 | In-memory state not persisted | 🟡 HIGH | Persist to Turso DB / Postgres |
| 4 | No `validUntil` on proposals (expired approvals) | 🟡 HIGH | Add `validUntilMs` field to RebalanceProposal |
| 5 | Proposal hash not computed in TS engine | 🟡 HIGH | Implement `computeProposalHash()` in execution-engine.ts |
| 6 | Foundry not installed (can't run Solidity tests) | 🟡 MEDIUM | Install forge for contract testing |
| 7 | Multi-oracle consensus not on-chain | 🟡 HIGH | Chainlink/Pyth integration for mainnet |

---

## 7. Mainnet Blockers

1. **Deploy refactored Reserve.sol** — requires explicit authorization, storage migration plan, and full contract test suite
2. **Update Mint.sol** to call `verifyBasket()` + `verifyAndExecuteProposal()` before minting
3. **Implement `computeProposalHash()`** in TS engine + wire to on-chain `recordApproval()`
4. **Persist in-memory state** to durable store
5. **Add `validUntil`** to proposals (expired approval protection)
6. **Multi-oracle consensus** on-chain (Chainlink/Pyth)
7. **Independent security audit** (Foundry/Slither/Certora re-run)

---

## 8. Certification Standard

**Current status: TESTNET READY**

- ✅ TS engine: 62/62 tests pass + 42/48 adversarial (6 known) + 54/59 cross-page (5 known, 0 true failures)
- ✅ SIMULATION mode default (safe)
- ✅ All pages wired to live API data
- ✅ 7-state separation
- ✅ Liquidity/RR verifiers wired
- ✅ Oracle staleness fixed
- ✅ Reserve.sol source refactored (4-tier + Article X + basket + approval binding)
- ⚠️ Reserve.sol NOT deployed
- ⚠️ In-memory state not persisted
- ⚠️ Proposal hash not computed in TS

**NOT mainnet ready.** The TS engine is institutionally sound; the on-chain layer requires deployment + integration.
