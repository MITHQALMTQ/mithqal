/**
 * GET /api/v1/policies — MITHQAL MASTER BLUEPRINT §16.1.
 *
 * Read policy versions. Returns policy_versions rows, newest first.
 * Per §5.2.B, validation uses versioned schemas and deterministic business
 * rules — callers must pin a policy_version when validating or replaying.
 *
 * Truth state: WIRED. Read-only. The active policy version is sourced
 * from `src/lib/mtq-gate.ts` (POLICY_VERSION) and matches the row stored
 * in policy_versions by content_digest.
 */

import { desc } from "drizzle-orm";
import { type NextRequest } from "next/server";

import { requireDb } from "@/db";
import { policyVersions } from "@/db/schema";
import { authenticateRequest } from "@/lib/api-auth";
import { dbErrorResponse, errorResponse, okResponse } from "@/lib/api-response";
import { DbError } from "@/lib/db-errors";
import { logger } from "@/lib/logger";
import { POLICY_VERSION } from "@/lib/mtq-gate";

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
      .from(policyVersions)
      .orderBy(desc(policyVersions.effectiveFrom))
      .limit(safeLimit);

    return okResponse({
      activePolicyVersion: POLICY_VERSION,
      versions: rows,
      count: rows.length,
      note:
        "Validation must pin a policy_version. Replay always uses the historical " +
        "version that was active at decision time — current rules are never " +
        "silently substituted for historical ones (§5.2.F).",
    });
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "policies/list query failed",
    );
    return dbErrorResponse(
      new DbError("DB_QUERY_FAILED", err instanceof Error ? err.message : "Unknown query failure"),
    );
  }
}
