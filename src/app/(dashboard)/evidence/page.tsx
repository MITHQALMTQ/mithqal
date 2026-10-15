"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileCheck, ShieldCheck, Hash, Download, Search } from "lucide-react";
import { DEMO_LABEL, DEMO_EVENTS, DEMO_CASES } from "@/lib/demo-data";

const SIG_COLORS: Record<string, string> = {
  VERIFIED: "text-emerald-400 border-emerald-500/40",
  UNVERIFIED: "text-red-400 border-red-500/40",
};

// Build evidence bundles: each case has a bundle of all its events
const bundleByCase = DEMO_EVENTS.reduce((acc, e) => {
  (acc[e.caseId] = acc[e.caseId] || []).push(e);
  return acc;
}, {} as Record<string, typeof DEMO_EVENTS>);

export default function EvidencePage() {
  const caseIds = Object.keys(bundleByCase).sort();
  const verified = DEMO_EVENTS.filter(e => e.sig === "VERIFIED").length;
  const unverified = DEMO_EVENTS.length - verified;

  return (
    <div className="space-y-6">
      <PageHeader title="Evidence" description="Evidence bundles with full provenance — reproducible audit trails" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {DEMO_EVENTS.length} evidence events in {caseIds.length} bundles. {verified} verified, {unverified} unverified. Production: FALSE.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Total Events", v: DEMO_EVENTS.length, i: FileCheck, c: "text-blue-400" },
          { l: "Bundles", v: caseIds.length, i: Hash, c: "text-amber-400" },
          { l: "Verified", v: verified, i: ShieldCheck, c: "text-emerald-400" },
          { l: "Unverified", v: unverified, i: AlertTriangle, c: "text-red-400" },
          { l: "Integrity", v: `${((verified / DEMO_EVENTS.length) * 100).toFixed(0)}%`, i: Search, c: "text-purple-400" },
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
          <CardTitle>Evidence Integrity Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-sm font-semibold text-emerald-300">
                {verified}/{DEMO_EVENTS.length} events cryptographically signed
              </p>
              <p className="text-xs text-slate-400">
                Bundles are tamper-evident. Any modification to a signed event invalidates the chain. Replay produces identical results.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto text-emerald-400 border-emerald-500/40">CHAIN VALID</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Bundles ({caseIds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto space-y-3">
            {caseIds.map(cid => {
              const events = bundleByCase[cid];
              const caseRec = DEMO_CASES.find(c => c.id === cid);
              const caseVerified = events.filter(e => e.sig === "VERIFIED").length;
              return (
                <div key={cid} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-slate-700/50 pb-2">
                    <Badge variant="outline" className="font-mono text-xs text-amber-300 border-amber-500/40">BUNDLE {cid}</Badge>
                    {caseRec && (
                      <>
                        <span className="text-xs text-slate-400">{caseRec.institution}</span>
                        <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/40">{caseRec.corridor}</Badge>
                      </>
                    )}
                    <Badge variant="outline" className={`ml-auto text-xs ${caseVerified === events.length ? SIG_COLORS.VERIFIED : SIG_COLORS.UNVERIFIED}`}>
                      {caseVerified}/{events.length} signed
                    </Badge>
                    <button className="rounded border border-slate-600 px-2 py-0.5 text-[10px] text-slate-400 hover:bg-slate-700/50">
                      <Download className="inline h-3 w-3" /> Export
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {events.map(e => (
                      <div key={e.id} className="flex flex-wrap items-center gap-2 rounded bg-slate-900/40 px-3 py-1.5">
                        <span className="font-mono text-[10px] text-slate-500">{e.time}</span>
                        <span className="text-xs font-medium text-slate-300">{e.type}</span>
                        <span className="text-xs text-slate-500">{e.source}</span>
                        <span className="ml-auto font-mono text-[10px] text-slate-500">{e.id}</span>
                        <Badge variant="outline" className={`text-[10px] ${SIG_COLORS[e.sig]}`}>
                          {e.sig}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
