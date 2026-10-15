"use client";

/**
 * MITHQAL Assurance — Exception Management Board (/exceptions).
 *
 * FLAGSHIP AI-ASSISTED PAGE.
 *
 *   • 6 <StatCard/> KPIs at the top (severity summary), each with sparkline
 *     trend hint, wrapped in `.stagger-in` for the entrance animation.
 *   • A table of 10 raised exceptions. Each row carries the standard
 *     exception metadata (id, caseId, code, severity, status, owner,
 *     action). The rightmost column hosts an <AIExplainer triggerVariant="icon">:
 *     clicking the ✨ opens a Dialog that calls POST /api/v1/explain and
 *     renders the AI root-cause hypothesis, impact, recommended actions,
 *     and a confidence score.
 *
 * Accessibility:
 *   • sr-only <caption> on the table.
 *   • scope="col" on every <th>.
 *   • The AI trigger has aria-label="Get AI explanation for exception {code}"
 *     (handled by the AIExplainer component).
 */

import * as React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingDown,
  UserCog,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AIExplainer, type ExceptionData } from "@/components/shared/ai-explainer";
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
 * Demo data — 10 raised exceptions across multiple corridors.
 * ────────────────────────────────────────────────────────────── */

type Severity = "critical" | "high" | "medium" | "low";
type Status = "open" | "in-review" | "remediated" | "wont-fix";

type ExceptionRow = {
  id: string;
  caseId: string;
  code: string;
  title: string;
  severity: Severity;
  status: Status;
  owner: string;
  action: string;
};

const DEMO_EXCEPTIONS: ExceptionRow[] = [
  {
    id: "EXC-2024-0918",
    caseId: "CSE-2024-0418",
    code: "E-CUSTODY-DRIFT",
    title: "Custody ledger drift > 0.5% vs. on-chain proof",
    severity: "critical",
    status: "open",
    owner: "M. Khoury",
    action: "Pause corridor; freeze sub-custody until reconciliation",
  },
  {
    id: "EXC-2024-0917",
    caseId: "CSE-2024-0417",
    code: "E-SETTLEMENT-LAG",
    title: "Settlement window exceeded 4h SLA on USD-CHF",
    severity: "high",
    status: "in-review",
    owner: "L. Nakamura",
    action: "Escalate to sub-custodian; trigger secondary rail",
  },
  {
    id: "EXC-2024-0916",
    caseId: "CSE-2024-0416",
    code: "E-POR-DRIFT",
    title: "Proof-of-reserve drifted from canonical supply",
    severity: "high",
    status: "remediated",
    owner: "R. Hadid",
    action: "Re-publish proof; flag observation for 24h watch",
  },
  {
    id: "EXC-2024-0915",
    caseId: "CSE-2024-0415",
    code: "E-LEDGER-LAG",
    title: "Off-chain ledger lag > 90s on Beirut sub-custody",
    severity: "medium",
    status: "open",
    owner: "S. Mansour",
    action: "Engage site SRE; fall back to async settlement",
  },
  {
    id: "EXC-2024-0914",
    caseId: "CSE-2024-0414",
    code: "E-SANCTIONS-FP",
    title: "Sanctions screening false-positive on QNB",
    severity: "low",
    status: "remediated",
    owner: "J. Park",
    action: "Tune screening threshold; document as known exception",
  },
  {
    id: "EXC-2024-0913",
    caseId: "CSE-2024-0413",
    code: "E-MINT-IMBAL",
    title: "Mint-redeem imbalance > 2% over 24h window",
    severity: "high",
    status: "in-review",
    owner: "K. Tanaka",
    action: "Rebalance via treasury; notify market-maker",
  },
  {
    id: "EXC-2024-0912",
    caseId: "CSE-2024-0412",
    code: "E-ORACLE-STALE",
    title: "Oracle price stale > 90s on XAU feed",
    severity: "medium",
    status: "in-review",
    owner: "A. Costa",
    action: "Fail-over to backup oracle; quarantine stale window",
  },
  {
    id: "EXC-2024-0911",
    caseId: "CSE-2024-0411",
    code: "E-GEO-FENCE",
    title: "Geo-fence triggered on restricted jurisdiction",
    severity: "critical",
    status: "open",
    owner: "M. Khoury",
    action: "Block corridor; freeze pending instructions; legal review",
  },
  {
    id: "EXC-2024-0910",
    caseId: "CSE-2024-0410",
    code: "E-CONC-RISK",
    title: "Sub-custodian concentration > 25% of NAV",
    severity: "high",
    status: "in-review",
    owner: "R. Hadid",
    action: "Initiate rebalancing plan; notify risk committee",
  },
  {
    id: "EXC-2024-0909",
    caseId: "CSE-2024-0409",
    code: "E-AUDIT-FAIL",
    title: "Internal audit trail gap on instruction SET-88421",
    severity: "low",
    status: "wont-fix",
    owner: "J. Park",
    action: "Document gap; accept residual risk per policy §4.7",
  },
];

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "border-red-400/30 bg-red-400/10 text-red-300",
  high: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  medium: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const STATUS_TONE: Record<Status, string> = {
  open: "border-red-400/30 bg-red-400/10 text-red-300",
  "in-review": "border-amber-400/30 bg-amber-400/10 text-amber-300",
  remediated: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "wont-fix": "border-purple-400/30 bg-purple-400/10 text-purple-300",
};

