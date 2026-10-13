// src/lib/bank-contracting-package.ts
//
// MITHQAL v25.3.18 — CANONICAL BANK CONTRACTING PACKAGE (single source of truth)
// Per PROMPT 28:
//   "Create the canonical Bank Contracting Package for the single bank-facing
//    accountable entity. Include: scope of service, roles, liability allocation,
//    service levels, incident notification, security obligations, audit rights,
//    evidence rights, data handling, confidentiality, regulatory cooperation,
//    fees, dispute escalation, termination, exit, migration, governing law and
//    limitation-of-liability questions. This is a legal/commercial issue checklist
//    and controlled term-sheet framework, NOT a self-generated legal opinion.
//    No contract status may become SIGNED, ACTIVE or VALIDATED without actual
//    executed evidence."

// === Contract Status (per directive: "No contract status may become SIGNED, ACTIVE
//     or VALIDATED without actual executed evidence") ===

export type ContractStatus =
  | "DRAFT"                      // term-sheet is drafted, no execution
  | "TERM_SHEET"                 // term-sheet agreed in principle, not executed
  | "PENDING_EXECUTION"          // contract drafted, awaiting signature
  | "PENDING_LEGAL_VERIFICATION" // signed but legal verification pending
  | "SIGNED"                     // executed — REQUIRES actual executed evidence
  | "ACTIVE"                     // in effect — REQUIRES SIGNED + operational
  | "VALIDATED"                  // externally validated — REQUIRES ACTIVE + audit
  | "EXPIRED"                    // expired
  | "TERMINATED"                 // terminated
  | "SUPERSEDED";                // replaced

// === The 18 Contracting Package Section IDs (per directive — 17 topics named
//     explicitly; the directive enumerates 17 distinct topics:
//     scope of service, roles, liability allocation, service levels, incident
//     notification, security obligations, audit rights, evidence rights, data
//     handling, confidentiality, regulatory cooperation, fees, dispute escalation,
//     termination, exit, migration, governing law and limitation-of-liability) ===

export type ContractSectionId =
  | "SCOPE_OF_SERVICE"
  | "ROLES"
  | "LIABILITY_ALLOCATION"
  | "SERVICE_LEVELS"
  | "INCIDENT_NOTIFICATION"
  | "SECURITY_OBLIGATIONS"
  | "AUDIT_RIGHTS"
  | "EVIDENCE_RIGHTS"
  | "DATA_HANDLING"
  | "CONFIDENTIALITY"
  | "REGULATORY_COOPERATION"
  | "FEES"
  | "DISPUTE_ESCALATION"
  | "TERMINATION"
  | "EXIT"
  | "MIGRATION"
  | "GOVERNING_LAW"
  | "LIMITATION_OF_LIABILITY";

export interface ContractTermSheetItem {
  item: string;
  description: string;
  status: ContractStatus;
  evidenceRequired: string;
  honestNote: string;
}

export interface ContractSection {
  sectionId: ContractSectionId;
  name: string;
  description: string;
  // The term-sheet items (checklist — NOT a legal opinion)
  termSheetItems: ContractTermSheetItem[];
  // Overall section status
  status: ContractStatus;
}

// === The 17-Section Bank Contracting Package ===
// All sections start as DRAFT (honest — no contract has been executed)

