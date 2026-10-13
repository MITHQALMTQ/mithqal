import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  COMPETITIVE_ANALYSES,
  NO_SUPERIORITY_RULE,
  NO_INCUMBENT_DEPENDENCY_RULE,
  COMPARISON_DIMENSIONS,
  COMPARISON_DIMENSION_COUNT,
  COMPETITIVE_FRAMEWORK_STATUS,
  COMPETITIVE_FRAMEWORK_VERSION,
  COMPETITIVE_FRAMEWORK_SOURCE,
  COMPETITOR_COUNT,
  COMPETITIVE_FRAMEWORK_HONEST_STATE,
  getCompetitor,
  getCompetitorsByRelationship,
  type CompetitorId,
  type MithqalRelationship,
} from "@/lib/competitive-compatibility-framework";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/competitive-compatibility
 *
 * P34 Competitive / Incumbent Compatibility Framework.
 * Per PROMPT 34: 7 competitors × 14 comparison dimensions.
 * Does NOT declare MITHQAL superior (NO_SUPERIORITY_RULE).
 * No incumbent dependency for viability (NO_INCUMBENT_DEPENDENCY_RULE —
 * all competitors carry mithqalDependencyOnThisCompetitor = false).
 *
 * Query params:
 *  - ?competitorId=SWIFT|CLS|RTGS_SYSTEMS|TOKENIZED_DEPOSITS|WHOLESALE_CBDC|BANK_LEDED_NETWORKS|COMPARABLE_INFRASTRUCTURE
 *  - ?relationship=COMPLEMENTS|DOES_NOT_REPLACE|PARTIALLY_OVERLAPS
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "competitive-compatibility",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const competitorId = url.searchParams.get("competitorId") as CompetitorId | null;
  const relationship = url.searchParams.get("relationship") as
    | MithqalRelationship
    | null;

  // Single-competitor lookup by competitorId
  if (competitorId) {
    const competitor = getCompetitor(competitorId);
    if (!competitor) {
      return NextResponse.json(
        { error: `Invalid competitorId: ${competitorId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: COMPETITIVE_FRAMEWORK_SOURCE,
      },
      competitor,
    });
  }

  // Relationship filter
  if (relationship) {
    const validRelationships: MithqalRelationship[] = [
      "COMPLEMENTS",
      "DOES_NOT_REPLACE",
      "PARTIALLY_OVERLAPS",
    ];
    if (!validRelationships.includes(relationship)) {
      return NextResponse.json(
        { error: `Invalid relationship: ${relationship}` },
        { status: 400 },
      );
    }
    const competitors = getCompetitorsByRelationship(relationship);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.19",
        source: COMPETITIVE_FRAMEWORK_SOURCE,
      },
      relationship,
      competitorCount: competitors.length,
      competitors,
    });
  }

  // Default — full competitive analysis
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.19",
      source: COMPETITIVE_FRAMEWORK_SOURCE,
      version: COMPETITIVE_FRAMEWORK_VERSION,
      status: COMPETITIVE_FRAMEWORK_STATUS,
      overrideRule:
        "Competitive / Incumbent Compatibility Framework — 7 competitors × 14 comparison dimensions. " +
        "Do NOT declare MITHQAL superior (NO_SUPERIORITY_RULE). " +
        "No incumbent dependency for viability (NO_INCUMBENT_DEPENDENCY_RULE — all 7 dependency flags = false).",
      changeRequest: "CR-2026-010 (per Architecture Freeze v25.3.15)",
    },
    competitorCount: COMPETITOR_COUNT,
    comparisonDimensionCount: COMPARISON_DIMENSION_COUNT,
    competitors: COMPETITIVE_ANALYSES,
    comparisonDimensions: COMPARISON_DIMENSIONS,
    noSuperiorityRule: {
      ruleId: NO_SUPERIORITY_RULE.ruleId,
      rule: NO_SUPERIORITY_RULE.rule,
      description: NO_SUPERIORITY_RULE.description,
      whatItForbids: NO_SUPERIORITY_RULE.whatItForbids,
      whatItPermits: NO_SUPERIORITY_RULE.whatItPermits,
      enforcement: NO_SUPERIORITY_RULE.enforcement,
    },
    noIncumbentDependencyRule: {
      ruleId: NO_INCUMBENT_DEPENDENCY_RULE.ruleId,
      rule: NO_INCUMBENT_DEPENDENCY_RULE.rule,
      description: NO_INCUMBENT_DEPENDENCY_RULE.description,
      whatItForbids: NO_INCUMBENT_DEPENDENCY_RULE.whatItForbids,
      whatItPermits: NO_INCUMBENT_DEPENDENCY_RULE.whatItPermits,
      enforcement: NO_INCUMBENT_DEPENDENCY_RULE.enforcement,
      allDependencyFlags: NO_INCUMBENT_DEPENDENCY_RULE.allDependencyFlags,
    },
    honestState: COMPETITIVE_FRAMEWORK_HONEST_STATE,
    rule: "Per PROMPT 34: 'Create a continuously maintainable competitive analysis against relevant institutional alternatives (SWIFT, CLS, RTGS, tokenized deposits, wholesale CBDC, bank-led networks, comparable infrastructure). 14 comparison dimensions. Do NOT declare MITHQAL superior. Define complement vs replace. No incumbent dependency for viability.'",
  });
}
