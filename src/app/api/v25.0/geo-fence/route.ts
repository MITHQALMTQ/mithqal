import { NextResponse } from "next/server";

/**
 * GET /api/v25.0/geo-fence
 *
 * MITHQAL v25.0 — Jurisdictional geo-fence check (SIMULATED).
 *
 * Honest stub endpoint. Returns whether a given jurisdiction is permitted
 * under the v25.0 geo-fence policy.
 *
 * IMPORTANT: This endpoint is SIMULATED / DESIGN-TIME only.
 *   - No live jurisdiction registry is consulted.
 *   - No OFAC screening is executed against a live list.
 *   - 0 jurisdictions have been validated in production.
 *   - Production geo-fence policy is NOT OPERATIONAL.
 *
 * Query params:
 *   jurisdiction  ISO-2 code (e.g. CN, US, AE, UK, EU, SG, CH, HK, SA).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const jurisdiction = (sp.get("jurisdiction") || "").trim().toUpperCase();

  return NextResponse.json({
    ok: true,
    moduleId: "v25.0-geo-fence",
    simulated: true,
    jurisdiction,

    // SIMULATED response — fail-closed by design; no jurisdiction is allowed
    // until the geo-fence policy is operational in production.
    allowed: false,
    reason: "No jurisdictions validated — geo-fence policy not yet operational",
    fenceStatus: "DESIGN_ONLY",

    // Architectural constants — these are design-time facts, not runtime state.
    chinaFenced: true,
    ofacScreening: "fail-closed (design)",

    honestState: {
      productionAuthorized: false,
      validatedJurisdictions: 0,
    },

    // Explicit honesty markers — match the discipline used across v25.0 routes.
    honest: true,
    forced_to_pass: false,
    productionReady: false,
  });
}
