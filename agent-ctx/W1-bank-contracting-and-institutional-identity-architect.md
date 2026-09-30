# Agent W1 — Bank Contracting Package + Institutional External Identity Architect

**Task ID**: W1
**Agent**: Sub-agent (full-stack-developer) — Bank Contracting Package + Institutional External Identity Architect
**Release**: v25.3.18
**Change Requests**: CR-2026-004 (P28 Bank Contracting Package) + CR-2026-005 (P29 Institutional External Identity) — both ADDITIVE per Architecture Freeze v25.3.15
**Review**: APPROVED (COO + CTO joint approval)
**Commit SHA**: `c92178cecc4fb268e1ec7ba173642dfce0e0bbad` (short: `c92178c`)
**Parent**: `f3b83cca833c53d0a9ea52039ba8560ccb4a8141` (V1 v25.3.17)

## Directive

Per PROMPT 28: "Create the canonical Bank Contracting Package for the single bank-facing accountable entity. Include: scope of service, roles, liability allocation, service levels, incident notification, security obligations, audit rights, evidence rights, data handling, confidentiality, regulatory cooperation, fees, dispute escalation, termination, exit, migration, governing law and limitation-of-liability questions. This is a legal/commercial issue checklist and controlled term-sheet framework, NOT a self-generated legal opinion. No contract status may become SIGNED, ACTIVE or VALIDATED without actual executed evidence."

Per PROMPT 29: "Create an Institutional Presence Standard. Replace informal/personal contact with: controlled organizational email; controlled institutional domain; consistent legal entity naming; document provenance; version/date/classification; institutional contact role; controlled public website identity; consistent disclaimer language. Never invent a legal entity, domain, address or regulatory status. Until the contracting entity is legally finalized, use an explicit PENDING_ENTITY_IDENTITY state rather than pretending the final structure exists. The current blueprint still exposes personal email/contact presentation and the current operating entity as JOZOUR LLC, so this must be resolved deliberately rather than silently."

## Files Created (4 NEW, 728 LOC total)

1. `src/lib/bank-contracting-package.ts` (425 LOC) — canonical Bank Contracting Package
   - `ContractStatus` union of 10 literals (DRAFT, TERM_SHEET, PENDING_EXECUTION, PENDING_LEGAL_VERIFICATION, SIGNED, ACTIVE, VALIDATED, EXPIRED, TERMINATED, SUPERSEDED)
   - `ContractSectionId` union of 18 literals (17 directive-enumerated sections)
   - `ContractTermSheetItem` interface (item, description, status, evidenceRequired, honestNote)
   - `ContractSection` interface (sectionId, name, description, termSheetItems[], status)
   - `BANK_CONTRACTING_PACKAGE: ContractSection[]` — 17 sections, ALL `status: "DRAFT"`
   - `NO_CONTRACT_WITHOUT_EVIDENCE_RULE` object — rule + description + honestState + notLegalOpinion
   - Status exports: CONTRACTING_PACKAGE_STATUS="ACTIVE", CONTRACTING_PACKAGE_VERSION="v25.3.18-W1-1.0", CONTRACTING_PACKAGE_SOURCE, CONTRACT_SECTION_COUNT=17

2. `src/app/api/bank-contracting-package/route.ts` — public GET endpoint
   - Rate-limited 30 req/min per IP via `enforceRateLimit("bank-contracting-package", request, 30, 60_000)`
   - Returns `_meta` envelope (activeModel="v25.3.18", source, version, status="ACTIVE", changeRequest="CR-2026-004 (per Architecture Freeze v25.3.15)", overrideRule, noContractWithoutEvidenceRule)
   - Returns sectionCount=17 + sections (17 entries, ALL DRAFT) + noContractWithoutEvidenceRule (4-field object) + rule

