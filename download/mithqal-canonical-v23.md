# MITHQAL — CANONICAL BLUEPRINT v23
## Four-Layer Dynamic Reserve Architecture with Digital Liquidity Sleeve

**Version:** 23.0
**Date:** 2026-08-12
**Status:** CANONICAL — supersedes v22 and all prior versions
**Authority:** COO/CTO/CFO/PM + Monetary Systems Architect + Institutional Reserve Manager
**Supersedes:** v22 (2026-08-12), v21, v20, v19, v18, and all addenda

---

## 0. SUPREMACY CLAUSE

This document is the **single authoritative blueprint** for MITHQAL. It reconciles:
- v22 Canonical Blueprint (four-layer architecture)
- Stablecoin Risk Audit (shadow model v14 — DRQS, digital liquidity sleeve)
- Comprehensive Multi-Model Stress Analysis (shadow model v13 — 7 models, 40 scenarios)
- V22.1 Independent Economic Decision Gate (shadow model v12)
- All Phase 2.5 reserve optimization studies (shadow models v1-v14)

**Where any prior document conflicts with this blueprint, this blueprint wins.**

**Optimization priority (inviolable):**
```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY > RETURN
```

**Monetary identity:**
MITHQAL is a **gold-anchored, globally diversified, reserve-backed monetary infrastructure with a fixed settlement PAR.** The architecture uses a **four-layer measurement system** that separates solvency, gold-relative strength, liquidity, and comprehensive risk. Gold is the strategic anchor. PAR is the settlement reference. The reserve portfolio provides solvency. Stablecoins are a digital liquidity sleeve — NOT a core monetary reserve pillar.

**The management principle:**
> *MITHQAL must not become a USD-backed system disguised as a global reserve system, nor a gold-pegged system disguised as a stable currency. The reserve architecture should be designed to survive model failure — not merely to pass the model. Stablecoins are a capped, dynamically optimized digital-liquidity sleeve — not a core monetary reserve pillar — and 5% should be a maximum, not an obligation.*

---

## 1. CONFLICT RESOLUTIONS (8 Reconciliations)

### 1.1 Platinum — RESOLVED: NO PLATINUM
No platinum. Dynamic φ_t gold/silver only within the bullion tier.

### 1.2 Currency Concentration Cap — RESOLVED: 35% USD HARD CAP
The 60% general per-currency cap is retained as the constitutional maximum. A **35% USD-specific hard cap** is added to prevent USD from becoming the hidden monetary anchor.

### 1.3 Reserve Tiers — RESOLVED: THREE-PILLAR + FOUR-LAYER
**Three-pillar strategic architecture** (monetary design view):
- Pillar A — Bullion Anchor (Gold + Silver): 20%
- Pillar B — Global Fiat Reserve (Cash + Sovereign): 75%
- Pillar C — Digital Liquidity Sleeve (Stablecoins + Tokenized): 0-5%

**Four-layer measurement architecture** (risk measurement view):
- Layer 1 — Constitutional Solvency (RR)
- Layer 2 — Gold-Relative Strength (GEI + BRI)
- Layer 3 — Liquidity Protection (LCR + LCI)
- Layer 4 — Risk Dashboard (CQS + CRS + GCRS + SRR + CVaR + DRI + Multi-numéraire PP)

### 1.4 Liquidation Order — RESOLVED: ARTICLE X SEQUENTIAL
1. Stablecoins → 2. Cash → 3. Sovereign → 4. Non-USD FX → 5. Silver → 6. Gold LAST (Exhaustion Certificate required)

### 1.5 Reserve Ratio — RESOLVED: PAR-BASED
```
RR = R_a / (S × PAR), where PAR = $1.00 (fixed)
RR ≥ 100% (constitutional floor), RR ≥ 102% (policy target), RR ≥ 117% (strategic target with 20% buffer)
```
RR is the SINGLE legal solvency metric. It is NOT tautological. It is NOT replaced by GRI, GEI, BRI, GACR, or MRR.

### 1.6 Gold-Referenced Measurement — RESOLVED: ADVISORY ONLY
Gold is the constitutional monetary anchor. GEI, BRI, and GACR are ADVISORY health metrics. They do NOT change PAR. They do NOT trigger rebalancing. They do NOT replace RR.

### 1.7 MRR (Multi-Numéraire RR) — RESOLVED: MRR = RR
The Multi-Numéraire Reserve Ratio is mathematically equivalent to standard RR (the FX conversion cancels in the ratio). Multi-numéraire purchasing-power reporting is a transparency layer, NOT a different solvency metric.

### 1.8 Stablecoin Classification — RESOLVED: DIGITAL LIQUIDITY SLEEVE (v23)
Stablecoins are NOT a core monetary reserve pillar. They are a **digital liquidity sleeve** — a capped, dynamically optimized settlement/redemption bridge. The 5% allocation is a MAXIMUM, not a mandate. DAI is optional (not mandatory). USDT is excluded (DRQS below threshold).

---

## 2. CONSTITUTIONAL IDENTITY

