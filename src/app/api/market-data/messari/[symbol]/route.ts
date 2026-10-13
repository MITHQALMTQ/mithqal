// GET /api/market-data/messari/[symbol]
// Returns Messari asset metrics (price, volume, market cap) per v26.0 §3.x + §8.3.
//
// v26.0 §5.5 — Provenance labels (MEASURED, EXTERNAL_SOURCE, ASSUMED, UNKNOWN)
// are surfaced on every market data claim.
//
// v26.0 §3.5 — Pilot A: market data is SIMULATED/EXTERNAL_SOURCE advisory only;
// never authoritative for backing or finality.
//
// Auth: PUBLIC (read-only). Rate-limited per IP.
import { NextResponse } from "next/server";
import { getMessariAssetMetrics } from "@/lib/market-data";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const block = enforceRateLimit("market-data-messari", req, 30, 60_000);
  if (block) return block;

  const { symbol } = await params;
  if (!symbol || symbol.length > 16) {
    return NextResponse.json(
      { error: "Invalid symbol.", blueprint_ref: "v26.0 §8.3" },
      { status: 400 },
    );
  }

  try {
    const metrics = await getMessariAssetMetrics(symbol);
    const hasApiKey = Boolean(process.env.MESSARI_API_KEY);
    const isAvailable = !Number.isNaN(metrics.priceUsd);
    const status: "EXTERNAL_SOURCE" | "ASSUMED" | "UNKNOWN" = hasApiKey
      ? isAvailable
        ? "EXTERNAL_SOURCE"
        : "UNKNOWN"
      : "ASSUMED";

    return NextResponse.json(
      {
        endpoint: `/api/market-data/messari/${symbol}`,
        method: "GET",
        blueprint_ref: "v26.0 §8.3 (CPI economic cost) + §3.x (reserve composition) + §5.5 (provenance)",
        symbol: symbol.toUpperCase(),
        metrics,
        provenance: {
          status,
          source: hasApiKey ? "messari" : "MESSARI_API_KEY not configured",
          date: metrics.timestamp,
        },
        pilotA_notice:
          "Per v26.0 §3.5, market data is SIMULATED/EXTERNAL_SOURCE advisory only; " +
          "never authoritative for backing or finality in Pilot A.",
      },
      { headers: { "X-Blueprint-Ref": "v26.0 §8.3" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Failed to fetch Messari metrics.",
        detail: message,
        blueprint_ref: "v26.0 §8.3",
        provenance: { status: "UNKNOWN", source: "messari", date: new Date().toISOString() },
      },
      { status: 503 },
    );
  }
}
