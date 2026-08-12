# Reserve Portfolio Risk Report

**Report Date:** 2026-08-09
**Author:** Monetary-System Risk Architect / Financial Stability Analyst / Chief Economist (acting in concert)
**Authority:** §8, §17 of the reserve dynamicity implementation specification; MITHQAL Constitution Articles III, V, IX, XIII
**Status:** COMPLETE — portfolio-level risk architecture verified

---

## Executive Summary

The MITHQAL reserve portfolio risk architecture is **comprehensively implemented** across multiple modules. The system measures portfolio-level risk via the Constitutional Risk Index (CRI), Liquidity Coverage Ratio (LCR), Liquidity Readiness Ratio (LRR), and 20 stress lab scenarios. **One minor gap:** explicit drawdown metric is not exposed as a named output (derivable from historical data).

---

## §8 — Reserve Diversification

### Portfolio-Level Optimization Approach

The MITHQAL engine does **not** run its own mean-variance optimizer. Instead, it delegates the portfolio choice to the global central-bank community via COFER (IMF Currency Composition of Foreign Exchange Reserves) as the primary structural weight input (α = 0.50).

**Rationale:** This is more robust than running MITHQAL's own optimizer because:
1. COFER reflects what 150+ central banks actually hold — delegated expertise
2. It avoids model risk (no optimization algorithm to bug)
3. It avoids discretion (no operator-tunable parameters)
4. It is transparent and auditable (COFER is published quarterly by the IMF)

### Diversification Mechanisms (Verified)

| Mechanism | Implementation | Effect |
|---|---|---|
| Concentration cap | W_i ≤ 60% | No single currency dominates |
| Minimum floor | W_i ≥ 0.5% | All eligible currencies represented |
| Multi-source structural weight | COFER + SWIFT + BIS | Captures reserve-market depth, trade flows, settlement relevance |
| Momentum bound | M_i ∈ [0.95, 1.05] | Limits per-step weight change |
| Mean reversion | R_i pulls toward LTA | Counteracts momentum chasing |
| Shock absorber | A_t ∈ [0.5, 1.0] | Dampens during high vol |
| Liquidity overlay | L_i adjusts for relative liquidity | Prevents illiquid currency over-allocation |
| Custodian diversification | ≤ 25% per custodian, ≤ 30% per jurisdiction | Custody-side diversification |
| Multi-custodian fleet | Minimum 3 custodians | Operational redundancy |

### Spec §8 Compliance

| Spec Requirement | Status |
|---|---|
| Evaluates "which combination of assets produces the most resilient reserve" | ✅ Via COFER delegation + concentration cap + floor |
| Individual asset strength | ✅ Momentum M_i |
| Portfolio-level volatility | ✅ EWMA σ_t + shock absorber A_t |
| Correlation | ⚠️ Implicit via COFER diversification; no explicit correlation matrix |
| Liquidity | ✅ L_i overlay + LCR + LRR |
| Concentration | ✅ 60% cap + 0.5% floor + custodian/jurisdiction caps |
| Stress resilience | ✅ 20 stress lab scenarios + 13 fixed tests + 5 historical replays |
| Redemption capacity | ✅ LRR (Article XIII) |

---

## §17 — Portfolio-Level Test

### Measured Metrics

| Metric | Implementation | File:Line | Status |
|---|---|---|---|
| NAV stability | `computeNAV()` → NAV_m, NAV_l, NAV_stress | `monetary-engine-v19.ts:105-119` | ✅ |
| Reserve coverage | `computeReserveRatio()` → RR + compliant | `monetary-engine-v19.ts:150-166` | ✅ |
| Volatility | EWMA σ_t per currency + basket | `monetary-engine-v19.ts:395-405` | ✅ |
| Concentration | `verifyBasket()` checks W_i ∈ [0.5%, 60%] | `monetary-engine-v19.ts:551-569` | ✅ |
| Liquidity | LCR (§5); LRR (Article XIII) | `monetary-engine-v19.ts:179-206`, `lrr.ts` | ✅ |
| Drawdown | **Not explicitly computed** | — | ⚠️ GAP (derivable from Turso DB) |
| Redemption capacity | LRR; 30-day redemption demand | `lrr.ts:217` | ✅ |
| Stress resilience | 20 stress lab + 13 fixed tests | `stress-lab-scenarios.ts`, `stress-test-fixed.ts` | ✅ |
| Rebalance turnover | Expected execution cost tracking | `rebalance-fees.ts` | ✅ |

### Constitutional Risk Index (CRI)

`computeCRI()` in `monetary-engine-v19.ts:270-301` — RMS aggregation across 5 risk dimensions:

```
CRI = √(Σ w_i × x_i²)
```

Where x_i represents: liquidity risk, FX risk, counterparty risk, operational risk, concentration risk.

### Liquidity Coverage Ratio (LCR)

`computeLCR()` in `monetary-engine-v19.ts:179-206`:

```
LCR = HQLA / 30-day net outflow
```

- `compliant` ≥ 1.00
- `strong` ≥ 1.20

### Liquidity Readiness Ratio (LRR)

`lrr.ts:405` — full implementation of Article XIII:

```
LRR = Immediately Available Liquidity / Expected 30-Day Redemption Demand
```

| Threshold | Level |
|---|---|
| ≥ 1.2 | Strong |
| ≥ 1.0 | Compliant |
| ≥ 0.9 | Marginal |
| < 0.9 | Critical (emergency) |

**Gold and silver are EXCLUDED from LRR** by constitutional design (Bullion Protection Rule — they are the last-resort strategic reserve, not immediately available liquidity).

---

## Portfolio-Level Stress Tests

| Test | File | What It Measures |
|---|---|---|
| Constitutional Stress Lab | `stress-lab-scenarios.ts` | 20 scenarios — portfolio resilience |
| Constitutional Stress Engine | `tests/constitutional-stress-engine.ts` | CCAR Severely Adverse, Monte Carlo 100K paths |
| Federal Institutional Tests | `tests/federal-institutional-tests.ts` | 5 historical crisis portfolio replays |
| Financial Soundness | `tests/financial-soundness-tests.ts` | CCAR Base/Adverse/Severely Adverse, BASEL III |
| Multi-currency NAV | `stress-test-fixed.ts` | Portfolio NAV under multi-currency stress |
| E2E Workflow | `e2e-workflow-tests.ts` | Portfolio-level cross-border settlement |

---

## Decision Summary

| Item | Decision |
|---|---|
| COFER-based structural weight (delegated portfolio optimization) | **KEEP** — more robust than own optimizer |
| Concentration cap + floor | **KEEP** |
| CRI (RMS aggregation) | **KEEP** |
| LCR | **KEEP** |
| LRR (full implementation) | **KEEP** |
| 20 stress lab scenarios | **KEEP** |
| Portfolio-level metrics | **KEEP** |
| Explicit correlation matrix | **DO NOT IMPLEMENT** — COFER delegation is sufficient |
| Mean-variance optimizer | **DO NOT IMPLEMENT** — adds model risk + discretion |
| Drawdown metric | **ADD** (minor — expose as named output from historical NAV series) |

---

## No Code Changes Made

This report is **read-only**. The portfolio risk architecture is preserved as-is. The COFER-based delegation approach is more robust than running MITHQAL's own optimizer.
