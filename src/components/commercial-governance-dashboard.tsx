"use client";

/* ============================================================
 * CommercialGovernanceDashboard — Chapter XX (Task 14-a)
 * ------------------------------------------------------------
 * Mounts the consolidated commercial-governance picture for MTQ.
 * Surfaces the 4 constitutional entities, revenue sources, reserve
 * ownership, procurement status, best execution, performance
 * participation, compliance scores, and the immutable audit trail.
 *
 * Layout (tabbed):
 *   §1  Header + 3 headline scores (compliance / trust / transparency)
 *   §2  Tabbed deck:
 *        • Entities           — 4 legal-entity cards
 *        • Revenue            — by entity + by category + recent entries
 *        • Reserve Ownership  — table with verification badges
 *        • Procurement        — recent 12-stage workflow records
 *        • Best Execution     — 12-criteria weighted matrix
 *        • Performance        — 60/25/15 savings split
 *        • Compliance         — 7-rule compliance check display
 *        • Audit              — immutable audit entries with HMAC sigs
 *
 * Theming:
 *   Institutional palette only — NO indigo/blue.
 *   Green (--reserve) = verified, amber = monitored, red = violation,
 *   gold = highlight.
 *
 * Task ID: 14-a  ·  Agent: Chief Enterprise Software Engineer
 * ============================================================ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Landmark,
  Building2,
  Cog,
  Briefcase,
  Coins,
  Scale,
  FileCheck,
  Lock,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Fingerprint,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Boxes,
  Crown,
  Gavel,
  Layers,
  Loader2,
  RefreshCw,
  Hash,
  CircleDollarSign,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

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

const fmtSig = (sig: string) =>
  sig.length > 24 ? `${sig.slice(0, 12)}…${sig.slice(-12)}` : sig;

/* ---------- types (mirror the API response) ---------- */

type EntityId = "foundation" | "holding" | "operations" | "markets";

interface ConstitutionalEntity {
  id: EntityId;
  name: string;
  shortName: string;
  type: "non-profit" | "for-profit" | "operational" | "commercial";
  responsibilities: string[];
  governanceAuthority: string;
  reserveOwnership: boolean;
  constitutionalArticle: string;
}

interface ProcurementStageEntry {
  stage: string;
  timestamp: string;
  status: "pending" | "completed";
  data?: string;
}

interface ProcurementRecord {
  id: string;
  asset: "gold" | "silver" | "sovereign" | "stablecoin" | "sukuk";
  amountUsd: number;
  quantity: number;
  currentStage: string;
  stageHistory: ProcurementStageEntry[];
  dealer?: string;
  executionPrice?: number;
  savings?: number;
  auditId?: string;
  createdAt: string;
  completedAt?: string;
}

interface RevenueSummary {
  totalUsd: number;
  byEntity: Record<EntityId, number>;
  byCategory: Record<string, number>;
  entryCount: number;
}

interface CommercialAuditEntry {
  auditId: string;
  timestamp: string;
  entity: EntityId;
  approver: string;
  transactionRef: string;
  revenueAmount: number;
  benefitDistribution: { reserve: number; markets: number; commercial: number };
  complianceResult: boolean;
  complianceScore: number;
  digitalSignature: string;
}

interface ReserveOwnershipRecord {
  assetClass: string;
  ownerEntity: EntityId;
  custodian: string;
  amount: number;
  valueUsd: number;
  verified: boolean;
  lastVerifiedAt: string;
}

interface GovernanceState {
  ok: boolean;
  entities: ConstitutionalEntity[];
  procurementRecords: ProcurementRecord[];
  revenueSummary: RevenueSummary;
  auditEntries: CommercialAuditEntry[];
  reserveOwnership: ReserveOwnershipRecord[];
  reserveOwnershipValid: boolean;
  reserveOwnershipViolations: string[];
  complianceScore: number;
  institutionalTrustScore: number;
  transparencyScore: number;
  timestamp: string;
}

