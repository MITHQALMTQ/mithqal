// src/lib/settlement-continuity-fabric.ts
//
// MITHQAL v25.3.2 — CANONICAL SETTLEMENT CONTINUITY FABRIC (single source of truth)
// Per S-directive (trace 1a0ef36e7e341b2d):
//   "Create a first-class SettlementContinuityFabric.
//    Support controlled response to: rail outage, liquidity failure,
//    custodian failure, bank default, finality oracle failure,
//    reconciliation break, cyber event, policy expiry, jurisdiction restriction.
//    For each event define: DETECT -> FREEZE/SAFE-HALT -> ASSESS ->
//    ALTERNATIVE ROUTE -> RESUME -> RECONCILE -> EVIDENCE.
//    No automatic rerouting may bypass legal, compliance, authorization
//    or finality controls."

// === Event Types (9 per directive) ===

export type ContinuityEventId =
  | "RAIL_OUTAGE"
  | "LIQUIDITY_FAILURE"
  | "CUSTODIAN_FAILURE"
  | "BANK_DEFAULT"
  | "FINALITY_ORACLE_FAILURE"
  | "RECONCILIATION_BREAK"
  | "CYBER_EVENT"
  | "POLICY_EXPIRY"
  | "JURISDICTION_RESTRICTION";

// === 7-Stage Response Lifecycle (per directive) ===

export type ResponseStageId =
  | "DETECT"
  | "FREEZE_SAFE_HALT"
  | "ASSESS"
  | "ALTERNATIVE_ROUTE"
  | "RESUME"
  | "RECONCILE"
  | "EVIDENCE";

export interface ResponseStage {
  stageId: ResponseStageId;
  name: string;
  description: string;
  // What happens at this stage
  actions: string[];
  // Which trust domain owns this stage (per v25.3.7)
  trustDomain:
    | "DOMAIN_A_POLICY_AUTHORIZATION"
    | "DOMAIN_B_FINALITY_ATTESTATION"
    | "DOMAIN_C_EXECUTION"
    | "ALL_DOMAINS";
  // Whether this stage requires human approval
  requiresHumanApproval: boolean;
  // CRITICAL: No automatic rerouting may bypass legal/compliance/authorization/finality controls
  noBypassRule: string;
}

// === The 7-Stage Lifecycle (canonical) ===

