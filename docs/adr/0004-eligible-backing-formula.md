# ADR 0004 — Eligible Backing Formula

- **Status:** ACCEPTED
- **Date:** 2026-10-10
- **Blueprint Reference:** v26.0 §3.3, §3.4, §11.3 D-004
- **Reviewers:** Architecture Review Board, Treasury, Legal

## Context

v25.x described MITHQAL's reserve backing as a "130% backing specification".
This was a marketing-time aspiration, not a verified legal rule, and it
masked three institutional problems:

1. **No dimensionality.** "130% backing" did not distinguish economic
   value, legal control, liquidity, and settlement availability. A
   reserve could be 130% of the obligation economically but illiquid,
   or legally encumbered, or unavailable for same-day settlement.

2. **Implicit buffer commingling.** The "30% over-collateralization" was
   sometimes the risk buffer, sometimes the operational float, and
   sometimes the contingency reserve — three different things that
   had been collapsed into one number.

3. **Marketing-as-rule drift.** The "130%" figure appeared in pillar
   copy, deck slides, and external decks as if it were a verified
   rule. There was no primary document; the figure was an aspiration.

## Decision

EligibleBacking is the minimum of four independently-attested dimensions:

```
EligibleBacking = MIN(EconomicBacking,
                      LegalBacking,
                      LiquidBacking,
                      SettlementAvailableBacking)
```

Each dimension carries:

- a `ClaimStatus` (VERIFIED_PRIMARY_DOCUMENT, MEASURED, SIMULATED,
  ASSUMED, PENDING_PRIMARY_DOCUMENT, PENDING_LEGAL_REVIEW, EXPIRED,
  CONTRADICTED, UNKNOWN),
- a freshness policy version and an explicit `expiresAt`,
- a legal scope (entity + jurisdiction + applicableLaw),
- an evidence reference,
- an explicit `blocksEligibility` flag.

`computeEligibleBacking()` returns `eligibleBacking=0` with
`blocked=true` whenever any dimension carries a blocking status
(UNKNOWN / EXPIRED / CONTRADICTED / PENDING_*) or has its
`blocksEligibility` flag set.

`isDirectMatched()` tests whether the eligible backing covers the
obligation in the same unit. The risk buffer (§3.5) is tracked
separately and does NOT contribute to direct-match satisfaction.

The legacy "130% backing specification" claim is recorded as
`CLAIM-LEGACY-RESERVE-130-PERCENT` with `status=CONTRADICTED` in
`src/lib/claim-registry-data.ts`. The home page pillar wording was
replaced with "Resilience / Direct-matched backing (target, not legal
rule)".

## Consequences

**Positive:**

- Backing is dimensional, not a single ratio. Reviewers can re-verify
  each dimension independently.
- The risk buffer is no longer commingled into backing eligibility.
- The "130%" figure has been retracted with an explicit retraction action;
  reviewers can see what changed and why.

**Negative:**

- Operators must now produce four pieces of evidence per backing
  attestation. This is by design; backing is supposed to be expensive
  to claim.
- The MIN can drop sharply when a single dimension becomes unverified.
  This is also by design; a single dimension being unverified is a
  blocking condition.
- Marketing copy that previously used "130%" must be re-attested before
  re-publication. The External Claim Register enforces this.

## Alternatives Considered

1. **Fixed-ratio backing (130% or 100% or 200%).** Rejected; any fixed
   ratio collapses the four dimensions into one number and re-introduces
   the v25.x ambiguity.

2. **Weighted-sum backing.** Rejected; weighted sums allow one strong
   dimension to mask a weak dimension. The MIN is the only combinator
   that respects the institutional principle that no dimension can
   substitute for another.

3. **Maximum-of-dimensions backing.** Rejected; MAX would let the
   strongest dimension override the weakest, which is the opposite of
   the institutional principle.

## Blueprint Reference

- v26.0 §3.3 Eligible Backing Formula
- v26.0 §3.4 Direct-Matched Backing
- v26.0 §3.5 Risk Buffer (separate, not contributing to direct-match)
- v26.0 §11.3 D-004 Direct-Matched Backing + Risk Buffer Separate
- v26.0 §5.5 External Claim Register (retraction of the 130% claim)

## Code Evidence

- `src/lib/eligible-backing.ts`
- `src/lib/external-claim-register.ts`
- `src/lib/claim-registry-data.ts#CLAIM-LEGACY-RESERVE-130-PERCENT`
- `src/app/page.tsx` (pillar wording)
