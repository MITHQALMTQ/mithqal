"use client";

/**
 * MITHQAL Assurance — Corridor Volume & Value Analytics (/corridor).
 *
 * Aggregates throughput and value across the institution's mint/redeem
 * corridors. Each corridor row carries a small <Sparkline/> next to the
 * volume bar so traders can read recent volume direction at a glance.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Total Volume, Total Value, Active Corridors, Peak TPS,
 *     Avg Latency) wrapped in `.stagger-in`
 *   • Corridor table with volume bar + Sparkline per row, $Value uses CountUp
 *
 * A11y: sr-only caption, scope="col" on every th, aria-label on every
 * volume bar.
 */

import * as React from "react";
import { Activity, DollarSign, Gauge, Route, TrendingUp } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Sparkline } from "@/components/shared/sparkline";
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
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo data — 8 corridors across the institution.
 * ────────────────────────────────────────────────────────────── */

type CorridorRow = {
  code: string;
  description: string;
  volume: number;
  value: number;
  peakTps: number;
  avgLatencyMs: number;
  status: "active" | "degraded" | "paused";
  /** 12-point volume trend hint for the per-row Sparkline. */
  trend: number[];
  /** Percentage of corridor capacity currently in use. */
  capacityUsedPct: number;
};

const DEMO_CORRIDORS: CorridorRow[] = [
  {
    code: "USD-XAU",
    description: "US Dollar ↔ Gold — primary institutional rail",
    volume: 1_840_000,
    value: 48_850_000,
    peakTps: 412,
    avgLatencyMs: 380,
    status: "active",
    trend: [120, 134, 128, 142, 150, 146, 158, 162, 155, 168, 174, 182],
    capacityUsedPct: 72,
  },
  {
    code: "EUR-XAU",
    description: "Euro ↔ Gold — Frankfurt settlement",
    volume: 1_120_000,
    value: 31_200_000,
    peakTps: 308,
    avgLatencyMs: 410,
    status: "active",
    trend: [88, 92, 96, 102, 108, 104, 110, 118, 112, 120, 116, 124],
    capacityUsedPct: 61,
  },
  {
    code: "GBP-XAU",
    description: "Sterling ↔ Gold — London sub-custody",
    volume: 680_000,
    value: 19_400_000,
    peakTps: 214,
    avgLatencyMs: 365,
    status: "active",
    trend: [60, 58, 62, 66, 70, 68, 72, 74, 70, 76, 78, 82],
    capacityUsedPct: 48,
  },
  {
    code: "CHF-XAU",
    description: "Swiss Franc ↔ Gold — Zurich vault",
    volume: 540_000,
    value: 15_800_000,
    peakTps: 198,
    avgLatencyMs: 390,
    status: "degraded",
    trend: [54, 56, 52, 50, 48, 46, 44, 42, 44, 46, 48, 50],
    capacityUsedPct: 39,
  },
  {
    code: "AED-USD",
    description: "Dirham ↔ Dollar — Gulf liquidity bridge",
    volume: 410_000,
    value: 9_600_000,
    peakTps: 156,
    avgLatencyMs: 420,
    status: "active",
    trend: [30, 32, 34, 36, 38, 40, 42, 41, 43, 44, 42, 45],
    capacityUsedPct: 33,
  },
  {
    code: "QAR-USD",
    description: "Qatar Riyal ↔ Dollar — QNB sub-custody",
    volume: 280_000,
    value: 6_200_000,
    peakTps: 98,
    avgLatencyMs: 460,
    status: "active",
    trend: [22, 24, 26, 25, 28, 30, 29, 31, 32, 30, 28, 30],
    capacityUsedPct: 26,
  },
  {
    code: "HKD-USD",
    description: "Hong Kong Dollar ↔ Dollar — SCB HK",
    volume: 240_000,
    value: 5_400_000,
    peakTps: 84,
    avgLatencyMs: 480,
    status: "active",
    trend: [20, 18, 22, 24, 26, 28, 26, 24, 22, 24, 26, 25],
    capacityUsedPct: 22,
  },
  {
    code: "SGD-USD",
    description: "Singapore Dollar ↔ Dollar — DBS",
    volume: 180_000,
    value: 3_900_000,
    peakTps: 62,
    avgLatencyMs: 430,
    status: "paused",
    trend: [16, 14, 12, 10, 8, 6, 4, 4, 4, 4, 4, 4],
    capacityUsedPct: 4,
  },
];

