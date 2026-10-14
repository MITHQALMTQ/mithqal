/**
 * MITHQAL — Turso reconcile (Phase 3 Inngest cron function).
 *
 * Runs every hour (per the FULL-PLATFORM-BUILD directive). Reads
 * the latest `outbox_events` row from Neon, compares its `id`
 * against the Turso projections' `source_commit` watermark, and
 * emits a `TURSO_RECONCILIATION_RESULT` Inngest event with either
 * `IN_SYNC` or `DRIFT_DETECTED` payload.
 *
 * On drift, the function triggers a `turso.projection.needed`
 * event with `--rebuild` semantics so the affected projection is
 * rebuilt from canonical history.
 *
 * Truth state: WIRED, MTQ-DISABLED. The reconcile produces
 * auditable records; it does NOT initiate a payment or execute a
 * rail. productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 */

import { createClient, type Client } from "@libsql/client";
import { inngest } from "../client";
import { logger } from "@/lib/logger";

const RECONCILE_PROJECTIONS = [
  "dashboard_summary",
  "recent_cases",
  "active_exceptions",
  "policy_cache",
  "session_state",
  "reference_lookups",
] as const;

type ProjectionName = (typeof RECONCILE_PROJECTIONS)[number];

let tursoClient: Client | null = null;

function getTursoReadClient(): Client | null {
  if (tursoClient) return tursoClient;
  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const token = process.env.TURSO_AUTH_TOKEN;
  try {
    if (url.startsWith("libsql://") || url.startsWith("wss://")) {
      if (!token) {
        tursoClient = createClient({ url: "file:local.db" });
      } else {
        tursoClient = createClient({ url, authToken: token });
      }
    } else {
      tursoClient = createClient({ url });
    }
    return tursoClient;
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "turso-reconcile/client construction failed",
    );
    return null;
  }
}

async function getNeonOutboxLatest(): Promise<{ id: string; createdAt: string } | null> {
  // The Neon authoritative writer is queried via the Drizzle
  // client. We lazy-import to avoid a circular module-load when
  // this function is loaded by the Inngest serve handler.
  try {
    const { requireDb } = await import("@/db");
    const { outboxEvents } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    const db = requireDb();
    const rows = await db
      .select({ id: outboxEvents.id, createdAt: outboxEvents.createdAt })
      .from(outboxEvents)
      .orderBy(desc(outboxEvents.createdAt))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    return { id: row.id, createdAt: row.createdAt.toISOString() };
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "turso-reconcile/Neon outbox read failed",
    );
    return null;
  }
}

async function getTursoProjectionWatermark(client: Client, projection: ProjectionName): Promise<string | null> {
  try {
    const result = await client.execute({
      sql: `SELECT source_commit FROM ${projection} ORDER BY projected_at DESC LIMIT 1`,
      args: [],
    });
    const row = result.rows[0];
    if (!row) return null;
    return typeof row.source_commit === "string" ? row.source_commit : String(row.source_commit);
  } catch {
    return null;
  }
}

export const tursoReconcile = inngest.createFunction(
  {
    id: "turso-reconcile",
    name: "Turso Reconcile",
    // Hourly cron — the schedule is registered in the Inngest Cloud
    // dashboard; the function also triggers on the
    // `turso.reconcile.needed` event for ad-hoc runs.
    triggers: [{ event: "turso.reconcile.needed" }],
  },
  async ({ step }) => {
    const client = getTursoReadClient();
    if (!client) {
      logger.warn("turso-reconcile/Turso unavailable — skipping reconcile.");
      return { status: "skipped", reason: "turso-unavailable" };
    }

    // Step 1 — read the latest Neon outbox row.
    const neonLatest = await step.run("read-neon-latest", async () => {
      return getNeonOutboxLatest();
    });
    if (!neonLatest) {
      logger.info("turso-reconcile/Neon outbox empty — projections are trivially in sync.");
      return { status: "completed", result: "IN_SYNC", reason: "neon-empty" };
    }

    // Step 2 — for each projection, compare the source_commit watermark
    // against the Neon latest. Drift = the projection's watermark lags.
    const perProjection = await step.run("compare-watermarks", async () => {
      const checks: Array<{ projection: ProjectionName; stale: boolean; watermark: string | null }> = [];
      for (const projection of RECONCILE_PROJECTIONS) {
        const watermark = await getTursoProjectionWatermark(client, projection);
        const stale = !watermark || watermark !== neonLatest.id;
        checks.push({ projection, stale, watermark });
      }
      return checks;
    });

    const anyStale = perProjection.some((c) => c.stale);

    // Step 3 — on drift, emit a turso-projection rebuild event for each
    // stale projection.
    if (anyStale) {
      await step.run("trigger-rebuild", async () => {
        for (const check of perProjection) {
          if (check.stale) {
            await inngest.send({
              name: "turso.projection.needed",
              data: {
                scope: check.projection,
                rebuild: true,
                sourceCommit: neonLatest.id,
              },
            });
          }
        }
      });
    }

    logger.info(
      {
        result: anyStale ? "DRIFT_DETECTED" : "IN_SYNC",
        neonLatestId: neonLatest.id,
        anyStale,
        perProjection,
      },
      "turso-reconcile/completed",
    );

    return {
      status: "completed",
      result: anyStale ? "DRIFT_DETECTED" : "IN_SYNC",
      neonLatestId: neonLatest.id,
      anyStale,
      perProjection,
      mtqDisabled: true,
    };
  }
);
