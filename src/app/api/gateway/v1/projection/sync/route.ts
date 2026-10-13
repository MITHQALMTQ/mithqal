// POST /api/gateway/v1/projection/sync
// Run one sync cycle for a named Turso projection per v26.0 §6.2 step 4 + §6.8.
//
// v26.0 §6.2 step 4:
//   "Projector updates Turso from canonical records/events with
//    sequence/watermark, duplicate detection and last-applied event ID."
//
// v26.0 §6.8:
//   - "Every projection records lastAppliedEventId/sequence, source
//      snapshot/version, updatedAt and projection schema version."
//   - "Stale/partial projections are visible and excluded from
//      authorization, finality, backing eligibility and gate decisions."
//
// Body: { projectionName: string, rebuild?: boolean }
//
// This route is ADMIN-AUTHORIZED (operator). The projector itself does NOT
// authorize mints; it's a read-model sync. MTQ gate does not apply.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  PROJECTION_NAMES,
  applyEvent,
  rebuildProjection,
  getProjectionWatermark,
} from "@/lib/turso-projector";
import type { OutboxRow } from "@/lib/db-authoritative";
import { createClient } from "@libsql/client";

interface SyncRequestBody {
  projectionName: string;
  rebuild?: boolean;
}

export async function POST(req: Request) {
  // ===== Admin auth =====
  const session = await getServerSession(authOptions).catch(() => null);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "operator") {
    return NextResponse.json(
      {
        error: "Unauthorized — operator auth required.",
        blueprint_ref: "v26.0 §7.1",
      },
      { status: 401 },
    );
  }

  // ===== Body parse =====
  let body: SyncRequestBody;
  try {
    body = (await req.json()) as SyncRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", blueprint_ref: "v26.0 §6.2 step 4" },
      { status: 400 },
    );
  }
  if (!body.projectionName) {
    return NextResponse.json(
      {
        error: "projectionName is required.",
        allowed: PROJECTION_NAMES,
        blueprint_ref: "v26.0 §6.8",
      },
      { status: 400 },
    );
  }
  if (!PROJECTION_NAMES.includes(body.projectionName as (typeof PROJECTION_NAMES)[number])) {
    return NextResponse.json(
      {
        error: `Unknown projection: ${body.projectionName}`,
        allowed: PROJECTION_NAMES,
        blueprint_ref: "v26.0 §6.8",
      },
      { status: 400 },
    );
  }

  // ===== Rebuild path =====
  if (body.rebuild) {
    try {
      const result = await rebuildProjection(body.projectionName);
      return NextResponse.json(
        {
          endpoint: "/gateway/v1/projection/sync",
          method: "POST",
          blueprint_ref: "v26.0 §6.2 step 4 + §6.8",
          mode: "REBUILD",
          result,
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: "Rebuild failed.",
          detail: message,
          blueprint_ref: "v26.0 §6.8",
        },
        { status: 503 },
      );
    }
  }

  // ===== Incremental sync path =====
  // Read the watermark, then read all OutboxEvent rows with createdAt >
  // watermark.updatedAt, apply each, return the new watermark.
  const wmBefore = await getProjectionWatermark(body.projectionName);

  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "";
  const authToken =
    process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? undefined;
  if (!url) {
    return NextResponse.json(
      {
        error: "DATABASE_URL is not set; cannot sync projection.",
        blueprint_ref: "v26.0 §6.2 step 4",
      },
      { status: 503 },
    );
  }
  const client = createClient({
    url,
    authToken: url.startsWith("file:") ? undefined : authToken,
  });

  // Read all DELIVERED outbox events (these are the ones the dispatcher has
  // successfully emitted to Inngest; the projector consumes them to update
  // the Turso projection per §6.2 step 4).
  const eventsResult = await client.execute({
    sql: `SELECT * FROM "OutboxEvent"
          WHERE "dispatchStatus" = 'DELIVERED'
            AND datetime("createdAt") > datetime(?)
          ORDER BY datetime("createdAt") ASC`,
    args: [wmBefore.updatedAt],
  });

  const applied: string[] = [];
  let duplicates = 0;
  let gaps = 0;
  let newWatermark = wmBefore;
  for (const row of eventsResult.rows ?? []) {
    const r = row as Record<string, unknown>;
    const outboxRow: OutboxRow = {
      outboxId: String(r.outboxId ?? ""),
      eventId: String(r.eventId ?? ""),
      aggregateType: String(r.aggregateType ?? ""),
      aggregateId: String(r.aggregateId ?? ""),
      aggregateVersion: Number(r.aggregateVersion ?? 0),
      eventType: String(r.eventType ?? ""),
      schemaVersion: String(r.schemaVersion ?? ""),
      payloadRef: r.payloadRef == null ? null : String(r.payloadRef),
      payloadHash: String(r.payloadHash ?? ""),
      createdAt: String(r.createdAt ?? ""),
      nextAttemptAt: String(r.nextAttemptAt ?? ""),
      attemptCount: Number(r.attemptCount ?? 0),
      dispatchStatus: String(r.dispatchStatus ?? "PENDING"),
      leaseOwner: r.leaseOwner == null ? null : String(r.leaseOwner),
      leaseExpiresAt:
        r.leaseExpiresAt == null ? null : String(r.leaseExpiresAt),
      consumerDedupeKey: String(r.consumerDedupeKey ?? ""),
      traceId: r.traceId == null ? null : String(r.traceId),
      errorCategory: r.errorCategory == null ? null : String(r.errorCategory),
    };
    const result = await applyEvent(outboxRow, body.projectionName);
    applied.push(...result.appliedEventIds);
    duplicates += result.duplicatesDetected;
    gaps += result.gapsDetected;
    newWatermark = result.newWatermark;
  }

  return NextResponse.json(
    {
      endpoint: "/gateway/v1/projection/sync",
      method: "POST",
      blueprint_ref: "v26.0 §6.2 step 4 + §6.8",
      mode: "INCREMENTAL",
      projectionName: body.projectionName,
      eventsProcessed: applied.length,
      duplicatesDetected: duplicates,
      gapsDetected: gaps,
      watermarkBefore: wmBefore,
      watermarkAfter: newWatermark,
    },
    {
      headers: { "X-Blueprint-Ref": "v26.0 §6.2 step 4 + §6.8" },
    },
  );
}
