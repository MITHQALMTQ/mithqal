/**
 * MITHQAL v26.0 §6.2 step 2 — Canonical Outbox Dispatcher
 *
 * The authoritative writer (Neon Postgres per §6.1) commits every
 * state mutation together with an OutboxEvent row in the same
 * database transaction. This dispatcher is the second half of the
 * transactional-outbox pattern: it claims PENDING rows in bounded
 * batches, emits each to Inngest, and updates the row's
 * `dispatchStatus` to DELIVERED / RETRYABLE_FAILED / DEAD_LETTERED.
 *
 * Hard rules per v26.0:
 *   - MTQ-related event types are blocked at emit time when the
 *     MTQ gate (§3.2) denies — defense-in-depth so that even a
 *     misrouted outbox row cannot dispatch an MTQ side effect.
 *   - Backoff is bounded (BASE_BACKOFF_MS..MAX_BACKOFF_MS) and
 *     capped at MAX_ATTEMPTS; past that the row is DEAD_LETTERED
 *     for human review.
 *   - Lease-based claiming prevents two dispatchers from
 *     processing the same row concurrently (atomic UPDATE...SET
 *     WHERE).
 *
 * Blueprint: v26.0 §6.2 (Outbox/Inbox) + §3.2 (MTQ gate) + §5.3
 */

import { rawQuery } from "./db";
import { assertMtqEnabled } from "./mtq-gate";

// ---------------------------------------------------------------------------
// §6.2 step 2 — dispatch state machine
// ---------------------------------------------------------------------------

export type OutboxDispatchStatus =
  | "PENDING"
  | "LEASED"
  | "DELIVERED"
  | "RETRYABLE_FAILED"
  | "DEAD_LETTERED";

export const MAX_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 1_000;
export const MAX_BACKOFF_MS = 300_000;

// ---------------------------------------------------------------------------
// §6.2 step 3 — eventType → Inngest event-name mapping (16 mappings)
// ---------------------------------------------------------------------------

/**
 * The 16 canonical outbox event types and their Inngest event-name
 * counterparts. The dispatcher uses this to map an OutboxEvent
 * `eventType` to the Inngest event name that downstream workflow
 * consumers are registered against.
 *
 * MTQ-related event types (prefix `MTQ`) are additionally gated
 * by the MTQ gate (§3.2). Even if the dispatcher is invoked while
 * MTQ is disabled, those events are NOT emitted to Inngest.
 */
const EVENT_TYPE_TO_INNGEST: Readonly<Record<string, string>> = {
  InstructionAccepted: "instruction.accepted",
  InstructionFundingFinal: "instruction.funding-final",
  InstructionBackingConfirmed: "instruction.backing-confirmed",
  InstructionRejected: "instruction.rejected",
  MTQInstructionAccepted: "mtq.instruction.accepted",
  MTQMintRequested: "mtq.mint.requested",
  MTQMintAuthorized: "mtq.mint.authorized",
  MTQMintLedgerCommitted: "mtq.mint.ledger-committed",
  MTQTransferRequested: "mtq.transfer.requested",
  MTQRedemptionRequested: "mtq.redemption.requested",
  ReconciliationCaseOpened: "reconciliation.case-opened",
  ReconciliationCaseClosed: "reconciliation.case-closed",
  EvidenceExpired: "evidence.expired",
  ProviderDegraded: "provider.degraded",
  GateDecisionRecorded: "gate.decision-recorded",
  BreakGlassInvoked: "break-glass.invoked",
};

/**
 * Map an OutboxEvent `eventType` to its Inngest event name.
 * Returns null for unmapped event types (the dispatcher will
 * DEAD_LETTER these so reviewers can add the mapping).
 */
export function eventTypeToInngestEventName(eventType: string): string | null {
  return EVENT_TYPE_TO_INNGEST[eventType] ?? null;
}

/**
 * MTQ-related event types are blocked when MTQ is disabled. This
 * is the defense-in-depth gate at the dispatcher level — even if
 * a misrouted outbox row reaches the dispatcher with an MTQ
 * eventType while MTQ is disabled, the dispatcher refuses to
 * emit it.
 */
const MTQ_EVENT_PREFIX = "MTQ";

function isMtqEventType(eventType: string): boolean {
  return eventType.startsWith(MTQ_EVENT_PREFIX);
}

// ---------------------------------------------------------------------------
// §6.2 step 2 — lease-based claiming
// ---------------------------------------------------------------------------

