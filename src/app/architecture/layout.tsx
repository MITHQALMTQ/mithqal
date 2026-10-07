import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architecture — The Architecture Behind Institutional Settlement | MITHQAL",
  description: "MITHQAL architecture is built on layered separation — participants, control plane, rails, and evidence — each layer auditable, reconcilable, and controlled.",
};

export default function ArchitectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
