"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, GitBranch, ShieldCheck, Filter } from "lucide-react";
import { DEMO_LABEL, DEMO_EVENTS, DEMO_CASES } from "@/lib/demo-data";

const TYPE_COLORS: Record<string, string> = {
  RECORD_RECEIVED: "text-blue-400 border-blue-500/40",
  SOURCE_AUTHENTICATED: "text-cyan-400 border-cyan-500/40",
  VALIDATION_PASSED: "text-emerald-400 border-emerald-500/40",
  EXCEPTION_OPENED: "text-red-400 border-red-500/40",
  HUMAN_APPROVAL_RECORDED: "text-purple-400 border-purple-500/40",
  PROVIDER_ACKNOWLEDGEMENT_RECEIVED: "text-amber-400 border-amber-500/40",
  SETTLEMENT_CONFIRMATION_RECEIVED: "text-emerald-400 border-emerald-500/40",
  RECONCILIATION_COMPLETED: "text-teal-400 border-teal-500/40",
  EVIDENCE_CONFLICT_DETECTED: "text-orange-400 border-orange-500/40",
  DISPUTE_OPENED: "text-red-400 border-red-500/40",
};

// Group events by case ID for timeline sections
const eventsByCase = DEMO_EVENTS.reduce((acc, e) => {
  (acc[e.caseId] = acc[e.caseId] || []).push(e);
  return acc;
}, {} as Record<string, typeof DEMO_EVENTS>);

export default function TimelinePage() {
  const caseIds = Object.keys(eventsByCase).sort();
  return (
    <div className="space-y-6">
      <PageHeader title="Timeline" description="Chronological event feed — full provenance chain per validation case" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {DEMO_EVENTS.length} evidence events across {caseIds.length} cases. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Total Events", v: DEMO_EVENTS.length, i: Clock, c: "text-blue-400" },
          { l: "Cases Tracked", v: caseIds.length, i: GitBranch, c: "text-emerald-400" },
          { l: "Verified Sigs", v: `${DEMO_EVENTS.filter(e => e.sig === "VERIFIED").length}/${DEMO_EVENTS.length}`, i: ShieldCheck, c: "text-purple-400" },
          { l: "Event Types", v: Object.keys(TYPE_COLORS).length, i: Filter, c: "text-amber-400" },
          { l: "Date", v: "2027-03-15", i: Clock, c: "text-cyan-400" },
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
          <CardTitle>Event Legend ({Object.keys(TYPE_COLORS).length} types)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPE_COLORS).map(([type, cls]) => (
              <Badge key={type} variant="outline" className={`text-xs font-mono ${cls}`}>
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-Case Timeline ({caseIds.length} cases)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto space-y-4">
            {caseIds.map(cid => {
              const events = eventsByCase[cid];
              const caseRec = DEMO_CASES.find(c => c.id === cid);
              return (
                <div key={cid} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-700/50 pb-2">
                    <Badge variant="outline" className="font-mono text-xs text-amber-300 border-amber-500/40">{cid}</Badge>
                    {caseRec && (
                      <>
                        <span className="text-xs text-slate-400">{caseRec.institution}</span>
                        <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/40">{caseRec.corridor}</Badge>
                        <Badge variant="outline" className="text-xs text-emerald-300 border-emerald-500/40">{caseRec.amount}</Badge>
                      </>
                    )}
                    <Badge variant="outline" className="ml-auto text-xs text-slate-400 border-slate-600">{events.length} events</Badge>
                  </div>
                  <ol className="relative space-y-2 border-l border-slate-700/50 pl-4">
                    {events.map(e => (
                      <li key={e.id} className="relative">
                        <span className="absolute -left-[18px] top-1 h-2 w-2 rounded-full bg-amber-400" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">{e.time}</span>
                          <Badge variant="outline" className={`text-[10px] font-mono ${TYPE_COLORS[e.type] || "text-slate-400 border-slate-600"}`}>
                            {e.type}
                          </Badge>
                          <span className="text-xs text-slate-400">{e.source}</span>
                          <Badge variant="outline" className={`ml-auto text-[10px] ${e.sig === "VERIFIED" ? "text-emerald-400 border-emerald-500/40" : "text-red-400 border-red-500/40"}`}>
                            {e.sig}
                          </Badge>
                          <span className="font-mono text-[10px] text-slate-500">{e.id}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
