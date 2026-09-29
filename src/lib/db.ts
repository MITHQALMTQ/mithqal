import {
  createClient,
  type Client,
  type Transaction as LibsqlTransaction,
  type ResultSet,
  type InStatement,
  type InArgs,
  type Row,
  type Replicated,
  type TransactionMode,
} from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

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
 *
 * -------------------------------------------------------------------
 * NEON FALLBACK (per task AI-FALLBACK-INNGEST-NEON — WIRED by Task E2-B)
 * -------------------------------------------------------------------
 * Turso is the PRIMARY database. Neon (serverless Postgres) is available
 * as a MANUAL FALLBACK if Turso becomes unreachable (regional outage,
 * libsql protocol regression, or token expiry). The fallback IS NOW WIRED
 * (Task E2-B, release v25.6) — operators no longer need to hand-edit
 * `db.ts` to engage it.
 *
 * Engagement:
 *   1. Set NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
 *      in Vercel project env vars (see /NEON-SETUP.md §3–5).
 *   2. Set DATABASE_BACKEND=neon in the same env-var panel.
 *   3. Redeploy. `createDbClient()` detects the env var and returns a
 *      `NeonLibsqlAdapter` (defined below) that lazy-loads
 *      `@neondatabase/serverless` and wraps its `sql` tagged-template
 *      function in a thin shim exposing the libsql `Client` interface.
 *
 * The Neon driver is loaded LAZILY (via `await import()` inside the
 * adapter's first query call) so the default (Turso) cold-start path
 * stays lean — the Neon package is NOT bundled into the main path.
 *
 * Intentionally we do NOT change the default connection logic above.
 * Engaging the fallback is a deliberate operator action — never silent.
 * An active-failover warning is logged when the Neon branch is taken so
 * operators see the switch in their logs.
 */

const globalForDb = globalThis as unknown as {
  __libsqlClient?: Client
  __schemaInitialized?: boolean
  __neonBackend?: boolean
}

/* -------------------------------------------------------------------
 * Neon fallback adapter (Task E2-B / release v25.6 — see NEON-SETUP.md §6)
 * -------------------------------------------------------------------
 * Thin shim that implements the libsql `Client` interface but internally
 * calls @neondatabase/serverless's `sql` tagged-template function. Used
 * ONLY when `process.env.DATABASE_BACKEND === 'neon'` (the manual
 * fallback). The default (Turso) path is unchanged.
 *
 * Design notes:
 *
 *  - LAZY LOAD. The Neon driver is `await import()`-ed on the FIRST
 *    query, NOT at module load. The constructor kicks off the dynamic
 *    import as a side effect (so the file is fetched eagerly by the
 *    bundler only when DATABASE_BACKEND=neon), but the actual `sql`
 *    function is constructed lazily on first use. This keeps the
 *    cold-start path lean for the 99% case (Turso).
 *
 *  - STRUCTURAL TYPES. We declare a structural `NeonSqlFn` type instead
 *    of importing the real `@neondatabase/serverless` types at the top
 *    of the file, so the type layer does NOT pull the Neon driver into
 *    the bundle.
 *
 *  - PLACEHOLDER TRANSLATION. libsql uses `?` positional placeholders;
 *    Postgres uses `$1, $2, ...`. The adapter translates on the fly.
 *
 *  - RESULT-SHAPING. Neon (with `{ fullResults: true }`) returns
 *    `{ fields, rows, rowCount, command }`. We map this to libsql's
 *    `ResultSet` (`{ columns, columnTypes, rows, rowsAffected,
 *    lastInsertRowid }`) so the 50+ `_rawClient.execute(...)` call sites
 *    across the codebase work unchanged.
 *
 *  - INTERACTIVE TRANSACTIONS. Neon's HTTP serverless driver does NOT
 *    support interactive (multi-statement, mid-flight branching)
 *    transactions — only callback-style `sql.transaction([...])` or
 *    `sql.transaction(fn)`. The libsql `Transaction` interface IS
 *    interactive. The adapter runs queries eagerly on the underlying
 *    connection (without atomicity) and `rollback()` throws so the
 *    operator knows atomicity is unavailable on the fallback. The
 *    app's exported `transaction()` helper (the only caller of this
 *    method) is currently unused in production — see the helper below.
 */

type NeonSqlFn = {
  (strings: TemplateStringsArray, ...params: unknown[]): Promise<unknown>
  query: (
    queryWithPlaceholders: string,
    params?: unknown[],
    opts?: { fullResults?: boolean; arrayMode?: boolean }
  ) => Promise<NeonFullQueryResult>
  transaction: (
    queriesOrFn: unknown[] | ((sql: NeonSqlFn) => unknown[]),
    opts?: { fullResults?: boolean; arrayMode?: boolean }
  ) => Promise<NeonFullQueryResult[] | unknown[]>
  unsafe: (rawSQL: string) => unknown
}

interface NeonFieldDef {
  name: string
  dataTypeID?: number
}

interface NeonFullQueryResult {
  fields?: NeonFieldDef[]
  command?: string
  rowCount?: number
  rows?: Record<string, unknown>[]
  rowAsArray?: boolean
}

class NeonLibsqlAdapter implements Client {
  closed = false
  protocol = 'http'
  private readonly connectionString: string
  private sqlPromise: Promise<NeonSqlFn> | null = null
  private sql: NeonSqlFn | null = null

  constructor(connectionString: string) {
    this.connectionString = connectionString
    // Kick off the lazy import as a side effect — does NOT block the
    // constructor return. The first query call awaits the promise.
    this.sqlPromise = this.loadDriver()
  }

  private async loadDriver(): Promise<NeonSqlFn> {
    // LAZY dynamic import — only triggered when an adapter instance is
    // created (i.e. when DATABASE_BACKEND === 'neon').
    const mod = await import('@neondatabase/serverless')
    const neon = mod.neon
    if (typeof neon !== 'function') {
      throw new Error(
        "[neon-adapter] @neondatabase/serverless did not export a 'neon' function. " +
        'Check the package version (need >= 0.5.0).',
      )
    }
    // fullResults=true so we get {fields, rows, rowCount} like node-postgres.
    // arrayMode=false so rows are returned as objects keyed by column name
    // (matches libsql's default Row shape).
    return neon(this.connectionString, {
      fullResults: true,
      arrayMode: false,
    }) as unknown as NeonSqlFn
  }

  private async getSql(): Promise<NeonSqlFn> {
    if (this.sql) return this.sql
    if (!this.sqlPromise) {
      // Should be unreachable — the constructor sets sqlPromise.
      throw new Error('[neon-adapter] driver not initialised')
    }
    this.sql = await this.sqlPromise
    return this.sql
  }

  /**
   * Convert a libsql-style SQL string with `?` positional placeholders
   * to a Postgres-style SQL string with `$1, $2, ...` numbered
   * placeholders. Used on every execute/batch call.
   */
  private static toPostgresPlaceholders(sql: string): string {
    let i = 0
    // Replace each `?` with `$N` where N is the 1-based index.
    // Does NOT touch strings inside SQL string literals (we don't
    // run queries with `?` inside string literals — the app uses
    // bound parameters for any value containing `?`).
    return sql.replace(/\?/g, () => `$${++i}`)
  }

  /**
   * Coerce a libsql `InValue` arg to a Postgres-compatible value.
   * Postgres's wire protocol via the Neon driver accepts most JS
   * primitives directly. We special-case `bigint` (Postgres's `bytea`
   * and `int8` paths are more reliable with string transport) and
   * `Date` (convert to ISO 8601 string for `timestamptz` columns).
   * Booleans, numbers, strings, null, Uint8Array, and ArrayBuffer
   * pass through unchanged.
   */
  private static coerceArg(v: unknown): unknown {
    if (typeof v === 'boolean') return v
    if (v instanceof Date) return v.toISOString()
    if (typeof v === 'bigint') return v.toString()
    return v as unknown
  }

  /**
   * Convert a libsql `InArgs` (array OR named-arg object) into a flat
   * array of Postgres-bound parameters. Named-arg objects are NOT used
   * by the Mithqal app today (every call site uses positional `?`
   * placeholders with an array), but we support them for completeness.
   */
  private static buildParams(args: InArgs | undefined): unknown[] {
    if (!args) return []
    if (Array.isArray(args)) {
      return args.map((v) => NeonLibsqlAdapter.coerceArg(v))
    }
    // Record<string, InValue> — pass values in object-key order.
    // libsql's named-arg model uses `$name` placeholders, but Neon's
    // numbered-placeholder API needs an array. The mapping is positional
    // in iteration order (Object.values preserves insertion order for
    // string keys), which works if the caller's $1, $2, ... match the
    // object-key order. Not bullet-proof for named args — but again,
    // the app does not use named args.
    return Object.values(args).map((v) => NeonLibsqlAdapter.coerceArg(v))
  }

  /**
   * Build a libsql `Row` from a Neon-returned row object. libsql's Row
   * is an Array-with-named-properties (both `row[0]` and `row.columnName`
   * work). We copy object keys onto an array so callers using either
   * access pattern are satisfied.
   */
  private static rowFromObject(obj: Record<string, unknown>): Row {
    const keys = Object.keys(obj)
    const arr = keys.map((k) => obj[k])
    const row = arr as unknown as Row
    // Attach named-key access onto the same array object.
    for (const k of keys) {
      ;(row as Record<string, unknown>)[k] = obj[k]
    }
    ;(row as { length: number }).length = keys.length
    return row
  }

  /**
   * Map a Neon `FullQueryResult` to a libsql `ResultSet`.
   * - Neon `fields[].name` → libsql `columns`
   * - Neon `fields[].dataTypeID` → libsql `columnTypes` (numeric OID as string)
   * - Neon `rows` → libsql `rows` (with array+object access)
   * - Neon `rowCount` → libsql `rowsAffected`
   * - Neon has no equivalent of libsql `lastInsertRowid` — set to undefined
   *   (callers that rely on this are limited to the legacy libsql path).
   */
  private toResultSet(fr: NeonFullQueryResult): ResultSet {
    const fields = fr.fields ?? []
    const columns = fields.map((f) => f.name)
    const columnTypes = fields.map((f) => (f.dataTypeID != null ? String(f.dataTypeID) : ''))
    const rows = (fr.rows ?? []).map((r) => NeonLibsqlAdapter.rowFromObject(r))
    const rowsAffected = fr.rowCount ?? 0
    const rs: ResultSet = {
      columns,
      columnTypes,
      rows,
      rowsAffected,
      lastInsertRowid: undefined,
      toJSON: () => ({
        columns,
        columnTypes,
        rows,
        rowsAffected,
        lastInsertRowid: undefined,
      }),
    }
    return rs
  }

  // ---- Client interface implementation ----

  async execute(stmt: InStatement): Promise<ResultSet>
  async execute(sql: string, args?: InArgs): Promise<ResultSet>
  async execute(stmtOrSql: InStatement | string, args?: InArgs): Promise<ResultSet> {
    if (this.closed) throw new Error('[neon-adapter] client is closed')
    let sqlText: string
    let sqlArgs: InArgs | undefined
    if (typeof stmtOrSql === 'string') {
      sqlText = stmtOrSql
      sqlArgs = args
    } else {
      sqlText = stmtOrSql.sql
      sqlArgs = stmtOrSql.args
    }
    const pgSql = NeonLibsqlAdapter.toPostgresPlaceholders(sqlText)
    const params = NeonLibsqlAdapter.buildParams(sqlArgs)
    const sql = await this.getSql()
    const fr = await sql.query(pgSql, params, { fullResults: true, arrayMode: false })
    return this.toResultSet(fr)
  }

  async batch(
    stmts: Array<InStatement | [string, InArgs?]>,
    _mode?: TransactionMode,
  ): Promise<ResultSet[]> {
    if (this.closed) throw new Error('[neon-adapter] client is closed')
    const sql = await this.getSql()
    // Build the list of Neon query promises (each sql.query() call
    // returns a thenable that can be passed into sql.transaction([...])
    // — Neon batches them as a single HTTP transaction).
    const queries: Promise<NeonFullQueryResult>[] = stmts.map((s) => {
      let sqlText: string
      let sqlArgs: InArgs | undefined
      if (typeof s === 'string') {
        sqlText = s
        sqlArgs = undefined
      } else if (Array.isArray(s)) {
        sqlText = s[0]
        sqlArgs = s[1]
      } else {
        sqlText = s.sql
        sqlArgs = s.args
      }
      const pgSql = NeonLibsqlAdapter.toPostgresPlaceholders(sqlText)
      const params = NeonLibsqlAdapter.buildParams(sqlArgs)
      // Cast: Neon's sql.query with fullResults:true returns Promise<FullQueryResult>.
      return sql.query(pgSql, params, { fullResults: true, arrayMode: false })
    })
    const results = (await sql.transaction(queries as unknown[], {
      fullResults: true,
      arrayMode: false,
    })) as NeonFullQueryResult[]
    return results.map((fr) => this.toResultSet(fr))
  }

  async migrate(stmts: Array<InStatement>): Promise<ResultSet[]> {
    // libsql's migrate() is a batch with foreign_keys=off before + on
    // after. Neon's HTTP API does not expose a session-level
    // foreign_keys toggle, but Postgres's default is foreign_keys=on
    // (good enough for the schema's idempotent CREATE TABLE IF NOT
    // EXISTS statements — the existing schema has no deferred-FK
    // ordering issues).
    return this.batch(stmts, 'deferred')
  }

  transaction(_mode?: TransactionMode): Promise<LibsqlTransaction>
  transaction(): Promise<LibsqlTransaction>
  transaction(_mode?: TransactionMode): Promise<LibsqlTransaction> {
    if (this.closed) throw new Error('[neon-adapter] client is closed')
    // See class docstring: Neon's HTTP serverless driver does NOT
    // support interactive transactions. We return a
    // NeonTransactionAdapter that runs queries eagerly on the
    // underlying connection (no atomicity). rollback() throws so the
    // operator knows atomicity is unavailable on the fallback.
    return Promise.resolve(new NeonTransactionAdapter(this))
  }

  async executeMultiple(sqlText: string): Promise<void> {
    if (this.closed) throw new Error('[neon-adapter] client is closed')
    const sql = await this.getSql()
    // Neon's HTTP API accepts semicolon-separated multi-statement SQL
    // (the Postgres extended-query protocol supports multi-statement
    // simple queries). Used by migration scripts — not the app's hot
    // path.
    await sql.query(sqlText, [], { fullResults: true, arrayMode: false })
  }

  sync(): Promise<Replicated> {
    // No-op — Postgres has no libsql sync model.
    return Promise.resolve(undefined)
  }

  close(): void {
    this.closed = true
    // The Neon HTTP driver is stateless — no persistent connection to release.
  }

  reconnect(): void {
    this.closed = false
  }
}

/**
 * Interactive-transaction adapter. Returned by NeonLibsqlAdapter.transaction().
 *
 * CAVEAT: Neon's HTTP serverless driver has no interactive (multi-step,
 * mid-flight-branching) transactions — only callback-style
 * sql.transaction(fn) where the function returns an array of queries.
 * This adapter runs queries eagerly on the underlying Neon connection
 * WITHOUT atomicity. commit() is a no-op; rollback() throws so the
 * operator knows atomicity is unavailable on the manual fallback.
 *
 * The app's exported `transaction()` helper (defined below) is the only
 * caller of this adapter. That helper is currently unused in production
 * (no caller imports `transaction` from `@/lib/db`), so this limitation
 * does not affect production traffic. If you wire a caller that needs
 * atomic transactions on Neon, you MUST either (a) refactor the caller
 * to use the libsql `batch()` API (which Neon supports via
 * sql.transaction([...])) or (b) provision a Neon connection pool that
 * speaks the Postgres wire protocol interactively (out of scope for
 * the manual fallback — see NEON-SETUP.md §6).
 */
class NeonTransactionAdapter implements LibsqlTransaction {
  closed = false
  constructor(private readonly parent: NeonLibsqlAdapter) {}

  async execute(stmt: InStatement): Promise<ResultSet>
  async execute(sql: string, args?: InArgs): Promise<ResultSet>
  async execute(stmtOrSql: InStatement | string, args?: InArgs): Promise<ResultSet> {
    if (this.closed) throw new Error('[neon-adapter] transaction is closed')
    // Run eagerly on the underlying Neon connection — NOT atomic.
    return this.parent.execute(stmtOrSql as InStatement, args)
  }

  async batch(stmts: Array<InStatement>): Promise<ResultSet[]> {
    if (this.closed) throw new Error('[neon-adapter] transaction is closed')
    // Delegate to the parent adapter — Neon's sql.transaction([...]) is
    // atomic for batch-only workloads. So this path IS atomic.
    return this.parent.batch(stmts, 'deferred')
  }

  async executeMultiple(sqlText: string): Promise<void> {
    if (this.closed) throw new Error('[neon-adapter] transaction is closed')
    return this.parent.executeMultiple(sqlText)
  }

  async rollback(): Promise<void> {
    this.closed = true
    throw new Error(
      '[neon-adapter] interactive ROLLBACK is not supported on the Neon fallback ' +
      '(see NEON-SETUP.md §6). Queries already executed on this transaction ' +
      'cannot be rolled back. This is a known limitation of the manual-fallback ' +
      'design — engage batch() for atomic multi-statement workloads instead.',
    )
  }

  async commit(): Promise<void> {
    // no-op — queries already executed eagerly on the underlying connection
    this.closed = true
  }

  close(): void {
    this.closed = true
  }
}

function createDbClient(): Client {
  // ---- Neon fallback branch (Task E2-B / release v25.6) ----
  // GATED on DATABASE_BACKEND === 'neon' AND NEON_DATABASE_URL. When
  // either is unset, we fall through to the default Turso path below.
  //
  // The Neon driver is lazy-imported inside NeonLibsqlAdapter, so the
  // Turso path never pulls @neondatabase/serverless into the bundle.
  if (process.env.DATABASE_BACKEND === 'neon') {
    if (!process.env.NEON_DATABASE_URL) {
      throw new Error(
        'DATABASE_BACKEND=neon but NEON_DATABASE_URL is not set. See NEON-SETUP.md',
      )
    }
    // Surface the active-failover switch in the operator's logs so the
    // manual fallback is never silent.
    console.warn(
      '[db] DATABASE_BACKEND=neon — using Neon fallback (manual switch). ' +
      'Turso is the primary. See NEON-SETUP.md.',
    )
    // Mark on the global so hot-reload preserves the backend choice.
    globalForDb.__neonBackend = true
    return new NeonLibsqlAdapter(process.env.NEON_DATABASE_URL)
  }

  // ---- Default (Turso / libsql) branch — unchanged ----
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    "file:./db/custom.db"

  const authToken = process.env.DATABASE_AUTH_TOKEN

  // For libsql:// URLs (Turso), use the auth token.
  // For file: URLs (local dev), no auth token needed.
  // Defensive: ensure the parent directory exists for file: URLs — libsql
  // opens the SQLite file at construction time and throws SQLITE_CANTOPEN
  // (code 14) if the directory is missing. This is a common local-dev
  // stumbling block (e.g. fresh clone with DATABASE_URL=file:./db/custom.db
  // but no db/ dir). mkdirSync recursive is a no-op if the dir exists.
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length)
    try {
      mkdirSync(dirname(filePath), { recursive: true })
    } catch {
      // Swallow — the createClient call below will surface a clearer error.
    }
  }

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
  status: string | null  // 'pending' | 'active' | 'executed' | 'defeated' | null
  createdAt: number | null
}

