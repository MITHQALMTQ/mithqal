import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal & Disclosures — Jurisdictional Discipline by Design | MITHQAL",
  description: "MITHQAL operates within applicable legal frameworks — one architecture, different regulatory perimeters.",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
