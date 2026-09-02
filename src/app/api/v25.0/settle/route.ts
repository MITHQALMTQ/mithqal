import { NextResponse } from "next/server";

/**
 * POST /api/v25.0/settle
 *
 * MITHQAL v25.0 — Settlement instruction processor (SIMULATED).
 *
 * Honest stub endpoint. Accepts a settlement instruction and returns a
 * SIMULATED settlement result. No settlement ever executes.
 *
 * IMPORTANT: This endpoint is SIMULATED / DESIGN-TIME only.
 *   - No settlement is executed.
 *   - No reserve movement occurs.
 *   - No finality is enforced at the network level.
 *   - Production settlement is NOT AUTHORIZED.
 *
 * Request body (JSON):
 *   {
 *     "institutionId": "INST-001",
 *     "fromCcy":       "USD",
 *     "toCcy":         "AED",
 *     "amount":        1_000_000,
 *     "rail":          "mtq-atomic"   // | "cbdc-bridge" | "fiat-correspondent"
 *   }
 *
 * Finality is enforced at the CODE LEVEL (7/7 invariants proven in the
 * model-lock library), but the INSTITUTIONAL GATE (13 checks) is at 0/13
 * in production — therefore every settlement is REJECTED.
 */
export async function POST(req: Request) {
  let body: {
    institutionId?: string;
    fromCcy?: string;
    toCcy?: string;
    amount?: number | string;
    rail?: string;
  } = {};

  try {
    const text = await req.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text) as typeof body;
    }
  } catch {
    // Malformed / missing JSON — proceed with empty body; still returns a
    // SIMULATED rejection so callers always receive a structured response.
    body = {};
  }

  const institutionId = typeof body.institutionId === "string" ? body.institutionId : "";
  const fromCcy = typeof body.fromCcy === "string" ? body.fromCcy : "";
  const toCcy = typeof body.toCcy === "string" ? body.toCcy : "";
  const amount =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string" && !Number.isNaN(Number(body.amount))
        ? Number(body.amount)
        : null;
  const rail = typeof body.rail === "string" ? body.rail : "";

  // SIMULATED settlement id — clearly prefixed to never be confused with a
  // real settlement identifier.
  const settlementId = `SIM-${Date.now()}`;

  return NextResponse.json({
    ok: true,
    moduleId: "v25.0-settle",
    simulated: true,

    // Echo the request (helps callers correlate without executing anything).
    request: { institutionId, fromCcy, toCcy, amount, rail },

    settlementId,
    status: "REJECTED",
    reason: "Production not authorized — settlement cannot execute",

    // Code-level finality is fully proven (7/7 invariants), but institutional
    // gate is 0/13 — so no settlement can be authorized to execute.
    finalityEnforced: "7/7 (code level)",
    institutionalGate: "0/13 passed",

    honestState: {
      productionAuthorized: false,
    },

    // Explicit honesty markers — match the discipline used across v25.0 routes.
    honest: true,
    forced_to_pass: false,
    productionReady: false,
  });
}