/* ---------- entity icon mapping ---------- */

const ENTITY_ICON: Record<EntityId, typeof Landmark> = {
  foundation: Crown,
  holding: Building2,
  operations: Cog,
  markets: Briefcase,
};

const ENTITY_ACCENT: Record<EntityId, string> = {
  foundation: "text-gold border-gold/30",
  holding: "text-reserve border-reserve/30",
  operations: "text-fg-muted border-line",
  markets: "text-gold-deep border-gold-deep/30",
};

const ENTITY_LABEL: Record<EntityId, string> = {
  foundation: "Foundation",
  holding: "Holding",
  operations: "Operations",
  markets: "Markets",
};

// All four constitutional entities are PLANNED — see docs/legal/institutional-principles.md.
// The current operating entity is JOZOUR LLC (NJ). Entity cards render a
// visible "PLANNED" badge next to each entity name (see EntitiesTab).

/* ---------- 12 procurement stages (mirrors engine) ---------- */

const PROCUREMENT_STAGES = [
  "reserve_need",
  "risk_assessment",
  "benchmark",
  "rfq",
  "dealer_responses",
  "best_execution",
  "approval",
  "settlement",
  "custody_verification",
  "proof_of_reserve",
  "commercial_audit",
  "archive",
] as const;

const STAGE_LABEL: Record<string, string> = {
  reserve_need: "Reserve Need",
  risk_assessment: "Risk Assessment",
  benchmark: "Benchmark",
  rfq: "RFQ",
  dealer_responses: "Dealer Responses",
  best_execution: "Best Execution",
  approval: "Approval",
  settlement: "Settlement",
  custody_verification: "Custody Verify",
  proof_of_reserve: "Proof of Reserve",
  commercial_audit: "Audit",
  archive: "Archive",
};

/* ============================================================
 * Main component
 * ============================================================ */

