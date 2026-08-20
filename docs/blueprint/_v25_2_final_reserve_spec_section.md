<!-- §V25.2-START -->

---

# §V25.2 — FINAL MTQ INSTITUTIONAL BACKING ARCHITECTURE (CONTROLLING RESERVE MATHEMATICAL SPECIFICATION)

> **Status:** APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
> **moduleId:** v25.2-final-reserve-spec-1.0
> **Directive sections:** 50
> **Honest state:** design-time specification · no live oracle feeds · no bank/provider/asset contracted · not production-authorized
> **Supersedes:** all older conflicting reserve material per §V25.2.49 Blueprint Conflict Reconciliation (RR 120%→130%; old sleeve tables→80/18/2; digital 3.5%→2%; per-currency cap 60%→20% operative)

This section is the **controlling reserve mathematical specification** for the MTQ system. It is given to the developer as the final reserve mathematical specification, subject only to the blueprint's required quantitative validation before it becomes production-normative.

---

## §V25.2.0 — PURPOSE & SCOPE

This section defines the final institutional backing architecture, the core mathematical foundation, the currency weight engine, the gold/bullion module, the digital liquidity module, the reserve valuation framework, the rebalancing engine, the what-if scenario framework, the asset admission structure, and the required blueprint conflict reconciliation.

**Implementation artifact:** `src/lib/mtq-final-reserve-spec.ts`
**API endpoint:** `GET /api/mtq-final-reserve`
**UI surface:** `src/components/final-reserve-spec-dashboard.tsx` (closure tab)

---

## §V25.2.1 — INSTITUTIONAL BACKING STRUCTURE (§1)

MTQ remains **bank/institutional backing**, not a MITHQAL-owned reserve.

```
MTQ OUTSTANDING
       │
       ▼
Participating Bank / Responsible Institution
       │
       ▼
130% Institutional Backing Target
       │
 ┌─────┼───────────────┐
 ▼     ▼               ▼
80%   18%              2%
Fiat  Gold/Bullion     Digital Liquidity
```

**MITHQAL:**
- does **not** own the backing
- does **not** custody it by default
- verifies it
- applies the constitutional rules
- calculates issuance capacity
- authorizes issuance
- reconciles it
- monitors systemic risk

The **Protected Backing Cell** is a bank-side identified/earmarked allocation, **not** a transfer of custody to MITHQAL.

---

## §V25.2.2 — CORE MATHEMATICAL FOUNDATION (§2-3)

Let:
- `S_t` = MTQ outstanding supply at time t
- `PAR = 1.00 USD` (accounting/settlement reference)
- `L_t` = contractual MTQ redemption liability
- `R_{m,t}` = market reserve/backing value
- `R_{a,t}` = adjusted/prudential backing value
- `R_{l,t}` = stressed/liquidation backing value

**Liability:** `L_t = S_t × PAR`

**Legal solvency ratio:** `RR_t = R_{a,t} / (S_t × PAR)`

| Threshold | Value |
|---|---|
| Strategic target `RR_strategic` | **1.30** |
| Policy floor `RR_policy` | ≥ 1.05 |
| Absolute solvency floor `RR_floor` | ≥ 1.00 |

The **130% target** is the controlling strategic policy candidate. Older 120% material is historical/non-controlling where conflicting.

---

## §V25.2.3 — WHAT 130% MEANS (§3)

For `S = 100,000,000 MTQ` and `PAR = 1`:
- `L = 100,000,000`
- Required strategic backing: `R_target = 1.30 × L = 130,000,000`

**Composition of the 130M total strategic backing:**
| Sleeve | % | Amount |
|---|---|---|
| Fiat / monetary | 80% | $104.0M |
| Gold / bullion | 18% | $23.4M |
| Digital liquidity | 2% | $2.6M |
| **Total** | **100%** | **$130.0M** |

---

## §V25.2.4 — EMERGENCY RESILIENCE CAPACITY (§4)

The 15% emergency resilience capacity is **separate**. It is **not** `130% + 15% = 145%` automatically.

- `CoreBacking = 130%`
- `EmergencyCapacity ≤ 15%`

Emergency resources are counted **only** when:
1. legally enforceable
2. independently verified
3. accessible during stress
4. not already counted elsewhere
5. appropriately haircut-adjusted

The blueprint explicitly separates emergency capacity from the core reserve.

---

## §V25.2.5 — FIAT RESERVE BASKET (§5-6)