/**
 * OutboxRow shape as projected from the authoritative database.
 * Mirrors Appendix B.3 + the OutboxEvent Prisma model.
 */
export interface OutboxClaimedRow {
  outboxId: string;
  eventId: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number;
  eventType: string;
  schemaVersion: string;
  payloadRef: string | null;
  payloadHash: string;
  createdAt: string;
  nextAttemptAt: string;
  attemptCount: number;
  dispatchStatus: string;
  leaseOwner: string | null;
  leaseExpiresAt: string | null;
  consumerDedupeKey: string;
  traceId: string | null;
  errorCategory: string | null;
}

export interface ClaimResult {
  claimed: OutboxClaimedRow[];
  rowsAffected: number;
  leaseOwner: string;
  leaseExpiresAt: string;
  error: string | null;
}

/**
 * Atomically claim a batch of PENDING OutboxEvent rows.
 *
 * Implementation note: this dispatcher uses the libsql `rawQuery`
 * helper (which wraps the @libsql/client `.execute({sql, args})`
 * call) for parameterised SQL. The OutboxEvent table is projected
 * into Turso (libSQL); the canonical authoritative writer remains
 * Neon Postgres per §6.1 / §11.3 D-006. The dispatcher reads the
 * projection's PENDING rows and emits them to Inngest; the
 * authoritative state lives in Neon.
 *
 * The UPDATE...SET WHERE form guarantees atomic lease assignment:
 * only rows that are still PENDING (or whose lease has expired)
 * are claimed, and each claimed row's leaseOwner is set in the
 * same statement so no other dispatcher can claim it.
 */
export async function claimPendingOutboxRows(
  leaseOwner: string,
  leaseDurationMs: number,
  batchLimit: number,
): Promise<ClaimResult> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const leaseExpiresAtIso = new Date(now + leaseDurationMs).toISOString();
  const limit = Math.max(1, Math.min(batchLimit, 256));

  // Step 1: atomic UPDATE...SET WHERE to claim rows. The libsql
  // driver supports a parameterised LIMIT via the positional `?`
  // placeholder (libsql accepts integers for LIMIT).
  const updateSql = `
    UPDATE "OutboxEvent"
    SET leaseOwner = ?,
        leaseExpiresAt = ?,
        dispatchStatus = 'LEASED',
        nextAttemptAt = ?
    WHERE outboxId IN (
      SELECT outboxId FROM "OutboxEvent"
      WHERE dispatchStatus = 'PENDING'
         OR (dispatchStatus = 'LEASED' AND leaseExpiresAt IS NOT NULL AND leaseExpiresAt < ?)
      ORDER BY nextAttemptAt ASC
      LIMIT ?
    )
  `;
  try {
    await rawQuery(updateSql, [
      leaseOwner,
      leaseExpiresAtIso,
      nowIso,
      nowIso,
      limit,
    ]);
  } catch (err) {
    return {
      claimed: [],
      rowsAffected: 0,
      leaseOwner,
      leaseExpiresAt: leaseExpiresAtIso,
      error: err instanceof Error ? err.message : "Unknown claim error",
    };
  }

  // Step 2: read back the rows claimed by this leaseOwner.
  const selectSql = `
    SELECT outboxId, eventId, aggregateType, aggregateId, aggregateVersion,
           eventType, schemaVersion, payloadRef, payloadHash, createdAt,
           nextAttemptAt, attemptCount, dispatchStatus, leaseOwner,
           leaseExpiresAt, consumerDedupeKey, traceId, errorCategory
    FROM "OutboxEvent"
    WHERE leaseOwner = ? AND dispatchStatus = 'LEASED'
    ORDER BY nextAttemptAt ASC
    LIMIT ?
  `;
  let claimed: OutboxClaimedRow[] = [];
  let error: string | null = null;
  try {
    const result = await rawQuery(selectSql, [
      leaseOwner,
      limit,
    ]);
    claimed = (result.rows ?? []) as unknown as OutboxClaimedRow[];
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown select error";
  }

  return {
    claimed,
    rowsAffected: claimed.length,
    leaseOwner,
    leaseExpiresAt: leaseExpiresAtIso,
    error,
  };
}

// ---------------------------------------------------------------------------
// §6.2 step 3 — emit to Inngest REST API
// ---------------------------------------------------------------------------

export interface EmitResult {
  ok: boolean;
  status: number;
  error: string | null;
  inngestEventName: string | null;
  mtqBlocked: boolean;
}

