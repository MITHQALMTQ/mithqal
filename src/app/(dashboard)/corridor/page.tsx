"use client";

/**
 * MITHQAL Assurance — Corridor Volume & Value Analytics (/corridor) — LIVE.
 *
 * Aggregates throughput and value across the institution's mint/redeem
 * corridors. Data is sourced LIVE from `useCases()` (corridors + amounts)
 * and `useInstitutions()` (institution cards). Each corridor row carries
 * a small <Sparkline/> next to the volume bar so traders can read recent
 * volume direction at a glance.
 *
 * Cross-tab navigation:
 *   • Each corridor row → /dashboard?corridor=${corridor} ("View in Dashboard")
 *   • Each institution card → /dashboard (filtered by top corridor)
 *   • Each case in the cases table → /timeline?caseId=${id}
 *
 * Live UX:
 *   • StatCardSkeleton while the cases query loads
 *   • TableSkeleton while the corridor / cases tables load
 *   • EmptyState when the query errors or returns zero rows
 *   • toast.success("Data refreshed") on every successful background refetch
 *
 * A11y: sr-only caption, scope="col" on every th, aria-label on every
 * volume bar.
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Activity, DollarSign, Gauge, Route, TrendingUp } from "lucide-react";

import { useCases, useInstitutions, type DemoCase, type DemoInstitution } from "@/hooks/use-demo-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Sparkline } from "@/components/shared/sparkline";
import { CountUp } from "@/components/shared/count-up";
import { RelativeTime } from "@/components/shared/relative-time";
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
 * Helpers — derive synthetic but deterministic corridor metrics
 * ────────────────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  degraded: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  paused: "border-red-400/30 bg-red-400/10 text-red-300",
};

function statusTone(s: string): string {
  return STATUS_TONE[s] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

/**
 * Parse a USD-formatted amount string ("$4,300,000") to a number.
 */
function parseAmount(s: string): number {
  const m = s.match(/[\d][\d,]*(\.\d+)?/);
  if (!m) return 0;
  return Number(m[0].replace(/,/g, ""));
}

/**
 * A small deterministic hash so each corridor has a stable but varied
 * synthetic peak-tps / latency / trend fingerprint.
 */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

function syntheticTrend(corridor: string): number[] {
  const h = hashString(corridor);
  return Array.from({ length: 12 }, (_, i) => {
    const v = ((h >> (i % 8)) & 0xff) % 60;
    return 40 + v + i * 2;
  });
}

interface CorridorRow {
  code: string;
  volume: number; // count of cases on this corridor
  value: number; // sum of amounts
  peakTps: number;
  avgLatencyMs: number;
  status: "active" | "degraded" | "paused";
  trend: number[];
  capacityUsedPct: number;
}

