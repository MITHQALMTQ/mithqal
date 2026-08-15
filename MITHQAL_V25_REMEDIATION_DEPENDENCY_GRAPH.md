# MITHQAL v25.0 — REMEDIATION DEPENDENCY GRAPH

**Date:** 2026-08-14
**Purpose:** Identify what must change BEFORE each remediation area can be addressed.

---

## Dependency Graph Overview

```
                    ┌─────────────────┐
                    │  ARCHITECTURE   │
                    │  LOCK (v25.0)   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   ┌──────────┐      ┌─────────────┐     ┌──────────────┐
   │ MONETARY │      │  TOKENOMIC  │     │   BANKING    │
   │  MODEL   │      │   MODEL     │     │    MODEL     │
   └────┬─────┘      └──────┬──────┘     └──────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌──────────┐      ┌─────────────┐     ┌──────────────┐
   │ LIQUIDITY│      │  ANTI-HOARD │     │  CUSTODY     │
   │  MODEL   │      │  MECHANISM  │     │ DIVERSIFICATION│
   └────┬─────┘      └──────┬──────┘     └──────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌──────────┐      ┌─────────────┐     ┌──────────────┐
   │ ISSUANCE │      │  VELOCITY   │     │  CAPITAL     │
   │ PIPELINE │      │  ECONOMICS  │     │  ADEQUACY    │
   └────┬─────┘      └──────┬──────┘     └──────┬───────┘
        │                   │                   │
        ▼                   ▼                   ▼
   ┌──────────┐      ┌─────────────┐     ┌──────────────┐
   │ REDEMPTN │      │  BANK-RUN   │     │  STRESS      │
   │ MECHANISM│      │  BREAKER    │     │  TESTING     │
   └────┬─────┘      └──────┬──────┘     └──────┬───────┘
        │                   │                   │
        └───────────┬───────┘                   │
                    │                           │
                    ▼                           ▼
              ┌──────────┐              ┌──────────────┐
              │  SMART   │              │  BLUEPRINT   │
              │CONTRACTS │              │  UPDATE      │
              └────┬─────┘              └──────┬───────┘
                   │                           │
                   ▼                           ▼
              ┌──────────┐              ┌──────────────┐
              │   APIs   │              │  UI/DASHBD   │
              └──────────┘              └──────────────┘
```

---

## REMEDIATION ORDER (What Must Change Before What)

### Phase 0 — Baseline (COMPLETE)
- Architecture Lock ✅
- Blueprint contradiction fixes ✅
- CALM 6-state fix ✅
- Digital target 2.5% fix ✅

### Phase 1 — Monetary Model (BEFORE everything else)
**Must change BEFORE: liquidity, issuance, redemption, stress testing, smart contracts**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 1.1 | ΔCapital_min resolution ($15.8M) | Blueprint §59, new `src/lib/capital-adequacy.ts` | Architecture Lock |
| 1.2 | CALM 6-state enforcement in ALL code (not just calm.ts) | `src/lib/reserve-state-engine.ts` (still 5-state!) | Architecture Lock |
| 1.3 | 102% ceiling removal from ALL test scripts | `scripts/critical-deterministic-tests.py`, `scripts/portfolio-stress-suite.py` | Architecture Lock |
| 1.4 | PAR stability study (CPI-adjustment mechanism) | Blueprint §32, new study | Architecture Lock |

### Phase 2 — Liquidity Model (DEPENDS ON Phase 1)
**Must change BEFORE: issuance, redemption, stress testing**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 2.1 | Bank-run circuit breaker (redemption queue / daily cap / temporary pause) | New `src/lib/redemption-circuit-breaker.ts`, `src/lib/reserve-state-engine.ts` | Phase 1.2 (6-state) |
| 2.2 | Liquidity ladder verification (5 tiers, LCR, LSD) | `src/lib/lrr.ts`, `src/lib/reserve-allocation.ts` | Phase 1 |
| 2.3 | LCR/LSD real-time monitoring | `src/app/api/lrr/route.ts` | Phase 2.2 |

### Phase 3 — Issuance Model (DEPENDS ON Phase 1+2)
**Must change BEFORE: smart contracts, APIs**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 3.1 | Institutional issuance pipeline on-chain enforcement | `foundry/src/Mint.sol`, `foundry/src/MTQ.sol` | Phase 1, 2 |
| 3.2 | Governance.sol 4-arg mint selector fix | `foundry/src/Governance.sol` | Phase 3.1 |
| 3.3 | Safe Multi-Sig transfer (1-of-1 → 3-of-5) | `foundry/src/` (Safe deployment) | Phase 3.2 |
| 3.4 | Corporate MTQ Settlement Account runtime | `src/lib/corporate-settlement-account.ts` (exists, needs runtime integration) | Phase 3.1 |