export function CommercialGovernanceDashboard() {
  const [state, setState] = useState<GovernanceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commercial-governance", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GovernanceState;
      if (!json.ok) throw new Error("API returned ok=false");
      setState(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <section
      id="commercial-governance"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="cg-heading"
    >
      <Reveal>
        <Eyebrow>Chapter XX · Constitutional Commercial Governance</Eyebrow>
        <h2
          id="cg-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Commercial Governance Dashboard
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-fg-muted sm:text-base">
          The Mithqal Institution operates under a four-entity constitutional
          legal structure with a 12-stage procurement workflow, weighted-median
          benchmark pricing, 12-criteria best-execution scoring, immutable
          audit trails, and a 60/25/15 performance-participation split that
          prioritises reserve growth above all else.
        </p>

        {/* TARGET-architecture notice — required by docs/legal/institutional-principles.md */}
        <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
          <strong className="font-semibold">TARGET architecture.</strong>{" "}
          The four constitutional entities below (Foundation, Holding,
          Operations, Markets) are PLANNED. Currently, MITHQAL is operated by{" "}
          <strong>JOZOUR LLC</strong> (New Jersey). Planned entities do not
          yet exist and are not currently operating.
        </div>
      </Reveal>

      {/* ---- Headline scores ---- */}
      <Reveal delay={0.1}>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ScoreCard
            label="Commercial Compliance"
            value={state ? fmtPct(state.complianceScore) : "—"}
            caption="7-rule constitutional check"
            icon={ShieldCheck}
            accent={state ? (state.complianceScore >= 100 ? "reserve" : "amber") : "amber"}
          />
          <ScoreCard
            label="Institutional Trust"
            value={state ? fmtPct(state.institutionalTrustScore) : "—"}
            caption="Compliance-weighted trust score"
            icon={Scale}
            accent="gold"
          />
          <ScoreCard
            label="Transparency"
            value={state ? fmtPct(state.transparencyScore) : "—"}
            caption={
              state
                ? state.reserveOwnershipValid
                  ? "Reserve ownership verified"
                  : `${state.reserveOwnershipViolations.length} violation(s)`
                : "Reserve ownership verification"
            }
            icon={Eye}
            accent={state ? (state.reserveOwnershipValid ? "reserve" : "rose") : "amber"}
          />
        </div>
      </Reveal>

      {/* ---- Loading / error / tabbed deck ---- */}
      <Reveal delay={0.2}>
        <div className="mt-8">
          {loading && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-line bg-ink-card/50 p-12 text-fg-muted">
              <Loader2 className="h-5 w-5 animate-spin text-gold" aria-hidden="true" />
              <span className="text-sm">Loading commercial governance state…</span>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-sm">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">Could not load commercial governance state.</span>
              </div>
              <code className="rounded bg-ink-soft px-2 py-1 text-xs text-fg-muted">{error}</code>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-ink-card px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-gold/50 hover:text-gold"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
              </button>
            </div>
          )}
          {state && !loading && (
            <Tabs defaultValue="entities" className="w-full">
              <TabsList className="bg-ink-card h-auto flex-wrap gap-1 rounded-xl border border-line p-1.5">
                <TabsTrigger value="entities" className="gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Entities
                </TabsTrigger>
                <TabsTrigger value="revenue" className="gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5" /> Revenue
                </TabsTrigger>
                <TabsTrigger value="reserve" className="gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Reserve
                </TabsTrigger>
                <TabsTrigger value="procurement" className="gap-1.5">
                  <Boxes className="h-3.5 w-3.5" /> Procurement
                </TabsTrigger>
                <TabsTrigger value="execution" className="gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Execution
                </TabsTrigger>
                <TabsTrigger value="performance" className="gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" /> Performance
                </TabsTrigger>
                <TabsTrigger value="compliance" className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Compliance
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" /> Audit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="entities" className="mt-6">
                <EntitiesTab entities={state.entities} />
              </TabsContent>
              <TabsContent value="revenue" className="mt-6">
                <RevenueTab summary={state.revenueSummary} />
              </TabsContent>
              <TabsContent value="reserve" className="mt-6">
                <ReserveTab
                  records={state.reserveOwnership}
                  valid={state.reserveOwnershipValid}
                  violations={state.reserveOwnershipViolations}
                />
              </TabsContent>
              <TabsContent value="procurement" className="mt-6">
                <ProcurementTab records={state.procurementRecords} />
              </TabsContent>
              <TabsContent value="execution" className="mt-6">
                <ExecutionTab />
              </TabsContent>
              <TabsContent value="performance" className="mt-6">
                <PerformanceTab />
              </TabsContent>
              <TabsContent value="compliance" className="mt-6">
                <ComplianceTab score={state.complianceScore} auditEntries={state.auditEntries} />
              </TabsContent>
              <TabsContent value="audit" className="mt-6">
                <AuditTab entries={state.auditEntries} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.3}>
        <p className="mt-8 text-center text-xs text-fg-muted">
          Source:{" "}
          <code className="rounded bg-ink-soft px-1.5 py-0.5 text-gold">
            /api/commercial-governance
          </code>{" "}
          · Last updated{" "}
          <span className="tabular-nums">
            {state ? fmtDate(state.timestamp) : "—"}
          </span>
        </p>
      </Reveal>
    </section>
  );
}

/* ============================================================
 * §1 Headline score card
 * ============================================================ */

