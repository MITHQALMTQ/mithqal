"use client";

import Link from "next/link";
import {
  ArrowRight, ShieldCheck, FileCheck, AlertTriangle, Building2,
  Users, Zap, Cpu, Database, GitBranch, Sparkles, CheckCircle2,
  TrendingUp, Lock, Layers, Play,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-40" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-4 py-1 mb-6 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Financial-Operations Assurance Platform</span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            MITHQAL <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Assurance</span>
          </h1>
          <p className="mb-10 max-w-2xl text-lg text-slate-300">
            An independent financial-operations assurance platform that helps institutions validate payment data, resolve operational exceptions, and produce reproducible evidence across authorized systems.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/dashboard" className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-8 py-3 text-sm font-semibold text-[#07090e] shadow-lg transition-transform hover:scale-105">
              Enter Dashboard <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
            <Link href="/demo-pilot" className="rounded-full border-2 border-amber-400 bg-black/30 px-8 py-3 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-amber-500/20">
              <Play className="mr-2 inline h-4 w-4" /> Try the Demo Pilot
            </Link>
            <Link href="/mtq-sigma" className="rounded-full border-2 border-white/10 bg-black/30 px-8 py-3 text-sm font-medium text-slate-400 backdrop-blur transition-colors hover:bg-white/5">
              MTQ Σ Research
            </Link>
          </div>
        </div>
      </section>

      {/* ─── WHAT IT DOES ─────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold">What MITHQAL Assurance Does</h2>
          <p className="mb-12 text-center text-slate-400">Three capabilities that make payment operations auditable, reproducible, and explainable.</p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: FileCheck, title: "Controlled Ingestion", desc: "Validate payment records against versioned rules. Distinguish hard failures, warnings, missing dependencies, source conflicts, and anomalies." },
              { icon: ShieldCheck, title: "Evidence & Replay", desc: "Record evidence bundles with full provenance. Reconstruct historical decisions using exact rule versions. Reproducible audit trails." },
              { icon: AlertTriangle, title: "Exception Resolution", desc: "Explainable exceptions with maker-checker corrections. Safe halt and recovery. AI-assisted root-cause analysis." },
            ].map((c) => (
              <div key={c.title} className="glass-depth rounded-2xl p-8 card-lift">
                <c.icon className="mb-4 h-8 w-8 text-amber-400" />
                <h3 className="mb-2 text-lg font-semibold">{c.title}</h3>
                <p className="text-sm text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR INVESTORS ────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-7 w-7 text-amber-400" />
            <h2 className="text-3xl font-bold">For Investors</h2>
          </div>
          <p className="mb-12 text-slate-400 max-w-2xl">Why MITHQAL Assurance is a category-defining platform in the financial-operations assurance space.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Reproducible Audit Trails", desc: "Every decision is signed, timestamped, and replayable. Zero drift between original and replay — the gold standard for regulatory evidence." },
              { icon: Cpu, title: "AI-Assisted Analysis", desc: "5-provider consensus AI system (OpenRouter, GROQ, NVIDIA, Gemini, HuggingFace) generates root-cause hypotheses for exceptions. Multi-model fallback ensures reliability." },
              { icon: Layers, title: "Multi-Source Reconciliation", desc: "Cross-source matching engine with 6 rule types (amount ≤$0.01, reference exact, date ±1 day). Automated mismatch detection with maker-checker resolution." },
              { icon: Lock, title: "Bank-Grade Security", desc: "X-Frame-Options DENY, CSP headers, HSTS, rate limiting. All data labeled DEMO. Production authorization = FALSE (design-stage, pre-pilot)." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-amber-500/10 bg-white/5 p-6">
                <c.icon className="mb-3 h-6 w-6 text-amber-400" />
                <h3 className="mb-2 text-sm font-semibold">{c.title}</h3>
                <p className="text-xs text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR BANKS ────────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-7 w-7 text-amber-400" />
            <h2 className="text-3xl font-bold">For Banks & Institutions</h2>
          </div>
          <p className="mb-12 text-slate-400 max-w-2xl">MITHQAL Assurance integrates with your existing bank systems — no rip-and-replace. Translation, not transformation.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: GitBranch, title: "ISO 20022 Native", desc: "Full support for pacs.008, pacs.009, pacs.002, camt.053, camt.054, head.001. Field-level mappings with validation rules." },
              { icon: Database, title: "Bank Core Adapter", desc: "Reads bank core ledger entries and normalizes to ISO 20022. Bank systems remain authoritative — MITHQAL translates, doesn't transform." },
              { icon: ShieldCheck, title: "Compliance Gateway", desc: "Sanctions/AML screening with maker-checker workflow. SWIFT gpi tracker integration. LEI verification. All with audit evidence." },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-amber-500/10 bg-white/5 p-6 card-lift">
                <c.icon className="mb-3 h-6 w-6 text-amber-400" />
                <h3 className="mb-2 text-sm font-semibold">{c.title}</h3>
                <p className="text-xs text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/institutional-engagement" className="rounded-full border border-amber-500/30 bg-amber-500/5 px-6 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10">
              Explore Institutional Engagement <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOR USERS ────────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-7 w-7 text-amber-400" />
            <h2 className="text-3xl font-bold">For Users & Operators</h2>
          </div>
          <p className="mb-12 text-slate-400 max-w-2xl">Test the full end-to-end workflow yourself. Every feature is live with demo data — no signup required.</p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { step: "1", title: "Dashboard", desc: "Overview of 20 validation cases, 10 scenarios, stress test results", href: "/dashboard" },
              { step: "2", title: "Timeline", desc: "30 evidence events grouped by case — full provenance chain", href: "/timeline" },
              { step: "3", title: "Evidence", desc: "Evidence bundles with cryptographic signatures — tamper-evident", href: "/evidence" },
              { step: "4", title: "Exceptions", desc: "10 exceptions with AI-powered root-cause analysis (✨ click to explain)", href: "/exceptions" },
              { step: "5", title: "Reconciliation", desc: "Cross-source matching with 4 source systems + 6 matching rules", href: "/reconciliation" },
              { step: "6", title: "Replay", desc: "Historical case replay with time-correct rules — zero drift", href: "/replay" },
              { step: "7", title: "Corridor", desc: "Cross-border analytics — volume, value, per-corridor breakdown", href: "/corridor" },
              { step: "8", title: "Settings", desc: "Platform config — environment, gates, rules, security, integrations", href: "/settings" },
              { step: "9", title: "MTQ Σ Research", desc: "Master monetary architecture — research only, NOT AUTHORIZED", href: "/mtq-sigma" },
            ].map((s) => (
              <Link key={s.step} href={s.href} className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-amber-500/30 hover:bg-amber-500/5 card-lift">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">{s.step}</span>
                  <h3 className="text-sm font-semibold group-hover:text-amber-300">{s.title}</h3>
                </div>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link href="/demo-pilot" className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-8 py-3 text-sm font-semibold text-[#07090e] shadow-lg transition-transform hover:scale-105">
              <Play className="mr-2 inline h-4 w-4" /> Start Guided Demo Pilot
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-3xl font-bold">How It Works</h2>
          <p className="mb-12 text-center text-slate-400">The end-to-end assurance workflow — from payment ingestion to signed evidence bundle.</p>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "1", icon: FileCheck, title: "Ingest", desc: "Bank submits payment instruction via ISO 20022 (pacs.008). MITHQAL validates against versioned rules." },
              { step: "2", icon: ShieldCheck, title: "Validate", desc: "Rules engine checks amount, reference, currency, beneficiary, LEI. Pass/exception/anomaly classification." },
              { step: "3", icon: AlertTriangle, title: "Resolve", desc: "Exceptions get maker-checker workflow. AI generates root-cause hypothesis. Human approves correction." },
              { step: "4", icon: Lock, title: "Evidence", desc: "Signed evidence bundle stored with full provenance. Replayable with exact rule versions. Zero drift." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
                    <s.icon className="h-5 w-5 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-amber-400">STEP {s.step}</span>
                </div>
                <h3 className="mb-2 text-sm font-semibold">{s.title}</h3>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TECHNOLOGY ───────────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-24 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-7 w-7 text-amber-400" />
            <h2 className="text-3xl font-bold">Technology</h2>
          </div>
          <p className="mb-12 text-slate-400">Built on the latest stack — production-grade from day one.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Next.js 16", "React 19", "TypeScript 5", "Tailwind CSS 4", "shadcn/ui", "TanStack Query", "Framer Motion", "Recharts", "cmdk", "Turso (libsql)", "Neon Postgres", "Inngest", "Vercel", "5-provider AI Consensus"].map((tech) => (
              <span key={tech} className="rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs font-medium text-amber-300">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUTH STATE BANNER ───────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-6 py-2 mb-6">
            <span className="text-sm font-mono text-red-300">PRODUCTION AUTHORIZED = FALSE</span>
            <span className="text-sm font-mono text-amber-300">·</span>
            <span className="text-sm font-mono text-amber-300">MTQ Σ = NOT AUTHORIZED</span>
          </div>
          <p className="text-sm text-slate-500">Per MASTER BLUEPRINT §D.4 — Truth States: VERIFIED / HYPOTHESIS / DECISION / UNRESOLVED / NOT AUTHORIZED. Every claim must be earned, not asserted. Design-stage only, pre-pilot.</p>
        </div>
      </section>

      {/* ─── FOOTER (always visible) ─────────────────────────── */}
      <footer className="border-t border-white/5 px-6 py-8 text-center">
        <p className="text-xs text-slate-600">MITHQAL Assurance · DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE · DESIGN-STAGE ONLY · NOT PRODUCTION-AUTHORIZED</p>
      </footer>
    </main>
  );
}
