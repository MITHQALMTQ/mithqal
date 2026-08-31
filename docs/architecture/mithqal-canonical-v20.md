# MITHQAL — CANONICAL BLUEPRINT v20
## Final Consolidated Edition

**Version:** 20.0
**Date:** 2026-08-11
**Status:** CANONICAL — supersedes all prior versions (v18, v19, v19.0.3, and all addenda)
**Authority:** COO/CTO/CFO/PM + Monetary Systems Architect + Institutional Reserve Manager

---

## 0. SUPREMACY CLAUSE

This document is the **single authoritative blueprint** for MITHQAL. It reconciles:
- The original v18 blueprint (26,611 lines, 49 articles)
- The v19 implementation addendum (502 lines, 22 modifications)
- The constitutional change-log (7 new articles)
- The custody framework v2 (4-tier custodian hierarchy)
- 39 post-blueprint engineering rules (Phases 1-5)

**Where any prior document conflicts with this blueprint, this blueprint wins.**

**Optimization priority (inviolable):**
```
RESILIENCE > LIQUIDITY > CAPITAL PRESERVATION > STABILITY > EFFICIENCY > RETURN
```

---

## 1. CONFLICT RESOLUTIONS (6 Reconciliations)

### 1.1 Platinum — RESOLVED: NO PLATINUM
**Conflict:** v19 modification M-3 mentioned "Gold 75% / Silver 15% / Platinum 10%."
**Resolution:** **No platinum.** The canonical reserve architecture uses **dynamic φ_t gold/silver only** within the bullion tier. Platinum is not a reserve asset. The operator confirmed this on 2026-08-11.

### 1.2 Currency Concentration Cap — RESOLVED: 60%
**Conflict:** v18/v19 text says "50%"; engineering layer uses 60%.
**Resolution:** **60% per-currency cap** is the canonical rule. Rationale: USD's structural weight is ~47% (COFER 50% + SWIFT 40% + BIS 10%). A 50% cap would bind during normal operations, forcing constant redistribution. The 60% cap allows natural structural weight + bounded momentum (±5%) without binding in normal markets, while still preventing domination. The 50% figure in v18/v19 is classified as a **policy observation** (not a constitutional cap).

### 1.3 Reserve Tiers — RESOLVED: 4-TIER CONSTITUTIONAL
**Conflict:** On-chain Reserve.sol had 3 tiers; constitution specifies 4.
**Resolution:** **4-tier constitutional model** is canonical:
| Tier | Asset Class | Constitutional Range | Policy Target |
|---|---|---|---|
| 1 | Central-Bank-Quality Cash | 25-60% | 40% |
| 2 | Short-Duration Sovereign Securities | 20-50% | 35% |
| 3 | Allocated Physical Bullion (Gold + Silver) | 10-30% | 20% |
| 4 | Operational Liquidity (Stablecoins) | 0-10% | 5% |

The 3-category operational view (fiat 70-80%, bullion 15-25%, stablecoin 2-8%) is the **dynamic allocation engine's** representation, which maps onto the 4 constitutional tiers.

### 1.4 Liquidation Order — RESOLVED: ARTICLE X SEQUENTIAL
**Conflict:** Legacy Reserve.sol used pro-rata; engineering layer uses sequential.
**Resolution:** **Article X sequential liquidation** is canonical:
1. Tier 4 (stablecoins) — fastest to convert
2. Tier 1 (cash) — HQLA Level 1, 0% haircut
3. Tier 2 (sovereign) — HQLA Level 2A, T+1
4. Tier 3 Silver — Strategic Liquidity, days-weeks
5. Tier 3 Gold — LAST, requires Exhaustion Certificate (Invariant 5)

Pro-rata liquidation is **prohibited**. The refactored Reserve.sol enforces this on-chain.

### 1.5 Reserve Ratio — RESOLVED: 100% FLOOR / 102% TARGET
**Conflict:** v18 Invariant 1 was tautological (NAV-based); v19 corrected to PAR-based.
**Resolution:** **PAR-based formula** is canonical:
```
RR = R_a / (S × PAR), where PAR = $1.00 (face value)
L = S × PAR (fixed liability, does NOT move with market value)

Constitutional floor: RR ≥ 100% (hard invariant, auto-pauses minting)
Policy target: RR ≥ 102% (over-collateralization buffer)
```

