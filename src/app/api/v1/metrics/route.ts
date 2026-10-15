import { NextResponse } from "next/server";
import { STRESS_METRICS } from "@/lib/demo-data";

/**
 * LIVE API Route — Stress Test Metrics.
 *
 *   GET /api/v1/metrics
 *
 * Serves the STRESS_METRICS object (KPI summary) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: StressMetrics, count: number, timestamp: ISO, source: "live-api" }
 *
 * `count` is 1 because the payload is a single object (kept for envelope
 * consistency with the array routes).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 80));

  return NextResponse.json({
    ok: true,
    data: STRESS_METRICS,
    count: 1,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
