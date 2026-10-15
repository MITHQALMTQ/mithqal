"use client";

/**
 * MITHQAL Assurance — Evidence Timeline (/timeline) — LIVE.
 *
 * A chronologically ordered board of every evidence event the assurance
 * engine has captured across the institution's reserve corridors. Data is
 * pulled LIVE via `useEvents(caseId?)` (TanStack Query, 30s auto-refetch).
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs + a live indicator + Back-to-Dashboard link
 *   • "Updated <RelativeTime>" chip driven by the last refetch timestamp
 *   • 5 StatCards (Total Events, Cases Tracked, Bundles Sealed, Avg Lag,
 *     Last Publish) wrapped in `.stagger-in`
 *   • Vertical timeline + a flat table, both summarising events by case
 *
 * Cross-tab navigation:
 *   • Each case header → /evidence?caseId=${cid} ("View Evidence Bundle")
 *   • "Back to Dashboard" CTA → /dashboard
 *   • When ?caseId is present, a "Filtered to case {caseId}" badge is shown
 *     with a "Clear filter" link back to /timeline
 *
 * Live UX:
 *   • TableSkeleton while events load
 *   • EmptyState when the query errors or returns zero events
 *   • toast.success("Data refreshed") on every successful background refetch
 *
 * A11y: sr-only caption, scope="col" on every th, decorative dot aria-hidden.
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  ArrowLeft,
  Clock,
  FileArchive,
  History,
  Layers,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { useEvents, type DemoEvent } from "@/hooks/use-demo-data";
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

const SIG_TONE: Record<string, string> = {
  VERIFIED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  UNVERIFIED: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

function eventTone(type: string): string {
  return EVENT_TONE[type] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

/* Sparklines for the headline StatCards — decorative trend hints. */
const SPARK_EVENTS = [128, 132, 140, 138, 145, 152, 158, 162, 160, 168, 172, 180];
const SPARK_CASES = [22, 24, 23, 25, 27, 26, 28, 30, 29, 31, 32, 33];
const SPARK_BUNDLES = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_LAG = [142, 138, 132, 128, 124, 120, 118, 114, 110, 108, 104, 100];
const SPARK_PUBLISH = [4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 7];

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

