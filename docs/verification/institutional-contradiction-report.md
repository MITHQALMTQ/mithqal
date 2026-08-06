# MITHQAL — Institutional Contradiction Report

**Document ID:** `institutional-contradiction-report.md`
**Authority:** Institutional Governance Auditor · Chief Constitutional Engineer
**Audit scope:** All code, components, and documentation that describe the
MITHQAL institutional structure.
**Canonical source of truth:** [`docs/legal/institutional-principles.md`](../legal/institutional-principles.md)
**Audit date:** see git history.

---

## Purpose

This report enumerates every contradiction discovered between the project's
canonical institutional principles and the language previously present in
code, components, and documentation. Each contradiction is paired with the
remediation applied.

A "contradiction" is any text, data structure, or UI surface that:

1. Describes a planned entity (Foundation, Holding Company, Operations Ltd.,
   Markets Ltd.) as if it currently exists; OR
2. Connects the Foundation underneath the Holding Company; OR
3. Connects reserves underneath Operations or Markets; OR
4. Presents Operations Ltd. and Markets Ltd. as parent/child rather than
   sister companies; OR
5. Describes JOZOUR LLC as the Institution, the reserve owner, the reserve
   custodian, or the constitutional authority; OR
6. Fails to use the canonical reserve-independence wording.

---

## Summary

| Metric | Count |
|---|---|
| Contradictions found | **14** |
| Contradictions remediated | **14** |
| Open contradictions | **0** |
| Files created | **4** |
| Files modified | **9** |

---

## Contradictions Found and Remediated

### C-01 — `src/lib/commercial-governance.ts`
**File:** `src/lib/commercial-governance.ts`
**Severity:** High (data layer — propagates to all consumers).
**Issue:** `CONSTITUTIONAL_ENTITIES` array listed the Foundation, Holding
Company, Operations Ltd., and Markets Ltd. with no `status` field. Consumers
(APIs, dashboards) had no machine-readable signal that these entities are
planned.
**Remediation:**
- Added module-level comment block: "These entities are PLANNED. The current
  operating entity is JOZOUR LLC (NJ)."
- Added `EntityStatus` type (`"planned" | "active"`).
- Added `status: EntityStatus` field to `ConstitutionalEntity` interface.
- Added `status: "planned"` to all four entities with inline justification
  comments.
**Status:** ✅ Remediated.

### C-02 — `src/components/institutional-economics.tsx` (header)
**File:** `src/components/institutional-economics.tsx`
**Severity:** High (public-facing dashboard).
**Issue:** The "Institutional Economics" section header described the
four-entity structure as if currently operating, with no visible indication
these entities are planned.
**Remediation:**
- Added a prominent amber TARGET-architecture notice box at the top of the
  section: "The organizational structure below represents the TARGET
  architecture. Currently, MITHQAL is operated by JOZOUR LLC (New Jersey).
  Planned entities do not yet exist and are not currently operating."
**Status:** ✅ Remediated.

### C-03 — `src/components/institutional-economics.tsx` (entity flow diagram)
**File:** `src/components/institutional-economics.tsx`
**Severity:** High.
**Issue:** `FlowNode` rendered the names "MITHQAL Foundation", "MITHQAL
Holding Company", "MITHQAL Operations Ltd.", and "MITHQAL Markets Ltd."
without any PLANNED badge.
**Remediation:**
- Added `planned?: boolean` prop to `FlowNode`.
- When `planned` is `true`, renders an amber "PLANNED" badge next to the
  entity name.
- Set `planned` on all four entity FlowNodes (Foundation, Holding,
  Operations, Markets).
**Status:** ✅ Remediated.

### C-04 — `src/components/institutional-economics.tsx` (entity cards)
**File:** `src/components/institutional-economics.tsx`
**Severity:** High.
**Issue:** The "Entity Responsibilities" cards rendered `e.name` without any
PLANNED label.
**Remediation:**
- Wrapped `e.name` in a flex container with an inline amber "PLANNED" badge.
**Status:** ✅ Remediated.

