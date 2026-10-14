"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { DEMO_LABEL } from "@/lib/demo-data";
export default function Page() {
  return (<div className="space-y-6"><PageHeader title="Replay" description="MITHQAL Assurance — Replay page" /><Alert className="border-amber-500/40 bg-amber-950/20"><AlertTriangle className="h-4 w-4 text-amber-400" /><AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle><AlertDescription className="text-slate-300 text-sm">Production authorization: FALSE. MTQ Σ: NOT AUTHORIZED.</AlertDescription></Alert><div className="p-8 rounded-xl bg-slate-800/30 border border-slate-700/50"><p className="text-slate-400 text-center">This page displays simulated data. Full content available in the controlled pilot phase (Gate 1).</p></div></div>);
}