export interface ProofAttestation {
  id: number
  date: string            // YYYY-MM-DD (UTC) — one attestation set per day
  proofType: string       // 'reserve_ratio' | 'nav' | 'basket_sum' | 'duration' | 'lcr' | 'cri' | 'por_hash'
  value: number           // numeric proof value (hash fields store hash integer count)
  hash: string            // sha256 of the underlying proof payload (deterministic recompute)
  timestamp: number       // unixepoch seconds
}

/**
 * Article XVI — Constitutional Assumptions Register entry.
 *
 * Every simulation, stress test, validation, and certification produced by
 * the Institution MUST be recorded here. The Register is immutable,
 * auditable, and binding — no simulation, stress test, validation, or
 * certification may be cited in governance without a corresponding Register
 * entry (per blueprint Article XVI §Constitutional Interpretation).
 *
 * The 14 mandatory fields are:
 *   1. Random Seed              (randomSeed: number)
 *   2. Input Assumptions        (inputAssumptions: JSON string)
 *   3. Economic Assumptions     (economicAssumptions: JSON string)
 *   4. Liquidity Assumptions    (liquidityAssumptions: JSON string)
 *   5. Correlation Assumptions  (correlationAssumptions: JSON string)
 *   6. Market Conditions        (marketConditions: JSON string)
 *   7. Time Horizon             (timeHorizon: string, e.g. "1000 trading days")
 *   8. Confidence Level         (confidenceLevel: number, e.g. 99)
 *   9. Simulation Version       (simulationVersion: string, e.g. "v3.1")
 *  10. Software Version         (softwareVersion: string, e.g. "v19.0.9")
 *  11. Date                     (date: ISO 8601 string)
 *  12. Author                   (author: string)
 *  13. Approval                 (approval: JSON string with body + date)
 *  14. Audit Signature          (auditSignature: string)
 *
 * All 14 fields are stored as TEXT/JSON columns. The entry's `entryId` is a
 * deterministic CAR-YYYY-MM-DD-NNN identifier (Article XVI example).
 */
