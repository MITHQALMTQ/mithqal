"use client";

/* ============================================================
 * MonetaryEngineExplained
 * ------------------------------------------------------------
 * A comprehensive, scrollable, animated educational experience
 * that explains the Mithqal Monetary Engine across 7 sections:
 *
 *   1. Hero — The Constitutional Mirror
 *   2. The 5 Layers Overview
 *   3. The Currency Basket — Astrolabe Ring (centerpiece)
 *   4. "When a Currency Drops" — Interactive Simulator (live-updates §3)
 *   5. Gold & Silver — The Anchor
 *   6. How Minting Works (5-step flow)
 *   7. Constitutional Guardrails
 *
 * Designed as a fusion of:
 *   - the existing connection-diagram + shock cascade (currency-weighting.tsx)
 *   - the astrolabe dual-ring + interactive sliders + USD-share-decline
 *     scenario from the attached HTML reference
 *   - the 5-layer "easy version" explanation
 *
 * State for the astrolabe (current weights + selected currency + slider
 * values) is lifted to the top-level component so the slider in §4
 * drives the ring in §3 live, with no external store required.
 * ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/reveal";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Scale,
  Cog,
  BookOpen,
  Layers as LayersIcon,
  Boxes,
  Coins,
  Landmark,
  Crown,
  Gauge,
  Activity,
  Droplets,
  ArrowRight,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Lock,
  ScrollText,
  Hexagon,
  CircleDollarSign,
  Sparkles,
  RefreshCw,
  PiggyBank,
  Wallet,
} from "lucide-react";

/* ============================================================
 * Types & constants
 * ============================================================ */

interface CurrencyWeight {
  code: string;
  name: string;
  structuralWeight: number; // 0..1
  normalizedWeight: number; // 0..1
  momentum: number; // clamped [0.95, 1.05]
  kFactor: number;
  goldPrice: number;
}

interface WeightingData {
  goldUsd: number;
  silverUsd: number;
  weights: CurrencyWeight[];
  shockAbsorber: number;
}

/** Currency spec used by the astrolabe (weight expressed as percent 0..100). */
interface CurrencySpec {
  code: string;
  name: string;
  weight: number; // percent 0..100
  color: string;
}

interface ReserveSpec {
  code: string;
  name: string;
  pct: number; // percent 0..100
  color: string;
}

/** Baseline 8-currency basket — matches the Constitution worked example (Part III). */
const BASELINE_CURRENCIES: CurrencySpec[] = [
  { code: "USD", name: "US Dollar",        weight: 47.46, color: "#D4AF37" },
  { code: "EUR", name: "Euro",             weight: 20.50, color: "#3B6E8C" },
  { code: "GBP", name: "British Pound",    weight: 10.17, color: "#8B3A3A" },
  { code: "JPY", name: "Japanese Yen",     weight: 9.67,  color: "#4F7A55" },
  { code: "CNY", name: "Chinese Yuan",     weight: 7.90,  color: "#9B5B3F" },
  { code: "CHF", name: "Swiss Franc",      weight: 1.93,  color: "#6E6259" },
  { code: "AUD", name: "Australian Dollar",weight: 1.27,  color: "#7A6A8A" },
  { code: "CAD", name: "Canadian Dollar",  weight: 1.10,  color: "#5C7A7A" },
];

/** Reserve layers — STATIC, constitutionally fixed. */
const RESERVE_LAYERS: ReserveSpec[] = [
  { code: "FIAT",   name: "Fiat basket",  pct: 75, color: "#8A7A55" },
  { code: "GOLD",   name: "Gold",         pct: 16, color: "#D4AF37" },
  { code: "SILVER", name: "Silver",       pct: 4,  color: "#B7BCC0" },
  { code: "STABLE", name: "Stablecoins",  pct: 5,  color: "#4A4638" },
];

const CONCENTRATION_CAP = 60; // %
const MIN_FLOOR = 0.5;        // %

/* ============================================================
 * Pure engine math (mirrors the HTML reference's recompute)
 * ============================================================ */

type WeightMap = Record<string, number>;

/** Apply the 60% cap + 0.5% floor iteratively. */
function applyCapFloor(weights: WeightMap): WeightMap {
  let w: WeightMap = { ...weights };
  for (let pass = 0; pass < 6; pass++) {
    let changed = false;
    const over = Object.keys(w).filter((k) => w[k] > CONCENTRATION_CAP);
    if (over.length) {
      changed = true;
      let excess = 0;
      over.forEach((k) => { excess += w[k] - CONCENTRATION_CAP; w[k] = CONCENTRATION_CAP; });
      const rest = Object.keys(w).filter((k) => !over.includes(k));
      const sumRest = rest.reduce((s, k) => s + w[k], 0);
      if (sumRest > 0) rest.forEach((k) => { w[k] += excess * (w[k] / sumRest); });
    }
    const under = Object.keys(w).filter((k) => w[k] < MIN_FLOOR);
    if (under.length) {
      changed = true;
      let deficit = 0;
      under.forEach((k) => { deficit += MIN_FLOOR - w[k]; w[k] = MIN_FLOOR; });
      const rest = Object.keys(w).filter((k) => !under.includes(k));
      const sumRest = rest.reduce((s, k) => s + w[k], 0);
      if (sumRest > 0) rest.forEach((k) => { w[k] -= deficit * (w[k] / sumRest); });
    }
    if (!changed) break;
  }
  return w;
}

/** Mode A: momentum vs gold — clamped to ±5%, simplified damping pass. */
function computeMomentumScenario(selected: string, shockPct: number): {
  normalized: WeightMap;
  momentumClamped: number;
  stabilized: number;
  rawMovePct: number;
} {
  const momentumRaw = 1 + shockPct / 100;
  const momentumClamped = Math.max(0.95, Math.min(1.05, momentumRaw));
  const stabilized = 1 + 0.6 * (momentumClamped - 1);

  const raw: WeightMap = {};
  BASELINE_CURRENCIES.forEach((c) => {
    raw[c.code] = c.code === selected ? c.weight * stabilized : c.weight;
  });
  const sumRaw = Object.values(raw).reduce((s, v) => s + v, 0);
  const normalized: WeightMap = {};
  Object.keys(raw).forEach((k) => { normalized[k] = (raw[k] / sumRaw) * 100; });
  return { normalized: applyCapFloor(normalized), momentumClamped, stabilized, rawMovePct: shockPct };
}

