# MITHQAL — Live Production Readiness Matrix

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`

## Feature Completeness Matrix

Status: GREEN = independently verified | YELLOW = partially verified | RED = missing/broken | GRAY = specified but unimplemented | BLACK = contradictory/high-risk

| Feature | Blueprint | Code | Test | DB | API | UI | Production | Status |
|---------|-----------|------|------|----|----|----|------------|--------|
| PAR = $1.00 fixed | ✅ | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | GREEN (but testnet-engine removes it) |
| Supply (S) | 54M | ✅ hardcoded | ❌ | ✅ empty | ✅ | ✅ | ✅ | RED (on-chain = 310.95 MTQ, disagrees) |
| Liability (L = S × PAR) | $54M | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (computed from hardcoded S) |
| R_m (market reserve) | Σ Q×P | ✅ fixed-point | ❌ | ✅ empty | ✅ | ✅ | ✅ | YELLOW (live prices × hardcoded Q) |
| R_a (adjusted reserve) | Σ Q×P×(1-H)×C | ✅ fixed-point | ❌ | ✅ empty | ✅ | ✅ | ✅ | YELLOW (live prices × hardcoded Q) |
| R_l (stress reserve) | Σ Q×P×(1-H)×C×S | ✅ fixed-point | ❌ | N/A | ✅ | ✅ | ⚠️ | RED (computed on different allocation than R_m/R_a) |
| RR (Reserve Ratio) | R_a/(S×PAR) | ✅ fixed-point | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (correct math, hardcoded inputs) |
| LCR | HQLA/30d outflow | ✅ | ❌ | N/A | ✅ | ✅ | ⚠️ | RED (computed on synthetic testnet data) |
| LRR | IAL/max(avg,p95,stress) | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | GREEN (9.09 verified) |
| GEI | (R_a,t/G_t)/(R_a,0/G_0) | ✅ float | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (correct but float math, hardcoded base) |
| BRI | (G/G₀)^0.90×(S/S₀)^0.10 | ✅ float | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (correct but float math, hardcoded base) |
| LCI | HQLA/(S×0.10) | ✅ float | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (correct but float math) |
| CQS (20-factor) | ✅ | ✅ state machine | ❌ | N/A | ✅ empty | ❌ | ❌ | RED (never fed live data, cqsStates=[]) |
| RQS | ✅ | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | GRAY (not implemented) |
| CRS / HHI | ✅ | ✅ partial | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (USD conflates stablecoins) |
| GCRS | ✅ | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | GRAY (not implemented) |
| SRR | ✅ | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | GRAY (not implemented) |
| VaR99 | ❌ | ❌ hardcoded | ❌ | N/A | ✅ $4.3M | ❌ | ✅ | RED (hardcoded literal, no formula) |
| CVaR99 | ❌ | ❌ hardcoded | ❌ | N/A | ✅ $4.8M | ❌ | ✅ | RED (hardcoded literal, no formula) |
| FX exposure | ✅ | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | GREEN |
| Gold exposure | 15% target | ✅ | ❌ | N/A | ✅ 14.9% | ✅ | ✅ | GREEN |
| Silver exposure | 5% target | ✅ | ❌ | N/A | ✅ 3.8% | ✅ | ✅ | GREEN |
| USD concentration | ≤35% cap | ✅ declared | ❌ | N/A | ✅ 31.3% | ✅ | ✅ | BLACK (cap declared but NOT enforced) |
| Regional concentration | ≤40% cap | ✅ declared | ❌ | N/A | ❌ | ❌ | ❌ | BLACK (GROUP_CAP duplicate 0.40/0.70, second wins) |
| Stablecoin exposure (SE) | ≤5% max | ✅ | ❌ | N/A | ✅ 3.5% | ✅ | ✅ | GREEN |
| Mint capacity | Pause if RR<100% | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (guard works but RR always 110% from hardcoded inputs) |
| Redemption capacity | Never paused | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | GREEN |
| 11-currency basket | ✅ | ✅ 11 weights | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (engine operates on 8, 3 have no FX source) |
| Digital liquidity sleeve | USDC/USDP/EURC/BUIDL | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (BUIDL depeg always 0%) |
| DRQS (8-factor) | ✅ | ✅ hardcoded table | ❌ | N/A | ✅ | ✅ | ✅ | RED (static lookup, not computed) |
| SAE (risk-adjusted) | ✅ | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (computed from hardcoded DRQS) |
| Stablecoin state machine | 6 states | ✅ 4/6 states | ❌ | N/A | ✅ | ✅ | ✅ | RED (SUBSTITUTE/EMERGENCY_EXIT never emitted) |
| Dynamic optimizer | 7-λ argmax | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | GRAY (not implemented) |
| Substitution engine | ✅ | ❌ | ❌ | N/A | ❌ | ❌ | ❌ | GRAY (not implemented) |
| Rebalancing pipeline | 7 states | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | RED (trigger detection broken — P0-6 bug) |
| Hysteresis | 2% band, 2-cycle | ✅ | ❌ | ❌ in-memory | N/A | N/A | ✅ | YELLOW (lost on restart) |
| Trade suppression | ✅ | ✅ | ❌ | N/A | ✅ | N/A | ✅ | YELLOW (uses stale drift data) |
| Article X sequential liquidation | Gold LAST | ✅ source only | ❌ | N/A | N/A | N/A | ❌ | BLACK (on-chain does PRO-RATA) |
| Reserve verification | Level 3+ target | ✅ framework | ❌ | ✅ empty | ✅ Level 0 | ✅ | ✅ | RED ($0 verified, all hardcoded) |
| On-chain Oracle | ✅ | ✅ | ❌ | N/A | ✅ | N/A | ❌ | RED (stale, never read in prod) |
| Multi-oracle consensus | 3+ sources | ✅ 3 gold + 2 silver + 2 FX | ❌ | N/A | ✅ | N/A | ✅ | GREEN |
| Daily proof attestation | §37 | ✅ | ❌ | ✅ empty | ✅ 500 error | ✅ | ❌ | RED (cron broken, 0 proofs published) |
| MTQ token (ERC-20) | ✅ | ✅ | ❌ | N/A | ✅ | ✅ | ✅ | YELLOW (deployed ≠ source) |
| Mint contract | deposit proof | ✅ source | ❌ | N/A | ✅ | N/A | ❌ | BLACK (deployed has no deposit proof) |
| Redeem contract | never paused | ✅ source | ❌ | N/A | ✅ | N/A | ❌ | BLACK (deployed ≠ source) |
| Governance contract | 7-member Council | ✅ source | ❌ | N/A | ✅ | N/A | ❌ | BLACK (not deployed, deployed is vanilla OZ Governor) |
| Safe Multi-Sig | 3-of-5 | ✅ | ❌ | N/A | ✅ | N/A | ❌ | BLACK (1-of-1 deployer) |
| Takaful contract | Tabarru'+Mudaraba | ✅ source | ❌ | N/A | ✅ | N/A | ❌ | BLACK (not deployed, zero pool) |
| Authentication | NextAuth | ✅ | ❌ | N/A | ✅ | ✅ | ⚠️ | RED (admin login impossible in prod) |
| 2FA / TOTP | ✅ | ✅ | ❌ | N/A | ✅ | ❌ | ❌ | RED (dead code, never called) |
| AML/KYC | 3-tier framework | ✅ framework | ❌ | N/A | ✅ | ❌ | ❌ | RED (not wired into financial flow) |
| Sanctions screening | OFAC SDN | ✅ | ❌ | N/A | ✅ | ❌ | ❌ | RED (fails open, not wired) |
| Observability | ✅ | ❌ | ❌ | N/A | ✅ health only | ❌ | ❌ | RED (no alerting) |
| Discord bot | ✅ | ✅ | ❌ | N/A | N/A | N/A | ❌ | RED (cannot run on Vercel) |
| Notify service | ✅ | ✅ | ❌ | N/A | N/A | N/A | ❌ | RED (cannot run on Vercel) |

## Summary Counts

| Status | Count |
|--------|-------|
| GREEN (independently verified) | 9 |
| YELLOW (partially verified) | 17 |
| RED (missing/broken) | 20 |
| GRAY (specified but unimplemented) | 6 |
| BLACK (contradictory/high-risk) | 7 |
| **Total** | **59** |
