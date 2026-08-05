"use client";

/* ============================================================
 * ReserveFlowSimulator — Chapter XX (Task 14-a)
 * ------------------------------------------------------------
 * Interactive reserve-flow simulator.
 *
 * Layout:
 *   §1  Header + transaction-size slider ($1K – $10M)
 *   §2  11-stage visual flow showing where the funds go
 *        1. Customer deposits fiat
 *        2. MTQ minted (5 bps fee)
 *        3. Reserve procurement initiated
 *        4. Best execution scored
 *        5. Gold/silver purchased
 *        6. Custody transfer
 *        7. Proof of Reserve updated
 *        8. Performance participation computed
 *        9. Revenue allocated (60/25/15)
 *       10. Reserve growth recorded
 *       11. Redemption path (always-on)
 *   §3  Allocation breakdown (real-time as user moves slider)
 *
 * Theming: institutional palette only — NO indigo/blue.
 * All numbers use tabular-nums + font-mono.
 *
 * Task ID: 14-a  ·  Agent: Chief Enterprise Software Engineer
 * ============================================================ */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Coins,
  Briefcase,
  Award,
  Gem,
  Vault,
  ShieldCheck,
  TrendingUp,
  CircleDollarSign,
  Lock,
  ArrowRight,
  ArrowDown,
  Users,
  Scale,
  Receipt,
  Zap,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

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

const fmtUsd = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
};

const fmtUsdFull = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/* ============================================================
 * Constants — fee schedule + flow stages
 * ============================================================ */

const MINT_FEE_BPS = 5; // 5 basis points
const MINT_FEE_CAP = 5_000; // $5K cap
const REDEEM_FEE_BPS = 5;
const REDEEM_FEE_CAP = 5_000;
const TRANSFER_FEE_BPS = 1;

// Performance participation split (must mirror engine)
const SPLIT = {
  reserveGrowth: 0.6,
  markets: 0.25,
  commercial: 0.15,
};

// Example benchmark / execution prices (per oz gold, USD)
const GOLD_BENCHMARK = 2400;
const GOLD_EXECUTION = 2376; // 1% below benchmark → savings

interface FlowStage {
  step: number;
  icon: typeof Banknote;
  title: string;
  description: string;
  accent: "gold" | "reserve" | "gold-deep" | "muted";
}

const FLOW_STAGES: FlowStage[] = [
  {
    step: 1,
    icon: Banknote,
    title: "Customer deposits fiat",
    description: "Fiat enters the Institution via the mint operation.",
    accent: "gold",
  },
  {
    step: 2,
    icon: Coins,
    title: "MTQ minted",
    description: "MTQ is minted 1:1 against NAV. Mint fee (5 bps, capped at $5K) accrues to Operations.",
    accent: "gold-deep",
  },
  {
    step: 3,
    icon: Briefcase,
    title: "Reserve procurement initiated",
    description: "Markets Ltd starts the 12-stage procurement workflow (RFQ, benchmark, dealer responses).",
    accent: "muted",
  },
  {
    step: 4,
    icon: Award,
    title: "Best execution scored",
    description: "Dealer responses scored against 12 criteria. Approval threshold: 75 / 100.",
    accent: "gold",
  },
  {
    step: 5,
    icon: Gem,
    title: "Gold / silver purchased",
    description: "Asset purchased at execution price. If below benchmark, savings emerge.",
    accent: "gold-deep",
  },
  {
    step: 6,
    icon: Vault,
    title: "Custody transfer",
    description: "Asset delivered to segregated multi-custodian custody. Ownership verified.",
    accent: "reserve",
  },
  {
    step: 7,
    icon: ShieldCheck,
    title: "Proof of Reserve updated",
    description: "Daily PoR publication refreshed. MTQ supply now backed by the new reserve asset.",
    accent: "reserve",
  },
  {
    step: 8,
    icon: TrendingUp,
    title: "Performance participation",
    description: "Savings (benchmark − execution × qty) split 60/25/15 across reserve, markets, commercial.",
    accent: "gold",
  },
  {
    step: 9,
    icon: CircleDollarSign,
    title: "Revenue allocated",
    description: "15% commercial share funds Operations + Holding. 25% rewards Markets. 60% strengthens reserve.",
    accent: "gold-deep",
  },
  {
    step: 10,
    icon: Lock,
    title: "Reserve growth recorded",
    description: "Reserve ratio climbs above 102%. Minting may continue; redemption remains always-on.",
    accent: "reserve",
  },
  {
    step: 11,
    icon: Users,
    title: "Redemption (always-on)",
    description: "Holder may redeem MTQ for fiat at any time. Burn → liquidate reserve → return fiat (5 bps fee, $5K cap).",
    accent: "gold",
  },
];

