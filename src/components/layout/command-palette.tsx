"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Cookie,
  FlaskConical,
  Gauge,
  History,
  LayoutDashboard,
  type LucideIcon,
  Moon,
  RefreshCw,
  Route,
  Scale,
  ScrollText,
  ShieldAlert,
  Settings,
  Sun,
  Zap,
  Clock,
  FileText,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * CommandPalette — ⌘K palette for the MITHQAL Assurance dashboard.
 *
 * Driven by cmdk (via the shadcn <Command> wrapper) inside a Radix
 * Dialog. Three command groups are rendered:
 *   • Navigation — the 9 institutional dashboard tabs
 *   • Legal       — Privacy, Terms, Cookies, Risk Disclosure
 *   • Actions     — Toggle Theme, Toggle DEMO/LIVE, Refresh Status
 *
 * Keyboard:
 *   • ⌘K / Ctrl+K  → open (handled by the parent Topbar)
 *   • Esc           → close (Radix Dialog native)
 *   • ↑ ↓          → move selection (cmdk native, wraps with `loop`)
 *   • Enter         → select + execute + close (cmdk native)
 *
 * Fuzzy search across all commands is provided by cmdk's built-in
 * filter (no extra work required). Selecting an item closes the
 * palette and either navigates via next/router or dispatches the
 * appropriate `mithqal:request-*` event (consumed by Topbar / StatusBar).
 * ────────────────────────────────────────────────────────────── */

type NavCommand = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  shortcut?: string;
};

type ActionCommand = {
  name: string;
  icon: LucideIcon;
  /** Dispatched as a CustomEvent with no payload — consumed by Topbar/StatusBar. */
  event: string;
  shortcut?: string;
  /** Optional badge text shown beside the label. */
  badge?: string;
};

const NAV_COMMANDS: NavCommand[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "G D" },
  { name: "Timeline", href: "/timeline", icon: Clock, shortcut: "G T" },
  { name: "Evidence", href: "/evidence", icon: ScrollText, shortcut: "G E" },
  { name: "Exceptions", href: "/exceptions", icon: AlertTriangle, shortcut: "G X" },
  { name: "Reconciliation", href: "/reconciliation", icon: Scale, shortcut: "G R" },
  { name: "Replay", href: "/replay", icon: History, shortcut: "G P" },
  { name: "Corridor", href: "/corridor", icon: Route, shortcut: "G C" },
  { name: "MTQ Σ Research", href: "/research", icon: FlaskConical, badge: "Σ", shortcut: "G M" },
  { name: "Settings", href: "/settings", icon: Settings, shortcut: "G S" },
];

const LEGAL_COMMANDS: NavCommand[] = [
  { name: "Privacy Policy", href: "/legal/privacy", icon: ShieldAlert, shortcut: "L P" },
  { name: "Terms of Service", href: "/legal/terms", icon: FileText, shortcut: "L T" },
  { name: "Cookie Policy", href: "/legal/cookies", icon: Cookie, shortcut: "L C" },
  { name: "Risk Disclosure", href: "/legal/risk-disclosure", icon: Gauge, shortcut: "L R" },
];

const ACTION_COMMANDS: ActionCommand[] = [
  {
    name: "Toggle Theme (dark ↔ light)",
    icon: Moon,
    event: "mithqal:request-toggle-theme",
    shortcut: "⌘ J",
  },
  {
    name: "Toggle Mode (DEMO ↔ LIVE)",
    icon: Zap,
    event: "mithqal:request-toggle-mode",
    shortcut: "⌘ L",
    badge: "MODE",
  },
  {
    name: "Refresh Status",
    icon: RefreshCw,
    event: "mithqal:request-refresh-status",
    shortcut: "⌘ R",
  },
];

function dispatchRequest(eventName: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(eventName));
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const runNav = React.useCallback(
    (href: string) => {
      close();
      // Defer the route push until after the palette closes to avoid
      // focus-trap conflicts inside Radix Dialog.
      setTimeout(() => router.push(href), 0);
    },
    [close, router],
  );

  const runAction = React.useCallback(
    (eventName: string) => {
      close();
      setTimeout(() => dispatchRequest(eventName), 0);
    },
    [close],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader className="sr-only">
        <DialogTitle>Command Palette</DialogTitle>
        <DialogDescription>
          Search navigation targets, legal pages, and quick actions.
        </DialogDescription>
      </DialogHeader>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden p-0",
          "max-w-xl",
          "border-gold/30 bg-ink/90 backdrop-blur-2xl",
          "supports-[backdrop-filter]:bg-ink/80",
        )}
      >
        <Command
          loop
          className={cn(
            "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5",
            "[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold",
            "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em]",
            "[&_[cmdk-group-heading]]:text-fg-muted",
            "[&_[cmdk-group]]:px-1.5 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0",
            "[&_[cmdk-input-wrapper]]:border-gold/20 [&_[cmdk-input-wrapper]]:bg-transparent",
            "[&_[cmdk-input-wrapper]_svg]:text-gold",
            "[&_[cmdk-input]]:text-foreground [&_[cmdk-input]]:placeholder:text-fg-muted",
            "[&_[cmdk-item]]:rounded-md [&_[cmdk-item]]:px-2.5 [&_[cmdk-item]]:py-2",
            "[&_[cmdk-item]_svg]:text-fg-muted",
            "[&_[cmdk-item][data-selected=true]]:bg-gold/10 [&_[cmdk-item][data-selected=true]_svg]:text-gold",
            "[&_[cmdk-item][data-selected=true]]:text-gold",
          )}
        >
          <CommandInput
            placeholder="Search commands, pages, or actions…"
            className="h-12 font-mono text-sm"
          />
          <CommandList className="max-h-[min(60vh,420px)]">
            <CommandEmpty className="py-8 text-center text-sm text-fg-muted">
              No matching command.
            </CommandEmpty>

            {/* ── Navigation ── */}
            <CommandGroup heading="Navigation">
              {NAV_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.href}
                    value={`${cmd.name} navigation`}
                    onSelect={() => runNav(cmd.href)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1">{cmd.name}</span>
                    {cmd.badge && (
                      <span className="rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-gold">
                        {cmd.badge}
                      </span>
                    )}
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* ── Legal ── */}
            <CommandGroup heading="Legal">
              {LEGAL_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.href}
                    value={`${cmd.name} legal`}
                    onSelect={() => runNav(cmd.href)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1">{cmd.name}</span>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator />

            {/* ── Actions ── */}
            <CommandGroup heading="Actions">
              {ACTION_COMMANDS.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.event}
                    value={`${cmd.name} action`}
                    onSelect={() => runAction(cmd.event)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span className="flex-1">{cmd.name}</span>
                    {cmd.badge && (
                      <span className="rounded border border-gold/30 bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-gold">
                        {cmd.badge}
                      </span>
                    )}
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
              {/* Theme shortcut hint via Sun icon (kept out of the map for clarity) */}
              <CommandItem
                value="light mode"
                onSelect={() => runAction("mithqal:request-toggle-theme")}
                className="sr-only"
                aria-hidden="true"
              >
                <Sun className="h-4 w-4" aria-hidden="true" />
                <span>Switch to light mode</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>

          {/* ── Footer hint row (outside the list) ── */}
          <div className="flex items-center justify-between border-t border-line/60 px-3 py-2 text-[10px] text-fg-muted">
            <span className="font-mono">⌘K to toggle · ↑↓ navigate · ↵ select · Esc close</span>
            <span className="font-mono">MITHQAL Assurance</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
