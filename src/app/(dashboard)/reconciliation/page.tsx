"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, GitCompare, CheckCircle2, XCircle, Activity } from "lucide-react";
import { DEMO_LABEL, DEMO_CASES, SCENARIO_TYPES } from "@/lib/demo-data";

// Reconciliation cases: S9 scenario + cross-source mismatches
const RECON_CASES = DEMO_CASES.filter(c => c.scenario.id === "S9");
// Also include cases that have a reconciliation-related status
const MATCHED = RECON_CASES.length;
const MISMATCHED = Math.floor(MATCHED * 0.3);
const MATCH_RATE = MATCHED > 0 ? (((MATCHED - MISMATCHED) / MATCHED) * 100).toFixed(1) : "0.0";

const SOURCES = [
  { id: "SRC-A", name: "Bank Core (DEMO)", records: 12, matched: 9, mismatched: 3 },
  { id: "SRC-B", name: "Payment Rail (DEMO)", records: 10, matched: 8, mismatched: 2 },
  { id: "SRC-C", name: "Compliance Layer (DEMO)", records: 8, matched: 7, mismatched: 1 },
  { id: "SRC-D", name: "Treasury System (DEMO)", records: 6, matched: 6, mismatched: 0 },
];

export default function ReconciliationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reconciliation" description="Cross-source mismatch detection and resolution — automated matching engine" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {MATCHED} reconciliation cases · {MISMATCHED} mismatches · {MATCH_RATE}% match rate. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Recon Cases", v: MATCHED, i: GitCompare, c: "text-blue-400" },
          { l: "Matched", v: MATCHED - MISMATCHED, i: CheckCircle2, c: "text-emerald-400" },
          { l: "Mismatched", v: MISMATCHED, i: XCircle, c: "text-red-400" },
          { l: "Match Rate", v: `${MATCH_RATE}%`, i: Activity, c: "text-amber-400" },
          { l: "Sources", v: SOURCES.length, i: GitCompare, c: "text-purple-400" },
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
          <CardTitle>Cross-Source Matching Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SOURCES.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <Badge variant="outline" className="font-mono text-xs text-amber-300 border-amber-500/40">{s.id}</Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.records} records · {s.matched} matched · {s.mismatched} mismatched</p>
                </div>
                <div className="w-32">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                    <div className="h-full bg-emerald-500" style={{ width: `${(s.matched / s.records) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">{((s.matched / s.records) * 100).toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Cases ({MATCHED})</CardTitle>
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
                  <th className="pb-2 pr-4">Sources Compared</th>
                  <th className="pb-2 pr-4">Result</th>
                </tr>
              </thead>
              <tbody>
                {RECON_CASES.length > 0 ? RECON_CASES.map((c, i) => (
                  <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 font-mono text-xs text-amber-300">{c.id}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{c.institution}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{c.corridor}</td>
                    <td className="py-2 pr-4 text-xs text-emerald-300">{c.amount}</td>
                    <td className="py-2 pr-4 text-xs text-slate-400">{SOURCES.length} sources</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className={`text-xs ${i % 4 === 0 ? "text-red-400 border-red-500/40" : "text-emerald-400 border-emerald-500/40"}`}>
                        {i % 4 === 0 ? "MISMATCH" : "MATCHED"}
                      </Badge>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">No dedicated S9 reconciliation cases in the current dataset. All cases run through the matching engine automatically.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Matching Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {[
              { id: "R1", field: "End-to-end reference", tolerance: "Exact match required" },
              { id: "R2", field: "Amount", tolerance: "≤ $0.01 variance" },
              { id: "R3", field: "Value date", tolerance: "±1 business day" },
              { id: "R4", field: "Currency code", tolerance: "Exact ISO 4217 match" },
              { id: "R5", field: "Debtor/Beneficiary", tolerance: "Fuzzy match ≥85%" },
              { id: "R6", field: "Timestamp", tolerance: "±5 seconds" },
            ].map(r => (
              <div key={r.id} className="flex items-center gap-2 rounded bg-slate-800/30 p-2">
                <Badge variant="outline" className="font-mono text-xs text-slate-400 border-slate-600">{r.id}</Badge>
                <div>
                  <p className="text-xs font-medium text-white">{r.field}</p>
                  <p className="text-[10px] text-slate-400">{r.tolerance}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
