// Sanctions screening framework — fail-closed design (§V24.2.13)
// Infrastructure for integration with Chainalysis/Elliptic/TRM Labs
// =====================================================================
// HONEST STATE: not live, 0 screenings performed, production not authorized
//
// This module implements the MITHQAL §V25.2 blueprint requirement for
// OFAC/UN/EU/HMT sanctions screening with fail-closed semantics per
// §V24.2.13. It is INFRASTRUCTURE ONLY: ready to be wired to a real
// provider (Chainalysis, Elliptic, TRM Labs) once a bank partnership is
// contracted. It must NOT be presented as live or production-authorized.
//
// Bank audit Rec-6: real-time sanctions screening integration.
// Status: framework complete; 0 live screenings; 0 bank integrations.
// =====================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScreeningProvider =
  | "SIMULATED"
  | "CHAINALYSIS"
  | "ELLIPTIC"
  | "TRM_LABS"
  | "NOT_CONNECTED";

export interface SanctionsScreeningResult {
  screened: boolean;
  passed: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  matches: SanctionsMatch[];
  screenedAt: string;
  screeningProvider: ScreeningProvider;
  listVersions: {
    ofac: string;
    un: string;
    eu: string;
    hmt: string;
  };
  honestState: {
    productionReady: false;
    liveScreenings: number;
    failClosed: true;
  };
}

export interface SanctionsMatch {
  list: "OFAC" | "UN" | "EU" | "HMT";
  entity: string;
  matchStrength: number; // 0-1
  program: string;
}

export interface ScreeningInput {
  institutionId: string;
  counterpartyName: string;
  counterpartyAddress?: string;
  counterpartyCountry: string;
  transactionAmount?: number;
  transactionCurrency?: string;
}

export interface ScreeningHonestState {
  productionReady: false;
  liveScreenings: number;
  failClosed: true;
  currentProvider: ScreeningProvider;
  providerLive: boolean; // true only when a real provider API is wired
  bankIntegrations: number; // 0 — MITHQAL has 0 bank integrations
  listVersions: {
    ofac: string;
    un: string;
    eu: string;
    hmt: string;
  };
  lastRealProviderCallAt: null | string; // null — never made a real call
  auditRec: "Rec-6";
  blueprintRef: "§V25.2 / §V24.2.13";
  notes: string[];
}

export interface ProviderRegistrationResult {
  registered: ScreeningProvider;
  providerLive: boolean; // false — no live API wired
  requirementsForGoLive: string[];
  honestWarning: string;
}

// ---------------------------------------------------------------------------
// Internal module state
// ---------------------------------------------------------------------------

// Default provider is SIMULATED so test fixtures (TEST-GOOD-BANK, etc.)
// can exercise the screening code path. This is NOT a live provider.
let currentProvider: ScreeningProvider = "SIMULATED";

// `providerLive` flips to true ONLY when a real provider contract is
// signed AND a real API key + endpoint is wired. It has never been true.
let providerLive = false;

// `liveScreenings` counts only screenings performed against a real
// provider API. It is never incremented in SIMULATED mode.
let liveScreenings = 0;

// Timestamp of the last REAL provider call. Stays null in SIMULATED mode.
let lastRealProviderCallAt: string | null = null;

// ---------------------------------------------------------------------------
// Sanctions list versions (SIMULATED — these are NOT live feed versions)
// ---------------------------------------------------------------------------
// In a production deployment these strings would be fetched from the
// provider's list-version endpoint on each screening call. Here they are
// hardcoded fixtures that explicitly state they are not live.

const SIMULATED_LIST_VERSIONS = {
  ofac: "OFAC SDN List — SIMULATED fixture (not live; last real sync: never)",
  un: "UN Consolidated Sanctions List — SIMULATED fixture (not live; last real sync: never)",
  eu: "EU CFSP Consolidated Financial Sanctions List — SIMULATED fixture (not live; last real sync: never)",
  hmt: "HMT OFSI Consolidated List — SIMULATED fixture (not live; last real sync: never)",
} as const;

// ---------------------------------------------------------------------------
// Known test entities (SIMULATED mode only)
// ---------------------------------------------------------------------------
// These fixtures let developers exercise both the PASS and FAIL paths
// without needing a real provider. They MUST NOT be used in production.
//
// - TEST-GOOD-BANK   → passes with LOW risk (known-clean test fixture)
// - TEST-BAD-ENTITY  → fails with CRITICAL risk (OFAC SDN test fixture)
// - TEST-UNKNOWN     → passes with MEDIUM risk (unverified test fixture)

const TEST_BAD_ENTITIES = new Set<string>([
  "TEST-BAD-ENTITY",
  "TEST-OFAC-SDN",
  "TEST-UN-DESIGNATED",
  "TEST-EU-CFSP-LISTED",
  "TEST-HMT-OFSI-LISTED",
]);

const TEST_GOOD_ENTITIES = new Set<string>([
  "TEST-GOOD-BANK",
  "TEST-GOOD-CORPORATION",
  "TEST-GOOD-CUSTODIAN",
]);

