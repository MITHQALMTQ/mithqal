"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Shield, Banknote, TrendingUp, Layers, Hash, Boxes,
  ArrowDownToLine, ArrowUpFromLine, AlertTriangle, RefreshCw,
  Sparkles, Lock, Activity, Zap, CheckCircle2, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";

/* ---- types ---- */

interface TierState {
  tier: string; name: string; targetWeight: number;
  assets: string; usdValue: number; sharePct: number; price: number;
}
interface Operation {
  id: string; type: "mint" | "redeem"; amountUsd: number; mtq: number;
  participant: string; nav: number; reserveRatio: number; porHash: string;
  createdAt: string;
}
interface ChartPoint {
  index: number; time: string; supply: number; reserveRatio: number; nav: number; type: string;
}
interface State {
  supply: number; reserveValue: number; nav: number; reserveRatio: number;
  mintingPaused: boolean; porHash: string; lastUpdate: string;
  tiers: TierState[]; operations: Operation[]; chartData: ChartPoint[];
}

const REDEMPTION_FEE_BPS = 5;
const TIER_COLORS = ["#c9a227", "#8a6d1a", "#5a8a6e", "#3a5a4e"];

/* ---- helpers ---- */

const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtUsd2 = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMtq = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const fmtPct = (n: number) => n.toFixed(2) + "%";
const fmtCompact = (n: number) => {
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(0);
};
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return Math.max(1, Math.round(diff / 1000)) + "s";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m";
  if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h";
  return Math.round(diff / 86_400_000) + "d";
}

/* ---- animated counter ---- */

function AnimatedNumber({ value, format = (n: number) => n.toFixed(0), className = "" }: {
  value: number; format?: (n: number) => string; className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  useEffect(() => {
    if (value === display) return;
    setAnimating(true);
    const start = display;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else { setDisplay(value); setAnimating(false); }
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <span className={`${className} ${animating ? "count-up" : ""}`}>{format(display)}</span>;
}

/* ---- circular gauge ---- */

function RatioGauge({ ratio }: { ratio: number }) {
  const pct = Math.min(ratio / 110, 1); // scale: 110% = full
  const angle = pct * 270; // 270° arc
  const color = ratio >= 102 ? "var(--reserve)" : ratio >= 100 ? "var(--gold)" : "var(--destructive)";
  const r = 52;
  const cx = 60, cy = 60;
  const startAngle = 135; // bottom-left
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (a: number) => {
    const x = cx + r * Math.cos(rad(a));
    const y = cy + r * Math.sin(rad(a));
    return { x, y };
  };
  const start = arc(startAngle);
  const end = arc(startAngle + angle);
  const largeArc = angle > 180 ? 1 : 0;
  const bgEnd = arc(startAngle + 270);
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--gold)" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      {/* background arc */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
        fill="none" stroke="var(--ink-card)" strokeWidth="8" strokeLinecap="round"
      />
      {/* value arc */}
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        fill="none" stroke="url(#gaugeGrad)" strokeWidth="8" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "all 0.6s ease" }}
      />
      {/* threshold tick at 100% */}
      {(() => {
        const tickAngle = startAngle + (100 / 110) * 270;
        const t1 = arc(tickAngle - 2);
        const t2 = arc(tickAngle + 2);
        return <line x1={t1.x} y1={t1.y} x2={t2.x} y2={t2.y} stroke="var(--fg-muted)" strokeWidth="2" />;
      })()}
      {/* center text */}
      <text x="60" y="58" textAnchor="middle" className="font-display" fontSize="20" fontWeight="700" fill={color}>
        {ratio.toFixed(1)}%
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="8" fill="var(--fg-muted)" letterSpacing="1">
        RESERVE RATIO
      </text>
    </svg>
  );
}

/* ---- KPI card ---- */

