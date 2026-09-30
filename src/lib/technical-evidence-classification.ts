// src/lib/technical-evidence-classification.ts
//
// MITHQAL v25.3.21 — CANONICAL TECHNICAL EVIDENCE CLASSIFICATION STANDARD
// (single source of truth for what technical evidence proves and does NOT prove)
//
// Per PROMPT 42 (verbatim):
//   "Create a canonical Technical Evidence Classification Standard.
//    Do not allow: HTTP 200, page rendering, successful API response,
//    unit test pass, integration test pass, or internal verification to be
//    represented as proof of: correctness, financial validity, legal
//    finality, security assurance, institutional validation, regulatory
//    authorization, or production readiness.
//    Separate evidence classes:
//    AVAILABILITY, FUNCTIONAL_CORRECTNESS, INTEGRATION_CORRECTNESS,
//    PERFORMANCE, SECURITY_ASSURANCE, DATA_INTEGRITY, LEGAL_EVIDENCE,
//    INSTITUTIONAL_VALIDATION, REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION.
//    Each metric must explicitly state what it proves and what it does NOT prove."
//
// CHANGE REQUEST: CR-2026-018 (per Architecture Freeze v25.3.15) — ADDITIVE, APPROVED (COO+CTO)
// VERSION: v25.3.21
//
// Architecture Freeze compliance:
//   - ADDITIVE only — does NOT modify any FROZEN schema (per v25.3.15 T2)
//   - Does NOT modify the v19 monetary engine (per CRITICAL CONSTRAINTS)
//   - No existing functionality removed
//   - Separates technical evidence classes from institutional/legal evidence
//   - Each class explicitly states whatItProves + whatItDoesNotProve
//   - HTTP 200 / page render / API response / unit test pass / integration
//     test pass / internal verification NEVER proof of: correctness, financial
//     validity, legal finality, security assurance, institutional validation,
//     regulatory authorization, or production readiness
//
// Cross-references prior canonical modules (READ-ONLY, no code-level modification):
//   - v25.3.2 K2 (MTQ economic definition — canonical MTQ description)
//   - v25.3.8 N1 (canonical finality model F0-F7 — 8 stages + 3 finality types)
//   - v25.3.8 N2 (Institutional Evidence Fabric — 15-field EvidencePackage +
//     SHA-256 commitments)
//   - v25.3.9 O1 (Institutional Settlement Obligation Registry — 13 fields)
//   - v25.3.11 Q1 (bank value model — 4 evidence status labels
//     SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED)
//   - v25.3.14 T2 (Controlled Architecture Freeze — 10 frozen schemas +
//     7-step change process)
//   - v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT)
//   - v25.3.18 W2 (Enterprise Risk Register — 17 risks + Insurance Framework)
//   - v25.3.19 X1 (Data Governance — 15 dimensions × 7 data types)
//   - v25.3.20 Y2 (Institutionalization Operating Plan — 11 role categories)

// ============================================================================
// TYPES
// ============================================================================

// 10 evidence classes per directive (PROMPT 42 verbatim)
export type EvidenceClassId =
  | "AVAILABILITY"
  | "FUNCTIONAL_CORRECTNESS"
  | "INTEGRATION_CORRECTNESS"
  | "PERFORMANCE"
  | "SECURITY_ASSURANCE"
  | "DATA_INTEGRITY"
  | "LEGAL_EVIDENCE"
  | "INSTITUTIONAL_VALIDATION"
  | "REGULATORY_EVIDENCE"
  | "PRODUCTION_AUTHORIZATION";

// Status marker per v25.3.2 (active/superseded/historical/pending_validation)
export type EvidenceClassStatus =
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION";

// Honesty tier — the evidence's stage of validation
// DESIGN-TIME: only canonical definition exists; no measured evidence yet
// MEASURED: technical instrumentation has captured a real metric (still NOT institutional)
// INSTITUTIONAL: an independent auditor or regulator has attested the evidence
export type EvidenceHonestyTier =
  | "DESIGN_TIME"
  | "MEASURED"
  | "INSTITUTIONAL";

// The 6 categories that may NEVER be claimed by technical-only evidence
// (HTTP 200, page render, API response, unit test pass, integration test pass,
//  internal verification). These map to the directive's forbidden equivalences.
export type ForbiddenEquivalence =
  | "correctness"
  | "financial_validity"
  | "legal_finality"
  | "security_assurance"
  | "institutional_validation"
  | "regulatory_authorization"
  | "production_readiness";

export interface EvidenceClass {
  // identity
  classId: EvidenceClassId;
  name: string;
  description: string;

  // The 6 technical signals (per directive) that this class DOES NOT constitute
  // (each carries the directive's exact forbidden equivalence)
  whatItIsNot: string[];

  // What this class proves (when measured honestly)
  whatItProves: string[];

  // What this class DOES NOT prove (per directive — explicit)
  whatItDoesNotProve: string[];

  // Examples of what would qualify as evidence of this class
  // (per directive: "Each metric must explicitly state what it proves and what it does NOT prove")
  qualifyingEvidence: string[];

  // Examples of what does NOT qualify as evidence of this class
  nonQualifyingEvidence: string[];

  // Honesty tier (per v25.3.2 status markers + Q1 evidence status)
  honestyTier: EvidenceHonestyTier;

  // Whether this class can be satisfied by HTTP 200 / page render / API response /
  // unit test pass / integration test pass / internal verification alone
  satisfiableByTechnicalOnlySignal: boolean;

  // The current MITHQAL status of this evidence class
  // (per v25.3.2 status markers; most are PENDING_VALIDATION because no
  //  external institutional/regulatory evidence has been obtained yet)
  status: EvidenceClassStatus;

  // Cross-references to prior canonical modules
  crossReferences: string[];
}

