import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidence & Assurance — Every State Leaves Evidence",
  description: "MITHQAL treats evidence as a control layer — every settlement state is attributable, verifiable, and auditable.",
  openGraph: {
    title: "Evidence & Assurance — Every State Leaves Evidence",
    description: "MITHQAL treats evidence as a control layer — every settlement state is attributable, verifiable, and",
    url: "https://mithqal.vercel.app/evidence",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/evidence",
  },
};

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
