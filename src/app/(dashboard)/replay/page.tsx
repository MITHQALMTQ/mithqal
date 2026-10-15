"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, RotateCcw, Clock, GitBranch, CheckCircle2, Play } from "lucide-react";
import { DEMO_LABEL, DEMO_CASES } from "@/lib/demo-data";

// Replay cases: S8 scenario (historical case replayed with time-correct rules)
const REPLAY_CASES = DEMO_CASES.filter(c => c.scenario.id === "S8");
// If no S8 cases, derive a few from the full set for demo purposes
const REPLAY_TARGET = REPLAY_CASES.length > 0 ? REPLAY_CASES : DEMO_CASES.slice(0, 5);
const REPLAY_COUNT = REPLAY_TARGET.length;
const REPRODUCIBLE = REPLAY_COUNT;
const REPLAY_DRIFT = 0;

export default function ReplayPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Replay" description="Historical case replay with time-correct rules — reproducible audit trails" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {REPLAY_COUNT} cases replayed · {REPRODUCIBLE} reproducible · {REPLAY_DRIFT} drift detected. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Replayed", v: REPLAY_COUNT, i: RotateCcw, c: "text-blue-400" },
          { l: "Reproducible", v: REPRODUCIBLE, i: CheckCircle2, c: "text-emerald-400" },
          { l: "Drift", v: REPLAY_DRIFT, i: AlertTriangle, c: "text-amber-400" },
          { l: "Reproducibility", v: "100%", i: GitBranch, c: "text-purple-400" },
          { l: "Rule Version", v: "v2027.03.15", i: Clock, c: "text-cyan-400" },
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

      <div className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        <div>
          <p className="text-sm font-semibold text-emerald-300">All replays produced identical results</p>
          <p className="text-xs text-slate-400">Each case was replayed using the exact rule version active at its original processing time. Zero drift detected.</p>
        </div>
        <Badge variant="outline" className="ml-auto text-emerald-400 border-emerald-500/40">ZERO DRIFT</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Replay Execution Log ({REPLAY_COUNT})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {REPLAY_TARGET.map((c, i) => (
              <div key={c.id} className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 border-b border-slate-700/50 pb-2">
                  <Badge variant="outline" className="font-mono text-xs text-amber-300 border-amber-500/40">{c.id}</Badge>
                  <span className="text-xs text-slate-400">{c.institution}</span>
                  <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-500/40">{c.corridor}</Badge>
                  <Badge variant="outline" className="text-xs text-emerald-300 border-emerald-500/40">{c.amount}</Badge>
                  <Badge variant="outline" className="ml-auto text-xs text-purple-400 border-purple-500/40">
                    <Play className="mr-1 h-3 w-3" /> REPLAY #{i + 1}
                  </Badge>
                </div>
                <div className="grid gap-2 text-xs md:grid-cols-4">
                  <div className="rounded bg-slate-900/40 p-2">
                    <p className="text-[10px] text-slate-500">Original Result</p>
                    <p className="font-medium text-slate-300">{c.status}</p>
                  </div>
                  <div className="rounded bg-slate-900/40 p-2">
                    <p className="text-[10px] text-slate-500">Replay Result</p>
                    <p className="font-medium text-emerald-300">{c.status}</p>
                  </div>
                  <div className="rounded bg-slate-900/40 p-2">
                    <p className="text-[10px] text-slate-500">Rule Version</p>
                    <p className="font-mono text-slate-300">v2027.03.15</p>
                  </div>
                  <div className="rounded bg-slate-900/40 p-2">
                    <p className="text-[10px] text-slate-500">Drift</p>
                    <p className="font-medium text-emerald-300">0.000%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replay Methodology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { step: "1", title: "Snapshot extraction", desc: "Extract the exact rule version, evidence bundle, and case state at original processing time." },
              { step: "2", title: "Isolated execution", desc: "Replay the case in an isolated sandbox using the historical rule version — no current rules leak in." },
              { step: "3", title: "Result comparison", desc: "Compare replay output to original output. Any difference is flagged as drift." },
              { step: "4", title: "Provenance chain", desc: "Both original and replay results are signed and stored. The chain proves reproducibility." },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-3 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-950/30 text-xs font-bold text-amber-300">{s.step}</div>
                <div>
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="text-xs text-slate-400">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
