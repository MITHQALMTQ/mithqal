# Agent O1 — Institutional Settlement Obligation Registry Architect

**Task ID**: O1
**Trace**: 1a0ee793ba929555
**Role**: Sub-agent (full-stack-developer) — Institutional Settlement
Obligation Registry Architect
**Release**: v25.3.9
**Commit**: `b1f34bee66a920a25b1715d2413c74e3937767fb`
**Date**: 2026-09-29 (Africa/Cairo)

## Directive (verbatim)

> "Create a canonical `Institutional Settlement Obligation Registry`.
> Each obligation must contain: issuer, legal obligor, beneficiary,
> backing cell, redemption institution, jurisdiction, governing law,
> finality domain, acceptance status, redemption status, resolution
> status, insolvency treatment, evidence reference. Enforce:
> `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION`. Make this registry
> usable independently of MTQ."

## Files Created (3)

1. `src/lib/institutional-settlement-obligation-registry.ts` (canonical source,
   ~360 LOC)
2. `src/app/api/obligation-registry/route.ts` (public endpoint)
3. `src/lib/tests/obligation-registry-tests.ts` (4 enforcement tests)

## The 13-Field `InstitutionalSettlementObligation` Interface

| # | Field | Type | Notes |
|---|-------|------|-------|
| 1 | `issuer` | object | `{ entityId, legalName, bankFacingCounterpartyEntityId? (per v25.3.7) }` |
| 2 | `legalObligor` | object | **CRITICAL** — `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION` rule enforced here |
| 3 | `beneficiary` | object | `{ entityId, legalName, accountReference? }` |
| 4 | `backingCell` | object | `{ cellId, reserveDomain (per v25.3.6), assetClass, backingValueUsd, backingValueCurrency }` |
| 5 | `redemptionInstitution` | object | `{ entityId, legalName, institutionType }` |
| 6 | `jurisdiction` | object | `{ primaryJurisdiction, secondaryJurisdictions?, settlementMode (per v25.3.8) }` |
| 7 | `governingLaw` | object | `{ legalSystem, specificLaw, verificationStatus }` |
| 8 | `finalityDomain` | object | `{ currentStage F0-F7 (per v25.3.8), finalityType, settlementAssetType }` |
| 9 | `acceptanceStatus` | enum | `PENDING_ACCEPTANCE | ACCEPTED | REJECTED | WITHDRAWN` |
| 10 | `redemptionStatus` | enum | 7 states incl. `REDEMPTION_DEFAULTED` |
| 11 | `resolutionStatus` | enum | `ACTIVE | RESOLVED | IN_RESOLUTION | DEFAULTED | RESTRUCTURED | WRITTEN_OFF` |
| 12 | `insolvencyTreatment` | enum | `SEPARATED | PARI_PASSU | SUBORDINATED | SUPERSEDED | PENDING_LEGAL_VERIFICATION` |
| 13 | `evidenceReference` | object | `{ evidencePackageTransactionId, cryptographicCommitment }` — links to v25.3.8 Evidence Fabric |

