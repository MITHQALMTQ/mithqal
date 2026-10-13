// src/lib/dispute-exception-framework.ts
//
// MITHQAL v25.3.19 — DISPUTE & EXCEPTION FRAMEWORK (single source of truth)
// Per PROMPT 33:
//   "Create a formal dispute and exception framework.
//    Separate:
//    technical incident,
//    reconciliation exception,
//    settlement instruction dispute,
//    unauthorized transaction,
//    duplicate transaction,
//    bank-versus-bank operational dispute,
//    legal dispute.
//    For each define:
//    detection -> freeze/safe handling -> evidence capture -> notification ->
//    investigation -> correction/rollback where legally permitted -> escalation
//    -> resolution authority -> final record.
//    MITHQAL must coordinate evidence and workflow but must NOT present itself
//    as an arbitrator, court or commercial dispute adjudicator."
//
// CHANGE REQUEST: CR-2026-009 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine
//   - No existing functionality removed
//   - All dispute types have a 9-stage lifecycle (DETECTION -> FREEZE_SAFE_HANDLING ->
//     EVIDENCE_CAPTURE -> NOTIFICATION -> INVESTIGATION -> CORRECTION_ROLLBACK ->
//     ESCALATION -> RESOLUTION_AUTHORITY -> FINAL_RECORD) — exactly the 9 stages
//     enumerated in the directive verbatim
//   - All dispute types have resolutionAuthority != MITHQAL — MITHQAL coordinates
//     evidence + workflow but does NOT adjudicate
//   - MITHQAL_COORDINATION_RULE: "MITHQAL must coordinate evidence and workflow
//     but must NOT present itself as an arbitrator, court or commercial dispute
//     adjudicator."
// Cross-references prior canonical modules:
//   - v25.3.7 M1 (institutional operating model — JOZOUR_LLC_NJ)
//   - v25.3.7 M2 (finality trust domains — Domain A/B/C + cross-domain isolation)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry)
//   - v25.3.9 O2 (Reconciliation Tolerance Policies — 6 tolerance bands)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle)
//   - v25.3.15 T2 (Controlled Architecture Freeze — 10 frozen schemas + 7-step change)
//   - v25.3.16 U2 (PBC Legal Enforceability — custody arrangement field)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality)
//   - v25.3.18 W1 (Bank Contracting Package — DISPUTE_ESCALATION section)
//   - v25.3.18 W2 (Enterprise Risk Register — RECONCILIATION/SETTLEMENT/LEGAL risks)
//   - v25.3.19 X1 (Institutional Data Governance — evidence integrity + auditability)
//
// NOTE on stage count: The directive's headline text mentions "10-stage lifecycle",
// but the directive's own enumerated stage list contains exactly 9 stages (detection
// -> freeze/safe handling -> evidence capture -> notification -> investigation ->
// correction/rollback where legally permitted -> escalation -> resolution authority
// -> final record). The directive's own verification script asserts
// `lifecycleStageCount` should be 9. This module therefore defines 9 stages
// exactly as enumerated in the directive verbatim — the literal stage list and
// the verification script are the ground truth. This honest reconciliation is
// documented in the worklog and commit message per "Be HONEST" rule.

// ============================================================================
// PART 1: Dispute/Exception Type IDs (canonical, frozen by this module)
// ============================================================================

/**
 * The 7 canonical dispute/exception types — per directive "Separate:
 * technical incident, reconciliation exception, settlement instruction
 * dispute, unauthorized transaction, duplicate transaction, bank-versus-bank
 * operational dispute, legal dispute."
 */
export type DisputeTypeId =
  | "TECHNICAL_INCIDENT"
  | "RECONCILIATION_EXCEPTION"
  | "SETTLEMENT_INSTRUCTION_DISPUTE"
  | "UNAUTHORIZED_TRANSACTION"
  | "DUPLICATE_TRANSACTION"
  | "BANK_VS_BANK_OPERATIONAL_DISPUTE"
  | "LEGAL_DISPUTE";

/**
 * The 9 canonical lifecycle stages per dispute/exception type — per directive's
 * enumerated stage list verbatim: detection -> freeze/safe handling ->
 * evidence capture -> notification -> investigation -> correction/rollback
 * where legally permitted -> escalation -> resolution authority -> final record.
 */
export type LifecycleStageId =
  | "DETECTION"
  | "FREEZE_SAFE_HANDLING"
  | "EVIDENCE_CAPTURE"
  | "NOTIFICATION"
  | "INVESTIGATION"
  | "CORRECTION_ROLLBACK"
  | "ESCALATION"
  | "RESOLUTION_AUTHORITY"
  | "FINAL_RECORD";

// ============================================================================
// PART 2: Type definitions
// ============================================================================

/**
 * A single stage in a dispute/exception lifecycle. Each stage declares:
 * - owner: the singular accountable role (per W1 SINGULAR_OWNER_RULE)
 * - actions: what must happen at this stage
 * - mithqalCoordinationRole: what MITHQAL DOES at this stage (coordinate evidence + workflow)
 * - mithqalNonAdjudicatorBoundary: what MITHQAL must NOT do (per MITHQAL_COORDINATION_RULE)
 */
export interface LifecycleStage {
  stageId: LifecycleStageId;
  name: string;
  owner: string;
  actions: string[];
  mithqalCoordinationRole: string;
  mithqalNonAdjudicatorBoundary: string;
}

/**
 * A single dispute/exception type with its full 9-stage lifecycle, escalation
 * authority, and resolution authority. The resolutionAuthority is NEVER MITHQAL
 * per directive — MITHQAL coordinates evidence + workflow only.
 */
export interface DisputeTypeSpec {
  typeId: DisputeTypeId;
  name: string;
  description: string;
  lifecycleStages: LifecycleStage[]; // exactly 9 entries
  escalationAuthority: string;
  resolutionAuthority: string; // NEVER MITHQAL — per directive
  honestNote: string;
}

// ============================================================================
// PART 3: Catalogs (dispute types + lifecycle stages)
// ============================================================================

