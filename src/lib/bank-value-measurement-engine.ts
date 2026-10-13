/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — Institutional Bank Value Measurement Engine
 * ════════════════════════════════════════════════════════════════════════
 *
 * PURPOSE:
 *   Measure baseline (without MITHQAL) versus MITHQAL-assisted settlement
 *   across 12 metrics, separated into 6 cost categories.
 *   Produce a CFO-ready output for a prospective bank.
 *
 * HONEST-STATE DISCIPLINE (non-negotiable):
 *   - DO NOT INVENT SAVINGS.
 *   - Where baseline data is unavailable, return INSUFFICIENT_DATA.
 *   - Every metric requires: source + formula + time period + owner +
 *     evidence status.
 *   - MITHQAL-assisted values are SIMULATED (design-time estimates) —
 *     NOT validated savings.
 *   - No simulated data is used to claim live institutional integration.
 *
 * EVIDENCE STATUS (per directive):
 *   - SIMULATED: design-time simulation with no live data
 *   - ILLUSTRATIVE: computed from illustrative example inputs
 *   - VALIDATED: externally validated by an independent party
 *   - INSTITUTIONALLY_VERIFIED: verified by an executed contract
 *   - INSUFFICIENT_DATA: baseline data unavailable — cannot compute
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type EvidenceStatus =
  | "SIMULATED"
  | "ILLUSTRATIVE"
  | "VALIDATED"
  | "INSTITUTIONALLY_VERIFIED"
  | "INSUFFICIENT_DATA";

export type CostCategory =
  | "BANK_BENEFIT"
  | "MITHQAL_COST"
  | "INTEGRATION_COST"
  | "CHANGE_COST"
  | "RISK_CAPITAL_COST"
  | "NET_INSTITUTIONAL_VALUE";

export type MetricId =
  | "TOTAL_SETTLEMENT_COST"
  | "FX_COST"
  | "LIQUIDITY_UTILIZATION"
  | "TRAPPED_LIQUIDITY"
  | "PROCESSING_TIME"
  | "RECONCILIATION_EFFORT"
  | "EXCEPTION_RATE"
  | "COMPLIANCE_EVIDENCE_EFFORT"
  | "OPERATIONAL_HEADCOUNT_EFFORT"
  | "FAILURE_RECOVERY"
  | "AUDIT_PREPARATION"
  | "TOTAL_COST_OF_OWNERSHIP";

export interface MetricMeasurement {
  metricId: MetricId;
  metricLabel: string;
  costCategory: CostCategory;
  baseline: {
    value: number | "INSUFFICIENT_DATA";
    unit: string;
    source: string;
    formula: string;
    timePeriod: string;
    owner: string;
    evidenceStatus: EvidenceStatus;
  };
  mithqalAssisted: {
    value: number | "INSUFFICIENT_DATA";
    unit: string;
    source: string;
    formula: string;
    timePeriod: string;
    owner: string;
    evidenceStatus: EvidenceStatus;
  };
  delta: {
    value: number | "INSUFFICIENT_DATA";
    unit: string;
    formula: string;
    evidenceStatus: EvidenceStatus;
    interpretation: string;
  };
}

export interface CostCategorySummary {
  category: CostCategory;
  label: string;
  totalBaseline: number | "INSUFFICIENT_DATA";
  totalMithqalAssisted: number | "INSUFFICIENT_DATA";
  totalDelta: number | "INSUFFICIENT_DATA";
  metricCount: number;
  evidenceStatus: EvidenceStatus;
  interpretation: string;
}

export interface CFOOutput {
  documentTitle: string;
  preparedFor: string;
  preparedBy: string;
  date: string;
  releaseVersion: string;
  metrics: MetricMeasurement[];
  costCategories: CostCategorySummary[];
  netInstitutionalValue: {
    baseline: number | "INSUFFICIENT_DATA";
    mithqalAssisted: number | "INSUFFICIENT_DATA";
    delta: number | "INSUFFICIENT_DATA";
    formula: string;
    evidenceStatus: EvidenceStatus;
    interpretation: string;
  };
  honestState: {
    noInventedSavings: boolean;
    allBaselinesInsufficientData: boolean;
    mithqalAssistedSimulated: boolean;
    productionAuthorized: boolean;
    cfoReadyButNotValidated: boolean;
  };
  executiveSummary: string;
  criticalCaveat: string;
}