export interface AssumptionsRegisterEntry {
  id: number
  entryId: string                  // CAR-YYYY-MM-DD-NNN
  simulationType: string           // 'monte_carlo' | 'stress_lab' | 'reverse_stress' | 'lrr' | 'model_validation' | etc.
  randomSeed: number
  inputAssumptions: string         // JSON
  economicAssumptions: string      // JSON
  liquidityAssumptions: string     // JSON
  correlationAssumptions: string   // JSON
  marketConditions: string         // JSON
  timeHorizon: string
  confidenceLevel: number
  simulationVersion: string
  softwareVersion: string
  date: string                     // ISO 8601
  author: string
  approval: string                 // JSON { body, date, reference }
  auditSignature: string
  summary: string                  // human-readable one-line summary of the simulation result
  createdAt: number                // unixepoch
}

/* ---- v25.8 Architectural Models (per F1 gap analysis) ----
 *
 * Four new institutional-grade entities backed by Prisma schema models in
 * prisma/schema.prisma AND libsql CREATE TABLE statements in
 * ensureV258Schema() below. The TS interfaces expose monetary fields
 * (quantity, marketValueUsd) as `string` for BigDecimal-safe transport —
 * the same convention used by `transactions.amount` and `fees.amount`
 * above. The libsql columns are TEXT; the Prisma schema uses Decimal
 * (mapped to REAL in prisma.db, only used by Prisma Studio for
 * introspection).
 *
 * These tables sit ALONGSIDE the existing User / Post / FormationInterest /
 * TestnetOperation / Operating System tables — they do NOT add FK
 * relationships to those existing models, so the deterministic v19 monetary
 * engine's DB contract (src/lib/monetary-engine-v19.ts, src/lib/nav-compute.ts,
 * src/lib/fixed-point.ts) is preserved.
 */

