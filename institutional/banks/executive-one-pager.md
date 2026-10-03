# MITHQAL — Executive One-Pager

> RECOVERED_FROM_CONVERSATION_CONTEXT (Prompt 77) — this file's content
> was read by the Read tool in Prompt 70 before the environment was
> reset. The content is the exact original, recovered from the
> conversation context. NOT a reconstruction from specification.

## WHAT MITHQAL IS
Neutral institutional settlement control infrastructure. A settlement coordination layer that sits between the bank's core banking system and external settlement rails. Operates with MTQ completely disabled (BANK_MONEY settlement).

## WHAT PROBLEM IT ADDRESSES
Cross-border settlement friction: T+2/T+3 latency, trapped nostro/vostro liquidity, opaque FX costs, high reconciliation effort, compliance/evidence burden. MITHQAL provides: policy enforcement, jurisdiction gating, compliance orchestration, liquidity routing, finality coordination, reconciliation, evidence generation, exception handling, safe halt, alternative routing, recovery, regulatory replay.

## WHAT IT DOES NOT REQUIRE
Immediate MTQ adoption. The control plane operates fully without MTQ (Pilot A: 19 steps, 0/19 MTQ used, BANK_MONEY, SETTLED, F6 finality). MTQ is an optional extension requiring 11 institutional prerequisites.

## WHAT PILOT A IS
Controlled, limited-scope, non-production institutional evaluation using agreed evidence and test conditions. Settlement asset = BANK_MONEY. MTQ disabled. 19 settlement steps (BM-01..BM-16B). Evidence = SIMULATED (no live integration claimed).

## WHAT THE BANK GETS
Measurable evidence about current settlement performance versus the proposed control-plane workflow. Bank Value Measurement Engine: 12 metrics × 6 cost categories. The bank provides baseline data → the engine computes real deltas. CFO-ready framework — NOT CFO-validated (no bank data yet).

## WHAT MITHQAL DOES NOT CLAIM
- No regulatory approval (G1: 50 legal questions, 0 answered, JURISDICTION_PENDING)
- No bank endorsement (0 banks contacted, 0 design partners)
- No production authorization (NOT PRODUCTION-AUTHORIZED)
- No legally validated MTQ (MTQ disabled, 11 prerequisites ALL PENDING)
- No fabricated savings (ALL baselines INSUFFICIENT_DATA)

## STATUS
Architecture FROZEN at v25.3.2. G0: G0_CONDITIONAL (entity documents deposited, counsel verification pending). G1: READY_FOR_COUNSEL (50 legal questions prepared, BLOCKED_BY_G0). 0/12 institutional gates passed.

NOT PRODUCTION-AUTHORIZED.
