// Mithqal public institutional site — content distilled from the v18 FINAL
// Consolidated Implementation Specification. This is the credibility-layer
// copy that faces investors, advisors, anchor participants and the public.

/* ---- What Mithqal is (institutional identity) ---- */
export const IDENTITY = {
  name: "Mithqal",
  unit: "MTQ",
  tagline: "A constitutional settlement institution.",
  lede:
    "Mithqal is a neutral, fully-reserved settlement infrastructure for international trade. It is not a token, a platform, a bank, or a DeFi protocol. It is a monetary institution — governed by an immutable Constitution that outlives its founders, its technology and the markets.",
  not: [
    "Not a bank, exchange, or payment processor",
    "Not a speculative asset or DeFi protocol",
    "Not dependent on any specific blockchain",
    "Not a replacement for sovereign currencies",
  ],
  is: [
    "A constitutional monetary institution",
    "A fully-reserved settlement unit (MTQ)",
    "Complementary to sovereign currencies & CBDCs",
    "Infrastructure for banks and trade-finance platforms",
  ],
};

/* ---- Six constitutional objectives (Article I) ---- */
export const OBJECTIVES = [
  {
    n: "01",
    t: "Monetary Integrity",
    d: "Stable purchasing power, anchored to a diversified basket of real assets. No discretionary expansion.",
  },
  {
    n: "02",
    t: "Full Redeemability",
    d: "Every MTQ is fully backed and redeemable for proportional reserves at any time. No discretionary approval.",
  },
  {
    n: "03",
    t: "Reserve Solvency",
    d: "Reserves always equal or exceed supply. Held in custody, never lent or rehypothecated. 100%+ by invariant.",
  },
  {
    n: "04",
    t: "Neutral Cross-border Settlement",
    d: "No political, economic or jurisdictional alignment. A Chinese exporter settles with the same finality as a US exporter.",
  },
  {
    n: "05",
    t: "Institutional Trust",
    d: "Earned through verifiable operations — daily proofs of reserves, quarterly independent audits. Never declared.",
  },
  {
    n: "06",
    t: "Constitutional Stability",
    d: "The framework endures beyond technology, markets and founders. Amendable only through supermajority.",
  },
];

/* ---- The five constitutional invariants (Priority 1, Article III) ---- */
export const INVARIANTS_PUBLIC = [
  {
    t: "100%+ Reserve Mandate",
    d: "Reserve value must always equal or exceed circulating supply. Minting is permitted only upon verified deposit of equivalent value.",
  },
  {
    t: "No Discretionary Minting",
    d: "MTQ is never minted for operational funding, staff compensation, or any purpose other than verified reserve deposits.",
  },
  {
    t: "No Lending of Reserves",
    d: "Reserves are held in custody. They are never lent, rehypothecated, or used to generate yield.",
  },
  {
    t: "No Commingling",
    d: "Settlement reserves are segregated from all operational, commercial and yield-bearing activities — permanently.",
  },
  {
    t: "No Redemption Suspension",
    d: "Redemption is never suspended or subject to discretionary approval. Dynamic congestion fees may apply, but the right to redeem is absolute.",
  },
];

/* ---- Anti-platform clause (Article V) — permanently frozen ---- */
export const ANTI_PLATFORM = {
  intro:
    "The Institution is a monetary authority, not a commercial platform. The anti-platform provisions are permanently frozen — they cannot be amended, interpreted away, or eroded through incremental expansion.",
  prohibited: [
    "Lending, credit & underwriting",
    "Exchange, brokerage & market-making",
    "Asset & wealth management",
    "Custody of participant funds",
    "Decentralized finance protocols",
    "Trade-matching & logistics platforms",
    "Dispute resolution & arbitration",
  ],
  permitted: [
    "Issue & redeem settlement units",
    "Maintain reserves in custody",
    "Govern the institution",
    "Publish transparency data",
    "Support interoperability (ISO 20022)",
    "Maintain technical infrastructure",
    "Comply with applicable law",
  ],
};

/* ---- The Settlement Unit (MTQ) ---- */
export const MTQ_SPEC = [
  { k: "Standard", v: "ERC-20 with extensions (Permit, Burnable)" },
  { k: "Decimals", v: "18 (micro-settlement precision)" },
  { k: "Total Supply", v: "Dynamic — mint/burn on reserve deposits" },
  { k: "Transferability", v: "Permissionless" },
  { k: "Pausability", v: "Yes (emergency only)" },
  { k: "Upgradeability", v: "UUPS proxy" },
  { k: "Backing", v: "100%+ diversified eligible reserves" },
  { k: "NAV", v: "Weighted basket, bounded momentum, mean reversion" },
];

export const FEES = [
  { type: "Minting", rate: "0.01–0.10%", method: "Deducted from minted amount", purpose: "Operational costs" },
  { type: "Redemption", rate: "0.01–0.10%", method: "Deducted from claim", purpose: "Operational costs" },
  { type: "Transfer", rate: "0.00–0.05%", method: "Deducted from transfer", purpose: "Network maintenance" },
  { type: "Custody", rate: "0.05–0.20% / yr", method: "Deducted from reserves", purpose: "Custody costs" },
];

/* ---- Reserves ---- */
export const RESERVE_TIERS = [
  {
    tier: "Tier 1",
    name: "Primary",
    weight: "≥ 60%",
    assets: "Cash at central banks, T-bills, central-bank reserves",
    quality: "Sovereign-grade, instantaneous liquidity",
  },
  {
    tier: "Tier 2",
    name: "Secondary",
    weight: "20–35%",
    assets: "G7 sovereign bonds, supranational instruments",
    quality: "High-grade, daily liquidity",
  },
  {
    tier: "Tier 3",
    name: "Tertiary",
    weight: "0–15%",
    assets: "Gold (allocated), high-grade money-market instruments",
    quality: "Diversification & collateral",
  },
  {
    tier: "Tier 4",
    name: "Strategic",
    weight: "0–10%",
    assets: "Physical gold, strategic reserve assets",
    quality: "Long-term preservation",
  },
];

