# Mithqal — Env-Vars Provisioning Checklist

**Owner:** Cross-Platform Environment Architect (Agent D4)
**Release:** v25.5
**Purpose:** Printable, per-platform checklist for provisioning every
environment variable the Mithqal codebase consumes. Pair with
`ENV-CROSS-CONNECTIONS.md` for the cross-connection map and failure
modes.

**Provisioning order (MUST follow this sequence):**
1. GitHub
2. Turso
3. Neon (warm, do NOT activate)
4. Inngest (GENERATES the keys Vercel will consume)
5. Vercel (consumes env vars from ALL above)
6. Operator cron runner + mini-services (must MATCH Vercel secrets)

**Security rules:**
- Every secret value below is a PLACEHOLDER. Never paste real values
  into this file — use `openssl rand -hex 32` for operator-generated
  secrets, copy platform-generated keys from their dashboards.
- Every Vercel env var should be toggled "Sensitive" so the value is
  hidden in the dashboard.
- The local `.env` file is gitignored; the encrypted backup
  `.env.encrypted` is the only form that gets pushed to GitHub (via
  `mithqal-watchdog`).
- Rotate keys on personnel change (offboarding an operator → rotate
  `CRON_SECRET`, `INTERNAL_SECRET`, `NEXTAUTH_SECRET`,
  `DEPLOYER_PRIVATE_KEY`, `GITHUB_TOKEN`, all 5 AI keys).

---

## 1. Vercel Project (Production + Preview + Development)

> Set in: `https://vercel.com/<org>/mithqal` → Settings →
> Environment Variables. Use the `scripts/push-env-to-vercel.sh`
> one-shot script after `vercel link` to bulk-push from local `.env`.

### Database (Turso — primary)

- [ ] `DATABASE_URL=libsql://mithqal-db-fortleem.aws-us-east-1.turso.io`
- [ ] `DATABASE_AUTH_TOKEN=<turso-db-token>` (from `turso db tokens create mithqal-db`)

### Database (Neon — manual fallback, warm only)

- [ ] `NEON_DATABASE_URL=postgresql://<user>:<pass>@ep-<id>.aws-<region>.neon.tech/dbname?sslmode=require`
- [ ] `DATABASE_BACKEND=turso` (DEFAULT — only flip to `neon` during manual failover; code branch not yet wired in `db.ts`)

### AI Brain (5 parallel providers)

- [ ] `GEMINI_API_KEY=<key>` (from `https://aistudio.google.com/apikey`)
- [ ] `GROQ_API_KEY=<key>` (from `https://console.groq.com/keys`)
- [ ] `HUGGINGFACE_API_KEY=<key>` (from `https://huggingface.co/settings/tokens`, scope `inference`)
- [ ] `OPENROUTER_API_KEY=<key>` (from `https://openrouter.ai/keys`)
- [ ] `NVIDIA_API_KEY=<key>` (from `https://build.nvidia.com` → NIM API keys)

### Macro data feed (optional)

- [ ] `FRED_API_KEY=<key>` (from `https://fredaccount.stlouisfed.org/apikeys` — optional; IMF/BIS sources work without it)

### NextAuth / admin console

- [ ] `NEXTAUTH_SECRET=<32-byte-hex>` (generate with `openssl rand -hex 32`)
- [ ] `NEXTAUTH_URL=https://mithqal.vercel.app` (production URL; for preview envs use the auto-deploy URL)
- [ ] `JWT_SECRET=<32-byte-hex>` (only if you want a separate JWT signing secret; `NEXTAUTH_SECRET` is used as fallback if unset)

### Operator account (env-defined, no user table)

- [ ] `ADMIN_EMAIL=coo@mithqal.io`
- [ ] `ADMIN_PASSWORD_HASH=<saltHex>:<hashHex>` (generate with the `node -e "const {scryptSync,randomBytes}=..."` snippet in `.env.example`)
- [ ] `OPERATOR_TOTP_SECRET=<base32-secret>` (only if enabling TOTP 2FA for the operator account; unset = 2FA off)
- [ ] `AUDIT_SIGNING_KEY=<32-byte-hex>` (used by `commercial-governance.ts` for audit-record signatures; falls back to a hardcoded dev key if unset — set a real secret in production)

### Operator-gate secrets (CRON + internal)