// ============================================================================
// CRITICAL RULE (per directive — verbatim)
// ============================================================================

export const HTTP_200_NOT_PROOF_RULE = {
  ruleId: "HTTP_200_NOT_PROOF_RULE",
  rule:
    "Per PROMPT 42: HTTP 200, page rendering, successful API response, " +
    "unit test pass, integration test pass, and internal verification " +
    "must NOT be represented as proof of: correctness, financial validity, " +
    "legal finality, security assurance, institutional validation, " +
    "regulatory authorization, or production readiness.",
  description:
    "Technical-only signals (HTTP 200, page rendering, a successful API " +
    "response, a unit test pass, an integration test pass, or an internal " +
    "verification) are necessary engineering signals. They are NOT proof " +
    "of any institutional-grade property. They cannot substitute for legal " +
    "opinion, auditor attestation, regulatory license, or institutional " +
    "validation.",
  forbiddenEquivalences: [
    "HTTP 200 is NOT proof of correctness",
    "HTTP 200 is NOT proof of financial validity",
    "HTTP 200 is NOT proof of legal finality",
    "HTTP 200 is NOT proof of security assurance",
    "HTTP 200 is NOT proof of institutional validation",
    "HTTP 200 is NOT proof of regulatory authorization",
    "HTTP 200 is NOT proof of production readiness",
    "Page rendering is NOT proof of correctness",
    "Page rendering is NOT proof of financial validity",
    "Page rendering is NOT proof of legal finality",
    "Page rendering is NOT proof of security assurance",
    "Page rendering is NOT proof of institutional validation",
    "Page rendering is NOT proof of regulatory authorization",
    "Page rendering is NOT proof of production readiness",
    "A successful API response is NOT proof of correctness",
    "A successful API response is NOT proof of financial validity",
    "A successful API response is NOT proof of legal finality",
    "A successful API response is NOT proof of security assurance",
    "A successful API response is NOT proof of institutional validation",
    "A successful API response is NOT proof of regulatory authorization",
    "A successful API response is NOT proof of production readiness",
    "A unit test pass is NOT proof of correctness",
    "A unit test pass is NOT proof of financial validity",
    "A unit test pass is NOT proof of legal finality",
    "A unit test pass is NOT proof of security assurance",
    "A unit test pass is NOT proof of institutional validation",
    "A unit test pass is NOT proof of regulatory authorization",
    "A unit test pass is NOT proof of production readiness",
    "An integration test pass is NOT proof of correctness",
    "An integration test pass is NOT proof of financial validity",
    "An integration test pass is NOT proof of legal finality",
    "An integration test pass is NOT proof of security assurance",
    "An integration test pass is NOT proof of institutional validation",
    "An integration test pass is NOT proof of regulatory authorization",
    "An integration test pass is NOT proof of production readiness",
    "Internal verification is NOT proof of correctness",
    "Internal verification is NOT proof of financial validity",
    "Internal verification is NOT proof of legal finality",
    "Internal verification is NOT proof of security assurance",
    "Internal verification is NOT proof of institutional validation",
    "Internal verification is NOT proof of regulatory authorization",
    "Internal verification is NOT proof of production readiness",
  ] as const,
  whatItForbids:
    "Treating HTTP 200, page rendering, a successful API response, a unit " +
    "test pass, an integration test pass, or an internal verification as " +
    "any of the 7 institutional-grade properties (correctness, financial " +
    "validity, legal finality, security assurance, institutional " +
    "validation, regulatory authorization, production readiness).",
  whatItPermits:
    "Using HTTP 200, page rendering, API responses, unit test pass, " +
    "integration test pass, and internal verification as engineering " +
    "signals that indicate (NOT prove) that the technical surface is " +
    "responding as designed. These signals are necessary inputs to " +
    "AVAILABILITY, FUNCTIONAL_CORRECTNESS, INTEGRATION_CORRECTNESS, " +
    "PERFORMANCE, and DATA_INTEGRITY evidence classes — but they are not " +
    "sufficient on their own for SECURITY_ASSURANCE, LEGAL_EVIDENCE, " +
    "INSTITUTIONAL_VALIDATION, REGULATORY_EVIDENCE, or " +
    "PRODUCTION_AUTHORIZATION.",
  enforcement:
    "Every EvidenceClass in TECHNICAL_EVIDENCE_CLASSES carries a " +
    "`satisfiableByTechnicalOnlySignal` flag. Classes marked false " +
    "(SECURITY_ASSURANCE, LEGAL_EVIDENCE, INSTITUTIONAL_VALIDATION, " +
    "REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION) cannot be claimed " +
    "by HTTP 200, page render, API response, unit test pass, integration " +
    "test pass, or internal verification alone. Runtime invariant " +
    "`assertNoTechnicalOnlySignalClaimsInstitutionalProperty` fails fast " +
    "if any class is misconfigured.",
} as const;

// ============================================================================
// THE 10 EVIDENCE CLASSES (per directive — verbatim)
// ============================================================================