MITHQAL is a **gold-anchored Constitutional Settlement Institution** — a neutral, 100%+ reserved, gold-disciplined, Sharia-compliant settlement infrastructure for international trade.

**What it is NOT:** Not a bank, not a lending platform, not a payment processor, not a marketplace, not a DeFi protocol, not a speculative asset, not a DAO, not a stablecoin, not a gold-backed token.

**What it IS:** Gold-anchored, globally diversified, reserve-backed monetary infrastructure with a fixed settlement PAR. The USD is a reference unit for settlement, NOT the economic anchor.

**Five Constitutional Monetary Rules:**
1. Gold is the primary strategic anchor
2. Silver is secondary, not co-anchor
3. No fiat currency is permanently dominant
4. Currency weights are dynamic but constrained
5. PAR remains stable; reserves absorb changes

**Anti-Platform Clause (permanent, non-amendable):** No lending, exchange, brokerage, asset management, derivatives, DeFi, or commercial platform services.

**Founder Holdings Cap:** ≤20% of circulating supply.

**PAR Definition (v23 clarification):**
PAR = $1.00 is a **USD-denominated settlement unit**, NOT a USD-backed monetary identity. MITHQAL is not saying "MTQ is backed by USD." It is saying "MTQ has a fixed accounting/redemption reference of one U.S. dollar." The reserve portfolio itself remains globally diversified. The USD is a reference unit, not the economic anchor.

---

## 3. MONETARY ARCHITECTURE

### 3.1 PAR
```
PAR = $1.00 (fixed, non-CPI-linked, non-gold-linked)
L = S × PAR = 54,000,000 × $1.00 = $54,000,000 (fixed redemption liability)
```

**v23 PAR Constitutional Unit Study result:** PAR = $1.00 is RETAINED. A future "PAR as constitutional unit" (currency-neutral) was studied but DEFERRED due to higher gharar risk, regulatory reclassification risk, accounting complexity, and smart contract complexity. Requires separate Sharia fatwa and legal opinion.

**Compromise:** PAR = $1.00 + multi-currency NAV reporting + multi-numéraire purchasing-power display. The architecture is neutral (diversified reserves); the settlement unit is USD (practical, compliant, Sharia-friendly).

### 3.2 NAV
```
NAV_m = R_m / S    (Market NAV — mark-to-market reserve value per MTQ)
NAV_l = R_a / S    (Prudential NAV — post-haircut, post-counterparty-score)
NAV_s = R_l / S    (Stress NAV — post-haircut, post-counterparty-score, post-stress-coefficient)
```

Multi-currency NAV is reported on the transparency dashboard:
- USD NAV (primary accounting)
- EUR NAV, CHF NAV, JPY NAV, GBP NAV, CNY NAV (reference)
- Gold-equivalent NAV (purchasing power)
- Silver-equivalent NAV (secondary reference)

### 3.3 Reserve Ratio (Layer 1 — Constitutional Solvency)
```
RR = R_a / (S × PAR)

R_m = Σ Q_a × P_a                                    (market reserve value)
R_a = Σ Q_a × P_a × (1 − H_a) × C_a                  (adjusted reserve value)
R_l = Σ Q_a × P_a × (1 − H_a) × C_a × S_a            (stress reserve value)

Where:
  Q_a = quantity of asset a
  P_a = market price of asset a
  H_a = constitutional haircut (§3.5)
  C_a = counterparty score (§3.6, multiplicative: Credit × Jurisdiction × Operational)
  S_a = stress coefficient (§3.7)

Constitutional floor: RR ≥ 100% (hard invariant — auto-pauses minting)
Policy target: RR ≥ 102%
Strategic target: RR ≥ 117% (with 20% solvency buffer)
```

**RR is the SINGLE legal solvency metric.** It is NOT tautological. It is NOT replaced by GRI, GEI, BRI, GACR, or MRR. It determines minting pause, emergency mode, and redemption throttle.

### 3.4 Haircut Table
| Asset Class | Haircut (H) |
|---|---|
| Cash (central-bank-quality) | 0% |
| Sovereign (T-bills ≤1yr) | 2% |
| Sukuk (Sharia-compliant) | 2% |
| Gold (allocated physical) | 5% |
| Silver (allocated physical) | 7% |
| Stablecoin (regulated) | 2% |
| Tokenized government liquidity | 2% |

### 3.5 Counterparty Risk
```
C_a = Credit_a × Jurisdiction_a × Operational_a
```
**Multiplicative** (not weighted sum). Clamped to [0.90, 1.00].

### 3.6 Stress Coefficients
| Asset Class | Stress Coefficient (S_a) |
|---|---|
| Cash | 0.95 |
| Sovereign | 0.90 |
| Gold | 0.85 |
| Silver | 0.80 |
| Stablecoin | 0.80 |
| Tokenized government | 0.90 |