### Layer A — Reserve-eligible currencies (core basket, 11 currencies)

| Currency | Role |
|---|---|
| USD | Primary global settlement |
| EUR | Major diversification |
| CHF | Defensive reserve |
| JPY | Asian liquidity |
| GBP | Global financial |
| SGD | Asian diversification |
| AED | GCC settlement (USD-pegged) |
| SAR | GCC settlement (USD-pegged) |
| CNY | Conditional/geopolitical diversification |
| CAD | Commodity diversification |
| AUD | Commodity diversification |

The Constitution must **not** permanently hard-code the names. An **eligibility/admission framework** governs admission based on liquidity, convertibility, market depth, settlement capability, monetary quality, volatility, geopolitical and operational factors.

### Layer B — Settlement-only currencies (NOT core reserve)

EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB + other currencies passing the settlement-admission framework.

A currency can be **supported for settlement without being held as constitutional reserve**. Example: `EGP → Egyptian Bank → MTQ` is possible without `EGP` entering the MTQ core reserve basket.

---

## §V25.2.6 — CURRENCY WEIGHT EQUATION (§7-16)

### §7 — Structural weight

`C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i`

### §8 — Momentum factor

`M_i(t) = P_i(t) / P_i(t − 12m)`, bounded `0.95 ≤ M_i ≤ 1.05`

### §9 — Mean-reversion factor

`R_i(t) = 1 + 0.05·(LTA_i − C_i)`, bounded `0.98 ≤ R_i ≤ 1.02`

### §10 — Volatility shock absorber (EWMA)

`σ²_t = λ·σ²_{t−1} + (1−λ)·r²_t`, `λ = 0.94`, `r_{i,t} = ln(P_{i,t−1} / P_{i,t})`

`σ_t = √σ²_t`

**Attenuation factor:**
- `σ_t ≤ 2%` → `A_t = 1.00`
- `σ_t ≥ 5%` → `A_t = 0.50`
- otherwise → `A_t = 1 − (σ_t − 0.02) / 0.03`
- clamp `0.50 ≤ A_t ≤ 1.00`

### §11 — Combined currency adjustment

`K_i = 1 + A_t·(M_i·R_i − 1)`

When volatility rises, the system automatically reduces the influence of momentum and mean reversion — an anti-procyclical mechanism.

### §12 — Liquidity overlay

`L_i = 1 + η_liq·(Liquidity_i / MedianLiquidity − 1)`, `η_liq = 0.02`

Clamped to ±5%, then proportionally normalized.

### §13 — Raw currency weight

`W_{raw,i} = C_i · K_i · L_i`

### §14 — Proportional normalization

`T = Σ_j W_{raw,j}` then `W_i^{norm} = W_{raw,i} / T`

The blueprint deliberately uses **proportional normalization** rather than Softmax for transparency and auditability.

### §15 — Final effective currency weight

After normalization, the system applies:
1. eligibility
2. concentration
3. minimum floor
4. shock distribution
5. stress constraints
6. geopolitical exposure
7. liquidity
8. jurisdiction
9. bank/custodian exposure
10. final verification

Then `W_i^{final}` is the actual reserve-basket weight. The **final weight** (not raw/intermediate) has operational authority.

### §16 — Concentration policy (REQUIRED CLEANUP)

| Limit | Value |
|---|---|
| Preferred effective currency exposure | ≤ 15% |
| **Hard maximum (operative)** | **20%** |
| Old constitutional ceiling (sanity fail-safe ONLY) | 60% |

The old 60% mechanism may remain only as a deeper constitutional sanity cap that can **never** override the 20% operating limit.

---

## §V25.2.7 — EFFECTIVE USD EXPOSURE (§17)

USD exposure is **not** just direct USD. AED and SAR are economically pegged to USD and count toward effective USD exposure.

`USD_effective = USD_direct + AED_{USD-equiv} + SAR_{USD-equiv} + USD-linked synthetic + USD-linked digital`

**USD hard ceiling:** `USD_effective ≤ 35%` (subject to final reconciliation with the newer concentration policy).

This prevents `USD 15% + AED 10% + SAR 10%` from falsely being regarded as only 15% USD exposure.

---

## §V25.2.8 — CURRENCY FALL EFFECTS (§18-19)

### §18 — Price effect on reserve value

For currency `i` with weight `w_i` losing `d`:

`R' = R·(1 − w_i·d)`, therefore `RR' = RR·(1 − w_i·d)`

