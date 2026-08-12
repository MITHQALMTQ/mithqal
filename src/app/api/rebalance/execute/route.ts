import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { executeRebalanceProposal, confirmSettlement } from "@/lib/execution-engine";
import { getExecutionMode } from "@/lib/reserve-state";

/**
 * POST /api/rebalance/execute — Execute an approved proposal.
 *
 * Per §12: In SIMULATION mode, executes against simulated custodian.
 * In PRODUCTION mode (disabled), would execute against real custodian APIs.
 *
 * Per §28: Idempotent — duplicate execution requests return the same result.
 */
export async function POST(request: Request) {
  // P1: Auth required only in non-SIMULATION modes (testnet = open, production = authenticated)
  const { getExecutionMode } = await import('@/lib/reserve-state');
  if (getExecutionMode() !== 'SIMULATION') {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized — institutional authentication required" }, { status: 401 });
  }
  const mode = getExecutionMode();
  try {
    const { proposalId, confirm } = await request.json() as { proposalId: string; confirm?: boolean };
    const result = await executeRebalanceProposal(proposalId);

    if (result.failed) {
      return NextResponse.json({ ok: false, error: result.failureReason, result }, { status: 500 });
    }

    // If confirm=true, also confirm settlement + update reserve state
    let reserveState = null;
    if (confirm && !result.failed) {
      reserveState = confirmSettlement(proposalId);
    }

    return NextResponse.json({
      ok: true,
      executionMode: mode,
      isSimulation: mode === "SIMULATION",
      result,
      reserveState: reserveState ? {
        reserveStateVersion: reserveState.reserveStateVersion,
        timestamp: reserveState.timestamp,
      } : null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
