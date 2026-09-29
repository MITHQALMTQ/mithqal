# R1 — Bank-Facing Document Set Architect

**Task ID**: R1
**Agent**: Sub-agent (general-purpose) — Bank-Facing Document Set Architect
**Directive trace**: `1a0ef24b86151fb9`
**Release**: v25.3.12
**Commit SHA**: `3ce9e6d0d8e549f2ebd954d0622d81326511e292`
**Status**: ✅ COMPLETE — pushed to `origin/main`

## Scope

Generate a bank-facing document set from the master blueprint, derived from canonical machine-readable source data (NOT a duplication of the blueprint).

5 documents:
1. 2-page Executive Thesis (`EXEC_THESIS`)
2. 20-page Bank Product Brief (`BANK_PRODUCT_BRIEF`)
3. 40–60-page Pilot Specification (`PILOT_SPECIFICATION`)
4. Legal / Accounting / Regulatory Pack (`LEGAL_ACCOUNTING_REGULATORY_PACK`)
5. Risk / Security / Resilience Pack (`RISK_SECURITY_RESILIENCE_PACK`)

## Files Added

| File | LOC | Purpose |
|---|---|---|
| `src/lib/bank-document-generator.ts` | 262 | Canonical document generator — reads from 17 canonical source modules, emits 5 `BankDocument` objects |
| `src/app/api/bank-documents/route.ts` | 75 | Public GET endpoint — default returns 5-doc summary; `?docId=X` returns full document |

## Canonical Source Modules Consumed (17)

1. `mtq-economic-definition.ts` — MTQ canonical definition
2. `settlement-workflow-canonical.ts` — BM-01..BM-16B (17 steps)
3. `reserve-domains.ts` — Settlement Liquidity vs Strategic Resilience Reserve
4. `pilot-1-config.ts` — Pilot 1 reserve config (gold=0%, digital=0%)
5. `institutional-operating-model.ts` — bankFacingCounterpartyEntityId + 8 fields
6. `finality-trust-domains.ts` — 3 trust domains (A/B/C)
7. `canonical-finality-model.ts` — F0-F7 + finality-coordinated vs atomic
8. `institutional-evidence-fabric.ts` — 15-field evidence package + 3 access levels
9. `institutional-settlement-obligation-registry.ts` — 13-field obligation + NO_LEGAL_OBLIGOR
10. `reconciliation-tolerance-policies.ts` — 6 tolerance policies + 6-field record
11. `corridor-pain-index.ts` — 12-factor scoring
12. `two-pilot-modes.ts` — Pilot A (control plane) + Pilot B (MTQ settlement)
13. `bank-value-model.ts` — 11-component formula + 4 evidence labels
14. `pilot-gate-framework.ts` — 11-field gate + evidence-based
15. `policy-registry.ts` — 25 policies (23 ACTIVE)
16. `external-legal-evidence.ts` — 6 evidence items
17. `reserve-coverage-logic.ts` — Required Coverage = Direct Backing + Risk Buffer

## Document → Section → Source Tracing

| Document | Sections | Source modules traced |
|---|---|---|
| EXEC_THESIS | 4 | mtq-economic-definition, institutional-operating-model, two-pilot-modes, bank-value-model |
| BANK_PRODUCT_BRIEF | 7 | mtq-economic-definition, settlement-workflow-canonical, reserve-domains, pilot-1-config, canonical-finality-model, finality-trust-domains, policy-registry |
| PILOT_SPECIFICATION | 8 | two-pilot-modes (×2), pilot-gate-framework, institutional-evidence-fabric, corridor-pain-index, reserve-coverage-logic, reconciliation-tolerance-policies, institutional-settlement-obligation-registry |
| LEGAL_ACCOUNTING_REGULATORY_PACK | 4 | institutional-operating-model, external-legal-evidence, mtq-economic-definition, institutional-settlement-obligation-registry |
| RISK_SECURITY_RESILIENCE_PACK | 5 | finality-trust-domains, reserve-domains, pilot-gate-framework, reconciliation-tolerance-policies, canonical-finality-model |
| **TOTAL** | **28** | All 17 canonical sources consumed |

## Endpoint Behavior

### Default `GET /api/bank-documents`

Returns JSON envelope:
```json
{
  "_meta": { "activeModel": "v25.3.2", "source": "src/lib/bank-document-generator.ts", "version": "v25.3.2-R1-1.0", "status": "ACTIVE", "overrideRule": "Bank-facing document set generated from canonical machine-readable source data. NOT a duplication of the master blueprint." },
  "documentCount": 5,
  "documents": [ {documentId, title, subtitle, targetPageCount, audience, sectionCount, generatedFrom, evidenceStatus}, ... ],
  "rule": "5 bank-facing documents generated from canonical machine-readable source data (v25.3.2-v25.3.11). The master blueprint remains the technical/institutional archive. Use ?docId=X to retrieve a specific document."
}
```

### Per-doc `GET /api/bank-documents?docId=X`

Returns full document with all sections + content. Valid values: `EXEC_THESIS`, `BANK_PRODUCT_BRIEF`, `PILOT_SPECIFICATION`, `LEGAL_ACCOUNTING_REGULATORY_PACK`, `RISK_SECURITY_RESILIENCE_PACK`.

## Verification

- `bun run lint` PASS — exit 0, 0 errors, 0 warnings.
- Live endpoint tested for default + all 5 `?docId=X` calls — all return correct shapes.
- All 5 documents have `evidenceStatus = "ILLUSTRATIVE"` (honest — not VALIDATED, not INSTITUTIONALLY_VERIFIED).
- Every section has a `sourceModule` field that names a real canonical source file.
- Dev server NOT restarted (was already running, healthy).
- v19 monetary engine NOT touched.
- Sibling modules (Q1's bank value model, P2's two pilot modes, etc.) NOT touched.
- Agent R2's parallel work (`src/lib/regulatory-replay-engine.ts` + `src/app/api/regulatory-replay/`) NOT staged — left for R2's own commit.

## Discipline Followed

- `enforceRateLimit("bank-documents", request, 30, 60_000)` — 30 req/60s per IP.
- `_meta` envelope convention preserved (activeModel + source + version + status + overrideRule).
- All `PENDING_LEGAL_VERIFICATION` honesty markers preserved (no claims invented).
- Master blueprint is NOT duplicated — documents are DERIVED from canonical source data.

## Worklog

R1 section appended to `/home/z/my-project/worklog.md` at line 10634.

## Hand-off

The R-directive has two halves:
1. ✅ Bank-facing document set (this R1 task — committed as `3ce9e6d`)
2. ⏳ Regulatory replay engine (Agent R2 — parallel, in-flight; files exist on disk untracked, R2 has not yet committed as of this push)
