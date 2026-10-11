/**
 * MITHQAL — Drizzle database client (MITHQAL-TECH-SPEC-001 §4.1)
 *
 * Neon serverless Postgres + Drizzle ORM. The Drizzle client wraps the
 * `neon()` SQL tagged-template function from `@neondatabase/serverless`
 * and exposes the typed schema declared in `./schema.ts`.
 *
 * Truth state: DESIGN-STAGE. The DATABASE_URL env var is set, but the
 * schema migrations have NOT been applied to production (production-
 * Authorized = false). All inserts are MTQ-disabled by `mtq-gate.ts`.
 *
 * Connection:
 *   DATABASE_URL=postgresql://...?sslmode=require
 *
 * The driver is HTTP-based (no persistent connection), which means it
 * is safe to use from serverless / edge runtimes (Vercel functions).
 */

import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // In build / static-render contexts the env var may be absent — log
  // a clear error so operators know to set it before running migrations
  // or hitting any /api/v1/* route that touches the DB. We do NOT throw
  // here so `next build` succeeds without a configured DB.
  console.warn(
    "[mithqal/db] DATABASE_URL is not set — DB-dependent routes will return 500. " +
      "Set DATABASE_URL in .env (see RESTORE-ENV.md).",
  );
}

/**
 * The raw Neon SQL tagged-template function. Exported so legacy v26.0
 * modules that still use `sql\`...\`` directly can share the connection.
 */
export const sql = databaseUrl ? neon(databaseUrl) : null;

/**
 * The Drizzle client. Typed against `schema.ts`. Null when DATABASE_URL
 * is missing so callers can short-circuit with a clear error rather than
 * crash the process at import time.
 */
export const db: NeonHttpDatabase<typeof schema> | null = sql ? drizzle(sql, { schema }) : null;

/**
 * Helper: assert the DB is available before an API route handler proceeds.
 * Throws a typed Error that the route can translate into a 500 response.
 */
export function requireDb(): NeonHttpDatabase<typeof schema> {
  if (!db) {
    throw new Error("[mithqal/db] Database client is not initialised — set DATABASE_URL.");
  }
  return db;
}

export { schema };
