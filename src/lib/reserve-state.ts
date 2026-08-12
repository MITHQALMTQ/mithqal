/**
 * MITHQAL — Institutional Reserve State Model
 *
 * Replaces FIXED physical constants with an authoritative reserve-state
 * abstraction that distinguishes:
 *   A. Target State    — what the constitutional engine says the reserve SHOULD contain
 *   B. Executed State  — what has actually been purchased/sold (internal ledger)
 *   C. Custodian State — what the approved custodian independently confirms
 *   D. Reconciled State — what MITHQAL has verified against the custodian record
 *
 * These four views must NEVER be conflated.
 *
 * Phase 4 — Reserve State Separation (impl-4B-states):
 *   Prior to this change, `initializeReserveState()` populated all four views
 *   from the SAME `assets[]` array, differing only in `dataSourceId`. They
 *   diverged only after lifecycle mutations, so after a process restart all
 *   four views were identical — masking reconciliation gaps and making
 *   `custodianVariance` appear as 0 when in reality no custodian had confirmed
 *   anything (Phase 1 audit, Part VI "7 Institutional Holding States").
 *
 *   The four stored views are now independently sourced at init:
 *     1. TARGET     — from the engine's recommended `targetWeights` param
 *     2. EXECUTED   — from `BASELINE_COMPOSITION` (SIMULATION ledger baseline;
 *                     in production this would come from the committed ledger)
 *     3. CUSTODIAN  — EMPTY at init (no custodian has confirmed yet)
 *     4. RECONCILED — computed via `computeReconciled()` (status "pending"
 *                     while the custodian view is empty)
 *
 *   States 3 (PROPOSED), 4 (APPROVED), and 5 (EXECUTED via ExecutionResult)
 *   from the Phase 1 audit's 7-state taxonomy are already separately managed
 *   by `execution-engine.ts`'s `RebalanceProposal` lifecycle and are not
 *   persisted in `ReserveState` — they remain untouched here.
 *
 * Phase 3 of the institutional execution architecture implementation.
 * Status: SIMULATED (testnet) — uses in-memory persistence.
 */

import { BASELINE_COMPOSITION } from "./reserve-policy-spec";

export type AssetClass = "gold" | "silver" | "cash" | "sovereign" | "stablecoin";
export type Currency = "USD" | "EUR" | "JPY" | "GBP" | "CNY" | "CHF" | "AUD" | "CAD";
export type SettlementStatus = "pending" | "settled" | "failed" | "cancelled";
/**
 * Reconciliation status for a single asset entry.
 *
 * The same union is used at both the per-asset level (each entry in a view's
 * array) and the aggregate reserve level (`ReserveState.reconciliationStatus`).
 * Context disambiguates the meaning:
 *
 *   - `"verified"`            — custodian confirmation received and matches.
 *   - `"pending"`             — at asset level: no custodian confirmation
 *                              received yet (the entire position is
 *                              unconfirmed). At reserve level: a
 *                              reconciliation cycle is in flight.
 *   - `"exception"`           — custodian confirmation received but disagrees
 *                              with the internal ledger.
 *   - `"suspended"`           — reconciliation suspended (manual hold).
 */
export type ReconciliationStatus =
  | "verified"
  | "pending"
  | "exception"
  | "suspended";
export type ExecutionMode = "SIMULATION" | "PAPER" | "INSTITUTIONAL_TEST" | "PRODUCTION";

/** Per §5 — 19 mandatory fields per reserve asset. */
export interface ReserveAssetState {
  assetId: string;
  assetClass: AssetClass;
  currency: Currency | "USD";
  quantity: number;
  unit: "oz" | "USD" | "units";
  marketPrice: number;
  valuationCurrency: "USD";
  valuationTimestamp: string;
  targetWeight: number;
  actualWeight: number;
  permittedMinimum: number;
  permittedMaximum: number;
  custodianId: string | null;
  custodyAccountId: string | null;
  transactionRef: string | null;
  settlementStatus: SettlementStatus;
  reconciliationStatus: ReconciliationStatus;
  dataSourceId: string;
  verificationTimestamp: string;
}

