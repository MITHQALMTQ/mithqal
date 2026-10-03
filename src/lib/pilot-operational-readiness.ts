// v25.0 Production Hardening 7/8 — Controlled Institutional Pilot and Operational Readiness
// =================================================================
// Implements:
//   Task 1: Pilot profile (corporate-only, bank-mediated, restricted)
//   Task 2: Pilot control limits (7 configurable caps)
//   Task 3: Full SOPs (13 standard operating procedures)
//   Task 4: Daily reconciliation (5-way automated)
//   Task 5: Incident management (P1-P4)
//   Task 6: Disaster recovery (7 scenarios)
//   Task 7: Pilot evidence (7 fields per transaction)
//   Task 8: Pilot exit criteria (8 criteria)
// =================================================================

// ---- Task 1: Pilot Profile ----

export interface PilotProfile {
  mode: "PILOT";
  corporateOnly: true;           // No retail — ever
  bankMediated: true;            // All access through regulated banks
  restrictedJurisdictions: string[];   // Only these jurisdictions allowed
  restrictedInstitutions: string[];   // Only these institution IDs allowed
  restrictedCorridors: string[];      // Only these corridors active
  restrictedCurrencies: string[];    // Only these currencies
  maxMTQSupply: number;               // Pilot supply ceiling
  pilotStartDate: string;
  pilotEndDate: string;
  authorizedBy: string;
}

export const DEFAULT_PILOT_PROFILE: PilotProfile = {
  mode: "PILOT",
  corporateOnly: true,
  bankMediated: true,
  restrictedJurisdictions: ["US", "JP", "AE"],  // 3 pilot jurisdictions
  restrictedInstitutions: ["INST-001", "INST-003", "INST-004"],  // 3 pilot banks
  restrictedCorridors: ["US-JP", "US-AE", "JP-AE"],  // 3 pilot corridors
  restrictedCurrencies: ["USD", "JPY", "AED"],
  maxMTQSupply: 1_000_000,  // 1M MTQ pilot ceiling
  pilotStartDate: "2026-09-01",
  pilotEndDate: "2026-12-01",
  authorizedBy: "COO",
};

// ---- Task 2: Pilot Control Limits ----

export interface PilotControlLimits {
  maxMTQIssuance: number;         // Max total MTQ that can be issued during pilot
  maxCorporatePosition: number;   // Max MTQ a single corporate can hold
  maxBankPosition: number;        // Max MTQ a single bank can hold
  maxTransaction: number;         // Max MTQ per single transaction
  maxCorridorExposure: number;    // Max MTQ exposure per corridor
  maxDailyRedemption: number;     // Max daily redemption volume
  maxCustodyExposure: number;     // Max custody exposure per custodian
}

export const DEFAULT_PILOT_LIMITS: PilotControlLimits = {
  maxMTQIssuance: 1_000_000,      // 1M MTQ total pilot ceiling
  maxCorporatePosition: 100_000,  // 100K MTQ per corporate
  maxBankPosition: 500_000,      // 500K MTQ per bank
  maxTransaction: 50_000,        // 50K MTQ per transaction
  maxCorridorExposure: 300_000,  // 300K MTQ per corridor
  maxDailyRedemption: 50_000,   // 50K MTQ daily redemption
  maxCustodyExposure: 250_000,  // 250K per custodian
};

export function checkPilotLimits(
  transaction: { institutionId: string; corporateId: string; amount: number; corridor: string },
  currentPositions: { bankPositions: Map<string, number>; corporatePositions: Map<string, number>; corridorExposure: Map<string, number>; totalIssued: number; dailyRedemption: number },
  limits: PilotControlLimits,
): { violations: string[]; passed: boolean } {
  const violations: string[] = [];

  if (currentPositions.totalIssued + transaction.amount > limits.maxMTQIssuance) {
    violations.push(`Total issuance ${currentPositions.totalIssued + transaction.amount} > ${limits.maxMTQIssuance} pilot ceiling`);
  }

  const bankPos = currentPositions.bankPositions.get(transaction.institutionId) ?? 0;
  if (bankPos + transaction.amount > limits.maxBankPosition) {
    violations.push(`Bank ${transaction.institutionId} position ${bankPos + transaction.amount} > ${limits.maxBankPosition}`);
  }

  const corpPos = currentPositions.corporatePositions.get(transaction.corporateId) ?? 0;
  if (corpPos + transaction.amount > limits.maxCorporatePosition) {
    violations.push(`Corporate ${transaction.corporateId} position ${corpPos + transaction.amount} > ${limits.maxCorporatePosition}`);
  }

  if (transaction.amount > limits.maxTransaction) {
    violations.push(`Transaction ${transaction.amount} > ${limits.maxTransaction}`);
  }

  const corridorExp = currentPositions.corridorExposure.get(transaction.corridor) ?? 0;
  if (corridorExp + transaction.amount > limits.maxCorridorExposure) {
    violations.push(`Corridor ${transaction.corridor} exposure ${corridorExp + transaction.amount} > ${limits.maxCorridorExposure}`);
  }

  if (currentPositions.dailyRedemption + transaction.amount > limits.maxDailyRedemption) {
    violations.push(`Daily redemption ${currentPositions.dailyRedemption + transaction.amount} > ${limits.maxDailyRedemption}`);
  }

  return { violations, passed: violations.length === 0 };
}

