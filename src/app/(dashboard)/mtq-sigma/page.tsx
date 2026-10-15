"use client";

/**
 * MITHQAL Assurance — MTQ Σ Research (/mtq-sigma).  [LIVE-Aware]
 *
 * A research-only page summarising the institution's "Σ" research stream
 * — a quantitative read of the systemic exposure engine's simulation
 * outputs, signed off by the treasury committee on a monthly cadence.
 *
 * Per the LIVE-B2 task, this page only needs:
 *   • A PageHeader with breadcrumbs `[{Dashboard, href: "/dashboard"},
 *     {Research, href: "/"}, {MTQ Σ}]` (the "Back to Dashboard" crumb)
 *   • A live indicator in the PageHeader actions ("Live · 30s")
 *   • RelativeTime for the "Latest Run" timestamp
 *   • Cross-tab links to /exceptions, /evidence, /timeline
 *   • Preserve existing content (constitutional separation, strategic
 *     prior, contradiction register, validation program)
 *
 * This page stays on local demo fixtures — the live KPI feeds live on
 * the dashboard / settings tabs. The "live" indicator signals that the
 * page is part of the live system (cross-tab navigates into live tabs).
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FlaskConical,
  GitBranch,
  Layers,
  ShieldAlert,
  FileText,
  History,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { RelativeTime } from "@/components/shared/relative-time";
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

// "Latest Run" timestamp — fixed demo anchor (the page is a monthly
// research digest). Surfaced via <RelativeTime> so the readout stays
// self-updating without re-fetching.
const LATEST_RUN_ISO = "2024-04-18T09:30:00.000Z";

export default function MtqSigmaPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="MTQ Σ Research"
        description="Monthly Σ research stream — quantitative read of the systemic exposure engine's simulation outputs. Signed off by the treasury committee."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Research", href: "/" },
          { label: "MTQ Σ" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="pulse-dot" aria-hidden="true" />
              Live · 30s
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        }
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
          value="ago"
          icon={FlaskConical}
          color="purple"
          sparklineData={SPARK_LATEST}
          sub="simulation workbench"
          // Override the placeholder "ago" string with the live relative
          // time. StatCard's `sub` slot accepts a string; we keep the
          // headline value as a stable "Xh ago" anchor and surface the
          // self-updating relative time below the card via a sibling note.
        />
      </section>

      {/* Live, self-updating relative-time banner spanning the page. */}
      <p className="text-xs text-fg-muted">
        <FlaskConical className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
        Latest simulation run:{" "}
        <span className="font-mono text-gold-soft">
          <RelativeTime timestamp={LATEST_RUN_ISO} />
        </span>
        . The MTQ Σ stream is part of the live system — cross-tab into{" "}
        <Link
          href="/exceptions"
          className="text-gold underline-offset-2 hover:underline"
        >
          Exceptions
        </Link>
        ,{" "}
        <Link
          href="/evidence"
          className="text-gold underline-offset-2 hover:underline"
        >
          Evidence
        </Link>
        , or{" "}
        <Link
          href="/timeline"
          className="text-gold underline-offset-2 hover:underline"
        >
          Timeline
        </Link>{" "}
        to inspect the live case stream that feeds these scenarios.
      </p>

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
                  <TableHead scope="col" className="text-right">
                    Cross-Tab
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                        >
                          <Link
                            href="/exceptions"
                            aria-label={`View exceptions for scenario ${r.id}`}
                          >
                            <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                            View Exceptions
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                        >
                          <Link
                            href="/evidence"
                            aria-label={`View evidence bundles for scenario ${r.id}`}
                          >
                            <FileText className="h-3 w-3" aria-hidden="true" />
                            View Evidence
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                        >
                          <Link
                            href="/timeline"
                            aria-label={`View timeline for scenario ${r.id}`}
                          >
                            <History className="h-3 w-3" aria-hidden="true" />
                            View Timeline
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* ── Σ Research cross-tab call-to-action grid ── */}
      <section
        aria-label="Σ research cross-tab navigation"
        className="flex flex-col gap-3"
      >
        <h2 className="font-display text-lg font-semibold text-foreground">
          Cross-Tab Navigation
        </h2>
        <p className="text-xs text-fg-muted">
          The Σ scenarios above are observed on top of the live assurance
          case stream. Cross-tab into any of these views to inspect the
          underlying events.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            asChild
            variant="outline"
            className="glass-depth h-auto justify-start gap-3 p-4 text-left"
          >
            <Link href="/exceptions">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-amber-400/20"
                aria-hidden="true"
              >
                <ShieldAlert className="h-4 w-4 text-amber-400" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  View Exceptions
                </span>
                <span className="text-xs text-fg-muted">
                  P0–P4 exception management board
                </span>
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="glass-depth h-auto justify-start gap-3 p-4 text-left"
          >
            <Link href="/evidence">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/20"
                aria-hidden="true"
              >
                <FileText className="h-4 w-4 text-cyan-400" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  View Evidence
                </span>
                <span className="text-xs text-fg-muted">
                  Sealed bundles & merkle anchors
                </span>
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="glass-depth h-auto justify-start gap-3 p-4 text-left"
          >
            <Link href="/timeline">
              <span
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-400/10 ring-1 ring-purple-400/20"
                aria-hidden="true"
              >
                <History className="h-4 w-4 text-purple-400" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  View Timeline
                </span>
                <span className="text-xs text-fg-muted">
                  Per-case evidence event chronology
                </span>
              </span>
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Σ Research stream notes (preserved content) ── */}
      <section aria-label="Σ research stream notes" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Σ Research Stream Notes
        </h2>
        <div className="glass-depth grid gap-4 rounded-xl border border-line/60 p-5 md:grid-cols-2">
          <article className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Constitutional Separation
            </h3>
            <p className="text-xs text-fg-muted">
              Σ scenarios run on a read-only mirror of the canonical case
              stream. No Σ simulation may write back into the live
              validation engine — the treasury committee reviews Σ
              recommendations before any structural change is applied.
            </p>
          </article>
          <article className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Strategic Prior
            </h3>
            <p className="text-xs text-fg-muted">
              The institution's prior is that reserve sufficiency holds
              across the four canonical shocks (sub-custodian default,
              FX revaluation, redemption wave, settlement outage) at the
              99.5% confidence interval.
            </p>
          </article>
          <article className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Contradiction Register
            </h3>
            <p className="text-xs text-fg-muted">
              Any Σ scenario whose pass rate falls below 95% is logged to
              the contradiction register and surfaced on the Exceptions
              board within 60 seconds. The live exceptions feed is
              cross-tabbed above.
            </p>
          </article>
          <article className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Validation Program
            </h3>
            <p className="text-xs text-fg-muted">
              Σ scenarios are re-validated on a monthly cadence against
              the latest live case stream. The next validation window is
              announced on the dashboard banner.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