/** The four-view reserve state (§4). */
export interface ReserveState {
  reserveStateVersion: number;
  algorithmVersion: string;
  constitutionVersion: string;
  oracleSnapshotVersion: string;
  executionVersion: string;
  timestamp: string;
  target: ReserveAssetState[];
  executed: ReserveAssetState[];
  custodian: ReserveAssetState[];
  reconciled: ReserveAssetState[];
  lastReconciliation: string | null;
  reconciliationStatus: ReconciliationStatus;
  custodianVariance: number;
}

/**
 * Permitted weight bands per asset class — used to populate the
 * `permittedMinimum` / `permittedMaximum` fields on every view. These mirror
 * the layer ranges in `reserve-policy-spec.ts LAYER_SPEC` and the per-asset
 * bands historically encoded inline in the original `initializeReserveState`.
 */
const PERMITTED_BANDS: Record<AssetClass, { min: number; max: number }> = {
  gold: { min: 0.10, max: 0.30 },
  silver: { min: 0.005, max: 0.12 },
  cash: { min: 0.25, max: 0.60 },
  sovereign: { min: 0.20, max: 0.50 },
  stablecoin: { min: 0.00, max: 0.10 },
};

/** Default custodian assignment per asset class (SIMULATION). */
function defaultCustodianFor(assetClass: AssetClass): string {
  return assetClass === "gold" || assetClass === "silver" ? "sim-vault-01" : "sim-bank-01";
}

let stateVersion = 0;
let reserveStateStore: ReserveState | null = null;
// NOTE: Next.js dev HMR preserves module-level state across edits, so changes
// to `initializeReserveState` may not appear in `/api/reserve/state` until
// the dev server is fully restarted. The route's `!isReserveStateInitialized`
// guard short-circuits re-init on every request after the first.

// ============================================================
// View builders — each view is sourced INDEPENDENTLY at init.
// ============================================================

/**
 * Build the TARGET view — the engine's recommended composition.
 *
 * Source: the `targetWeights` parameter (produced upstream by
 * `computeDynamicReserveAllocation`). Each entry's `targetWeight` and
 * `actualWeight` both equal the recommended weight (the target IS the
 * recommendation). Quantities are implied: `targetWeight × totalExecutedValue
 * ÷ marketPrice` (oz) or `targetWeight × totalExecutedValue` (USD) — these
 * represent "what we would need to hold at current prices to match the
 * target", enabling side-by-side visual comparison with the EXECUTED view.
 *
 * `dataSourceId: "constitutional-engine"` — distinguishes this from the
 * internal-ledger-sourced EXECUTED view.
 */
function buildTargetAssets(
  targetWeights: { gold: number; silver: number; cash: number; sovereign: number; stablecoin: number },
  goldPrice: number,
  silverPrice: number,
  executedAssets: ReserveAssetState[]
): ReserveAssetState[] {
  const now = new Date().toISOString();
  const totalExecutedValue = executedAssets.reduce((sum, a) => {
    const v = a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity;
    return sum + v;
  }, 0);

  const specs: Array<{
    assetId: string;
    assetClass: AssetClass;
    weight: number;
    unit: "oz" | "USD";
    marketPrice: number;
  }> = [
    { assetId: "gold-primary", assetClass: "gold", weight: targetWeights.gold, unit: "oz", marketPrice: goldPrice },
    { assetId: "silver-primary", assetClass: "silver", weight: targetWeights.silver, unit: "oz", marketPrice: silverPrice },
    { assetId: "cash-primary", assetClass: "cash", weight: targetWeights.cash, unit: "USD", marketPrice: 1 },
    { assetId: "sovereign-primary", assetClass: "sovereign", weight: targetWeights.sovereign, unit: "USD", marketPrice: 1 },
    { assetId: "stablecoin-primary", assetClass: "stablecoin", weight: targetWeights.stablecoin, unit: "USD", marketPrice: 1 },
  ];

  return specs.map((s) => {
    const impliedValue = s.weight * totalExecutedValue;
    const impliedQuantity = s.unit === "oz" ? impliedValue / s.marketPrice : impliedValue;
    const band = PERMITTED_BANDS[s.assetClass];
    return {
      assetId: s.assetId,
      assetClass: s.assetClass,
      currency: "USD" as const,
      quantity: impliedQuantity,
      unit: s.unit,
      marketPrice: s.marketPrice,
      valuationCurrency: "USD" as const,
      valuationTimestamp: now,
      targetWeight: s.weight,
      actualWeight: s.weight, // target view: actual == target by definition
      permittedMinimum: band.min,
      permittedMaximum: band.max,
      custodianId: defaultCustodianFor(s.assetClass),
      custodyAccountId: `sim-${s.assetClass}-account`,
      transactionRef: null,
      settlementStatus: "settled" as const,
      reconciliationStatus: "verified" as const,
      dataSourceId: "constitutional-engine",
      verificationTimestamp: now,
    };
  });
}