function buildCorridors(cases: DemoCase[]): CorridorRow[] {
  const byCorridor = new Map<string, DemoCase[]>();
  for (const c of cases) {
    if (!byCorridor.has(c.corridor)) byCorridor.set(c.corridor, []);
    byCorridor.get(c.corridor)!.push(c);
  }
  const rows: CorridorRow[] = [];
  for (const [corridor, cs] of byCorridor) {
    const h = hashString(corridor);
    const value = cs.reduce((s, c) => s + parseAmount(c.amount), 0);
    const hasException = cs.some((c) => c.status === "EXCEPTION_OPENED" || c.status === "SAFE_HALTED");
    const hasHalted = cs.some((c) => c.status === "SAFE_HALTED");
    const status: CorridorRow["status"] = hasHalted ? "paused" : hasException ? "degraded" : "active";
    rows.push({
      code: corridor,
      volume: cs.length,
      value,
      peakTps: 200 + (h % 250),
      avgLatencyMs: 320 + (h % 180),
      status,
      trend: syntheticTrend(corridor),
      capacityUsedPct: Math.min(95, Math.round((cs.length / Math.max(1, cs.length + 2)) * 100)),
    });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

function SparklineIcon({ data, label }: { data: number[]; label: string }) {
  return (
    <Sparkline
      data={data}
      color="#f59e0b"
      showArea
      height={28}
      width={70}
      ariaLabel={label}
    />
  );
}

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

/* Sparkline trends for the headline StatCards — decorative trend hints. */
const SPARK_VOL = [320, 312, 340, 335, 360, 380, 372, 400, 412, 425, 430, 460];
const SPARK_VAL = [38, 40, 42, 44, 46, 45, 48, 47, 50, 52, 54, 55];
const SPARK_ACT = [6, 6, 7, 7, 7, 7, 7, 7, 8, 7, 7, 7];
const SPARK_TPS = [380, 392, 410, 405, 412, 415, 408, 414, 412, 418, 415, 412];
const SPARK_LAT = [445, 442, 438, 432, 430, 425, 422, 418, 415, 412, 410, 408];

export default function CorridorPage() {
  const casesQuery = useCases();
  const institutionsQuery = useInstitutions();

  const cases: DemoCase[] = casesQuery.data ?? [];
  const institutions: DemoInstitution[] = institutionsQuery.data ?? [];

  // Toast on refresh. Compare TanStack Query's `dataUpdatedAt` epoch
  // against the previous value held in a ref — no React state is mutated,
  // so this is safe inside an effect.
  const prevUpdatedAt = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      casesQuery.dataUpdatedAt &&
      casesQuery.dataUpdatedAt !== prevUpdatedAt.current
    ) {
      if (prevUpdatedAt.current !== 0) {
        toast.success("Data refreshed", { duration: 1500 });
      }
      prevUpdatedAt.current = casesQuery.dataUpdatedAt;
    }
  }, [casesQuery.dataUpdatedAt]);

  const isLoading = casesQuery.isLoading;
  const isError = !!casesQuery.error;

  const corridors = React.useMemo(() => buildCorridors(cases), [cases]);
  const totalVolume = corridors.reduce((s, r) => s + r.volume, 0);
  const totalValue = corridors.reduce((s, r) => s + r.value, 0);
  const activeCount = corridors.filter((r) => r.status === "active").length;
  const peakTps = corridors.length ? Math.max(...corridors.map((r) => r.peakTps)) : 0;
  const avgLatency = corridors.length
    ? Math.round(corridors.reduce((s, r) => s + r.avgLatencyMs, 0) / corridors.length)
    : 0;
  const maxVol = corridors.length ? Math.max(...corridors.map((r) => r.volume)) : 1;

  // Map institution → case count for the cards.
  const institutionCaseCount = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const c of cases) {
      m.set(c.institution, (m.get(c.institution) ?? 0) + 1);
    }
    return m;
  }, [cases]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Corridor Volume & Value"
        description="Throughput and value across the institution's mint/redeem corridors. The Sparkline beside each bar shows recent volume direction."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Corridor" },
        ]}
        actions={
          <>
            <LiveIndicator />
            {casesQuery.dataUpdatedAt ? (
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                Updated{" "}
                <RelativeTime
                  timestamp={new Date(casesQuery.dataUpdatedAt)}
                  className="text-gold-soft"
                />
              </span>
            ) : null}
          </>
        }
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Corridor headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Volume"
              value={totalVolume}
              icon={Route}
              color="gold"
              sparklineData={SPARK_VOL}
              decimals={0}
              sub="across all corridors"
            />
            <StatCard
              label="Total Value"
              value={totalValue}
              prefix="$"
              icon={DollarSign}
              color="emerald"
              sparklineData={SPARK_VAL}
              decimals={0}
              sub="rolling 24h"
            />
            <StatCard
              label="Active Corridors"
              value={activeCount}
              icon={TrendingUp}
              color="cyan"
              sparklineData={SPARK_ACT}
              sub={`of ${corridors.length} total`}
            />
            <StatCard
              label="Peak TPS"
              value={peakTps}
              icon={Activity}
              color="purple"
              sparklineData={SPARK_TPS}
              decimals={0}
              sub="highest single-corridor"
            />
            <StatCard
              label="Avg Latency"
              value={avgLatency}
              suffix="ms"
              icon={Gauge}
              color="amber"
              sparklineData={SPARK_LAT}
              decimals={0}
              sub="mean settlement"
            />
          </>
        )}
      </section>

      {/* ── Institution cards ── */}
      <section aria-label="Institutions" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Participating Institutions
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : institutions.length === 0 ? (
          <EmptyState
            title="No institutions"
            description="No participating institutions are registered."
            icon={Route}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {institutions.map((inst) => {
              const caseCount = institutionCaseCount.get(inst.name) ?? 0;
              const topCorridor = cases.find((c) => c.institution === inst.name)?.corridor;
              return (
                <Link
                  key={inst.id}
                  href={
                    topCorridor
                      ? `/dashboard?corridor=${encodeURIComponent(topCorridor)}`
                      : "/dashboard"
                  }
                  className="glass-depth card-lift group rounded-xl border border-line/60 p-5 transition-colors hover:border-gold/40"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-foreground group-hover:text-gold-soft">
                        {inst.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                        {inst.id}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-gold/30 bg-gold/10 text-gold-soft"
                    >
                      {inst.jurisdiction}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-fg-muted">{inst.type}</span>
                    <span className="font-mono text-foreground">
                      <CountUp value={caseCount} /> cases
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-gold/80 opacity-0 transition-opacity group-hover:opacity-100">
                    View in Dashboard →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Corridor table ── */}
      <section aria-label="Corridor table" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Corridors
          </h2>
          <span className="text-xs text-fg-muted">
            {corridors.length} corridors · 24h window
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : isError || corridors.length === 0 ? (
              <EmptyState
                title="No corridors"
                description="No corridor activity has been recorded in the last 24 hours."
                icon={Route}
              />
            ) : (
              <Table aria-label="Corridor volume and value">
                <caption className="sr-only">
                  Corridor Volume and Value Analytics
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Corridor</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Volume
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Value
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Peak TPS
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Avg Latency
                    </TableHead>
                    <TableHead scope="col">Volume Bar</TableHead>
                    <TableHead scope="col">Trend</TableHead>
                    <TableHead scope="col" className="text-right">
                      Cross-Tab
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {corridors.map((c) => {
                    const pct = Math.round((c.volume / maxVol) * 100);
                    return (
                      <TableRow key={c.code}>
                        <TableCell>
                          <span className="font-mono text-xs text-gold">
                            {c.code}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wider",
                              statusTone(c.status),
                            )}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          <CountUp value={c.volume} />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          <CountUp value={c.value} prefix="$" />
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          {c.peakTps}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          {c.avgLatencyMs}ms
                        </TableCell>
                        <TableCell>
                          <div
                            className="relative h-2 w-32 overflow-hidden rounded-full bg-ink-card"
                            role="progressbar"
                            aria-label={`Corridor ${c.code} volume bar`}
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-gold-deep via-gold to-gold-soft"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="mt-1 font-mono text-[10px] text-fg-muted">
                            {c.capacityUsedPct}% capacity
                          </p>
                        </TableCell>
                        <TableCell>
                          <SparklineIcon
                            data={c.trend}
                            label={`Volume trend for corridor ${c.code}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/dashboard?corridor=${encodeURIComponent(c.code)}`}
                            className="inline-flex items-center gap-1 text-xs text-gold underline-offset-2 hover:underline"
                          >
                            View in Dashboard
                          </Link>
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

      {/* ── Cases table — each case links to /timeline ── */}
      <section aria-label="Cases by corridor" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Validation Cases
          </h2>
          <span className="text-xs text-fg-muted">
            {cases.length} cases · 24h window
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {isLoading ? (
              <TableSkeleton rows={6} cols={5} />
            ) : isError || cases.length === 0 ? (
              <EmptyState
                title="No cases"
                description="No validation cases have been raised across any corridor."
                icon={Route}
              />
            ) : (
              <Table aria-label="Validation cases by corridor">
                <caption className="sr-only">
                  Validation cases by corridor — {cases.length} cases
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Case</TableHead>
                    <TableHead scope="col">Institution</TableHead>
                    <TableHead scope="col">Corridor</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">
                      Amount
                    </TableHead>
                    <TableHead scope="col" className="text-right">
                      Cross-Tab
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/timeline?caseId=${encodeURIComponent(c.id)}`}
                          className="text-gold underline-offset-2 hover:underline"
                        >
                          {c.id}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-[18rem] truncate text-xs text-foreground">
                        {c.institution}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {c.corridor}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] uppercase tracking-wider"
                        >
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {c.amount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/timeline?caseId=${encodeURIComponent(c.id)}`}
                          className="inline-flex items-center gap-1 text-xs text-gold underline-offset-2 hover:underline"
                        >
                          View Timeline
                        </Link>
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
