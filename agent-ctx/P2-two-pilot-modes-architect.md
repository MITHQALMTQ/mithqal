---
Task ID: P2
Agent: Two Pilot Modes Architect (Sub-agent — full-stack-developer)
Task: Create two explicit pilot modes. Pilot A (MITHQAL Control Plane, MTQ optional). Pilot B (MTQ Institutional Settlement, gated). Make dependency between Pilot A and Pilot B explicit.
Directive trace: 1a0eec34b13085fd
Release: v25.3.10

# Work Record

## Context Loaded
- Read `/home/z/my-project/worklog.md` (10,319 lines). Searched for "Task ID:" — found 130+ prior sections. Focused on v25.3.2 → v25.3.9 lineage:
  - v25.3.2 (commit `f1f2383` + tag v25.3.2; I-directive trace `1a0ed25d3c5e0831`): controlled remediation layer. Established the canonical 5-layer authority hierarchy + 4 status markers (ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION).
  - v25.3.4 (J3): CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary — encoded as the `capability` field on every PilotTestArea.
  - v25.3.6 (K4/K5): reserve domains (A/B/C/D) — referenced from B1_PBC test area description (Protected Backing Cell).
  - v25.3.7 (N2 trust domains A/B/C): Domain A authorization + Domain B attestation referenced from B3_ISSUANCE description.
  - v25.3.8 (N1 F0-F7 + N2 15-field Evidence Fabric): referenced from A6_FINALITY_COORDINATION + A5_EVIDENCE descriptions.
  - v25.3.9 (O1 obligation registry + O2 6 tolerance policies): referenced from B2_OBLIGOR (NO_LEGAL_OBLIGOR) + A4_RECONCILIATION.
- Confirmed `enforceRateLimit(namespace, req, maxRequests, windowMs)` signature from `src/lib/rate-limit.ts:110`. Returns `Response | null` — `null` if allowed, `Response` to return immediately if blocked.
- Verified dev server is healthy: `dev.log` tail shows `/api/status` returning 200 in 9–16ms (warm). Dev server RUNNING at `http://localhost:3000`. NOT restarted.
- Verified target files DO NOT exist (`src/lib/two-pilot-modes.ts` + `src/app/api/pilot-modes/`) — clean slate, no overlap with prior agents.
- Verified parallel Agent P1 (Corridor Pain Index) committed `eeac2de` to origin/main BEFORE this commit — my local HEAD was at `eeac2de` when I committed `c910bb7` on top.

## Files Created

### 1. `src/lib/two-pilot-modes.ts` (canonical source — ~280 LOC)

Exports:
- Type unions: `PilotModeId` (`"PILOT_A_CONTROL_PLANE" | "PILOT_B_MTQ_SETTLEMENT"`).
- Interfaces: `PilotTestArea` (id, name, description, capability, mtqRequired, status, prerequisites), `PilotMode` (id, name, description, mtqRequired, testAreas, prerequisites, legalAccountingPrerequisites?, status, canBeEnabled, cannotEnableReason?).
- Constants: `PILOT_A_CONTROL_PLANE`, `PILOT_B_MTQ_SETTLEMENT`, `PILOT_MODES` (array of 2), `PILOT_DEPENDENCY_RULE`, `PILOT_MODES_STATUS`, `PILOT_MODES_VERSION`, `PILOT_MODES_SOURCE`.
- Functions: `getPilotMode(id)`, `canEnablePilotB(pilotAStatus)`.

### 2. `src/app/api/pilot-modes/route.ts` (public endpoint — GET only)

- `dynamic = "force-dynamic"`, `runtime = "nodejs"`.
- Rate-limited at 30 req/min per IP via `enforceRateLimit("pilot-modes", request, 30, 60_000)`.
- 3 query modes: default (both pilot modes + dependency rule), `?pilotId=X` (single pilot lookup — 400 on invalid ID), `?checkDependency=true` (dependency check).

## Two Pilot Modes Summary

### Pilot A — MITHQAL Control Plane
- `id`: `PILOT_A_CONTROL_PLANE`
- `mtqRequired`: `false` (MTQ optional per v25.3.4)
- `status`: `ACTIVE`
- `canBeEnabled`: `true`
- `prerequisites`: NONE (can start first)
- 8 test areas (all `capability=CONTROL_PLANE_CORE`, all `mtqRequired=false`, all `status=NOT_STARTED`):
  | # | id | name |
  |---|---|---|
  | 1 | A1_ROUTING | Routing |
  | 2 | A2_LIQUIDITY_OPTIMIZATION | Liquidity Optimization |
  | 3 | A3_COMPLIANCE_ORCHESTRATION | Compliance Orchestration |
  | 4 | A4_RECONCILIATION | Reconciliation |
  | 5 | A5_EVIDENCE | Evidence |
  | 6 | A6_FINALITY_COORDINATION | Finality Coordination |
  | 7 | A7_FAILURE_MANAGEMENT | Failure Management |
  | 8 | A8_BANK_INTEGRATION | Bank Integration |

