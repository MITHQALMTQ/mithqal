"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Landmark, Layers, Network, Lock, ArrowRight,
  CheckCircle2, XCircle, Shield, Globe,
  Building2, Zap, Banknote,
} from "lucide-react";

// Static fallback fixtures (the 5 API endpoints are not wired in this build)
const ISSUANCE_STEPS = [
  { id: "BM-01", name: "Bank Request" }, { id: "BM-02", name: "KYC/KYB" },
  { id: "BM-03", name: "Compliance Screen" }, { id: "BM-04", name: "Limit Check" },
  { id: "BM-05", name: "FX Quote" }, { id: "BM-06", name: "Corridor Select" },
  { id: "BM-07", name: "Reserve Lock" }, { id: "BM-08", name: "MITHQAL Authorize" },
  { id: "BM-09", name: "Mint Request" }, { id: "BM-10", name: "Finality 7/7" },
  { id: "BM-11", name: "Atomic Mint" }, { id: "BM-12", name: "MTQ Transfer" },
  { id: "BM-13", name: "Atomic Redeem" }, { id: "BM-14", name: "Settlement Conf" },
  { id: "BM-15", name: "Evidence Bundle" }, { id: "BM-16", name: "Close" },
];
const BANK_NODES = [
  { id: "BN-01", name: "Core Ledger Adapter", domain: "BANK", description: "Reads bank core ledger entries and normalizes to ISO 20022 pacs.008" },
  { id: "BN-02", name: "SWIFT gpi Tracker", domain: "BANK", description: "Polls SWIFT gpi tracker for cross-border status updates" },
  { id: "BN-03", name: "Compliance Gateway", domain: "BANK", description: "Sanctions/AML screening with maker-checker workflow" },
  { id: "BN-04", name: "MBG Translation Layer", domain: "MITHQAL", description: "Translates bank instructions to MITHQAL canonical format (NOT transformation)" },
  { id: "BN-05", name: "Reserve Lock Service", domain: "MITHQAL", description: "Locks the 130% reserve backing for the duration of the transaction" },
  { id: "BN-06", name: "Finality Engine", domain: "MITHQAL", description: "Enforces 7-layer finality-before-mint invariant" },
  { id: "BN-07", name: "Settlement Coordinator", domain: "MITHQAL", description: "Coordinates atomic mint+transfer+redeem with rollback" },
  { id: "BN-08", name: "Evidence Recorder", domain: "MITHQAL", description: "Signs and stores tamper-evident evidence bundles" },
  { id: "BN-09", name: "Treasury Connector", domain: "BANK", description: "Reconciles with bank treasury for Nostro/Vostro positions" },
];
const ISO_MESSAGES = [
  { id: "pacs.008", name: "FIToFICustomerCreditTransfer" },
  { id: "pacs.009", name: "FIToFICustomerDebitTransfer" },
  { id: "pacs.002", name: "FIToFIPaymentStatusReport" },
  { id: "camt.053", name: "BankToCustomerStatement" },
  { id: "camt.054", name: "DebitCreditNotification" },
  { id: "head.001", name: "BusinessApplicationHeader" },
];
const FINALITY_LAYERS = [
  { id: "L1", name: "Source Authentication", description: "Bank core ledger signature verified", enforced: true },
  { id: "L2", name: "Compliance Pass", description: "Sanctions + AML + KYC all green", enforced: true },
  { id: "L3", name: "Reserve Lock", description: "130% backing locked for tx duration", enforced: true },
  { id: "L4", name: "Corridor Authorization", description: "FX route + rail selected and authorized", enforced: true },
  { id: "L5", name: "Atomic Mint", description: "Mint + transfer + redeem in single atomic op", enforced: true },
  { id: "L6", name: "Settlement Confirmation", description: "Counterparty confirmation received", enforced: true },
  { id: "L7", name: "Evidence Bundle Signed", description: "Tamper-evident bundle stored + signed", enforced: true },
];
const SIM_STATS = [
  { label: "Base RR", value: "130.00%", color: "text-gold" },
  { label: "Base FSCR", value: "118.50%", color: "text-emerald-400" },
  { label: "MC P(RR<100%)", value: "0.30%", color: "text-red-400" },
  { label: "MC P(RR<130%)", value: "12.40%", color: "text-amber-400" },
];
const CORRIDOR_CARDS = [
  { icon: "Cpu", label: "FX", value: "AED→USD→SGD", color: "text-gold" },
  { icon: "Shield", label: "Compliance", value: "PASSED", color: "text-emerald-400" },
  { icon: "ArrowRight", label: "Settlement", value: "ATOMIC", color: "text-amber-400" },
];
const TOKENIZED_ASSETS = [
  { name: "US Treasury Bill 3M", type: "Government Bond", notional: 5000000, riskWeight: 0.05 },
  { name: "Gold Alloc. (LBMA)", type: "Bullion", notional: 2100000, riskWeight: 0.00 },
  { name: "SGS 6M Bill", type: "Sovereign", notional: 1200000, riskWeight: 0.05 },
  { name: "UAE Bond 1Y", type: "Sovereign", type2: "UAE", notional: 800000, riskWeight: 0.10 },
];