### 3.7 Gold-Equivalent Index (Layer 2 — Advisory)
```
GEI_t = (R_a,t / G_t) / (R_a,0 / G_0)

Where:
  R_a,t = adjusted reserve value at time t
  G_t = gold spot price at time t (multi-oracle consensus)
  R_a,0, G_0 = base-date values

GEI is normalized to 1.0 at base date.
GEI > 1.0: reserve growing faster than gold (purchasing power increasing)
GEI < 1.0: reserve losing ground vs gold

GEI is ADVISORY ONLY. Does NOT change PAR. Does NOT trigger rebalancing.
```

### 3.8 Bullion Resilience Index (Layer 2 — Advisory)
```
BRI = (GoldVal_t / GoldVal_0)^w_g × (SilverVal_t / SilverVal_0)^w_s

Where:
  w_g = 0.90 (CVaR-optimized, 10k correlated paths — independently verified)
  w_s = 0.10 (CVaR-optimized)
  w_g + w_s = 1

BRI is normalized to 1.0 at base date.
BRI is ADVISORY ONLY. Does NOT trigger rebalancing. Does NOT drive the optimizer.
The optimizer uses CVaR, liquidity, solvency, concentration — NOT BRI.
```

### 3.9 Liquidity Coverage Index (Layer 3 — Advisory)
```
LCI = HQLA / Expected Stress Outflows

Where:
  HQLA = cash + sovereign × 0.98 + stablecoin × 0.98
  Expected Stress Outflows = S × 0.10 (10% redemption stress)

LCI is ADVISORY (supplements LCR with stress assumptions).
```

### 3.10 Gold-Adjusted Coverage Ratio (Layer 2 — Reporting)
```
GACR = (R_a / G_t) / (S × PAR / G_t) = R_a / (S × PAR) = RR

The algebra collapses to RR. This is INTENTIONAL.
GACR is a REPORTING metric — it expresses RR in gold terms.

Dashboard reports:
  RR = 116.70% (USD-denominated)
  Gold-equivalent coverage = 6.7544 oz/MTQ
  ("Each MTQ is backed by 6.7544 oz of gold equivalent")
```

### 3.11 Multi-Numéraire Purchasing Power (Layer 4 — Reporting)
```
PP_j = R_a / (GoldPrice × FX_j)

For each reference numéraire j (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, gold, silver):
  PP_j = reserve purchasing power measured in numéraire j

This is a REPORTING layer only. Does NOT change RR (proven: MRR = RR).
Provides multi-perspective visibility for institutional communication.
```

### 3.12 Reserve Quality Score (Layer 4 — Optimization Input)
```
RQS_a = f(Liquidity, Credit, FX, Duration, Volatility, Correlation, GeopoliticalRisk, Convertibility, CustodyRisk)

Each reserve asset receives a dynamic RQS.
RQS informs the Dynamic Reserve Optimization Engine.
RQS is NOT a constitutional metric — it is an optimization input.
```

### 3.13 Dynamic Reserve Optimization Engine
```
W* = argmax [λ₁·RR + λ₂·LCR + λ₃·GEI − λ₄·CVaR − λ₅·FXRisk − λ₆·GeoRisk − λ₇·ConcentrationRisk]

Subject to HARD CONSTRAINTS (must be satisfied BEFORE optimization):
  RR ≥ 100%              [Constitutional solvency — NEVER trade away]
  LCR ≥ 1.0              [Liquidity — NEVER trade away]
  USD ≤ 35%              [USD hard cap]
  Per-currency ≤ 60%     [General concentration cap]
  Bullion ∈ [15%, 25%]   [Bullion range]
  φ_t ∈ [60%, 95%]       [Gold/silver split]
  Digital liquidity ≤ 5% [MAXIMUM, not mandate]
  Per-stablecoin-issuer ≤ 2%
  Bullion → Digital: EMERGENCY GOVERNANCE ONLY

λ values:
  λ₁ (RR)            = 0.20  [Solvency — highest weight]
  λ₂ (LCR)           = 0.15  [Liquidity]
  λ₃ (GEI)           = 0.10  [Gold-relative strength]
  λ₄ (CVaR)          = 0.15  [Tail risk — minimize]
  λ₅ (FXRisk)        = 0.10  [FX translation risk — minimize]
  λ₆ (GeoRisk)       = 0.10  [Geopolitical risk — minimize]
  λ₇ (Concentration)  = 0.10  [Concentration risk — minimize]
  Efficiency/yield   = 0.10  [LOWEST weight — never outranks stability]

The optimizer CANNOT override hard constraints.
The optimizer CANNOT change PAR.
The optimizer CANNOT sacrifice RR for diversification.
The optimizer does NOT optimize for USD value alone.
The optimizer does NOT chase BRI or GEI — these are observational, not trading signals.
```

### 3.14 Stress-RR (Hard Constraint for Optimizer)
```
RR_stress(s) = R_a(s) / (S(s) × PAR)

For every defined stress scenario s, RR_stress should be ≥ 100%.
This is a forward-looking safety gate for the optimizer.
Stress-RR is NOT a second legal solvency ratio — it is a planning constraint.
```

---

## 4. RESERVE ARCHITECTURE

### 4.1 Three-Pillar Structure

