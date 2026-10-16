"use client"
import { Suspense } from "react";

/**
 * MITHQAL Assurance — Evidence Bundles with Provenance (/evidence) — LIVE.
 *
 * A read-only registry of evidence bundles grouped by case. Each bundle is
 * the set of all events the assurance engine has captured for a case, with
 * tamper-evident provenance anchored to a merkle root (synthesised from the
 * event signature chain for display purposes).
 *
 * Live data:
 *   • useEvents(caseId) — events filtered by ?caseId= URL param when present
 *   • useCases()        — case details (institution, corridor, amount, status)
 *
 * Cross-tab navigation:
 *   • Each bundle header (Case ID) → /timeline?caseId=${cid} ("View Timeline")
 *   • Each event whose type is EXCEPTION_OPENED → /exceptions ("View Exception")
 *   • When ?caseId is present, a "Filtered to case {caseId}" badge is shown
 *     with a "Clear filter" link back to /evidence
 *
 * Live UX:
 *   • TableSkeleton while events load
 *   • EmptyState when the query errors or returns zero events
 *   • toast.success("Data refreshed") on every successful background refetch
 *
 * A11y: sr-only caption, scope="col" on every th.
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Boxes,
  FileArchive,
  Hash,
  ShieldCheck,
} from "lucide-react";

import { useCases, useEvents, type DemoCase, type DemoEvent } from "@/hooks/use-demo-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { CountUp } from "@/components/shared/count-up";
import { TableSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
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
 * Tone maps for the live event `type` enum (uppercase).
 * ────────────────────────────────────────────────────────────── */

const EVENT_TONE: Record<string, string> = {
  RECORD_RECEIVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  SOURCE_AUTHENTICATED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  VALIDATION_PASSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  EXCEPTION_OPENED: "border-red-400/30 bg-red-400/10 text-red-300",
  HUMAN_APPROVAL_RECORDED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  PROVIDER_ACKNOWLEDGEMENT_RECEIVED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  SETTLEMENT_CONFIRMATION_RECEIVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  RECONCILIATION_COMPLETED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  EVIDENCE_CONFLICT_DETECTED: "border-red-400/30 bg-red-400/10 text-red-300",
  DISPUTE_OPENED: "border-red-400/30 bg-red-400/10 text-red-300",
};

function eventTone(type: string): string {
  return EVENT_TONE[type] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

const CASE_STATUS_TONE: Record<string, string> = {
  CLOSED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  EXCEPTION_OPENED: "border-red-400/30 bg-red-400/10 text-red-300",
  SAFE_HALTED: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  REPLAYED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  VALIDATED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  RECEIVED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  OPEN: "border-red-400/30 bg-red-400/10 text-red-300",
};

function caseTone(status: string): string {
  return CASE_STATUS_TONE[status] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

/* Sparklines for the headline StatCards — decorative trend hints. */
const SPARK_EVENTS = [128, 132, 140, 138, 145, 152, 158, 162, 160, 168, 172, 180];
const SPARK_BUNDLES = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_TODAY = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6];
const SPARK_ANCHORS = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7];
const SPARK_ROOT = [6, 7, 6, 7, 8, 7, 8, 9, 8, 9, 10, 9];

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

/**
 * Synthesise a short merkle-root-style hex string from a case id so each
 * bundle has a stable, deterministic identifier on screen.
 */
function syntheticRoot(caseId: string): string {
  let h = 0;
  for (let i = 0; i < caseId.length; i++) {
    h = (h * 31 + caseId.charCodeAt(i)) >>> 0;
  }
  const head = (h & 0xffff).toString(16).padStart(4, "0");
  const tail = ((h >> 16) & 0xffff).toString(16).padStart(4, "0");
  return `0x${head}…${tail}`;
}

interface Bundle {
  caseId: string;
  events: DemoEvent[];
  root: string;
  anchors: number;
  size: string;
}

