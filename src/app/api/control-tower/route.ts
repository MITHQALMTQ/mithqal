import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { CONTROL_TOWER_DATA } from "@/lib/institutionalization-control-tower";

// ============================================================================
// /api/control-tower — Institutionalization Control Tower endpoint
// ============================================================================
//
// Task ID: CT-UI
// Single source of truth for the question:
//   "What prevents MITHQAL from being institutionally deployable today?"
//
// This endpoint serves the canonical Control Tower data layer authored in
// `src/lib/institutionalization-control-tower.ts`. It is a pure RENDER of
// the honest-state derived from the 10 frozen schemas — no computation,
// no aggregation, no vanity metrics. The data is what it is.
//
// HONEST-STATE DISCIPLINE (non-negotiable):
//   - productionAuthorized = false
//   - 9 P0 deployment blockers (all external)
//   - 0 banks, 0 signed contracts, 0 FTE, 0/15 gates, $0 cash
//   - All legal/accounting/prudential classifications PENDING_EXTERNAL_VALIDATION
//
// NO VANITY METRICS:
//   - No "X% complete" for institutional readiness (it is meaningless)
//   - Binary state: NOT_DEPLOYABLE + specific blockers
//
// Rate-limited at 30 req/min per IP — institutional-grade, consistent with
// the R11/N1/O1/O2/P1/P2/Q1/Q2/R2 endpoint policy applied to the other
// canonical endpoints (architecture-freeze, contradiction-sweep, etc.).
// ============================================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // 30 req/min per IP — generous for institutional use, prevents abuse.
  const rateLimited = enforceRateLimit("control-tower", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    ok: true,
    data: CONTROL_TOWER_DATA,
  });
}
