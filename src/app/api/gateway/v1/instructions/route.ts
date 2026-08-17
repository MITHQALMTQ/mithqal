// POST /api/gateway/v1/instructions
// Submit a new MTQ settlement instruction.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const instructionId = `MBG-INSTR-SIM-${crypto.randomUUID().slice(0, 12)}`;
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/instructions",
        method: "POST",
        description: "Submit a new MTQ settlement instruction",
        status: "SIMULATED",
        data: {
          instructionId,
          finalityState: "RECEIVED",
          timestamp,
          status: "SIMULATED",
          received: {
            idempotencyKey: body?.idempotencyKey ?? null,
            signedMessagePresent: Boolean(body?.cryptographicSignature),
          },
        },
        requires: [
          "authentication",
          "signed requests",
          "idempotency key",
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
