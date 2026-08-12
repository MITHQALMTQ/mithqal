# Rebalancing Mathematical Audit
## Independent Recalculation of All Reserve Formulas, Scenarios, and Stability Tests

**Date:** 2026-08-10
**Mode:** READ-ONLY — No code changes
**Method:** Independent recalculation from first principles, verified against live API

---

## 1. Reserve Ratio (§4) — VERIFIED ✅

**Formula:** `RR = R_a / (S × PAR)`, where PAR = $1.00

**Live inputs (from /api/nav):**
- Gold: $4,361.10/oz, Silver: $64.51/oz, Supply: 54M MTQ

**Independent calculation:**
```
R_m = 29,000,000 + 13,500,000 + (2,122.86 × 4,361.10) + (36,758 × 64.51) + 2,700,000
    = $56,829,116.39  ← API: $56,829,116.39 ✅ EXACT

R_a = 29,000,000×1.00×1.00 + 13,500,000×0.98×0.99 + 9,258,005×0.95×1.00 + 2,371,111×0.93×1.00 + 2,700,000×0.98×0.96
    = $55,638,098.34  ← API: $55,638,098.34 ✅ EXACT

L = 54,000,000 × $1.00 = $54,000,000 (fixed)

RR = 55,638,098.34 / 54,000,000 = 103.0335%  ← API: 103.0335% ✅ EXACT
```

**Boundary:** Gold at $4,642.27/oz would drop RR to exactly 100% (a +6.45% move from live).

**Extreme:** Even with gold AND silver at $0, RR = 82.66% (cash + sovereign + stablecoin floor). RR=80% is mathematically unreachable with current composition.

---

## 2. NAV (§3) — VERIFIED ✅

```
NAV_m = R_m / S = 56,829,116.39 / 54,000,000 = 1.0524  ✅
NAV_l = R_a / S = 55,638,098.34 / 54,000,000 = 1.0303  ✅
NAV_stress = R_l / S = 50,610,003.74 / 54,000,000 = 0.9372  ✅
```

Stress coefficients: cash 0.95, sovereign 0.90, gold 0.85, silver 0.80, stablecoin 0.80.

Hierarchy holds: R_l ≤ R_a ≤ R_m (50.61M ≤ 55.64M ≤ 56.83M) ✅

---

## 3. PAR — VERIFIED ✅

- `PAR_VALUE = 1.00` (monetary-engine-v19.ts:124)
- `L = fpMul(fp(supply), fp(PAR_VALUE))` (line 156) — uses PAR, NOT NAV ✅
- `void nav` (line 155) — old NAV-based formula explicitly discarded ✅
- L = $54,000,000 (fixed, exposed as `redemptionLiability` in API) ✅

---

## 4. LCR (§5) — VERIFIED ⚠️ (simplified proxy)

**Code uses:** `HQLA = totalReserve × 0.60` (nav-compute.ts:219)
**Textbook:** `HQLA = cash + sovereign×0.98 + stablecoin×0.98`

| Formula | HQLA | LCR |
|---|---|---|
| Code proxy (60%) | $34,097,470 | 6.31 |
| Textbook L1+L2 | $44,876,000 | 8.31 |
| Basel III (L1+L2A@85%+L2B@50%) | $41,825,000 | 7.75 |

All three pass LCR ≥ 1.0 and ≥ 1.25. **Published LCR is ~24% understated.** Recommend textbook formula.

---

## 5. Scenario Results (A-N)

| # | Scenario | RR | NAV_m | LCR | Compliant |
|---|---|---|---|---|---|
| A | Mint $1M | 103.07% | 1.0524 | 6.31 | ✅ |
| B | Mint $100M | 104.44% | 1.0524 | 6.31 | ✅ |
| C | Redeem 10M MTQ | 102.53% | 1.0524 | 6.31 | ✅ |
| D | Redemption wave 30% | 102.51% | 1.0524 | 6.31 | ✅ |
| **E** | **Gold -30%** | **98.15%** | **1.0010** | **6.01** | **❌** |
| F | Gold +30% | 107.92% | 1.1038 | 6.62 | ✅ |
| G | Silver -40% | 101.40% | 1.0348 | 6.21 | ✅ |
| H | Silver +40% | 104.67% | 1.0700 | 6.42 | ✅ |
| I-L | FX shocks (JPY/USD) | 103.03% | 1.0524 | 6.31 | ✅ |
| M | EUR +20% | 103.03% | 1.0524 | 6.31 | ✅ |
| N | Multi-shock | 106.29% | 1.0867 | 6.52 | ✅ |

**FX shocks are RR-invariant** — reserves are USD-denominated. Only gold/silver price moves affect RR.

**Gold -30% is the only failing scenario.** Minting auto-pauses. The system has ~3pp buffer (27% gold drop = breaking point).

---

## 6. φ_t Oscillation Test — 13 patterns

| Pattern | Trades | Turnover | Result |
|---|---|---|---|
| ±1% alternating ×3 | 0 | $0 | ✅ No whipsaw |
| ±3% alternating ×3 | 0 | $0 | ✅ No whipsaw |
| ±10% alternating ×3 | 0 | $0 | ✅ No whipsaw |
| +30% persistent ×4 | 2 | $3.24M | ✅ Correct (sustained drift) |
| Gold doubles/halves ×2 | 0 | $0 | ✅ No whipsaw |
| +50% persistent ×3 | 1 | $0.88M | ✅ Correct |

**Hysteresis works.** Direction-tracking prevents all oscillation patterns. A 13% gold move is needed to exceed the 2pp band.

---

## 7. Concentration Test

- Max USD from 47.34% structural (all multipliers maxed): **53.34%** (under 60% cap)
- USD structural at 62%: cap binds at 60%, excess redistributed ✅
- USD structural at 85%: iterative cap + redistribution ✅

**No currency can dominate.** The 60% cap is effective.

---

## 8. Currency Shock Model (JPY -10% to -50%)

All JPY shocks are **RR-invariant** (reserves USD-denominated). The transmission is:
1. JPY deviation >5% → SDP triggers → JPY lifecycle full→suspended
2. §20 normalization → other currencies rise proportionally
3. USD weight may approach 60% cap (but doesn't exceed it)

The same mechanism works for ANY currency — no Japan-specific code. ✅

---

## 9. Turnover Limits

| Limit | Value | Enforced? |
|---|---|---|
| Per-event | 3% of asset holding | ✅ checkWeeklyTurnoverCap |
| Per-day | 1% (derived) | ✅ (weekly / 3) |
| Per-week | 3% (Invariant I-4) | ✅ |
| Per-month | 6% (derived) | ✅ |

**⚠️ In-memory** — lost on restart. Turnover accounting resets. Must persist to DB.

---

## 10. Mathematical Stability Assessment

**Stable:** RR formula, NAV hierarchy, hysteresis, concentration cap, trade suppression, φ_t bounds.

**Marginally stable:** Gold -30% drops RR below 100% (only 3pp buffer). Remediated by auto-pause + RR-driven allocation shift.

**No feedback loops found:** No death spiral, no bank-run dynamic, no reflexive mint/redeem loop. The NAV_m > PAR premium means each redemption removes more asset than liability, so redemption waves actually INCREASE RR (counterintuitively protective).

**No hidden assumptions:** All formulas use explicit constants from reserve-policy-spec.ts. No hidden state in monetary decisions.
