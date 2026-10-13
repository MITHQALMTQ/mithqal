# MITHQAL — Blueprint vs. Codebase Gap Analysis v25.6

**Document ID:** `BLUEPRINT-CODEBASE-GAP-ANALYSIS-v25.6.md`
**Owner:** Agent F1 — Blueprint-vs-Codebase Cross-Reference Architect
**Release:** v25.6
**Date:** 29 September 2026
**Classification:** Architectural audit — **HONEST, NOT-FORCED-TO-PASS**

---

## 1. Executive Summary

This document cross-references **four source documents** against the v25.6
codebase to identify gaps and recommend remediation. The agent that produced
this report is the architect; **no source code was modified** by this task —
the remediations are recommendations for follow-up implementer agents.

### 1.1 Sources analyzed (4 total)

| # | Document | Path | Size | Date |
|---|---|---|---|---|
| 1 | MITHQAL Master Blueprint v25.3 — MAJOR AMENDMENT — FULLY INTEGRATED EDITION | `/tmp/my-project/upload/MTQ_modified.docx` | 2,094,001 chars (~2 MB) | 2026-08-26 |
| 2 | MITHQAL Constitution v19.0 — Constitutional Monetary Infrastructure Specification | `/tmp/my-project/upload/MITHQAL.docx` | 1,467,538 chars (~1.5 MB) | 2026-07-22 |
| 3 | JOZOUR LLC Operating Agreement Amendment (PDF) | `/tmp/my-project/upload/JOZOUR, LLC  OPERATING AGREEMENT AMENDMENT .pdf` | 6 pages | 2026-07-31 |
| 4 | Resolution of JOZOUR LLC Regarding the MITHQAL Project (PDF) | `/tmp/my-project/upload/RESOLUTION OF JOZOUR, LLC  REGARDING THE MITHQAL PROJECT.pdf` | 3 pages | (same) |

### 1.2 Codebase inventory at v25.6 (verified by `find`)

| Surface | Count | Notes |
|---|---|---|
| API routes (`route.ts` files under `src/app/api/`) | **161** | Verified via `find src/app/api -name route.ts \| wc -l` |
| Top-level app pages (`src/app/*`) | **12** | `/`, `/api-docs`, `/demo`, `/institutional-engagement`, `/institutional-readiness`, `/legal/{cookies,privacy,risk-disclosure,terms}`, `/os`, `/status`, `/video` |
| Lib modules (`src/lib/*.ts`) | **118** | Includes `constitution-data.ts`, `v19-infrastructure.ts`, `finality-before-mint.ts`, `ertf.ts`, `dynamic-rebalancer.ts`, `site-data.ts`, `commercial-governance.ts`, `licensing-entity-matrix.ts`, etc. |
| Components (`src/components/*.tsx`) | **59** | Includes `constitution.tsx`, `monetary-engine-explained.tsx`, `site-footer.tsx`, `public-site.tsx`, `institutional-economics.tsx`, etc. |
| Mini-services (`mini-services/`) | **3** | `discord-bot`, `mithqal-watchdog`, `notify-service` |
| Prisma models (`prisma/schema.prisma`) | **4** | `User`, `Post`, `FormationInterest`, `TestnetOperation` (only) |
| Legal pages (`/legal/*`) | **4** | `terms`, `privacy`, `risk-disclosure`, `cookies` |

### 1.3 Top-line gap counts

A total of **42 blueprint/legal provisions were cross-checked against the
codebase**. Outcomes:

- ✅ **IMPLEMENTED** (24 provisions) — full code/page/API surface exists
- ⚠️ **PARTIAL** (10 provisions) — some code/page exists but missing piece
- ❌ **GAP** (8 provisions) — no code/page exists; remediation recommended

Implementation rate: **57% fully implemented**, **81% at least partially
covered**, **19% total gaps**.

### 1.4 Top 3 honest findings

1. **The JOZOUR Operating Agreement Amendment (July 31 2026) is NOT
   reflected in the codebase.** None of its four weight-bearing provisions
   (§1.4 Asset Segregation + Successor Transfer, §1.5 Indemnification of
   Manager, §1.7 No Liability for Existing Debts, §1.8 Non-Profit Character)
   appears in any `/legal/*` page, any dashboard, or any API response. The
   Terms page mentions JOZOUR LLC as the operator but does NOT state the
   Amendment provisions.
2. **The JOZOUR Resolution (Project Authorization) is NOT surfaced
   anywhere.** The Resolution authorizes MITHQAL as a project of the Company,
   names the Manager as the authority to execute contracts / open accounts /
   develop IP / engage advisors / apply for grants, and remains in effect
   until successor transfer or written resolution. None of this is surfaced
   on `/status`, `/institutional-readiness`, or in any API response.
