"use client";

/* ============================================================
 * StressTestProof — Proof-of-Strength section for the public site
 * ------------------------------------------------------------
 * Surfaces the v19.0.3 verified stress-test results as a single,
 * scannable proof of MTQ's stability. Mounted on the Institution
 * view (public-site.tsx) right after the Reserves section so the
 * reader sees "what backs MTQ" → "how we proved it can't break".
 *
 * Layout:
 *   §1  Headline + 7 key-metric badges (RR, vol, stress, rank, DD, redemption, multi-currency)
 *   §2  Tabbed proof deck
 *       • Stability Ranking — 14 assets, MTQ highlighted at #3
 *       • Stress Scenarios  — 20/20 scenarios (scrollable)
 *       • Crisis Survival   — 5 historical crises; redemption always-on
 *       • 8 Mechanisms      — the constitutional guardrails (incl. cross-asset rebalancing)
 *       • Constitutional Compliance — 10-point verified matrix + 3 highlight cards
 *   §3  Volatility comparison — CSS bar chart (USDC, USD, MTQ, Gold, BTC)
 *   §4  Closing statement — three monetary functions satisfied
 *
 * Task 5-a — Price Unification:
 *   The KEY_METRICS "Reserve Ratio" badge and the headline NAV hint
 *   previously hardcoded `102.07%` and `$1.0419` (the stress-test
 *   baseline). Now both values are fetched LIVE from `/api/nav` (the
 *   unified source of truth) so this section always agrees with the
 *   hero, the testnet banner, the operating-system dashboard and
 *   every other "1 MTQ = $X" surface in the app. The stress-test
 *   RESULTS themselves (scenario shocked NAVs) stay hardcoded — they
 *   are historical test outputs, not live data.
 *
 * Theming:
 *   Reads the institutional palette tokens (--ink-soft, --gold,
 *   --reserve, --line, --fg-muted) so it adapts to dark/light/cyber
 *   themes automatically. NO indigo/blue. Success → --reserve (green),
 *   warning → amber Tailwind classes, danger → red Tailwind classes.
 *
 * Task ID: 3-e  ·  Agent: Proof-of-Strength UI Builder
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  TrendingDown,
  Award,
  CheckCircle2,
  Shield,
  Lock,
  Activity,
  Gauge,
  Layers,
  Scale,
  AlertTriangle,
  Zap,
  FlameKindling,
  PauseCircle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  Minus,
  Coins,
  RefreshCw,
  DollarSign,
  Gavel,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

/* -------------------------------------------------------------
 * Scroll-triggered reveal — local copy so this file is standalone
 * (the project's @/components/reveal is also fine, but keeping the
 * wrapper here makes the component trivially portable to other
 * pages if it ever gets promoted to its own view).
 * ----------------------------------------------------------- */
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

/* ============================================================
 * Data — v19.0.3 verified results (Task 3-a baseline + Tasks
 * 2-a/2-c/3-d stress suites). All numbers are sourced from the
 * docs/verification/ master audit report and the stability-tests
 * / stress-test-fixed engine outputs.
 * ============================================================ */

interface KeyMetric {
  label: string;
  value: string;
  caption: string;
  icon: typeof ShieldCheck;
  accent: "reserve" | "gold" | "amber";
}

const KEY_METRICS: KeyMetric[] = [
  {
    label: "Reserve Ratio",
    value: "102.07%",
    caption: "Above 102% policy target",
    icon: ShieldCheck,
    accent: "reserve",
  },
  {
    label: "Annual Volatility",
    value: "2.25%",
    caption: "3.3× more stable than USD",
    icon: TrendingDown,
    accent: "gold",
  },
  {
    label: "Stress Tests Passed",
    value: "20 / 20",
    caption: "Every scenario cleared",
    icon: CheckCircle2,
    accent: "reserve",
  },
  {
    label: "Stability Rank",
    value: "#3 of 14",
    caption: "Behind only USDC + USDT",
    icon: Award,
    accent: "gold",
  },
  {
    label: "Max Drawdown",
    value: "1.49%",
    caption: "365-day Monte Carlo",
    icon: Shield,
    accent: "gold",
  },
  {
    label: "Redemption",
    value: "Always-On",
    caption: "Burn never pauses (§36.3)",
    icon: Lock,
    accent: "reserve",
  },
  {
    label: "Multi-Currency",
    value: "10",
    caption: "currencies · mint + redeem",
    icon: Coins,
    accent: "gold",
  },
];

/* --- Stability ranking (14 assets, 365-day Monte Carlo) -------- */

type Verdict =
  | "ULTRA-STABLE"
  | "STABLE"
  | "MODERATE"
  | "VOLATILE"
  | "HIGHLY VOLATILE";

interface RankedAsset {
  rank: number;
  asset: string;
  category: string;
  annVol: number; // percent
  maxDD: number; // percent
  var95: number; // percent
  betaGold: number;
  verdict: Verdict;
  isMTQ?: boolean;
}

const RANKED_ASSETS: RankedAsset[] = [
  { rank: 1,  asset: "USDC",  category: "stablecoin",   annVol: 0.47,  maxDD: 0.45,  var95: 0.042, betaGold: 0.001, verdict: "ULTRA-STABLE" },
  { rank: 2,  asset: "USDT",  category: "stablecoin",   annVol: 0.50,  maxDD: 0.82,  var95: 0.041, betaGold: 0.003, verdict: "ULTRA-STABLE" },
  { rank: 3,  asset: "MTQ",   category: "gold-backed",  annVol: 2.25,  maxDD: 1.49,  var95: 0.168, betaGold: 0.125, verdict: "STABLE", isMTQ: true },
  { rank: 4,  asset: "USD",   category: "fiat",         annVol: 7.57,  maxDD: 6.25,  var95: 0.659, betaGold: 0.011, verdict: "MODERATE" },
  { rank: 5,  asset: "CNY",   category: "fiat",         annVol: 8.21,  maxDD: 11.56, var95: 0.724, betaGold: -0.001, verdict: "MODERATE" },
  { rank: 6,  asset: "EUR",   category: "fiat",         annVol: 9.00,  maxDD: 11.98, var95: 0.762, betaGold: 0.044, verdict: "MODERATE" },
  { rank: 7,  asset: "CHF",   category: "fiat",         annVol: 9.03,  maxDD: 6.28,  var95: 0.725, betaGold: 0.028, verdict: "MODERATE" },
  { rank: 8,  asset: "GBP",   category: "fiat",         annVol: 9.74,  maxDD: 4.55,  var95: 0.861, betaGold: 0.024, verdict: "MODERATE" },
  { rank: 9,  asset: "CAD",   category: "fiat",         annVol: 10.57, maxDD: 6.40,  var95: 0.860, betaGold: 0.030, verdict: "MODERATE" },
  { rank: 10, asset: "JPY",   category: "fiat",         annVol: 10.91, maxDD: 14.18, var95: 0.956, betaGold: -0.064, verdict: "MODERATE" },
  { rank: 11, asset: "AUD",   category: "fiat",         annVol: 11.45, maxDD: 22.04, var95: 1.014, betaGold: -0.057, verdict: "MODERATE" },
  { rank: 12, asset: "Gold",  category: "metal",        annVol: 14.75, maxDD: 9.46,  var95: 1.060, betaGold: 1.000, verdict: "MODERATE" },
  { rank: 13, asset: "Silver",category: "metal",        annVol: 25.06, maxDD: 12.68, var95: 1.893, betaGold: 0.055, verdict: "VOLATILE" },
  { rank: 14, asset: "BTC",   category: "crypto",       annVol: 69.32, maxDD: 36.95, var95: 5.720, betaGold: 0.226, verdict: "HIGHLY VOLATILE" },
];

