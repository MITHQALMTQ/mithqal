"use client";

import * as React from "react";
import {
  Activity,
  Database,
  Gauge,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * StatusBar — sticky bottom strip that polls the platform health
 * endpoint every 30s and reports 4 status pills:
 *   • System   — Healthy / Degraded / Offline
 *   • DB       — Connected / Offline
 *   • Latency  — Nms (round-trip to /api/health)
 *   • Uptime   — 99.9% (static SLA indicator)
 *
 * Failure modes:
 *   • fetch throws (network)            → "System: Offline"  (red)
 *   • non-2xx response                  → "System: Offline"  (red)
 *   • response.status === "degraded"    → "System: Degraded" (amber)
 *   • response.status === "healthy"     → "System: Healthy"  (emerald + pulse-dot)
 *
 * Loading state (initial mount) shows "…" in every pill.
 * ────────────────────────────────────────────────────────────── */

type HealthState =
  | { kind: "loading" }
  | { kind: "ok"; latencyMs: number; dbOk: boolean }
  | { kind: "degraded"; latencyMs: number; dbOk: boolean }
  | { kind: "offline" };

const POLL_INTERVAL_MS = 30_000;

async function fetchHealth(): Promise<HealthState> {
  const started = performance.now();
  let res: Response;
  try {
    res = await fetch("/api/health", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    return { kind: "offline" };
  }
  const latencyMs = Math.round(performance.now() - started);

  if (!res.ok) {
    // 404 / 500 / etc → treat as offline (endpoint may not exist yet)
    return { kind: "offline" };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    return { kind: "offline" };
  }

  // Parse defensively — the upstream health schema is owned by another agent.
  const data = (body ?? {}) as Record<string, unknown>;
  const status = typeof data.status === "string" ? data.status : "";
  const checks = (data.checks ?? {}) as Record<string, unknown>;
  const dbProbe = (checks.db ?? {}) as Record<string, unknown>;
  const dbOk =
    dbProbe.ok === true ||
    dbProbe.status === "ok" ||
    dbProbe.status === "connected" ||
    status === "healthy";

  if (status === "degraded") return { kind: "degraded", latencyMs, dbOk };
  if (status === "healthy" || status === "ok") return { kind: "ok", latencyMs, dbOk };

  // Unknown shape — fall back to ok iff db probe is healthy, else offline.
  if (dbOk) return { kind: "ok", latencyMs, dbOk };
  return { kind: "offline" };
}

/* ── Pill primitive ── */

function Pill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "ok" | "warn" | "err" | "muted";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tone === "ok" &&
          "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
        tone === "warn" &&
          "border-amber-500/30 bg-amber-500/5 text-amber-500",
        tone === "err" &&
          "border-red-500/30 bg-red-500/5 text-red-400",
        tone === "muted" &&
          "border-line/40 bg-ink-card/40 text-fg-muted",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="text-fg-muted">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

export function StatusBar() {
  const [state, setState] = React.useState<HealthState>({ kind: "loading" });

  const poll = React.useCallback(async () => {
    setState(await fetchHealth());
  }, []);

  React.useEffect(() => {
    // Defer the initial poll to next microtask to avoid synchronous
    // effect→state loop (React 19 react-hooks/set-state-in-effect rule).
    queueMicrotask(() => void poll());
    const id = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [poll]);

  // ── React to palette-driven refresh requests ──
  React.useEffect(() => {
    const onReq = () => void poll();
    window.addEventListener("mithqal:request-refresh-status", onReq);
    return () => window.removeEventListener("mithqal:request-refresh-status", onReq);
  }, [poll]);

  // Derive per-pill values from the current state.
  let systemValue = "…";
  let systemTone: "ok" | "warn" | "err" | "muted" = "muted";
  let dbValue = "…";
  let dbTone: "ok" | "warn" | "err" | "muted" = "muted";
  let latencyValue = "…";
  let latencyTone: "ok" | "warn" | "err" | "muted" = "muted";
  const uptimeValue = "99.9%";

  switch (state.kind) {
    case "ok":
      systemValue = "Healthy";
      systemTone = "ok";
      dbValue = state.dbOk ? "Connected" : "Offline";
      dbTone = state.dbOk ? "ok" : "err";
      latencyValue = `${state.latencyMs}ms`;
      latencyTone = state.latencyMs < 500 ? "ok" : "warn";
      break;
    case "degraded":
      systemValue = "Degraded";
      systemTone = "warn";
      dbValue = state.dbOk ? "Connected" : "Offline";
      dbTone = state.dbOk ? "ok" : "err";
      latencyValue = `${state.latencyMs}ms`;
      latencyTone = "warn";
      break;
    case "offline":
      systemValue = "Offline";
      systemTone = "err";
      dbValue = "Offline";
      dbTone = "err";
      latencyValue = "—";
      latencyTone = "err";
      break;
    case "loading":
    default:
      break;
  }

  return (
    <footer
      role="contentinfo"
      aria-label="System status"
      className={cn(
        "sticky bottom-0 z-30 w-full",
        "border-t border-line/60 bg-ink/90 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-ink/75",
      )}
    >
      <div className="flex h-7 items-center gap-2 overflow-x-auto px-3 py-1 text-xs text-gold sm:px-4">
        {/* System pill (with pulse-dot when healthy) */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            systemTone === "ok" &&
              "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
            systemTone === "warn" &&
              "border-amber-500/30 bg-amber-500/5 text-amber-500",
            systemTone === "err" &&
              "border-red-500/30 bg-red-500/5 text-red-400",
            systemTone === "muted" &&
              "border-line/40 bg-ink-card/40 text-fg-muted",
          )}
        >
          <ServerCog className="h-3 w-3" aria-hidden="true" />
          {systemTone === "ok" && (
            <span
              aria-hidden="true"
              className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
            />
          )}
          <span className="text-fg-muted">System:</span>
          <span>{systemValue}</span>
        </span>

        <Pill icon={Database} label="DB" value={dbValue} tone={dbTone} />
        <Pill icon={Gauge} label="Latency" value={latencyValue} tone={latencyTone} />
        <Pill icon={Activity} label="Uptime" value={uptimeValue} tone="muted" />

        {/* Right-aligned mode + last-poll hint (hidden on mobile) */}
        <span className="ml-auto hidden items-center gap-2 text-fg-muted sm:inline-flex">
          <span className="font-mono text-[10px]">
            polling every {POLL_INTERVAL_MS / 1000}s
          </span>
        </span>
      </div>
    </footer>
  );
}

export default StatusBar;
