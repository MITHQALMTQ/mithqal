# Deployment Provenance Pack — v25.3.8 (Canonical Finality Model + Institutional Evidence Fabric)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.8`
**Parent**: v25.3.7 (institutional operating model + finality trust domains)
**Release type**: Controlled Remediation — canonical finality model + evidence fabric

## User directive (verbatim, trace 1a0ee5f25d2fbe79)

> "Create one canonical finality model. Use: F0-F7 (8 stages). Explicitly distinguish: technical finality, banking finality, legal finality. Use 'finality-coordinated settlement' when a common legal finality domain does not exist. Use 'atomic settlement' only when the transaction actually executes within a legally supported shared finality domain. Update all marketing language, examples and tests.
>
> Create a first-class Institutional Evidence Fabric. Every material transaction must generate a portable evidence package containing: transaction ID, parties, policy version, compliance state, sanctions state, risk result, liquidity decision, backing evidence, legal obligation ID, finality state, authorization, reconciliation result, exceptions, timestamps, cryptographic commitments. Create APIs to retrieve the evidence package without exposing unauthorized confidential information."

## Commits in v25.3.8 (2 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `f0d6285` | N2 | Institutional Evidence Fabric — 15-field portable evidence package + 3 access levels |
| `1a71024` | N1 | Canonical finality model — F0-F7 + 3 finality types + finality-coordinated vs atomic |

## Half 1: Canonical Finality Model (Agent N1 — commit `1a71024`)

### Single canonical source created
- `src/lib/canonical-finality-model.ts` (~340 LOC)

### 8 finality stages F0-F7 (verified LIVE on Vercel prod)

| ID | Name | Finality Type | BM-Step | Trust Domain |
|---|---|---|---|---|
| **F0** | Instruction Accepted | TECHNICAL | BM-01 | Domain A |
| **F1** | Funding Final | BANKING | BM-04 | Domain A |
| **F2** | Legally Controlled Backing Confirmed | BANKING | BM-05 | Domain A |
| **F3** | MITHQAL Authorization Final | TECHNICAL | BM-15 | Domain A |
| **F4** | MITHQAL Ledger Final | TECHNICAL | BM-16B | Domain C |
| **F5** | Receiving Institution Accepted | BANKING | BM-16A | Domain B |
| **F6** | External Rail Final | BANKING | BM-16A | Domain B |
| **F7** | Legal Settlement Final | LEGAL | BM-16A | Domain B |

### 3 finality types distinguished explicitly (per directive)
- **TECHNICAL** (3 stages: F0, F3, F4) — transaction committed to a ledger; may still be reversed
- **BANKING** (4 stages: F1, F2, F5, F6) — banks have accepted; interbank settlement complete
- **LEGAL** (1 stage: F7) — legally irrevocable; legally certain; recognized by jurisdiction(s)

### 2 settlement modes (per directive)
- **FINALITY_COORDINATED** — use when a common legal finality domain does NOT exist (typical for cross-border)
- **ATOMIC** — use ONLY when shared legal finality domain exists (rare for cross-border)

### `determineSettlementMode()` helper verified
- CN/AE/US → **FINALITY_COORDINATED** (different jurisdictions — no shared legal domain)
- US/US/US → **ATOMIC** (same jurisdiction — shared legal domain)
- Tested across 4 same-jx + 7 different-jx cases

### Marketing language updated (5 files)
1. `src/app/page.tsx` — "Atomic" badge → "Settlement Mode" badge (FINALITY-COORDINATED/ATOMIC derived from jurisdictions) + NEW `<Section id="finality-model">` rendering 3 types + 8 stages + 2 modes
2. `src/app/os/page.tsx:149` — "atomic settlement" → "finality-coordinated settlement (separate legal finality domains)"
3. `src/app/api/v24.2.1/route.ts:87` — "atomic settlement" → "on-chain settlement (finality-coordinated across legal domains)"
4. `src/app/demo/page.tsx:153,368` — "real-time settlement" → "real-time technical settlement coordinated across legal finality domains"
5. `src/lib/e2e-workflow-tests.ts:573` — "instant settlement" → "finality-coordinated real-time settlement"

### Tests added — 97/97 PASS
- All 8 F0-F7 stages present with canonical names + correct finalityType assignments
- 3 finality types distinguished explicitly (exclusive flag pattern)
- Each F-stage maps to a valid BM-* step + expected trust domain
- `determineSettlementMode` returns ATOMIC for same-jx, FINALITY_COORDINATED for different-jx
- Settlement mode definitions contain the directive's exact phrases

## Half 2: Institutional Evidence Fabric (Agent N2 — commit `f0d6285`)

### Single canonical source created
- `src/lib/institutional-evidence-fabric.ts` (415 LOC)

### 15-field portable evidence package (verified LIVE on Vercel prod)

| # | Field | Source |
|---|---|---|
| 1 | transactionId | unique TX ID |
| 2 | parties | sender/receiver institution IDs + hashed customer refs (no PII) |
| 3 | policyVersion | per v25.3.3 policy-registry |
| 4 | complianceState | AML/KYC/sanctions screening |
| 5 | sanctionsState | OFAC/EU/UN sanctions |
| 6 | riskResult | bank + system risk per BM-12/BM-13 |
| 7 | liquidityDecision | DMCE per BM-14 |
| 8 | backingEvidence | AvailableBackingCertificate per BM-05 + reserve domain |
| 9 | legalObligationId | per legal-obligation-register |
| 10 | finalityState | F0-F7 per v25.3.8 (Agent N1) |
| 11 | authorization | Monetary Authorization per BM-15, Domain A |
| 12 | reconciliationResult | 5-way per P36 |
| 13 | exceptions | errors/warnings/special handling |
| 14 | timestamps | F0-F7 stage times |
| 15 | cryptographicCommitments | 6 SHA-256 commitments |

