"use client";

/**
 * MTQ Operating System page (/os).
 *
 * NOTE (BUILD-1 remediation):
 *   The previous implementation polled five API endpoints that do not exist
 *   in the current build (`/api/mtq-os`, `/api/mtq-finality-before-mint`,
 *   `/api/reserve-simulator`, `/api/corridor`, `/api/tokenization` — all
 *   return 404, see dev.log). Each section therefore sat in a permanent
 *   "Loading…" state with a spinning RefreshCw icon, never resolving.
 *
 *   This version renders each section from static fallback fixtures so the
 *   page is honest about its DEMO state. The fixtures are deliberately
 *   schematic — they describe the *shape* of what the section will surface
 *   once the underlying pilot-phase APIs are wired up, not real production
 *   data. A `DEMO — data available in pilot phase` badge makes this
 *   unambiguous to a visitor.
 */

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Landmark, Layers, Network, Lock, ArrowRight, Cpu,
  RefreshCw, CheckCircle2, XCircle, Shield, Globe,
  Building2, Zap, Banknote,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Static fallback fixtures                                           */
/*  Schematic shape-of-data — not real production values. Every section */
/*  below is rendered from these fixtures so the page never sits in a    */
/*  broken "Loading…" state when the underlying APIs are absent.        */
/* ------------------------------------------------------------------ */

const ISSUANCE_STEPS = [
  { id: "BM-01", name: "Bank KYC" },
  { id: "BM-02", name: "Sanctions screen" },
  { id: "BM-03", name: "Reserve lock" },
  { id: "BM-04", name: "Oracle price" },
  { id: "BM-05", name: "Algorithm sign-off" },
  { id: "BM-06", name: "Mint authorization" },
  { id: "BM-07", name: "MTQ mint" },
  { id: "BM-08", name: "Ledger post" },
  { id: "BM-09", name: "Takaful contribution" },
  { id: "BM-10", name: "Settlement confirm" },
  { id: "BM-11", name: "Bank credit" },
  { id: "BM-12", name: "Reconciliation" },
  { id: "BM-13", name: "Evidence bundle" },
  { id: "BM-14", name: "Audit hash" },
  { id: "BM-15", name: "Finality seal" },
  { id: "BM-16", name: "Disclosure" },
];

const BANK_INTEGRATION_NODES = [
  { id: "BIN-01", domain: "BANK", name: "Core ledger adapter", description: "Reads bank authoritative balances; never writes back. Translation layer only — bank systems remain the source of truth." },
  { id: "BIN-02", domain: "BANK", name: "ISO 20022 gateway", description: "Parses pacs./camt. messages into MITHQAL canonical events. No transformation, only field mapping." },
  { id: "BIN-03", domain: "MITHQAL", name: "Algorithm engine", description: "Computes issuance authorization from oracle + reserve state. Stateless; outputs a signed verdict." },
  { id: "BIN-04", domain: "MITHQAL", name: "Mint coordinator", description: "Drives BM-06 → BM-10. Idempotent; replays are safe." },
  { id: "BIN-05", domain: "MITHQAL", name: "Takaful pool", description: "Mutual-contribution treasury; receives BM-09 contribution, pays out on exceptions." },
  { id: "BIN-06", domain: "CUSTODIAN", name: "Reserve custodian", description: "Holds the physical / allocated bullion backing MTQ. Audited quarterly." },
];

const ISO_20022_MESSAGES = [
  { messageId: "pacs.008", name: "FI to FI Customer Credit Transfer" },
  { messageId: "pacs.009", name: "FI to FI Customer Debit Transfer" },
  { messageId: "pacs.002", name: "FI to FI Payment Status Report" },
  { messageId: "camt.054", name: "Debit / Credit Notification" },
  { messageId: "camt.056", name: "FIToFI Payment Cancellation Request" },
  { messageId: "camt.029", name: "Resolution of Investigation" },
];

const FINALITY_LAYERS = [
  { id: "L1", name: "Bank settlement", description: "Bank-side debit posted & confirmed", enforced: true },
  { id: "L2", name: "Reserve lock", description: "Allocated bullion locked until redeem", enforced: true },
  { id: "L3", name: "Oracle attestation", description: "Price feed signed by multi-oracle", enforced: true },
  { id: "L4", name: "Algorithm verdict", description: "Issuance authorization signed", enforced: true },
  { id: "L5", name: "Ledger post", description: "Double-entry ledger committed", enforced: true },
  { id: "L6", name: "Takaful contribution", description: "Mutual-contribution treasury credited", enforced: true },
  { id: "L7", name: "Evidence seal", description: "Tamper-evident audit hash written", enforced: true },
];

