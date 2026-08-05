# MITHQAL — Security Roadmap

**Document status:** ✅ AVAILABLE
**Last updated:** 2026-07-19
**Constitutional basis:** Blueprint Part 2 Article XVII §11 (Security Assurance Framework); Part 4 Article V (Security)

---

## Overview

The MITHQAL Security Assurance Framework is a six-track programme. Each track is tracked **independently**. Each track has its own status, owner, evidence, and milestones. **No track may be substituted for another.**

The six tracks correspond to Article XVII §11:

| Track | Name | Status |
|-------|------|--------|
| 1 | Internal Security Validation | PARTIALLY SUPPORTED |
| 2 | Independent Security Audit | PENDING EXTERNAL VALIDATION |
| 3 | Formal Verification | PARTIALLY SUPPORTED (12 invariants verified) |
| 4 | Penetration Testing | PENDING EXTERNAL VALIDATION |
| 5 | Bug Bounty | IN PROGRESS |
| 6 | Big Four Review | NOT STARTED |

**Evidence classification per Article XVII §2.** No claim of "audited" or "secure" is made without citation to the relevant track evidence.

---

## Track 1 — Internal Security Validation

**Owner:** Technical Committee / Internal Security Team
**Status:** PARTIALLY SUPPORTED

### Scope

- Code review of all 9 Protocol Smart Contracts (MTQ, Mint, Redeem, Reserve, Algorithm, Oracle, Takaful, Governance, plus Certora specification)
- Threat modeling (STRIDE / PASTA methodology)
- Internal security testing (unit, integration, fuzz, invariant)
- Operational security review (key management, access control, logging)

### Evidence

- Internal code review reports (retained in Evidence Ledger as EV-061)
- Foundry test suite (`foundry/test/`) — full coverage of invariants and edge cases
- Echidna fuzzing campaigns (property-based)
- Threat model document

### Next Milestone

Complete internal review of all 9 contracts and produce a consolidated Internal Security Report.

### Blocking Items

- None currently identified.

---

## Track 2 — Independent Security Audit

**Owner:** Technical Committee
**Status:** PENDING EXTERNAL VALIDATION (engagement planned)

### Scope

Independent security audit by a qualified Web3 security firm. Candidate firms:

- Trail of Bits
- OpenZeppelin
- Consensys Diligence
- Certik
- Hacken
- Quantstamp

### Deliverables

- Signed audit report covering all 9 Protocol Smart Contracts
- Findings classified by severity (Critical / High / Medium / Low / Informational)
- Remediation verification
- Final report retained permanently in Evidence Ledger

### Next Milestone

Issue RFP to shortlisted firms; select auditor; commence audit Q3 2026.

### Blocking Items

- Audit budget approval (Constitutional Council)
- Final contract freeze (no in-flight changes during audit window)

---

## Track 3 — Formal Verification

**Owner:** Technical Committee
**Status:** PARTIALLY SUPPORTED — 12 invariants verified with Certora Prover

### Scope

Formal verification of all 9 Protocol Smart Contracts using:

- **Certora Prover** — primary formal verification tool
- **Halmos** — symbolic execution (complementary)
- **Foundry** — fuzz and property-based testing
- **Echidna** — property-based fuzzing

### Verified Invariants (12)

1. Reserve ratio ≥ 100% of Supply × PAR (Article III)
2. No minting without verifiable reserve receipt (Article I)
3. No lending of reserves (Article I)
4. No commingling of reserve assets (Article I)
5. Bullion preservation: Gold sold only as last resort under the Constitutional Liquidity Ladder (Article X)
6. LRR ≥ 1.0 (Article XIII)
7. Oracle medianization excludes outliers correctly (Part 4 Article III)
8. Oracle circuit breaker triggers on outlier detection (Part 4 Article III)
9. Governance timelock enforces 48-hour delay (Part 1 Article VIII)
10. Multi-Sig threshold (3-of-5) enforced on all upgrades (Part 4 Article V)
11. Total supply ≤ total reserve value / PAR (monetary invariant)
12. Minting and burning are atomic with reserve movement (no partial states)

### Evidence

- Certora verification reports (retained in Evidence Ledger as EV-031)
- Foundry invariant test suite
- Echidna campaign results

### Next Milestone

Extend formal verification to additional edge cases; publish comprehensive Formal Verification Report.