export const RESPONSE_LIFECYCLE: ResponseStage[] = [
  {
    stageId: "DETECT",
    name: "1. Detect",
    description:
      "Automated detection of the continuity event. Detection triggers the response lifecycle.",
    actions: [
      "Monitoring system detects anomaly (rail timeout, liquidity shortfall, custodian unresponsive, bank default signal, oracle stale, reconciliation mismatch, cyber alert, policy expiry alert, jurisdiction change)",
      "Event is logged with timestamp + event type + affected transactions",
      "Response lifecycle is INITIATED — all affected transactions enter SAFE-HALT pending state",
    ],
    trustDomain: "ALL_DOMAINS",
    requiresHumanApproval: false, // detection is automated
    noBypassRule:
      "Detection does NOT bypass any controls — it INITIATES the lifecycle that ENFORCES controls.",
  },
  {
    stageId: "FREEZE_SAFE_HALT",
    name: "2. Freeze / Safe-Halt",
    description:
      "All affected transactions are immediately frozen. No new transactions are accepted on the affected rail/path.",
    actions: [
      "All in-flight transactions on the affected path are FROZEN (status → SAFE_HALTED)",
      "No new transactions are accepted on the affected path",
      "Affected transactions cannot be minted, redeemed, or transferred until ASSESS completes",
      "MTQ_SETTLEMENT_MODULE is DISABLED for affected transactions (per v25.3.4 MTQ_SETTLEMENT_ENABLED gate)",
    ],
    trustDomain: "DOMAIN_C_EXECUTION", // execution domain freezes
    requiresHumanApproval: false, // freeze is automatic
    noBypassRule:
      "FREEZE is MANDATORY — no transaction may proceed past this stage without completing ASSESS. No automatic rerouting.",
  },
  {
    stageId: "ASSESS",
    name: "3. Assess",
    description:
      "Assess the nature, severity, and scope of the event. Determine whether an alternative route is feasible.",
    actions: [
      "Assess event severity (LOW / MEDIUM / HIGH / CRITICAL)",
      "Assess scope (which transactions, which counterparties, which jurisdictions)",
      "Assess whether an alternative route exists (different rail, different custodian, different jurisdiction)",
      "Verify that any alternative route does NOT bypass legal, compliance, authorization, or finality controls",
      "Human review REQUIRED for HIGH/CRITICAL events",
    ],
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION", // policy domain assesses
    requiresHumanApproval: true, // ASSESS requires human review for HIGH/CRITICAL
    noBypassRule:
      "ASSESS must verify that any alternative route maintains ALL legal, compliance, authorization, and finality controls. If the alternative route would bypass ANY control, the event ESCALATES to BLOCKING_REMEDIATION.",
  },
  {
    stageId: "ALTERNATIVE_ROUTE",
    name: "4. Alternative Route",
    description:
      "If ASSESS determines an alternative route is feasible AND maintains all controls, the alternative route is activated.",
    actions: [
      "Activate alternative route (different rail, custodian, or jurisdiction)",
      "Verify alternative route has: (1) legal compliance, (2) AML/KYC/sanctions screening, (3) Monetary Authorization (BM-15), (4) Finality Verification (BM-16A), (5) reconciliation (per v25.3.9 tolerance policies)",
      "Issue new Monetary Authorization for the alternative route (Domain A)",
      "Attest finality for the alternative route (Domain B)",
      "Execute on the alternative route (Domain C) — only after authorization + attestation",
    ],
    trustDomain: "ALL_DOMAINS",
    requiresHumanApproval: true,
    noBypassRule:
      "CRITICAL: No automatic rerouting. The alternative route MUST go through the full BM-09..BM-16B workflow (per v25.3.4). No shortcut, no bypass. Legal → Compliance → Risk → DMCE → Authorization → Finality → Execution.",
  },
  {
    stageId: "RESUME",
    name: "5. Resume",
    description:
      "Settlement resumes on the alternative route (or the original route if the event is resolved).",
    actions: [
      "Resume settlement on the alternative route (or original if resolved)",
      "Unfreeze SAFE_HALTED transactions (status → RESUMED)",
      "Accept new transactions on the resumed route",
      "Monitor for recurrence of the event",
    ],
    trustDomain: "DOMAIN_C_EXECUTION",
    requiresHumanApproval: true,
    noBypassRule:
      "RESUME requires: (1) ASSESS complete, (2) ALTERNATIVE_ROUTE verified (or original route restored), (3) human approval. No automatic resume.",
  },
  {
    stageId: "RECONCILE",
    name: "6. Reconcile",
    description:
      "Reconcile all transactions affected by the event. Verify no discrepancies between the frozen state and the resumed state.",
    actions: [
      "Reconcile all SAFE_HALTED + RESUMED transactions (per v25.3.9 tolerance policies — 6 separate policies)",
      "Verify ledger-to-ledger balances match (LEDGER_TO_LEDGER policy, 1 bps tolerance)",
      "Verify bank attestations (BANK_ATTESTATION policy, 5 bps)",
      "Verify custody/quantity (CUSTODY_QUANTITY policy, 10 bps)",
      "Flag any reconciliation breaks for remediation",
    ],
    trustDomain: "DOMAIN_A_POLICY_AUTHORIZATION",
    requiresHumanApproval: true,
    noBypassRule:
      "RECONCILE uses the 6 separate tolerance policies (per v25.3.9). No universal tolerance. Reconciliation breaks are BLOCKED (not auto-resolved).",
  },
  {
    stageId: "EVIDENCE",
    name: "7. Evidence",
    description:
      "Generate evidence package for all transactions affected by the event. The evidence is stored in the Institutional Evidence Fabric (per v25.3.8).",
    actions: [
      "Generate 15-field portable evidence package for each affected transaction (per v25.3.8 Evidence Fabric)",
      "Include the continuity event type, severity, and response lifecycle stages in the exceptions field",
      "Cryptographic commitments (SHA-256) computed for integrity",
      "Evidence is available via /api/evidence-fabric?transactionId=X (3 access levels: PUBLIC/INSTITUTIONAL/AUDIT)",
      "Evidence is available via /api/regulatory-replay?transactionId=X for regulatory replay (per v25.3.12)",
    ],
    trustDomain: "DOMAIN_B_FINALITY_ATTESTATION", // attestation domain generates evidence
    requiresHumanApproval: false, // evidence generation is automated
    noBypassRule:
      "EVIDENCE generation is MANDATORY — no transaction may complete the lifecycle without an evidence package. Evidence is stored immutably (per v25.3.8).",
  },
];

