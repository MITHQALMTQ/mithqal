# institutional/decision-log/

MITHQAL v26.0 §11.3 (resolved decisions D-001..D-012) and §11.4
(open P0 decisions OD-001..OD-015).

## Files

- `d-001-through-d-012.json` — the 12 canonical, resolved v26.0
  institutional decisions per §11.3. Each entry records the
  `canonicalChoice`, the `reasonNotes`, the `codeEvidence` (file paths),
  the implementation `status`, and the `conditions` under which the
  decision holds.
- `od-001-through-od-015.json` — the 15 open P0 decisions per §11.4.
  Each entry records the `openQuestion`, the `defaultUntilResolved`,
  the `requiredClosureEvidence`, the `responsibleRole`, and the
  `currentStatus` (OPEN / PARTIALLY_CLOSED / CONTRADICTS / BLOCKED).

## Authority

- Source of truth: this directory's JSON files.
- Runtime consumers: `src/lib/external-claim-register.ts` (retractions
  reference decisions), ADRs in `docs/adr/`, gate decision records
  in `institutional/gates/`.

## Rules

- A `D-NNN` decision is IMMUTABLE once `status=IMPLEMENTED`. A change
  to a decision is recorded as a NEW decision (e.g. D-013) that cites
  the prior decision in its `reasonNotes`.
- An `OD-NNN` open decision MAY transition `currentStatus` over time;
  each transition MUST bump `lastUpdated` and append to `closureEvidence`
  (or set it for the first time when CLOSED).
