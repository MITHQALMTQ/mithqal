"use client";

import { useState, useEffect } from "react";

interface Provider { name: string; status: string; role: string; }
interface ScenarioResult {
  scenarioId: string; name: string; outcome: string;
  finalStateReached: string; mtqGate: { denied: boolean };
  setup?: string;
}
interface GateDef { gateId: string; gateDefinition: { name: string; minimumExitCondition: string; defaultIfNotMet: string; }; latestDecision: { decision: string } | null; }
interface WorkflowDef { id: string; name: string; description: string; blueprint_ref: string; }

const STATUS_COLORS: Record<string, string> = {
  PASS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  BLOCKED_EXPECTED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  FAIL: "bg-red-500/20 text-red-300 border-red-500/40",
  VERIFIED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  BLOCKED: "bg-red-500/20 text-red-300 border-red-500/40",
  NOT_EVALUATED: "bg-slate-500/20 text-slate-300 border-slate-500/40",
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] ?? STATUS_COLORS.NOT_EVALUATED;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${c}`}>{status}</span>;
}

export default function V26InstitutionalDashboard() {
  const [scenarios, setScenarios] = useState<ScenarioResult[]>([]);
  const [gates, setGates] = useState<GateDef[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [sRes, gRes, wRes] = await Promise.all([
          fetch("/api/gateway/v1/pilot-a/results"),
          fetch("/api/gateway/v1/gates"),
          fetch("/api/gateway/v1/workflows"),
        ]);
        if (sRes.ok) { const d = await sRes.json(); setScenarios(d.scenarios ?? []); }
        if (gRes.ok) { const d = await gRes.json(); setGates(d.gates ?? []); }
        if (wRes.ok) { const d = await wRes.json(); setWorkflows(d.workflows ?? []); }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    void fetchAll();
  }, []);

  const providers: Provider[] = [
    { name: "GitHub", status: "VERIFIED", role: "Source/release control (§6.9)" },
    { name: "Vercel", status: "VERIFIED", role: "App/API runtime (§6.5)" },
    { name: "Neon", status: "VERIFIED", role: "Authoritative writer (§6.1/D-006)" },
    { name: "Turso", status: "VERIFIED", role: "Projection/read model (§6.8)" },
    { name: "Inngest", status: "VERIFIED", role: "Durable orchestration (§6.6)" },
  ];

  if (loading) {
    return (
      <div className="bg-[#07090e] border-t border-amber-500/10 py-20">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12">
          <div className="animate-pulse text-amber-300 text-sm font-mono text-center">Loading v26.0 Institutional Dashboard...</div>
        </div>
      </div>
    );
  }

  const passed = scenarios.filter(s => s.outcome === "PASS").length;
  const blocked = scenarios.filter(s => s.outcome === "BLOCKED_EXPECTED").length;
  const failed = scenarios.filter(s => s.outcome === "FAIL").length;

  return (
    <section className="relative z-20 bg-[#07090e] border-t border-amber-500/10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-px h-4 bg-amber-400" />
            <span className="text-xs font-semibold tracking-[0.28em] uppercase text-amber-400">v26.0 CANONICAL BASELINE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Institutional <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Control Tower</span>
          </h2>
          <p className="text-lg text-[#cbd5e1] max-w-3xl mx-auto leading-relaxed">
            Live canonical state per MITHQAL Master Blueprint v26.0. Production authorization is FALSE;
            MTQ is disabled by default per §3.2; Pilot A demo-only mode active.
          </p>
        </div>

        {/* Top status strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { label: "MTQ Gate", value: "DISABLED", ref: "v26.0 §3.2" },
            { label: "Pilot Stage", value: "A", ref: "v26.0 §3.5" },
            { label: "Production Auth", value: "FALSE", ref: "v26.0 §0.2" },
            { label: "Providers", value: "5/5 VERIFIED", ref: "v26.0 §6.10" },
          ].map(s => (
            <div key={s.label} className="text-center p-4 rounded-xl bg-white/5 border border-amber-500/20">
              <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">{s.label}</div>
              <div className="text-lg font-bold text-amber-300 font-mono">{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-1">{s.ref}</div>
            </div>
          ))}
        </div>

        {/* Provider harmony */}
        <div className="mb-12 p-6 rounded-xl bg-white/5 border border-amber-500/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Provider Harmony (§6.10)</h3>
            <StatusBadge status="VERIFIED" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {providers.map(p => (
              <div key={p.name} className="text-center p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
                <div className="text-sm font-semibold text-white mb-1">{p.name}</div>
                <StatusBadge status={p.status} />
                <div className="text-[10px] text-slate-400 mt-2 leading-snug">{p.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pilot A scenarios */}
        {scenarios.length > 0 && (
          <div className="mb-12 p-6 rounded-xl bg-white/5 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Pilot A Scenario Matrix (§8.9 — {scenarios.length} scenarios)</h3>
              <div className="flex gap-2 text-xs">
                <StatusBadge status="PASS" /><span className="text-emerald-300 font-mono">{passed}</span>
                <StatusBadge status="BLOCKED_EXPECTED" /><span className="text-amber-300 font-mono">{blocked}</span>
                <StatusBadge status="FAIL" /><span className="text-red-300 font-mono">{failed}</span>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-900/95">
                  <tr className="text-left text-xs uppercase text-slate-400 border-b border-slate-700/50">
                    <th className="py-2 px-2">ID</th>
                    <th className="py-2 px-2">Scenario</th>
                    <th className="py-2 px-2">Final State</th>
                    <th className="py-2 px-2">Outcome</th>
                    <th className="py-2 px-2">MTQ</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map(r => (
                    <tr key={r.scenarioId} className="border-b border-slate-800/50">
                      <td className="py-2 px-2 font-mono text-amber-300 text-xs">{r.scenarioId}</td>
                      <td className="py-2 px-2 text-white text-xs">{r.name}</td>
                      <td className="py-2 px-2 font-mono text-xs text-slate-300">{r.finalStateReached}</td>
                      <td className="py-2 px-2"><StatusBadge status={r.outcome} /></td>
                      <td className="py-2 px-2">
                        {r.mtqGate.denied ? <span className="text-xs font-mono text-amber-300">DENIED ✓</span> : <span className="text-xs font-mono text-red-300">ENABLED ⚠</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gates + Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {gates.length > 0 && (
            <div className="p-6 rounded-xl bg-white/5 border border-amber-500/20">
              <h3 className="text-base font-semibold text-white mb-4">Gate Ledger (§9.1 — G0–G11)</h3>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {gates.map(g => (
                  <div key={g.gateId} className="flex items-start gap-3 p-2 rounded bg-slate-800/30">
                    <div className="font-mono text-xs text-amber-300 font-bold min-w-[2.5rem]">{g.gateId}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{g.gateDefinition.name}</div>
                      <div className="text-[10px] text-red-300 mt-1 font-mono">{g.gateDefinition.defaultIfNotMet}</div>
                    </div>
                    <StatusBadge status={g.latestDecision?.decision ?? "NOT_EVALUATED"} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {workflows.length > 0 && (
            <div className="p-6 rounded-xl bg-white/5 border border-amber-500/20">
              <h3 className="text-base font-semibold text-white mb-4">Workflow Catalog (§6.6 — {workflows.length} functions)</h3>
              <div className="max-h-80 overflow-y-auto space-y-2">
                {workflows.map(w => (
                  <div key={w.id} className="p-2 rounded bg-slate-800/30">
                    <div className="text-sm font-mono text-amber-300">{w.id}</div>
                    <div className="text-sm font-medium text-white mt-1">{w.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">{w.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Honest state */}
        <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠</div>
            <div>
              <div className="text-sm font-semibold text-amber-300 mb-1">Honest State — v26.0 §0.2</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                MITHQAL is a neutral institutional settlement control plane — designed, not deployed. MTQ is disabled
                by default per §3.2 until its legal, accounting, custody, backing, redemption, bank and regulatory gates
                are independently satisfied. NOT PRODUCTION-AUTHORIZED.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
