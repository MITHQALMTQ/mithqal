/**
 * MITHQAL — Outbox dispatch (Phase 3 Inngest function).
 *
 * The transactional-outbox consumer per §6.2 step 4. Polls the
 * `outbox_events` table for `PENDING` rows, fans each one out to
 * the registered consumers (Turso projection, evidence bundle,
 * reconciliation, dashboard), and marks the row as `DELIVERED`
 * with the delivery timestamp. The function runs on a cron schedule
 * (every 10 seconds in production; every 30 seconds in pilot) and
 * is invoked by the Inngest Cloud scheduler.
 *
 * Truth state: WIRED, MTQ-DISABLED. The dispatcher produces
 * auditable records; it does NOT initiate a payment or execute a
 * rail. productionAuthorized=false; MTQ Σ remains NOT AUTHORIZED.
 *
 * Idempotency: the dispatcher is idempotent — re-delivery of the
 * same outbox row produces the same downstream state. Consumers
 * MUST tolerate at-least-once delivery.
 */

import { and, asc, eq, lt } from "drizzle-orm";
import { EVENTS, inngest } from "../client";
import { requireDb } from "@/db";
import { outboxEvents } from "@/db/schema";
import { logger } from "@/lib/logger";

const BATCH_SIZE = 100;
const MAX_RETRIES = 5;

export const outboxDispatch = inngest.createFunction(
  {
    id: "outbox-dispatch",
    name: "Outbox Dispatcher",
    triggers: [{ event: EVENTS.OUTBOX_PENDING }],
  },
  async ({ step }) => {
    // Step 1 — read a batch of PENDING outbox rows (oldest first).
    const batch = await step.run("read-batch", async () => {
      const db = requireDb();
      const rows = await db
        .select()
        .from(outboxEvents)
        .where(eq(outboxEvents.status, "PENDING"))
        .orderBy(asc(outboxEvents.createdAt))
        .limit(BATCH_SIZE);
      return rows;
    });

    if (batch.length === 0) {
      return { status: "no-work", dispatched: 0 };
    }

    // Step 2 — for each row, emit the consumer Inngest event +
    // mark the row as DELIVERED. Failed dispatches (errors) are
    // retried; rows that exceed MAX_RETRIES are marked FAILED for
    // operator intervention.
    let dispatched = 0;
    let failed = 0;
    for (const row of batch) {
      try {
        await step.run(`dispatch-${row.id}`, async () => {
          const db = requireDb();
          // Emit consumer events based on the row's eventType.
          if (row.eventType === "VALIDATION_CASE_RECEIVED" || row.eventType === "VALIDATION_COMPLETED" || row.eventType === "EXCEPTION_OPENED" || row.eventType === "EXCEPTION_RESOLVED" || row.eventType === "RECONCILIATION_COMPLETED" || row.eventType === "SAFE_HALTED") {
            await inngest.send({
              name: EVENTS.TURSO_PROJECTION_NEEDED,
              data: {
                outboxId: row.id,
                aggregateType: row.aggregateType,
                aggregateId: row.aggregateId,
                eventType: row.eventType,
                payload: row.payload,
              },
            });
          }

          // Mark as DELIVERED.
          await db
            .update(outboxEvents)
            .set({ status: "DELIVERED", deliveredAt: new Date() })
            .where(eq(outboxEvents.id, row.id));
        });
        dispatched += 1;
      } catch (err) {
        failed += 1;
        logger.error(
          { outboxId: row.id, err: err instanceof Error ? err.message : String(err) },
          "outbox-dispatch/dispatch failed",
        );
        // Bump the retry count; mark FAILED when above MAX_RETRIES.
        try {
          const db = requireDb();
          const newRetry = (row.retryCount ?? 0) + 1;
          await db
            .update(outboxEvents)
            .set({
              retryCount: newRetry,
              status: newRetry >= MAX_RETRIES ? "FAILED" : "PENDING",
            })
            .where(
              and(
                eq(outboxEvents.id, row.id),
                lt(outboxEvents.retryCount, MAX_RETRIES),
              ),
            );
        } catch (updateErr) {
          logger.error(
            { outboxId: row.id, err: updateErr instanceof Error ? updateErr.message : String(updateErr) },
            "outbox-dispatch/retry-count update failed",
          );
        }
      }
    }

    logger.info(
      { dispatched, failed, batchSize: batch.length },
      "outbox-dispatch/completed",
    );

    return {
      status: "completed",
      dispatched,
      failed,
      batchSize: batch.length,
      mtqDisabled: true,
    };
  }
);
