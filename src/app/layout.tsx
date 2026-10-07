import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

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
        {children}
      </body>
    </html>
  );
}