// === Event Definitions (9 per directive) ===

export interface ContinuityEvent {
  eventId: ContinuityEventId;
  name: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  // Detection method
  detectionMethod: string;
  // What gets frozen
  freezeScope: string;
  // Whether an alternative route is typically feasible
  alternativeRouteFeasible: boolean;
  // Examples of alternative routes
  alternativeRouteExamples: string[];
  // The no-bypass rule (per directive)
  noBypassRule: string;
}

export const CONTINUITY_EVENTS: ContinuityEvent[] = [
  {
    eventId: "RAIL_OUTAGE",
    name: "Rail Outage",
    description:
      "External settlement rail (SWIFT, RTGS, correspondent network, blockchain) is unavailable or degraded.",
    severity: "HIGH",
    detectionMethod:
      "Rail health monitoring — timeout, error rate, latency spike on external rail endpoints.",
    freezeScope:
      "All transactions on the affected rail. No new transactions accepted on the affected rail.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to alternative rail (e.g., SWIFT → RTGS, or RTGS → correspondent)",
      "Switch to MTQ settlement (if MTQ_SETTLEMENT_ENABLED and Pilot B is active)",
      "Delay settlement until rail is restored (if no alternative exists)",
    ],
    noBypassRule:
      "Alternative rail MUST go through full BM-09..BM-16B workflow. No bypass of legal/compliance/authorization/finality controls.",
  },
  {
    eventId: "LIQUIDITY_FAILURE",
    name: "Liquidity Failure",
    description:
      "Insufficient liquidity to complete settlement (DMCE limit hit, nostro/vostro shortfall, pre-funding gap).",
    severity: "HIGH",
    detectionMethod:
      "DMCE monitoring (per BM-14) — available liquidity falls below required coverage (per v25.3.5 Required Coverage formula).",
    freezeScope:
      "All transactions that would require the depleted liquidity pool.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to alternative liquidity source (different custodian, different currency)",
      "Reduce settlement volume to fit available liquidity",
      "Delay settlement until liquidity is replenished",
    ],
    noBypassRule:
      "Alternative liquidity MUST be legally controlled + verified (per v25.3.6 reserve domains). No using emergency capacity as settlement backing (anti-double-counting).",
  },
  {
    eventId: "CUSTODIAN_FAILURE",
    name: "Custodian Failure",
    description:
      "Custodian is unable to release backing assets (operational failure, insolvency, regulatory action).",
    severity: "CRITICAL",
    detectionMethod:
      "Custodian health monitoring — custodian unresponsive, failed verification, regulatory action reported.",
    freezeScope:
      "All transactions backed by the failed custodian. No new transactions accepted with this custodian.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to alternative custodian (if available + verified)",
      "Switch to different asset class (if the failed custodian held one asset class)",
      "Initiate bank default resolution (per v25.3.9 obligation registry insolvency treatment)",
    ],
    noBypassRule:
      "Alternative custodian MUST be verified (per v25.3.6 reserve domains + v25.3.9 obligation registry). No using unverified custodian.",
  },
  {
    eventId: "BANK_DEFAULT",
    name: "Bank Default",
    description:
      "Participating bank defaults (insolvency, regulatory seizure, inability to fulfill obligations).",
    severity: "CRITICAL",
    detectionMethod:
      "Bank health monitoring — bank credit rating downgrade, regulatory action, missed obligation.",
    freezeScope:
      "All transactions involving the defaulting bank. No new transactions accepted with this bank.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to alternative bank (if available + on the institutional allowlist)",
      "Initiate resolution per v25.3.9 obligation registry (insolvency treatment: SEPARATED/PARI_PASSU/SUBORDINATED)",
      "Transfer obligations to successor bank (per v25.3.9 NO_LEGAL_OBLIGOR rule — new obligor must be verified)",
    ],
    noBypassRule:
      "Alternative bank MUST be on the institutional allowlist (per BM-02 KYC/KYB). Alternative obligor MUST be verified (per v25.3.9 NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION). No using unverified bank.",
  },
  {
    eventId: "FINALITY_ORACLE_FAILURE",
    name: "Finality Oracle Failure",
    description:
      "Finality oracle (per v25.3.7 Domain B) is unable to attest finality (oracle stale, oracle compromised, oracle unavailable).",
    severity: "HIGH",
    detectionMethod:
      "Oracle health monitoring — oracle stale (price > MAX_STALENESS), oracle signature invalid, oracle endpoint unreachable.",
    freezeScope:
      "All transactions pending finality verification (BM-16A). No transactions may proceed to execution (BM-16B) without finality attestation.",
    alternativeRouteFeasible: false, // finality oracle has no alternative — must be restored or replaced
    alternativeRouteExamples: [
      "Wait for oracle to be restored (if temporary)",
      "Switch to backup oracle (if provisioned — per v25.3.7 Domain B ATTESTATION_ORACLE_KEY + FINALITY_PROOF_SIGNING_KEY)",
      "Escalate to human review (if no backup oracle)",
    ],
    noBypassRule:
      "CRITICAL: No transaction may proceed to execution (BM-16B) without finality attestation (BM-16A) from Domain B. Per v25.3.7 cross-domain isolation: Domain C cannot execute without Domain B attestation. No bypassing finality.",
  },
  {
    eventId: "RECONCILIATION_BREAK",
    name: "Reconciliation Break",
    description:
      "Reconciliation detects a mismatch (ledger-to-ledger, bank attestation, custody/quantity, market/FX/stressed valuation) that exceeds tolerance.",
    severity: "MEDIUM",
    detectionMethod:
      "Reconciliation engine (per v25.3.9 tolerance policies) — mismatch exceeds toleranceBps for the applicable policy.",
    freezeScope:
      "Affected transactions only (not all transactions). Transactions with reconciliation breaks are SAFE_HALTED.",
    alternativeRouteFeasible: false, // reconciliation breaks must be resolved, not rerouted
    alternativeRouteExamples: [
      "Investigate root cause of the mismatch",
      "Remediate (correct the data, adjust the ledger, re-verify the custody)",
      "Escalate to human review if remediation fails",
    ],
    noBypassRule:
      "Reconciliation breaks use the 6 separate tolerance policies (per v25.3.9). No universal tolerance. No auto-resolving breaks. BLOCK_ON_MISMATCH / ESCALATE_ON_MISMATCH enforced.",
  },
  {
    eventId: "CYBER_EVENT",
    name: "Cyber Event",
    description:
      "Cybersecurity incident (compromise, breach, unauthorized access, malware, DDoS).",
    severity: "CRITICAL",
    detectionMethod:
      "Security monitoring — IDS/IPS alert, anomaly detection, key compromise detection, unauthorized access alert.",
    freezeScope:
      "ALL transactions (entire platform enters SAFE-HALT). No new transactions accepted until cyber event is contained.",
    alternativeRouteFeasible: false, // cyber events require containment, not rerouting
    alternativeRouteExamples: [
      "Contain the cyber event (isolate affected systems)",
      "Forensic investigation (per v25.3.7 trust domain isolation — check if any domain was compromised)",
      "Key rotation (per v25.3.7 — each domain has its OWN keys, compromise of one does NOT compromise others)",
      "Resume only after containment + forensic verification",
    ],
    noBypassRule:
      "CRITICAL: Cyber events trigger FULL SAFE-HALT. No transactions may proceed until: (1) containment verified, (2) forensic investigation complete, (3) key rotation (if compromised), (4) human approval. Per v25.3.7 cross-domain isolation: if Domain A is compromised, Domains B and C are NOT automatically compromised (separate keys).",
  },
  {
    eventId: "POLICY_EXPIRY",
    name: "Policy Expiry",
    description:
      "Active policy (per v25.3.3 policy registry) has expired or is no longer ACTIVE.",
    severity: "MEDIUM",
    detectionMethod:
      "Policy registry monitoring — policy status changes from ACTIVE to SUPERSEDED or HISTORICAL, or expiry date passes.",
    freezeScope:
      "Transactions that depend on the expired policy. No new transactions accepted until a new ACTIVE policy is in place.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to the successor policy (if the expired policy has a supersededBy pointer)",
      "Wait for a new policy to be activated (per v25.3.3 policy registry)",
      "Escalate to Council for emergency policy activation",
    ],
    noBypassRule:
      "Transactions MUST use ACTIVE policies only (per v25.3.3 override-prevention rule). No using SUPERSEDED or HISTORICAL policies. getActivePolicy() throws if no ACTIVE policy exists.",
  },
  {
    eventId: "JURISDICTION_RESTRICTION",
    name: "Jurisdiction Restriction",
    description:
      "Jurisdiction restriction (regulatory change, sanctions update, capital control, new licensing requirement).",
    severity: "HIGH",
    detectionMethod:
      "Regulatory monitoring — sanctions list update, regulatory change alert, jurisdiction risk score change.",
    freezeScope:
      "All transactions involving the restricted jurisdiction. No new transactions accepted for the restricted jurisdiction.",
    alternativeRouteFeasible: true,
    alternativeRouteExamples: [
      "Switch to alternative jurisdiction (if the transaction can be legally rerouted)",
      "Comply with the new restriction (obtain new license, apply new sanctions screening)",
      "Block the transaction (if no legal alternative exists)",
    ],
    noBypassRule:
      "Alternative jurisdiction MUST be legally verified (per v25.3.7 institutional operating model + v25.3.8 finality model settlement mode). No using unverified jurisdiction. No bypassing sanctions.",
  },
];

