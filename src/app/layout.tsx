import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { CommandPalette } from "@/components/command-palette";
import { SiteFooter } from "@/components/site-footer";
import { AiExplainer } from "@/components/ai-explainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mithqal.vercel.app"),
  title: {
    default: "Mithqal — Constitutional Settlement Institution v23",
    template: "%s · Mithqal",
  },
  description:
    "Mithqal — a gold-anchored, globally diversified, reserve-backed constitutional monetary institution. Built on the v23 specification. Four-layer architecture, 11-currency basket, digital liquidity sleeve. 100%+ reserves, constitutionally non-platform.",
  keywords: [
    "Mithqal",
    "MTQ",
    "settlement institution",
    "reserve-backed",
    "stablecoin",
    "cross-border trade",
    "constitutional settlement institution",
    "fully reserved",
  ],
  authors: [{ name: "Mithqal" }],
  creator: "Mithqal",
  applicationName: "Mithqal",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mithqal.vercel.app",
    siteName: "Mithqal",
    title: "Mithqal — Constitutional Settlement Institution",
    description:
      "A constitutional, fully-reserved, neutral settlement institution for international trade. 100%+ reserves, verifiable operations, constitutionally non-platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1344,
        height: 768,
        alt: "Mithqal — a constitutional settlement institution",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mithqal — Constitutional Settlement Institution",
    description:
      "A constitutional, fully-reserved, neutral settlement institution. 100%+ reserves, verifiable operations, constitutionally non-platform.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  category: "finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash: read stored theme before React hydrates */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('mithqal-theme');
              if (t === 'light' || t === 'cyber') {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add(t);
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-ink">
          Skip to main content
        </a>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <CommandPalette />
            <div className="flex-1">
              {children}
            </div>
            <SiteFooter />
          </div>
          <AiExplainer />
          <Toaster />
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  );
}
