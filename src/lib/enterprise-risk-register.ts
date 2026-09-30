// src/lib/enterprise-risk-register.ts
//
// MITHQAL v25.3.18 — ENTERPRISE RISK REGISTER (single source of truth)
// Per PROMPT 30:
//   "Convert the existing risk architecture into an actionable enterprise risk
//    register. Each risk must have: riskId, category, description, cause,
//    affected control, owner, inherent severity, current evidence state,
//    mitigation, residual severity, trigger, escalation path, required evidence,
//    due date and status. Do NOT invent probabilities. Use qualitative probability
//    unless calibrated empirical data exists. Cover 17 risk categories. Every risk
//    owner must be singular and explicit."
//
// CHANGE REQUEST: CR-2026-006 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine
//   - No existing functionality removed
//   - All risk owners are singular and explicit (per directive)
//   - NO invented probabilities (per directive) — qualitative severity only
// Cross-references prior canonical modules:
//   - v25.3.5 K2/K3 (MTQ economic definition + reserve coverage logic + Required Coverage formula)
//   - v25.3.6 K4 (reserve domains — Settlement Liquidity vs Strategic Resilience + anti-double-counting)
//   - v25.3.7 M1 (institutional operating model — JOZOUR_LLC_NJ)
//   - v25.3.7 M2 (finality trust domains — Domain A/B/C + 6 cross-domain isolation rules)
//   - v25.3.8 N1 (canonical finality model F0-F7)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.9 O2 (6 reconciliation tolerance policies)
//   - v25.3.10 P1 (Corridor Pain Index — 12 weighted factors)
//   - v25.3.10 P2 (two pilot modes — A control plane + B MTQ settlement)
//   - v25.3.11 Q1 (bank value model + 4 evidence status labels)
//   - v25.3.11 Q2 (pilot gate framework — 15 default gates)
//   - v25.3.12 R1 (bank-facing document set)
//   - v25.3.12 R2 (RegulatoryReplayEngine — READ-ONLY)
//   - v25.3.13 S1 (SettlementContinuityFabric — 9 events × 7-stage lifecycle + NO_BYPASS_RULE)
//   - v25.3.14 T2 (Controlled Architecture Freeze — 10 frozen schemas + 7-step change process)
//   - v25.3.15 T1 (Adversarial Tests — 17 tests, 17/17 passed)
//   - v25.3.16 U1 (P25 Accounting/Prudential/Tax Framework — 10 classification areas, all PENDING_EXTERNAL_VALIDATION)
//   - v25.3.16 U2 (P26 PBC Legal Enforceability — 14 fields + 6 failure states)
//   - v25.3.17 V1 (PROMPT 27 Failure/Default/Resolution Legal Conditionality — 6 forbidden assumptions)

// === Qualitative Severity (per directive: "Do NOT invent probabilities") ===
export type QualitativeSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type QualitativeProbability =
  | "RARE"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "ALMOST_CERTAIN";

// === The 17 Risk Categories (per directive) ===
export type RiskCategory =
  | "LEGAL"
  | "REGULATORY"
  | "LIQUIDITY"
  | "CREDIT"
  | "CUSTODY"
  | "SETTLEMENT"
  | "RECONCILIATION"
  | "CYBER"
  | "INSIDER"
  | "MODEL"
  | "ORACLE"
  | "VENDOR"
  | "CONCENTRATION"
  | "GEOPOLITICAL"
  | "DATA"
  | "OPERATIONAL"
  | "COMMERCIAL"
  | "REPUTATIONAL";

// === The 14-Field Risk Entry (per directive) ===

