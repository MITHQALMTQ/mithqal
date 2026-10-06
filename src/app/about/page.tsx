/**
 * MITHQAL — About Page (/about)
 * Page 05 — institutional identity.
 *
 * HOME=Vision | FEATURES=Control | ECOSYSTEM=Network | ROADMAP=Evolution | ABOUT=Identity
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false | institutionallyValidated = false
 */

import "./about.css";

const MithqalLogo = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <path d="M4 24V6L14 16L24 6V24" stroke="var(--gold)" strokeWidth="2.5" fill="none" strokeLinejoin="miter" strokeLinecap="square" />
    <path d="M14 16V24" stroke="var(--gold)" strokeWidth="2.5" />
  </svg>
);
const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];
const NAV_HREFS = ["/", "/features", "/ecosystem", "/roadmap", "/about"];

const COMMITMENTS = [
  { num: "01", title: "NEUTRALITY", desc: "MITHQAL does not favor one monetary system, jurisdiction or geopolitical bloc over another." },
  { num: "02", title: "RESERVE DISCIPLINE", desc: "Settlement issuance cannot be separated from applicable backing, authorization, liquidity and finality controls." },
  { num: "03", title: "CRYPTOGRAPHIC AUDITABILITY", desc: "Every important state leaves evidence — attributable, verifiable and auditable." },
  { num: "04", title: "SETTLEMENT LAYER", desc: "MITHQAL exists between monetary systems — never instead of them." },
  { num: "05", title: "INSTITUTIONAL TRACEABILITY", desc: "Every settlement state is designed to remain attributable, reconcilable and auditable." },
  { num: "06", title: "JURISDICTIONAL DISCIPLINE", desc: "One architecture, different regulatory perimeters. Unknown jurisdiction = blocked." },
  { num: "07", title: "NO SOVEREIGN DISPLACEMENT", desc: "MITHQAL does not displace sovereign currencies, central-bank money or existing institutions." },
];

const NOT_ITEMS = ["A central bank", "A commercial bank", "A sovereign currency issuer", "A retail payment platform", "An exchange", "A brokerage", "A market maker", "A lending institution", "An investment fund", "A wealth manager", "A DeFi protocol", "A speculative vehicle"];

const CONSTITUTION_LAYERS = ["Constitution", "Strategic Objective", "Architecture", "Operations", "Code", "Institutional Engagement"];

const TRACE_PATH = ["Participant", "Bank Transaction", "Institutional Settlement ID", "MITHQAL Settlement ID", "Transaction Hash", "Receiving Institution", "Beneficiary"];

const JURISDICTIONS = ["Jurisdiction A", "Jurisdiction B", "Jurisdiction C", "Jurisdiction D"];

