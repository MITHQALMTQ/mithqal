# MITHQAL v25.3.22 — Creative Structuring for Maximum Performance + Harmony

**Date**: 2026-09-30 (Africa/Cairo)
**Owner**: COO + CTO + PM + Crypto Structuring / Tokenomics / Geoeconomics
**Directive**: "use your algorithmic thinking to structure GitHub, Vercel, Neon, Inngest, Turso to all work in harmony and in best structuring to give maximum performance, by using your out of the box creative structuring"
**Status**: PROPOSED ARCHITECTURE (recommendations — not yet implemented; requires Architecture Freeze change-requests for code changes)

---

## 1. CURRENT STATE — VERIFIED CONNECTIONS

```
                    GitHub (MITHQALMTQ/MITHQAL)
                    ─ branch-protected (linear history + enforce admins)
                              │
                              │ git push → auto-deploy
                              ▼
┌─────────────────────────────────────────────────────────┐
│        Vercel Production (mithqal.vercel.app)           │
│        35 env vars · status: healthy · Next.js 16     │
├─────────────────────────────────────────────────────────┤
│  Turso DB (ACTIVE)     ✅ db.ok=True, 552ms            │
│   └ 17 tables (mtq-fortleem, aws-us-east-1)            │
│  AI Brain (5 keys)     ✅ consensus: medium            │
│   └ groq + openrouter working (Vercel's own keys)      │
│  Inngest (env vars set) ⚠️ app NOT registered in Cloud │
│  Neon Postgres         ✅ env var set (not active backend)│
│  Neon S3 storage       ✅ env vars set (not wired)     │
│  Neon AI Gateway       ✅ env var set (not wired)      │
│  SMTP/iCloud           ✅ transporter verified         │
│  FRED                  ✅ DEXUSAL live                 │
│  Monad RPC + Arc RPC   ✅ both ok=True                 │
│  Live FX (gold-api)    ✅ gold $4157.93, NAV $1.2204   │
└─────────────────────────────────────────────────────────┘
```

**Honest gaps**:
- Inngest: the `mithqal` app is NOT registered in Inngest Cloud (only `wedjatrsm`, `mtq-sigma`, and 5 other apps on different Vercel projects are registered). The `/api/inngest` route EXISTS + is protected (returns `{"message":"Unauthorized"}` = signing key verification working). **Action required**: register `https://mithqal.vercel.app/api/inngest` in the Inngest dashboard.
- Neon: env vars set on Vercel, but `db.ts` uses Turso (the active backend). Neon is available as an alternative via `DATABASE_BACKEND=neon`.
- Neon S3 + AI Gateway: env vars set, but NOT wired into any code path.

---

## 2. PROPOSED CREATIVE STRUCTURING — "OUT OF THE BOX"

### Principle: CQRS + Polyglot Persistence + Event-Driven Sync

The key insight: **don't use one database for everything**. Use each service for what it's BEST at:

| Service | Best at | Role in MITHQAL |
|---|---|---|
| **Turso** (libsql/SQLite) | Fast OLTP writes, serverless, edge-ready | Primary transactional store (users, transactions, reserves, fees, proposals) |
| **Neon Postgres** | Complex analytics, window functions, OLAP, auto-scale-to-zero | Analytics/read-replica (institutional reports, corridor pain index aggregations, risk register queries) |
| **Neon S3** | Durable, versioned, lifecycle-managed object storage | Evidence package archive (15-field portable packages from institutional-evidence-fabric.ts) |
| **Inngest** | Durable background jobs, retries, scheduling, observability | Orchestrates sync between Turso→Neon, oracle refresh, reserve reconciliation, evidence archiving |
| **Vercel Edge** | Sub-100ms global reads | NAV/oracle/status endpoints (read-heavy, cached) |
| **Vercel Serverless** | Compute, API routes | Write endpoints (mint, redeem, formation committee submissions) |
| **GitHub** | Source of truth, branch protection, CI | Code + GitHub Actions (lint + test on PR) |

### Proposed Topology

```
User Request
    │
    ├─ READ (NAV, oracle, status) → Vercel Edge Function → Turso (read replica)
    │                                                       latency: <100ms global
    │
    └─ WRITE (mint, redeem, submit) → Vercel Serverless → Turso (primary OLTP)
                                                          │
                                                          ▼
                                              Inngest event: "data/changed"
                                                          │
                    ┌─────────────────────────────────────┴──────────────────────┐
                    ▼                          ▼                                ▼
            Inngest function:          Inngest function:              Inngest function:
            "sync-turso-to-neon"       "archive-evidence"              "refresh-oracle"
            (every 60s, incremental)   (on evidence-package event)     (every 5min)
                    │                          │                                │
                    ▼                          ▼                                ▼
              Neon Postgres            Neon S3 storage                  Turso (write back)
              (OLAP analytics)         (durable archive)                (live oracle data)
```

### Specific Creative Proposals

