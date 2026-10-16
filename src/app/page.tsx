"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, FileCheck, AlertTriangle,
  Sparkles, CheckCircle2, Loader2, Play, LayoutDashboard,
  TrendingUp, Lock, Activity, Clock, Database, Cpu,
} from "lucide-react";

interface DemoCase {
  id: string; institution: string; corridor: string;
  amount: string; status: string; scenario: { id: string; name: string };
}

export default function HomePage() {
  const [tab, setTab] = useState<"demo" | "dashboard">("demo");
  const contentRef = useRef<HTMLDivElement>(null);
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/cases?limit=5")
      .then((r) => r.json())
      .then((d) => { setCases(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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
      else setAiError(data.error || "AI unavailable");
    } catch { setAiError("Network error"); }
    setAiLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      {/* Sticky DEMO banner */}
      <div className="sticky top-0 z-50 border-b border-amber-500/20 bg-amber-950/30 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-1.5">
          <span className="text-[10px] font-mono text-amber-300">
            DEMO PILOT — NOT PRODUCTION — ALL DATA IS SYNTHETIC
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative flex min-h-[45vh] flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/40 px-4 py-1 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Financial-Operations Assurance Platform
            </span>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight md:text-6xl">
            MITHQAL <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Assurance</span>
          </h1>
          <p className="mb-8 text-lg text-slate-300 max-w-2xl">
            Validate payment data. Resolve exceptions with AI. Produce reproducible evidence.
          </p>

          {/* TWO TABS */}
          <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur">
            <button
              onClick={() => { setTab("demo"); setTimeout(() => contentRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 100); }
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                tab === "demo"
                  ? "bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Play className="mr-2 inline h-4 w-4" /> See It Work Now
            </button>
            <button
              onClick={() => { setTab("dashboard"); setTimeout(() => contentRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 100); }
              className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                tab === "dashboard"
                  ? "bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="mr-2 inline h-4 w-4" /> Enter Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* TAB CONTENT */}
      <section ref={contentRef} className="px-6 pb-20 scroll-mt-4">
        <div className="mx-auto max-w-5xl">

          {/* ─── TAB 1: SEE IT WORK (live demo) ─── */}
          {tab === "demo" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 mb-3">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-400">LIVE — Real API + Real AI</span>
                </div>
                <h2 className="text-2xl font-bold">Watch It Work Right Here</h2>
                <p className="mt-1 text-sm text-slate-400">No signup. No navigation. Real data from the API + real AI analysis.</p>
              </div>

              {/* Live case table */}
              <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300">Live Validation Cases</h3>
                  <span className="text-[10px] text-slate-500">from /api/v1/cases</span>
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

              {/* AI Explainer */}
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
                  <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">⚠️ {aiError}</div>
                )}
                {aiResult && (
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3">
                    <div className="mb-2 text-[10px] text-amber-300">⚠️ AI-assisted — not a definitive diagnosis. Human review required.</div>
                    <div className="space-y-1 text-xs text-slate-200">
                      {aiResult.split("\n").map((line, i) => {
                        if (line.startsWith("## ")) return <h4 key={i} className="mt-3 text-sm font-semibold text-amber-300">{line.slice(3)}</h4>;
                        if (line.match(/^\d+\./)) return <p key={i} className="ml-4 text-slate-300">{line}</p>;
                        if (line.startsWith("- ")) return <p key={i} className="ml-4 text-slate-300">• {line.slice(2)}</p>;
                        if (line.trim()) return <p key={i} className="text-slate-400">{line}</p>;
                        return null;
                      })}
                    </div>
                  </div>
                )}
                {!aiResult && !aiError && !aiLoading && (
                  <p className="text-xs text-slate-500">Click "Explain Exception" → AI generates root-cause hypothesis, impact, and 3 recommended actions in real time.</p>
                )}
              </div>

              {/* Switch to dashboard tab */}
              <div className="text-center">
                <button onClick={() => { setTab("dashboard"); setTimeout(() => contentRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 100); } className="text-xs text-amber-300 hover:underline">
                  See the full dashboard →
                </button>
              </div>
            </div>
          )}

          {/* ─── TAB 2: ENTER DASHBOARD (preview) ─── */}
          {tab === "dashboard" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold">Dashboard Preview</h2>
                <p className="mt-1 text-sm text-slate-400">9 connected tabs — all live, all with real data. Click any to explore.</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Validation Cases", value: "20", icon: FileCheck, color: "text-blue-400" },
                  { label: "Evidence Events", value: "30", icon: Clock, color: "text-purple-400" },
                  { label: "Scenarios", value: "10", icon: Activity, color: "text-amber-400" },
                  { label: "Replay Drift", value: "0.000%", icon: CheckCircle2, color: "text-emerald-400" },
                ].map((s) => (
                  <div key={s.label} className="glass-depth rounded-xl p-4 text-center">
                    <s.icon className={`mx-auto mb-1 h-5 w-5 ${s.color}`} />
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tab links grid */}
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { name: "Dashboard", href: "/dashboard", desc: "Overview + stress test", icon: LayoutDashboard },
                  { name: "Timeline", href: "/timeline", desc: "Event provenance", icon: Clock },
                  { name: "Evidence", href: "/evidence", desc: "Tamper-evident bundles", icon: ShieldCheck },
                  { name: "Exceptions", href: "/exceptions", desc: "AI-powered analysis ✨", icon: AlertTriangle },
                  { name: "Reconciliation", href: "/reconciliation", desc: "Cross-source matching", icon: FileCheck },
                  { name: "Replay", href: "/replay", desc: "Zero-drift replay", icon: Activity },
                  { name: "Corridor", href: "/corridor", desc: "Cross-border analytics", icon: TrendingUp },
                  { name: "Settings", href: "/settings", desc: "Platform config", icon: Lock },
                  { name: "Demo Pilot", href: "/demo-pilot", desc: "8-step guided tour", icon: Play },
                ].map((t) => (
                  <Link key={t.name} href={t.href} className="group rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-500/30 hover:bg-amber-500/5 card-lift">
                    <div className="flex items-center gap-2 mb-1">
                      <t.icon className="h-4 w-4 text-amber-400" />
                      <span className="text-sm font-semibold group-hover:text-amber-300">{t.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t.desc}</p>
                  </Link>
                ))}
              </div>

              {/* Launch button */}
              <div className="text-center pt-4">
                <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-8 py-3 text-sm font-bold text-[#07090e] shadow-lg transition hover:scale-105">
                  Launch Full Dashboard <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[10px] text-slate-600">
            MITHQAL Assurance · DEMO DATA — NOT CUSTOMER OR MARKET PERFORMANCE · DESIGN-STAGE ONLY · NOT PRODUCTION-AUTHORIZED
          </p>
        </div>
      </footer>
    </main>
  );
}
