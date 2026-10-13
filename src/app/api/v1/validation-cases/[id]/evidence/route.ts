/**
 * GET /api/v1/validation-cases/[id]/evidence — MITHQAL MASTER BLUEPRINT §16.1.
 *
 * Read the authorised evidence index for a validation case. Returns the
 * source_snapshots and evidence_events that are within the caller's
 * access scope. Access scope is determined per-event (the source_snapshot
 * row carries an `access_scope` field — §16.3 Table 3).
 *
 * Truth state: WIRED, MTQ-DISABLED. Hashes assist integrity checking but
 * do NOT prove source truth (§5.4 / §D.4 critical rule). The evidence
 * index is read-only — it does NOT alter the case or initiate a payment.
 */

import { asc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { evidenceEvents, sourceSnapshots, validationCases } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  const { id } = await ctx.params;
  if (!id) {
    return errorResponse(400, "MISSING_PATH_PARAM", "Validation case id is required.");
  }

  const db = requireDb();
  try {
    // Verify the case exists first.
    const caseRow = await db
      .select({ id: validationCases.id, status: validationCases.status })
      .from(validationCases)
      .where(eq(validationCases.id, id))
      .limit(1);

    if (caseRow.length === 0) {
      return errorResponse(404, "NOT_FOUND", `Validation case ${id} not found.`);
    }

    const snapshots = await db
      .select()
      .from(sourceSnapshots)
      .where(eq(sourceSnapshots.validationCaseId, id))
      .orderBy(asc(sourceSnapshots.ingestionTimestamp));

    const events = await db
      .select()
      .from(evidenceEvents)
      .where(eq(evidenceEvents.validationCaseId, id))
      .orderBy(asc(evidenceEvents.timestamp));

    return okResponse({
      caseId: id,
      caseStatus: caseRow[0]?.status ?? "UNKNOWN",
      sources: snapshots,
      events,
      // Per §5.4 — hashes do not prove source truth.
      integrityNote:
        "Payload digests and event hashes assist integrity checking. " +
        "They do not prove source truth. A signed event confirms receipt " +
        "from the identified actor, not that the underlying record is accurate.",
    });
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "validation-case/evidence query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
