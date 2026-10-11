"use client";

import {
  AlertTriangle,
  Clock,
  FileCheck,
  GitCompare,
  LayoutDashboard,
  // biome-ignore lint/suspicious/noShadowRestrictedNames: Lucide icon name matches spec §3.2.2
  Map,
  Menu,
  RotateCcw,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Sidebar navigation — MITHQAL-TECH-SPEC-001 §3.2.2.
 *
 * Static nav definition (no RBAC yet — pilot users are operator-level).
 * The `Exceptions` entry carries a synthetic badge of 3 — this is a
 * placeholder count until the `/api/v1/exceptions` endpoint reports
 * the live queue depth. The badge is honest about being synthetic:
 * see `src/lib/mtq-gate.ts` — productionAuthorised=false, so even
 * live exception counts are design-stage data, not real settlement
 * exceptions.
 *
 * Layout: the desktop rail (`Sidebar`) renders as a flex sibling of
 * the main content; the mobile trigger (`MobileSidebarTrigger`)
 * renders inside the topbar so the hamburger is reachable from any
 * viewport.
 */

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Evidence", href: "/evidence", icon: FileCheck },
  { name: "Exceptions", href: "/exceptions", icon: AlertTriangle, badge: 3 },
  { name: "Reconciliation", href: "/reconciliation", icon: GitCompare },
  { name: "Replay", href: "/replay", icon: RotateCcw },
  { name: "Corridor", href: "/corridor", icon: Map },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="flex-1">{item.name}</span>
      {typeof item.badge === "number" ? (
        <Badge
          variant="secondary"
          className="ml-auto tabular-nums"
          aria-label={`${item.badge} open`}
        >
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-14 items-center gap-2 border-b px-4">
      <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">MITHQAL</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Control Plane
        </span>
      </div>
    </div>
  );
}

function SidebarFooter() {
  return (
    <div className="mt-auto border-t p-4">
      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Truth state</p>
        <p className="mt-1">design-stage · pre-pilot · productionAuthorized=false</p>
        <p className="mt-1">MTQ disabled · all writes synthetic</p>
      </div>
    </div>
  );
}

/**
 * Desktop rail. Hidden on mobile. Rendered as a flex sibling of the
 * main content area in the dashboard layout.
 */
export function Sidebar() {
  return (
    <aside
      className="hidden w-60 shrink-0 border-r bg-card md:flex md:flex-col"
      aria-label="Primary sidebar"
    >
      <SidebarHeader />
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <SidebarFooter />
    </aside>
  );
}

/**
 * Mobile hamburger — rendered inside the topbar. Wraps a Sheet that
 * contains the same nav. Self-contained: tracks its own open state.
 */
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <SheetTitle>MITHQAL</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </nav>
        <SidebarFooter />
      </SheetContent>
    </Sheet>
  );
}
