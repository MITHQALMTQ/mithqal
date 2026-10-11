"use client";

import { ChevronRight, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileSidebarTrigger, NAV_ITEMS } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Top bar — MITHQAL-TECH-SPEC-001 §3.2.1.
 *
 * Left:  logo + breadcrumb / page title + mobile hamburger.
 * Right: truth-state badge + user menu (avatar dropdown).
 *
 * Pilot users are operators — the only role currently defined
 * (see src/lib/auth.ts). The dropdown exposes disabled items
 * (Profile, API keys, Sign out) to communicate pilot scope honestly.
 */
function currentNavTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  const match = NAV_ITEMS.find(
    (item) =>
      pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  return match?.name ?? "Dashboard";
}

export function Topbar() {
  const pathname = usePathname();
  const title = currentNavTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <MobileSidebarTrigger />

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          MITHQAL
        </Link>
        <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium text-foreground">{title}</span>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden sm:inline-flex">
          <ShieldCheck className="size-3" aria-hidden="true" />
          <span className="ml-1">MTQ disabled</span>
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Open user menu"
            >
              <Avatar>
                <AvatarFallback>OP</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Operator</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile (pilot)</DropdownMenuItem>
            <DropdownMenuItem disabled>API keys (pilot)</DropdownMenuItem>
            <DropdownMenuItem disabled>Sign out (pilot)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="size-4" aria-hidden="true" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