| Pillar | Components | Target | Constitutional Range | Role |
|---|---|---|---|---|
| **A — Bullion Anchor** | Gold + Silver | 20% | 15-25% | Strategic real-asset anchor |
| **B — Global Fiat Reserve** | Cash + Sovereign (11 currencies) | 76.5% | 70-85% | Core solvency + liquidity reserve |
| **C — Digital Liquidity** | Eligible stablecoins + tokenized | 3.5% | 0-5% | Settlement/redemption bridge |
| **Total** | | 100% | | |

**Constraint: A + B + C = 100%. When C reduces (depeg event), B absorbs the freed allocation. A (bullion) is NOT reducible for stablecoin substitution.**

### 4.2 Strategic Target Weights

| Asset | Target % | Constitutional Range | Role |
|---|---|---|---|
| **Gold** | **15%** | 12-18% | Primary strategic anchor |
| **Silver** | **5%** | 3-8% | Secondary real-asset diversifier |
| **USD (cash + sovereign)** | **27%** | 20-35% (hard cap 35%) | Primary settlement |
| **EUR (cash + sovereign)** | **18%** | 12-24% | Primary USD hedge (corr -0.85) |
| **CHF (cash + sovereign)** | **6%** | 3-8% | Defensive reserve (highest CQS) |
| **JPY (cash + sovereign)** | **6%** | 3-9% | Asian liquidity |
| **GBP (cash + sovereign)** | **5%** | 3-8% | Global financial |
| **SGD (cash + sovereign)** | **4%** | 2-6% | Asian diversification (AAA) |
| **AED (cash + sovereign)** | **3%** | 1-5% | GCC settlement corridor |
| **SAR (cash + sovereign)** | **3%** | 1-5% | GCC settlement corridor |
| **CNY (cash + sovereign)** | **2%** | 1-4% | Geopolitical neutrality (conditional) |
| **CAD (cash + sovereign)** | **0.5%** | 0-2% | Commodity diversification |
| **AUD (cash + sovereign)** | **0.5%** | 0-2% | Commodity diversification |
| **USDC** | **2.0%** | 0-2% | Digital liquidity (regulated, USD) |
| **USDP** | **0.5%** | 0-2% | Digital liquidity (Paxos trust) |
| **EURC** | **0.5%** | 0-2% | Digital liquidity (EUR diversification) |
| **BUIDL** | **0.5%** | 0-2% | Tokenized US T-bills |
| DAI (optional) | 0% | 0-1% | Decentralized (OPTIONAL, below core threshold) |
| **Total** | **100%** | | |

**Within Pillar B, each currency is split 60% cash + 40% sovereign (short-duration T-bills ≤1yr).**

**USD target zone: 25-30% (not a precise mandate). The optimizer determines the exact point within the 20-35% range.**

### 4.3 Solvency Buffer
20% over-collateralization (portfolio-level, NOT a separate cash bucket). The buffer is produced by the combined portfolio — liquid sovereign assets + cash + bullion + stablecoins — subject to liquidity requirements.

**Target RR: ≥117% (with 20% buffer). Floor: ≥100%. Policy: ≥102%.**

### 4.4 Dynamic Pillar Allocation
Pillars are NOT fixed at exact percentages. The optimizer can adjust within constitutional bands:
- Bullion: 15-25% (gold 12-18%, silver 3-8%)
- Fiat: 70-85% (fills gap when digital reduces)
- Digital: 0-5% (MAXIMUM, not mandate; can go to 0% during stress)

---

## 5. GOLD / SILVER φ_t

### 5.1 Gold Anchor Principle
Gold is the **strategic monetary anchor**, NOT a peg, NOT a redemption promise, NOT the PAR anchor. Specifically:
- Gold is NOT redeemable at a fixed price (no 1 MTQ = X gold oz promise)
- Gold is NOT the PAR anchor (PAR = $1.00 USD-equivalent)
- Gold IS the last asset liquidated (Article X, Exhaustion Certificate)
- Gold IS the GEI/GACR numerator (advisory purchasing-power metric)
- Gold IS the constitutional strategic anchor (long-term confidence)

**"Gold anchor" ≠ "gold peg" ≠ "gold redemption promise."**

### 5.2 φ_t Bounds
| Bound | Value |
|---|---|
| φ_min (constitutional hard floor) | 60% |
| φ_max (constitutional hard cap) | 95% |
| Normal band | 75-85% |
| Default target | 75% gold / 25% silver |
| Dynamic | Gold EWMA vol >3% → φ_t=75%; vol <0.5% → φ_t=85% |

### 5.3 Hysteresis
- 2pp band: |proposed φ_t − current φ_t| ≤ 2pp → no action
- 2-cycle confirmation: >2pp drift must persist for 2 consecutive evaluation cycles
- Direction-tracking: if drift direction reverses, confirmation counter resets (anti-whipsaw)

### 5.4 Silver Independence
Silver is the **secondary stabilizer**, NOT a co-anchor. Silver has:
- Higher volatility (30% annual vs gold 15%)
- Lower liquidity (thinner market, 20 bps cost vs gold 10 bps)
- Lower absolute trade limit ($10M vs gold $25M)
- Independent stress modeling (not a mirror of gold)