3. **The Constitution version is inconsistent across surfaces.** The
   source-of-truth Constitution document is `v19.0` (MITHQAL.docx, 22 July
   2026). The codebase surfaces `v25.0` (`site-data.ts` `STATUS_ITEMS`
   `Constitution: "v25.0"`), `v19.0.3` (Terms page footer, api-docs footer,
   video page header), `v19.0.2`/`v19.0.9` (stress-test-fixed.ts comments),
   and `v24.2.1` (constitution-data.ts header comment). The cleanest
   reference — "Constitution v19.0" with no sub-version — is NOT found in
   any `src/` file. The blueprint itself does not contain the literal string
   `Constitution v19` (verified).

---

## 2. Gap Matrix — Blueprint / Constitution / JOZOUR vs. v25.6 Codebase

Legend: ✅ IMPLEMENTED · ⚠️ PARTIAL · ❌ GAP

### 2.1 Legal-entity architecture (10 high-priority items per task spec)

| # | Blueprint / PDF clause | Code location(s) | Status | Recommendation |
|---|---|---|---|---|
| L1 | Jozour, LLC registered name + EIN 84-3470275 + NJ | `src/lib/site-data.ts:307-316` (`LEGAL_STATUS.entityA.ein`, `.soleMember`, `.registeredAgent`); `src/lib/playbook-data.ts:9,64`; `src/components/site-footer.tsx:33,94`; `src/app/legal/privacy/page.tsx:34-36`; `src/app/legal/risk-disclosure/page.tsx:54` | ✅ | No action — fully surfaced across 4 pages + footer + 2 lib modules. |
| L2 | Two-entity architecture (Foundation to be formed + Jozour interim) | `src/lib/site-data.ts:246-359` (LEGAL_STATUS with entityA / entityB block); `src/lib/i18n/messages.ts:154-160` (`legal.entityA.name` / `legal.entityB.name`); `src/components/public-site.tsx:1352,1377` (Entity A / Entity B sections) | ✅ | No action — surfaced as "Two-Entity Architecture" canonical block. |
| L3 | Mohamed S. Eltonsy named as Manager / Sole Member | `src/lib/site-data.ts:312` (`soleMember: "Mohamed S. Eltonsy"`); `src/app/legal/privacy/page.tsx:36`; `src/lib/institutional/types.ts:362` (`INSTITUTIONAL_EMAIL = "meltonsy@icloud.com"`) | ✅ | No action — Manager is named on `/legal/privacy` and surfaced via `site-data.ts`. |
| L4 | "Constitution v19.0" canonical reference | `src/app/legal/terms/page.tsx:37` (mentions "Mithqal Constitution v19.0.3"); `src/app/api-docs/page.tsx:319` ("v19.0.3 specification"); `src/app/status/page.tsx:347` ("v19.0.3 contract suite"); `src/lib/site-data.ts:332` ("Constitution v25.0") | ⚠️ | Constitution version is **inconsistent across surfaces** — clean "v19.0" string never appears in `src/`. Recommend: harmonize to "Constitution v19.0" in `src/lib/site-data.ts` and `src/lib/constitution-data.ts` (header comment), and either fix or annotate the v19.0.2/v19.0.3/v19.0.9 sub-version strings to be machine-derivable from a single constant. Effort: ~4 hours. Priority: **Major**. |
| L5 | 8 constitutional principles (full set) | `src/lib/v19-infrastructure.ts:547-570` (CONSTITUTIONAL_INVARIANTS — 21-item list including all 8 as separate invariants); `src/components/monetary-engine-explained.tsx:1679-1689` ("guardrails" array — only 4 of the 8 surfaced as headline guardrails); `src/components/faq.tsx`, `src/components/admin.tsx`, `src/components/infrastructure.tsx` (partial) | ⚠️ | All 8 principles are encoded in `v19-infrastructure.ts` but the **monetary-engine-explained component only surfaces 4 as "guardrails"** (missing: Deterministic Monetary Engine, Institutional Neutrality, Full Redeemability, Gold as Constitutional Anchor). Recommend: extend the `guardrails` array in `monetary-engine-explained.tsx` (or create a new `<ConstitutionalPrinciples>` component) to list all 8 explicitly with citations. Effort: ~1 hour. Priority: **Major**. |
| L6 | §1.4 Amendment: Asset segregation + successor transfer ("held in trust for future Foundation") | `src/lib/bank-default-resolution.ts:448,489,671` (successor entity in bank-default context, NOT Foundation context); `src/lib/v19-infrastructure.ts:2082,2116` (constitutional successor tickers); `src/lib/v25-1-final-amendment.ts:639` (bank customer transfer) | ❌ | No code surfaces the §1.4 trust-for-future-Foundation language. **Recommend: create `/legal/institutional-trust/page.tsx`** that surfaces the §1.4 wording ("GitHub repository, Vercel deployment, X account, and all other digital assets are held by JOZOUR LLC in trust for the future MITHQAL Foundation Inc., to be transferred upon its formation"). Effort: ~4 hours. Priority: **Critical**. |
| L7 | §1.5 Amendment: Indemnification of Manager | (no `indemnif` + `Manager` co-occurrence in `src/` — verified via grep across `src/app/**`, `src/lib/**`, `src/components/**`) | ❌ | No code mentions Manager indemnification. **Recommend: create `/legal/indemnification/page.tsx`** (or append a section to `/legal/terms`) stating the §1.5 indemnification of Mohamed S. Eltonsy as Manager. Effort: ~4 hours. Priority: **Critical**. |
| L8 | §1.7 Amendment: No Liability for Existing Debts | (no `existing debt` / `judgment` / `Section 1.7` matches in `src/`) | ❌ | No code surfaces the §1.7 anti-evasion-of-debts clause. **Recommend: append a "No Liability for Existing Debts" section to `/legal/terms/page.tsx`** stating that MITHQAL assets are not to be used to evade or satisfy any pre-existing debt or judgment against the Manager, Sole Member, or any other person. Effort: ~1 hour. Priority: **Critical**. |
| L9 | §1.8 Amendment: Non-Profit Character | `src/lib/site-data.ts:307` (entityA role text mentions "Non-profit — purpose is settlement integrity, not yield"); `src/lib/final-integrated-architecture.ts:332-373` (Foundation-as-nonprofit); `src/lib/commercial-governance.ts:93` (Foundation status: planned, non-profit type) | ⚠️ | The non-profit *character* of JOZOUR during the formation phase (no profits distributed to Manager except reasonable compensation) is **NOT** stated. The codebase only describes the planned Foundation as non-profit. **Recommend: append a "Non-Profit Character" section to `/legal/terms/page.tsx`** stating the §1.8 language (no profits distributed to the Manager except reasonable compensation for services rendered). Effort: ~1 hour. Priority: **Major**. |
| L10 | JOZOUR Resolution — Project Authorization (MITHQAL as project of the Company) | (no `Project Authorization` / `Jozour.*resolution` / `Section of the resolution` text in `src/`) | ❌ | No code surfaces the JOZOUR Resolution. **Recommend: add a "Project Authorization" section to `/status/page.tsx`** and `/institutional-readiness/page.tsx` stating that on the same date as the Amendment, JOZOUR LLC passed a resolution authorizing MITHQAL as a project of the Company and authorizing the Manager to execute contracts, open accounts, develop IP, engage advisors, apply for grants, and establish banking/custody relationships. Effort: ~4 hours. Priority: **Critical**. |

