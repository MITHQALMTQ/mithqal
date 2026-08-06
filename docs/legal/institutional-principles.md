# MITHQAL — Canonical Institutional Principles

**Document ID:** `institutional-principles.md`
**Authority:** Chief Constitutional Engineer · Chief Enterprise Architect · Institutional Governance Auditor
**Status:** BINDING — canonical source of truth for all institutional language across code, docs, and public surfaces.
**Last updated:** see git history.

---

## Purpose

This document is the single canonical source of truth for how MITHQAL
describes itself across **every** code file, component, document, legal page,
dashboard, whitepaper, and public communication.

Any language that contradicts the six principles below is a **defect** and must
be corrected. When in doubt, this document governs.

---

## Principle 1 — Current Operating Entity

Today MITHQAL is operated by **JOZOUR LLC (New Jersey)**.

JOZOUR LLC currently performs:

- Platform development
- Software engineering
- APIs
- Website
- Infrastructure
- AI platform
- Documentation
- Institutional outreach
- Compliance operations
- Mint / redemption operations
- Day-to-day operations

JOZOUR LLC is **NOT**:

- The Institution
- The reserve owner
- The reserve custodian
- The constitutional authority

It is simply the **current operating company**.

---

## Principle 2 — Future Commercial Structure

Future commercial structure is **planned only**. Do **NOT** describe as existing.

```
Founder → MITHQAL Holding Company (planned) → [Operations Ltd. (planned) | Markets Ltd. (planned)]
```

**Operations Ltd.** and **Markets Ltd.** are **sister companies**.
**Never parent/child.**

---

## Principle 3 — Constitutional Structure

Commercial governance is **independent from** constitutional governance.

```
MITHQAL Constitution
        ↓
Independent Constitutional Foundation (planned)
        ↓
Approved Custodian Institutions
        ↓
Gold · Silver · Cash · Sukuk · Other Approved Reserve Assets
```

**NEVER** connect the Foundation underneath the Holding Company.
**NEVER** connect reserves underneath Operations.
**NEVER** connect reserves underneath Markets.

---

## Principle 4 — Reserve Independence

Use **exactly** this wording everywhere reserves are described:

> "Reserve assets are held in segregated custody under the Constitutional
> Reserve Framework through approved custodian institutions for the exclusive
> benefit of the MITHQAL reserve system. They are never operating assets and
> never corporate assets of JOZOUR LLC or any future operating entity."

This wording is canonical. Do **not** paraphrase. Do **not** abbreviate.

---

## Principle 5 — Foundation

The Foundation is **planned**.

The Foundation exists to **protect the Constitution**.

**Foundation responsibilities:**

- Constitutional governance
- Constitutional oversight
- Standards
- Certification
- Transparency

The Foundation **never**:

- Operates commercially
- Owns reserves
- Custodies reserves
- Owns companies
- Performs operations

---

## Principle 6 — Constitution First

The **Constitution** governs:

- The reserve framework
- Governance
- Custody principles
- Institutional integrity

The **commercial companies** execute operations.

The **Constitution** governs the **Institution**.

---

## How to Apply These Principles

| Surface | Required action |
|---|---|
| Source code (`.ts`/`.tsx`) that names future entities | Add `status: "planned"` and a comment pointing to this document |
| Public dashboards / entity diagrams | Add a visible **PLANNED** badge or label next to each future entity |
| Legal pages (terms, privacy, risk) | Add the canonical disclaimer paragraph (see below) |
| Whitepaper / README / roadmap | Label future entities as "(planned)" and reference this document |
| Conversations with investors, regulators, partners | Never describe future entities as existing |

### Canonical Disclaimer Paragraph (for legal pages)

> "MITHQAL is currently operated by JOZOUR LLC during the institutional
> development phase. The constitutional architecture described throughout this
> documentation represents the intended institutional destination of the
> project. Planned entities do not yet exist and are not currently operating."

---

## Contradiction Reporting

Any contradiction found against these principles must be filed in
[`docs/verification/institutional-contradiction-report.md`](../verification/institutional-contradiction-report.md)
and remediated before the next release.
