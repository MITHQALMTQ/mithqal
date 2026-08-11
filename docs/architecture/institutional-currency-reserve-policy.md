# Institutional Currency Reserve Policy
## Formal Reserve Architecture per v20 Canonical Blueprint

**Date:** 2026-08-11
**Authority:** v20 Canonical Blueprint (`docs/architecture/mithqal-canonical-v20.md`)
**Status:** AUTHORITATIVE — implements §4 (Reserve Architecture), §5 (φ_t), §6 (Currency Engine), §7 (Rebalancing), §8 (Liquidity & Redemption), §10 (Custody), §12 (Governance Emergency)
**Owner:** Monetary Council (constitutional), Chief Reserve Manager (operational)

---

## 0. Purpose

This document is the **formal currency reserve policy** of the MITHQAL Constitutional Settlement Institution. It translates the v20 Canonical Blueprint into an operating policy that the Monetary Council, the Chief Reserve Manager, custodians, and auditors can apply day-to-day.

**Optimization priority (inviolable):**
```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY > RETURN
```

**Constitutional identity (v20 §2):** MITHQAL is a Constitutional Settlement Institution — not a bank, not a lending platform, not a payment processor, not a marketplace, not a DeFi protocol, not a speculative asset, not a DAO. The Anti-Platform Clause is permanently frozen.

---

## 1. Six Reserve Components × 15 Properties

The reserve consists of **6 components** (Tier 1 cash, Tier 2 sovereign, Tier 3 gold, Tier 3 silver, Tier 4 stablecoin, and the aggregate). Each component is governed by **15 properties** drawn from v20 §1.3 (tier ranges), §6.6 (concentration), §7.5 (scale-aware trade limits), §8.1 (LCR), §10 (custody), §11 (oracle), §6.5 (shock absorber), §22A/§22B (hysteresis).

### 1.1 Component 1 — Tier 1 Cash (Central-Bank-Quality)

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target | 40% of total reserve value | §1.3 |
| 2 | Constitutional minimum (soft) | 25% | §1.3 |
| 3 | Constitutional maximum (hard) | 60% | §1.3 |
| 4 | Soft deviation (triggers review) | ±5pp from target | §7.2 (weight_drift, T2) |
| 5 | Hard deviation (triggers rebalance) | ±10pp from target | §7.2 (layer_breach, T3) |
| 6 | Emergency deviation (triggers Council) | outside [25%, 60%] | §7.2 (layer_breach, T3) |
| 7 | Hysteresis band (anti-whipsaw) | 2pp, 2-cycle confirmation, direction-tracking | §22B |
| 8 | Min time between rebalances | 4h (T1 observe) / 14d (T2) | §7.3 |
| 9 | Max turnover per event | 5% of totalReserveValue | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset | §7.5 |
| 11 | Liquidity classification | HQLA Level 1, 0% haircut | §6, §8.1 |
| 12 | Approval requirement (severity-routed) | T3 = 5/5 + Constitutional Council flag | §7.8 |
| 13 | Transaction-cost threshold | Suppress if benefit ≤ cost + slippage + impact + 2bps buffer | §7.4 |
| 14 | Volatility treatment | Stress coefficient 0.95 | §3.4 |
| 15 | Counterparty constraint | ≤10% per-counterparty, ≤25% per-custodian, ≤30% per-jurisdiction | §6.6, §10 |

### 1.2 Component 2 — Tier 2 Sovereign (Short-Duration ≤ 1yr)

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target | 35% | §1.3 |
| 2 | Constitutional minimum (soft) | 20% | §1.3 |
| 3 | Constitutional maximum (hard) | 50% | §1.3 |
| 4 | Soft deviation | ±5pp | §7.2 |
| 5 | Hard deviation | ±10pp | §7.2 |
| 6 | Emergency deviation | outside [20%, 50%] | §7.2 |
| 7 | Hysteresis band | 2pp, 2-cycle, direction-tracking | §22B |
| 8 | Min time between rebalances | 4h / 14d | §7.3 |
| 9 | Max turnover per event | 5% of totalReserveValue | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset | §7.5 |
| 11 | Liquidity classification | HQLA Level 2A (T+1), 2% haircut | §6, §8.1 |
| 12 | Approval requirement | T3 = 5/5 + Council | §7.8 |
| 13 | Transaction-cost threshold | 4 bps total VWAP (2+1+1); suppress if uneconomic | §7.4, §7.6 |
| 14 | Volatility treatment | Stress coefficient 0.90 | §3.4 |
| 15 | Counterparty constraint | Per-issuer ≤15%, per-jurisdiction ≤30% | §6.6, §10 |

