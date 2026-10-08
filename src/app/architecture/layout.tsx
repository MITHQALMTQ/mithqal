import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture — The Architecture Behind Institutional Settlement",
  description: "MITHQAL architecture is built on layered separation — participants, control plane, rails, and evidence — each layer auditable, reconcilable, and controlled.",
  openGraph: {
    title: "Architecture — The Architecture Behind Institutional Settlement",
    description: "MITHQAL architecture is built on layered separation — participants, control plane, rails, and eviden",
    url: "https://mithqal.vercel.app/architecture",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/architecture",
  },
};

export default function ArchitectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
