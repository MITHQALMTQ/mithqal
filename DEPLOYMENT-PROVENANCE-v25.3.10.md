# Deployment Provenance Pack — v25.3.10 (Corridor Pain Index + Two Pilot Modes)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.10`
**Parent**: v25.3.9 (obligation registry + reconciliation tolerance)
**Release type**: Controlled Remediation — corridor pain index + two pilot modes

## User directive (verbatim, trace 1a0eec34b13085fd)

> "Create a configurable Corridor Pain Index. Score candidate corridors using 12 factors. Use the score to select the first pilot corridor. Do not hard-code AED→EGP, SAR→INR or AED→SGD.
>
> Create two explicit pilot modes. Pilot A — MITHQAL Control Plane (MTQ optional/not required). Test: routing, liquidity optimization, compliance orchestration, reconciliation, evidence, finality coordination, failure management, bank integration. Pilot B — MTQ Institutional Settlement (only enabled after legal/accounting prerequisites pass). Test: PBC, obligor, issuance, redemption, finality-before-mint, bank subledger, resolution. Make the dependency between Pilot A and Pilot B explicit."

## Commits in v25.3.10 (2 commits by 2 parallel agents)

| SHA | Agent | Purpose |
|---|---|---|
| `c910bb7` | P2 | Two pilot modes — Pilot A (8 test areas, MTQ optional) + Pilot B (7 test areas, BLOCKED) + explicit dependency |
| `2efa216` | P1 | Corridor Pain Index — 12 factors + first pilot corridor selected by score (CN-AE, not hard-coded) |

## Half 1: Corridor Pain Index (Agent P1 — commit `2efa216`)

### 12 pain factors (weights sum to 1.00)

| # | Factor | Weight | Higher Is Worse |
|---|---|---|---|
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

### First pilot corridor selected BY SCORE (not hard-coded)

| Rank | Corridor | Pain Score | |
|---|---|---|---|
| **#1** | **CN-AE** (China → UAE, CNY → AED) | **64.5** | **FIRST PILOT CORRIDOR** |
| #2 | IN-AE (India → UAE, INR → AED) | 63.4 | Backup |
| #3 | AE-EG (UAE → Egypt, AED → EGP) | 60.25 | Sample (NOT hard-coded) |
| #4 | JP-US (Japan → US, JPY → USD) | 46.25 | |
| #5 | SG-AE (Singapore → UAE, SGD → AED) | 44.95 | |

