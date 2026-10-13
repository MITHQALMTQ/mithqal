import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  TECHNICAL_EVIDENCE_CLASSES,
  HTTP_200_NOT_PROOF_RULE,
  EVIDENCE_CLASS_COUNT,
  NON_TECHNICAL_ONLY_CLASSES,
  NON_TECHNICAL_ONLY_CLASS_COUNT,
  TECHNICAL_SIGNAL_INPUT_CLASSES,
  TECHNICAL_SIGNAL_INPUT_CLASS_COUNT,
  TECHNICAL_EVIDENCE_CLASSIFICATION_STATUS,
  TECHNICAL_EVIDENCE_CLASSIFICATION_VERSION,
  TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE,
  TECHNICAL_EVIDENCE_HONEST_STATE,
  getEvidenceClass,
  getClassesByHonestyTier,
  getNonTechnicalOnlyClasses,
  type EvidenceClassId,
  type EvidenceHonestyTier,
} from "@/lib/technical-evidence-classification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/technical-evidence
 *
 * P42 Technical Evidence Classification Standard.
 * Per PROMPT 42: 10 evidence classes. Each class explicitly states
 * whatItProves + whatItDoesNotProve. HTTP 200, page rendering, API
 * response, unit test pass, integration test pass, and internal
 * verification are NOT proof of correctness / financial validity /
 * legal finality / security assurance / institutional validation /
 * regulatory authorization / production readiness.
 *
 * Query params:
 *  - ?classId=AVAILABILITY|FUNCTIONAL_CORRECTNESS|INTEGRATION_CORRECTNESS|PERFORMANCE|SECURITY_ASSURANCE|DATA_INTEGRITY|LEGAL_EVIDENCE|INSTITUTIONAL_VALIDATION|REGULATORY_EVIDENCE|PRODUCTION_AUTHORIZATION
 *  - ?honestyTier=DESIGN_TIME|MEASURED|INSTITUTIONAL
 *  - ?view=nonTechnicalOnly (5 classes NOT satisfiable by technical-only signals)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "technical-evidence",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const classId = url.searchParams.get("classId") as EvidenceClassId | null;
  const honestyTier = url.searchParams.get("honestyTier") as
    | EvidenceHonestyTier
    | null;
  const view = url.searchParams.get("view");

  // Single-class lookup by classId
  if (classId) {
    const cls = getEvidenceClass(classId);
    if (!cls) {
      return NextResponse.json(
        { error: `Invalid classId: ${classId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE,
      },
      class: cls,
    });
  }

  // Honesty tier filter
  if (honestyTier) {
    const validTiers: EvidenceHonestyTier[] = [
      "DESIGN_TIME",
      "MEASURED",
      "INSTITUTIONAL",
    ];
    if (!validTiers.includes(honestyTier)) {
      return NextResponse.json(
        { error: `Invalid honestyTier: ${honestyTier}` },
        { status: 400 },
      );
    }
    const classes = getClassesByHonestyTier(honestyTier);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE,
      },
      honestyTier,
      classCount: classes.length,
      classes,
    });
  }

  // Non-technical-only view — the 5 classes that are NOT satisfiable by
  // technical-only signals
  if (view === "nonTechnicalOnly") {
    const classes = getNonTechnicalOnlyClasses();
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE,
        version: TECHNICAL_EVIDENCE_CLASSIFICATION_VERSION,
        status: TECHNICAL_EVIDENCE_CLASSIFICATION_STATUS,
        overrideRule:
          "P42 Technical Evidence Classification Standard — non-technical-only view. " +
          "5 classes (SECURITY_ASSURANCE, LEGAL_EVIDENCE, INSTITUTIONAL_VALIDATION, " +
          "REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION) CANNOT be claimed by HTTP 200 / " +
          "page render / API response / unit test pass / integration test pass / internal " +
          "verification alone (per HTTP_200_NOT_PROOF_RULE).",
        changeRequest: "CR-2026-018 (per Architecture Freeze v25.3.15)",
      },
      classCount: classes.length,
      classes,
    });
  }

  // Default — full classification
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE,
      version: TECHNICAL_EVIDENCE_CLASSIFICATION_VERSION,
      status: TECHNICAL_EVIDENCE_CLASSIFICATION_STATUS,
      overrideRule:
        "P42 Technical Evidence Classification Standard — 10 classes. " +
        "HTTP 200, page rendering, API response, unit test pass, integration " +
        "test pass, and internal verification are NOT proof of correctness, " +
        "financial validity, legal finality, security assurance, institutional " +
        "validation, regulatory authorization, or production readiness.",
      changeRequest: "CR-2026-018 (per Architecture Freeze v25.3.15)",
    },
    classCount: EVIDENCE_CLASS_COUNT,
    nonTechnicalOnlyClassCount: NON_TECHNICAL_ONLY_CLASS_COUNT,
    technicalSignalInputClassCount: TECHNICAL_SIGNAL_INPUT_CLASS_COUNT,
    classes: TECHNICAL_EVIDENCE_CLASSES,
    nonTechnicalOnlyClasses: NON_TECHNICAL_ONLY_CLASSES,
    technicalSignalInputClasses: TECHNICAL_SIGNAL_INPUT_CLASSES,
    http200NotProofRule: {
      ruleId: HTTP_200_NOT_PROOF_RULE.ruleId,
      rule: HTTP_200_NOT_PROOF_RULE.rule,
      description: HTTP_200_NOT_PROOF_RULE.description,
      forbiddenEquivalences: HTTP_200_NOT_PROOF_RULE.forbiddenEquivalences,
      whatItForbids: HTTP_200_NOT_PROOF_RULE.whatItForbids,
      whatItPermits: HTTP_200_NOT_PROOF_RULE.whatItPermits,
      enforcement: HTTP_200_NOT_PROOF_RULE.enforcement,
    },
    honestState: TECHNICAL_EVIDENCE_HONEST_STATE,
    rule: "Per PROMPT 42: 'Create a canonical Technical Evidence Classification Standard. Do not allow: HTTP 200, page rendering, successful API response, unit test pass, integration test pass, or internal verification to be represented as proof of: correctness, financial validity, legal finality, security assurance, institutional validation, regulatory authorization, or production readiness. Separate evidence classes: AVAILABILITY, FUNCTIONAL_CORRECTNESS, INTEGRATION_CORRECTNESS, PERFORMANCE, SECURITY_ASSURANCE, DATA_INTEGRITY, LEGAL_EVIDENCE, INSTITUTIONAL_VALIDATION, REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION. Each metric must explicitly state what it proves and what it does NOT prove.'",
  });
}
