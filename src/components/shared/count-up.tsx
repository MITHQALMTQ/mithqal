"use client";

/**
 * CountUp — animated numeric counter driven by framer-motion.
 *
 * Animates a number from 0 → `value` on mount, then re-animates toward any
 * subsequent value change. Uses `useMotionValue` + `animate()` + `useTransform`
 * so the DOM never re-renders during the animation (only the text node moves).
 *
 * Props:
 *  - value     : number          — target value to count up to
 *  - decimals  : number  (0)     — fixed decimal places
 *  - prefix    : string  ("")    — prepended to the formatted value (e.g. "$")
 *  - suffix    : string  ("")    — appended to the formatted value (e.g. " MTQ")
 *  - duration  : number  (1.0)   — animation length in seconds
 *  - format    : boolean (true) — use `toLocaleString` for thousand separators
 *
 * Accessibility:
 *  • The transient number is decorative; the span exposes an `aria-label`
 *    carrying the *final* formatted value so screen readers don't stutter
 *    through the in-flight decimals.
 *  • Honors `prefers-reduced-motion`: when the user has opted out, the
 *    value is set instantly (no tween).
 *
 * Exports: named `CountUp` + default.
 *
 * Example:
 *   <CountUp value={4450000} prefix="$" />      // "$0" → "$4,450,000"
 *   <CountUp value={0.8421} decimals={4} />    // "0" → "0.8421"
 *   <CountUp value={1250} suffix=" MTQ" />     // "0 MTQ" → "1,250 MTQ"
 */

import * as React from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";

export interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: boolean;
  className?: string;
  /** Render as a different element (default "span"). */
  as?: keyof typeof motion;
}

/**
 * Format a number for display.
 * - `format=true`  → toLocaleString with the requested decimal places
 * - `format=false` → toFixed with the requested decimal places (no thousand sep.)
 * NaN / Infinity are coerced to 0 so a transient bad value never crashes the
 * render.
 */
function formatNumber(n: number, decimals: number, format: boolean): string {
  if (!Number.isFinite(n)) n = 0;
  if (format) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  return n.toFixed(decimals);
}

export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.0,
  format = true,
  className,
  as = "span",
}: CountUpProps) {
  // Initialize the motion value at 0 so the first animation is a true
  // "0 → value" tween. (Subsequent value changes animate from wherever
  // the previous tween left off.)
  const mv: MotionValue<number> = useMotionValue(0);

  // Map the raw number through the formatter; this stays a MotionValue<string>
  // so we can hand it directly to <motion.span> as a child (framer-motion
  // subscribes to it and updates textContent on each frame, no React state).
  const display: MotionValue<string> = useTransform(mv, (latest) =>
    `${prefix}${formatNumber(Number(latest), decimals, format)}${suffix}`
  );

  React.useEffect(() => {
    // Honor reduced-motion: jump instantly for users who opted out.
    const prefersReduced =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      mv.set(value);
      return;
    }

    const controls = animate(mv, value, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [mv, value, duration]);

  // aria-label carries the *final* value (not the in-flight one) so screen
  // readers announce the destination immediately, not the jank of decimals
  // ticking past.
  const ariaLabel =
    `${prefix}${formatNumber(value, decimals, format)}${suffix}`.trim();

  // Cast to a motion component keyed by `as` so callers can swap to <div>
  // for block-level numbers (e.g. huge hero counters).
  const MotionTag = (motion as unknown as Record<string, React.ElementType>)[as] ?? motion.span;

  return (
    <MotionTag
      className={className}
      aria-label={ariaLabel}
      role="status"
      // Keep the DOM stable across renders so React doesn't tear down the
      // motion value's text node mid-animation.
      suppressHydrationWarning
    >
      {display}
    </MotionTag>
  );
}

export default CountUp;
