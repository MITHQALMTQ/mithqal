/**
 * GET /api/v1/validation-cases/[id] — MITHQAL MASTER BLUEPRINT §16.1.
 *
 * Read validation result/status by ID. Returns the validation_case row
 * with its source_snapshots, evidence_events, exceptions, policy_decisions,
 * and reconciliation_cases attached via Drizzle's relations API.
 *
 * Truth state: WIRED. Returns 404 NOT_FOUND when the row is absent.
 * This endpoint never initiates a payment — it is read-only.
 */

import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { validationCases } from "@/db/schema";
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
    // Use Drizzle's query API to fetch the case with related aggregates.
    // The relations are declared in schema.ts.
    const row = await db.query.validationCases.findFirst({
      where: eq(validationCases.id, id),
      with: {
        sourceSnapshots: true,
        evidenceEvents: true,
        exceptions: true,
        policyDecisions: true,
        reconciliationCases: true,
      },
    });

    if (!row) {
      return errorResponse(404, "NOT_FOUND", `Validation case ${id} not found.`);
    }

    return okResponse({
      ...row,
      // Explicit re-statement: reading a case does NOT authorise payment.
      paymentInitiated: false,
      truthState: "VERIFIED",
      scope: "read-only result retrieval",
    });
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "validation-case/detail query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