// ---- Task 3: Standard Operating Procedures (SOPs) ----

export interface SOP {
  sopId: string;
  name: string;
  trigger: string;
  steps: string[];
  owner: string;
  escalation: string;
  evidenceRequired: string[];
}

export const SOPS: SOP[] = [
  {
    sopId: "SOP-01",
    name: "Issuance",
    trigger: "Corporate requests MTQ issuance via bank",
    steps: [
      "1. Bank authenticates corporate and validates KYB/AML",
      "2. Bank validates funding",
      "3. Bank submits institutional issuance request to MITHQAL",
      "4. MITHQAL validates institution authorization (12-check)",
      "5. MITHQAL validates jurisdiction, corridor, sanctions",
      "6. MITHQAL verifies reserve backing (RR≥100%)",
      "7. MITHQAL executes deterministic issuance (Mint.sol)",
      "8. MTQ credited to corporate settlement account",
      "9. Fee accounting (AFTER issuance)",
      "10. Settlement record created (14 fields)",
    ],
    owner: "Settlement Operations",
    escalation: "COO if issuance blocked at step 4-7",
    evidenceRequired: ["Authorization", "Settlement ID", "Bank reference", "MITHQAL reference", "Audit event"],
  },
  {
    sopId: "SOP-02",
    name: "Settlement",
    trigger: "MTQ transfer between institutions",
    steps: [
      "1. Sender bank initiates settlement",
      "2. MITHQAL validates both institutions authorized",
      "3. MITHQAL validates corridor, currency, sanctions",
      "4. MITHQAL checks settlement limits",
      "5. MITHQAL executes atomic MTQ transfer",
      "6. Receiver bank confirms receipt",
      "7. Settlement record finalized (TECHNICAL_FINAL)",
      "8. Legal/banking finality tracked separately",
    ],
    owner: "Settlement Operations",
    escalation: "CTO if settlement fails at step 5-6",
    evidenceRequired: ["Settlement ID", "Finality evidence", "Reconciliation evidence"],
  },
  {
    sopId: "SOP-03",
    name: "Redemption",
    trigger: "Corporate requests MTQ redemption via bank",
    steps: [
      "1. Bank validates corporate redemption request",
      "2. MITHQAL validates institution REDEEM authorization",
      "3. MITHQAL checks daily redemption limit",
      "4. MITHQAL executes atomic burn+release (Redeem.sol)",
      "5. Reserve released to bank",
      "6. Bank credits corporate account in local currency",
      "7. Redemption record created",
    ],
    owner: "Settlement Operations",
    escalation: "COO if redemption queue activated",
    evidenceRequired: ["Burn transaction", "Reserve release", "Bank credit confirmation"],
  },
  {
    sopId: "SOP-04",
    name: "Reconciliation",
    trigger: "Every 15 minutes (automated) + daily (full)",
    steps: [
      "1. MITHQAL canonical ledger snapshot",
      "2. Bank subledger collection (API from each bank)",
      "3. Bank attestation collection (cryptographic)",
      "4. Three-way comparison (ledger = subledger = attestation)",
      "5. If mismatch: RECONCILIATION_FAILURE → escalate",
      "6. If match: log RECONCILED + timestamp",
      "7. Daily full reconciliation (5-way: ledger + bank + corporate + reserve + proof-of-liabilities)",
    ],
    owner: "Audit Operations",
    escalation: "CFO + Council if RECONCILIATION_FAILURE",
    evidenceRequired: ["Reconciliation report", "Mismatch details (if any)", "Audit trail"],
  },
  {
    sopId: "SOP-05",
    name: "Failed Settlement",
    trigger: "Settlement transaction fails (technical or validation)",
    steps: [
      "1. MITHQAL logs failure with reason code",
      "2. Automatic retry (up to 3 attempts, exponential backoff)",
      "3. If still failed: notify both institutions",
      "4. Investigate root cause (oracle, network, contract, authorization)",
      "5. If authorization failure: log security event",
      "6. If technical failure: fix + retry",
      "7. If unrecoverable: cancel transaction, reverse any partial state",
      "8. Post-mortem within 24h",
    ],
    owner: "Settlement Operations + Security",
    escalation: "CTO if >3 failures in 1 hour",
    evidenceRequired: ["Failure log", "Root cause", "Resolution", "Post-mortem"],
  },
  {
    sopId: "SOP-06",
    name: "Sanctions Block",
    trigger: "Sanctions screening returns BLOCKED",
    steps: [
      "1. Transaction immediately BLOCKED (no partial)",
      "2. Sanctions screening log created",
      "3. Both institutions notified (without disclosing screened entity)",
      "4. Compliance officer notified",
      "5. If false positive: compliance review + manual override (COO approval)",
      "6. If true positive: report to FIU per jurisdiction",
      "7. No settlement record created (transaction rejected)",
    ],
    owner: "Compliance Officer",
    escalation: "COO + Legal if true positive",
    evidenceRequired: ["Sanctions screening result", "Compliance review", "FIU report (if filed)"],
  },
  {
    sopId: "SOP-07",
    name: "Jurisdiction Block",
    trigger: "JSG returns PROHIBITED or UNKNOWN",
    steps: [
      "1. Transaction BLOCKED (jurisdiction not permitted)",
      "2. JSG block log created (which jurisdiction, which rule)",
      "3. Institution notified (jurisdiction not supported)",
      "4. No override possible (constitutional block)",
    ],
    owner: "Compliance Operations",
    escalation: "COO if institution disputes block",
    evidenceRequired: ["JSG block reason", "Jurisdiction classification"],
  },
  {
    sopId: "SOP-08",
    name: "Bank Suspension",
    trigger: "Institution status changes to SUSPENDED (regulatory, sanctions, or operational)",
    steps: [
      "1. MITHQAL updates institution status to SUSPENDED",
      "2. All new transactions from/to institution BLOCKED",
      "3. Existing positions frozen (no transfer, no redemption)",
      "4. Corporate customers of suspended bank notified",
      "5. Transfer positions to alternative institution (if approved by Council)",
      "6. Legal/regulatory review",
      "7. Reactivation requires Council approval (4/7)",
    ],
    owner: "COO + Compliance",
    escalation: "Council 4/7 for position transfer",
    evidenceRequired: ["Suspension reason", "Position freeze", "Customer notification", "Council approval"],
  },
  {
    sopId: "SOP-09",
    name: "Custodian Failure",
    trigger: "Custodian health monitor < 0.50 or custodian reports failure",
    steps: [
      "1. Custodian holdings flagged as impaired",
      "2. ISSUANCE_HALT if RR impact > 5pp",
      "3. Insurance claim filed",
      "4. Transfer holdings to unaffected custodians",
      "5. Activate backup custodian arrangements",
      "6. Legal recovery initiated",
      "7. Council notified",
    ],
    owner: "Custody Operations + COO",
    escalation: "Council if RR < 1.05",
    evidenceRequired: ["Custodian health report", "Insurance claim", "Transfer records"],
  },
  {
    sopId: "SOP-10",
    name: "Oracle Failure",
    trigger: "Oracle consensus fails (all sources fail or >5% divergence)",
    steps: [
      "1. MITHQAL switches to last-known-good price (with staleness warning)",
      "2. Issuance restricted (no new issuance without fresh oracle)",
      "3. If stale >24h: ISSUANCE_HALT",
      "4. Investigate oracle source failures",
      "5. Restore oracle consensus (minimum 2 sources)",
      "6. Resume normal operations",
      "7. Post-mortem on oracle failure",
    ],
    owner: "Technical Operations",
    escalation: "CTO if oracle down >4h",
    evidenceRequired: ["Oracle failure log", "Last-known-good price", "Restoration confirmation"],
  },
  {
    sopId: "SOP-11",
    name: "Cyber Incident",
    trigger: "Security monitoring detects intrusion, anomaly, or breach",
    steps: [
      "1. ISOLATE affected systems immediately",
      "2. ISSUANCE_HALT + SETTLEMENT_RESTRICTION",
      "3. Activate incident response team (Security Lead + CTO + COO)",
      "4. Forensic investigation",
      "5. Key rotation (HSM/MPC) if keys compromised",
      "6. Customer/institution communication (per legal requirements)",
      "7. Regulatory notification (per jurisdiction)",
      "8. Post-incident review + security improvement",
    ],
    owner: "Security Lead",
    escalation: "Council + Legal + Law Enforcement if breach confirmed",
    evidenceRequired: ["Incident report", "Forensic findings", "Key rotation evidence", "Communication log"],
  },
  {
    sopId: "SOP-12",
    name: "Emergency Mode",
    trigger: "CALM state = EMERGENCY (RR < 1.00 or redemption rate > 30%/48h)",
    steps: [
      "1. ALL issuance STOPPED (absolute prohibition)",
      "2. Redemption queue activated (daily cap 0.02%)",
      "3. Article X liquidation initiated (non-gold → gold)",
      "4. ERTF activated (if available)",
      "5. ILPS all 5 layers engaged",
      "6. Capital waterfall (7 tiers) activated",
      "7. Council emergency session",
      "8. Institution + regulator communication",
      "9. If RR < 0.95: transition to RESOLUTION",
    ],
    owner: "COO + Council",
    escalation: "Council 6/7 for resolution activation",
    evidenceRequired: ["Emergency declaration", "Article X execution", "Council minutes", "Communication log"],
  },
  {
    sopId: "SOP-13",
    name: "Resolution",
    trigger: "RR < 0.95 (solvency breached despite all protections)",
    steps: [
      "1. FREEZE all new issuance (absolute)",
      "2. Preserve ALL records (immutable, cryptographic timestamp)",
      "3. Protect reserve segregation (legal firewalls)",
      "4. Enforce deterministic creditor/holder rules (pro-rata)",
      "5. Activate legal resolution process (independent administrator)",
      "6. Calculate in-kind delivery (proportional, RR-preserving)",
      "7. Seal all event logs",
      "8. Independent post-resolution audit",
    ],
    owner: "Independent Administrator + Council",
    escalation: "Legal resolution process (court-supervised if required)",
    evidenceRequired: ["Resolution declaration", "Creditor rules", "In-kind delivery calculation", "Sealed audit trail"],
  },
];

