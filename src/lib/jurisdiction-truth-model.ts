// src/lib/jurisdiction-truth-model.ts
//
// MITHQAL v25.3.21 — JURISDICTION TRUTH MODEL + CNY/CNH DISTINCTION
// (single source of truth for jurisdictional authorization truth — engineering
//  labels MUST NEVER be mistaken for legal authorization)
//
// Per PROMPT 41 (verbatim):
//   "Refactor the jurisdiction model so engineering labels can NEVER be mistaken
//    for legal authorization.
//    Canonical states must distinguish: SEED_DATA, PUBLIC-MATERIAL_TRIAGE,
//    LEGAL_REVIEW, INSTITUTIONALLY_VALIDATED, LICENSED_WHERE_REQUIRED,
//    RESTRICTED, PROHIBITED, UNKNOWN.
//    A jurisdiction with no independent legal validation must not be represented
//    as legally ALLOWED merely because an internal registry contains ALLOWED.
//    Make: UNKNOWN = CONSERVATIVE BLOCK unless a defined evidence package
//    explicitly moves the jurisdiction forward.
//    Audit all eight seeded jurisdictions and reconcile all conflicting registry
//    representations.
//    For RMB exposure, explicitly distinguish: onshore CNY; offshore CNH;
//    custody jurisdiction; conversion venue; settlement rail; sanctions/capital-
//    control constraints; legal accessibility.
//    Do not infer that holding a currency in a reserve is equivalent to having
//    lawful access to its domestic settlement system.
//    Any unsupported CNY/RMB path must remain conditional or blocked."
//
// CHANGE REQUEST: CR-2026-017 (per Architecture Freeze v25.3.15)
//   — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - 8 canonical jurisdiction states per PROMPT 41 (not ALLOWED/DENIED binary)
//   - UNKNOWN = CONSERVATIVE_BLOCK (NOT ALLOWED) per PROMPT 41
//   - All 8 seeded jurisdictions start as SEED_DATA or UNKNOWN (honest)
//   - CNY/CNH explicitly distinguished (onshore vs offshore, custody vs
//     conversion vs settlement rail vs legal accessibility)
//   - CRITICAL RULE: holding a currency in a reserve ≠ lawful access to its
//     domestic settlement system
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.0 (institutional-operating-model — JOZOUR_LLC_NJ bank-facing counterparty)
//   - v25.3.8 N1 (canonical finality model F0-F7 — jurisdiction gate at BM-10)
//   - v25.3.8 N2 (Institutional Evidence Fabric — jurisdiction evidence packages)
//   - v25.3.10 O2 (6 reconciliation tolerance policies — FX_VALUATION=20bps
//     applies to CNY/CNH reconciliation)
//   - v25.3.13 S1 (SettlementContinuityFabric — JURISDICTION_RESTRICTION event
//     × 7-stage lifecycle)
//   - v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE:
//     "the system may coordinate; it must not invent legal rights")
//   - v25.3.18 W2 (Enterprise Risk Register — jurisdiction risk entries)
//   - v25.3.21 Z1 P38 (Bank Onboarding Training — Treasury Briefing references
//     this module's CNY/CNH distinction)
//   - v25.3.21 Z1 P40 (Sharia/AAOIFI Governance — Sharia pathway is
//     jurisdiction-scoped per Z1 P41)
//
// HONEST-STATE RULES (per directive):
//   - 8 canonical states (NOT 2-state ALLOWED/DENIED binary).
//   - UNKNOWN = CONSERVATIVE_BLOCK — a jurisdiction with no independent legal
//     validation MUST NOT be represented as legally ALLOWED.
//   - All 8 seeded jurisdictions start as SEED_DATA or UNKNOWN (honest — no
//     independent legal validation has occurred).
//   - Engineering labels (registry values) MUST NEVER be mistaken for legal
//     authorization.
//   - For RMB exposure: onshore CNY vs offshore CNH explicitly distinguished
//     (different settlement rails, different capital controls, different
//     legal accessibility).
//   - CRITICAL RULE: holding a currency in a reserve is NOT equivalent to
//     having lawful access to its domestic settlement system.

// ============================================================================
// TYPES
// ============================================================================

// 8 canonical jurisdiction states per PROMPT 41 verbatim enumeration
export type JurisdictionState =
  | "SEED_DATA" // 1 — internal seed data only, no independent validation
  | "PUBLIC_MATERIAL_TRIAGE" // 2 — public-source materials triaged, no legal review
  | "LEGAL_REVIEW" // 3 — under review by qualified counsel (in progress)
  | "INSTITUTIONALLY_VALIDATED" // 4 — institutionally validated by qualified counsel
  | "LICENSED_WHERE_REQUIRED" // 5 — required licenses obtained where applicable
  | "RESTRICTED" // 6 — operationally restricted (partial authorization)
  | "PROHIBITED" // 7 — operationally prohibited
  | "UNKNOWN"; // 8 — no information; per PROMPT 41 = CONSERVATIVE_BLOCK

// 8 seeded jurisdictions per directive
export type JurisdictionCode =
  | "US" // United States
  | "CN" // China (PRC)
  | "AE" // United Arab Emirates
  | "SG" // Singapore
  | "JP" // Japan
  | "GB" // United Kingdom
  | "EU" // European Union (composite)
  | "OTHER"; // catch-all for jurisdictions not in the 7 named

// CNY/CNH distinction per PROMPT 41 verbatim
export type RmbExposureDimension =
  | "ONSHORE_CNY" // PRC domestic CNY — capital-controlled
  | "OFFSHORE_CNH" // offshore deliverable CNH — freely traded
  | "CUSTODY_JURISDICTION" // where the CNY/CNH is custodied
  | "CONVERSION_VENUE" // where CNY ↔ CNH (or CNY/CNH ↔ USD) conversion occurs
  | "SETTLEMENT_RAIL" // CIPS for CNY, correspondent banking for CNH
  | "SANCTIONS_CAPITAL_CONTROL_CONSTRAINTS" // PRC capital controls + US/OFAC sanctions
  | "LEGAL_ACCESSIBILITY"; // whether the bank has lawful access to PRC's settlement system

// ============================================================================
// CRITICAL RULES (per directive)
// ============================================================================