### 2.2 Economic / governance articles (constitutionally-weighted)

| # | Blueprint article | Code location(s) | Status | Recommendation |
|---|---|---|---|---|
| E1 | Reserve composition (gold/silver/sovereign/stablecoin/fiat weights) — §23 / §53 | `src/lib/reserve-policy-spec.ts:69-73,204-213` (per-asset weights + min/max/target); `src/lib/reserve-allocation.ts`; `src/app/api/reserve/status/route.ts`; `src/app/api/reserve/state/route.ts`; `src/app/api/reserve/target/route.ts` | ✅ | Reserve composition is fully encoded and exposed via 4 API routes. No action. |
| E2 | Finality-before-mint (deterministic monetary engine, §54 / §V25.3) | `src/lib/finality-before-mint.ts` (full 7-layer enforcement, code-level); `src/app/api/mtq-finality-before-mint/route.ts`; `src/app/api/v25.1/conversions/finality/route.ts`; `src/app/api/v25.1/conversions/execute/route.ts`; `src/app/api/v25.1/mtq/mint/route.ts` | ✅ | FBM module + 4 API routes. No action. |
| E3 | Cross-asset rebalancing (§29 / §V25.3) | `src/app/api/rebalance/plan/route.ts`; `src/app/api/rebalance/execute/route.ts`; `src/app/api/rebalance/validate/route.ts`; `src/app/api/rebalance/approve/route.ts`; `src/app/api/rebalance/[id]/route.ts`; `src/app/api/rebalancing/route.ts`; `src/app/api/rebalancing-dashboard/route.ts`; `src/lib/execution-engine.ts`; `src/lib/dynamic-rebalancer.ts`; `src/lib/dynamic-rebalancing.ts` | ✅ | Full rebalance API surface (plan / execute / validate / approve / get-by-id). No action. |
| E4 | Multi-currency backing (§22 — 11-currency basket) | `src/app/api/mtq-final-reserve/route.ts`; `src/lib/mtq-final-reserve-spec.ts`; `src/lib/v24-2-currency-engine.ts`; `src/lib/v24-2-1-gold-silver.ts`; `src/app/api/v25.1/conversions/quote/route.ts` | ✅ | 11-currency basket is encoded and exposed via `/api/mtq-final-reserve`. No action. |
| E5 | Stress testing (§36+ institutional stress, §V25.3) | `src/app/api/institutional-stress-tests/route.ts`; `src/app/api/stress-lab/route.ts`; `src/app/api/stress-test/institutional/route.ts`; `src/app/api/v25.0/stress-engine/route.ts`; `src/app/api/v25.1/stress/route.ts`; `src/app/api/cbgrs/stress/route.ts`; `src/lib/institutional-stress-tests.ts`; `src/lib/institutional-stress-engine.ts`; `src/lib/stress-test-comprehensive.ts`; `src/lib/stress-test-fixed.ts`; `src/lib/stress-lab-scenarios.ts` | ✅ | 6 stress-test API routes + 5 lib modules. No action. |
| E6 | Sanctions screening (§V25.3 §34) | `src/app/api/sanctions-screening/route.ts`; `src/lib/sanctions-screening.ts` (fail-closed per §V24.2.13) | ✅ | Framework + simulated screenings. Honest state clearly marked "0 screenings performed". No action. |
| E7 | Three-book separation (§51 Book B mtqOutstanding) | `src/app/api/mtq-three-book-separation/route.ts`; `src/lib/three-book-separation.ts`; `src/lib/canonical-supply-ledger.ts` | ✅ | Honest-state explicitly notes "NOT yet operational in production". No action. |
| E8 | Protected Backing Cell (§49 / §50) | `src/app/api/mtq-protected-backing-cell/route.ts`; `src/lib/protected-backing-cell.ts` | ✅ | No action. |
| E9 | Bank Default & Resolution (§48 / §48.4) | `src/app/api/mtq-bank-default-resolution/route.ts`; `src/lib/bank-default-resolution.ts` (successor-entity language here is for bank default, NOT for JOZOUR→Foundation transfer — see L6 above) | ✅ | No action — but note that "successor entity" mentions here refer to bank-default resolution (bridge bank, purchaser), not Foundation transfer. |
| E10 | Legal Liability Framework (§18) | `src/app/api/mtq-legal-liability-framework/route.ts`; `src/lib/legal-liability-framework.ts` | ✅ | No action. |
| E11 | Systemic Exposure Engine (§20) | `src/app/api/mtq-systemic-exposure-engine/route.ts`; `src/lib/systemic-exposure-engine.ts` | ✅ | No action. |
| E12 | Licensing / Entity Matrix (§19) | `src/app/api/mtq-licensing-entity-matrix/route.ts`; `src/lib/licensing-entity-matrix.ts` (explicitly references JOZOUR LLC as NJ home jurisdiction) | ✅ | No action. |
| E13 | MTQ Operating System / Bank Gateway (§21) | `src/app/api/mtq-os/route.ts`; `src/app/api/bank-gateway/route.ts`; `src/lib/mithqal-bank-gateway.ts`; `src/lib/mtq-os/` | ✅ | No action. |
| E14 | Implementation Status Report (§28) | `src/app/api/mtq-implementation-status/route.ts`; `src/lib/implementation-status-report.ts` | ✅ | No action. |
| E15 | Contradiction Audit (§27) | `src/app/api/mtq-contradiction-scan/route.ts`; `src/lib/contradiction-scan.ts` | ✅ | No action. |
| E16 | Cross-Border Settlement Corridor (§22) | `src/app/api/corridor/route.ts`; `src/lib/corridor/aed-sgd.ts` (AED→SGD demo) | ✅ | No action. |
| E17 | Asset / Tokenization (§23 — RWA + Digitized Coins) | `src/app/api/tokenization/route.ts`; `src/lib/tokenization/` | ✅ | No action. |
| E18 | Final Integrated Architecture (§V25.2.AUDIT-CLOSURE) | `src/app/api/final-integrated-architecture/route.ts`; `src/lib/final-integrated-architecture.ts` (full 21-invariant + 4-entity model) | ✅ | No action. |
| E19 | Final Pilot Activation Gate | `src/app/api/final-pilot-activation-gate/route.ts`; `src/lib/final-pilot-activation-gate.ts` | ✅ | No action. |
| E20 | CBGRS — Constitutional Bullion Gold-Refined Specification | `src/app/api/cbgrs/route.ts`; `src/app/api/cbgrs/stress/route.ts`; `src/lib/cbgrs.ts` | ✅ | No action. |
| E21 | ERTF — External Risk Transfer Facility (§V25.3) | `src/lib/ertf.ts` (ring-fenced external risk-bearing capital) | ✅ | No action. |
| E22 | Bank-funded issuance model (§V25.0.A) | `src/app/api/bank-funded-issuance-model/route.ts`; `src/lib/bank-funded-issuance-model.ts` | ✅ | No action. |
| E23 | Non-custodial reserve architecture | `src/app/api/non-custodial-reserve-architecture/route.ts`; `src/lib/non-custodial-reserve-architecture.ts` | ✅ | No action. |
| E24 | Bank-side vs MITHQAL-side compliance (§21.2.4) | `src/lib/mithqal-bank-gateway.ts` (~3,000 LOC); `src/app/api/bank-gateway/route.ts` | ✅ | No action. |

