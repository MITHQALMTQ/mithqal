# MITHQAL — CANONICAL BLUEPRINT v21
## Gold-Anchored Global Reserve Architecture

**Version:** 21.0
**Date:** 2026-08-12
**Status:** CANONICAL — supersedes v20 and all prior versions
**Authority:** COO/CTO/CFO/PM + Monetary Systems Architect + Institutional Reserve Manager
**Supersedes:** v20 (2026-08-11), v19, v18, and all addenda

---

## 0. SUPREMACY CLAUSE

This document is the **single authoritative blueprint** for MITHQAL. It reconciles:
- The v20 Canonical Blueprint (612 lines)
- The Enhanced H++ architecture study (shadow model v4-v6)
- The Gold-Referenced Framework Assessment (shadow model v7)
- All Phase 2.5 reserve optimization studies
- 39 post-blueprint engineering rules (Phases 1-5)

**Where any prior document conflicts with this blueprint, this blueprint wins.**

**Optimization priority (inviolable):**
```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY > RETURN
```

**Monetary identity (v21 addition):**
MITHQAL is a **gold-anchored, globally diversified, reserve-backed monetary infrastructure with a fixed settlement PAR.** Gold is the strategic anchor. PAR is the settlement reference. The reserve portfolio provides solvency. These three functions are separate and must not be conflated.

---

## 1. CONFLICT RESOLUTIONS (7 Reconciliations)

### 1.1 Platinum — RESOLVED: NO PLATINUM
**Resolution:** No platinum. Dynamic φ_t gold/silver only within the bullion tier.

### 1.2 Currency Concentration Cap — RESOLVED: 35% USD HARD CAP (v21 update)
**v20:** 60% per-currency cap
**v21 Resolution:** The 60% general per-currency cap is RETAINED as the constitutional maximum. However, a **35% USD-specific hard cap** is added (v21 §6.6) to prevent USD from becoming the hidden monetary anchor. The current runtime violates this (USD=81.9%) and MUST be corrected.

### 1.3 Reserve Tiers — RESOLVED: THREE-PILLAR ARCHITECTURE (v21 formalization)
**v21 Resolution:** The 4-tier constitutional model (v20 §1.3) is retained for regulatory/accounting purposes. A **three-pillar strategic architecture** is formalized (v21 §4.4) for monetary design:
- Pillar A — Bullion Anchor (Gold + Silver): 20%
- Pillar B — Global Fiat Reserve (Cash + Sovereign): 75%
- Pillar C — Stablecoin Liquidity: 5%

The 4-tier and 3-pillar models are compatible views of the same reserve.

### 1.4 Liquidation Order — RESOLVED: ARTICLE X SEQUENTIAL
**Resolution (unchanged):** Article X sequential liquidation:
1. Stablecoins → 2. Cash → 3. Sovereign → 4. Silver → 5. Gold LAST (Exhaustion Certificate required)

### 1.5 Reserve Ratio — RESOLVED: PAR-BASED (unchanged)
**Resolution (unchanged):**
```
RR = R_a / (S × PAR), where PAR = $1.00 (fixed)
RR ≥ 100% (constitutional floor), RR ≥ 102% (policy target)
```
**v21 clarification:** RR is the LEGAL solvency metric. It is NOT tautological. It is NOT replaced by GRI or any gold-referenced formula. The redemption liability `L = S × PAR` is FIXED in USD terms and does NOT float with gold price.

### 1.6 Article Count — RESOLVED: 56 ARTICLES (unchanged)

### 1.7 Gold-Referenced Measurement — NEW (v21)
**Resolution:** Gold is the constitutional monetary anchor. The **Gold-Relative Index (GRI)** is added (v21 §3.7) as an ADVISORY health metric. GRI measures purchasing power relative to gold but does NOT:
- Change PAR (PAR = $1.00, fixed)
- Trigger automatic rebalancing
- Serve as the legal solvency metric (that remains RR)

---

## 2. CONSTITUTIONAL IDENTITY

MITHQAL is a **gold-anchored Constitutional Settlement Institution** — a neutral, 100%+ reserved, gold-disciplined, Sharia-compliant settlement infrastructure for international trade.

