// POST /api/gateway/v1/attestation
// Submit bank compliance attestation.
// HONEST STATE: SIMULATED — no real bank contracted yet.
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const timestamp = new Date().toISOString();
    const attestationId = `ATT-SIM-${crypto.randomUUID().slice(0, 12)}`;
    return NextResponse.json(
      {
        endpoint: "/gateway/v1/attestation",
        method: "POST",
        description: "Submit bank compliance attestation",
        status: "SIMULATED",
        data: {
          attestationId,
          valid: true,
          assertions: [
            "KYC",
            "KYB",
            "AML",
            "SANCTIONS",
            "ACCOUNT_AUTHORITY",
            "FUNDS_AVAILABLE",
            "TRANSACTION_AUTHORIZED",
          ],
          timestamp,
          status: "SIMULATED",
          received: {
            submittedAttestationId: body?.attestationId ?? null,
            signaturePresent: Boolean(body?.signature),
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
