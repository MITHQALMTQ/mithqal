# Mithqal — Environment Variable Cross-Connection Map

**Owner:** Cross-Platform Environment Architect (Agent D4)
**Release:** v25.5
**Scope:** Audit and document every `process.env.X` reference in the
codebase and map the cross-connections between the 5 production
platforms (GitHub, Vercel, Inngest, Turso, Neon) plus auxiliary surfaces
(SMTP provider, AI Brain providers, chain RPCs, operator-gate secrets).

This document is the canonical cross-reference for env-var
provisioning. Operators should pair it with
`ENV-PROVISIONING-CHECKLIST.md` when onboarding a new platform or
recovering from a key rotation.

---

## 0. Inventory — total env vars cataloged

A codebase-wide scan (`grep -rEn "process\.env\.[A-Z_]+" src/ mini-services/`)
identified **40 unique env-var identifiers** referenced in application
source. They group into 11 functional buckets:

| # | Bucket | Env vars | Source-of-truth module |
|---|---|---|---|
| 1 | Turso (database) | `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL` | `src/lib/db.ts` (lines 45–50), `src/lib/state-persistence.ts` (131–136), `src/lib/live-oracle.ts` (127–128, 154–155) |
| 2 | Neon (fallback DB) | `NEON_DATABASE_URL`, `DATABASE_BACKEND` | `NEON-SETUP.md` runbook — code path not yet wired in `db.ts` (per AI-FALLBACK-INNGEST-NEON task) |
| 3 | AI Brain (5 providers) | `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY` | `src/lib/mithqal-brain.ts` (139–143) |
| 4 | Macro data feed | `FRED_API_KEY` | `src/lib/real-market-feeds.ts` (310), `src/app/api/data-source-health/route.ts` (42, 146, 149) |
| 5 | SMTP (email) | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_NOTIFY_EMAIL` | `src/lib/email.ts` (29–32, 59, 96), `src/app/api/health/route.ts` (239), `src/app/api/admin/smtp-test/route.ts` (25–36, 121–125) |
| 6 | NextAuth / operator | `NEXTAUTH_SECRET`, `JWT_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `OPERATOR_TOTP_SECRET`, `AUDIT_SIGNING_KEY` | `src/lib/auth.ts` (39, 70, 147, 169), `src/lib/commercial-governance.ts` (689), `src/app/api/health/route.ts` (322–329) |
| 7 | Inngest | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | `src/lib/inngest-client.ts` (35–36) |
| 8 | Operator gates (cron + internal) | `CRON_SECRET`, `INTERNAL_SECRET` | `src/app/api/oracle/update/route.ts` (228), `src/app/api/rebalance/execute/route.ts` (31), `src/app/api/proofs/publish/route.ts` (43), `src/app/api/data-source-sync/route.ts` (24), `mini-services/notify-service/index.ts` (34), `mini-services/discord-bot/index.ts` (155) |
| 9 | Oracle / on-chain | `MOCK_ORACLE_ADDRESS`, `DEPLOYER_PRIVATE_KEY` | `src/lib/oracle-client.ts` (196), `src/app/api/admin/oracle/route.ts` (31), `src/app/api/admin/update-price/route.ts` (78), `src/app/api/oracle/update/route.ts` (242) |
| 10 | GitHub (backup push) | `GITHUB_TOKEN` | `mini-services/mithqal-watchdog/index.ts` (58, 61, 100, 102) — read via regex on `.env` file (NOT via `process.env`) |
| 11 | Discord bot mini-service | `DISCORD_BOT_TOKEN`, `DISCORD_APP_ID`, `DISCORD_NOTIFY_CHANNEL_ID`, `MITHQAL_API_BASE`, `DISCORD_BOT_PORT` | `mini-services/discord-bot/index.ts` (27–30, 56) |
| — | Next.js public runtime | `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_VALIDATOR_PUBKEY` | `src/lib/use-wallet.ts` (51–53), `src/app/api/proofs/publish/route.ts` (216, 223, 228), `src/app/api/health/route.ts` (328) |
| — | Vercel platform-injected | `VERCEL_URL`, `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` | `src/app/api/health/route.ts` (325), `src/app/api/proofs/publish/route.ts` (228) — auto-set by Vercel, not operator-managed |
| — | Runtime | `NODE_ENV`, `HOME`, `EXECUTION_MODE`, `REBALANCE_AUDIT_LEDGER_PATH` | standard Node + `src/lib/reserve-state.ts` (575), `src/lib/execution-engine.ts` (369) |

**Critical:** the local `/home/z/my-project/.env` contains only ONE line
(`DATABASE_URL=file:/home/z/my-project/db/custom.db`). All other env
vars are MISSING locally; production-Vercel has SMTP and a subset of
the operator secrets set. This gap is what produces the per-platform
failure modes documented in §2.

---

## 1. Per-platform env-var specification

For each of the 5 platforms plus the AI Brain / SMTP / chain-RPC
auxiliaries, the table below documents: (a) which env vars the platform
needs, (b) where the operator sets them, (c) which other platform's
env vars depend on them, (d) the failure mode if the var is missing,
and (e) the live health-check endpoint.

