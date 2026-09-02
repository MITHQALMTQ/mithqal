import { NextResponse } from "next/server";

/**
 * GET /api/v25.0/authorize
 *
 * MITHQAL v25.0 — Institutional function authorization check (SIMULATED).
 *
 * Honest stub endpoint. Returns whether a given institution is authorized to
 * perform a specific MTQ function (mint / settle / redeem / etc.) for a given
 * amount.
 *
 * IMPORTANT: This endpoint is SIMULATED / DESIGN-TIME only.
 *   - No live institutional registry is consulted.
 *   - No KYC/AML/sanctions/jurisdiction checks are executed.
 *   - 0 of 13 institutional gates have been passed in production.
 *   - Production authorization is NOT GRANTED.
 *
 * Query params:
 *   institutionId  The institution identifier (e.g. "INST-001").
 *   function      The MTQ function being requested (e.g. "mint", "settle",
 *                 "redeem", "transfer").
 *   amount        The transaction amount (numeric string).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const institutionId = sp.get("institutionId") || "";
  const fn = sp.get("function") || "";
  const amountRaw = sp.get("amount");
  const amount =
    amountRaw !== null && amountRaw !== "" && !Number.isNaN(Number(amountRaw))
      ? Number(amountRaw)
      : null;

  return NextResponse.json({
    ok: true,
    moduleId: "v25.0-authorize",
    simulated: true,
    institutionId,
    function: fn,
    amount,

    // SIMULATED response — no production authorization granted.
    authorized: false,
    reason: "No institutions validated — 0/13 gates passed",

    // The required checks are defined in the v25.0 architecture but
    // NONE have been executed against a live institution yet.
    requiredChecks: [
      "KYC_VERIFIED",
      "AML_CLEARED",
      "SANCTIONS_CLEARED",
      "JURISDICTION_APPROVED",
      "FINALITY_CONFIRMED",
    ],

    honestState: {
      productionAuthorized: false,
      validatedInstitutions: 0,
    },

    // Explicit honesty markers — match the discipline used across v25.0 routes.
    honest: true,
    forced_to_pass: false,
    productionReady: false,
  });
}
