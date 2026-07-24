import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
  metadataBase: new URL("https://mithqal.io"),
  title: {
    default: "Mithqal — Constitutional Settlement Institution",
    template: "%s · Mithqal",
  },
  description:
    "Mithqal — a constitutional, fully-reserved, neutral settlement institution for international trade. Built on the v18 FINAL specification. 100%+ reserves, verifiable operations, permanently non-platform.",
  keywords: [
    "Mithqal",
    "MTQ",
    "settlement institution",
    "reserve-backed",
    "stablecoin",
    "cross-border trade",
    "constitutional monetary institution",
    "fully reserved",
  ],
  authors: [{ name: "Mithqal" }],
  creator: "Mithqal",
  applicationName: "Mithqal",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mithqal.io",
    siteName: "Mithqal",
    title: "Mithqal — Constitutional Settlement Institution",
    description:
      "A constitutional, fully-reserved, neutral settlement institution for international trade. 100%+ reserves, verifiable operations, permanently non-platform.",
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
      "A constitutional, fully-reserved, neutral settlement institution. 100%+ reserves, verifiable operations, permanently non-platform.",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
