# Task impl-4B-states — Reserve State Separation

**Agent:** impl-states
**Scope:** `src/lib/reserve-state.ts` ONLY (single-file ownership)
**Phase:** 4B — De-conflate the 7 institutional holding states at init

## Context

Phase 1 audit (`docs/verification/reserve-canonical-audit.md` Part VI "7 Institutional Holding States") found that all 4 stored views in `ReserveState` (target/executed/custodian/reconciled) were populated from the SAME `assets[]` array in `initializeReserveState()`, differing only in `dataSourceId`. After a process restart, all 4 views were identical — masking reconciliation gaps and making `custodianVariance` appear as 0 when in reality no custodian had confirmed anything.

## What changed

### `initializeReserveState()` — fully rewritten

Each of the 4 views is now sourced INDEPENDENTLY:

| View | Source | `dataSourceId` | Notes |
|------|--------|----------------|-------|
| `target` | `targetWeights` param (from `computeDynamicReserveAllocation` upstream) | `"constitutional-engine"` | Quantities are implied: `targetWeight × totalExecutedValue / price`. `actualWeight == targetWeight` (target IS the recommendation). |
| `executed` | `BASELINE_COMPOSITION` (imported from `reserve-policy-spec.ts`) | `"internal-ledger-simulation-baseline"` | SIMULATION baseline (in production this would come from the committed ledger). Per-asset `reconciliationStatus: "pending"` (no custodian confirmation yet). |
| `custodian` | EMPTY array `[]` at init | (n/a — no entries) | `commitCustodianConfirmation()` is the ONLY sanctioned way to populate this view. |
| `reconciled` | `computeReconciled(executed, custodian)` | `"reconciliation-engine"` | With empty custodian, every entry is `"pending"`. |

### Aggregate state changes (all HONEST relative to prior conflated behavior)

- `custodianVariance`: now non-zero at init (= total executed value, since nothing is confirmed). Was `0` — dishonest.
- `reconciliationStatus`: now `"pending"` at init. Was `"verified"` — dishonest.
- `lastReconciliation`: now `null` at init. Was a timestamp — dishonest (no reconciliation had occurred).

### New helpers (private to module)

1. `buildTargetAssets(targetWeights, goldPrice, silverPrice, executedAssets)` — builds the TARGET view from the engine's recommended weights.
2. `buildExecutedAssets(goldPrice, silverPrice)` — builds the EXECUTED view from `BASELINE_COMPOSITION`.
3. `computeReconciled(executed, custodian)` — for each executed asset: `"verified"` if custodian matches, `"exception"` if mismatch, `"pending"` if no custodian entry.
4. `computeCustodianVariance(executed, custodian)` — `Σ |execValue − (custValue ?? 0)|`. An empty custodian yields variance === total executed value.

### Other refactors

- `commitReserveStateUpdate()`: now recomputes reconciled view + custodianVariance after a ledger mutation (previously left stale custodian/reconciled views, which could mask a new gap post-execution).
- `commitCustodianConfirmation()`: refactored to use the shared `computeReconciled()` and `computeCustodianVariance()` helpers (previously had inline logic that marked missing custodian entries as `"exception"` rather than `"pending"` — the new behavior is more correct).
- Removed hardcoded `INITIAL_GOLD_OZ` / `INITIAL_SILVER_OZ` / `INITIAL_CASH_USD` / `INITIAL_SOVEREIGN_USD` / `INITIAL_STABLECOIN_USD` constants — now imported from `BASELINE_COMPOSITION`.
- Added `PERMITTED_BANDS` constant (extracted from the inline per-asset bands in the original `makeAsset` closure).

## Decisions / tradeoffs

### Did NOT extend `ReconciliationStatus` union with `"pending-confirmation"`

The task prompt suggested using `"pending-confirmation"` for the "no custodian entry" case. However, adding this literal to the `ReconciliationStatus` union would introduce a NEW TypeScript error in `src/lib/reconciliation.ts:169`, which has a local 4-member string-literal type for `status`:

```typescript
// reconciliation.ts:163
export function getReconciliationStatus(reserveState: ReserveState): {
  status: "verified" | "pending" | "exception" | "suspended";  // ← doesn't include "pending-confirmation"
  ...
}
```