export const TECHNICAL_EVIDENCE_CLASSES: EvidenceClass[] = [
  // =====================================================================
  // 1. AVAILABILITY
  // =====================================================================
  {
    classId: "AVAILABILITY",
    name: "Availability",
    description:
      "Evidence that the system surface is reachable and responsive to " +
      "engineering probes (uptime, health checks, latency at the technical " +
      "interface). AVAILABILITY measures the technical surface, not the " +
      "institutional property.",
    whatItIsNot: [
      "HTTP 200 from /api/health is NOT proof that the system is correct",
      "HTTP 200 from /api/health is NOT proof of financial validity",
      "HTTP 200 from /api/health is NOT proof of legal finality",
      "HTTP 200 from /api/health is NOT proof of security assurance",
      "HTTP 200 from /api/health is NOT proof of institutional validation",
      "HTTP 200 from /api/health is NOT proof of regulatory authorization",
      "HTTP 200 from /api/health is NOT proof of production readiness",
    ],
    whatItProves: [
      "The endpoint replied with HTTP 200 within the measured latency window",
      "The process bound the port and returned a syntactically valid response",
      "The health probe reached the service and returned its declared status",
      "The technical surface was reachable at the measurement timestamp",
    ],
    whatItDoesNotProve: [
      "Correctness — the response may be a 200 with semantically wrong data",
      "Financial validity — a 200 from a mint endpoint does not prove the mint was authorized",
      "Legal finality — a 200 from a settlement endpoint does not prove settlement finality was achieved",
      "Security assurance — a 200 does not prove the endpoint is free of vulnerabilities",
      "Institutional validation — a 200 does not prove any auditor or regulator approved the system",
      "Regulatory authorization — a 200 does not prove a license was granted",
      "Production readiness — a 200 does not prove the system is authorized for production use",
    ],
    qualifyingEvidence: [
      "Uptime measurement over a sustained window with an explicit SLA target (e.g., 99.9% over 30 days)",
      "Synthetic health-check results stored in an observability backend with retention",
      "Latency percentile data (p50, p95, p99) captured at the technical interface",
      "Error-rate telemetry differentiated by error class (5xx, timeout, connection-refused)",
    ],
    nonQualifyingEvidence: [
      "A single successful curl to /api/health returning HTTP 200",
      "A screenshot of a healthy dashboard",
      "An internal verification note stating 'the system is up'",
      "A page rendering successfully in the browser",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: true,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.8 N2 (EvidencePackage.complianceState.screenedAt — ISO 8601)",
      "v25.3.14 T2 (Architecture Freeze — health-endpoint interface)",
    ],
  },

  // =====================================================================
  // 2. FUNCTIONAL_CORRECTNESS
  // =====================================================================
  {
    classId: "FUNCTIONAL_CORRECTNESS",
    name: "Functional Correctness",
    description:
      "Evidence that the system's behavior matches its functional " +
      "specification for tested scenarios. FUNCTIONAL_CORRECTNESS measures " +
      "conformance to the spec, not the absence of all defects.",
    whatItIsNot: [
      "A passing unit test is NOT proof of correctness",
      "A passing unit test is NOT proof of financial validity",
      "A passing unit test is NOT proof of legal finality",
      "A passing unit test is NOT proof of security assurance",
      "A passing unit test is NOT proof of institutional validation",
      "A passing unit test is NOT proof of regulatory authorization",
      "A passing unit test is NOT proof of production readiness",
    ],
    whatItProves: [
      "For the specific input scenarios tested, the system produced the spec-defined output",
      "The unit under test conformed to the functional contract for those cases",
      "Regression against the tested behavior is detectable on subsequent runs",
    ],
    whatItDoesNotProve: [
      "Correctness for untested inputs — coverage is not completeness",
      "Financial validity — a passing test on a mint call does not prove the mint was authorized under bank risk policy",
      "Legal finality — a passing test does not prove settlement finality was achieved in production",
      "Security assurance — a passing functional test does not prove the absence of exploitable defects",
      "Institutional validation — passing tests is internal verification, not auditor attestation",
      "Regulatory authorization — passing tests does not prove a license was granted",
      "Production readiness — passing tests is one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "Unit + property + behavior test suites with measured coverage and explicit coverage target",
      "Mutation-testing score (e.g., Stryker) — measures test quality, not just coverage",
      "Specification conformance report mapping test cases to spec clauses",
      "Regression history showing stable pass rate over the evaluation window",
    ],
    nonQualifyingEvidence: [
      "A single passing unit test reported by an internal CI",
      "An internal verification note stating 'all tests green'",
      "A successful API response to a manual request",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: true,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.14 T1 (Adversarial Tests — 17 tests, 17/17 passed — but these are inputs to FUNCTIONAL_CORRECTNESS, not proof of production readiness)",
      "v25.3.20 Y2 (Operating Plan — INDEPENDENT_ASSURANCE role: QA Analyst)",
    ],
  },

  // =====================================================================
  // 3. INTEGRATION_CORRECTNESS
  // =====================================================================
  {
    classId: "INTEGRATION_CORRECTNESS",
    name: "Integration Correctness",
    description:
      "Evidence that the system's external interfaces (API contracts, " +
      "event schemas, custody bank adapters, oracle adapters, compliance " +
      "provider hooks) consume and produce data conforming to the agreed " +
      "interface contract for tested scenarios.",
    whatItIsNot: [
      "A passing integration test is NOT proof of correctness",
      "A passing integration test is NOT proof of financial validity",
      "A passing integration test is NOT proof of legal finality",
      "A passing integration test is NOT proof of security assurance",
      "A passing integration test is NOT proof of institutional validation",
      "A passing integration test is NOT proof of regulatory authorization",
      "A passing integration test is NOT proof of production readiness",
    ],
    whatItProves: [
      "For the integration scenarios tested, the contract was honored end-to-end",
      "The adapter under test produced conforming schemas and observed the agreed finality ordering",
      "Contract regression is detectable on subsequent runs",
    ],
    whatItDoesNotProve: [
      "Correctness of the upstream/downstream systems — only the contract surface was tested",
      "Financial validity — passing the integration test does not prove the bank accepted the obligation",
      "Legal finality — a green integration test does not prove settlement finality was achieved against a real bank",
      "Security assurance — an integration test does not prove the integration path is free of vulnerabilities",
      "Institutional validation — passing integration tests is internal verification, not auditor attestation",
      "Regulatory authorization — passing integration tests does not prove the bank's regulator approved the integration",
      "Production readiness — integration tests are one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "Contract test suite (e.g., Pact consumer-driven) with explicit provider/consumer versions",
      "End-to-end integration test in a staging-like environment with realistic mock bank responses",
      "Schema-conformance report (e.g., JSON Schema / OpenAPI) for all external interfaces",
      "Backward-compatibility test matrix showing version compatibility with downstream systems",
    ],
    nonQualifyingEvidence: [
      "A single successful API response from a manual probe",
      "An internal verification note stating 'the bank integration works'",
      "A passing test in a stub environment without bank participation",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: true,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.4 J3 (CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary)",
      "v25.3.10 P2 (PILOT_A_CONTROL_PLANE — 8 test areas incl. bank integration)",
      "v25.3.20 Y2 (Operating Plan — BANK_INTEGRATION role category)",
    ],
  },

  // =====================================================================
  // 4. PERFORMANCE
  // =====================================================================
  {
    classId: "PERFORMANCE",
    name: "Performance",
    description:
      "Evidence that the system's measured throughput, latency, and " +
      "resource utilization fall within target envelopes for tested load " +
      "profiles. PERFORMANCE measures engineering behavior under load, " +
      "not institutional authorization.",
    whatItIsNot: [
      "A sub-2-second API response is NOT proof of correctness",
      "A sub-2-second API response is NOT proof of financial validity",
      "A sub-2-second API response is NOT proof of legal finality",
      "A sub-2-second API response is NOT proof of security assurance",
      "A sub-2-second API response is NOT proof of institutional validation",
      "A sub-2-second API response is NOT proof of regulatory authorization",
      "A sub-2-second API response is NOT proof of production readiness",
    ],
    whatItProves: [
      "For the tested load profile, latency percentiles were within the target envelope",
      "For the tested load profile, throughput was within the target envelope",
      "For the tested load profile, resource utilization (CPU, memory, I/O) was within budget",
    ],
    whatItDoesNotProve: [
      "Correctness — a fast response can be semantically wrong",
      "Financial validity — a fast mint call does not prove the mint was authorized",
      "Legal finality — a fast settlement call does not prove finality was achieved",
      "Security assurance — fast responses do not prove the absence of vulnerabilities",
      "Institutional validation — a fast response is not an auditor attestation",
      "Regulatory authorization — performance numbers are not a license",
      "Production readiness — performance at one load profile does not authorize production use",
    ],
    qualifyingEvidence: [
      "Load test report (e.g., k6, Locust) with explicit load profile, p50/p95/p99 latency, and pass/fail vs target",
      "Sustained soak test (e.g., 24-hour) showing no memory growth, no connection leak",
      "Stress test identifying the breaking point and the recovery behavior past that point",
      "Resource utilization telemetry over the test window with explicit SLO budgets",
    ],
    nonQualifyingEvidence: [
      "A single curl with sub-2-second timing",
      "An internal verification note stating 'the API is fast'",
      "A single page rendering quickly in a browser",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: true,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.11 Q1 (bank value model — no hard-coded 7bps or sub-2-second universal claims)",
      "v25.3.13 P1 (Corridor Pain Index — settlement timing is bank-entered)",
    ],
  },

  // =====================================================================
  // 5. SECURITY_ASSURANCE — NOT satisfiable by technical-only signal
  // =====================================================================
  {
    classId: "SECURITY_ASSURANCE",
    name: "Security Assurance",
    description:
      "Independent evidence that the system's security posture has been " +
      "assessed by qualified security reviewers against an explicit threat " +
      "model. SECURITY_ASSURANCE is NOT established by a passing unit test, " +
      "an HTTP 200, or an internal verification note — it requires " +
      "independent security review (internal SOC + external penetration " +
      "tester + bug-bounty or comparable third-party review).",
    whatItIsNot: [
      "A passing unit test is NOT proof of security assurance",
      "An HTTP 200 is NOT proof of security assurance",
      "A successful API response is NOT proof of security assurance",
      "An integration test pass is NOT proof of security assurance",
      "Internal verification is NOT proof of security assurance",
      "Page rendering is NOT proof of security assurance",
    ],
    whatItProves: [
      "An independent security review has assessed the system against an explicit threat model",
      "Identified findings have a documented remediation path or accepted-risk disposition",
      "The review covered the defined scope (interfaces, secrets, dependencies, infra)",
    ],
    whatItDoesNotProve: [
      "Correctness — security review does not prove functional correctness",
      "Financial validity — security review does not prove the mint/redemption logic is financially sound",
      "Legal finality — security review does not prove settlement finality",
      "Absence of all vulnerabilities — security review is scoped and time-bounded",
      "Institutional validation — security review is one input to institutional validation, not a substitute",
      "Regulatory authorization — security review does not confer a license",
      "Production readiness — security review is one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "Independent penetration test report from a qualified third party",
      "Threat-model document (e.g., STRIDE) reviewed and signed off by the security team",
      "SOC 2 Type I (and ultimately Type II) report from an accredited auditor",
      "Bug-bounty or coordinated-disclosure program with triage records",
      "SAST/DAST/SCA scan results with explicit disposition per finding",
    ],
    nonQualifyingEvidence: [
      "An internal verification note stating 'the system is secure'",
      "A successful API response from a manual probe",
      "An HTTP 200 from an internal-only smoke test",
      "A passing unit test",
      "A passing integration test",
      "A page rendering in a browser",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: false,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.18 W2 (Enterprise Risk Register — TECHNOLOGY-001: no independent security assessment)",
      "v25.3.20 Y2 (Operating Plan — SECURITY role: CISO / AppSec / SOC + INDEPENDENT_ASSURANCE)",
    ],
  },

  // =====================================================================
  // 6. DATA_INTEGRITY
  // =====================================================================
  {
    classId: "DATA_INTEGRITY",
    name: "Data Integrity",
    description:
      "Evidence that data persisted by the system retains its declared " +
      "structure, hash commitments, and reconciliation tolerances over time. " +
      "DATA_INTEGRITY covers cryptographic commitments (SHA-256), " +
      "reconciliation tolerance policies (per O2), and ledger-to-ledger " +
      "consistency. It does not cover legal or institutional authoritativeness " +
      "of the data — only its internal consistency and tamper-evidence.",
    whatItIsNot: [
      "A successful API response is NOT proof of data integrity",
      "A passing unit test is NOT proof of data integrity",
      "An HTTP 200 is NOT proof of data integrity",
      "An integration test pass is NOT proof of data integrity",
      "Page rendering is NOT proof of data integrity",
      "Internal verification is NOT proof of data integrity (without independent reconciliation)",
    ],
    whatItProves: [
      "The system persisted data with the declared schema and the declared hash commitment",
      "Reconciliation against the comparison ledger fell within the declared tolerance policy",
      "Tampering with persisted data would be detectable via the hash chain",
    ],
    whatItDoesNotProve: [
      "Correctness of the underlying value — a hash does not prove the value was authorized",
      "Financial validity — a hash chain does not prove the mint was bank-authorized",
      "Legal finality — a hash does not prove settlement finality",
      "Security assurance — a hash does not prove the absence of exploitable defects",
      "Institutional validation — internal reconciliation is not auditor attestation",
      "Regulatory authorization — a hash chain is not a license",
      "Production readiness — data integrity is one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "SHA-256 commitment chain for EvidencePackage (per v25.3.8 N2 — 15-field EvidencePackage)",
      "Reconciliation report against the comparison ledger within the O2 tolerance policy (e.g., LEDGER_TO_LEDGER=1bps)",
      "Audit-log hash chain verified by an independent process",
      "Schema-conformance check on persisted records (e.g., JSON Schema)",
    ],
    nonQualifyingEvidence: [
      "A successful API response that wrote a record without an independent read-back verification",
      "An internal verification note stating 'the data is consistent'",
      "A passing unit test on the schema",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: true,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.8 N2 (Evidence Fabric — 15-field EvidencePackage + SHA-256 commitments)",
      "v25.3.9 O2 (6 reconciliation tolerance policies — LEDGER_TO_LEDGER=1bps / BANK_ATTESTATION=5bps / CUSTODY_QUANTITY=10bps / MARKET_VALUATION=50bps / FX_VALUATION=20bps / STRESSED_VALUATION=200bps)",
      "v25.3.18 W2 (Enterprise Risk Register — DATA-001..DATA-005 data risk categories)",
    ],
  },

  // =====================================================================
  // 7. LEGAL_EVIDENCE — NOT satisfiable by technical-only signal
  // =====================================================================
  {
    classId: "LEGAL_EVIDENCE",
    name: "Legal Evidence",
    description:
      "Independent legal opinion or formally executed instrument from " +
      "qualified external counsel. LEGAL_EVIDENCE is NOT established by an " +
      "HTTP 200, a passing unit test, an integration test pass, or internal " +
      "verification. It requires an external legal opinion letter " +
      "(independent counsel) and/or formally executed operating agreements, " +
      "resolutions, certificates of formation, and similar instruments.",
    whatItIsNot: [
      "An HTTP 200 is NOT proof of legal evidence",
      "A successful API response is NOT proof of legal evidence",
      "A passing unit test is NOT proof of legal evidence",
      "An integration test pass is NOT proof of legal evidence",
      "Page rendering is NOT proof of legal evidence",
      "Internal verification is NOT proof of legal evidence",
    ],
    whatItProves: [
      "An independent legal opinion has been issued by qualified external counsel",
      "A formally executed instrument (operating agreement, resolution, certificate) exists",
      "The opinion covers the specific legal question (e.g., MTQ legal classification)",
    ],
    whatItDoesNotProve: [
      "Correctness of the technical system — legal opinion does not prove functional correctness",
      "Financial validity beyond the legal question — legal opinion does not prove the reserve composition",
      "Security assurance — legal opinion does not prove the absence of vulnerabilities",
      "Institutional validation by an auditor — legal counsel is not an auditor",
      "Regulatory authorization — legal opinion is not a license",
      "Production readiness — legal opinion is one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "Independent legal opinion letter from qualified external counsel (e.g., NJ-bar admitted)",
      "Formally executed Operating Agreement (e.g., Jozour Amendment No. 1 — ACTIVE in src/lib/external-legal-evidence.ts)",
      "Resolution by the operating entity authorizing the project",
      "Certificate of Formation (e.g., NJ LLC Certificate — ACTIVE)",
      "EIN letter (e.g., IRS EIN 84-3470275 — ACTIVE)",
      "AAOIFI Sharia attestation (PENDING_VALIDATION — not yet obtained)",
      "Independent Audit Report (PENDING_VALIDATION — not yet obtained)",
    ],
    nonQualifyingEvidence: [
      "An internal verification note stating 'counsel has reviewed'",
      "A passing unit test on a contract clause",
      "A successful API response from a contract endpoint",
      "An HTTP 200 from a legal-document endpoint",
      "A page rendering the legal page in a browser",
      "An integration test pass on a contract signing flow",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: false,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.2 I3 (external legal evidence registry — 6 items: 4 ACTIVE, 2 PENDING_VALIDATION)",
      "v25.3.16 U1 (Accounting/Prudential/Tax Framework — 10 classification areas, ALL PENDING_EXTERNAL_VALIDATION)",
      "v25.3.16 U2 (PBC Legal Enforceability — 14 fields + 6 failure states)",
      "v25.3.17 V1 (Failure/Default/Resolution Legal Conditionality — COORDINATION_RULE)",
      "v25.3.18 W1 (Bank Contracting Package — 17 sections ALL DRAFT)",
    ],
  },

  // =====================================================================
  // 8. INSTITUTIONAL_VALIDATION — NOT satisfiable by technical-only signal
  // =====================================================================
  {
    classId: "INSTITUTIONAL_VALIDATION",
    name: "Institutional Validation",
    description:
      "Independent attestation by a qualified institutional validator " +
      "(independent auditor, custodian bank attestation, or comparable " +
      "institutional party). INSTITUTIONAL_VALIDATION is NOT established by " +
      "an HTTP 200, a passing unit test, an integration test pass, or internal " +
      "verification. It requires an independent auditor report, an SOC 1 / " +
      "ISAE 3402 / comparable attestation, or an institutional-party " +
      "attestation letter.",
    whatItIsNot: [
      "An HTTP 200 is NOT proof of institutional validation",
      "A passing unit test is NOT proof of institutional validation",
      "A successful API response is NOT proof of institutional validation",
      "An integration test pass is NOT proof of institutional validation",
      "Page rendering is NOT proof of institutional validation",
      "Internal verification is NOT proof of institutional validation",
    ],
    whatItProves: [
      "An independent institutional validator has issued an attestation",
      "The attestation scope covers the defined institutional control objectives",
      "The attestation references the specific MITHQAL system + version + period",
    ],
    whatItDoesNotProve: [
      "Correctness of the technical system — auditor attestation does not prove functional correctness",
      "Financial validity beyond the control objectives — institutional validation does not prove the reserve composition",
      "Legal finality — auditor attestation is not a settlement finality opinion",
      "Security assurance — auditor attestation covers controls, not vulnerability absence",
      "Regulatory authorization — institutional validation is not a license",
      "Production readiness — institutional validation is one input, not a production authorization",
    ],
    qualifyingEvidence: [
      "Independent auditor report (e.g., Big 4 firm) covering the MITHQAL system",
      "SOC 1 Type II / ISAE 3402 attestation on settlement processing controls",
      "Custodian bank attestation letter (covering reserves held)",
      "Independent reserve attestation (e.g., Big 4 audit of reserves — PENDING_VALIDATION, not yet obtained)",
      "AAOIFI Sharia attestation (PENDING_VALIDATION — not yet obtained)",
    ],
    nonQualifyingEvidence: [
      "An internal verification note stating 'the system is institutionally validated'",
      "A passing unit test on a control",
      "A successful API response from a control endpoint",
      "An HTTP 200 from an internal attestation endpoint",
      "A page rendering an attestation document in a browser",
      "A passing integration test of the audit log",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: false,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.11 Q1 (bank value model — INSTITUTIONALLY_VERIFIED evidence status label)",
      "v25.3.18 W2 (Enterprise Risk Register — ASSURANCE-001 / ASSURANCE-002 risk categories)",
      "v25.3.20 Y2 (Operating Plan — INDEPENDENT_ASSURANCE role: Internal Audit Lead + Independent External Auditor 0.5 FTE CONTRACTED)",
    ],
  },

  // =====================================================================
  // 9. REGULATORY_EVIDENCE — NOT satisfiable by technical-only signal
  // =====================================================================
  {
    classId: "REGULATORY_EVIDENCE",
    name: "Regulatory Evidence",
    description:
      "Evidence of regulatory authorization, exemption, or no-action " +
      "treatment issued by the competent regulator. REGULATORY_EVIDENCE is " +
      "NOT established by an HTTP 200, a passing unit test, an integration " +
      "test pass, or internal verification. It requires a license, " +
      "registration, exemption letter, or comparable regulator-issued " +
      "instrument.",
    whatItIsNot: [
      "An HTTP 200 is NOT proof of regulatory evidence",
      "A passing unit test is NOT proof of regulatory evidence",
      "A successful API response is NOT proof of regulatory evidence",
      "An integration test pass is NOT proof of regulatory evidence",
      "Page rendering is NOT proof of regulatory evidence",
      "Internal verification is NOT proof of regulatory evidence",
    ],
    whatItProves: [
      "A regulator has issued an authorization, license, or exemption covering the defined activity",
      "The authorization covers the defined jurisdiction + activity + entity",
      "The authorization is current (within the validity window)",
    ],
    whatItDoesNotProve: [
      "Correctness of the technical system — regulatory authorization does not prove functional correctness",
      "Financial validity beyond the regulatory perimeter — regulatory authorization does not prove the reserve composition",
      "Legal finality — regulatory authorization is not a settlement finality opinion",
      "Security assurance — regulatory authorization does not prove vulnerability absence",
      "Institutional validation by an auditor — regulator ≠ auditor",
      "Production readiness — regulatory authorization is one input, not a production authorization in itself",
    ],
    qualifyingEvidence: [
      "Money-transmitter license (or comparable state-level license) covering the activity",
      "Federal regulator authorization (e.g., OCC interpretive letter, Fed no-action letter) — PENDING",
      "Exemption letter from the competent regulator",
      "FinCEN registration (where applicable)",
      "State-level Department of Banking registration (e.g., NJ DOBI)",
    ],
    nonQualifyingEvidence: [
      "An internal verification note stating 'counsel believes no license is required'",
      "A passing unit test on a regulatory check",
      "A successful API response from a regulatory endpoint",
      "An HTTP 200 from a compliance endpoint",
      "A page rendering the regulatory page in a browser",
      "A passing integration test of the sanctions screening flow",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: false,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.16 U1 (Accounting/Prudential/Tax Framework — REGULATORY_CLASSIFICATION area, PENDING_EXTERNAL_VALIDATION)",
      "v25.3.18 W1 (Bank Contracting Package — regulatory annex)",
      "v25.3.20 Y2 (Operating Plan — LEGAL_REGULATORY_EXPERTISE role: Regulatory Counsel NJ-US PENDING_EXTERNAL_VALIDATION)",
    ],
  },

  // =====================================================================
  // 10. PRODUCTION_AUTHORIZATION — NOT satisfiable by technical-only signal
  // =====================================================================
  {
    classId: "PRODUCTION_AUTHORIZATION",
    name: "Production Authorization",
    description:
      "The formal go-live decision by the authorized control plane " +
      "(CRO + CCO + COO + CTO + board governance) authorizing the system " +
      "to process real customer / bank / institutional transactions in " +
      "production. PRODUCTION_AUTHORIZATION is NOT established by an HTTP " +
      "200, a passing unit test, an integration test pass, a load test pass, " +
      "or internal verification. It requires a signed go-live attestation " +
      "from the control-plane authority (per v25.3.7 M2 trust domains: " +
      "Domain A Policy/Authorization).",
    whatItIsNot: [
      "An HTTP 200 is NOT proof of production authorization",
      "A passing unit test is NOT proof of production authorization",
      "A successful API response is NOT proof of production authorization",
      "An integration test pass is NOT proof of production authorization",
      "A load test pass is NOT proof of production authorization",
      "Internal verification is NOT proof of production authorization",
      "Page rendering is NOT proof of production authorization",
    ],
    whatItProves: [
      "The control-plane authority has issued a signed go-live attestation",
      "All prerequisites (legal, regulatory, institutional, security, data integrity) have been dispositioned",
      "The system version is authorized for the defined production scope",
    ],
    whatItDoesNotProve: [
      "Correctness of the technical system going forward — authorization does not prove ongoing correctness",
      "Financial validity beyond the authorized scope — production authorization does not prove the reserve composition",
      "Legal finality — production authorization is not a settlement finality opinion",
      "Security assurance going forward — authorization is a point-in-time decision",
      "Institutional validation by an auditor — production authorization is not auditor attestation",
      "Regulatory authorization beyond the licensed scope — production authorization is not a license",
    ],
    qualifyingEvidence: [
      "Signed go-live attestation from the control-plane authority (per v25.3.7 M2 Domain A: Policy/Authorization)",
      "Production-readiness checklist completed by all 5 control-plane roles (CEO/COO/CTO/CFO/CRO/CCO)",
      "Q2 pilot gate framework GATE-A1..GATE-B7 — all gates passed (per v25.3.11 Q2)",
      "Architecture Freeze change-control record (per v25.3.14 T2 — 7-step change process)",
    ],
    nonQualifyingEvidence: [
      "An internal verification note stating 'ready for production'",
      "A passing unit test on the production build",
      "A successful API response from the production endpoint",
      "An HTTP 200 from the production health check",
      "A page rendering the production UI in a browser",
      "A passing integration test against the production bank endpoint",
      "A passing load test on the production instance",
    ],
    honestyTier: "DESIGN_TIME",
    satisfiableByTechnicalOnlySignal: false,
    status: "PENDING_VALIDATION",
    crossReferences: [
      "v25.3.7 M2 (Trust Domains — Domain A: Policy/Authorization)",
      "v25.3.11 Q2 (Pilot Gate Framework — GATE-A1..GATE-B7, canPassWithImplementationOnly=false)",
      "v25.3.14 T2 (Architecture Freeze — 7-step change process: CHANGE REQUEST → IMPACT ANALYSIS → REVIEW → APPROVAL → VERSION → TEST → EVIDENCE)",
      "v25.3.20 Y2 (Operating Plan — LEADERSHIP_ROLES: CEO/COO/CTO/CFO/CRO/CCO)",
    ],
  },
];

