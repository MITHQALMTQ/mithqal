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
 * Ensure the SQLite schema exists. On serverless platforms (Vercel) with an
 * ephemeral filesystem, the DB file is created fresh on each cold start.
 * This creates the tables if they don't exist, matching the Prisma schema.
 * Idempotent — safe to call on every cold start.
 */
export async function ensureSchema(): Promise<void> {
  if (globalForPrisma.__schemaInitialized) return
  globalForPrisma.__schemaInitialized = true

  const statements = [
    `CREATE TABLE IF NOT EXISTS "FormationInterest" ("id" TEXT PRIMARY KEY NOT NULL, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "org" TEXT, "role" TEXT NOT NULL, "message" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_role_idx" ON "FormationInterest"("role")`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_createdAt_idx" ON "FormationInterest"("createdAt")`,
    `CREATE TABLE IF NOT EXISTS "TestnetOperation" ("id" TEXT PRIMARY KEY NOT NULL, "type" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "mtq" REAL NOT NULL, "participant" TEXT NOT NULL, "nav" REAL NOT NULL, "reserveRatio" REAL NOT NULL, "porHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_createdAt_idx" ON "TestnetOperation"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_type_idx" ON "TestnetOperation"("type")`,
  ]

  try {
    for (const sql of statements) {
      await db.$executeRawUnsafe(sql)
    }
  } catch (err) {
    // If the DB is read-only or unavailable, log but don't crash — the
    // public-facing views don't need the DB and should still render.
    console.error('[db] schema initialization failed:', err)
    globalForPrisma.__schemaInitialized = false
  }
}
