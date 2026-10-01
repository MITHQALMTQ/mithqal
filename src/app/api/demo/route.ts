import { NextResponse } from "next/server";
import { executeDemoEnvironment, DEMO_ENV_META } from "@/lib/institutional-demo-environment";

export const dynamic = "force-dynamic";

/**
 * GET /api/demo
 * Returns the full Institutional Demonstration Environment:
 *   8 scenarios (MTQ disabled, synthetic data, deterministic replay package)
 */
export async function GET() {
  const replay = executeDemoEnvironment();
  return NextResponse.json({
    ok: true,
    meta: DEMO_ENV_META,
    replay,
    honestState: {
      productionAuthorized: false,
      mtqCompletelyDisabled: replay.honestState.mtqCompletelyDisabled,
      syntheticDataOnly: replay.honestState.syntheticDataOnly,
      deterministic: replay.honestState.deterministic,
    },
  });
}