// ============================================================================
// DERIVED CONSTANTS + HELPERS
// ============================================================================

export const EVIDENCE_CLASS_COUNT = TECHNICAL_EVIDENCE_CLASSES.length; // 10

// The 5 classes that are NOT satisfiable by technical-only signals
export const NON_TECHNICAL_ONLY_CLASSES = TECHNICAL_EVIDENCE_CLASSES.filter(
  (c) => !c.satisfiableByTechnicalOnlySignal,
).map((c) => c.classId);

export const NON_TECHNICAL_ONLY_CLASS_COUNT = NON_TECHNICAL_ONLY_CLASSES.length; // 5

// The 5 classes that MAY use technical-only signals as inputs (but still
// require qualifying evidence for full attestation)
export const TECHNICAL_SIGNAL_INPUT_CLASSES = TECHNICAL_EVIDENCE_CLASSES.filter(
  (c) => c.satisfiableByTechnicalOnlySignal,
).map((c) => c.classId);

export const TECHNICAL_SIGNAL_INPUT_CLASS_COUNT =
  TECHNICAL_SIGNAL_INPUT_CLASSES.length; // 5

// Map for O(1) class lookup by id
export const EVIDENCE_CLASS_MAP: Record<EvidenceClassId, EvidenceClass> =
  Object.fromEntries(
    TECHNICAL_EVIDENCE_CLASSES.map((c) => [c.classId, c]),
  ) as Record<EvidenceClassId, EvidenceClass>;

