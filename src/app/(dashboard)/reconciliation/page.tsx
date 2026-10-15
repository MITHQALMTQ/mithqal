"use client";

/**
 * MITHQAL Assurance — Cross-Source Reconciliation (/reconciliation).
 *
 * A matrix of every source-of-truth the assurance engine compares against
 * (sub-custody ledgers, on-chain proofs, oracles, treasury books). Each
 * row carries a small <Sparkline/> so the reader can read recent
 * match-rate direction at a glance, and a progress-bar visualising the
 * match-rate against the institutional 99.5% threshold.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Avg Match Rate, Sources Checked, Drift Detected,
 *     Reconciliations, Last Run) wrapped in `.stagger-in`
 *   • Cross-source reconciliation matrix table with Sparkline per row
 *
 * A11y: sr-only caption, scope="col" on every th, aria-label on every bar.
 */

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  Database,
  Layers,
  Scale,
  TrendingDown,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Sparkline } from "@/components/shared/sparkline";
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
 * Demo data — 8 sources of truth.
 * ────────────────────────────────────────────────────────────── */

type SourceRow = {
  code: string;
  description: string;
  /** Match rate as a percentage (0–100). */
  matchRate: number;
  driftPct: number;
  lastRun: string;
  status: "matched" | "drift" | "stale";
  /** 12-point match-rate trend for the Sparkline. */
  trend: number[];
};

const DEMO_SOURCES: SourceRow[] = [
  {
    code: "SCB-LDN",
    description: "Standard Chartered London — sub-custody ledger",
    matchRate: 99.98,
    driftPct: 0.02,
    lastRun: "2024-04-18 09:00",
    status: "matched",
    trend: [99.92, 99.94, 99.95, 99.93, 99.96, 99.97, 99.95, 99.98, 99.97, 99.99, 99.98, 99.98],
  },
  {
    code: "JPM-NY",
    description: "JP Morgan New York — sub-custody ledger",
    matchRate: 99.81,
    driftPct: 0.19,
    lastRun: "2024-04-18 08:30",
    status: "drift",
    trend: [99.90, 99.88, 99.85, 99.86, 99.84, 99.82, 99.83, 99.81, 99.82, 99.80, 99.81, 99.81],
  },
  {
    code: "HSBC-HK",
    description: "HSBC Hong Kong — sub-custody ledger",
    matchRate: 100.0,
    driftPct: 0,
    lastRun: "2024-04-18 09:05",
    status: "matched",
    trend: [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0],
  },
  {
    code: "ONCHAIN-PROOF",
    description: "Merkle proof of reserves — on-chain anchor",
    matchRate: 100.0,
    driftPct: 0,
    lastRun: "2024-04-18 09:00",
    status: "matched",
    trend: [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0],
  },
  {
    code: "ORACLE-XAU",
    description: "XAU spot oracle — Chainlink reference feed",
    matchRate: 99.94,
    driftPct: 0.06,
    lastRun: "2024-04-18 09:01",
    status: "matched",
    trend: [99.88, 99.90, 99.92, 99.91, 99.93, 99.94, 99.92, 99.95, 99.94, 99.96, 99.94, 99.94],
  },
  {
    code: "TREASURY-BOOK",
    description: "Treasury book — internal ledger of record",
    matchRate: 99.97,
    driftPct: 0.03,
    lastRun: "2024-04-18 08:45",
    status: "matched",
    trend: [99.90, 99.92, 99.93, 99.94, 99.95, 99.94, 99.96, 99.97, 99.96, 99.98, 99.97, 99.97],
  },
  {
    code: "AUDI-BEY",
    description: "Bank Audi Beirut — sub-custody ledger",
    matchRate: 99.62,
    driftPct: 0.38,
    lastRun: "2024-04-18 06:15",
    status: "stale",
    trend: [99.85, 99.82, 99.80, 99.78, 99.76, 99.74, 99.72, 99.70, 99.68, 99.65, 99.63, 99.62],
  },
  {
    code: "QNB-DOH",
    description: "Qatar National Bank Doha — sub-custody ledger",
    matchRate: 99.99,
    driftPct: 0.01,
    lastRun: "2024-04-18 08:50",
    status: "matched",
    trend: [99.95, 99.96, 99.97, 99.96, 99.98, 99.97, 99.99, 99.98, 99.99, 99.99, 99.99, 99.99],
  },
];

