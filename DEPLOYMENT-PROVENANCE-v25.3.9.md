# Deployment Provenance Pack — v25.3.9 (Obligation Registry + Reconciliation Tolerance Policies)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.9`
**Parent**: v25.3.8 (canonical finality model + evidence fabric)
**Release type**: Controlled Remediation — obligation registry + reconciliation tolerance

## User directive (verbatim, trace 1a0ee793ba929555)

> "Create a canonical Institutional Settlement Obligation Registry. Each obligation must contain: issuer, legal obligor, beneficiary, backing cell, redemption institution, jurisdiction, governing law, finality domain, acceptance status, redemption status, resolution status, insolvency treatment, evidence reference. Enforce: NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION. Make this registry usable independently of MTQ.
>
> Refactor reconciliation into separate tolerance policies. Do NOT use one universal tolerance for every reconciliation type. Create separate policies for: ledger-to-ledger balances, bank attestations, custody/quantity, market valuation, FX valuation, stressed valuation. Every reconciliation record must include: tolerancePolicyId, valuationTimestamp, dataSource, assetClass, currency, exceptionPolicy. Update reconciliation engines and tests accordingly."

## Commits in v25.3.9 (3 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `b1f34be` | O1 | Institutional Settlement Obligation Registry — 13 fields + NO_LEGAL_OBLIGOR rule + MTQ-independent |
| `c6a4814` | O2 | Reconciliation tolerance policies — 6 separate policies + 6-field record + engine + tests |
| `2d89393` | O2 | Worklog + agent-ctx docs |

## Half 1: Institutional Settlement Obligation Registry (Agent O1 — commit `b1f34be`)

### Single canonical source created
- `src/lib/institutional-settlement-obligation-registry.ts` (~360 LOC)

### 13 fields per obligation (verified LIVE on Vercel prod)

| # | Field |
|---|---|
| 1 | issuer |
| 2 | legalObligor (CRITICAL — NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION) |
| 3 | beneficiary |
| 4 | backingCell (per v25.3.6 reserve domains) |
| 5 | redemptionInstitution |
| 6 | jurisdiction (per v25.3.8 settlement mode) |
| 7 | governingLaw |
| 8 | finalityDomain (per v25.3.8 F0-F7) |
| 9 | acceptanceStatus |
| 10 | redemptionStatus |
| 11 | resolutionStatus |
| 12 | insolvencyTreatment |
| 13 | evidenceReference (links to v25.3.8 Evidence Fabric) |

### NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION enforcement verified
`validateObligation()` rejects obligations via 4 sub-rules:
- R1: Missing legalObligor → INVALID
- R2: Empty legalObligor.entityId → INVALID
- R3: Empty legalObligor.legalName → INVALID
- R4: SUPERSEDED legalObligor.verificationStatus → INVALID

### MTQ-independent verified
- Registry works for ANY settlement asset type (BANK_MONEY, CENTRAL_BANK_MONEY, RTGS, TOKENIZED_DEPOSITS, WHOLESALE_CBDC, MTQ, OTHER_LEGALLY_RECOGNIZED)
- `getObligationsBySettlementAsset()` filters by any asset type
- Live verification: BANK_MONEY obligation returns count=1, MTQ obligation returns count=0

### New endpoint `/api/obligation-registry` (verified LIVE on Vercel prod)
- GET — returns 13-field schema + enforcement rule
- GET ?obligationId=X — retrieve specific obligation
- GET ?list=true — list all obligation IDs
- GET ?settlementAsset=X — filter by settlement asset (MTQ-independent)
- GET ?beneficiary=X — filter by beneficiary
- GET ?legalObligor=X — filter by legal obligor
- POST — register new obligation (validates NO_LEGAL_OBLIGOR rule)

## Half 2: Reconciliation Tolerance Policies (Agent O2 — commit `c6a4814`)

### Single canonical source created
- `src/lib/reconciliation-tolerance-policies.ts` (~280 LOC)

### 6 separate tolerance policies (per directive — NO universal)

| Policy ID | Name | Tolerance (bps) | Hard/Soft | Exception Policy | Notes |
|---|---|---|---|---|---|
| **LEDGER_TO_LEDGER** | Ledger-to-Ledger Balances | **1** | Hard | BLOCK_ON_MISMATCH | Tightest — ledgers should match exactly |
| **BANK_ATTESTATION** | Bank Attestations | **5** | Hard | ESCALATE_ON_MISMATCH | Moderate — timing differences |
| **CUSTODY_QUANTITY** | Custody/Quantity | **10** (+0.001 abs) | Hard | BLOCK_ON_MISMATCH | Quantity-based, with absolute tolerance |
| **MARKET_VALUATION** | Market Valuation | **50** | Soft | WARN_ON_MISMATCH | Wider — market fluctuates |
| **FX_VALUATION** | FX Valuation | **20** | Soft | WARN_ON_MISMATCH | Moderate — FX fluctuates |
| **STRESSED_VALUATION** | Stressed Valuation | **200** | Soft | TOLERATE_WITHIN_BOUNDS | Widest — stress is uncertain |