(Metadata fields `obligationId` / `createdAt` / `updatedAt` / `status` are
NOT counted among the 13 directive fields — they are registry-level
bookkeeping per the directive's field list.)

## NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION Enforcement

`validateObligation()` rejects an obligation if **any** of the following
is true:

| Sub-rule | Trigger | Error message |
|----------|---------|---------------|
| R1 | `obligation.legalObligor` is `undefined`/`null` | `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor field is required. Obligation cannot be registered without a legal obligor.` |
| R2 | `legalObligor.entityId` is empty/whitespace | `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor.entityId is empty. Obligation cannot be registered without a legal obligor entity ID.` |
| R3 | `legalObligor.legalName` is empty/whitespace | `legalObligor.legalName is required.` |
| R4 | `legalObligor.verificationStatus === "SUPERSEDED"` | `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION: legalObligor.verificationStatus is SUPERSEDED. The legal obligor is no longer active. Obligation cannot be registered.` |

`registerObligation()` calls `validateObligation()` BEFORE storing.
Invalid obligations are NEVER written to the store.

## MTQ-Independence

The registry is MTQ-INDEPENDENT:

- The `finalityDomain.settlementAssetType` field accepts ANY string value.
- `SUPPORTED_SETTLEMENT_ASSET_TYPES` is exposed for discoverability
  (`BANK_MONEY | CENTRAL_BANK_MONEY | RTGS | TOKENIZED_DEPOSITS | WHOLESALE_CBDC | MTQ | OTHER_LEGALLY_RECOGNIZED`)
  but the registry does NOT enforce this list — it accepts any future
  legally-recognized settlement asset type without requiring a registry
  change.
- `getObligationsBySettlementAsset(assetType)` filters by any string.
- If no filter is applied, the registry returns ALL obligations
  regardless of settlement asset type.

Live verification (via curl against running dev server):

```
POST /api/obligation-registry with finalityDomain.settlementAssetType="BANK_MONEY"
  → 200 registered=true, obligationId="OBL-2026-001"

GET /api/obligation-registry?settlementAsset=BANK_MONEY
  → 200, count=1 (the registered BANK_MONEY obligation)

GET /api/obligation-registry?settlementAsset=MTQ
  → 200, count=0 (proves the registry tracks BANK_MONEY obligations
     independently of MTQ — there are zero MTQ obligations in the store)
```

## API Endpoint Behaviour

`GET /api/obligation-registry` (no params) → 200:

```
{
  "_meta": {
    "activeModel": "v25.3.2",
    "registrySource": "src/lib/institutional-settlement-obligation-registry.ts",
    "registryVersion": "v25.3.2-O1-1.0",
    "status": "ACTIVE",
    "overrideRule": "...",
    "enforcementRule": "NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION"
  },
  "fieldCount": 13,
  "fields": ["issuer", "legalObligor", ... 13 total],
  "supportedSettlementAssetTypes": [...7 types...],
  "rule": "...",
  "queries": {
    "retrieveObligation": "?obligationId=OBL-2026-001",
    "listAllObligationIds": "?list=true",
    "filterBySettlementAsset": "?settlementAsset=MTQ",
    "filterByBeneficiary": "?beneficiary=BANK_AE_FAB",
    "filterByLegalObligor": "?legalObligor=BANK_CN_ICBC"
  },
  "honestState": {
    "storeType": "in-memory (Map)",
    "scope": "v25.3.9 controlled-test release. ...",
    "doesNotSurviveProcessRestarts": true,
    "notSharedAcrossServerlessInstances": true
  }
}
```

`GET ?obligationId=X` → 200 with full obligation, or 404 if not found.
`GET ?list=true` → 200 with `{ obligationIds: [...], count: N }`.
`GET ?settlementAsset=X` → 200 with `{ obligations: [...], count: N }`.
`GET ?beneficiary=X` → 200 with `{ obligations: [...], count: N }`.
`GET ?legalObligor=X` → 200 with `{ obligations: [...], count: N }`.

`POST /api/obligation-registry` → 200 on success with
`{ registered: true, obligationId, enforcementRule }`, or 400 with
`{ error, validation: { valid, errors, rule }, rule }` on validation
failure.

## Pure-Function Tests

`testNoLegalObligorEnforcement()` runs 4 tests:

| Test | Expected | Result |
|------|----------|--------|
| `testNoLegalObligorField` | INVALID (R1) | PASS |
| `testEmptyLegalObligorEntityId` | INVALID (R2) | PASS |
| `testSupersededLegalObligor` | INVALID (R4) | PASS |
| `testValidObligationIsAccepted` (positive control) | VALID | PASS |

All 4 passed when invoked via `bun run-obl-tests.mjs`.

## Verification (curl against live dev server)

| Request | Status | Expected | Actual |
|---------|--------|----------|--------|
| `GET /api/obligation-registry` | 200 | 13-field schema + rule | ✅ fieldCount=13, enforcementRule populated |
| `POST` (no legalObligor) | 400 | R1 violation | ✅ validation.valid=false, R1 cited |
| `POST` (SUPERSEDED obligor) | 400 | R4 violation | ✅ R4 cited |
| `POST` (empty entityId) | 400 | R2 violation | ✅ R2 cited |
| `POST` (complete valid 13-field) | 200 | registered=true | ✅ registered=true, obligationId=OBL-2026-001 |
| `GET ?obligationId=OBL-2026-001` | 200 | obligation retrieved | ✅ full obligation returned |
| `GET ?settlementAsset=BANK_MONEY` | 200 | count=1 | ✅ count=1 |
| `GET ?settlementAsset=MTQ` | 200 | count=0 (MTQ-independence) | ✅ count=0 |
| `GET ?list=true` | 200 | returns obligation IDs | ✅ obligationIds=["OBL-2026-001"] |

## Lint

`bun run lint` → EXIT 0 (zero errors, zero warnings).

## Commit + Push

- Staged ONLY O1's 3 files (left concurrent agents' `reconciliation.ts`,
  `non-custodial-reserve-architecture.ts`, `reconciliation-tolerance-policies.ts`
  + `/api/reconciliation-tolerance-policies/` route, foundry submodule
  modifications, etc. untouched — those belong to Agent O2 and others).
- Commit: `b1f34bee66a920a25b1715d2413c74e3937767fb`
- Stats: `3 files changed, 832 insertions(+)` — all 3 files in
  `create mode 100644`.
