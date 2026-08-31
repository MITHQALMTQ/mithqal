"use client";

/* ============================================================
 * CommercialTransparency — Chapter XX §XX.10 (Task 14-a)
 * ------------------------------------------------------------
 * Public-facing commercial transparency disclosure.
 *
 * Layout:
 *   §1  Header
 *   §2  Revenue Sources — transparent breakdown by entity + category
 *   §3  Fee Schedule — mint 5bps, redeem 5bps, transfer 1bp
 *   §4  Commercial Principles — 6-card grid (no hidden fees, etc.)
 *   §5  Performance Participation policy — 60/25/15 split
 *   §6  Conflict of Interest Policy
 *   §7  No Hidden Fees Policy
 *   §8  Audit History — recent immutable audit entries
 *
 * Theming: institutional palette only — NO indigo/blue.
 *
 * Task ID: 14-a  ·  Agent: Chief Enterprise Software Engineer
 * ============================================================ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Scale,
  Gavel,
  Lock,
  Coins,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Fingerprint,
  TrendingUp,
  FileCheck,
  Handshake,
  Ban,
  AlertCircle,
  Loader2,
  RefreshCw,
  CircleDollarSign,
  Receipt,
  Building2,
  Cog,
  Briefcase,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

/* ---------- shared local helpers ---------- */

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-gold">
      <span className="h-px w-8 bg-gold/60" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
        {children}
      </span>
    </div>
  );
}