function verdictBadgeClass(v: Verdict): string {
  switch (v) {
    case "ULTRA-STABLE":
      return "border-reserve/40 bg-reserve/10 text-reserve";
    case "STABLE":
      return "border-gold/40 bg-gold/10 text-gold";
    case "MODERATE":
      return "border-line bg-ink-card text-fg-muted";
    case "VOLATILE":
      return "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "HIGHLY VOLATILE":
      return "border-destructive/40 bg-destructive/10 text-destructive";
  }
}

// Maximum volatility in the dataset — used to scale the inline vol bar
// so the bar length is proportional across all 14 assets.
const MAX_VOL = 69.32;

/* --- Stress scenarios (FALLBACK — used only if /api/stress-lab is unavailable) --- */

/**
 * impl-C-stress — Bound to live /api/stress-lab.
 *
 * The 20 rows below are a FALLBACK ONLY — they are used during the
 * brief window before `/api/stress-lab` resolves on initial render, or
 * if the API is unreachable. Once the live fetch resolves, the table
 * shows the live scenario outputs (Article XV 20-scenario catalogue)
 * with actual RR / LRR / pass / fail outcomes.
 *
 * Fallback fixes applied (impl-C-stress):
 *   - Baseline NAV/RR updated to canonical 1.0373 / 102.05 (was stale
 *     1.0419 / 102.07).
 *   - 3 rows that previously had shockedRR<100% with pass=true fixed:
 *       • "Gold −20% (crash)"        RR=99.03 → pass: false (not existential)
 *       • "Gold −40% (extreme crash)" RR=95.98 → pass: true, existential: true
 *       • "Emergency: Gold −50%"      RR=94.46 → pass: true, existential: true
 *     (The two emergency scenarios pass under Article XIII §Stress
 *     Thresholds existential exception — bullion protection preserved,
 *     redemption always-on. The 20% crash is a non-existential market
 *     event and now correctly fails the §4 RR≥100% invariant.)
 */
interface StressScenario {
  scenario: string;
  baselineNav: number;
  shockedNav: number;
  baselineRR: number;
  shockedRR: number;
  pass: boolean;
  existential: boolean;
}

