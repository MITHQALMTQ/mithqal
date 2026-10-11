"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * MetricCard — MITHQAL-TECH-SPEC-001 §3.4.1.
 *
 * KPI display with title, value, delta (positive/negative trend), and
 * a small caption. All values are SYNTHETIC in pilot — pilot callers
 * are expected to pass the synthetic value alongside a `synthetic`
 * flag so the card can label itself honestly.
 */
export function MetricCard({
  title,
  value,
  change,
  trend,
  caption,
  synthetic = true,
  className,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  caption?: string;
  synthetic?: boolean;
  className?: string;
}) {
  const trendIcon =
    trend === "up" ? (
      <ArrowUpRight className="size-3 text-emerald-500" aria-hidden="true" />
    ) : trend === "down" ? (
      <ArrowDownRight className="size-3 text-rose-500" aria-hidden="true" />
    ) : trend === "neutral" ? (
      <Minus className="size-3 text-muted-foreground" aria-hidden="true" />
    ) : null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        {change ? (
          <div className="flex items-center gap-1 text-xs">
            {trendIcon}
            <span className="text-muted-foreground">{change}</span>
          </div>
        ) : null}
        {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
        {synthetic ? (
          <p className="pt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Synthetic · pilot
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
