"use client";

import { CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { type MtqStatus, StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Timeline page — MITHQAL-TECH-SPEC-001 §3.4.2.
 *
 * Instruction timeline showing the F0→F7 finality states (per the
 * finality-state-machine). Each TimelineItem displays:
 *   - state (F0..F7)
 *   - name
 *   - timestamp
 *   - source (bank / rail / treasury)
 *   - evidence hash
 *   - status (success / error / pending)
 *
 * Synthetic demo instruction INS-003 — exactly the example used in the
 * spec §3.4.2. Pilot users can replay this instruction on /replay.
 */

interface TimelineEvent {
  state: string;
  name: string;
  timestamp: string;
  source: string;
  evidenceHash: string;
  status: "success" | "error" | "pending";
}

const TIMELINE: TimelineEvent[] = [
  {
    state: "F0",
    name: "Instruction Accepted",
    timestamp: "10:23:15.000",
    source: "Bank A API",
    evidenceHash: "HASH-001",
    status: "success",
  },
  {
    state: "F1",
    name: "Bank Funding Final",
    timestamp: "10:23:18.500",
    source: "Bank A Treasury",
    evidenceHash: "HASH-002",
    status: "success",
  },
  {
    state: "F2",
    name: "FX Leg Final",
    timestamp: "10:23:22.100",
    source: "FX Provider",
    evidenceHash: "HASH-003",
    status: "success",
  },
  {
    state: "F3",
    name: "Rail Debit Confirmed",
    timestamp: "10:23:45.800",
    source: "RTGS",
    evidenceHash: "HASH-004",
    status: "success",
  },
  {
    state: "F4",
    name: "Rail Credit Confirmed",
    timestamp: "10:24:02.300",
    source: "RTGS",
    evidenceHash: "HASH-005",
    status: "success",
  },
  {
    state: "F5",
    name: "Creditor Bank Confirmed",
    timestamp: "10:24:05.000",
    source: "Bank B API",
    evidenceHash: "HASH-006",
    status: "success",
  },
  {
    state: "F6",
    name: "External Rail Final",
    timestamp: "10:24:10.000",
    source: "RTGS",
    evidenceHash: "HASH-007",
    status: "error",
  },
  {
    state: "F7",
    name: "Settlement Closed",
    timestamp: "—",
    source: "—",
    evidenceHash: "—",
    status: "pending",
  },
];

function StatusIcon({ status }: { status: TimelineEvent["status"] }) {
  if (status === "success")
    return <CheckCircle2 className="size-4 text-emerald-500" aria-label="success" />;
  if (status === "error") return <XCircle className="size-4 text-rose-500" aria-label="error" />;
  return <Clock className="size-4 text-muted-foreground" aria-label="pending" />;
}

const STATUS_COLOR: Record<TimelineEvent["status"], string> = {
  success: "bg-emerald-500",
  error: "bg-rose-500",
  pending: "bg-muted-foreground",
};

function TimelineItem({ event, isLast }: { event: TimelineEvent; isLast: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6">
      {/* Vertical line */}
      {!isLast ? (
        <span className="absolute top-6 left-[11px] h-full w-px bg-border" aria-hidden="true" />
      ) : null}
      {/* Dot + status icon */}
      <div className="relative flex size-6 shrink-0 items-center justify-center rounded-full border bg-background">
        <span
          className={cn("size-2 rounded-full", STATUS_COLOR[event.status])}
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">
            {event.state}
          </span>
          <span className="text-sm font-medium">{event.name}</span>
          <StatusIcon status={event.status} />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
          <div>
            <dt className="sr-only">Timestamp</dt>
            <dd className="font-mono tabular-nums">{event.timestamp}</dd>
          </div>
          <div>
            <dt className="sr-only">Source</dt>
            <dd>{event.source}</dd>
          </div>
          <div>
            <dt className="sr-only">Evidence hash</dt>
            <dd className="font-mono">{event.evidenceHash}</dd>
          </div>
        </dl>
      </div>
    </li>
  );
}

export default function TimelinePage() {
  const instructionStatus: MtqStatus = "EXCEPTION";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instruction Timeline"
        description="Complete timeline of all settlement events"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Synthetic demo instruction</AlertTitle>
        <AlertDescription>
          INS-003 is the canonical pilot demo: $2,100,000 USD→INR, UAE→India. F6 (External Rail
          Final) fails — see /replay to reconstruct the policy decision that selected RTGS.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono">INS-003</CardTitle>
              <CardDescription>$2,100,000 USD → INR · UAE → India</CardDescription>
            </div>
            <StatusBadge status={instructionStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <ol className="relative">
            {TIMELINE.map((event, idx) => (
              <TimelineItem key={event.state} event={event} isLast={idx === TIMELINE.length - 1} />
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
