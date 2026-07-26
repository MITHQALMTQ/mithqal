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

/* ---- Operating System tables (Phase 1 — per COO/CTO directive) ---- */

export interface User {
  id: number
  address: string  // wallet address (lowercase, checksummed upstream)
  email: string | null
  registeredAt: number  // unixepoch
}

export interface Transaction {
  id: number
  txHash: string
  type: 'mint' | 'redeem' | 'transfer'
  fromAddress: string
  toAddress: string | null
  amount: string  // wei string (BigDecimal-safe)
  fee: string | null  // wei string
  blockNumber: number | null
  timestamp: number  // unixepoch
}

export interface Reserve {
  id: number
  assetType: 'gold' | 'silver' | 'usdc' | 'usdt' | 'dai' | 'cash' | 'sovereign'
  amount: string  // quantity (oz for gold/silver, units for stablecoins)
  valueUsd: string  // USD value (8 decimals)
  timestamp: number
}

export interface Fee {
  id: number
  txHash: string
  feeType: 'mint' | 'redeem' | 'transfer' | 'custody'
  amount: string  // USD (8 decimals)
  collectedAt: number
}

export interface Proposal {
  id: number
  proposalId: number  // on-chain proposal ID
  title: string | null
  description: string | null
  status: string  // 'pending' | 'active' | 'executed' | 'defeated'
  createdAt: number | null
}

/* ---- Schema initialization ---- */

export async function ensureSchema(): Promise<void> {
  if (globalForDb.__schemaInitialized) return
  globalForDb.__schemaInitialized = true

  const statements = [
    // Legacy tables (Formation Committee + Testnet simulator)
    `CREATE TABLE IF NOT EXISTS "FormationInterest" ("id" TEXT PRIMARY KEY NOT NULL, "fullName" TEXT NOT NULL, "email" TEXT NOT NULL, "org" TEXT, "role" TEXT NOT NULL, "message" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_role_idx" ON "FormationInterest"("role")`,
    `CREATE INDEX IF NOT EXISTS "FormationInterest_createdAt_idx" ON "FormationInterest"("createdAt")`,
    `CREATE TABLE IF NOT EXISTS "TestnetOperation" ("id" TEXT PRIMARY KEY NOT NULL, "type" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "mtq" REAL NOT NULL, "participant" TEXT NOT NULL, "nav" REAL NOT NULL, "reserveRatio" REAL NOT NULL, "porHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_createdAt_idx" ON "TestnetOperation"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "TestnetOperation_type_idx" ON "TestnetOperation"("type")`,

    // Operating System tables (Phase 1)
    `CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "address" TEXT UNIQUE NOT NULL, "email" TEXT, "registered_at" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "users_address_idx" ON "users"("address")`,

    `CREATE TABLE IF NOT EXISTS "transactions" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "tx_hash" TEXT UNIQUE NOT NULL, "type" TEXT NOT NULL, "from_address" TEXT NOT NULL, "to_address" TEXT, "amount" TEXT NOT NULL, "fee" TEXT, "block_number" INTEGER, "timestamp" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "transactions_tx_hash_idx" ON "transactions"("tx_hash")`,
    `CREATE INDEX IF NOT EXISTS "transactions_type_idx" ON "transactions"("type")`,
    `CREATE INDEX IF NOT EXISTS "transactions_from_address_idx" ON "transactions"("from_address")`,
    `CREATE INDEX IF NOT EXISTS "transactions_timestamp_idx" ON "transactions"("timestamp")`,

    `CREATE TABLE IF NOT EXISTS "reserves" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "asset_type" TEXT NOT NULL, "amount" TEXT NOT NULL, "value_usd" TEXT NOT NULL, "timestamp" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "reserves_asset_type_idx" ON "reserves"("asset_type")`,
    `CREATE INDEX IF NOT EXISTS "reserves_timestamp_idx" ON "reserves"("timestamp")`,

    `CREATE TABLE IF NOT EXISTS "fees" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "tx_hash" TEXT NOT NULL, "fee_type" TEXT NOT NULL, "amount" TEXT NOT NULL, "collected_at" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "fees_tx_hash_idx" ON "fees"("tx_hash")`,
    `CREATE INDEX IF NOT EXISTS "fees_fee_type_idx" ON "fees"("fee_type")`,
    `CREATE INDEX IF NOT EXISTS "fees_collected_at_idx" ON "fees"("collected_at")`,

    `CREATE TABLE IF NOT EXISTS "proposals" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "proposal_id" INTEGER NOT NULL, "title" TEXT, "description" TEXT, "status" TEXT, "created_at" INTEGER)`,
    `CREATE INDEX IF NOT EXISTS "proposals_proposal_id_idx" ON "proposals"("proposal_id")`,
    `CREATE INDEX IF NOT EXISTS "proposals_status_idx" ON "proposals"("status")`,
  ]

  try {
    for (const sql of statements) {
      await _rawClient.execute(sql)
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[db] Schema initialized OK (incl. OS tables: users, transactions, reserves, fees, proposals)')
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

/* ---- Operating System table queries ---- */

export const users = {
  async upsert(address: string, email?: string | null): Promise<User> {
    await ensureSchema()
    const addr = address.toLowerCase()
    // Insert if not exists
    await _rawClient.execute({
      sql: `INSERT INTO "users" ("address", "email") VALUES (?, ?) ON CONFLICT("address") DO NOTHING`,
      args: [addr, email ?? null],
    })
    // Update email if provided and user exists
    if (email) {
      await _rawClient.execute({
        sql: `UPDATE "users" SET "email" = ? WHERE "address" = ? AND "email" IS NULL`,
        args: [email, addr],
      })
    }
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "users" WHERE "address" = ?`,
      args: [addr],
    })
    return rowToUser(result.rows[0])
  },

  async findByAddress(address: string): Promise<User | null> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "users" WHERE "address" = ?`,
      args: [address.toLowerCase()],
    })
    return result.rows[0] ? rowToUser(result.rows[0]) : null
  },

  async count(): Promise<number> {
    await ensureSchema()
    const result = await _rawClient.execute({ sql: `SELECT COUNT(*) as c FROM "users"`, args: [] })
    return Number(result.rows[0]?.c ?? 0)
  },
}

export const transactions = {
  async create(args: {
    data: {
      txHash: string
      type: 'mint' | 'redeem' | 'transfer'
      fromAddress: string
      toAddress?: string | null
      amount: string  // wei string
      fee?: string | null  // wei string
      blockNumber?: number | null
    }
  }): Promise<Transaction> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "transactions" ("tx_hash","type","from_address","to_address","amount","fee","block_number") VALUES (?,?,?,?,?,?,?) RETURNING *`,
      args: [
        args.data.txHash,
        args.data.type,
        args.data.fromAddress.toLowerCase(),
        args.data.toAddress?.toLowerCase() ?? null,
        args.data.amount,
        args.data.fee ?? null,
        args.data.blockNumber ?? null,
      ],
    })
    return rowToTransaction(result.rows[0])
  },

  async findMany(args: {
    where?: { type?: string; fromAddress?: string }
    orderBy?: { timestamp?: "asc" | "desc" }
    take?: number
  }): Promise<Transaction[]> {
    await ensureSchema()
    const order = args.orderBy?.timestamp === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 50
    const conditions: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.where?.type) {
      conditions.push(`"type" = ?`)
      sqlArgs.push(args.where.type)
    }
    if (args.where?.fromAddress) {
      conditions.push(`"from_address" = ?`)
      sqlArgs.push(args.where.fromAddress.toLowerCase())
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "transactions" ${where} ORDER BY "timestamp" ${order} LIMIT ?`,
      args: [...sqlArgs, limit],
    })
    return result.rows.map(rowToTransaction)
  },

  async count(): Promise<number> {
    await ensureSchema()
    const result = await _rawClient.execute({ sql: `SELECT COUNT(*) as c FROM "transactions"`, args: [] })
    return Number(result.rows[0]?.c ?? 0)
  },
}

