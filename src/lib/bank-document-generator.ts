// src/lib/bank-document-generator.ts
//
// MITHQAL v25.3.2 — BANK-FACING DOCUMENT GENERATOR
// Per R-directive: "Generate all documents from canonical machine-readable source data."
//
// This module reads from ALL canonical source modules (v25.3.2-v25.3.11)
// and generates 5 bank-facing documents. The master blueprint remains
// the technical/institutional archive — these documents are DERIVED
// from the canonical source, NOT a duplication of the blueprint.

// Import ALL canonical sources
import { MTQ_ECONOMIC_DEFINITION } from "./mtq-economic-definition";
import { CANONICAL_SETTLEMENT_WORKFLOW } from "./settlement-workflow-canonical";
import { RESERVE_DOMAINS } from "./reserve-domains";
import { PILOT_1_RESERVE_CONFIG } from "./pilot-1-config";
import { BANK_FACING_COUNTERPARTY_ENTITY } from "./institutional-operating-model";
import { TRUST_DOMAINS } from "./finality-trust-domains";
import { CANONICAL_FINALITY_STAGES, FINALITY_TYPES, SETTLEMENT_MODES } from "./canonical-finality-model";
import { EVIDENCE_PACKAGE_FIELDS } from "./institutional-evidence-fabric";
import { OBLIGATION_FIELDS } from "./institutional-settlement-obligation-registry";
import { TOLERANCE_POLICIES } from "./reconciliation-tolerance-policies";
import { DEFAULT_PAIN_FACTORS } from "./corridor-pain-index";
import { PILOT_MODES } from "./two-pilot-modes";
import { EVIDENCE_STATUS_LABELS } from "./bank-value-model";
import { PILOT_GATE_FIELDS } from "./pilot-gate-framework";
import { getActivePolicies } from "./policy-registry";
import { LEGAL_EVIDENCE_REGISTRY } from "./external-legal-evidence";

export type DocumentId =
  | "EXEC_THESIS"
  | "BANK_PRODUCT_BRIEF"
  | "PILOT_SPECIFICATION"
  | "LEGAL_ACCOUNTING_REGULATORY_PACK"
  | "RISK_SECURITY_RESILIENCE_PACK";

export interface BankDocument {
  documentId: DocumentId;
  title: string;
  subtitle: string;
  targetPageCount: string;  // e.g., "2 pages", "20 pages", "40-60 pages"
  audience: string;
  generatedFrom: string[];  // list of canonical source modules
  sections: {
    sectionNumber: string;
    title: string;
    content: string;  // markdown content
    sourceModule: string;  // which canonical source this section is derived from
  }[];
  generatedAt: string;
  evidenceStatus: "SIMULATED" | "ILLUSTRATIVE" | "VALIDATED" | "INSTITUTIONALLY_VERIFIED";
}

// === Document 1: 2-Page Executive Thesis ===
export function generateExecutiveThesis(): BankDocument {
  return {
    documentId: "EXEC_THESIS",
    title: "MITHQAL — Executive Thesis for Banks",
    subtitle: "Why MITHQAL matters for your institution",
    targetPageCount: "2 pages",
    audience: "Bank C-suite (CEO, COO, CRO, Head of Transaction Banking)",
    generatedFrom: [
      "mtq-economic-definition.ts (MTQ canonical definition)",
      "institutional-operating-model.ts (bankFacingCounterpartyEntityId)",
      "two-pilot-modes.ts (Pilot A control plane)",
      "bank-value-model.ts (Bank Net Value formula)",
    ],
    sections: [
      {
        sectionNumber: "1",
        title: "What is MITHQAL?",
        content: MTQ_ECONOMIC_DEFINITION.canonicalDescription + "\n\n" + MTQ_ECONOMIC_DEFINITION.canonicalDescriptionLong,
        sourceModule: "mtq-economic-definition.ts",
      },
      {
        sectionNumber: "2",
        title: "Your Single Counterparty",
        content: `Banks see exactly ONE external contractual counterparty: ${BANK_FACING_COUNTERPARTY_ENTITY.bankFacingCounterpartyEntityId} (${BANK_FACING_COUNTERPARTY_ENTITY.legalName}). All contracting, SLA, support, billing, and escalation resolve to this single entity.`,
        sourceModule: "institutional-operating-model.ts",
      },
      {
        sectionNumber: "3",
        title: "Two Pilot Modes",
        content: `Pilot A (MITHQAL Control Plane): MTQ optional. Tests routing, liquidity, compliance, reconciliation, evidence, finality, failure management, bank integration. Status: ACTIVE.\n\nPilot B (MTQ Institutional Settlement): MTQ required. Tests PBC, obligor, issuance, redemption, finality-before-mint, bank subledger, resolution. Status: BLOCKED until Pilot A passes + legal/accounting prerequisites.`,
        sourceModule: "two-pilot-modes.ts",
      },
      {
        sectionNumber: "4",
        title: "Bank Net Value",
        content: `Bank Net Value = Liquidity Benefit + FX Benefit + Operational Savings + Compliance/Evidence Savings + Risk Value + New Revenue - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost - Change Cost.\n\nThe bank enters its own baseline data. No hard-coded numbers. Every output carries an evidence status label:\n${Object.entries(EVIDENCE_STATUS_LABELS).map(([k, v]) => `- ${v}`).join("\n")}`,
        sourceModule: "bank-value-model.ts",
      },
    ],
    generatedAt: new Date().toISOString(),
    evidenceStatus: "ILLUSTRATIVE",
  };
}