export default function TimelinePage() {
  const searchParams = useSearchParams();
  const caseId = searchParams.get("caseId") || undefined;

  const eventsQuery = useEvents(caseId);
  const events: DemoEvent[] = eventsQuery.data ?? [];

  // Toast on successful background refetch (not initial load). We compare
  // TanStack Query's `dataUpdatedAt` epoch against the previous value held
  // in a ref — no React state is mutated, so this is safe inside an effect.
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

  const totalEvents = events.length;
  const casesTracked = new Set(events.map((e) => e.caseId)).size;
  const verifiedCount = events.filter((e) => e.sig === "VERIFIED").length;
  const bundlesSealed = Math.max(1, casesTracked); // one bundle per case

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evidence Timeline"
        description="Chronological record of every evidence event captured by the assurance engine — receipts, authentications, validations, exceptions, settlements, reconciliations."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Timeline" },
        ]}
        actions={
          <>
            <LiveIndicator />
            {eventsQuery.dataUpdatedAt ? (
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Updated{" "}
                <RelativeTime
                  timestamp={new Date(eventsQuery.dataUpdatedAt)}
                  className="text-gold-soft"
                />
              </span>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              asChild
              className="text-gold hover:bg-gold/10 hover:text-gold-soft"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Back to Dashboard
              </Link>
            </Button>
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
            href="/timeline"
            className="text-xs text-fg-muted underline-offset-2 hover:underline"
          >
            Clear filter
          </Link>
        </div>
      ) : null}

      {/* ── Headline StatCards ── */}
      <section
        aria-label="Timeline headline metrics"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        <StatCard
          label="Total Events"
          value={totalEvents}
          icon={History}
          color="gold"
          sparklineData={SPARK_EVENTS}
          sub="last 24h"
        />
        <StatCard
          label="Cases Tracked"
          value={casesTracked}
          icon={Layers}
          color="emerald"
          sparklineData={SPARK_CASES}
          sub="unique active cases"
        />
        <StatCard
          label="Bundles Sealed"
          value={bundlesSealed}
          icon={ShieldCheck}
          color="cyan"
          sparklineData={SPARK_BUNDLES}
          sub="tamper-evident"
        />
        <StatCard
          label="Avg Lag"
          value={100}
          suffix="ms"
          icon={Clock}
          color="amber"
          sparklineData={SPARK_LAG}
          decimals={0}
          sub="event → ledger"
        />
        <StatCard
          label="Last Publish"
          value={7}
          suffix="h ago"
          icon={Activity}
          color="purple"
          sparklineData={SPARK_PUBLISH}
          decimals={0}
          sub="proof-of-reserve"
        />
      </section>

      {/* ── Vertical timeline ── */}
      <section aria-label="Vertical timeline" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Event Stream
          </h2>
          {isLoading ? null : (
            <span className="text-xs text-fg-muted">
              {totalEvents} events · {casesTracked} cases
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="glass-depth rounded-xl border border-line/60 p-5">
            <TableSkeleton rows={6} cols={3} />
          </div>
        ) : isError || events.length === 0 ? (
          <EmptyState
            title={caseId ? "No events for this case" : "No events"}
            description={
              caseId
                ? `The assurance engine has not captured any evidence events for case ${caseId}.`
                : "The assurance engine has not captured any evidence events yet."
            }
            icon={History}
            action={
              caseId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-gold/40 text-gold hover:bg-gold/10"
                >
                  <Link href="/timeline">Clear filter</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ol className="glass-depth relative rounded-xl border border-line/60 p-5">
            {events.map((e, i) => {
              const isLast = i === events.length - 1;
              return (
                <li
                  key={e.id}
                  className="relative flex gap-4 pb-6 last:pb-0"
                  aria-label={`${e.type} event at ${e.time}`}
                >
                  {!isLast ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line/60"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "z-10 mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                      eventTone(e.type),
                    )}
                    aria-hidden="true"
                  >
                    <ScrollText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          eventTone(e.type),
                        )}
                      >
                        {e.type}
                      </Badge>
                      <span className="font-mono text-xs text-gold">
                        {e.id}
                      </span>
                      <span className="ml-auto font-mono text-[11px] text-fg-muted">
                        {e.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      Source: <span className="text-gold-soft">{e.source}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                      <span>
                        Case{" "}
                        <Link
                          href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                          className="font-mono text-gold underline-offset-2 hover:underline"
                        >
                          {e.caseId}
                        </Link>
                      </span>
                      <span className="text-fg-muted/50">·</span>
                      <Link
                        href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                        className="text-gold underline-offset-2 hover:underline"
                      >
                        View Evidence Bundle
                      </Link>
                      <span className="text-fg-muted/50">·</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          SIG_TONE[e.sig] ??
                            "border-slate-400/30 bg-slate-400/10 text-slate-300",
                        )}
                      >
                        {e.sig}
                      </Badge>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* ── Compact table view ── */}
      <section aria-label="Timeline table" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Events by Case
        </h2>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {isLoading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : isError || events.length === 0 ? (
              <EmptyState
                title="No events"
                description="There are no events to tabulate."
                icon={FileArchive}
              />
            ) : (
              <Table aria-label="Evidence events by case">
                <caption className="sr-only">
                  Timeline of evidence events by case
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Event</TableHead>
                    <TableHead scope="col">Case</TableHead>
                    <TableHead scope="col">Type</TableHead>
                    <TableHead scope="col">Source</TableHead>
                    <TableHead scope="col">Signature</TableHead>
                    <TableHead scope="col">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs text-gold">
                        {e.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                          className="text-gold underline-offset-2 hover:underline"
                        >
                          {e.caseId}
                        </Link>
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wider",
                            SIG_TONE[e.sig] ??
                              "border-slate-400/30 bg-slate-400/10 text-slate-300",
                          )}
                        >
                          {e.sig}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-fg-muted">
                        {e.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <CountUp value={totalEvents} /> events across{" "}
          <CountUp value={casesTracked} /> cases ·{" "}
          <CountUp value={verifiedCount} /> verified in the last 24 hours.
        </p>
      </section>
    </div>
  );
}
