import { NextResponse } from "next/server";

/**
 * GET /api/v25.0/cbdc-interop
 *
 * MITHQAL v25.0 — CBDC interoperability status (SIMULATED).
 *
 * Honest stub endpoint. Returns the current CBDC interop status.
 *
 * In the v25.0 architecture, CBDC interoperability is first-class: the
 * settlement flow is designed to bridge directly with central-bank-issued
 * CBDCs. However, no CBDC networks are connected in production — this
 * endpoint honestly reports DESIGN_ONLY status.
 *
 * IMPORTANT: This endpoint is SIMULATED / DESIGN-TIME only.
 *   - No CBDC network is connected.
 *   - No bridge adapters are operational.
 *   - Production CBDC interoperability is NOT AUTHORIZED.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    moduleId: "v25.0-cbdc-interop",
    simulated: true,

    status: "DESIGN_ONLY",

    // Empty array — NO CBDC networks are connected.
    cbdcNetworks: [],

    reason:
      "CBDC interop is first-class in v25.0 architecture but no CBDC networks are connected",

    interoperable: false,

    honestState: {
      productionAuthorized: false,
    },

    // Explicit honesty markers — match the discipline used across v25.0 routes.
    honest: true,
    forced_to_pass: false,
    productionReady: false,
  });
}
