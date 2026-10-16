import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: ["400", "500", "600", "700"], style: ["normal"] });

export const metadata: Metadata = {
  title: "MITHQAL Assurance — Financial-Operations Assurance Platform",
  description: "Neutral wholesale settlement infrastructure. §V25.3 Final Reserve Mathematical Specification — 130% backing, 80/18/2 allocation, 11-currency basket, 7/7 finality enforcement.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
<!-- P88: trigger rebuild to pick up Vercel env vars -->
