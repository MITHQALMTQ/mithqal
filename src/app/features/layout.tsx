import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features — The Control Plane Behind Institutional Settlement | MITHQAL",
  description: "MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.",
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
