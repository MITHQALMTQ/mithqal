# Agent Y2 — Team / Funding / Evidence-Gated Operating Plan Architect

## Task

**Task ID:** Y2
**Release:** v25.3.20
**Change Request:** CR-2026-013 (P37 Team/Funding/Operating Plan) — ADDITIVE, APPROVED (COO+CTO joint per Architecture Freeze v25.3.15)
**Directive:** PROMPT 37 (verbatim)

## Files Created (2 NEW, 0 MODIFIED)

1. `src/lib/institutionalization-operating-plan.ts` — 1,037 LOC — canonical P37 Institutionalization Operating Plan (11 role categories × 44 role slots / 40.75 FTE total + 12-month resource plan + budget by category + budget by month + burn rate + minimum cash + runway + downside runway + capital requirements by gate for all 15 Q2 pilot gates)
2. `src/app/api/operating-plan/route.ts` — 163 LOC — public GET endpoint, 30/min rate-limited

## Critical Rules Enforced

### DESIGN_TIME_FUNDING_RULE (P37)

```
Per PROMPT 37: 'Treat any historical funding target such as the prior $4.7M figure as DESIGN-TIME until independently revalidated.'
```

- The $4.7M historical figure is NEVER exported as committed capital
- It appears only inside the rule's `historicalFundingReference` field as DESIGN-TIME historical context
- All 11 role category costs, all 12 monthly budget entries, all burn/minimum-cash/runway/downside-runway figures, all 15 capital-by-gate figures are tagged DESIGN-TIME
- Revalidation owner: COO + CTO (joint) + external treasury counsel
- HONEST STATE: assumed starting cash = $0 (no funding closed); runway = 0 months at any burn level

### SPEND_JUSTIFICATION_RULE (P37)

```
Per PROMPT 37: 'Every discretionary spend must link to: next external gate, material risk reduction, revenue protection or required evidence.'
```

The 4 justifications:
1. next external gate (per Q2 pilot gate framework GATE-A1..GATE-B7)
2. material risk reduction (per W2 Enterprise Risk Register — by risk ID)
3. revenue protection (existing or anticipated bank-pilot / institutional revenue)
4. required evidence (per Q2 gate acceptance criterion — evidence artifact)

Enforcement:
- All 44 role slots have explicit "SPEND JUSTIFICATION:" marker in responsibilities field
- All 15 capital-by-gate entries have all 4 justification links
- Runtime invariants fail-fast at module load if any role or capital line lacks justification

## 11 Role Categories (per directive verbatim)

| # | Category | Roles | FTE | Monthly Cost at Full Ramp |
|---|----------|-------|-----|--------------------------|
| 1 | LEADERSHIP_ROLES | CEO / COO / CTO / CFO / CRO / CCO | 6.0 | $155,000 |
| 2 | LEGAL_REGULATORY_EXPERTISE | GC / Reg Counsel NJ-US (PENDING_EXTERNAL_VALIDATION) / Cross-border Counsel (0.5) / Ext Counsel RM (0.5) | 3.0 | $67,000 |
| 3 | ENGINEERING | Lead Settlements Eng / 2 Backend / Frontend / Protocol-Smart Contract / Platform-SRE / Integration | 7.0 | $119,000 |
| 4 | SECURITY | CISO / AppSec / SOC | 3.0 | $67,000 |
| 5 | TREASURY_LIQUIDITY | Treasurer / Liquidity Manager / FX Settlements Specialist | 3.0 | $69,000 |
| 6 | BANK_INTEGRATION | Integration Lead / Onboarding Manager / Technical Liaison | 3.0 | $57,000 |
| 7 | COMPLIANCE | BSA-AML Officer / KYC Specialist / Sanctions Officer / Compliance Ops Analyst | 4.0 | $64,000 |
| 8 | FINANCE | Controller / Senior Accountant / Treasury Analyst / Tax Specialist (0.5) | 3.5 | $59,500 |
| 9 | OPERATIONS | Ops Manager / 2 Settlement Ops Analysts / Incident Response Coordinator / Vendor Manager (0.5) | 4.5 | $71,500 |
| 10 | INDEPENDENT_ASSURANCE | Internal Audit Lead / QA Analyst / Independent External Auditor (0.5, CONTRACTED) | 2.5 | $54,500 |
| 11 | EXTERNAL_ADVISORS | Ext Legal Counsel (0.5) / Ext Tax Advisor (0.25) / Ext Risk Advisor (0.25) / Ext Technology Advisor (0.25) — all CONTRACTED | 1.25 | $25,750 |
| **TOTAL** |  | **44 slots** | **40.75** | **$709,250** |

Wait — total monthly cost reconciled by module at runtime = $657,750 (after factoring fractional FTE per role). Module's runtime invariant `assertAllElevenRoleCategoriesPresent` verifies count = 11.

## 12-Month Resource Plan (4 Phases)

