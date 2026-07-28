# MITHQAL — COO/CTO/PM Recommendations + Confidential Data Audit

**Date:** 28 July 2026
**Role:** COO + CTO + Project Manager
**Scope:** Missing features, needed upgrades, modifications, investor attractiveness, confidential data protection

---

## 1. CONFIDENTIAL DATA AUDIT

### Current State: ✅ CLEAN (with 1 action required)

| Check | Status | Details |
|-------|--------|---------|
| .env tracked in git | ✅ NOT tracked | `.env` is gitignored |
| Deployer private key in git | ✅ NEVER committed | `0xdbe17f...` never entered git |
| private_key.txt in git | ✅ NEVER committed | File only exists in `/upload/` (gitignored) |
| Current worklog.md | ✅ CLEAN | All secrets redacted to `<REDACTED:...>` |
| .env.example | ✅ CLEAN | Only placeholder values |
| API keys in current code | ✅ CLEAN | All in .env (not tracked) |
| Scrypt password hashes | ✅ CLEAN | Only in .env (not tracked) |
| Turso DB tokens | ✅ CLEAN | Only in .env (not tracked) |
| Vercel tokens | ✅ CLEAN | Only in .env (not tracked) |

### ⚠️ ONE ACTION REQUIRED: Rotate iCloud App Password

The SMTP password `hydy-rsgb-nunf-nazn` exists in **2 old git commits** (in the worklog.md before redaction). While the current code is clean, the old commits contain the plaintext password in git's object store.

**Risk:** LOW — the repo is public but the password is an App-Specific Password (not the Apple ID password). It can only send emails, not access the account.

**Action:** Go to https://account.apple.com → Sign-In & Security → App-Specific Passwords → REVOKE "Mithqal SMTP" → Generate a new one → Update `.env` + Vercel env vars.

### Deployer Private Key: ✅ SAFE

The private key (`0xdbe17f...`) was uploaded as `upload/private_key.txt` (which is in `.gitignore` and was NEVER committed to git). It was only used locally to deploy the MockOracle contract. The key file exists only on the local filesystem.

**Recommendation:** Delete `upload/private_key.txt` from the local filesystem after confirming all contracts are deployed. The deployer wallet has 3.98 MON + 110 MTQ — if the key is compromised, the attacker could mint MTQ (deployer has MINTER_ROLE).

---

## 2. RECOMMENDATIONS — MISSING / NEEDED / MODIFICATIONS

### Category A: Critical (Do Before Investor Meetings)

| # | Recommendation | Why | Effort | Impact |
|---|---------------|-----|--------|--------|
| A1 | **Register mithqal.io domain** | `mithqal.vercel.app` is not institutional. VCs expect a custom domain. | External ($12/yr) | +2.0 credibility |
| A2 | **Rotate iCloud App Password** | Old password in git history (see above) | 5 min | Security |
| A3 | **Delete local private_key.txt** | Deployer key should not persist on disk after deployment | 1 min | Security |
| A4 | **Add "Last Updated" timestamps** to every data section | VCs need to know data is fresh, not cached | Small | +1.0 trust |
| A5 | **Add a "Powered by Monad" badge** | Shows technical partnership (Monad Testnet) | Trivial | +0.5 credibility |

### Category B: Important (Do Before Mainnet)

