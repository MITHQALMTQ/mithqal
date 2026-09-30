# Agent U2 — Protected Backing Cell Legal Enforceability Architect

## Task
- **Task ID**: U2
- **PROMPT**: 26
- **Title**: Protected Backing Cell (PBC) Legal Enforceability
- **Change Request**: CR-2026-002 (per Architecture Freeze v25.3.15)
- **Impact Analysis**: ADDITIVE — new module, does NOT modify frozen RESERVE_SCHEMA
- **Review**: APPROVED (COO + CTO joint approval)
- **Version**: v25.3.16
- **Test**: Required
- **Evidence**: Required

## User directive (verbatim)
> Strengthen the Protected Backing Cell model from an engineering construct
> into an evidence-gated institutional control. For every PBC define: legal
> owner, obligor, custody arrangement, account control, segregation,
> pledge/perfection status, encumbrance, reuse prohibition, bankruptcy
> treatment, insolvency priority, valuation, liquidity accessibility,
> jurisdiction, governing law and evidence artifact. MITHQAL verification
> must NEVER imply ownership, legal perfection or bankruptcy remoteness.
> A PBC may count as AvailableBacking only when the required legal and
> operational evidence exists. Add explicit failure states:
> LEGAL_CONTROL_UNPROVEN, ENCUMBERED, REUSED, CUSTODY_UNPROVEN,
> BANKRUPTCY_TREATMENT_UNKNOWN, LIQUIDITY_UNAVAILABLE.

## Files delivered
1. `src/lib/pbc-legal-enforceability.ts` (canonical source — single source of truth)
   - 14 fields per directive:
     1. legalOwner (DIRECT | TRUSTEE | CUSTODIAN_AS_AGENT | PENDING_LEGAL_VERIFICATION)
     2. obligor (REDEMPTION_OBLIGOR / COLLATERAL_OBLIGOR + verification)
     3. custodyArrangement (SEGREGATED_ACCOUNT | TRUST_ACCOUNT | ESCROW | TRI_PARTY | BANK_CUSTODY | PENDING)
     4. accountControl (OPERATIONAL_CONTROL | LEGAL_CONTROL | JOINT_CONTROL | PENDING)
     5. segregation (PHYSICAL | ACCOUNT_LEVEL | LEGAL | PENDING)
     6. pledgePerfectionStatus (POSSESSION | FILING | CONTROL | NONE | NOT_REQUIRED)
     7. encumbrance (PLEDGE | LIEN | RESTRAINT | NONE)
     8. reuseProhibition (CONTRACTUAL | REGULATORY | BOTH | NONE | PENDING)
     9. bankruptcyTreatment (SEGREGATED | PARI_PASSU | SUBORDINATED | SUPERSEDED | PENDING | UNKNOWN)
     10. insolvencyPriority (SENIOR_SECURED | SECURED | UNSECURED | SUBORDINATED | PENDING)
     11. valuation (MARK | MODEL | INDEPENDENT_APPRAISAL | PENDING_VALUATION)
     12. liquidityAccessibility (IMMEDIATE | T_PLUS_1 | T_PLUS_2 | LOCKED | PENDING | UNAVAILABLE)
     13. jurisdiction (ISO 3166-1 alpha-2 + secondary jurisdictions)
     14. governingLaw (legalSystem + specificLaw)
     + evidenceArtifact (links to Institutional Evidence Fabric — closes the loop)
   - 6 failure states per directive:
     LEGAL_CONTROL_UNPROVEN, ENCUMBERED, REUSED, CUSTODY_UNPROVEN,
     BANKRUPTCY_TREATMENT_UNKNOWN, LIQUIDITY_UNAVAILABLE
   - `MITHQAL_VERIFICATION_RULE` constant — "MITHQAL verification must NEVER
     imply ownership, legal perfection or bankruptcy remoteness."
   - `AVAILABLE_BACKING_RULE` constant — "A PBC may count as AvailableBacking
     only when the required legal and operational evidence exists." (14
     required-evidence predicates + zero failure states)
   - `computePBCStatus(pbc)` — evaluates a PBC and returns
     `{ status, failureStates, countsAsAvailableBacking, reason }`.
     Statuses: AVAILABLE_BACKING | PENDING_EVIDENCE | FAILED | SUPERSEDED.

