"use client";

import { type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * StatusBadge — MITHQAL-TECH-SPEC-001 §3.3.2 (custom components).
 *
 * Coloured status indicator with a leading dot. Maps the canonical
 * instruction lifecycle statuses (mtq-gate.ts / schema.ts) to a small
 * palette of semantic colours. Used on the timeline, exceptions, and
 * dashboard pages.
 */

export type MtqStatus =
  | "RECEIVED"
  | "VALIDATED"
  | "POLICY_APPROVED"
  | "POLICY_BLOCKED"
  | "ROUTE_SELECTED"
  | "FINALITY_F0"
  | "FINALITY_F1"
  | "FINALITY_F2"
  | "FINALITY_F3"
  | "FINALITY_F4"
  | "FINALITY_F5"
  | "FINALITY_F6"
  | "FINALITY_F7"
  | "SETTLED"
  | "EXCEPTION"
  | "SAFE_HALTED"
  | "OPEN"
  | "RESOLVED"
  | "CLOSED"
  | "ACTIVE"
  | "PENDING"
  | "DELIVERED";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  RECEIVED: "secondary",
  VALIDATED: "secondary",
  POLICY_APPROVED: "default",
  POLICY_BLOCKED: "destructive",
  ROUTE_SELECTED: "default",
  FINALITY_F0: "secondary",
  FINALITY_F1: "secondary",
  FINALITY_F2: "secondary",
  FINALITY_F3: "secondary",
  FINALITY_F4: "secondary",
  FINALITY_F5: "secondary",
  FINALITY_F6: "default",
  FINALITY_F7: "default",
  SETTLED: "default",
  EXCEPTION: "destructive",
  SAFE_HALTED: "destructive",
  OPEN: "destructive",
  RESOLVED: "default",
  CLOSED: "secondary",
  ACTIVE: "default",
  PENDING: "secondary",
  DELIVERED: "default",
};

const DOT_COLOR: Record<string, string> = {
  default: "bg-emerald-500",
  secondary: "bg-sky-500",
  destructive: "bg-rose-500",
  outline: "bg-muted-foreground",
};

export function StatusBadge({
  status,
  className,
  icon: Icon,
}: {
  status: MtqStatus | string;
  className?: string;
  icon?: LucideIcon;
}) {
  const variant = STATUS_VARIANT[status] ?? "outline";
  const dotClass = DOT_COLOR[variant];

  return (
    <Badge variant={variant} className={cn("gap-1.5", className)}>
      <span className={cn("size-1.5 rounded-full", dotClass)} aria-hidden="true" />
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      <span className="tabular-nums">{status}</span>
    </Badge>
  );
}
