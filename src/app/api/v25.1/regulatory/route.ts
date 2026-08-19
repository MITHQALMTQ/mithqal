import { NextResponse } from "next/server";
import {
  generateV25_1Report,
  REGULATORY_API_RULE,
} from "@/lib/v25-1-institutional-interop";

// GET /api/v25.1/regulatory
// Returns the 15 regulatory transparency API fields that the v25.1
// architecture exposes to regulators (with RBAC + audit logging).
// SIMULATED — no live regulator feed is connected.
// Task ID: PHASE3-V25-1-API-ENDPOINTS

export async function GET() {
  try {
    const report = generateV25_1Report();
    return NextResponse.json({
      endpoint: "/api/v25.1/regulatory",
      status: "SIMULATED",
      timestamp: new Date().toISOString(),
      data: {
        regulatoryAPIFields: report.regulatoryAPIFields,
        fieldCount: report.regulatoryAPIFields.length,
        regulatoryAPIRule: REGULATORY_API_RULE,
        proofOfLiabilitiesSources: report.proofOfLiabilitiesSources,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