### Phase 4 — Redemption Model (DEPENDS ON Phase 2+3)
**Must change BEFORE: smart contracts**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 4.1 | Bank-run circuit breaker integration | `foundry/src/Redeem.sol`, `src/lib/wholesale-settlement.ts` | Phase 2.1, 3 |
| 4.2 | Jurisdictional redemption permissions | `foundry/src/Redeem.sol` | Phase 3 |
| 4.3 | Atomic burn/release verification | `src/lib/wholesale-settlement.ts` | Phase 4.1 |

### Phase 5 — Custody (DEPENDS ON Phase 1)
**Must change BEFORE: stress testing**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 5.1 | Custodian diversification (52% → ≤15% each) | `src/lib/multi-custodian.ts`, `src/lib/custodian-adapter.ts` | Architecture Lock |
| 5.2 | Per-custodian 15% cap enforcement | `src/lib/effective-custody-risk.ts` | Phase 5.1 |
| 5.3 | Custody stress matrix integration | `src/lib/stress-test-comprehensive.ts` | Phase 5.2 |

### Phase 6 — Tokenomics (DEPENDS ON Phase 1+2)
**Must change BEFORE: APIs, UI**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 6.1 | Anti-hoarding mechanism (demurrage / inactivity fee / mandatory redemption) | New `src/lib/anti-hoarding.ts`, Blueprint amendment | Architecture Lock |
| 6.2 | Velocity economics model | New `src/lib/velocity-economics.ts` | Phase 6.1 |
| 6.3 | Fee model quantification (break-even, unit economics) | `src/lib/rebalance-fees.ts`, new financial model | Phase 6.2 |
| 6.4 | Revenue sustainability analysis | New `src/lib/revenue-model.ts` | Phase 6.3 |

### Phase 7 — Stress Testing (DEPENDS ON Phase 1-5)
**Must change BEFORE: blueprint finalization**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 7.1 | Re-run 250K MC with all fixes applied | `scripts/monte-carlo-v24.2.py` | Phase 1-5 |
| 7.2 | Re-run challenger models | `scripts/challenger-models.py` | Phase 7.1 |
| 7.3 | Re-run A/B/C/D/E comparison | `scripts/abcde-comparison.py` | Phase 7.1 |
| 7.4 | Re-run 15 extreme stress scenarios | `scripts/contradiction-stress-audit.py` | Phase 7.1 |
| 7.5 | P(RR<100%) target: ≤5% (was 21.54%) | All MC scripts | Phase 7.1-7.4 |
| 7.6 | StressRR ≥ 100% target (was impossible) | All MC scripts | Phase 7.1-7.4 |

### Phase 8 — Smart Contracts (DEPENDS ON Phase 3+4)
**Must change BEFORE: APIs**

| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 8.1 | MTQ.sol (3 changes: pre-mint RR, auth hooks, event logging) | `foundry/src/MTQ.sol` | Phase 3 |
| 8.2 | Mint.sol (8 changes: institutional perimeter, CTID, jurisdiction, sanctions) | `foundry/src/Mint.sol` | Phase 3 |
| 8.3 | Redeem.sol (5 changes: institution validation, jurisdiction gate, atomic) | `foundry/src/Redeem.sol` | Phase 4 |
| 8.4 | Reserve.sol (5 changes: segregation, jurisdiction, proof refs) | `foundry/src/Reserve.sol` | Phase 5 |
| 8.5 | Governance.sol (3 changes: 4-arg mint forbidden, rule-only) | `foundry/src/Governance.sol` | Phase 3.2 |
| 8.6 | Algorithm.sol (3 changes: institutional gate) | `foundry/src/Algorithm.sol` | Phase 3 |
| 8.7 | Oracle.sol (3 changes: multi-source consensus, separated oracles) | `foundry/src/Oracle.sol` | Phase 1 |
| 8.8 | Safe.sol (3 changes: 3-of-5 multisig, role transfer) | `foundry/src/` (Safe) | Phase 3.3 |
| 8.9 | Takaful.sol (3 changes: institutional framework scope) | `foundry/src/Takaful.sol` | Phase 3 |