export default function AboutPage() {
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home"><MithqalLogo /><span className="brand-wordmark">MITHQAL</span></a>
          <nav className="primary-nav" aria-label="Primary navigation">
            {NAV_ITEMS.map((item, i) => <a key={item} className={`nav-link ${item === "About" ? "active" : ""}`} href={NAV_HREFS[i]}>{item}</a>)}
          </nav>
          <a className="launch-btn" href="/#platform"><span>Launch App</span><span aria-hidden="true">→</span></a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="section" style={{ paddingTop: "120px" }}>
          <div className="hero-grid">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /><span>ABOUT MITHQAL</span></div>
              <h1 className="hero-title">A Neutral Infrastructure for a More Connected <span className="gold-text">Financial Future.</span></h1>
              <p className="body-text">MITHQAL is built around a simple principle: institutional settlement should work best when it is neutral, governed by clear rules, and designed to coexist with the financial systems that already exist. MITHQAL provides a settlement and interoperability layer between regulated monetary systems without seeking to displace sovereign currencies, central-bank money or existing financial institutions.</p>
              <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
                <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
                <a className="btn btn-secondary" href="/ecosystem">View the Ecosystem</a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true" />
          </div>
        </section>

        <hr className="divider" />

        {/* MISSION */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>OUR MISSION</span></div>
          <h2 className="section-title">Neutral Settlement. Institutional Control.</h2>
          <p className="section-sub" style={{ maxWidth: "700px" }}>The mission of MITHQAL is to provide regulated monetary systems with a neutral, reserve-disciplined, cryptographically auditable settlement layer that sits between monetary systems — never instead of monetary systems — enabling regulated financial institutions to settle value across jurisdictions with institutional traceability, jurisdictional compliance and settlement finality.</p>
          <div className="bridge">
            <div className="bridge-side"><div className="bridge-label">Regulated Monetary System</div></div>
            <span className="bridge-arrow">→</span>
            <div className="bridge-center"><div className="bridge-center-label">MITHQAL</div><div className="bridge-sub">Neutral Settlement Layer</div></div>
            <span className="bridge-arrow">→</span>
            <div className="bridge-side"><div className="bridge-label">Regulated Monetary System</div></div>
          </div>
        </section>

        <hr className="divider" />

        {/* VISION */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>OUR VISION</span></div>
          <h2 className="section-title">A Neutral Settlement Fabric for the Regulated Financial System.</h2>
          <p className="section-sub" style={{ maxWidth: "700px" }}>MITHQAL's vision is to become a neutral institutional settlement fabric of the regulated global financial system — a constitutionally governed, mathematically transparent and cryptographically enforced settlement layer that regulated financial institutions and sovereign monetary authorities can use to settle value across jurisdictions without ceding monetary sovereignty.</p>
        </section>

        <hr className="divider" />

        {/* NEUTRALITY */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>THE PRINCIPLE OF NEUTRALITY</span></div>
          <h2 className="section-title">Between Monetary Systems. Never Instead of Them.</h2>
          <p className="section-sub">MITHQAL does not favor one monetary system over another. MITHQAL does not favor one jurisdiction over another. MITHQAL does not favor one geopolitical bloc over another. Each monetary system remains under its own legal and institutional framework. MITHQAL exists as a neutral settlement layer.</p>
        </section>

        <hr className="divider" />

        {/* WHAT MITHQAL IS NOT */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>INSTITUTIONAL BOUNDARY</span></div>
          <h2 className="section-title">Defined by What We Do. Protected by What We Do Not Become.</h2>
          <div className="not-grid" style={{ marginTop: "40px" }}>
            {NOT_ITEMS.map((item) => <div className="not-item" key={item}>{item}</div>)}
          </div>
        </section>

        <hr className="divider" />

        {/* SEVEN COMMITMENTS */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CORE COMMITMENTS</span></div>
          <h2 className="section-title">Seven Architectural Commitments.</h2>
          <div className="commitments-grid" style={{ marginTop: "40px" }}>
            {COMMITMENTS.map((c) => (
              <div className="commitment" key={c.num}>
                <div className="commitment-num">{c.num}</div>
                <div className="commitment-title">{c.title}</div>
                <div className="commitment-desc">{c.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* RESERVE DISCIPLINE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>RESERVE DISCIPLINE</span></div>
          <h2 className="section-title">Control Before Issuance.</h2>
          <p className="section-sub">MITHQAL's architecture is designed so that settlement issuance cannot be separated from applicable backing, authorization, liquidity, concentration, jurisdiction and finality controls.</p>
        </section>

        <hr className="divider" />

        {/* CRYPTOGRAPHIC AUDITABILITY */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CRYPTOGRAPHIC AUDITABILITY</span></div>
          <h2 className="section-title">Every Important State Leaves Evidence.</h2>
          <div className="trace-flow">
            {TRACE_PATH.map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center" }}>
                <div className="trace-node">{step}</div>
                {i < TRACE_PATH.length - 1 && <span className="trace-arrow">→</span>}
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* JURISDICTIONAL DISCIPLINE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>JURISDICTIONAL DISCIPLINE</span></div>
          <h2 className="section-title">One Architecture. Different Regulatory Perimeters.</h2>
          <div className="jur-grid">
            {JURISDICTIONS.map((j) => (
              <div className="jur-card" key={j}><div className="jur-title">{j}</div><div className="jur-desc">Legal perimeter · Authorization · Policy</div></div>
            ))}
          </div>
          <div className="layers" style={{ maxWidth: "400px", marginTop: "32px" }}>
            <div className="layer gold">MITHQAL Jurisdictional Control</div>
            <div className="layer muted">UNKNOWN = BLOCKED</div>
          </div>
        </section>

        <hr className="divider" />

        {/* HUMAN GOVERNANCE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>HUMAN GOVERNANCE</span></div>
          <h2 className="section-title">Intelligence Assists. Governance Decides.</h2>
          <p className="section-sub">Artificial intelligence may assist, analyze, monitor and advise. Constitutional legitimacy, governance authority and monetary sovereignty remain vested in qualified human governance.</p>
          <div className="layers">
            <div className="layer">AI / Analytics</div>
            <div className="layer-arrow">↓</div>
            <div className="layer">Recommend</div>
            <div className="layer-arrow">↓</div>
            <div className="layer gold">Human Governance</div>
            <div className="layer-arrow">↓</div>
            <div className="layer">Authorize / Reject</div>
            <div className="layer-arrow">↓</div>
            <div className="layer">Controlled Execution</div>
          </div>
        </section>

        <hr className="divider" />

        {/* CONSTITUTIONAL GOVERNANCE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CONSTITUTIONAL GOVERNANCE</span></div>
          <h2 className="section-title">Rules Before Convenience.</h2>
          <div className="layers">
            {CONSTITUTION_LAYERS.map((layer, i) => (
              <div key={layer}>
                <div className={`layer ${i === 0 ? "gold" : ""}`}>{layer}</div>
                {i < CONSTITUTION_LAYERS.length - 1 && <div className="layer-arrow">↓</div>}
              </div>
            ))}
          </div>
          <p className="section-sub" style={{ marginTop: "28px" }}>Lower layers must conform to higher authority.</p>
        </section>

        <hr className="divider" />

        {/* BUILD / TEST / VALIDATE */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>METHODOLOGY</span></div>
          <h2 className="section-title">Build. Test. Validate.</h2>
          <div className="btv-grid">
            <div className="btv-col"><div className="btv-label">BUILD</div><div className="btv-desc">Construct the architecture in conformance with the constitution.</div></div>
            <div className="btv-col"><div className="btv-label">TEST</div><div className="btv-desc">Challenge the architecture against adversarial conditions.</div></div>
            <div className="btv-col"><div className="btv-label">VALIDATE</div><div className="btv-desc">Obtain independent institutional evidence.</div></div>
          </div>
          <div className="btv-center">BUILD → TEST → VALIDATE</div>
        </section>

        <hr className="divider" />

        {/* CURRENT STATUS */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>CURRENT STATE</span></div>
          <h2 className="section-title">Where MITHQAL Stands.</h2>
          <div className="status-panel">
            <div className="status-label">Verified Current State</div>
            <div className="status-row"><span className="status-key">Architecture</span><span className="status-val">DESIGNED / IMPLEMENTED</span></div>
            <div className="status-row"><span className="status-key">Institutional Validation</span><span className="status-val">NOT ESTABLISHED</span></div>
            <div className="status-row"><span className="status-key">Production Authorization</span><span className="status-val">NOT AUTHORIZED</span></div>
            <div className="status-row"><span className="status-key">MTQ</span><span className="status-val">DISABLED</span></div>
          </div>
        </section>

        <hr className="divider" />

        {/* NON-CUSTODIAL */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>NON-CUSTODIAL BY DEFAULT</span></div>
          <h2 className="section-title">Custody Is Configured Separately.</h2>
          <p className="section-sub">MITHQAL does not become a custodian merely because reserve assets, bank money, CBDCs, gold or tokenised deposits are interoperable with the architecture. Custody and legal ownership are configured and validated separately.</p>
        </section>

        <hr className="divider" />

        {/* MTQ */}
        <section className="section">
          <div className="mtq-box">
            <div className="mtq-label">MTQ WITHIN THE ARCHITECTURE</div>
            <div className="mtq-title">MTQ</div>
            <p className="mtq-desc">MTQ is a permissioned wholesale settlement instrument used within the MITHQAL settlement infrastructure. MITHQAL does not present MTQ as a retail stablecoin, consumer payment coin, investment product, exchange-traded speculative instrument, sovereign currency, CBDC, or replacement for sovereign currency.</p>
          </div>
        </section>

        <hr className="divider" />

        {/* GOLD / SHARIA */}
        <section className="section">
          <div className="eyebrow"><span className="eyebrow-line" /><span>GOLD & SHARIA</span></div>
          <h2 className="section-title">Gold Is Architectural. Sharia Requires Certification.</h2>
          <p className="section-sub">Gold is an important component of the intended architecture. Final Sharia permissibility requires independent qualified scholarly review and certification of the complete live structure. Sharia certification is not represented as completed.</p>
        </section>

        {/* CLOSING CTA */}
        <section className="cta-bg">
          <div className="cta-content">
            <div className="eyebrow"><span className="eyebrow-line" /><span>OUR COMMITMENT</span></div>
            <h2 className="section-title">Built for Institutions. Designed for What Comes Next.</h2>
            <p className="section-sub">MITHQAL is designed as long-term institutional infrastructure: neutral, controlled, interoperable and governed by evidence.</p>
            <div style={{ display: "flex", gap: "19px", marginTop: "36px", flexWrap: "wrap" }}>
              <a className="btn btn-primary" href="/features">Explore the Architecture →</a>
              <a className="btn btn-secondary" href="/ecosystem">Explore the Ecosystem →</a>
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