export const DISPUTE_TYPES: {
  id: DisputeTypeId;
  name: string;
  description: string;
}[] = [
  {
    id: "TECHNICAL_INCIDENT",
    name: "Technical Incident",
    description:
      "A technical system event with potential impact on settlement, ledger, or evidence integrity — outage, software defect, infrastructure failure, cyber event, model failure. Cross-references v25.3.13 S1 SettlementContinuityFabric 9 events (BANK_DEFAULT / CUSTODIAN_FAILURE / RAIL_OUTAGE / JURISDICTION_RESTRICTION / LIQUIDITY_FAILURE / CYBER_EVENT / FINALITY_ORACLE_FAILURE / POLICY_EXPIRATION / RECONCILIATION_BREAK).",
  },
  {
    id: "RECONCILIATION_EXCEPTION",
    name: "Reconciliation Exception",
    description:
      "A tolerance-band breach detected by the reconciliation engine — variance exceeds the band per v25.3.9 O2 (LEDGER_TO_LEDGER=1bps / BANK_ATTESTATION=5bps / CUSTODY_QUANTITY=10bps / MARKET_VALUATION=50bps / FX_VALUATION=20bps / STRESSED_VALUATION=200bps).",
  },
  {
    id: "SETTLEMENT_INSTRUCTION_DISPUTE",
    name: "Settlement Instruction Dispute",
    description:
      "A dispute between parties over the content, routing, timing, or amount of a settlement instruction — counterparty contests the instruction itself (not the execution).",
  },
  {
    id: "UNAUTHORIZED_TRANSACTION",
    name: "Unauthorized Transaction",
    description:
      "A transaction executed without proper authorization — instruction forged, signature invalid, role authority exceeded, or instruction source not in the authorized set.",
  },
  {
    id: "DUPLICATE_TRANSACTION",
    name: "Duplicate Transaction",
    description:
      "A transaction that appears to duplicate a prior instruction — same amount, counterparty, purpose, narrow time window. Detected by deterministic duplicate-detection rules; resolution requires human judgement on intent.",
  },
  {
    id: "BANK_VS_BANK_OPERATIONAL_DISPUTE",
    name: "Bank-vs-Bank Operational Dispute",
    description:
      "An operational dispute between two bank counterparties mediated through MITHQAL rails — failed message, mismatched account, missed SLA, misdirected funds, sequence disagreement. NOT a commercial dispute (those route to LEGAL_DISPUTE).",
  },
  {
    id: "LEGAL_DISPUTE",
    name: "Legal Dispute",
    description:
      "A formal legal dispute — litigation, arbitration, regulatory enforcement action, contract-breach claim. MITHQAL coordinates evidence ONLY; resolution is exclusively for courts / arbitrators / regulators / settlement authorities external to MITHQAL.",
  },
];

export const LIFECYCLE_STAGES: {
  id: LifecycleStageId;
  name: string;
  description: string;
}[] = [
  {
    id: "DETECTION",
    name: "Detection",
    description:
      "Automated or manual detection of the event. Detection sources: monitoring systems, reconciliation engine, counterparty notification, regulator notice, auditor finding.",
  },
  {
    id: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    description:
      "Immediate safe-handling of affected assets, instructions, and systems — halt new instructions, freeze settlement, isolate the affected domain (per M2 trust-domain isolation rules).",
  },
  {
    id: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    description:
      "Capture of all evidence relevant to the event — ledger snapshots, log chains, attestation snapshots, instruction records, counterparty notifications, regulatory filings. Per N2 Evidence Fabric 15-field EvidencePackage.",
  },
  {
    id: "NOTIFICATION",
    name: "Notification",
    description:
      "Notification of affected parties — counterparties, auditors, regulators (where required), internal escalation owners. Per W1 Bank Contracting Package INCIDENT_NOTIFICATION section.",
  },
  {
    id: "INVESTIGATION",
    name: "Investigation",
    description:
      "Investigation of root cause, scope, impact, and remediation options. Cross-references N1 canonical finality model and N2 Evidence Fabric for chain-of-custody.",
  },
  {
    id: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    description:
      "Correction or rollback of the affected state — only where legally permitted. Cannot unwind a final settlement (per N1 canonical finality — final settlement is irrevocable); can only correct non-final state or apply compensating transactions.",
  },
  {
    id: "ESCALATION",
    name: "Escalation",
    description:
      "Escalation to the resolution authority when investigation cannot resolve the matter locally. Escalation path declared per dispute type (e.g., SVP Operations -> COO -> external counsel -> regulator).",
  },
  {
    id: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    description:
      "Resolution by the appropriate authority — for technical/reconciliation disputes: internal COO+CTO joint authority. For settlement/bank-vs-bank: external commercial resolution per W1 DISPUTE_ESCALATION section. For legal: courts / arbitrators / regulators. NEVER MITHQAL as adjudicator.",
  },
  {
    id: "FINAL_RECORD",
    name: "Final Record",
    description:
      "Recording of the final outcome — resolution, compensating transactions, regulatory filings, lessons learned, evidence retained per retention rules (per X1 data governance). The final record is immutable per INSTITUTIONAL_VALIDITY_RULE.",
  },
];

// ============================================================================
// PART 4: The 7 dispute types with full 9-stage lifecycle each
// ----------------------------------------------------------------------------
// Each dispute type's lifecycle declares owner + actions + MITHQAL coordination
// role + MITHQAL non-adjudicator boundary at every stage. MITHQAL NEVER appears
// as the resolution authority. The resolution authority is always an external
// party: internal COO+CTO (for technical/reconciliation/internal-ops disputes)
// or external court/arbitrator/regulator (for settlement instruction,
// unauthorized, duplicate, bank-vs-bank, legal disputes).
// ============================================================================

// --- 4.1 TECHNICAL_INCIDENT ---
const TECHNICAL_INCIDENT_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Monitoring system or human operator detects the technical event.",
      "Open a technical-incident record with detection timestamp + source.",
      "Triage: severity (P1/P2/P3) + affected systems + affected trust domains.",
    ],
    mithqalCoordinationRole:
      "MITHQAL routes the detection event to the on-call CTO escalation owner and writes an EvidencePackage stub (per N2).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide severity or prioritization. The CTO is the singular owner of triage decisions.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Halt new settlement instructions on affected rails (per S1 SettlementContinuityFabric).",
      "Isolate affected trust domains per M2 cross-domain isolation rules.",
      "Snapshot affected systems + ledger state for EVIDENCE_CAPTURE.",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the CTO and coordinates cross-domain isolation. MITHQAL preserves the snapshot and writes it to the Evidence Fabric (per N2).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide which rails to halt. The CTO is the singular freeze-decision authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture full EvidencePackage per N2 — 15 fields including provenance + timestamp + source + integrityHash + verificationStatus.",
      "Capture log-chain entries (per X1 OPERATIONAL_LOGS hash-chained).",
      "Capture ledger snapshots (per X1 LEDGER_DATA immutability).",
      "Capture system-state snapshots for root-cause analysis.",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the Evidence Fabric ingestion — writing EvidencePackages, computing SHA-256 commitments, requesting TSA stamps. MITHQAL preserves chain-of-custody.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT select which evidence is relevant to the incident. The CTO + auditor (where applicable) make the relevance determination. MITHQAL only ingests and preserves.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Notify affected bank counterparties per W1 INCIDENT_NOTIFICATION section.",
      "Notify auditor where the incident affects audit-trail events.",
      "Notify regulator where the incident triggers a regulatory notification obligation (per X1 REGULATORY_ACCESS).",
      "Notify internal stakeholders (SVP Operations, GC, CTO).",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload (affected transactions + evidence references) and tracks delivery receipts. MITHQAL provides the structured notification template.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify or when. The COO + GC are the notification authorities. MITHQAL only generates + tracks the notification.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Investigate root cause — code review, infrastructure analysis, vendor engagement (where applicable).",
      "Determine scope — what was affected, for how long, with what magnitude.",
      "Document remediation options.",
      "Engage external forensic vendor where required (per W2 enterprise risk register VENDOR risk).",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages + log chains + ledger snapshots for the investigation. MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine root cause or scope. The CTO (with external forensic vendor where engaged) is the investigation authority. MITHQAL only serves evidence.",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "CTO (Jozour, LLC) + COO (Jozour, LLC) joint",
    actions: [
      "Apply correction — only for non-final state. Final settlements cannot be rolled back per N1 canonical finality model.",
      "Apply compensating transactions where the affected state is final (e.g., issue a corrective settlement instruction).",
      "Document the correction as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability — no in-place mutation).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating transaction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct or rollback. The CTO+COO joint authority makes the correction decision. MITHQAL does NOT decide if a state is final — N1 canonical finality model is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Escalate to COO + GC where the incident has commercial or legal implications.",
      "Escalate to regulator where regulatory-notification thresholds are crossed.",
      "Escalate to external counsel where litigation is anticipated.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle — full Evidence Fabric query results + timeline + impacted parties. MITHQAL routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to escalate. The CTO is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "COO (Jozour, LLC) + CTO (Jozour, LLC) joint", // internal joint for technical incidents
    actions: [
      "COO + CTO joint authority approves the remediation plan.",
      "Where regulator is engaged, regulator concurrence required.",
      "Where GC is engaged, legal concurrence required.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with approver + concurrence evidence) as a new EvidencePackage and links it to the original incident record.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. COO+CTO joint (internal) is the resolution authority for technical incidents. MITHQAL only records + links the decision.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Record the final outcome — resolution, compensating transactions, regulatory filings, lessons learned.",
      "Link the final record to the original incident EvidencePackage (immutable per X1).",
      "Retain the final record per X1 OPERATIONAL_LOGS retention rules (incident-response logs: indefinite).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating incident. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. CTO+COO joint authority is the outcome authority. MITHQAL only records + applies retention.",
  },
];