function Kpi({ icon: Icon, label, value, sub, tone = "text-foreground", glow = false }: {
  icon: typeof Shield; label: string; value: string; sub?: string;
  tone?: string; glow?: boolean;
}) {
  return (
    <div className={`glass card-hover relative overflow-hidden rounded-xl p-5 ${glow ? "glow-gold" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`font-display mt-2 text-2xl sm:text-3xl ${tone}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-muted">{sub}</div> : null}
    </div>
  );
}

/* ---- main component ---- */

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
    } catch { /* keep last */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 15_000); // auto-refresh 15s
    return () => clearInterval(id);
  }, [fetchState]);

  const seed = async () => {
    try {
      const res = await fetch("/api/testnet/seed", { method: "POST" });
      const data = await res.json();
      if (data.state) setState({ ...data.state, chartData: state?.chartData ?? [] });
      toast({
        title: data.seeded ? "Genesis deposit seeded" : "Ledger already seeded",
        description: data.seeded ? "$50M deposited → 50M MTQ minted." : "Existing ledger retained.",
      });
      fetchState();
    } catch (e) {
      toast({ title: "Seed failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    }
  };

  const mint = async () => {
    const amountUsd = Number(mintAmt.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive USD amount.", variant: "destructive" });
      return;
    }
    setMinting(true);
    try {
      const res = await fetch("/api/testnet/mint", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd, participant: mintParty.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "mint failed");
      if (data.state) setState({ ...data.state, chartData: state?.chartData ?? [] });
      toast({
        title: "Mint confirmed",
        description: `Deposited ${fmtUsd(amountUsd)} → minted ${fmtMtq(data.netDepositUsd ?? amountUsd)} MTQ. Fee: ${fmtUsd2(data.feeUsd ?? 0)}.`,
      });
      fetchState();
    } catch (e) {
      toast({ title: "Mint blocked", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setMinting(false); }
  };

  const redeem = async () => {
    const mtq = Number(redeemAmt.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(mtq) || mtq <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive MTQ amount.", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch("/api/testnet/redeem", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mtq, participant: redeemParty.trim() }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "redeem failed");
      if (data.state) setState({ ...data.state, chartData: state?.chartData ?? [] });
      toast({
        title: "Redemption confirmed",
        description: `Burned ${fmtMtq(mtq)} MTQ → net ${fmtUsd2(data.netUsd ?? 0)} (fee ${fmtUsd2(data.feeUsd ?? 0)}).`,
      });
      fetchState();
    } catch (e) {
      toast({ title: "Redemption failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setRedeeming(false); }
  };

  const ratioTone = state && state.reserveRatio < 100 ? "text-destructive" : state && state.reserveRatio < 105 ? "text-gold" : "text-reserve";
  const isEmpty = !loading && state && state.operations.length === 0;

  const donutData = state?.tiers.map((t) => ({ name: t.tier, value: t.usdValue, label: t.name })) ?? [];

  return (
    <div className="mesh-bg min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--gold)_14%,transparent),transparent_60%)]" />
        <div className="relative mx-auto w-full max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2">
              <Badge className="glass border-gold/40 text-gold hover:bg-gold/10">
                <span className="live-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-reserve" />
                Live · Testnet
              </Badge>
              <Badge className="glass border-line text-fg-muted hover:bg-ink-card">
                Auto-refresh 15s
              </Badge>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Logo className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
              <div>
                <h1 className="font-display text-4xl leading-[0.95] tracking-tight sm:text-6xl">
                  <span className="gold-text glow-text-gold">MTQ Testnet</span>
                </h1>
                <p className="mt-2 font-display text-base text-fg-muted sm:text-xl">
                  Reserve simulator · Constitutional mechanics · Verifiable on-chain
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
        {/* KPI strip with gauge */}
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {loading || !state ? (
            <>
              <Skeleton className="h-[104px] rounded-xl shimmer" />
              <Skeleton className="h-[104px] rounded-xl shimmer" />
              <Skeleton className="h-[104px] rounded-xl shimmer" />
              <Skeleton className="h-[128px] w-[128px] rounded-xl shimmer" />
            </>
          ) : (
            <>
              <Kpi icon={Boxes} label="Supply" value={<AnimatedNumber value={state.supply} format={(n) => fmtMtq(n) + " MTQ"} />} sub="MTQ in circulation" />
              <Kpi icon={Banknote} label="Reserve Value" value={<AnimatedNumber value={state.reserveValue} format={fmtUsd} />} sub="Across 4 tiers" />
              <Kpi icon={TrendingUp} label="NAV" value={<AnimatedNumber value={state.nav} format={fmtUsd2} />} sub="Per MTQ (USD)" />
              <div className="glass flex items-center justify-center rounded-xl p-3">
                <RatioGauge ratio={state.reserveRatio} />
              </div>
            </>
          )}
        </div>

        {/* Paused / empty warnings */}
        {state?.mintingPaused ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass mt-4 flex items-start gap-3 rounded-xl border-destructive/40 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <div className="font-semibold text-foreground">Minting paused — reserve ratio below 100%</div>
                <div className="text-fg-muted">The constitutional invariant is enforced. Deposit additional reserves to restore minting.</div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {isEmpty ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass mt-4 flex flex-col items-start gap-3 rounded-xl border-gold/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">No genesis deposit yet</div>
                  <div className="text-fg-muted">Seed the Formation Committee&apos;s genesis $50M deposit to start the simulator.</div>
                </div>
              </div>
              <Button onClick={seed} className="bg-gold text-ink hover:bg-gold-soft glow-gold">Seed genesis deposit</Button>
            </div>
          </motion.div>
        ) : null}

        {/* Charts row */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Supply chart */}
          <div className="glass card-hover rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gold">
                <Activity className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Supply over time</span>
              </div>
              <button onClick={fetchState} className="rounded-md p-1.5 text-fg-muted transition hover:text-foreground">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 h-48">
              {loading || !state || state.chartData.length === 0 ? (
                <Skeleton className="h-full w-full shimmer rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={state.chartData}>
                    <defs>
                      <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="index" tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={fmtCompact} tickLine={false} axisLine={false} width={60} />
                    <Tooltip
                      formatter={(v: number) => [fmtUsd(v), "Supply"]}
                      labelFormatter={(l) => `Op #${l}`}
                    />
                    <Area
                      type="monotone" dataKey="supply" stroke="var(--gold)" strokeWidth={2}
                      fill="url(#supplyGrad)" animationDuration={600}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Reserve composition donut */}
          <div className="glass card-hover rounded-2xl p-5">
            <div className="flex items-center gap-2 text-gold">
              <Layers className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Reserve composition</span>
            </div>
            <div className="mt-2 h-36">
              {loading || !state ? (
                <Skeleton className="h-full w-full shimmer rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData} dataKey="value" nameKey="name"
                      cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={2}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmtUsd(v)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 space-y-1">
              {state?.tiers.map((t, i) => (
                <div key={t.tier} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: TIER_COLORS[i] }} />
                    <span className="text-fg-muted">{t.tier} · {t.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{fmtCompact(t.usdValue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proof of Reserves + Reserve Ratio trend */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* PoR card */}
          <div className="glass gradient-border rounded-2xl p-6 lg:col-span-1">
            <div className="flex items-center gap-2 text-gold">
              <Hash className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Proof of Reserves</span>
            </div>
            <div className="mt-4">
              <code className="font-mono text-lg text-gold sm:text-xl">
                {loading || !state ? "…" : state.porHash}
              </code>
              <p className="mt-3 text-sm text-fg-muted">
                Reproducible from the public ledger. Reserve ratio always ≥ 100% by constitutional invariant.
              </p>
            </div>
            <Separator className="my-4 bg-line" />
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-fg-muted">Operations</div>
                <div className="font-display mt-1 text-xl text-foreground">
                  {loading || !state ? "—" : state.operations.length}
                </div>
              </div>
              <div>
                <div className="text-fg-muted">Last update</div>
                <div className="font-display mt-1 text-xl text-foreground">
                  {loading || !state ? "—" : timeAgo(state.lastUpdate)}
                </div>
              </div>
            </div>
          </div>

          {/* Reserve ratio trend */}
          <div className="glass card-hover rounded-2xl p-5 lg:col-span-2">
            <div className="flex items-center gap-2 text-gold">
              <Shield className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Reserve ratio trend</span>
            </div>
            <div className="mt-4 h-32">
              {loading || !state || state.chartData.length === 0 ? (
                <Skeleton className="h-full w-full shimmer rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={state.chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="index" tickLine={false} axisLine={false} />
                    <YAxis domain={[95, 105]} tickLine={false} axisLine={false} width={40} />
                    <Tooltip formatter={(v: number) => [v.toFixed(2) + "%", "Ratio"]} labelFormatter={(l) => `Op #${l}`} />
                    <Line
                      type="monotone" dataKey="reserveRatio" stroke="var(--reserve)" strokeWidth={2}
                      dot={false} animationDuration={600}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Mint / Redeem simulators */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Mint */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="glass card-hover h-full rounded-2xl p-6">
              <div className="flex items-center gap-2 text-reserve">
                <ArrowDownToLine className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Mint simulator</span>
              </div>
              <h3 className="font-display mt-3 text-lg text-foreground">Deposit reserves → mint MTQ</h3>
              <p className="mt-2 text-sm text-fg-muted">Depositing eligible reserves mints MTQ 1:1 at par. Supply grows only against verified value.</p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Deposit (USD)</span>
                  <input type="text" inputMode="decimal" value={mintAmt} onChange={(e) => setMintAmt(e.target.value)}
                    placeholder="1,000,000"
                    className="premium-focus mt-1.5 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Participant</span>
                  <input type="text" value={mintParty} onChange={(e) => setMintParty(e.target.value)}
                    className="premium-focus mt-1.5 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60" />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs">
                <span className="text-fg-muted">Fee (0.05%, cap $5K)</span>
                <span className="font-medium text-gold">
                  {(() => { const v = Number(mintAmt.replace(/[^0-9.]/g, "")); return fmtUsd2(Math.min(v * 0.0005, 5000)); })()}
                </span>
              </div>
              <Button onClick={mint} disabled={minting || !!state?.mintingPaused}
                className="mt-4 w-full bg-reserve text-ink hover:bg-reserve/90 disabled:opacity-50">
                {minting ? <><Loader2 className="h-4 w-4 animate-spin" /> Minting…</>
                  : state?.mintingPaused ? <><Lock className="h-4 w-4" /> Minting paused</>
                  : <><ArrowDownToLine className="h-4 w-4" /> Mint MTQ</>}
              </Button>
            </div>
          </motion.div>

          {/* Redeem */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <div className="glass card-hover h-full rounded-2xl p-6">
              <div className="flex items-center gap-2 text-gold">
                <ArrowUpFromLine className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Redeem simulator</span>
              </div>
              <h3 className="font-display mt-3 text-lg text-foreground">Burn MTQ → receive reserves</h3>
              <p className="mt-2 text-sm text-fg-muted">Burning MTQ returns proportional reserves. Redemption is <span className="text-gold">never suspended</span>. {(REDEMPTION_FEE_BPS / 100).toFixed(2)}% fee.</p>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Amount (MTQ)</span>
                  <input type="text" inputMode="decimal" value={redeemAmt} onChange={(e) => setRedeemAmt(e.target.value)}
                    placeholder="500,000"
                    className="premium-focus mt-1.5 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">Participant</span>
                  <input type="text" value={redeemParty} onChange={(e) => setRedeemParty(e.target.value)}
                    className="premium-focus mt-1.5 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-gold/60" />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-ink px-3 py-2 text-xs">
                <span className="text-fg-muted">Fee (0.05%)</span>
                <span className="font-medium text-gold">
                  {(() => { const v = Number(redeemAmt.replace(/[^0-9.]/g, "")); return fmtUsd2(v * 0.0005); })()}
                </span>
              </div>
              <Button onClick={redeem} disabled={redeeming}
                className="mt-4 w-full bg-gold text-ink hover:bg-gold-soft disabled:opacity-50">
                {redeeming ? <><Loader2 className="h-4 w-4 animate-spin" /> Redeeming…</>
                  : <><ArrowUpFromLine className="h-4 w-4" /> Redeem</>}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Operation ledger */}
        <div className="glass mt-6 rounded-2xl">
          <div className="flex items-center justify-between border-b border-line p-5">
            <div className="flex items-center gap-2 text-gold">
              <Layers className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Operation ledger</span>
            </div>
            <span className="text-xs text-fg-muted">Last {state?.operations.length ?? 0} operations</span>
          </div>
          <div className="max-h-96 overflow-y-auto overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="sticky top-0 bg-ink-soft/95 backdrop-blur text-left text-[10px] uppercase tracking-wider text-fg-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Participant</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="px-5 py-3 text-right font-semibold">MTQ</th>
                  <th className="px-5 py-3 text-right font-semibold">NAV</th>
                  <th className="px-5 py-3 text-right font-semibold">Ratio</th>
                  <th className="px-5 py-3 font-semibold">PoR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading || !state ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><Skeleton className="h-4 w-full shimmer rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : state.operations.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center text-sm text-fg-muted">No operations yet. Seed the genesis deposit to begin.</td></tr>
                ) : (
                  <AnimatePresence>
                    {state.operations.map((op, i) => (
                      <motion.tr
                        key={op.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.02 }}
                        className="hover:bg-ink-card/40"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-fg-muted">{timeAgo(op.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          {op.type === "mint" ? (
                            <Badge className="border-reserve/40 bg-reserve/15 text-[10px] text-reserve hover:bg-reserve/15">
                              <ArrowDownToLine className="mr-1 h-3 w-3" /> mint
                            </Badge>
                          ) : (
                            <Badge className="border-gold/40 bg-gold/15 text-[10px] text-gold hover:bg-gold/15">
                              <ArrowUpFromLine className="mr-1 h-3 w-3" /> redeem
                            </Badge>
                          )}
                        </td>
                        <td className="max-w-[180px] truncate px-5 py-3.5 text-foreground" title={op.participant}>{op.participant}</td>
                        <td className="px-5 py-3.5 text-right text-fg-muted">{fmtUsd(op.amountUsd)}</td>
                        <td className="px-5 py-3.5 text-right text-foreground">{fmtMtq(op.mtq)}</td>
                        <td className="px-5 py-3.5 text-right text-fg-muted">{fmtUsd2(op.nav)}</td>
                        <td className="px-5 py-3.5 text-right text-fg-muted">{fmtPct(op.reserveRatio)}</td>
                        <td className="px-5 py-3.5"><code className="font-mono text-[11px] text-gold/70">{op.porHash.slice(0, 8)}…</code></td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="my-8 bg-line" />
        <div className="flex items-start gap-2 text-xs leading-relaxed text-fg-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
          <span>Testnet simulator — no real value held or transferred. Mechanics mirror the v19.0 Constitution. 100%+ reserve mandate, no discretionary minting, no redemption suspension, 0.05% fees, four-tier diversified reserve basket.</span>
        </div>
      </div>
    </div>
  );
}
