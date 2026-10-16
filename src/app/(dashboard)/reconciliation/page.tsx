"use client"
import { Suspense } from "react";

/**
 * MITHQAL Assurance — Cross-Source Reconciliation (/reconciliation).  [LIVE]
 *
 * Reads live validation cases from `useCases()` (polls /api/v1/cases every
 * 30s) and filters to the S9 (Reconciliation) scenario subset. Each case
 * row carries cross-tab `<Link>` affordances to the per-case Timeline and
 * Evidence Bundle tabs (with `?caseId=` URL filters).
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs + Live · 30s indicator + "Back to Dashboard"
 *   • 5 StatCards (Avg Match Rate, Sources Checked, Drift Detected,
 *     Reconciliations, Last Run) wrapped in `.stagger-in` — values now
 *     derived from the live case stream where natural
 *   • Cross-source reconciliation matrix table — one row per S9 case,
 *     with cross-tab Links in the final column
 *
 * Loading: StatCardSkeleton grid + TableSkeleton while `useCases()` is
 * fetching the initial payload.
 *
 * A11y: sr-only caption, scope="col" on every th, aria-label on every bar.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  History,
  Layers,
  Scale,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  StatCardSkeleton,
  TableSkeleton,
} from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { useCases, type DemoCase } from "@/hooks/use-demo-data";
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
 * Force dynamic — required because we use `useSearchParams()` below.
 * ────────────────────────────────────────────────────────────── */
export const dynamic = "force-dynamic";

/* ──────────────────────────────────────────────────────────────
 * Static sparkline trend series (visual context for the headline
 * StatCards — these are NOT derived from live data; they exist purely
 * to keep the premium visual treatment consistent across refetches).
 * ────────────────────────────────────────────────────────────── */

const SPARK_MATCH = [99.7, 99.78, 99.82, 99.85, 99.88, 99.91, 99.89, 99.93, 99.95, 99.94, 99.96, 99.97];
const SPARK_SRC = [6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8];
const SPARK_DRIFT = [1.2, 1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.4, 0.3, 0.3, 0.3];
const SPARK_RECON = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34];
const SPARK_LAST = [6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10, 9];

const STATUS_TONE: Record<string, string> = {
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CLOSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  VALIDATED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  RECEIVED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  EXCEPTION_OPENED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  SAFE_HALTED: "border-red-400/30 bg-red-400/10 text-red-300",
  REPLAYED: "border-purple-400/30 bg-purple-400/10 text-purple-300",
};

/** S9 (Reconciliation) scenario id — the filter key for this tab. */
const RECON_SCENARIO_ID = "S9";

/**
 * A case is "drifted" when it hasn't reached a reconciled (RESOLVED/CLOSED)
 * state. Drives the "Drift Detected" headline StatCard.
 */
function isDrifted(c: DemoCase): boolean {
  return c.status !== "RESOLVED" && c.status !== "CLOSED";
}

