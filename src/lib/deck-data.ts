/**
 * Mithqal Investor Teaser Deck — slide content.
 * Distilled from the Mithqal v18 FINAL specification.
 * Pure content module; no client/server concerns.
 */

export type SlideTable = {
  /** Two-column spec/value rows. */
  rows: Array<[string, string]>;
};

export type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  body?: string;
  bullets?: string[];
  table?: SlideTable;
  footer?: string;
};

export const SLIDES: Slide[] = [
  {
    id: "cover",
    eyebrow: "Mithqal",
    title: "A constitutional settlement institution.",
    body: "Neutral. Fully reserved. Permanently non-platform.",
    footer: "Investor Teaser · Confidential · v18 FINAL",
  },
  {
    id: "thesis",
    eyebrow: "Thesis",
    title: "The T-bill of crypto settlement.",
    body: "A fully-reserved, neutral settlement unit for cross-border trade — boring, over-collateralised, and impossible to corrupt. That is the wedge USDT and USDC structurally cannot copy.",
  },
  {
    id: "problem",
    eyebrow: "Problem",
    title: "Settlement rails are not neutral.",
    bullets: [
      "Stablecoins carry platform, regulatory and counterparty risk.",
      "Reserves are lent, rehypothecated, or opaque.",
      "No settlement unit is governed by an immutable, auditable constitution.",
      "Institutions want finality + neutrality, not speculation.",
    ],
  },
  {
    id: "institution",
    eyebrow: "The Institution",
    title: "A monetary authority, not a platform.",
    bullets: [
      "Issues & redeems MTQ against verified reserves only.",
      "100%+ reserve mandate — reserves never lent or rehypothecated.",
      "No exchange, no brokerage, no DeFi, no lending — permanently.",
      "Complementary to sovereign currencies & CBDCs.",
    ],
  },
  {
    id: "invariants",
    eyebrow: "Constitutional Invariants",
    title: "Five rules that can never be broken.",
    bullets: [
      "100%+ reserve mandate",
      "No discretionary minting (no token sale, ever)",
      "No lending of reserves",
      "No commingling",
      "No redemption suspension",
    ],
    footer: "Priority 1 — not subject to override by any vote, referendum, or emergency.",
  },
  {
    id: "mtq",
    eyebrow: "The Unit",
    title: "One unit. Fully reserved. Always redeemable.",
    table: {
      rows: [
        ["Standard", "ERC-20 (Permit, Burnable, UUPS)"],
        ["Decimals", "18"],
        ["Supply", "Dynamic — mint on deposit, burn on redeem"],
        ["NAV", "Weighted reserve basket, bounded momentum"],
        ["Backing", "100%+ diversified eligible reserves"],
        ["Fees", "Mint 0.01–0.10% · Redeem 0.01–0.10% · Custody 0.05–0.20%/yr"],
      ],
    },
  },
  {
    id: "reserves",
    eyebrow: "Reserves",
    title: "Reserves always equal or exceed supply.",
    bullets: [
      "4-tier basket: cash/T-bills, sovereign bonds, allocated gold, strategic gold.",
      "Daily cryptographic Proof of Reserves.",
      "Quarterly independent audits.",
      "5-year independent constitutional review (9 experts).",
    ],
    footer: "Every claim verifiable from the public ledger.",
  },
  {
    id: "moat",
    eyebrow: "Moat",
    title: "Credibility you cannot fake.",
    bullets: [
      "An 850k-char, institution-grade Constitution.",
      "Permanently-frozen anti-platform clause.",
      "Founder capped at 20%; Constitution outlives founders.",
      "Neutrality by design — no political/jurisdictional alignment.",
      "ISO 20022 interoperable with existing banking rails.",
    ],
  },
  {
    id: "ask",
    eyebrow: "The Ask",
    title: "$250K–$1M pre-seed in Mithqal Labs (Entity B).",
    body: "Investment enters the for-profit operating company, not the monetary institution. MTQ is never sold. Use of funds: legal formation, testnet→mainnet, security audit + formal verification, anchor-partner pursuit.",
    bullets: [
      "Entity B equity — shares, options, normal governance.",
      "Targeting close in ~3 months.",
      "Follow-on: $3M–$8M Seed at institutional build stage.",
      "Non-dilutive ecosystem grants in parallel.",
    ],
  },
  {
    id: "status",
    eyebrow: "Status & Contact",
    title: "Blueprint locked. Building the institution.",
    bullets: [
      "Constitution v18 FINAL — published.",
      "GitHub + X live.",
      "Testnet dashboard live (simulator).",
      "Formation Committee convening — advisors, anchor, Council nominees sought.",
    ],
    footer: "x.com/MithqalMTQ · github.com/MITHQALMTQ · Formation Committee intake open.",
  },
];