const STATUS_TONE: Record<CorridorRow["status"], string> = {
  active: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  degraded: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  paused: "border-red-400/30 bg-red-400/10 text-red-300",
};

/* Sparkline trends for the headline StatCards. */
const SPARK_VOL = [320, 312, 340, 335, 360, 380, 372, 400, 412, 425, 430, 460];
const SPARK_VAL = [38, 40, 42, 44, 46, 45, 48, 47, 50, 52, 54, 55];
const SPARK_ACT = [6, 6, 7, 7, 7, 7, 7, 7, 8, 7, 7, 7];
const SPARK_TPS = [380, 392, 410, 405, 412, 415, 408, 414, 412, 418, 415, 412];
const SPARK_LAT = [445, 442, 438, 432, 430, 425, 422, 418, 415, 412, 410, 408];

const TOTAL_VOLUME = DEMO_CORRIDORS.reduce((s, r) => s + r.volume, 0);
const TOTAL_VALUE = DEMO_CORRIDORS.reduce((s, r) => s + r.value, 0);
const ACTIVE = DEMO_CORRIDORS.filter((r) => r.status === "active").length;
const PEAK_TPS = Math.max(...DEMO_CORRIDORS.map((r) => r.peakTps));
const AVG_LAT = Math.round(
  DEMO_CORRIDORS.reduce((s, r) => s + r.avgLatencyMs, 0) / DEMO_CORRIDORS.length,
);

function SparklineIcon({ data }: { data: number[] }) {
  return (
    <Sparkline
      data={data}
      color="#f59e0b"
      showArea
      height={28}
      width={70}
      ariaLabel="Corridor volume trend"
    />
  );
}

export default function CorridorPage() {
  const maxVol = Math.max(...DEMO_CORRIDORS.map((r) => r.volume));
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Corridor Volume & Value"
        description="Throughput and value across the institution's mint/redeem corridors. The Sparkline beside each bar shows recent volume direction."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Corridor" },
        ]}
      />

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Corridor headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Total Volume"
          value={TOTAL_VOLUME}
          icon={Route}
          color="gold"
          sparklineData={SPARK_VOL}
          decimals={0}
          sub="across all corridors"
        />
        <StatCard
          label="Total Value"
          value={TOTAL_VALUE}
          prefix="$"
          icon={DollarSign}
          color="emerald"
          sparklineData={SPARK_VAL}
          decimals={0}
          sub="rolling 24h"
        />
        <StatCard
          label="Active Corridors"
          value={ACTIVE}
          icon={TrendingUp}
          color="cyan"
          sparklineData={SPARK_ACT}
          sub={`of ${DEMO_CORRIDORS.length} total`}
        />
        <StatCard
          label="Peak TPS"
          value={PEAK_TPS}
          icon={Activity}
          color="purple"
          sparklineData={SPARK_TPS}
          decimals={0}
          sub="highest single-corridor"
        />
        <StatCard
          label="Avg Latency"
          value={AVG_LAT}
          suffix="ms"
          icon={Gauge}
          color="amber"
          sparklineData={SPARK_LAT}
          decimals={0}
          sub="mean settlement"
        />
      </section>

      {/* ── Corridor table ── */}
      <section aria-label="Corridor table" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Corridors
          </h2>
          <span className="text-xs text-fg-muted">
            {DEMO_CORRIDORS.length} corridors · 24h window
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_CORRIDORS.map((c) => {
                  const pct = Math.round((c.volume / maxVol) * 100);
                  return (
                    <TableRow key={c.code}>
                      <TableCell>
                        <span className="font-mono text-xs text-gold">
                          {c.code}
                        </span>
                        <p className="mt-0.5 max-w-[20rem] truncate text-xs text-fg-muted">
                          {c.description}
                        </p>
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
                          aria-label="Corridor volume bar"
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
                        <SparklineIcon data={c.trend} />
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
