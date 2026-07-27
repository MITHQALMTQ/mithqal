"use client";

/**
 * LiveTimestamp — renders "Xs ago" / "Xm ago" / "Xh ago" for a given ISO
 * timestamp and re-renders every second so the label stays live.
 *
 * HYDRATION FIX: This component uses a `mounted` state to ensure the server
 * and client render the same initial content. On the server (and the first
 * client render), we render a static placeholder. After mount, we switch to
 * live time-based values. This prevents the "Hydration failed because the
 * server rendered text didn't match the client" error.
 *
 * Color convention:
 *   • < 30 s  → text-reserve (green) — fresh
 *   • 30 s–5 m → text-gold (amber)  — recent
 *   • > 5 m   → text-fg-muted      — stale
 *
 * Accessibility:
 *   • <time dateTime={iso}> with humanized text child
 *   • aria-label includes the full ISO timestamp + humanization
 */

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

export interface LiveTimestampProps {
  /** ISO 8601 timestamp (e.g. "2026-07-26T18:42:11.000Z"). */
  isoString: string;
  /** Optional prefix label (e.g. "Last updated"). Default "Last updated". */
  label?: string;
  /** Show the Clock icon. Default true. */
  showIcon?: boolean;
  /** Optional className override. */
  className?: string;
}

const FRESH_THRESHOLD_SEC = 30;
const STALE_THRESHOLD_SEC = 5 * 60; // 5 minutes

function humanize(ms: number): string {
  if (ms < 0) return "just now";
  const s = Math.round(ms / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

function toneClass(ms: number): string {
  if (ms < 0) return "text-reserve";
  const s = ms / 1000;
  if (s < FRESH_THRESHOLD_SEC) return "text-reserve";
  if (s < STALE_THRESHOLD_SEC) return "text-gold";
  return "text-fg-muted";
}

export function LiveTimestamp({
  isoString,
  label = "Last updated",
  showIcon = true,
  className,
}: LiveTimestampProps) {
  // mounted = false on server + first client render → prevents hydration mismatch
  // mounted = true after useEffect runs → switches to live values
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Parse the target date
  const targetDate = new Date(isoString);
  const isValid = !Number.isNaN(targetDate.getTime());

  // On server + first client render: show static "—" placeholder
  // After mount: show live values
  if (!mounted) {
    return (
      <time
        dateTime={isValid ? targetDate.toISOString() : ""}
        className={
          className ??
          "inline-flex items-center gap-1 text-[10px] font-medium text-fg-muted"
        }
        aria-label={`${label}: —`}
      >
        {showIcon && <Clock className="h-2.5 w-2.5" aria-hidden="true" />}
        <span aria-hidden="true">{label}:</span>
        <span aria-hidden="true">—</span>
      </time>
    );
  }

  // After mount: compute live values
  const diffMs = Date.now() - (isValid ? targetDate.getTime() : Date.now());
  const human = isValid ? humanize(diffMs) : "—";
  const tone = toneClass(diffMs);
  const fullIso = isValid ? targetDate.toISOString() : "";

  return (
    <time
      dateTime={fullIso}
      className={
        className ??
        `inline-flex items-center gap-1 text-[10px] font-medium ${tone}`
      }
      title={isValid ? targetDate.toISOString() : "Unknown timestamp"}
      aria-label={`${label}: ${human}${isValid ? ` (${fullIso})` : ""}`}
    >
      {showIcon && <Clock className="h-2.5 w-2.5" aria-hidden="true" />}
      <span aria-hidden="true">{label}:</span>
      <span aria-hidden="true">{human}</span>
    </time>
  );
}

export default LiveTimestamp;