---

## 6. CURRENCY ENGINE

### 6.1 Two-Layer Currency System

**Layer A — Reserve Currencies (held as reserve assets):**
11 sovereign currencies: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD

**Layer B — Settlement Currencies (convertible, NOT held):**
EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB, and others as qualified.

A currency can be supported for settlement without being held as reserve. This allows global accessibility without reserve fragmentation.

### 6.2 Currency Quality Score (CQS)
20-factor model per currency. Minimum CQS for reserve eligibility: 6.0. CNY (4.63) is conditional with substitution mechanism.

### 6.3 Concentration Limits (v23 — updated)
| Limit | Value |
|---|---|
| Per-currency cap (general) | 60% |
| **USD hard cap** | **35%** |
| EUR cap | 25% |
| Asian aggregate (JPY+SGD+CNY+CAD+AUD) | 25% |
| Gulf aggregate (AED+SAR) | 10% |
| Regional group | 40% |
| Per-currency floor | 0.5% |
| Minimum diversity | 3 currencies (minimum active reserve: 7-8) |
| Per-counterparty | ≤10% |
| Per-custodian | ≤25% |
| Per-issuer (stablecoin) | ≤2% |
| Per-jurisdiction | ≤30% |

### 6.4 Currency Lifecycle (WATCH/REDUCE/SUSPEND/SUBSTITUTE)
```
NORMAL → WATCH → REDUCE → SUSPEND → SUBSTITUTE → REINSTATE

WATCH:     CQS < 6.0 OR sovereign downgrade OR vol > 2σ
REDUCE:    CQS < 5.5 for 20 consecutive readings (~1 month)
SUSPEND:   CQS < 4.0 OR sanctions OR capital controls
SUBSTITUTE: Governance approval (4-of-5) → reallocate to highest-CQS eligible
REINSTATE: CQS > 6.5 for 60 consecutive readings (~3 months)
```

**Substitution MUST NOT default to USD.** Replacement selected by CQS + correlation + liquidity + geopolitical neutrality. No single replacement >50% of freed allocation.

### 6.5 Severe Deviation Protocol (SDP)
```
If |P_t / P_{t-7} − 1| > 5%:
    SDP triggers
    K_SDP = P_reference / P_current
    W_emergency = C_structural × K_SDP
    W_new = max(W_emergency, W_current × 0.50)
    Currency lifecycle: full → suspended
```

---

## 7. DIGITAL LIQUIDITY SLEEVE (v23 — REVISED)

### 7.1 Classification
Stablecoins and tokenized liquidity are **NOT a core monetary reserve pillar.** They are a **digital liquidity sleeve** — a capped, dynamically optimized settlement/redemption bridge.

### 7.2 Constitutional Maximum
- Total digital liquidity: **≤5%** (MAXIMUM, not mandate)
- Per-issuer: **≤2%**
- Minimum issuers: **3** (when allocation > 0%)
- Normal target: **2-5%**
- Stress target: **0-2%** (can reduce toward zero)
- Emergency: **0%** (all digital liquidity can be exited)

### 7.3 Digital Reserve Quality Score (DRQS)
```
DRQS_i = 0.20·Issuer + 0.15·Reserve + 0.15·Redemption + 0.15·Depeg +
         0.10·Jurisdiction + 0.10·Custody + 0.10·Operational + 0.05·Liquidity

Core digital liquidity threshold: DRQS ≥ 7.5
Conditional threshold: DRQS ≥ 6.0
Algorithmic stablecoins: EXCLUDED
```

### 7.4 Approved Digital Liquidity Assets

| Asset | Type | Peg | DRQS | Target | Role |
|---|---|---|---|---|---|
| **USDC** | Regulated fiat-backed | USD | 8.50 | **2.0%** | Primary (deepest liquidity) |
| **USDP** | Regulated fiat-backed | USD | 8.45 | **0.5%** | Highest regulatory quality (Paxos) |
| **EURC** | Regulated fiat-backed | EUR | 7.80 | **0.5%** | EUR currency diversification |
| **BUIDL** | Tokenized government | USD | 8.55 | **0.5%** | Tokenized T-bills (BlackRock) |
| DAI (optional) | Decentralized | USD | 6.25 | 0% | OPTIONAL — below core threshold |
| USDT | Regulated fiat-backed | USD | 6.15 | 0% | EXCLUDED — below threshold |
| **Total** | | | | **3.5%** | Below 5% cap — conservative |

### 7.5 Stablecoin Exposure Metrics
```
SE = Σ Stablecoin Value / R_a                           (nominal exposure)
SAE = Σ (Stablecoin Value × DRQS_i⁻¹ × StressFactor) / R_a  (risk-adjusted exposure)
```
SAE prevents the system from underestimating stablecoin risk. A stressed stablecoin (low DRQS) has a higher effective risk weight than its nominal allocation.

