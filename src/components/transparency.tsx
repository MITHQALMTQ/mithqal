"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Banknote,
  TrendingUp,
  Layers,
  Hash,
  Check,
  CircleDollarSign,
  Activity,
  Lock,
  ArrowRight,
  Boxes,
  Users,
  Eye,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/logo";

interface TierState {
  tier: string;
  name: string;
  targetWeight: number;
  assets: string;
  usdValue: number;
  sharePct: number;
  price: number;
}

interface RecentOp {
  type: "mint" | "redeem";
  participant: string;
  amountUsd: number;
  mtq: number;
  reserveRatio: number;
  porHash: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

interface TransparencyState {
  testnet: {
    supply: number;
    reserveValue: number;
    nav: number;
    reserveRatio: number;
    mintingPaused: boolean;
    porHash: string;
    lastUpdate: string;
    operationCount: number;
    tiers: TierState[];
    recentOperations: RecentOp[];
  };
  formation: {
    submissionCount: number;
    milestones: Milestone[];
  };
  generatedAt: string;
}

const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtUsd2 = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMtq = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " MTQ";
const fmtPct = (n: number) => n.toFixed(2) + "%";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return Math.max(1, Math.round(diff / 1000)) + "s ago";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h ago";
  return Math.round(diff / 86_400_000) + "d ago";
}

const Reveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 text-gold">
    <span className="h-px w-8 bg-gold/60" />
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">{children}</span>
  </div>
);

const CADENCE = [
  { cadence: "Real-time", item: "Testnet state", desc: "Supply, reserves, NAV, PoR hash" },
  { cadence: "Daily", item: "Proof of Reserves", desc: "Cryptographic solvency proof" },
  { cadence: "Quarterly", item: "Independent audit", desc: "Full reserve verification" },
  { cadence: "Annual", item: "Comprehensive report", desc: "Complete reserve review" },
  { cadence: "5 years", item: "Constitutional review", desc: "9-expert independent panel" },
];