/**
 * Build the EXECUTED view — the internal ledger's record of what has actually
 * been purchased/sold.
 *
 * Source: `BASELINE_COMPOSITION` from `reserve-policy-spec.ts` (the v19.0.2
 * §19.2 canonical over-collateralization baseline). In production this would
 * come from the committed ledger; for SIMULATION we use the baseline.
 *
 * `dataSourceId: "internal-ledger-simulation-baseline"` — clearly labels this
 * as a SIMULATION baseline so auditors can distinguish it from real ledger
 * reads and from the TARGET view (which has `dataSourceId:
 * "constitutional-engine"`).
 */
function buildExecutedAssets(goldPrice: number, silverPrice: number): ReserveAssetState[] {
  const now = new Date().toISOString();

  const specs: Array<{
    assetId: string;
    assetClass: AssetClass;
    quantity: number;
    unit: "oz" | "USD";
    marketPrice: number;
  }> = [
    { assetId: "gold-primary", assetClass: "gold", quantity: BASELINE_COMPOSITION.GOLD_OZ, unit: "oz", marketPrice: goldPrice },
    { assetId: "silver-primary", assetClass: "silver", quantity: BASELINE_COMPOSITION.SILVER_OZ, unit: "oz", marketPrice: silverPrice },
    { assetId: "cash-primary", assetClass: "cash", quantity: BASELINE_COMPOSITION.CASH_USD, unit: "USD", marketPrice: 1 },
    { assetId: "sovereign-primary", assetClass: "sovereign", quantity: BASELINE_COMPOSITION.SOVEREIGN_USD, unit: "USD", marketPrice: 1 },
    { assetId: "stablecoin-primary", assetClass: "stablecoin", quantity: BASELINE_COMPOSITION.STABLECOIN_USD, unit: "USD", marketPrice: 1 },
  ];

  const totalValue = specs.reduce((sum, s) => {
    const v = s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity;
    return sum + v;
  }, 0);

  return specs.map((s) => {
    const value = s.unit === "oz" ? s.quantity * s.marketPrice : s.quantity;
    const band = PERMITTED_BANDS[s.assetClass];
    return {
      assetId: s.assetId,
      assetClass: s.assetClass,
      currency: "USD" as const,
      quantity: s.quantity,
      unit: s.unit,
      marketPrice: s.marketPrice,
      valuationCurrency: "USD" as const,
      valuationTimestamp: now,
      targetWeight: 0, // populated by callers that know the target weights; 0 = "not set on this view"
      actualWeight: value / totalValue,
      permittedMinimum: band.min,
      permittedMaximum: band.max,
      custodianId: defaultCustodianFor(s.assetClass),
      custodyAccountId: `sim-${s.assetClass}-account`,
      transactionRef: null,
      settlementStatus: "settled" as const,
      // The internal ledger's record is independent of custodian confirmation;
      // `"pending"` here means "no custodian confirmation for this asset yet".
      // `computeReconciled()` re-derives the per-asset status when the
      // custodian view is populated.
      reconciliationStatus: "pending" as const,
      dataSourceId: "internal-ledger-simulation-baseline",
      verificationTimestamp: now,
    };
  });
}

/**
 * Compute the RECONCILED view — the variance-resolution output of comparing
 * the EXECUTED (internal ledger) view against the CUSTODIAN-CONFIRMED view.
 *
 * For each executed asset:
 *   - If a matching custodian asset exists AND quantities agree → "verified"
 *   - If a matching custodian asset exists but quantities disagree → "exception"
 *   - If no custodian confirmation exists → "pending" (asset-level meaning:
 *     the position is unconfirmed; distinguished from reserve-level "pending"
 *     which means a reconciliation cycle is in flight)
 *
 * The returned entries preserve the executed asset's quantity (the reconciled
 * view is the internal ledger's view of record, annotated with the
 * custodian-confirmation status). `dataSourceId` is overwritten to
 * `"reconciliation-engine"` to mark these entries as the reconciled output.
 */
