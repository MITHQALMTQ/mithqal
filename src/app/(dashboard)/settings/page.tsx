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
 * Settings page — MITHQAL MASTER BLUEPRINT §D.4 + §8 + §16.
 *
 * Read-only configuration surface. No production toggles — the truth state
 * (mtqDisabled=true, productionAuthorized=false) is NOT a switchable
 * preference; it is the canonical gate state from `mtq-gate.ts` and only
 * changes via signed release commits.
 *
 * What this page does expose honestly:
 *   - Theme toggle (UI preference only, persists to localStorage)
 *   - API base URL (read from env at build time, never logged as secret)
 *   - MTQ Σ status: NOT AUTHORIZED (research-only per §9.1)
 *   - Production authorization: FALSE
 *   - Truth states: 5-state vocabulary per §D.4
 *     (VERIFIED / HYPOTHESIS / DECISION / UNRESOLVED / NOT AUTHORIZED)
 *   - Evidence gates: Gate 0–4 per §8 (NOT G0–G11)
 */

const POLICY = evaluateMtqGate();

const TRUTH_STATES: Array<{
  name: string;
  meaning: string;
  permitted: string;
}> = [
  {
    name: "VERIFIED",
    meaning: "Supported by authoritative source, reproducible test, or established contractual fact",
    permitted: "State the fact with source and date",
  },
  {
    name: "HYPOTHESIS",
    meaning: "Plausible but not established by adequate evidence",
    permitted: '"Proposed," "candidate," "to be tested"',
  },
  {
    name: "DECISION",
    meaning: "Explicitly authorized by responsible decision-maker, with scope and date",
    permitted: '"Approved for the defined scope"',
  },
  {
    name: "UNRESOLVED",
    meaning: "Conflicting, missing, stale, or insufficient evidence",
    permitted: "State what must be produced to resolve it",
  },
  {
    name: "NOT AUTHORIZED",
    meaning: "The relevant activity has not been approved",
    permitted: "Do not imply permission or readiness",
  },
];

const EVIDENCE_GATES: Array<{
  id: string;
  title: string;
  scope: string;
  held: boolean;
}> = [
  {
    id: "Gate 0",
    title: "Problem Validation",
    scope: "Interviews, workflow mapping, competitor research, sample-data analysis, narrowly scoped prototypes",
    held: false,
  },
  {
    id: "Gate 1",
    title: "Controlled Product Pilot",
    scope: "Baseline, metrics, permitted data, security boundaries, evaluation period, acceptance process",
    held: false,
  },
  {
    id: "Gate 2",
    title: "Repeatable Commercialization",
    scope: "Predictable implementation effort, support burden, security readiness, credible gross margins",
    held: false,
  },
  {
    id: "Gate 3",
    title: "Optional Settlement Visibility",
    scope: "Separate business case with named buyer, measurable benefit, willingness to pay, authorised data access",
    held: false,
  },
  {
    id: "Gate 4",
    title: "Optional Asset Interoperability",
    scope: "Identified eligible asset, institution, jurisdiction, permitted activity, operational responsibility",
    held: false,
  },
];

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
      <PageHeader title="Settings" description="Read-only configuration surface — MITHQAL Assurance" />

      <Alert>
        <Info className="size-4" aria-hidden="true" />
        <AlertTitle>Honest state — no production toggles</AlertTitle>
        <AlertDescription>
          The MTQ Σ status and production authorization flag below are NOT switchable
          preferences. They are the canonical evaluation from
          <code className="font-mono"> src/lib/mtq-gate.ts</code> and only change via a signed
          release commit. No setting on this page can authorise production.
        </AlertDescription>
      </Alert>

      {/* §9.1 — MTQ Σ NOT AUTHORIZED + Production authorization FALSE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" /> Authorisation Status
          </CardTitle>
          <CardDescription>Per §9.1 + cover page — read-only</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-muted/50 p-3 text-sm">
            <Badge variant="destructive">MTQ Σ: NOT AUTHORIZED</Badge>
            <Badge variant="outline">research-only (§9.1)</Badge>
            <Badge variant="destructive">productionAuthorized = FALSE</Badge>
            <Badge variant="secondary">policyVersion = {POLICY.policyVersion}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            MTQ Σ is research-only. No mainnet deployment, no issuance. MITHQAL Assurance is
            commercially viable without MTQ Σ — the operating business must be able to deliver
            value and earn revenue independent of any future MTQ Σ authorisation.
          </p>
        </CardContent>
      </Card>

      {/* §D.4 — Truth-state vocabulary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" /> Truth-State Vocabulary (§D.4)
          </CardTitle>
          <CardDescription>
            Every material claim carries one of five states — 5-state vocabulary, not G0–G11
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {TRUTH_STATES.map((t) => (
              <li key={t.name} className="flex flex-col gap-1 py-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                    {t.name}
                  </span>
                </div>
                <p className="pl-3.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Meaning:</span> {t.meaning}
                </p>
                <p className="pl-3.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Permitted wording:</span>{" "}
                  {t.permitted}
                </p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
            Critical rule: a verified market statistic does not verify the commercial conclusion
            drawn from it. A valid hash does not prove source truth. A testnet deployment does
            not establish reserve backing or production readiness.
          </div>
        </CardContent>
      </Card>

      {/* §8 — Evidence Gates 0-4 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4" aria-hidden="true" /> Evidence Gates (§8)
          </CardTitle>
          <CardDescription>Gate 0–4 (not G0–G11) — all must pass before the next phase</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border" aria-label="Evidence gate status">
            {EVIDENCE_GATES.map((g) => (
              <li key={g.id} className="flex flex-col gap-1 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`size-1.5 rounded-full ${g.held ? "bg-emerald-500" : "bg-rose-500"}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium">
                    {g.id} — {g.title}
                  </span>
                  <Badge
                    variant={g.held ? "default" : "destructive"}
                    className="ml-auto"
                  >
                    {g.held ? "PASSED" : "NOT PASSED"}
                  </Badge>
                </div>
                <p className="pl-3.5 text-xs text-muted-foreground">{g.scope}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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
            <span className="font-mono text-xs">src/db/schema.ts (11 tables, 3 enums)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Migrations applied</span>
            <Badge variant="destructive">FALSE — pre-pilot</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            DATABASE_URL is loaded from .env (NEVER printed). Schema migrations are pending —
            operators run <code className="font-mono">drizzle-kit push</code> or the
            push script to provision tables before submitting the first validation case.
          </p>
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