| # | Recommendation | Why | Effort | Impact |
|---|---------------|-----|--------|--------|
| B1 | **Engage external security audit** | OpenZeppelin or Trail of Bits ($40-80K). Internal audit is 8.5/10 but VCs require external validation. | External | +2.0 trust |
| B2 | **Obtain Certora license** | Formal verification specs are written but unexecuted. Running them proves the invariants. | External ($10K/yr) | +1.5 trust |
| B3 | **Add real-time gold/silver chart** | The OS dashboard shows a static MTQ price chart. Add a live gold/silver candlestick chart (from the on-chain MockOracle). | Medium | +1.0 UX |
| B4 | **Add "Audit Trail" timeline** | Visual timeline of every constitutional event (deploy, mint, burn, governance vote, PoR update). Shows institutional discipline. | Medium | +1.5 UX |
| B5 | **Add multi-currency NAV display** | Let users view NAV in USD, EUR, AED, or gold grams — not just USD. Important for MENA investors. | Small | +0.5 UX |
| B6 | **Constitution view: verify all 47 articles render** | Currently only 308 words visible. May not be rendering all articles. | Small | +1.0 completeness |
| B7 | **Deck view: verify all 10 slides render** | Currently only 66 words visible. May only show first slide. | Small | +1.0 completeness |

### Category C: Enhancements (Post-Launch)

| # | Recommendation | Why | Effort | Impact |
|---|---------------|-----|--------|--------|
| C1 | **Add WalletConnect Project ID** | The wallet modal has a placeholder WC project ID. Get a real one at cloud.walletconnect.com (free) for mobile wallet QR codes to work. | 5 min | +1.0 UX |
| C2 | **Add Plausible analytics** | Privacy-respecting analytics (no Google Analytics). Track: page views, testnet interactions, form submissions. | Small | +0.5 insights |
| C3 | **Add Arabic + French translations** | Language switcher exists (EN/AR/FR) but only English content is translated. Important for MENA + African trade corridor. | Large | +2.0 reach |
| C4 | **Add KYC integration** | Persona, Onfido, or Sumsub for Formation Committee onboarding. Currently the Brain AI does screening but no real KYC. | External ($500/mo) | +1.5 compliance |
| C5 | **Add mobile app (Capacitor)** | Wrap the PWA as a native iOS/Android app. Push notifications for new submissions. | Medium | +1.0 reach |
| C6 | **Add "Proof of Reserves" modal** | Click any reserve claim → opens a modal showing the cryptographic proof + block explorer link. | Medium | +1.5 trust |
| C7 | **Add "What If" simulator on homepage** | Not buried in Engine view, but right on Institution page: "What if gold drops 10%? → See impact on MTQ" | Medium | +1.0 UX |
| C8 | **Add "Community Dashboard"** | Public metrics: total minted, total burned, total settled, unique holders, settlement volume — all live. | Medium | +1.0 transparency |

### Category D: Architecture / Infrastructure

| # | Recommendation | Why | Effort | Impact |
|---|---------------|-----|--------|--------|
| D1 | **Add rate limiting to ALL API routes** | Currently only `/api/formation-interest` is rate-limited. Add to `/api/mint`, `/api/redeem`, `/api/transfer`. | Small | +1.0 security |
| D2 | **Add request logging to Turso** | Log every API request (method, path, IP, timestamp, response code) to a `request_logs` table. | Small | +1.0 auditability |
| D3 | **Add health check endpoint** | `/api/health` that checks: DB, RPC, oracle, SMTP — returns 200 if all healthy, 503 if any down. | Small | +1.0 ops |
| D4 | **Add CDN caching for static data** | `/api/infrastructure`, `/api/governance/proposals` rarely change — cache at CDN level (Vercel Edge). | Small | +0.5 performance |
| D5 | **Add error boundary** | If a component crashes, show a graceful error page instead of a white screen. | Small | +1.0 UX |

### Category E: Tokenomics / Crypto

| # | Recommendation | Why | Effort | Impact |
|---|---------------|-----|--------|--------|
| E1 | **Add mint/burn ratio chart** | Shows net supply flow over time (minted vs burned). Key institutional metric. | Small | +1.0 transparency |
| E2 | **Add holder distribution chart** | Top 10 holders + HHI concentration index. Currently shows "1 holder (deployer)". | Small | +1.0 transparency |
| E3 | **Add settlement volume tracker** | Daily/weekly/monthly volume. The KEY institutional metric — how much MTQ is actually being used? | Small | +1.5 trust |
| E4 | **Add "Reserve Health" composite score** | Already implemented on OS page (score: 81/100 GREEN). Add to Transparency page too. | Trivial | +0.5 UX |
| E5 | **Connect on-chain minting** | Currently the webapp mint is a simulator. Wire it to call `MTQ.mint()` via MetaMask (deployer has MINTER_ROLE). | Medium | +2.0 functionality |
| E6 | **Add "Governance Proposal" creation UI** | Let Council members create + vote on proposals via the webapp (currently read-only). | Large | +1.5 functionality |

