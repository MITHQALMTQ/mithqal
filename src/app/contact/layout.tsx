import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Institutional Enquiry | MITHQAL",
  description: "For institutional enquiries, pilot engagement, or technical architecture review — connect with the MITHQAL team.",
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
