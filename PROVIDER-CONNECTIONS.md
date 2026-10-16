# PROVIDER CONNECTIONS — MITHQAL Assurance
> Immutable reference document. Last updated: P95 (2026-10-16).
> This file documents the connection structure for ALL providers so nothing is ever lost or disconnected.

## Connection Map

```
GitHub (origin/main) ──push──> Vercel (auto-deploy)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                Turso DB        Neon DB        Inngest
            (primary, libsql)  (Postgres     (workflow
             aws-us-east-1      fallback)    orchestration)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              OpenRouter        GROQ          Gemini
           (✅ WORKING)      (key valid,    (needs new
           llama-3.3-70b     model wrong)    key)
                                    │
                              ┌─────┴─────┐
                              ▼           ▼
                          NVIDIA     HuggingFace
                        (models EOL) (no credits)
```

## 1. GitHub

| Property | Value |
|----------|-------|
| Remote URL | `https://github.com/MITHQALMTQ/MITHQAL.git` |
| Branch | `main` |
| Auth | `GITHUB_TOKEN` (Personal Access Token, `ghp_` prefix) |
| Push method | `git push origin main` (uses token in remote URL) |
| Branch protection | `allow_force_pushes=false`, `allow_deletions=false`, `enforce_admins=true`, `required_linear_history=true` |
| Backup tags | `backup-p84-stable`, `backup-p84-ai-consensus`, `backup-p95-ai-working`, `backup-p95-infra-complete` |

**Setup:**
```bash
git remote set-url origin "https://x-access-token:${GITHUB_TOKEN}@github.com/MITHQALMTQ/MITHQAL.git"
```

## 2. Vercel

| Property | Value |
|----------|-------|
| Project name | `mithqal` |
| Project ID | `prj_SrfvqPNzATQizbErM63pIzDlbzEI` |
| Live URL | `https://mithqal.vercel.app` |
| Auto-deploy | From `origin/main` on every push |
| Build command | `next build` (Next.js 16.1.3, Turbopack) |
| Env vars | 17 keys configured (see .env.example) |
| Build status | `READY` (P95 = `d30212e`) |

**Vercel env vars configured (17):**
- `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `NVIDIA_API_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`
- `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `DATABASE_BACKEND=turso`
- `INNGEST_API_KEY`, `INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`
- `NEON_DATABASE_URL`
- `MESSARI_API_KEY`, `FRED_API_KEY`, `DISCORD_BOT_TOKEN`

**API verification:**
```bash
# List deployments
curl -s "https://api.vercel.com/v6/deployments?projectId=prj_SrfvqPNzATQizbErM63pIzDlbzEI&limit=3" \
  -H "Authorization: Bearer $VERCEL_TOKEN"

# List env vars
curl -s "https://api.vercel.com/v9/projects/prj_SrfvqPNzATQizbErM63pIzDlbzEI/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN"
```

## 3. Turso (PRIMARY database)

| Property | Value |
|----------|-------|
| Database URL | `libsql://mtq-fortleem.aws-us-east-1.turso.io` |
| Region | `aws-us-east-1` |
| Auth | `TURSO_AUTH_TOKEN` (JWT, `eyJ` prefix) |
| Driver | `@libsql/client` (via `src/lib/db.ts`) |
| Connection test | `SELECT 1` → `{"test":1}` ✅ |
| Role | Primary database (DATABASE_BACKEND=turso) |

**Connection code** (`src/lib/db.ts`):
```typescript
import { createClient } from '@libsql/client';
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./db/custom.db',
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
```

## 4. Neon (Postgres fallback)

| Property | Value |
|----------|-------|
| Project ID | `shy-grass-38293780` |
| Database URL | `postgresql://neondb_owner:***@ep-steep-lab-b7spoxue-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require` |
| Region | `aws-us-east-1` (c-13) |
| Driver | `@neondatabase/serverless` (via `src/lib/db.ts`) |
| Connection test | `SELECT 1` → `{"test":1,"time":"2026-10-16T04:42:29.955Z"}` ✅ |
| Role | Fallback database (activated when `DATABASE_BACKEND=neon`) |
| Pooler | `ep-steep-lab-b7spoxue-pooler` (connection pooling) |

**Connection code:**
```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.NEON_DATABASE_URL);
const result = await sql`SELECT 1 as test`;
```

## 5. Inngest (workflow orchestration)

