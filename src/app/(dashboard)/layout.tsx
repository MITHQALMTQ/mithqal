import { type ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { StatusBar } from "@/components/layout/status-bar";
import { Topbar } from "@/components/layout/topbar";
import { QueryProvider } from "@/components/query-provider";

/**
 * Dashboard layout — MITHQAL-TECH-SPEC-001 §3.2.1.
 *
 * Server component. Wraps every page in the (dashboard) route group
 * with the sidebar + topbar + status-bar app shell. The QueryProvider
 * (client) is rendered here so all child pages can use TanStack Query
 * hooks without per-page wiring.
 *
 * Structure (top → bottom):
 *   [Topbar  — sticky]
 *   [Sidebar | Main content]   (flex row; sidebar hidden on mobile)
 *   [StatusBar — footer mt-auto]
 *
 * Pages render their own `PageHeader` (title + description) inside
 * `main`; this layout does NOT inject a per-page title.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main
            className="flex-1 overflow-y-auto"
            id="dashboard-main"
            aria-label="Dashboard content"
          >
            <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">{children}</div>
          </main>
        </div>
        <StatusBar />
      </div>
    </QueryProvider>
  );
}
