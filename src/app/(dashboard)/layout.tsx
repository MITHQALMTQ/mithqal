"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────
 * (dashboard) layout — the MITHQAL Assurance AppShell.
 *
 * Composition (top → bottom):
 *   • Topbar     (sticky top, z-40)        — brand + ⌘K + theme + mode
 *   • Row        (flex-1)                  — Sidebar | main
 *     • Sidebar  (sticky left, hidden < md) — 3 sections × 9 tabs
 *     • main     (flex-1)                  — page content + transitions
 *   • StatusBar  (sticky bottom, z-30)     — 4 live health pills
 *
 * The CommandPalette is mounted by the Topbar (lifted state lives there
 * so the ⌘K listener and the search-trigger button share one source
 * of truth). This layout only renders the page-transition wrapper.
 *
 * The `mesh-gradient` class on the outer div applies the subtle
 * animated background that another agent ships via globals.css.
 * ────────────────────────────────────────────────────────────── */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sensible defaults for a dashboard: short cache, no refetch-on-focus
        // (the StatusBar already polls every 30s), and stale-while-revalidate.
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function QueryProvider({ children }: { children: React.ReactNode }) {
  const client = getQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

const pageTransition = {
  duration: 0.25,
  ease: "easeOut" as const,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <QueryProvider>
      <div
        className={cn(
          "mesh-gradient relative flex min-h-screen flex-col",
          "bg-ink text-foreground",
        )}
      >
        <Topbar />

        <div className="flex flex-1">
          <Sidebar />
          <main
            id="dashboard-main"
            className="relative flex-1 overflow-x-hidden"
            aria-label="Dashboard content"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={pathname}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={pageVariants}
                transition={pageTransition}
                className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <StatusBar />
      </div>
    </QueryProvider>
  );
}