function GlassCard({ children, className = "", glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return <div className={`${glow ? "glass-gold" : "glass"} rounded-2xl ${className}`}>{children}</div>;
}
function Badge({ children, variant = "gray", className = "" }: { children: React.ReactNode; variant?: "emerald" | "amber" | "red" | "gold" | "gray"; className?: string }) {
  const colors: Record<string, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    red: "border-red-500/30 bg-red-500/10 text-red-400",
    gold: "border-gold/30 bg-gold/10 text-gold",
    gray: "border-white/10 bg-white/5 text-gray-400",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[variant]} ${className}`}>{children}</span>;
}

export default function OSPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0b] text-gray-200">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold to-gold-soft"><Landmark className="h-4 w-4 text-black" /></div>
            <div><div className="font-display text-sm font-bold text-white">MITHQAL OS</div><div className="text-[9px] text-gray-500">§V25.3 Operating System</div></div>
          </Link>
          <div className="flex items-center gap-2"><Badge variant="amber">SIMULATED</Badge><Link href="/"><Badge variant="gray">← Dashboard</Badge></Link></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="font-display text-3xl font-bold text-white">MTQ Operating System</h1>
            <p className="mt-2 text-sm text-gray-500">Complete institutional operating layer — bank integration, issuance pipeline, reserve simulation, cross-border corridor, and tokenization</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="gold">§V25.3</Badge><Badge variant="emerald">7/7 Finality</Badge><Badge variant="amber">130% Target</Badge><Badge variant="red">0/13 Gates</Badge></div>
          </motion.div>

          {/* ISSUANCE PIPELINE */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Layers className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§10 Issuance Pipeline</h2><p className="text-[11px] text-gray-500">16-step BM-01 → BM-16 · Bank requests, MITHQAL authorizes, Technical system executes</p></div></div>
            <GlassCard className="p-5"><div className="flex flex-wrap gap-1.5">
              {ISSUANCE_STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5 text-[10px] text-gold"><span className="font-mono font-bold">{s.id}</span><span className="text-gray-300">{s.name}</span>{i < ISSUANCE_STEPS.length - 1 && <ArrowRight className="ml-1 h-2.5 w-2.5 text-gray-600" />}</div>
              ))}
            </div>
            <div className="mt-3 text-[10px] text-amber-400">DEMO — data available in pilot phase</div>
            </GlassCard>
          </section>

          {/* BANK INTEGRATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Building2 className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§11 Bank Integration Blueprint</h2><p className="text-[11px] text-gray-500">MBG: Translation, NOT transformation · Bank systems remain authoritative</p></div></div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {BANK_NODES.map((n) => (
                <GlassCard key={n.id} className="p-4"><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-bold text-gray-500">{n.id}</span><Badge variant={n.domain.includes("MITHQAL") ? "gold" : n.domain.includes("BANK") ? "emerald" : "amber"}>{n.domain}</Badge></div><div className="mt-1 text-xs font-semibold text-white">{n.name}</div><div className="mt-1 text-[10px] text-gray-500">{n.description}</div></GlassCard>
              ))}
            </div>
          </section>

          {/* ISO 20022 */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Network className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">ISO 20022 Compliance Layer</h2><p className="text-[11px] text-gray-500">Message catalog + field mappings</p></div></div>
            <GlassCard className="p-4"><div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Message Catalog ({ISO_MESSAGES.length} types)</div><div className="flex flex-wrap gap-2">
              {ISO_MESSAGES.map((m) => (
                <div key={m.id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5"><div className="font-mono text-[10px] font-bold text-emerald-400">{m.id}</div><div className="text-[9px] text-gray-500">{m.name}</div></div>
              ))}
            </div></GlassCard>
          </section>

          {/* FINALITY */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Lock className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§54 Finality Enforcement</h2><p className="text-[11px] text-gray-500">NO FINAL SETTLEMENT ⇒ NO MTQ MINT · 7/7 layers · 10/10 bypass blocked</p></div></div>
            <GlassCard glow className="mb-3 p-4 text-center"><div className="font-display text-lg font-bold text-gold">NO FINAL SETTLEMENT ⇒ NO MTQ MINT</div></GlassCard>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {FINALITY_LAYERS.map((l) => (
                <GlassCard key={l.id} className={`p-3 ${l.enforced ? "border-emerald-500/20" : "border-red-500/20"}`}><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-gray-500">{l.id}</span>{l.enforced ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}</div><div className="mt-1 text-xs font-semibold text-white">{l.name}</div><div className="mt-0.5 text-[9px] text-gray-500">{l.description}</div><Badge variant={l.enforced ? "emerald" : "red"} className="mt-1.5">{l.enforced ? "ENFORCED" : "GAP"}</Badge></GlassCard>
              ))}
            </div>
          </section>

          {/* SIMULATOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Zap className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Reserve Weighting Simulator</h2><p className="text-[11px] text-gray-500">Monte Carlo (1000 iterations) · 5 preset shocks</p></div></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIM_STATS.map((s) => (
                <GlassCard key={s.label} className="p-4"><div className="text-[10px] text-gray-500">{s.label}</div><div className={`mt-1 font-display text-xl font-bold ${s.color}`}>{s.value}</div></GlassCard>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-amber-400">DEMO — data available in pilot phase</div>
          </section>

          {/* CORRIDOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Globe className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Cross-Border Corridor — AED ↔ SGD</h2><p className="text-[11px] text-gray-500">FX discovery · compliance · atomic settlement</p></div></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CORRIDOR_CARDS.map((c) => (
                <GlassCard key={c.label} glow className="p-4"><div className="flex items-center justify-between"><Zap className="h-4 w-4 text-gold" /><Badge variant={c.label === "FX" ? "gold" : c.label === "Compliance" ? "emerald" : "amber"}>{c.label}</Badge></div><div className={`mt-2 font-mono text-lg ${c.color}`}>{c.value}</div></GlassCard>
              ))}
            </div>
          </section>

          {/* TOKENIZATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Banknote className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Asset & Coin Tokenization</h2><p className="text-[11px] text-gray-500">RWA + Digitized Coin · NOT stablecoins</p></div></div>
            <div className="grid gap-3 md:grid-cols-2">
              {TOKENIZED_ASSETS.map((a) => (
                <GlassCard key={a.name} className="p-4"><div className="flex items-center justify-between"><div><div className="text-xs font-semibold text-white">{a.name}</div><div className="text-[9px] text-gray-500">{a.type}</div></div><Badge variant="gold">RWA</Badge></div><div className="mt-2 grid grid-cols-2 gap-2 text-[9px]"><div><span className="text-gray-500">Notional:</span> <span className="font-mono text-white">${a.notional.toLocaleString()}</span></div><div><span className="text-gray-500">Risk Weight:</span> <span className="font-mono text-amber-400">{(a.riskWeight * 100).toFixed(0)}%</span></div></div></GlassCard>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 bg-[#0a0a0b]"><div className="mx-auto max-w-7xl px-4 py-4 text-center"><p className="text-[10px] text-gray-500">MITHQAL §V25.3 Operating System · SIMULATED · NOT PRODUCTION-AUTHORIZED · 7/7 finality · 0/13 gates</p></div></footer>
    </div>
  );
}
