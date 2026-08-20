"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Landmark, Layers, Network, Lock, ArrowRight, Cpu,
  RefreshCw, CheckCircle2, XCircle, Shield, Globe,
  Building2, Zap, Banknote,
} from "lucide-react";
import { useEffect, useState } from "react";

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

function useFetch<T = any>(url: string) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let c = false;
    const go = (a = 0) => {
      fetch(url).then(r => r.json()).then(j => { if (!c) setData(j); }).catch(() => { if (!c && a < 3) setTimeout(() => go(a + 1), 1200 * (a + 1)); });
    };
    go();
    return () => { c = true; };
  }, [url]);
  return { data };
}

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

export default function OSPage() {
  const mtqos = useFetch("/api/mtq-os");
  const finality = useFetch("/api/mtq-finality-before-mint");
  const sim = useFetch("/api/reserve-simulator");
  const corridor = useFetch("/api/corridor");
  const token = useFetch("/api/tokenization");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-soft"><Landmark className="h-4 w-4 text-black" /></div>
            <div><div className="font-display text-sm font-bold text-white">MITHQAL OS</div><div className="text-[9px] text-gray-500">§V25.2 Operating System</div></div>
          </Link>
          <div className="flex items-center gap-2"><Badge variant="amber">SIMULATED</Badge><Link href="/"><Badge variant="gray">← Dashboard</Badge></Link></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-3xl font-bold text-white">MTQ Operating System</h1>
            <p className="mt-2 text-sm text-gray-500">Complete institutional operating layer — bank integration, issuance pipeline, reserve simulation, cross-border corridor, and tokenization</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="gold">§V25.2</Badge><Badge variant="emerald">7/7 Finality</Badge><Badge variant="amber">130% Target</Badge><Badge variant="red">0/13 Gates</Badge></div>
          </motion.div>

          {/* ISSUANCE PIPELINE */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Layers className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§10 Issuance Pipeline</h2><p className="text-[11px] text-gray-500">16-step BM-01 → BM-16 · Bank requests, MITHQAL authorizes, Technical system executes</p></div></div>
            {!mtqos.data ? <GlassCard className="flex items-center gap-2 p-4"><RefreshCw className="h-4 w-4 animate-spin text-gold" /><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <GlassCard className="p-5"><div className="flex flex-wrap gap-1.5">
                {Arr(mtqos.data.issuanceSteps).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-1 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5 text-[10px] text-gold"><span className="font-mono font-bold">{S(s.id)}</span><span className="text-gray-300">{S(s.name)}</span>{i < Arr(mtqos.data.issuanceSteps).length - 1 && <ArrowRight className="ml-1 h-2.5 w-2.5 text-gray-600" />}</div>
                ))}
              </div></GlassCard>
            )}
          </section>

          {/* BANK INTEGRATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Building2 className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§11 Bank Integration Blueprint</h2><p className="text-[11px] text-gray-500">MBG: Translation, NOT transformation · Bank systems remain authoritative</p></div></div>
            {!mtqos.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {Arr(mtqos.data.bankIntegrationNodes).map((n: any, i: number) => (
                  <GlassCard key={i} className="p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold text-gray-500">{S(n.id)}</span><Badge variant={S(n.domain).includes("MITHQAL") ? "gold" : S(n.domain).includes("BANK") ? "emerald" : "amber"}>{S(n.domain)}</Badge></div><div className="mt-1 text-xs font-semibold text-white">{S(n.name)}</div><div className="mt-1 text-[10px] text-gray-500">{S(n.description).slice(0, 100)}</div></GlassCard>
                ))}
              </div>
            )}
          </section>

          {/* ISO 20022 */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Network className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">ISO 20022 Compliance Layer</h2><p className="text-[11px] text-gray-500">Message catalog + field mappings</p></div></div>
            {!mtqos.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <GlassCard className="p-4"><div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Message Catalog ({S(Arr(mtqos.data.iso20022MessageCatalog).length)} types)</div><div className="flex flex-wrap gap-2">
                {Arr(mtqos.data.iso20022MessageCatalog).map((m: any, i: number) => (
                  <div key={i} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5"><div className="font-mono text-[10px] font-bold text-emerald-400">{S(m.messageId || m.id)}</div><div className="text-[9px] text-gray-500">{S(m.name).slice(0, 40)}</div></div>
                ))}
              </div></GlassCard>
            )}
          </section>

          {/* FINALITY */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Lock className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§54 Finality Enforcement</h2><p className="text-[11px] text-gray-500">NO FINAL SETTLEMENT ⇒ NO MTQ MINT · 7/7 layers · 10/10 bypass blocked</p></div></div>
            {!finality.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <><GlassCard glow className="mb-3 p-4 text-center"><div className="font-display text-lg font-bold text-gold">{S(finality.data.invariant)}</div></GlassCard>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {Arr(finality.data.layers).map((l: any, i: number) => (
                  <GlassCard key={i} className={`p-3 ${l.enforced ? "border-emerald-500/20" : "border-red-500/20"}`}><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-gray-500">{S(l.id)}</span>{l.enforced ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}</div><div className="mt-1 text-xs font-semibold text-white">{S(l.name)}</div><div className="mt-0.5 text-[9px] text-gray-500">{S(l.description).slice(0, 70)}</div><Badge variant={l.enforced ? "emerald" : "red"} className="mt-1.5">{l.enforced ? "ENFORCED" : "GAP"}</Badge></GlassCard>
                ))}
              </div></>
            )}
          </section>

          {/* SIMULATOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Zap className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Reserve Weighting Simulator</h2><p className="text-[11px] text-gray-500">Monte Carlo (1000 iterations) · 5 preset shocks</p></div></div>
            {!sim.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <GlassCard className="p-4"><div className="text-[10px] text-gray-500">Base RR</div><div className="mt-1 font-display text-xl font-bold text-gold">{(N(sim.data.baseSimulation?.RR) * 100).toFixed(2)}%</div></GlassCard>
                <GlassCard className="p-4"><div className="text-[10px] text-gray-500">Base FSCR</div><div className="mt-1 font-display text-xl font-bold text-emerald-400">{(N(sim.data.baseSimulation?.FSCR) * 100).toFixed(2)}%</div></GlassCard>
                <GlassCard className="p-4"><div className="text-[10px] text-gray-500">MC P(RR&lt;100%)</div><div className="mt-1 font-display text-xl font-bold text-red-400">{(N(sim.data.monteCarlo?.probRRBelow100) * 100).toFixed(2)}%</div></GlassCard>
                <GlassCard className="p-4"><div className="text-[10px] text-gray-500">MC P(RR&lt;130%)</div><div className="mt-1 font-display text-xl font-bold text-amber">{(N(sim.data.monteCarlo?.probRRBelow130) * 100).toFixed(2)}%</div></GlassCard>
              </div>
            )}
          </section>

          {/* CORRIDOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Globe className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Cross-Border Corridor — AED ↔ SGD</h2><p className="text-[11px] text-gray-500">FX discovery · compliance · atomic settlement</p></div></div>
            {!corridor.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <GlassCard glow className="p-4"><div className="flex items-center justify-between"><Cpu className="h-4 w-4 text-gold" /><Badge variant="gold">FX</Badge></div><div className="mt-2 font-mono text-lg text-gold">{S(corridor.data.sampleRunSummary?.fxRoute)}</div></GlassCard>
                <GlassCard glow className="p-4"><div className="flex items-center justify-between"><Shield className="h-4 w-4 text-emerald-400" /><Badge variant="emerald">Compliance</Badge></div><div className="mt-2 font-mono text-lg text-emerald-400">{corridor.data.sampleRunSummary?.compliancePassed ? "PASSED" : "FAILED"}</div></GlassCard>
                <GlassCard glow className="p-4"><div className="flex items-center justify-between"><ArrowRight className="h-4 w-4 text-amber" /><Badge variant="amber">Settlement</Badge></div><div className="mt-2 font-mono text-lg text-amber">{S(corridor.data.sampleRunSummary?.settlementStatus)}</div></GlassCard>
              </div>
            )}
          </section>

          {/* TOKENIZATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Banknote className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Asset & Coin Tokenization</h2><p className="text-[11px] text-gray-500">RWA + Digitized Coin · NOT stablecoins</p></div></div>
            {!token.data ? <GlassCard className="p-4"><span className="text-xs text-gray-400">Loading…</span></GlassCard> : (
              <div className="grid gap-3 md:grid-cols-2">
                {Arr(token.data.referenceRWAAssets).map((a: any, i: number) => (
                  <GlassCard key={i} className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-white">{S(a.name)}</div><div className="text-[9px] text-gray-500">{S(a.type)}</div></div><Badge variant="gold">RWA</Badge></div><div className="mt-2 grid grid-cols-2 gap-2 text-[9px]"><div><span className="text-gray-500">Notional:</span> <span className="font-mono text-white">${N(a.notionalValue).toLocaleString()}</span></div><div><span className="text-gray-500">Risk Weight:</span> <span className="font-mono text-amber">{(N(a.riskWeight) * 100).toFixed(0)}%</span></div></div></GlassCard>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-[#0a0a0b]"><div className="mx-auto max-w-7xl px-4 py-4 text-center"><p className="text-[10px] text-gray-500">MITHQAL §V25.2 Operating System · SIMULATED · NOT PRODUCTION-AUTHORIZED · 7/7 finality · 0/13 gates</p></div></footer>
    </div>
  );
}
