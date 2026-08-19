import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  RESERVE_QUALITY_RULE,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/risk
// Returns the v25.1 geopolitical + concentration-aware DMCE rule and the
// concept of Risk-Adjusted Eligible Backing (vs nominal reserve balance).
// SIMULATED — no live exposure data is connected.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/risk",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        geopoliticalDMCERule: report.geopoliticalDMCERule,
        riskAdjustedBackingConcept: {
          rule: RESERVE_QUALITY_RULE,
          engineMustCalculate: "Risk-Adjusted Eligible Backing",
          not: "nominal reserve balance",
          inputs: [
            "reserveQuantity",
            "reserveQuality",
            "liquidity",
            "bankExposure",
            "custodianExposure",
            "countryExposure",
            "currencyExposure",
            "providerExposure",
            "settlementRisk",
            "stablecoinExposure",
            "concentration",
            "stressState",
          ],
        },
        rebalancingRule: report.rebalancingRule,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
