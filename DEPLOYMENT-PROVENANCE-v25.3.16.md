# Deployment Provenance Pack — v25.3.16 (Accounting/Prudential/Tax + PBC Legal Enforceability)

**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.16`
**Parent**: v25.3.15 (adversarial tests + architecture freeze)

## Change Requests (per Architecture Freeze v25.3.15)
- CR-2026-001: P25 Accounting/Prudential/Tax Classification Framework (APPROVED COO+CTO)
- CR-2026-002: P26 PBC Legal Enforceability (APPROVED COO+CTO)

## Commits (2 by parallel agents)
- `d6db1c6` (U1): P25 — 10 classification areas + decision matrix (ALL PENDING_EXTERNAL_VALIDATION)
- `0cec2bc` (U2): P26 — 14-field PBC + 6 failure states + MITHQAL_VERIFICATION_RULE + AVAILABLE_BACKING_RULE

## P25: Accounting/Prudential/Tax Classification Framework (U1)
- 10 classification areas: MTQ asset/liability, holder vs issuer, redemption obligation, bank/interbank exposure, reserve recognition, liquidity treatment, capital/RWA, safeguarding, tax/accounting, jurisdictional tax
- Decision matrix: DESIGN_HYPOTHESIS → COUNSEL_VIEW → ACCOUNTING_VIEW → PRUDENTIAL_VIEW → EXTERNAL_VALIDATION
- ALL 10 = PENDING_EXTERNAL_VALIDATION (honest — 0 externally validated)
- NO_UNVALIDATED_ASSERTION_RULE: "Do NOT assert a classification that has not been independently validated"

## P26: PBC Legal Enforceability (U2)
- 14 fields per PBC: legal owner, obligor, custody arrangement, account control, segregation, pledge/perfection status, encumbrance, reuse prohibition, bankruptcy treatment, insolvency priority, valuation, liquidity accessibility, jurisdiction, governing law + evidence artifact
- 6 failure states: LEGAL_CONTROL_UNPROVEN, ENCUMBERED, REUSED, CUSTODY_UNPROVEN, BANKRUPTCY_TREATMENT_UNKNOWN, LIQUIDITY_UNAVAILABLE
- MITHQAL_VERIFICATION_RULE: "MITHQAL verification must NEVER imply ownership, legal perfection or bankruptcy remoteness"
- AVAILABLE_BACKING_RULE: PBC counts as AvailableBacking only when ALL evidence exists AND zero failure states
- computePBCStatus() verified: PENDING_EVIDENCE → FAILED; fully-evidenced → AVAILABLE_BACKING

## Vercel prod verified LIVE
- /api/accounting-prudential-tax → 200 (10 areas, 0 validated, 10 pending)
- /api/pbc-legal-enforceability → 200 (14 fields, 6 failure states)
- /api/architecture-freeze → 200 (10 frozen schemas, 7-step process)

## 5 screenshots captured
## NOT PRODUCTION-AUTHORIZED. Honest-state preserved.
## Architecture Freeze v25.3.15 ENFORCED — both changes went through the 7-step process.