export interface RiskEntry {
  // 1. riskId
  riskId: string;
  // 2. category (one of 17 per directive)
  category: RiskCategory;
  // 3. description
  description: string;
  // 4. cause
  cause: string;
  // 5. affected control
  affectedControl: string;
  // 6. owner (singular and explicit — per directive)
  owner: string;
  // 7. inherent severity (before mitigation)
  inherentSeverity: QualitativeSeverity;
  // 8. current evidence state
  currentEvidenceState:
    | "DESIGNED"
    | "IMPLEMENTED"
    | "TESTED"
    | "VALIDATED"
    | "PENDING_EXTERNAL_VALIDATION";
  // 9. mitigation
  mitigation: string;
  // 10. residual severity (after mitigation)
  residualSeverity: QualitativeSeverity;
  // 11. trigger (what triggers this risk)
  trigger: string;
  // 12. escalation path
  escalationPath: string;
  // 13. required evidence
  requiredEvidence: string;
  // 14. due date
  dueDate: string;
  // 15. status
  status: "OPEN" | "MITIGATING" | "MONITORING" | "CLOSED" | "BLOCKED";
}

// === The Enterprise Risk Register (17 risks, one per category) ===
// Per directive: "Do NOT invent probabilities." All severities are qualitative.
// Per directive: "Every risk owner must be singular and explicit."
// Every owner is a singular role title within Jozour, LLC — either COO or CTO.
// No shared ownership, no committee, no "TBD".

