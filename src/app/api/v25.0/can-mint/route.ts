import { NextResponse } from "next/server";

/**
 * GET /api/v25.0/can-mint
 *
 * MITHQAL v25.0 — Minting authorization check (SIMULATED).
 *
 * Honest stub endpoint. Returns whether a participant class is permitted to
 * mint MTQ. The v25.0 architecture permits only Class A (institution) and
 * Class B (bank) participants under strict institutional gates; Class C
 * (corporate) never mints directly.
 *
 * IMPORTANT: This endpoint is SIMULATED / DESIGN-TIME only.
 *   - No live institutional registry is consulted.
 *   - No KYC/AML/sanctions checks are executed.
 *   - 0 of 13 institutional gates have been passed in production.
 *   - Production minting is NOT AUTHORIZED.
 *
 * Query params:
 *   class  Participant class — "A" (institution), "B" (bank), "C" (corporate).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const participantClass = (sp.get("class") || "C").trim().toUpperCase();

  // Normalize: accept only A | B | C; default to C (most restrictive).
  const normalizedClass =
    participantClass === "A" || participantClass === "B" || participantClass === "C"
      ? participantClass
      : "C";

  return NextResponse.json({
    ok: true,
    moduleId: "v25.0-can-mint",
    simulated: true,
    class: normalizedClass,

    // SIMULATED response — no production authorization granted.
    canMint: false,
    reason: "PRODUCTION_NOT_AUTHORIZED — 0/13 institutional gates passed",

    // The institutional gates are defined in the v25.0 architecture but
    // NONE have been validated against a live institution yet.
    gatesRequired: [
      "institutional-validation",
      "jurisdiction-authorization",
      "finality-enforcement",
    ],

    honestState: {
      productionAuthorized: false,
      gatesPassed: "0/13",
    },

    // Explicit honesty markers — match the discipline used across v25.0 routes.
    honest: true,
    forced_to_pass: false,
    productionReady: false,
  });
}
