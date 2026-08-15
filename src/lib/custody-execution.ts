// v25.0 Institutional Closure 2/8 — Custody Execution, Legal Segregation, Reserve Evidence Management
// =================================================================
// Turns custody from software readiness into executable institutional onboarding.
//
// CURRENT TRUTH: All custodians SIMULATED. 0 contracted. 0 LIVE.
// TARGET: ≤15% preferred, ≤25% absolute, ≤20% parent-group.
//
// Implements:
//   Task 1: Custodian master record (9 entity types)
//   Task 2: Custodian lifecycle (11 statuses)
//   Task 3: Evidence requirements (14 types)
//   Task 4: Allocation engine (concentration + CIS + hard-cap prevention)
//   Task 5: Real vs simulated (DATA_CLASS on every record)
//   Task 6: Reserve transfer plan (9-step auditable workflow)
//   Task 7: Failure management (6 scenarios)
//   Task 8: Production gate (CUSTODY_BLOCKED until evidence verified)
// =================================================================

// ---- Task 5: DATA_CLASS (applies to ALL records) ----

export type DataClass = "SIMULATED" | "CONTRACTED" | "LIVE";

export const DATA_CLASS_RULE = "Every custody record MUST contain DATA_CLASS. SIMULATED data must NEVER be presented as evidence of production reserves." as const;

// ---- Task 1: Custodian Master Record (9 entity types) ----

// 1. Custodian
export interface Custodian {
  custodianId: string;
  legalName: string;
  legalEntity: string;
  parentGroupId: string;
  jurisdiction: string;
  vaultLocation: string;
  ownership: string;
  regulatoryStatus: string;
  insolvencyRegime: string;
  dataClass: DataClass;
  createdAt: string;
  updatedAt: string;
}

// 2. CustodianGroup
export interface CustodianGroup {
  groupId: string;
  groupName: string;
  parentCompany: string;
  ultimateBeneficialOwner: string;
  jurisdiction: string;
  aggregateExposurePct: number;  // Sum of all subsidiaries
  dataClass: DataClass;
}

// 3. CustodyContract
export interface CustodyContract {
  contractId: string;
  custodianId: string;
  contractType: "ALLOCATED" | "UNALLOCATED";
  signedDate: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  legalEntity: string;
  governingLaw: string;
  dataClass: DataClass;
  status: "DRAFT" | "NEGOTIATING" | "SIGNED" | "ACTIVE" | "EXPIRED" | "TERMINATED";
}

// 4. CustodyEvidence
export interface CustodyEvidence {
  evidenceId: string;
  custodianId: string;
  evidenceType: EvidenceType;
  description: string;
  documentHash: string | null;  // Cryptographic hash of uploaded document
  uploadedAt: string | null;
  verifiedBy: string | null;     // Who verified (independent party)
  verifiedAt: string | null;
  dataClass: DataClass;
  status: "REQUIRED" | "PENDING" | "UPLOADED" | "VERIFIED" | "REJECTED";
}

export type EvidenceType =
  | "SIGNED_AGREEMENT"
  | "LEGAL_SEGREGATION_OPINION"
  | "PROOF_OF_TITLE"
  | "RESERVE_OWNERSHIP"
  | "INSURANCE"
  | "AUDIT_EVIDENCE"
  | "INSOLVENCY_TREATMENT"
  | "JURISDICTIONAL_AUTHORIZATION"
  | "SANCTIONS_KYC"
  | "BUSINESS_CONTINUITY"
  | "DISASTER_RECOVERY"
  | "CYBER_CONTROLS"
  | "PHYSICAL_SECURITY"
  | "OPERATIONAL_CONTACTS";

// 5. CustodyLegalOpinion
export interface CustodyLegalOpinion {
  opinionId: string;
  custodianId: string;
  lawFirm: string;
  opinionDate: string | null;
  opinionScope: string;
  conclusion: "FAVORABLE" | "CONDITIONAL" | "UNFAVORABLE" | "PENDING" | "NOT_OBTAINED";
  dataClass: DataClass;
}