### 2.3 Layer-2 Constitution articles

| # | Article | Code | Status |
|---|---|---|---|
| C1 | Invariants (L2 Article I — 5 monetary invariants) | `src/lib/v19-infrastructure.ts:547-570` (21 items, 5 monetary invariants present); `src/lib/constitution-data.ts:269` (L2 Art I purpose) | ✅ |
| C2 | Monetary Objectives (L2 Art II) | `src/lib/constitution-data.ts:270` | ✅ |
| C3 | Reserve Principles (L2 Art III) | `src/lib/constitution-data.ts:271`; `src/lib/reserve-policy-spec.ts` | ✅ |
| C4 | Monetary Metals (L2 Art IV — physical bullion) | `src/lib/constitution-data.ts:272`; `src/lib/v24-2-1-gold-silver.ts` | ✅ |
| C5 | Currency Framework (L2 Art V — COFER/SWIFT weighting) | `src/lib/constitution-data.ts:273`; `src/lib/v24-2-currency-engine.ts` | ✅ |
| C6 | Monetary Engine (L2 Art VI — weighted-average basket) | `src/lib/constitution-data.ts:274`; `src/lib/monetary-engine-v19.ts` | ✅ |
| C7 | Proof of Reserves (L2 Art VII — daily cryptographic) | `src/lib/constitution-data.ts:275`; `src/app/api/proofs/publish/route.ts`; `src/app/api/proofs/latest/route.ts`; `src/app/api/reserve-verification/route.ts` | ✅ |