export const UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE = {
  ruleId: "UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE",
  rule: "Per PROMPT 41 verbatim: 'Make: UNKNOWN = CONSERVATIVE BLOCK unless a defined evidence package explicitly moves the jurisdiction forward.' A jurisdiction with no independent legal validation MUST NOT be represented as legally ALLOWED merely because an internal registry contains ALLOWED. The UNKNOWN state is treated as CONSERVATIVE_BLOCK — settlements are blocked (or require explicit manual override with full evidence package + officer sign-off) until a defined evidence package moves the jurisdiction forward through the 8-state ladder.",
  description:
    "PROMPT 41 requires that UNKNOWN be treated as CONSERVATIVE_BLOCK — not as ALLOWED. " +
    "This means: (1) a jurisdiction whose state is UNKNOWN blocks new settlements until evidence is produced; " +
    "(2) the absence of information is NOT permission to settle; " +
    "(3) the system MUST default to BLOCK when the state is UNKNOWN; " +
    "(4) the system MUST require an explicit evidence package (per N2 Institutional Evidence Fabric) + officer sign-off to override the BLOCK; " +
    "(5) the override is logged + audited + subject to S1 SettlementContinuityFabric JURISDICTION_RESTRICTION event lifecycle. " +
    "This rule prevents the engineering failure mode where 'no information' is misinterpreted as 'no restriction' — which would be a serious legal risk.",
  whatItForbids: [
    "Treating UNKNOWN as ALLOWED (the most dangerous misinterpretation).",
    "Defaulting to ALLOWED when a jurisdiction's state is missing or undefined.",
    "Using internal registry 'ALLOWED' values as a substitute for independent legal validation.",
    "Settling in a jurisdiction with UNKNOWN state without explicit officer override + evidence package + audit log.",
    "Inferring lawful access from the mere fact that an internal registry contains an entry.",
  ],
  whatItPermits: [
    "Treating UNKNOWN as CONSERVATIVE_BLOCK (the safe default).",
    "Officer override with full evidence package + sign-off + audit log + S1 lifecycle.",
    "Moving a jurisdiction from UNKNOWN to SEED_DATA, then up the ladder (PUBLIC_MATERIAL_TRIAGE → LEGAL_REVIEW → INSTITUTIONALLY_VALIDATED → LICENSED_WHERE_REQUIRED) as evidence accumulates.",
    "Moving a jurisdiction directly to RESTRICTED or PROHIBITED if evidence shows restriction/prohibition.",
  ],
  enforcement:
    "Runtime invariant `assertUnknownIsConservativeBlock` fails fast at module load if any jurisdiction with state=UNKNOWN has settlementAllowed=true. Runtime invariant `assertNoInternalRegistryAsLegalAuthority` fails fast if any jurisdiction's legalAccessibility field references an internal registry as its source of legal authority (must reference external counsel opinion or regulator filing).",
  settlementAllowedMatrix: {
    SEED_DATA: false, // no independent validation — conservative block
    PUBLIC_MATERIAL_TRIAGE: false, // triaged but no legal review — conservative block
    LEGAL_REVIEW: false, // under review — conservative block
    INSTITUTIONALLY_VALIDATED: true, // institutionally validated — conditional allow
    LICENSED_WHERE_REQUIRED: true, // licenses obtained — full allow where applicable
    RESTRICTED: false, // restricted — block by default, case-by-case
    PROHIBITED: false, // prohibited — always block
    UNKNOWN: false, // UNKNOWN = conservative block per rule
  } as Record<JurisdictionState, boolean>,
} as const;

export const NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE = {
  ruleId: "NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE",
  rule: "Per PROMPT 41: 'A jurisdiction with no independent legal validation must not be represented as legally ALLOWED merely because an internal registry contains ALLOWED.' Engineering labels (registry values, internal flags, configuration files) MUST NEVER be mistaken for legal authorization. The legal authority for any jurisdiction MUST come from: (a) external counsel opinion (per V1 + N2 Evidence Fabric), (b) regulator filing or no-action letter, (c) license issuance, or (d) judicial precedent. Internal registry values are SEED_DATA — they are NOT legal authority.",
  description:
    "PROMPT 41 explicitly forbids using internal registry 'ALLOWED' values as legal authority. " +
    "This means: (1) an internal flag `jurisdictionAllowed = true` is NOT legal authorization; " +
    "(2) a configuration file listing 'permitted jurisdictions' is NOT legal authorization; " +
    "(3) a default-allow in code is NOT legal authorization; " +
    "(4) the legal authority MUST come from external counsel opinion (per V1 — required for legal conditionality), regulator filing, license issuance, or judicial precedent — and MUST be stored in N2 Evidence Fabric with SHA-256 commitment + lifecycle + publication rules. " +
    "Internal registry values are SEED_DATA — they are the lowest of the 8 states and require evidence to advance.",
  whatItForbids: [
    "Using an internal registry value (e.g., `jurisdiction.allowed = true`) as legal authority.",
    "Representing a configuration file's permitted-jurisdiction list as legal authorization.",
    "Defaulting to ALLOWED in code when no legal opinion exists.",
    "Treating the absence of a 'prohibited' flag as permission to settle.",
    "Inferring legal authorization from the mere existence of an internal registry entry.",
  ],
  whatItPermits: [
    "Using external counsel opinion as legal authority (stored in N2 Evidence Fabric).",
    "Using regulator filing or no-action letter as legal authority.",
    "Using license issuance as legal authority (with license number + issuing authority + expiry).",
    "Using judicial precedent as legal authority (with case citation).",
    "Maintaining an internal registry as SEED_DATA — clearly disclosed as not-legal-authority.",
  ],
  enforcement:
    "Runtime invariant `assertNoInternalRegistryAsLegalAuthority` fails fast if any jurisdiction's `legalAccessibilityEvidenceSource` field is set to 'INTERNAL_REGISTRY' (must be 'EXTERNAL_COUNSEL_OPINION', 'REGULATOR_FILING', 'LICENSE_ISSUANCE', or 'JUDICIAL_PRECEDENT').",
  requiredEvidenceSources: [
    "EXTERNAL_COUNSEL_OPINION",
    "REGULATOR_FILING",
    "LICENSE_ISSUANCE",
    "JUDICIAL_PRECEDENT",
  ],
} as const;

