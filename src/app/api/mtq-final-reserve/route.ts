// §V25.3 — Final MTQ Institutional Backing Architecture API
// Returns the comprehensive final reserve mathematical specification report.
import { NextResponse } from "next/server";
import { generateFinalReserveSpecReport, MODULE_ID } from "@/lib/mtq-final-reserve-spec";
import { enforceRateLimit } from "@/lib/rate-limit";

// R11: Switched from force-static → force-dynamic so the per-IP rate limit
// gate actually executes per request (force-static would prerender the
// response at build time and bypass the rate-limit check entirely). The
// underlying generator is deterministic, so response payloads are identical
// to the previous static output — only the cache strategy changes.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("mtq-final-reserve", request, 30, 60_000);
  if (rateLimited) return rateLimited;
  try {
    const report = generateFinalReserveSpecReport();
    return NextResponse.json(
      {
        ok: true,
        ...report,
        moduleId: MODULE_ID,
        _meta: {
          honestState: report.honestState,
          generatedAt: new Date().toISOString(),
          note:
            "Design-time specification engine. All reserve inputs are policy reference values, NOT live oracle feeds. No bank/provider/asset is contracted.",
        },
      },
      { headers: { "X-Module-Id": MODULE_ID, "X-Spec-Status": "CONTROLLING" } },
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown error", moduleId: MODULE_ID },
      { status: 500 },
    );
  }
}
