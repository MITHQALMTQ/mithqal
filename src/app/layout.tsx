import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "MITHQAL Assurance — Financial-Operations Assurance Platform",
    template: "%s | MITHQAL Assurance",
  },
  description:
    "MITHQAL Assurance helps institutions validate payment data, resolve operational exceptions, and produce reproducible evidence across authorized systems. MTQ Σ is research-only. Production authorization: FALSE.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body className="antialiased overflow-x-hidden" style={{ background: "#07090e" }}>
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