### 1.6 Article Count — RESOLVED: 56 ARTICLES
**Conflict:** v18 summary claimed 42; actual headers = 49; v19 added 7 = 56.
**Resolution:** **56 articles** across 5 layers is the canonical count:
- Layer 1 (Institutional): 17 articles
- Layer 2 (Monetary): 16 articles (9 original + 7 v19 additions)
- Layer 3 (Policy): 8 articles
- Layer 4 (Technical): 8 articles
- Layer 5 (Operations): 7 articles

---

## 2. CONSTITUTIONAL IDENTITY

MITHQAL is a **Constitutional Settlement Institution** — a neutral, 100%+ reserved, gold-disciplined, Sharia-compliant settlement infrastructure for international trade.

**What it is NOT:** Not a bank, not a lending platform, not a payment processor, not a marketplace, not a DeFi protocol, not a speculative asset, not a DAO.

**Anti-Platform Clause (permanent, non-amendable):** The Institution shall not engage in lending, exchange operations, brokerage, asset management, derivatives, DeFi, or any commercial platform services. This is permanently frozen.

**No Governance Tokens:** Governance rights vested in the Monetary Council, not token holders.

**Founder Holdings Cap:** ≤20% of circulating supply (permanent, non-amendable).

---

## 3. MONETARY ARCHITECTURE

### 3.1 Single MTQ Token
One MTQ. One supply. One NAV. One liquidity pool. ERC-20, 18 decimals.

### 3.2 PAR (Face Value)
```
PAR = $1.00
```
The constitutional face value of one MTQ. The liability is `L = S × PAR` (fixed). This is the redemption anchor.

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

---

## 4. RESERVE ARCHITECTURE

### 4.1 Four-Tier Model
(See §1.3 for the canonical tier structure and ranges.)

### 4.2 Dynamic Allocation (§23-27)
The engine computes target weights dynamically:
1. Start with policy targets (fiat 75%, bullion 20%, stablecoin 5%)
2. **RR adjustment:** RR>110% → +2% bullion / -2% fiat; RR<102% → +2% fiat / -2% bullion
3. **Volatility adjustment:** Gold EWMA vol drives φ_t (see §5)
4. Clamp to constitutional ranges
5. Normalize to Σ = 100%

### 4.3 Fixed Physical Quantities (Testnet Baseline)
The following are **simulation/testnet baseline values** (NOT mainnet production values):
- Cash: $29,000,000
- Sovereign: $13,500,000
- Gold: 2,122.86 oz
- Silver: 36,758 oz
- Stablecoin: $2,700,000
- Supply: 54,000,000 MTQ

**Mainnet must derive actual holdings from custodian attestations → reconciliation → reserve state → NAV → monetary engine.**

---

## 5. GOLD / SILVER φ_t

### 5.1 Definition
```
φ_t = gold's share of bullion (Tier 3) at time t
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
| Emergency band | <60% or >95% (constitutionally impossible) |
| Default target | 80% |

### 5.3 Dynamic Target
- Gold EWMA vol > 3% → φ_t = 75% (reduce gold when volatile)
- Gold EWMA vol < 0.5% → φ_t = 85% (increase gold when stable)
- Otherwise → φ_t = 80%

### 5.4 Hysteresis (§22B — INCORPORATED)
- 2pp band: |proposed φ_t − current φ_t| ≤ 2pp → no action
- 2-cycle confirmation: >2pp drift must persist for 2 consecutive evaluation cycles
- **Direction-tracking:** if drift direction reverses, confirmation counter resets (anti-whipsaw)

### 5.5 Silver Independence
Silver does NOT automatically mirror gold. Each metal is independently evaluated. Silver has:
- Higher volatility (independent stress modeling)
- Lower liquidity (thinner market)
- Higher transaction costs (20 bps vs gold 10 bps)
- Lower absolute trade limit ($10M vs gold $25M)

---

## 6. CURRENCY ENGINE

### 6.1 Structural Weighting (§13)
```
C_i = 0.50 × COFER_i + 0.40 × SWIFT_i + 0.10 × BIS_i
```
- α (COFER) = 50% — IMF reserve importance
- β (SWIFT) = 40% — international settlement usage
- γ (BIS) = 10% — FX liquidity

### 6.2 Currency Basket
8 sovereign currencies: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD
Plus XAU (gold oz) and XAG (silver oz) for minting = 10 mint/redeem currencies.

**The Constitution names no specific currencies.** The 8-currency list is a policy/implementation decision.

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

### 6.6 Concentration Limits (§22A + §10)
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

### 6.7 Hysteresis (§22B — INCORPORATED)
- 2% band: |proposed weight − current weight| ≤ 2% → no action
- 2-cycle confirmation required before applying >2% change
- Direction-tracking: reversal resets counter

### 6.8 Currency Lifecycle (§12)
```
Observation → Probation (≥2 quarters) → Full (Council approval) → Suspended (SDP/sanctions)
```
Symmetric for all eligible currencies. No country-specific rules.

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

---

## 7. REBALANCING ENGINE (§29 — FULLY INCORPORATED)

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
6. `concentration_cap` (>60%, critical)
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

### 7.4 Trade Suppression (§6 — INCORPORATED)
```
If expected_benefit ≤ transaction_cost + slippage + market_impact + risk_buffer:
    SUPPRESS (unless objective emergency)