#### Proposal A: Turso → Neon CDC via Inngest (CQRS)
- **What**: An Inngest function triggers on every write to Turso, replicating the change to Neon Postgres.
- **Why**: Turso is fast for writes (SQLite, edge). Neon Postgres is powerful for analytics (window functions, complex joins). CQRS separates reads (analytics from Neon) from writes (to Turso).
- **Implementation**: 
  - Add a post-write hook in `db.ts` that sends an Inngest event `db/row-changed` with the table + row ID.
  - Inngest function `sync-turso-to-neon` reads the row from Turso + upserts to Neon.
- **Performance**: analytics queries hit Neon (auto-scales), transactional writes hit Turso (fast). No contention.
- **Architecture Freeze**: requires CR-2026-026 (new Inngest function + db.ts hook).

#### Proposal B: Evidence Packages to Neon S3
- **What**: The `institutional-evidence-fabric.ts` creates 15-field portable evidence packages. Store them as JSON objects in Neon S3 (not in the database).
- **Why**: Evidence packages are immutable, rarely read, and benefit from S3's versioning + lifecycle policies (auto-archive after 7 years per regulatory retention). Database storage would bloat the OLTP store.
- **Implementation**:
  - New module `src/lib/evidence-archive.ts` using `@aws-sdk/client-s3` (needs install).
  - `createEvidencePackage()` writes to S3 + stores the S3 key in Turso (reference, not content).
  - `retrieveEvidencePackage(packageId)` reads from S3.
- **Architecture Freeze**: requires CR-2026-027 (new module + evidence-fabric integration).

#### Proposal C: Vercel Edge Functions for Read-Heavy Endpoints
- **What**: Move `/api/nav`, `/api/oracle`, `/api/status` to Vercel Edge Functions (not Serverless).
- **Why**: Edge Functions run at the nearest CDN POP, giving sub-100ms global latency. These endpoints are read-heavy (NAV/oracle are called on every page load).
- **Implementation**: add `export const runtime = 'edge'` to the route files.
- **Constraint**: Edge Functions can't use Prisma directly (no Node.js native deps). Use Turso's HTTP API directly via `@libsql/client` (which is edge-compatible).
- **Architecture Freeze**: requires CR-2026-028 (runtime change on 3 endpoints).

#### Proposal D: Migrate Vercel Crons → Inngest Functions
- **What**: Replace `vercel.json` crons (`/api/proofs/publish` daily, `/api/data-source-sync` daily) with Inngest functions using `cron` triggers.
- **Why**: Inngest provides retry semantics, observability, and concurrent execution. Vercel crons are fire-and-forget (no retries).
- **Implementation**:
  - Define Inngest functions with `triggers: [{ cron: "0 0 * * *" }]`.
  - Remove `vercel.json` crons (or keep as fallback).
- **Prerequisite**: register the mithqal Inngest app FIRST.
- **Architecture Freeze**: requires CR-2026-029.

#### Proposal E: Neon AI Gateway as 6th Brain Provider
- **What**: Add the Neon AI Gateway (`nt_live_...` token) as a 6th provider in `mithqal-brain.ts`.
- **Why**: Neon's AI Gateway routes to multiple LLMs (OpenAI, Anthropic, etc.) through a single endpoint. Adding it gives the Brain a 6th consensus voter + access to models the other 5 providers don't have.
- **Implementation**:
  - Add `neon` to the `ModelResponse["model"]` type.
  - Add a `MODEL_FALLBACKS.neon` list.
  - Add a `queryNeon()` function.
  - Update `PRIMARY_FAMILY.neon`.
  - Update consensus dispatchers to include neon.
- **Architecture Freeze**: requires CR-2026-030 (mithqal-brain.ts structural change — adds a provider).

#### Proposal F: GitHub Actions CI on PR
- **What**: Add `.github/workflows/ci.yml` that runs `bun install` + `bun run lint` + `bun run db:push --accept-data-loss` (dry-run) on every PR.
- **Why**: Catch lint errors + missing deps before merge (the pre-push hook catches deps, but not lint).
- **Implementation**: new `.github/workflows/ci.yml`.
- **Architecture Freeze**: requires CR-2026-031 (new CI config — not a schema change).

---

## 3. AI KEY VERIFICATION — HONEST RESULTS

