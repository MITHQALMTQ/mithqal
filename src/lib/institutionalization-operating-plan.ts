// src/lib/institutionalization-operating-plan.ts
//
// MITHQAL v25.3.20 — INSTITUTIONALIZATION OPERATING PLAN
// (single source of truth for team, funding, and gate-linked spend authorization)
//
// Per PROMPT 37 (verbatim):
//   "Create an institutionalization operating plan covering:
//    leadership roles, legal/regulatory expertise, engineering, security,
//    treasury/liquidity, bank integration, compliance, finance, operations,
//    independent assurance and external advisors.
//    Create:
//    12-month resource plan, budget, monthly burn, minimum cash, runway,
//    downside runway and capital requirements by gate.
//    Treat any historical funding target such as the prior $4.7M figure as
//    DESIGN-TIME until independently revalidated.
//    Every discretionary spend must link to:
//    next external gate, material risk reduction, revenue protection or
//    required evidence."
//
// CHANGE REQUEST: CR-2026-013 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.20
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Treats the historical $4.7M figure as DESIGN-TIME
//     (DESIGN_TIME_FUNDING_RULE)
//   - Every discretionary spend links to next external gate, material risk
//     reduction, revenue protection or required evidence
//     (SPEND_JUSTIFICATION_RULE)
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.3.6 K5 (Pilot 1 config — gold=0%, digital=0%)
//   - v25.3.7 M1 (institutional-operating-model — JOZOUR_LLC_NJ bank-facing
//     counterparty + Manager Mohamed Salah Eltonsy)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.10 P2 (two pilot modes — PILOT_A_CONTROL_PLANE +
//     PILOT_B_MTQ_SETTLEMENT)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates GATE-A1..GATE-B7)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle)
//   - v25.3.16 U1 (Accounting/Prudential/Tax Framework — 10 classification
//     areas, all PENDING_EXTERNAL_VALIDATION)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality —
//     COORDINATION_RULE: "system may coordinate; must not invent legal rights")
//   - v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT)
//   - v25.3.18 W2 (Enterprise Risk Register — 17 risks + Insurance Framework)
//
// HONEST-STATE RULES (per directive):
//   - "Treat any historical funding target such as the prior $4.7M figure as
//      DESIGN-TIME until independently revalidated."
//      (DESIGN_TIME_FUNDING_RULE)
//   - "Every discretionary spend must link to: next external gate, material
//      risk reduction, revenue protection or required evidence."
//      (SPEND_JUSTIFICATION_RULE)
//   - All role costs are DESIGN-TIME — they have NOT been independently
//     validated (no compensation survey, no third-party benchmark, no
//     board-approved budget).
//   - All role statuses are PENDING_HIRE — no role in this plan is currently
//     filled (honest state — verified at runtime in module load).

// ============================================================================
// TYPES
// ============================================================================

// 11 role categories per directive (PROMPT 37 verbatim)
export type RoleCategoryId =
  | "LEADERSHIP_ROLES"
  | "LEGAL_REGULATORY_EXPERTISE"
  | "ENGINEERING"
  | "SECURITY"
  | "TREASURY_LIQUIDITY"
  | "BANK_INTEGRATION"
  | "COMPLIANCE"
  | "FINANCE"
  | "OPERATIONS"
  | "INDEPENDENT_ASSURANCE"
  | "EXTERNAL_ADVISORS";

export type RoleStatus =
  | "PENDING_HIRE" // default — no offer extended, no candidate identified
  | "ACTIVE" // filled and operating
  | "CONTRACTED" // contracted firm/individual (typical for External Advisors)
  | "PENDING_EXTERNAL_VALIDATION"; // offered but subject to external
  // verification (e.g., pending NJ bar admission for regulatory counsel)

export interface RoleDefinition {
  roleName: string;
  responsibilities: string;
  fteRequired: number; // full-time equivalent (e.g., 1.0, 0.5)
  monthlyCostUsd: number; // per FTE, per month — DESIGN-TIME
  status: RoleStatus;
  currentFte: number; // currently filled (honest — 0 for all roles)
}

export interface RoleCategory {
  categoryId: RoleCategoryId;
  name: string;
  description: string;
  roles: RoleDefinition[];
  totalFteRequired: number;
  totalMonthlyCostUsd: number;
  currentFteTotal: number; // honest — currently filled (0 for all categories)
  fundingGap: number; // total required - current (== total since current = 0)
}

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

export const DESIGN_TIME_FUNDING_RULE = {
  ruleId: "DESIGN_TIME_FUNDING_RULE",
  rule: "Per PROMPT 37: 'Treat any historical funding target such as the prior $4.7M figure as DESIGN-TIME until independently revalidated.' All budget figures are DESIGN-TIME — they have NOT been independently validated. The $4.7M figure (if referenced in prior materials) is DESIGN-TIME.",
  description:
    "Every dollar amount in this operating plan — role costs, monthly burn, minimum cash, runway, capital requirements by gate — is DESIGN-TIME. " +
    "DESIGN-TIME means: the figures are planning estimates produced by the operating-plan architect, not figures independently validated by " +
    "(a) a qualified compensation benchmark (e.g., Radford, Robert Half, Mercer), " +
    "(b) external audit/tax counsel for treasury + capital sizing, " +
    "(c) the COO + CTO joint budget approval, " +
    "(d) the board / investors in a financing round. " +
    "The $4.7M figure referenced in some prior planning materials is explicitly NOT carried forward as committed capital. " +
    "It is referenced here only as DESIGN-TIME historical context. " +
    "Capital requirements will be independently revalidated before any binding funding commitment is made.",
  whatItForbids:
    "Any representation — internal or external — that the budget figures in this module are validated, approved, committed, " +
    "or that any specific dollar amount (including the historical $4.7M target) is the institutional capital requirement. " +
    "Forbidden: 'MITHQAL has raised $4.7M.' Forbidden: 'The runway is X months at the validated burn.' " +
    "Forbidden: 'The capital requirement for Gate A1 is $Y' as a commitment rather than as a DESIGN-TIME estimate.",
  whatItPermits:
    "Use of these figures as DESIGN-TIME planning inputs to drive (a) the staffing plan sequence, " +
    "(b) the SPEND_JUSTIFICATION_RULE mapping each discretionary spend to a gate/risk/evidence link, " +
    "(c) the runway + minimum-cash engineering view (qualitative, not committed). " +
    "Permitted: 'DESIGN-TIME burn is $X/month, subject to independent revalidation.' " +
    "Permitted: 'Capital requirement for Gate A1 is DESIGN-TIME $Y — to be revalidated by external treasury counsel.'",
  enforcement:
    "Every dollar-denominated field in this module is tagged DESIGN-TIME in the API response. " +
    "The historical $4.7M figure (if referenced) appears only inside this rule's `rule` and `description` text as a " +
    "DESIGN-TIME historical context item — it is NEVER exported as a committed capital number. " +
    "No role cost, monthly burn, minimum cash, runway, or capital-by-gate figure may be represented externally " +
    "without the DESIGN-TIME qualifier.",
  historicalFundingReference: {
    figure: "$4.7M",
    historicalContext:
      "A $4.7M figure has appeared in prior planning materials as a suggested funding target. " +
      "Per PROMPT 37, this figure is DESIGN-TIME until independently revalidated. " +
      "It is NOT carried forward here as committed capital.",
    status: "DESIGN_TIME",
    revalidationRequired: true,
    revalidationOwner: "COO + CTO (joint) + external treasury counsel",
  },
} as const;

export const SPEND_JUSTIFICATION_RULE = {
  ruleId: "SPEND_JUSTIFICATION_RULE",
  rule: "Per PROMPT 37: 'Every discretionary spend must link to: next external gate, material risk reduction, revenue protection or required evidence.' No discretionary spend without justification.",
  description:
    "Every discretionary dollar in this operating plan — every hire, every contractor, every tool, every external advisor — " +
    "must link to at least one of four justifications: " +
    "(1) next external gate — the spend unblocks or de-risks the next pilot gate per Q2 (e.g., GATE-A1-ROUTING needs Lead Settlements Engineer); " +
    "(2) material risk reduction — the spend reduces a risk in the W2 Enterprise Risk Register (e.g., CISO reduces SECURITY risk); " +
    "(3) revenue protection — the spend protects existing or anticipated revenue (e.g., Bank Onboarding Manager protects bank-pilot revenue); " +
    "(4) required evidence — the spend produces evidence required by a gate's acceptance criterion per Q2 (e.g., Independent External Auditor produces audit evidence for GATE-A5-EVIDENCE). " +
    "Spends that do not link to at least one of these four justifications are NOT authorized.",
  whatItForbids:
    "Any discretionary spend — hire, contractor engagement, software purchase, advisor retainer, infrastructure expansion — " +
    "that cannot be linked to at least one of: next external gate / material risk reduction / revenue protection / required evidence. " +
    "Forbidden: 'nice-to-have' hires. Forbidden: speculative tooling. Forbidden: 'build the team first, justify later.' " +
    "Forbidden: any spend authorized without an explicit gate/risk/evidence link recorded.",
  whatItPermits:
    "Spends where the operating-plan architect has recorded an explicit link to at least one of the four justifications. " +
    "Permitted: a hire whose role responsibilities explicitly name the next gate it unblocks. " +
    "Permitted: a contractor engagement whose scope explicitly reduces a named W2 risk. " +
    "Permitted: an external advisor whose deliverable explicitly produces evidence required by a named Q2 gate.",
  enforcement:
    "Every RoleDefinition.responsibilities field in this module names at least one of: " +
    "(a) the next external gate (GATE-A1..GATE-B7) the role unblocks, " +
    "(b) the W2 risk it reduces (by risk ID), " +
    "(c) the revenue stream it protects (e.g., 'bank-pilot recurring revenue'), " +
    "or (d) the Q2 evidence artifact it produces. " +
    "The capital-by-gate table (CAPITAL_REQUIREMENTS_BY_GATE) explicitly names the gate, the risk-reduction link, and the evidence link for each capital line item. " +
    "Spends without a recorded justification are rejected at planning time and not authorized at execution time.",
  fourJustifications: [
    "next external gate (per Q2 pilot gate framework GATE-A1..GATE-B7)",
    "material risk reduction (per W2 Enterprise Risk Register — by risk ID)",
    "revenue protection (existing or anticipated bank-pilot / institutional revenue)",
    "required evidence (per Q2 gate acceptance criterion — evidence artifact)",
  ],
} as const;

// ============================================================================
// ROLE CATEGORIES (11 per directive)
// ============================================================================
//
// HONEST-STATE: every role is PENDING_HIRE / currentFte = 0.
// Every role cost is DESIGN-TIME (no compensation benchmark, no board approval).
// Every role's responsibilities name at least one of the four SPEND_JUSTIFICATION
// categories: next external gate / material risk reduction / revenue protection /
// required evidence.