### 1.3 Component 3 — Tier 3 Gold (Allocated Physical)

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target | φ_t × Bullion target (φ_t dynamic 75–85%) | §5.2, §1.3 |
| 2 | Constitutional minimum (φ_min, hard floor) | 60% of bullion | §5.2 |
| 3 | Constitutional maximum (φ_max, hard cap) | 95% of bullion | §5.2 |
| 4 | Soft deviation (within bullion band) | φ_t drift ±2pp → no action | §5.4 |
| 5 | Hard deviation | φ_t outside [75%, 85%] normal band → rebalance band | §5.2 |
| 6 | Emergency deviation | φ_t outside [60%, 95%] → constitutional violation | §5.2 |
| 7 | Hysteresis band (gold-specific) | 2pp, 2-cycle, direction-tracking (anti-whipsaw) | §5.4 |
| 8 | Min time between rebalances | 4h / 14d (T2); immediate (T3 emergency) | §7.3 |
| 9 | Max turnover per event | 5% of totalReserveValue OR $25M (whichever smaller) | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset | §7.5 |
| 11 | Liquidity classification | Strategic Liquidity, days-weeks; 5% haircut | §6, §8.1, §8.4 |
| 12 | Approval requirement | T3 = 5/5 + Council + Exhaustion Certificate (Invariant 5) | §7.8, §13.1 |
| 13 | Transaction-cost threshold | 10 bps total VWAP; suppress if uneconomic | §7.4, §7.6 |
| 14 | Volatility treatment | Stress coefficient 0.85; gold EWMA vol drives φ_t | §3.4, §5.3 |
| 15 | Counterparty constraint | LBMA Good Delivery, ≥99.5%; allocated only; no commingling | §10.1 |

### 1.4 Component 4 — Tier 3 Silver (Allocated Physical)

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target | (1 − φ_t) × Bullion target | §5.1, §1.3 |
| 2 | Constitutional minimum (soft, derived) | 5% of bullion (when φ_t at 95%) | §5.2 |
| 3 | Constitutional maximum (hard, derived) | 40% of bullion (when φ_t at 60%) | §5.2 |
| 4 | Soft deviation | (1−φ_t) drift ±2pp → no action | §5.4 |
| 5 | Hard deviation | φ_t outside normal band | §5.2 |
| 6 | Emergency deviation | φ_t outside [60%, 95%] | §5.2 |
| 7 | Hysteresis band | 2pp, 2-cycle, direction-tracking | §5.4 |
| 8 | Min time between rebalances | 4h / 14d (T2); immediate (T3) | §7.3 |
| 9 | Max turnover per event | 5% OR $10M (whichever smaller; thinner market) | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset | §7.5 |
| 11 | Liquidity classification | Strategic Liquidity (after Tier 3-gold); 7% haircut | §6, §8.1, §8.4 |
| 12 | Approval requirement | T3 = 5/5 + Council | §7.8 |
| 13 | Transaction-cost threshold | 20 bps total VWAP (highest of all classes); suppress if uneconomic | §7.4, §7.6 |
| 14 | Volatility treatment | Stress coefficient 0.80; independent of gold (silver not mirror) | §3.4, §5.5 |
| 15 | Counterparty constraint | LBMA Good Delivery, ≥99.9%; allocated; independent evaluation per §5.5 | §10.1, §5.5 |

### 1.5 Component 5 — Tier 4 Stablecoin (Operational Liquidity)

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target | 5% | §1.3 |
| 2 | Constitutional minimum (soft) | 0% | §1.3 |
| 3 | Constitutional maximum (hard) | 10% | §1.3 |
| 4 | Soft deviation | ±5pp | §7.2 |
| 5 | Hard deviation | outside [0%, 10%] | §7.2 |
| 6 | Emergency deviation | outside [0%, 10%] OR depeg > 10% | §7.2, §12.3 |
| 7 | Hysteresis band | 2pp, 2-cycle, direction-tracking | §22B |
| 8 | Min time between rebalances | 4h / 14d | §7.3 |
| 9 | Max turnover per event | 5% OR $50M (whichever smaller) | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset | §7.5 |
| 11 | Liquidity classification | HQLA proxy at 0.98 (2% haircut) | §6, §8.1 |
| 12 | Approval requirement | T3 = 5/5 + Council (suspension override) | §7.8 |
| 13 | Transaction-cost threshold | 6 bps total VWAP; suppress if uneconomic | §7.4, §7.6 |
| 14 | Volatility treatment | Stress coefficient 0.80; depeg > 10% → suspension | §3.4, §12.3 |
| 15 | Counterparty constraint | Per-issuer ≤15%; regulated issuers only | §6.6, §10 |

