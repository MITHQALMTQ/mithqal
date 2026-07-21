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
- **Sharia Compliance** — AAOIFI-certified
- **Anti-Platform** — the Institution operates no commercial services
- **Neutrality** — no political, economic, or jurisdictional alignment

## Architecture

- **Single Settlement Token** (MTQ)
- **Separate Yield Vehicle** for institutional investors
- **Physical Gold Redemption** (1 kg minimum)
- **ISO 20022** interoperability
- **10-minute soft finality, 7-day hard finality**

## Repository Structure

```
.
├── docs/blueprint/            # The complete v18 specification
│   ├── blueprint.txt           #   Full text
│   ├── v18-blueprint-complete.md
│   ├── executive-summary.md
│   └── one-pager.md
├── src/
│   ├── contracts/             # Smart contract source (Solidity)
│   │   ├── core/MTQ.sol        #   The settlement token
│   │   └── governance/Governance.sol
│   ├── app/                    # Next.js 16 App Router (institutional web app)
│   │   ├── api/                 #   formation-interest, transparency, testnet, admin, auth
│   │   ├── page.tsx             #   7-view toggle
│   │   ├── layout.tsx           #   Metadata, fonts, SessionProvider
│   │   ├── sitemap.ts · robots.ts · not-found.tsx
│   ├── components/              #   institution, transparency, constitution, testnet, deck, playbook, admin
│   ├── lib/                     #   auth.ts, db.ts, testnet-engine.ts, constitution-data.ts
│   └── hooks/                   #   use-notify.ts (WebSocket), use-toast.ts
├── formal-verification/         # Invariant proofs
├── infrastructure/               # Cloud + deployment (k8s, terraform, monitoring)
├── operations/                  # Runbooks, procedures, templates
├── mini-services/
│   └── notify-service/           # Real-time notification relay (socket.io, port 3003)
├── prisma/                       # Database schema
└── README.md
```

## The Working Surface

The Next.js application exposes seven views — the public-facing institutional surfaces, the investor artifacts, and the operator's internal tooling:

| View | Audience | Purpose |
|---|---|---|
| **Institution** | Public | The credibility site + Formation Committee intake |
| **Transparency** | Public | Live state — verifiable operations, build in public |
| **Constitution** | Public | The citable v18 spec (47 articles across 5 layers) |
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

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · TypeScript 5 |
| Styling | Tailwind CSS 4 · shadcn/ui (New York) · Lucide icons |
| Database | Prisma ORM · SQLite |
| Auth | NextAuth.js v4 (credentials provider, JWT sessions, scrypt) |
| Real-time | WebSocket mini-service (socket.io, port 3003) |
| Contracts | Solidity (MTQ.sol, Governance.sol) |
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
- Submit a Formation Committee interest at [mithqal.io](https://mithqal.io/?view=institution)

## License

All rights reserved. The Mithqal Constitution and all source code are the intellectual property of the Institution. No part of this repository grants a license to mint, redeem, or represent MTQ. MTQ is minted exclusively by the Institution against verified reserves. See [LICENSE](LICENSE).

---

> _The T-bill of crypto settlement — boring, neutral, over-collateralised._
