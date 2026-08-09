# Emergency Reserve Mode Report

**Report Date:** 2026-08-09
**Author:** Institutional Governance Auditor / Constitutional Engineer / Chief Operating Officer (acting in concert)
**Authority:** §14 of the reserve dynamicity implementation specification; MITHQAL Constitution Article X (Emergency Governance), Article XLIV (5-Level Emergency Ladder)
**Status:** COMPLETE — emergency architecture verified, persistence gap documented

---

## Executive Summary

The MITHQAL emergency reserve mode is **broadly implemented** as a 5-level governance ladder in `v19-infrastructure.ts:1378-1512`. The architecture includes automatic minting pause, SDP (Severe Deviation Protocol), LRR emergency triggers, and custodian failure protocols. **One gap:** the emergency state is not persisted — `declareEmergency()` returns a state object but does not write to the database, set an on-chain flag, or expose an API endpoint.

---

## §14 — Emergency Reserve Mode Requirements

| Spec Requirement | Implementation | Status |
|---|---|---|
| Formally defined emergency state | 5-level ladder (Normal → Technical → Operational → Constitutional → Systemic) | ✅ |
| Major currency crisis trigger | SDP (>5% deviation); currency crash stress tests | ✅ |
| Severe market dislocation trigger | 20 stress lab scenarios; emergency rebalance trigger (concentration ≥ 85%) | ✅ |
| Custodian failure trigger | `simulateCustodianFailure()` in multi-custodian.ts | ✅ |
| Oracle failure trigger | `oracleConfidence < 0.50` → emergency | ✅ |
| Liquidity crisis trigger | LRR < 0.9 → emergency; LCR < 1.0 → non-compliant | ✅ |
| Extreme volatility trigger | Shock absorber A_t = 0.5 at σ ≥ 5%; SDP at >5% deviation | ✅ |
| Sovereign settlement restrictions trigger | Capital Controls + Sanctions stress scenarios | ✅ |
| Geopolitical disruption trigger | War + Pandemic scenarios in business-continuity.ts | ✅ |
| Redemption stress trigger | Simultaneous Redemption Wave scenario; LRR denominator includes P95 | ✅ |
| Constitutionally bounded | 5-level ladder with max durations (24h / 7d / 30d / 90d) | ✅ |
| Deterministic where possible | Minting pause auto-triggers at RR < 100% | ✅ |
| Logged | ⚠️ Partial — no persistent log | ⚠️ GAP (G7) |
| Auditable | ⚠️ Partial — no audit trail in DB | ⚠️ GAP (G7) |
| Time-limited | 24h / 7d / 30d / 90d max | ✅ |
| Reversible | `liftEmergency()` | ✅ |
| Subject to governance controls | Council approval for Level 3+ | ✅ |
| No unlimited operator discretion | No "move reserves" button; no manual override | ✅ |

---

## 5-Level Emergency Governance (Verified)

```text
Level 0: Normal Operations          — baseline, no emergency
    ↓
Level 1: Technical Emergency        — 24-hour max, Technical Committee
    ↓
Level 2: Operational Emergency      — 7-day max, Tech + Executive
    ↓
Level 3: Constitutional Emergency   — 30-day max, Council
    ↓
Level 4: Systemic Emergency         — 90-day max, Council + Independent Oversight
```

### Implementation (`v19-infrastructure.ts:1378-1512`)

| Function | Purpose |
|---|---|
| `declareEmergency(level, reason)` | Returns emergency state object with level, duration, authority |
| `liftEmergency()` | Ends emergency state |
| `isEmergencyActive()` | Checks if emergency is currently active |
| `EMERGENCY_DURATIONS_MS` | Enforces max duration per level |

---

## Emergency Mechanisms (Verified)

### 1. Automatic Minting Pause

```typescript
// monetary-engine-v19.ts:755
mintingPaused: !reserveRatio.compliant || !basketVerification.passed,
```