function computeReconciled(
  executed: ReserveAssetState[],
  custodian: ReserveAssetState[]
): ReserveAssetState[] {
  const now = new Date().toISOString();
  return executed.map((exec) => {
    const cust = custodian.find((c) => c.assetId === exec.assetId);
    if (!cust) {
      // No custodian confirmation for this asset → "pending" at the asset
      // level (the entire position is unconfirmed). Distinguished from
      // `"exception"` (confirmation received but disagrees).
      return {
        ...exec,
        dataSourceId: "reconciliation-engine",
        reconciliationStatus: "pending" as const,
        verificationTimestamp: now,
      };
    }
    const match = Math.abs(exec.quantity - cust.quantity) < 0.001;
    return {
      ...exec,
      dataSourceId: "reconciliation-engine",
      reconciliationStatus: match ? ("verified" as const) : ("exception" as const),
      verificationTimestamp: now,
    };
  });
}

/**
 * Compute the aggregate custodian variance (USD) — the absolute gap between
 * the EXECUTED view and the CUSTODIAN-CONFIRMED view.
 *
 * For each executed asset:
 *   - If a matching custodian asset exists → |execValue − custValue|
 *   - If no custodian confirmation exists → execValue (the full position is
 *     unconfirmed, so the entire position counts toward variance)
 *
 * This means an empty custodian view yields `custodianVariance === total
 * executed value`, which is HONEST: nothing has been confirmed yet. The
 * original implementation returned 0 in that case, masking the
 * "unconfirmed" state (Phase 1 audit Part VI finding).
 */
function computeCustodianVariance(
  executed: ReserveAssetState[],
  custodian: ReserveAssetState[]
): number {
  let variance = 0;
  for (const exec of executed) {
    const execValue = exec.unit === "oz" ? exec.quantity * exec.marketPrice : exec.quantity;
    const cust = custodian.find((c) => c.assetId === exec.assetId);
    const custValue = cust
      ? (cust.unit === "oz" ? cust.quantity * cust.marketPrice : cust.quantity)
      : 0; // missing confirmation = full gap
    variance += Math.abs(execValue - custValue);
  }
  return variance;
}

// ============================================================
// Public API
// ============================================================

/**
 * Initialize the reserve state with each of the 4 views sourced INDEPENDENTLY.
 *
 *   1. TARGET     — from the passed `targetWeights` (engine recommendation)
 *   2. EXECUTED   — from `BASELINE_COMPOSITION` (SIMULATION ledger baseline)
 *   3. CUSTODIAN  — EMPTY (no custodian has confirmed yet; this is honest —
 *                   `commitCustodianConfirmation()` is the only way to
 *                   populate this view)
 *   4. RECONCILED — computed via `computeReconciled()`; every asset is
 *                   "pending" (no custodian confirmation yet) while the
 *                   custodian view is empty
 *
 * The 4 views therefore have DIFFERENT `dataSourceId` values at init and
 * (crucially) the custodian view is structurally distinct from executed —
 * not a shallow clone with a renamed `dataSourceId`. After a process
 * restart, `custodianVariance` is non-zero (the full unconfirmed amount),
 * correctly reflecting "no custodian has attested to anything yet".
 *
 * States 3-5 of the Phase 1 audit's 7-state taxonomy (PROPOSED, APPROVED,
 * EXECUTED via ExecutionResult) are managed by `execution-engine.ts`'s
 * `RebalanceProposal` lifecycle and remain untouched here.
 */
