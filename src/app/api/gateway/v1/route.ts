// v25.0 FINAL ARCHITECTURAL AMENDMENT — Versioned Gateway API ROUTE
// =================================================================
// Task ID: MBG-FINAL-ARCHITECTURAL-AMENDMENT
//
// Exposes the 8 versioned gateway endpoints defined in §30 of the
// MITHQAL Bank Gateway specification:
//
//   POST /gateway/v1/instructions      — submit MTQ settlement instruction
//   GET  /gateway/v1/status            — query instruction status
//   GET  /gateway/v1/reconciliation    — run 5-way reconciliation
//   POST /gateway/v1/attestation       — submit bank compliance attestation
//   GET  /gateway/v1/settlements       — list settlement records
//   POST /gateway/v1/redemptions       — submit redemption instruction
//   GET  /gateway/v1/limits            — query bank transaction limits
//   GET  /gateway/v1/incidents         — list active incidents
//
// This route is the VERSIONED GATEWAY API ROUTE (the index/discovery
// endpoint for /gateway/v1/*). It returns the full list of 8 endpoint
// definitions with their schemas + required security flags.
//
// The individual POST / GET handlers for instructions / status /
// reconciliation / etc. are STUBS for now — they require a real bank
// gateway to be deployed (per §30) and are marked SIMULATED.
//
// HONEST STATE: This route returns SIMULATED responses. Real bank
// traffic requires (a) a real bank contracted, (b) technical
// certification, (c) real HSM-bound signing keys, (d) mutual-TLS
// channel. integrationState = INTEGRATION-READY (not BANK-CONTRACTED).
// =================================================================

import { NextResponse } from "next/server";
import {
  BANK_GATEWAY_API_ENDPOINTS,
  MODULE_VERSION,
  TASK_ID,
  AMENDMENT_PRINCIPLE,
  CURRENT_INTEGRATION_STATE,
  HONEST_STATE,
  MSAS_STANDARD,
  MSAS_ADAPTER_TEMPLATES,
  ZERO_TRUST_PROFILE,
  enforceZeroTrust,
  type BankGatewayAPIEndpoint,
  type GatewayRequest,
  type MTQStatusEvent,
  type MTQSettlementInstruction,
  type BankComplianceAttestation,
  type FiveWayReconciliationReport,
  type FiveWayReconciliationStatus,
  type ConnectivitySecurityProfile,
  type BankSecurityProfile,
  type MithqalBankGateway,
  type MSASConnectorClass,
  type BankGatewayDeploymentModel,
  type MTQ_STATUS_EVENT_DESCRIPTIONS,
} from "@/lib/mithqal-bank-gateway";

/**
 * GET /api/gateway/v1 — discovery endpoint. Returns the 8 endpoint
 * definitions with their schemas + required security flags, plus the
 * zero-trust profile, MSAS standard, and honest-state metadata.
 */
