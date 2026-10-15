"use client";

/**
 * MITHQAL Assurance — MTQ Σ Research (/mtq-sigma).
 *
 * A research-only page summarising the institution's "Σ" research stream
 * — a quantitative read of the systemic exposure engine's simulation
 * outputs, signed off by the treasury committee on a monthly cadence.
 *
 * Per the PHASE2 task, this page only needs:
 *   • A PageHeader with breadcrumbs `[{Assurance, href: "/"}, {MTQ Σ}]`
 *
 * No other restructuring — the page is intentionally minimal.
 */

import * as React from "react";
import { FlaskConical, GitBranch, Layers, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
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
 * Demo data — Σ research stream.
 * ────────────────────────────────────────────────────────────── */

type SigmaRow = {
  id: string;
  scenario: string;
  navAtRisk: number;
  passRate: number;
  status: "stable" | "watch" | "breach";
};

const DEMO_ROWS: SigmaRow[] = [
  {
    id: "Σ-001",
    scenario: "Sub-custodian default — SCB-LDN",
    navAtRisk: 4_180_000,
    passRate: 99.4,
    status: "stable",
  },
  {
    id: "Σ-002",
    scenario: "EUR/CHF 30% revaluation shock",
    navAtRisk: 3_120_000,
    passRate: 98.1,
    status: "watch",
  },
  {
    id: "Σ-003",
    scenario: "BlackRock redemption wave (12% NAV)",
    navAtRisk: 2_680_000,
    passRate: 97.4,
    status: "watch",
  },
  {
    id: "Σ-004",
    scenario: "SWIFT outage 4h — manual reconciliation",
    navAtRisk: 1_540_000,
    passRate: 89.2,
    status: "breach",
  },
];

const STATUS_TONE: Record<SigmaRow["status"], string> = {
  stable: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  watch: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  breach: "border-red-400/30 bg-red-400/10 text-red-300",
};

const SPARK_SCEN = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_NAV = [12, 11, 10, 9, 8, 9, 7, 6, 5, 4, 3, 2];
const SPARK_PASS = [88, 89, 91, 90, 92, 93, 92, 94, 95, 94, 96, 97];
const SPARK_LATEST = [4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 9];

export default function MtqSigmaPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="MTQ Σ Research"
        description="Monthly Σ research stream — quantitative read of the systemic exposure engine's simulation outputs. Signed off by the treasury committee."
        breadcrumbs={[
          { label: "Research", href: "/" },
          { label: "MTQ Σ" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Σ research headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      >
        <StatCard
          label="Scenarios"
          value={DEMO_ROWS.length}
          icon={Layers}
          color="gold"
          sparklineData={SPARK_SCEN}
          sub="this month"
        />
        <StatCard
          label="Peak NAV at Risk"
          value={Math.max(...DEMO_ROWS.map((r) => r.navAtRisk))}
          prefix="$"
          icon={TrendingUp}
          color="emerald"
          sparklineData={SPARK_NAV}
          decimals={0}
          sub="single worst-case"
        />
        <StatCard
          label="Avg Pass Rate"
          value={(
            DEMO_ROWS.reduce((s, r) => s + r.passRate, 0) / DEMO_ROWS.length
          )}
          suffix="%"
          icon={GitBranch}
          color="cyan"
          sparklineData={SPARK_PASS}
          decimals={1}
          sub="across scenarios"
        />
        <StatCard
          label="Latest Run"
          value={9}
          suffix="h ago"
          icon={FlaskConical}
          color="purple"
          sparklineData={SPARK_LATEST}
          decimals={0}
          sub="simulation workbench"
        />
      </section>

      {/* ── Σ scenarios table ── */}
      <section aria-label="Σ scenarios table" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Σ Scenario Register
          </h2>
          <span className="text-xs text-fg-muted">
            {DEMO_ROWS.length} scenarios · monthly cadence
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="MTQ Σ scenario register">
              <caption className="sr-only">
                MTQ Σ scenario register — monthly systemic exposure simulation
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Scenario</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">
                    NAV at Risk
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Pass Rate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_ROWS.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-gold">{r.id}</span>
                      <span className="ml-2 text-foreground">
                        {r.scenario}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          STATUS_TONE[r.status],
                        )}
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      ${r.navAtRisk.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {r.passRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>
    </div>
  );
}
