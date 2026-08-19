import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  LIQUIDITY_SEPARATION_RULE,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/liquidity
// Returns the v25.1 liquidity categories (4) — constitutional solvency
// reserve, settlement liquidity, emergency liquidity, conversion liquidity.
// SIMULATED.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/liquidity",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        liquidityCategories: report.liquidityCategories,
        emergencyLiquidityTypes: report.emergencyLiquidityTypes,
        liquiditySeparationRule: LIQUIDITY_SEPARATION_RULE,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
