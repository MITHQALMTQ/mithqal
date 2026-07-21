// Mithqal Strategic Execution Playbook — structured data
// Authored from the v18 FINAL Consolidated Implementation Specification.

export const STATUS = {
  have: [
    { label: "Blueprint v18 — FINAL", note: "Full constitutional specification (reserves, governance, compliance, post-quantum, lifecycle)" },
    { label: "GitHub repository", note: "github.com/MITHQALMTQ/mithqal" },
    { label: "X / Twitter presence", note: "@MithqalMTQ" },
    { label: "Founder conviction", note: "Zero budget, full commitment" },
  ],
  missing: [
    { label: "Legal entity (none)", note: "No company, no Foundation, no operating co" },
    { label: "Team (none)", note: "No co-founders, no advisors of record, no Council" },
    { label: "Capital ($0)", note: "No runway, no custody, no audits" },
    { label: "Working testnet (none)", note: "Specification only — no live MTQ contract" },
  ],
};

export const INVARIANTS = [
  { k: "No token sale", v: "Selling unbacked MTQ violates the 100% reserve mandate and the anti-platform clause. The entire ICO/IDO/IEO playbook is forbidden — permanently." },
  { k: "No discretionary minting", v: "MTQ is minted ONLY against a verified deposit of equivalent reserve value. Not for fundraising, ops, or team pay. Ever." },
  { k: "No lending / no rehypothecation", v: "Reserves are held in custody, never lent or reused. Mithqal cannot earn treasury yield on settlement reserves." },
  { k: "No platform / no yield", v: "No exchange, no brokerage, no DeFi, no retail product. Yield must live in a SEPARATE legal entity that never touches MTQ." },
  { k: "Founder cap 20%", v: "Founder + affiliates cannot hold >20% of circulating supply, with constrained voting. Designed to outlive the founder." },
];

export const ENTITIES = [
  {
    tag: "A",
    name: "The Institution — Mithqal Foundation",
    type: "Non-profit / neutral monetary authority",
    purpose: "Holds the Constitution, the Council, reserve custody and the settlement contracts. Mints/redeems MTQ. This is the neutral rail — it cannot distribute profit or take equity investment without destroying neutrality.",
    fundedBy: "Initial reserve deposits from participants + ongoing fees + grants/donations",
    raiseHere: false,
  },
  {
    tag: "B",
    name: "The Operating Company — Mithqal Labs",
    type: "For-profit engineering & services company",
    purpose: "Builds and maintains the technology for the Institution under contract; provides engineering, compliance tooling and integration services. This is the equity vehicle — where investors take shares and where team options live.",
    fundedBy: "Pre-seed / Seed / Strategic equity + services revenue from the Institution",
    raiseHere: true,
  },
  {
    tag: "C",
    name: "The Yield Vehicle (later)",
    type: "Separate regulated investment fund",
    purpose: "Optional, constitutionally-separated vehicle for institutional investors seeking yield. Never holds, lends or uses MTQ. Fully separate governance, audit and balance sheet. Stage 4+ only.",
    fundedBy: "Institutional LP subscriptions (fiat only)",
    raiseHere: false,
  },
];

