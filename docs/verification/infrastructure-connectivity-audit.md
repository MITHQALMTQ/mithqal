# MITHQAL — Infrastructure Connectivity Audit

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`

## Infrastructure Components

### GitHub
- **Repository:** `MITHQALMTQ/mithqal` (public)
- **Branch:** `main`
- **HEAD:** `ab84451`
- **Status:** ✅ Connected (Vercel auto-deploys on push)
- **Issue:** ⚠️ Deployer private key committed in `scripts/update-onchain-oracle.sh:17`

### Vercel
- **Project:** `my-project` (prj_x0EThaKg2ERihhF5kYMDqilWBINS)
- **Deployment:** `dpl_9EAPe7ecRkfLKpvM1ve2YGCTrZYf` (READY)
- **URL:** `https://my-project-tonsy.vercel.app`
- **SSO Protection:** None (publicly accessible)
- **Env vars:** 9 present (SMTP×5, DATABASE_URL, NEXTAUTH_SECRET, ADMIN_PASSWORD_HASH, ADMIN_NOTIFY_EMAIL)
- **Missing env vars:** CRON_SECRET, MOCK_ORACLE_ADDRESS, ADMIN_EMAIL, DATABASE_AUTH_TOKEN, all AI keys, all Discord vars, DEPLOYER_PRIVATE_KEY, OPERATOR_TOTP_SECRET, AUDIT_SIGNING_KEY, JWT_SECRET
- **Cron:** 1 registered (`/api/proofs/publish` daily at 00:00 UTC) — **BROKEN** (returns HTTP 500)
- **Security headers:** ✅ All applied (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- **CSP weakness:** `script-src 'unsafe-inline' 'unsafe-eval'`, bare `wss:` in connect-src

### Turso (libSQL Database)
- **URL:** `libsql://mithqal-db-fortleem.aws-us-east-1.turso.io`
- **Status:** ✅ Connected (5ms latency)
- **Tables:** 15 (6 empty: ProofAttestation, CommercialAuditEntry, ProcurementRecord, ReserveOwnership, RevenueEntry, proposals)
- **Auth token:** Present locally, **MISSING in Vercel env** (yet `/api/health` reports db.ok=true — indeterminate)
- **Issue:** SQL injection in `storeDailySnapshot` (`live-oracle.ts:64-66`)

### Monad Testnet (Chain ID 10143)
- **RPC:** `https://testnet-rpc.monad.xyz`
- **Explorer:** `https://testnet.monadscan.com`
- **Status:** ✅ Reachable (block 0x32a69e4)
- **Contracts:** 9/9 deployed (verified via eth_getCode)
- **MTQ supply:** 310.95 MTQ
- **Deployer balance:** 1.6070 MON
- **Issue:** Deployed bytecode does NOT match source for 7/9 contracts

### Arc Network Testnet (Chain ID 5042002)
- **RPC:** `https://rpc.testnet.arc.io`
- **Explorer:** `https://testnet.arcscan.app`
- **Status:** ✅ Reachable (block 0x3600a82)
- **Contracts:** 9/9 deployed (verified via eth_getCode)
- **MTQ supply:** 1,000 MTQ
- **Deployer balance:** 19.5090 USDC
- **Issue:** Reserve contract EMPTY ($0) yet 1000 MTQ minted — constitutional violation

### Solana Devnet (non-EVM)
- **RPC:** `https://api.devnet.solana.com`
- **Explorer:** `https://explorer.solana.com`
- **Status:** ✅ Reachable (slot 483M+)
- **Mint:** `GAGRdrY6jcRTmD7A9KzvXA5sGMpNAkkRXwDoXBrEjxS4`
- **Supply:** 18.45 UI

### Oracle Sources (all free, no API keys)
| Source | Purpose | Status | Notes |
|--------|---------|--------|-------|
| gold-api.com | Gold XAU spot | ✅ Live | Primary source |
| CoinGecko | Gold (XAUt), silver, stablecoins, FX cross-rates | ✅ Live | Free, rate-limited |
| goldprice.org | Gold benchmark | ✅ Live | Independent source |
| metals.dev | Silver spot | ✅ Live | Uses `demo` API key |
| open.er-api.com | FX rates | ✅ Live | Primary FX source |
| Arc Network Oracle (on-chain) | Gold/silver prices | ⚠️ Stale | >1hr past MAX_STALENESS, never read in prod |

### Mini-Services (ALL LOCAL-ONLY — cannot run on Vercel)
| Service | Port | Local Status | Production Status |
|---------|------|--------------|-------------------|
| Discord bot | 3004 | ❌ Not running | ❌ Cannot run (serverless) |
| Notify service | 3003 | ❌ Not running | ❌ Cannot run (serverless) |
| Watchdog | N/A | ❌ Not running | ❌ Cannot run (serverless) |
| Oracle updater | N/A | ✅ Running (nohup) | ❌ Cannot run (serverless) |

### External Dependencies (SPOFs)
| Dependency | Impact if down | Mitigation |
|------------|---------------|------------|
| Turso DB | All DB-backed APIs return 500 | None (single instance) |
| gold-api.com | Gold price fails → hardcoded $4076.9 | Outdated fallback |
| open.er-api.com | FX fails → hardcoded rates | Only 8 currencies |
| CoinGecko | Stablecoin depeg fails → all NORMAL | Silent fallback to peg |
| Vercel | Entire production down | None (no backup) |
| Arc Network RPC | On-chain reads fail → gold-api.com fallback | Acceptable |

## Connectivity Summary

| Component | Connected? | Production-Verified? |
|-----------|------------|---------------------|
| GitHub → Vercel | ✅ | ✅ (auto-deploy works) |
| Vercel → Turso | ✅ | ✅ (db.ok=true) |
| Vercel → Monad RPC | ✅ | ✅ (health check passes) |
| Vercel → Arc RPC | ✅ | ✅ (health check passes) |
| Vercel → Solana RPC | ✅ | ✅ (API returns data) |
| Vercel → gold-api.com | ✅ | ✅ (live prices) |
| Vercel → CoinGecko | ✅ | ✅ (live prices) |
| Vercel → On-chain Oracle | ❌ | ❌ (MOCK_ORACLE_ADDRESS missing) |
| Vercel → Discord | ❌ | ❌ (cannot run serverless) |
| Vercel → AI providers | ❌ | ❌ (API keys missing) |
| Vercel cron → /api/proofs/publish | ✅ configured | ❌ (returns 500) |
| On-chain contracts → Source code | ❌ | ❌ (bytecode mismatch for 7/9) |
| Off-chain backend → On-chain contracts | ❌ | ❌ (never calls contracts) |
