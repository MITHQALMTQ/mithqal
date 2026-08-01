import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

/**
 * GET /api/proofs/latest — public transparency endpoint for the daily
 * constitutional proof attestations.
 *
 * Returns the most recent attestation for each of the 7 proof types
 * (reserve_ratio, nav, basket_sum, duration, lcr, cri, por_hash), plus a
 * short recent-days history so consumers can verify the daily cadence is
 * intact.
 *
 * This endpoint is PUBLIC (no auth) — it is the transparency mechanism
 * required by Article VII of the v19.0 Constitution: "daily cryptographic,
 * privacy-preserving solvency proof. Anyone with sufficient technical
 * capability can verify the reserve ratio independently."
 *
 * Query params:
 *   ?days=7   (how many recent days to include in the `history` array; default 7, max 90)
 *
 * Response shape:
 *   {
 *     ok: true,
 *     latest: ProofAttestation[],     // one row per proofType, from the latest date
 *     latestDate: string,             // YYYY-MM-DD (UTC) of the latest attestation set
 *     history: ProofAttestation[],    // flat list of recent rows, newest first
 *     generatedAt: string             // ISO 8601
 *   }
 *
 * If the ProofAttestation table is empty (e.g. before the first cron run),
 * returns 200 with `ok: true`, `latest: []`, `latestDate: null` so the
 * caller can render a "no proofs published yet" state without erroring.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    await ensureSchema();

    // Parse ?days=N (default 7, max 90)
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days");
    let days = 7;
    if (daysParam) {
      const parsed = Number(daysParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        days = Math.min(Math.floor(parsed), 90);
      }
    }

    const [latest, history] = await Promise.all([
      db.proofAttestation.latest(),
      db.proofAttestation.recentDays(days),
    ]);

    // Derive the latest attestation date from the latest set (or null if empty).
    const latestDate = latest.length > 0
      ? latest.reduce((max, r) => (r.date > max ? r.date : max), latest[0].date)
      : null;

    return NextResponse.json({
      ok: true,
      latest: latest.map(serializeProof),
      latestDate,
      history: history.map(serializeProof),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[proofs/latest] failed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load latest proof attestations.",
        detail: err instanceof Error ? err.message : "unknown error",
      },
      { status: 500 },
    );
  }
}

function serializeProof(p: {
  id: number;
  date: string;
  proofType: string;
  value: number;
  hash: string;
  timestamp: number;
}) {
  return {
    id: p.id,
    date: p.date,
    proofType: p.proofType,
    value: p.value,
    hash: p.hash,
    timestamp: p.timestamp,
    timestampIso: new Date(p.timestamp * 1000).toISOString(),
  };
}
