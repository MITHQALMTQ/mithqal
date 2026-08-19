import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  INTEROP_GATEWAY_STEPS,
  type FinalityCheckResult,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/conversions/finality
// Returns the v25.1 Finality-Before-Mint constitutional rule and the
// finality check structure that every conversion must satisfy before
// MTQ minting is even considered.
// SIMULATED — no live settlement finality is connected.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    const finalityCheckStructure: FinalityCheckResult[] = INTEROP_GATEWAY_STEPS.map((step) => ({
      step,
      confirmed: false,
      evidence: "NONE — SIMULATED, no live settlement confirmation",
      timestamp: new Date().toISOString(),
    }));
    return NextResponse.json({
      endpoint: "/api/v25.1/conversions/finality",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        finalityBeforeMintRule: report.finalityBeforeMintRule,
        finalityCheckStructure,
        enforcedBy: "FINALITY-BEFORE-MINT (constitutional-grade rule)",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
