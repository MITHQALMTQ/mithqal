// GET /api/gateway/v1/risk-register
// Returns the 7 stop/pivot rules + 10 risk entries + implementation contract artifacts per v1.0 §14 + §15.
// HONEST STATE: DESIGN-STAGE — all entries are SYNTHETIC Pilot A data.
import { NextResponse } from "next/server";
import { checkStopPivotRules, getRiskEntries } from "@/lib/risk-register";
import { getArtifactStatus, IMPLEMENTATION_MANDATE, CHANGE_CONTROL_STEPS } from "@/lib/implementation-contract";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    const stopPivot = checkStopPivotRules();
    const risks = getRiskEntries();
    const artifacts = getArtifactStatus();

    return NextResponse.json(
      {
        endpoint: "/gateway/v1/risk-register",
        method: "GET",
        description:
          "Returns the 7 stop/pivot rules (§14), 10 risk entries (§14), and implementation contract artifacts status (§15).",
        status: "OK",
        blueprint_ref: "v1.0 §14 + v1.0 §15",
        honestState: "DESIGN-STAGE",

        // §14 stop/pivot rules
        stopPivotRules: stopPivot.rules,
        stopPivotSummary: stopPivot.summary,

        // §14 risk register
        riskEntries: risks,
        riskEntryCount: risks.length,

        // §15 implementation contract — artifacts + mandate + change control
        implementationContract: {
          mandate: IMPLEMENTATION_MANDATE,
          changeControlSteps: CHANGE_CONTROL_STEPS,
          artifacts: artifacts.artifacts,
          artifactSummary: artifacts.summary,
        },

        timestamp,
      },
      { headers: { "X-Endpoint-Status": "SYNTHETIC" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Risk register endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v1.0 §14 + v1.0 §15",
      },
      { status: 500 },
    );
  }
}
