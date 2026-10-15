"use client";

/**
 * MITHQAL Assurance — Dashboard (overview).
 *
 * The home tab of the (dashboard) AppShell. Aggregates the institution's
 * six headline KPIs through the new <StatCard/> primitive (animated
 * count-up + sparkline), and presents two reference tables:
 *
 *   • Recent Cases         — the last cases that touched the assurance engine
 *   • Stress Test Results  — the most recent scenario runs (with CountUp)
 *
 * Visual language: amber/gold dark theme, glass-depth stat cards, staggered
 * entrance via the `.stagger-in` utility, sr-only captions + scope="col"
 * on every table for screen-reader users.
 *
 * Data is demo-only — hard-coded arrays on this file. A downstream phase
 * will swap these for a TanStack Query hook against /api/v25.1/assurance.
 */

import * as React from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo data — replaced by a live hook in a later phase.
 * ────────────────────────────────────────────────────────────── */

type CaseRow = {
  id: string;
  title: string;
  corridor: string;
  status: "open" | "in-review" | "resolved" | "blocked";
  value: number;
  raisedAt: string;
};

const DEMO_CASES: CaseRow[] = [
  {
    id: "CSE-2024-0418",
    title: "EUR → XAU corridor breach — Santander vault B",
    corridor: "EUR-XAU",
    status: "in-review",
    value: 4_180_000,
    raisedAt: "2024-04-18 09:14",
  },
  {
    id: "CSE-2024-0417",
    title: "Settlement window exceedance — JP-Morgan sub-custodian",
    corridor: "USD-CHF",
    status: "open",
    value: 12_500_000,
    raisedAt: "2024-04-17 16:02",
  },
  {
    id: "CSE-2024-0416",
    title: "Proof-of-reserve reconciliation drift — HSBC London",
    corridor: "GBP-XAU",
    status: "resolved",
    value: 1_950_000,
    raisedAt: "2024-04-16 11:48",
  },
  {
    id: "CSE-2024-0415",
    title: "Off-chain ledger lag — Bank Audi Beirut sub-custody",
    corridor: "AED-USD",
    status: "blocked",
    value: 880_000,
    raisedAt: "2024-04-15 14:21",
  },
  {
    id: "CSE-2024-0414",
    title: "Sanctions screening false-positive — QNB Doha",
    corridor: "QAR-USD",
    status: "resolved",
    value: 720_000,
    raisedAt: "2024-04-14 08:05",
  },
  {
    id: "CSE-2024-0413",
    title: "Mint-redeem imbalance — Standard Chartered HK",
    corridor: "HKD-USD",
    status: "in-review",
    value: 3_410_000,
    raisedAt: "2024-04-13 19:33",
  },
];

type ScenarioRow = {
  id: string;
  name: string;
  severity: "info" | "warning" | "severe";
  peakThroughput: number;
  peakSettlement: number;
  passed: boolean;
};

const DEMO_SCENARIOS: ScenarioRow[] = [
  {
    id: "STR-001",
    name: "Lehman-style sub-custodian default",
    severity: "severe",
    peakThroughput: 18_400,
    peakSettlement: 4_450_000,
    passed: true,
  },
  {
    id: "STR-002",
    name: "EUR/CHF 30% revaluation shock",
    severity: "severe",
    peakThroughput: 12_200,
    peakSettlement: 3_120_000,
    passed: true,
  },
  {
    id: "STR-003",
    name: "BlackRock redemption wave (12% NAV)",
    severity: "warning",
    peakThroughput: 9_750,
    peakSettlement: 2_680_000,
    passed: true,
  },
  {
    id: "STR-004",
    name: "SWIFT outage 4h — manual reconciliation",
    severity: "warning",
    peakThroughput: 6_100,
    peakSettlement: 1_540_000,
    passed: false,
  },
  {
    id: "STR-005",
    name: "Oracle staleness > 90s",
    severity: "info",
    peakThroughput: 4_400,
    peakSettlement: 980_000,
    passed: true,
  },
];

const STATUS_TONE: Record<CaseRow["status"], string> = {
  open: "border-red-400/30 bg-red-400/10 text-red-300",
  "in-review": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  resolved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  blocked: "border-purple-400/30 bg-purple-400/10 text-purple-300",
};

const SEVERITY_TONE: Record<ScenarioRow["severity"], string> = {
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  severe: "border-red-400/30 bg-red-400/10 text-red-300",
};

