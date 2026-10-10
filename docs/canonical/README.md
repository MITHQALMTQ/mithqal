# docs/canonical/

This directory holds the canonical v26.0 master blueprint and any
derivative canonical artifacts that downstream code and ADRs cite.

## Contents

- `MITHQAL_Canonical_Master_Blueprint_v26.0.docx` — the source-of-truth
  v26.0 master blueprint. All `blueprint_ref` fields in the codebase,
  the decision log, the open decisions register, the ADRs, and the
  External Claim Register cite sections of this document.

## Rules

- Do not edit the `.docx` directly. v26.0 is the canonical baseline;
  subsequent revisions are recorded as new docx files (e.g.
  `MITHQAL_Canonical_Master_Blueprint_v26.1.docx`) and linked from
  `institutional/decision-log/`.
- Do not commit `.docx` exports from auto-formatters. The canonical
  docx is committed by the Architecture Review Board only.
- Sections referenced by `blueprint_ref` (e.g. `v26.0 §3.3`) MUST
  exist in the docx in this directory. If a section is missing, the
  blueprint is out of sync; raise an issue rather than editing the
  docx.

## Cross-references

- ADRs: `docs/adr/0001-database-writer-authority.md` through
  `docs/adr/0007-outbox-pattern.md`
- Decision log: `institutional/decision-log/d-001-through-d-012.json`
- Open decisions: `institutional/decision-log/od-001-through-od-015.json`
- Control matrix: `docs/controls/control-matrix.md`
- External Claim Register: `src/lib/claim-registry-data.ts`