**NO_HARD_CODED_PILOT_RULE verified**: AED→EGP is a SAMPLE (ranked #3, not pilot). SAR→INR and AED→SGD are NOT in the sample set at all. The pilot is the **output of the algorithm**, not a constant.

## Half 2: Two Pilot Modes (Agent P2 — commit `c910bb7`)

### Pilot A — MITHQAL Control Plane (MTQ optional)

| # | Test Area | MTQ Required | Capability |
|---|---|---|---|
| 1 | Routing | false | CONTROL_PLANE_CORE |
| 2 | Liquidity Optimization | false | CONTROL_PLANE_CORE |
| 3 | Compliance Orchestration | false | CONTROL_PLANE_CORE |
| 4 | Reconciliation | false | CONTROL_PLANE_CORE |
| 5 | Evidence | false | CONTROL_PLANE_CORE |
| 6 | Finality Coordination | false | CONTROL_PLANE_CORE |
| 7 | Failure Management | false | CONTROL_PLANE_CORE |
| 8 | Bank Integration | false | CONTROL_PLANE_CORE |

**Status**: ACTIVE, canBeEnabled=true. No prerequisites (can start first).

### Pilot B — MTQ Institutional Settlement (BLOCKED)

| # | Test Area | MTQ Required | Prerequisites |
|---|---|---|---|
| 1 | PBC (Protected Backing Cell) | true | A4_RECONCILIATION |
| 2 | Obligor | true | A5_EVIDENCE |
| 3 | Issuance | true | B1_PBC, B2_OBLIGOR |
| 4 | Redemption | true | B3_ISSUANCE |
| 5 | Finality-Before-Mint | true | B3_ISSUANCE |
| 6 | Bank Subledger | true | A4_RECONCILIATION, B3_ISSUANCE |
| 7 | Resolution | true | B4_REDEMPTION, B6_BANK_SUBLEDGER |

**Status**: BLOCKED, canBeEnabled=false. Requires Pilot A to pass ALL 8 test areas + 6 legal/accounting prerequisites (1 ACTIVE + 5 PENDING_LEGAL_VERIFICATION).

### Explicit dependency (per directive: "Make the dependency between Pilot A and Pilot B explicit")

- **Rule**: "Pilot B (MTQ Institutional Settlement) DEPENDS ON Pilot A (MITHQAL Control Plane)."
- **Dependency**: `PILOT_A_CONTROL_PLANE -> PILOT_B_MTQ_SETTLEMENT` (one-way)
- **Cannot skip**: "Pilot A CANNOT be skipped. Pilot B CANNOT start before Pilot A passes."
- **Verified**: `canEnablePilotB()` returns `canEnable=false` (Pilot A not passed + 5 legal/accounting prerequisites PENDING)

### 6 legal/accounting prerequisites (honest state per M-directive "Do not invent legal facts")

| # | Prerequisite | Status |
|---|---|---|
| 1 | JOZOUR LLC Operating Agreement Amendment | **ACTIVE** |
| 2 | SLA Executed with First Bank | PENDING_LEGAL_VERIFICATION |
| 3 | Data Processing Agreement Executed | PENDING_LEGAL_VERIFICATION |
| 4 | Security Accreditation (SOC 2 / ISO 27001) | PENDING_LEGAL_VERIFICATION |
| 5 | MTQ Legal Classification | PENDING_LEGAL_VERIFICATION |
| 6 | Independent Reserve Audit | PENDING_LEGAL_VERIFICATION |

## Live verification (2026-09-29T20:15Z)

| Endpoint | Status | Key verification |
|---|---|---|
| `/api/corridor-pain-index` | 200 ✅ | 12 factors, weights sum to 1.00, NO_HARD_CODED_PILOT_RULE |
| `/api/corridor-pain-index?selectPilot=true` | 200 ✅ | CN-AE selected by score (64.5), NOT hard-coded |
| `/api/pilot-modes` | 200 ✅ | 2 modes (A: 8 test areas ACTIVE, B: 7 test areas BLOCKED) |
| `/api/pilot-modes?checkDependency=true` | 200 ✅ | canEnable=false (Pilot B blocked until Pilot A passes + legal/accounting prerequisites) |
| `/api/status` | 200 ✅ | db connected |

## All 5 platforms in harmony

| Platform | Status |
|---|---|
| GitHub origin/main | `2efa216` ✅ |
| GitHub tags | `v25.3.10` (to be pushed) |
| Vercel prod /api/corridor-pain-index (NEW) | 200 ✅ LIVE |
| Vercel prod /api/pilot-modes (NEW) | 200 ✅ LIVE |
| Turso DB | connected ✅ |
| Inngest Cloud | 401 unsigned GET ✅ |
| Neon (dormant) | DATABASE_BACKEND=turso ✅ |

## 7 screenshots captured

In `screenshots/v25.3.10-corridor-pain-pilot-modes/`:
1. `01-vercel-prod-corridor-pain-index-schema.png` — 12-factor schema
2. `02-vercel-prod-first-pilot-corridor.png` — CN-AE selected by score (not hard-coded)
3. `03-vercel-prod-pilot-modes.png` — 2 pilot modes + dependency
4. `04-vercel-prod-pilot-b-blocked.png` — Pilot B BLOCKED (dependency check)
5. `05-github-commits-v25.3.10.png` — P1 + P2 commits
6. `06-github-corridor-pain-index-source.png` — corridor-pain-index.ts on GitHub
7. `07-github-two-pilot-modes-source.png` — two-pilot-modes.ts on GitHub

## Constitutional compliance preserved

- ✅ **12-factor Corridor Pain Index** created (weights sum to 1.00)
- ✅ **First pilot corridor selected BY SCORE** (CN-AE, pain=64.5 — NOT hard-coded)
- ✅ **NO hard-coded AED→EGP, SAR→INR, or AED→SGD** (AE-EG is a sample ranked #3, not pilot)
- ✅ **Two explicit pilot modes** (A: Control Plane, B: MTQ Settlement)
- ✅ **Pilot A: 8 test areas** (routing, liquidity, compliance, reconciliation, evidence, finality, failure, bank integration)
- ✅ **Pilot B: 7 test areas** (PBC, obligor, issuance, redemption, finality-before-mint, bank subledger, resolution)
- ✅ **Pilot A: MTQ optional** (mtqRequired=false)
- ✅ **Pilot B: MTQ required** (mtqRequired=true, status=BLOCKED)
- ✅ **Explicit dependency** (A → B, one-way, cannot skip)
- ✅ **6 legal/accounting prerequisites** (1 ACTIVE + 5 PENDING — honest state per "Do not invent legal facts")
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)

## Status

**v25.3.10 — Configurable Corridor Pain Index (12 factors, weights sum to 1.00). First pilot corridor selected BY SCORE (CN-AE, not hard-coded). Two explicit pilot modes: A (Control Plane, 8 test areas, MTQ optional, ACTIVE) + B (MTQ Settlement, 7 test areas, MTQ required, BLOCKED). Explicit dependency A→B (one-way, cannot skip). 6 legal/accounting prerequisites (1 ACTIVE + 5 PENDING). NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
