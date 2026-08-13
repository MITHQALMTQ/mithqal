"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Shield, AlertTriangle, Layers, TrendingUp, Globe, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  generatedAt: string;
  top: { totalReserve: number; bullion: number; fiat: number; digital: number };
  solvency: {
    rr: number; policyRR: number; strategicRR: number; stressRR: number; requiredRR: number;
    calm: { sMax: number; currentSupply: number; headroom: number; headroomPct: number; restrictionLevel: string; stabilizationFeeBps: number; reason: string; formula: string };
  };
  liquidity: { lcr: number; lrr: number; prefundedLiquidity: string };
  reserveState: { current: string; previous: string; transitioned: boolean; reason: string; corridor: { bullionMin: number; bullionMax: number; fiatMin: number; fiatMax: number; digitalMin: number; digitalMax: number; cashPct: number; sovereignPct: number } };
  currencies: Array<{ currency: string; lifecycleState: string; lifecycleReason: string; currentWeight: number; targetWeight: number; cqs: number; goldRelativeStrength: number; goldRelativeDepreciation: number; mrrc: number; riskContributionPct: number }>;
  bullion: { goldPct: number; silverPct: number; bullionPct: number; bri: number };
  digital: { digitalPct: number; target: number; max: number };
  cbgrs: { value: number; arithmetic: number; changeFromBase: number };
  custody: { custodians: Array<{ name: string; weight: number; jurisdiction: string }>; jurisdictionConcentration: Record<string, number>; commonModeScore: number; maxCustodianPct: number; maxJurisdictionPct: number };
  rebalancing: { actions: unknown[]; totalActions: number; estimatedCost: number; riskReduction: number; maxSeverity: string; approvalRequired: boolean; explainability: string[]; lambda: number };
  mrrc: { cvar95: number; cvar99: number; results: Array<{ asset: string; mrrc: number; weight: number; riskContributionPct: number }> };
  stabilizationFee: { bps: number; state: string };
  defenseHierarchy: string[];
}

