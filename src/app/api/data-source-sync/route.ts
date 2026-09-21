import { NextResponse } from "next/server";
import { fetchRealMarketData } from "@/lib/real-market-feeds";

/**
 * GET /api/data-source-sync
 *
 * Vercel cron job — runs daily at 6am UTC ("0 6 * * *").
 *
 * Triggers a fresh fetch of all real market data feeds (IMF COFER, BIS SDMX,
 * FRED VIX/credit-spreads/treasury, SWIFT, gold, silver, FX) and persists
 * observations to the DataSourceObservation table in Turso DB.
 *
 * Authentication: Vercel cron requests include `x-vercel-cron: 1` header.
 * If CRON_SECRET is set, requests must also include `Authorization: Bearer <secret>`.
 *
 * Honest-state: productionAuthorized=false. This sync does NOT authorize
 * production — it only refreshes reference data for the design-time engine.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Verify Vercel cron header
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const cronSecret = process.env.CRON_SECRET;

  if (!isVercelCron && !cronSecret) {
    return NextResponse.json(
      { ok: false, error: "Not authorized — must be called by Vercel cron or with CRON_SECRET" },
      { status: 401 },
    );
  }

  if (cronSecret) {
    const auth = request.headers.get("authorization") || "";
    const expected = `Bearer ${cronSecret}`;
    if (auth !== expected) {
      return NextResponse.json(
        { ok: false, error: "Invalid CRON_SECRET" },
        { status: 401 },
      );
    }
  }

  try {
    const startMs = Date.now();

    // Force a fresh fetch (bypasses the 60s cache by calling the internal
    // fetchRealMarketData directly — the cache is in-memory per-instance,
    // so each cron invocation on a fresh serverless instance is a fresh fetch)
    const data = await fetchRealMarketData();

    const elapsedMs = Date.now() - startMs;

    // Count persisted observations (best-effort, non-blocking)
    let observationCount = 0;
    try {
      const { getDataSourceObservations } = await import("@/lib/db");
      const all = await getDataSourceObservations(undefined, undefined, 1000);
      observationCount = all.length;
    } catch {
      // DB may not be available — best-effort
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      durationMs: elapsedMs,
      sourcesFetched: [
        { dataset: "COFER", provider: "IMF", ok: data.provenance.cofer.ok },
        { dataset: "Triennial Survey", provider: "BIS", ok: data.provenance.bis.ok },
        { dataset: "BIS EER", provider: "BIS", ok: data.provenance.bisEer?.ok ?? false },
        { dataset: "SWIFT RMB Tracker", provider: "SWIFT", ok: data.provenance.swift.ok },
        { dataset: "VIX", provider: data.provenance.vix.provider || "FRED", ok: data.provenance.vix.ok },
        { dataset: "Credit Spread", provider: data.provenance.creditSpread.provider || "FRED", ok: data.provenance.creditSpread.ok },
        { dataset: "10yr Treasury", provider: data.provenance.tnx10y?.provider || "FRED", ok: data.provenance.tnx10y?.ok ?? false },
      ],
      totalObservationsInDb: observationCount,
      honestState: {
        productionAuthorized: false,
        note: "Data-source sync is a design-time reference data refresh. Not production authorization.",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
