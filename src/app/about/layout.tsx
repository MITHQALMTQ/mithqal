import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — A Neutral Infrastructure for a Connected Financial Future",
  description: "MITHQAL is a neutral wholesale settlement control plane — built to coordinate institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence.",
  openGraph: {
    title: "About — A Neutral Infrastructure for a Connected Financial Future",
    description: "MITHQAL is a neutral wholesale settlement control plane — built to coordinate institutional particip",
    url: "https://mithqal.vercel.app/about",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/about",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
