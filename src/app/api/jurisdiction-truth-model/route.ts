import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  JURISDICTION_TRUTH_ENTRIES,
  JURISDICTION_STATE_DEFINITIONS,
  RMB_EXPOSURE_DIMENSIONS,
  JURISDICTION_AUDIT_SUMMARY,
  UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE,
  NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE,
  CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE,
  JURISDICTION_TRUTH_MODEL_VERSION,
  JURISDICTION_TRUTH_MODEL_SOURCE,
  JURISDICTION_TRUTH_MODEL_STATUS,
  JURISDICTION_COUNT,
  STATE_COUNT,
  RMB_DIMENSION_COUNT,
  JURISDICTION_TRUTH_MODEL_HONEST_STATE,
  getJurisdiction,
  getStateDefinition,
  type JurisdictionCode,
  type JurisdictionState,
} from "@/lib/jurisdiction-truth-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/jurisdiction-truth-model
 *
 * P41 Jurisdiction Truth Model + CNY/CNH Distinction.
 * Per PROMPT 41: 8 canonical states (SEED_DATA, PUBLIC_MATERIAL_TRIAGE,
 * LEGAL_REVIEW, INSTITUTIONALLY_VALIDATED, LICENSED_WHERE_REQUIRED,
 * RESTRICTED, PROHIBITED, UNKNOWN). UNKNOWN = CONSERVATIVE_BLOCK.
 * Engineering labels MUST NEVER be mistaken for legal authorization.
 * 8 seeded jurisdictions audited (US, CN, AE, SG, JP, GB, EU, OTHER).
 * For RMB exposure: 7 dimensions distinguished (onshore CNY / offshore CNH /
 * custody jurisdiction / conversion venue / settlement rail /
 * sanctions-capital-control constraints / legal accessibility).
 * Holding a currency in a reserve ≠ lawful access to its domestic settlement system.
 *
 * Query params:
 *  - ?jurisdictionCode=US|CN|AE|SG|JP|GB|EU|OTHER
 *  - ?state=SEED_DATA|PUBLIC_MATERIAL_TRIAGE|LEGAL_REVIEW|INSTITUTIONALLY_VALIDATED|LICENSED_WHERE_REQUIRED|RESTRICTED|PROHIBITED|UNKNOWN
 *  - ?view=audit (audit summary view)
 *  - ?view=rmb (RMB exposure detail for CN jurisdiction)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "jurisdiction-truth-model",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const jurisdictionCode = url.searchParams.get(
    "jurisdictionCode",
  ) as JurisdictionCode | null;
  const state = url.searchParams.get("state") as JurisdictionState | null;
  const view = url.searchParams.get("view");

  // Single-jurisdiction lookup
  if (jurisdictionCode) {
    const jurisdiction = getJurisdiction(jurisdictionCode);
    if (!jurisdiction) {
      return NextResponse.json(
        { error: `Invalid jurisdictionCode: ${jurisdictionCode}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: JURISDICTION_TRUTH_MODEL_SOURCE,
      },
      jurisdiction,
    });
  }

  // State-definition lookup
  if (state) {
    const stateDef = getStateDefinition(state);
    if (!stateDef) {
      return NextResponse.json(
        { error: `Invalid state: ${state}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: JURISDICTION_TRUTH_MODEL_SOURCE,
      },
      state: stateDef,
    });
  }

  // Audit view — audit summary
  if (view === "audit") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: JURISDICTION_TRUTH_MODEL_SOURCE,
        version: JURISDICTION_TRUTH_MODEL_VERSION,
        status: JURISDICTION_TRUTH_MODEL_STATUS,
        overrideRule:
          "P41 Jurisdiction Truth Model — audit view. " +
          "8 seeded jurisdictions audited. " +
          "UNKNOWN = CONSERVATIVE_BLOCK. Engineering labels ≠ legal authority.",
        changeRequest: "CR-2026-017 (per Architecture Freeze v25.3.15)",
      },
      auditSummary: JURISDICTION_AUDIT_SUMMARY,
    });
  }

  // RMB view — RMB exposure detail
  if (view === "rmb") {
    const cn = getJurisdiction("CN");
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: JURISDICTION_TRUTH_MODEL_SOURCE,
        version: JURISDICTION_TRUTH_MODEL_VERSION,
        status: JURISDICTION_TRUTH_MODEL_STATUS,
        overrideRule:
          "P41 Jurisdiction Truth Model — RMB exposure view. " +
          "7 dimensions distinguished per PROMPT 41: onshore CNY / offshore CNH / " +
          "custody jurisdiction / conversion venue / settlement rail / " +
          "sanctions-capital-control constraints / legal accessibility. " +
          "Holding a currency in a reserve ≠ lawful access to its domestic " +
          "settlement system.",
        changeRequest: "CR-2026-017 (per Architecture Freeze v25.3.15)",
      },
      jurisdiction: cn?.jurisdictionCode,
      rmbDimensions: RMB_EXPOSURE_DIMENSIONS,
      rmbExposure: cn?.rmbExposure,
      currencyHoldingRule: {
        ruleId: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.ruleId,
        rule: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.rule,
        sevenDimensions: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.sevenDimensions,
      },
    });
  }

  // Default — full truth model
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: JURISDICTION_TRUTH_MODEL_SOURCE,
      version: JURISDICTION_TRUTH_MODEL_VERSION,
      status: JURISDICTION_TRUTH_MODEL_STATUS,
      overrideRule:
        "P41 Jurisdiction Truth Model + CNY/CNH Distinction — 8 canonical states. " +
        "UNKNOWN = CONSERVATIVE_BLOCK. " +
        "Engineering labels MUST NEVER be mistaken for legal authorization. " +
        "8 seeded jurisdictions audited. " +
        "Holding a currency in a reserve ≠ lawful access to its domestic " +
        "settlement system.",
      changeRequest: "CR-2026-017 (per Architecture Freeze v25.3.15)",
    },
    stateCount: STATE_COUNT,
    jurisdictionCount: JURISDICTION_COUNT,
    rmbDimensionCount: RMB_DIMENSION_COUNT,
    canonicalStates: JURISDICTION_STATE_DEFINITIONS,
    jurisdictions: JURISDICTION_TRUTH_ENTRIES,
    rmbExposureDimensions: RMB_EXPOSURE_DIMENSIONS,
    auditSummary: JURISDICTION_AUDIT_SUMMARY,
    unknownIsConservativeBlockRule: {
      ruleId: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.ruleId,
      rule: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.rule,
      description: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.description,
      whatItForbids: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.whatItForbids,
      whatItPermits: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.whatItPermits,
      enforcement: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.enforcement,
      settlementAllowedMatrix: UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.settlementAllowedMatrix,
    },
    noRegistryAsLegalAuthorityRule: {
      ruleId: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.ruleId,
      rule: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.rule,
      description: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.description,
      whatItForbids: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.whatItForbids,
      whatItPermits: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.whatItPermits,
      enforcement: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.enforcement,
      requiredEvidenceSources: NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.requiredEvidenceSources,
    },
    currencyHoldingNotSettlementAccessRule: {
      ruleId: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.ruleId,
      rule: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.rule,
      description: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.description,
      whatItForbids: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.whatItForbids,
      whatItPermits: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.whatItPermits,
      enforcement: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.enforcement,
      sevenDimensions: CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.sevenDimensions,
    },
    honestState: JURISDICTION_TRUTH_MODEL_HONEST_STATE,
    rule: "Per PROMPT 41: 'Refactor the jurisdiction model so engineering labels can NEVER be mistaken for legal authorization. Canonical states must distinguish: SEED_DATA, PUBLIC-MATERIAL_TRIAGE, LEGAL_REVIEW, INSTITUTIONALLY_VALIDATED, LICENSED_WHERE_REQUIRED, RESTRICTED, PROHIBITED, UNKNOWN. A jurisdiction with no independent legal validation must not be represented as legally ALLOWED merely because an internal registry contains ALLOWED. Make: UNKNOWN = CONSERVATIVE BLOCK unless a defined evidence package explicitly moves the jurisdiction forward. Audit all eight seeded jurisdictions and reconcile all conflicting registry representations. For RMB exposure, explicitly distinguish: onshore CNY; offshore CNH; custody jurisdiction; conversion venue; settlement rail; sanctions/capital-control constraints; legal accessibility. Do not infer that holding a currency in a reserve is equivalent to having lawful access to its domestic settlement system. Any unsupported CNY/RMB path must remain conditional or blocked.'",
  });
}