### 7.6 Multi-Dimensional Stablecoin State Machine
| State | Price | Liquidity | Redemption | Reserve | Issuer | Regulatory |
|---|---|---|---|---|---|---|
| NORMAL | <1% | Healthy | Working | Verified | Healthy | Good |
| WATCH | >2% | OR Deter. | OR Slow | OR Opaq. | OR Conc. | OR Review |
| REDUCE | >5% | OR Impair. | OR Delay | OR Quest. | OR Distress | OR Action |
| SUSPEND | >10% | OR Frozen | OR Failed | OR Impair. | OR Failed | OR Sanction |
| SUBSTITUTE | → Move to highest-DRQS eligible alternative | | | | | |
| EMERGENCY EXIT | Immediate conversion if solvency risk material | | | | | |

### 7.7 Bullion → Digital Barrier
| Rebalance Direction | Barrier |
|---|---|
| Gold ↔ Silver (within bullion) | Normal hysteresis |
| Fiat ↔ Fiat (within fiat) | Normal hysteresis |
| Stablecoin ↔ Stablecoin (within digital) | Normal hysteresis |
| Bullion → Fiat | Medium (T2, 3-of-5) |
| Fiat → Bullion | Medium (T2, 3-of-5) |
| Fiat → Digital | Normal (within 5% cap) |
| Digital → Fiat | Normal (encouraged) |
| **Bullion → Digital** | **HIGH (T3, 5-of-5 + Council, EMERGENCY ONLY)** |
| Digital → Bullion | Normal (improving anchor — encouraged) |

**Gold can NEVER be sold to buy stablecoins except during emergency governance.**