Minting auto-pauses when:
- Reserve ratio < 100% (constitutional floor)
- Basket verification fails (weights outside [0.5%, 60%])

**Redemption NEVER pauses** — constitutional invariant, verified in `foundry/test/Redeem.t.sol:303` (`test_RedeemContract_HasNoPauseFunction`).

### 2. SDP — Severe Deviation Protocol

`v19-infrastructure.ts:188-262`:
- Triggers at >5% deviation from reference price
- K_SDP = Ref/Cur
- W_emergency = C × K_SDP
- newWeight = max(W_emergency, W_current × 0.50) — **SDP_CAP prevents sudden liquidation**
- Currency-agnostic (works for any eligible currency)

### 3. LRR Emergency Alert

`lrr.ts:149-150`:
```typescript
if (lrr < 0.9) return "emergency";
```
LRR < 0.9 → emergency protocols activated.

### 4. Rebalance Emergency

`dynamic-rebalancing.ts:363-385`:
- `reserveConcentration ≥ 0.85` OR `custodianConcentration ≥ 0.85` → emergency de-concentration
- `oracleConfidence < 0.50` → pause automation, convene Risk Committee

### 5. Custodian Failure

`multi-custodian.ts:482-604`:
- Single-custodian failure → redistribution to surviving custodians
- If survivors cannot absorb → `survived = false`, alert "Constitutional emergency — convene Risk Committee immediately"

### 6. On-Chain Emergency Pause

`MTQ.sol` has `mintingPaused` flag (per Algorithm.sol comment line 25). Foundry tests confirm pause/unpause works (`MTQ.t.sol:381`, `Mint.t.sol:272`). **Pause is only on minting, never on redemption.**

---

## Gap: Emergency State Not Persisted (G7)

### Current State

`declareEmergency()` returns a state object but:
- ❌ No database write (Turso)
- ❌ No on-chain flag
- ❌ No API endpoint to declare/lift from UI
- ✅ Exists only in test code (`adversarial-tests.ts`, `business-continuity.ts`)

### Impact

In production, an emergency declared by the Council would not be visible to the application. The minting pause works (it's automatic via reserve ratio), but the 5-level governance ladder is not operational.

### Remediation Plan

1. Add `emergency_state` table to Turso DB
2. Add `declareEmergency()` API endpoint (Council-gated)
3. Add `liftEmergency()` API endpoint (Council-gated)
4. Add `getEmergencyState()` API endpoint (public read)
5. Wire `isEmergencyActive()` to read from DB
6. Add audit log entry for every declare/lift action

**Effort: M (3 days).** Future phase.

---

## Spec §14 Compliance

| Spec Requirement | Status |
|---|---|
| Formally defined emergency state | ✅ 5-level ladder |
| Constitutionally bounded | ✅ Max durations enforced |
| Deterministic where possible | ✅ Minting pause is automatic |
| Logged | ⚠️ GAP (G7) |
| Auditable | ⚠️ GAP (G7) |
| Time-limited | ✅ 24h / 7d / 30d / 90d |
| Reversible | ✅ `liftEmergency()` |
| Subject to governance controls | ✅ Council approval for Level 3+ |
| No unlimited operator discretion | ✅ No manual override |

---

## Decision Summary

| Item | Decision |
|---|---|
| 5-level emergency governance ladder | **KEEP** — constitutionally sound |
| Automatic minting pause (RR < 100%) | **KEEP** — deterministic, no discretion |
| Redemption never pauses | **KEEP** — constitutional invariant |
| SDP (Severe Deviation Protocol) | **KEEP** — currency-agnostic, cap-protected |
| LRR emergency trigger | **KEEP** |
| Custodian failure protocol | **KEEP** |
| Emergency state persistence | **ADD** (future phase, G7, 3 days) |
| Emergency API endpoints | **ADD** (same) |
| Emergency audit log | **ADD** (same) |

---

## No Code Changes Made

This report is **read-only**. The emergency architecture is preserved as-is. The persistence gap (G7) is a future implementation task.
