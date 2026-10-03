# REMEDIATION PLAN — MITHQAL PROMPTS 1–73 FORENSIC AUDIT (v25.3.2 — PROMPT 74, Sections AI + AK)

> **NOT PRODUCTION-AUTHORIZED.** This is a REMEDIATION RECOMMENDATION.
> **No remediation has been performed.** Per Section AK (No-Silent-
> Repair Rule): "If something is missing or incorrect: DO NOT silently
> fix it during the audit." Per Section AW: "Do NOT automatically
> execute remediation."
>
> **This plan requires explicit human-owner approval before execution.**

## 1. Remediation Status

```
REMEDIATION_STARTED = false
APPROVAL_REQUIRED = true
APPROVAL_GRANTED = false
```

## 2. Remediation Items (ordered by priority)

### P0_CRITICAL — requires immediate attention after approval

#### REM-01: Recover/Re-create 9 Missing Frozen Schemas

| Field | Value |
|---|---|
| `before_state` | 9 of 10 frozen schemas ABSENT (controlled-architecture-freeze.ts, institutional-evidence-fabric.ts, settlement-workflow-canonical.ts, canonical-finality-model.ts, policy-registry.ts, reserve-domains.ts, institutional-settlement-obligation-registry.ts, pilot-gate-framework.ts, mtq-economic-definition.ts) |
| `after_intended_state` | Either (a) re-create the 9 files from prior session conversation context as NEW artifacts (creation date = remediation date), OR (b) correct the institutional record (Prompts 70-73) to reference actual similar-named files IF those files are verified to implement the same concepts |
| `evidence` | `04_loss-and-deletion-report.json` LD-01 through LD-09; `25_recovery-plan.json` RC-01 through RC-09 |
| `approval_required` | true |
| `recovery_path` | re-create from prior session conversation context (the prior session's Write tool calls contain the full file content) OR verify equivalence of similar-named files (finality-before-mint.ts, legal-obligation-register.ts, reserve-policy-spec.ts, pilot-operational-readiness.ts, mtq-final-reserve-spec.ts) |
| `risk_if_not_done` | Prompts 70-73 architectural claims about "10 frozen schemas" remain unverifiable; invariant audit I07/I09/I15/I16 remain UNKNOWN |

#### REM-02: Recover/Re-create Prompt 70 Assurance Framework (42 files)

| Field | Value |
|---|---|
| `before_state` | /institutional/assurance/ (42 files) ABSENT — never committed to git |
| `after_intended_state` | /institutional/assurance/ with 42 files present, committed, and internally consistent |
| `evidence` | `04_loss-and-deletion-report.json` LD-10; `25_recovery-plan.json` RC-10 |
| `approval_required` | true |
| `recovery_path` | re-create from prior session conversation context (the prior session's Write tool calls contain the full content of all 42 files: 00_README, 01_assurance-charter, 02_scope-and-boundaries, 03_assurance-criteria, 04_control-objectives, 05_control-library, 06-29 domain files, assurance-control-matrix, assurance-test-register, assurance-evidence-schema, etc.) |
| `risk_if_not_done` | execution control tower (Prompt 73) has dangling references to non-existent assurance framework; independent assurance workstream (WS5) cannot proceed |

#### REM-03: Recover/Re-create Prompts 62–69 Institutional Directories (14+ files)

| Field | Value |
|---|---|
| `before_state` | /institutional/{g1,corridors,banks,legal,bank-workshop,pilot}/ ALL ABSENT — never committed |
| `after_intended_state` | 6 directories with 14+ files present, committed, and internally consistent |
| `evidence` | `04_loss-and-deletion-report.json` LD-11 through LD-16; `25_recovery-plan.json` RC-11 through RC-16 |
| `approval_required` | true |
| `recovery_path` | re-create from prior session conversation context (the prior session's Write tool calls contain the full content) |
| `risk_if_not_done` | Prompts 72-73 have dangling references to these directories; the institutional baseline (G0/G1/corridor/bank/counsel/executive/workshop/term-sheet) is absent |

### P1_HIGH — requires attention after P0 items

#### REM-04: Re-provision .env from .env.example

| Field | Value |
|---|---|
| `before_state` | .env has 1 line (51 of 52 expected vars MISSING) |
| `after_intended_state` | .env has 52 lines with all credentials provisioned |
| `evidence` | `24_critical-gap-register.json` GAP-04; `baseline/configuration-state.json` |
| `approval_required` | true (operator must supply actual secrets) |
| `recovery_path` | copy .env.example to .env; fill in actual secret values (TURSO_DATABASE_URL, NEON_DATABASE_URL, AWS credentials, API keys, CRON_SECRET, NEXTAUTH_SECRET, Discord webhook, etc.) |
| `risk_if_not_done` | no runtime can be verified; all integrations (Turso, Neon, Inngest, Brain, Vercel) remain CONFIGURED but NOT VERIFIED |

#### REM-05: Install node_modules

| Field | Value |
|---|---|
| `before_state` | node_modules/ absent; bun run lint fails (exit 127) |
| `after_intended_state` | node_modules/ present; bun run lint exit 0 |
| `evidence` | `24_critical-gap-register.json` GAP-05 |
| `approval_required` | true |
| `recovery_path` | run `bun install` |
| `risk_if_not_done` | no dev server; no lint; no runtime testing |

### P2_MEDIUM — requires attention after P1 items

#### REM-06: Address prisma/migrations/ absence

| Field | Value |
|---|---|
| `before_state` | prisma/migrations/ does not exist; schema via db:push |
| `after_intended_state` | either (a) generate migrations via prisma migrate dev, OR (b) document db:push as the chosen schema method |
| `evidence` | `24_critical-gap-register.json` GAP-06 |
| `approval_required` | true |
| `recovery_path` | decide: migration-based (prisma migrate dev) or push-based (db:push — current); document the choice |
| `risk_if_not_done` | migration history not available for audit; migration reproducibility not verifiable |

#### REM-07: Resolve version drift (v25.3.2 claimed vs v25.6 tagged)

| Field | Value |
|---|---|
| `before_state` | v25.3.2 CLAIMED in Prompts 70-73 but no tag; latest tag v25.6 |
| `after_intended_state` | either (a) tag current commit as v25.3.2 if it represents that baseline, OR (b) correct Prompts 70-73 references to v25.6 |
| `evidence` | `05_version-authority-audit.json`; `24_critical-gap-register.json` GAP-07 |
| `approval_required` | true |
| `recovery_path` | decide: tag v25.3.2 OR correct references to v25.6 |
| `risk_if_not_done` | version drift between claimed (v25.3.2) and actual (v25.6); documents reference stale version |

## 3. No-Silent-Repair Rule (Section AK — enforced)

> "If something is missing or incorrect: DO NOT silently fix it during
> the audit."

This remediation plan does NOT:
- re-create the 9 missing frozen schemas
- restore the Prompt 70 assurance framework
- restore the Prompts 62-69 institutional directories
- re-provision .env
- run bun install
- generate migrations
- tag or correct version references

All items are `REMEDIATION_REQUIRED` with `approval_required = true`.
Any execution requires explicit human-owner approval in a separate
remediation change.

## 4. Main-Branch Protection (Section AL — enforced)

During remediation (when approved):
- DO NOT push directly to main without review
- DO NOT rewrite history
- DO NOT delete branches or tags
- DO NOT force-push
- DO NOT squash historical implementation commits
- DO NOT remove stale material

All remediation should occur on a dedicated remediation branch
(e.g., `remediation/prompt-74-findings`) and be merged via pull request
after review.

## 5. Architecture Change Allowed? (Section AU)

```
ARCHITECTURE_CHANGE_ALLOWED = NO
```

unless the remediation process identifies a justified change per
Section R (no-more-build rule: 7 external-evidence triggers). None of
the 7 triggers has occurred. The remediation is RECOVERY of lost
artifacts, NOT architecture change.

## 6. Approval Gate

This remediation plan is **PROPOSED, NOT APPROVED**. The human owner
(`JOZOUR_LLC_NJ` principal) must:
1. Review this forensic audit (`27_final-forensic-report.md` +
   `prompt-1-73-forensic-status.json`)
2. Review this remediation plan
3. Approve specific remediation items (REM-01 through REM-07)
4. Authorize a separate remediation change on a dedicated branch
5. Review the remediation before merge

**No remediation will be executed until this approval is granted.**

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. Remediation proposed
but NOT started. The truth has been established; the next step is
human-owner review and approval.
