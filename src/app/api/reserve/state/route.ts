import { NextResponse } from "next/server";
import { getReserveState, isReserveStateInitialized, initializeReserveState, getExecutionMode } from "@/lib/reserve-state";
import { listCustodians } from "@/lib/custodian-adapter";

/**
 * GET /api/reserve/state — Authoritative reserve state (4 views).
 *
 * Per §34: Returns the current reserve state with all four views:
 *   - target (what the engine recommends)
 *   - executed (internal ledger)
 *   - custodian (custodian-confirmed)
 *   - reconciled (verified state)
 *
 * Per §33: Clearly labels SIMULATION vs REAL state.
 */
export async function GET() {
  const mode = getExecutionMode();

  // If not initialized, return the testnet baseline
  if (!isReserveStateInitialized()) {
    const goldPrice = 4076.9; // baseline
    const silverPrice = 58.76;
    const targetWeights = { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 };
    initializeReserveState(goldPrice, silverPrice, targetWeights);
  }

  const state = getReserveState();

  return NextResponse.json({
    ok: true,
    executionMode: mode,
    isSimulation: mode === "SIMULATION",
    reserveState: {
      reserveStateVersion: state.reserveStateVersion,
      algorithmVersion: state.algorithmVersion,
      constitutionVersion: state.constitutionVersion,
      oracleSnapshotVersion: state.oracleSnapshotVersion,
      executionVersion: state.executionVersion,
      timestamp: state.timestamp,
      lastReconciliation: state.lastReconciliation,
      reconciliationStatus: state.reconciliationStatus,
      custodianVariance: state.custodianVariance,
    },
    views: {
      target: state.target.map(formatAsset),
      executed: state.executed.map(formatAsset),
      custodian: state.custodian.map(formatAsset),
      reconciled: state.reconciled.map(formatAsset),
    },
    custodians: listCustodians(),
    disclaimer: mode === "SIMULATION"
      ? "SIMULATED reserve state — not actual institutional holdings"
      : "LIVE reserve state",
  });
}

function formatAsset(a: ReturnType<typeof getReserveState>["executed"][0]) {
  return {
    assetId: a.assetId,
    assetClass: a.assetClass,
    currency: a.currency,
    quantity: a.quantity,
    unit: a.unit,
    marketPrice: a.marketPrice,
    marketValue: a.unit === "oz" ? a.quantity * a.marketPrice : a.quantity,
    targetWeight: a.targetWeight,
    actualWeight: a.actualWeight,
    permittedMinimum: a.permittedMinimum,
    permittedMaximum: a.permittedMaximum,
    custodianId: a.custodianId,
    settlementStatus: a.settlementStatus,
    reconciliationStatus: a.reconciliationStatus,
    dataSourceId: a.dataSourceId,
    verificationTimestamp: a.verificationTimestamp,
  };
}
