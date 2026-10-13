import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  PILOT_MODES,
  PILOT_A_CONTROL_PLANE,
  PILOT_B_MTQ_SETTLEMENT,
  PILOT_DEPENDENCY_RULE,
  canEnablePilotB,
  getPilotMode,
  PILOT_MODES_STATUS,
  PILOT_MODES_VERSION,
  PILOT_MODES_SOURCE,
  type PilotModeId,
} from "@/lib/two-pilot-modes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("pilot-modes", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const pilotId = url.searchParams.get("pilotId") as PilotModeId | null;
  const checkDependency = url.searchParams.get("checkDependency") === "true";

  if (pilotId) {
    const pilot = getPilotMode(pilotId);
    if (!pilot) {
      return NextResponse.json(
        { error: `Invalid pilotId: ${pilotId}` },
        { status: 400 }
      );
    }
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: PILOT_MODES_SOURCE },
      pilot,
    });
  }

  if (checkDependency) {
    const result = canEnablePilotB(PILOT_A_CONTROL_PLANE);
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: PILOT_MODES_SOURCE },
      dependencyCheck: result,
      pilotDependencyRule: PILOT_DEPENDENCY_RULE,
    });
  }

  // Default: return both pilot modes + dependency rule
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: PILOT_MODES_SOURCE,
      version: PILOT_MODES_VERSION,
      status: PILOT_MODES_STATUS,
      overrideRule:
        "Two explicit pilot modes. Pilot A (Control Plane, MTQ optional). Pilot B (MTQ Settlement, gated). Dependency: A -> B (explicit, one-way).",
    },
    pilotModes: PILOT_MODES,
    pilotDependencyRule: PILOT_DEPENDENCY_RULE,
    rule: "Pilot A: 8 test areas (routing, liquidity optimization, compliance orchestration, reconciliation, evidence, finality coordination, failure management, bank integration). MTQ NOT required. Pilot B: 7 test areas (PBC, obligor, issuance, redemption, finality-before-mint, bank subledger, resolution). MTQ required. Pilot B ONLY enabled after Pilot A passes ALL 8 + legal/accounting prerequisites pass.",
  });
}
