/**
 * MITHQAL — State Persistence Layer (P1-persistence)
 * --------------------------------------------------------------------
 * Persistence layer for the Mithqal reserve engine's critical in-memory
 * state. Mirrors module-level Maps / arrays from:
 *
 *   - execution-engine.ts        → `proposals`, `executionResults`,
 *                                   `turnoverRecords`
 *   - monetary-engine-v19.ts     → `moduleHysteresisState`,
 *                                   `moduleHysteresisPrevWeights`
 *   - reserve-state.ts           → `reserveStateStore`
 *
 * Each save function serializes its payload to JSON and writes it to a
 * single key/value row in the Turso `engine_state` table:
 *
 *   CREATE TABLE IF NOT EXISTS engine_state (
 *     key        TEXT PRIMARY KEY,
 *     value      TEXT NOT NULL,
 *     updated_at TEXT NOT NULL
 *   );
 *
 * Persistence is:
 *   - **Idempotent** — UPSERT (`INSERT OR REPLACE`) so re-saves are safe.
 *   - **Graceful** — every public function catches libsql errors and logs
 *     a `console.warn`; never crashes the caller. Loaders return `null`
 *     on miss / failure so callers can fall back to fresh init.
 *   - **Schema-lazy** — `ensureEngineStateSchema()` runs on first use and
 *     is a no-op on subsequent calls (guarded by a module-level flag).
 *
 * Connection strategy: this module creates its own libsql client (via
 * `@libsql/client`) using the same `DATABASE_URL` / `DATABASE_AUTH_TOKEN`
 * env vars as `src/lib/db.ts`. We do NOT reuse the `db` wrapper because
 * that wrapper does not expose parameterised raw SQL (`$executeRawUnsafe`
 * takes a bare string with no bind args, which is unsafe for JSON
 * payloads that may contain apostrophes / quotes). A dedicated client
 * with bound parameters is the correct primitive.
 *
 * NOTE: this module is a pure persistence layer. It does NOT modify the
 * source engine modules (execution-engine.ts, reserve-state.ts,
 * monetary-engine-v19.ts) — those modules retain their in-memory state
 * as the primary store; this layer mirrors that state to Turso so it can
 * be rehydrated after a process restart. Wiring the persist/load hooks
 * into the mutation points is the responsibility of a follow-up task
 * (the caller has access to the in-memory stores; this layer accepts
 * the state as parameters and exposes convenient getters where the
 * engine already exposes them).
 */

import { createClient, type Client } from '@libsql/client'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

import type {
  RebalanceProposal,
  ExecutionResult,
  RebalanceAction,
} from './execution-engine'
import type { ReserveState } from './reserve-state'
import type { HysteresisState } from './monetary-engine-v19'

// ============================================================
// Types
// ============================================================

/**
 * Turnover record — mirrors the unexported `TurnoverRecord` interface
 * in execution-engine.ts (line 758). Re-declared here (structurally
 * identical) so this module can type its API without modifying the
 * source file. TypeScript's structural typing means the source file's
 * internal `TurnoverRecord[]` is assignable to this type without any
 * cast.
 */
export interface TurnoverRecord {
  assetClass: RebalanceAction['assetClass']
  /** Absolute weight change (always ≥ 0). */
  weightChange: number
  /** ms since epoch — passed by the caller, NOT Date.now(). */
  timestamp: number
  proposalId: string
}

/** Keys used in the `engine_state` table. */
export type EngineStateKey =
  | 'proposals'
  | 'execution_results'
  | 'turnover'
  | 'hysteresis'
  | 'reserve_state'

/** Shape of the persisted hysteresis payload. */
export interface PersistedHysteresis {
  state: HysteresisState
  prevWeights: Map<string, number>
}

/** Return shape of `loadAllState()`. */
export interface LoadedEngineState {
  proposals: Map<string, RebalanceProposal> | null
  executionResults: Map<string, ExecutionResult> | null
  turnoverRecords: TurnoverRecord[] | null
  hysteresis: PersistedHysteresis | null
  reserveState: ReserveState | null
}

/**
 * Options for `persistAllState()`. Every field is optional; the caller
 * passes whichever slices of state it has access to. Slices that are
 * omitted are simply skipped (not overwritten with `null`), so partial
 * persists are safe.
 */
export interface PersistAllStateOptions {
  proposals?: Map<string, RebalanceProposal>
  executionResults?: Map<string, ExecutionResult>
  turnoverRecords?: TurnoverRecord[]
  hysteresisState?: HysteresisState
  hysteresisPrevWeights?: Map<string, number>
  reserveState?: ReserveState
}

