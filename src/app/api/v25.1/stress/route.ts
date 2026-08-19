import { NextResponse } from "next/server";
import { generateV25_1Report, STRESS_ENGINE_RULE } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/stress
// Returns the v25.1 stress scenario matrix — stablecoin depeg, FX shock,
// gold shock, and operational events.
// SIMULATED — the engine must calculate dynamically from live policy data.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/stress",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        stressScenarios: report.stressScenarios,
        stressEngineRule: STRESS_ENGINE_RULE,
        safeStates: report.safeStates,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