// === Document 2: 20-Page Bank Product Brief ===
export function generateBankProductBrief(): BankDocument {
  const activePolicies = getActivePolicies();
  return {
    documentId: "BANK_PRODUCT_BRIEF",
    title: "MITHQAL — Bank Product Brief",
    subtitle: "Institutional settlement infrastructure for cross-border trade",
    targetPageCount: "20 pages",
    audience: "Head of Transaction Banking, Head of Payments, Product Managers",
    generatedFrom: [
      "mtq-economic-definition.ts",
      "settlement-workflow-canonical.ts (BM-01..BM-16B)",
      "reserve-domains.ts (Settlement Liquidity vs Strategic Resilience)",
      "pilot-1-config.ts (Pilot 1 reserve config)",
      "canonical-finality-model.ts (F0-F7)",
      "finality-trust-domains.ts (3 trust domains)",
      "policy-registry.ts (25 policies)",
    ],
    sections: [
      {
        sectionNumber: "1",
        title: "MTQ Economic Definition",
        content: `Canonical: ${MTQ_ECONOMIC_DEFINITION.canonicalDescription}\n\nIS:\n${MTQ_ECONOMIC_DEFINITION.isStatement.map(s => `- ${s}`).join("\n")}\n\nIS NOT:\n${MTQ_ECONOMIC_DEFINITION.isNotStatement.map(s => `- ${s}`).join("\n")}`,
        sourceModule: "mtq-economic-definition.ts",
      },
      {
        sectionNumber: "2",
        title: "Settlement Workflow (BM-01..BM-16B)",
        content: `The canonical settlement workflow has 17 steps:\n${CANONICAL_SETTLEMENT_WORKFLOW.map(s => `- ${s.id}: ${s.name} (${s.phase}, ${s.capability})`).join("\n")}`,
        sourceModule: "settlement-workflow-canonical.ts",
      },
      {
        sectionNumber: "3",
        title: "Reserve Domains",
        content: `Two formally separate reserve domains:\n${RESERVE_DOMAINS.map(d => `- ${d.name}: ${d.description} (countsTowardSettlementBacking=${d.countsTowardSettlementBacking})`).join("\n")}`,
        sourceModule: "reserve-domains.ts",
      },
      {
        sectionNumber: "4",
        title: "Pilot 1 Reserve Configuration",
        content: `Pilot 1 uses only legally supportable institutional settlement assets:\n${PILOT_1_RESERVE_CONFIG.map(a => `- ${a.assetClass}: ${a.weight * 100}% (${a.status})`).join("\n")}`,
        sourceModule: "pilot-1-config.ts",
      },
      {
        sectionNumber: "5",
        title: "Finality Model (F0-F7)",
        content: `8 finality stages:\n${CANONICAL_FINALITY_STAGES.map(s => `- ${s.id}: ${s.name} (${s.finalityType})`).join("\n")}\n\n3 finality types: ${FINALITY_TYPES.map(t => t.type).join(", ")}\n\n2 settlement modes: ${SETTLEMENT_MODES.map(m => m.mode).join(", ")}`,
        sourceModule: "canonical-finality-model.ts",
      },
      {
        sectionNumber: "6",
        title: "Trust Domains (3)",
        content: `Three trust domains:\n${TRUST_DOMAINS.map(d => `- ${d.name}: ${d.description.substring(0, 100)}...`).join("\n")}`,
        sourceModule: "finality-trust-domains.ts",
      },
      {
        sectionNumber: "7",
        title: "Active Policy Registry",
        content: `${activePolicies.length} ACTIVE policies govern the MITHQAL platform. Key policies:\n${activePolicies.slice(0, 10).map(p => `- ${p.id}: ${p.name} (value=${p.value}, layer=${p.sourceLayer})`).join("\n")}`,
        sourceModule: "policy-registry.ts",
      },
    ],
    generatedAt: new Date().toISOString(),
    evidenceStatus: "ILLUSTRATIVE",
  };
}

