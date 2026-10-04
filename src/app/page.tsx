/**
 * MITHQAL — Reference-Faithful Landing Page
 *
 * This is a VISUAL RECONSTRUCTION of the supplied reference image.
 * All HTML/CSS/SVG is real DOM. The cinematic background is an image asset.
 *
 * BUILD_MODE = FROZEN — no backend changes.
 * productionAuthorized = false
 * institutionallyValidated = false
 * MTQ disabled by default.
 */

// ─── Inline SVG Icons (thin-line gold monoline) ─────────────────────
const BrainIcon = () => (
  <svg width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v15A2.5 2.5 0 0 0 9.5 22h5a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 14.5 2h-5Z" />
    <path d="M7 8H5.5A2.5 2.5 0 0 0 3 10.5v3A2.5 2.5 0 0 0 5.5 16H7" />
    <path d="M17 8h1.5A2.5 2.5 0 0 1 21 10.5v3a2.5 2.5 0 0 1-2.5 2.5H17" />
    <path d="M12 2v20" />
  </svg>
);

const FinanceIcon = () => (
  <svg width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 3v18h18" />
    <path d="M7 14l3-4 3 3 4-6" />
    <rect x="2" y="2" width="20" height="20" rx="0" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4Z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const NetworkIcon = () => (
  <svg width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M7 17l3-4M17 17l-3-4" />
  </svg>
);

const BoltIcon = () => (
  <svg width="43" height="43" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
);

// ─── Logo SVG (gold geometric M emblem) ─────────────────────────────
const MithqalLogo = () => (
  <svg width="39" height="39" viewBox="0 0 39 39" fill="none" aria-hidden="true">
    <path d="M19.5 3L34 11.5v16L19.5 36L5 27.5v-16L19.5 3Z" stroke="#E8B96F" strokeWidth="2" fill="none" />
    <path d="M19.5 10L27 14.5v10L19.5 29L12 24.5v-10L19.5 10Z" fill="#E8B96F" />
    <path d="M19.5 3V10M34 11.5L27 14.5M5 11.5L12 14.5M19.5 36V29" stroke="#E8B96F" strokeWidth="1.5" />
  </svg>
);

// ─── Data ───────────────────────────────────────────────────────────
const NAV_ITEMS = ["Home", "Features", "Ecosystem", "Roadmap", "About"];

const CAPABILITIES = [
  { icon: <BrainIcon />, title: "AI-Powered", desc: "Smarter decisions. Greater opportunities." },
  { icon: <FinanceIcon />, title: "DeFi & Finance", desc: "Build, earn, and grow with confidence." },
  { icon: <ShieldIcon />, title: "Digital Ownership", desc: "Your assets. Your control." },
  { icon: <NetworkIcon />, title: "Global Ecosystem", desc: "Connect. Collaborate. Create." },
  { icon: <BoltIcon />, title: "Built for the Future", desc: "Next-gen technology. Real-world impact." },
];

// ─── Component ─────────────────────────────────────────────────────
export default function Page() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body { margin: 0; min-height: 100%; }
        body { background: #000611; color: #f5f5f4; font-family: Inter, Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        a { color: inherit; text-decoration: none; }

        .site-header {
          position: absolute; inset: 0 0 auto 0; z-index: 50;
          height: 78px; border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,6,17,0.68); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .header-inner {
          height: 100%; max-width: 1380px; margin: 0 auto; padding: 0 6vw;
          display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 24px;
        }
        .brand { display: inline-flex; align-items: center; gap: 18px; justify-self: start; }
        .brand-wordmark { font-size: 27px; font-weight: 400; letter-spacing: 0.27em; line-height: 1; color: #f5f5f4; }
        .primary-nav { display: flex; align-items: center; justify-content: center; gap: 41px; }
        .nav-link { position: relative; padding: 30px 0 27px; color: rgba(245,245,244,0.86); font-size: 14px; font-weight: 400; transition: color 180ms ease; }
        .nav-link::after { content: ""; position: absolute; left: 0; right: 0; bottom: 18px; height: 1px; transform: scaleX(0); transform-origin: center; background: #E8B96F; transition: transform 180ms ease; }
        .nav-link:hover, .nav-link.active { color: #f5f5f4; }
        .nav-link.active::after { transform: scaleX(1); }
        .launch-btn {
          justify-self: end; min-width: 157px; height: 38px; padding: 0 20px;
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          border: 1px solid rgba(232,185,111,0.9); border-radius: 9999px; font-size: 14px; color: #f5f5f4;
          transition: background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
          background: transparent;
        }
        .launch-btn:hover { background: rgba(232,185,111,0.08); box-shadow: 0 0 24px rgba(232,185,111,0.10); transform: translateY(-1px); }

        .hero { position: relative; min-height: 100vh; overflow: hidden; background: #000611; }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background: url("/assets/mithqal-hero-background.png") center center / cover no-repeat;
        }
        .hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(90deg, rgba(0,6,17,0.88) 0%, rgba(0,6,17,0.58) 30%, rgba(0,6,17,0.16) 57%, rgba(0,6,17,0) 100%),
                      linear-gradient(180deg, rgba(0,6,17,0.32) 0%, rgba(0,6,17,0) 28%, rgba(0,6,17,0.02) 65%, rgba(0,6,17,0.86) 100%);
        }
        .hero-copy { position: absolute; z-index: 5; left: 90px; top: 188px; width: 610px; max-width: 50vw; }
        .eyebrow { display: flex; align-items: center; gap: 23px; color: #E8B96F; font-size: 12px; font-weight: 600; letter-spacing: 0.30em; text-transform: uppercase; }
        .eyebrow-line { width: 3px; height: 20px; display: inline-block; background: #E8B96F; }
        .hero h1 { margin: 30px 0 0; max-width: 650px; font-size: clamp(55px, 5vw, 74px); line-height: 0.99; font-weight: 400; letter-spacing: -0.047em; color: #f5f5f4; }
        .hero h1 span { display: block; }
        .hero h1 span:last-child { color: #F3C879; }
        .hero p { width: 565px; max-width: 50vw; margin: 39px 0 0; color: rgba(245,245,244,0.90); font-size: 18px; line-height: 1.53; }
        .actions { display: flex; gap: 19px; margin-top: 31px; }
        .actions a { height: 46px; padding: 0 29px; display: inline-flex; align-items: center; justify-content: center; gap: 10px; border-radius: 9999px; font-size: 14px; cursor: pointer; }
        .btn-primary { background: #E8B96F; color: #06080c; font-weight: 500; transition: transform 180ms ease, box-shadow 180ms ease; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 42px rgba(232,185,111,0.24); }
        .btn-secondary { border: 1px solid #E8B96F; color: #f5f5f4; background: rgba(0,0,0,0.18); transition: transform 180ms ease, background 180ms ease; }
        .btn-secondary:hover { transform: translateY(-2px); background: rgba(232,185,111,0.06); }

        .capabilities {
          position: absolute; z-index: 6; left: 90px; right: 85px; bottom: 39px;
          display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
        }
        .capability { min-height: 82px; display: grid; grid-template-columns: 47px 1fr; gap: 17px; padding: 0 32px; border-right: 1px solid rgba(255,255,255,0.22); }
        .capability:first-child { padding-left: 0; }
        .capability:last-child { padding-right: 0; border-right: 0; }
        .capability-icon { width: 43px; height: 43px; display: grid; place-items: center; color: #E8B96F; }
        .capability h2 { margin: 1px 0 7px; font-size: 16px; font-weight: 500; color: #f5f5f4; }
        .capability p { margin: 0; max-width: 180px; font-size: 12.5px; line-height: 1.55; color: rgba(245,245,244,0.74); }

        @media (max-width: 1200px) {
          .header-inner, .hero-copy, .capabilities { max-width: 1100px; padding-left: 0; padding-right: 0; }
          .hero-copy { left: 40px; }
          .capabilities { left: 40px; right: 40px; }
          .primary-nav { gap: 24px; }
          .hero h1 { font-size: clamp(50px, 6vw, 68px); max-width: 620px; }
          .capability { padding-left: 18px; padding-right: 18px; }
        }
        @media (max-width: 900px) {
          .site-header { height: 70px; }
          .header-inner { display: flex; justify-content: space-between; }
          .primary-nav { display: none; }
          .launch-btn { min-width: auto; height: 36px; padding: 0 15px; }
          .hero { min-height: 920px; }
          .hero-bg { background-position: 61% center; }
          .hero-copy { left: 24px; top: 150px; padding-bottom: 330px; }
          .hero h1 { font-size: clamp(45px, 8vw, 62px); max-width: 650px; }
          .hero p { max-width: 570px; }
          .capabilities { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 18px; left: 24px; right: 24px; }
          .capability { border-right: none; }
          .capability:nth-child(odd) { padding-left: 0; }
          .capability:nth-child(even) { padding-right: 0; }
        }
        @media (max-width: 620px) {
          .header-inner, .hero-copy, .capabilities { left: 18px; right: 18px; width: calc(100% - 36px); }
          .hero-copy { left: 18px; }
          .capabilities { left: 18px; right: 18px; }
          .brand { gap: 10px; }
          .brand-wordmark { font-size: 18px; letter-spacing: 0.21em; }
          .launch-btn span:first-child { display: none; }
          .launch-btn { min-width: 44px; padding: 0 12px; }
          .hero { min-height: 1060px; }
          .hero-bg { background-position: 69% center; }
          .hero-copy { top: 132px; padding-bottom: 430px; }
          .eyebrow { gap: 13px; margin-bottom: 24px; font-size: 9px; letter-spacing: 0.22em; }
          .hero h1 { font-size: clamp(39px, 11vw, 54px); line-height: 0.99; }
          .hero p { margin-top: 29px; font-size: 16px; line-height: 1.55; }
          .actions { flex-direction: column; align-items: stretch; gap: 12px; }
          .actions a { width: 100%; }
          .capabilities { grid-template-columns: 1fr; row-gap: 13px; }
          .capability { grid-template-columns: 41px 1fr; min-height: auto; padding: 11px 0 !important; border-bottom: 1px solid rgba(255,255,255,0.13); }
          .capability:last-child { border-bottom: none; }
          .capability p { max-width: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="/" aria-label="MITHQAL home">
            <MithqalLogo />
            <span className="brand-wordmark">MITHQAL</span>
          </a>
          <nav className="primary-nav" aria-label="Primary navigation">
            <a className="nav-link active" href="/">Home</a>
            <a className="nav-link" href="/#features">Features</a>
            <a className="nav-link" href="/#ecosystem">Ecosystem</a>
            <a className="nav-link" href="/#roadmap">Roadmap</a>
            <a className="nav-link" href="/#about">About</a>
          </nav>
          <a className="launch-btn" href="/#platform">
            <span>Launch App</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-bg" aria-hidden="true" />
          <div className="hero-overlay" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>THE INTELLIGENCE LAYER FOR A NEW ECONOMY</span>
            </div>
            <h1 id="hero-title">
              Your Digital Capital.
              <span>Unified. Intelligent.</span>
              <span>Limitless.</span>
            </h1>
            <p>
              Mithqal is the next-generation platform for AI, finance, and digital ownership — built for creators, investors, and visionaries who see beyond.
            </p>
            <div className="actions">
              <a className="btn-primary" href="/#platform">Get Started →</a>
              <a className="btn-secondary" href="/#ecosystem">Explore Ecosystem</a>
            </div>
          </div>
          <div className="capabilities">
            {CAPABILITIES.map((cap, i) => (
              <div className="capability" key={i}>
                <div className="capability-icon">{cap.icon}</div>
                <div>
                  <h2>{cap.title}</h2>
                  <p>{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
