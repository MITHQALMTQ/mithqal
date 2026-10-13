# Agent Y1 — Pricing/Commercial Model + GTM/Design-Partner Architect

**Task ID:** Y1
**Agent:** Sub-agent (full-stack-developer) — Pricing/Commercial Model + GTM/Design-Partner Architect
**Release:** v25.3.20
**Change Requests:** CR-2026-011 (P35 Pricing) + CR-2026-012 (P36 GTM) per Architecture Freeze v25.3.15
**Approval:** COO + CTO joint approval
**Commit SHA:** `c63bdd6ee480c3467dc108836a3795e2f0a329df`
**Commit short SHA:** `c63bdd6`

## Task

- P35 Pricing architecture: 7 fee types × 7 price stages (49 records total), fees cannot influence control-plane decisions (MTQ issuance authorization / reserve decisions / risk decisions / finality decisions), no illustrative price may appear as current commercial pricing.
- P36 GTM framework: 9-state progression (RESEARCHED → CONTACTED → QUALIFIED → ARCHITECTURE_REVIEW → LEGAL_REVIEW → PILOT_CANDIDATE → CONTRACTED → PILOT → MEASURED), 6-factor target selection (Corridor Pain Index + regulatory feasibility + technical feasibility + executive sponsorship + integration capacity + evidence/reference value), 9 definition areas, no hard-coded bank/regulator/corridor as the winner.

## Files Created (4 NEW — additive, no removals)

1. `src/lib/institutional-pricing-architecture.ts` — 7 fee types × 7 price stages = 49 stage records; ALL prices PENDING; FEE_INDEPENDENCE_RULE + NO_ILLUSTRATIVE_AS_CURRENT_RULE; runtime invariants enforce honest state at module load.
2. `src/app/api/institutional-pricing/route.ts` — GET endpoint, 30 req/min rate limit, 3 query paths (default / ?feeTypeId= / ?optional=true|false).
3. `src/lib/institutional-gtm-framework.ts` — 9-state progression + 6-factor target selection (weights sum to 1.00) + 9 definition areas + 8 transitions (all fee-independent) + empty CANDIDATE_TARGET_REGISTRY; NO_HARD_CODED_WINNER_RULE; runtime invariants enforce honest state at module load.
4. `src/app/api/institutional-gtm/route.ts` — GET endpoint, 30 req/min rate limit, 4 query paths (default / ?state= / ?factorId= / ?areaId=).

## Critical Constraints Honored

- ONLY added code; never removed functionality ✓
- Did NOT modify the deterministic v19 monetary engine ✓
- Did NOT modify any FROZEN schema (per Architecture Freeze v25.3.15) ✓
- Did NOT use `bun run build` ✓
- Did NOT restart the dev server (stayed alive throughout) ✓
- P35: 7 fee types, 7 price stages each, ALL prices PENDING ✓ (49/49 = PENDING)
- P35: FEE_INDEPENDENCE_RULE (fees cannot influence controls — all 49 stage records carry mayInfluenceControlPlane=false, all 7 fee types carry cannotInfluenceControlPlane=true) ✓
- P35: NO_ILLUSTRATIVE_AS_CURRENT_RULE (no illustrative as current) ✓
- P36: 6 selection factors, 9 progression states, ALL targets RESEARCHED (CANDIDATE_TARGET_REGISTRY empty) ✓
- P36: NO_HARD_CODED_WINNER_RULE (no hard-coded bank/regulator/corridor — all bankEntityName/regulatorName/corridorId="PENDING", all isHardCodedWinner=false) ✓
- HONEST — all prices PENDING, all targets RESEARCHED ✓

## Verification (curl)

