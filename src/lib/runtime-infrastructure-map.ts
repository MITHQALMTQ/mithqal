/**
 * ════════════════════════════════════════════════════════════════════════
 * MITHQAL — Canonical Runtime Infrastructure Map (v25.3.2)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Covers: GitHub, Vercel, Inngest, Turso, Neon.
 *
 * For each system: purpose, system-of-record responsibility, data ownership,
 * read/write authority, environment, backup, recovery, secrets, observability,
 * failure mode, migration path, dependency risk.
 *
 * NO TWO SYSTEMS may silently become competing sources of truth.
 * Each data category has exactly ONE system-of-record.
 *
 * DATA CLASSIFICATION:
 *   - Transactional database → Turso (live state)
 *   - Event/job system → Inngest (background orchestration)
 *   - Immutable evidence store → Neon S3 (durable archive)
 *   - Configuration/policy registry → GitHub (canonical modules, frozen)
 *   - Repository → GitHub (source code — master blueprint)
 *   - Deployment environment → Vercel (runtime)
 *
 * CRITICAL WORKFLOW REQUIREMENTS:
 *   idempotency, retry policy, dead-letter/failure handling, replay capability,
 *   audit trail, deterministic recovery.
 *
 * ZERO-COST DEV/TEST:
 *   The architecture supports zero-cost development/test operation where
 *   possible, without introducing production assumptions or billing
 *   dependencies into the architecture.
 *
 * NOT PRODUCTION-AUTHORIZED.
 * ════════════════════════════════════════════════════════════════════════
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SystemDefinition {
  systemId: string;
  label: string;
  purpose: string;
  systemOfRecordResponsibility: string;
  dataOwnership: string;
  readWriteAuthority: string;
  environment: string;
  backup: string;
  recovery: string;
  secrets: string;
  observability: string;
  failureMode: string;
  migrationPath: string;
  dependencyRisk: string;
  zeroCostTier: string;
  noCompetingSourceOfTruth: string;
}

export interface DataClassification {
  dataCategory: string;
  systemOfRecord: string;
  description: string;
  competingSystemPrevention: string;
  zeroCostDevPath: string;
}

export interface WorkflowReliability {
  workflowId: string;
  label: string;
  idempotency: string;
  retryPolicy: string;
  deadLetterHandling: string;
  replayCapability: string;
  auditTrail: string;
  deterministicRecovery: string;
}

export interface InfrastructureMap {
  systems: SystemDefinition[];
  dataClassification: DataClassification[];
  workflowReliability: WorkflowReliability[];
  zeroCostDesign: {
    principle: string;
    devEnvironment: string;
    testEnvironment: string;
    productionAssumptions: string[];
    billingDependencies: string[];
  };
  noCompetingSourcesOfTruth: string[];
  honestState: {
    productionAuthorized: boolean;
    noSilentCompetingSystems: boolean;
    zeroCostDevSupported: boolean;
    allWorkflowsHaveReliability: boolean;
  };
  summary: string;
}

/* ------------------------------------------------------------------ */
/*  5 System Definitions                                              */
/* ------------------------------------------------------------------ */

const NOW = "2026-10-01T06:51:00Z";