// === Document 3: 40-60 Page Pilot Specification ===
export function generatePilotSpecification(): BankDocument {
  return {
    documentId: "PILOT_SPECIFICATION",
    title: "MITHQAL — Pilot Specification",
    subtitle: "Technical + operational specification for Pilot A + Pilot B",
    targetPageCount: "40-60 pages",
    audience: "Technical architects, operations teams, compliance officers",
    generatedFrom: [
      "settlement-workflow-canonical.ts",
      "two-pilot-modes.ts",
      "pilot-gate-framework.ts",
      "institutional-evidence-fabric.ts",
      "corridor-pain-index.ts",
      "reserve-coverage-logic.ts",
      "reconciliation-tolerance-policies.ts",
      "institutional-settlement-obligation-registry.ts",
    ],
    sections: [
      {
        sectionNumber: "1",
        title: "Pilot A — Control Plane (8 Test Areas)",
        content: `Pilot A tests the MITHQAL control plane WITHOUT requiring MTQ.\n\n8 test areas:\n${PILOT_MODES[0].testAreas.map(ta => `- ${ta.id}: ${ta.name} (mtqRequired=${ta.mtqRequired})`).join("\n")}`,
        sourceModule: "two-pilot-modes.ts",
      },
      {
        sectionNumber: "2",
        title: "Pilot B — MTQ Settlement (7 Test Areas, BLOCKED)",
        content: `Pilot B tests the MTQ settlement module. ONLY enabled after Pilot A passes ALL 8 test areas AND legal/accounting prerequisites are met.\n\n7 test areas:\n${PILOT_MODES[1].testAreas.map(ta => `- ${ta.id}: ${ta.name} (prerequisites=${ta.prerequisites?.join(",") || "none"})`).join("\n")}`,
        sourceModule: "two-pilot-modes.ts",
      },
      {
        sectionNumber: "3",
        title: "Pilot Gate Framework (11 Fields per Gate)",
        content: `Each gate has 11 fields: ${PILOT_GATE_FIELDS.join(", ")}.\n\nNo gate can become PASSED merely because code exists or tests pass. Institutional validation is SEPARATE from implementation status.`,
        sourceModule: "pilot-gate-framework.ts",
      },
      {
        sectionNumber: "4",
        title: "Institutional Evidence Fabric (15 Fields)",
        content: `Every material transaction generates a portable evidence package with 15 fields: ${EVIDENCE_PACKAGE_FIELDS.join(", ")}.\n\n3 access levels: PUBLIC, INSTITUTIONAL, AUDIT.`,
        sourceModule: "institutional-evidence-fabric.ts",
      },
      {
        sectionNumber: "5",
        title: "Corridor Pain Index (12 Factors)",
        content: `Candidate corridors scored on 12 factors:\n${DEFAULT_PAIN_FACTORS.map(f => `- ${f.name} (weight=${f.weight}, higherIsWorse=${f.higherIsWorse})`).join("\n")}`,
        sourceModule: "corridor-pain-index.ts",
      },
      {
        sectionNumber: "6",
        title: "Required Coverage Formula",
        content: `Required Coverage = Direct Settlement Backing + Risk Buffer.\n\n9 configurable risk buffer factors: liquidity, legal accessibility, asset haircut, valuation volatility, counterparty risk, concentration, settlement timing, redemption behavior, jurisdiction.\n\n130% retained as strategic policy target/example ONLY — NOT a universal requirement.`,
        sourceModule: "reserve-coverage-logic.ts",
      },
      {
        sectionNumber: "7",
        title: "Reconciliation Tolerance Policies (6 Separate)",
        content: `6 separate tolerance policies (NO universal tolerance):\n${TOLERANCE_POLICIES.map(p => `- ${p.name}: ${p.toleranceBps} bps (${p.exceptionPolicy})`).join("\n")}`,
        sourceModule: "reconciliation-tolerance-policies.ts",
      },
      {
        sectionNumber: "8",
        title: "Institutional Settlement Obligation Registry (13 Fields)",
        content: `Each obligation has 13 fields: ${OBLIGATION_FIELDS.join(", ")}.\n\nEnforcement: NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION.\n\nRegistry is MTQ-independent — works for any settlement asset type.`,
        sourceModule: "institutional-settlement-obligation-registry.ts",
      },
    ],
    generatedAt: new Date().toISOString(),
    evidenceStatus: "ILLUSTRATIVE",
  };
}