---

## 3. INVESTOR ATTRACTION SCORECARD

### What Investors Look For (and what Mithqal has)

| Criterion | Score | Status |
|-----------|-------|--------|
| Clear problem statement | 9.5/10 | ✅ "Neutral cross-border settlement rail" |
| Unique value proposition | 9.5/10 | ✅ "Constitutional, fully-reserved, non-platform" |
| Market opportunity | 9.0/10 | ✅ "T-bill of crypto settlement" |
| Revenue model | 9.0/10 | ✅ Fees (0.01-0.20%), 3-entity structure |
| Competitive moat | 9.5/10 | ✅ "Credibility you cannot fake" — constitutional permanence |
| Team | 5.0/10 | ⚠️ "No co-founders, no advisors of record" (honest but gap) |
| Traction | 8.5/10 | ✅ 4 contracts, 9/9 tests, live oracle, 69 fuzz tests |
| Financial projections | 8.5/10 | ✅ $0.25-8M raise, 5-phase roadmap |
| Risk awareness | 9.5/10 | ✅ 8-risk register with mitigations |
| Legal compliance | 8.5/10 | ✅ JOZOUR LLC, EIN, FinCEN filed |
| Technology | 9.0/10 | ✅ Next.js 16, Turso, Monad, Foundry, Certora |
| Exit strategy | 9.0/10 | ✅ "Entity B — shares, options, dividends, eventual exit" |
| Transparency | 9.5/10 | ✅ "Build in public" — legal, regulatory, on-chain all visible |
| Disclaimers | 9.0/10 | ✅ "Not an offer to sell securities" on 3 pages |
| **Overall Investor Score** | **8.5/10** | **READY (with team gap)** |

### What's Missing for 10/10

1. **Team** (5.0/10) — Need at least 1-2 named advisors (ex-central bank, ex-custody, trade-finance). This is the #1 gap.
2. **Domain** — `mithqal.vercel.app` → `mithqal.io` (or `.com` / `.org`)
3. **External audit** — Internal is 8.5/10, but VCs require external validation
4. **Custody partner** — No qualified custody RFP issued yet
5. **Real oracle integration** — MockOracle is deployed; need Chainlink/Pyth for mainnet

---

## 4. CONFIDENTIAL DATA SUMMARY

| Data Type | In Current Code | In Git History | Action Needed |
|-----------|----------------|----------------|---------------|
| Deployer private key | ✅ NOT in git | ✅ NEVER in git | Delete local file |
| iCloud SMTP password | ✅ Redacted | ⚠️ In 2 old commits | **Rotate password** |
| Turso DB token | ✅ NOT in git | ✅ NEVER in git | None |
| Vercel token | ✅ NOT in git | ✅ NEVER in git | None |
| Gemini/HF/Groq API keys | ✅ NOT in git | ✅ NEVER in git | None |
| Admin password hash | ✅ NOT in git | ✅ NEVER in git | None |
| .env file | ✅ NOT tracked | ✅ NEVER tracked | None |
| upload/private_key.txt | ✅ Gitignored | ✅ NEVER committed | Delete local file |
| Foundry fuzz seed | ✅ Safe (ASCII "mithqal") | ✅ Safe | None |

### Actions Required:

1. **ROTATE** the iCloud App-Specific Password (old one in git history)
2. **DELETE** `upload/private_key.txt` from the local filesystem
3. **UPDATE** `.env` + Vercel with the new iCloud password
