"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/language-provider";

/**
 * Providers — wraps the app with:
 *   - SessionProvider (NextAuth for operator login)
 *   - ThemeProvider (next-themes for dark/light base)
 *   - LanguageProvider (i18n: en, ar, fr, de, es, zh)
 *
 * The ThemeProvider uses `attribute="class"` with `defaultTheme="dark"`.
 * The ThemeToggle component in theme-toggle.tsx handles the 3-state cycle
 * (dark → light → cyber) by directly manipulating <html>'s class list
 * and storing the preference in localStorage. This works alongside
 * next-themes without conflict.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