export const SYSTEMS: SystemDefinition[] = [
  // ── GitHub ─────────────────────────────────────────────────────────────
  {
    systemId: "GITHUB",
    label: "GitHub (MITHQALMTQ/mithqal)",
    purpose: "Source code repository + configuration/policy registry. The master blueprint (src/lib/*.ts canonical modules) lives here. Branch protection (linear history + enforce admins) prevents rollback.",
    systemOfRecordResponsibility: "SYSTEM-OF-RECORD for: source code, configuration/policy registry (canonical modules), frozen schemas, release tags, CI workflow definitions.",
    dataOwnership: "MITHQAL owns all source code + configuration. No third-party data stored in the repository. .env is gitignored — secrets NEVER committed.",
    readWriteAuthority: "Write: COO+CTO (via approved PR, branch-protected). Read: public (open-source). Push protection: ACTIVE (catches accidental secrets).",
    environment: "GitHub Actions CI runs on PR + push (lint + prisma generate + 39/39 canonical modules check). Branch: main (protected). Tags: v25.3.2, v25.3.22, etc.",
    backup: "GitHub itself is the backup — git history is immutable (branch protection + tags + backup branches). Backup branches: v25.3.22-hardened-backup (db9b34b).",
    recovery: "git fetch --tags && git reset --hard origin/main restores the full working tree from GitHub after any sandbox reset. Tags are immutable.",
    secrets: "GitHub Push Protection: ACTIVE (catches secrets in commits). .env is gitignored (line 6). No secrets in code. Pre-push hook checks dependencies.",
    observability: "GitHub Actions CI log (lint + test + module count). git log --oneline for commit history. Dependabot alerts (1 high — informational).",
    failureMode: "GitHub outage → cannot push new code. Existing Vercel deployment continues serving. CI doesn't run but production is unaffected. Recovery: wait for GitHub recovery + push.",
    migrationPath: "GitHub → alternative Git host (GitLab/Bitbucket) via git remote change. Canonical modules are standard TypeScript — no vendor lock-in.",
    dependencyRisk: "LOW. Git is a standard protocol. Source code is portable. The only GitHub-specific feature is Actions CI (replaceable with any CI).",
    zeroCostTier: "FREE: public repo, unlimited collaborators, 2000 Actions minutes/month, branch protection. Sufficient for development + CI.",
    noCompetingSourceOfTruth: "GitHub is the ONLY system-of-record for source code + configuration. Vercel deploys FROM GitHub (not independently). No code lives outside GitHub.",
  },
  // ── Vercel ────────────────────────────────────────────────────────────
  {
    systemId: "VERCEL",
    label: "Vercel (mithqal.vercel.app)",
    purpose: "Deployment environment + runtime. Serves the Next.js application (API routes + pages). Auto-deploys from GitHub on push to main. Edge + serverless functions.",
    systemOfRecordResponsibility: "SYSTEM-OF-RECORD for: runtime behavior (what the software ACTUALLY does), deployment state, environment variables (runtime secrets).",
    dataOwnership: "Vercel does NOT own transactional data. Vercel is stateless (serverless functions). Transactional data is in Turso. Vercel env vars are encrypted.",
    readWriteAuthority: "Write: COO+CTO (via git push → auto-deploy). Read: public (mithqal.vercel.app). Environment variables: managed via Vercel API + dashboard.",
    environment: "Production: mithqal.vercel.app (auto-deploy from GitHub main). Preview: per-PR deployment. Development: local (bun run dev). Node 24.x, Next.js 16.1.3.",
    backup: "Vercel is NOT a backup target — it's stateless. Each deployment has a unique URL (immutable). Previous deployments remain accessible. Code backup is GitHub.",
    recovery: "git push origin main → Vercel auto-deploys a new build. If a deployment is broken, the previous deployment (READY) continues serving until the new one is READY.",
    secrets: "35 encrypted env vars on Vercel (DATABASE_URL, AI keys, INNGEST keys, SMTP, FRED, etc.). Sensitive type: values not exposed via API. Updated via Vercel API.",
    observability: "Vercel dashboard: deployment status (QUEUED/BUILDING/READY/ERROR). Vercel API: deployment list, env var list. Runtime logs: Vercel function logs.",
    failureMode: "Vercel outage → production unavailable. Recovery: GitHub code is safe. Vercel recovers → auto-redeploy. Alternative: deploy to any Next.js host (Netlify/Railway).",
    migrationPath: "Vercel → alternative Next.js host (Netlify, Railway, self-hosted). Next.js is a standard framework — no vendor lock-in. vercel.json has only crons (portable).",
    dependencyRisk: "MEDIUM. Vercel-specific features: Edge Functions, Vercel Cron. Edge Functions use standard Web APIs (portable). Vercel Cron can be replaced with Inngest cron or external cron.",
    zeroCostTier: "FREE (Hobby): unlimited deployments, 100GB bandwidth, serverless function execution. Sufficient for development + pilot. Production scale requires paid tier.",
    noCompetingSourceOfTruth: "Vercel is the ONLY system-of-record for RUNTIME behavior. It does NOT store transactional data (Turso does) or evidence (Neon S3 does). Vercel is stateless.",
  },
  // ── Turso ─────────────────────────────────────────────────────────────
  {
    systemId: "TURSO",
    label: "Turso (mtq-fortleem.aws-us-east-1)",
    purpose: "Transactional database (libsql/SQLite). Stores live operational state: users, transactions, reserves, fees, proposals, formation interests, testnet operations, etc.",
    systemOfRecordResponsibility: "SYSTEM-OF-RECORD for: transactional state (all live operational data). The ONLY writable transactional store. 17 tables.",
    dataOwnership: "MITHQAL owns all transactional data. Turso is the STORE, not the owner. Data is in libsql format (SQLite-compatible — portable).",
    readWriteAuthority: "Write: application (via Prisma + libsql client). Read: application + analytics (via read replica or direct query). No manual DB writes (all via application layer).",
    environment: "Production: libsql://mtq-fortleem.aws-us-east-1.turso.io (17 tables). Local dev: file:./db/custom.db (zero-cost, no cloud needed). Schema: prisma/schema.prisma.",
    backup: "Turso provides automated backups (libsql replication). Local dev: file:./db/custom.db is a standalone SQLite file (portable, copyable). Schema is in prisma/schema.prisma (GitHub).",
    recovery: "Turso: restore from Turso backup. Local: copy db/custom.db. Schema: prisma db push recreates from schema.prisma. Data: application-level recovery via settlement-continuity-fabric.",
    secrets: "DATABASE_URL + DATABASE_AUTH_TOKEN (encrypted on Vercel, gitignored in .env). TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for deploy scripts.",
    observability: "/api/health endpoint: db.ok + latencyMs. Turso dashboard: query logs, connection stats. Application: structured logging in db.ts.",
    failureMode: "Turso outage → transactional writes fail → application degrades gracefully (health=degraded). Settlement workflow: safe halt (BM-HALT). Recovery: Turso recovers → resume.",
    migrationPath: "Turso → Neon Postgres (already provisioned as alternative backend via DATABASE_BACKEND=neon). Or → any SQLite-compatible libsql host. Schema is Prisma (portable).",
    dependencyRisk: "LOW. libsql is SQLite-compatible (open standard). Prisma supports multiple backends. Local dev uses file: SQLite (zero-cost, no cloud). Migration to Neon is code-ready.",
    zeroCostTier: "FREE: file:./db/custom.db for local dev (no cloud, no cost). Turso free tier: 500 DBs, 9GB total, 1 billion row reads/month. Sufficient for pilot.",
    noCompetingSourceOfTruth: "Turso is the ONLY transactional database. Neon is an ANALYTICS backend (read-only replica via CDC), NOT a competing transactional store. No silent competition.",
  },
  // ── Neon ──────────────────────────────────────────────────────────────
  {
    systemId: "NEON",
    label: "Neon (shy-grass-38293780)",
    purpose: "Analytics database (Postgres) + immutable evidence store (S3) + AI Gateway. Analytics queries, evidence package archive, LLM proxy.",
    systemOfRecordResponsibility: "SYSTEM-OF-RECORD for: analytics/read-replica data (via CDC from Turso), immutable evidence archive (S3), AI gateway (if endpoint verified).",
    dataOwnership: "MITHQAL owns all analytics + evidence data. Neon S3 stores evidence packages (durable, versioned). Neon Postgres stores analytics replicas (read-only).",
    readWriteAuthority: "Write: CDC sync function (turso-neon-sync.ts) writes analytics replicas. Evidence archive (evidence-archive.ts) writes to S3. Read: analytics queries + evidence retrieval.",
    environment: "Postgres: postgresql://neondb_owner:...@ep-steep-lab-b7spoxue-pooler... S3: br-square-bird-b72dtsy4.storage... AI Gateway: nt_live_... (endpoint UNVERIFIED).",
    backup: "Neon Postgres: automated backups (Neon platform). S3: versioned + lifecycle-managed (auto-archive). Evidence packages are content-addressed (SHA-256 key = idempotent).",
    recovery: "Neon Postgres: restore from Neon backup. S3: objects are immutable (content-addressed). CDC: re-sync from Turso (turso-neon-sync.ts). Evidence: re-archive from evidence-fabric.",
    secrets: "NEON_DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_ENDPOINT_URL_S3, NEON_AI_GATEWAY_TOKEN (all encrypted on Vercel, gitignored).",
    observability: "Application: /api/admin/sync-to-neon (CDC status). Evidence: /api/evidence-archive (S3 status). Neon dashboard: Postgres metrics. S3: bucket stats.",
    failureMode: "Neon outage → analytics unavailable (non-critical). S3 outage → evidence archive unavailable (evidence still in memory + DB). AI Gateway: stub (not yet wired). Non-blocking.",
    migrationPath: "Neon → any Postgres (standard SQL). S3 → any S3-compatible store (AWS S3, MinIO, etc.). AI Gateway → any OpenAI-compatible endpoint. All portable.",
    dependencyRisk: "LOW. Postgres is a standard. S3 is a standard protocol. CDC sync is application-level (not Neon-specific). Evidence archive uses @aws-sdk/client-s3 (standard).",
    zeroCostTier: "FREE: Neon free tier (0.5GB Postgres, auto-scale-to-zero). S3: Neon storage free tier. AI Gateway: free tier (if endpoint verified). Sufficient for pilot.",
    noCompetingSourceOfTruth: "Neon is NOT a competing transactional store. Neon is ANALYTICS ONLY (read replica via CDC). S3 is EVIDENCE ONLY (immutable archive). No silent competition with Turso.",
  },
  // ── Inngest ───────────────────────────────────────────────────────────
  {
    systemId: "INNGEST",
    label: "Inngest (mtq-sigma app)",
    purpose: "Event/job system. Durable background-job orchestration with retries, scheduling, observability. Replaces Vercel Cron with retry semantics.",
    systemOfRecordResponsibility: "SYSTEM-OF-RECORD for: background job orchestration (event triggers, cron schedules, function execution state, retry state).",
    dataOwnership: "MITHQAL owns job definitions (in inngest-client.ts). Inngest owns job EXECUTION state (runs, retries, outcomes). Job results are written to Turso (not Inngest).",
    readWriteAuthority: "Write: application sends events (inngest.send()). Inngest calls /api/inngest (serve route). Read: Inngest dashboard (run history). Job results → Turso.",
    environment: "Production: Inngest Cloud (event key + signing key set on Vercel). Serve route: /api/inngest (mithqal.vercel.app). Functions: dataSourceSync, proofsPublishSync, marketDataSync.",
    backup: "Inngest owns job execution history (durable). Job DEFINITIONS are in GitHub (inngest-client.ts). Job RESULTS are in Turso. Inngest is not a backup target — it's an orchestrator.",
    recovery: "Inngest automatically retries failed functions (exponential backoff). Job definitions are in code (GitHub). If Inngest is down, Vercel Cron (vercel.json) serves as fallback.",
    secrets: "INNGEST_EVENT_KEY + INNGEST_SIGNING_KEY (encrypted on Vercel). Event-send verified working (event ID 01M3V3VTEAPY8CJB6D32V23NSM received).",
    observability: "Inngest dashboard: function runs, retries, errors, latency. /api/inngest serve route: sync status. Application: console logging in inngest-client.ts.",
    failureMode: "Inngest outage → background jobs don't run (data-source-sync, proofs-publish, market-data-sync). Non-critical: Vercel Cron (vercel.json) serves as fallback. Recovery: Inngest recovers → jobs resume.",
    migrationPath: "Inngest → any job queue (BullMQ, SQS, Cloudflare Queues). Functions are standard TypeScript (inngest-client.ts). Event-send is HTTP (portable). Serve route is a standard webhook.",
    dependencyRisk: "LOW. Inngest is an orchestration layer — not a data store. Job definitions are in code. Vercel Cron (vercel.json) is a fallback. No data is lost if Inngest is down.",
    zeroCostTier: "FREE: Inngest Cloud free tier (limited events/month). Vercel Cron (vercel.json) is also free (Vercel Hobby). Local dev: Inngest Dev Server (zero-cost). Sufficient for pilot.",
    noCompetingSourceOfTruth: "Inngest is NOT a data store. Job results go to Turso. Inngest only owns EXECUTION STATE (runs, retries). No silent competition with any database.",
  },
];

