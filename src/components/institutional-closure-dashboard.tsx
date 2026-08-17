"use client";

/* ============================================================
 * InstitutionalClosureDashboard — §V25.0
 * ------------------------------------------------------------
 * Task ID: GAP2-INSTITUTIONAL-CLOSURE-DASHBOARD
 *
 * Unified multi-tab dashboard covering all 15 v25.0 institutional
 * closure modules that previously lacked UI representation. Each
 * tab fetches from its own v25.0 API endpoint and renders the
 * response in a readable, honest-state-preserving format.
 *
 * Coverage:
 *   - 8-Prompt Institutional Closure Series (Prompts 1..8):
 *       1/8 Monetary Lock
 *       2/8 Custody Execution
 *       3/8 Commercial / Financial Model
 *       4/8 Bank Onboarding
 *       5/8 External Validation Workbench
 *       6/8 Jurisdiction Pilot
 *   - 9 Supporting Modules:
 *       ILPS Liquidity, Redemption Continuity, Stress Engine,
 *       Tokenomics, Canonical Supply, Corporate Pilot,
 *       Custody Hardening, Custody Concentration, Pilot Ops
 *
 * Color palette (NO indigo/blue):
 *   amber  = PILOT-READY / conditional / integration-ready
 *   emerald = passed / verified / honest-true
 *   red     = blocked / fail / production-blocked
 *   gray    = muted / neutral
 *
 * Honest state:
 *   Every tab surfaces a "Honest State Declaration" banner that
 *   preserves productionAuthorized=false and pilotReady=AMBER
 *   regardless of what the upstream API returns. No false claims.
 * ============================================================ */

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Lock,
  Shield,
  Building2,
  TrendingUp,
  FileCheck,
  Globe,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Layers,
  Coins,
  ArrowRight,
  Scale,
  Boxes,
  ChevronDown,
  Loader2,
  XCircle,
  Server,
  Database,
  Hash,
} from "lucide-react";

/* ----------------------------------------------------------------
 * Tab registry — 15 v25.0 institutional closure modules.
 * Each tab lazily fetches from its own API endpoint on activation.
 * ---------------------------------------------------------------- */
