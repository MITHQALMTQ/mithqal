import { NextResponse } from "next/server";
import { validateRebalanceProposal } from "@/lib/execution-engine";

/** POST /api/rebalance/validate — Validate a proposal (PROPOSED → VALIDATED or REJECTED). */
export async function POST(request: Request) {
  try {
    const { proposalId } = await request.json();
    const proposal = validateRebalanceProposal(proposalId);
    return NextResponse.json({ ok: true, proposal });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