/* ------------------------------------------------------------------ */
/*  12 Metrics — Baseline vs MITHQAL-Assisted                         */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";
const TIME_PERIOD_ANNUAL = "annual (fiscal year)";
const TIME_PERIOD_PER_TXN = "per transaction";
const TIME_PERIOD_PROJECT = "project lifecycle (one-time)";
const TIME_PERIOD_QUARTERLY = "quarterly";

/**
 * ALL 12 metrics.
 *
 * HONEST STATE:
 *   - ALL baselines = INSUFFICIENT_DATA (no bank has provided baseline data)
 *   - ALL MITHQAL-assisted = SIMULATED (design-time estimates from canonical modules)
 *   - ALL deltas = INSUFFICIENT_DATA (cannot compute without baseline)
 *   - NO savings are invented
 *
 * When a prospective bank provides real baseline data, the engine
 * recomputes the deltas. Until then, everything is INSUFFICIENT_DATA.
 */
export const METRICS: MetricMeasurement[] = [
  // ── 1. TOTAL SETTLEMENT COST ──────────────────────────────────────────
  {
    metricId: "TOTAL_SETTLEMENT_COST",
    metricLabel: "Total Settlement Cost",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "USD/year",
      source: "REQUIRES: bank-provided baseline (current correspondent banking + FX + settlement costs)",
      formula: "sum(correspondent_banking_fees + FX_spreads + intermediary_bank_fees + SWIFT/message_costs + reconciliation_costs)",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "CFO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "USD/year",
      source: "SIMULATED: institutional-pricing-architecture.ts (49 prices ALL PENDING — no commercial pricing set)",
      formula: "sum(mithqal_settlement_fee + mithqal_FX_fee + mithqal_compliance_fee) — prices are PENDING (design-time)",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "USD/year",
      formula: "baseline_total - mithqal_assisted_total",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute savings — baseline data unavailable AND MITHQAL pricing is PENDING. Any savings figure would be INVENTED.",
    },
  },
  // ── 2. FX COST ────────────────────────────────────────────────────────
  {
    metricId: "FX_COST",
    metricLabel: "FX Cost (spread + fees)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "bps + USD/year",
      source: "REQUIRES: bank-provided baseline (current FX spread + intermediary conversion costs)",
      formula: "sum(FX_spread_bps * volume + conversion_fees) per corridor",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "CFO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "bps + USD/year",
      source: "SIMULATED: corridor-pain-index.ts (12-factor index, SIMULATED rates). FX route selection is SIMULATED (Pilot A).",
      formula: "sum(mithqal_FX_fee_per_corridor * volume_per_corridor) — rates are SIMULATED",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "bps + USD/year",
      formula: "baseline_FX_cost - mithqal_FX_cost",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute FX savings — baseline FX data unavailable. The corridor-pain-index is SIMULATED (design-time).",
    },
  },
  // ── 3. LIQUIDITY UTILIZATION ──────────────────────────────────────────
  {
    metricId: "LIQUIDITY_UTILIZATION",
    metricLabel: "Liquidity Utilization (efficiency ratio)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "% (utilized / available)",
      source: "REQUIRES: bank-provided baseline (nostro/vostro account balances + utilization rates)",
      formula: "sum(settled_amount) / sum(available_liquidity) across nostro/vostro accounts",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "Treasurer (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "% (utilized / available)",
      source: "SIMULATED: reserve-domains.ts (2 domains, SETTLEMENT_LIQUIDITY has no qualified custodian). Liquidity routing is SIMULATED (Pilot A).",
      formula: "sum(mithqal_settled_amount) / sum(mithqal_available_liquidity) — no live liquidity data",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "%",
      formula: "mithqal_utilization - baseline_utilization",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute liquidity efficiency improvement — baseline nostro/vostro data unavailable.",
    },
  },
  // ── 4. TRAPPED LIQUIDITY ─────────────────────────────────────────────
  {
    metricId: "TRAPPED_LIQUIDITY",
    metricLabel: "Trapped Liquidity (idle capital in nostro accounts)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "USD (average idle balance)",
      source: "REQUIRES: bank-provided baseline (nostro account idle balances + opportunity cost of capital)",
      formula: "sum(nostro_idle_balance) * cost_of_capital_rate",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "Treasurer (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "USD",
      source: "SIMULATED: reserve-coverage-logic.ts (coverageRatio computed but unbacked). No live liquidity data.",
      formula: "sum(mithqal_idle_balance) * cost_of_capital_rate — design-time estimate",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "USD",
      formula: "baseline_trapped - mithqal_trapped",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute trapped liquidity reduction — baseline nostro data unavailable.",
    },
  },
  // ── 5. PROCESSING TIME ───────────────────────────────────────────────
  {
    metricId: "PROCESSING_TIME",
    metricLabel: "Settlement Processing Time (instruction → finality)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "hours (median, P50 + P95)",
      source: "REQUIRES: bank-provided baseline (current SWIFT/correspondent processing time per corridor)",
      formula: "median(time(instruction_received) - time(finality_achieved)) per corridor",
      timePeriod: TIME_PERIOD_PER_TXN,
      owner: "COO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "hours",
      source: "SIMULATED: settlement-workflow-canonical.ts (BM-01..BM-16B, 17 steps). Pilot A execution: SIMULATED (no live timing).",
      formula: "sum(BM-01..BM-16B step durations) — SIMULATED durations",
      timePeriod: TIME_PERIOD_PER_TXN,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "hours",
      formula: "baseline_processing_time - mithqal_processing_time",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute time savings — baseline processing time unavailable. Pilot A timings are SIMULATED.",
    },
  },
  // ── 6. RECONCILIATION EFFORT ──────────────────────────────────────────
  {
    metricId: "RECONCILIATION_EFFORT",
    metricLabel: "Reconciliation Effort (FTE + cost)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      source: "REQUIRES: bank-provided baseline (reconciliation team headcount + operational cost)",
      formula: "reconciliation_FTE * loaded_labor_cost + system_costs",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      source: "SIMULATED: reconciliation-tolerance-policies.ts (6 policies, 1/5/10/50/20/200 bps). Evidence fabric automates reconciliation.",
      formula: "mithqal_reconciliation_FTE * loaded_labor_cost + system_costs — design-time estimate",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      formula: "baseline_reconciliation_effort - mithqal_reconciliation_effort",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute reconciliation savings — baseline FTE + cost unavailable.",
    },
  },
  // ── 7. EXCEPTION RATE ─────────────────────────────────────────────────
  {
    metricId: "EXCEPTION_RATE",
    metricLabel: "Exception Rate (failed/investigated transactions)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "% (exceptions / total transactions)",
      source: "REQUIRES: bank-provided baseline (current exception/investigation rate per corridor)",
      formula: "count(exceptions) / count(total_transactions)",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "COO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "%",
      source: "SIMULATED: dispute-exception-framework.ts (7 types, 9-stage lifecycle). Pilot A: 0 exceptions (SIMULATED — no live data).",
      formula: "count(mithqal_exceptions) / count(mithqal_transactions) — SIMULATED",
      timePeriod: TIME_PERIOD_QUARTERLY,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "%",
      formula: "baseline_exception_rate - mithqal_exception_rate",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute exception reduction — baseline exception rate unavailable.",
    },
  },
  // ── 8. COMPLIANCE/EVIDENCE EFFORT ────────────────────────────────────
  {
    metricId: "COMPLIANCE_EVIDENCE_EFFORT",
    metricLabel: "Compliance & Evidence Effort (FTE + cost)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      source: "REQUIRES: bank-provided baseline (compliance team headcount + evidence preparation cost)",
      formula: "compliance_FTE * loaded_labor_cost + evidence_prep_cost",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "CCO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      source: "SIMULATED: institutional-evidence-fabric.ts (15-field package, 3 access levels, SHA-256). technical-evidence-classification.ts (42 forbidden equivalences).",
      formula: "mithqal_compliance_FTE * loaded_labor_cost + system_costs — design-time estimate",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE + USD/year",
      formula: "baseline_compliance_effort - mithqal_compliance_effort",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute compliance savings — baseline compliance FTE + cost unavailable.",
    },
  },
  // ── 9. OPERATIONAL HEADCOUNT EFFORT ──────────────────────────────────
  {
    metricId: "OPERATIONAL_HEADCOUNT_EFFORT",
    metricLabel: "Operational Headcount Effort (FTE)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE",
      source: "REQUIRES: bank-provided baseline (operations team headcount for settlement/clearing/correspondent)",
      formula: "sum(settlement_FTE + clearing_FTE + correspondent_FTE + exception_handling_FTE)",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE",
      source: "SIMULATED: institutionalization-operating-plan.ts (MITHQAL side: 40.75 FTE required, 0 filled). Bank-side FTE reduction is SIMULATED.",
      formula: "sum(bank_settlement_FTE + bank_monitoring_FTE) — design-time estimate",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE",
      formula: "baseline_FTE - mithqal_assisted_FTE",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute FTE reduction — baseline operations headcount unavailable.",
    },
  },
  // ── 10. FAILURE RECOVERY ─────────────────────────────────────────────
  {
    metricId: "FAILURE_RECOVERY",
    metricLabel: "Failure Recovery (time + cost per incident)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "hours + USD/incident",
      source: "REQUIRES: bank-provided baseline (settlement failure recovery time + cost per incident)",
      formula: "mean_time_to_recovery * incidents_per_year + recovery_cost_per_incident",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "CTO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "hours + USD/incident",
      source: "SIMULATED: settlement-continuity-fabric.ts (9 events × 7-stage lifecycle). Pilot A: safe halt + recovery demonstrated (SIMULATED).",
      formula: "mithqal_MTTR * mithqal_incidents + recovery_cost — design-time estimate",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "hours + USD/incident",
      formula: "baseline_recovery_cost - mithqal_recovery_cost",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute recovery cost savings — baseline failure recovery data unavailable.",
    },
  },
  // ── 11. AUDIT PREPARATION ────────────────────────────────────────────
  {
    metricId: "AUDIT_PREPARATION",
    metricLabel: "Audit Preparation (effort + cost)",
    costCategory: "BANK_BENEFIT",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE-weeks + USD/year",
      source: "REQUIRES: bank-provided baseline (audit prep team effort + external auditor cost)",
      formula: "audit_prep_FTE_weeks * loaded_labor_cost + external_auditor_fees",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "CFO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE-weeks + USD/year",
      source: "SIMULATED: institutional-evidence-fabric.ts (15-field package, AUDIT access level). regulatory-replay-engine.ts (12-field, READ-ONLY).",
      formula: "mithqal_audit_prep_FTE_weeks * loaded_labor_cost + system_costs — design-time estimate",
      timePeriod: TIME_PERIOD_ANNUAL,
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "FTE-weeks + USD/year",
      formula: "baseline_audit_prep - mithqal_audit_prep",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute audit prep savings — baseline audit effort unavailable.",
    },
  },
  // ── 12. TOTAL COST OF OWNERSHIP ──────────────────────────────────────
  {
    metricId: "TOTAL_COST_OF_OWNERSHIP",
    metricLabel: "Total Cost of Ownership (3-year)",
    costCategory: "NET_INSTITUTIONAL_VALUE",
    baseline: {
      value: "INSUFFICIENT_DATA",
      unit: "USD (3-year)",
      source: "REQUIRES: bank-provided baseline (all settlement-related costs over 3 years)",
      formula: "sum(settlement_cost + FX_cost + liquidity_cost + ops_cost + compliance_cost + audit_cost) * 3 years",
      timePeriod: "3-year horizon",
      owner: "CFO (bank side)",
      evidenceStatus: "INSUFFICIENT_DATA",
    },
    mithqalAssisted: {
      value: "INSUFFICIENT_DATA",
      unit: "USD (3-year)",
      source: "SIMULATED: aggregate of all MITHQAL-assisted metrics. All individual values are SIMULATED.",
      formula: "sum(mithqal_costs + integration_cost + change_cost + risk_capital_cost) * 3 years — ALL SIMULATED",
      timePeriod: "3-year horizon",
      owner: "COO (MITHQAL side)",
      evidenceStatus: "SIMULATED",
    },
    delta: {
      value: "INSUFFICIENT_DATA",
      unit: "USD (3-year)",
      formula: "baseline_TCO - mithqal_TCO",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation: "CANNOT compute TCO savings — ALL baseline components are INSUFFICIENT_DATA. The 3-year TCO delta is INSUFFICIENT_DATA.",
    },
  },
];

