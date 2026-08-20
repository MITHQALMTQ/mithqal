"use client";

/* ============================================================
 * FinalReserveSpecDashboard — §V25.2 FINAL MTQ INSTITUTIONAL
 *                              BACKING ARCHITECTURE
 * ------------------------------------------------------------
 * Task ID: V25-2-RESERVE-DASHBOARD
 *
 * Surfaces the CONTROLLING reserve mathematical specification
 * implementing all 50 sections of the COO/CTO directive:
 *   §1-6   Institutional backing structure + 130% target
 *   §7-16  Currency weight engine (full pipeline)
 *   §17    Effective USD exposure
 *   §18-19 Currency fall price effects
 *   §20-22 Currency lifecycle + floor ladder
 *   §23-29 Gold/bullion + silver + tokenized gold
 *   §30-36 Digital liquidity + DRQS + state machine
 *   §37-42 Reserve valuation + NAVs + RR + FSCR + LCR
 *   §43-44 Rebalancing engine
 *   §45    What-if scenarios
 *   §46-48 Asset admission structure + USDT architecture
 *   §49    Blueprint conflict reconciliation
 *   §50    Final equation system
 *
 * Theming: institutional amber/gold, emerald, red, gray.
 * NO indigo/blue.
 *
 * Data provenance: /api/mtq-final-reserve →
 *   src/lib/mtq-final-reserve-spec.ts
 *   (generateFinalReserveSpecReport())
 *
 * HONEST STATE: design-time spec; no live oracles; no bank
 * contracted; NOT production-authorized.
 * ============================================================ */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Landmark, Layers, Coins, Cpu, Calculator, GitBranch, Scale,
  AlertTriangle, ShieldCheck, Activity, TrendingDown, RefreshCw,
  FileWarning, CheckCircle2, XCircle, Circle,
} from "lucide-react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// alias for convenience
const UI = { Card, CardContent, CardDescription, CardHeader, CardTitle };

interface Report {
  moduleId: string;
  specVersion: string;
  directiveSections: number;
  honestState: {
    designTimeSpec: boolean;
    liveOracleFeeds: boolean;
    bankContracted: boolean;
    finalStatus: string;
    finalStatusColor: string;
  };
  par: number;
  reserveTargets: {
    RR_strategic: number; RR_policy_floor: number; RR_floor: number;
    emergencyCapacityMax: number;
    fiatPct: number; goldPct: number; digitalPct: number;
    frontlinePct: number; strategicFiatPct: number;
    fiatCorridor: { min: number; max: number };
    bullionCorridor: { min: number; max: number };
    digitalCorridor: { min: number; max: number };
  };
  exampleBacking: {
    totalStrategicBacking: number; fiat: number; gold: number; digital: number;
    frontlineFiat: number; strategicFiat: number; emergencyCapacity: number;
  };
  exampleReserve: {
    liability: number; marketReserve: number; adjustedReserve: number; stressReserve: number;
    navs: { NAV_m: number; NAV_l: number; NAV_s: number };
    reserveRatio: { RR: number; RR_target: number; RR_policyFloor: number; RR_absoluteFloor: number; status: string };
    fscr: { FSCR: number; normal: number; defensive: number; emergency: number; status: string; noFeasiblePortfolio: boolean; notationReconciliation: string };
    lcr: { LCR: number; HQLA: number; netOutflow30d: number; target: number; status: string };
  };
  currencyWeights: {
    sum: number; usdEffective: number; constraintsMet: boolean;
    results: {
      currency: string; C: number; M: number; R: number; sigma: number; A: number; K: number; L: number;
      rawWeight: number; normalizedWeight: number; finalWeight: number;
      usdEffectiveContribution: number; eligible: boolean; concentrationCapped: boolean;
    }[];
  };
  usdExposure: {
    usdDirect: number; aedUsdEquivalent: number; sarUsdEquivalent: number;
    usdLinkedSynthetic: number; usdLinkedDigital: number;
    usdEffective: number; ceiling: number; breached: boolean;
  };
  goldPolicy: {
    goldTarget: number; goldPreferredLower: number;
    goldOperationalUpperZone: { low: number; high: number };
    bullionCorridor: { min: number; max: number };
    silverConditionalMax: number; silverCurrent: number;
  };
  silverSDC: { SDC: number; admitted: boolean; allocation: number };
  bri: { BRI: number; advisoryOnly: boolean };
  tokenizedGoldTGRS: { TGRS: number; status: string; haircut: number };
  digitalPolicy: {
    D_normal: number; D_operational: number; D_max: number; D_emergency: number;
    drqsCore: number; drqsConditional: number; algorithmicExcluded: boolean;
  };
  digitalUniverse: { id: string; drqs: number; role: string; algorithmic: boolean; inCore: boolean }[];
  whatIfScenarios: {
    id: string; label: string; RR_before: number; RR_after: number; RR_deltaPp: number;
    R_a_before: number; R_a_after: number; loss: number; explanation: string;
  }[];
  blueprintConflicts: {
    id: string; conflict: string; olderPosition: string; controllingPosition: string; resolution: string; implemented: boolean;
  }[];
  coreReserveStructure: any;
  settlementOnlyStructure: any;
  usdtArchitecture: any;
  finalEquationSystem: Record<string, string>;
  finalStatus: string;
}

