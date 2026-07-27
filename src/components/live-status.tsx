"use client";

/**
 * LiveStatus — compact page-header indicator showing:
 *   • green pulsing dot + "Live"
 *   • "Last updated: Xs ago" (auto-updates every second)
 *   • "9/9 PASS" badge sourced from /api/onchain-test
 *
 * Polls /api/onchain-test every 30 s (cheap-ish; hits Monad RPC). Between
 * polls, the "Xs ago" timestamp continues to tick every second so the
 * indicator always feels live.
 *
 * Accessibility:
 *   • role="status" + aria-live="polite" so screen-readers announce refreshes
 *   • aria-label on every child span
 *   • the pulsing dot uses prefers-reduced-motion via CSS (animation: live-pulse)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

interface OnchainSummary {
  total: number;
  passed: number;
  failed: number;
  score?: string;
}

interface OnchainTestResponse {
  summary?: OnchainSummary;
  generatedAt?: string;
  error?: string;
}

const POLL_INTERVAL_MS = 30_000;

export function LiveStatus() {
  const [summary, setSummary] = useState<OnchainSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [, setTick] = useState(0); // forces re-render every second
  const mountedRef = useRef(true);

  const fetchTests = useCallback(async () => {
    try {
      const res = await fetch("/api/onchain-test", { cache: "no-store" });
      const data = (await res.json()) as OnchainTestResponse;
      if (!mountedRef.current) return;
      if (!res.ok || data.error || !data.summary) {
        setError(true);
        return;
      }
      setError(false);
      setSummary(data.summary);
      setLastUpdated(data.generatedAt ?? new Date().toISOString());
    } catch {
      if (!mountedRef.current) return;
      setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchTests();
    const pollId = setInterval(fetchTests, POLL_INTERVAL_MS);
    const tickId = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [fetchTests]);

  // ---- compute "Xs ago" string ----
  const elapsedSec = Math.max(0, Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000));
  const agoLabel =
    elapsedSec < 5
      ? "just now"
      : elapsedSec < 60
        ? `${elapsedSec}s ago`
        : elapsedSec < 3600
          ? `${Math.round(elapsedSec / 60)}m ago`
          : `${Math.round(elapsedSec / 3600)}h ago`;

  // ---- pass/total ----
  const passed = summary?.passed ?? 0;
  const total = summary?.total ?? 9; // until first poll resolves, show the constitutional count
  const allPass = !loading && !error && summary !== null && passed === total && total > 0;

  const badgeAria = loading
    ? "On-chain verification: loading"
    : error
      ? `On-chain verification: unavailable — last updated ${agoLabel}`
      : `On-chain verification: ${passed} of ${total} tests passed, last updated ${agoLabel}`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={badgeAria}
      className="no-print inline-flex items-center gap-2 rounded-full border border-reserve/30 bg-reserve/[0.06] px-2.5 py-1 backdrop-blur-md"
      title={`Live status · last on-chain test: ${agoLabel}`}
    >
      {/* Live dot */}
      <span
        aria-hidden="true"
        className="relative inline-flex h-2 w-2 shrink-0"
        title="Live indicator"
      >
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-reserve" />
        <span className="absolute inset-0 inline-block h-2 w-2 animate-pulse rounded-full bg-reserve" />
      </span>
      <span
        aria-label="Live data feed active"
        className="text-[10px] font-bold uppercase tracking-[0.18em] text-reserve sm:text-[11px]"
      >
        Live
      </span>

      {/* Updated Xs ago */}
      <span
        aria-label={`Last updated ${agoLabel}`}
        className="hidden text-[10px] text-fg-muted sm:inline"
      >
        {agoLabel}
      </span>

      {/* 9/9 PASS badge */}
      {loading ? (
        <span
          aria-label="Loading on-chain test results"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-ink px-1.5 py-0.5 text-[9px] font-semibold text-fg-muted"
        >
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          …
        </span>
      ) : error ? (
        <span
          aria-label="On-chain test currently unavailable"
          className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9px] font-semibold text-gold"
          title={badgeAria}
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          N/A
        </span>
      ) : (
        <span
          aria-label={`${passed} of ${total} on-chain tests passed`}
          title={`${passed} of ${total} on-chain tests passed · ${summary?.score ?? ""}`}
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            allPass
              ? "border border-reserve/50 bg-reserve/15 text-reserve"
              : "border border-gold/40 bg-gold/10 text-gold"
          }`}
        >
          {allPass ? <Check className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
          {passed}/{total} PASS
        </span>
      )}
    </div>
  );
}

export default LiveStatus;