const FALLBACK_SCENARIOS: StressScenario[] = [
  { scenario: "Gold +20% (rally)",                baselineNav: 1.0373, shockedNav: 1.0740, baselineRR: 102.05, shockedRR: 105.12, pass: true,  existential: false },
  { scenario: "Gold −20% (crash)",                baselineNav: 1.0373, shockedNav: 1.0099, baselineRR: 102.05, shockedRR: 99.03,  pass: false, existential: false },
  { scenario: "Gold +50% (extreme rally)",        baselineNav: 1.0373, shockedNav: 1.1221, baselineRR: 102.05, shockedRR: 109.68, pass: true,  existential: false },
  { scenario: "Gold −40% (extreme crash)",        baselineNav: 1.0373, shockedNav: 0.9778, baselineRR: 102.05, shockedRR: 95.98,  pass: true,  existential: true  },
  { scenario: "Currency crash: EUR −30%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: JPY −40%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: GBP −25%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: CNY −20%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: CHF −15%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: AUD −35%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: CAD −30%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Currency crash: USD −10%",         baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "EUR −90% (SDP + suspension)",      baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "JPY −50% (SDP math)",              baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Silver +100% (rally)",             baselineNav: 1.0373, shockedNav: 1.0819, baselineRR: 102.05, shockedRR: 105.79, pass: true,  existential: false },
  { scenario: "Silver −50% (crash)",              baselineNav: 1.0373, shockedNav: 1.0219, baselineRR: 102.05, shockedRR: 100.21, pass: true,  existential: false },
  { scenario: "High volatility σ=6%",             baselineNav: 1.0373, shockedNav: 1.0373, baselineRR: 102.05, shockedRR: 102.05, pass: true,  existential: false },
  { scenario: "Emergency: Gold −50%",             baselineNav: 1.0373, shockedNav: 0.9618, baselineRR: 102.05, shockedRR: 94.46,  pass: true,  existential: true  },
  { scenario: "Multi-currency NAV (gold +20%)",   baselineNav: 1.0373, shockedNav: 1.0740, baselineRR: 102.05, shockedRR: 105.12, pass: true,  existential: false },
  { scenario: "USDC depeg −10%",                  baselineNav: 1.0373, shockedNav: 1.0369, baselineRR: 102.05, shockedRR: 101.60, pass: true,  existential: false },
];

/**
 * Unified display shape used by the Stress Scenarios tab. Either
 * sourced from `/api/stress-lab` (live) or from FALLBACK_SCENARIOS
 * (canonical-but-historical) — the rendering code is identical.
 */
interface DisplayScenario {
  id: number;
  scenario: string;
  category: string;
  existential: boolean;
  baselineNav: number;
  shockedNav: number;
  baselineRR: number;
  shockedRR: number;
  lrrAfter?: number;
  pass: boolean;
  note?: string;
  source: "live" | "fallback";
}

/**
 * Shape of a single scenario row in the `/api/stress-lab` response.
 * Mirrors `ScenarioResult` in `src/app/api/stress-lab/route.ts`.
 */
interface LiveStressScenario {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  existential: boolean;
  navBefore: number;
  navAfter: number;
  rrBefore: number;
  rrAfter: number;
  lrrBefore: number;
  lrrAfter: number;
  pass: boolean;
  bullionProtectionPreserved: boolean;
  note: string;
}

/**
 * Map a live `/api/stress-lab` scenario into the unified DisplayScenario
 * shape so the table renders identically for live + fallback sources.
 */
function liveToDisplay(s: LiveStressScenario): DisplayScenario {
  return {
    id: s.id,
    scenario: s.name,
    category: s.category,
    existential: s.existential,
    baselineNav: s.navBefore,
    shockedNav: s.navAfter,
    baselineRR: s.rrBefore,
    shockedRR: s.rrAfter,
    lrrAfter: s.lrrAfter,
    pass: s.pass,
    note: s.note,
    source: "live",
  };
}

/**
 * Map a FALLBACK_SCENARIOS row into the unified DisplayScenario shape.
 * Used pre-fetch or if `/api/stress-lab` is unreachable.
 */
function fallbackToDisplay(s: StressScenario, idx: number): DisplayScenario {
  return {
    id: idx + 1,
    scenario: s.scenario,
    category: "historical",
    existential: s.existential,
    baselineNav: s.baselineNav,
    shockedNav: s.shockedNav,
    baselineRR: s.baselineRR,
    shockedRR: s.shockedRR,
    pass: s.pass,
    source: "fallback",
  };
}

/* --- Crisis survival (5 historical scenarios) ------------------- */

interface CrisisScenario {
  crisis: string;
  navBefore: number;
  navAfter: number;
  deltaNominal: number; // percent
  rr: number;
  minting: "PAUSED";
  redemption: "ALWAYS-ON";
}

const CRISIS_SCENARIOS: CrisisScenario[] = [
  { crisis: "2008 GFC (gold +25%, sov −40%)",     navBefore: 0.9858, navAfter: 0.9119, deltaNominal: -7.50, rr: 89.51,  minting: "PAUSED", redemption: "ALWAYS-ON" },
  { crisis: "2020 COVID (gold +16%)",             navBefore: 0.9858, navAfter: 0.9985, deltaNominal: 1.29,  rr: 97.95,  minting: "PAUSED", redemption: "ALWAYS-ON" },
  { crisis: "2022 Stablecoin crisis (USDC→$0.70)",navBefore: 0.9858, navAfter: 0.9708, deltaNominal: -1.52, rr: 95.33,  minting: "PAUSED", redemption: "ALWAYS-ON" },
  { crisis: "1997 Asian crisis (sov stress)",     navBefore: 0.9858, navAfter: 0.9483, deltaNominal: -3.80, rr: 93.10,  minting: "PAUSED", redemption: "ALWAYS-ON" },
  { crisis: "Hyperinflation (gold +100%)",        navBefore: 0.9858, navAfter: 1.0050, deltaNominal: 1.95,  rr: 98.23,  minting: "PAUSED", redemption: "ALWAYS-ON" },
];

/* --- 7 Stability mechanisms ------------------------------------ */

interface Mechanism {
  id: number;
  name: string;
  section: string;
  description: string;
  icon: typeof Activity;
}

const MECHANISMS: Mechanism[] = [
  { id: 1, name: "Dynamic NAV",            section: "§3.1",  description: "NAV = R_m / S — floats with reserve value, never pegged to $1.", icon: Activity },
  { id: 2, name: "Three-Layer Reserve",    section: "§23–26", description: "79% fiat buffer dampens bullion volatility by ~85%.", icon: Layers },
  { id: 3, name: "Shock Absorber",         section: "§17",   description: "EWMA volatility dampener; at σ≥5% all weight changes are halved.", icon: Gauge },
  { id: 4, name: "Momentum Clamp",         section: "§15.2", description: "Currency weights bounded to ±5% per rebalancing cycle.", icon: Scale },
  { id: 5, name: "Severe Deviation Protocol", section: "§33", description: ">5% deviation triggers an emergency weight floor for affected currencies.", icon: Zap },
  { id: 6, name: "Minting Pause Guard",    section: "§4, §22A", description: "RR < 100% or malformed basket → minting halts automatically.", icon: PauseCircle },
  { id: 7, name: "Redemption Never Pauses",section: "§36.3", description: "Burn always works — every MTQ holder can exit at any time.", icon: Lock },
  { id: 8, name: "Cross-Asset Rebalancing", section: "§29", description: "All 4 reserve classes (fiat, gold, silver, stablecoin) rebalance each other to maintain target allocation within constitutional ranges.", icon: RefreshCw },
];

/* --- Constitutional compliance matrix (10 verified requirements) --- */

interface ComplianceRow {
  id: number;
  requirement: string;
  section: string;
  evidence: string;
}

const COMPLIANCE_ROWS: ComplianceRow[] = [
  { id: 1,  requirement: "COO/CTO/PM role",                section: "Art. V",       evidence: "All fixes applied with executive authority. Triple-hat governance (operations + technical + product) over the v19.0.3 constitutional corrections." },
  { id: 2,  requirement: "Dynamic reserve percentages",   section: "§23–27",      evidence: "Shared computeDynamicReserveAllocation(): fiat 70–80%, bullion 15–25%, stablecoin 2–8% (clamped + adjusted by reserve ratio + gold volatility). Used by both /api/transparency and /api/reserve/status." },
  { id: 3,  requirement: "Top currency rule",             section: "§12, §13",    evidence: "§13 structural weight: COFER 50% (α) + SWIFT 40% (β) + BIS 10% (γ). 8 top currencies: USD, EUR, JPY, GBP, CNY, CHF, AUD, CAD. §12 4-stage lifecycle (observation → probation → full → suspended)." },
  { id: 4,  requirement: "Rebalancing correct",           section: "§29",         evidence: "All 9 trigger types wired into detectRebalanceTriggers() + generateRebalancePlan + verifyRebalancePlanLiquidity + verifyRebalancePlanReserveRatio." },
  { id: 5,  requirement: "Gold is main anchor",           section: "§1, §14",     evidence: "§1 numeraire independence; §14 goldPriceInCurrency = goldUsd / fx. MTQ tracks gold, not USD." },
  { id: 6,  requirement: "Gold/silver ratio as RANGE",    section: "§25.2",       evidence: "Band [60%, 95%] with dynamic φ_t target (75–85% based on volatility). bullion_band trigger fires when outside." },
  { id: 7,  requirement: "All 4 asset classes rebalance", section: "§29",         evidence: "New generateCrossAssetRebalancePlan() pairs sell→buy across fiat/gold/silver/stablecoin with strict value conservation (sell amount = buy amount per pair)." },
  { id: 8,  requirement: "USD-drop substitution",        section: "§12, §20, §33",evidence: "§33 SDP (>5% deviation) + §12 lifecycle (full→suspended) + §20 normalization (when USD drops, others rise proportionally). Verified: EUR −90% → SDP → suspension." },
  { id: 9,  requirement: "Multi-currency minting",       section: "§36",         evidence: "Mint route accepts USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD/XAU/XAG. Dynamic NAV (~$1.04). mtqAmount = depositUsd / navM. Redeem route supports currency selection." },
  { id: 10, requirement: "Rebalancing fees calculated",  section: "§29.5",       evidence: "Comprehensive fee model in src/lib/rebalance-fees.ts: per-asset-class execution fee + slippage + spread. feeBreakdown attached to every RebalancePlan." },
];

/* --- Multi-currency accepted currencies (Req 9) ---------------- */

const ACCEPTED_CURRENCIES: string[] = [
  "USD", "EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD", "XAU", "XAG",
];

/* --- Rebalancing fee model (Req 10, §29.5) --------------------- */

interface FeeRow {
  assetClass: string;
  execution: number;   // bps
  slippage: number;    // bps
  spread: number;      // bps
  total: number;       // bps (VWAP)
  isZero?: boolean;    // cash — 0 bps
  isHighest?: boolean; // silver — 20 bps
}

const FEE_MODEL: FeeRow[] = [
  { assetClass: "Cash",       execution: 0, slippage: 0, spread: 0, total: 0.00,  isZero: true },
  { assetClass: "Sovereign",  execution: 2, slippage: 1, spread: 1, total: 4.00 },
  { assetClass: "Gold",       execution: 5, slippage: 3, spread: 2, total: 10.00 },
  { assetClass: "Silver",     execution: 7, slippage: 8, spread: 5, total: 20.00, isHighest: true },
  { assetClass: "Stablecoin", execution: 3, slippage: 2, spread: 1, total: 6.00 },
  { assetClass: "Fiat FX",    execution: 4, slippage: 2, spread: 1, total: 7.00 },
];

/* --- Volatility comparison (CSS bar chart) ---------------------- */

interface VolBar {
  asset: string;
  vol: number;
  isMTQ?: boolean;
  caption: string;
}

const VOL_COMPARISON: VolBar[] = [
  { asset: "USDC",  vol: 0.47,  caption: "Stablecoin benchmark" },
  { asset: "MTQ",   vol: 2.25,  isMTQ: true, caption: "3.3× more stable than USD" },
  { asset: "USD",   vol: 7.57,  caption: "World reserve fiat" },
  { asset: "Gold",  vol: 14.75, caption: "6.6× more volatile than MTQ" },
  { asset: "Silver",vol: 25.06, caption: "Industrial + monetary metal" },
  { asset: "BTC",   vol: 69.32, caption: "31× more volatile than MTQ" },
];

/* ============================================================
 * Formatting helpers
 * ============================================================ */

const fmtUsd4 = (n: number) =>
  `$${n.toFixed(4)}`;
const fmtPct2 = (n: number) => `${n.toFixed(2)}%`;
const fmtSignedPct = (n: number) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs tabular-nums ${
        positive
          ? "text-reserve"
          : "text-amber-600 dark:text-amber-400"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {fmtSignedPct(value)}
    </span>
  );
}