export const PHASES = [
  {
    id: "p0",
    n: "Phase 0",
    title: "Formation & Credibility",
    window: "Months 0–3",
    capital: "$0 (sweat equity)",
    goal: "Convert the blueprint into a Term-Sheet-ready narrative + a live testnet + a Formation Committee candidate list.",
    milestones: [
      "Operating company (Entity B) incorporated — low-cost jurisdiction",
      "Constitution published publicly (github.io docs site)",
      "MTQ testnet contract live (mint/burn/PoR stub) on a public testnet",
      "3–5 heavyweight advisors recruited on deferred/sweat terms",
      "Investor data room open; pre-seed outreach begun",
    ],
    kpi: "10 qualified investor conversations, 1 soft-circle commitment, testnet live",
    raise: "Target: $250K–$1M pre-seed (close in Phase 1)",
  },
  {
    id: "p1",
    n: "Phase 1",
    title: "Pre-Seed Close",
    window: "Months 3–6",
    capital: "$250K–$1M",
    goal: "Close pre-seed in Entity B. Fund the legal formation of the Institution (Entity A) and the first institutional-grade engineering.",
    milestones: [
      "Pre-seed SAFE/round closed in Entity B",
      "Foundation (Entity A) legally formed in a reputable jurisdiction",
      "Qualified-custodian RFP issued; 2–3 custody LOIs",
      "Core engineering: mainnet-ready MTQ contract + formal verification (Certora)",
      "First independent security audit booked",
      "Formation Committee formally proposed (per Constitution Stage 1)",
    ],
    kpi: "Pre-seed closed; Foundation registered; audit scheduled",
    raise: "Closed $250K–$1M @ founder-friendly valuation",
  },
  {
    id: "p2",
    n: "Phase 2",
    title: "Formation Committee + Anchor",
    window: "Months 6–12",
    capital: "Pre-seed runway + in-kind anchor",
    goal: "Sign ONE credible anchor participant (design-partnership / reserve MOU). This is the single most important milestone — it converts Mithqal from idea to institution.",
    milestones: [
      "Formation Committee seated; Council nominee slate published",
      "Anchor MOU signed (trade-finance platform / regional bank / commodity house)",
      "Sanctions/KYC/KYB compliance stack operational (OFAC/UN/EU/UK/MAS/UAE)",
      "ISO 20022 messaging adapter delivered",
      "Independent audit #1 complete + published",
      "Bug bounty program launched",
    ],
    kpi: "1 signed anchor; published audit; live PoR on testnet→mainnet prep",
    raise: "Seed round structure being shaped; strategic lead identified",
  },
  {
    id: "p3",
    n: "Phase 3",
    title: "Seed — Institutional Build",
    window: "Months 12–18",
    capital: "$3M–$8M (Seed)",
    goal: "Led by a strategic (sovereign-adjacent fund / fintech VC / blockchain foundation). Finalize licensing, institutional custody, full mainnet launch.",
    milestones: [
      "Seed round closed in Entity B ($3M–$8M)",
      "Regulatory licensing secured (target: ADGM / DIFC given Digital Dirham priority)",
      "Institutional qualified custody live (segregated, insured, multi-jurisdiction)",
      "Mainnet MTQ launched with live Proof-of-Reserves (daily)",
      "Council fully constituted; Independent Review Panel nominated",
      "Post-quantum roadmap Phase 1 (Falcon-512 integration) underway",
    ],
    kpi: "Seed closed; licensed; mainnet live with daily PoR",
    raise: "$3M–$8M Seed",
  },
  {
    id: "p4",
    n: "Phase 4",
    title: "Go-Live & Scale",
    window: "Months 18–30",
    capital: "Seed + first fee revenue",
    goal: "First real reserve deposit → first MTQ mint → first settlement. Onboard participants 2–N. Revenue begins. Begin the climb to #1.",
    milestones: [
      "First institutional reserve deposit verified → first MTQ minted",
      "First cross-border settlement executed end-to-end",
      "mBridge / Digital Dirham integration path opened (per roadmap)",
      "5–10 settling participants onboarded",
      "First quarterly Independent Review published",
      "Path to profitability mapped from fee revenue",
    ],
    kpi: "MTQ supply outstanding, # settling participants, daily settlement volume, reserve ratio ≥100%",
    raise: "Revenue-generating; Series A optional at $15M+",
  },
];

export const SPRINT: { week: string; focus: string; tasks: string[] }[] = [
  {
    week: "Week 1–2",
    focus: "Lock the IP & narrative",
    tasks: [
      "Version-lock the blueprint; create a 1-page executive teaser + 10-slide teaser deck",
      "Write the canonical one-paragraph positioning (institutional settlement, NOT a token)",
      "Register mithqal.{io,com,org,net} domains + branded email",
      "Pin a public Constitution manifest on GitHub",
    ],
  },
  {
    week: "Week 3–4",
    focus: "Stand up the legal & brand shell",
    tasks: [
      "Incorporate Entity B (Operating Co) — lowest-friction reputable jurisdiction",
      "Draft the Foundation (Entity A) formation plan + jurisdiction memo (ADGM/DIFC/Liechtenstein/Stiftung)",
      "Launch a real institutional website (docs + constitution + status)",
      "Establish X cadence: constitutional literacy, reserve-first principles, anti-hype",
    ],
  },
  {
    week: "Week 5–6",
    focus: "Publish the Constitution",
    tasks: [
      "Publish the full v18 specification as a versioned, citable docs site",
      "Open-source the testnet contract scaffold on GitHub",
      "Publish the reserve policy, fee schedule, and governance map",
      "Open a public 'Formation Committee' interest form",
    ],
  },
  {
    week: "Week 7–8",
    focus: "Testnet MVP",
    tasks: [
      "Deploy MTQ ERC-20 on a public testnet (mint/burn/PoR stub/NAV oracle stub)",
      "Ship a read-only dashboard: supply, reserve ratio, NAV",
      "Record a 5-min demo walkthrough",
      "Pin reproducible build instructions",
    ],
  },
  {
    week: "Week 9–10",
    focus: "Recruit the credibility layer",
    tasks: [
      "Approach 3–5 named advisors (ex-central bank, ex-custody, trade-finance, crypto compliance)",
      "Secure first advisor LOIs on deferred/equity terms",
      "Open the investor data room (blueprint, teaser, testnet, roadmap, cap table)",
      "Draft the pre-seed SAFE / term sheet",
    ],
  },
  {
    week: "Week 11–12",
    focus: "Pre-seed outreach",
    tasks: [
      "Build a target list: MENA family offices, crypto-native angels, Ethereum ecosystem grants",
      "Run 15–20 first meetings; log objections, refine narrative",
      "Convert 3–5 to a second meeting with the data room",
      "Pursue ≥1 ecosystem grant application (non-dilutive)",
    ],
  },
  {
    week: "Week 13",
    focus: "Term sheet target",
    tasks: [
      "Push for 1–2 soft-circled commitments",
      "Negotiate first term sheet (founder-friendly, Entity B equity)",
      "Schedule Formation Committee convening for the week of close",
      "Publish a public status update (build in public, constitutionally)",
    ],
  },
];

