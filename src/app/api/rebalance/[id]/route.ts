import { NextResponse } from "next/server";
import { getProposal, getExecutionResult } from "@/lib/execution-engine";

/** GET /api/rebalance/[id] — Get a proposal by ID + its execution result. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proposal = getProposal(id);
  if (!proposal) return NextResponse.json({ ok: false, error: "Proposal not found" }, { status: 404 });
  const executionResult = getExecutionResult(id);
  return NextResponse.json({ ok: true, proposal, executionResult });
}