export function getEvidenceClass(id: EvidenceClassId): EvidenceClass | null {
  return EVIDENCE_CLASS_MAP[id] ?? null;
}

export function getClassesByHonestyTier(
  tier: EvidenceHonestyTier,
): EvidenceClass[] {
  return TECHNICAL_EVIDENCE_CLASSES.filter((c) => c.honestyTier === tier);
}

export function getNonTechnicalOnlyClasses(): EvidenceClass[] {
  return TECHNICAL_EVIDENCE_CLASSES.filter(
    (c) => !c.satisfiableByTechnicalOnlySignal,
  );
}

// ============================================================================
// RUNTIME INVARIANTS (fail-fast at module load)
// ============================================================================

function assertAllTenClassesPresent(): void {
  const expected: EvidenceClassId[] = [
    "AVAILABILITY",
    "FUNCTIONAL_CORRECTNESS",
    "INTEGRATION_CORRECTNESS",
    "PERFORMANCE",
    "SECURITY_ASSURANCE",
    "DATA_INTEGRITY",
    "LEGAL_EVIDENCE",
    "INSTITUTIONAL_VALIDATION",
    "REGULATORY_EVIDENCE",
    "PRODUCTION_AUTHORIZATION",
  ];
  for (const id of expected) {
    if (!EVIDENCE_CLASS_MAP[id]) {
      throw new Error(
        `Technical Evidence Classification FATAL: missing class ${id}`,
      );
    }
  }
  if (TECHNICAL_EVIDENCE_CLASSES.length !== 10) {
    throw new Error(
      `Technical Evidence Classification FATAL: expected 10 classes, got ${TECHNICAL_EVIDENCE_CLASSES.length}`,
    );
  }
}