export const reserves = {
  async create(args: {
    data: {
      assetType: string
      amount: string
      valueUsd: string
    }
  }): Promise<Reserve> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "reserves" ("asset_type","amount","value_usd") VALUES (?,?,?) RETURNING *`,
      args: [args.data.assetType, args.data.amount, args.data.valueUsd],
    })
    return rowToReserve(result.rows[0])
  },

  async latest(): Promise<Reserve[]> {
    await ensureSchema()
    // Get the most recent snapshot per asset_type
    const result = await _rawClient.execute({
      sql: `SELECT r.* FROM "reserves" r INNER JOIN (
        SELECT "asset_type", MAX("timestamp") as max_ts FROM "reserves" GROUP BY "asset_type"
      ) latest ON r."asset_type" = latest."asset_type" AND r."timestamp" = latest.max_ts ORDER BY r."asset_type"`,
      args: [],
    })
    return result.rows.map(rowToReserve)
  },

  async history(assetType?: string, take = 100): Promise<Reserve[]> {
    await ensureSchema()
    const sql = assetType
      ? `SELECT * FROM "reserves" WHERE "asset_type" = ? ORDER BY "timestamp" DESC LIMIT ?`
      : `SELECT * FROM "reserves" ORDER BY "timestamp" DESC LIMIT ?`
    const args = assetType ? [assetType, take] : [take]
    const result = await _rawClient.execute({ sql, args })
    return result.rows.map(rowToReserve)
  },
}

export const fees = {
  async create(args: {
    data: {
      txHash: string
      feeType: 'mint' | 'redeem' | 'transfer' | 'custody'
      amount: string  // USD (8 decimals)
    }
  }): Promise<Fee> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "fees" ("tx_hash","fee_type","amount") VALUES (?,?,?) RETURNING *`,
      args: [args.data.txHash, args.data.feeType, args.data.amount],
    })
    return rowToFee(result.rows[0])
  },

  async findMany(args: {
    where?: { feeType?: string }
    orderBy?: { collectedAt?: "asc" | "desc" }
    take?: number
  }): Promise<Fee[]> {
    await ensureSchema()
    const order = args.orderBy?.collectedAt === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 50
    let sql = `SELECT * FROM "fees"`
    const sqlArgs: (string | number)[] = []
    if (args.where?.feeType) {
      sql += ` WHERE "fee_type" = ?`
      sqlArgs.push(args.where.feeType)
    }
    sql += ` ORDER BY "collected_at" ${order} LIMIT ?`
    sqlArgs.push(limit)
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return result.rows.map(rowToFee)
  },

  async total(): Promise<{ feeType: string; totalUsd: number; count: number }[]> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT "fee_type", SUM(CAST("amount" AS REAL)) as total, COUNT(*) as count FROM "fees" GROUP BY "fee_type"`,
      args: [],
    })
    return result.rows.map((row) => ({
      feeType: row.fee_type as string,
      totalUsd: Number(row.total) / 1e8, // amount is stored as 8-decimal USD
      count: Number(row.count),
    }))
  },
}

export const proposals = {
  async upsert(args: {
    data: {
      proposalId: number
      title?: string | null
      description?: string | null
      status?: string | null
      createdAt?: number | null
    }
  }): Promise<Proposal> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "proposals" ("proposal_id","title","description","status","created_at")
            VALUES (?,?,?,?,?)
            ON CONFLICT("proposal_id") DO UPDATE SET
              "title" = COALESCE(excluded."title", "proposals"."title"),
              "description" = COALESCE(excluded."description", "proposals"."description"),
              "status" = COALESCE(excluded."status", "proposals"."status")
            RETURNING *`,
      args: [
        args.data.proposalId,
        args.data.title ?? null,
        args.data.description ?? null,
        args.data.status ?? null,
        args.data.createdAt ?? Math.floor(Date.now() / 1000),
      ],
    })
    return rowToProposal(result.rows[0])
  },

  async findMany(args: { where?: { status?: string }; take?: number } = {}): Promise<Proposal[]> {
    await ensureSchema()
    const limit = args.take ?? 50
    let sql = `SELECT * FROM "proposals"`
    const sqlArgs: (string | number)[] = []
    if (args.where?.status) {
      sql += ` WHERE "status" = ?`
      sqlArgs.push(args.where.status)
    }
    sql += ` ORDER BY "proposal_id" DESC LIMIT ?`
    sqlArgs.push(limit)
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return result.rows.map(rowToProposal)
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

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    address: row.address as string,
    email: (row.email as string) ?? null,
    registeredAt: Number(row.registered_at ?? row.registeredAt ?? 0),
  }
}

