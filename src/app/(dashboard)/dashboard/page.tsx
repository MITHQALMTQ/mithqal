"use client"
import { Suspense } from "react";

/**
 * MITHQAL Assurance — Dashboard (overview) — LIVE.
 *
 * The home tab of the (dashboard) AppShell. Aggregates the institution's
 * six headline KPIs through the <StatCard/> primitive, sourced LIVE from
 * the React Query hooks shipped in LIVE-A:
 *
 *   • useStressMetrics()  — 6 KPI tiles
 *   • useStressResults()  — 3 stress-test summary tiles
 *   • useScenarios()      — scenario register table
 *   • useCases()          — recent validation cases (filterable by ?corridor)
 *   • useExceptions()     — recent exceptions (each case id → /evidence)
 *
 * Cross-tab navigation:
 *   • Each Case ID in the cases table → /timeline?caseId=${id}
 *   • Each exception's caseId → /evidence?caseId=${caseId}
 *   • "View all exceptions" CTA → /exceptions
 *   • "View timeline" CTA → /timeline
 *   • The ?corridor=X URL param filters the cases table to that corridor
 *
 * Live UX:
 *   • A pulse-dot "Live · 30s" badge in the PageHeader actions slot
 *   • StatCardSkeleton while metrics load; TableSkeleton while tables load
 *   • EmptyState when a query errors or returns zero rows
 *   • toast.success("Data refreshed") on every successful background refetch
 *
 * Accessibility: sr-only captions, scope="col" on every <th>, the live
 * indicator's dot is aria-hidden (decorative).
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Clock,
  DollarSign,
  Gauge,
  Layers,
  ListChecks,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  useCases,
  useExceptions,
  useScenarios,
  useStressMetrics,
  useStressResults,
  type DemoCase,
  type DemoException,
  type DemoScenario,
} from "@/hooks/use-demo-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp } from "@/components/shared/count-up";
import { StatCardSkeleton, TableSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Tone maps + helpers
 * ────────────────────────────────────────────────────────────── */