3. `src/lib/institutional-external-identity.ts` (168 LOC) — canonical Institutional External Identity Standard
   - `EntityIdentityState` union of 3 literals (PENDING_ENTITY_IDENTITY, OPERATING_ENTITY_ACTIVE, CONTRACTING_ENTITY_FINALIZED)
   - `InstitutionalPresenceStandard` interface (standardId, name, description, currentState, requiredValue, currentValue, isHonest, honestNote)
   - `INSTITUTIONAL_PRESENCE_STANDARDS: InstitutionalPresenceStandard[]` — 8 standards, all `isHonest: true`
     - 3 PENDING_ENTITY_IDENTITY: CONTROLLED_ORGANIZATIONAL_EMAIL, CONTROLLED_INSTITUTIONAL_DOMAIN, CONTROLLED_PUBLIC_WEBSITE_IDENTITY
     - 5 OPERATING_ENTITY_ACTIVE: CONSISTENT_LEGAL_ENTITY_NAMING, DOCUMENT_PROVENANCE, VERSION_DATE_CLASSIFICATION, INSTITUTIONAL_CONTACT_ROLE, CONSISTENT_DISCLAIMER_LANGUAGE
   - `NEVER_INVENT_RULE` object — rule + pendingEntityIdentity + currentBlueprintIssue + resolution
   - Status exports: INSTITUTIONAL_IDENTITY_STATUS="ACTIVE", INSTITUTIONAL_IDENTITY_VERSION="v25.3.18-W1-1.0", INSTITUTIONAL_IDENTITY_SOURCE, PRESENCE_STANDARD_COUNT=8

4. `src/app/api/institutional-identity/route.ts` — public GET endpoint
   - Rate-limited 30 req/min per IP via `enforceRateLimit("institutional-identity", request, 30, 60_000)`
   - Returns `_meta` envelope (activeModel="v25.3.18", source, version, status="ACTIVE", changeRequest="CR-2026-005 (per Architecture Freeze v25.3.15)", overrideRule, neverInventRule)
   - Returns standardCount=8 + standards (8 entries) + neverInventRule (4-field object) + rule

## Verification (live endpoints)

### GET /api/bank-contracting-package → HTTP 200
- `sectionCount`: 17 (should be 17) ✓
- `All DRAFT: True` — every section's status field equals "DRAFT" ✓
- `rule`: "All 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. Honest state — no bank contract executed."
- `noContractWithoutEvidenceRule.honestState`: "ALL 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. This is the honest state — no bank contract has been executed."
- `noContractWithoutEvidenceRule.notLegalOpinion`: "Per PROMPT 28: 'This is a legal/commercial issue checklist and controlled term-sheet framework, NOT a self-generated legal opinion.'"
- `_meta.changeRequest`: "CR-2026-004 (per Architecture Freeze v25.3.15)"
- `_meta.version`: "v25.3.18-W1-1.0"
- `_meta.activeModel`: "v25.3.18"

### GET /api/institutional-identity → HTTP 200
- `standardCount`: 8 (should be 8) ✓
- Standards state breakdown (3 PENDING_ENTITY_IDENTITY + 5 OPERATING_ENTITY_ACTIVE, all isHonest=True):
  - CONTROLLED_ORGANIZATIONAL_EMAIL: PENDING_ENTITY_IDENTITY (isHonest=True)
  - CONTROLLED_INSTITUTIONAL_DOMAIN: PENDING_ENTITY_IDENTITY (isHonest=True)
  - CONSISTENT_LEGAL_ENTITY_NAMING: OPERATING_ENTITY_ACTIVE (isHonest=True)
  - DOCUMENT_PROVENANCE: OPERATING_ENTITY_ACTIVE (isHonest=True)
  - VERSION_DATE_CLASSIFICATION: OPERATING_ENTITY_ACTIVE (isHonest=True)
  - INSTITUTIONAL_CONTACT_ROLE: OPERATING_ENTITY_ACTIVE (isHonest=True)
  - CONTROLLED_PUBLIC_WEBSITE_IDENTITY: PENDING_ENTITY_IDENTITY (isHonest=True)
  - CONSISTENT_DISCLAIMER_LANGUAGE: OPERATING_ENTITY_ACTIVE (isHonest=True)