| Property | Value |
|----------|-------|
| App name | `mithqal` (registered on Inngest Cloud) |
| Functions registered | 1 (`dataSourceSync`) |
| Created | `2026-10-01T06:30:08Z` |
| API key | `INNGEST_API_KEY` (`sk-inn-` prefix) — v2 API access |
| Signing key | `INNGEST_SIGNING_KEY` (`signkey-prod-` prefix) — webhook verification |
| Event key | `INNGEST_EVENT_KEY` — event sending |
| Route handler | `src/app/api/inngest/route.ts` |
| v2 API endpoint | `GET https://api.inngest.com/v2/apps` (Bearer `INNGEST_API_KEY`) |
| Connection test | `GET /v2/apps` → HTTP 200 ✅ |

**Cron jobs** (`vercel.json`):
```json
{ "crons": [
  { "path": "/api/proofs/publish", "schedule": "0 0 * * *" },
  { "path": "/api/data-source-sync", "schedule": "0 6 * * *" }
]}
```

## 6. AI Consensus System

| Property | Value |
|----------|-------|
| Architecture | `src/lib/ai/` (5 providers + consensus + router) |
| Strategy | `Promise.allSettled()` → unanimous → majority → single-fallback |
| Working provider | OpenRouter (`meta-llama/llama-3.3-70b-instruct`) ✅ |
| Response time | ~1.4s |
| Tokens per request | max 100 (account credit limit) |
| Live endpoints | `/api/v1/ai/consensus`, `/api/v1/ai/status`, `/api/v1/explain` |

**Provider status:**
| Provider | Key valid? | Produces responses? | Issue |
|----------|-----------|--------------------|----|
| OpenRouter | ✅ | ✅ WORKING | — |
| GROQ | ✅ (no 403 on Vercel) | ❌ | Model name wrong (404) — need correct model from GROQ console |
| NVIDIA | ✅ | ❌ | All models EOL (410) — need current NIM models |
| Gemini | ❌ (401) | ❌ | Key invalid — generate new at Google AI Studio |
| HuggingFace | ✅ | ❌ | No credits (402) — add credits at HF settings |

## 7. Other Providers

| Provider | Status | Key env var | Notes |
|----------|--------|------------|-------|
| FRED API | ✅ Working | `FRED_API_KEY` | Economic data (GDP series) |
| Discord Bot | ✅ Working | `DISCORD_BOT_TOKEN` | Bot ID: 1534862703007629385 |
| Messari | ❌ 404 | `MESSARI_API_KEY` | Endpoint may have changed |
| AWS S3 | ❌ 403 | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` | Needs AWS Signature v4 auth |

## Recovery Instructions

If the system is ever lost or disconnected:

1. **Restore code**: `git clone https://github.com/MITHQALMTQ/MITHQAL.git && cd MITHQAL && git checkout backup-p95-ai-working`
2. **Restore .env**: Copy `.env.example` to `.env`, fill in real values from secure storage
3. **Install deps**: `bun install`
4. **Push to GitHub**: `git push origin main` (triggers Vercel auto-deploy)
5. **Verify Vercel**: Check `https://mithqal.vercel.app` returns HTTP 200
6. **Add Vercel env vars**: Use Vercel API or dashboard to add the 17 env vars (see list above)
7. **Trigger rebuild**: Push any commit to trigger a new deployment with env vars
8. **Verify AI**: `curl -X POST https://mithqal.vercel.app/api/v1/ai/consensus -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"hi"}]}'` should return a real response

## Backup Tags (immutable on GitHub)

| Tag | Commit | Description |
|-----|--------|-------------|
| `backup-p84-stable` | `8fa67b5` | Pre-AI stable point |
| `backup-p84-ai-consensus` | `7088ffc` | AI consensus system built |
| `backup-p95-ai-working` | `d30212e` | AI working on Vercel |
| `backup-p95-infra-complete` | `d30212e` | All infrastructure connected |

## Prevention of Rollback

- **GitHub branch protection**: `allow_force_pushes=false`, `enforce_admins=true` — no force-push possible
- **Annotated tags**: Cannot be moved without deleting them (which requires admin + force-push)
- **Linear history**: `required_linear_history=true` — no merge commits, clean history
- **Backup tags on GitHub**: Even if local repo is lost, tags exist on origin

---

**This file is committed to git and is immutable on GitHub. It serves as the permanent record of the provider connection structure.**