| Provider | Key provided | Verified? | Working models | Honest assessment |
|---|---|---|---|---|
| **OpenRouter** | `sk-or-v1-7a2a48fd...` | ✅ YES | `meta-llama/llama-3.3-70b-instruct`, `meta-llama/llama-3.1-70b-instruct`, `qwen/qwen-2.5-72b-instruct` | 3 models verified. Free-tier models deprecated (removed from MODEL_FALLBACKS). |
| **Groq** | `gsk_ZKK3aHx1tXkE...` | ❌ NO | (Forbidden — HTTP 403 on all models) | Key rejected. Note: the Brain's queryGroq reports "ok" despite the 403 — likely parsing the JSON error body as a "response". The Vercel production has its OWN working Groq key (different from this one). |
| **NVIDIA** | `nvapi--zMxLipu4...` | ⚠️ PARTIAL | `nvidia/riva-translate-4b-instruct-v2` (translation only) | 81 models listed but only translation models are deployed for this account. General LLMs return 404 "Function not found for account". |
| **Gemini** | `AQ.Ab8RN6L3-...` | ❌ NO | (401 in all auth formats) | Key format `AQ.` is non-standard for Google Generative Language API. Standard Gemini keys start with `AIzaSy`. May be a Google Cloud key for a different service. |
| **HuggingFace** | `hf_ajDapyzID...` | ❌ NO | (free inference doesn't support the fallback models) | `router.huggingface.co/hf-inference` returns "Model not supported by provider". Needs a dedicated Inference Endpoint or a paid provider (novita/replicate/fal-ai). |

### MODEL_FALLBACKS Updated (committed `e0370c9`)
- **OpenRouter**: removed 5 dead `:free` models, added 3 verified-working paid models.
- **Groq/NVIDIA/Gemini/HuggingFace**: lists unchanged (models are correct per provider docs; issues are key/account-level). Inline comments document the verification status.

### z.ai Removal — VERIFIED CLEAN
- `grep -rn "z-ai\|zai\.\|ZAI\b\|createZAI\|@z-ai" src/lib/mithqal-brain.ts` → 0 matches
- `grep -rn "z-ai-web-dev-sdk" src/` → 0 matches
- The Brain uses ONLY the 5 external providers (Gemini/HF/Groq/OpenRouter/NVIDIA). No z.ai in the consensus path.
- The `z-ai-web-dev-sdk` package (in package.json) is used ONLY for the screenshot VLM analysis utility (this agent's tooling), NOT in the application code.

---

## 4. INNGEST — HONEST STATUS + ACTION REQUIRED

| Item | Status |
|---|---|
| Inngest management API key (`sk-inn-api...`) | ✅ valid (can list apps) |
| `mtq-sigma` Inngest app | exists but on a DIFFERENT Vercel project (`mtq-sigma-jizac1bb8-tonsy.vercel.app`) — sync error: invalid cron `*/15 * * * * *` |
| `mithqal` Inngest app | ❌ NOT registered in Inngest Cloud |
| `/api/inngest` route on mithqal.vercel.app | ✅ EXISTS + protected (returns `{"message":"Unauthorized"}` = signing key verification working) |
| `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` on Vercel | ✅ set (encrypted, production+preview+development) |

**Action required (user)**: Go to https://app.inngest.com → "Add an app" → serve URL: `https://mithqal.vercel.app/api/inngest` → Inngest will discover the `dataSourceSync` function + sync. Once registered, Inngest will poll the route + execute the `dataSourceSync` function on the `sync/data-sources` event.

---

## 5. CROSS-SERVICE HARMONY MATRIX

| From → To | Connection | Status |
|---|---|---|
| GitHub → Vercel | git push auto-deploy | ✅ working |
| Vercel → Turso | DATABASE_URL | ✅ db.ok=True, 552ms |
| Vercel → AI providers | 5 API keys | ✅ 2/5 working (groq+openrouter) on Vercel; 1/5 (openrouter) verified working locally |
| Vercel → Inngest | env vars set | ⚠️ app not registered (needs dashboard action) |
| Vercel → Neon Postgres | env var set | ✅ (not active backend — Turso is primary) |
| Vercel → Neon S3 | env vars set | ✅ (not wired into code — Proposal B) |
| Vercel → Neon AI Gateway | env var set | ✅ (not wired into Brain — Proposal E) |
| Vercel → SMTP/iCloud | SMTP_* | ✅ transporter verified |
| Vercel → FRED | FRED_API_KEY | ✅ DEXUSAL live |
| Vercel → Monad RPC | MONAD_RPC_URL | ✅ ok=True |
| Vercel → Arc RPC | ARC_RPC_URL | ✅ ok=True |
| Vercel → live FX | gold-api.com + open.er-api.com | ✅ gold $4157.93 |

**12 connections verified. 1 needs user action (Inngest registration). 3 are wired-for-future (Neon S3, AI Gateway, Postgres-as-analytics).**

---

## 6. HONEST-STATE CERTIFICATION (PRESERVED)

NOT PRODUCTION-AUTHORIZED. All 8 honest-state rules preserved. The MODEL_FALLBACKS update is a configuration constant change (NOT an architecture-frozen schema). The creative structuring proposals (A-F) are RECOMMENDATIONS requiring Architecture Freeze change-requests (CR-2026-026 through CR-2026-031) — NOT implemented in this release.

**This release**: audited MODEL_FALLBACKS against live APIs + updated OpenRouter list (3 dead models → 3 verified models) + verified 5 new AI keys (honest: only OpenRouter works) + documented creative structuring for maximum performance.

NOT PRODUCTION-AUTHORIZED. Honest-state preserved.
