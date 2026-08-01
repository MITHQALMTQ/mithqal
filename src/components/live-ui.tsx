"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, RefreshCw } from "lucide-react";

/**
 * LiveIndicator — global "Live" pulse badge for the header.
 * Shows a green pulsing dot + "Live" text + auto-refresh interval.
 * Used on every page to signal real-time data.
 */
export function LiveIndicator({ intervalMs = 30_000 }: { intervalMs?: number }) {
  const [seconds, setSeconds] = useState(0);
  const intervalSec = Math.round(intervalMs / 1000);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => (s + 1) % intervalSec);
    }, 1000);
    return () => clearInterval(id);
  }, [intervalSec]);

  const remaining = intervalSec - seconds;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-reserve/30 bg-reserve/10 px-2.5 py-1 text-[10px] font-semibold text-reserve">
      <motion.span
        className="inline-block h-1.5 w-1.5 rounded-full bg-reserve"
        animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <span>Live</span>
      <span className="text-reserve/60">·</span>
      <span className="flex items-center gap-0.5 text-reserve/80">
        <RefreshCw className="h-2.5 w-2.5" style={{ animation: `spin ${remaining}s linear infinite` }} />
        {remaining}s
      </span>
    </div>
  );
}

/**
 * LastUpdated — "X seconds ago" freshness timestamp.
 */
export function LastUpdated({ timestamp }: { timestamp?: string | number | Date | null }) {
  const [ago, setAgo] = useState("just now");

  useEffect(() => {
    if (!timestamp) {
      const rafId = requestAnimationFrame(() => setAgo("just now"));
      return () => cancelAnimationFrame(rafId);
    }
    const update = () => {
      const ts = new Date(timestamp).getTime();
      const diff = Math.floor((Date.now() - ts) / 1000);
      if (diff < 5) setAgo("just now");
      else if (diff < 60) setAgo(`${diff}s ago`);
      else if (diff < 3600) setAgo(`${Math.floor(diff / 60)}m ago`);
      else setAgo(`${Math.floor(diff / 3600)}h ago`);
    };
    const rafId = requestAnimationFrame(update);
    const intervalId = setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(intervalId);
    };
  }, [timestamp]);

  return (
    <span className="text-[10px] text-fg-muted" title={timestamp ? new Date(timestamp).toISOString() : undefined}>
      {ago}
    </span>
  );
}

/**
 * DeltaArrow — shows ± delta vs previous value (green up / red down).
 */
export function DeltaArrow({
  current,
  previous,
  format = "number",
  decimals = 2,
}: {
  current: number;
  previous?: number;
  format?: "number" | "percent" | "currency";
  decimals?: number;
}) {
  if (previous == null || previous === 0 || current === previous) {
    return <span className="text-[10px] text-fg-muted">—</span>;
  }

  const delta = current - previous;
  const pctChange = (delta / Math.abs(previous)) * 100;
  const isUp = delta > 0;

  const formatVal = (v: number) => {
    if (format === "currency") return `$${v.toFixed(decimals)}`;
    if (format === "percent") return `${v.toFixed(decimals)}%`;
    return v.toFixed(decimals);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={`${current}-${previous}`}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.3 }}
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
          isUp ? "text-reserve" : "text-red-400"
        }`}
      >
        {isUp ? "▲" : "▼"} {formatVal(Math.abs(delta))} ({Math.abs(pctChange).toFixed(2)}%)
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * VerifyOnChainBadge — "9/9 PASS" badge linking to on-chain test.
 */
export function VerifyOnChainBadge({ score = "9/9", href = "/api/onchain-test" }: { score?: string; href?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold text-gold transition hover:bg-gold/20"
      title="View on-chain contract verification"
    >
      <Activity className="h-2.5 w-2.5" />
      On-chain: {score} PASS
    </a>
  );
}

/**
 * AnimatedNumber — count-up animation when value changes.
 * (Moved here from transparency.tsx for global reuse)
 */
export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (display === value) return;
    const start = display;
    const diff = value - start;
    const duration = 500;
    const startTime = performance.now();

    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, display]);

  const formatted = display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return (
    <span className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
