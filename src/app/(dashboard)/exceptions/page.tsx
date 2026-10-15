"use client";

/**
 * MITHQAL Assurance — Exception Management Board (/exceptions) — LIVE.
 *
 * FLAGSHIP AI-ASSISTED PAGE.
 *
 * Data flows LIVE from `useExceptions(filters)` (TanStack Query, 30s auto-
 * refetch). Filter chips at the top set the URL `status` / `severity`
 * params so the state is shareable + survives refresh. The rightmost
 * "AI" column still hosts an <AIExplainer triggerVariant="icon"> per row
 * — clicking the ✨ opens a Dialog that calls POST /api/v1/explain and
 * renders the AI root-cause hypothesis, impact, recommended actions, and
 * a confidence score.
 *
 * Cross-tab navigation:
 *   • Each exception's caseId → /evidence?caseId=${e.caseId} ("View Evidence")
 *   • Each exception's caseId → /timeline?caseId=${e.caseId} ("View Timeline")
 *   • Filter chips set the URL `?status=` / `?severity=` params
 *
 * Live UX:
 *   • StatCardSkeleton while severity summary loads
 *   • TableSkeleton while the exceptions table loads
 *   • EmptyState when the query errors or returns zero rows
 *   • toast.success("Data refreshed") on every successful background refetch
 *
 * Accessibility:
 *   • sr-only <caption> on the table.
 *   • scope="col" on every <th>.
 *   • The AI trigger has aria-label="Get AI explanation for exception {code}"
 *     (handled by the AIExplainer component).
 *   • Each filter chip is a real <Link> (anchor) — keyboard-focusable + the
 *     active state is reflected in the URL, not in component state.
 */

export const dynamic = "force-dynamic";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileSearch,
  History,
  ShieldCheck,
  TrendingDown,
  UserCog,
} from "lucide-react";

import { useExceptions, type DemoException } from "@/hooks/use-demo-data";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { AIExplainer, type ExceptionData } from "@/components/shared/ai-explainer";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatCardSkeleton, TableSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
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
 * Tone maps — the live data uses UPPERCASE severity / status enums.
 * ────────────────────────────────────────────────────────────── */

const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "border-red-400/30 bg-red-400/10 text-red-300",
  HIGH: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  MEDIUM: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  LOW: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
};

const STATUS_TONE: Record<string, string> = {
  OPEN: "border-red-400/30 bg-red-400/10 text-red-300",
  IN_PROGRESS: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  ESCALATED: "border-purple-400/30 bg-purple-400/10 text-purple-300",
  RESOLVED: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  CLOSED: "border-slate-400/30 bg-slate-400/10 text-slate-300",
};

