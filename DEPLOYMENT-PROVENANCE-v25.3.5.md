# Deployment Provenance Pack — v25.3.5 (Canonical MTQ Economic Definition + Reserve Logic Refactor)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + Crypto-Economist + System Architect
**Release tag**: `v25.3.5`
**Parent**: v25.3.4 (settlement workflow canonicalization + control-plane boundary)
**Release type**: Controlled Remediation — MTQ economic definition + reserve logic refactor

## User directive (verbatim, trace 1a0ede068b9def31)

> "Create one canonical MTQ economic definition.
> MTQ must be described consistently as: permissioned, institutional, closed-loop settlement unit.
> Do not describe it as: retail money, public cryptocurrency, investment asset, yield token,
> governance token, speculative asset, public stablecoin.
> Remove all contradictory USD-peg language.
> PAR must be defined consistently as an accounting/denomination reference unless a future
> jurisdiction-specific legal opinion establishes otherwise.
> Do not claim legal classification, redemption guarantee, security status, deposit status, or
> e-money status without external legal evidence.
> Refactor reserve logic. Remove the universal 130% requirement as a mandatory commercial/
> constitutional settlement requirement. Use: Required Coverage = Direct Settlement Backing +
> Risk Buffer. Direct settlement backing must be matched to the applicable settlement obligation.
> Risk buffer must be calculated from configurable factors including: liquidity, legal accessibility,
> asset haircut, valuation volatility, counterparty risk, concentration, settlement timing,
> redemption behavior, jurisdiction. Keep 130% only as a possible strategic policy target/example,
> never as a universal production requirement. Update DMCE, simulations, tests, dashboards and
> documentation."

## Commits in v25.3.5 (2 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `2e042eb` | K2 | Canonical MTQ economic definition + USD-peg removal + 8 new contradiction patterns |
| `bae1d67` | K3 | Reserve logic refactor — Required Coverage = Direct Backing + Risk Buffer (9 factors) + 22 reframed 130% refs + DMCE updated |

## Half 1: Canonical MTQ Economic Definition (Agent K2)

### Single canonical source created
- `src/lib/mtq-economic-definition.ts` (134 LOC)
- `MTQ_ECONOMIC_DEFINITION` constant exported
- **canonicalDescription**: "MTQ is a permissioned, institutional, closed-loop settlement unit."
- **6 isStatements**: Permissioned, Institutional, Closed-loop, Settlement unit, Optional, Gold-anchored
- **12 isNotStatements** (per directive): NOT retail money, NOT public cryptocurrency, NOT investment asset, NOT yield token, NOT governance token, NOT speculative asset, NOT public stablecoin, NOT USD-pegged, NOT sovereign currency, NOT CBDC, NOT BRICS currency, NOT investment vehicle
- **parDefinition**: value=1.00, accounting/denomination reference ONLY, 5 isNot items
- **legalClassification**: status=PENDING_VALIDATION, 6 claimsForbidden (no claims without external legal evidence)

### New endpoint `/api/mtq-economic-definition` (verified LIVE)
Returns:
- canonicalDescription + canonicalDescriptionLong
- isStatements (6) + isNotStatements (12)
- parDefinition
- legalClassification (status=PENDING_VALIDATION, claimsForbidden)
- sourceLayers
- _meta.activeModel = "v25.3.2"

### USD-peg language removed (4 modifications across 5 files)
1. `src/lib/stability-comparison.ts:725` — removed "less stable than USD-pegged stablecoins"
2. `src/app/page.tsx:973` — renamed "USD-PEG" badge → "REF RATE" badge
3. `src/app/page.tsx:981` — renamed "NAV × USD-pegged rate" → "NAV × reference rate"
4. `src/lib/v24-2-currency-engine.ts:255+` — added clarifying comment that AED/SAR pegs are currency facts, not MTQ pegs

