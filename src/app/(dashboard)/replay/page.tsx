"use client";

/**
 * MITHQAL Assurance — Historical Case Replay (/replay).
 *
 * A read-only log of every historical case the assurance engine has
 * replayed through the simulation workbench. Useful for "what would
 * have happened if…" dry-runs against today's reserve configuration.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Replayed, Pass Rate, Avg Sim Time, Peak NAV at Risk,
 *     Last Replay) wrapped in `.stagger-in`
 *   • Replay execution log table with CountUp on the Replayed count
 *
 * A11y: sr-only caption, scope="col" on every th.
 */

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  DollarSign,
  Gauge,
  History,
  PlayCircle,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp } from "@/components/shared/count-up";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo data.
 * ────────────────────────────────────────────────────────────── */

type ReplayRow = {
  id: string;
  caseRef: string;
  scenario: string;
  replayedAt: string;
  simMs: number;
  peakNavAtRisk: number;
  passed: boolean;
  notes: string;
};

const DEMO_REPLAYS: ReplayRow[] = [
  {
    id: "RPL-2024-0918-001",
    caseRef: "CSE-2024-0418",
    scenario: "EUR → XAU corridor breach — replay with today's reserves",
    replayedAt: "2024-04-18 09:30",
    simMs: 1842,
    peakNavAtRisk: 4_180_000,
    passed: true,
    notes: "Reserve absorbs the shock; no insolvency path triggered.",
  },
  {
    id: "RPL-2024-0917-004",
    caseRef: "CSE-2024-0417",
    scenario: "USD-CHF settlement exceedance — replay with rail B failover",
    replayedAt: "2024-04-17 22:14",
    simMs: 2114,
    peakNavAtRisk: 12_500_000,
    passed: false,
    notes: "Rail B failover 8s late; sub-custody insolvency path triggered.",
  },
  {
    id: "RPL-2024-0916-003",
    caseRef: "CSE-2024-0416",
    scenario: "POR drift remediation — replay with vault rebalance",
    replayedAt: "2024-04-16 18:50",
    simMs: 928,
    peakNavAtRisk: 1_950_000,
    passed: true,
    notes: "Rebalance closes the drift in <2h; proof re-publishes clean.",
  },
  {
    id: "RPL-2024-0915-002",
    caseRef: "CSE-2024-0415",
    scenario: "AED-USD ledger lag — replay with 24h async settlement",
    replayedAt: "2024-04-15 15:10",
    simMs: 1456,
    peakNavAtRisk: 880_000,
    passed: true,
    notes: "Async settlement masks the lag; corridor remains healthy.",
  },
  {
    id: "RPL-2024-0914-001",
    caseRef: "CSE-2024-0414",
    scenario: "QNB sanctions FP — replay with tuned screening threshold",
    replayedAt: "2024-04-14 11:20",
    simMs: 612,
    peakNavAtRisk: 720_000,
    passed: true,
    notes: "Threshold reduces false-positive rate by 38%; no real hits.",
  },
  {
    id: "RPL-2024-0913-005",
    caseRef: "CSE-2024-0413",
    scenario: "HKD-USD mint imbalance — replay with treasury rebalance",
    replayedAt: "2024-04-13 20:18",
    simMs: 1328,
    peakNavAtRisk: 3_410_000,
    passed: true,
    notes: "Treasury rebalance closes the imbalance in 90 minutes.",
  },
  {
    id: "RPL-2024-0912-002",
    caseRef: "CSE-2024-0412",
    scenario: "XAU oracle staleness — replay with backup oracle fail-over",
    replayedAt: "2024-04-12 16:42",
    simMs: 744,
    peakNavAtRisk: 0,
    passed: true,
    notes: "Backup oracle provides 4s gap; no settlement reversals.",
  },
];

const SPARK_REPLAYED = [4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 9];
const SPARK_PASS = [88, 89, 91, 90, 92, 93, 92, 94, 95, 94, 96, 97];
const SPARK_SIM = [2200, 2100, 2050, 1980, 1950, 1900, 1850, 1800, 1750, 1700, 1650, 1600];
const SPARK_NAV = [12, 11, 10, 9, 8, 9, 7, 6, 5, 4, 3, 2];
const SPARK_LAST = [4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 9];

const PASSED = DEMO_REPLAYS.filter((r) => r.passed).length;
const PASS_RATE = Math.round((PASSED / DEMO_REPLAYS.length) * 100);
const AVG_SIM = Math.round(
  DEMO_REPLAYS.reduce((s, r) => s + r.simMs, 0) / DEMO_REPLAYS.length,
);
const PEAK_NAV = Math.max(...DEMO_REPLAYS.map((r) => r.peakNavAtRisk));

export default function ReplayPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Historical Case Replay"
        description="Every historical case the assurance engine has replayed through today's reserve configuration — a dry-run record of what would have happened if the past repeated itself now."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Replay" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Replay headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Replayed"
          value={DEMO_REPLAYS.length}
          icon={History}
          color="gold"
          sparklineData={SPARK_REPLAYED}
          sub="last 30 days"
        />
        <StatCard
          label="Pass Rate"
          value={PASS_RATE}
          suffix="%"
          icon={TrendingUp}
          color="emerald"
          sparklineData={SPARK_PASS}
          decimals={0}
          sub="replays passing SLA"
        />
        <StatCard
          label="Avg Sim Time"
          value={AVG_SIM}
          suffix="ms"
          icon={Clock}
          color="cyan"
          sparklineData={SPARK_SIM}
          decimals={0}
          sub="per replay"
        />
        <StatCard
          label="Peak NAV at Risk"
          value={PEAK_NAV}
          prefix="$"
          icon={DollarSign}
          color="amber"
          sparklineData={SPARK_NAV}
          decimals={0}
          sub="single worst-case replay"
        />
        <StatCard
          label="Last Replay"
          value={9}
          suffix="h ago"
          icon={Gauge}
          color="purple"
          sparklineData={SPARK_LAST}
          decimals={0}
          sub="most recent execution"
        />
      </section>

      {/* ── Replay log table ── */}
      <section aria-label="Replay execution log" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Execution Log
          </h2>
          <span className="text-xs text-fg-muted">
            <CountUp value={DEMO_REPLAYS.length} /> replays logged
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Historical case replay execution log">
              <caption className="sr-only">
                Historical case replay execution log
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Replay</TableHead>
                  <TableHead scope="col">Case</TableHead>
                  <TableHead scope="col">Scenario</TableHead>
                  <TableHead scope="col" className="text-right">
                    Sim Time
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Peak NAV at Risk
                  </TableHead>
                  <TableHead scope="col">Result</TableHead>
                  <TableHead scope="col">Replayed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_REPLAYS.map((r) => {
                  const Icon = r.passed ? CheckCircle2 : PlayCircle;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs text-gold">
                        {r.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {r.caseRef}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-[28rem] truncate text-xs text-foreground">
                          {r.scenario}
                        </p>
                        <p className="mt-0.5 max-w-[28rem] truncate text-[11px] text-fg-muted">
                          {r.notes}
                        </p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {r.simMs}ms
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {r.peakNavAtRisk > 0
                          ? `$${r.peakNavAtRisk.toLocaleString("en-US")}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            r.passed ? "text-emerald-400" : "text-amber-400",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {r.passed ? "Passed" : "Failed"}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {r.replayedAt}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <CountUp value={DEMO_REPLAYS.length} /> replays ·{" "}
          <CountUp value={PASSED} /> passed ·{" "}
          <CountUp value={DEMO_REPLAYS.length - PASSED} /> flagged for treasury
          committee review.
        </p>
      </section>
    </div>
  );
}