export const CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE = {
  ruleId: "CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE",
  rule: "Per PROMPT 41 verbatim: 'Do not infer that holding a currency in a reserve is equivalent to having lawful access to its domestic settlement system. Any unsupported CNY/RMB path must remain conditional or blocked.' Holding a currency in a reserve account (e.g., CNY in a non-PRC bank's reserve at a PRC custodian) is NOT equivalent to having lawful access to the PRC's domestic CNY settlement system (CIPS). The two are distinct: holding is a custody state; settlement-system access is a regulatory + rails-access state. Any CNY/RMB path that lacks independent evidence of (a) CIPS membership or correspondent access, (b) PRC capital-control compliance, (c) PBOC approval where required, MUST remain conditional or blocked.",
  description:
    "PROMPT 41 explicitly distinguishes currency holding from settlement-system access. " +
    "This means: (1) a bank may hold CNY in a reserve account (e.g., at a PRC custodian) WITHOUT having lawful access to CIPS (the PRC's domestic CNY settlement system); " +
    "(2) holding CNY ≠ settling CNY; the former is a custody state, the latter is a regulatory + rails-access state; " +
    "(3) CIPS access requires PBOC approval + CIPS membership (or correspondent access via a CIPS member) — these are separate regulatory approvals; " +
    "(4) PRC capital controls apply to CNY conversion (CNY ↔ CNH, CNY ↔ USD) — these are separate from custody; " +
    "(5) US/OFAC sanctions apply to PRC entity interactions — these are separate from custody and from capital controls; " +
    "(6) legal accessibility (whether the bank has lawful access to PRC's settlement system) is the master state that combines custody + rails-access + capital-control-compliance + sanctions-compliance + PBOC-approval-where-required.",
  whatItForbids: [
    "Inferring that holding CNY in a reserve = lawful access to CIPS.",
    "Inferring that holding CNH offshore = lawful access to onshore CNY settlement.",
    "Treating custody state as settlement-system access state.",
    "Allowing CNY/RMB settlement without independent evidence of (a) CIPS membership or correspondent access, (b) PRC capital-control compliance, (c) PBOC approval where required.",
    "Defaulting CNY/RMB settlement to ALLOWED when legal accessibility is UNKNOWN.",
  ],
  whatItPermits: [
    "Conditional CNY/RMB settlement (with full evidence package + officer sign-off + audit log).",
    "Blocked CNY/RMB settlement (when evidence is missing).",
    "CNH settlement (offshore deliverable — freely traded, lower capital-control burden — but still requires sanctions + custody + conversion evidence).",
    "Distinguishing the 7 RMB exposure dimensions per PROMPT 41 (onshore CNY / offshore CNH / custody jurisdiction / conversion venue / settlement rail / sanctions-capital-control constraints / legal accessibility).",
  ],
  enforcement:
    "Runtime invariant `assertCnyCnhDistinct` fails fast at module load if the 7 RMB exposure dimensions are not all present with distinct values. Runtime invariant `assertNoCnySettlementWithoutLegalAccessibility` fails fast if any CNY exposure has legalAccessibility = UNKNOWN or PROHIBITED but settlementRail allows settlement.",
  sevenDimensions: [
    "ONSHORE_CNY",
    "OFFSHORE_CNH",
    "CUSTODY_JURISDICTION",
    "CONVERSION_VENUE",
    "SETTLEMENT_RAIL",
    "SANCTIONS_CAPITAL_CONTROL_CONSTRAINTS",
    "LEGAL_ACCESSIBILITY",
  ],
} as const;

// ============================================================================
// 8 SEEDED JURISDICTIONS (all start as SEED_DATA or UNKNOWN — honest)
// ============================================================================

export interface JurisdictionTruthEntry {
  jurisdictionCode: JurisdictionCode;
  jurisdictionName: string;
  currentState: JurisdictionState;
  settlementAllowed: boolean; // derived from UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE matrix
  registryRepresentation: string; // what the internal registry previously said
  registryReconciliation: string; // how the registry representation is reconciled with truth
  legalAccessibility: "UNKNOWN" | "CONDITIONAL" | "RESTRICTED" | "ALLOWED";
  legalAccessibilityEvidenceSource:
    | "NONE" // no evidence — honest default
    | "INTERNAL_REGISTRY" // internal registry only (NOT legal authority per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE)
    | "EXTERNAL_COUNSEL_OPINION"
    | "REGULATOR_FILING"
    | "LICENSE_ISSUANCE"
    | "JUDICIAL_PRECEDENT";
  legalAccessibilityEvidenceReference: string | null; // N2 Evidence Fabric reference (null = no evidence)
  honestNote: string;
  rmbExposure?: RmbExposureEntry; // present for CN jurisdiction, present for jurisdictions with CN exposure
}

export interface RmbExposureEntry {
  onshoreCny: {
    status: "UNKNOWN" | "CONDITIONAL" | "BLOCKED";
    note: string;
  };
  offshoreCnh: {
    status: "UNKNOWN" | "CONDITIONAL" | "BLOCKED";
    note: string;
  };
  custodyJurisdiction: {
    candidateJurisdictions: string[];
    status: "UNKNOWN" | "CONDITIONAL" | "VALIDATED";
    note: string;
  };
  conversionVenue: {
    candidateVenues: string[];
    status: "UNKNOWN" | "CONDITIONAL" | "VALIDATED";
    note: string;
  };
  settlementRail: {
    onshoreRail: "CIPS" | "NONE"; // CIPS = Cross-Border Interbank Payment System (PRC domestic CNY)
    offshoreRail: "CORRESPONDENT_BANKING" | "NONE"; // CNH offshore via correspondent
    status: "UNKNOWN" | "CONDITIONAL" | "BLOCKED";
    note: string;
  };
  sanctionsCapitalControlConstraints: {
    prcCapitalControls: "UNKNOWN" | "PARTIALLY_KNOWN" | "KNOWN";
    usOfacSanctions: "UNKNOWN" | "PARTIALLY_KNOWN" | "KNOWN";
    note: string;
  };
  legalAccessibility: "UNKNOWN" | "CONDITIONAL" | "RESTRICTED" | "ALLOWED";
  legalAccessibilityEvidenceSource:
    | "NONE"
    | "EXTERNAL_COUNSEL_OPINION"
    | "REGULATOR_FILING"
    | "LICENSE_ISSUANCE"
    | "JUDICIAL_PRECEDENT";
  legalAccessibilityEvidenceReference: string | null;
  honestNote: string;
}

