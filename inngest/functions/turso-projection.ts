/**
 * MITHQAL — Turso projection (Phase 3 Inngest function).
 *
 * Triggered on `turso.projection.needed`. Reads the affected
 * OutboxEvent row from Neon, applies it to the relevant Turso
 * projection table(s) per the §6.8 projection matrix, and writes a
 * watermark row recording the source commit + projected_at
 * timestamp so the `turso-reconcile` cron can detect drift.
 *
 * Projections are eventually consistent (per §5.3, the SLO is
 * 1000 ms). When a projection falls behind, the read router in
 * `src/lib/turso-projector.ts` `checkStale()` falls back to Neon.
 *
 * Truth state: WIRED, MTQ-DISABLED. The projection produces
 * auditable records; it does NOT initiate a payment or execute a
 * rail. productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * Idempotency: the function is idempotent — re-delivery of the
 * same outbox event produces the same Turso state (upsert by
 * primary key).
 */

import { count, eq } from "drizzle-orm";
import { createClient, type Client } from "@libsql/client";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { exceptions, outboxEvents, validationCases } from "@/db/schema";
import { logger } from "@/lib/logger";

let tursoClient: Client | null = null;

function getTursoWriteClient(): Client | null {
  if (tursoClient) return tursoClient;
  const url = process.env.TURSO_DATABASE_URL ?? "file:local.db";
  const token = process.env.TURSO_AUTH_TOKEN;
  try {
    if (url.startsWith("libsql://") || url.startsWith("wss://")) {
      if (!token) {
        logger.warn("turso-projection/TURSO_AUTH_TOKEN missing — using local file (projections disabled).");
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
      "turso-projection/client construction failed",
    );
    return null;
  }
}

interface ProjectionEventPayload {
  outboxId?: string;
  aggregateType?: string;
  aggregateId?: string;
  eventType?: string;
  payload?: unknown;
  scope?: string;
}

async function projectDashboardSummary(
  client: Client,
  sourceCommit: string,
  projectedAt: string,
): Promise<void> {
  const db = requireDb();
  const [caseCountRows, excCountRows] = await Promise.all([
    db.select({ n: count() }).from(validationCases),
    db.select({ n: count() }).from(exceptions).where(eq(exceptions.status, "OPEN")),
  ]);
  const casesN = Number(caseCountRows[0]?.n ?? 0);
  const excN = Number(excCountRows[0]?.n ?? 0);
  await client.execute({
    sql: `INSERT INTO dashboard_summary
            (id, total_cases, open_exceptions, last_updated, source_commit, projected_at)
          VALUES ('singleton', ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            total_cases = excluded.total_cases,
            open_exceptions = excluded.open_exceptions,
            last_updated = excluded.last_updated,
            source_commit = excluded.source_commit,
            projected_at = excluded.projected_at`,
    args: [casesN, excN, projectedAt, sourceCommit, projectedAt],
  });
}

async function projectRecentCase(
  client: Client,
  caseId: string,
  sourceCommit: string,
  projectedAt: string,
): Promise<void> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(validationCases)
    .where(eq(validationCases.id, caseId))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  await client.execute({
    sql: `INSERT INTO recent_cases
            (id, case_id, institution_id, corridor, source_currency, target_currency, amount, status, policy_version, created_at, source_commit, projected_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(case_id) DO UPDATE SET
            status = excluded.status,
            projected_at = excluded.projected_at,
            source_commit = excluded.source_commit`,
    args: [
      `rc:${caseId}`,
      row.id,
      row.institutionId,
      row.corridor ?? null,
      row.sourceCurrency ?? null,
      row.targetCurrency ?? null,
      row.amount ?? null,
      row.status,
      row.policyVersion ?? null,
      row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
      sourceCommit,
      projectedAt,
    ],
  });
}

export const tursoProjection = inngest.createFunction(
  {
    id: "turso-projection",
    name: "Turso Projection",
    triggers: [{ event: EVENTS.TURSO_PROJECTION_NEEDED }],
  },
  async ({ event, step }) => {
    const data = event.data as ProjectionEventPayload;
    const client = getTursoWriteClient();
    if (!client) {
      logger.warn("turso-projection/client unavailable — skipping projection.");
      return { status: "skipped", reason: "turso-unavailable" };
    }

    const sourceCommit = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
    const projectedAt = new Date().toISOString();

    // Step 1 — when an outboxId was supplied, mark the source row as
    // PROGRESSING so the dispatcher knows the projection is in flight.
    if (data.outboxId) {
      await step.run("mark-progressing", async () => {
        const db = requireDb();
        await db
          .update(outboxEvents)
          .set({ status: "PROGRESSING" })
          .where(eq(outboxEvents.id, data.outboxId ?? ""));
      });
    }

    // Step 2 — apply the projection per the event's scope / event type.
    try {
      await step.run("apply-projection", async () => {
        // Always refresh the dashboard summary singleton.
        await projectDashboardSummary(client, sourceCommit, projectedAt);

        // When the event carries an aggregateId (validation case),
        // upsert the recent_cases row.
        if (data.aggregateType === "VALIDATION_CASE" && data.aggregateId) {
          await projectRecentCase(client, data.aggregateId, sourceCommit, projectedAt);
        }

        // When the scope is policy_cache, upsert the policy_cache row.
        if (data.scope === "policy_cache" && data.payload) {
          const p = data.payload as {
            policyVersionId?: string;
            contentDigest?: string;
            effectiveFrom?: string;
            status?: string;
          };
          await client.execute({
            sql: `INSERT INTO policy_cache
                    (id, policy_version, content_digest, effective_from, status, source_commit, projected_at)
                  VALUES ('singleton', ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET
                    policy_version = excluded.policy_version,
                    content_digest = excluded.content_digest,
                    effective_from = excluded.effective_from,
                    status = excluded.status,
                    source_commit = excluded.source_commit,
                    projected_at = excluded.projected_at`,
            args: [
              p.policyVersionId ?? "",
              p.contentDigest ?? "",
              p.effectiveFrom ?? projectedAt,
              p.status ?? "ACTIVE",
              sourceCommit,
              projectedAt,
            ],
          });
        }
      });
    } catch (err) {
      logger.error(
        { outboxId: data.outboxId, err: err instanceof Error ? err.message : String(err) },
        "turso-projection/apply failed",
      );
      return { status: "failed", reason: "apply-error", mtqDisabled: true };
    }

    logger.info(
      { outboxId: data.outboxId, scope: data.scope, projectedAt },
      "turso-projection/completed",
    );

    return {
      status: "completed",
      outboxId: data.outboxId,
      scope: data.scope,
      projectedAt,
      sourceCommit,
      mtqDisabled: true,
    };
  }
);
