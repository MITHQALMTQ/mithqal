"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  FlaskConical,
  History,
  LayoutDashboard,
  Play,
  Route,
  Scale,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * Sidebar — Glassmorphic Command Center navigation.
 *
 * Flat (no section headers), single list of 10 nav items. The active
 * item is marked with a 2px teal gradient bar pinned to the left edge
 * plus a subtle bg-white/5 wash. Inactive items stay slate-500, lift
 * to white on hover. Width is fixed at w-56 — no collapse toggle.
 *
 * Two exports:
 *   • Sidebar   — desktop <aside>, hidden below md
 *   • MobileNav — Sheet drawer, hidden at md+ (kept for parity but
 *                 the Topbar in this design does not trigger it; the
 *                 trigger button lives wherever the host page wants
 *                 to mount it via children).
 * ────────────────────────────────────────────────────────────── */

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Demo Pilot", href: "/demo-pilot", icon: Play },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Evidence", href: "/evidence", icon: ScrollText },
  { name: "Exceptions", href: "/exceptions", icon: AlertTriangle },
  { name: "Reconciliation", href: "/reconciliation", icon: Scale },
  { name: "Replay", href: "/replay", icon: History },
  { name: "Corridor", href: "/corridor", icon: Route },
  { name: "MTQ Σ Research", href: "/mtq-sigma", icon: FlaskConical },
  { name: "Settings", href: "/settings", icon: Settings },
];

/* ── NavList — shared renderer used by both desktop + mobile drawer ── */

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="flex flex-col gap-0.5 px-3 py-4"
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
              active
                ? "bg-white/5 text-white"
                : "text-slate-500 hover:bg-white/5 hover:text-white",
            )}
          >
            {active && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 to-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              />
            )}
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active
                  ? "text-cyan-400"
                  : "text-slate-500 group-hover:text-white",
              )}
              aria-hidden="true"
            />
            <span className="flex-1 truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Sidebar — desktop <aside> ── */

export function Sidebar() {
  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "sticky top-14 hidden shrink-0 md:block",
        "h-[calc(100vh-3.5rem-1.75rem)] overflow-y-auto",
        "w-56 border-r border-white/5 bg-white/[0.02] backdrop-blur-xl",
      )}
    >
      <NavList />
    </aside>
  );
}

/* ── MobileNav — Sheet drawer for < md screens ── */

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="left"
        className="w-64 border-white/5 bg-[#0a0e1a]/95 p-0 backdrop-blur-xl"
        aria-label="Mobile navigation"
      >
        <SheetHeader className="border-b border-white/5 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-amber-300 to-amber-500 font-mono text-sm font-bold text-[#0a0e1a] shadow-lg shadow-amber-500/20"
            >
              M
            </span>
            <span className="text-sm font-semibold tracking-wide text-white">
              MITHQAL
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto py-2">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Sidebar;
