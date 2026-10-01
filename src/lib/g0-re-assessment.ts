/**
 * MITHQAL — G0 RE-ASSESSMENT (post-executed-instrument deposit)
 *
 * Two executed JOZOUR instruments were deposited in the repository
 * (commit 70bb064, 2026-10-01):
 *   1. JOZOUR, LLC OPERATING AGREEMENT AMENDMENT (Amendment No. 1)
 *   2. RESOLUTION OF JOZOUR, LLC REGARDING THE MITHQAL PROJECT
 *
 * This module RE-CLASSIFIES the G0 items based on the newly present
 * documents. The G0 status changes from G0_FAIL to G0_CONDITIONAL.
 *
 * Per PROMPT 63: No legal conclusion by inference. Only qualified
 * external counsel may convert the legal-question set into a legal opinion.
 *
 * NOT PRODUCTION-AUTHORIZED.
 */

import type { G0Item } from "./g0-institutional-entry-gate";

export interface G0ReAssessment {
  reAssessmentDate: string;
  triggerEvent: string;
  documentsDeposited: { fileName: string; date: string; signer: string; type: string }[];
  reClassifiedItems: { itemId: string; label: string; previousClass: string; newClass: string; reason: string }[];
  stillPendingItems: { itemId: string; label: string; issue: string }[];
  materialFindings: string[];
  newG0Status: string;
  newG0Decision: "G0_CONDITIONAL";
  decisionRationale: string;
  counselStillRequired: string[];
  honestState: {
    productionAuthorized: boolean;
    noLegalConclusionByInference: boolean;
    documentsNotInvented: boolean;
  };
  summary: string;
}

const NOW = "2026-10-01T22:55:00Z";

