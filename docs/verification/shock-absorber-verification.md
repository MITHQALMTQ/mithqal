# Shock Absorber Verification Report

**Report Date:** 2026-08-09
**Author:** Monetary-System Risk Architect / Smart-Contract Architect / Financial Stability Analyst (acting in concert)
**Authority:** §11 of the reserve dynamicity implementation specification; MITHQAL Constitution Article V §5, Article VI Component 5 (§17.4)
**Status:** COMPLETE — shock absorber implementation verified, Lyapunov certification gap documented

---

## Executive Summary

The §17.4 shock absorber is **fully implemented** in `src/lib/monetary-engine-v19.ts:412-443` as a piecewise-linear volatility attenuation factor A_t ∈ [0.5, 1.0]. It is applied to the combined (M_i × R_i − 1) term per §17.7. The implementation includes a documented math audit fix (Task 6-c, 2026-08-25) that corrected a polarity error in the original formula.

**One gap identified:** the blueprint's Mathematical Verification Principle (Lyapunov stability, monotone convergence, BIBO behaviour) is **NOT formally proven** in the codebase. This is a documented gap (G2) requiring mathematician review.

---

## §17.4 Implementation

### The Function

```typescript
// monetary-engine-v19.ts:412-443
export function shockAbsorberFactor(volatility: number): number {
  // §17.4 LINEAR interpolation from (V_NORMAL, 1.0) to (V_HIGH, 0.5)
  if (volatility <= V_NORMAL) return 1.0;   // σ ≤ 2% → no dampening
  if (volatility >= V_HIGH) return 0.5;     // σ ≥ 5% → max dampening (halved)
  return 1.0 - 0.5 * (volatility - V_NORMAL) / (V_HIGH - V_NORMAL);
}
```

### Constants

| Constant | Value | Meaning |
|---|---|---|
| V_NORMAL | 0.02 (2%) | Below this → no dampening (A_t = 1.0) |
| V_HIGH | 0.05 (5%) | Above this → max dampening (A_t = 0.5) |
| EWMA_LAMBDA | 0.94 | RiskMetrics EWMA decay factor |

### Application (§17.7)

```typescript
// monetary-engine-v19.ts:453-463
export function shockAdjustedFactor(momentum: number, meanReversion: number, shockAbsorber: number): number {
  return 1 + shockAbsorber * (momentum * meanReversion - 1);
}
```

**K_i = 1 + A_t × (M_i × R_i − 1)**

At normal volatility (A_t = 1.0): K_i = 1 + (M_i × R_i − 1) = M_i × R_i (full momentum + mean reversion).
At high volatility (A_t = 0.5): K_i = 1 + 0.5 × (M_i × R_i − 1) (momentum effect halved).

---

## Documented Math Audit Fix (Task 6-c, 2026-08-25)

The code includes a correction documented at lines 422-436:

| Version | Formula | Mapping | Status |
|---|---|---|---|
| **Old (buggy)** | `A_t = 1 − (v−V_NORMAL)/(V_HIGH−V_NORMAL)` | [0.02, 0.05] → [1.0, 0.0] | ❌ Would zero out all momentum at high vol |
| **New (corrected)** | `A_t = 1 − 0.5×(v−V_NORMAL)/(V_HIGH−V_NORMAL)` | [0.02, 0.05] → [1.0, 0.5] | ✅ Halves momentum at high vol |

The fix is correct and verified by `stability-tests.ts:90`:
```typescript
check("A_t = 0.5 at high volatility", highVolState.shockAbsorber === 0.5)
```

---

## §11 Verification (Per Spec)

| Spec Requirement | Status | Evidence |
|---|---|---|
| Prevents excessive damping | ✅ | A_t ≥ 0.5 (never zeroes momentum) |
| Prevents excessive weighting suppression | ✅ | K_i = 1 + 0.5×(M×R−1) at max — weights still move |
| Prevents artificial reserve inertia | ✅ | A_t = 1.0 at normal vol — no dampening when not needed |
| Prevents delayed response to genuine systemic deterioration | ✅ | SDP bypasses shock absorber for >5% deviations |
| Prevents overreaction | ✅ | Momentum clamped ±5%; shock absorber halves it |
| Prevents momentum chasing | ✅ | Mean reversion R_i counteracts momentum |
| Prevents rapid oscillation | ⚠️ | Partial — no explicit hysteresis (see currency-rebalancing-report.md) |
| Prevents unnecessary transaction costs | ✅ | Rebalance only triggers when urgency ≥ 70 |
| Prevents unstable reserve turnover | ✅ | Same |
| Distinguishes noise from structural change | ⚠️ | Partial — EWMA smooths noise; no explicit classifier |

---

## Critical Gap: Lyapunov Certification (G2)

### Blueprint Requirement (Article V §5, lines 5719-5734)

The blueprint mandates that every shock absorber be:
1. Expressed as a closed-form function ✅ (done)
2. Evaluated against **Lyapunov stability** ❌ (not done)
3. Evaluated against **bounded-input bounded-output (BIBO) behaviour** ❌ (not done)
4. Evaluated against **monotone convergence** ❌ (not done)
5. Validated via 100,000-path Monte Carlo ✅ (done in `constitutional-stress-engine.ts`)
6. Validated via 20-year historical replay ⚠️ (only 2008/2020/2022 episodes)
7. Validated via ±20% sensitivity analysis ✅ (done in `constitutional-stress-engine.ts`)
8. Certified by Tech Committee + Risk Committee + Council ❌ (not done)

### Documented Gap

- `docs/verification/missing-feature-report.md:243-247` (P2-5): "Lyapunov stability and monotone convergence not formally proven. Missing: ConstitutionalStabilityCertification instrument."
- `docs/verification/implementation-compliance-matrix.md:233`: "⚠️ Deterministic Certification (Lyapunov stability not formally proven; monotone convergence not formally certified)"

### Effort Estimate

**L (8 days; requires mathematician review).** This is a formal mathematical proof task, not a code task. The implementation is correct; the proof is missing.

---

## Shock Absorber Test Coverage

| Test | File:Line | What It Verifies |
|---|---|---|
| `stability-tests.ts:90` | `A_t = 0.5 at high volatility` | Max dampening at σ ≥ 5% |
| `stability-tests.ts:95` | Momentum dampened (K closer to 1) | K_i approaches 1 when A_t < 1 |
| `stress-test-fixed.ts` | σ = 6% shock absorber scenario | Engine survives high-vol regime |
| `tests/adversarial-tests.ts:282` | Adversarial shock absorber tests | Cannot be gamed |
| `scripts/audit/math-audit.ts:542` | Standalone audit harness | Formula correctness |

---

## Decision Summary

| Item | Decision |
|---|---|
| Piecewise-linear A_t ∈ [0.5, 1.0] | **KEEP** — correct, bounded, verified |
| Application to (M×R − 1) per §17.7 | **KEEP** — correct (v19.0 fix) |
| Math audit fix (Task 6-c) | **KEEP** — corrected polarity error |
| Stability tests | **KEEP** — verify A_t = 0.5 at high vol |
| Lyapunov stability proof | **ADD** (future phase, G2, 8 days, mathematician) |
| BIBO proof | **ADD** (same) |
| Monotone convergence proof | **ADD** (same) |
| Constitutional Stability Certification | **ADD** (same, requires Council sign-off) |

---

## No Code Changes Made

This report is **read-only**. The shock absorber implementation is preserved as-is. The Lyapunov certification is a future mathematical proof task, not a code change.
