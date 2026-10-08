import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roadmap — A Structured Path to Institutional Evolution",
  description: "MITHQAL outlines a phased approach to building neutral wholesale settlement infrastructure — from foundation through controlled expansion.",
  openGraph: {
    title: "Roadmap — A Structured Path to Institutional Evolution",
    description: "MITHQAL outlines a phased approach to building neutral wholesale settlement infrastructure — from fo",
    url: "https://mithqal.vercel.app/roadmap",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/roadmap",
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