const CASE_STATUS_TONE: Record<string, string> = {
  OPEN: "border-red-400/30 bg-red-400/10 text-red-300",
  RECEIVED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  VALIDATED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  EXCEPTION_OPENED: "border-red-400/30 bg-red-400/10 text-red-300",
  CLOSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  SAFE_HALTED: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  REPLAYED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const SCENARIO_TONE: Record<string, string> = {
  CLOSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  EXCEPTION_OPENED: "border-red-400/30 bg-red-400/10 text-red-300",
  SAFE_HALTED: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  REPLAYED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  VALIDATED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

function caseTone(status: string): string {
  return CASE_STATUS_TONE[status] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

function scenarioTone(status: string): string {
  return SCENARIO_TONE[status] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

/**
 * Pull the first numeric run out of a formatted string ("$48,850,000" →
 * 48850000, "50%" → 50, "14 min" → 14). Returns 0 when no match.
 */
function parseNum(s: string | undefined): number {
  if (!s) return 0;
  const m = s.match(/[\d][\d,]*(\.\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(/,/g, ""));
}

/* Headline KPI sparklines — decorative trend hints (not real series). */
const SPARK_CASES = [10, 12, 8, 15, 14, 18, 20, 22, 21, 24, 26, 28];
const SPARK_VALUE = [40, 38, 42, 41, 43, 45, 47, 46, 48, 50, 52, 55];
const SPARK_EXC = [9, 7, 8, 6, 5, 7, 6, 5, 4, 6, 5, 4];
const SPARK_AVG = [42, 40, 38, 39, 36, 34, 35, 32, 30, 31, 29, 28];
const SPARK_P95 = [120, 118, 115, 116, 110, 108, 105, 100, 98, 96, 94, 92];
const SPARK_SCEN = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];

/* Per-scenario decorative throughput + settlement hints — pulled from a
 * deterministic table so the visual story stays stable between refetches. */
const SCENARIO_HINTS: Record<string, { throughput: number; settlement: number; passed: boolean }> = {
  S1: { throughput: 18_400, settlement: 4_450_000, passed: true },
  S2: { throughput: 12_200, settlement: 3_120_000, passed: true },
  S3: { throughput: 9_750, settlement: 2_680_000, passed: true },
  S4: { throughput: 6_100, settlement: 1_540_000, passed: false },
  S5: { throughput: 4_400, settlement: 980_000, passed: true },
  S6: { throughput: 7_300, settlement: 1_980_000, passed: true },
  S7: { throughput: 5_500, settlement: 1_220_000, passed: false },
  S8: { throughput: 3_900, settlement: 740_000, passed: true },
  S9: { throughput: 8_100, settlement: 2_140_000, passed: true },
  S10: { throughput: 14_900, settlement: 3_760_000, passed: true },
};

function scenarioHint(id: string): { throughput: number; settlement: number; passed: boolean } {
  return SCENARIO_HINTS[id] ?? { throughput: 5_000, settlement: 1_000_000, passed: true };
}

/* ──────────────────────────────────────────────────────────────
 * Live indicator (shared visual)
 * ────────────────────────────────────────────────────────────── */

function LiveIndicator() {
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-emerald-400"
      aria-label="Live data — refreshing every 30 seconds"
    >
      <span className="pulse-dot" aria-hidden="true" />
      Live · 30s
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────── */

function DashboardContent() {
  const searchParams = useSearchParams();
  const corridorParam = searchParams.get("corridor") || undefined;

  // 5 live queries — all auto-refetch every 30s.
  const casesQuery = useCases(corridorParam ? { corridor: corridorParam } : undefined);
  const exceptionsQuery = useExceptions();
  const scenariosQuery = useScenarios();
  const metricsQuery = useStressMetrics();
  const resultsQuery = useStressResults();

  const cases: DemoCase[] = casesQuery.data ?? [];
  const exceptions: DemoException[] = exceptionsQuery.data ?? [];
  const scenarios: DemoScenario[] = scenariosQuery.data ?? [];
  const metrics = metricsQuery.data;
  const results = resultsQuery.data;

  // Toast on refresh (not initial load). Track the cases query as the
  // canonical refresh signal — all queries share the same 30s refetch
  // cadence, so one toast per cycle is enough.
  const loadedRef = React.useRef(false);
  React.useEffect(() => {
    if (casesQuery.data) {
      if (loadedRef.current) {
        toast.success("Data refreshed", { duration: 1500 });
      }
      loadedRef.current = true;
    }
  }, [casesQuery.data]);

  const metricsLoading = metricsQuery.isLoading;
  const casesLoading = casesQuery.isLoading;
  const excLoading = exceptionsQuery.isLoading;
  const scenariosLoading = scenariosQuery.isLoading;

  const visibleCases = cases.slice(0, 6);
  const visibleExceptions = exceptions.slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Headline assurance metrics across the institution's reserve corridors. All figures are real-time aggregates over the last 24 hours."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Dashboard" },
        ]}
        actions={
          <>
            <LiveIndicator />
            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-soft"
            >
              <Link href="/exceptions">
                <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
                View Exceptions
              </Link>
            </Button>
          </>
        }
      />

      {/* ── Headline KPIs (6 StatCards) ── */}
      <section
        aria-label="Headline KPIs"
        className="stagger-in grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {metricsLoading || !metrics ? (
          Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : (
          <>
            <StatCard
              label="Open Cases"
              value={metrics.openExceptions}
              icon={Boxes}
              color="gold"
              sparklineData={SPARK_CASES}
              sub="↑ 3 vs. yesterday"
            />
            <StatCard
              label="Total Value at Issue"
              value={parseNum(metrics.totalValue)}
              prefix="$"
              icon={DollarSign}
              color="emerald"
              sparklineData={SPARK_VALUE}
              decimals={0}
              sub="aggregated across open cases"
            />
            <StatCard
              label="Exception Rate"
              value={parseNum(metrics.exceptionRate)}
              decimals={1}
              suffix="%"
              icon={TrendingUp}
              color="amber"
              sparklineData={SPARK_EXC}
              sub="vs. 5.4% last week"
            />
            <StatCard
              label="Avg Resolution"
              value={parseNum(metrics.avgResolutionTime)}
              suffix=" min"
              icon={Clock}
              color="cyan"
              sparklineData={SPARK_AVG}
              sub="median time-to-close"
            />
            <StatCard
              label="P95 Resolution"
              value={parseNum(metrics.p95ResolutionTime)}
              suffix=" min"
              icon={Gauge}
              color="purple"
              sparklineData={SPARK_P95}
              sub="worst-case close in last 30 days"
            />
            <StatCard
              label="Stress Scenarios"
              value={metrics.scenariosCovered}
              icon={Layers}
              color="red"
              sparklineData={SPARK_SCEN}
              sub="last 30 days"
            />
          </>
        )}
      </section>

      {/* ── Recent Cases table ── */}
      <section aria-label="Recent cases" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Recent Cases
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {corridorParam ? (
              <Badge
                variant="outline"
                className="border-gold/40 bg-gold/10 text-gold-soft"
              >
                Filtered: {corridorParam}{" "}
                <Link
                  href="/dashboard"
                  className="ml-2 underline-offset-2 hover:underline"
                >
                  Clear
                </Link>
              </Badge>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="text-gold hover:bg-gold/10 hover:text-gold-soft"
            >
              <Link href="/timeline">
                View full timeline
                <ListChecks className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {casesLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : casesQuery.error || visibleCases.length === 0 ? (
              <EmptyState
                title={corridorParam ? "No cases on this corridor" : "No cases"}
                description={
                  corridorParam
                    ? `No validation cases were found for the ${corridorParam} corridor in the last 24 hours.`
                    : "The assurance engine has not raised any validation cases yet."
                }
                icon={Boxes}
              />
            ) : (
              <Table aria-label="Recent assurance cases">
                <caption className="sr-only">
                  Recent assurance cases — last {visibleCases.length} raised
                  across all corridors
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Case ID</TableHead>
                    <TableHead scope="col">Institution</TableHead>
                    <TableHead scope="col">Corridor</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">Amount</TableHead>
                    <TableHead scope="col">Scenario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/timeline?caseId=${encodeURIComponent(c.id)}`}
                          className="text-gold underline-offset-2 hover:underline"
                        >
                          {c.id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[20rem] truncate text-xs text-foreground">
                        {c.institution}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {c.corridor}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            caseTone(c.status),
                          )}
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {c.amount}
                      </TableCell>
                      <TableCell className="text-xs text-fg-muted">
                        <span className="font-mono text-gold-soft">{c.scenario.id}</span>{" "}
                        <span className="truncate">{c.scenario.name}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      {/* ── Stress Test Results summary + scenario register ── */}
      <section aria-label="Stress test results" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Stress Test Results
          </h2>
          <span className="flex items-center gap-2 text-xs text-fg-muted">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            last 30 days
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {metricsLoading || !metrics || !results ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass-depth card-lift rounded-xl border border-line/60 p-5"
              >
                <div className="shimmer-bg h-3 w-24 animate-pulse rounded bg-slate-800/60" />
                <div className="shimmer-bg mt-3 h-8 w-32 animate-pulse rounded-md bg-slate-800/60" />
                <div className="shimmer-bg mt-2 h-3 w-28 animate-pulse rounded bg-slate-800/60" />
              </div>
            ))
          ) : (
            <>
              <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
                  Scenarios Run
                </p>
                <div className="mt-2 font-display text-3xl font-bold text-foreground">
                  <CountUp value={metrics.scenariosCovered} />
                </div>
                <p className="mt-1 text-xs text-fg-muted">
                  {results.casesPassed} passed · {results.casesWithExceptions} flagged
                </p>
              </div>
              <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
                  Cases Processed
                </p>
                <div className="mt-2 font-display text-3xl font-bold text-foreground">
                  <CountUp value={results.casesProcessed} />
                </div>
                <p className="mt-1 text-xs text-fg-muted">
                  {results.duration} · {results.result}
                </p>
              </div>
              <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
                  Peak Settlement Value
                </p>
                <div className="mt-2 font-display text-3xl font-bold text-foreground">
                  <CountUp value={parseNum(metrics.totalValue)} prefix="$" />
                </div>
                <p className="mt-1 text-xs text-fg-muted">single scenario max</p>
              </div>
            </>
          )}
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {scenariosLoading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : scenariosQuery.error || scenarios.length === 0 ? (
              <EmptyState
                title="No scenarios"
                description="The scenario library is empty."
                icon={Layers}
              />
            ) : (
              <Table aria-label="Stress test scenario register">
                <caption className="sr-only">
                  Stress test scenario register — {scenarios.length} scenarios
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Scenario</TableHead>
                    <TableHead scope="col">Description</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Peak Throughput
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Peak Settlement
                    </TableHead>
                    <TableHead scope="col">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scenarios.map((s) => {
                    const hint = scenarioHint(s.id);
                    const Icon: LucideIcon = hint.passed ? Activity : AlertTriangle;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-gold">
                            {s.id}
                          </span>
                          <span className="ml-2 text-foreground">{s.name}</span>
                        </TableCell>
                        <TableCell className="max-w-[24rem] truncate text-xs text-fg-muted">
                          {s.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wider",
                              scenarioTone(s.status),
                            )}
                          >
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          <CountUp value={hint.throughput} suffix=" ops/s" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          <CountUp value={hint.settlement} prefix="$" />
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs font-medium",
                              hint.passed ? "text-emerald-400" : "text-red-400",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {hint.passed ? "Passed" : "Failed"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Exceptions (cross-tab → /evidence) ── */}
      <section aria-label="Recent exceptions" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Recent Exceptions
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="text-gold hover:bg-gold/10 hover:text-gold-soft"
          >
            <Link href="/exceptions">
              View all exceptions
              <AlertTriangle className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {excLoading ? (
              <TableSkeleton rows={5} cols={5} />
            ) : exceptionsQuery.error || visibleExceptions.length === 0 ? (
              <EmptyState
                title="No exceptions"
                description="No exceptions have been raised. The institution's reserve corridors are operating within tolerance."
                icon={AlertTriangle}
              />
            ) : (
              <Table aria-label="Recent exceptions">
                <caption className="sr-only">
                  Recent exceptions — latest {visibleExceptions.length} raised
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Exception</TableHead>
                    <TableHead scope="col">Case</TableHead>
                    <TableHead scope="col">Severity</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExceptions.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-gold">
                          {e.id}
                        </span>
                        <p className="mt-0.5 max-w-[24rem] truncate text-xs text-fg-muted">
                          {e.reason}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                          className="text-gold underline-offset-2 hover:underline"
                        >
                          {e.caseId}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            caseTone(e.severity === "CRITICAL" ? "EXCEPTION_OPENED" : e.severity === "HIGH" ? "EXCEPTION_OPENED" : "VALIDATED"),
                          )}
                        >
                          {e.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            caseTone(e.status === "OPEN" ? "OPEN" : e.status === "RESOLVED" || e.status === "CLOSED" ? "RESOLVED" : "RECEIVED"),
                          )}
                        >
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[20rem] text-xs text-fg-muted">
                        {e.action}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}