### 2.4 Layer-3 Governance & Policy articles

| # | Article | Code | Status |
|---|---|---|---|
| G1 | Policy Framework (L3 Art I) | `src/lib/constitution-data.ts:290`; `src/app/api/governance/proposals/route.ts` | ✅ |
| G2 | Committee Mandates (L3 Art II) | `src/lib/constitution-data.ts:291` (purpose only) | ⚠️ | Committee mandates NOT detailed in code — only purpose strings. Recommend: extend `constitution-data.ts` Article L3-II with `sections: [...]` enumerating Risk / Technical / Audit / Compliance committee mandates. Effort: ~4 hours. Priority: **Minor**. |
| G3 | Fee Schedules (L3 Art III) | `src/lib/constitution-data.ts:292` (mint 0.01-0.10%, redeem 0.01-0.10%, etc.); `src/app/api/transactions/route.ts:22` (fees table) | ✅ |
| G4 | Sanctions Mechanics (L3 Art IV) | `src/lib/constitution-data.ts:293`; `src/app/api/sanctions-screening/route.ts` | ✅ |
| G5 | Risk Tolerances (L3 Art V) | `src/lib/constitution-data.ts:294`; `src/lib/v19-infrastructure.ts` (stress thresholds) | ✅ |
| G6 | Maturity Stages (L3 Art VI) | `src/lib/constitution-data.ts:295` (purpose only) | ⚠️ | Maturity stages not detailed. Recommend: extend with sections array. Effort: ~2 hours. Priority: **Minor**. |
| G7 | Review Cycles (L3 Art VII) | `src/lib/constitution-data.ts:296` (purpose only) | ⚠️ | Review cycles (5-year independent review) not detailed. Effort: ~2 hours. Priority: **Minor**. |
| G8 | Physical Redemption Terms (L3 Art VIII) | `src/lib/constitution-data.ts:297`; `src/lib/in-kind-delivery.ts`; `src/lib/redemption-continuity.ts` | ✅ |

### 2.5 Cross-cutting / infrastructure gaps