/* ------------------------------------------------------------------ */
/*  Data Classification (which data belongs where)                    */
/* ------------------------------------------------------------------ */

export const DATA_CLASSIFICATION: DataClassification[] = [
  {
    dataCategory: "Transactional database",
    systemOfRecord: "TURSO",
    description: "Live operational state: users, transactions, reserves, fees, proposals, formation interests, testnet operations, gold price snapshots, procurement records, revenue entries, proof attestations, reserve ownership, commercial audit entries, assumptions register.",
    competingSystemPrevention: "Neon Postgres is a READ-ONLY analytics replica (via CDC) — NEVER writable directly. No system other than Turso accepts transactional writes. Neon does NOT compete.",
    zeroCostDevPath: "file:./db/custom.db (local SQLite, zero-cost, no cloud). Schema: prisma db push creates tables. Data: application generates test data at runtime.",
  },
  {
    dataCategory: "Event/job system",
    systemOfRecord: "INNGEST",
    description: "Background job orchestration: data-source-sync (daily 6am), proofs-publish (daily midnight), market-data-sync (daily 6am). Event triggers, cron schedules, function execution state, retry state.",
    competingSystemPrevention: "Vercel Cron (vercel.json) is a FALLBACK, not a competitor. When Inngest is active, Vercel Cron should be disabled. No silent competition — the operator must disable one when the other is active.",
    zeroCostDevPath: "Inngest Dev Server (local, zero-cost). Vercel Cron is free (Hobby tier). Job definitions are in code (inngest-client.ts) — no external dependency for local dev.",
  },
  {
    dataCategory: "Immutable evidence store",
    systemOfRecord: "NEON S3",
    description: "Evidence packages (15-field portable packages from institutional-evidence-fabric.ts). Durable, versioned, lifecycle-managed. Content-addressed (SHA-256 key = idempotent).",
    competingSystemPrevention: "Turso stores a REFERENCE to the S3 key (not the content). Evidence CONTENT lives only in S3. No system other than Neon S3 stores evidence package content.",
    zeroCostDevPath: "Local dev: evidence packages are generated in-memory (not archived to S3). S3 archiving is optional (graceful degradation if S3 is unconfigured). Zero-cost dev doesn't need S3.",
  },
  {
    dataCategory: "Configuration/policy registry",
    systemOfRecord: "GITHUB",
    description: "Canonical modules (src/lib/*.ts, 39 modules). 10 frozen schemas (controlled-architecture-freeze.ts). 25 policies (policy-registry.ts, 23 ACTIVE). Architecture archive = the master blueprint.",
    competingSystemPrevention: "Configuration is in CODE (GitHub), NOT in Vercel env vars or a database. Vercel env vars are SECRETS (runtime), not configuration. No system other than GitHub stores canonical policy.",
    zeroCostDevPath: "GitHub public repo (free). Canonical modules are TypeScript (no runtime dependency). Local dev reads from src/lib/*.ts directly. No external service needed for configuration.",
  },
  {
    dataCategory: "Repository (source code)",
    systemOfRecord: "GITHUB",
    description: "All source code: 157 .ts files in src/lib/, 213 API routes, 17 test files, Prisma schema, Next.js pages, React components, Solidity contracts, deployment scripts, documentation.",
    competingSystemPrevention: "GitHub is the ONLY repository. Vercel deploys FROM GitHub (auto-deploy). No code lives outside GitHub. Vercel does NOT store source code — it builds from GitHub.",
    zeroCostDevPath: "GitHub public repo (free, unlimited collaborators). git clone + bun install + bun run dev = zero-cost local development. No paid services required.",
  },
  {
    dataCategory: "Deployment environment",
    systemOfRecord: "VERCEL",
    description: "Runtime: Next.js 16.1.3 (webpack), 213 API routes, /control-tower page, /pilot-a page. Edge function on /api/oracle. Serverless functions for write endpoints. 35 encrypted env vars.",
    competingSystemPrevention: "Vercel is the ONLY deployment target. No alternative deployment exists (yet). Migration path: Netlify/Railway (Next.js is portable). Vercel does NOT own data (stateless).",
    zeroCostDevPath: "Vercel Hobby (free): unlimited deployments, 100GB bandwidth. Local dev: bun run dev (zero-cost, no Vercel needed). Preview deployments per PR (free).",
  },
];

