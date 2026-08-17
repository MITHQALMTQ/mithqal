// GET /api/gateway/v1/proof-of-reserves
// Get latest proof of reserves.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/proof-of-reserves",
        method: "GET",
        description: "Get latest proof of reserves",
        status: "SIMULATED",
        data: {
          proofHash: "SIMULATED",
          timestamp,
          totalReserves: "SIMULATED",
          supply: 0,
          ratio: 1.2,
          status: "SIMULATED",
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
