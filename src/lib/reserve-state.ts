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
 * Phase 3 of the institutional execution architecture implementation.
 * Status: SIMULATED (testnet) — uses in-memory persistence.
 */

export type AssetClass = "gold" | "silver" | "cash" | "sovereign" | "stablecoin";
export type Currency = "USD" | "EUR" | "JPY" | "GBP" | "CNY" | "CHF" | "AUD" | "CAD";
export type SettlementStatus = "pending" | "settled" | "failed" | "cancelled";
export type ReconciliationStatus = "verified" | "pending" | "exception" | "suspended";
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

// Initial state mirrors the FIXED constants from reserve-allocation.ts
const INITIAL_GOLD_OZ = 2122.86;
const INITIAL_SILVER_OZ = 36758;
const INITIAL_CASH_USD = 29_000_000; // v19.0.2 §19.2 canonical over-collateralization baseline
const INITIAL_SOVEREIGN_USD = 13_500_000;
const INITIAL_STABLECOIN_USD = 2_700_000;

let stateVersion = 0;
let reserveStateStore: ReserveState | null = null;

export function initializeReserveState(
  goldPrice: number,
  silverPrice: number,
  targetWeights: { gold: number; silver: number; cash: number; sovereign: number; stablecoin: number }
): ReserveState {
  const now = new Date().toISOString();
  stateVersion = 0;

  const makeAsset = (
    assetId: string,
    assetClass: AssetClass,
    quantity: number,
    unit: "oz" | "USD",
    marketPrice: number,
    targetWeight: number,
    min: number,
    max: number
  ): ReserveAssetState => ({
    assetId, assetClass, currency: "USD", quantity, unit, marketPrice,
    valuationCurrency: "USD", valuationTimestamp: now,
    targetWeight, actualWeight: 0, permittedMinimum: min, permittedMaximum: max,
    custodianId: assetClass === "gold" || assetClass === "silver" ? "sim-vault-01" : "sim-bank-01",
    custodyAccountId: `sim-${assetClass}-account`,
    transactionRef: null, settlementStatus: "settled", reconciliationStatus: "verified",
    dataSourceId: "initial-baseline", verificationTimestamp: now,
  });

  const goldValue = INITIAL_GOLD_OZ * goldPrice;
  const silverValue = INITIAL_SILVER_OZ * silverPrice;
  const totalValue = INITIAL_CASH_USD + INITIAL_SOVEREIGN_USD + goldValue + silverValue + INITIAL_STABLECOIN_USD;

  const assets: ReserveAssetState[] = [
    makeAsset("gold-primary", "gold", INITIAL_GOLD_OZ, "oz", goldPrice, targetWeights.gold, 0.10, 0.30),
    makeAsset("silver-primary", "silver", INITIAL_SILVER_OZ, "oz", silverPrice, targetWeights.silver, 0.005, 0.12),
    makeAsset("cash-primary", "cash", INITIAL_CASH_USD, "USD", 1, targetWeights.cash, 0.25, 0.60),
    makeAsset("sovereign-primary", "sovereign", INITIAL_SOVEREIGN_USD, "USD", 1, targetWeights.sovereign, 0.20, 0.50),
    makeAsset("stablecoin-primary", "stablecoin", INITIAL_STABLECOIN_USD, "USD", 1, targetWeights.stablecoin, 0.00, 0.10),
  ];

  for (const a of assets) {
    const value = a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity;
    a.actualWeight = value / totalValue;
  }

  reserveStateStore = {
    reserveStateVersion: 0, algorithmVersion: "v19.0.3", constitutionVersion: "v19.0.3",
    oracleSnapshotVersion: "init", executionVersion: "1.0.0-simulation", timestamp: now,
    target: assets.map((a) => ({ ...a, dataSourceId: "constitutional-engine" })),
    executed: assets.map((a) => ({ ...a, dataSourceId: "internal-ledger" })),
    custodian: assets.map((a) => ({ ...a, dataSourceId: "custodian-confirmation" })),
    reconciled: assets.map((a) => ({ ...a, dataSourceId: "reconciliation-engine" })),
    lastReconciliation: now, reconciliationStatus: "verified", custodianVariance: 0,
  };

  return reserveStateStore;
}

export function getReserveState(
  goldPrice?: number, silverPrice?: number,
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

  reserveStateStore.reconciliationStatus = "pending";
  return reserveStateStore;
}

/** Update the custodian-confirmed state after reconciliation. */
export function commitCustodianConfirmation(custodianAssets: ReserveAssetState[]): ReserveState {
  if (!reserveStateStore) throw new Error("Reserve state not initialized");
  const now = new Date().toISOString();
  stateVersion++;
  reserveStateStore.reserveStateVersion = stateVersion;
  reserveStateStore.timestamp = now;
  reserveStateStore.custodian = custodianAssets;
  reserveStateStore.lastReconciliation = now;

  reserveStateStore.reconciled = reserveStateStore.executed.map((exec) => {
    const cust = custodianAssets.find((c) => c.assetId === exec.assetId);
    if (!cust) return { ...exec, reconciliationStatus: "exception" as const };
    const match = Math.abs(exec.quantity - cust.quantity) < 0.001;
    return { ...exec, reconciliationStatus: match ? ("verified" as const) : ("exception" as const), verificationTimestamp: now };
  });

  let variance = 0;
  for (const exec of reserveStateStore.executed) {
    const cust = custodianAssets.find((c) => c.assetId === exec.assetId);
    if (cust) {
      const execValue = exec.unit === "oz" ? exec.quantity * exec.marketPrice : exec.quantity;
      const custValue = cust.unit === "oz" ? cust.quantity * cust.marketPrice : cust.quantity;
      variance += Math.abs(execValue - custValue);
    }
  }
  reserveStateStore.custodianVariance = variance;

  const hasException = reserveStateStore.reconciled.some((a) => a.reconciliationStatus === "exception");
  reserveStateStore.reconciliationStatus = hasException ? "exception" : "verified";
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
  if (envMode === "LIVE") return "LIVE" as ExecutionMode;
  if (envMode === "SHADOW") return "SHADOW" as ExecutionMode;
  return "SIMULATION"; // default — safe
}

export function isExecutionAllowed(): boolean {
  const mode = getExecutionMode();
  return mode === "SIMULATION" || mode === "PAPER" || mode === "INSTITUTIONAL_TEST" || mode === "PRODUCTION";
}

export function isRealExecutionAllowed(): boolean {
  return getExecutionMode() === "PRODUCTION";
}
