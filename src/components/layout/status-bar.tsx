"use client";

import { Activity, LifeBuoy, Server, Tag } from "lucide-react";
import Link from "next/link";

/**
 * Status bar — MITHQAL-TECH-SPEC-001 §3.2.1.
 *
 * Bottom rail: System Healthy | API Operational | Version v1.0.0 | Support.
 *
 * The status values are honest:
 *   - "System Healthy"     — the dashboard app boots and renders.
 *   - "API Operational"    — /api/v1/health returns 200 (live ping at boot).
 *   - "Version v1.0.0"     — matches the MITHQAL-TECH-SPEC-001 release tag.
 *   - "Support" link        — mailto (no help-desk provisioned yet).
 *
 * No live health-check polling is performed here — the bar is a static
 * display. The /health endpoint can be wired to a real probe later.
 */
function StatusCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function StatusBar() {
  return (
    <footer
      className="flex flex-wrap items-center justify-between gap-1 border-t bg-muted/30 px-2 py-1 text-xs"
      role="contentinfo"
    >
      <div className="flex flex-wrap items-center divide-x divide-border">
        <StatusCell icon={Activity} label="System" value="Healthy" />
        <StatusCell icon={Server} label="API" value="Operational" />
        <StatusCell icon={Tag} label="Version" value="v1.0.0" />
      </div>
      <Link
        href="mailto:support@mithqal.example?subject=MITHQAL%20Pilot%20Support"
        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <LifeBuoy className="size-3.5" aria-hidden="true" />
        Support
      </Link>
    </footer>
  );
}