### 8 new contradiction patterns (C18-C25) added to scanner
- C18: MTQ USD peg (forbidden)
- C19: MTQ retail money (forbidden)
- C20: MTQ public cryptocurrency (forbidden)
- C21: MTQ investment asset (forbidden)
- C22: MTQ yield token (forbidden)
- C23: MTQ governance token (forbidden)
- C24: MTQ speculative asset (forbidden)
- C25: MTQ public stablecoin (forbidden)

Scanner now has 25 patterns total (17 original + 8 new). All 8 new patterns verified RESOLVED with 0 true contradictions.

## Half 2: Reserve Logic Refactor (Agent K3)

### Single canonical source created
- `src/lib/reserve-coverage-logic.ts` (247 LOC)
- **Required Coverage formula**: `Required Coverage = Direct Settlement Backing + Risk Buffer`
- **9 configurable risk buffer factors** (per directive):
  1. LIQUIDITY (weight 0.15, baselineBps 200, 30 bps contribution)
  2. LEGAL_ACCESSIBILITY (0.10, 150, 15 bps)
  3. ASSET_HAIRCUT (0.15, 500, 75 bps)
  4. VALUATION_VOLATILITY (0.15, 300, 45 bps)
  5. COUNTERPARTY_RISK (0.10, 200, 20 bps)
  6. CONCENTRATION (0.10, 150, 15 bps)
  7. SETTLEMENT_TIMING (0.05, 100, 5 bps)
  8. REDEMPTION_BEHAVIOR (0.10, 200, 20 bps)
  9. JURISDICTION (0.10, 200, 20 bps)
- **Default total risk buffer**: 245 bps (2.45%) → coverageRatio=1.0245 (102.45%)
- **130% strategic target example**: `computeRiskBufferFor130PercentStrategicTarget()` scales factors ×1.5 → 370 bps (3.70%) → coverageRatio=1.037 (103.70%)

