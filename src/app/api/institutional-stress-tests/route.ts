import { NextResponse } from "next/server";
import { runAllStressTests, MODULE_ID } from "@/lib/institutional-stress-tests";
import { enforceRateLimit } from "@/lib/rate-limit";

// R11: force-dynamic so the per-IP rate limit check executes per request
// (force-static would prerender and bypass the gate). The stress engine is
// deterministic, so response payloads are unchanged.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("institutional-stress-tests", request, 30, 60_000);
  if (rateLimited) return rateLimited;
  try {
    const report = runAllStressTests();
    return NextResponse.json({ ok: true, moduleId: MODULE_ID, ...report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