/* Sparklines for the severity summary StatCards. */
const SPARK_OPEN = [12, 10, 11, 9, 8, 10, 9, 7, 6, 8, 6, 5];
const SPARK_CRITICAL = [3, 2, 2, 3, 2, 1, 2, 2, 1, 1, 2, 1];
const SPARK_HIGH = [5, 4, 5, 4, 3, 4, 3, 3, 2, 3, 2, 2];
const SPARK_MEDIUM = [4, 5, 4, 4, 5, 4, 4, 3, 3, 2, 3, 2];
const SPARK_LOW = [3, 2, 3, 2, 3, 2, 2, 2, 1, 2, 1, 2];
const SPARK_MTTR = [38, 36, 34, 35, 32, 30, 31, 28, 29, 27, 26, 25];

function toAIException(e: ExceptionRow): ExceptionData {
  return {
    exceptionId: e.id,
    caseId: e.caseId,
    code: e.code,
    severity: e.severity,
    status: e.status,
    owner: e.owner,
    reason: e.code,
    action: e.action,
  };
}

export default function ExceptionsPage() {
  const counts = React.useMemo(() => {
    return {
      open: DEMO_EXCEPTIONS.filter((e) => e.status === "open").length,
      critical: DEMO_EXCEPTIONS.filter((e) => e.severity === "critical").length,
      high: DEMO_EXCEPTIONS.filter((e) => e.severity === "high").length,
      medium: DEMO_EXCEPTIONS.filter((e) => e.severity === "medium").length,
      low: DEMO_EXCEPTIONS.filter((e) => e.severity === "low").length,
    };
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Exception Management Board"
        description="All raised exceptions across the institution's reserve corridors, with AI-assisted root-cause analysis on each row."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Exceptions" },
        ]}
      />

      {/* ── Severity summary StatCards ── */}
      <section
        aria-label="Severity summary"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        <StatCard
          label="Open Exceptions"
          value={counts.open}
          icon={AlertTriangle}
          color="amber"
          sparklineData={SPARK_OPEN}
          sub="awaiting action"
        />
        <StatCard
          label="Critical"
          value={counts.critical}
          icon={AlertOctagon}
          color="red"
          sparklineData={SPARK_CRITICAL}
          sub="P0 · page on-call"
        />
        <StatCard
          label="High"
          value={counts.high}
          icon={ShieldCheck}
          color="amber"
          sparklineData={SPARK_HIGH}
          sub="P1 · 4h SLA"
        />
        <StatCard
          label="Medium"
          value={counts.medium}
          icon={Clock}
          color="cyan"
          sparklineData={SPARK_MEDIUM}
          sub="P2 · 24h SLA"
        />
        <StatCard
          label="Low"
          value={counts.low}
          icon={CheckCircle2}
          color="emerald"
          sparklineData={SPARK_LOW}
          sub="P3 · 7d SLA"
        />
        <StatCard
          label="MTTR"
          value={25}
          suffix="h"
          icon={TrendingDown}
          color="purple"
          sparklineData={SPARK_MTTR}
          decimals={0}
          sub="↓ 13h vs. last month"
        />
      </section>

      {/* ── Exceptions table with AI explainer column ── */}
      <section aria-label="Exceptions table" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Raised Exceptions
          </h2>
          <span className="text-xs text-fg-muted">
            {DEMO_EXCEPTIONS.length} total · 10 visible
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 backdrop-blur-sm">
            <Table aria-label="Raised exceptions with AI-assisted analysis">
              <caption className="sr-only">
                {`Exception Management Board — ${DEMO_EXCEPTIONS.length} exceptions`}
              </caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Exception</TableHead>
                  <TableHead scope="col">Case</TableHead>
                  <TableHead scope="col">Code</TableHead>
                  <TableHead scope="col">Severity</TableHead>
                  <TableHead scope="col">Status</TableHead>
                  <TableHead scope="col">Owner</TableHead>
                  <TableHead scope="col">Recommended Action</TableHead>
                  <TableHead scope="col" className="text-right">
                    AI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DEMO_EXCEPTIONS.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <span className="font-mono text-xs text-gold">
                        {e.id}
                      </span>
                      <p className="mt-0.5 max-w-[28rem] truncate text-foreground">
                        {e.title}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-fg-muted">
                      {e.caseId}
                    </TableCell>
                    <TableCell>
                      <span className="rounded border border-line/60 bg-ink-card/60 px-1.5 py-0.5 font-mono text-[10px] text-gold-soft">
                        {e.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          SEVERITY_TONE[e.severity],
                        )}
                      >
                        {e.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-wider",
                          STATUS_TONE[e.status],
                        )}
                      >
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                        <UserCog
                          className="h-3 w-3 text-fg-muted"
                          aria-hidden="true"
                        />
                        {e.owner}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[20rem] text-xs text-fg-muted">
                      {e.action}
                    </TableCell>
                    <TableCell className="text-right">
                      <AIExplainer
                        exception={toAIException(e)}
                        triggerVariant="icon"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-xs text-fg-muted">
          <span className="text-gold">✨ AI Explain</span> — click the icon on
          any row to generate a root-cause hypothesis, impact, recommended
          actions, and a confidence score. The AI analysis is advisory; human
          review is always required before acting.
        </p>
      </section>
    </div>
  );
}