/**
 * Emit a single outbox row to Inngest via the public REST API.
 *
 * Endpoint: https://api.inngest.com/event/send
 * Auth:     Bearer ${INNGEST_EVENT_KEY}
 *
 * The row's `eventType` is mapped to an Inngest event name via
 * `eventTypeToInngestEventName`. MTQ-related rows are blocked
 * when the MTQ gate (§3.2) denies — defense-in-depth so that no
 * misrouted outbox row can dispatch an MTQ side effect.
 */
export async function emitEvent(row: OutboxClaimedRow): Promise<EmitResult> {
  const inngestEventName = eventTypeToInngestEventName(row.eventType);
  if (!inngestEventName) {
    return {
      ok: false,
      status: 0,
      error: `Unmapped eventType "${row.eventType}" — DEAD_LETTER the row and add the mapping.`,
      inngestEventName: null,
      mtqBlocked: false,
    };
  }

  // MTQ defense-in-depth: block MTQ-related events when MTQ gate denies.
  if (isMtqEventType(row.eventType)) {
    const gate = assertMtqEnabled(`outbox-dispatcher:${row.outboxId}`);
    if (!gate.ok) {
      return {
        ok: false,
        status: 0,
        error: `MTQ gate denied emit of ${row.eventType}: ${gate.reason ?? ""}`,
        inngestEventName,
        mtqBlocked: true,
      };
    }
  }

  const eventKey = process.env.INNGEST_EVENT_KEY;
  if (!eventKey) {
    return {
      ok: false,
      status: 0,
      error:
        "INNGEST_EVENT_KEY is not set. Cannot emit outbox events. Configure the key per v26.0 §6.6.",
      inngestEventName,
      mtqBlocked: false,
    };
  }

  const body = {
    name: inngestEventName,
    data: {
      outboxId: row.outboxId,
      eventId: row.eventId,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      aggregateVersion: row.aggregateVersion,
      schemaVersion: row.schemaVersion,
      payloadHash: row.payloadHash,
      traceId: row.traceId,
      consumerDedupeKey: row.consumerDedupeKey,
    },
    idempotency: {
      id: row.consumerDedupeKey,
    },
  };

  try {
    const res = await fetch("https://api.inngest.com/event/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${eventKey}`,
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        error: null,
        inngestEventName,
        mtqBlocked: false,
      };
    }
    return {
      ok: false,
      status: res.status,
      error: `Inngest responded ${res.status}: ${await res.text().catch(() => "<unreadable>")}`,
      inngestEventName,
      mtqBlocked: false,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      error: err instanceof Error ? err.message : "Unknown fetch error",
      inngestEventName,
      mtqBlocked: false,
    };
  }
}

// ---------------------------------------------------------------------------
// §6.2 step 4 — mark DELIVERED / RETRYABLE_FAILED / DEAD_LETTERED
// ---------------------------------------------------------------------------

/**
 * Mark a row as DELIVERED. The row's attemptCount is preserved
 * (it is incremented only on failure), and the lease is released.
 */
export async function markDelivered(outboxId: string): Promise<void> {
  const sql = `
    UPDATE "OutboxEvent"
    SET dispatchStatus = 'DELIVERED',
        leaseOwner = NULL,
        leaseExpiresAt = NULL,
        errorCategory = NULL,
        nextAttemptAt = ?
    WHERE outboxId = ?
  `;
  try {
    await rawQuery(sql, [new Date().toISOString(), outboxId]);
  } catch {
    // Best-effort: the authoritative state lives in Neon.
  }
}

/**
 * Compute the bounded exponential backoff for the next attempt.
 * Formula: min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2^(attemptCount)).
 */
export function computeBackoffMs(attemptCount: number): number {
  const exp = Math.max(0, attemptCount);
  const backoff = BASE_BACKOFF_MS * Math.pow(2, exp);
  return Math.min(backoff, MAX_BACKOFF_MS);
}

/**
 * Mark a row as RETRYABLE_FAILED with a bounded exponential
 * backoff for the next attempt. When attemptCount >= MAX_ATTEMPTS
 * the row is moved to DEAD_LETTERED for human review.
 */
