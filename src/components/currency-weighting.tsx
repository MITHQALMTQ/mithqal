"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  useAnimationFrame,
  type MotionValue,
} from "framer-motion";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Coins, TrendingUp, TrendingDown, Activity, Zap, ArrowRight,
  Crown, Gauge, HelpCircle, ShieldCheck, AlertTriangle,
} from "lucide-react";

/* ---- Types (matches /api/transparency monetary.weights) ---- */
interface CurrencyWeight {
  code: string;
  name: string;
  structuralWeight: number; // C_i (§13) — 0..1
  normalizedWeight: number; // W_i (§20) — 0..1
  momentum: number; // M_i (§15) — clamped [0.95, 1.05]
  kFactor: number; // K_i (§17) — shock adjusted
  goldPrice: number; // GoldPrice_i (§14) — gold in this currency
  isCapped?: boolean;
  belowFloor?: boolean;
  meanReversion?: number;
  liquidity?: number;
}

interface WeightingData {
  goldUsd: number;
  silverUsd: number;
  weights: CurrencyWeight[];
  basketVerification: { passed: boolean; sumIsOne: boolean; allAboveFloor?: boolean; allBelowCap?: boolean };
  shockAbsorber: number;
}

/* ---- Constants for the 8-currency basket ---- */
const CURRENCY_META: Record<string, { name: string; flag: string; color: string; region: string }> = {
  USD: { name: "US Dollar",      flag: "🇺🇸", color: "#22c55e", region: "North America" },
  EUR: { name: "Euro",           flag: "🇪🇺", color: "#3b82f6", region: "European Union" },
  JPY: { name: "Japanese Yen",   flag: "🇯🇵", color: "#ef4444", region: "East Asia" },
  GBP: { name: "Pound Sterling", flag: "🇬🇧", color: "#a855f7", region: "Europe" },
  CNY: { name: "Chinese Yuan",   flag: "🇨🇳", color: "#facc15", region: "East Asia" },
  CHF: { name: "Swiss Franc",    flag: "🇨🇭", color: "#e5e7eb", region: "Europe" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺", color: "#f97316", region: "Oceania" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦", color: "#ec4899", region: "North America" },
};

/* ---- Formula glossary (VLM FIX 2: tooltips / definitions) ---- */
const FORMULAS: Record<string, { section: string; formula: string; desc: string }> = {
  momentum: {
    section: "§15 — Momentum (M_i)",
    formula: "M_i = clamp(EMA(ΔGoldPrice_i, 12mo), 0.95, 1.05)",
    desc: "12-month EMA of the currency's price change versus gold. Clamped to [0.95, 1.05] so no single currency can dominate or vanish from the basket.",
  },
  shockFactor: {
    section: "§17.7 — Shock-Adjusted Factor (K_i)",
    formula: "K_i = 1 + A_t × (M_i × R_i − 1)",
    desc: "Momentum × mean-reversion, dampened by the shock absorber A_t. When volatility is high (σ ≥ 5%), A_t decreases toward 0.5, halving momentum's effect on the weight. When volatility is normal (σ ≤ 2%), A_t = 1.0 and momentum passes through fully.",
  },
  structural: {
    section: "§13 — Structural Weight (C_i)",
    formula: "C_i = α·COFER + β·SWIFT + γ·BIS",
    desc: "Composite of IMF COFER (α=0.50), SWIFT RMBI (β=0.40), and BIS Triennial flows (γ=0.10). Normalized so the 8 currencies sum to 100%.",
  },
  normalized: {
    section: "§20 — Normalized Weight (W_i)",
    formula: "W_i = C_i × K_i × L_i,  Σ W_i = 100%",
    desc: "Final live weight after applying momentum, shock absorber, and liquidity overlay. Iteratively renormalized and cap/floor-bounded (§22A).",
  },
  liquidity: {
    section: "§18 — Liquidity Overlay (L_i)",
    formula: "L_i = 1 + η × ((RelLiq − Median) / MAD)",
    desc: "Adjusts each currency for its relative FX turnover vs the basket median. Tight-spread currencies gain share; illiquid ones lose it.",
  },
  meanReversion: {
    section: "§16 — Mean Reversion (R_i, η)",
    formula: "R_i = 1 + η × (1 − M_i),  η ∈ [0.01, 0.10]",
    desc: "Pulls each currency back toward its long-term average. η = 0.05 is the policy default; the Council may raise it under stress.",
  },
  goldPrice: {
    section: "§14 — Gold Numeraire",
    formula: "GoldPrice_i = GoldUSD ÷ FX_i",
    desc: "Gold is the unit of account. Each currency is priced in gold — not the dollar — because no central bank can mint or inflate gold.",
  },
  cap: {
    section: "§22A — Cap",
    formula: "W_i ≤ 60% (USD)",
    desc: "No currency may exceed 60% of the basket. Excess share is redistributed proportionally to the others.",
  },
  floor: {
    section: "§22A — Floor",
    formula: "W_i ≥ 0.5%",
    desc: "No currency may fall below 0.5% of the basket. Floor-bound currencies are flagged for Council review.",
  },
};

/* ---- Helpers ---- */
const fmtPct = (n: number, digits = 2) => `${(n * 100).toFixed(digits)}%`;
const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
// fmtUsd2 forces 2 decimals (e.g. $4,053.70) — used for gold spot price so
// trailing zeros are preserved (audit fix 10: avoid "$4,053.7" display).
const fmtUsd2 = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
 * CurrencyWeightingIntro — Animated educational visualization
 *
 * Shows how the 8-currency basket works:
 *   1. Gold is the anchor (§14)
 *   2. Each currency has a structural weight (§13) based on COFER + SWIFT + BIS
 *   3. Weights get adjusted by momentum (§15), mean reversion (§16),
 *      shock absorber (§17), and liquidity (§18)
 *   4. Final normalized weights sum to 100% (§20)
 *   5. When a currency drops, its momentum falls → its weight decreases
 *   6. Gold + silver are the reserve backbone — their price drives NAV
 * ============================================================ */

export function CurrencyWeightingIntro({ data }: { data: WeightingData | null }) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>("USD");
  const [hoveredCurrency, setHoveredCurrency] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<"intro" | "live" | "shock">("intro");

  // Cycle through educational phases
  useEffect(() => {
    const phases: typeof animationPhase[] = ["intro", "live", "shock"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phases.length;
      setAnimationPhase(phases[i]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const weights = data?.weights ?? [];
  const goldUsd = data?.goldUsd ?? 4053.70;
  const silverUsd = data?.silverUsd ?? 58.28;

  const selected = weights.find((w) => w.code === selectedCurrency) ?? weights[0];

  // Compute cap/floor status for the live basket (FIX 3)
  const maxWeight = weights.length ? Math.max(...weights.map((w) => w.normalizedWeight)) : 0;
  const minWeight = weights.length ? Math.min(...weights.map((w) => w.normalizedWeight)) : 0;
  const totalSum = weights.reduce((s, w) => s + w.normalizedWeight, 0);
  const capOk = maxWeight <= 0.60;
  const floorOk = minWeight >= 0.005;
  const sumOk = Math.abs(totalSum - 1) < 0.0001;
  const cappedCcy = weights.find((w) => w.isCapped);
  const floorCcy = weights.find((w) => w.belowFloor);

  return (
    <div className="relative">
      {/* Header + Cap/Floor Status indicators */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            The Currency Weighting Engine
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            How 8 currencies, gold, and silver combine to form MTQ&rsquo;s value
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PhaseIndicator phase={animationPhase} />
        </div>
      </div>

      {/* Constitutional Safeguards status strip (FIX 3) */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SafeguardPill
          ok={capOk}
          label={capOk ? "No currency >60%" : `${cappedCcy?.code ?? "USD"} capped at 60%`}
          sub="§22A Cap"
        />
        <SafeguardPill
          ok={floorOk}
          label={floorOk ? "All currencies >0.5%" : `${floorCcy?.code ?? "CAD"} at 0.5% floor`}
          sub="§22A Floor"
        />
        <SafeguardPill
          ok={sumOk}
          label={sumOk ? "Σ weights = 100%" : `Σ = ${(totalSum * 100).toFixed(2)}%`}
          sub="Normalization"
        />
        <SafeguardPill
          ok={!!data?.basketVerification?.passed}
          label={data?.basketVerification?.passed ? "Basket verification PASS" : "Basket verification FAIL"}
          sub="§22A Gate"
        />
      </div>

      {/* Main diagram — the connection web */}
      <div className="overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-ink-soft via-background to-ink-card p-6 sm:p-8">
        <HolographicConstellation
          weights={weights}
          goldUsd={goldUsd}
          silverUsd={silverUsd}
          selected={selectedCurrency}
          hovered={hoveredCurrency}
          onSelect={setSelectedCurrency}
          onHover={setHoveredCurrency}
          phase={animationPhase}
        />
      </div>

      {/* Gold anchor narrative (VLM FIX 4) */}
      <GoldAnchorCallout goldUsd={goldUsd} />

      {/* Explanatory cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ConceptCard
          icon={<Crown className="h-5 w-5 text-gold" />}
          title="Gold is the Anchor"
          desc="Gold is the numeraire (§14). Every currency is priced in gold terms — GoldPrice_i = GoldUSD / FX_i. When gold rises, every currency's gold price rises."
          formula="GoldPrice_i = GoldUSD ÷ FX_i"
          tooltipKey="goldPrice"
        />
        <ConceptCard
          icon={<Gauge className="h-5 w-5 text-reserve" />}
          title="Structural Weight (§13)"
          desc="Each currency starts with a base weight from 3 sources: COFER (40%), SWIFT (40%), BIS flows (20%). USD dominates at ~47%, reflecting its reserve status."
          formula="C_i = α·COFER + β·SWIFT + γ·BIS"
          tooltipKey="structural"
        />
        <ConceptCard
          icon={<Activity className="h-5 w-5 text-blue-400" />}
          title="Adjusted Weight (§19-20)"
          desc="Structural weight × momentum × shock absorber × liquidity → normalized so all 8 sum to exactly 100%. When a currency drops, its weight shrinks."
          formula="W_i = C_i × K_i × L_i, then Σ W_i = 100%"
          tooltipKey="normalized"
        />
      </div>

      {/* Currency detail panel */}
      {selected && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selected.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6 rounded-xl border border-gold/30 bg-gold/[0.03] p-6"
          >
            <CurrencyDetail
              weight={selected}
              goldUsd={goldUsd}
              silverUsd={silverUsd}
              shockAbsorber={data?.shockAbsorber ?? 0}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* How a currency drop affects MTQ */}
      <div className="mt-6 overflow-hidden rounded-xl border border-line bg-ink-soft p-6">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-gold" />
          <h3 className="font-display text-lg text-foreground">
            What happens when a currency drops?
          </h3>
        </div>
        <ShockCascadeDiagram weights={weights} />
      </div>

      {/* Real data sources label (FIX 6) */}
      <DataSourcesLabel />
    </div>
  );
}

/* ============================================================
/* ============================================================
 * HolographicConstellation — futuristic 3D-perspective
 * holographic diagram of the Mithqal currency basket:
 *   • Gold core (center, pulsing radial gradient) — §14 anchor
 *   • 8 currency orbs orbit at distances = inverse weight
 *       (heavier currencies orbit CLOSER to gold)
 *   • Each orb rotates at its own speed (heavier = slower)
 *   • MTQ token at the outermost ring — synthesis of all currencies
 *   • Silver satellite orbits MTQ
 *   • Energy beams (linear gradient + glow filter) flow from
 *     each currency to MTQ with animated dash offset
 *   • Gold particles stream along the beams during the live phase
 *   • Dark starfield background (CSS radial-gradient dots) +
 *     moving holographic shimmer overlay
 * ============================================================ */

const STARFIELD: string = (() => {
  // Deterministic pseudo-random star positions (26 dots) — computed once
  // at module load to keep render cheap. Adds a gold core halo at center.
  const layers: string[] = [];
  for (let i = 0; i < 26; i++) {
    const x = (i * 37 + 13) % 100;
    const y = (i * 53 + 7) % 100;
    const sz = i % 4 === 0 ? 2 : 1;
    const op = 0.18 + ((i * 7) % 5) * 0.04;
    layers.push(
      `radial-gradient(${sz}px ${sz}px at ${x}% ${y}%, rgba(255,255,255,${op.toFixed(2)}), transparent)`
    );
  }
  layers.push("radial-gradient(circle at 50% 50%, rgba(201,162,39,0.10), transparent 65%)");
  layers.push("#050810");
  return layers.join(", ");
})();

type OrbWeight = CurrencyWeight & { orbit: number; period: number };

function HolographicConstellation({
  weights,
  goldUsd,
  silverUsd,
  selected,
  hovered,
  onSelect,
  onHover,
  phase,
}: {
  weights: CurrencyWeight[];
  goldUsd: number;
  silverUsd: number;
  selected: string;
  hovered: string | null;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
  phase: "intro" | "live" | "shock";
}) {
  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => b.normalizedWeight - a.normalizedWeight),
    [weights]
  );

  const maxWeight = Math.max(...weights.map((w) => w.normalizedWeight), 0.01);

  // Layout — gold core at the geometric center, currencies on inner orbits
  // (heavier = closer), MTQ on the outermost ring, silver satellite of MTQ.
  const cx = 400;
  const cy = 300;
  const mtqOrbit = 240;
  const mtqAngle = Math.PI / 2; // bottom of the outer ring
  const mtqX = cx + mtqOrbit * Math.cos(mtqAngle);
  const mtqY = cy + mtqOrbit * Math.sin(mtqAngle);

  // Per-currency orbit radii + rotation periods.
  // Heavier currencies orbit CLOSER + SLOWER (more "anchored" to gold).
  const orbs: OrbWeight[] = sortedWeights.map((w, i) => {
    const t = sortedWeights.length > 1 ? i / (sortedWeights.length - 1) : 0;
    const orbit = 100 + t * 100; // 100 → 200
    const period = 28 + i * 7;   // 28s → 77s (heavier = slower)
    return { ...w, orbit, period };
  });

  // One shared clock for the entire diagram — every orb's angle and every
  // particle's progress derives from this single MotionValue, so we register
  // exactly ONE rAF callback per frame regardless of orb count.
  const time: MotionValue<number> = useMotionValue(0);
  useAnimationFrame((t) => time.set(t));

  // Silver satellite orbits MTQ at small radius.
  const silverAngle = useTransform(time, (t) => (t / 1000 / 14) * Math.PI * 2);
  const silverX = useTransform(silverAngle, (a) => mtqX + 36 * Math.cos(a));
  const silverY = useTransform(silverAngle, (a) => mtqY + 36 * Math.sin(a));

  const ariaLabel = `Holographic constellation of the Mithqal currency basket. Gold core at ${fmtUsd2(
    goldUsd
  )} per ounce pulsing at the center, the constitutional anchor. ${weights.length} currencies orbit gold at different distances — heavier currencies orbit closer. ${weights
    .map((w) => `${w.code} at ${(w.normalizedWeight * 100).toFixed(2)}%`)
    .join(", ")}. MTQ token sits on the outermost ring as the synthesis of all currencies. Silver at ${fmtUsd2(
    silverUsd
  )} per ounce orbits MTQ as a satellite. Energy beams flow from each currency to MTQ, with gold particles streaming during live data flow.`;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Starfield background — radial-gradient dots over near-black */}
      <div
        className="absolute inset-0"
        style={{ background: STARFIELD }}
        aria-hidden="true"
      />

      {/* Holographic shimmer — slowly moving gold tint overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(45deg, transparent 30%, rgba(201,162,39,0.06) 50%, transparent 70%)",
          backgroundSize: "300% 300%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 800 600"
        className="relative w-full"
        role="img"
        aria-label={ariaLabel}
        style={{ transform: "perspective(1000px) rotateX(15deg)" }}
      >
        <defs>
          {/* Gold core radial gradient */}
          <radialGradient id="goldCore">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
            <stop offset="30%" stopColor="#c9a227" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#8a6d1a" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3a2d0a" stopOpacity="0" />
          </radialGradient>

          {/* MTQ gradient (stronger glow at the synthesis node) */}
          <radialGradient id="mtqCore">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="1" />
            <stop offset="40%" stopColor="#c9a227" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#3a2d0a" stopOpacity="0" />
          </radialGradient>

          {/* Silver gradient */}
          <radialGradient id="silverCore">
            <stop offset="0%" stopColor="#f5f5f4" stopOpacity="1" />
            <stop offset="60%" stopColor="#a8a29e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#44403c" stopOpacity="0" />
          </radialGradient>

          {/* Per-currency orb radial gradients */}
          {orbs.map((o) => {
            const color = CURRENCY_META[o.code]?.color ?? "#888";
            return (
              <radialGradient key={`grad-${o.code}`} id={`grad-${o.code}`}>
                <stop offset="0%" stopColor={color} stopOpacity="1" />
                <stop offset="55%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            );
          })}

          {/* Per-currency energy-beam gradients (currency color → gold) */}
          {orbs.map((o) => {
            const color = CURRENCY_META[o.code]?.color ?? "#888";
            return (
              <linearGradient
                key={`beam-${o.code}`}
                id={`beam-${o.code}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.85" />
                <stop offset="100%" stopColor="#c9a227" stopOpacity="0.85" />
              </linearGradient>
            );
          })}

          {/* Generic orb glow filter */}
          <filter id="orbGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Strong glow for gold core + MTQ */}
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint dashed orbit rings — one per currency + MTQ's outer ring */}
        {orbs.map((o) => (
          <motion.circle
            key={`orbit-${o.code}`}
            cx={cx}
            cy={cy}
            r={o.orbit}
            fill="none"
            stroke={CURRENCY_META[o.code]?.color ?? "#888"}
            strokeOpacity={0.1}
            strokeWidth={0.6}
            strokeDasharray="2 5"
            animate={{ rotate: 360 }}
            transition={{ duration: 90 + o.orbit, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}
        <motion.circle
          cx={cx}
          cy={cy}
          r={mtqOrbit}
          fill="none"
          stroke="#c9a227"
          strokeOpacity={0.15}
          strokeWidth={0.7}
          strokeDasharray="3 6"
          animate={{ rotate: -360 }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />

        {/* Energy beams (currency → MTQ). Rendered before orbs so orbs sit on top. */}
        {orbs.map((o) => (
          <CurrencyBeam
            key={`beam-line-${o.code}`}
            c={o}
            cx={cx}
            cy={cy}
            mtqX={mtqX}
            mtqY={mtqY}
            time={time}
            maxWeight={maxWeight}
            isSelected={o.code === selected}
            isHovered={o.code === hovered}
            phase={phase}
          />
        ))}

        {/* Currency orbs */}
        {orbs.map((o, i) => (
          <CurrencyOrb
            key={o.code}
            c={o}
            cx={cx}
            cy={cy}
            time={time}
            maxWeight={maxWeight}
            isSelected={o.code === selected}
            isHovered={o.code === hovered}
            index={i}
            onSelect={onSelect}
            onHover={onHover}
          />
        ))}

        {/* MTQ token — synthesis node on the outermost ring */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ transformOrigin: `${mtqX}px ${mtqY}px` }}
        >
          {/* Pulsing outer aura */}
          <motion.circle
            cx={mtqX}
            cy={mtqY}
            r={55}
            fill="url(#mtqCore)"
            animate={{ r: [50, 60, 50], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Counter-rotating reference rings */}
          <motion.circle
            cx={mtqX}
            cy={mtqY}
            r={38}
            fill="none"
            stroke="#fde68a"
            strokeWidth={1}
            strokeOpacity={0.55}
            strokeDasharray="3 3"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${mtqX}px ${mtqY}px` }}
          />
          <motion.circle
            cx={mtqX}
            cy={mtqY}
            r={44}
            fill="none"
            stroke="#c9a227"
            strokeWidth={0.6}
            strokeOpacity={0.35}
            animate={{ rotate: -360 }}
            transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${mtqX}px ${mtqY}px` }}
          />
          {/* MTQ disc */}
          <circle
            cx={mtqX}
            cy={mtqY}
            r={26}
            fill="#c9a227"
            stroke="#fde68a"
            strokeWidth={2}
            filter="url(#strongGlow)"
          />
          <text
            x={mtqX}
            y={mtqY}
            textAnchor="middle"
            dy="0.35em"
            className="fill-ink text-[14px] font-bold"
            fontSize="14"
          >
            MTQ
          </text>
          <text
            x={mtqX}
            y={mtqY}
            textAnchor="middle"
            dy="52px"
            className="fill-gold text-[10px]"
            fontSize="10"
          >
            1 MTQ = basket value
          </text>
        </motion.g>

        {/* Silver satellite — orbits MTQ */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ transformOrigin: `${mtqX}px ${mtqY}px` }}
        >
          {/* Dashed silver→MTQ tether */}
          <motion.line
            x1={silverX}
            y1={silverY}
            x2={mtqX}
            y2={mtqY}
            stroke="#e5e7eb"
            strokeWidth={1.5}
            strokeOpacity={0.55}
            strokeDasharray="4 3"
            animate={{ strokeDashoffset: [0, -14] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <motion.circle cx={silverX} cy={silverY} r={16} fill="url(#silverCore)" filter="url(#orbGlow)" />
          <motion.circle cx={silverX} cy={silverY} r={9} fill="#b8b4ae" stroke="#e5e7eb" strokeWidth={1.5} />
          <motion.text
            x={silverX}
            y={silverY}
            textAnchor="middle"
            dy="0.35em"
            className="fill-ink text-[8px] font-bold"
            fontSize="8"
          >
            Ag
          </motion.text>
          <motion.text
            x={silverX}
            y={silverY}
            textAnchor="middle"
            dy="22px"
            className="fill-fg-muted text-[8px]"
            fontSize="8"
          >
            {fmtUsd2(silverUsd)}/oz
          </motion.text>
        </motion.g>

        {/* Gold core (center) — drawn LAST so it sits on top of crossing beams */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          {/* Pulsing outer aura */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={75}
            fill="url(#goldCore)"
            animate={{ r: [68, 80, 68], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Counter-rotating reference rings around the gold disc */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={44}
            fill="none"
            stroke="#fde68a"
            strokeWidth={1}
            strokeOpacity={0.55}
            strokeDasharray="3 3"
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          <motion.circle
            cx={cx}
            cy={cy}
            r={52}
            fill="none"
            stroke="#c9a227"
            strokeWidth={0.6}
            strokeOpacity={0.35}
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
          {/* Gold disc */}
          <circle
            cx={cx}
            cy={cy}
            r={32}
            fill="#c9a227"
            stroke="#fde68a"
            strokeWidth={2}
            filter="url(#strongGlow)"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dy="0.35em"
            className="fill-ink text-[11px] font-bold"
            fontSize="11"
          >
            GOLD
          </text>
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dy="56px"
            className="fill-gold text-[10px]"
            fontSize="10"
          >
            {fmtUsd2(goldUsd)}/oz · anchor
          </text>
        </motion.g>

        {/* Legend */}
        <text x={20} y={590} className="fill-fg-muted text-[9px]" fontSize="9">
          Orb size + beam width ∝ weight · orbit distance ∝ 1/weight · MTQ = synthesis · Click an orb for details
        </text>
      </svg>
    </div>
  );
}

/* ============================================================
 * CurrencyOrb — single glowing currency node orbiting the gold core.
 * Hooks into the shared `time` MotionValue + derives its own angle.
 * ============================================================ */

function CurrencyOrb({
  c,
  cx,
  cy,
  time,
  maxWeight,
  isSelected,
  isHovered,
  index,
  onSelect,
  onHover,
}: {
  c: OrbWeight;
  cx: number;
  cy: number;
  time: MotionValue<number>;
  maxWeight: number;
  isSelected: boolean;
  isHovered: boolean;
  index: number;
  onSelect: (code: string) => void;
  onHover: (code: string | null) => void;
}) {
  const meta = CURRENCY_META[c.code];
  const color = meta?.color ?? "#888";
  const r = 10 + (c.normalizedWeight / maxWeight) * 14;
  const { orbit, period } = c;

  // Derive the orb's instantaneous position from the shared clock.
  const orbX = useTransform(time, (t) => {
    const a = (t / 1000 / period) * Math.PI * 2;
    return cx + orbit * Math.cos(a);
  });
  const orbY = useTransform(time, (t) => {
    const a = (t / 1000 / period) * Math.PI * 2;
    return cy + orbit * Math.sin(a);
  });

  const isHighlighted = isSelected || isHovered;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 + index * 0.06 }}
      style={{ cursor: "pointer", outline: "none" }}
      onClick={() => onSelect(c.code)}
      onMouseEnter={() => onHover(c.code)}
      onMouseLeave={() => onHover(null)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(c.code);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${c.code} — ${meta?.name ?? c.code}: ${(c.normalizedWeight * 100).toFixed(2)}% of basket. Press Enter for details.`}
    >
      {/* Selection halo */}
      {isSelected && (
        <motion.circle
          cx={orbX}
          cy={orbY}
          r={r + 6}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeOpacity={0.55}
          animate={{ r: [r + 4, r + 11, r + 4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Glow halo (radial gradient fill) */}
      <motion.circle
        cx={orbX}
        cy={orbY}
        r={r + 8}
        fill={`url(#grad-${c.code})`}
        opacity={isHighlighted ? 0.95 : 0.65}
      />

      {/* Solid core */}
      <motion.circle
        cx={orbX}
        cy={orbY}
        r={r}
        fill={color}
        fillOpacity={isHighlighted ? 0.5 : 0.28}
        stroke={color}
        strokeWidth={isSelected ? 2.2 : 1.2}
        filter="url(#orbGlow)"
      />

      {/* Code label (vertically centered on the orb) */}
      <motion.text
        x={orbX}
        y={orbY}
        textAnchor="middle"
        dy="0.35em"
        className="fill-foreground text-[10px] font-bold"
        fontSize="10"
      >
        {c.code}
      </motion.text>

      {/* Weight label (below the orb) */}
      <motion.text
        x={orbX}
        y={orbY}
        textAnchor="middle"
        dy={`${r + 12}px`}
        className="fill-fg-muted text-[8px]"
        fontSize="8"
      >
        {fmtPct(c.normalizedWeight, 1)}
      </motion.text>

      {/* Cap / Floor markers (above the orb) */}
      {c.isCapped && (
        <motion.text
          x={orbX}
          y={orbY}
          textAnchor="middle"
          dy={`${-(r + 4)}px`}
          className="fill-gold text-[8px] font-bold"
          fontSize="8"
        >
          CAP
        </motion.text>
      )}
      {c.belowFloor && (
        <motion.text
          x={orbX}
          y={orbY}
          textAnchor="middle"
          dy={`${-(r + 4)}px`}
          className="fill-destructive text-[8px] font-bold"
          fontSize="8"
        >
          FLR
        </motion.text>
      )}
    </motion.g>
  );
}

/* ============================================================
 * CurrencyBeam — energy beam from a currency orb to the MTQ node,
 * with a flowing gold particle during the "live" phase.
 * ============================================================ */

function CurrencyBeam({
  c,
  cx,
  cy,
  mtqX,
  mtqY,
  time,
  maxWeight,
  isSelected,
  isHovered,
  phase,
}: {
  c: OrbWeight;
  cx: number;
  cy: number;
  mtqX: number;
  mtqY: number;
  time: MotionValue<number>;
  maxWeight: number;
  isSelected: boolean;
  isHovered: boolean;
  phase: "intro" | "live" | "shock";
}) {
  const isHighlighted = isSelected || isHovered;
  const { orbit, period } = c;

  // Match the orb's instantaneous position so the beam endpoint tracks it.
  const orbX = useTransform(time, (t) => {
    const a = (t / 1000 / period) * Math.PI * 2;
    return cx + orbit * Math.cos(a);
  });
  const orbY = useTransform(time, (t) => {
    const a = (t / 1000 / period) * Math.PI * 2;
    return cy + orbit * Math.sin(a);
  });

  // Particle progresses along the beam (currency → MTQ) on a 2.2s cycle,
  // offset per currency so they don't all sync visually.
  const progress = useTransform(
    time,
    (t) => (t / 2200 + c.code.charCodeAt(0) * 0.07) % 1
  );
  const particleX = useTransform([orbX, progress], (vals: number[]) =>
    vals[0] + (mtqX - vals[0]) * vals[1]
  );
  const particleY = useTransform([orbY, progress], (vals: number[]) =>
    vals[0] + (mtqY - vals[0]) * vals[1]
  );

  const strokeWidth = Math.max(1, (c.normalizedWeight / maxWeight) * 4);
  const baseOpacity = isHighlighted ? 0.85 : 0.35;
  const beamOpacity = phase === "shock" && !isHighlighted ? 0.15 : baseOpacity;

  return (
    <>
      <motion.line
        x1={orbX}
        y1={orbY}
        x2={mtqX}
        y2={mtqY}
        stroke={`url(#beam-${c.code})`}
        strokeWidth={strokeWidth}
        strokeOpacity={beamOpacity}
        strokeDasharray="6 4"
        animate={{ strokeDashoffset: [0, -20] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        filter="url(#orbGlow)"
      />
      {phase === "live" && (
        <motion.circle
          cx={particleX}
          cy={particleY}
          r={2.2}
          fill="#fde68a"
          filter="url(#orbGlow)"
        />
      )}
    </>
  );
}

/* ============================================================
 * CurrencyDetail — expanded panel for the selected currency
 * ============================================================ */

function CurrencyDetail({
  weight,
  goldUsd,
  silverUsd,
  shockAbsorber,
}: {
  weight: CurrencyWeight;
  goldUsd: number;
  silverUsd: number;
  shockAbsorber: number;
}) {
  const meta = CURRENCY_META[weight.code];
  const goldPriceInCurrency = weight.goldPrice || goldUsd;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label={`${meta?.name} flag`}>{meta?.flag}</span>
          <div>
            <div className="font-display text-lg text-foreground">
              {meta?.name} ({weight.code})
            </div>
            <div className="text-xs text-fg-muted">{meta?.region}</div>
          </div>
        </div>
        <Badge className="border-gold/40 bg-gold/10 text-gold">
          {fmtPct(weight.normalizedWeight)} of basket
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DetailStat
          label="Structural Weight"
          value={fmtPct(weight.structuralWeight)}
          sub="§13 base"
          tooltipKey="structural"
        />
        <DetailStat
          label="Normalized Weight"
          value={fmtPct(weight.normalizedWeight)}
          sub="§20 final"
          tooltipKey="normalized"
        />
        <DetailStat
          label="Momentum (M_i)"
          value={weight.momentum.toFixed(4)}
          sub="§15 clamped [0.95, 1.05]"
          tooltipKey="momentum"
        />
        <DetailStat
          label="Shock Factor (K_i)"
          value={weight.kFactor.toFixed(4)}
          sub="§17 EWMA"
          tooltipKey="shockFactor"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gold/20 bg-gold/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Crown className="h-3 w-3 text-gold" /> Gold price in {weight.code}
            <MetricTooltip entry="goldPrice" />
          </div>
          <div className="mt-1 font-display text-lg text-gold">
            {goldPriceInCurrency.toLocaleString("en-US", { maximumFractionDigits: 2 })} {weight.code}/oz
          </div>
          <div className="text-[10px] text-fg-muted">
            = {fmtUsd2(goldUsd)} USD/oz ÷ FX rate
          </div>
        </div>
        <div className="rounded-lg border border-line bg-ink-card p-3">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Activity className="h-3 w-3 text-blue-400" /> Shock Absorber (A_t)
            <MetricTooltip entry="shockFactor" />
          </div>
          <div className="mt-1 font-display text-lg text-foreground">
            A_t = {shockAbsorber.toFixed(3)}
          </div>
          <div className="text-[10px] text-fg-muted">
            {shockAbsorber >= 0.5 ? "High volatility — momentum dampened" : "Normal — full momentum"}
          </div>
        </div>
      </div>

      {/* Silver reference is informational only — passed for context */}
      <div className="mt-3 text-[10px] text-fg-muted">
        Silver reference: {fmtUsd(silverUsd)}/oz — used in the bullion reserve layer, not in the FX basket.
      </div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  sub,
  tooltipKey,
}: {
  label: string;
  value: string;
  sub?: string;
  tooltipKey?: keyof typeof FORMULAS;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
        <span>{label}</span>
        {tooltipKey && <MetricTooltip entry={tooltipKey} />}
      </div>
      <div className="mt-1 font-display text-lg text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-fg-muted">{sub}</div>}
    </div>
  );
}

/* ============================================================
 * SafeguardPill — cap/floor status indicator (FIX 3)
 * ============================================================ */

function SafeguardPill({ ok, label, sub }: { ok: boolean; label: string; sub: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        ok
          ? "border-reserve/30 bg-reserve/[0.06] text-reserve"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      }`}
      title={`${sub}: ${label}`}
    >
      {ok ? <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
      <div className="min-w-0">
        <div className="truncate font-semibold">{label}</div>
        <div className="text-[9px] uppercase tracking-wider opacity-70">{sub}</div>
      </div>
    </div>
  );
}

/* ============================================================
 * GoldAnchorCallout — "Why Gold?" narrative (VLM FIX 4)
 * ============================================================ */

function GoldAnchorCallout({ goldUsd }: { goldUsd: number }) {
  return (
    <Reveal delay={0.05}>
      <div className="mt-4 overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-r from-gold/[0.08] via-gold/[0.04] to-transparent p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <Crown className="h-5 w-5 text-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-display text-base text-gold sm:text-lg">Why gold?</h4>
              <Badge className="border-gold/40 bg-gold/10 text-[10px] text-gold" title={`Gold anchor: ${fmtUsd2(goldUsd)}/oz`}>
                {fmtUsd2(goldUsd)}/oz · anchor
              </Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
              Gold is the constitutional anchor because it has no central bank, no issuer, and nothing
              to gain from inflating itself. Every currency&rsquo;s momentum is measured against gold —
              not the dollar — precisely because gold is the one measurement nobody can manipulate.
            </p>
            <p className="mt-2 text-xs text-gold-soft">
              Gold is the <span className="font-semibold">ruler</span>, not a holding. The MTQ node sits
              inside a gold reference ring (above) to make this visible: every currency flows through
              gold before reaching MTQ.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
 * ShockCascadeDiagram — shows what happens when a currency drops
 * ============================================================ */

function ShockCascadeDiagram({ weights }: { weights: CurrencyWeight[] }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % 5);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: "1. Currency drops", desc: "e.g., EUR falls 5% vs gold", icon: <TrendingDown className="h-4 w-4 text-red-400" /> },
    { label: "2. Momentum falls", desc: "M_i drops below 1.0 → clamped at 0.95", icon: <Gauge className="h-4 w-4 text-orange-400" /> },
    { label: "3. Weight decreases", desc: "W_i = C_i × K_i × L_i shrinks", icon: <Activity className="h-4 w-4 text-yellow-400" /> },
    { label: "4. Others rebalance", desc: "Remaining 7 currencies gain share (Σ = 100%)", icon: <TrendingUp className="h-4 w-4 text-green-400" /> },
    { label: "5. MTQ stable", desc: "Gold anchor absorbs shock — NAV barely moves", icon: <Coins className="h-4 w-4 text-gold" /> },
  ];

  return (
    <div
      className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5"
      role="list"
      aria-label="Five-step shock cascade"
    >
      {steps.map((s, i) => {
        const active = step === i;
        const passed = step > i;
        return (
          <motion.div
            key={i}
            role="listitem"
            className={`rounded-lg border p-3 transition-all ${
              active
                ? "border-gold/50 bg-gold/10"
                : passed
                  ? "border-reserve/30 bg-reserve/5 opacity-60"
                  : "border-line bg-ink-card opacity-40"
            }`}
            animate={{
              scale: active ? 1.03 : 1,
            }}
          >
            <div className="flex items-center gap-2">
              {s.icon}
              <span className="text-xs font-semibold text-foreground">{s.label}</span>
            </div>
            <p className="mt-1 text-[10px] text-fg-muted">{s.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ============================================================
 * ConceptCard — explanatory card with icon + formula + tooltip
 * ============================================================ */

function ConceptCard({
  icon,
  title,
  desc,
  formula,
  tooltipKey,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  formula: string;
  tooltipKey?: keyof typeof FORMULAS;
}) {
  return (
    <Reveal>
      <div className="h-full rounded-xl border border-line bg-ink-soft p-5">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-display text-sm text-foreground">{title}</h4>
          {tooltipKey && <MetricTooltip entry={tooltipKey} />}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-fg-muted">{desc}</p>
        <div className="mt-3 rounded bg-ink-card px-2 py-1.5">
          <code className="text-[10px] text-gold">{formula}</code>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
 * DataSourcesLabel — real data provenance (FIX 6)
 * ============================================================ */

function DataSourcesLabel() {
  const ts = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-line bg-ink-soft px-4 py-3 text-[10px] text-fg-muted sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="font-semibold uppercase tracking-wider text-gold-soft">Data sources:</span>{" "}
        IMF COFER (Q2 2026) · SWIFT RMBI (July 2026) · BIS Triennial (June 2026) · Gold: gold-api.com (live) · Refreshed: {ts}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-reserve" />
        <span>30s auto-refresh</span>
      </div>
    </div>
  );
}

/* ============================================================
 * PhaseIndicator — shows which educational phase is active
 * ============================================================ */

function PhaseIndicator({ phase }: { phase: "intro" | "live" | "shock" }) {
  const labels = {
    intro: "Introduction",
    live: "Live data flow",
    shock: "Shock scenario",
  };
  const colors = {
    intro: "border-gold/40 bg-gold/10 text-gold",
    live: "border-reserve/40 bg-reserve/10 text-reserve",
    shock: "border-red-500/40 bg-red-500/10 text-red-400",
  };

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Badge className={colors[phase]}>{labels[phase]}</Badge>
    </motion.div>
  );
}
