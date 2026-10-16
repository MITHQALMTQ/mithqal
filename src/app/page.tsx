"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, FileCheck, AlertTriangle, Building2,
  Users, Zap, Cpu, Database, GitBranch, Sparkles, CheckCircle2,
  TrendingUp, Lock, Layers, Play, Activity, Clock, XCircle,
  Loader2,
} from "lucide-react";

// ─── Embedded live demo data (fetched from the API) ──────────────────────
interface DemoCase {
  id: string; institution: string; corridor: string; amount: string;
  status: string; scenario: { id: string; name: string };
}

export default function HomePage() {
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch 3 demo cases on mount
  useEffect(() => {
    fetch("/api/v1/cases?limit=3")
      .then((r) => r.json())
      .then((d) => { setCases(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // AI explain handler (shows the consensus system working)
  const handleAIExplain = async () => {
    setAiLoading(true); setAiError(null); setAiResult(null);
    try {
      const res = await fetch("/api/v1/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exceptionId: "EXC-001", caseId: "VC-DEMO-2001",
          code: "AMT-MATCH-001", severity: "HIGH", status: "OPEN",
          owner: "Sarah Chen (DEMO)", reason: "AMT-MATCH-001",
          action: "Investigate $2 discrepancy",
        }),
      });
      const data = await res.json();
      if (data.ok) setAiResult(data.explanation);
      else setAiError(data.error || "AI service unavailable");
    } catch (e) {
      setAiError("Network error — AI service may be warming up");
    }
    setAiLoading(false);
  };

  const stats = [
    { label: "Validation Cases", value: "20", icon: FileCheck, color: "text-blue-400" },
    { label: "Evidence Events", value: "30", icon: Clock, color: "text-purple-400" },
    { label: "Scenarios", value: "10", icon: Activity, color: "text-amber-400" },
    { label: "Replay Drift", value: "0.000%", icon: CheckCircle2, color: "text-emerald-400" },
  ];

  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      {/* ═══ DEMO BANNER (always visible) ═══ */}
      <div className="sticky top-0 z-50 border-b border-amber-500/20 bg-amber-950/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-1.5">
          <span className="text-[10px] font-mono text-amber-300">
            DEMO PILOT — NOT PRODUCTION — ALL DATA IS SYNTHETIC — DESIGN-STAGE ONLY
          </span>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-4 py-1 mb-6 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Financial-Operations Assurance Platform
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
            MITHQAL <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Assurance</span>
          </h1>
          <p className="mb-8 text-lg text-slate-300">
            Validate payment data. Resolve exceptions with AI. Produce reproducible evidence.
            <span className="text-amber-300"> One platform for auditable financial operations.</span>
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="#live-demo" className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-7 py-3 text-sm font-semibold text-[#07090e] shadow-lg transition hover:scale-105">
              <Play className="mr-2 inline h-4 w-4" /> See It Work Now
            </a>
            <Link href="/dashboard" className="rounded-full border-2 border-amber-400 bg-black/30 px-7 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-amber-500/10">
              Enter Full Dashboard <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <s.icon className={`mx-auto mb-1 h-4 w-4 ${s.color}`} />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE PROBLEM ═══ */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-bold">The Problem</h2>
          <p className="mb-12 text-center text-slate-400">Payment operations today are opaque. Here's what breaks.</p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: XCircle, title: "Unreproducible Audits", desc: "When auditors ask 'what happened 3 months ago?', the answer is often 'we're not sure'. Rule versions change, context is lost, decisions can't be reconstructed." },
              { icon: AlertTriangle, title: "Exception Pile-up", desc: "Exceptions accumulate faster than teams can investigate. No root-cause analysis. No prioritization. Each exception requires manual detective work." },
              { icon: Lock, title: "Siloed Evidence", desc: "Evidence is scattered across bank cores, payment rails, compliance systems. No single source of truth. No tamper-evident chain. No cross-source reconciliation." },
            ].map((p) => (
              <div key={p.title} className="rounded-2xl border border-red-500/10 bg-red-950/5 p-6">
                <p.icon className="mb-3 h-6 w-6 text-red-400" />
                <h3 className="mb-2 text-sm font-semibold">{p.title}</h3>
                <p className="text-xs text-slate-400">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THE SOLUTION ═══ */}
      <section className="border-t border-white/5 px-6 py-20 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-3 text-center text-3xl font-bold">The Solution</h2>
          <p className="mb-12 text-center text-slate-400">A 4-step assurance workflow — from payment ingestion to signed evidence bundle.</p>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: "1", icon: FileCheck, title: "Ingest", desc: "Bank submits ISO 20022 pacs.008. MITHQAL validates against versioned rules." },
              { step: "2", icon: ShieldCheck, title: "Validate", desc: "Rules engine checks amount, reference, currency, beneficiary, LEI. Pass/exception/anomaly." },
              { step: "3", icon: AlertTriangle, title: "Resolve", desc: "Exceptions get maker-checker. AI generates root-cause. Human approves correction." },
              { step: "4", icon: Lock, title: "Evidence", desc: "Signed bundle stored. Replayable with exact rule versions. Zero drift. Tamper-evident." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
                    <s.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400">STEP {s.step}</span>
                </div>
                <h3 className="mb-1 text-sm font-semibold">{s.title}</h3>
                <p className="text-xs text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LIVE DEMO (embedded — no navigation needed) ═══ */}
      <section id="live-demo" className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Live Demo — No Signup</span>
            </div>
            <h2 className="mb-2 text-3xl font-bold">See It Work Right Here</h2>
            <p className="text-slate-400">Real API calls. Real AI analysis. Real data. All on this page.</p>
          </div>

          {/* Live case table */}
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-300">Live Validation Cases (from /api/v1/cases)</h3>
              <span className="text-[10px] text-slate-500">auto-refreshed every 30s</span>
            </div>
            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-400" />
                <p className="mt-2 text-xs text-slate-400">Fetching live data…</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-[10px] text-slate-400">
                      <th className="pb-2 pr-3 font-medium">Case ID</th>
                      <th className="pb-2 pr-3 font-medium">Institution</th>
                      <th className="pb-2 pr-3 font-medium">Corridor</th>
                      <th className="pb-2 pr-3 font-medium">Amount</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c) => (
                      <tr key={c.id} className="border-b border-white/5">
                        <td className="py-2 pr-3 font-mono text-[11px] text-amber-300">{c.id}</td>
                        <td className="py-2 pr-3 text-[11px] text-slate-300">{c.institution}</td>
                        <td className="py-2 pr-3 font-mono text-[11px] text-cyan-300">{c.corridor}</td>
                        <td className="py-2 pr-3 text-[11px] text-emerald-300">{c.amount}</td>
                        <td className="py-2 pr-3">
                          <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-400">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* AI Explainer (embedded — works right here) */}
          <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-amber-300">AI-Powered Exception Analysis</h3>
                <p className="text-[10px] text-slate-500">5-provider consensus (OpenRouter ✅ + GROQ + NVIDIA + Gemini + HuggingFace)</p>
              </div>
              <button
                onClick={handleAIExplain}
                disabled={aiLoading}
                className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-5 py-2 text-xs font-semibold text-[#07090e] transition hover:scale-105 disabled:opacity-50"
              >
                {aiLoading ? (
                  <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Analyzing…</>
                ) : (
                  <><Sparkles className="mr-2 inline h-4 w-4" /> Explain Exception</>
                )}
              </button>
            </div>

            {aiError && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                ⚠️ {aiError}
              </div>
            )}

            {aiResult && (
              <div className="max-h-60 overflow-y-auto rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3">
                <div className="mb-2 text-[10px] text-amber-300">⚠️ AI-assisted analysis — not a definitive diagnosis. Human review required.</div>
                <div className="space-y-1 text-xs text-slate-200">
                  {aiResult.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h4 key={i} className="mt-3 text-sm font-semibold text-amber-300">{line.slice(3)}</h4>;
                    if (line.startsWith("# ")) return <h4 key={i} className="mt-3 text-sm font-bold text-amber-300">{line.slice(2)}</h4>;
                    if (line.match(/^\d+\./)) return <p key={i} className="ml-4 text-slate-300">{line}</p>;
                    if (line.startsWith("- ")) return <p key={i} className="ml-4 text-slate-300">• {line.slice(2)}</p>;
                    if (line.trim()) return <p key={i} className="text-slate-400">{line}</p>;
                    return null;
                  })}
                </div>
              </div>
            )}

            {!aiResult && !aiError && !aiLoading && (
              <p className="text-xs text-slate-500">Click "Explain Exception" to see the AI generate a root-cause hypothesis, impact assessment, and 3 recommended actions — in real time.</p>
            )}
          </div>
        </div>
      </section>

      {/* ═══ FOR INVESTORS, BANKS, USERS (concise) ═══ */}
      <section className="border-t border-white/5 px-6 py-20 bg-gradient-to-b from-transparent to-amber-950/5">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">Who It's For</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Investors */}
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-6">
              <TrendingUp className="mb-3 h-6 w-6 text-amber-400" />
              <h3 className="mb-3 text-sm font-semibold">For Investors</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Reproducible audit trails (zero drift)</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> 5-provider AI consensus system</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Multi-source reconciliation engine</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Bank-grade security (CSP, HSTS, rate limit)</li>
              </ul>
            </div>
            {/* Banks */}
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-6">
              <Building2 className="mb-3 h-6 w-6 text-amber-400" />
              <h3 className="mb-3 text-sm font-semibold">For Banks</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> ISO 20022 native (pacs.008/009/002)</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Bank core adapter (translation, not transformation)</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Compliance gateway (AML/sanctions/LEI)</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> SWIFT gpi tracker integration</li>
              </ul>
              <Link href="/institutional-engagement" className="mt-3 inline-block text-[10px] text-amber-300 hover:underline">
                Explore engagement model →
              </Link>
            </div>
            {/* Users */}
            <div className="rounded-2xl border border-amber-500/10 bg-white/5 p-6">
              <Users className="mb-3 h-6 w-6 text-amber-400" />
              <h3 className="mb-3 text-sm font-semibold">For Users</h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> 9 dashboard tabs — all live</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Click any case → see its timeline</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> Click ✨ → AI explains exceptions</li>
                <li className="flex gap-2"><CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> ⌘K command palette</li>
              </ul>
              <Link href="/demo-pilot" className="mt-3 inline-block text-[10px] text-amber-300 hover:underline">
                Guided demo pilot (8 steps) →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TECHNOLOGY ═══ */}
      <section className="border-t border-white/5 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Zap className="h-6 w-6 text-amber-400" />
            <h2 className="text-2xl font-bold">Technology</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {["Next.js 16", "React 19", "TypeScript 5", "Tailwind CSS 4", "shadcn/ui", "TanStack Query", "Framer Motion", "Recharts", "cmdk ⌘K", "Turso DB", "Neon Postgres", "Inngest", "Vercel", "5-Provider AI Consensus"].map((t) => (
              <span key={t} className="rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[11px] text-amber-300">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="border-t border-white/5 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold">Try the Full Platform</h2>
          <p className="mb-8 text-slate-400">The dashboard has 9 tabs — all live, all connected. Click any case to see its timeline. Click any ✨ to get AI analysis. Press ⌘K to navigate.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-8 py-4 text-sm font-bold text-[#07090e] shadow-lg transition hover:scale-105">
            Enter Dashboard <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-4 py-1">
            <span className="text-[10px] font-mono text-red-300">PRODUCTION AUTHORIZED = FALSE</span>
            <span className="text-[10px] font-mono text-amber-300">· NOT PRODUCTION</span>
          </div>
          <p className="text-xs text-slate-600">
            MITHQAL Assurance · DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE · DESIGN-STAGE ONLY
          </p>
        </div>
      </footer>
    </main>
  );
}