export function getG0ReAssessment(): G0ReAssessment {
  return {
    reAssessmentDate: NOW,
    triggerEvent: "Two executed JOZOUR instruments deposited in repository (commit 70bb064)",
    documentsDeposited: [
      {
        fileName: "upload/JOZOUR, LLC  OPERATING AGREEMENT AMENDMENT .pdf",
        date: "July 31, 2026",
        signer: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
        type: "Operating Agreement Amendment No. 1 (executed instrument)",
      },
      {
        fileName: "upload/RESOLUTION OF JOZOUR, LLC  REGARDING THE MITHQAL PROJECT.pdf",
        date: "July 31, 2026",
        signer: "Mohamed Salah Eltonsy, Manager, Jozour, LLC",
        type: "Corporate Resolution (executed instrument)",
      },
    ],
    reClassifiedItems: [
      { itemId: "G0-01", label: "Authoritative Entity Register", previousClass: "PRIMARY_DOCUMENT_MISSING", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "Amendment + Resolution confirm: Jozour, LLC, New Jersey LLC, formed October 24, 2019, EIN 84-3470275, registered office 116 Mallory Ave, Jersey City, NJ 07304, Manager Mohamed Salah Eltonsy." },
      { itemId: "G0-03", label: "Authority Matrix", previousClass: "PENDING_PRIMARY_DOCUMENT", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "§1.2 of Amendment + Resolution §2 grant Manager authority to: execute contracts, open bank/custody accounts, develop IP, engage advisors, apply for funding, establish relationships with financial institutions/regulators." },
      { itemId: "G0-04", label: "Contracting Entity Definition", previousClass: "INTERNAL_DESIGN", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "Jozour, LLC is the contracting entity. Manager authorized to 'execute contracts, agreements, and instruments in the name of the Company' (§1.2(a))." },
      { itemId: "G0-09", label: "Foundation/Holding/Operating/Technology Boundaries", previousClass: "INTERNAL_DESIGN", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "§1.6 defines two-entity architecture: Entity A (MITHQAL Foundation, nonprofit, to be formed) + Entity B (Jozour LLC, for-profit, interim operator). Company holds assets in trust for Foundation (§1.4(c))." },
      { itemId: "G0-10", label: "Current-Entity Transition Model", previousClass: "PENDING_PRIMARY_DOCUMENT", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "§1.4 defines transition: Jozour LLC operates as interim → upon Foundation formation, assets transferred at no cost. §1.4(c): 'assets held in trust for the benefit of the future Foundation.'" },
      { itemId: "G0-11", label: "Executed-Instrument Reconciliation Register", previousClass: "PRIMARY_DOCUMENT_MISSING", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "Two executed instruments now present: Amendment No. 1 (July 31, 2026) + Resolution (July 31, 2026). Both signed + certified by Mohamed Salah Eltonsy." },
      { itemId: "G0-13", label: "IP Ownership Register", previousClass: "UNKNOWN", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "Resolution §3: 'All intellectual property, technology, software, data, records, and institutional relationships developed under the MITHQAL project shall be held by the Company.' Amendment §1.2(c) confirms IP authority." },
      { itemId: "G0-15", label: "Bank Contract Authority Matrix", previousClass: "PENDING_PRIMARY_DOCUMENT", newClass: "VERIFIED_PRIMARY_DOCUMENT", reason: "§1.2(a): 'Executing contracts, agreements, and instruments.' §1.2(b): 'Opening and maintaining bank accounts, custody accounts.' Resolution §2 confirms banking authority." },
    ],
    stillPendingItems: [
      { itemId: "G0-02", label: "Ownership / Control Graph", issue: "Sole Member structure mentioned but no cap table or shareholder agreement deposited. For a single-member LLC, this may be simpler — but counsel must verify." },
      { itemId: "G0-05", label: "Bank-Facing Responsibility Matrix", issue: "17 contract sections still ALL DRAFT (0 SIGNED). The authority to contract is confirmed, but the actual bank contract has not been executed." },
      { itemId: "G0-06", label: "Legal Obligation Chain", issue: "No executed inter-company agreements (Jozour ↔ Foundation). Foundation does not yet exist. Obligation chain is incomplete." },
      { itemId: "G0-07", label: "MTQ Obligor / Redemption Role Matrix", issue: "MTQ is DISABLED. The documents do not specifically address the MTQ obligor role. §1.3 mentions '100%+ Reserve Requirement' + 'No Discretionary Minting' but does not define the obligor." },
      { itemId: "G0-08", label: "Reserve Ownership / Custody Role Matrix", issue: "No qualified custodian engaged. No executed custody agreement. PBC 0/14 evidence predicates met." },
      { itemId: "G0-12", label: "Related-Party / Conflict-of-Interest Register", issue: "No related-party register or conflict-of-interest declarations deposited. Sole Member structure may simplify this but counsel must verify." },
      { itemId: "G0-14", label: "Data Ownership / Processing Role Matrix", issue: "No Data Processing Agreement (DPA) executed. The documents do not address data ownership/processing roles." },
      { itemId: "G0-16", label: "Liability / Escalation Matrix", issue: "§1.5 defines indemnification (except gross negligence/fraud) but no executed liability agreement or insurance policy (7 categories ALL DESIGNED)." },
    ],
    materialFindings: [
      "§1.7 of the Amendment: 'The Company acknowledges that it has certain existing debts and liabilities, including but not limited to a judgment entered against the Company.' — MATERIAL FINDING. An existing judgment may affect bankability. Counsel must assess whether this affects the entity's suitability for bank contracting.",
      "§1.4(c): 'all Project assets are held in trust for the benefit of the future Foundation' — the trust arrangement language requires counsel review for enforceability.",
      "§1.8: 'No profits from the MITHQAL project shall be distributed to the Manager or Members, except as reasonable compensation for services rendered' — the non-profit character constraint requires counsel review for consistency with the for-profit entity structure.",
      "Article II §2.1: 'the Company's Operating Agreement dated October 24, 2019, is hereby ratified and confirmed' — the ORIGINAL Operating Agreement is referenced but NOT deposited in the repository. Counsel should request the original.",
      "The documents establish a SOLE MEMBER structure (Mohamed Salah Eltonsy is 'the sole Member and Manager'). No cap table or multi-party ownership structure is needed for a single-member LLC, but counsel must verify this is accurate.",
    ],
    newG0Status: "G0_CONDITIONAL",
    newG0Decision: "G0_CONDITIONAL",
    decisionRationale:
      "G0_CONDITIONAL. Two executed primary instruments are now PRESENT in the repository: " +
      "(1) Operating Agreement Amendment No. 1 (July 31, 2026) + (2) Resolution Regarding the MITHQAL Project (July 31, 2026). " +
      "Both signed + certified by Mohamed Salah Eltonsy, Manager. " +
      "8/16 G0 items re-classified from PRIMARY_DOCUMENT_MISSING/PENDING to VERIFIED_PRIMARY_DOCUMENT. " +
      "The entity (Jozour, LLC, NJ, EIN 84-3470275) is defined + the Manager has authority to contract. " +
      "BUT external counsel has NOT verified legal sufficiency. " +
      "MATERIAL FINDING: §1.7 reveals an existing judgment against the Company — counsel must assess impact. " +
      "8/16 items still PENDING (ownership graph, bank contracts, obligation chain, MTQ obligor, custody, related-party, data, liability). " +
      "NOT G0_PASS — counsel verification required. NOT G0_FAIL — documents present. G0_CONDITIONAL.",
    counselStillRequired: [
      "Verify the legal sufficiency of the Amendment + Resolution for bank contracting",
      "Assess the impact of §1.7 (existing judgment) on bankability",
      "Review the trust arrangement language in §1.4(c) for enforceability",
      "Request + review the ORIGINAL Operating Agreement (October 24, 2019, referenced but not deposited)",
      "Request Articles of Incorporation / Formation Certificate (referenced but not deposited)",
      "Verify the sole-member structure is accurate + sufficient",
      "Assess the non-profit character constraint (§1.8) vs for-profit entity structure",
      "Advise on whether 8/16 still-pending items can be resolved or are blockers",
    ],
    honestState: {
      productionAuthorized: false,
      noLegalConclusionByInference: true,
      documentsNotInvented: true,
    },
    summary:
      `G0 RE-ASSESSMENT (2026-10-01). Trigger: 2 executed JOZOUR instruments deposited (commit 70bb064). ` +
      `8/16 items re-classified: PRIMARY_DOCUMENT_MISSING → VERIFIED_PRIMARY_DOCUMENT. ` +
      `Entity: Jozour, LLC (NJ, EIN 84-3470275). Manager: Mohamed Salah Eltonsy (authority to contract confirmed). ` +
      `G0 status: G0_FAIL → G0_CONDITIONAL. NOT G0_PASS — counsel verification required. ` +
      `MATERIAL FINDING: §1.7 existing judgment — counsel must assess. ` +
      `8/16 items still PENDING. Per PROMPT 63: no legal conclusion by inference. ` +
      `NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const G0_REASSESSMENT_META = {
  module: "g0-re-assessment",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: NOW,
  trigger: "Executed JOZOUR instruments deposited (commit 70bb064)",
  previousG0Status: "G0_FAIL",
  newG0Status: "G0_CONDITIONAL",
  reClassifiedCount: 8,
  stillPendingCount: 8,
  materialFindingsCount: 5,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  The executed instruments are DEPOSITED (not invented). Their contents
//  are EXTRACTED (not inferred). The re-classification is based on
//  DOCUMENT PRESENCE (not legal conclusion).
//
//  G0 status: G0_FAIL → G0_CONDITIONAL (documents present, counsel required)
//  NOT G0_PASS — external counsel must verify legal sufficiency.
//  MATERIAL FINDING: §1.7 existing judgment — carried forward honestly.
//
//  No legal conclusion by inference. Only qualified external counsel
//  may convert the legal-question set into a legal opinion.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