export interface BankParticipant {
  id: string
  legalName: string
  swiftCode: string | null
  jurisdiction: string
  participantType: string  // bank | custodian | clearing-house | central-bank
  regulatoryId: string | null
  onboardedAt: Date
  onboardedBy: string | null
  status: string  // pending | approved | suspended | revoked
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  kycStatus: string  // not-started | in-progress | verified | rejected
  amlStatus: string
  sanctionsStatus: string
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ReserveHolding {
  id: string
  bankParticipantId: string | null
  assetClass: string  // gold | silver | sovereign | stablecoin | cash
  assetSymbol: string  // XAU | XAG | US-TREASURY-10Y | USDC | USD
  custodyLocation: string | null
  quantity: string  // TEXT-stored BigDecimal string (8 decimals)
  unit: string  // oz | usd | token | gram
  marketValueUsd: string  // TEXT-stored BigDecimal string (8 decimals)
  haircutBps: number
  verifiedAt: Date | null
  verifiedBy: string | null
  verificationHash: string | null
  status: string  // pending | verified | rejected | frozen
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ComplianceScreening {
  id: string
  bankParticipantId: string | null
  screeningType: string  // aml | kyc | sanctions | pep | adverse-media
  screeningProvider: string | null
  inputValue: string
  inputType: string  // individual | entity | transaction
  result: string  // clear | hit | review | escalated
  riskScore: number | null  // 0-100
  matchCount: number
  matchedEntities: string | null  // JSON array of matched entities
  screenedAt: Date
  screenedBy: string | null
  expiresAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface GovernanceProposal {
  id: string
  proposalType: string  // parameter-change | emergency-action | council-nomination | constitutional-amendment
  title: string
  description: string
  proposerAddress: string
  proposerRole: string  // council-member | operator | external
  proposalHash: string
  actionsJson: string  // JSON array of proposed actions
  status: string  // draft | proposed | active | passed | rejected | executed | expired
  quorumRequired: number
  approvalRequired: number
  maxSeverity: string  // low | medium | high | critical
  validUntil: Date
  proposedAt: Date
  votingOpensAt: Date | null
  votingClosesAt: Date | null
  executedAt: Date | null
  executedBy: string | null
  executionTxHash: string | null
  approvalsJson: string  // JSON array of {address, signedAt, role}
  rejectionsJson: string  // JSON array of {address, signedAt, role}
  notes: string | null
  createdAt: Date
  updatedAt: Date
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

    // Daily gold + FX price snapshots — builds the historical dataset that
    // powers the EWMA volatility engine (§17) and momentum calculation (§15).
    // One row per day (date is the primary key). Updated on each oracle fetch.
    `CREATE TABLE IF NOT EXISTS "GoldPriceSnapshot" ("date" TEXT PRIMARY KEY NOT NULL, "goldUsd" REAL NOT NULL, "fxRates" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "GoldPriceSnapshot_date_idx" ON "GoldPriceSnapshot"("date")`,

    // Daily constitutional proof attestations (Article VII — Proof of Reserves).
    // One row per (date, proofType). The Vercel Cron at /api/proofs/publish
    // runs daily at 00:00 UTC and inserts 7 rows (one per proof type) so the
    // public /api/proofs/latest endpoint can expose them for transparency.
    `CREATE TABLE IF NOT EXISTS "ProofAttestation" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "date" TEXT NOT NULL, "proofType" TEXT NOT NULL, "value" REAL NOT NULL, "hash" TEXT NOT NULL, "timestamp" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "ProofAttestation_date_idx" ON "ProofAttestation"("date")`,
    // Unique constraint on (date, proofType) so re-running the cron (or a
    // manual re-publish) overwrites the existing row instead of creating
    // duplicates. The proofAttestation.upsert() helper relies on this.
    `CREATE UNIQUE INDEX IF NOT EXISTS "ProofAttestation_date_proofType_idx" ON "ProofAttestation"("date","proofType")`,

    // Article XVI — Constitutional Assumptions Register (Task 12-c P0-2).
    // Immutable, auditable, binding record of every simulation/stress test/
    // validation/certification produced by the Institution. Each entry has
    // the 14 mandatory fields (randomSeed, input/economic/liquidity/
    // correlation/market assumptions, timeHorizon, confidenceLevel,
    // simulationVersion, softwareVersion, date, author, approval,
    // auditSignature) plus an entryId of the form CAR-YYYY-MM-DD-NNN.
    // Insert-only: no UPDATE or DELETE path is exposed. Re-publishing a
    // simulation creates a new row with a new NNN suffix.
    `CREATE TABLE IF NOT EXISTS "AssumptionsRegister" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "entryId" TEXT UNIQUE NOT NULL, "simulationType" TEXT NOT NULL, "randomSeed" INTEGER NOT NULL, "inputAssumptions" TEXT NOT NULL, "economicAssumptions" TEXT NOT NULL, "liquidityAssumptions" TEXT NOT NULL, "correlationAssumptions" TEXT NOT NULL, "marketConditions" TEXT NOT NULL, "timeHorizon" TEXT NOT NULL, "confidenceLevel" REAL NOT NULL, "simulationVersion" TEXT NOT NULL, "softwareVersion" TEXT NOT NULL, "date" TEXT NOT NULL, "author" TEXT NOT NULL, "approval" TEXT NOT NULL, "auditSignature" TEXT NOT NULL, "summary" TEXT NOT NULL, "createdAt" INTEGER DEFAULT (unixepoch()))`,
    `CREATE INDEX IF NOT EXISTS "AssumptionsRegister_entryId_idx" ON "AssumptionsRegister"("entryId")`,
    `CREATE INDEX IF NOT EXISTS "AssumptionsRegister_simulationType_idx" ON "AssumptionsRegister"("simulationType")`,
    `CREATE INDEX IF NOT EXISTS "AssumptionsRegister_date_idx" ON "AssumptionsRegister"("date")`,
    `CREATE INDEX IF NOT EXISTS "AssumptionsRegister_createdAt_idx" ON "AssumptionsRegister"("createdAt")`,

    // Chapter XX — Constitutional Commercial Governance (v20)
    // Procurement records: immutable 12-stage workflow for reserve procurement
    `CREATE TABLE IF NOT EXISTS "ProcurementRecord" ("id" TEXT PRIMARY KEY NOT NULL, "asset" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "quantity" REAL NOT NULL, "currentStage" TEXT NOT NULL, "stageHistory" TEXT NOT NULL, "benchmark" TEXT, "bestExecution" TEXT, "dealer" TEXT, "executionPrice" REAL, "savings" REAL, "complianceResult" TEXT, "auditId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" DATETIME)`,
    `CREATE INDEX IF NOT EXISTS "ProcurementRecord_asset_idx" ON "ProcurementRecord"("asset")`,
    `CREATE INDEX IF NOT EXISTS "ProcurementRecord_currentStage_idx" ON "ProcurementRecord"("currentStage")`,
    `CREATE INDEX IF NOT EXISTS "ProcurementRecord_createdAt_idx" ON "ProcurementRecord"("createdAt")`,

    // Commercial revenue entries: live revenue accounting by entity + category
    `CREATE TABLE IF NOT EXISTS "RevenueEntry" ("id" TEXT PRIMARY KEY NOT NULL, "entity" TEXT NOT NULL, "category" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "transactionRef" TEXT, "description" TEXT NOT NULL, "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "RevenueEntry_entity_idx" ON "RevenueEntry"("entity")`,
    `CREATE INDEX IF NOT EXISTS "RevenueEntry_category_idx" ON "RevenueEntry"("category")`,
    `CREATE INDEX IF NOT EXISTS "RevenueEntry_timestamp_idx" ON "RevenueEntry"("timestamp")`,

    // Commercial audit entries: immutable audit trail with digital signatures
    `CREATE TABLE IF NOT EXISTS "CommercialAuditEntry" ("auditId" TEXT PRIMARY KEY NOT NULL, "timestamp" DATETIME NOT NULL, "entity" TEXT NOT NULL, "approver" TEXT NOT NULL, "transactionRef" TEXT NOT NULL, "revenueAmount" REAL NOT NULL, "benefitDistribution" TEXT NOT NULL, "complianceResult" INTEGER NOT NULL, "complianceScore" REAL NOT NULL, "digitalSignature" TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS "CommercialAuditEntry_entity_idx" ON "CommercialAuditEntry"("entity")`,
    `CREATE INDEX IF NOT EXISTS "CommercialAuditEntry_timestamp_idx" ON "CommercialAuditEntry"("timestamp")`,

    // Reserve ownership records: tracks which entity owns/holds each reserve asset
    `CREATE TABLE IF NOT EXISTS "ReserveOwnership" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "assetClass" TEXT NOT NULL, "ownerEntity" TEXT NOT NULL, "custodian" TEXT NOT NULL, "amount" REAL NOT NULL, "valueUsd" REAL NOT NULL, "verified" INTEGER NOT NULL DEFAULT 1, "lastVerifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "ReserveOwnership_assetClass_idx" ON "ReserveOwnership"("assetClass")`,
    `CREATE INDEX IF NOT EXISTS "ReserveOwnership_ownerEntity_idx" ON "ReserveOwnership"("ownerEntity")`,

    // ─── v25.8 Architectural Models (per F1 gap analysis — closes gap #1) ───
    // These are duplicated in `ensureV258Schema()` below so they get created
    // even when the global `__schemaInitialized` flag was already true
    // (which would short-circuit ensureSchema() and skip these statements).
    // BankParticipant: institutional banks/custodians/clearing-houses/central-banks
    // that interact with MITHQAL (for the bank-onboarding flow at /api/bank-onboarding).
    `CREATE TABLE IF NOT EXISTS "BankParticipant" ("id" TEXT PRIMARY KEY NOT NULL, "legalName" TEXT NOT NULL UNIQUE, "swiftCode" TEXT UNIQUE, "jurisdiction" TEXT NOT NULL, "participantType" TEXT NOT NULL, "regulatoryId" TEXT, "onboardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "onboardedBy" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "contactName" TEXT, "contactEmail" TEXT, "contactPhone" TEXT, "kycStatus" TEXT NOT NULL DEFAULT 'not-started', "amlStatus" TEXT NOT NULL DEFAULT 'not-started', "sanctionsStatus" TEXT NOT NULL DEFAULT 'not-started', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "BankParticipant_status_idx" ON "BankParticipant"("status")`,
    `CREATE INDEX IF NOT EXISTS "BankParticipant_participantType_idx" ON "BankParticipant"("participantType")`,
    `CREATE INDEX IF NOT EXISTS "BankParticipant_jurisdiction_idx" ON "BankParticipant"("jurisdiction")`,
    `CREATE INDEX IF NOT EXISTS "BankParticipant_createdAt_idx" ON "BankParticipant"("createdAt")`,

    // ReserveHolding: individual reserve holdings (gold/silver/sovereign bonds/
    // stablecoins/cash) backing MTQ issuance per Constitution v19.0 §22
    // multi-currency backing. quantity + marketValueUsd are TEXT to avoid
    // SQLite REAL precision loss (BigDecimal-safe string transport, same
    // convention as `transactions.amount` above).
    `CREATE TABLE IF NOT EXISTS "ReserveHolding" ("id" TEXT PRIMARY KEY NOT NULL, "bankParticipantId" TEXT, "assetClass" TEXT NOT NULL, "assetSymbol" TEXT NOT NULL, "custodyLocation" TEXT, "quantity" TEXT NOT NULL, "unit" TEXT NOT NULL, "marketValueUsd" TEXT NOT NULL, "haircutBps" INTEGER NOT NULL DEFAULT 0, "verifiedAt" DATETIME, "verifiedBy" TEXT, "verificationHash" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("bankParticipantId") REFERENCES "BankParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_assetClass_idx" ON "ReserveHolding"("assetClass")`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_assetSymbol_idx" ON "ReserveHolding"("assetSymbol")`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_status_idx" ON "ReserveHolding"("status")`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_createdAt_idx" ON "ReserveHolding"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_verifiedAt_idx" ON "ReserveHolding"("verifiedAt")`,
    `CREATE INDEX IF NOT EXISTS "ReserveHolding_bankParticipantId_idx" ON "ReserveHolding"("bankParticipantId")`,

    // ComplianceScreening: AML/KYC/sanctions/PEP/adverse-media screening
    // records per /api/sanctions-screening + /api/compliance. One row per
    // screening event — re-screenings create new rows so the audit trail
    // is append-only.
    `CREATE TABLE IF NOT EXISTS "ComplianceScreening" ("id" TEXT PRIMARY KEY NOT NULL, "bankParticipantId" TEXT, "screeningType" TEXT NOT NULL, "screeningProvider" TEXT, "inputValue" TEXT NOT NULL, "inputType" TEXT NOT NULL, "result" TEXT NOT NULL, "riskScore" INTEGER, "matchCount" INTEGER NOT NULL DEFAULT 0, "matchedEntities" TEXT, "screenedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "screenedBy" TEXT, "expiresAt" DATETIME, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("bankParticipantId") REFERENCES "BankParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
    `CREATE INDEX IF NOT EXISTS "ComplianceScreening_screeningType_idx" ON "ComplianceScreening"("screeningType")`,
    `CREATE INDEX IF NOT EXISTS "ComplianceScreening_result_idx" ON "ComplianceScreening"("result")`,
    `CREATE INDEX IF NOT EXISTS "ComplianceScreening_screenedAt_idx" ON "ComplianceScreening"("screenedAt")`,
    `CREATE INDEX IF NOT EXISTS "ComplianceScreening_expiresAt_idx" ON "ComplianceScreening"("expiresAt")`,
    `CREATE INDEX IF NOT EXISTS "ComplianceScreening_bankParticipantId_idx" ON "ComplianceScreening"("bankParticipantId")`,

    // GovernanceProposal: Council governance proposals per Constitution v19.0
    // §41-§44 (parameter-change / emergency-action / council-nomination /
    // constitutional-amendment). Approvals/rejections are JSON arrays of
    // {address, signedAt, role} for council-member multi-sig.
    `CREATE TABLE IF NOT EXISTS "GovernanceProposal" ("id" TEXT PRIMARY KEY NOT NULL, "proposalType" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "proposerAddress" TEXT NOT NULL, "proposerRole" TEXT NOT NULL, "proposalHash" TEXT NOT NULL UNIQUE, "actionsJson" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "quorumRequired" INTEGER NOT NULL DEFAULT 5, "approvalRequired" INTEGER NOT NULL DEFAULT 4, "maxSeverity" TEXT NOT NULL DEFAULT 'low', "validUntil" DATETIME NOT NULL, "proposedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "votingOpensAt" DATETIME, "votingClosesAt" DATETIME, "executedAt" DATETIME, "executedBy" TEXT, "executionTxHash" TEXT, "approvalsJson" TEXT NOT NULL DEFAULT '[]', "rejectionsJson" TEXT NOT NULL DEFAULT '[]', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE INDEX IF NOT EXISTS "GovernanceProposal_status_idx" ON "GovernanceProposal"("status")`,
    `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposalType_idx" ON "GovernanceProposal"("proposalType")`,
    `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposedAt_idx" ON "GovernanceProposal"("proposedAt")`,
    `CREATE INDEX IF NOT EXISTS "GovernanceProposal_validUntil_idx" ON "GovernanceProposal"("validUntil")`,
    `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposerAddress_idx" ON "GovernanceProposal"("proposerAddress")`,
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

  async update(args: {
    where: { id: string }
    data: Partial<Pick<TestnetOperation, "nav" | "reserveRatio" | "porHash">>
  }): Promise<void> {
    await ensureSchema()
    const sets: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.data.nav !== undefined) { sets.push(`"nav" = ?`); sqlArgs.push(args.data.nav) }
    if (args.data.reserveRatio !== undefined) { sets.push(`"reserveRatio" = ?`); sqlArgs.push(args.data.reserveRatio) }
    if (args.data.porHash !== undefined) { sets.push(`"porHash" = ?`); sqlArgs.push(args.data.porHash) }
    if (sets.length === 0) return
    sqlArgs.push(args.where.id)
    await _rawClient.execute({
      sql: `UPDATE "TestnetOperation" SET ${sets.join(", ")} WHERE "id" = ?`,
      args: sqlArgs,
    })
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

export const proofAttestation = {
  /** Insert a single proof attestation row. Idempotent on (date, proofType) —
   *  re-publishing the same proof for the same day overwrites the value/hash
   *  rather than creating duplicates, so the cron can be safely re-run. */
  async upsert(args: {
    data: {
      date: string
      proofType: string
      value: number
      hash: string
    }
  }): Promise<ProofAttestation> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "ProofAttestation" ("date","proofType","value","hash")
            VALUES (?,?,?,?)
            ON CONFLICT("date","proofType") DO UPDATE SET
              "value" = excluded."value",
              "hash"   = excluded."hash",
              "timestamp" = unixepoch()
            RETURNING *`,
      args: [args.data.date, args.data.proofType, args.data.value, args.data.hash],
    })
    return rowToProofAttestation(result.rows[0])
  },

  /** Return the most recent attestation for each proofType. This is the
   *  shape the public /api/proofs/latest endpoint returns — one row per
   *  proof type, taken from the latest date that has all (or any) proofs. */
  async latest(): Promise<ProofAttestation[]> {
    await ensureSchema()
    // For each proofType, pick the row with the greatest (date, timestamp).
    const result = await _rawClient.execute({
      sql: `SELECT p.* FROM "ProofAttestation" p
            INNER JOIN (
              SELECT "proofType", MAX("date") as max_date
              FROM "ProofAttestation" GROUP BY "proofType"
            ) m ON p."proofType" = m."proofType" AND p."date" = m.max_date
            ORDER BY p."proofType" ASC`,
      args: [],
    })
    return result.rows.map(rowToProofAttestation)
  },

  /** Return all attestations for a given date (YYYY-MM-DD). */
  async findByDate(date: string): Promise<ProofAttestation[]> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "ProofAttestation" WHERE "date" = ? ORDER BY "proofType" ASC`,
      args: [date],
    })
    return result.rows.map(rowToProofAttestation)
  },

  /** Return the most recent N attestation days (across all proofTypes).
   *  Used by the status page / transparency views for a quick history. */
  async recentDays(limit = 7): Promise<ProofAttestation[]> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "ProofAttestation"
            WHERE "date" IN (
              SELECT DISTINCT "date" FROM "ProofAttestation"
              ORDER BY "date" DESC LIMIT ?
            )
            ORDER BY "date" DESC, "proofType" ASC`,
      args: [limit],
    })
    return result.rows.map(rowToProofAttestation)
  },
}

/* ---- AssumptionsRegister queries (Article XVI — Task 12-c P0-2) ---- */

export const assumptionsRegister = {
  /**
   * Insert an immutable Register entry. Generates a deterministic entryId
   * of the form `CAR-YYYY-MM-DD-NNN` where NNN is the next zero-padded
   * sequence number for that date (001, 002, …).
   *
   * Insert-only by design — Article XVI mandates that the Register is
   * immutable; entries may not be modified, deleted, or destroyed.
   */
  async create(args: {
    data: Omit<AssumptionsRegisterEntry, "id" | "entryId" | "createdAt">
  }): Promise<AssumptionsRegisterEntry> {
    await ensureSchema()
    const date = args.data.date
    const dateOnly = date.slice(0, 10) // YYYY-MM-DD

    // Find the next sequence number for this date.
    //
    // The `date` column stores the full ISO 8601 datetime (e.g.
    // "2026-08-04T19:10:13.723Z"), but the entryId uses date-only
    // ("CAR-2026-08-04-NNN"). Match by prefix so all entries logged
    // on the same UTC date share the same NNN sequence.
    const seqResult = await _rawClient.execute({
      sql: `SELECT COUNT(*) as c FROM "AssumptionsRegister" WHERE "date" LIKE ?`,
      args: [`${dateOnly}%`],
    })
    const seq = (Number(seqResult.rows[0]?.c ?? 0)) + 1
    let entryId = `CAR-${dateOnly}-${String(seq).padStart(3, "0")}`

    // Retry-on-conflict: if two concurrent inserts race for the same NNN,
    // bump the sequence and retry. Article XVI mandates immutability, so
    // we never overwrite — we always create a new row with a higher NNN.
    let attempt = 0
    while (attempt < 5) {
      try {
        const result = await _rawClient.execute({
          sql: `INSERT INTO "AssumptionsRegister"
                ("entryId","simulationType","randomSeed","inputAssumptions",
                 "economicAssumptions","liquidityAssumptions","correlationAssumptions",
                 "marketConditions","timeHorizon","confidenceLevel","simulationVersion",
                 "softwareVersion","date","author","approval","auditSignature","summary")
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
          args: [
            entryId,
            args.data.simulationType,
            args.data.randomSeed,
            args.data.inputAssumptions,
            args.data.economicAssumptions,
            args.data.liquidityAssumptions,
            args.data.correlationAssumptions,
            args.data.marketConditions,
            args.data.timeHorizon,
            args.data.confidenceLevel,
            args.data.simulationVersion,
            args.data.softwareVersion,
            args.data.date,
            args.data.author,
            args.data.approval,
            args.data.auditSignature,
            args.data.summary,
          ],
        })
        return rowToAssumptionsRegisterEntry(result.rows[0])
      } catch (err) {
        // SQLITE_CONSTRAINT_UNIQUE — another concurrent insert grabbed
        // this entryId. Bump the NNN and retry.
        attempt++
        if (attempt >= 5) throw err
        entryId = `CAR-${dateOnly}-${String(seq + attempt).padStart(3, "0")}`
      }
    }
    // Unreachable — the loop either returns or throws.
    throw new Error("[assumptionsRegister.create] unreachable")
  },

  /** Return the most recent Register entry (across all simulation types). */
  async latest(): Promise<AssumptionsRegisterEntry | null> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "AssumptionsRegister" ORDER BY "createdAt" DESC LIMIT 1`,
      args: [],
    })
    if (result.rows.length === 0) return null
    return rowToAssumptionsRegisterEntry(result.rows[0])
  },

  /** Return the most recent entry for a given simulationType. */
  async latestByType(simulationType: string): Promise<AssumptionsRegisterEntry | null> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "AssumptionsRegister"
            WHERE "simulationType" = ?
            ORDER BY "createdAt" DESC LIMIT 1`,
      args: [simulationType],
    })
    if (result.rows.length === 0) return null
    return rowToAssumptionsRegisterEntry(result.rows[0])
  },

  /** Return the most recent N entries (newest first). */
  async recent(limit = 20): Promise<AssumptionsRegisterEntry[]> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "AssumptionsRegister" ORDER BY "createdAt" DESC LIMIT ?`,
      args: [limit],
    })
    return result.rows.map(rowToAssumptionsRegisterEntry)
  },

  /** Look up a single entry by entryId (CAR-YYYY-MM-DD-NNN). */
  async findByEntryId(entryId: string): Promise<AssumptionsRegisterEntry | null> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT * FROM "AssumptionsRegister" WHERE "entryId" = ?`,
      args: [entryId],
    })
    if (result.rows.length === 0) return null
    return rowToAssumptionsRegisterEntry(result.rows[0])
  },

  /** Total entry count (for dashboard / audit reporting). */
  async count(): Promise<number> {
    await ensureSchema()
    const result = await _rawClient.execute({
      sql: `SELECT COUNT(*) as c FROM "AssumptionsRegister"`,
      args: [],
    })
    return Number(result.rows[0]?.c ?? 0)
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

function rowToProofAttestation(row: Record<string, unknown>): ProofAttestation {
  return {
    id: Number(row.id),
    date: row.date as string,
    proofType: row.proofType as string,
    value: Number(row.value),
    hash: row.hash as string,
    timestamp: row.timestamp != null ? Number(row.timestamp) : 0,
  }
}

function rowToAssumptionsRegisterEntry(row: Record<string, unknown>): AssumptionsRegisterEntry {
  return {
    id: Number(row.id),
    entryId: row.entryId as string,
    simulationType: row.simulationType as string,
    randomSeed: Number(row.randomSeed),
    inputAssumptions: row.inputAssumptions as string,
    economicAssumptions: row.economicAssumptions as string,
    liquidityAssumptions: row.liquidityAssumptions as string,
    correlationAssumptions: row.correlationAssumptions as string,
    marketConditions: row.marketConditions as string,
    timeHorizon: row.timeHorizon as string,
    confidenceLevel: Number(row.confidenceLevel),
    simulationVersion: row.simulationVersion as string,
    softwareVersion: row.softwareVersion as string,
    date: row.date as string,
    author: row.author as string,
    approval: row.approval as string,
    auditSignature: row.auditSignature as string,
    summary: row.summary as string,
    createdAt: row.createdAt != null ? Number(row.createdAt) : 0,
  }
}

/* ---- Transaction support (for atomic operations) ---- */

export async function transaction<T>(
  fn: (tx: LibsqlTransaction) => Promise<T>
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

/* ---- Generic parameterised SQL helper ----
 * Exposed so Chapter XX (Commercial Governance) routes can run ad-hoc
 * parameterised SQL against the new tables (ProcurementRecord,
 * RevenueEntry, CommercialAuditEntry, ReserveOwnership) without each
 * route having to re-import the raw client. Returns the underlying
 * libsql ResultSet so callers can map rows themselves.
 *
 * Usage:
 *   const rs = await rawQuery(
 *     `SELECT * FROM "ProcurementRecord" WHERE "id" = ? ORDER BY "createdAt" DESC LIMIT ?`,
 *     [id, 20],
 *   )
 *   return rs.rows.map(rowToProcurementRecord)
 *
 * NOTE: ensures the Chapter XX tables exist on every call (idempotent —
 * CREATE TABLE IF NOT EXISTS). This is necessary because the
 * `globalForDb.__schemaInitialized` flag may have been set true before
 * these tables were added (dev-server hot reload preserves globalThis).
 */
const CHAPTER_XX_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "ProcurementRecord" ("id" TEXT PRIMARY KEY NOT NULL, "asset" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "quantity" REAL NOT NULL, "currentStage" TEXT NOT NULL, "stageHistory" TEXT NOT NULL, "benchmark" TEXT, "bestExecution" TEXT, "dealer" TEXT, "executionPrice" REAL, "savings" REAL, "complianceResult" TEXT, "auditId" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" DATETIME)`,
  `CREATE INDEX IF NOT EXISTS "ProcurementRecord_asset_idx" ON "ProcurementRecord"("asset")`,
  `CREATE INDEX IF NOT EXISTS "ProcurementRecord_currentStage_idx" ON "ProcurementRecord"("currentStage")`,
  `CREATE INDEX IF NOT EXISTS "ProcurementRecord_createdAt_idx" ON "ProcurementRecord"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "RevenueEntry" ("id" TEXT PRIMARY KEY NOT NULL, "entity" TEXT NOT NULL, "category" TEXT NOT NULL, "amountUsd" REAL NOT NULL, "transactionRef" TEXT, "description" TEXT NOT NULL, "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "RevenueEntry_entity_idx" ON "RevenueEntry"("entity")`,
  `CREATE INDEX IF NOT EXISTS "RevenueEntry_category_idx" ON "RevenueEntry"("category")`,
  `CREATE INDEX IF NOT EXISTS "RevenueEntry_timestamp_idx" ON "RevenueEntry"("timestamp")`,
  `CREATE TABLE IF NOT EXISTS "CommercialAuditEntry" ("auditId" TEXT PRIMARY KEY NOT NULL, "timestamp" DATETIME NOT NULL, "entity" TEXT NOT NULL, "approver" TEXT NOT NULL, "transactionRef" TEXT NOT NULL, "revenueAmount" REAL NOT NULL, "benefitDistribution" TEXT NOT NULL, "complianceResult" INTEGER NOT NULL, "complianceScore" REAL NOT NULL, "digitalSignature" TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS "CommercialAuditEntry_entity_idx" ON "CommercialAuditEntry"("entity")`,
  `CREATE INDEX IF NOT EXISTS "CommercialAuditEntry_timestamp_idx" ON "CommercialAuditEntry"("timestamp")`,
  `CREATE TABLE IF NOT EXISTS "ReserveOwnership" ("id" INTEGER PRIMARY KEY AUTOINCREMENT, "assetClass" TEXT NOT NULL, "ownerEntity" TEXT NOT NULL, "custodian" TEXT NOT NULL, "amount" REAL NOT NULL, "valueUsd" REAL NOT NULL, "verified" INTEGER NOT NULL DEFAULT 1, "lastVerifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "ReserveOwnership_assetClass_idx" ON "ReserveOwnership"("assetClass")`,
  `CREATE INDEX IF NOT EXISTS "ReserveOwnership_ownerEntity_idx" ON "ReserveOwnership"("ownerEntity")`,
  // ─── Data Source Observation (provenance tracking) — additive, per data-architecture audit ───
  `CREATE TABLE IF NOT EXISTS "DataSourceObservation" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "provider" TEXT NOT NULL,
    "dataset" TEXT NOT NULL,
    "series_key" TEXT,
    "reference_period" TEXT,
    "frequency" TEXT,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "source_url" TEXT,
    "access_method" TEXT,
    "retrieved_at" TEXT NOT NULL,
    "published_at" TEXT,
    "revision_number" INTEGER,
    "methodology_version" TEXT,
    "dataset_version" TEXT,
    "raw_payload_hash" TEXT,
    "ingestion_run_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "DataSourceObs_provider_dataset_idx" ON "DataSourceObservation"("provider", "dataset")`,
  `CREATE INDEX IF NOT EXISTS "DataSourceObs_period_idx" ON "DataSourceObservation"("reference_period")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DataSourceObs_unique_idx" ON "DataSourceObservation"("provider", "dataset", "series_key", "reference_period", "dataset_version")`,
]

let __chapterXxSchemaEnsured = false
async function ensureChapterXxSchema(): Promise<void> {
  if (__chapterXxSchemaEnsured) return
  for (const sql of CHAPTER_XX_SCHEMA_STATEMENTS) {
    await _rawClient.execute(sql)
  }
  __chapterXxSchemaEnsured = true
}

export async function rawQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  args: ReadonlyArray<string | number | null> = [],
): Promise<{ rows: T[]; rowsAffected?: number; lastInsertRowid?: number | bigint }> {
  await ensureSchema()
  await ensureChapterXxSchema()
  const result = await _rawClient.execute({ sql, args: args as never })
  return {
    rows: (result.rows ?? []) as T[],
    rowsAffected: result.rowsAffected,
    lastInsertRowid: result.lastInsertRowid,
  }
}

/* ---- v25.8 Architectural Model entity wrappers (per F1 gap analysis) ----
 *
 * Each entity mirrors the libsql CREATE TABLE in ensureSchema() above. The
 * TS interfaces (BankParticipant / ReserveHolding / ComplianceScreening /
 * GovernanceProposal) are declared earlier in this file. Row mappers are
 * declared at the bottom of this section.
 *
 * API routes consume these via `db.bankParticipant.findMany(...)` etc.,
 * mirroring the formationInterest / transactions / proposals pattern.
 *
 * Monetary fields (ReserveHolding.quantity, ReserveHolding.marketValueUsd)
 * are exposed as `string` so callers stay BigDecimal-safe (same as
 * `transactions.amount`). The DB column is TEXT.
 *
 * Each method calls `await ensureV258Schema()` first to make sure the
 * table exists — this is critical because the global
 * `__schemaInitialized` flag in `ensureSchema()` may have been set true
 * before these v25.8 statements were added (e.g. dev-server hot reload
 * preserves globalThis), in which case ensureSchema() short-circuits and
 * the new tables are never created. ensureV258Schema() runs idempotently
 * on first call with its own per-process flag.
 */

const V25_8_SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "BankParticipant" ("id" TEXT PRIMARY KEY NOT NULL, "legalName" TEXT NOT NULL UNIQUE, "swiftCode" TEXT UNIQUE, "jurisdiction" TEXT NOT NULL, "participantType" TEXT NOT NULL, "regulatoryId" TEXT, "onboardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "onboardedBy" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "contactName" TEXT, "contactEmail" TEXT, "contactPhone" TEXT, "kycStatus" TEXT NOT NULL DEFAULT 'not-started', "amlStatus" TEXT NOT NULL DEFAULT 'not-started', "sanctionsStatus" TEXT NOT NULL DEFAULT 'not-started', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "BankParticipant_status_idx" ON "BankParticipant"("status")`,
  `CREATE INDEX IF NOT EXISTS "BankParticipant_participantType_idx" ON "BankParticipant"("participantType")`,
  `CREATE INDEX IF NOT EXISTS "BankParticipant_jurisdiction_idx" ON "BankParticipant"("jurisdiction")`,
  `CREATE INDEX IF NOT EXISTS "BankParticipant_createdAt_idx" ON "BankParticipant"("createdAt")`,
  `CREATE TABLE IF NOT EXISTS "ReserveHolding" ("id" TEXT PRIMARY KEY NOT NULL, "bankParticipantId" TEXT, "assetClass" TEXT NOT NULL, "assetSymbol" TEXT NOT NULL, "custodyLocation" TEXT, "quantity" TEXT NOT NULL, "unit" TEXT NOT NULL, "marketValueUsd" TEXT NOT NULL, "haircutBps" INTEGER NOT NULL DEFAULT 0, "verifiedAt" DATETIME, "verifiedBy" TEXT, "verificationHash" TEXT, "status" TEXT NOT NULL DEFAULT 'pending', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("bankParticipantId") REFERENCES "BankParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_assetClass_idx" ON "ReserveHolding"("assetClass")`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_assetSymbol_idx" ON "ReserveHolding"("assetSymbol")`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_status_idx" ON "ReserveHolding"("status")`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_createdAt_idx" ON "ReserveHolding"("createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_verifiedAt_idx" ON "ReserveHolding"("verifiedAt")`,
  `CREATE INDEX IF NOT EXISTS "ReserveHolding_bankParticipantId_idx" ON "ReserveHolding"("bankParticipantId")`,
  `CREATE TABLE IF NOT EXISTS "ComplianceScreening" ("id" TEXT PRIMARY KEY NOT NULL, "bankParticipantId" TEXT, "screeningType" TEXT NOT NULL, "screeningProvider" TEXT, "inputValue" TEXT NOT NULL, "inputType" TEXT NOT NULL, "result" TEXT NOT NULL, "riskScore" INTEGER, "matchCount" INTEGER NOT NULL DEFAULT 0, "matchedEntities" TEXT, "screenedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "screenedBy" TEXT, "expiresAt" DATETIME, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("bankParticipantId") REFERENCES "BankParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS "ComplianceScreening_screeningType_idx" ON "ComplianceScreening"("screeningType")`,
  `CREATE INDEX IF NOT EXISTS "ComplianceScreening_result_idx" ON "ComplianceScreening"("result")`,
  `CREATE INDEX IF NOT EXISTS "ComplianceScreening_screenedAt_idx" ON "ComplianceScreening"("screenedAt")`,
  `CREATE INDEX IF NOT EXISTS "ComplianceScreening_expiresAt_idx" ON "ComplianceScreening"("expiresAt")`,
  `CREATE INDEX IF NOT EXISTS "ComplianceScreening_bankParticipantId_idx" ON "ComplianceScreening"("bankParticipantId")`,
  `CREATE TABLE IF NOT EXISTS "GovernanceProposal" ("id" TEXT PRIMARY KEY NOT NULL, "proposalType" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "proposerAddress" TEXT NOT NULL, "proposerRole" TEXT NOT NULL, "proposalHash" TEXT NOT NULL UNIQUE, "actionsJson" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "quorumRequired" INTEGER NOT NULL DEFAULT 5, "approvalRequired" INTEGER NOT NULL DEFAULT 4, "maxSeverity" TEXT NOT NULL DEFAULT 'low', "validUntil" DATETIME NOT NULL, "proposedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "votingOpensAt" DATETIME, "votingClosesAt" DATETIME, "executedAt" DATETIME, "executedBy" TEXT, "executionTxHash" TEXT, "approvalsJson" TEXT NOT NULL DEFAULT '[]', "rejectionsJson" TEXT NOT NULL DEFAULT '[]', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS "GovernanceProposal_status_idx" ON "GovernanceProposal"("status")`,
  `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposalType_idx" ON "GovernanceProposal"("proposalType")`,
  `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposedAt_idx" ON "GovernanceProposal"("proposedAt")`,
  `CREATE INDEX IF NOT EXISTS "GovernanceProposal_validUntil_idx" ON "GovernanceProposal"("validUntil")`,
  `CREATE INDEX IF NOT EXISTS "GovernanceProposal_proposerAddress_idx" ON "GovernanceProposal"("proposerAddress")`,
]

let __v258SchemaEnsured = false
async function ensureV258Schema(): Promise<void> {
  if (__v258SchemaEnsured) return
  for (const sql of V25_8_SCHEMA_STATEMENTS) {
    await _rawClient.execute(sql)
  }
  __v258SchemaEnsured = true
}

export const bankParticipant = {
  async create(args: {
    data: {
      legalName: string
      swiftCode?: string | null
      jurisdiction: string
      participantType: string
      regulatoryId?: string | null
      onboardedBy?: string | null
      status?: string
      contactName?: string | null
      contactEmail?: string | null
      contactPhone?: string | null
      kycStatus?: string
      amlStatus?: string
      sanctionsStatus?: string
      notes?: string | null
    }
    select?: { id?: boolean; createdAt?: boolean; updatedAt?: boolean }
  }): Promise<BankParticipant> {
    await ensureSchema()
    await ensureV258Schema()
    const id = generateId()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "BankParticipant"
            ("id","legalName","swiftCode","jurisdiction","participantType","regulatoryId","onboardedBy","status","contactName","contactEmail","contactPhone","kycStatus","amlStatus","sanctionsStatus","notes")
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
      args: [
        id,
        args.data.legalName,
        args.data.swiftCode ?? null,
        args.data.jurisdiction,
        args.data.participantType,
        args.data.regulatoryId ?? null,
        args.data.onboardedBy ?? null,
        args.data.status ?? 'pending',
        args.data.contactName ?? null,
        args.data.contactEmail ?? null,
        args.data.contactPhone ?? null,
        args.data.kycStatus ?? 'not-started',
        args.data.amlStatus ?? 'not-started',
        args.data.sanctionsStatus ?? 'not-started',
        args.data.notes ?? null,
      ],
    })
    return rowToBankParticipant(result.rows[0])
  },

  async findMany(args: {
    where?: { status?: string; participantType?: string; jurisdiction?: string }
    orderBy?: { createdAt?: "asc" | "desc" }
    take?: number
    skip?: number
  }): Promise<BankParticipant[]> {
    await ensureSchema()
    await ensureV258Schema()
    const order = args.orderBy?.createdAt === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 100
    const offset = args.skip ?? 0

    const conditions: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (args.where?.participantType) { conditions.push(`"participantType" = ?`); sqlArgs.push(args.where.participantType) }
    if (args.where?.jurisdiction) { conditions.push(`"jurisdiction" = ?`); sqlArgs.push(args.where.jurisdiction) }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const result = await _rawClient.execute({
      sql: `SELECT * FROM "BankParticipant" ${where} ORDER BY "createdAt" ${order} LIMIT ? OFFSET ?`,
      args: [...sqlArgs, limit, offset],
    })
    return result.rows.map(rowToBankParticipant)
  },

  async count(args?: { where?: { status?: string; participantType?: string } }): Promise<number> {
    await ensureSchema()
    await ensureV258Schema()
    let sql = `SELECT COUNT(*) as c FROM "BankParticipant"`
    const sqlArgs: (string | number)[] = []
    const conditions: string[] = []
    if (args?.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (args?.where?.participantType) { conditions.push(`"participantType" = ?`); sqlArgs.push(args.where.participantType) }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return Number(result.rows[0]?.c ?? 0)
  },
}

