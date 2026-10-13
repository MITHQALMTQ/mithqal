# M1 — Institutional Operating Model Architect (work record)

**Task ID:** M1
**Agent:** Sub-agent (full-stack-developer) — Institutional Operating Model Architect
**Directive trace:** `1a0ee14af343a085` (verbatim user directive)
**Release:** v25.3.7
**Commit SHA:** `daf9535746a4faa864c6d7c651e7915db2022bc2` (short: `daf9535`)
**Date:** 2026-09-30

## Pre-M1 state (no re-scan per task constraint)

Read `/home/z/my-project/worklog.md` (10,036 lines). Searched for "Task ID:" — found 130+ prior sections. Focused on:

- **v25.3.2** — controlled remediation layer (commit `f1f2383`, tag `v25.3.2`; I-directive trace `1a0ed25d3c5e0831`). Canonical 5-layer authority hierarchy: v25.3.2 apex → Constitution → policy registry → legal evidence → historical.
- **J2** (`56663ae`-style) — settlement workflow canonicalization (BM-*).
- **J3** (`67fd75e`-style) — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE capability boundary.
- **K3** (`bae1d67`) — Reserve Logic Refactor: Required Coverage = Direct Backing + Risk Buffer; universal 130% removed.
- **K2** — Canonical MTQ Economic Definition (`mtq-economic-definition.ts`).
- **K4** — Reserve Domains (Settlement Liquidity vs Strategic Resilience Reserve).
- **K5** (`677df6d`) — Pilot 1 config: gold=0%, digital=0%, AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION.

Current institutional structure (`src/lib/commercial-governance.ts`):
- 4 legal entities PLANNED (Foundation, Holding, Operations, Markets) — all `status: "planned"`.
- JOZOUR LLC (NJ, EIN 84-3470275) is the current operating entity per JOZOUR Amendment (July 31, 2026).
- Foundation is TO-BE-FORMED per JOZOUR Amendment §1.6.

What was MISSING (now created by M1):
- `bankFacingCounterpartyEntityId` canonical field (NEW)
- 8-field canonical structure (contracting authority, SLA owner, etc.) (NEW)
- `PENDING_LEGAL_VERIFICATION` status marker (NEW)
- Bank-facing single-counterparty abstraction layer (NEW)

## Files CREATED (2)

### 1. `src/lib/institutional-operating-model.ts` — 304 LOC

Single canonical source for the bank-facing institutional operating model. Any inline institutional counterparty definition elsewhere is a CONTRADICTION per the contradiction scanner.

**Types:**
- `VerificationStatus = "ACTIVE" | "PENDING_LEGAL_VERIFICATION" | "SUPERSEDED" | "HISTORICAL" | "AVAILABLE_FOR_FUTURE_VALIDATED_CONFIGURATION"`
- `BankFacingCounterpartyEntity` — interface with `bankFacingCounterpartyEntityId` + `legalName` + 8 `ResponsibilityField` fields + `verificationStatus` + `underlyingLegalEntity` + `internalSeparation` (holding/operating/technology/independentOversight) + `sourceLayers` (economicDefinition/institutionalOperator/capabilityBoundary/reserveDomains)
- `ResponsibilityField` — `responsibleEntity` + `bankFacingName` + `verificationStatus` + optional `underlyingInstrument` (`type`/`reference`/`executedDate`/`verifiedBy`) + optional `honestyNote`
- `InternalEntityRef` — `entityId` + `legalName` + `role` (HOLDING/OPERATING/TECHNOLOGY/INDEPENDENT_OVERSIGHT) + `verificationStatus` + `preserved` (boolean) + optional `notes`

**Canonical constant:** `BANK_FACING_COUNTERPARTY_ENTITY: BankFacingCounterpartyEntity`
- `bankFacingCounterpartyEntityId = "JOZOUR_LLC_NJ"` ← single external counterparty banks see
- `legalName = "Jozour, LLC (New Jersey)"`
- `verificationStatus = "ACTIVE"` (overall — entity itself is verified via JOZOUR Amendment)
- `underlyingLegalEntity = "Jozour, LLC (NJ, EIN 84-3470275, formed Oct 24, 2019)"`

