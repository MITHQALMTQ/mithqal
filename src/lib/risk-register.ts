// =============================================================================
// src/lib/risk-register.ts
// MITHQAL · MTQ Canonical Blueprint v1.0 — §14 "Risk register and stop/pivot rules"
// =============================================================================
// Task ID: IMPL-V1-BLUEPRINT
//
// Per v1.0 §14, the canonical stop/pivot rules are:
//   1. No buyer urgency
//   2. No data access
//   3. Alternatives are good enough
//   4. Legal perimeter disproportionate
//   5. MTQ adds no value
//   6. Complexity outpaces proof
//   7. Financing gap
//
// "Every milestone needs entry and acceptance criteria, evidence links,
//  owner, open risks, cost incurred, cost to next milestone and a signed
//  decision. Never pass a gate because of effort or sunk cost."
//
// HONEST STATE (per v1.0 §0 "DESIGN-STAGE ONLY"):
//   - productionAuthorized = false
//   - All risk entries below are SYNTHETIC Pilot A data
//   - Stop/pivot rules are MONITORING, not yet TRIGGERED
// =============================================================================

export type StopPivotStatus = "MONITORING" | "TRIGGERED" | "ACTIONED";

export interface StopPivotRule {
  ruleId: string;
  name: string;
  trigger: string;
  requiredAction: string;
  status: StopPivotStatus;
  evidence: string;
  owner: string;
  blueprint_ref: "v1.0 §14";
}

/**
 * Per §14, the 7 canonical stop/pivot rules. Each rule is initially in
 * MONITORING status because v1.0 is design-stage; the Pilot A evidence
 * required to TRIGGER any rule has not yet been gathered.
 */
export const STOP_PIVOT_RULES: StopPivotRule[] = [
  {
    ruleId: "SP-01",
    name: "No buyer urgency",
    trigger:
      "Interviews do not reveal a repeated budget-relevant workflow that this product addresses.",
    requiredAction: "Narrow to one exception class, change buyer, or stop the current wedge.",
    status: "MONITORING",
    evidence:
      "Pilot A interview program not yet executed (target 15–20 structured interviews per §3).",
    owner: "discovery-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-02",
    name: "No data access",
    trigger:
      "Authorized, anonymized, or representative data is unavailable to test economics.",
    requiredAction:
      "Use synthetic data for software validation but do not claim buyer ROI; seek another validation path.",
    status: "MONITORING",
    evidence:
      "All data used in Pilot A is synthetic; no authorized bank dataset is in hand.",
    owner: "discovery-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-03",
    name: "Alternatives are good enough",
    trigger:
      "A current provider or internal system solves the problem at lower total cost/risk.",
    requiredAction:
      "Integrate or partner if justified, reposition, or stop competing in that area.",
    status: "MONITORING",
    evidence:
      "No competitive benchmark completed; alternatives catalog is hypothetical.",
    owner: "product-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-04",
    name: "Legal perimeter disproportionate",
    trigger:
      "Activity requires licensing, capital, liability, or supervision inconsistent with the model.",
    requiredAction:
      "Narrow functionality, consider an appropriately authorized partner where lawful, or stop. A partner does not automatically remove all obligations.",
    status: "MONITORING",
    evidence: "No external legal review of the Pilot A perimeter completed.",
    owner: "legal-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-05",
    name: "MTQ adds no value",
    trigger:
      "Recognized assets solve the problem, or MTQ's burden exceeds its incremental benefit.",
    requiredAction:
      "Keep MTQ disabled indefinitely. That is not failure of the control plane.",
    status: "MONITORING",
    evidence:
      "MTQ is DISABLED by default per §0; no MTQ evaluation case has been built for Pilot A.",
    owner: "governance-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-06",
    name: "Complexity outpaces proof",
    trigger:
      "Components are added without demonstrated need or coherent state cannot be tested.",
    requiredAction: "Simplify and prioritize reproducibility.",
    status: "MONITORING",
    evidence:
      "Pilot A scope is restricted to evidence/exception workflow; no speculative components.",
    owner: "engineering-lead",
    blueprint_ref: "v1.0 §14",
  },
  {
    ruleId: "SP-07",
    name: "Financing gap",
    trigger: "Runway cannot reach the next evidence milestone within budget.",
    requiredAction:
      "Reduce scope, stop new features, preserve artifacts, and decide continue/pivot/stop.",
    status: "MONITORING",
    evidence:
      "No financing committed; design-stage only per v1.0 §0.",
    owner: "ceo",
    blueprint_ref: "v1.0 §14",
  },
];

// -----------------------------------------------------------------------------
// Risk register entries
// -----------------------------------------------------------------------------

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskStatus = "OPEN" | "MITIGATING" | "ACCEPTED" | "CLOSED";

export interface RiskEntry {
  riskId: string;
  category: string;
  scenario: string;
  inherentRisk: RiskLevel;
  residualRisk: RiskLevel;
  controls: string[];
  owner: string;
  mitigation: string;
  dueDate: string;
  status: RiskStatus;
  blueprint_ref: "v1.0 §14";
  provenance: "synthetic";
}

/**
 * 10 risk entries spanning the categories relevant to v1.0 design stage.
 * All entries are SYNTHETIC Pilot A data.
 */