function assertEveryClassHasProvesAndDoesNotProve(): void {
  for (const c of TECHNICAL_EVIDENCE_CLASSES) {
    if (!c.whatItProves.length || !c.whatItDoesNotProve.length) {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${c.classId} must have non-empty whatItProves AND whatItDoesNotProve`,
      );
    }
    if (!c.qualifyingEvidence.length || !c.nonQualifyingEvidence.length) {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${c.classId} must have non-empty qualifyingEvidence AND nonQualifyingEvidence`,
      );
    }
    if (!c.whatItIsNot.length) {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${c.classId} must have non-empty whatItIsNot (the directive's forbidden equivalences)`,
      );
    }
  }
}

function assertNoTechnicalOnlySignalClaimsInstitutionalProperty(): void {
  // Per directive: HTTP 200, page render, API response, unit test pass,
  // integration test pass, and internal verification must NOT be claimed
  // as proof of correctness, financial validity, legal finality, security
  // assurance, institutional validation, regulatory authorization, or
  // production readiness.
  //
  // The 5 classes that are NOT satisfiable by technical-only signals are:
  // SECURITY_ASSURANCE, LEGAL_EVIDENCE, INSTITUTIONAL_VALIDATION,
  // REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION.
  //
  // These classes MUST have satisfiableByTechnicalOnlySignal = false.
  const nonTechnicalOnlyExpected: EvidenceClassId[] = [
    "SECURITY_ASSURANCE",
    "LEGAL_EVIDENCE",
    "INSTITUTIONAL_VALIDATION",
    "REGULATORY_EVIDENCE",
    "PRODUCTION_AUTHORIZATION",
  ];
  for (const id of nonTechnicalOnlyExpected) {
    const cls = EVIDENCE_CLASS_MAP[id];
    if (cls.satisfiableByTechnicalOnlySignal) {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${id} MUST have satisfiableByTechnicalOnlySignal = false (per PROMPT 42)`,
      );
    }
  }
  if (NON_TECHNICAL_ONLY_CLASS_COUNT !== 5) {
    throw new Error(
      `Technical Evidence Classification FATAL: expected 5 non-technical-only classes, got ${NON_TECHNICAL_ONLY_CLASS_COUNT}`,
    );
  }
}

function assertAllClassesPendingOrActive(): void {
  // Honest state — no class is fully INSTITUTIONAL yet because no external
  // legal/accounting/regulatory validation has been obtained.
  // All 10 classes are PENDING_VALIDATION (status marker per v25.3.2).
  for (const c of TECHNICAL_EVIDENCE_CLASSES) {
    if (c.status !== "PENDING_VALIDATION") {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${c.classId} MUST be PENDING_VALIDATION (honest state — no external validation obtained yet)`,
      );
    }
    if (c.honestyTier !== "DESIGN_TIME") {
      throw new Error(
        `Technical Evidence Classification FATAL: class ${c.classId} MUST be DESIGN_TIME (honest state — no measured or institutional evidence yet)`,
      );
    }
  }
}

