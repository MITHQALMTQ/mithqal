# Deployment Provenance Pack — v25.3.11 (Bank Value Model + Pilot Gate Framework)

**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.11`
**Parent**: v25.3.10 (corridor pain index + two pilot modes)

## Commits (2 by parallel agents)
- `f422fb0` (Q1): Bank Value Model — 11-component formula + 4 evidence status labels + bank-entered baseline + no hard-coded numbers
- `4a0e6bd` (Q2): Pilot Gate Framework — 11-field gate + 15 default gates + two independent status tracks + canPassWithImplementationOnly=false + evidence-based

## Half 1: Bank Value Model (Q1)
- Formula: `Bank Net Value = Liquidity Benefit + FX Benefit + Operational Savings + Compliance/Evidence Savings + Risk Value + New Revenue - Integration Cost - Operating Cost - Compliance Cost - Risk Capital Cost - Change Cost`
- 6 benefits + 5 costs = 11 components
- Bank enters ALL baseline data (no hard-coded 7bps or sub-2-second numbers)
- 4 evidence status labels: SIMULATED / ILLUSTRATIVE / VALIDATED / INSTITUTIONALLY_VERIFIED
- Sample: $157.1M Net Value (ILLUSTRATIVE, noHardCodedNumbers=true)

## Half 2: Pilot Gate Framework (Q2)
- 11 fields per gate: objective, owner, dependency, acceptanceCriterion, evidenceArtifact, evidenceHash, reviewer, approval, expiry, remediation, productionImpact
- 15 default gates (8 Pilot A + 7 Pilot B)
- Two INDEPENDENT status tracks: ImplementationStatus + InstitutionalValidationStatus
- canPassWithImplementationOnly = ALWAYS false (per directive: "No gate can become PASSED merely because code exists or tests pass")
- Evidence-based (artifact + hash, NOT documentation volume)
- 0/15 gates passed (none auto-pass), 14 blocked (dependencies), 1 pending

## Vercel prod verified LIVE
- /api/bank-value-model → 200 (formula + 4 labels)
- /api/bank-value-model?sample=true → 200 ($157.1M, ILLUSTRATIVE)
- /api/pilot-gates → 200 (15 gates, 0 passed, 14 blocked)
- /api/pilot-gates?checkCodeOnlyPass=true → canPassWithImplementationOnly=false

## 6 screenshots captured
## NOT PRODUCTION-AUTHORIZED. Honest-state preserved.
