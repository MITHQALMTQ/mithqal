import { NextResponse } from "next/server";
import { getMTQLifecycleState, attemptTransition, MTQ_PREREQUISITES, PILOT_B_META, type MTQState } from "@/lib/pilot-b-mtq-lifecycle";

export const dynamic = "force-dynamic";

/**
 * GET /api/pilot-b
 * Returns the current MTQ lifecycle state (MTQ_DISABLED by default).
 */
export async function GET() {
  const state = getMTQLifecycleState(false);
  return NextResponse.json({
    ok: true,
    meta: PILOT_B_META,
    state,
    prerequisites: MTQ_PREREQUISITES,
    honestState: {
      mtqDisabled: state.honestState.mtqDisabled,
      mtqActiveRequiresExternalEvidence: state.honestState.mtqActiveRequiresExternalEvidence,
      notReachableFromConfigAlone: state.honestState.notReachableFromConfigAlone,
      productionAuthorized: false,
    },
  });
}

/**
 * POST /api/pilot-b
 * Attempt a state transition. Enforces ALL constraints honestly.
 * MTQ_ACTIVE CANNOT be reached from config alone.
 */
export async function POST(request: Request) {
  let targetState: MTQState = "MTQ_ELIGIBLE_PENDING";
  let externalAuthorization = false;
  try {
    const body = await request.json();
    if (body.targetState) targetState = body.targetState;
    if (body.externalAuthorization) externalAuthorization = body.externalAuthorization;
  } catch {
    // Use defaults
  }

  const result = attemptTransition(targetState, externalAuthorization);
  return NextResponse.json({
    ok: result.success,
    result,
    honestState: {
      mtqActiveNotReachableFromConfig: targetState === "MTQ_ACTIVE" && !externalAuthorization ? true : false,
      productionAuthorized: false,
    },
  });
}