export function RebalancingDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDash = useCallback(async () => {
    try {
      const res = await fetch("/api/rebalancing-dashboard", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch { /* keep last */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchDash();
    const id = setInterval(fetchDash, 30_000);
    return () => clearInterval(id);
  }, [fetchDash]);

  if (loading && !data) return <div className="mt-6 rounded-2xl border border-line bg-ink-card p-6 animate-pulse text-sm text-fg-muted">Loading rebalancing dashboard…</div>;
  if (!data) return null;

  const stateColor: Record<string, string> = {
    NORMAL: "text-reserve", ELEVATED: "text-gold", HIGH_STRESS: "text-gold",
    CRISIS: "text-destructive", RECOVERY: "text-gold",
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/[0.06] to-ink-soft p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gold">
            <Layers className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">
              Dynamic Reserve Rebalancing Dashboard · v24.1.1
            </span>
          </div>
          <Badge className="border-line bg-ink text-fg-muted hover:bg-ink-card">
            <Activity className="mr-1 h-3 w-3" /> Auto-refresh 30s
          </Badge>
        </div>

        {/* Top Level: Reserve Composition */}
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gold/30 bg-gold/[0.06] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Total Reserve</div>
            <div className="font-display mt-1 text-2xl text-gold">100.00%</div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Bullion</div>
            <div className="font-display mt-1 text-lg text-gold">{data.top.bullion.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Range: {(data.reserveState.corridor.bullionMin * 100).toFixed(0)}–{(data.reserveState.corridor.bullionMax * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Fiat</div>
            <div className="font-display mt-1 text-lg text-gold">{data.top.fiat.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Range: {(data.reserveState.corridor.fiatMin * 100).toFixed(0)}–{(data.reserveState.corridor.fiatMax * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-lg border border-line bg-ink p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Digital</div>
            <div className="font-display mt-1 text-lg text-gold">{data.top.digital.toFixed(2)}%</div>
            <div className="text-[10px] text-fg-muted">Max: {(data.reserveState.corridor.digitalMax * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Solvency + CALM */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="flex items-center gap-2 text-gold"><Shield className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-wider">Solvency</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>RR (current): <span className={data.solvency.rr >= 100 ? "text-reserve" : "text-destructive"}>{data.solvency.rr.toFixed(2)}%</span></div>
            <div>Policy RR: <span className="text-fg-muted">{data.solvency.policyRR}%</span></div>
            <div>Strategic RR: <span className="text-fg-muted">{data.solvency.strategicRR}%</span></div>
            <div>Stress-RR: <span className={data.solvency.stressRR >= 100 ? "text-reserve" : "text-gold"}>{data.solvency.stressRR.toFixed(2)}%</span></div>
          </div>
          <div className="mt-3 rounded-lg border border-gold/20 bg-gold/[0.04] p-3">
            <div className="text-[10px] font-semibold uppercase text-gold">CALM — Capital-Adaptive Liability Management</div>
            <div className="mt-1 text-xs text-fg-muted">S_max: {data.solvency.calm.sMax.toLocaleString()} MTQ | Supply: {data.solvency.calm.currentSupply.toLocaleString()}</div>
            <div className="text-xs text-fg-muted">Headroom: {data.solvency.calm.headroom.toLocaleString()} ({data.solvency.calm.headroomPct.toFixed(2)}%)</div>
            <div className="text-xs"><span className="text-gold">Fee: {data.solvency.calm.stabilizationFeeBps} bps</span> | <span className={stateColor[data.solvency.calm.restrictionLevel] || "text-fg-muted"}>{data.solvency.calm.restrictionLevel}</span></div>
            <div className="mt-1 text-[10px] text-fg-muted italic">{data.solvency.calm.reason}</div>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="flex items-center gap-2 text-gold"><TrendingUp className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-wider">Liquidity</span></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>LCR: <span className={data.liquidity.lcr >= 1.0 ? "text-reserve" : "text-destructive"}>{data.liquidity.lcr.toFixed(2)}</span></div>
            <div>LRR: <span className={data.liquidity.lrr >= 1.0 ? "text-reserve" : "text-destructive"}>{data.liquidity.lrr.toFixed(2)}</span></div>
            <div>Prefunded: <span className="text-fg-muted">{data.liquidity.prefundedLiquidity}</span></div>
          </div>
          <div className="mt-3 rounded-lg border border-gold/20 bg-gold/[0.04] p-3">
            <div className="text-[10px] font-semibold uppercase text-gold">Reserve State Engine</div>
            <div className="mt-1 text-lg"><span className={stateColor[data.reserveState.current]}>{data.reserveState.current}</span></div>
            <div className="text-[10px] text-fg-muted">{data.reserveState.reason}</div>
            {data.reserveState.transitioned && <div className="text-[10px] text-gold">↑ Transitioned from {data.reserveState.previous}</div>}
          </div>
        </div>
      </div>

      {/* CBGRS + MRRC */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="flex items-center gap-2 text-gold"><Globe className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-wider">CBGRS — Currency Basket Gold-Relative Strength</span></div>
          <div className="mt-2 text-2xl font-display text-gold">{data.cbgrs.value.toFixed(6)}</div>
          <div className="text-[10px] text-fg-muted">Arithmetic (diagnostic): {data.cbgrs.arithmetic.toFixed(6)} | Change: {(data.cbgrs.changeFromBase * 100).toFixed(4)}%</div>
          <div className="text-[10px] text-fg-muted italic">Layer 2 · Advisory only · Does NOT replace RR</div>
        </div>
        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="flex items-center gap-2 text-gold"><DollarSign className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-wider">MRRC — Marginal Risk Contribution</span></div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div>CVaR 95%: <span className="text-gold">{data.mrrc.cvar95.toFixed(4)}</span></div>
            <div>CVaR 99%: <span className="text-gold">{data.mrrc.cvar99.toFixed(4)}</span></div>
          </div>
          <div className="mt-2 max-h-32 overflow-y-auto rounded border border-line">
            <table className="w-full text-[10px]">
              <thead className="bg-ink-card text-fg-muted"><tr><th className="px-2 py-1 text-left">Asset</th><th className="px-2 py-1 text-right">MRRC</th><th className="px-2 py-1 text-right">Risk%</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.mrrc.results.slice(0, 8).map(r => (
                  <tr key={r.asset}><td className="px-2 py-1">{r.asset}</td><td className="px-2 py-1 text-right">{r.mrrc.toFixed(4)}</td><td className="px-2 py-1 text-right">{r.riskContributionPct.toFixed(1)}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Currency Table */}
      <div className="rounded-xl border border-line bg-ink-card p-5">
        <div className="flex items-center gap-2 text-gold"><Activity className="h-4 w-4" /><span className="text-[11px] font-semibold uppercase tracking-wider">Currency Lifecycle + Rebalancing</span></div>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[800px] text-xs">
            <thead className="bg-ink text-fg-muted">
              <tr><th className="px-2 py-2 text-left">Currency</th><th className="px-2 py-2 text-right">Current</th><th className="px-2 py-2 text-right">Target</th><th className="px-2 py-2 text-right">G_i(t)</th><th className="px-2 py-2 text-right">Deprec.</th><th className="px-2 py-2 text-right">MRRC</th><th className="px-2 py-2 text-center">Lifecycle</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.currencies.map(c => (
                <tr key={c.currency}>
                  <td className="px-2 py-2 font-medium">{c.currency}</td>
                  <td className="px-2 py-2 text-right">{(c.currentWeight * 100).toFixed(2)}%</td>
                  <td className="px-2 py-2 text-right">{(c.targetWeight * 100).toFixed(2)}%</td>
                  <td className="px-2 py-2 text-right">{c.goldRelativeStrength.toFixed(4)}</td>
                  <td className="px-2 py-2 text-right">{(c.goldRelativeDepreciation * 100).toFixed(2)}%</td>
                  <td className="px-2 py-2 text-right">{c.mrrc.toFixed(4)}</td>
                  <td className="px-2 py-2 text-center"><span className={stateColor[c.lifecycleState] || "text-fg-muted"}>{c.lifecycleState}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custody + Rebalancing Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gold">Custody Concentration</div>
          <div className="mt-2 text-xs">Common-mode score: <span className="text-gold">{(data.custody.commonModeScore * 100).toFixed(1)}%</span></div>
          <div className="mt-1 max-h-32 overflow-y-auto">
            <table className="w-full text-[10px]">
              <thead className="text-fg-muted"><tr><th className="px-2 py-1 text-left">Custodian</th><th className="px-2 py-1 text-right">Weight</th><th className="px-2 py-1 text-left">Jurisdiction</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.custody.custodians.map((c, i) => (
                  <tr key={i}><td className="px-2 py-1">{c.name}</td><td className="px-2 py-1 text-right">{(c.weight * 100).toFixed(1)}%</td><td className="px-2 py-1">{c.jurisdiction}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-ink-card p-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gold">Rebalancing Actions ({data.rebalancing.totalActions})</div>
          <div className="mt-1 text-xs">Severity: <span className="text-gold">{data.rebalancing.maxSeverity}</span> | Cost: {data.rebalancing.estimatedCost.toFixed(0)}bps | Approval: {data.rebalancing.approvalRequired ? "Required" : "Auto"}</div>
          <div className="mt-1 max-h-32 overflow-y-auto text-[10px] text-fg-muted">
            {data.rebalancing.explainability.length > 0 ? data.rebalancing.explainability.map((e, i) => <div key={i}>• {e}</div>) : <div>No rebalancing actions needed</div>}
          </div>
        </div>
      </div>

      {/* Defense Hierarchy */}
      <div className="rounded-xl border border-gold/30 bg-gold/[0.04] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-gold">Defense Hierarchy (§51) — Never solve risk by simply increasing reserves</div>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-fg-muted">
          {data.defenseHierarchy.map((d, i) => <span key={i} className="rounded border border-line bg-ink px-2 py-1">{d}</span>)}
        </div>
      </div>
    </div>
  );
}
