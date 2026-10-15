"use client";

/**
 * RelativeTime — a self-updating relative timestamp ("3s ago", "5m ago",
 * "2h ago") that re-renders every second.
 *
 * Rules:
 *   • Future timestamp → "just now"
 *   • < 60s  → `${n}s ago`   (and "just now" when n === 0)
 *   • < 60m  → `${n}m ago`
 *   • < 24h  → `${n}h ago`
 *   • < 7d   → `${n}d ago`
 *   • ≥ 7d   → absolute date string (locale-aware)
 *
 * The <span> carries `title={absoluteIso}` so hover users can see the exact
 * timestamp, and `aria-label={absoluteHuman}` so screen-reader users hear a
 * stable, locale-aware absolute time (the visible "3s ago" label is too
 * ephemeral to be useful when read aloud seconds later).
 *
 * A11y: the visible relative string is decorative labeling; the consumer
 * should still place a real <time> element nearby when the absolute time
 * matters semantically.
 *
 * Why setInterval(1000)? The task spec explicitly asks for a 1s refresh so the
 * "live" feel is preserved even on sub-minute deltas. The interval is cleaned
 * up on unmount.
 */

import * as React from "react";

export interface RelativeTimeProps {
  timestamp: string | Date;
  className?: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function toMs(ts: string | Date): number {
  const d = ts instanceof Date ? ts : new Date(ts);
  return d.getTime();
}

function formatRelative(diffMs: number, absolute: Date): string {
  // Future → "just now"
  if (diffMs < 0) return "just now";

  if (diffMs < MINUTE) {
    const s = Math.floor(diffMs / 1000);
    return s <= 0 ? "just now" : `${s}s ago`;
  }
  if (diffMs < HOUR) {
    return `${Math.floor(diffMs / MINUTE)}m ago`;
  }
  if (diffMs < DAY) {
    return `${Math.floor(diffMs / HOUR)}h ago`;
  }
  if (diffMs < WEEK) {
    return `${Math.floor(diffMs / DAY)}d ago`;
  }
  // ≥ 7 days → absolute date
  return absolute.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function RelativeTime({
  timestamp,
  className,
}: RelativeTimeProps): React.ReactElement {
  const absoluteMs = toMs(timestamp);
  const absolute = new Date(absoluteMs);
  const absoluteIso = absolute.toISOString();
  const absoluteHuman = absolute.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Use a ticking counter so the relative string re-renders every second.
  // State holds a counter; `now` is derived on each render.
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    const id = setInterval(() => {
      force();
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const now = Date.now();
  const diff = now - absoluteMs;
  const label = formatRelative(diff, absolute);

  return (
    <span
      className={className}
      title={absoluteIso}
      // Surface a stable absolute time to AT; the visible label is decorative.
      aria-label={absoluteHuman}
    >
      {label}
    </span>
  );
}

export default RelativeTime;
