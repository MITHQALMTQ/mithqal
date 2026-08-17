// GET /api/gateway/v1/custody
// Query custody status.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/custody",
        method: "GET",
        description: "Query custody status",
        status: "SIMULATED",
        data: {
          custodians: [],
          count: 0,
          concentration: {
            preferred: 0.15,
            hardCap: 0.25,
          },
          status: "SIMULATED — 0 custodians contracted",
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