export function initializeReserveState(
  goldPrice: number,
  silverPrice: number,
  targetWeights: { gold: number; silver: number; cash: number; sovereign: number; stablecoin: number }
): ReserveState {
  const now = new Date().toISOString();
  stateVersion = 0;

  // 2. EXECUTED view — built first because TARGET's implied quantities are
  //    computed against the executed total notional.
  const executedAssets = buildExecutedAssets(goldPrice, silverPrice);

  // 1. TARGET view — engine's recommended weights, with implied quantities
  //    derived from the executed total notional.
  const targetAssets = buildTargetAssets(targetWeights, goldPrice, silverPrice, executedAssets);

  // 3. CUSTODIAN view — EMPTY at init.
  //    No custodian has confirmed anything yet. `commitCustodianConfirmation`
  //    is the ONLY way to populate this view. This makes `custodianVariance`
  //    non-zero by default (the gap between executed and unconfirmed
  //    custodian), which is HONEST.
  const custodianAssets: ReserveAssetState[] = [];

  // 4. RECONCILED view — computed from executed vs custodian.
  //    With an empty custodian view, every asset's status is "pending"
  //    (no custodian confirmation received yet). The reconciled view's
  //    `dataSourceId` is "reconciliation-engine" to distinguish it from the
  //    executed view's "internal-ledger-simulation-baseline".
  const reconciledAssets =
    custodianAssets.length > 0
      ? computeReconciled(executedAssets, custodianAssets)
      : executedAssets.map((a) => ({
          ...a,
          dataSourceId: "reconciliation-engine",
          reconciliationStatus: "pending" as const,
        }));

  // Aggregate custodian variance — non-zero because custodian is empty.
  const custodianVariance = computeCustodianVariance(executedAssets, custodianAssets);

  // Aggregate reconciliation status — "pending" because no custodian
  // confirmation cycle has completed yet.
  const hasException = reconciledAssets.some((a) => a.reconciliationStatus === "exception");
  const allVerified = reconciledAssets.every((a) => a.reconciliationStatus === "verified");
  const reconciliationStatus: ReconciliationStatus = hasException
    ? "exception"
    : allVerified
      ? "verified"
      : "pending";

  reserveStateStore = {
    reserveStateVersion: 0,
    algorithmVersion: "v19.0.3",
    constitutionVersion: "v19.0.3",
    oracleSnapshotVersion: "init",
    executionVersion: "1.0.0-simulation",
    timestamp: now,
    target: targetAssets,
    executed: executedAssets,
    custodian: custodianAssets,
    reconciled: reconciledAssets,
    lastReconciliation: null, // no reconciliation cycle has run yet
    reconciliationStatus,
    custodianVariance,
  };

  return reserveStateStore;
}

export function getReserveState(
  goldPrice?: number,
  silverPrice?: number,
  targetWeights?: { gold: number; silver: number; cash: number; sovereign: number; stablecoin: number }
): ReserveState {
  if (!reserveStateStore && goldPrice && silverPrice && targetWeights) {
    return initializeReserveState(goldPrice, silverPrice, targetWeights);
  }
  if (!reserveStateStore) throw new Error("Reserve state not initialized");
  return reserveStateStore;
}

export function isReserveStateInitialized(): boolean {
  return reserveStateStore !== null;
}

/** The ONLY way to mutate the executed reserve state (§29 versioning). */
export function commitReserveStateUpdate(
  updates: Array<{ assetId: string; newQuantity: number; transactionRef: string }>,
  oracleSnapshotVersion: string
): ReserveState {
  if (!reserveStateStore) throw new Error("Reserve state not initialized");
  const now = new Date().toISOString();
  stateVersion++;
  reserveStateStore.reserveStateVersion = stateVersion;
  reserveStateStore.oracleSnapshotVersion = oracleSnapshotVersion;
  reserveStateStore.timestamp = now;

  for (const update of updates) {
    const asset = reserveStateStore.executed.find((a) => a.assetId === update.assetId);
    if (asset) {
      asset.quantity = update.newQuantity;
      asset.transactionRef = update.transactionRef;
      asset.settlementStatus = "settled";
      asset.verificationTimestamp = now;
      asset.valuationTimestamp = now;
    }
  }

  const totalValue = reserveStateStore.executed.reduce((sum, a) => {
    const value = a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity;
    return sum + value;
  }, 0);
  for (const a of reserveStateStore.executed) {
    const value = a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity;
    a.actualWeight = value / totalValue;
  }

  // After an executed mutation, the previously-stored custodian confirmation
  // is stale relative to the new executed state — re-derive the reconciled
  // view and recompute the variance so consumers see the honest gap.
  reserveStateStore.reconciled = computeReconciled(
    reserveStateStore.executed,
    reserveStateStore.custodian
  );
  reserveStateStore.custodianVariance = computeCustodianVariance(
    reserveStateStore.executed,
    reserveStateStore.custodian
  );

  const hasException = reserveStateStore.reconciled.some(
    (a) => a.reconciliationStatus === "exception"
  );
  const allVerified = reserveStateStore.reconciled.every(
    (a) => a.reconciliationStatus === "verified"
  );
  reserveStateStore.reconciliationStatus = hasException
    ? "exception"
    : allVerified
      ? "verified"
      : "pending";
  return reserveStateStore;
}

