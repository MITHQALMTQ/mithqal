# institutional/incidents/

Incident records for MITHQAL v26.0 §7.2.

## Scope

This directory holds structured incident records. Each record is a
machine-readable JSON file with metadata about the incident, the
affected surfaces, the remediation track, and the verification evidence.

## File naming

- `cred-incident-<NNN>-<YYYYMMDD>.json` — credential incident (e.g.
  `cred-incident-001-2026-10-10.json`).
- `recon-incident-<NNN>-<YYYYMMDD>.json` — reconciliation incident.
- `finality-incident-<NNN>-<YYYYMMDD>.json` — finality state machine
  incident (e.g. an F-state predicate that could not be satisfied
  within the SLA window).

## Rules

- Incident records MUST NOT contain secret values. For credential
  incidents, record only the secret name, category, provider,
  environment, exposure surface, date, status, scope, and rotation
  method.
- The `status` of a credential incident begins as `PENDING_ROTATION`
  and transitions to `CLOSED_ROTATED` only after all listed credentials
  have been rotated AND the rotation has been verified.
- Each incident MUST cite the blueprint section it implements
  (e.g. `v26.0 §7.2 Credential Incident Records`).

## Cross-references

- Open decision OD-014 tracks the credential rotation plan for
  `cred-incident-001-2026-10-10`.
- ADR 0002 records the related MTQ-disabled-by-default decision that
  prevents MTQ from silently enabling while credentials are pending
  rotation.
