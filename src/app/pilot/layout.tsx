import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Institutional Pilot — Controlled Pilot Engagement | MITHQAL",
  description: "MITHQAL pilot model is designed for limited participants, narrow jurisdictions, and defined corridors — proof under live settlement conditions.",
};

export default function PilotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
