import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MITHQAL Assurance — Financial-Operations Assurance Platform",
  description: "Validate payment data. Resolve exceptions with AI. Produce reproducible evidence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07090e] text-white antialiased">
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