### 1.1 GitHub (source of truth)

- **Required env vars in `.env`**: `GITHUB_TOKEN=ghp_<token>` (or
  `x-access-token:<token>` URL-embedded form) — used by
  `mithqal-watchdog` to push the encrypted `.env.encrypted` backup
  to a private GitHub branch.
- **Where to set**: `https://github.com/settings/tokens` → fine-grained
  PAT with `repo:contents:write` scoped to `MITHQALMTQ/mithqal` only.
  Write the token into the local `.env` (and into the encrypted backup
  at `.env.encrypted`). The watchdog reads it via a regex on the file,
  NOT via `process.env.GITHUB_TOKEN`.
- **Cross-connection**: depends on (a) the `.env.encrypted` file
  existing locally — generated by `mithqal-watchdog`'s
  `openssl enc` step using a passphrase the operator memorizes;
  (b) the remote URL embedded in `git remote -v` carrying the
  `x-access-token:<token>@` form so plain `git push` also works.
- **Failure mode**: token expired → watchdog backup step returns
  non-zero, encrypted env not pushed, restore-from-backup chain breaks
  on the next sandbox reset. No runtime impact on the deployed Vercel
  app (Vercel has its own env-vars store).
- **Health-check**: `git remote -v` shows a URL containing
  `x-access-token:` (not `https://github.com/...`) AND `git push
  --dry-run` exits 0.

### 1.2 Turso (primary database)

- **Required env vars**: `DATABASE_URL=libsql://mithqal-db-fortleem.aws-us-east-1.turso.io`
  + `DATABASE_AUTH_TOKEN=<turso-db-token>`. Both are read in `db.ts`
  (lines 45–50), `state-persistence.ts` (131–136), and `live-oracle.ts`
  (127–128, 154–155).
- **Where to set**: `https://app.turso.tech` → `mithqal-db` → Settings →
  "Connection URL" gives the URL; "Tokens" → "Create database token"
  gives the auth token. (Use `turso db tokens create mithqal-db` if the
  CLI is installed.) Both go into the local `.env` AND into Vercel
  Project Settings → Environment Variables → Production/Preview/Development.
- **Cross-connection**: Turso must be reachable from Vercel's egress
  (Vercel IPs are auto-allowed by Turso's default IP-restriction policy
  on the AWS us-east-1 region). No cross-platform key dependency.
- **Failure mode**: missing `DATABASE_URL` → `db.ts` falls back to
  `file:./db/custom.db` (SQLite-on-disk) which works locally but
  does NOT survive Vercel cold starts — the app will boot but every
  write will be lost on the next deploy. Missing auth token on a
  remote Turso URL → 401 from libsql → `/api/status` returns 503.
- **Health-check**: `curl https://mithqal.vercel.app/api/status` →
  `{"db":"connected",...}` (200).

### 1.3 Neon (manual fallback DB)

- **Required env vars**: `NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.aws-<region>.neon.tech/dbname?sslmode=require`
  + `DATABASE_BACKEND=turso` (default) OR `DATABASE_BACKEND=neon`
  (only when failing over).
- **Where to set**: `https://console.neon.tech` → project
  `mithqal-fallback` (AWS us-east-2, Postgres 17) → Connection Details
  → copy the `?sslmode=require` connection string. Both vars go into
  Vercel Project Settings across Production/Preview/Development (the
  fallback must be warm in every environment, not just prod).
- **Cross-connection**: Neon is the **second-to-last platform to
  provision** — it has no incoming dependencies (it doesn't read
  Vercel's or Inngest's env vars), but it depends on a Turso snapshot
  being migrated into it first. Per `NEON-SETUP.md` §3, the migration
  uses `turso db shell .dump` → `psql -f dump.sql`.
- **Failure mode**: `NEON_DATABASE_URL` unset → no fallback available
  (acceptable: the fallback is MANUAL, not automatic, by constitutional
  design — see `NEON-SETUP.md` "Why NOT auto-failover"). Setting
  `DATABASE_BACKEND=neon` BEFORE the migration is complete →
  `db.ts` will fail to import `@neondatabase/serverless` (the
  fallback code path isn't wired in yet per AI-FALLBACK-INNGEST-NEON
  task; the documentation block was added but the `DATABASE_BACKEND`
  branch in `db.ts` is NOT yet implemented).
- **Health-check**: `psql $NEON_DATABASE_URL -c 'SELECT 1'` → returns
  `1` (one row). Equivalent via the Neon SQL Editor: `SELECT 1;`
  returns `?column? | 1`.

### 1.4 Inngest (durable background jobs)

- **Required env vars**: `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY`.
  Both are read in `src/lib/inngest-client.ts` (lines 35–36) and
  passed to the `Inngest({ id, eventKey, signingKey })` constructor.
- **Where to set**: `https://app.inngest.com` → Apps → `mithqal` →
  Settings → "Event Key" and "Signing Key" are auto-generated. Copy
  BOTH into Vercel Project Settings → Environment Variables (across
  all three environments). Locally, also write them into `.env` for
  `bun run dev` smoke tests of `/api/inngest`.