### 1.6 Component 6 — Aggregate Reserve

| # | Property | Value | v20 Ref |
|---:|---|---|---|
| 1 | Constitutional target (RR) | 102% (over-collateralization buffer) | §1.5 |
| 2 | Constitutional minimum (RR floor, hard) | 100% (auto-pauses minting) | §1.5, §13.1 |
| 3 | Constitutional maximum (no hard cap) | Unlimited (no upper RR cap) | §3.4 |
| 4 | Soft deviation (RR) | < 102% → +2% fiat / -2% bullion allocation shift | §4.2 |
| 5 | Hard deviation (RR) | < 100% → minting auto-pause | §13.1, §16.4 |
| 6 | Emergency deviation (RR) | < 100% sustained → §44 Constitutional Emergency | §12.3, §13.1 |
| 7 | Hysteresis band (aggregate) | Not applicable — RR is continuous, no whipsaw risk | — |
| 8 | Min time between rebalances | N/A (continuous invariant) | — |
| 9 | Max turnover per event (aggregate) | 5% of totalReserveValue | §7.5 |
| 10 | Max turnover per day / week / month | 1% / 3% / 6% per asset class | §7.5 |
| 11 | Liquidity classification | LCR ≥ 1.0 hard, ≥ 1.25 target; LRR ≥ 1.0 | §8.1, §8.2 |
| 12 | Approval requirement | 5/5 + Council for any aggregate deviation > 5% | §7.8 |
| 13 | Transaction-cost threshold | Trade suppression applies per asset class | §7.4 |
| 14 | Volatility treatment | Aggregate shock absorber: σ ≤ 2% → A=1.0; σ ≥ 5% → A=0.5 | §6.5 |
| 15 | Counterparty constraint | Aggregate ≤ 100%; ≥3 custodians; ≥3 currencies; ≤25% per-custodian | §6.6, §10.1 |

---

## 2. Dynamic Currency Model — 7 Protective Mechanisms

The currency engine (v20 §6) computes currency weights via **7 protective mechanisms**, applied in order. No `PRICE_MOVE → IMMEDIATE_TRADE` is permitted (v20 §7.1).

### 2.1 Mechanism 1 — Structural Weighting (§6.1)

```
C_i = 0.50 × COFER_i + 0.40 × SWIFT_i + 0.10 × BIS_i
```
- α (COFER) = 50% — IMF reserve importance
- β (SWIFT) = 40% — international settlement usage
- γ (BIS) = 10% — FX liquidity

Currency basket: 8 sovereign currencies (USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD) + XAU + XAG (10 mint/redeem currencies). The Constitution names no specific currencies — the 8-currency list is a policy/implementation decision (v20 §6.2).

### 2.2 Mechanism 2 — Momentum (§6.3)

```
M_i = clamp(P_12mo_ago / P_today, 0.95, 1.05)    // ±5% hard cap
```

Trailing-12-month momentum, hard-capped at ±5%. Prevents runaway currency trends from dominating the basket.

### 2.3 Mechanism 3 — Mean Reversion (§6.4)

```
B_i = clamp(1 + 0.05 × (LTA_i − C_i), 0.98, 1.02)   // ±2% cap
```

Long-term-averaging mean reversion, hard-capped at ±2%. Pulls weights back toward structural equilibrium.

### 2.4 Mechanism 4 — Shock Absorber (§6.5)

```
σ ≤ 2% → A_t = 1.0
σ ≥ 5% → A_t = 0.5
Linear interpolation between

K_i = 1 + A_t × (M_i × B_i − 1)
```

Volatility-driven dampening. When market volatility rises, the combined momentum × reversion multiplier is dampened by up to 50%. This is the **only mechanism that scales the output**, not just clamps it.

