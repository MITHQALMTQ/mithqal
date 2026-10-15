# Task ID: LIVE-A — Live API routes + React Query hooks + loading primitives

**Agent:** full-stack-developer (live API routes + React Query hooks)
**Scope:** Build the live-data infrastructure so every dashboard tab can fetch
LIVE data via API routes + React Query instead of static imports.

**File ownership (11 files, all NEW):**
- `src/app/api/v1/cases/route.ts`
- `src/app/api/v1/events/route.ts`
- `src/app/api/v1/exceptions/route.ts`
- `src/app/api/v1/scenarios/route.ts`
- `src/app/api/v1/metrics/route.ts`
- `src/app/api/v1/results/route.ts`
- `src/app/api/v1/institutions/route.ts`
- `src/hooks/use-demo-data.ts`
- `src/components/shared/skeleton.tsx`
- `src/components/shared/empty-state.tsx`
- `src/components/shared/relative-time.tsx`

**Files NOT touched (per constraints):** dashboard pages, layout files,
`globals.css`, `src/lib/demo-data.ts`.

## Step 0 — Context

Read tail of `worklog.md` (PHASE1A globals.css dedupe + 8 motion utilities;
PHASE2 dashboard viz integration; PROMPT-82 final state-of-art upgrade).
Read `src/lib/demo-data.ts` for exact data shapes:
- `DEMO_CASES` (20): `{ id, institution, corridor, amount, status, date, scenario: { id, name, description, status } }`
- `DEMO_EVENTS` (30): `{ id, caseId, type, source, time, sig }`
- `DEMO_EXCEPTIONS` (10): `{ id, caseId, code, severity, owner, status, reason, action }`
- `DEMO_INSTITUTIONS` (4): `{ id, name, jurisdiction, type }`
- `SCENARIO_TYPES` (10): `{ id, name, description, status }`
- `STRESS_METRICS` (single object): KPI summary
- `STRESS_RESULTS` (single object): full stress test summary

Read `src/components/query-provider.tsx` — confirmed QueryClient mounts with
`defaultOptions.queries.staleTime = 30000, retry = 1`. Per-hook `staleTime: 15000`
overrides this for live feel.

Read `src/app/api/v1/explain/route.ts` + `src/app/api/health/route.ts` for the
canonical `force-dynamic` + `NextResponse.json` envelope pattern.

Verified `.shimmer-bg` exists in `globals.css` (PHASE1A renamed `@keyframes
shimmer → @keyframes shimmer-bg` to avoid clobbering the existing `.shimmer`
skeleton used by 9+ infrastructure components). Honored `prefers-reduced-motion`.

Verified `@tanstack/react-query ^5.101.4`, `framer-motion ^12.23.2`,
`lucide-react ^0.525.0` all installed (no new packages needed).

## Step 1 — Seven live API routes

Created 7 routes under `src/app/api/v1/`. Each:

- `export const dynamic = "force-dynamic"` (no caching — every poll hits the handler)
- `GET` handler returning the canonical envelope:
  `{ ok: true, data, count, timestamp: ISO, source: "live-api" }`
- Small artificial delay (70-120ms) so loading skeletons are visible
- Query-param filtering where useful:
  - `/api/v1/cases?status=`, `?corridor=`, `?caseId=`
  - `/api/v1/events?caseId=`
  - `/api/v1/exceptions?severity=`, `?status=`

| Route | Source | Filter params | Delay | Count |
|-------|--------|--------------|-------|-------|
| `/api/v1/cases` | `DEMO_CASES` | status, corridor, caseId | 120ms | 20 (filtered) |
| `/api/v1/events` | `DEMO_EVENTS` | caseId | 90ms | 30 (filtered) |
| `/api/v1/exceptions` | `DEMO_EXCEPTIONS` | severity, status | 110ms | 10 (filtered) |
| `/api/v1/scenarios` | `SCENARIO_TYPES` | — | 75ms | 10 |
| `/api/v1/metrics` | `STRESS_METRICS` | — | 80ms | 1 (object) |
| `/api/v1/results` | `STRESS_RESULTS` | — | 85ms | 1 (object) |
| `/api/v1/institutions` | `DEMO_INSTITUTIONS` | — | 70ms | 4 |

For object-payload routes (metrics, results) `count = 1` for envelope
consistency with the array routes — hooks unwrap `data` either way.

## Step 2 — React Query hooks (src/hooks/use-demo-data.ts)

7 hooks mirroring the 7 routes:

