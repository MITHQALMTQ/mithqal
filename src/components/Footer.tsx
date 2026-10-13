"use client";

/**
 * Footer — Shared institutional footer with full 10-page sitemap.
 */

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="#D4AF37" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="#D4AF37" strokeWidth="2.5" />
  </svg>
);

const SITEMAP = {
  Platform: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: "Ecosystem", href: "/ecosystem" },
    { label: "Roadmap", href: "/roadmap" },
    { label: "About", href: "/about" },
  ],
  Architecture: [
    { label: "Architecture", href: "/architecture" },
    { label: "Evidence & Assurance", href: "/evidence" },
    { label: "Platform Layers", href: "/architecture#layers" },
    { label: "Three-Book Separation", href: "/architecture#books" },
    { label: "Finality Control", href: "/architecture#finality" },
  ],
  Institutional: [
    { label: "Institutional / Pilot", href: "/pilot" },
    { label: "Engagement Pathway", href: "/pilot#pathway" },
    { label: "Pilot Eligibility", href: "/pilot#eligibility" },
    { label: "Contact / Enquiry", href: "/contact" },
    { label: "Response Timeline", href: "/contact#timeline" },
  ],
  Legal: [
    { label: "Legal / Disclosures", href: "/legal" },
    { label: "Terms of Use", href: "/legal#terms" },
    { label: "Privacy Policy", href: "/legal#privacy" },
    { label: "Production Status", href: "/legal#status" },
    { label: "MTQ Status", href: "/legal#mtq" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative z-20 bg-[#07090e] border-t border-amber-500/10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-12 pb-12 border-b border-white/5">
          <div className="flex flex-col gap-4 max-w-md">
            <a href="/" className="flex items-center gap-3" aria-label="MITHQAL home">
              <MithqalLogo />
              <span className="text-xl font-semibold tracking-[0.18em] text-[#D4AF37]" style={{ fontFamily: "Inter, sans-serif" }}>MITHQAL</span>
            </a>
            <p className="text-sm text-[#94a3b8] leading-relaxed">
              Neutral wholesale settlement infrastructure. Built for institutional participants, controlled settlement workflows, and audit-ready evidence.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-xs px-3 py-1 rounded-full border border-red-500/30 text-red-400/80 bg-red-500/5">NOT PRODUCTION-AUTHORIZED</span>
              <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">BUILD_MODE = FROZEN</span>
              <span className="text-xs px-3 py-1 rounded-full border border-amber-500/30 text-amber-400/80 bg-amber-500/5">MTQ DISABLED</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-400/80 mb-2">Connect</div>
            <a href="/contact" className="text-sm text-white/85 hover:text-amber-400 transition-colors duration-300 flex items-center gap-2"><span>📧</span> Institutional Enquiry</a>
            <a href="/pilot" className="text-sm text-white/85 hover:text-amber-400 transition-colors duration-300 flex items-center gap-2"><span>🚀</span> Pilot Engagement</a>
            <a href="/architecture" className="text-sm text-white/85 hover:text-amber-400 transition-colors duration-300 flex items-center gap-2"><span>🏗</span> Technical Review</a>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(SITEMAP).map(([category, links]) => (
            <div key={category}>
              <div className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-400/80 mb-4 pb-3 border-b border-white/5">{category}</div>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-[#cbd5e1] hover:text-white transition-colors duration-200">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#94a3b8]">© {new Date().getFullYear()} MITHQAL. Neutral Institutional Settlement Control Plane. All rights reserved.</p>
          <p className="text-xs text-amber-400/70">INSTITUTIONALLY_VALIDATED = false · PRODUCTION_AUTHORIZED = false</p>
        </div>
      </div>
    </footer>
  );
}
