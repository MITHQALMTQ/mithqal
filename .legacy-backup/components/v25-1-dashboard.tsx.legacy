"use client";

/* ============================================================
 * V25_1Dashboard — MITHQAL v25.1 Institutional Interoperability,
 *                  Geopolitical Resilience & Multi-Rail Settlement
 * ------------------------------------------------------------
 * Task ID: PHASE4-5-V25-1-DASHBOARD-BLUEPRINT
 *
 * Surfaces the v25.1 executive report — the next generation
 * of MITHQAL's institutional architecture that BUILDS ON TOP
 * of the frozen v25.0 baseline. v25.1 does NOT replace v25.0;
 * it adds institutional interoperability, geopolitical
 * resilience, multi-rail settlement, asset classification,
 * stablecoin interop, and more.
 *
 * Layout (10 sections per Task ID prompt):
 *   §1  Header + version badge + honest state
 *   §2  18 Absolute Architectural Rules (red-bordered cards)
 *   §3  Asset Registry (8 assets: USD, EUR, JPY, AED, XAU,
 *       USDC, USDT, PAXG) — eligibility flags + risk tiers
 *   §4  Finality-Before-Mint — constitutional-grade rule +
 *       8-step mandatory sequence
 *   §5  Stablecoin Depeg Protection — 10 threshold controls
 *       (1% → 100% / issuer failure)
 *   §6  7 Safe States (NORMAL → WATCH → RESTRICTED →
 *       EMERGENCY → MINT_FROZEN → SETTLEMENT_RESTRICTED →
 *       SAFE_HALT) with allowed/blocked operations
 *   §7  Reserve Architecture — 130% target, adaptive bands
 *       (80/18/2), governance-controlled policy
 *   §8  Geopolitical Exposure — 13 tracked dimensions
 *   §9  Multi-Rail Architecture — 8 rail types + fallback matrix
 *   §10 Closing — final status badge (APPROVED CANDIDATE —
 *       NOT PRODUCTION-AUTHORIZED)
 *
 * Theming: institutional palette — amber/gold, emerald, red,
 * gray. NO indigo/blue.
 *
 * Data provenance: /api/v25.1 →
 *   src/lib/v25-1-institutional-interop.ts
 *   (generateV25_1Report())
 *
 * HONEST STATE:
 *   honest: true
 *   forcedToPass: false
 *   productionAuthorized: false
 *   v25_0Frozen: true
 *   v25_1BuildsOnV25_0: true
 *   noCoreBankingReplacement: true
 *   noRetailExchange: true
 *   noUsdPeg: true
 *   finalityBeforeMintEnforced: true
 *   stablecoinNotAutomaticReserve: true
 *   ordinaryDepositNotAutomaticBacking: true
 *
 * Final status:
 *   APPROVED CANDIDATE FOR CONTROLLED TESTING —
 *   NOT PRODUCTION-AUTHORIZED
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  AlertTriangle,
  Globe,
  Layers,
  Lock,
  Activity,
  Scale,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Banknote,
  Coins,
  Landmark,
  Cpu,
  Zap,
  Server,
  Building2,
  Network,
  Workflow,
  Boxes,
  FileCheck,
  Crosshair,
  Flag,
  PauseCircle,
  OctagonAlert,
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
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

/* ---------------- Types (mirror of the v25.1 core module) ---------------- */

interface DepegControl {
  threshold: string;
  deviationPercent: number;
  action: string;
  description: string;
}

interface SafeStateDef {
  state: string;
  allowedOperations: string[];
  blockedOperations: string[];
  requiredApprovals: string[];
  automaticActions: string[];
  escalation: string;
  recoveryConditions: string;
}

interface AssetRecord {
  assetId: string;
  assetName: string;
  assetType: string;
  issuer: string;
  issuerCountry: string;
  legalClassification: string;
  jurisdiction: string;
  permittedJurisdictions: string[];
  supportedNetworks: string[];
  reserveEligibility: boolean;
  inputEligibility: boolean;
  settlementEligibility: boolean;
  liquidityEligibility: boolean;
  riskTier: string;
  liquidityTier: string;
  haircut: number;
  concentrationLimit: number;
  oracleRequirements: string[];
  sanctionsStatus: string;
  issuerStatus: string;
  redemptionStatus: string;
  custodyRequirements: string;
  approvedProviders: string[];
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

interface InstitutionalDomain {
  name: string;
  underlyingEngines: string[];
  description: string;
}

interface V25_1Report {
  moduleId: string;
  generatedAt: string;
  blueprintVersion: string;
  v25_0Baseline: string;