**Example:** `RR = 130%`, `w_i = 15%`, `d = 10%` → `RR' = 130% × (1 − 0.15×0.10) = 128.05%`

A 10% fall in a currency representing 15% of backing reduces the reserve ratio by ~1.95 percentage points (before other effects).

### §19 — Post-fall weight drift

`w_i' = w_i·(1−d) / (1 − w_i·d)`

**Example:** `w_i = 15%`, `d = 10%` → `w_i' = 0.15×0.90 / 0.985 = 13.71%`

The currency naturally drifts 15% → 13.71% before active rebalancing.

---

## §V25.2.9 — CURRENCY LIFECYCLE (§20-22)

The lifecycle is more important than the price move.

| State | Trigger |
|---|---|
| **WATCH** | CQS < 6.0 · sovereign downgrade · volatility > 2σ |
| **REDUCE** | CQS < 5.5 for ~20 consecutive readings |
| **SUSPEND** | CQS < 4.0 · sanctions · capital controls · equivalent severe disqualification |
| **SUBSTITUTE** | Governance approves replacement with highest-quality eligible alternative |
| **REINSTATE** | CQS > 6.5 for 60 consecutive readings |

### §21 — Exit & renormalization

`W_i → 0`; remaining: `W_j' = W_j / (1 − W_i)` for every remaining `j`. Verify `Σ W_j' = 1`. Exit is permanently recorded.

### §22 — Minimum currency floor (0.5%)

A currency below `W_min = 0.5%` enters the Q1-Q4 ladder:

| Quarter | Stage | Action |
|---|---|---|
| Q1 | Observation | observe |
| Q2 | Observation | observe |
| Q3 | Probation | governance review |
| Q4 | Removal | final notice |
| (4 quarters below) | REMOVE | remove and renormalize |

This coexists with the DCAR/CQS lifecycle; the hierarchy between the two must be explicit.

---

## §V25.2.10 — GOLD (§23-29)

### §23 — Final mathematical structure

| Parameter | Value |
|---|---|
| Gold target | **18%** of core backing |
| Preferred lower boundary | 15% |
| Operational upper zone | ~21%–22% (under validated currency-risk conditions) |
| Constitutional bullion corridor | 15% ≤ Bullion ≤ 25% |

### §24 — Gold value equation

`R_G = Q_G × P_G` (ounces × spot)

Adjusted: `R_{G,a} = Q_G·P_G·(1 − H_G)·C_G`

Consistent with the general adjusted reserve equation:
`R_a = Σ_a Q_a·P_a·(1 − H_a)·C_a`

### §25 — Gold price fall

`RR' = RR·(1 − 0.18·d_G)`

| Scenario | RR' |
|---|---|
| Gold −20% | `130% × (1 − 0.18×0.20) = 125.32%` |
| Gold −50% | `130% × (1 − 0.18×0.50) = 118.30%` |

### §26 — Liquidation sequence (gold protected LAST)

1. Eligible digital liquidity
2. Cash
3. Short-duration sovereign
4. Non-USD FX
5. Conditional silver
6. Tokenized gold
7. **Physical gold (LAST)**

### §27 — Silver (conditional, currently 0%)

`SDC_Ag = NetResilienceGain − NetCost`

where:
- `NetResilienceGain = CVaR_improvement + StressRR_improvement + LCR_improvement`
- `NetCost = ExecutionCost + CustodyCost + VolatilityPenalty + LiquidityPenalty`

`SDC_Ag > 0` → silver admitted up to **3%**; `SDC_Ag ≤ 0` → silver = **0%**.

**Current validated result: silver = 0%** (diversification contribution not sufficiently positive under tested assumptions).

### §28 — Gold-Silver Resilience Index (advisory)

`BRI_t = (Gold_0 / Gold_t)^0.90 · (Silver_0 / Silver_t)^0.10` (if silver held)

If `SilverWeight = 0`, the silver component is omitted and BRI becomes the gold resilience measure. BRI is **advisory only** — it does not independently rebalance the reserve.

### §29 — Tokenized gold (PAXG) TGRS

`TGRS = 0.20·PhysicalBacking + 0.15·LegalTitle + 0.15·Custody + 0.10·Redemption + 0.10·IssuerReliability + 0.10·OracleReliability + 0.08·Settlement + 0.05·Liquidity + 0.05·OperationalResilience + 0.02·Jurisdiction`

