import { NextResponse } from "next/server";
import { getReserveState, isReserveStateInitialized, initializeReserveState, getExecutionMode } from "@/lib/reserve-state";

/**
 * GET /api/reserve/target — Target reserve state (what the engine recommends).
 */
export async function GET() {
  const mode = getExecutionMode();
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  const state = getReserveState();
  return NextResponse.json({
    ok: true,
    executionMode: mode,
    target: state.target.map((a) => ({
      assetId: a.assetId,
      assetClass: a.assetClass,
      targetWeight: a.targetWeight,
      permittedMinimum: a.permittedMinimum,
      permittedMaximum: a.permittedMaximum,
    })),
    reserveStateVersion: state.reserveStateVersion,
    algorithmVersion: state.algorithmVersion,
  });
}