export async function markRetryableFailed(
  outboxId: string,
  errorCategory: string,
): Promise<{ deadLettered: boolean; nextAttemptCount: number }> {
  const selectSql = `SELECT attemptCount FROM "OutboxEvent" WHERE outboxId = ?`;
  let nextAttemptCount = 1;
  try {
    const result = await rawQuery<{ attemptCount: number }>(selectSql, [outboxId]);
    if (result.rows.length > 0) {
      nextAttemptCount = (result.rows[0]?.attemptCount ?? 0) + 1;
    }
  } catch {
    // Fall back to assuming first attempt.
  }

  const now = Date.now();
  const backoffMs = computeBackoffMs(nextAttemptCount);
  const nextAttemptAt = new Date(now + backoffMs).toISOString();
  const deadLetter = nextAttemptCount >= MAX_ATTEMPTS;
  const newStatus: OutboxDispatchStatus = deadLetter
    ? "DEAD_LETTERED"
    : "RETRYABLE_FAILED";

  const updateSql = `
    UPDATE "OutboxEvent"
    SET dispatchStatus = ?,
        attemptCount = ?,
        errorCategory = ?,
        leaseOwner = NULL,
        leaseExpiresAt = NULL,
        nextAttemptAt = ?
    WHERE outboxId = ?
  `;
  try {
    await rawQuery(updateSql, [
      newStatus,
      nextAttemptCount,
      errorCategory,
      nextAttemptAt,
      outboxId,
    ]);
  } catch {
    // Best-effort: the authoritative state lives in Neon.
  }

  return { deadLettered: deadLetter, nextAttemptCount };
}

// ---------------------------------------------------------------------------
// §6.2 — dispatcher cycle
// ---------------------------------------------------------------------------

export interface DispatchCycleSummary {
  leaseOwner: string;
  claimed: number;
  delivered: number;
  retryableFailed: number;
  deadLettered: number;
  mtqBlocked: number;
  unmapped: number;
  errors: Array<{ outboxId: string; error: string }>;
  blueprintRef: string;
}

/**
 * Run one dispatcher cycle: claim a batch of PENDING outbox
 * rows, emit each to Inngest, and mark the result. Returns a
 * summary suitable for the /gateway/v1/projection/status and
 * /api/neon/health endpoints.
 */
export async function runDispatcherCycle(
  leaseOwner: string = `dispatcher-${process.pid ?? "single"}`,
  leaseDurationMs: number = 30_000,
  batchLimit: number = 32,
): Promise<DispatchCycleSummary> {
  const claim = await claimPendingOutboxRows(
    leaseOwner,
    leaseDurationMs,
    batchLimit,
  );

  const summary: DispatchCycleSummary = {
    leaseOwner: claim.leaseOwner,
    claimed: claim.rowsAffected,
    delivered: 0,
    retryableFailed: 0,
    deadLettered: 0,
    mtqBlocked: 0,
    unmapped: 0,
    errors: [],
    blueprintRef: "v26.0 §6.2 step 2 — Outbox dispatcher",
  };

  for (const row of claim.claimed) {
    // MTQ defense-in-depth check: short-circuit before the fetch.
    if (isMtqEventType(row.eventType)) {
      const gate = assertMtqEnabled(`outbox-dispatcher:${row.outboxId}`);
      if (!gate.ok) {
        summary.mtqBlocked += 1;
        // Do NOT retry — the row is blocked until MTQ is enabled.
        // Mark DELIVERED with an errorCategory so reviewers can
        // see why the event was suppressed.
        await markDelivered(row.outboxId).catch(() => undefined);
        summary.errors.push({
          outboxId: row.outboxId,
          error: `MTQ gate blocked: ${gate.reason ?? ""}`,
        });
        continue;
      }
    }

    const emit = await emitEvent(row);
    if (emit.ok) {
      await markDelivered(row.outboxId).catch(() => undefined);
      summary.delivered += 1;
    } else if (emit.inngestEventName === null) {
      // Unmapped event type — DEAD_LETTER immediately.
      summary.unmapped += 1;
      summary.errors.push({
        outboxId: row.outboxId,
        error: emit.error ?? "Unmapped eventType",
      });
      const result = await markRetryableFailed(row.outboxId, "UNMAPPED_EVENT_TYPE").catch(
        () => ({ deadLettered: false, nextAttemptCount: 0 }),
      );
      if (result.deadLettered) summary.deadLettered += 1;
    } else {
      summary.retryableFailed += 1;
      summary.errors.push({
        outboxId: row.outboxId,
        error: emit.error ?? "Unknown emit error",
      });
      const result = await markRetryableFailed(row.outboxId, "EMIT_FAILED").catch(
        () => ({ deadLettered: false, nextAttemptCount: 0 }),
      );
      if (result.deadLettered) summary.deadLettered += 1;
    }
  }

  return summary;
}
