"use client";

/**
 * MITHQAL Assurance — Settings (/settings).  [LIVE]
 *
 * Configuration surface for the assurance engine — threshold tuning,
 * toggle gates, and on-call rotation. Every config item carries an
 * explicit aria-label so screen readers announce what each control
 * governs.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs + Live · 30s indicator + "Back to Dashboard"
 *   • 5 StatCards (Thresholds, Integrations, On-Call, Policies, Audit)
 *     wrapped in `.stagger-in`
 *   • Three sections of config items, each with a Switch + aria-label
 *   • NEW: "Last Stress Test Run" section at the bottom — pulls live KPI
 *     data from `useStressMetrics()` + `useStressResults()` (polls every
 *     30s) and surfaces cross-tab "Run Stress Test" + "View Results"
 *     buttons that deep-link into /dashboard
 *
 * A11y: every interactive control has a descriptive aria-label; each
 * config row is wrapped in a labelled <fieldset> for grouping.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BellRing,
  Boxes,
  CheckCircle2,
  Clock,
  GitBranch,
  Activity,
  Gauge,
  PlayCircle,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp } from "@/components/shared/count-up";
import { StatCardSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { useStressMetrics, useStressResults } from "@/hooks/use-demo-data";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo config state — local React state only; would write back to
 * /api/v1/settings in a later phase.
 * ────────────────────────────────────────────────────────────── */

const SPARK_THRESH = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_INT = [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6];
const SPARK_ONCALL = [1, 2, 1, 2, 2, 3, 2, 3, 3, 4, 3, 4];
const SPARK_POLICIES = [6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10];
const SPARK_AUDIT = [4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8];

const SPARK_CASES = [16, 17, 18, 18, 19, 20, 20, 20, 21, 20, 20, 20];
const SPARK_PASSED = [8, 9, 9, 10, 10, 10, 10, 10, 11, 10, 10, 10];
const SPARK_EXC = [10, 10, 9, 9, 10, 10, 10, 9, 9, 10, 10, 10];

type ToggleRow = {
  id: string;
  label: string;
  description: string;
  defaultOn: boolean;
  ariaLabel: string;
};

const THRESHOLD_TOGGLES: ToggleRow[] = [
  {
    id: "auto-pause-corridor",
    label: "Auto-pause corridor on drift > 0.5%",
    description:
      "When a sub-custody ledger drifts more than 0.5% from the canonical proof, the corridor is automatically paused pending treasury review.",
    defaultOn: true,
    ariaLabel:
      "Toggle automatic corridor pausing when drift exceeds 0.5% threshold",
  },
  {
    id: "escalate-critical",
    label: "Escalate critical exceptions to on-call",
    description:
      "Critical (P0) exceptions page the on-call treasury officer within 60 seconds of detection.",
    defaultOn: true,
    ariaLabel:
      "Toggle paging the on-call officer when a critical exception is raised",
  },
  {
    id: "failover-oracle",
    label: "Auto fail-over to backup oracle on stale feed",
    description:
      "If the primary XAU oracle is stale for more than 90 seconds, the engine switches to the backup oracle feed.",
    defaultOn: true,
    ariaLabel:
      "Toggle automatic fail-over to the backup oracle when the primary feed goes stale",
  },
];

const INTEGRATION_TOGGLES: ToggleRow[] = [
  {
    id: "swift-gpi",
    label: "SWIFT gpi settlement feed",
    description:
      "Live SWIFT gpi settlement feed — provides confirmation and tracker data for cross-border rails.",
    defaultOn: true,
    ariaLabel: "Toggle the SWIFT gpi settlement feed integration",
  },
  {
    id: "chainlink-oracle",
    label: "Chainlink oracle reference",
    description:
      "Chainlink reference oracle for XAU spot — primary source of price truth for the assurance engine.",
    defaultOn: true,
    ariaLabel: "Toggle the Chainlink oracle reference integration",
  },
  {
    id: "onchain-anchor",
    label: "On-chain merkle anchor",
    description:
      "Anchors every sealed evidence bundle to the institution's merkle-root contract on-chain for tamper-evidence.",
    defaultOn: true,
    ariaLabel:
      "Toggle the on-chain merkle-root anchor for sealed evidence bundles",
  },
];

