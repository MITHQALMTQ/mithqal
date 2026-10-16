"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, ShieldCheck, FileCheck, AlertTriangle,
  Sparkles, CheckCircle2, Loader2, Play, LayoutDashboard,
  Clock, Activity,
} from "lucide-react";

interface DemoCase {
  id: string; institution: string; corridor: string;
  amount: string; status: string;
}

export default function HomePage() {
  const [tab, setTab] = useState<"demo" | "dashboard">("demo");
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

  const handleAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await fetch("/api/v1/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exceptionId: "EXC-001",
          caseId: "VC-DEMO-2001",
          code: "AMT-MATCH-001",
          severity: "HIGH",
          status: "OPEN",
          owner: "Sarah Chen (DEMO)",
          reason: "AMT-MATCH-001",
          action: "Investigate $2 discrepancy",
        }),
      });
      const data = await res.json();
      if (data.ok) setAiResult(data.explanation);
      else setAiError(data.error || "AI unavailable");
    } catch {
      setAiError("Network error");
    }
    setAiLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      {/* DEMO banner */}
      <div className="sticky top-0 z-50 border-b border-amber-500/20 bg-amber-950/30 backdrop-blur-sm">
        <p className="py-1.5 text-center text-[10px] font-mono text-amber-300">
          DEMO PILOT — NOT PRODUCTION — ALL DATA IS SYNTHETIC
        </p>
      </div>

      {/* Compact header */}
      <header className="px-6 pt-8 pb-4 text-center">
        <h1 className="mb-1 text-4xl font-bold tracking-tight">
          MITHQAL{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Assurance
          </span>
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Validate payments. Resolve exceptions with AI. Reproducible evidence.
        </p>

        {/* Two tabs */}
        <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1">
          <button
            onClick={() => setTab("demo")}
            className={
              "rounded-full px-5 py-2 text-sm font-semibold transition " +
              (tab === "demo"
                ? "bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e]"
                : "text-slate-400 hover:text-white")
            }
          >
            <Play className="mr-1.5 inline h-4 w-4" />
            See It Work Now
          </button>
          <button
            onClick={() => setTab("dashboard")}
            className={
              "rounded-full px-5 py-2 text-sm font-semibold transition " +
              (tab === "dashboard"
                ? "bg-gradient-to-r from-amber-400 to-amber-200 text-[#07090e]"
                : "text-slate-400 hover:text-white")
            }
          >
            <LayoutDashboard className="mr-1.5 inline h-4 w-4" />
            Enter Dashboard
          </button>
        </div>
      </header>

      {/* Tab content */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl">
          {/* TAB 1: See It Work */}
          {tab === "demo" && (
            <div className="space-y-4">
              <div className="text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE — Real API + Real AI
                </span>
              </div>

              {/* Case table */}
              <div className="rounded-2xl border border-amber-500/15 bg-white/5 p-5">
                <h3 className="mb-3 text-sm font-semibold text-amber-300">
                  Live Validation Cases
                </h3>
                {loading ? (
                  <div className="py-6 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-amber-400" />
                    <p className="mt-2 text-xs text-slate-400">Fetching live data…</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-[10px] text-slate-400">
                          <th className="pb-2 pr-3">Case ID</th>
                          <th className="pb-2 pr-3">Institution</th>
                          <th className="pb-2 pr-3">Corridor</th>
                          <th className="pb-2 pr-3">Amount</th>
                          <th className="pb-2 pr-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((c) => (
                          <tr key={c.id} className="border-b border-white/5">
                            <td className="py-1.5 pr-3 font-mono text-[11px] text-amber-300">{c.id}</td>
                            <td className="py-1.5 pr-3 text-[11px] text-slate-300">{c.institution}</td>
                            <td className="py-1.5 pr-3 font-mono text-[11px] text-cyan-300">{c.corridor}</td>
                            <td className="py-1.5 pr-3 text-[11px] text-emerald-300">{c.amount}</td>
                            <td className="py-1.5 pr-3">
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] text-amber-400">
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* AI Explainer */}
              <div className="rounded-2xl border border-amber-500/15 bg-white/5 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-amber-300">
                    AI-Powered Exception Analysis
                  </h3>
                  <button
                    onClick={handleAI}
                    disabled={aiLoading}
                    className="rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-4 py-1.5 text-xs font-semibold text-[#07090e] transition hover:scale-105 disabled:opacity-50"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
                        Explain Exception
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
                    ⚠️ {aiError}
                  </div>
                )}

                {aiResult && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3">
                    <p className="mb-2 text-[10px] text-amber-300">
                      ⚠️ AI-assisted — not a definitive diagnosis. Human review required.
                    </p>
                    <div className="space-y-1 text-xs text-slate-200">
                      {aiResult.split("\n").map((line, i) => {
                        if (line.startsWith("## "))
                          return (
                            <h4 key={i} className="mt-2 text-sm font-semibold text-amber-300">
                              {line.slice(3)}
                            </h4>
                          );
                        if (line.match(/^\d+\./))
                          return (
                            <p key={i} className="ml-3 text-slate-300">
                              {line}
                            </p>
                          );
                        if (line.startsWith("- "))
                          return (
                            <p key={i} className="ml-3 text-slate-300">
                              • {line.slice(2)}
                            </p>
                          );
                        if (line.trim())
                          return (
                            <p key={i} className="text-slate-400">
                              {line}
                            </p>
                          );
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {!aiResult && !aiError && !aiLoading && (
                  <p className="text-xs text-slate-500">
                    Click the button → AI generates root-cause, impact, and 3 recommended actions in real time.
                  </p>
                )}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setTab("dashboard")}
                  className="text-xs text-amber-300 hover:underline"
                >
                  See the dashboard preview →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Dashboard preview */}
          {tab === "dashboard" && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-xl font-bold">Dashboard Preview</h2>
                <p className="mt-1 text-xs text-slate-400">
                  9 connected tabs — all live with real data
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  { label: "Cases", value: "20", icon: FileCheck, color: "text-blue-400" },
                  { label: "Events", value: "30", icon: Clock, color: "text-purple-400" },
                  { label: "Scenarios", value: "10", icon: Activity, color: "text-amber-400" },
                  { label: "Drift", value: "0.000%", icon: CheckCircle2, color: "text-emerald-400" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 text-center"
                  >
                    <s.icon className={"mx-auto mb-1 h-4 w-4 " + s.color} />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Tab grid */}
              <div className="grid gap-2 md:grid-cols-3">
                {[
                  { name: "Dashboard", href: "/dashboard", desc: "Overview + stress test", icon: LayoutDashboard },
                  { name: "Timeline", href: "/timeline", desc: "Event provenance", icon: Clock },
                  { name: "Evidence", href: "/evidence", desc: "Tamper-evident bundles", icon: ShieldCheck },
                  { name: "Exceptions", href: "/exceptions", desc: "AI analysis ✨", icon: AlertTriangle },
                  { name: "Reconciliation", href: "/reconciliation", desc: "Cross-source matching", icon: FileCheck },
                  { name: "Replay", href: "/replay", desc: "Zero-drift replay", icon: Activity },
                  { name: "Corridor", href: "/corridor", desc: "Cross-border analytics", icon: ArrowRight },
                  { name: "Settings", href: "/settings", desc: "Platform config", icon: ShieldCheck },
                  { name: "Demo Pilot", href: "/demo-pilot", desc: "8-step guided tour", icon: Play },
                ].map((t) => (
                  <Link
                    key={t.name}
                    href={t.href}
                    className="group rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-amber-500/30 hover:bg-amber-500/5"
                  >
                    <div className="flex items-center gap-2">
                      <t.icon className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-semibold group-hover:text-amber-300">
                        {t.name}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">{t.desc}</p>
                  </Link>
                ))}
              </div>

              {/* Launch */}
              <div className="text-center pt-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-7 py-2.5 text-sm font-bold text-[#07090e] shadow-lg transition hover:scale-105"
                >
                  Launch Full Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-6 text-center">
        <p className="text-[10px] text-slate-600">
          MITHQAL Assurance · DEMO DATA · NOT PRODUCTION-AUTHORIZED · DESIGN-STAGE ONLY
        </p>
      </footer>
    </main>
  );
}