const SIMULATOR_STATS = [
  { label: "Base RR", value: "130.00%", tone: "gold" as const },
  { label: "Base FSCR", value: "1.42×", tone: "emerald" as const },
  { label: "MC P(RR<100%)", value: "0.00%", tone: "red" as const },
  { label: "MC P(RR<130%)", value: "2.40%", tone: "amber" as const },
];

const CORRIDOR_CARDS = [
  { icon: Cpu, label: "FX", value: "AED→SGD · 4.42", tone: "gold" as const, badge: "FX" as const },
  { icon: Shield, label: "Compliance", value: "PASSED", tone: "emerald" as const, badge: "Compliance" as const },
  { icon: ArrowRight, label: "Settlement", value: "ATOMIC", tone: "amber" as const, badge: "Settlement" as const },
];

const TOKENIZED_ASSETS = [
  { name: "Allocated Gold (LBMA)", type: "Physical bullion · custodied", notionalValue: 1000000, riskWeight: 0.0 },
  { name: "Sovereign T-Bill (91d)", type: "Government security", notionalValue: 500000, riskWeight: 0.0 },
];

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

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
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="gold">§V25.3</Badge><Badge variant="emerald">7/7 Finality</Badge><Badge variant="amber">130% Target</Badge><Badge variant="red">0/13 Gates</Badge><Badge variant="gray">DEMO — data available in pilot phase</Badge></div>
          </motion.div>

          {/* ISSUANCE PIPELINE */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Layers className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§10 Issuance Pipeline</h2><p className="text-[11px] text-gray-500">16-step BM-01 → BM-16 · Bank requests, MITHQAL authorizes, Technical system executes</p></div></div>
            <GlassCard className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">16-step pipeline ({ISSUANCE_STEPS.length} steps)</span>
                <Badge variant="amber">DEMO</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ISSUANCE_STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-1 rounded-lg border border-gold/20 bg-gold/5 px-2.5 py-1.5 text-[10px] text-gold">
                    <span className="font-mono font-bold">{s.id}</span>
                    <span className="text-gray-300">{s.name}</span>
                    {i < ISSUANCE_STEPS.length - 1 && <ArrowRight className="ml-1 h-2.5 w-2.5 text-gray-600" />}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live pipeline telemetry is wired up once the bank-integration pilot activates.</p>
            </GlassCard>
          </section>

          {/* BANK INTEGRATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Building2 className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§11 Bank Integration Blueprint</h2><p className="text-[11px] text-gray-500">MBG: Translation, NOT transformation · Bank systems remain authoritative</p></div></div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {BANK_INTEGRATION_NODES.map((n) => (
                <GlassCard key={n.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-gray-500">{n.id}</span>
                    <Badge variant={n.domain === "MITHQAL" ? "gold" : n.domain === "BANK" ? "emerald" : "amber"}>{n.domain}</Badge>
                  </div>
                  <div className="mt-1 text-xs font-semibold text-white">{n.name}</div>
                  <div className="mt-1 text-[10px] text-gray-500">{n.description}</div>
                </GlassCard>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live bank-adapter status surfaces here once the MBG pilot activates.</p>
          </section>

          {/* ISO 20022 */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Network className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">ISO 20022 Compliance Layer</h2><p className="text-[11px] text-gray-500">Message catalog + field mappings</p></div></div>
            <GlassCard className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Message Catalog ({ISO_20022_MESSAGES.length} types)</div>
                <Badge variant="amber">DEMO</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {ISO_20022_MESSAGES.map((m) => (
                  <div key={m.messageId} className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5">
                    <div className="font-mono text-[10px] font-bold text-emerald-400">{m.messageId}</div>
                    <div className="text-[9px] text-gray-500">{m.name}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Full ISO 20022 message catalog surfaces here once the pilot activates.</p>
            </GlassCard>
          </section>

          {/* FINALITY */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Lock className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">§54 Finality Enforcement</h2><p className="text-[11px] text-gray-500">NO FINAL SETTLEMENT ⇒ NO MTQ MINT · 7/7 layers · 10/10 bypass blocked</p></div></div>
            <GlassCard glow className="mb-3 p-4 text-center">
              <div className="font-display text-lg font-bold text-gold">NO FINAL SETTLEMENT ⇒ NO MTQ MINT</div>
              <div className="mt-1 text-[10px] text-gray-500">7 layers enforced · 10 bypass paths blocked</div>
            </GlassCard>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {FINALITY_LAYERS.map((l) => (
                <GlassCard key={l.id} className={`p-3 ${l.enforced ? "border-emerald-500/20" : "border-red-500/20"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-gray-500">{l.id}</span>
                    {l.enforced ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-white">{l.name}</div>
                  <div className="mt-0.5 text-[9px] text-gray-500">{l.description}</div>
                  <Badge variant={l.enforced ? "emerald" : "red"} className="mt-1.5">{l.enforced ? "ENFORCED" : "GAP"}</Badge>
                </GlassCard>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live finality-gate status surfaces here once the §54 enforcement oracle is wired.</p>
          </section>

          {/* SIMULATOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Zap className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Reserve Weighting Simulator</h2><p className="text-[11px] text-gray-500">Monte Carlo (1000 iterations) · 5 preset shocks</p></div></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {SIMULATOR_STATS.map((s) => {
                const tone = s.tone;
                const cls = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald-400" : tone === "amber" ? "text-amber" : "text-red-400";
                return (
                  <GlassCard key={s.label} className="p-4">
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                    <div className={`mt-1 font-display text-xl font-bold ${cls}`}>{s.value}</div>
                  </GlassCard>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live Monte Carlo results surface here once the reserve-simulator pilot activates.</p>
          </section>

          {/* CORRIDOR */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Globe className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Cross-Border Corridor — AED ↔ SGD</h2><p className="text-[11px] text-gray-500">FX discovery · compliance · atomic settlement</p></div></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {CORRIDOR_CARDS.map((c) => {
                const Icon = c.icon;
                const tone = c.tone;
                const cls = tone === "gold" ? "text-gold" : tone === "emerald" ? "text-emerald-400" : "text-amber";
                return (
                  <GlassCard glow key={c.label} className="p-4">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${cls}`} />
                      <Badge variant={tone === "gold" ? "gold" : tone === "emerald" ? "emerald" : "amber"}>{c.badge}</Badge>
                    </div>
                    <div className={`mt-2 font-mono text-lg ${cls}`}>{c.value}</div>
                    <div className="text-[9px] text-gray-500">{c.label}</div>
                  </GlassCard>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live corridor run telemetry surfaces here once the AED↔SGD pilot activates.</p>
          </section>

          {/* TOKENIZATION */}
          <section>
            <div className="mb-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/5"><Banknote className="h-5 w-5 text-gold" /></div><div><h2 className="font-display text-xl font-bold text-white">Asset & Coin Tokenization</h2><p className="text-[11px] text-gray-500">RWA + Digitized Coin · NOT stablecoins</p></div></div>
            <div className="grid gap-3 md:grid-cols-2">
              {TOKENIZED_ASSETS.map((a) => (
                <GlassCard key={a.name} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-white">{a.name}</div>
                      <div className="text-[9px] text-gray-500">{a.type}</div>
                    </div>
                    <Badge variant="gold">RWA</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                    <div><span className="text-gray-500">Notional:</span> <span className="font-mono text-white">${a.notionalValue.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Risk Weight:</span> <span className="font-mono text-amber">{(a.riskWeight * 100).toFixed(0)}%</span></div>
                  </div>
                </GlassCard>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-gray-500">DEMO — data available in pilot phase. Live RWA reference assets surface here once the tokenization pilot activates.</p>
          </section>

          {/* Static reminder banner */}
          <section>
            <GlassCard glow className="flex items-center gap-3 p-4">
              <RefreshCw className="h-4 w-4 shrink-0 text-gold" />
              <div className="text-xs text-gray-400">
                All sections above render from static fallback fixtures. The five underlying APIs
                (<code className="font-mono text-gold">/api/mtq-os</code>,{" "}
                <code className="font-mono text-gold">/api/mtq-finality-before-mint</code>,{" "}
                <code className="font-mono text-gold">/api/reserve-simulator</code>,{" "}
                <code className="font-mono text-gold">/api/corridor</code>,{" "}
                <code className="font-mono text-gold">/api/tokenization</code>) are not wired up in
                the current build. DEMO — data available in pilot phase.
              </div>
            </GlassCard>
          </section>
        </div>
      </main>

      <footer className="mt-auto border-t border-white/5 bg-[#0a0a0b]"><div className="mx-auto max-w-7xl px-4 py-4 text-center"><p className="text-[10px] text-gray-500">MITHQAL §V25.3 Operating System · SIMULATED · NOT PRODUCTION-AUTHORIZED · 7/7 finality · 0/13 gates</p></div></footer>
    </div>
  );
}
