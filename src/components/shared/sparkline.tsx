"use client";

/**
 * Sparkline — a reusable, decorative mini-chart for stat cards.
 *
 * Renders a tiny recharts `<LineChart>` (or `<AreaChart>` when `showArea`
 * is set) with NO axes, NO grid, NO tooltip — purely ornamental. Designed
 * to sit at the bottom-right of a `<StatCard />` or anywhere a compact
 * trend hint is wanted.
 *
 * Props:
 *  - data       : number[]              — the series to plot
 *  - color      : string (hex / rgb)   — default "#f59e0b" (amber-500)
 *  - height     : number (default 32)
 *  - width      : number (default 80)
 *  - showArea   : boolean (default false) — fill below the line via gradient
 *
 * Empty / single-point data is handled gracefully (a flat baseline is
 * drawn so the card layout never collapses).
 *
 * Color note: pass a *concrete* hex/rgb string. CSS `var(--…)` strings
 * are NOT resolved by the SVG presentation attributes recharts emits
 * (`stop-color`, `stroke`); if you want to use a theme token, resolve it
 * once on the caller side (e.g. via `getComputedStyle`) before passing
 * the resulting hex string in.
 *
 * Exports: named `Sparkline` + default.
 */

import * as React from "react";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  ResponsiveContainer,
  YAxis,
} from "recharts";

export interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showArea?: boolean;
  className?: string;
  /** aria-label for the decorative chart; defaults to "Trend". */
  ariaLabel?: string;
}

const DEFAULT_COLOR = "#f59e0b";

/**
 * Normalize the incoming `number[]` into the `[{ value: number }]` shape
 * recharts expects, and guarantee at least 2 points so the line/area is
 * always visible (a single point renders nothing in recharts). When the
 * series is empty we emit a flat baseline of zeros.
 */
function toChartData(data: number[]): { value: number }[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [{ value: 0 }, { value: 0 }];
  }
  if (data.length === 1) {
    return [{ value: data[0] }, { value: data[0] }];
  }
  return data.map((value) => ({ value }));
}

/**
 * Compute a tight Y-domain so small variations still read as motion.
 * Returns a `[min, max]` tuple that recharts' `<YAxis domain=… />` accepts.
 * When all values are identical we widen the domain by ±1 to avoid the
 * chart engine painting a flat horizontal stroke at the very edge.
 */
function computeYDomain(data: number[]): [number, number] {
  if (data.length === 0) return [0, 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (min === max) {
    // Flat line — pad so the stroke renders centered.
    return [min - 1, max + 1];
  }
  // Pad by 10% of the range on each side so peaks/troughs don't touch the
  // top/bottom edges of the tiny viewport.
  const pad = (max - min) * 0.1 || 1;
  return [min - pad, max + pad];
}

/**
 * Coerce the `color` prop into a safe SVG color string. Pass-through for
 * hex / rgb / named colors. If a `var(--…)` string is supplied, fall back
 * to the default amber so SSR renders a sensible color; the caller is
 * expected to resolve CSS variables before invoking the component.
 */
function safeColor(color: string): string {
  if (!color || typeof color !== "string") return DEFAULT_COLOR;
  if (color.startsWith("var(")) {
    // CSS variables can't be resolved inside SVG presentation attributes
    // at parse time — use the default rather than render an invisible stroke.
    return DEFAULT_COLOR;
  }
  return color;
}

export function Sparkline({
  data,
  color = DEFAULT_COLOR,
  height = 32,
  width = 80,
  showArea = false,
  className,
  ariaLabel = "Trend",
}: SparklineProps) {
  const chartData = React.useMemo(() => toChartData(data), [data]);
  const yDomain = React.useMemo(() => computeYDomain(data), [data]);

  // Resolve once during render (cheap, no state, no effect).
  const stroke = React.useMemo(() => safeColor(color), [color]);

  // Stable gradient id so multiple Sparklines on the same page don't clash.
  const gradientId = React.useId().replace(/[:]/g, "");

  const wrapperStyle: React.CSSProperties = {
    width,
    height,
    // Decorative — hide from AT without losing layout.
    pointerEvents: "none",
  };

  const ariaProps = {
    role: "img" as const,
    "aria-label": ariaLabel,
  };

  return (
    <div
      className={className}
      style={wrapperStyle}
      {...ariaProps}
    >
      <ResponsiveContainer width="100%" height="100%">
        {showArea ? (
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={`spark-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#spark-area-${gradientId})`}
              isAnimationActive={false}
              dot={false}
              // Silence recharts' default focus outline on the SVG path.
              activeDot={false}
            />
            {/* Hidden Y axis so recharts computes a tight domain
                (otherwise the area bottoms-out at 0). */}
            <YAxis dataKey="value" domain={yDomain} hide />
          </AreaChart>
        ) : (
          <LineChart
            data={chartData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <Line
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              activeDot={false}
              // Stretch the line to the full vertical extent of the tiny
              // viewport by clamping the Y domain (see computeYDomain).
              connectNulls
            />
            {/* Hidden Y axis so recharts still computes the domain.
                `domain` is applied here so the line is scaled tightly. */}
            <YAxis dataKey="value" domain={yDomain} hide />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default Sparkline;
