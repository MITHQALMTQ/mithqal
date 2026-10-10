# ADR 0005 — Reconciliation Class Tolerance

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §5.3, §11.3 D-002
- **Reviewers:** Controller, Architecture Review Board, Compliance

## Context

v25.x applied a uniform "1% reconciliation tolerance" to every
cross-store comparison. This was institutionally inadequate:

1. **Identity drift was tolerated.** A 1% delta in identity scope was
   tolerated even though identity drift breaks the entire authorization
   chain.

2. **Principal corruption was tolerated.** A 1% delta in principal was
   tolerated even though principal corruption indicates a missing
   instruction or a ledger corruption.

3. **FX tolerance was over-generous.** A 1% FX tolerance is well above
   the threshold at which stale-rate manipulation becomes undetectable.

4. **Reporting tolerance was over-generous.** A 1% reporting tolerance
   is incompatible with regulatory reporting accuracy, which must be
   reproducible from the ledger to the USD minor unit.

## Decision

Each class of comparison has its own tolerance policy. The classes are:

- `IDENTITY_AUTHORIZATION_STATUS_LEGAL_SCOPE` — zero tolerance (exact_match)
- `LEDGER_ENTRIES_OBLIGATION_PRINCIPAL` — zero tolerance (usd_minor_unit)
- `BANK_RAIL_TRANSACTION_MAPPING` — zero tolerance (exact_external_ref)
- `FX_VALUATION` — 5 bps threshold (with 6-month expiry)
- `REPORTING_AGGREGATE` — zero tolerance (usd_minor_unit)
- `EVENTUAL_CONSISTENCY_PROJECTION` — 1000 ms lag SLO

The registry (`RECONCILIATION_TOLERANCE_REGISTRY`) is the canonical source
of truth. Changes require a registry edit, a review-date bump, and a new
approval evidence reference. The legacy 0.1% / 0.5% / 1% / 5% thresholds
are recorded as `DEPRECATED_LEGACY_THRESHOLDS` for traceability.

`getToleranceRule(reconciliationClass, asOf)` resolves the applicable rule
for a class as of a given timestamp.

`evaluateMismatch(reconciliationClass, mismatchMagnitude, mismatchUnit)`
returns one of four dispositions:

- `BLOCKED` — for identity, ledger, bank-rail, or reporting deltas > 0
- `TOLERATED` — for FX delta ≤ 5 bps, or projection lag ≤ 1000 ms
- `EXCEPTION` — for FX delta > 5 bps (within review window)
- `STALE_PROJECTION` — for projection lag > 1000 ms (read routing flips)

## Consequences

**Positive:**

- Identity drift and principal corruption are no longer tolerated.
- FX tolerance is now 5 bps, which is well below materiality but above
  the threshold for stale-rate manipulation.
- Reporting is now exact-match to the USD minor unit, matching the
  reproducibility expectation of regulators.
- Projection watermarks have a clear SLO; reads flip back to the
  authoritative writer when the SLO is exceeded.

**Negative:**

- Operators used to the v25.x "1% tolerance for everything" must
  re-learn the class-specific tolerances. This is by design.
- The FX tolerance expires every 6 months (next review 2026-04-01).
  Operators must re-attest the rule before expiry.

## Alternatives Considered

1. **Single class-wide tolerance (1%).** Rejected; this is the v25.x
   state and the source of the problems this ADR addresses.

2. **Per-source-pair tolerance.** Rejected; per-source-pair rules make
   the registry unbounded and the audit trail unbounded. Six classes
   is the right grain.

3. **Zero tolerance for everything.** Rejected; FX deltas from
   independent providers naturally differ by a few bps, and projection
   watermarks are eventually consistent by design. Zero tolerance for
   those two classes would block legitimate operational patterns.

## Blueprint Reference

- v26.0 §5.3 Reconciliation Class Tolerance Registry
- v26.0 §11.3 D-002 PAR Accounting Reference
- v26.0 §6.8 Projection Watermarks (1000 ms SLO)
- v26.0 §5.5 External Claim Register (legacy 130% backing retraction)

## Code Evidence

- `src/lib/reconciliation-tolerance.ts`
- `prisma/schema.prisma#ReconciliationCase`
- `src/lib/db-authoritative.ts#ProjectionWatermark`
- `docs/adr/0001-database-writer-authority.md`