```
Risk buffer = 2 bps. Emergency overrides: SDP, §44 Constitutional Emergency, concentration_cap, RR<100%, minimum_floor.

### 7.5 Scale-Aware Trade Limits (INCORPORATED)
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

### 7.6 Fee Model (§29.5)
| Asset Class | Execution (bps) | Slippage (bps) | Spread (bps) | Total (VWAP) |
|---|---|---|---|---|
| Cash | 0 | 0 | 0 | 0 |
| Sovereign | 2 | 1 | 1 | 4 |
| Gold | 5 | 3 | 2 | 10 |
| Silver | 7 | 8 | 5 | 20 |
| Stablecoin | 3 | 2 | 1 | 6 |
| Fiat FX | 4 | 2 | 1 | 7 |

Method multipliers (execution+slippage only, NOT spread): VWAP 1.0, TWAP 1.2 (default), RFQ 0.8, Negotiated block 1.5, Algorithmic 1.1.

### 7.7 Cross-Asset Rebalancing
Value conservation: every sell paired with equal-notional buy (`pairId` for audit trail). Bullion split per φ_t; fiat split per §24 (2/3 cash + 1/3 sovereign).

### 7.8 Approval Routing (§29.2)
| Severity | Threshold |
|---|---|
| Low | 2 of 5 roles |
| Medium | 3 of 5 |
| High | 4 of 5 |
| Critical | 5 of 5 (unanimous) + Constitutional Council flag |

5 roles: Treasury, Risk, Constitutional, Operations, Independent Oversight.

**SIMULATION mode auto-approves (testnet only).** Production requires `EXECUTION_MODE=SHADOW` or `LIVE`. Production gate refuses SIMULATION when `NODE_ENV=production`.

### 7.9 Proposal Binding (§14 — INCORPORATED)
- Every proposal has a cryptographic hash binding to: asset, quantity, side, price, custodian, destination, source, timestamp, validity window, execution limits, reserve-state version
- Changing any parameter → different hash → approval invalidated
- `validUntil` field: proposals expire (default 7 days)
- Replay protection: same hash can only execute once

---

## 8. LIQUIDITY & REDEMPTION

### 8.1 LCR (§5)
```
LCR = HQLA / 30-day net outflows
Hard floor: LCR ≥ 1.0
Strong: LCR ≥ 1.2
Policy target: LCR ≥ 1.25
```
HQLA = cash + sovereign×0.98 + stablecoin×0.98 (post-haircut, per §6).

### 8.2 LRR (Article XIII)
```
LRR = Immediately Available Liquidity / Expected 30-Day Redemption Demand
Strong: ≥ 1.2 | Compliant: ≥ 1.0 | Marginal: ≥ 0.9 | Critical: < 0.9
```
Excludes gold and silver by design (Bullion Protection Rule).

### 8.3 Redemption (§34 — NEVER PAUSED)
- Redemption is **never paused** — not during minting pause, not during emergency, not under any condition
- 1 kg gold minimum (physical redemption)
- 10-minute soft finality, 7-day hard finality
- Fee: 0.05% (5 bps), capped at $5,000
- Article X sequential liquidation order enforced

### 8.4 Redemption Stress Priority
1. Preserve settlement liquidity (LCR ≥ 1.0)
2. Preserve constitutional reserve floor (RR ≥ 100%)
3. Preserve custodian integrity
4. Delay nonessential rebalancing
5. Never liquidate illiquid assets for routine rebalance

---

## 9. SEVEN-STATE RESERVE ACCOUNTING (INCORPORATED)

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

## 10. CUSTODY & RECONCILIATION

### 10.1 Custody Model
- Operating entity ≠ Reserve assets
- 4-tier custodian hierarchy (official-sector, institutional, specialized vaults, contingency)
- 25% per-custodian cap, 30% per-jurisdiction cap, ≥3 custodians
- Allocated physical bullion (LBMA Good Delivery, ≥99.5% gold, ≥99.9% silver)
- No commingling, no rehypothecation

### 10.2 Reconciliation
- 4-tier severity: 0.1% (informational), 0.5% (warning), 1% (execution pause), 5% (emergency)
- 5 actions: none, flag, pause_execution, initiate_investigation, notify_governance
- Variance persists across restarts (must be stored durably)

---

## 11. ORACLE ARCHITECTURE

### 11.1 Target Architecture (Mainnet)
8 independent oracle families → medianization → 2% outlier exclusion → ≥5/8 quorum → weighted median → ±5% constitutional validation → 48-hour TWAP fallback.

### 11.2 Testnet (Current)
Single-source free API (gold-api.com) with silent fallback. **NOT mainnet-safe.**

### 11.3 Freshness
- Off-chain: 60 seconds (`ORACLE_FRESHNESS_MS`)
- On-chain: 1 hour (`MAX_STALENESS`)
- All oracle read paths enforce staleness (no bypass aliases)

---

## 12. GOVERNANCE

### 12.1 Monetary Council
- 7 members (independent professionals, 4-year staggered terms)
- Supermajority: 6/7 (85.7%) for constitutional amendments
- Standard: 4/7 for policy

### 12.2 Amendment Workflow (§43)
11 stages: Proposal → Technical Review → Reading 1 → Public Comment → Reading 2 → Committee Review → Vote → Supermajority Confirmation → Timelock Start → Timelock End → Enactment. Timelock: 90 days (constitutional), 7 days (policy).

### 12.3 Emergency Governance (§44)
| Level | Expiry |
|---|---|
| Normal | No expiry |
| Heightened Watch | 30 days |
| Emergency | 7 days |
| Constitutional Emergency | 24 hours |

11 objective triggers (RR<100%, concentration>60%, SDP>5%, sovereign default, LCR<1.0, LRR<0.9, stablecoin depeg>10%, custodian failure, oracle failure, market closure, §44 Council declaration). **Non-discretionary** — operator cannot declare emergency.

---

## 13. CONSTITUTIONAL INVARIANTS

### 13.1 Five Absolute Invariants
1. **100% Reserve Ratio:** `R_a ≥ S × PAR` at all times (policy ≥102%)
2. **No Discretionary Minting:** Minting only upon verified deposit
3. **No Lending of Reserves:** No leverage, no fractional reserve, no rehypothecation
4. **No Commingling:** Yield Program assets never mix with settlement reserves
5. **Bullion Preservation:** Gold liquidated LAST, requires Exhaustion Certificate

### 13.2 On-Chain Invariants (§45)
10 on-chain checkable invariants via `checkInvariant(uint8)` on Governance.sol. 15 forbidden function selectors (6 platform + 9 invariant). Anti-platform clause permanently frozen in constructor.

---

## 14. DETERMINISM (§29.12)

- No `Date.now()` in decision mathematics
- No `Math.random()` in monetary calculations
- All decision functions are pure (same inputs → same outputs)
- `decimal.js` fixed-point arithmetic
- `asOfTimestamp` passed as parameter (not read from system clock)
- Proposal IDs may use `Date.now()` (non-deterministic label, not decision input)

---

## 15. AUDIT TRAIL (§29.10)

- Every reserve-state transition creates an immutable event
- JSONL append-only ledger (`logs/rebalance-audit.jsonl`)
- Synchronous write (`appendFileSync` — intentional for integrity)
- Fields: event ID, proposal ID, previous state hash, new state hash, actor, role, timestamp, reason, policy version, blueprint version, oracle evidence, custody evidence, approval evidence, execution evidence, reconciliation evidence
- **Must survive application restart** (durable file, not in-memory)

---

## 16. SMART CONTRACT REQUIREMENTS

### 16.1 Reserve.sol (4-Tier + Article X)
- 4 constitutional tiers (cash, sovereign, gold, silver, stablecoin)
- Sequential liquidation (Article X)
- Gold liquidation requires Exhaustion Certificate
- §22A basket verification on-chain
- §37 attestReserves (±10% drift + 1hr rate limit)
- §14 proposal hash binding + replay protection

### 16.2 Mint.sol
- Must use 4-tier model matching Reserve.sol
- Mint fee: 5 bps (0.05%), capped at $5,000
- Must verify `!mtq.mintingPaused()` (RR ≥ 100%)
- Must verify basket verification passed

### 16.3 Redeem.sol
- **Never pausable** (no pause function, no notPaused modifier)
- Anyone holding MTQ can redeem
- Fee: 5 bps, capped at $5,000

### 16.4 MTQ.sol
- `mint()`: checks `!mintingPaused`, 1:1 deposit requirement, auto-pause if RR<100%
- `burn()`: never paused (§45.2)
- `attestReserves()`: ±10% drift + 1hr rate limit

### 16.5 Governance.sol
- 7-member Council, 6/7 supermajority for constitutional
- 15 forbidden selectors (defense-in-depth at create + execute)
- `checkInvariant(uint8)` for 10 on-chain invariants
- Founder cap 20% (MUST be enforced — currently TODO)

### 16.6 Oracle.sol
- All read paths enforce staleness (no bypass aliases)
- Mainnet: multi-source consensus (≥5/8 quorum)

---

## 17. EXECUTION MODES

| Mode | Execution | Approval | Use |
|---|---|---|---|
| SIMULATION | Simulated | Auto-approve all 5 roles | Testnet (default) |
| SHADOW | No execution | Manual (severity-routed) | Institutional observation |
| LIVE | Real execution | Manual (severity-routed) | Production |

**Production gate:** `NODE_ENV=production` + `EXECUTION_MODE=SIMULATION` → refuses to run (returns SHADOW). Prevents accidental auto-approval in production.

---

## 18. USER FEES

| Fee | Rate | Cap |
|---|---|---|
| Minting | 0.05% (5 bps) | $5,000 |
| Redemption | 0.05% (5 bps) | $5,000 |
| Transfer | 0.01% (1 bp) | $1,000 |
| Custody | 0.10% p.a. | None |

---

## 19. SUPPORTED CURRENCIES

10 mint/redeem currencies: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD, XAU (gold oz), XAG (silver oz).

**No country-specific rules.** The same engine handles any eligible currency identically.

---

## 20. FINALITY

- Soft finality: 10 minutes
- Hard finality: 7 days
- Minimum physical gold redemption: 1 kg

---

## APPENDIX A: DOCUMENTS SUPERSEDED

This blueprint supersedes:
- `docs/blueprint/v18-blueprint-complete.md` (v18 original)
- `docs/blueprint/v19-implementation-addendum.md` (v19 addendum)
- `docs/blueprint/constitutional-change-log.md`
- `docs/blueprint/custody-framework-v2.md`
- `docs/blueprint/executive-summary.md`
- `docs/blueprint/one-pager.md`
- `docs/architecture/institutional-reserve-stability.md` (Phase 2 design)
- `docs/architecture/rebalancing-policy.md` (Phase 3 policy)

These documents remain as **historical references** but are NOT authoritative. Where they conflict with this blueprint, this blueprint wins.

---

## APPENDIX B: CENTRALIZED SPECIFICATION

The machine-readable specification is at `src/lib/reserve-policy-spec.ts`. All constants in this blueprint are mirrored in that file. The spec is the single source of truth for code; this blueprint is the single source of truth for the spec.

---

**This blueprint is complete. It is the single authoritative document for MITHQAL.**