const POLICY_TOGGLES: ToggleRow[] = [
  {
    id: "sanctions-screen",
    label: "Sanctions screening on every instruction",
    description:
      "Runs the sanctions screening pipeline against every mint, redeem, and rebalance instruction.",
    defaultOn: true,
    ariaLabel:
      "Toggle the sanctions screening pipeline on every instruction",
  },
  {
    id: "audit-every-action",
    label: "Audit-trail every on-call action",
    description:
      "Writes an audit-trail entry for every action taken by an on-call officer (pause, resume, rebalance, etc.).",
    defaultOn: true,
    ariaLabel:
      "Toggle the audit-trail requirement for every on-call officer action",
  },
  {
    id: "drift-republish",
    label: "Auto re-publish proof on drift remediation",
    description:
      "Automatically re-publishes the proof-of-reserves when a drift is remediated back below threshold.",
    defaultOn: false,
    ariaLabel:
      "Toggle automatic re-publication of the proof-of-reserves after a drift is remediated",
  },
];

function ConfigToggle({ row }: { row: ToggleRow }) {
  const [on, setOn] = React.useState(row.defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/40 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Label
          htmlFor={row.id}
          className="text-sm font-medium text-foreground"
        >
          {row.label}
        </Label>
        <p className="mt-1 text-xs text-fg-muted">{row.description}</p>
      </div>
      <Switch
        id={row.id}
        checked={on}
        onCheckedChange={setOn}
        aria-label={row.ariaLabel}
      />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof BellRing;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="glass-depth rounded-xl border border-line/60 p-5">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 ring-1 ring-gold/20"
          aria-hidden="true"
        >
          <Icon className="h-4 w-4 text-gold" />
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-xs text-fg-muted">{description}</p>
        </div>
      </div>
      <div className="flex flex-col divide-y divide-line/40">{children}</div>
    </fieldset>
  );
}

