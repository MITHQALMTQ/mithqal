# Q2 — Pilot Gate Framework Architect

- **Task ID**: Q2
- **Agent**: Sub-agent (full-stack-developer) — Pilot Gate Framework Architect
- **Directive trace**: `1a0ef134a48f2b99` / `1a0ef141e52acf31`
- **Directive verbatim**:
  > "Build a pilot gate framework around evidence, not documentation volume. Each gate must contain: objective, owner, dependency, acceptance criterion, evidence artifact, evidence hash, reviewer, approval, expiry, remediation, production impact. No gate can become PASSED merely because code exists or tests pass. Keep institutional validation separate from implementation/testing status."
- **Commit SHA**: `4a0e6bd5cbaf28247170fcb471bc4e1e221c7d65`
- **Commit message**: `feat(gates): pilot gate framework — evidence-based, 11 fields, no code-only pass (v25.3.11)`
- **Branch**: `origin/main` (pushed cleanly on top of Q1's `f422fb0`)
- **Files created** (2):
  - `src/lib/pilot-gate-framework.ts` (~640 LOC)
  - `src/app/api/pilot-gates/route.ts` (~110 LOC)

## Files owned (Q2)
- `src/lib/pilot-gate-framework.ts` — canonical source
- `src/app/api/pilot-gates/route.ts` — public endpoint

## Files NOT touched (verified)
- `src/lib/monetary-engine-v19.ts` + `src/lib/v19-infrastructure.ts` — v19 monetary engine PRESERVED
- `src/lib/bank-value-model.ts` + `src/app/api/bank-value-model/` — Agent Q1's domain (commit `f422fb0`)
- `src/lib/two-pilot-modes.ts` + `src/app/api/pilot-modes/` — Agent P2's domain (commit `c910bb7`); Q2's gate IDs MAP 1:1 to P2's test area IDs but no P2 file was modified
- `src/lib/corridor-pain-index.ts` + `src/app/api/corridor-pain-index/` — Agent P1's domain (commit `2efa216`)

## The 11 fields per gate (exactly 11, per directive)
1. `objective` — what this gate is testing
2. `owner` — `{entityId, role, bankFacingCounterpartyEntityId?}` (per v25.3.7)
3. `dependency` — `{dependsOnGateIds: string[], rule: string}`
4. `acceptanceCriterion` — what evidence is required to pass
5. `evidenceArtifact` — `{artifactType, artifactReference, artifactDescription}` (EVIDENCE-BASED, not documentation-volume)
6. `evidenceHash` — SHA-256 hash of the evidence artifact (for integrity)
7. `reviewer` — `{reviewerId, reviewerRole, reviewerIndependenceVerified}` (independent from owner)
8. `approval` — `{approved, approvedBy?, approvedAt?, approvalNotes?}`
9. `expiry` — `{expiryDate?, isExpired, revalidationRequired}`
10. `remediation` — `{remediationPlan?, remediationOwner?, remediationDueDate?, remediationStatus?}`
11. `productionImpact` — `{ifPassed, ifFailed, ifExpired}`

Verified by `PILOT_GATE_FIELDS` readonly array of length 11 + `PILOT_GATE_FIELD_COUNT = 11` constant + live `fieldCount=11` on the default GET endpoint.

## Two independent status tracks (per directive)

### Track 1 — ImplementationStatus (the implementation/testing track)
`"NOT_IMPLEMENTED" | "IN_PROGRESS" | "IMPLEMENTED" | "TESTED" | "IMPLEMENTATION_BLOCKED"`

### Track 2 — InstitutionalValidationStatus (the institutional validation track — SEPARATE)
`"NOT_REVIEWED" | "UNDER_REVIEW" | "VALIDATED" | "APPROVED" | "REJECTED" | "EXPIRED"`

### Computed GateStatus (from BOTH tracks)
`"PENDING" | "PASSED" | "BLOCKED" | "EXPIRED"`

## `computeGateStatus(gate, allGates)` — gate is PASSED only when ALL 4 conditions met
1. `expiry.isExpired === false` (else EXPIRED)
2. ALL `dependency.dependsOnGateIds` are PASSED (else BLOCKED)
3. `implementationStatus === "TESTED"` (else PENDING — IMPLEMENTED alone is NOT enough)
4. `institutionalValidationStatus === "APPROVED"` (else PENDING — institutional validation is SEPARATE from implementation per directive)

## `canPassWithImplementationOnly(gate)` — ALWAYS returns false
```ts
{ canPass: false, reason: "Per Q-directive: 'No gate can become PASSED merely because code exists or tests pass.' Institutional validation (reviewer approval) is REQUIRED separately." }
```
Verified live: `GET /api/pilot-gates?checkCodeOnlyPass=true&gateId=GATE-A1-ROUTING` → `canPassWithImplementationOnly = false` ✓

## 15 default gates (8 Pilot A + 7 Pilot B)
- All start HONESTLY: `implementationStatus="NOT_IMPLEMENTED"`, `institutionalValidationStatus="NOT_REVIEWED"`, `gateStatus="PENDING"` (or `BLOCKED` by unmet dependency), `approval.approved=false`, `reviewer.reviewerIndependenceVerified=false`, `evidenceHash="sha256:pending-*"` placeholders.
- None auto-pass. `passedGates=0` verified live on default GET endpoint.

### Pilot A gates (8, gate IDs map 1:1 to v25.3.10 P2 Pilot A test area IDs)
| Gate ID | Test Area ID | Depends On |
|---|---|---|
| GATE-A1-ROUTING | A1_ROUTING | (none) |
| GATE-A2-LIQUIDITY_OPTIMIZATION | A2_LIQUIDITY_OPTIMIZATION | A1 |
| GATE-A3-COMPLIANCE_ORCHESTRATION | A3_COMPLIANCE_ORCHESTRATION | A1 |
| GATE-A4-RECONCILIATION | A4_RECONCILIATION | A1 |
| GATE-A5-EVIDENCE | A5_EVIDENCE | A1 |
| GATE-A6-FINALITY_COORDINATION | A6_FINALITY_COORDINATION | A4 |
| GATE-A7-FAILURE_MANAGEMENT | A7_FAILURE_MANAGEMENT | A6 |
| GATE-A8-BANK_INTEGRATION | A8_BANK_INTEGRATION | A1, A4, A6 |

### Pilot B gates (7, gate IDs map 1:1 to v25.3.10 P2 Pilot B test area IDs)
| Gate ID | Test Area ID | Depends On |
|---|---|---|
| GATE-B1-PBC | B1_PBC | A4 |
| GATE-B2-OBLIGOR | B2_OBLIGOR | A5 |
| GATE-B3-ISSUANCE | B3_ISSUANCE | B1, B2 |
| GATE-B4-REDEMPTION | B4_REDEMPTION | B3 |
| GATE-B5-FINALITY_BEFORE_MINT | B5_FINALITY_BEFORE_MINT | B3 |
| GATE-B6-BANK_SUBLEDGER | B6_BANK_SUBLEDGER | A4, B3 |
| GATE-B7-RESOLUTION | B7_RESOLUTION | B4, B6 |

## 3 RULE CONSTANTS (per directive)
- `NO_CODE_ONLY_PASS_RULE` — "No gate can become PASSED merely because code exists or tests pass. Institutional validation (reviewer approval) is REQUIRED separately."
- `INSTITUTIONAL_VALIDATION_SEPARATE_RULE` — "Institutional validation is SEPARATE from implementation/testing status. A gate with IMPLEMENTED+TESTED status but NOT_REVIEWED institutional validation is still PENDING, not PASSED."
- `EVIDENCE_NOT_DOCUMENTATION_RULE` — "Gates are EVIDENCE-BASED, not documentation-volume-based. The evidence artifact + evidence hash are the proof — not the number of pages of documentation."

## API endpoint `/api/pilot-gates`
- `dynamic = "force-dynamic"`, `runtime = "nodejs"`, rate-limited 30 req/min per IP via `enforceRateLimit("pilot-gates", request, 30, 60_000)`.
- 4 query modes:
  - Default — returns `_meta` (activeModel=v25.3.2, source, version, status, overrideRule, noCodeOnlyPassRule, institutionalValidationSeparateRule, evidenceNotDocumentationRule), `fieldCount=11`, `fields` (11-element array), `gates` (15 with status recomputed via `recomputeStatusInPlace` — shared module-level array NEVER mutated), `gateCount=15`, `pilotAGateCount=8`, `pilotBGateCount=7`, `passedGates`, `blockedGates`, `pendingGates`, `rule`.
  - `?gateId=X` — single gate lookup, 404 on invalid ID.
  - `?pilotModeId=X` — filter by pilot mode with per-filter passed/blocked/pending counts.
  - `?checkCodeOnlyPass=true&gateId=X` — verifies `canPassWithImplementationOnly` (always false).

## Verification matrix (live, against running dev server on port 3000)
| Test | Expected | Actual | Status |
|---|---|---|---|
| `bun run lint` | exit 0, 0 errors | exit 0, 0 errors | ✓ |
| `GET /api/pilot-gates` default | HTTP 200, fieldCount=11, 15 gates, passedGates=0 | HTTP 200 in 698ms, fieldCount=11, 15 gates, passedGates=0, blockedGates=14, pendingGates=1 | ✓ |
| `GET ?checkCodeOnlyPass=true&gateId=GATE-A1-ROUTING` | canPassWithImplementationOnly=false | canPassWithImplementationOnly=False | ✓ |
| `GET ?gateId=GATE-A1-ROUTING` | HTTP 200, gateStatus=PENDING | HTTP 200 in 8ms, gateStatus=PENDING | ✓ |
| `GET ?pilotModeId=PILOT_A_CONTROL_PLANE` | count=8, passedGates=0 | HTTP 200 in 10ms, count=8, passedGates=0, blockedGates=7, pendingGates=1 | ✓ |
| `GET ?pilotModeId=PILOT_B_MTQ_SETTLEMENT` | count=7, passedGates=0 | HTTP 200 in 8ms, count=7, passedGates=0, blockedGates=7, pendingGates=0 | ✓ |
| `GET ?gateId=DOES-NOT-EXIST` | HTTP 404 | HTTP 404, `{error: "Gate DOES-NOT-EXIST not found"}` | ✓ |
| Dev log tail | clean compile + warm | cold 674ms → warm 2-4ms, no warnings | ✓ |

## Honest scope notes (per M-directive "Do not invent legal facts")
1. All 15 gates start with `implementationStatus="NOT_IMPLEMENTED"` — no gate pretends to be implemented.
2. All 15 gates start with `institutionalValidationStatus="NOT_REVIEWED"` — no gate pretends to be reviewed.
3. All 15 gates start with `approval.approved=false` — no gate pretends to be approved.
4. All 15 gates start with `reviewer.reviewerIndependenceVerified=false` — no reviewer independence has been verified.
5. All 15 gates use `evidenceHash="sha256:pending-*"` placeholders — real hashes will be stamped when the Evidence Fabric (per v25.3.8 N2) actually packages the artifacts.
6. `passedGates=0` is the honest initial state — NO gate auto-passes merely because the framework code exists.
7. 14 gates are `BLOCKED` because they have unmet dependencies; 1 gate (GATE-A1-ROUTING, no deps) is `PENDING` because implementation + institutional validation are not yet complete.

## Closes
The pilot gate framework half of the Q-directive (trace `1a0ef134a48f2b99` / `1a0ef141e52acf31`). The bank value model half is handled by Agent Q1 (parallel — commit `f422fb0` "feat(value): bank value model + 4 evidence status labels (v25.3.11)" on origin/main immediately preceding this Q2 commit).