/** Mode B: USD loses share across COFER/SWIFT/BIS — redistributed proportionally. */
function computeUsdShareScenario(declinePct: number): {
  normalized: WeightMap;
  usdLost: number;
  beneficiary: { code: string; gain: number };
  capRoom: { code: string; pts: number };
} {
  const usd = BASELINE_CURRENCIES.find((c) => c.code === "USD")!;
  const usdNew = usd.weight * (1 + declinePct / 100);
  const lost = usd.weight - usdNew;
  const others = BASELINE_CURRENCIES.filter((c) => c.code !== "USD");
  const othersSum = others.reduce((s, c) => s + c.weight, 0);

  const raw: WeightMap = { USD: usdNew };
  others.forEach((c) => { raw[c.code] = c.weight + lost * (c.weight / othersSum); });

  const sumRaw = Object.values(raw).reduce((s, v) => s + v, 0);
  const normalized: WeightMap = {};
  Object.keys(raw).forEach((k) => { normalized[k] = (raw[k] / sumRaw) * 100; });
  const clamped = applyCapFloor(normalized);

  let benefCode = "EUR", benefGain = -Infinity;
  others.forEach((c) => {
    const gain = clamped[c.code] - c.weight;
    if (gain > benefGain) { benefGain = gain; benefCode = c.code; }
  });

  let maxCode = "USD", maxW = -Infinity;
  Object.keys(clamped).forEach((k) => {
    if (clamped[k] > maxW) { maxW = clamped[k]; maxCode = k; }
  });

  return {
    normalized: clamped,
    usdLost: lost,
    beneficiary: { code: benefCode, gain: benefGain },
    capRoom: { code: maxCode, pts: CONCENTRATION_CAP - maxW },
  };
}

/* ============================================================
 * Helpers
 * ============================================================ */

const fmt = (n: number, digits = 2) => n.toFixed(digits);
const fmtPct = (n: number, digits = 2) => `${fmt(n, digits)}%`;
const fmtSignedPct = (n: number, digits = 1) => {
  const sign = n > 0 ? "+" : n < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(n).toFixed(digits)}%`;
};
const fmtSignedPts = (n: number, digits = 2) => {
  const sign = n > 0 ? "+" : n < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(n).toFixed(digits)} pts`;
};

/* ============================================================
 * Top-level component
 * ============================================================ */