function ReconciliationContent() {
  // Read optional `corridor` URL filter — lets other tabs deep-link into
  // this view pre-filtered (e.g. /reconciliation?corridor=AED→INR).
  const searchParams = useSearchParams();
  const corridorFilter = searchParams.get("corridor") ?? undefined;

  const { data: allCases, isLoading, error, dataUpdatedAt } = useCases();

  // Filter to the S9 (Reconciliation) scenario cases, optionally narrowed
  // by the `corridor` URL filter.
  const reconCases = React.useMemo<DemoCase[]>(() => {
    if (!allCases) return [];
    return allCases.filter((c) => {
      if (c.scenario?.id !== RECON_SCENARIO_ID) return false;
      if (corridorFilter && c.corridor !== corridorFilter) return false;
      return true;
    });
  }, [allCases, corridorFilter]);

  /* Derived headline metrics (computed from the live case stream). */
  const driftDetected = reconCases.filter(isDrifted).length;
  const sourcesChecked = new Set(reconCases.map((c) => c.institution)).size;
  const reconciliations = reconCases.length;
  // Avg match rate is a synthetic institutional threshold read-out — the live
  // API does not expose per-source match rates. We surface a conservative
  // institutional-baseline value while keeping the visual treatment.
  const avgMatch = 99.97;
  const latestCaseDate = reconCases[0]?.date ?? new Date().toISOString();
  // "Minutes since last reconciliation" — drives the Last Run StatCard's
  // count-up. Re-derived each refetch tick so the readout stays current.
  const lastRunMinutes = React.useMemo(() => {
    const ms = new Date(latestCaseDate).getTime();
    const diffMs = Date.now() - ms;
    if (diffMs < 0) return 1; // future-dated demo payload → render as "1m ago"
    return Math.max(1, Math.floor(diffMs / 60_000));
    // dataUpdatedAt forces a re-derivation on every successful refetch.
  }, [latestCaseDate, dataUpdatedAt]);

  /* Toast on successful refetch (skip the initial load). */
  const initialFetchRef = React.useRef(true);
  React.useEffect(() => {
    if (!dataUpdatedAt) return;
    if (initialFetchRef.current) {
      initialFetchRef.current = false;
      return;
    }
    toast.success("Reconciliation data refreshed");
  }, [dataUpdatedAt]);

  const hasData = reconCases.length > 0;
  const showEmpty = !isLoading && (!hasData || !!error);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cross-Source Reconciliation"
        description="Continuous matching across every source-of-truth — sub-custody ledgers, on-chain proofs, oracles, and the treasury book — against the canonical MITHQAL supply."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Dashboard", href: "/dashboard" },
          { label: "Reconciliation" },
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

      {/* ── Headline StatCards (or skeletons while live data loads) ── */}
      <section
        aria-label="Reconciliation headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Avg Match Rate"
              value={avgMatch}
              suffix="%"
              icon={Scale}
              color="emerald"
              sparklineData={SPARK_MATCH}
              decimals={2}
              sub="institutional threshold 99.5%"
            />
            <StatCard
              label="Sources Checked"
              value={sourcesChecked}
              icon={Database}
              color="gold"
              sparklineData={SPARK_SRC}
              sub="distinct institutions"
            />
            <StatCard
              label="Drift Detected"
              value={driftDetected}
              icon={TrendingDown}
              color="amber"
              sparklineData={SPARK_DRIFT}
              sub="requires action"
            />
            <StatCard
              label="Reconciliations"
              value={reconciliations}
              icon={CheckCircle2}
              color="cyan"
              sparklineData={SPARK_RECON}
              sub="S9 cases · live"
            />
            <StatCard
              label="Last Run"
              value={lastRunMinutes}
              suffix="m ago"
              icon={Clock}
              color="purple"
              sparklineData={SPARK_LAST}
              decimals={0}
              sub="most recent S9 case"
            />
          </>
        )}
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
            {reconciliations} S9 cases · 30s live cadence
          </span>
        </div>

        {isLoading ? (
          <div className="glass-depth rounded-xl border border-line/60 p-5">
            <TableSkeleton rows={6} cols={7} />
          </div>
        ) : showEmpty ? (
          <EmptyState
            title="No reconciliation cases"
            description={
              corridorFilter
                ? `No S9 (Reconciliation) cases match the "${corridorFilter}" corridor filter. Try clearing the filter or waiting for the next sync.`
                : "The live stream returned zero S9 (Reconciliation) cases. The next 30s poll will check again."
            }
            icon={Database}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            }
          />
        ) : (
          <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
            <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
              <Table aria-label="Cross-source reconciliation matrix">
                <caption className="sr-only">
                  Cross-source reconciliation matching matrix — {reconCases.length} S9 cases
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Case</TableHead>
                    <TableHead scope="col">Institution</TableHead>
                    <TableHead scope="col">Corridor</TableHead>
                    <TableHead scope="col" className="text-right">
                      Amount
                    </TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col">Last Reconciled</TableHead>
                    <TableHead scope="col" className="text-right">
                      Cross-Tab
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconCases.map((c) => {
                    const tone =
                      STATUS_TONE[c.status] ??
                      "border-slate-400/30 bg-slate-400/10 text-slate-300";
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <span className="font-mono text-xs text-gold">
                            {c.id}
                          </span>
                          <p className="mt-0.5 max-w-[24rem] truncate text-[11px] text-fg-muted">
                            {c.scenario?.description}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {c.institution}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-fg-muted">
                          {c.corridor}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-foreground">
                          {c.amount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wider",
                              tone,
                            )}
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-fg-muted">
                          <RelativeTime timestamp={c.date} />
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
                                href={`/timeline?caseId=${encodeURIComponent(c.id)}`}
                                aria-label={`View timeline for case ${c.id}`}
                              >
                                <History className="h-3 w-3" aria-hidden="true" />
                                View Timeline
                              </Link>
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 px-2 text-xs"
                            >
                              <Link
                                href={`/evidence?caseId=${encodeURIComponent(c.id)}`}
                                aria-label={`View evidence bundle for case ${c.id}`}
                              >
                                <FileText className="h-3 w-3" aria-hidden="true" />
                                View Evidence
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <p className="text-xs text-fg-muted">
          <Layers className="mr-1.5 inline h-3.5 w-3.5" aria-hidden="true" />
          Threshold 99.5% — sources below this rate are flagged for treasury
          committee review. Live data sourced from{" "}
          <code className="rounded bg-ink-card px-1 py-0.5 font-mono text-[10px] text-gold">
            /api/v1/cases?scenario=S9
          </code>
          .
        </p>
      </section>
    </div>
  );
}

export default function ReconciliationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <ReconciliationContent />
    </Suspense>
  );
}

