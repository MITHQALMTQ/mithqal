"use client";

/**
 * EmptyState — centered empty-state placeholder for filtered / zero-result
 * dashboard panels.
 *
 * Visuals: amber/gold theme on a `glass-depth` background, large icon in a
 * circular gold-tinted halo, bold title, muted description, optional action.
 *
 * Props:
 *   • title       (required) — short bold headline
 *   • description (optional) — muted explanatory line
 *   • icon        (optional) — a lucide-react icon component (LucideIcon)
 *   • action      (optional) — ReactNode rendered as a primary CTA button
 *
 * A11y: the wrapping <section> is `aria-label`-described for screen readers
 * and the icon is decorative-only (aria-hidden) — the title carries the meaning.
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <section
      aria-label={title}
      className={cn(
        "glass-depth relative flex w-full flex-col items-center justify-center gap-4 rounded-xl px-6 py-16 text-center",
        className,
      )}
    >
      {/* Icon halo */}
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--gold) 24%, transparent) 0%, transparent 70%)",
          }}
        />
        <Icon
          aria-hidden="true"
          className="relative h-7 w-7 text-amber-500"
          strokeWidth={1.75}
        />
      </div>

      {/* Title + description */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-semibold text-amber-100">{title}</h3>
        {description ? (
          <p className="mx-auto max-w-md text-sm text-slate-400">{description}</p>
        ) : null}
      </div>

      {/* Optional action */}
      {action ? <div className="mt-2">{action}</div> : null}
    </section>
  );
}

export default EmptyState;
