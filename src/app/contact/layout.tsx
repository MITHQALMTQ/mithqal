import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Institutional Enquiry",
  description: "For institutional enquiries, pilot engagement, or technical architecture review — connect with the MITHQAL team.",
  openGraph: {
    title: "Contact — Institutional Enquiry",
    description: "For institutional enquiries, pilot engagement, or technical architecture review — connect with the M",
    url: "https://mithqal.vercel.app/contact",
    siteName: "MITHQAL",
  },
  alternates: {
    canonical: "https://mithqal.vercel.app/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