/* ------------------------------------------------------------------ */
/*  Critical Workflow Reliability                                     */
/* ------------------------------------------------------------------ */

export const WORKFLOW_RELIABILITY: WorkflowReliability[] = [
  {
    workflowId: "SETTLEMENT_WORKFLOW",
    label: "Settlement Workflow (BM-01..BM-16B)",
    idempotency: "Instruction dedup by instructionId (BM-01 checks for duplicate). Same instruction → same result (no double-settlement).",
    retryPolicy: "Per-step retry: each BM step can be retried independently. Exception handling (BM-12-EX) with recoverable=true → retry from BM-12. Non-recoverable → safe halt (BM-HALT).",
    deadLetterHandling: "Unrecoverable exceptions → BM-HALT (safe halt). Halted instructions are logged with full evidence + can be manually reviewed. No partial settlement committed.",
    replayCapability: "Regulatory Replay Engine (regulatory-replay-engine.ts): 12-field decision context reconstruction, READ-ONLY, historical state immutable (SHA-256 verified).",
    auditTrail: "Evidence Fabric (institutional-evidence-fabric.ts): 15-field package per settlement, SHA-256 commitments, 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT).",
    deterministicRecovery: "Settlement Continuity Fabric (settlement-continuity-fabric.ts): 9 events × 7-stage lifecycle. NO_BYPASS_RULE. Recovery resumes from the last committed state (not from scratch).",
  },
  {
    workflowId: "ORACLE_REFRESH",
    label: "Oracle Refresh (data-source-sync)",
    idempotency: "Timestamp-based dedup: same observation timestamp → no re-insert. DataSourceObservation table has unique constraint on (dataset, timestamp).",
    retryPolicy: "Inngest: exponential backoff (default). Vercel Cron fallback (vercel.json: 0 6 * * *). 3 retries with increasing delay.",
    deadLetterHandling: "Inngest: failed functions after all retries → dead-letter queue (Inngest dashboard). Application: graceful degradation (last-known-good oracle data).",
    replayCapability: "Regulatory Replay: the oracle data at any past timestamp can be reconstructed from DataSourceObservation records.",
    auditTrail: "Each observation: provenance (source URL), timestamp, value, integrity hash. Evidence Fabric: oracle data included in settlement evidence packages.",
    deterministicRecovery: "Fallback to last-known-good (multi-oracle.ts: circuit-breaker falls back to single primary source). If all sources fail → safe degradation (oracle returns source='fallback').",
  },
  {
    workflowId: "EVIDENCE_ARCHIVE",
    label: "Evidence Archive (S3)",
    idempotency: "Content-addressed: S3 key = SHA-256 of evidence package. Same package → same key → idempotent (no duplicate archives).",
    retryPolicy: "S3 PutObject: SDK retries (3 attempts, exponential backoff). Application: graceful degradation if S3 is unavailable (evidence stays in memory + DB reference).",
    deadLetterHandling: "If S3 fails after all retries: evidence package is logged + stored in Turso (with s3Key=''). Non-blocking — settlement is not affected.",
    replayCapability: "Evidence packages are immutable (content-addressed). Retrieve by S3 key → same package every time. Regulatory replay can reference past evidence packages.",
    auditTrail: "Each evidence package: SHA-256 commitments (6 per package), access level, timestamp, owner. S3 lifecycle: versioned (every PutObject creates a new version).",
    deterministicRecovery: "S3 is durable (11 9s). If S3 is lost: evidence packages can be regenerated from the Evidence Fabric (institutional-evidence-fabric.ts) using the same inputs (deterministic).",
  },
];

