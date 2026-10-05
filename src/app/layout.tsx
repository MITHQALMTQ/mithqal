import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import { GlobalThemeToggle } from "@/components/global-theme-toggle";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal"] });

export const metadata: Metadata = {
  title: "MITHQAL — Neutral Wholesale Settlement Infrastructure",
  description: "MITHQAL coordinates institutional settlement workflows, policy, finality, reconciliation, multi-rail interoperability and audit-ready evidence through one controlled architecture.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <div className="flex min-h-screen flex-col">{children}</div>
          <GlobalThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
