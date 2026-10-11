/**
 * MITHQAL DB error envelope — distinct from the API error envelope so
 * route handlers can translate them with a single switch.
 *
 * The Drizzle client at `src/db/index.ts` returns `db = null` when
 * DATABASE_URL is unset. Route handlers should call `requireDb()` and
 * catch the resulting DbError, then translate it via `dbErrorResponse`.
 */

export type DbErrorCode =
  | "DB_NOT_PROVISIONED"
  | "DB_TRANSACTION_FAILED"
  | "DB_QUERY_FAILED"
  | "DB_NOT_FOUND";

export class DbError extends Error {
  code: DbErrorCode;

  constructor(code: DbErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "DbError";
  }
}
