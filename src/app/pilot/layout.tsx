import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutional Pilot — Controlled Pilot Engagement",
  description: "MITHQAL pilot model is designed for limited participants, narrow jurisdictions, and defined corridors — proof under live settlement conditions.",
  openGraph: {
    title: "Institutional Pilot — Controlled Pilot Engagement",
    description: "MITHQAL pilot model is designed for limited participants, narrow jurisdictions, and defined corridor",
    url: "https://mithqal.vercel.app/pilot",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/pilot",
  },
};

export default function PilotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
