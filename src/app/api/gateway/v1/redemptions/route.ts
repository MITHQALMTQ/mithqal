// POST /api/gateway/v1/redemptions
// Submit redemption request.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const redemptionId = `RDM-SIM-${crypto.randomUUID().slice(0, 12)}`;
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/redemptions",
        method: "POST",
        description: "Submit redemption request",
        status: "SIMULATED",
        data: {
          redemptionId,
          status: "PENDING",
          burnAuthorized: false,
          timestamp,
          requestStatus: "SIMULATED",
          received: {
            corporateReference: body?.corporateReference ?? null,
            mtqAmount: body?.mtqAmount ?? null,
          },
        },
        requires: [
          "authentication",
          "signed requests",
          "idempotency",
          "timestamp",
          "expiry",
          "replay protection",
          "HSM-bound signing keys",
          "mutual-TLS channel",
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