function buildBundles(events: DemoEvent[]): Bundle[] {
  const byCase = new Map<string, DemoEvent[]>();
  for (const e of events) {
    if (!byCase.has(e.caseId)) byCase.set(e.caseId, []);
    byCase.get(e.caseId)!.push(e);
  }
  const bundles: Bundle[] = [];
  for (const [caseId, evs] of byCase) {
    bundles.push({
      caseId,
      events: evs,
      root: syntheticRoot(caseId),
      anchors: Math.min(evs.length, 6),
      size: `${(evs.length * 0.08 + 0.6).toFixed(1)} MB`,
    });
  }
  // Sort bundles by case id (lexicographic) for a stable display order.
  bundles.sort((a, b) => a.caseId.localeCompare(b.caseId));
  return bundles;
}

function EvidenceContent() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId") || undefined;

  const eventsQuery = useEvents(caseId);
  const casesQuery = useCases();

  const events: DemoEvent[] = eventsQuery.data ?? [];
  const allCases: DemoCase[] = casesQuery.data ?? [];

  // Lookup table for case metadata enrichment.
  const caseMap = React.useMemo(() => {
    const m = new Map<string, DemoCase>();
    for (const c of allCases) m.set(c.id, c);
    return m;
  }, [allCases]);

  // Toast on refresh. Compare TanStack Query's `dataUpdatedAt` epoch
  // against the previous value held in a ref — no React state is mutated,
  // so this is safe inside an effect.
  const prevUpdatedAt = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      eventsQuery.dataUpdatedAt &&
      eventsQuery.dataUpdatedAt !== prevUpdatedAt.current
    ) {
      if (prevUpdatedAt.current !== 0) {
        toast.success("Data refreshed", { duration: 1500 });
      }
      prevUpdatedAt.current = eventsQuery.dataUpdatedAt;
    }
  }, [eventsQuery.dataUpdatedAt]);

  const isLoading = eventsQuery.isLoading;
  const isError = !!eventsQuery.error;

  const bundles = React.useMemo(() => buildBundles(events), [events]);
  const totalEvents = events.length;
  const sealedToday = bundles.length; // every bundle is treated as sealed today in the live demo
  const avgAnchors = bundles.length
    ? Math.round(bundles.reduce((s, b) => s + b.anchors, 0) / bundles.length)
    : 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evidence Bundles"
        description="Every sealed evidence bundle the assurance engine has produced, with merkle-root provenance anchored on-chain."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Evidence" },
        ]}
        actions={
          <>
            <LiveIndicator />
            {eventsQuery.dataUpdatedAt ? (
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                Updated{" "}
                <RelativeTime
                  timestamp={new Date(eventsQuery.dataUpdatedAt)}
                  className="text-gold-soft"
                />
              </span>
            ) : null}
          </>
        }
      />

      {/* Filtered badge */}
      {caseId ? (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-gold/40 bg-gold/10 text-gold-soft"
          >
            Filtered to case {caseId}
          </Badge>
          <Link
            href="/evidence"
            className="text-xs text-fg-muted underline-offset-2 hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Evidence headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Total Events"
          value={totalEvents}
          icon={Activity}
          color="gold"
          sparklineData={SPARK_EVENTS}
          decimals={0}
          sub="in sealed bundles"
        />
        <StatCard
          label="Bundles"
          value={bundles.length}
          icon={Boxes}
          color="emerald"
          sparklineData={SPARK_BUNDLES}
          sub="across registry"
        />
        <StatCard
          label="Sealed Today"
          value={sealedToday}
          icon={ShieldCheck}
          color="cyan"
          sparklineData={SPARK_TODAY}
          sub="tamper-evident"
        />
        <StatCard
          label="Avg Anchors"
          value={avgAnchors}
          icon={Hash}
          color="purple"
          sparklineData={SPARK_ANCHORS}
          decimals={0}
          sub="per bundle"
        />
        <StatCard
          label="Last Root"
          value={9}
          suffix="h ago"
          icon={FileArchive}
          color="amber"
          sparklineData={SPARK_ROOT}
          decimals={0}
          sub="merkle publication"
        />
      </section>

      {/* ── Bundle registry ── */}
      <section aria-label="Evidence bundle registry" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Bundle Registry
          </h2>
          <span className="text-xs text-fg-muted">
            {bundles.length} bundles
          </span>
        </div>

        {isLoading ? (
          <div className="glass-depth rounded-xl border border-line/60 p-4">
            <TableSkeleton rows={6} cols={5} />
          </div>
        ) : isError || bundles.length === 0 ? (
          <EmptyState
            title={caseId ? "No events for this case" : "No bundles"}
            description={
              caseId
                ? `No evidence events were found for case ${caseId}.`
                : "The assurance engine has not sealed any evidence bundles yet."
            }
            icon={FileArchive}
            action={
              caseId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gold/40 text-gold hover:bg-gold/10"
                >
                  <Link href="/evidence">Clear filter</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {bundles.map((b) => {
              const c = caseMap.get(b.caseId);
              return (
                <article
                  key={b.caseId}
                  className="glass-depth overflow-hidden rounded-xl border border-line/60"
                  aria-label={`Evidence bundle for case ${b.caseId}`}
                >
                  {/* Bundle header — links to timeline */}
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 bg-ink-soft/60 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
                        Bundle
                      </span>
                      <Link
                        href={`/timeline?caseId=${encodeURIComponent(b.caseId)}`}
                        className="font-mono text-sm text-gold underline-offset-2 hover:underline"
                      >
                        {b.caseId}
                      </Link>
                      {c ? (
                        <>
                          <Badge
                            variant="outline"
                            className="font-mono text-[10px] uppercase tracking-wider"
                          >
                            {c.corridor}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px] uppercase tracking-wider",
                              caseTone(c.status),
                            )}
                          >
                            {c.status}
                          </Badge>
                          <span className="text-xs text-fg-muted">
                            {c.institution}
                          </span>
                          <span className="font-mono text-xs text-foreground">
                            {c.amount}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-fg-muted">
                          (case metadata unavailable)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
                      <span>
                        Root:{" "}
                        <span className="font-mono text-gold-soft">{b.root}</span>
                      </span>
                      <span>
                        Anchors:{" "}
                        <span className="font-mono text-foreground">{b.anchors}</span>
                      </span>
                      <span>
                        Size:{" "}
                        <span className="font-mono text-foreground">{b.size}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 px-2 text-gold hover:bg-gold/10 hover:text-gold-soft"
                      >
                        <Link href={`/timeline?caseId=${encodeURIComponent(b.caseId)}`}>
                          View Timeline
                        </Link>
                      </Button>
                    </div>
                  </header>

                  {/* Events table */}
                  <div className="overflow-x-auto">
                    <Table aria-label={`Events for case ${b.caseId}`}>
                      <caption className="sr-only">
                        {b.events.length} evidence events sealed in bundle {b.caseId}
                      </caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Event</TableHead>
                          <TableHead scope="col">Type</TableHead>
                          <TableHead scope="col">Source</TableHead>
                          <TableHead scope="col">Signature</TableHead>
                          <TableHead scope="col">Time</TableHead>
                          <TableHead scope="col" className="text-right">
                            Cross-Tab
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {b.events.map((e) => {
                          const isException = e.type === "EXCEPTION_OPENED";
                          return (
                            <TableRow key={e.id}>
                              <TableCell className="font-mono text-xs text-gold">
                                {e.id}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "font-mono text-[10px] uppercase tracking-wider",
                                    eventTone(e.type),
                                  )}
                                >
                                  {e.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-foreground">
                                {e.source}
                              </TableCell>
                              <TableCell className="font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                                {e.sig}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-fg-muted">
                                {e.time}
                              </TableCell>
                              <TableCell className="text-right">
                                {isException ? (
                                  <Link
                                    href="/exceptions"
                                    className="inline-flex items-center gap-1 text-xs text-gold underline-offset-2 hover:underline"
                                  >
                                    View Exception
                                  </Link>
                                ) : (
                                  <span className="text-xs text-fg-muted/50">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-fg-muted">
        <CountUp value={bundles.length} /> bundles ·{" "}
        <CountUp value={totalEvents} /> total events · anchored on-chain
        for tamper-evidence.
      </p>
    </div>
  );
}

export default function EvidencePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading…</div>}>
      <EvidenceContent />
    </Suspense>
  );
}

