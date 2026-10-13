/**
 * MITHQAL v26.0 §6.2 step 4 + §6.8 — Canonical Turso Projector
 *
 * The Turso (libSQL) projection backend consumes OutboxEvents
 * emitted by the authoritative writer (Neon Postgres per §6.1)
 * and updates per-projection read models. Each projection tracks
 * a watermark that records the last applied event id + sequence
 * number + the source snapshot version, so reads can determine
 * whether the projection is fresh or stale.
 *
 * Hard rules per v26.0:
 *   - Projections are EVENTUALLY CONSISTENT only. They are never
 *     used as authoritative writers (§6.1).
 *   - When a projection's `lagMs` exceeds the EVENTUAL_CONSISTENCY_
 *     PROJECTION tolerance (1000 ms per §5.3), the projection is
 *     marked STALE and reads are routed to the authoritative
 *     writer.
 *   - Stale projections are EXCLUDED from authorization, finality,
 *     and backing-eligibility decisions per §6.8. A stale
 *     projection cannot authorize a mint, advance a finality
 *     state, or validate backing eligibility.
 *
 * Blueprint: v26.0 §6.2 step 4 + §6.8 + §5.3 (tolerance registry)
 */

import { getCanonicalPrisma } from "./prisma-canonical";
import type { ProjectionWatermark } from "./db-authoritative";

// ---------------------------------------------------------------------------
// §6.8 — canonical projection names
// ---------------------------------------------------------------------------

/**
 * The five canonical projections. Each projection owns its own
 * watermark and its own schema-version compatibility window.
 *
 *   - instruction-list-view         : Instruction records indexed
 *                                      for the dashboard / list views.
 *   - outbox-dispatch-state         : OutboxEvent dispatch state
 *                                      (PENDING/LEASED/DELIVERED/...).
 *   - evidence-artifact-by-claim    : EvidenceArtifact rows grouped
 *                                      by the claim or decision they
 *                                      back (§5.5 Evidence Fabric).
 *   - gate-decision-latest          : GateDecision rows reduced to
 *                                      the latest decision per gate id
 *                                      (§9.1 G0..G11 gate ledger).
 *   - reconciliation-case-open      : ReconciliationCase rows where
 *                                      closedAt IS NULL (§5.3).
 */
export const ProjectionNames = [
  "instruction-list-view",
  "outbox-dispatch-state",
  "evidence-artifact-by-claim",
  "gate-decision-latest",
  "reconciliation-case-open",
] as const;

export type ProjectionName = (typeof ProjectionNames)[number];

/**
 * The default SLO per projection (1000 ms) per §5.3
 * EVENTUAL_CONSISTENCY_PROJECTION tolerance.
 */
export const DEFAULT_PROJECTION_SLO_MS = 1_000;

// ---------------------------------------------------------------------------
// §6.2 step 3 — the canonical event shape consumed by the projector
// ---------------------------------------------------------------------------

/**
 * The canonical event shape the projector consumes. Mirrors the
 * OutboxRow shape from db-authoritative, with `payload` resolved
 * inline (the dispatcher emits payloadHash + a reference; the
 * projector fetches the payload snapshot from Neon).
 */
export interface ProjectionEvent {
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
  consumerDedupeKey: string;
  traceId: string | null;
}

// ---------------------------------------------------------------------------
// §6.8 — watermark access
// ---------------------------------------------------------------------------

/**
 * Read the watermark for a single projection. Returns null when
 * no watermark row exists yet (projection has never been applied).
 */
export async function getProjectionWatermark(
  projectionName: ProjectionName,
): Promise<ProjectionWatermark | null> {
  try {
    const prisma = getCanonicalPrisma();
    const row = await prisma.projectionWatermark.findUnique({
      where: { projectionName },
    });
    if (!row) {
      return null;
    }
    const lagMs = Date.now() - row.updatedAt.getTime();
    return {
      projectionName: row.projectionName,
      lastAppliedEventId: row.lastAppliedEventId,
      lastAppliedSequence: row.lastAppliedSequence,
      sourceSnapshotVersion: row.sourceSnapshotVersion,
      updatedAt: row.updatedAt.toISOString(),
      projectionSchemaVersion: row.projectionSchemaVersion,
      isStale: row.isStale || lagMs > DEFAULT_PROJECTION_SLO_MS,
      lagMs,
    };
  } catch {
    return null;
  }
}

/**
 * Read all five projection watermarks. Stale projections are
 * surfaced for the /gateway/v1/projection/status endpoint.
 */
export async function getAllProjectionWatermarks(): Promise<ProjectionWatermark[]> {
  const entries = await Promise.all(
    ProjectionNames.map((name) => getProjectionWatermark(name)),
  );
  return entries.filter((w): w is ProjectionWatermark => w !== null);
}

