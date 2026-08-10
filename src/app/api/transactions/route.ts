import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * GET /api/transactions — public, unauthenticated list of recent on-chain
 * MTQ transactions recorded by the Operating System indexer.
 *
 * Query params:
 *   ?type=mint|redeem|transfer   (optional filter by transaction type)
 *   ?limit=50                     (max 200, default 50)
 *
 * Returns:
 *   {
 *     transactions: Transaction[],  // each with an ISO timestamp
 *     total: number,                // count of transactions matching the filter
 *     feeSummary: { feeType, totalUsd, count }[]  // aggregated fees by type
 *   }
 *
 * Constitutional context:
 *   All mint/redeem/transfer operations are recorded on-chain (Monad Testnet)
 *   and indexed into the `transactions` table for transparency. Fees are
 *   recorded in the `fees` table per §9 of the v19.0.3 specification.
 */
export async function GET(req: Request) {
  try {
    await ensureSchema();

    const url = new URL(req.url);
    const typeParam = url.searchParams.get("type");
    const limitParam = url.searchParams.get("limit");

    // Validate type filter
    const validTypes = new Set(["mint", "redeem", "transfer"]);
    const type =
      typeParam && validTypes.has(typeParam) ? typeParam : undefined;

    // Validate limit (default 50, max 200, min 1)
    let limit = 50;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(Math.floor(parsed), 200);
      }
    }

    // Fetch transactions (and the matching total count) in parallel
    const where = type ? { type } : undefined;
    const [txs, total, feeSummary] = await Promise.all([
      db.transactions.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: limit,
      }),
      db.transactions.count(),
      db.fees.total(),
    ]);

    const transactions = txs.map((tx) => ({
      ...tx,
      // `timestamp` is stored as unixepoch seconds — expose an ISO string
      // for client convenience (UI, dashboards, exports).
      timestampIso: new Date(tx.timestamp * 1000).toISOString(),
    }));

    return NextResponse.json({
      transactions,
      total,
      feeSummary,
      filter: type ? { type } : null,
      limit,
    });
  } catch (err) {
    console.error("transactions list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load transactions.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