export const TRANSPARENCY = [
  { cadence: "Daily", item: "Cryptographic Proof of Reserves", desc: "Privacy-preserving solvency proof" },
  { cadence: "Daily", item: "Reserve Summary", desc: "Aggregate reserve data" },
  { cadence: "Quarterly", item: "Independent Audit", desc: "Full reserve verification" },
  { cadence: "Annual", item: "Comprehensive Report", desc: "Complete reserve review" },
  { cadence: "5 years", item: "Independent Review", desc: "9-expert panel constitutional review" },
];

/* ---- Governance ---- */
export const GOVERNANCE = [
  {
    t: "The Council",
    d: "The principal governing body. Makes policy decisions within constitutional constraints. Appoints committees and officers.",
  },
  {
    t: "Risk Committee",
    d: "Volatility thresholds, liquidity thresholds, concentration limits, stress tests.",
  },
  {
    t: "Technical Committee",
    d: "Smart contracts, cryptography, post-quantum migration (Falcon-512), formal verification.",
  },
  {
    t: "Audit Committee",
    d: "Oversees independent audits and proofs of reserves.",
  },
  {
    t: "Compliance Committee",
    d: "Sanctions (OFAC, UN, EU, UK, MAS, UAE), KYC/KYB, reporting, monitoring.",
  },
  {
    t: "Independent Review Panel",
    d: "9 independent experts (3 economists, 3 technologists, 3 lawyers). Convened every 5 years. Assesses the entire institution.",
  },
];

export const GOVERNANCE_RULES = [
  { k: "Founder holdings cap", v: "≤ 20% of circulating supply" },
  { k: "Founder voting rights", v: "Limited / constrained" },
  { k: "Constitutional amendments", v: "Supermajority only; invariants never" },
  { k: "Anti-platform clause", v: "Permanently frozen" },
  { k: "Neutrality", v: "Absolute, except legal compliance" },
];

/* ---- Institutional Lifecycle (Article XIV) ---- */
export const LIFECYCLE = [
  { stage: "Formation", gov: "Formation Committee", d: "Foundation registered, Council appointed, reserves deposited, custody established.", status: "current" },
  { stage: "Operation", gov: "Normal governance", d: "Ordinary settlement operations, reserve management, governance continues.", status: "next" },
  { stage: "Expansion", gov: "Normal governance", d: "Grow participants, integrate CBDCs (Digital Dirham → mBridge → Digital Euro/Yuan/Dollar).", status: "future" },
  { stage: "Emergency", gov: "Limited governance", d: "Preserve the Institution under stress — emergency custodian, time-limited.", status: "future" },
  { stage: "Resolution", gov: "Resolution Committee", d: "Orderly wind-down if ever required — holder protection first.", status: "future" },
  { stage: "Succession", gov: "Governed transition", d: "The Institution persists beyond founders and personnel.", status: "future" },
];

/* ---- Eligibility (who Mithqal serves) ---- */
export const ELIGIBILITY = [
  { who: "Commercial banks", why: "Integrate MTQ for neutral, fully-reserved cross-border settlement." },
  { who: "Trade-finance platforms", why: "Settle invoices with finality, neutrality and verifiable backing." },
  { who: "Corporate treasuries", why: "Neutral reserve asset for international trade hedging." },
  { who: "Payment institutions", why: "Bridge to existing rails via ISO 20022 messaging." },
  { who: "Sovereign & development finance", why: "Neutral settlement layer complementary to CBDCs." },
];

export const INTEGRATION = [
  { step: "01", t: "Eligibility", d: "Meet objective institutional criteria (KYB, sanctions, financial standing)." },
  { step: "02", t: "Onboarding", d: "KYC/KYB, UBO identification, enhanced due diligence, sanctions screening." },
  { step: "03", t: "Custody & reserves", d: "Establish segregated reserve custody with a qualified custodian." },
  { step: "04", t: "Mint", d: "Deposit eligible reserves → verified → MTQ minted at NAV." },
  { step: "05", t: "Settle", d: "Transfer MTQ permissionlessly; settle via ISO 20022 messaging." },
  { step: "06", t: "Redeem", d: "Burn MTQ → receive proportional reserves at NAV, any time." },
];

/* ---- Build-in-public status ---- */
export const STATUS_ITEMS = [
  { label: "Constitution", value: "v18 FINAL", state: "Published", tone: "done" },
  { label: "Specification", value: "850k chars", state: "Public", tone: "done" },
  { label: "GitHub", value: "Live", state: "Open", tone: "done" },
  { label: "Testnet (MTQ)", value: "In development", state: "Phase 0", tone: "next" },
  { label: "Foundation entity", value: "Formation Committee convening", state: "Phase 0", tone: "next" },
  { label: "Qualified custody", value: "RFP pending", state: "Phase 1", tone: "next" },
  { label: "Independent audit", value: "Scheduled", state: "Phase 1", tone: "next" },
  { label: "Mainnet launch", value: "Planned", state: "Phase 3", tone: "future" },
];

export const FORMATION_ROLES = [
  { v: "investor", label: "Investor (pre-seed / seed)" },
  { v: "advisor", label: "Advisor (ex-central-bank, custody, trade-finance, compliance)" },
  { v: "anchor", label: "Anchor participant (bank / trade-finance platform)" },
  { v: "council-nominee", label: "Council nominee" },
  { v: "partner", label: "Integration / technology partner" },
  { v: "other", label: "Other" },
];
