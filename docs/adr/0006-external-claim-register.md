# ADR 0006 — External Claim Register

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §5.5, §5.6, §11.3 D-011
- **Reviewers:** Architecture Review Board, Marketing, CFO, Legal

## Context

v25.x marketing material made several external claims about MITHQAL
that did not have primary-document support:

1. **"130% backing specification."** A design-time aspiration, not a
   verified legal rule. No primary document.
2. **CPI/ROI figures.** Often sourced from projections rather than
   measured inputs. No MEASURED claim status.
3. **"7/7 irrevocable settlement."** Used as a pillar descriptor while
   the platform had not observed a single F7 event in production.

Reviewers could not tell which claims were verified, which were
simulated, and which had been contradicted by a later design decision.

## Decision

MITHQAL maintains a single canonical External Claim Register
(`src/lib/claim-registry-data.ts` + `src/lib/external-claim-register.ts`).
Every external claim has:

- a `claimId`,
- a verbatim `exactWording` string,
- a `channel` (e.g. `home.hero.h1`, `home.program-status.badge`),
- a `status` from the `ClaimStatus` taxonomy:
  `VERIFIED_PRIMARY_DOCUMENT | EXECUTED_EXTERNAL_DOCUMENT | MEASURED |
   EXTERNAL_SOURCE | SIMULATED | ASSUMED | UNKNOWN | UNVERIFIED |
   CONTRADICTED | EXPIRED`,
- a `scope` (entity + jurisdiction + applicableLaw),
- an `owner` and a `reviewer`,
- a `reviewDate` and an `expiresAt`,
- a list of `evidenceRefs` (file paths or EvidenceArtifact ids),
- a `limitations` note,
- a `retractionAction` (for CONTRADICTED claims).

`isPublishable(claim)` returns true only for VERIFIED / MEASURED /
SIMULATED claims that have not expired. UNKNOWN / UNVERIFIED /
CONTRADICTED / EXPIRED / ASSUMED claims must not be published in
their original wording.

`getTruthLabel(claim)` returns a short, human-readable truth label
that can be surfaced next to the claim on the home page (tooltip or
program-status block).

The legacy "130% backing specification" claim is recorded as
`CLAIM-LEGACY-RESERVE-130-PERCENT` with `status=CONTRADICTED` and a
retraction action that points to the v26.0 §3.3 formula.

## Consequences

**Positive:**

- Every external claim has an explicit truth label. Reviewers and
  counterparties can tell what is verified, what is simulated, and
  what has been retracted.
- The 130% claim has been retracted with an explicit retraction
  action; reviewers can see what changed and why.
- CPI/ROI claims with `SIMULATED` status cannot be published (per
  §11.3 D-011). The register enforces this via `isPublishable()`.

**Negative:**

- Marketing copy that previously used unverified claims must be
  re-attested before re-publication. This is by design.
- The register must be kept in sync with the home page copy. A CI
  check is planned (OD-015) but not yet implemented.

## Alternatives Considered

1. **Free-form marketing copy.** Rejected; this is the v25.x state
   and the source of the ambiguity this ADR addresses.

2. **Separate register per channel.** Rejected; a single register
   with channel field gives the cross-channel contradiction scan
   (§5.5) the data it needs to detect drift between, e.g., the home
   page and a deck slide.

3. **Verified-only register (no SIMULATED status).** Rejected; the
   SIMULATED status lets designers describe target architecture
   honestly without pretending it is already verified.

## Blueprint Reference

- v26.0 §5.5 External Claim Register
- v26.0 §5.6 Evidence Fabric
- v26.0 §11.3 D-011 CPI/ROI Require Measured Inputs
- v26.0 §3.3 Eligible Backing Formula (legacy 130% retraction)

## Code Evidence

- `src/lib/external-claim-register.ts`
- `src/lib/claim-registry-data.ts`
- `src/app/api/gateway/v1/evidence/route.ts`
- `src/app/page.tsx` (ProgramStatus badge, pillar wording)
