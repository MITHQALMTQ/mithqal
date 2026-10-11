/**
 * Drizzle Kit configuration — MITHQAL-TECH-SPEC-001 §8.
 *
 * `drizzle-kit generate` produces SQL migration files in `src/db/migrations`.
 * `drizzle-kit push` applies schema to the live Neon database (requires
 * DATABASE_URL). `drizzle-kit studio` opens the local GUI.
 *
 * Truth state: WIRED. Operators run `bun run db:push` to provision the
 * schema against Neon before submitting the first instruction. Until
 * then, /api/v1/* routes return DB_NOT_PROVISIONED on writes.
 */

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/mithqal",
  },
  verbose: true,
  strict: true,
});