### 3 access levels (per directive: "without exposing unauthorized confidential information")

| Level | Redacted Fields | Exposed Fields | Use Case |
|---|---|---|---|
| **PUBLIC** | 12 fields (parties, policyVersion, compliance, sanctions, risk, liquidity, backing, legalObligationId, authorization, reconciliation, exceptions, full timestamps) | only transactionId + finalityState + cryptographicCommitments + minimal timestamps | Public blockchain explorers, transparency dashboards |
| **INSTITUTIONAL** | 3 fields (sender/receiver customer refs hashed, signature masked) | all 15 fields with PII hashed + signature masked | Participating banks, counterparties |
| **AUDIT** | none (full access) | all 15 fields with raw values | Auditors + regulators only |

### Cryptographic commitments (SHA-256)
- `transactionIdCommitment` — SHA-256(transactionId + salt)
- `partiesCommitment` — SHA-256(parties JSON + salt)
- `backingEvidenceCommitment` — SHA-256(backing evidence + salt)
- `authorizationCommitment` — SHA-256(authorization + salt)
- `reconciliationCommitment` — SHA-256(reconciliation + salt)
- `fullPackageCommitment` — SHA-256(all 14 non-commitment fields + salt) — package integrity

### Integrity verification
- `verifyEvidencePackageIntegrity(pkg)` recomputes the full-package commitment + compares to stored
- POST response: `integrityVerified: true` ✅
- GET `?verify=TEST-TX-001`: `{integrityVerified: true}` ✅

### New endpoint `/api/evidence-fabric` (verified LIVE on Vercel prod)
- GET — returns 15-field schema + 3 access levels
- GET `?transactionId=X&accessLevel=Y` — access-gated retrieval (default PUBLIC)
- GET `?list=true` — list all stored transaction IDs
- GET `?verify=X` — verify package integrity
- POST — generate new evidence package (validates 13 required fields, generates + stores + commits)

## Live verification (2026-09-29T18:35Z)

| Endpoint | Status | Key verification |
|---|---|---|
| `/api/canonical-finality-model` | 200 ✅ | 8 F0-F7 stages + 3 finality types + 2 settlement modes |
| `/api/canonical-finality-model?determineMode=true&senderJurisdiction=CN&receiverJurisdiction=AE&mithqalJurisdiction=US` | 200 ✅ | determinedMode=FINALITY_COORDINATED |
| `/api/canonical-finality-model?determineMode=true&senderJurisdiction=US&receiverJurisdiction=US&mithqalJurisdiction=US` | 200 ✅ | determinedMode=ATOMIC |
| `/api/evidence-fabric` | 200 ✅ | fieldCount=15 + 3 access levels (PUBLIC/INSTITUTIONAL/AUDIT) |
| `/api/status` | 200 ✅ | db connected |
| `/` | 200 ✅ | home renders with new finality-model section |

## All 5 platforms in harmony

| Platform | Status |
|---|---|
| GitHub origin/main | `1a71024` ✅ |
| GitHub tags | `v25.3.8` (to be pushed) |
| Vercel prod /api/canonical-finality-model (NEW) | 200 ✅ LIVE |
| Vercel prod /api/evidence-fabric (NEW) | 200 ✅ LIVE |
| Turso DB | connected ✅ |
| Inngest Cloud | 401 unsigned GET ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso ✅ |

## 7 screenshots captured

In `screenshots/v25.3.8-finality-model-evidence-fabric/`:
1. `01-vercel-prod-canonical-finality-model.png` — 8 F0-F7 stages + 3 types + 2 modes
2. `02-vercel-prod-determine-mode-coordinated.png` — CN/AE/US → FINALITY_COORDINATED
3. `03-vercel-prod-determine-mode-atomic.png` — US/US/US → ATOMIC
4. `04-vercel-prod-evidence-fabric-schema.png` — 15-field schema + 3 access levels
5. `05-github-commits-v25.3.8.png` — N1 + N2 commits visible
6. `06-github-canonical-finality-model-source.png` — canonical-finality-model.ts on GitHub
7. `07-github-evidence-fabric-source.png` — institutional-evidence-fabric.ts on GitHub

## Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ **One canonical finality model** (F0-F7, 8 stages)
- ✅ **3 finality types distinguished explicitly** (technical, banking, legal)
- ✅ **'finality-coordinated settlement'** used when no shared legal finality domain
- ✅ **'atomic settlement'** used ONLY when shared legal finality domain exists
- ✅ **Marketing language updated** (5 files: page.tsx, os/page.tsx, v24.2.1/route.ts, demo/page.tsx, e2e-workflow-tests.ts)
- ✅ **Tests added** (97/97 PASS for finality model)
- ✅ **First-class Institutional Evidence Fabric** created
- ✅ **15-field portable evidence package** (exactly 15 fields per directive)
- ✅ **3 access levels** (PUBLIC/INSTITUTIONAL/AUDIT) — no unauthorized confidential info exposed
- ✅ **Cryptographic commitments** (SHA-256, 6 commitments per package)
- ✅ **Integrity verification** works
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.8 — One canonical finality model (F0-F7, 8 stages). 3 finality types distinguished (technical/banking/legal). Finality-coordinated vs atomic settlement per legal domain. Marketing + examples + tests updated. First-class Institutional Evidence Fabric (15-field portable package, 3 access levels, SHA-256 commitments, integrity verification). NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
