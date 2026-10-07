import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evidence & Assurance — Every State Leaves Evidence | MITHQAL",
  description: "MITHQAL treats evidence as a control layer — every settlement state is attributable, verifiable, and auditable.",
};

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