export const JURISDICTION_TRUTH_ENTRIES: JurisdictionTruthEntry[] = [
  // 1. US — United States
  {
    jurisdictionCode: "US",
    jurisdictionName: "United States",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed US as 'permitted' (default-allow based on MITHQAL's NJ operating entity).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The US jurisdiction's legal authority for MITHQAL settlement requires (a) external counsel opinion on MTQ's classification under US law (deposit? e-money? security? commodity? per U1 Accounting/Prudential/Tax Framework — all 10 areas PENDING_EXTERNAL_VALIDATION), (b) state-level money transmitter license analysis (NJ primary + any state where bank counterparties operate), (c) FinCEN BSA/AML registration analysis, (d) OFAC sanctions program analysis. None of these exist yet. US state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, US jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag is reconciled down to SEED_DATA. MITHQAL's NJ operating entity (JOZOUR_LLC_NJ per M1) does NOT itself constitute legal authority for MTQ settlement — it is a corporate formation, not a money transmitter license or regulator filing. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: US settlements blocked until evidence package + counsel opinion + officer sign-off.",
  },
  // 2. CN — China (PRC) — includes the full RMB exposure analysis
  {
    jurisdictionCode: "CN",
    jurisdictionName: "China (PRC)",
    currentState: "UNKNOWN",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed CN as 'restricted' (default-deny based on PRC capital controls + sanctions screening concerns).",
    registryReconciliation:
      "RECONCILED AS UNKNOWN: The internal 'restricted' label was an engineering flag, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is not legal authority. The CN jurisdiction's legal authority for MITHQAL settlement requires (a) external PRC counsel opinion on MTQ's classification under PRC law, (b) PBOC + SAFE analysis for any CNY settlement (capital-control compliance), (c) CIPS membership or correspondent access analysis, (d) US/OFAC sanctions program analysis (PRC entity screening — especially under US sanctions on certain PRC entities), (e) US-PRC bilateral trade + sanctions overlay analysis. None of these exist yet. CN state = UNKNOWN (the most conservative state — applies because PRC capital controls + sanctions complexity require independent validation).",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, CN jurisdiction starts as UNKNOWN — no independent legal validation has occurred. The prior 'restricted' engineering flag is reconciled to UNKNOWN (more conservative — UNKNOWN = CONSERVATIVE_BLOCK per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE). CN settlements blocked until evidence package + PRC counsel opinion + PBOC analysis + sanctions analysis + officer sign-off. The full RMB exposure analysis is in the rmbExposure field below.",
    rmbExposure: {
      onshoreCny: {
        status: "BLOCKED",
        note:
          "Onshore CNY (PRC domestic) is BLOCKED — requires PBOC approval + CIPS membership or correspondent access + PRC capital-control compliance. None evidenced. Per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE: holding CNY in a reserve ≠ lawful access to CIPS.",
      },
      offshoreCnh: {
        status: "CONDITIONAL",
        note:
          "Offshore CNH is CONDITIONAL — freely traded offshore (e.g., HK, SG, London CNH markets), but settlement requires (a) CNH custody at an offshore custodian, (b) correspondent banking rail (NOT CIPS), (c) US/OFAC sanctions screening on counterparty, (d) PRC capital-control compliance on any CNY conversion. None evidenced.",
      },
      custodyJurisdiction: {
        candidateJurisdictions: ["HK", "SG", "GB", "US"],
        status: "UNKNOWN",
        note:
          "CNH custody candidate jurisdictions are HK, SG, GB (London), US — all SEED_DATA per their own entries. None has an evidenced CNH custody relationship. Custody state ≠ settlement-system access state per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.",
      },
      conversionVenue: {
        candidateVenues: ["HK_CNH_MARKET", "SG_CNH_MARKET", "LONDON_CNH_MARKET"],
        status: "UNKNOWN",
        note:
          "CNH ↔ CNY / CNH ↔ USD conversion venue candidates are HK, SG, London CNH markets. None evidenced. PRC capital controls apply to CNY ↔ CNH conversion (the CNY/CNH conversion channel is regulated by PBOC + SAFE).",
      },
      settlementRail: {
        onshoreRail: "NONE", // CIPS not accessible (no PBOC approval, no CIPS membership, no correspondent access)
        offshoreRail: "CORRESPONDENT_BANKING", // CNH via correspondent (typical)
        status: "BLOCKED",
        note:
          "Onshore CNY settlement rail (CIPS) is NOT accessible — no PBOC approval, no CIPS membership, no correspondent access evidenced. Offshore CNH settlement rail (correspondent banking) is CONDITIONAL — requires evidenced correspondent relationship + sanctions screening. Per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE: holding CNY ≠ CIPS access.",
      },
      sanctionsCapitalControlConstraints: {
        prcCapitalControls: "PARTIALLY_KNOWN",
        usOfacSanctions: "PARTIALLY_KNOWN",
        note:
          "PRC capital controls partially known (publicly-published SAFE regulations) but require PRC counsel opinion for application to MTQ. US/OFAC sanctions partially known (publicly-published sanctions lists) but require US counsel opinion for application to PRC counterparties. Neither is fully evidenced.",
      },
      legalAccessibility: "UNKNOWN",
      legalAccessibilityEvidenceSource: "NONE",
      legalAccessibilityEvidenceReference: null,
      honestNote:
        "Per PROMPT 41, legal accessibility for CNY/CNH is UNKNOWN — no independent evidence of (a) CIPS membership or correspondent access, (b) PRC capital-control compliance, (c) PBOC approval where required, (d) US/OFAC sanctions screening. Per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE, any unsupported CNY/RMB path remains conditional or blocked. Current state: BLOCKED for onshore CNY, CONDITIONAL for offshore CNH (still requires evidence + officer sign-off to advance).",
      },
  },
  // 3. AE — United Arab Emirates
  {
    jurisdictionCode: "AE",
    jurisdictionName: "United Arab Emirates",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed AE as 'permitted' (default-allow based on UAE's progressive regulatory stance on digital assets + the DIFC/ADGM free-zone regimes).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag based on public materials, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The AE jurisdiction's legal authority for MITHQAL settlement requires (a) external UAE counsel opinion on MTQ's classification under UAE + DIFC/ADGM law, (b) Central Bank of UAE analysis (VARA licensing for digital-asset activity where applicable), (c) Sharia governance analysis per Z1 P40 (the Sharia pathway is OPTIONAL — engaged only where a bank requests it AND jurisdictional market practice expects it). None of these exist yet. AE state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, AE jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag (based on UAE's progressive public stance) is reconciled down to SEED_DATA. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: AE settlements blocked until evidence package + UAE counsel opinion + VARA/CBE analysis + officer sign-off.",
  },
  // 4. SG — Singapore
  {
    jurisdictionCode: "SG",
    jurisdictionName: "Singapore",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed SG as 'permitted' (default-allow based on MAS's progressive regulatory stance + PSA licensing framework).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag based on public materials, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The SG jurisdiction's legal authority for MITHQAL settlement requires (a) external SG counsel opinion on MTQ's classification under SG law (likely PSA DPT — Digital Payment Token), (b) MAS PSA licensing analysis (whether MITHQAL or the bank counterparty requires a PSA license), (c) Sharia governance analysis per Z1 P40 (the Sharia pathway is OPTIONAL — engaged only where a bank requests it AND jurisdictional market practice expects it — SG has a Sharia finance market). None of these exist yet. SG state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, SG jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag (based on MAS's progressive public stance) is reconciled down to SEED_DATA. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: SG settlements blocked until evidence package + SG counsel opinion + MAS PSA analysis + officer sign-off.",
  },
  // 5. JP — Japan
  {
    jurisdictionCode: "JP",
    jurisdictionName: "Japan",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed JP as 'permitted' (default-allow based on Japan's Payment Services Act framework for crypto-assets).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag based on public materials, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The JP jurisdiction's legal authority for MITHQAL settlement requires (a) external JP counsel opinion on MTQ's classification under JP law (likely PSA crypto-asset or PR tokens), (b) FSA PSA registration analysis (whether MITHQAL or the bank counterparty requires PSA registration), (c) ARQ analysis for stablecoin or other classifications. None of these exist yet. JP state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, JP jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag (based on JP's PSA framework) is reconciled down to SEED_DATA. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: JP settlements blocked until evidence package + JP counsel opinion + FSA PSA analysis + officer sign-off.",
  },
  // 6. GB — United Kingdom
  {
    jurisdictionCode: "GB",
    jurisdictionName: "United Kingdom",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed GB as 'permitted' (default-allow based on UK FCA's regulatory perimeter + London as a CNH offshore hub).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag based on public materials, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The GB jurisdiction's legal authority for MITHQAL settlement requires (a) external GB counsel opinion on MTQ's classification under UK law (likely e-money or payment token), (b) FCA analysis (e-money authorization or payment services registration), (c) London CNH market analysis for any CNY/CNH activity (per the rmbExposure field of CN — but here it's CNH custody + conversion only, not onshore CNY). None of these exist yet. GB state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, GB jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag (based on UK FCA's regulatory perimeter) is reconciled down to SEED_DATA. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: GB settlements blocked until evidence package + GB counsel opinion + FCA analysis + officer sign-off.",
  },
  // 7. EU — European Union (composite)
  {
    jurisdictionCode: "EU",
    jurisdictionName: "European Union (composite)",
    currentState: "SEED_DATA",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed EU as 'permitted' (default-allow based on MiCA framework for digital assets).",
    registryReconciliation:
      "RECONCILED DOWN: The internal 'permitted' label was an engineering flag based on public materials (MiCA), NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is SEED_DATA only. The EU jurisdiction's legal authority for MITHQAL settlement requires (a) external EU counsel opinion on MTQ's classification under MiCA (likely EMT — E-Money Token or ART — Asset-Referenced Token), (b) EBA + ESMA analysis for MiCA authorization, (c) per-member-state analysis (the EU is composite — Germany BaFin, France AMF, Ireland CBI, etc. each have national overlays), (d) AMLR analysis. None of these exist yet. EU state = SEED_DATA.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, EU jurisdiction starts as SEED_DATA — no independent legal validation has occurred. The prior 'permitted' engineering flag (based on MiCA) is reconciled down to SEED_DATA. EU is a composite jurisdiction — each member state has its own national overlay. UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE applies: EU settlements blocked until evidence package + EU counsel opinion + EBA/ESMA + per-member-state analysis + officer sign-off.",
  },
  // 8. OTHER — catch-all
  {
    jurisdictionCode: "OTHER",
    jurisdictionName: "Other (jurisdictions not in the 7 named)",
    currentState: "UNKNOWN",
    settlementAllowed: false,
    registryRepresentation:
      "Internal registry previously listed OTHER as 'restricted' (default-deny for any jurisdiction not in the named list).",
    registryReconciliation:
      "RECONCILED AS UNKNOWN: The internal 'restricted' label was an engineering flag, NOT legal authority. Per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE, the registry value is not legal authority. For OTHER jurisdictions, no internal triage has occurred — they default to UNKNOWN (the most conservative state per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE). Any OTHER jurisdiction requires full evidence package + counsel opinion + officer sign-off before settlement.",
    legalAccessibility: "UNKNOWN",
    legalAccessibilityEvidenceSource: "NONE",
    legalAccessibilityEvidenceReference: null,
    honestNote:
      "Per PROMPT 41, OTHER jurisdictions default to UNKNOWN — the most conservative state. UNKNOWN = CONSERVATIVE_BLOCK per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE. Settlements in OTHER jurisdictions blocked until evidence package + counsel opinion + officer sign-off.",
  },
];

// ============================================================================
// 8 CANONICAL STATES — definitions
// ============================================================================

export const JURISDICTION_STATE_DEFINITIONS: {
  stateId: JurisdictionState;
  name: string;
  definition: string;
  settlementAllowed: boolean;
  evidenceRequiredToAdvance: string;
}[] = [
  {
    stateId: "SEED_DATA",
    name: "SEED_DATA",
    definition:
      "Internal seed data only. The jurisdiction exists in the internal registry (e.g., 'US' is listed as a jurisdiction), but no independent legal validation has occurred. The seed data is NOT legal authority per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "Public-material triage (collect regulator website, primary law texts, regulator FAQ) → advance to PUBLIC_MATERIAL_TRIAGE.",
  },
  {
    stateId: "PUBLIC_MATERIAL_TRIAGE",
    name: "PUBLIC_MATERIAL_TRIAGE",
    definition:
      "Public-source materials (regulator website, primary law texts, regulator FAQ) have been collected and triaged. No legal review has occurred. The triaged materials are NOT legal authority — they are inputs to legal review.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "External counsel engagement + counsel opinion request → advance to LEGAL_REVIEW.",
  },
  {
    stateId: "LEGAL_REVIEW",
    name: "LEGAL_REVIEW",
    definition:
      "Under review by qualified external counsel (per V1 — required for legal conditionality). The review is in progress — no opinion has been issued. The in-progress review is NOT legal authority.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "Counsel opinion issued + stored in N2 Evidence Fabric with SHA-256 commitment → advance to INSTITUTIONALLY_VALIDATED.",
  },
  {
    stateId: "INSTITUTIONALLY_VALIDATED",
    name: "INSTITUTIONALLY_VALIDATED",
    definition:
      "Institutionally validated by qualified external counsel (per V1). Counsel opinion issued, signed, and stored in N2 Evidence Fabric with SHA-256 commitment. The opinion covers MTQ's classification + per-jurisdiction regulatory analysis. Settlement is conditionally allowed (per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE matrix).",
    settlementAllowed: true,
    evidenceRequiredToAdvance:
      "If licenses are required (e.g., money transmitter license, e-money license, PSA registration), obtain them → advance to LICENSED_WHERE_REQUIRED.",
  },
  {
    stateId: "LICENSED_WHERE_REQUIRED",
    name: "LICENSED_WHERE_REQUIRED",
    definition:
      "All required licenses have been obtained where applicable (per V1 REQUIRED_LEGAL_AUTHORITY). License numbers, issuing authorities, and expiry dates are stored in N2 Evidence Fabric. Settlement is fully allowed within the scope of the licenses.",
    settlementAllowed: true,
    evidenceRequiredToAdvance:
      "Maintain licenses (renewal + ongoing compliance). If licenses lapse → revert to INSTITUTIONALLY_VALIDATED (and possibly RESTRICTED).",
  },
  {
    stateId: "RESTRICTED",
    name: "RESTRICTED",
    definition:
      "Operationally restricted. The jurisdiction has been validated but with restrictions (e.g., licensed for institutional-only settlement, not retail; or licensed for some MTQ activities, not all). Restrictions are stored in N2 Evidence Fabric.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "Lift restrictions (e.g., expand license scope) → advance to LICENSED_WHERE_REQUIRED. Or escalate to PROHIBITED if restrictions become prohibitions.",
  },
  {
    stateId: "PROHIBITED",
    name: "PROHIBITED",
    definition:
      "Operationally prohibited. The jurisdiction has been independently validated as PROHIBITED (e.g., OFAC-sanctioned jurisdiction, jurisdiction with no lawful path for MTQ settlement). Settlement is always blocked.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "No advancement — PROHIBITED is terminal. If circumstances change (e.g., sanctions lifted), advance to LEGAL_REVIEW for re-evaluation.",
  },
  {
    stateId: "UNKNOWN",
    name: "UNKNOWN",
    definition:
      "No information. The jurisdiction has no triaged materials, no legal review, no opinion. Per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE, UNKNOWN = CONSERVATIVE_BLOCK — settlements blocked until evidence package + officer sign-off.",
    settlementAllowed: false,
    evidenceRequiredToAdvance:
      "Public-material triage → advance to PUBLIC_MATERIAL_TRIAGE. Or direct counsel engagement → advance to LEGAL_REVIEW.",
  },
];

// ============================================================================
// 7 RMB EXPOSURE DIMENSIONS — definitions per PROMPT 41 verbatim
// ============================================================================

export const RMB_EXPOSURE_DIMENSIONS: {
  dimensionId: RmbExposureDimension;
  name: string;
  directiveQuote: string;
  definition: string;
}[] = [
  {
    dimensionId: "ONSHORE_CNY",
    name: "Onshore CNY",
    directiveQuote: "onshore CNY",
    definition:
      "PRC domestic CNY — capital-controlled. Onshore CNY is the PRC's domestic currency, settled through CIPS (Cross-Border Interbank Payment System) or PBOC's domestic rail. Access requires PBOC approval + CIPS membership (or correspondent access via a CIPS member) + PRC capital-control compliance. Holding CNY in a reserve ≠ access to CIPS per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.",
  },
  {
    dimensionId: "OFFSHORE_CNH",
    name: "Offshore CNH",
    directiveQuote: "offshore CNH",
    definition:
      "Offshore deliverable CNH — freely traded outside PRC. CNH markets exist in HK, SG, London, US. CNH settlement typically via correspondent banking (NOT CIPS). CNH is freely tradeable but subject to (a) US/OFAC sanctions on PRC entities, (b) PRC capital controls on CNY ↔ CNH conversion (the conversion channel is regulated).",
  },
  {
    dimensionId: "CUSTODY_JURISDICTION",
    name: "Custody jurisdiction",
    directiveQuote: "custody jurisdiction",
    definition:
      "The jurisdiction where the CNY/CNH is custodied. May differ from the operating jurisdiction. E.g., a SG-based bank may custody CNH in HK. Custody state ≠ settlement-system access state per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE.",
  },
  {
    dimensionId: "CONVERSION_VENUE",
    name: "Conversion venue",
    directiveQuote: "conversion venue",
    definition:
      "The venue where CNY ↔ CNH (or CNY/CNH ↔ USD/EUR/etc.) conversion occurs. PRC capital controls apply to CNY ↔ CNH conversion. CNH ↔ USD/EUR conversion is freely traded offshore. Conversion venue ≠ custody jurisdiction (they may be the same or different).",
  },
  {
    dimensionId: "SETTLEMENT_RAIL",
    name: "Settlement rail",
    directiveQuote: "settlement rail",
    definition:
      "The settlement rail for CNY/CNH. Onshore CNY = CIPS (PRC domestic rail, PBOC-controlled). Offshore CNH = correspondent banking (via a CIPS member or via a non-CIPS correspondent). The rail is distinct from custody and from conversion — a bank may hold CNY in custody but lack CIPS access for settlement.",
  },
  {
    dimensionId: "SANCTIONS_CAPITAL_CONTROL_CONSTRAINTS",
    name: "Sanctions/capital-control constraints",
    directiveQuote: "sanctions/capital-control constraints",
    definition:
      "Two distinct constraint sets: (a) PRC capital controls (SAFE regulations on CNY cross-border, PBOC approvals, foreign-debt registration) and (b) US/OFAC sanctions on PRC entities (e.g., sanctions on specific PRC officials, specific PRC companies, specific PRC technologies). Both must be cleared independently — they are NOT the same. A bank may pass one and fail the other.",
  },
  {
    dimensionId: "LEGAL_ACCESSIBILITY",
    name: "Legal accessibility",
    directiveQuote: "legal accessibility",
    definition:
      "Whether the bank has lawful access to PRC's settlement system. This is the MASTER state — combines custody + rails-access + capital-control-compliance + sanctions-compliance + PBOC-approval-where-required. Per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE, legal accessibility is NOT inferred from custody state — it requires independent evidence of all five components.",
  },
];

// ============================================================================
// AUDIT SUMMARY — honest reconciliation
// ============================================================================

export const JURISDICTION_AUDIT_SUMMARY = {
  totalJurisdictionsAudited: JURISDICTION_TRUTH_ENTRIES.length, // 8
  jurisdictionsReconciledDown: JURISDICTION_TRUTH_ENTRIES.filter(
    (j) =>
      j.registryRepresentation.toLowerCase().includes("permitted") ||
      j.registryRepresentation.toLowerCase().includes("allowed"),
  ).length, // 6 (US, AE, SG, JP, GB, EU were 'permitted')
  jurisdictionsReconciledToUnknown: JURISDICTION_TRUTH_ENTRIES.filter(
    (j) => j.currentState === "UNKNOWN",
  ).length, // 2 (CN, OTHER)
  jurisdictionsAtSeedData: JURISDICTION_TRUTH_ENTRIES.filter(
    (j) => j.currentState === "SEED_DATA",
  ).length, // 6 (US, AE, SG, JP, GB, EU)
  jurisdictionsAtValidated: JURISDICTION_TRUTH_ENTRIES.filter(
    (j) =>
      j.currentState === "INSTITUTIONALLY_VALIDATED" ||
      j.currentState === "LICENSED_WHERE_REQUIRED",
  ).length, // 0 (honest — none validated)
  jurisdictionsAtProhibited: JURISDICTION_TRUTH_ENTRIES.filter(
    (j) => j.currentState === "PROHIBITED",
  ).length, // 0 (honest — none prohibited)
  rmbExposureJurisdiction: "CN" as JurisdictionCode,
  rmbExposureOnshoreCny: "BLOCKED",
  rmbExposureOffshoreCnh: "CONDITIONAL",
  rmbExposureLegalAccessibility: "UNKNOWN",
  honestConclusion:
    "All 8 seeded jurisdictions audited. 6 jurisdictions (US, AE, SG, JP, GB, EU) were previously 'permitted' in the internal registry — all reconciled DOWN to SEED_DATA per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE. 2 jurisdictions (CN, OTHER) were previously 'restricted' or not-listed — all reconciled to UNKNOWN (more conservative) per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE. 0 jurisdictions are validated or licensed. The RMB exposure (CN) is fully distinguished across 7 dimensions per PROMPT 41: onshore CNY=BLOCKED, offshore CNH=CONDITIONAL, custody jurisdiction=UNKNOWN, conversion venue=UNKNOWN, settlement rail=BLOCKED (no CIPS access), sanctions/capital-control constraints=PARTIALLY_KNOWN (requires counsel opinion), legal accessibility=UNKNOWN. Per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE, any unsupported CNY/RMB path remains conditional or blocked.",
  auditDate: "v25.3.21",
};

// ============================================================================
// STATUS + AGGREGATES
// ============================================================================

export const JURISDICTION_TRUTH_MODEL_VERSION = "v25.3.21";
export const JURISDICTION_TRUTH_MODEL_SOURCE =
  "src/lib/jurisdiction-truth-model.ts";
export const JURISDICTION_TRUTH_MODEL_STATUS =
  "ALL_8_JURISDICTIONS_SEED_DATA_OR_UNKNOWN — no jurisdiction independently validated; all settlements conservative-blocked until evidence package + counsel opinion + officer sign-off.";

export const JURISDICTION_COUNT = JURISDICTION_TRUTH_ENTRIES.length; // 8
export const STATE_COUNT = JURISDICTION_STATE_DEFINITIONS.length; // 8
export const RMB_DIMENSION_COUNT = RMB_EXPOSURE_DIMENSIONS.length; // 7

export const JURISDICTION_TRUTH_MODEL_HONEST_STATE = {
  allJurisdictionsAtSeedDataOrUnknown: JURISDICTION_TRUTH_ENTRIES.every(
    (j) => j.currentState === "SEED_DATA" || j.currentState === "UNKNOWN",
  ),
  noJurisdictionValidated: JURISDICTION_TRUTH_ENTRIES.every(
    (j) =>
      j.currentState !== "INSTITUTIONALLY_VALIDATED" &&
      j.currentState !== "LICENSED_WHERE_REQUIRED",
  ),
  noJurisdictionLegallyAccessible: JURISDICTION_TRUTH_ENTRIES.every(
    (j) => j.legalAccessibility === "UNKNOWN",
  ),
  allSettlementsConservativeBlocked: JURISDICTION_TRUTH_ENTRIES.every(
    (j) => j.settlementAllowed === false,
  ),
  unknownIsConservativeBlock: true,
  registryIsNotLegalAuthority: true,
  rmbCnySettlementBlocked:
    JURISDICTION_TRUTH_ENTRIES.find((j) => j.jurisdictionCode === "CN")
      ?.rmbExposure?.onshoreCny.status === "BLOCKED",
  rmbCnhConditional:
    JURISDICTION_TRUTH_ENTRIES.find((j) => j.jurisdictionCode === "CN")
      ?.rmbExposure?.offshoreCnh.status === "CONDITIONAL",
  honestStateNote:
    "Per PROMPT 41, all 8 seeded jurisdictions start as SEED_DATA or UNKNOWN — no jurisdiction has been independently validated. Engineering labels (registry values) MUST NEVER be mistaken for legal authority. UNKNOWN = CONSERVATIVE_BLOCK — settlements blocked until evidence package + counsel opinion + officer sign-off. For RMB exposure (CN jurisdiction): onshore CNY = BLOCKED, offshore CNH = CONDITIONAL. Holding a currency in a reserve ≠ lawful access to its domestic settlement system. Any unsupported CNY/RMB path remains conditional or blocked.",
};

// ============================================================================
// LOOKUP HELPERS
// ============================================================================

export function getJurisdiction(
  code: JurisdictionCode,
): JurisdictionTruthEntry | undefined {
  return JURISDICTION_TRUTH_ENTRIES.find((j) => j.jurisdictionCode === code);
}

export function getStateDefinition(
  stateId: JurisdictionState,
): { stateId: JurisdictionState; name: string; definition: string; settlementAllowed: boolean; evidenceRequiredToAdvance: string } | undefined {
  return JURISDICTION_STATE_DEFINITIONS.find((s) => s.stateId === stateId);
}

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertEightCanonicalStatesPresent(): void {
  const expected: JurisdictionState[] = [
    "SEED_DATA",
    "PUBLIC_MATERIAL_TRIAGE",
    "LEGAL_REVIEW",
    "INSTITUTIONALLY_VALIDATED",
    "LICENSED_WHERE_REQUIRED",
    "RESTRICTED",
    "PROHIBITED",
    "UNKNOWN",
  ];
  if (JURISDICTION_STATE_DEFINITIONS.length !== 8) {
    throw new Error(
      `JURISDICTION_TRUTH: expected 8 canonical states per PROMPT 41, got ${JURISDICTION_STATE_DEFINITIONS.length}`,
    );
  }
  const actual = JURISDICTION_STATE_DEFINITIONS.map((s) => s.stateId);
  for (const id of expected) {
    if (!actual.includes(id)) {
      throw new Error(
        `JURISDICTION_TRUTH: missing required canonical state ${id} per PROMPT 41`,
      );
    }
  }
}

function assertEightSeededJurisdictionsPresent(): void {
  const expected: JurisdictionCode[] = [
    "US",
    "CN",
    "AE",
    "SG",
    "JP",
    "GB",
    "EU",
    "OTHER",
  ];
  if (JURISDICTION_TRUTH_ENTRIES.length !== 8) {
    throw new Error(
      `JURISDICTION_TRUTH: expected 8 seeded jurisdictions, got ${JURISDICTION_TRUTH_ENTRIES.length}`,
    );
  }
  const actual = JURISDICTION_TRUTH_ENTRIES.map((j) => j.jurisdictionCode);
  for (const id of expected) {
    if (!actual.includes(id)) {
      throw new Error(
        `JURISDICTION_TRUTH: missing required seeded jurisdiction ${id} per PROMPT 41`,
      );
    }
  }
}

function assertUnknownIsConservativeBlock(): void {
  // Verify UNKNOWN state settlementAllowed = false.
  const unknownState = getStateDefinition("UNKNOWN");
  if (!unknownState || unknownState.settlementAllowed !== false) {
    throw new Error(
      "JURISDICTION_TRUTH: UNKNOWN state must have settlementAllowed=false per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE",
    );
  }
  // Verify UNKNOWN jurisdiction settlementAllowed = false.
  for (const j of JURISDICTION_TRUTH_ENTRIES) {
    if (j.currentState === "UNKNOWN" && j.settlementAllowed === true) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} is UNKNOWN but settlementAllowed=true — violates UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE`,
      );
    }
  }
  // Verify the settlementAllowedMatrix in the rule.
  const matrix = UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE.settlementAllowedMatrix;
  if (matrix.UNKNOWN !== false) {
    throw new Error(
      "JURISDICTION_TRUTH: settlementAllowedMatrix.UNKNOWN must be false per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE",
    );
  }
  // Cross-check jurisdictions: settlementAllowed must match the matrix.
  for (const j of JURISDICTION_TRUTH_ENTRIES) {
    const expected = matrix[j.currentState];
    if (expected !== j.settlementAllowed) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} state ${j.currentState} has settlementAllowed=${j.settlementAllowed} but matrix expects ${expected}`,
      );
    }
  }
}