/* ------------------------------------------------------------------ */
/*  6 Cost Category Summaries                                        */
/* ------------------------------------------------------------------ */

export const COST_CATEGORIES: CostCategorySummary[] = [
  {
    category: "BANK_BENEFIT",
    label: "Bank Benefit (savings from MITHQAL-assisted settlement)",
    totalBaseline: "INSUFFICIENT_DATA",
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: METRICS.filter(m => m.costCategory === "BANK_BENEFIT").length,
    evidenceStatus: "INSUFFICIENT_DATA",
    interpretation: "ALL bank benefit metrics are INSUFFICIENT_DATA — no bank has provided baseline data. Savings CANNOT be computed. Any savings figure would be INVENTED.",
  },
  {
    category: "MITHQAL_COST",
    label: "MITHQAL Cost (fees paid to MITHQAL)",
    totalBaseline: 0, // baseline = no MITHQAL cost (bank doesn't use MITHQAL)
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: 1,
    evidenceStatus: "SIMULATED",
    interpretation: "MITHQAL pricing is PENDING (institutional-pricing-architecture.ts: 49 prices ALL PENDING). No commercial pricing has been set. MITHQAL cost is SIMULATED.",
  },
  {
    category: "INTEGRATION_COST",
    label: "Integration Cost (one-time implementation)",
    totalBaseline: 0, // baseline = no integration cost
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: 1,
    evidenceStatus: "SIMULATED",
    interpretation: "Integration cost depends on bank's existing infrastructure. No bank has provided integration scope. Cost is SIMULATED (design-time).",
  },
  {
    category: "CHANGE_COST",
    label: "Change Cost (organizational change management)",
    totalBaseline: 0, // baseline = no change cost
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: 1,
    evidenceStatus: "SIMULATED",
    interpretation: "Change management cost depends on bank's organizational structure. No bank has provided change scope. Cost is SIMULATED.",
  },
  {
    category: "RISK_CAPITAL_COST",
    label: "Risk / Capital Cost (risk-adjusted capital allocation)",
    totalBaseline: "INSUFFICIENT_DATA",
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: 1,
    evidenceStatus: "INSUFFICIENT_DATA",
    interpretation: "Risk capital cost requires bank-specific Basel III/IV capital treatment data. No bank has provided this. INSUFFICIENT_DATA.",
  },
  {
    category: "NET_INSTITUTIONAL_VALUE",
    label: "Net Institutional Value (BANK_BENEFIT - all costs)",
    totalBaseline: "INSUFFICIENT_DATA",
    totalMithqalAssisted: "INSUFFICIENT_DATA",
    totalDelta: "INSUFFICIENT_DATA",
    metricCount: METRICS.filter(m => m.costCategory === "NET_INSTITUTIONAL_VALUE").length,
    evidenceStatus: "INSUFFICIENT_DATA",
    interpretation: "Net Institutional Value = BANK_BENEFIT - MITHQAL_COST - INTEGRATION_COST - CHANGE_COST - RISK_CAPITAL_COST. ALL components are INSUFFICIENT_DATA. Net value CANNOT be computed.",
  },
];