const TABS = [
  {
    id: "monetary-lock",
    label: "1/8 Monetary Lock",
    short: "Monetary Lock",
    icon: Lock,
    api: "/api/v25.0/monetary-lock",
    description: "Prompt 1/8 — Monetary Lock & Issuance Authority closure. Defines the canonical minting authority, idempotency locks, and the locked monetary policy that no actor can override at runtime.",
  },
  {
    id: "custody-execution",
    label: "2/8 Custody",
    short: "Custody",
    icon: Shield,
    api: "/api/v25.0/custody-execution",
    description: "Prompt 2/8 — Custody Execution closure. Custodian attestation chain, segregated gold holdings, and the non-custodial reserve invariant (gold never leaves the vault without redemption).",
  },
  {
    id: "financial-model",
    label: "3/8 Commercial Model",
    short: "Commercial",
    icon: TrendingUp,
    api: "/api/v25.0/financial-model",
    description: "Prompt 3/8 — Commercial / Financial Model closure. Fee schedule, savings split, treasury mechanics, and the sustainable unit economics that survive at $1K and $10M transaction sizes.",
  },
  {
    id: "bank-onboarding",
    label: "4/8 Bank Onboarding",
    short: "Bank Onboarding",
    icon: Building2,
    api: "/api/v25.0/bank-onboarding",
    description: "Prompt 4/8 — Bank Onboarding closure. Bank KYB / AML attestation, MSAS adapter standard, and the canonical MTQSettlementInstruction lifecycle from instruction to 13-event settlement.",
  },
  {
    id: "validation-workbench",
    label: "5/8 External Validation",
    short: "Validation",
    icon: FileCheck,
    api: "/api/v25.0/validation-workbench",
    description: "Prompt 5/8 — External Validation Workbench closure. Independent validator attestations, audit-trail integrity, and the external evidence ledger that converts SIMULATED into REAL.",
  },
  {
    id: "jurisdiction-pilot",
    label: "6/8 Jurisdiction Pilot",
    short: "Jurisdiction",
    icon: Globe,
    api: "/api/v25.0/jurisdiction-pilot",
    description: "Prompt 6/8 — Jurisdiction Pilot closure. Jurisdictional rule sets (JSG), sandbox exemptions, and the regulatory pilot framework required before any bank goes LIVE.",
  },
  {
    id: "ilps",
    label: "ILPS Liquidity",
    short: "ILPS",
    icon: Layers,
    api: "/api/v25.0/ilps",
    description: "Supporting module — Integrated Liquidity & Positioning System. Cross-bank MTQ position netting, real-time liquidity reconciliation, and the 7-layer settlement model.",
  },
  {
    id: "redemption-continuity",
    label: "Redemption Continuity",
    short: "Redemption",
    icon: Activity,
    api: "/api/v25.0/redemption-continuity",
    description: "Supporting module — Redemption Continuity. Ensures redemption paths remain available under custodian failure, bank exit, and protocol-wind-down scenarios.",
  },
  {
    id: "stress-engine",
    label: "Stress Engine",
    short: "Stress",
    icon: AlertTriangle,
    api: "/api/v25.0/stress-engine",
    description: "Supporting module — Stress Test Engine. Adversarial scenario harness, DMCE limit probing, and the canonical stress-test proof registry.",
  },
  {
    id: "tokenomics",
    label: "Tokenomics",
    short: "Tokenomics",
    icon: Coins,
    api: "/api/v25.0/tokenomics",
    description: "Supporting module — Tokenomics. Supply schedule, DMCE (Dynamic Minting Capacity Engine = MIN of 8 limits), and canonical supply invariants.",
  },
  {
    id: "canonical-supply",
    label: "Canonical Supply",
    short: "Supply",
    icon: CheckCircle2,
    api: "/api/v25.0/canonical-supply",
    description: "Supporting module — Canonical Supply Registry. Single source of truth for total MTQ supply, per-chain canonical allocations, and quarantined non-canonical contracts.",
  },
  {
    id: "corporate-pilot",
    label: "Corporate Pilot",
    short: "Corporate",
    icon: Building2,
    api: "/api/v25.0/corporate-pilot",
    description: "Supporting module — Corporate Pilot. The 5-entity corporate structure (Founder / Holding / Operating / Tech / Foundation) and the controlled-testing pilot launch checklist.",
  },
  {
    id: "custody-hardening",
    label: "Custody Hardening",
    short: "Hardening",
    icon: Shield,
    api: "/api/v25.0/custody-hardening",
    description: "Supporting module — Custody Hardening. Multi-custodian redundancy, vault attestation hardening, and the physical-reserve attack-surface reduction plan.",
  },
  {
    id: "custody-concentration",
    label: "Custody Concentration",
    short: "Concentration",
    icon: Boxes,
    api: "/api/v25.0/custody-concentration",
    description: "Supporting module — Custody Concentration Risk. Single-custodian concentration limits, geographic diversification, and the concentration-failover playbook.",
  },
  {
    id: "pilot-ops",
    label: "Pilot Operations",
    short: "Pilot Ops",
    icon: Cpu,
    api: "/api/v25.0/pilot-ops",
    description: "Supporting module — Pilot Operations. Operational runbook for the controlled pilot, incident response, and the pilot-to-production transition gate.",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ----------------------------------------------------------------
 * Cache entry per tab — avoids refetching on tab re-selection.
 * ---------------------------------------------------------------- */
interface TabState {
  data: Record<string, unknown> | unknown[] | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
}

/* ----------------------------------------------------------------
 * Generic value / metadata extractors.
 * These keep the dashboard agnostic to each API's exact shape —
 * we surface whatever scalars, counts, and honest-state flags the
 * endpoint returns, then expose the full JSON for inspection.
 * ---------------------------------------------------------------- */
const NAME_KEYS = [
  "moduleId",
  "id",
  "name",
  "title",
  "blueprintDesignation",
  "module",
  "promptId",
];

const VERSION_KEYS = [
  "version",
  "architectureVersion",
  "moduleVersion",
  "specVersion",
  "amendmentVersion",
];

const STATUS_KEYS = [
  "finalStatus",
  "status",
  "integrationState",
  "pilotState",
  "state",
  "gateState",
];

const HONEST_KEYS = [
  "honestState",
  "honest_state",
  "honestyState",
];

const BOOLEAN_HONEST_FIELDS = [
  "honest",
  "forcedToPass",
  "productionAuthorized",
  "pilotReady",
  "v25_0_Frozen",
  "realWorldEvidencePresent",
  "noFalseZeroIntegrationClaim",
  "noFalseBankIntegrationClaim",
];

function pickKey(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
      return obj[k];
    }
  }
  return undefined;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Extract top-level scalar fields for the "Key Metrics" grid. */
function extractScalars(obj: unknown): Array<{ key: string; value: unknown }> {
  if (!isObject(obj)) return [];
  const out: Array<{ key: string; value: unknown }> = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") {
      // Skip free-text description blobs from the metrics grid.
      if (t === "string" && v.length > 80) continue;
      out.push({ key: k, value: v });
    }
  }
  return out.slice(0, 12);
}

