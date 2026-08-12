# MITHQAL — Rebalancing Policy Engine
## Phase 3 — Formal Rules (Design Only, No Code Changes)

**Date:** 2026-08-10
**Status:** Formal policy specification — not yet implemented
**Foundation:**
- Latest Mithqal Blueprint (v19.0.3 addendum + v18 base + constitutional-change-log + custody-framework-v2)
- `docs/verification/reserve-canonical-audit.md` (Phase 1 canonical audit)
- `docs/architecture/institutional-reserve-stability.md` (Phase 2 stability design)
**Design authority:** Chief Monetary Architect / Chief Risk Officer / Chief Systems Architect

---

## 0. Governing Principles

This policy does NOT invent new monetary rules. Every rule traces to the blueprint or the Phase 1/2 design. The policy formalizes **when** to rebalance, **how much**, and **under what constraints** — operationally specifying the stability layer.

**Inviolable priority:** `RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY`

**Hard constraints (from blueprint, non-negotiable):**
- §4: RR = R_a / (S × PAR), PAR=$1.00. Hard ≥100%, policy ≥102%.
- §22A: all currency weights ≥0.5% floor, ≤60% cap, Σ W = 1.0.
- §25.2: φ_t ∈ [60%, 95%].
- §29.4: partial rebalancing — minimum transactions only.
- §29.6: LCR ≥1.0 post-trade.
- §34: redemption never paused.
- Article X / Invariant 5: Bullion Protection Rule — gold liquidated LAST.
- Invariant I-4: 3% weekly weight-change cap per asset.

---

## 1. Formal Properties Per Reserve Component

13 properties defined for each of the 6 reserve components. All percentages are of total reserve NAV unless stated otherwise. "Bullion layer" = gold + silver (15-25% of total). "Fiat layer" = cash + sovereign (70-80% of total).

### 1.1 Eligible Currencies (8 sovereign fiats: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD)

*Note: "currency weight" here means the currency's share of the fiat layer's currency composition, which feeds the structural weighting engine. The fiat layer itself is 70-80% of total reserves.*

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | §13 structural: COFER 50% + SWIFT 40% + BIS 10%, adjusted by §16 momentum (±5%) + mean reversion (±2%) + shock absorber A_t | §13, §16, §17 |
| 2 | Minimum weight | 0.5% per currency (`minimum_floor` trigger, high severity) | §22A |
| 3 | Maximum weight | 60% per currency (`concentration_cap` trigger, critical). Regional group ≤70%. Single currency in total reserves ≤50%. | §21, §22A |
| 4 | Soft deviation threshold | 2% drift (Tier 1 — observe; no trade) | §29.1, §22B |
| 5 | Hard deviation threshold | 3% drift (Tier 2 — normal rebalance; medium/high severity) | §29.1 |
| 6 | Emergency threshold | >5% deviation from reference price → §33 SDP triggers (Tier 3). Concentration cap breach (>60%) → critical. | §33, §22A |
| 7 | Hysteresis threshold | 2% band + 2 consecutive observation cycles required before applying a >2% weight change | §22B |
| 8 | Minimum time between rebalances | 4 hours (`minDeferralHours`). Scheduled: quarterly. Momentum eval: monthly. Structural: quarterly. | §29.1, v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of the currency's holding (Invariant I-4 weekly cap; per-event ≤ weekly cap) | Invariant I-4 |
| 10 | Maximum turnover per day | 1% of the currency's holding (derived: weekly 3% / 3 active days) | Invariant I-4 (derived) |
| 11 | Maximum turnover per month | 6% of the currency's holding (2× weekly cap; bounds monthly churning) | Invariant I-4 (derived) |
| 12 | Required liquidity | Post-trade LCR ≥1.0 (§29.6). Post-trade LRR ≥1.0 (excludes gold/silver). Currency must be "full" lifecycle status. | §5, §29.6, §12 |
| 13 | Required approval | Low severity: 2/5 roles. Medium: 3/5. High: 4/5. Critical (concentration_cap/SDP): 5/5 + Constitutional Council. SIMULATION auto-approves; SHADOW/LIVE manual. | §29.2 |

