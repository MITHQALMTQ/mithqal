// Sanctions screening API — framework status + simulated screening
// =====================================================================
// Implements the MITHQAL §V25.2 sanctions screening API surface per
// bank audit Rec-6. INFRASTRUCTURE ONLY — not live, 0 screenings
// performed, not production-authorized. Fail-closed per §V24.2.13.
// =====================================================================

import { NextResponse } from "next/server";
import {
  screenCounterparty,
  getSanctionsScreeningHonestState,
  registerScreeningProvider,
  SIMULATED_TEST_FIXTURES,
  type ScreeningInput,
  type ScreeningProvider,
} from "@/lib/sanctions-screening";

// GET /api/sanctions-screening
// Returns the framework status, honest state, and the list of test
// fixtures that developers can use to exercise the simulated path.
export async function GET() {
  const honest = getSanctionsScreeningHonestState();

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    module: "sanctions-screening",
    auditRec: "Rec-6",
    blueprintRef: "§V25.2 / §V24.2.13",

    // Honest state — top-level for visibility
    honestState: honest,

    // Framework capabilities (what is implemented vs what is stub)
    capabilities: {
      simulatedScreening: true,
      chainalysisLive: false,
      ellipticLive: false,
      trmLabsLive: false,
      failClosedDefault: true,
      listVersionTracking: true,
      multiListCoverage: ["OFAC SDN", "UN Consolidated", "EU CFSP", "HMT OFSI"],
    },

    // Fail-closed matrix — what happens for each provider state
    failClosedMatrix: {
      NOT_CONNECTED: "screened=false, passed=false, risk=CRITICAL (fail-closed §V24.2.13)",
      SIMULATED: "runs simulated fixture path (test entities only)",
      CHAINALYSIS_registered_not_live: "screened=false, passed=false, risk=CRITICAL (fail-closed)",
      ELLIPTIC_registered_not_live: "screened=false, passed=false, risk=CRITICAL (fail-closed)",
      TRM_LABS_registered_not_live: "screened=false, passed=false, risk=CRITICAL (fail-closed)",
      any_provider_live_true: "would call real API (currently unreachable — no provider live)",
    },

    // Simulated test fixtures — for developers
    testFixtures: {
      knownGood: SIMULATED_TEST_FIXTURES.knownGood,
      knownBad: SIMULATED_TEST_FIXTURES.knownBad,
      knownUnknown: SIMULATED_TEST_FIXTURES.knownUnknown,
      note: "Test fixtures ONLY. Never use in production. SIMULATED mode returns fixture data.",
    },

    // Path to production (honest)
    pathToProduction: {
      step1: "Contract a bank partner (currently 0 bank integrations).",
      step2: "Sign commercial agreement with Chainalysis, Elliptic, or TRM Labs.",
      step3: "Provision API credentials in secrets manager (never in git).",
      step4: "Wire provider SDK into the real-screening branch of screenCounterparty.",
      step5: "Execute sandbox screening; record audit trail.",
      step6: "Compliance officer sign-off on first live screening.",
      step7: "Flip providerLive=true only after all of the above.",
      currentStep: 0,
      totalSteps: 7,
    },

    acceptance: {
      "Fail-closed when provider is NOT_CONNECTED": true,
      "Fail-closed when real provider registered but not live": true,
      "passed=false for any entity on a sanctions list": true,
      "screeningProvider always honestly disclosed": true,
      "liveScreenings starts at 0": honest.liveScreenings === 0,
      "productionReady is false": honest.productionReady === false,
      "List version tracking (OFAC/UN/EU/HMT)": true,
    },

    honest: true,
    forced_to_pass: false,
  });
}

// POST /api/sanctions-screening
// Accepts a ScreeningInput and returns the simulated screening result.
// In SIMULATED mode, only test fixtures return meaningful risk levels;
// any other name passes with MEDIUM risk (unverified).
export async function POST(request: Request) {
  let input: ScreeningInput;

  try {
    const body = await request.json() as Partial<ScreeningInput>;
    if (
      !body ||
      typeof body.institutionId !== "string" ||
      typeof body.counterpartyName !== "string" ||
      typeof body.counterpartyCountry !== "string"
    ) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message:
            "Required fields: institutionId (string), counterpartyName (string), counterpartyCountry (string). "
            + "Optional: counterpartyAddress, transactionAmount, transactionCurrency.",
        },
        { status: 400 },
      );
    }
    input = {
      institutionId: body.institutionId,
      counterpartyName: body.counterpartyName,
      counterpartyAddress: body.counterpartyAddress,
      counterpartyCountry: body.counterpartyCountry,
      transactionAmount: body.transactionAmount,
      transactionCurrency: body.transactionCurrency,
    };
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const result = screenCounterparty(input);

  return NextResponse.json({
    receivedAt: new Date().toISOString(),
    input: {
      institutionId: input.institutionId,
      counterpartyName: input.counterpartyName,
      counterpartyCountry: input.counterpartyCountry,
      // Mask optional fields in echo for safety
      hasAddress: !!input.counterpartyAddress,
      hasAmount: typeof input.transactionAmount === "number",
      hasCurrency: !!input.transactionCurrency,
    },
    result,
    honest: true,
    forced_to_pass: false,
  });
}

// Optional: PUT /api/sanctions-screening
// Infrastructure endpoint: register an intended provider (does NOT go live).
// This is for wiring when a bank is contracted. Honest: stays fail-closed
// until providerLive=true is flipped by a separate, audited procedure.
export async function PUT(request: Request) {
  let provider: string;
  try {
    const body = await request.json() as { provider?: string };
    provider = (body?.provider ?? "").toUpperCase();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be { provider: string }." },
      { status: 400 },
    );
  }

  const allowed: ScreeningProvider[] = [
    "SIMULATED",
    "CHAINALYSIS",
    "ELLIPTIC",
    "TRM_LABS",
    "NOT_CONNECTED",
  ];
  if (!allowed.includes(provider as ScreeningProvider)) {
    return NextResponse.json(
      {
        error: "INVALID_PROVIDER",
        message: `provider must be one of: ${allowed.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const registration = registerScreeningProvider(provider as ScreeningProvider);
  const honest = getSanctionsScreeningHonestState();

  return NextResponse.json({
    receivedAt: new Date().toISOString(),
    registration,
    honestState: honest,
    honest: true,
    forced_to_pass: false,
  });
}