### 2.5 Mechanism 5 — Concentration Limits (§6.6)

| Limit | Value | Enforcement |
|---|---|---|
| Per-currency floor | 0.5% | `minimum_floor` trigger (high severity) |
| Per-currency cap | **60%** | `concentration_cap` trigger (critical severity) |
| Regional group cap | 70% | Manual review |
| Minimum diversity | 3 currencies | Hard gate |
| Per-counterparty | ≤10% | §10 7-tier cap table |
| Per-custodian | ≤25% | §10 |
| Per-issuer | ≤15% | §10 |
| Per-jurisdiction | ≤30% | §10 |
| Per-infrastructure | ≤20% | §10 |
| Per-currency (aggregate) | ≤35% | §10 |
| Aggregate | ≤100% | Reconciliation |

The 60% per-currency cap (v20 §1.2) is **canonical**. USD's structural weight is ~47% (COFER 50% + SWIFT 40% + BIS 10%); a 50% cap would bind during normal operations. 60% allows natural structural weight + bounded momentum (±5%) without binding in normal markets.

### 2.6 Mechanism 6 — Hysteresis (§22B)

- 2% band: `|proposed weight − current weight| ≤ 2%` → no action
- 2-cycle confirmation required before applying any >2% change
- **Direction-tracking:** if drift direction reverses, confirmation counter resets (anti-whipsaw)

Verified: 13 oscillation patterns tested, **0 whipsaws** (see `mathematical-reserve-validation.md` §6).

### 2.7 Mechanism 7 — Severe Deviation Protocol (SDP, §6.9 + §33)

```
If |P_t / P_{t-7} − 1| > 5%:
    SDP triggers
    K_SDP = P_reference / P_current
    W_emergency = C_structural × K_SDP
    W_new = max(W_emergency, W_current × 0.50)    // SDP_CAP = anti-shock
    Currency lifecycle: full → suspended
    §20 normalization: others rise proportionally
```

The SDP is **non-discretionary** — operator cannot override. Once triggered, the affected currency moves to Suspended lifecycle state and its weight is recomputed against a reference price (7-day average pre-shock).

---

## 3. Gold / Silver φ_t — 5 Bands + Hysteresis + Independence

### 3.1 Five φ_t Bands (v20 §5.2)

```
φ_t = gold's share of bullion (Tier 3) at time t
Gold_t = φ_t × Bullion_t
Silver_t = (1 − φ_t) × Bullion_t
```

| Band | φ_t Range | Action |
|---|---|---|
| 1. Constitutional hard floor | φ_t < 60% | **Impossible** — would violate v20 §5.2 |
| 2. Rebalance band (low) | 60% ≤ φ_t < 75% | Increase gold (when stable) or accept (when volatile) |
| 3. Normal band | 75% ≤ φ_t ≤ 85% | No action (default operating range) |
| 4. Rebalance band (high) | 85% < φ_t ≤ 95% | Decrease gold (when volatile) or accept (when stable) |
| 5. Constitutional hard cap | φ_t > 95% | **Impossible** — would violate v20 §5.2 |

Default target: φ_t = 80%.

### 3.2 Dynamic φ_t Target (v20 §5.3)

| Gold EWMA Volatility | Target φ_t | Rationale |
|---|---|---|
| > 3% | 75% | Reduce gold exposure when volatile |
| < 0.5% | 85% | Increase gold exposure when stable |
| 0.5% – 3% | 80% | Default operating target |

### 3.3 Hysteresis (§5.4 — Incorporated)

- **2pp band:** `|proposed φ_t − current φ_t| ≤ 2pp` → no action
- **2-cycle confirmation:** >2pp drift must persist for 2 consecutive evaluation cycles
- **Direction-tracking:** if drift direction reverses, confirmation counter resets (anti-whipsaw)

Mathematical consequence: because gold is 80% of bullion and bullion is 20% of reserves, a ~13% gold price move is required to exceed the 2pp band. The system absorbs normal gold volatility (5–10% moves) without rebalancing.

### 3.4 Silver Independence (§5.5)

Silver does **NOT** automatically mirror gold. Each metal is independently evaluated. Silver has:
- Higher volatility (independent stress modeling, stress coefficient 0.80 vs gold 0.85)
- Lower liquidity (thinner market)
- Higher transaction costs (20 bps VWAP vs gold 10 bps)
- Lower absolute trade limit ($10M vs gold $25M)

