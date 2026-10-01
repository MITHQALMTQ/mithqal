/**
 * Turso → Neon CDC Sync (CR-2026-026 / v25.3.22)
 * ==============================================
 *
 * DESIGN-TIME MECHANISM — NOT PRODUCTION-AUTHORIZED.
 *
 *   This module is a DESIGN-TIME mechanism for analytics. Not production-
 *   authorized. It is a one-shot, full-table copy of Turso tables into a
 *   Neon Postgres database. It is NOT a streaming CDC — it does not
 *   tail the libsql WAL, it does not capture deletes, and it does not
 *   preserve cross-row transactional ordering. The intended use is a
 *   scheduled full-refresh of an analytics replica so business-intelligence
 *   queries run against Postgres without hammering the operational
 *   libsql/Turso database.
 *
 *   Operators must explicitly authorise each invocation via the
 *   admin-only API route `POST /api/admin/sync-to-neon`. There is no
 *   automatic schedule here — the Inngest cron layer (see
 *   `src/lib/inngest-client.ts`) is the proper home for any future
 *   scheduling, and adding that wiring is itself a separate change
 *   request.
 *
 * Why this lives here (and not inside `db.ts`):
 *   `db.ts` is the SYSTEM-OF-RECORD client for the operational database
 *   (Turso / libsql). It is intentionally single-backend: it has a Neon
 *   *fallback* adapter (for resilience), but never a Neon *replica*.
 *   Keeping the analytics-replica logic in a separate module preserves
 *   the single-responsibility contract on `db.ts` and keeps the
 *   analytics sync trivially greppable for auditors ("every write into
 *   Neon from anywhere other than db.ts goes through turso-neon-sync").
 *
 * Graceful degradation:
 *   - If `NEON_DATABASE_URL` is unset → returns `{ synced: 0, errors:
 *     ["Neon not configured"] }` for every table. The caller can
 *     distinguish "Neon not configured" from a real failure by checking
 *     the errors string.
 *   - If the Turso read fails (transient libsql error) → that table's
 *     summary records the error, but other tables continue.
 *   - If the Neon upsert for one row fails → that row's error is
 *     captured but the batch continues. (We surface up to N errors per
 *     table to avoid an unbounded error list on a wholesale-type
 *     mismatch.)
 *
 * Type mapping (SQLite → Postgres):
 *   TEXT      → TEXT
 *   INTEGER   → BIGINT
 *   REAL      → DOUBLE PRECISION
 *   DATETIME  → TIMESTAMPTZ
 *   BLOB      → BYTEA  (not used by the current schema)
 *
 *   All values are coerced to a Postgres-safe wire shape before the
 *   INSERT parameter is bound. The coercion is intentionally lossy on
 *   unknown shapes (falls back to JSON.stringify) so the sync never
 *   throws on a single bad row.
 */

import { createClient, type Row } from "@libsql/client";

// ---------------------------------------------------------------------------
// Table registry
//
// The Turso schema is defined in `src/lib/db.ts` (the canonical CREATE TABLE
// statements are in `CHAPTER_XX_SCHEMA_STATEMENTS` / `V25_8_SCHEMA_STATEMENTS`
// / the legacy `ensureSchema` array). Each Turso table is mirrored here with:
//   - its (single- or multi-column) primary key — used for the ON CONFLICT
//     clause in the upsert;
//   - its column list with the SQLite type → Postgres type mapping.
//
// The task spec said "17 Turso tables"; the actual schema has 19. We sync
// all 19 here. The discrepancy is honestly noted in the worklog entry for
// task 4-C.
// ---------------------------------------------------------------------------

type PgType = "TEXT" | "BIGINT" | "DOUBLE PRECISION" | "TIMESTAMPTZ" | "BYTEA" | "JSONB";

interface TableColumn {
  name: string;
  pgType: PgType;
  /** True if the column participates in the PRIMARY KEY constraint. */
  isPk?: boolean;
}

interface TableDef {
  /** Exact Turso table name (case-sensitive — Turso is case-insensitive, but Neon Postgres is NOT). */
  name: string;
  columns: TableColumn[];
}

