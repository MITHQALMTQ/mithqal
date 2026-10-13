// GET /api/gateway/v1/gates
// v26.0 §9.1 + §9.2 — G0..G11 critical-path gates + 20-control legacy mapping.
import { NextResponse } from "next/server";
import { G0_G11_GATE_DEFINITIONS, LEGACY_20_GATE_MAP } from "@/lib/gate-definitions";

export async function GET() {
  const gates = G0_G11_GATE_DEFINITIONS.map(g => ({
    gateId: g.gateId,
    gateDefinition: g,
    latestDecision: null,
    legacyControls: LEGACY_20_GATE_MAP.filter(c => c.primaryGateMapping.includes(g.gateId)),
  }));
  return NextResponse.json({
    endpoint: "/gateway/v1/gates",
    method: "GET",
    blueprint_ref: "v26.0 §9.1 + §9.2 + Appendix B.4",
    gates,
    legacyControlMap: LEGACY_20_GATE_MAP,
    note: "Per v26.0 §9.2: G0–G11 is the institutional roadmap; the 20 controls are detailed evidence requirements. Do not collapse these into one ambiguous counter.",
  });
}
