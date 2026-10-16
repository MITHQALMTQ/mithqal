"use client";

import { Suspense } from "react";

/**
 * MITHQAL Assurance — Dashboard (overview) — Glassmorphic Command Center.
 *
 * The home tab of the (dashboard) AppShell. Aggregates the institution's
 * six headline KPIs through the <StatCard/> primitive, sourced LIVE from
 * the React Query hooks in @/hooks/use-demo-data:
 *
 *   • useStressMetrics()  — 6 KPI tiles
 *   • useStressResults()  — inline summary in the DEMO alert
 *   • useScenarios()      — Scenario Coverage card grid
 *   • useCases()          — Validation Cases table (5 rows, → /timeline)
 *   • useExceptions()     — Exceptions table (3 rows, → /evidence)
 *
 * Cross-tab navigation:
 *   • Each Case ID in the cases table → /timeline?caseId=${id}
 *   • Each exception's caseId → /evidence?caseId=${caseId}
 *   • "View all" links → /timeline + /exceptions
 *
 * Visual direction (deliberately different from the prior design):
 *   • Glassmorphic cards: bg-white/[0.02] + backdrop-blur + hairline
 *     borders (border-white/5)
 *   • Teal/cyan accent for active links + scenario IDs (new — the old
 *     design was amber-only)
 *   • Amber accents retained for DEMO badge + scenario IDs in tables
 *   • Stagger-in animation on the 6-tile stat grid (kept from old)
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  Clock,
  DollarSign,
  Gauge,
  Layers,
  TrendingUp,
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
  return (
    CASE_STATUS_TONE[status] ??
    "border-slate-400/30 bg-slate-400/10 text-slate-300"
  );
}

function scenarioTone(status: string): string {
  return (
    SCENARIO_TONE[status] ??
    "border-slate-400/30 bg-slate-400/10 text-slate-300"
  );
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

/* Headline KPI sparklines — decorative trend hints (not real series).
 * Picked to look plausible next to each metric's live value. */
const SPARK_CASES = [12, 14, 11, 16, 15, 18, 20, 19, 22, 21, 24, 20];
const SPARK_VALUE = [40, 38, 42, 41, 43, 45, 47, 46, 48, 50, 52, 48];
const SPARK_EXC = [9, 7, 8, 6, 5, 7, 6, 5, 4, 6, 5, 4];
const SPARK_AVG = [18, 17, 16, 15, 16, 15, 14, 13, 14, 13, 14, 14];
const SPARK_P95 = [38, 36, 35, 34, 33, 34, 32, 33, 32, 31, 32, 32];
const SPARK_SCEN = [6, 7, 7, 8, 8, 9, 9, 10, 10, 10, 10, 10];

/* ──────────────────────────────────────────────────────────────
 * Page
 * ────────────────────────────────────────────────────────────── */