export default function TransparencyDashboard() {
  const [state, setState] = useState<TransparencyState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/transparency", { cache: "no-store" });
      const data = (await res.json()) as TransparencyState & { error?: string };
      if (!res.ok) throw new Error(data.error || "load failed");
      setState(data);
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    // Auto-refresh every 30s — live state.
    const id = setInterval(fetchState, 30_000);
    return () => clearInterval(id);
  }, [fetchState]);

  const ratioTone: string =
    state && state.testnet.reserveRatio < 100
      ? "text-destructive"
      : state && state.testnet.reserveRatio < 105
        ? "text-gold"
        : "text-reserve";

  const doneMilestones = state?.formation.milestones.filter((m) => m.done).length ?? 0;
  const totalMilestones = state?.formation.milestones.length ?? 0;
  const progressPct = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="grain-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_12%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <Reveal>
            <div className="flex items-center gap-2">
              <Badge className="border-reserve/40 bg-reserve/10 text-reserve hover:bg-reserve/10">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-reserve" />
                Live · build in public
              </Badge>
              <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
                Auto-refresh 30s
              </Badge>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 flex items-center gap-4">
              <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
              <div>
                <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
                  <span className="gold-text">Transparency</span>
                </h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">
                  Verifiable operations. No claim rests on assertion.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
              The Constitution demands trust earned through verifiable operations. This page
              surfaces the Institution&apos;s live state in real time — every MTQ minted, every
              reserve tier, every proof of reserves, and the formation progress. Anyone can audit
              it. That is the point.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        {/* Live KPIs */}
        <Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {loading || !state ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-xl" />
              ))
            ) : (
              <>
                <Kpi icon={Boxes} label="Supply" value={fmtMtq(state.testnet.supply)} sub="MTQ in circulation" />
                <Kpi icon={Banknote} label="Reserve Value" value={fmtUsd(state.testnet.reserveValue)} sub="Across 4 tiers" />
                <Kpi icon={TrendingUp} label="NAV" value={fmtUsd2(state.testnet.nav)} sub="Per MTQ (USD)" />
                <Kpi icon={Shield} label="Reserve Ratio" value={fmtPct(state.testnet.reserveRatio)} sub={state.testnet.mintingPaused ? "Minting paused" : "Above 100% floor"} tone={ratioTone} />
              </>
            )}
          </div>
        </Reveal>

        {/* Proof of Reserves + op count */}
        <Reveal>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] to-ink-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 text-gold">
                <Hash className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Proof of Reserves · current
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <code className="font-mono text-lg text-gold sm:text-xl">
                    {loading || !state ? "…" : state.testnet.porHash}
                  </code>
                  <p className="mt-2 max-w-md text-sm text-fg-muted">
                    Reproducible from the public mint/redeem ledger. Reserve ratio always ≥ 100%
                    by constitutional invariant.
                  </p>
                </div>
                <div className="shrink-0 rounded-lg border border-line bg-ink px-4 py-3 text-center">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    Operations
                  </div>
                  <div className="font-display mt-1 text-2xl text-foreground">
                    {loading || !state ? "…" : state.testnet.operationCount}
                  </div>
                  <div className="mt-1 text-[10px] text-fg-muted">
                    {loading || !state ? "" : "updated " + timeAgo(state.testnet.lastUpdate)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-ink-soft p-6">
              <div className="flex items-center gap-2 text-gold">
                <Users className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Formation Committee
                </span>
              </div>
              <div className="font-display mt-4 text-4xl text-gold">
                {loading || !state ? "…" : state.formation.submissionCount}
              </div>
              <p className="mt-2 text-sm text-fg-muted">
                parties have expressed interest. Identities remain private until the Formation
                Committee convenes.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Reserve composition */}
        <Reveal>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Reserve composition
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading || !state
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] rounded-xl" />
                  ))
                : state.testnet.tiers.map((t) => {
                    const targetPct = t.targetWeight * 100;
                    const drift = t.price - 1;
                    return (
                      <div key={t.tier} className="rounded-xl border border-line bg-ink-soft p-5">
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base text-gold">{t.tier}</span>
                          <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                            target {targetPct}%
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                          {t.name}
                        </div>
                        <div className="mt-3 text-sm font-medium text-foreground">{fmtUsd(t.usdValue)}</div>
                        <div className="mt-1 text-xs text-fg-muted">{t.assets}</div>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] text-fg-muted">
                            <span>share {t.sharePct.toFixed(1)}%</span>
                            <span className={drift >= 0 ? "text-reserve" : "text-destructive"}>
                              price {drift >= 0 ? "+" : ""}
                              {(drift * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold"
                              style={{ width: `${Math.min(100, t.sharePct)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </Reveal>

        {/* Recent operations — the public audit trail */}
        <Reveal>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gold" />
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Recent operations
              </h2>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              The last 8 mint/redeem operations. Every state claim above is reproducible from
              this public ledger.
            </p>
            <div className="mt-4 max-h-72 overflow-y-auto overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="sticky top-0 bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Time</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Participant</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 text-right font-semibold">MTQ</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading || !state ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : state.testnet.recentOperations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-fg-muted">
                        No operations yet.
                      </td>
                    </tr>
                  ) : (
                    state.testnet.recentOperations.map((op, i) => (
                      <tr key={i} className="hover:bg-ink-card/60">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-fg-muted">
                          {timeAgo(op.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {op.type === "mint" ? (
                            <Badge className="border-reserve/40 bg-reserve/15 text-[10px] text-reserve hover:bg-reserve/15">
                              mint
                            </Badge>
                          ) : (
                            <Badge className="border-gold/40 bg-gold/15 text-[10px] text-gold hover:bg-gold/15">
                              redeem
                            </Badge>
                          )}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-3 text-foreground" title={op.participant}>
                          {op.participant}
                        </td>
                        <td className="px-4 py-3 text-right text-fg-muted">{fmtUsd(op.amountUsd)}</td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {op.mtq.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-fg-muted">{fmtPct(op.reserveRatio)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Formation progress */}
        <Reveal>
          <div className="mt-6 rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-gold">
                  <CircleDollarSign className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    Formation progress
                  </span>
                </div>
                <h2 className="font-display mt-3 text-xl text-foreground sm:text-2xl">
                  From blueprint to live settlement rail
                </h2>
                <p className="mt-2 text-sm text-fg-muted">
                  {doneMilestones} of {totalMilestones} milestones complete ({progressPct}%).
                  Public by design — the Constitution outlives opacity.
                </p>
              </div>
              <div className="shrink-0">
                <div className="relative h-20 w-20">
                  <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--ink-card)" strokeWidth="6" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(progressPct / 100) * 213.6} 213.6`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-lg text-gold">
                    {progressPct}%
                  </div>
                </div>
              </div>
            </div>
            <Separator className="my-5 bg-line" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {state?.formation.milestones.map((m) => (
                <li
                  key={m.id}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                    m.done
                      ? "border-reserve/30 bg-reserve/[0.06] text-foreground"
                      : "border-line bg-ink-card text-fg-muted"
                  }`}
                >
                  {m.done ? (
                    <Check className="h-4 w-4 shrink-0 text-reserve" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0 text-fg-muted" />
                  )}
                  <span>{m.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Transparency cadence */}
        <Reveal>
          <div className="mt-6 overflow-hidden rounded-2xl border border-line">
            <div className="border-b border-line bg-ink-card px-6 py-3">
              <div className="flex items-center gap-2 text-gold">
                <Eye className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                  Transparency cadence
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x lg:divide-y-0">
              {CADENCE.map((c) => (
                <div key={c.item} className="p-5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {c.cadence}
                  </div>
                  <div className="mt-2 text-sm font-medium text-foreground">{c.item}</div>
                  <div className="mt-1 text-xs text-fg-muted">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Separator className="my-8 bg-line" />
        <div className="flex flex-col gap-3 rounded-xl border border-gold/30 bg-gold/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-gold" />
            <span className="text-fg-muted">
              Testnet simulator — no real value held or transferred. Mechanics mirror the v18
              Constitution. Every figure above is reproducible from the public ledger.
            </span>
          </div>
          <button
            onClick={() => {
              const b = [...document.querySelectorAll("button")].find((b) =>
                b.textContent?.includes("Constitution")
              );
              b?.click();
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
          >
            Read the Constitution <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "text-foreground",
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`font-display mt-2 text-2xl sm:text-3xl ${tone}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-muted">{sub}</div> : null}
    </div>
  );
}
