import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — The Control Plane Behind Institutional Settlement",
  description: "MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.",
  openGraph: {
    title: "Features — The Control Plane Behind Institutional Settlement",
    description: "MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail intero",
    url: "https://mithqal.vercel.app/features",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/features",
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
