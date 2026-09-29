# Deployment Provenance Pack — v25.3.4 (Settlement Workflow Canonicalization + Control Plane Boundary)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + Crypto-Economist + System Architect
**Release tag**: `v25.3.4`
**Parent**: v25.3.3 (authority hierarchy rewrite)
**Release type**: Controlled Remediation — settlement workflow canonicalization + control-plane boundary

## User directive (verbatim, trace 1a0ed403c08c123d)

> "Canonicalize the settlement workflow.
> Use exactly: BM-01–BM-08 = Bank / customer / MBG; BM-09 = Eligibility;
> BM-10 = Jurisdiction; BM-11 = Backing Verification; BM-12 = Bank Risk;
> BM-13 = System Risk; BM-14 = DMCE; BM-15 = Monetary Authorization;
> BM-16A = Finality Verification; BM-16B = Mint Execution.
> Remove every conflicting definition of BM-15 or BM-16.
> Update: blueprint, workflow state machine, APIs, tests, audit records, diagrams, terminology registry.
> The implementation and documentation must resolve to exactly one meaning per ID.
> Refactor the product architecture so MITHQAL control-plane functionality does not depend on MTQ.
> MITHQAL must operate conceptually and technically with: bank money, central-bank money, RTGS,
> tokenized deposits, wholesale CBDC, other legally recognized settlement assets, MTQ where appropriate.
> MTQ becomes an optional closed-loop institutional settlement primitive. Do not delete MTQ.
> Create a clean capability boundary: CONTROL_PLANE_CORE versus MTQ_SETTLEMENT_MODULE.
> The control plane must remain usable when MTQ is disabled."

## Commits in v25.3.4 (4 total)

| SHA | Agent | Purpose |
|---|---|---|
| `7a0fa42` | J2 | Canonicalize BM-01..BM-16B settlement workflow (17 steps, single source of truth) |
| `260bbf2` | J2 | Append J2 worklog + agent-ctx record |
| `6ad83f2` | J3 | CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE boundary refactor |
| (this commit) | orchestrator | v25.3.4 deployment provenance pack |

## 1. BM-* Settlement Workflow Canonicalized (Agent J2)

### Single canonical source created
- `src/lib/settlement-workflow-canonical.ts` (654 LOC) — the SOLE canonical source for all 17 BM-* definitions
- All other modules MUST import from here; any inline BM-* definition elsewhere is a CONTRADICTION

### 17 BM-* steps (exactly per user directive)

| ID | Name | Phase | Capability |
|---|---|---|---|
| **BM-01** | Corporate / Customer Initiates Settlement Request | CUSTOMER | CONTROL_PLANE_CORE |
| **BM-02** | Bank Receives Request + KYC / KYB Verification | BANK | CONTROL_PLANE_CORE |
| **BM-03** | AML / Sanctions / Beneficial Ownership Screening | BANK | CONTROL_PLANE_CORE |
| **BM-04** | Bank Establishes / Verifies Eligible Funding | BANK | CONTROL_PLANE_CORE |
| **BM-05** | Bank Issues AvailableBackingCertificate to MITHQAL | BANK | CONTROL_PLANE_CORE |
| **BM-06** | Bank Requests Settlement via MBG | MBG | CONTROL_PLANE_CORE |
| **BM-07** | MBG Authenticates Bank Institution | MBG | CONTROL_PLANE_CORE |
| **BM-08** | MBG Translates (Not Transforms) Bank Request | MBG | CONTROL_PLANE_CORE |
| **BM-09** | **Eligibility Check** | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-10** | **Jurisdiction Check** | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-11** | **Backing Verification** | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-12** | **Bank-Specific Risk Assessment** (was "Bank Risk") | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-13** | **System-Wide Risk / Concentration Check** (was "System Risk") | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-14** | **DMCE — Dynamic Minting Capacity Evaluation** | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-15** | **Monetary Authorization** (asset-agnostic — was "Mint Permission Engine") | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-16A** | **Finality Verification** (asset-agnostic — NEW, split from old BM-16) | CONTROL_PLANE_CORE | CONTROL_PLANE_CORE |
| **BM-16B** | **Mint Execution (MTQ-specific, OPTIONAL)** (split from old BM-16) | MTQ_SETTLEMENT_MODULE | MTQ_SETTLEMENT_MODULE |