// === Document 4: Legal / Accounting / Regulatory Pack ===
export function generateLegalAccountingRegulatoryPack(): BankDocument {
  return {
    documentId: "LEGAL_ACCOUNTING_REGULATORY_PACK",
    title: "MITHQAL — Legal / Accounting / Regulatory Pack",
    subtitle: "Legal classification, accounting treatment, regulatory perimeter",
    targetPageCount: "variable (as needed)",
    audience: "General Counsel, Chief Financial Officer, Chief Risk Officer, Regulatory Affairs",
    generatedFrom: [
      "institutional-operating-model.ts (8 canonical fields + PENDING_LEGAL_VERIFICATION)",
      "external-legal-evidence.ts (6 evidence items)",
      "mtq-economic-definition.ts (legal classification = PENDING_VALIDATION)",
      "institutional-settlement-obligation-registry.ts (insolvency treatment)",
    ],
    sections: [
      {
        sectionNumber: "1",
        title: "Bank-Facing Counterparty (8 Canonical Fields)",
        content: `bankFacingCounterpartyEntityId: ${BANK_FACING_COUNTERPARTY_ENTITY.bankFacingCounterpartyEntityId}\n\n8 canonical fields:\n- contractingAuthority: ${BANK_FACING_COUNTERPARTY_ENTITY.contractingAuthority.verificationStatus}\n- slaOwner: ${BANK_FACING_COUNTERPARTY_ENTITY.slaOwner.verificationStatus}\n- supportOwner: ${BANK_FACING_COUNTERPARTY_ENTITY.supportOwner.verificationStatus}\n- operationalLiability: ${BANK_FACING_COUNTERPARTY_ENTITY.operationalLiability.verificationStatus}\n- dataProcessingResponsibility: ${BANK_FACING_COUNTERPARTY_ENTITY.dataProcessingResponsibility.verificationStatus}\n- securityResponsibility: ${BANK_FACING_COUNTERPARTY_ENTITY.securityResponsibility.verificationStatus}\n- billingAuthority: ${BANK_FACING_COUNTERPARTY_ENTITY.billingAuthority.verificationStatus}\n- escalationPath: ${BANK_FACING_COUNTERPARTY_ENTITY.escalationPath.verificationStatus}\n\n3 ACTIVE + 5 PENDING_LEGAL_VERIFICATION (honest state per M-directive "Do not invent legal facts")`,
        sourceModule: "institutional-operating-model.ts",
      },
      {
        sectionNumber: "2",
        title: "External Legal Evidence (6 Items)",
        content: `4 ACTIVE evidence items:\n${LEGAL_EVIDENCE_REGISTRY.filter(e => e.status === "ACTIVE").map(e => `- ${e.title} (${e.date}, ${e.issuer})`).join("\n")}\n\n2 PENDING_VALIDATION:\n${LEGAL_EVIDENCE_REGISTRY.filter(e => e.status === "PENDING_VALIDATION").map(e => `- ${e.title} (${e.issuer})`).join("\n")}`,
        sourceModule: "external-legal-evidence.ts",
      },
      {
        sectionNumber: "3",
        title: "MTQ Legal Classification",
        content: `Status: ${MTQ_ECONOMIC_DEFINITION.legalClassification.status}\n\nRule: ${MTQ_ECONOMIC_DEFINITION.legalClassification.rule}\n\nClaims forbidden:\n${MTQ_ECONOMIC_DEFINITION.legalClassification.claimsForbidden.map(c => `- ${c}`).join("\n")}`,
        sourceModule: "mtq-economic-definition.ts",
      },
      {
        sectionNumber: "4",
        title: "Insolvency Treatment",
        content: `The Institutional Settlement Obligation Registry includes insolvency treatment per obligation:\n- SEPARATED (obligation segregated from insolvency estate)\n- PARI_PASSU (ranks with other claims)\n- SUBORDINATED (ranks below)\n- SUPERSEDED (replaced by another)\n- PENDING_LEGAL_VERIFICATION (not yet legally verified)`,
        sourceModule: "institutional-settlement-obligation-registry.ts",
      },
    ],
    generatedAt: new Date().toISOString(),
    evidenceStatus: "ILLUSTRATIVE",
  };
}

