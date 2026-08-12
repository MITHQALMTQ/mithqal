import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { validateRebalanceProposal } from "@/lib/execution-engine";

/** POST /api/rebalance/validate — Validate a proposal (PROPOSED → VALIDATED or REJECTED). */
export async function POST(request: Request) {
  // P1: Auth required only in non-SIMULATION modes (testnet = open, production = authenticated)
  const { getExecutionMode } = await import('@/lib/reserve-state');
  if (getExecutionMode() !== 'SIMULATION') {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized — institutional authentication required" }, { status: 401 });
  }
  try {
    const { proposalId } = await request.json();
    const proposal = validateRebalanceProposal(proposalId);
    return NextResponse.json({ ok: true, proposal });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