This independence is critical: a gold rally does not auto-trigger a silver selloff.

---

## 4. Rebalancing Pipeline (v20 §7.1)

```
DRIFT → VALIDATE → CONFIRM → PROPOSE → APPROVE → EXECUTE → RECONCILE
```

**NEVER:** `PRICE_MOVE → IMMEDIATE_TRADE`

### 4.1 Pipeline Stages

| Stage | Purpose | Output |
|---|---|---|
| 1. DRIFT | Detect weight drift, layer breach, φ_t band exit, eligibility change, concentration cap, minimum floor, RR/LCR breach, Council authorization | Trigger event |
| 2. VALIDATE | Verify trigger is genuine (not oracle noise); check proposal-hash inputs are well-formed | Validated trigger |
| 3. CONFIRM | Apply 2-cycle confirmation + direction-tracking (hysteresis) | Confirmed trigger |
| 4. PROPOSE | Generate `RebalanceProposal` with cryptographic hash binding all parameters | Proposal (state: PROPOSED) |
| 5. APPROVE | Severity-routed vote (2/3/4/5 of 5 roles) within `validUntil` window | Approved proposal (state: APPROVED) |
| 6. EXECUTE | Execute via TWAP (default), enforce trade suppression + scale-aware limits | ExecutionResult (state: EXECUTED) |
| 7. RECONCILE | Reconcile executed vs custodian-confirmed; resolve variance | Reconciled state (state: RECONCILED) |

### 4.2 10 Trigger Types (v20 §7.2)

1. `weight_drift` (>2% soft, >3% hard)
2. `layer_breach` (outside constitutional [min, max])
3. `bullion_band` (φ_t outside [60%, 95%])
4. `stablecoin_eligibility` (status ≠ full)
5. `currency_eligibility` (status ≠ full)
6. `concentration_cap` (>60%, critical)
7. `minimum_floor` (<0.5%, high)
8. `reserve_ratio` (<100% critical, <102% medium)
9. `council_authorization` (low)
10. LCR (<1.0 high, <1.2 medium)

### 4.3 Four Rebalancing Tiers (v20 §7.3)

| Tier | Trigger | Delay | Approval | Max Turnover |
|---|---|---|---|---|
| **T0** | None | N/A | None | 0% |
| **T1** | Minor drift | 4–48h | None | 0% (observe only) |
| **T2** | Medium/high | 14–60d | 2–4 of 5 roles | 3% weekly per asset |
| **T3** | Critical/emergency | Immediate | 5/5 + Constitutional Council flag | Suspended (documented) |

### 4.4 Trade Suppression Rule (v20 §7.4 — Incorporated)

```
If expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer:
    SUPPRESS (unless objective emergency)
```

**Risk buffer = 2 bps.**

**Emergency overrides (5):** SDP, §44 Constitutional Emergency, `concentration_cap`, RR<100%, `minimum_floor`. These always execute even if uneconomic.

### 4.5 Scale-Aware Trade Limits (v20 §7.5 — Incorporated)

| Limit | Value | Rationale |
|---|---|---|
| Single-action | 5% of totalReserveValue | Prevents dominance |
| Weekly turnover | 3% per asset (Invariant I-4) | Prevents churning |
| Daily turnover | 1% per asset | Derived |
| Monthly turnover | 6% per asset | Derived |
| Max single gold trade | $25M | LBMA market depth |
| Max single silver trade | $10M | Thinner market |
| Max single sovereign trade | $100M | Primary-dealer threshold |
| Max single stablecoin trade | $50M | Issuer limits |
| Max single counterparty | $50M | §10 10% of $500M |
| Max single custodian | $125M | §10 25% of $500M |
| Emergency single-trade | $500M | Council-authorized |

**Dual-limit system:** The binding constraint is whichever is smaller (percentage for small portfolios, absolute for large). Oversized trades are **phased** via TWAP.

### 4.6 Approval Routing (v20 §7.8)

| Severity | Threshold |
|---|---|
| Low | 2 of 5 roles |
| Medium | 3 of 5 |
| High | 4 of 5 |
| Critical | 5 of 5 (unanimous) + Constitutional Council flag |

5 roles: Treasury, Risk, Constitutional, Operations, Independent Oversight.

