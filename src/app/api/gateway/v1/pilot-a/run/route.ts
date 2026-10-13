// POST /api/gateway/v1/pilot-a/run
// Run one (or all) Pilot A scenarios per v26.0 §8.9.
//
// Request body (single scenario):
//   { scenarioId: "A-01" | "A-02" | ... | "A-10" | "ALL" }
//
// Returns the canonical ScenarioResult per §8.9 evidence requirements:
//   - Instruction ID
//   - Policy hash + version
//   - Route candidates/reasons
//   - Event/outbox IDs
//   - Source fixtures
//   - Replay output (for A-10)
//   - Reconciliation result (for A-06 + A-08)
//
// CRITICAL per v26.0 §3.2: MTQ is DISABLED BY DEFAULT. Every scenario
// verifies the MTQ gate at F3 (Monetary Authorization) and expects denial
// in Pilot A. If MTQ is unexpectedly enabled, the scenario FAILS.
//
// HONEST STATE: All scenarios are SYNTHETIC. Per v26.0 §0.2, settled
// performance and savings examples are simulations unless independently
// measured under agreed pilot conditions.

import { NextResponse } from "next/server";
import { runPilotAScenario, runAllPilotAScenarios, type ScenarioId } from "@/lib/pilot-a-scenarios";
import { assertMtqEnabled } from "@/lib/mtq-gate";

const VALID_SCENARIO_IDS = new Set<ScenarioId | "ALL">([
  "A-01", "A-02", "A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09", "A-10", "ALL",
]);

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON body.",
        blueprint_ref: "v26.0 §8.9 Pilot A scenario matrix",
      },
      { status: 400 },
    );
  }

  const data = body as { scenarioId?: string };
  const scenarioId = (data.scenarioId ?? "").toUpperCase() as ScenarioId | "ALL";

  if (!VALID_SCENARIO_IDS.has(scenarioId)) {
    return NextResponse.json(
      {
        error: `Invalid scenarioId. Must be one of: A-01..A-10 or ALL. Got: ${scenarioId}`,
        blueprint_ref: "v26.0 §8.9",
      },
      { status: 400 },
    );
  }

  // Verify MTQ gate status first (informational — Pilot A always has MTQ disabled)
  const mtqGate = assertMtqEnabled("pilot-a-run-info");

  try {
    if (scenarioId === "ALL") {
      const result = runAllPilotAScenarios();
      return NextResponse.json({
        endpoint: "/gateway/v1/pilot-a/run",
        method: "POST",
        blueprint_ref: "v26.0 §8.9 Pilot A scenario matrix (ALL)",
        ...result,
        mtqGate: {
          enabled: mtqGate.ok,
          denied: !mtqGate.ok,
          reason: mtqGate.reason,
        },
        receivedAt: new Date().toISOString(),
      });
    }

    const result = runPilotAScenario(scenarioId as ScenarioId);
    return NextResponse.json({
      endpoint: "/gateway/v1/pilot-a/run",
      method: "POST",
      blueprint_ref: result.blueprint_ref,
      scenario: result,
      mtqGate: result.mtqGate,
      receivedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Pilot A scenario execution failed.",
        detail: err instanceof Error ? err.message : "unknown",
        blueprint_ref: "v26.0 §8.9",
      },
      { status: 500 },
    );
  }
}