function assertNoInternalRegistryAsLegalAuthority(): void {
  for (const j of JURISDICTION_TRUTH_ENTRIES) {
    if (j.legalAccessibilityEvidenceSource === "INTERNAL_REGISTRY") {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} legalAccessibilityEvidenceSource must NOT be INTERNAL_REGISTRY per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE`,
      );
    }
    if (
      j.rmbExposure &&
      j.rmbExposure.legalAccessibilityEvidenceSource === "INTERNAL_REGISTRY"
    ) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} RMB legalAccessibilityEvidenceSource must NOT be INTERNAL_REGISTRY per NO_REGISTRY_AS_LEGAL_AUTHORITY_RULE`,
      );
    }
  }
}

function assertCnyCnhDistinct(): void {
  // Verify the 7 RMB exposure dimensions are present.
  if (RMB_EXPOSURE_DIMENSIONS.length !== 7) {
    throw new Error(
      `JURISDICTION_TRUTH: expected 7 RMB exposure dimensions per PROMPT 41, got ${RMB_EXPOSURE_DIMENSIONS.length}`,
    );
  }
  const expectedDimensions: RmbExposureDimension[] = [
    "ONSHORE_CNY",
    "OFFSHORE_CNH",
    "CUSTODY_JURISDICTION",
    "CONVERSION_VENUE",
    "SETTLEMENT_RAIL",
    "SANCTIONS_CAPITAL_CONTROL_CONSTRAINTS",
    "LEGAL_ACCESSIBILITY",
  ];
  const actual = RMB_EXPOSURE_DIMENSIONS.map((d) => d.dimensionId);
  for (const id of expectedDimensions) {
    if (!actual.includes(id)) {
      throw new Error(
        `JURISDICTION_TRUTH: missing required RMB exposure dimension ${id} per PROMPT 41`,
      );
    }
  }
  // Verify CN jurisdiction has the full rmbExposure entry.
  const cn = getJurisdiction("CN");
  if (!cn || !cn.rmbExposure) {
    throw new Error(
      "JURISDICTION_TRUTH: CN jurisdiction must have full rmbExposure per PROMPT 41",
    );
  }
  const rmb = cn.rmbExposure;
  if (
    !rmb.onshoreCny ||
    !rmb.offshoreCnh ||
    !rmb.custodyJurisdiction ||
    !rmb.conversionVenue ||
    !rmb.settlementRail ||
    !rmb.sanctionsCapitalControlConstraints ||
    !rmb.legalAccessibility
  ) {
    throw new Error(
      "JURISDICTION_TRUTH: CN rmbExposure must have all 7 dimensions per PROMPT 41",
    );
  }
  // Verify onshore CNY is distinct from offshore CNH.
  if (rmb.onshoreCny === rmb.offshoreCnh) {
    throw new Error(
      "JURISDICTION_TRUTH: onshore CNY and offshore CNH must be distinct per PROMPT 41",
    );
  }
}