**8 canonical fields (per M-directive):**
| # | Field | Status | Underlying Instrument |
|---|---|---|---|
| 1 | `contractingAuthority` | ACTIVE | JOZOUR Amendment No. 1 (2026-07-31), verified by M. Salah Eltonsy, Manager |
| 2 | `slaOwner` | PENDING_LEGAL_VERIFICATION | honestyNote: SLA template exists but NOT executed with any bank |
| 3 | `supportOwner` | PENDING_LEGAL_VERIFICATION | honestyNote: support process designed but NOT operationalized |
| 4 | `operationalLiability` | ACTIVE | JOZOUR Amendment §1.2 (2026-07-31) |
| 5 | `dataProcessingResponsibility` | PENDING_LEGAL_VERIFICATION | honestyNote: DPA template exists but NOT executed; GDPR/CCPA framework designed but not operationalized |
| 6 | `securityResponsibility` | PENDING_LEGAL_VERIFICATION | honestyNote: SOC 2 Type II / ISO 27001 / pentest designed but NOT accredited |
| 7 | `billingAuthority` | PENDING_LEGAL_VERIFICATION | honestyNote: fee schedule designed but NOT operationalized with any bank |
| 8 | `escalationPath` | ACTIVE | JOZOUR Amendment §1.2(h) + §1.5 (2026-07-31) |

**Honesty summary:** 3 of 8 fields ACTIVE (verified via executed JOZOUR Amendment); 5 of 8 fields PENDING_LEGAL_VERIFICATION because underlying executed instruments are NOT yet available per M-directive ("Do not invent legal facts").

**Internal separation (PRESERVED per M-directive):**
| # | Role | entityId | Status | Preserved | Notes |
|---|---|---|---|---|---|
| 1 | HOLDING | `MITHQAL_HOLDING_COMPANY_PLANNED` | PENDING_LEGAL_VERIFICATION | true | PLANNED; holding functions currently performed by Jozour, LLC |
| 2 | OPERATING | `JOZOUR_LLC_NJ` | ACTIVE | true | current operating entity per JOZOUR Amendment |
| 3 | TECHNOLOGY | `MITHQAL_TECHNOLOGY_ENTITY_PLANNED` | PENDING_LEGAL_VERIFICATION | true | PLANNED; technology functions currently performed by Jozour, LLC |
| 4 | INDEPENDENT_OVERSIGHT | `MITHQAL_FOUNDATION_PLANNED` | PENDING_LEGAL_VERIFICATION | true | TO-BE-FORMED per JOZOUR §1.6; 501(c)(3) not yet recognized |

All 4 internal refs have `preserved = true` — internal separation is PRESERVED in the data structure even though 3 of 4 entities are not yet formed. When formed, the refs will point to them.

**Source layers (per v25.3.2 authority hierarchy):**
- `economicDefinition`: v25.3.5 (src/lib/mtq-economic-definition.ts) — Agent K2
- `institutionalOperator`: JOZOUR Amendment §1.6 (two-entity architecture)
- `capabilityBoundary`: v25.3.4 (CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE) — Agent J3
- `reserveDomains`: v25.3.6 (Settlement Liquidity vs Strategic Resilience Reserve) — Agent K4

**Exports:**
- `BANK_FACING_COUNTERPARTY_ENTITY` (canonical const)
- `getBankFacingCounterpartyEntity(): BankFacingCounterpartyEntity`
- `getBankFacingCounterpartyEntityId(): string` → returns `"JOZOUR_LLC_NJ"`
- `getCanonicalFields(): { fieldName: string; field: ResponsibilityField }[]` → 8 entries
- `getInternalSeparation()` → 4 entity refs
- `INSTITUTIONAL_OPERATING_MODEL_STATUS = "ACTIVE"`
- `INSTITUTIONAL_OPERATING_MODEL_VERSION = "v25.3.2-M1-1.0"`
- `INSTITUTIONAL_OPERATING_MODEL_SOURCE = "src/lib/institutional-operating-model.ts"`

### 2. `src/app/api/institutional-operating-model/route.ts` — 53 LOC

Public GET endpoint at `/api/institutional-operating-model`. `dynamic = "force-dynamic"`, `runtime = "nodejs"`, rate-limited at 30 req/min/IP via `enforceRateLimit("institutional-operating-model", request, 30, 60_000)`.

Response shape:
- `_meta` — `activeModel: "v25.3.2"`, `modelSource`, `modelVersion`, `status`, `overrideRule` (Banks see exactly ONE external contractual counterparty. Internal separation preserved. PENDING_LEGAL_VERIFICATION where instruments not available.), `mDirectiveTrace: "1a0ee14af343a085"`, `crossReferences` (K2/J3/K4/K5/commercial-governance attribution)
- `bankFacingCounterpartyEntityId` — `"JOZOUR_LLC_NJ"` (canonical field)
- `bankFacingCounterpartyEntity` — full `BankFacingCounterpartyEntity` object
- `canonicalFields` — array of 8 `{ fieldName, field }` entries
- `internalSeparation` — 4 entity refs
- `rule` — "Banks must see exactly ONE external contractual counterparty…"