**What it is NOT:** Not a bank, not a lending platform, not a payment processor, not a marketplace, not a DeFi protocol, not a speculative asset, not a DAO, not a stablecoin, not a gold-backed token.

**What it IS:** Gold-anchored, globally diversified, reserve-backed monetary infrastructure with a fixed settlement PAR.

**Anti-Platform Clause (permanent, non-amendable):** The Institution shall not engage in lending, exchange operations, brokerage, asset management, derivatives, DeFi, or any commercial platform services. This is permanently frozen.

**No Governance Tokens:** Governance rights vested in the Monetary Council, not token holders.

**Founder Holdings Cap:** ≤20% of circulating supply (permanent, non-amendable).

**Five Constitutional Monetary Rules (v21):**
1. Gold is the primary strategic anchor
2. Silver is secondary, not co-anchor
3. No fiat currency is permanently dominant
4. Currency weights are dynamic but constrained
5. PAR remains stable; reserves absorb changes

---

## 3. MONETARY ARCHITECTURE

### 3.1 Single MTQ Token
One MTQ. One supply. One NAV. One liquidity pool. ERC-20, 18 decimals.

### 3.2 PAR (Face Value)
```
PAR = $1.00
```
The constitutional face value of one MTQ. The liability is `L = S × PAR` (fixed). This is the redemption anchor. PAR does NOT float with gold price. PAR does NOT change with CPI. PAR is fixed, deterministic, and permanent.

### 3.3 NAV (Net Asset Value)
```
NAV_m = R_m / S    (Market NAV — mark-to-market reserve value per MTQ)
NAV_l = R_a / S    (Prudential NAV — post-haircut, post-counterparty-score)
NAV_s = R_l / S    (Stress NAV — post-haircut, post-counterparty-score, post-stress-coefficient)
```

### 3.4 Reserve Ratio (§4)
```
RR = R_a / (S × PAR)

R_m = Σ Q_a × P_a                                    (market reserve value)
R_a = Σ Q_a × P_a × (1 − H_a) × C_a                  (adjusted reserve value)
R_l = Σ Q_a × P_a × (1 − H_a) × C_a × S_a            (stress reserve value)

Where:
  Q_a = quantity of asset a
  P_a = market price of asset a
  H_a = constitutional haircut (§6)
  C_a = counterparty score (§7, multiplicative: Credit × Jurisdiction × Operational)
  S_a = stress coefficient (cash 0.95, sovereign 0.90, gold 0.85, silver 0.80, stablecoin 0.80)
```

**v21 clarification:** RR is the LEGAL solvency metric. It is NOT tautological. It is NOT replaced by GRI. It determines minting pause, emergency mode, and redemption throttle.

### 3.5 Haircut Table (§6)
| Asset Class | Haircut (H) |
|---|---|
| Cash (central-bank-quality) | 0% |
| Sovereign (T-bills ≤1yr) | 2% |
| Sukuk (Sharia-compliant) | 2% |
| Gold (allocated physical) | 5% |
| Silver (allocated physical) | 7% |
| Stablecoin (regulated) | 2% |

### 3.6 Counterparty Risk (§7)
```
C_a = Credit_a × Jurisdiction_a × Operational_a
```
**Multiplicative** (not weighted sum). Clamped to [0.90, 1.00].

### 3.7 Gold-Relative Index (GRI) — ADVISORY (v21 NEW)

**Constitutional Principle:** Gold constitutes the constitutional monetary anchor. GRI measures the reserve's purchasing power relative to gold.

```
GRI = R_a / (GoldPrice × GoldRefQty)

Where:
  GoldPrice = Live gold spot price (multi-oracle consensus, §11)
  GoldRefQty = Gold ounces held in allocated reserve custody
  R_a = Adjusted reserve value (post-haircut, post-counterparty)
```

**GRI Interpretation:**
| GRI Range | Status | Action |
|---|---|---|
| GRI ≥ 5.0 | Strong gold coverage | None (healthy) |
| 3.0 ≤ GRI < 5.0 | Moderate coverage | Governance notes for strategic review |
| GRI < 3.0 | Weak coverage | Council may consider strategic gold increase (via amendment) |