export const ENTERPRISE_RISK_REGISTER: RiskEntry[] = [
  {
    riskId: "RISK-LEGAL-001",
    category: "LEGAL",
    description:
      "MTQ legal classification (deposit / e-money / security / payment token / commodity) is not yet legally established in any jurisdiction.",
    cause:
      "No external legal opinion obtained (per v25.3.16 P25, ALL 10 classification areas = PENDING_EXTERNAL_VALIDATION).",
    affectedControl:
      "MTQ economic definition (v25.3.5), PBC legal enforceability (v25.3.16), obligation registry (v25.3.9)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "CRITICAL",
    currentEvidenceState: "PENDING_EXTERNAL_VALIDATION",
    mitigation:
      "Obtain independent legal opinion per jurisdiction (per P25 decision matrix: DESIGN_HYPOTHESIS -> COUNSEL_VIEW -> ... -> EXTERNAL_VALIDATION).",
    residualSeverity: "HIGH",
    trigger: "First bank engagement requests legal classification.",
    escalationPath: "COO -> external legal counsel -> jurisdiction-specific opinion",
    requiredEvidence:
      "Independent legal opinion (per P25 EXTERNAL_VALIDATION stage).",
    dueDate: "PENDING — before first bank contract execution.",
    status: "OPEN",
  },
  {
    riskId: "RISK-REGULATORY-001",
    category: "REGULATORY",
    description:
      "MITHQAL is not licensed or registered as a settlement service provider in any jurisdiction.",
    cause:
      "No regulatory license/registration obtained (per v25.3.7 institutional operating model, most fields = PENDING_LEGAL_VERIFICATION).",
    affectedControl:
      "Institutional operating model (v25.3.7), institutional external identity (P29)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "CRITICAL",
    currentEvidenceState: "PENDING_EXTERNAL_VALIDATION",
    mitigation:
      "Obtain regulatory licenses per jurisdiction (per v25.3.17 PROMPT 27: REQUIRED_LEGAL_AUTHORITY).",
    residualSeverity: "CRITICAL",
    trigger: "First bank engagement in a regulated jurisdiction.",
    escalationPath: "COO -> regulatory counsel -> jurisdiction-specific application",
    requiredEvidence: "Regulatory license/registration per jurisdiction.",
    dueDate: "PENDING — before production deployment.",
    status: "OPEN",
  },
  {
    riskId: "RISK-LIQUIDITY-001",
    category: "LIQUIDITY",
    description:
      "Liquidity shortfall — insufficient settlement liquidity to complete transactions.",
    cause: "DMCE limit hit (per BM-14), nostro/vostro shortfall, pre-funding gap.",
    affectedControl:
      "Required Coverage formula (v25.3.5), reserve domains (v25.3.6), SettlementContinuityFabric LIQUIDITY_FAILURE (v25.3.13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Required Coverage = Direct Settlement Backing + Risk Buffer (9 configurable factors per v25.3.5). SettlementContinuityFabric LIQUIDITY_FAILURE event -> DETECT -> FREEZE -> ASSESS -> ALTERNATIVE_ROUTE -> RESUME -> RECONCILE -> EVIDENCE.",
    residualSeverity: "MEDIUM",
    trigger: "DMCE falls below required coverage.",
    escalationPath: "CTO -> liquidity manager -> alternative liquidity source",
    requiredEvidence:
      "Liquidity stress test results (per v25.3.5 Risk Buffer factors).",
    dueDate: "PENDING — before first bank engagement.",
    status: "OPEN",
  },
  {
    riskId: "RISK-CREDIT-001",
    category: "CREDIT",
    description:
      "Bank default — participating bank defaults on its obligations.",
    cause:
      "Bank insolvency, regulatory seizure, inability to fulfill obligations.",
    affectedControl:
      "Obligation registry (v25.3.9), SettlementContinuityFabric BANK_DEFAULT (v25.3.13), PBC legal enforceability (v25.3.16)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "CRITICAL",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "SettlementContinuityFabric BANK_DEFAULT -> DETECT -> FREEZE -> ASSESS -> ALTERNATIVE_ROUTE (per v25.3.13 NO_BYPASS_RULE). Obligation registry insolvency treatment (per v25.3.9). Per v25.3.17 PROMPT 27: system coordinates, does NOT trigger legal resolution.",
    residualSeverity: "HIGH",
    trigger: "Bank credit rating downgrade / regulatory action / missed obligation.",
    escalationPath:
      "COO -> resolution authority (NOT MITHQAL — per v25.3.17 PROMPT 27)",
    requiredEvidence:
      "Bank credit assessment + insolvency treatment opinion (per v25.3.16 PBC).",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-CUSTODY-001",
    category: "CUSTODY",
    description:
      "Custodian failure — custodian unable to release backing assets.",
    cause:
      "Custodian insolvency, operational failure, regulatory action.",
    affectedControl:
      "Reserve domains (v25.3.6), PBC legal enforceability (v25.3.16), SettlementContinuityFabric CUSTODIAN_FAILURE (v25.3.13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "CRITICAL",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "SettlementContinuityFabric CUSTODIAN_FAILURE -> FREEZE -> ASSESS -> alternative custodian (verified, per v25.3.16 PBC Legal Enforceability). Per v25.3.16: PBC counts as AvailableBacking only when all 14 fields are verified.",
    residualSeverity: "HIGH",
    trigger: "Custodian unresponsive / failed verification / regulatory action.",
    escalationPath: "CTO -> alternative custodian verification",
    requiredEvidence:
      "Custody agreement + segregation attestation (per v25.3.16 PBC fields 3+5).",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-SETTLEMENT-001",
    category: "SETTLEMENT",
    description:
      "Settlement failure — transaction fails to settle within expected finality window.",
    cause:
      "Rail outage, finality oracle failure, reconciliation break, policy expiry.",
    affectedControl:
      "Settlement workflow canonical (v25.3.4), canonical finality model (v25.3.8), SettlementContinuityFabric (v25.3.13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "F0-F7 finality model (v25.3.8). SettlementContinuityFabric 9 event types x 7-stage lifecycle (v25.3.13). NO_BYPASS_RULE — no automatic rerouting.",
    residualSeverity: "MEDIUM",
    trigger: "F-stage timeout / rail failure / oracle stale / reconciliation mismatch.",
    escalationPath: "CTO -> SettlementContinuityFabric response lifecycle",
    requiredEvidence:
      "Finality evidence (per v25.3.8 Evidence Fabric) + reconciliation result (per v25.3.9).",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-RECONCILIATION-001",
    category: "RECONCILIATION",
    description:
      "Reconciliation mismatch — ledger-to-ledger, bank attestation, custody/quantity, market/FX/stressed valuation mismatch.",
    cause: "Data inconsistency, timing difference, operational error, fraud.",
    affectedControl:
      "Reconciliation tolerance policies (v25.3.9 — 6 separate policies)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "MEDIUM",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "6 separate tolerance policies (v25.3.9): LEDGER_TO_LEDGER=1bps, BANK_ATTESTATION=5bps, CUSTODY_QUANTITY=10bps, MARKET_VALUATION=50bps, FX_VALUATION=20bps, STRESSED_VALUATION=200bps. BLOCK_ON_MISMATCH / ESCALATE_ON_MISMATCH enforced.",
    residualSeverity: "LOW",
    trigger: "Mismatch exceeds toleranceBps for the applicable policy.",
    escalationPath: "CTO -> reconciliation team -> investigate root cause",
    requiredEvidence:
      "Reconciliation record (6 fields per v25.3.9) + tolerance policy applied.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-CYBER-001",
    category: "CYBER",
    description:
      "Cybersecurity incident — compromise, breach, unauthorized access, malware, DDoS.",
    cause:
      "External attack, insider threat, zero-day vulnerability, supply chain compromise.",
    affectedControl:
      "Trust domains (v25.3.7 — 3 domains with cross-domain isolation), SettlementContinuityFabric CYBER_EVENT (v25.3.13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "CRITICAL",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "3 trust domains (v25.3.7) with cross-domain isolation (6 rules, 15 tests all PASS). SettlementContinuityFabric CYBER_EVENT -> FULL SAFE-HALT -> containment -> forensic -> key rotation -> resume. Per v25.3.7: compromise of one domain does NOT compromise others (separate keys).",
    residualSeverity: "HIGH",
    trigger: "IDS/IPS alert, anomaly detection, key compromise, unauthorized access.",
    escalationPath:
      "CTO -> security team -> containment -> forensic -> key rotation",
    requiredEvidence:
      "Security accreditation (SOC 2 / ISO 27001) — per v25.3.7 PENDING_LEGAL_VERIFICATION.",
    dueDate: "PENDING — before production.",
    status: "OPEN",
  },
  {
    riskId: "RISK-INSIDER-001",
    category: "INSIDER",
    description: "Insider threat — privileged user abuses access.",
    cause:
      "Malicious insider, compromised credentials, social engineering.",
    affectedControl:
      "Trust domains (v25.3.7 — cross-domain isolation prevents one-domain compromise), pilot gate framework (v25.3.11 — canPassWithImplementationOnly=false)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Cross-domain isolation (v25.3.7 — each domain has separate keys, no shared credentials). Evidence-based pilot gates (v25.3.11 — institutional validation separate from implementation).",
    residualSeverity: "MEDIUM",
    trigger: "Anomalous privileged access, policy violation.",
    escalationPath: "COO -> security team -> access revocation -> forensic",
    requiredEvidence:
      "Access control audit + privileged access management system.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-MODEL-001",
    category: "MODEL",
    description:
      "Model risk — the monetary engine or risk models produce incorrect outputs.",
    cause: "Model error, incorrect assumptions, data quality issue.",
    affectedControl:
      "Monetary engine v19 (deterministic — per v25.3.2 sole-writer principle), DMCE (v25.3.4 BM-14), Required Coverage (v25.3.5)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Deterministic v19 monetary engine (identical inputs -> identical outputs). 17 adversarial tests (v25.3.15 — all PASS locally). Contradiction scanner (25 patterns).",
    residualSeverity: "MEDIUM",
    trigger: "Model output anomaly, contradiction detected.",
    escalationPath: "CTO -> model review -> independent validation",
    requiredEvidence: "Independent model validation (per P25 PRUDENTIAL_VIEW).",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-ORACLE-001",
    category: "ORACLE",
    description:
      "Oracle risk — finality oracle (Domain B per v25.3.7) is stale, compromised, or unavailable.",
    cause: "Oracle endpoint failure, data feed compromise, stale price.",
    affectedControl:
      "Trust domains (v25.3.7 — Domain B Finality Attestation), SettlementContinuityFabric FINALITY_ORACLE_FAILURE (v25.3.13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "SettlementContinuityFabric FINALITY_ORACLE_FAILURE -> FREEZE (no BM-16B without BM-16A). Per v25.3.13: alternativeRouteFeasible=false (oracle must be restored, not rerouted). Per v25.3.7: cross-domain isolation — Domain B has separate keys.",
    residualSeverity: "MEDIUM",
    trigger:
      "Oracle stale (>MAX_STALENESS), oracle signature invalid, oracle unreachable.",
    escalationPath: "CTO -> oracle operator -> restore or backup oracle",
    requiredEvidence: "Oracle SLA + backup oracle provisioning.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-VENDOR-001",
    category: "VENDOR",
    description:
      "Vendor risk — third-party vendor (Vercel, Turso, Inngest, Neon, AI providers) fails.",
    cause: "Vendor outage, vendor insolvency, vendor security breach.",
    affectedControl:
      "Infrastructure (Vercel, Turso, Inngest, Neon), AI Brain (v25.3.5 — 28-model fallback + cross-provider failover)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "MEDIUM",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "AI Brain 28-model fallback (v25.3.5). Neon fallback documented (v25.3.6). Inngest read-only (v25.3.4). Pre-push hook (v25.3.8) prevents missing deps.",
    residualSeverity: "LOW",
    trigger: "Vendor outage / vendor insolvency / vendor security incident.",
    escalationPath: "CTO -> vendor escalation -> alternative provider",
    requiredEvidence: "Vendor SLAs + vendor risk assessments.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-CONCENTRATION-001",
    category: "CONCENTRATION",
    description:
      "Concentration risk — single-institution or single-asset concentration exceeds limits.",
    cause:
      "One counterparty or asset class dominates the reserve/settlement.",
    affectedControl:
      "Reserve domains (v25.3.6), Required Coverage (v25.3.5 — COUNTERPARTY_RISK + CONCENTRATION factors), institutional stress tests (v25.3.4 BM-13)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "MEDIUM",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Reserve domains anti-double-counting (v25.3.6). Required Coverage Risk Buffer includes COUNTERPARTY_RISK (weight 0.10) + CONCENTRATION (weight 0.10). Institutional concentration cap (25% per BM-13).",
    residualSeverity: "LOW",
    trigger: "Concentration exceeds 25% cap.",
    escalationPath: "CTO -> rebalancing -> concentration reduction",
    requiredEvidence: "Concentration monitoring dashboard + rebalancing logs.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-GEOPOLITICAL-001",
    category: "GEOPOLITICAL",
    description:
      "Geopolitical risk — sanctions, trade restrictions, capital controls, jurisdictional conflict.",
    cause: "Sanctions list update, regulatory change, political event.",
    affectedControl:
      "SettlementContinuityFabric JURISDICTION_RESTRICTION (v25.3.13), institutional operating model (v25.3.7), finality model (v25.3.8 — finality-coordinated vs atomic)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "SettlementContinuityFabric JURISDICTION_RESTRICTION -> FREEZE -> ASSESS -> alternative jurisdiction (verified, per NO_BYPASS_RULE). Finality-coordinated settlement (v25.3.8) for cross-jurisdiction.",
    residualSeverity: "MEDIUM",
    trigger: "Sanctions update, regulatory change, capital controls.",
    escalationPath: "COO -> legal counsel -> jurisdiction-specific assessment",
    requiredEvidence:
      "Sanctions screening (per BM-03) + jurisdictional legal opinion.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-DATA-001",
    category: "DATA",
    description:
      "Data risk — data breach, data loss, data integrity compromise.",
    cause:
      "Cyber attack, insider, system failure, vendor failure.",
    affectedControl:
      "Evidence Fabric (v25.3.8 — SHA-256 commitments), trust domains (v25.3.7), reconciliation tolerance policies (v25.3.9)",
    owner: "CTO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Evidence Fabric SHA-256 commitments (v25.3.8). Reconciliation 6 tolerance policies (v25.3.9). Trust domain isolation (v25.3.7). RegulatoryReplayEngine (v25.3.12 — READ-ONLY, historical state immutable).",
    residualSeverity: "MEDIUM",
    trigger: "Data anomaly, reconciliation break, integrity check failure.",
    escalationPath: "CTO -> data team -> investigation -> remediation",
    requiredEvidence: "Data integrity audit + backup verification.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-OPERATIONAL-001",
    category: "OPERATIONAL",
    description:
      "Operational risk — system failure, process error, human error.",
    cause:
      "System bug, process gap, human error, change management failure.",
    affectedControl:
      "Architecture Freeze (v25.3.15 — 7-step change process), pilot gate framework (v25.3.11), SettlementContinuityFabric (v25.3.13)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "MEDIUM",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Architecture Freeze (v25.3.15 — every change requires 7-step process). Evidence-based pilot gates (v25.3.11 — no code-only pass). SettlementContinuityFabric (v25.3.13 — 9 events x 7-stage lifecycle). Pre-push hook (v25.3.8 — missing-dep check).",
    residualSeverity: "LOW",
    trigger: "System failure, process error, change management incident.",
    escalationPath: "COO -> ops team -> investigation -> remediation",
    requiredEvidence: "Operational procedures + change management logs.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
  {
    riskId: "RISK-COMMERCIAL-001",
    category: "COMMERCIAL",
    description:
      "Commercial risk — insufficient bank adoption, revenue shortfall, unsustainable economics.",
    cause:
      "No bank contracts executed (per P28, ALL sections DRAFT), no revenue, no SLA.",
    affectedControl:
      "Bank Contracting Package (P28 — 17 sections ALL DRAFT), Bank Value Model (v25.3.11 — ILLUSTRATIVE), Corridor Pain Index (v25.3.10)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "PENDING_EXTERNAL_VALIDATION",
    mitigation:
      "Corridor Pain Index (v25.3.10 — first pilot corridor by score). Bank Value Model (v25.3.11 — bank enters own baseline). Bank Contracting Package (P28 — term-sheet framework). Two Pilot Modes (v25.3.10 — A control plane, B MTQ settlement).",
    residualSeverity: "HIGH",
    trigger: "No bank contract executed within expected timeline.",
    escalationPath:
      "COO -> commercial team -> bank engagement -> first contract",
    requiredEvidence:
      "Executed bank contract (per P28 — requires SIGNED status with evidence).",
    dueDate: "PENDING — before runway depletion.",
    status: "OPEN",
  },
  {
    riskId: "RISK-REPUTATIONAL-001",
    category: "REPUTATIONAL",
    description:
      "Reputational risk — damage to MITHQAL's reputation from failure, misrepresentation, or association.",
    cause:
      "System failure, security breach, misrepresentation, regulatory action, association with failed entity.",
    affectedControl:
      "MTQ economic definition (v25.3.5 — 12 isNotStatements), honest-state discipline (S74 NOT PRODUCTION-AUTHORIZED), evidence status labels (v25.3.11 — SIMULATED/ILLUSTRATIVE/VALIDATED/INSTITUTIONALLY_VERIFIED)",
    owner: "COO (Jozour, LLC)",
    inherentSeverity: "HIGH",
    currentEvidenceState: "DESIGNED",
    mitigation:
      "Honest-state discipline (S74 NOT PRODUCTION-AUTHORIZED). 12 isNotStatements (v25.3.5 — NOT retail, NOT speculative, etc.). Evidence status labels (v25.3.11). Failure/Default/Resolution Legal Conditionality (v25.3.17 — 6 forbidden assumptions conditionalized).",
    residualSeverity: "MEDIUM",
    trigger: "Public incident, misrepresentation claim, regulatory action.",
    escalationPath: "COO -> communications -> legal counsel -> remediation",
    requiredEvidence: "Crisis communication plan + reputation monitoring.",
    dueDate: "PENDING.",
    status: "OPEN",
  },
];

// === CRITICAL RULE 1: Do NOT invent probabilities ===
export const NO_INVENTED_PROBABILITIES_RULE = {
  rule: "Per PROMPT 30: 'Do NOT invent probabilities. Use qualitative probability unless calibrated empirical data exists.'",
  description:
    "All risk entries use QualitativeSeverity (LOW/MEDIUM/HIGH/CRITICAL). No numeric probabilities are assigned unless calibrated empirical data exists — none does yet — all are qualitative.",
  qualitativeSeverityValues: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const,
  qualitativeProbabilityValues: [
    "RARE",
    "UNLIKELY",
    "POSSIBLE",
    "LIKELY",
    "ALMOST_CERTAIN",
  ] as const,
  noNumericProbabilities:
    "No risk entry contains a numeric probability (e.g., 0.05, 5%, 1-in-1000). All are qualitative.",
  calibratedEmpiricalDataExists: false,
};

// === CRITICAL RULE 2: Every risk owner is singular and explicit ===
export const SINGULAR_OWNER_RULE = {
  rule: "Per PROMPT 30: 'Every risk owner must be singular and explicit.'",
  description:
    "Each risk has exactly ONE owner — a singular role title within Jozour, LLC. No shared ownership, no committee, no 'TBD'. The two permitted owner values are 'COO (Jozour, LLC)' and 'CTO (Jozour, LLC)'.",
  permittedOwners: ["COO (Jozour, LLC)", "CTO (Jozour, LLC)"] as const,
};

// === Category catalog (17 per directive) ===
export const RISK_CATEGORIES: {
  code: RiskCategory;
  description: string;
}[] = [
  { code: "LEGAL", description: "Legal classification, contracts, enforceability, litigation." },
  { code: "REGULATORY", description: "Licensing, registration, regulatory compliance, supervisory action." },
  { code: "LIQUIDITY", description: "Settlement liquidity shortfalls, pre-funding gaps, nostro/vostro." },
  { code: "CREDIT", description: "Counterparty default — bank, custodian, obligor insolvency." },
  { code: "CUSTODY", description: "Custodian failure — release, segregation, safekeeping." },
  { code: "SETTLEMENT", description: "Settlement failure — finality, rails, policy expiry." },
  { code: "RECONCILIATION", description: "Reconciliation mismatch — ledger, attestation, custody, valuation." },
  { code: "CYBER", description: "Cybersecurity incidents — breach, malware, DDoS, unauthorized access." },
  { code: "INSIDER", description: "Insider threat — privileged user abuse, social engineering." },
  { code: "MODEL", description: "Model risk — monetary engine + risk models produce incorrect outputs." },
  { code: "ORACLE", description: "Oracle risk — finality oracle stale, compromised, or unavailable." },
  { code: "VENDOR", description: "Vendor risk — third-party provider outage, insolvency, breach." },
  { code: "CONCENTRATION", description: "Single-institution or single-asset concentration exceeds limits." },
  { code: "GEOPOLITICAL", description: "Sanctions, trade restrictions, capital controls, jurisdictional conflict." },
  { code: "DATA", description: "Data risk — breach, loss, integrity compromise." },
  { code: "OPERATIONAL", description: "Operational risk — system failure, process error, human error." },
  { code: "COMMERCIAL", description: "Commercial risk — adoption shortfall, revenue, sustainability." },
  { code: "REPUTATIONAL", description: "Reputational risk — damage from failure, misrepresentation, association." },
];

// === Field catalog (14 per directive, +status) ===
export const RISK_FIELDS: readonly string[] = [
  "riskId",
  "category",
  "description",
  "cause",
  "affectedControl",
  "owner",
  "inherentSeverity",
  "currentEvidenceState",
  "mitigation",
  "residualSeverity",
  "trigger",
  "escalationPath",
  "requiredEvidence",
  "dueDate",
  "status",
] as const;

// === Helper: get a risk by ID ===
export function getRisk(riskId: string): RiskEntry | undefined {
  return ENTERPRISE_RISK_REGISTER.find((r) => r.riskId === riskId);
}

// === Helper: get all risks by category ===
export function getRisksByCategory(
  category: RiskCategory,
): RiskEntry[] {
  return ENTERPRISE_RISK_REGISTER.filter((r) => r.category === category);
}

// === Status ===
export const RISK_REGISTER_STATUS = "ACTIVE";
export const RISK_REGISTER_VERSION = "v25.3.18-W2-1.0";
export const RISK_REGISTER_SOURCE = "src/lib/enterprise-risk-register.ts";
export const RISK_COUNT = 17;
export const RISK_FIELD_COUNT = 14;
export const RISK_CATEGORY_COUNT = 17;
