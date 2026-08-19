import { NextResponse } from "next/server";
import { generateV25_1Report } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/reserves
// Returns the v25.1 reserve target (130% strategic target, 80/18/2 fiat
// / gold / digital bands) and the reserve quality tier definitions.
// SIMULATED — values are policy defaults, not live reserve balances.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/reserves",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        reserveTarget: report.reserveTarget,
        reserveQualityTiers: report.reserveQualityTiers,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