- **Cross-connection (CRITICAL)**: Inngest is the **only platform that
  generates** the keys Vercel consumes — i.e. Vercel's
  `INNGEST_SIGNING_KEY` env var value MUST come from the Inngest
  dashboard. Provisioning order is one-way: **Inngest first, then
  Vercel**. There is no reverse path.
- **Failure mode**: `INNGEST_SIGNING_KEY` missing locally →
  `bun run dev` boots cleanly (the constructor is permissive), but
  `/api/inngest` returns **HTTP 500** on EVERY method (GET discovery,
  POST invoke, PUT sync). Documented in worklog AI-FALLBACK-INNGEST-NEON
  §2 and confirmed live (curl localhost:3000/api/inngest → 500 today).
  On Vercel production, the same endpoint returns **HTTP 401** (which
  is CORRECT — the serve handler is now validating signed requests and
  rejecting unsigned GETs; 401 = Inngest Cloud hasn't sent a signed
  request yet, meaning the signing key IS set on Vercel).
- **Health-check**: `curl -s -o /dev/null -w "%{http_code}"`
  https://mithqal.vercel.app/api/inngest → 401 (key set, rejecting
  unsigned traffic). If you see 500 instead of 401, the signing key is
  missing or stale.

### 1.5 Vercel (deployment target)

- **Required env vars (Vercel consumes)**: every env var the Next.js
  runtime reads at request time, EXCEPT the Vercel-platform-injected
  ones (`VERCEL_URL`, `VERCEL_GIT_COMMIT_SHA` — auto-set). The full
  operator-managed set is enumerated in
  `ENV-PROVISIONING-CHECKLIST.md` §1 (22 vars).
- **Where to set**: `https://vercel.com/<org>/mithqal` → Settings →
  Environment Variables → each var added with scope
  Production+Preview+Development and "Sensitive" toggle ON. The
  one-shot push script `scripts/push-env-to-vercel.sh` automates this
  from the local `.env` (requires `vercel link` to be run once).
- **Cross-connection**: Vercel is the **last platform to provision**
  because it consumes env vars from every other platform:
  - `DATABASE_URL` + `DATABASE_AUTH_TOKEN` from Turso
  - `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` from Inngest
  - `NEON_DATABASE_URL` + `DATABASE_BACKEND` from Neon (warm fallback)
  - `GEMINI`/`GROQ`/`HUGGINGFACE`/`OPENROUTER`/`NVIDIA_API_KEY`
    from the 5 AI providers' respective consoles
  - `CRON_SECRET` + `INTERNAL_SECRET` are operator-generated
    (`openssl rand -hex 32`) and pushed into Vercel — they're the gate
    that lets the operator call `/api/oracle/update` and the
    mini-services call `/api/notify/emit` respectively
  - `SMTP_HOST`/`USER`/`PASS` from the SMTP provider (Apple iCloud
    in the canonical config; SendGrid / SES also supported by `email.ts`)
  - `NEXTAUTH_SECRET` + `NEXTAUTH_URL` from `openssl rand -hex 32`
    and the canonical `https://mithqal.vercel.app` URL
- **Failure mode**: see §2 below per env var.
- **Health-check**: `curl -s -o /dev/null -w "%{http_code}"
  https://mithqal.vercel.app/api/status` → 200 + JSON contains
  `"db":"connected"`. Also `curl https://mithqal.vercel.app/api/health`
  → 200 + `"status":"healthy"` with the `checks` object reporting
  per-platform reachability.

### 1.6 AI Brain providers (5 parallel)

- **Required env vars**: `GEMINI_API_KEY` (Google AI Studio),
  `GROQ_API_KEY` (Groq Cloud), `HUGGINGFACE_API_KEY` (HF Inference
  API), `OPENROUTER_API_KEY` (OpenRouter), `NVIDIA_API_KEY` (NVIDIA
  NIM). All read in `mithqal-brain.ts` lines 139–143.
- **Where to set**: each provider's console:
  - Gemini: `https://aistudio.google.com/apikey`
  - Groq: `https://console.groq.com/keys`
  - HuggingFace: `https://huggingface.co/settings/tokens` (scope:
    `inference` read)
  - OpenRouter: `https://openrouter.ai/keys`
  - NVIDIA: `https://build.nvidia.com` → NIM API keys
- **Cross-connection**: NONE of these providers consume env vars from
  any other platform — they're self-contained API-key → bearer-token
  pairs. But the Brain's `queryAllModels()` runs all 5 in parallel
  via `Promise.allSettled`, so a single missing key silently
  downgrades one of the 5 vote cards in `/api/brain`. The model-level
  fallback list (`MODEL_FALLBACKS` added in AI-FALLBACK-INNGEST-NEON)
  absorbs single-MODEL deprecations; a missing API KEY still kills
  the whole provider.
- **Failure mode**: missing key → that provider's `queryXxx()` returns
  `{ ok: false, error: "401 Unauthorized" }`; the consensus layer
  downgrades to 4-vote or 3-vote consensus. The UI in
  `mithqal-brain.tsx` currently only renders 3 of 5 providers (audit
  2-C defect: stale UI) — a separate fix item.
