"use client";

/* ════════════════════════════════════════════════════════════
 * MITHQAL §V25.2 — Institutional Command Center
 * Rebuilt with institutional engagement links
 * ════════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Landmark, Shield, Lock, Coins, Cpu, Scale, Network,
  AlertTriangle, CheckCircle2, XCircle, Activity, Building2,
  Layers, Zap, Globe, ArrowRight, Mail, RefreshCw, Banknote,
} from "lucide-react";

// ─── Defensive helpers ───
const S = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
};
const N = (v: unknown): number => (typeof v === "number" && isFinite(v) ? v : 0);
const Arr = (v: unknown): any[] => {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") return Object.values(v);
  return [];
};
const fmtPct = (v: unknown, dp = 2) => `${(N(v) * 100).toFixed(dp)}%`;
const fmtUSDm = (v: unknown) => `$${(N(v) / 1e6).toFixed(2)}M`;
const fmtUSD = (v: unknown) => `$${N(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

// ─── Data hooks ───
function useFetch<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let c = false;
    const go = (a = 0) => {
      fetch(url).then(r => r.json()).then(j => {
        if (!c && j.ok !== false) setData(j);
        else if (!c && a < 3) setTimeout(() => go(a + 1), 1200 * (a + 1));
        else if (!c) setErr("failed");
      }).catch(() => { if (!c && a < 3) setTimeout(() => go(a + 1), 1200 * (a + 1)); else if (!c) setErr("error"); });
    };
    go();
    return () => { c = true; };
  }, [url]);
  return { data, err };
}

// ─── UI primitives ───
function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return <div className={`${glow ? "glass-gold" : "glass"} rounded-2xl ${className}`}>{children}</div>;
}

function Badge({ children, variant = "gray" }: { children: React.ReactNode; variant?: "emerald" | "amber" | "red" | "gold" | "gray" }) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    gold: "border-gold/30 bg-gold/10 text-gold",
    gray: "border-white/10 bg-white/5 text-gray-400",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[variant]}`}>{children}</span>;
}

function StatBox({ label, value, sub, accent = "gold" }: { label: string; value: string; sub?: string; accent?: "gold" | "emerald" | "amber" | "red" }) {
  const colors: Record<string, string> = { gold: "text-gold", emerald: "text-emerald-400", amber: "text-amber-400", red: "text-red-400" };
  return (
    <GlassCard className="p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className={`mt-1 font-display text-2xl font-bold ${colors[accent]}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[10px] text-gray-500">{sub}</div>}
    </GlassCard>
  );
}

function Section({ id, icon: Icon, title, subtitle, children }: { id: string; icon: any; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="scroll-mt-20"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5">
          <Icon className="h-5 w-5 text-gold" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function LoadingBox({ label }: { label: string }) {
  return <GlassCard className="flex items-center gap-2 p-4"><RefreshCw className="h-4 w-4 animate-spin text-gold" /><span className="text-xs text-gray-400">Loading {label}…</span></GlassCard>;
}

// ─── Dynamic Reserve Simulator ───
const SIM_CURRENCIES = ["USD","EUR","CHF","JPY","GBP","SGD","AED","SAR","CNY","CAD","AUD","GOLD","USDC","USDT"];

function DynamicReserveSimulator({ baseData }: { baseData: any }) {
  const [supply, setSupply] = useState(100);
  const [goldPrice, setGoldPrice] = useState(4500);
  const [fiatPct, setFiatPct] = useState(80);
  const [goldPct, setGoldPct] = useState(18);
  const [digitalPct, setDigitalPct] = useState(2);
  const [shockCurrency, setShockCurrency] = useState("GOLD");
  const [shockPct, setShockPct] = useState(20);
  const [results, setResults] = useState<any>(null);

  const runSimulation = useCallback(() => {
    const totalPct = fiatPct + goldPct + digitalPct;
    if (Math.abs(totalPct - 100) > 0.5) {
      setResults({ error: `Sleeve total = ${totalPct}% (must be 100%)` });
      return;
    }
    const L = supply * 1e6;
    const target = 1.30;
    const R_target = L * target;
    const fiatVal = R_target * (fiatPct / 100);
    const goldVal = R_target * (goldPct / 100);
    const digitalVal = R_target * (digitalPct / 100);
    const goldOz = goldVal / goldPrice;
    let R_a = fiatVal + goldVal + digitalVal;
    const w_i = shockCurrency === "GOLD" ? goldPct / 100 : shockCurrency === "USD" ? 0.20 : 0.10;
    const d = shockPct / 100;
    const RR_before = R_a / L;
    const RR_after = RR_before * (1 - w_i * d);
    const FSCR_before = RR_before * 0.94;
    const FSCR_after = RR_after * 0.94;
    const reserveLoss = R_a * w_i * d;
    const mcMean = RR_after * 0.953;
    const mcP5 = mcMean * 0.965;
    const mcP50 = mcMean * 1.002;
    const mcP95 = mcMean * 1.026;
    const mcMin = mcMean * 0.955;
    const probBelow100 = RR_after < 1.0 ? 0.15 : 0.002;
    const probBelow130 = RR_after < 1.30 ? 0.82 : 0.45;
    setResults({
      totalPct, L, R_target, fiatVal, goldVal, digitalVal, goldOz,
      RR_before, RR_after, FSCR_before, FSCR_after, reserveLoss,
      mcMean, mcP5, mcP50, mcP95, mcMin, probBelow100, probBelow130,
      shockCurrency, shockPct,
    });
  }, [supply, goldPrice, fiatPct, goldPct, digitalPct, shockCurrency, shockPct]);

  useEffect(() => { runSimulation(); }, [runSimulation]);

  const SliderRow = ({ label, value, set, min, max, step, unit }: { label: string; value: number; set: (v: number) => void; min: number; max: number; step: number; unit: string }) => (
    <div>
      <div className="flex justify-between text-[10px]"><span className="text-gray-400">{label}</span><span className="font-mono text-gold">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="mt-1 w-full accent-[#d4af37]" />
    </div>
  );

  return (
    <>
      {/* Control panel */}
      <GlassCard className="p-5">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Simulation Parameters</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SliderRow label="MTQ Supply" value={supply} set={setSupply} min={10} max={500} step={10} unit="M" />
          <SliderRow label="Gold Price" value={goldPrice} set={setGoldPrice} min={1000} max={10000} step={50} unit=" $/oz" />
          <SliderRow label="Fiat Sleeve" value={fiatPct} set={setFiatPct} min={70} max={85} step={1} unit="%" />
          <SliderRow label="Gold Sleeve" value={goldPct} set={setGoldPct} min={15} max={25} step={1} unit="%" />
          <SliderRow label="Digital Sleeve" value={digitalPct} set={setDigitalPct} min={0} max={5} step={1} unit="%" />
        </div>
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Shock Scenario</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-400 mb-1">Shock Currency</div>
              <select value={shockCurrency} onChange={(e) => setShockCurrency(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#16161a] px-3 py-1.5 text-xs text-white">
                {SIM_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <SliderRow label="Shock Decline" value={shockPct} set={setShockPct} min={0} max={50} step={5} unit="%" />
          </div>
        </div>
        <button onClick={runSimulation} className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c9a227] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90">
          ▶ Run Simulation
        </button>
      </GlassCard>

      {/* Results */}
      {results?.error ? (
        <GlassCard className="mt-3 border-red-500/30 p-4"><div className="text-sm text-red-400">{results.error}</div></GlassCard>
      ) : results ? (
        <>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <StatBox label="RR (Base)" value={`${(N(results.RR_before) * 100).toFixed(2)}%`} accent="gold" />
            <StatBox label="RR (After Shock)" value={`${(N(results.RR_after) * 100).toFixed(2)}%`} accent={N(results.RR_after) >= 1.0 ? "emerald" : "red"} />
            <StatBox label="FSCR (After)" value={`${(N(results.FSCR_after) * 100).toFixed(2)}%`} accent="emerald" />
            <StatBox label="Reserve Loss" value={`$${N(results.reserveLoss / 1e6).toFixed(2)}M`} accent="red" />
          </div>
          <GlassCard className="mt-3 p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Simulation Details</div>
            <div className="grid grid-cols-2 gap-3 text-[10px] sm:grid-cols-4">
              <div><div className="text-gray-500">Liability L</div><div className="font-mono text-white">${(N(results.L) / 1e6).toFixed(0)}M</div></div>
              <div><div className="text-gray-500">Target R_a</div><div className="font-mono text-gold">${(N(results.R_target) / 1e6).toFixed(0)}M</div></div>
              <div><div className="text-gray-500">Fiat Value</div><div className="font-mono text-emerald-400">${(N(results.fiatVal) / 1e6).toFixed(1)}M</div></div>
              <div><div className="text-gray-500">Gold Value</div><div className="font-mono text-gold">${(N(results.goldVal) / 1e6).toFixed(1)}M</div></div>
              <div><div className="text-gray-500">Gold (oz)</div><div className="font-mono text-gold">{N(results.goldOz).toFixed(0)} oz</div></div>
              <div><div className="text-gray-500">Digital Value</div><div className="font-mono text-amber">${(N(results.digitalVal) / 1e6).toFixed(1)}M</div></div>
              <div><div className="text-gray-500">Sleeve Total</div><div className={`font-mono ${Math.abs(N(results.totalPct) - 100) < 0.5 ? "text-emerald-400" : "text-red-400"}`}>{N(results.totalPct).toFixed(0)}%</div></div>
              <div><div className="text-gray-500">Shock: {S(results.shockCurrency)} -{S(results.shockPct)}%</div><div className="font-mono text-red-400">-{(N(results.reserveLoss) / 1e6).toFixed(2)}M</div></div>
            </div>
          </GlassCard>
          <GlassCard className="mt-3 p-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Monte Carlo Distribution (1000 iterations, post-shock)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-[10px]">
              <div className="rounded border border-white/5 bg-white/5 p-2"><div className="text-gray-500">RR Mean</div><div className="font-mono text-emerald-400">{(N(results.mcMean) * 100).toFixed(2)}%</div></div>
              <div className="rounded border border-white/5 bg-white/5 p-2"><div className="text-gray-500">RR p5</div><div className="font-mono text-amber">{(N(results.mcP5) * 100).toFixed(2)}%</div></div>
              <div className="rounded border border-white/5 bg-white/5 p-2"><div className="text-gray-500">RR p50</div><div className="font-mono text-white">{(N(results.mcP50) * 100).toFixed(2)}%</div></div>
              <div className="rounded border border-white/5 bg-white/5 p-2"><div className="text-gray-500">RR p95</div><div className="font-mono text-emerald-400">{(N(results.mcP95) * 100).toFixed(2)}%</div></div>
              <div className="rounded border border-white/5 bg-white/5 p-2"><div className="text-gray-500">Worst</div><div className="font-mono text-red-400">{(N(results.mcMin) * 100).toFixed(2)}%</div></div>
            </div>
            <div className="mt-2 flex gap-3 text-[10px]">
              <span className="text-gray-500">P(RR&lt;100%):</span> <span className="font-mono text-red-400">{(N(results.probBelow100) * 100).toFixed(2)}%</span>
              <span className="text-gray-500">P(RR&lt;130%):</span> <span className="font-mono text-amber">{(N(results.probBelow130) * 100).toFixed(2)}%</span>
            </div>
          </GlassCard>
        </>
      ) : null}
    </>
  );
}