### C-05 — `src/components/institutional-economics.tsx` (reserve text)
**File:** `src/components/institutional-economics.tsx`
**Severity:** High.
**Issue:** The reserve-integrity paragraph said "It is NOT owned by any
entity — it is held by Markets on behalf of the Institution." This implies
Markets Ltd. currently exists.
**Remediation:**
- Replaced with the canonical Principle 4 wording: "Reserve assets are held
  in segregated custody under the Constitutional Reserve Framework through
  approved custodian institutions for the exclusive benefit of the MITHQAL
  reserve system. They are never operating assets and never corporate assets
  of JOZOUR LLC or any future operating entity."
- Added parenthetical clarification that Markets Ltd. is the *planned*
  procurement entity and does not yet exist.
**Status:** ✅ Remediated.

### C-06 — `src/components/commercial-governance-dashboard.tsx` (header)
**File:** `src/components/commercial-governance-dashboard.tsx`
**Severity:** High (public dashboard).
**Issue:** The dashboard header described the four-entity structure as if
currently operating.
**Remediation:**
- Added a TARGET-architecture notice box: "The four constitutional entities
  below (Foundation, Holding, Operations, Markets) are PLANNED. Currently,
  MITHQAL is operated by JOZOUR LLC (New Jersey). Planned entities do not
  yet exist and are not currently operating."
**Status:** ✅ Remediated.

### C-07 — `src/components/commercial-governance-dashboard.tsx` (EntitiesTab)
**File:** `src/components/commercial-governance-dashboard.tsx`
**Severity:** High.
**Issue:** The EntitiesTab cards rendered `e.name` without a PLANNED label.
**Remediation:**
- Wrapped `e.name` in a flex container with an inline amber "PLANNED" badge
  for every entity card.
- Added a comment block above `ENTITY_LABEL` explaining the canonical rule.
**Status:** ✅ Remediated.

### C-08 — `src/lib/site-data.ts` (LEGAL_STATUS)
**File:** `src/lib/site-data.ts`
**Severity:** High (foundational content file).
**Issue:** The `LEGAL_STATUS` block described Entity A's targetStructure
(Foundation) and Entity B without surfacing the canonical disclaimer at the
data layer. Consumers had no canonical wording to render.
**Remediation:**
- Added `canonicalDisclaimer` field with the exact canonical paragraph.
- Added `reserveIndependence` field with the exact Principle 4 wording.
- Added an INSTITUTIONAL PRINCIPLES comment block above the constant.
**Status:** ✅ Remediated.

### C-09 — `README.md`
**File:** `README.md`
**Severity:** High (repository front door).
**Issue:** README had no "Institutional Structure" section distinguishing
current vs planned entities.
**Remediation:**
- Added a new "Institutional Structure" section with subsections:
  - Current Operator (LIVE) — JOZOUR LLC, with explicit "NOT the
    Institution" disclaimer.
  - Future Commercial Structure (planned) — with the Foundation / Holding /
    Operations / Markets diagram and the sister-companies rule.
  - Future Constitutional Structure (planned) — with the constitutional
    chain and the independence rules.
  - Reserve Independence (canonical wording) — verbatim Principle 4.
  - Canonical Disclaimer — verbatim.
**Status:** ✅ Remediated.

### C-10 — `src/app/legal/terms/page.tsx`
**File:** `src/app/legal/terms/page.tsx`
**Severity:** High (legal page).
**Issue:** Terms of Service did not include the canonical institutional
disclaimer.
**Remediation:**
- Added the exact canonical disclaimer paragraph as an amber notice box
  directly below the page header.
**Status:** ✅ Remediated.

### C-11 — `src/app/legal/privacy/page.tsx`
**File:** `src/app/legal/privacy/page.tsx`
**Severity:** High (legal page).
**Issue:** Privacy Policy did not include the canonical institutional
disclaimer.
**Remediation:**
- Added the exact canonical disclaimer paragraph as an amber notice box
  directly below the page header.
