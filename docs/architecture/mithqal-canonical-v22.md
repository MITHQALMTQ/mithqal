# MITHQAL — CANONICAL BLUEPRINT v22
## Four-Layer Dynamic Reserve Architecture

**Version:** 22.0
**Date:** 2026-08-12
**Status:** CANONICAL — supersedes v21 and all prior versions
**Authority:** COO/CTO/CFO/PM + Monetary Systems Architect + Institutional Reserve Manager
**Supersedes:** v21 (2026-08-12), v20, v19, v18, and all addenda

---

## 0. SUPREMACY CLAUSE

This document is the **single authoritative blueprint** for MITHQAL. It reconciles:
- v21 Canonical Blueprint (gold-anchored, GRI advisory)
- Model K Independent Economic Study (MRR = RR, multi-numéraire as reporting)
- PAR Constitutional Unit Study (PAR = $1.00 retained, PAR-as-unit deferred)
- Monetary Measurement Architecture Study (multi-metric: GRI + BRI + LCI)
- All Phase 2.5 reserve optimization studies (shadow models v1-v10)

**Where any prior document conflicts with this blueprint, this blueprint wins.**

**Optimization priority (inviolable):**
```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY > RETURN
```

**Monetary identity:**
MITHQAL is a **gold-anchored, globally diversified, reserve-backed monetary infrastructure with a fixed settlement PAR.** The architecture uses a **four-layer measurement system** that separates solvency, gold-relative strength, liquidity, and comprehensive risk — preventing any single metric from driving decisions while ensuring no risk dimension is invisible.

**The management principle:**
> *MITHQAL must not become a USD-backed system disguised as a global reserve system, nor a gold-pegged system disguised as a stable currency. The reserve architecture should be designed to survive model failure — not merely to pass the model.*

---

## 1. THE FOUR-LAYER ARCHITECTURE (v22 CORE INNOVATION)

### Layer 1 — Constitutional Solvency

| Property | Value |
|---|---|
| Metric | RR (Reserve Ratio) |
| Formula | `RR = R_a / (S × PAR)` |
| PAR | $1.00 (fixed, USD-denominated) |
| Floor | RR ≥ 100% (constitutional invariant, auto-pauses minting) |
| Target | RR ≥ 102% |
| Stress target | RR ≥ 100% under defined stress scenarios |
| Role | The SINGLE legal solvency metric. Determines minting pause, emergency mode, redemption throttle. |

### Layer 2 — Gold-Relative Monetary Strength

| Property | Value |
|---|---|
| Metric | GEI (Gold-Equivalent Index) + BRI (Bullion Resilience Index) |
| GEI formula | `GEI_t = (R_a,t / G_t) / (R_a,0 / G_0)` — normalized to 1.0 at base date |
| BRI formula | `BRI = (GoldVal_t/GoldVal_0)^0.85 × (SilverVal_t/SilverVal_0)^0.15` |
| BRI weights | w_gold=0.85, w_silver=0.15 (CVaR-optimized, 10k correlated paths) |
| Role | Advisory purchasing-power and bullion resilience measurement. Does NOT change PAR. Does NOT trigger rebalancing. |
| Target | GEI ≥ 1.0 (reserve growing at least as fast as gold) |

### Layer 3 — Liquidity Protection

| Property | Value |
|---|---|
| Metric | LCR (Liquidity Coverage Ratio) + LCI (Liquidity Coverage Index) |
| LCR formula | `LCR = HQLA / 30-day net outflows` |
| LCI formula | `LCI = HQLA / Expected Stress Outflows` |
| LCR floor | LCR ≥ 1.0 (constitutional) |
| LCR target | LCR ≥ 1.25 |
| Role | Ensures redemption capacity. LCR is the hard metric; LCI is the advisory stress supplement. |

### Layer 4 — Comprehensive Risk Dashboard

| Metric | Purpose |
|---|---|
| CQS | Currency Quality Score — 20-factor model for currency selection |
| CRS | Currency concentration Risk Score — prevents single-currency dominance |
| GCRS | Geopolitical/Country Risk Score — sanctions, capital controls exposure |
| SRR | Stablecoin Reserve Risk — depeg monitoring, issuer health |
| CVaR | Portfolio tail risk — optimization objective |
| DRI | Dynamic Reserve resilience Index — composite health metric |
| Multi-numéraire PP | Purchasing power reported across USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, gold |

**No metric in Layer 4 automatically changes PAR or triggers rebalancing.** Rebalancing uses weight drift + RR + hysteresis (unchanged from v21).

---

## 2. CONSTITUTIONAL IDENTITY

MITHQAL is a **gold-anchored Constitutional Settlement Institution** — a neutral, 100%+ reserved, gold-disciplined, Sharia-compliant settlement infrastructure for international trade.

**Five Constitutional Monetary Rules:**
1. Gold is the primary strategic anchor
2. Silver is secondary, not co-anchor
3. No fiat currency is permanently dominant
4. Currency weights are dynamic but constrained
5. PAR remains stable; reserves absorb changes

**Anti-Platform Clause (permanent, non-amendable):** No lending, exchange, brokerage, asset management, derivatives, DeFi, or commercial platform services.

