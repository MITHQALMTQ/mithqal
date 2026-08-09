import { NextResponse } from "next/server";
import { generateRebalanceProposal, getAllProposals } from "@/lib/execution-engine";
import { getReserveState, isReserveStateInitialized, initializeReserveState } from "@/lib/reserve-state";

/**
 * GET /api/rebalance/plan — List all rebalance proposals.
 * POST /api/rebalance/plan — Generate a new rebalance proposal.
 *
 * POST body: { actions: [{ assetClass, action, quantity, unit, reason }] }
 */
export async function GET() {
  return NextResponse.json({ ok: true, proposals: getAllProposals() });
}

export async function POST(request: Request) {
  if (!isReserveStateInitialized()) {
    initializeReserveState(4076.9, 58.76, { gold: 0.155, silver: 0.039, cash: 0.50, sovereign: 0.24, stablecoin: 0.05 });
  }
  try {
    const body = await request.json();
    const state = getReserveState();
    const proposal = generateRebalanceProposal(state, body.actions, `oracle-${Date.now()}`);
    return NextResponse.json({ ok: true, proposal });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
