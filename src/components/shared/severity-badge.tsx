"use client";

import { type VariantProps } from "class-variance-authority";
import { type LucideIcon } from "lucide-react";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SeverityBadge — coloured badge for exception severity
 * (LOW / MEDIUM / HIGH / CRITICAL).
 *
 * Palette aligns with the §3.1.1 status colours:
 *   LOW       — outline (neutral)
 *   MEDIUM    — secondary (sky)
 *   HIGH      — default primary (warning amber)
 *   CRITICAL  — destructive (rose)
 *
 * The badge is honest: severity is a design-stage label, not a live
 * production risk indicator — see mtq-gate.ts (mtqDisabled=true).
 */
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const SEVERITY_VARIANT: Record<Severity, BadgeVariant> = {
  LOW: "outline",
  MEDIUM: "secondary",
  HIGH: "default",
  CRITICAL: "destructive",
};

const SEVERITY_DOT: Record<Severity, string> = {
  LOW: "bg-muted-foreground",
  MEDIUM: "bg-sky-500",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-rose-500",
};

export function SeverityBadge({
  severity,
  className,
  icon: Icon,
}: {
  severity: Severity | string;
  className?: string;
  icon?: LucideIcon;
}) {
  const sev = (severity as Severity) ?? "LOW";
  const variant = SEVERITY_VARIANT[sev] ?? "outline";
  const dot = SEVERITY_DOT[sev] ?? "bg-muted-foreground";

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} aria-hidden="true" />
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      <span>{sev}</span>
    </Badge>
  );
}
