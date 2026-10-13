# docs/controls/

Human-readable control matrices and audit references for MITHQAL v26.0.

## Files

- `control-matrix.md` — the G0..G11 critical-path gate grid and the
  20-control legacy mapping (§9.1, §9.2). This matrix is the
  human-readable projection of `src/lib/gate-definitions.ts`. When the
  source changes, this matrix must be re-derived.

## Authority

- Source of truth: `src/lib/gate-definitions.ts`
- API: `GET /api/gateway/v1/gates`
- Decision records: `GateDecision` rows in Neon (per gate, per scope)
