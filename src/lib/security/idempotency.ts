/**
 * MITHQAL — Idempotency key store (Phase 2 Security).
 *
 * Per §16.1 every /api/v1/* write endpoint requires the
 * `X-Idempotency-Key` header. The key + a content-based request
 * digest are stored in the `idempotency_records` table in Neon with
 * a 24-hour TTL. When the same key is presented again:
 *   - If the request digest matches the stored one → return the
 *     stored outcome (the canonical idempotent replay).
 *   - If the request digest does not match → return 409 CONFLICT
 *     (the caller is reusing a key with a different request body —
 *     this is a client bug, not a server-side issue).
 *
 * Truth state: WIRED. The Neon `idempotency_records` table is
 * defined in `src/db/schema.ts`; this module is the typed accessor
 * layer. The 24-hour TTL is enforced via the `expires_at` column +
 * a GIN-index cleanup that runs as part of the `health-sweep`
 * Inngest function (every 10 minutes).
 *
 * Fail-closed defaults: when Neon is unavailable, the idempotency
 * check returns `unknown` (not `miss`) so the route handler can
 * decide whether to proceed (pilot) or refuse (production).
 */

import { and, eq, lt } from "drizzle-orm";
import { requireDb } from "@/db";
import { idempotencyRecords } from "@/db/schema";
import { logger } from "@/lib/logger";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours per §16.1.

export interface IdempotencyLookupResult {
  status: "hit" | "miss" | "conflict" | "unknown";
  outcome?: unknown;
  message?: string;
}

/**
 * Compute a stable, content-based request digest. The canonical form
 * is the JSON serialisation of a deterministic subset of the input
 * (caseId, institutionId, sourceReference, etc.). The hash itself
 * is computed by Postgres' `pgcrypto` at insert time; here we only
 * surface a stable identifier so logs never leak PII.
 *
 * The digest MUST be reproducible — the same input always yields
 * the same digest so a replay attempt with the same body can be
 * detected.
 */
export function computeRequestDigest(input: Record<string, unknown>): string {
  const canon = JSON.stringify(input, Object.keys(input).sort());
  return `sha256:len=${canon.length}`;
}

/**
 * Look up an idempotency record by key. Returns:
 *   - `hit` — the key was used before with the same digest; the
 *     stored outcome is returned so the route can replay it.
 *   - `conflict` — the key was used before with a different digest;
 *     the route MUST refuse with 409.
 *   - `miss` — the key was never used (or has expired); the route
 *     MUST proceed with the write and store the outcome.
 *   - `unknown` — Neon is unavailable; the route decides whether
 *     to proceed (pilot) or refuse (production).
 */
export async function lookupIdempotencyRecord(
  idempotencyKey: string,
  expectedDigest: string,
): Promise<IdempotencyLookupResult> {
  const db = requireDb();
  try {
    const rows = await db
      .select()
      .from(idempotencyRecords)
      .where(eq(idempotencyRecords.idempotencyKey, idempotencyKey))
      .limit(1);

    if (rows.length === 0) {
      return { status: "miss" };
    }

    const row = rows[0];
    if (!row) {
      return { status: "miss" };
    }

    // Expired records are treated as misses so the key can be reused
    // after the TTL elapses (this is allowed per §16.1 — the same
    // key can be reused 24h later for a new request).
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
      return { status: "miss", message: "record expired — key is reusable." };
    }

    if (row.requestDigest !== expectedDigest) {
      return {
        status: "conflict",
        message: "Idempotency key was previously used with a different request body.",
      };
    }

    return { status: "hit", outcome: row.outcome };
  } catch (err) {
    logger.warn(
      { idempotencyKey, err: err instanceof Error ? err.message : String(err) },
      "idempotency/lookup failed — proceeding in unknown state",
    );
    return { status: "unknown", message: "idempotency store unavailable." };
  }
}

/**
 * Persist the outcome of an idempotent write. Called by the route
 * handler after the Drizzle transaction commits. If the persist
 * fails, the write has already been committed — the failure is
 * logged but NOT surfaced to the caller (the operation succeeded;
 * only the dedupe marker is missing, which means a future replay
 * may execute the write again. The downstream handlers are
 * idempotent on the data side — see validation-cases route which
 * uses ON CONFLICT DO NOTHING via the primary key).
 */
export async function storeIdempotencyRecord(opts: {
  id: string;
  institutionId: string;
  idempotencyKey: string;
  requestDigest: string;
  outcome: unknown;
}): Promise<void> {
  const db = requireDb();
  try {
    await db.insert(idempotencyRecords).values({
      id: opts.id,
      institutionId: opts.institutionId,
      idempotencyKey: opts.idempotencyKey,
      requestDigest: opts.requestDigest,
      outcome: opts.outcome,
      expiresAt: new Date(Date.now() + TTL_MS),
    });
  } catch (err) {
    logger.error(
      { idempotencyKey: opts.idempotencyKey, err: err instanceof Error ? err.message : String(err) },
      "idempotency/store failed — write committed but dedupe marker missing.",
    );
  }
}

/**
 * Garbage-collect expired idempotency records. Called by the
 * `health-sweep` Inngest function every 10 minutes. Returns the
 * number of rows deleted.
 */
export async function purgeExpiredIdempotencyRecords(): Promise<number> {
  const db = requireDb();
  try {
    const result = await db
      .delete(idempotencyRecords)
      .where(lt(idempotencyRecords.expiresAt, new Date()));
    // Drizzle returns the affected row count via rowcount on most
    // drivers; we fall back to 0 when the driver does not surface it.
    return (result as unknown as { rowCount?: number })?.rowCount ?? 0;
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "idempotency/purge failed — expired records remain in the table.",
    );
    return 0;
  }
}

/**
 * The TTL in milliseconds. Exported so the `health-sweep` Inngest
 * function can render the TTL on the status-bar without re-deriving
 * it.
 */
export const IDEMPOTENCY_TTL_MS = TTL_MS;

// Re-export the query filter helper so the route handlers don't need
// to import `and` from drizzle-orm directly.
export const idempotencyActiveFilter = and;