**GRI Constraints (NON-NEGOTIABLE):**
- GRI does NOT change PAR (PAR = $1.00, fixed)
- GRI does NOT trigger automatic rebalancing (rebalancing uses weight drift + RR)
- GRI does NOT serve as the legal solvency metric (that is RR)
- GRI IS reported alongside RR, LCR, NAV on the transparency dashboard
- GRI IS used for long-term health trend analysis

**Why GRI is advisory, not a trigger:** Making GRI a rebalancing trigger would create pro-cyclical behavior — gold rises → GRI drops → system buys more gold (chasing the rally). The hysteresis + RR-based rebalancing prevents this.

### 3.8 Multi-Reserve Numeraire (v21 NEW)

**Principle:** MITHQAL measures value against multiple reference points:
1. **Gold** (via GRI) — long-term purchasing power
2. **USD** (via NAV) — settlement accounting
3. **Multi-currency basket** (via weighted FX) — diversification health

**The hierarchy:**
```
Gold Reference (GRI — advisory)
        │
        ▼
Reserve Purchasing-Power Measurement
        │
        ▼
Multi-Currency Optimization (engine rebalances within bands)
        │
        ▼
Liquidity Management (LCR, LRR, redemption throttle)
        │
        ▼
MTQ PAR = $1.00 (FIXED — settlement finality)
```

**Key distinction:**
```
❌ WRONG: "Gold went up 10% → MTQ goes up 10%" (speculative asset)
❌ WRONG: "Gold went up 10% → rebalance to buy gold" (pro-cyclical)
✅ CORRECT: "Gold went up 10% → GRI decreased → governance notes →
            engine continues RR-based rebalancing → PAR stays $1.00"
```

---

## 4. RESERVE ARCHITECTURE

### 4.1 Four-Tier Constitutional Model
(Regulatory/accounting view — unchanged from v20 §1.3)

| Tier | Asset Class | Constitutional Range | Policy Target |
|---|---|---|---|
| 1 | Central-Bank-Quality Cash | 25-60% | 40% |
| 2 | Short-Duration Sovereign Securities | 20-50% | 35% |
| 3 | Allocated Physical Bullion (Gold + Silver) | 10-30% | 20% |
| 4 | Operational Liquidity (Stablecoins) | 0-10% | 5% |

### 4.2 Three-Pillar Strategic Architecture (v21 NEW)
(Monetary design view — formalized from Enhanced H++)

| Pillar | Components | Strategic Target | Constitutional Range |
|---|---|---|---|
| **A — Bullion Anchor** | Gold + Silver | 20% | 15-25% |
| **B — Global Fiat Reserve** | Cash + Sovereign (multi-currency) | 75% | 65-80% |
| **C — Stablecoin Liquidity** | Eligible stablecoins (3+ issuers) | 5% | 0-10% |

**Solvency Buffer:** 20% over-collateralization (portfolio-level, NOT a separate cash bucket). The buffer is produced by the combined portfolio — liquid sovereign assets + cash + bullion + stablecoins — subject to liquidity requirements.

### 4.3 Dynamic Allocation (§23-27)
The engine computes target weights dynamically:
1. Start with policy targets (Pillar A: 20%, Pillar B: 75%, Pillar C: 5%)
2. **RR adjustment:** RR>110% → +2% bullion / -2% fiat; RR<102% → +2% fiat / -2% bullion
3. **Volatility adjustment:** Gold EWMA vol drives φ_t (see §5)
4. Clamp to constitutional ranges
5. Normalize to Σ = 100%

### 4.4 Baseline Reserve Composition (v21 — Enhanced H++)
The following are the **strategic target weights** for the Enhanced H++ architecture:

| Asset | Target Weight | Constitutional Range |
|---|---|---|
| Gold (allocated physical) | 15% | 12-18% |
| Silver (allocated physical) | 5% | 3-8% |
| USD cash + sovereign | 27% | 20-35% |
| EUR cash + sovereign | 18% | 12-24% |
| CHF cash + sovereign | 6% | 3-8% |
| JPY cash + sovereign | 6% | 3-9% |
| GBP cash + sovereign | 5% | 3-8% |
| SGD cash + sovereign | 4% | 2-6% |
| AED cash + sovereign | 3% | 1-5% |
| SAR cash + sovereign | 3% | 1-5% |
| CNY cash + sovereign | 2% | 1-4% |
| CAD cash + sovereign | 0.5% | 0-2% |
| AUD cash + sovereign | 0.5% | 0-2% |
| Stablecoins (USDC/USDT/DAI) | 5% | 0-5% |
| **Total** | **100%** | |

**Within Pillar B (fiat), each currency is split 60% cash / 40% sovereign.**

**Solvency buffer:** 20% over-collateralization (target RR = 117%).

### 4.5 Testnet Baseline Values (current runtime)
- Cash: $31,000,000 USD (to be diversified per §4.4)
- Sovereign: $13,500,000 US T-bills (to be diversified per §4.4)
- Gold: 2,122.86 oz
- Silver: 36,758 oz
- Stablecoin: $2,700,000
- Supply: 54,000,000 MTQ

**Mainnet must derive actual holdings from custodian attestations → reconciliation → reserve state → NAV → monetary engine.**

---

## 5. GOLD / SILVER φ_t

### 5.1 Definition
```
φ_t = gold's share of bullion (Pillar A) at time t
Gold_t = φ_t × Bullion_t
Silver_t = (1 − φ_t) × Bullion_t
```

### 5.2 Bounds
| Bound | Value |
|---|---|
| φ_min (constitutional hard floor) | 60% |
| φ_max (constitutional hard cap) | 95% |
| Normal band | 75% - 85% |
| Rebalance band | 60-75% or 85-95% |
| Default target | 80% |

### 5.3 Dynamic Target
- Gold EWMA vol > 3% → φ_t = 75% (reduce gold when volatile)
- Gold EWMA vol < 0.5% → φ_t = 85% (increase gold when stable)
- Otherwise → φ_t = 80%

### 5.4 Hysteresis (§22B)
- 2pp band: |proposed φ_t − current φ_t| ≤ 2pp → no action
- 2-cycle confirmation: >2pp drift must persist for 2 consecutive evaluation cycles
- Direction-tracking: if drift direction reverses, confirmation counter resets (anti-whipsaw)

### 5.5 Gold Anchor Principle (v21 NEW)
Gold is the **strategic monetary anchor**, NOT a fixed peg. Specifically:
- Gold is NOT redeemable at a fixed price (no 1 MTQ = X gold oz promise)
- Gold is NOT the PAR anchor (PAR = $1.00 USD-equivalent)
- Gold IS the last asset liquidated (Article X, Exhaustion Certificate)
- Gold IS the GRI numerator (advisory purchasing-power metric)
- Gold IS the constitutional strategic anchor (long-term confidence)

**"Gold anchor" ≠ "gold peg" ≠ "gold redemption promise."**

### 5.6 Silver Independence
Silver is the **secondary stabilizer**, NOT a co-anchor. Silver has:
- Higher volatility (30% annual vs gold 15%)
- Lower liquidity (thinner market, 20 bps cost vs gold 10 bps)
- Lower absolute trade limit ($10M vs gold $25M)
- Independent stress modeling (not a mirror of gold)

---

## 6. CURRENCY ENGINE

### 6.1 Structural Weighting (§13)
```
C_i = 0.50 × COFER_i + 0.40 × SWIFT_i + 0.10 × BIS_i
```

### 6.2 Currency Basket (v21 — 11 reserve currencies + settlement layer)
**Reserve-Eligible Currencies (Layer A — held as reserve assets):**
11 sovereign currencies: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD
Plus XAU (gold oz) and XAG (silver oz) for minting = 13 mint/redeem currencies.

**Supported Settlement Currencies (Layer B — convertible, NOT held as reserve):**
EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB, and others as qualified.

**The Constitution names no specific currencies.** The 11-currency reserve list and the settlement-only list are policy/implementation decisions, governed by CQS (§6.10).

### 6.3 Momentum (§16)
```
M_i = clamp(P_12mo_ago / P_today, 0.95, 1.05)    // ±5% hard cap
```

