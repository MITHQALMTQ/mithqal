"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, AlertOctagon, XCircle } from "lucide-react";
import { DEMO_LABEL, DEMO_EXCEPTIONS } from "@/lib/demo-data";

const SC: Record<string, string> = {
  OPEN: "text-red-400 border-red-500/40",
  IN_PROGRESS: "text-amber-400 border-amber-500/40",
  ESCALATED: "text-orange-400 border-orange-500/40",
  RESOLVED: "text-emerald-400 border-emerald-500/40",
  CLOSED: "text-slate-400 border-slate-500/40",
};
const SV: Record<string, string> = {
  LOW: "text-blue-400 border-blue-500/40",
  MEDIUM: "text-amber-400 border-amber-500/40",
  HIGH: "text-orange-400 border-orange-500/40",
  CRITICAL: "text-red-400 border-red-500/40",
};
const SV_ICON: Record<string, typeof AlertTriangle> = {
  LOW: CheckCircle2,
  MEDIUM: Clock,
  HIGH: AlertTriangle,
  CRITICAL: AlertOctagon,
};

const byStatus = (s: string) => DEMO_EXCEPTIONS.filter(e => e.status === s);
const bySeverity = (s: string) => DEMO_EXCEPTIONS.filter(e => e.severity === s);

export default function ExceptionsPage() {
  const open = byStatus("OPEN").length;
  const inProgress = byStatus("IN_PROGRESS").length;
  const escalated = byStatus("ESCALATED").length;
  const resolved = byStatus("RESOLVED").length + byStatus("CLOSED").length;
  const critical = bySeverity("CRITICAL").length;
  const high = bySeverity("HIGH").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Exceptions" description="Exception management board — maker-checker workflow with safe halt and recovery" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {DEMO_EXCEPTIONS.length} exceptions across {DEMO_EXCEPTIONS.length} cases. {critical} critical, {high} high. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { l: "Total", v: DEMO_EXCEPTIONS.length, i: AlertTriangle, c: "text-blue-400" },
          { l: "Open", v: open, i: XCircle, c: "text-red-400" },
          { l: "In Progress", v: inProgress, i: Clock, c: "text-amber-400" },
          { l: "Escalated", v: escalated, i: AlertOctagon, c: "text-orange-400" },
          { l: "Resolved", v: resolved, i: CheckCircle2, c: "text-emerald-400" },
          { l: "Critical", v: critical, i: AlertOctagon, c: "text-red-400" },
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(SV).map(([sev, cls]) => {
          const items = bySeverity(sev);
          const Icon = SV_ICON[sev];
          return (
            <Card key={sev}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{sev}</CardTitle>
                  <Icon className={`h-4 w-4 ${cls.split(" ")[0]}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2 text-2xl font-bold text-white">{items.length}</p>
                <div className="space-y-1.5">
                  {items.slice(0, 3).map(e => (
                    <div key={e.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className="font-mono text-slate-500">{e.id}</span>
                      <span className="truncate text-slate-400">{e.code}</span>
                    </div>
                  ))}
                  {items.length > 3 && <p className="text-[10px] text-slate-500">+{items.length - 3} more…</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exception Board ({DEMO_EXCEPTIONS.length}) — All Exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-900/95">
                <tr className="border-b border-slate-700 text-left text-xs text-slate-400">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Case</th>
                  <th className="pb-2 pr-4">Code</th>
                  <th className="pb-2 pr-4">Severity</th>
                  <th className="pb-2 pr-4">Owner</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_EXCEPTIONS.map(e => (
                  <tr key={e.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-2 pr-4 font-mono text-xs text-amber-300">{e.id}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-300">{e.caseId}</td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{e.code}</td>
                    <td className="py-2 pr-4"><Badge variant="outline" className={`text-xs ${SV[e.severity]}`}>{e.severity}</Badge></td>
                    <td className="py-2 pr-4 text-xs text-slate-300">{e.owner}</td>
                    <td className="py-2 pr-4"><Badge variant="outline" className={`text-xs ${SC[e.status]}`}>{e.status}</Badge></td>
                    <td className="py-2 pr-4 text-xs text-slate-400 max-w-xs truncate">{e.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolution Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"].map((s, i, arr) => (
              <div key={s} className="flex items-center gap-2">
                <div className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-center">
                  <Badge variant="outline" className={`text-xs ${SC[s]}`}>{s}</Badge>
                  <p className="mt-1 text-sm font-bold text-white">{byStatus(s).length}</p>
                </div>
                {i < arr.length - 1 && <span className="text-slate-500">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
