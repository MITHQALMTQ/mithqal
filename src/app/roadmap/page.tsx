/**
 * MITHQAL — Roadmap Page (/roadmap)
 * Page 04 — controlled evolution.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Network | ROADMAP = Controlled Evolution
 *
 * Rewrite (Task 22-ROADMAP-REWRITE): aligned to reference design (image 5).
 * Split hero + horizontal 5-step timeline + platform architecture (3-col) + CTA banner.
 * Removed 9 legacy sections (stages grid, pilot flow, gates grid, status panel,
 * critical path, BTV, foundation grid, validation flow, future grid, MTQ box).
 */

import "./roadmap.css";
import type { ReactNode } from "react";

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

type TimelineStep = { num: string; title: string; desc: string; icon: ReactNode };

const TIMELINE_STEPS: TimelineStep[] = [
  {
    num: "01",
    title: "Foundation",
    desc: "Core architecture, security, control framework and evidence model — the base layer beneath every subsequent stage.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "Pilots",
    desc: "Limited participants, narrow jurisdictions and defined corridors — proof under live settlement conditions.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Expansion",
    desc: "Additional rails, broader interoperability and routing — only after pilot evidence supports the next layer.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M7 17l3-4M17 17l-3-4" />
      </svg>
    ),
  },
  {
    num: "04",
    title: "Scale",
    desc: "Operational maturity across multiple institutions and jurisdictions — secured by adversarial and assurance gates.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
      </svg>
    ),
  },
  {
    num: "05",
    title: "Global Readiness",
    desc: "Neutral wholesale settlement infrastructure available to authorized institutions across jurisdictions.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
      </svg>
    ),
  },
];

const PILLARS = ["Security", "Compliance", "Interoperability", "Auditability", "Neutrality"];

const ARCH_LEFT_GROUPS: { label: string; items: string[] }[] = [
  { label: "Participants", items: ["Regulated institutions", "Bank sponsors", "Auditors"] },
  { label: "Rails", items: ["Multi-rail routing", "Fallback corridors", "Settlement gateways"] },
  { label: "Settlement", items: ["Three-book separation", "Finality controls", "Reconciliation"] },
];

const IsometricArch = () => (
  <svg viewBox="0 0 320 280" width="100%" height="auto" aria-hidden="true" role="presentation">
    {/* Layer 3 (top) */}
    <polygon points="160,28 70,72 160,116 250,72" fill="color-mix(in srgb, var(--gold) 8%, transparent)" stroke="var(--gold)" strokeWidth="1" />
    <polygon points="160,28 70,72 70,92 160,136 250,92 250,72" fill="color-mix(in srgb, var(--gold) 4%, transparent)" stroke="color-mix(in srgb, var(--gold) 60%, transparent)" strokeWidth="1" />
    {/* Layer 2 (mid) */}
    <polygon points="160,96 56,148 160,200 264,148" fill="color-mix(in srgb, var(--gold) 6%, transparent)" stroke="var(--gold)" strokeWidth="1" />
    <polygon points="160,96 56,148 56,172 160,224 264,172 264,148" fill="color-mix(in srgb, var(--gold) 3%, transparent)" stroke="color-mix(in srgb, var(--gold) 50%, transparent)" strokeWidth="1" />
    {/* Layer 1 (bottom) */}
    <polygon points="160,168 44,226 160,284 276,226" fill="color-mix(in srgb, var(--gold) 5%, transparent)" stroke="var(--gold)" strokeWidth="1" />
    <polygon points="160,168 44,226 44,252 160,310 276,252 276,226" fill="color-mix(in srgb, var(--gold) 2%, transparent)" stroke="color-mix(in srgb, var(--gold) 40%, transparent)" strokeWidth="1" />
    {/* Central axis hint */}
    <line x1="160" y1="28" x2="160" y2="168" stroke="color-mix(in srgb, var(--gold) 35%, transparent)" strokeWidth="1" strokeDasharray="2 4" />
  </svg>
);

export default function RoadmapPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home">
            <MithqalLogo />
            <span className="brand-wordmark">MITHQAL</span>
          </a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "Roadmap" ? "active" : ""}`} href={NAV_HREFS[i]}>
                {item}
              </a>
            ))}
          </nav>
          <a className="launch-btn" href="/#platform">
            <span>Launch App</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>

      <main>
        {/* HERO — split layout: text left / timeline image right */}
        <section className="section" style={{ paddingTop: "120px", paddingBottom: "60px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span>THE MITHQAL ROADMAP</span>
              </div>
              <h1 className="hero-title">
                A Structured Path to <span className="gold-text">Institutional Evolution.</span>
              </h1>
              <p className="body-text">
                MITHQAL&apos;s roadmap outlines a phased approach to building neutral wholesale settlement infrastructure — from foundation through controlled expansion.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#roadmap-steps">Read the Roadmap →</a>
                <a className="btn btn-secondary" href="/features">View the Features</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <hr className="divider" />

        {/* HORIZONTAL 5-STEP TIMELINE */}
        <section className="section" id="roadmap-steps">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>FIVE PHASES</span>
          </div>
          <h2 className="section-title">Foundation to Global Readiness.</h2>
          <p className="section-sub">
            MITHQAL advances through five sequential phases — each gated by the evidence and approvals required for the next.
          </p>
          <div className="timeline-row">
            {TIMELINE_STEPS.map((s) => (
              <div className="timeline-step" key={s.num}>
                <div className="timeline-circle">{s.icon}</div>
                <div className="timeline-num">STEP {s.num}</div>
                <div className="timeline-title">{s.title}</div>
                <div className="timeline-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* PLATFORM ARCHITECTURE — 3-col: text / isometric / pillars */}
        <section className="section" id="platform-architecture">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            <span>PLATFORM ARCHITECTURE</span>
          </div>
          <h2 className="section-title">Built for What&apos;s Next.</h2>
          <p className="section-sub">
            A layered control plane — settlement, governance, reconciliation and interoperability stacked as distinct, auditable layers that scale without compromising neutrality.
          </p>
          <div className="arch-grid">
            <div className="arch-text">
              {ARCH_LEFT_GROUPS.map((g) => (
                <div className="arch-group" key={g.label}>
                  <div className="arch-label">{g.label}</div>
                  {g.items.map((it) => (
                    <div className="arch-item" key={it}>{it}</div>
                  ))}
                </div>
              ))}
            </div>
            <div className="arch-visual">
              <IsometricArch />
            </div>
            <div className="arch-pillars">
              <div className="pillar-title">Foundational Pillars</div>
              {PILLARS.map((p) => (
                <div className="pillar-item" key={p}>
                  <span className="pillar-bullet" aria-hidden="true" />
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA — banner with background image */}
        <section className="cta-bg">
          <div className="cta-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>THE ROAD AHEAD</span>
            </div>
            <h2 className="section-title">A Stronger Future.</h2>
            <p className="section-sub">
              MITHQAL&apos;s evolution is governed by evidence, controlled progression and institutional validation — not by shortcuts.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="/ecosystem">Explore Ecosystem →</a>
              <a className="btn btn-secondary" href="#roadmap-steps">View the Roadmap</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <p>MITHQAL — Neutral Institutional Settlement Control Plane</p>
          <p className="footer-state">NOT PRODUCTION-AUTHORIZED · BUILD_MODE = FROZEN · MTQ DISABLED</p>
        </div>
      </footer>
    </>
  );
}