### 6.4 Mean Reversion (§16)
```
B_i = clamp(1 + 0.05 × (LTA_i − C_i), 0.98, 1.02)   // ±2% cap
```

### 6.5 Shock Absorber (§17.4)
```
σ ≤ 2% → A_t = 1.0
σ ≥ 5% → A_t = 0.5
Linear interpolation between

K_i = 1 + A_t × (M_i × B_i − 1)
```

### 6.6 Concentration Limits (v21 — updated)
| Limit | Value | Enforcement |
|---|---|---|
| Per-currency floor | 0.5% | `minimum_floor` trigger (high severity) |
| Per-currency cap (general) | **60%** | `concentration_cap` trigger (critical) |
| **USD hard cap (v21)** | **35%** | Prevents hidden USD anchor |
| **EUR cap** | **25%** | Prevents EUR dominance |
| Asian aggregate (JPY+SGD+CNY+CAD+AUD) | 25% | Regional diversification |
| Gulf aggregate (AED+SAR) | 10% | Regional diversification |
| Regional group cap | 40% | Manual review |
| Minimum diversity | 3 currencies | Hard gate |
| Per-counterparty | ≤10% | §10 7-tier cap table |
| Per-custodian | ≤25% | §10 |
| Per-issuer | ≤15% | §10 |
| Per-jurisdiction | ≤30% | §10 |
| Per-stablecoin-issuer | ≤2% | §14 |
| Aggregate | ≤100% | Reconciliation |

### 6.7 Hysteresis (§22B)
- 2% band: |proposed weight − current weight| ≤ 2% → no action
- 2-cycle confirmation required before applying >2% change
- Direction-tracking: reversal resets counter

### 6.8 Currency Lifecycle (§12 + v21 substitution)
```
NORMAL → WATCH → REDUCE → SUSPEND → SUBSTITUTE → REINSTATE
```

**State Definitions:**

| State | Trigger | Action |
|---|---|---|
| NORMAL | CQS ≥ 6.0, status=full | Normal operation |
| WATCH | CQS < 6.0 OR sovereign downgrade OR vol > 2σ | Flag for governance; no trade |
| REDUCE | CQS < 5.5 for 20 consecutive readings (~1 month) | Gradual weight reduction: target declines 20%→18%→15%→10% |
| SUSPEND | CQS < 4.0 OR sovereign default OR sanctions OR capital controls | New allocation prohibited; existing wound down |
| SUBSTITUTE | SUSPEND confirmed by governance (4-of-5) | Reallocate to highest-CQS eligible alternatives |
| REINSTATE | CQS > 6.5 for 60 consecutive readings (~3 months) | Re-eligibility for new allocation |

### 6.9 Severe Deviation Protocol (§33)
```
If |P_t / P_{t-7} − 1| > 5%:
    SDP triggers
    K_SDP = P_reference / P_current
    W_emergency = C_structural × K_SDP
    W_new = max(W_emergency, W_current × 0.50)    // SDP_CAP = anti-shock
    Currency lifecycle: full → suspended
    §20 normalization: others rise proportionally
```

### 6.10 Currency Quality Score (CQS) — v21 NEW

Every reserve-eligible currency receives a CQS based on 20 factors:

| Factor | Weight | Description |
|---|---|---|
| Liquidity | 8% | Market depth, daily trading volume |
| Convertibility | 8% | Freedom to convert, no restrictions |
| Market depth | 7% | Order book depth, bid-ask spread |
| Monetary stability | 7% | Central bank credibility, policy consistency |
| Inflation stability | 6% | Historical inflation rate and volatility |
| Sovereign strength | 6% | Sovereign credit rating |
| Fiscal sustainability | 5% | Debt-to-GDP, deficit trajectory |
| External balance | 5% | Current account, trade balance |
| Financial-system depth | 5% | Banking system size and stability |
| Settlement utility | 5% | Use in international trade settlement |
| Trade relevance | 4% | Country's share of global trade |
| Geographic diversification | 4% | Correlation with existing basket |
| FX volatility (inverse) | 4% | Lower volatility = higher score |
| Gold correlation (inverse) | 4% | Lower gold correlation = higher score |
| Regulatory accessibility | 4% | Ease of regulatory compliance |
| Capital-control risk (inverse) | 4% | Lower risk = higher score |
| Geopolitical risk (inverse) | 4% | Lower risk = higher score |
| Sanctions exposure (inverse) | 3% | Lower exposure = higher score |
| Custody availability | 3% | Institutional custody infrastructure |
| Institutional custody | 2% | Quality of custody providers |

