/**
 * Gate Definitions — Canonical v26.0 §9.1 G0–G11 + §9.2 20-control mapping
 */

export type GateId = "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "G6" | "G7" | "G8" | "G9" | "G10" | "G11";

export interface GateDefinition {
  gateId: GateId;
  name: string;
  minimumExitCondition: string;
  defaultIfNotMet: string;
  primaryControlMappings: string[];
}

export const G0_G11_GATE_DEFINITIONS: GateDefinition[] = [
  { gateId: "G0", name: "Corporate/Contractual Integrity", minimumExitCondition: "Primary documents verified; authority to contract; entity/ownership/control; roles; IP/data rights; instrument conflicts resolved or scoped with counsel-approved conditions.", defaultIfNotMet: "BLOCK; no bank-facing execution claims or real-value pilot.", primaryControlMappings: ["G04"] },
  { gateId: "G1", name: "Legal Classification/Jurisdiction", minimumExitCondition: "Qualified counsel opinion for exact activity, entities, asset, corridor and jurisdiction; finality/redemption/custody issues scoped.", defaultIfNotMet: "JURISDICTION_PENDING; affected flows/MTQ disabled.", primaryControlMappings: ["G01","G09","G14"] },
  { gateId: "G2", name: "Regulatory Permission/Licensing", minimumExitCondition: "Required permissions/licenses/exemptions/regulator approvals obtained and verified when needed.", defaultIfNotMet: "BLOCK; no regulated activity.", primaryControlMappings: ["G02","G10"] },
  { gateId: "G3", name: "Strategically Useful Design-Partner Bank", minimumExitCondition: "Qualified institution, confirmed problem, sponsor, feasibility and authorized evaluation path.", defaultIfNotMet: "Continue research; no adoption claim.", primaryControlMappings: ["G18"] },
  { gateId: "G4", name: "Executed Bank Contract/SLA", minimumExitCondition: "Approved counterparty, scope, liability, data/security terms, SLA, incident/audit, termination and dispute process.", defaultIfNotMet: "No pilot with bank data/value.", primaryControlMappings: ["G03","G04"] },
  { gateId: "G5", name: "Technical Integration/Bank Certification", minimumExitCondition: "Tested identity, limits, event flow, reconciliation, exceptions and recovery; bank acceptance evidence.", defaultIfNotMet: "Sandbox only; affected capability disabled.", primaryControlMappings: ["G05","G08","G09","G10","G11"] },
  { gateId: "G6", name: "Backing/Custody/Accounting Truth", minimumExitCondition: "For MTQ: verified obligor, legal control, custody, direct-matched eligibility, redemption, accounting/prudential/tax and independent evidence.", defaultIfNotMet: "MTQ remains disabled; not a prerequisite for MTQ-off Pilot A.", primaryControlMappings: ["G06","G07","G08","G14"] },
  { gateId: "G7", name: "Controlled Pilot", minimumExitCondition: "Approved scope/runbook, data permissions, owners, limits, test scenarios, stop conditions and monitoring.", defaultIfNotMet: "No pilot start.", primaryControlMappings: ["G13"] },
  { gateId: "G8", name: "Independent Assurance", minimumExitCondition: "Independent scoped assessment completed; critical findings remediated/retested.", defaultIfNotMet: "No production review.", primaryControlMappings: ["G09","G12","G15","G16","G19"] },
  { gateId: "G9", name: "Measured Outcome", minimumExitCondition: "Baseline and pilot metrics, cost/value, negative results, sample and limitations reviewed.", defaultIfNotMet: "No ROI/performance claims.", primaryControlMappings: ["G17","G18"] },
  { gateId: "G10", name: "Repeatability", minimumExitCondition: "Second deployment/problem/corridor demonstrates repeatability and incremental effort/economics.", defaultIfNotMet: "Treat as bespoke, not scalable.", primaryControlMappings: [] },
  { gateId: "G11", name: "Production Authorization Review", minimumExitCondition: "Applicable legal/regulatory/bank/security/technical/operational/commercial/governance conditions passed; explicit authorized approval.", defaultIfNotMet: "productionAuthorized=false.", primaryControlMappings: ["G19","G20"] },
];

export interface LegacyControlDefinition {
  controlId: string;
  name: string;
  primaryGateMapping: GateId[];
}

export const LEGACY_20_GATE_MAP: LegacyControlDefinition[] = [
  { controlId: "G01", name: "Legal classification", primaryGateMapping: ["G1"] },
  { controlId: "G02", name: "Licensing/regulatory permission", primaryGateMapping: ["G2"] },
  { controlId: "G03", name: "Bank contract", primaryGateMapping: ["G4"] },
  { controlId: "G04", name: "Liability/resolution contract", primaryGateMapping: ["G0","G4"] },
  { controlId: "G05", name: "Bank technical certification", primaryGateMapping: ["G5"] },
  { controlId: "G06", name: "Legal backing control", primaryGateMapping: ["G6"] },
  { controlId: "G07", name: "Protected backing operational", primaryGateMapping: ["G6"] },
  { controlId: "G08", name: "Three-book operational", primaryGateMapping: ["G5","G6"] },
  { controlId: "G09", name: "Technical and legal finality", primaryGateMapping: ["G1","G5","G8"] },
  { controlId: "G10", name: "Live AML/sanctions controls", primaryGateMapping: ["G2","G5","G8"] },
  { controlId: "G11", name: "Live reconciliation", primaryGateMapping: ["G5","G8"] },
  { controlId: "G12", name: "Independent assurance", primaryGateMapping: ["G8"] },
  { controlId: "G13", name: "Controlled pilot", primaryGateMapping: ["G7"] },
  { controlId: "G14", name: "Accounting/prudential validation", primaryGateMapping: ["G1","G6"] },
  { controlId: "G15", name: "Cybersecurity assurance", primaryGateMapping: ["G8"] },
  { controlId: "G16", name: "Disaster recovery", primaryGateMapping: ["G8"] },
  { controlId: "G17", name: "Commercial TCO/economics", primaryGateMapping: ["G9"] },
  { controlId: "G18", name: "Competitive/incumbent compatibility", primaryGateMapping: ["G3","G9"] },
  { controlId: "G19", name: "Wind-down test", primaryGateMapping: ["G8","G11"] },
  { controlId: "G20", name: "Production governance", primaryGateMapping: ["G11"] },
];

export function getGateDefinition(gateId: GateId): GateDefinition {
  const def = G0_G11_GATE_DEFINITIONS.find((g) => g.gateId === gateId);
  if (!def) throw new Error(`Unknown gate: ${gateId}`);
  return def;
}