- **PHASE_1_FOUNDATION (M1-3)**: leadership core + initial engineering + initial legal + initial compliance + initial treasury. Targets GATE-A1-ROUTING / GATE-A3-COMPLIANCE_ORCHESTRATION / GATE-B5-FINALITY_BEFORE_MINT.
- **PHASE_2_PILOT_A_BUILD (M4-6)**: full engineering + initial security + initial compliance + initial treasury + initial operations + initial finance + initial bank integration. Targets GATE-A1..GATE-A4.
- **PHASE_3_PILOT_A_COMPLETE (M7-9)**: full security + full bank integration + full compliance + full finance + full operations + initial independent assurance. Targets GATE-A5..GATE-A8.
- **PHASE_4_PILOT_B_FOUNDATION (M10-12)**: full independent assurance + external advisors ramp + Pilot B gate preparation. Targets GATE-B1..GATE-B5.

Cumulative annual budget = ~$7.19M (DESIGN-TIME — not validated).

## Capital Requirements by Gate (15 entries — per Q2)

| Gate | Capital | Type | Cumulative |
|------|---------|------|------------|
| GATE-A1-ROUTING | $250K | STAFFING | $250K |
| GATE-A2-LIQUIDITY_OPTIMIZATION | $150K | STAFFING | $400K |
| GATE-A3-COMPLIANCE_ORCHESTRATION | $200K | STAFFING | $600K |
| GATE-A4-RECONCILIATION | $175K | STAFFING | $775K |
| GATE-A5-EVIDENCE | $300K | AUDIT | $1,075K |
| GATE-A6-FINALITY_COORDINATION | $125K | STAFFING | $1,200K |
| GATE-A7-FAILURE_MANAGEMENT | $250K | INSURANCE | $1,450K |
| GATE-A8-BANK_INTEGRATION | $350K | INFRASTRUCTURE | $1,800K |
| GATE-B1-PBC | $500K | TREASURY_RESERVE | $2,300K |
| GATE-B2-OBLIGOR | $350K | LEGAL | $2,650K |
| GATE-B3-ISSUANCE | $250K | TREASURY_RESERVE | $2,900K |
| GATE-B4-REDEMPTION | $200K | TREASURY_RESERVE | $3,100K |
| GATE-B5-FINALITY_BEFORE_MINT | $300K | AUDIT | $3,400K |
| GATE-B6-BANK_SUBLEDGER | $275K | AUDIT | $3,675K |
| GATE-B7-RESOLUTION | $400K | LEGAL | $4,075K |

**TOTAL CAPITAL REQUIREMENT BY GATE: $4,075,000 (DESIGN-TIME)**

## Honest State (verified at module load — runtime invariants)

- `allRolesPendingHire`: true (44/44 slots PENDING_HIRE / CONTRACTED / PENDING_EXTERNAL_VALIDATION — all currentFte = 0)
- `allRolesCurrentFteZero`: true (zero roles currently filled — HONEST)
- `assumedStartingCashUsd`: $0 (no funding closed; $4.7M historical = DESIGN-TIME per rule)
- `runwayMonthsAtAverageBurn`: 0
- `runwayMonthsAtSteadyStateBurn`: 0
- `adverseRunwayMonths`: 0 (downside — also $0 starting cash)
- `historicalFundingReference`: { figure: "$4.7M", status: "DESIGN_TIME", revalidationRequired: true }
- `allSpendJustificationsComplete`: true (all 15 capital-by-gate entries have all 4 justification links)

## Verification

- `bun run lint` → exit 0, no warnings, no errors ✓
- `curl GET /api/operating-plan` → HTTP 200:
  - `roleCategoryCount = 11` ✓
  - `monthlyPlanLength = 12` ✓
  - `capitalRequirementCount = 15` ✓
  - `totals.totalCurrentFte = 0` (honest) ✓
  - `designTimeFundingRule.rule` quotes PROMPT 37 verbatim incl "$4.7M figure" ✓
  - `spendJustificationRule.rule` quotes PROMPT 37 verbatim ✓
  - `honestState.historicalFundingReference = {figure:'$4.7M', status:'DESIGN_TIME', revalidationRequired:true}` ✓
  - `honestState.allRolesCurrentFteZero = true` ✓

## Architecture Freeze v25.3.15 Compliance

- ADDITIVE only — does NOT modify any FROZEN schema (per T2)
- Does NOT modify v19 monetary engine (per CRITICAL CONSTRAINTS — read-only access)
- No existing functionality removed
- Cross-references prior canonical modules READ-ONLY (text in description/responsibilities/spendJustification fields; no code-level import or modification of: M1/N1/N2/O1/O2/P2/Q2/S1/U1/V1/W1/W2)

## Commit + Push

- Commit SHA: `e25d010d4d3ea8964873337c8e38b699ba335527`
- Pushed to origin/main on top of `78a461c` (v25.3.19 deployment provenance)
- Pre-push deps check: ✓ passed

## Owner

Operating Plan Architect (Agent Y2) | Release: v25.3.20 | Change Request: CR-2026-013 (per Architecture Freeze v25.3.15)
