import { NextResponse } from "next/server";
import { DEMO_CASES } from "@/lib/demo-data";

/**
 * LIVE API Route — Validation Cases.
 *
 *   GET /api/v1/cases
 *   GET /api/v1/cases?status=CLOSED          → filter by case status
 *   GET /api/v1/cases?corridor=AED→INR       → filter by corridor
 *   GET /api/v1/cases?caseId=VC-DEMO-2001    → single case
 *
 * Serves the DEMO_CASES array (20 cases) as a LIVE API endpoint so React Query
 * can poll it (refetchInterval = 30s in src/hooks/use-demo-data.ts).
 *
 * Response envelope:
 *   { ok: true, data: DemoCase[], count: number, timestamp: ISO, source: "live-api" }
 *
 * A small artificial delay (≈120ms) simulates network latency so loading
 * skeletons are visible on the dashboard.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const corridor = searchParams.get("corridor");
  const caseId = searchParams.get("caseId");

  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 120));

  let data = DEMO_CASES;
  if (status) data = data.filter((c) => c.status === status);
  if (corridor) data = data.filter((c) => c.corridor === corridor);
  if (caseId) data = data.filter((c) => c.id === caseId);

  return NextResponse.json({
    ok: true,
    data,
    count: data.length,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