/** Extract top-level array/object keys with item counts for the summary. */
function extractCounts(obj: unknown): Array<{ key: string; count: number; kind: "array" | "object" }> {
  if (!isObject(obj)) return [];
  const out: Array<{ key: string; count: number; kind: "array" | "object" }> = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out.push({ key: k, count: v.length, kind: "array" });
    } else if (isObject(v)) {
      out.push({ key: k, count: Object.keys(v).length, kind: "object" });
    }
  }
  return out.slice(0, 12);
}

/** Extract honest-state declaration fields wherever they live. */
function extractHonestState(obj: unknown): Array<{ key: string; value: boolean }> {
  if (!isObject(obj)) return [];
  const out: Array<{ key: string; value: boolean }> = [];
  // Top-level booleans.
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "boolean" && BOOLEAN_HONEST_FIELDS.includes(k)) {
      out.push({ key: k, value: v });
    }
  }
  // Nested honestState object.
  for (const hk of HONEST_KEYS) {
    const hv = obj[hk];
    if (isObject(hv)) {
      for (const [k, v] of Object.entries(hv)) {
        if (typeof v === "boolean") {
          out.push({ key: `honestState.${k}`, value: v });
        }
      }
    }
  }
  return out;
}

/* ----------------------------------------------------------------
 * Small presentational helpers.
 * ---------------------------------------------------------------- */
function scalarBadgeClass(value: unknown): string {
  if (typeof value === "boolean") {
    return value
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
  }
  return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function renderScalarValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
}

function statusToTone(status: string): "amber" | "emerald" | "red" | "gray" {
  const s = status.toUpperCase();
  if (s.includes("BLOCK") || s.includes("FAIL") || s.includes("STOP") || s === "NO") {
    return "red";
  }
  if (
    s.includes("PASS") ||
    s.includes("READY") && !s.includes("BLOCK") ||
    s.includes("APPROVED") ||
    s.includes("LIVE") ||
    s.includes("CERTIFIED")
  ) {
    if (s.includes("READY") || s.includes("AMBER") || s.includes("CANDIDATE") || s.includes("SIMULATED")) {
      return "amber";
    }
    return "emerald";
  }
  if (s.includes("SIMULATED") || s.includes("TESTNET") || s.includes("PENDING") || s.includes("AMBER")) {
    return "amber";
  }
  return "gray";
}

function toneBadgeClass(tone: "amber" | "emerald" | "red" | "gray"): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "red":
      return "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300";
    case "amber":
      return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
    default:
      return "border-muted-foreground/30 bg-muted/40 text-muted-foreground";
  }
}

/* ----------------------------------------------------------------
 * Collapsible JSON viewer — generic over any response shape.
 * ---------------------------------------------------------------- */
function JsonViewer({ data, expanded, onToggle }: {
  data: unknown;
  expanded: boolean;
  onToggle: () => void;
}) {
  const text = (() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  })();
  const bytes = new Blob([text]).size;
  const lineCount = text.split("\n").length;

  return (
    <Collapsible open={expanded} onOpenChange={onToggle} className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
          <Database className="h-4 w-4" />
          <span className="font-mono">raw response</span>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]">
            <Hash className="mr-1 h-3 w-3" />
            {lineCount} lines
          </Badge>
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px]">
            {(bytes / 1024).toFixed(2)} KB
          </Badge>
        </div>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-colors"
          >
            {expanded ? "Collapse" : "Expand"}
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <pre className="mt-2 max-h-[28rem] overflow-auto rounded-lg border border-amber-500/20 bg-zinc-950/80 p-4 text-xs leading-relaxed text-amber-100 shadow-inner">
          <code className="font-mono whitespace-pre">{text}</code>
        </pre>
      </CollapsibleContent>
      {!expanded && (
        <p className="mt-2 text-xs text-muted-foreground">
          JSON collapsed — click Expand to inspect the full {lineCount}-line response.
        </p>
      )}
    </Collapsible>
  );
}

