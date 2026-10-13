# Agent P1 — Corridor Pain Index Architect

**Task ID**: P1
**Task**: Create configurable Corridor Pain Index. Score corridors using 12 factors. Use score to select first pilot corridor. Do NOT hard-code AED→EGP, SAR→INR, or AED→SGD.
**Directive trace**: `1a0eec34b13085fd`
**Release**: v25.3.10
**Commit SHA**: `2efa21672a787db8b188eca55f6d3c9c8c6e7575` on `origin/main`
**Date**: 2026-09-29

## Files Created

1. `src/lib/corridor-pain-index.ts` (~420 LOC) — single canonical source for corridor scoring
2. `src/app/api/corridor-pain-index/route.ts` (~145 LOC) — public endpoint (GET + POST)

## The 12 Pain Factors (per directive)

Weights sum to EXACTLY 1.00 (per CRITICAL CONSTRAINTS):

| # | Factor ID | Weight | higherIsWorse |
|---|-----------|--------|---------------|
| 1 | PAYMENT_VOLUME | 0.10 | true |
| 2 | SETTLEMENT_LATENCY | 0.10 | true |
| 3 | FX_FRICTION | 0.10 | true |
| 4 | CORRESPONDENT_DEPENDENCY | 0.08 | true |
| 5 | LIQUIDITY_IMMOBILIZATION | 0.10 | true |
| 6 | MANUAL_OPERATIONS | 0.08 | true |
| 7 | RECONCILIATION_BURDEN | 0.08 | true |
| 8 | COMPLIANCE_DUPLICATION | 0.08 | true |
| 9 | FAILURE_FREQUENCY | 0.10 | true |
| 10 | REGULATORY_FEASIBILITY | 0.08 | false |
| 11 | BANK_WILLINGNESS | 0.05 | false |
| 12 | CORPORATE_DEMAND | 0.05 | false |

- 5 factors at 0.10 = 0.50
- 5 factors at 0.08 = 0.40
- 2 factors at 0.05 = 0.10
- **Total = 1.00** ✓

NOTE: directive's draft listed PAYMENT_VOLUME at 0.12 (sum 1.02); adjusted to 0.10 to satisfy "Weights MUST sum to 1.00" constraint. PAYMENT_VOLUME remains tied for the highest weight; relative ordering preserved.

## Endpoint Behavior

`GET /api/corridor-pain-index`
- Default: returns 12-factor schema + weightsSum=1.0 + _meta (taskId=P1, taskTrace, noHardCodedPilotRule, honestState)
- `?selectPilot=true`: selects first pilot corridor BY SCORE (highest pain score) — NOT hard-coded
- `?samples=true`: returns ranked sample corridors without pilot selection

`POST /api/corridor-pain-index`
- Body = single CandidateCorridor object → returns one CorridorPainScore
- Body = array of CandidateCorridor → returns ranked array (same algorithm as selectPilot)

Rate-limited at 30 req/min GET, 10 req/min POST per IP via `enforceRateLimit()`.

## First Pilot Corridor — Selected BY SCORE (not hard-coded)

From `SAMPLE_CORRIDORS` (5 entries for testing the algorithm):

| Rank | Corridor ID | Pain Score | Recommendation |
|------|-------------|-----------|----------------|
| 1 | **CN-AE** (China → UAE, CNY → AED) | **64.5** | FIRST PILOT CORRIDOR — highest pain score |
| 2 | IN-AE (India → UAE, INR → AED) | 63.4 | Second priority — backup pilot corridor |
| 3 | AE-EG (UAE → Egypt, AED → EGP) | 60.25 | Priority 3 — AE-EG is a SAMPLE, NOT hard-coded as pilot |
| 4 | JP-US (Japan → US, JPY → USD) | 46.25 | Priority 4 |
| 5 | SG-AE (Singapore → UAE, SGD → AED) | 44.95 | Priority 5 |

The pilot is selected by `selectFirstPilotCorridor()` → `allRanked[0]` after descending sort by `totalPainScore`. **NOT hard-coded.**

SAR→INR and AED→SGD are NOT present in the sample set at all — no risk of accidental hard-coding.

## NO_HARD_CODED_PILOT_RULE

Exported constant from `src/lib/corridor-pain-index.ts`:

> "Per P-directive: 'Do not hard-code AED→EGP, SAR→INR or AED→SGD.' The first pilot corridor is selected by the highest pain score, NOT by hard-coding. Operators can add/remove corridors via the API."

Surfaced in `_meta.noHardCodedPilotRule` on the default GET + `?selectPilot=true` GET endpoints.

## Verification

- `bun run lint` → EXIT_CODE=0 (zero errors, zero warnings)
- All 4 endpoint modes verified live against running dev server on port 3000
- 12 factors confirmed, weightsSum=1.0 exactly, 9 higherIsWorse=true + 3 higherIsWorse=false
- Pilot corridor CN-AE confirmed selected by score (64.5), not hard-coded
- POST single + POST array both return correctly ranked CorridorPainScore objects

## Preserved Invariants

- v19 monetary engine: NOT touched
- Existing `src/app/api/corridor/route.ts` + `src/lib/corridor/aed-sgd.ts`: NOT touched (additive new sibling)
- Agent P2's `src/lib/two-pilot-modes.ts` (commit `c910bb7`): NOT touched (parallel agent's domain)
- Only ADDED code; no existing functionality removed

## Closes

Closes the Corridor Pain Index half of the P-directive (trace `1a0eec34b13085fd`). The two pilot modes (A + B) half is handled by Agent P2 (parallel, commit `c910bb7`).
