import { NextResponse } from "next/server";
import { DEMO_INSTITUTIONS } from "@/lib/demo-data";

/**
 * LIVE API Route — Institutions.
 *
 *   GET /api/v1/institutions
 *
 * Serves the DEMO_INSTITUTIONS array (4 institutions) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: DemoInstitution[], count: number, timestamp: ISO, source: "live-api" }
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 70));

  return NextResponse.json({
    ok: true,
    data: DEMO_INSTITUTIONS,
    count: DEMO_INSTITUTIONS.length,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