**CQS Rankings (shadow-computed):**

| Rank | Currency | CQS | Classification |
|---|---|---|---|
| 1 | CHF | 8.16 | Core Reserve |
| 2 | USD | 7.96 | Core Reserve |
| 3 | SGD | 7.88 | Core Reserve |
| 4 | EUR | 7.48 | Core Reserve |
| 5 | GBP | 6.89 | Secondary Reserve |
| 6 | AED | 6.71 | Secondary Reserve |
| 7 | CAD | 6.63 | Secondary Reserve |
| 8 | JPY | 6.57 | Secondary Reserve |
| 9 | AUD | 6.56 | Secondary Reserve |
| 10 | SAR | 6.38 | Secondary Reserve |
| 11 | CNY | 4.63 | Conditional Reserve (with substitution) |
| — | INR | 4.20 | Settlement-Only |
| — | EGP | 3.50 | Settlement-Only |

**Minimum CQS for reserve eligibility:** 6.0 (conditional: 4.5 with substitution mechanism)

### 6.11 Two-Layer Currency System (v21 NEW)

**Layer A — Reserve-Eligible Currencies (held as reserve assets):**
Currencies that appear in the actual reserve portfolio. Currently 11: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD.

**Layer B — Supported Settlement Currencies (convertible, NOT held):**
Currencies that users may deposit, redeem, convert, and settle in — without MITHQAL holding significant reserves in that currency. Includes: EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB, and others as qualified.

**This allows global accessibility without reserve fragmentation.** An Egyptian user can convert EGP → MTQ and MTQ → EGP without MITHQAL holding EGP reserves. The conversion happens at the FX layer.

### 6.12 Currency Substitution Mechanism (v21 NEW)

When a currency is SUSPENDED, the freed allocation is redistributed to the highest-CQS eligible alternatives.

**Replacement Score:**
```
ReplacementScore = CQS + DiversificationBenefit + LiquidityScore
```

**Replacement rules:**
1. Select from eligible currencies where CQS ≥ 6.0 AND status = full AND weight < max_cap
2. Allocate proportionally to ReplacementScore
3. No single replacement currency may receive >50% of the freed allocation
4. Execute via TWAP over 5-10 trading days (anti-market-impact)
5. Governance approval required (severity = HIGH, 4-of-5)

**Critical rule:** Substitution must NOT default to USD. The system uses CQS-based replacement to prevent falling back into USD concentration.

---

## 7. REBALANCING ENGINE (§29)

### 7.1 Pipeline
```
DRIFT → VALIDATE → CONFIRM → PROPOSE → APPROVE → EXECUTE → RECONCILE
```
**NEVER:** `PRICE_MOVE → IMMEDIATE_TRADE`

### 7.2 Trigger Types (9 + LCR)
1. `weight_drift` (>2% soft, >3% hard)
2. `layer_breach` (outside [min, max])
3. `bullion_band` (φ_t outside [60%, 95%])
4. `stablecoin_eligibility` (status ≠ full)
5. `currency_eligibility` (status ≠ full)
6. `concentration_cap` (>60% general, >35% USD)
7. `minimum_floor` (<0.5%, high)
8. `reserve_ratio` (<100% critical, <102% medium)
9. `council_authorization` (low)
10. LCR (<1.0 high, <1.2 medium)

### 7.3 Four Tiers
| Tier | Trigger | Delay | Approval | Max Turnover |
|---|---|---|---|---|
| T0 | None | N/A | None | 0% |
| T1 | Minor drift | 4-48h | None | 0% (observe) |
| T2 | Medium/high | 14-60d | 2-4 of 5 | 3% weekly |
| T3 | Critical/emergency | Immediate | 5/5 + Council | Suspended (documented) |

