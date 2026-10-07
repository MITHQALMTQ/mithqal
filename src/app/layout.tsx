import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Client-only components (no SSR to avoid hydration issues)
const ScrollProgress = dynamic(() => import("@/components/ScrollProgress"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/ScrollToTop"), { ssr: false });

export const metadata: Metadata = {
  title: "MITHQAL — Your Digital Capital. Unified. Intelligent. Limitless.",
  description:
    "Mithqal is the next-generation platform for AI, finance, and digital ownership — built for creators, investors, and visionaries who see beyond.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased overflow-x-hidden"
        style={{ background: "#07090e" }}
      >
        <ScrollProgress />
        {children}
        <ScrollToTop />
      </body>
    </html>
  );
}