- `neverInventRule.rule`: "Per PROMPT 29: 'Never invent a legal entity, domain, address or regulatory status.'"
- `neverInventRule.resolution`: "The operating entity (Jozour, LLC) is ACTIVE (per JOZOUR Amendment). The contracting entity (MITHQAL Foundation Inc.) is PENDING (to be formed per §1.6). All identity standards that depend on the contracting entity are PENDING_ENTITY_IDENTITY. All identity standards that depend on the operating entity are OPERATING_ENTITY_ACTIVE. No identity is invented."
- `_meta.changeRequest`: "CR-2026-005 (per Architecture Freeze v25.3.15)"
- `_meta.version`: "v25.3.18-W1-1.0"
- `_meta.activeModel`: "v25.3.18"

## Critical Rules Enforced

### NO_CONTRACT_WITHOUT_EVIDENCE_RULE
- rule: "Per PROMPT 28: 'No contract status may become SIGNED, ACTIVE or VALIDATED without actual executed evidence.'"
- honestState: "ALL 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. This is the honest state — no bank contract has been executed."
- notLegalOpinion: "Per PROMPT 28: 'This is a legal/commercial issue checklist and controlled term-sheet framework, NOT a self-generated legal opinion.'"

### NEVER_INVENT_RULE
- rule: "Per PROMPT 29: 'Never invent a legal entity, domain, address or regulatory status.'"
- pendingEntityIdentity: "Until the contracting entity is legally finalized, use an explicit PENDING_ENTITY_IDENTITY state rather than pretending the final structure exists."
- currentBlueprintIssue: "Per PROMPT 29: 'The current blueprint still exposes personal email/contact presentation and the current operating entity as JOZOUR LLC, so this must be resolved deliberately rather than silently.'"
- resolution: "The operating entity (Jozour, LLC) is ACTIVE (per JOZOUR Amendment). The contracting entity (MITHQAL Foundation Inc.) is PENDING (to be formed per §1.6). All identity standards that depend on the contracting entity are PENDING_ENTITY_IDENTITY. All identity standards that depend on the operating entity are OPERATING_ENTITY_ACTIVE. No identity is invented."

## Lint

`bun run lint` → exit 0, no warnings, no errors ✓

## Dev server logs

```
GET /api/bank-contracting-package 200 in 238ms (compile: 188ms, proxy.ts: 40ms, render: 10ms)
GET /api/institutional-identity 200 in 155ms (compile: 145ms, proxy.ts: 6ms, render: 5ms)
```

No warnings, no errors.

## Architecture Freeze v25.3.15 Compliance

- ✅ ADDITIVE only — no FROZEN schema modified (T2's 10 frozen schemas untouched)
- ✅ No v19 monetary engine modified
- ✅ No functionality removed
- ✅ CR-2026-004 + CR-2026-005 approved (COO+CTO joint approval) per Architecture Freeze
- ✅ No `bun run build` used
- ✅ Dev server NOT restarted (was alive throughout task)

## Honest State Summary

- P28 Bank Contracting Package: ALL 17 sections = DRAFT. 0 SIGNED. 0 ACTIVE. 0 VALIDATED. No bank contract has been executed. This is the honest state per directive.
- P29 Institutional External Identity: 3 PENDING_ENTITY_IDENTITY (depends on contracting entity finalization — Foundation formation per §1.6) + 5 OPERATING_ENTITY_ACTIVE (depends on operating entity JOZOUR LLC, which is ACTIVE per JOZOUR Amendment). All 8 standards `isHonest: true` — no identity invented.
- Personal email/contact resolution is PENDING (deliberately, not silently) — explicitly noted in CONTROLLED_ORGANIZATIONAL_EMAIL + CONTROLLED_INSTITUTIONAL_DOMAIN + CONTROLLED_PUBLIC_WEBSITE_IDENTITY standards.
- The current operating entity (JOZOUR LLC) exposure is acknowledged honestly in NEVER_INVENT_RULE.currentBlueprintIssue + resolved in NEVER_INVENT_RULE.resolution.

## Owner

Bank Contracting + Institutional Identity Architect (Agent W1)
Release: v25.3.18
Change Requests: CR-2026-004 + CR-2026-005 (per Architecture Freeze v25.3.15)
