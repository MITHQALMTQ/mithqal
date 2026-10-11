/**
 * GET /api/v1/instructions/[id] — MITHQAL-TECH-SPEC-001 §4.2.2.
 *
 * Returns instruction + related evidence + exceptions + policyDecisions
 * via Drizzle's `with` (relations) API.
 *
 * Truth state: WIRED. Returns 404 NOT_FOUND when the row is absent.
 */

import { eq } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { instructions } from "@/db/schema";
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
    return errorResponse(400, "MISSING_PATH_PARAM", "Instruction id is required.");
  }

  const db = requireDb();
  try {
    const instruction = await db.query.instructions.findFirst({
      where: eq(instructions.id, id),
      with: {
        evidence: true,
        exceptions: true,
        policyDecisions: true,
      },
    });

    if (!instruction) {
      return errorResponse(404, "NOT_FOUND", `Instruction ${id} not found.`);
    }

    return okResponse(instruction);
  } catch (err) {
    logger.error(
      { id, err: err instanceof Error ? err.message : String(err) },
      "instruction/detail query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
