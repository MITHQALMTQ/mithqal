import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  SHARIA_GOVERNANCE_FIELDS,
  SHARIA_CODEBASE_REFERENCES,
  SHARIA_CODEBASE_SCAN_SUMMARY,
  SHARIA_DISCLOSURE_BANNER,
  OPTIONAL_PATHWAY_RULE,
  NO_UNIVERSAL_SHARIA_RULE,
  PROHIBITED_STATES_RULE,
  SHARIA_GOVERNANCE_VERSION,
  SHARIA_GOVERNANCE_SOURCE,
  SHARIA_GOVERNANCE_CURRENT_STATUS,
  SHARIA_COMPLIANCE_PROPERTY,
  SHARIA_GOVERNANCE_HONEST_STATE,
  getField,
} from "@/lib/sharia-aaoifi-governance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/sharia-governance
 *
 * P40 Sharia / AAOIFI Governance (Evidence-Gated).
 * Per PROMPT 40: Sharia compliance is an OPTIONAL market-specific pathway
 * (NOT a required product property). Current state: PENDING_EXTERNAL_VALIDATION
 * (no Sharia board appointed, no fatwa obtained, no AAOIFI certification).
 * The states SHARIA_CERTIFIED, SHARIA_APPROVED, AAOIFI_CERTIFIED are
 * PROHIBITED until supported by actual external evidence.
 * Does NOT claim universal Sharia compliance.
 *
 * Query params:
 *  - ?fieldId=FIELD_0_COMPLIANCE_PROPERTY|FIELD_1_APPLICABLE_JURISDICTION|FIELD_2_APPLICABLE_PRODUCT_ACTIVITY|FIELD_3_REQUIRED_INDEPENDENT_SHARIA_ADVISER_BOARD|FIELD_4_REQUIRED_METHODOLOGY|FIELD_5_REQUIRED_REVIEW|FIELD_6_REQUIRED_FATWA_OPINION_CERTIFICATION|FIELD_7_EVIDENCE_LIFECYCLE|FIELD_8_PUBLICATION_RULES|FIELD_9_EXPIRATION_REVIEW_CYCLE
 *  - ?view=codebase-scan (Sharia references in the codebase — documented honestly)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "sharia-governance",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const fieldId = url.searchParams.get("fieldId");
  const view = url.searchParams.get("view");

  // Single-field lookup
  if (fieldId) {
    const field = getField(fieldId);
    if (!field) {
      return NextResponse.json(
        { error: `Invalid fieldId: ${fieldId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: SHARIA_GOVERNANCE_SOURCE,
      },
      field,
    });
  }

  // Codebase scan view — Sharia references in the codebase
  if (view === "codebase-scan") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: SHARIA_GOVERNANCE_SOURCE,
        version: SHARIA_GOVERNANCE_VERSION,
        status: SHARIA_GOVERNANCE_CURRENT_STATUS,
        overrideRule:
          "P40 Sharia/AAOIFI Governance — codebase scan view. " +
          "All Sharia references in the codebase are HONEST and do NOT claim " +
          "certification. They disclose Sharia as 'DESIGNED_FOR_INDEPENDENT_" +
          "REVIEW, NOT CERTIFIED' or 'PENDING_EXTERNAL_VALIDATION'.",
        changeRequest: "CR-2026-016 (per Architecture Freeze v25.3.15)",
      },
      scanSummary: SHARIA_CODEBASE_SCAN_SUMMARY,
      references: SHARIA_CODEBASE_REFERENCES,
    });
  }

  // Default — full governance model
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: SHARIA_GOVERNANCE_SOURCE,
      version: SHARIA_GOVERNANCE_VERSION,
      status: SHARIA_GOVERNANCE_CURRENT_STATUS,
      overrideRule:
        "P40 Sharia/AAOIFI Governance (Evidence-Gated) — OPTIONAL market-" +
        "specific pathway (NOT a required product property). Current state: " +
        "PENDING_EXTERNAL_VALIDATION. SHARIA_CERTIFIED, SHARIA_APPROVED, " +
        "AAOIFI_CERTIFIED PROHIBITED until external evidence. Does NOT claim " +
        "universal Sharia compliance.",
      changeRequest: "CR-2026-016 (per Architecture Freeze v25.3.15)",
    },
    currentStatus: SHARIA_GOVERNANCE_CURRENT_STATUS,
    shariaComplianceProperty: SHARIA_COMPLIANCE_PROPERTY,
    disclosureBanner: SHARIA_DISCLOSURE_BANNER,
    governanceFields: SHARIA_GOVERNANCE_FIELDS,
    optionalPathwayRule: {
      ruleId: OPTIONAL_PATHWAY_RULE.ruleId,
      rule: OPTIONAL_PATHWAY_RULE.rule,
      description: OPTIONAL_PATHWAY_RULE.description,
      whatItForbids: OPTIONAL_PATHWAY_RULE.whatItForbids,
      whatItPermits: OPTIONAL_PATHWAY_RULE.whatItPermits,
      enforcement: OPTIONAL_PATHWAY_RULE.enforcement,
    },
    noUniversalShariaRule: {
      ruleId: NO_UNIVERSAL_SHARIA_RULE.ruleId,
      rule: NO_UNIVERSAL_SHARIA_RULE.rule,
      description: NO_UNIVERSAL_SHARIA_RULE.description,
      whatItForbids: NO_UNIVERSAL_SHARIA_RULE.whatItForbids,
      whatItPermits: NO_UNIVERSAL_SHARIA_RULE.whatItPermits,
      enforcement: NO_UNIVERSAL_SHARIA_RULE.enforcement,
    },
    prohibitedStatesRule: {
      ruleId: PROHIBITED_STATES_RULE.ruleId,
      rule: PROHIBITED_STATES_RULE.rule,
      description: PROHIBITED_STATES_RULE.description,
      prohibitedStates: PROHIBITED_STATES_RULE.prohibitedStates,
      requiredEvidenceToUnlock: PROHIBITED_STATES_RULE.requiredEvidenceToUnlock,
      enforcement: PROHIBITED_STATES_RULE.enforcement,
      currentState: PROHIBITED_STATES_RULE.currentState,
      shariaBoardAppointed: PROHIBITED_STATES_RULE.shariaBoardAppointed,
      fatwaObtained: PROHIBITED_STATES_RULE.fatwaObtained,
      aaoifiCertificationObtained:
        PROHIBITED_STATES_RULE.aaoifiCertificationObtained,
      independentShariaAdviserRetained:
        PROHIBITED_STATES_RULE.independentShariaAdviserRetained,
    },
    codebaseScan: {
      summary: SHARIA_CODEBASE_SCAN_SUMMARY,
      references: SHARIA_CODEBASE_REFERENCES,
    },
    honestState: SHARIA_GOVERNANCE_HONEST_STATE,
    rule: "Per PROMPT 40: 'Review every MITHQAL reference to: \"Sharia-compliant,\" \"Sharia-qualified,\" \"AAOIFI-aligned,\" \"Islamic finance,\" or equivalent language. Create an explicit evidence-gated Sharia governance model. Define: whether Sharia compliance is a required product property or only an optional market-specific pathway; applicable jurisdiction; applicable product/activity; required independent Sharia adviser/board; required methodology; required review; required fatwa/opinion/certification where applicable; evidence lifecycle; publication rules; expiration/review cycle. Until independent evidence exists, prohibit: SHARIA_CERTIFIED, SHARIA_APPROVED, AAOIFI_CERTIFIED unless supported by actual external evidence. Do not claim universal Sharia compliance.'",
  });
}
