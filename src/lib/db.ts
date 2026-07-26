import { createClient, type Client } from '@libsql/client'

/**
 * Mithqal database client — Turso (libsql) persistent storage.
 *
 * Uses @libsql/client directly (bypassing Prisma) for maximum reliability.
 * Turso provides a persistent, replicated SQLite database that survives
 * Vercel cold starts — this was the #1 remaining blocker for production.
 *
 * Connection:
 *   DATABASE_URL=libsql://mithqal-db-fortleem.aws-us-east-1.turso.io
 *   DATABASE_AUTH_TOKEN=<turso-token>
 *
 * For local dev, DATABASE_URL can be file:./db/custom.db (no auth token needed).
 */

const globalForDb = globalThis as unknown as {
  __libsqlClient?: Client
  __schemaInitialized?: boolean
}

function createDbClient(): Client {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "file:./db/custom.db"

  const authToken = process.env.DATABASE_AUTH_TOKEN

  // For libsql:// URLs (Turso), use the auth token.
  // For file: URLs (local dev), no auth token needed.
  const client = createClient({
    url,
    authToken: url.startsWith("file:") ? undefined : authToken,
  })

  if (process.env.NODE_ENV !== 'production') {
    console.log('[db] Connected to:', url.startsWith("file:") ? url : url.substring(0, 50) + '...')
  }

  return client
}

const _rawClient = globalForDb.__libsqlClient ?? createDbClient()
if (process.env.NODE_ENV !== 'production') globalForDb.__libsqlClient = _rawClient

/* ---- Types (matching the Prisma schema) ---- */

export interface FormationInterest {
  id: string
  fullName: string
  email: string
  org: string | null
  role: string
  message: string | null
  createdAt: Date
}

export interface TestnetOperation {
  id: string
  type: string
  amountUsd: number
  mtq: number
  participant: string
  nav: number
  reserveRatio: number
  porHash: string
  createdAt: Date
}

/* ---- Schema initialization ---- */

export async function ensureSchema(): Promise<void> {
  if (globalForDb.__schemaInitialized) return
  globalForDb.__schemaInitialized = true

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
      await _rawClient.execute(sql)
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[db] Schema initialized OK')
    }
  } catch (err) {
    console.error('[db] schema initialization failed:', err)
    globalForDb.__schemaInitialized = false
    throw err
  }
}

/* ---- FormationInterest queries ---- */

function generateId(): string {
  // CUID-compatible ID (timestamp + random)
  return 'c' + Date.now().toString(36) + Math.random().toString(36).substring(2, 12)
}

export const formationInterest = {
  async create(args: {
    data: {
      fullName: string
      email: string
      org?: string | null
      role: string
      message?: string | null
    }
    select?: { id?: boolean; createdAt?: boolean }
  }): Promise<{ id: string; createdAt: Date }> {
    await ensureSchema()
    const id = generateId()
    await _rawClient.execute({
      sql: `INSERT INTO "FormationInterest" ("id","fullName","email","org","role","message","createdAt") VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
      args: [id, args.data.fullName, args.data.email, args.data.org ?? null, args.data.role, args.data.message ?? null],
    })
    // Read back the createdAt
    const result = await _rawClient.execute({
      sql: `SELECT "createdAt" FROM "FormationInterest" WHERE "id" = ?`,
      args: [id],
    })
    const createdAtStr = result.rows[0]?.createdAt as string
    return { id, createdAt: new Date(createdAtStr) }
  },

  async findMany(args: {
    where?: { role?: string }
    orderBy?: { createdAt?: "asc" | "desc" }
    take?: number
  }): Promise<FormationInterest[]> {
    await ensureSchema()
    const order = args.orderBy?.createdAt === "desc" ? "DESC" : "ASC"
    const limit = args.take ?? 500

    let sql = `SELECT * FROM "FormationInterest"`
    const sqlArgs: (string | number)[] = []
    if (args.where?.role) {
      sql += ` WHERE "role" = ?`
      sqlArgs.push(args.where.role)
    }
    sql += ` ORDER BY "createdAt" ${order} LIMIT ?`
    sqlArgs.push(limit)

    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return result.rows.map(rowToFormationInterest)
  },

  async count(args?: { where?: { role?: string } }): Promise<number> {
    await ensureSchema()
    let sql = `SELECT COUNT(*) as c FROM "FormationInterest"`
    const sqlArgs: (string | number)[] = []
    if (args?.where?.role) {
      sql += ` WHERE "role" = ?`
      sqlArgs.push(args.where.role)
    }
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return Number(result.rows[0]?.c ?? 0)
  },

  async groupBy(args: {
    by: ["role"]
    _count: { _all: boolean }
  }): Promise<{ role: string; _count: { _all: number } }[]> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT "role", COUNT(*) as c FROM "FormationInterest" GROUP BY "role"`,
      args: [],
    })
    return result.rows.map((row) => ({
      role: row.role as string,
      _count: { _all: Number(row.c) },
    }))
  },
}

