"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, FileCheck, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-4 py-1 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Financial-Operations Assurance Platform</span>
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">MITHQAL <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Assurance</span></h1>
        <p className="mb-10 max-w-2xl text-lg text-slate-300">An independent financial-operations assurance platform that helps institutions validate payment data, resolve operational exceptions, and produce reproducible evidence across authorized systems.</p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-8 py-3 text-sm font-semibold text-[#07090e] shadow-lg transition-transform hover:scale-105">Enter Dashboard →</Link>
          <Link href="/mtq-sigma" className="rounded-full border-2 border-amber-400 bg-black/30 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-amber-500/20">MTQ Σ Research</Link>
        </div>
      </section>
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">What MITHQAL Assurance Does</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-8"><FileCheck className="mb-4 h-8 w-8 text-amber-400" /><h3 className="mb-2 text-lg font-semibold">Controlled Ingestion</h3><p className="text-sm text-slate-400">Validate payment records against versioned rules. Distinguish hard failures, warnings, missing dependencies, source conflicts, and anomalies.</p></div>
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-8"><ShieldCheck className="mb-4 h-8 w-8 text-amber-400" /><h3 className="mb-2 text-lg font-semibold">Evidence & Replay</h3><p className="text-sm text-slate-400">Record evidence bundles with full provenance. Reconstruct historical decisions using exact rule versions. Reproducible audit trails.</p></div>
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-8"><AlertTriangle className="mb-4 h-8 w-8 text-amber-400" /><h3 className="mb-2 text-lg font-semibold">Exception Resolution</h3><p className="text-sm text-slate-400">Explainable exceptions with maker-checker corrections. Safe halt and recovery. All synthetic data labeled DEMO DATA.</p></div>
          </div>
        </div>
      </section>
      <section className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-6 py-2 mb-6">
            <span className="text-sm font-mono text-red-300">PRODUCTION AUTHORIZED = FALSE</span><span className="text-sm font-mono text-amber-300">·</span><span className="text-sm font-mono text-amber-300">MTQ Σ = NOT AUTHORIZED</span>
          </div>
          <p className="text-sm text-slate-500">Per MASTER BLUEPRINT §D.4 — Truth States: VERIFIED / HYPOTHESIS / DECISION / UNRESOLVED / NOT AUTHORIZED. Every claim must be earned, not asserted. Design-stage only, pre-pilot.</p>
        </div>
      </section>
      {m && <footer className="border-t border-white/5 px-6 py-8 text-center"><p className="text-xs text-slate-600">MITHQAL Assurance · DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE · DESIGN-STAGE ONLY</p></footer>}
    </main>
  );
}
