"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Circle, LayoutDashboard, Clock,
  FileCheck, AlertTriangle, GitCompare, RotateCcw, Map,
  Settings, Sparkles, ArrowLeft, Play,
} from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: LayoutDashboard,
    title: "Dashboard — Stress Test Simulation",
    href: "/dashboard",
    desc: "Start here. The dashboard shows 20 validation cases across 10 scenarios with 6 KPI stat cards (Cases, Total Value, Exception Rate, Avg Resolution, P95, Scenarios). All data is DEMO — labeled clearly.",
    whatToLook: "Notice the 'Live · 30s' indicator — data auto-refreshes. The stat cards have sparklines showing trends. The case table has clickable Case IDs that link to the Timeline.",
    duration: "2 min",
  },
  {
    id: 2,
    icon: Clock,
    title: "Timeline — Event Provenance Chain",
    href: "/timeline",
    desc: "30 evidence events grouped by case. Each event has a type (RECORD_RECEIVED, VALIDATION_PASSED, EXCEPTION_OPENED, etc.), a source, a timestamp, and a signature (VERIFIED/UNVERIFIED).",
    whatToLook: "Click a case header to see its full event chain. The event type legend shows 10 color-coded types. Each case's events are in chronological order with provenance.",
    duration: "3 min",
  },
  {
    id: 3,
    icon: FileCheck,
    title: "Evidence — Tamper-Evident Bundles",
    href: "/evidence",
    desc: "30 events in per-case evidence bundles. Each bundle has an integrity summary (X/Y signed). The chain is valid — any modification to a signed event invalidates the chain.",
    whatToLook: "Click 'Export' on any bundle. The VERIFIED badge means the event is cryptographically signed. UNVERIFIED events are flagged for review.",
    duration: "2 min",
  },
  {
    id: 4,
    icon: Sparkles,
    title: "Exceptions — AI-Powered Root Cause Analysis",
    href: "/exceptions",
    desc: "10 exceptions across 4 severity levels (LOW/MEDIUM/HIGH/CRITICAL) and 5 statuses (OPEN→IN_PROGRESS→ESCALATED→RESOLVED→CLOSED). Click the ✨ icon on any row to get an AI-generated analysis.",
    whatToLook: "Click the ✨ (sparkles) button on any exception row. A dialog opens with an AI-generated Root Cause Hypothesis, Impact Assessment, and 3 Recommended Actions. This uses the 5-provider consensus system.",
    duration: "5 min",
  },
  {
    id: 5,
    icon: GitCompare,
    title: "Reconciliation — Cross-Source Matching",
    href: "/reconciliation",
    desc: "4 source systems (Bank Core, Payment Rail, Compliance Layer, Treasury) with match/mismatch progress bars. 6 matching rules (amount ≤$0.01, reference exact, date ±1 day, etc.).",
    whatToLook: "The matching matrix shows each source's match rate. The rules section explains the tolerance for each field. Mismatches are flagged automatically.",
    duration: "3 min",
  },
  {
    id: 6,
    icon: RotateCcw,
    title: "Replay — Zero-Drift Historical Reconstruction",
    href: "/replay",
    desc: "Historical cases replayed with time-correct rule versions. Each replay shows: original result, replay result, rule version, and drift (0.000% = identical).",
    whatToLook: "The methodology section explains the 4-step process: snapshot extraction → isolated execution → result comparison → provenance chain. Zero drift = reproducible audit trail.",
    duration: "3 min",
  },
  {
    id: 7,
    icon: Map,
    title: "Corridor — Cross-Border Analytics",
    href: "/corridor",
    desc: "8 corridors (AED→INR, SGD→USD, etc.) with volume/value per corridor. 4 institutions with per-institution breakdown. Click a corridor to filter the Dashboard.",
    whatToLook: "Click any corridor row to navigate to /dashboard?corridor=X (filtered view). The per-institution cards show case count + total value per bank.",
    duration: "3 min",
  },
  {
    id: 8,
    icon: Settings,
    title: "Settings — Platform Configuration",
    href: "/settings",
    desc: "6 config categories: Environment, Authorization Gates, Rules & Validation, Data & Storage, Security, Integrations. 24 config items with status badges (ACTIVE/BLOCKED/PENDING/DEMO).",
    whatToLook: "The Authorization Gates section shows PRODUCTION AUTHORIZED = FALSE. The Integrations section lists all connected providers (Turso, Neon, Inngest, OpenRouter, etc.).",
    duration: "2 min",
  },
];

export default function DemoPilotPage() {
  const [completed, setCompleted] = useState<number[]>([]);

  const toggleComplete = (id: number) => {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const progress = Math.round((completed.length / STEPS.length) * 100);

  return (
    <main className="min-h-screen bg-[#07090e] text-white">
      {/* ─── HEADER ───────────────────────────────────────────── */}
      <section className="border-b border-white/5 px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-amber-300">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1 mb-4">
            <Play className="h-3 w-3 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Guided Demo Pilot</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Demo Pilot <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">Walkthrough</span>
          </h1>
          <p className="mb-6 text-slate-300">
            Test the full end-to-end MITHQAL Assurance workflow. 8 steps, ~23 minutes total. All data is DEMO — no signup required. Click "Complete" after each step to track your progress.
          </p>

          {/* Progress bar */}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-400">Progress: {completed.length}/{STEPS.length} steps</span>
            <span className="font-semibold text-amber-400">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* ─── STEPS ────────────────────────────────────────────── */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {STEPS.map((step) => {
            const isDone = completed.includes(step.id);
            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-6 transition ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Step number / checkbox */}
                  <button
                    onClick={() => toggleComplete(step.id)}
                    className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition"
                    style={{
                      borderColor: isDone ? "rgb(16 185 129 / 0.4)" : "rgb(245 158 11 / 0.3)",
                      background: isDone ? "rgb(16 185 129 / 0.1)" : "rgb(245 158 11 / 0.05)",
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <span className="text-xs font-bold text-amber-400">{step.id}</span>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <step.icon className="h-5 w-5 text-amber-400" />
                      <h2 className="text-lg font-semibold">{step.title}</h2>
                      <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                        {step.duration}
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-slate-300">{step.desc}</p>

                    {/* What to look for */}
                    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <p className="text-xs font-semibold text-amber-300">📋 What to look for:</p>
                      <p className="mt-1 text-xs text-slate-400">{step.whatToLook}</p>
                    </div>

                    {/* Action button */}
                    <Link
                      href={step.href}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
                    >
                      Open {step.title.split("—")[0].trim()} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── COMPLETION ───────────────────────────────────────── */}
      {progress === 100 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
            <h2 className="mb-2 text-2xl font-bold text-emerald-300">Demo Pilot Complete!</h2>
            <p className="mb-6 text-sm text-slate-400">
              You've tested the full MITHQAL Assurance workflow — from payment ingestion to AI-powered exception analysis to zero-drift replay.
            </p>
            <Link
              href="/institutional-engagement"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-6 py-2 text-sm font-semibold text-[#07090e]"
            >
              Explore Institutional Engagement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ─── DEMO DISCLAIMER ──────────────────────────────────── */}
      <section className="border-t border-white/5 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-950/20 px-6 py-2 mb-4">
            <span className="text-sm font-mono text-red-300">DEMO PILOT · NOT PRODUCTION</span>
          </div>
          <p className="text-sm text-slate-500">
            All data is synthetic and labeled DEMO DATA. No real customer data, no real payments, no real market performance.
            Production authorization = FALSE. This is a design-stage pilot for testing and demonstration only.
          </p>
        </div>
      </section>
    </main>
  );
}
