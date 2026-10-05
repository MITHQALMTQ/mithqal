/**
 * MITHQAL — About Page (/about)
 * Page 05 — institutional identity.
 *
 * HOME=Vision | FEATURES=Control | ECOSYSTEM=Network | ROADMAP=Evolution | ABOUT=Identity
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
        .section-sub { color: rgba(245,245,244,0.70); font-size: 17px; line-height: 1.6; max-width: 620px; margin-top: 20px; }
        .btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 46px; padding: 0 29px; border-radius: 9999px; font-size: 14px; cursor: pointer; transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; text-decoration: none; }
        .btn-primary { background: #E8B96F; color: #06080c; font-weight: 500; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 42px rgba(232,185,111,0.24); }
        .btn-secondary { border: 1px solid #E8B96F; color: #f5f5f4; background: rgba(0,0,0,0.18); }
        .btn-secondary:hover { transform: translateY(-2px); background: rgba(232,185,111,0.06); }

        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; min-height: calc(100vh - 78px); padding-top: 78px; }
        .hero-visual { position: relative; width: 100%; min-height: 500px; background: url("/assets/mithqal-about-hero.png") center center / cover no-repeat; opacity: 0.92; }

        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }

        .not-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.40); }
        .not-item { padding: 20px 16px; border-right: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); text-align: center; color: rgba(245,245,244,0.40); font-size: 13px; text-decoration: line-through; text-decoration-color: rgba(232,185,111,0.30); }
        .not-item:nth-child(4n) { border-right: none; }
        .not-item:nth-last-child(-n+4) { border-bottom: none; }

        .commitments-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; border: 1px solid rgba(255,255,255,0.10); background: rgba(7,17,31,0.30); }
        .commitment { padding: 28px 16px; border-right: 1px solid rgba(255,255,255,0.08); text-align: center; }
        .commitment:last-child { border-right: none; }
        .commitment-num { color: #E8B96F; font-size: 20px; font-weight: 400; margin-bottom: 12px; }
        .commitment-title { color: #f5f5f4; font-size: 13px; font-weight: 500; letter-spacing: 0.05em; margin-bottom: 10px; }
        .commitment-desc { color: rgba(245,245,244,0.55); font-size: 11px; line-height: 1.5; }

        .bridge { display: flex; align-items: center; justify-content: center; gap: 40px; margin-top: 40px; flex-wrap: wrap; }
        .bridge-side { border: 1px solid rgba(255,255,255,0.10); padding: 28px; text-align: center; background: rgba(7,17,31,0.30); min-width: 200px; }
        .bridge-label { color: rgba(245,245,244,0.70); font-size: 14px; font-weight: 500; }
        .bridge-center { border: 1px solid rgba(232,185,111,0.3); padding: 36px; text-align: center; background: rgba(232,185,111,0.06); }
        .bridge-center-label { color: #F3C879; font-size: 20px; font-weight: 500; }
        .bridge-sub { color: rgba(232,185,111,0.60); font-size: 11px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 8px; }
        .bridge-arrow { color: rgba(232,185,111,0.40); font-size: 24px; }

        .layers { display: flex; flex-direction: column; gap: 0; max-width: 500px; margin: 40px auto 0; }
        .layer { padding: 16px 24px; border: 1px solid rgba(255,255,255,0.10); border-bottom: none; background: rgba(7,17,31,0.30); text-align: center; color: #f5f5f4; font-size: 14px; font-weight: 500; }
        .layer:last-child { border-bottom: 1px solid rgba(255,255,255,0.10); }
        .layer.gold { border-color: rgba(232,185,111,0.3); background: rgba(232,185,111,0.06); color: #F3C879; }
        .layer.muted { color: rgba(245,245,244,0.50); }
        .layer-arrow { text-align: center; color: rgba(232,185,111,0.40); font-size: 18px; padding: 2px 0; }

        .trace-flow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 32px; }
        .trace-node { border: 1px solid rgba(232,185,111,0.25); border-radius: 9999px; padding: 8px 16px; color: rgba(245,245,244,0.75); font-size: 12px; background: rgba(7,17,31,0.30); }
        .trace-arrow { color: rgba(232,185,111,0.40); font-size: 14px; }

        .jur-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 32px; }
        .jur-card { border: 1px solid rgba(255,255,255,0.10); padding: 20px; text-align: center; background: rgba(7,17,31,0.30); }
        .jur-title { color: #f5f5f4; font-size: 14px; font-weight: 500; margin-bottom: 4px; }
        .jur-desc { color: rgba(245,245,244,0.50); font-size: 11px; }

        .btv-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; }
        .btv-col { border: 1px solid rgba(255,255,255,0.10); padding: 32px; background: rgba(7,17,31,0.30); text-align: center; }
        .btv-label { color: #E8B96F; font-size: 16px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 12px; }
        .btv-desc { color: rgba(245,245,244,0.60); font-size: 13px; line-height: 1.5; }
        .btv-center { text-align: center; margin: 32px 0; font-size: 24px; font-weight: 400; color: #F3C879; }

        .status-panel { border: 1px solid rgba(232,185,111,0.2); padding: 28px; background: rgba(232,185,111,0.04); max-width: 600px; margin: 40px auto 0; text-align: center; }
        .status-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 12px; }
        .status-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .status-row:last-child { border-bottom: none; }
        .status-key { color: rgba(245,245,244,0.70); font-size: 14px; }
        .status-val { color: rgba(245,245,244,0.50); font-size: 14px; font-weight: 500; }

        .mtq-box { border: 1px solid rgba(255,255,255,0.10); padding: 40px; text-align: center; background: rgba(7,17,31,0.30); max-width: 700px; margin: 0 auto; }
        .mtq-label { color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.28em; text-transform: uppercase; margin-bottom: 16px; }
        .mtq-title { font-size: 28px; font-weight: 400; color: #f5f5f4; margin-bottom: 20px; }
        .mtq-desc { color: rgba(245,245,244,0.70); font-size: 16px; line-height: 1.6; }

        .cta-bg { position: relative; min-height: 500px; background: url("/assets/mithqal-about-hero.png") center center / cover no-repeat; display: flex; align-items: center; }
        .cta-bg::before { content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,6,17,0.88) 0%, rgba(0,6,17,0.50) 50%, rgba(0,6,17,0.30) 100%); }
        .cta-content { position: relative; z-index: 1; max-width: 1380px; margin: 0 auto; padding: 80px 6vw; width: 100%; }
        .divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 0; }
        .site-footer { border-top: 1px solid rgba(255,255,255,0.08); background: #000611; padding: 32px 6vw; text-align: center; color: rgba(245,245,244,0.40); font-size: 12px; }
        .footer-inner { max-width: 1380px; margin: 0 auto; }
        .footer-state { margin-top: 4px; color: rgba(232,185,111,0.40); }

        @media (max-width: 1200px) { .not-grid { grid-template-columns: repeat(3, 1fr); } .not-item:nth-child(4n) { border-right: 1px solid rgba(255,255,255,0.08); } .not-item:nth-child(3n) { border-right: none; } .commitments-grid { grid-template-columns: repeat(4, 1fr); } .commitment:nth-child(7n) { border-right: 1px solid rgba(255,255,255,0.08); } .jur-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 900px) { .site-header { height: 70px; } .header-inner { display: flex; justify-content: space-between; } .primary-nav { display: none; } .launch-btn { min-width: auto; height: 36px; padding: 0 15px; } .hero-grid { grid-template-columns: 1fr; } .hero-visual { min-height: 300px; } .two-col { grid-template-columns: 1fr; } .not-grid { grid-template-columns: repeat(2, 1fr); } .commitments-grid { grid-template-columns: repeat(2, 1fr); } .btv-grid { grid-template-columns: 1fr; } .jur-grid { grid-template-columns: 1fr; } .bridge { flex-direction: column; } }
        @media (max-width: 620px) { .launch-btn span:first-child { display: none; } .launch-btn { min-width: 44px; padding: 0 12px; } .not-grid { grid-template-columns: 1fr; } .commitments-grid { grid-template-columns: 1fr; } .trace-flow { flex-direction: column; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

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