### 7.4 Trade Suppression
```
If expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer:
    SUPPRESS (unless objective emergency)
```
Risk buffer = 2 bps. Emergency overrides: SDP, Constitutional Emergency, concentration_cap, RR<100%, minimum_floor.

### 7.5 Scale-Aware Trade Limits (unchanged from v20)

### 7.6 Fee Model (unchanged from v20)

### 7.7 Cross-Asset Rebalancing
Value conservation: every sell paired with equal-notional buy. Bullion split per φ_t; fiat split per §4.4 (60% cash + 40% sovereign).

### 7.8 Approval Routing (unchanged from v20)

### 7.9 Proposal Binding (unchanged from v20)

### 7.10 Portfolio-Level Optimization (v21 NEW)

The reserve engine optimizes the ENTIRE portfolio, not individual assets:
```
Minimize: CVaR (portfolio)
Subject to:
  RR ≥ 100% (constitutional)
  LCR ≥ 1.0 (constitutional)
  Per-currency ≤ constitutional cap
  Bullion ∈ [15%, 25%]
  φ_t ∈ [60%, 95%]
```

The optimizer considers interactions between Gold + Silver + Fiat + Stablecoins. It does NOT optimize each pillar independently.

---

## 8. LIQUIDITY & REDEMPTION (unchanged from v20)

### 8.1 LCR
### 8.2 LRR
### 8.3 Redemption (never paused)
### 8.4 Redemption Stress Priority

---

## 9. SEVEN-STATE RESERVE ACCOUNTING (unchanged from v20)

---

## 10. CUSTODY & RECONCILIATION (unchanged from v20)

---

## 11. ORACLE ARCHITECTURE (v21 — updated)

### 11.1 Target Architecture (Mainnet)
- **Gold:** 3+ independent sources, median + 2% outlier rejection
- **Silver:** 3+ independent sources (currently 1 — MUST be fixed)
- **FX:** 2+ independent institutional-quality sources (currently 1 — MUST be fixed)
- **Stablecoins:** Real-time price + depeg monitoring (currently hardcoded $1 — MUST be fixed)

### 11.2 Consensus Mechanism
Median + 2% outlier exclusion + freshness enforcement + circuit breaker.

### 11.3 Fallback Hierarchy
Tier 1 (median) → Tier 2 (single, quorumMet=false) → Tier 3 (last-known-good) → Tier 4 (hardcoded baseline)

### 11.4 Freshness
- Off-chain: 60 seconds
- On-chain: 1 hour
- All oracle read paths enforce staleness

### 11.5 Circuit Breakers (v21 NEW)
- Trading halt if 2+ sources disagree >3%
- Cool-down period if price moves >10% in 1 hour
- Council notification if price moves >20% in 1 day

---

## 12. GOVERNANCE

### 12.1 Monetary Council
- 7 members (independent professionals, 4-year staggered terms)
- Supermajority: 6/7 (85.7%) for constitutional amendments
- Standard: 4/7 for policy

### 12.2 Amendment Workflow (§43)
11 stages. **Timelock: 90 days (constitutional), 7 days (policy).** (v21: confirms 90 days — fixes spec mismatch where `AMENDMENT_SPEC.TIMELOCK_DAYS` was 14)

### 12.3 Emergency Governance (§44)
| Level | Expiry |
|---|---|
| Normal | No expiry |
| Heightened Watch | 30 days |
| Emergency | 7 days |
| Constitutional Emergency | 24 hours |

11 objective triggers (unchanged from v20).

---

## 13. CONSTITUTIONAL INVARIANTS (unchanged from v20)

### 13.1 Five Absolute Invariants
1. **100% Reserve Ratio:** `R_a ≥ S × PAR` at all times (policy ≥102%)
2. **No Discretionary Minting:** Minting only upon verified deposit
3. **No Lending of Reserves:** No leverage, no fractional reserve, no rehypothecation
4. **No Commingling:** Yield Program assets never mix with settlement reserves
5. **Bullion Preservation:** Gold liquidated LAST, requires Exhaustion Certificate

### 13.2 On-Chain Invariants (§45)
10 on-chain checkable invariants. 15 forbidden function selectors.

