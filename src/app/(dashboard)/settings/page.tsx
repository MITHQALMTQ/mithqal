"use client";

import { Database, Info, Key, Monitor, Moon, Server, ShieldCheck, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { evaluateMtqGate } from "@/lib/mtq-gate";

/**
 * Settings page — MITHQAL-TECH-SPEC-001 §3.4.6 (honest state display).
 *
 * Read-only configuration surface. No production toggles — the truth
 * state (mtqDisabled=true, productionAuthorized=false) is NOT a
 * switchable preference; it is the canonical gate state from
 * `mtq-gate.ts` and only changes via signed release commits.
 *
 * What this page does expose honestly:
 *   - Theme toggle (UI preference only, persists to localStorage)
 *   - API base URL (read from env at build time, never logged as secret)
 *   - MTQ gate status (8 gates, all not-held)
 *   - Inngest status (registered, no functions executed)
 *   - Database backend (Neon Postgres, schema defined, migrations NOT applied)
 */

const POLICY = evaluateMtqGate();

function GateRow({ label, held, evidence }: { label: string; held: boolean; evidence: string }) {
  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`size-1.5 rounded-full ${held ? "bg-emerald-500" : "bg-rose-500"}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{label}</span>
        {held ? (
          <Badge variant="default" className="ml-auto">
            HELD
          </Badge>
        ) : (
          <Badge variant="destructive" className="ml-auto">
            NOT HELD
          </Badge>
        )}
      </div>
      <p className="pl-3.5 text-xs text-muted-foreground">{evidence}</p>
    </li>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a stable placeholder on SSR.
  // Defer the setState to the next microtask so we don't trip the
  // react-hooks/set-state-in-effect rule (mirrors the pattern in
  // src/hooks/use-mobile.ts).
  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Monitor className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm text-muted-foreground">Loading theme…</span>
      </div>
    );
  }

  const isDark = theme === "dark";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Sun className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
        <div className="space-y-0.5">
          <Label htmlFor="theme-switch" className="text-sm font-medium">
            Dark mode
          </Label>
          <p className="text-xs text-muted-foreground">UI preference only (persisted)</p>
        </div>
      </div>
      <Switch
        id="theme-switch"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
    </div>
  );
}

function ApiConfigRow({
  label,
  value,
  redacted = false,
}: {
  label: string;
  value: string;
  redacted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <code className="font-mono text-xs">{redacted ? "•••••••• (redacted)" : value}</code>
    </div>
  );
}

export default function SettingsPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
  const inngestRegistered = Boolean(process.env.NEXT_PUBLIC_INNGEST_REGISTERED ?? "true");

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Read-only configuration surface — pilot scope" />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Honest state — no production toggles</AlertTitle>
        <AlertDescription>
          The MTQ gate state below is NOT a switchable preference. It is the canonical evaluation
          from <code className="font-mono">src/lib/mtq-gate.ts</code> and only changes via a signed
          release commit that updates the gate fields. No setting on this page can authorise
          production.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sun className="size-4" aria-hidden="true" /> Appearance
          </CardTitle>
          <CardDescription>UI preferences — persisted to localStorage only</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="size-4" aria-hidden="true" /> API Configuration
          </CardTitle>
          <CardDescription>Read-only — no secrets are displayed</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <ApiConfigRow label="Base URL" value={apiBaseUrl} />
          <ApiConfigRow label="Version" value="v1" />
          <ApiConfigRow label="Auth scheme" value="next-auth (credentials + TOTP)" />
          <ApiConfigRow label="Inngest registered" value={inngestRegistered ? "yes" : "no"} />
          <ApiConfigRow label="Inngest event key" value="" redacted />
          <ApiConfigRow label="Inngest signing key" value="" redacted />
          <ApiConfigRow label="NextAuth secret" value="" redacted />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" aria-hidden="true" /> Database
          </CardTitle>
          <CardDescription>Neon Postgres + Drizzle ORM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Backend</span>
            <span>Neon (PostgreSQL 16, serverless)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Driver</span>
            <span className="font-mono text-xs">@neondatabase/serverless (HTTP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ORM</span>
            <span className="font-mono text-xs">drizzle-orm 0.45</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Schema</span>
            <span className="font-mono text-xs">src/db/schema.ts (8 tables, 5 enums)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Migrations applied</span>
            <Badge variant="destructive">FALSE — pre-pilot</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            DATABASE_URL is loaded from .env (NEVER printed). Schema migrations are pending —
            operators run <code className="font-mono">drizzle-kit push</code> to provision tables
            before submitting the first instruction.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" /> MTQ Gate
          </CardTitle>
          <CardDescription>8 canonical gates — all must be held for MTQ to enable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md bg-muted/50 p-3 text-sm">
            <Badge variant="destructive">MTQ disabled</Badge>
            <Badge variant="outline">productionAuthorized = false</Badge>
            <Badge variant="secondary">policyVersion = {POLICY.policyVersion}</Badge>
          </div>
          <ul className="divide-y divide-border" aria-label="MTQ gate status">
            <GateRow
              label="G1 — Legal opinion"
              held={POLICY.gates.legalOpinion.held}
              evidence={POLICY.gates.legalOpinion.evidence}
            />
            <GateRow
              label="G2 — Bank design partner"
              held={POLICY.gates.bankPartner.held}
              evidence={POLICY.gates.bankPartner.evidence}
            />
            <GateRow
              label="G3 — Regulatory license"
              held={POLICY.gates.regulatoryLicense.held}
              evidence={POLICY.gates.regulatoryLicense.evidence}
            />
            <GateRow
              label="G4 — Custody arrangement"
              held={POLICY.gates.custodyArrangement.held}
              evidence={POLICY.gates.custodyArrangement.evidence}
            />
            <GateRow
              label="G5 — Backing eligibility"
              held={POLICY.gates.backingEligibility.held}
              evidence={POLICY.gates.backingEligibility.evidence}
            />
            <GateRow
              label="G6 — Accounting integration"
              held={POLICY.gates.accountingIntegration.held}
              evidence={POLICY.gates.accountingIntegration.evidence}
            />
            <GateRow
              label="G7 — Reconciliation tolerance"
              held={POLICY.gates.reconciliationTolerance.held}
              evidence={POLICY.gates.reconciliationTolerance.evidence}
            />
            <GateRow
              label="G8 — Production authorization"
              held={POLICY.gates.productionAuthorization.held}
              evidence={POLICY.gates.productionAuthorization.evidence}
            />
          </ul>
          <Separator className="my-4" />
          <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            <Key className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <p>{POLICY.honestState}</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild variant="outline">
          <a href="/api/v1/health" target="_blank" rel="noreferrer">
            View /api/v1/health
          </a>
        </Button>
      </div>
    </div>
  );
}
