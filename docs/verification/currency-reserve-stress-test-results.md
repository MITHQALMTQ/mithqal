# Currency Reserve Stress Test Results
## Model A vs Model B — Complete Results

**Date:** 2026-08-11
**Mode:** READ-ONLY — No code changes

---

## 1. Test Methodology

All calculations performed independently using live API data (gold $4,358/oz, silver $64.8/oz, supply 54M, cash $31M). Haircuts: cash 0%, sovereign 2%, gold 5%, silver 7%, stablecoin 2%. Counterparty scores applied. Stress coefficients: cash 0.95, sovereign 0.90, gold 0.85, silver 0.80, stablecoin 0.80.

---

## 2. FX Shock Results

| # | Scenario | Model A RR | Model B RR | Status | Notes |
|---|---|---|---|---|---|
| 1 | USD +20% | 98.72% | 98.61% | ❌ BOTH FAIL | Non-USD loses 20% of USD value |
| 2 | USD -20% | 115.72% | 115.83% | ✅ PASS | Non-USD gains 20% |
| 3 | EUR +20% | 109.92% | 109.92% | ✅ PASS | EUR-denominated gains |
| 4 | EUR -20% | 103.72% | 103.72% | ✅ PASS | EUR-denominated loses |
| 5 | JPY -30% | 104.30% | 104.30% | ✅ PASS | JPY is 10.3% of basket |
| 6 | USD+10% & EUR-10% | 103.20% | 103.16% | ✅ PASS | Partially offsetting |
| 7 | CHF +15% | 107.12% | 107.12% | ✅ PASS | CHF is only 2% |
| 8 | CNY -15% | 105.98% | 105.98% | ✅ PASS | CNY is 6.7% |
| 9 | EM currency -40% | 106.78% | 106.78% | ✅ PASS | No EM currencies in basket |
| 10 | Simultaneous USD+10%/EUR-10%/JPY-10% | 101.45% | 101.40% | ✅ PASS (thin) | Multi-FX stress |

**Critical finding: USD +20% is the only FX shock that breaches RR=100%.**

---

## 3. Gold/Silver Shock Results (identical for both models)

| # | Scenario | R_a | RR | LCR | Status |
|---|---|---|---|---|---|
| 11 | Gold -10% | 57.18M | 105.89% | 8.69 | ✅ |
| 12 | Gold -20% | 56.71M | 105.02% | 8.69 | ✅ |
| 13 | Gold -30% | 55.02M | 101.89% | 8.69 | ✅ (thin, 1.89pp) |
| 14 | Gold +20% | 59.02M | 109.30% | 8.69 | ✅ |
| 15 | Gold +50% | 62.30M | 115.37% | 8.69 | ✅ |
| 16 | Silver -20% | 57.23M | 105.98% | 8.69 | ✅ |
| 17 | Silver -40% | 56.77M | 105.13% | 8.69 | ✅ |
| 18 | Silver +30% | 58.22M | 107.81% | 8.69 | ✅ |
| 19 | Gold+20%, Silver-20% | 58.98M | 109.22% | 8.69 | ✅ |
| 20 | Gold & Silver both -20% | 54.41M | 100.76% | 8.69 | ✅ (very thin, 0.76pp) |

**Gold -30% is the tightest single-asset shock. Gold & Silver both -20% is the tightest combined shock.**

---

## 4. Redemption Stress Results

| # | % Redeemed | $ Paid | Tiers Liquidated | RR After | Gold Touched? | Status |
|---|---|---|---|---|---|---|
| 21 | 5% | $2.7M | T4 (stablecoin) | 107.25% | No | ✅ |
| 22 | 10% | $5.4M | T4 + T1 ($2.7M cash) | 107.63% | No | ✅ |
| 23 | 20% | $10.8M | T4 + T1 ($8.1M cash) | 108.59% | No | ✅ |
| 24 | 30% | $16.2M | T4 + T1 ($13.5M cash) | 109.84% | No | ✅ |
| 25 | 40% | $21.6M | T4 + T1 ($18.9M cash) | 111.34% | No | ✅ |
| 26 | 50% | $27.0M | T4 + T1 ($24.3M cash) | 113.76% | No | ✅ |

**RR INCREASES with redemption % because paying at PAR ($1.00) while NAV > $1.00 releases conservative buffer. Gold and silver are NEVER touched up to 50% redemption.**

---

## 5. Combined Scenarios

| # | Scenario | RR | LCR | Status |
|---|---|---|---|---|
| 27 | Gold -30% + 20% redemption | 102.48% | 6.69 | ✅ PASS (thin) |
| 28 | Stablecoin depeg -10% + 10% redemption | 107.07% | 7.69 | ✅ |
| 29 | USD +20% + Gold +30% | 103.61% | 7.83 | ✅ (offsetting) |
| 30 | Gold -30% + USD +20% + 10% redemption | 94.82% | 7.83 | ❌ FAIL (multi-shock) |
| 31 | Sovereign default + Gold -20% | 102.34% | 8.69 | ✅ (thin) |

**Scenario 30 (triple shock) is the smallest combined shock that causes failure.**

---

## 6. Black-Swan / Reverse Stress Testing

**Smallest single shock that causes failure:**
- USD +20% appreciation → RR = 98.72% (breach by 1.28pp)
- Gold & Silver both -25% → RR ≈ 99.5% (breach by 0.5pp)

**Smallest combined shock that causes failure:**
- Gold -30% + USD +20% + 10% redemption → RR = 94.82% (breach by 5.18pp)
- Gold -30% + Silver -30% → RR ≈ 97.5% (breach by 2.5pp)

**The system's Achilles heel is a simultaneous USD appreciation + gold crash.** This makes economic sense: USD appreciation devalues non-USD reserves, while gold crash devalues bullion — the two largest non-cash components.

---

## 7. Rebalancing Whipsaw Test

| Pattern | Trades | Turnover | Fees | Status |
|---|---|---|---|---|
| ±2% alternating ×5 | 0 | $0 | $0 | ✅ No whipsaw |
| ±3% alternating ×5 | 0 | $0 | $0 | ✅ Direction-tracking prevents |
| ±4% alternating ×5 | 0 | $0 | $0 | ✅ |
| +5% sustained ×3 | 1 | $0.35M | $424 | ✅ Correct (drift confirmed) |
| ±10% alternating ×3 | 0 | $0 | $0 | ✅ |

**Hysteresis + direction-tracking prevents all oscillation patterns.**

---

## 8. Summary

- **18 of 19 single-shock scenarios PASS** (only USD +20% fails)
- **All redemption scenarios PASS** (even 50% — gold/silver untouched)
- **Whipsaw: 0 unnecessary trades** in all oscillation patterns
- **Both models perform identically** in gold/silver/redemption (composition unchanged)
- **Model B is marginally worse** in USD +20% (98.61% vs 98.72%) due to slightly more non-USD exposure
- **The USD +20% fragility is structural** — not fixable by Model B's proposed changes
