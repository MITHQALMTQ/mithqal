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
import {
  PRIVACY_ARCHITECTURE,
  ZK_ARCHITECTURE,
  BANK_REVENUE_MODEL,
  MITHQAL_OPERATING_COMPANY,
  NON_COMPETE_PRINCIPLE,
  FX_BOUNDARY,
  PRODUCT_HIERARCHY,
  TEN_PRINCIPLES,
  AUTHORITY_MATRIX,
  REGULATORY_OBSERVABILITY,
  ECONOMIC_PROPOSITION,
  FINAL_ARCHITECTURE,
} from "@/lib/v25-0-privacy-revenue-principles";
import { DIVISION_OF_CONTROL } from "@/lib/corporate-settlement-account";
import { checkSettlementPermissions } from "@/lib/proof-of-liabilities";
import {
  INSTITUTIONAL_NEUTRALITY,
  MTQ_NEUTRAL_DEFINITION,
  BRICS_INTEGRATION_PRINCIPLE,
  BSIA_PROPERTIES,
  GLOBAL_INTEROP_MODEL,
  US_GATEWAY_PRINCIPLE,
  US_BRICS_COMPATIBILITY,
  SANCTIONS_NEUTRALITY,
  CORRIDOR_AUTHORIZATION,
  BRICS_UNIT_POLICY,
  MTQ_BRICS_INDEPENDENCE,
  MULTI_CURRENCY_SETTLEMENT,
  MTQ_VS_BRICS_DISTINCTION,
  CB_INTEROP,
  MARKETING_NEUTRALITY,
  CROSS_JURISDICTIONAL_PRIVACY,
  PRIVACY_US_BRICS,
  BRICS_ADAPTER_SECURITY,
  JURISDICTIONAL_EMERGENCY_ISOLATION,
  ECONOMIC_RESILIENCE,
  BRICS_PILOT_STRATEGY,
  FINAL_BRICS_US_STATEMENT,
  FINAL_DESIGN_DECISION,
  TECHNICAL_ARCHITECTURE_JSG,
  KNOWN_JSGS,
} from "@/lib/v25-0-brics-neutrality-amendment";
import { JSGManager, BRICSInteroperabilityAdapter, checkMTQIndependence } from "@/lib/brics-jsg-runtime";

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

      // §14 — 3-Layer Privacy Architecture
      privacy: PRIVACY_ARCHITECTURE,

      // §15 — Zero-knowledge architecture
      zkArchitecture: ZK_ARCHITECTURE,

      // §8 — Bank Revenue Model
      bankRevenue: BANK_REVENUE_MODEL,

      // §9 — MITHQAL Operating Company
      operatingCompany: MITHQAL_OPERATING_COMPANY,

      // §29 — Non-compete principle
      nonCompete: NON_COMPETE_PRINCIPLE,

      // §28 — FX boundary
      fxBoundary: FX_BOUNDARY,

      // §39 — Product Hierarchy
      productHierarchy: PRODUCT_HIERARCHY,

      // §43 — 10 Constitutional Principles
      tenPrinciples: TEN_PRINCIPLES,

      // §41 — Authority Matrix
      authorityMatrix: AUTHORITY_MATRIX,

      // §17 — Regulatory observability
      regulatoryObservability: REGULATORY_OBSERVABILITY,

      // §30 — Economic proposition
      economicProposition: ECONOMIC_PROPOSITION,

      // §44 — Final COO Decision (locked architecture)
      finalArchitecture: FINAL_ARCHITECTURE,

      // §5 — Division of Control (bank vs MITHQAL)
      divisionOfControl: DIVISION_OF_CONTROL,

      // ============ BRICS / U.S. / JURISDICTIONAL NEUTRALITY AMENDMENT ============

      // §1 — Institutional Neutrality
      bricsNeutrality: INSTITUTIONAL_NEUTRALITY,

      // §2 — MTQ Neutral Definition
      mtqNeutralDefinition: MTQ_NEUTRAL_DEFINITION,

      // §3 — BRICS Integration Principle
      bricsIntegration: BRICS_INTEGRATION_PRINCIPLE,

      // §4 — BRICS Settlement Interoperability Adapter (BSIA)
      bricsAdapter: {
        properties: BSIA_PROPERTIES,
        runtimeStatus: new BRICSInteroperabilityAdapter().getConfig(),
      },

      // §5 — Global Monetary Interoperability Model
      globalInteropModel: GLOBAL_INTEROP_MODEL,

      // §6 — Jurisdictional Settlement Gateways (JSG)
      jurisdictionalGateways: {
        known: new JSGManager().listGateways(),
        enforcementRules: KNOWN_JSGS,
      },

      // §7 — U.S. Gateway Principle
      usGatewayPrinciple: US_GATEWAY_PRINCIPLE,

      // §8 — U.S. / BRICS Compatibility
      usBricsCompatibility: US_BRICS_COMPATIBILITY,

      // §9 — Sanctions / Geopolitical Neutrality
      sanctionsNeutrality: SANCTIONS_NEUTRALITY,

      // §10 — Corridor Authorization Policy
      corridorAuthorization: CORRIDOR_AUTHORIZATION,

      // §11 — BRICS Unit Policy
      bricsUnitPolicy: BRICS_UNIT_POLICY,

      // §12 — MTQ Independence from BRICS
      mtqBricsIndependence: {
        ...MTQ_BRICS_INDEPENDENCE,
        check: checkMTQIndependence(),
      },

      // §13 — Multi-Currency Settlement
      multiCurrencySettlement: MULTI_CURRENCY_SETTLEMENT,

      // §14 — MTQ vs BRICS Currency Distinction
      mtqVsBrics: MTQ_VS_BRICS_DISTINCTION,

      // §15 — Central-Bank Interoperability
      cbInterop: CB_INTEROP,

      // §16 — Marketing Neutrality
      marketingNeutrality: MARKETING_NEUTRALITY,

      // §17 — Cross-Jurisdictional Privacy
      crossJurisdictionalPrivacy: CROSS_JURISDICTIONAL_PRIVACY,

      // §18 — Privacy + U.S. / BRICS
      privacyUsBrics: PRIVACY_US_BRICS,

      // §20 — Technical Architecture (JSG Model)
      technicalArchitectureJSG: TECHNICAL_ARCHITECTURE_JSG,

      // §21 — BRICS Adapter Security
      bricsAdapterSecurity: BRICS_ADAPTER_SECURITY,

      // §22 — Jurisdictional Emergency Isolation
      emergencyIsolation: JURISDICTIONAL_EMERGENCY_ISOLATION,

      // §23 — Economic Resilience
      economicResilience: ECONOMIC_RESILIENCE,

      // §24 — BRICS Pilot Strategy
      bricsPilotStrategy: BRICS_PILOT_STRATEGY,

      // §25 — Final BRICS / U.S. Canonical Statement
      finalBricsUsStatement: FINAL_BRICS_US_STATEMENT,

      // §26 — Final Design Decision
      finalDesignDecision: FINAL_DESIGN_DECISION,

      // ============ END BRICS AMENDMENT ============

      // §36 — Settlement Permission Engine (demo)
      settlementPermissionEngine: {
        description: "12-check gate — every transaction must pass ALL checks. Any failure = BLOCK. No partial settlement.",
        checks: [
          "1. Institution A authorized",
          "2. Institution B authorized",
          "3. Corridor allowed",
          "4. Jurisdiction allowed",
          "5. Currency pair allowed",
          "6. Customer authorization attested",
          "7. AML/KYC status valid",
          "8. Sanctions clear",
          "9. Transaction within limit",
          "10. Reserve/liquidity state allows",
          "11. Network healthy",
          "12. Policy version valid",
        ],
      },

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
