import { NextResponse } from "next/server";
import { generateV25_1Report } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/assets
// Returns the v25.1 Asset Eligibility Registry — 8 assets with full
// eligibility metadata (fiat, gold, stablecoins, tokenized gold).
// SIMULATED — no real asset is contracted yet.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/assets",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        assetRegistryCount: report.assetRegistryCount,
        assetRegistry: report.assetRegistry,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
