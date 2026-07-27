"use client";

/**
 * AnimatedNumber — count-up animated numeric display.
 *
 * Uses framer-motion's useSpring + useTransform for a buttery-smooth transition
 * whenever the underlying `value` prop changes. The spring has a slightly higher
 * stiffness + lowish damping so large jumps (e.g. supply deltas) snap quickly
 * while small ones (NAV decimals) glide.
 *
 * Also exports a DeltaArrow companion component for green-up / red-down /
 * flat-neutral indication when comparing the current value to a previous one.
 *
 * Formatting:
 *   • Always uses Intl.NumberFormat (commas as thousand separators).
 *   • `decimals` defaults to 2 — pass 0 for whole-number currency, 4 for NAV.
 *   • `prefix` (e.g. "$") and `suffix` (e.g. " MTQ") wrap the formatted number.
 *
 * Accessibility:
 *   • The displayed value uses aria-label so screen readers read "5,000,000 MTQ"
 *     instead of the visual transition. The actual motion is decorative.
 */

import { useEffect, useRef } from "react";
import {
  motion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface AnimatedNumberProps {
  /** Target value to display + animate toward. */
  value: number;
  /** Number of decimal places (default 2). */
  decimals?: number;
  /** Prefix prepended to the formatted value (e.g. "$"). Default "". */
  prefix?: string;
  /** Suffix appended to the formatted value (e.g. " MTQ"). Default "". */
  suffix?: string;
  /** Optional className for the rendered <span>. */
  className?: string;
  /** Spring stiffness — higher = snappier. Default 120. */
  stiffness?: number;
  /** Spring damping — lower = bouncier. Default 20. */
  damping?: number;
}

function formatNumber(n: number, decimals: number) {
  // Guard against NaN / Infinity so a transient bad value doesn't crash.
  if (!Number.isFinite(n)) n = 0;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AnimatedNumber({
  value,
  decimals = 2,
  prefix = "",
  suffix = "",
  className = "",
  stiffness = 120,
  damping = 20,
}: AnimatedNumberProps) {
  // useSpring drives the animation; initialize at the first `value`.
  const spring: MotionValue<number> = useSpring(value, {
    stiffness,
    damping,
    mass: 0.4,
  });
  const display: MotionValue<string> = useTransform(spring, (latest) =>
    `${prefix}${formatNumber(Number(latest), decimals)}${suffix}`
  );

  // Whenever `value` changes, tell the spring to animate toward it.
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      // Skip animation on first render — the spring is already initialized.
      firstRef.current = false;
      spring.set(value);
      return;
    }
    spring.set(value);
  }, [value, spring]);

  // Compute a stable aria-label using the *target* value (not the in-flight one)
  // so screen readers read the final value immediately.
  const ariaLabel = `${prefix}${formatNumber(value, decimals)}${suffix}`.trim();

  return (
    <motion.span className={className} aria-label={ariaLabel} role="status">
      {display}
    </motion.span>
  );
}

/* ============================================================
 * DeltaArrow — green ▲ / red ▼ / grey ▬ comparing two readings
 * ============================================================ */

export interface DeltaArrowProps {
  /** Change vs the previous reading. Positive = up, negative = down, ~0 = flat. */
  delta: number;
  /** Suffix appended to the formatted delta (e.g. "%", " MTQ", ""). Default "". */
  suffix?: string;
  /** Decimals to show on the delta value. Default 4. */
  decimals?: number;
  /** Optional className override (defaults are color-coded by direction). */
  className?: string;
  /** Threshold below which the change is considered "flat". Default 1e-4. */
  epsilon?: number;
}

export function DeltaArrow({
  delta,
  suffix = "",
  decimals = 4,
  className,
  epsilon = 1e-4,
}: DeltaArrowProps) {
  // Stale-SSR / NaN safety
  const d = Number.isFinite(delta) ? delta : 0;
  const flat = Math.abs(d) < epsilon;
  const up = d > 0;
  const text = `${up ? "+" : ""}${d.toFixed(decimals)}${suffix}`;

  if (flat) {
    return (
      <span
        className={
          className ??
          "inline-flex items-center gap-0.5 text-[10px] font-medium text-fg-muted"
        }
        title={`Δ vs previous: ${text}`}
        aria-label={`No change, ${text}`}
      >
        <Minus className="h-2.5 w-2.5" aria-hidden="true" />
        0.00{suffix || ""}
      </span>
    );
  }

  return (
    <span
      className={
        className ??
        `inline-flex items-center gap-0.5 text-[10px] font-semibold ${
          up ? "text-reserve" : "text-destructive"
        }`
      }
      title={`Δ vs previous: ${text}`}
      aria-label={`Change: ${text}`}
    >
      {up ? (
        <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
      ) : (
        <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
      )}
      {text}
    </span>
  );
}
