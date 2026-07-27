import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * GET /api/governance/proposals — public, unauthenticated list of
 * governance proposals indexed from the on-chain Governance contract.
 *
 * Query params:
 *   ?status=active|executed|defeated|pending   (optional filter)
 *
 * Returns:
 *   {
 *     proposals: Proposal[],
 *     governanceContract: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
 *     explorerLink: "https://testnet.monadscan.com/address/0xE35a..."
 *   }
 *
 * Constitutional context:
 *   The proposals table is populated by the indexer as it observes
 *   ProposalCreated / ProposalExecuted / ProposalDefeated events on the
 *   on-chain Governance contract. The table may be empty initially — that
 *   is expected and a normal pre-indexer state. An empty array is returned
 *   in that case (NOT an error).
 */
export async function GET(req: Request) {
  try {
    await ensureSchema();

    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const validStatuses = new Set([
      "active",
      "executed",
      "defeated",
      "pending",
    ]);
    const status =
      statusParam && validStatuses.has(statusParam) ? statusParam : undefined;

    const proposals = await db.proposals.findMany({
      where: status ? { status } : undefined,
      take: 50,
    });

    // Expose ISO timestamps for clients
    const formatted = proposals.map((p) => ({
      ...p,
      createdAtIso:
        p.createdAt != null
          ? new Date(p.createdAt * 1000).toISOString()
          : null,
    }));

    const GOVERNANCE_CONTRACT =
      "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66";
    const EXPLORER_BASE = "https://testnet.monadscan.com";

    return NextResponse.json({
      proposals: formatted,
      governanceContract: GOVERNANCE_CONTRACT,
      explorerLink: `${EXPLORER_BASE}/address/${GOVERNANCE_CONTRACT}`,
      filter: status ? { status } : null,
    });
  } catch (err) {
    console.error("governance proposals list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load governance proposals.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