export const reserveHolding = {
  async create(args: {
    data: {
      bankParticipantId?: string | null
      assetClass: string
      assetSymbol: string
      custodyLocation?: string | null
      quantity: string  // BigDecimal-safe string transport
      unit: string
      marketValueUsd: string  // BigDecimal-safe string transport
      haircutBps?: number
      verifiedAt?: Date | null
      verifiedBy?: string | null
      verificationHash?: string | null
      status?: string
      notes?: string | null
    }
  }): Promise<ReserveHolding> {
    await ensureSchema()
    await ensureV258Schema()
    const id = generateId()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "ReserveHolding"
            ("id","bankParticipantId","assetClass","assetSymbol","custodyLocation","quantity","unit","marketValueUsd","haircutBps","verifiedAt","verifiedBy","verificationHash","status","notes")
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
      args: [
        id,
        args.data.bankParticipantId ?? null,
        args.data.assetClass,
        args.data.assetSymbol,
        args.data.custodyLocation ?? null,
        args.data.quantity,
        args.data.unit,
        args.data.marketValueUsd,
        args.data.haircutBps ?? 0,
        args.data.verifiedAt ? args.data.verifiedAt.toISOString() : null,
        args.data.verifiedBy ?? null,
        args.data.verificationHash ?? null,
        args.data.status ?? 'pending',
        args.data.notes ?? null,
      ],
    })
    return rowToReserveHolding(result.rows[0])
  },

  async findMany(args: {
    where?: { assetClass?: string; status?: string; assetSymbol?: string; bankParticipantId?: string }
    orderBy?: { createdAt?: "asc" | "desc" }
    take?: number
    skip?: number
  }): Promise<ReserveHolding[]> {
    await ensureSchema()
    await ensureV258Schema()
    const order = args.orderBy?.createdAt === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 100
    const offset = args.skip ?? 0

    const conditions: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.where?.assetClass) { conditions.push(`"assetClass" = ?`); sqlArgs.push(args.where.assetClass) }
    if (args.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (args.where?.assetSymbol) { conditions.push(`"assetSymbol" = ?`); sqlArgs.push(args.where.assetSymbol) }
    if (args.where?.bankParticipantId) { conditions.push(`"bankParticipantId" = ?`); sqlArgs.push(args.where.bankParticipantId) }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const result = await _rawClient.execute({
      sql: `SELECT * FROM "ReserveHolding" ${where} ORDER BY "createdAt" ${order} LIMIT ? OFFSET ?`,
      args: [...sqlArgs, limit, offset],
    })
    return result.rows.map(rowToReserveHolding)
  },

  async count(args?: { where?: { assetClass?: string; status?: string } }): Promise<number> {
    await ensureSchema()
    await ensureV258Schema()
    let sql = `SELECT COUNT(*) as c FROM "ReserveHolding"`
    const sqlArgs: (string | number)[] = []
    const conditions: string[] = []
    if (args?.where?.assetClass) { conditions.push(`"assetClass" = ?`); sqlArgs.push(args.where.assetClass) }
    if (args?.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return Number(result.rows[0]?.c ?? 0)
  },
}

