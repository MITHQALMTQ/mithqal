import { NextResponse } from "next/server";
import { STRESS_RESULTS } from "@/lib/demo-data";

/**
 * LIVE API Route — Stress Test Results.
 *
 *   GET /api/v1/results
 *
 * Serves the STRESS_RESULTS object (full stress test summary) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: StressResults, count: number, timestamp: ISO, source: "live-api" }
 *
 * `count` is 1 because the payload is a single object (kept for envelope
 * consistency with the array routes).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 85));

  return NextResponse.json({
    ok: true,
    data: STRESS_RESULTS,
    count: 1,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
