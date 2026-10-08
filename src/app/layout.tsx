import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "@/components/ClientProviders";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://mithqal.vercel.app"),
  title: {
    default: "MITHQAL — Neutral Wholesale Settlement Infrastructure",
    template: "%s | MITHQAL",
  },
  description:
    "MITHQAL is a neutral wholesale settlement control plane — coordinating institutional participants, settlement workflows, policy, finality, reconciliation, multi-rail interoperability, and audit-ready evidence through one controlled architecture.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mithqal.vercel.app",
    siteName: "MITHQAL",
    title: "MITHQAL — Neutral Wholesale Settlement Infrastructure",
    description:
      "Neutral wholesale settlement control plane. Coordinating institutional participants, settlement workflows, policy, finality, reconciliation, and audit-ready evidence.",
    images: [
      {
        url: "/assets/mithqal-home-landscape.png",
        width: 1344,
        height: 768,
        alt: "MITHQAL — Cinematic institutional settlement architecture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MITHQAL — Neutral Wholesale Settlement Infrastructure",
    description:
      "Neutral wholesale settlement control plane. Coordinating institutional participants, settlement workflows, and audit-ready evidence.",
    images: ["/assets/mithqal-home-landscape.png"],
  },
  alternates: {
    canonical: "https://mithqal.vercel.app",
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <ClientProviders />
        {children}
      </body>
    </html>
  );
}
