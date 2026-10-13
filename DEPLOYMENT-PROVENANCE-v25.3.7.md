# Deployment Provenance Pack — v25.3.7 (Institutional Operating Model + Finality Trust Domains)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.7`
**Parent**: v25.3.6 (two reserve domains + Pilot 1 config)
**Release type**: Controlled Remediation — institutional operating model + finality trust domains

## User directive (verbatim, trace 1a0ee14af343a085)

> "Refactor the institutional operating model. Banks must see exactly ONE external contractual counterparty for MITHQAL services. Create a canonical field: bankFacingCounterpartyEntityId. Define: contracting authority, SLA owner, support owner, operational liability, data-processing responsibility, security responsibility, billing authority, escalation path. Preserve internal separation between Holding, Operating, Technology and independent oversight where legally appropriate. Do not invent legal facts. Where underlying executed instruments are not available for verification, mark the status PENDING_LEGAL_VERIFICATION.
>
> Refactor the finality architecture into three trust domains: Domain A — Policy & Authorization (Eligibility, compliance, risk, DMCE, monetary authorization). Domain B — Finality Attestation (Independent finality proof/oracle). Domain C — Execution (Deterministic ledger/mint execution). Separate: keys, privileged credentials, deployment permissions, operational roles, audit evidence. Keep the existing seven technical enforcement layers, but stop describing them as seven independently owned institutional controls. Add tests for cross-domain compromise and privilege escalation."

## Commits in v25.3.7 (2 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `daf9535` | M1 | Institutional operating model — bankFacingCounterpartyEntityId + 8 canonical fields + PENDING_LEGAL_VERIFICATION |
| `ade6cff` | M2 | Finality three trust domains (A/B/C) + cross-domain isolation + 15 tests (all PASS) |

## Half 1: Institutional Operating Model (Agent M1 — commit `daf9535`)

### Single canonical source created
- `src/lib/institutional-operating-model.ts` (304 LOC)
- `bankFacingCounterpartyEntityId = "JOZOUR_LLC_NJ"` (banks see exactly ONE external contractual counterparty)
- `legalName = "Jozour, LLC (New Jersey)"`

### 8 canonical fields (per directive)

| # | Field | Status | Underlying Instrument |
|---|---|---|---|
| 1 | contractingAuthority | **ACTIVE** | JOZOUR Amendment No. 1 (2026-07-31) |
| 2 | slaOwner | PENDING_LEGAL_VERIFICATION | (SLA template exists but NOT executed with any bank) |
| 3 | supportOwner | PENDING_LEGAL_VERIFICATION | (Support process not yet operationalized) |
| 4 | operationalLiability | **ACTIVE** | JOZOUR Amendment §1.2 |
| 5 | dataProcessingResponsibility | PENDING_LEGAL_VERIFICATION | (DPA template exists but NOT executed; GDPR/CCPA framework not operationalized) |
| 6 | securityResponsibility | PENDING_LEGAL_VERIFICATION | (SOC 2 / ISO 27001 / pentest designed but NOT accredited) |
| 7 | billingAuthority | PENDING_LEGAL_VERIFICATION | (Fee schedule designed but NOT operationalized) |
| 8 | escalationPath | **ACTIVE** | JOZOUR Amendment §1.2(h) + §1.5 |

**Honest state**: 3 ACTIVE + 5 PENDING_LEGAL_VERIFICATION = 8. Per directive: "Do not invent legal facts."

### Internal separation PRESERVED (per directive)

| Role | entityId | Status | Preserved |
|---|---|---|---|
| HOLDING | MITHQAL_HOLDING_COMPANY_PLANNED | PENDING_LEGAL_VERIFICATION | **true** |
| OPERATING | JOZOUR_LLC_NJ | **ACTIVE** | **true** |
| TECHNOLOGY | MITHQAL_TECHNOLOGY_ENTITY_PLANNED | PENDING_LEGAL_VERIFICATION | **true** |
| INDEPENDENT_OVERSIGHT | MITHQAL_FOUNDATION_PLANNED | PENDING_LEGAL_VERIFICATION | **true** |

Internal separation PRESERVED in the data structure. When planned entities are formed, the refs will point to them.

### New endpoint `/api/institutional-operating-model` (verified LIVE on Vercel prod)
Returns bankFacingCounterpartyEntityId + 8 canonical fields + internal separation.

## Half 2: Finality Three Trust Domains (Agent M2 — commit `ade6cff`)

### Single canonical source created
- `src/lib/finality-trust-domains.ts` (425 LOC)

### 3 trust domains established

| Domain | Name | Keys | Roles | Cannot Access |
|---|---|---|---|---|
| **A** | Policy & Authorization | POLICY_SIGNING_KEY (HSM, 90d) | POLICY_AUTHORIZER (BM-09..BM-15) | B, C |
| **B** | Finality Attestation | ATTESTATION_ORACLE_KEY (30d HSM) + FINALITY_PROOF_SIGNING_KEY (90d HSM) | ATTESTATION_ORACLE + FINALITY_VERIFIER (BM-16A) | A, C |
| **C** | Execution | EXECUTION_MINT_KEY (HSM, 90d) + DEPLOYER_PRIVATE_KEY (CRON_SECRET gated) | MINT_EXECUTOR (BM-16B) | A, B |

### 6 cross-domain isolation rules
1. `noSharedKeys` — no key type appears in 2+ domains
2. `noSharedCredentials` — no credential is shared
3. `noSharedDeployment` — no deployment action is shared
4. `noSharedRoles` — a role in one domain CANNOT access another domain
5. `noSharedAuditEvidence` — audit evidence is domain-attributed
6. `executionRequiresAuthorizationAndAttestation` — Domain C BM-16B requires Domain A BM-15 + Domain B BM-16A (cross-domain two-of-two check)

