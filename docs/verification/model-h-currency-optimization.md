# MODEL H CURRENCY OPTIMIZATION

## Global Currency Eligibility, CQS Scoring, and Basket Recommendation

**Document:** 3 of 7
**Mode:** READ-ONLY + SHADOW SIMULATION
**Source:** `src/shadow/reserve-model.ts` — CQS engine with 20 factors per currency

---

## EXECUTIVE SUMMARY

This document evaluates every candidate currency against a 20-factor Currency Quality Score (CQS) framework. The finding: **CHF is the highest-scoring currency (8.16), not USD (7.96).** The recommended basket includes 8 currencies (USD, EUR, CHF, GBP, JPY, SGD, AED, SAR) with CNY excluded.

---

## 1. CURRENCY QUALITY SCORE (CQS) FRAMEWORK

### 1.1 The 20 factors

| # | Factor | Weight | Description |
|---|---|---|---|
| 1 | Liquidity | 8% | Market depth, daily trading volume |
| 2 | Convertibility | 8% | Freedom to convert, no restrictions |
| 3 | Market depth | 7% | Order book depth, bid-ask spread |
| 4 | Monetary stability | 7% | Central bank credibility, policy consistency |
| 5 | Inflation stability | 6% | Historical inflation rate and volatility |
| 6 | Sovereign strength | 6% | Sovereign credit rating |
| 7 | Fiscal sustainability | 5% | Debt-to-GDP, deficit trajectory |
| 8 | External balance | 5% | Current account, trade balance |
| 9 | Financial-system depth | 5% | Banking system size and stability |
| 10 | Settlement utility | 5% | Use in international trade settlement |
| 11 | Trade relevance | 4% | Country's share of global trade |
| 12 | Geographic diversification | 4% | Correlation with existing basket |
| 13 | FX volatility (inverse) | 4% | Lower volatility = higher score |
| 14 | Gold correlation (inverse) | 4% | Lower gold correlation = higher score |
| 15 | Regulatory accessibility | 4% | Ease of regulatory compliance |
| 16 | Capital-control risk (inverse) | 4% | Lower risk = higher score |
| 17 | Geopolitical risk (inverse) | 4% | Lower risk = higher score |
| 18 | Sanctions exposure (inverse) | 3% | Lower exposure = higher score |
| 19 | Custody availability | 3% | Institutional custody infrastructure |
| 20 | Institutional custody | 2% | Quality of custody providers |

### 1.2 CQS results (shadow-computed)

| Rank | Currency | CQS | Tier | Include? |
|---|---|---|---|---|
| 1 | **CHF** | **8.16** | Core | ✅ Yes (increase allocation) |
| 2 | USD | 7.96 | Core | ✅ Yes (reduce from 82% to ~30%) |
| 3 | **SGD** | **7.88** | Strategic | ✅ Yes (new — Asian diversification) |
| 4 | EUR | 7.48 | Core | ✅ Yes (20% target) |
| 5 | GBP | 6.89 | Core | ✅ Yes (10% target) |
| 6 | AED | 6.71 | Strategic | ✅ Yes (settlement utility) |
| 7 | CAD | 6.63 | Conditional | ⚠️ Optional |
| 8 | JPY | 6.57 | Core | ✅ Yes (10% target) |
| 9 | AUD | 6.56 | Conditional | ⚠️ Optional |
| 10 | SAR | 6.38 | Strategic | ✅ Yes (settlement utility) |
| 11 | CNY | 4.63 | Conditional | ❌ **EXCLUDE** |

---

## 2. CURRENCY-BY-CURRENCY ANALYSIS

### 2.1 CHF (Swiss Franc) — CQS 8.16 (HIGHEST)

**Why CHF scores highest:**
- ✅ Full convertibility (10/10)
- ✅ Excellent monetary stability (9/10)
- ✅ Strong sovereign (AAA, 9/10)
- ✅ No capital controls (10/10)
- ✅ Low geopolitical risk (9/10)
- ✅ Low sanctions exposure (9/10)
- ⚠️ Moderate liquidity (8/10 — smaller market than USD/EUR)

