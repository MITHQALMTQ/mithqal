"use client";
import { LayoutDashboard, Clock, FileCheck, AlertTriangle, GitCompare, RotateCcw, Map, Settings, FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Evidence", href: "/evidence", icon: FileCheck },
  { name: "Exceptions", href: "/exceptions", icon: AlertTriangle, badge: "3" },
  { name: "Reconciliation", href: "/reconciliation", icon: GitCompare },
  { name: "Replay", href: "/replay", icon: RotateCcw },
  { name: "Corridor", href: "/corridor", icon: Map },
  { name: "MTQ Σ Research", href: "/mtq-sigma", icon: FlaskConical },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const p = usePathname();
  return (<nav className="w-60 shrink-0 border-r border-slate-800 bg-slate-900/50 p-3 hidden md:block" aria-label="Sidebar"><ul className="space-y-1">{nav.map(i => { const Icon = i.icon; const a = p === i.href; return (<li key={i.name}><Link href={i.href} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${a ? "bg-amber-500/10 text-amber-300" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Icon className="h-4 w-4" /><span>{i.name}</span>{i.badge && <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">{i.badge}</span>}</Link></li>); })}</ul></nav>);
}