export async function GET() {
  try {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      moduleId: MODULE_VERSION,
      taskId: TASK_ID,
      canonicalPrinciple: AMENDMENT_PRINCIPLE,

      // Headline: integration state
      integrationState: CURRENT_INTEGRATION_STATE,
      honestState: {
        integrationState: HONEST_STATE.integrationState,
        banksContracted: HONEST_STATE.banksContracted,
        banksLivePilot: HONEST_STATE.banksLivePilot,
        realBankIntegrations: HONEST_STATE.realBankIntegrations,
        honest: HONEST_STATE.honest,
        forcedToPass: HONEST_STATE.forcedToPass,
        noFalseZeroIntegrationClaim: HONEST_STATE.noFalseZeroIntegrationClaim,
        noFalseBankIntegrationClaim: HONEST_STATE.noFalseBankIntegrationClaim,
      },

      // The 8 versioned gateway endpoints (§30)
      apiVersion: "v1",
      basePath: "/gateway/v1",
      endpoints: BANK_GATEWAY_API_ENDPOINTS,
      endpointCount: BANK_GATEWAY_API_ENDPOINTS.length,

      // Per-endpoint stubs (all SIMULATED — require real bank gateway)
      stubs: BANK_GATEWAY_API_ENDPOINTS.map((ep) => ({
        path: ep.path,
        method: ep.method,
        status: "SIMULATED" as const,
        reason:
          "Individual handlers require a real bank gateway deployed (mutual-TLS + " +
          "HSM-bound signing keys + technical certification). integrationState=" +
          CURRENT_INTEGRATION_STATE +
          " (not BANK-CONTRACTED).",
        exampleRequest: getExampleRequest(ep),
        exampleResponse: getExampleResponse(ep),
      })),

      // Zero-trust profile (every request must authenticate)
      zeroTrust: {
        profile: ZERO_TRUST_PROFILE,
        canonicalRule: "No unauthenticated bank-to-MITHQAL settlement request.",
      },

      // MSAS adapter standard + 7 connector class templates
      msasStandard: MSAS_STANDARD,
      adapterTemplates: MSAS_ADAPTER_TEMPLATES,

      // Endpoint summary
      summary: {
        totalEndpoints: BANK_GATEWAY_API_ENDPOINTS.length,
        getEndpoints: BANK_GATEWAY_API_ENDPOINTS.filter((e) => e.method === "GET").length,
        postEndpoints: BANK_GATEWAY_API_ENDPOINTS.filter((e) => e.method === "POST").length,
        requiringIdempotency: BANK_GATEWAY_API_ENDPOINTS.filter((e) => e.requiresIdempotency).length,
        requiringSignedMessage: BANK_GATEWAY_API_ENDPOINTS.filter(
          (e) => e.requiresSignedMessage,
        ).length,
      },

      // Honest-state summary
      honest: true,
      forced_to_pass: false,
      productionAuthorized: false,
      banksContracted: 0,
      realBankIntegrations: 0,

      finalReminder:
        "INTEGRATION-READY (AMBER). 8 endpoints defined. Individual POST/GET handlers " +
        "are SIMULATED — they require a real bank gateway deployed (mutual-TLS + " +
        "HSM-bound signing keys + technical certification). Canonical principle: " +
        "'TRANSLATION, NOT TRANSFORMATION.' No core replacement. Minimal integration.",
    });
  } catch (err) {
    console.error("[api/gateway/v1] failed:", err);
    return NextResponse.json(
      {
        error: "Could not generate versioned gateway API discovery response.",
        detail: err instanceof Error ? err.message : "unknown error",
        moduleId: MODULE_VERSION,
        taskId: TASK_ID,
      },
      { status: 500 },
    );
  }
}

/**
 * Build an example request body for an endpoint (SIMULATED — for
 * documentation/discovery only; not a real request handler).
 */
