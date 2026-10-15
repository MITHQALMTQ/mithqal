"use client";

/**
 * LIVE DATA HOOKS — TanStack Query wrappers for /api/v1/* endpoints.
 *
 * Every hook:
 *   • is a client component ("use client" at top of file)
 *   • uses `useQuery` from @tanstack/react-query
 *   • polls every 30s (`refetchInterval: 30000`) for the "live" feel
 *   • marks data fresh for 15s (`staleTime: 15000`)
 *   • returns `{ data, isLoading, error }` (TanStack's standard shape)
 *
 * The QueryClient is mounted globally in <QueryProvider /> (see
 * src/components/query-provider.tsx) with default staleTime = 30000 / retry = 1.
 * Per-hook `staleTime: 15000` overrides that so live data feels fresher while
 * still respecting a 30s refetch cadence.
 *
 * All API routes return the canonical envelope:
 *   { ok: true, data: <T>, count: number, timestamp: ISO, source: "live-api" }
 * Hooks unwrap `data` and surface it to the caller.
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

/* ---------------------------------------------------------------------------
 * Type definitions — match the exact shapes exported by src/lib/demo-data.ts
 * ------------------------------------------------------------------------- */

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface DemoCase {
  id: string;
  institution: string;
  corridor: string;
  amount: string;
  status: string;
  date: string;
  scenario: DemoScenario;
}

export interface DemoEvent {
  id: string;
  caseId: string;
  type: string;
  source: string;
  time: string;
  sig: string;
}

export interface DemoException {
  id: string;
  caseId: string;
  code: string;
  severity: string;
  owner: string;
  status: string;
  reason: string;
  action: string;
}

export interface DemoInstitution {
  id: string;
  name: string;
  jurisdiction: string;
  type: string;
}

export interface StressMetrics {
  totalCases: number;
  totalValue: string;
  exceptionRate: string;
  avgResolutionTime: string;
  p95ResolutionTime: string;
  scenariosCovered: number;
  openExceptions: number;
  evidenceEvents: number;
  institutions: number;
  corridors: number;
}

export interface StressResults {
  testName: string;
  duration: string;
  casesProcessed: number;
  casesPassed: number;
  casesWithExceptions: number;
  exceptionsOpened: number;
  exceptionsResolved: number;
  safeHaltsTriggered: number;
  replaysExecuted: number;
  reconciliationCases: number;
  evidenceEventsGenerated: number;
  idempotencyKeysChecked: number;
  duplicatePrevention: string;
  result: string;
}

/* ---------------------------------------------------------------------------
 * API envelope helper
 * ------------------------------------------------------------------------- */

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  count: number;
  timestamp: string;
  source: string;
}

/**
 * Fetch + unwrap a /api/v1/* JSON envelope.
 * Throws on non-2xx so React Query surfaces it as `error` state.
 */
async function fetchEnvelope<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} — ${url}`);
  }
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!json.ok) {
    throw new Error(`API returned ok=false for ${url}`);
  }
  return json.data;
}

/**
 * Build a query-string suffix from a filters object (only truthy values).
 */
function buildQuery(filters?: Record<string, string | undefined>): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/* ---------------------------------------------------------------------------
 * Tunable defaults (live feel)
 * ------------------------------------------------------------------------- */

const LIVE_REFETCH_INTERVAL = 30000; // 30s — auto-refetch cadence
const LIVE_STALE_TIME = 15000; // 15s — fresher than the global default

/* ---------------------------------------------------------------------------
 * Hooks
 * ------------------------------------------------------------------------- */

/**
 * Validation cases (20). Filter by status / corridor / single caseId.
 */
export function useCases(
  filters?: { status?: string; corridor?: string; caseId?: string },
): UseQueryResult<DemoCase[]> {
  const query = buildQuery(filters);
  return useQuery<DemoCase[]>({
    queryKey: ["cases", filters],
    queryFn: () => fetchEnvelope<DemoCase[]>(`/api/v1/cases${query}`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Evidence events (30). Optionally filter by caseId.
 */
export function useEvents(caseId?: string): UseQueryResult<DemoEvent[]> {
  const query = buildQuery({ caseId });
  return useQuery<DemoEvent[]>({
    queryKey: ["events", caseId],
    queryFn: () => fetchEnvelope<DemoEvent[]>(`/api/v1/events${query}`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Exceptions (10). Filter by severity / status.
 */
export function useExceptions(
  filters?: { severity?: string; status?: string },
): UseQueryResult<DemoException[]> {
  const query = buildQuery(filters);
  return useQuery<DemoException[]>({
    queryKey: ["exceptions", filters],
    queryFn: () => fetchEnvelope<DemoException[]>(`/api/v1/exceptions${query}`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Scenario types (10). No filters.
 */
export function useScenarios(): UseQueryResult<DemoScenario[]> {
  return useQuery<DemoScenario[]>({
    queryKey: ["scenarios"],
    queryFn: () => fetchEnvelope<DemoScenario[]>(`/api/v1/scenarios`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Stress-test metrics (single KPI summary object).
 */
export function useStressMetrics(): UseQueryResult<StressMetrics> {
  return useQuery<StressMetrics>({
    queryKey: ["stress-metrics"],
    queryFn: () => fetchEnvelope<StressMetrics>(`/api/v1/metrics`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Stress-test results (single summary object).
 */
export function useStressResults(): UseQueryResult<StressResults> {
  return useQuery<StressResults>({
    queryKey: ["stress-results"],
    queryFn: () => fetchEnvelope<StressResults>(`/api/v1/results`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}

/**
 * Institutions (4). No filters.
 */
export function useInstitutions(): UseQueryResult<DemoInstitution[]> {
  return useQuery<DemoInstitution[]>({
    queryKey: ["institutions"],
    queryFn: () => fetchEnvelope<DemoInstitution[]>(`/api/v1/institutions`),
    refetchInterval: LIVE_REFETCH_INTERVAL,
    staleTime: LIVE_STALE_TIME,
  });
}
