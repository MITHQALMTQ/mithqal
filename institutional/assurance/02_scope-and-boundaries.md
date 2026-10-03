# Scope and Boundaries — 23 In-Scope Domains

> RECONSTRUCTED_FROM_EVIDENCE (Prompt 75 remediation) — this file was re-created from the Prompt 70 specification. It is NOT labeled as 'preserved.' Original was never committed to git.

**NOT PRODUCTION-AUTHORIZED** — BUILD_MODE = FROZEN — PROGRAM_PHASE = EXTERNAL_EXECUTION — NEXT_EXTERNAL_EVIDENCE = G0_PASS

---

## 1. Scope Identity

| Field | Value |
|---|---|
| **Scope ID** | `SCOPE-PA-001` |
| **Charter reference** | `AC-PA-001` (see `01_assurance-charter.md`) |
| **Scope state** | `DESIGNED` |
| **In-scope domain count** | 23 |
| **Out-of-scope item count** | 15 |
| **All domains at state** | `DESIGNED` — none executed |

## 2. 23 In-Scope Domains (each with IN_SCOPE / OUT_OF_SCOPE / DEPENDENCY / OWNER / EVIDENCE_REQUIRED)

> For each domain, the four tags are recorded. "DEPENDENCY" indicates an external dependency required for evidence. "OWNER" indicates the role that owns the evidence. "EVIDENCE_REQUIRED" lists what evidence would be required if execution were authorized.

| # | Domain | IN_SCOPE | OUT_OF_SCOPE | DEPENDENCY | OWNER | EVIDENCE_REQUIRED |
|---|---|---|---|---|---|---|
| 1 | Policy registry & versioning | YES | NO | `policy-registry.ts` (MISSING — Prompt 74 LD-05) | ENGINEERING | Policy version history; pre-activation status record |
| 2 | Authorization & transaction lifecycle | YES | NO | Authorization frozen schema (MISSING) | ENGINEERING | Authorization event log; outcome state per scenario |
| 3 | Finality (F0 authorization / F1 ledger / F2 reconciliation / F3 / F4 / F5 settlement) | YES | NO | `canonical-finality-model.ts` (MISSING — LD-04); legal opinion for F5 | ENGINEERING + LEGAL | Finality state transitions; ledger immutability evidence; reconciliation evidence |
| 4 | Reconciliation & exception handling | YES | NO | Reconciliation engine | ENGINEERING | Recon run logs; exception closeout records |
| 5 | Settlement workflow | YES | NO | `settlement-workflow-canonical.ts` (MISSING — LD-03) | ENGINEERING | Workflow step transitions; counterparty confirmations |
| 6 | Reserve domains | YES | NO | `reserve-domains.ts` (MISSING — LD-06) | ENGINEERING | Reserve allocation records; reserve state transitions |
| 7 | Settlement obligation registry | YES | NO | `institutional-settlement-obligation-registry.ts` (MISSING — LD-07) | ENGINEERING + LEGAL | Obligation creation, modification, discharge records |
| 8 | Pilot gate framework | YES | NO | `pilot-gate-framework.ts` (MISSING — LD-08) | ENGINEERING + PROGRAM_MGMT | Gate passage records; gate-fail records |
| 9 | MTQ economics | YES (control plane test only) | YES (MTQ DISABLED; F3/F4 NOT_CLAIMED — no MTQ economic output may be endorsed) | `mtq-economic-definition.ts` (MISSING — LD-09) | ENGINEERING | MTQ-disabled control plane test result |
| 10 | Architecture freeze | YES | NO | `controlled-architecture-freeze.ts` (MISSING — LD-01) | ENGINEERING | Architecture-freeze inventory; modification log |
| 11 | Evidence fabric (EvidencePackage schema) | YES | NO | `institutional-evidence-fabric.ts` (MISSING — LD-02) | ENGINEERING | Evidence record per 13-type taxonomy |
| 12 | Final pilot activation gate | YES | NO | `final-pilot-activation-gate.ts` (PRESENT — only one of 10 frozen schemas that exists) | ENGINEERING | Activation gate passage record |
| 13 | Security (18 areas) | YES | NO | Security review board | SECURITY | Security test results per `14_security-assurance.md` |
| 14 | Change management (11-stage lifecycle) | YES | NO | Change advisory board | ENGINEERING | Change records; unauthorized-change inspections |
| 15 | Failure scenarios (15 mandatory) | YES | NO | Failure test lab | ENGINEERING | Failure scenario test results per `16_failure-assurance.md` |
| 16 | Safe halt (7 verification fields) | YES | NO | Operations | ENGINEERING + OPS | Safe-halt trigger records; verification results |
| 17 | Liquidity measurement | YES | NO | Treasury; observed market data | TREASURY | Liquidity measurement records; reconciliation evidence |
| 18 | KPI population (15 KPIs per Prompt 69) | YES | NO | KPI engine; independent recalculation | ANALYTICS | KPI records (0/15 baselines populated) |
| 19 | ROI / Bank Value Measurement Engine | YES | NO | Observed execution data | ANALYTICS | ROI verification; 12×6=72 cell matrix (all cells UNKNOWN) |
| 20 | Bank validation (attendance ≠ validation) | YES | NO | Bank engagement (0 banks) | PROGRAM_MGMT | Bank attendance record; bank validation record |
| 21 | Replay & reproducibility | YES | NO | Replay tool | ENGINEERING | Replay outputs (MATCH / MISMATCH / INSUFFICIENT_EVIDENCE) |
| 22 | Sampling methodology | YES | NO | Sampling plan | ANALYTICS | Sampling records per `assurance-sampling-plan.md` |
| 23 | Findings, management response, remediation, retest | YES | NO | Independent reviewer (0 retained) | REVIEWER | Findings register; response register; remediation record; retest record |

