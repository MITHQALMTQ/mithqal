"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Map, Activity, DollarSign, Building2, TrendingUp } from "lucide-react";
import { DEMO_LABEL, DEMO_CASES, DEMO_INSTITUTIONS } from "@/lib/demo-data";

// Group cases by corridor
const byCorridor = DEMO_CASES.reduce((acc, c) => {
  (acc[c.corridor] = acc[c.corridor] || []).push(c);
  return acc;
}, {} as Record<string, typeof DEMO_CASES>);

// Parse amounts for totals
const parseAmount = (s: string) => Number(s.replace(/[$,]/g, "")) || 0;

const corridorStats = Object.entries(byCorridor).map(([corridor, cases]) => {
  const total = cases.reduce((sum, c) => sum + parseAmount(c.amount), 0);
  return { corridor, cases: cases.length, totalValue: total };
}).sort((a, b) => b.totalValue - a.totalValue);

const totalValue = corridorStats.reduce((s, c) => s + c.totalValue, 0);
const totalCases = DEMO_CASES.length;

// Group by institution
const byInstitution = DEMO_INSTITUTIONS.map(inst => {
  const cases = DEMO_CASES.filter(c => c.institution === inst.name);
  const value = cases.reduce((s, c) => s + parseAmount(c.amount), 0);
  return { ...inst, caseCount: cases.length, value };
});

export default function CorridorPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Corridor" description="Cross-border corridor analytics — volume, value, and status per route" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {totalCases} cases · {corridorStats.length} corridors · ${totalValue.toLocaleString()} total value. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Total Cases", v: totalCases, i: Map, c: "text-blue-400" },
          { l: "Corridors", v: corridorStats.length, i: Activity, c: "text-amber-400" },
          { l: "Total Value", v: `$${(totalValue / 1e6).toFixed(1)}M`, i: DollarSign, c: "text-emerald-400" },
          { l: "Institutions", v: DEMO_INSTITUTIONS.length, i: Building2, c: "text-purple-400" },
          { l: "Avg / Corridor", v: `${(totalCases / corridorStats.length).toFixed(1)}`, i: TrendingUp, c: "text-cyan-400" },
        ].map(m => (
          <Card key={m.l}>
            <CardContent className="p-4">
              <m.i className={`h-5 w-5 mb-2 ${m.c}`} />
              <p className="text-xs text-slate-400">{m.l}</p>
              <p className="text-xl font-bold text-white">{m.v}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Corridor Volume & Value ({corridorStats.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {corridorStats.map(cs => {
              const pct = (cs.totalValue / totalValue) * 100;
              return (
                <div key={cs.corridor} className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                  <Badge variant="outline" className="font-mono text-xs text-amber-300 border-amber-500/40">{cs.corridor}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{cs.cases} cases · ${cs.totalValue.toLocaleString()}</p>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-Institution Breakdown ({DEMO_INSTITUTIONS.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {byInstitution.map(inst => (
              <div key={inst.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-[10px] text-slate-400 border-slate-600">{inst.id}</Badge>
                  <Badge variant="outline" className="text-[10px] text-cyan-400 border-cyan-500/40">{inst.jurisdiction}</Badge>
                </div>
                <p className="text-sm font-medium text-white">{inst.name}</p>
                <p className="text-[10px] text-slate-500">{inst.type}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/50 pt-2">
                  <div>
                    <p className="text-[10px] text-slate-500">Cases</p>
                    <p className="text-lg font-bold text-amber-300">{inst.caseCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500">Value</p>
                    <p className="text-lg font-bold text-emerald-300">${(inst.value / 1e6).toFixed(2)}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Corridor Cases ({DEMO_CASES.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/95">
                <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                  <th className="pb-2 pr-4">Case ID</th>
                  <th className="pb-2 pr-4">Institution</th>
                  <th className="pb-2 pr-4">Corridor</th>
                  <th className="pb-2 pr-4">Amount</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Scenario</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_CASES.map(c => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 font-mono text-xs text-amber-300">{c.id}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{c.institution}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-cyan-300">{c.corridor}</td>
                    <td className="py-2 pr-4 text-xs text-emerald-300">{c.amount}</td>
                    <td className="py-2 pr-4"><Badge variant="outline" className="text-xs text-slate-400 border-slate-600">{c.status}</Badge></td>
                    <td className="py-2 pr-4"><Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">{c.scenario.id}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