### Phase 9 — APIs (DEPENDS ON Phase 3-8)
| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 9.1 | v25.0 API: add anti-hoarding, circuit breaker, capital adequacy | `src/app/api/v25.0/route.ts` | Phase 6, 2 |
| 9.2 | New API: proof-of-liabilities endpoint | `src/app/api/v25.0/proof-of-liabilities/route.ts` | Phase 3.4 |
| 9.3 | New API: JSG management endpoint | `src/app/api/v25.0/jsg/route.ts` | Architecture Lock |
| 9.4 | New API: BRICS adapter status | `src/app/api/v25.0/brics-adapter/route.ts` | Architecture Lock |
| 9.5 | Update all existing APIs to use 6-state machine | All API routes using calm.ts | Phase 1.2 |

### Phase 10 — UI/Dashboards (DEPENDS ON Phase 9)
| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 10.1 | Portfolio B panel: add anti-hoarding status, circuit breaker status | `src/components/portfolio-b-panel.tsx` | Phase 9.1 |
| 10.2 | New dashboard: JSG status panel | `src/components/jsg-panel.tsx` | Phase 9.3 |
| 10.3 | New dashboard: proof-of-liabilities panel | `src/components/proof-of-liabilities-panel.tsx` | Phase 9.2 |
| 10.4 | Update transparency dashboard: v25.0 status, capital adequacy | `src/components/transparency.tsx` | Phase 9.1 |
| 10.5 | Update homepage: v25.0 branding (neutral wholesale settlement) | `src/components/public-site.tsx`, `src/app/layout.tsx` | Architecture Lock |

### Phase 11 — Blueprint (DEPENDS ON Phase 1-10)
| Item | What Must Change | Files | Depends On |
|------|-----------------|-------|------------|
| 11.1 | Add capital adequacy section | Blueprint §new | Phase 1.1 |
| 11.2 | Add anti-hoarding section | Blueprint §new | Phase 6.1 |
| 11.3 | Add bank-run circuit breaker section | Blueprint §new | Phase 2.1 |
| 11.4 | Add velocity economics section | Blueprint §new | Phase 6.2 |
| 11.5 | Update all stress test results | Blueprint Appendix V | Phase 7 |
| 11.6 | Mark all remaining historical contradictions | Blueprint full sweep | Phase 1-10 |
| 11.7 | Regenerate .docx | `scripts/generate-blueprint-docx.py` | Phase 11.1-11.6 |

---

## CRITICAL PATH

The **critical path** (longest dependency chain) is:

```
Architecture Lock
    → Monetary Model (Phase 1)
        → Liquidity Model (Phase 2)
            → Issuance Model (Phase 3)
                → Redemption Model (Phase 4)
                    → Smart Contracts (Phase 8)
                        → APIs (Phase 9)
                            → UI (Phase 10)
                                → Blueprint (Phase 11)
```

**Custody (Phase 5), Tokenomics (Phase 6), and Stress Testing (Phase 7)** run in parallel with the critical path but must complete before Phase 11 (Blueprint).

---

## FILES THAT EACH LATER PROMPT MUST MODIFY

| Prompt # | Area | Files to Modify |
|----------|------|-----------------|
| 2/8 | Capital + Capital Adequacy | `src/lib/capital-adequacy.ts` (NEW), `src/lib/calm.ts`, `scripts/monte-carlo-v24.2.py`, `scripts/mpc-capital-solver.py` |
| 3/8 | Anti-Hoarding + Velocity | `src/lib/anti-hoarding.ts` (NEW), `src/lib/velocity-economics.ts` (NEW), `src/lib/rebalance-fees.ts` |
| 4/8 | Bank-Run Circuit Breaker | `src/lib/redemption-circuit-breaker.ts` (NEW), `src/lib/wholesale-settlement.ts`, `foundry/src/Redeem.sol` |
| 5/8 | Custody Diversification | `src/lib/multi-custodian.ts`, `src/lib/custodian-adapter.ts`, `src/lib/effective-custody-risk.ts` |
| 6/8 | Smart Contract Remediation | All 9 `foundry/src/*.sol` files |
| 7/8 | Cross-Chain + Bridge | `src/lib/solana.ts`, `src/lib/chains.ts`, new `src/lib/bridge-lock.ts` |
| 8/8 | Blueprint + API + UI + Final | Blueprint, all API routes, dashboard components, .docx regeneration |

---

*This dependency graph is the sequencing authority for the v25.0 remediation series. No prompt may skip ahead — each must complete its dependencies first.*
