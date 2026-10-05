/**
 * MITHQAL — Roadmap Page (/roadmap)
 * Page 04 — controlled evolution.
 *
 * HOME = Vision | FEATURES = Control System | ECOSYSTEM = Network | ROADMAP = Controlled Evolution
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

const MithqalLogo = () => (
  <svg width="39" height="39" viewBox="0 0 39 39" fill="none" aria-hidden="true">
    <path d="M19.5 3L34 11.5v16L19.5 36L5 27.5v-16L19.5 3Z" stroke="#E8B96F" strokeWidth="2" fill="none" />
    <path d="M19.5 10L27 14.5v10L19.5 29L12 24.5v-10L19.5 10Z" fill="#E8B96F" />
    <path d="M19.5 3V10M34 11.5L27 14.5M5 11.5L12 14.5M19.5 36V29" stroke="#E8B96F" strokeWidth="1.5" />
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
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; }
        body { background: #000611; color: #f5f5f4; font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        a { color: inherit; text-decoration: none; }

        .site-header { position: fixed; inset: 0 0 auto 0; z-index: 50; height: 78px; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(0,6,17,0.68); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .header-inner { height: 100%; max-width: 1380px; margin: 0 auto; padding: 0 6vw; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px; }
        .brand { display: inline-flex; align-items: center; gap: 18px; justify-self: start; }
        .brand-wordmark { font-size: 27px; font-weight: 400; letter-spacing: 0.27em; line-height: 1; color: #f5f5f4; }
        .primary-nav { display: flex; align-items: center; justify-content: center; gap: 41px; }
        .nav-link { position: relative; padding: 30px 0 27px; color: rgba(245,245,244,0.86); font-size: 14px; font-weight: 400; transition: color 180ms ease; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 18px; height: 1px; transform: scaleX(0); transform-origin: center; background: #E8B96F; transition: transform 180ms ease; }
        .nav-link:hover, .nav-link.active { color: #f5f5f4; }
        .nav-link.active::after { transform: scaleX(1); }
        .launch-btn { justify-self: end; min-width: 157px; height: 38px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid rgba(232,185,111,0.9); border-radius: 9999px; font-size: 14px; color: #f5f5f4; transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease; background: transparent; }
        .launch-btn:hover { background: rgba(232,185,111,0.08); box-shadow: 0 0 24px rgba(232,185,111,0.10); transform: translateY(-1px); }

        .section { max-width: 1380px; margin: 0 auto; padding: 100px 6vw; }
        .eyebrow { display: flex; align-items: center; gap: 14px; color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 20px; }
        .eyebrow-line { width: 3px; height: 18px; background: #E8B96F; display: inline-block; }
        h1, h2, h3 { margin: 0; }
        .hero-title { font-size: clamp(44px, 5vw, 72px); font-weight: 400; line-height: 1.0; letter-spacing: -0.043em; color: #f5f5f4; max-width: 700px; }
        .gold-text { color: #F3C879; }
        .body-text { color: rgba(245,245,244,0.80); font-size: 18px; line-height: 1.62; max-width: 560px; margin-top: 28px; }
        .section-title { font-size: clamp(36px, 4vw, 56px); font-weight: 400; line-height: 1.05; letter-spacing: -0.04em; color: #f5f5f4; }
        .section-sub { color: rgba(245,245,244,0.70); font-size: 17px; line-height: 1.6; max-width: 600px; margin-top: 20px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 46px; padding: 0 29px; border-radius: 9999px; font-size: 14px; cursor: pointer; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; text-decoration: none; }
        .btn-primary { background: #E8B96F; color: #06080c; font-weight: 500; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 42px rgba(232,185,111,0.24); }
        .btn-secondary { border: 1px solid #E8B96F; color: #f5f5f4; background: rgba(0,0,0,0.18); }
        .btn-secondary:hover { transform: translateY(-2px); background: rgba(232,185,111,0.06); }

        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; min-height: calc(100vh - 78px); padding-top: 78px; }
        .hero-visual { position: relative; width: 100%; min-height: 500px; background: url("/assets/mithqal-roadmap-hero.png") center center / cover no-repeat; opacity: 0.92; }

        .stage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.40); }
        .stage-card { padding: 36px 28px; border-right: 1px solid rgba(255,255,255,0.10); border-bottom: 1px solid rgba(255,255,255,0.10); }
        .stage-card:nth-child(3n) { border-right: none; }
        .stage-card:nth-last-child(-n+1) { border-bottom: none; }
        .stage-num { color: #E8B96F; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; margin-bottom: 8px; }
        .stage-title { color: #f5f5f4; font-size: 17px; font-weight: 500; margin-bottom: 4px; }
        .stage-status { color: rgba(232,185,111,0.70); font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
        .stage-desc { color: rgba(245,245,244,0.60); font-size: 13px; line-height: 1.55; margin-bottom: 12px; }
        .stage-items { display: flex; flex-direction: column; gap: 4px; }
        .stage-item { color: rgba(245,245,244,0.50); font-size: 12px; padding-left: 12px; position: relative; }
        .stage-item::before { content: "·"; position: absolute; left: 0; color: #E8B96F; }

        .pilot-flow { display: flex; flex-direction: column; gap: 0; max-width: 700px; margin-top: 40px; }
        .pilot-node { display: grid; grid-template-columns: 60px 1fr; gap: 24px; padding: 20px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); }
        .pilot-node:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .pilot-num { color: #E8B96F; font-size: 24px; font-weight: 400; }
        .pilot-title { color: #f5f5f4; font-size: 15px; font-weight: 500; margin-bottom: 4px; }
        .pilot-desc { color: rgba(245,245,244,0.60); font-size: 13px; line-height: 1.5; }
        .pilot-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 18px; padding: 4px 0; }

        .gates-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); }
        .gate-cell { padding: 20px 16px; border-right: 1px solid rgba(255,255,255,0.10); border-bottom: 1px solid rgba(255,255,255,0.10); text-align: center; }
        .gate-cell:nth-child(5n) { border-right: none; }
        .gate-id { color: #E8B96F; font-size: 13px; font-weight: 600; letter-spacing: 0.08em; }
        .gate-title { color: rgba(245,245,244,0.70); font-size: 12px; margin-top: 4px; line-height: 1.3; }

        .btv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
        .btv-col { border: 1px solid rgba(255,255,255,0.10); padding: 32px; background: rgba(7,17,31,0.30); }
        .btv-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; text-align: center; }
        .btv-item { color: rgba(245,245,244,0.70); font-size: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; }
        .btv-item:last-child { border-bottom: none; }
        .btv-center { text-align: center; margin: 32px 0; font-size: 22px; font-weight: 400; color: #F3C879; letter-spacing: 0.05em; }

        .foundation-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.30); }
        .foundation-item { padding: 20px 12px; border-right: 1px solid rgba(255,255,255,0.08); text-align: center; color: rgba(245,245,244,0.70); font-size: 13px; }
        .foundation-item:last-child { border-right: none; }

        .validation-flow { display: flex; flex-direction: column; gap: 0; max-width: 600px; margin: 40px auto 0; }
        .val-node { padding: 14px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); text-align: center; color: #f5f5f4; font-size: 14px; }
        .val-node:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .val-node.gold { border-color: rgba(232,185,111,0.3); background: rgba(232,185,111,0.06); color: #F3C879; }
        .val-node.muted { color: rgba(245,245,244,0.50); font-style: italic; }
        .val-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 16px; padding: 2px 0; }

        .future-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.30); }
        .future-item { padding: 20px 12px; border-right: 1px solid rgba(255,255,255,0.08); text-align: center; color: rgba(245,245,244,0.70); font-size: 13px; }
        .future-item:last-child { border-right: none; }

        .status-panel { border: 1px solid rgba(232,185,111,0.2); padding: 28px; background: rgba(232,185,111,0.04); max-width: 600px; margin: 40px auto 0; text-align: center; }
        .status-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 12px; }
        .status-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .status-row:last-child { border-bottom: none; }
        .status-key { color: rgba(245,245,244,0.70); font-size: 14px; }
        .status-val { color: rgba(245,245,244,0.50); font-size: 14px; font-weight: 500; }

        .critical-path { display: flex; flex-direction: column; gap: 0; max-width: 500px; margin: 40px auto 0; }
        .cp-node { padding: 12px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); text-align: center; color: #E8B96F; font-size: 14px; font-weight: 500; }
        .cp-node:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); border-color: rgba(232,185,111,0.3); background: rgba(232,185,111,0.06); color: #F3C879; }
        .cp-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 16px; padding: 2px 0; }

        .mtq-box { border: 1px solid rgba(255,255,255,0.10); padding: 40px; text-align: center; background: rgba(7,17,31,0.30); max-width: 700px; margin: 0 auto; }
        .mtq-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 16px; }
        .mtq-title { font-size: 28px; font-weight: 400; color: #f5f5f4; margin-bottom: 20px; }
        .mtq-desc { color: rgba(245,245,244,0.70); font-size: 16px; line-height: 1.6; }

        .cta-bg { position: relative; min-height: 500px; background: url("/assets/mithqal-roadmap-cta.png") center center / cover no-repeat; display: flex; align-items: center; }
        .cta-bg::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,6,17,0.85) 0%, rgba(0,6,17,0.50) 50%, rgba(0,6,17,0.30) 100%); }
        .cta-content { position: relative; z-index: 1; max-width: 1380px; margin: 0 auto; padding: 80px 6vw; width: 100%; }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }
        .site-footer { border-top: 1px solid rgba(255,255,255,0.08); background: #000611; padding: 32px 6vw; text-align: center; color: rgba(245,245,244,0.40); font-size: 12px; }
        .footer-inner { max-width: 1380px; margin: 0 auto; }
        .footer-state { margin-top: 4px; color: rgba(232,185,111,0.40); }

        @media (max-width: 1200px) { .stage-grid { grid-template-columns: repeat(2, 1fr); } .stage-card:nth-child(3n) { border-right: 1px solid rgba(255,255,255,0.10); } .stage-card:nth-child(2n) { border-right: none; } .gates-grid { grid-template-columns: repeat(4, 1fr); } .gate-cell:nth-child(5n) { border-right: 1px solid rgba(255,255,255,0.10); } .gate-cell:nth-child(4n) { border-right: none; } .foundation-grid, .future-grid { grid-template-columns: repeat(3, 1fr); } .foundation-item:nth-child(5n), .future-item:nth-child(5n) { border-right: 1px solid rgba(255,255,255,0.08); } .foundation-item:nth-child(3n), .future-item:nth-child(3n) { border-right: none; } }
        @media (max-width: 900px) { .site-header { height: 70px; } .header-inner { display: flex; justify-content: space-between; } .primary-nav { display: none; } .launch-btn { min-width: auto; height: 36px; padding: 0 15px; } .hero-grid { grid-template-columns: 1fr; } .hero-visual { min-height: 300px; } .stage-grid { grid-template-columns: 1fr; } .stage-card { border-right: none !important; } .gates-grid { grid-template-columns: repeat(2, 1fr); } .btv-grid { grid-template-columns: 1fr; } .foundation-grid, .future-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px) { .launch-btn span:first-child { display: none; } .launch-btn { min-width: 44px; padding: 0 12px; } .gates-grid { grid-template-columns: 1fr; } .foundation-grid, .future-grid { grid-template-columns: 1fr; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

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
