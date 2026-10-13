# Deployment Provenance Pack — v25.3.6 (Two Reserve Domains + Pilot 1 Config)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + Crypto-Economist + System Architect
**Release tag**: `v25.3.6`
**Parent**: v25.3.5 (canonical MTQ economic definition + reserve logic refactor)
**Release type**: Controlled Remediation — two reserve domains + Pilot 1 config update

## User directive (verbatim, trace 1a0edf8e1d339851)

> "Create two formally separate reserve domains:
> ### Settlement Liquidity — Used for normal settlement and redemption operations.
> ### Strategic Resilience Reserve — Used for stress, contingency and resolution.
> Move gold conceptually into the resilience domain.
> Emergency capacity must not be double-counted into settlement backing.
> Update formulas, reserve schemas, dashboards and audit records so the two domains cannot be economically commingled.
> Change Pilot 1 configuration: gold settlement backing = 0%, digital reserve backing = 0%.
> Do not delete those capabilities from the architecture. Mark them as: AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION.
> Pilot 1 must use only legally and operationally supportable institutional settlement assets.
> Update all pilot documentation, reserve configuration, examples, DMCE rules, tests and UI."

## Commits in v25.3.6 (2 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `677df6d` | K5 | Pilot 1 config — gold=0%, digital=0%, AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION + UI updates |
| `c3f14bf` | K4 | Two formally separate reserve domains — Settlement Liquidity vs Strategic Resilience Reserve + gold moved + anti-double-counting |

## Half 1: Two Formally Separate Reserve Domains (Agent K4 — commit `c3f14bf`)

### Single canonical source created
- `src/lib/reserve-domains.ts` (single source of truth)
- 2 formally separate domains:

| Domain | Asset Classes | countsTowardSettlementBacking | availableForEmergencyResolution | canComingleWithOtherDomain |
|---|---|---|---|---|
| **SETTLEMENT_LIQUIDITY** | BANK_MONEY, CENTRAL_BANK_MONEY, RTGS, TOKENIZED_DEPOSITS, WHOLESALE_CBDC, SOVEREIGN_BONDS, STABLECOIN, OTHER_LEGALLY_RECOGNIZED | **true** | false | **false** |
| **STRATEGIC_RESILIENCE** | GOLD, SILVER, EMERGENCY_LIQUIDITY, CONTINGENCY_BUFFER, LONG_DURATION_SOVEREIGN | **false** | true | **false** |

### Gold moved to Strategic Resilience Reserve
- Per directive: "Move gold conceptually into the resilience domain."
- Gold is NO LONGER in the Settlement Liquidity domain
- Gold does NOT count toward Direct Settlement Backing
- `LEGACY_GOLD_AS_SETTLEMENT_BACKING_STATUS = "SUPERSEDED — gold moved to Strategic Resilience Reserve domain per L-directive"`

### Anti-Double-Counting Rules (3 rules)
1. **goldNotSettlementBacking** — Gold in resilience domain is NOT counted as Direct Settlement Backing
2. **emergencyCapacityNotDoubleCounted** — Emergency capacity (≤15% of liability) MUST NOT be double-counted into settlement backing. `settlementBackingImpact=0` (verified)
3. **noCommingling** — Each asset is in EXACTLY ONE domain. An asset cannot be in both.

### Domain-aware Required Coverage formula
- New function `computeRequiredCoverageWithDomainSeparation()` in `src/lib/reserve-coverage-logic.ts`
- Filters `directSettlementBacking` to Settlement Liquidity domain assets only
- Legacy `computeRequiredCoverage()` preserved for backward compat

### DMCE updated
- New `DMCE_FORMULA_V25_3_6` constant in `src/lib/final-integrated-architecture.ts`
- Points to domain-aware `RequiredCoverageWithDomainSeparation(DirectSettlementBacking, RiskBuffer)`
- Legacy `DMCE_FORMULA` + `DMCE_FORMULA_V25_3_5` preserved as historical

### New endpoint `/api/reserve-domains` (verified LIVE on Vercel prod)
- Returns 2 domains + anti-double-counting rules
- `?compute=true&liabilityUsd=X` — sample computation
- `emergencyCapacity.settlementBackingImpact=0` (anti-double-counting verified)
- Sample computation: $60M direct settlement backing + $12M strategic resilience reserve + coverageRatio=1.111

## Half 2: Pilot 1 Configuration (Agent K5 — commit `677df6d`)

### Single canonical source created
- `src/lib/pilot-1-config.ts` (single source of truth)
- 7 asset classes configured:

| Asset Class | Weight | Status |
|---|---|---|
| BANK_MONEY | 50% | ACTIVE |
| CENTRAL_BANK_MONEY | 20% | ACTIVE |
| SOVEREIGN_BONDS | 15% | ACTIVE |
| RTGS | 10% | ACTIVE |
| TOKENIZED_DEPOSITS | 5% | ACTIVE |
| **GOLD** | **0%** | **AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION** |
| **STABLECOIN** (digital reserve) | **0%** | **AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION** |

### Capabilities NOT deleted (per directive)
- Gold + digital reserve backing capabilities are PRESERVED
- Marked `AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION` (not deleted, not SUPERSEDED)
- Future validated configuration (with external legal evidence + custodian verification) may re-enable

