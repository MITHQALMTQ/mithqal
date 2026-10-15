"use client";

/**
 * MITHQAL Assurance — Evidence Timeline (/timeline).
 *
 * A chronologically ordered board of every evidence event the assurance
 * engine has captured across the institution's reserve corridors.
 *
 * Layout:
 *   • PageHeader w/ breadcrumbs
 *   • 5 StatCards (Total Events, Cases Tracked, Bundles Sealed, Avg Lag,
 *     Last Publish) wrapped in `.stagger-in`
 *   • Vertical timeline + a flat table both summarised by case
 *
 * A11y: sr-only caption, scope="col" on every th.
 */

import * as React from "react";
import {
  Activity,
  Clock,
  History,
  Layers,
  ScrollText,
  ShieldCheck,
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
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Demo data.
 * ────────────────────────────────────────────────────────────── */

type EventKind =
  | "mint"
  | "redeem"
  | "proof"
  | "exception"
  | "rebalance"
  | "audit";

type EventRow = {
  id: string;
  caseId: string;
  kind: EventKind;
  summary: string;
  occurredAt: string;
  corridor: string;
};

const DEMO_EVENTS: EventRow[] = [
  {
    id: "EVT-2024-0418-008",
    caseId: "CSE-2024-0418",
    kind: "exception",
    summary: "Sub-custody drift detected; corridor paused",
    occurredAt: "2024-04-18 09:14",
    corridor: "EUR-XAU",
  },
  {
    id: "EVT-2024-0418-007",
    caseId: "CSE-2024-0418",
    kind: "audit",
    summary: "Audit trail entry written for SET-88421",
    occurredAt: "2024-04-18 08:50",
    corridor: "EUR-XAU",
  },
  {
    id: "EVT-2024-0418-006",
    caseId: "CSE-2024-0417",
    kind: "proof",
    summary: "Proof-of-reserve published — 0.00% drift",
    occurredAt: "2024-04-17 22:00",
    corridor: "USD-CHF",
  },
  {
    id: "EVT-2024-0418-005",
    caseId: "CSE-2024-0417",
    kind: "redeem",
    summary: "Redeem instruction SET-88421 settled — $4.18M",
    occurredAt: "2024-04-17 16:02",
    corridor: "USD-CHF",
  },
  {
    id: "EVT-2024-0418-004",
    caseId: "CSE-2024-0416",
    kind: "rebalance",
    summary: "Rebalance plan approved — 12% NAV shift",
    occurredAt: "2024-04-16 18:30",
    corridor: "GBP-XAU",
  },
  {
    id: "EVT-2024-0418-003",
    caseId: "CSE-2024-0416",
    kind: "proof",
    summary: "Proof-of-reserve drift remediated — 0.5% → 0.0%",
    occurredAt: "2024-04-16 12:10",
    corridor: "GBP-XAU",
  },
  {
    id: "EVT-2024-0418-002",
    caseId: "CSE-2024-0415",
    kind: "exception",
    summary: "Off-chain ledger lag detected — 92s",
    occurredAt: "2024-04-15 14:21",
    corridor: "AED-USD",
  },
  {
    id: "EVT-2024-0418-001",
    caseId: "CSE-2024-0414",
    kind: "mint",
    summary: "Mint instruction approved — 1,200 MTQ",
    occurredAt: "2024-04-14 08:05",
    corridor: "QAR-USD",
  },
];

const KIND_TONE: Record<EventKind, string> = {
  mint: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  redeem: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  proof: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  exception: "border-red-400/30 bg-red-400/10 text-red-300",
  rebalance: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  audit: "border-gold/30 bg-gold/10 text-gold-soft",
};

const SPARK_EVENTS = [128, 132, 140, 138, 145, 152, 158, 162, 160, 168, 172, 180];
const SPARK_CASES = [22, 24, 23, 25, 27, 26, 28, 30, 29, 31, 32, 33];
const SPARK_BUNDLES = [4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
const SPARK_LAG = [142, 138, 132, 128, 124, 120, 118, 114, 110, 108, 104, 100];
const SPARK_PUBLISH = [4, 5, 4, 5, 6, 5, 6, 7, 6, 7, 8, 7];

export default function TimelinePage() {
  const totalEvents = DEMO_EVENTS.length;
  const casesTracked = new Set(DEMO_EVENTS.map((e) => e.caseId)).size;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Evidence Timeline"
        description="Chronological record of every evidence event captured by the assurance engine — mints, redeems, proofs, exceptions, rebalances, and audit entries."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Timeline" },
        ]}
      />

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
          value={9}
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
        <h2 className="font-display text-lg font-semibold text-foreground">
          Event Stream
        </h2>

        <ol className="glass-depth relative rounded-xl border border-line/60 p-5">
          {DEMO_EVENTS.map((e, i) => {
            const isLast = i === DEMO_EVENTS.length - 1;
            return (
              <li
                key={e.id}
                className="relative flex gap-4 pb-6 last:pb-0"
                aria-label={`${e.kind} event at ${e.occurredAt}`}
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
                    KIND_TONE[e.kind],
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
                        KIND_TONE[e.kind],
                      )}
                    >
                      {e.kind}
                    </Badge>
                    <span className="font-mono text-xs text-gold">
                      {e.id}
                    </span>
                    <span className="ml-auto font-mono text-[11px] text-fg-muted">
                      {e.occurredAt}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{e.summary}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    <span className="font-mono">{e.corridor}</span>
                    <span className="mx-2 text-fg-muted/50">·</span>
                    <span>Case {e.caseId}</span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Compact table view ── */}
      <section aria-label="Timeline table" className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Events by Case
        </h2>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Evidence events by case">
              <caption className="sr-only">
                Timeline of evidence events by case
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Event</TableHead>
                  <TableHead scope="col">Case</TableHead>
                  <TableHead scope="col">Kind</TableHead>
                  <TableHead scope="col">Summary</TableHead>
                  <TableHead scope="col">Corridor</TableHead>
                  <TableHead scope="col">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_EVENTS.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs text-gold">
                      {e.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {e.caseId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          KIND_TONE[e.kind],
                        )}
                      >
                        {e.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[24rem] truncate text-xs text-foreground">
                      {e.summary}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {e.corridor}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {e.occurredAt}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <CountUp value={totalEvents} /> events across{" "}
          <CountUp value={casesTracked} /> cases in the last 24 hours.
        </p>
      </section>
    </div>
  );
}