Per the constraints "Do NOT touch any files other than `src/lib/reserve-state.ts`" + "TypeScript must compile", I kept the union unchanged and used the existing `"pending"` value. The JSDoc on `ReconciliationStatus` documents the contextual disambiguation:

- asset-level `"pending"` = "no custodian confirmation received yet (the entire position is unconfirmed)"
- reserve-level `"pending"` = "a reconciliation cycle is in flight"

### States 3-5 of the 7-state taxonomy

States 3 (PROPOSED), 4 (APPROVED), and 5 (EXECUTED via ExecutionResult) from the Phase 1 audit are already separately managed by `execution-engine.ts`'s `RebalanceProposal` lifecycle and are NOT persisted in `ReserveState`. They remain untouched — this task only addresses the 4 stored views.

## Verification

### `/api/reserve/state` after HMR (fresh init)

```
=== reserveState meta ===
reconciliationStatus: pending
lastReconciliation: None
custodianVariance: 56014588.014

=== target (5 entries) ===
  gold-primary             dataSourceId=constitutional-engine                      reconStatus=verified           qty=2129.623278022517
  silver-primary           dataSourceId=constitutional-engine                      reconStatus=verified           qty=37177.82390309735
  cash-primary             dataSourceId=constitutional-engine                      reconStatus=verified           qty=28007294.007
  sovereign-primary        dataSourceId=constitutional-engine                      reconStatus=verified           qty=13443501.123359999
  stablecoin-primary       dataSourceId=constitutional-engine                      reconStatus=verified           qty=2800729.4007

=== executed (5 entries) ===
  gold-primary             dataSourceId=internal-ledger-simulation-baseline        reconStatus=pending            qty=2122.86
  silver-primary           dataSourceId=internal-ledger-simulation-baseline        reconStatus=pending            qty=36758
  cash-primary             dataSourceId=internal-ledger-simulation-baseline        reconStatus=pending            qty=29000000
  sovereign-primary        dataSourceId=internal-ledger-simulation-baseline        reconStatus=pending            qty=13500000
  stablecoin-primary       dataSourceId=internal-ledger-simulation-baseline        reconStatus=pending            qty=2700000

=== custodian (0 entries) ===

=== reconciled (5 entries) ===
  gold-primary             dataSourceId=reconciliation-engine                      reconStatus=pending            qty=2122.86
  silver-primary           dataSourceId=reconciliation-engine                      reconStatus=pending            qty=36758
  cash-primary             dataSourceId=reconciliation-engine                      reconStatus=pending            qty=29000000
  sovereign-primary        dataSourceId=reconciliation-engine                      reconStatus=pending            qty=13500000
  stablecoin-primary       dataSourceId=reconciliation-engine                      reconStatus=pending            qty=2700000
```

- 4 views with DIFFERENT `dataSourceId` values ✓
- `custodian` view is EMPTY (0 entries) — not a clone of executed ✓
- `custodianVariance` non-zero (=$56M, the full unconfirmed executed value) ✓
- `reconciliationStatus: "pending"` ✓
- `lastReconciliation: null` ✓
- Target quantities DIFFER from executed quantities (e.g. gold 2129.62 oz vs 2122.86 oz) — proving independence ✓

### TypeScript

`bunx tsc --noEmit 2>&1 | grep -E "reserve-state|reconciliation"` → no errors in my file or in reconciliation.ts. The 9 remaining TS errors in the project are all PRE-EXISTING (next.config.ts, custody/holdings/route.ts, rebalance/execute/route.ts ×3, db.ts, financial-soundness-tests.ts ×2, game-theory-audit.ts) — none caused by my change.

### ESLint

`bun run lint` → clean (exit 0).

## API contract preserved

- `getReserveState()` — signature unchanged
- `commitReserveStateUpdate()` — signature unchanged (now also recomputes reconciled view + variance after mutation — strictly more correct)
- `commitCustodianConfirmation()` — signature unchanged (now uses shared `computeReconciled` / `computeCustodianVariance` helpers — strictly more consistent)
- `ReconciliationStatus` union — unchanged (no new literal)
- `ReserveAssetState` interface — unchanged
- `ReserveState` interface — unchanged

## Files modified

- `src/lib/reserve-state.ts` (249 → 589 lines): full rewrite of `initializeReserveState()`, added 4 private helpers, refactored `commitReserveStateUpdate` and `commitCustodianConfirmation` to use the shared helpers, expanded JSDoc.