// Helper to keep the registry terse.
const PK = (name: string, pgType: PgType): TableColumn => ({ name, pgType, isPk: true });
const C = (name: string, pgType: PgType): TableColumn => ({ name, pgType });

const TURSO_TABLES: TableDef[] = [
  {
    name: "FormationInterest",
    columns: [
      PK("id", "TEXT"),
      C("fullName", "TEXT"),
      C("email", "TEXT"),
      C("org", "TEXT"),
      C("role", "TEXT"),
      C("message", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "TestnetOperation",
    columns: [
      PK("id", "TEXT"),
      C("type", "TEXT"),
      C("amountUsd", "DOUBLE PRECISION"),
      C("mtq", "DOUBLE PRECISION"),
      C("participant", "TEXT"),
      C("nav", "DOUBLE PRECISION"),
      C("reserveRatio", "DOUBLE PRECISION"),
      C("porHash", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "users",
    columns: [
      PK("id", "BIGINT"),
      C("address", "TEXT"),
      C("email", "TEXT"),
      C("registered_at", "BIGINT"),
    ],
  },
  {
    name: "transactions",
    columns: [
      PK("id", "BIGINT"),
      C("tx_hash", "TEXT"),
      C("type", "TEXT"),
      C("from_address", "TEXT"),
      C("to_address", "TEXT"),
      C("amount", "TEXT"),
      C("fee", "TEXT"),
      C("block_number", "BIGINT"),
      C("timestamp", "BIGINT"),
    ],
  },
  {
    name: "reserves",
    columns: [
      PK("id", "BIGINT"),
      C("asset_type", "TEXT"),
      C("amount", "TEXT"),
      C("value_usd", "TEXT"),
      C("timestamp", "BIGINT"),
    ],
  },
  {
    name: "fees",
    columns: [
      PK("id", "BIGINT"),
      C("tx_hash", "TEXT"),
      C("fee_type", "TEXT"),
      C("amount", "TEXT"),
      C("collected_at", "BIGINT"),
    ],
  },
  {
    name: "proposals",
    columns: [
      PK("id", "BIGINT"),
      C("proposal_id", "BIGINT"),
      C("title", "TEXT"),
      C("description", "TEXT"),
      C("status", "TEXT"),
      C("created_at", "BIGINT"),
    ],
  },
  {
    name: "GoldPriceSnapshot",
    columns: [
      PK("date", "TEXT"),
      C("goldUsd", "DOUBLE PRECISION"),
      C("fxRates", "JSONB"),
      C("updatedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "ProofAttestation",
    columns: [
      PK("id", "BIGINT"),
      C("date", "TEXT"),
      C("proofType", "TEXT"),
      C("value", "DOUBLE PRECISION"),
      C("hash", "TEXT"),
      C("timestamp", "BIGINT"),
    ],
  },
  {
    name: "AssumptionsRegister",
    columns: [
      PK("id", "BIGINT"),
      C("entryId", "TEXT"),
      C("simulationType", "TEXT"),
      C("randomSeed", "BIGINT"),
      C("inputAssumptions", "JSONB"),
      C("economicAssumptions", "JSONB"),
      C("liquidityAssumptions", "JSONB"),
      C("correlationAssumptions", "JSONB"),
      C("marketConditions", "JSONB"),
      C("timeHorizon", "TEXT"),
      C("confidenceLevel", "DOUBLE PRECISION"),
      C("simulationVersion", "TEXT"),
      C("softwareVersion", "TEXT"),
      C("date", "TEXT"),
      C("author", "TEXT"),
      C("approval", "TEXT"),
      C("auditSignature", "TEXT"),
      C("summary", "TEXT"),
      C("createdAt", "BIGINT"),
    ],
  },
  {
    name: "ProcurementRecord",
    columns: [
      PK("id", "TEXT"),
      C("asset", "TEXT"),
      C("amountUsd", "DOUBLE PRECISION"),
      C("quantity", "DOUBLE PRECISION"),
      C("currentStage", "TEXT"),
      C("stageHistory", "JSONB"),
      C("benchmark", "TEXT"),
      C("bestExecution", "TEXT"),
      C("dealer", "TEXT"),
      C("executionPrice", "DOUBLE PRECISION"),
      C("savings", "DOUBLE PRECISION"),
      C("complianceResult", "TEXT"),
      C("auditId", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
      C("completedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "RevenueEntry",
    columns: [
      PK("id", "TEXT"),
      C("entity", "TEXT"),
      C("category", "TEXT"),
      C("amountUsd", "DOUBLE PRECISION"),
      C("transactionRef", "TEXT"),
      C("description", "TEXT"),
      C("timestamp", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "CommercialAuditEntry",
    columns: [
      PK("auditId", "TEXT"),
      C("timestamp", "TIMESTAMPTZ"),
      C("entity", "TEXT"),
      C("approver", "TEXT"),
      C("transactionRef", "TEXT"),
      C("revenueAmount", "DOUBLE PRECISION"),
      C("benefitDistribution", "JSONB"),
      C("complianceResult", "BIGINT"),
      C("complianceScore", "DOUBLE PRECISION"),
      C("digitalSignature", "TEXT"),
    ],
  },
  {
    name: "ReserveOwnership",
    columns: [
      PK("id", "BIGINT"),
      C("assetClass", "TEXT"),
      C("ownerEntity", "TEXT"),
      C("custodian", "TEXT"),
      C("amount", "DOUBLE PRECISION"),
      C("valueUsd", "DOUBLE PRECISION"),
      C("verified", "BIGINT"),
      C("lastVerifiedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "BankParticipant",
    columns: [
      PK("id", "TEXT"),
      C("legalName", "TEXT"),
      C("swiftCode", "TEXT"),
      C("jurisdiction", "TEXT"),
      C("participantType", "TEXT"),
      C("regulatoryId", "TEXT"),
      C("onboardedAt", "TIMESTAMPTZ"),
      C("onboardedBy", "TEXT"),
      C("status", "TEXT"),
      C("contactName", "TEXT"),
      C("contactEmail", "TEXT"),
      C("contactPhone", "TEXT"),
      C("kycStatus", "TEXT"),
      C("amlStatus", "TEXT"),
      C("sanctionsStatus", "TEXT"),
      C("notes", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
      C("updatedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "ReserveHolding",
    columns: [
      PK("id", "TEXT"),
      C("bankParticipantId", "TEXT"),
      C("assetClass", "TEXT"),
      C("assetSymbol", "TEXT"),
      C("custodyLocation", "TEXT"),
      C("quantity", "TEXT"),
      C("unit", "TEXT"),
      C("marketValueUsd", "TEXT"),
      C("haircutBps", "BIGINT"),
      C("verifiedAt", "TIMESTAMPTZ"),
      C("verifiedBy", "TEXT"),
      C("verificationHash", "TEXT"),
      C("status", "TEXT"),
      C("notes", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
      C("updatedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "ComplianceScreening",
    columns: [
      PK("id", "TEXT"),
      C("bankParticipantId", "TEXT"),
      C("screeningType", "TEXT"),
      C("screeningProvider", "TEXT"),
      C("inputValue", "TEXT"),
      C("inputType", "TEXT"),
      C("result", "TEXT"),
      C("riskScore", "BIGINT"),
      C("matchCount", "BIGINT"),
      C("matchedEntities", "TEXT"),
      C("screenedAt", "TIMESTAMPTZ"),
      C("screenedBy", "TEXT"),
      C("expiresAt", "TIMESTAMPTZ"),
      C("notes", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
      C("updatedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "GovernanceProposal",
    columns: [
      PK("id", "TEXT"),
      C("proposalType", "TEXT"),
      C("title", "TEXT"),
      C("description", "TEXT"),
      C("proposerAddress", "TEXT"),
      C("proposerRole", "TEXT"),
      C("proposalHash", "TEXT"),
      C("actionsJson", "JSONB"),
      C("status", "TEXT"),
      C("quorumRequired", "BIGINT"),
      C("approvalRequired", "BIGINT"),
      C("maxSeverity", "TEXT"),
      C("validUntil", "TIMESTAMPTZ"),
      C("proposedAt", "TIMESTAMPTZ"),
      C("votingOpensAt", "TIMESTAMPTZ"),
      C("votingClosesAt", "TIMESTAMPTZ"),
      C("executedAt", "TIMESTAMPTZ"),
      C("executedBy", "TEXT"),
      C("executionTxHash", "TEXT"),
      C("approvalsJson", "JSONB"),
      C("rejectionsJson", "JSONB"),
      C("notes", "TEXT"),
      C("createdAt", "TIMESTAMPTZ"),
      C("updatedAt", "TIMESTAMPTZ"),
    ],
  },
  {
    name: "DataSourceObservation",
    columns: [
      PK("id", "TEXT"),
      C("provider", "TEXT"),
      C("dataset", "TEXT"),
      C("series_key", "TEXT"),
      C("reference_period", "TEXT"),
      C("frequency", "TEXT"),
      C("value", "TEXT"),
      C("unit", "TEXT"),
      C("source_url", "TEXT"),
      C("access_method", "TEXT"),
      C("retrieved_at", "TIMESTAMPTZ"),
      C("published_at", "TIMESTAMPTZ"),
      C("revision_number", "BIGINT"),
      C("methodology_version", "TEXT"),
      C("dataset_version", "TEXT"),
      C("raw_payload_hash", "TEXT"),
      C("ingestion_run_id", "TEXT"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TableSyncResult {
  table: string;
  /** Number of rows successfully upserted into Neon. */
  synced: number;
  /** Total rows read from Turso for this table. */
  readFromTurso: number;
  /** Per-row errors captured during the upsert (capped at 20 per table). */
  errors: string[];
  /** Wall-clock duration in milliseconds. */
  durationMs: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cap per-table errors so a wholesale-type mismatch can't OOM the response. */
const MAX_ERRORS_PER_TABLE = 20;

function quoteIdent(name: string): string {
  // Postgres identifier quoting: doubles any embedded double-quote.
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Coerce a libsql row value to a Postgres-compatible bind parameter.
 * Postgres (via the Neon HTTP driver) accepts most JS primitives directly.
 * Special cases:
 *   - bigint   → string   (the HTTP wire format is more reliable that way)
 *   - Uint8Array / ArrayBuffer → keep as-is (Neon handles bytea)
 *   - Date     → ISO 8601 string (so timestamptz columns parse correctly)
 *   - object   → JSON string when the target column is JSONB, else stringify
 *   - undefined → null (defensive — libsql doesn't return undefined, but TS)
 */
function coercePgValue(v: unknown, targetPgType: PgType): unknown {
  if (v === null || v === undefined) return null;
  switch (typeof v) {
    case "string":
      // For JSONB columns, libsql stored the value as a TEXT-encoded JSON
      // string. We pass the string straight through — Postgres will parse
      // it on the JSONB column.
      return v;
    case "number":
      return v;
    case "boolean":
      // SQLite stores booleans as 0/1 integers — Neon accepts booleans on
      // boolean columns but our schema maps to BIGINT, so coerce to number.
      return v ? 1 : 0;
    case "bigint":
      return v.toString();
    case "object":
      if (v instanceof Date) return v.toISOString();
      if (v instanceof Uint8Array || v instanceof ArrayBuffer) return v;
      if (targetPgType === "JSONB") {
        try {
          return JSON.stringify(v);
        } catch {
          return null;
        }
      }
      // Unknown object shape — fall back to JSON string so the row
      // doesn't crash the batch. Surfaces as a TEXT column value.
      try {
        return JSON.stringify(v);
      } catch {
        return null;
      }
    default:
      // symbol, function — shouldn't happen in DB rows.
      return null;
  }
}

/**
 * Build the Postgres CREATE TABLE IF NOT EXISTS statement for a table def.
 * Mirrors the libsql schema with Postgres types + a PRIMARY KEY constraint
 * over the PK columns. Foreign keys are NOT recreated here — the Neon
 * replica is an analytics surface, not a referential-integrity-enforced
 * operational store. (Re-creating FKs would also create an ordering
 * dependency that would make the sync fragile to schema additions.)
 */
function buildCreateTableSql(def: TableDef): string {
  const colsSql = def.columns
    .map((c) => `${quoteIdent(c.name)} ${c.pgType}${c.isPk ? " NOT NULL" : ""}`)
    .join(",\n  ");
  const pkCols = def.columns.filter((c) => c.isPk).map((c) => quoteIdent(c.name));
  const pkClause = pkCols.length > 0 ? `,\n  PRIMARY KEY (${pkCols.join(", ")})` : "";
  return `CREATE TABLE IF NOT EXISTS ${quoteIdent(def.name)} (\n  ${colsSql}${pkClause}\n)`;
}

/**
 * Build the per-row UPSERT statement.
 *   INSERT INTO "tbl" ("c1","c2",...) VALUES ($1,$2,...)
 *   ON CONFLICT ("pk1","pk2") DO UPDATE SET "c3" = EXCLUDED."c3", ...
 *
 * The PK columns are excluded from the DO UPDATE SET clause (they can't
 * change — they're the conflict target).
 */
function buildUpsertSql(def: TableDef): string {
  const cols = def.columns;
  const colList = cols.map((c) => quoteIdent(c.name)).join(", ");
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
  const pkCols = cols.filter((c) => c.isPk).map((c) => quoteIdent(c.name));
  const nonPkCols = cols.filter((c) => !c.isPk);
  const onConflictSet = nonPkCols.length
    ? nonPkCols.map((c) => `${quoteIdent(c.name)} = EXCLUDED.${quoteIdent(c.name)}`).join(", ")
    : ""; // no non-PK columns — degenerate but valid (PK-only table)
  const onConflictClause = pkCols.length
    ? `ON CONFLICT (${pkCols.join(", ")}) DO ${onConflictSet ? `UPDATE SET ${onConflictSet}` : "NOTHING"}`
    : "";
  return `INSERT INTO ${quoteIdent(def.name)} (${colList}) VALUES (${placeholders})${onConflictClause ? " " + onConflictClause : ""}`;
}

/**
 * Lazily construct a Neon `sql` tagged-template function from
 * `NEON_DATABASE_URL`. Returns `null` if the env var is unset (graceful
 * degradation). The dynamic import keeps `@neondatabase/serverless` out
 * of the cold-start path for routes that never call this module.
 */
async function getNeonSql(): Promise<null | ((s: string, params?: unknown[]) => Promise<unknown[]>)> {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) return null;
  const mod = await import("@neondatabase/serverless");
  const neon = mod.neon;
  if (typeof neon !== "function") {
    throw new Error("[turso-neon-sync] @neondatabase/serverless did not export a 'neon' function");
  }
  const sql = neon(url, { fullResults: false });
  // Wrap so the call site uses the (queryString, params) shape uniformly.
  return (queryStr: string, params?: unknown[]) =>
    sql.query(queryStr, params ?? []) as Promise<unknown[]>;
}

/** Construct a one-shot libsql client for the configured Turso DB. */
function getTursoClient() {
  const url = process.env.DATABASE_URL || "file:./db/custom.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  return createClient({
    url,
    authToken: url.startsWith("file:") ? undefined : authToken,
  });
}

// ---------------------------------------------------------------------------
// Public sync functions
// ---------------------------------------------------------------------------

/**
 * Sync a single Turso table to the Neon Postgres replica.
 *
 * Algorithm:
 *   1. Validate the table name against the registry (defensive — the
 *      admin route always passes a registry name, but a direct caller
 *      might pass a typo).
 *   2. If NEON_DATABASE_URL is unset → return the canonical "not
 *      configured" result (synced: 0, single error string).
 *   3. CREATE TABLE IF NOT EXISTS on Neon (idempotent DDL).
 *   4. SELECT * from Turso.
 *   5. For each row, bind a parameterised UPSERT and execute it.
 *      Capture per-row errors (capped) but do NOT abort the batch.
 *   6. Return the { synced, readFromTurso, errors, durationMs } summary.
 *
 * The function NEVER throws — all failures are captured in `errors`.
 * This makes it safe to call inside Promise.all() in
 * `syncAllTablesToNeon()` without one slow table poisoning the others.
 */
export async function syncTableToNeon(tableName: string): Promise<TableSyncResult> {
  const startedAt = Date.now();
  const baseResult: TableSyncResult = {
    table: tableName,
    synced: 0,
    readFromTurso: 0,
    errors: [],
    durationMs: 0,
  };

  const def = TURSO_TABLES.find((t) => t.name === tableName);
  if (!def) {
    baseResult.errors.push(`Unknown table: "${tableName}" not in the Turso registry`);
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  }

  // ---- Graceful degradation: Neon not configured ----
  const neonUrl = process.env.NEON_DATABASE_URL;
  if (!neonUrl) {
    baseResult.errors.push("Neon not configured");
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  }

  // ---- Construct Neon sql fn (lazy import) ----
  let sql: null | ((s: string, params?: unknown[]) => Promise<unknown[]>);
  try {
    sql = await getNeonSql();
  } catch (err) {
    baseResult.errors.push(
      `Neon driver load failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  }
  if (!sql) {
    baseResult.errors.push("Neon not configured");
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  }

  // ---- Ensure the Neon table exists (idempotent DDL) ----
  try {
    await sql(buildCreateTableSql(def));
  } catch (err) {
    baseResult.errors.push(
      `Neon CREATE TABLE failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  }

  // ---- Read all rows from Turso ----
  const turso = getTursoClient();
  let rows: Row[] = [];
  try {
    // `SELECT *` keeps the sync resilient to column-reorder in the libsql
    // schema — the row's columns are matched by name against the registry.
    // The order returned by libsql matches the CREATE TABLE order, which
    // is the same order the registry declares — so positional binding is
    // safe as long as the registry stays in sync with db.ts.
    const result = await turso.execute({
      sql: `SELECT * FROM ${quoteIdent(def.name)}`,
    });
    rows = result.rows ?? [];
  } catch (err) {
    baseResult.errors.push(
      `Turso SELECT failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    try { await turso.close(); } catch { /* swallow */ }
    baseResult.durationMs = Date.now() - startedAt;
    return baseResult;
  } finally {
    // close in a finally so we don't leak the libsql connection even on a
    // non-throwing read path (e.g., empty result).
    // (If `execute` threw, the close in the catch above already ran.)
  }
  baseResult.readFromTurso = rows.length;

  // ---- Upsert each row ----
  const upsertSql = buildUpsertSql(def);
  let synced = 0;
  for (const row of rows) {
    try {
      const params = def.columns.map((c) =>
        coercePgValue(row[c.name as string | number] as unknown, c.pgType),
      );
      await sql(upsertSql, params);
      synced++;
    } catch (err) {
      if (baseResult.errors.length < MAX_ERRORS_PER_TABLE) {
        const msg = err instanceof Error ? err.message : String(err);
        // Truncate the row preview to keep the error message readable.
        const rowPreview = (() => {
          try {
            const s = JSON.stringify(row);
            return s.length > 200 ? s.slice(0, 200) + "…" : s;
          } catch {
            return "<unserializable row>";
          }
        })();
        baseResult.errors.push(`row upsert failed: ${msg}; row=${rowPreview}`);
      } else if (baseResult.errors.length === MAX_ERRORS_PER_TABLE) {
        baseResult.errors.push(`…(further errors suppressed; cap=${MAX_ERRORS_PER_TABLE})`);
      }
      // Continue to the next row — a single bad row should not abort the
      // whole table sync. The summary's `synced` count is the truth for
      // "rows successfully written".
    }
  }
  baseResult.synced = synced;

  // ---- Close the one-shot Turso client ----
  try { await turso.close(); } catch { /* swallow */ }

  baseResult.durationMs = Date.now() - startedAt;
  return baseResult;
}

/**
 * Sync ALL Turso tables to Neon. Returns one summary per table.
 *
 * Tables are synced concurrently (Promise.all) — the Neon HTTP driver
 * multiplexes requests, and Turso tolerates parallel reads. A single
 * table's failure does NOT abort the others — `syncTableToNeon` never
 * throws, so Promise.all never short-circuits.
 */
export async function syncAllTablesToNeon(): Promise<TableSyncResult[]> {
  return Promise.all(TURSO_TABLES.map((t) => syncTableToNeon(t.name)));
}

// ---------------------------------------------------------------------------
// Export the registry metadata for tests + admin introspection.
// ---------------------------------------------------------------------------

export const TURSO_TABLE_NAMES: string[] = TURSO_TABLES.map((t) => t.name);

export function getTableDef(name: string): TableDef | undefined {
  return TURSO_TABLES.find((t) => t.name === name);
}

export const TURSO_TABLE_COUNT = TURSO_TABLES.length;
