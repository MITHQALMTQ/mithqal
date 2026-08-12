# Currency Reserve Model Comparison — Model A vs Model B
## No-Implementation Decision Gate

**Date:** 2026-08-11
**Commit:** `8451a56`
**Mode:** READ-ONLY — No code changes, no blueprint changes, no deployment

---

## 1. Current Baseline (Model A — v20 as implemented)

### Currency Universe (8)
USD (48.0%), EUR (19.0%), JPY (10.3%), GBP (10.9%), CNY (6.7%), CHF (2.0%), AUD (1.7%), CAD (1.4%)
Sum = 100.0% ✅

### Reserve Structure
| Tier | Asset | Weight | Value |
|---|---|---|---|
| 1 | Cash | 53.4% | $31.0M |
| 2 | Sovereign | 23.3% | $13.5M |
| 3a | Gold (φ_t=80%) | 14.9% | $9.25M (2,122.86 oz @ $4,358) |
| 3b | Silver (1-φ_t=20%) | 3.7% | $2.38M (36,758 oz @ $64.8) |
| 4 | Stablecoin | 4.7% | $2.7M |

### Key Metrics
- RR = 106.78% | NAV_m = $1.0895 | PAR = $1.00 | LCR = 8.68 | LRR = 8.69
- σ (portfolio) = 3.34% annual
- Stress lab: 20/20 PASS

---

## 2. Model B (Proposed Institutional)

4 proposed components:
1. Add AED + SAR + SGD (8→11 currencies)
2. Reduce USD cap 60%→50%
3. CPI-linked stability corridor
4. 4-tier liquidity classification labels

---

## 3. Stress Test Results

### FX Shocks
| Scenario | Model A RR | Model B RR | Winner |
|---|---|---|---|
| USD +20% | 98.72% ❌ | 98.61% ❌ | A (marginally) |
| USD -20% | 115.72% ✅ | 115.83% ✅ | B (marginally) |
| EUR +20% | 109.92% ✅ | 109.92% ✅ | Tie |
| EUR -20% | 103.72% ✅ | 103.72% ✅ | Tie |
| JPY -30% | 104.30% ✅ | 104.30% ✅ | Tie |
| USD+10% & EUR-10% | 103.20% ✅ | 103.16% ✅ | Tie |

### Gold/Silver (identical — composition unchanged)
| Scenario | RR | Status |
|---|---|---|
| Gold -30% | 101.89% | ✅ PASS (thin, 1.89pp buffer) |
| Gold +30% | 111.67% | ✅ |
| Silver -40% | 105.13% | ✅ |
| Gold/Silver divergence | 109.22% | ✅ |

### Redemption (identical — Article X same)
| % | RR After | Tiers Tapped | Status |
|---|---|---|---|
| 5% | 107.25% | Stablecoin only | ✅ |
| 10% | 107.63% | Stablecoin + Cash | ✅ |
| 20% | 108.59% | Stablecoin + Cash | ✅ |
| 30% | 109.84% | Stablecoin + Cash | ✅ |
| 50% | 113.76% | Stablecoin + Cash | ✅ (gold/silver untouched) |

### Combined
| Scenario | RR | Status |
|---|---|---|
| Gold -30% + 20% redemption | 102.48% | ✅ PASS (thin) |
| Stablecoin depeg + 10% redemption | 107.07% | ✅ |
| USD +20% + Gold +30% | 103.61% | ✅ (offsetting) |

---

## 4. Component Analysis

### Component 1: Add AED + SAR + SGD
- **Benefit:** +6 (Middle East/Asia institutional access, Sharia signal)
- **Complexity:** 4 (3 currencies, lifecycle admission, monitoring)
- **Net:** +2 ✅ ADOPT
- AED/SAR are USD hard pegs → zero incremental FX risk
- USD structural weight drops marginally (47.34%→46.76%)

### Component 2: Reduce USD cap 60%→50%
- **Benefit:** 4 (marginal diversification)
- **Complexity:** 6 (binds in momentum regimes, governance overhead, transaction costs)
- **Net:** -2 ❌ REJECT
- 50% cap has only 3.24pp headroom vs 60% cap's 12pp
- Does NOT fix USD +20% failure

### Component 3: CPI-linked stability corridor
- **Benefit:** 3 (inflation protection)
- **Complexity:** 9 (breaks PAR, determinism, settlement finality, Sharia)
- **Net:** -6 ❌ REJECT
- CPI is lagging, revised, politically contested — breaks §29.12
- Inflation protection belongs in Entity B, not settlement layer

### Component 4: 4-tier liquidity labels
- **Benefit:** 3 (clearer communication)
- **Complexity:** 2 (relabeling only)
- **Net:** +1 ✅ ADOPT (documentation only)
- Already implemented structurally via Article X sequential order

---

## 5. Scorecard

| Category | Model A | Model B | Winner |
|---|---|---|---|
| Stability | 8 | 8 | Tie |
| Liquidity | 9 | 9 | Tie |
| Capital preservation | 9 | 9 | Tie |
| FX resilience | 6 | 6 | Tie |
| Crisis resilience | 8 | 8 | Tie |
| Redemption resilience | 9 | 9 | Tie |
| Gold/silver stability | 8 | 8 | Tie |
| Concentration risk | 8 | 7 | A |
| Oracle resilience | 7 | 7 | Tie |
| Custody resilience | 8 | 8 | Tie |
| Determinism | 9 | 5 | A |
| Transparency | 8 | 8 | Tie |
| Institutional trust | 7 | 8 | B |
| Global usability | 7 | 8 | B |
| Sharia compatibility | 8 | 9 | B |
| Operational complexity | 7 | 5 | A |
| Regulatory compatibility | 7 | 8 | B |
| **Overall** | **78.1%** | **78.1%** | **Tie** |

### HYBRID (Model B′ — AED/SAR/SGD + labels only)
**Overall: 80.4%** (+2.3pp over Model A)

---

## 6. Decision

### **C — HYBRID**

**ADOPT:**
1. ✅ Component 1 (AED + SAR + SGD) — net benefit +2, opens Middle East/Asia
2. ✅ Component 4 (4-tier labels) — net benefit +1, documentation only

**REJECT:**
1. ❌ Component 2 (50% USD cap) — net -2, binds in stress, doesn't fix USD+20% failure
2. ❌ Component 3 (CPI corridor) — net -6, breaks PAR/determinism/Sharia

---

## 7. Structural Fragility Identified (Both Models)

**USD +20% appreciation causes RR to breach 100% (98.72% Model A, 98.61% Model B).**

This is the single most concerning finding. Neither model survives a sustained 20% USD rally. Mitigation options (for separate study):
- Increase RR target to 110%+ (more buffer)
- Asymmetric USD kFactor damping (reduce USD weight gain when USD appreciates)
- Add USD-stress trigger to SDP (>15% USD deviation → auto-rebalance toward bullion)
- Increase bullion allocation (but reduces liquidity)

**This is NOT addressed by Model B. Both models fail identically.**

---

## 8. Complexity Penalty Summary

| Component | Benefit | Complexity | Net | Verdict |
|---|---|---|---|---|
| AED+SAR+SGD | 6 | 4 | +2 | ✅ ADOPT |
| 50% USD cap | 4 | 6 | -2 | ❌ REJECT |
| CPI corridor | 3 | 9 | -6 | ❌ REJECT |
| 4-tier labels | 3 | 2 | +1 | ✅ ADOPT (docs only) |

**Evidence decides. Complexity without material improvement is rejected.**
