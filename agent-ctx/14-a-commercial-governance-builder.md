# Task 14-a — Commercial Governance API + UI Builder

## Status
**COMPLETE** — All deliverables shipped and verified.

## Context
Built the API + UI layer for the Mithqal Commercial Governance engine defined
in `src/lib/commercial-governance.ts` (Chapter XX — Constitutional Commercial
Governance & Institutional Stewardship).

## Shared Context for Downstream Agents

### Architecture decisions
1. **DB layer**: Added a new `rawQuery<T>(sql, args)` helper exported from
   `@/lib/db`. This is the canonical way to run parameterised SQL against the
   Chapter XX tables (ProcurementRecord, RevenueEntry, CommercialAuditEntry,
   ReserveOwnership). It internally calls `ensureSchema()` and a new
   `ensureChapterXxSchema()` that creates the 4 tables idempotently.

2. **Schema bootstrap gotcha**: The `globalForDb.__schemaInitialized` flag in
   `db.ts` may be `true` from a prior session before the Chapter XX tables
   were added. `ensureChapterXxSchema()` has its OWN flag
   (`__chapterXxSchemaEnsured`) and runs the 14 CREATE TABLE/INDEX statements
   on first call. This is safe (idempotent).

3. **API conventions**:
   - Every route: `export async function GET/POST(req: Request)`
   - Returns `NextResponse.json({ ok: true, ... })` on success
   - Returns `NextResponse.json({ ok: false, error, detail }, { status })` on failure
   - GET routes: no body, fetch from DB
   - POST routes: parse JSON body, validate, write to DB via `rawQuery`
   - All row mapping done inline in each route file

4. **UI conventions**:
   - All 4 components are `'use client'`
   - All use shadcn/ui (Card, Badge, Table, Progress, Tabs, Slider)
   - Institutional palette ONLY — `text-gold`, `text-reserve`, `text-gold-deep`,
     `border-line`, `bg-ink-card`, `text-fg-muted`. NO indigo/blue.
   - Every number: `font-mono tabular-nums`
   - All Lucide icons (no emoji)
   - Mobile-first responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
   - Local `Reveal` (framer-motion) + `Eyebrow` helpers in each file (standalone)

### Files Created (15 new)
**API routes (11):**
- `src/app/api/commercial-governance/route.ts` (GET)
- `src/app/api/commercial-governance/entities/route.ts` (GET)
- `src/app/api/commercial-governance/procurement/route.ts` (GET, POST)
- `src/app/api/commercial-governance/procurement/[id]/advance/route.ts` (POST)
- `src/app/api/commercial-governance/benchmark/route.ts` (POST)
- `src/app/api/commercial-governance/best-execution/route.ts` (POST)
- `src/app/api/commercial-governance/revenue/route.ts` (GET, POST)
- `src/app/api/commercial-governance/performance/route.ts` (POST)
- `src/app/api/commercial-governance/compliance/route.ts` (POST)
- `src/app/api/commercial-governance/audit/route.ts` (GET, POST)
- `src/app/api/commercial-governance/reserve-ownership/route.ts` (GET)

**UI components (4):**
- `src/components/commercial-governance-dashboard.tsx` (~1080 lines)
- `src/components/commercial-transparency.tsx` (~640 lines)
- `src/components/institutional-economics.tsx` (~510 lines)
- `src/components/reserve-flow-simulator.tsx` (~600 lines)

### Files Modified (2)
- `src/lib/db.ts` — added `rawQuery<T>()` helper + `ensureChapterXxSchema()`
  + `CHAPTER_XX_SCHEMA_STATEMENTS` constant. ~50 lines added.
- `src/components/public-site.tsx` — added 4 imports (lines 66–69) + 4 mount
  points after `<LiveReadinessDashboard />` (lines 1885–1900).

### Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings ✅
- All 11 API endpoints respond 200/201 ✅
- Home page returns HTTP 200 with all 4 components mounted ✅
- Sample data seeded: 4 revenue entries, 3 audit entries, 1 procurement record
  (advanced to stage 2 of 12) ✅

### API response shapes (cheat-sheet for downstream UI agents)
```
GET /api/commercial-governance
  → { ok, entities[4], procurementRecords[], revenueSummary{totalUsd,byEntity,byCategory,entryCount},
      auditEntries[], reserveOwnership[], reserveOwnershipValid, reserveOwnershipViolations[],
      complianceScore, institutionalTrustScore, transparencyScore, timestamp, source }

GET /api/commercial-governance/entities → { ok, entities[4], count, timestamp }

GET /api/commercial-governance/procurement → { ok, records[], count, stages[12], timestamp }
POST /api/commercial-governance/procurement  body:{asset,amountUsd,quantity}
  → { ok, record, nextStageHint }

POST /api/commercial-governance/procurement/[id]/advance  body:{nextStage?,data?}
  → { ok, record, stageName, stageIndex, totalStages, isComplete }

POST /api/commercial-governance/benchmark  body:{asset,sources[{priceUsd,source,sourceDetail,confidenceScore}]}
  → { ok, result:{benchmark,sources,method,consensusPrice,confidence} }

POST /api/commercial-governance/best-execution  body:{criteria{12 fields 0-100},approvalThreshold?}
  → { ok, result:{score,criteria,weightedBreakdown,rating,approved,approvalThreshold}, weights }

GET /api/commercial-governance/revenue → { ok, entries[], summary, categories, timestamp }
POST /api/commercial-governance/revenue  body:{entity,category,amountUsd,description,transactionRef?}
  → { ok, entry }

POST /api/commercial-governance/performance  body:{benchmarkPrice,executionPrice,quantity}
  → { ok, result:{savings,performanceGainPct,reserveShareUsd,marketsShareUsd,commercialRevenueUsd,...}, split }

POST /api/commercial-governance/compliance  body:{executionPrice,benchmarkPrice,declaredCommission,
  actualCommission,rebates,declaredRebates,dealerEntity,timing,reserveOwnershipVerified}
  → { ok, result:{checks[7],commercialComplianceScore,institutionalTrustScore,transparencyScore,overallPassed} }

GET /api/commercial-governance/audit → { ok, entries[], count, timestamp }
POST /api/commercial-governance/audit  body:{entity,approver,transactionRef,revenueAmount,
  benefitDistribution{reserve,markets,commercial},complianceResult,complianceScore,secret?}
  → { ok, entry:{auditId,...,digitalSignature}, signatureAlgorithm:"HMAC-SHA256", immutable:true }

GET /api/commercial-governance/reserve-ownership
  → { ok, records[], count, totalValueUsd, verification{valid,violations[]}, timestamp, source }
```
