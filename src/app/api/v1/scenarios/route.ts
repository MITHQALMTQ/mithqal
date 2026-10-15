import { NextResponse } from "next/server";
import { SCENARIO_TYPES } from "@/lib/demo-data";

/**
 * LIVE API Route — Scenario Types.
 *
 *   GET /api/v1/scenarios
 *
 * Serves the SCENARIO_TYPES array (10 scenarios) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: ScenarioType[], count: number, timestamp: ISO, source: "live-api" }
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 75));

  return NextResponse.json({
    ok: true,
    data: SCENARIO_TYPES,
    count: SCENARIO_TYPES.length,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