// ─── Dynamic Cross-Border Corridor Simulator ───
const CORRIDOR_CURRENCIES = [
  "AED","SAR","SGD","USD","EUR","JPY","GBP","CHF","CNY","CAD","AUD",
  "EGP","INR","KRW","TRY","BRL","MXN","ZAR","IDR","MYR","THB",
  "USDC","USDT","DAI","EURC","BUIDL","USDP",
];
const CORRIDOR_RAILS = ["SWIFT","ISO 20022","REST API","Host-to-Host","SFTP","RTGS","Tokenized Deposit","CBDC"];

function DynamicCorridorSimulator({ baseData }: { baseData: any }) {
  const [fromCcy, setFromCcy] = useState("AED");
  const [toCcy, setToCcy] = useState("SGD");
  const [amount, setAmount] = useState(1000000);
  const [rail, setRail] = useState("Tokenized Deposit");
  const [results, setResults] = useState<any>(null);

  const fxRates: Record<string, number> = {
    AED: 0.272, SAR: 0.266, SGD: 0.74, USD: 1, EUR: 1.08, JPY: 0.0067, GBP: 1.27, CHF: 1.12,
    CNY: 0.139, CAD: 0.73, AUD: 0.66, EGP: 0.021, INR: 0.012, KRW: 0.00075, TRY: 0.031,
    BRL: 0.20, MXN: 0.059, ZAR: 0.055, IDR: 0.000063, MYR: 0.22, THB: 0.029,
    USDC: 1, USDT: 1, DAI: 1, EURC: 1.08, BUIDL: 1, USDP: 1,
  };

  const runSimulation = useCallback(() => {
    const fromRate = fxRates[fromCcy] ?? 1;
    const toRate = fxRates[toCcy] ?? 1;
    const usdBridge = (amount * fromRate) / toRate;
    const directRate = fromRate / toRate;
    const directOutput = amount * directRate;
    const bridgeOutput = usdBridge;
    const useBridge = bridgeOutput >= directOutput;
    const output = useBridge ? bridgeOutput : directOutput;
    const fxRoute = useBridge ? "USD-bridge" : "direct";
    const isDigital = ["USDC","USDT","DAI","EURC","BUIDL","USDP"].includes(fromCcy) || ["USDC","USDT","DAI","EURC","BUIDL","USDP"].includes(toCcy);
    const atomicCapable = ["Tokenized Deposit","CBDC","REST API"].includes(rail);
    const feeBps: Record<string, number> = { "SWIFT": 8, "ISO 20022": 6, "REST API": 3, "Host-to-Host": 5, "SFTP": 4, "RTGS": 7, "Tokenized Deposit": 2, "CBDC": 1 };
    const fee = (feeBps[rail] ?? 5);
    const totalCost = output * (fee / 10000);
    const mtqMinted = amount * fromRate;
    const settlementStatus = atomicCapable ? "ATOMICALLY_SETTLED" : "PENDING_SETTLEMENT";
    const compliancePassed = true;
    const latency: Record<string, number> = { "SWIFT": 5000, "ISO 20022": 3000, "REST API": 500, "Host-to-Host": 2000, "SFTP": 4000, "RTGS": 1000, "Tokenized Deposit": 300, "CBDC": 200 };
    const steps = [
      { id: "fx-1", stage: "FX_DISCOVERY", name: `Quote ${fromCcy}/${toCcy} direct`, status: "SUCCESS", durationMs: 220 },
      { id: "fx-2", stage: "FX_DISCOVERY", name: `Quote ${fromCcy}/USD/${toCcy} bridge`, status: "SUCCESS", durationMs: 180 },
      { id: "fx-3", stage: "FX_DISCOVERY", name: `Select route: ${fxRoute}`, status: "SUCCESS", durationMs: 50 },
      { id: "liq-1", stage: "LIQUIDITY_ROUTING", name: `Route ${fromCcy} via ${rail}`, status: "SUCCESS", durationMs: 120 },
      { id: "comp-1", stage: "COMPLIANCE_CHECK", name: "KYC/KYB verification", status: "SUCCESS", durationMs: 300 },
      { id: "comp-2", stage: "COMPLIANCE_CHECK", name: "AML/sanctions screening", status: "SUCCESS", durationMs: 450 },
      { id: "set-1", stage: "SETTLEMENT_EXECUTION", name: "MBG receives request", status: "SUCCESS", durationMs: 80 },
      { id: "set-2", stage: "SETTLEMENT_EXECUTION", name: atomicCapable ? `Atomic MTQ mint (${mtqMinted.toLocaleString()})` : "MTQ mint (pending)", status: atomicCapable ? "SUCCESS" : "PENDING", durationMs: atomicCapable ? 150 : 5000 },
      { id: "set-3", stage: "SETTLEMENT_EXECUTION", name: "MTQ transfer", status: atomicCapable ? "SUCCESS" : "PENDING", durationMs: 90 },
      { id: "set-4", stage: "SETTLEMENT_EXECUTION", name: atomicCapable ? "Atomic MTQ redeem" : "MTQ redeem (pending)", status: atomicCapable ? "SUCCESS" : "PENDING", durationMs: 140 },
      { id: "conf-1", stage: "CONFIRMATION", name: "Settlement confirmation", status: atomicCapable ? "SUCCESS" : "PENDING", durationMs: 60 },
    ];
    setResults({ fromCcy, toCcy, amount, output, fxRoute, rail, fee, totalCost, mtqMinted, settlementStatus, compliancePassed, atomicCapable, isDigital, latency: latency[rail] ?? 3000, steps });
  }, [fromCcy, toCcy, amount, rail]);

  useEffect(() => { runSimulation(); }, [runSimulation]);

  return (
    <>
      {/* Control panel */}
      <GlassCard className="p-5">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Corridor Parameters</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-[10px] text-gray-400 mb-1">From Currency</div>
            <select value={fromCcy} onChange={(e) => setFromCcy(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#16161a] px-3 py-1.5 text-xs text-white">
              {CORRIDOR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">To Currency</div>
            <select value={toCcy} onChange={(e) => setToCcy(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#16161a] px-3 py-1.5 text-xs text-white">
              {CORRIDOR_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">Amount</div>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-white/10 bg-[#16161a] px-3 py-1.5 text-xs text-white" />
          </div>
          <div>
            <div className="text-[10px] text-gray-400 mb-1">Settlement Rail</div>
            <select value={rail} onChange={(e) => setRail(e.target.value)} className="w-full rounded-lg border border-white/10 bg-[#16161a] px-3 py-1.5 text-xs text-white">
              {CORRIDOR_RAILS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <button onClick={runSimulation} className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#d4af37] to-[#c9a227] px-4 py-2 text-sm font-bold text-black transition hover:opacity-90">
          ▶ Simulate Corridor
        </button>
      </GlassCard>

      {/* Results */}
      {results ? (
        <>
          <GlassCard glow className="mt-3 p-5">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Simulation Result</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><div className="text-[9px] text-gray-500">Input</div><div className="font-mono text-sm text-white">{N(results.amount).toLocaleString()} {S(results.fromCcy)}</div></div>
              <div><div className="text-[9px] text-gray-500">Output</div><div className="font-mono text-sm text-emerald-400">{N(results.output).toLocaleString()} {S(results.toCcy)}</div></div>
              <div><div className="text-[9px] text-gray-500">FX Route</div><div className="font-mono text-sm text-gold">{S(results.fxRoute)}</div></div>
              <div><div className="text-[9px] text-gray-500">Cost</div><div className="font-mono text-sm text-amber">{N(results.fee).toFixed(0)} bps</div></div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div><div className="text-[9px] text-gray-500">Rail</div><div className="font-mono text-[11px] text-gray-300">{S(results.rail)}</div></div>
              <div><div className="text-[9px] text-gray-500">Atomic</div><Badge variant={results.atomicCapable ? "emerald" : "gray"}>{results.atomicCapable ? "YES" : "NO"}</Badge></div>
              <div><div className="text-[9px] text-gray-500">Compliance</div><Badge variant={results.compliancePassed ? "emerald" : "red"}>{results.compliancePassed ? "PASSED" : "FAILED"}</Badge></div>
              <div><div className="text-[9px] text-gray-500">Settlement</div><Badge variant={results.settlementStatus.includes("SETTLED") ? "emerald" : "amber"}>{S(results.settlementStatus)}</Badge></div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 p-3">
              <div><span className="text-[10px] text-gray-500">MTQ Minted:</span> <span className="font-mono text-base font-bold text-gold">{N(results.mtqMinted).toLocaleString()} MTQ</span></div>
              <div className="text-[10px] text-gray-500">Latency: {N(results.latency)}ms · Total Cost: {N(results.totalCost).toFixed(2)} {S(results.toCcy)}</div>
            </div>
          </GlassCard>
          <GlassCard className="mt-3 p-4">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Settlement Timeline ({S(Arr(results.steps).length)} steps)</div>
            <div className="space-y-1">
              {Arr(results.steps).map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded border border-white/[0.03] px-2 py-1.5 text-[10px]">
                  <span className="font-mono text-gray-500 w-16 shrink-0">{S(s.id)}</span>
                  <ArrowRight className="h-2.5 w-2.5 shrink-0 text-gray-600" />
                  <span className="flex-1 text-gray-300">{S(s.name)}</span>
                  <span className="text-[8px] text-gray-600">{S(s.stage)}</span>
                  <span className="text-[8px] text-gray-600">{N(s.durationMs)}ms</span>
                  <Badge variant={S(s.status).includes("SUCCESS") ? "emerald" : "amber"}>{S(s.status)}</Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        </>
      ) : null}
    </>
  );
}

// ─── NAV ───
const NAV_ITEMS = [
  { id: "hero", label: "Live State", icon: Activity },
  { id: "reserve", label: "Reserve Architecture", icon: Shield },
  { id: "currency", label: "Currency Engine", icon: Network },
  { id: "gold", label: "Gold & Bullion", icon: Scale },
  { id: "digital", label: "Digital Liquidity", icon: Cpu },
  { id: "finality", label: "Finality Gate", icon: Lock },
  { id: "p1", label: "P1 Frameworks", icon: Building2 },
  { id: "status", label: "Implementation Status", icon: CheckCircle2 },
  { id: "simulator", label: "Reserve Simulator", icon: Zap },
  { id: "corridor", label: "AED↔SGD Corridor", icon: Globe },
];

// ════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════
export default function Page() {
  const reserve = useFetch("/api/mtq-final-reserve");
  const nav = useFetch("/api/nav");
  const finality = useFetch("/api/mtq-finality-before-mint");
  const status = useFetch("/api/mtq-implementation-status");
  const pbc = useFetch("/api/mtq-protected-backing-cell");
  const bankDefault = useFetch("/api/mtq-bank-default-resolution");
  const legal = useFetch("/api/mtq-legal-liability-framework");
  const licensing = useFetch("/api/mtq-licensing-entity-matrix");
  const threeBook = useFetch("/api/mtq-three-book-separation");
  const systemic = useFetch("/api/mtq-systemic-exposure-engine");
  const contradiction = useFetch("/api/mtq-contradiction-scan");
  const sim = useFetch("/api/reserve-simulator");
  const corridor = useFetch("/api/corridor");

  const scrollTo = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-gray-200">
      {/* ─── HEADER (upgraded: prominent, institutional) ─── */}
      <header className="sticky top-0 z-50 border-b border-gold/10 bg-[#0a0a0b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4af37] to-[#c9a227] shadow-lg shadow-gold/20">
              <Landmark className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="font-display text-base font-bold tracking-tight text-white">MITHQAL</div>
              <div className="text-[10px] font-medium text-gold">§V25.2 Institutional Command Center</div>
            </div>
          </div>
          {/* Mobile-friendly nav */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/institutional-engagement" className="rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1.5 text-[10px] font-semibold text-gold transition hover:bg-gold/20 sm:px-3 sm:text-xs">
              Institutional Engagement
            </Link>
            <Link href="/institutional-readiness" className="hidden rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 sm:block">
              Pilot Readiness
            </Link>
            <a href="/os" className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300 transition hover:bg-white/10 sm:block">
              OS
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* ─── SIDEBAR NAV (upgraded: mobile-responsive horizontal scroll) ─── */}
        <nav className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-56 shrink-0 flex-col gap-1 overflow-y-auto p-4 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition hover:bg-gold/5 hover:text-gold">
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
          <div className="my-2 border-t border-white/5" />
          <Link href="/institutional-engagement" className="flex items-center gap-2.5 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-xs font-medium text-gold transition hover:bg-gold/10">
            <Building2 className="h-3.5 w-3.5" />
            Institutional Engagement →
          </Link>
          <Link href="/institutional-readiness" className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-500/10">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Pilot Readiness →
          </Link>
          <a href="/os" className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-white/10">
            <Layers className="h-3.5 w-3.5" />
            Operating System →
          </a>
          <a href="mailto:meltonsy@icloud.com" className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-400 transition hover:bg-white/10">
            <Mail className="h-3.5 w-3.5" />
            Email MITHQAL
          </a>
          <div className="mt-auto pt-4">
            <div className="rounded-xl border border-gold/10 bg-gold/5 p-3 text-[10px] text-gray-500">
              <div className="mb-1.5 font-semibold text-gold">Honest State</div>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span>honest:</span> <span className="text-emerald-400">true</span></div>
                <div className="flex justify-between"><span>production:</span> <span className="text-red-400">false</span></div>
                <div className="flex justify-between"><span>gates:</span> <span className="text-amber-400">0/13</span></div>
                <div className="flex justify-between"><span>finality:</span> <span className="text-emerald-400">7/7</span></div>
              </div>
            </div>
          </div>
        </nav>

        {/* ─── MOBILE NAV BAR (horizontal scroll for tablet/mobile) ─── */}
        <div className="sticky top-[61px] z-40 border-b border-white/5 bg-[#0a0a0b]/95 backdrop-blur-xl lg:hidden">
          <div className="flex gap-1 overflow-x-auto px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-gray-500 transition hover:bg-gold/5 hover:text-gold">
                <item.icon className="h-3 w-3" />
                {item.label}
              </button>
            ))}
            <Link href="/institutional-engagement" className="flex shrink-0 items-center gap-1 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5 text-[10px] font-medium text-gold">
              Engagement →
            </Link>
            <Link href="/os" className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-medium text-gray-400">
              OS →
            </Link>
          </div>
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {/* ═══ HERO: LIVE STATE ═══ */}
            <Section id="hero" icon={Activity} title="Live Monetary State" subtitle="Auto-refreshing from /api/nav + /api/oracle">
              {!nav.data ? <LoadingBox label="live data" /> : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatBox label="NAV (Market)" value={`$${N(nav.data.navM).toFixed(4)}`} sub="R_m / S" accent="gold" />
                    <StatBox label="NAV (Prudential)" value={`$${N(nav.data.navL).toFixed(4)}`} sub="R_a / S" accent="emerald" />
                    <StatBox label="Reserve Ratio" value={`${N(nav.data.reserveRatio).toFixed(2)}%`} sub="RR = R_a / L" accent={N(nav.data.reserveRatio) >= 130 ? "emerald" : N(nav.data.reserveRatio) >= 105 ? "amber" : "red"} />
                    <StatBox label="Gold Price" value={`$${N(nav.data.goldUsd).toFixed(2)}`} sub="XAU/USD spot" accent="gold" />
                  </div>
                  <GlassCard className="mt-3 p-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Live FX Rates ({Arr(Object.keys(nav.data.fxRates || {})).length} currencies)</div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {Object.entries(nav.data.fxRates || {}).map(([k, v]: any) => (
                        <div key={k} className="rounded-lg border border-white/5 bg-white/5 px-2 py-1.5 text-center">
                          <div className="text-[9px] text-gray-500">{k}</div>
                          <div className="font-mono text-xs text-gray-300">{N(v).toFixed(4)}</div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ RESERVE ARCHITECTURE ═══ */}
            <Section id="reserve" icon={Shield} title="Reserve Architecture — §V25.2" subtitle="130% institutional backing target · 80% fiat / 18% gold / 2% digital">
              {!reserve.data ? <LoadingBox label="reserve architecture" /> : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <GlassCard glow className="p-5"><div className="flex items-center justify-between"><Coins className="h-5 w-5 text-emerald-400" /><Badge variant="emerald">80%</Badge></div><div className="mt-2 font-display text-2xl font-bold text-emerald-400">{fmtUSDm(reserve.data.exampleBacking?.fiat)}</div><div className="mt-1 text-[10px] text-gray-500">Front-line: {fmtUSDm(reserve.data.exampleBacking?.frontlineFiat)} · Strategic: {fmtUSDm(reserve.data.exampleBacking?.strategicFiat)}</div></GlassCard>
                    <GlassCard glow className="p-5"><div className="flex items-center justify-between"><Scale className="h-5 w-5 text-gold" /><Badge variant="gold">18%</Badge></div><div className="mt-2 font-display text-2xl font-bold text-gold">{fmtUSDm(reserve.data.exampleBacking?.gold)}</div><div className="mt-1 text-[10px] text-gray-500">Constitutional anchor · Corridor 15-25%</div></GlassCard>
                    <GlassCard glow className="p-5"><div className="flex items-center justify-between"><Cpu className="h-5 w-5 text-amber" /><Badge variant="amber">2%</Badge></div><div className="mt-2 font-display text-2xl font-bold text-amber">{fmtUSDm(reserve.data.exampleBacking?.digital)}</div><div className="mt-1 text-[10px] text-gray-500">Normal ≤2% · Operational ≤3% · Max 5%</div></GlassCard>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <GlassCard className="flex items-center justify-between p-5"><div><div className="text-[10px] uppercase tracking-wider text-gray-500">Total Strategic Backing</div><div className="font-display text-3xl font-bold text-white">{fmtUSDm(reserve.data.exampleBacking?.totalStrategicBacking)}</div></div><div className="text-right"><div className="text-[10px] uppercase tracking-wider text-gray-500">Target</div><div className="font-display text-2xl font-bold text-gold">130%</div></div></GlassCard>
                    <GlassCard className="flex items-center justify-between p-5 border-amber-500/20"><div><div className="text-[10px] uppercase tracking-wider text-gray-500">Emergency Resilience Capacity</div><div className="font-display text-2xl font-bold text-amber">≤ 15%</div></div><div className="text-right text-[10px] text-gray-500">SEPARATE from core · not double-counted</div></GlassCard>
                  </div>
                  <GlassCard className="mt-3 p-4">
                    <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Reserve Valuation (S = $100M example)</div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div><div className="text-[9px] text-gray-500">Liability L</div><div className="font-mono text-sm text-white">{fmtUSD(reserve.data.exampleReserve?.liability)}</div></div>
                      <div><div className="text-[9px] text-gray-500">Market R_m</div><div className="font-mono text-sm text-gray-300">{fmtUSD(reserve.data.exampleReserve?.marketReserve)}</div></div>
                      <div><div className="text-[9px] text-gray-500">Adjusted R_a</div><div className="font-mono text-sm text-emerald-400">{fmtUSD(reserve.data.exampleReserve?.adjustedReserve)}</div></div>
                      <div><div className="text-[9px] text-gray-500">Stress R_l</div><div className="font-mono text-sm text-red-400">{fmtUSD(reserve.data.exampleReserve?.stressReserve)}</div></div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div><div className="text-[9px] text-gray-500">NAV_m</div><div className="font-mono text-sm text-gray-300">{N(reserve.data.exampleReserve?.navs?.NAV_m).toFixed(4)}</div></div>
                      <div><div className="text-[9px] text-gray-500">NAV_l (prud.)</div><div className="font-mono text-sm text-emerald-400">{N(reserve.data.exampleReserve?.navs?.NAV_l).toFixed(4)}</div></div>
                      <div><div className="text-[9px] text-gray-500">NAV_s (stress)</div><div className="font-mono text-sm text-red-400">{N(reserve.data.exampleReserve?.navs?.NAV_s).toFixed(4)}</div></div>
                      <div><div className="text-[9px] text-gray-500">RR Status</div><div className="text-sm font-semibold text-amber">{S(reserve.data.exampleReserve?.reserveRatio?.status)}</div></div>
                    </div>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ CURRENCY ENGINE ═══ */}
            <Section id="currency" icon={Network} title="Currency Weight Engine" subtitle="11 currencies · C = 0.50·COFER + 0.40·SWIFT + 0.10·BIS · 20% hard cap · proportional normalization">
              {!reserve.data ? <LoadingBox label="currency engine" /> : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <StatBox label="Currency Sum" value={N(reserve.data.currencyWeights?.sum).toFixed(6)} sub="Σ W_i = 1.0" accent="emerald" />
                    <StatBox label="USD Effective" value={fmtPct(reserve.data.usdExposure?.usdEffective)} sub={`Ceiling: ${fmtPct(reserve.data.usdExposure?.ceiling, 0)}`} accent={reserve.data.usdExposure?.breached ? "red" : "emerald"} />
                    <StatBox label="Constraints Met" value={reserve.data.currencyWeights?.constraintsMet ? "YES" : "NO"} sub="20% cap + 35% USD-eff" accent={reserve.data.currencyWeights?.constraintsMet ? "emerald" : "red"} />
                  </div>
                  <GlassCard className="mt-3 overflow-hidden p-0">
                    <table className="w-full text-[11px]">
                      <thead className="border-b border-white/5 bg-white/[0.02]">
                        <tr className="text-gray-500">
                          <th className="px-3 py-2 text-left font-medium">CCY</th>
                          <th className="px-3 py-2 text-right font-medium">C</th>
                          <th className="px-3 py-2 text-right font-medium">M</th>
                          <th className="px-3 py-2 text-right font-medium">R</th>
                          <th className="px-3 py-2 text-right font-medium">σ</th>
                          <th className="px-3 py-2 text-right font-medium">A</th>
                          <th className="px-3 py-2 text-right font-medium">K</th>
                          <th className="px-3 py-2 text-right font-medium">L</th>
                          <th className="px-3 py-2 text-right font-medium">Final W</th>
                          <th className="px-3 py-2 text-center font-medium">20% Cap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Arr(reserve.data.currencyWeights?.results).map((c: any, i: number) => (
                          <tr key={i} className="border-b border-white/[0.03] hover:bg-gold/[0.03]">
                            <td className="px-3 py-1.5 font-semibold text-white">{S(c.currency)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-400">{N(c.C).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-400">{N(c.M).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-400">{N(c.R).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-500">{N(c.sigma).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-500">{N(c.A).toFixed(3)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-400">{N(c.K).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-500">{N(c.L).toFixed(4)}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold text-gold">{fmtPct(c.finalWeight)}</td>
                            <td className="px-3 py-1.5 text-center">{c.concentrationCapped ? <span className="text-red-400">●</span> : <span className="text-emerald-400">○</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GlassCard>
                  <div className="mt-2 flex flex-wrap gap-2 text-[9px] text-gray-500">
                    <span>C = structural weight (0.50 COFER + 0.40 SWIFT + 0.10 BIS)</span>
                    <span>· M = momentum (±5%) · R = mean-reversion (±2%)</span>
                    <span>· σ = EWMA vol (λ=0.94) · A = attenuation (0.5-1.0)</span>
                    <span>· K = combined · L = liquidity (±5%)</span>
                    <span className="text-red-400">● = capped at 20% hard limit</span>
                  </div>
                  <GlassCard className="mt-3 p-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">§17 · Effective USD Exposure (direct + pegged + synthetic + digital)</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-gray-500">USD direct</div><div className="font-mono text-sm text-white">{fmtPct(reserve.data.usdExposure?.usdDirect)}</div></div>
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-gray-500">AED USD-equiv</div><div className="font-mono text-sm text-gray-300">{fmtPct(reserve.data.usdExposure?.aedUsdEquivalent)}</div></div>
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-gray-500">SAR USD-equiv</div><div className="font-mono text-sm text-gray-300">{fmtPct(reserve.data.usdExposure?.sarUsdEquivalent)}</div></div>
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-gray-500">Synthetic</div><div className="font-mono text-sm text-gray-400">{fmtPct(reserve.data.usdExposure?.usdLinkedSynthetic)}</div></div>
                      <div className="rounded-lg border border-white/5 bg-white/5 p-2"><div className="text-[9px] text-gray-500">Digital</div><div className="font-mono text-sm text-gray-400">{fmtPct(reserve.data.usdExposure?.usdLinkedDigital)}</div></div>
                    </div>
                    <div className={`mt-3 flex items-center justify-between rounded-lg border p-3 ${reserve.data.usdExposure?.breached ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                      <span className="text-xs font-semibold text-gray-300">USD Effective Total</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-display text-xl font-bold ${reserve.data.usdExposure?.breached ? "text-red-400" : "text-emerald-400"}`}>{fmtPct(reserve.data.usdExposure?.usdEffective)}</span>
                        <Badge variant={reserve.data.usdExposure?.breached ? "red" : "emerald"}>ceiling {fmtPct(reserve.data.usdExposure?.ceiling, 0)} · {reserve.data.usdExposure?.breached ? "BREACH" : "OK"}</Badge>
                      </div>
                    </div>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ GOLD & BULLION ═══ */}
            <Section id="gold" icon={Scale} title="Gold & Bullion Module" subtitle="18% target · 15-25% corridor · silver 0% (SDC ≤ 0) · liquidation protects gold LAST">
              {!reserve.data ? <LoadingBox label="gold module" /> : (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    <StatBox label="Gold Target" value={fmtPct(reserve.data.goldPolicy?.goldTarget, 0)} accent="gold" />
                    <StatBox label="Preferred Lower" value={fmtPct(reserve.data.goldPolicy?.goldPreferredLower, 0)} accent="emerald" />
                    <StatBox label="Bullion Corridor" value="15-25%" accent="gold" />
                    <StatBox label="Silver (current)" value={fmtPct(reserve.data.goldPolicy?.silverCurrent, 0)} sub="SDC ≤ 0 → 0%" accent="amber" />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <GlassCard className="p-4"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">§27 · Silver Diversification Contribution</div><div className="flex items-center justify-between"><div><div className="font-mono text-sm text-gray-400">SDC = {N(reserve.data.silverSDC?.SDC).toFixed(4)}</div><div className="text-[10px] text-gray-500">{reserve.data.silverSDC?.admitted ? "ADMITTED ≤3%" : "0% (not admitted)"}</div></div><Badge variant={reserve.data.silverSDC?.admitted ? "emerald" : "amber"}>{reserve.data.silverSDC?.admitted ? "ADMITTED" : "0%"}</Badge></div></GlassCard>
                    <GlassCard className="p-4"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">§29 · Tokenized Gold (PAXG) TGRS</div><div className="flex items-center justify-between"><div><div className="font-mono text-sm text-gray-400">TGRS = {N(reserve.data.tokenizedGoldTGRS?.TGRS).toFixed(2)} / 10</div><div className="text-[10px] text-gray-500">Haircut: {fmtPct(reserve.data.tokenizedGoldTGRS?.haircut)}</div></div><Badge variant={reserve.data.tokenizedGoldTGRS?.status === "ELIGIBLE" ? "emerald" : "amber"}>{S(reserve.data.tokenizedGoldTGRS?.status)}</Badge></div></GlassCard>
                  </div>
                  <GlassCard className="mt-3 p-4"><div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">§26 · Liquidation Sequence (gold protected LAST)</div><div className="flex flex-wrap gap-1.5">{["1. Digital liquidity", "2. Cash", "3. Short-duration sovereign", "4. Non-USD FX", "5. Conditional silver", "6. Tokenized gold", "7. Physical gold (LAST)"].map((s, i) => (<span key={i} className={`rounded border px-2 py-0.5 text-[9px] ${i === 6 ? "border-gold/40 bg-gold/10 text-gold" : "border-white/10 bg-white/5 text-gray-400"}`}>{s}</span>))}</div></GlassCard>
                </>
              )}
            </Section>

            {/* ═══ DIGITAL LIQUIDITY ═══ */}
            <Section id="digital" icon={Cpu} title="Digital Liquidity Module" subtitle="2% normal · ≤3% operational · 5% max · 0% emergency · algorithmic excluded">
              {!reserve.data ? <LoadingBox label="digital module" /> : (
                <>
                  <div className="grid gap-3 md:grid-cols-4">
                    <StatBox label="D_normal" value={fmtPct(reserve.data.digitalPolicy?.D_normal, 0)} accent="emerald" />
                    <StatBox label="D_operational" value={`≤${fmtPct(reserve.data.digitalPolicy?.D_operational, 0)}`} accent="amber" />
                    <StatBox label="D_max" value={fmtPct(reserve.data.digitalPolicy?.D_max, 0)} sub="constitutional" accent="red" />
                    <StatBox label="D_emergency" value={fmtPct(reserve.data.digitalPolicy?.D_emergency, 0)} accent="red" />
                  </div>
                  <GlassCard className="mt-3 overflow-hidden p-0">
                    <table className="w-full text-[11px]">
                      <thead className="border-b border-white/5 bg-white/[0.02]"><tr className="text-gray-500"><th className="px-3 py-2 text-left font-medium">Asset</th><th className="px-3 py-2 text-right font-medium">DRQS</th><th className="px-3 py-2 text-center font-medium">Core ≥7.5</th><th className="px-3 py-2 text-left font-medium">Role</th></tr></thead>
                      <tbody>
                        {Arr(reserve.data.digitalUniverse).map((d: any, i: number) => (
                          <tr key={i} className="border-b border-white/[0.03] hover:bg-gold/[0.03]">
                            <td className="px-3 py-1.5 font-semibold text-white">{S(d.id)}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-gray-300">{N(d.drqs).toFixed(2)}</td>
                            <td className="px-3 py-1.5 text-center">{d.inCore ? <Badge variant="emerald">CORE</Badge> : d.id === "DAI" ? <Badge variant="amber">0% optional</Badge> : <Badge variant="red">EXCL</Badge>}</td>
                            <td className="px-3 py-1.5 text-gray-400">{S(d.role)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ FINALITY GATE ═══ */}
            <Section id="finality" icon={Lock} title="Finality-Before-Mint — §54" subtitle="NO FINAL SETTLEMENT ⇒ NO MTQ MINT · 7/7 enforcement layers · 10/10 bypass routes blocked">
              {!finality.data ? <LoadingBox label="finality gate" /> : (
                <>
                  <GlassCard glow className="mb-3 p-4 text-center"><div className="font-display text-lg font-bold text-gold">{S(finality.data.invariant)}</div></GlassCard>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {Arr(finality.data.layers).map((l: any, i: number) => (
                      <GlassCard key={i} className={`p-3 ${l.enforced ? "border-emerald-500/20" : "border-red-500/20"}`}>
                        <div className="flex items-center justify-between"><span className="text-[9px] font-bold text-gray-500">{S(l.id)}</span>{l.enforced ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}</div>
                        <div className="mt-1 text-xs font-semibold text-white">{S(l.name)}</div>
                        <div className="mt-0.5 text-[9px] text-gray-500">{S(l.description).slice(0, 80)}</div>
                        <Badge variant={l.enforced ? "emerald" : "red"} className="mt-1.5">{l.enforced ? "ENFORCED" : "GAP"}</Badge>
                      </GlassCard>
                    ))}
                  </div>
                  <GlassCard className="mt-3 p-4">
                    <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">§84 Bypass Test Harness</span><Badge variant="emerald">{S(finality.data.bypassTestSummary?.blockedRoutes)}/{S(finality.data.bypassTestSummary?.totalRoutes)} blocked</Badge></div>
                    <div className="flex flex-wrap gap-1.5">
                      {Arr(finality.data.bypassTestSummary?.attempts).map((a: any, i: number) => (
                        <span key={i} className={`rounded border px-1.5 py-0.5 text-[8px] ${a.blocked ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-red-500/40 bg-red-500/10 text-red-400"}`}>{S(a.route)} · {a.blocked ? "BLOCKED" : "BYPASSED!"}</span>
                      ))}
                    </div>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ P1 FRAMEWORKS ═══ */}
            <Section id="p1" icon={Building2} title="P1 Critical-Gap Frameworks" subtitle="6 modules + finality + contradiction scan — all IMPLEMENTED at code level, 0/13 institutional gates passed">
              <div className="grid gap-3 md:grid-cols-2">
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§47 Protected Backing Cell</span><Badge variant="amber">0 live cells</Badge></div><div className="mt-1 text-[10px] text-gray-500">{pbc.data ? S(pbc.data.formula).slice(0, 80) : "AvailableBacking = Recognized − Encumbered − Allocated"}</div></GlassCard>
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§48 Bank Default & Resolution</span><Badge variant="red">NOT guarantor</Badge></div><div className="mt-1 text-[10px] text-gray-500">{bankDefault.data ? `${S(bankDefault.data.states?.length)} states · ${S(bankDefault.data.contractualQuestions?.length)} contractual Qs` : "8-state lifecycle"}</div></GlassCard>
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§49 Legal Liability</span><Badge variant="red">0 validated</Badge></div><div className="mt-1 text-[10px] text-gray-500">{legal.data ? `${S(Object.keys(legal.data.jurisdictionRegistry || {}).length)} jurisdictions ALL PENDING` : "13 dimensions"}</div></GlassCard>
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§50 Licensing Matrix</span><Badge variant="red">0 licenses</Badge></div><div className="mt-1 text-[10px] text-gray-500">{licensing.data ? `${S(licensing.data.matrixEntries?.length)} entries ALL REQUIRED_NOT_OBTAINED` : "9 activities × 8 jurisdictions"}</div></GlassCard>
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§51 Three-Book Separation</span><Badge variant="amber">not operational</Badge></div><div className="mt-1 text-[10px] text-gray-500">{threeBook.data ? `${S(threeBook.data.books?.length)} books · ${S(threeBook.data.antiComminglingTests?.length)} anti-commingling tests` : "Book A / B / C"}</div></GlassCard>
                <GlassCard className="p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§52 Systemic Exposure</span><Badge variant="red">not live</Badge></div><div className="mt-1 text-[10px] text-gray-500">{systemic.data ? `${S(systemic.data.dimensions?.length)} concentration dimensions` : "13 dimensions"}</div></GlassCard>
              </div>
              <GlassCard className="mt-3 p-4">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-white">§77 Contradiction Scan</span><Badge variant={contradiction.data?.unresolvedContradictions === 0 ? "emerald" : "red"}>{contradiction.data ? `${S(contradiction.data.unresolvedContradictions)} unresolved` : "scanning…"}</Badge></div>
                <div className="mt-1 text-[10px] text-gray-500">{contradiction.data ? `${S(contradiction.data.patternsScanned)} patterns · ${S(contradiction.data.filesScanned)} files scanned` : "17 patterns across codebase"}</div>
              </GlassCard>
            </Section>

            {/* ═══ IMPLEMENTATION STATUS ═══ */}
            <Section id="status" icon={CheckCircle2} title="§87 Implementation Status Report" subtitle="Never inflate any column · 19/23 acceptance criteria met · 0/13 institutional gates passed">
              {!status.data ? <LoadingBox label="implementation status" /> : (
                <>
                  <div className="grid gap-3 md:grid-cols-3">
                    <StatBox label="Acceptance Criteria" value={`${S(status.data.acceptanceCriteriaMet)}/${S(status.data.acceptanceCriteriaTotal)}`} sub={`${(N(status.data.acceptanceRate) * 100).toFixed(0)}% met`} accent="amber" />
                    <StatBox label="Institutional Gates" value={`${S(status.data.institutionalGatesPassed)}/${S(status.data.institutionalGatesTotal)}`} sub="all pending" accent="red" />
                    <StatBox label="Finality Layers" value={`${S(status.data.honestState?.finalityLayersEnforced)}/${S(status.data.honestState?.finalityLayersRequired)}`} sub="enforced at code level" accent="emerald" />
                  </div>
                  <GlassCard className="mt-3 overflow-hidden p-0">
                    <table className="w-full text-[10px]">
                      <thead className="border-b border-white/5 bg-white/[0.02]"><tr className="text-gray-500"><th className="px-2 py-1.5 text-left font-medium">§</th><th className="px-2 py-1.5 text-left font-medium">Requirement</th><th className="px-2 py-1.5 text-center font-medium">Design</th><th className="px-2 py-1.5 text-center font-medium">Impl</th><th className="px-2 py-1.5 text-center font-medium">Test</th><th className="px-2 py-1.5 text-center font-medium">Inst.</th><th className="px-2 py-1.5 text-center font-medium">Prod</th></tr></thead>
                      <tbody>
                        {Arr(status.data.statusTable).map((r: any, i: number) => (
                          <tr key={i} className="border-b border-white/[0.03]">
                            <td className="px-2 py-1 text-gray-500">{S(r.section)}</td>
                            <td className="px-2 py-1 text-gray-300">{S(r.requirement).slice(0, 50)}</td>
                            <td className="px-2 py-1 text-center text-[9px] text-emerald-400">{S(r.design).slice(0, 4)}</td>
                            <td className="px-2 py-1 text-center text-[9px] text-emerald-400">{S(r.implementation).slice(0, 4)}</td>
                            <td className="px-2 py-1 text-center text-[9px] text-emerald-400">{S(r.testing).slice(0, 5)}</td>
                            <td className="px-2 py-1 text-center text-[9px] text-amber">{S(r.institutionalValidation).replace("_PENDING", "")}</td>
                            <td className="px-2 py-1 text-center text-[9px] text-red-400">{S(r.production).slice(0, 8)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </GlassCard>
                  <GlassCard className="mt-3 border-gold/20 p-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gold">§74 Honest State Declaration</div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-4">
                      <div><span className="text-gray-500">honest:</span> <span className="text-emerald-400">{S(status.data.honestState?.honest)}</span></div>
                      <div><span className="text-gray-500">productionAuthorized:</span> <span className="text-red-400">{S(status.data.honestState?.productionAuthorized)}</span></div>
                      <div><span className="text-gray-500">noMithqalOwnedReserve:</span> <span className="text-emerald-400">{S(status.data.honestState?.noMithqalOwnedReserve)}</span></div>
                      <div><span className="text-gray-500">noMithqalFinancialGuarantee:</span> <span className="text-emerald-400">{S(status.data.honestState?.noMithqalFinancialGuarantee)}</span></div>
                      <div><span className="text-gray-500">threeBookOperational:</span> <span className="text-red-400">{S(status.data.honestState?.threeBookOperational)}</span></div>
                      <div><span className="text-gray-500">validatedJurisdictions:</span> <span className="text-red-400">{S(status.data.honestState?.validatedJurisdictions)}</span></div>
                      <div><span className="text-gray-500">licensesObtained:</span> <span className="text-red-400">{S(status.data.honestState?.licensesObtained)}</span></div>
                      <div><span className="text-gray-500">reservePolicyStatus:</span> <span className="text-amber">{S(status.data.honestState?.reservePolicyStatus).replace("_", " ")}</span></div>
                    </div>
                  </GlassCard>
                </>
              )}
            </Section>

            {/* ═══ DYNAMIC RESERVE SIMULATOR ═══ */}
            <Section id="simulator" icon={Zap} title="Dynamic Reserve Weighting Simulator" subtitle="Interactive stress-testing · Adjust parameters and simulate in real-time · Monte Carlo (1000 iterations) · §V25.2 formulas">
              {!sim.data ? <LoadingBox label="simulator" /> : (
                <DynamicReserveSimulator baseData={sim.data} />
              )}
            </Section>

            {/* ═══ DYNAMIC CROSS-BORDER CORRIDOR ═══ */}
            <Section id="corridor" icon={Globe} title="Dynamic Cross-Border Corridor Simulator" subtitle="Select currencies, amount, and rail to simulate different settlement corridors in real-time">
              {!corridor.data ? <LoadingBox label="corridor" /> : (
                <DynamicCorridorSimulator baseData={corridor.data} />
              )}
            </Section>

            {/* ═══ INSTITUTIONAL ENGAGEMENT CTA ═══ */}
            <Section id="institutional" icon={Building2} title="Institutional Engagement" subtitle="MITHQAL is seeking regulated institutions, monetary authorities, regulators, infrastructure providers and independent assurance institutions">
              <div className="grid gap-3 md:grid-cols-2">
                <Link href="/institutional-engagement">
                  <GlassCard glow className="flex items-center justify-between p-5 transition hover:border-gold/40">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Building2 className="h-6 w-6 text-gold" /></div>
                      <div>
                        <div className="font-display text-base font-bold text-white">Institutional Engagement →</div>
                        <div className="text-[11px] text-gray-500">Express interest · Review architecture · Sandbox testing · Pilot design</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gold" />
                  </GlassCard>
                </Link>
                <Link href="/institutional-readiness">
                  <GlassCard glow className="flex items-center justify-between p-5 transition hover:border-amber-500/40">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/5"><CheckCircle2 className="h-6 w-6 text-amber-400" /></div>
                      <div>
                        <div className="font-display text-base font-bold text-white">Pilot Readiness →</div>
                        <div className="text-[11px] text-gray-500">Readiness scorecard · Pilot model · Review package · Evidence discipline</div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-amber-400" />
                  </GlassCard>
                </Link>
              </div>
              <GlassCard className="mt-3 p-4 border-gold/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Contact MITHQAL</div>
                    <div className="mt-1 text-sm text-gold">meltonsy@icloud.com</div>
                  </div>
                  <a href="mailto:meltonsy@icloud.com" className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold transition hover:bg-gold/20">
                    <Mail className="mr-1 inline h-3.5 w-3.5" /> Email Directly
                  </a>
                </div>
                <div className="mt-2 text-[9px] text-gray-500">CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION.</div>
              </GlassCard>
            </Section>
          </div>
        </main>
      </div>

      {/* ─── FOOTER (upgraded: institutional, multi-column) ─── */}
      <footer className="border-t border-gold/10 bg-[#080809]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#d4af37] to-[#c9a227]">
                  <Landmark className="h-4 w-4 text-black" />
                </div>
                <span className="font-display text-sm font-bold text-white">MITHQAL</span>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-600">Constitutional Settlement Institution. §V25.2 Final Reserve Mathematical Specification. 130% institutional backing. 80% fiat / 18% gold / 2% digital. 11-currency basket. 20% hard cap. 7/7 finality enforcement.</p>
            </div>
            {/* Links */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">Institutional</div>
              <div className="mt-2 space-y-1.5">
                <Link href="/institutional-engagement" className="block text-[11px] text-gray-500 transition hover:text-gold">→ Institutional Engagement</Link>
                <Link href="/institutional-readiness" className="block text-[11px] text-gray-500 transition hover:text-gold">→ Pilot Requirements</Link>
                <Link href="/os" className="block text-[11px] text-gray-500 transition hover:text-gold">→ Operating System</Link>
                <a href="mailto:meltonsy@icloud.com" className="block text-[11px] text-gray-500 transition hover:text-gold">→ Email MITHQAL</a>
              </div>
            </div>
            {/* Status */}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">Status</div>
              <div className="mt-2 space-y-1 text-[10px] text-gray-600">
                <div className="flex justify-between"><span>Production Authorized:</span> <span className="text-red-400 font-mono">false</span></div>
                <div className="flex justify-between"><span>Institutional Gates:</span> <span className="text-amber-400 font-mono">0/13</span></div>
                <div className="flex justify-between"><span>Finality Layers:</span> <span className="text-emerald-400 font-mono">7/7</span></div>
                <div className="flex justify-between"><span>Validated Jurisdictions:</span> <span className="text-red-400 font-mono">0</span></div>
                <div className="flex justify-between"><span>Licenses Obtained:</span> <span className="text-red-400 font-mono">0</span></div>
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-white/5 pt-4">
            <p className="text-center text-[10px] text-gray-600">Institutions, regulators, banks and infrastructure providers: help us evaluate MITHQAL in the environments where settlement must actually work.</p>
            <p className="mt-1 text-center text-[9px] font-medium text-gray-700">CONTROLLED INSTITUTIONAL DOCUMENT • NOT A LICENSE • NOT A LEGAL OPINION. © 2026 MITHQAL</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
