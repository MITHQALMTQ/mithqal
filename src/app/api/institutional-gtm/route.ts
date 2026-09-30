import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  PROGRESSION_STATES,
  PROGRESSION_STATE_COUNT,
  PROGRESSION_TRANSITIONS,
  PROGRESSION_TRANSITION_COUNT,
  TARGET_SELECTION_FACTORS,
  TARGET_SELECTION_FACTOR_COUNT,
  DEFINITION_AREAS,
  DEFINITION_AREA_COUNT,
  CANDIDATE_TARGET_REGISTRY,
  CANDIDATE_TARGET_COUNT,
  NO_HARD_CODED_WINNER_RULE,
  GTM_FRAMEWORK_STATUS,
  GTM_FRAMEWORK_VERSION,
  GTM_FRAMEWORK_SOURCE,
  GTM_FRAMEWORK_HONEST_STATE,
  GTM_PROGRESSION_STATE_COUNT,
  GTM_TARGET_SELECTION_FACTOR_COUNT,
  GTM_DEFINITION_AREA_COUNT,
  getProgressionState,
  getTargetSelectionFactor,
  getDefinitionArea,
  type GTMProgressionState,
  type TargetSelectionFactorId,
  type DefinitionAreaId,
} from "@/lib/institutional-gtm-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/institutional-gtm
 *
 * P36 Institutional GTM / Design-Partner Framework.
 * Per PROMPT 36: 9-state progression (RESEARCHED → ... → MEASURED).
 * 6-factor target selection (Corridor Pain Index + regulatory feasibility +
 * technical feasibility + executive sponsorship + integration capacity +
 * evidence/reference value). 9 definition areas.
 * No hard-coded bank/regulator/corridor as the winner
 * (per NO_HARD_CODED_WINNER_RULE). All candidate targets start RESEARCHED.
 *
 * Query params:
 *  - ?state=RESEARCHED|CONTACTED|QUALIFIED|ARCHITECTURE_REVIEW|LEGAL_REVIEW|PILOT_CANDIDATE|CONTRACTED|PILOT|MEASURED
 *  - ?factorId=CORRIDOR_PAIN_INDEX|REGULATORY_FEASIBILITY|TECHNICAL_FEASIBILITY|EXECUTIVE_SPONSORSHIP|INTEGRATION_CAPACITY|EVIDENCE_REFERENCE_VALUE
 *  - ?areaId=TARGET_ACCOUNT_PROFILE|DECISION_MAKER_MAP|ENGAGEMENT_SEQUENCE|PILOT_OFFER|BANK_VALUE_PROPOSITION|REGULATORY_ENGAGEMENT_PATH|DESIGN_PARTNER_CRITERIA|REQUIRED_EVIDENCE|PROGRESSION_STATES
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "institutional-gtm",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const stateParam = url.searchParams.get("state") as GTMProgressionState | null;
  const factorId = url.searchParams.get("factorId") as
    | TargetSelectionFactorId
    | null;
  const areaId = url.searchParams.get("areaId") as DefinitionAreaId | null;

  // Single-state lookup
  if (stateParam) {
    const validStates: GTMProgressionState[] = [
      "RESEARCHED",
      "CONTACTED",
      "QUALIFIED",
      "ARCHITECTURE_REVIEW",
      "LEGAL_REVIEW",
      "PILOT_CANDIDATE",
      "CONTRACTED",
      "PILOT",
      "MEASURED",
    ];
    if (!validStates.includes(stateParam)) {
      return NextResponse.json(
        { error: `Invalid state: ${stateParam}` },
        { status: 400 },
      );
    }
    const state = getProgressionState(stateParam);
    const incomingTransitions = PROGRESSION_TRANSITIONS.filter(
      (t) => t.toState === stateParam,
    );
    const outgoingTransitions = PROGRESSION_TRANSITIONS.filter(
      (t) => t.fromState === stateParam,
    );
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: GTM_FRAMEWORK_SOURCE,
      },
      state,
      incomingTransitions,
      outgoingTransitions,
    });
  }

  // Single-factor lookup
  if (factorId) {
    const factor = getTargetSelectionFactor(factorId);
    if (!factor) {
      return NextResponse.json(
        { error: `Invalid factorId: ${factorId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: GTM_FRAMEWORK_SOURCE,
      },
      factor,
    });
  }

  // Single-area lookup
  if (areaId) {
    const area = getDefinitionArea(areaId);
    if (!area) {
      return NextResponse.json(
        { error: `Invalid areaId: ${areaId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: GTM_FRAMEWORK_SOURCE,
      },
      area,
    });
  }

  // Default — full GTM framework
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.20",
      source: GTM_FRAMEWORK_SOURCE,
      version: GTM_FRAMEWORK_VERSION,
      status: GTM_FRAMEWORK_STATUS,
      overrideRule:
        "Institutional GTM / Design-Partner Framework — 9-state progression " +
        "(RESEARCHED → CONTACTED → QUALIFIED → ARCHITECTURE_REVIEW → LEGAL_REVIEW → " +
        "PILOT_CANDIDATE → CONTRACTED → PILOT → MEASURED). 6-factor target selection. " +
        "9 definition areas. Do not hard-code a specific bank, regulator or corridor " +
        "as the winner (per NO_HARD_CODED_WINNER_RULE). All candidate targets start " +
        "RESEARCHED — no bank has been contacted.",
      changeRequest: "CR-2026-012 (per Architecture Freeze v25.3.15)",
    },
    progressionStateCount: GTM_PROGRESSION_STATE_COUNT,
    targetSelectionFactorCount: GTM_TARGET_SELECTION_FACTOR_COUNT,
    definitionAreaCount: GTM_DEFINITION_AREA_COUNT,
    progressionStates: PROGRESSION_STATES,
    targetSelectionFactors: TARGET_SELECTION_FACTORS,
    definitionAreas: DEFINITION_AREAS,
    progressionTransitions: PROGRESSION_TRANSITIONS,
    progressionTransitionCount: PROGRESSION_TRANSITION_COUNT,
    candidateTargetCount: CANDIDATE_TARGET_COUNT,
    candidateTargets: CANDIDATE_TARGET_REGISTRY,
    noHardCodedWinnerRule: {
      ruleId: NO_HARD_CODED_WINNER_RULE.ruleId,
      rule: NO_HARD_CODED_WINNER_RULE.rule,
      description: NO_HARD_CODED_WINNER_RULE.description,
      whatItForbids: NO_HARD_CODED_WINNER_RULE.whatItForbids,
      whatItPermits: NO_HARD_CODED_WINNER_RULE.whatItPermits,
      enforcement: NO_HARD_CODED_WINNER_RULE.enforcement,
      selectionFactors: NO_HARD_CODED_WINNER_RULE.selectionFactors,
      honestState: NO_HARD_CODED_WINNER_RULE.honestState,
    },
    honestState: GTM_FRAMEWORK_HONEST_STATE,
    rule: "Per PROMPT 36: 'Create an evidence-gated institutional GTM framework. 6-factor target selection (Corridor Pain Index + regulatory feasibility + technical feasibility + executive sponsorship + integration capacity + evidence/reference value). 9 definition areas. 9-state progression. Do not hard-code a specific bank, regulator or corridor as the winner.'",
  });
}
