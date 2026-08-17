// GET /api/gateway/v1/minting-capacity
// Query dynamic minting capacity for an institution.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/minting-capacity",
        method: "GET",
        description: "Query dynamic minting capacity for an institution",
        status: "SIMULATED",
        data: {
          capacity: 0,
          formula: "MIN(8 limits)",
          status: "SIMULATED",
          components: {
            verifiedEligibleBacking: 0,
            institutionDailyLimit: 0,
            institutionMonthlyLimit: 0,
            corridorLimit: 0,
            singleTransactionLimit: 0,
            reserveRatioCapacity: 0,
            regulatoryCeiling: 0,
            operationalRiskCap: 0,
          },
        },
        requires: [
          "authentication",
          "signed requests",
          "idempotency",
          "timestamp",
          "expiry",
          "replay protection",
        ],
        honestState: {
          banksContracted: 0,
          integrationState: "INTEGRATION-READY",
          forcedToPass: false,
        },
        timestamp,
      },
      {
        headers: { "X-Endpoint-Status": "SIMULATED" },
      },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Gateway endpoint failed",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