function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: Number(row.id),
    txHash: (row.tx_hash ?? row.txHash) as string,
    type: row.type as Transaction['type'],
    fromAddress: (row.from_address ?? row.fromAddress) as string,
    toAddress: (row.to_address ?? row.toAddress ?? null) as string | null,
    amount: row.amount as string,
    fee: (row.fee ?? null) as string | null,
    blockNumber: row.block_number != null ? Number(row.block_number) : null,
    timestamp: Number(row.timestamp ?? 0),
  }
}

function rowToReserve(row: Record<string, unknown>): Reserve {
  return {
    id: Number(row.id),
    assetType: (row.asset_type ?? row.assetType) as Reserve['assetType'],
    amount: row.amount as string,
    valueUsd: (row.value_usd ?? row.valueUsd) as string,
    timestamp: Number(row.timestamp ?? 0),
  }
}

function rowToFee(row: Record<string, unknown>): Fee {
  return {
    id: Number(row.id),
    txHash: (row.tx_hash ?? row.txHash) as string,
    feeType: (row.fee_type ?? row.feeType) as Fee['feeType'],
    amount: row.amount as string,
    collectedAt: Number(row.collected_at ?? row.collectedAt ?? 0),
  }
}

function rowToProposal(row: Record<string, unknown>): Proposal {
  return {
    id: Number(row.id),
    proposalId: Number(row.proposal_id ?? row.proposalId),
    title: (row.title ?? null) as string | null,
    description: (row.description ?? null) as string | null,
    status: (row.status ?? null) as string | null,
    createdAt: row.created_at != null ? Number(row.created_at) : (row.createdAt != null ? Number(row.createdAt) : null),
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
  // Operating System tables
  users,
  transactions,
  reserves,
  fees,
  proposals,
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