### 1.2 Gold (XAU)

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | φ_t × bullion_layer_weight. Default φ_t=0.80; dynamic 0.75-0.85 by gold EWMA vol. Bullion layer target 20% of total → gold target ≈16% of total. | §25.2, §23-27 |
| 2 | Minimum weight | φ_t ≥ 60% of bullion (constitutional hard floor). Bullion layer ≥15% of total. → Gold floor ≈9% of total (60% × 15%). | §25.2 |
| 3 | Maximum weight | φ_t ≤ 95% of bullion (constitutional hard cap). Bullion layer ≤25% of total. → Gold cap ≈23.75% of total (95% × 25%). | §25.2 |
| 4 | Soft deviation threshold | φ_t within 2pp of band edge [58%, 62%] or [93%, 97%] → observe (Tier 1). | §25.2, §22B |
| 5 | Hard deviation threshold | φ_t outside [60%, 95%] → `bullion_band` trigger (Tier 2, high severity). | §25.2, §29.1 |
| 6 | Emergency threshold | Gold deviation >5% from reference → §33 SDP (Tier 3). Gold market closure (existential). | §33 |
| 7 | Hysteresis threshold | 2pp φ_t change + 2 consecutive cycles. Prevents buy-gold/sell-silver → reverse pattern. | §22B |
| 8 | Minimum time between rebalances | 60 days for gold/silver deviation correction (v18 Part 3 Article I). Min 4h deferral for batching. | v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of gold holding (Invariant I-4). | Invariant I-4 |
| 10 | Maximum turnover per day | 1% of gold holding. | Derived |
| 11 | Maximum turnover per month | 6% of gold holding. | Derived |
| 12 | Required liquidity | Post-trade LCR ≥1.0. Post-trade RR ≥100% (hard) / ≥102% (policy). Redemption liquidity must remain sufficient (LRR ≥1.0, which excludes gold). Gold purchase must not drop liquid reserve below 8% constitutional buffer. | §4, §5, §29.6, constitutional-change-log Phase 5 |
| 13 | Required approval | `bullion_band` medium: 3/5. High: 4/5. SDP/closure (Tier 3): 5/5 + Council. Gold liquidation requires Exhaustion Certificate. | §29.2, Article X |

### 1.3 Silver (XAG)

