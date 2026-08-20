// §V25.2 — Final MTQ Institutional Backing Architecture API
// Returns the comprehensive final reserve mathematical specification report.
import { NextResponse } from "next/server";
import { generateFinalReserveSpecReport, MODULE_ID } from "@/lib/mtq-final-reserve-spec";

export const dynamic = "force-static";

export async function GET() {
  try {
    const report = generateFinalReserveSpecReport();
    return NextResponse.json(
      {
        ok: true,
        moduleId: MODULE_ID,
        ...report,
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
