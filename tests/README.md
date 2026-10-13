# `tests/` — 8-Layer Test Structure

**Blueprint ref:** v26.0 §10.1 (8 required test layers), §10.5 (Required repository deliverables)

## Purpose

Per §10.5 + §10.1, `tests/` is organized into **8 canonical test
layers** (§10.1 lists 7 explicit + independent assurance; we add
resilience explicitly):

| Layer | Path | What it covers |
|---|---|---|
| Unit | `tests/unit/` | Pure-function correctness: fixed-point decimal, schema validation, policy hash, idempotency-key derivation, reconciliation formula |
| Property / Invariant | `tests/property/` | Invariant-based tests: eligible-backing MIN cap; reconciliation class-tolerance; idempotency key collision; F-state monotonic progression |
| Contract | `tests/contract/` | API + event + DB schema contract tests: every API route conforms to `schemas/api/`; every event conforms to `schemas/events/`; every DB row conforms to `schemas/db/` |
| Integration | `tests/integration/` | Cross-module integration: instruction lifecycle + outbox + dispatcher + projector + Turso watermark |
| End-to-End | `tests/e2e/` | End-to-end Pilot A scenarios A-01 through A-10 per §8.9 |
| Security | `tests/security/` | Auth, authz, tenant isolation, rate limit, threat-model scenarios from §7.1 (10 categories) |
| Resilience | `tests/resilience/` | Outage, retry storm, quota exhaustion, network partition, key rotated/revoked, backup-restore-with-outstanding-events |
| Independent Assurance | `tests/independent-assurance/` | Independent assessor scope per OD-014 (independent evidence, retest) |

## Cross-cutting

- `src/lib/tests/mandatory-adversarial-scenarios.ts` enumerates the
  ~50 §10.2 mandatory adversarial scenarios (skeletal runners); these
  are referenced from the appropriate layer above.
- `src/lib/contradiction-scan-v26.ts` + `scripts/run-contradiction-scan.ts`
  is a §10.6 detection control that runs in PR-CI; it does not replace
  the layer tests above.

## Authority level

Level E (approved release code) under §1.4 — tests gate release. No
release is authorized (Level E activation) unless all required layer
tests pass per §10.3.
