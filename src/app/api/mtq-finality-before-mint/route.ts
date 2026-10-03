import { NextResponse } from "next/server";
import { generateFinalityReport, MODULE_ID } from "@/lib/finality-before-mint";
import { enforceRateLimit } from "@/lib/rate-limit";

// R11: force-dynamic so the per-IP rate limit check executes per request
// (force-static would prerender and bypass the gate). The generator is
// deterministic, so response payloads are unchanged.
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("mtq-finality-before-mint", request, 30, 60_000);
  if (rateLimited) return rateLimited;
  try {
    return NextResponse.json({ ok: true, ...generateFinalityReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
