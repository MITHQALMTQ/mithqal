import { NextResponse } from "next/server";
import { generateV25_1Report, PROVIDER_RULE } from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/providers/eligibility
// Returns the eligibility criteria for authorized external participants.
// SIMULATED.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/providers/eligibility",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        providerTypes: report.providerTypes,
        eligibilityCriteria: [
          "Valid regulatory license in operating jurisdiction",
          "Sanctions / AML / KYC program certified",
          "Approved for the relevant asset class (fiat / gold / stablecoin / token)",
          "Operational risk rating BBB or higher",
          "Within per-transaction / daily / monthly limits",
          "Approved by MITHQAL governance for the corridor / asset pair",
        ],
        rule: PROVIDER_RULE,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