  neutralityDimensions: string[];
  geopoliticalExposureDimensions: string[];

  railTypes: string[];
  failureConditions: string[];
  routingActions: string[];

  multiAssetTypes: string[];
  multiRailTypes: string[];
  assetClassifications: string[];

  assetRegistryCount: number;
  assetRegistry: AssetRecord[];

  interopGatewaySteps: string[];
  providerTypes: string[];
  providerRegistryCount: number;

  finalityBeforeMintRule: string;
  stablecoinEvaluationFields: string[];
  depegControls: DepegControl[];
  valuationRule: string;
  pbcRule: string;

  reserveTarget: {
    strategicTarget: number;
    target: { fiat: number; gold: number; digital: number };
    bands: {
      fiat: { min: number; max: number; stressTarget: number; emergencyTarget: number };
      gold: { min: number; max: number; stressTarget: number; emergencyTarget: number };
      digital: { min: number; max: number; stressTarget: number; emergencyTarget: number };
    };
    rule: string;
  };
  reserveQualityTiers: Array<{
    tier: string;
    description: string;
    examples: string[];
    haircutRange: [number, number];
  }>;

  liquidityCategories: string[];
  geopoliticalDMCERule: string;
  emergencyLiquidityTypes: string[];
  rebalancingRule: string;
  multiRailFallbackRule: string;
  cbdcInteropRule: string;
  tokenisedBankMoneyRule: string;
  redemptionRule: string;
  noForcedConversionRule: string;

  legalClassificationRule: string;
  proofOfLiabilitiesSources: string[];
  independentAssuranceScope: string[];
  regulatoryAPIFields: string[];

  corridorRegistryCount: number;
  institutionalControlDomains: InstitutionalDomain[];
  securityRequirements: string[];
  newTursoTables: string[];
  newAPIEndpoints: string[];
  policyDecisions: string[];
  stressScenarios: Record<string, unknown>;
  safeStates: SafeStateDef[];

  blueprintUpdate: {
    newVersion: string;
    title: string;
    marksExistingComponents: string;
    marksEnhancedComponents: string;
    marksNewComponents: string;
    marksDeprecatedComponents: string;
    rule: string;
  };

  regulatoryLanguageRule: string;
  productPositioning: string;
  absoluteRules: string[];

  honestState: {
    honest: true;
    forcedToPass: false;
    productionAuthorized: false;
    v25_0Frozen: true;
    v25_1BuildsOnV25_0: true;
    noCoreBankingReplacement: true;
    noRetailExchange: true;
    noUsdPeg: true;
    finalityBeforeMintEnforced: true;
    stablecoinNotAutomaticReserve: true;
    ordinaryDepositNotAutomaticBacking: true;
  };