**Founder Holdings Cap:** ≤20% of circulating supply.

---

## 3. MONETARY ARCHITECTURE

### 3.1 PAR
```
PAR = $1.00 (fixed, USD-denominated)
```
**v22 PAR Constitutional Unit Study result:** PAR = $1.00 is RETAINED. A future "PAR as constitutional unit" (currency-neutral) was studied but DEFERRED due to:
- Higher gharar risk (floating value in all currencies)
- Regulatory reclassification risk (security/ART)
- Accounting complexity
- Smart contract complexity
- Requires Sharia fatwa

**Compromise:** PAR = $1.00 + multi-currency NAV reporting + multi-numéraire purchasing-power display. The architecture is neutral (diversified reserves); the settlement unit is USD (practical, compliant, Sharia-friendly).

### 3.2 NAV
```
NAV_m = R_m / S    (Market NAV)
NAV_l = R_a / S    (Prudential NAV)
NAV_s = R_l / S    (Stress NAV)
```

### 3.3 Reserve Ratio (Layer 1 — UNCHANGED)
```
RR = R_a / (S × PAR)
RR ≥ 100% (floor), RR ≥ 102% (target)
```

### 3.4 Gold-Equivalent Index (Layer 2 — v22 NEW)
```
GEI_t = (R_a,t / G_t) / (R_a,0 / G_0)

Where:
  R_a,t = adjusted reserve value at time t
  G_t = gold spot price at time t
  R_a,0, G_0 = base date values

GEI is normalized to 1.0 at base date.
GEI > 1: reserve growing faster than gold (purchasing power increasing)
GEI < 1: reserve losing ground vs gold (purchasing power decreasing)

GEI is ADVISORY ONLY. Does NOT change PAR. Does NOT trigger rebalancing.
```

### 3.5 Bullion Resilience Index (Layer 2 — v22 NEW)
```
BRI = (GoldVal_t / GoldVal_0)^w_g × (SilverVal_t / SilverVal_0)^w_s

Where:
  w_g = 0.85 (CVaR-optimized, 10k correlated paths)
  w_s = 0.15 (CVaR-optimized)
  w_g + w_s = 1

BRI is normalized to 1.0 at base date.
BRI > 1: bullion portfolio appreciating
BRI < 1: bullion portfolio depreciating

BRI is ADVISORY ONLY.
```

### 3.6 Liquidity Coverage Index (Layer 3 — v22 NEW)
```
LCI = HQLA / Expected Stress Outflows

Where:
  HQLA = cash + sovereign×0.98 + stablecoin×0.98
  Expected Stress Outflows = S × 0.10 (10% redemption stress)

LCI is ADVISORY (supplements LCR with stress assumptions).
```

### 3.7 Multi-Numéraire Purchasing Power (Layer 4 — v22 NEW)
```
PP_j = R_a / (GoldPrice × FX_j)

For each reference numéraire j (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, gold, silver):
  PP_j = reserve purchasing power measured in numéraire j

This is a REPORTING layer only. Does NOT change RR (proven: MRR = RR).
Provides multi-perspective visibility for institutional communication.
```

### 3.8 Reserve Quality Score (Layer 4 — v22 NEW)
```
RQS_a = f(Liquidity, Credit, FX, Duration, Volatility, Correlation, GeopoliticalRisk, Convertibility, CustodyRisk)

Each reserve asset receives a dynamic RQS.
RQS informs the Dynamic Reserve Optimization Engine.
RQS is NOT a constitutional metric — it is an optimization input.
```

### 3.9 Dynamic Reserve Optimization Engine (v22 NEW)
```
W* = argmax [λ₁·RR + λ₂·LCR + λ₃·GEI − λ₄·CVaR − λ₅·FXRisk − λ₆·GeoRisk − λ₇·ConcentrationRisk]

subject to:
  Constitutional bands (w_i^min ≤ w_i ≤ w_i^max)
  RR ≥ 100%
  LCR ≥ 1.0
  Per-currency caps
  Bullion range [15%, 25%]
  φ_t ∈ [60%, 95%]

The optimizer determines optimal gold/silver/fiat/stablecoin composition
within constitutional constraints. It does NOT optimize for USD value alone.
```

---

## 4. RESERVE ARCHITECTURE

### 4.1 Three-Pillar Structure

| Pillar | Components | Target | Range |
|---|---|---|---|
| A — Bullion Anchor | Gold + Silver | 20% | 15-25% |
| B — Global Fiat Reserve | Cash + Sovereign (11 currencies) | 75% | 65-80% |
| C — Stablecoin Liquidity | 3+ issuers | 5% | 0-10% |

### 4.2 Strategic Target Weights (Enhanced H++)

