/**
 * MITHQAL v26.0 §5.5 — External Claim Register (Data)
 *
 * The canonical home-page and external-marketing claims live here.
 * Every claim has a status; statuses are NOT inferred — they are
 * explicitly attested in `claim-registry-data.ts` and consumed by
 * `external-claim-register.ts`.
 *
 * Truth-label conventions:
 *   - SIMULATED: design-time language describing a target architecture
 *     that does not yet exist in production.
 *   - VERIFIED_PRIMARY_DOCUMENT: the claim corresponds to a primary
 *     document (e.g. MTQ gate code) that is currently enforced.
 *   - CONTRADICTED: a previously-published claim that is now
 *     intentionally contradicted by v26.0; the entry records the
 *     retraction action so reviewers can see what changed.
 *   - UNKNOWN / UNVERIFIED / EXPIRED: claims that must be removed
 *     from publication until re-attested.
 *
 * NOTE: no secret values are stored here. References to credentials,
 * keys, or signed material are by-name only (e.g. "VERCEL_TOKEN").
 */

import type { ClaimRecord } from "./external-claim-register";

export const CLAIM_REGISTRY: ClaimRecord[] = [
  {
    claimId: "CLAIM-HOME-HERO-001",
    exactWording:
      "Institutional Settlement. Coordinated. Explainable.",
    channel: "home.hero.h1",
    status: "SIMULATED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Marketing + Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: ["src/app/page.tsx", "docs/adr/0003-f0-f7-finality-state-machine.md"],
    limitations:
      "Tagline. The platform itself is in Pilot A; no production-authorized settlement has executed.",
    retractionAction: null,
    blueprint_ref: "v26.0 §1 Cover + §5.5 External Claim Register",
  },
  {
    claimId: "CLAIM-HOME-HERO-002",
    exactWording:
      "MITHQAL is a neutral institutional settlement control plane — built for the control plane, evidence model, and controlled pilot pathway.",
    channel: "home.hero.p",
    status: "SIMULATED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Marketing + Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: ["src/app/page.tsx", "docs/adr/0001-database-writer-authority.md"],
    limitations:
      "Describes the design target. Pilot A has not contracted any bank counterparty; production-authorized=false (D-012).",
    retractionAction: null,
    blueprint_ref: "v26.0 §1 + §3.2 + §5.5",
  },
  {
    claimId: "CLAIM-HOME-PILLAR-RESERVE",
    exactWording:
      "Resilience / Direct-matched backing (target, not legal rule).",
    channel: "home.platform-pillars.reserve",
    status: "SIMULATED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: [
      "src/lib/eligible-backing.ts",
      "docs/adr/0004-eligible-backing-formula.md",
    ],
    limitations:
      "EligibleBacking = MIN(economic, legal, liquid, settlementAvailable). The MIN is a design target and a control-plane invariant; it is not a legal rule or a guarantee of any specific collateralization ratio.",
    retractionAction: null,
    blueprint_ref: "v26.0 §3.3 + §3.4 + §5.5",
  },
  {
    claimId: "CLAIM-HOME-PILLAR-FINALITY",
    exactWording: "F0–F7 Finality",
    channel: "home.platform-pillars.finality",
    status: "SIMULATED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: [
      "src/lib/finality-state-machine.ts",
      "docs/adr/0003-f0-f7-finality-state-machine.md",
    ],
    limitations:
      "F0..F7 finality decomposition is implemented as a TypeScript state-machine module. Pilot A has not observed any real F7 (legal settlement final) event because no production instructions have executed.",
    retractionAction: null,
    blueprint_ref: "v26.0 §4.2 + §4.4 + §5.5",
  },
  {
    claimId: "CLAIM-HOME-PROGRAM-STATUS-BADGE",
    exactWording:
      "v26.0 CANONICAL BASELINE — MTQ DISABLED BY DEFAULT",
    channel: "home.program-status.badge",
    status: "VERIFIED_PRIMARY_DOCUMENT",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: [
      "src/lib/mtq-gate.ts",
      "src/app/page.tsx",
      "docs/adr/0002-mtq-disabled-by-default.md",
    ],
    limitations:
      "Verified: MTQ gate enforces MTQ_ENABLED=false by default per v26.0 §3.2. The badge text on the home page matches the gate's runtime behavior.",
    retractionAction: null,
    blueprint_ref: "v26.0 §3.2 + §5.5",
  },
  {
    claimId: "CLAIM-LEGACY-RESERVE-130-PERCENT",
    exactWording: "Reserve / 130% backing specification.",
    channel: "home.platform-pillars.reserve (legacy v25.x)",
    status: "CONTRADICTED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2026-12-10",
    evidenceRefs: [
      "docs/adr/0004-eligible-backing-formula.md",
      "institutional/decision-log/d-001-through-d-012.json#D-004",
    ],
    limitations:
      "Previously published in v25.x marketing copy. Contradicted by v26.0 §3.3: backing is the MIN of four dimensions, not a fixed 130% ratio. The 130% figure was a v25.x design-time aspiration, not a verified legal rule.",
    retractionAction:
      "Removed from src/app/page.tsx pillar grid; replaced with 'Resilience / Direct-matched backing (target, not legal rule)'. v25.x pillar wording retained here only as a retraction record.",
    blueprint_ref: "v26.0 §3.3 + §11.3 D-004 + §5.5",
  },
  {
    claimId: "CLAIM-HOME-EVIDENCE-FABRIC",
    exactWording: "Evidence Fabric",
    channel: "home.feature-grid.evidence-fabric",
    status: "SIMULATED",
    scope: {
      entity: "MITHQAL (operator)",
      jurisdiction: "US-Federal",
      applicableLaw: "Pilot-A-read-only",
    },
    owner: "Architecture",
    reviewer: "Architecture Review Board",
    reviewDate: "2026-10-10",
    expiresAt: "2027-01-10",
    evidenceRefs: [
      "src/app/api/gateway/v1/evidence/route.ts",
      "prisma/schema.prisma#EvidenceArtifact",
      "docs/adr/0006-external-claim-register.md",
    ],
    limitations:
      "Evidence Fabric API is implemented (GET query + POST submit) but has not yet been populated with primary documents for any production instruction. Pilot-A queries return the empty set.",
    retractionAction: null,
    blueprint_ref: "v26.0 §5.1 + §5.5 + §5.6 Evidence Fabric",
  },
];

export const LEGACY_CLAIM_RETRACTIONS = [
  {
    legacyClaimId: "CLAIM-LEGACY-RESERVE-130-PERCENT",
    retractedOn: "2026-10-10",
    reason:
      "Replaced by EligibleBacking = MIN(economic, legal, liquid, settlementAvailable) per v26.0 §3.3. The 130% figure was a v25.x design-time aspiration with no primary document support.",
    blueprintRef: "v26.0 §3.3 + §11.3 D-004 + §5.5",
  },
] as const;