// 6. CustodyInsurance
export interface CustodyInsurance {
  insuranceId: string;
  custodianId: string;
  insurer: string;
  policyNumber: string | null;
  coverageAmount: number;
  coverageType: string;
  effectiveDate: string | null;
  expiryDate: string | null;
  dataClass: DataClass;
}

// 7. CustodyAudit
export interface CustodyAudit {
  auditId: string;
  custodianId: string;
  auditor: string;
  auditDate: string | null;
  auditScope: string;
  findings: string;
  opinion: "UNQUALIFIED" | "QUALIFIED" | "ADVERSE" | "PENDING" | "NOT_CONDUCTED";
  dataClass: DataClass;
}

// 8. CustodyOperationalReview
export interface CustodyOperationalReview {
  reviewId: string;
  custodianId: string;
  reviewer: string;
  reviewDate: string | null;
  operationalModel: string;
  technologyDependency: string;
  settlementDependency: string;
  bankingDependency: string;
  physicalSecurity: string;
  cyberControls: string;
  businessContinuity: string;
  disasterRecovery: string;
  dataClass: DataClass;
}

// 9. CustodyAllocation
export interface CustodyAllocation {
  allocationId: string;
  custodianId: string;
  assetType: string;         // "PHYSICAL_GOLD" | "TOKENIZED_GOLD" | "FIAT" | "DIGITAL"
  amountUsd: number;
  concentrationPct: number;
  parentGroupPct: number;
  jurisdictionPct: number;
  cis: number;
  dataClass: DataClass;
  timestamp: string;
}

// ---- Task 2: Custodian Lifecycle (11 statuses) ----

export type CustodianLifecycleStatus =
  | "PROSPECT"
  | "NDA"
  | "DUE_DILIGENCE"
  | "LEGAL_REVIEW"
  | "COMMERCIAL_REVIEW"
  | "CONTRACT_PENDING"
  | "CONTRACTED"
  | "APPROVED"
  | "LIVE"
  | "SUSPENDED"
  | "TERMINATED";

export const LIFECYCLE_TRANSITIONS: Record<CustodianLifecycleStatus, CustodianLifecycleStatus[]> = {
  PROSPECT:         ["NDA"],
  NDA:              ["DUE_DILIGENCE", "TERMINATED"],
  DUE_DILIGENCE:    ["LEGAL_REVIEW", "TERMINATED"],
  LEGAL_REVIEW:     ["COMMERCIAL_REVIEW", "TERMINATED"],
  COMMERCIAL_REVIEW:["CONTRACT_PENDING", "TERMINATED"],
  CONTRACT_PENDING: ["CONTRACTED", "TERMINATED"],
  CONTRACTED:       ["APPROVED", "SUSPENDED", "TERMINATED"],
  APPROVED:         ["LIVE", "SUSPENDED", "TERMINATED"],
  LIVE:             ["SUSPENDED", "TERMINATED"],
  SUSPENDED:        ["LIVE", "TERMINATED"],
  TERMINATED:       [],
};

export function canTransition(from: CustodianLifecycleStatus, to: CustodianLifecycleStatus): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

// ---- Task 3: Evidence Requirements (14 types) ----

export const REQUIRED_EVIDENCE: EvidenceType[] = [
  "SIGNED_AGREEMENT",
  "LEGAL_SEGREGATION_OPINION",
  "PROOF_OF_TITLE",
  "RESERVE_OWNERSHIP",
  "INSURANCE",
  "AUDIT_EVIDENCE",
  "INSOLVENCY_TREATMENT",
  "JURISDICTIONAL_AUTHORIZATION",
  "SANCTIONS_KYC",
  "BUSINESS_CONTINUITY",
  "DISASTER_RECOVERY",
  "CYBER_CONTROLS",
  "PHYSICAL_SECURITY",
  "OPERATIONAL_CONTACTS",
];

export function checkEvidenceComplete(evidence: CustodyEvidence[]): { complete: boolean; missing: EvidenceType[] } {
  const obtained = new Set(evidence.filter(e => e.status === "VERIFIED").map(e => e.evidenceType));
  const missing = REQUIRED_EVIDENCE.filter(t => !obtained.has(t));
  return { complete: missing.length === 0, missing };
}

// ---- Task 4: Allocation Engine ----

