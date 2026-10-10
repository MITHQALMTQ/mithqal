// GET /api/gateway/v1/gates
// v26.0 §9.1 + §9.2 — G0..G11 critical-path gates + 20-control legacy mapping.
import { NextResponse } from "next/server";
import {
  G0_G11_GATE_DEFINITIONS,
  LEGACY_20_GATE_MAP,
} from "@/lib/gate-definitions";
import { getWriterStatusSummary } from "@/lib/db-authoritative";

export async function GET() {
  const writerSummary = getWriterStatusSummary();
  return NextResponse.json(
    {
      status: "OK",
      honestState: writerSummary.honestState,
      demoOnly: writerSummary.demoOnly,
      productionAuthorized: writerSummary.productionAuthorized,
      gates: {
        canonicalGrid: G0_G11_GATE_DEFINITIONS,
        legacy20Controls: LEGACY_20_GATE_MAP,
      },
      counts: {
        canonicalGates: G0_G11_GATE_DEFINITIONS.length,
        legacyControls: LEGACY_20_GATE_MAP.length,
      },
      notes: [
        "G0..G11 is the v26.0 decision surface.",
        "The 20-control legacy grid is preserved for audit traceability; it MUST NOT be used as the decision surface.",
        "Each gate has a minimum exit condition and a default failure behavior; decisions are persisted as GateDecision rows in Neon.",
      ],
      blueprintRef: "v26.0 §9.1 + §9.2 + §11.3 D-010",
      timestamp: new Date().toISOString(),
    },
    { status: 200, headers: { "X-Endpoint-Status": "OK" } },
  );
}
