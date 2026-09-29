import { NextResponse } from "next/server";
import { generateProtectedBackingCellReport, MODULE_ID } from "@/lib/protected-backing-cell";
import { mtqDisabledResponse } from "@/lib/mtq-settlement-config";

// ---- v25.3.2 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary ----
// This route is MTQ-specific (protected backing cell report for MTQ).
// When MTQ_SETTLEMENT_ENABLED = false, it returns 503 immediately.
// The control plane (/api/control-plane/*) remains operational.
// See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md.
export const dynamic = "force-static";
export async function GET() {
  // v25.3.2: MTQ_SETTLEMENT_MODULE gate. When MTQ_SETTLEMENT_ENABLED = false,
  // return 503 immediately (the control plane remains usable — see
  // /api/control-plane/settlement-status).
  const mtqDisabled = mtqDisabledResponse();
  if (mtqDisabled) return mtqDisabled;

  try {
    return NextResponse.json({ ok: true, ...generateProtectedBackingCellReport(), moduleId: MODULE_ID });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }
}
