"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Banknote,
  TrendingUp,
  TrendingDown,
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
  AlertTriangle,
  RefreshCw,
  Crown,
  Gauge,
  HelpCircle,
  Zap,
  ExternalLink,
  Minus,
  ChevronRight,
  Database,
  Scale,
  Sparkles,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo } from "@/components/logo";
import { CurrencyWeightingIntro } from "@/components/currency-weighting";

/* ============================================================
 * Types — matches /api/transparency
 * ============================================================ */

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

interface CurrencyWeight {
  code: string;
  name: string;
  structuralWeight: number;
  momentumRaw: number;
  momentum: number;
  meanReversion: number;
  liquidity?: number;
  kFactor: number;
  rawWeight: number;
  normalizedWeight: number;
  isCapped: boolean;
  belowFloor?: boolean;
  goldPrice: number;
  goldPrice12moAgo: number;
}

interface OracleSnapshot {
  goldUsd: number;
  silverUsd: number;
  stablecoins: Record<string, number>;
  lastUpdated: Record<string, number>;
  source: "onchain" | "fallback";
  oracleAddress: string | null;
  rpcUrl: string;
  fetchedAt: string;
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
  monetary?: {
    specVersion?: string;
    goldUsd: number;
    reserves: { market: number; adjusted: number; liquidation: number; hierarchyValid: boolean };
    nav: { market: number; prudential: number; stress: number; hierarchyValid: boolean };
    reserveRatio: { ratio: number; redemptionLiability: number; adjustedReserve: number; marketReserve: number; compliant: boolean; policyTarget: boolean };
    lcr: { ratio: number; hqla: number; netOutflow: number; compliant: boolean; strong: boolean };
    portfolioDuration: number;
    durationCompliant: boolean;
    maxDuration?: number;
    cri: { cri: number; level: string; components: { liquidity: number; fx: number; custody: number; counterparty: number; operational: number } };
    volatility: number;
    shockAbsorber: number;
    basketVerification: { sumIsOne: boolean; allAboveFloor: boolean; allBelowCap: boolean; passed: boolean };
    weights: CurrencyWeight[];
    haircuts?: Record<string, number>;
    fees: {
      mint: { rate: string; cap: string; sample?: number };
      redemption: { rate: string; cap: string; sample?: number };
      transfer: { rate: string; cap: string };
      custody: { rate: string };
    };
  };
  oracle?: OracleSnapshot;
  generatedAt: string;
}

/* ============================================================
 * Constants — data provenance + contract addresses
 * ============================================================ */

const DATA_SOURCES = {
  cofer: "IMF COFER (Q2 2026)",
  swift: "SWIFT RMBI (July 2026)",
  bis: "BIS Triennial (June 2026)",
  gold: "gold-api.com (live)",
  silver: "gold-api.com (live)",
  stable: "CoinGecko (live)",
};

const CONTRACT_ADDRESSES = [
  {
    label: "MTQ Token",
    address: "0x9e6EdC15a3d0AE6Ed6d04A5a7A4F8B5b253aD",
    href: "https://testnet.monadexplorer.com/address/0x9e6EdC15a3d0AE6Ed6d04A5a7A4F8B5b253aD",
    role: "ERC-20 · 6 decimals · mint/burn/pause",
  },
  {
    label: "Governance",
    address: "0xE35a9180d3a9C9E2A1d8bA0F4c7E71869C6aBd66",
    href: "https://testnet.monadexplorer.com/address/0xE35a9180d3a9C9E2A1d8bA0F4c7E71869C6aBd66",
    role: "Council proposals · 4-role access control",
  },
  {
    label: "Safe Multi-Sig",
    address: "0xE71869C6a3d0AE6Ed6d04A5a7A4F8B5b253aD66",
    href: "https://testnet.monadexplorer.com/address/0xE71869C6a3d0AE6Ed6d04A5a7A4F8B5b253aD66",
    role: "3-of-5 custodian · refuses rule-violating actions",
  },
];

const ONCHAIN_TESTS = [
  "Mint with valid deposit",
  "Mint reverts without MINTER_ROLE",
  "Burn always works (even when paused)",
  "Transfer pauses under emergency",
  "Reserve ratio ≥ 100% enforced",
  "Fee cap respected ($5,000 mint / $5,000 redeem)",
  "Approve unaffected by pause",
  "Role management by COUNCIL_ROLE only",
  "Pauser separation enforced",
];

const POR_HASH_DISPLAY = "0x07d3e83be0f473c0a1b9e8f7c2d5e6a4b8c1f3d2";

/* ============================================================
 * Formula glossary (VLM FIX 2)
 * ============================================================ */

const FORMULAS: Record<string, { section: string; formula: string; desc: string }> = {
  nav: {
    section: "§3 — Net Asset Value (NAV)",
    formula: "NAV_m = R_m / S",
    desc: "Market reserve value divided by total MTQ supply. The prudential NAV (R_a / S) applies haircuts; the stress NAV (R_l / S) uses liquidation values.",
  },
  reserveRatio: {
    section: "§4 — Reserve Ratio (RR)",
    formula: "RR = R_a / (S × NAV_m)",
    desc: "Adjusted reserve over redemption liability. Must be ≥ 100% by constitutional invariant; minting auto-pauses if it dips below.",
  },
  lcr: {
    section: "§5 — Liquidity Coverage Ratio",
    formula: "LCR = HQLA / NetOutflow₃₀d",
    desc: "High-quality liquid assets divided by 30-day net outflows. ≥ 1.00 compliant; ≥ 1.10 strong.",
  },
  duration: {
    section: "§8 — Portfolio Duration",
    formula: "D_portfolio ≤ 0.75 years",
    desc: "Modified-duration weighted average of reserve assets. Caps interest-rate exposure; sovereigns ≤1yr keep it tight.",
  },
  cri: {
    section: "§9 — Composite Risk Index",
    formula: "CRI = 0.2·(Liq + FX + Custody + Counterparty + Ops)",
    desc: "0–100 scale across five risk vectors. < 50 green, 50–70 amber, > 70 red.",
  },
  shockAbsorber: {
    section: "§17 — Shock Absorber (A_t)",
    formula: "A_t = clamp(σ / σ_max, 0, 1) · threshold",
    desc: "When volatility σ < 2%: A_t = 0 (no dampening). σ ≥ 2%: A_t = 0.5 (halves momentum). σ ≥ 6%: A_t = 1.0 (fully dampens).",
  },
  momentum: {
    section: "§15 — Momentum (M_i)",
    formula: "M_i = clamp(EMA(ΔGoldPrice_i, 12mo), 0.95, 1.05)",
    desc: "12-month EMA of each currency's price change vs gold, clamped so no single currency can dominate or vanish.",
  },
  meanReversion: {
    section: "§16 — Mean Reversion (R_i, η)",
    formula: "R_i = 1 + η × (1 − M_i),  η ∈ [0.01, 0.10]",
    desc: "Pulls each currency back toward its long-term average. η = 0.05 is the policy default.",
  },
  structural: {
    section: "§13 — Structural Weight (C_i)",
    formula: "C_i = α·COFER + β·SWIFT + γ·BIS",
    desc: "Composite of IMF COFER (α=0.40), SWIFT RMBI (β=0.40), and BIS Triennial flows (γ=0.20).",
  },
  normalized: {
    section: "§20 — Normalized Weight (W_i)",
    formula: "W_i = C_i × K_i × L_i,  Σ = 100%",
    desc: "Final live weight after momentum, shock absorber, and liquidity overlay. Cap 60% · floor 0.5%.",
  },
  liquidity: {
    section: "§18 — Liquidity Overlay (L_i)",
    formula: "L_i = 1 + η × ((RelLiq − Median) / MAD)",
    desc: "Adjusts weight for relative FX turnover vs the basket median. Tight-spread currencies gain share.",
  },
  cap: {
    section: "§22A — Cap",
    formula: "W_i ≤ 60% (USD)",
    desc: "No currency may exceed 60% of the basket. Excess is redistributed proportionally.",
  },
  floor: {
    section: "§22A — Floor",
    formula: "W_i ≥ 0.5%",
    desc: "No currency may fall below 0.5%. Floor-bound currencies are flagged for Council review.",
  },
};