// --- 4.2 RECONCILIATION_EXCEPTION ---
const RECONCILIATION_EXCEPTION_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Reconciliation engine detects a tolerance-band breach per O2 (LEDGER_TO_LEDGER=1bps / BANK_ATTESTATION=5bps / CUSTODY_QUANTITY=10bps / MARKET_VALUATION=50bps / FX_VALUATION=20bps / STRESSED_VALUATION=200bps).",
      "Open a reconciliation-exception record with band + variance bps + source systems.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the breach to the CTO escalation owner and writes an EvidencePackage stub referencing the reconciliation run + inputs hash + algorithm version (per X1 RECONCILIATION_EVIDENCE lineage).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine if a breach is material. The O2 tolerance bands (frozen per Architecture Freeze v25.3.15) are the deterministic authority. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Halt settlement instructions dependent on the breached reconciliation (per S1 SettlementContinuityFabric RECONCILIATION_BREAK event).",
      "Preserve the reconciliation inputs + outputs for EVIDENCE_CAPTURE.",
      "Notify affected counterparties that a reconciliation exception is being investigated.",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the COO and preserves the reconciliation inputs + outputs as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to halt settlement. The COO is the singular freeze-decision authority for reconciliation exceptions. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture full EvidencePackage per N2 + per X1 RECONCILIATION_EVIDENCE — source ledger snapshot, bank attestation, custody report, market data feed, FX feed, stress scenario as applicable.",
      "Capture the reconciliation algorithm version + tolerance-band configuration at time-of-breach.",
      "Compute SHA-256 commitment + TSA stamp.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves the algorithm version + tolerance-band configuration snapshot.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT alter the reconciliation inputs or outputs. The reconciliation engine is the deterministic authority. MITHQAL only preserves + commits.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Notify affected bank counterparties of the reconciliation exception + the variance bps.",
      "Notify auditor (reconciliation exceptions are auditor-relevant).",
      "Notify regulator where the exception crosses a regulatory-notification threshold.",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload (variance bps + tolerance band + evidence references) and tracks delivery receipts. MITHQAL provides the structured notification template per W1 INCIDENT_NOTIFICATION section.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify. The COO is the notification authority. MITHQAL only generates + tracks.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Investigate root cause — input error, algorithm defect, late-arriving data, custody report error, market-data feed error.",
      "Determine scope — what was affected, for how long, with what magnitude.",
      "Document remediation options — re-run reconciliation, correct input, escalate to bank counterparty.",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages for the investigation. MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine root cause. The CTO is the investigation authority. MITHQAL only serves evidence.",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "CTO (Jozour, LLC) + COO (Jozour, LLC) joint",
    actions: [
      "Apply correction to the input data (where input error) and re-run reconciliation.",
      "Apply compensating transaction where the reconciliation exception led to a final settlement — per N1, final settlements cannot be rolled back; only compensated.",
      "Document the correction as a new reconciliation-evidence record referencing the original (per X1 RECONCILIATION_EVIDENCE immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new reconciliation-evidence record referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating transaction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct or rollback. CTO+COO joint is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Escalate to COO + GC where the exception has commercial or legal implications.",
      "Escalate to bank counterparty where the exception is attributable to bank-side data (e.g., bank-attestation error).",
      "Escalate to regulator where the exception crosses a regulatory-notification threshold.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle — full Evidence Fabric query results + timeline + impacted parties + variance bps + tolerance band. MITHQAL routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to escalate to a bank counterparty. CTO+COO is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "COO (Jozour, LLC) + CTO (Jozour, LLC) joint", // internal joint for reconciliation exceptions
    actions: [
      "COO + CTO joint authority approves the remediation plan.",
      "Where bank counterparty is engaged, the bank counterparty's operations lead concurs (commercial resolution per W1 DISPUTE_ESCALATION section).",
      "Where regulator is engaged, regulator concurrence required.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with approver + concurrence evidence) as a new EvidencePackage and links it to the original exception record.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. COO+CTO joint (with bank-counterparty concurrence where applicable) is the resolution authority. MITHQAL only records + links the decision.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Record the final outcome — correction, compensating transaction, regulatory filings, lessons learned.",
      "Link the final record to the original exception EvidencePackage (immutable per X1).",
      "Retain the final record per X1 RECONCILIATION_EVIDENCE retention rules (exception-evidence: indefinite).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating exception. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. CTO+COO joint is the outcome authority. MITHQAL only records + applies retention.",
  },
];