## 3. 15 Explicit Out-of-Scope Items

1. **MTQ-economic output endorsement** — MTQ is DISABLED; F3/F4 NOT_CLAIMED; no MTQ economic output may be endorsed by this framework.
2. **Bank solvency opinion** — 0 banks attended; framework does not opine on bank solvency.
3. **Counsel legal opinion** — 0 counsel engaged; framework does not opine on legal matters beyond stating legal dependencies for F5 finality.
4. **Regulatory approval** — 0 regulators engaged; framework does not opine on regulatory compliance.
5. **Price discovery** — framework does not opine on the price of any asset.
6. **Capital adequacy** — framework does not opine on capital adequacy of any party.
7. **Liquidity provision guarantee** — framework does not guarantee that liquidity will be provided.
8. **Counterparty intent** — framework does not opine on whether any counterparty "intends" to engage.
9. **Marketing claims validation** — framework does not validate marketing claims; it only validates that claims are NOT made without evidence.
10. **Architecture change authorization** — BUILD_MODE = FROZEN; framework does not authorize architecture changes.
11. **Pilot outcome endorsement** — 0 pilots executed; framework does not endorse any pilot outcome.
12. **Endorsement of any vendor** — framework does not endorse any vendor, tool, or service provider.
13. **Endorsement of any counsel** — framework does not endorse any counsel.
14. **Endorsement of any bank** — framework does not endorse any bank.
15. **Endorsement of any second institution** — framework does not endorse any second institution beyond what is independently evidenced.

## 4. Three-Layer Scope Allocation

| Layer | Scope allocated | Status |
|---|---|---|
| **L1 — Design Assurance** | All 23 domains at design state | `DESIGNED` (this room) |
| **L2 — Operational Assurance** | All 23 domains awaiting operational evidence | `NOT_STARTED` |
| **L3 — Outcome Assurance** | All 23 domains awaiting outcome evidence | `NOT_STARTED` |

## 5. Document-Drift Boundary

The framework tracks **document drift** explicitly. Any change in a frozen schema (e.g., `institutional-evidence-fabric.ts`), or any change in a policy, contract, or process documented elsewhere, must be recorded in `29_open-issues.md` under the document-drift audit section.

The framework's rule: **if the system under review has drifted from the documentation, the reviewer must report the drift as a finding — not silently adjust the framework to match.**

## 6. Repository-Boundary Boundary

The framework's review boundary is the **repository as committed to git at the time of engagement**. The reviewer must NOT:
- Pull in uncommitted files (e.g., from a prior session that was never committed — see Prompt 74 finding LD-10 for the 42 lost assurance files).
- Pull in dangling commits.
- Pull in unstaged changes.
- Treat node_modules or .env contents as authoritative (both are environment-specific).

The reviewer MUST:
- Use the immutable baseline snapshot at `institutional/audit/prompt-74/baseline/` as the forensic starting point.
- Treat any artifact marked `RECONSTRUCTED_FROM_EVIDENCE` as a reconstruction — not a preserved original.
- Treat any artifact marked `MISSING` in `04_loss-and-deletion-report.json` as not present, and require explicit remediation before relying on it.

## 7. Honest-State Markers

- 0 findings issued.
- 0 evidence collected.
- 0 controls executed.
- All 23 domains at state `DESIGNED`.
- MTQ DISABLED; F3/F4 NOT_CLAIMED.
- 0 banks; 0 counsel; 0 pilot execution.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PROGRAM_PHASE = EXTERNAL_EXECUTION. NEXT_EXTERNAL_EVIDENCE = G0_PASS. Honest-state preserved. ZERO frozen schemas modified. ZERO MTQ economics modified. ZERO new architecture added. No outcome manufactured. No external evidence fabricated.