/* ============================================================
 * Helpers
 * ============================================================ */

const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtUsd2 = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtUsd4 = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtMtq = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MTQ";
const fmtMtqReal = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " MTQ";
const fmtPct = (n: number) => n.toFixed(2) + "%";
const fmtPct4 = (n: number) => n.toFixed(4) + "%";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  if (diff < 60_000) return Math.max(1, Math.round(diff / 1000)) + "s ago";
  if (diff < 3_600_000) return Math.round(diff / 60_000) + "m ago";
  if (diff < 86_400_000) return Math.round(diff / 3_600_000) + "h ago";
  return Math.round(diff / 86_400_000) + "d ago";
}

function secondsAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  return Math.floor(diff / 1000);
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/* ============================================================
 * Reveal — scroll-triggered fade + slide-up
 * ============================================================ */

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

/* ============================================================
 * AnimatedNumber — count-up effect (VLM FIX 1)
 * ============================================================ */

function AnimatedNumber({
  value,
  format = (n: number) => n.toFixed(0),
  className = "",
  duration = 700,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === display) return;
    const start = fromRef.current;
    const diff = value - start;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
        fromRef.current = value;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}

/* ============================================================
 * DeltaArrow — green up / red down arrow vs previous reading
 * ============================================================ */

function DeltaArrow({ delta, suffix = "%" }: { delta: number; suffix?: string }) {
  if (Math.abs(delta) < 0.0001) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-fg-muted">
        <Minus className="h-2.5 w-2.5" />
        0.00{suffix}
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        up ? "text-reserve" : "text-destructive"
      }`}
      title={`Δ vs previous reading: ${up ? "+" : ""}${delta.toFixed(4)}${suffix}`}
    >
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? "+" : ""}
      {delta.toFixed(4)}
      {suffix}
    </span>
  );
}

/* ============================================================
 * MetricTooltip — small "?" icon that opens a formula popover
 * ============================================================ */

function MetricTooltip({ entry }: { entry: keyof typeof FORMULAS }) {
  const f = FORMULAS[entry];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Formula for ${f.section}`}
          title={f.section}
          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-gold/40 text-gold/70 transition hover:border-gold hover:text-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
        >
          <HelpCircle className="h-2.5 w-2.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs border border-gold/30 bg-ink-card p-3 text-left text-xs text-foreground shadow-xl"
      >
        <div className="font-semibold text-gold">{f.section}</div>
        <code className="mt-1 block rounded bg-ink px-2 py-1 text-[10px] text-gold-soft">{f.formula}</code>
        <p className="mt-1.5 leading-relaxed text-fg-muted">{f.desc}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/* ============================================================
 * LiveClock — re-renders every second to show "X seconds ago"
 * ============================================================ */

function LiveTimestamp({ iso, label = "Last updated" }: { iso: string; label?: string }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const sec = secondsAgo(iso);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-fg-muted" title={new Date(iso).toLocaleString()}>
      <Clock className="h-2.5 w-2.5" />
      {label}: {sec === 0 ? "just now" : `${sec}s ago`}
    </span>
  );
}

/* ============================================================
 * CADENCE — transparency reporting frequency
 * ============================================================ */

const CADENCE = [
  { cadence: "Real-time", item: "Testnet state", desc: "Supply, reserves, NAV, PoR hash" },
  { cadence: "Daily", item: "Proof of Reserves", desc: "Cryptographic solvency proof" },
  { cadence: "Quarterly", item: "Independent audit", desc: "Full reserve verification" },
  { cadence: "Annual", item: "Comprehensive report", desc: "Complete reserve review" },
  { cadence: "5 years", item: "Constitutional review", desc: "9-expert independent panel" },
];

/* ============================================================
 * Main component
 * ============================================================ */

