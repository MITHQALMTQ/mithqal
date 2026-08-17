// GET /api/gateway/v1/rebalancing
// Query rebalancing status.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/rebalancing",
        method: "GET",
        description: "Query rebalancing status",
        status: "SIMULATED",
        data: {
          status: "NO_TRADE",
          lastRebalance: null,
          corridors: {
            fiat: [0.7, 0.85],
            bullion: [0.15, 0.25],
            digital: [0.0, 0.05],
          },
          simulation: true,
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