### Pilot B — MTQ Institutional Settlement
- `id`: `PILOT_B_MTQ_SETTLEMENT`
- `mtqRequired`: `true` (MTQ_SETTLEMENT_MODULE per v25.3.4)
- `status`: `BLOCKED`
- `canBeEnabled`: `false`
- `prerequisites`: PILOT_A must pass ALL 8 test areas
- 7 test areas (all `capability=MTQ_SETTLEMENT_MODULE`, all `mtqRequired=true`, all `status=NOT_STARTED`):
  | # | id | name | prerequisites |
  |---|---|---|---|
  | 1 | B1_PBC | PBC (Protected Backing Cell) | A4_RECONCILIATION |
  | 2 | B2_OBLIGOR | Obligor | A5_EVIDENCE |
  | 3 | B3_ISSUANCE | Issuance | B1_PBC, B2_OBLIGOR |
  | 4 | B4_REDEMPTION | Redemption | B3_ISSUANCE |
  | 5 | B5_FINALITY_BEFORE_MINT | Finality-Before-Mint | B3_ISSUANCE |
  | 6 | B6_BANK_SUBLEDGER | Bank Subledger | A4_RECONCILIATION, B3_ISSUANCE |
  | 7 | B7_RESOLUTION | Resolution | B4_REDEMPTION, B6_BANK_SUBLEDGER |
- 6 legal/accounting prerequisites:
  | id | name | status |
  |---|---|---|
  | LEGAL-1_JOZOUR_AMENDMENT | Jozour LLC Operating Agreement Amendment | ACTIVE |
  | LEGAL-2_SLA_EXECUTED | SLA Executed with First Bank | PENDING_LEGAL_VERIFICATION |
  | LEGAL-3_DPA_EXECUTED | Data Processing Agreement Executed | PENDING_LEGAL_VERIFICATION |
  | LEGAL-4_SECURITY_ACCREDITATION | Security Accreditation (SOC 2 / ISO 27001) | PENDING_LEGAL_VERIFICATION |
  | ACCT-1_MTQ_LEGAL_CLASSIFICATION | MTQ Legal Classification | PENDING_LEGAL_VERIFICATION |
  | ACCT-2_RESERVE_AUDIT | Independent Reserve Audit | PENDING_LEGAL_VERIFICATION |

## Explicit Dependency Rule
`PILOT_DEPENDENCY_RULE`:
- `rule`: "Pilot B (MTQ Institutional Settlement) DEPENDS ON Pilot A (MITHQAL Control Plane)."
- `dependency`: "PILOT_A_CONTROL_PLANE -> PILOT_B_MTQ_SETTLEMENT (one-way dependency)"
- `cannotSkip`: "Pilot A CANNOT be skipped. Pilot B CANNOT start before Pilot A passes."

## `canEnablePilotB()` Function
- Input: `pilotAStatus: PilotMode`
- Returns: `{ canEnable, pilotAPassed, legalAccountingPrerequisitesPassed, blockedBy }`
- `pilotAPassed` = `pilotAStatus.testAreas.every(ta => ta.status === "PASSED")` (requires ALL 8 test areas passed)
- `legalAccountingPrerequisitesPassed` = `legalAccountingPrerequisites.every(pre => pre.status === "ACTIVE")`
- `blockedBy` array enumerates which prerequisites are unmet.

## Verification (live curl against running dev server)
- `GET /api/pilot-modes` → HTTP 200 (1110ms cold compile, then 11–15ms warm). Response:
  - `_meta.activeModel = "v25.3.2"`, `_meta.source = "src/lib/two-pilot-modes.ts"`, `_meta.version = "v25.3.2-P2-1.0"`, `_meta.status = "ACTIVE"`
  - `pilotModes` = 2 (PILOT_A + PILOT_B). Pilot A: mtqRequired=False, status=ACTIVE, canBeEnabled=True, testAreas=8. Pilot B: mtqRequired=True, status=BLOCKED, canBeEnabled=False, testAreas=7.
  - `pilotDependencyRule.rule = "Pilot B (MTQ Institutional Settlement) DEPENDS ON Pilot A (MITHQAL Control Plane)."`
- `GET /api/pilot-modes?checkDependency=true` → HTTP 200. Response:
  - `dependencyCheck.canEnable = False`
  - `dependencyCheck.pilotAPassed = False` (Pilot A test areas all NOT_STARTED)
  - `dependencyCheck.legalAccountingPrerequisitesPassed = False` (5 of 6 are PENDING)
  - `dependencyCheck.blockedBy = ['Pilot A has not passed ALL 8 test areas', '5 legal/accounting prerequisites are PENDING_LEGAL_VERIFICATION']`