| TGRS | Status |
|---|---|
| ≥ 8.0 | Eligible |
| ≥ 6.0 | Conditional |
| < 6.0 | Rejected |

Haircut: `H_TG = max(5%, 5% + (10 − TGRS)·0.5%)`

**Final cleanup:** Do **not** automatically add historical "5% PAXG" on top of the 18% gold policy. PAXG is conditional tokenized-gold exposure, separately identified, anti-double-counted, subject to TGRS. The quantitative engine decides whether it belongs inside the bullion sleeve or is treated as separate digital/operational exposure.

---

## §V25.2.11 — DIGITAL LIQUIDITY (§30-36)

### §30 — Final policy

| Tier | Value |
|---|---|
| Normal target `D_normal` | **2%** |
| Operational ceiling `D_operational` | ≤ 3% |
| Constitutional maximum `D_max` | 5% |
| Emergency `D_emergency` | 0% |

### §31 — Digital Asset Quality Equation (DRQS)

`DRQS_i = 0.20·Issuer + 0.15·Reserve + 0.15·Redemption + 0.15·Depeg + 0.10·Jurisdiction + 0.10·Custody + 0.10·Operational + 0.05·Liquidity`

| DRQS | Status |
|---|---|
| ≥ 7.5 | Core |
| ≥ 6.0 | Conditional |
| Algorithmic stablecoins | **EXCLUDED** |

### §32 — Current digital universe

| Asset | DRQS | Role |
|---|---|---|
| USDC | 8.50 | Primary digital liquidity |
| USDP | 8.45 | Secondary regulated USD liquidity |
| EURC | 7.80 | EUR diversification |
| BUIDL | 8.55 | Tokenized U.S. T-bill liquidity |
| DAI | 6.25 | Optional/conditional, currently 0% |
| USDT | 6.15 | Currently 0%, excluded from core digital reserve |

### §33 — USDT is NOT "banned from MITHQAL"

USDT can remain an **external settlement/conversion/bridge input**:

```
USDT → Authorized Bank/Provider → Conversion → Eligible institutional value → MTQ
```

But `USDT → MTQ Core Backing = NO` under current policy. This separation lets MTQ interoperate with USDT without becoming dependent on USDT.

### §34 — Stablecoin risk-adjusted exposure

Nominal: `SE = Σ StablecoinValue_i / R_a`

Risk-adjusted: `SAE = Σ (StablecoinValue_i × (DRQS_i − 1)/DRQS_i × StressFactor_i) / R_a`

1% of a high-quality stablecoin is **not** economically equivalent to 1% of a severely stressed stablecoin.

### §35 — Stablecoin stress equation

`StressDRQS_i = DRQS_i · (1 − SF_i)`

where:
`SF_i = 0.20·DepegShock + 0.20·RedemptionStress + 0.15·LiquidityStress + 0.15·CounterpartyStress + 0.10·CustodyStress + 0.10·JurisdictionStress + 0.10·SettlementDelayStress`

The optimizer uses `EffectiveDRQS_i = min(DRQS_i, StressDRQS_i)` — not headline DRQS.

### §36 — Digital state machine

| State | Trigger |
|---|---|
| NORMAL | < 1% deviation, healthy |
| WATCH | 2% deviation or deteriorating conditions |
| REDUCE | 5% deviation or impaired conditions |
| SUSPEND | 10% deviation, frozen redemption, failed reserve, sanctions |

If no eligible replacement exists, convert operational stablecoin allocation to **Tier-1 cash** until a replacement is approved.

---

## §V25.2.12 — RESERVE VALUATION (§37-42)

### §37 — Three reserve values

| Value | Equation |
|---|---|
| Market | `R_m = Σ_a Q_a·P_a` |
| Adjusted (prudential) | `R_a = Σ_a Q_a·P_a·(1 − H_a)·C_a` |
| Stress (liquidation) | `R_l = Σ_a Q_a·P_a·(1 − H_a)·C_a·S_a` |

where `Q_a` = quantity, `P_a` = market price, `H_a` = constitutional haircut, `C_a` = counterparty adjustment, `S_a` = stress factor.

### §38 — Counterparty adjustment

`C_a = Credit_a × Jurisdiction_a × Operational_a`, with `0 < C_a ≤ 1`

$100M nominal assets do not necessarily equal $100M prudential backing.

### §39 — Three NAVs

| NAV | Equation |
|---|---|
| Market NAV | `NAV_m = R_m / S` |
| Prudential NAV | `NAV_l = R_a / S` |
| Stress NAV | `NAV_s = R_l / S` |