---

## 14. DETERMINISM (unchanged from v20)

---

## 15. AUDIT TRAIL (unchanged from v20)

---

## 16. SMART CONTRACT REQUIREMENTS (unchanged from v20)

---

## 17. EXECUTION MODES (unchanged from v20)

---

## 18. USER FEES (unchanged from v20)

---

## 19. SUPPORTED CURRENCIES (v21 — updated)

**Reserve-Eligible (Layer A):** USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD (11 currencies)
**Bullion:** XAU (gold oz), XAG (silver oz)
**Settlement-Only (Layer B):** EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB, and others as qualified

**No country-specific rules.** The same engine handles any eligible currency identically. Currency inclusion/exclusion is governed by CQS (§6.10), not political preference.

---

## 20. FINALITY (unchanged from v20)

---

## 21. RESERVE VERIFICATION (v21 NEW)

### 21.1 Verification Levels

| Level | Definition | Acceptable For |
|---|---|---|
| 0 — Modeled | Hardcoded in source code | Testnet only |
| 1 — System-reported | API reports the value | Testnet, internal monitoring |
| 2 — Custodian-attested | Independent custodian confirms | Institutional pilot |
| 3 — Independently audited | Qualified auditor verifies | Mainnet |
| 4 — Cryptographically verifiable | Real-time on-chain proof | Central-bank use |

### 21.2 Dual NAV Reporting

| Metric | Formula | Current Value |
|---|---|---|
| MODELED NAV | R_m (all assets) / S | $1.0896 |
| VERIFIED NAV | R_m (verified, owned, unencumbered only) / S | $0.0000 |

**Never represent modeled reserves as verified reserves.**

### 21.3 Mainnet Gate
Before mainnet launch, ALL of the following must be true:
1. Every reserve asset has custodian attestation (Level 2+)
2. Annual independent audit completed (Level 3)
3. VERIFIED NAV ≥ MODELED NAV
4. VERIFIED RR ≥ 100%
5. PoR report published publicly
6. Attestation freshness < 30 days

---

## APPENDIX A: DOCUMENTS SUPERSEDED

This blueprint supersedes:
- v20 Canonical Blueprint (2026-08-11)
- v19 implementation addendum
- v18 original blueprint
- All prior addenda and change logs

These documents remain as **historical references** but are NOT authoritative.

---

## APPENDIX B: CENTRALIZED SPECIFICATION

The machine-readable specification is at `src/lib/reserve-policy-spec.ts`. All constants in this blueprint are mirrored in that file. The spec is the single source of truth for code; this blueprint is the single source of truth for the spec.

---

## APPENDIX C: v21 CHANGES FROM v20 (Summary)

| Change | Section | Description |
|---|---|---|
| Three-pillar architecture | §4.2 | Formalized Bullion/Fiat/Stablecoin pillars |
| Enhanced H++ weights | §4.4 | 11-currency basket with validated weights |
| GRI advisory metric | §3.7 | Gold-Relative Index (does NOT change PAR) |
| Multi-reserve numeraire | §3.8 | Gold reference + USD reporting + basket health |
| USD 35% hard cap | §6.6 | Prevents hidden USD anchor |
| 11 reserve currencies | §6.2 | Added SGD, AED, SAR (from 8 to 11) |
| Two-layer currency system | §6.11 | Reserve-eligible + settlement-only |
| CQS methodology | §6.10 | 20-factor Currency Quality Score |
| WATCH/REDUCE/SUSPEND/SUBSTITUTE | §6.8 | Formalized currency lifecycle |
| Substitution mechanism | §6.12 | CQS-based, NOT USD default |
| Portfolio-level optimization | §7.10 | CVaR minimization, not per-asset |
| Reserve verification | §21 | Levels 0-4, dual NAV reporting |
| Timelock fix | §12.2 | Confirmed 90 days (was mismatched in spec) |
| Oracle circuit breakers | §11.5 | Trading halt on disagreement |
| Gold anchor principle | §5.5 | Gold = anchor, NOT peg, NOT redemption promise |

---

**This blueprint is complete. It is the single authoritative document for MITHQAL.**
