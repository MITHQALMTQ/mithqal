# MITHQAL — Mathematical Reconciliation

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`
**Method:** Independent recalculation using Python with production oracle values from `/api/nav` and `/api/transparency`

## Mathematical Reconciliation Table

| Metric | Blueprint (v23 §) | Code (file:line) | DB | /api/nav | /api/transparency | Independent Calc | Match? |
|--------|-------------------|------------------|----|----------|--------------------|--------------------|--------|
| PAR | $1.00 fixed (§3.1) | `monetary-engine-v19.ts:124` | N/A | Not returned | `institutionalMetrics.par: 1` | $1.00 | ✅ (conflicts with testnet-engine.ts:85 "PAR removed") |
| Supply (S) | 54,000,000 (§3.1) | `nav-compute.ts:61` | ✅ empty | 54,000,000 | `testnet.supply: 0` | 54,000,000 | ❌ On-chain = 310.95 MTQ |
| Liability (L) | $54,000,000 | `monetary-engine-v19.ts:160` | N/A | Not returned | $50,000,000 | $54,000,000 | ❌ Transparency reports $50M (testnet supply) |
| R_m | Σ Q×P (§3.3) | `monetary-engine-v19.ts:79` | N/A | $61,248,402 | $61,248,402 | $61,248,401.66 | ✅ EXACT |
| R_a | Σ Q×P×(1-H)×C (§3.3) | `monetary-engine-v19.ts:82` | N/A | $59,675,301 | $59,675,301 | $59,675,301.07 | ✅ EXACT |
| R_l | Σ Q×P×(1-H)×C×S (§3.3) | `monetary-engine-v19.ts:85` | N/A | Not returned | $51,904,802 | $54,227,288 | ❌ Computed on different allocation |
| RR | R_a/(S×PAR) (§3.3) | `monetary-engine-v19.ts:160-163` | N/A | 110.51% | 110.51% | 110.5098% | ✅ EXACT |
| Buffer | RR−100% (≥17% strategic) | `nav-compute.ts:59` | N/A | 10.51% | 10.51% | 10.51% | ⚠️ TARGET_RA implies 116.67%, not 117% |
| NAV_m | R_m/S (§3.2) | `monetary-engine-v19.ts:110` | N/A | $1.13423 | $1.13423 | $1.1342296604 | ✅ EXACT |
| NAV_l | R_a/S (§3.2) | `monetary-engine-v19.ts:111` | N/A | $1.10510 | $1.10510 | $1.1050981679 | ✅ EXACT |
| NAV_s | R_l/S (§3.2) | `monetary-engine-v19.ts:112` | N/A | $1.00421 | $1.00421 | $1.0042090357 | ✅ EXACT (on baseline allocation) |
| LCR | HQLA/30d outflow (§9.1) | `monetary-engine-v19.ts:183` | N/A | Not returned | 6.0 | 9.08 | ❌ API uses synthetic testnet $50M/$5M |
| LRR | IAL/max(avg,p95,stress) (§9.2) | `lrr.ts:417` | N/A | Not returned | 9.0883 | 9.0883 | ✅ EXACT |
| GEI | (R_a,t/G_t)/(R_a,0/G_0) (§3.7) | `nav-compute.ts:287` | N/A | 0.93621 | 0.93621 | 0.93620754 | ✅ EXACT (but FLOAT math, hardcoded base) |
| BRI | (G/G₀)^0.90×(S/S₀)^0.10 (§3.8) | `nav-compute.ts:294` | N/A | 1.01243 | 1.01243 | 1.01242522 | ✅ EXACT (but FLOAT math, hardcoded base) |
| LCI | HQLA/(S×0.10) (§3.9) | `nav-compute.ts:297` | N/A | 9.08017 | 9.08017 | 9.080167 | ✅ EXACT (but FLOAT math) |
| GACR | = RR (§3.10) | `nav-compute.ts:300` | N/A | 110.51% | 110.51% | 110.51% | ✅ (intentional collapse) |
| CQS | 20-factor (§6.2) | `v23-metrics.ts:440-453` | N/A | Not returned | `cqsStates: []` | N/A | ❌ NEVER fed live data |
| RQS | f(Liq,Credit,FX,...) (§3.12) | Not implemented | N/A | N/A | N/A | N/A | ❌ NOT IMPLEMENTED |
| CRS | concentration | `nav-compute.ts:303-310` | N/A | ✅ | ✅ | ✅ | ⚠️ USD conflates stablecoins |
| GCRS | — | Not implemented | N/A | N/A | N/A | N/A | ❌ NOT IMPLEMENTED |
| SRR | — | Not implemented | N/A | N/A | N/A | N/A | ❌ NOT IMPLEMENTED |
| VaR99 | — | Hardcoded literal | N/A | Not returned | $4,305,000 | N/A | ❌ HARDCODED CONSTANT |
| CVaR99 | — | Hardcoded literal | N/A | Not returned | $4,812,000 | N/A | ❌ HARDCODED CONSTANT |
| FX exposure | — | `monetary-engine-v19.ts` | N/A | ✅ | ✅ | ✅ | ✅ |
| Gold exposure | 15% (§4.2) | `nav-compute.ts:202-212` | N/A | 14.90% | 14.90% | 14.90% | ✅ |
| Silver exposure | 5% (§4.2) | `nav-compute.ts:215-225` | N/A | 3.79% | 3.79% | 3.79% | ✅ |
| USD concentration | ≤35% (§1.2) | `reserve-policy-spec.ts:167` | N/A | 31.33% | 31.33% | 28.28% (fiat only) | ⚠️ Cap NOT enforced; includes stablecoins |
| Regional concentration | ≤40% (§6.3) | `reserve-policy-spec.ts:175,181` | N/A | Not computed | Not computed | N/A | ❌ GROUP_CAP duplicate (0.70 wins) |
| SE (stablecoin exposure) | ≤5% (§7.2) | `v23-metrics.ts:415` | N/A | 3.5% | 3.5% | 3.70% | ⚠️ Close (rounding) |
| SAE (risk-adjusted) | — | `v23-metrics.ts:394-416` | N/A | 0.48% | 0.48% | 0.48% | ✅ |
| Mint capacity | Pause if RR<100% | `monetary-engine-v19.ts:909` | N/A | Not paused | Not paused | Not paused | ✅ (RR=110.5%) |
| Redemption capacity | Never paused | `MTQ.sol:164` | N/A | N/A | N/A | N/A | ✅ |

## Dimensional Analysis

| Quantity | Dimension | Verified? |
|----------|-----------|-----------|
| PAR | USD / MTQ | ✅ |
| L = S × PAR | USD | ✅ |
| R_m, R_a, R_l | USD | ✅ |
| NAV = R / S | USD / MTQ | ✅ |
| RR = R_a / L | dimensionless | ✅ |
| HQLA | USD | ✅ |
| LCR, LCI, LRR | dimensionless | ✅ |
| **NAV_m × fxRates.EUR** (transparency route) | **USD × (USD/EUR) = USD²/EUR** | ❌ **DIMENSIONALLY WRONG** |
| NAV_m × (1/fxRates.JPY) | USD × (JPY/USD) = JPY | ✅ |
| GEI, BRI | dimensionless | ✅ |
| SE, SAE | dimensionless (%) | ✅ |

## Critical Mathematical Issues

1. **Multi-currency NAV dimensional error** — EUR/GBP/CHF multiplied by USD-per-foreign (should divide). Error: +33% to +80%.
2. **VaR99/CVaR99 hardcoded** — $4.3M / $4.8M literals, no formula.
3. **EWMA volatility uses floating-point** — violates §11 fixed-point mandate.
4. **v23 advisory metrics use floating-point** — GEI/BRI/LCI/DRQS/SAE all use regular JS numbers.
5. **USD 35% hard cap NOT enforced** — declared in spec, never checked in code.
6. **TARGET_RA implies 116.67% buffer** — 0.33pp below documented 117% strategic target.
7. **Dynamic optimizer NOT implemented** — 7-λ argmax is vapor; code uses static weights.
8. **On-chain RR formula differs** — uses attested R_usd, no haircuts, no R_a computation.
9. **Burn fee is dead code** — computed but never transferred to Takaful.
10. **Pro-rata withdrawal violates Article X** — Reserve.sol does pro-rata, not sequential.