| Asset | Target | Range |
|---|---|---|
| Gold | 15% | 12-18% |
| Silver | 5% | 3-8% |
| USD (cash + sovereign) | 27% | 20-35% |
| EUR (cash + sovereign) | 18% | 12-24% |
| CHF (cash + sovereign) | 6% | 3-8% |
| JPY (cash + sovereign) | 6% | 3-9% |
| GBP (cash + sovereign) | 5% | 3-8% |
| SGD (cash + sovereign) | 4% | 2-6% |
| AED (cash + sovereign) | 3% | 1-5% |
| SAR (cash + sovereign) | 3% | 1-5% |
| CNY (cash + sovereign) | 2% | 1-4% |
| CAD (cash + sovereign) | 0.5% | 0-2% |
| AUD (cash + sovereign) | 0.5% | 0-2% |
| Stablecoins | 5% | 0-5% |
| **Total** | **100%** | |

### 4.3 Solvency Buffer
20% over-collateralization (portfolio-level, NOT a separate cash bucket).

---

## 5. GOLD / SILVER φ_t (unchanged from v21)

### 5.1 Gold Anchor Principle
Gold is the strategic monetary anchor, NOT a peg, NOT a redemption promise.

### 5.2 φ_t Bounds
φ_t ∈ [60%, 95%], default 80%, dynamic by volatility.

---

## 6. CURRENCY ENGINE

### 6.1 Two-Layer Currency System
- **Layer A — Reserve Currencies (held):** USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD (11)
- **Layer B — Settlement Currencies (convertible, NOT held):** EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB

### 6.2 CQS (20-factor model, unchanged from v21)
Minimum CQS for reserve: 6.0. CNY (4.63) is conditional with substitution.

### 6.3 Concentration Limits (v22 — updated)
| Limit | Value |
|---|---|
| Per-currency cap (general) | 60% |
| USD hard cap | 35% |
| EUR cap | 25% |
| Asian aggregate | 25% |
| Gulf aggregate | 10% |
| Regional group | 40% |
| Per-stablecoin-issuer | 2% |

### 6.4 Currency Lifecycle (WATCH/REDUCE/SUSPEND/SUBSTITUTE)
Unchanged from v21. Substitution uses CQS + CRS + GCRS + correlation (NOT USD default).

### 6.5 Stablecoin Depeg Monitoring (v22 NEW)
```
SD_t = |P_t - 1.00|

SD > 2% → WATCH
SD > 5% → REDUCE
SD > 10% → SUSPEND
SUSPEND → SUBSTITUTE (to alternative issuer, NOT to USD cash)
```

---

## 7. REBALANCING ENGINE (unchanged from v21)

Pipeline: DRIFT → VALIDATE → CONFIRM → PROPOSE → APPROVE → EXECUTE → RECONCILE

Hysteresis: 2% band, 2-cycle confirmation, direction-tracking.
Trade suppression: benefit > cost + slippage + 2bp buffer.
Turnover: 3% weekly, 1% daily per asset.

---

## 8-16. LIQUIDITY, ACCOUNTING, CUSTODY, ORACLE, GOVERNANCE, INVARIANTS, DETERMINISM, AUDIT, CONTRACTS

(All unchanged from v21 unless noted below.)

### 12.2 Amendment Workflow
Timelock: 90 days (constitutional), 7 days (policy). Confirmed in v22.

### 11. Oracle Architecture
Gold: 3+ sources. Silver: 3+ sources (P1 fix). FX: 2+ sources (P1 fix). Stablecoins: live pricing + depeg monitoring (v22 NEW).

---

## 17. RESERVE VERIFICATION (unchanged from v21)

Level 0-4. Mainnet requires Level 3+. VERIFIED NAV reported separately from MODELED NAV.

---

## 18. v22 CHANGES FROM v21 (Summary)

| Change | Section | Description |
|---|---|---|
| Four-layer architecture | §1 | Formalized Layer 1-4 measurement system |
| GEI (normalized GRI) | §3.4 | Replaces GRI with base-normalized formula |
| BRI (Bullion Resilience Index) | §3.5 | CVaR-optimized weights (0.85/0.15) |
| LCI (Liquidity Coverage Index) | §3.6 | Advisory stress-liquidity metric |
| Multi-numéraire PP | §3.7 | Purchasing power reported across 11 numéraires |
| RQS (Reserve Quality Score) | §3.8 | Dynamic per-asset quality scoring |
| Dynamic Reserve Optimization | §3.9 | Multi-objective optimizer (λ₁...λ₇) |
| Stablecoin depeg monitoring | §6.5 | SD_t = |P_t - 1|, automatic WATCH/REDUCE/SUSPEND |
| PAR Constitutional Unit study | §3.1 | PAR = $1.00 retained; PAR-as-unit deferred |
| Multi-numéraire as reporting | §3.7 | MRR = RR proven; multi-numéraire is reporting only |

---

## APPENDIX A: DOCUMENTS SUPERSEDED

v21, v20, v19, v18, and all addenda. These remain as historical references.

## APPENDIX B: CENTRALIZED SPECIFICATION

`src/lib/reserve-policy-spec.ts` — v22 constants mirrored.

## APPENDIX C: PAR CONSTITUTIONAL UNIT STUDY RESULT

PAR = $1.00 RETAINED. Architecture B (PAR as neutral unit) DEFERRED for future study. See `docs/verification/shadow/par-unit-study.txt`.

---

**This blueprint is complete. It is the single authoritative document for MITHQAL.**