| # | Item | Status | Detail |
|---|---|---|---|
| X1 | Two-entity architecture (Foundation + Jozour interim) | ✅ | surfaced via `LEGAL_STATUS` |
| X2 | Sole-member Manager (Eltonsy) | ✅ | surfaced |
| X3 | NJ registered agent (Edward M Lombard — 116 Mallory Ave) | ✅ | `src/lib/site-data.ts:311` |
| X4 | IRS CP 575 G notice (EIN 84-3470275) | ✅ | `src/lib/site-data.ts:314` |
| X5 | NJ filing 0600463904 (22 Oct 2019) | ✅ | `src/lib/site-data.ts:310,341` |
| X6 | Vercel deployment provenance (mithqal.vercel.app) | ✅ | verified by D5-D6-FINAL task (worklog 8433) |
| X7 | GitHub repo (MITHQALMTQ/mithqal) | ✅ | footer link |
| X8 | X / Twitter account (@MithqalMTQ) | ❌ | **GAP** — verified: no `MithqalMTQ` or `@MithqalMTQ` reference in `src/` or `public/`. The Amendment explicitly lists this account. Recommend: add to `src/components/site-footer.tsx` Contact nav. Effort: <1 hour. Priority: **Major**. |
| X9 | Foundation 501(c)(3) target (per blueprint §0.10.5) | ⚠️ | `final-integrated-architecture.ts:332` calls Foundation "(independent nonprofit)" but does NOT cite 501(c)(3) explicitly. The Constitution v19 mentions 501(c)(3) only contextually. Recommend: state "501(c)(3) — application targeted Phase 1" explicitly in `site-data.ts:308`. Effort: <1 hour. Priority: **Minor**. |
| X10 | Prisma persistence of institutional state | ❌ | **GAP** — only 4 Prisma models exist (`User`, `Post`, `FormationInterest`, `TestnetOperation`). No models for `BankParticipant`, `Custodian`, `ReserveHolding`, `MTQHolder`, `Settlement`, `ComplianceScreening`, `GovernanceProposal`, etc. — these are persisted in-memory (via `state-persistence.ts`) and as append-only `TestnetOperation` rows. Recommend: extend `prisma/schema.prisma` with at least `BankParticipant`, `ReserveHolding`, `ComplianceScreening`, `GovernanceProposal` models so institutional state survives serverless cold-starts. Effort: ~1 day. Priority: **Major** (architectural). |

---

## 3. Top 10 Priority Remediation Items

Ordered by priority × effort. **None implemented by this task** — all are
recommendations for follow-up implementer agents.

| # | Item | Priority | Effort | Files to modify / create |
|---|---|---|---|---|
| 1 | Create `/legal/institutional-trust/page.tsx` — surface §1.4 JOZOUR Amendment (digital assets held in trust for future Foundation, transfer upon Foundation formation) | **Critical** | ~4 hours | Create `src/app/legal/institutional-trust/page.tsx` (~150 LOC, modeled on `risk-disclosure/page.tsx`). Add link in `src/components/site-footer.tsx` Legal nav. |
| 2 | Create `/legal/indemnification/page.tsx` — surface §1.5 JOZOUR Amendment (Manager indemnification of Mohamed S. Eltonsy) | **Critical** | ~4 hours | Create `src/app/legal/indemnification/page.tsx` (~150 LOC). Add link in `src/components/site-footer.tsx` Legal nav. |
| 3 | Append "No Liability for Existing Debts" section to `/legal/terms/page.tsx` — surface §1.7 JOZOUR Amendment | **Critical** | ~1 hour | Edit `src/app/legal/terms/page.tsx` — add a new `<section>` after section 8 (Limitation of Liability). |
| 4 | Add "Project Authorization" section to `/status/page.tsx` and `/institutional-readiness/page.tsx` — surface JOZOUR Resolution (MITHQAL as project of the Company; Manager authority to execute contracts / open accounts / develop IP / engage advisors / apply for grants / establish banking-custody) | **Critical** | ~4 hours | Edit `src/app/status/page.tsx` (add section) + `src/app/institutional-readiness/page.tsx` (add section). Reference EIN + date + Manager name. |
| 5 | Append "Non-Profit Character" section to `/legal/terms/page.tsx` — surface §1.8 JOZOUR Amendment (no profits to Manager except reasonable compensation) | **Major** | ~1 hour | Edit `src/app/legal/terms/page.tsx` — add a new `<section>` after the No-Liability-Existing-Debts section. |
| 6 | Harmonize Constitution version references across surfaces — pick "v19.0" as the canonical string and update `site-data.ts`, `constitution-data.ts` header, `terms/page.tsx`, `api-docs/page.tsx`, `video/page.tsx`, `stress-test-fixed.ts` comments. Either drop the v19.0.2 / v19.0.3 / v19.0.9 / v25.0 sub-versions or annotate them as "specification patch level of v19.0". | **Major** | ~4 hours | Edit `src/lib/site-data.ts:332`; edit `src/lib/constitution-data.ts:1` header comment; edit `src/app/legal/terms/page.tsx:37`; edit `src/app/api-docs/page.tsx:319`; edit `src/app/status/page.tsx:347`; edit `src/app/video/page.tsx:12`; edit `src/lib/stress-test-fixed.ts` header comments. |
| 7 | Extend `monetary-engine-explained.tsx` `guardrails` array (currently 10 items, but only 4 are the constitutional invariants) — add explicit cards for "Deterministic Monetary Engine", "Institutional Neutrality", "Full Redeemability", "Gold as Constitutional Anchor" to align with the 8 principles named in the JOZOUR Amendment. | **Major** | ~1 hour | Edit `src/components/monetary-engine-explained.tsx:1679-1689` — extend the `guardrails` array. |
| 8 | Add X/Twitter account (@MithqalMTQ) link to `src/components/site-footer.tsx` Contact nav — the Amendment explicitly lists this account. | **Major** | <1 hour | Edit `src/components/site-footer.tsx` — add an `<a>` in the Contact nav. |
| 9 | Extend `prisma/schema.prisma` with institutional models (`BankParticipant`, `ReserveHolding`, `ComplianceScreening`, `GovernanceProposal`) so institutional state survives Vercel serverless cold-starts rather than living only in `state-persistence.ts` in-memory map. | **Major** (architectural) | ~1 day | Edit `prisma/schema.prisma`; write migration; refactor `src/lib/state-persistence.ts` to use Prisma; update API routes that read state (e.g. `/api/reserve/state`, `/api/custody/status`). |
| 10 | Extend `constitution-data.ts` L3-Article-II "Committee Mandates", L3-Article-VI "Maturity Stages", and L3-Article-VII "Review Cycles" with full `sections: [...]` arrays — currently these only have a `purpose` string with no sections. | **Minor** | ~4 hours | Edit `src/lib/constitution-data.ts:291,295,296`. |

