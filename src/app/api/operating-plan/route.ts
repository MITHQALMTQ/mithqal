import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  ROLE_CATEGORIES,
  DESIGN_TIME_FUNDING_RULE,
  SPEND_JUSTIFICATION_RULE,
  MONTHLY_PLAN,
  BUDGET_BY_CATEGORY,
  BUDGET_BY_MONTH,
  BURN_RATE_ANALYSIS,
  MINIMUM_CASH_ANALYSIS,
  RUNWAY_ANALYSIS,
  DOWNSIDE_RUNWAY_ANALYSIS,
  CAPITAL_REQUIREMENTS_BY_GATE,
  OPERATING_PLAN_STATUS,
  OPERATING_PLAN_VERSION,
  OPERATING_PLAN_SOURCE,
  ROLE_CATEGORY_COUNT,
  TOTAL_FTE_REQUIRED,
  TOTAL_CURRENT_FTE,
  TOTAL_MONTHLY_COST_AT_FULL_RAMP,
  TOTAL_FUNDING_GAP,
  MONTHLY_PLAN_LENGTH,
  CAPITAL_REQUIREMENT_COUNT,
  TOTAL_CAPITAL_REQUIREMENT_BY_GATE,
  TOTAL_ANNUAL_BUDGET,
  OPERATING_PLAN_HONEST_STATE,
  getCategory,
  getCapitalRequirementByGate,
  getMonthlyPlanEntry,
  type RoleCategoryId,
} from "@/lib/institutionalization-operating-plan";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/operating-plan
 *
 * P37 Institutionalization Operating Plan.
 * Per PROMPT 37: 11 role categories × 12-month resource plan + budget +
 * monthly burn + minimum cash + runway + downside runway + capital requirements by gate.
 * All figures are DESIGN-TIME per DESIGN_TIME_FUNDING_RULE
 * ($4.7M historical figure = DESIGN-TIME until independently revalidated).
 * Every discretionary spend links to next external gate / material risk
 * reduction / revenue protection / required evidence per SPEND_JUSTIFICATION_RULE.
 *
 * Query params:
 *  - ?categoryId=LEADERSHIP_ROLES|LEGAL_REGULATORY_EXPERTISE|ENGINEERING|SECURITY|TREASURY_LIQUIDITY|BANK_INTEGRATION|COMPLIANCE|FINANCE|OPERATIONS|INDEPENDENT_ASSURANCE|EXTERNAL_ADVISORS
 *  - ?month=1..12 (monthly plan entry)
 *  - ?gateId=GATE-A1-ROUTING|...|GATE-B7-RESOLUTION (capital-by-gate entry)
 *  - ?view=budget (budget-by-category + budget-by-month)
 *
 * Rate-limited at 30 req/min per IP (read-only endpoint).
 */