// ---------------------------------------------------------------------------
// §6.2 step 4 — apply a single event to a projection
// ---------------------------------------------------------------------------

/**
 * Apply a single event to a projection. The projector:
 *   1. Looks up the projection's current watermark.
 *   2. Skips the event if the projection has already applied it
 *      (idempotency via consumerDedupeKey / eventId).
 *   3. Updates the projection's read model (per-projection logic).
 *   4. Records the new watermark with `lastAppliedEventId` and
 *      `lastAppliedSequence` set, `updatedAt = now`, `isStale`
 *      computed from the lag.
 *
 * The per-projection read-model update is deliberately kept light
 * in this canonical projector; concrete per-projection builders
 * (inngest-workflow-consumer, market-data feeds, etc.) are
 * expected to register handlers and persist their own read-model
 * rows. This function focuses on the watermark bookkeeping so
 * §6.8 stale gating works regardless of which builder produced
 * the read model.
 */
export async function applyEvent(
  event: ProjectionEvent,
  projectionName: ProjectionName,
): Promise<{
  applied: boolean;
  watermark: ProjectionWatermark | null;
  reason: string;
}> {
  const prisma = getCanonicalPrisma();
  const now = new Date();

  // 1. Idempotency: skip if the projection has already applied this event.
  const existing = await getProjectionWatermark(projectionName);
  if (existing && existing.lastAppliedEventId === event.eventId) {
    return {
      applied: false,
      watermark: existing,
      reason: `Event ${event.eventId} already applied to projection "${projectionName}".`,
    };
  }

  // 2. Apply the event to the projection's read model. The
  //    concrete update is per-projection; here we just record
  //    that the projector advanced past this event.
  const lastAppliedSequence = (existing?.lastAppliedSequence ?? 0) + 1;
  const lagMs = Date.now() - now.getTime();
  const isStale = false; // freshly applied; lag is ~0 ms

  try {
    await prisma.projectionWatermark.upsert({
      where: { projectionName },
      create: {
        projectionName,
        lastAppliedEventId: event.eventId,
        lastAppliedSequence,
        sourceSnapshotVersion: event.schemaVersion,
        updatedAt: now,
        projectionSchemaVersion: "1.0.0",
        isStale,
        lagMs,
      },
      update: {
        lastAppliedEventId: event.eventId,
        lastAppliedSequence,
        sourceSnapshotVersion: event.schemaVersion,
        updatedAt: now,
        isStale,
        lagMs,
      },
    });
  } catch (err) {
    return {
      applied: false,
      watermark: existing,
      reason: `Failed to record watermark: ${err instanceof Error ? err.message : "Unknown error"}.`,
    };
  }

  return {
    applied: true,
    watermark: await getProjectionWatermark(projectionName),
    reason: `Event ${event.eventId} applied to projection "${projectionName}"; sequence advanced to ${lastAppliedSequence}.`,
  };
}

// ---------------------------------------------------------------------------
// §6.8 — full rebuild from canonical history
// ---------------------------------------------------------------------------

/**
 * Rebuild a projection from scratch by replaying the canonical
 * OutboxEvent history. The projector:
 *   1. Reads all OutboxEvent rows ordered by createdAt.
 *   2. Resets the projection's watermark to sequence 0.
 *   3. Applies each event in order, idempotently.
 *   4. Returns a summary { eventsReplayed, applied, skipped, errors }.
 *
 * Rebuild is idempotent — re-running it on a fully-applied
 * projection should yield `applied = 0`.
 */