### Blocking Items

- None currently identified.

---

## Track 4 — Penetration Testing

**Owner:** Technical Committee
**Status:** PENDING EXTERNAL VALIDATION (engagement planned)

### Scope

Penetration testing across three surfaces:

- **Smart contracts** — reentrancy, integer overflow/underflow, access control, oracle manipulation, flash-loan attacks
- **Infrastructure** — network, application server, database, key management
- **Operational systems** — admin consoles, treasury interfaces, monitoring systems

### Methodology

- OWASP Testing Guide
- Smart contract-specific: SWC Registry, Solodit, top smart-contract attack patterns
- Black-box + grey-box + white-box testing

### Deliverables

- Signed penetration test report
- Findings classified by severity
- Remediation verification (re-test)

### Next Milestone

Engage qualified penetration testing firm; execute test Q3 2026.

### Blocking Items

- Final test environment configuration
- Engagement letter

---

## Track 5 — Bug Bounty

**Owner:** Technical Committee
**Status:** IN PROGRESS (programme planned on Immunefi)

### Scope

Continuous bug bounty programme for all 9 Protocol Smart Contracts and supporting infrastructure.

### Reward Schedule (target)

| Severity | Reward (USD) |
|----------|--------------|
| Critical | $250,000 – $2,000,000 |
| High | $50,000 – $250,000 |
| Medium | $10,000 – $50,000 |
| Low | $2,500 – $10,000 |
| Informational | $500 – $2,500 |

**Maximum reward: $2,000,000** (matches constitutional target per Part 4 Article V)

### Platform

- **Immunefi** — primary platform
- Internal triage by Technical Committee
- Independent validation by audit firm (where severity is High or Critical)

### Next Milestone

Launch programme on Immunefi; establish triage SLA (72 hours for initial response; 14 days for severity classification; 90 days for remediation).

### Blocking Items

- Final bounty budget allocation
- Smart Contract Registry publication (so bounty hunters can review deployed contracts)

---

## Track 6 — Big Four Review

**Owner:** Constitutional Council / Audit Committee
**Status:** NOT STARTED (engagement planned Q4 2026)

### Scope

Big-4 technology risk audit (Deloitte, PwC, EY, or KPMG) covering:

- Smart contract security governance
- Infrastructure security governance
- Security operations (monitoring, incident response, vulnerability management)
- Security controls (access control, encryption, key management)
- Operational resilience (business continuity, disaster recovery)
- Third-party risk management

### Deliverables

- Signed Big-4 technology risk audit report
- Findings and recommendations
- Management response
- Final report retained permanently in Evidence Ledger

### Independence

If the Big-4 firm performing this technology risk audit is the same firm performing the Big-4 Financial Audit (Article XVII §6), the firm shall be required to demonstrate independence between the two engagements.

### Next Milestone

Issue RFP to Big-4 firms; select auditor; commence Q4 2026.

### Blocking Items

- Engagement budget approval
- Selection of operating jurisdiction (affects Big-4 firm selection)

---

## Cross-Track Commitments

1. **No track substitution** — Each track addresses a distinct security dimension; substituting one for another leaves gaps.
2. **Evidence Ledger citation** — Every claim of "audited", "verified", or "secure" shall cite the relevant Evidence Ledger entry.
3. **Public disclosure** — The status of each track is publicly disclosed in this roadmap and in the Evidence Ledger. No silent overstatement.
4. **No regulatory approval implied** — Completion of any track does not constitute regulatory approval.
5. **Continuous maintenance** — Each track is recurring: penetration testing is annual, bug bounty is continuous, Big-4 review is annual, formal verification is re-run on every contract upgrade.

---

## Constitutional Reference

This roadmap operationalizes **Blueprint Part 2 Article XVII §11 (Security Assurance Framework)** and **Part 4 Article V (Security)** of the MITHQAL Constitutional Blueprint v19.

## Related Documents

- [Architecture](architecture.md)
- [Smart Contract Registry](../contracts/CONTRACT_REGISTRY.md) (Task 13-a)
- [Evidence Ledger](../evidence/EVIDENCE_LEDGER.md) (Task 13-a)
- Formal Verification Report: `/docs/verification/formal-verification-report.md`
- Constitutional Stress Master Report: `/docs/verification/constitutional-stress-master-report.md`
- [Risk Register](risk-register.md)