## Files MODIFIED (1) — additive only

### `src/lib/commercial-governance.ts`
- Added header comment block (lines 1-6) documenting v25.3.7 M-directive refactor + cross-reference to `src/lib/institutional-operating-model.ts`.
- Added import line 48: `import { BANK_FACING_COUNTERPARTY_ENTITY, getBankFacingCounterpartyEntityId } from "./institutional-operating-model";`
- Added end-of-file block (lines 809-824) re-exporting `BANK_FACING_COUNTERPARTY = BANK_FACING_COUNTERPARTY_ENTITY` and re-exporting `getBankFacingCounterpartyEntityId` so consumers of `commercial-governance.ts` don't need a new import.
- The 4-entity PLANNED structure (`CONSTITUTIONAL_ENTITIES` array — Foundation/Holding/Operations/Markets) is PRESERVED byte-for-byte per task constraint.

## Verification

### Lint
```
$ cd /home/z/my-project && bun run lint
$ eslint .
EXIT_CODE=0   (zero errors, zero warnings)
```

### Live endpoint
```
$ curl -s http://localhost:3000/api/institutional-operating-model --max-time 30 | python3 -c "..."
_meta.activeModel: v25.3.2
_meta.modelSource: src/lib/institutional-operating-model.ts
_meta.modelVersion: v25.3.2-M1-1.0
_meta.status: ACTIVE
_meta.mDirectiveTrace: 1a0ee14af343a085

bankFacingCounterpartyEntityId: JOZOUR_LLC_NJ
legalName: Jozour, LLC (New Jersey)
overall verificationStatus: ACTIVE

canonicalFields: 8 (should be 8) ✓
  contractingAuthority:            status=ACTIVE
  slaOwner:                        status=PENDING_LEGAL_VERIFICATION
  supportOwner:                    status=PENDING_LEGAL_VERIFICATION
  operationalLiability:            status=ACTIVE
  dataProcessingResponsibility:    status=PENDING_LEGAL_VERIFICATION
  securityResponsibility:          status=PENDING_LEGAL_VERIFICATION
  billingAuthority:                status=PENDING_LEGAL_VERIFICATION
  escalationPath:                  status=ACTIVE

internalSeparation: 4 entities (should be 4) ✓
  holding:              status=PENDING_LEGAL_VERIFICATION, preserved=True
  operating:            status=ACTIVE,                     preserved=True
  technology:           status=PENDING_LEGAL_VERIFICATION, preserved=True
  independentOversight: status=PENDING_LEGAL_VERIFICATION, preserved=True

ACTIVE fields: 3 (expected 3: contractingAuthority, operationalLiability, escalationPath) ✓
PENDING_LEGAL_VERIFICATION fields: 5 (expected 5: SLA, support, DPA, security, billing) ✓
Internal ACTIVE: 1 (expected 1: operating) ✓
Internal PENDING: 3 (expected 3: holding, technology, oversight) ✓
All preserved=true: True ✓
```

### Dev server log
```
GET /api/institutional-operating-model 200 in 632ms (compile: 607ms, proxy.ts: 5ms, render: 20ms)  # initial compile — CLEAN
```

Dev server was already alive before M1 (curl `/api/status` returned 200 in 12ms). No restart needed. The new endpoint compiled on first hit (607ms compile) and served subsequent hits from cache.

## Commit + push

```
Commit SHA:  daf9535746a4faa864c6d7c651e7915db2022bc2
Short SHA:   daf9535
Subject:     feat(model): institutional operating model — ONE bank-facing counterparty (v25.3.7)
Stats:       3 files changed, 404 insertions(+)
Branch:      main
Push:        SUCCEEDED
             e9b26dd..daf9535  main -> main
             (GitHub security advisory: 1 high — pre-existing dependabot alert, NOT introduced by M1;
              same alert flagged on prior agent pushes K2/K3/H2/G3/I2/I3/I4/K5)
```

Pre-push hook ran "✓ deps check passed". No rebase needed — M2's `finality-trust-domains` files were untracked in my working tree (NOT touched by M1) and were already on origin/main from a prior agent push. M1 staged ONLY its own 3 files (`src/lib/institutional-operating-model.ts`, `src/app/api/institutional-operating-model/route.ts`, `src/lib/commercial-governance.ts`).

## Constraints honored

