"use client";

/**
 * Global Command Palette (Cmd+K / Ctrl+K)
 *
 * Mounted once at the page root so it is available on every view.
 * Triggered by:
 *   - Cmd+K (macOS) / Ctrl+K (other)
 *   - The "/" key (when not typing in an input)
 *   - A small floating "Search" pill (bottom-right) for discoverability
 *
 * Built on the existing shadcn Command component (cmdk) — search + arrow-key
 * navigation + Enter selection come for free. The overlay itself is rendered
 * with framer-motion's AnimatePresence so the open/close animation is smooth
 * and reversible (the dialog can be closed mid-open without snapping).
 *
 * Item groups:
 *   - Views        — the 11 top-level views of the working surface
 *   - Quick actions — Mint MTQ, Redeem MTQ, Test SMTP, View on MonadScan
 *   - Contracts    — MTQ Token, Governance, Safe Multi-Sig (open in MonadScan)
 *   - Documentation — Constitution v19.0.3, Audit Report, Backup & Recovery
 */

import { Fragment, type ComponentType, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Landmark,
  Eye,
  Compass,
  Network,
  ScrollText,
  FlaskConical,
  Cpu,
  ShieldCheck,
  Presentation,
  BookOpen,
  LayoutDashboard,
  HelpCircle,
  Coins,
  ArrowLeftRight,
  Mail,
  ExternalLink,
  FileText,
  ShieldAlert,
  DatabaseBackup,
  CornerDownLeft,
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

/* ---------- view navigation (mirrors src/app/page.tsx writeView) ---------- */

const STORAGE_KEY = "mithqal.view";
const CHANGE_EVENT = "mithqal:view-change";

type ViewId =
  | "institution"
  | "transparency"
  | "engine"
  | "infrastructure"
  | "constitution"
  | "testnet"
  | "os"
  | "audit"
  | "deck"
  | "playbook"
  | "admin"
  | "faq";

function navigateToView(view: ViewId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- real contract addresses (sourced from /api/onchain-test) ----- */

const MONADSCAN_BASE = "https://testnet.monadscan.com";

const CONTRACTS: Array<{
  label: string;
  address: `0x${string}`;
  description: string;
}> = [
  {
    label: "MTQ Token",
    address: "0x9e6EdC15DAc420931508d8Ddf9BC817651A253aD",
    description: "ERC-20 token · minted on deposit, burned on redeem",
  },
  {
    label: "Governance",
    address: "0xE35a91801bc541fb743BB9EaD26C1FbD81EaBd66",
    description: "Council + Independent Review Panel contract",
  },
  {
    label: "Safe Multi-Sig",
    address: "0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0",
    description: "Treasury custody — multi-signature wallet",
  },
];

/* ---------- item catalogue ---------- */

type ActionType = "view" | "action" | "contract" | "doc";

interface PaletteItem {
  id: string;
  type: ActionType;
  label: string;
  hint?: string;
  // optional shadcn-style ⌘+key shortcut displayed at the right
  shortcut?: string;
  // icon (lucide-react component)
  icon: ComponentType<{ className?: string }>;
  // keywords used by cmdk's filter (separate from label)
  keywords?: string;
  // perform the action; return true to close the palette
  run: () => boolean | void;
}

const VIEWS: PaletteItem[] = [
  { id: "v-institution", type: "view", label: "Institution", hint: "Public-facing site", icon: Landmark, run: () => navigateToView("institution") },
  { id: "v-transparency", type: "view", label: "Transparency", hint: "Live · build in public", icon: Eye, run: () => navigateToView("transparency") },
  { id: "v-engine", type: "view", label: "Engine", hint: "5-layer explainer", icon: Compass, run: () => navigateToView("engine") },
  { id: "v-infrastructure", type: "view", label: "Infrastructure", hint: "v19.0.3 infrastructure", icon: Network, run: () => navigateToView("infrastructure") },
  { id: "v-constitution", type: "view", label: "Constitution", hint: "v19.0.3 spec · citable", icon: ScrollText, run: () => navigateToView("constitution") },
  { id: "v-testnet", type: "view", label: "Testnet", hint: "MTQ simulator", icon: FlaskConical, run: () => navigateToView("testnet") },
  { id: "v-os", type: "view", label: "OS", hint: "Operating System", icon: Cpu, run: () => navigateToView("os") },
  { id: "v-audit", type: "view", label: "Audit", hint: "Testnet validation v1.0", icon: ShieldCheck, run: () => navigateToView("audit") },
  { id: "v-deck", type: "view", label: "Deck", hint: "Investor teaser", icon: Presentation, run: () => navigateToView("deck") },
  { id: "v-faq", type: "view", label: "FAQ", hint: "Frequently asked questions", icon: HelpCircle, keywords: "faq help questions answers reserves governance sharia fees wallet connect brain", run: () => navigateToView("faq") },
  { id: "v-playbook", type: "view", label: "Playbook", hint: "Internal · COO/PM", icon: BookOpen, run: () => navigateToView("playbook") },
  { id: "v-admin", type: "view", label: "Admin", hint: "Intake pipeline", icon: LayoutDashboard, run: () => navigateToView("admin") },
];

const ACTIONS: PaletteItem[] = [
  {
    id: "a-mint",
    type: "action",
    label: "Mint MTQ",
    hint: "Open the mint form on the testnet view",
    icon: Coins,
    keywords: "mint buy issue create deposit",
    shortcut: "",
    run: () => navigateToView("testnet"),
  },
  {
    id: "a-redeem",
    type: "action",
    label: "Redeem MTQ",
    hint: "Open the redeem form on the testnet view",
    icon: ArrowLeftRight,
    keywords: "redeem burn sell withdraw",
    shortcut: "",
    run: () => navigateToView("testnet"),
  },
  {
    id: "a-smtp",
    type: "action",
    label: "Test SMTP",
    hint: "Run the email-notification smoke test (admin)",
    icon: Mail,
    keywords: "smtp email notify test send",
    shortcut: "",
    run: () => navigateToView("admin"),
  },
  {
    id: "a-scan",
    type: "action",
    label: "View on MonadScan",
    hint: "Open the Monad Testnet explorer",
    icon: ExternalLink,
    keywords: "explorer monadscan blockchain verify",
    shortcut: "",
    run: () => {
      if (typeof window !== "undefined") {
        window.open(MONADSCAN_BASE, "_blank", "noopener,noreferrer");
      }
    },
  },
];

const CONTRACT_ITEMS: PaletteItem[] = CONTRACTS.map((c) => ({
  id: `c-${c.label.toLowerCase().replace(/\s+/g, "-")}`,
  type: "contract",
  label: c.label,
  hint: `${c.address.slice(0, 10)}…${c.address.slice(-6)} · ${c.description}`,
  icon: FileText,
  keywords: `contract ${c.label} ${c.address} monadscan`,
  run: () => {
    if (typeof window !== "undefined") {
      window.open(
        `${MONADSCAN_BASE}/address/${c.address}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  },
}));

const DOCS: PaletteItem[] = [
  {
    id: "d-constitution",
    type: "doc",
    label: "Constitution v19.0.3",
    hint: "The full citable specification",
    icon: ScrollText,
    keywords: "constitution docs spec v19 citable",
    run: () => navigateToView("constitution"),
  },
  {
    id: "d-audit",
    type: "doc",
    label: "Audit Report",
    hint: "Constitutional Protocol Audit · Testnet v1.0",
    icon: ShieldAlert,
    keywords: "audit report security findings",
    run: () => navigateToView("audit"),
  },
  {
    id: "d-backup",
    type: "doc",
    label: "Backup & Recovery",
    hint: "Open the recovery runbook on GitHub",
    icon: DatabaseBackup,
    keywords: "backup recovery disaster dr runbook",
    run: () => {
      if (typeof window !== "undefined") {
        window.open(
          "https://github.com/MITHQALMTQ/mithqal/blob/main/BACKUP-AND-RECOVERY.md",
          "_blank",
          "noopener,noreferrer",
        );
      }
    },
  },
];

/* ---------- group config ---------- */

interface GroupConfig {
  heading: string;
  items: PaletteItem[];
}

const GROUPS: GroupConfig[] = [
  { heading: "Views", items: VIEWS },
  { heading: "Quick Actions", items: ACTIONS },
  { heading: "Contracts", items: CONTRACT_ITEMS },
  { heading: "Documentation", items: DOCS },
];

/* ---------- the component ---------- */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);

  /* Keyboard trigger: Cmd+K / Ctrl+K (toggle) + "/" (open, when not typing). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable === true;

      // Cmd/Ctrl + K — toggle
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      // "/" — open (only when not typing)
      if (!isTyping && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }

      // Escape — close (handled by the overlay too, but catch here for safety)
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  /* Re-focus the search input shortly after open so keyboard nav keeps working
     after a selection bounces back to the palette. */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [open]);

  /* Run the item's action and close the palette unless the action opts to
     stay open (returns false explicitly). */
  const runItem = useCallback(
    (item: PaletteItem) => {
      const shouldClose = item.run();
      if (shouldClose !== false) close();
    },
    [close],
  );

  /* Filter logic: use the cmdk default filter. We give each item a value
     prop = label + hint + keywords so the filter sees all of it. */
  const renderItemValue = useCallback(
    (item: PaletteItem) =>
      `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""}`.toLowerCase(),
    [],
  );

  const hasItems = useMemo(
    () => GROUPS.some((g) => g.items.length > 0),
    [],
  );

  return (
    <>
      {/* Floating "Search" pill — discoverability on touch / no-keyboard devices */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open command palette (Cmd+K)"
        title="Open command palette · Cmd+K / Ctrl+K"
        className="no-print group fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-line/70 bg-ink-card/80 px-3.5 py-2 text-xs font-medium text-fg-muted shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-colors hover:border-gold/50 hover:text-gold sm:bottom-7 sm:right-7"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="ml-1 hidden rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[10px] text-fg-muted sm:inline">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="cmd-palette-overlay"
            className="no-print fixed inset-0 z-[100] flex items-start justify-center p-4 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={close}
          >
            {/* backdrop */}
            <div
              className="absolute inset-0 bg-ink/70 backdrop-blur-md"
              aria-hidden
            />

            <motion.div
              key="cmd-palette-panel"
              ref={inputRef}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line/70 bg-popover text-popover-foreground shadow-[0_24px_80px_-20px_rgba(0,0,0,0.75)]"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <Command
                className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4"
                loop
              >
                <CommandInput
                  placeholder="Type a command or search…"
                  className="h-12 text-sm"
                  autoFocus
                />
                <CommandList className="max-h-[60vh] overflow-y-auto p-1">
                  {hasItems ? (
                    GROUPS.map((group, gi) => (
                      <Fragment key={group.heading}>
                        <CommandGroup heading={group.heading}>
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <CommandItem
                                key={item.id}
                                value={renderItemValue(item)}
                                onSelect={() => runItem(item)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm"
                              >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-ink-card text-gold">
                                  <Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className="flex min-w-0 flex-1 flex-col">
                                  <span className="truncate font-medium text-foreground">
                                    {item.label}
                                  </span>
                                  {item.hint ? (
                                    <span className="truncate text-[11px] text-fg-muted">
                                      {item.hint}
                                    </span>
                                  ) : null}
                                </span>
                                {item.shortcut ? (
                                  <CommandShortcut>
                                    {item.shortcut}
                                  </CommandShortcut>
                                ) : null}
                                {item.type === "contract" ||
                                item.type === "action" ? (
                                  <ExternalLink
                                    className="h-3 w-3 shrink-0 text-fg-muted/60"
                                    aria-hidden
                                  />
                                ) : null}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                        {gi < GROUPS.length - 1 ? (
                          <CommandSeparator className="my-1 bg-line/60" />
                        ) : null}
                      </Fragment>
                    ))
                  ) : (
                    <CommandEmpty>No results found.</CommandEmpty>
                  )}
                </CommandList>

                {/* Footer hint */}
                <div className="flex items-center justify-between gap-2 border-t border-line/60 px-3 py-2 text-[10px] text-fg-muted">
                  <span className="flex items-center gap-1.5">
                    <CornerDownLeft className="h-3 w-3" />
                    select
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[9px]">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="rounded border border-line bg-ink px-1.5 py-0.5 font-mono text-[9px]">
                      Esc
                    </kbd>
                    close
                  </span>
                </div>
              </Command>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