/* ----------------------------------------------------------------
 * Per-tab loading / error states.
 * ---------------------------------------------------------------- */
function LoadingCard({ label }: { label: string }) {
  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.03]">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
          Fetching <span className="font-mono">{label}</span>…
        </p>
        <p className="text-xs text-muted-foreground">
          Connecting to v25.0 institutional closure API endpoint.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message, api, onRetry }: {
  message: string;
  api: string;
  onRetry: () => void;
}) {
  const is404 = message.includes("404") || message.includes("HTTP 404");
  return (
    <Card className="border-red-500/30 bg-red-500/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
          <XCircle className="h-5 w-5" />
          Endpoint Unavailable
        </CardTitle>
        <CardDescription className="font-mono text-xs">{api}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-700 dark:text-red-300">
          {message}
        </p>
        {is404 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mb-1 inline h-3.5 w-3.5" /> The v25.0 backend
            module for this tab has not been stood up yet. The dashboard UI is
            pilot-ready (AMBER) and will render live data the moment the endpoint
            is deployed — no UI changes required.
          </div>
        )}
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry fetch
        </button>
      </CardContent>
    </Card>
  );
}

/* ----------------------------------------------------------------
 * Honest-state declaration banner.
 * Always preserves productionAuthorized=false (PRODUCTION-BLOCKED)
 * and pilotReady=AMBER regardless of upstream payload.
 * ---------------------------------------------------------------- */