Silver does NOT automatically mirror gold. It has independent volatility (higher), liquidity (lower), and transaction costs (higher — 20 bps vs gold 10 bps).

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | (1 − φ_t) × bullion_layer_weight. Default 0.20; dynamic 0.15-0.25. Bullion target 20% → silver target ≈4% of total. | §25.2 |
| 2 | Minimum weight | Silver share ≥5% of bullion (constitutional). → Silver floor ≈0.75% of total (5% × 15%). | §25.2 |
| 3 | Maximum weight | Silver share ≤40% of bullion (constitutional). → Silver cap ≈10% of total (40% × 25%). | §25.2 |
| 4 | Soft deviation threshold | Silver share within 2pp of [5%, 7%] or [38%, 42%] → observe. | §25.2, §22B |
| 5 | Hard deviation threshold | Silver share outside [5%, 40%] → `bullion_band` trigger (Tier 2, high). | §25.2 |
| 6 | Emergency threshold | Silver market closure (existential scenario #5). SDP if silver deviates >5%. | §33 |
| 7 | Hysteresis threshold | 2pp silver-share change + 2 consecutive cycles. | §22B |
| 8 | Minimum time between rebalances | 60 days (same as gold — v18 Part 3 Article I). Min 4h deferral. | v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of silver holding (Invariant I-4). **But** silver's higher cost (20 bps) means the transaction-cost threshold binds first — see §6 Trade Suppression. | Invariant I-4, §29.5 |
| 10 | Maximum turnover per day | 1% of silver holding. | Derived |
| 11 | Maximum turnover per month | 6% of silver holding. | Derived |
| 12 | Required liquidity | Post-trade LCR ≥1.0. Post-trade RR ≥100%/102%. Silver is "Strategic Liquidity" — available before gold in liquidation order, but NOT HQLA. | §5, Article X, Article XIII |
| 13 | Required approval | Same as gold: medium 3/5, high 4/5, Tier 3 5/5+Council. Silver liquidation does NOT require Exhaustion Certificate (unlike gold) — it may be sold before gold. | §29.2, Article X |

### 1.4 Cash / Liquid Instruments

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | 2/3 of fiat layer. Fiat target 75% → cash target ≈50% of total (2/3 × 75%). | §24 |
| 2 | Minimum weight | Fiat layer floor 70% → cash floor ≈46.7% (2/3 × 70%). Cash is the primary RR buffer. | §23, §19.2 |
| 3 | Maximum weight | Fiat layer cap 80% → cash cap ≈53.3% (2/3 × 80%). | §23-27 |
| 4 | Soft deviation threshold | Cash share within fiat ±2pp of 2/3 → observe. | §22B |
| 5 | Hard deviation threshold | Fiat layer outside [70%, 80%] → `layer_breach` trigger (Tier 2, high/critical). | §29.1, §23 |
| 6 | Emergency threshold | RR <100% → emergency (Tier 3). Cash is INCREASED to restore RR (§19.2: +2% fiat when RR<102%). | §4, §19.2 |
| 7 | Hysteresis threshold | 2pp cash-share change + 2 cycles. | §22B |
| 8 | Minimum time between rebalances | 30 days for Tier 1-3 deviation. Min 4h deferral. | v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of cash holding (Invariant I-4). Cash fee = 0 bps (intra-bank settlement is free) — transaction-cost threshold rarely binds. | Invariant I-4, §29.5 |
| 10 | Maximum turnover per day | 1% of cash holding. | Derived |
| 11 | Maximum turnover per month | 6% of cash holding. | Derived |
| 12 | Required liquidity | Cash IS the liquidity. 0% haircut (§6). HQLA Level 1. Counts 1:1 toward LCR. | §5, §6 |
| 13 | Required approval | `layer_breach` high: 4/5. Critical: 5/5+Council. | §29.2 |

### 1.5 Stablecoins (USDC/USDT/DAI)

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | 5% of total reserves (policy target). | §26 |
| 2 | Minimum weight | 2% (operational liquidity minimum). | §26 |
| 3 | Maximum weight | 8% (prevents over-reliance). Per-issuer ≤15% (§10). | §26, §10 |
| 4 | Soft deviation threshold | ±1pp from 5% target → observe. | §22B |
| 5 | Hard deviation threshold | Outside [2%, 8%] → `layer_breach` (Tier 2). Status ≠ "full" → `stablecoin_eligibility` (medium/high). | §29.1, §27 |
| 6 | Emergency threshold | 10% depeg → suspension (Tier 3). Systemic stablecoin collapse → existential. | §27, §12 |
| 7 | Hysteresis threshold | 1pp stablecoin-share change + 2 cycles (tighter than currency — stablecoins are more volatile operationally). | §22B (tightened) |
| 8 | Minimum time between rebalances | 14 days (Tier 4 deviation — v18 Part 3 Article I). Min 4h deferral. | v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of stablecoin holding (Invariant I-4). Fee 6 bps VWAP. | Invariant I-4, §29.5 |
| 10 | Maximum turnover per day | 1% of stablecoin holding. | Derived |
| 11 | Maximum turnover per month | 6% of stablecoin holding. | Derived |
| 12 | Required liquidity | HQLA Level 2B (2% haircut). Counts toward LCR at 98%. Must be "full" lifecycle. | §5, §6, §27 |
| 13 | Required approval | `stablecoin_eligibility` medium: 3/5. High: 4/5. Depeg emergency: 5/5+Council. | §29.2 |

### 1.6 Sovereign (US T-bills ≤1yr)

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Target weight | 1/3 of fiat layer. Fiat target 75% → sovereign target ≈25% of total (1/3 × 75%). | §24 |
| 2 | Minimum weight | None individual (part of fiat floor 70%). | §23 |
| 3 | Maximum weight | 1/3 of fiat → ≈26.7% of total. Duration ≤1yr (constitutional). Per-issuer ≤15% (§10 — US-only currently). | §24, §10 |
| 4 | Soft deviation threshold | ±2pp from 1/3 share → observe. | §22B |
| 5 | Hard deviation threshold | Fiat layer outside [70%, 80%] → `layer_breach`. Duration >1yr → hard violation. | §29.1, §24 |
| 6 | Emergency threshold | Sovereign default → §33 SDP → currency lifecycle suspension (Tier 3). | §33 |
| 7 | Hysteresis threshold | 2pp sovereign-share change + 2 cycles. | §22B |
| 8 | Minimum time between rebalances | 30 days (Tier 1-3 deviation). Min 4h deferral. | v18 Part 3 Article I |
| 9 | Maximum turnover per event | 3% of sovereign holding (Invariant I-4). Fee 4 bps VWAP. | Invariant I-4, §29.5 |
| 10 | Maximum turnover per day | 1% of sovereign holding. | Derived |
| 11 | Maximum turnover per month | 6% of sovereign holding. | Derived |
| 12 | Required liquidity | HQLA Level 2A (2% haircut). Modified duration ≤0.5. Stress coefficient 0.90. | §5, §6 |
| 13 | Required approval | `layer_breach` high: 4/5. Critical (sovereign default): 5/5+Council. | §29.2 |

---

## 2. Currency Rebalancing Rules

### 2.1 When a Currency May INCREASE Weight

A currency may increase its reserve weight **only when ALL six conditions hold simultaneously:**

| # | Condition | Mechanism | Blueprint ref |
|---|---|---|---|
| 1 | Relative strength improves | `rawMomentum = P_12mo_ago / P_today > 1.0` (currency has appreciated over 12 months). Bounded: `M_i = clamp(rawMomentum, 0.95, 1.05)`. | §16.1 |
| 2 | Reserve health supports it | Post-trade RR ≥102% (policy) / ≥100% (hard). If RR<102%, the engine INCREASES cash (not risky currencies) per §19.2. | §4, §19.2 |
| 3 | Liquidity remains acceptable | Post-trade LCR ≥1.0 (§29.6). Post-trade LRR ≥1.0. The currency itself must have sufficient market liquidity. | §5, §29.6 |
| 4 | Volatility remains within limits | Currency EWMA volatility σ ≤5% (shock absorber A_t ≥0.5). If σ>5%, `shockAdjustedFactor` dampens the increase. | §17.4 |
| 5 | Concentration remains below cap | Post-trade weight <60% (`concentration_cap`). Regional group <70%. If at cap, `applyConcentrationCap` redistributes excess to OTHER currencies — the strong currency cannot gain beyond 60%. | §22A, §21 |
| 6 | Improvement persists through confirmation window | Hysteresis: the proposed increase must be observed for 2 consecutive evaluation cycles before applying. A single quarter of strength is insufficient. | §22B |

**If ANY condition fails, the increase is suppressed** (Tier 1 — observe) or deferred.

### 2.2 When a Currency May DECREASE Weight

A currency may decrease its reserve weight when **any ONE** of these conditions holds:

| # | Condition | Mechanism | Blueprint ref |
|---|---|---|---|
| 1 | Sustained depreciation | `rawMomentum < 1.0` (depreciated over 12 months). Bounded: `M_i = clamp(rawMomentum, 0.95, 1.05)`. If sustained ≥2 quarters → §12 lifecycle: full → probation. | §16.1, §12 |
| 2 | Volatility becomes excessive | Currency EWMA σ >5% → shock absorber A_t=0.5 (dampens but doesn't directly decrease). If σ>10% → eligibility review. | §17.4 |
| 3 | Liquidity deteriorates | Currency market liquidity falls below eligibility threshold → §12 lifecycle: full → probation → suspended. `currency_eligibility` trigger (medium/high). | §12, §29.1 |
| 4 | Concentration becomes unsafe | Weight approaches 60% cap → `concentration_cap` trigger forces redistribution (the currency LOSES weight to others). | §22A |
| 5 | Severe deviation detected | §33 SDP: deviation >5% from reference price → `computeSDPEmergency` recalculates weight → currency lifecycle: full → suspended → §20 normalization (others rise). | §33, §12, §20 |

**Progressive weakening sequence:** observation → probation (≥2 quarters) → suspension (SDP/sanctions) → normalization (§20). No step can be skipped. The decrease is always bounded by momentum ±5% and phased by hysteresis.

### 2.3 No Single Market Observation Triggers a Major Rebalance

**Rule:** No single market observation — however extreme — may trigger a rebalance exceeding the Tier 1 (observe) threshold without passing through the confirmation window.

**Implementation:**
- Every trigger from `detectRebalanceTriggers` enters Tier 1 (observe) first.
- The observation counter must reach 2 (two consecutive cycles) before the trigger escalates to Tier 2 (normal rebalance).
- The ONLY exception is §33 SDP (>5% deviation) and §44 emergency declarations — these bypass the confirmation window because they represent existential threats, not market noise.
- Even SDP is bounded by `SDP_CAP = 0.50` — weights cannot drop more than 50% in a single event.

This prevents a flash crash, a single bad oracle print, or a quarter of volatility from causing a major portfolio reconfiguration.

---

## 3. Gold Policy

### 3.1 Gold must have:

| # | Property | Value | Blueprint ref |
|---|---|---|---|
| 1 | Minimum allocation | φ_t ≥60% of bullion. Bullion ≥15% of total. → Gold ≥9% of total reserves. | §25.2 |
| 2 | Maximum allocation | φ_t ≤95% of bullion. Bullion ≤25% of total. → Gold ≤23.75% of total. | §25.2 |
| 3 | Drift threshold | 2pp φ_t drift (soft — observe). 5pp drift (hard — `bullion_band` trigger). | §25.2, §22B |
| 4 | Transaction-cost threshold | Trade suppressed if `estimated_cost (10 bps VWAP) ≥ drift_benefit`. See §6. | §29.5, §29.4 |
| 5 | Emergency threshold | Gold deviation >5% from reference → §33 SDP. Gold market closure → existential (Tier 3). | §33 |

### 3.2 Gold purchases/sales must NOT compromise:

| # | Constraint | How enforced | Blueprint ref |
|---|---|---|---|
| 1 | Redemption liquidity | Post-trade LCR ≥1.0 (§29.6 `verifyRebalancePlanLiquidity`). Post-trade LRR ≥1.0 (excludes gold — so gold purchase can't use redemption liquidity). | §5, §29.6, Article XIII |
| 2 | Minimum liquid reserve | Constitutional buffer ≥8% above S×PAR (constitutional-change-log Phase 5). Gold purchase cannot drop liquid reserves (cash + stablecoin + sovereign×0.98) below 8% of supply. | constitutional-change-log Phase 5 |
| 3 | Constitutional reserve floor | RR ≥100% hard invariant (§4). `verifyRebalancePlanReserveRatio` rejects any plan that drops RR below 100% (non-emergency). Gold purchase reduces liquid R_a (gold has 5% haircut per §6), so it's constrained by the RR floor. | §4, §6, §29.7 |

---

## 4. Silver Policy

### 4.1 Same institutional principles as gold

Silver has the same 5 required properties (minimum, maximum, drift, tx-cost, emergency) and the same 3 must-not-compromise constraints (redemption liquidity, minimum liquid reserve, constitutional floor).

### 4.2 Silver-specific adjustments (does NOT mirror gold)

| Factor | Gold | Silver | Implication |
|---|---|---|---|
| Volatility | Lower (σ_gold drives φ_t) | Higher (independent — constitutional-change-log Phase 2 §25) | Silver's shock absorber threshold is hit more often → more trades suppressed |
| Liquidity | NON-HQLA, excluded from LCR/LRR | NON-HQLA, excluded from LCR/LRR, but "Strategic Liquidity" (available before gold) | Same classification, but silver is liquidated BEFORE gold in Article X order |
| Transaction cost | 10 bps VWAP (5+3+2) | **20 bps VWAP** (7+8+5 — highest) | Silver's transaction-cost threshold binds at smaller drift → fewer silver trades executed |
| Market depth | Deep (LBMA) | Thinner | Max single silver trade $10M (vs gold $25M) — §6 Phase 2 design |
| Hysteresis | 2pp + 2 cycles | 2pp + 2 cycles (same) | Same anti-whipsaw |
| Exhaustion Certificate | Required for gold liquidation | NOT required (silver may be sold before gold) | Silver is more readily liquidated in stress |

### 4.3 Silver does NOT automatically mirror gold

**Rule:** A gold rebalance does NOT automatically trigger a corresponding silver rebalance. Each metal is evaluated independently against its own thresholds.

**Why:** Silver has higher volatility, lower liquidity, and higher transaction costs. If gold drifts up (φ_t increases), silver's share mathematically decreases (1−φ_t) — but the system does NOT automatically sell silver to buy gold. Instead:
1. The φ_t drift is evaluated against the §3 hysteresis (2pp + 2 cycles).
2. The transaction-cost filter checks whether the silver sale + gold purchase is economic (silver 20 bps + gold 10 bps = 30 bps total cost).
3. If the trade is uneconomic, it is SUPPRESSED (Tier 1 — observe) even if φ_t is technically outside the band.
4. Only if the drift persists AND the trade is economic AND hysteresis confirms does the rebalance execute.

This prevents the whipsaw pattern: buy gold/sell silver → market moves → sell gold/buy silver → repeat, destroying value through transaction costs.

---

## 5. Gold/Silver Ratio φ_t

### 5.1 Bands

| Band | φ_t range | Action | Blueprint ref |
|---|---|---|---|
| **φ_min (constitutional hard floor)** | 60% | No rebalance can push φ_t below this. If φ_t hits 60%, the system MUST buy gold (or sell silver) — but only if economically viable (§6). | §25.2 |
| **φ_max (constitutional hard cap)** | 95% | No rebalance can push φ_t above this. If φ_t hits 95%, the system MUST sell gold (or buy silver). | §25.2 |
| **Normal band** | 75% - 85% | No action (Tier 0). φ_t target operates here. Dynamic target adjusts within this band by gold EWMA vol. | §25.2, Phase 2 §3.2 |
| **Rebalance band** | 60% - 75% OR 85% - 95% | Tier 2 — normal rebalance. `bullion_band` trigger fires (medium if within 2pp of normal band edge, high if in the outer rebalance band). | §25.2, §29.1 |
| **Emergency band** | <60% OR >95% | Constitutionally impossible — the hard floor/cap prevents this. If oracle reports φ_t outside [60%, 95%], it indicates an oracle error or an unauthorized state change → Tier 3 emergency. | §25.2 |

### 5.2 Hysteresis (anti-whipsaw)

**Rule:** A φ_t change requires:
1. The proposed φ_t differs from current φ_t by >2pp (the hysteresis band).
2. The proposed φ_t has been observed for 2 consecutive evaluation cycles.
3. The trade is economically viable (§6 transaction-cost filter).

**Anti-whipsaw mechanism:**
```
if |proposed_φ_t − current_φ_t| ≤ 2pp:
    # Within hysteresis band — no action
    hold current_φ_t; reset observation_counter
elif observation_counter < 2:
    # First observation of drift — hold and watch
    hold current_φ_t; increment observation_counter
else:
    # Confirmed drift — but check economics
    if is_economically_viable(proposed_trade):
        execute rebalance (Tier 2)
        reset observation_counter
    else:
        # Uneconomic — suppress even though drift is confirmed
        defer (Tier 1 — observe)
        log suppression reason
```

This prevents the repeated buy-gold/sell-silver → reverse pattern. The system will NOT execute a φ_t correction unless the drift is confirmed (2 cycles) AND economic (benefit > cost).

---

## 6. Trade Suppression Rule

### 6.1 The Rule

**Do not execute a trade if:**

```
expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer
```

**unless** an emergency constitutional condition exists (§33 SDP, §44 Constitutional Emergency, or a Tier 3 trigger).

### 6.2 Components

| Component | How computed | Blueprint ref |
|---|---|---|
| **Expected benefit** | The drift reduction × portfolio value. `benefit = |current_weight − target_weight| × totalReserveValue × expected_correction_half_life` | §29.4 |
| **Transaction cost** | `computeRebalanceFee(assetClass, tradeValue, method)`. Gold 10 bps, silver 20 bps, cash 0, sovereign 4, stablecoin 6, fiat-FX 7. Method multipliers (VWAP 1.0, TWAP 1.2, RFQ 0.8, etc.) applied to execution + slippage. | §29.5 |
| **Slippage** | Included in `computeRebalanceFee` (gold 3 bps, silver 8 bps, etc.). Estimated from market depth model. | §29.5 |
| **Market impact** | `estimateMarketImpact(assetClass, tradeValue)`. If >20 bps, switch to RFQ method. Linear with trade size / market depth. | Phase 2 §6.4 |
| **Risk buffer** | 2 bps additional cushion for execution uncertainty, oracle delay, and custodian settlement risk. Conservative — biases toward NOT trading. | Institutional prudence |

### 6.3 Emergency Override

The trade suppression rule is **suspended** only under:
- §33 SDP triggered (>5% deviation / sovereign default)
- §44 Constitutional Emergency declared (24h, Council supermajority)
- `concentration_cap` breach (>60% — critical, must act)
- `reserve_ratio` <100% (constitutional invariant breach — must act)
- `minimum_floor` breach (<0.5% — must act to maintain basket integrity)

In these cases, the trade executes even if uneconomic, because the constitutional cost of inaction exceeds the transaction cost. Each emergency trade is logged with the trigger evidence and requires post-incident audit.

---

## 7. Redemption Priority

### 7.1 During a redemption stress event, the following priority governs:

| # | Priority | What it means | Blueprint ref |
|---|---|---|---|
| 1 | **Preserve settlement liquidity** | Maintain LCR ≥1.0 and LRR ≥1.0. If a redemption would drop LCR below 1.0, the system liquidates HQLA assets (stablecoins → cash → sovereign) FIRST. | §5, §29.6, Article XIII |
| 2 | **Preserve constitutional reserve floor** | RR ≥100% is the hard invariant. If redemptions push RR toward 100%, minting auto-pauses (§4). The system does NOT sell gold to maintain minting — it pauses minting instead. | §4, Invariant 1 |
| 3 | **Preserve custodian integrity** | No custodian is asked to liquidate beyond their operational capacity. Custodian failure → `simulateCustodianFailure` redistributes to survivors. Multi-custodian cap (25%) maintained. | §10, custody-framework-v2 |
| 4 | **Delay nonessential rebalancing** | All Tier 0 and Tier 1 rebalances are SUSPENDED during a redemption stress event. Only Tier 3 (emergency) rebalances execute. Routine φ_t corrections, weight drift adjustments, and scheduled rebalances are deferred until the stress event resolves. | §29.4, §44 |
| 5 | **Never sell illiquid assets merely to satisfy a routine rebalance** | Gold (and silver, to a lesser extent) are NOT sold to satisfy a Tier 0/1/2 rebalance during stress. The Bullion Protection Rule (Article X / Invariant 5) enforces the liquidation order: stablecoins → cash → sovereign → silver → gold (LAST). Gold liquidation requires an Exhaustion Certificate proving all superior tiers are depleted. | Article X, Invariant 5, §34 |

### 7.2 Liquidation Order (Article X)

```
1. Stablecoins (HQLA Level 2B, fastest to convert, 0% of gold risk)
2. Cash (HQLA Level 1, 0% haircut, immediate)
3. Sovereign (HQLA Level 2A, 2% haircut, T+1 settlement)
4. Silver (Strategic Liquidity, days-to-weeks, 20 bps cost)
5. Gold (Constitutional Strategic Capital, LAST — requires Exhaustion Certificate)
```

This order is **constitutionally mandated** and cannot be overridden by the operator. Only the Constitutional Council can deviate, under §44 Constitutional Emergency (24h, supermajority, post-incident audit).

---

## 8. Emergency Mode

### 8.1 Emergency mode must NOT become discretionary

**Rule:** Emergency mode is triggered by **objective, measurable conditions** — never by operator judgment. The operator cannot declare an emergency; only the engine (via triggers) or the Constitutional Council (via §44 supermajority vote) can.

### 8.2 Objective Triggers

| Trigger | Condition | Tier | Blueprint ref |
|---|---|---|---|
| **Reserve ratio breach** | RR <100% (constitutional invariant breach) | Tier 3 (critical) | §4, Invariant 1 |
| **Concentration cap breach** | Any currency weight >60% | Tier 3 (critical) | §22A |
| **Severe Deviation Protocol** | Any currency or gold deviates >5% from reference price | Tier 3 | §33 |
| **Sovereign default** | Reference sovereign defaults (SDP sub-trigger) | Tier 3 | §33 |
| **LCR breach** | LCR <1.0 (liquidity crisis) | Tier 3 (high) | §5, §29.6 |
| **LRR critical** | LRR <0.9 | Tier 3 | Article XIII |
| **Stablecoin depeg** | Any stablecoin deviates >10% from $1.00 | Tier 3 | §27 |
| **Custodian failure** | A custodian becomes insolvent or inaccessible | Tier 3 (existential) | custody-framework-v2 |
| **Oracle failure** | Oracle quorum <5 sources OR freshness >1hr | Tier 3 | §31 |
| **Gold/silver market closure** | LBMA or relevant market closed | Tier 3 (existential) | constitutional-change-log Article XV |
| **§44 Constitutional Emergency** | Constitutional Council declares (supermajority, 24h expiry) | Tier 3 | §44 |

### 8.3 Emergency Mode Behavior

When ANY objective trigger fires:

1. **Minting auto-pauses** if RR<100% (on-chain `MTQ._checkReserveRatio`).
2. **Tier 0/1/2 rebalances SUSPENDED** — only Tier 3 executes.
3. **Severity routing:** critical = 5/5 unanimous approval + Constitutional Council flag.
4. **Article X liquidation order enforced** — gold is NOT liquidated unless all superior tiers exhausted + Exhaustion Certificate.
5. **3% weekly cap may be exceeded** under documented emergency (requires Council authorization + post-incident audit).
6. **§44 emergency levels:** Normal → Heightened Watch (30d) → Emergency (7d) → Constitutional Emergency (24h). Each has an expiry — emergency mode auto-lifts if the trigger resolves.
7. **Audit trail:** every emergency action logged with trigger evidence, Council resolution, and post-incident review requirement.

### 8.4 What Emergency Mode Does NOT Do

- Does NOT allow operator discretion (objective triggers only).
- Does NOT suspend redemption (§34 — redemption is NEVER paused, even in emergency).
- Does NOT allow gold liquidation without Exhaustion Certificate (Invariant 5 holds).
- Does NOT bypass the audit trail (every emergency action is recorded).
- Does NOT become permanent (every emergency has an expiry; auto-lifts when trigger resolves).

---

## 9. Alignment with Phase 1 + Phase 2

This policy does NOT contradict:
- The v19.0.3 blueprint (every rule traces to a § reference)
- The Phase 1 canonical audit (addresses all 12 risk findings)
- The Phase 2 stability design (formalizes the same mechanisms with operational specifics)

| Phase 2 design element | Phase 3 policy formalization |
|---|---|
| 6 buckets × 9 properties | §1: 6 components × 13 properties (adds soft/hard deviation, turnover/day, turnover/month, required liquidity, required approval) |
| 7 protective mechanisms | §2: currency increase/decrease rules formalize when each mechanism engages |
| Gold/silver φ_t layer | §3-5: gold policy, silver policy (no auto-mirror), φ_t bands (5 bands) + hysteresis |
| DRIFT→VALIDATE→CONFIRM→PROPOSE→APPROVE→EXECUTE→RECONCILE | §6: trade suppression rule (VALIDATE stage) + §7: redemption priority (RECONCILE stage) |
| 4 tiers (T0-T3) | §8: emergency mode = T3 objective triggers |
| Scale-aware limits | §1 properties 9-11: per-event/day/month turnover caps |

---

## 10. Final Declaration

**NO CODE CHANGES WERE MADE.**

This is a Phase 3 formal policy specification. It:
- Uses ONLY the latest blueprint + Phase 1 canonical audit + Phase 2 stability design
- Does NOT invent contradictory monetary rules
- Formalizes 13 properties for each of 6 reserve components
- Specifies currency rebalancing (increase/decrease conditions + no single-observation major rebalance)
- Specifies gold policy (5 required + 3 must-not-compromise)
- Specifies silver policy (same principles + higher vol/lower liquidity/higher costs → no auto-mirror)
- Specifies φ_t bands (φ_min, φ_max, normal, rebalance, emergency) + hysteresis
- Specifies trade suppression (benefit ≤ cost + slippage + impact + risk buffer)
- Specifies redemption priority (5 rules + Article X liquidation order)
- Specifies emergency mode (objective triggers, non-discretionary)

Implementation is Phase 4 (separate authorization required).

The policy stops here.
