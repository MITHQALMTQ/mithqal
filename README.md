# Mithqal — Constitutional Settlement Institution

> A constitutional, fully-reserved, neutral settlement institution for international trade. Built on the v18 FINAL specification.

**Website:** [mithqal.io](https://mithqal.io) · **X:** [@MithqalMTQ](https://x.com/MithqalMTQ) · **Docs:** [Constitution](https://mithqal.io/?view=constitution)

---

## What Mithqal is

Mithqal is **not** a token, a platform, a bank, or a DeFi protocol. It is a constitutional monetary institution whose sole function is to issue and redeem a fully-reserved settlement unit (**MTQ**) against verified reserves.

The Constitution is the foundation. It is immutable where it matters most — and adaptive where it must be. Every MTQ in circulation is backed by eligible reserves. Reserves are held in custody, never lent. The Institution is permanently prohibited from operating as a platform (no lending, no exchange, no brokerage, no DeFi — permanently frozen).

## The Constitution (v18 FINAL)

The full specification is structured across five layers:

| Layer | Articles | Scope |
|---|---|---|
| **1. Institutional** | I–XVII | Identity, objectives, principles, decision hierarchy, neutrality, anti-platform, lifecycle |
| **2. Monetary** | I–VII | Invariants, reserve principles, currency framework, monetary engine, proof of reserves |
| **3. Governance & Policy** | I–VIII | Committee mandates, fee schedules, sanctions mechanics, risk tolerances |
| **4. Technical** | I–VIII | Smart contracts, cryptography (post-quantum), oracle architecture, interoperability, formal verification |
| **5. Operations** | I–VII | Reserve management, transaction processing, participant services, vendor management |

**Read the Constitution:** [mithqal.io/?view=constitution](https://mithqal.io/?view=constitution)

## Five invariants (permanently frozen)

1. **100%+ reserve mandate** — reserves always equal or exceed supply
2. **No discretionary minting** — MTQ is minted only on verified deposit (no token sale, ever)
3. **No lending of reserves** — held in custody, never rehypothecated
4. **No commingling** — settlement reserves are segregated from all operational activity
5. **No redemption suspension** — the right to redeem is absolute

## Tech stack

- **Framework:** Next.js 16 (App Router) · TypeScript 5
- **Styling:** Tailwind CSS 4 · shadcn/ui (New York) · Lucide icons
- **Database:** Prisma ORM · SQLite
- **Auth:** NextAuth.js v4 (credentials provider, JWT sessions)
- **Real-time:** WebSocket mini-service (socket.io)
- **Fonts:** Fraunces (display) · Geist (sans)

## The working surface

| View | Audience | Purpose |
|---|---|---|
| **Institution** | Public | The credibility site + Formation Committee intake |
| **Transparency** | Public | Live state — verifiable operations, build in public |
| **Constitution** | Public | The citable v18 spec (47 articles) |
| **Testnet** | Technical investors | Live reserve simulator |
| **Deck** | First-meeting investors | 10-slide teaser → PDF |
| **Playbook** | Internal | The A-to-Z strategic execution plan |
| **Admin** | Operator (auth-gated) | Pipeline + live notifications + CSV export |

## Getting started

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

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── formation-interest/   # Public Formation Committee intake
│   │   ├── transparency/         # Public live state
│   │   ├── testnet/              # Mint/redeem/seed (simulator)
│   │   ├── admin/interests/      # Auth-gated admin API
│   │   └── auth/[...nextauth]/   # NextAuth handler
│   ├── page.tsx                 # 7-view toggle (Institution/Transparency/Constitution/Testnet/Deck/Playbook/Admin)
│   ├── layout.tsx               # Metadata, fonts, SessionProvider
│   ├── sitemap.ts · robots.ts · not-found.tsx
├── components/
│   ├── institution/             # Public site
│   ├── transparency/             # Live dashboard
│   ├── constitution/             # v18 docs viewer
│   ├── testnet/                  # Reserve simulator
│   ├── deck/                     # Investor teaser
│   ├── playbook/                 # Strategic plan
│   └── admin/                    # Auth-gated console
├── lib/
│   ├── auth.ts                  # NextAuth config (scrypt credentials)
│   ├── db.ts                    # Prisma client
│   ├── testnet-engine.ts        # Pure reserve mechanics
│   └── constitution-data.ts      # 47 structured articles
└── hooks/
    ├── use-notify.ts             # WebSocket subscription
    └── use-toast.ts
```

## Constitutional principles

This repository is governed by the same principles as the Institution:

- **Prudence** — caution over speculation
- **Transparency** — everything auditable, nothing hidden
- **Neutrality** — no political, economic, or jurisdictional preference
- **Auditability** — every claim verifiable
- **Simplicity** — complexity is a liability

## License

All rights reserved. The Mithqal Constitution is the intellectual property of the Institution. No part of this repository grants a license to mint, redeem, or represent MTQ. MTQ is minted exclusively by the Institution against verified reserves.

---

> _The T-bill of crypto settlement — boring, neutral, over-collateralised._
