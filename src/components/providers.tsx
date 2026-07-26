"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { LanguageProvider } from "@/components/language-provider";

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