/* Headline KPI sparklines — decorative trend hints, not real data. */
const SPARK_CASES = [10, 12, 8, 15, 14, 18, 20, 22, 21, 24, 26, 28];
const SPARK_VALUE = [40, 38, 42, 41, 43, 45, 47, 46, 48, 50, 52, 55];
const SPARK_EXC = [9, 7, 8, 6, 5, 7, 6, 5, 4, 6, 5, 4];
const SPARK_AVG = [42, 40, 38, 39, 36, 34, 35, 32, 30, 31, 29, 28];
const SPARK_P95 = [120, 118, 115, 116, 110, 108, 105, 100, 98, 96, 94, 92];
const SPARK_SCEN = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];

export default function DashboardPage() {
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
        }
      />

      {/* ── Headline KPIs (6 StatCards) ── */}
      <section
        aria-label="Headline KPIs"
        className="stagger-in grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <StatCard
          label="Open Cases"
          value={28}
          icon={Boxes}
          color="gold"
          sparklineData={SPARK_CASES}
          sub="↑ 3 vs. yesterday"
        />
        <StatCard
          label="Total Value at Issue"
          value={4_450_000}
          prefix="$"
          icon={DollarSign}
          color="emerald"
          sparklineData={SPARK_VALUE}
          decimals={0}
          sub="aggregated across open cases"
        />
        <StatCard
          label="Exception Rate"
          value={4.8}
          decimals={1}
          suffix="%"
          icon={TrendingUp}
          color="amber"
          sparklineData={SPARK_EXC}
          sub="vs. 5.4% last week"
        />
        <StatCard
          label="Avg Resolution"
          value={28}
          suffix="h"
          icon={Clock}
          color="cyan"
          sparklineData={SPARK_AVG}
          sub="median time-to-close"
        />
        <StatCard
          label="P95 Resolution"
          value={92}
          suffix="h"
          icon={Gauge}
          color="purple"
          sparklineData={SPARK_P95}
          sub="worst-case close in last 30 days"
        />
        <StatCard
          label="Stress Scenarios"
          value={9}
          icon={Layers}
          color="red"
          sparklineData={SPARK_SCEN}
          sub="last 30 days"
        />
      </section>

      {/* ── Recent Cases table ── */}
      <section aria-label="Recent cases" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Recent Cases
          </h2>
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

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Recent assurance cases">
              <caption className="sr-only">
                Recent assurance cases — last 6 raised across all corridors
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Case ID</TableHead>
                  <TableHead scope="col">Title</TableHead>
                  <TableHead scope="col">Corridor</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">Value</TableHead>
                  <TableHead scope="col">Raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_CASES.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-gold">
                      {c.id}
                    </TableCell>
                    <TableCell className="max-w-[26rem] truncate text-foreground">
                      {c.title}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {c.corridor}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          STATUS_TONE[c.status],
                        )}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      ${c.value.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {c.raisedAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* ── Stress Test Results table + summary tiles ── */}
      <section aria-label="Stress test results" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Stress Test Results
          </h2>
          <span className="flex items-center gap-2 text-xs text-fg-muted">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            last 30 days
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
              Scenarios Run
            </p>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">
              <CountUp value={9} />
            </div>
            <p className="mt-1 text-xs text-fg-muted">5 passed · 4 in review</p>
          </div>
          <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
              Peak Throughput
            </p>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">
              <CountUp value={18_400} suffix=" ops/s" />
            </div>
            <p className="mt-1 text-xs text-fg-muted">across all scenarios</p>
          </div>
          <div className="glass-depth card-lift rounded-xl border border-line/60 p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
              Peak Settlement Value
            </p>
            <div className="mt-2 font-display text-3xl font-bold text-foreground">
              <CountUp value={4_450_000} prefix="$" />
            </div>
            <p className="mt-1 text-xs text-fg-muted">single scenario max</p>
          </div>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Stress test scenario results">
              <caption className="sr-only">
                Stress test scenarios executed in the last 30 days — peak
                throughput and settlement value, pass/fail status
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Scenario</TableHead>
                  <TableHead scope="col">Severity</TableHead>
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
                {DEMO_SCENARIOS.map((s) => {
                  const Icon: LucideIcon = s.passed
                    ? Activity
                    : AlertTriangle;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-gold">
                          {s.id}
                        </span>
                        <span className="ml-2 text-foreground">{s.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            SEVERITY_TONE[s.severity],
                          )}
                        >
                          {s.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        <CountUp value={s.peakThroughput} suffix=" ops/s" />
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        <CountUp value={s.peakSettlement} prefix="$" />
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-xs font-medium",
                            s.passed ? "text-emerald-400" : "text-red-400",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {s.passed ? "Passed" : "Failed"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
