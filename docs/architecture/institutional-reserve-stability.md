# MITHQAL — Institutional Reserve Stability Layer
## Phase 2 — DESIGN ONLY (No Code Changes)

**Date:** 2026-08-10
**Status:** Design specification — not yet implemented
**Foundation:** `docs/verification/reserve-canonical-audit.md` (Phase 1 canonical audit) + v19.0.3 blueprint
**Design authority:** Chief Monetary Architect / Chief Risk Officer / Chief Systems Architect

---

## 0. Design Objective

Design the institutional-grade reserve stability layer for MITHQAL that makes the institution:

- **Dynamically adaptive** — responds to market conditions within constitutional bounds
- **Non-speculative** — never trades for return; trades only for constitutional compliance
- **Deterministic** — same inputs produce same outputs; no operator discretion
- **Resistant to volatility** — shock absorber dampens short-term noise
- **Resistant to currency shocks** — SDP + bounded momentum prevent cascade
- **Resistant to concentration** — multi-tier caps prevent single-point dominance
- **Resistant to liquidity crises** — LCR/LRR gates + redemption buffer
- **Resistant to redemption waves** — sequential liquidation order + LRR
- **Resistant to rebalancing whipsaw** — hysteresis + observation period
- **Institutionally governable** — severity-routed approvals + audit trail

**Optimization priority (inviolable):**

```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY
```

The system does NOT optimize for maximum return. Every design choice trades efficiency for resilience.

---

## 1. Reserve Buckets — Institutional Treatment

Six buckets, mapped to the constitutional 4-tier model (v18 Part 2 Article III) and the v19.0.3 3-category operational view.

### Bucket 1: Eligible Currencies (8 sovereign fiats)

| Property | Specification | Blueprint ref |
|---|---|---|
| **Currencies** | USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD | §19.5.2 |
| **Target weight** | Per §13 structural weight: COFER 50% + SWIFT 40% + BIS 10%, adjusted by §16 bounded momentum (±5%) + mean reversion (±2%) + shock absorber | §13, §16 |
| **Permitted range** | Per-currency: floor 0.5% (§22A), cap 60% (§22A). Aggregate fiat layer: 70-80% of total reserves | §22A, §23-27 |
| **Minimum floor** | 0.5% per currency (`minimum_floor` trigger, high severity) | §22A |
| **Maximum cap** | 60% per currency (`concentration_cap` trigger, critical severity). Group cap: regional ≤70%. Reserve-level: single currency ≤50% | §21, §22A |
| **Liquidity classification** | HQLA Level 1 (central-bank-quality cash) / Level 2A (sovereign ≤1yr). Counts toward LCR numerator | §5 |
| **Volatility treatment** | §17 shock absorber: σ≤2%→A_t=1.0; σ≥5%→A_t=0.5; linear between. Applied to combined momentum×reversion factor | §17.4 |
| **Rebalancing priority** | Tier 2 (normal rebalance) for weight_drift; Tier 3 (emergency) for concentration_cap breach or SDP | §29 |
| **Emergency treatment** | §33 SDP on >5% deviation or sovereign default → currency lifecycle full→suspended → §20 normalization (others rise proportionally). Sanctions → immediate suspension | §33, §12, §20 |

### Bucket 2: Gold (XAU)

| Property | Specification | Blueprint ref |
|---|---|---|
| **Target weight** | φ_t × bullion_layer_weight. Default φ_t=0.80; dynamic 0.75-0.85 by gold EWMA vol | §25.2 |
| **Permitted range** | φ_t ∈ [60%, 95%] of bullion. Bullion ∈ [15%, 25%] of total reserves | §25.2, §23-27 |
| **Minimum floor** | φ_t ≥ 60% (constitutional hard floor) | §25.2 |
| **Maximum cap** | φ_t ≤ 95% (constitutional hard cap). Bullion ≤ 25% of total | §25.2 |
| **Liquidity classification** | NON-HQLA. Excluded from LCR numerator. Excluded from LRR by Bullion Protection Rule | §5, Article XIII |
| **Volatility treatment** | Gold EWMA vol drives φ_t: >3%→φ_t=0.75; <0.5%→φ_t=0.85; else 0.80. Shock absorber applies to rebalance magnitude | §17.4, §25.2 |
| **Rebalancing priority** | Tier 2 for `bullion_band` breach (medium/high). Tier 3 only if gold market closure (existential) | §29 |
| **Emergency treatment** | **Bullion Protection Rule (Invariant 5):** Gold is liquidated LAST — only after stablecoins, cash, sovereign, and silver are exhausted. Requires Exhaustion Certificate signed by Reserve Manager + ratified by Risk Committee. `liquidateGold()` is a forbidden selector on-chain | Article X, §34, §45 |