SIMULATION mode (testnet) auto-approves all 5 roles. Production requires `EXECUTION_MODE=SHADOW` or `LIVE`. Production gate refuses SIMULATION when `NODE_ENV=production`.

### 4.7 Proposal Binding (v20 §7.9 — §14 Incorporated)

- Every proposal has a cryptographic hash binding to: asset, quantity, side, price, custodian, destination, source, timestamp, validity window, execution limits, reserve-state version
- Changing any parameter → different hash → approval invalidated
- `validUntil` field: proposals expire (default 7 days)
- Replay protection: same hash can only execute once

---

## 5. Redemption Priority (Article X — v20 §1.4 + §8.3)

### 5.1 Sequential Liquidation Order (Constitutional)

| Order | Asset Class | Rationale |
|---|---|---|
| 1 | Tier 4 stablecoins | Fastest to convert |
| 2 | Tier 1 cash | HQLA Level 1, 0% haircut |
| 3 | Tier 2 sovereign | HQLA Level 2A, T+1 |
| 4 | Tier 3 silver | Strategic Liquidity, days-weeks |
| 5 | Tier 3 gold | LAST — requires Exhaustion Certificate (Invariant 5) |

**Pro-rata liquidation is PROHIBITED** (v20 §1.4). The refactored `Reserve.sol` enforces this on-chain.

### 5.2 Redemption Terms (v20 §8.3)

- **Redemption is NEVER paused** — not during minting pause, not during emergency, not under any condition
- 1 kg gold minimum (physical redemption)
- 10-minute soft finality, 7-day hard finality
- Fee: 0.05% (5 bps), capped at $5,000
- Article X sequential liquidation order enforced

### 5.3 Redemption Stress Priority (v20 §8.4)

1. Preserve settlement liquidity (LCR ≥ 1.0)
2. Preserve constitutional reserve floor (RR ≥ 100%)
3. Preserve custodian integrity
4. Delay nonessential rebalancing
5. Never liquidate illiquid assets for routine rebalance

### 5.4 LCR and LRR (v20 §8.1, §8.2)

```
LCR = HQLA / 30-day net outflows
Hard floor: LCR ≥ 1.0
Strong: LCR ≥ 1.2
Policy target: LCR ≥ 1.25
HQLA = cash + sovereign×0.98 + stablecoin×0.98 (post-haircut, per §6)

LRR = Immediately Available Liquidity / Expected 30-Day Redemption Demand
Strong: ≥ 1.2 | Compliant: ≥ 1.0 | Marginal: ≥ 0.9 | Critical: < 0.9
Excludes gold and silver by design (Bullion Protection Rule)
```

**Implementation note:** The live LCR HQLA formula currently uses a 60% proxy (`HQLA = totalReserve × 0.60`). The textbook formula (above) gives LCR = 8.31 vs code's 6.31 — the published LCR is ~24% understated. Both pass LCR ≥ 1.0. This is a P2 fix (see `final-mainnet-readiness-certification.md`).

---

## 6. Emergency Mode (v20 §12.3) — 11 Objective Triggers

Emergency governance is **non-discretionary**. The operator cannot declare an emergency. Any of the following objective triggers automatically activates the corresponding emergency level.

### 6.1 Four Emergency Levels

| Level | Expiry |
|---|---|
| Normal | No expiry |
| Heightened Watch | 30 days |
| Emergency | 7 days |
| Constitutional Emergency | 24 hours |

### 6.2 Eleven Objective Triggers

| # | Trigger | Level | v20 Ref |
|---:|---|---|---|
| 1 | RR < 100% | Constitutional Emergency | §13.1, §12.3 |
| 2 | Concentration > 60% (per-currency) | Emergency | §6.6, §7.2 |
| 3 | SDP > 5% (7-day currency move) | Emergency | §6.9, §33 |
| 4 | Sovereign default | Emergency | §33 |
| 5 | LCR < 1.0 | Emergency | §8.1 |
| 6 | LRR < 0.9 | Emergency | §8.2 |
| 7 | Stablecoin depeg > 10% | Emergency | §7.2, §12.3 |
| 8 | Custodian failure | Emergency | §10, §12.3 |
| 9 | Oracle failure | Heightened Watch → Emergency | §11, §12.3 |
| 10 | Market closure | Heightened Watch | §12.3 |
| 11 | §44 Council declaration (unanimous 7/7) | Any level | §12.1, §12.3 |

