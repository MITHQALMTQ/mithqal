/**
 * MITHQAL — Incident severity classification (Phase 2 Security).
 *
 * Per the MITHQAL Master Blueprint §5.2.G + §D.5, every incident
 * detected by the platform (validation conflict, reconciliation
 * drift, source-data conflict, custody shortfall, regulator action,
 * security breach) is classified into one of four severity levels.
 * The severity dictates the automated + human response.
 *
 *   SEV-0 (Critical)   — Safe halt auto-triggered. System-wide.
 *                          Recovery requires Constitutional Council
 *                          sign-off + manual restart.
 *   SEV-1 (High)        — Block scope. Per-institution or per-corridor.
 *                          New validation cases for the affected
 *                          scope are refused; existing cases are
 *                          preserved. Recovery requires CTO + COO
 *                          sign-off.
 *   SEV-2 (Medium)      — Degrade. Affected subsystem runs in
 *                          read-only mode; new writes are queued in
 *                          the outbox but not dispatched until the
 *                          incident is closed.
 *   SEV-3 (Low)         — Backlog. The issue is logged as an
 *                          exception with severity=LOW; no
 *                          automated action. Backlog review weekly.
 *
 * Truth state: WIRED. The classifier is exported for the
 * `incident-severity-classifier` Inngest function (under
 * `inngest/functions/`) to consume. The classifier is deterministic
 * — the same incident payload always yields the same severity so
 * the audit trail is reproducible.
 *
 * Fail-closed defaults: when an incident cannot be classified
 * (unknown category, ambiguous payload), the classifier returns
 * SEV-2 (degrade) — fail-safe rather than under-react.
 */

import { logger } from "@/lib/logger";

export type IncidentSeverity = "SEV-0" | "SEV-1" | "SEV-2" | "SEV-3";

export type IncidentCategory =
  | "VALIDATION_CONFLICT"
  | "RECONCILIATION_DRIFT"
  | "SOURCE_DATA_CONFLICT"
  | "CUSTODY_SHORTFALL"
  | "CREDENTIAL_LEAK"
  | "MTLS_VALIDATION_FAILURE"
  | "SIGNATURE_FAILURE"
  | "REPLAY_DETECTED"
  | "RATE_LIMIT_ABUSE"
  | "TURSO_PROJECTION_STALE"
  | "POLICY_VERSION_DRIFT"
  | "UNKNOWN";

export interface IncidentClassification {
  severity: IncidentSeverity;
  category: IncidentCategory;
  description: string;
  automatedAction: string;
  humanAction: string;
  recoveryRequires: string[];
}

/**
 * The canonical classification matrix. Every incident category maps
 * to exactly one severity + a fixed automated action + a fixed
 * human recovery requirement. There is no discretion at the
 * classifier — the matrix is the source of truth.
 */