export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(
    "operating-plan",
    request,
    30,
    60_000,
  );
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId") as RoleCategoryId | null;
  const monthParam = url.searchParams.get("month");
  const gateId = url.searchParams.get("gateId");
  const view = url.searchParams.get("view");

  // Single-category lookup by categoryId
  if (categoryId) {
    const category = getCategory(categoryId);
    if (!category) {
      return NextResponse.json(
        { error: `Invalid categoryId: ${categoryId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: OPERATING_PLAN_SOURCE,
      },
      category,
    });
  }

  // Single-month plan entry lookup
  if (monthParam) {
    const month = parseInt(monthParam, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: `Invalid month: ${monthParam} (expected 1..12)` },
        { status: 400 },
      );
    }
    const entry = getMonthlyPlanEntry(month);
    if (!entry) {
      return NextResponse.json(
        { error: `Month ${month} not found` },
        { status: 404 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: OPERATING_PLAN_SOURCE,
      },
      entry,
    });
  }

  // Capital-by-gate lookup
  if (gateId) {
    const gate = getCapitalRequirementByGate(gateId);
    if (!gate) {
      return NextResponse.json(
        { error: `Invalid gateId: ${gateId}` },
        { status: 400 },
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: OPERATING_PLAN_SOURCE,
      },
      gate,
    });
  }

  // Budget view — compact budget summary
  if (view === "budget") {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.20",
        source: OPERATING_PLAN_SOURCE,
        version: OPERATING_PLAN_VERSION,
        status: OPERATING_PLAN_STATUS,
        overrideRule:
          "P37 Institutionalization Operating Plan — budget view. " +
          "11 role categories × 12-month plan. ALL FIGURES DESIGN-TIME per " +
          "DESIGN_TIME_FUNDING_RULE ($4.7M historical figure = DESIGN-TIME). " +
          "Every spend links to gate/risk/evidence per SPEND_JUSTIFICATION_RULE.",
        changeRequest: "CR-2026-013 (per Architecture Freeze v25.3.15)",
      },
      totalAnnualBudget: TOTAL_ANNUAL_BUDGET,
      budgetByCategory: BUDGET_BY_CATEGORY,
      budgetByMonth: BUDGET_BY_MONTH,
      burnRate: BURN_RATE_ANALYSIS,
      minimumCash: MINIMUM_CASH_ANALYSIS,
      runway: RUNWAY_ANALYSIS,
      downsideRunway: DOWNSIDE_RUNWAY_ANALYSIS,
      designTimeFundingRule: {
        ruleId: DESIGN_TIME_FUNDING_RULE.ruleId,
        rule: DESIGN_TIME_FUNDING_RULE.rule,
      },
      spendJustificationRule: {
        ruleId: SPEND_JUSTIFICATION_RULE.ruleId,
        rule: SPEND_JUSTIFICATION_RULE.rule,
      },
    });
  }

  // Default — full operating plan
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.20",
      source: OPERATING_PLAN_SOURCE,
      version: OPERATING_PLAN_VERSION,
      status: OPERATING_PLAN_STATUS,
      overrideRule:
        "P37 Institutionalization Operating Plan — 11 role categories × 12-month resource plan. " +
        "ALL FIGURES DESIGN-TIME per DESIGN_TIME_FUNDING_RULE " +
        "($4.7M historical figure = DESIGN-TIME until independently revalidated). " +
        "Every discretionary spend links to next external gate / material risk reduction / " +
        "revenue protection / required evidence per SPEND_JUSTIFICATION_RULE.",
      changeRequest: "CR-2026-013 (per Architecture Freeze v25.3.15)",
    },
    roleCategoryCount: ROLE_CATEGORY_COUNT,
    monthlyPlanLength: MONTHLY_PLAN_LENGTH,
    capitalRequirementCount: CAPITAL_REQUIREMENT_COUNT,
    totals: {
      totalFteRequired: TOTAL_FTE_REQUIRED,
      totalCurrentFte: TOTAL_CURRENT_FTE,
      totalMonthlyCostAtFullRamp: TOTAL_MONTHLY_COST_AT_FULL_RAMP,
      totalFundingGap: TOTAL_FUNDING_GAP,
      totalAnnualBudget: TOTAL_ANNUAL_BUDGET,
      totalCapitalRequirementByGate: TOTAL_CAPITAL_REQUIREMENT_BY_GATE,
    },
    roleCategories: ROLE_CATEGORIES,
    monthlyPlan: MONTHLY_PLAN,
    budgetByCategory: BUDGET_BY_CATEGORY,
    budgetByMonth: BUDGET_BY_MONTH,
    burnRate: BURN_RATE_ANALYSIS,
    minimumCash: MINIMUM_CASH_ANALYSIS,
    runway: RUNWAY_ANALYSIS,
    downsideRunway: DOWNSIDE_RUNWAY_ANALYSIS,
    capitalRequirementsByGate: CAPITAL_REQUIREMENTS_BY_GATE,
    designTimeFundingRule: {
      ruleId: DESIGN_TIME_FUNDING_RULE.ruleId,
      rule: DESIGN_TIME_FUNDING_RULE.rule,
      description: DESIGN_TIME_FUNDING_RULE.description,
      whatItForbids: DESIGN_TIME_FUNDING_RULE.whatItForbids,
      whatItPermits: DESIGN_TIME_FUNDING_RULE.whatItPermits,
      enforcement: DESIGN_TIME_FUNDING_RULE.enforcement,
      historicalFundingReference: DESIGN_TIME_FUNDING_RULE.historicalFundingReference,
    },
    spendJustificationRule: {
      ruleId: SPEND_JUSTIFICATION_RULE.ruleId,
      rule: SPEND_JUSTIFICATION_RULE.rule,
      description: SPEND_JUSTIFICATION_RULE.description,
      whatItForbids: SPEND_JUSTIFICATION_RULE.whatItForbids,
      whatItPermits: SPEND_JUSTIFICATION_RULE.whatItPermits,
      enforcement: SPEND_JUSTIFICATION_RULE.enforcement,
      fourJustifications: SPEND_JUSTIFICATION_RULE.fourJustifications,
    },
    honestState: OPERATING_PLAN_HONEST_STATE,
    rule: "Per PROMPT 37: 'Create an institutionalization operating plan covering: leadership roles, legal/regulatory expertise, engineering, security, treasury/liquidity, bank integration, compliance, finance, operations, independent assurance and external advisors. Create: 12-month resource plan, budget, monthly burn, minimum cash, runway, downside runway and capital requirements by gate. Treat any historical funding target such as the prior $4.7M figure as DESIGN-TIME until independently revalidated. Every discretionary spend must link to: next external gate, material risk reduction, revenue protection or required evidence.'",
  });
}