/* ============================================================
 * Main component
 * ============================================================ */

export function ReserveFlowSimulator() {
  // Slider value: $1K – $10M (logarithmic feel via raw value)
  const [amount, setAmount] = useState(100_000);

  // Compute the flow economics in real-time
  const economics = useEconomics(amount);

  return (
    <section
      id="reserve-flow-simulator"
      className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      aria-labelledby="rfs-heading"
    >
      <Reveal>
        <Eyebrow>Chapter XX · Interactive Simulator</Eyebrow>
        <h2
          id="rfs-heading"
          className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
        >
          Reserve Flow Simulator
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-fg-muted sm:text-base">
          Drag the slider to see exactly how a transaction flows through the
          Mithqal Institution — from fiat deposit to MTQ mint, through the
          12-stage procurement pipeline, into segregated custody, and back to
          the participant via always-on redemption.
        </p>
      </Reveal>

      {/* ---- §1 Slider ---- */}
      <Reveal delay={0.1}>
        <Card className="mt-8 border-gold/30 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gold" aria-hidden="true" />
                Transaction Size
              </span>
              <AnimatedValue
                value={fmtUsdFull(economics.amount)}
                className="font-mono text-2xl font-semibold tabular-nums text-gold"
              />
            </CardTitle>
            <CardDescription>
              Adjust from $1,000 to $10,000,000 — all values update in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="px-1 py-2">
              <Slider
                value={[amount]}
                min={1_000}
                max={10_000_000}
                step={1_000}
                onValueChange={(v) => setAmount(v[0])}
                aria-label="Transaction size in USD"
                className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:border-gold"
              />
              <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-fg-muted">
                <span>$1K</span>
                <span>$100K</span>
                <span>$1M</span>
                <span>$5M</span>
                <span>$10M</span>
              </div>
            </div>
            {/* Quick presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-fg-muted">Presets:</span>
              {[1_000, 50_000, 250_000, 1_000_000, 5_000_000, 10_000_000].map((v) => (
                <button
                  key={v}
                  onClick={() => setAmount(v)}
                  className={`rounded-md border px-2 py-1 text-xs font-medium transition ${
                    amount === v
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-line bg-ink-soft text-fg-muted hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  {fmtUsd(v)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §2 Visual flow ---- */}
      <Reveal delay={0.15}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-gold" aria-hidden="true" />
              Live Flow
            </CardTitle>
            <CardDescription>
              11 stages · each card updates as the transaction size changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {FLOW_STAGES.map((stage, i) => (
                <FlowCard
                  key={stage.step}
                  stage={stage}
                  economics={economics}
                  isLast={i === FLOW_STAGES.length - 1}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* ---- §3 Allocation breakdown ---- */}
      <Reveal delay={0.2}>
        <Card className="mt-6 bg-ink-card/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-4 w-4 text-gold" aria-hidden="true" />
              Allocation Breakdown
            </CardTitle>
            <CardDescription>
              Where every dollar of the transaction goes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Left: dollar allocations */}
              <div className="space-y-3">
                <AllocationRow
                  label="To reserve procurement"
                  value={economics.netToProcurement}
                  total={economics.amount}
                  color="bg-reserve"
                  textColor="text-reserve"
                  icon={Gem}
                  caption={`Purchases ${economics.goldOz.toLocaleString("en-US", { maximumFractionDigits: 4 })} oz gold @ $${GOLD_EXECUTION}/oz`}
                />
                <AllocationRow
                  label="Mint fee (Operations)"
                  value={economics.mintFee}
                  total={economics.amount}
                  color="bg-gold"
                  textColor="text-gold"
                  icon={Receipt}
                  caption={`5 bps, capped at $5,000 · ${((economics.mintFee / economics.amount) * 100).toFixed(3)}% effective`}
                />
                <AllocationRow
                  label="Reserve growth (60% of savings)"
                  value={economics.reserveShare}
                  total={economics.amount}
                  color="bg-reserve"
                  textColor="text-reserve"
                  icon={Lock}
                  caption="Strengthens the reserve backing every MTQ"
                />
                <AllocationRow
                  label="Markets Ltd (25% of savings)"
                  value={economics.marketsShare}
                  total={economics.amount}
                  color="bg-gold"
                  textColor="text-gold"
                  icon={Briefcase}
                  caption="Performance reward for below-benchmark execution"
                />
                <AllocationRow
                  label="Commercial revenue (15% of savings)"
                  value={economics.commercialShare}
                  total={economics.amount}
                  color="bg-gold-deep"
                  textColor="text-gold-deep"
                  icon={CircleDollarSign}
                  caption="Funds Operations + Holding"
                />
              </div>

              {/* Right: totals + savings meter */}
              <div className="space-y-3">
                <div className="rounded-lg border border-gold/30 bg-gold/5 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                    Total savings (benchmark − execution)
                  </div>
                  <AnimatedValue
                    value={fmtUsdFull(economics.savings)}
                    className="mt-1 block font-mono text-3xl font-semibold tabular-nums text-reserve"
                  />
                  <div className="mt-1 flex items-center gap-2 text-xs text-fg-muted">
                    <TrendingUp className="h-3 w-3 text-reserve" aria-hidden="true" />
                    <span className="tabular-nums">
                      {economics.performanceGainPct.toFixed(2)}% performance gain
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-ink-soft/40 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                    Benchmark vs Execution
                  </div>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Benchmark price/oz</span>
                      <span className="font-mono tabular-nums text-foreground">
                        ${GOLD_BENCHMARK.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Execution price/oz</span>
                      <span className="font-mono tabular-nums text-foreground">
                        ${GOLD_EXECUTION.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-line pt-2">
                      <span className="text-fg-muted">Gold purchased</span>
                      <span className="font-mono tabular-nums text-gold">
                        {economics.goldOz.toLocaleString("en-US", { maximumFractionDigits: 4 })} oz
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-ink-soft/40 p-4">
                  <div className="text-[10px] uppercase tracking-wider text-fg-muted">
                    Redemption path (always-on)
                  </div>
                  <div className="mt-2 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Redeem fee (5 bps, cap $5K)</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {fmtUsdFull(economics.redeemFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-fg-muted">Transfer fee (1 bp)</span>
                      <span className="font-mono tabular-nums text-foreground">
                        {fmtUsdFull(economics.transferFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-line pt-2">
                      <span className="text-fg-muted">Net to redeemer</span>
                      <span className="font-mono tabular-nums text-reserve">
                        {fmtUsdFull(economics.amount - economics.redeemFee)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal delay={0.25}>
        <p className="mt-6 text-center text-xs text-fg-muted">
          Illustrative only — benchmark $2,400/oz · execution $2,376/oz (1% below benchmark).
          Actual prices, fees, and savings vary by market conditions and dealer responses.
        </p>
      </Reveal>
    </section>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function FlowCard({
  stage,
  economics,
  isLast,
}: {
  stage: FlowStage;
  economics: ReturnType<typeof useEconomics>;
  isLast: boolean;
}) {
  const accentClass =
    stage.accent === "gold"
      ? "border-gold/30 bg-gold/5 text-gold"
      : stage.accent === "reserve"
        ? "border-reserve/30 bg-reserve/5 text-reserve"
        : stage.accent === "gold-deep"
          ? "border-gold-deep/30 bg-gold-deep/5 text-gold-deep"
          : "border-line bg-ink-soft/40 text-fg-muted";

  const Icon = stage.icon;

  // Per-stage live value
  let liveValue: string | null = null;
  switch (stage.step) {
    case 1:
      liveValue = fmtUsdFull(economics.amount);
      break;
    case 2:
      liveValue = `${fmtUsdFull(economics.mintFee)} fee`;
      break;
    case 3:
      liveValue = fmtUsdFull(economics.netToProcurement);
      break;
    case 4:
      liveValue = "Score ≥ 75";
      break;
    case 5:
      liveValue = `${economics.goldOz.toLocaleString("en-US", { maximumFractionDigits: 4 })} oz`;
      break;
    case 6:
      liveValue = "Segregated";
      break;
    case 7:
      liveValue = "Published";
      break;
    case 8:
      liveValue = fmtUsdFull(economics.savings);
      break;
    case 9:
      liveValue = fmtUsdFull(economics.marketsShare + economics.commercialShare);
      break;
    case 10:
      liveValue = `+${fmtUsdFull(economics.reserveShare)}`;
      break;
    case 11:
      liveValue = `${fmtUsdFull(economics.redeemFee)} fee`;
      break;
  }

  return (
    <div className={`relative rounded-xl border p-4 transition-all ${accentClass}`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-lg border p-2 ${accentClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="font-mono text-[10px] font-semibold tabular-nums text-fg-muted">
          {String(stage.step).padStart(2, "0")} / 11
        </span>
      </div>
      <div className="mt-2 text-sm font-semibold text-foreground">
        {stage.title}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-fg-muted">
        {stage.description}
      </p>
      {liveValue && (
        <div className="mt-2 border-t border-line pt-2">
          <AnimatedValue
            value={liveValue}
            className="block font-mono text-xs font-semibold tabular-nums text-foreground"
          />
        </div>
      )}
      {!isLast && (
        <ArrowDown className="absolute -bottom-3 left-1/2 hidden h-4 w-4 -translate-x-1/2 text-fg-muted lg:block xl:hidden" aria-hidden="true" />
      )}
    </div>
  );
}

function AllocationRow({
  label,
  value,
  total,
  color,
  textColor,
  icon: Icon,
  caption,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
  textColor: string;
  icon: typeof Banknote;
  caption: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="rounded-lg border border-line bg-ink-soft/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-3.5 w-3.5 ${textColor}`} aria-hidden="true" />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <AnimatedValue
          value={fmtUsdFull(value)}
          className={`font-mono text-sm font-semibold tabular-nums ${textColor}`}
        />
      </div>
      <div className="mt-2">
        <Progress
          value={Math.min(100, pct)}
          className={`h-1.5 bg-ink-soft ${color.replace("bg-", "[&_[data-slot=progress-indicator]]:bg-")}`}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-fg-muted">
        <span>{pct.toFixed(3)}% of total</span>
        <span className="normal-case tracking-normal">{caption}</span>
      </div>
    </div>
  );
}

/* ============================================================
 * Animated value — number tween using framer-motion
 * ============================================================ */

function AnimatedValue({ value, className }: { value: string; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2 }}
        className={className}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/* ============================================================
 * Hook: compute economics from amount (extracted for typing)
 * ============================================================ */

function useEconomics(amount: number) {
  return useMemo(() => {
    const mintFeeRaw = amount * (MINT_FEE_BPS / 10_000);
    const mintFee = Math.min(mintFeeRaw, MINT_FEE_CAP);
    const netToProcurement = amount - mintFee;
    const goldOz = netToProcurement / GOLD_EXECUTION;
    const benchmarkCost = goldOz * GOLD_BENCHMARK;
    const executionCost = goldOz * GOLD_EXECUTION;
    const savings = Math.max(0, benchmarkCost - executionCost);
    const reserveShare = savings * SPLIT.reserveGrowth;
    const marketsShare = savings * SPLIT.markets;
    const commercialShare = savings * SPLIT.commercial;
    const redeemFeeRaw = amount * (REDEEM_FEE_BPS / 10_000);
    const redeemFee = Math.min(redeemFeeRaw, REDEEM_FEE_CAP);
    const transferFee = amount * (TRANSFER_FEE_BPS / 10_000);
    const performanceGainPct = benchmarkCost > 0 ? (savings / benchmarkCost) * 100 : 0;
    return {
      amount,
      mintFee,
      netToProcurement,
      goldOz,
      benchmarkCost,
      executionCost,
      savings,
      reserveShare,
      marketsShare,
      commercialShare,
      redeemFee,
      transferFee,
      performanceGainPct,
    };
  }, [amount]);
}
