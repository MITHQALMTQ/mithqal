import { NextResponse } from "next/server";
import { DEMO_EVENTS } from "@/lib/demo-data";

/**
 * LIVE API Route — Evidence Events.
 *
 *   GET /api/v1/events
 *   GET /api/v1/events?caseId=VC-DEMO-2001   → events for a specific case
 *
 * Serves the DEMO_EVENTS array (30 events) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: DemoEvent[], count: number, timestamp: ISO, source: "live-api" }
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");

  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 90));

  let data = DEMO_EVENTS;
  if (caseId) data = data.filter((e) => e.caseId === caseId);

  return NextResponse.json({
    ok: true,
    data,
    count: data.length,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