export interface AllocationCheckResult {
  currentConcentration: number;
  targetConcentration: number;
  postTransferConcentration: number;
  parentGroupConcentration: number;
  jurisdictionConcentration: number;
  cis: number;
  hardCapViolated: boolean;
  targetViolated: boolean;
  parentCapViolated: boolean;
  allocationBlocked: boolean;
  blockReason: string;
}

export function checkAllocation(input: {
  custodianId: string;
  currentHolding: number;
  proposedTransfer: number;
  totalReserve: number;
  parentGroupAggregate: number;
  jurisdictionAggregate: number;
  cis: number;
}): AllocationCheckResult {
  const postTransfer = input.currentHolding + input.proposedTransfer;
  const postConcentration = postTransfer / input.totalReserve;
  const parentPct = (input.parentGroupAggregate + input.proposedTransfer) / input.totalReserve;
  const jurPct = (input.jurisdictionAggregate + input.proposedTransfer) / input.totalReserve;

  const hardCapViolated = postConcentration > 0.25;
  const targetViolated = postConcentration > 0.15;
  const parentCapViolated = parentPct > 0.20;

  const allocationBlocked = hardCapViolated || parentCapViolated;
  const blockReason = hardCapViolated
    ? `BLOCKED: Post-transfer concentration ${(postConcentration * 100).toFixed(1)}% > 25% hard cap`
    : parentCapViolated
    ? `BLOCKED: Parent-group ${(parentPct * 100).toFixed(1)}% > 20% parent cap`
    : targetViolated
    ? `WARNING: Post-transfer ${(postConcentration * 100).toFixed(1)}% > 15% target (not blocked)`
    : "OK: Within all limits";

  return {
    currentConcentration: input.currentHolding / input.totalReserve,
    targetConcentration: 0.15,
    postTransferConcentration: postConcentration,
    parentGroupConcentration: parentPct,
    jurisdictionConcentration: jurPct,
    cis: input.cis,
    hardCapViolated,
    targetViolated,
    parentCapViolated,
    allocationBlocked,
    blockReason,
  };
}

// ---- Task 6: Reserve Transfer Plan (9-step auditable workflow) ----

export interface ReserveTransferStep {
  step: number;
  name: string;
  actor: string;
  action: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  evidence: string;
  timestamp: string | null;
}

export interface ReserveTransferPlan {
  transferId: string;
  fromCustodianId: string;
  toCustodianId: string;
  amountUsd: number;
  assetType: string;
  steps: ReserveTransferStep[];
  status: "INITIATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
  legalApproval: boolean;
  operationalApproval: boolean;
  reconciliationVerified: boolean;
}