**Recommended allocation: 12-15% of FX basket**

### 2.2 USD (US Dollar) — CQS 7.96

**Why USD scores high but not highest:**
- ✅ Best liquidity (10/10)
- ✅ Best market depth (10/10)
- ✅ Best settlement utility (10/10)
- ✅ Full convertibility (10/10)
- ❌ Poor geographic diversification (3/10 — it's the numeraire)
- ❌ High sanctions exposure (5/10 — US jurisdiction)
- ❌ Moderate fiscal sustainability (6/10 — debt-to-GDP concerns)

**Recommended allocation: 30-40% of FX basket (reduced from 82%)**

### 2.3 SGD (Singapore Dollar) — CQS 7.88

**Why SGD scores in top 3:**
- ✅ Strong sovereign (AAA, 9/10)
- ✅ Excellent fiscal sustainability (8/10)
- ✅ Excellent external balance (9/10 — trade surplus)
- ✅ Low geopolitical risk (9/10)
- ✅ Low sanctions exposure (9/10)
- ⚠️ Moderate liquidity (7/10 — smaller market)
- ⚠️ Moderate market depth (6/10)

**Recommended allocation: 8-12% of FX basket**

### 2.4 EUR (Euro) — CQS 7.48

**Why EUR scores well:**
- ✅ Good liquidity (9/10)
- ✅ Good market depth (9/10)
- ✅ Good settlement utility (8/10)
- ✅ Good financial-system depth (9/10)
- ⚠️ Moderate sovereign strength (6/10 — varying member states)
- ⚠️ Moderate fiscal sustainability (5/10 — EZ debt concerns)

**Recommended allocation: 15-20% of FX basket**

### 2.5 AED/SAR (Gulf currencies) — CQS 6.71/6.38

**Why AED/SAR are included despite lower scores:**
- ✅ Excellent settlement utility (9/10 — GCC trade)
- ✅ Low FX volatility (9/10 — USD-pegged)
- ✅ Good fiscal sustainability (8/10 — oil surpluses)
- ❌ **Low diversification benefit** (USD-pegged, correlation 0.95 with each other)
- ❌ Moderate geopolitical risk (6/10 — regional tensions)
- ❌ Moderate sanctions exposure (5/10)

**Critical caveat:** AED/SAR are USD-pegged. They provide GCC settlement utility but do NOT diversify against USD. They must NOT be counted as "USD-independent" for concentration purposes.

**Recommended allocation: 5-8% of FX basket each (settlement utility, not diversification)**

### 2.6 CNY (Chinese Yuan) — CQS 4.63 (LOWEST)

**Why CNY is EXCLUDED:**
- ❌ Poor convertibility (4/10 — capital controls)
- ❌ Poor monetary stability (4/10 — PBOC intervention)
- ❌ Poor inflation stability (3/10)
- ❌ Poor regulatory accessibility (3/10)
- ❌ High capital-control risk (2/10)
- ❌ High geopolitical risk (3/10 — US-China tensions)
- ❌ High sanctions exposure (2/10 — sanctions risk)
- ⚠️ Good trade relevance (10/10 — but this doesn't compensate)

**Recommendation: EXCLUDE from active basket.** Keep in "observation" tier only. Eligible only if:
- Capital controls are removed
- Sanctions risk is resolved
- CQS improves to ≥6.0 sustainably

**No political preference. Quantitative gate only.**

---

## 3. AED/SAR EVALUATION (Section 36 mandate)

### 3.1 Do AED/SAR improve the system?

| Factor | Without AED/SAR | With AED/SAR | Improvement? |
|---|---|---|---|
| Diversification (USD hedge) | EUR/CHF/SGD provide it | No additional benefit (pegged) | ❌ No |
| Settlement utility (GCC) | Missing | Added | ✅ Yes |
| Sharia compatibility | Already compliant | Enhanced (GCC custody) | ✅ Yes |
| Stress resilience | Unchanged | Marginal (peg-break risk) | ⚠️ Neutral |
| Liquidity | Unchanged | AED/SAR are less liquid | ❌ Slight decrease |
| Geopolitical diversification | Unchanged | Added (GCC presence) | ✅ Yes |

### 3.2 Verdict on AED/SAR

**INCLUDE for settlement utility, NOT for diversification.**

- AED: 5-8% of FX basket (settlement layer)
- SAR: 3-5% of FX basket (settlement layer)
- Combined: ≤10% (due to 0.95 correlation — high redundancy)
- Flag as "USD-correlated" in concentration calculations

### 3.3 Should SGD be added?

**YES.** SGD is the 3rd-highest CQS (7.88). It provides:
- ✅ Genuine USD diversification (correlation -0.75)
- ✅ Asian settlement utility
- ✅ AAA sovereign (9/10)
- ✅ Low geopolitical/sanctions risk

**SGD is the most valuable addition to the basket.**

---

## 4. RECOMMENDED CURRENCY BASKET

### 4.1 Final basket (Model H+)

| Currency | CQS | Tier | Allocation range | Max | Min |
|---|---|---|---|---|---|
| USD | 7.96 | Core | 30-40% | 40% | 20% |
| EUR | 7.48 | Core | 15-20% | 20% | 10% |
| CHF | 8.16 | Core | 10-15% | 15% | 8% |
| JPY | 6.57 | Core | 8-12% | 12% | 5% |
| GBP | 6.89 | Core | 5-10% | 10% | 3% |
| SGD | 7.88 | Strategic | 5-10% | 10% | 3% |
| AED | 6.71 | Strategic | 3-8% | 8% | 2% |
| SAR | 6.38 | Strategic | 2-5% | 5% | 1% |
| **Total FX basket** | | | **~85-90% of fiat** | | |
| Gold (XAU) | — | Anchor | 12-20% | 20% | 12% |
| Silver (XAG) | — | Diversifier | 3-8% | 8% | 3% |
| Stablecoin | — | Settlement | 0-5% | 5% | 0% |

### 4.2 Currency substitution candidates

If a currency is SUSPENDED, the replacement hierarchy (by CQS):
1. CHF (8.16) — first choice
2. USD (7.96) — if not already at cap
3. SGD (7.88) — if not already at cap
4. EUR (7.48) — if not already at cap
5. GBP (6.89) — if not already at cap

---

## 5. CORRELATION-BASED OPTIMIZATION

### 5.1 Which currencies actually diversify USD?

| Currency | Correlation with USD | Diversification benefit |
|---|---|---|
| EUR | -0.85 | ✅ Excellent |
| CHF | -0.80 | ✅ Excellent |
| SGD | -0.75 | ✅ Good |
| GBP | -0.70 | ✅ Good |
| JPY | -0.65 | ✅ Moderate |
| AED | -0.05 | ❌ None (pegged) |
| SAR | -0.05 | ❌ None (pegged) |
| Gold | -0.50 | ✅ Moderate |
| Silver | -0.60 | ✅ Moderate |

### 5.2 Optimal diversification mix

To maximize USD diversification while maintaining liquidity:
- **EUR + CHF** (correlations -0.85, -0.80) — primary USD hedges
- **SGD** (-0.75) — Asian diversification
- **Gold** (-0.50) — neutral anchor
- **AED/SAR** — NOT for diversification (settlement only)

---

## 6. CONCLUSION

The CQS framework, computed by the shadow model, identifies **CHF as the highest-quality currency** (8.16), followed by USD (7.96) and SGD (7.88). The recommended basket includes 8 currencies with CNY excluded.

**AED/SAR are included for settlement utility, not diversification.** They are USD-pegged and must not be counted as USD-independent.

**SGD is the most valuable addition** — it provides genuine Asian diversification with AAA sovereign quality.

The next document (Gold/Silver Analysis) examines the bullion layer.