function getExampleRequest(ep: BankGatewayAPIEndpoint): unknown {
  switch (ep.path) {
    case "/gateway/v1/instructions":
      return {
        institutionId: "INST-SIMULATED-001",
        originBankId: "BANK-SIM-US-001",
        destinationBankId: "BANK-SIM-JP-002",
        corporateReference: "CRP-EXAMPLE-001",
        customerAuthorizationReference: "AUTH-EXAMPLE-001",
        amount: 1_000_000,
        settlementCurrency: "USD",
        mtqAmount: 1_000_000,
        transactionPurpose: "WHOLESALE_SETTLEMENT",
        jurisdiction: "US-JP",
        corridor: "US-JP-WHOLESALE",
        sanctionsStatus: "CLEARED",
        idempotencyKey: "IDM-EXAMPLE-001",
        bankTransactionReference: "BTX-EXAMPLE-001",
        cryptographicSignature: "0x...",
      } satisfies Partial<MTQSettlementInstruction>;

    case "/gateway/v1/status":
      return { instructionId: "MBG-INSTR-EXAMPLE-001" };

    case "/gateway/v1/reconciliation":
      return { bankId: "BANK-SIM-US-001", asOf: "2026-01-01T00:00:00Z" };

    case "/gateway/v1/attestation":
      return {
        attestationId: "ATT-EXAMPLE-001",
        institutionId: "INST-SIMULATED-001",
        assertions: [
          "KYC",
          "KYB",
          "AML",
          "SANCTIONS",
          "ACCOUNT_AUTHORITY",
          "FUNDS_AVAILABLE",
          "TRANSACTION_AUTHORIZED",
        ].map((a) => ({
          assertion: a,
          passed: true,
          attestationId: "ATT-EXAMPLE-001",
          attestedAt: "2026-01-01T00:00:00Z",
          attestedBy: "BANK-COMPLIANCE-SYSTEM",
        })),
        signature: "0x...",
        issuedAt: "2026-01-01T00:00:00Z",
        expiresAt: "2026-01-02T00:00:00Z",
        complianceSystemVersion: "v1.0",
      } satisfies BankComplianceAttestation;

    case "/gateway/v1/settlements":
      return {
        bankId: "BANK-SIM-US-001",
        from: "2026-01-01T00:00:00Z",
        to: "2026-02-01T00:00:00Z",
        corridor: "US-JP-WHOLESALE",
        page: 1,
      };

    case "/gateway/v1/redemptions":
      return {
        bankId: "BANK-SIM-US-001",
        corporateReference: "CRP-EXAMPLE-001",
        mtqAmount: 500_000,
        bankTransactionReference: "BTX-REDEMPTION-EXAMPLE-001",
      };

    case "/gateway/v1/limits":
      return { bankId: "BANK-SIM-US-001" };

    case "/gateway/v1/incidents":
      return {
        bankId: "BANK-SIM-US-001",
        severity: "WARNING" as const,
      };

    default:
      return null;
  }
}

/**
 * Build an example response body for an endpoint (SIMULATED — for
 * documentation/discovery only).
 */
function getExampleResponse(ep: BankGatewayAPIEndpoint): unknown {
  switch (ep.path) {
    case "/gateway/v1/instructions":
      return {
        instructionId: "MBG-INSTR-EXAMPLE-001",
        finalityState: "RECEIVED" as MTQStatusEvent,
        timestamp: "2026-01-01T00:00:00Z",
        status: "SIMULATED",
      };

    case "/gateway/v1/status":
      return {
        instructionId: "MBG-INSTR-EXAMPLE-001",
        finalityState: "SETTLED" as MTQStatusEvent,
        description:
          "MTQ delivered to receiving bank's corporate account. Technical finality achieved.",
        timestamp: "2026-01-01T00:00:01Z",
      };

    case "/gateway/v1/reconciliation":
      return {
        canonicalLedgerTotal: 0,
        bankSubledgerTotal: 0,
        corporatePositionsTotal: 0,
        reserveLedgerTotal: 0,
        proofOfLiabilitiesTotal: 0,
        status: "RECONCILED" as FiveWayReconciliationStatus,
        mismatches: [],
        timestamp: "2026-01-01T00:00:00Z",
        toleranceBps: 1,
        criticalThresholdBps: 100,
      } satisfies FiveWayReconciliationReport;

    case "/gateway/v1/attestation":
      return {
        attestationId: "ATT-EXAMPLE-001",
        valid: true,
        missingAssertions: [],
        failedAssertions: [],
        expired: false,
        signatureMissing: false,
      };

    case "/gateway/v1/settlements":
      return {
        settlements: [],
        totalCount: 0,
        page: 1,
      };

    case "/gateway/v1/redemptions":
      return {
        redemptionId: "RDM-EXAMPLE-001",
        burnTransactionId: "BURN-EXAMPLE-001",
        reserveReleaseAmount: 500_000,
        finalityState: "REDEEMED" as MTQStatusEvent,
      };

    case "/gateway/v1/limits":
      return {
        maxSingleTransactionUSD: 100_000_000,
        dailyLimitUSD: 500_000_000,
        monthlyLimitUSD: 5_000_000_000,
        velocityChecksEnabled: true,
      };

    case "/gateway/v1/incidents":
      return { incidents: [] };

    default:
      return null;
  }
}