### Bucket 3: Silver (XAG)

| Property | Specification | Blueprint ref |
|---|---|---|
| **Target weight** | (1 − φ_t) × bullion_layer_weight. Default 0.20; dynamic 0.15-0.25 | §25.2 |
| **Permitted range** | Silver share ∈ [5%, 40%] of bullion. Bullion ∈ [15%, 25%] of total | §25.2 |
| **Minimum floor** | 5% of bullion (constitutional) | §25.2 |
| **Maximum cap** | 40% of bullion (constitutional) | §25.2 |
| **Liquidity classification** | NON-HQLA. Excluded from LCR + LRR. "Strategic Liquidity" — available for redemption settlement within days to weeks, before gold | Article XIII |
| **Volatility treatment** | Silver has independent volatility (constitutional-change-log Phase 2 §25). Higher transaction cost (20 bps VWAP vs gold 10 bps) — rebalancing penalized | §25, §29.5 |
| **Rebalancing priority** | Tier 2 for `bullion_band` breach. Liquidated BEFORE gold in emergency (Article X liquidation order) | §29, Article X |
| **Emergency treatment** | May be sold to satisfy redemption pressure before gold. Subject to §29.5 fee (20 bps — highest). No Exhaustion Certificate required (unlike gold) | Article X, §29.5 |

### Bucket 4: Cash / Liquid Instruments

| Property | Specification | Blueprint ref |
|---|---|---|
| **Target weight** | 2/3 of fiat layer. Fiat layer: 70-80% of total. Cash target ≈ 46.7-53.3% of total (2/3 × 70-80%) | §24 |
| **Permitted range** | Fiat layer [70%, 80%]. Within fiat: cash 2/3, sovereign 1/3 | §24, §23-27 |
| **Minimum floor** | None per-currency (cash is USD-denominated central-bank-quality). Fiat layer floor 70% | §23 |
| **Maximum cap** | Fiat layer cap 80%. Cash share within fiat capped at 2/3 + buffer | §23-27 |
| **Liquidity classification** | HQLA Level 1 (central-bank-quality). 0% constitutional haircut (§6). Counts fully toward LCR | §5, §6 |
| **Volatility treatment** | N/A (USD-denominated, no market volatility). 0% haircut means 1:1 R_a contribution | §6 |
| **Rebalancing priority** | Tier 1 (observe) for minor drift. Cash is the primary RR buffer — increased when RR<102% (§19.2) | §19.2 |
| **Emergency treatment** | First line of defense in redemption liquidation order (after stablecoins). Increased during stress to maintain RR≥102% | Article X, §19.2 |

### Bucket 5: Stable Settlement Assets (USDC/USDT/DAI)

| Property | Specification | Blueprint ref |
|---|---|---|
| **Target weight** | 5% of total reserves (policy target). Range 2-8% | §26 |
| **Permitted range** | [2%, 8%] of total reserves | §26 |
| **Minimum floor** | 2% (operational liquidity minimum) | §26 |
| **Maximum cap** | 8% (prevents stablecoin over-reliance). Per-issuer ≤15% (§10). Stablecoin must be "full" lifecycle status | §26, §10, §27 |
| **Liquidity classification** | HQLA Level 2B (subject to 2% haircut per §6). Counts toward LCR at 98% value | §5, §6 |
| **Volatility treatment** | Depeg monitoring: `stablecoin_eligibility` trigger fires if status ≠ "full" (medium/high severity). 10% depeg → suspension | §27, §12 |
| **Rebalancing priority** | Tier 2 for `stablecoin_eligibility` breach. Tier 3 for systemic depeg event | §29 |
| **Emergency treatment** | FIRST to be liquidated in Article X liquidation order. Fastest to convert to cash. Subject to issuer risk cap (§10: ≤15% per issuer) | Article X, §10 |

### Bucket 6: Sovereign / High-Quality Fixed-Income

