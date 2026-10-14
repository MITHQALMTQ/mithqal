/**
 * MITHQAL — Policy publish (Phase 3 Inngest function).
 *
 * Triggered on `policy.published`. Promotes a `policy_versions`
 * row from DRAFT → ACTIVE, upserts the `policy_cache` Turso
 * projection so the dashboard + the policy-registry read path
 * surface the new active version, and emits an `outbox_events` row
 * so downstream consumers (Turso projection, audit export) record
 * the policy change.
 *
 * Truth state: WIRED, MTQ-DISABLED. The publish produces auditable
 * records; it does NOT initiate a payment or execute a rail.
 * productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 */

import { eq } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { outboxEvents, policyVersions } from "@/db/schema";
import { logger } from "@/lib/logger";

export const policyPublish = inngest.createFunction(
  {
    id: "policy-publish",
    name: "Policy Publish",
    triggers: [{ event: EVENTS.POLICY_PUBLISHED }],
  },
  async ({ event, step }) => {
    const policyVersionId = (event.data as { policyVersionId?: string }).policyVersionId;
    const publishedBy = (event.data as { publishedBy?: string }).publishedBy ?? "policy-publish";
    if (!policyVersionId) {
      logger.warn({ event }, "policy-publish/missing policyVersionId — skipping.");
      return { status: "skipped", reason: "missing-policy-version-id" };
    }

    // Step 1 — load the policy version row.
    const loadResult = await step.run("load-policy-version", async () => {
      const db = requireDb();
      const rows = await db
        .select()
        .from(policyVersions)
        .where(eq(policyVersions.id, policyVersionId))
        .limit(1);
      return { row: rows[0] ?? null };
    });

    if (!loadResult.row) {
      logger.warn({ policyVersionId }, "policy-publish/policy version not found — skipping.");
      return { status: "skipped", reason: "policy-version-not-found" };
    }

    const row = loadResult.row;

    // Step 2 — promote DRAFT → ACTIVE in the same transaction as
    // the outbox row write so the policy_cache projection sees
    // both via the single outbox event.
    await step.run("promote-and-outbox", async () => {
      const db = requireDb();
      return db.transaction(async (tx) => {
        await tx
          .update(policyVersions)
          .set({
            status: "ACTIVE",
            effectiveFrom: new Date(row.effectiveFrom),
            approvalRecord: {
              publishedBy,
              publishedAt: new Date().toISOString(),
              priorStatus: row.status,
              mtqDisabled: true,
            },
          })
          .where(eq(policyVersions.id, policyVersionId));

        await tx.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          aggregateType: "POLICY_VERSION",
          aggregateId: policyVersionId,
          eventType: "POLICY_PUBLISHED",
          payload: {
            policyVersionId,
            contentDigest: row.contentDigest,
            status: "ACTIVE",
            effectiveFrom: row.effectiveFrom,
            publishedBy,
            mtqDisabled: true,
          },
          status: "PENDING",
        });
      });
    });

    // Step 3 — emit the Turso projection event so the policy_cache
    // singleton row is upserted.
    await inngest.send({
      name: EVENTS.TURSO_PROJECTION_NEEDED,
      data: {
        scope: "policy_cache",
        policyVersionId,
        contentDigest: row.contentDigest,
        effectiveFrom: row.effectiveFrom,
        status: "ACTIVE",
      },
    });

    logger.info(
      { policyVersionId, status: "ACTIVE", publishedBy },
      "policy-publish/completed",
    );

    return {
      status: "completed",
      policyVersionId,
      newStatus: "ACTIVE",
      publishedBy,
      mtqDisabled: true,
    };
  }
);