function assertNoCnySettlementWithoutLegalAccessibility(): void {
  const cn = getJurisdiction("CN");
  if (!cn || !cn.rmbExposure) return;
  const rmb = cn.rmbExposure;
  // If legal accessibility is UNKNOWN or PROHIBITED-equivalent, the settlement rail MUST be BLOCKED.
  if (
    (rmb.legalAccessibility === "UNKNOWN" ||
      rmb.legalAccessibility === "RESTRICTED") &&
    rmb.settlementRail.status !== "BLOCKED" &&
    rmb.settlementRail.status !== "UNKNOWN"
  ) {
    throw new Error(
      "JURISDICTION_TRUTH: CNY settlement rail must be BLOCKED or UNKNOWN when legal accessibility is UNKNOWN or RESTRICTED per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE",
    );
  }
  // Verify onshore CNY = BLOCKED (no PBOC approval, no CIPS membership).
  if (rmb.onshoreCny.status !== "BLOCKED") {
    throw new Error(
      "JURISDICTION_TRUTH: onshore CNY must be BLOCKED — no PBOC approval, no CIPS membership, no correspondent access evidenced per CURRENCY_HOLDING_NOT_SETTLEMENT_ACCESS_RULE",
    );
  }
}

function assertNoJurisdictionLegallyAccessible(): void {
  // HONEST STATE: no jurisdiction is legally accessible yet.
  for (const j of JURISDICTION_TRUTH_ENTRIES) {
    if (j.legalAccessibility === "ALLOWED") {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} legalAccessibility must NOT be ALLOWED (no independent validation has occurred) — honest state per PROMPT 41`,
      );
    }
    if (j.legalAccessibilityEvidenceReference !== null) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} legalAccessibilityEvidenceReference must be null (no evidence) — honest state per PROMPT 41`,
      );
    }
  }
}