function HonestStateBanner({ data }: { data: unknown }) {
  const fields = extractHonestState(data);
  // Canonical honest declaration — independent of what the API says.
  const productionAuthorized =
    fields.find((f) => f.key.endsWith("productionAuthorized"))?.value;
  const honest =
    fields.find((f) => f.key === "honestState.honest" || f.key === "honest")?.value;
  const forcedToPass =
    fields.find((f) => f.key.endsWith("forcedToPass"))?.value;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent p-4">
      <div className="mb-2 flex items-center gap-2">
        <Scale className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Honest State Declaration
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
        >
          <Activity className="mr-1 h-3 w-3" />
          PILOT-READY (AMBER)
        </Badge>
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300"
        >
          <Lock className="mr-1 h-3 w-3" />
          PRODUCTION-BLOCKED
        </Badge>
        {honest === true && (
          <Badge
            variant="outline"
            className="border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            HONEST=TRUE
          </Badge>
        )}
        {productionAuthorized === false && (
          <Badge
            variant="outline"
            className="border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300"
          >
            <XCircle className="mr-1 h-3 w-3" />
            productionAuthorized=FALSE
          </Badge>
        )}
        {forcedToPass === true && (
          <Badge
            variant="outline"
            className="border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300"
          >
            <AlertTriangle className="mr-1 h-3 w-3" />
            forcedToPass=TRUE (flagged)
          </Badge>
        )}
        {fields.length === 0 && (
          <span className="text-xs text-muted-foreground">
            No explicit honest-state fields in response — canonical declaration above stands.
          </span>
        )}
      </div>
      {fields.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between rounded border border-amber-500/20 bg-background/60 px-2 py-1 font-mono text-[11px]"
            >
              <span className="truncate text-muted-foreground">{f.key}</span>
              <span
                className={
                  f.value
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-700 dark:text-red-300"
                }
              >
                {String(f.value).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------
 * Active-tab content renderer.
 * ---------------------------------------------------------------- */
function TabContent({ tab, state, jsonOpen, onToggleJson, onRetry }: {
  tab: (typeof TABS)[number];
  state: TabState;
  jsonOpen: boolean;
  onToggleJson: () => void;
  onRetry: () => void;
}) {
  if (state.loading) return <LoadingCard label={tab.short} />;
  if (state.error) {
    return <ErrorCard message={state.error} api={tab.api} onRetry={onRetry} />;
  }
  if (!state.data) {
    return (
      <Card className="border-muted-foreground/20">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No data loaded.
        </CardContent>
      </Card>
    );
  }

  const data = state.data;
  const obj = isObject(data) ? data : null;
  const moduleMeta = obj ? (pickKey(obj, NAME_KEYS) as unknown as string) : undefined;
  const moduleVersion = obj ? (pickKey(obj, VERSION_KEYS) as unknown as string) : undefined;
  const moduleStatus = obj ? (pickKey(obj, STATUS_KEYS) as unknown as string) : undefined;
  const scalars = extractScalars(data);
  const counts = extractCounts(data);
  const tone = moduleStatus ? statusToTone(moduleStatus) : "amber";

  return (
    <div className="space-y-4">
      {/* Module identity header */}
      <Card className="border-amber-500/20 bg-amber-500/[0.02]">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                <tab.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {moduleMeta ? String(moduleMeta) : tab.short}
              </CardTitle>
              <CardDescription className="font-mono text-xs">
                {tab.api}
                {moduleVersion && (
                  <span className="ml-2 text-amber-700 dark:text-amber-300">
                    v{String(moduleVersion)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {moduleStatus && (
                <Badge variant="outline" className={toneBadgeClass(tone)}>
                  <Activity className="mr-1 h-3 w-3" />
                  {String(moduleStatus)}
                </Badge>
              )}
              <Badge
                variant="outline"
                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                v25.0
              </Badge>
              {state.fetchedAt && (
                <span className="text-[11px] text-muted-foreground">
                  fetched {new Date(state.fetchedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {tab.description}
          </p>

          <HonestStateBanner data={data} />

          {/* Key metrics */}
          {scalars.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <Server className="h-3.5 w-3.5" />
                Key Metrics
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {scalars.map((m) => (
                  <div
                    key={m.key}
                    className="rounded-lg border border-amber-500/15 bg-background/60 p-3"
                  >
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {m.key}
                    </div>
                    <div className="mt-1">
                      <Badge variant="outline" className={scalarBadgeClass(m.value)}>
                        {renderScalarValue(m.value)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Structure summary (array / object counts) */}
          {counts.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                <Boxes className="h-3.5 w-3.5" />
                Response Structure
              </div>
              <div className="flex flex-wrap gap-2">
                {counts.map((c) => (
                  <Badge
                    key={c.key}
                    variant="outline"
                    className="border-muted-foreground/30 bg-muted/30 text-muted-foreground font-mono text-xs"
                  >
                    {c.kind === "array" ? <Layers className="mr-1 h-3 w-3" /> : <Database className="mr-1 h-3 w-3" />}
                    {c.key}({c.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Collapsible JSON */}
          <JsonViewer data={data} expanded={jsonOpen} onToggle={onToggleJson} />
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------
 * Main dashboard component.
 * ---------------------------------------------------------------- */
export function InstitutionalClosureDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("monetary-lock");
  const [cache, setCache] = useState<Record<string, TabState>>({});
  const [jsonOpenMap, setJsonOpenMap] = useState<Record<string, boolean>>({});
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const fetchTab = useCallback(async (tabId: string) => {
    const tab = TABS.find((t) => t.id === tabId);
    if (!tab) return;
    // Mark loading without wiping existing data (so UI doesn't flash).
    setCache((prev) => ({
      ...prev,
      [tabId]: {
        data: prev[tabId]?.data ?? null,
        loading: true,
        error: null,
        fetchedAt: prev[tabId]?.fetchedAt ?? null,
      },
    }));
    try {
      const res = await fetch(tab.api);
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${tab.api} not available`);
      const json = await res.json();
      setCache((prev) => ({
        ...prev,
        [tabId]: { data: json, loading: false, error: null, fetchedAt: Date.now() },
      }));
    } catch (e) {
      setCache((prev) => ({
        ...prev,
        [tabId]: {
          data: null,
          loading: false,
          error: e instanceof Error ? e.message : "unknown fetch error",
          fetchedAt: null,
        },
      }));
    }
  }, []);

  // Lazy-load the active tab on mount and whenever it changes.
  useEffect(() => {
    const entry = cache[activeTab];
    if (!entry || (!entry.loading && !entry.data && !entry.error)) {
      void fetchTab(activeTab);
    }
    // Scroll the active tab into view in the horizontal bar.
    const el = tabRefs.current[activeTab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    // Note: exhaustive-deps is globally disabled; fetchTab is a stable useCallback.
  }, [activeTab, cache, fetchTab]);

  const activeState: TabState = cache[activeTab] ?? {
    data: null,
    loading: true,
    error: null,
    fetchedAt: null,
  };

  const loadedCount = Object.values(cache).filter(
    (s) => s.data !== null
  ).length;
  const errorCount = Object.values(cache).filter((s) => s.error !== null).length;
  const coverage = Math.round((loadedCount / TABS.length) * 100);

  return (
    <section
      id="institutional-closure-dashboard"
      className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      {/* §1 — Section header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-background to-background">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span className="font-mono text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    §V25.0 — Institutional Closure Series
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Institutional Closure Dashboard
                  <span className="ml-2 text-amber-600 dark:text-amber-400">
                    — 8-Prompt Series + Supporting Modules
                  </span>
                </CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-relaxed">
                  Unified multi-tab view of all 15 v25.0 institutional closure
                  modules. Each tab lazily fetches from its own API endpoint and
                  renders the response with an honest-state declaration preserved
                  throughout. Pilot-ready (AMBER); production remains blocked.
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant="outline"
                  className="border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                >
                  <Activity className="mr-1 h-3 w-3" />
                  PILOT-READY (AMBER)
                </Badge>
                <Badge
                  variant="outline"
                  className="border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300"
                >
                  <Lock className="mr-1 h-3 w-3" />
                  PRODUCTION-BLOCKED
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Coverage bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground">
                  module coverage — {loadedCount}/{TABS.length} loaded
                  {errorCount > 0 && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                      ({errorCount} endpoint{errorCount === 1 ? "" : "s"} unavailable)
                    </span>
                  )}
                </span>
                <span className="font-mono font-semibold text-amber-700 dark:text-amber-300">
                  {coverage}%
                </span>
              </div>
              <Progress
                value={coverage}
                className="h-2 bg-amber-500/10 [&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Click any tab below to fetch and render its v25.0 module report.
              Endpoints that are not yet deployed will display an honest
              &ldquo;Endpoint Unavailable&rdquo; card — no silent fallbacks.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* §2 — Horizontal scrollable tab bar (15 tabs) */}
      <div className="sticky top-3 z-10 mt-6">
        <div
          className="flex gap-2 overflow-x-auto rounded-lg border border-amber-500/20 bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/75"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(217 119 6 / 0.4) transparent",
          }}
        >
          {TABS.map((tab, idx) => {
            const isActive = tab.id === activeTab;
            const state = cache[tab.id];
            const hasData = state?.data !== null && state?.data !== undefined;
            const hasError = state?.error !== null && state?.error !== undefined;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={isActive}
                className={[
                  "group relative flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "border-amber-500/60 bg-amber-500/15 text-amber-800 shadow-sm dark:text-amber-200"
                    : "border-muted-foreground/15 bg-background text-muted-foreground hover:border-amber-500/40 hover:bg-amber-500/5 hover:text-amber-700 dark:hover:text-amber-300",
                ].join(" ")}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-[10px] font-mono text-amber-700 dark:text-amber-300">
                  {idx + 1}
                </span>
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{tab.short}</span>
                {/* Status pip */}
                {hasData && (
                  <span
                    className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500"
                    title="loaded"
                  />
                )}
                {state?.loading && (
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                )}
                {hasError && (
                  <span
                    className="ml-0.5 h-1.5 w-1.5 rounded-full bg-red-500"
                    title="error"
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="icd-active-underline"
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-amber-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* §3 — Active tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-4"
      >
        <TabContent
          tab={TABS.find((t) => t.id === activeTab)!}
          state={activeState}
          jsonOpen={!!jsonOpenMap[activeTab]}
          onToggleJson={() =>
            setJsonOpenMap((prev) => ({ ...prev, [activeTab]: !prev[activeTab] }))
          }
          onRetry={() => void fetchTab(activeTab)}
        />
      </motion.div>

      {/* §4 — Footer legend */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-muted-foreground/15 bg-muted/20 p-3 text-xs text-muted-foreground">
        <span className="font-semibold">Legend:</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> PILOT-READY / conditional
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> passed / verified / honest
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> blocked / fail / production-blocked
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> muted / neutral
        </span>
        <span className="ml-auto inline-flex items-center gap-1 font-mono">
          <ArrowRight className="h-3 w-3" />
          {TABS.length} modules · v25.0
        </span>
      </div>
    </section>
  );
}