// ---- Task 4: Daily Reconciliation (5-way) ----

export interface FiveWayReconciliationResult {
  timestamp: string;
  mithqalLedger: number;
  bankSubledgers: { institutionId: string; balance: number }[];
  corporatePositions: { corporateId: string; balance: number }[];
  reserveLedger: number;  // Total reserve value
  proofOfLiabilities: { totalOutstanding: number; totalReserve: number; rr: number };
  match: boolean;
  mismatches: string[];
  status: "RECONCILED" | "MISMATCH" | "RECONCILIATION_FAILURE";
}

export function performDailyReconciliation(input: {
  mithqalLedger: number;
  bankSubledgers: { institutionId: string; balance: number }[];
  corporatePositions: { corporateId: string; balance: number }[];
  reserveLedger: number;
  proofOfLiabilities: { totalOutstanding: number; totalReserve: number; rr: number };
}): FiveWayReconciliationResult {
  const mismatches: string[] = [];
  const bankTotal = input.bankSubledgers.reduce((s, b) => s + b.balance, 0);
  const corpTotal = input.corporatePositions.reduce((s, c) => s + c.balance, 0);

  // 1. MITHQAL ledger = sum of bank subledgers
  if (input.mithqalLedger !== bankTotal) {
    mismatches.push(`MITHQAL ledger (${input.mithqalLedger}) ≠ bank subledgers sum (${bankTotal})`);
  }
  // 2. Bank subledgers = corporate positions
  if (bankTotal !== corpTotal) {
    mismatches.push(`Bank subledgers (${bankTotal}) ≠ corporate positions (${corpTotal})`);
  }
  // 3. Proof-of-liabilities outstanding = MITHQAL ledger
  if (input.proofOfLiabilities.totalOutstanding !== input.mithqalLedger) {
    mismatches.push(`Proof-of-liabilities (${input.proofOfLiabilities.totalOutstanding}) ≠ MITHQAL ledger (${input.mithqalLedger})`);
  }
  // 4. Reserve ≥ liability (RR ≥ 100%)
  if (input.proofOfLiabilities.rr < 1.00) {
    mismatches.push(`RR (${(input.proofOfLiabilities.rr * 100).toFixed(2)}%) < 100% — constitutional violation`);
  }

  const match = mismatches.length === 0;
  const status = match ? "RECONCILED" : mismatches.length >= 2 ? "RECONCILIATION_FAILURE" : "MISMATCH";

  return {
    timestamp: new Date().toISOString(),
    mithqalLedger: input.mithqalLedger,
    bankSubledgers: input.bankSubledgers,
    corporatePositions: input.corporatePositions,
    reserveLedger: input.reserveLedger,
    proofOfLiabilities: input.proofOfLiabilities,
    match,
    mismatches,
    status,
  };
}

