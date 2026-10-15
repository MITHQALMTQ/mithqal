import { NextResponse } from "next/server";
import { DEMO_EXCEPTIONS } from "@/lib/demo-data";

/**
 * LIVE API Route — Exceptions.
 *
 *   GET /api/v1/exceptions
 *   GET /api/v1/exceptions?severity=CRITICAL   → filter by severity
 *   GET /api/v1/exceptions?status=OPEN         → filter by exception status
 *
 * Serves the DEMO_EXCEPTIONS array (10 exceptions) as a LIVE API endpoint.
 *
 * Response envelope:
 *   { ok: true, data: DemoException[], count: number, timestamp: ISO, source: "live-api" }
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");

  // Simulate network latency so loading skeletons render visibly.
  await new Promise((r) => setTimeout(r, 110));

  let data = DEMO_EXCEPTIONS;
  if (severity) data = data.filter((e) => e.severity === severity);
  if (status) data = data.filter((e) => e.status === status);

  return NextResponse.json({
    ok: true,
    data,
    count: data.length,
    timestamp: new Date().toISOString(),
    source: "live-api",
  });
}