  finalStatus: string;
}

interface ApiResponse {
  endpoint: string;
  status: string;
  timestamp: string;
  report: V25_1Report;
}

/* ---------------- Helpers ---------------- */

const tierColor = (tier: string) => {
  switch (tier) {
    case "TIER_A":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "TIER_B":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "TIER_C":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "TIER_D_CONVERSION_ONLY":
      return "border-zinc-400/40 bg-zinc-400/10 text-zinc-700 dark:text-zinc-300";
    case "PROHIBITED":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    default:
      return "border-zinc-400/40 bg-zinc-400/10 text-zinc-700 dark:text-zinc-300";
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "WATCH":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "RESTRICTED":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "SUSPENDED":
    case "EMERGENCY":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    case "PROHIBITED":
      return "border-red-700/50 bg-red-700/10 text-red-800 dark:text-red-300";
    default:
      return "border-zinc-400/40 bg-zinc-400/10 text-zinc-700 dark:text-zinc-300";
  }
};

const safeStateColor = (state: string) => {
  switch (state) {
    case "NORMAL":
      return "border-emerald-500/50 bg-emerald-500/5";
    case "WATCH":
      return "border-amber-500/50 bg-amber-500/5";
    case "RESTRICTED":
      return "border-orange-500/50 bg-orange-500/5";
    case "EMERGENCY":
      return "border-red-500/60 bg-red-500/10";
    case "MINT_FROZEN":
      return "border-red-600/70 bg-red-600/10";
    case "SETTLEMENT_RESTRICTED":
      return "border-red-700/70 bg-red-700/10";
    case "SAFE_HALT":
      return "border-red-900/70 bg-red-900/10";
    default:
      return "border-zinc-400/40 bg-zinc-400/5";
  }
};

const depegActionColor = (action: string) => {
  switch (action) {
    case "MONITOR":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "HAIRCUT_INCREASE":
    case "RESTRICT_INPUT":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    case "SUSPEND_INPUT":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "PROHIBIT":
    case "EMERGENCY_HALT":
      return "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
    default:
      return "border-zinc-400/40 bg-zinc-400/10 text-zinc-700 dark:text-zinc-300";
  }
};

const Yes = () => (
  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
);
const No = () => (
  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
);

/* ---------------- Component ---------------- */

export function V25_1Dashboard() {
  const [report, setReport] = useState<V25_1Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v25.1");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiResponse = await res.json();
        if (!cancelled) {
          setReport(data.report);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "unknown error");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading MITHQAL v25.1 dashboard...</span>
          </div>
        </div>
      </section>
    );
  }

  /* ---------- Error ---------- */
  if (error || !report) {
    return (
      <section className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="border-red-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertOctagon className="h-5 w-5" />
                v25.1 Dashboard unavailable
              </CardTitle>
              <CardDescription>
                {error ?? "Could not load the MITHQAL v25.1 executive report."}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  /* ---------- Derived ---------- */
  const absoluteRules = report.absoluteRules;
  const assets = report.assetRegistry;
  const depegControls = report.depegControls;
  const safeStates = report.safeStates;
  const reserveTarget = report.reserveTarget;
  const geopoliticalDimensions = report.geopoliticalExposureDimensions;
  const railTypes = report.multiRailTypes;
  const routingActions = report.routingActions;
  const failureConditions = report.failureConditions;

  /* ---------- Finality sequence (8 steps) ---------- */
  const finalitySequence = [
    "Asset Presented",
    "Compliance Passed",
    "Conversion Executed",
    "Settlement Finality Confirmed",
    "Backing Legally Recognized",
    "Reserve Evidence Confirmed",
    "DMCE Authorization",
    "MTQ Mint",
  ];

  return (
    <section
      id="v25-1-dashboard"
      className="border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ===================================================== */}
        {/* §1 — Header                                            */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Globe className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              MITHQAL <span className="gold-text">v25.1</span>
            </h2>
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {report.moduleId}
            </Badge>
          </div>
          <p className="text-2xl font-semibold text-foreground mb-2">
            Institutional Interoperability &amp; Geopolitical Resilience
          </p>
          <p className="text-muted-foreground max-w-4xl">
            The next generation of MITHQAL&apos;s institutional settlement
            architecture. v25.1 <strong>BUILDS ON TOP</strong> of the frozen{" "}
            <em>v25.0 baseline</em> — it does <strong>NOT</strong> replace it.
            It adds multi-asset, multi-rail, multi-jurisdiction interoperability,
            stablecoin interop, asset classification, geopolitical-aware minting
            capacity, and 7 safe states — without ever compromising the
            constitutional principles.
          </p>

          {/* Honest state strip */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold">Honest State</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  honest=true · forcedToPass=false
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm font-semibold">v25.0 Frozen</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseline preserved · v25.1 adds on top
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <AlertOctagon className="h-4 w-4" />
                  <span className="text-sm font-semibold">Not Production</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  productionAuthorized=false
                </p>
              </CardContent>
            </Card>
            <Card className="border-zinc-500/30 bg-zinc-500/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <Scale className="h-4 w-4" />
                  <span className="text-sm font-semibold">Neutrality</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  No USD peg · No retail exchange
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dimension counters */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {[
              { label: "Absolute Rules", value: absoluteRules.length, icon: Scale },
              { label: "Asset Registry", value: report.assetRegistryCount, icon: Coins },
              { label: "Depeg Controls", value: depegControls.length, icon: AlertTriangle },
              { label: "Safe States", value: safeStates.length, icon: ShieldCheck },
              { label: "Rail Types", value: railTypes.length, icon: Network },
              { label: "Geopolitical Dims", value: geopoliticalDimensions.length, icon: Globe },
            ].map((s) => (
              <Card key={s.label} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <s.icon className="h-4 w-4" />
                    <span className="text-2xl font-bold text-foreground">
                      {s.value}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §2 — 18 Absolute Architectural Rules                   */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              18 Absolute Architectural Rules
            </h3>
            <Badge className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300">
              NON-NEGOTIABLE
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            Eighteen rules that the MITHQAL architecture must enforce
            unconditionally — they are constitutional-grade invariants. Every
            implementation choice must defer to these.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {absoluteRules.map((rule, idx) => (
              <Card
                key={rule}
                className="border-red-500/40 bg-red-500/5 hover:border-red-500/60 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                      {String(idx + 1).padStart(2, "0")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono font-semibold text-foreground break-words">
                        {rule}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §3 — Asset Registry                                    */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              Asset Eligibility Registry
            </h3>
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {assets.length} ASSETS
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            Every asset that can be presented to MITHQAL must pass full
            eligibility evaluation before being accepted as input, reserve,
            settlement, or liquidity. Stablecoins are{" "}
            <strong>NOT</strong> automatically whitelisted — and never
            automatically counted as MTQ reserves.
          </p>
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issuer</TableHead>
                      <TableHead className="text-center">Reserve</TableHead>
                      <TableHead className="text-center">Input</TableHead>
                      <TableHead className="text-center">Settle</TableHead>
                      <TableHead className="text-center">Liquid</TableHead>
                      <TableHead>Risk Tier</TableHead>
                      <TableHead className="text-right">Haircut</TableHead>
                      <TableHead className="text-right">Conc. Limit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((a) => (
                      <TableRow key={a.assetId}>
                        <TableCell>
                          <div className="font-mono font-semibold text-foreground">
                            {a.assetId}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.assetName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-muted-foreground">
                            {a.assetType}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">
                            {a.issuer}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.issuerCountry}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {a.reserveEligibility ? <Yes /> : <No />}
                        </TableCell>
                        <TableCell className="text-center">
                          {a.inputEligibility ? <Yes /> : <No />}
                        </TableCell>
                        <TableCell className="text-center">
                          {a.settlementEligibility ? <Yes /> : <No />}
                        </TableCell>
                        <TableCell className="text-center">
                          {a.liquidityEligibility ? <Yes /> : <No />}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${tierColor(a.riskTier)}`}
                          >
                            {a.riskTier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {(a.haircut * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {(a.concentrationLimit * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs ${statusColor(a.status)}`}
                          >
                            {a.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground mt-3 italic">
            Note: stablecoins (USDC, USDT) are flagged <strong>WATCH</strong>{" "}
            and are <strong>NOT</strong> reserve-eligible. Stablecoin inputs
            must follow the authorized conversion workflow before being
            recognized as MTQ backing.
          </p>
        </motion.div>

        {/* ===================================================== */}
        {/* §4 — Finality-Before-Mint                             */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Card className="border-red-500/60 bg-red-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <CardTitle className="text-2xl">
                    Finality-Before-Mint — Constitutional-Grade Rule
                  </CardTitle>
                  <CardDescription>
                    The single most important operational invariant in the
                    entire architecture. No exceptions.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono text-red-800 dark:text-red-200">
                  {report.finalityBeforeMintRule.trim()}
                </pre>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Mandatory 8-Step Sequence
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {finalitySequence.map((step, idx) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 rounded-md border border-border/60 bg-background p-3"
                    >
                      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {step}
                      </span>
                      {idx < finalitySequence.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto hidden lg:block" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Never</strong> mint MTQ based solely on: instruction,
                  intent, provisional transfer, unconfirmed blockchain
                  transaction, pending bank transfer, pending FX execution, or
                  preliminary reserve statement. Settlement finality MUST be
                  confirmed by an authoritative source before mint.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===================================================== */}
        {/* §5 — Stablecoin Depeg Protection                      */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              Stablecoin Depeg Protection — 10 Threshold Controls
            </h3>
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              1% → 100%
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            The system must <strong>NOT</strong> assume{" "}
            <code className="font-mono text-xs">1 USDT = 1 MTQ</code> or{" "}
            <code className="font-mono text-xs">1 USDC = 1 MTQ</code> unless the
            actual authorized settlement price supports it. Ten thresholds
            trigger graduated protective actions.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {depegControls.map((d) => (
              <Card
                key={d.threshold}
                className={`hover:border-foreground/40 transition-colors ${depegActionColor(d.action)}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold">
                      {d.threshold}
                    </span>
                    {d.deviationPercent > 0 ? (
                      <span className="text-lg font-bold">
                        {d.deviationPercent}%
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-muted-foreground">
                        EVENT
                      </span>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs mb-2 ${depegActionColor(d.action)}`}
                  >
                    {d.action}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {d.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §6 — 7 Safe States                                     */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              7 Safe States — Graduated Operational Ladder
            </h3>
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              NORMAL → SAFE_HALT
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            Every operational moment of MITHQAL exists in exactly one of seven
            safe states. The state machine is monotone — it can only escalate
            (or, with explicit approval, recover). Each state strictly
            constrains what operations are allowed, blocked, or require
            approval.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {safeStates.map((s, idx) => {
              const stateIcon =
                s.state === "NORMAL" ? ShieldCheck :
                s.state === "WATCH" ? AlertTriangle :
                s.state === "RESTRICTED" ? Crosshair :
                s.state === "EMERGENCY" ? AlertOctagon :
                s.state === "MINT_FROZEN" ? PauseCircle :
                s.state === "SETTLEMENT_RESTRICTED" ? Flag :
                OctagonAlert;
              const StateIcon = stateIcon;
              return (
                <Card
                  key={s.state}
                  className={`${safeStateColor(s.state)} transition-colors`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StateIcon className="h-5 w-5 text-foreground" />
                        <CardTitle className="text-base font-mono">
                          {s.state}
                        </CardTitle>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        #{idx + 1}/7
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <p className="text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
                        ✓ ALLOWED
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.allowedOperations.length === 0 ? (
                          <span className="text-muted-foreground italic">none</span>
                        ) : (
                          s.allowedOperations.map((op) => (
                            <Badge
                              key={op}
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]"
                            >
                              {op}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-red-700 dark:text-red-300 font-semibold mb-1">
                        ✗ BLOCKED
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {s.blockedOperations.length === 0 ? (
                          <span className="text-muted-foreground italic">none</span>
                        ) : (
                          s.blockedOperations.map((op) => (
                            <Badge
                              key={op}
                              variant="outline"
                              className="border-red-500/30 bg-red-500/5 text-red-700 dark:text-red-300 font-mono text-[10px]"
                            >
                              {op}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    {s.requiredApprovals.length > 0 && (
                      <div>
                        <p className="text-amber-700 dark:text-amber-300 font-semibold mb-1">
                          ⚠ APPROVALS REQUIRED
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                          {s.requiredApprovals.map((ap) => (
                            <li key={ap} className="text-[11px]">{ap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border/40">
                      <p className="text-muted-foreground">
                        <strong className="text-foreground">Escalation:</strong>{" "}
                        {s.escalation}
                      </p>
                      <p className="text-muted-foreground mt-1">
                        <strong className="text-foreground">Recovery:</strong>{" "}
                        {s.recoveryConditions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §7 — Reserve Architecture (130% target + bands)        */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Layers className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              Reserve Architecture — 130% Strategic Target
            </h3>
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              GOVERNANCE-CONTROLLED
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            Target bands are <strong>NOT</strong> hard-coded as immutable
            business logic — they are stored as governance-controlled policy
            with separate values for target, minimum, maximum, stress_target,
            and emergency_target. The strategic 130% target preserves the
            solvency buffer that anchors MTQ during stress.
          </p>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
            {/* Strategic target */}
            <Card className="border-amber-500/40 bg-amber-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-2">
                  <Activity className="h-5 w-5" />
                  <span className="text-sm font-semibold">Strategic Target</span>
                </div>
                <p className="text-4xl font-bold text-foreground">
                  {(reserveTarget.strategicTarget * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Constitutional solvency buffer over outstanding MTQ
                </p>
              </CardContent>
            </Card>

            {/* Composition */}
            <Card className="border-emerald-500/30 bg-emerald-500/5 lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-3">
                  <Boxes className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Target Composition
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-mono">FIAT</span>
                      <span className="text-muted-foreground">
                        {(reserveTarget.target.fiat * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={reserveTarget.target.fiat * 100} className="h-2 bg-amber-500/20 [&>div]:bg-amber-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-mono">GOLD</span>
                      <span className="text-muted-foreground">
                        {(reserveTarget.target.gold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={reserveTarget.target.gold * 100} className="h-2 bg-amber-500/20 [&>div]:bg-amber-600" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-mono">DIGITAL</span>
                      <span className="text-muted-foreground">
                        {(reserveTarget.target.digital * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={reserveTarget.target.digital * 100} className="h-2 bg-amber-500/20 [&>div]:bg-zinc-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Adaptive bands table */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">
                Adaptive Band Matrix (per asset class)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Class</TableHead>
                      <TableHead className="text-right">Target</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">Stress Target</TableHead>
                      <TableHead className="text-right">Emergency Target</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(["fiat", "gold", "digital"] as const).map((cls) => {
                      const t = reserveTarget.target[cls];
                      const b = reserveTarget.bands[cls];
                      return (
                        <TableRow key={cls}>
                          <TableCell>
                            <span className="font-mono font-semibold uppercase text-foreground">
                              {cls}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {(t * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {(b.min * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {(b.max * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-amber-700 dark:text-amber-300">
                            {(b.stressTarget * 100).toFixed(0)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-700 dark:text-red-300">
                            {(b.emergencyTarget * 100).toFixed(0)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Reserve quality tiers */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Reserve Asset Quality Tiers
            </h4>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              {report.reserveQualityTiers.map((tier) => (
                <Card key={tier.tier} className={`${tierColor(tier.tier)} border`}>
                  <CardContent className="p-4">
                    <Badge
                      variant="outline"
                      className={`font-mono text-xs mb-2 ${tierColor(tier.tier)}`}
                    >
                      {tier.tier}
                    </Badge>
                    <p className="text-xs text-foreground mb-2">
                      {tier.description}
                    </p>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <div>
                        Haircut:{" "}
                        <span className="font-mono">
                          {(tier.haircutRange[0] * 100).toFixed(0)}% –{" "}
                          {(tier.haircutRange[1] * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="italic">{tier.examples.join(", ")}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §8 — Geopolitical Exposure (13 dimensions)              */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              Geopolitical Exposure — 13 Tracked Dimensions
            </h3>
            <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              CORRELATED
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            MTQ minting capacity is <strong>NOT</strong>{" "}
            <code className="font-mono text-xs">available_balance × fixed_ratio</code>.
            It is risk-adjusted eligible backing that accounts for 13 separate
            exposure dimensions. Correlated exposure analysis prevents the
            system from accidentally hiding concentration behind diversity
            in one dimension only.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {geopoliticalDimensions.map((dim, idx) => (
              <Card key={dim} className="border-border/60 hover:border-emerald-500/40 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <Globe className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs font-mono font-semibold text-foreground break-words">
                    {dim}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Geopolitical DMCE Rule
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.geopoliticalDMCERule.trim()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ===================================================== */}
        {/* §9 — Multi-Rail Architecture                           */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Network className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              Multi-Rail Architecture &amp; Fallback Matrix
            </h3>
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
              {railTypes.length} RAILS
            </Badge>
          </div>
          <p className="text-muted-foreground mb-6 max-w-4xl">
            MITHQAL must <strong>NOT</strong> be hard-coded to any single
            settlement rail. The architecture supports 8 rail types and
            requires every corridor to declare primary / secondary / emergency
            rails with explicit failure conditions and routing actions.{" "}
            <em>The system must fail safely.</em>
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Rail types */}
            <Card className="border-border/60 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">8 Rail Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {railTypes.map((r, idx) => (
                  <div
                    key={r}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-background p-2"
                  >
                    <span className="flex-shrink-0 h-5 w-5 rounded bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-semibold text-foreground">
                      {r}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Failure conditions */}
            <Card className="border-border/60 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Failure Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {failureConditions.map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-2"
                  >
                    <AlertOctagon className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-xs font-mono text-foreground">
                      {f}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Routing actions */}
            <Card className="border-border/60 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Routing Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {routingActions.map((r) => {
                  const cls =
                    r === "RETRY" ? "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300" :
                    r === "ALTERNATE_APPROVED_ROUTE" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300" :
                    r === "EMERGENCY_APPROVED_ROUTE" ? "border-orange-500/30 bg-orange-500/5 text-orange-700 dark:text-orange-300" :
                    "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300";
                  return (
                    <div
                      key={r}
                      className={`flex items-center gap-2 rounded-md border p-2 ${cls}`}
                    >
                      <ArrowRight className="h-3 w-3 flex-shrink-0" />
                      <span className="text-xs font-mono font-semibold">
                        {r}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Sovereignty + multi-asset types */}
          <div className="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Settlement Sovereignty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  MITHQAL must support continued operation through multiple
                  legitimate settlement and connectivity options. This is
                  resilience, <strong>not</strong> circumvention. Do NOT bypass
                  laws, sanctions, regulatory restrictions, or
                  institution-imposed controls.
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  7 Multi-Asset Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {report.multiAssetTypes.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="font-mono text-[10px] border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §9b — Institutional Control Domains (UX §36)           */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            <h3 className="text-2xl font-bold tracking-tight">
              4 Visible Institutional Control Domains (UX §36)
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {report.institutionalControlDomains.map((d) => (
              <Card key={d.name} className="border-border/60 hover:border-amber-500/40 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{d.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">
                    {d.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {d.underlyingEngines.map((e) => (
                      <Badge
                        key={e}
                        variant="outline"
                        className="font-mono text-[10px] border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300"
                      >
                        {e}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §9c — Infrastructure surface (tables + endpoints)       */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                  <Server className="h-4 w-4" />
                  <span className="text-sm font-semibold">New DB Tables</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {report.newTursoTables.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  §39 — institutional schema
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                  <Workflow className="h-4 w-4" />
                  <span className="text-sm font-semibold">API Endpoints</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {report.newAPIEndpoints.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  §41 — v25.1 surface
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold">Policy Decisions</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {report.policyDecisions.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  §42 — policy-as-code
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-semibold">Security Controls</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {report.securityRequirements.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  §38 — server-side enforced
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* ===================================================== */}
        {/* §10 — Closing                                         */}
        {/* ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-amber-500/40 bg-gradient-to-br from-amber-500/5 via-background to-background">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <div>
                  <CardTitle className="text-2xl">Final Status Declaration</CardTitle>
                  <CardDescription>
                    Honest state preserved across every architectural surface.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Honest state grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Object.entries(report.honestState).map(([k, v]) => (
                  <div
                    key={k}
                    className={`flex items-center gap-2 rounded-md border p-3 ${
                      v
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    {v ? <Yes /> : <No />}
                    <span className="text-xs font-mono text-foreground">{k}</span>
                  </div>
                ))}
              </div>

              {/* Blueprint + product positioning */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border/60 p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-300">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Blueprint Update ({report.blueprintUpdate.newVersion})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {report.blueprintUpdate.title}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      report.blueprintUpdate.marksExistingComponents,
                      report.blueprintUpdate.marksEnhancedComponents,
                      report.blueprintUpdate.marksNewComponents,
                      report.blueprintUpdate.marksDeprecatedComponents,
                    ].map((m) => (
                      <Badge
                        key={m}
                        variant="outline"
                        className="font-mono text-[10px]"
                      >
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 italic">
                    {report.blueprintUpdate.rule}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 bg-background">
                  <div className="flex items-center gap-2 mb-2 text-emerald-700 dark:text-emerald-300">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Product Positioning
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {report.productPositioning.trim()}
                  </p>
                </div>
              </div>

              {/* Final status banner */}
              <div className="rounded-lg border-2 border-amber-500/50 bg-amber-500/10 p-5 text-center">
                <p className="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">
                  Final Status
                </p>
                <p className="text-xl font-bold text-foreground">
                  APPROVED CANDIDATE FOR CONTROLLED TESTING
                </p>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mt-1">
                  — NOT PRODUCTION-AUTHORIZED —
                </p>
                <p className="text-xs text-muted-foreground mt-3 max-w-2xl mx-auto">
                  v25.1 builds on the frozen v25.0 baseline. No core banking
                  replacement. No SWIFT replacement. No USD peg. No retail
                  exchange. No automatic stablecoin-to-reserve. No mint without
                  confirmed settlement finality.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
