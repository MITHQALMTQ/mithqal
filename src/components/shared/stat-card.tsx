"use client";

/**
 * StatCard — a unified, premium stat card combining icon + label +
 * count-up value + sparkline.
 *
 * Visual stack:
 *   ┌──────────────────────────────────────┐
 *   │ [icon]   LABEL (small uppercase)     │
 *   │                                       │
 *   │ $4,450,000             ▁▂▃▅▆▇ (spark) │
 *   │ sub text                              │
 *   └──────────────────────────────────────┘
 *
 * Built on the shadcn `<Card>` primitive, with two CSS utilities layered
 * on top (defined in globals.css):
 *   • `.glass-depth` — gold-tinted glassmorphism, premium inner shadow
 *   • `.card-lift`   — spring-bounce translateY(-4px) on hover
 *
 * Color tokens (color prop):
 *   gold | emerald | amber | red | blue | purple | cyan
 *
 * `value` may be a string or number. Numbers are animated through the
 * `<CountUp />` motion value (0 → value over `duration`); strings render
 * directly. Pass `prefix` / `suffix` / `decimals` to control formatting.
 *
 * Exports: named `StatCard` + default.
 */

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { CountUp } from "./count-up";
import { Sparkline } from "./sparkline";

export type StatColor =
  | "gold"
  | "emerald"
  | "amber"
  | "red"
  | "blue"
  | "purple"
  | "cyan";

/**
 * Per-color design tokens. Each entry maps a `color` prop value to:
 *   • text      — Tailwind text color class for the icon + the value accent
 *   • iconBg    — translucent tinted chip behind the icon
 *   • sparkline — hex string passed into <Sparkline color=…/>
 *
 * The hex strings are kept explicit (not via var(--…)) so SVG gradient stops
 * receive concrete values; the choice reflects the institutional palette
 * (gold ≈ amber-500 = #f59e0b; reserve ≈ emerald-400 = #34d399).
 */
const COLOR_MAP: Record<
  StatColor,
  { text: string; iconBg: string; sparkline: string }
> = {
  gold: {
    text: "text-amber-400",
    iconBg: "bg-amber-400/10 ring-1 ring-amber-400/20",
    sparkline: "#f59e0b",
  },
  emerald: {
    text: "text-emerald-400",
    iconBg: "bg-emerald-400/10 ring-1 ring-emerald-400/20",
    sparkline: "#34d399",
  },
  amber: {
    text: "text-amber-400",
    iconBg: "bg-amber-400/10 ring-1 ring-amber-400/20",
    sparkline: "#f59e0b",
  },
  red: {
    text: "text-red-400",
    iconBg: "bg-red-400/10 ring-1 ring-red-400/20",
    sparkline: "#f87171",
  },
  blue: {
    text: "text-blue-400",
    iconBg: "bg-blue-400/10 ring-1 ring-blue-400/20",
    sparkline: "#60a5fa",
  },
  purple: {
    text: "text-purple-400",
    iconBg: "bg-purple-400/10 ring-1 ring-purple-400/20",
    sparkline: "#c084fc",
  },
  cyan: {
    text: "text-cyan-400",
    iconBg: "bg-cyan-400/10 ring-1 ring-cyan-400/20",
    sparkline: "#22d3ee",
  },
};

export interface StatCardProps {
  /** Short headline label, e.g. "Total Reserve", "NAV", "Proofs Issued". */
  label: string;
  /** Primary metric. Numbers animate; strings render verbatim. */
  value: string | number;
  /** Optional lucide icon rendered in the top-left tinted chip. */
  icon?: LucideIcon;
  /** Color theme. Default "gold". */
  color?: StatColor;
  /** Optional sparkline data — when supplied, renders bottom-right of card. */
  sparklineData?: number[];
  /** Optional sub-text (delta, units, source) shown below the value. */
  sub?: string;
  /** Decimal places (forwarded to <CountUp/> when value is numeric). Default 0. */
  decimals?: number;
  /** Prefix (forwarded to <CountUp/>). */
  prefix?: string;
  /** Suffix (forwarded to <CountUp/>). */
  suffix?: string;
  /** Override the card's outer className (e.g. for grid sizing). */
  className?: string;
  /** Optional href/onClick — when set, the whole card is a link/button. */
  href?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "gold",
  sparklineData,
  sub,
  decimals = 0,
  prefix,
  suffix,
  className,
  href,
  onClick,
}: StatCardProps) {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.gold;
  const isNumeric = typeof value === "number";
  const hasSparkline =
    Array.isArray(sparklineData) && sparklineData.length > 0;

  // Compose the inner JSX once so it can be slotted under either a <Card>
  // wrapper or an <a>/<button> wrapper when href/onClick is provided.
  const inner = (
    <>
      {/* ── Top row: icon chip + uppercase label ── */}
      <div className="flex items-center gap-3">
        {Icon ? (
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              colors.iconBg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-4 w-4", colors.text)} />
          </span>
        ) : null}
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
          {label}
        </p>
      </div>

      {/* ── Middle row: big value (left) + sparkline (right) ── */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div
          className={cn(
            "font-display text-2xl font-bold leading-none sm:text-[1.75rem]",
            isNumeric ? "text-foreground" : colors.text
          )}
        >
          {isNumeric ? (
            <CountUp
              value={value}
              decimals={decimals}
              prefix={prefix}
              suffix={suffix}
            />
          ) : (
            <span>
              {prefix ?? ""}
              {value}
              {suffix ?? ""}
            </span>
          )}
        </div>

        {hasSparkline ? (
          <div className="shrink-0 opacity-80">
            <Sparkline
              data={sparklineData!}
              color={colors.sparkline}
              showArea
              height={28}
              width={70}
            />
          </div>
        ) : null}
      </div>

      {/* ── Sub text ── */}
      {sub ? (
        <p className="mt-2 text-xs text-fg-muted">{sub}</p>
      ) : null}
    </>
  );

  const baseClass = cn(
    "glass-depth card-lift relative overflow-hidden p-5",
    "flex flex-col gap-0 rounded-xl",
    className
  );

  // Link affordance: anchor wrapping the card body. Preserves the
  // glass-depth surface; adds a subtle gold focus ring via .premium-focus.
  if (href) {
    return (
      <a
        href={href}
        className={cn(baseClass, "premium-focus group")}
        // The whole card is interactive; the inner elements are decorative.
      >
        {inner}
      </a>
    );
  }

  // Button affordance (e.g. to open a modal).
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(baseClass, "premium-focus text-left")}
      >
        {inner}
      </button>
    );
  }

  // Default: a static Card surface.
  return <Card className={baseClass}>{inner}</Card>;
}

export default StatCard;