- Pre-push hook: `✓ deps check passed`.
- Pushed: `1252833..b1f34be main -> main`.
- GitHub returned 1 high-vulnerability Dependabot warning — pre-existing
  alert (same one flagged on every prior agent's push since H2/G3/I2/I3/I4
  — NOT introduced by O1).

## Honest Scope Notes

1. The obligation store is in-memory (Map). Sufficient for the v25.3.9
   controlled-test release. Production deployment requires a durable
   database table (e.g., a Prisma model `InstitutionalSettlementObligation`
   with the 13-field shape). DO NOT use the in-memory store for production
   settlement — it does not survive process restarts and is not shared
   across serverless function instances. This is documented in the file
   header + in the `honestState` block returned by the GET endpoint.
2. The directive's "13 fields" list does not include `obligationId`,
   `createdAt`, `updatedAt`, or `status`. These are registry-level
   bookkeeping fields (metadata), NOT counted among the 13 directive
   fields. `OBLIGATION_FIELD_COUNT = 13` and `OBLIGATION_FIELDS` exports
   list exactly the 13 directive fields.
3. The `legalObligor.verificationStatus` accepts `"PENDING_LEGAL_VERIFICATION"`
   as a valid value — an obligor with pending verification CAN be
   registered (the obligation is created but the obligor's legal standing
   is not yet verified). Only `"SUPERSEDED"` (which means the obligor is
   no longer active — e.g., a bank that has been liquidated or had its
   license revoked) triggers the NO_LEGAL_OBLIGOR rejection. This is
   honest: pending-verification obligors exist in the real world (a bank
   in the process of being approved), and their obligations should be
   trackable — but their obligations are not yet final until verification
   completes.
4. The `SUPPORTED_SETTLEMENT_ASSET_TYPES` list is exposed for
   discoverability only — the registry accepts ANY string value for
   `finalityDomain.settlementAssetType`. This is intentional: the
   directive says "usable independently of MTQ", and a future
   legally-recognized settlement asset type (e.g., a new CBDC variant)
   should not require a registry schema change to be tracked.
5. The `evidenceReference.cryptographicCommitment` field is a 64-char
   hex string (SHA-256). The registry does NOT recompute it — it is the
   caller's responsibility to obtain the commitment from the v25.3.8
   Evidence Fabric (`/api/evidence-fabric?transactionId=X`) and pass it
   in. The registry just stores it and links it back.
6. Cross-references to v25.3.4 (control-plane boundary), v25.3.6 (reserve
   domains), v25.3.7 (`bankFacingCounterpartyEntityId`), v25.3.8 (F0-F7
   finality model + Evidence Fabric) are encoded as JSDoc comments inside
   the relevant fields, so a contradiction scanner can match them.

## Constraints Honored

- ✅ ONLY added code; never removed functionality
- ✅ Did NOT modify the deterministic v19 monetary engine
- ✅ Did NOT use `bun run build`
- ✅ Did NOT restart the dev server
- ✅ Obligation has exactly 13 fields per directive (verified by
  `OBLIGATION_FIELD_COUNT = 13` + `OBLIGATION_FIELDS` array)
- ✅ `NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION` enforced
  (`validateObligation` rejects null/empty/SUPERSEDED; live curl
  verification confirmed all 3 negative cases)
- ✅ Registry is MTQ-independent (works for any settlement asset type;
  live curl verification confirmed count=0 for `?settlementAsset=MTQ`
  while a BANK_MONEY obligation is registered)
- ✅ Honest scope: in-memory store documented as v25.3.9 demo only

## Notes for the Operator

1. To register a real obligation, POST to
   `/api/obligation-registry` with all 13 fields populated. The
   `legalObligor.verificationStatus` field MUST be `"ACTIVE"` or
   `"PENDING_LEGAL_VERIFICATION"` (not `"SUPERSEDED"`).
2. To retrieve an obligation, GET
   `/api/obligation-registry?obligationId=X`.
3. To list all obligation IDs, GET `/api/obligation-registry?list=true`.
4. To filter by settlement asset (the MTQ-independent query), GET
   `/api/obligation-registry?settlementAsset=MTQ` (or any other asset
   type). The registry returns only obligations whose
   `finalityDomain.settlementAssetType` matches.
5. To verify the enforcement rule is in effect, POST a body WITHOUT the
   `legalObligor` field — the endpoint will return 400 with the rule
   cited. (See "Verification" table above for the exact responses.)
6. To run the pure-function tests programmatically, import
   `testNoLegalObligorEnforcement` from
   `src/lib/tests/obligation-registry-tests.ts` and invoke it. Returns
   `{ passed: boolean, details: string, results: TestResult[] }`.