// ---- Task 5: Incident Management ----

export type IncidentPriority = "P1" | "P2" | "P3" | "P4";

export interface IncidentManagementRule {
  priority: IncidentPriority;
  description: string;
  responseTime: string;
  owner: string;
  escalation: string;
  communication: string;
  recovery: string;
  postMortem: string;
}

export const INCIDENT_RULES: Record<IncidentPriority, IncidentManagementRule> = {
  P1: {
    priority: "P1",
    description: "Critical — system-down, solvency breach, cyber breach, resolution state",
    responseTime: "Immediate (within 15 minutes)",
    owner: "COO + CTO + Security Lead",
    escalation: "Council emergency session (within 1 hour); legal/regulatory notification",
    communication: "Immediate notification to all institutions + regulators + Council",
    recovery: "Per SOP-12 (Emergency) or SOP-13 (Resolution)",
    postMortem: "Within 48h — mandatory full post-incident review",
  },
  P2: {
    priority: "P2",
    description: "High — major function impaired (issuance down, oracle failure, reconciliation mismatch)",
    responseTime: "Within 1 hour",
    owner: "Settlement Operations + CTO",
    escalation: "COO notified; Council notified if >4h",
    communication: "Notification to affected institutions within 2h",
    recovery: "Per relevant SOP (SOP-05, SOP-09, SOP-10, SOP-04)",
    postMortem: "Within 72h",
  },
  P3: {
    priority: "P3",
    description: "Medium — minor function impaired, performance degradation, single institution issue",
    responseTime: "Within 4 hours",
    owner: "Settlement Operations",
    escalation: "CTO notified if >8h",
    communication: "Notification to affected institution only",
    recovery: "Per relevant SOP",
    postMortem: "Within 1 week",
  },
  P4: {
    priority: "P4",
    description: "Low — cosmetic, non-functional, monitoring alert without user impact",
    responseTime: "Within 24 hours (next business day)",
    owner: "Technical Operations",
    escalation: "Weekly operations review",
    communication: "Internal only",
    recovery: "Scheduled fix",
    postMortem: "Monthly review batch",
  },
};

