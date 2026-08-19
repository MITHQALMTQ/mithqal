import { NextResponse } from "next/server";
import { generateV25_1Report } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/assets/eligibility
// Returns the eligibility flags for each registered asset (reserve,
// input, settlement, liquidity eligibility + risk/liquidity tier +
// haircut + concentration limit).
// SIMULATED.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    const eligibility = report.assetRegistry.map((a) => ({
      assetId: a.assetId,
      assetName: a.assetName,
      assetType: a.assetType,
      reserveEligibility: a.reserveEligibility,
      inputEligibility: a.inputEligibility,
      settlementEligibility: a.settlementEligibility,
      liquidityEligibility: a.liquidityEligibility,
      riskTier: a.riskTier,
      liquidityTier: a.liquidityTier,
      haircut: a.haircut,
      concentrationLimit: a.concentrationLimit,
      sanctionsStatus: a.sanctionsStatus,
      status: a.status,
    }));
    return NextResponse.json({
      endpoint: "/api/v25.1/assets/eligibility",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: eligibility,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