export default function SettingsPage() {
  /* Live stress-test metrics + results — both hooks poll every 30s. */
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    dataUpdatedAt: metricsUpdatedAt,
  } = useStressMetrics();
  const {
    data: results,
    isLoading: resultsLoading,
    error: resultsError,
    dataUpdatedAt: resultsUpdatedAt,
  } = useStressResults();

  /* Toast on successful refetch (skip the initial load). We toast once
   * per round — keyed off the metrics timestamp (both hooks refetch in
   * lockstep via the shared 30s refetchInterval). */
  const initialFetchRef = React.useRef(true);
  React.useEffect(() => {
    if (!metricsUpdatedAt) return;
    if (initialFetchRef.current) {
      initialFetchRef.current = false;
      return;
    }
    toast.success("Stress test run data refreshed");
  }, [metricsUpdatedAt]);

  const stressLoading = metricsLoading || resultsLoading;
  const stressError = metricsError ?? resultsError;
  const hasStressData = !!metrics && !!results;
  const lastRunIso = new Date(Math.max(metricsUpdatedAt, resultsUpdatedAt) || Date.now()).toISOString();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configuration surface for the assurance engine. Threshold tuning, integration toggles, and policy gates — every change is audit-logged."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Settings" },
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
        aria-label="Settings headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Thresholds"
          value={THRESHOLD_TOGGLES.length}
          icon={SlidersHorizontal}
          color="gold"
          sparklineData={SPARK_THRESH}
          sub="drift · SLA · oracle"
        />
        <StatCard
          label="Integrations"
          value={INTEGRATION_TOGGLES.length}
          icon={GitBranch}
          color="emerald"
          sparklineData={SPARK_INT}
          sub="SWIFT · Chainlink · on-chain"
        />
        <StatCard
          label="On-Call"
          value={4}
          icon={BellRing}
          color="amber"
          sparklineData={SPARK_ONCALL}
          sub="officers in rotation"
        />
        <StatCard
          label="Policies"
          value={POLICY_TOGGLES.length}
          icon={ShieldCheck}
          color="cyan"
          sparklineData={SPARK_POLICIES}
          sub="screening · audit · republish"
        />
        <StatCard
          label="Audit Entries"
          value={8}
          suffix="k"
          icon={Scale}
          color="purple"
          sparklineData={SPARK_AUDIT}
          decimals={0}
          sub="last 30 days"
        />
      </section>

      {/* ── Threshold tuning ── */}
      <section aria-label="Threshold tuning" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Threshold Tuning
        </h2>

        <div className="glass-depth rounded-xl border border-line/60 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label
                htmlFor="threshold-drift"
                className="text-sm font-medium text-foreground"
              >
                Drift threshold (%)
              </Label>
              <Input
                id="threshold-drift"
                type="number"
                step="0.05"
                defaultValue="0.5"
                aria-label="Drift threshold percentage at which corridor is paused"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Above this % the corridor auto-pauses.
              </p>
            </div>
            <div>
              <Label
                htmlFor="threshold-sets"
                className="text-sm font-medium text-foreground"
              >
                Settlement SLA (minutes)
              </Label>
              <Input
                id="threshold-sets"
                type="number"
                step="1"
                defaultValue="240"
                aria-label="Settlement SLA in minutes beyond which an exception is raised"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Time-to-settle SLA in minutes.
              </p>
            </div>
            <div>
              <Label
                htmlFor="threshold-oracle"
                className="text-sm font-medium text-foreground"
              >
                Oracle staleness (seconds)
              </Label>
              <Input
                id="threshold-oracle"
                type="number"
                step="1"
                defaultValue="90"
                aria-label="Oracle staleness in seconds beyond which the backup feed is engaged"
                className="mt-1.5 font-mono"
              />
              <p className="mt-1 text-xs text-fg-muted">
                Stale window before backup oracle engages.
              </p>
            </div>
          </div>
        </div>

        <Section
          icon={Boxes}
          title="Drift & Auto-Pause Gates"
          description="When the assurance engine detects drift or staleness, these gates decide what happens automatically."
        >
          {THRESHOLD_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      {/* ── Integrations ── */}
      <section aria-label="Integrations" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Integrations
        </h2>
        <Section
          icon={GitBranch}
          title="Source-of-Truth Integrations"
          description="External feeds the assurance engine depends on. Disabling an integration here disables the corresponding reconciliation checks."
        >
          {INTEGRATION_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      {/* ── Policies ── */}
      <section aria-label="Policy gates" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Policy Gates
        </h2>
        <Section
          icon={ShieldCheck}
          title="Screening & Audit Policies"
          description="Policy gates that govern how the assurance engine treats instructions and officer actions."
        >
          {POLICY_TOGGLES.map((row) => (
            <ConfigToggle key={row.id} row={row} />
          ))}
        </Section>
      </section>

      {/* ── Last Stress Test Run (LIVE) ── */}
      <section
        aria-label="Last stress test run"
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Last Stress Test Run
            </h2>
            <p className="text-xs text-fg-muted">
              Live KPI snapshot from{" "}
              <code className="rounded bg-ink-card px-1 py-0.5 font-mono text-[10px] text-gold">
                /api/v1/metrics
              </code>{" "}
              +{" "}
              <code className="rounded bg-ink-card px-1 py-0.5 font-mono text-[10px] text-gold">
                /api/v1/results
              </code>{" "}
              · refreshes every 30s
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fg-muted">
              Last run:{" "}
              <span className="font-mono text-gold-soft">
                <RelativeTime timestamp={lastRunIso} />
              </span>
            </span>
            <Button asChild variant="default" size="sm">
              <Link href="/dashboard" aria-label="Run a fresh stress test on the dashboard">
                <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Run Stress Test
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard" aria-label="View full stress test results on the dashboard">
                <Gauge className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                View Results
              </Link>
            </Button>
          </div>
        </div>

        {/* Live KPI StatCard grid — or skeletons while loading. */}
        <div className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {stressLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : stressError || !hasStressData ? (
            // EmptyState fills the grid cell; spanning 4 cols so the
            // empty state reads as a single banner, not 8 small holes.
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <EmptyState
                title="Stress test data unavailable"
                description="The live metrics / results stream is unreachable. The next 30s poll will retry."
                icon={Activity}
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard">Open Dashboard</Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <StatCard
                label="Total Cases"
                value={metrics!.totalCases}
                icon={Boxes}
                color="gold"
                sparklineData={SPARK_CASES}
                sub="processed this run"
              />
              <StatCard
                label="Cases Passed"
                value={results!.casesPassed}
                icon={CheckCircle2}
                color="emerald"
                sparklineData={SPARK_PASSED}
                sub={`of ${results!.casesProcessed} processed`}
              />
              <StatCard
                label="Exceptions Opened"
                value={results!.exceptionsOpened}
                icon={BellRing}
                color="amber"
                sparklineData={SPARK_EXC}
                sub={`${results!.exceptionsResolved} resolved`}
              />
              <StatCard
                label="Open Exceptions"
                value={metrics!.openExceptions}
                icon={BellRing}
                color="red"
                sparklineData={SPARK_EXC}
                sub="currently in-flight"
              />
              <StatCard
                label="Total Value"
                value={metrics!.totalValue}
                icon={Scale}
                color="cyan"
                sub="aggregate case value"
              />
              <StatCard
                label="Exception Rate"
                value={metrics!.exceptionRate}
                icon={SlidersHorizontal}
                color="amber"
                sub="cases-with-exceptions / total"
              />
              <StatCard
                label="Avg Resolution"
                value={metrics!.avgResolutionTime}
                icon={Clock}
                color="purple"
                sub={`P95 ${metrics!.p95ResolutionTime}`}
              />
              <StatCard
                label="Scenarios Covered"
                value={metrics!.scenariosCovered}
                icon={GitBranch}
                color="gold"
                sparklineData={SPARK_POLICIES}
                sub={`across ${metrics!.institutions} institutions`}
              />
            </>
          )}
        </div>

        {/* Detailed stress-test summary card. */}
        {stressLoading ? (
          <div className="glass-depth rounded-xl border border-line/60 p-5">
            <StatCardSkeleton />
          </div>
        ) : stressError || !hasStressData ? null : (
          <div className="glass-depth rounded-xl border border-line/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {results!.testName}
                </h3>
                <p className="mt-1 text-xs text-fg-muted">
                  Duration: {results!.duration} · Result:{" "}
                  <span className="font-mono text-emerald-300">
                    {results!.result}
                  </span>
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-400/30 bg-emerald-400/10 font-mono text-[10px] uppercase tracking-wider text-emerald-300"
              >
                {results!.result.includes("PASS") ? "PASS" : "REVIEW"}
              </Badge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3 lg:grid-cols-4">
              <div>
                <dt className="text-fg-muted">Cases Processed</dt>
                <dd className="font-mono text-foreground">
                  <CountUp value={results!.casesProcessed} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Cases Passed</dt>
                <dd className="font-mono text-emerald-300">
                  <CountUp value={results!.casesPassed} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Cases w/ Exceptions</dt>
                <dd className="font-mono text-amber-300">
                  <CountUp value={results!.casesWithExceptions} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Exceptions Opened</dt>
                <dd className="font-mono text-foreground">
                  <CountUp value={results!.exceptionsOpened} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Exceptions Resolved</dt>
                <dd className="font-mono text-emerald-300">
                  <CountUp value={results!.exceptionsResolved} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Safe Halts Triggered</dt>
                <dd className="font-mono text-red-300">
                  <CountUp value={results!.safeHaltsTriggered} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Replays Executed</dt>
                <dd className="font-mono text-purple-300">
                  <CountUp value={results!.replaysExecuted} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Reconciliation Cases</dt>
                <dd className="font-mono text-cyan-300">
                  <CountUp value={results!.reconciliationCases} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Evidence Events</dt>
                <dd className="font-mono text-foreground">
                  <CountUp value={results!.evidenceEventsGenerated} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Idempotency Keys</dt>
                <dd className="font-mono text-foreground">
                  <CountUp value={results!.idempotencyKeysChecked} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Duplicate Prevention</dt>
                <dd className="font-mono text-emerald-300">
                  {results!.duplicatePrevention}
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">Corridors · Scenarios</dt>
                <dd className="font-mono text-foreground">
                  {metrics!.corridors} · {metrics!.scenariosCovered}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line/40 pt-4">
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard" aria-label="Run a fresh stress test from the dashboard">
                  <PlayCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Run Stress Test
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard" aria-label="View full results on the dashboard">
                  <Gauge className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  View Results
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link
                  href="/timeline"
                  aria-label="View the live timeline of stress test events"
                >
                  <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  View Timeline
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link
                  href="/replay"
                  aria-label="View the replay log for stress test scenarios"
                >
                  <Activity className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  View Replay Log
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>

      <p
        className={cn(
          "rounded-lg border border-gold/20 bg-gold/5 p-3 text-xs text-gold-soft",
        )}
      >
        <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
        Every change you make here is audit-logged and surfaces on the
        Timeline page within seconds. Changes to integration toggles are
        treasury-committee reviewed before they take effect.
      </p>
    </div>
  );
}