export const FUNDING_SOURCES = [
  { who: "MENA family offices", why: "Geographic alignment with Digital Dirham priority; appetite for gold/reserve narratives; relationship-driven", ticket: "$50K–$500K", dilution: "Equity (Entity B)" },
  { who: "Crypto-native strategic angels", why: "Understand reserve-backed models; can move fast; bring network + credibility", ticket: "$25K–$250K", dilution: "Equity (Entity B)" },
  { who: "Ecosystem grants (Ethereum / L2 / foundations)", why: "Non-dilutive; validates technical seriousness; funds audits + formal verification", ticket: "$25K–$300K", dilution: "None (grant)" },
  { who: "Sovereign-adjacent / development finance", why: "Long-horizon capital; trade-settlement mandate alignment; later stage", ticket: "$1M–$5M", dilution: "Equity (Entity B), Seed+" },
  { who: "Anchor participant (in-kind)", why: "First reserve depositor + design partner — converts idea to institution", ticket: "MOU + first deposit", dilution: "Strategic / commercial" },
  { who: "Fee revenue (self-sustaining)", why: "Mint/redeem/transfer/custody fees per Constitution — the end state", ticket: "Recurring", dilution: "None" },
];

export const RISKS = [
  { risk: "Mis-positioned as a retail crypto token", impact: "Regulatory disaster; constitutional violation", mitigation: "Institutional-settlement framing enforced everywhere; anti-platform invariants frozen; no retail on-ramp." },
  { risk: "Founder single-point-of-failure", impact: "Institution collapses if founder stops", mitigation: "Formation Committee + Council + 20% founder cap; Constitution outlives the founder by design." },
  { risk: "No qualified custody partner", impact: "Cannot hold reserves; cannot launch", mitigation: "Anchor partnership + qualified-custodian RFP in Phase 1; multi-custody redundancy." },
  { risk: "Unlicensed money transmission", impact: "Enforcement action; shutdown", mitigation: "Licensing roadmap (ADGM/DIFC); external legal opinion; institutional-only access; sanctions stack." },
  { risk: "Audit / formal-verification cost", impact: "Delayed launch; credibility gap", mitigation: "Phased: testnet stub → grant-funded Certora + audit in Phase 1; bug bounty in Phase 2." },
  { risk: "Incumbents (USDT/USDC)", impact: "Drowned out; no adoption", mitigation: "Differentiate on full reserve + constitution + neutrality — the wedge USDT/USDC structurally cannot copy." },
  { risk: "Reserve custodial loss", impact: "Insolvency; trust destroyed", mitigation: "Segregated, insured, multi-jurisdiction custody; emergency protocols; insurance." },
  { risk: "Liquidity bootstrap (chicken-egg)", impact: "No first deposit; no supply", mitigation: "Anchor participant first (Phase 2); settlement utility > speculative liquidity." },
];

export const MOAT = [
  { title: "Constitutional credibility", body: "An 850k-char, institution-grade Constitution that most rivals cannot match. Credibility is the product." },
  { title: "Verifiable 100%+ reserves", body: "Daily cryptographic Proof-of-Reserves + quarterly independent audits. Reserves always ≥ supply, by invariant." },
  { title: "Anti-platform permanence", body: "The 'cannot be corrupted' guarantee is permanently frozen — the structural moat against drift that every commercial stablecoin lacks." },
  { title: "Institutional governance", body: "Council + Independent Review Panel + published decision trail. Designed to be trusted by banks, not flippers." },
  { title: "Neutrality by design", body: "No political, jurisdictional or monetary-policy alignment. Complementary to sovereign currencies, not competitive." },
];

export const POSITIONING = {
  not: [
    "a token to trade or flip",
    "a DeFi protocol or yield farm",
    "a 'better USDT' for retail",
    "a world-reserve-currency replacement",
    "a speculation vehicle",
  ],
  is: [
    "a constitutional settlement institution",
    "the neutral, fully-reserved rail for cross-border trade",
    "complementary to sovereign currencies & CBDCs",
    "infrastructure for banks and trade-finance platforms",
    "the T-bill of crypto settlement — boring, neutral, over-collateralised",
  ],
};

export const NEXT_ACTIONS = [
  { d: "Today", t: "Version-lock the blueprint and write the 1-paragraph positioning + 1-page teaser" },
  { d: "This week", t: "Buy domains, set up branded email, incorporate Entity B (Operating Co)" },
  { d: "This week", t: "Publish the Constitution as a citable docs site; pin on GitHub" },
  { d: "Week 2", t: "Stand up the institutional website (docs + status + governance map)" },
  { d: "Week 2–3", t: "Deploy the MTQ testnet contract + read-only reserve dashboard" },
  { d: "Week 3–4", t: "Open advisor conversations (ex-central-bank, custody, trade-finance, compliance)" },
  { d: "Week 4", t: "Open the investor data room; draft the pre-seed SAFE" },
  { d: "Week 5+", t: "Begin pre-seed outreach: MENA family offices, crypto angels, ecosystem grants" },
];
