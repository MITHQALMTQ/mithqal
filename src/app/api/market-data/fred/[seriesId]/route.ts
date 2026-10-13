// GET /api/market-data/fred/[seriesId]
// Returns the latest FRED series observation per v26.0 §8.3 + §3.x.
//
// v26.0 §5.5 — Provenance labels (MEASURED, EXTERNAL_SOURCE, ASSUMED, UNKNOWN)
// are surfaced on every market data claim.
//
// Auth: PUBLIC (read-only). Rate-limited per IP.
import { NextResponse } from "next/server";
import { getFredSeries } from "@/lib/market-data";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ seriesId: string }> },
) {
  const block = enforceRateLimit("market-data-fred", req, 30, 60_000);
  if (block) return block;

  const { seriesId } = await params;
  if (!seriesId || seriesId.length > 64) {
    return NextResponse.json(
      { error: "Invalid seriesId.", blueprint_ref: "v26.0 §8.3" },
      { status: 400 },
    );
  }

  try {
    const series = await getFredSeries(seriesId);
    const hasApiKey = Boolean(process.env.FRED_API_KEY);
    const isAvailable = !Number.isNaN(series.value);
    const status: "EXTERNAL_SOURCE" | "ASSUMED" | "UNKNOWN" = hasApiKey
      ? isAvailable
        ? "EXTERNAL_SOURCE"
        : "UNKNOWN"
      : "ASSUMED";

    return NextResponse.json(
      {
        endpoint: `/api/market-data/fred/${seriesId}`,
        method: "GET",
        blueprint_ref: "v26.0 §8.3 (CPI) + §3.x (reserve composition) + §5.5 (provenance)",
        seriesId: seriesId.toUpperCase(),
        series,
        provenance: {
          status,
          source: hasApiKey ? "fred" : "FRED_API_KEY not configured",
          date: series.asOf,
        },
        pilotA_notice:
          "Per v26.0 §3.5, market data is SIMULATED/EXTERNAL_SOURCE advisory only.",
      },
      { headers: { "X-Blueprint-Ref": "v26.0 §8.3" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Failed to fetch FRED series.",
        detail: message,
        blueprint_ref: "v26.0 §8.3",
        provenance: { status: "UNKNOWN", source: "fred", date: new Date().toISOString() },
      },
      { status: 503 },
    );
  }
}