### 6.3 Emergency Powers

- **Auto-pause minting** (RR < 100%)
- **Auto-suspend affected currency** (SDP trigger)
- **Auto-trigger rebalance T3** (critical trigger)
- **Constitutional Council flag required** for T3 execution
- **Redemption NEVER paused** (constitutional invariant, v20 §8.3)

---

## 7. Custody Framework (v20 §10)

### 7.1 Custody Model

- Operating entity ≠ Reserve assets (segregation)
- 4-tier custodian hierarchy:
  - Tier 1: Official-Sector (central banks where legally eligible)
  - Tier 2: Regulated Institutional Custodians
  - Tier 3: Specialized Precious-Metals Vaults
  - Tier 4: Contingency
- 25% per-custodian cap, 30% per-jurisdiction cap, ≥3 custodians
- Allocated physical bullion (LBMA Good Delivery, ≥99.5% gold, ≥99.9% silver)
- **No commingling, no rehypothecation** (constitutional)

### 7.2 Reconciliation (v20 §10.2)

- 4-tier severity: 0.1% (informational), 0.5% (warning), 1% (execution pause), 5% (emergency)
- 5 actions: none, flag, pause_execution, initiate_investigation, notify_governance
- Variance persists across restarts (must be stored durably)

### 7.3 Seven-State Reserve Accounting (v20 §9)

| # | State | Source | Must NOT masquerade as |
|---|---|---|---|
| 1 | TARGET | Engine (computeDynamicReserveAllocation) | Actual custody |
| 2 | ACTUAL | Committed ledger / baseline (SIMULATION) | Custodian-confirmed |
| 3 | PROPOSED | RebalanceProposal lifecycle | Approved |
| 4 | APPROVED | Governance vote (severity-routed) | Executed |
| 5 | EXECUTED | ExecutionResult (custodian settlement) | Custodian-confirmed |
| 6 | CUSTODIAN-CONFIRMED | Independent custodian attestation | Reconciled |
| 7 | RECONCILED | Variance-resolution (executed vs custodian) | Target |

**Custodian-confirmed starts EMPTY.** `custodianVariance` is non-zero by default. No state is initialized from the same array. Each has a distinct `dataSourceId`.

---

## 8. Determinism & Audit Trail

### 8.1 Determinism (v20 §14)

- No `Date.now()` in decision mathematics
- No `Math.random()` in monetary calculations
- All decision functions are pure (same inputs → same outputs)
- `decimal.js` fixed-point arithmetic
- `asOfTimestamp` passed as parameter (not read from system clock)
- Proposal IDs may use `Date.now()` (non-deterministic label, not decision input)

### 8.2 Audit Trail (v20 §15)

- Every reserve-state transition creates an immutable event
- JSONL append-only ledger (`logs/rebalance-audit.jsonl`)
- Synchronous write (`appendFileSync` — intentional for integrity)
- Fields: event ID, proposal ID, previous state hash, new state hash, actor, role, timestamp, reason, policy version, blueprint version, oracle evidence, custody evidence, approval evidence, execution evidence, reconciliation evidence
- **Must survive application restart** (durable file, not in-memory)

**Implementation note:** Audit ledger file is durable. However, in-memory state (proposals, executions, turnover, hysteresis) is NOT replayed from the audit ledger on restart — this is a P1 gap.

---

## 9. Cross-Reference

| Topic | Document |
|---|---|
| v20 Canonical Blueprint (source of truth) | `docs/architecture/mithqal-canonical-v20.md` |
| Full forensic audit (3 generations) | `docs/verification/full-blueprint-engineering-audit.md` |
| Mathematical validation | `docs/verification/mathematical-reserve-validation.md` |
| Regulatory architecture | `docs/verification/global-regulatory-architecture.md` |
| Final mainnet readiness | `docs/verification/final-mainnet-readiness-certification.md` |
| Custody framework v2 | `docs/blueprint/custody-framework-v2.md` |
| Rebalancing policy | `docs/architecture/rebalancing-policy.md` |
| Custodian eligibility matrix | `docs/architecture/custodian-eligibility-matrix.md` |
| Geographic custody strategy | `docs/architecture/geographic-custody-strategy.md` |

---

**This policy is complete and authoritative. It defers to the v20 Canonical Blueprint on every rule.**