function severityTone(s: string): string {
  return SEVERITY_TONE[s] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

function statusTone(s: string): string {
  return STATUS_TONE[s] ?? "border-slate-400/30 bg-slate-400/10 text-slate-300";
}

/* Sparklines for the severity summary StatCards — decorative trend hints. */
const SPARK_OPEN = [12, 10, 11, 9, 8, 10, 9, 7, 6, 8, 6, 5];
const SPARK_CRITICAL = [3, 2, 2, 3, 2, 1, 2, 2, 1, 1, 2, 1];
const SPARK_HIGH = [5, 4, 5, 4, 3, 4, 3, 3, 2, 3, 2, 2];
const SPARK_MEDIUM = [4, 5, 4, 4, 5, 4, 4, 3, 3, 2, 3, 2];
const SPARK_LOW = [3, 2, 3, 2, 3, 2, 2, 2, 1, 2, 1, 2];
const SPARK_MTTR = [38, 36, 34, 35, 32, 30, 31, 28, 29, 27, 26, 25];

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
 * Adapter from the live DemoException shape to the AIExplainer's
 * ExceptionData shape. Follows the PHASE2 contract: `reason = code`.
 */
function toAIException(e: DemoException): ExceptionData {
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

/* ──────────────────────────────────────────────────────────────
 * Filter chip — a real <Link> so the active state lives in the URL.
 * ────────────────────────────────────────────────────────────── */

interface FilterChip {
  label: string;
  href: string;
  /** True when this chip's filter matches the current URL params. */
  active: boolean;
}

export default function ExceptionsPage() {
  const searchParams = useSearchParams();
  const severityParam = searchParams.get("severity") || undefined;
  const statusParam = searchParams.get("status") || undefined;

  // Build the filters object for the hook. Both severity and status can
  // be present at once — we honour both when both are set.
  const filters: { severity?: string; status?: string } = {};
  if (severityParam) filters.severity = severityParam;
  if (statusParam) filters.status = statusParam;

  const exceptionsQuery = useExceptions(
    Object.keys(filters).length ? filters : undefined,
  );
  const exceptions: DemoException[] = exceptionsQuery.data ?? [];

  // Toast on refresh. Compare TanStack Query's `dataUpdatedAt` epoch
  // against the previous value held in a ref — no React state is mutated,
  // so this is safe inside an effect.
  const prevUpdatedAt = React.useRef<number>(0);
  React.useEffect(() => {
    if (
      exceptionsQuery.dataUpdatedAt &&
      exceptionsQuery.dataUpdatedAt !== prevUpdatedAt.current
    ) {
      if (prevUpdatedAt.current !== 0) {
        toast.success("Data refreshed", { duration: 1500 });
      }
      prevUpdatedAt.current = exceptionsQuery.dataUpdatedAt;
    }
  }, [exceptionsQuery.dataUpdatedAt]);

  const isLoading = exceptionsQuery.isLoading;
  const isError = !!exceptionsQuery.error;

  // Severity + status aggregates for the StatCards. Recomputed only when
  // the data array reference changes.
  const counts = React.useMemo(() => {
    const all = exceptions;
    return {
      open: all.filter((e) => e.status === "OPEN").length,
      critical: all.filter((e) => e.severity === "CRITICAL").length,
      high: all.filter((e) => e.severity === "HIGH").length,
      medium: all.filter((e) => e.severity === "MEDIUM").length,
      low: all.filter((e) => e.severity === "LOW").length,
    };
  }, [exceptions]);

  // Filter chips — every chip is a Link so the active state lives in the URL.
  const chips: FilterChip[] = [
    {
      label: "All",
      href: "/exceptions",
      active: !severityParam && !statusParam,
    },
    {
      label: "Open",
      href: "/exceptions?status=OPEN",
      active: statusParam === "OPEN",
    },
    {
      label: "Critical",
      href: "/exceptions?severity=CRITICAL",
      active: severityParam === "CRITICAL",
    },
    {
      label: "Resolved",
      href: "/exceptions?status=RESOLVED",
      active: statusParam === "RESOLVED",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Exception Management Board"
        description="All raised exceptions across the institution's reserve corridors, with AI-assisted root-cause analysis on each row."
        breadcrumbs={[
          { label: "Assurance", href: "/" },
          { label: "Exceptions" },
        ]}
        actions={
          <>
            <LiveIndicator />
            {exceptionsQuery.dataUpdatedAt ? (
              <span className="flex items-center gap-1.5 text-xs text-fg-muted">
                Updated{" "}
                <RelativeTime
                  timestamp={new Date(exceptionsQuery.dataUpdatedAt)}
                  className="text-gold-soft"
                />
              </span>
            ) : null}
          </>
        }
      />

      {/* ── Severity summary StatCards ── */}
      <section
        aria-label="Severity summary"
        className="stagger-in grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
        ) : (
          <>
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
          </>
        )}
      </section>

      {/* ── Filter chips ── */}
      <nav
        aria-label="Exception filters"
        className="flex flex-wrap items-center gap-2"
      >
        {chips.map((chip) => (
          <Link
            key={chip.label}
            href={chip.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              chip.active
                ? "border-gold bg-gold/15 text-gold-soft"
                : "border-line/60 bg-ink-card/60 text-fg-muted hover:border-gold/40 hover:text-gold-soft",
            )}
            aria-current={chip.active ? "page" : undefined}
          >
            {chip.label}
          </Link>
        ))}
        {(severityParam || statusParam) ? (
          <Link
            href="/exceptions"
            className="text-xs text-fg-muted underline-offset-2 hover:underline"
          >
            Clear filters
          </Link>
        ) : null}
      </nav>

      {/* ── Exceptions table with AI explainer column ── */}
      <section aria-label="Exceptions table" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Raised Exceptions
          </h2>
          <span className="text-xs text-fg-muted">
            {exceptions.length} total
          </span>
        </div>

        <div className="glass-depth overflow-hidden rounded-xl border border-line/60">
          <div className="sticky top-0 z-10 bg-ink-soft/80 p-4 backdrop-blur-sm">
            {isLoading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : isError || exceptions.length === 0 ? (
              <EmptyState
                title={severityParam || statusParam ? "No matching exceptions" : "No exceptions"}
                description={
                  severityParam || statusParam
                    ? `No exceptions match the current filter (${[
                        severityParam && `severity=${severityParam}`,
                        statusParam && `status=${statusParam}`,
                      ].filter(Boolean).join(", ")}).`
                    : "No exceptions have been raised. The institution's reserve corridors are operating within tolerance."
                }
                icon={AlertTriangle}
                action={
                  severityParam || statusParam ? (
                    <Link
                      href="/exceptions"
                      className="text-xs text-gold underline-offset-2 hover:underline"
                    >
                      Clear filters
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <Table aria-label="Raised exceptions with AI-assisted analysis">
                <caption className="sr-only">
                  {`Exception Management Board — ${exceptions.length} exceptions`}
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
                  {exceptions.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-gold">
                          {e.id}
                        </span>
                        <p className="mt-0.5 max-w-[28rem] truncate text-xs text-fg-muted">
                          {e.reason}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs text-fg-muted">
                            {e.caseId}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/evidence?caseId=${encodeURIComponent(e.caseId)}`}
                              className="inline-flex items-center gap-1 text-[11px] text-gold underline-offset-2 hover:underline"
                            >
                              <FileSearch className="h-3 w-3" aria-hidden="true" />
                              View Evidence
                            </Link>
                            <Link
                              href={`/timeline?caseId=${encodeURIComponent(e.caseId)}`}
                              className="inline-flex items-center gap-1 text-[11px] text-gold underline-offset-2 hover:underline"
                            >
                              <History className="h-3 w-3" aria-hidden="true" />
                              View Timeline
                            </Link>
                          </div>
                        </div>
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
                            severityTone(e.severity),
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
                            statusTone(e.status),
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
            )}
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
