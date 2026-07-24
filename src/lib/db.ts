import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __schemaInitialized?: boolean
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * Ensure the PostgreSQL schema exists. On serverless platforms (Vercel),
 * the Neon Postgres database persists across cold starts. This creates
 * the tables if they don't exist, matching the Prisma schema.
 * Idempotent — safe to call on every cold start.
 */
export async function ensureSchema(): Promise<void> {
  if (globalForPrisma.__schemaInitialized) return
  globalForPrisma.__schemaInitialized = true

  // PostgreSQL schema creation (replaces the SQLite DDL from the ephemeral version).
  // Uses IF NOT EXISTS so it's idempotent — safe on every cold start.
  const statements = [
    `CREATE TABLE IF NOT EXISTS "FormationInterest" ("id" TEXT PRIMARY KEY NOT NULL, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "org" TEXT, "role" TEXT NOT NULL, "message" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_role_idx" ON "FormationInterest"("role")`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_createdAt_idx" ON "FormationInterest"("createdAt")`,
    `CREATE TABLE IF NOT EXISTS "TestnetOperation" ("id" TEXT PRIMARY KEY NOT NULL, "type" TEXT NOT NULL, "amountUsd" DOUBLE PRECISION NOT NULL, "mtq" DOUBLE PRECISION NOT NULL, "participant" TEXT NOT NULL, "nav" DOUBLE PRECISION NOT NULL, "reserveRatio" DOUBLE PRECISION NOT NULL, "porHash" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_createdAt_idx" ON "TestnetOperation"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_type_idx" ON "TestnetOperation"("type")`,
  ]

  try {
    for (const sql of statements) {
      await db.$executeRawUnsafe(sql)
    }
  } catch (err) {
    console.error('[db] schema initialization failed:', err)
    globalForPrisma.__schemaInitialized = false
  }
}
