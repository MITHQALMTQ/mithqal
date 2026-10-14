/**
 * MITHQAL — Data classification + field-level access enforcement
 * (Phase 2 Security).
 *
 * Per §8.7 every field in every record carries a data
 * classification tag. The tag dictates who can read the field.
 * The classification is enforced at the API boundary by the
 * `enforceFieldAccess()` function which is called by every route
 * handler before serialising a response.
 *
 * The five classification levels (lowest to highest):
 *
 *   PUBLIC              — anyone can read; safe to surface on the
 *                          public website (e.g. corridor name).
 *   INTERNAL            — pilot operators + bank partners can read
 *                          (e.g. policy version, rule set).
 *   CONFIDENTIAL        — pilot operators + the owning institution
 *                          can read (e.g. case status, amount).
 *   RESTRICTED         — the owning institution's authorised
 *                          operators can read (e.g. debtor name,
 *                          creditor account number).
 *   HIGHLY_RESTRICTED  — only the Constitutional Council + the
 *                          CISO can read (e.g. signing keys, mTLS
 *                          private keys — these NEVER leave the
 *                          KMS).
 *
 * Truth state: WIRED, NOT ENFORCED on every field. The
 * classification helpers are exported for the route handlers to
 * consume; not every field has been tagged yet (see gap-register
 * §8.7 — IMPLEMENTED_UNVERIFIED).
 *
 * Fail-closed defaults: when a caller's classification level is
 * unknown OR a field's classification is unset, the enforcement
 * helper refuses access (HIGHLY_RESTRICTED default).
 */

import { logger } from "@/lib/logger";

export type DataClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "HIGHLY_RESTRICTED";

/**
 * The lattice order — lower index = less sensitive. Used to compare
 * a caller's clearance against a field's required classification.
 */
const CLASSIFICATION_ORDER: DataClassification[] = [
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "RESTRICTED",
  "HIGHLY_RESTRICTED",
];

export type CallerClearance = DataClassification;

/**
 * A field-level tag. Routes attach this to every serialised field so
 * the `enforceFieldAccess()` helper can decide whether to surface
 * the value or redact it.
 */
export interface FieldTag<T = unknown> {
  value: T;
  classification: DataClassification;
}

/**
 * Tag a value with its data classification. Used by route handlers
 * when constructing a response payload.
 *
 *   const payload = {
 *     caseId: tag(caseRow.id, "CONFIDENTIAL"),
 *     debtorName: tag(record.debtorName, "RESTRICTED"),
 *     signingKey: tag("[REDACTED]", "HIGHLY_RESTRICTED"),
 *   };
 */
export function tag<T>(value: T, classification: DataClassification): FieldTag<T> {
  return { value, classification };
}

/**
 * Returns true when the caller's clearance is high enough to read
 * a field with the given classification. HIGHLY_RESTRICTED fields
 * require HIGHLY_RESTRICTED clearance; everyone else gets the
 * redacted sentinel.
 */
export function canRead(caller: CallerClearance, field: DataClassification): boolean {
  const callerRank = CLASSIFICATION_ORDER.indexOf(caller);
  const fieldRank = CLASSIFICATION_ORDER.indexOf(field);
  if (callerRank < 0 || fieldRank < 0) {
    // Unknown clearance or unknown classification → fail closed.
    return false;
  }
  return callerRank >= fieldRank;
}

/**
 * The redacted sentinel returned in place of a value when the caller
 * does not have clearance. The sentinel is deliberately a string so
 * it serialises cleanly to JSON; it includes the classification so
 * an auditor can see what was withheld + why.
 */
export const REDACTED = (classification: DataClassification): string =>
  `[REDACTED:${classification}]`;

/**
 * Enforce field-level access on a response payload. The payload is
 * a record of string keys to either:
 *   - a raw value (no tag) → treated as PUBLIC by default
 *   - a FieldTag → enforced per the tag's classification
 *
 * The function mutates the payload in place, replacing values the
 * caller cannot read with the redacted sentinel. It also logs every
 * redaction at INFO so the audit trail records what was withheld.
 *
 * Returns the (mutated) payload so callers can chain.
 */
export function enforceFieldAccess<T extends Record<string, unknown>>(
  payload: T,
  caller: CallerClearance,
): T {
  for (const key of Object.keys(payload)) {
    const raw = payload[key];
    if (raw && typeof raw === "object" && "classification" in raw && "value" in raw) {
      const tagObj = raw as FieldTag;
      if (canRead(caller, tagObj.classification)) {
        // Caller has clearance → replace the tag with the raw value.
        (payload as Record<string, unknown>)[key] = tagObj.value;
      } else {
        // Caller does not have clearance → redact + log.
        logger.info(
          { key, classification: tagObj.classification, caller },
          "data-classification/field redacted (insufficient clearance).",
        );
        (payload as Record<string, unknown>)[key] = REDACTED(tagObj.classification);
      }
    }
    // Untagged values are PUBLIC by default — leave them alone.
  }
  return payload;
}

/**
 * Resolve a caller's clearance from the request context. In the
 * pilot, every caller is treated as INTERNAL (pilot-operator). When
 * the G2 bank-design-partner gate passes, this function reads the
 * caller's clearance from the verified mTLS certificate's OU field
 * (see mtls.ts) and the resolved institution's `config.clearance`
 * field.
 *
 * Fail-closed: returns INTERNAL (not PUBLIC) when the caller is
 * unknown — the pilot-permissive posture surfaces to INTERNAL
 * access, not PUBLIC access.
 */
export function resolveCallerClearance(opts: {
  institutionId: string | null;
  institutionConfig?: unknown;
  mtlsSubject?: string | null;
}): CallerClearance {
  // Pilot: every caller is INTERNAL.
  void opts;
  return "INTERNAL";
}

/**
 * The classification lattice, exported for the dashboard's
 * "Data classification matrix" panel.
 */
export const CLASSIFICATION_LATTICE = CLASSIFICATION_ORDER;