| Property | Specification | Blueprint ref |
|---|---|---|
| **Target weight** | 1/3 of fiat layer. Sovereign target ≈ 23.3-26.7% of total (1/3 × 70-80%) | §24 |
| **Permitted range** | Within fiat: 1/3. Sovereign must be US T-bills ≤1yr duration | §24 |
| **Minimum floor** | None individual (part of fiat layer floor 70%) | §23 |
| **Maximum cap** | 1/3 of fiat. Duration ≤1yr (constitutional). Per-issuer ≤15% (§10) | §24, §10 |
| **Liquidity classification** | HQLA Level 2A. 2% constitutional haircut (§6). Counts toward LCR at 98% value | §5, §6 |
| **Volatility treatment** | Interest-rate sensitive (modified duration ≤0.5). Stress coefficient 0.90 (10% stress haircut in NAV_stress) | §6, nav-compute.ts |
| **Rebalancing priority** | Tier 1/2 for duration drift. Liquidated after cash in Article X order | Article X |
| **Emergency treatment** | Third line of defense (after stablecoins, cash). Sovereign default → §33 SDP → currency lifecycle suspension | Article X, §33 |

---

## 2. Dynamic Currency Model

### 2.1 Core Principle

Relative currency strength affects reserve composition — but **never suddenly, never discretionarily, never beyond constitutional limits.**

A stronger currency may gain weight only within constitutional bounds (momentum ±5%, concentration cap 60%, hysteresis 2% band, 2-observation confirmation).

A severely weakened currency may lose weight progressively — via §12 lifecycle (full→suspended) and §20 normalization, never via a single large trade.

**No discretionary operator override.** The operator cannot pick weights, override triggers, or bypass severity routing.

### 2.2 Seven Protective Mechanisms (Layered)

#### Mechanism 1: Bounded Momentum (§16.1)

```
rawMomentum = P_12mo_ago / P_today
M_i = clamp(rawMomentum, 0.95, 1.05)  // ±5% hard cap
```

A currency cannot gain or lose more than 5% of its weight due to momentum alone. The cap is absolute — no override, no exception.

**Blueprint ref:** v18 Part 2 Article VI Component 2. Code: `monetary-engine-v19.ts:312 L_MOMENTUM = 0.05`.

#### Mechanism 2: Volatility Dampening (§17.4 Shock Absorber)

```
A_t = 1.0                    if σ ≤ 2%
A_t = 0.5                    if σ ≥ 5%
A_t = 1.0 − 0.5 × (σ−0.02)/(0.05−0.02)   // linear between

combinedFactor = 1 + A_t × (M_i × R_i − 1)
```

During high volatility (σ≥5%), weight adjustments are capped at half the normal rate. This prevents the algorithm from amplifying market movements.

**Blueprint ref:** v18 Part 2 Article VI Component 5. Code: `monetary-engine-v19.ts:412-443`.

#### Mechanism 3: Hysteresis (§22B Anti-Whipsaw)

```
if |proposed_weight − current_weight| ≤ 2%:
    keep current_weight; reset observation_counter
elif observation_counter < 2:
    hold current_weight; increment observation_counter
else:  # counter ≥ 2
    apply proposed_weight; reset counter
```

A weight change >2% must be observed for **2 consecutive evaluation cycles** before it is applied. This eliminates whipsaw — a single volatile quarter cannot permanently distort the basket.

**Blueprint ref:** §22B (code-defined; principle in v18 Part 3 Article I). Code: `monetary-engine-v19.ts:541-631`.

#### Mechanism 4: Minimum Observation Period

Currency weight changes are evaluated on:
- **Structural weight:** quarterly (COFER/SWIFT/BIS data cadence)
- **Momentum:** monthly (v18 Part 2 Article VI line 5875)
- **Mean reversion:** quarterly (v18 Part 2 Article VI Component 3)
- **Shock absorber:** real-time (continuously computed, but only ACTS when thresholds breach)

No intra-day weight changes. The shortest evaluation cycle is monthly (momentum). This prevents high-frequency speculation.

#### Mechanism 5: Concentration Limits (§21/§22A)

| Limit | Value | Trigger |
|---|---|---|
| Per-currency floor | 0.5% | `minimum_floor` (high) |
| Per-currency cap | 60% | `concentration_cap` (critical) |
| Regional group cap | 70% | manual review |
| Minimum diversity | 3 currencies | hard gate |
| Single currency in reserves | ≤50% | distinct from basket cap |

Even if momentum + reversion would push a currency above 60%, the `applyConcentrationCap` function iteratively caps and redistributes the excess proportionally to uncapped currencies.