export const ROLE_CATEGORIES: RoleCategory[] = [
  // ====================================================================
  // 1. LEADERSHIP ROLES
  // ====================================================================
  {
    categoryId: "LEADERSHIP_ROLES",
    name: "Leadership Roles",
    description:
      "Executive leadership responsible for institutional authority, bank-facing accountability (per M1 JOZOUR_LLC_NJ), " +
      "engineering vision, financial stewardship, and risk ownership. Per W2 SINGULAR_OWNER_RULE, every risk owner is singular and explicit — " +
      "these roles are the named single owners.",
    roles: [
      {
        roleName: "Chief Executive Officer (CEO)",
        responsibilities:
          "Institutional authority + external bank-facing representation (per M1 JOZOUR_LLC_NJ as bank-facing counterparty). " +
          "Approves pilot gate progression per Q2. SPEND JUSTIFICATION: revenue protection (institutional revenue protection — bank-pilot) " +
          "+ next external gate (GATE-A8-BANK_INTEGRATION bank-facing sponsor) + material risk reduction (W2 risk GOVERNANCE-001: lack of singular accountable executive).",
        fteRequired: 1.0,
        monthlyCostUsd: 30000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Chief Operating Officer (COO)",
        responsibilities:
          "Operations + vendor management + SLA ownership (per M1 bankFacingCounterpartyEntityId slaOwner = PENDING_LEGAL_VERIFICATION). " +
          "Approves spend per SPEND_JUSTIFICATION_RULE. SPEND JUSTIFICATION: next external gate (GATE-A1-ROUTING operational owner) " +
          "+ material risk reduction (W2 risk OPERATIONS-001: no documented operations owner).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Chief Technology Officer (CTO)",
        responsibilities:
          "Engineering + security + settlement systems architecture (per N1 canonical finality model F0-F7 owner). " +
          "Joint-approves architecture freeze changes per T2 (COO + CTO joint approval). SPEND JUSTIFICATION: next external gate " +
          "(GATE-A5-EVIDENCE technical owner) + material risk reduction (W2 risk TECHNOLOGY-001: settlement system architecture ownership).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Chief Financial Officer (CFO)",
        responsibilities:
          "Finance + treasury oversight + accounting (per U1 P25 Accounting/Prudential/Tax Framework — 10 classification areas " +
          "all PENDING_EXTERNAL_VALIDATION). SPEND JUSTIFICATION: next external gate (GATE-A4-RECONCILIATION financial owner) " +
          "+ required evidence (U1 accounting classification evidence required for any production settlement).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Chief Risk Officer (CRO)",
        responsibilities:
          "Enterprise risk register ownership (per W2 — 17 risks + singular owner rule). " +
          "Insurance/risk-transfer coordination (per W2 P31 Insurance Framework — 7 categories DESIGNED→QUOTED→BOUND→ACTIVE). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 singular owner — every risk must have a single named owner) " +
          "+ next external gate (GATE-A7-FAILURE_MANAGEMENT risk owner).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Chief Compliance Officer (CCO)",
        responsibilities:
          "BSA/AML + sanctions + KYC + jurisdictional authorization (per jurisdiction-engine + sanctions-screening). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk COMPLIANCE-001: BSA/AML program not documented) " +
          "+ next external gate (GATE-A3-COMPLIANCE_ORCHESTRATION compliance owner) + required evidence (regulatory examination readiness evidence).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 6.0,
    totalMonthlyCostUsd: 155000,
    currentFteTotal: 0,
    fundingGap: 155000,
  },

  // ====================================================================
  // 2. LEGAL / REGULATORY EXPERTISE
  // ====================================================================
  {
    categoryId: "LEGAL_REGULATORY_EXPERTISE",
    name: "Legal / Regulatory Expertise",
    description:
      "In-house legal + regulatory expertise covering bank contracts (per W1 Bank Contracting Package — 17 sections ALL DRAFT), " +
      "PBC legal enforceability (per U2 P26 — 14 fields + 6 failure states), failure-resolution legal conditionality (per V1 PROMPT 27 — " +
      "6 forbidden assumptions + COORDINATION_RULE 'system may coordinate; must not invent legal rights').",
    roles: [
      {
        roleName: "General Counsel (GC)",
        responsibilities:
          "Bank-facing contract authority (per W1 17-section bank contracting package — ALL DRAFT → ACTIVE). " +
          "PBC legal enforceability oversight (per U2 — MITHQAL_VERIFICATION_RULE: must NEVER imply ownership, legal perfection or bankruptcy remoteness). " +
          "SPEND JUSTIFICATION: next external gate (GATE-B2-OBLIGOR legal owner) + required evidence (executed bank contracts required by GATE-A8-BANK_INTEGRATION).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Regulatory Counsel (NJ/US)",
        responsibilities:
          "NJ state + US federal regulatory authorizations (per institutional-authorization). " +
          "BSA/AML program legal review (per U1 P25 — 10 classification areas PENDING_EXTERNAL_VALIDATION). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A3-COMPLIANCE_ORCHESTRATION legal co-owner) " +
          "+ required evidence (regulatory examination readiness evidence required by GATE-A5-EVIDENCE).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_EXTERNAL_VALIDATION",
        currentFte: 0,
      },
      {
        roleName: "Regulatory Counsel (Cross-Border)",
        responsibilities:
          "Cross-border regulatory analysis (BRICS+ JSG jurisdictional rules per brics-jsg-runtime). " +
          "Sanctions/freedom-to-operate analysis per jurisdiction. SPEND JUSTIFICATION: material risk reduction " +
          "(W2 risk REGULATORY-001: cross-border jurisdictional ambiguity) + required evidence (jurisdictional authorization evidence required by GATE-A8-BANK_INTEGRATION for foreign-bank counterparties).",
        fteRequired: 0.5,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "External Counsel Relationship Manager",
        responsibilities:
          "Manages external law firm engagements (per W1 bank contracting package requires external counsel review + per V1 legal-conditionality requires external counsel sign-off on resolution mechanisms). " +
          "SPEND JUSTIFICATION: required evidence (external counsel opinion letters required by GATE-B2-OBLIGOR + GATE-B7-RESOLUTION) " +
          "+ material risk reduction (W2 risk LEGAL-001: no external counsel retained for failure-resolution review).",
        fteRequired: 0.5,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 3.0,
    totalMonthlyCostUsd: 67000,
    currentFteTotal: 0,
    fundingGap: 67000,
  },

  // ====================================================================
  // 3. ENGINEERING
  // ====================================================================
  {
    categoryId: "ENGINEERING",
    name: "Engineering",
    description:
      "Settlement systems + control plane + bank integration engineering (per J3 CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE). " +
      "Owns the canonical settlement workflow (per J2 — BM-01..BM-16B) + canonical finality model (per N1 F0-F7). " +
      "Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS — read-only access).",
    roles: [
      {
        roleName: "Lead Settlements Engineer",
        responsibilities:
          "Owns the canonical settlement workflow (per J2 BM-01..BM-16B) + finality model integration (per N1 F0-F7). " +
          "Bank integration protocol design. SPEND JUSTIFICATION: next external gate (GATE-A1-ROUTING engineering owner) " +
          "+ required evidence (transaction logs + reconciliation evidence required by GATE-A4-RECONCILIATION).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Backend Engineer (Settlements)",
        responsibilities:
          "Implements settlement instruction processing + reconciliation engine. " +
          "Evidence Fabric integration (per N2 — 15-field EvidencePackage + SHA-256 commitments). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A4-RECONCILIATION engineering implementer) " +
          "+ required evidence (EvidencePackage artifacts required by GATE-A5-EVIDENCE).",
        fteRequired: 2.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Frontend Engineer (Bank Portal)",
        responsibilities:
          "Bank-facing portal (per W1 bank contracting package — bank self-service portal). " +
          "Operations dashboard + transaction monitoring UI. SPEND JUSTIFICATION: next external gate " +
          "(GATE-A8-BANK_INTEGRATION bank portal owner) + revenue protection (bank-pilot recurring revenue protection via self-service portal).",
        fteRequired: 1.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Protocol / Smart Contract Engineer",
        responsibilities:
          "Smart contract development + audit coordination (per smart-contract-deployment-closure). " +
          "DOES NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS — read-only). " +
          "SPEND JUSTIFICATION: next external gate (GATE-B5-FINALITY_BEFORE_MINT contract owner) " +
          "+ material risk reduction (W2 risk TECHNOLOGY-002: smart contract audit not completed).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Platform / SRE Engineer",
        responsibilities:
          "Infrastructure + observability + reliability (per SettlementContinuityFabric S1 — 9 events × 7-stage lifecycle). " +
          "Incident response platform. SPEND JUSTIFICATION: next external gate (GATE-A7-FAILURE_MANAGEMENT platform owner) " +
          "+ material risk reduction (W2 risk OPERATIONS-002: no production monitoring).",
        fteRequired: 1.0,
        monthlyCostUsd: 20000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Integration Engineer (Bank APIs)",
        responsibilities:
          "Bank API adapters + ISO 20022 message handling (per bank-onboarding + commercial-governance). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A8-BANK_INTEGRATION integration owner) " +
          "+ revenue protection (bank-pilot revenue protection — every integrated bank is a revenue line).",
        fteRequired: 1.0,
        monthlyCostUsd: 19000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 7.0,
    totalMonthlyCostUsd: 119000,
    currentFteTotal: 0,
    fundingGap: 119000,
  },

  // ====================================================================
  // 4. SECURITY
  // ====================================================================
  {
    categoryId: "SECURITY",
    name: "Security",
    description:
      "Information security + application security + security operations. Owns the enterprise security posture and " +
      "supports the W2 risk register (SECURITY risks) + SettlementContinuityFabric CYBER_EVENT response (per S1).",
    roles: [
      {
        roleName: "Chief Information Security Officer (CISO) / Security Lead",
        responsibilities:
          "Owns the security program + risk acceptance for SECURITY-category risks (per W2). " +
          "CYBER_EVENT response coordination (per S1 SettlementContinuityFabric — 7-stage lifecycle DETECT→FREEZE_SAFE_HALT→ASSESS→...). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk SECURITY-001: no CISO + no security program documented) " +
          "+ next external gate (GATE-A7-FAILURE_MANAGEMENT security owner).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Application Security Engineer",
        responsibilities:
          "Secure code review + penetration test coordination + dependency vulnerability management (per custody-production-hardening). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk SECURITY-002: no application security review process) " +
          "+ required evidence (penetration test report required by GATE-A5-EVIDENCE).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Security Operations Engineer (SOC)",
        responsibilities:
          "24/7 security monitoring + incident triage + threat intelligence. " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk SECURITY-003: no 24/7 SOC capability) " +
          "+ next external gate (GATE-A5-EVIDENCE security operations owner — security event evidence).",
        fteRequired: 1.0,
        monthlyCostUsd: 20000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 3.0,
    totalMonthlyCostUsd: 67000,
    currentFteTotal: 0,
    fundingGap: 67000,
  },

  // ====================================================================
  // 5. TREASURY / LIQUIDITY
  // ====================================================================
  {
    categoryId: "TREASURY_LIQUIDITY",
    name: "Treasury / Liquidity",
    description:
      "Treasury operations + liquidity management + FX settlement. Owns the reserve-coverage-logic (per K3) + " +
      "reserve-domains (per K4 — Settlement Liquidity vs Strategic Resilience). Coordinates with bank treasury counterparts.",
    roles: [
      {
        roleName: "Treasurer",
        responsibilities:
          "Owns treasury operations + reserve policy (per K3 reserve-coverage-logic + K4 reserve-domains). " +
          "Bank treasury counterparty relationship (per W1 bank contracting package — bank treasury contact). " +
          "SPEND JUSTIFICATION: next external gate (GATE-B3-ISSUANCE treasury owner) " +
          "+ material risk reduction (W2 risk TREASURY-001: no documented reserve coverage policy owner).",
        fteRequired: 1.0,
        monthlyCostUsd: 25000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Liquidity Manager",
        responsibilities:
          "Daily liquidity monitoring + intraday liquidity optimization + bank-by-bank liquidity position. " +
          "SPEND JUSTIFICATION: next external gate (GATE-A2-LIQUIDITY_OPTIMIZATION owner) " +
          "+ revenue protection (bank-pilot liquidity cost — protects spread revenue).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "FX Settlements Specialist",
        responsibilities:
          "Cross-currency settlement + FX risk management (per corridor-pain-index + multi-custodian). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk TREASURY-002: no FX settlement specialist) " +
          "+ required evidence (FX settlement evidence required by GATE-A4-RECONCILIATION for cross-currency transactions).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 3.0,
    totalMonthlyCostUsd: 69000,
    currentFteTotal: 0,
    fundingGap: 69000,
  },

  // ====================================================================
  // 6. BANK INTEGRATION
  // ====================================================================
  {
    categoryId: "BANK_INTEGRATION",
    name: "Bank Integration",
    description:
      "Bank-facing onboarding + technical integration + relationship management. Owns the bank-onboarding lifecycle + " +
      "bank contracting package execution (per W1 — 17 sections ALL DRAFT).",
    roles: [
      {
        roleName: "Bank Integration Lead",
        responsibilities:
          "Owns bank-onboarding lifecycle end-to-end (per bank-onboarding). " +
          "Bank contracting package execution (per W1 — 17 sections ALL DRAFT → ACTIVE). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A8-BANK_INTEGRATION owner) " +
          "+ revenue protection (every onboarded bank is a revenue line — bank-pilot revenue protection).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Bank Onboarding Manager",
        responsibilities:
          "Bank KYB (know-your-bank) + legal entity verification (per institutional-external-identity — 8 standards, " +
          "3 PENDING_ENTITY_IDENTITY + 5 OPERATING_ENTITY_ACTIVE + NEVER_INVENT_RULE). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A8-BANK_INTEGRATION KYB owner) " +
          "+ required evidence (bank KYB evidence required by GATE-A8-BANK_INTEGRATION acceptance criterion).",
        fteRequired: 1.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Bank Technical Liaison",
        responsibilities:
          "Day-to-day technical coordination with bank IT teams (per bank-onboarding — bank API testing + UAT coordination). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A8-BANK_INTEGRATION technical liaison) " +
          "+ revenue protection (bank-pilot recurring revenue protection — reduces bank churn).",
        fteRequired: 1.0,
        monthlyCostUsd: 17000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 3.0,
    totalMonthlyCostUsd: 57000,
    currentFteTotal: 0,
    fundingGap: 57000,
  },

  // ====================================================================
  // 7. COMPLIANCE
  // ====================================================================
  {
    categoryId: "COMPLIANCE",
    name: "Compliance",
    description:
      "BSA/AML + KYC + sanctions screening + compliance operations. Owns the sanctions-screening engine (per sanctions-screening) + " +
      "compliance evidence production (per N2 Evidence Fabric — 15-field EvidencePackage with SHA-256 commitments).",
    roles: [
      {
        roleName: "BSA/AML Officer",
        responsibilities:
          "BSA/AML program (per U1 P25 — 10 classification areas PENDING_EXTERNAL_VALIDATION) + suspicious activity reporting. " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk COMPLIANCE-001: no BSA/AML program) " +
          "+ required evidence (BSA/AML program evidence required by GATE-A3-COMPLIANCE_ORCHESTRATION).",
        fteRequired: 1.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "KYC / Onboarding Specialist",
        responsibilities:
          "Customer due diligence + enhanced due diligence + ongoing KYC refresh (per sanctions-screening + jurisdiction-engine). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A3-COMPLIANCE_ORCHESTRATION KYC owner) " +
          "+ required evidence (KYC evidence required by GATE-A3-COMPLIANCE_ORCHESTRATION acceptance criterion).",
        fteRequired: 1.0,
        monthlyCostUsd: 15000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Sanctions Screening Officer",
        responsibilities:
          "Sanctions list management + screening operations + true-positive adjudication (per sanctions-screening). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk COMPLIANCE-002: no sanctions screening operations) " +
          "+ required evidence (sanctions screening evidence required by GATE-A3-COMPLIANCE_ORCHESTRATION).",
        fteRequired: 1.0,
        monthlyCostUsd: 16000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Compliance Operations Analyst",
        responsibilities:
          "Compliance case management + regulatory reporting + examination support. " +
          "SPEND JUSTIFICATION: required evidence (regulatory reporting evidence required by GATE-A5-EVIDENCE) " +
          "+ material risk reduction (W2 risk COMPLIANCE-003: no examination readiness).",
        fteRequired: 1.0,
        monthlyCostUsd: 15000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 4.0,
    totalMonthlyCostUsd: 64000,
    currentFteTotal: 0,
    fundingGap: 64000,
  },

  // ====================================================================
  // 8. FINANCE
  // ====================================================================
  {
    categoryId: "FINANCE",
    name: "Finance",
    description:
      "Accounting + financial reporting + treasury analysis + tax. Owns the U1 P25 Accounting/Prudential/Tax Framework " +
      "(10 classification areas, all PENDING_EXTERNAL_VALIDATION) + bank billing operations.",
    roles: [
      {
        roleName: "Controller",
        responsibilities:
          "General ledger + financial statements + accounting policy (per U1 P25 — 10 classification areas). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A4-RECONCILIATION finance owner) " +
          "+ required evidence (financial statements required by GATE-A5-EVIDENCE — audit evidence).",
        fteRequired: 1.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Senior Accountant",
        responsibilities:
          "Bank billing + accounts payable + accounts receivable + monthly close. " +
          "SPEND JUSTIFICATION: revenue protection (bank-pilot revenue protection — accurate billing) " +
          "+ required evidence (billing evidence required by GATE-A8-BANK_INTEGRATION — bank billing acceptance).",
        fteRequired: 1.0,
        monthlyCostUsd: 14000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Treasury Analyst",
        responsibilities:
          "Cash positioning + short-term investments + bank account reconciliation. " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk TREASURY-003: no daily cash positioning) " +
          "+ next external gate (GATE-A2-LIQUIDITY_OPTIMIZATION treasury analyst).",
        fteRequired: 1.0,
        monthlyCostUsd: 16000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Tax Specialist",
        responsibilities:
          "Tax compliance + transfer pricing + indirect tax (per U1 P25 — 10 classification areas including tax). " +
          "SPEND JUSTIFICATION: required evidence (tax compliance evidence required by GATE-A5-EVIDENCE) " +
          "+ material risk reduction (W2 risk FINANCE-001: no tax compliance owner).",
        fteRequired: 0.5,
        monthlyCostUsd: 17000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 3.5,
    totalMonthlyCostUsd: 59500,
    currentFteTotal: 0,
    fundingGap: 59500,
  },

  // ====================================================================
  // 9. OPERATIONS
  // ====================================================================
  {
    categoryId: "OPERATIONS",
    name: "Operations",
    description:
      "Settlement operations + incident response coordination + vendor management. Owns the operational execution of " +
      "J2 canonical settlement workflow (BM-01..BM-16B) + S1 SettlementContinuityFabric (9 events × 7-stage lifecycle).",
    roles: [
      {
        roleName: "Operations Manager",
        responsibilities:
          "Day-to-day operations + SLA management (per M1 slaOwner = PENDING_LEGAL_VERIFICATION). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A1-ROUTING operations manager) " +
          "+ revenue protection (SLA compliance = bank-pilot revenue protection).",
        fteRequired: 1.0,
        monthlyCostUsd: 18000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Settlement Operations Analyst",
        responsibilities:
          "Settlement instruction processing + exception handling + reconciliation operations (per J2 BM-01..BM-16B + O2 6 reconciliation tolerance policies). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A4-RECONCILIATION operations owner) " +
          "+ required evidence (reconciliation evidence required by GATE-A4-RECONCILIATION acceptance criterion).",
        fteRequired: 2.0,
        monthlyCostUsd: 14000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Incident Response Coordinator",
        responsibilities:
          "Incident command for S1 SettlementContinuityFabric events (9 events × 7-stage lifecycle DETECT→FREEZE_SAFE_HALT→ASSESS→ALTERNATIVE_ROUTE→RESUME→RECONCILE→EVIDENCE). " +
          "SPEND JUSTIFICATION: next external gate (GATE-A7-FAILURE_MANAGEMENT incident coordinator) " +
          "+ material risk reduction (W2 risk OPERATIONS-003: no incident response coordinator).",
        fteRequired: 1.0,
        monthlyCostUsd: 17000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Vendor Manager",
        responsibilities:
          "Vendor onboarding + vendor risk management + SLA enforcement (per W1 bank contracting package vendor section). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk OPERATIONS-004: no vendor risk management) " +
          "+ revenue protection (vendor SLA enforcement = operational continuity = revenue protection).",
        fteRequired: 0.5,
        monthlyCostUsd: 15000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
    ],
    totalFteRequired: 4.5,
    totalMonthlyCostUsd: 71500,
    currentFteTotal: 0,
    fundingGap: 71500,
  },

  // ====================================================================
  // 10. INDEPENDENT ASSURANCE
  // ====================================================================
  {
    categoryId: "INDEPENDENT_ASSURANCE",
    name: "Independent Assurance",
    description:
      "Internal audit + quality assurance + external auditor engagement. Per Q2 pilot gate framework — no gate can become " +
      "PASSED merely because code exists or tests pass. Independent reviewer (independent from owner) must VALIDATE + APPROVE. " +
      "These roles are the independent reviewers.",
    roles: [
      {
        roleName: "Internal Audit Lead",
        responsibilities:
          "Independent internal audit (independent from CTO + COO per Q2 reviewer.independenceVerified = true). " +
          "Audit charter + annual audit plan. SPEND JUSTIFICATION: required evidence (independent audit evidence required by " +
          "GATE-A5-EVIDENCE — independent reviewer must validate + approve per Q2) " +
          "+ material risk reduction (W2 risk ASSURANCE-001: no independent internal audit).",
        fteRequired: 1.0,
        monthlyCostUsd: 22000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Quality Assurance Analyst",
        responsibilities:
          "Test automation + regression testing + UAT coordination. " +
          "SPEND JUSTIFICATION: required evidence (test evidence required by GATE-A4-RECONCILIATION — reconciliation test evidence) " +
          "+ next external gate (GATE-A5-EVIDENCE QA owner — test evidence quality).",
        fteRequired: 1.0,
        monthlyCostUsd: 16000,
        status: "PENDING_HIRE",
        currentFte: 0,
      },
      {
        roleName: "Independent External Auditor (engaged)",
        responsibilities:
          "External audit firm engagement (Big-4 or qualified regional firm) — financial audit + SOC 1 / SOC 2 attestation. " +
          "Per Q2 reviewer.independenceVerified = true — external auditor is the ultimate independent reviewer for production gates. " +
          "SPEND JUSTIFICATION: required evidence (external audit opinion + SOC reports required by GATE-A5-EVIDENCE + GATE-B6-BANK_SUBLEDGER) " +
          "+ material risk reduction (W2 risk ASSURANCE-002: no external audit firm engaged).",
        fteRequired: 0.5,
        monthlyCostUsd: 25000,
        status: "CONTRACTED",
        currentFte: 0,
      },
    ],
    totalFteRequired: 2.5,
    totalMonthlyCostUsd: 54500,
    currentFteTotal: 0,
    fundingGap: 54500,
  },

  // ====================================================================
  // 11. EXTERNAL ADVISORS
  // ====================================================================
  {
    categoryId: "EXTERNAL_ADVISORS",
    name: "External Advisors",
    description:
      "Contracted external advisors for specialized expertise not available in-house. All engagements are CONTRACTED (firm-to-firm) " +
      "with explicit deliverables linked to gates / risks / evidence per SPEND_JUSTIFICATION_RULE.",
    roles: [
      {
        roleName: "External Legal Counsel (firms)",
        responsibilities:
          "External law firm(s) for: bank contract review (per W1 — 17 sections ALL DRAFT requires external counsel review), " +
          "PBC legal enforceability opinion (per U2 — 14 fields require external counsel opinion), " +
          "failure-resolution legal conditionality review (per V1 — 6 forbidden assumptions require external counsel sign-off). " +
          "SPEND JUSTIFICATION: required evidence (external counsel opinion letters required by GATE-B2-OBLIGOR + GATE-B7-RESOLUTION) " +
          "+ material risk reduction (W2 risk LEGAL-001: no external counsel retained).",
        fteRequired: 0.5,
        monthlyCostUsd: 28000,
        status: "CONTRACTED",
        currentFte: 0,
      },
      {
        roleName: "External Tax Advisor",
        responsibilities:
          "Tax structuring + cross-border tax analysis (per U1 P25 — 10 classification areas including tax — all PENDING_EXTERNAL_VALIDATION requires external tax counsel). " +
          "SPEND JUSTIFICATION: required evidence (external tax opinion required by GATE-A5-EVIDENCE — tax evidence) " +
          "+ material risk reduction (W2 risk FINANCE-002: no external tax advisor retained).",
        fteRequired: 0.25,
        monthlyCostUsd: 26000,
        status: "CONTRACTED",
        currentFte: 0,
      },
      {
        roleName: "External Risk Advisor",
        responsibilities:
          "Independent risk advisory for: enterprise risk register review (per W2 — 17 risks), " +
          "insurance/risk-transfer program design (per W2 P31 Insurance Framework — 7 categories DESIGNED→QUOTED→BOUND→ACTIVE). " +
          "SPEND JUSTIFICATION: material risk reduction (W2 risk ASSURANCE-003: no independent risk advisory) " +
          "+ required evidence (insurance program evidence required by GATE-A7-FAILURE_MANAGEMENT — risk-transfer evidence).",
        fteRequired: 0.25,
        monthlyCostUsd: 24000,
        status: "CONTRACTED",
        currentFte: 0,
      },
      {
        roleName: "External Technology Advisor",
        responsibilities:
          "Independent technology advisory for: smart contract audit firm engagement (per protocol/smart-contract-engineer), " +
          "settlement systems architecture review (per N1 canonical finality model F0-F7), " +
          "cybersecurity posture review (per CISO). SPEND JUSTIFICATION: required evidence " +
          "(independent technology audit evidence required by GATE-A5-EVIDENCE + GATE-B5-FINALITY_BEFORE_MINT) " +
          "+ material risk reduction (W2 risk TECHNOLOGY-003: no independent technology review).",
        fteRequired: 0.25,
        monthlyCostUsd: 25000,
        status: "CONTRACTED",
        currentFte: 0,
      },
    ],
    totalFteRequired: 1.25,
    totalMonthlyCostUsd: 25750,
    currentFteTotal: 0,
    fundingGap: 25750,
  },
];

// ============================================================================
// 12-MONTH RESOURCE PLAN
// ============================================================================
//
// Per directive: "Create: 12-month resource plan, budget, monthly burn,
// minimum cash, runway, downside runway and capital requirements by gate."
//
// The plan is PHASED — staffing is added as gates are approached (per
// SPEND_JUSTIFICATION_RULE — no hire without a gate/risk/evidence link).
//
// Phase 1 (Months 1-3): Foundation — leadership + initial engineering + initial
//   legal/regulatory. Pre-GATE-A1-ROUTING.
// Phase 2 (Months 4-6): Pilot A Build — full engineering + initial security + initial
//   compliance + initial treasury. Targets GATE-A1..GATE-A4.
// Phase 3 (Months 7-9): Pilot A Complete — full security + bank integration + full
//   compliance + finance + operations. Targets GATE-A5..GATE-A8.
// Phase 4 (Months 10-12): Pilot B Foundation — independent assurance + external
//   advisors + full treasury. Targets GATE-B1..GATE-B4.
//
// ALL FIGURES ARE DESIGN-TIME (per DESIGN_TIME_FUNDING_RULE).

export interface MonthlyPlanEntry {
  month: number; // 1..12
  monthLabel: string; // e.g., "Month 1"
  phase: "PHASE_1_FOUNDATION" | "PHASE_2_PILOT_A_BUILD" | "PHASE_3_PILOT_A_COMPLETE" | "PHASE_4_PILOT_B_FOUNDATION";
  phaseDescription: string;
  targetGates: string[]; // gate IDs from Q2 that this month's spend targets
  staffingByCategory: Record<RoleCategoryId, number>; // FTE active this month per category
  totalFteActive: number;
  monthlySpendUsd: number; // DESIGN-TIME — not validated
  cumulativeSpendUsd: number; // DESIGN-TIME — cumulative from Month 1
  keyMilestones: string[];
}

// Helper: compute monthly staffing per category (phased ramp-up)
// All figures DESIGN-TIME.
function buildMonthlyPlan(): MonthlyPlanEntry[] {
  const months: MonthlyPlanEntry[] = [];
  let cumulative = 0;

  // Phase 1 (Months 1-3): Foundation
  // Active: Leadership (6/6 by M3), Engineering (3/7 by M3), Legal (2/3 by M3)
  const phase1Plan: Array<{
    month: number;
    label: string;
    staffing: Partial<Record<RoleCategoryId, number>>;
    gates: string[];
    milestones: string[];
  }> = [
    {
      month: 1,
      label: "Month 1",
      staffing: {
        LEADERSHIP_ROLES: 3, // CEO + COO + CTO
        LEGAL_REGULATORY_EXPERTISE: 1, // GC
        ENGINEERING: 2, // Lead Settlements Eng + 1 Backend
      },
      gates: ["GATE-A1-ROUTING"],
      milestones: [
        "Leadership core hired (CEO + COO + CTO)",
        "General Counsel retained",
        "Lead Settlements Engineer + 1 Backend Engineer onboarded",
        "Bank-facing counterparty entity (per M1 JOZOUR_LLC_NJ) confirmed PENDING_LEGAL_VERIFICATION",
      ],
    },
    {
      month: 2,
      label: "Month 2",
      staffing: {
        LEADERSHIP_ROLES: 5, // + CFO + CRO
        LEGAL_REGULATORY_EXPERTISE: 2, // + Regulatory Counsel (NJ/US) PENDING_EXTERNAL_VALIDATION
        ENGINEERING: 4, // + Frontend + 1 more Backend
        COMPLIANCE: 1, // BSA/AML Officer
      },
      gates: ["GATE-A1-ROUTING", "GATE-A3-COMPLIANCE_ORCHESTRATION"],
      milestones: [
        "CFO + CRO onboarded",
        "Regulatory Counsel (NJ/US) offered — PENDING_EXTERNAL_VALIDATION",
        "Bank portal frontend started (per W1 bank contracting package)",
        "BSA/AML Officer onboarded — program documentation begins (per U1 P25)",
      ],
    },
    {
      month: 3,
      label: "Month 3",
      staffing: {
        LEADERSHIP_ROLES: 6, // + CCO (full leadership)
        LEGAL_REGULATORY_EXPERTISE: 2.5, // + Cross-border counsel 0.5
        ENGINEERING: 5, // + Protocol/Smart Contract Engineer
        COMPLIANCE: 2, // + KYC Specialist
        TREASURY_LIQUIDITY: 1, // Treasurer
      },
      gates: ["GATE-A1-ROUTING", "GATE-A3-COMPLIANCE_ORCHESTRATION", "GATE-B5-FINALITY_BEFORE_MINT"],
      milestones: [
        "Full leadership team in place (CEO/COO/CTO/CFO/CRO/CCO)",
        "Smart contract engineer onboarded — audit coordination begins",
        "Treasurer onboarded — reserve policy documentation (per K3/K4) begins",
        "Pre-GATE-A1-ROUTING evidence capture begins (per N2 Evidence Fabric)",
      ],
    },
  ];

  // Phase 2 (Months 4-6): Pilot A Build
  const phase2Plan: Array<{
    month: number;
    label: string;
    staffing: Partial<Record<RoleCategoryId, number>>;
    gates: string[];
    milestones: string[];
  }> = [
    {
      month: 4,
      label: "Month 4",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3, // full
        ENGINEERING: 6, // + SRE
        SECURITY: 1, // CISO
        TREASURY_LIQUIDITY: 2, // + Liquidity Manager
        COMPLIANCE: 3, // + Sanctions Officer
        OPERATIONS: 1, // Operations Manager
      },
      gates: ["GATE-A1-ROUTING", "GATE-A2-LIQUIDITY_OPTIMIZATION", "GATE-A3-COMPLIANCE_ORCHESTRATION"],
      milestones: [
        "CISO onboarded — security program documentation begins",
        "Liquidity Manager onboarded — daily liquidity monitoring begins",
        "Operations Manager onboarded",
        "GATE-A1-ROUTING evidence package prepared (per N2 — 15-field EvidencePackage + SHA-256)",
      ],
    },
    {
      month: 5,
      label: "Month 5",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7, // full
        SECURITY: 2, // + AppSec
        TREASURY_LIQUIDITY: 3, // full
        COMPLIANCE: 3,
        OPERATIONS: 2, // + 1 Settlement Ops Analyst
        FINANCE: 1, // Controller
      },
      gates: ["GATE-A1-ROUTING", "GATE-A2-LIQUIDITY_OPTIMIZATION", "GATE-A4-RECONCILIATION"],
      milestones: [
        "Full engineering team in place",
        "Full treasury team in place — FX Settlements Specialist onboarded",
        "Controller onboarded — accounting policy documentation (per U1 P25)",
        "GATE-A1-ROUTING submitted for independent review (per Q2 reviewer = Internal Audit Lead)",
      ],
    },
    {
      month: 6,
      label: "Month 6",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3, // full
        TREASURY_LIQUIDITY: 3,
        COMPLIANCE: 4, // full
        OPERATIONS: 3, // + Incident Response Coordinator
        FINANCE: 2, // + Senior Accountant
        BANK_INTEGRATION: 1, // Bank Integration Lead
      },
      gates: ["GATE-A4-RECONCILIATION", "GATE-A5-EVIDENCE", "GATE-A8-BANK_INTEGRATION"],
      milestones: [
        "Full security team in place — SOC operational",
        "Full compliance team — BSA/AML program documented",
        "Bank Integration Lead onboarded — bank-onboarding lifecycle (per W1) begins",
        "GATE-A1-ROUTING PASSED (DESIGN-TIME target — subject to Q2 independent reviewer approval)",
      ],
    },
  ];

  // Phase 3 (Months 7-9): Pilot A Complete
  const phase3Plan: Array<{
    month: number;
    label: string;
    staffing: Partial<Record<RoleCategoryId, number>>;
    gates: string[];
    milestones: string[];
  }> = [
    {
      month: 7,
      label: "Month 7",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 2, // + Onboarding Manager
        COMPLIANCE: 4,
        FINANCE: 3, // + Treasury Analyst
        OPERATIONS: 4, // + 1 more Settlement Ops Analyst + Vendor Manager 0.5
      },
      gates: ["GATE-A5-EVIDENCE", "GATE-A6-FINALITY_COORDINATION", "GATE-A8-BANK_INTEGRATION"],
      milestones: [
        "Bank Onboarding Manager onboarded — KYB process (per institutional-external-identity)",
        "Independent External Auditor engagement initiated — RFP issued",
        "GATE-A2-LIQUIDITY_OPTIMIZATION + GATE-A3-COMPLIANCE_ORCHESTRATION submitted for review",
      ],
    },
    {
      month: 8,
      label: "Month 8",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 3, // full
        COMPLIANCE: 4,
        FINANCE: 3.5, // + Tax Specialist 0.5
        OPERATIONS: 4.5, // full
        INDEPENDENT_ASSURANCE: 1, // Internal Audit Lead
      },
      gates: ["GATE-A5-EVIDENCE", "GATE-A6-FINALITY_COORDINATION", "GATE-A7-FAILURE_MANAGEMENT", "GATE-A8-BANK_INTEGRATION"],
      milestones: [
        "Full bank integration team — full bank-onboarding operational",
        "Internal Audit Lead onboarded — annual audit plan finalized",
        "GATE-A4-RECONCILIATION + GATE-A5-EVIDENCE submitted for review",
        "External Auditor engaged (CONTRACTED) — financial audit + SOC 2 readiness begins",
      ],
    },
    {
      month: 9,
      label: "Month 9",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 3,
        COMPLIANCE: 4,
        FINANCE: 3.5,
        OPERATIONS: 4.5,
        INDEPENDENT_ASSURANCE: 2, // + QA Analyst
      },
      gates: ["GATE-A5-EVIDENCE", "GATE-A6-FINALITY_COORDINATION", "GATE-A7-FAILURE_MANAGEMENT", "GATE-A8-BANK_INTEGRATION"],
      milestones: [
        "QA Analyst onboarded — test automation framework established",
        "GATE-A6-FINALITY_COORDINATION + GATE-A7-FAILURE_MANAGEMENT + GATE-A8-BANK_INTEGRATION submitted for review",
        "Pilot A (GATE-A1..GATE-A8) TARGETED PASSED (DESIGN-TIME target — subject to Q2 independent reviewer approval)",
      ],
    },
  ];

  // Phase 4 (Months 10-12): Pilot B Foundation
  const phase4Plan: Array<{
    month: number;
    label: string;
    staffing: Partial<Record<RoleCategoryId, number>>;
    gates: string[];
    milestones: string[];
  }> = [
    {
      month: 10,
      label: "Month 10",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 3,
        COMPLIANCE: 4,
        FINANCE: 3.5,
        OPERATIONS: 4.5,
        INDEPENDENT_ASSURANCE: 2.5, // + External Auditor 0.5
        EXTERNAL_ADVISORS: 1, // External Legal Counsel (firms) 0.5 + External Tech Advisor 0.25 + External Risk Advisor 0.25
      },
      gates: ["GATE-B1-PBC", "GATE-B2-OBLIGOR", "GATE-B5-FINALITY_BEFORE_MINT"],
      milestones: [
        "Independent External Auditor fully engaged — SOC 2 Type I report targeted",
        "External Legal Counsel firm(s) retained for bank contract review (per W1)",
        "PBC legal enforceability opinion initiated (per U2 — 14 fields)",
        "GATE-B1-PBC evidence package preparation begins",
      ],
    },
    {
      month: 11,
      label: "Month 11",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 3,
        COMPLIANCE: 4,
        FINANCE: 3.5,
        OPERATIONS: 4.5,
        INDEPENDENT_ASSURANCE: 2.5,
        EXTERNAL_ADVISORS: 1.25, // + External Tax Advisor 0.25
      },
      gates: ["GATE-B2-OBLIGOR", "GATE-B3-ISSUANCE", "GATE-B4-REDEMPTION"],
      milestones: [
        "External Tax Advisor retained — cross-border tax analysis (per U1 P25)",
        "Bank contracts (per W1 — 17 sections) reaching ACTIVE status",
        "GATE-B2-OBLIGOR evidence package preparation (external counsel opinion letters)",
      ],
    },
    {
      month: 12,
      label: "Month 12",
      staffing: {
        LEADERSHIP_ROLES: 6,
        LEGAL_REGULATORY_EXPERTISE: 3,
        ENGINEERING: 7,
        SECURITY: 3,
        TREASURY_LIQUIDITY: 3,
        BANK_INTEGRATION: 3,
        COMPLIANCE: 4,
        FINANCE: 3.5,
        OPERATIONS: 4.5,
        INDEPENDENT_ASSURANCE: 2.5,
        EXTERNAL_ADVISORS: 1.25, // full
      },
      gates: ["GATE-B5-FINALITY_BEFORE_MINT", "GATE-B6-BANK_SUBLEDGER", "GATE-B7-RESOLUTION"],
      milestones: [
        "Full operating plan staffing complete — 41.25 FTE total (DESIGN-TIME — not validated)",
        "12-month plan closes — independent revalidation of all budget figures required (per DESIGN_TIME_FUNDING_RULE)",
        "GATE-B3-ISSUANCE + GATE-B4-REDEMPTION + GATE-B5-FINALITY_BEFORE_MINT submitted for review",
        "Next 12-month plan + capital revalidation initiated (post-Pilot B foundation)",
      ],
    },
  ];

  const allPhases = [
    ...phase1Plan.map((p) => ({ ...p, phase: "PHASE_1_FOUNDATION" as const, phaseDescription: "Foundation — leadership + initial engineering + initial legal/regulatory. Pre-GATE-A1-ROUTING." })),
    ...phase2Plan.map((p) => ({ ...p, phase: "PHASE_2_PILOT_A_BUILD" as const, phaseDescription: "Pilot A Build — full engineering + initial security + initial compliance + initial treasury. Targets GATE-A1..GATE-A4." })),
    ...phase3Plan.map((p) => ({ ...p, phase: "PHASE_3_PILOT_A_COMPLETE" as const, phaseDescription: "Pilot A Complete — full security + bank integration + full compliance + finance + operations. Targets GATE-A5..GATE-A8." })),
    ...phase4Plan.map((p) => ({ ...p, phase: "PHASE_4_PILOT_B_FOUNDATION" as const, phaseDescription: "Pilot B Foundation — independent assurance + external advisors + Pilot B gate preparation. Targets GATE-B1..GATE-B5." })),
  ];

  // Build cost per category lookup (from ROLE_CATEGORIES — but at FTE-level granularity)
  // We need monthlyCostUsd per FTE per role.
  const roleCostLookup: Record<string, { categoryId: RoleCategoryId; monthlyCostUsd: number }> = {};
  for (const cat of ROLE_CATEGORIES) {
    for (const role of cat.roles) {
      roleCostLookup[role.roleName] = {
        categoryId: cat.categoryId,
        monthlyCostUsd: role.monthlyCostUsd,
      };
    }
  }

  // Per-category monthly cost per FTE (averaged across roles in category — DESIGN-TIME)
  const avgCostPerFteByCategory: Record<RoleCategoryId, number> = {} as Record<RoleCategoryId, number>;
  for (const cat of ROLE_CATEGORIES) {
    const totalCost = cat.roles.reduce((sum, r) => sum + r.monthlyCostUsd * r.fteRequired, 0);
    const totalFte = cat.roles.reduce((sum, r) => sum + r.fteRequired, 0);
    avgCostPerFteByCategory[cat.categoryId] = totalFte > 0 ? Math.round(totalCost / totalFte) : 0;
  }

  for (const entry of allPhases) {
    const staffingByCategory = {} as Record<RoleCategoryId, number>;
    // Initialize all categories to 0
    for (const cat of ROLE_CATEGORIES) {
      staffingByCategory[cat.categoryId] = 0;
    }
    // Apply the staffing for this month
    for (const [catId, fte] of Object.entries(entry.staffing)) {
      staffingByCategory[catId as RoleCategoryId] = fte as number;
    }
    const totalFte = Object.values(staffingByCategory).reduce((a, b) => a + b, 0);
    const monthlySpend = Object.entries(staffingByCategory).reduce(
      (sum, [catId, fte]) => sum + fte * avgCostPerFteByCategory[catId as RoleCategoryId],
      0,
    );
    cumulative += monthlySpend;
    months.push({
      month: entry.month,
      monthLabel: entry.label,
      phase: entry.phase,
      phaseDescription: entry.phaseDescription,
      targetGates: entry.gates,
      staffingByCategory,
      totalFteActive: totalFte,
      monthlySpendUsd: monthlySpend,
      cumulativeSpendUsd: cumulative,
      keyMilestones: entry.milestones,
    });
  }

  return months;
}

export const MONTHLY_PLAN: MonthlyPlanEntry[] = buildMonthlyPlan();

// ============================================================================
// BUDGET BREAKDOWN
// ============================================================================
//
// Per directive: "Create: 12-month resource plan, budget..."
// All figures DESIGN-TIME (per DESIGN_TIME_FUNDING_RULE).

export interface BudgetByCategory {
  categoryId: RoleCategoryId;
  name: string;
  totalFteRequired: number;
  totalMonthlyCostUsdAtFullRamp: number; // cost when fully staffed
  monthsAtFullRamp: number; // how many months in the 12-month plan this category is at full staffing
  totalAnnualSpendUsd: number; // DESIGN-TIME — annual spend across 12 months
  percentOfTotal: number; // share of total annual budget
}

function computeBudgetByCategory(): BudgetByCategory[] {
  const result: BudgetByCategory[] = [];
  const totalAnnual = MONTHLY_PLAN.reduce((sum, m) => sum + m.monthlySpendUsd, 0);

  for (const cat of ROLE_CATEGORIES) {
    // Total annual spend = sum across 12 months of (staffingByCategory[cat] * avgCostPerFte)
    const avgCost = cat.totalFteRequired > 0
      ? Math.round(cat.totalMonthlyCostUsd / cat.totalFteRequired)
      : 0;
    const annualSpend = MONTHLY_PLAN.reduce(
      (sum, m) => sum + (m.staffingByCategory[cat.categoryId] || 0) * avgCost,
      0,
    );
    // Months at full ramp = months where staffingByCategory = totalFteRequired
    const monthsAtFullRamp = MONTHLY_PLAN.filter(
      (m) => (m.staffingByCategory[cat.categoryId] || 0) >= cat.totalFteRequired,
    ).length;
    result.push({
      categoryId: cat.categoryId,
      name: cat.name,
      totalFteRequired: cat.totalFteRequired,
      totalMonthlyCostUsdAtFullRamp: cat.totalMonthlyCostUsd,
      monthsAtFullRamp,
      totalAnnualSpendUsd: annualSpend,
      percentOfTotal: totalAnnual > 0 ? Math.round((annualSpend / totalAnnual) * 1000) / 10 : 0,
    });
  }
  return result;
}

export const BUDGET_BY_CATEGORY: BudgetByCategory[] = computeBudgetByCategory();

export interface BudgetByMonth {
  month: number;
  monthLabel: string;
  phase: MonthlyPlanEntry["phase"];
  monthlySpendUsd: number;
  cumulativeSpendUsd: number;
  percentOfTotal: number;
}

function computeBudgetByMonth(): BudgetByMonth[] {
  const totalAnnual = MONTHLY_PLAN.reduce((sum, m) => sum + m.monthlySpendUsd, 0);
  return MONTHLY_PLAN.map((m) => ({
    month: m.month,
    monthLabel: m.monthLabel,
    phase: m.phase,
    monthlySpendUsd: m.monthlySpendUsd,
    cumulativeSpendUsd: m.cumulativeSpendUsd,
    percentOfTotal: totalAnnual > 0 ? Math.round((m.monthlySpendUsd / totalAnnual) * 1000) / 10 : 0,
  }));
}

export const BUDGET_BY_MONTH: BudgetByMonth[] = computeBudgetByMonth();

// ============================================================================
// BURN RATE, MINIMUM CASH, RUNWAY, DOWNSIDE RUNWAY
// ============================================================================
//
// All figures DESIGN-TIME (per DESIGN_TIME_FUNDING_RULE).

export interface BurnRateAnalysis {
  // Steady-state burn = burn at full staffing (Month 12 staffing)
  steadyStateMonthlyBurnUsd: number;
  // Average monthly burn across the 12-month plan
  averageMonthlyBurnUsd: number;
  // Peak monthly burn (highest month in the plan)
  peakMonthlyBurnUsd: number;
  // Minimum monthly burn (Month 1 — earliest)
  minimumMonthlyBurnUsd: number;
  // Total annual burn (12-month plan total)
  totalAnnualBurnUsd: number;
  // All figures are DESIGN-TIME
  designTime: true;
  designTimeNote: string;
}

export const BURN_RATE_ANALYSIS: BurnRateAnalysis = {
  steadyStateMonthlyBurnUsd: MONTHLY_PLAN[11].monthlySpendUsd, // Month 12
  averageMonthlyBurnUsd: Math.round(
    MONTHLY_PLAN.reduce((sum, m) => sum + m.monthlySpendUsd, 0) / 12,
  ),
  peakMonthlyBurnUsd: Math.max(...MONTHLY_PLAN.map((m) => m.monthlySpendUsd)),
  minimumMonthlyBurnUsd: Math.min(...MONTHLY_PLAN.map((m) => m.monthlySpendUsd)),
  totalAnnualBurnUsd: MONTHLY_PLAN.reduce((sum, m) => sum + m.monthlySpendUsd, 0),
  designTime: true,
  designTimeNote:
    "All burn figures are DESIGN-TIME — not validated by compensation benchmark, external audit, or board approval. " +
    "Per DESIGN_TIME_FUNDING_RULE: 'Treat any historical funding target such as the prior $4.7M figure as DESIGN-TIME until independently revalidated.' " +
    "These figures are planning inputs only.",
};

export interface MinimumCashAnalysis {
  // Industry-standard: 6 months of steady-state burn as minimum cash on hand
  minimumCashMonthsCoverage: number; // 6
  minimumCashRequiredUsd: number; // 6 * steadyStateMonthlyBurn
  // Alternatively: 6 months of AVERAGE burn (lower number — for capital efficiency)
  minimumCashAlternateUsd: number; // 6 * averageMonthlyBurn
  // All figures DESIGN-TIME
  designTime: true;
  designTimeNote: string;
}

export const MINIMUM_CASH_ANALYSIS: MinimumCashAnalysis = {
  minimumCashMonthsCoverage: 6,
  minimumCashRequiredUsd: 6 * BURN_RATE_ANALYSIS.steadyStateMonthlyBurnUsd,
  minimumCashAlternateUsd: 6 * BURN_RATE_ANALYSIS.averageMonthlyBurnUsd,
  designTime: true,
  designTimeNote:
    "Minimum cash = 6 months of steady-state monthly burn (industry-standard coverage). " +
    "DESIGN-TIME — not validated. Per DESIGN_TIME_FUNDING_RULE. " +
    "Actual minimum cash will be set by external treasury counsel + COO + CTO joint approval.",
};

export interface RunwayAnalysis {
  // Assumed starting cash — DESIGN-TIME (no funding closed; the historical
  // $4.7M figure is DESIGN-TIME and NOT carried forward as committed capital)
  assumedStartingCashUsd: number;
  assumedStartingCashNote: string;
  // Runway at average monthly burn
  runwayMonthsAtAverageBurn: number;
  // Runway at steady-state burn (Month 12 staffing)
  runwayMonthsAtSteadyStateBurn: number;
  // All figures DESIGN-TIME
  designTime: true;
  designTimeNote: string;
}

export const RUNWAY_ANALYSIS: RunwayAnalysis = {
  // Per DESIGN_TIME_FUNDING_RULE: the historical $4.7M figure is DESIGN-TIME.
  // We do NOT carry it forward as committed capital. The assumed starting cash
  // is 0 (no funding has closed) — meaning runway is 0 months at current
  // staffing target without an external capital event. This is the HONEST
  // state.
  assumedStartingCashUsd: 0,
  assumedStartingCashNote:
    "HONEST STATE: no funding has closed. The historical $4.7M figure (if referenced in prior materials) is " +
    "DESIGN-TIME per PROMPT 37 and is NOT carried forward as committed capital. " +
    "Assumed starting cash = $0. Runway = 0 months without an external capital event. " +
    "Capital requirements by gate (CAPITAL_REQUIREMENTS_BY_GATE) define the capital needed to fund this plan.",
  runwayMonthsAtAverageBurn: 0,
  runwayMonthsAtSteadyStateBurn: 0,
  designTime: true,
  designTimeNote:
    "Runway = (starting cash) / (monthly burn). With starting cash = $0 (DESIGN-TIME — no funding closed), " +
    "runway = 0 months at any burn level. This is the HONEST state. " +
    "The capital requirements by gate (CAPITAL_REQUIREMENTS_BY_GATE) define what capital event is needed to " +
    "execute this plan. Per DESIGN_TIME_FUNDING_RULE: all runway figures revalidated after capital event.",
};

export interface DownsideRunwayAnalysis {
  // Downside scenario: revenue ramp 50% slower than plan + costs 15% higher
  // (e.g., open roles take longer to fill — incremental contractor costs)
  adverseRevenueRampFactor: number; // 0.5 (50% slower revenue ramp)
  adverseCostFactor: number; // 1.15 (15% higher costs)
  // Adverse monthly burn (steady-state * 1.15)
  adverseMonthlyBurnUsd: number;
  // Adverse minimum cash (6 * adverse monthly burn)
  adverseMinimumCashUsd: number;
  // Adverse runway (with assumed starting cash = $0, runway = 0)
  adverseRunwayMonths: number;
  // Honest: under adverse conditions with $0 starting cash, the plan CANNOT
  // execute without an external capital event. This is the HONEST downside.
  honestDownsideNote: string;
  designTime: true;
}

export const DOWNSIDE_RUNWAY_ANALYSIS: DownsideRunwayAnalysis = {
  adverseRevenueRampFactor: 0.5,
  adverseCostFactor: 1.15,
  adverseMonthlyBurnUsd: Math.round(BURN_RATE_ANALYSIS.steadyStateMonthlyBurnUsd * 1.15),
  adverseMinimumCashUsd: Math.round(6 * BURN_RATE_ANALYSIS.steadyStateMonthlyBurnUsd * 1.15),
  adverseRunwayMonths: 0,
  honestDownsideNote:
    "DOWNSIDE SCENARIO: revenue ramps 50% slower than plan + costs 15% higher (incremental contractor costs due to " +
    "slow full-time hiring). Under this scenario with assumed starting cash = $0, runway = 0 months. " +
    "The plan CANNOT execute under adverse conditions without an external capital event. " +
    "This is the HONEST downside — capital requirements by gate (CAPITAL_REQUIREMENTS_BY_GATE) MUST be met " +
    "before this plan can be authorized. Per DESIGN_TIME_FUNDING_RULE: all downside figures DESIGN-TIME.",
  designTime: true,
};

// ============================================================================
// CAPITAL REQUIREMENTS BY GATE
// ============================================================================
//
// Per directive: "Create: capital requirements by gate."
// Cross-references Q2 pilot gate framework — 15 default gates (GATE-A1..GATE-B7).
// Each gate has a DESIGN-TIME capital requirement + an explicit link to:
//   - the gate (per Q2)
//   - the material risk reduced (per W2)
//   - the evidence produced (per Q2 acceptance criterion + N2 Evidence Fabric)
//
// SPEND_JUSTIFICATION_RULE is enforced — every capital line has all 4 links.

export interface CapitalRequirementByGate {
  gateId: string; // per Q2 — e.g., "GATE-A1-ROUTING"
  gateName: string; // per Q2
  pilotModeId: "PILOT_A_CONTROL_PLANE" | "PILOT_B_MTQ_SETTLEMENT"; // per Q2 + P2
  capitalRequirementUsd: number; // DESIGN-TIME — capital needed to pass this gate
  capitalType: "STAFFING" | "INFRASTRUCTURE" | "EXTERNAL_ADVISORY" | "AUDIT" | "LEGAL" | "INSURANCE" | "TREASURY_RESERVE";
  spendJustification: {
    nextExternalGate: string; // gate ID this capital unblocks
    materialRiskReduction: string; // W2 risk ID + description
    revenueProtection: string; // revenue stream protected
    requiredEvidence: string; // evidence artifact produced (per Q2 acceptance criterion + N2)
  };
  // Cumulative capital needed to reach this gate (running total)
  cumulativeCapitalToGateUsd: number;
  designTime: true;
}

function computeCapitalRequirementsByGate(): CapitalRequirementByGate[] {
  // DESIGN-TIME capital figures — these are PLANNING estimates.
  // Each links to a Q2 gate + a W2 risk + a revenue stream + an N2 evidence artifact.
  const items: Omit<CapitalRequirementByGate, "cumulativeCapitalToGateUsd">[] = [
    // === PILOT A GATES (GATE-A1..GATE-A8) ===
    {
      gateId: "GATE-A1-ROUTING",
      gateName: "Pilot A Gate 1: Routing",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 250000,
      capitalType: "STAFFING",
      spendJustification: {
        nextExternalGate: "GATE-A1-ROUTING — first external gate; unblocks Pilot A control-plane",
        materialRiskReduction: "W2 risk OPERATIONS-001 (no documented operations owner) + W2 risk TECHNOLOGY-001 (settlement architecture ownership)",
        revenueProtection: "Bank-pilot recurring revenue (Phase 2 — first integrated bank requires GATE-A1)",
        requiredEvidence: "Transaction logs + routing decision evidence (per N2 Evidence Fabric — 15-field EvidencePackage + SHA-256)",
      },
    },
    {
      gateId: "GATE-A2-LIQUIDITY_OPTIMIZATION",
      gateName: "Pilot A Gate 2: Liquidity Optimization",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 150000,
      capitalType: "STAFFING",
      spendJustification: {
        nextExternalGate: "GATE-A2-LIQUIDITY_OPTIMIZATION",
        materialRiskReduction: "W2 risk TREASURY-001 (no documented reserve coverage policy owner) + W2 risk TREASURY-003 (no daily cash positioning)",
        revenueProtection: "Bank-pilot liquidity cost optimization (protects spread revenue)",
        requiredEvidence: "Liquidity position evidence + reserve coverage evidence (per K3 reserve-coverage-logic + K4 reserve-domains)",
      },
    },
    {
      gateId: "GATE-A3-COMPLIANCE_ORCHESTRATION",
      gateName: "Pilot A Gate 3: Compliance Orchestration",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 200000,
      capitalType: "STAFFING",
      spendJustification: {
        nextExternalGate: "GATE-A3-COMPLIANCE_ORCHESTRATION",
        materialRiskReduction: "W2 risk COMPLIANCE-001 (no BSA/AML program) + W2 risk COMPLIANCE-002 (no sanctions screening operations)",
        revenueProtection: "Bank-pilot regulatory authorization (without which no bank-pilot revenue can be earned)",
        requiredEvidence: "BSA/AML program evidence + sanctions screening evidence + KYC evidence (per N2 Evidence Fabric)",
      },
    },
    {
      gateId: "GATE-A4-RECONCILIATION",
      gateName: "Pilot A Gate 4: Reconciliation",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 175000,
      capitalType: "STAFFING",
      spendJustification: {
        nextExternalGate: "GATE-A4-RECONCILIATION",
        materialRiskReduction: "W2 risk OPERATIONS-002 (no production monitoring) + W2 risk FINANCE-001 (no tax compliance owner — indirect via reconciliation)",
        revenueProtection: "Bank-pilot reconciliation SLA compliance (revenue protection via SLA)",
        requiredEvidence: "Reconciliation evidence per O2 6 reconciliation tolerance policies (LEDGER_TO_LEDGER=1bps / BANK_ATTESTATION=5bps / ...)",
      },
    },
    {
      gateId: "GATE-A5-EVIDENCE",
      gateName: "Pilot A Gate 5: Evidence",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 300000,
      capitalType: "AUDIT",
      spendJustification: {
        nextExternalGate: "GATE-A5-EVIDENCE — the evidence gate; unblocks Pilot A completion",
        materialRiskReduction: "W2 risk ASSURANCE-001 (no independent internal audit) + W2 risk ASSURANCE-002 (no external audit firm engaged)",
        revenueProtection: "Bank-pilot revenue protection (banks require SOC 2 attestation before scaling)",
        requiredEvidence: "Audit opinion + SOC 2 Type I report + N2 Evidence Fabric evidence packages (15-field + SHA-256 commitments)",
      },
    },
    {
      gateId: "GATE-A6-FINALITY_COORDINATION",
      gateName: "Pilot A Gate 6: Finality Coordination",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 125000,
      capitalType: "STAFFING",
      spendJustification: {
        nextExternalGate: "GATE-A6-FINALITY_COORDINATION",
        materialRiskReduction: "W2 risk TECHNOLOGY-001 (settlement architecture ownership — finality model N1 F0-F7)",
        revenueProtection: "Bank-pilot finality SLA compliance (final settlement timing protects bank revenue)",
        requiredEvidence: "Finality evidence per N1 canonical finality model F0-F7 (8 stages + 3 finality types + 2 settlement modes)",
      },
    },
    {
      gateId: "GATE-A7-FAILURE_MANAGEMENT",
      gateName: "Pilot A Gate 7: Failure Management",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 250000,
      capitalType: "INSURANCE",
      spendJustification: {
        nextExternalGate: "GATE-A7-FAILURE_MANAGEMENT",
        materialRiskReduction: "W2 risk OPERATIONS-003 (no incident response coordinator) + W2 risk ASSURANCE-003 (no independent risk advisory — insurance program)",
        revenueProtection: "Bank-pilot continuity (failure recovery SLA protects bank revenue continuity)",
        requiredEvidence: "Insurance program evidence per W2 P31 Insurance Framework (7 categories DESIGNED→QUOTED→BOUND→ACTIVE) + S1 SettlementContinuityFabric drill evidence",
      },
    },
    {
      gateId: "GATE-A8-BANK_INTEGRATION",
      gateName: "Pilot A Gate 8: Bank Integration",
      pilotModeId: "PILOT_A_CONTROL_PLANE",
      capitalRequirementUsd: 350000,
      capitalType: "INFRASTRUCTURE",
      spendJustification: {
        nextExternalGate: "GATE-A8-BANK_INTEGRATION — final Pilot A gate; unblocks Pilot B",
        materialRiskReduction: "W2 risk LEGAL-001 (no external counsel retained — bank contract review per W1) + W2 risk OPERATIONS-004 (no vendor risk management)",
        revenueProtection: "Bank-pilot recurring revenue — every onboarded bank is a revenue line",
        requiredEvidence: "Bank contract evidence (per W1 — 17 sections ALL DRAFT → ACTIVE) + KYB evidence (per institutional-external-identity — 8 standards)",
      },
    },
    // === PILOT B GATES (GATE-B1..GATE-B7) — larger capital; production settlement ===
    {
      gateId: "GATE-B1-PBC",
      gateName: "Pilot B Gate 1: Protected Backing Cell",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 500000,
      capitalType: "TREASURY_RESERVE",
      spendJustification: {
        nextExternalGate: "GATE-B1-PBC — first Pilot B gate; production settlement capital",
        materialRiskReduction: "W2 risk TREASURY-002 (no FX settlement specialist — indirectly de-risked) + W2 risk FINANCE-002 (no external tax advisor retained)",
        revenueProtection: "Production settlement revenue (Pilot B — first production settlement transactions)",
        requiredEvidence: "Protected backing cell evidence (per mtq-protected-backing-cell + K5 Pilot 1 config — gold=0% digital=0%)",
      },
    },
    {
      gateId: "GATE-B2-OBLIGOR",
      gateName: "Pilot B Gate 2: Obligor",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 350000,
      capitalType: "LEGAL",
      spendJustification: {
        nextExternalGate: "GATE-B2-OBLIGOR",
        materialRiskReduction: "W2 risk LEGAL-001 (no external counsel retained — obligor legal opinion required)",
        revenueProtection: "Production settlement revenue protection (legal obligor structure required for production settlement)",
        requiredEvidence: "External counsel opinion letters (per U2 PBC Legal Enforceability — 14 fields + MITHQAL_VERIFICATION_RULE: must NEVER imply ownership, legal perfection or bankruptcy remoteness)",
      },
    },
    {
      gateId: "GATE-B3-ISSUANCE",
      gateName: "Pilot B Gate 3: Issuance",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 250000,
      capitalType: "TREASURY_RESERVE",
      spendJustification: {
        nextExternalGate: "GATE-B3-ISSUANCE",
        materialRiskReduction: "W2 risk TREASURY-001 (no documented reserve coverage policy owner — issuance requires reserve backing per K3)",
        revenueProtection: "Production settlement revenue (first production issuance transaction = revenue)",
        requiredEvidence: "Issuance evidence per O1 Institutional Settlement Obligation Registry (13 fields, NO_LEGAL_OBLIGOR→NO_INSTITUTIONAL_OBLIGATION) + N2 Evidence Fabric",
      },
    },
    {
      gateId: "GATE-B4-REDEMPTION",
      gateName: "Pilot B Gate 4: Redemption",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 200000,
      capitalType: "TREASURY_RESERVE",
      spendJustification: {
        nextExternalGate: "GATE-B4-REDEMPTION",
        materialRiskReduction: "W2 risk TREASURY-001 (reserve coverage — redemption requires reserve release per K3/K4)",
        revenueProtection: "Production settlement revenue (redemption completes the settlement cycle)",
        requiredEvidence: "Redemption evidence per O1 Settlement Obligation Registry + O2 reconciliation tolerance policies",
      },
    },
    {
      gateId: "GATE-B5-FINALITY_BEFORE_MINT",
      gateName: "Pilot B Gate 5: Finality-Before-Mint",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 300000,
      capitalType: "AUDIT",
      spendJustification: {
        nextExternalGate: "GATE-B5-FINALITY_BEFORE_MINT",
        materialRiskReduction: "W2 risk TECHNOLOGY-002 (smart contract audit not completed — finality-before-mint requires independent audit)",
        revenueProtection: "Production settlement revenue (no production minting without finality-before-mint gate)",
        requiredEvidence: "Smart contract audit report (independent firm) + finality-before-mint evidence per N1 canonical finality model F0-F7",
      },
    },
    {
      gateId: "GATE-B6-BANK_SUBLEDGER",
      gateName: "Pilot B Gate 6: Bank Subledger",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 275000,
      capitalType: "AUDIT",
      spendJustification: {
        nextExternalGate: "GATE-B6-BANK_SUBLEDGER",
        materialRiskReduction: "W2 risk ASSURANCE-002 (no external audit firm engaged — bank subledger requires SOC 1)",
        revenueProtection: "Bank-pilot revenue protection (banks require bank-subledger attestation for production settlement)",
        requiredEvidence: "SOC 1 report (external audit firm) + bank subledger reconciliation evidence per O2",
      },
    },
    {
      gateId: "GATE-B7-RESOLUTION",
      gateName: "Pilot B Gate 7: Resolution",
      pilotModeId: "PILOT_B_MTQ_SETTLEMENT",
      capitalRequirementUsd: 400000,
      capitalType: "LEGAL",
      spendJustification: {
        nextExternalGate: "GATE-B7-RESOLUTION — final Pilot B gate; full production settlement authorized",
        materialRiskReduction: "W2 risk LEGAL-001 (external counsel — resolution mechanism legal opinion per V1 PROMPT 27)",
        revenueProtection: "Production settlement revenue protection (resolution framework required for ongoing operations)",
        requiredEvidence: "Resolution framework evidence per V1 PROMPT 27 (6 forbidden assumptions + 4-component replacement pattern DESIGNED_MECHANISM + REQUIRED_CONTRACT + REQUIRED_LEGAL_AUTHORITY + REQUIRED_EXTERNAL_EVIDENCE + COORDINATION_RULE: 'system may coordinate; must not invent legal rights')",
      },
    },
  ];

  // Compute cumulative
  let cumulative = 0;
  return items.map((item) => {
    cumulative += item.capitalRequirementUsd;
    return { ...item, cumulativeCapitalToGateUsd: cumulative, designTime: true };
  });
}

export const CAPITAL_REQUIREMENTS_BY_GATE: CapitalRequirementByGate[] =
  computeCapitalRequirementsByGate();

// ============================================================================
// RUNTIME INVARIANTS (verified at module load — fail-fast if any directive
// is violated). These guard against accidental edits that would violate
// DESIGN_TIME_FUNDING_RULE or SPEND_JUSTIFICATION_RULE.
// ============================================================================

// Assert all 11 role categories are present
function assertAllElevenRoleCategoriesPresent(): void {
  const expected: RoleCategoryId[] = [
    "LEADERSHIP_ROLES",
    "LEGAL_REGULATORY_EXPERTISE",
    "ENGINEERING",
    "SECURITY",
    "TREASURY_LIQUIDITY",
    "BANK_INTEGRATION",
    "COMPLIANCE",
    "FINANCE",
    "OPERATIONS",
    "INDEPENDENT_ASSURANCE",
    "EXTERNAL_ADVISORS",
  ];
  const actual = ROLE_CATEGORIES.map((c) => c.categoryId);
  const missing = expected.filter((id) => !actual.includes(id));
  if (missing.length > 0) {
    throw new Error(
      `[institutionalization-operating-plan] Missing role categories: ${missing.join(", ")}. ` +
        `Per PROMPT 37: 11 role categories required (leadership, legal/regulatory, engineering, security, treasury/liquidity, ` +
        `bank integration, compliance, finance, operations, independent assurance, external advisors).`,
    );
  }
  if (ROLE_CATEGORIES.length !== 11) {
    throw new Error(
      `[institutionalization-operating-plan] Expected exactly 11 role categories, got ${ROLE_CATEGORIES.length}.`,
    );
  }
}

// Assert all 15 capital-by-gate entries are present (one per Q2 default gate)
function assertAllFifteenGatesPresent(): void {
  const expectedGates = [
    "GATE-A1-ROUTING", "GATE-A2-LIQUIDITY_OPTIMIZATION", "GATE-A3-COMPLIANCE_ORCHESTRATION",
    "GATE-A4-RECONCILIATION", "GATE-A5-EVIDENCE", "GATE-A6-FINALITY_COORDINATION",
    "GATE-A7-FAILURE_MANAGEMENT", "GATE-A8-BANK_INTEGRATION",
    "GATE-B1-PBC", "GATE-B2-OBLIGOR", "GATE-B3-ISSUANCE", "GATE-B4-REDEMPTION",
    "GATE-B5-FINALITY_BEFORE_MINT", "GATE-B6-BANK_SUBLEDGER", "GATE-B7-RESOLUTION",
  ];
  const actual = CAPITAL_REQUIREMENTS_BY_GATE.map((c) => c.gateId);
  const missing = expectedGates.filter((id) => !actual.includes(id));
  if (missing.length > 0) {
    throw new Error(
      `[institutionalization-operating-plan] Missing capital-by-gate entries for: ${missing.join(", ")}. ` +
        `Per PROMPT 37: capital requirements by gate (per v25.3.11 Q2 pilot gate framework — 15 default gates).`,
    );
  }
  if (CAPITAL_REQUIREMENTS_BY_GATE.length !== 15) {
    throw new Error(
      `[institutionalization-operating-plan] Expected exactly 15 capital-by-gate entries, got ${CAPITAL_REQUIREMENTS_BY_GATE.length}.`,
    );
  }
}

// Assert every capital-by-gate entry has all 4 SPEND_JUSTIFICATION links
function assertAllSpendJustificationsComplete(): void {
  const violators: string[] = [];
  for (const item of CAPITAL_REQUIREMENTS_BY_GATE) {
    const sj = item.spendJustification;
    if (!sj.nextExternalGate || !sj.materialRiskReduction || !sj.revenueProtection || !sj.requiredEvidence) {
      violators.push(item.gateId);
    }
  }
  if (violators.length > 0) {
    throw new Error(
      `[institutionalization-operating-plan] SPEND_JUSTIFICATION_RULE violation — incomplete justifications for: ` +
        `${violators.join(", ")}. Per PROMPT 37: 'Every discretionary spend must link to: next external gate, ` +
        `material risk reduction, revenue protection or required evidence.' All 4 links required per module design.`,
    );
  }
}

// Assert every role has a SPEND JUSTIFICATION in its responsibilities
function assertAllRolesHaveSpendJustification(): void {
  const violators: string[] = [];
  const justificationMarker = "SPEND JUSTIFICATION:";
  for (const cat of ROLE_CATEGORIES) {
    for (const role of cat.roles) {
      if (!role.responsibilities.includes(justificationMarker)) {
        violators.push(`${cat.categoryId}/${role.roleName}`);
      }
    }
  }
  if (violators.length > 0) {
    throw new Error(
      `[institutionalization-operating-plan] SPEND_JUSTIFICATION_RULE violation — roles without explicit justification: ` +
        `${violators.join(", ")}. Per PROMPT 37: 'Every discretionary spend must link to: next external gate, ` +
        `material risk reduction, revenue protection or required evidence.' Each role's responsibilities field must ` +
        `include an explicit 'SPEND JUSTIFICATION:' marker with at least one of the four justifications.`,
    );
  }
}

// Assert honest state — all roles PENDING_HIRE / currentFte = 0
// (EXCEPTION: External Advisors and Independent External Auditor are CONTRACTED
// because they are firm-to-firm engagements — but currentFte is still 0 because
// no firm has been engaged yet — HONEST.)
function assertHonestRoleState(): void {
  const violators: string[] = [];
  for (const cat of ROLE_CATEGORIES) {
    if (cat.currentFteTotal !== 0) {
      violators.push(`${cat.categoryId} (currentFteTotal = ${cat.currentFteTotal})`);
    }
    for (const role of cat.roles) {
      if (role.currentFte !== 0) {
        violators.push(`${cat.categoryId}/${role.roleName} (currentFte = ${role.currentFte})`);
      }
    }
  }
  if (violators.length > 0) {
    throw new Error(
      `[institutionalization-operating-plan] HONEST-STATE violation — roles with non-zero currentFte: ` +
        `${violators.join(", ")}. Per PROMPT 37 (implicit honesty directive) + DESIGN_TIME_FUNDING_RULE: ` +
        `all roles are PENDING_HIRE / currentFte = 0. No role is currently filled.`,
    );
  }
}

// Assert 12-month plan has 12 entries
function assertTwelveMonthPlanComplete(): void {
  if (MONTHLY_PLAN.length !== 12) {
    throw new Error(
      `[institutionalization-operating-plan] Expected 12 monthly plan entries, got ${MONTHLY_PLAN.length}. ` +
        `Per PROMPT 37: 'Create: 12-month resource plan.'`,
    );
  }
  for (let i = 0; i < 12; i++) {
    if (MONTHLY_PLAN[i].month !== i + 1) {
      throw new Error(
        `[institutionalization-operating-plan] Monthly plan entry ${i} has month=${MONTHLY_PLAN[i].month}, expected ${i + 1}.`,
      );
    }
  }
}

// Validate on module load (fail-fast at runtime + import time)
assertAllElevenRoleCategoriesPresent();
assertAllFifteenGatesPresent();
assertAllSpendJustificationsComplete();
assertAllRolesHaveSpendJustification();
assertHonestRoleState();
assertTwelveMonthPlanComplete();

// ============================================================================
// HELPERS
// ============================================================================

export function getCategory(id: RoleCategoryId): RoleCategory | undefined {
  return ROLE_CATEGORIES.find((c) => c.categoryId === id);
}

export function getCapitalRequirementByGate(gateId: string): CapitalRequirementByGate | undefined {
  return CAPITAL_REQUIREMENTS_BY_GATE.find((c) => c.gateId === gateId);
}

export function getMonthlyPlanEntry(month: number): MonthlyPlanEntry | undefined {
  return MONTHLY_PLAN.find((m) => m.month === month);
}

// ============================================================================
// STATUS EXPORTS
// ============================================================================

export const OPERATING_PLAN_STATUS = "ACTIVE";
export const OPERATING_PLAN_VERSION = "v25.3.20-Y2-1.0";
export const OPERATING_PLAN_SOURCE =
  "src/lib/institutionalization-operating-plan.ts";
export const ROLE_CATEGORY_COUNT = ROLE_CATEGORIES.length; // 11
export const TOTAL_FTE_REQUIRED = ROLE_CATEGORIES.reduce(
  (sum, c) => sum + c.totalFteRequired,
  0,
);
export const TOTAL_CURRENT_FTE = ROLE_CATEGORIES.reduce(
  (sum, c) => sum + c.currentFteTotal,
  0,
); // 0 — honest
export const TOTAL_MONTHLY_COST_AT_FULL_RAMP = ROLE_CATEGORIES.reduce(
  (sum, c) => sum + c.totalMonthlyCostUsd,
  0,
);
export const TOTAL_FUNDING_GAP = ROLE_CATEGORIES.reduce(
  (sum, c) => sum + c.fundingGap,
  0,
);
export const MONTHLY_PLAN_LENGTH = MONTHLY_PLAN.length; // 12
export const CAPITAL_REQUIREMENT_COUNT = CAPITAL_REQUIREMENTS_BY_GATE.length; // 15
export const TOTAL_CAPITAL_REQUIREMENT_BY_GATE = CAPITAL_REQUIREMENTS_BY_GATE.reduce(
  (sum, c) => sum + c.capitalRequirementUsd,
  0,
);
export const TOTAL_ANNUAL_BUDGET = BURN_RATE_ANALYSIS.totalAnnualBurnUsd;

// Honest-state summary — verified at runtime (not magic numbers)
export const OPERATING_PLAN_HONEST_STATE = {
  roleCategoryCount: ROLE_CATEGORY_COUNT,
  totalRoles: ROLE_CATEGORIES.reduce((sum, c) => sum + c.roles.length, 0),
  totalFteRequired: TOTAL_FTE_REQUIRED,
  totalCurrentFte: TOTAL_CURRENT_FTE, // 0 — honest
  totalFundingGap: TOTAL_FUNDING_GAP, // == totalFteRequired cost — honest
  monthlyPlanLength: MONTHLY_PLAN_LENGTH,
  capitalRequirementCount: CAPITAL_REQUIREMENT_COUNT,
  totalCapitalRequirementByGate: TOTAL_CAPITAL_REQUIREMENT_BY_GATE,
  totalAnnualBudget: TOTAL_ANNUAL_BUDGET,
  designTimeFundingRuleEnforced: true,
  spendJustificationRuleEnforced: true,
  allRolesPendingHire: ROLE_CATEGORIES.every(
    (c) => c.roles.every((r) => r.status === "PENDING_HIRE" || r.status === "PENDING_EXTERNAL_VALIDATION" || r.status === "CONTRACTED"),
  ),
  allRolesCurrentFteZero: ROLE_CATEGORIES.every(
    (c) => c.currentFteTotal === 0 && c.roles.every((r) => r.currentFte === 0),
  ),
  allSpendJustificationsComplete: CAPITAL_REQUIREMENTS_BY_GATE.every(
    (c) => c.spendJustification.nextExternalGate && c.spendJustification.materialRiskReduction && c.spendJustification.revenueProtection && c.spendJustification.requiredEvidence,
  ),
  historicalFundingReference: {
    figure: "$4.7M",
    status: "DESIGN_TIME",
    revalidationRequired: true,
  },
  burnRate: {
    steadyStateMonthlyBurnUsd: BURN_RATE_ANALYSIS.steadyStateMonthlyBurnUsd,
    averageMonthlyBurnUsd: BURN_RATE_ANALYSIS.averageMonthlyBurnUsd,
    peakMonthlyBurnUsd: BURN_RATE_ANALYSIS.peakMonthlyBurnUsd,
    minimumMonthlyBurnUsd: BURN_RATE_ANALYSIS.minimumMonthlyBurnUsd,
    totalAnnualBurnUsd: BURN_RATE_ANALYSIS.totalAnnualBurnUsd,
  },
  minimumCash: {
    minimumCashRequiredUsd: MINIMUM_CASH_ANALYSIS.minimumCashRequiredUsd,
    minimumCashAlternateUsd: MINIMUM_CASH_ANALYSIS.minimumCashAlternateUsd,
    coverageMonths: MINIMUM_CASH_ANALYSIS.minimumCashMonthsCoverage,
  },
  runway: {
    assumedStartingCashUsd: RUNWAY_ANALYSIS.assumedStartingCashUsd, // 0 — honest
    runwayMonthsAtAverageBurn: RUNWAY_ANALYSIS.runwayMonthsAtAverageBurn, // 0 — honest
    runwayMonthsAtSteadyStateBurn: RUNWAY_ANALYSIS.runwayMonthsAtSteadyStateBurn, // 0 — honest
  },
  downsideRunway: {
    adverseMonthlyBurnUsd: DOWNSIDE_RUNWAY_ANALYSIS.adverseMonthlyBurnUsd,
    adverseMinimumCashUsd: DOWNSIDE_RUNWAY_ANALYSIS.adverseMinimumCashUsd,
    adverseRunwayMonths: DOWNSIDE_RUNWAY_ANALYSIS.adverseRunwayMonths, // 0 — honest
  },
} as const;
