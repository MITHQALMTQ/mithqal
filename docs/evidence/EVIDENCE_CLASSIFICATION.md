# MITHQAL Evidence Classification Standard

**Version:** 1.0
**Date:** 2025-08-05
**Authority:** Chief Constitutional Architect / Enterprise Security Architect
**Scope:** Every institutional claim made by the MITHQAL platform, in any artifact (whitepaper, blueprint, verification report, README, UI, API response, smart contract comment, marketing material)

---

## Purpose

This standard exists to prevent overstatement. Every claim the platform makes about its own state, security, performance, or institutional readiness must be classified using one of the six evidence levels below. The classification must be **cited inline** with every claim, in the form `(Evidence Level: <LEVEL>)` or via a linked entry in the Evidence Ledger.

---

## Evidence Levels

| Level | Definition | Requirements | Acceptable Use Cases |
|---|---|---|---|
| **PROVEN** | Verified by live runtime evidence | API response, UI screenshot, mathematical recomputation, test execution output, on-chain transaction | Live API probes, UI rendering verified by browser automation, formulas independently recomputed from first principles |
| **SUPPORTED** | Verified by implementation and tests | Code exists, tests pass (in the relevant environment), but no live runtime evidence in the audit environment | Code inspection, test files present, internal test runs |
| **PARTIALLY SUPPORTED** | Some evidence exists but gaps remain | Implementation exists but tests incomplete, runtime not verified, or only fallback/defensive behaviour visible | Defensive fallbacks that overwrite with live values, partial test coverage, internal-only stress runs |
| **PENDING EXTERNAL VALIDATION** | Awaiting third-party verification | Internal verification complete; Big-4, legal, regulatory, or independent technical review not yet performed | All audit/legal/regulatory claims until the external reviewer has signed their report |
| **UNVERIFIED** | Insufficient evidence | Cannot confirm or deny; tool not available, environment not provisioned, or evidence not collected | Foundry/Slither/Halmos/Certora when those tools were not installed in the audit environment |
| **FALSE** | Contradicted by implementation or runtime | Claim does not match reality (file count, address count, deployment status) | (None — FALSE claims must be corrected immediately upon discovery) |

---

## Usage Rules

1. **No claim may be marked PROVEN without live runtime evidence.** Code existence alone is SUPPORTED at most.
2. **No claim may imply third-party certification where none exists.** Words such as "Certified", "Institutionally Certified", "Production Certified", or "Fully Certified" are prohibited unless an external attestation has been signed by a recognized third party.
3. **PENDING EXTERNAL VALIDATION must be used for all audit, legal, regulatory, Sharia, and Big-4 claims** until the corresponding external reviewer has signed and delivered their report.
4. **Evidence level must be cited in every report.** Where a claim is material to institutional readiness, the Evidence Ledger entry ID (E001-E040+) must be referenced.
5. **UNVERIFIED is not the same as FALSE.** UNVERIFIED means we don't know (tool was missing, environment was limited). FALSE means the claim is contradicted by evidence. UNVERIFIED claims must be re-run as soon as the relevant tool is available; FALSE claims must be corrected immediately.
6. **"Constitutionally Verified"** is an internal blueprint-compliance claim (the blueprint's 21 invariants are correctly reflected in source code) — it is **not** a third-party certification claim and may be retained where the underlying invariant-mapping is accurate. It must always be paired with the relevant Evidence Ledger entries.
7. **Internal Verification Complete** means: code exists, internal tests pass, internal reviews signed off. It is the strongest internal-state claim. It is **not** a substitute for PENDING EXTERNAL VALIDATION when external review is the relevant gate.
8. **Technically Validated — Pending External Validation** is the default institutional verdict for any internally-complete subsystem whose external review has not yet been performed.

---

## Required Phrasing Replacements

The following phrases are prohibited in any MITHQAL artifact produced after 2025-08-05. They must be replaced with the indicated evidence-based wording:

| Prohibited Phrase | Required Replacement |
|---|---|
| "Certified" (as a third-party attestation) | "Internal Verification Complete" or "Technically Validated" |
| "Institutionally Certified" | "Pending External Validation" |
| "Fully Certified" | "Evidence Supported" |
| "Production Certified" | "Pending External Validation" |
| "CONDITIONALLY CERTIFIED" | "Technically Validated — Pending External Validation" |
| "✅ READY" (as a production-readiness claim) | "Internal Verification Complete" |
| "Certora Verified" | "Certora specification completed. Formal verification execution pending." |
| "formally verified" (when referring to Certora) | "formal verification specification completed" |
| "10 smart contracts" / "10 contracts" | "9 Protocol Smart Contracts + 1 Safe Multi-Signature Treasury + 1 Deployment Wallet (EOA)" |
| "241 tests pass" / "241 Foundry tests" | "Foundry test suite exists (10 test files); test execution requires forge installation" |

---

## Audit Trail

Every Evidence Ledger entry (E001–E040+) must record:

- **Claim ID** (E001–E040+)
- **Blueprint Article** (the constitutional reference, if any)
- **Implementation Files** (paths to source/test artifacts)
- **Tests** (file paths, test counts if known)
- **Mathematical proof** (if applicable — formula, recomputation, reference)
- **Runtime verification** (API endpoint, UI screenshot, on-chain tx hash)
- **Status** (one of the six evidence levels)
- **Evidence source** (where the evidence was captured)
- **Evidence date** (when the evidence was collected)
- **Reviewer** (the role that reviewed the evidence — not a named individual)

---

## Related Documents

- [`docs/contracts/CONTRACT_REGISTRY.md`](../contracts/CONTRACT_REGISTRY.md) — Smart contract registry
- [`docs/evidence/EVIDENCE_LEDGER.md`](./EVIDENCE_LEDGER.md) — Evidence ledger (40 entries)
- [`docs/evidence/INSTITUTIONAL_READINESS_MATRIX.md`](./INSTITUTIONAL_READINESS_MATRIX.md) — Institutional readiness matrix
- [`docs/verification/independent-evidence-audit.md`](../verification/independent-evidence-audit.md) — Independent evidence audit