- [ ] `CRON_SECRET=<32-byte-hex>` (generate with `openssl rand -hex 32`; SAME value must be on the operator's cron runner)
- [ ] `INTERNAL_SECRET=<32-byte-hex>` (generate with `openssl rand -hex 32`; SAME value must be on every mini-service's env)

### SMTP (email — outbound)

- [ ] `SMTP_HOST=smtp.mail.me.com` (Apple iCloud) OR `smtp.sendgrid.net` (SendGrid) OR your provider's host
- [ ] `SMTP_PORT=587` (STARTTLS) OR `465` (implicit TLS)
- [ ] `SMTP_USER=<email-or-apikey>` (iCloud: full email; SendGrid: literal `apikey`)
- [ ] `SMTP_PASS=<app-specific-password-or-sendgrid-key>` (iCloud: NOT the Apple ID password — use App-Specific Password from `https://account.apple.com → Sign-In & Security → App-Specific Passwords`)
- [ ] `SMTP_FROM="Mithqal <noreply@mithqal.io>"` (optional; defaults to `Mithqal <SMTP_USER>`)
- [ ] `ADMIN_NOTIFY_EMAIL=<operator-inbox>` (destination for Formation Committee submissions + system alerts)

### Inngest (durable background jobs)

- [ ] `INNGEST_EVENT_KEY=<from-inngest-dashboard>` (from `https://app.inngest.com` → Apps → `mithqal` → Settings → Event Key)
- [ ] `INNGEST_SIGNING_KEY=<from-inngest-dashboard>` (from same page → Signing Key; the route `/api/inngest` returns 500 if this is missing or stale)

### Oracle / on-chain (MockOracle on Monad Testnet)

- [ ] `MOCK_ORACLE_ADDRESS=0x<address>` (deployed `MockOracle.sol` contract address; leave unset until you've run `forge create ...`)
- [ ] `DEPLOYER_PRIVATE_KEY=0x<private-key>` (the Foundry cast signing key for `/api/oracle/update`; **NOTE**: even with this set, the route returns 500 on Vercel because Foundry `cast` binary is not on the serverless PATH — separate ticket to bundle `cast` or rewrite using `viem`)

### Next.js public runtime (exposed to the browser)

- [ ] `NEXT_PUBLIC_WC_PROJECT_ID=<walletconnect-project-id>` (from `https://cloud.walletconnect.com`; if unset, the WalletConnect button in the UI is hidden)
- [ ] `NEXT_PUBLIC_APP_URL=https://mithqal.vercel.app` (used by `/api/health` for the canonical URL fallback)
- [ ] `NEXT_PUBLIC_CHAIN_ID=10143` (Monad Testnet chain ID; used by `/api/proofs/publish`)
- [ ] `NEXT_PUBLIC_VALIDATOR_PUBKEY=0x<pubkey>` (used by `/api/proofs/publish`; if unset, a deterministic dev pubkey is used)

### Vercel-platform-injected (DO NOT set manually)

- `VERCEL_URL` — auto-set by Vercel per-deploy
- `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` — auto-set by Vercel per-deploy
- `HOME` — auto-set to `/home/vercel` (or similar) by the serverless runtime

---

## 2. Inngest Cloud

> Set in: `https://app.inngest.com` → Apps → `mithqal` → Settings.
> Inngest GENERATES the keys for you; you do not set any env vars on
> Inngest itself — you COPY the generated keys to Vercel (see §1 above).

- [ ] App ID = `mithqal` (matches the `id` field in `src/lib/inngest-client.ts` line 34)
- [ ] Event Key generated → copy to Vercel `INNGEST_EVENT_KEY`
- [ ] Signing Key generated → copy to Vercel `INNGEST_SIGNING_KEY`
- [ ] Function `data-source-sync` registered (auto-registered on first deploy; verify in dashboard → Functions)
- [ ] Event trigger `sync/data-sources` configured (either Inngest-side cron, OR an external cron POSTing to `https://mithqal.vercel.app/api/inngest` with the signed payload — Inngest Cloud handles signing automatically once the app is registered)
- [ ] **Post-deploy smoke test**: `curl -s -o /dev/null -w "%{http_code}" https://mithqal.vercel.app/api/inngest` → expect **401** (key set, unsigned GET correctly rejected). If you see **500**, the signing key is missing or stale.

---

## 3. Turso DB

> Set in: `https://app.turso.tech` → `mithqal-db` (AWS us-east-1).

- [ ] Database exists: `mithqal-db` (group `fortleem`)
- [ ] Region: `aws-us-east-1` (matches Vercel's default egress region for low-latency reads)
- [ ] `DATABASE_URL=libsql://mithqal-db-fortleem.aws-us-east-1.turso.io` copied to Vercel + local `.env`
- [ ] Database token created: `turso db tokens create mithqal-db` (or via dashboard → Tokens → Create)
- [ ] `DATABASE_AUTH_TOKEN=<token>` copied to Vercel + local `.env`
- [ ] IP allow-list: default (Turso auto-allows Vercel egress IPs)
- [ ] Schema migrated: `turso db shell mithqal-db < prisma/schema.sql` (or via Prisma migrate)
- [ ] **Post-deploy smoke test**: `curl -s https://mithqal.vercel.app/api/status` → JSON contains `"db":"connected"`.

---

## 4. Neon (Fallback DB — MANUAL activation only)

> Set in: `https://console.neon.tech` → project `mithqal-fallback`.
> Provision WARM so the fallback is ready before it's needed. Do NOT
> flip `DATABASE_BACKEND` until you've completed the schema migration
> AND the code branch in `db.ts` is wired (currently NOT wired — see
> `NEON-SETUP.md` §4 and AI-FALLBACK-INNGEST-NEON task).

- [ ] Project exists: `mithqal-fallback`
- [ ] Region: AWS us-east-2 (different from Turso's us-east-1 — intentional, for region-isolation)
- [ ] Postgres version: 17
- [ ] Connection string copied: `postgresql://<user>:<pass>@ep-<id>.aws-us-east-2.neon.tech/<dbname>?sslmode=require`
- [ ] `NEON_DATABASE_URL=<above>` set in Vercel (Production + Preview + Development)
- [ ] `DATABASE_BACKEND=turso` set in Vercel (DEFAULT — keeps the app on Turso)
- [ ] Schema migrated from Turso: `turso db shell .dump > dump.sql` → adapt `INTEGER PRIMARY KEY` → `BIGSERIAL PRIMARY KEY` → `psql $NEON_DATABASE_URL -f dump.sql`
- [ ] Row-count verification: `psql $NEON_DATABASE_URL -c 'SELECT COUNT(*) FROM transactions'` matches Turso's count
- [ ] **Post-deploy smoke test**: `psql $NEON_DATABASE_URL -c 'SELECT 1'` → returns `1` (one row).
- [ ] **Activation procedure (incident-only)**: during a Turso outage, set `DATABASE_BACKEND=neon` in Vercel env vars, redeploy, monitor `/api/status` for `db:"connected"` against Neon. AFTER Turso recovers, do NOT auto-flip back — run a manual reconciliation first (Neon writes since the switchover must be back-filled to Turso).

---

## 5. GitHub (source of truth + backup target)

> Set in: `https://github.com/MITHQALMTQ/mithqal` (repo) +
> `https://github.com/settings/tokens` (PAT).

- [ ] Repo exists: `MITHQALMTQ/mithqal` (private)
- [ ] Branch protection applied on `main` (see `.github/branch-protection.json` — require PR review, status checks, no force-push)
- [ ] Immutable backup branch `backup/v25.5` created (push-only, no force, no delete — protects against destructive pushes)
- [ ] PAT scope: fine-grained, `Contents: Read & Write` on `MITHQALMTQ/mithqal` only
- [ ] `GITHUB_TOKEN=github_pat_<token>` written to local `.env` (NOT to Vercel — the token is only used by `mithqal-watchdog` running locally)
- [ ] Remote URL carries the embedded token: `git remote set-url origin https://x-access-token:<token>@github.com/MITHQALMTQ/mithqal.git`
- [ ] `mithqal-watchdog` daemon running (periodically encrypts `.env` → `.env.encrypted` → pushes to backup branch — see `mini-services/mithqal-watchdog/start-mithqal.sh`)
- [ ] Encrypted backup passphrase memorized by operator (NOT stored in any env file — the watchdog uses `openssl enc -pass env:VARNAME`, which expects the passphrase in an env var the operator types in at daemon start)
- [ ] **Post-deploy smoke test**: `git remote -v` shows URL containing `x-access-token:`; `git push --dry-run` exits 0.

---

## 6. Operator cron runner (consumes CRON_SECRET)

> Set in: the operator's cron runner env (could be a separate Vercel
> project, a GitHub Action, a dedicated VM, or `mini-services/mithqal-watchdog`).

- [ ] `CRON_SECRET=<SAME-32-byte-hex-as-Vercel>` — MUST match the Vercel env var exactly
- [ ] Cron schedule configured for:
  - `/api/oracle/update` — POST with header `x-cron-secret: <CRON_SECRET>` every 5 min (or per oracle refresh policy)
  - `/api/data-source-sync` — POST with header `x-cron-secret: <CRON_SECRET>` every 1 min (or per market-data refresh policy)
  - `/api/proofs/publish` — POST with header `x-cron-secret: <CRON_SECRET>` per validator cadence
- [ ] **Post-deploy smoke test**: `curl -X POST -H "x-cron-secret: $CRON_SECRET" https://mithqal.vercel.app/api/oracle/update` → expect 200 (or 500 if Foundry cast not yet bundled — separate ticket).

---

## 7. Mini-services (notify-service + discord-bot — consume INTERNAL_SECRET)

> Set in: each mini-service's own env (they run as separate Node
> processes, NOT inside the Next.js app). See
> `mini-services/notify-service/package.json` and
> `mini-services/discord-bot/package.json`.

### notify-service (port 3003)

- [ ] `INTERNAL_SECRET=<SAME-32-byte-hex-as-Vercel>` — MUST match the Vercel env var exactly
- [ ] Port configured: 3003 (default)
- [ ] CORS allow-list configured (post-4-A hardening — see `mini-services/notify-service/index.ts` line 14+)
- [ ] Process supervised (e.g. systemd, pm2, or `mithqal-watchdog`'s `startDetached`)
- [ ] **Post-deploy smoke test**: `curl -X POST -H "x-internal-secret: $INTERNAL_SECRET" -d '{"event":"test"}' http://localhost:3003/emit` → 200.

### discord-bot (port 3004)

- [ ] `INTERNAL_SECRET=<SAME-32-byte-hex-as-Vercel>`
- [ ] `DISCORD_BOT_TOKEN=<token>` (from `https://discord.com/developers/applications` → your bot → Bot → Token)
- [ ] `DISCORD_APP_ID=<app-id>` (from the same page → General Information → App ID)
- [ ] `DISCORD_NOTIFY_CHANNEL_ID=<channel-id>` (right-click the channel in Discord → Copy ID)
- [ ] `MITHQAL_API_BASE=https://mithqal.vercel.app` (for production) or `http://localhost:3000` (for local dev)
- [ ] `DISCORD_BOT_PORT=3004` (default)
- [ ] Bot invited to the target Discord server (OAuth2 URL Generator → scopes `bot` + `applications.commands`)
- [ ] Process supervised
- [ ] **Post-deploy smoke test**: bot connects to Discord Gateway (visible in process log); `/emit` endpoint accepts a test message and the message appears in the configured channel.

---

## 8. Local `.env` (developer workstation)

> Set in: `/home/z/my-project/.env` (gitignored). For local dev only;
> production uses Vercel env vars.

- [ ] `DATABASE_URL=file:/home/z/my-project/db/custom.db` (local SQLite fallback — works without a Turso account)
- [ ] `NEXTAUTH_URL=http://localhost:3000`
- [ ] All other vars: copy values from the operator's password manager (NEVER from `.env.example` which contains only placeholders)
- [ ] `GITHUB_TOKEN=<PAT>` (only if running `mithqal-watchdog` locally)
- [ ] `.env.encrypted` regenerated after every `.env` change (run `mithqal-watchdog` once, or manually `openssl enc -aes-256-cbc -salt -in .env -out .env.encrypted -pass env:<PASSPHRASE_VAR>`)
- [ ] **Smoke test**: `bun run dev` boots, `curl localhost:3000/api/health` → 200 + `status:"healthy"` with `smtp:{ok:false,...}` (expected — local dev has no SMTP).

---

## 9. Audit findings (operator action items — NOT in D4 scope to fix)

These are cross-cutting issues discovered during the env-var audit.
Each is a separate ticket:

1. **`.env.example` is out of sync with the codebase.** The template
   (last modified 2026-08-12) is missing 23 env vars the code reads
   (see `ENV-CROSS-CONNECTIONS.md` §6 for the full delta list).
   **Action**: extend `.env.example` with stub entries for every
   cataloged env var, grouped by platform.
2. **Foundry `cast` not on Vercel serverless PATH.**
   `/api/oracle/update` returns 500 in production even with
   `DEPLOYER_PRIVATE_KEY` set, because the route hardcodes
   `${process.env.HOME}/.foundry/bin/cast` (line 163). Vercel's
   Node.js image doesn't have Foundry installed.
   **Action**: bundle `cast` as a static binary in the function's
   output, OR rewrite the route to use `viem`/`ethers` for the
   `setGoldPrice` tx.
3. **`DATABASE_BACKEND` branch not yet wired in `db.ts`.** The Neon
   fallback runbook (`NEON-SETUP.md` §4) describes the
   `DATABASE_BACKEND`-gated branch shape, but the code branch was NOT
   added (only a documentation block at the top of `db.ts`).
   **Action**: implement the lazy `import @neondatabase/serverless`
   adapter per the runbook, behind the `DATABASE_BACKEND==="neon"`
   gate. Until this is wired, `NEON_DATABASE_URL` is a no-op in
   Vercel env vars.
4. **Discord bot UI staleness (from audit 2-C).**
   `components/mithqal-brain.tsx` only renders 3 of the 5 AI providers
   (`gemini`, `huggingface`, `groq`); `openrouter` and `nvidia`
   (added to the lib by AI-FALLBACK-INNGEST-NEON) are missing from
   the UI. **Action**: extend the component's `ModelStatus[]` type
   and render 5 cards.

---

**End of checklist.** For the cross-connection map, failure modes, and
the live health-check matrix, see `ENV-CROSS-CONNECTIONS.md`.
