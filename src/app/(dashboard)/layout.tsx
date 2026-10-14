import { type ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { StatusBar } from "@/components/layout/status-bar";
import { QueryProvider } from "@/components/query-provider";
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (<QueryProvider><div className="flex min-h-screen flex-col bg-[#07090e]"><Topbar /><div className="flex flex-1"><Sidebar /><main className="flex-1 overflow-y-auto p-6">{children}</main></div><StatusBar /></div></QueryProvider>);
}
