# Deployment Provenance Pack — v25.3.15 (Adversarial Tests + Controlled Architecture Freeze)

**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.15`
**Parent**: v25.3.13 (continuity fabric + contradiction sweep)

## Commits (3 by parallel agents)
- `d629478` (T2): Controlled Architecture Freeze — 10 frozen schemas + 7-step change process
- `816040d` (T1): 17 adversarial architecture tests + machine-readable evidence (17/17 PASS locally)
- `2651fb2` (T1): docs(agent-ctx) finalize

## Half 1: Adversarial Tests (T1)
- 17 scenarios per directive (MTQ disabled, unauthorized mint, invalid finality, stale authorization, legal-obligation missing, backing unavailable, backing encumbered, duplicate backing, bank failure, custodian failure, rail failure, reconciliation mismatch, policy version mismatch, jurisdiction change, privileged-admin compromise, finality-domain compromise, cross-domain credential compromise)
- 17/17 PASS locally (each test ACTUALLY CALLS the system, not expected-output-only)
- Machine-readable evidence (SHA-256 hash) for every test
- Honest note: tests call localhost:3000 — pass locally but fail on Vercel serverless (no localhost in serverless runtime)

## Half 2: Controlled Architecture Freeze (T2)
- 10 frozen schemas: canonical terminology, workflow IDs, policy schema, reserve schema, MTQ definition, finality model, legal-obligation schema, evidence schema, gate taxonomy, pilot architecture
- 7-step change process: CHANGE REQUEST → IMPACT ANALYSIS → REVIEW → APPROVAL → VERSION → TEST → EVIDENCE
- All 10 schemas FROZEN (isFrozen=true)
- All 7 steps REQUIRED (cannot skip)
- Joint COO+CTO approval required
- No feature development on constitutional/institutional-control logic

## Vercel prod verified LIVE
- /api/architecture-freeze → 200 (10 schemas, 7 steps, enforcement rule)
- /api/adversarial-tests → 200 (17 scenarios)
- /api/adversarial-tests?run=true → 200 (17 tests — pass locally, honest serverless limitation on Vercel)

## 5 screenshots captured
## NOT PRODUCTION-AUTHORIZED. Honest-state preserved.