**Code:** `monetary-engine-v19.ts:488-525`.

#### Mechanism 6: Liquidity Tests (§5/§29.6)

Before any rebalance is approved:
- **LCR check:** projected post-trade LCR must be ≥1.0 (else plan rejected, requires phasing)
- **LRR check:** Liquidity Readiness Ratio ≥1.0 (excludes gold/silver by Bullion Protection Rule)
- **Redemption buffer:** ≥2% of reserves (target 5%)

A currency cannot gain weight if doing so would drop LCR below 1.0 — even if momentum favors it.

**Code:** `v19-infrastructure.ts:3320-3338 verifyRebalancePlanLiquidity`. `lrr.ts:405-483 computeLrr`.

#### Mechanism 7: Severe Deviation Protection (§33 SDP)

```
deviation = |currentPrice / referencePrice − 1|

if deviation > 5%:
    SDP triggers
    K_SDP = referencePrice / currentPrice
    W_emergency = structuralWeight × K_SDP
    W_new = max(W_emergency, currentWeight × SDP_CAP)  // SDP_CAP = 0.50
    currency lifecycle: full → suspended
    §20 normalization: other currencies rise proportionally
```

A currency that deviates >5% from its reference price is subject to emergency weight recalculation. The `SDP_CAP = 0.50` ensures weights cannot drop more than 50% in a single event (anti-shock). The currency is then suspended via §12 lifecycle.

**Blueprint ref:** v19 addendum §6. Code: `v19-infrastructure.ts:188-266`.

### 2.3 Symmetry

All 7 mechanisms apply **symmetrically** to all 8 eligible currencies. v18 Part 2 Article V §2: "Criteria are applied uniformly." No currency receives preferential treatment — not even USD (which is capped at 60% despite its ~62% structural weight).

### 2.4 Progressive Weakening

A currency loses weight progressively through this sequence:

1. **Observation:** momentum/reversion detect sustained depreciation → weight drifts down (bounded ±5%)
2. **Probation:** if drift persists ≥2 quarters, §12 lifecycle: full → probation
3. **Suspension:** if SDP triggers (>5% deviation) or sanctions, §12 lifecycle: probation → suspended
4. **Normalization:** §20 — the suspended currency's weight redistributes proportionally to remaining eligible currencies
5. **Reinstatement:** §12 lifecycle: suspended → full requires Council approval (not automatic)

No step can be skipped. No operator override.

---

## 3. Gold/Silver φ_t Layer

### 3.1 Core Principle

Preserve the blueprint's φ_t mechanism — a **dynamic ratio within a constitutional band**, NOT a static fixed ratio. Gold and silver have independent volatility, liquidity, and stress behavior (constitutional-change-log Phase 2 §25: "No constitutional model may assume identical behaviour").

### 3.2 Bounded φ_t

```
φ_t ∈ [60%, 95%]  // constitutional hard band

Default target: φ_t = 0.80
Dynamic adjustment by gold EWMA volatility:
  σ_gold > 3%  → φ_t = 0.75  (reduce gold exposure when gold is volatile)
  σ_gold < 0.5% → φ_t = 0.85  (increase gold exposure when gold is stable)
  otherwise    → φ_t = 0.80
```

The band [60%, 95%] is a constitutional hard floor/cap — no rebalance can push φ_t outside this range. The dynamic target (75-85%) is the policy operating point within the band.

### 3.3 Hysteresis

φ_t changes require the same hysteresis as currency weights:
- |proposed φ_t − current φ_t| ≤ 2pp → no action
- >2pp deviation must persist for 2 consecutive evaluation cycles before applying

This prevents gold/silver rebalancing from reacting to transient price moves.

### 3.4 Minimum Trade Threshold

No gold/silver rebalance is triggered unless the deviation exceeds the economic threshold:

```
min_trade_threshold = max(
  2% of bullion layer weight,           // constitutional drift threshold
  transaction_cost_break_even           // the trade must be economic after fees
)

transaction_cost_break_even = |drift_value| > (gold_fee_bps + silver_fee_bps) × trade_value
```

If the deviation is smaller than the cost of correcting it, the rebalance is deferred. This prevents value destruction through over-trading.

**Fees (§29.5):** Gold 10 bps VWAP, Silver 20 bps VWAP (highest). A φ_t correction that costs more in fees than it saves in drift is economically irrational and constitutionally prohibited (§29.4 partial rebalancing principle: minimum transactions only).

