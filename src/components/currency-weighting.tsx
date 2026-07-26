"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import {
  Coins, TrendingUp, TrendingDown, Activity, Zap, ArrowRight,
  Crown, Gauge,
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
}

interface WeightingData {
  goldUsd: number;
  silverUsd: number;
  weights: CurrencyWeight[];
  basketVerification: { passed: boolean; sumIsOne: boolean };
  shockAbsorber: number;
}

/* ---- Constants for the 8-currency basket ---- */
const CURRENCY_META: Record<string, { name: string; flag: string; color: string; region: string }> = {
  USD: { name: "US Dollar",      flag: "🇺🇸", color: "#22c55e", region: "North America" },
  EUR: { name: "Euro",           flag: "🇪🇺", color: "#3b82f6", region: "European Union" },
  JPY: { name: "Japanese Yen",   flag: "🇯🇵", color: "#ef4444", region: "East Asia" },
  GBP: { name: "Pound Sterling",  flag: "🇬🇧", color: "#a855f7", region: "Europe" },
  CNY: { name: "Chinese Yuan",   flag: "🇨🇳", color: "#facc15", region: "East Asia" },
  CHF: { name: "Swiss Franc",    flag: "🇨🇭", color: "#e5e7eb", region: "Europe" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺", color: "#f97316", region: "Oceania" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦", color: "#ec4899", region: "North America" },
};

/* ---- Helpers ---- */
const fmtPct = (n: number, digits = 2) => `${(n * 100).toFixed(digits)}%`;
const fmtUsd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

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

  return (
    <div className="relative">
      {/* Phase indicator */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-foreground sm:text-3xl">
            The Currency Weighting Engine
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            How 8 currencies, gold, and silver combine to form MTQ&rsquo;s value
          </p>
        </div>
        <PhaseIndicator phase={animationPhase} />
      </div>

      {/* Main diagram — the connection web */}
      <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-ink-soft via-background to-ink-card p-6 sm:p-8">
        <ConnectionDiagram
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

      {/* Explanatory cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ConceptCard
          icon={<Crown className="h-5 w-5 text-gold" />}
          title="Gold is the Anchor"
          desc="Gold is the numeraire (§14). Every currency is priced in gold terms — GoldPrice_i = GoldUSD / FX_i. When gold rises, every currency's gold price rises."
          formula="GoldPrice_i = GoldUSD ÷ FX_i"
        />
        <ConceptCard
          icon={<Gauge className="h-5 w-5 text-reserve" />}
          title="Structural Weight (§13)"
          desc="Each currency starts with a base weight from 3 sources: COFER (40%), SWIFT (40%), BIS flows (20%). USD dominates at ~47%, reflecting its reserve status."
          formula="C_i = α·COFER + β·SWIFT + γ·BIS"
        />
        <ConceptCard
          icon={<Activity className="h-5 w-5 text-blue-400" />}
          title="Adjusted Weight (§19-20)"
          desc="Structural weight × momentum × shock absorber × liquidity → normalized so all 8 sum to exactly 100%. When a currency drops, its weight shrinks."
          formula="W_i = C_i × K_i × L_i, then Σ W_i = 100%"
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
    </div>
  );
}

/* ============================================================
 * ConnectionDiagram — SVG animated web showing:
 *   Gold (top center) → 8 currencies (middle ring) → MTQ (bottom)
 *   Silver (side) → MTQ
 *   Currency sizes proportional to weights
 *   Lines thicken/Thin based on weight
 * ============================================================ */

function ConnectionDiagram({
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

  // SVG layout: Gold at top, currencies in a ring, MTQ at bottom
  const cx = 400;
  const cy = 250;
  const ringRadius = 150;
  const goldPos = { x: cx, y: 50 };
  const mtqPos = { x: cx, y: 450 };
  const silverPos = { x: 680, y: 250 };

  // Position currencies in a ring around the center
  const currencyPositions = sortedWeights.map((w, i) => {
    const angle = (i / sortedWeights.length) * 2 * Math.PI - Math.PI / 2;
    return {
      ...w,
      x: cx + ringRadius * Math.cos(angle),
      y: cy + ringRadius * Math.sin(angle),
    };
  });

  const maxWeight = Math.max(...weights.map((w) => w.normalizedWeight), 0.01);

  return (
    <div className="relative">
      <svg viewBox="0 0 800 500" className="w-full">
        {/* Defs — gradients + filters */}
        <defs>
          <radialGradient id="goldGlow">
            <stop offset="0%" stopColor="#c9a227" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#c9a227" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="silverGlow">
            <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#e5e7eb" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mtqGlow">
            <stop offset="0%" stopColor="#c9a227" stopOpacity="1" />
            <stop offset="50%" stopColor="#8a6d1a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3a2d0a" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background pulsing glow on MTQ */}
        <motion.circle
          cx={mtqPos.x}
          cy={mtqPos.y}
          r={80}
          fill="url(#mtqGlow)"
          animate={{
            r: [70, 85, 70],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Lines from Gold → each currency */}
        {currencyPositions.map((c) => {
          const isHighlighted = c.code === selected || c.code === hovered;
          const weight = c.normalizedWeight;
          const opacity = isHighlighted ? 0.9 : 0.25;
          const strokeWidth = Math.max(1, weight / maxWeight * 6);

          return (
            <motion.line
              key={`gold-${c.code}`}
              x1={goldPos.x}
              y1={goldPos.y}
              x2={c.x}
              y2={c.y}
              stroke="#c9a227"
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity,
                strokeWidth,
              }}
              transition={{ duration: 1, delay: 0.1 }}
            />
          );
        })}

        {/* Lines from each currency → MTQ */}
        {currencyPositions.map((c) => {
          const isHighlighted = c.code === selected || c.code === hovered;
          const weight = c.normalizedWeight;
          const opacity = isHighlighted ? 0.9 : 0.2;
          const strokeWidth = Math.max(1, weight / maxWeight * 6);
          const color = CURRENCY_META[c.code]?.color ?? "#888";

          return (
            <motion.line
              key={`cur-${c.code}`}
              x1={c.x}
              y1={c.y}
              x2={mtqPos.x}
              y2={mtqPos.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              animate={{
                strokeOpacity: phase === "shock" && !isHighlighted ? 0.1 : opacity,
              }}
              transition={{ duration: 0.5 }}
            />
          );
        })}

        {/* Line from Silver → MTQ */}
        <motion.line
          x1={silverPos.x}
          y1={silverPos.y}
          x2={mtqPos.x}
          y2={mtqPos.y}
          stroke="#e5e7eb"
          strokeWidth={3}
          strokeOpacity={0.5}
          strokeDasharray="6 4"
          animate={{
            strokeDashoffset: [0, -20],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Animated particles flowing along the gold→currency lines */}
        {phase === "live" && currencyPositions.map((c) => {
          const isHighlighted = c.code === selected || c.code === hovered;
          if (!isHighlighted && c.normalizedWeight < 0.05) return null;
          return (
            <motion.circle
              key={`particle-${c.code}`}
              r={2}
              fill="#c9a227"
              initial={{ cx: goldPos.x, cy: goldPos.y, opacity: 0 }}
              animate={{
                cx: [goldPos.x, c.x],
                cy: [goldPos.y, c.y],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeInOut",
              }}
            />
          );
        })}

        {/* Gold node (top) */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <circle cx={goldPos.x} cy={goldPos.y} r={35} fill="url(#goldGlow)" />
          <circle
            cx={goldPos.x}
            cy={goldPos.y}
            r={22}
            fill="#c9a227"
            stroke="#fde68a"
            strokeWidth={2}
            filter="url(#glow)"
          />
          <text
            x={goldPos.x}
            y={goldPos.y + 5}
            textAnchor="middle"
            className="fill-ink text-xs font-bold"
            fontSize="11"
          >
            GOLD
          </text>
          <text
            x={goldPos.x}
            y={goldPos.y + 55}
            textAnchor="middle"
            className="fill-gold text-[10px]"
            fontSize="10"
          >
            {fmtUsd(goldUsd)}/oz
          </text>
        </motion.g>

        {/* Silver node (right) */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <circle cx={silverPos.x} cy={silverPos.y} r={30} fill="url(#silverGlow)" />
          <circle
            cx={silverPos.x}
            cy={silverPos.y}
            r={18}
            fill="#9ca3af"
            stroke="#e5e7eb"
            strokeWidth={2}
          />
          <text
            x={silverPos.x}
            y={silverPos.y + 4}
            textAnchor="middle"
            className="fill-ink text-[10px] font-bold"
            fontSize="10"
          >
            Ag
          </text>
          <text
            x={silverPos.x}
            y={silverPos.y + 45}
            textAnchor="middle"
            className="fill-muted text-[10px]"
            fontSize="10"
          >
            {fmtUsd(silverUsd)}/oz
          </text>
        </motion.g>

        {/* Currency nodes (ring) */}
        {currencyPositions.map((c, i) => {
          const meta = CURRENCY_META[c.code];
          const isSelected = c.code === selected;
          const isHovered = c.code === hovered;
          const radius = 12 + c.normalizedWeight / maxWeight * 18;
          const isDropping = phase === "shock" && c.momentum < 0.97;

          return (
            <motion.g
              key={c.code}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                y: isDropping ? [0, 5, 0] : 0,
              }}
              transition={{
                duration: 0.4,
                delay: 0.3 + i * 0.08,
                y: { duration: 2, repeat: Infinity }
              }}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(c.code)}
              onMouseEnter={() => onHover(c.code)}
              onMouseLeave={() => onHover(null)}
            >
              {/* Glow ring on selection */}
              {isSelected && (
                <motion.circle
                  cx={c.x}
                  cy={c.y}
                  r={radius + 8}
                  fill="none"
                  stroke={meta?.color}
                  strokeWidth={2}
                  strokeOpacity={0.4}
                  animate={{ r: [radius + 6, radius + 12, radius + 6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={radius}
                fill={meta?.color}
                fillOpacity={isSelected || isHovered ? 0.3 : 0.15}
                stroke={meta?.color}
                strokeWidth={isSelected ? 2.5 : 1.5}
              />
              <text
                x={c.x}
                y={c.y + 3}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-bold"
                fontSize="10"
              >
                {c.code}
              </text>
              <text
                x={c.x}
                y={c.y + radius + 12}
                textAnchor="middle"
                className="fill-muted text-[8px]"
                fontSize="8"
              >
                {fmtPct(c.normalizedWeight, 1)}
              </text>
            </motion.g>
          );
        })}

        {/* MTQ node (bottom) */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <circle
            cx={mtqPos.x}
            cy={mtqPos.y}
            r={28}
            fill="#c9a227"
            stroke="#fde68a"
            strokeWidth={3}
            filter="url(#glow)"
          />
          <text
            x={mtqPos.x}
            y={mtqPos.y + 4}
            textAnchor="middle"
            className="fill-ink text-sm font-bold"
            fontSize="14"
          >
            MTQ
          </text>
          <text
            x={mtqPos.x}
            y={mtqPos.y + 55}
            textAnchor="middle"
            className="fill-gold text-[10px]"
            fontSize="10"
          >
            1 MTQ = basket value
          </text>
        </motion.g>

        {/* Legend */}
        <text x={20} y={490} className="fill-muted text-[9px]" fontSize="9">
          Line thickness = weight · Node size = weight · Click a currency for details
        </text>
      </svg>
    </div>
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
          <span className="text-2xl">{meta?.flag}</span>
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
        <DetailStat label="Structural Weight" value={fmtPct(weight.structuralWeight)} sub="§13 base" />
        <DetailStat label="Normalized Weight" value={fmtPct(weight.normalizedWeight)} sub="§20 final" />
        <DetailStat label="Momentum (M_i)" value={weight.momentum.toFixed(4)} sub="§15 clamped [0.95, 1.05]" />
        <DetailStat label="Shock Factor (K_i)" value={weight.kFactor.toFixed(4)} sub="§17 EWMA" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gold/20 bg-gold/[0.03] p-3">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Crown className="h-3 w-3 text-gold" /> Gold price in {weight.code}
          </div>
          <div className="mt-1 font-display text-lg text-gold">
            {goldPriceInCurrency.toLocaleString("en-US", { maximumFractionDigits: 2 })} {weight.code}/oz
          </div>
          <div className="text-[10px] text-fg-muted">
            = {fmtUsd(goldUsd)} USD/oz ÷ FX rate
          </div>
        </div>
        <div className="rounded-lg border border-line bg-ink-card p-3">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <Activity className="h-3 w-3 text-blue-400" /> Market conditions
          </div>
          <div className="mt-1 font-display text-lg text-foreground">
            Shock absorber: {shockAbsorber.toFixed(2)}
          </div>
          <div className="text-[10px] text-fg-muted">
            {shockAbsorber >= 0.5 ? "High volatility — momentum dampened" : "Normal — full momentum"}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">{label}</div>
      <div className="mt-1 font-display text-lg text-foreground">{value}</div>
      {sub && <div className="text-[10px] text-fg-muted">{sub}</div>}
    </div>
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
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
      {steps.map((s, i) => {
        const active = step === i;
        const passed = step > i;
        return (
          <motion.div
            key={i}
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
 * ConceptCard — explanatory card with icon + formula
 * ============================================================ */

function ConceptCard({
  icon,
  title,
  desc,
  formula,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  formula: string;
}) {
  return (
    <Reveal>
      <div className="h-full rounded-xl border border-line bg-ink-soft p-5">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-display text-sm text-foreground">{title}</h4>
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