- ✅ ONLY added code; never removed functionality (commercial-governance.ts 4-entity PLANNED structure PRESERVED byte-for-byte)
- ✅ Did NOT modify the deterministic v19 monetary engine
- ✅ Did NOT use `bun run build`
- ✅ Did NOT restart the dev server (it was already alive)
- ✅ `bankFacingCounterpartyEntityId` is a single canonical value: `"JOZOUR_LLC_NJ"`
- ✅ All 8 canonical fields defined (contractingAuthority, slaOwner, supportOwner, operationalLiability, dataProcessingResponsibility, securityResponsibility, billingAuthority, escalationPath)
- ✅ `PENDING_LEGAL_VERIFICATION` status used where underlying executed instruments NOT available (5 of 8 fields + 3 of 4 internal entities) — per directive "Do not invent legal facts"
- ✅ Internal separation (Holding/Operating/Technology/Oversight) PRESERVED in data structure (`preserved: true` on all 4 refs)
- ✅ Honest state: most fields are `PENDING_LEGAL_VERIFICATION` because the underlying SLA/DPA/security/billing/oversight instruments have NOT been executed with any bank yet

## Cross-references

- `src/lib/mtq-economic-definition.ts` (Agent K2, v25.3.5) — referenced in `sourceLayers.economicDefinition`
- `src/lib/control-plane-boundary.ts` (Agent J3, v25.3.4) — referenced in `sourceLayers.capabilityBoundary`
- `src/lib/reserve-domains.ts` (Agent K4, v25.3.6) — referenced in `sourceLayers.reserveDomains`
- `src/lib/pilot-1-config.ts` (Agent K5, v25.3.6) — referenced in `_meta.crossReferences.pilot1Config`
- `src/lib/commercial-governance.ts` — preserved 4-entity PLANNED structure; re-exports `BANK_FACING_COUNTERPARTY` + `getBankFacingCounterpartyEntityId`
- JOZOUR Amendment (2026-07-31) §1.2 + §1.2(h) + §1.4(b) + §1.5 + §1.6 — referenced in `underlyingInstrument.reference` for the 3 ACTIVE fields

## Honest residual debt (NOT introduced by M1)

1. **Pre-existing GitHub Dependabot vulnerability (1 high)** returned on push — same alert flagged on prior agent pushes (K2/K3/H2/G3/I2/I3/I4/K5) — NOT introduced by M1.
2. **Parallel work in flight (Agent M2):** `src/lib/finality-trust-domains.ts` + `src/app/api/finality-trust-domains/` + `src/app/api/finality-trust-domains-tests/` + `src/lib/tests/finality-trust-domain-tests.ts` existed as untracked files in my working tree. NOT staged by M1. Those handle the "finality architecture three trust domains" half of the M-directive per the task brief.
3. **Honest state of canonical fields:** 5 of 8 fields are `PENDING_LEGAL_VERIFICATION`. This is NOT a defect — it is the HONEST state per M-directive ("Do not invent legal facts"). The underlying executed instruments (SLA, support agreement, DPA, security accreditation, billing agreement) have NOT been executed with any bank yet. When they ARE executed, the `underlyingInstrument` field will be populated with `type`/`reference`/`executedDate`/`verifiedBy` and the `verificationStatus` will flip to `ACTIVE`.
4. **Honest state of internal separation:** 3 of 4 internal entities are `PENDING_LEGAL_VERIFICATION` (Holding, Technology, Foundation) — only the operating entity (Jozour, LLC) is `ACTIVE`. Internal separation is PRESERVED in the data structure (`preserved: true` on all 4 refs) per M-directive; when the planned entities are formed, the refs will point to them.

## Stage Summary

- `bankFacingCounterpartyEntityId` defined (`"JOZOUR_LLC_NJ"` — single external counterparty banks see).
- 8 canonical fields defined (contractingAuthority, slaOwner, supportOwner, operationalLiability, dataProcessingResponsibility, securityResponsibility, billingAuthority, escalationPath) — all resolve to `bankFacingName = "Jozour, LLC"`.
- `PENDING_LEGAL_VERIFICATION` status marker honored for 5 of 8 fields + 3 of 4 internal entities (underlying instruments NOT available — honest state per M-directive).
- Internal separation (Holding/Operating/Technology/INDEPENDENT_OVERSIGHT) PRESERVED in data structure with `preserved: true` on all 4 refs.
- Lint EXIT_CODE=0. Live endpoint verified — 8 canonical fields, 4 internal entities, 3/8 ACTIVE + 5/8 PENDING_LEGAL_VERIFICATION + 1/4 ACTIVE + 3/4 PENDING_LEGAL_VERIFICATION.
- Commit SHA `daf9535` pushed to origin/main (`e9b26dd..daf9535 main -> main`).
- Closes the institutional operating model half of the M-directive. The finality architecture three trust domains is handled by Agent M2 (parallel).