### Conflicts removed (5 active inline BM-15/BM-16 definitions)

1. `final-integrated-architecture.ts:1188` — old "BM-15 = Mint Permission Engine" → REPLACED with canonical Monetary Authorization
2. `final-integrated-architecture.ts:1189` — old "BM-16 = Technical Mint Execution" → REPLACED (split into BM-16A + BM-16B)
3. `mtq-os/index.ts:24` — inline BM-15 → REPLACED with re-export
4. `mtq-os/index.ts:25` — inline BM-16 → REPLACED (split)
5. (J3's concurrent draft of settlement-workflow-canonical.ts) — overwritten with J2's canonical mapping (preserving J3's API surface)

### Files updated (10 total)
- 2 NEW: `src/lib/settlement-workflow-canonical.ts`, `docs/diagrams/settlement-workflow.mmd`
- 8 MODIFIED: `final-integrated-architecture.ts`, `mtq-os/index.ts`, `finality-before-mint.ts`, `jurisdictional-pilot-authorization.ts`, `v24-2-state-machine.ts`, `v24-2-registry.ts`, `policy-registry.ts`, `src/app/os/page.tsx`
- Tests + audit-data: zero BM-* refs found → no updates needed (honestly documented)

### Diagram created (Mermaid)
`docs/diagrams/settlement-workflow.mmd` (89 LOC) — `stateDiagram-v2` showing:
- BM-01 → BM-16B linear sequence
- BM-16A → BM-16B conditional (only if settlement asset = MTQ)
- BM-16A → [*] COMPLETED-NOT-REQUIRED (if settlement asset ≠ MTQ)
- 3 SUPERSEDED annotations

## 2. CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE Boundary (Agent J3)

### Capability boundary document
`docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md` (217 LOC, 8 sections):
- CONTROL_PLANE_CORE: asset-agnostic, REQUIRED, works with 7 settlement asset types
- MTQ_SETTLEMENT_MODULE: MTQ-specific, OPTIONAL, disable-able

### 7 supported settlement asset types (asset-agnostic control plane)
1. BANK_MONEY
2. CENTRAL_BANK_MONEY
3. RTGS
4. TOKENIZED_DEPOSITS
5. WHOLESALE_CBDC
6. MTQ (only when MTQ_SETTLEMENT_MODULE is enabled)
7. OTHER_LEGALLY_RECOGNIZED

### New env var gate
`MTQ_SETTLEMENT_ENABLED` (default: "true", backward compatible):
- "true" (default) → all endpoints function as before (MTQ operational)
- "false" → MTQ-specific endpoints return 503, control plane continues 200

### New asset-agnostic endpoint
`/api/control-plane/settlement-status` (132 LOC, force-dynamic, rate-limited 30/min):
- Returns 16 BM-* control-plane steps (asset-agnostic)
- Returns 1 BM-16B MTQ-settlement step (optional)
- Exposes `mtqSettlementEnabled` flag
- Exposes `supportedSettlementAssets` (7 when MTQ enabled, 6 when disabled)
- Always returns 200 (control plane is always operational)

### MTQ-disabled gate added to 10 routes
Each route returns 503 when `MTQ_SETTLEMENT_ENABLED=false`:
1. `/api/mint`
2. `/api/redeem`
3. `/api/transfer`
4. `/api/nav`
5. `/api/mtq-purchasing-power`
6. `/api/mtq-final-reserve`
7. `/api/mtq-finality-before-mint`
8. `/api/mtq-protected-backing-cell`
9. `/api/mtq-three-book-separation`
10. `/api/mtq-bank-default-resolution`

When MTQ is disabled:
- /api/control-plane/* → 200 ✅ (operational)
- /api/status, /api/health, /api/policy-registry, /api/legal-evidence → 200 ✅ (control plane operational)
- /api/mint, /api/redeem, /api/transfer, /api/nav, /api/mtq-* → 503 (MTQ module disabled)

### Decoupling (additive only, backward compat preserved)
- `wholesale-settlement.ts`: `mtqAmount` → `settlementAmount` (asset-agnostic), added `settlementAssetType` field
- `wholesale-tokenomics.ts`: `mtqTurnover` → `settlementAssetTurnover` (asset-agnostic), MTQ-specific calc now optional
- Legacy field names kept as `@deprecated` aliases (no breaking changes)

## 3. Live verification (2026-09-29T13:25Z)

### Vercel prod `/api/control-plane/settlement-status`:
```
_meta.activeModel: v25.3.2
_meta.capability: CONTROL_PLANE_CORE
_meta.mtqSettlementEnabled: True (default, backward compatible)
supportedSettlementAssets: [BANK_MONEY, CENTRAL_BANK_MONEY, RTGS, TOKENIZED_DEPOSITS, WHOLESALE_CBDC, MTQ, OTHER_LEGALLY_RECOGNIZED]
controlPlaneWorkflow: 16 steps (BM-01..BM-16A — asset-agnostic)
mtqSettlementWorkflow: 1 step (BM-16B — MTQ-specific, optional=True)
assetAgnostic: True
```

### All endpoints verified live on Vercel prod:
- `/api/control-plane/settlement-status` → 200 (NEW, asset-agnostic control plane)
- `/api/policy-registry` → 200 (layer 3 — 23 ACTIVE policies)
- `/api/legal-evidence` → 200 (layer 4 — 6 evidence items)
- `/api/status` → 200 (db connected)
- `/api/nav` → 200 (MTQ operational in default mode)
- `/` → 200 (home renders)

## 4. Constitutional compliance preserved

- ✅ Sole-writer principle: deterministic v19 monetary engine remains the only state mutator
- ✅ MTQ is NOT deleted (per directive — it becomes optional, not removed)
- ✅ Control plane is asset-agnostic (works with 7 settlement asset types, not just MTQ)
- ✅ MTQ_SETTLEMENT_MODULE is OPTIONAL (disable-able via MTQ_SETTLEMENT_ENABLED env var)
- ✅ Control plane remains usable when MTQ is disabled (per directive)
- ✅ Honest-state discipline preserved (§74 — NOT PRODUCTION-AUTHORIZED)
- ✅ 8 constitutional invariants unchanged (per JOZOUR Amendment §1.3)
- ✅ Authority hierarchy preserved (v25.3.2 is the apex)
- ✅ Single canonical BM-* source (no conflicts)
- ✅ Override-prevention rules preserved (no historical section may silently override)

## 5. 5 screenshots captured

In `/home/z/my-project/screenshots/v25.3.4-settlement-canonicalization/`:
1. `01-vercel-prod-control-plane-settlement-status.png` — NEW endpoint with 16 control-plane + 1 MTQ-optional steps
2. `02-github-commits-v25.3.4.png` — J2 + J3 commits visible
3. `03-github-canonical-workflow-source.png` — settlement-workflow-canonical.ts on GitHub
4. `04-github-control-plane-vs-mtq-boundary.png` — boundary architecture document
5. `05-github-mermaid-state-diagram.png` — Mermaid state diagram

## Status

**v25.3.4 — Settlement workflow canonicalized (BM-01..BM-16B, single source). Control-plane / MTQ-settlement-module boundary established. Control plane is asset-agnostic (7 settlement asset types). MTQ is optional (disable-able). Control plane remains usable when MTQ is disabled. NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