// ============================================================
// Libsql client (dedicated, parameterised)
// ============================================================

const globalForPersist = globalThis as unknown as {
  __engineStateClient?: Client
  __engineStateSchemaReady?: boolean
}

function createPersistenceClient(): Client {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    'file:./db/custom.db'

  const authToken = process.env.DATABASE_AUTH_TOKEN

  // Mirror db.ts's defensive mkdir for file: URLs (libsql opens the file
  // at construction and throws SQLITE_CANTOPEN if the directory is
  // missing).
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length)
    try {
      mkdirSync(dirname(filePath), { recursive: true })
    } catch {
      // Swallow — createClient will surface a clearer error below.
    }
  }

  return createClient({
    url,
    authToken: url.startsWith('file:') ? undefined : authToken,
  })
}

const _client: Client =
  globalForPersist.__engineStateClient ?? createPersistenceClient()
if (process.env.NODE_ENV !== 'production') {
  globalForPersist.__engineStateClient = _client
}

// ============================================================
// Schema bootstrap
// ============================================================

/**
 * Idempotently create the `engine_state` key/value table if it does not
 * yet exist. Safe to call on every persist / load. Guarded by a
 * module-level flag so the round-trip happens at most once per process.
 */
export async function ensureEngineStateSchema(): Promise<void> {
  if (globalForPersist.__engineStateSchemaReady) return
  try {
    await _client.execute({
      sql: `CREATE TABLE IF NOT EXISTS engine_state (
        key        TEXT PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      args: [],
    })
    globalForPersist.__engineStateSchemaReady = true
  } catch (err) {
    console.warn(
      '[state-persistence] ensureEngineStateSchema failed:',
      err instanceof Error ? err.message : err,
    )
    // Do NOT set the flag — a subsequent call may succeed (e.g. transient
    // Turso connectivity blip). Persistence functions will still attempt
    // their writes; on failure they warn and return without crashing.
  }
}

// ============================================================
// Low-level key/value primitives
// ============================================================

/**
 * Upsert a JSON-serialised payload under `key`. Idempotent.
 * Never throws — logs a warning on failure.
 */
async function saveState(key: EngineStateKey, value: string): Promise<void> {
  await ensureEngineStateSchema()
  const updatedAt = new Date().toISOString()
  try {
    await _client.execute({
      sql: `INSERT OR REPLACE INTO engine_state (key, value, updated_at)
            VALUES (?, ?, ?)`,
      args: [key, value, updatedAt],
    })
  } catch (err) {
    console.warn(
      `[state-persistence] saveState('${key}') failed:`,
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Load the JSON string for `key`, or `null` if missing / on failure.
 * Never throws — logs a warning and returns null.
 */
async function loadState(key: EngineStateKey): Promise<string | null> {
  await ensureEngineStateSchema()
  try {
    const result = await _client.execute({
      sql: `SELECT value FROM engine_state WHERE key = ?`,
      args: [key],
    })
    const row = result.rows[0]
    if (!row) return null
    const value = row.value
    return typeof value === 'string' ? value : value == null ? null : String(value)
  } catch (err) {
    console.warn(
      `[state-persistence] loadState('${key}') failed:`,
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// ============================================================
// Map <-> JSON helpers
// ============================================================

/**
 * Serialise a Map to a JSON-friendly array of `[key, value]` entries.
 * Used for top-level Maps (`proposals`, `executionResults`) and for
 * the nested Maps inside `HysteresisState`.
 */
function mapToEntries<K extends string, V>(m: Map<K, V>): Array<[K, V]> {
  return Array.from(m.entries())
}

function entriesToMap<K extends string, V>(
  entries: unknown,
): Map<K, V> {
  if (!Array.isArray(entries)) return new Map<K, V>()
  const out = new Map<K, V>()
  for (const e of entries) {
    if (Array.isArray(e) && e.length >= 2) {
      out.set(e[0] as K, e[1] as V)
    }
  }
  return out
}

// ============================================================
// Save functions (one per state slice)
// ============================================================

/**
 * Persist the full `proposals` Map (all live RebalanceProposals in
 * the §18 lifecycle) under the `proposals` key.
 *
 * Idempotent: re-saving the same map overwrites the row with an
 * updated `updated_at` timestamp. Safe to call after every proposal
 * create / validate / approve / execute / finalise / cancel mutation.
 */
export async function persistProposals(
  proposals: Map<string, RebalanceProposal>,
): Promise<void> {
  try {
    const payload = JSON.stringify(mapToEntries(proposals))
    await saveState('proposals', payload)
  } catch (err) {
    console.warn(
      '[state-persistence] persistProposals failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Persist the `executionResults` Map (one ExecutionResult per
 * proposalId, populated by `executeRebalanceProposal`). Stored under
 * the `execution_results` key.
 *
 * NOTE: this is a bonus helper — the task spec lists 4 mandatory save
 * functions (proposals / turnover / hysteresis / reserve_state); this
 * 5th one covers the `executionResults` Map called out in the problem
 * statement. `persistAllState` calls it when an `executionResults`
 * slice is supplied.
 */
export async function persistExecutionResults(
  results: Map<string, ExecutionResult>,
): Promise<void> {
  try {
    const payload = JSON.stringify(mapToEntries(results))
    await saveState('execution_results', payload)
  } catch (err) {
    console.warn(
      '[state-persistence] persistExecutionResults failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Persist the in-memory turnover tracker (`turnoverRecords` array in
 * execution-engine.ts) under the `turnover` key. Idempotent.
 *
 * The turnover tracker backs Invariant I-4 (3% weekly cap per asset).
 * Persisting it across restarts prevents a fresh process from
 * approving a trade that would exceed the cap when summed against
 * the previous week's history.
 */
export async function persistTurnoverRecords(
  records: TurnoverRecord[],
): Promise<void> {
  try {
    const payload = JSON.stringify(records)
    await saveState('turnover', payload)
  } catch (err) {
    console.warn(
      '[state-persistence] persistTurnoverRecords failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Persist the monetary engine's hysteresis state (anti-whipsaw
 * confirmation counters + last-direction tracker + the previous-cycle
 * weight map used as the `currentWeight` baseline) under the
 * `hysteresis` key.
 *
 * The two module-level variables in monetary-engine-v19.ts are NOT
 * exported, so the caller is responsible for passing them in. The
 * caller is expected to be a small wiring shim added in a follow-up
 * task that mirrors `moduleHysteresisState` / `moduleHysteresisPrevWeights`
 * to this layer after every `computeMonetaryStateV19` call.
 */
export async function persistHysteresisState(
  state: HysteresisState,
  prevWeights: Map<string, number>,
): Promise<void> {
  try {
    // HysteresisState contains two nested Maps — flatten to entries for
    // JSON. On load we rehydrate them back to Maps.
    const payload = JSON.stringify({
      state: {
        confirmationCounts: mapToEntries(state.confirmationCounts),
        lastDirections: mapToEntries(state.lastDirections),
      },
      prevWeights: mapToEntries(prevWeights),
    })
    await saveState('hysteresis', payload)
  } catch (err) {
    console.warn(
      '[state-persistence] persistHysteresisState failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

/**
 * Persist the full ReserveState (all four views: target / executed /
 * custodian / reconciled, plus reconciliation metadata) under the
 * `reserve_state` key. This is the canonical snapshot of the reserve.
 *
 * ReserveState is a plain JSON-serialisable object (no Maps, no
 * Dates, no BigInts) so it serialises directly.
 */
export async function persistReserveState(
  state: ReserveState,
): Promise<void> {
  try {
    const payload = JSON.stringify(state)
    await saveState('reserve_state', payload)
  } catch (err) {
    console.warn(
      '[state-persistence] persistReserveState failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

// ============================================================
// Load functions (one per state slice)
// ============================================================

/**
 * Load the persisted `proposals` Map, or `null` if no snapshot exists
 * (fresh database, first boot, or persistent load failure).
 */
export async function loadProposals(): Promise<Map<string, RebalanceProposal> | null> {
  const raw = await loadState('proposals')
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return entriesToMap<string, RebalanceProposal>(parsed)
  } catch (err) {
    console.warn(
      '[state-persistence] loadProposals JSON parse failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

/**
 * Load the persisted `executionResults` Map, or `null`.
 */
export async function loadExecutionResults(): Promise<Map<string, ExecutionResult> | null> {
  const raw = await loadState('execution_results')
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return entriesToMap<string, ExecutionResult>(parsed)
  } catch (err) {
    console.warn(
      '[state-persistence] loadExecutionResults JSON parse failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

/**
 * Load the persisted turnover records array, or `null`.
 */
export async function loadTurnoverRecords(): Promise<TurnoverRecord[] | null> {
  const raw = await loadState('turnover')
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed as TurnoverRecord[]
  } catch (err) {
    console.warn(
      '[state-persistence] loadTurnoverRecords JSON parse failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

/**
 * Load the persisted hysteresis state + previous-weights map, or
 * `null`. Rehydrates the nested Maps from their `[key, value][]`
 * JSON representation.
 */
export async function loadHysteresisState(): Promise<PersistedHysteresis | null> {
  const raw = await loadState('hysteresis')
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as {
      state?: {
        confirmationCounts?: unknown
        lastDirections?: unknown
      }
      prevWeights?: unknown
    }
    if (!parsed || typeof parsed !== 'object') return null
    const state: HysteresisState = {
      confirmationCounts: entriesToMap<string, number>(parsed.state?.confirmationCounts),
      lastDirections: entriesToMap<string, number>(parsed.state?.lastDirections),
    }
    const prevWeights = entriesToMap<string, number>(parsed.prevWeights)
    return { state, prevWeights }
  } catch (err) {
    console.warn(
      '[state-persistence] loadHysteresisState JSON parse failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

/**
 * Load the persisted ReserveState, or `null`.
 */
export async function loadReserveState(): Promise<ReserveState | null> {
  const raw = await loadState('reserve_state')
  if (raw == null) return null
  try {
    const parsed = JSON.parse(raw) as ReserveState
    return parsed
  } catch (err) {
    console.warn(
      '[state-persistence] loadReserveState JSON parse failed:',
      err instanceof Error ? err.message : err,
    )
    return null
  }
}

// ============================================================
// Aggregate hooks
// ============================================================

/**
 * Persist every supplied slice of state in parallel. Each slice is
 * optional — omitted slices are skipped (NOT overwritten with null),
 * so partial persists are safe and idempotent.
 *
 * Call this after every state mutation:
 *   - proposal create / validate / approve / execute / finalise
 *   - turnover recording
 *   - reserve state commit (executed / custodian / reconciled)
 *   - hysteresis update (after `computeMonetaryStateV19`)
 *
 * Never throws — each slice has its own try/catch and failures are
 * logged as warnings.
 */
export async function persistAllState(
  opts: PersistAllStateOptions = {},
): Promise<void> {
  const tasks: Promise<void>[] = []

  if (opts.proposals !== undefined) {
    tasks.push(persistProposals(opts.proposals))
  }
  if (opts.executionResults !== undefined) {
    tasks.push(persistExecutionResults(opts.executionResults))
  }
  if (opts.turnoverRecords !== undefined) {
    tasks.push(persistTurnoverRecords(opts.turnoverRecords))
  }
  if (opts.hysteresisState !== undefined && opts.hysteresisPrevWeights !== undefined) {
    tasks.push(persistHysteresisState(opts.hysteresisState, opts.hysteresisPrevWeights))
  }
  if (opts.reserveState !== undefined) {
    tasks.push(persistReserveState(opts.reserveState))
  }

  // Run all slices concurrently — they write to independent rows so
  // there's no contention. `Promise.all` returns when all settle; each
  // individual persist already swallows its own errors.
  await Promise.all(tasks)
}

/**
 * Load every persisted slice from Turso on startup. Returns an object
 * with one field per slice; each field is `null` if no snapshot
 * exists or loading failed.
 *
 * Call this once during process bootstrap (e.g. in a server module
 * imported by the API routes, or in `instrumentation.ts`) and feed
 * the non-null slices back into the engine modules' internal stores
 * via their setter / re-init paths.
 *
 * Never throws — every loader has its own try/catch.
 */
export async function loadAllState(): Promise<LoadedEngineState> {
  const [proposals, executionResults, turnoverRecords, hysteresis, reserveState] =
    await Promise.all([
      loadProposals(),
      loadExecutionResults(),
      loadTurnoverRecords(),
      loadHysteresisState(),
      loadReserveState(),
    ])

  return {
    proposals,
    executionResults,
    turnoverRecords,
    hysteresis,
    reserveState,
  }
}

// ============================================================
// Internal client accessor (for tests / diagnostics)
// ============================================================

/**
 * Return the underlying libsql client used by this layer. Exported so
 * a follow-up wiring task (or a diagnostic endpoint) can introspect
 * the connection without re-creating it. Not part of the public
 * persistence API.
 */
export function _getPersistenceClient(): Client {
  return _client
}
