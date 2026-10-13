# MITHQAL v26.0 Control Matrix

This matrix is the human-readable projection of `src/lib/gate-definitions.ts`.
It is generated from the source of truth (`G0_G11_GATE_DEFINITIONS` and
`LEGACY_20_GATE_MAP`). When the source changes, this matrix must be
re-derived.

## G0..G11 Critical-Path Gates (§9.1)

| Gate | Name | Minimum Exit Condition | Default if not met |
|------|------|------------------------|-------------------|
| G0   | Instruction Intake Accepted | Appendix B.1 fields present, idempotencyKey unique, requestHash matches body | REJECT_QUARANTINE |
| G1   | Identity + Authorization Scope Verified | Identity scope drift zero-tolerance (§5.3 IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE) | BLOCKED |
| G2   | Bank-Facing Counterparty Contracted | Executed agreement + sandbox integration test (§11.3 D-009) | BLOCKED |
| G3   | Legal Scope + Applicable Law Verified | External counsel sign-off (§11.4 OD-005, OD-008) | BLOCKED |
| G4   | Eligible Backing Verified | §3.3 MIN of 4 dimensions, all VERIFIED | BLOCKED |
| G5   | Bank Funding Final (F1) | Bank confirmation reference present | REMAIN_PENDING_OR_FAIL |
| G6   | Legally Controlled Backing Confirmed (F2) | §3.3 computation passed, no blocking status | BLOCK_MTQ_PROGRESSION |
| G7   | MTQ Authorization (F3) | BM-15 ran; MTQ gate (§3.2) ok=true; pilot stage=B | DENY_OR_SAFE_HALT |
| G8   | Ledger State Committed (F4) | Authoritative write returned; OutboxEvent PENDING | ROLLBACK_QUERY_IDEMPOTENCY |
| G9   | Receiving Institution Accepted (F5) | Acknowledgement within SLA | PENDING_REJECTED |
| G10  | External Rail Final (F6) | Rail-specific finality signal observed | DO_NOT_INFER_LEGAL_COMPLETION |
| G11  | Legal Settlement Final (F7) | EXECUTED_EXTERNAL_DOCUMENT admissible in jurisdiction | NOT_FINAL_OR_HOLD |

## §9.2 Legacy 20-Control Mapping

The legacy 20-control grid from v25.x is preserved for audit
traceability. Each control has a `primaryGateMapping` onto the new 12-gate
set. The legacy grid MUST NOT be used as the decision surface; the
G0..G11 grid is the decision surface.

| # | Legacy Control | Primary Gate Mapping |
|---|----------------|----------------------|
| 1  | Instruction intake validation | G0 |
| 2  | Identity scope enforcement | G1 |
| 3  | Authorization scope check | G1 |
| 4  | Legal scope review | G3 |
| 5  | Bank counterparty onboarding | G2 |
| 6  | Applicable law attestation | G3 |
| 7  | Eligible backing computation | G4 |
| 8  | Direct-matched backing test | G4 |
| 9  | Risk buffer separation | G4 |
| 10 | Bank funding confirmation | G5 |
| 11 | Legally controlled backing confirmation | G6 |
| 12 | MTQ gate | G7 |
| 13 | BM-15 monetary authorization | G7 |
| 14 | BM-16A finality verification | G8 |
| 15 | BM-16B mint execution | G8 |
| 16 | OutboxEvent emission | G8 |
| 17 | Receiver acknowledgement | G9 |
| 18 | External rail finality | G10 |
| 19 | Legal settlement document | G11 |
| 20 | Reconciliation class tolerance | G4 (FX) / G8 (LEDGER) / G10 (BANK_RAIL) / G11 (REPORTING) |

## Authority

- Source of truth: `src/lib/gate-definitions.ts`
- API: `GET /api/gateway/v1/gates` (returns both the G0..G11 grid and the
  legacy 20-control map)
- Decision records: `GateDecision` rows in Neon (one per gate per scope)

## Blueprint Reference

- v26.0 §9.1 G0..G11 Critical Path
- v26.0 §9.2 20-Control Legacy Mapping
- v26.0 §11.3 D-010 G0..G11 Critical Path; 20 Legacy Gates
