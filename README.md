# Mithqal — Constitutional Monetary Institution

> A constitutional, 100%+ reserved, gold-disciplined, Sharia-compliant settlement infrastructure for international trade.
>
> **One Currency. Every Trade.**

**Website:** [mithqal.io](https://mithqal.io) · **X:** [@MithqalMTQ](https://x.com/MithqalMTQ) · **Docs:** [Constitution](https://mithqal.io/?view=constitution)

---

## Core Principles

- **100%+ Reserves** — every unit is fully backed
- **No Discretionary Minting** — supply is demand-driven (no token sale, ever)
- **Gold Discipline** — self-cleansing hard money mechanism
- **Sharia Compliance** — Sharia-compliance framework specified (Constitution §49); AAOIFI-certified scholars to be retained
- **Anti-Platform** — the Institution operates no commercial services
- **Neutrality** — no political, economic, or jurisdictional alignment

## Architecture

- **Single Settlement Token** (MTQ)
- **Separate Yield Vehicle** for institutional investors
- **Physical Gold Redemption** (1 kg minimum)
- **ISO 20022** interoperability
- **10-minute soft finality, 7-day hard finality**
- **9 Protocol Smart Contracts** + **1 Safe Multi-Signature Treasury** (Gnosis Safe) + **1 Deployment Wallet** (EOA) = 11 on-chain addresses on Monad Testnet (Chain ID 10143). See [`docs/contracts/CONTRACT_REGISTRY.md`](docs/contracts/CONTRACT_REGISTRY.md) for the authoritative registry.

## Repository Structure

```
.
├── docs/
│   ├── blueprint/                 # The complete v19.0 specification
│   │   ├── blueprint.txt           #   Full text (28,456 lines)
│   │   ├── v19-implementation-addendum.md
│   │   ├── executive-summary.md
│   │   └── one-pager.md
│   ├── contracts/
│   │   └── CONTRACT_REGISTRY.md    # Authoritative smart contract registry
│   ├── evidence/
│   │   ├── EVIDENCE_CLASSIFICATION.md  # 6-level evidence standard
│   │   ├── EVIDENCE_LEDGER.md          # 42-entry evidence ledger
│   │   └── INSTITUTIONAL_READINESS_MATRIX.md  # 10-dimension readiness
│   ├── verification/              # 15+ internal verification reports
│   └── whitepaper.md
├── src/
│   ├── contracts/                 # Smart contract source (Solidity)
│   │   ├── core/MTQ.sol           #   The settlement token
│   │   ├── core/Mint.sol, Redeem.sol, Reserve.sol, Algorithm.sol
│   │   ├── governance/Governance.sol, Takaful.sol
│   │   └── oracle/Oracle.sol, MockOracle.sol
│   ├── app/                       # Next.js 16 App Router (institutional web app)
│   │   ├── api/                    #   33 API routes (formation-interest, transparency, testnet, admin, auth, ...)
│   │   ├── page.tsx                #   7-view toggle
│   │   ├── layout.tsx              #   Metadata, fonts, SessionProvider
│   │   ├── sitemap.ts · robots.ts · not-found.tsx
│   ├── components/                 #   institution, transparency, constitution, testnet, deck, playbook, admin
│   ├── lib/                        #   auth.ts, db.ts, testnet-engine.ts, constitution-data.ts, monetary-engine-v19.ts
│   └── hooks/                      #   use-notify.ts (WebSocket), use-toast.ts
├── foundry/                        # Solidity test suite (10 .t.sol files) + Certora CVL specs
├── mini-services/
│   └── notify-service/             # Real-time notification relay (socket.io, port 3003)
├── prisma/                          # Database schema
└── README.md
```

## The Working Surface

The Next.js application exposes seven views — the public-facing institutional surfaces, the investor artifacts, and the operator's internal tooling:

| View | Audience | Purpose |
|---|---|---|
| **Institution** | Public | The credibility site + Formation Committee intake |
| **Transparency** | Public | Live state — verifiable operations, build in public |
| **Constitution** | Public | The citable v19.0 spec (47 articles across 5 layers) |
| **Testnet** | Technical investors | Live reserve simulator (mint/redeem/PoR/NAV) |
| **Deck** | First-meeting investors | 10-slide teaser → downloadable PDF |
| **Playbook** | Internal | The A-to-Z strategic execution plan |
| **Admin** | Operator (auth-gated) | Pipeline + live notifications + CSV export |

## Five Invariants (permanently frozen)

1. **100%+ reserve mandate** — reserves always equal or exceed supply
2. **No discretionary minting** — MTQ is minted only on verified deposit
3. **No lending of reserves** — held in custody, never rehypothecated
4. **No commingling** — settlement reserves are segregated from all operational activity
5. **No redemption suspension** — the right to redeem is absolute

## Evidence & Verification

This repository uses evidence-based language. Every institutional claim is classified using the [Evidence Classification Standard](docs/evidence/EVIDENCE_CLASSIFICATION.md) at one of six levels: **PROVEN**, **SUPPORTED**, **PARTIALLY SUPPORTED**, **PENDING EXTERNAL VALIDATION**, **UNVERIFIED**, or **FALSE**.

Key resources:

- [**Smart Contract Registry**](docs/contracts/CONTRACT_REGISTRY.md) — authoritative enumeration of the 9 Protocol Smart Contracts + 1 Safe Multi-Sig Treasury + 1 Deployment Wallet (EOA) on Monad Testnet.
- [**Evidence Ledger**](docs/evidence/EVIDENCE_LEDGER.md) — 42-entry ledger mapping every material institutional claim to its blueprint article, implementation files, tests, mathematical proof (if any), runtime evidence, status, source, date, and reviewer.
- [**Institutional Readiness Matrix**](docs/evidence/INSTITUTIONAL_READINESS_MATRIX.md) — 10-dimension readiness summary (Technical, Mathematical, Security, Governance, Documentation, Operational, Legal, Regulatory, Commercial, Institutional) with status, evidence, owner, next milestone, and blocking items.
- [**Independent Evidence Audit**](docs/verification/independent-evidence-audit.md) — hostile evidence-based audit (E036 "10 contracts" claim now RESOLVED).

### Current Status (evidence-based)

- **Internally validated for testnet deployment.**
- **Pending external validation for mainnet.**
- Mainnet is gated on: (1) Big-4 audit, (2) legal opinion, (3) Certora execution, (4) multi-custodian diversification, (5) Constitutional Council formation.
- **No claim of third-party certification is made where none exists.**
- Certora CVL specification completed; formal verification execution pending.
- Foundry test suite exists (10 test files); test execution requires `forge` installation in the audit environment.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript 5 |
| Styling | Tailwind CSS 4 · shadcn/ui (New York) · Lucide icons |
| Database | Prisma ORM · SQLite (Turso in production) |
| Auth | NextAuth.js v4 (credentials provider, JWT sessions, scrypt) |
| Real-time | WebSocket mini-service (socket.io, port 3003) |
| Contracts | Solidity (9 Protocol Smart Contracts: MTQ, Mint, Redeem, Reserve, Algorithm, Governance, Takaful, Oracle, MockOracle) |
| Formal verification | Certora Prover 8.18.0 (CVL spec complete; execution pending) + Foundry 1.7.1 + Slither 0.11.6 + Halmos 0.3.3 |
| Fonts | Fraunces (display) · Geist (sans) |

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env
# Fill in NEXTAUTH_SECRET, NEXTAUTH_URL, ADMIN_EMAIL, ADMIN_PASSWORD_HASH

# Push the database schema
bun run db:push

# Start the app (port 3000)
bun run dev

# (Optional) Start the notification mini-service (port 3003)
cd mini-services/notify-service && bun install && bun run dev
```

The app runs at `http://localhost:3000`.

## Constitutional Principles

This repository is governed by the same principles as the Institution:

- **Prudence** — caution over speculation
- **Transparency** — everything auditable, nothing hidden
- **Neutrality** — no political, economic, or jurisdictional preference
- **Auditability** — every claim verifiable
- **Simplicity** — complexity is a liability

## Getting Involved

- Read the [full specification](docs/blueprint/blueprint.txt)
- Review the [executive summary](docs/blueprint/executive-summary.md)
- Read the [one-pager](docs/blueprint/one-pager.md)
- Review the [Smart Contract Registry](docs/contracts/CONTRACT_REGISTRY.md)
- Review the [Evidence Ledger](docs/evidence/EVIDENCE_LEDGER.md) and [Institutional Readiness Matrix](docs/evidence/INSTITUTIONAL_READINESS_MATRIX.md)
- Submit a Formation Committee interest at [mithqal.io](https://mithqal.io/?view=institution)

## License

All rights reserved. The Mithqal Constitution and all source code are the intellectual property of the Institution. No part of this repository grants a license to mint, redeem, or represent MTQ. MTQ is minted exclusively by the Institution against verified reserves. See [LICENSE](LICENSE).

---

> _The T-bill of crypto settlement — boring, neutral, over-collateralised._