/* ------------------------------------------------------------------ */
/*  CFO-Ready Output                                                  */
/* ------------------------------------------------------------------ */

export function getCFOOutput(): CFOOutput {
  return {
    documentTitle: "MITHQAL Institutional Bank Value Measurement — CFO Output",
    preparedFor: "Prospective Bank (CFO / Treasurer / COO)",
    preparedBy: "MITHQAL COO + CTO (Design-Time, SIMULATED)",
    date: NOW,
    releaseVersion: "v25.3.2",
    metrics: METRICS,
    costCategories: COST_CATEGORIES,
    netInstitutionalValue: {
      baseline: "INSUFFICIENT_DATA",
      mithqalAssisted: "INSUFFICIENT_DATA",
      delta: "INSUFFICIENT_DATA",
      formula: "NET = BANK_BENEFIT - MITHQAL_COST - INTEGRATION_COST - CHANGE_COST - RISK_CAPITAL_COST",
      evidenceStatus: "INSUFFICIENT_DATA",
      interpretation:
        "Net Institutional Value CANNOT be computed. ALL baseline data is INSUFFICIENT_DATA (no bank has provided data). " +
        "ALL MITHQAL-assisted values are SIMULATED (design-time, not validated). " +
        "No savings are invented. The engine is READY to compute when a bank provides baseline data.",
    },
    honestState: {
      noInventedSavings: true,
      allBaselinesInsufficientData: METRICS.every(m => m.baseline.evidenceStatus === "INSUFFICIENT_DATA"),
      mithqalAssistedSimulated: METRICS.every(m => m.mithqalAssisted.evidenceStatus === "SIMULATED" || m.mithqalAssisted.evidenceStatus === "INSUFFICIENT_DATA"),
      productionAuthorized: false,
      cfoReadyButNotValidated: true,
    },
    executiveSummary:
      "This measurement engine compares baseline (without MITHQAL) versus MITHQAL-assisted settlement across 12 metrics in 6 cost categories. " +
      "HONEST RESULT: ALL 12 baselines are INSUFFICIENT_DATA (no bank has provided data). ALL 12 MITHQAL-assisted values are SIMULATED (design-time). " +
      "The Net Institutional Value CANNOT be computed. No savings are invented. " +
      "When a prospective bank provides baseline data, the engine will compute real deltas. " +
      "The MITHQAL architecture (control plane, settlement workflow, evidence fabric, reconciliation, compliance) is DESIGN-TIME READY. " +
      "The value measurement is READY TO POPULATE when a bank engages.",
    criticalCaveat:
      "DO NOT use any SIMULATED value as a savings claim. " +
      "DO NOT present the MITHQAL-assisted SIMULATED values as validated projections. " +
      "DO NOT compute a Net Institutional Value until baseline data is provided by a bank. " +
      "Any savings figure derived without baseline data would be INVENTED — a violation of honest-state discipline. " +
      "This output is CFO-READY (the framework + formulas are defined) but NOT CFO-VALIDATED (no bank has provided data). " +
      "NOT PRODUCTION-AUTHORIZED.",
  };
}

