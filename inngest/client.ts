/**
 * MITHQAL — Inngest client (Phase 3 Orchestration).
 *
 * This is the canonical Inngest client for the MITHQAL Assurance
 * platform. It is imported by every function in
 * `inngest/functions/*.ts` so they all share the same client id,
 * event key, and signing key.
 *
 * The existing `src/inngest/client.ts` re-exports from
 * `src/lib/inngest-client.ts` (kept intact from v26.0 for
 * backward compatibility with the legacy `data-source-sync`
 * function). This file is the new top-level import path prescribed
 * by the FULL-PLATFORM-BUILD directive.
 *
 * Configuration (Vercel project env vars):
 *   INNGEST_EVENT_KEY    — signed event-send key.
 *   INNGEST_SIGNING_KEY   — webhook signing key for /api/inngest.
 *
 * Truth state: WIRED. The client constructs without env vars (Inngest
 * surfaces a runtime warning if INNGEST_EVENT_KEY is missing) so
 * `next build` succeeds without provisioning Inngest Cloud.
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "mithqal-assurance",
  name: "MITHQAL Assurance",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

/**
 * The event names this client emits. Centralised so the function
 * triggers + the API route senders share the same string constants.
 */
export const EVENTS = {
  VALIDATION_CASE_RECEIVED: "validation.case.received",
  VALIDATION_COMPLETED: "validation.completed",
  REPLAY_REQUESTED: "replay.requested",
  RECONCILIATION_NEEDED: "reconciliation.needed",
  EVIDENCE_BUNDLE_REQUESTED: "evidence.bundle.requested",
  EXCEPTION_OPENED: "exception.opened",
  EXCEPTION_RESOLVED: "exception.resolved",
  SAFE_HALT_TRIGGERED: "safe.halt.triggered",
  OUTBOX_PENDING: "outbox.pending",
  AUDIT_EXPORT_REQUESTED: "audit.export.requested",
  POLICY_PUBLISHED: "policy.published",
  TURSO_PROJECTION_NEEDED: "turso.projection.needed",
  TURSO_RECONCILE_NEEDED: "turso.reconcile.needed",
  HEALTH_SWEEP: "health.sweep",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