/* ---- TestnetOperation queries ---- */

export const testnetOperation = {
  async create(args: {
    data: Omit<TestnetOperation, "id" | "createdAt">
  }): Promise<TestnetOperation> {
    await ensureSchema()
    const id = generateId()
    await _rawClient.execute({
      sql: `INSERT INTO "TestnetOperation" ("id","type","amountUsd","mtq","participant","nav","reserveRatio","porHash","createdAt") VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`,
      args: [id, args.data.type, args.data.amountUsd, args.data.mtq, args.data.participant, args.data.nav, args.data.reserveRatio, args.data.porHash],
    })
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "TestnetOperation" WHERE "id" = ?`,
      args: [id],
    })
    return rowToTestnetOperation(result.rows[0])
  },

  async findMany(args: {
    orderBy?: { createdAt?: "asc" | "desc" }
    take?: number
    skip?: number
  }): Promise<TestnetOperation[]> {
    await ensureSchema()
    const order = args.orderBy?.createdAt === "desc" ? "DESC" : "ASC"
    const limit = args.take ?? 500
    const offset = args.skip ?? 0

    const result = await _rawClient.execute({
      sql: `SELECT * FROM "TestnetOperation" ORDER BY "createdAt" ${order} LIMIT ? OFFSET ?`,
      args: [limit, offset],
    })
    return result.rows.map(rowToTestnetOperation)
  },

  async count(): Promise<number> {
    await ensureSchema()
    const result = await _rawClient.execute({ sql: `SELECT COUNT(*) as c FROM "TestnetOperation"`, args: [] })
    return Number(result.rows[0]?.c ?? 0)
  },

  async deleteMany(args?: { where?: { type?: string } }): Promise<{ count: number }> {
    await ensureSchema()
    if (args?.where?.type) {
      const result = await _rawClient.execute({ sql: `DELETE FROM "TestnetOperation" WHERE "type" = ?`, args: [args.where.type] })
      return { count: result.rowsAffected ?? 0 }
    }
    const result = await _rawClient.execute({ sql: `DELETE FROM "TestnetOperation"`, args: [] })
    return { count: result.rowsAffected ?? 0 }
  },
}

/* ---- Row mappers ---- */

function rowToFormationInterest(row: Record<string, unknown>): FormationInterest {
  return {
    id: row.id as string,
    fullName: row.fullName as string,
    email: row.email as string,
    org: (row.org as string) ?? null,
    role: row.role as string,
    message: (row.message as string) ?? null,
    createdAt: new Date(row.createdAt as string),
  }
}

function rowToTestnetOperation(row: Record<string, unknown>): TestnetOperation {
  return {
    id: row.id as string,
    type: row.type as string,
    amountUsd: Number(row.amountUsd),
    mtq: Number(row.mtq),
    participant: row.participant as string,
    nav: Number(row.nav),
    reserveRatio: Number(row.reserveRatio),
    porHash: row.porHash as string,
    createdAt: new Date(row.createdAt as string),
  }
}

/* ---- Transaction support (for atomic operations) ---- */

export async function transaction<T>(
  fn: (tx: Client) => Promise<T>
): Promise<T> {
  await ensureSchema()
  const tx = await _rawClient.transaction()
  try {
    const result = await fn(tx)
    await tx.commit()
    return result
  } catch (err) {
    await tx.rollback()
    throw err
  }
}

/* ---- Compatibility wrapper ----
 * Existing code uses `db.formationInterest.create()` / `db.testnetOperation.findMany()`.
 * This wrapper provides that interface so no route files need to change.
 */
export const db = {
  formationInterest,
  testnetOperation,
  $executeRawUnsafe: async (sql: string) => {
    await ensureSchema()
    return _rawClient.execute(sql)
  },
  $disconnect: async () => {
    await _rawClient.close()
  },
}

// Alias for the raw client (used internally by the compatibility wrapper)
// _rawClient already initialized above

/* ---- Disconnect (for tests / cleanup) ---- */

export async function disconnect(): Promise<void> {
  await _rawClient.close()
  if (globalForDb.__libsqlClient) {
    globalForDb.__libsqlClient = undefined
    globalForDb.__schemaInitialized = false
  }
}