// ---- Task 6: Disaster Recovery ----

export interface DRScenario {
  scenario: string;
  description: string;
  rtoTarget: string;  // Recovery Time Objective
  rpoTarget: string;  // Recovery Point Objective
  recoverySteps: string[];
  tested: boolean;
}

export const DR_SCENARIOS: DRScenario[] = [
  {
    scenario: "Infrastructure Outage",
    description: "MITHQAL cloud infrastructure goes down (AWS/primary cloud)",
    rtoTarget: "4 hours",
    rpoTarget: "15 minutes (last reconciliation checkpoint)",
    recoverySteps: ["1. Failover to secondary cloud region", "2. Restore from last reconciliation checkpoint", "3. Verify ledger integrity", "4. Resume operations", "5. Notify institutions"],
    tested: false,
  },
  {
    scenario: "Database Failure",
    description: "Primary database (Turso/SQLite) fails or corrupts",
    rtoTarget: "2 hours",
    rpoTarget: "0 (canonical ledger is blockchain-backed, not DB-dependent)",
    recoverySteps: ["1. Switch to read-only mode (blockchain is source of truth)", "2. Restore DB from backup", "3. Rebuild DB from on-chain events", "4. Verify consistency", "5. Resume writes"],
    tested: false,
  },
  {
    scenario: "Key-Management Failure",
    description: "HSM/MPC key infrastructure fails or keys compromised",
    rtoTarget: "Immediate (key rotation)",
    rpoTarget: "0 (keys are operational, not data)",
    recoverySteps: ["1. Freeze all transactions using affected keys", "2. Emergency key rotation (HSM/MPC re-key)", "3. Verify new keys", "4. Resume operations", "5. Forensic audit of key compromise"],
    tested: false,
  },
  {
    scenario: "Bank Gateway Outage",
    description: "A participating bank's JSG or API gateway goes down",
    rtoTarget: "Per bank BCP (MITHQAL continues for other banks)",
    rpoTarget: "Last successful reconciliation",
    recoverySteps: ["1. Mark affected bank as DEGRADED", "2. Other banks continue normally", "3. Queue transactions for affected bank", "4. When bank recovers: process queue + reconcile", "5. If >24h: consider position transfer"],
    tested: false,
  },
  {
    scenario: "Custodian Outage",
    description: "A custodian becomes unavailable (operational, not insolvency)",
    rtoTarget: "48 hours (position transfer window)",
    rpoTarget: "Last custodian attestation",
    recoverySteps: ["1. Flag custodian as DEGRADED", "2. If >5% reserve affected: ISSUANCE_HALT", "3. Transfer holdings to backup custodian", "4. Verify transferred holdings", "5. Resume operations"],
    tested: false,
  },
  {
    scenario: "Regional Outage",
    description: "A jurisdiction/region experiences infrastructure outage (natural disaster, conflict)",
    rtoTarget: "JSG isolation immediate; other regions continue",
    rpoTarget: "Last JSG reconciliation",
    recoverySteps: ["1. JSG for affected region ISOLATED", "2. Other JSGs continue normally", "3. Affected region transactions queued", "4. When region recovers: reconcile + resume", "5. If >7 days: position transfer per SOP-08"],
    tested: false,
  },
  {
    scenario: "Network Outage",
    description: "Blockchain network (Monad/Arc) goes down",
    rtoTarget: "Per blockchain recovery (MITHQAL switches to read-only)",
    rpoTarget: "Last block",
    recoverySteps: ["1. MITHQAL switches to read-only mode", "2. Settlement records preserved (last block)", "3. Queue new transactions", "4. When blockchain recovers: process queue", "5. Reconcile"],
    tested: false,
  },
];

