# Original vs Modified vs Current — Three-Generation Comparison

**Date:** 2026-08-10
**Commit:** `69e33cd`

---

## Evolution Timeline

```
v18 (2026-07-19) — Original Blueprint
    ↓ v19.0.0 → v19.0.1 (2026-08-01) — P0 constitutional fixes
    ↓ v19.0.2 (2026-08-15) — PAR-based RR + over-collateralization + full §29 triggers
    ↓ v19.0.3 (2026-08-22) — 10-point compliance verification
    ↓ Phase 1-5 Implementation (2026-08-10) — Current codebase
```

---

## Final Comparison Table

| Dimension | Original (v18) | Modified (v19.0.3) | Current Impl | Improvement? | Deviation? | Required Action |
|---|---|---|---|---|---|---|
| RR formula | `RV ≥ S×NAV` (tautological) | `RR = R_a/(S×PAR)` | ✅ PAR-based | ✅ Improved | None | None |
| Invariants | 4 (NAV-based) | 5 (PAR + Bullion Protection) | 5 enforced in TS | ✅ Improved | None | None |
| Reserve tiers | 4-tier (constitutional) | 4-tier (confirmed) | TS: 4-tier ✅; On-chain: Reserve.sol 4-tier ✅ but Mint.sol still 3-tier ❌ | ✅ Improved (TS) | ⚠️ On-chain mismatch | Fix Mint.sol/Algorithm.sol |
| Liquidation order | Not specified | Article X sequential | TS: ✅ sequential; On-chain: ✅ Reserve.sol sequential | ✅ Improved | None | None |
| Currency weighting | 50/40/10 (with internal contradictions) | 50/40/10 (confirmed) | ✅ 50/40/10 | ✅ Improved | None | None |
| Momentum | ±5% cap | ±5% cap | ✅ ±5% cap | = | None | None |
| Volatility dampening | "half rate" (vague) | σ≤2%→1.0, σ≥5%→0.5 | ✅ Exact formula | ✅ Improved | None | None |
| Hysteresis | Not in v18 | §22B 2%+2-cycle | ✅ With direction-tracking | ✅ Improved | None | None |
| Concentration caps | 3 conflicting thresholds | 7-tier cap table | ✅ 7-tier runtime gate | ✅ Improved | None | None |
| Rebalancing triggers | 2 implicit | 9+1 explicit | ✅ All 10 wired | ✅ Improved | None | None |
| φ_t | Static 80/20 | Dynamic 75-85% by vol | ✅ Dynamic | ✅ Improved | None | None |
| LCR | >125% target | ≥1.0 hard + 1.2 strong | ✅ Wired into execution gate | ✅ Improved | ⚠️ HQLA proxy | Fix HQLA formula |
| LRR | Not in v18 | Article XIII | ✅ Implemented | ✅ New | None | None |
| Emergency governance | Single Emergency Custodian | 4-level (Normal→24h) | ✅ TS; ⚠️ Not wired on-chain | ✅ Improved | ⚠️ Not on live path | Wire to API |
| Amendment workflow | 6-stage | 11-stage + 14-day timelock | ✅ TS (90-day timelock per §43.13) | ✅ Improved | ⚠️ Spec says 14d, code says 90d | Fix spec |
| Oracle | 8 families, ≥5/8 consensus | Same + 10 publication fields | ⚠️ Spec-echo only; live path single-source | ⚠️ Partial | ❌ Not on live path | Wire multi-oracle |
| Custody | Flat "qualified custodians" | 4-tier hierarchy (proposed) | ⚠️ 4 simulated + 7 display fleet | ✅ Improved (design) | ⚠️ Not real | Real custodian integration |
| Token model | Single MTQ (with vestigial MTQ-S/Y refs) | Single MTQ (confirmed) | ✅ Single MTQ | ✅ Improved | None | None |
| Determinism | Not specified | §29.12 | ✅ Verified (62/62 tests) | ✅ Improved | None | None |
| Audit trail | "No operation without audit trail" | §29.10 immutable | ✅ JSONL append-only | ✅ Improved | ⚠️ Not replayed on boot | Replay on restart |
| Tests | None | 20-scenario stress lab | ✅ 158 tests (0 true failures) | ✅ New | None | None |
| Authentication | Not specified | Not specified | ❌ All routes unauthenticated | ❌ Regression | Critical | Add auth |
| State persistence | Not specified | Not specified | ❌ In-memory (lost on restart) | ❌ Regression | Critical | Persist to DB |
| Smart contract security | 12 formal-verification invariants | Same + checkInvariant() | ⚠️ Foundry not installed | = | ⚠️ Can't verify | Install Foundry |

---

## What Became Stronger
- RR formula (tautological → PAR-based, economically correct)
- Reserve mathematics (verified to 10 sig-figs)
- Rebalancing (2 implicit → 9+1 explicit triggers with severity routing)
- Hysteresis (none → direction-tracking anti-whipsaw)
- Concentration protection (3 conflicting → 7-tier unified)
- Liquidation order (none → Article X sequential on-chain)
- State separation (conflated → 7 independent states)
- Testing (none → 158 tests, 0 true failures)
- Policy centralization (scattered → single spec file)

## What Became Weaker
- Authentication (not specified → completely absent on all rebalance routes)
- State persistence (not specified → in-memory only, lost on restart)
- Contract consistency (v18 had uniform 3-tier → now Reserve.sol is 4-tier but Mint.sol/Algorithm.sol still 3-tier)
- Oracle resilience (v18 specified 8 families → implementation uses 1 free API)

## What Became More Complex
- Rebalancing engine (9 trigger types + RebalanceContext + cross-asset pairing)
- Reserve state (4 views × 5 fields each)
- Fee model (6 asset classes × 3 components × 5 methods)
- Turnover tracking (event/daily/weekly/monthly)
- Trade suppression (benefit vs cost + 4 components + 5 emergency overrides)

## What Became Unnecessarily Complex
- Two parallel custodian models (4 simulated adapters vs 7-institutional fleet) not connected
- Two parallel fee tables (FEE_SPEC in policy-spec vs CONSTITUTIONAL_FEE_MODEL in rebalance-fees) without cross-check
- Two parallel timelock values (spec says 14d, code says 90d)
- §39 cryptographic framework (HMAC simulation) that is forgeable and not wired to any live path

## What Became More Realistic
- PAR-based liability (fixed $54M, not floating with market)
- Over-collateralization (102.05% baseline, not just 100%)
- Scale-aware trade limits (percentage + absolute)
- Transaction-cost suppression (don't trade if uneconomic)
- Direction-tracking hysteresis (prevents real whipsaw)

## What Remains Theoretical
- Multi-oracle consensus (8 families, ≥5/8 quorum) — spec-echo only
- 4-tier custodian hierarchy — proposed, not ratified, not integrated
- §39 HSM-backed cryptography — simulated with forgeable HMAC
- §43 11-stage amendment workflow — test-only, not wired
- §44 4-level emergency governance — test-only, not wired
- SDP emergency weights — computed but not applied
- On-chain approval binding — exists in Reserve.sol but not called from TS
- MTQ founder holding cap (20%) — declared but not enforced

## What Must Be Redesigned
- Oracle live path (replace single-source free API with multi-source consensus)
- API authentication (add session/token verification to all rebalance routes)
- State persistence (move all in-memory state to durable storage)
- Contract tier alignment (Mint.sol + Algorithm.sol must match Reserve.sol 4-tier)
- LCR HQLA computation (replace 60% proxy with proper L1+L2 sum)