const fmtPct = (x: number, dp = 2) => `${(x * 100).toFixed(dp)}%`;
const fmtM = (x: number) => `$${(x / 1e6).toFixed(2)}M`;
const fmtNum = (x: number, dp = 4) => x.toFixed(dp);

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    STRATEGIC: "bg-emerald-100 text-emerald-700 border-emerald-300",
    DEFENSIVE: "bg-amber-100 text-amber-700 border-amber-300",
    EMERGENCY: "bg-orange-100 text-orange-700 border-orange-300",
    INSOLVENT: "bg-red-100 text-red-700 border-red-300",
    NORMAL: "bg-emerald-100 text-emerald-700 border-emerald-300",
    ADEQUATE: "bg-emerald-100 text-emerald-700 border-emerald-300",
    STRESSED: "bg-amber-100 text-amber-700 border-amber-300",
    BREACH: "bg-red-100 text-red-700 border-red-300",
  };
  const cls = map[status] || "bg-gray-100 text-gray-700 border-gray-300";
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>;
}

export function FinalReserveSpecDashboard() {
  const [data, setData] = useState<Report | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const tryFetch = () => {
      attempt += 1;
      fetch("/api/mtq-final-reserve")
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          if (j.ok) setData(j);
          else if (attempt < 4) setTimeout(tryFetch, 1500 * attempt);
          else setErr(j.error || "no ok flag");
        })
        .catch((e) => {
          if (cancelled) return;
          if (attempt < 4) setTimeout(tryFetch, 1500 * attempt);
          else setErr(e.message);
        });
    };
    tryFetch();
    return () => { cancelled = true; };
  }, []);

  if (err) {
    return (
      <UI.Card className="border-red-300">
        <UI.CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">§V25.2 load error:</span>
            <code className="text-xs">{err}</code>
          </div>
        </UI.CardContent>
      </UI.Card>
    );
  }
  if (!data) {
    return (
      <UI.Card className="border-amber-300">
        <UI.CardContent className="p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading §V25.2 Final Reserve Mathematical Specification…</span>
          </div>
        </UI.CardContent>
      </UI.Card>
    );
  }

  const b = data.exampleBacking;
  const er = data.exampleReserve;
  const cw = data.currencyWeights;
  const usd = data.usdExposure;
  const rr = er.reserveRatio;
  const fscr = er.fscr;
  const lcr = er.lcr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ===== §1 HEADER ===== */}
      <UI.Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-white">
        <UI.CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-amber-600" />
                <UI.CardTitle className="text-xl text-amber-900">
                  §V25.2 — Final MTQ Institutional Backing Architecture
                </UI.CardTitle>
              </div>
              <UI.CardDescription className="mt-1 text-amber-800">
                {data.specVersion} · {data.directiveSections} directive sections · CONTROLLING specification
              </UI.CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className="border-amber-400 bg-amber-100 text-amber-800">
                {data.honestState.finalStatus}
              </Badge>
              <span className="text-[10px] text-amber-700">moduleId: {data.moduleId}</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 ${data.honestState.designTimeSpec ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
              {data.honestState.designTimeSpec ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} Design-time spec
            </span>
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 ${!data.honestState.liveOracleFeeds ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
              {!data.honestState.liveOracleFeeds ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} No live oracles
            </span>
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 ${!data.honestState.bankContracted ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
              {!data.honestState.bankContracted ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} No bank contracted
            </span>
            <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 border-amber-300 bg-amber-50 text-amber-700">
              <Circle className="h-3 w-3" /> PAR = {data.par.toFixed(2)} USD
            </span>
          </div>
        </UI.CardHeader>
      </UI.Card>

      {/* ===== §1-6 INSTITUTIONAL BACKING TREE ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§1-6 · Institutional Backing Structure (S = 100M MTQ example)</UI.CardTitle>
          </div>
          <UI.CardDescription>
            Bank/institutional backing — MITHQAL verifies & governs, does NOT own or custody the backing. Protected Backing Cell is bank-side earmarked.
          </UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-amber-900">MTQ Outstanding → Participating Bank → 130% Institutional Backing Target</span>
              <span className="text-lg font-bold text-amber-900">{fmtM(b.totalStrategicBacking)}</span>
            </div>
            <Progress value={(er.adjustedReserve / b.totalStrategicBacking) * 100} className="mt-2 h-2" />
            <div className="mt-1 flex justify-between text-[11px] text-amber-700">
              <span>Adjusted reserve R_a = {fmtM(er.adjustedReserve)}</span>
              <span>Strategic target = 1.30 × L = {fmtM(b.totalStrategicBacking)}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-2 text-emerald-800"><Coins className="h-4 w-4" /><span className="text-sm font-semibold">Fiat — 80%</span></div>
              <div className="mt-1 text-2xl font-bold text-emerald-900">{fmtM(b.fiat)}</div>
              <Separator className="my-2 bg-emerald-200" />
              <div className="text-[11px] text-emerald-700">Front-line liquidity (50%): <b>{fmtM(b.frontlineFiat)}</b></div>
              <div className="text-[11px] text-emerald-700">Strategic fiat diversification (30%): <b>{fmtM(b.strategicFiat)}</b></div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <div className="flex items-center gap-2 text-amber-800"><Scale className="h-4 w-4" /><span className="text-sm font-semibold">Gold / Bullion — 18%</span></div>
              <div className="mt-1 text-2xl font-bold text-amber-900">{fmtM(b.gold)}</div>
              <Separator className="my-2 bg-amber-200" />
              <div className="text-[11px] text-amber-700">Constitutional corridor: 15%–25%</div>
              <div className="text-[11px] text-amber-700">Primary: allocated physical gold</div>
            </div>
            <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3">
              <div className="flex items-center gap-2 text-sky-800"><Cpu className="h-4 w-4" /><span className="text-sm font-semibold">Digital Liquidity — 2%</span></div>
              <div className="mt-1 text-2xl font-bold text-sky-900">{fmtM(b.digital)}</div>
              <Separator className="my-2 bg-sky-200" />
              <div className="text-[11px] text-sky-700">Normal 2% · operational ≤3% · max 5%</div>
              <div className="text-[11px] text-sky-700">Emergency: 0%</div>
            </div>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-800">§4 · Emergency Resilience Capacity (SEPARATE — not auto-added to 130%)</span>
              <span className="font-bold text-purple-900">≤ 15%</span>
            </div>
            <p className="mt-1 text-[11px] text-purple-700">
              Counted only when: legally enforceable + independently verified + accessible during stress + not double-counted + haircut-adjusted.
              Current: {fmtPct(b.emergencyCapacity, 0)} (not activated).
            </p>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §37-42 RESERVE VALUATION ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§37-42 · Reserve Valuation, NAVs, RR, FSCR, LCR</UI.CardTitle>
          </div>
          <UI.CardDescription>Three reserve values · three NAVs · solvency (RR) · stress coverage (FSCR) · liquidity (LCR)</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[11px] font-medium text-gray-500">Market Reserve R_m</div>
              <div className="text-lg font-bold text-gray-900">{fmtM(er.marketReserve)}</div>
              <div className="text-[10px] text-gray-500">Σ Q_a · P_a</div>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3">
              <div className="text-[11px] font-medium text-amber-700">Adjusted (prudential) R_a</div>
              <div className="text-lg font-bold text-amber-900">{fmtM(er.adjustedReserve)}</div>
              <div className="text-[10px] text-amber-700">Σ Q_a P_a (1−H_a) C_a  ← solvency basis</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
              <div className="text-[11px] font-medium text-red-700">Stress (liquidation) R_l</div>
              <div className="text-lg font-bold text-red-900">{fmtM(er.stressReserve)}</div>
              <div className="text-[10px] text-red-700">Σ Q_a P_a (1−H_a) C_a S_a  ← stress basis</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-[11px] font-medium text-gray-500">Market NAV (NAV_m)</div>
              <div className="text-lg font-bold text-gray-900">{fmtNum(er.navs.NAV_m, 4)}</div>
              <div className="text-[10px] text-gray-500">R_m / S</div>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3">
              <div className="text-[11px] font-medium text-amber-700">Prudential NAV (NAV_l)</div>
              <div className="text-lg font-bold text-amber-900">{fmtNum(er.navs.NAV_l, 4)}</div>
              <div className="text-[10px] text-amber-700">R_a / S  (spec subscript &lsquo;l&rsquo; = prudential)</div>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50/40 p-3">
              <div className="text-[11px] font-medium text-red-700">Stress NAV (NAV_s)</div>
              <div className="text-lg font-bold text-red-900">{fmtNum(er.navs.NAV_s, 4)}</div>
              <div className="text-[10px] text-red-700">R_l / S</div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3" style={{ borderColor: rr.status === "STRATEGIC" ? "#10b981" : rr.status === "DEFENSIVE" ? "#f59e0b" : "#ef4444" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500">Reserve Ratio (RR = R_a / L)</span>
                <StatusBadge status={rr.status} />
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{fmtPct(rr.RR)}</div>
              <div className="mt-1 text-[10px] text-gray-500">
                target {fmtPct(rr.RR_target, 0)} · policy floor {fmtPct(rr.RR_policyFloor, 0)} · absolute floor {fmtPct(rr.RR_absoluteFloor, 0)}
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: fscr.status === "NORMAL" ? "#10b981" : fscr.status === "DEFENSIVE" ? "#f59e0b" : "#ef4444" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500">FSCR (R_l / L)</span>
                <StatusBadge status={fscr.status} />
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{fmtPct(fscr.FSCR)}</div>
              <div className="mt-1 text-[10px] text-gray-500">normal ≥110% · defensive ≥105% · emergency ≥100%</div>
              {fscr.noFeasiblePortfolio && (
                <div className="mt-1 rounded bg-red-100 px-1 py-0.5 text-[10px] font-semibold text-red-700">NO_FEASIBLE_PORTFOLIO — issuance reduced/frozen</div>
              )}
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: lcr.status === "ADEQUATE" ? "#10b981" : lcr.status === "STRESSED" ? "#f59e0b" : "#ef4444" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500">LCR (HQLA / 30d net outflow)</span>
                <StatusBadge status={lcr.status} />
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900">{fmtPct(lcr.LCR)}</div>
              <div className="mt-1 text-[10px] text-gray-500">target ≥100% · HQLA {fmtM(lcr.HQLA)} · outflow {fmtM(lcr.netOutflow30d)}</div>
            </div>
          </div>
          <div className="rounded border border-amber-200 bg-amber-50/40 p-2 text-[10px] text-amber-800">
            <FileWarning className="mr-1 inline h-3 w-3" />
            <b>FSCR notation reconciliation:</b> {fscr.notationReconciliation}
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §7-16 CURRENCY WEIGHT ENGINE ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-amber-600" />
              <UI.CardTitle className="text-base">§7-16 · Currency Weight Engine (11 core currencies)</UI.CardTitle>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <Badge className={cw.constraintsMet ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}>
                Σ W = {fmtNum(cw.sum, 6)} · constraints {cw.constraintsMet ? "MET" : "BREACH"}
              </Badge>
            </div>
          </div>
          <UI.CardDescription>
            C_i = 0.50·COFER + 0.40·SWIFT + 0.10·BIS → momentum M (±5%) → mean-reversion R (±2%) → EWMA σ → attenuation A → K = 1+A(M·R−1) → liquidity L (±5%) → proportional normalization → 20% hard cap
          </UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent>
          <div className="max-h-96 overflow-y-auto rounded border border-gray-200">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-2 py-1.5 text-left">CCY</th>
                  <th className="px-2 py-1.5 text-right">C</th>
                  <th className="px-2 py-1.5 text-right">M</th>
                  <th className="px-2 py-1.5 text-right">R</th>
                  <th className="px-2 py-1.5 text-right">σ</th>
                  <th className="px-2 py-1.5 text-right">A</th>
                  <th className="px-2 py-1.5 text-right">K</th>
                  <th className="px-2 py-1.5 text-right">L</th>
                  <th className="px-2 py-1.5 text-right">Final W</th>
                  <th className="px-2 py-1.5 text-right">USD-eff</th>
                  <th className="px-2 py-1.5 text-center">Cap</th>
                </tr>
              </thead>
              <tbody>
                {cw.results.map((c) => (
                  <tr key={c.currency} className="border-t border-gray-100 hover:bg-amber-50/40">
                    <td className="px-2 py-1.5 font-semibold text-gray-900">{c.currency}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.C, 4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.M, 4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.R, 4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.sigma, 4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.A, 3)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.K, 4)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-600">{fmtNum(c.L, 4)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-amber-900">{fmtPct(c.finalWeight)}</td>
                    <td className="px-2 py-1.5 text-right text-gray-500">{c.usdEffectiveContribution > 0 ? fmtPct(c.usdEffectiveContribution) : "—"}</td>
                    <td className="px-2 py-1.5 text-center">{c.concentrationCapped ? <span className="text-red-600">●</span> : <span className="text-emerald-400">○</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
            <span>C = structural weight</span>
            <span>M = momentum (0.95–1.05)</span>
            <span>R = mean-reversion (0.98–1.02)</span>
            <span>σ = EWMA vol (λ=0.94)</span>
            <span>A = attenuation (0.5–1.0)</span>
            <span>K = combined adjustment</span>
            <span>L = liquidity overlay (±5%)</span>
            <span className="text-red-600">● = capped at 20% hard limit</span>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §17 EFFECTIVE USD EXPOSURE ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§17 · Effective USD Exposure (direct + pegged + synthetic + digital)</UI.CardTitle>
          </div>
          <UI.CardDescription>AED &amp; SAR are USD-pegged → counted toward effective USD exposure (prevents 15%+10%+10% being misread as only 15% USD)</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">USD direct</div><div className="text-sm font-bold">{fmtPct(usd.usdDirect)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">AED USD-equiv</div><div className="text-sm font-bold">{fmtPct(usd.aedUsdEquivalent)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">SAR USD-equiv</div><div className="text-sm font-bold">{fmtPct(usd.sarUsdEquivalent)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">USD-linked synthetic</div><div className="text-sm font-bold">{fmtPct(usd.usdLinkedSynthetic)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">USD-linked digital</div><div className="text-sm font-bold">{fmtPct(usd.usdLinkedDigital)}</div></div>
          </div>
          <div className={`mt-3 flex items-center justify-between rounded-lg border p-3 ${usd.breached ? "border-red-300 bg-red-50" : "border-emerald-300 bg-emerald-50"}`}>
            <span className="text-sm font-semibold text-gray-700">USD effective total</span>
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${usd.breached ? "text-red-700" : "text-emerald-700"}`}>{fmtPct(usd.usdEffective)}</span>
              <Badge className={usd.breached ? "border-red-400 bg-red-100 text-red-700" : "border-emerald-400 bg-emerald-100 text-emerald-700"}>
                ceiling {fmtPct(usd.ceiling, 0)} · {usd.breached ? "BREACH" : "OK"}
              </Badge>
            </div>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §45 WHAT-IF SCENARIOS ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§45 · What-If Scenarios (S=100M, RR={fmtPct(rr.RR)})</UI.CardTitle>
          </div>
          <UI.CardDescription>RR&prime; = RR·(1 − w_i·d) · demonstrates why the digital sleeve is deliberately small</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="grid gap-3 md:grid-cols-2">
          {data.whatIfScenarios.map((s) => {
            const ok = s.RR_after >= 1.0;
            return (
              <div key={s.id} className={`rounded-lg border p-3 ${ok ? "border-amber-200 bg-amber-50/40" : "border-red-300 bg-red-50/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Scenario {s.id} · {s.label}</span>
                  <Badge className={ok ? "border-amber-300 bg-amber-100 text-amber-800" : "border-red-400 bg-red-100 text-red-700"}>Δ {s.RR_deltaPp.toFixed(2)}pp</Badge>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">{fmtPct(s.RR_before)}</span>
                  <span className="text-gray-400">→</span>
                  <span className={`font-bold ${ok ? "text-amber-900" : "text-red-700"}`}>{fmtPct(s.RR_after)}</span>
                  {!ok && <span className="text-[10px] font-semibold text-red-600">BELOW 100% FLOOR</span>}
                </div>
                <div className="mt-1 text-[10px] text-gray-500">Loss: {fmtM(s.loss)}</div>
                <p className="mt-1 text-[10px] text-gray-600">{s.explanation}</p>
              </div>
            );
          })}
        </UI.CardContent>
      </UI.Card>

      {/* ===== §23-29 GOLD / SILVER / TOKENIZED ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§23-29 · Gold / Bullion / Silver / Tokenized Gold</UI.CardTitle>
          </div>
          <UI.CardDescription>Gold is the constitutional monetary anchor · liquidation sequence protects gold LAST</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded border border-amber-200 bg-amber-50/40 p-2"><div className="text-[10px] text-amber-700">Gold target</div><div className="text-sm font-bold text-amber-900">{fmtPct(data.goldPolicy.goldTarget, 0)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">Preferred lower</div><div className="text-sm font-bold">{fmtPct(data.goldPolicy.goldPreferredLower, 0)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">Operational upper zone</div><div className="text-sm font-bold">{fmtPct(data.goldPolicy.goldOperationalUpperZone.low, 0)}–{fmtPct(data.goldPolicy.goldOperationalUpperZone.high, 0)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">Bullion corridor</div><div className="text-sm font-bold">{fmtPct(data.goldPolicy.bullionCorridor.min, 0)}–{fmtPct(data.goldPolicy.bullionCorridor.max, 0)}</div></div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">§27 · Silver (SDC_Ag)</span>
                <Badge className={data.silverSDC.admitted ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-gray-300 bg-gray-50 text-gray-600"}>
                  {data.silverSDC.admitted ? "ADMITTED ≤3%" : "0% (SDC ≤ 0)"}
                </Badge>
              </div>
              <div className="mt-1 text-[11px] text-gray-600">SDC = NetResilienceGain − NetCost = <b>{data.silverSDC.SDC.toFixed(4)}</b></div>
              <div className="text-[10px] text-gray-500">Allocation: {fmtPct(data.silverSDC.allocation, 1)} · conditional max {fmtPct(data.goldPolicy.silverConditionalMax, 0)}</div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">§29 · Tokenized Gold (PAXG) TGRS</span>
                <Badge className={
                  data.tokenizedGoldTGRS.status === "ELIGIBLE" ? "border-emerald-300 bg-emerald-50 text-emerald-700" :
                  data.tokenizedGoldTGRS.status === "CONDITIONAL" ? "border-amber-300 bg-amber-50 text-amber-700" :
                  "border-red-300 bg-red-50 text-red-700"
                }>{data.tokenizedGoldTGRS.status}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-gray-600">TGRS = <b>{data.tokenizedGoldTGRS.TGRS.toFixed(2)}</b> / 10 · haircut H_TG = {fmtPct(data.tokenizedGoldTGRS.haircut)}</div>
              <div className="text-[10px] text-gray-500">Conditional separate exposure · NOT auto-counted as physical gold</div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
            <div className="text-[11px] font-semibold text-amber-800">§26 · Liquidation Sequence (gold protected LAST)</div>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
              {["1. Digital liquidity", "2. Cash", "3. Short-duration sovereign", "4. Non-USD FX", "5. Conditional silver", "6. Tokenized gold", "7. Physical gold (LAST)"].map((s, i) => (
                <span key={s} className={`rounded border px-2 py-0.5 ${i === 6 ? "border-amber-400 bg-amber-100 text-amber-800" : "border-gray-200 bg-white text-gray-600"}`}>{s}</span>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-500">§28 · BRI (advisory only) = {data.bri.BRI.toFixed(4)} · does not independently rebalance the reserve</div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §30-36 DIGITAL LIQUIDITY ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§30-36 · Digital Liquidity (DRQS + Universe + State Machine)</UI.CardTitle>
          </div>
          <UI.CardDescription>Normal 2% · operational ≤3% · constitutional max 5% · emergency 0% · algorithmic stablecoins EXCLUDED</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="rounded border border-emerald-200 bg-emerald-50/40 p-2"><div className="text-[10px] text-emerald-700">D_normal</div><div className="text-sm font-bold text-emerald-900">{fmtPct(data.digitalPolicy.D_normal, 0)}</div></div>
            <div className="rounded border border-amber-200 bg-amber-50/40 p-2"><div className="text-[10px] text-amber-700">D_operational (≤)</div><div className="text-sm font-bold text-amber-900">{fmtPct(data.digitalPolicy.D_operational, 0)}</div></div>
            <div className="rounded border border-red-200 bg-red-50/40 p-2"><div className="text-[10px] text-red-700">D_max (constitutional)</div><div className="text-sm font-bold text-red-900">{fmtPct(data.digitalPolicy.D_max, 0)}</div></div>
            <div className="rounded border border-gray-200 p-2"><div className="text-[10px] text-gray-500">D_emergency</div><div className="text-sm font-bold">{fmtPct(data.digitalPolicy.D_emergency, 0)}</div></div>
          </div>

          <div className="rounded border border-gray-200">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-2 py-1.5 text-left">Asset</th>
                  <th className="px-2 py-1.5 text-right">DRQS</th>
                  <th className="px-2 py-1.5 text-center">Core ≥7.5</th>
                  <th className="px-2 py-1.5 text-left">Role</th>
                </tr>
              </thead>
              <tbody>
                {data.digitalUniverse.map((d) => {
                  const core = d.drqs >= data.digitalPolicy.drqsCore;
                  const cond = !core && d.drqs >= data.digitalPolicy.drqsConditional;
                  return (
                    <tr key={d.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5 font-semibold text-gray-900">{d.id}</td>
                      <td className="px-2 py-1.5 text-right text-gray-700">{d.drqs.toFixed(2)}</td>
                      <td className="px-2 py-1.5 text-center">
                        {d.inCore ? <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">CORE</span> :
                         d.id === "DAI" ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">0% optional</span> :
                         <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">EXCL (external only)</span>}
                      </td>
                      <td className="px-2 py-1.5 text-gray-600">{d.role}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 text-[10px] text-gray-500 md:grid-cols-2">
            <div>§35 · StressDRQS_i = DRQS_i · (1 − SF_i) · optimizer uses min(DRQS, StressDRQS)</div>
            <div>§36 · States: NORMAL &lt;1% · WATCH 2% · REDUCE 5% · SUSPEND 10%/frozen/failed/sanctions</div>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §20-22 CURRENCY LIFECYCLE ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§20-22 · Currency Lifecycle & Minimum-Floor Ladder</UI.CardTitle>
          </div>
          <UI.CardDescription>Lifecycle over price moves · WATCH → REDUCE → SUSPEND → SUBSTITUTE → REINSTATE</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {[
              ["WATCH", "CQS<6.0 / downgrade / vol>2σ", "border-amber-300 bg-amber-50 text-amber-700"],
              ["REDUCE", "CQS<5.5 × ~20 readings", "border-orange-300 bg-orange-50 text-orange-700"],
              ["SUSPEND", "CQS<4.0 / sanctions / capital controls", "border-red-300 bg-red-50 text-red-700"],
              ["SUBSTITUTE", "governance approves replacement", "border-purple-300 bg-purple-50 text-purple-700"],
              ["REINSTATE", "CQS>6.5 × 60 readings", "border-emerald-300 bg-emerald-50 text-emerald-700"],
            ].map(([s, t, cls]) => (
              <div key={s} className={`rounded border px-2 py-1 ${cls}`}>
                <div className="font-semibold">{s}</div>
                <div className="text-[9px] opacity-80">{t}</div>
              </div>
            ))}
          </div>
          <div className="rounded border border-gray-200 p-3 text-[11px] text-gray-600">
            <b className="text-gray-800">§21 Exit:</b> weight → 0; renormalize remaining: W_j&prime; = W_j / (1 − W_i); verify Σ = 1. Permanently recorded.
            <br /><b className="text-gray-800">§22 Min-floor (0.5%) Q1-Q4 ladder:</b> Observation Q1 → Q2 → Probation Q3 → Removal Q4 → renormalize (4 consecutive quarters below floor).
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §43-44 REBALANCING ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§43-44 · Rebalancing Engine</UI.CardTitle>
          </div>
          <UI.CardDescription>Δ_i = W_actual − W_target · ordinary trigger |Δ| &gt; 2pp · hard overrides bypass threshold · NetBenefit &gt; 0 required for voluntary trades</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-2">
          <div className="grid gap-2 md:grid-cols-2 text-[11px]">
            <div className="rounded border border-gray-200 p-2">
              <div className="font-semibold text-gray-700">§43 Hard overrides (execute regardless of cost)</div>
              <ul className="mt-1 space-y-0.5 text-gray-600">
                <li>· Constitutional range breached</li>
                <li>· Concentration breached (20% / 35% USD-eff)</li>
                <li>· Eligibility changed</li>
                <li>· Backing/solvency requires it</li>
                <li>· Stablecoin eligibility failed</li>
                <li>· Emergency governance activated</li>
              </ul>
            </div>
            <div className="rounded border border-gray-200 p-2">
              <div className="font-semibold text-gray-700">§44 Transaction-cost test</div>
              <div className="mt-1 text-gray-600">NetBenefit = RiskReduction − TotalCost</div>
              <div className="text-gray-600">Execute voluntary rebalance only if NetBenefit &gt; 0</div>
              <div className="text-gray-600">TotalCost = spread + fees + slippage + marketImpact + custody + settlement + taxes + lifecycle</div>
              <div className="mt-1 text-[10px] text-amber-700">Hard breach overrides the cost test.</div>
            </div>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §49 BLUEPRINT CONFLICT RECONCILIATION ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§49 · Blueprint Conflict Reconciliation (4 conflicts — REQUIRED CLEANUP)</UI.CardTitle>
          </div>
          <UI.CardDescription>The developer must implement the CONTROLLING position; older material is historical/non-controlling</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="space-y-2">
          {data.blueprintConflicts.map((c) => (
            <div key={c.id} className="rounded-lg border border-amber-200 bg-amber-50/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-900">{c.id} · {c.conflict}</span>
                <Badge className={c.implemented ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}>
                  {c.implemented ? "IMPLEMENTED" : "PENDING"}
                </Badge>
              </div>
              <div className="mt-1 grid gap-1 text-[11px] md:grid-cols-3">
                <div><span className="text-red-600">Older:</span> <span className="text-gray-600">{c.olderPosition}</span></div>
                <div><span className="text-emerald-700">Controlling:</span> <span className="text-gray-800 font-medium">{c.controllingPosition}</span></div>
                <div><span className="text-gray-500">Resolution:</span> <span className="text-gray-600">{c.resolution}</span></div>
              </div>
            </div>
          ))}
        </UI.CardContent>
      </UI.Card>

      {/* ===== §46-48 ASSET ADMISSION + USDT ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§46-48 · Asset Admission Structure + USDT Architecture</UI.CardTitle>
          </div>
          <UI.CardDescription>Core reserve vs settlement-only · settlement eligibility ≠ backing eligibility · USDT = external interoperability, NOT core backing</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-3">
            <div className="text-sm font-semibold text-emerald-900">§46A · Core Reserve Basket</div>
            <div className="mt-1 text-[11px] text-gray-700"><b>Fiat (80%):</b> USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY (conditional), CAD, AUD</div>
            <div className="text-[11px] text-gray-700"><b>Gold (18%):</b> allocated physical · silver conditional 0% · tokenized gold conditional separate</div>
            <div className="text-[11px] text-gray-700"><b>Digital (2%):</b> USDC, USDP, EURC, BUIDL (preferred); DAI 0% optional; USDT excluded from core</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50/40 p-3">
            <div className="text-sm font-semibold text-gray-800">§47 · Settlement-Only (NOT core reserve)</div>
            <div className="mt-1 text-[11px] text-gray-600"><b>Fiat:</b> EGP, INR, KRW, TRY, BRL, MXN, ZAR, IDR, MYR, THB + qualified others</div>
            <div className="text-[11px] text-gray-600"><b>Digital:</b> USDT, DAI, other approved stablecoins/assets</div>
            <div className="text-[11px] text-gray-600"><b>CBDCs / tokenized bank money / gold-backed digital:</b> conditional, individually assessed</div>
            <div className="mt-1 text-[10px] font-semibold text-amber-700">settlement eligibility ≠ backing eligibility</div>
          </div>
          <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-3 md:col-span-2">
            <div className="text-sm font-semibold text-amber-900">§48 · USDT Architecture — external interoperability, NOT core digital backing</div>
            <div className="mt-1 text-[11px] text-gray-700">
              Flow: USDT (external input/bridge) → eligibility engine (jurisdiction + provider + sanctions) → authorized conversion → bank/LP → institutional value → final settlement → MTQ issuance
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
              <span className="rounded border border-red-300 bg-red-50 px-2 py-0.5 text-red-700">USDT → MTQ Core Backing = NO (current policy)</span>
              <span className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-emerald-700">USDT → MTQ external conversion = YES (conditional)</span>
            </div>
            <div className="mt-1 text-[10px] text-gray-500">BIS 2026: stablecoins can deviate from par + redemption/liquidity/settlement frictions → MTQ not structurally dependent on USDT.</div>
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== §50 FINAL EQUATION SYSTEM ===== */}
      <UI.Card>
        <UI.CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-amber-600" />
            <UI.CardTitle className="text-base">§50 · Final Equation System (consolidated reference)</UI.CardTitle>
          </div>
          <UI.CardDescription>The complete controlling mathematical specification</UI.CardDescription>
        </UI.CardHeader>
        <UI.CardContent>
          <div className="grid gap-1.5 md:grid-cols-2">
            {Object.entries(data.finalEquationSystem).map(([k, v]) => (
              <div key={k} className="rounded border border-gray-200 bg-gray-50/40 p-2">
                <div className="text-[10px] font-semibold text-amber-700">{k}</div>
                <div className="font-mono text-[11px] text-gray-800">{v}</div>
              </div>
            ))}
          </div>
        </UI.CardContent>
      </UI.Card>

      {/* ===== CLOSING ===== */}
      <UI.Card className="border-amber-300 bg-amber-50/30">
        <UI.CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <div className="text-sm font-bold text-amber-900">Final COO Decision — Reserve Architecture Frozen (subject to quantitative validation)</div>
              <p className="mt-1 text-[11px] text-amber-800">
                130% institutional backing target → 80% monetary/fiat + 18% gold-centered bullion + 2% digital liquidity,
                with a separate non-double-counted emergency resilience capacity of ≤15%. Fiat basket: USD, EUR, CHF, JPY,
                GBP, SGD, AED, SAR, CNY, CAD, AUD. EGP/INR/KRW/TRY/BRL/MXN/ZAR/IDR/MYR/THB + qualified others remain
                settlement/conversion currencies, not core reserve. USDT = external interoperability/conversion asset,
                not current core digital backing. USDC/USDP/EURC/BUIDL are current digital-liquidity candidates within
                the 2% normal sleeve. Gold = primary constitutional monetary anchor, institutionally allocated/segregated,
                silver conditional &amp; currently 0%. Percentages are NOT blindly fixed — the monetary engine calculates
                currency weights through structural importance, momentum, mean reversion, volatility attenuation, liquidity,
                concentration &amp; eligibility, then verifies the result before it can affect issuance or settlement.
              </p>
              <div className="mt-2 text-[11px] font-semibold text-amber-900">{data.finalStatus}</div>
            </div>
          </div>
        </UI.CardContent>
      </UI.Card>
    </motion.div>
  );
}