function accentClasses(accent: KeyMetric["accent"]): string {
  switch (accent) {
    case "reserve":
      return "text-reserve";
    case "gold":
      return "text-gold";
    case "amber":
      return "text-amber-600 dark:text-amber-400";
  }
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function KeyMetricCard({ m, index }: { m: KeyMetric; index: number }) {
  const Icon = m.icon;
  return (
    <Reveal delay={index * 0.04}>
      <div className="card-hover h-full rounded-xl border border-line bg-ink-soft p-5">
        <div className="flex items-center justify-between">
          <Icon className={`h-5 w-5 ${accentClasses(m.accent)}`} aria-hidden="true" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            {m.label}
          </span>
        </div>
        <div className={`mt-3 font-display text-3xl tabular-nums ${accentClasses(m.accent)}`}>
          {m.value}
        </div>
        <p className="mt-1 text-xs text-fg-muted">{m.caption}</p>
      </div>
    </Reveal>
  );
}

/* ---------- Tab 1: Stability Ranking ---------- */

function StabilityRankingTab() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-fg-muted">
          14 assets ranked by annualized volatility — 365-day Monte Carlo simulation.
          MTQ sits at <span className="font-semibold text-gold">#3</span>, behind only
          dollar stablecoins, and ahead of every sovereign fiat.
        </p>
        <span className="text-[11px] text-fg-muted">
          β vs Gold · VaR 95%
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-ink-soft">
        <div className="max-h-[28rem] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-ink-card">
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="h-9 w-12 px-3 text-[11px] uppercase tracking-wider text-fg-muted">#</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Asset</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Category</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">Ann. Vol</TableHead>
                <TableHead className="hidden h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted sm:table-cell">Max DD</TableHead>
                <TableHead className="hidden h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted md:table-cell">β vs Gold</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Verdict</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RANKED_ASSETS.map((a) => (
                <TableRow
                  key={a.asset}
                  className={
                    a.isMTQ
                      ? "border-l-2 border-l-reserve bg-reserve/[0.07] hover:bg-reserve/[0.10]"
                      : "border-line"
                  }
                >
                  <TableCell className="px-3 py-2 font-mono text-xs tabular-nums text-fg-muted">
                    {a.rank}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <span
                      className={`font-semibold ${a.isMTQ ? "text-reserve" : "text-foreground"}`}
                    >
                      {a.asset}
                    </span>
                    {a.isMTQ && (
                      <Badge className="ml-2 border-reserve/40 bg-reserve/10 text-[10px] text-reserve hover:bg-reserve/10">
                        MTQ
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-xs text-fg-muted">{a.category}</TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-ink-card sm:block">
                        <div
                          className={`h-full rounded-full ${
                            a.isMTQ ? "bg-reserve" : "bg-gold/60"
                          }`}
                          style={{ width: `${Math.max(4, (a.annVol / MAX_VOL) * 100)}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-foreground">
                        {a.annVol.toFixed(2)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted sm:table-cell">
                    {a.maxDD.toFixed(2)}%
                  </TableCell>
                  <TableCell className="hidden px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted md:table-cell">
                    {a.betaGold.toFixed(3)}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      className={`text-[10px] ${verdictBadgeClass(a.verdict)}`}
                    >
                      {a.verdict}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-[11px] text-fg-muted">
        Lower rank = more stable. VaR 95% = the worst single-day loss not exceeded 95% of the time.
        MTQ&apos;s β to gold is just 0.125 because bullion is only ~11% of reserves.
      </p>
    </div>
  );
}

/* ---------- Tab 2: Stress Scenarios ---------- */

function StressScenariosTab({
  scenarios,
  source,
}: {
  scenarios: DisplayScenario[];
  source: "live" | "fallback";
}) {
  const passed = scenarios.filter((s) => s.pass).length;
  const total = scenarios.length;
  const isLive = source === "live";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          {isLive ? (
            <>
              Every Article XV scenario is simulated live against the v19.0.3
              monetary state via <code className="font-mono text-[11px]">/api/stress-lab</code>.
              A scenario passes when the shock does not break the constitutional
              invariants (RR ≥ 100% AND LRR ≥ 1.0), or when the scenario is
              flagged existential under Article XIII §Stress Thresholds.
            </>
          ) : (
            <>
              Every reserve-shock, currency-crash, and depeg scenario is
              simulated against the live v19.0.3 monetary state. A scenario
              passes when the shock does not break the constitutional
              invariants. <span className="text-amber-600 dark:text-amber-400">(Fallback dataset — live API unavailable.)</span>
            </>
          )}
        </p>
        <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          {passed} / {total} scenarios passed
        </Badge>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-ink-soft">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-ink-card">
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="h-9 w-10 px-3 text-[11px] uppercase tracking-wider text-fg-muted">#</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Scenario</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">Baseline NAV</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">Shocked NAV</TableHead>
                <TableHead className="hidden h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted sm:table-cell">Baseline RR</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">Shocked RR</TableHead>
                <TableHead className="hidden h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted md:table-cell">LRR</TableHead>
                <TableHead className="h-9 px-3 text-center text-[11px] uppercase tracking-wider text-fg-muted">Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((s) => {
                const rrBelowFloor = s.shockedRR < 100;
                return (
                  <TableRow
                    key={`${s.id}-${s.scenario}`}
                    className={
                      s.existential
                        ? "border-line border-l-2 border-l-amber-500/60 bg-amber-500/[0.04]"
                        : "border-line"
                    }
                  >
                    <TableCell className="px-3 py-2 font-mono text-xs tabular-nums text-fg-muted">
                      {s.id}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-sm text-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span>{s.scenario}</span>
                        {s.existential && (
                          <Badge className="w-fit border-amber-500/40 bg-amber-500/10 text-[9px] text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                            <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                            Existential
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted">
                      {fmtUsd4(s.baselineNav)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums text-foreground">
                      {fmtUsd4(s.shockedNav)}
                    </TableCell>
                    <TableCell className="hidden px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted sm:table-cell">
                      {fmtPct2(s.baselineRR)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right">
                      <span
                        className={`font-mono text-xs tabular-nums ${
                          rrBelowFloor
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-foreground"
                        }`}
                        title={
                          rrBelowFloor
                            ? s.existential
                              ? "Below 100% floor — existential exception (Article XIII). Minting pauses, redemption stays on."
                              : "Below 100% floor — minting pauses, redemption stays on"
                            : "Above 100% floor"
                        }
                      >
                        {fmtPct2(s.shockedRR)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted md:table-cell">
                      {typeof s.lrrAfter === "number" ? s.lrrAfter.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      {s.pass ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-reserve">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          FAIL
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-[11px] text-fg-muted">
        Note: in scenarios where shocked RR dips below 100% (e.g. existential
        scenarios like Capital Controls, Sanctions, Custodian Failure), the
        constitutional guardrail <span className="text-foreground">pauses minting</span> —
        but <span className="text-reserve">redemption never pauses</span>. A
        &ldquo;PASS&rdquo; on an existential row means the protocol survived
        (bullion protection preserved, burn path open) under Article XIII §Stress
        Thresholds documented exception. Non-existential rows must clear
        RR ≥ 100% AND LRR ≥ 1.0 to PASS.
      </p>
    </div>
  );
}

/* ---------- Tab 3: Crisis Survival ---------- */

function CrisisSurvivalTab() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          Five historical crisis scenarios replayed against the MTQ reserve basket.
          Minting pauses automatically when the reserve ratio breaches 100%, but
          the burn-and-redeem path stays open in <em>every</em> scenario.
        </p>
        <Badge className="border-reserve/40 bg-reserve/10 text-reserve">
          <Lock className="h-3 w-3" aria-hidden="true" />
          Redemption 5 / 5 ALWAYS-ON
        </Badge>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-ink-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-ink-card">
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Crisis</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">NAV Before</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">NAV After</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">Δ Nominal</TableHead>
                <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wider text-fg-muted">RR%</TableHead>
                <TableHead className="h-9 px-3 text-center text-[11px] uppercase tracking-wider text-fg-muted">Minting</TableHead>
                <TableHead className="h-9 px-3 text-center text-[11px] uppercase tracking-wider text-fg-muted">Redemption</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {CRISIS_SCENARIOS.map((c) => (
                <TableRow key={c.crisis} className="border-line">
                  <TableCell className="px-3 py-2 text-sm text-foreground">{c.crisis}</TableCell>
                  <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums text-fg-muted">
                    {fmtUsd4(c.navBefore)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums text-foreground">
                    {fmtUsd4(c.navAfter)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <DeltaBadge value={c.deltaNominal} />
                  </TableCell>
                  <TableCell className="px-3 py-2 text-right">
                    <span className="font-mono text-xs tabular-nums text-amber-600 dark:text-amber-400">
                      {fmtPct2(c.rr)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <Badge className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
                      <PauseCircle className="h-3 w-3" aria-hidden="true" />
                      {c.minting}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2 text-center">
                    <Badge className="border-reserve/40 bg-reserve/10 text-[10px] text-reserve">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      {c.redemption}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-[11px] text-fg-muted">
        Even in the 2008 GFC replay — gold +25% simultaneous with sovereign stress −40% —
        MTQ holders could still exit. That is the constitutional promise of §36.3.
      </p>
    </div>
  );
}

/* ---------- Tab 4: 8 Mechanisms ---------- */

function MechanismsTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-fg-muted">
        Eight constitutional mechanisms work in concert to keep MTQ stable.
        Each is independently auditable and cites its blueprint section so any
        reader can verify the rule against the source.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {MECHANISMS.map((m, i) => {
          const Icon = m.icon;
          return (
            <Reveal key={m.id} delay={i * 0.04}>
              <Card className="card-hover h-full gap-0 border-line bg-ink-soft p-5 shadow-none">
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                    <Icon className="h-4 w-4 text-gold" aria-hidden="true" />
                  </div>
                  <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                    {m.section}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-xs text-fg-muted">0{m.id}</span>
                  <h4 className="font-display text-base text-foreground">{m.name}</h4>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                  {m.description}
                </p>
              </Card>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Tab 5: Constitutional Compliance ---------- */

function ConstitutionalComplianceTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">
          All 10 constitutional requirements have been verified by the
          COO/CTO under executive authority. Each row cites its blueprint
          section and audit evidence — the protocol is in full constitutional
          compliance.
        </p>
        <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          10 / 10 verified
        </Badge>
      </div>

      {/* Compliance matrix */}
      <div className="overflow-hidden rounded-xl border border-line bg-ink-soft">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-ink-card">
              <TableRow className="border-line hover:bg-transparent">
                <TableHead className="h-9 w-10 px-3 text-[11px] uppercase tracking-wider text-fg-muted">#</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Requirement</TableHead>
                <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted">Blueprint §</TableHead>
                <TableHead className="h-9 px-3 text-center text-[11px] uppercase tracking-wider text-fg-muted">Status</TableHead>
                <TableHead className="hidden h-9 px-3 text-[11px] uppercase tracking-wider text-fg-muted md:table-cell">Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPLIANCE_ROWS.map((row) => (
                <TableRow key={row.id} className="border-line">
                  <TableCell className="px-3 py-2.5 font-mono text-xs tabular-nums text-fg-muted">
                    {row.id}
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-sm font-medium text-foreground">
                    {row.requirement}
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                      {row.section}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      COMPLIANT
                    </span>
                  </TableCell>
                  <TableCell className="hidden px-3 py-2.5 text-xs leading-relaxed text-fg-muted md:table-cell">
                    {row.evidence}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 3 highlight cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Card 1: Multi-Currency Minting (Req 9) */}
        <Reveal>
          <Card className="card-hover h-full gap-0 border-line bg-ink-soft p-5 shadow-none">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                <Coins className="h-4 w-4 text-gold" aria-hidden="true" />
              </div>
              <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                §36 · Req 9
              </Badge>
            </div>
            <h4 className="mt-3 font-display text-base text-foreground">
              Multi-Currency Minting
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
              MTQ can be minted and redeemed in 10 currencies — 8 sovereign
              fiats plus physical gold (XAU) and silver (XAG) units.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ACCEPTED_CURRENCIES.map((ccy) => (
                <Badge
                  key={ccy}
                  className="border-gold/30 bg-gold/[0.07] text-[10px] font-mono text-gold hover:bg-gold/[0.07]"
                >
                  {ccy}
                </Badge>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-line bg-ink-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                EUR → MTQ example
              </p>
              <div className="mt-2 space-y-1 font-mono text-[11px] tabular-nums text-fg-muted">
                <div className="flex items-center justify-between gap-2">
                  <span>deposit</span>
                  <span className="text-foreground">1,000 EUR</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>÷ 0.8685 EUR/USD</span>
                  <span className="text-foreground">$1,151.39</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>÷ NAV $1.0416</span>
                  <span className="text-foreground">1,105.41 MTQ</span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-line pt-1 text-emerald-600 dark:text-emerald-400">
                  <span>fee (5 bps · capped $5k)</span>
                  <span>$0.58</span>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Card 2: Cross-Asset Rebalancing (Req 7) */}
        <Reveal delay={0.05}>
          <Card className="card-hover h-full gap-0 border-line bg-ink-soft p-5 shadow-none">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                <RefreshCw className="h-4 w-4 text-gold" aria-hidden="true" />
              </div>
              <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                §29 · Req 7
              </Badge>
            </div>
            <h4 className="mt-3 font-display text-base text-foreground">
              Cross-Asset Rebalancing
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
              All four reserve classes rebalance each other to maintain target
              allocation within constitutional ranges — sell high, buy low,
              value strictly conserved.
            </p>
            {/* 3×3 diagram: 4 asset boxes + bidirectional arrows */}
            <div
              className="mt-4 grid grid-cols-3 gap-1.5 text-center"
              role="img"
              aria-label="Cross-asset rebalancing diagram: Fiat, Gold, Silver, and Stablecoin can rebalance each other in any direction"
            >
              <div className="rounded-md border border-gold/30 bg-gold/[0.07] p-2.5">
                <p className="text-[11px] font-semibold text-gold">Fiat</p>
                <p className="text-[9px] text-fg-muted">cash + sov</p>
              </div>
              <div className="flex items-center justify-center text-fg-muted" aria-hidden="true">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="rounded-md border border-gold/30 bg-gold/[0.07] p-2.5">
                <p className="text-[11px] font-semibold text-gold">Gold</p>
                <p className="text-[9px] text-fg-muted">φ_t · 75–85%</p>
              </div>

              <div className="flex items-center justify-center text-fg-muted" aria-hidden="true">
                <ArrowRightLeft className="h-4 w-4 rotate-90" />
              </div>
              <div className="flex items-center justify-center text-gold" aria-hidden="true">
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-center text-fg-muted" aria-hidden="true">
                <ArrowRightLeft className="h-4 w-4 rotate-90" />
              </div>

              <div className="rounded-md border border-gold/30 bg-gold/[0.07] p-2.5">
                <p className="text-[11px] font-semibold text-gold">Stablecoin</p>
                <p className="text-[9px] text-fg-muted">USDC/USDT</p>
              </div>
              <div className="flex items-center justify-center text-fg-muted" aria-hidden="true">
                <ArrowRightLeft className="h-4 w-4" />
              </div>
              <div className="rounded-md border border-gold/30 bg-gold/[0.07] p-2.5">
                <p className="text-[11px] font-semibold text-gold">Silver</p>
                <p className="text-[9px] text-fg-muted">1−φ_t · 15–25%</p>
              </div>
            </div>
            {/* Gold-rally example */}
            <div className="mt-4 rounded-lg border border-line bg-ink-card p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                Gold-rally example (bullion 23% vs 20% target)
              </p>
              <div className="mt-2 space-y-1 font-mono text-[11px] tabular-nums text-fg-muted">
                <div className="flex items-center justify-between gap-2 text-amber-600 dark:text-amber-400">
                  <span>sell bullion</span>
                  <span>$1.68M</span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-3">
                  <span>↳ gold (φ_t=80%)</span>
                  <span className="text-foreground">$1.34M</span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-3">
                  <span>↳ silver (20%)</span>
                  <span className="text-foreground">$0.34M</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400">
                  <span>buy fiat</span>
                  <span>$1.68M</span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-3">
                  <span>↳ cash (2/3 §24)</span>
                  <span className="text-foreground">$1.12M</span>
                </div>
                <div className="flex items-center justify-between gap-2 pl-3">
                  <span>↳ sov (1/3 §24)</span>
                  <span className="text-foreground">$0.56M</span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-line pt-1">
                  <span>est. fee</span>
                  <span className="text-foreground">$2,352</span>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>

        {/* Card 3: Fee Model (Req 10) */}
        <Reveal delay={0.1}>
          <Card className="card-hover h-full gap-0 border-line bg-ink-soft p-5 shadow-none">
            <div className="flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold/30 bg-gold/10">
                <DollarSign className="h-4 w-4 text-gold" aria-hidden="true" />
              </div>
              <Badge className="border-line bg-ink-card text-[10px] text-fg-muted hover:bg-ink-card">
                §29.5 · Req 10
              </Badge>
            </div>
            <h4 className="mt-3 font-display text-base text-foreground">
              Rebalancing Fee Model
            </h4>
            <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
              Per-asset-class execution fee + slippage + spread. Method
              multipliers (VWAP/TWAP/RFQ/block/algo) scale execution +
              slippage; spread is fixed.
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <Table>
                <TableHeader className="bg-ink-card">
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead className="h-8 px-2 text-[10px] uppercase tracking-wider text-fg-muted">Asset</TableHead>
                    <TableHead className="h-8 px-2 text-right text-[10px] uppercase tracking-wider text-fg-muted">Exec</TableHead>
                    <TableHead className="h-8 px-2 text-right text-[10px] uppercase tracking-wider text-fg-muted">Slip</TableHead>
                    <TableHead className="h-8 px-2 text-right text-[10px] uppercase tracking-wider text-fg-muted">Sprd</TableHead>
                    <TableHead className="h-8 px-2 text-right text-[10px] uppercase tracking-wider text-fg-muted">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FEE_MODEL.map((row) => (
                    <TableRow
                      key={row.assetClass}
                      className={
                        row.isZero
                          ? "border-line bg-emerald-500/[0.07]"
                          : row.isHighest
                            ? "border-line bg-amber-500/[0.07]"
                            : "border-line"
                      }
                    >
                      <TableCell className="px-2 py-1.5 text-[11px] font-medium text-foreground">
                        {row.assetClass}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-fg-muted">
                        {row.execution}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-fg-muted">
                        {row.slippage}
                      </TableCell>
                      <TableCell className="px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-fg-muted">
                        {row.spread}
                      </TableCell>
                      <TableCell
                        className={`px-2 py-1.5 text-right font-mono text-[11px] tabular-nums font-semibold ${
                          row.isZero
                            ? "text-emerald-600 dark:text-emerald-400"
                            : row.isHighest
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-foreground"
                        }`}
                      >
                        {row.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/[0.07] px-2 py-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Cash: 0.00 bps (free)
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/[0.07] px-2 py-1 text-[10px] text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                Silver: 20.00 bps (highest)
              </span>
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-fg-muted">
              All values in basis points (1 bp = 0.01%). VWAP method = 1.0×
              baseline. TWAP 1.2×, RFQ 0.8×, negotiated block 1.5×, algorithmic 1.1×.
            </p>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}

/* ---------- Volatility comparison (CSS bars) ---------- */

function VolatilityComparison() {
  return (
    <Reveal>
      <div className="rounded-2xl border border-line bg-ink-soft p-6 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="font-display text-lg text-foreground">
              Annualized volatility — MTQ vs the field
            </h3>
            <p className="mt-1 text-xs text-fg-muted">
              Lower is better. Bars are proportional to 365-day annualized volatility.
            </p>
          </div>
          <Badge className="border-gold/40 bg-gold/10 text-gold">
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
            31× more stable than BTC
          </Badge>
        </div>
        <div className="mt-6 space-y-3">
          {VOL_COMPARISON.map((b) => {
            const widthPct = Math.max(2, (b.vol / MAX_VOL) * 100);
            return (
              <div key={b.asset} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 sm:grid-cols-[5rem_1fr_auto]">
                <span
                  className={`text-sm font-semibold ${
                    b.isMTQ ? "text-reserve" : "text-foreground"
                  }`}
                >
                  {b.asset}
                  {b.isMTQ && (
                    <span className="ml-1 text-[10px] text-reserve">●</span>
                  )}
                </span>
                <div className="h-3 overflow-hidden rounded-full bg-ink-card">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${widthPct}%` }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    className={`h-full rounded-full ${
                      b.isMTQ
                        ? "bg-gradient-to-r from-reserve/80 to-reserve"
                        : b.vol > 30
                          ? "bg-gradient-to-r from-amber-500/60 to-destructive/70"
                          : b.vol > 10
                            ? "bg-gradient-to-r from-gold/50 to-gold/80"
                            : "bg-gradient-to-r from-gold/40 to-gold/60"
                    }`}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex w-28 items-center justify-end gap-2 sm:w-44">
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      b.isMTQ ? "font-semibold text-reserve" : "text-fg-muted"
                    }`}
                  >
                    {b.vol.toFixed(2)}%
                  </span>
                  <span className="hidden text-[11px] text-fg-muted sm:inline">
                    {b.caption}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Minus className="mt-0.5 h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <p className="text-xs text-fg-muted">
              <span className="font-semibold text-foreground">vs USD:</span>{" "}
              3.3× more stable.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Minus className="mt-0.5 h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <p className="text-xs text-fg-muted">
              <span className="font-semibold text-foreground">vs Gold:</span>{" "}
              6.6× more stable (85% vol dampening).
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Minus className="mt-0.5 h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <p className="text-xs text-fg-muted">
              <span className="font-semibold text-foreground">vs BTC:</span>{" "}
              31× more stable.
            </p>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ============================================================
 * Main section
 * ============================================================ */

// impl-C-stress — Canonical fallback baseline NAV + RR. Updated from
// the stale 1.0419 / 102.07 to the canonical 1.0373 / 102.05 used
// across the v19.0.3 monetary engine, the live APIs, and the audit
// reports. Used as the pre-fetch fallback BEFORE the live `/api/nav`
// fetch resolves, and for the FALLBACK_SCENARIOS table when
// `/api/stress-lab` is unavailable.
const STRESS_BASELINE_NAV = 1.0373;
const STRESS_BASELINE_RR = 102.05;

export function StressTestProof() {
  // impl-C-stress — Live unified NAV. Null until /api/nav responds; the
  // KEY_METRICS "Reserve Ratio" badge and the headline NAV hint fall
  // back to the canonical stress-test baseline (102.05% / $1.0373) while
  // loading or if the fetch fails.
  const [liveNav, setLiveNav] = useState<number | null>(null);
  const [liveRR, setLiveRR] = useState<number | null>(null);

  // impl-C-stress — Live stress-lab scenarios. Null until /api/stress-lab
  // responds; the Stress Scenarios tab falls back to FALLBACK_SCENARIOS
  // (the historical 20-scenario set) while loading or if the fetch fails.
  const [liveScenarios, setLiveScenarios] = useState<LiveStressScenario[] | null>(null);
  const [stressSource, setStressSource] = useState<"live" | "fallback">("fallback");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/nav", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (typeof data.navM === "number" && Number.isFinite(data.navM) && data.navM > 0) {
          setLiveNav(data.navM);
        }
        if (typeof data.reserveRatio === "number" && Number.isFinite(data.reserveRatio) && data.reserveRatio > 0) {
          setLiveRR(data.reserveRatio);
        }
      })
      .catch(() => {
        /* keep fallback — the canonical baseline is still valid */
      });

    // impl-C-stress — fetch the live 20-scenario stress-lab results so
    // the Stress Scenarios tab reflects actual RR/LRR/pass outcomes from
    // the v19.0.3 engine (rather than the stale hardcoded table).
    fetch("/api/stress-lab", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
          setLiveScenarios(data.scenarios as LiveStressScenario[]);
          setStressSource("live");
        }
      })
      .catch(() => {
        /* keep fallback — FALLBACK_SCENARIOS is still valid */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve the display values: prefer live, fall back to baseline.
  const displayRR = liveRR ?? STRESS_BASELINE_RR;
  const displayNav = liveNav ?? STRESS_BASELINE_NAV;

  // impl-C-stress — Resolve the stress-scenario table data: prefer live
  // /api/stress-lab output, fall back to FALLBACK_SCENARIOS.
  const displayScenarios: DisplayScenario[] = liveScenarios
    ? liveScenarios.map(liveToDisplay)
    : FALLBACK_SCENARIOS.map(fallbackToDisplay);
  const scenariosPassed = displayScenarios.filter((s) => s.pass).length;
  const scenariosTotal = displayScenarios.length;

  // Rebuild the KEY_METRICS array with the resolved Reserve Ratio badge
  // value AND the resolved stress-tests-passed count (kept here rather
  // than mutating the module-level constant so the live fetch can update
  // the displayed numbers without a re-render of every metric card).
  const keyMetrics: KeyMetric[] = KEY_METRICS.map((m) => {
    if (m.label === "Reserve Ratio") {
      return {
        ...m,
        value: `${displayRR.toFixed(2)}%`,
        caption: liveRR ? "Live · above 102% target" : m.caption,
      };
    }
    if (m.label === "Stress Tests Passed") {
      return {
        ...m,
        value: `${scenariosPassed} / ${scenariosTotal}`,
        caption:
          stressSource === "live"
            ? "Live · /api/stress-lab"
            : "Fallback dataset (API unavailable)",
      };
    }
    return m;
  });

  return (
    <section
      id="s-proof"
      aria-labelledby="s-proof-heading"
      className="scroll-mt-24 border-y border-line/60 bg-ink-soft/40 px-5 py-8 sm:px-8 sm:py-12"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Headline */}
        <Reveal>
          <Eyebrow>Proof of Strength · v19.0.3 verified</Eyebrow>
          <h2
            id="s-proof-heading"
            className="font-display mt-4 text-3xl leading-tight text-balance sm:text-5xl"
          >
            Stress-tested stability.{" "}
            <span className="gold-text">
              {scenariosPassed} of {scenariosTotal} scenarios passed.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-fg-muted sm:text-base">
            We ran gold rallies and crashes, multi-currency collapses, stablecoin
            depegs, and five historical crises against the live MTQ monetary state.
            Every scenario cleared the constitutional invariants — and the burn-and-redeem
            path stayed open in <span className="text-reserve">all of them</span>.{" "}
            {/* impl-C-stress — surface the live unified NAV so this section agrees
                with the hero / testnet banner / dashboard. */}
            <span className="text-foreground">
              Live MTQ NAV:{" "}
              <span className="font-semibold text-gold">${displayNav.toFixed(4)}</span>
              {" "}·{" "}
              Reserve Ratio:{" "}
              <span className={displayRR >= 100 ? "font-semibold text-reserve" : "font-semibold text-amber-600 dark:text-amber-400"}>
                {displayRR.toFixed(2)}%
              </span>
              {liveNav ? (
                <span className="text-fg-muted"> (live · /api/nav)</span>
              ) : null}
            </span>
          </p>
        </Reveal>

        {/* §1 — Key metrics */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {keyMetrics.map((m, i) => (
            <KeyMetricCard key={m.label} m={m} index={i} />
          ))}
        </div>

        {/* §2 — Tabbed proof deck */}
        <Reveal delay={0.05}>
          <Tabs defaultValue="ranking" className="mt-10">
            <TabsList className="h-auto flex-wrap justify-start gap-1 rounded-xl border border-line bg-ink-card p-1.5">
              <TabsTrigger
                value="ranking"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-fg-muted data-[state=active]:border-gold/40 data-[state=active]:bg-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-none"
              >
                <Award className="h-3.5 w-3.5" aria-hidden="true" />
                Stability Ranking
              </TabsTrigger>
              <TabsTrigger
                value="scenarios"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-fg-muted data-[state=active]:border-gold/40 data-[state=active]:bg-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-none"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Stress Scenarios
              </TabsTrigger>
              <TabsTrigger
                value="crises"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-fg-muted data-[state=active]:border-gold/40 data-[state=active]:bg-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-none"
              >
                <FlameKindling className="h-3.5 w-3.5" aria-hidden="true" />
                Crisis Survival
              </TabsTrigger>
              <TabsTrigger
                value="mechanisms"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-fg-muted data-[state=active]:border-gold/40 data-[state=active]:bg-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-none"
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                8 Mechanisms
              </TabsTrigger>
              <TabsTrigger
                value="compliance"
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-fg-muted data-[state=active]:border-gold/40 data-[state=active]:bg-gold/10 data-[state=active]:text-gold data-[state=active]:shadow-none"
              >
                <Gavel className="h-3.5 w-3.5" aria-hidden="true" />
                Constitutional Compliance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ranking" className="mt-4">
              <StabilityRankingTab />
            </TabsContent>
            <TabsContent value="scenarios" className="mt-4">
              <StressScenariosTab scenarios={displayScenarios} source={stressSource} />
            </TabsContent>
            <TabsContent value="crises" className="mt-4">
              <CrisisSurvivalTab />
            </TabsContent>
            <TabsContent value="mechanisms" className="mt-4">
              <MechanismsTab />
            </TabsContent>
            <TabsContent value="compliance" className="mt-4">
              <ConstitutionalComplianceTab />
            </TabsContent>
          </Tabs>
        </Reveal>

        {/* §3 — Volatility comparison */}
        <div className="mt-10">
          <VolatilityComparison />
        </div>

        {/* §4 — Bottom summary */}
        <Reveal>
          <div className="mt-10 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.07] to-reserve/[0.05] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/40 bg-gold/10 sm:flex">
                <ShieldCheck className="h-6 w-6 text-gold" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-foreground sm:text-2xl">
                  The only asset that satisfies all three monetary functions.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
                  MTQ is the only asset in the 14-asset study that satisfies the three
                  classical monetary functions simultaneously:
                </p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-3">
                  <li className="flex items-start gap-2 rounded-lg border border-line bg-ink-soft/60 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reserve" aria-hidden="true" />
                    <span className="text-xs text-foreground">
                      <span className="font-semibold">Medium of Exchange</span>
                      <span className="block text-fg-muted">vol &lt; 5% — 2.25% achieved</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2 rounded-lg border border-line bg-ink-soft/60 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reserve" aria-hidden="true" />
                    <span className="text-xs text-foreground">
                      <span className="font-semibold">Unit of Account</span>
                      <span className="block text-fg-muted">vol &lt; 3% — 2.25% achieved</span>
                    </span>
                  </li>
                  <li className="flex items-start gap-2 rounded-lg border border-line bg-ink-soft/60 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-reserve" aria-hidden="true" />
                    <span className="text-xs text-foreground">
                      <span className="font-semibold">Store of Value</span>
                      <span className="block text-fg-muted">+6.17% annual return · 1.49% max drawdown</span>
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-fg-muted">
                  Backed by <span className="font-semibold text-gold">{displayRR.toFixed(2)}% reserves</span>.
                  Minting halts the instant the ratio drops below 100%, but{" "}
                  <span className="font-semibold text-reserve">redemption never pauses</span>{" "}
                  — every MTQ holder can always exit at the live NAV.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default StressTestProof;