const TEST_UNKNOWN_ENTITIES = new Set<string>([
  "TEST-UNKNOWN",
  "TEST-UNVERIFIED",
]);

// ---------------------------------------------------------------------------
// Honest-state accessor
// ---------------------------------------------------------------------------

export function getSanctionsScreeningHonestState(): ScreeningHonestState {
  return {
    productionReady: false,
    liveScreenings,
    failClosed: true,
    currentProvider,
    providerLive,
    bankIntegrations: 0, // MITHQAL has 0 bank integrations
    listVersions: { ...SIMULATED_LIST_VERSIONS },
    lastRealProviderCallAt,
    auditRec: "Rec-6",
    blueprintRef: "§V25.2 / §V24.2.13",
    notes: [
      "Framework is INFRASTRUCTURE ONLY — not live, not production-authorized.",
      "0 bank integrations contracted; no real provider API is wired.",
      "All `screenCounterparty` calls in SIMULATED mode return fixture data.",
      "Default behavior when no provider is connected is FAIL-CLOSED (§V24.2.13).",
      "To go live: (1) contract a bank partner, (2) sign with Chainalysis/Elliptic/TRM Labs, "
        + "(3) wire API credentials into env, (4) flip providerLive=true, (5) audit first live call.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Provider registration (infrastructure stub for when a bank is contracted)
// ---------------------------------------------------------------------------

export function registerScreeningProvider(
  provider: ScreeningProvider,
): ProviderRegistrationResult {
  // This function does NOT wire a live API. It records intent and lists
  // everything that would still be required to actually go live.
  if (provider === "NOT_CONNECTED") {
    currentProvider = "NOT_CONNECTED";
    providerLive = false;
    return {
      registered: "NOT_CONNECTED",
      providerLive: false,
      requirementsForGoLive: [
        "Sign a commercial contract with Chainalysis, Elliptic, or TRM Labs.",
        "Provision API credentials in a secrets manager (never in git).",
        "Wire the provider SDK into `screenCounterparty` real path.",
        "Complete a successful sandbox screening before flipping providerLive.",
      ],
      honestWarning:
        "Provider set to NOT_CONNECTED. All screenings will FAIL-CLOSED per §V24.2.13.",
    };
  }

  if (provider === "SIMULATED") {
    currentProvider = "SIMULATED";
    providerLive = false;
    return {
      registered: "SIMULATED",
      providerLive: false,
      requirementsForGoLive: [
        "SIMULATED mode is for tests only. No production traffic is permitted.",
        "To go live: contract a bank partner, then sign with a real provider.",
      ],
      honestWarning:
        "SIMULATED mode active. Results are fixtures, not real screenings. Do not use in production.",
    };
  }

  // Real provider requested (CHAINALYSIS / ELLIPTIC / TRM_LABS) — but we
  // still have no live API wired. Fail-closed semantics still apply for
  // any real screening call until the integration is actually completed.
  currentProvider = provider;
  providerLive = false;
  return {
    registered: provider,
    providerLive: false,
    requirementsForGoLive: [
      `Contract with ${provider} signed and counter-signed.`,
      `${provider} API key provisioned in secrets manager (not in git).`,
      `${provider} SDK installed and wired into the real-screening branch.`,
      `Sandbox screening executed and recorded in audit trail.`,
      `Compliance officer sign-off on first live screening.`,
      `Flip providerLive=true only after all of the above.`,
    ],
    honestWarning:
      `${provider} registered as intended provider, but NO LIVE API is wired. ` +
      `All real screenings will FAIL-CLOSED until providerLive=true.`,
  };
}

// ---------------------------------------------------------------------------
// Fail-closed result builder (used whenever screening cannot be performed)
// ---------------------------------------------------------------------------

function failClosedResult(
  reason: string,
  provider: ScreeningProvider,
): SanctionsScreeningResult {
  // `reason` is surfaced via the matches list as an informational entry so
  // callers can see WHY screening failed closed. It is NOT a sanctions
  // match — `passed` is `false` and `riskLevel` is CRITICAL per §V24.2.13.
  const matches: SanctionsMatch[] = [
    {
      list: "OFAC", // informational carrier only — see `program` field
      entity: `[FAIL-CLOSED] ${reason}`,
      matchStrength: 0,
      program: "NOT_SCREENED — fail-closed (§V24.2.13)",
    },
  ];
  return {
    screened: false,
    passed: false, // §V24.2.13 fail-closed: when in doubt, block
    riskLevel: "CRITICAL", // un-screened traffic is treated as CRITICAL
    matches,
    screenedAt: new Date().toISOString(),
    screeningProvider: provider,
    listVersions: { ...SIMULATED_LIST_VERSIONS },
    honestState: {
      productionReady: false,
      liveScreenings,
      failClosed: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Core screening entrypoint
// ---------------------------------------------------------------------------

export function screenCounterparty(
  input: ScreeningInput,
): SanctionsScreeningResult {
  const screenedAt = new Date().toISOString();

  // Rule 1: ALL screenings default to FAIL-CLOSED if provider is NOT_CONNECTED.
  if (currentProvider === "NOT_CONNECTED") {
    return failClosedResult(
      "No screening provider connected (NOT_CONNECTED).",
      "NOT_CONNECTED",
    );
  }

  // If a real provider is registered but not yet live (no API wired),
  // fail-closed. This is the honest behavior: we cannot fabricate a
  // screening result from a provider we are not actually calling.
  if (
    currentProvider !== "SIMULATED" &&
    providerLive === false
  ) {
    return failClosedResult(
      `Provider ${currentProvider} registered but not live (no API wired).`,
      currentProvider,
    );
  }

  // SIMULATED branch — only path that currently returns a "screened" result.
  // In production this branch is replaced by a real provider SDK call.
  if (currentProvider === "SIMULATED") {
    return simulatedScreen(input, screenedAt);
  }

  // Real provider branch (providerLive === true). This is currently
  // unreachable because providerLive is never set to true. When a real
  // provider is contracted, this branch must be implemented to call the
  // provider's API, persist the result, and increment liveScreenings.
  // Until then we fail-closed (defensive: never silently fabricate).
  return failClosedResult(
    `Real provider ${currentProvider} branch not implemented (infrastructure stub).`,
    currentProvider,
  );
}

// ---------------------------------------------------------------------------
// SIMULATED screening logic — test fixtures only
// ---------------------------------------------------------------------------

function simulatedScreen(
  input: ScreeningInput,
  screenedAt: string,
): SanctionsScreeningResult {
  const name = (input.counterpartyName ?? "").trim().toUpperCase();

  // Known-bad test entity → OFAC SDN match (FAIL)
  if (TEST_BAD_ENTITIES.has(name) || name.startsWith("TEST-BAD-")) {
    const matches: SanctionsMatch[] = [
      {
        list: "OFAC",
        entity: `${name} (SIMULATED SDN ENTRY — test fixture)`,
        matchStrength: 0.99,
        program: "SIMULATED — OFAC SDN List (test fixture, not real)",
      },
    ];
    return {
      screened: true,
      passed: false, // Rule 2: any entity on a sanctions list fails
      riskLevel: "CRITICAL",
      matches,
      screenedAt,
      screeningProvider: "SIMULATED",
      listVersions: { ...SIMULATED_LIST_VERSIONS },
      honestState: {
        productionReady: false,
        liveScreenings, // unchanged — simulated call does not increment
        failClosed: true,
      },
    };
  }

  // Known-good test entity → passes with LOW risk
  if (TEST_GOOD_ENTITIES.has(name) || name.startsWith("TEST-GOOD-")) {
    return {
      screened: true,
      passed: true,
      riskLevel: "LOW",
      matches: [],
      screenedAt,
      screeningProvider: "SIMULATED",
      listVersions: { ...SIMULATED_LIST_VERSIONS },
      honestState: {
        productionReady: false,
        liveScreenings,
        failClosed: true,
      },
    };
  }

  // Known-unknown test entity → passes with MEDIUM risk (unverified)
  if (TEST_UNKNOWN_ENTITIES.has(name) || name === "TEST-UNKNOWN") {
    return {
      screened: true,
      passed: true, // not on any list — passes, but unverified
      riskLevel: "MEDIUM", // elevated because unverified
      matches: [],
      screenedAt,
      screeningProvider: "SIMULATED",
      listVersions: { ...SIMULATED_LIST_VERSIONS },
      honestState: {
        productionReady: false,
        liveScreenings,
        failClosed: true,
      },
    };
  }

  // Any other entity in SIMULATED mode — treat as unverified MEDIUM risk.
  // We do NOT pass arbitrary names as LOW risk, because SIMULATED mode has
  // no real list to check against. This is the honest default.
  return {
    screened: true,
    passed: true,
    riskLevel: "MEDIUM",
    matches: [],
    screenedAt,
    screeningProvider: "SIMULATED",
    listVersions: { ...SIMULATED_LIST_VERSIONS },
    honestState: {
      productionReady: false,
      liveScreenings,
      failClosed: true,
    },
  };
}

// ---------------------------------------------------------------------------
// Test fixtures exported for documentation / API surface
// ---------------------------------------------------------------------------

export const SIMULATED_TEST_FIXTURES = {
  knownGood: ["TEST-GOOD-BANK", "TEST-GOOD-CORPORATION", "TEST-GOOD-CUSTODIAN"],
  knownBad: [
    "TEST-BAD-ENTITY",
    "TEST-OFAC-SDN",
    "TEST-UN-DESIGNATED",
    "TEST-EU-CFSP-LISTED",
    "TEST-HMT-OFSI-LISTED",
  ],
  knownUnknown: ["TEST-UNKNOWN", "TEST-UNVERIFIED"],
} as const;