export function createTransferPlan(from: string, to: string, amount: number, assetType: string): ReserveTransferPlan {
  const now = new Date().toISOString();
  return {
    transferId: `XFER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    fromCustodianId: from,
    toCustodianId: to,
    amountUsd: amount,
    assetType,
    steps: [
      { step: 1, name: "Transfer Request", actor: "COO", action: `Request transfer of $${amount} from ${from} to ${to}`, status: "PENDING", evidence: "Transfer request form", timestamp: null },
      { step: 2, name: "Legal Approval", actor: "Legal Counsel", action: "Verify legal authority to transfer + new custodian agreement", status: "PENDING", evidence: "Legal approval memo", timestamp: null },
      { step: 3, name: "Operational Approval", actor: "COO + Custody Operations", action: "Verify operational readiness of receiving custodian", status: "PENDING", evidence: "Operational readiness checklist", timestamp: null },
      { step: 4, name: "Custodian Confirmation (Sender)", actor: "From Custodian", action: "Sender confirms holdings available for transfer", status: "PENDING", evidence: "Custodian confirmation", timestamp: null },
      { step: 5, name: "Reserve Verification", actor: "Audit Operations", action: "Verify reserve exists and is unencumbered", status: "PENDING", evidence: "Reserve verification report", timestamp: null },
      { step: 6, name: "New Custodian Confirmation (Receiver)", actor: "To Custodian", action: "Receiver confirms acceptance and capacity", status: "PENDING", evidence: "Receiver confirmation", timestamp: null },
      { step: 7, name: "Physical/Operational Transfer", actor: "Both Custodians", action: "Execute physical transfer (gold) or operational transfer (records)", status: "PENDING", evidence: "Transfer receipt", timestamp: null },
      { step: 8, name: "Updated Allocation", actor: "MITHQAL System", action: "Update custody allocation records", status: "PENDING", evidence: "Updated allocation report", timestamp: null },
      { step: 9, name: "Reconciliation", actor: "Audit Operations", action: "Verify post-transfer reconciliation (3-way: ledger + both custodians)", status: "PENDING", evidence: "Reconciliation report", timestamp: null },
    ],
    status: "INITIATED",
    legalApproval: false,
    operationalApproval: false,
    reconciliationVerified: false,
  };
}

// ---- Task 7: Failure Management (6 scenarios) ----

export interface CustodyFailureResponse {
  scenario: string;
  trigger: string;
  detection: string;
  immediateAction: string;
  reserveAction: string;
  communication: string;
  recovery: string;
  defined: boolean;
}

export const CUSTODY_FAILURE_RESPONSES: CustodyFailureResponse[] = [
  {
    scenario: "Custodian Outage",
    trigger: "Custodian operational systems unavailable >4h",
    detection: "Heartbeat monitoring + custodian API unresponsive",
    immediateAction: "Flag custodian as DEGRADED; queue transactions for affected holdings",
    reserveAction: "If >5% reserve affected: ISSUANCE_HALT; activate backup custodian",
    communication: "Notify affected institutions; COO notified",
    recovery: "When custodian recovers: reconcile + process queue + verify integrity",
    defined: true,
  },
  {
    scenario: "Custodian Insolvency",
    trigger: "Custodian declares bankruptcy / insolvency proceedings filed",
    detection: "Regulatory news + custodian confirmation + insurance trigger",
    immediateAction: "ISOLATE custodian holdings; ISSUANCE_HALT if >5% affected; insurance claim filed",
    reserveAction: "Transfer holdings to alternative custodians (per transfer plan); legal recovery from custodian estate",
    communication: "Council emergency session; institution + regulator notification; legal counsel engaged",
    recovery: "Insurance recovery (6-18 months); legal recovery (1-5 years); reserve rebuild",
    defined: true,
  },
  {
    scenario: "Regulatory Freeze",
    trigger: "Regulator freezes custodian operations (investigation, sanction)",
    detection: "Regulatory notice + custodian notification",
    immediateAction: "ISOLATE affected holdings; JSG isolation for custodian's jurisdiction",
    reserveAction: "Transfer holdings to custodians in non-affected jurisdictions (if legally permitted)",
    communication: "Legal counsel + regulator communication + institution notification",
    recovery: "Regulatory resolution; unfreeze + transfer; or legal recovery",
    defined: true,
  },
  {
    scenario: "Cyber Incident",
    trigger: "Security breach at custodian (vault system, records, or keys)",
    detection: "Security monitoring + custodian incident report + forensic indicators",
    immediateAction: "FREEZE all transfers from/to custodian; forensic investigation; key rotation if keys affected",
    reserveAction: "Verify reserve integrity (physical count if needed); transfer to unaffected custodian",
    communication: "Security Lead + CTO + COO; institution notification; regulatory notification if breach confirmed",
    recovery: "Forensic audit; security remediation; key rotation; transfer if needed",
    defined: true,
  },
  {
    scenario: "Insurance Failure",
    trigger: "Custodian's insurance policy lapses, cancelled, or insurer insolvent",
    detection: "Insurance monitoring + policy expiry tracking + insurer health",
    immediateAction: "Flag custodian as INSURANCE_GAP; restrict new allocations to custodian",
    reserveAction: "Require custodian to obtain replacement insurance within 30 days; otherwise transfer holdings",
    communication: "Custodian notification; COO notified; risk review",
    recovery: "New insurance obtained → restore status; or transfer to insured custodian",
    defined: true,
  },
  {
    scenario: "Jurisdictional Restriction",
    trigger: "New jurisdictional regulation prohibits/restricts custodian operations",
    detection: "Regulatory monitoring + legal counsel update + JSG classification change",
    immediateAction: "JSG classification updated; restrict transactions with custodian's jurisdiction",
    reserveAction: "Transfer holdings to custodians in permitted jurisdictions",
    communication: "Legal counsel + regulator + institution notification",
    recovery: "Jurisdictional resolution; or complete transfer out of restricted jurisdiction",
    defined: true,
  },
];

// ---- Task 8: Production Gate ----

export interface CustodyProductionGate {
  evidenceComplete: boolean;       // All 14 evidence types verified
  noCustodianAbove25: boolean;     // Hard cap
  target15Achieved: boolean;        // Preferred target
  parentGroupCompliant: boolean;   // ≤20% parent
  allContracted: boolean;           // All custodians have signed contracts
  allLive: boolean;                 // All custodians holding real assets
  legalSegregationDocumented: boolean;
  independentVerification: boolean; // Evidence independently verified
  gateStatus: "CUSTODY_BLOCKED" | "CUSTODY_READY";
  blockers: string[];
}

export function checkCustodyGate(
  custodians: Custodian[],
  evidence: CustodyEvidence[],
  allocations: CustodyAllocation[],
): CustodyProductionGate {
  const blockers: string[] = [];

  // Evidence check
  const evidenceCheck = checkEvidenceComplete(evidence);
  if (!evidenceCheck.complete) {
    blockers.push(`Evidence incomplete: ${evidenceCheck.missing.length} of ${REQUIRED_EVIDENCE.length} types missing`);
  }

  // Concentration checks
  for (const alloc of allocations) {
    if (alloc.concentrationPct > 0.25) {
      blockers.push(`${alloc.custodianId}: ${(alloc.concentrationPct * 100).toFixed(1)}% > 25% hard cap`);
    }
    if (alloc.concentrationPct > 0.15) {
      blockers.push(`${alloc.custodianId}: ${(alloc.concentrationPct * 100).toFixed(1)}% > 15% target`);
    }
    if (alloc.parentGroupPct > 0.20) {
      blockers.push(`${alloc.custodianId}: parent group ${(alloc.parentGroupPct * 100).toFixed(1)}% > 20% cap`);
    }
  }

  // Data class checks
  const simulated = custodians.filter(c => c.dataClass === "SIMULATED");
  if (simulated.length > 0) {
    blockers.push(`${simulated.length} custodian(s) are SIMULATED (not contracted/LIVE)`);
  }

  const notLive = custodians.filter(c => c.dataClass !== "LIVE");
  if (notLive.length > 0) {
    blockers.push(`${notLive.length} custodian(s) are not LIVE`);
  }

  // Legal segregation
  const legalOpinions = evidence.filter(e => e.evidenceType === "LEGAL_SEGREGATION_OPINION" && e.status === "VERIFIED");
  if (legalOpinions.length === 0) {
    blockers.push("No legal segregation opinions verified");
  }

  // Independent verification
  const independentlyVerified = evidence.filter(e => e.status === "VERIFIED" && e.verifiedBy !== null);
  if (independentlyVerified.length < REQUIRED_EVIDENCE.length) {
    blockers.push(`Only ${independentlyVerified.length}/${REQUIRED_EVIDENCE.length} evidence types independently verified`);
  }

  const gateStatus = blockers.length === 0 ? "CUSTODY_READY" : "CUSTODY_BLOCKED";

  return {
    evidenceComplete: evidenceCheck.complete,
    noCustodianAbove25: allocations.every(a => a.concentrationPct <= 0.25),
    target15Achieved: allocations.every(a => a.concentrationPct <= 0.15),
    parentGroupCompliant: allocations.every(a => a.parentGroupPct <= 0.20),
    allContracted: custodians.every(c => c.dataClass === "CONTRACTED" || c.dataClass === "LIVE"),
    allLive: custodians.every(c => c.dataClass === "LIVE"),
    legalSegregationDocumented: legalOpinions.length > 0,
    independentVerification: independentlyVerified.length >= REQUIRED_EVIDENCE.length,
    gateStatus,
    blockers,
  };
}

// Never allow UI to convert SIMULATED → LIVE without evidence
export const UI_CONVERSION_RULE = "Never allow UI to convert SIMULATED → LIVE without evidence. Status transitions require evidence upload + independent verification. No UI toggle can bypass this." as const;