// === No-Bypass Rule (canonical constant) ===
export const NO_BYPASS_RULE =
  "No automatic rerouting may bypass legal, compliance, authorization, or finality controls. Per S-directive. The alternative route MUST go through the full BM-09..BM-16B workflow (per v25.3.4). No shortcut, no bypass. Legal → Compliance → Risk → DMCE → Authorization → Finality → Execution.";

// === API ===

export function getEvent(eventId: ContinuityEventId): ContinuityEvent | undefined {
  return CONTINUITY_EVENTS.find((e) => e.eventId === eventId);
}

export function getResponseStage(
  stageId: ResponseStageId
): ResponseStage | undefined {
  return RESPONSE_LIFECYCLE.find((s) => s.stageId === stageId);
}

export function getResponseLifecycleForEvent(eventId: ContinuityEventId): {
  event: ContinuityEvent;
  lifecycle: ResponseStage[];
  noBypassRule: string;
} {
  const event = getEvent(eventId);
  if (!event) throw new Error(`Invalid eventId: ${eventId}`);
  return {
    event,
    lifecycle: RESPONSE_LIFECYCLE,
    noBypassRule: NO_BYPASS_RULE,
  };
}

// === Status ===
export const SETTLEMENT_CONTINUITY_FABRIC_STATUS:
  | "ACTIVE"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "PENDING_VALIDATION" = "ACTIVE";
export const SETTLEMENT_CONTINUITY_FABRIC_VERSION = "v25.3.2-S1-1.0";
export const SETTLEMENT_CONTINUITY_FABRIC_SOURCE =
  "src/lib/settlement-continuity-fabric.ts";

// === Constants ===
export const EVENT_COUNT = 9;
export const LIFECYCLE_STAGE_COUNT = 7;