/* ------------------------------------------------------------------ */
/*  Module Metadata                                                   */
/* ------------------------------------------------------------------ */

export const VALUE_ENGINE_META = {
  module: "bank-value-measurement-engine",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  description:
    "Institutional Bank Value Measurement Engine — 12 metrics × 2 scenarios × 6 cost categories. " +
    "HONEST: all baselines INSUFFICIENT_DATA, all MITHQAL-assisted SIMULATED, no invented savings.",
  metricCount: METRICS.length,
  costCategoryCount: COST_CATEGORIES.length,
  allBaselinesInsufficient: true,
  noInventedSavings: true,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  This engine measures 12 metrics across 6 cost categories.
//  EVERY metric has: source + formula + time period + owner + evidence status.
//
//  HONEST RESULT:
//    - ALL 12 baselines = INSUFFICIENT_DATA (no bank has provided data)
//    - ALL 12 MITHQAL-assisted = SIMULATED (design-time)
//    - ALL 12 deltas = INSUFFICIENT_DATA (cannot compute)
//    - Net Institutional Value = INSUFFICIENT_DATA
//    - NO savings are invented
//
//  DO NOT:
//    - Use SIMULATED values as savings claims
//    - Present MITHQAL-assisted values as validated projections
//    - Compute Net Institutional Value without baseline data
//
//  This output is CFO-READY (framework defined) but NOT CFO-VALIDATED.
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