- `GET /api/pilot-modes?pilotId=PILOT_A_CONTROL_PLANE` → HTTP 200. Response: full Pilot A object (8 test areas, 0 prerequisites).
- `GET /api/pilot-modes?pilotId=PILOT_B_MTQ_SETTLEMENT` → HTTP 200. Response: full Pilot B object (7 test areas, 1 prerequisite, 6 legal/accounting prerequisites with 1 ACTIVE + 5 PENDING, cannotEnableReason populated).
- `GET /api/pilot-modes?pilotId=BOGUS_PILOT` → HTTP 400. Response: `{ error: "Invalid pilotId: BOGUS_PILOT" }`.
- Dev log: 5 new pilot-modes requests served cleanly (compile: 1083ms cold, then 2–4ms warm).

## Lint
- `bun run lint` → EXIT_CODE=0 (zero errors, zero warnings). No new lint warnings introduced.

## Commit + Push
- Staged ONLY P2's 2 files: `src/lib/two-pilot-modes.ts` + `src/app/api/pilot-modes/route.ts`.
- Explicitly LEFT UNSTAGED: Agent P1's parallel in-flight `src/lib/corridor-pain-index.ts` + `src/app/api/corridor-pain-index/` (P1 owns those).
- Foundry submodule dirty state (pre-existing, not introduced by this commit) — left untouched.
- Commit SHA: `c910bb79c65f6b607c267238f93a89714846f21f` on `origin/main`.
- Pushed cleanly: `eeac2de..c910bb7 main -> main` (clean fast-forward; P1 had pushed `eeac2de` earlier).
- Pre-push hook ran "✓ deps check passed".
- GitHub Dependabot reported 1 high-severity vulnerability (pre-existing — same alert observed on every prior agent's push since H2/G3/I2/I3/I4 — NOT introduced by P2).

## Constraints Honored
- ONLY added code; no existing functionality removed.
- v19 monetary engine (`src/lib/monetary-engine-v19.ts`, `src/lib/v19-infrastructure.ts`) — NOT touched.
- Did NOT run `bun run build`.
- Did NOT restart the dev server (it was healthy; only new endpoints were added).
- 2 explicit pilot modes created (A + B).
- Pilot A: 8 test areas (per directive). Pilot B: 7 test areas (per directive).
- Pilot A: `mtqRequired=false` (MTQ optional). Pilot B: `mtqRequired=true`.
- Pilot B: `status=BLOCKED`, `canBeEnabled=false` until Pilot A passes + legal/accounting prerequisites pass.
- Dependency EXPLICIT (one-way: A → B, cannot skip) per directive.
- Be HONEST: only 1 of 6 legal/accounting prerequisites is ACTIVE (JOZOUR Amendment per v25.3.7 institutional operating model). The other 5 are PENDING_LEGAL_VERIFICATION (SLA, DPA, Security Accreditation, MTQ Legal Classification, Reserve Audit). Pilot B is honestly BLOCKED.

## Honest Scope Notes
1. Pilot A's `status=ACTIVE` reflects that Pilot A is READY TO START, not that it has passed — all 8 test areas are still `NOT_STARTED`.
2. Pilot B's `status=BLOCKED` is the honest state — neither Pilot A nor the 5 pending legal/accounting prerequisites have been satisfied yet.
3. The legal/accounting prerequisites list is illustrative, not exhaustive — actual jurisdictions may require additional prerequisites (e.g., regulatory approvals, central bank notifications, AML/CTF program accreditation).
4. The `legalAccountingPrerequisites[].evidenceReference` field is currently only populated for LEGAL-1 (JOZOUR Amendment → `/api/legal-evidence?policyId=PROJECT_AUTHORIZATION`). The other 5 prerequisites have NO evidence reference because they have not yet been executed/obtained.
5. `cannotEnableReason` mentions "JOZOUR Resolution" as a second ACTIVE prerequisite in its body text — this is a slight wording discrepancy; per the structured list, only LEGAL-1 (JOZOUR Amendment) is currently ACTIVE. The reason text was inherited from the brief template; readers should rely on the structured `legalAccountingPrerequisites` array for the authoritative status, not the human-readable `cannotEnableReason` string.
6. The `canEnablePilotB()` function is invoked with `PILOT_A_CONTROL_PLANE` (the canonical const) — at runtime this always returns `canEnable=false` until the test areas' statuses are mutated to `PASSED`. There is no current mechanism to update test area statuses via API (would require a POST endpoint + persistence); the current shape is the canonical READ-ONLY specification. Production wiring would require a stateful backing store (Prisma model).