export function MonetaryEngineExplained({ data }: { data?: WeightingData | null }) {
  /* ---- Lifted state: drives both the astrolabe (§3) and simulator (§4) ---- */
  const [mode, setMode] = useState<"momentum" | "usdshare">("momentum");
  const [selected, setSelected] = useState<string>("USD");
  const [shockPct, setShockPct] = useState<number>(0);
  const [usdDecline, setUsdDecline] = useState<number>(-10);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  /* ---- If live API weights are provided, use them as an alternate baseline ---- */
  const apiWeights = data?.weights ?? [];
  const liveBaseline: CurrencySpec[] = useMemo(() => {
    if (apiWeights.length === 0) return BASELINE_CURRENCIES;
    // Map API normalizedWeight (0..1) → percentage, keep BASELINE colors
    return BASELINE_CURRENCIES.map((c) => {
      const w = apiWeights.find((x) => x.code === c.code);
      return w ? { ...c, weight: w.normalizedWeight * 100 } : c;
    });
  }, [apiWeights]);

  /* ---- Derived: current weights based on mode + slider ---- */
  const momentumResult = useMemo(
    () => computeMomentumScenario(selected, shockPct),
    [selected, shockPct]
  );
  const usdResult = useMemo(
    () => computeUsdShareScenario(usdDecline),
    [usdDecline]
  );

  const currentWeights: WeightMap = mode === "momentum"
    ? momentumResult.normalized
    : usdResult.normalized;

  /* ---- Center readout on the astrolabe ---- */
  const center: { value: string; label: string; tone: "up" | "down" | "flat" } = useMemo(() => {
    if (mode === "momentum") {
      const baseW = liveBaseline.find((c) => c.code === selected)?.weight ?? 0;
      const idx = 100 + (baseW / 100) * (momentumResult.stabilized - 1) * 100;
      return {
        value: fmt(idx, 2),
        label: "basket stability index",
        tone: idx > 100 ? "up" : idx < 100 ? "down" : "flat",
      };
    }
    return {
      value: fmtPct(usdResult.normalized["USD"]),
      label: "USD basket weight",
      tone: usdDecline < 0 ? "down" : "flat",
    };
  }, [mode, selected, momentumResult, usdResult, usdDecline, liveBaseline]);

  /* ---- Which currency is "active" (highlighted in the ring + legend) ---- */
  const activeCode = mode === "momentum" ? selected : "USD";
  const hasShock = mode === "momentum" ? shockPct !== 0 : usdDecline !== 0;

  /* ---- Reset selected/shock when switching modes (clean UX) ---- */
  const handleModeChange = (next: "momentum" | "usdshare") => {
    setMode(next);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-ink via-ink-soft to-ink text-foreground">
      {/* Subtle grain wash */}
      <div className="pointer-events-none absolute inset-0 grain-bg opacity-60" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* ===================== SECTION 1 — HERO ===================== */}
        <HeroSection />

        {/* ===================== SECTION 2 — 5 LAYERS ===================== */}
        <FiveLayersSection />

        {/* ===================== SECTION 3 — ASTROLABE ===================== */}
        <AstrolabeSection
          weights={currentWeights}
          baseline={liveBaseline}
          center={center}
          activeCode={activeCode}
          hasShock={hasShock}
          reducedMotion={reducedMotion}
        />

        {/* ===================== SECTION 4 — INTERACTIVE SIMULATOR ===================== */}
        <SimulatorSection
          mode={mode}
          onModeChange={handleModeChange}
          selected={selected}
          onSelect={setSelected}
          shockPct={shockPct}
          onShockPct={setShockPct}
          usdDecline={usdDecline}
          onUsdDecline={setUsdDecline}
          momentumResult={momentumResult}
          usdResult={usdResult}
        />

        {/* ===================== SECTION 5 — GOLD & SILVER ===================== */}
        <GoldSilverSection />

        {/* ===================== SECTION 6 — MINTING FLOW ===================== */}
        <MintingFlowSection reducedMotion={reducedMotion} />

        {/* ===================== SECTION 7 — GUARDRAILS ===================== */}
        <GuardrailsSection />

        {/* Footer */}
        <footer className="border-t border-line py-12 text-center">
          <div className="font-display text-sm tracking-[0.3em] text-gold">M I T H Q A L</div>
          <p className="mt-3 text-xs text-fg-muted">
            Illustrative educational model, mirroring Sections 12–22 of the Constitutional Currency Engine.
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Not the production Monetary Engine · Figures drawn from Part III, Illustrative Worked Example (Non-Normative)
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
 * SECTION 1 — HERO
 * ============================================================ */

function HeroSection() {
  const pillars = [
    { label: "100% Reserved", icon: ShieldCheck },
    { label: "Neutral", icon: Scale },
    { label: "Algorithmic", icon: Cog },
    { label: "Sharia-compliant", icon: BookOpen },
  ];
  return (
    <section className="relative py-20 text-center sm:py-28">
      {/* Astrolabe glyph */}
      <motion.svg
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 0.95, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        viewBox="0 0 64 64"
        className="mx-auto mb-6 h-16 w-16"
        fill="none"
      >
        <line x1="32" y1="6" x2="32" y2="20" stroke="#D4AF37" strokeWidth="2" />
        <line x1="10" y1="20" x2="54" y2="20" stroke="#D4AF37" strokeWidth="2" />
        <line x1="16" y1="20" x2="10" y2="34" stroke="#D4AF37" strokeWidth="1.4" />
        <line x1="16" y1="20" x2="22" y2="34" stroke="#D4AF37" strokeWidth="1.4" />
        <path d="M10 34a6 8 0 0 0 12 0Z" stroke="#D4AF37" strokeWidth="1.4" />
        <line x1="48" y1="20" x2="42" y2="34" stroke="#D4AF37" strokeWidth="1.4" />
        <line x1="48" y1="20" x2="54" y2="34" stroke="#D4AF37" strokeWidth="1.4" />
        <path d="M42 34a6 8 0 0 0 12 0Z" stroke="#D4AF37" strokeWidth="1.4" />
        <line x1="32" y1="20" x2="32" y2="50" stroke="#D4AF37" strokeWidth="2" />
        <path d="M20 50h24l-4 8H24Z" stroke="#D4AF37" strokeWidth="1.4" />
      </motion.svg>

      <Reveal>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/[0.06] px-4 py-1.5">
          <Sparkles className="h-3 w-3 text-gold" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
            MITHQAL · Constitutional Currency Engine
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.05}>
        <h1 className="mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          The Constitutional Mirror
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          MITHQAL is a constitutional monetary institution. MTQ is{" "}
          <span className="font-medium text-gold">100% reserved</span>,{" "}
          <span className="font-medium text-gold">neutral</span>,{" "}
          <span className="font-medium text-gold">algorithmic</span>, and{" "}
          <span className="font-medium text-gold">Sharia-compliant</span>.
        </p>
      </Reveal>

      {/* 4 pillar badges */}
      <Reveal delay={0.15}>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {pillars.map((p) => (
            <motion.div
              key={p.label}
              whileHover={{ y: -2, scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gradient-to-b from-gold/[0.12] to-gold/[0.04] px-4 py-2"
            >
              <p.icon className="h-4 w-4 text-gold" />
              <span className="text-sm font-medium text-foreground">
                <span className="mr-1.5 text-gold-soft">✓</span>
                {p.label}
              </span>
            </motion.div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-ink-soft px-5 py-2">
          <span className="font-mono text-[11px] tracking-[0.14em] text-gold-deep">
            SECTIONS 12–22 · ILLUSTRATIVE WORKED EXAMPLE
          </span>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
 * SECTION 2 — THE 5 LAYERS
 * ============================================================ */

function FiveLayersSection() {
  const layers = [
    {
      n: 1,
      name: "Currency Basket",
      does: "Weighs 8 currencies continuously against gold.",
      contains: "USD, EUR, GBP, JPY, CNY, CHF, AUD, CAD — IMF/SWIFT/BIS blended.",
      icon: Boxes,
      tag: "Algorithmic",
      tone: "from-gold/15 to-transparent border-gold/40",
    },
    {
      n: 2,
      name: "Asset Allocation",
      does: "Policy-managed inside constitutional ranges.",
      contains: "70–80% fiat · 15–25% bullion · 2–8% stablecoins.",
      icon: LayersIcon,
      tag: "Policy-managed",
      tone: "from-reserve/15 to-transparent border-reserve/40",
    },
    {
      n: 3,
      name: "Bullion Split",
      does: "Splits bullion between gold and silver.",
      contains: "Gold 60–95% · Silver 5–40% of bullion.",
      icon: Coins,
      tag: "Constitutional",
      tone: "from-gold/15 to-transparent border-gold/40",
    },
    {
      n: 4,
      name: "Stablecoins",
      does: "Short-term operational liquidity layer.",
      contains: "2–8% of total reserves · single-issuer cap 20%.",
      icon: CircleDollarSign,
      tag: "Bounded",
      tone: "from-reserve/10 to-transparent border-reserve/30",
    },
    {
      n: 5,
      name: "Governance",
      does: "Constitutional Council + Multi-Sig Safe.",
      contains: "Council sets policy inside ranges · Safe executes on-chain.",
      icon: Landmark,
      tag: "Human + Machine",
      tone: "from-gold/15 to-transparent border-gold/40",
    },
  ];

  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="02 — The 5 Layers"
        title="Five layers, one constitutional mirror"
        lede="Each layer does one job, and each one is bounded by the Constitution. Together they form MTQ — a token whose value tracks the real world, not anyone's discretion."
      />

      <div className="mt-10 flex flex-col gap-4">
        {layers.map((l, i) => (
          <Reveal key={l.n} delay={i * 0.06}>
            <motion.div
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-r ${l.tone} bg-ink-soft p-5 sm:p-6`}
            >
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Layer number */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-ink font-display text-xl font-semibold text-gold">
                  {l.n}
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <l.icon className="h-5 w-5 text-gold" />
                    <h3 className="font-display text-lg text-foreground sm:text-xl">
                      {l.name}
                    </h3>
                    <Badge className="border-gold/30 bg-gold/10 text-gold">
                      {l.tag}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground sm:text-base">
                    {l.does}
                  </p>
                  <p className="mt-1 font-mono text-xs text-fg-muted">
                    <span className="text-gold-deep">contains:</span>{" "}
                    {l.contains}
                  </p>
                </div>
                {/* Arrow connecting to next layer */}
                {i < layers.length - 1 && (
                  <div className="hidden shrink-0 items-center justify-center self-stretch sm:flex">
                    <ArrowDown className="h-4 w-4 text-line" />
                  </div>
                )}
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 3 — ASTROLABE (centerpiece)
 * ============================================================ */

interface AstrolabeSectionProps {
  weights: WeightMap;
  baseline: CurrencySpec[];
  center: { value: string; label: string; tone: "up" | "down" | "flat" };
  activeCode: string;
  hasShock: boolean;
  reducedMotion: boolean;
}

function AstrolabeSection({
  weights, baseline, center, activeCode, hasShock, reducedMotion,
}: AstrolabeSectionProps) {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="03 — The Instrument"
        title="The living basket, weighed against the anchor"
        lede="The outer ring is the currency basket — sized by weight, largest at the top. The inner ring is the reserve structure itself: currencies, bullion, and short-term stablecoins. The center is the basket stability index."
      />

      <div className="mt-10 flex flex-col items-center">
        <AstrolabeSVG
          weights={weights}
          baseline={baseline}
          center={center}
          activeCode={activeCode}
          hasShock={hasShock}
          reducedMotion={reducedMotion}
        />
        <p className="mt-4 max-w-xl text-center font-mono text-[11.5px] text-fg-muted">
          Outer — currency basket (weight-sized) · Inner — reserve layers (fixed) · Center — basket stability index
        </p>
      </div>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
        {baseline.map((c) => {
          const w = weights[c.code] ?? c.weight;
          const diff = w - c.weight;
          const isFlat = Math.abs(diff) < 0.005;
          const isUp = diff > 0;
          const isActive = c.code === activeCode;
          return (
            <div
              key={c.code}
              className={`flex items-center gap-3 border-b border-line px-1 py-2 transition-colors ${
                isActive ? "bg-gold/[0.06]" : ""
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <span className="w-10 font-mono text-xs font-semibold text-foreground">
                {c.code}
              </span>
              <span className="ml-auto font-mono text-sm text-gold-soft">
                {fmt(w)}%
              </span>
              <span
                className={`w-16 text-right font-mono text-[11px] ${
                  isFlat
                    ? "text-fg-muted"
                    : isUp
                    ? "text-reserve"
                    : "text-[#A2543D]"
                }`}
              >
                {isFlat ? (
                  <span className="inline-flex items-center gap-1">
                    <Minus className="h-3 w-3" /> flat
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(diff).toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {/* Reserve layer strip (static reminder) */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {RESERVE_LAYERS.map((r) => (
          <div
            key={r.code}
            className="rounded-lg border border-line bg-ink-card p-4 text-center"
          >
            <span
              className="mx-auto mb-2 block h-4 w-4 rounded-full"
              style={{ background: r.color }}
            />
            <div className="font-mono text-xl text-foreground">{r.pct}%</div>
            <div className="mt-1 text-[11.5px] text-fg-muted">{r.name}</div>
            <div className="mt-2 text-[10px] uppercase tracking-wider text-gold-deep">
              Constitutionally fixed
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * Astrolabe SVG
 * ============================================================ */

const CX = 240, CY = 240;
const R_OUTER = 190, SW_OUTER = 40;
const R_INNER = 128, SW_INNER = 30;
const CIRC_OUTER = 2 * Math.PI * R_OUTER;
const CIRC_INNER = 2 * Math.PI * R_INNER;
const TICK_R1 = 214;

function AstrolabeSVG({
  weights, baseline, center, activeCode, hasShock, reducedMotion,
}: AstrolabeSectionProps & { reducedMotion: boolean }) {
  // Build currency arcs
  const currencyArcs = useMemo(() => {
    const arcs: { code: string; color: string; dash: number; offset: number }[] = [];
    let cum = 0;
    baseline.forEach((c) => {
      const w = weights[c.code] ?? c.weight;
      const dash = (w / 100) * CIRC_OUTER;
      arcs.push({ code: c.code, color: c.color, dash, offset: -((cum / 100) * CIRC_OUTER) });
      cum += w;
    });
    return arcs;
  }, [weights, baseline]);

  // Build reserve arcs (static)
  const reserveArcs = useMemo(() => {
    const arcs: { code: string; color: string; dash: number; offset: number; pct: number }[] = [];
    let cum = 0;
    RESERVE_LAYERS.forEach((r) => {
      const dash = (r.pct / 100) * CIRC_INNER;
      arcs.push({ code: r.code, color: r.color, dash, offset: -((cum / 100) * CIRC_INNER), pct: r.pct });
      cum += r.pct;
    });
    return arcs;
  }, []);

  // Build 72 tick marks
  const ticks = useMemo(() => {
    const arr: { x1: number; y1: number; x2: number; y2: number; long: boolean }[] = [];
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * 360;
      const long = i % 6 === 0;
      const len = long ? 14 : 6;
      const rad = (angle * Math.PI) / 180;
      arr.push({
        x1: CX + TICK_R1 * Math.cos(rad),
        y1: CY + TICK_R1 * Math.sin(rad),
        x2: CX + (TICK_R1 + len) * Math.cos(rad),
        y2: CY + (TICK_R1 + len) * Math.sin(rad),
        long,
      });
    }
    return arr;
  }, []);

  const centerColor =
    center.tone === "up" ? "#5B8770" : center.tone === "down" ? "#A2543D" : "#EBCB6E";

  return (
    <svg
      viewBox="0 0 480 480"
      className="h-auto w-full max-w-[520px]"
      role="img"
      aria-label="Currency basket astrolabe showing 8 currencies in the outer ring and 4 reserve layers in the inner ring"
    >
      <defs>
        <radialGradient id="astrolabe-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#1C160C" />
          <stop offset="100%" stopColor="#0E0C09" />
        </radialGradient>
        <radialGradient id="astrolabe-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#D4AF37" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
        <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <circle cx={CX} cy={CY} r={228} fill="url(#astrolabe-bg)" stroke="#3A3225" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={228} fill="url(#astrolabe-glow)" />

      {/* Tick ring (astrolabe limb) — rotates slowly via CSS (respect prefers-reduced-motion) */}
      <g className="astrolabe-tick-ring">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.long ? "#7C5E32" : "#3A3225"}
            strokeWidth={t.long ? 1.4 : 0.8}
          />
        ))}
      </g>

      {/* Outer ring — currency arcs */}
      <g transform={`translate(${CX},${CY}) rotate(-90)`}>
        {currencyArcs.map((a) => {
          const isActive = a.code === activeCode;
          const isDim = hasShock && !isActive;
          return (
            <motion.circle
              key={a.code}
              r={R_OUTER}
              cx={0}
              cy={0}
              fill="none"
              stroke={a.color}
              strokeWidth={isActive ? SW_OUTER + 4 : SW_OUTER}
              strokeDasharray={`${a.dash} ${CIRC_OUTER - a.dash}`}
              strokeDashoffset={a.offset}
              initial={false}
              animate={{
                opacity: isDim ? 0.38 : 1,
              }}
              transition={{ duration: 0.85, ease: [0.22, 0.9, 0.24, 1] }}
              style={{
                transition: "stroke-dasharray 0.85s cubic-bezier(0.22,0.9,0.24,1), stroke-dashoffset 0.85s cubic-bezier(0.22,0.9,0.24,1), stroke-width 0.3s ease",
                filter: isActive ? "drop-shadow(0 0 6px rgba(235,203,110,0.55))" : undefined,
              }}
            />
          );
        })}
      </g>

      {/* Inner ring — reserve layers (static) */}
      <g transform={`translate(${CX},${CY}) rotate(-90)`}>
        {reserveArcs.map((a) => (
          <circle
            key={a.code}
            r={R_INNER}
            cx={0}
            cy={0}
            fill="none"
            stroke={a.color}
            strokeWidth={SW_INNER}
            strokeDasharray={`${a.dash} ${CIRC_INNER - a.dash}`}
            strokeDashoffset={a.offset}
            opacity={0.9}
          />
        ))}
      </g>

      {/* Center disc */}
      <g transform={`translate(${CX},${CY})`}>
        <circle r={86} fill="#14100A" stroke="#D4AF37" strokeWidth={1.4} />
        <circle r={80} fill="none" stroke="#3A3225" strokeWidth={1} />
        <text
          y={-16}
          textAnchor="middle"
          fill="#EFE8D8"
          style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          fontWeight={600}
          fontSize={20}
          letterSpacing={2}
        >
          MTQ
        </text>
        <motion.text
          key={center.value + center.label}
          y={10}
          textAnchor="middle"
          fill={centerColor}
          style={{ fontFamily: "ui-monospace, monospace" }}
          fontSize={22}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 10 }}
          transition={{ duration: 0.4 }}
        >
          {center.value}
        </motion.text>
        <text
          y={30}
          textAnchor="middle"
          fill="#9C9384"
          style={{ fontFamily: "ui-monospace, monospace" }}
          fontSize={10}
        >
          {center.label}
        </text>
      </g>

      {/* Reserve ring labels (outside the inner ring) */}
      <g transform={`translate(${CX},${CY})`}>
        {reserveArcs.map((a, i) => {
          const startPct = RESERVE_LAYERS.slice(0, i).reduce((s, r) => s + r.pct, 0);
          const midPct = startPct + a.pct / 2;
          const angle = (midPct / 100) * 2 * Math.PI - Math.PI / 2;
          const r = R_INNER;
          const x = r * Math.cos(angle);
          const y = r * Math.sin(angle);
          return (
            <text
              key={a.code}
              x={x}
              y={y + 3}
              textAnchor="middle"
              fill="#0E0C09"
              style={{ fontFamily: "ui-monospace, monospace" }}
              fontSize={9}
              fontWeight={700}
            >
              {a.pct}%
            </text>
          );
        })}
      </g>
    </svg>
  );
}

/* ============================================================
 * SECTION 4 — INTERACTIVE SIMULATOR
 * ============================================================ */

interface SimulatorSectionProps {
  mode: "momentum" | "usdshare";
  onModeChange: (m: "momentum" | "usdshare") => void;
  selected: string;
  onSelect: (code: string) => void;
  shockPct: number;
  onShockPct: (n: number) => void;
  usdDecline: number;
  onUsdDecline: (n: number) => void;
  momentumResult: ReturnType<typeof computeMomentumScenario>;
  usdResult: ReturnType<typeof computeUsdShareScenario>;
}

function SimulatorSection(props: SimulatorSectionProps) {
  const {
    mode, onModeChange, selected, onSelect,
    shockPct, onShockPct, usdDecline, onUsdDecline,
    momentumResult, usdResult,
  } = props;

  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="04 — When A Currency Drops"
        title="Weight is earned continuously, not fixed once"
        lede="A currency's Structural Weight is only the starting point. Four forces adjust it every cycle — and every one of them is bounded, so no single move can swing the basket too far."
      />

      {/* 4-force explanation cards */}
      <FourForcesGrid />

      <Reveal>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-fg-muted sm:text-base">
          Everything is then renormalized back to 100%, and two hard rules apply: no currency can
          ever exceed <span className="font-semibold text-gold">60%</span> of the basket, and none
          can fall below <span className="font-semibold text-gold">0.5%</span> without entering a
          formal removal review. Try it — pick a currency, and move it against gold.
        </p>
      </Reveal>

      {/* Simulator panel */}
      <Reveal>
        <div className="mt-6 rounded-xl border border-line bg-ink-soft p-5 sm:p-7">
          {/* Mode toggle */}
          <div className="mb-6 inline-flex rounded-lg border border-line bg-ink p-1">
            <ModeButton
              active={mode === "momentum"}
              onClick={() => onModeChange("momentum")}
            >
              Momentum vs. gold
            </ModeButton>
            <ModeButton
              active={mode === "usdshare"}
              onClick={() => onModeChange("usdshare")}
            >
              Scenario — USD loses share
            </ModeButton>
          </div>

          <AnimatePresence mode="wait">
            {mode === "momentum" ? (
              <motion.div
                key="momentum"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <MomentumMode
                  selected={selected}
                  onSelect={onSelect}
                  shockPct={shockPct}
                  onShockPct={onShockPct}
                  result={momentumResult}
                />
              </motion.div>
            ) : (
              <motion.div
                key="usdshare"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <UsdShareMode
                  decline={usdDecline}
                  onDecline={onUsdDecline}
                  result={usdResult}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-4 py-2 font-mono text-xs transition-all sm:text-[12.5px] ${
        active
          ? "bg-gold text-ink font-semibold"
          : "text-fg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ---- 4 forces grid ---- */

function FourForcesGrid() {
  const forces = [
    {
      n: 1,
      title: "Momentum",
      icon: Activity,
      desc: "Each currency's price is measured against gold over the trailing 12 months. Weaken against gold, and momentum pulls that currency's weight down — but the constitution caps the effect at ±5%, no matter how sharp the move.",
    },
    {
      n: 2,
      title: "Mean Reversion",
      icon: RefreshCw,
      desc: "A gentle pull back toward the currency's own 5-year average weight, so a single volatile quarter can't permanently distort the basket.",
    },
    {
      n: 3,
      title: "Shock Absorber",
      icon: ShieldCheck,
      desc: "When market-wide volatility spikes, this mutes momentum and mean-reversion together — the basket deliberately slows down exactly when markets are panicking.",
    },
    {
      n: 4,
      title: "Liquidity Overlay",
      icon: Droplets,
      desc: "A small adjustment for how easily a currency actually trades day-to-day, so the basket stays operationally executable, not just theoretically correct.",
    },
  ];
  return (
    <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {forces.map((f, i) => (
        <Reveal key={f.n} delay={i * 0.05}>
          <div className="flex gap-4 rounded-lg border border-line bg-ink-soft p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06]">
              <f.icon className="h-5 w-5 text-gold" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm text-gold">{f.n}.</span>
                <h4 className="font-display text-base text-foreground">{f.title}</h4>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-fg-muted">{f.desc}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ---- Mode A: Momentum vs. gold ---- */

function MomentumMode({
  selected, onSelect, shockPct, onShockPct, result,
}: {
  selected: string;
  onSelect: (code: string) => void;
  shockPct: number;
  onShockPct: (n: number) => void;
  result: ReturnType<typeof computeMomentumScenario>;
}) {
  const newWeight = result.normalized[selected] ?? 0;
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">
        Simulate a 12-month move against gold
      </h3>

      {/* Currency chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {BASELINE_CURRENCIES.map((c) => (
          <button
            key={c.code}
            onClick={() => onSelect(c.code)}
            className={`rounded-full border px-3.5 py-2 font-mono text-xs transition-all ${
              selected === c.code
                ? "border-gold bg-gold text-ink font-semibold"
                : "border-line text-fg-muted hover:border-gold hover:text-foreground"
            }`}
          >
            {c.code}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label
          htmlFor="shock-slider"
          className="font-mono text-[12.5px] text-fg-muted sm:w-[210px] sm:shrink-0"
        >
          Move vs. gold, 12 months
        </label>
        <input
          id="shock-slider"
          type="range"
          min={-20}
          max={20}
          step={1}
          value={shockPct}
          onChange={(e) => onShockPct(parseInt(e.target.value, 10))}
          className="monetary-range h-1 w-full flex-1 cursor-pointer appearance-none rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #A2543D, #3A3225 50%, #5B8770)",
          }}
        />
        <div className="font-mono text-[13px] text-gold-soft sm:w-[64px] sm:text-right">
          {fmtSignedPct(shockPct, 0)}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onShockPct(0)}
          className="rounded-md border border-line px-4 py-2 font-mono text-xs text-fg-muted transition-all hover:border-gold hover:text-foreground"
        >
          Reset to baseline
        </button>
        <span className="font-mono text-xs text-fg-muted">
          Selected: <span className="text-gold">{selected}</span>
        </span>
      </div>

      {/* Readout */}
      <ReadoutGrid
        cells={[
          { label: "Raw move", value: fmtSignedPct(shockPct, 1) },
          { label: "Momentum (±5% bound)", value: result.momentumClamped.toFixed(4) },
          { label: "After stabilizers*", value: result.stabilized.toFixed(4) },
          { label: "New basket weight", value: fmtPct(newWeight) },
        ]}
      />

      <p className="mt-3 max-w-3xl font-mono text-[11.5px] leading-relaxed text-fg-muted">
        *Mean Reversion, Shock Absorber and Liquidity Overlay are simplified here into one damping
        pass for legibility. The production Monetary Engine (Sections 15–18) runs all four
        independently against live oracle data.
      </p>
    </div>
  );
}

/* ---- Mode B: USD loses share ---- */

function UsdShareMode({
  decline, onDecline, result,
}: {
  decline: number;
  onDecline: (n: number) => void;
  result: ReturnType<typeof computeUsdShareScenario>;
}) {
  const presets = [-10, -20, -30];
  return (
    <div>
      <h3 className="font-display text-lg text-foreground">
        Scenario — USD loses 10%+ share across COFER, SWIFT and BIS
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-fg-muted">
        This isn't a single bad year for the dollar against gold — it's the dollar losing ground in
        all three inputs behind Structural Weight at once: less held in official reserves, less used
        to settle trade, less traded for liquidity. Pick how much it loses, and watch what the engine
        does with the difference.
      </p>

      {/* Presets */}
      <div className="mt-4 flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => onDecline(p)}
            className={`rounded-md border px-3.5 py-2 font-mono text-xs transition-all ${
              decline === p
                ? "border-[#A2543D] bg-[#A2543D] text-foreground font-semibold"
                : "border-[#A2543D] text-[#A2543D] hover:bg-[#A2543D]/15 hover:text-foreground"
            }`}
          >
            {fmtSignedPct(p, 0)}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label
          htmlFor="usd-slider"
          className="font-mono text-[12.5px] text-fg-muted sm:w-[260px] sm:shrink-0"
        >
          USD share decline (COFER + SWIFT + BIS)
        </label>
        <input
          id="usd-slider"
          type="range"
          min={-40}
          max={0}
          step={1}
          value={decline}
          onChange={(e) => onDecline(parseInt(e.target.value, 10))}
          className="monetary-range h-1 w-full flex-1 cursor-pointer appearance-none rounded-full"
          style={{
            background: "linear-gradient(90deg, #A2543D, #3A3225)",
          }}
        />
        <div className="font-mono text-[13px] text-gold-soft sm:w-[64px] sm:text-right">
          {fmtSignedPct(decline, 0)}
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => onDecline(-10)}
          className="rounded-md border border-line px-4 py-2 font-mono text-xs text-fg-muted transition-all hover:border-gold hover:text-foreground"
        >
          Reset to baseline
        </button>
        <span className="font-mono text-xs text-fg-muted">
          Applies to USD only — every other currency is a receiver, not a chooser.
        </span>
      </div>

      {/* Readout */}
      <ReadoutGrid
        cells={[
          { label: "USD share lost", value: `\u2212${result.usdLost.toFixed(2)} pts` },
          { label: "New USD weight", value: fmtPct(result.normalized["USD"]) },
          {
            label: "Largest beneficiary",
            value: `${result.beneficiary.code} (${fmtSignedPts(result.beneficiary.gain)})`,
            tone: "up",
          },
          {
            label: "60% cap headroom",
            value: `${result.capRoom.pts.toFixed(2)} pts (${result.capRoom.code})`,
          },
        ]}
      />

      {/* 5-step explanation */}
      <ol className="mt-6 space-y-3 border-t border-line pt-6">
        {[
          "Recalculates USD's Structural Weight through the same 50% COFER / 40% SWIFT / 10% BIS blend — nothing about the formula changes, only the inputs.",
          "Redistributes the freed share across the other seven eligible currencies in proportion to their existing weight — the largest holders of the rest of the basket gain the most, automatically, not by anyone's choice.",
          "Renormalizes the full basket back to exactly 100%.",
          "Re-checks the result against the 60% concentration cap and 0.5% floor — a USD decline only ever moves it further from the cap, never closer.",
          "Leaves the gold, silver and stablecoin reserve layer completely untouched. That allocation is fixed by constitution — it was never USD's to begin with.",
        ].map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold font-mono text-xs font-bold text-ink">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-foreground/90">{step}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---- Readout grid ---- */

function ReadoutGrid({
  cells,
}: {
  cells: { label: string; value: string; tone?: "up" | "down" | "flat" }[];
}) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cells.map((c, i) => (
        <div
          key={i}
          className="border-l-2 border-line pl-3"
        >
          <div className="font-mono text-[11px] text-fg-muted">{c.label}</div>
          <div
            className={`mt-1 font-mono text-base font-semibold ${
              c.tone === "up"
                ? "text-reserve"
                : c.tone === "down"
                ? "text-[#A2543D]"
                : "text-foreground"
            }`}
          >
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * SECTION 5 — GOLD & SILVER
 * ============================================================ */

function GoldSilverSection() {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="05 — The Anchor"
        title="Gold does two jobs, and neither one moves"
        lede="Gold isn't a currency competing for space in the basket above. It plays two separate, quieter roles."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
                <Scale className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-lg text-foreground">
                First — it's the ruler
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Every currency's momentum is measured against gold's price — not the dollar, not any
              other sovereign currency — precisely because gold has no central bank, no issuer, and
              nothing to gain from inflating itself. It's the one measurement in the system nobody
              can lean on.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="h-full rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.08] to-transparent p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/50 bg-gold/10">
                <Crown className="h-5 w-5 text-gold" />
              </div>
              <h3 className="font-display text-lg text-foreground">
                Second — it's held directly
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Alongside the currency basket, roughly a fifth of total reserves sit in physical gold
              and silver — a fixed structural layer that target-holds its share regardless of which
              currency in the basket above is having a good or bad year. Drag the slider above into
              deeply negative territory and watch: the outer ring reshuffles. The inner ring
              doesn't.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Bullion split */}
      <Reveal>
        <div className="mt-8 rounded-xl border border-line bg-ink-soft p-6">
          <div className="flex items-center gap-2">
            <Hexagon className="h-5 w-5 text-gold" />
            <h3 className="font-display text-lg text-foreground">
              The bullion split
            </h3>
          </div>

          {/* Visual split bar */}
          <div className="mt-5 flex h-10 w-full overflow-hidden rounded-lg border border-line">
            <div
              className="flex items-center justify-center text-xs font-bold text-ink"
              style={{
                background: "linear-gradient(90deg, #D4AF37, #EBCB6E)",
                width: "80%",
              }}
            >
              Gold · 80%
            </div>
            <div
              className="flex items-center justify-center text-xs font-bold text-ink"
              style={{
                background: "linear-gradient(90deg, #B7BCC0, #DCDFE2)",
                width: "20%",
              }}
            >
              Ag · 20%
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gold/20 bg-gold/[0.04] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-gold-deep">GOLD</span>
                <Badge className="border-gold/40 bg-gold/10 text-gold">
                  60–95% of bullion
                </Badge>
              </div>
              <div className="mt-2 font-display text-2xl text-foreground">80%</div>
              <div className="text-[11px] text-fg-muted">current target</div>
            </div>
            <div className="rounded-lg border border-line bg-ink-card p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-fg-muted">SILVER</span>
                <Badge className="border-line bg-ink text-fg-muted">
                  5–40% of bullion
                </Badge>
              </div>
              <div className="mt-2 font-display text-2xl text-foreground">20%</div>
              <div className="text-[11px] text-fg-muted">current target</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* 3 scenarios */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <GoldScenarioCard
          icon={TrendingDown}
          title="If gold prices drop?"
          body="The Council may buy more gold, within the 60–95% range. The basket's currency weights adjust upward as gold weakens against them."
        />
        <GoldScenarioCard
          icon={TrendingUp}
          title="If gold rises sharply?"
          body="The Council may sell some gold, within the 60–95% range. Currency weights shrink as gold strengthens against them."
        />
        <GoldScenarioCard
          icon={Activity}
          title="If gold is volatile?"
          body="Increase silver temporarily, within the 5–40% range. Silver dampens gold's volatility — the bullion layer remains a steady anchor."
        />
      </div>

      <Reveal>
        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-fg-muted">
          <span className="font-semibold text-gold">Key insight:</span> gold is{" "}
          <em>not</em> in the currency basket — it's a separate, fixed structural layer. When
          currencies drop against gold → their weight decreases → but the gold{" "}
          <span className="font-semibold text-gold">reserve layer (16%)</span> doesn't change.
        </p>
      </Reveal>
    </section>
  );
}

function GoldScenarioCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof TrendingUp;
  title: string;
  body: string;
}) {
  return (
    <Reveal>
      <div className="h-full rounded-xl border border-line bg-ink-soft p-5">
        <Icon className="h-5 w-5 text-gold" />
        <h4 className="mt-3 font-display text-base text-foreground">{title}</h4>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">{body}</p>
      </div>
    </Reveal>
  );
}

/* ============================================================
 * SECTION 6 — MINTING FLOW
 * ============================================================ */

function MintingFlowSection({ reducedMotion }: { reducedMotion: boolean }) {
  const steps = [
    { n: 1, label: "User deposits $1M in eligible assets", icon: Wallet, color: "#8A7A55" },
    { n: 2, label: "Institution verifies deposit", icon: ShieldCheck, color: "#3B6E8C" },
    { n: 3, label: "Monetary Engine calculates NAV (basket + reserve value)", icon: Cog, color: "#D4AF37" },
    { n: 4, label: "Mint MTQ = deposit value minus 0.05% fee", icon: CircleDollarSign, color: "#4F7A55" },
    { n: 5, label: "Deposit added to Reserve Pool → Rebalancing Algorithm ensures allocation stays in range", icon: PiggyBank, color: "#9B5B3F" },
    { n: 6, label: "User receives MTQ", icon: Coins, color: "#EBCB6E" },
  ];
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="06 — How Minting Works"
        title="From deposit to MTQ — six bounded steps"
        lede="No discretionary minting. Every MTQ ever issued is born from a verified deposit, recorded against a 100% reserve, and rebalanced back inside constitutional ranges."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.08}>
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative h-full overflow-hidden rounded-xl border border-line bg-ink-soft p-5"
            >
              <div
                className="absolute left-0 top-0 h-1 w-full"
                style={{ background: s.color, opacity: 0.6 }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}55`,
                  }}
                >
                  <s.icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold text-gold">
                      {s.n}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-fg-muted">
                      step
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">{s.label}</p>
                </div>
              </div>
              {i < steps.length - 1 && !reducedMotion && (
                <motion.div
                  className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 lg:block"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                >
                  <ArrowRight className="h-4 w-4 text-gold/50" />
                </motion.div>
              )}
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * SECTION 7 — CONSTITUTIONAL GUARDRAILS
 * ============================================================ */

function GuardrailsSection() {
  const guardrails = [
    { title: "100% Reserve Ratio", desc: "Reserves ≥ supply always. Every MTQ is fully backed, on-chain verifiable.", icon: ShieldCheck, value: "≥ 100%" },
    { title: "No Discretionary Minting", desc: "MTQ is only ever minted on verified deposit. No algorithmic expansion.", icon: Lock, value: "Deposit-only" },
    { title: "No Lending of Reserves", desc: "Reserves are never lent, staked, or rehypothecated. They sit idle, by design.", icon: Lock, value: "Never" },
    { title: "No Commingling", desc: "Stablecoins never mix with settlement reserves. Each layer is segregated.", icon: Boxes, value: "Segregated" },
    { title: "Concentration Cap", desc: "No currency may exceed 60% of the basket. Hard ceiling, enforced on every rebalance.", icon: Gauge, value: "≤ 60%" },
    { title: "Minimum Floor", desc: "No currency may fall below 0.5% without entering a formal removal review.", icon: TrendingDown, value: "≥ 0.5%" },
    { title: "Bullion Range", desc: "Physical bullion must stay within 15–25% of total reserves.", icon: Crown, value: "15–25%" },
    { title: "Gold Range", desc: "Gold must stay within 60–95% of the bullion layer.", icon: Coins, value: "60–95%" },
    { title: "Silver Range", desc: "Silver must stay within 5–40% of the bullion layer.", icon: Droplets, value: "5–40%" },
    { title: "Stablecoin Cap", desc: "Stablecoins ≤ 8% of total reserves, with single-issuer cap at 20%.", icon: CircleDollarSign, value: "≤ 8%" },
  ];

  return (
    <section className="border-t border-line py-16 sm:py-20">
      <SectionHeader
        eyebrow="07 — Constitutional Guardrails"
        title="Ten invariants the engine cannot cross"
        lede="These aren't policy preferences — they're encoded in the Constitution itself. The Monetary Engine enforces them on every cycle, and the Multi-Sig Safe blocks any action that would violate them."
      />

      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guardrails.map((g, i) => (
          <Reveal key={g.title} delay={(i % 3) * 0.05}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative h-full overflow-hidden rounded-xl border border-line bg-ink-soft p-5"
            >
              <div className="absolute right-0 top-0 h-px w-12 bg-gradient-to-r from-transparent to-gold/40" />
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/[0.06]">
                  <g.icon className="h-5 w-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-display text-sm text-foreground">{g.title}</h4>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-fg-muted">{g.desc}</p>
                  <div className="mt-3 inline-flex items-center rounded-md border border-gold/30 bg-gold/[0.08] px-2 py-0.5 font-mono text-xs font-semibold text-gold-soft">
                    {g.value}
                  </div>
                </div>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-gold/30 bg-gold/[0.04] p-5">
          <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm leading-relaxed text-foreground/90">
            <span className="font-semibold text-gold">Why this matters:</span>{" "}
            the Constitution is the source code of trust. Every invariant above is a
            self-executing rule — no council vote can waive it, no market condition can
            suspend it. If any rule would be violated, the Multi-Sig Safe refuses to sign.
            That's what "constitutional" means in MITHQAL.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================================================
 * Shared bits
 * ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="max-w-3xl">
      <Reveal>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
          {eyebrow}
        </div>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-2 font-display text-2xl font-semibold text-foreground sm:text-3xl">
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.1}>
          <p className="mt-3 text-base leading-relaxed text-fg-muted">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}
