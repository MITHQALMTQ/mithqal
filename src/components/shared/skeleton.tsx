"use client";

/**
 * Skeleton loaders for the LIVE data dashboard.
 *
 * Exports:
 *   • `Skeleton`            — base animated line(s), accepts `lines` + `className`
 *   • `StatCardSkeleton`    — premium StatCard placeholder (icon + label + value + sparkline)
 *   • `TableSkeleton`       — table-row placeholder grid (rows × cols)
 *   • `CardSkeleton`        — generic glass-depth card placeholder
 *
 * Visual recipe (matches the institutional gold theme):
 *   base   = bg-slate-800/60 (dark slate, theme-aware via color-mix)
 *   accent = .shimmer-bg     (gold sweep animation defined in globals.css)
 *
 * `animate-pulse` (Tailwind) provides the slow opacity breathe;
 * `.shimmer-bg` overlays a 2s gold sweep. Both honor
 * `prefers-reduced-motion` (globals.css @media guard) so a11y is preserved.
 *
 * Usage with TanStack Query (see src/hooks/use-demo-data.ts):
 *   const { data, isLoading } = useCases();
 *   if (isLoading) return <TableSkeleton rows={6} cols={5} />;
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * Base Skeleton
 * ------------------------------------------------------------------------- */

export interface SkeletonProps {
  /** Number of stacked skeleton lines to render. Default 3. */
  lines?: number;
  /** Optional className merged into the wrapper. */
  className?: string;
}

/**
 * Base animated skeleton: `lines` stacked bars, each with a Tailwind
 * `animate-pulse` breathe + the gold `.shimmer-bg` sweep.
 */
export function Skeleton({ lines = 3, className }: SkeletonProps): React.ReactElement {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "shimmer-bg relative h-4 w-full overflow-hidden rounded-md",
            "bg-slate-800/60 animate-pulse",
          )}
          style={{ width: `${85 - i * 8}%` }}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * StatCardSkeleton — premium stat-card placeholder
 * ------------------------------------------------------------------------- */

export function StatCardSkeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn(
        "glass-depth card-lift relative overflow-hidden rounded-xl p-4",
        "flex flex-col gap-3",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading statistic"
    >
      {/* Label row: icon + label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="shimmer-bg h-8 w-8 animate-pulse rounded-lg bg-slate-800/60" />
          <div className="shimmer-bg h-3 w-24 animate-pulse rounded bg-slate-800/60" />
        </div>
        <div className="shimmer-bg h-5 w-5 animate-pulse rounded bg-slate-800/60" />
      </div>
      {/* Value */}
      <div className="shimmer-bg h-7 w-32 animate-pulse rounded-md bg-slate-800/60" />
      {/* Sparkline row */}
      <div className="flex items-center justify-between gap-3">
        <div className="shimmer-bg h-3 w-20 animate-pulse rounded bg-slate-800/60" />
        <div className="shimmer-bg h-8 w-24 animate-pulse rounded bg-slate-800/60" />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * TableSkeleton — rows × cols grid placeholder
 * ------------------------------------------------------------------------- */

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: TableSkeletonProps): React.ReactElement {
  return (
    <div
      className={cn("w-full", className)}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${rows} table rows`}
    >
      <span className="sr-only">Loading table data…</span>
      <div className="flex flex-col gap-1">
        {/* Header row */}
        <div className="grid gap-3 border-b border-slate-800/60 pb-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={`th-${c}`}
              className="shimmer-bg h-3 w-3/4 animate-pulse rounded bg-slate-800/60"
            />
          ))}
        </div>
        {/* Body rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={`tr-${r}`}
            className="grid gap-3 py-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={`td-${r}-${c}`}
                className="shimmer-bg h-4 w-full animate-pulse rounded bg-slate-800/60"
                style={{ width: `${70 + ((r + c) % 3) * 10}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * CardSkeleton — generic glass-depth card placeholder
 * ------------------------------------------------------------------------- */

export function CardSkeleton({ className }: { className?: string }): React.ReactElement {
  return (
    <div
      className={cn(
        "glass-depth relative overflow-hidden rounded-xl p-6",
        "flex flex-col gap-4",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading card"
    >
      {/* Title */}
      <div className="shimmer-bg h-5 w-2/3 animate-pulse rounded-md bg-slate-800/60" />
      {/* Body lines */}
      <div className="flex flex-col gap-2">
        <div className="shimmer-bg h-3 w-full animate-pulse rounded bg-slate-800/60" />
        <div className="shimmer-bg h-3 w-full animate-pulse rounded bg-slate-800/60" />
        <div className="shimmer-bg h-3 w-4/5 animate-pulse rounded bg-slate-800/60" />
      </div>
      {/* Footer chips */}
      <div className="mt-2 flex items-center gap-2">
        <div className="shimmer-bg h-6 w-20 animate-pulse rounded-full bg-slate-800/60" />
        <div className="shimmer-bg h-6 w-16 animate-pulse rounded-full bg-slate-800/60" />
      </div>
    </div>
  );
}

export default Skeleton;