export const RISK_ENTRIES: RiskEntry[] = [
  {
    riskId: "RISK-001",
    category: "Market",
    scenario: "No buyer urgency discovered in 15–20 interviews (§3).",
    inherentRisk: "HIGH",
    residualRisk: "MEDIUM",
    controls: ["structured interview program", "stop/pivot rule SP-01"],
    owner: "discovery-lead",
    mitigation: "Narrow wedge or stop before scaling.",
    dueDate: "2026-12-31",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-002",
    category: "Data",
    scenario: "Authorized bank data unavailable; only synthetic data exists.",
    inherentRisk: "HIGH",
    residualRisk: "MEDIUM",
    controls: ["synthetic-data harness", "stop/pivot rule SP-02", "no-ROI-claim policy"],
    owner: "discovery-lead",
    mitigation: "Pursue anonymized or representative dataset; do not claim buyer ROI.",
    dueDate: "2027-01-31",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-003",
    category: "Competitive",
    scenario: "Existing provider solves the problem at lower cost/risk.",
    inherentRisk: "MEDIUM",
    residualRisk: "MEDIUM",
    controls: ["competitive evidence register", "stop/pivot rule SP-03"],
    owner: "product-lead",
    mitigation: "Integrate or partner rather than duplicate.",
    dueDate: "2027-02-28",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-004",
    category: "Legal/Regulatory",
    scenario: "Pilot A perimeter triggers licensing or capital requirements.",
    inherentRisk: "CRITICAL",
    residualRisk: "HIGH",
    controls: ["legal review", "stop/pivot rule SP-04"],
    owner: "legal-lead",
    mitigation: "Narrow functionality or partner with an authorized entity.",
    dueDate: "2027-03-31",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-005",
    category: "MTQ",
    scenario: "Recognized assets solve the problem; MTQ adds burden not value.",
    inherentRisk: "MEDIUM",
    residualRisk: "LOW",
    controls: ["MTQ DISABLED by default", "stop/pivot rule SP-05"],
    owner: "governance-lead",
    mitigation: "Keep MTQ disabled indefinitely if true.",
    dueDate: "2027-04-30",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-006",
    category: "Engineering",
    scenario: "Components added without demonstrated need (complexity creep).",
    inherentRisk: "MEDIUM",
    residualRisk: "LOW",
    controls: ["scope policy", "stop/pivot rule SP-06"],
    owner: "engineering-lead",
    mitigation: "Simplify; require demonstrated need before adding components.",
    dueDate: "2027-05-31",
    status: "MITIGATING",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-007",
    category: "Financial",
    scenario: "Runway cannot reach next evidence milestone within budget.",
    inherentRisk: "HIGH",
    residualRisk: "MEDIUM",
    controls: ["milestone budgeting", "stop/pivot rule SP-07"],
    owner: "ceo",
    mitigation: "Reduce scope; preserve artifacts; decide continue/pivot/stop.",
    dueDate: "2027-06-30",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-008",
    category: "Reconciliation",
    scenario: "Tolerance breach between canonical and bank subledger unresolved.",
    inherentRisk: "HIGH",
    residualRisk: "MEDIUM",
    controls: ["reconciliation-tolerance policy", "exception network"],
    owner: "ops-reconciliation",
    mitigation: "Open exception case; escalate per §5C workflow.",
    dueDate: "2027-07-31",
    status: "MITIGATING",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-009",
    category: "Security",
    scenario: "Sensitive data exposed in evidence passport despite minimization.",
    inherentRisk: "CRITICAL",
    residualRisk: "MEDIUM",
    controls: ["evidence minimization", "provenance labels", "access control"],
    owner: "security-lead",
    mitigation: "Enforce HASH_ONLY / MINIMIZED retention on all PII fields.",
    dueDate: "2027-08-31",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
  {
    riskId: "RISK-010",
    category: "Operational",
    scenario: "Provider outage during Pilot A scenario causes duplicate events.",
    inherentRisk: "MEDIUM",
    residualRisk: "LOW",
    controls: ["failover policy", "duplicate-event detection"],
    owner: "ops-reconciliation",
    mitigation: "Synthetic twin exercises failover; duplicate detector suppresses.",
    dueDate: "2027-09-30",
    status: "OPEN",
    blueprint_ref: "v1.0 §14",
    provenance: "synthetic",
  },
];

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/**
 * Per §14, returns the status of all 7 stop/pivot rules. v1.0 is design
 * stage so all rules are MONITORING (none yet TRIGGERED or ACTIONED).
 */
export function checkStopPivotRules(): {
  rules: StopPivotRule[];
  summary: {
    total: number;
    monitoring: number;
    triggered: number;
    actioned: number;
    gateDiscipline: string;
    blueprint_ref: "v1.0 §14";
    honestState: "DESIGN-STAGE";
  };
} {
  const monitoring = STOP_PIVOT_RULES.filter((r) => r.status === "MONITORING").length;
  const triggered = STOP_PIVOT_RULES.filter((r) => r.status === "TRIGGERED").length;
  const actioned = STOP_PIVOT_RULES.filter((r) => r.status === "ACTIONED").length;
  return {
    rules: STOP_PIVOT_RULES,
    summary: {
      total: STOP_PIVOT_RULES.length,
      monitoring,
      triggered,
      actioned,
      gateDiscipline:
        "Every milestone needs entry and acceptance criteria, evidence links, owner, open risks, " +
        "cost incurred, cost to next milestone and a signed decision. Never pass a gate because " +
        "of effort or sunk cost (v1.0 §14).",
      blueprint_ref: "v1.0 §14",
      honestState: "DESIGN-STAGE",
    },
  };
}

/**
 * Return the full risk register (10 entries) for Pilot A demonstrator.
 */
export function getRiskEntries(): RiskEntry[] {
  return RISK_ENTRIES;
}
