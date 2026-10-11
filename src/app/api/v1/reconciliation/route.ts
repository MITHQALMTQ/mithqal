/**
 * GET /api/v1/reconciliation — MITHQAL-TECH-SPEC-001 §3.4 (reconciliation).
 *
 * List reconciliation cases. Newest first, ?limit cap.
 *
 * Truth state: WIRED. Cases are normally created by the Inngest
 * `reconciliation-runner` workflow (Phase 3); this route is read-only.
 */

import { desc } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { reconciliationCases } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.valid) {
    return errorResponse(401, "UNAUTHORIZED", auth.message);
  }

  const url = new URL(request.url);
  const limit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? limit : 50;

  const db = requireDb();
  try {
    const rows = await db
      .select()
      .from(reconciliationCases)
      .orderBy(desc(reconciliationCases.createdAt))
      .limit(safeLimit);

    return okResponse(rows);
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "reconciliation/list query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
