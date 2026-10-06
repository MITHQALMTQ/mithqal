/**
 * MITHQAL — Roadmap Page (/roadmap)
 * Page 04 — controlled evolution.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Network | ROADMAP = Controlled Evolution
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./roadmap.css";

const MithqalLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 2L29 9.5v13L16 30L3 22.5v-13L16 2Z" stroke="var(--gold)" strokeWidth="1.5" fill="none" />
    <path d="M9 22V11L16 17L23 11V22" stroke="var(--gold)" strokeWidth="2" fill="none" strokeLinejoin="miter" />
    <path d="M16 17V22" stroke="var(--gold)" strokeWidth="2" />
  </svg>
);
const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/#about"];

const STAGES = [
  { num: "01", title: "FOUNDATION", status: "FOUNDATIONAL", desc: "Core architecture, security, control framework, policy, finality, reconciliation and evidence model.", items: ["Core Architecture", "Security", "Control Framework", "Policy", "Finality", "Reconciliation", "Evidence Model"] },
  { num: "02", title: "CONTROLLED TESTING", status: "CONTROLLED TESTING", desc: "Test the architecture against adversarial conditions and constitutional invariants.", items: ["Adversarial Tests", "Failure Scenarios", "Finality Tests", "Reconciliation Tests", "Contradiction Controls"] },
  { num: "03", title: "LEGAL & INSTITUTIONAL VALIDATION", status: "EXTERNAL VALIDATION", desc: "Obtain independent legal, regulatory and institutional evidence.", items: ["Legal Classification", "Licensing", "Bank Contract", "Liability Framework", "Jurisdictional Validation"] },
  { num: "04", title: "CONTROLLED PILOT", status: "GATED", desc: "Advance only after upstream gates and agreements are satisfied.", items: ["Authorized Sponsor", "Single Jurisdiction", "Defined Corridor", "Controlled Environment", "Approved Participant Scope"] },
  { num: "05", title: "MULTI-RAIL EXPANSION", status: "FUTURE / CONDITIONAL", desc: "Expand only after evidence-backed progression through earlier gates.", items: ["Additional Rails", "Institutional Interoperability", "Routing", "Resilience", "Operational Scale"] },
  { num: "06", title: "INSTITUTIONAL SCALE", status: "FUTURE / CONDITIONAL", desc: "Long-term expansion remains conditional on all applicable approvals.", items: ["Multiple Institutions", "Multiple Jurisdictions", "Broader Interoperability", "Operational Maturity"] },
];

const PILOTS = [
  { num: "0", title: "Legal + Architecture Validation", desc: "Validate architecture, boundaries, legal classification and institutional requirements before real-value movement." },
  { num: "1", title: "One Regulated Institution", desc: "A narrowly scoped institutional flow through one regulated sponsor, one jurisdiction and one approved corridor." },
  { num: "2", title: "Two-Bank / Two-Jurisdiction Settlement", desc: "Expand only after required evidence from the initial controlled pilot supports broader cross-border testing." },
  { num: "3", title: "Multi-Rail Interoperability", desc: "Test additional approved settlement rails, routing and controlled fallback behavior." },
  { num: "4", title: "Institutional Scale", desc: "Expand to multi-bank and multi-jurisdiction institutional interoperability after applicable validation and governance gates." },
];

const GATES = [
  { id: "G01", title: "Legal Classification" },
  { id: "G02", title: "Licensing" },
  { id: "G03", title: "Bank Contract" },
  { id: "G04", title: "Liability / Resolution" },
  { id: "G05", title: "Bank Technical Certification" },
  { id: "G06", title: "Legal Backing" },
  { id: "G07", title: "Protected Backing" },
  { id: "G08", title: "Three-Book Operations" },
  { id: "G09", title: "Technical + Legal Finality" },
  { id: "G10", title: "AML / Sanctions" },
  { id: "G11", title: "Live Reconciliation" },
  { id: "G12", title: "Independent Assurance" },
  { id: "G13", title: "Controlled Pilot" },
  { id: "G14", title: "Accounting / Prudential" },
  { id: "G15", title: "Cyber Assurance" },
  { id: "G16", title: "Disaster Recovery" },
  { id: "G17", title: "Commercial TCO" },
  { id: "G18", title: "Competitive Validation" },
  { id: "G19", title: "Wind-down" },
  { id: "G20", title: "Production Governance" },
];

const FOUNDATION_ITEMS = ["Constitution", "Policy Registry", "Finality", "Three-Book Separation", "Protected Backing", "Reconciliation", "Bank Gateway", "Multi-Rail Routing", "Security", "Continuity"];
const VALIDATION_DOMAINS = ["Legal", "Regulatory", "Bank", "Security", "Assurance", "Operations"];
const FUTURE_ITEMS = ["New Jurisdictions", "New Rails", "New Institutional Participants", "Increased Operational Scale", "Advanced Interoperability"];
const CRITICAL_PATH = [["G01"], ["G02","G03","G04"], ["G05"], ["G06","G07","G08"], ["G09","G10","G11"], ["G12"], ["G13"], ["G14–G20"]];

export default function RoadmapPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => <a key={item} className={`nav-link ${item === "Roadmap" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>)}
          </nav>
          <a className="launch-btn" href="/#platform"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>THE MITHQAL ROADMAP</span></div>
              <h1 className="hero-title">A Structured Path to <span className="gold-text">Institutional Evolution.</span></h1>
              <p className="body-text">MITHQAL evolves through controlled build, adversarial testing and independent institutional validation — expanding only when the required architectural, legal, regulatory and operational conditions have been satisfied.</p>
              <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="/ecosystem">Explore the Ecosystem →</a>
                <a className="btn btn-secondary" href="/features">View the Architecture</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <hr className="divider" />

        {/* THE JOURNEY */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE JOURNEY</span></div>
          <h2 className="section-title">From Foundation to Institutional Readiness.</h2>
          <p className="section-sub">MITHQAL does not treat architectural completion as institutional readiness. Each stage advances only when the evidence and governance required for the next stage exist.</p>
          <div className="stage-grid" style={{ marginTop: "40px" }}>
            {STAGES.map((s) => (
              <div className="stage-card" key={s.num}>
                <div className="stage-num">{s.num}</div>
                <div className="stage-title">{s.title}</div>
                <div className="stage-status">{s.status}</div>
                <div className="stage-desc">{s.desc}</div>
                <div className="stage-items">{s.items.map((item) => <div className="stage-item" key={item}>{item}</div>)}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* PILOT PATH */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE CONTROLLED PILOT PATH</span></div>
          <h2 className="section-title">Sequential Pilot Progression.</h2>
          <div className="pilot-flow">
            {PILOTS.map((p, i) => (
              <div key={p.num}>
                <div className="pilot-node"><span className="pilot-num">{p.num}</span><div><div className="pilot-title">{p.title}</div><div className="pilot-desc">{p.desc}</div></div></div>
                {i < PILOTS.length - 1 && <div className="pilot-arrow">↓</div>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* GATES */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>NO SHORTCUTS</span></div>
          <h2 className="section-title">Every Expansion Has a Gate.</h2>
          <div className="gates-grid" style={{ marginTop: "40px" }}>
            {GATES.map((g) => (
              <div className="gate-cell" key={g.id}><div className="gate-id">{g.id}</div><div className="gate-title">{g.title}</div></div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* CURRENT STATUS */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CURRENT POSITION</span></div>
          <h2 className="section-title">Where MITHQAL Stands.</h2>
          <div className="status-panel">
            <div className="status-label">Verified Current State</div>
            <div className="status-row"><span className="status-key">Production</span><span className="status-val">NOT AUTHORIZED</span></div>
            <div className="status-row"><span className="status-key">Institutional Validation</span><span className="status-val">NOT ESTABLISHED</span></div>
            <div className="status-row"><span className="status-key">Release Status</span><span className="status-val">RELEASE BLOCKED</span></div>
            <div className="status-row"><span className="status-key">MTQ</span><span className="status-val">DISABLED</span></div>
          </div>
        </section>

        <hr className="divider" />

        {/* CRITICAL PATH */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CRITICAL PATH</span></div>
          <h2 className="section-title">The Gate Sequence.</h2>
          <div className="critical-path">
            {CRITICAL_PATH.map((group, i) => (
              <div key={i}>
                <div className="cp-node">{group.join(" → ")}</div>
                {i < CRITICAL_PATH.length - 1 && <div className="cp-arrow">↓</div>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* BUILD / TEST / VALIDATE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>METHODOLOGY</span></div>
          <h2 className="section-title">Build. Test. Validate.</h2>
          <div className="btv-grid">
            <div className="btv-col">
              <div className="btv-label">BUILD</div>
              <div className="btv-item">Architecture</div>
              <div className="btv-item">Controls</div>
              <div className="btv-item">Services</div>
              <div className="btv-item">Schemas</div>
              <div className="btv-item">Policies</div>
            </div>
            <div className="btv-col">
              <div className="btv-label">TEST</div>
              <div className="btv-item">Adversarial Scenarios</div>
              <div className="btv-item">Failure Injection</div>
              <div className="btv-item">Finality</div>
              <div className="btv-item">Reconciliation</div>
              <div className="btv-item">Security</div>
            </div>
            <div className="btv-col">
              <div className="btv-label">VALIDATE</div>
              <div className="btv-item">Legal</div>
              <div className="btv-item">Regulatory</div>
              <div className="btv-item">Bank</div>
              <div className="btv-item">Independent Assurance</div>
              <div className="btv-item">Pilot Evidence</div>
            </div>
          </div>
          <div className="btv-center">BUILD → TEST → VALIDATE</div>
        </section>

        <hr className="divider" />

        {/* FOUNDATION */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>FOUNDATION</span></div>
          <h2 className="section-title">Built Before It Is Expanded.</h2>
          <div className="foundation-grid" style={{ marginTop: "40px" }}>
            {FOUNDATION_ITEMS.map((item) => <div className="foundation-item" key={item}>{item}</div>)}
          </div>
        </section>

        <hr className="divider" />

        {/* INSTITUTIONAL VALIDATION */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>VALIDATION</span></div>
          <h2 className="section-title">Validation Is External.</h2>
          <p className="section-sub">MITHQAL treats independent institutional evidence as distinct from software completion, internal testing and architectural documentation.</p>
          <div className="validation-flow">
            {VALIDATION_DOMAINS.map((d) => <div className="val-node" key={d}>{d}</div>)}
            <div className="val-arrow">↓</div>
            <div className="val-node gold">INSTITUTIONAL VALIDATION</div>
            <div className="val-arrow">↓</div>
            <div className="val-node muted">Production Authorization (conditional — not currently established)</div>
          </div>
        </section>

        <hr className="divider" />

        {/* FUTURE EVOLUTION */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>FUTURE EVOLUTION</span></div>
          <h2 className="section-title">Expansion Follows Evidence.</h2>
          <div className="future-grid" style={{ marginTop: "40px" }}>
            {FUTURE_ITEMS.map((item) => <div className="future-item" key={item}>{item}</div>)}
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>Each connects to Controlled Governance. Expansion is conditional.</p>
        </section>

        <hr className="divider" />

        {/* MTQ */}
        <section className="section">
          <div className="mtq-box">
            <div className="mtq-label">OPTIONAL SETTLEMENT PRIMITIVE</div>
            <div className="mtq-title">MTQ</div>
            <p className="mtq-desc">MTQ remains a permissioned institutional settlement instrument within the broader MITHQAL architecture. The control-plane architecture does not depend on speculative public-market access to MTQ.</p>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="cta-bg">
          <div className="cta-content">
            <div className="eyebrow"><span className="eyebrow-line" /><span>THE ROAD AHEAD</span></div>
            <h2 className="section-title">A Stronger Institutional Architecture.</h2>
            <p className="section-sub">MITHQAL's evolution is governed by evidence, controlled progression and institutional validation — not by shortcuts.</p>
            <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="/ecosystem">Explore the Ecosystem →</a>
              <a className="btn btn-secondary" href="/features">Read the Features →</a>
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