export const complianceScreening = {
  async create(args: {
    data: {
      bankParticipantId?: string | null
      screeningType: string
      screeningProvider?: string | null
      inputValue: string
      inputType: string
      result: string
      riskScore?: number | null
      matchCount?: number
      matchedEntities?: string | null
      screenedBy?: string | null
      expiresAt?: Date | null
      notes?: string | null
    }
  }): Promise<ComplianceScreening> {
    await ensureSchema()
    await ensureV258Schema()
    const id = generateId()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "ComplianceScreening"
            ("id","bankParticipantId","screeningType","screeningProvider","inputValue","inputType","result","riskScore","matchCount","matchedEntities","screenedBy","expiresAt","notes")
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
      args: [
        id,
        args.data.bankParticipantId ?? null,
        args.data.screeningType,
        args.data.screeningProvider ?? null,
        args.data.inputValue,
        args.data.inputType,
        args.data.result,
        args.data.riskScore ?? null,
        args.data.matchCount ?? 0,
        args.data.matchedEntities ?? null,
        args.data.screenedBy ?? null,
        args.data.expiresAt ? args.data.expiresAt.toISOString() : null,
        args.data.notes ?? null,
      ],
    })
    return rowToComplianceScreening(result.rows[0])
  },

  async findMany(args: {
    where?: { screeningType?: string; result?: string; bankParticipantId?: string }
    orderBy?: { screenedAt?: "asc" | "desc" }
    take?: number
    skip?: number
  }): Promise<ComplianceScreening[]> {
    await ensureSchema()
    await ensureV258Schema()
    const order = args.orderBy?.screenedAt === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 100
    const offset = args.skip ?? 0

    const conditions: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.where?.screeningType) { conditions.push(`"screeningType" = ?`); sqlArgs.push(args.where.screeningType) }
    if (args.where?.result) { conditions.push(`"result" = ?`); sqlArgs.push(args.where.result) }
    if (args.where?.bankParticipantId) { conditions.push(`"bankParticipantId" = ?`); sqlArgs.push(args.where.bankParticipantId) }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const result = await _rawClient.execute({
      sql: `SELECT * FROM "ComplianceScreening" ${where} ORDER BY "screenedAt" ${order} LIMIT ? OFFSET ?`,
      args: [...sqlArgs, limit, offset],
    })
    return result.rows.map(rowToComplianceScreening)
  },

  async count(args?: { where?: { screeningType?: string; result?: string } }): Promise<number> {
    await ensureSchema()
    await ensureV258Schema()
    let sql = `SELECT COUNT(*) as c FROM "ComplianceScreening"`
    const sqlArgs: (string | number)[] = []
    const conditions: string[] = []
    if (args?.where?.screeningType) { conditions.push(`"screeningType" = ?`); sqlArgs.push(args.where.screeningType) }
    if (args?.where?.result) { conditions.push(`"result" = ?`); sqlArgs.push(args.where.result) }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return Number(result.rows[0]?.c ?? 0)
  },
}

