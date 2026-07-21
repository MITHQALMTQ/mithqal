"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Banknote,
  TrendingUp,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Hash,
  Boxes,
  RefreshCw,
  Sparkles,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

/* ---- types ---- */

interface TierState {
  tier: string;
  name: string;
  targetWeight: number;
  assets: string;
  usdValue: number;
  sharePct: number;
  price: number;
}

interface Operation {
  id: string;
  type: "mint" | "redeem";
  amountUsd: number;
  mtq: number;
  participant: string;
  nav: number;
  reserveRatio: number;
  porHash: string;
  createdAt: string;
}

interface State {
  supply: number;
  reserveValue: number;
  nav: number;
  reserveRatio: number;
  mintingPaused: boolean;
  porHash: string;
  lastUpdate: string;
  tiers: TierState[];
  operations: Operation[];
}

const REDEMPTION_FEE_BPS = 5;

/* ---- helpers ---- */

const fmtUsd = (n: number) =>
  "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtUsd2 = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMtq = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " MTQ";
const fmtPct = (n: number) => n.toFixed(2) + "%";
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return Math.max(1, Math.round(diff / 1000)) + "s ago";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
  return Math.round(diff / 3_600_000) + "h ago";
};

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
    <span className="text-[11px] font-semibold uppercase tracking-[0.28em]">
      {children}
    </span>
  </div>
);

function Seal({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="gldT" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold-soft)" />
          <stop offset="55%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="57" fill="none" stroke="url(#gldT)" strokeWidth="1.2" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="url(#gldT)" strokeWidth="0.7" opacity="0.6" />
      <text
        x="60"
        y="63"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Georgia, serif"
        fontSize="34"
        fontWeight="600"
        fill="url(#gldT)"
      >
        M
      </text>
    </svg>
  );
}