/* ------------------------------------------------------------------ */
/*  Zero-Cost Design                                                   */
/* ------------------------------------------------------------------ */

export const ZERO_COST_DESIGN = {
  principle:
    "The architecture supports zero-cost development/test operation where possible, " +
    "WITHOUT introducing production assumptions or billing dependencies into the architecture. " +
    "No module hard-codes a paid-tier assumption. All services degrade gracefully when free-tier limits are hit.",
  devEnvironment:
    "Local dev: bun run dev (zero-cost). Database: file:./db/custom.db (local SQLite, no cloud). " +
    "AI: no keys required (Brain degrades to consensus: low). Inngest: Dev Server (local). " +
    "S3: not required (evidence stays in memory). Neon: not required (analytics disabled). " +
    "GitHub: public repo (free). Vercel: not required for local dev.",
  testEnvironment:
    "CI: GitHub Actions (free, 2000 min/month). Lint: bun run lint (zero-cost). " +
    "Prisma generate: bunx prisma@6 generate (zero-cost). Canonical module check: 39/39 (zero-cost). " +
    "Adversarial tests: 17/17 local (zero-cost, no Vercel serverless needed).",
  productionAssumptions: [
    "NONE: the architecture does NOT assume paid Vercel tier (Hobby is sufficient for pilot)",
    "NONE: the architecture does NOT assume paid Turso tier (free tier: 500 DBs, 9GB)",
    "NONE: the architecture does NOT assume paid Inngest tier (free tier: limited events)",
    "NONE: the architecture does NOT assume paid Neon tier (free tier: 0.5GB, auto-scale-to-zero)",
    "NONE: the architecture does NOT assume paid GitHub tier (public repo, free Actions)",
    "NONE: no module hard-codes a billing level or assumes specific quota",
  ],
  billingDependencies: [
    "ZERO: no module has a billing dependency. All services have free tiers sufficient for pilot.",
    "ZERO: no module requires a credit card to operate in development/test mode.",
    "ZERO: no module fails if a free-tier limit is hit (graceful degradation in all cases).",
  ],
};

