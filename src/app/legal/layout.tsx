import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Disclosures — Jurisdictional Discipline by Design",
  description: "MITHQAL operates within applicable legal frameworks — one architecture, different regulatory perimeters.",
  openGraph: {
    title: "Legal & Disclosures — Jurisdictional Discipline by Design",
    description: "MITHQAL operates within applicable legal frameworks — one architecture, different regulatory perimet",
    url: "https://mithqal.vercel.app/legal",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/legal",
  },
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