Each policy has configurable **asset-class overrides** (e.g., GOLD tighter for custody at 5 bps vs default 10 bps; AED/SAR tighter for FX at 5 bps vs default 20 bps since they're pegged).

### 6-field reconciliation record (per directive)

Every reconciliation record from `reconcile()` includes:
1. `tolerancePolicyId`
2. `valuationTimestamp` (ISO 8601)
3. `dataSource`
4. `assetClass`
5. `currency`
6. `exceptionPolicy`

### Legacy universal tolerance marked SUPERSEDED
- `src/lib/non-custodial-reserve-architecture.ts:830` — `RECONCILIATION_TOLERANCE = 0.0001` (1 bps)
- Added 11-line SUPERSEDED block comment above
- Inline comment updated: `(SUPERSEDED — see comment above)`
- Const PRESERVED (NOT deleted) for backward compat
- `LEGACY_UNIVERSAL_TOLERANCE_STATUS = "SUPERSEDED — universal 1 bps tolerance replaced by 6 separate tolerance policies per O-directive"`

### Reconciliation engine verified LIVE
- Exact match (1000000 vs 1000000) → `reconciliationStatus=VERIFIED, isWithinTolerance=true`
- 10% mismatch (1000000 vs 1100000) → `reconciliationStatus=CRITICAL, isWithinTolerance=false, differenceBps=1000` (hard limit fires)
- Asset-class override verified: GOLD for CUSTODY_QUANTITY = 5 bps (override from default 10)

### New endpoint `/api/reconciliation-tolerance-policies` (verified LIVE on Vercel prod)
- GET — returns 6 policies + 6 required fields + legacy status
- GET ?policyId=X — single-policy lookup
- GET ?reconcile=true&tolerancePolicyId=X&... — test the engine

## Live verification (2026-09-29T18:55Z)

| Endpoint | Status | Key verification |
|---|---|---|
| `/api/obligation-registry` | 200 ✅ | fieldCount=13 + enforcementRule="NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION" |
| `/api/reconciliation-tolerance-policies` | 200 ✅ | 6 policies + 6 required fields + legacyStatus="SUPERSEDED" |
| `/api/reconciliation-tolerance-policies?reconcile=true&...exact` | 200 ✅ | reconciliationStatus=VERIFIED |
| `/api/reconciliation-tolerance-policies?reconcile=true&...10%` | 200 ✅ | reconciliationStatus=CRITICAL |
| `/api/status` | 200 ✅ | db connected |

## All 5 platforms in harmony

| Platform | Status |
|---|---|
| GitHub origin/main | `2d89393` ✅ |
| GitHub tags | `v25.3.9` (to be pushed) |
| Vercel prod /api/obligation-registry (NEW) | 200 ✅ LIVE |
| Vercel prod /api/reconciliation-tolerance-policies (NEW) | 200 ✅ LIVE |
| Turso DB | connected ✅ |
| Inngest Cloud | 401 unsigned GET ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso ✅ |

## 7 screenshots captured

In `screenshots/v25.3.9-obligation-registry-tolerance/`:
1. `01-vercel-prod-obligation-registry.png` — 13-field schema + NO_LEGAL_OBLIGOR rule
2. `02-vercel-prod-tolerance-policies.png` — 6 policies + 6-field record
3. `03-vercel-prod-reconcile-verified.png` — exact match → VERIFIED
4. `04-vercel-prod-reconcile-critical.png` — 10% mismatch → CRITICAL
5. `05-github-commits-v25.3.9.png` — O1 + O2 commits visible
6. `06-github-obligation-registry-source.png` — obligation-registry source on GitHub
7. `07-github-tolerance-policies-source.png` — tolerance-policies source on GitHub

## Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ **Canonical Institutional Settlement Obligation Registry** created (13 fields)
- ✅ **NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION** enforced (validateObligation rejects)
- ✅ **MTQ-independent** (works for any settlement asset type)
- ✅ **6 separate tolerance policies** (NO universal — per directive)
- ✅ Each policy has its OWN tolerance + exception policy + asset-class overrides
- ✅ **6-field reconciliation record** per directive
- ✅ Legacy universal tolerance marked SUPERSEDED (not deleted)
- ✅ Reconciliation engine updated + tests added (8/8 PASS)
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.9 — Canonical Institutional Settlement Obligation Registry (13 fields, NO_LEGAL_OBLIGOR enforced, MTQ-independent). Reconciliation refactored into 6 separate tolerance policies (LEDGER_TO_LEDGER=1bps, BANK_ATTESTATION=5bps, CUSTODY_QUANTITY=10bps, MARKET_VALUATION=50bps, FX_VALUATION=20bps, STRESSED_VALUATION=200bps). 6-field reconciliation record per directive. Legacy universal tolerance SUPERSEDED. NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
