# institutional/evidence/

This directory holds canonical evidence artifacts referenced by the
External Claim Register, the Decision Log, the Open Decisions register,
and the Gate Decision records.

## Scope

Each evidence artifact is a primary document (or a structured reference
to one) that supports a claim, a decision, or a gate. Examples:

- An executed bank-counterparty agreement (EXECUTED_EXTERNAL_DOCUMENT)
- A regulatory filing (VERIFIED_PRIMARY_DOCUMENT)
- An operator measurement (MEASURED)
- A reconciliation tolerance attestation
- A freshness policy version attestation

## File naming

- `EVD-<DOMAIN>-<NNN>-<YYYYMMDD>.{pdf,json,md}` — for primary documents.
- `EVD-SCAN-<YYYYMMDD>.json` — for contradiction-scan reports.
- `EVD-INCIDENT-<INCIDENT_ID>.json` — for credential-incident evidence
  (e.g. `EVD-INCIDENT-cred-001-20261010.json`).

## Rules

- NEVER commit secret values here. Credential-incident evidence MUST
  reference secret names only; values must be redacted.
- Each evidence artifact MUST cite the `blueprint_ref` of the section
  it supports.
- Evidence that has been superseded MUST remain in this directory with
  a `SUPERSEDED` status; do not delete. Reviewers need to see the
  history of what was once verified.