### Pilot 1 uses only legally supportable institutional settlement assets
- 5 ACTIVE assets totaling 100% (bank money + CB money + sovereign bonds + RTGS + tokenized deposits)
- All are legally + operationally supportable institutional settlement assets
- Gold + stablecoin EXCLUDED from Pilot 1 settlement backing

### Pilot 1 readiness gate
- New `evaluatePilot1ReserveBackingGate()` function in `src/lib/pilot-operational-readiness.ts`
- 5 checks: gold=0%, digital=0%, both marked AVAILABLE_FOR_FUTURE_VALIDATED, ACTIVE sum=100%, all ACTIVE assets in legally-supportable allowlist

### DMCE Pilot 1 rule
- New `DMCE_PILOT_1_RULE` constant in `src/lib/final-integrated-architecture.ts`
- "Only ACTIVE settlement assets count toward VerifiedEligibleBacking in DMCE. Gold (0%) and digital reserve backing (0%) are NOT counted — they are marked AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION."

### UI updated
- `src/app/page.tsx`: NEW `<Section id="pilot-1-config">` showing ACTIVE (5 emerald cards) + AVAILABLE_FOR_FUTURE (2 amber cards, both 0%)
- `src/app/os/page.tsx`: NEW OS dashboard section with 4-card summary + asset chip clusters

### New endpoint `/api/pilot-1-config` (verified LIVE on Vercel prod)
- Returns Pilot 1 config + active assets + future-validated capabilities
- `_meta` documents the AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION markers

## Live verification (2026-09-29T16:45Z)

### Vercel prod `/api/reserve-domains?compute=true`:
- 2 domains (Settlement Liquidity + Strategic Resilience Reserve)
- Gold in Strategic Resilience Reserve (countsTowardSettlementBacking=False)
- canComingleWithOtherDomain=False for both domains
- directSettlementBacking: $60M (excludes gold + silver)
- strategicResilienceReserve: $12M (gold + silver)
- emergencyCapacity.settlementBackingImpact: **0** (anti-double-counting verified)

### Vercel prod `/api/pilot-1-config`:
- 5 ACTIVE assets totaling 100% (bank money 50% + CB money 20% + sovereign bonds 15% + RTGS 10% + tokenized deposits 5%)
- 2 AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION assets (gold 0%, stablecoin 0%)
- Capabilities PRESERVED (not deleted)

## All 5 platforms in harmony

| Platform | Endpoint | Status |
|---|---|---|
| GitHub origin/main | `c3f14bf` | ✅ |
| GitHub tags | `v25.3.6` pushed | ✅ |
| Vercel prod /api/reserve-domains (NEW) | 200 ✅ LIVE | ✅ |
| Vercel prod /api/pilot-1-config (NEW) | 200 ✅ LIVE | ✅ |
| Vercel prod /api/reserve-coverage | 200 | ✅ |
| Vercel prod /api/mtq-economic-definition | 200 | ✅ |
| Vercel prod /api/control-plane/settlement-status | 200 | ✅ |
| Vercel prod /api/policy-registry | 200 | ✅ |
| Vercel prod /api/legal-evidence | 200 | ✅ |
| Vercel prod /api/status | 200 | ✅ |
| Turso DB | connected | ✅ |
| Inngest Cloud | 401 unsigned GET | ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso | ✅ |

## 5 screenshots captured

In `screenshots/v25.3.6-reserve-domains/`:
1. `01-vercel-prod-reserve-domains.png` — 2 domains + computation (gold excluded from settlement backing)
2. `02-vercel-prod-pilot-1-config.png` — Pilot 1 config (5 ACTIVE + 2 AVAILABLE_FOR_FUTURE)
3. `03-github-commits-v25.3.6.png` — K4 + K5 commits visible
4. `04-github-reserve-domains-source.png` — reserve-domains.ts on GitHub
5. `05-github-pilot-1-config-source.png` — pilot-1-config.ts on GitHub

## Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ **Two formally separate reserve domains established** (Settlement Liquidity vs Strategic Resilience Reserve)
- ✅ **Gold moved conceptually to Strategic Resilience Reserve domain** (per directive)
- ✅ **Emergency capacity NOT double-counted** into settlement backing (settlementBackingImpact=0)
- ✅ **Domains CANNOT be economically commingled** (canComingleWithOtherDomain=false for both)
- ✅ **Pilot 1 gold settlement backing = 0%** (per directive)
- ✅ **Pilot 1 digital reserve backing = 0%** (per directive)
- ✅ **Gold + digital capabilities NOT deleted** — marked AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION
- ✅ Pilot 1 uses only legally + operationally supportable institutional settlement assets
- ✅ Formulas + schemas + dashboards + audit records updated
- ✅ Pilot docs + reserve config + examples + DMCE rules + tests + UI updated
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.6 — Two formally separate reserve domains established (Settlement Liquidity vs Strategic Resilience Reserve). Gold moved to resilience domain. Emergency capacity not double-counted (settlementBackingImpact=0). Pilot 1 gold=0%, digital=0%, marked AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION (capabilities preserved, not deleted). Pilot 1 uses only legally supportable institutional settlement assets. Formulas + schemas + dashboards + audit records + pilot docs + DMCE rules + tests + UI all updated. NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