### 3.5 Transaction-Cost Filter

Every proposed gold/silver trade passes through:

```
estimated_cost = computeRebalanceFee(assetClass, tradeValue, "TWAP")
  // gold: 5 exec + 3 slip + 2 spread = 10 bps
  // silver: 7 exec + 8 slip + 5 spread = 20 bps

if estimated_cost > drift_benefit:
    defer trade (Tier 1 — observe)
elif estimated_cost > 0.5 × drift_benefit:
    batch trade (defer to next cycle, combine with other drift)
else:
    execute trade (Tier 2)
```

**Method multipliers** (§29.5): VWAP 1.0, TWAP 1.2 (default), RFQ 0.8, Negotiated block 1.5, Algorithmic 1.1. Applied to execution + slippage, NOT spread. Large gold trades use RFQ (0.8x) for better pricing; small trades use TWAP (1.2x, slower but lower impact).

### 3.6 Maximum Turnover

```
weekly_gold_turnover_cap = 3% of gold holdings (Invariant I-4)
weekly_silver_turnover_cap = 3% of silver holdings

annual_gold_turnover_cap = 52 × 3% = 156% (implicit, not a separate cap)
```

No single gold/silver rebalance may exceed 3% of the respective holding per week. A large φ_t correction is phased over multiple weeks if needed.

### 3.7 Emergency Override

Gold/silver φ_t rebalancing is suspended under:
- **§33 SDP:** if gold deviates >5% from reference → emergency weights via `computeSDPEmergency`, normal φ_t suspended
- **§44 Constitutional Emergency (24h):** the Constitutional Council may freeze φ_t at its current value
- **Gold Market Closure (existential scenario):** gold cannot be traded → φ_t frozen until market reopens

**No operator override.** Only the Constitutional Council can override φ_t, and only under §44 Constitutional Emergency (24-hour expiry, requires supermajority).

### 3.8 What Does NOT Trigger Gold/Silver Rebalancing