/* ---- KPI card ---- */

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: typeof Shield;
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn" | "bad";
}) {
  const toneClass =
    tone === "good"
      ? "text-reserve"
      : tone === "warn"
        ? "text-gold"
        : tone === "bad"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
          {label}
        </span>
        <Icon className={`h-4 w-4 ${toneClass}`} />
      </div>
      <div className={`font-display mt-2 text-2xl sm:text-3xl ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-muted">{sub}</div> : null}
    </div>
  );
}

/* ---- page ---- */

export default function TestnetDashboard() {
  const { toast } = useToast();
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [minting, setMinting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [mintAmt, setMintAmt] = useState("1,000,000");
  const [mintParty, setMintParty] = useState("Regional Trade Bank");
  const [redeemAmt, setRedeemAmt] = useState("500,000");
  const [redeemParty, setRedeemParty] = useState("Corporate Treasury");

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/testnet", { cache: "no-store" });
      const data = (await res.json()) as State & { error?: string };
      if (!res.ok) throw new Error(data.error || "load failed");
      setState(data);
    } catch {
      /* keep last state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const seed = async () => {
    try {
      const res = await fetch("/api/testnet/seed", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string; state?: State; seeded?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error || "seed failed");
      if (data.state) setState(data.state);
      toast({
        title: data.seeded ? "Genesis deposit seeded" : "Ledger already seeded",
        description: data.seeded
          ? "$50,000,000 deposited by the Formation Committee → 50,000,000 MTQ minted."
          : "Existing ledger retained.",
      });
    } catch (e) {
      toast({
        title: "Seed failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    }
  };

  const mint = async () => {
    const amountUsd = Number(mintAmt.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive USD amount.", variant: "destructive" });
      return;
    }
    if (!mintParty.trim()) {
      toast({ title: "Participant required", description: "Label the depositing party.", variant: "destructive" });
      return;
    }
    setMinting(true);
    try {
      const res = await fetch("/api/testnet/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd, participant: mintParty.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; state?: State; reserveRatio?: number };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "mint failed");
      }
      if (data.state) setState(data.state);
      toast({
        title: "Mint confirmed",
        description: `Deposited ${fmtUsd(amountUsd)} → minted ${fmtMtq(amountUsd)}. Reserve ratio now ${fmtPct(data.state?.reserveRatio ?? 0)}.`,
      });
    } catch (e) {
      toast({
        title: "Mint blocked",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
    }
  };

  const redeem = async () => {
    const mtq = Number(redeemAmt.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(mtq) || mtq <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive MTQ amount.", variant: "destructive" });
      return;
    }
    if (!redeemParty.trim()) {
      toast({ title: "Participant required", description: "Label the redeeming party.", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch("/api/testnet/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mtq, participant: redeemParty.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; state?: State; netUsd?: number; feeUsd?: number };
      if (!res.ok || !data.ok) throw new Error(data.error || "redeem failed");
      if (data.state) setState(data.state);
      toast({
        title: "Redemption confirmed",
        description: `Burned ${fmtMtq(mtq)} → net ${fmtUsd2(data.netUsd ?? 0)} (fee ${fmtUsd2(data.feeUsd ?? 0)}).`,
      });
    } catch (e) {
      toast({
        title: "Redemption failed",
        description: e instanceof Error ? e.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setRedeeming(false);
    }
  };

  const ratioTone: "good" | "warn" | "bad" =
    state && state.reserveRatio < 100
      ? "bad"
      : state && state.reserveRatio < 105
        ? "warn"
        : "good";

  const isEmpty = !loading && state && state.operations.length === 0;

  return (
    <div className="grain-bg">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-12 pt-12 sm:px-8 sm:pb-16 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_12%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-6xl">
          <Reveal>
            <div className="flex items-center gap-2">
              <Badge className="border-gold/40 bg-gold/10 text-gold hover:bg-gold/10">
                Testnet · Simulated
              </Badge>
              <Badge className="border-line bg-ink-card text-fg-muted hover:bg-ink-card">
                Constitutional mechanics
              </Badge>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <div className="mt-6 flex items-center gap-4">
              <Seal className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
              <div>
                <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
                  <span className="gold-text">MTQ Testnet</span>
                </h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">
                  Live reserve simulator — constitutional mechanics, verifiable on-chain.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">
              Every MTQ is minted only against a verified reserve deposit and burned only on
              redemption. Reserves are never lent. The four-tier basket drifts with the market;
              the 100%+ reserve mandate is enforced by code. This is not a toy — it is the
              settlement loop, simulated.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        {/* KPI strip */}
        <Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {loading || !state ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-xl" />
              ))
            ) : (
              <>
                <Kpi
                  icon={Boxes}
                  label="Supply"
                  value={fmtMtq(state.supply)}
                  sub="MTQ in circulation"
                />
                <Kpi
                  icon={Banknote}
                  label="Reserve Value"
                  value={fmtUsd(state.reserveValue)}
                  sub="Across 4 tiers"
                />
                <Kpi
                  icon={TrendingUp}
                  label="NAV"
                  value={fmtUsd2(state.nav)}
                  sub="Per MTQ (USD)"
                />
                <Kpi
                  icon={Shield}
                  label="Reserve Ratio"
                  value={fmtPct(state.reserveRatio)}
                  sub={state.mintingPaused ? "Minting paused" : "Above 100% floor"}
                  tone={ratioTone}
                />
              </>
            )}
          </div>
        </Reveal>

        {/* Paused / empty warnings */}
        {state?.mintingPaused ? (
          <Reveal>
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <div className="font-semibold text-foreground">Minting paused — reserve ratio below 100%</div>
                <div className="text-fg-muted">
                  The constitutional invariant is enforced. Depositing additional reserves will
                  restore minting. Redemption is never suspended.
                </div>
              </div>
            </div>
          </Reveal>
        ) : null}

        {isEmpty ? (
          <Reveal>
            <div className="mt-4 flex flex-col items-start gap-3 rounded-xl border border-gold/40 bg-gold/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">No genesis deposit yet</div>
                  <div className="text-fg-muted">
                    Seed the Formation Committee&apos;s genesis $50,000,000 deposit to start the simulator.
                  </div>
                </div>
              </div>
              <Button onClick={seed} className="bg-gold text-ink hover:bg-gold-soft">
                Seed genesis deposit
              </Button>
            </div>
          </Reveal>
        ) : null}

        {/* Proof of Reserves */}
        <Reveal>
          <div className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] to-ink-soft p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-gold">
                  <Hash className="h-4 w-4" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                    Proof of Reserves
                  </span>
                </div>
                <p className="mt-2 max-w-xl text-sm text-fg-muted">
                  Every MTQ is fully backed. This hash is reproducible from the public ledger of
                  mint / redeem operations — no claim rests on institutional assertion.
                </p>
              </div>
              <div className="shrink-0 rounded-lg border border-line bg-ink px-4 py-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  Current hash
                </div>
                <code className="mt-1 block font-mono text-sm text-gold">
                  {loading || !state ? "…" : state.porHash}
                </code>
                <div className="mt-1 text-[10px] text-fg-muted">
                  Updated {loading || !state ? "—" : timeAgo(state.lastUpdate)}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Reserve composition */}
        <Reveal>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Reserve composition
              </h2>
              <button
                onClick={fetchState}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-ink-card px-3 py-1.5 text-xs font-medium text-fg-muted transition hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {loading || !state
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[140px] rounded-xl" />
                  ))
                : state.tiers.map((t) => {
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
                        {/* share vs target bar */}
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

        {/* Mint / Redeem simulators */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Mint */}
          <Reveal>
            <div className="print-card h-full rounded-2xl border border-line bg-ink-soft p-6">
              <div className="flex items-center gap-2 text-reserve">
                <ArrowDownToLine className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Mint simulator
                </span>
              </div>
              <h3 className="font-display mt-3 text-lg text-foreground">Deposit reserves → mint MTQ</h3>
              <p className="mt-2 text-sm text-fg-muted">
                Depositing eligible reserves mints MTQ 1:1 at par. Supply grows only against
                verified value — never for operational funding.
              </p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Deposit (USD)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mintAmt}
                    onChange={(e) => setMintAmt(e.target.value)}
                    placeholder="1,000,000"
                    className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Participant
                  </span>
                  <input
                    type="text"
                    value={mintParty}
                    onChange={(e) => setMintParty(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </label>
              </div>
              <Button
                onClick={mint}
                disabled={minting || !!state?.mintingPaused}
                className="mt-4 w-full bg-reserve text-ink hover:bg-reserve/90 disabled:opacity-50"
              >
                {minting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Minting…
                  </>
                ) : state?.mintingPaused ? (
                  <>
                    <Lock className="h-4 w-4" /> Minting paused
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="h-4 w-4" /> Mint MTQ
                  </>
                )}
              </Button>
            </div>
          </Reveal>

          {/* Redeem */}
          <Reveal delay={0.06}>
            <div className="print-card h-full rounded-2xl border border-line bg-ink-soft p-6">
              <div className="flex items-center gap-2 text-gold">
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Redeem simulator
                </span>
              </div>
              <h3 className="font-display mt-3 text-lg text-foreground">Burn MTQ → receive reserves</h3>
              <p className="mt-2 text-sm text-fg-muted">
                Burning MTQ returns proportional reserves. Redemption is{" "}
                <span className="text-gold">never suspended</span>. A {(REDEMPTION_FEE_BPS / 100).toFixed(2)}% fee
                covers operational costs.
              </p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Amount (MTQ)
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={redeemAmt}
                    onChange={(e) => setRedeemAmt(e.target.value)}
                    placeholder="500,000"
                    className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                    Participant
                  </span>
                  <input
                    type="text"
                    value={redeemParty}
                    onChange={(e) => setRedeemParty(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                  />
                </label>
              </div>
              <Button
                onClick={redeem}
                disabled={redeeming}
                className="mt-4 w-full bg-gold text-ink hover:bg-gold-soft disabled:opacity-50"
              >
                {redeeming ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Redeeming…
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="h-4 w-4" /> Redeem
                  </>
                )}
              </Button>
            </div>
          </Reveal>
        </div>

        {/* Operation ledger */}
        <Reveal>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Operation ledger
              </h2>
            </div>
            <p className="mt-1 text-sm text-fg-muted">
              The last 25 operations. Every state claim is reproducible from this ledger.
            </p>
            <div className="mt-4 max-h-96 overflow-y-auto overflow-x-auto rounded-2xl border border-line">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="sticky top-0 bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Time</th>
                    <th className="px-4 py-2.5 font-semibold">Type</th>
                    <th className="px-4 py-2.5 font-semibold">Participant</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-4 py-2.5 text-right font-semibold">MTQ</th>
                    <th className="px-4 py-2.5 text-right font-semibold">NAV</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ratio</th>
                    <th className="px-4 py-2.5 font-semibold">PoR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading || !state ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : state.operations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-fg-muted">
                        No operations yet. Seed the genesis deposit to begin.
                      </td>
                    </tr>
                  ) : (
                    state.operations.map((op) => (
                      <tr key={op.id} className="hover:bg-ink-card/60">
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
                        <td className="px-4 py-3 text-right text-foreground">{op.mtq.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">{fmtUsd2(op.nav)}</td>
                        <td className="px-4 py-3 text-right text-fg-muted">{fmtPct(op.reserveRatio)}</td>
                        <td className="px-4 py-3">
                          <code className="font-mono text-[11px] text-gold/80">{op.porHash.slice(0, 8)}…</code>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Separator className="my-8 bg-line" />
        <p className="text-xs leading-relaxed text-fg-muted">
          Testnet simulator. No real value is held or transferred. Mechanics mirror the Mithqal
          v18 Constitution: 100%+ reserve mandate, no discretionary minting, no redemption
          suspension, a {(REDEMPTION_FEE_BPS / 100).toFixed(2)}% redemption fee, and a four-tier
          diversified reserve basket. Reserve asset prices drift deterministically per operation
          so every state is reproducible from the public ledger.
        </p>
      </div>
    </div>
  );
}