- `GET /api/institutional-pricing` → HTTP 200. `feeTypeCount=7` ✓, `priceStageCount=7` ✓, `totalPriceStageRecords=49` ✓, `honestState.allValuesPending=true` ✓.
- `GET /api/institutional-pricing?feeTypeId=IMPLEMENTATION_FEE` → HTTP 200. 7 stages, all values PENDING ✓.
- `GET /api/institutional-pricing?feeTypeId=INVALID` → HTTP 400 ✓.
- `GET /api/institutional-pricing?optional=true` → HTTP 200. `feeTypeCount=1` ✓ (OPTIONAL_INSTITUTIONAL_SERVICES).
- `GET /api/institutional-pricing?optional=false` → HTTP 200. `feeTypeCount=6` ✓.
- `GET /api/institutional-gtm` → HTTP 200. `progressionStateCount=9` ✓, `targetSelectionFactorCount=6` ✓, `definitionAreaCount=9` ✓, `candidateTargetCount=0` ✓, `honestState.hardCodedWinnerCount=0` ✓.
- `GET /api/institutional-gtm?state=PILOT_CANDIDATE` → HTTP 200. `outgoing[0].feeMayGateTransition=false` ✓.
- `GET /api/institutional-gtm?factorId=CORRIDOR_PAIN_INDEX` → HTTP 200. `factor.weight=0.25`, `factor.score=PENDING` ✓.
- `GET /api/institutional-gtm?areaId=DESIGN_PARTNER_CRITERIA` → HTTP 200. `area.status=PENDING` ✓.

## Lint

`bun run lint` → exit 0, no warnings, no errors ✓.

## Cross-references (per Architecture Freeze v25.3.15)

- v25.3.5 K2/K3 (MTQ economic definition + reserve coverage)
- v25.3.6 K4 (reserve domains) + J3 (control-plane boundary CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE)
- v25.3.7 M1/M2 (institutional operating model + trust domains)
- v25.3.8 N1 (canonical finality model F0-F7) + N2 (Evidence Fabric 15-field EvidencePackage)
- v25.3.9 O1 (Obligation Registry 13 fields) + O2 (6 reconciliation tolerance policies)
- v25.3.10 P1 (Corridor Pain Index 12 weighted factors) + P2 (two pilot modes A+B)
- v25.3.11 Q1 (bank value model + 4 evidence status labels) + Q2 (pilot gate framework 15 gates)
- v25.3.12 R1 (bank-facing document set) + R2 (RegulatoryReplayEngine READ-ONLY)
- v25.3.13 S1 (SettlementContinuityFabric 9 events × 7-stage lifecycle)
- v25.3.14 T2 (Controlled Architecture Freeze 10 frozen schemas)
- v25.3.15 T1 (Adversarial Tests 17/17 passed)
- v25.3.16 U1 (P25 Accounting/Prudential/Tax 10 areas) + U2 (P26 PBC Legal Enforceability)
- v25.3.17 V1 (PROMPT 27 Failure/Default/Resolution 6 forbidden assumptions)
- v25.3.18 W1 (P28 Bank Contracting Package 17 sections DRAFT + P29 Institutional External Identity 8 standards) + W2 (P30 Enterprise Risk Register + P31 Insurance Framework)
- v25.3.19 X2 (P34 Competitive Compatibility 7×14) + X1 (P32 Data Governance + P33 Dispute & Exception)

## Key Honest-State Invariants (verified at module load)

- 49/49 pricing stage values = "PENDING"
- 49/49 pricing stage statuses = "PENDING"
- 7/7 fee types carry separateFromRoiEngine=true
- 7/7 fee types carry cannotInfluenceControlPlane=true
- 49/49 stage records carry mayInfluenceControlPlane=false
- 6/6 GTM target-selection factor scores = "PENDING"
- 9/9 GTM definition areas status = "PENDING"
- 8/8 GTM progression transitions feeMayGateTransition=false
- 0 candidate targets in registry
- 0 hard-coded winners
- 0 candidates contacted

## Owner

Pricing + GTM Architect (Agent Y1) | Release: v25.3.20 | Change Requests: CR-2026-011 + CR-2026-012 (per Architecture Freeze v25.3.15)