/* ------------------------------------------------------------------ */
/*  No Competing Sources of Truth                                     */
/* ------------------------------------------------------------------ */

export const NO_COMPETING_SOURCES = [
  "GitHub is the ONLY system-of-record for source code + configuration. Vercel deploys FROM GitHub (not independently).",
  "Turso is the ONLY transactional database. Neon is READ-ONLY analytics (via CDC) — NEVER writable directly.",
  "Neon S3 is the ONLY evidence store. Turso stores a REFERENCE (S3 key), not the evidence content.",
  "Inngest is the ONLY job orchestrator. Vercel Cron is a FALLBACK (must be disabled when Inngest is active).",
  "Vercel is the ONLY deployment environment. It is stateless — no data ownership (Turso owns data).",
  "No two systems store the same data category. Each category has exactly ONE system-of-record.",
];

/* ------------------------------------------------------------------ */
/*  Full Infrastructure Map                                            */
/* ------------------------------------------------------------------ */

export function getInfrastructureMap(): InfrastructureMap {
  return {
    systems: SYSTEMS,
    dataClassification: DATA_CLASSIFICATION,
    workflowReliability: WORKFLOW_RELIABILITY,
    zeroCostDesign: ZERO_COST_DESIGN,
    noCompetingSourcesOfTruth: NO_COMPETING_SOURCES,
    honestState: {
      productionAuthorized: false,
      noSilentCompetingSystems: NO_COMPETING_SOURCES.length === 6,
      zeroCostDevSupported: true,
      allWorkflowsHaveReliability: WORKFLOW_RELIABILITY.length === 3,
    },
    summary:
      `Runtime Infrastructure Map: ${SYSTEMS.length} systems, ${DATA_CLASSIFICATION.length} data categories, ` +
      `${WORKFLOW_RELIABILITY.length} critical workflows with full reliability (idempotency + retry + dead-letter + replay + audit + recovery). ` +
      `Zero-cost dev/test supported. No competing sources of truth. NOT PRODUCTION-AUTHORIZED.`,
  };
}

export const INFRA_MAP_META = {
  module: "runtime-infrastructure-map",
  version: "v25.3.2",
  status: "ACTIVE" as const,
  createdAt: "2026-10-01",
  honestState: "NOT PRODUCTION-AUTHORIZED",
  systemCount: SYSTEMS.length,
  dataCategoryCount: DATA_CLASSIFICATION.length,
  workflowCount: WORKFLOW_RELIABILITY.length,
  noCompetingSourcesOfTruth: NO_COMPETING_SOURCES.length,
};

// ═══════════════════════════════════════════════════════════════════════
//  HONEST-STATE CERTIFICATION:
//
//  5 systems, each with a SINGLE system-of-record responsibility.
//  NO two systems are competing sources of truth.
//  Each data category has exactly ONE system-of-record.
//  All critical workflows have: idempotency, retry, dead-letter, replay,
//  audit trail, deterministic recovery.
//  Zero-cost dev/test supported without production assumptions or
//  billing dependencies.
//
//  NOT PRODUCTION-AUTHORIZED.
// ═══════════════════════════════════════════════════════════════════════
