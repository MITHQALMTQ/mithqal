/**
 * MITHQAL API response helpers — §4.2 (standardised error envelope).
 *
 * Every /api/v1/* route returns either:
 *   - the raw resource on success (200), or
 *   - an envelope `{ error: { code, message } }` on failure.
 *
 * Truth state: WIRED. These helpers are the single source of truth for
 * the error envelope — callers do NOT construct ad-hoc error shapes.
 */

import { NextResponse } from "next/server";

import type { DbError } from "@/lib/db-errors";

export interface ApiError {
  code: string;
  message?: string;
}

/**
 * Standard error response. Status codes follow the spec §4.2.1:
 *   400 — INVALID_SCHEMA / MISSING_IDEMPOTENCY_KEY / BAD_REQUEST
 *   401 — UNAUTHORIZED
 *   403 — FORBIDDEN (RBAC)
 *   404 — NOT_FOUND
 *   409 — CONFLICT (e.g. duplicate idempotency key)
 *   500 — INTERNAL_ERROR / DB_NOT_PROVISIONED
 */
export function errorResponse(
  status: number,
  code: string,
  message?: string,
  extras?: Record<string, unknown>,
): NextResponse {
  const body: { error: ApiError; [k: string]: unknown } = {
    error: { code, message },
    ...extras,
  };
  return NextResponse.json(body, { status });
}

/**
 * Success response — returns the raw payload with status 200 by default.
 */
export function okResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Translate a DbError (raised by the Drizzle client wrapper) into the
 * standard API error envelope.
 */
export function dbErrorResponse(err: DbError): NextResponse {
  switch (err.code) {
    case "DB_NOT_PROVISIONED":
      return errorResponse(
        500,
        "DB_NOT_PROVISIONED",
        "Database client is not initialised — set DATABASE_URL and run `drizzle-kit push`.",
      );
    case "DB_TRANSACTION_FAILED":
      return errorResponse(500, "DB_TRANSACTION_FAILED", err.message);
    case "DB_QUERY_FAILED":
      return errorResponse(500, "DB_QUERY_FAILED", err.message);
    default:
      return errorResponse(500, "INTERNAL_ERROR", err.message);
  }
}
