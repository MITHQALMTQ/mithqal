"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Settings, ShieldCheck, Database, GitBranch, Lock, Cpu, Clock, FileCheck } from "lucide-react";
import { DEMO_LABEL, STRESS_RESULTS } from "@/lib/demo-data";

const CONFIG_ITEMS = [
  { category: "Environment", items: [
    { k: "NODE_ENV", v: "production", status: "ACTIVE" },
    { k: "Deployment", v: "Vercel (auto-deploy from main)", status: "ACTIVE" },
    { k: "Region", v: "iad1 (US East)", status: "ACTIVE" },
    { k: "Runtime", v: "Node.js 20 (serverless)", status: "ACTIVE" },
  ]},
  { category: "Authorization Gates", items: [
    { k: "Production Authorized", v: "FALSE", status: "BLOCKED" },
    { k: "MTQ Σ Authorized", v: "NOT AUTHORIZED", status: "BLOCKED" },
    { k: "Gate 1 (Pilot)", v: "NOT STARTED", status: "PENDING" },
    { k: "Gate 2 (Production)", v: "NOT STARTED", status: "PENDING" },
    { k: "External Counsel (G0)", v: "NOT ENGAGED", status: "PENDING" },
  ]},
  { category: "Rules & Validation", items: [
    { k: "Rules Version", v: "v2027.03.15", status: "ACTIVE" },
    { k: "Validation Engine", v: "CBPR+ ISO 20022", status: "ACTIVE" },
    { k: "Sanctions Screening", v: "DEMO (simulated)", status: "DEMO" },
    { k: "LEI Verification", v: "DEMO (simulated)", status: "DEMO" },
    { k: "Idempotency Check", v: "Enabled (100%)", status: "ACTIVE" },
  ]},
  { category: "Data & Storage", items: [
    { k: "Database", v: "Turso (libsql) — file mode", status: "ACTIVE" },
    { k: "Historical Snapshots", v: "0 days (cold start)", status: "PENDING" },
    { k: "Evidence Storage", v: "In-memory (DEMO)", status: "DEMO" },
    { k: "Retention Policy", v: "7 years (target)", status: "PENDING" },
  ]},
  { category: "Security", items: [
    { k: "X-Frame-Options", v: "DENY", status: "ACTIVE" },
    { k: "CSP", v: "Enabled (unsafe-inline for Turbopack)", status: "ACTIVE" },
    { k: "HSTS", v: "max-age=31536000", status: "ACTIVE" },
    { k: "Rate Limiting", v: "30 req/min per IP", status: "ACTIVE" },
    { k: "Audit Logging", v: "DEMO (console only)", status: "DEMO" },
  ]},
  { category: "Integrations", items: [
    { k: "Inngest (workflows)", v: "Code present, not deployed", status: "PENDING" },
    { k: "Oracle (gold/silver)", v: "Multi-source consensus", status: "ACTIVE" },
    { k: "FX (er-api.com)", v: "Live + fallback", status: "ACTIVE" },
    { k: "Crypto (CoinGecko)", v: "Live + fallback", status: "ACTIVE" },
    { k: "On-chain (Arc testnet)", v: "Read-only oracle", status: "ACTIVE" },
  ]},
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-emerald-400 border-emerald-500/40",
  BLOCKED: "text-red-400 border-red-500/40",
  PENDING: "text-amber-400 border-amber-500/40",
  DEMO: "text-cyan-400 border-cyan-500/40",
};

const CAT_ICONS: Record<string, typeof Settings> = {
  "Environment": Cpu,
  "Authorization Gates": ShieldCheck,
  "Rules & Validation": FileCheck,
  "Data & Storage": Database,
  "Security": Lock,
  "Integrations": GitBranch,
};

export default function SettingsPage() {
  const active = CONFIG_ITEMS.flatMap(c => c.items).filter(i => i.status === "ACTIVE").length;
  const blocked = CONFIG_ITEMS.flatMap(c => c.items).filter(i => i.status === "BLOCKED").length;
  const pending = CONFIG_ITEMS.flatMap(c => c.items).filter(i => i.status === "PENDING").length;
  const demo = CONFIG_ITEMS.flatMap(c => c.items).filter(i => i.status === "DEMO").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform configuration — environment, gates, rules, and integrations" />
      <Alert className="border-amber-500/40 bg-amber-950/20">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-300">{DEMO_LABEL}</AlertTitle>
        <AlertDescription className="text-slate-300 text-sm">
          {active} active · {blocked} blocked · {pending} pending · {demo} demo. Production: FALSE. MTQ Σ: NOT AUTHORIZED.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Active", v: active, i: ShieldCheck, c: "text-emerald-400" },
          { l: "Blocked", v: blocked, i: AlertTriangle, c: "text-red-400" },
          { l: "Pending", v: pending, i: Clock, c: "text-amber-400" },
          { l: "Demo Mode", v: demo, i: Cpu, c: "text-cyan-400" },
          { l: "Build", v: "v25.7", i: GitBranch, c: "text-purple-400" },
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

      {CONFIG_ITEMS.map(cat => {
        const Icon = CAT_ICONS[cat.category] || Settings;
        return (
          <Card key={cat.category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-amber-400" />
                <CardTitle>{cat.category}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {cat.items.map(item => (
                  <div key={item.k} className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/30 p-3">
                    <div>
                      <p className="text-xs font-medium text-white">{item.k}</p>
                      <p className="text-[10px] text-slate-400">{item.v}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[item.status]}`}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>Last Stress Test Run</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-4">
            {[
              { l: "Test", v: STRESS_RESULTS.testName },
              { l: "Duration", v: STRESS_RESULTS.duration },
              { l: "Result", v: STRESS_RESULTS.result },
              { l: "Cases", v: `${STRESS_RESULTS.casesProcessed} processed · ${STRESS_RESULTS.casesPassed} passed` },
            ].map(r => (
              <div key={r.l} className="rounded bg-slate-800/30 p-2">
                <p className="text-[10px] text-slate-400">{r.l}</p>
                <p className="text-sm font-semibold text-white">{r.v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