For MTQ solvency, the **prudential value** is the important one.

### §40 — FSCR

`FSCR = R_{stress-adjusted} / (S × PAR)` — coverage interpretation (≥1.10 normal, ≥1.05 defensive, ≥1.00 emergency).

If the optimizer cannot meet hard StressRR/FSCR constraints: `NO_FEASIBLE_PORTFOLIO` — issuance reduced/frozen.

**Notation note:** §40 literally writes `L / R_l`, but thresholds require `R_l / L` (coverage). Implemented as coverage per standard banking convention; flagged for blueprint clarification.

### §41 — Liquidity Coverage

`LCR = HQLA / (30-day net redemption outflow)`, target `LCR ≥ 1.00`

A portfolio can be solvent but unable to meet today's redemption demand.

### §42 — Front-line / strategic fiat structure

The 80% fiat sleeve is split by function:
- **Front-line liquidity:** 50% of total core reserve
- **Strategic fiat/currency diversification:** 30% of total core reserve

For 130 units of core backing: `65 + 39 + 23.4 + 2.6 = 130`.

---

## §V25.2.13 — REBALANCING (§43-44)

### §43 — Rebalancing equation

`Δ_i = W_{actual,i} − W_{target,i}`

**Normal trigger:** `|Δ_i| > τ` where `τ ≈ 2 percentage points`.

Immediate corrective action overrides the ordinary threshold when:
- constitutional range breached
- concentration breached
- eligibility changes
- backing/solvency requires it
- stablecoin eligibility fails
- emergency governance activates

### §44 — Transaction-cost test

`NetBenefit = RiskReductionBenefit − TotalTradeCost`

Execute voluntary rebalance **only if** `NetBenefit > 0`, unless a hard constitutional/legal breach requires correction.

`TotalCost = Spread + Fees + Slippage + MarketImpact + Custody + Settlement + Taxes + LifecycleCosts`

Post-trade reserve value must deduct costs before recomputing coverage.

---

## §V25.2.14 — WHAT-IF SCENARIOS (§45)

For `S = 100M MTQ`, `L = 100M`, `RR = 130%`, `R_a = 130M`:

| Scenario | Calculation | RR' |
|---|---|---|
| A. 15%-currency falls 20% | `130M × (1 − 0.15×0.20) = 126.1M` | 126.10% |
| B. Gold falls 20% (18%) | `130M × (1 − 0.18×0.20) = 125.32M` | 125.32% |
| C. 2% digital sleeve loses 50% | `130M × (1 − 0.02×0.50) = 128.7M` | 128.70% |
| D. Digital sleeve → zero | `130M × (1 − 0.02) = 127.4M` | 127.40% |

Scenario D (still above 100%) demonstrates why the digital sleeve is deliberately small.

---

## §V25.2.15 — FINAL ASSET ADMISSION STRUCTURE (§46-48)

### §46A — Core reserve/backing basket

- **Monetary/fiat — 80%**: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY (conditional), CAD, AUD — all subject to dynamic eligibility
- **Gold/bullion — 18% target**: allocated physical gold; silver conditional (currently 0%, max 3% if SDC_Ag > 0); tokenized gold conditional separate
- **Digital liquidity — 2% normal**: USDC, USDP, EURC, BUIDL (preferred); DAI 0% optional; USDT excluded from core

### §47 — Settlement-only (NOT core reserve)

- **Fiat:** EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB + qualified others
- **Digital:** USDT, DAI, other approved stablecoins/assets
- **CBDCs:** subject to central-bank authorization
- **Tokenized bank money:** separate class from stablecoins
- **Gold-backed digital:** conditional, individually assessed

**Principle: settlement eligibility ≠ backing eligibility.**

### §48 — USDT architecture

```
USDT → External Input/Bridge → Eligibility Engine (jurisdiction + provider + sanctions)
      → Authorized Conversion → Bank/LP → Institutional Value → Final Settlement → MTQ Issuance
```

But `USDT → MTQ Core Backing = NO` under current policy.

The BIS's 2026 work highlights that current stablecoins can deviate from par and have redemption/liquidity/settlement frictions — supporting the decision not to make MTQ structurally dependent on them.

---

## §V25.2.16 — BLUEPRINT CONFLICT RECONCILIATION (§49)

Four historical conflicts the developer must clean up explicitly:

