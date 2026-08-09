import { NextResponse } from "next/server";
import { performReconciliation, getReconciliationStatus } from "@/lib/reconciliation";
import { getReserveState, isReserveStateInitialized, initializeReserveState } from "@/lib/reserve-state";

/**
 * GET /api/reserve/reconciliation — Current reconciliation status.
 * POST /api/reserve/reconciliation — Trigger a reconciliation.
 */
export async function GET() {
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  const state = getReserveState();
  const status = getReconciliationStatus(state);
  return NextResponse.json({ ok: true, ...status });
}

export async function POST() {
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  try {
    const result = await performReconciliation("exception");
    return NextResponse.json({ ok: true, reconciliation: result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