const fmtUsd = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(2)}K`
      : `$${n.toFixed(2)}`;

const fmtUsdFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/* ---------- types ---------- */

type EntityId = "foundation" | "holding" | "operations" | "markets";

interface RevenueSummary {
  totalUsd: number;
  byEntity: Record<EntityId, number>;
  byCategory: Record<string, number>;
  entryCount: number;
}

interface AuditEntry {
  auditId: string;
  timestamp: string;
  entity: EntityId;
  approver: string;
  transactionRef: string;
  revenueAmount: number;
  complianceResult: boolean;
  complianceScore: number;
  digitalSignature: string;
}

interface TransparencyState {
  ok: boolean;
  revenueSummary: RevenueSummary;
  auditEntries: AuditEntry[];
}

/* ---------- static disclosure data ---------- */

interface FeeItem {
  operation: string;
  rate: string;
  cap: string;
  description: string;
  icon: typeof Coins;
}

const FEE_SCHEDULE: FeeItem[] = [
  {
    operation: "Mint",
    rate: "5 bps",
    cap: "$5,000",
    description: "Charged when fiat is converted to MTQ. Capped to protect large mints.",
    icon: Coins,
  },
  {
    operation: "Redeem",
    rate: "5 bps",
    cap: "$5,000",
    description: "Charged when MTQ is converted back to fiat. Capped symmetrically.",
    icon: Receipt,
  },
  {
    operation: "Transfer",
    rate: "1 bp",
    cap: "No cap",
    description: "On-chain transfer fee. Minimal — covers gas + settlement overhead.",
    icon: ArrowRight,
  },
];

interface Principle {
  title: string;
  description: string;
  icon: typeof ShieldCheck;
}

const PRINCIPLES: Principle[] = [
  {
    title: "No Hidden Fees",
    description:
      "Every fee is published in the schedule above. No spread, no commission, no rebate is ever collected without disclosure.",
    icon: EyeOff,
  },
  {
    title: "No Front Running",
    description:
      "All reserve-procurement trades are executed before any market impact from the mint/redeem that triggered them.",
    icon: Ban,
  },
  {
    title: "No Benchmark Manipation",
    description:
      "The Constitutional Benchmark Price uses a weighted-median consensus across 5 source types, resistant to single-source manipulation.",
    icon: Scale,
  },
  {
    title: "No Reserve Ownership Violation",
    description:
      "Reserve assets are owned ONLY by the Markets entity on behalf of the Institution. Never by Holding, Operations, employees, or directors.",
    icon: Lock,
  },
  {
    title: "No Conflict of Interest",
    description:
      "The Operations entity may not act as a dealer in its own procurement. Dealer and operator roles are constitutionally separated.",
    icon: Handshake,
  },
  {
    title: "Immutable Audit Trail",
    description:
      "Every commercial transaction with revenue impact is signed with HMAC-SHA256 and recorded in an insert-only ledger. Insert-only — no edits, no deletes.",
    icon: Fingerprint,
  },
];

const ENTITY_ICON: Record<EntityId, typeof Crown> = {
  foundation: Crown,
  holding: Building2,
  operations: Cog,
  markets: Briefcase,
};

const ENTITY_LABEL: Record<EntityId, string> = {
  foundation: "Foundation",
  holding: "Holding",
  operations: "Operations",
  markets: "Markets",
};

/* ============================================================
 * Main component
 * ============================================================ */

export function CommercialTransparency() {
  const [state, setState] = useState<TransparencyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial-governance", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as TransparencyState & { ok: boolean };
      if (!json.ok) throw new Error("API returned ok=false");
      setState({
        ok: true,
        revenueSummary: json.revenueSummary,
        auditEntries: json.auditEntries,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const recentAudits = state?.auditEntries.slice(0, 8) ?? [];

  return (
    <section
      id="commercial-transparency"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="ct-heading"
    >
      <Reveal>
        <Eyebrow>Chapter XX · §XX.10 Commercial Transparency</Eyebrow>
        <h2
          id="ct-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Commercial Transparency
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-fg-muted sm:text-base">
          The Mithqal Institution publishes every commercial term, every fee,
          every revenue source, and every audit entry. There are no hidden
          spreads, no undisclosed rebates, no off-ledger transactions. This is
          the constitutional standard.
        </p>
      </Reveal>

      {/* ---- §2 Revenue Sources ---- */}
      <Reveal delay={0.1}>
        <Card className="mt-8 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="h-4 w-4 text-gold" aria-hidden="true" />
              Revenue Sources — Transparent Breakdown
            </CardTitle>
            <CardDescription>
              {state
                ? `${state.revenueSummary.entryCount} entries · total ${fmtUsdFull(state.revenueSummary.totalUsd)}`
                : "Loading…"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-fg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-gold" aria-hidden="true" />
                Loading revenue sources…
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 py-8 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}
                <button
                  onClick={fetchData}
                  className="ml-2 inline-flex items-center gap-1 rounded-md border border-line bg-ink-card px-2 py-1 text-xs hover:text-gold"
                >
                  <RefreshCw className="h-3 w-3" /> Retry
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(Object.keys(ENTITY_LABEL) as EntityId[]).map((e) => {
                  const value = state?.revenueSummary.byEntity[e] ?? 0;
                  const Icon = ENTITY_ICON[e];
                  const pct = state && state.revenueSummary.totalUsd > 0
                    ? (value / state.revenueSummary.totalUsd) * 100
                    : 0;
                  return (
                    <div
                      key={e}
                      className="rounded-lg border border-line bg-ink-soft/40 p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          {ENTITY_LABEL[e]}
                        </span>
                      </div>
                      <div className="mt-2 font-mono text-xl font-semibold tabular-nums text-foreground">
                        {fmtUsd(value)}
                      </div>
                      <div className="mt-1 text-[10px] uppercase tracking-wider text-fg-muted">
                        {pct.toFixed(1)}% of total
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §3 Fee Schedule ---- */}
      <Reveal delay={0.15}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-gold" aria-hidden="true" />
              Fee Schedule
            </CardTitle>
            <CardDescription>
              Published fees for every commercial operation. No other fees
              exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FEE_SCHEDULE.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.operation}
                    className="rounded-lg border border-gold/30 bg-gold/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                        <span className="text-sm font-semibold text-foreground">
                          {f.operation}
                        </span>
                      </div>
                      <Badge className="border-gold/40 bg-gold/10 text-gold">
                        {f.rate}
                      </Badge>
                    </div>
                    <div className="mt-2 text-[11px] uppercase tracking-wider text-fg-muted">
                      Cap: <span className="text-foreground">{f.cap}</span>
                    </div>
                    <p className="mt-2 text-xs leading-snug text-fg-muted">
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §4 Commercial Principles ---- */}
      <Reveal delay={0.2}>
        <div className="mt-8">
          <h3 className="font-display text-xl font-semibold text-foreground">
            Commercial Principles
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            Six constitutional principles govern every commercial action.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 0.05}>
                  <Card className="h-full bg-ink-card/60">
                    <CardContent className="px-5 py-5">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg border border-gold/30 bg-gold/5 p-2">
                          <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {p.title}
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-fg-muted">
                        {p.description}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ---- §5 Performance Participation Policy ---- */}
      <Reveal delay={0.25}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-gold" aria-hidden="true" />
              Performance Participation Policy
            </CardTitle>
            <CardDescription>
              When the Markets entity procures reserves below the constitutional
              benchmark price, the savings are split per the constitution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-6 overflow-hidden rounded-lg border border-line">
              <div className="flex items-center justify-center bg-reserve text-[10px] font-bold uppercase tracking-wider text-ink" style={{ width: "60%" }}>
                60% Reserve
              </div>
              <div className="flex items-center justify-center bg-gold text-[10px] font-bold uppercase tracking-wider text-ink" style={{ width: "25%" }}>
                25% Markets
              </div>
              <div className="flex items-center justify-center bg-gold-deep text-[10px] font-bold uppercase tracking-wider text-ink" style={{ width: "15%" }}>
                15% Comm.
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-reserve/30 bg-reserve/5 p-3">
                <div className="flex items-center gap-2 text-reserve">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Reserve Growth · 60%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">
                  Constitutional priority — strengthens the reserve backing
                  every MTQ in circulation.
                </p>
              </div>
              <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
                <div className="flex items-center gap-2 text-gold">
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Markets Ltd · 25%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">
                  Performance reward for the Markets entity that executed below
                  benchmark.
                </p>
              </div>
              <div className="rounded-lg border border-gold-deep/30 bg-gold-deep/5 p-3">
                <div className="flex items-center gap-2 text-gold-deep">
                  <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Commercial · 15%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-fg-muted">
                  Operations + Holding revenue — funds the platform and
                  strategic growth.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §6 + §7 Conflict of Interest & No Hidden Fees ---- */}
      <Reveal delay={0.3}>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="bg-ink-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Handshake className="h-4 w-4 text-gold" aria-hidden="true" />
                Conflict of Interest Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "Operations entity may NOT act as dealer in its own procurement.",
                  "Holding Company may NOT hold reserves (only Markets may, on behalf of the Institution).",
                  "Foundation does NOT engage in commercial revenue activities.",
                  "No employee, director, or owner may hold reserve assets in their own name.",
                  "All dealer selections must pass the 12-criteria Best Execution matrix.",
                  "All procurement must be approved by the Markets Committee + Risk Committee.",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reserve" aria-hidden="true" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-ink-card/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <EyeOff className="h-4 w-4 text-gold" aria-hidden="true" />
                No Hidden Fees Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  "All fees are published in the schedule above — no exceptions.",
                  "No spread between benchmark and execution is ever retained undisclosed.",
                  "All commissions are declared pre-trade and verified post-trade.",
                  "All rebates from dealers are disclosed and routed to the Institution.",
                  "Any fee discrepancy is flagged in the compliance check (rule 2).",
                  "The audit trail (HMAC-signed) records every fee event in an insert-only audit trail.",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reserve" aria-hidden="true" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </Reveal>

      {/* ---- §8 Audit History ---- */}
      <Reveal delay={0.35}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Fingerprint className="h-4 w-4 text-gold" aria-hidden="true" />
              Audit History — Recent Immutable Entries
            </CardTitle>
            <CardDescription>
              HMAC-SHA256 signed · insert-only · {recentAudits.length} of{" "}
              {state?.auditEntries.length ?? 0} entries shown
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-line">
                  <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                    Audit ID
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                    Entity
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                    Approver
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider text-fg-muted">
                    Revenue
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                    Compliance
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                    Signature
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAudits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-fg-muted">
                      No audit entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentAudits.map((e) => (
                    <TableRow key={e.auditId} className="border-line">
                      <TableCell className="font-mono text-xs text-foreground">
                        {e.auditId}
                      </TableCell>
                      <TableCell>
                        <Badge className="border-line bg-ink-soft capitalize text-fg-muted">
                          {e.entity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground">{e.approver}</TableCell>
                      <TableCell className="text-right font-mono text-xs tabular-nums text-foreground">
                        {fmtUsdFull(e.revenueAmount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {e.complianceResult ? (
                            <CheckCircle2 className="h-3 w-3 text-reserve" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
                          )}
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {e.complianceScore.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-gold">
                        {e.digitalSignature.slice(0, 16)}…
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.4}>
        <p className="mt-8 text-center text-xs text-fg-muted">
          Constitutional reference:{" "}
          <code className="rounded bg-ink-soft px-1.5 py-0.5 text-gold">§XX.10</code>{" "}
          · Audit signature algorithm:{" "}
          <code className="rounded bg-ink-soft px-1.5 py-0.5 text-gold">HMAC-SHA256</code>
        </p>
      </Reveal>
    </section>
  );
}