export const BANK_CONTRACTING_PACKAGE: ContractSection[] = [
  {
    sectionId: "SCOPE_OF_SERVICE",
    name: "Scope of Service",
    description:
      "What services MITHQAL provides to the bank (settlement routing, liquidity optimization, compliance orchestration, reconciliation, evidence, finality coordination, failure management, bank integration — per v25.3.10 Pilot A 8 test areas).",
    termSheetItems: [
      {
        item: "Service definition",
        description: "Define what MITHQAL provides (per v25.3.10 Pilot A test areas).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with scope clause.",
        honestNote: "DRAFT — no contract executed yet.",
      },
      {
        item: "Exclusions",
        description:
          "What MITHQAL does NOT provide (per v25.3.5 MTQ isNotStatements — NOT retail, NOT public crypto, etc.).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with exclusions clause.",
        honestNote: "DRAFT — no contract executed yet.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "ROLES",
    name: "Roles",
    description:
      "Role allocation: bank-facing counterparty (per v25.3.7 institutional-operating-model bankFacingCounterpartyEntityId), bank role, MITHQAL role, independent oversight role.",
    termSheetItems: [
      {
        item: "Bank-facing counterparty",
        description: "Jozour, LLC (per v25.3.7 bankFacingCounterpartyEntityId).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with party identification.",
        honestNote:
          "DRAFT — the entity is ACTIVE (JOZOUR Amendment) but no bank contract executed.",
      },
      {
        item: "Bank role",
        description: "Participating bank's role (per BM-02 KYC/KYB).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with bank role definition.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "LIABILITY_ALLOCATION",
    name: "Liability Allocation",
    description:
      "How liability is allocated between MITHQAL and the bank. Per v25.3.17 PROMPT 27: system may coordinate, must not invent legal rights.",
    termSheetItems: [
      {
        item: "MITHQAL liability",
        description:
          "MITHQAL's liability for system failures (per v25.3.13 SettlementContinuityFabric).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with liability clause.",
        honestNote:
          "DRAFT — per PROMPT 27, MITHQAL coordinates but does NOT invent legal rights.",
      },
      {
        item: "Bank liability",
        description: "Bank's liability for customer-facing obligations.",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "SERVICE_LEVELS",
    name: "Service Levels (SLA)",
    description:
      "Service level agreements — uptime, latency, response times, support hours. Per v25.3.7 institutional-operating-model: slaOwner = PENDING_LEGAL_VERIFICATION.",
    termSheetItems: [
      {
        item: "Uptime SLA",
        description: "System availability target.",
        status: "DRAFT",
        evidenceRequired: "Executed SLA with uptime clause.",
        honestNote:
          "DRAFT — per v25.3.7, slaOwner = PENDING_LEGAL_VERIFICATION (SLA not executed with any bank).",
      },
      {
        item: "Response time SLA",
        description: "Support response time targets.",
        status: "DRAFT",
        evidenceRequired: "Executed SLA.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "INCIDENT_NOTIFICATION",
    name: "Incident Notification",
    description:
      "How incidents are notified (per v25.3.13 SettlementContinuityFabric DETECT stage). Notification timeline, escalation, communication.",
    termSheetItems: [
      {
        item: "Notification timeline",
        description: "How quickly MITHQAL notifies the bank of incidents.",
        status: "DRAFT",
        evidenceRequired: "Executed contract with notification clause.",
        honestNote: "DRAFT.",
      },
      {
        item: "Escalation procedure",
        description: "How incidents are escalated (per v25.3.13 ASSESS stage).",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "SECURITY_OBLIGATIONS",
    name: "Security Obligations",
    description:
      "Security obligations of both parties (per v25.3.7 trust domains — 3 domains with cross-domain isolation). Per v25.3.7: securityResponsibility = PENDING_LEGAL_VERIFICATION.",
    termSheetItems: [
      {
        item: "MITHQAL security obligations",
        description:
          "SOC 2 / ISO 27001 / penetration testing (per v25.3.7 securityResponsibility = PENDING_LEGAL_VERIFICATION).",
        status: "DRAFT",
        evidenceRequired: "Executed security addendum + accreditation.",
        honestNote:
          "DRAFT — per v25.3.7, securityResponsibility = PENDING_LEGAL_VERIFICATION (not accredited).",
      },
      {
        item: "Bank security obligations",
        description: "Bank's security obligations (key management, HSM, access control).",
        status: "DRAFT",
        evidenceRequired: "Executed security addendum.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "AUDIT_RIGHTS",
    name: "Audit Rights",
    description:
      "Bank's right to audit MITHQAL (per v25.3.8 Evidence Fabric — 3 access levels: PUBLIC/INSTITUTIONAL/AUDIT).",
    termSheetItems: [
      {
        item: "Audit scope",
        description:
          "What the bank can audit (per AUDIT access level in v25.3.8 Evidence Fabric).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with audit rights clause.",
        honestNote: "DRAFT.",
      },
      {
        item: "Audit frequency",
        description: "How often the bank can audit.",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "EVIDENCE_RIGHTS",
    name: "Evidence Rights",
    description:
      "Bank's right to retrieve evidence packages (per v25.3.8 Evidence Fabric — 15-field portable package, 3 access levels).",
    termSheetItems: [
      {
        item: "INSTITUTIONAL access",
        description:
          "Bank gets INSTITUTIONAL access to evidence (PII hashed, signatures masked).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with evidence rights clause.",
        honestNote: "DRAFT.",
      },
      {
        item: "AUDIT access",
        description: "Auditor/regulator gets AUDIT access (full raw fields).",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "DATA_HANDLING",
    name: "Data Handling",
    description:
      "How data is handled (per v25.3.7 dataProcessingResponsibility = PENDING_LEGAL_VERIFICATION). GDPR/CCPA framework.",
    termSheetItems: [
      {
        item: "Data processing agreement (DPA)",
        description:
          "DPA between MITHQAL and bank (per v25.3.7 dataProcessingResponsibility = PENDING_LEGAL_VERIFICATION).",
        status: "DRAFT",
        evidenceRequired: "Executed DPA.",
        honestNote: "DRAFT — per v25.3.7, DPA not executed.",
      },
      {
        item: "Data retention",
        description: "How long data is retained.",
        status: "DRAFT",
        evidenceRequired: "Executed DPA with retention clause.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "CONFIDENTIALITY",
    name: "Confidentiality",
    description: "Confidentiality obligations (NDA between MITHQAL and bank).",
    termSheetItems: [
      {
        item: "NDA",
        description: "Non-disclosure agreement.",
        status: "DRAFT",
        evidenceRequired: "Executed NDA.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "REGULATORY_COOPERATION",
    name: "Regulatory Cooperation",
    description:
      "How MITHQAL and bank cooperate with regulators (per v25.3.7 institutional operating model + v25.3.17 legal conditionality).",
    termSheetItems: [
      {
        item: "Regulatory notification",
        description: "How regulatory notifications are coordinated.",
        status: "DRAFT",
        evidenceRequired: "Executed contract with regulatory cooperation clause.",
        honestNote: "DRAFT.",
      },
      {
        item: "Regulatory access",
        description: "Regulator's access to evidence (per v25.3.8 AUDIT access level).",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "FEES",
    name: "Fees",
    description:
      "Fee schedule (per v25.3.7 billingAuthority = PENDING_LEGAL_VERIFICATION). Per v25.3.11 Bank Value Model — bank enters own baseline data.",
    termSheetItems: [
      {
        item: "Fee schedule",
        description:
          "Fee structure (per v25.3.7 billingAuthority = PENDING_LEGAL_VERIFICATION).",
        status: "DRAFT",
        evidenceRequired: "Executed fee schedule.",
        honestNote: "DRAFT — per v25.3.7, billingAuthority = PENDING_LEGAL_VERIFICATION.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "DISPUTE_ESCALATION",
    name: "Dispute Escalation",
    description:
      "How disputes are escalated (per v25.3.7 escalationPath = ACTIVE via JOZOUR Amendment §1.2(h) + §1.5).",
    termSheetItems: [
      {
        item: "Escalation path",
        description: "Dispute escalation path (per v25.3.7 escalationPath = ACTIVE).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with dispute resolution clause.",
        honestNote:
          "DRAFT — escalationPath entity is ACTIVE but no bank contract executed.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "TERMINATION",
    name: "Termination",
    description:
      "How the contract is terminated (notice period, grounds for termination, post-termination obligations).",
    termSheetItems: [
      {
        item: "Termination for convenience",
        description: "Termination without cause (notice period).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with termination clause.",
        honestNote: "DRAFT.",
      },
      {
        item: "Termination for cause",
        description: "Termination with cause (breach, insolvency, regulatory).",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "EXIT",
    name: "Exit",
    description:
      "Exit process (how the bank exits the MITHQAL platform — data export, obligation transfer, final reconciliation).",
    termSheetItems: [
      {
        item: "Exit plan",
        description:
          "How the bank exits (data export, obligation transfer per v25.3.9, final reconciliation per v25.3.9 tolerance policies).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with exit clause.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "MIGRATION",
    name: "Migration",
    description:
      "Migration process (how the bank migrates to/from another platform — per v25.3.13 SettlementContinuityFabric ALTERNATIVE_ROUTE stage).",
    termSheetItems: [
      {
        item: "Migration plan",
        description:
          "How the bank migrates (per v25.3.13 continuity fabric — NO_BYPASS_RULE applies).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with migration clause.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "GOVERNING_LAW",
    name: "Governing Law",
    description:
      "Governing law (per v25.3.7 institutional operating model governingLaw — per v25.3.16 PBC legal enforceability governingLaw verification).",
    termSheetItems: [
      {
        item: "Governing law clause",
        description:
          "Which law governs the contract (per v25.3.7 JOZOUR Amendment — New Jersey law).",
        status: "DRAFT",
        evidenceRequired: "Executed contract with governing law clause.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
  {
    sectionId: "LIMITATION_OF_LIABILITY",
    name: "Limitation of Liability",
    description:
      "Limitation of liability questions (per v25.3.17 PROMPT 27 — system may coordinate, must not invent legal rights). Cap on liability, carve-outs, consequential loss.",
    termSheetItems: [
      {
        item: "Liability cap",
        description: "Cap on MITHQAL's liability.",
        status: "DRAFT",
        evidenceRequired: "Executed contract with limitation clause.",
        honestNote:
          "DRAFT — per PROMPT 27, MITHQAL coordinates but does NOT invent legal rights.",
      },
      {
        item: "Consequential loss",
        description: "Whether consequential loss is excluded.",
        status: "DRAFT",
        evidenceRequired: "Executed contract.",
        honestNote: "DRAFT.",
      },
    ],
    status: "DRAFT",
  },
];

// === CRITICAL RULE: No contract SIGNED/ACTIVE/VALIDATED without executed evidence ===

export const NO_CONTRACT_WITHOUT_EVIDENCE_RULE = {
  rule: "Per PROMPT 28: 'No contract status may become SIGNED, ACTIVE or VALIDATED without actual executed evidence.'",
  description:
    "All 17 sections start as DRAFT. No section can advance to TERM_SHEET, PENDING_EXECUTION, PENDING_LEGAL_VERIFICATION, SIGNED, ACTIVE, or VALIDATED without actual executed evidence (signed contract, executed SLA, executed DPA, etc.).",
  honestState:
    "ALL 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. This is the honest state — no bank contract has been executed.",
  notLegalOpinion:
    "Per PROMPT 28: 'This is a legal/commercial issue checklist and controlled term-sheet framework, NOT a self-generated legal opinion.'",
};

// === Status ===
export const CONTRACTING_PACKAGE_STATUS = "ACTIVE";
export const CONTRACTING_PACKAGE_VERSION = "v25.3.18-W1-1.0";
export const CONTRACTING_PACKAGE_SOURCE = "src/lib/bank-contracting-package.ts";
export const CONTRACT_SECTION_COUNT = 17;