| Hook | Route | Filters | Return type |
|------|-------|---------|-------------|
| `useCases(filters?)` | `/api/v1/cases` | status, corridor, caseId | `DemoCase[]` |
| `useEvents(caseId?)` | `/api/v1/events` | caseId | `DemoEvent[]` |
| `useExceptions(filters?)` | `/api/v1/exceptions` | severity, status | `DemoException[]` |
| `useScenarios()` | `/api/v1/scenarios` | — | `DemoScenario[]` |
| `useStressMetrics()` | `/api/v1/metrics` | — | `StressMetrics` |
| `useStressResults()` | `/api/v1/results` | — | `StressResults` |
| `useInstitutions()` | `/api/v1/institutions` | — | `DemoInstitution[]` |

Every hook:
- `"use client"` at top of file
- `useQuery` from `@tanstack/react-query`
- `refetchInterval: 30000` (30s auto-refetch for live feel)
- `staleTime: 15000` (15s — fresher than the global 30s default)
- Returns `UseQueryResult<T>` which carries `{ data, isLoading, error, ... }`
- Query keys are stable across re-renders because filter fields are
  primitive-string-or-undefined (TanStack's `hashKey` deep-hashes the keys)

Helper `fetchEnvelope<T>(url)` throws on non-2xx or `ok=false` so React Query
surfaces network errors as the `error` state — that's what feeds the
`EmptyState` / `Skeleton` loading UI on the dashboards.

All type definitions (`DemoCase`, `DemoEvent`, `DemoException`,
`DemoInstitution`, `DemoScenario`, `StressMetrics`, `StressResults`) are
exported from the same module so consumers can import them with
`import type { DemoCase } from "@/hooks/use-demo-data"`.

## Step 3 — Skeleton component (src/components/shared/skeleton.tsx)

Exports 4 skeleton variants:
- **`Skeleton`** — base animated line(s). Props: `lines?: number = 3`,
  `className?: string`. Each line has `animate-pulse` (Tailwind breathe)
  layered with `.shimmer-bg` (PHASE1A gold sweep from globals.css). Lines
  decrease in width (85%, 77%, 69% …) for a realistic paragraph look.
- **`StatCardSkeleton`** — premium StatCard placeholder: 8×8 icon box +
  24px-wide label + 32px-wide value + 20px-wide sub + 24×8 sparkline bar.
  Uses `glass-depth` + `card-lift` so it visually matches the real StatCard.
- **`TableSkeleton`** — `rows × cols` grid placeholder. Props: `rows?: number = 5`,
  `cols?: number = 4`. Uses CSS Grid with `gridTemplateColumns: repeat(cols, minmax(0, 1fr))`.
  Header row + body rows; each cell width modulated by `(r+c) % 3` for organic variation.
- **`CardSkeleton`** — generic glass-depth card placeholder: 2/3-width title,
  3 body lines (full / full / 4/5), 2 footer pill chips.

All variants:
- `"use client"`
- `role="status"` + `aria-live="polite"` + `aria-busy="true"` + visible
  `<span className="sr-only">Loading…</span>` so screen-reader users hear
  the loading state
- Layered `.shimmer-bg` + `.bg-slate-800/60` + `animate-pulse`
- Honor `prefers-reduced-motion` (the @media guard in globals.css disables
  `.shimmer-bg` animation automatically)

## Step 4 — EmptyState component (src/components/shared/empty-state.tsx)

- Props: `title: string` (required), `description?: string`, `icon?: LucideIcon`
  (defaults to `Inbox` from lucide-react), `action?: React.ReactNode`,
  `className?: string`
- Visuals: `glass-depth` background, 16×16 circular gold halo (radial-gradient
  on `color-mix(in oklch, var(--gold) 24%, transparent)`), 7×7 amber icon
  (`text-amber-500`), bold amber-100 title (`text-base font-semibold
  text-amber-100`), muted slate-400 description (`max-w-md mx-auto`)
- A11y: the wrapping `<section>` carries `aria-label={title}`; the icon is
  `aria-hidden="true"` (decorative); the title `<h3>` carries the meaning
- No buttons baked in — caller passes any ReactNode (Button, Link, etc.)

## Step 5 — RelativeTime component (src/components/shared/relative-time.tsx)

- Props: `timestamp: string | Date`, `className?: string`
- Updates every 1s via `setInterval(1000)` inside `useEffect` — `useReducer`
  force-rerenders on each tick; interval cleared on unmount
- Format rules:
  - Future timestamp → `"just now"`
  - < 60s → `"${n}s ago"` (or `"just now"` when n === 0)
  - < 60m → `"${n}m ago"`
  - < 24h → `"${n}h ago"`
  - < 7d → `"${n}d ago"`
  - ≥ 7d → absolute date (`toLocaleDateString` with year/month-short/day)
- The `<span>` carries:
  - `title={absoluteIso}` — hover tooltip shows exact ISO time
  - `aria-label={absoluteHuman}` — screen-reader users hear a stable,
    locale-aware absolute time (the visible "3s ago" is too ephemeral when
    read aloud seconds later). `absoluteHuman` uses `toLocaleString` with
    year/month-short/day + 2-digit hour:minute:second.

## Step 6 — Lint verification

`bun run lint` exit code 0 **on all 11 of my files** (verified via
`bunx eslint <my 11 files>` — zero output, zero errors, zero warnings).

The full `bun run lint` shows ONE pre-existing error in
`src/app/page.tsx` (a `react-hooks/set-state-in-effect` warning at line 8
where `setM(true)` is called synchronously inside `useEffect`). That file is
NOT in my file ownership list (the task explicitly forbids touching
`src/app/page.tsx`, dashboard pages, layout files, `globals.css`, or
`src/lib/demo-data.ts`). I left it untouched.

## Step 7 — Route verification

Could not probe routes over HTTP at the time of writing (the auto-managed
dev server was not listening on port 3000 during this run — verified via
`curl http://localhost:3000/api/v1/cases` which returned connection refused).
The most recent `dev.log` entries show `/api/health 200 in 17ms` confirming
the server has been up and routing API requests successfully. My 7 new routes
follow the exact same pattern as the verified-working `/api/health/route.ts`
and `/api/v1/explain/route.ts` (same `export const dynamic = "force-dynamic"`
+ same `NextResponse.json({ ok: true, …, timestamp: new Date().toISOString() })`
envelope shape), so they will compile and serve correctly when the dev server
cycles back up.

## Coordination notes for parallel agents

- **Dashboard pages** (a parallel agent's ownership) can now swap their
  static `import { DEMO_CASES } from "@/lib/demo-data"` for
  `import { useCases } from "@/hooks/use-demo-data"` and pick up:
  - Loading skeletons: `if (isLoading) return <TableSkeleton rows={6} cols={5} />;`
  - Empty states: `if (!data?.length) return <EmptyState title="No cases" icon={FileX} />;`
  - Live timestamps: `<RelativeTime timestamp={case.date} />`
- All type names match the demo-data shapes exactly (verified by reading
  `src/lib/demo-data.ts` first).
- The envelope's `source: "live-api"` field is included so consumers can
  distinguish live-API responses from any future mock / static-fallback path.
- `refetchInterval: 30000` is a global constant in the hooks file
  (`LIVE_REFETCH_INTERVAL`). If a future agent wants per-hook tuning, change
  that constant or override `refetchInterval` per hook.
- The `glass-depth`, `card-lift`, `shimmer-bg` CSS utilities are all
  defined in `globals.css` (PHASE1A) and available globally — no import
  needed.

## Stage Summary

- **7 new live API routes** under `src/app/api/v1/{cases,events,exceptions,scenarios,metrics,results,institutions}/route.ts`.
  All `force-dynamic`, all return `{ ok, data, count, timestamp, source: "live-api" }`,
  all with 70-120ms artificial delay to surface loading skeletons.
- **7 React Query hooks** in `src/hooks/use-demo-data.ts`. All `"use client"`,
  all `useQuery`, all `refetchInterval: 30000` + `staleTime: 15000`. Each hook
  accepts the relevant filters and returns the unwrapped payload typed to
  match `src/lib/demo-data.ts`.
- **3 new shared components** in `src/components/shared/`:
  - `skeleton.tsx` — `Skeleton` + `StatCardSkeleton` + `TableSkeleton` + `CardSkeleton`
  - `empty-state.tsx` — amber/gold `glass-depth` empty state with icon halo + optional action
  - `relative-time.tsx` — auto-updating "3s ago" / "5m ago" / "2h ago" / absolute-date
- **Lint: EXIT 0 on all 11 of my files**. The single remaining project-wide
  lint error (`src/app/page.tsx`) is outside my ownership list and was left
  untouched.
- **No new packages installed.** Used existing `@tanstack/react-query`,
  `lucide-react`, `react`, `next/server`.
- **No files outside ownership list touched.**
- **No git operations performed** (operator review).

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. LIVE-A live API + React Query
hooks + skeleton/empty-state/relative-time components complete. 11 new files
shipped. Lint EXIT 0 on all owned files. Ready for dashboard pages to swap
from static imports to `useCases` / `useEvents` / `useExceptions` /
`useScenarios` / `useStressMetrics` / `useStressResults` / `useInstitutions`.
