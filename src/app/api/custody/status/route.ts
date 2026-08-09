import { NextResponse } from "next/server";
import { getExecutionMode, isReserveStateInitialized, initializeReserveState, getReserveState } from "@/lib/reserve-state";
import { listCustodians } from "@/lib/custodian-adapter";

/** GET /api/custody/status — Custody infrastructure status. */
export async function GET() {
  const mode = getExecutionMode();
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  const state = getReserveState();
  return NextResponse.json({
    ok: true,
    executionMode: mode,
    isSimulation: mode === "SIMULATION",
    custodians: listCustodians(),
    reconciliation: {
      status: state.reconciliationStatus,
      lastReconciliation: state.lastReconciliation,
      custodianVariance: state.custodianVariance,
    },
    reserveStateVersion: state.reserveStateVersion,
  });
}
