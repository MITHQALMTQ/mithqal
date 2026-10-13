import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ecosystem — Institutional Participants Connected Through MITHQAL",
  description: "MITHQAL connects participating institutions, banking infrastructure, payment networks and approved settlement rails through one coordinated institutional control plane.",
  openGraph: {
    title: "Ecosystem — Institutional Participants Connected Through MITHQAL",
    description: "MITHQAL connects participating institutions, banking infrastructure, payment networks and approved s",
    url: "https://mithqal.vercel.app/ecosystem",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/ecosystem",
  },
};

export default function EcosystemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
