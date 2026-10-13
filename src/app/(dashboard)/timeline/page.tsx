"use client";

import { CheckCircle2, Clock, Info, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { type MtqStatus, StatusBadge } from "@/components/shared/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Timeline page — MITHQAL MASTER BLUEPRINT §5.4 + §16.1.
 *
 * Validation-case timeline showing the 10 source-specific evidence events
 * from §5.4 (NOT the legacy F0–F7 finality states):
 *
 *   RECORD_RECEIVED                     — System received a record from a source
 *   SOURCE_AUTHENTICATED                — Source identity was verified
 *   VALIDATION_PASSED                   — Record passed configured rules
 *   EXCEPTION_OPENED                    — A discrepancy was identified
 *   HUMAN_APPROVAL_RECORDED             — An authorised person approved an action
 *   PROVIDER_ACKNOWLEDGEMENT_RECEIVED    — A provider acknowledged receipt
 *   SETTLEMENT_CONFIRMATION_RECEIVED    — System received a settlement confirmation
 *   RECONCILIATION_COMPLETED            — Records from multiple sources match
 *   EVIDENCE_CONFLICT_DETECTED          — Sources disagree
 *   DISPUTE_OPENED                      — A formal dispute was raised
 *
 * Critical rule (§5.4): A SETTLEMENT_CONFIRMATION_RECEIVED event means the
 * system received a confirmation — it does NOT rename the case to "final"
 * unless the relevant system rules, source authority, and legal analysis
 * justify that wording.
 *
 * All values are demo data — VC-2027-0042 is the canonical pilot demo
 * (AED→INR, UAE→India). Real timelines are loaded from
 * GET /api/v1/validation-cases/[id]/timeline when the DB is provisioned.
 */

const DEMO_DATA_LABEL = "DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE";

interface TimelineEvent {
  event: string;
  name: string;
  timestamp: string;
  source: string;
  evidenceHash: string;
  status: "success" | "error" | "pending";
}

const TIMELINE: TimelineEvent[] = [
  {
    event: "RECORD_RECEIVED",
    name: "Record received from source",
    timestamp: "10:23:15.000",
    source: "Bank A SWIFT Interface",
    evidenceHash: "0xabc…001",
    status: "success",
  },
  {
    event: "SOURCE_AUTHENTICATED",
    name: "Source identity verified",
    timestamp: "10:23:16.200",
    source: "MITHQAL mTLS layer",
    evidenceHash: "0xabc…002",
    status: "success",
  },
  {
    event: "VALIDATION_PASSED",
    name: "Record passed configured rules",
    timestamp: "10:23:18.000",
    source: "MITHQAL validator",
    evidenceHash: "0xdef…003",
    status: "success",
  },
  {
    event: "EXCEPTION_OPENED",
    name: "Discrepancy identified",
    timestamp: "10:23:18.500",
    source: "MITHQAL validator",
    evidenceHash: "0xdef…004",
    status: "error",
  },
  {
    event: "HUMAN_APPROVAL_RECORDED",
    name: "Authorised person approved action",
    timestamp: "10:35:22.000",
    source: "ops-lead",
    evidenceHash: "0x123…005",
    status: "success",
  },
  {
    event: "PROVIDER_ACKNOWLEDGEMENT_RECEIVED",
    name: "Provider acknowledged receipt",
    timestamp: "10:36:01.400",
    source: "RTGS provider",
    evidenceHash: "0x123…006",
    status: "success",
  },
  {
    event: "SETTLEMENT_CONFIRMATION_RECEIVED",
    name: "Settlement confirmation received",
    timestamp: "10:48:14.700",
    source: "RTGS provider",
    evidenceHash: "0x456…007",
    status: "success",
  },
  {
    event: "RECONCILIATION_COMPLETED",
    name: "Records from multiple sources match",
    timestamp: "10:50:02.100",
    source: "MITHQAL reconciler",
    evidenceHash: "0x456…008",
    status: "success",
  },
  {
    event: "EVIDENCE_CONFLICT_DETECTED",
    name: "Sources disagree",
    timestamp: "—",
    source: "—",
    evidenceHash: "—",
    status: "pending",
  },
  {
    event: "DISPUTE_OPENED",
    name: "Formal dispute raised",
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
            {event.event}
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
  const caseStatus: MtqStatus = "EXCEPTION";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Validation Case Timeline"
        description="Source-specific evidence events per §5.4 (10 events, not F0–F7)"
      />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>{DEMO_DATA_LABEL}</AlertTitle>
        <AlertDescription>
          VC-2027-0042 is the canonical pilot demo: 2,100,000 AED → INR, UAE → India. The
          EVIDENCE_CONFLICT_DETECTED and DISPUTE_OPENED events are pending for this case — no
          conflict or dispute has been raised. A SETTLEMENT_CONFIRMATION_RECEIVED event means the
          system received a confirmation; it does NOT rename the case to &quot;final&quot; unless
          the relevant system rules, source authority, and legal analysis justify that wording.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono">VC-2027-0042</CardTitle>
              <CardDescription>2,100,000 AED → INR · UAE → India</CardDescription>
            </div>
            <StatusBadge status={caseStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <ol className="relative">
            {TIMELINE.map((event, idx) => (
              <TimelineItem key={event.event} event={event} isLast={idx === TIMELINE.length - 1} />
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
