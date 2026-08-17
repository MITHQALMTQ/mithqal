// GET /api/gateway/v1/foundation/oversight
// Foundation read-only oversight dashboard.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/foundation/oversight",
        method: "GET",
        description: "Foundation read-only oversight dashboard",
        status: "SIMULATED",
        data: {
          accessLevel: "READ_ONLY",
          supply: 0,
          reserveStatus: "SIMULATED",
          calmState: "NORMAL",
          exceptions: [],
          timestamp,
          status: "SIMULATED",
        },
        requires: [
          "authentication",
          "signed requests",
          "idempotency",
          "timestamp",
          "expiry",
          "replay protection",
          "read-only foundation role",
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