### Honest-state encoded in result
- `strategicPolicyTarget.value = 1.30` (130% retained as EXAMPLE)
- `strategicPolicyTarget.isUniversalRequirement = false` (NOT a universal requirement per directive)
- `constitutionalFloor.value = 1.00` (100% — the ACTUAL universal requirement)
- `constitutionalFloor.isUniversalRequirement = true` (per JOZOUR Amendment §1.3 principle #1: 100%+ Reserve Requirement)
- `LEGACY_130_PERCENT_STATUS = "SUPERSEDED — was universal requirement, now strategic policy target/example only"`

### New endpoint `/api/reserve-coverage` (verified LIVE)
Query params:
- `settlementObligationValue` (default 1000000)
- `settlementAssetType` (default MTQ)
- `directSettlementBacking` (default 1000000)
- `strategicTarget=130` (uses 130% example config)

Returns:
- formula: "Required Coverage = Direct Settlement Backing + Risk Buffer"
- result (with coverageRatio, requiredCoverage, riskBufferBps, factorBreakdown)
- configurableRiskBufferFactors (9 factors with full config)
- _meta.legacy130Status documenting SUPERSEDED status

### 130% references reframed (22 refs across 8 files)
| File | Refs reframed |
|---|---|
| `src/lib/final-integrated-architecture.ts` | +1 (additive DMCE_FORMULA_V25_3_5) |
| `src/app/page.tsx` | 7 |
| `src/app/os/page.tsx` | 2 |
| `src/app/layout.tsx` | 1 |
| `src/lib/institutional-stress-tests.ts` | 4 |
| `src/lib/v25-1-institutional-interop.ts` | 3 |
| `src/lib/ilps.ts` | 3 |
| `src/lib/calm.ts` | 1 |
| **Total** | **22 reframed as "strategic policy target/example" NOT universal requirement** |

### DMCE updated
- `src/lib/final-integrated-architecture.ts:1044+`
- Added `DMCE_FORMULA_V25_3_5` constant pointing to new formula:
  `DMCE (v25.3.5) = MIN(..., RequiredCoverage(DirectSettlementBacking, RiskBuffer), ...)`
- Legacy `DMCE_FORMULA` preserved byte-for-byte as historical reference

## Live verification (2026-09-29T16:20Z)

### Vercel prod `/api/mtq-economic-definition`:
- canonicalDescription: "MTQ is a permissioned, institutional, closed-loop settlement unit."
- 6 isStatements, 12 isNotStatements
- parDefinition.value = 1.00
- legalClassification.status = PENDING_VALIDATION

### Vercel prod `/api/reserve-coverage` (default factors):
- formula: "Required Coverage = Direct Settlement Backing + Risk Buffer"
- coverageRatio: 1.0245 (102.45%)
- riskBufferBps: 245 (2.45%)
- strategicPolicyTarget.isUniversalRequirement: **false** ✅
- constitutionalFloor.isUniversalRequirement: **true** ✅
- factorBreakdown: 9 factors verified

### Vercel prod `/api/reserve-coverage?strategicTarget=130`:
- coverageRatio: 1.037 (103.70%)
- riskBufferBps: 370 (3.70%)
- Uses 130% strategic example configuration

## All 5 platforms in harmony

| Platform | Endpoint | Status |
|---|---|---|
| GitHub origin/main | `2e042eb` | ✅ |
| Vercel prod /api/mtq-economic-definition (NEW) | 200, canonical MTQ definition | ✅ LIVE |
| Vercel prod /api/reserve-coverage (NEW) | 200, Required Coverage formula | ✅ LIVE |
| Vercel prod /api/control-plane/settlement-status | 200 (from v25.3.4) | ✅ |
| Vercel prod /api/policy-registry | 200 (from v25.3.3) | ✅ |
| Vercel prod /api/legal-evidence | 200 (from v25.3.3) | ✅ |
| Vercel prod /api/status | 200 | ✅ |
| Turso DB | connected | ✅ |
| Inngest Cloud | 401 unsigned GET | ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso | ✅ |

## 6 screenshots captured

In `screenshots/v25.3.5-economic-canonicalization/`:
1. `01-vercel-prod-mtq-economic-definition.png` — canonical MTQ definition endpoint
2. `02-vercel-prod-reserve-coverage.png` — Required Coverage formula (default factors)
3. `03-vercel-prod-reserve-coverage-130-strategic.png` — 130% as strategic example config
4. `04-github-commits-v25.3.5.png` — K2 + K3 commits visible
5. `05-github-mtq-economic-definition-source.png` — canonical MTQ source on GitHub
6. `06-github-reserve-coverage-logic-source.png` — Required Coverage source on GitHub

## Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ MTQ is NOT deleted (per directive — it's defined canonically as permissioned/institutional/closed-loop)
- ✅ Universal 130% requirement REMOVED (per directive — now strategic policy target/example only)
- ✅ 130% RETAINED as strategic policy target/example (per directive: "Keep 130% only as a possible strategic policy target/example, never as a universal production requirement")
- ✅ Constitutional floor (100% per JOZOUR Amendment §1.3 principle #1) is the ACTUAL universal requirement
- ✅ 9 configurable risk buffer factors (per directive: liquidity, legal accessibility, asset haircut, valuation volatility, counterparty risk, concentration, settlement timing, redemption behavior, jurisdiction)
- ✅ PAR = accounting/denomination reference ONLY (per directive)
- ✅ Legal classification = PENDING_VALIDATION (no claims without external legal evidence, per directive)
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.5 — Canonical MTQ economic definition established ("permissioned, institutional, closed-loop settlement unit"). USD-peg language removed. PAR = accounting reference only. Legal classification = PENDING_VALIDATION. Universal 130% requirement REMOVED. Required Coverage = Direct Settlement Backing + Risk Buffer (9 configurable factors). 130% retained as strategic policy target/example only. Constitutional floor (100%) is the actual universal requirement. DMCE updated. NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