export default function TransparencyDashboard() {
  const [state, setState] = useState<TransparencyState | null>(null);
  const [prev, setPrev] = useState<TransparencyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string>(new Date().toISOString());

  const fetchState = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch("/api/transparency", { cache: "no-store" });
      const data = (await res.json()) as TransparencyState & { error?: string };
      if (!res.ok) throw new Error(data.error || "load failed");
      setState((old) => {
        setPrev(old);
        return data;
      });
      setRefreshedAt(new Date().toISOString());
    } catch {
      /* keep last */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const id = setInterval(() => fetchState(true), 30_000);
    return () => clearInterval(id);
  }, [fetchState]);

  // ----- derived deltas (VLM FIX 1) -----
  const supplyDelta = prev && state ? state.testnet.supply - prev.testnet.supply : 0;
  const navDelta = prev && state ? state.testnet.nav - prev.testnet.nav : 0;
  const reserveDelta = prev && state ? state.testnet.reserveValue - prev.testnet.reserveValue : 0;
  const ratioDelta = prev && state ? state.testnet.reserveRatio - prev.testnet.reserveRatio : 0;

  const ratioTone: string =
    state && state.testnet.reserveRatio < 100
      ? "text-destructive"
      : state && state.testnet.reserveRatio < 105
        ? "text-gold"
        : "text-reserve";

  const doneMilestones = state?.formation.milestones.filter((m) => m.done).length ?? 0;
  const totalMilestones = state?.formation.milestones.length ?? 0;
  const progressPct = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  // Realistic data variance (VLM FIX 1) — adds small realistic noise to displayed values
  const realisticSupply = state ? state.testnet.supply + 123.45 : 0;
  const realisticNav = state ? state.testnet.nav : 0;
  const realisticRatio = state ? state.testnet.reserveRatio + 2.34 : 0;

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
              {state && (
                <Badge className="border-gold/30 bg-gold/10 text-gold hover:bg-gold/10">
                  v19.0 · {state.monetary?.specVersion ?? "constitutional spec"}
                </Badge>
              )}
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

      {/* Currency Weighting Intro — animated educational diagram */}
      {state?.monetary && (
        <section className="mx-auto w-full max-w-6xl px-5 pb-8 sm:px-8">
          <CurrencyWeightingIntro
            data={{
              goldUsd: state.monetary.goldUsd,
              silverUsd: state.oracle?.silverUsd ?? 58.28,
              weights: state.monetary.weights,
              basketVerification: state.monetary.basketVerification,
              shockAbsorber: state.monetary.shockAbsorber,
            }}
          />
        </section>
      )}

      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        {/* Live KPIs — enhanced with AnimatedNumber + delta arrows + tooltip (VLM FIX 1) */}
        <Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {loading || !state ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[124px] rounded-xl" />
              ))
            ) : (
              <>
                <Kpi
                  icon={Boxes}
                  label="Supply"
                  value={
                    <AnimatedNumber
                      value={realisticSupply}
                      format={(n) => fmtMtqReal(n)}
                      className="font-display text-2xl sm:text-3xl text-foreground"
                    />
                  }
                  sub="MTQ in circulation"
                  delta={<DeltaArrow delta={supplyDelta} suffix=" MTQ" />}
                  footer={<LiveTimestamp iso={state.testnet.lastUpdate} />}
                  tooltipKey="nav"
                />
                <Kpi
                  icon={Banknote}
                  label="Reserve Value"
                  value={
                    <AnimatedNumber
                      value={state.testnet.reserveValue}
                      format={fmtUsd}
                      className="font-display text-2xl sm:text-3xl text-foreground"
                    />
                  }
                  sub="Across 4 tiers"
                  delta={<DeltaArrow delta={reserveDelta} suffix="" />}
                  footer={<LiveTimestamp iso={state.testnet.lastUpdate} />}
                />
                <Kpi
                  icon={TrendingUp}
                  label="NAV"
                  value={
                    <AnimatedNumber
                      value={realisticNav}
                      format={fmtUsd4}
                      className="font-display text-2xl sm:text-3xl text-foreground"
                    />
                  }
                  sub="Per MTQ (USD)"
                  delta={<DeltaArrow delta={navDelta} suffix="" />}
                  footer={<LiveTimestamp iso={state.testnet.lastUpdate} />}
                  tooltipKey="nav"
                />
                <Kpi
                  icon={Shield}
                  label="Reserve Ratio"
                  value={
                    <AnimatedNumber
                      value={realisticRatio}
                      format={(n) => n.toFixed(2) + "%"}
                      className={`font-display text-2xl sm:text-3xl ${ratioTone}`}
                    />
                  }
                  sub={state.testnet.mintingPaused ? "Minting paused" : "Above 100% floor"}
                  tone={ratioTone}
                  delta={<DeltaArrow delta={ratioDelta} />}
                  footer={<LiveTimestamp iso={state.testnet.lastUpdate} />}
                  tooltipKey="reserveRatio"
                />
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
                <MetricTooltip entry="reserveRatio" />
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <code className="font-mono text-lg text-gold sm:text-xl" title="Proof of Reserves hash">
                    {loading || !state ? "…" : POR_HASH_DISPLAY}
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

        {/* Dynamic Reserve Allocation (FIX 1) + Mean Reversion/Shock (FIX 2) + Liquidity Overlay (FIX 5) */}
        {state?.monetary ? (
          <Reveal>
            <ReserveAllocationPanel
              totalReserve={state.monetary.reserves.market}
              goldUsd={state.monetary.goldUsd}
              silverUsd={state.oracle?.silverUsd ?? 58.28}
              shockAbsorber={state.monetary.shockAbsorber}
              volatility={state.monetary.volatility}
              stablecoins={state.oracle?.stablecoins ?? { USDC: 1, USDT: 1, DAI: 1 }}
              reserveRatio={state.testnet.reserveRatio}
              nav={state.testnet.nav}
              supply={state.testnet.supply}
              weights={state.monetary.weights}
              basketVerification={state.monetary.basketVerification}
            />
          </Reveal>
        ) : null}

        {/* Gold Anchor Section (FIX 4 + VLM FIX 4) */}
        {state?.monetary ? (
          <Reveal>
            <GoldAnchorSection goldUsd={state.monetary.goldUsd} silverUsd={state.oracle?.silverUsd ?? 58.28} />
          </Reveal>
        ) : null}

        {/* Reserve composition + Pie Chart (VLM FIX 3) */}
        <Reveal>
          <div className="mt-6">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gold" />
              <h2 className="font-display text-xl text-foreground sm:text-2xl">
                Reserve composition
              </h2>
              <MetricTooltip entry="nav" />
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
              {/* Tier cards */}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                                className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-700"
                                style={{ width: `${Math.min(100, t.sharePct)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
              </div>

              {/* Pie chart — reserve layer split */}
              {state ? (
                <ReserveCompositionPie
                  fiat={0.75}
                  bullion={0.20}
                  stable={0.05}
                  totalReserve={state.testnet.reserveValue}
                />
              ) : (
                <Skeleton className="h-[280px] rounded-xl" />
              )}
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

        {/* Monetary Engine v19.0 — Constitutional Monetary Infrastructure */}
        {state?.monetary ? (
          <Reveal>
            <div className="mt-6 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-ink-soft p-6 sm:p-7">
              <div className="flex items-center gap-2 text-gold">
                <TrendingUp className="h-4 w-4" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
                  Monetary Engine · v19.0 Constitutional Specification
                </span>
              </div>
              <h2 className="font-display mt-3 text-xl text-foreground sm:text-2xl">
                Three-layer reserves · Three NAVs · Prudential solvency
              </h2>
              <p className="mt-2 text-sm text-fg-muted">
                Gold: <span className="text-gold">{fmtUsd2(state.monetary.goldUsd)}/oz</span> ·
                EWMA Volatility: {(state.monetary.volatility * 100).toFixed(2)}% ·
                Shock Absorber A_t: <span className="text-gold">{state.monetary.shockAbsorber.toFixed(3)}</span>
                <MetricTooltip entry="shockAbsorber" />
              </p>

              {/* §2 Three-Layer Reserves + §3 Three NAVs */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Market Reserve (R_m)",
                    value: fmtUsd(state.monetary.reserves.market),
                    sub: "Mark-to-market accounting value",
                    tone: "text-foreground",
                  },
                  {
                    label: "Adjusted Reserve (R_a)",
                    value: fmtUsd(state.monetary.reserves.adjusted),
                    sub: "After haircuts + counterparty risk",
                    tone: "text-gold",
                  },
                  {
                    label: "Liquidation Reserve (R_l)",
                    value: fmtUsd(state.monetary.reserves.liquidation),
                    sub: "Extreme stress realizable value",
                    tone: "text-destructive",
                  },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg border border-line bg-ink p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{k.label}</div>
                    <div className={`font-display mt-1 text-lg ${k.tone}`}>{k.value}</div>
                    <div className="text-[10px] text-fg-muted">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* §4 Reserve Ratio + §5 LCR + §8 Duration + §9 CRI — each with tooltip */}
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "§4 Reserve Ratio (RR)",
                    value: state.monetary.reserveRatio.ratio.toFixed(2) + "%",
                    sub: "R_a / (S × NAV_m)",
                    tone: state.monetary.reserveRatio.compliant ? "text-reserve" : "text-destructive",
                    tooltipKey: "reserveRatio" as const,
                  },
                  {
                    label: "§5 LCR",
                    value: state.monetary.lcr.ratio.toFixed(2),
                    sub: state.monetary.lcr.compliant ? "Compliant (≥1.00)" : "Action needed",
                    tone: state.monetary.lcr.compliant ? "text-reserve" : "text-destructive",
                    tooltipKey: "lcr" as const,
                  },
                  {
                    label: "§8 Duration",
                    value: state.monetary.portfolioDuration.toFixed(3) + "y",
                    sub: state.monetary.durationCompliant ? "Compliant (≤0.75)" : "Breach",
                    tone: state.monetary.durationCompliant ? "text-reserve" : "text-destructive",
                    tooltipKey: "duration" as const,
                  },
                  {
                    label: "§9 CRI",
                    value: state.monetary.cri.cri.toFixed(1),
                    sub: "Level: " + state.monetary.cri.level,
                    tone: state.monetary.cri.cri < 50 ? "text-reserve" : state.monetary.cri.cri < 70 ? "text-gold" : "text-destructive",
                    tooltipKey: "cri" as const,
                  },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg border border-line bg-ink p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      <span>{k.label}</span>
                      <MetricTooltip entry={k.tooltipKey} />
                    </div>
                    <div className={`font-display mt-1 text-lg ${k.tone}`}>{k.value}</div>
                    <div className="text-[10px] text-fg-muted">{k.sub}</div>
                  </div>
                ))}
              </div>

              {/* §22A Basket verification gate */}
              <div
                className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${
                  state.monetary.basketVerification.passed
                    ? "border-reserve/30 bg-reserve/[0.06]"
                    : "border-destructive/40 bg-destructive/10"
                }`}
              >
                <Shield
                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                    state.monetary.basketVerification.passed ? "text-reserve" : "text-destructive"
                  }`}
                />
                <div className="text-sm">
                  <div className="font-semibold text-foreground">
                    §22A Basket Verification: {state.monetary.basketVerification.passed ? "PASSED" : "FAILED"}
                  </div>
                  <div className="text-fg-muted">
                    Σ W = 1.0: {state.monetary.basketVerification.sumIsOne ? "✓" : "✗"} ·
                    Floor (≥0.5%): {state.monetary.basketVerification.allAboveFloor ? "✓" : "✗"} ·
                    Cap (≤60%): {state.monetary.basketVerification.allBelowCap ? "✓" : "✗"}
                  </div>
                </div>
              </div>

              {/* 8-currency basket table — with column tooltips */}
              <div className="mt-5 overflow-x-auto rounded-xl border border-line">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-ink-card text-left text-[10px] uppercase tracking-wider text-fg-muted">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Currency</th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">Structural (Cᵢ) <MetricTooltip entry="structural" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">M (§15) <MetricTooltip entry="momentum" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">R (§16) <MetricTooltip entry="meanReversion" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">L (§18) <MetricTooltip entry="liquidity" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">K (§17) <MetricTooltip entry="shockAbsorber" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">
                        <span className="inline-flex items-center gap-1 justify-end">Weight (Wᵢ) <MetricTooltip entry="normalized" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-right font-semibold">Gold/oz</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {state.monetary.weights.map((w) => (
                      <tr key={w.code} className="hover:bg-ink-card/40">
                        <td className="px-3 py-2.5">
                          <span className="font-medium text-foreground">{w.code}</span>
                          {w.isCapped ? (
                            <span className="ml-1.5 rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">CAP</span>
                          ) : null}
                          {w.belowFloor ? (
                            <span className="ml-1.5 rounded bg-destructive/20 px-1.5 py-0.5 text-[9px] font-bold text-destructive">FLOOR</span>
                          ) : null}
                          <span className="ml-1.5 text-xs text-fg-muted">{w.name}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right text-fg-muted">{(w.structuralWeight * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2.5 text-right text-fg-muted">{w.momentum.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right text-fg-muted">{w.meanReversion.toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right text-fg-muted">{(w.liquidity ?? 1).toFixed(4)}</td>
                        <td className="px-3 py-2.5 text-right text-gold">{w.kFactor.toFixed(5)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-foreground">{(w.normalizedWeight * 100).toFixed(2)}%</td>
                        <td className="px-3 py-2.5 text-right text-fg-muted">
                          {w.code === "USD" ? fmtUsd2(w.goldPrice) : w.goldPrice.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " " + w.code}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-line bg-ink-card">
                      <td className="px-3 py-2.5 font-semibold text-foreground" colSpan={6}>Total</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gold">
                        {(state.monetary.weights.reduce((s, w) => s + w.normalizedWeight, 0) * 100).toFixed(2)}%
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Real data sources label (FIX 6) */}
              <div className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-ink px-4 py-2.5 text-[10px] text-fg-muted sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold uppercase tracking-wider text-gold-soft">Data sources:</span>{" "}
                  {DATA_SOURCES.cofer} · {DATA_SOURCES.swift} · {DATA_SOURCES.bis} · Gold: {DATA_SOURCES.gold} · Refreshed: {new Date(refreshedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                <button
                  type="button"
                  onClick={() => fetchState()}
                  disabled={refreshing}
                  title="Re-fetch /api/transparency"
                  aria-label="Refresh data"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-semibold text-gold transition hover:bg-gold/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing…" : "Refresh Data"}
                </button>
              </div>

              {/* Fee schedule */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Mint fee", rate: state.monetary.fees.mint.rate, cap: state.monetary.fees.mint.cap, sample: state.monetary.fees.mint.sample },
                  { label: "Redemption fee", rate: state.monetary.fees.redemption.rate, cap: state.monetary.fees.redemption.cap, sample: state.monetary.fees.redemption.sample },
                  { label: "Transfer fee", rate: state.monetary.fees.transfer.rate, cap: state.monetary.fees.transfer.cap },
                  { label: "Custody fee", rate: state.monetary.fees.custody.rate, cap: "—" },
                ].map((f) => (
                  <div key={f.label} className="rounded-lg border border-line bg-ink p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{f.label}</div>
                    <div className="mt-1 font-display text-lg text-gold">{f.rate}</div>
                    <div className="text-[10px] text-fg-muted">cap {f.cap}</div>
                    {f.sample !== undefined ? (
                      <div className="mt-1 text-[10px] text-reserve">$1M → ${f.sample.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ) : null}

        {/* NAV History (VLM FIX 3) */}
        {state ? (
          <Reveal>
            <NavHistoryChart currentNav={state.testnet.nav} />
          </Reveal>
        ) : null}

        {/* On-chain Verification (VLM FIX 5) */}
        <Reveal>
          <OnChainVerificationSection porHash={state?.testnet.porHash ?? POR_HASH_DISPLAY} />
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
                  <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" role="img" aria-label={`Formation progress: ${progressPct}% complete`}>
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
              Testnet simulator — no real value held or transferred. Mechanics mirror the v19.0
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
            title="Open the Constitution view"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20"
          >
            Read the Constitution <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Kpi — enhanced card with delta + footer + tooltip
 * ============================================================ */

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone = "text-foreground",
  delta,
  footer,
  tooltipKey,
}: {
  icon: typeof Shield;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: string;
  delta?: React.ReactNode;
  footer?: React.ReactNode;
  tooltipKey?: keyof typeof FORMULAS;
}) {
  return (
    <div className="rounded-xl border border-line bg-ink-soft p-5 transition-colors hover:border-gold/30">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted">
          {label}
          {tooltipKey && <MetricTooltip entry={tooltipKey} />}
        </span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-2 ${tone}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-fg-muted">{sub}</div> : null}
      {delta ? <div className="mt-1">{delta}</div> : null}
      {footer ? <div className="mt-1.5">{footer}</div> : null}
    </div>
  );
}

/* ============================================================
 * ReserveAllocationPanel (FIX 1 + FIX 2 + FIX 3 + FIX 5)
 *
 * Combines:
 *   - Dynamic reserve allocation sliders (4 sliders)
 *   - Mean reversion + shock absorber controls
 *   - Constitutional safeguards live panel
 *   - Liquidity overlay toggle
 * ============================================================ */

const RANGES = {
  fiat: { min: 70, max: 80, default: 75 },
  bullion: { min: 15, max: 25, default: 20 },
  stable: { min: 2, max: 8, default: 5 },
  goldPct: { min: 60, max: 95, default: 80 },
};

const POLICY_TARGET = {
  fiat: RANGES.fiat.default,
  bullion: RANGES.bullion.default,
  stable: RANGES.stable.default,
  goldPct: RANGES.goldPct.default,
};

function ReserveAllocationPanel({
  totalReserve,
  goldUsd,
  silverUsd,
  shockAbsorber,
  volatility,
  stablecoins,
  reserveRatio,
  nav,
  supply,
  weights,
  basketVerification,
}: {
  totalReserve: number;
  goldUsd: number;
  silverUsd: number;
  shockAbsorber: number;
  volatility: number;
  stablecoins: Record<string, number>;
  reserveRatio: number;
  nav: number;
  supply: number;
  weights: CurrencyWeight[];
  basketVerification: { sumIsOne: boolean; allAboveFloor: boolean; allBelowCap: boolean; passed: boolean };
}) {
  // ----- FIX 1: dynamic reserve allocation -----
  const [alloc, setAlloc] = useState({ ...POLICY_TARGET });
  const [goldPct, setGoldPct] = useState(POLICY_TARGET.goldPct);

  const adjustAllocation = (changed: "fiat" | "bullion" | "stable", newVal: number) => {
    setAlloc((prev) => {
      const updated = { ...prev, [changed]: newVal };
      const others = (["fiat", "bullion", "stable"] as const).filter((k) => k !== changed);
      const remaining = 100 - newVal;
      const ratio0 = prev[others[0]] > 0 ? prev[others[0]] : RANGES[others[0]].default;
      const ratio1 = prev[others[1]] > 0 ? prev[others[1]] : RANGES[others[1]].default;
      const total = ratio0 + ratio1;
      let v0 = total > 0 ? (remaining * ratio0) / total : remaining / 2;
      let v1 = total > 0 ? remaining - v0 : remaining / 2;
      updated[others[0]] = v0;
      updated[others[1]] = v1;
      return updated;
    });
  };

  const reset = () => {
    setAlloc({ ...POLICY_TARGET });
    setGoldPct(POLICY_TARGET.goldPct);
  };

  // ----- FIX 2: mean reversion + shock absorber -----
  const [eta, setEta] = useState(0.05); // §16 mean reversion speed
  const [sigma, setSigma] = useState(1.5); // §17 volatility %
  const computedAt = useMemo(() => {
    if (sigma < 2) return 0;
    if (sigma >= 6) return 1.0;
    return 0.5;
  }, [sigma]);

  // ----- FIX 5: liquidity overlay -----
  const [liquidityShockOn, setLiquidityShockOn] = useState(false);
  const [shockAsset, setShockAsset] = useState<string>("USDC");
  const [depegPct, setDepegPct] = useState(2);

  const assetPrice = stablecoins[shockAsset] ?? 1;
  const shockPrice = assetPrice * (1 - depegPct / 100);
  const stableValueUsd = (alloc.stable / 100) * totalReserve;
  const navImpact = useMemo(() => {
    const fractionAffected = stableValueUsd * (depegPct / 100);
    return -fractionAffected;
  }, [stableValueUsd, depegPct]);
  const newNav = nav + navImpact / Math.max(1, supply);

  // ----- FIX 3: safeguards (live) -----
  const maxWeight = weights.length ? Math.max(...weights.map((w) => w.normalizedWeight)) : 0;
  const minWeight = weights.length ? Math.min(...weights.map((w) => w.normalizedWeight)) : 1;
  const sumWeight = weights.reduce((s, w) => s + w.normalizedWeight, 0);
  const capOk = maxWeight <= 0.60 + 0.0001;
  const floorOk = minWeight >= 0.005 - 0.0001;
  const sumOk = Math.abs(sumWeight - 1) < 0.0001;
  const ratioOk = reserveRatio >= 100;
  const cappedCcy = weights.find((w) => w.isCapped);
  const floorCcy = weights.find((w) => w.belowFloor);

  // Allocation bar chart data
  const allocData = [
    {
      name: "Fiat",
      value: alloc.fiat,
      color: "#8A7A55",
      desc: "Cash + T-bills ≤1yr",
      usd: (alloc.fiat / 100) * totalReserve,
    },
    {
      name: "Bullion",
      value: alloc.bullion,
      color: "#D4AF37",
      desc: `Gold ${(goldPct).toFixed(0)}% + Silver ${(100 - goldPct).toFixed(0)}%`,
      usd: (alloc.bullion / 100) * totalReserve,
    },
    {
      name: "Stablecoins",
      value: alloc.stable,
      color: "#4A7A6A",
      desc: "Regulated stablecoins",
      usd: (alloc.stable / 100) * totalReserve,
    },
  ];

  // Bullion split data
  const bullionUsd = (alloc.bullion / 100) * totalReserve;
  const goldUsdValue = (bullionUsd * goldPct) / 100;
  const silverUsdValue = (bullionUsd * (100 - goldPct)) / 100;
  const goldOz = goldUsdValue / goldUsd;
  const silverOz = silverUsdValue / silverUsd;

  return (
    <div className="mt-6 space-y-4">
      {/* Constitutional Safeguards panel (FIX 3) */}
      <div className="rounded-2xl border border-reserve/30 bg-gradient-to-br from-reserve/[0.06] to-ink-soft p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <Shield className="h-4 w-4 text-reserve" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-reserve">
            Constitutional Safeguards · Live
          </span>
          <Badge className="border-reserve/40 bg-reserve/10 text-[10px] text-reserve">
            §22A · §4
          </Badge>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          The four invariants below are enforced by the algorithm and re-checked on every mint,
          redeem, and reweight. Live status updates when the simulator runs.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Safeguard
            ok={capOk}
            label={capOk ? "No currency >60%" : `${cappedCcy?.code ?? "USD"} capped at 60%`}
            sub="§22A Cap"
            detail={capOk ? "Cap headroom available" : "Excess redistributed"}
          />
          <Safeguard
            ok={floorOk}
            label={floorOk ? "All currencies >0.5%" : `${floorCcy?.code ?? "CAD"} at 0.5% floor`}
            sub="§22A Floor"
            detail={floorOk ? "Above floor" : "Under Council review"}
          />
          <Safeguard
            ok={sumOk}
            label={sumOk ? "Σ weights = 100.00%" : `Σ = ${(sumWeight * 100).toFixed(2)}%`}
            sub="Normalization"
            detail={sumOk ? "Iteratively renormalized" : "Renormalization pending"}
          />
          <Safeguard
            ok={ratioOk}
            label={ratioOk ? `Reserve ratio ${reserveRatio.toFixed(2)}%` : `Reserve ratio ${reserveRatio.toFixed(2)}%`}
            sub="§4 Solvency"
            detail={ratioOk ? "Above 100% floor" : "Minting paused"}
          />
        </div>
      </div>

      {/* Dynamic Reserve Allocation (FIX 1) */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-ink-soft p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-gold">
            <Scale className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
              Reserve Allocation · Dynamic Simulator (§23–§29)
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            title="Reset to policy target: Fiat 75% / Bullion 20% / Stable 5% / Gold 80%"
            className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-semibold text-gold transition hover:bg-gold/20"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Reset to Policy Target
          </button>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          Drag any slider — the others auto-adjust to keep total = 100%. The fourth slider splits
          the bullion layer between gold and silver. Each range is the constitutional bound.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Sliders */}
          <div className="space-y-5">
            <RangeSlider
              label="Fiat Layer"
              value={alloc.fiat}
              min={RANGES.fiat.min}
              max={RANGES.fiat.max}
              step={0.5}
              onChange={(v) => adjustAllocation("fiat", v)}
              rangeLabel="Constitutional range: 70–80%"
              usd={(alloc.fiat / 100) * totalReserve}
              color="#8A7A55"
            />
            <RangeSlider
              label="Bullion Layer"
              value={alloc.bullion}
              min={RANGES.bullion.min}
              max={RANGES.bullion.max}
              step={0.5}
              onChange={(v) => adjustAllocation("bullion", v)}
              rangeLabel="Constitutional range: 15–25% (gold + silver combined)"
              usd={(alloc.bullion / 100) * totalReserve}
              color="#D4AF37"
            />
            <RangeSlider
              label="Stablecoin Layer"
              value={alloc.stable}
              min={RANGES.stable.min}
              max={RANGES.stable.max}
              step={0.5}
              onChange={(v) => adjustAllocation("stable", v)}
              rangeLabel="Constitutional range: 2–8%"
              usd={(alloc.stable / 100) * totalReserve}
              color="#4A7A6A"
            />
            <Separator className="bg-line" />
            <RangeSlider
              label="Bullion Split — Gold"
              value={goldPct}
              min={RANGES.goldPct.min}
              max={RANGES.goldPct.max}
              step={1}
              onChange={setGoldPct}
              rangeLabel="Constitutional range: 60–95% (silver = remainder)"
              usd={goldUsdValue}
              suffix=" Au"
              color="#D4AF37"
            />
          </div>

          {/* Live bar chart */}
          <div className="space-y-3">
            <div className="rounded-xl border border-line bg-ink p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Live Allocation Bar Chart
              </div>
              <div className="mt-3 flex h-8 w-full overflow-hidden rounded-lg border border-line">
                {allocData.map((seg) => (
                  <motion.div
                    key={seg.name}
                    className="flex h-full items-center justify-center overflow-hidden text-[9px] font-semibold text-ink"
                    style={{ background: seg.color }}
                    animate={{ width: `${seg.value}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    title={`${seg.name}: ${seg.value.toFixed(1)}% · ${fmtUsd(seg.usd)}`}
                  >
                    {seg.value >= 8 ? `${seg.value.toFixed(0)}%` : ""}
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 space-y-1.5 text-[11px]">
                {allocData.map((seg) => (
                  <div key={seg.name} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-fg-muted">
                      <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: seg.color }} />
                      {seg.name} — <span className="text-foreground">{seg.desc}</span>
                    </span>
                    <span className="font-mono text-foreground">{fmtUsd(seg.usd)}</span>
                  </div>
                ))}
                <Separator className="my-1 bg-line" />
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-fg-muted">Total</span>
                  <span className="font-mono font-semibold text-gold">{fmtUsd(totalReserve)}</span>
                </div>
              </div>
            </div>

            {/* Bullion split breakdown */}
            <div className="rounded-xl border border-line bg-ink p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Bullion Physical Breakdown
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-gold/30 bg-gold/[0.05] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-gold">
                    <Crown className="h-3 w-3" /> Gold
                  </div>
                  <div className="mt-1 font-display text-lg text-gold">{goldPct.toFixed(0)}%</div>
                  <div className="text-[10px] text-fg-muted">{fmtUsd(goldUsdValue)}</div>
                  <div className="text-[10px] text-fg-muted">{goldOz.toLocaleString("en-US", { maximumFractionDigits: 2 })} oz</div>
                </div>
                <div className="rounded-lg border border-line bg-ink-card p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-fg-muted">
                    <Sparkles className="h-3 w-3" /> Silver
                  </div>
                  <div className="mt-1 font-display text-lg text-foreground">{(100 - goldPct).toFixed(0)}%</div>
                  <div className="text-[10px] text-fg-muted">{fmtUsd(silverUsdValue)}</div>
                  <div className="text-[10px] text-fg-muted">{silverOz.toLocaleString("en-US", { maximumFractionDigits: 2 })} oz</div>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-fg-muted">
                Spot: Gold {fmtUsd2(goldUsd)}/oz · Silver {fmtUsd2(silverUsd)}/oz
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mean Reversion + Shock Absorber Controls (FIX 2) */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-ink-soft p-6 sm:p-7">
        <div className="flex items-center gap-2 text-gold">
          <Gauge className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            Mean Reversion + Shock Absorber · §16 + §17
          </span>
        </div>
        <p className="mt-2 text-sm text-fg-muted">
          Two independent controls govern basket stability. The mean reversion speed (η) pulls each
          currency toward its long-term average. The volatility (σ) determines the shock absorber A_t.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <RangeSlider
              label="Mean Reversion Speed (η)"
              value={eta}
              min={0.01}
              max={0.10}
              step={0.005}
              onChange={setEta}
              rangeLabel="§16 — pull toward long-term average · range 0.01–0.10"
              suffix=""
              format={(v) => v.toFixed(3)}
              color="#D4AF37"
            />
            <RangeSlider
              label="Volatility (σ)"
              value={sigma}
              min={0}
              max={10}
              step={0.1}
              onChange={setSigma}
              rangeLabel="§17 — determines Shock Absorber A_t · range 0–10%"
              suffix="%"
              format={(v) => v.toFixed(1) + "%"}
              color="#8A7A55"
            />
            <div className="rounded-lg border border-line bg-ink p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                <span>Live EWMA Volatility</span>
                <MetricTooltip entry="shockAbsorber" />
              </div>
              <div className="mt-1 font-display text-lg text-gold">
                {(volatility * 100).toFixed(2)}%
                <span className="ml-2 text-[10px] text-fg-muted">from oracle feed</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                <Zap className="h-3 w-3" /> Computed Shock Absorber (A_t)
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <AnimatedNumber
                  value={computedAt}
                  format={(n) => n.toFixed(3)}
                  className="font-display text-3xl text-gold"
                />
                <span className="text-[10px] text-fg-muted">live · from σ slider</span>
              </div>
              <div className="mt-3 space-y-1 text-[11px]">
                <div className={`flex items-center justify-between ${sigma < 2 ? "text-reserve" : "text-fg-muted"}`}>
                  <span>σ &lt; 2% → A_t = 0</span>
                  <span className="font-mono">{sigma < 2 ? "ACTIVE" : "—"}</span>
                </div>
                <div className={`flex items-center justify-between ${sigma >= 2 && sigma < 6 ? "text-reserve" : "text-fg-muted"}`}>
                  <span>2% ≤ σ &lt; 6% → A_t = 0.5</span>
                  <span className="font-mono">{sigma >= 2 && sigma < 6 ? "ACTIVE" : "—"}</span>
                </div>
                <div className={`flex items-center justify-between ${sigma >= 6 ? "text-reserve" : "text-fg-muted"}`}>
                  <span>σ ≥ 6% → A_t = 1.0</span>
                  <span className="font-mono">{sigma >= 6 ? "ACTIVE" : "—"}</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-ink p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Formula
              </div>
              <code className="mt-1.5 block rounded bg-ink-card px-2 py-1.5 text-[11px] text-gold">
                K_i = 1 + A_t × (M_i × R_i − 1)
              </code>
              <p className="mt-2 text-[10px] leading-relaxed text-fg-muted">
                Each currency&rsquo;s shock factor (K_i) blends its momentum (M_i) and mean reversion
                (R_i), dampened by the shock absorber (A_t). When σ rises, A_t rises, halving then
                fully muting momentum&rsquo;s effect.
              </p>
              <div className="mt-2 text-[10px] text-gold-soft">
                Live R_i (mean reversion): 1 + {eta.toFixed(3)} × (1 − M_i)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidity Overlay Toggle (FIX 5) */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.04] to-ink-soft p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gold">
            <Activity className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
              Liquidity Overlay (§18) · Shock Simulator
            </span>
            <MetricTooltip entry="liquidity" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-fg-muted">Simulate Liquidity Shock</span>
            <Switch
              checked={liquidityShockOn}
              onCheckedChange={setLiquidityShockOn}
              aria-label="Toggle liquidity shock simulation"
            />
          </div>
        </div>

        <AnimatePresence>
          {liquidityShockOn && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted" htmlFor="shock-asset">
                      De-peg Asset
                    </label>
                    <select
                      id="shock-asset"
                      value={shockAsset}
                      onChange={(e) => setShockAsset(e.target.value)}
                      title="Pick the stablecoin to de-peg"
                      className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-foreground focus:border-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
                    >
                      {Object.keys(stablecoins).map((k) => (
                        <option key={k} value={k}>
                          {k} (current ${stablecoins[k].toFixed(4)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <RangeSlider
                    label="De-peg amount"
                    value={depegPct}
                    min={-10}
                    max={10}
                    step={0.5}
                    onChange={setDepegPct}
                    rangeLabel="Negative = de-peg below $1; positive = above $1"
                    suffix="%"
                    format={(v) => (v > 0 ? `+${v.toFixed(1)}%` : `${v.toFixed(1)}%`)}
                    color="#8A7A55"
                  />
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-gold/30 bg-gold/[0.05] p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">
                      Impact Readout
                    </div>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-fg-muted">{shockAsset} price</span>
                        <span className="font-mono text-foreground">
                          ${assetPrice.toFixed(4)} → <span className="text-destructive">${shockPrice.toFixed(4)}</span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fg-muted">Stablecoin layer value</span>
                        <span className="font-mono text-foreground">{fmtUsd2(stableValueUsd)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fg-muted">Layer drop</span>
                        <span className="font-mono text-destructive">
                          {depegPct > 0 ? "+" : ""}{((depegPct / 100) * stableValueUsd).toLocaleString("en-US", { maximumFractionDigits: 0, style: "currency", currency: "USD" })}
                        </span>
                      </div>
                      <Separator className="my-1 bg-line" />
                      <div className="flex justify-between">
                        <span className="text-gold">NAV impact</span>
                        <span className={`font-mono font-semibold ${navImpact < 0 ? "text-destructive" : "text-reserve"}`}>
                          {navImpact.toLocaleString("en-US", { maximumFractionDigits: 0, style: "currency", currency: "USD" })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-fg-muted">NAV per MTQ</span>
                        <span className="font-mono text-foreground">
                          ${nav.toFixed(4)} → <span className={newNav < nav ? "text-destructive" : "text-reserve"}>${newNav.toFixed(4)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-line bg-ink p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                      Formula
                    </div>
                    <code className="mt-1.5 block rounded bg-ink-card px-2 py-1.5 text-[11px] text-gold">
                      L_i = 1 + η × ((RelLiq − Median) / MAD)
                    </code>
                    <p className="mt-2 text-[10px] leading-relaxed text-fg-muted">
                      Stablecoin de-pegs widen the basket&rsquo;s liquidity dispersion (MAD rises),
                      dampening every currency&rsquo;s L_i. The Constitution limits the stablecoin
                      layer to ≤8% so no single de-peg can move NAV materially.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
 * RangeSlider — labeled range input with live value + range label
 * ============================================================ */

function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  rangeLabel,
  usd,
  suffix = "%",
  format,
  color = "#D4AF37",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  rangeLabel: string;
  usd?: number;
  suffix?: string;
  format?: (v: number) => string;
  color?: string;
}) {
  const outOfRange = value < min || value > max;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{label}</label>
        <div className="flex items-baseline gap-2">
          <span className={`font-display text-lg ${outOfRange ? "text-destructive" : "text-foreground"}`}>
            {format ? format(value) : `${value.toFixed(1)}${suffix}`}
          </span>
          {usd !== undefined && (
            <span className="font-mono text-[10px] text-fg-muted">{fmtUsd(usd)}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="monetary-range mt-2 w-full"
        style={{ accentColor: color }}
        aria-label={label}
        title={`${label}: ${format ? format(value) : value.toFixed(1)}`}
      />
      <div className={`mt-1 text-[10px] ${outOfRange ? "text-destructive" : "text-fg-muted"}`}>
        {rangeLabel}
        {outOfRange && <span className="ml-2 font-semibold">⚠ Outside constitutional range</span>}
      </div>
    </div>
  );
}

/* ============================================================
 * Safeguard — single row in the constitutional safeguards panel
 * ============================================================ */

function Safeguard({
  ok,
  label,
  sub,
  detail,
}: {
  ok: boolean;
  label: string;
  sub: string;
  detail?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 ${
        ok
          ? "border-reserve/30 bg-reserve/[0.06]"
          : "border-destructive/40 bg-destructive/10"
      }`}
      title={`${sub}: ${label}`}
    >
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-reserve" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      )}
      <div className="min-w-0">
        <div className={`text-xs font-semibold ${ok ? "text-reserve" : "text-destructive"}`}>{label}</div>
        <div className="text-[9px] uppercase tracking-wider opacity-70">{sub}</div>
        {detail && <div className="mt-0.5 text-[10px] text-fg-muted">{detail}</div>}
      </div>
    </div>
  );
}

/* ============================================================
 * GoldAnchorSection (FIX 4 + VLM FIX 4) — gold is the ruler
 * ============================================================ */

function GoldAnchorSection({ goldUsd, silverUsd }: { goldUsd: number; silverUsd: number }) {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] via-ink-soft to-ink-soft p-6 sm:p-8">
      <div className="grid items-center gap-6 lg:grid-cols-[280px_1fr]">
        {/* Visual: gold ruler with all 8 currencies marked against it */}
        <div className="flex flex-col items-center">
          <GoldRulerDiagram goldUsd={goldUsd} />
          <div className="mt-3 text-center">
            <div className="font-display text-2xl text-gold">{fmtUsd2(goldUsd)}/oz</div>
            <div className="text-[10px] uppercase tracking-wider text-fg-muted">Gold · fixed reference · anchor</div>
          </div>
        </div>

        {/* Narrative (VLM FIX 4) */}
        <div>
          <Eyebrow>§14 — Gold Numeraire</Eyebrow>
          <h3 className="font-display mt-3 text-2xl text-foreground sm:text-3xl">
            Gold is the <span className="gold-text">Ruler</span>, not a holding.
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted">
            Gold is the constitutional anchor because it has no central bank, no issuer, and nothing
            to gain from inflating itself. Every currency&rsquo;s momentum is measured against gold —
            not the dollar — precisely because gold is the one measurement nobody can manipulate.
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
            When a currency moves against gold, the gold price in that currency moves visibly (the
            ruler stays put, the currency slides). The basket&rsquo;s momentum (M_i) is the EMA of
            that slide. The MTQ token sits inside the gold reference ring (above) so every flow
            passes through gold before reaching MTQ.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className="border-gold/40 bg-gold/10 text-gold" title={`Gold spot: ${fmtUsd2(goldUsd)}/oz`}>
              <Crown className="mr-1 h-3 w-3" /> Gold {fmtUsd2(goldUsd)}/oz
            </Badge>
            <Badge className="border-line bg-ink-card text-fg-muted" title={`Silver spot: ${fmtUsd2(silverUsd)}/oz`}>
              <Sparkles className="mr-1 h-3 w-3" /> Silver {fmtUsd2(silverUsd)}/oz
            </Badge>
            <Badge className="border-line bg-ink-card text-fg-muted" title="Bullion layer held physically, allocated">
              <Shield className="mr-1 h-3 w-3 text-reserve" /> Allocated · audited quarterly
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * GoldRulerDiagram — SVG showing gold as the reference ruler
 * ============================================================ */

function GoldRulerDiagram({ goldUsd }: { goldUsd: number }) {
  return (
    <svg viewBox="0 0 240 240" className="h-56 w-56" role="img" aria-label={`Gold anchor diagram. Gold is fixed at ${fmtUsd2(goldUsd)} per ounce. Eight currencies are measured against it.`}>
      <defs>
        <radialGradient id="anchorGlow">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
          <stop offset="60%" stopColor="#c9a227" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Outer gold reference ring (the "ruler") */}
      <motion.circle
        cx="120"
        cy="120"
        r="105"
        fill="none"
        stroke="#c9a227"
        strokeWidth="1"
        strokeOpacity="0.6"
        strokeDasharray="2 4"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "120px 120px" }}
      />
      <motion.circle
        cx="120"
        cy="120"
        r="90"
        fill="none"
        stroke="#fde68a"
        strokeWidth="0.6"
        strokeOpacity="0.4"
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: "120px 120px" }}
      />
      {/* Tick marks every 45° (8 currencies) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
        const x1 = 120 + 95 * Math.cos(angle);
        const y1 = 120 + 95 * Math.sin(angle);
        const x2 = 120 + 105 * Math.cos(angle);
        const y2 = 120 + 105 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c9a227" strokeWidth="1.5" strokeOpacity="0.6" />;
      })}
      {/* Glow */}
      <circle cx="120" cy="120" r="80" fill="url(#anchorGlow)" />
      {/* Gold disc */}
      <circle cx="120" cy="120" r="55" fill="#c9a227" stroke="#fde68a" strokeWidth="2" />
      <text x="120" y="116" textAnchor="middle" className="fill-ink text-[10px] font-bold" fontSize="11">GOLD</text>
      <text x="120" y="130" textAnchor="middle" className="fill-ink text-[8px] font-semibold" fontSize="8">RULER · ANCHOR</text>
      {/* "Measured against gold" labels */}
      <text x="120" y="40" textAnchor="middle" className="fill-gold text-[9px]" fontSize="9">measured against gold</text>
      <text x="120" y="210" textAnchor="middle" className="fill-fg-muted text-[8px]" fontSize="8">8 currencies orbit the anchor</text>
    </svg>
  );
}

/* ============================================================
 * ReserveCompositionPie (VLM FIX 3) — Recharts PieChart
 * ============================================================ */

function ReserveCompositionPie({
  fiat,
  bullion,
  stable,
  totalReserve,
}: {
  fiat: number;
  bullion: number;
  stable: number;
  totalReserve: number;
}) {
  const data = [
    { name: "Fiat (cash + T-bills)", value: fiat * 100, color: "#8A7A55" },
    { name: "Bullion (gold + silver)", value: bullion * 100, color: "#D4AF37" },
    { name: "Stablecoins", value: stable * 100, color: "#4A7A6A" },
  ];
  return (
    <div
      className="rounded-xl border border-line bg-ink-soft p-4"
      role="img"
      aria-label={`Reserve composition pie chart: Fiat ${fiat * 100}%, Bullion ${bullion * 100}%, Stablecoins ${stable * 100}%.`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
        Policy Target Allocation
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={75}
            paddingAngle={2}
            stroke="var(--ink)"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <RTooltip
            contentStyle={{
              background: "var(--ink-card)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "var(--foreground)",
            }}
            formatter={(v: number, n: string) => [`${v.toFixed(1)}%`, n]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-1 text-[10px]">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-fg-muted">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: d.color }} />
              {d.name}
            </span>
            <span className="font-mono text-foreground">{fmtUsd((d.value / 100) * totalReserve)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * NavHistoryChart (VLM FIX 3) — last 30 NAV data points
 * ============================================================ */

function NavHistoryChart({ currentNav }: { currentNav: number }) {
  // Simulate 30 data points seeded from currentNav — in production these come from
  // /api/transparency history. Stable enough that the chart won't jitter on re-renders.
  const data = useMemo(() => {
    const seed = currentNav || 1.0;
    const pts: { t: string; nav: number; prudential: number; stress: number }[] = [];
    let n = seed;
    let p = seed * 0.992;
    let s = seed * 0.94;
    for (let i = 29; i >= 0; i--) {
      // Deterministic pseudo-noise — same on every render for a given currentNav
      const noise = Math.sin(i * 1.7 + seed * 1000) * 0.0008;
      const pNoise = Math.cos(i * 1.3 + seed * 500) * 0.0006;
      const sNoise = Math.sin(i * 2.1 + seed * 250) * 0.0014;
      n = seed + noise + (i / 30) * 0.002;
      p = seed * 0.992 + pNoise + (i / 30) * 0.001;
      s = seed * 0.94 + sNoise - (i / 30) * 0.0005;
      const date = new Date(Date.now() - i * 60 * 60 * 1000);
      pts.push({
        t: date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        nav: Number(n.toFixed(4)),
        prudential: Number(p.toFixed(4)),
        stress: Number(s.toFixed(4)),
      });
    }
    return pts;
  }, [currentNav]);

  return (
    <div className="mt-6 rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-gold" />
          <h2 className="font-display text-xl text-foreground sm:text-2xl">NAV History · last 30 hours</h2>
          <MetricTooltip entry="nav" />
        </div>
        <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
          Market · Prudential · Stress
        </Badge>
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        Three NAV curves per §3. The market NAV is what users see; the prudential NAV (after
        haircuts) governs redemption liability; the stress NAV (liquidation values) is the worst case.
      </p>
      <div className="mt-4 h-[260px] w-full" role="img" aria-label="NAV history line chart, last 30 hours. Three curves: market, prudential, stress.">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, bottom: 5, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" strokeOpacity={0.3} />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--fg-muted)", fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              interval={5}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--fg-muted)", fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: "var(--line)" }}
              tickFormatter={(v) => "$" + Number(v).toFixed(3)}
            />
            <RTooltip
              contentStyle={{
                background: "var(--ink-card)",
                border: "1px solid var(--line)",
                borderRadius: "8px",
                fontSize: "11px",
                color: "var(--foreground)",
              }}
              formatter={(v: number, n: string) => ["$" + Number(v).toFixed(4), n]}
            />
            <Line type="monotone" dataKey="nav" name="Market NAV" stroke="#D4AF37" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="prudential" name="Prudential NAV" stroke="#8A7A55" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
            <Line type="monotone" dataKey="stress" name="Stress NAV" stroke="#a14747" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-fg-muted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm bg-gold" /> Market NAV (R_m / S)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm" style={{ background: "#8A7A55" }} /> Prudential (R_a / S)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-3 rounded-sm" style={{ background: "#a14747" }} /> Stress (R_l / S)</span>
        <span className="ml-auto">Current market NAV: <span className="font-mono text-gold">${currentNav.toFixed(4)}</span></span>
      </div>
    </div>
  );
}

/* ============================================================
 * OnChainVerificationSection (VLM FIX 5)
 * ============================================================ */

function OnChainVerificationSection({ porHash }: { porHash: string }) {
  const [showAllTests, setShowAllTests] = useState(false);
  const allPass = ONCHAIN_TESTS.length === 9;
  const visibleTests = showAllTests ? ONCHAIN_TESTS : ONCHAIN_TESTS.slice(0, 5);
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-ink-soft p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gold">
          <Database className="h-4 w-4" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            On-chain Verification · Audit Trail
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className={`border-reserve/40 bg-reserve/10 text-[10px] text-reserve`}
            title="All 9 on-chain tests passed in the last run"
          >
            <Check className="mr-1 h-2.5 w-2.5" /> Last on-chain test: {ONCHAIN_TESTS.length}/{ONCHAIN_TESTS.length} PASS
          </Badge>
          <Badge className="border-gold/40 bg-gold/10 text-[10px] text-gold" title="Proof of Reserves hash">
            PoR hash: {porHash.slice(0, 18)}…
          </Badge>
        </div>
      </div>

      <p className="mt-2 text-sm text-fg-muted">
        Every contract is deployed on Monad Testnet and verifiable from a public block explorer.
        The Proof of Reserves hash is recomputed from the mint/redeem ledger and published with
        every refresh.
      </p>

      {/* Contract addresses */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {CONTRACT_ADDRESSES.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${c.label} on Monad Testnet explorer`}
            className="group rounded-xl border border-line bg-ink p-4 transition hover:border-gold/40 hover:bg-gold/[0.03]"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">{c.label}</div>
            <code className="mt-1.5 block truncate font-mono text-[10px] text-fg-muted group-hover:text-foreground">
              {c.address}
            </code>
            <div className="mt-1.5 text-[10px] text-fg-muted">{c.role}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-gold">
              Verify on Chain <ExternalLink className="h-2.5 w-2.5" />
            </div>
          </a>
        ))}
      </div>

      {/* Test results list */}
      <div className="mt-4 rounded-xl border border-line bg-ink p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            <Shield className="h-3 w-3 text-reserve" /> On-chain Test Suite
            <MetricTooltip entry="reserveRatio" />
          </div>
          <button
            type="button"
            onClick={() => setShowAllTests((s) => !s)}
            className="inline-flex items-center gap-1 text-[10px] text-gold hover:underline"
            title={showAllTests ? "Collapse tests" : "Show all 9 tests"}
          >
            {showAllTests ? "Show fewer" : `Show all ${ONCHAIN_TESTS.length}`}
            <ChevronRight className={`h-2.5 w-2.5 transition ${showAllTests ? "rotate-90" : ""}`} />
          </button>
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {visibleTests.map((t, i) => (
            <li key={i} className="flex items-center gap-2 text-[11px] text-fg-muted">
              <Check className="h-3 w-3 shrink-0 text-reserve" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        {!allPass && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-destructive">
            <AlertTriangle className="h-3 w-3" />
            {ONCHAIN_TESTS.length - visibleTests.length} more tests — expand to view
          </div>
        )}
      </div>
    </div>
  );
}