function ScoreCard({
  label,
  value,
  caption,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof ShieldCheck;
  accent: "reserve" | "gold" | "amber" | "rose";
}) {
  const accentClass =
    accent === "reserve"
      ? "text-reserve"
      : accent === "gold"
        ? "text-gold"
        : accent === "rose"
          ? "text-destructive"
          : "text-amber-500 dark:text-amber-400";
  const borderClass =
    accent === "reserve"
      ? "border-reserve/30"
      : accent === "gold"
        ? "border-gold/30"
        : accent === "rose"
          ? "border-destructive/30"
          : "border-amber-500/30";
  return (
    <Card className={`bg-ink-card/60 ${borderClass}`}>
      <CardContent className="flex items-start gap-4 px-5 py-5">
        <div className={`rounded-lg border ${borderClass} bg-ink-soft/60 p-2.5`}>
          <Icon className={`h-5 w-5 ${accentClass}`} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            {label}
          </div>
          <div className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${accentClass}`}>
            {value}
          </div>
          <div className="mt-0.5 truncate text-xs text-fg-muted">{caption}</div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * §2 Entities tab — 4 legal-entity cards
 * ============================================================ */

function EntitiesTab({ entities }: { entities: ConstitutionalEntity[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {entities.map((e, i) => {
        const Icon = ENTITY_ICON[e.id];
        return (
          <Reveal key={e.id} delay={i * 0.05}>
            <Card className={`h-full bg-ink-card/60 ${ENTITY_ACCENT[e.id]}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg border bg-ink-soft/60 p-2 ${ENTITY_ACCENT[e.id]}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <Badge className="border-line bg-ink-soft text-fg-muted">
                    {e.constitutionalArticle}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-base font-semibold text-foreground">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span>{e.name}</span>
                    <span className="inline-flex items-center rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200">
                      PLANNED
                    </span>
                  </span>
                </CardTitle>
                <CardDescription className="text-xs uppercase tracking-wider text-fg-muted">
                  {e.type.replace("-", " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    Governance
                  </div>
                  <div className="text-xs text-foreground">{e.governanceAuthority}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    Responsibilities
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {e.responsibilities.slice(0, 5).map((r) => (
                      <li key={r} className="flex items-start gap-1.5 text-xs text-foreground">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-reserve" aria-hidden="true" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    Reserve ownership
                  </span>
                  {e.reserveOwnership ? (
                    <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                      <Lock className="h-3 w-3" /> Allowed
                    </Badge>
                  ) : (
                    <Badge className="border-line bg-ink-soft text-fg-muted">
                      <XCircle className="h-3 w-3" /> Prohibited
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ============================================================
 * §3 Revenue tab — by entity + by category
 * ============================================================ */

function RevenueTab({ summary }: { summary: RevenueSummary }) {
  const entities: EntityId[] = ["foundation", "holding", "operations", "markets"];
  const maxEntity = Math.max(1, ...entities.map((e) => summary.byEntity[e] ?? 0));
  const categoryEntries = Object.entries(summary.byCategory)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const maxCategory = Math.max(1, ...categoryEntries.map(([, v]) => v));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="bg-ink-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CircleDollarSign className="h-4 w-4 text-gold" aria-hidden="true" />
            Revenue by Entity
          </CardTitle>
          <CardDescription>
            Total commercial revenue:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {fmtUsdFull(summary.totalUsd)}
            </span>{" "}
            · {summary.entryCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {entities.map((e) => {
            const value = summary.byEntity[e] ?? 0;
            const pct = summary.totalUsd > 0 ? (value / summary.totalUsd) * 100 : 0;
            const Icon = ENTITY_ICON[e];
            return (
              <div key={e} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Icon className="h-3.5 w-3.5 text-fg-muted" aria-hidden="true" />
                    {ENTITY_LABEL[e]}
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {fmtUsdFull(value)}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-ink-soft">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${(value / maxEntity) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                  {pct.toFixed(1)}% of total
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="bg-ink-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-gold" aria-hidden="true" />
            Revenue by Category
          </CardTitle>
          <CardDescription>
            {categoryEntries.length} active revenue streams
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {categoryEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-fg-muted">
                No revenue entries recorded yet.
              </div>
            ) : (
              categoryEntries.map(([cat, v]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium uppercase tracking-wider text-foreground">
                      {cat.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono tabular-nums text-fg-muted">
                      {fmtUsdFull(v)}
                    </span>
                  </div>
                  <div className="relative h-1.5 overflow-hidden rounded-full bg-ink-soft">
                    <div
                      className="h-full rounded-full bg-reserve transition-all"
                      style={{ width: `${(v / maxCategory) * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * §4 Reserve Ownership tab — table + verification badges
 * ============================================================ */

function ReserveTab({
  records,
  valid,
  violations,
}: {
  records: ReserveOwnershipRecord[];
  valid: boolean;
  violations: string[];
}) {
  const totalValue = records.reduce((s, r) => s + r.valueUsd, 0);
  return (
    <div className="space-y-4">
      <Card className={`bg-ink-card/60 ${valid ? "border-reserve/30" : "border-destructive/40"}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" aria-hidden="true" />
              Reserve Ownership Verification
            </span>
            {valid ? (
              <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
                <ShieldAlert className="h-3 w-3" /> Violation
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Total reserve value:{" "}
            <span className="font-mono tabular-nums text-foreground">
              {fmtUsdFull(totalValue)}
            </span>{" "}
            · {records.length} asset classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-line">
                <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                  Asset Class
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                  Owner
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                  Custodian
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-fg-muted">
                  Amount
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider text-fg-muted">
                  Value USD
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-fg-muted">
                  Verified
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-fg-muted">
                    No reserve ownership records.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r, i) => (
                  <TableRow key={`${r.assetClass}-${i}`} className="border-line">
                    <TableCell className="font-medium capitalize text-foreground">
                      {r.assetClass}
                    </TableCell>
                    <TableCell>
                      <Badge className="border-line bg-ink-soft capitalize text-fg-muted">
                        {r.ownerEntity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-foreground">{r.custodian}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {r.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-foreground">
                      {fmtUsdFull(r.valueUsd)}
                    </TableCell>
                    <TableCell>
                      {r.verified ? (
                        <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                          <CheckCircle2 className="h-3 w-3" /> Yes
                        </Badge>
                      ) : (
                        <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
                          <XCircle className="h-3 w-3" /> No
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {!valid && violations.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Constitutional Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {violations.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" aria-hidden="true" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ============================================================
 * §5 Procurement tab — recent 12-stage workflow records
 * ============================================================ */

function ProcurementTab({ records }: { records: ProcurementRecord[] }) {
  return (
    <Card className="bg-ink-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Boxes className="h-4 w-4 text-gold" aria-hidden="true" />
          Procurement Records
        </CardTitle>
        <CardDescription>
          12-stage constitutional workflow · {records.length} recent records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {records.length === 0 ? (
            <div className="py-12 text-center text-sm text-fg-muted">
              No procurement records yet.
            </div>
          ) : (
            records.map((r) => {
              const stageIdx = PROCUREMENT_STAGES.indexOf(
                r.currentStage as (typeof PROCUREMENT_STAGES)[number],
              );
              const pct = ((stageIdx + 1) / PROCUREMENT_STAGES.length) * 100;
              const isComplete = r.currentStage === "archive";
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-line bg-ink-soft/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="border-gold/30 bg-gold/10 capitalize text-gold">
                        {r.asset}
                      </Badge>
                      <span className="font-mono text-xs text-fg-muted">{r.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono tabular-nums text-foreground">
                        {fmtUsd(r.amountUsd)}
                      </span>
                      <span className="text-fg-muted">·</span>
                      <span className="font-mono tabular-nums text-fg-muted">
                        {r.quantity.toLocaleString("en-US", { maximumFractionDigits: 4 })} units
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-fg-muted">
                      <span>
                        Stage {stageIdx + 1} / {PROCUREMENT_STAGES.length}:{" "}
                        <span className="text-foreground">{STAGE_LABEL[r.currentStage] ?? r.currentStage}</span>
                      </span>
                      <span className={isComplete ? "text-reserve" : "text-gold"}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className="mt-1.5 h-1.5 bg-ink-soft"
                    />
                  </div>
                  {r.executionPrice != null && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-fg-muted">
                        Execution:{" "}
                        <span className="font-mono tabular-nums text-foreground">
                          {fmtUsdFull(r.executionPrice)}
                        </span>
                      </span>
                      {r.savings != null && r.savings > 0 && (
                        <span className="flex items-center gap-1 text-reserve">
                          <TrendingDown className="h-3 w-3" aria-hidden="true" />
                          Savings:{" "}
                          <span className="font-mono tabular-nums">{fmtUsdFull(r.savings)}</span>
                        </span>
                      )}
                      {r.dealer && (
                        <span className="text-fg-muted">
                          Dealer: <span className="text-foreground">{r.dealer}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================================================
 * §6 Best Execution tab — 12-criteria weighted matrix
 * ============================================================ */

interface WeightedCriterion {
  criterion: string;
  weight: number;
  description: string;
}

const EXECUTION_CRITERIA: WeightedCriterion[] = [
  { criterion: "Price", weight: 0.25, description: "Execution price vs benchmark" },
  { criterion: "Liquidity", weight: 0.12, description: "Market depth at execution size" },
  { criterion: "Counterparty", weight: 0.10, description: "Dealer creditworthiness" },
  { criterion: "Settlement", weight: 0.08, description: "Settlement reliability + speed" },
  { criterion: "Insurance", weight: 0.05, description: "Transit + custody insurance" },
  { criterion: "Custody", weight: 0.08, description: "Custodian quality + segregation" },
  { criterion: "Country Risk", weight: 0.07, description: "Jurisdictional risk" },
  { criterion: "Sharia Status", weight: 0.10, description: "Constitutional Sharia compliance" },
  { criterion: "Operational Risk", weight: 0.05, description: "Process + systems risk" },
  { criterion: "Diversification", weight: 0.04, description: "Concentration limit" },
  { criterion: "Relationship", weight: 0.03, description: "Dealer relationship score" },
  { criterion: "Historical Perf.", weight: 0.03, description: "Dealer track record" },
];

function ExecutionTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="bg-ink-card/60 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="h-4 w-4 text-gold" aria-hidden="true" />
            12-Criteria Weighted Matrix
          </CardTitle>
          <CardDescription>
            Best-execution score is a weighted sum across 12 criteria. Approval
            threshold: 75 / 100.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {EXECUTION_CRITERIA.map((c) => (
              <div
                key={c.criterion}
                className="flex items-center gap-3 rounded-lg border border-line bg-ink-soft/40 px-3 py-2"
              >
                <div className="w-32 shrink-0">
                  <div className="text-xs font-semibold text-foreground">{c.criterion}</div>
                  <div className="text-[10px] text-fg-muted">{c.description}</div>
                </div>
                <div className="flex-1">
                  <div className="relative h-2 overflow-hidden rounded-full bg-ink-soft">
                    <div
                      className="h-full rounded-full bg-gold transition-all"
                      style={{ width: `${c.weight * 100 * 4}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="w-12 shrink-0 text-right font-mono text-xs tabular-nums text-gold">
                  {(c.weight * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-ink-card/60">
        <CardHeader>
          <CardTitle className="text-base">Rating Tiers</CardTitle>
          <CardDescription>Score → rating → approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { tier: "Excellent", range: "≥ 90", color: "border-reserve/40 bg-reserve/10 text-reserve" },
            { tier: "Good", range: "80 – 89", color: "border-reserve/30 bg-reserve/5 text-reserve" },
            { tier: "Acceptable", range: "75 – 79", color: "border-gold/40 bg-gold/10 text-gold" },
            { tier: "Marginal", range: "65 – 74", color: "border-amber-500/40 bg-amber-500/10 text-amber-500 dark:text-amber-400" },
            { tier: "Unacceptable", range: "< 65", color: "border-destructive/40 bg-destructive/10 text-destructive" },
          ].map((t) => (
            <div
              key={t.tier}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${t.color}`}
            >
              <span className="text-xs font-semibold">{t.tier}</span>
              <span className="font-mono text-xs tabular-nums">{t.range}</span>
            </div>
          ))}
          <div className="mt-3 rounded-lg border border-line bg-ink-soft/60 p-3 text-xs text-fg-muted">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Gavel className="h-3 w-3 text-gold" aria-hidden="true" />
              Constitutional Rule
            </div>
            <p className="mt-1">
              Price carries 25% weight (primary factor). Sharia status carries
              10% (constitutional). No transaction may execute below the
              approval threshold of 75.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * §7 Performance Participation tab — 60/25/15 split
 * ============================================================ */

const PERF_SPLIT = [
  {
    label: "Reserve Growth",
    pct: 60,
    description: "Constitutional priority — strengthens the reserve backing every MTQ.",
    color: "bg-reserve",
    text: "text-reserve",
    icon: Lock,
  },
  {
    label: "Markets Ltd",
    pct: 25,
    description: "Procurement performance reward for the Markets entity.",
    color: "bg-gold",
    text: "text-gold",
    icon: Briefcase,
  },
  {
    label: "Commercial Revenue",
    pct: 15,
    description: "Operations + Holding revenue — funds the platform.",
    color: "bg-gold-deep",
    text: "text-gold-deep",
    icon: CircleDollarSign,
  },
];

function PerformanceTab() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Card className="bg-ink-card/60 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-gold" aria-hidden="true" />
            Performance Participation Split
          </CardTitle>
          <CardDescription>
            Savings (benchmark − execution × quantity) are split per the
            constitution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Stacked horizontal bar */}
          <div className="flex h-8 overflow-hidden rounded-lg border border-line">
            {PERF_SPLIT.map((s) => (
              <div
                key={s.label}
                className={`${s.color} flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-ink`}
                style={{ width: `${s.pct}%` }}
                title={`${s.label}: ${s.pct}%`}
              >
                {s.pct}%
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PERF_SPLIT.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-lg border border-line bg-ink-soft/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${s.text}`} aria-hidden="true" />
                    <span className="text-xs font-semibold text-foreground">{s.label}</span>
                  </div>
                  <div className={`mt-1 font-mono text-xl font-semibold tabular-nums ${s.text}`}>
                    {s.pct}%
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-fg-muted">{s.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-ink-card/60 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Worked Example</CardTitle>
          <CardDescription>
            Benchmark $2,400 / oz · Execution $2,376 / oz · 1,000 oz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-line bg-ink-soft/40 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
              Total savings
            </div>
            <div className="font-mono text-2xl font-semibold tabular-nums text-reserve">
              $24,000
            </div>
            <div className="mt-0.5 text-[11px] text-fg-muted">1.00% performance gain</div>
          </div>
          <div className="space-y-2 text-xs">
            {[
              { label: "Reserve Growth (60%)", value: 14400, color: "text-reserve" },
              { label: "Markets (25%)", value: 6000, color: "text-gold" },
              { label: "Commercial (15%)", value: 3600, color: "text-gold-deep" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-fg-muted">{r.label}</span>
                <span className={`font-mono tabular-nums ${r.color}`}>
                  ${r.value.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * §8 Compliance tab — 7-rule matrix + recent scores
 * ============================================================ */

const COMPLIANCE_RULES = [
  "No hidden spread",
  "No hidden commission",
  "No undisclosed rebate",
  "No front running",
  "No reserve ownership violation",
  "No benchmark manipulation",
  "No conflict of interest",
];

function ComplianceTab({
  score,
  auditEntries,
}: {
  score: number;
  auditEntries: CommercialAuditEntry[];
}) {
  const recent = auditEntries.slice(0, 5);
  const avgScore = auditEntries.length > 0
    ? auditEntries.reduce((s, e) => s + e.complianceScore, 0) / auditEntries.length
    : 100;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="bg-ink-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-gold" aria-hidden="true" />
            7 Constitutional Compliance Rules
          </CardTitle>
          <CardDescription>
            Every commercial transaction is checked against these 7 rules.
            ALL must pass for `overallPassed = true`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {COMPLIANCE_RULES.map((r, i) => (
              <li
                key={r}
                className="flex items-center gap-2 rounded-lg border border-line bg-ink-soft/40 px-3 py-2"
              >
                <span className="font-mono text-xs text-gold tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <CheckCircle2 className="h-3.5 w-3.5 text-reserve" aria-hidden="true" />
                <span className="text-xs text-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-ink-card/60">
        <CardHeader>
          <CardTitle className="text-base">Recent Compliance Scores</CardTitle>
          <CardDescription>
            From {auditEntries.length} immutable audit entries · avg{" "}
            <span className="font-mono tabular-nums text-foreground">
              {avgScore.toFixed(1)}%
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {recent.length === 0 ? (
              <div className="py-8 text-center text-sm text-fg-muted">
                No audit entries yet.
              </div>
            ) : (
              recent.map((e) => (
                <div
                  key={e.auditId}
                  className="rounded-lg border border-line bg-ink-soft/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-fg-muted">{e.auditId}</span>
                    {e.complianceResult ? (
                      <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                        <CheckCircle2 className="h-3 w-3" /> Pass
                      </Badge>
                    ) : (
                      <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
                        <XCircle className="h-3 w-3" /> Fail
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <Progress
                      value={e.complianceScore}
                      className="h-1.5 flex-1 bg-ink-soft"
                    />
                    <span className="font-mono text-xs tabular-nums text-foreground">
                      {e.complianceScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ============================================================
 * §9 Audit tab — immutable entries with HMAC signatures
 * ============================================================ */

function AuditTab({ entries }: { entries: CommercialAuditEntry[] }) {
  return (
    <Card className="bg-ink-card/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Fingerprint className="h-4 w-4 text-gold" aria-hidden="true" />
          Immutable Commercial Audit Trail
        </CardTitle>
        <CardDescription>
          {entries.length} entries · HMAC-SHA256 digital signatures · Insert-only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[32rem] space-y-2 overflow-y-auto pr-1">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-fg-muted">
              No audit entries yet.
            </div>
          ) : (
            entries.map((e) => (
              <div
                key={e.auditId}
                className="rounded-lg border border-line bg-ink-soft/40 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {e.auditId}
                    </span>
                    <Badge className="border-line bg-ink-soft capitalize text-fg-muted">
                      {e.entity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.complianceResult ? (
                      <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
                        <CheckCircle2 className="h-3 w-3" /> Pass
                      </Badge>
                    ) : (
                      <Badge className="border-destructive/40 bg-destructive/10 text-destructive">
                        <XCircle className="h-3 w-3" /> Fail
                      </Badge>
                    )}
                    <span className="font-mono text-xs tabular-nums text-foreground">
                      {e.complianceScore.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">Approver</div>
                    <div className="truncate text-foreground">{e.approver}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">Tx Ref</div>
                    <div className="truncate font-mono text-foreground">{e.transactionRef}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">Revenue</div>
                    <div className="font-mono tabular-nums text-foreground">
                      {fmtUsdFull(e.revenueAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-fg-muted">Timestamp</div>
                    <div className="font-mono tabular-nums text-foreground">
                      {fmtDate(e.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded border border-line bg-ink/60 px-2 py-1">
                  <Fingerprint className="h-3 w-3 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider text-fg-muted">Sig</span>
                  <code className="truncate font-mono text-[11px] text-gold">
                    {fmtSig(e.digitalSignature)}
                  </code>
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-fg-muted">
                  <span>Benefit:</span>
                  <span className="font-mono tabular-nums text-reserve">
                    R {((e.benefitDistribution.reserve ?? 0) * 100).toFixed(0)}%
                  </span>
                  <span className="font-mono tabular-nums text-gold">
                    M {((e.benefitDistribution.markets ?? 0) * 100).toFixed(0)}%
                  </span>
                  <span className="font-mono tabular-nums text-gold-deep">
                    C {((e.benefitDistribution.commercial ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