const CLASSIFICATION_MATRIX: Record<IncidentCategory, IncidentClassification> = {
  VALIDATION_CONFLICT: {
    severity: "SEV-2",
    category: "VALIDATION_CONFLICT",
    description: "A validation rule fired SOURCE_CONFLICT — the same transaction has different values across source systems.",
    automatedAction: "Open reconciliation_case; queue outbox_event but DO NOT dispatch until reconciliation resolves.",
    humanAction: "Reconciliation officer reviews the case; either accepts the discrepancy within tolerance or escalates.",
    recoveryRequires: ["Reconciliation case closed", "Outbox dispatch resumed"],
  },
  RECONCILIATION_DRIFT: {
    severity: "SEV-1",
    category: "RECONCILIATION_DRIFT",
    description: "Turso vs Neon reconciliation reported DRIFT_DETECTED — the read projection is stale beyond tolerance.",
    automatedAction: "Block the affected scope (institution or corridor) from new validations; route reads to Neon.",
    humanAction: "Operator triggers turso-projection rebuild; verifies reconciliation returns IN_SYNC.",
    recoveryRequires: ["Turso reconcile IN_SYNC", "Scope unblocked by CTO + COO sign-off"],
  },
  SOURCE_DATA_CONFLICT: {
    severity: "SEV-1",
    category: "SOURCE_DATA_CONFLICT",
    description: "A source-data conflict was detected — two source systems report contradictory facts about the same transaction.",
    automatedAction: "Block the case from progressing; route to dispute-resolution framework.",
    humanAction: "Investigation by both source-system owners; reconciliation or exception opened.",
    recoveryRequires: ["Source-system owners confirm corrected data", "Case re-validated under the current rule version"],
  },
  CUSTODY_SHORTFALL: {
    severity: "SEV-0",
    category: "CUSTODY_SHORTFALL",
    description: "Custody backing fell below the required coverage — the protected backing cell is under-collateralised.",
    automatedAction: "Auto-trigger safe-halt (POST /api/v1/safe-halt). New validations refused system-wide.",
    humanAction: "Constitutional Council reviews; custody replenished + reconciled; manual restart.",
    recoveryRequires: ["Custody restored + reconciled", "Constitutional Council sign-off", "Manual safe-halt recovery"],
  },
  CREDENTIAL_LEAK: {
    severity: "SEV-0",
    category: "CREDENTIAL_LEAK",
    description: "A credential (API key, mTLS private key, signing key) was leaked via a public channel (commit, log, screenshot).",
    automatedAction: "Auto-trigger safe-halt; rotate the leaked credential via the breach-notification workflow.",
    humanAction: "Constitutional Council + CISO review; confirm rotation; verify no unauthorised access occurred.",
    recoveryRequires: ["Credential rotated", "Breach notification workflow completed", "Constitutional Council sign-off", "Manual safe-halt recovery"],
  },
  MTLS_VALIDATION_FAILURE: {
    severity: "SEV-1",
    category: "MTLS_VALIDATION_FAILURE",
    description: "An incoming request presented an mTLS certificate that failed validation (expired, malformed, wrong CA).",
    automatedAction: "Reject the request with 401 + MTLS_VALIDATION_FAILED; do NOT increment the rate-limit bucket (rejections do not consume tokens).",
    humanAction: "Security officer reviews the cert chain; contacts the bank partner if expired.",
    recoveryRequires: ["Cert renewed by the bank partner", "Audit log reviewed"],
  },
  SIGNATURE_FAILURE: {
    severity: "SEV-1",
    category: "SIGNATURE_FAILURE",
    description: "An incoming request presented a signature that did not verify (canonical bytes mismatch, wrong key id, replayed).",
    automatedAction: "Reject the request with 401 + SIGNATURE_INVALID; do NOT increment the rate-limit bucket.",
    humanAction: "Security officer reviews the request; contacts the bank partner if their signing key rotated.",
    recoveryRequires: ["Signing key rotation confirmed", "Audit log reviewed"],
  },
  REPLAY_DETECTED: {
    severity: "SEV-1",
    category: "REPLAY_DETECTED",
    description: "The replay-protection cache saw a duplicate nonce within the TTL window.",
    automatedAction: "Reject the request with 401 + REPLAY_DETECTED; record the nonce in the audit log.",
    humanAction: "Security officer reviews the client; potential signing-key compromise investigation.",
    recoveryRequires: ["Signing key rotation", "Client nonce-generation reviewed", "Audit log reviewed"],
  },
  RATE_LIMIT_ABUSE: {
    severity: "SEV-2",
    category: "RATE_LIMIT_ABUSE",
    description: "An institution exceeded their rate-limit tier for >60s continuously; the rate limiter rejected >1000 requests.",
    automatedAction: "Degrade the institution to read-only mode; queue outbox events without dispatch; alert the operator.",
    humanAction: "Operator contacts the institution; either upgrades tier or throttles their client.",
    recoveryRequires: ["Institution client throttled or tier upgraded", "Operator sign-off to lift the degrade"],
  },
  TURSO_PROJECTION_STALE: {
    severity: "SEV-2",
    category: "TURSO_PROJECTION_STALE",
    description: "A Turso projection's lagMs exceeded the §5.3 EVENTUAL_CONSISTENCY_PROJECTION tolerance (1000 ms).",
    automatedAction: "Read router falls back to Neon for the affected projection; turso-reconcile cron alerted.",
    humanAction: "Operator triggers turso-projection rebuild; verifies the next reconcile returns IN_SYNC.",
    recoveryRequires: ["Turso reconcile IN_SYNC", "Projection watermark refreshed"],
  },
  POLICY_VERSION_DRIFT: {
    severity: "SEV-1",
    category: "POLICY_VERSION_DRIFT",
    description: "A validation_case referenced a policy_version that is not in the active policy_versions table.",
    automatedAction: "Block the case from progressing; route to dispute-resolution framework.",
    humanAction: "Policy officer reviews the version history; either re-publishes the missing version or migrates the case to the current version.",
    recoveryRequires: ["Policy version republished or case migrated", "Policy officer sign-off"],
  },
  UNKNOWN: {
    severity: "SEV-2",
    category: "UNKNOWN",
    description: "An incident was detected that did not match any known category. Default to SEV-2 (degrade) per fail-safe defaults.",
    automatedAction: "Degrade the affected subsystem to read-only mode; alert the operator.",
    humanAction: "Operator investigates; classifies the incident manually; updates the classification matrix if needed.",
    recoveryRequires: ["Manual classification recorded", "Operator sign-off"],
  },
};

/**
 * Classify an incident by its category. Returns the canonical
 * classification (severity + automated action + human recovery
 * requirements) — there is no per-call discretion, the matrix is
 * the source of truth.
 *
 * The classifier logs the classification at WARN so the audit trail
 * records every classification event.
 */
export function classifyIncident(category: IncidentCategory): IncidentClassification {
  const classification = CLASSIFICATION_MATRIX[category] ?? CLASSIFICATION_MATRIX.UNKNOWN;
  logger.warn(
    { category, severity: classification.severity, action: classification.automatedAction },
    "incident/classified",
  );
  return classification;
}

/**
 * Convenience helper: returns true when the classification requires
 * an automatic safe-halt (SEV-0). Used by the
 * `safe-halt-trigger` Inngest function to decide whether to invoke
 * `POST /api/v1/safe-halt` autonomously.
 */
export function requiresSafeHalt(category: IncidentCategory): boolean {
  return classifyIncident(category).severity === "SEV-0";
}

/**
 * Convenience helper: returns true when the classification requires
 * blocking the affected scope (SEV-0 or SEV-1).
 */
export function requiresScopeBlock(category: IncidentCategory): boolean {
  const sev = classifyIncident(category).severity;
  return sev === "SEV-0" || sev === "SEV-1";
}

/**
 * The full classification matrix, exported for the dashboard's
 * "Incident response matrix" panel.
 */
export const INCIDENT_MATRIX = CLASSIFICATION_MATRIX;