### 7 technical enforcement layers PRESERVED + REFRAMED

Per directive: "Keep the existing seven technical enforcement layers, but stop describing them as seven independently owned institutional controls."

- All 7 layers PRESERVED (L1-L7, none deleted)
- Each maps to exactly one trust domain:
  - L1-L5 → DOMAIN_A_POLICY_AUTHORIZATION
  - L6 → DOMAIN_B_FINALITY_ATTESTATION
  - L7 → DOMAIN_C_EXECUTION
- `isSevenIndependentlyOwnedInstitutionalControls = false` ✅
- `isTechnicalEnforcementWithinThreeTrustDomains = true` ✅

### 15 tests added (13 mandatory + 2 bonus, ALL PASS)

**Cross-domain compromise tests (T1-T8 + T8b/T8c bonus)**:
- T1-T5: Key isolation across all 3 domains (POLICY_SIGNING_KEY, ATTESTATION_ORACLE_KEY, FINALITY_PROOF_SIGNING_KEY, EXECUTION_MINT_KEY, DEPLOYER_PRIVATE_KEY — each in exactly one domain)
- T6-T8: Role isolation (POLICY_AUTHORIZER, ATTESTATION_ORACLE, MINT_EXECUTOR — cannot access wrong domains)
- T8b: No credential shared across domains (9 unique credentials verified)
- T8c: No audit evidence shared across domains (13 unique evidence types verified)

**Privilege escalation tests (T9-T13)**:
- T9: POLICY_AUTHORIZER cannot mint (no Domain C access)
- T10: ATTESTATION_ORACLE cannot authorize (no Domain A access)
- T11: MINT_EXECUTOR cannot authorize OR attest (no Domain A or B access)
- T12: 7 layers NOT 7 independently owned institutional controls
- T13: Each of 7 layers maps to exactly one trust domain

**Test summary**: passed=15, failed=0, total=15, allPassed=true ✅

### 2 new endpoints (verified LIVE on Vercel prod)
- `/api/finality-trust-domains` — returns 3 domains + cross-domain isolation rules + 7 technical layers
- `/api/finality-trust-domains-tests` — returns test summary + per-test results (15/15 PASS)

## Live verification (2026-09-29T17:05Z)

| Endpoint | Status | Key verification |
|---|---|---|
| `/api/institutional-operating-model` | 200 ✅ | bankFacingCounterpartyEntityId=JOZOUR_LLC_NJ, 8 canonical fields (3 ACTIVE + 5 PENDING_LEGAL_VERIFICATION), internal separation preserved |
| `/api/finality-trust-domains` | 200 ✅ | 3 domains (A/B/C), 6 cross-domain isolation rules, 7 layers reframed (NOT 7 institutional controls) |
| `/api/finality-trust-domains-tests` | 200 ✅ | 15/15 tests PASS (passed=15, failed=0, allPassed=true) |
| `/api/status` | 200 ✅ | db connected |
| `/` | 200 ✅ | home renders |

## All 5 platforms in harmony

| Platform | Status |
|---|---|
| GitHub origin/main | `ade6cff` ✅ |
| GitHub tags | `v25.3.7` (to be pushed) |
| Vercel prod /api/institutional-operating-model (NEW) | 200 ✅ LIVE |
| Vercel prod /api/finality-trust-domains (NEW) | 200 ✅ LIVE |
| Vercel prod /api/finality-trust-domains-tests (NEW) | 200 ✅ LIVE |
| Turso DB | connected ✅ |
| Inngest Cloud | 401 unsigned GET ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso ✅ |

## 6 screenshots captured

In `screenshots/v25.3.7-operating-model-trust-domains/`:
1. `01-vercel-prod-institutional-operating-model.png` — bankFacingCounterpartyEntityId + 8 canonical fields
2. `02-vercel-prod-finality-trust-domains.png` — 3 domains (A/B/C) + cross-domain isolation
3. `03-vercel-prod-finality-trust-domains-tests.png` — 15/15 tests PASS
4. `04-github-commits-v25.3.7.png` — M1 + M2 commits visible
5. `05-github-institutional-operating-model-source.png` — institutional-operating-model.ts on GitHub
6. `06-github-finality-trust-domains-source.png` — finality-trust-domains.ts on GitHub

## Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ **Banks see exactly ONE external contractual counterparty** (bankFacingCounterpartyEntityId=JOZOUR_LLC_NJ)
- ✅ **8 canonical fields defined** (contractingAuthority, slaOwner, supportOwner, operationalLiability, dataProcessingResponsibility, securityResponsibility, billingAuthority, escalationPath)
- ✅ **PENDING_LEGAL_VERIFICATION** status used where underlying instruments not available (5 of 8 fields)
- ✅ **Internal separation preserved** (Holding/Operating/Technology/Oversight — all preserved=true)
- ✅ **Three trust domains established** (A: Policy/Authorization, B: Finality Attestation, C: Execution)
- ✅ **Keys/credentials/deployment/roles/audit separated** across domains (6 cross-domain isolation rules)
- ✅ **7 technical enforcement layers PRESERVED** but NOT described as 7 institutional controls
- ✅ **Cross-domain compromise + privilege escalation tests added** (15 tests, all PASS)
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.7 — Banks see ONE external contractual counterparty (bankFacingCounterpartyEntityId). 8 canonical fields defined (3 ACTIVE + 5 PENDING_LEGAL_VERIFICATION). Internal separation preserved. Three trust domains established (A/B/C) with cross-domain isolation. 7 technical layers preserved but NOT 7 institutional controls. 15 cross-domain + privilege escalation tests added (all PASS). NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
