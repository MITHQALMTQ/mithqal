/**
 * GET /api/v1/validation-cases/[id]/timeline — MITHQAL MASTER BLUEPRINT §16.1 + §5.4.
 *
 * Read the source-specific event timeline for a validation case. Events are
 * the 10 source-specific evidence events from §5.4 (NOT the legacy F0–F7
 * finality states):
 *
 *   RECORD_RECEIVED                     — System received a record
 *   SOURCE_AUTHENTICATED                — Source identity was verified
 *   VALIDATION_PASSED                   — Record passed configured rules
 *   EXCEPTION_OPENED                    — A discrepancy was identified
 *   HUMAN_APPROVAL_RECORDED             — An authorised person approved
 *   PROVIDER_ACKNOWLEDGEMENT_RECEIVED   — A provider acknowledged receipt
 *   SETTLEMENT_CONFIRMATION_RECEIVED    — A settlement confirmation arrived
 *   RECONCILIATION_COMPLETED            — Records from multiple sources match
 *   EVIDENCE_CONFLICT_DETECTED          — Sources disagree
 *   DISPUTE_OPENED                      — A formal dispute was raised
 *
 * Critical rule (§5.4): a SETTLEMENT_CONFIRMATION_RECEIVED event means the
 * system received a confirmation — it does NOT rename the case to "final"
 * unless the relevant system rules, source authority, and legal analysis
 * justify that wording.
 */

import { asc, eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { evidenceEvents, validationCases } from "@/db/schema";
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
    // Verify the case exists first — return 404 if not.
    const caseRow = await db
      .select({ id: validationCases.id, status: validationCases.status })
      .from(validationCases)
      .where(eq(validationCases.id, id))
      .limit(1);

    if (caseRow.length === 0) {
      return errorResponse(404, "NOT_FOUND", `Validation case ${id} not found.`);
    }

    // Pull the timeline — ordered chronologically (oldest first) so the
    // caller can render the chain of custody in order.
    const events = await db
      .select()
      .from(evidenceEvents)
      .where(eq(evidenceEvents.validationCaseId, id))
      .orderBy(asc(evidenceEvents.timestamp));

    return okResponse({
      caseId: id,
      caseStatus: caseRow[0]?.status ?? "UNKNOWN",
      eventCount: events.length,
      events,
      // Honest re-statement of §5.4 — receipt of evidence does NOT prove
      // legal settlement finality.
      note:
        "A SETTLEMENT_CONFIRMATION_RECEIVED event means the system received a " +
        "confirmation from the identified source. It does not rename the " +
        "case to 'final' unless the relevant system rules, source authority, " +
        "and legal analysis justify that wording.",
    });
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "validation-case/timeline query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
