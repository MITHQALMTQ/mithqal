import { NextResponse } from "next/server";
import { generateFinalityReport, MODULE_ID } from "@/lib/finality-before-mint";
import { enforceRateLimit } from "@/lib/rate-limit";
import { mtqDisabledResponse } from "@/lib/mtq-settlement-config";

// ---- v25.3.2 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary ----
// This route is MTQ-specific (finality-before-mint report for MTQ).
// When MTQ_SETTLEMENT_ENABLED = false, it returns 503 immediately.
// The control plane (/api/control-plane/*) remains operational.
// See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md.

// R11: force-dynamic so the per-IP rate limit check executes per request
// (force-static would prerender and bypass the gate). The generator is
// deterministic, so response payloads are unchanged.
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  // v25.3.2: MTQ_SETTLEMENT_MODULE gate. When MTQ_SETTLEMENT_ENABLED = false,
  // return 503 immediately (the control plane remains usable — see
  // /api/control-plane/settlement-status). Checked BEFORE the rate limiter
  // so disabled-mode responses are not rate-limited.
  const mtqDisabled = mtqDisabledResponse();
  if (mtqDisabled) return mtqDisabled;

  // R11: 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("mtq-finality-before-mint", request, 30, 60_000);
  if (rateLimited) return rateLimited;
  try {
    return NextResponse.json({ ok: true, ...generateFinalityReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
