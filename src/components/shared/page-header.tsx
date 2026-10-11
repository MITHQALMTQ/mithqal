"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * PageHeader — MITHQAL-TECH-SPEC-001 §3.4.2.
 *
 * Standard page title block used at the top of every dashboard page.
 * Renders an H1 (title), optional H2 (description), and optional
 * actions (e.g. a "New Instruction" button) on the right.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-2 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
