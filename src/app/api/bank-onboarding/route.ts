import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  TRAINING_MODULES,
  CURRICULUM_TOPICS,
  CERTIFICATION_LEVELS,
  NOT_CONSUMER_RETAIL_RULE,
  HONEST_DRAFT_STATE_RULE,
  BANK_BOUNDARY_RULE,
  BANK_ONBOARDING_TRAINING_VERSION,
  BANK_ONBOARDING_TRAINING_SOURCE,
  BANK_ONBOARDING_TRAINING_STATUS,
  MODULE_COUNT,
  CURRICULUM_TOPIC_COUNT,
  CERTIFICATION_LEVEL_COUNT,
  TOTAL_HOURS,
  TOTAL_COHORTS_TRAINED,
  TOTAL_CERTIFIED_OPERATORS,
  BANK_ONBOARDING_TRAINING_HONEST_STATE,
  getModule,
  getModulesByTopic,
  getModulesByAudience,
  getCertificationLevel,
  type TrainingModuleId,
  type CurriculumTopic,
  type TargetAudience,
  type CertificationLevel,
} from "@/lib/bank-onboarding-training-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/bank-onboarding
 *
 * P38 Bank Onboarding + Institutional Training Framework.
 * Per PROMPT 38: 11 training modules (ALL DRAFT — no training delivered).
 * NOT a consumer/retail product (institutional training only).
 * Training teaches: what MITHQAL is, what it is not, the bank boundary,
 * MTQ optionality, finality, reconciliation, evidence, failure handling
 * and responsibilities.
 *
 * Query params:
 *  - ?moduleId=EXECUTIVE_BRIEFING|LEGAL_BRIEFING|COMPLIANCE_BRIEFING|RISK_BRIEFING|TREASURY_BRIEFING|TECHNICAL_INTEGRATION_GUIDE|OPERATOR_RUNBOOK|INCIDENT_GUIDE|RECONCILIATION_GUIDE|EVIDENCE_GUIDE|CERTIFICATION_TRAINING_PATHWAY
 *  - ?topic=WHAT_MITHQAL_IS|WHAT_MITHQAL_IS_NOT|BANK_BOUNDARY|MTQ_OPTIONALITY|FINALITY|RECONCILIATION|EVIDENCE|FAILURE_HANDLING|RESPONSIBILITIES
 *  - ?audience=BANK_EXECUTIVES|BANK_LEGAL_COUNSEL|BANK_COMPLIANCE_OFFICERS|BANK_RISK_OFFICERS|BANK_TREASURY|BANK_TECHNICAL_INTEGRATION|BANK_OPERATIONS|BANK_INCIDENT_RESPONSE|BANK_AUDIT_INTERNAL|BANK_EXTERNAL_AUDITORS|ALL_BANK_AUDIENCES
 *  - ?certificationLevelId=LEVEL_1_AWARE|LEVEL_2_OPERATOR|LEVEL_3_INCIDENT|LEVEL_4_INTEGRATION
 *  - ?view=summary (compact summary view)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "bank-onboarding",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const moduleId = url.searchParams.get("moduleId") as TrainingModuleId | null;
  const topic = url.searchParams.get("topic") as CurriculumTopic | null;
  const audience = url.searchParams.get("audience") as TargetAudience | null;
  const certificationLevelId = url.searchParams.get(
    "certificationLevelId",
  ) as CertificationLevel | null;
  const view = url.searchParams.get("view");

  // Single-module lookup by moduleId
  if (moduleId) {
    const trainingModule = getModule(moduleId);
    if (!trainingModule) {
      return NextResponse.json(
        { error: `Invalid moduleId: ${moduleId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ONBOARDING_TRAINING_SOURCE,
      },
      module: trainingModule,
    });
  }

  // Topic lookup — modules covering a curriculum topic
  if (topic) {
    const modules = getModulesByTopic(topic);
    if (modules.length === 0) {
      return NextResponse.json(
        { error: `Invalid topic: ${topic}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ONBOARDING_TRAINING_SOURCE,
      },
      topic,
      moduleCount: modules.length,
      modules,
    });
  }

  // Audience lookup — modules for a target audience
  if (audience) {
    const modules = getModulesByAudience(audience);
    if (modules.length === 0) {
      return NextResponse.json(
        { error: `Invalid audience: ${audience}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ONBOARDING_TRAINING_SOURCE,
      },
      audience,
      moduleCount: modules.length,
      modules,
    });
  }

  // Certification level lookup
  if (certificationLevelId) {
    const level = getCertificationLevel(certificationLevelId);
    if (!level) {
      return NextResponse.json(
        { error: `Invalid certificationLevelId: ${certificationLevelId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ONBOARDING_TRAINING_SOURCE,
      },
      level,
    });
  }

  // Summary view — compact summary
  if (view === "summary") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.21",
        source: BANK_ONBOARDING_TRAINING_SOURCE,
        version: BANK_ONBOARDING_TRAINING_VERSION,
        status: BANK_ONBOARDING_TRAINING_STATUS,
        overrideRule:
          "P38 Bank Onboarding + Institutional Training Framework — summary view. " +
          "11 modules ALL DRAFT. NOT a consumer/retail product. " +
          "All 9 curriculum topics covered.",
        changeRequest: "CR-2026-014 (per Architecture Freeze v25.3.15)",
      },
      moduleCount: MODULE_COUNT,
      curriculumTopicCount: CURRICULUM_TOPIC_COUNT,
      certificationLevelCount: CERTIFICATION_LEVEL_COUNT,
      totalHours: TOTAL_HOURS,
      totalCohortsTrained: TOTAL_COHORTS_TRAINED,
      totalCertifiedOperators: TOTAL_CERTIFIED_OPERATORS,
      moduleSummary: TRAINING_MODULES.map((m) => ({
        moduleId: m.moduleId,
        name: m.name,
        status: m.status,
        cohortCount: m.cohortCount,
        certifiedOperatorCount: m.certifiedOperatorCount,
        durationHours: m.durationHours,
      })),
      certificationLevels: CERTIFICATION_LEVELS.map((l) => ({
        levelId: l.levelId,
        name: l.name,
        cumulativeHours: l.cumulativeHours,
        certifiedOperatorsCurrent: l.certifiedOperatorsCurrent,
      })),
      notConsumerRetailRule: {
        ruleId: NOT_CONSUMER_RETAIL_RULE.ruleId,
        rule: NOT_CONSUMER_RETAIL_RULE.rule,
      },
      honestDraftStateRule: {
        ruleId: HONEST_DRAFT_STATE_RULE.ruleId,
        rule: HONEST_DRAFT_STATE_RULE.rule,
      },
      bankBoundaryRule: {
        ruleId: BANK_BOUNDARY_RULE.ruleId,
        rule: BANK_BOUNDARY_RULE.rule,
      },
    });
  }

  // Default — full framework
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.21",
      source: BANK_ONBOARDING_TRAINING_SOURCE,
      version: BANK_ONBOARDING_TRAINING_VERSION,
      status: BANK_ONBOARDING_TRAINING_STATUS,
      overrideRule:
        "P38 Bank Onboarding + Institutional Training Framework — 11 modules ALL DRAFT. " +
        "NOT a consumer/retail product. " +
        "Training teaches: what MITHQAL is, what it is not, the bank boundary, " +
        "MTQ optionality, finality, reconciliation, evidence, failure handling " +
        "and responsibilities.",
      changeRequest: "CR-2026-014 (per Architecture Freeze v25.3.15)",
    },
    moduleCount: MODULE_COUNT,
    curriculumTopicCount: CURRICULUM_TOPIC_COUNT,
    certificationLevelCount: CERTIFICATION_LEVEL_COUNT,
    totalHours: TOTAL_HOURS,
    totals: {
      totalCohortsTrained: TOTAL_COHORTS_TRAINED,
      totalCertifiedOperators: TOTAL_CERTIFIED_OPERATORS,
    },
    trainingModules: TRAINING_MODULES,
    curriculumTopics: CURRICULUM_TOPICS,
    certificationLevels: CERTIFICATION_LEVELS,
    notConsumerRetailRule: {
      ruleId: NOT_CONSUMER_RETAIL_RULE.ruleId,
      rule: NOT_CONSUMER_RETAIL_RULE.rule,
      description: NOT_CONSUMER_RETAIL_RULE.description,
      whatItForbids: NOT_CONSUMER_RETAIL_RULE.whatItForbids,
      whatItPermits: NOT_CONSUMER_RETAIL_RULE.whatItPermits,
      enforcement: NOT_CONSUMER_RETAIL_RULE.enforcement,
      scopeStatement: NOT_CONSUMER_RETAIL_RULE.scopeStatement,
    },
    honestDraftStateRule: {
      ruleId: HONEST_DRAFT_STATE_RULE.ruleId,
      rule: HONEST_DRAFT_STATE_RULE.rule,
      description: HONEST_DRAFT_STATE_RULE.description,
      whatItForbids: HONEST_DRAFT_STATE_RULE.whatItForbids,
      whatItPermits: HONEST_DRAFT_STATE_RULE.whatItPermits,
      enforcement: HONEST_DRAFT_STATE_RULE.enforcement,
      currentState: HONEST_DRAFT_STATE_RULE.currentState,
    },
    bankBoundaryRule: {
      ruleId: BANK_BOUNDARY_RULE.ruleId,
      rule: BANK_BOUNDARY_RULE.rule,
      description: BANK_BOUNDARY_RULE.description,
      whatItForbids: BANK_BOUNDARY_RULE.whatItForbids,
      whatItPermits: BANK_BOUNDARY_RULE.whatItPermits,
      enforcement: BANK_BOUNDARY_RULE.enforcement,
    },
    honestState: BANK_ONBOARDING_TRAINING_HONEST_STATE,
    rule: "Per PROMPT 38: 'Create a bank onboarding and institutional training framework without expanding the core architecture. Include: executive briefing, legal briefing, compliance briefing, risk briefing, treasury briefing, technical integration guide, operator runbook, incident guide, reconciliation guide, evidence guide and certification/training pathway. Training must teach: what MITHQAL is, what it is not, the bank boundary, MTQ optionality, finality, reconciliation, evidence, failure handling and responsibilities. Do not create a consumer/retail education product.'",
  });
}