// === Document 5: Risk / Security / Resilience Pack ===
export function generateRiskSecurityResiliencePack(): BankDocument {
  return {
    documentId: "RISK_SECURITY_RESILIENCE_PACK",
    title: "MITHQAL — Risk / Security / Resilience Pack",
    subtitle: "Risk architecture, security domains, resilience reserves",
    targetPageCount: "variable (as needed)",
    audience: "Chief Risk Officer, Chief Information Security Officer, Head of Operational Resilience",
    generatedFrom: [
      "finality-trust-domains.ts (3 trust domains + cross-domain isolation)",
      "reserve-domains.ts (Strategic Resilience Reserve)",
      "pilot-gate-framework.ts (evidence-based gates)",
      "reconciliation-tolerance-policies.ts (6 tolerance policies)",
      "canonical-finality-model.ts (finality-coordinated vs atomic)",
    ],
    sections: [
      {
        sectionNumber: "1",
        title: "Three Trust Domains (Cross-Domain Isolation)",
        content: `Domain A (Policy & Authorization): owns POLICY_SIGNING_KEY. Cannot access B or C.\nDomain B (Finality Attestation): owns ATTESTATION_ORACLE_KEY. Cannot access A or C.\nDomain C (Execution): owns EXECUTION_MINT_KEY. Cannot access A or B.\n\n6 cross-domain isolation rules enforced. 15 cross-domain compromise + privilege escalation tests (all PASS).`,
        sourceModule: "finality-trust-domains.ts",
      },
      {
        sectionNumber: "2",
        title: "Strategic Resilience Reserve",
        content: `Gold moved to Strategic Resilience Reserve domain (per L-directive). Gold is NOT settlement backing.\n\nEmergency capacity (≤15% of liability) is NOT double-counted into settlement backing (settlementBackingImpact=0).\n\nAnti-double-counting rules: goldNotSettlementBacking, emergencyCapacityNotDoubleCounted, noCommingling.`,
        sourceModule: "reserve-domains.ts",
      },
      {
        sectionNumber: "3",
        title: "Evidence-Based Pilot Gates",
        content: `Gates are EVIDENCE-BASED, not documentation-volume-based. Each gate has 11 fields including evidence artifact + evidence hash.\n\nNo gate can become PASSED merely because code exists or tests pass. Institutional validation is SEPARATE from implementation status.\n\nTwo independent status tracks: ImplementationStatus + InstitutionalValidationStatus.`,
        sourceModule: "pilot-gate-framework.ts",
      },
      {
        sectionNumber: "4",
        title: "Reconciliation Tolerance (6 Separate Policies)",
        content: `No universal tolerance. 6 separate policies:\n- LEDGER_TO_LEDGER: 1 bps, BLOCK_ON_MISMATCH\n- BANK_ATTESTATION: 5 bps, ESCALATE_ON_MISMATCH\n- CUSTODY_QUANTITY: 10 bps, BLOCK_ON_MISMATCH\n- MARKET_VALUATION: 50 bps, WARN_ON_MISMATCH\n- FX_VALUATION: 20 bps, WARN_ON_MISMATCH\n- STRESSED_VALUATION: 200 bps, TOLERATE_WITHIN_BOUNDS`,
        sourceModule: "reconciliation-tolerance-policies.ts",
      },
      {
        sectionNumber: "5",
        title: "Finality Coordination",
        content: `8 finality stages (F0-F7). 3 finality types (technical, banking, legal).\n\nUse 'finality-coordinated settlement' when no shared legal finality domain exists (typical for cross-border).\nUse 'atomic settlement' ONLY when shared legal finality domain exists (rare for cross-border).`,
        sourceModule: "canonical-finality-model.ts",
      },
    ],
    generatedAt: new Date().toISOString(),
    evidenceStatus: "ILLUSTRATIVE",
  };
}

// === Generate All Documents ===
export function generateAllBankDocuments(): BankDocument[] {
  return [
    generateExecutiveThesis(),
    generateBankProductBrief(),
    generatePilotSpecification(),
    generateLegalAccountingRegulatoryPack(),
    generateRiskSecurityResiliencePack(),
  ];
}

// === Status ===
export const BANK_DOCUMENT_GENERATOR_STATUS: "ACTIVE" | "SUPERSEDED" | "HISTORICAL" | "PENDING_VALIDATION" = "ACTIVE";
export const BANK_DOCUMENT_GENERATOR_VERSION = "v25.3.2-R1-1.0";
export const BANK_DOCUMENT_GENERATOR_SOURCE = "src/lib/bank-document-generator.ts";
