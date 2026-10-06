/**
 * MITHQAL — Features Page (/features)
 * Page 02 — the control plane behind institutional settlement.
 *
 * Design: split hero (text left / 3D control plane graphic right) +
 * 5 large capability cards + orchestration workflow with circular
 * outlined icons. Matches reference image 3.
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./features.css";

// ─── Shared Header ──────────────────────────────────────────────────
const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);

const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

// ─── Capability Icons (line-art, gold stroke) ──────────────────────
const SettlementIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>);
const PolicyIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><path d="M9 12l2 2 4-4"/></svg>);
const FinalityIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);
const RailsIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const EvidenceIcon = () => (<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>);

const CAPABILITIES = [
  { num: "01", title: "Settlement Orchestration", desc: "Coordinate institutional workflows from instruction through completion.", icon: <SettlementIcon /> },
  { num: "02", title: "Policy & Authorization", desc: "Institutional policies, risk controls and authorization layers.", icon: <PolicyIcon /> },
  { num: "03", title: "Multi-Rail Interoperability", desc: "Complements existing financial messaging and payment infrastructure.", icon: <RailsIcon /> },
  { num: "04", title: "Reconciliation & Separation", desc: "Three-book architecture ensuring economic separation.", icon: <EvidenceIcon /> },
  { num: "05", title: "Evidence & Continuity", desc: "Immutable evidence, controlled backing and recovery.", icon: <FinalityIcon /> },
];

// ─── Workflow Icons (circular outlined) ────────────────────────────
const RequestIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>);
const ValidateIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>);
const AuthorizeIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/></svg>);
const FinalityStepIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>);
const SettleIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>);
const ReconcileIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v4M7 17l3-4M17 17l-3-4"/></svg>);
const EvidenceStepIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>);

const WORKFLOW = [
  { label: "Request", icon: <RequestIcon /> },
  { label: "Validate", icon: <ValidateIcon /> },
  { label: "Authorize", icon: <AuthorizeIcon /> },
  { label: "Finality", icon: <FinalityStepIcon /> },
  { label: "Settle", icon: <SettleIcon /> },
  { label: "Reconcile", icon: <ReconcileIcon /> },
  { label: "Evidence", icon: <EvidenceStepIcon /> },
];

// ─── Page Component ───────────────────────────────────────────────
export default function FeaturesPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => (
              <a key={item} className={`nav-link ${item === "Features" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>
            ))}
          </nav>
          <a className="launch-btn" href="/#platform"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* ─── HERO (split: text left / 3D graphic right) ─── */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>MITHQAL FEATURES</span></div>
              <h1 className="hero-title">The Control Plane Behind <span className="gold-text">Institutional Settlement.</span></h1>
              <p className="body-text">MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#capabilities">Explore the Architecture →</a>
                <a className="btn btn-secondary" href="/ecosystem">View the Ecosystem</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" role="img" aria-label="3D control plane hub" />
          </div>
        </section>

        <hr className="divider" />

        {/* ─── CORE CAPABILITIES (5 large cards) ─── */}
        <section className="section" id="capabilities">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CORE CAPABILITIES</span></div>
          <h2 className="section-title">Built as One <span className="gold-text">Control System.</span></h2>
          <p className="section-sub">Each capability operates as part of one coordinated institutional architecture rather than as an isolated product feature.</p>
          <div className="capabilities-grid" style={{ marginTop: "40px" }}>
            {CAPABILITIES.map((cap) => (
              <div className="cap-card" key={cap.num}>
                <span className="cap-num">{cap.num}</span>
                <div className="cap-icon">{cap.icon}</div>
                <div className="cap-title">{cap.title}</div>
                <div className="cap-desc">{cap.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── ORCHESTRATION WORKFLOW (circular outlined icons) ─── */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>ORCHESTRATION WORKFLOW</span></div>
          <h2 className="section-title">From Instruction to <span className="gold-text">Finality.</span></h2>
          <p className="section-sub">Every institutional settlement workflow is designed to remain controlled, traceable and auditable from instruction through final state.</p>
          <div className="workflow-row" style={{ marginTop: "48px" }}>
            {WORKFLOW.map((step, i) => (
              <div key={step.label} className="workflow-step">
                <div className="workflow-circle">{step.icon}</div>
                <div className="workflow-label">{step.label}</div>
                {i < WORKFLOW.length - 1 && <div className="workflow-arrow" aria-hidden="true">→</div>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ─── FINAL CTA ─── */}
        <section className="cta-section">
          <h2 className="cta-title">See the Architecture Behind the <span className="gold-text">Control Plane.</span></h2>
          <p className="cta-sub">Explore how MITHQAL coordinates institutional participants, settlement workflows, policy, interoperability, reconciliation and evidence through one controlled architecture.</p>
          <div className="cta-actions">
            <a className="btn btn-primary" href="/ecosystem">Explore the Ecosystem →</a>
            <a className="btn btn-secondary" href="/roadmap">Read the Roadmap</a>
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
