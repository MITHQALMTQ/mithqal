import { NextResponse } from "next/server";
import { getDataSourceObservations } from "@/lib/db";

/**
 * GET /api/data-source-observations
 *
 * Returns persisted data-source observations from the DataSourceObservation table.
 * Supports query params: ?provider=IMF&dataset=COFER&limit=50
 *
 * This endpoint provides an auditable trail of every ingested observation,
 * including provenance (provider, dataset, series_key, reference_period,
 * retrieved_at, published_at, methodology_version, dataset_version).
 *
 * Honest-state: observations are persisted on a best-effort basis during
 * fetchRealMarketData() calls. The table is additive and idempotent
 * (INSERT OR IGNORE with unique index on provider+dataset+series_key+
 * reference_period+dataset_version).
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get("provider") || undefined;
    const dataset = url.searchParams.get("dataset") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    const observations = await getDataSourceObservations(provider, dataset, limit);

    // Group by provider+dataset for summary
    const byProvider: Record<string, number> = {};
    for (const obs of observations) {
      const key = `${obs.provider}/${obs.dataset}`;
      byProvider[key] = (byProvider[key] || 0) + 1;
    }

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      count: observations.length,
      filter: { provider, dataset, limit },
      observations,
      summary: byProvider,
      honestState: {
        productionAuthorized: false,
        note: "Observations are persisted best-effort during real-market-feeds fetches. Idempotent via unique index.",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