const STATUS_TONE: Record<SourceRow["status"], string> = {
  matched: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  drift: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  stale: "border-red-400/30 bg-red-400/10 text-red-300",
};

const SPARK_MATCH = [99.7, 99.78, 99.82, 99.85, 99.88, 99.91, 99.89, 99.93, 99.95, 99.94, 99.96, 99.97];
const SPARK_SRC = [6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8];
const SPARK_DRIFT = [1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.3];
const SPARK_RECON = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34];
const SPARK_LAST = [6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10, 9];

const AVG_MATCH = (
  DEMO_SOURCES.reduce((s, r) => s + r.matchRate, 0) / DEMO_SOURCES.length
).toFixed(2);
const DRIFT_DETECTED = DEMO_SOURCES.filter(
  (s) => s.status === "drift" || s.status === "stale",
).length;

export default function ReconciliationPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cross-Source Reconciliation"
        description="Continuous matching across every source-of-truth — sub-custody ledgers, on-chain proofs, oracles, and the treasury book — against the canonical MITHQAL supply."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Reconciliation" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Reconciliation headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Avg Match Rate"
          value={Number(AVG_MATCH)}
          suffix="%"
          icon={Scale}
          color="emerald"
          sparklineData={SPARK_MATCH}
          decimals={2}
          sub="institutional threshold 99.5%"
        />
        <StatCard
          label="Sources Checked"
          value={DEMO_SOURCES.length}
          icon={Database}
          color="gold"
          sparklineData={SPARK_SRC}
          sub="every 5 minutes"
        />
        <StatCard
          label="Drift Detected"
          value={DRIFT_DETECTED}
          icon={TrendingDown}
          color="amber"
          sparklineData={SPARK_DRIFT}
          sub="requires action"
        />
        <StatCard
          label="Reconciliations"
          value={34}
          icon={CheckCircle2}
          color="cyan"
          sparklineData={SPARK_RECON}
          sub="last 24h"
        />
        <StatCard
          label="Last Run"
          value={9}
          suffix="m ago"
          icon={Clock}
          color="purple"
          sparklineData={SPARK_LAST}
          decimals={0}
          sub="full sweep"
        />
      </section>

      {/* ── Reconciliation matrix table ── */}
      <section
        aria-label="Reconciliation matrix table"
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Source Matrix
          </h2>
          <span className="text-xs text-fg-muted">
            {DEMO_SOURCES.length} sources · 5-minute cadence
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Cross-source reconciliation matrix">
              <caption className="sr-only">
                Cross-source reconciliation matching matrix
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Source</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col" className="text-right">
                    Match Rate
                  </TableHead>
                  <TableHead scope="col" className="text-right">
                    Drift
                  </TableHead>
                  <TableHead scope="col">Match Bar</TableHead>
                  <TableHead scope="col">Trend</TableHead>
                  <TableHead scope="col">Last Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_SOURCES.map((s) => {
                  const pct = Math.round(s.matchRate);
                  return (
                    <TableRow key={s.code}>
                      <TableCell>
                        <span className="font-mono text-xs text-gold">
                          {s.code}
                        </span>
                        <p className="mt-0.5 max-w-[24rem] truncate text-xs text-fg-muted">
                          {s.description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            STATUS_TONE[s.status],
                          )}
                        >
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {s.matchRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-foreground">
                        {s.driftPct.toFixed(2)}%
                      </TableCell>
                      <TableCell>
                        <div
                          className="relative h-2 w-32 overflow-hidden rounded-full bg-ink-card"
                          role="progressbar"
                          aria-label={`Match rate for ${s.code}`}
                          aria-valuenow={pct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full",
                              s.status === "matched"
                                ? "bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300"
                                : s.status === "drift"
                                  ? "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300"
                                  : "bg-gradient-to-r from-red-600 via-red-400 to-red-300",
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Sparkline
                          data={s.trend}
                          color={
                            s.status === "matched"
                              ? "#34d399"
                              : s.status === "drift"
                                ? "#f59e0b"
                                : "#f87171"
                          }
                          showArea
                          height={28}
                          width={70}
                          ariaLabel={`Match-rate trend for ${s.code}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {s.lastRun}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <Layers className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
          Threshold 99.5% — sources below this rate are flagged for treasury
          committee review.
        </p>
      </section>
    </div>
  );
}