- **Health-check**: `curl http://localhost:3000/api/brain` → JSON
  contains per-provider `models[].ok` flags. Healthy = 5 of 5
  `ok:true` (or 4 of 5 with one intentional key rotation).

### 1.7 SMTP (email)

- **Required env vars**: `SMTP_HOST`, `SMTP_PORT` (default 587),
  `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional, defaults to
  `Mithqal <SMTP_USER>`), `ADMIN_NOTIFY_EMAIL` (destination).
- **Where to set**: the canonical config in `.env.example` uses Apple
  iCloud (`smtp.mail.me.com:587` + STARTTLS, requires an
  App-Specific Password from
  `https://account.apple.com → Sign-In & Security → App-Specific
  Passwords`). SendGrid (`smtp.sendgrid.net:587`, user `apikey`,
  pass = SendGrid API key) is the production-grade alternative.
- **Cross-connection**: NONE. SMTP credentials live entirely in
  Vercel env vars + `.env` for local dev.
- **Failure mode**: `SMTP_HOST` unset → `src/lib/email.ts` short-circuits
  with "SMTP_HOST is not set — outbound email disabled". As of task
  5-B, `/api/health` NO LONGER gates the overall status on SMTP — it
  reports `smtp:{ok:false,...}` as informational only, so the
  overall `status:"healthy"` is preserved. Local dev returns
  `smtp:false` (expected — `.env` has no SMTP); production returns
  `smtp:true` (verified live: `curl https://mithqal.vercel.app/api/health`
  reports `smtp.ok=true`).
- **Health-check**: `curl -X POST -H "content-type: application/json"
  -d '{"to":"<operator>"}'
  http://localhost:3000/api/admin/smtp-test` → 200 + a test email
  lands in the operator's inbox. (Requires admin NextAuth session +
  SMTP env vars set.)

### 1.8 Chain RPC (Monad / Arc / Solana)

- **Required env vars**: NONE in code today — RPC URLs are
  **hardcoded** in `src/lib/chains.ts` as `CHAINS.monad.rpc`,
  `CHAINS.arc.rpc`, `CHAINS.local.rpc`, and `SOLANA_NETWORKS[].rpc`.
  This is an architectural choice (the testnet RPCs are public and
  rate-limited per-IP, not per-key).
- **Where to set**: nowhere in env. To rotate or move to a paid
  provider (QuickNode / Alchemy / Helius), edit `chains.ts` directly
  (not in D4 scope — file a separate ticket).
- **Failure mode**: RPC node down → `/api/health` reports
  `rpc:{ok:false,...}` or `rpcArc:{ok:false,...}` (informational).
  The `/api/onchain-test?network=monad` route would 502.
- **Health-check**: `curl https://mithqal.vercel.app/api/health` →
  `checks.rpc.ok` and `checks.rpcArc.ok` both `true` (verified live).

### 1.9 Oracle / on-chain (MockOracle)

- **Required env vars**: `MOCK_ORACLE_ADDRESS` (the deployed
  `MockOracle.sol` contract address on Monad Testnet), and
  `DEPLOYER_PRIVATE_KEY` (the Foundry cast signing key for
  `/api/oracle/update` to call `setGoldPrice` on-chain).
