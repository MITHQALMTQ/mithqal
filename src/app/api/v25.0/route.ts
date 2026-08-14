import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";
import {
  MITHQAL_IDENTITY,
  MTQ_DEFINITION,
  PARTICIPANT_CLASSES,
  MINTING_MODEL,
  ISSUANCE_PIPELINE,
  KYC_ARCHITECTURE,
  SETTLEMENT_FLOW,
  NEUTRALITY_DOCTRINE,
  CBDC_INTEROP,
  CB_PARTICIPATION_MODES,
  VALUE_PROPOSITION,
  CANONICAL_STATEMENT,
  TERMINOLOGY,
  TRADING_LANGUAGE,
  FINALITY,
  canMint,
  canSettle,
} from "@/lib/v25-0-identity";
import {
  JURISDICTION_REGISTRY,
  INSTITUTION_REGISTRY,
  checkInstitutionAuthorization,
  isGeoFenced,
  getInstitutionalLimits,
} from "@/lib/institutional-authorization";
import { processWholesaleSettlement, checkCBDCInterop, processRedemption } from "@/lib/wholesale-settlement";

/**
 * GET /api/v25.0
 *
 * MITHQAL v25.0 — Neutral Wholesale Settlement Architecture
 *
 * This is the new canonical operating model. v24.2.1 reserve architecture
 * is PRESERVED (constitutional spine intact), but the participant model
 * is transformed from participant-accessible to permissioned wholesale.
 */
export async function GET() {
  try {
    const nav = await computeLiveNav();
    const rr = nav.reserveRatio;

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      version: "v25.0",
      amendmentName: "Neutral Wholesale Settlement Architecture",

      // §31 — Required Final Blueprint Statement
      canonicalStatement: CANONICAL_STATEMENT,

      // §1 — Canonical Identity
      identity: MITHQAL_IDENTITY,
      mtq: MTQ_DEFINITION,

      // §2 — Participant Classes
      participantClasses: PARTICIPANT_CLASSES.map(p => ({
        class: p.class,
        name: p.name,
        directMinting: p.directMinting,
        directSettlement: p.directSettlement,
        capabilities: p.capabilities,
        authorizationRequired: p.authorizationRequired,
      })),

      // §3 — Minting Model
      mintingModel: MINTING_MODEL,
      issuancePipeline: ISSUANCE_PIPELINE,

      // §4 — KYC Architecture
      kyc: KYC_ARCHITECTURE,

      // §5 — Settlement Flow
      settlementFlow: SETTLEMENT_FLOW,

      // §6 — Neutrality Doctrine (immutable)
      neutralityDoctrine: NEUTRALITY_DOCTRINE,

      // §7 — CBDC Interoperability
      cbdcInterop: CBDC_INTEROP,

      // §8 — Central-Bank Participation Modes
      cbParticipationModes: CB_PARTICIPATION_MODES,

      // §10 — Value Proposition
      valueProposition: VALUE_PROPOSITION,

      // §13 — Trading Language
      tradingLanguage: TRADING_LANGUAGE,

      // §22 — Settlement Finality
      finality: FINALITY,

      // §15 — Jurisdictional Registry
      jurisdictions: Object.keys(JURISDICTION_REGISTRY).map(code => ({
        code,
        geoFenced: isGeoFenced(code),
        mtqLegalStatus: JURISDICTION_REGISTRY[code].mtqLegalStatus,
        settlementStatus: JURISDICTION_REGISTRY[code].settlementStatus,
      })),

      // §20 — Authorized Institutions
      authorizedInstitutions: INSTITUTION_REGISTRY.map(i => ({
        institutionId: i.institutionId,
        legalName: i.legalName,
        jurisdiction: i.jurisdiction,
        participantClass: i.participantClass,
        operationalStatus: i.operationalStatus,
        sanctionsStatus: i.sanctionsStatus,
        permittedFunctions: i.permittedMTQFunctions,
      })),

      // §28 — Canonical Terminology
      terminology: TERMINOLOGY,

      // Live values (preserved from v24.2.1)
      liveValues: {
        rr,
        nav: nav.navMarket,
        supply: nav.supply,
        goldUsd: nav.goldUsd,
      },

      // §29 — Preserved v24.2 Strengths
      preserved: [
        "constitutional authority hierarchy",
        "immutable invariants (PAR=1.00, RR≥100%, no discretionary minting)",
        "reserve segregation (no lending, no rehypothecation)",
        "gold strategic anchor (Portfolio B: 15% phys + 5% PAXG)",
        "four-layer measurement system (GEI/BRI/LCI/RQS)",
        "six-state reserve state machine",
        "StressDRQS + hierarchical optimizer",
        "model-validity gate + 15-component trade-cost model",
        "jurisdictional matrix + China geo-fence",
        "OFAC fail-closed + proof-of-reserves + proof-of-solvency",
        "formal verification + multi-oracle consensus",
        "atomic minting/redemption + idempotent CTID",
        "Sharia governance + human governance",
      ],

      // Status
      status: "v25.0 — APPROVED CANDIDATE FOR CONTROLLED TESTING",
      productionDecision: "IMPLEMENTED + PROVISIONALLY VALIDATED + NOT PRODUCTION-AUTHORIZED",
      decisionReason: "v25.0 transforms MITHQAL into permissioned wholesale neutral settlement infrastructure. Constitutional spine preserved. Participant model transformed. CBDC interop first-class. NOT production-certified, NOT regulator-approved.",

      // Helper functions (for API consumers)
      helpers: {
        canClassMint: "GET /api/v25.0/can-mint?class=B",
        checkAuthorization: "GET /api/v25.0/authorize?institutionId=INST-001&function=SETTLE&amount=1000",
        checkGeoFence: "GET /api/v25.0/geo-fence?jurisdiction=CN",
        processSettlement: "POST /api/v25.0/settle",
        checkCBDC: "GET /api/v25.0/cbdc-interop",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to compute v25.0 state", detail: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