2. `src/app/api/pbc-legal-enforceability/route.ts` (public endpoint)
   - GET — returns 14 fields + 6 failure states + the two canonical rules
     + version v25.3.16-U2-1.0 + changeRequest CR-2026-002.
   - POST — accepts a PBC JSON body, runs `computePBCStatus`, returns
     the status + failure states + countsAsAvailableBacking + reason.

## Verification matrix
| # | Check | Expected | Actual |
|---|---|---|---|
| 1 | `bun run lint` | exit 0 | exit 0 ✓ |
| 2 | GET `/api/pbc-legal-enforceability` fieldCount | 14 | 14 ✓ |
| 3 | GET failureStateCount | 6 | 6 ✓ |
| 4 | GET fields length | 15 (14 directive + evidenceArtifact) | 15 ✓ |
| 5 | GET failureStates length | 6 | 6 ✓ |
| 6 | GET mithqalVerificationRule starts with "MITHQAL verification must NEVER imply ownership…" | ✓ | ✓ |
| 7 | GET availableBackingRule starts with "A PBC may count as AvailableBacking only when…" | ✓ | ✓ |
| 8 | GET _meta.version | v25.3.16-U2-1.0 | v25.3.16-U2-1.0 ✓ |
| 9 | GET _meta.changeRequest | CR-2026-002 (per Architecture Freeze v25.3.15) | ✓ |
| 10 | POST PENDING_EVIDENCE PBC → status | FAILED | FAILED ✓ |
| 11 | POST PENDING_EVIDENCE PBC → countsAsAvailableBacking | false | false ✓ |
| 12 | POST PENDING_EVIDENCE PBC → failureStates | non-empty | 4 states: LEGAL_CONTROL_UNPROVEN, CUSTODY_UNPROVEN, BANKRUPTCY_TREATMENT_UNKNOWN, LIQUIDITY_UNAVAILABLE ✓ |
| 13 | POST fully-evidenced PBC → status | AVAILABLE_BACKING | AVAILABLE_BACKING ✓ |
| 14 | POST fully-evidenced PBC → countsAsAvailableBacking | true | true ✓ |
| 15 | POST fully-evidenced PBC → failureStates | [] | [] ✓ |
| 16 | POST AVAILABLE_BACKING reason mentions "evidence EXISTS — it does NOT mean the evidence is legally correct" | ✓ | ✓ (honest MITHQAL_VERIFICATION_RULE echo) |

## Commit / push notes (HONEST)

The PBC legal source files (`src/lib/pbc-legal-enforceability.ts` +
`src/app/api/pbc-legal-enforceability/route.ts`) were captured by the
parallel Agent U1's broad `git add -A` in commit `00e985a`
("feat(accounting): P25 Accounting/Prudential/Tax Classification
Framework (v25.3.16)") on the local sandbox, and by extension in the
pushed commit `d6db1c6` on `origin/main`. The content committed there
is byte-for-byte identical to my authored version (verified via
`git diff HEAD -- src/lib/pbc-legal-enforceability.ts
src/app/api/pbc-legal-enforceability/route.ts` → no diff).

To preserve honest attribution per the task spec, this U2 worklog
entry + agent-ctx record are committed separately under my own
commit subject line so the git history records that:
- The PBC legal module was authored by Agent U2 (PROMPT 26).
- The Accounting/Prudential/Tax framework was authored by Agent U1 (PROMPT 25).
- Both modules are ADDITIVE per Architecture Freeze v25.3.15.

## Constraints honored
- ✅ ONLY added code; never removed functionality
- ✅ Did NOT modify the deterministic v19 monetary engine
- ✅ Did NOT modify any FROZEN schema (per Architecture Freeze v25.3.15) — ADDITIVE
- ✅ Did NOT run `bun run build`
- ✅ Did NOT preemptively restart the dev server (only restarted after confirming
  node_modules was missing — `bun install` + `bash start-dev.sh` per the
  v25.4 stability stack documented in 6-FINAL)
- ✅ 14 fields per PBC — exactly 14 (per directive)
- ✅ 6 failure states — exactly 6 (per directive)
- ✅ MITHQAL verification NEVER implies ownership / legal perfection / bankruptcy remoteness
- ✅ PBC counts as AvailableBacking ONLY when all evidence exists AND zero failure states
- ✅ HONEST — the AVAILABLE_BACKING reason string explicitly notes that evidence
  existence does NOT mean legal correctness (per MITHQAL_VERIFICATION_RULE)

## Owner
PBC Legal Enforceability Architect (Agent U2)
Release: v25.3.16