- Tiny market price moves (below min_trade_threshold)
- Intra-day volatility (hysteresis requires 2-cycle confirmation)
- A single quarter of drift (observation period: 2 consecutive cycles)
- Normal minting/redemption (proportional, doesn't change weights)
- Custodian reconciliation (operational, not a rebalance trigger)

---

## 4. Rebalancing Principle

### 4.1 The Pipeline

```
DRIFT → VALIDATE → CONFIRM → PROPOSE → APPROVE → EXECUTE → RECONCILE
```

**NEVER:** `PRICE_MOVES → IMMEDIATE_TRADE`

| Stage | What happens | Who/what | Evidence required |
|---|---|---|---|
| **DRIFT** | `detectRebalanceTriggers(ctx)` detects a trigger (weight_drift, layer_breach, etc.) | Engine (automatic) | Trigger record: type, current vs target value, severity |
| **VALIDATE** | `verifyRebalancePlanLiquidity` + `verifyRebalancePlanReserveRatio` check the proposed plan won't breach LCR<1.0 or RR<100% | Engine (automatic) | LCR projection, RR projection, fee estimate |
| **CONFIRM** | Hysteresis check: has the drift persisted for 2 consecutive observations? | Engine (automatic) | Observation counter ≥2 |
| **PROPOSE** | `generateCrossAssetRebalancePlan` creates paired sell-buy actions with value conservation | Engine (automatic) | RebalancePlan with pairId-tagged actions, feeBreakdown |
| **APPROVE** | Severity-routed approval: low=2/5, medium=3/5, high=4/5, critical=5/5+Council | Institutional roles (human, unless SIMULATION) | Signed approval set matching severity threshold |
| **EXECUTE** | `executeRebalanceProposal` settles via custodians, writes to `executed` view | Treasury (automatic post-approval) | Settlement refs, custodian confirmations |
| **RECONCILE** | `commitCustodianConfirmation` updates `custodian` + `reconciled` views, computes variance | Reconciliation engine (automatic) | Custodian holdings vs executed, variance report |

### 4.2 What Each Stage Prevents

- **DRIFT → VALIDATE:** prevents a plan that would breach liquidity/RR
- **VALIDATE → CONFIRM:** prevents whipsaw (single volatile observation)
- **CONFIRM → PROPOSE:** prevents unvalidated trades
- **PROPOSE → APPROVE:** prevents unapproved execution (severity gate)
- **APPROVE → EXECUTE:** prevents execution without signed approval
- **EXECUTE → RECONCILE:** prevents un-reconciled state (custodian variance detected)

---

## 5. Rebalancing Tiers

Four tiers, escalating from no-action to emergency.

### TIER 0 — NO ACTION

| Property | Specification |
|---|---|
| **Trigger** | No trigger fired. All weights within hysteresis band (≤2% drift). LCR>1.2, RR>102%, φ_t within [60%,95%] with <2pp deviation. |
| **Delay** | N/A (no action) |
| **Approval** | None required |
| **Maximum turnover** | 0% |
| **Maximum trade size** | $0 |
| **Required evidence** | `detectRebalanceTriggers` returns empty list |
| **Execution restrictions** | None (nothing to execute) |
| **Frequency** | Evaluated real-time; action = hold |

### TIER 1 — OBSERVE

| Property | Specification |
|---|---|
| **Trigger** | `weight_drift` 2-3% (low severity). `bullion_band` within 2pp of edge (medium). `council_authorization` pending (low). Minor drift that doesn't meet Tier 2 thresholds. |
| **Delay** | Minimum 4 hours (`minDeferralHours = 4`), maximum 48 hours. Observation counter increments. |
| **Approval** | None (observation only, no trade) |
| **Maximum turnover** | 0% (no trade executed) |
| **Maximum trade size** | $0 |
| **Required evidence** | Trigger record logged to audit trail. Observation counter persisted. |
| **Execution restrictions** | No trade. System monitors for escalation to Tier 2 (if drift persists 2 cycles) or de-escalation to Tier 0 (if drift reverses). |
| **Frequency** | Evaluated every cycle (monthly for momentum, quarterly for structural). |

### TIER 2 — NORMAL REBALANCE

| Property | Specification |
|---|---|
| **Trigger** | `weight_drift` >3% (medium/high). `layer_breach` (high). `bullion_band` outside [60%,95%] (high). `stablecoin_eligibility` status≠full (medium/high). `currency_eligibility` status≠full (medium/high). `minimum_floor` W<0.5% (high). `reserve_ratio` RR<102% (medium). `lcr` LCR<1.2 (medium). |
| **Delay** | Tier 1-3 deviation: 30 days. Tier 4 deviation: 14 days. Gold/Silver deviation: 60 days. Minimum 4h deferral for batching. |
| **Approval** | low=2/5 roles, medium=3/5, high=4/5. SIMULATION auto-approves; SHADOW/LIVE requires manual POST. |
| **Maximum turnover** | 3% weekly weight change per asset (Invariant I-4). |
| **Maximum trade size** | 5% of totalReserveValue per single action (above this → phasing required per §29.6). |
| **Required evidence** | Trigger record + hysteresis confirmation (2 observations) + LCR projection ≥1.0 + RR projection ≥100% + fee breakdown + cross-asset pair (value conservation). |
| **Execution restrictions** | Cross-asset pairing (sell↔buy, value conserved). §29.5 fees computed. Post-trade RR recomputed. Custodian settlement. Reconciliation required post-execution. |
| **Frequency** | Quarterly scheduled + triggered-as-needed. |

### TIER 3 — EMERGENCY REBALANCE

| Property | Specification |
|---|---|
| **Trigger** | `concentration_cap` W>60% (critical). `reserve_ratio` RR<100% (critical — constitutional invariant breach). `lcr` LCR<1.0 (high). §33 SDP triggered (>5% deviation / sovereign default). §44 Constitutional Emergency declared. Gold market closure. Custodian failure. Oracle failure. |
| **Delay** | Immediate (no deferral). §44 Constitutional Emergency: 24-hour expiry. §44 Emergency: 7-day. §44 Heightened Watch: 30-day. |
| **Approval** | critical=5/5 (unanimous) + Constitutional Council flag. Under §44 Constitutional Emergency, the Council may authorize emergency rebalancing with expedited approval. |
| **Maximum turnover** | Suspended: the 3% weekly cap may be exceeded under documented emergency conditions (requires Council authorization + post-incident audit). |
| **Maximum trade size** | Suspended: large trades permitted to restore compliance, but each requires individual Council authorization. |
| **Required evidence** | Emergency declaration (§44 level) + trigger evidence + Council resolution + Exhaustion Certificate (if gold liquidation required). |
| **Execution restrictions** | Article X liquidation order enforced: stablecoins → cash → sovereign → silver → gold (LAST). Gold liquidation requires Exhaustion Certificate. SDP emergency weights applied. `computeSDPEmergency` overrides normal φ_t. |
| **Frequency** | As needed (emergency). Post-incident review mandatory. |

---

## 6. Money Limits — Scale-Aware Controls

### 6.1 Principle

> A $100,000 trade and a $100 million trade cannot be treated identically even if both are 1% of different portfolios.

Money limits are **scale-aware**: they combine percentage limits (proportional to portfolio size) with absolute institutional risk limits (fixed dollar ceilings that don't scale). Both must be satisfied.

### 6.2 Percentage Limits (Scale with Portfolio)

| Limit | Value | Rationale |
|---|---|---|
| **Single-action cap** | 5% of totalReserveValue | Prevents any single trade from dominating. Above 5% → §29.6 phasing required (split into smaller tranches). |
| **Weekly turnover cap** | 3% per asset per week (Invariant I-4) | Prevents excessive churning. Certora-proven. |
| **Daily turnover cap** | 1% per asset per day | Derived from weekly cap / 5 trading days. Prevents front-loading. |
| **Layer breach cap** | Max 5pp drift before critical severity | Prevents sudden layer composition shifts. |
| **φ_t adjustment cap** | ±5pp per rebalance event | Prevents large gold/silver ratio swings. |

### 6.3 Absolute Institutional Risk Limits (Fixed, Don't Scale)

These are **dollar-denominated ceilings** that apply regardless of portfolio size. They exist because market depth, counterparty risk, and operational risk don't scale linearly with portfolio size.

| Limit | Value | Rationale |
|---|---|---|
| **Max single counterparty exposure** | $50M per counterparty | §10 per-counterparty ≤10%. For a $500M portfolio, 10% = $50M. For a $5B portfolio, this cap binds before the percentage cap — because no single counterparty should bear >$50M of institutional risk. |
| **Max single custodian holding** | $125M per custodian | §10 per-custodian ≤25%. For a $500M portfolio, 25% = $125M. Larger concentrations create operational risk (custodian failure impact). |
| **Max single trade (gold)** | $25M per trade | Gold market depth: a >$25M single trade would move the LBMA spot price. Must phase via TWAP over multiple days. |
| **Max single trade (silver)** | $10M per trade | Silver market is thinner than gold (20 bps fee vs 10 bps). Larger trades cause disproportionate market impact. |
| **Max single trade (sovereign)** | $100M per trade | US T-bill market is deep, but >$100M single trades attract primary-dealer scrutiny. |
| **Max single trade (stablecoin)** | $50M per trade | Stablecoin redemption/issuance limits vary by issuer. >$50M may trigger issuer delays. |
| **Max daily gold turnover** | $50M | Prevents market manipulation detection. |
| **Max weekly gold turnover** | $150M | 3% of a $5B gold holding. |
| **Emergency single-trade cap** | $500M | Under Tier 3, larger trades permitted but each requires individual Council authorization + post-incident audit. |

### 6.4 Scale-Aware Logic

```
function canExecuteTrade(assetClass, tradeValue, totalReserveValue):
    // Percentage check
    pctOfReserve = tradeValue / totalReserveValue
    if pctOfReserve > 0.05:  // 5% single-action cap
        return PHASE_REQUIRED  // split into tranches

    // Absolute check (binds for large portfolios)
    absoluteCap = ABSOLUTE_TRADE_CAPS[assetClass]  // gold=$25M, silver=$10M, etc.
    if tradeValue > absoluteCap:
        return PHASE_REQUIRED  // split into tranches ≤ absoluteCap

    // Market depth check
    marketImpact = estimateMarketImpact(assetClass, tradeValue)
    if marketImpact > 0.002:  // >20 bps market impact
        return USE_RFQ  // switch to Request-for-Quote for better pricing

    // Liquidity check
    if projectedPostTradeLCR < 1.0:
        return REJECT  // would breach liquidity floor

    // All checks pass
    return APPROVED
```

### 6.5 Why Both Percentage AND Absolute?

**Percentage alone fails at scale:** A $5B portfolio with a 5% single-action cap allows a $250M gold trade — which would move the LBMA spot price and signal the institution's intent to the market.

**Absolute alone fails at small scale:** A $50M absolute cap on a $100M portfolio allows a 50% single trade — which would concentrate risk.

**Both together:** The binding constraint is whichever is smaller. For small portfolios, the percentage cap binds. For large portfolios, the absolute cap binds. This is **scale-aware** risk management.

### 6.6 Phasing (When a Trade Exceeds Limits)

When a proposed trade exceeds either the percentage or absolute cap, it is **phased**:

```
function phaseTrade(assetClass, totalValue, cap):
    tranches = []
    remaining = totalValue
    while remaining > 0:
        tranche = min(remaining, cap)
        tranches.push(tranche)
        remaining -= tranche
    // Execute tranches via TWAP over multiple days
    // Each tranche logged separately in the audit trail
    return tranches
```

A $100M gold trade (exceeding the $25M absolute cap) becomes 4 tranches of $25M each, executed via TWAP over 4 days. This minimizes market impact and avoids signaling.

---

## 7. Governance Integration

### 7.1 Severity Routing (§29.2)

| Severity | Trigger examples | Approval threshold | Mode |
|---|---|---|---|
| Low | `weight_drift` <3%, `council_authorization` | 2-of-5 roles | SIMULATION auto-approves |
| Medium | `weight_drift` 3-5%, `reserve_ratio` <102%, `lcr` <1.2 | 3-of-5 roles | SIMULATION auto-approves |
| High | `layer_breach`, `bullion_band`, `minimum_floor`, `lcr` <1.0 | 4-of-5 roles | SHADOW/LIVE: manual |
| Critical | `concentration_cap`, `reserve_ratio` <100%, SDP | 5-of-5 (unanimous) + Constitutional Council | SHADOW/LIVE: manual + Council flag |

### 7.2 The 5 Institutional Roles

1. `treasury_authority` — operational execution
2. `risk_authority` — risk assessment
3. `constitutional_authority` — constitutional compliance
4. `operations_authority` — operational readiness
5. `independent_oversight` — independent review

### 7.3 Audit Trail (§29.10)

Every stage of the pipeline writes to the immutable JSONL audit ledger:

```json
{
  "timestamp": "...",
  "proposalId": "...",
  "transition": "DRIFT→VALIDATE|VALIDATE→CONFIRM|...|EXECUTE→RECONCILE",
  "triggers": [...],
  "maxSeverity": "medium",
  "actor": "engine|treasury_authority|...",
  "executionMode": "SIMULATION|SHADOW|LIVE",
  "details": {...}
}
```

The ledger is append-only (`appendFileSync` — synchronous, intentional for integrity). It survives process restarts (file-based, not in-memory).

---

## 8. What This Design Does NOT Do

- **Does NOT optimize for return.** Every trade is for constitutional compliance, not yield.
- **Does NOT allow operator weight selection.** The operator can approve/reject proposals but cannot set weights.
- **Does NOT allow immediate trades on price moves.** The DRIFT→VALIDATE→CONFIRM→PROPOSE→APPROVE→EXECUTE→RECONCILE pipeline ensures minimum delay.
- **Does NOT allow large one-time trades.** Scale-aware phasing splits oversized trades.
- **Does NOT allow gold liquidation except as last resort.** Bullion Protection Rule + Exhaustion Certificate.
- **Does NOT allow rebalancing whipsaw.** Hysteresis (2% band, 2-observation) prevents single-event overreaction.
- **Does NOT allow discretionary overrides.** Only the Constitutional Council can override, under §44 Constitutional Emergency (24h expiry, supermajority).

---

## 9. Alignment with Phase 1 Canonical Audit

This design addresses the following findings from `docs/verification/reserve-canonical-audit.md`:

| Audit finding | How this design addresses it |
|---|---|
| CRITICAL: §29 engine not wired into live API | §4 pipeline requires `detectRebalanceTriggers` as the DRIFT stage |
| CRITICAL: §34 Bullion Preservation not on-chain | §1 Bucket 2/3 + §5 Tier 3 enforce Article X liquidation order |
| HIGH: §10 caps not runtime-gated | §2.2 Mechanism 5 + §6 scale-aware caps enforce at execution |
| HIGH: 7 holding states conflated | §4 pipeline RECONCILE stage + 7-state separation |
| MEDIUM: 3% weekly cap not enforced | §6.2 weekly turnover cap explicit |
| MEDIUM: SDP not actively triggered | §2.2 Mechanism 7 wires SDP into the dynamic model |
| MEDIUM: SIMULATION auto-approves | §7.1 severity routing + EXECUTION_MODE env var |

**This is a DESIGN document.** Implementation is Phase 3 (separate authorization required). No code changes were made.