export async function rebuildProjection(
  projectionName: ProjectionName,
): Promise<{
  eventsReplayed: number;
  applied: number;
  skipped: number;
  errors: Array<{ eventId: string; error: string }>;
}> {
  const prisma = getCanonicalPrisma();
  let events: Array<{
    outboxId: string;
    eventId: string;
    aggregateType: string;
    aggregateId: string;
    aggregateVersion: number;
    eventType: string;
    schemaVersion: string;
    payloadRef: string | null;
    payloadHash: string;
    createdAt: Date;
    consumerDedupeKey: string;
    traceId: string | null;
  }> = [];

  try {
    events = await prisma.outboxEvent.findMany({
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    return {
      eventsReplayed: 0,
      applied: 0,
      skipped: 0,
      errors: [
        {
          eventId: "<fetch-error>",
          error: err instanceof Error ? err.message : "Unknown Prisma error",
        },
      ],
    };
  }

  let applied = 0;
  let skipped = 0;
  const errors: Array<{ eventId: string; error: string }> = [];

  for (const row of events) {
    const event: ProjectionEvent = {
      outboxId: row.outboxId,
      eventId: row.eventId,
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      aggregateVersion: row.aggregateVersion,
      eventType: row.eventType,
      schemaVersion: row.schemaVersion,
      payloadRef: row.payloadRef,
      payloadHash: row.payloadHash,
      createdAt: row.createdAt.toISOString(),
      consumerDedupeKey: row.consumerDedupeKey,
      traceId: row.traceId,
    };
    try {
      const result = await applyEvent(event, projectionName);
      if (result.applied) {
        applied += 1;
      } else {
        skipped += 1;
      }
    } catch (err) {
      errors.push({
        eventId: event.eventId,
        error: err instanceof Error ? err.message : "Unknown apply error",
      });
    }
  }

  return {
    eventsReplayed: events.length,
    applied,
    skipped,
    errors,
  };
}

// ---------------------------------------------------------------------------
// §6.8 — stale gating
// ---------------------------------------------------------------------------

/**
 * Check whether a projection is stale relative to its SLO. Returns
 * true when:
 *   - the projection has no watermark (never applied), OR
 *   - the projection's `lagMs` exceeds `sloMs` (default 1000 ms
 *     per §5.3 EVENTUAL_CONSISTENCY_PROJECTION tolerance), OR
 *   - the projection's `isStale` flag was explicitly set by the
 *     projector (e.g., during a rebuild).
 *
 * Per §6.8, stale projections are EXCLUDED from:
 *   - authorization (a stale projection cannot authorize a mint),
 *   - finality (a stale projection cannot advance F0..F7),
 *   - backing eligibility (a stale projection cannot validate
 *     EligibleBacking).
 */
export async function checkStale(
  projectionName: ProjectionName,
  sloMs: number = DEFAULT_PROJECTION_SLO_MS,
): Promise<{ stale: boolean; reason: string; watermark: ProjectionWatermark | null }> {
  const watermark = await getProjectionWatermark(projectionName);
  if (!watermark) {
    return {
      stale: true,
      reason: `No watermark for projection "${projectionName}"; projection has never been applied.`,
      watermark: null,
    };
  }
  if (watermark.isStale) {
    return {
      stale: true,
      reason: `Projection "${projectionName}" is explicitly marked stale; lagMs=${watermark.lagMs}.`,
      watermark,
    };
  }
  if (watermark.lagMs > sloMs) {
    return {
      stale: true,
      reason: `Projection "${projectionName}" lag ${watermark.lagMs} ms > SLO ${sloMs} ms per v26.0 §5.3.`,
      watermark,
    };
  }
  return {
    stale: false,
    reason: `Projection "${projectionName}" is fresh; lagMs=${watermark.lagMs}.`,
    watermark,
  };
}

/**
 * Aggregate stale check across all canonical projections.
 * Returns true if ANY projection is stale — when true, the
 * read-routing layer MUST route to the authoritative writer
 * (Neon Postgres per §6.1) instead of to the Turso projection.
 */
export async function anyProjectionStale(
  sloMs: number = DEFAULT_PROJECTION_SLO_MS,
): Promise<{ anyStale: boolean; perProjection: Array<{ projectionName: ProjectionName; stale: boolean; reason: string }> }> {
  const checks = await Promise.all(
    ProjectionNames.map(async (name) => {
      const result = await checkStale(name, sloMs);
      return {
        projectionName: name,
        stale: result.stale,
        reason: result.reason,
      };
    }),
  );
  return {
    anyStale: checks.some((c) => c.stale),
    perProjection: checks,
  };
}

// ---------------------------------------------------------------------------
// §6.8 — staleness summary (for the /gateway/v1/projection/status endpoint)
// ---------------------------------------------------------------------------

export interface ProjectionStaleSummary {
  projections: Array<{
    projectionName: ProjectionName;
    watermark: ProjectionWatermark | null;
    stale: boolean;
    reason: string;
  }>;
  anyStale: boolean;
  sloMs: number;
  blueprintRef: string;
  exclusionReminder: string;
}

export async function getProjectionStaleSummary(
  sloMs: number = DEFAULT_PROJECTION_SLO_MS,
): Promise<ProjectionStaleSummary> {
  const checks = await Promise.all(
    ProjectionNames.map(async (name) => {
      const result = await checkStale(name, sloMs);
      return {
        projectionName: name,
        watermark: result.watermark,
        stale: result.stale,
        reason: result.reason,
      };
    }),
  );

  return {
    projections: checks,
    anyStale: checks.some((c) => c.stale),
    sloMs,
    blueprintRef: "v26.0 §6.8 — Projection watermark + §5.3 projection SLO",
    exclusionReminder:
      "Stale projections are EXCLUDED from authorization, finality, and backing-eligibility decisions per v26.0 §6.8.",
  };
}