/**
 * Update the custodian-confirmed state after reconciliation.
 *
 * Populates the CUSTODIAN view from the custodian's reported holdings, then
 * recomputes the RECONCILED view (via `computeReconciled`) and the aggregate
 * `custodianVariance` (via `computeCustodianVariance`). This is the ONLY
 * sanctioned way to populate the custodian view.
 */
export function commitCustodianConfirmation(custodianAssets: ReserveAssetState[]): ReserveState {
  if (!reserveStateStore) throw new Error("Reserve state not initialized");
  const now = new Date().toISOString();
  stateVersion++;
  reserveStateStore.reserveStateVersion = stateVersion;
  reserveStateStore.timestamp = now;
  reserveStateStore.custodian = custodianAssets;
  reserveStateStore.lastReconciliation = now;

  reserveStateStore.reconciled = computeReconciled(
    reserveStateStore.executed,
    custodianAssets
  );
  reserveStateStore.custodianVariance = computeCustodianVariance(
    reserveStateStore.executed,
    custodianAssets
  );

  const hasException = reserveStateStore.reconciled.some(
    (a) => a.reconciliationStatus === "exception"
  );
  const allVerified = reserveStateStore.reconciled.every(
    (a) => a.reconciliationStatus === "verified"
  );
  reserveStateStore.reconciliationStatus = hasException
    ? "exception"
    : allVerified
      ? "verified"
      : "pending";
  return reserveStateStore;
}

/**
 * Per §12: Production execution disabled until institutional requirements satisfied.
 *
 * §29.2 / §29.10 — execution mode is now env-driven so the same code path can
 * run in three regimes without recompilation:
 *
 *   - SIMULATION (default, safe): auto-approves with all 5 institutional roles;
 *     executes against simulated custodian adapters. Used for testnet / dev.
 *   - SHADOW: §29 trigger detection + audit logging run live, but execution
 *     is gated behind manual institutional approval (severity-based thresholds
 *     enforced in execution-engine.ts `approveRebalanceProposal`).
 *   - LIVE: same as SHADOW for approval gating; additionally `isExecutionAllowed`
 *     returns false in `executeRebalanceProposal` so no custodian transaction
 *     is submitted without explicit human-in-the-loop authorization.
 *
 * The literal values "LIVE" / "SHADOW" are not in the historical
 * `ExecutionMode` union ("SIMULATION" | "PAPER" | "INSTITUTIONAL_TEST" |
 * "PRODUCTION"); they are returned via type assertion so callers that
 * compare `mode === "SIMULATION"` (the only check execution-engine.ts
 * makes for auto-approval) continue to work as intended.
 */
export function getExecutionMode(): ExecutionMode {
  const envMode = process.env.EXECUTION_MODE;
  // FIX (adversarial certification finding #2 — HIGH):
  // Production safety gate — if NODE_ENV=production, refuse to run in
  // SIMULATION mode (which auto-approves all rebalances with no human-in-loop).
  // This prevents accidental auto-approval in production if the operator
  // forgets to set EXECUTION_MODE=SHADOW or LIVE.
  if (process.env.NODE_ENV === "production" && (!envMode || envMode === "SIMULATION")) {
    console.error("[execution-mode] FATAL: NODE_ENV=production but EXECUTION_MODE is SIMULATION (or unset). " +
      "SIMULATION auto-approves all rebalances with no institutional approval. " +
      "Set EXECUTION_MODE=SHADOW or LIVE for production. Refusing to run.");
    return "SHADOW" as ExecutionMode; // safe fallback — requires manual approval
  }
  if (envMode === "LIVE") return "LIVE" as ExecutionMode;
  if (envMode === "SHADOW") return "SHADOW" as ExecutionMode;
  return "SIMULATION"; // default — safe for testnet/dev
}

export function isExecutionAllowed(): boolean {
  const mode = getExecutionMode();
  return mode === "SIMULATION" || mode === "PAPER" || mode === "INSTITUTIONAL_TEST" || mode === "PRODUCTION";
}

export function isRealExecutionAllowed(): boolean {
  return getExecutionMode() === "PRODUCTION";
}