function DashboardContent() {
  // 5 live queries — all auto-refetch every 30s (cadence set in the hooks).
  const casesQuery = useCases();
  const exceptionsQuery = useExceptions();
  const scenariosQuery = useScenarios();
  const metricsQuery = useStressMetrics();
  const resultsQuery = useStressResults();

  const cases: DemoCase[] = casesQuery.data ?? [];
  const exceptions: DemoException[] = exceptionsQuery.data ?? [];
  const scenarios: DemoScenario[] = scenariosQuery.data ?? [];
  const metrics = metricsQuery.data;
  const results = resultsQuery.data;

  const metricsLoading = metricsQuery.isLoading;
  const casesLoading = casesQuery.isLoading;
  const excLoading = exceptionsQuery.isLoading;
  const scenariosLoading = scenariosQuery.isLoading;

  const visibleCases = cases.slice(0, 5);
  const visibleExceptions = exceptions.slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description="Stress Test Simulation — Full Platform"
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Dashboard" },
        ]}
      />

      {/* ── Inline DEMO alert (not the Alert component — a styled div) ── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-2.5 backdrop-blur-sm">
        <span
          aria-hidden="true"
          className="flex h-2 w-2 shrink-0 rounded-full bg-amber-400"
        />
        <p className="text-xs text-amber-100/80">
          <span className="font-semibold text-amber-300">DEMO MODE</span>
          <span className="mx-2 text-amber-200/30">·</span>
          Synthetic dataset — 20 validation cases across 10 stress scenarios with 10 exceptions raised.
          {!resultsQuery.isLoading && results ? (
            <>
              {" "}
              <span className="text-amber-200/40">|</span>{" "}
              <span className="font-mono text-amber-200/70">
                {results.casesProcessed} processed · {results.casesPassed} passed · {results.duration} · {results.result}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {/* ── Headline KPIs (6 StatCards, stagger-in) ── */}
      <div className="stagger-in grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {metricsLoading || !metrics ? (
          Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : (
          <>
            <StatCard
              label="Cases"
              value={metrics.totalCases}
              icon={Boxes}
              color="gold"
              sparklineData={SPARK_CASES}
              sub="last 24h"
            />
            <StatCard
              label="Total Value"
              value={parseNum(metrics.totalValue)}
              prefix="$"
              icon={DollarSign}
              color="emerald"
              sparklineData={SPARK_VALUE}
              decimals={0}
              sub="at issue"
            />
            <StatCard
              label="Exception Rate"
              value={parseNum(metrics.exceptionRate)}
              decimals={1}
              suffix="%"
              icon={TrendingUp}
              color="amber"
              sparklineData={SPARK_EXC}
              sub="of cases"
            />
            <StatCard
              label="Avg Resolution"
              value={parseNum(metrics.avgResolutionTime)}
              suffix=" min"
              icon={Clock}
              color="cyan"
              sparklineData={SPARK_AVG}
              sub="median time"
            />
            <StatCard
              label="P95 Resolution"
              value={parseNum(metrics.p95ResolutionTime)}
              suffix=" min"
              icon={Gauge}
              color="purple"
              sparklineData={SPARK_P95}
              sub="worst-case"
            />
            <StatCard
              label="Scenarios"
              value={metrics.scenariosCovered}
              icon={Layers}
              color="red"
              sparklineData={SPARK_SCEN}
              sub="covered"
            />
          </>
        )}
      </div>

      {/* ── Scenario Coverage card grid ── */}
      <section aria-label="Scenario coverage" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Scenario Coverage
          </h2>
          <span className="font-mono text-[10px] text-slate-500">
            {scenarios.length || "—"} scenarios
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          {scenariosLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl border border-white/5 bg-white/[0.02]"
                aria-hidden="true"
              />
            ))
          ) : scenariosQuery.error || scenarios.length === 0 ? (
            <div className="col-span-2 lg:col-span-5">
              <EmptyState
                title="No scenarios"
                description="The scenario library is empty."
                icon={Layers}
              />
            </div>
          ) : (
            scenarios.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.05]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {s.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[9px] uppercase tracking-wider",
                      scenarioTone(s.status),
                    )}
                  >
                    {s.status}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-slate-300">
                  {s.name}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Validation Cases table ── */}
      <section aria-label="Validation cases" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Validation Cases
          </h2>
          <Link
            href="/timeline"
            className="text-[10px] font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
          {casesLoading ? (
            <div className="p-4">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : casesQuery.error || visibleCases.length === 0 ? (
            <EmptyState
              title="No cases"
              description="The assurance engine has not raised any validation cases yet."
              icon={Boxes}
            />
          ) : (
            <Table aria-label="Validation cases">
              <caption className="sr-only">
                Validation cases — latest {visibleCases.length} raised across
                all corridors
              </caption>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Case ID
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Institution
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Corridor
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Amount
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Status
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Scenario
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleCases.map((c) => (
                  <TableRow key={c.id} className="border-white/5">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/timeline?caseId=${encodeURIComponent(c.id)}`}
                        className="text-cyan-400 transition-colors hover:text-cyan-300"
                      >
                        {c.id}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-xs text-slate-300">
                      {c.institution}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">
                      {c.corridor}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-200">
                      {c.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider",
                          caseTone(c.status),
                        )}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      <span className="font-mono text-amber-400">
                        {c.scenario.id}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>

      {/* ── Exceptions table ── */}
      <section aria-label="Recent exceptions" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Exceptions
          </h2>
          <Link
            href="/exceptions"
            className="text-[10px] font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
          {excLoading ? (
            <div className="p-4">
              <TableSkeleton rows={3} cols={4} />
            </div>
          ) : exceptionsQuery.error || visibleExceptions.length === 0 ? (
            <EmptyState
              title="No exceptions"
              description="No exceptions have been raised. The reserve corridors are operating within tolerance."
              icon={AlertTriangle}
            />
          ) : (
            <Table aria-label="Recent exceptions">
              <caption className="sr-only">
                Recent exceptions — latest {visibleExceptions.length} raised
              </caption>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Case ID
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Code
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Severity
                  </TableHead>
                  <TableHead
                    scope="col"
                    className="text-[10px] uppercase tracking-wider text-slate-500"
                  >
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleExceptions.map((e) => (
                  <TableRow key={e.id} className="border-white/5">
                    <TableCell className="font-mono text-xs">
                      <Link
                        href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                        className="text-cyan-400 transition-colors hover:text-cyan-300"
                      >
                        {e.caseId}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-300">
                      {e.code}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider",
                          e.severity === "CRITICAL"
                            ? "border-red-400/30 bg-red-400/10 text-red-300"
                            : e.severity === "HIGH"
                              ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                              : "border-slate-400/30 bg-slate-400/10 text-slate-300",
                        )}
                      >
                        {e.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[9px] uppercase tracking-wider",
                          caseTone(
                            e.status === "OPEN"
                              ? "OPEN"
                              : e.status === "RESOLVED" ||
                                  e.status === "CLOSED"
                                ? "RESOLVED"
                                : "RECEIVED",
                          ),
                        )}
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400">Loading…</div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
