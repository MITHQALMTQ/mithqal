# Deployment Provenance Pack — v25.3.12 (Bank-Facing Document Set + RegulatoryReplayEngine)

**Owner**: COO + CTO + PM + System Architect
**Release tag**: `v25.3.12`
**Parent**: v25.3.11 (bank value model + pilot gate framework)

## Commits (2 by parallel agents)
- `3ce9e6d` (R1): Bank-facing document set — 5 documents (28 sections) from 17 canonical source modules
- `65b1bf0` (R2): RegulatoryReplayEngine — 12-field decision context reconstruction + READ-ONLY + historical state immutable

## Half 1: Bank-Facing Document Set (R1)
- 5 documents generated from canonical machine-readable source data:
  1. EXEC_THESIS (2-page, 4 sections)
  2. BANK_PRODUCT_BRIEF (20-page, 7 sections)
  3. PILOT_SPECIFICATION (40-60-page, 8 sections)
  4. LEGAL_ACCOUNTING_REGULATORY_PACK (variable, 4 sections)
  5. RISK_SECURITY_RESILIENCE_PACK (variable, 5 sections)
- 28 total sections, all tracing to canonical source modules (generatedFrom[])
- NOT a duplication of the master blueprint — DERIVED from canonical source
- evidenceStatus = ILLUSTRATIVE (honest — not VALIDATED yet)

## Half 2: RegulatoryReplayEngine (R2)
- 12-field DecisionContext (per directive):
  1. activePolicyVersion
  2. timestamp
  3. jurisdiction
  4. complianceResult
  5. sanctionsResult
  6. riskModelVersion
  7. liquidityState
  8. backingEvidence
  9. authorization
  10. finalityEvidence
  11. reconciliation
  12. exceptions
  + legalObligation (links to v25.3.9 registry)
- Replay is READ-ONLY (replayIsReadOnly=true)
- Historical state is IMMUTABLE (historicalStateUnchanged=true, verified cryptographically)
- Reads from v25.3.8 Evidence Fabric (15-field EvidencePackage)
- 404 on missing evidence package (no fabricated data)

## Vercel prod verified LIVE
- /api/bank-documents → 200 (5 documents, 28 sections)
- /api/bank-documents?docId=EXEC_THESIS → 200 (full 2-page Executive Thesis)
- /api/regulatory-replay → 200 (12-field schema)
- /api/status → 200

## 6 screenshots captured
## NOT PRODUCTION-AUTHORIZED. Honest-state preserved.