### 7.8 Dynamic Reallocation When Digital → 0%
When stablecoins are SUSPENDED (depeg event):
- Pillar C → 0%
- Pillar B → absorbs the freed allocation (increases proportionally)
- Pillar A → UNCHANGED (gold is the anchor)
- RR IMPROVES (stablecoins have haircuts; fiat doesn't)

---

## 8. REBALANCING ENGINE

### 8.1 Pipeline
```
DRIFT → VALIDATE → CONFIRM → PROPOSE → APPROVE → EXECUTE → RECONCILE
```
**NEVER:** `PRICE_MOVE → IMMEDIATE_TRADE`

### 8.2 Trigger Types (9 + LCR + Stablecoin)
1. `weight_drift` (>2% soft, >3% hard)
2. `layer_breach` (outside [min, max])
3. `bullion_band` (φ_t outside [60%, 95%])
4. `stablecoin_eligibility` (DRQS < threshold)
5. `currency_eligibility` (status ≠ full)
6. `concentration_cap` (>60% general, >35% USD)
7. `minimum_floor` (<0.5%)
8. `reserve_ratio` (<100% critical, <102% medium)
9. `council_authorization` (low)
10. LCR (<1.0 high, <1.2 medium)
11. `stablecoin_depeg` (SD >2% watch, >5% reduce, >10% suspend)

### 8.3 Hysteresis
- 2% band: |proposed weight − current weight| ≤ 2% → no action
- 2-cycle confirmation: >2% change must persist 2 consecutive cycles
- Direction-tracking: reversal resets counter (anti-whipsaw)

### 8.4 Trade Suppression
```
If expected_benefit ≤ transaction_cost + slippage + market_impact + 2bp_buffer:
    SUPPRESS (unless emergency override)
```
Emergency overrides: SDP, Constitutional Emergency, concentration_cap, RR<100%, minimum_floor.

### 8.5 Turnover Limits
| Limit | Value |
|---|---|
| Weekly per asset | 3% |
| Daily per asset | 1% |
| Monthly per asset | 6% |
| Single gold trade | $25M |
| Single silver trade | $10M |
| Single sovereign trade | $100M |
| Single stablecoin trade | $50M |

### 8.6 Fee Model
| Asset Class | Execution (bps) | Slippage (bps) | Spread (bps) | Total (VWAP) |
|---|---|---|---|---|
| Cash | 0 | 0 | 0 | 0 |
| Sovereign | 2 | 1 | 1 | 4 |
| Gold | 5 | 3 | 2 | 10 |
| Silver | 7 | 8 | 5 | 20 |
| Stablecoin | 3 | 2 | 1 | 6 |
| Fiat FX | 4 | 2 | 1 | 7 |

### 8.7 Approval Routing
| Severity | Threshold |
|---|---|
| Low | 2 of 5 roles |
| Medium | 3 of 5 |
| High | 4 of 5 |
| Critical | 5 of 5 (unanimous) + Constitutional Council flag |

5 roles: Treasury, Risk, Constitutional, Operations, Independent Oversight.

### 8.8 Proposal Binding (§14)
- Every proposal has a cryptographic hash binding to all parameters
- Changing any parameter → different hash → approval invalidated
- `validUntil`: proposals expire (default 7 days)
- Replay protection: same hash can only execute once

---

## 9. LIQUIDITY & REDEMPTION

### 9.1 LCR (Layer 3 — Hard Metric)
```
LCR = HQLA / 30-day net outflows
HQLA = cash + sovereign × 0.98 + stablecoin × 0.98

Hard floor: LCR ≥ 1.0
Strong: LCR ≥ 1.2
Target: LCR ≥ 1.25
```

### 9.2 LRR
```
LRR = Immediately Available Liquidity / Expected 30-Day Redemption Demand
Strong: ≥ 1.2 | Compliant: ≥ 1.0 | Marginal: ≥ 0.9 | Critical: < 0.9
```
Excludes gold and silver by design (Bullion Protection Rule).

### 9.3 Redemption (§34 — NEVER PAUSED)
- Redemption is **never paused** — not during minting pause, not during emergency
- 1 kg gold minimum (physical redemption)
- 10-minute soft finality, 7-day hard finality
- Fee: 0.05% (5 bps), capped at $5,000
- Article X sequential liquidation order enforced
- Graduated throttle: 5%/24h at RR∈[100%,102%], 2%/24h at RR<100%

### 9.4 Article X Sequential Liquidation
1. Stablecoins (fastest, depeg risk if held)
2. Cash (HQLA L1, 0% haircut)
3. Sovereign (HQLA L2A, T+1)
4. Non-USD FX (7 bps cost)
5. Silver (20 bps cost, $10M trade limit)
6. **Gold LAST** (requires Exhaustion Certificate, constitutional strategic capital)

Pro-rata liquidation is **prohibited**.

---

## 10. SEVEN-STATE RESERVE ACCOUNTING

| # | State | Source | Must NOT masquerade as |
|---|---|---|---|
| 1 | TARGET | Engine | Actual custody |
| 2 | ACTUAL | Committed ledger | Custodian-confirmed |
| 3 | PROPOSED | RebalanceProposal | Approved |
| 4 | APPROVED | Governance vote | Executed |
| 5 | EXECUTED | ExecutionResult | Custodian-confirmed |
| 6 | CUSTODIAN-CONFIRMED | Independent custodian attestation | Reconciled |
| 7 | RECONCILED | Variance-resolution | Target |

---

## 11. CUSTODY & RECONCILIATION

### 11.1 Custody Model
- Operating entity ≠ Reserve assets
- 4-tier custodian hierarchy (official-sector, institutional, specialized vaults, contingency)
- 25% per-custodian cap, 30% per-jurisdiction cap, ≥3 custodians
- Allocated physical bullion (LBMA Good Delivery, ≥99.5% gold, ≥99.9% silver)
- No commingling, no rehypothecation

### 11.2 Reconciliation
- 4-tier severity: 0.1% (informational), 0.5% (warning), 1% (execution pause), 5% (emergency)
- Variance persists across restarts (stored durably in Turso)

---

## 12. ORACLE ARCHITECTURE

### 12.1 Target Architecture (Mainnet)
- **Gold:** 3+ independent sources, median + 2% outlier rejection
- **Silver:** 3+ independent sources (currently 1 — MUST be fixed)
- **FX:** 2+ independent institutional-quality sources (currently 1 — MUST be fixed)
- **Stablecoins:** Real-time price + depeg monitoring (currently hardcoded $1 — MUST be fixed)

### 12.2 Freshness
- Off-chain: 60 seconds
- On-chain: 1 hour
- All oracle read paths enforce staleness

### 12.3 Circuit Breakers
- Trading halt if 2+ sources disagree >3%
- Cool-down if price moves >10% in 1 hour
- Council notification if price moves >20% in 1 day

### 12.4 Fallback Hierarchy
Tier 1 (median) → Tier 2 (single, quorumMet=false) → Tier 3 (last-known-good) → Tier 4 (hardcoded baseline)

---

## 13. GOVERNANCE

### 13.1 Monetary Council
- 7 members (independent professionals, 4-year staggered terms)
- Supermajority: 6/7 (85.7%) for constitutional amendments
- Standard: 4/7 for policy

### 13.2 Amendment Workflow
11 stages. **Timelock: 90 days (constitutional), 7 days (policy).**

### 13.3 Emergency Governance
| Level | Expiry |
|---|---|
| Normal | No expiry |
| Heightened Watch | 30 days |
| Emergency | 7 days |
| Constitutional Emergency | 24 hours |

11 objective triggers (non-discretionary).

---

## 14. CONSTITUTIONAL INVARIANTS

### 14.1 Five Absolute Invariants
1. **100% Reserve Ratio:** `R_a ≥ S × PAR` at all times (policy ≥102%, strategic ≥117%)
2. **No Discretionary Minting:** Minting only upon verified deposit
3. **No Lending of Reserves:** No leverage, no fractional reserve, no rehypothecation
4. **No Commingling:** Yield Program assets never mix with settlement reserves
5. **Bullion Preservation:** Gold liquidated LAST, requires Exhaustion Certificate

### 14.2 On-Chain Invariants
10 on-chain checkable invariants. 15 forbidden function selectors. Anti-platform clause permanently frozen.

---

## 15. DETERMINISM

- No `Date.now()` in decision mathematics
- No `Math.random()` in monetary calculations
- All decision functions are pure (same inputs → same outputs)
- `decimal.js` fixed-point arithmetic
- `asOfTimestamp` passed as parameter

---

## 16. AUDIT TRAIL

- Every reserve-state transition creates an immutable event
- JSONL append-only ledger
- Synchronous write (`appendFileSync`)
- Must survive application restart (durable file + Turso)

---

## 17. SMART CONTRACT REQUIREMENTS

### 17.1 Reserve.sol (4-Tier + Article X)
- 4 constitutional tiers + sequential liquidation
- Gold liquidation requires Exhaustion Certificate
- §22A basket verification on-chain
- §14 proposal hash binding + replay protection

### 17.2 Mint.sol
- 4-tier model matching Reserve.sol
- Mint fee: 5 bps, capped at $5,000
- Must verify `!mtq.mintingPaused()` (RR ≥ 100%)

### 17.3 Redeem.sol
- **Never pausable**
- Fee: 5 bps, capped at $5,000

### 17.4 MTQ.sol
- `mint()`: checks `!mintingPaused`, 1:1 deposit, auto-pause if RR<100%
- `burn()`: never paused
- Founder cap 20% enforced in `_transfer()`

### 17.5 Governance.sol
- 7-member Council, 6/7 supermajority for constitutional
- 15 forbidden selectors
- `checkInvariant(uint8)` for 10 on-chain invariants

### 17.6 Oracle.sol
- All read paths enforce staleness
- Mainnet: multi-source consensus (≥5/8 quorum)

---

## 18. EXECUTION MODES

| Mode | Execution | Approval | Use |
|---|---|---|---|
| SIMULATION | Simulated | Auto-approve | Testnet (default) |
| SHADOW | No execution | Manual (severity-routed) | Institutional observation |
| LIVE | Real execution | Manual (severity-routed) | Production |

**Production gate:** `NODE_ENV=production` + `EXECUTION_MODE=SIMULATION` → refuses to run.

---

## 19. USER FEES

| Fee | Rate | Cap |
|---|---|---|
| Minting | 0.05% (5 bps) | $5,000 |
| Redemption | 0.05% (5 bps) | $5,000 |
| Transfer | 0.01% (1 bp) | $1,000 |
| Custody | 0.10% p.a. | None |

---

## 20. SUPPORTED CURRENCIES

**Reserve-Eligible (Layer A):** USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD (11)
**Bullion:** XAU (gold oz), XAG (silver oz)
**Settlement-Only (Layer B):** EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB

---

## 21. FINALITY

- Soft finality: 10 minutes
- Hard finality: 7 days
- Minimum physical gold redemption: 1 kg

---

## 22. RESERVE VERIFICATION

| Level | Definition | Acceptable For |
|---|---|---|
| 0 — Modeled | Hardcoded in source code | Testnet only |
| 1 — System-reported | API reports the value | Testnet, internal monitoring |
| 2 — Custodian-attested | Independent custodian confirms | Institutional pilot |
| 3 — Independently audited | Qualified auditor verifies | Mainnet |
| 4 — Cryptographically verifiable | Real-time on-chain proof | Central-bank use |

**VERIFIED NAV must be reported separately from MODELED NAV. Never represent modeled reserves as verified reserves.**

---

## APPENDIX A: DOCUMENTS SUPERSEDED

v22, v21, v20, v19, v18, and all addenda. These remain as historical references.

## APPENDIX B: CENTRALIZED SPECIFICATION

`src/lib/reserve-policy-spec.ts` — v23 constants mirrored.

## APPENDIX C: v23 CHANGES FROM v22

| Change | Section | Description |
|---|---|---|
| Stablecoin reclassification | §7 | Digital liquidity sleeve, NOT reserve pillar |
| 5% MAXIMUM not mandate | §7.2 | Can go to 0% during stress |
| DAI optional | §7.4 | Not mandatory (DRQS below threshold) |
| USDT excluded | §7.4 | DRQS=6.15, below threshold |
| USDP added | §7.4 | DRQS=8.45, Paxos trust |
| EURC added | §7.4 | EUR currency diversification |
| BUIDL added | §7.4 | Tokenized government liquidity |
| DRQS implemented | §7.3 | 8-factor stablecoin quality score |
| Multi-dim depeg monitoring | §7.6 | 6-dimensional state machine |
| Bullion→Digital barrier | §7.7 | Emergency governance only |
| SAE metric | §7.5 | Risk-adjusted stablecoin exposure |
| GACR metric | §3.10 | Gold-adjusted coverage (reporting, =RR) |
| BRI weights updated | §3.8 | 0.90/0.10 (from 0.85/0.15, independently verified) |
| USD target zone | §4.2 | 25-30% (not precise 27%) |
| Stress-RR constraint | §3.14 | Hard constraint for optimizer |
| PAR clarification | §2 | USD-denominated settlement unit, NOT USD-backed identity |
| Dynamic pillar bands | §4.4 | Pillars can adjust within constitutional ranges |

---

**This blueprint is complete. It is the single authoritative document for MITHQAL.**
