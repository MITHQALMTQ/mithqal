---
Task ID: P1-persistence
Agent: impl-persistence
Task: Create state persistence layer for Turso DB

# Work Record

## File Created
- `src/lib/state-persistence.ts` — Turso-backed persistence layer for the Mithqal reserve engine's critical in-memory state.

## Context Loaded
- Read `worklog.md` — v20 hardening complete; 3 P1 remaining (state persistence, HSM crypto, multi-oracle consensus). This task closes the first one.
- Read `src/lib/db.ts` — understood the libsql client setup (DATABASE_URL/DATABASE_AUTH_TOKEN, file: fallback, globalThis caching, ensureSchema pattern). The `db` wrapper does NOT expose parameterised raw SQL (`$executeRawUnsafe` accepts a bare string only), so for safe JSON persistence a dedicated libsql client is required.
- Read `src/lib/execution-engine.ts` — `proposals` (Map, line 210), `executionResults` (Map, line 211), `turnoverRecords` (array, line 771) are in-memory. `RebalanceProposal`/`ExecutionResult`/`RebalanceAction` types are exported; `TurnoverRecord` is NOT exported. `getAllProposals()` getter exists.
- Read `src/lib/reserve-state.ts` — `ReserveState` exported; `reserveStateStore` (line 126) is module-private but readable via `getReserveState()`.
- Read `src/lib/monetary-engine-v19.ts` — `HysteresisState` type exported (has `confirmationCounts` + `lastDirections` Maps); `moduleHysteresisState` / `moduleHysteresisPrevWeights` (lines 567–568) are NOT exported.

## Constraint
Do NOT modify execution-engine.ts, reserve-state.ts, or monetary-engine-v19.ts. Persistence functions must accept state as parameters; the caller (a follow-up wiring task) hooks them into mutation points.

## Implementation
- **Dedicated libsql client** via `@libsql/client` (reuses DATABASE_URL/DATABASE_AUTH_TOKEN, file: fallback, globalThis cache, mkdir for file: URLs).
- **`ensureEngineStateSchema()`** — idempotent `CREATE TABLE IF NOT EXISTS engine_state (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`, guarded by a module-level flag.
- **`saveState(key, value)` / `loadState(key)`** — low-level UPSERT + SELECT primitives with parameterised binds, never throw, log warnings on failure.
- **Map <-> JSON helpers** (`mapToEntries` / `entriesToMap`) — handle top-level Maps (`proposals`, `executionResults`) and nested Maps inside `HysteresisState` (`confirmationCounts`, `lastDirections`, `prevWeights`).
- **5 save functions**: `persistProposals`, `persistExecutionResults`, `persistTurnoverRecords`, `persistHysteresisState`, `persistReserveState`.
- **5 load functions**: `loadProposals`, `loadExecutionResults`, `loadTurnoverRecords`, `loadHysteresisState`, `loadReserveState` — each returns `null` on miss/failure (no throw).
- **`persistAllState(opts)`** — accepts optional slices, persists only what's supplied (parallel via `Promise.all`); omitted slices are NOT overwritten.
- **`loadAllState()`** — loads all 5 slices in parallel, returns `{ proposals, executionResults, turnoverRecords, hysteresis, reserveState }` (each `| null`).
- **`TurnoverRecord` interface** re-declared locally (structurally identical to the unexported one in execution-engine.ts — TS structural typing makes the source's array assignable without casts).
- **`_getPersistenceClient()`** — diagnostic accessor for the raw libsql client.

## Verification
- `bunx tsc --noEmit 2>&1 | grep state-persistence` → **0 errors** in the new file. (34 pre-existing TS errors in unrelated test files — none reference state-persistence.)
- `bun run lint` → **exit code 0, no output (clean)**.
- End-to-end smoke test against the **live Turso DB** (`libsql://mithqal-db-fortleem.aws-us-east-1.turso.io`): all 9 round-trips pass —
  1. proposals Map (Map<->entries serialization)
  2. turnover records array
  3. hysteresis state (with nested Maps: confirmationCounts, lastDirections, prevWeights)
  4. ReserveState (plain object)
  5. executionResults Map (bonus)
  6. persistAllState + loadAllState aggregate
  7. idempotent re-save (UPSERT)
  8. missing-key returns null
  9. client accessor healthy

## Design Properties
- **Idempotent**: UPSERT (`INSERT OR REPLACE`) — re-saves are safe; flag-guarded schema bootstrap.
- **Graceful**: every public function catches libsql errors and logs `console.warn`; loaders return `null` on failure; never crashes the caller.
- **Schema-lazy**: `engine_state` table created on first use; no migration step required.
- **Pure layer**: does not modify the source engine modules. Accepts state as parameters; the follow-up wiring task will hook into the mutation points (proposal create/validate/approve/execute/finalise, turnover recording, reserve state commit, hysteresis update).

## Status
- **P1-persistence complete.** Remaining P1: HSM crypto, multi-oracle consensus.
- The persistence layer is ready for the wiring task to call `persistAllState(opts)` after every state mutation and `loadAllState()` on process startup (e.g. from `instrumentation.ts` or a server module imported by API routes).
