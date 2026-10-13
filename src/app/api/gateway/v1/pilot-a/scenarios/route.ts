import { NextResponse } from "next/server";
import { PILOT_A_SCENARIOS, RECONCILIATION_TOLERANCE_REGISTRY } from "@/lib/pilot-a-scenarios";
import { assertMtqEnabled, getMtqPilotStage } from "@/lib/mtq-gate";

export async function GET() {
  const mtqGate = assertMtqEnabled("pilot-a-info");
  return NextResponse.json({
    endpoint: "/gateway/v1/pilot-a/scenarios",
    method: "GET",
    blueprint_ref: "v26.0 §8.9 Pilot A scenario matrix",
    scenarios: PILOT_A_SCENARIOS,
    reconciliationClasses: RECONCILIATION_TOLERANCE_REGISTRY.map(r => ({ ruleId: r.ruleId, class: r.reconciliationClass, tolerance: r.tolerance, numericThreshold: r.numericThreshold, unit: r.unit, blueprint_ref: r.blueprint_ref })),
    mtqGate: { enabled: mtqGate.ok, denied: !mtqGate.ok, pilotStage: getMtqPilotStage(), reason: mtqGate.reason },
    honestState: { simulated: true, productionAuthorized: false, mtqDisabled: !mtqGate.ok, note: "Pilot A control-plane demonstration with MTQ disabled per v26.0 §3.2. All scenarios use synthetic fixtures — no real-value path." },
  });
}