function assertAllJurisdictionsHonestState(): void {
  for (const j of JURISDICTION_TRUTH_ENTRIES) {
    // All must be SEED_DATA or UNKNOWN.
    if (
      j.currentState !== "SEED_DATA" &&
      j.currentState !== "UNKNOWN"
    ) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} must be SEED_DATA or UNKNOWN (got ${j.currentState}) — honest state per PROMPT 41`,
      );
    }
    // All settlementAllowed must be false.
    if (j.settlementAllowed !== false) {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} settlementAllowed must be false — honest state per UNKNOWN_IS_CONSERVATIVE_BLOCK_RULE`,
      );
    }
    // All legalAccessibility must be UNKNOWN.
    if (j.legalAccessibility !== "UNKNOWN") {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} legalAccessibility must be UNKNOWN — honest state per PROMPT 41`,
      );
    }
    // All legalAccessibilityEvidenceSource must be NONE.
    if (j.legalAccessibilityEvidenceSource !== "NONE") {
      throw new Error(
        `JURISDICTION_TRUTH: jurisdiction ${j.jurisdictionCode} legalAccessibilityEvidenceSource must be NONE — honest state per PROMPT 41`,
      );
    }
  }
}

// Execute all invariants at module load
assertEightCanonicalStatesPresent();
assertEightSeededJurisdictionsPresent();
assertUnknownIsConservativeBlock();
assertNoInternalRegistryAsLegalAuthority();
assertCnyCnhDistinct();
assertNoCnySettlementWithoutLegalAccessibility();
assertNoJurisdictionLegallyAccessible();
assertAllJurisdictionsHonestState();
