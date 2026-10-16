"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Topbar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";

/* ──────────────────────────────────────────────────────────────
 * (dashboard) layout — Glassmorphic Command Center AppShell.
 *
 * Composition (top → bottom):
 *   • Topbar    (sticky top, z-40) — logo + DEMO badge + Home link
 *   • Row       (flex-1)           — Sidebar | main
 *     • Sidebar (sticky left, hidden < md) — flat 10 nav items
 *     • main    (flex-1)           — page content, p-6
 *   • StatusBar (sticky bottom, z-30) — single static status line
 *
 * The QueryClient is created once per browser session via a module-
 * level singleton (SSR-safe: a fresh client is returned on the
 * server). The child dashboard tabs use `useQuery` from
 * @tanstack/react-query so this provider must wrap them.
 *
 * Background: deep navy → black vertical gradient (different from
 * the old flat #07090e and from the old mesh-gradient utility).
 * ────────────────────────────────────────────────────────────── */

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Dashboard queries poll every 30s themselves (see use-demo-data.ts);
        // the global staleTime just keeps background refetches cheap.
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-[#0a0e1a] to-[#07090e] text-white">
        <Topbar />

        <div className="flex flex-1">
          <Sidebar />
          <main
            id="dashboard-main"
            className="relative flex-1 overflow-y-auto p-6"
            aria-label="Dashboard content"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>

        <StatusBar />
      </div>
    </QueryProvider>
  );
}
