import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  DEFAULT_ALL_PILOT_GATES,
  canPassWithImplementationOnly,
  recomputeStatusInPlace,
  getGate,
  getGatesForPilotMode,
  getPassedGates,
  getBlockedGates,
  getPendingGates,
  PILOT_GATE_FIELDS,
  PILOT_GATE_FIELD_COUNT,
  PILOT_GATE_FRAMEWORK_STATUS,
  PILOT_GATE_FRAMEWORK_VERSION,
  PILOT_GATE_FRAMEWORK_SOURCE,
  NO_CODE_ONLY_PASS_RULE,
  INSTITUTIONAL_VALIDATION_SEPARATE_RULE,
  EVIDENCE_NOT_DOCUMENTATION_RULE,
} from "@/lib/pilot-gate-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("pilot-gates", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const gateId = url.searchParams.get("gateId");
  const pilotModeId = url.searchParams.get("pilotModeId");
  const checkCodeOnlyPass =
    url.searchParams.get("checkCodeOnlyPass") === "true";

  // Use DEFAULT_ALL_PILOT_GATES as the gate set (in production, this would
  // come from a database). We never mutate the shared module-level array;
  // recomputeStatusInPlace returns a shallow clone with the recomputed status.
  const allGates = DEFAULT_ALL_PILOT_GATES.map((g) =>
    recomputeStatusInPlace(g, DEFAULT_ALL_PILOT_GATES)
  );

  if (checkCodeOnlyPass && gateId) {
    const gate = getGate(gateId, DEFAULT_ALL_PILOT_GATES);
    if (!gate) {
      return NextResponse.json(
        { error: `Gate ${gateId} not found` },
        { status: 404 }
      );
    }
    const result = canPassWithImplementationOnly(gate);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: PILOT_GATE_FRAMEWORK_SOURCE,
      },
      gateId,
      canPassWithImplementationOnly: result.canPass,
      reason: result.reason,
      rule: NO_CODE_ONLY_PASS_RULE,
    });
  }

  if (gateId) {
    const gate = getGate(gateId, allGates);
    if (!gate) {
      return NextResponse.json(
        { error: `Gate ${gateId} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: PILOT_GATE_FRAMEWORK_SOURCE,
      },
      gate,
    });
  }

  if (pilotModeId) {
    const gates = getGatesForPilotMode(pilotModeId, allGates);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: PILOT_GATE_FRAMEWORK_SOURCE,
      },
      pilotModeId,
      gates,
      count: gates.length,
      passedGates: getPassedGates(gates).length,
      blockedGates: getBlockedGates(gates).length,
      pendingGates: getPendingGates(gates).length,
    });
  }

  // Default: return all gates + rules
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: PILOT_GATE_FRAMEWORK_SOURCE,
      version: PILOT_GATE_FRAMEWORK_VERSION,
      status: PILOT_GATE_FRAMEWORK_STATUS,
      overrideRule:
        "Pilot gate framework. Evidence-based, not documentation-volume. 11 fields per gate. No gate passes on code/tests alone. Institutional validation separate from implementation.",
      noCodeOnlyPassRule: NO_CODE_ONLY_PASS_RULE,
      institutionalValidationSeparateRule: INSTITUTIONAL_VALIDATION_SEPARATE_RULE,
      evidenceNotDocumentationRule: EVIDENCE_NOT_DOCUMENTATION_RULE,
    },
    fieldCount: PILOT_GATE_FIELD_COUNT,
    fields: PILOT_GATE_FIELDS,
    gates: allGates,
    gateCount: allGates.length,
    pilotAGateCount: getGatesForPilotMode(
      "PILOT_A_CONTROL_PLANE",
      allGates
    ).length,
    pilotBGateCount: getGatesForPilotMode(
      "PILOT_B_MTQ_SETTLEMENT",
      allGates
    ).length,
    passedGates: getPassedGates(allGates).length,
    blockedGates: getBlockedGates(allGates).length,
    pendingGates: getPendingGates(allGates).length,
    rule: "Each gate has 11 fields. Gate is PASSED only when: (1) implementationStatus=TESTED, (2) institutionalValidationStatus=APPROVED, (3) expiry.isExpired=false, (4) all dependencies PASSED. Code existing + tests passing does NOT automatically pass a gate.",
  });
}
