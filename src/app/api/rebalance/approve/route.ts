import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { approveRebalanceProposal, type ApprovalRole } from "@/lib/execution-engine";

/** POST /api/rebalance/approve — Approve a proposal (VALIDATED → APPROVED). */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized — institutional authentication required" }, { status: 401 });
  try {
    const { proposalId, approvals } = await request.json() as {
      proposalId: string;
      approvals: Array<{ role: ApprovalRole; approved: boolean; reason?: string }>;
    };
    const proposal = approveRebalanceProposal(proposalId, approvals);
    return NextResponse.json({ ok: true, proposal });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