assertAllTenClassesPresent();
assertEveryClassHasProvesAndDoesNotProve();
assertNoTechnicalOnlySignalClaimsInstitutionalProperty();
assertAllClassesPendingOrActive();

// ============================================================================
// MODULE METADATA (per v25.3.2 _meta envelope convention)
// ============================================================================

export const TECHNICAL_EVIDENCE_CLASSIFICATION_STATUS: EvidenceClassStatus =
  "ACTIVE";
export const TECHNICAL_EVIDENCE_CLASSIFICATION_VERSION = "v25.3.21-P42-1.0";
export const TECHNICAL_EVIDENCE_CLASSIFICATION_SOURCE =
  "src/lib/technical-evidence-classification.ts";

export const TECHNICAL_EVIDENCE_HONEST_STATE = {
  allClassesDesignTime: true,
  allClassesPendingValidation: true,
  noClassInstitutionallyVerified: true,
  noClassClaimsProductionReadiness: true,
  http200NotProofRuleEnforced: true,
  fiveClassesNotSatisfiableByTechnicalOnlySignal: true,
  fiveClassesMayUseTechnicalOnlySignalAsInput: true,
  honestNote:
    "Per PROMPT 42: All 10 evidence classes are DESIGN-TIME and PENDING_VALIDATION. " +
    "No class is INSTITUTIONALLY_VERIFIED. No class claims production readiness. " +
    "HTTP 200, page rendering, API response, unit test pass, integration test pass, " +
    "and internal verification are NOT proof of any institutional-grade property. " +
    "The 5 classes marked satisfiableByTechnicalOnlySignal=false " +
    "(SECURITY_ASSURANCE, LEGAL_EVIDENCE, INSTITUTIONAL_VALIDATION, " +
    "REGULATORY_EVIDENCE, PRODUCTION_AUTHORIZATION) require independent " +
    "external evidence (security review, legal opinion, auditor attestation, " +
    "regulator license, control-plane go-live attestation respectively).",
} as const;
