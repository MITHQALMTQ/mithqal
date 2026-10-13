# Task M2 — Finality Three Trust Domains Architect

**Task ID:** M2
**Agent:** Sub-agent (full-stack-developer) — Finality Three Trust Domains Architect
**Directive trace:** 1a0ee14af343a085
**Release:** v25.3.7
**Commit SHA:** `ade6cff77c78f1c7d12b7a99a31257fd16a6c77d` (short: `ade6cff`)
**Pushed:** `daf9535..ade6cff main -> main` (origin/main)

## Files created (4 new, 0 modified — additive only)

1. `src/lib/finality-trust-domains.ts` — canonical single-source-of-truth for the 3 trust domains
2. `src/app/api/finality-trust-domains/route.ts` — public GET endpoint
3. `src/lib/tests/finality-trust-domain-tests.ts` — 13 mandatory + 2 bonus tests = 15 total
4. `src/app/api/finality-trust-domains-tests/route.ts` — test-runner GET endpoint

## Three trust domains

- **Domain A — Policy & Authorization** (`DOMAIN_A_POLICY_AUTHORIZATION`)
  - 1 key: `POLICY_SIGNING_KEY` (HSM, 90-day rotation)
  - 1 role: `POLICY_AUTHORIZER` (eligibility/compliance/risk/DMCE/monetary authorization BM-09..BM-15)
  - 3 credentials, 3 deployment permissions, 5 audit evidence types
  - cannotAccess: B, C

- **Domain B — Finality Attestation** (`DOMAIN_B_FINALITY_ATTESTATION`)
  - 2 keys: `ATTESTATION_ORACLE_KEY` (30-day) + `FINALITY_PROOF_SIGNING_KEY` (90-day) — both HSM
  - 2 roles: `ATTESTATION_ORACLE`, `FINALITY_VERIFIER`
  - 3 credentials, 2 deployment permissions, 4 audit evidence types
  - cannotAccess: A, C — MUST be independent from policy + execution

- **Domain C — Execution** (`DOMAIN_C_EXECUTION`)
  - 2 keys: `EXECUTION_MINT_KEY` (HSM, 90-day) + `DEPLOYER_PRIVATE_KEY` (software, gated by CRON_SECRET)
  - 1 role: `MINT_EXECUTOR` (BM-16B mint, canonical ledger, supply adjustments)
  - 3 credentials, 2 deployment permissions, 4 audit evidence types
  - cannotAccess: A, B — executes only AFTER Domain A auth + Domain B attestation

## Six cross-domain isolation rules

1. `noSharedKeys` — each domain has its own keys (no key type appears in 2+ domains)
2. `noSharedCredentials` — each domain has its own privileged credentials
3. `noSharedDeployment` — each domain has its own deployment permissions
4. `noSharedRoles` — a role in one domain CANNOT access another domain
5. `noSharedAuditEvidence` — each domain produces its own audit evidence
6. `executionRequiresAuthorizationAndAttestation` — Domain C BM-16B requires BM-15 (Domain A) + BM-16A (Domain B)

## Seven technical enforcement layers (PRESERVED + reframed)

- All 7 layers PRESERVED (L1 Institution Authorization → L7 Canonical Mint Execution)
- `isSevenIndependentlyOwnedInstitutionalControls = false` (per M-directive)
- `isTechnicalEnforcementWithinThreeTrustDomains = true`
- Each layer maps to exactly one trust domain:
  - L1-L5 → DOMAIN_A_POLICY_AUTHORIZATION
  - L6 → DOMAIN_B_FINALITY_ATTESTATION
  - L7 → DOMAIN_C_EXECUTION

## Test suite (15 tests: 13 mandatory + 2 bonus)

- **T1-T8 cross-domain compromise:** key isolation (Domain A/B/C keys not shared), role isolation (POLICY_AUTHORIZER/ATTESTATION_ORACLE/MINT_EXECUTOR cannot access wrong domains)
- **T8b bonus:** no credential is shared across domains (9 credentials domain-unique)
- **T8c bonus:** no audit evidence is shared across domains (13 evidence types domain-unique)
- **T9-T13 privilege escalation:** POLICY_AUTHORIZER cannot mint; ATTESTATION_ORACLE cannot authorize; MINT_EXECUTOR cannot authorize OR attest; 7 layers NOT 7 institutional controls; each layer maps to one domain
- **Result:** 15/15 PASS — `summary.allPassed = true`

## Verification (live dev server, port 3000)

- `bun run lint` → EXIT 0 (zero errors, zero warnings)
- `curl /api/finality-trust-domains` → `_meta.activeModel=v25.3.2`, 3 domains, 6 isolation rules, `isSevenIndependentlyOwnedInstitutionalControls=false`, `isTechnicalEnforcementWithinThreeTrustDomains=true`
- `curl /api/finality-trust-domains-tests` → `passed=15 failed=0 total=15 allPassed=true`

## Honest residual debt

- Pre-existing GitHub Dependabot vulnerability (1 high) returned on push — same alert flagged on prior agent pushes (K2/K3/H2/G3/I2/I3/I4/K5). NOT introduced by M2.
- No other residual debt. All M-directive requirements met:
  - 3 trust domains formally established ✓
  - Keys/credentials/deployment/roles/audit separated ✓
  - 7 technical layers PRESERVED (not deleted) ✓
  - 7 layers reframed as NOT independently owned institutional controls ✓
  - Cross-domain compromise tests added ✓
  - Privilege escalation tests added ✓