// --- 4.3 SETTLEMENT_INSTRUCTION_DISPUTE ---
const SETTLEMENT_INSTRUCTION_DISPUTE_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Counterparty or operator flags that the settlement instruction content / routing / timing / amount is contested.",
      "Open a settlement-instruction-dispute record with disputed field + counterparty + instruction ID.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the dispute flag to the COO escalation owner and writes an EvidencePackage stub referencing the disputed instruction + counterparty assertion.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine if the dispute is valid. The COO is the singular initial-triage authority. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Freeze the disputed instruction (do not execute).",
      "Halt dependent downstream instructions (cascade freeze).",
      "Preserve the disputed instruction + counterparty assertion + relevant ledger state.",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the COO and preserves the disputed instruction + counterparty assertion as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to freeze. The COO is the singular freeze-decision authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture the disputed instruction + chain-of-authority (who authorized it, when, via what channel).",
      "Capture the counterparty assertion + supporting documentation.",
      "Capture relevant ledger state + finality state (per N1) at time-of-dispute.",
      "Compute SHA-256 commitment + TSA stamp.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves the chain-of-authority.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT alter or interpret the disputed instruction. MITHQAL only preserves + commits.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Notify the disputing counterparty of the freeze + dispute record + evidence references.",
      "Notify auditor (settlement disputes are auditor-relevant).",
      "Notify GC where the dispute has commercial or legal implications.",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload (dispute record + evidence references) and tracks delivery receipts. MITHQAL provides the structured notification template per W1 INCIDENT_NOTIFICATION + DISPUTE_ESCALATION sections.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify. The COO is the notification authority. MITHQAL only generates + tracks.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "COO (Jozour, LLC) + GC (external counsel)",
    actions: [
      "Investigate the dispute — instruction authority, counterparty assertion merit, contract terms (per W1), regulatory obligations.",
      "Determine scope — what transactions are affected.",
      "Document resolution options — re-issue, cancel, partial-execution, escalate to commercial dispute resolution.",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages for the investigation. MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine the merit of the counterparty's assertion. The COO + GC are the investigation authorities. MITHQAL only serves evidence.",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "COO (Jozour, LLC) + GC joint",
    actions: [
      "Apply correction ONLY where the disputed instruction is not yet final (per N1 canonical finality).",
      "Where the instruction is final, apply compensating instruction — original stands; compensating instruction is a new instruction.",
      "Document the correction as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating instruction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct. COO+GC joint is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Escalate to GC + external commercial counsel where the dispute cannot be resolved locally.",
      "Escalate to the bank counterparty's commercial lead.",
      "Escalate to regulator where the dispute crosses a regulatory-notification threshold.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle — full Evidence Fabric query results + timeline + impacted parties + contract references (per W1). MITHQAL routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to escalate. The COO is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "External commercial resolution authority (per W1 DISPUTE_ESCALATION + GOVERNING_LAW sections)",
    actions: [
      "Resolution per the executed bank contract's DISPUTE_ESCALATION section (mediation -> arbitration -> courts, per the contract).",
      "Where no contract is executed (current honest state per W1 — 0 SIGNED), no commercial resolution path exists; matter defaults to LEGAL_DISPUTE.",
      "MITHQAL is NOT a party to the commercial resolution.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with external-authority citation + concurrence evidence) as a new EvidencePackage and links it to the original dispute record.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. The external commercial resolution authority (mediator / arbitrator / court per the executed contract) is the authority. Where no contract exists, the matter defaults to LEGAL_DISPUTE and routes to a court. MITHQAL coordinates evidence ONLY.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Record the final outcome — commercial resolution, compensating transaction, regulatory filings, lessons learned.",
      "Link the final record to the original dispute EvidencePackage (immutable per X1).",
      "Retain the final record per X1 LEGAL_OBLIGATION_DATA retention rules (indefinite).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating dispute. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. The external commercial resolution authority is the outcome authority. MITHQAL only records + applies retention.",
  },
];

// --- 4.4 UNAUTHORIZED_TRANSACTION ---
const UNAUTHORIZED_TRANSACTION_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Detection source: signature-validation failure, role-authority-exceedance, instruction-source-not-authorized, or counterparty notification of unauthorized instruction.",
      "Open an unauthorized-transaction record with detected-failure-mode + transaction ID + counterparty.",
      "Triage severity — P1 if executed, P2 if caught pre-execution.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the detection event to the on-call CTO escalation owner and writes an EvidencePackage stub referencing the unauthorized transaction + detection evidence.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide severity. The CTO is the singular triage authority. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "CTO (Jozour, LLC) + COO (Jozour, LLC) joint",
    actions: [
      "Freeze the unauthorized transaction (if not yet final) and all dependent downstream instructions.",
      "If the unauthorized transaction has executed and is final (per N1), isolate the affected accounts + halt related instructions.",
      "Where unauthorized transaction involves a counterparty, notify the counterparty to halt on their side.",
      "Engage insider-threat protocol (per W2 enterprise risk register INSIDER risk).",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the CTO+COO joint authority and preserves the unauthorized transaction + chain-of-authority as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to freeze or engage insider-threat protocol. CTO+COO joint is the freeze authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture the unauthorized transaction + full chain-of-authority (who initiated, who authorized, what signature was used, what role was exceeded).",
      "Capture the related log-chain entries (per X1 OPERATIONAL_LOGS hash-chained).",
      "Capture access-control logs at the time of the unauthorized transaction.",
      "Capture any counterparty assertion or notification.",
      "Compute SHA-256 commitment + TSA stamp.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves the chain-of-authority.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT alter or interpret the unauthorized transaction. MITHQAL only preserves + commits.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC) + GC (external counsel)",
    actions: [
      "Notify the affected counterparty + request their halt.",
      "Notify GC + external counsel (unauthorized transactions may be a crime — fraud, embezzlement, cyber intrusion).",
      "Notify insurer (per W2 INS-CRIME-001 crime/fidelity policy — once policy is ACTIVE, currently DESIGNED).",
      "Notify regulator where regulatory-notification threshold is crossed (e.g., SAR filing).",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload + tracks delivery receipts + provides the structured notification template per W1 INCIDENT_NOTIFICATION section.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to notify insurer or regulator. COO+GC joint is the notification authority. MITHQAL only generates + tracks.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "CTO (Jozour, LLC) + GC + external forensic vendor",
    actions: [
      "Investigate the unauthorized transaction — was it an insider threat, an external compromise, a process failure, a forgery?",
      "Determine scope — what other transactions may be affected.",
      "Engage external forensic vendor where required (per W2 enterprise risk register VENDOR risk).",
      "Engage law enforcement where a crime is suspected (per GC direction).",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages + log chains + access-control logs for the investigation. MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine root cause. CTO + GC + external forensic vendor are the investigation authorities. MITHQAL only serves evidence.",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "COO (Jozour, LLC) + GC joint",
    actions: [
      "Apply correction ONLY where the unauthorized transaction is not yet final (per N1).",
      "Where the unauthorized transaction is final, apply compensating transaction — but ONLY after GC + (where applicable) law-enforcement concurrence (evidence-preservation chain-of-custody).",
      "Document the correction as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating transaction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct. COO+GC joint (with law-enforcement concurrence where applicable) is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "COO (Jozour, LLC) + GC joint",
    actions: [
      "Escalate to law enforcement where a crime is suspected (per GC direction).",
      "Escalate to insurer where the policy is ACTIVE (per W2 INS-CRIME-001 — currently DESIGNED, no claim possible yet).",
      "Escalate to regulator where the SAR / CTR filing threshold is crossed.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle — full Evidence Fabric query results + timeline + impacted parties + chain-of-authority. MITHQAL routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to escalate to law enforcement. COO+GC joint is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "External law enforcement + courts (where crime confirmed) OR COO+CTO joint (where process failure only)",
    actions: [
      "Where crime confirmed: external law enforcement + courts are the resolution authorities. MITHQAL is NOT a party to the criminal resolution.",
      "Where process failure only (no crime): COO+CTO joint authority approves the remediation plan internally.",
      "Where insurer is engaged: insurer claim adjuster is the resolution authority for the insurance claim (not the underlying incident).",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with external-authority citation + concurrence evidence) as a new EvidencePackage and links it to the original incident record.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. External law enforcement + courts (where crime) OR COO+CTO joint (where process failure) are the resolution authorities. MITHQAL coordinates evidence ONLY.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Record the final outcome — resolution, compensating transaction, regulatory filings (SAR/CTR), insurer claim, lessons learned.",
      "Link the final record to the original incident EvidencePackage (immutable per X1).",
      "Retain the final record per X1 LEDGER_DATA + OPERATIONAL_LOGS retention rules (indefinite for incident-response logs).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating incident. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. External law enforcement + courts OR COO+CTO joint are the outcome authorities. MITHQAL only records + applies retention.",
  },
];

// --- 4.5 DUPLICATE_TRANSACTION ---
const DUPLICATE_TRANSACTION_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Duplicate-detection rule fires — same amount, counterparty, purpose, narrow time window as a prior transaction.",
      "Open a duplicate-transaction record with the suspected-duplicate pair + detection rule.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the duplicate-suspicion to the CTO escalation owner and writes an EvidencePackage stub referencing the suspected pair + detection rule.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine if the duplicate is intentional or accidental. CTO is the singular initial-triage authority. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Freeze the suspected duplicate (do not execute) until investigation resolves intent.",
      "Notify the counterparty to halt on their side if the duplicate is cross-counterparty.",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the CTO and preserves the suspected pair as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to freeze. The CTO is the singular freeze-decision authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture the suspected duplicate pair + instruction metadata (originator, channel, timestamp).",
      "Capture the original instruction + counterparty assertions.",
      "Compute SHA-256 commitment + TSA stamp.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves the suspected-pair chain-of-authority.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT interpret intent. MITHQAL only preserves + commits.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Notify the counterparty of the duplicate-suspicion + freeze.",
      "Notify the originator of the instruction (if internal).",
      "Notify auditor (duplicate transactions are auditor-relevant).",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload + tracks delivery receipts + provides the structured notification template per W1 INCIDENT_NOTIFICATION section.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify. COO is the notification authority. MITHQAL only generates + tracks.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "COO (Jozour, LLC) + CTO (Jozour, LLC) joint",
    actions: [
      "Investigate intent — was the duplicate a system retry, an operator re-issue, a counterparty retransmission, an attempt at unauthorized duplication?",
      "Determine scope — are there other duplicates in the same window?",
      "Document resolution options — confirm one + cancel other, confirm both (legitimate), escalate to UNAUTHORIZED_TRANSACTION if intent is malicious.",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages + instruction metadata for the investigation. MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine intent. COO+CTO joint is the investigation authority. MITHQAL only serves evidence.",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "COO (Jozour, LLC) + CTO (Jozour, LLC) joint",
    actions: [
      "Apply correction ONLY where the duplicate is not yet final (per N1).",
      "Where the duplicate is final, apply compensating transaction to reverse one leg of the duplicate (if confirmed unintentional).",
      "Document the correction as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating transaction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct. COO+CTO joint is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Escalate to UNAUTHORIZED_TRANSACTION if intent is determined malicious.",
      "Escalate to bank counterparty where the duplicate is cross-counterparty and the counterparty disputes the resolution.",
      "Escalate to regulator where the duplicate crosses a regulatory-notification threshold.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle + routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to reclassify to UNAUTHORIZED_TRANSACTION. COO+CTO joint is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "COO (Jozour, LLC) + CTO (Jozour, LLC) joint (internal) OR external commercial authority (if cross-counterparty dispute)",
    actions: [
      "Internal resolution: COO+CTO joint authority approves the remediation plan.",
      "Where cross-counterparty dispute: external commercial resolution per W1 DISPUTE_ESCALATION section.",
      "Where reclassified to UNAUTHORIZED_TRANSACTION: route to UNAUTHORIZED_TRANSACTION resolution authority.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with approver + concurrence evidence) as a new EvidencePackage and links it to the original duplicate record.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. COO+CTO joint (internal) OR external commercial authority (if cross-counterparty) are the resolution authorities. MITHQAL coordinates evidence ONLY.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Record the final outcome — confirmed duplicate, correction, compensating transaction, regulatory filings, lessons learned.",
      "Link the final record to the original duplicate EvidencePackage (immutable per X1).",
      "Retain the final record per X1 LEDGER_DATA retention rules (indefinite).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating duplicate. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. COO+CTO joint OR external commercial authority are the outcome authorities. MITHQAL only records + applies retention.",
  },
];

// --- 4.6 BANK_VS_BANK_OPERATIONAL_DISPUTE ---
const BANK_VS_BANK_OPERATIONAL_DISPUTE_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Operational disagreement between two bank counterparties — failed message, mismatched account, missed SLA, misdirected funds, sequence disagreement.",
      "Open a bank-vs-bank-operational-dispute record with both counterparties + the operational issue.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the dispute to the COO escalation owner and writes an EvidencePackage stub referencing both counterparties + the operational issue.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT take sides. The COO is the singular initial-triage authority. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Freeze the affected instructions (do not execute) until both counterparty operations leads concur on resolution.",
      "Preserve the disputed message / account / SLA record / fund-flow record.",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the freeze orders issued by the COO and preserves the disputed evidence as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2 (both counterparties are Domain C — never see each other's data).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to freeze. The COO is the singular freeze-decision authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "CTO (Jozour, LLC)",
    actions: [
      "Capture the disputed message + message-routing logs from both counterparties.",
      "Capture the relevant ledger entries + finality states (per N1) for both counterparties.",
      "Capture the operational SLA + counterparty assertions.",
      "Compute SHA-256 commitment + TSA stamp.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves both-counterparty evidence with cross-domain isolation.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT alter or interpret the disputed messages. MITHQAL only preserves + commits with cross-domain isolation.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Notify both counterparty operations leads of the dispute + freeze + evidence references.",
      "Notify auditor (bank-vs-bank disputes are auditor-relevant).",
      "Notify GC where the dispute has commercial implications.",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates per-counterparty notification payloads (with cross-domain isolation — no bank sees the other's payload) + tracks delivery receipts + provides the structured notification template per W1 INCIDENT_NOTIFICATION section.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify. COO is the notification authority. MITHQAL only generates + tracks (with cross-domain isolation).",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "COO (Jozour, LLC) + both counterparty operations leads",
    actions: [
      "Investigate the operational issue — message-routing analysis, account-mapping analysis, SLA-timing analysis, fund-flow analysis.",
      "Determine scope — what transactions are affected for each counterparty.",
      "Document resolution options — re-issue, cancel, partial-execution, escalate to SETTLEMENT_INSTRUCTION_DISPUTE or LEGAL_DISPUTE if the matter is commercial rather than operational.",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages for the investigation (with cross-domain isolation). MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT determine root cause or take sides. COO + both counterparty operations leads are the investigation authorities. MITHQAL only serves evidence (with cross-domain isolation).",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "COO (Jozour, LLC) + both counterparty operations leads joint",
    actions: [
      "Apply correction ONLY where the affected instructions are not yet final (per N1).",
      "Where the affected instructions are final, apply compensating transaction with both counterparty operations leads' concurrence.",
      "Document the correction as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the compensating transaction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct. COO + both counterparty operations leads joint is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Escalate to GC + external commercial counsel where the dispute cannot be resolved at the operations-lead level.",
      "Reclassify to SETTLEMENT_INSTRUCTION_DISPUTE or LEGAL_DISPUTE if the matter is commercial rather than operational.",
      "Escalate to regulator where the dispute crosses a regulatory-notification threshold.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle (with cross-domain isolation) + routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to reclassify. COO is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "Both counterparty operations leads + COO (Jozour, LLC) concurrence",
    actions: [
      "Both counterparty operations leads + COO concurrence approve the operational resolution.",
      "Where the matter is reclassified to SETTLEMENT_INSTRUCTION_DISPUTE: route to that dispute's resolution authority.",
      "Where the matter is reclassified to LEGAL_DISPUTE: route to court.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with both counterparty concurrence + COO concurrence evidence) as a new EvidencePackage and links it to the original dispute record (with cross-domain isolation).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority. Both counterparty operations leads + COO concurrence are the resolution authorities. MITHQAL coordinates evidence + workflow ONLY (with cross-domain isolation). MITHQAL is NOT an arbitrator.",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "COO (Jozour, LLC)",
    actions: [
      "Record the final outcome — operational resolution, compensating transaction, regulatory filings, lessons learned.",
      "Link the final record to the original dispute EvidencePackage (immutable per X1).",
      "Retain the final record per X1 LEGAL_OBLIGATION_DATA retention rules (indefinite).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating dispute. MITHQAL applies the retention policy.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. Both counterparty operations leads + COO concurrence are the outcome authorities. MITHQAL only records + applies retention.",
  },
];

// --- 4.7 LEGAL_DISPUTE ---
const LEGAL_DISPUTE_LIFECYCLE: LifecycleStage[] = [
  {
    stageId: "DETECTION",
    name: "Detection",
    owner: "COO (Jozour, LLC) + GC (external counsel)",
    actions: [
      "Detection source: service of process, regulator notice, counterparty demand letter, auditor finding triggering legal-privilege review.",
      "Open a legal-dispute record with the dispute parties + the legal claim + the source document.",
      "Engage GC immediately upon detection.",
    ],
    mithqalCoordinationRole:
      "MITHQAL surfaces the legal-dispute event to the COO + GC escalation owners and writes an EvidencePackage stub referencing the dispute + source document.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT take a legal position. COO + GC are the singular initial-triage authorities. MITHQAL only surfaces + records.",
  },
  {
    stageId: "FREEZE_SAFE_HANDLING",
    name: "Freeze / Safe Handling",
    owner: "COO (Jozour, LLC) + GC joint",
    actions: [
      "Issue a litigation hold (per X1 LEGAL_HOLDS dimension) — overrides all routine deletion/retention-expiry on relevant data.",
      "Preserve all relevant data: ledger entries, log chains, attestation snapshots, contract execution records, communications.",
      "Restrict access to the legal-hold data to litigation-need-to-know (Domain B extended to outside counsel).",
    ],
    mithqalCoordinationRole:
      "MITHQAL executes the litigation-hold orders issued by COO+GC joint authority and preserves the legal-hold data as EvidencePackages. MITHQAL coordinates cross-domain isolation per M2 (extended to outside counsel where applicable).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide what to hold. COO+GC joint is the litigation-hold authority. MITHQAL only executes.",
  },
  {
    stageId: "EVIDENCE_CAPTURE",
    name: "Evidence Capture",
    owner: "GC (external counsel) + CTO (Jozour, LLC)",
    actions: [
      "Capture all evidence relevant to the legal claim — with chain-of-custody per N2 Evidence Fabric.",
      "Capture all relevant ledger entries + log chains + attestation snapshots + contract execution records.",
      "Capture all relevant communications (subject to legal-privilege review by GC).",
      "Compute SHA-256 commitment + TSA stamp at every evidence ingestion.",
    ],
    mithqalCoordinationRole:
      "MITHQAL ingests the Evidence Fabric inputs and computes the SHA-256 commitment + Merkle-root inclusion proof. MITHQAL requests the TSA stamp. MITHQAL preserves the chain-of-custody per N2.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT alter or interpret the evidence. MITHQAL does NOT apply legal privilege. GC is the privilege authority. MITHQAL only preserves + commits.",
  },
  {
    stageId: "NOTIFICATION",
    name: "Notification",
    owner: "GC (external counsel)",
    actions: [
      "Notify the disputing party per the executed contract's notice provisions (per W1 INCIDENT_NOTIFICATION + GOVERNING_LAW sections).",
      "Notify insurer where the claim implicates a policy (per W2 INS-DO-001 / INS-CYBER-001 / INS-CRIME-001 — currently DESIGNED, no policy active).",
      "Notify auditor where the dispute affects audit-trail events.",
      "Notify regulator where the dispute crosses a regulatory-notification threshold (per GC direction).",
    ],
    mithqalCoordinationRole:
      "MITHQAL generates the notification payload (with GC-approved scope) + tracks delivery receipts + provides the structured notification template per W1.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide who to notify. GC is the notification authority for legal disputes. MITHQAL only generates + tracks.",
  },
  {
    stageId: "INVESTIGATION",
    name: "Investigation",
    owner: "GC (external counsel) + outside counsel (where engaged)",
    actions: [
      "Investigate the legal claim — review evidence, develop legal strategy, assess exposure.",
      "Determine scope — what transactions, contracts, parties are affected.",
      "Document resolution options — defend, settle, arbitrate, litigate.",
      "Engage outside counsel where the matter requires specialization (per W2 enterprise risk register LEGAL risk).",
    ],
    mithqalCoordinationRole:
      "MITHQAL provides the Evidence Fabric query interface to retrieve all relevant EvidencePackages + log chains + ledger snapshots for the legal investigation (with chain-of-custody). MITHQAL maintains the investigation timeline.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT develop legal strategy or assess exposure. GC + outside counsel are the investigation authorities. MITHQAL only serves evidence (with chain-of-custody).",
  },
  {
    stageId: "CORRECTION_ROLLBACK",
    name: "Correction / Rollback (where legally permitted)",
    owner: "GC (external counsel) + COO (Jozour, LLC) joint",
    actions: [
      "Apply correction ONLY where GC concurs AND the matter permits correction without prejudice to the legal position.",
      "Where the matter is in active litigation, NO correction without court order or party agreement.",
      "Where correction is permitted, document as a new ledger entry referencing the original (per X1 LEDGER_DATA immutability).",
    ],
    mithqalCoordinationRole:
      "MITHQAL coordinates the correction entry — writes the new ledger entry referencing the original, computes the new SHA-256 commitment, requests TSA stamp. MITHQAL coordinates the correction through the canonical finality model.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to correct. GC + COO joint (with court order or party agreement where applicable) is the correction authority. MITHQAL does NOT determine if a state is final — N1 canonical finality is the deterministic authority.",
  },
  {
    stageId: "ESCALATION",
    name: "Escalation",
    owner: "GC (external counsel)",
    actions: [
      "Escalate to outside counsel (litigation / arbitration specialist).",
      "Escalate to insurer (per W2 INS-DO-001 / INS-CYBER-001 / INS-CRIME-001 — currently DESIGNED).",
      "Escalate to regulator where the dispute triggers regulatory disclosure.",
    ],
    mithqalCoordinationRole:
      "MITHQAL packages the escalation bundle (with chain-of-custody + GC-approved scope) + routes the escalation to the declared escalation owner.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide whether to escalate. GC is the escalation initiator. MITHQAL only packages + routes.",
  },
  {
    stageId: "RESOLUTION_AUTHORITY",
    name: "Resolution Authority",
    owner: "External court OR external arbitrator OR external regulator — NEVER MITHQAL",
    actions: [
      "Courts are the resolution authority for litigation.",
      "Arbitrators are the resolution authority for arbitration (per W1 DISPUTE_ESCALATION section).",
      "Regulators are the resolution authority for regulatory enforcement actions.",
      "MITHQAL is NOT a party to the legal resolution.",
    ],
    mithqalCoordinationRole:
      "MITHQAL records the resolution decision (with external-authority citation + concurrence evidence) as a new EvidencePackage and links it to the original legal-dispute record (with chain-of-custody per N2).",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL is NOT the resolution authority for legal disputes. External courts / arbitrators / regulators are the resolution authorities. MITHQAL coordinates evidence + workflow ONLY. MITHQAL is NOT a court, NOT an arbitrator, NOT a commercial dispute adjudicator (per MITHQAL_COORDINATION_RULE).",
  },
  {
    stageId: "FINAL_RECORD",
    name: "Final Record",
    owner: "COO (Jozour, LLC) + GC (external counsel)",
    actions: [
      "Record the final outcome — judgment / award / settlement / regulatory order / dismissal, plus any compensating transactions, regulatory filings, lessons learned.",
      "Link the final record to the original legal-dispute EvidencePackage (immutable per X1).",
      "Retain the final record per X1 LEGAL_OBLIGATION_DATA retention rules (indefinite — legal-dispute records outlive any contract).",
      "Release the litigation hold ONLY after the matter is fully closed + GC concurs (per X1 LEGAL_HOLDS dimension).",
    ],
    mithqalCoordinationRole:
      "MITHQAL writes the final record as a SHA-256-committed EvidencePackage and links it to the originating legal dispute. MITHQAL applies the retention policy. MITHQAL releases the litigation hold on GC concurrence.",
    mithqalNonAdjudicatorBoundary:
      "MITHQAL does NOT decide the final outcome. External court / arbitrator / regulator are the outcome authorities. MITHQAL only records + applies retention + releases hold (on GC concurrence).",
  },
];

// ============================================================================
// PART 5: The assembled 7 dispute types with full 9-stage lifecycle each
// ============================================================================

export const DISPUTE_FRAMEWORK: DisputeTypeSpec[] = [
  {
    typeId: "TECHNICAL_INCIDENT",
    name: "Technical Incident",
    description: DISPUTE_TYPES[0].description,
    lifecycleStages: TECHNICAL_INCIDENT_LIFECYCLE,
    escalationAuthority: "CTO (Jozour, LLC) -> COO + GC (where commercial/legal implications) -> regulator (where regulatory-notification threshold crossed)",
    resolutionAuthority:
      "COO (Jozour, LLC) + CTO (Jozour, LLC) joint (internal); regulator concurrence where regulator is engaged. NOT MITHQAL.",
    honestNote:
      "Technical-incident lifecycle is fully designed. No technical incident has occurred (no production deployment yet per v25.3.7 M1). Resolution authority is internal joint (COO+CTO) — NOT MITHQAL.",
  },
  {
    typeId: "RECONCILIATION_EXCEPTION",
    name: "Reconciliation Exception",
    description: DISPUTE_TYPES[1].description,
    lifecycleStages: RECONCILIATION_EXCEPTION_LIFECYCLE,
    escalationAuthority: "CTO (Jozour, LLC) -> COO + GC (where commercial/legal implications) -> bank counterparty operations lead (where bank-side data is implicated) -> regulator (where regulatory-notification threshold crossed)",
    resolutionAuthority:
      "COO (Jozour, LLC) + CTO (Jozour, LLC) joint (internal); bank-counterparty operations-lead concurrence where bank-side implicated; regulator concurrence where regulator engaged. NOT MITHQAL.",
    honestNote:
      "Reconciliation-exception lifecycle is fully designed. The O2 tolerance bands (frozen per Architecture Freeze v25.3.15) are the deterministic detection authority. No reconciliation exception has occurred (no production reconciliation runs yet).",
  },
  {
    typeId: "SETTLEMENT_INSTRUCTION_DISPUTE",
    name: "Settlement Instruction Dispute",
    description: DISPUTE_TYPES[2].description,
    lifecycleStages: SETTLEMENT_INSTRUCTION_DISPUTE_LIFECYCLE,
    escalationAuthority: "COO (Jozour, LLC) -> GC + external commercial counsel -> bank counterparty commercial lead -> regulator (where regulatory-notification threshold crossed)",
    resolutionAuthority:
      "External commercial resolution authority per executed bank contract's DISPUTE_ESCALATION section (mediation -> arbitration -> courts). Where no contract executed (current honest state — 0 SIGNED per W1), matter defaults to LEGAL_DISPUTE and routes to a court. NOT MITHQAL.",
    honestNote:
      "Settlement-instruction-dispute lifecycle is fully designed. NO bank contract is currently SIGNED (per W1 honest state), so the commercial-resolution path does not exist yet — any such dispute in current state would default to LEGAL_DISPUTE and route to a court.",
  },
  {
    typeId: "UNAUTHORIZED_TRANSACTION",
    name: "Unauthorized Transaction",
    description: DISPUTE_TYPES[3].description,
    lifecycleStages: UNAUTHORIZED_TRANSACTION_LIFECYCLE,
    escalationAuthority: "CTO + COO joint -> GC + external counsel -> insurer (per W2 INS-CRIME-001 — currently DESIGNED, no active policy) -> law enforcement (where crime suspected) -> regulator (SAR/CTR threshold)",
    resolutionAuthority:
      "External law enforcement + courts (where crime confirmed); COO+CTO joint (where process failure only); insurer claim adjuster (for the insurance claim only — not the underlying incident). NOT MITHQAL.",
    honestNote:
      "Unauthorized-transaction lifecycle is fully designed. NO unauthorized transaction has occurred (no production deployment). NO crime/fidelity policy is ACTIVE (per W2 INS-CRIME-001 — DESIGNED).",
  },
  {
    typeId: "DUPLICATE_TRANSACTION",
    name: "Duplicate Transaction",
    description: DISPUTE_TYPES[4].description,
    lifecycleStages: DUPLICATE_TRANSACTION_LIFECYCLE,
    escalationAuthority: "CTO -> COO + CTO joint -> bank counterparty operations lead (where cross-counterparty) -> UNAUTHORIZED_TRANSACTION reclassification (if intent malicious) -> regulator (where threshold crossed)",
    resolutionAuthority:
      "COO (Jozour, LLC) + CTO (Jozour, LLC) joint (internal) for unintentional duplicates; external commercial authority per W1 DISPUTE_ESCALATION section for cross-counterparty disputes; UNAUTHORIZED_TRANSACTION resolution authority if reclassified. NOT MITHQAL.",
    honestNote:
      "Duplicate-transaction lifecycle is fully designed. NO duplicate transaction has occurred (no production deployment). Duplicate-detection rules are designed, not yet in production.",
  },
  {
    typeId: "BANK_VS_BANK_OPERATIONAL_DISPUTE",
    name: "Bank-vs-Bank Operational Dispute",
    description: DISPUTE_TYPES[5].description,
    lifecycleStages: BANK_VS_BANK_OPERATIONAL_DISPUTE_LIFECYCLE,
    escalationAuthority: "COO -> GC + external commercial counsel (where escalation needed) -> SETTLEMENT_INSTRUCTION_DISPUTE or LEGAL_DISPUTE reclassification -> regulator (where threshold crossed)",
    resolutionAuthority:
      "Both counterparty operations leads + COO concurrence (operational); external commercial authority per W1 DISPUTE_ESCALATION section (if reclassified to SETTLEMENT_INSTRUCTION_DISPUTE); external court (if reclassified to LEGAL_DISPUTE). NOT MITHQAL — MITHQAL is NOT an arbitrator.",
    honestNote:
      "Bank-vs-bank-operational-dispute lifecycle is fully designed. NO bank-vs-bank operational dispute has occurred (no banks onboarded yet per W1 — 0 SIGNED). Cross-domain isolation is mandatory — no bank sees the other's evidence.",
  },
  {
    typeId: "LEGAL_DISPUTE",
    name: "Legal Dispute",
    description: DISPUTE_TYPES[6].description,
    lifecycleStages: LEGAL_DISPUTE_LIFECYCLE,
    escalationAuthority: "COO + GC joint -> outside counsel (litigation/arbitration specialist) -> insurer (per W2 INS-DO-001/INS-CYBER-001/INS-CRIME-001 — currently DESIGNED, no active policy) -> regulator (where disclosure required)",
    resolutionAuthority:
      "External court (for litigation); external arbitrator (for arbitration per W1 DISPUTE_ESCALATION section); external regulator (for regulatory enforcement actions). NEVER MITHQAL. MITHQAL coordinates evidence + workflow ONLY — is NOT a court, NOT an arbitrator, NOT a commercial dispute adjudicator (per MITHQAL_COORDINATION_RULE).",
    honestNote:
      "Legal-dispute lifecycle is fully designed. NO legal dispute has occurred. NO General Counsel is engaged (per W1 PENDING_ENTITY_IDENTITY). NO insurance policy is ACTIVE (per W2 — all DESIGNED). Litigation-hold mechanism is designed but untested.",
  },
];

// ============================================================================
// PART 6: The MITHQAL_COORDINATION_RULE — the critical directive rule
// ============================================================================

export const MITHQAL_COORDINATION_RULE = {
  rule: "Per PROMPT 33: 'MITHQAL must coordinate evidence and workflow but must NOT present itself as an arbitrator, court or commercial dispute adjudicator.'",
  description:
    "MITHQAL's role in every dispute/exception lifecycle is COORDINATION — capturing evidence, preserving chain-of-custody per N2 Evidence Fabric, generating notifications, packaging escalation bundles, recording resolution decisions, and applying retention policies. MITHQAL is NEVER the resolution authority. MITHQAL is NOT an arbitrator, NOT a court, NOT a commercial dispute adjudicator. Resolution authority for every dispute type is an external party (internal COO+CTO joint for technical/reconciliation; external commercial authority for settlement/bank-vs-bank; external law enforcement + courts for unauthorized/criminal; external court/arbitrator/regulator for legal).",
  whatMithqalIs: [
    "Evidence coordinator — captures + commits + preserves evidence per N2 Evidence Fabric.",
    "Workflow coordinator — executes freeze orders, generates notifications, packages escalation bundles.",
    "Record keeper — writes final records as SHA-256-committed EvidencePackages + applies retention policies.",
    "Cross-domain isolator — enforces M2 trust-domain isolation (no bank sees another bank's evidence).",
    "Chain-of-custody preserver — maintains investigation timeline + audit trail.",
  ] as const,
  whatMithqalIsNot: [
    "NOT an arbitrator — MITHQAL does NOT arbitrate commercial disputes between bank counterparties.",
    "NOT a court — MITHQAL does NOT adjudicate legal disputes.",
    "NOT a commercial dispute adjudicator — MITHQAL does NOT decide the merits of any commercial claim.",
    "NOT the resolution authority — MITHQAL NEVER appears as the resolutionAuthority on any dispute type.",
    "NOT a triage authority — MITHQAL does NOT decide severity or prioritization (CTO does for technical; COO does for commercial).",
    "NOT an investigation authority — MITHQAL does NOT determine root cause (CTO + GC + external forensic vendor do).",
    "NOT a correction authority — MITHQAL does NOT decide whether to correct (COO+CTO+GC joint does, with court order where applicable).",
    "NOT a notification authority — MITHQAL does NOT decide who to notify (COO + GC do).",
  ] as const,
  currentHonestState:
    "ALL 7 dispute types have resolution authority != MITHQAL. ZERO dispute types have MITHQAL as the resolution authority. ALL 7 × 9 = 63 lifecycle stages have a mithqalCoordinationRole + mithqalNonAdjudicatorBoundary field explicitly separating what MITHQAL DOES from what MITHQAL must NOT do. No dispute has occurred under this framework yet (no production deployment per v25.3.7 M1).",
  notLegalOpinion:
    "This framework is a DISPUTE & EXCEPTION LIFECYCLE specification, NOT a legal opinion. The identification of courts / arbitrators / regulators as resolution authorities is a structural designation of WHO has authority, NOT a legal opinion on the merits of any particular dispute. Legal opinions are obtained from qualified external counsel (per V1 — no assumption of legal rights without contract).",
};

// ============================================================================
// PART 7: Helpers + status exports
// ============================================================================

export function getDisputeType(
  typeId: DisputeTypeId,
): DisputeTypeSpec | undefined {
  return DISPUTE_FRAMEWORK.find((d) => d.typeId === typeId);
}

export function getDisputeStage(
  typeId: DisputeTypeId,
  stageId: LifecycleStageId,
): LifecycleStage | undefined {
  const disputeType = getDisputeType(typeId);
  if (!disputeType) return undefined;
  return disputeType.lifecycleStages.find((s) => s.stageId === stageId);
}

export function getDisputesByResolutionAuthority(
  authoritySubstring: string,
): DisputeTypeSpec[] {
  return DISPUTE_FRAMEWORK.filter((d) =>
    d.resolutionAuthority.includes(authoritySubstring),
  );
}

export const DISPUTE_FRAMEWORK_STATUS = "ACTIVE";
export const DISPUTE_FRAMEWORK_VERSION = "v25.3.19-X1-1.0";
export const DISPUTE_FRAMEWORK_SOURCE =
  "src/lib/dispute-exception-framework.ts";
export const DISPUTE_TYPE_COUNT = 7;
export const LIFECYCLE_STAGE_COUNT = 9; // exactly the 9 stages enumerated in the directive verbatim
export const DISPUTE_LIFECYCLE_CELL_COUNT = 63; // 7 × 9

// === Field-name catalog (9 lifecycle stages, per directive's literal list) ===
export const LIFECYCLE_STAGE_FIELDS: readonly string[] = [
  "detection",
  "freezeSafeHandling",
  "evidenceCapture",
  "notification",
  "investigation",
  "correctionRollback",
  "escalation",
  "resolutionAuthority",
  "finalRecord",
] as const;

// === Dispute-type-name catalog (7 types, per directive) ===
export const DISPUTE_TYPE_FIELDS: readonly string[] = [
  "technicalIncident",
  "reconciliationException",
  "settlementInstructionDispute",
  "unauthorizedTransaction",
  "duplicateTransaction",
  "bankVsBankOperationalDispute",
  "legalDispute",
] as const;