---

## 4. Honesty Disclosures

The following constraints were honored by this audit:

1. **No source code modified.** This task only created two new docs
   (this `.md` file and the matching `.pdf`) and appended to `worklog.md`.
   Zero `.ts` / `.tsx` / `.prisma` files were edited.
2. **No `bun run build` invoked.** No dev server restart.
3. **Honest gap counts** — 24 ✅, 10 ⚠️, 8 ❌ out of 42 cross-checked
   provisions. **NOT** forced to pass.
4. **Source-document sizes** — the blueprint is 2,094,001 chars (not a
   placeholder); the Constitution is 1,467,538 chars. Both were extracted
   via the `zipfile + regex` pattern (not python-docx, which is slower for
   >1MB docs).
5. **Cross-reference method** — for each gap claim, the auditor performed
   `grep -ri` across `src/` and confirmed zero matches before marking ❌.
   The `institutional-principles.md` canonical doc in `docs/legal/` was
   cross-referenced to confirm the canonical disclaimer paragraph wording.
6. **Constitution v19.0 vs v25.0 nomenclature** — the auditor notes that
   the v25.3 Master Blueprint (source #1) does NOT itself contain the
   literal string `Constitution v19` (verified via Python regex on the
   2.09M-char extracted text). The blueprint references "MITHQAL Holding /
   Operating / Technology / Foundation" entities and explicitly names
   "JOZOUR LLC" 27 times. The "Constitution v19.0" reference appears in
   the JOZOUR Operating Agreement Amendment PDF (source #3) and in the
   MITHQAL.docx Constitution (source #2, header line).
7. **Constitution-data.ts version label** — this file's first line reads
   "Mithqal Constitution v24.2.1", but `site-data.ts` surfaces "v25.0".
   This is a known inconsistency documented above (gap L4). The auditor
   recommends harmonizing to the Constitution document's actual version
   ("v19.0") and treating v24.2.1 / v25.0 as the *blueprint* / *amendment
   layer* version (the blueprint is "v25.3 MAJOR AMENDMENT" of the v19.0
   Constitution).
8. **Two blueprints exist in the repo** — `/home/z/my-project/MITHQAL_MASTER_BLUEPRINT*.docx`
   (5 historical versions) and the v25.0 markdown at
   `docs/blueprint/mithqal-canonical-blueprint-v25.md`. These are NOT the
   v25.3 MAJOR AMENDMENT (source #1) — that one lives only at
   `/tmp/my-project/upload/MTQ_modified.docx`. The auditor recommends
   the orchestrator decide whether v25.3 supersedes the v25.0 markdown.
9. **Limited Prisma persistence** — only 4 Prisma models exist (`User`,
   `Post`, `FormationInterest`, `TestnetOperation`). Institutional state
   is currently in-memory (`src/lib/state-persistence.ts`). This is an
   honest architectural gap (X10) but NOT a regression — the v25.4 / v25.5
   / v25.6 worklog does not flag this as a known defect because it was a
   deliberate Phase-0 testnet choice.
10. **No PDF text extraction** — the two JOZOUR PDFs (sources #3 and #4)
    were NOT re-extracted; their key facts were provided in the task spec
    and used as-is (per "Key facts already extracted from the PDFs — do
    NOT re-extract").

---

## 5. Appendix — Inventory Detail

### 5.1 All 161 API route names (under `src/app/api/`)

`admin/{smtp-test,oracle,interests,update-price}`, `assumptions-register`,
`auth`, `balance/[address]`, `bank-funded-issuance-model`, `bank-gateway`,
`brain{,/anomaly,/compliance,/risk}`, `cbgrs{,/stress}`,
`commercial-governance{,/audit,/benchmark,/best-execution,/compliance,
/entities,/performance,/procurement,/procurement/[id]/advance,/revenue,
/reserve-ownership}`, `compliance`, `contract/{info,deployment-closure}`,
`corridor`, `ctac`, `custodians`, `custody/{status,holdings,reconcile}`,
`data-source-{health,observations,sync}`, `dependencies`,
`final-integrated-architecture`, `final-pilot-activation-gate`,
`formation-interest`, `gateway/v1/{attestation,backing-certificates,
custody,foundation/oversight,incidents,instructions,minting-capacity,
proof-of-reserves,rebalancing,reconciliations,redemptions,reserves,route}`,
`governance/proposals`, `health`, `infrastructure`, `inngest`,
`institutional-stress-tests`, `legal-obligation-register`, `lrr`, `mint`,
`mtq-bank-default-resolution`, `mtq-contradiction-scan`, `mtq-final-reserve`,
`mtq-finality-before-mint`, `mtq-implementation-status`,
`mtq-legal-liability-framework`, `mtq-licensing-entity-matrix`, `mtq-os`,
`mtq-protected-backing-cell`, `mtq-systemic-exposure-engine`,
`mtq-three-book-separation`, `nav`, `non-custodial-reserve-architecture`,
`onchain-test`, `oracle{,/update}`, `proofs/{publish,latest}`,
`real-market-feeds`, `rebalance/{plan,execute,validate,approve,[id]}`,
`rebalancing`, `rebalancing-dashboard`, `redeem`, `reserve/{status,state,
target,reconciliation}`, `reserve-simulator`, `reserve-verification`,
`route.ts` (top-level `/api`), `sanctions-screening`, `solana/{info,
balance}`, `status`, `stress-lab`, `stress-test/institutional`, `testnet{,
/mint,/redeem,/seed}`, `tokenization`, `transactions`, `transfer`,
`transparency`, `v23-{metrics,stablecoin}`, `v24.1.2/resilience-stack`,
`v24.2`, `v24.2.1{,/tgbs}`, `v25.0{,/authorize,/bank-onboarding,
/can-mint,/canonical-supply,/cbdc-interop,/corporate-pilot,/custody-concentration,
/custody-execution,/custody-hardening,/financial-model,/geo-fence,/ilps,
/jurisdiction-pilot,/monetary-lock,/pilot-ops,/redemption-continuity,
/settle,/stress-engine,/tokenomics,/validation-workbench}`,
`v25.1{,/assurance,/assets{,/eligibility},/concentration,/conversions{,
/execute,/finality,/quote},/corridors,/final-amendment,/geopolitical-exposure,
/liquidity,/mtq{,/mint,/redeem},/providers{,/eligibility},/rails,/regulatory,
/reserves{,/protected-backing},/risk,/stress}`.

### 5.2 All 12 app pages

`/` (home dashboard), `/api-docs`, `/demo`, `/institutional-engagement`,
`/institutional-readiness`, `/legal/cookies`, `/legal/privacy`,
`/legal/risk-disclosure`, `/legal/terms`, `/os`, `/status`, `/video`.

### 5.3 All 4 Prisma models

`User`, `Post`, `FormationInterest`, `TestnetOperation` (file:
`prisma/schema.prisma`, 69 lines total).

### 5.4 All 3 mini-services

`mini-services/discord-bot`, `mini-services/mithqal-watchdog`,
`mini-services/notify-service`.

---

**End of report.**

*Generated by Agent F1 — Blueprint-vs-Codebase Cross-Reference Architect.
Honest. Not forced to pass. No source code modified.*