| # | Conflict | Older | Controlling | Resolution |
|---|---|---|---|---|
| 1 | Reserve Ratio target | RR = 120% | RR = 130% | Implement 130% as current strategic target |
| 2 | Reserve sleeve composition | 15% gold + 5% tokenized + 2.5% digital | 80/18/2 | Implement 80/18/2; do NOT implement both |
| 3 | Digital liquidity target | USDC 2% + USDP 0.5% + EURC 0.5% + BUIDL 0.5% = 3.5% | Digital normal = 2% | 2% is normal center; individual weights are optimizer outputs |
| 4 | Per-currency cap | 60% | Preferred 15%, Hard 20% | 20% operative; 60% retained only as deeper sanity cap that can never override 20% |

All four reconciliations are **essential** and **implemented** in `src/lib/mtq-final-reserve-spec.ts`.

---

## §V25.2.17 — FINAL EQUATION SYSTEM (§50)

The entire reserve engine:

```
L  = S × PAR
R_m = Σ_a Q_a · P_a
R_a = Σ_a Q_a · P_a · (1 − H_a) · C_a
R_l = Σ_a Q_a · P_a · (1 − H_a) · C_a · S_a
RR  = R_a / L
FSCR = R_l / L   (coverage interpretation)
```

Per currency:
```
C_i = 0.50·COFER_i + 0.40·SWIFT_i + 0.10·BIS_i
M_i = P_i(t) / P_i(t−12m)                       [0.95, 1.05]
R_i = 1 + 0.05·(LTA_i − C_i)                     [0.98, 1.02]
σ²_t = λ·σ²_{t−1} + (1−λ)·r²_t                  λ=0.94
A_t = { 1.00 if σ≤2%; 1−(σ−0.02)/0.03 if 2%<σ<5%; 0.50 if σ≥5% }
K_i = 1 + A_t·(M_i·R_i − 1)
L_i = 1 + 0.02·(Liquidity_i − Median)           [clamp ±5%]
W_raw,i = C_i · K_i · L_i
W_i^norm = W_raw,i / Σ_j W_raw,j                (proportional, NOT softmax)
W_i^final = apply(eligibility → concentration → floor → stress → geopolitical → liquidity → jurisdiction → verification)
Σ_i W_i^final = 1
```

Overall reserve composition:
```
B_t = 80%,  G_t = 18%,  D_t = 2%   (policy center 80/18/2)
subject to: 70% ≤ B_t ≤ 85%,  15% ≤ Bullion_t ≤ 25%,  0% ≤ D_t ≤ 5%
```

---

## §V25.2.18 — FINAL COO DECISION

This is the reserve architecture now frozen conceptually:

**130% institutional backing target → 80% monetary/fiat + 18% gold-centered bullion + 2% digital liquidity**, with a separate non-double-counted emergency resilience capacity of up to 15%.

- The fiat basket is USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD.
- EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB and other qualified currencies remain settlement/conversion currencies, not core reserve currencies.
- USDT is an external interoperability/conversion asset, not current core digital backing.
- USDC/USDP/EURC/BUIDL are the current digital-liquidity candidates, dynamically constrained within the 2% normal sleeve.
- Gold remains the primary constitutional monetary anchor, institutionally allocated/segregated, with silver conditional and currently 0%.

**Most importantly:** the percentages are not blindly fixed numbers. The monetary engine calculates currency weights through structural importance, momentum, mean reversion, volatility attenuation, liquidity, concentration and eligibility, then verifies the result before it can affect issuance or settlement.

This is the structure given to the developer as the **final reserve mathematical specification**, subject only to the blueprint's required quantitative validation before it becomes production-normative.

---

## §V25.2.19 — HONEST STATE DECLARATION

| Property | Value |
|---|---|
| designTimeSpec | true |
| liveOracleFeeds | false |
| bankContracted | false |
| providerContracted | false |
| assetContracted | false |
| productionAuthorized | false |
| finalStatus | APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED |
| finalStatusColor | AMBER |
| v25_0_Frozen | true (baseline preserved) |
| supersedesOlderConflictingMaterial | true (per §V25.2.49) |

All reserve inputs (COFER shares, FX prices, gold spot, DRQS scores) are **policy reference values** for design-time demonstration, **not** live oracle feeds. No real bank/provider/asset is contracted.

---

**END OF §V25.2 — FINAL MTQ INSTITUTIONAL BACKING ARCHITECTURE**

<!-- §V25.2-END -->