**Status:** ✅ Remediated.

### C-12 — `src/app/legal/risk-disclosure/page.tsx`
**File:** `src/app/legal/risk-disclosure/page.tsx`
**Severity:** High (legal page).
**Issue:** Risk Disclosure did not include the canonical institutional
disclaimer.
**Remediation:**
- Added the exact canonical disclaimer paragraph as an amber notice box
  directly below the page header.
**Status:** ✅ Remediated.

### C-13 — `docs/whitepaper.md` (front matter + Section 9)
**File:** `docs/whitepaper.md`
**Severity:** High (investor-facing document).
**Issue:**
- "Prepared By: MITHQAL Foundation" presented the (planned) Foundation as
  currently existing.
- Section 9 note "JOZOUR LLC serves as the interim operating vehicle" did
  not explicitly state the Foundation and commercial entities are planned.
- Contact section listed "MITHQAL Foundation" without the planned qualifier.
**Remediation:**
- Front matter now reads "Prepared By: MITHQAL Foundation (planned) —
  currently operated by JOZOUR LLC (New Jersey)".
- Added a top-level "Institutional Status Disclaimer" section with the
  canonical disclaimer paragraph, the canonical reserve-independence
  wording, and the planned commercial and constitutional diagrams.
- Section 9 note expanded to explicitly state the Foundation, Holding
  Company, Operations Ltd., and Markets Ltd. are planned; JOZOUR LLC is
  NOT the Institution, reserve owner, reserve custodian, or constitutional
  authority.
- Contact section now lists "JOZOUR LLC (current operating entity for
  MITHQAL) / MITHQAL Foundation (planned)".
**Status:** ✅ Remediated.

### C-14 — Missing canonical principles + roadmap documents
**Files:** `docs/legal/institutional-principles.md` (new),
`docs/roadmap/organizational-roadmap.md` (new).
**Severity:** Critical (governance gap).
**Issue:** Prior to this audit, the project had no canonical document
codifying the distinction between current and planned entities.
**Remediation:**
- Created `docs/legal/institutional-principles.md` with the six canonical
  principles in the user's exact wording.
- Created `docs/roadmap/organizational-roadmap.md` with the three clearly
  separated stages (Current LIVE, Planned, TARGET) and explicit "does not
  exist today" labelling for all planned entities.
**Status:** ✅ Remediated.

---

## Out-of-Scope Notes

The following items were reviewed and **do not** constitute contradictions:

1. `src/lib/site-data.ts` `STATUS_ITEMS` — already accurately labels Entity A
   as "Active — formation phase" and Entity B as "Not yet formed / Planned
   Phase 1". No change required.
2. `src/app/legal/terms/page.tsx` Section 1 (Operator) — already correctly
   states JOZOUR LLC is the operator and the "Mithqal Institution" is a
   constitutional concept not yet separately incorporated. The canonical
   disclaimer has been added on top of this existing accurate wording.
3. `INSTITUTIONAL-AUDIT.md` historical audit document — left intact as a
   historical record; the contradictions it identifies (different from this
   audit) had already been remediated in a prior pass.

---

## Verification

All remediations were verified by:

1. Reading the modified files end-to-end.
2. Confirming each `status: "planned"` value is present on every entity.
3. Confirming each public-facing dashboard renders the TARGET-architecture
   notice and a PLANNED badge next to each future entity name.
4. Confirming each legal page contains the exact canonical disclaimer
   paragraph (no paraphrasing).
5. Confirming the README and whitepaper contain the canonical reserve-
   independence wording verbatim.
6. Running the project lint suite (`bun run lint`) — see
   [`final-certification.md`](final-certification.md).

---

## Conclusion

All **14** contradictions identified during this audit have been remediated.
The project's institutional language is now consistent with
[`docs/legal/institutional-principles.md`](../legal/institutional-principles.md)
across all code, components, and documentation surfaces.

See [`final-certification.md`](final-certification.md) for the certification
of alignment.