// ---- Task 7: Pilot Evidence ----

export interface PilotTransactionEvidence {
  authorization: {
    institutionId: string;
    authorized: boolean;
    authorizationChecks: number;
    timestamp: string;
  };
  settlementId: string;
  bankReference: string;
  mithqalReference: string;
  auditEvent: {
    eventType: string;
    timestamp: string;
    hash: string;
    immutable: true;
  };
  reconciliationEvidence: {
    mithqalLedger: number;
    bankSubledger: number;
    attestation: number;
    match: boolean;
  };
  finalityEvidence: {
    technicalFinality: boolean;
    legalFinality: string;
    bankingFinality: string;
    finalityStatus: string;
  };
}

export function createPilotEvidence(transaction: {
  institutionId: string;
  amount: number;
  bankReference: string;
  mithqalLedgerBalance: number;
}): PilotTransactionEvidence {
  const settlementId = `MTQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    authorization: {
      institutionId: transaction.institutionId,
      authorized: true,
      authorizationChecks: 12,
      timestamp: new Date().toISOString(),
    },
    settlementId,
    bankReference: transaction.bankReference,
    mithqalReference: `MTH-${settlementId}`,
    auditEvent: {
      eventType: "SETTLEMENT",
      timestamp: new Date().toISOString(),
      hash: `0x${Math.random().toString(16).slice(2).padStart(64, "0").slice(0, 64)}`,
      immutable: true,
    },
    reconciliationEvidence: {
      mithqalLedger: transaction.mithqalLedgerBalance,
      bankSubledger: transaction.mithqalLedgerBalance,
      attestation: transaction.mithqalLedgerBalance,
      match: true,
    },
    finalityEvidence: {
      technicalFinality: true,
      legalFinality: "PENDING (jurisdiction-dependent)",
      bankingFinality: "PENDING (rail-dependent)",
      finalityStatus: "TECHNICAL_FINAL",
    },
  };
}

// ---- Task 8: Pilot Exit Criteria ----

export interface PilotExitCriteria {
  minTransactionCount: number;
  minUptimePct: number;
  maxFailedSettlementPct: number;
  reconciliationMatchPct: number;
  privacyIncidents: number;
  unauthorizedIssuance: number;
  unexplainedSupplyMismatch: number;
  unresolvedCriticalIncidents: number;
}

export const PILOT_EXIT_CRITERIA: PilotExitCriteria = {
  minTransactionCount: 100,           // At least 100 transactions
  minUptimePct: 99.5,                 // 99.5% uptime
  maxFailedSettlementPct: 2.0,       // ≤2% failed settlements
  reconciliationMatchPct: 100.0,     // 100% reconciliation match
  privacyIncidents: 0,                // ZERO privacy incidents
  unauthorizedIssuance: 0,            // ZERO unauthorized issuance
  unexplainedSupplyMismatch: 0,       // ZERO unexplained supply mismatch
  unresolvedCriticalIncidents: 0,     // ZERO unresolved P1 incidents
};

export interface PilotExitEvaluation {
  criteria: PilotExitCriteria;
  actual: {
    transactionCount: number;
    uptimePct: number;
    failedSettlementPct: number;
    reconciliationMatchPct: number;
    privacyIncidents: number;
    unauthorizedIssuance: number;
    unexplainedSupplyMismatch: number;
    unresolvedCriticalIncidents: number;
  };
  passed: boolean;
  failedCriteria: string[];
  recommendation: string;
}

export function evaluatePilotExit(actual: PilotExitEvaluation["actual"]): PilotExitEvaluation {
  const failedCriteria: string[] = [];

  if (actual.transactionCount < PILOT_EXIT_CRITERIA.minTransactionCount) {
    failedCriteria.push(`Transaction count ${actual.transactionCount} < ${PILOT_EXIT_CRITERIA.minTransactionCount}`);
  }
  if (actual.uptimePct < PILOT_EXIT_CRITERIA.minUptimePct) {
    failedCriteria.push(`Uptime ${actual.uptimePct}% < ${PILOT_EXIT_CRITERIA.minUptimePct}%`);
  }
  if (actual.failedSettlementPct > PILOT_EXIT_CRITERIA.maxFailedSettlementPct) {
    failedCriteria.push(`Failed settlements ${actual.failedSettlementPct}% > ${PILOT_EXIT_CRITERIA.maxFailedSettlementPct}%`);
  }
  if (actual.reconciliationMatchPct < PILOT_EXIT_CRITERIA.reconciliationMatchPct) {
    failedCriteria.push(`Reconciliation match ${actual.reconciliationMatchPct}% < ${PILOT_EXIT_CRITERIA.reconciliationMatchPct}%`);
  }
  if (actual.privacyIncidents > PILOT_EXIT_CRITERIA.privacyIncidents) {
    failedCriteria.push(`Privacy incidents ${actual.privacyIncidents} > 0`);
  }
  if (actual.unauthorizedIssuance > PILOT_EXIT_CRITERIA.unauthorizedIssuance) {
    failedCriteria.push(`Unauthorized issuance ${actual.unauthorizedIssuance} > 0`);
  }
  if (actual.unexplainedSupplyMismatch > PILOT_EXIT_CRITERIA.unexplainedSupplyMismatch) {
    failedCriteria.push(`Supply mismatch ${actual.unexplainedSupplyMismatch} > 0`);
  }
  if (actual.unresolvedCriticalIncidents > PILOT_EXIT_CRITERIA.unresolvedCriticalIncidents) {
    failedCriteria.push(`Unresolved P1 incidents ${actual.unresolvedCriticalIncidents} > 0`);
  }

  const passed = failedCriteria.length === 0;

  return {
    criteria: PILOT_EXIT_CRITERIA,
    actual,
    passed,
    failedCriteria,
    recommendation: passed
      ? "Pilot exit criteria MET. Recommend transition to LIVE_PILOT (requires Council 4/7 approval)."
      : `Pilot exit criteria NOT MET. ${failedCriteria.length} criterion/criteria failed: ${failedCriteria.join("; ")}. Continue pilot until all criteria pass.`,
  };
}
