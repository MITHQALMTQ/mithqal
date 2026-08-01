import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { db, ensureSchema } from "@/lib/db";
import {
  anomalyDetection,
  type TransactionLike,
} from "@/lib/mithqal-brain";

/**
 * GET /api/brain/anomaly — AI Transaction Anomaly Detection (public, read-only).
 *
 * Fetches the 25 most-recent on-chain MTQ transactions from the indexer
 * and dispatches them to the Brain's 3 upstream models in parallel for
 * anomaly screening. Returns a list of structured findings + consensus.
 *
 * Response:
 *   {
 *     anomalies: [{ txHash, type, reason, severity }],
 *     consensus: "high" | "medium" | "low",
 *     models: [{ model, label, ok, confidence, latencyMs }],
 *     combinedAnswer: string,
 *     scannedCount: number,
 *     timestamp: ISO string
 *   }
 *
 * Rate limit: 5 / minute / IP (matches the other Brain endpoints).
 *
 * Trust model:
 *   Public, read-only. The transactions scanned are already public on
 *   Monad Testnet — anomaly detection is a transparency feature.
 */
export async function GET(req: Request) {
  // Public, read-only — but rate-limited.
  const blocked = enforceRateLimit("brain-anomaly", req, 5, 60_000);
  if (blocked) return blocked;

  try {
    // Fetch the 25 most-recent transactions. If the indexer DB is
    // unreachable (cold-start, network, etc.), we degrade gracefully:
    // dispatch to the Brain with an empty tx list (the Brain will
    // return "low" consensus + a note that there were no txs to scan)
    // rather than 500'ing — operators can still see the model cards
    // and consensus badge.
    let transactions: TransactionLike[] = [];
    try {
      await ensureSchema();
      const txs = await db.transactions.findMany({
        orderBy: { timestamp: "desc" },
        take: 25,
      });
      transactions = txs.map((t) => ({
        txHash: t.txHash,
        type: t.type,
        fromAddress: t.fromAddress,
        toAddress: t.toAddress,
        amount: t.amount,
        fee: t.fee,
        timestamp: t.timestamp,
        blockNumber: t.blockNumber ?? null,
      }));
    } catch (dbErr) {
      console.warn(
        "[brain/anomaly] tx fetch failed, dispatching with empty list:",
        dbErr instanceof Error ? dbErr.message : dbErr
      );
    }

    // Dispatch to the Brain.
    const { response, anomalies } = await anomalyDetection(transactions);

    return NextResponse.json({
      anomalies,
      consensus: response.consensus,
      models: response.models.map((m) => ({
        model: m.model,
        label: m.label,
        ok: m.ok,
        confidence: m.confidence,
        latencyMs: m.latencyMs,
        error: m.error,
      })),
      combinedAnswer: response.combinedAnswer,
      scannedCount: transactions.length,
      timestamp: response.timestamp,
    });
  } catch (err) {
    console.error("brain anomaly detection failed:", err);
    return NextResponse.json(
      {
        error: "Brain anomaly detection failed.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