- **Where to set**: `MOCK_ORACLE_ADDRESS` goes into `.env` after
  running the `forge create` command in `.env.example`'s comment.
  `DEPLOYER_PRIVATE_KEY` is operator-held — recommended to set in
  Vercel as a Sensitive env var with the
  `vercel env add DEPLOYER_PRIVATE_KEY production` CLI (NOT in
  `.env.example` — it's a key, not a template value).
- **Cross-connection**: NONE cross-platform (oracle is self-contained).
- **Failure mode**: `MOCK_ORACLE_ADDRESS` unset → `oracle-client.ts`
  falls back to `gold-api.com` (free) for the read path — `/api/oracle`
  still returns 200. `DEPLOYER_PRIVATE_KEY` unset → `/api/oracle/update`
  returns 503 (CRON_SECRET gate first) or 500 (after the gate, when
  the route tries to spawn `cast send`). The 4-A task hardened
  `oracle/update` to use a `spawnSync` args array (no shell injection)
  AND a CRON_SECRET gate. Production returns 500 today — root cause
  is the Foundry `cast` binary not on the Vercel serverless PATH
  (the route hardcodes `${process.env.HOME}/.foundry/bin/cast` at
  line 163, which doesn't exist on Vercel).
- **Health-check**: `curl https://mithqal.vercel.app/api/oracle`
  → 200 + JSON gold price (read path, works without env vars thanks
  to fallback). Write path `/api/oracle/update` requires the
  operator to POST `x-cron-secret:<CRON_SECRET>` header AND requires
  `DEPLOYER_PRIVATE_KEY` + Foundry cast on PATH (currently broken on
  Vercel — file separate ticket to bundle cast into the function).

---

## 2. Failure modes — per-env-var

The matrix below is the operator's quick-reference when an endpoint
returns non-200. Each row tells you: the env var, the endpoint that
breaks, the symptom, and the fix.

| Env var | Endpoint that breaks | Symptom (HTTP code + body) | Fix |
|---|---|---|---|
| `DATABASE_URL` | `/api/status`, `/api/health` | 503 / `db: not connected` | Set Turso URL in Vercel env vars |
| `DATABASE_AUTH_TOKEN` | `/api/status` (remote Turso only) | 401 from libsql → 503 | `turso db tokens create mithqal-db`, paste into Vercel |
| `INNGEST_SIGNING_KEY` | `/api/inngest` | 500 (key missing) / 401 (key set, unsigned request) | Copy from Inngest dashboard → Vercel env vars |
| `INNGEST_EVENT_KEY` | Inngest Cloud sync trigger | Inngest can't deliver events to the route | Copy from Inngest dashboard → Vercel env vars |
| `CRON_SECRET` | `/api/oracle/update`, `/api/rebalance/execute`, `/api/proofs/publish`, `/api/data-source-sync` | 503 `{"error":"CRON_SECRET not configured"}` | `openssl rand -hex 32` → Vercel + operator's cron runner |
| `INTERNAL_SECRET` | `mini-services/*/emit` | 503 `{"error":"internal secret not configured"}` | `openssl rand -hex 32` → Vercel + every mini-service's env |
| `NEXTAUTH_SECRET` | `/api/auth/*`, admin pages | Session cookies fail to verify → 401 loop | `openssl rand -hex 32` → Vercel + `.env` |
| `NEXTAUTH_URL` | `/api/auth/callback/*` | Redirect to wrong origin | `https://mithqal.vercel.app` → Vercel |
| `DEPLOYER_PRIVATE_KEY` | `/api/oracle/update` (after CRON_SECRET gate) | 500 (route can't sign) | Paste deployer key → Vercel as Sensitive |
| `MOCK_ORACLE_ADDRESS` | `/api/admin/oracle`, `/api/admin/update-price` | 200 with `oracleAddress: null` (read path falls back to gold-api.com) | Deploy MockOracle → paste address → `.env` + Vercel |
| `GEMINI_API_KEY` | `/api/brain` Gemini card | `ok:false, error:"401"` | `https://aistudio.google.com/apikey` → Vercel |
| `GROQ_API_KEY` | `/api/brain` Groq card | `ok:false, error:"401"` | `https://console.groq.com/keys` → Vercel |
| `HUGGINGFACE_API_KEY` | `/api/brain` HF card | `ok:false, error:"401"` | `https://huggingface.co/settings/tokens` → Vercel |
| `OPENROUTER_API_KEY` | `/api/brain` OpenRouter card | `ok:false, error:"401"` | `https://openrouter.ai/keys` → Vercel |
| `NVIDIA_API_KEY` | `/api/brain` NVIDIA card | `ok:false, error:"401"` | `https://build.nvidia.com` → Vercel |
| `SMTP_HOST` | `/api/admin/smtp-test`, email sends | `smtp:{ok:false,...}` (informational only since 5-B) | Apple iCloud / SendGrid host → Vercel + `.env` |
| `SMTP_USER` / `SMTP_PASS` | email sends | `smtp:{ok:false,...}` | App-specific password → Vercel + `.env` |
| `ADMIN_NOTIFY_EMAIL` | email destination | email goes to `noreply@mithqal.io` | Operator inbox → Vercel + `.env` |
| `ADMIN_EMAIL` | admin login | `401 invalid credentials` (no operator account found) | `coo@mithqal.io` → Vercel + `.env` |
| `ADMIN_PASSWORD_HASH` | admin login | `401 invalid credentials` (no password to compare) | `node -e "scrypt..."` (see `.env.example`) → Vercel + `.env` |
| `FRED_API_KEY` | `/api/data-source-health` FRED check | `fred:{ok:false,...}` (other sources still ok) | `https://fredaccount.stlouisfed.org/apikeys` → Vercel (optional — IMF/BIS sources work without it) |
| `GITHUB_TOKEN` | `mithqal-watchdog` backup | Watchdog log `git clone failed` | `https://github.com/settings/tokens` → local `.env` (NOT Vercel) |
| `DISCORD_BOT_TOKEN` | discord-bot mini-service | bot fails to login | Discord Dev Portal → Bot → Token → mini-service env |
| `MITHQAL_API_BASE` | discord-bot → Mithqal API calls | bot posts to localhost (wrong on prod) | `https://mithqal.vercel.app` → mini-service env |
| `INTERNAL_SECRET` (mini-service side) | `mini-services/*/emit` POST | 401 `x-internal-secret mismatch` | Must match Vercel's INTERNAL_SECRET — set both sides |
| `NEON_DATABASE_URL` | (no code path today — see §1.3) | N/A | Provision per `NEON-SETUP.md` so it's warm before failover |
| `DATABASE_BACKEND=neon` | (no code path today) | db.ts doesn't branch on it yet | NOT YET SUPPORTED — see AI-FALLBACK-INNGEST-NEON task |

---

## 3. Recommended provisioning order

Platforms must be provisioned in this exact order. Out-of-order
provisioning produces hard-to-debug 500s (e.g. setting up Vercel
before Inngest means Vercel has no signing key to copy).

```
1. GitHub  (source of truth — repo + PAT for backup pushes)
       │
       │  repo exists, push works
       ▼
2. Turso   (primary DB — must exist before any app code runs)
       │
       │  DATABASE_URL + DATABASE_AUTH_TOKEN copied out
       ▼
3. Neon    (fallback DB — provision warm, do NOT activate)
       │
       │  NEON_DATABASE_URL copied out, schema migrated,
       │  DATABASE_BACKEND stays "turso"
       ▼
4. Inngest (signing key GENERATED here — copy out to Vercel)
       │
       │  INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY copied out
       ▼
5. Vercel  (deployment target — consumes env vars from ALL above)
       │
       │  also set: AI keys, CRON_SECRET, INTERNAL_SECRET,
       │  NEXTAUTH_SECRET/URL, SMTP_*, ADMIN_*, NEXT_PUBLIC_*
       ▼
6. Operator cron + mini-services (consume CRON_SECRET and
       INTERNAL_SECRET respectively — set AFTER Vercel so the
       values match)
```

### Why this order

1. **GitHub first** because every subsequent platform's secrets get
   backed up to GitHub via the watchdog; if the repo isn't there yet,
   the watchdog's first run will fail silently.
2. **Turso before Neon** because the Neon fallback is supposed to be a
   MIGRATION TARGET, not a fresh schema — you migrate Turso's data
   INTO Neon, so Turso must be the source.
3. **Neon before Inngest** because Neon is just a "warm box" (no
   outgoing keys), while Inngest generates keys that Vercel will
   consume — Inngest is a longer-running setup.
4. **Inngest before Vercel** because Vercel's `INNGEST_SIGNING_KEY` is
   a copy of the key Inngest generated. If you set up Vercel first,
   the signing-key field is empty, and `/api/inngest` returns 500.
5. **Vercel last** because it consumes env vars from ALL other
   platforms.
6. **Operator cron + mini-services last** because they consume
   `CRON_SECRET` / `INTERNAL_SECRET` which must MATCH the value
   Vercel holds — generate once, push to Vercel, then copy the same
   value into the cron runner's env + mini-service env.

---

## 4. Failure cascade diagram

This is the text-art mental model of how a single missing env var
cascades through the stack. Read top-down: a push to GitHub triggers a
Vercel build, which then fans out to all the runtime env-var consumers.

```
GitHub repo (source of truth)
  │
  ├── git push (mithqal-watchdog uses GITHUB_TOKEN in local .env)
  ▼
Vercel build (auto-deploy on push)
  │
  ├──> DATABASE_URL ───────────► Turso (must be reachable from Vercel egress)
  │    DATABASE_AUTH_TOKEN        ├─ ok → /api/status:200  db:"connected"
  │                               └─ fail → 503  db:"not connected"
  │
  ├──> INNGEST_SIGNING_KEY ────► Inngest (must EXACTLY match the dashboard key)
  │    INNGEST_EVENT_KEY          ├─ ok → /api/inngest:401 (correct — unsigned GET rejected)
  │                               └─ fail → /api/inngest:500 (key missing) or 401-mismatch (key stale)
  │
  ├──> NEON_DATABASE_URL ──────► Neon (manual fallback — warm, not active)
  │    DATABASE_BACKEND=turso     ├─ DATABASE_BACKEND="turso" → db.ts uses Turso (current)
  │                               └─ DATABASE_BACKEND="neon" → NOT YET WIRED (db.ts branch TODO)
  │
  ├──> GEMINI_API_KEY ─────────► Google AI Studio
  ├──> GROQ_API_KEY ───────────► Groq Cloud
  ├──> HUGGINGFACE_API_KEY ────► HuggingFace Inference API
  ├──> OPENROUTER_API_KEY ─────► OpenRouter
  ├──> NVIDIA_API_KEY ──────────► NVIDIA NIM
  │                               ├─ 5 keys set → /api/brain returns 5/5 ok:true
  │                               └─ any missing → that provider's card shows ok:false (consensus degrades)
  │
  ├──> CRON_SECRET ─────────────► /api/oracle/update (POST gate)
  │                               ├─ ok → next gate: DEPLOYER_PRIVATE_KEY + Foundry cast on PATH
  │                               └─ fail → 503 "CRON_SECRET not configured"
  │
  ├──> INTERNAL_SECRET ─────────► mini-services {notify-service, discord-bot} /emit
  │                               ├─ ok + matching mini-service env → POST works
  │                               └─ fail → 503 "internal secret not configured"
  │
  ├──> SMTP_HOST/USER/PASS ─────► Apple iCloud (smtp.mail.me.com:587)
  │                               ├─ ok → outbound email works
  │                               └─ fail → /api/health: smtp:{ok:false} (informational only since 5-B)
  │
  ├──> NEXTAUTH_SECRET ─────────► NextAuth JWT signing
  │    NEXTAUTH_URL               ├─ ok → admin console session works
  │                               └─ fail → 401 redirect loop on /api/auth/*
  │
  ├──> ADMIN_EMAIL ─────────────► Operator login identity (env-defined, no user table)
  │    ADMIN_PASSWORD_HASH        ├─ ok → POST /api/auth/login → 302 to /admin
  │                               └─ fail → 401 invalid credentials
  │
  ├──> MOCK_ORACLE_ADDRESS ──────► /api/admin/oracle (read on-chain MockOracle)
  │                               ├─ ok → /api/admin/oracle returns contract state
  │                               └─ fail → /api/oracle falls back to gold-api.com (still 200)
  │
  ├──> DEPLOYER_PRIVATE_KEY ────► /api/oracle/update (signs setGoldPrice tx)
  │                               ├─ ok + Foundry cast on PATH → tx broadcasts
  │                               └─ fail → 500 after CRON_SECRET gate passes
  │
  ├──> FRED_API_KEY ────────────► /api/data-source-health FRED check
  │                               ├─ ok → fred:{ok:true,...}
  │                               └─ fail → fred:{ok:false,...} (IMF/BIS still work)
  │
  └──> GITHUB_TOKEN (local .env, NOT Vercel) ──► mithqal-watchdog backup-push
                                   ├─ ok → .env.encrypted pushed to private branch
                                   └─ fail → watchdog log "git clone failed", no backup
```

### Key observations from the cascade

- **Vercel is the single sink**: every cross-platform env var lands in
  Vercel's env-var store. This is why Vercel is provisioned last.
- **Two operator-gate secrets** (`CRON_SECRET` and `INTERNAL_SECRET`)
  are operator-generated (NOT platform-generated) — they must be the
  SAME value on both Vercel and the operator's cron runner / mini-service
  env. This is the only bi-directional env-var dependency in the map.
- **Inngest is one-way**: it generates keys that Vercel consumes; Vercel
  never pushes a key back to Inngest.
- **Neon is dormant**: `NEON_DATABASE_URL` is set in Vercel but
  `DATABASE_BACKEND=turso` keeps the app on Turso. The fallback is
  manual (operator flips `DATABASE_BACKEND=neon` during an incident)
  and even then, the code branch in `db.ts` is NOT YET WIRED.
- **`MOCK_ORACLE_ADDRESS` is graceful**: missing it doesn't break the
  read path (`/api/oracle` falls back to gold-api.com). Only the
  on-chain write path needs it.
- **`DEPLOYER_PRIVATE_KEY` + Foundry cast on Vercel's PATH is the
  unsolved write-path problem**: even with the key set,
  `/api/oracle/update` returns 500 in production because
  `${process.env.HOME}/.foundry/bin/cast` doesn't exist in Vercel's
  Node.js serverless function image. Separate ticket required to bundle
  `cast` as a static binary or rewrite the route to use `viem`/`ethers`.

---

## 5. Live health-check matrix

Verified at task D4 execution time (2026-09-28 20:49 UTC):

| Platform | Command | Expected | Actual (local dev) | Actual (Vercel prod) | Verdict |
|---|---|---|---|---|---|
| GitHub | `git remote -v` | URL contains `x-access-token:` | `https://x-access-token:<REDACTED>@github.com/MITHQALMTQ/mithqal.git` | n/a | OK |
| GitHub | `git push --dry-run` | exit 0 | (not executed — sandbox has no network for git) | n/a | DEFERRED |
| Turso | `curl /api/status` → `db:"connected"` | 200 | 200 | 200 | OK |
| Turso CLI | `turso db list` | shows `mithqal-db` | (turso CLI not installed in sandbox) | n/a | NOT AVAILABLE |
| Neon | `psql $NEON_DATABASE_URL -c 'SELECT 1'` | `1` | (NEON_DATABASE_URL not set locally; `psql` not in sandbox) | n/a | NOT PROVISIONED |
| Inngest | `curl /api/inngest` | 401 (key set, unsigned GET) | **500** (key missing locally) | **401** (key set on Vercel) | LOCAL-FAIL / PROD-OK |
| Vercel | `curl https://mithqal.vercel.app/api/status` | 200 + `db:"connected"` | 200 (localhost) | 200 | OK |
| Vercel | `curl https://mithqal.vercel.app/api/health` | 200 + `status:"healthy"` | 200 + `status:"healthy"` | 200 + `status:"healthy"` | OK |
| SMTP | `/api/health → smtp.ok` | `true` on Vercel, `false` local | `false` (local — SMTP_HOST not in `.env`) | `true` (Vercel) | LOCAL-MISSING / PROD-OK |
| Oracle read | `curl /api/oracle` | 200 + gold price | 200 | 200 | OK |
| Oracle write | `curl -X POST /api/oracle/update` | 503 if CRON_SECRET unset; 500 if cast not on PATH | **503** (CRON_SECRET unset locally) | **500** (CRON_SECRET set but Foundry cast not in Vercel image) | LOCAL-EXPECTED / PROD-BROKEN |
| AI Brain | `curl /api/brain` | 5 providers, per-provider `ok` flag | (not executed live — keys not in `.env`; Brain would return 5× `ok:false`) | (not executed — but Vercel prod has keys, expected 5/5 or 4/5 with a rotated key) | LOCAL-MISSING |
| GitHub CLI | `gh repo view` | repo metadata | (gh CLI not installed) | n/a | NOT AVAILABLE |
| Foundry cast | `~/.foundry/bin/cast --version` | version string | (not installed in sandbox) | (not in Vercel serverless image — root cause of /api/oracle/update 500) | NOT AVAILABLE |
| FRED macro feed | `/api/data-source-health` FRED source | `ok:true` | `ok:false` (FRED_API_KEY not set locally; IMF/BIS still REACHABLE) | (likely `ok:true` on Vercel if key set, or `false` if not) | LOCAL-MISSING |
| Discord bot | `mini-services/discord-bot` boots | bot connects to Discord Gateway | (mini-service not running in sandbox) | n/a | NOT RUNNING |

### Summary of live findings

- **Platforms working locally**: GitHub (remote configured), Vercel
  (dev server live on :3000), Turso (via local SQLite fallback
  `file:/home/z/my-project/db/custom.db` — not actually hitting Turso
  cloud, just the local file), Oracle read path (gold-api.com
  fallback).
- **Platforms broken locally**: Inngest (500, signing key missing),
  Oracle write (503, CRON_SECRET missing), SMTP (informational only,
  not gating), FRED macro feed (optional, not gating), all 5 AI
  Brain providers (not in `.env`).
- **Platforms broken on Vercel prod**: Oracle write (500 — Foundry
  cast not in serverless image, separate from env-var scope).
- **Platforms working on Vercel prod**: Turso (db connected), Inngest
  (401 = correct rejection), SMTP (ok), IMF/BIS macro feeds, Oracle
  read path.

---

## 6. `.env.example` vs code drift (audit finding)

The local `.env.example` template (2388 bytes, last modified
2026-08-12) is OUT OF SYNC with the codebase. It contains:

```
DATABASE_URL, DATABASE_AUTH_TOKEN, NEXTAUTH_SECRET, NEXTAUTH_URL,
ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_NOTIFY_EMAIL, SMTP_HOST,
SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, GEMINI_API_KEY,
HUGGINGFACE_API_KEY, GROQ_API_KEY, MOCK_ORACLE_ADDRESS (commented)
```

But it is MISSING 23 env vars the code actually reads:

```
OPENROUTER_API_KEY, NVIDIA_API_KEY, FRED_API_KEY, INNGEST_EVENT_KEY,
INNGEST_SIGNING_KEY, NEON_DATABASE_URL, DATABASE_BACKEND, CRON_SECRET,
INTERNAL_SECRET, DEPLOYER_PRIVATE_KEY, JWT_SECRET, OPERATOR_TOTP_SECRET,
AUDIT_SIGNING_KEY, REBALANCE_AUDIT_LEDGER_PATH, EXECUTION_MODE,
NEXT_PUBLIC_WC_PROJECT_ID, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_CHAIN_ID,
NEXT_PUBLIC_VALIDATOR_PUBKEY, GITHUB_TOKEN, DISCORD_BOT_TOKEN,
DISCORD_APP_ID, DISCORD_NOTIFY_CHANNEL_ID, MITHQAL_API_BASE,
DISCORD_BOT_PORT
```

**Recommended fix (operator action, not in D4 scope — file a separate
ticket against `.env.example`)**: extend the template with stub entries
for every env var cataloged in §0, grouped by platform per §1.

---

## 7. References

- `NEON-SETUP.md` (project root) — 9-section Neon fallback runbook
  (provisioning steps, schema migration, manual switchover,
  why-not-auto-failover rationale).
- `RESTORE-ENV.md` (project root) — operator runbook for restoring the
  `.env` from the encrypted GitHub backup.
- `scripts/push-env-to-vercel.sh` — automated push of local `.env`
  to Vercel env-vars store (one-shot, idempotent, sensitive-flagged).
- `scripts/push_env_to_vercel.py` — Python variant.
- `mini-services/mithqal-watchdog/index.ts` — backup-and-restore
  daemon that encrypts `.env` to `.env.encrypted`, pushes to a
  private GitHub branch, and restores on sandbox reset.
- Worklog `AI-FALLBACK-INNGEST-NEON` — original Inngest + Neon
  integration task; documents the `INNGEST_SIGNING_KEY` 500 failure
  mode and the manual-fallback decision for Neon.
- Worklog `5-B` — moved SMTP from gating to informational in
  `/api/health` (so missing `SMTP_HOST` no longer produces a 503).
- Worklog `4-A` — hardened `/api/oracle/update` (CRON_SECRET gate +
  spawnSync args array), `/api/redeem`, `/api/rebalance/execute`,
  and both mini-service `/emit` endpoints (INTERNAL_SECRET gate).

---

**End of document.** Pair this with
`ENV-PROVISIONING-CHECKLIST.md` for the printable per-platform
checklist.