export const governanceProposal = {
  async create(args: {
    data: {
      proposalType: string
      title: string
      description: string
      proposerAddress: string
      proposerRole: string
      proposalHash: string
      actionsJson: string  // JSON array of proposed actions
      status?: string
      quorumRequired?: number
      approvalRequired?: number
      maxSeverity?: string
      validUntil: Date
      votingOpensAt?: Date | null
      votingClosesAt?: Date | null
      approvalsJson?: string  // default "[]"
      rejectionsJson?: string  // default "[]"
      notes?: string | null
    }
  }): Promise<GovernanceProposal> {
    await ensureSchema()
    await ensureV258Schema()
    const id = generateId()
    const result = await _rawClient.execute({
      sql: `INSERT INTO "GovernanceProposal"
            ("id","proposalType","title","description","proposerAddress","proposerRole","proposalHash","actionsJson","status","quorumRequired","approvalRequired","maxSeverity","validUntil","votingOpensAt","votingClosesAt","approvalsJson","rejectionsJson","notes")
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING *`,
      args: [
        id,
        args.data.proposalType,
        args.data.title,
        args.data.description,
        args.data.proposerAddress,
        args.data.proposerRole,
        args.data.proposalHash,
        args.data.actionsJson,
        args.data.status ?? 'draft',
        args.data.quorumRequired ?? 5,
        args.data.approvalRequired ?? 4,
        args.data.maxSeverity ?? 'low',
        args.data.validUntil.toISOString(),
        args.data.votingOpensAt ? args.data.votingOpensAt.toISOString() : null,
        args.data.votingClosesAt ? args.data.votingClosesAt.toISOString() : null,
        args.data.approvalsJson ?? '[]',
        args.data.rejectionsJson ?? '[]',
        args.data.notes ?? null,
      ],
    })
    return rowToGovernanceProposal(result.rows[0])
  },

  async findMany(args: {
    where?: { status?: string; proposalType?: string; proposerAddress?: string }
    orderBy?: { proposedAt?: "asc" | "desc" }
    take?: number
    skip?: number
  }): Promise<GovernanceProposal[]> {
    await ensureSchema()
    await ensureV258Schema()
    const order = args.orderBy?.proposedAt === "asc" ? "ASC" : "DESC"
    const limit = args.take ?? 50
    const offset = args.skip ?? 0

    const conditions: string[] = []
    const sqlArgs: (string | number)[] = []
    if (args.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (args.where?.proposalType) { conditions.push(`"proposalType" = ?`); sqlArgs.push(args.where.proposalType) }
    if (args.where?.proposerAddress) { conditions.push(`"proposerAddress" = ?`); sqlArgs.push(args.where.proposerAddress) }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""

    const result = await _rawClient.execute({
      sql: `SELECT * FROM "GovernanceProposal" ${where} ORDER BY "proposedAt" ${order} LIMIT ? OFFSET ?`,
      args: [...sqlArgs, limit, offset],
    })
    return result.rows.map(rowToGovernanceProposal)
  },

  async count(args?: { where?: { status?: string; proposalType?: string } }): Promise<number> {
    await ensureSchema()
    await ensureV258Schema()
    let sql = `SELECT COUNT(*) as c FROM "GovernanceProposal"`
    const sqlArgs: (string | number)[] = []
    const conditions: string[] = []
    if (args?.where?.status) { conditions.push(`"status" = ?`); sqlArgs.push(args.where.status) }
    if (args?.where?.proposalType) { conditions.push(`"proposalType" = ?`); sqlArgs.push(args.where.proposalType) }
    if (conditions.length) sql += ` WHERE ${conditions.join(" AND ")}`
    const result = await _rawClient.execute({ sql, args: sqlArgs })
    return Number(result.rows[0]?.c ?? 0)
  },
}

/* ---- Row mappers for v25.8 architectural models ---- */

function rowToBankParticipant(row: Record<string, unknown>): BankParticipant {
  return {
    id: row.id as string,
    legalName: row.legalName as string,
    swiftCode: (row.swiftCode ?? null) as string | null,
    jurisdiction: row.jurisdiction as string,
    participantType: row.participantType as string,
    regulatoryId: (row.regulatoryId ?? null) as string | null,
    onboardedAt: new Date(row.onboardedAt as string),
    onboardedBy: (row.onboardedBy ?? null) as string | null,
    status: row.status as string,
    contactName: (row.contactName ?? null) as string | null,
    contactEmail: (row.contactEmail ?? null) as string | null,
    contactPhone: (row.contactPhone ?? null) as string | null,
    kycStatus: row.kycStatus as string,
    amlStatus: row.amlStatus as string,
    sanctionsStatus: row.sanctionsStatus as string,
    notes: (row.notes ?? null) as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  }
}

function rowToReserveHolding(row: Record<string, unknown>): ReserveHolding {
  return {
    id: row.id as string,
    bankParticipantId: (row.bankParticipantId ?? null) as string | null,
    assetClass: row.assetClass as string,
    assetSymbol: row.assetSymbol as string,
    custodyLocation: (row.custodyLocation ?? null) as string | null,
    quantity: row.quantity as string,  // TEXT-stored BigDecimal string
    unit: row.unit as string,
    marketValueUsd: row.marketValueUsd as string,  // TEXT-stored BigDecimal string
    haircutBps: Number(row.haircutBps ?? 0),
    verifiedAt: row.verifiedAt != null ? new Date(row.verifiedAt as string) : null,
    verifiedBy: (row.verifiedBy ?? null) as string | null,
    verificationHash: (row.verificationHash ?? null) as string | null,
    status: row.status as string,
    notes: (row.notes ?? null) as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  }
}

function rowToComplianceScreening(row: Record<string, unknown>): ComplianceScreening {
  return {
    id: row.id as string,
    bankParticipantId: (row.bankParticipantId ?? null) as string | null,
    screeningType: row.screeningType as string,
    screeningProvider: (row.screeningProvider ?? null) as string | null,
    inputValue: row.inputValue as string,
    inputType: row.inputType as string,
    result: row.result as string,
    riskScore: row.riskScore != null ? Number(row.riskScore) : null,
    matchCount: Number(row.matchCount ?? 0),
    matchedEntities: (row.matchedEntities ?? null) as string | null,
    screenedAt: new Date(row.screenedAt as string),
    screenedBy: (row.screenedBy ?? null) as string | null,
    expiresAt: row.expiresAt != null ? new Date(row.expiresAt as string) : null,
    notes: (row.notes ?? null) as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
  }
}

function rowToGovernanceProposal(row: Record<string, unknown>): GovernanceProposal {
  return {
    id: row.id as string,
    proposalType: row.proposalType as string,
    title: row.title as string,
    description: row.description as string,
    proposerAddress: row.proposerAddress as string,
    proposerRole: row.proposerRole as string,
    proposalHash: row.proposalHash as string,
    actionsJson: row.actionsJson as string,
    status: row.status as string,
    quorumRequired: Number(row.quorumRequired ?? 5),
    approvalRequired: Number(row.approvalRequired ?? 4),
    maxSeverity: row.maxSeverity as string,
    validUntil: new Date(row.validUntil as string),
    proposedAt: new Date(row.proposedAt as string),
    votingOpensAt: row.votingOpensAt != null ? new Date(row.votingOpensAt as string) : null,
    votingClosesAt: row.votingClosesAt != null ? new Date(row.votingClosesAt as string) : null,
    executedAt: row.executedAt != null ? new Date(row.executedAt as string) : null,
    executedBy: (row.executedBy ?? null) as string | null,
    executionTxHash: (row.executionTxHash ?? null) as string | null,
    approvalsJson: (row.approvalsJson ?? '[]') as string,
    rejectionsJson: (row.rejectionsJson ?? '[]') as string,
    notes: (row.notes ?? null) as string | null,
    createdAt: new Date(row.createdAt as string),
    updatedAt: new Date(row.updatedAt as string),
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
  proofAttestation,
  assumptionsRegister,
  // v25.8 architectural models (per F1 gap analysis)
  bankParticipant,
  reserveHolding,
  complianceScreening,
  governanceProposal,
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

/* ---- Data Source Observation persistence (provenance tracking) ----
 * Persists raw observations retrieved from external data sources (IMF COFER,
 * BIS Triennial Survey, SWIFT RMB Tracker, FRED VIX/spreads, etc.) to the
 * `DataSourceObservation` table. The table is created idempotently in
 * CHAPTER_XX_SCHEMA_STATEMENTS (see ensureChapterXxSchema) — this module
 * just provides insert + query helpers on top of it.
 *
 * Ingestion is idempotent: INSERT OR IGNORE respects the unique index
 * `DataSourceObs_unique_idx` on (provider, dataset, series_key,
 * reference_period, dataset_version), so re-running the same ingestion
 * pipeline multiple times will not produce duplicate rows.
 */

export interface DataSourceObservationRecord {
  id: string
  provider: string
  dataset: string
  series_key?: string
  reference_period?: string
  frequency?: string
  value: string
  unit?: string
  source_url?: string
  access_method?: string
  retrieved_at: string
  published_at?: string
  revision_number?: number
  methodology_version?: string
  dataset_version?: string
  raw_payload_hash?: string
  ingestion_run_id?: string
}

/**
 * Persist a single data-source observation. Idempotent — INSERT OR IGNORE
 * relies on the unique index to dedupe. Does NOT throw on duplicate; the
 * existing row is left untouched.
 */
export async function persistDataSourceObservation(
  obs: DataSourceObservationRecord,
): Promise<void> {
  await ensureSchema()
  await ensureChapterXxSchema()
  await _rawClient.execute({
    sql: `INSERT OR IGNORE INTO "DataSourceObservation"
      ("id", "provider", "dataset", "series_key", "reference_period", "frequency", "value", "unit", "source_url", "access_method", "retrieved_at", "published_at", "revision_number", "methodology_version", "dataset_version", "raw_payload_hash", "ingestion_run_id")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      obs.id,
      obs.provider,
      obs.dataset,
      obs.series_key ?? null,
      obs.reference_period ?? null,
      obs.frequency ?? null,
      obs.value,
      obs.unit ?? null,
      obs.source_url ?? null,
      obs.access_method ?? null,
      obs.retrieved_at,
      obs.published_at ?? null,
      obs.revision_number ?? null,
      obs.methodology_version ?? null,
      obs.dataset_version ?? null,
      obs.raw_payload_hash ?? null,
      obs.ingestion_run_id ?? null,
    ],
  })
}

/**
 * Query persisted data-source observations, optionally filtered by
 * provider and/or dataset. Results are ordered by retrieved_at DESC
 * (most recent first). An optional limit caps the row count.
 */
export async function getDataSourceObservations(
  provider?: string,
  dataset?: string,
  limit?: number,
): Promise<DataSourceObservationRecord[]> {
  await ensureSchema()
  await ensureChapterXxSchema()
  let sql = `SELECT * FROM "DataSourceObservation"`
  const args: Array<string | number> = []
  if (provider) {
    sql += ` WHERE "provider" = ?`
    args.push(provider)
    if (dataset) {
      sql += ` AND "dataset" = ?`
      args.push(dataset)
    }
  }
  sql += ` ORDER BY "retrieved_at" DESC`
  if (limit) sql += ` LIMIT ${limit}`
  const result = await _rawClient.execute({ sql, args })
  return result.rows as unknown as DataSourceObservationRecord[]
}
