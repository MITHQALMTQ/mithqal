"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ChevronsLeft,
  ChevronsRight,
  FlaskConical,
  History,
  LayoutDashboard,
  Route,
  Scale,
  ScrollText,
  Settings,
  Clock,
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
 * Sidebar — desktop app-shell navigation for the MITHQAL Assurance
 * dashboard, plus a Sheet-based MobileNav export for < md screens.
 *
 * Desktop nav groups the 9 institutional tabs into three labelled
 * sections (OVERVIEW / OPERATIONS / CONFIG), supports an icon-only
 * collapse mode persisted to localStorage, and marks the active link
 * with aria-current="page".
 *
 * MobileNav is exported separately so the Topbar can wrap its own
 * trigger button (SheetTrigger is data-slot-driven so any child works).
 * ────────────────────────────────────────────────────────────── */

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  /** Optional short badge (e.g. "BETA") shown beside the label. */
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Demo Pilot", href: "/demo-pilot", icon: Play },
      { name: "Timeline", href: "/timeline", icon: Clock },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Evidence", href: "/evidence", icon: ScrollText },
      { name: "Exceptions", href: "/exceptions", icon: AlertTriangle },
      { name: "Reconciliation", href: "/reconciliation", icon: Scale },
      { name: "Replay", href: "/replay", icon: History },
    ],
  },
  {
    label: "Config",
    items: [
      { name: "Corridor", href: "/corridor", icon: Route },
      { name: "MTQ Σ Research", href: "/research", icon: FlaskConical, badge: "Σ" },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const COLLAPSE_KEY = "mithqal-sidebar-collapsed";

function readCollapsed(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "true";
  } catch {
    return null;
  }
}

function writeCollapsed(v: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COLLAPSE_KEY, String(v));
  } catch {
    /* ignore */
  }
}

/* ──────────────────────────────────────────────────────────────
 * NavList — shared renderer used by both the desktop <aside> and
 * the mobile <Sheet> drawer. Renders the three labelled sections.
 * `collapsed` only affects the desktop variant (mobile is always
 * expanded inside its own drawer).
 * ────────────────────────────────────────────────────────────── */

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className={cn("flex flex-col gap-5 px-2", collapsed && "px-1.5")}
    >
      {NAV_SECTIONS.map((section) => (
        <section key={section.label} className="flex flex-col gap-1">
          {!collapsed && (
            <h3
              className={cn(
                "px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted",
              )}
            >
              {section.label}
            </h3>
          )}
          {section.items.map((item) => {
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
                title={collapsed ? item.name : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-gold/10 text-gold"
                    : "text-fg-muted hover:bg-ink-card/60 hover:text-foreground",
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold"
                  />
                )}
                <Icon
                  className={cn("h-4 w-4 shrink-0", active && "text-gold")}
                  aria-hidden="true"
                />
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate font-medium">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-gold",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </section>
      ))}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Sidebar — desktop <aside>. Sticky below the Topbar, with a
 * collapse toggle pinned to the bottom that flips between w-60
 * (full labels) and w-16 (icon-only). Persisted via localStorage.
 * ────────────────────────────────────────────────────────────── */

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    // Defer to next microtask to avoid synchronous effect→state loop
    // (React 19 react-hooks/set-state-in-effect rule).
    queueMicrotask(() => {
      const saved = readCollapsed();
      if (saved !== null) setCollapsed(saved);
    });
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsed(next);
      return next;
    });
  }, []);

  return (
    <aside
      aria-label="Sidebar navigation"
      className={cn(
        "sticky top-14 hidden shrink-0 md:block",
        "h-[calc(100vh-3.5rem-1.75rem)] overflow-y-auto",
        "border-r border-line/60 bg-ink-soft/40 backdrop-blur-sm",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <NavList collapsed={collapsed} />
        </div>

        {/* ── Collapse toggle (pinned to bottom) ── */}
        <div
          className={cn(
            "border-t border-line/60 px-2 py-2",
            collapsed && "px-1.5",
          )}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
            className={cn(
              "flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-2 text-xs font-medium text-fg-muted transition-colors hover:border-line/60 hover:bg-ink-card/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ──────────────────────────────────────────────────────────────
 * MobileNav — Sheet-based mobile drawer. Exports a wrapper that
 * takes a trigger element as its child (SheetTrigger is forwarded).
 * Closes the drawer on link navigation.
 *
 * This export is preserved for use by the Topbar (the MobileNav
 * trigger button is rendered inside Topbar via this wrapper).
 * ────────────────────────────────────────────────────────────── */

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          "w-72 border-line/60 bg-ink/95 p-0 backdrop-blur-xl",
        )}
        aria-label="Mobile navigation"
      >
        <SheetHeader className="border-b border-line/60 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md",
                "border border-gold/40 bg-gradient-to-br from-gold-soft/20 to-gold-deep/30",
                "font-mono text-sm font-semibold text-gold",
              )}
              aria-hidden="true"
            >
              M
            </span>
            <span className="font-mono text-sm font-semibold tracking-wider text-foreground">
              MITHQAL
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto px-2 py-4">
          <NavList onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Sidebar;
