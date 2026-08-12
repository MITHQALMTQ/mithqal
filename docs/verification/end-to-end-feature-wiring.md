# MITHQAL — End-to-End Feature Wiring Audit

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`

## E2E Business Flow Trace

| Step | Real / Simulated / UI-only / Backend-only | Evidence |
|------|-------------------------------------------|----------|
| USER → ACCOUNT | **Simulated** | Single operator via env vars. No user table. |
| AUTHENTICATION | **Real** (scrypt+JWT) but **PROD broken** | `auth.ts:38-51`. Prod missing `ADMIN_EMAIL` → admin login impossible. |
| 2FA / TOTP | **Dead code** | `verify2FA()` never called from any route. `OPERATOR_TOTP_SECRET` set but unused. |
| MTQ VIEW (UI) | **Real** | UI calls `/api/nav`, `/api/transparency` |
| NAV | **Real computation, fake inputs** | `nav-compute.ts:124-348` — hardcoded supply (54M) + hardcoded reserves + live oracle |
| RESERVE DATA | **Simulated** | `nav-compute.ts:28-59` hardcoded constants. `/api/reserve/state` returns `isSimulation:true` |
| MINT | **DB write only** | `/api/mint` inserts DB row. NO on-chain call. NO txHash verification. NO deposit proof. |
| TRANSFER | **DB write only** | `/api/transfer` same pattern. Comment admits "does NOT verify tx_hash on-chain (yet)" |
| REDEMPTION | **DB write only** | `/api/redeem` same pattern. |
| BURN | Same as REDEMPTION | No separate burn endpoint. |
| RESERVE UPDATE | **Does not exist** | No code path updates reserves after mint/redeem. Hardcoded constants are immutable. |
| RR | **Computed from fake inputs** | Always ~110% (hardcoded 54M supply × hardcoded $63M reserves) |
| LCR | **Computed from fake inputs** | HQLA = $30M hardcoded. Outflow = 10% × 54M = $5.4M hardcoded. |
| AUDIT LOG | **Empty** | ProofAttestation table = 0 rows. CommercialAuditEntry = 0 rows. |
| GOVERNANCE | **Inert** | `/api/governance/proposals` returns `[]`. No proposals submitted/voted/executed. |
| ORACLE (off-chain) | **Real** | Multi-source consensus (gold-api.com + CoinGecko + goldprice.org) |
| ORACLE (on-chain) | **Stale and unused** | Arc Oracle >1hr stale. Prod missing `MOCK_ORACLE_ADDRESS` → never read. |
| DAILY PROOF | **Broken** | `/api/proofs/publish` returns HTTP 500 in prod (CRON_SECRET missing). 0 proofs ever published. |
| REBALANCING | **Broken trigger detection** | P0-6 bug: `currentWeights.set(assetClass, ...)` overwrites → all proposals HIGH severity |
| STRESS LAB | **Mathematically wrong** | Sovereign shock bug inflates non-USD values by 1/fx. RR increases under negative shocks. |
| COMPLIANCE (OFAC) | **Fails open, not wired** | `compliance/route.ts:75-82` returns empty set on fetch failure. Not called by mint/redeem. |
| CUSTODY | **SHADOW / Simulated** | `executionMode:"SHADOW"`, all 4 custodians "Simulated", holdings empty |
| DISCORD BOT | **Not running** | Cannot run on Vercel serverless. Not running locally either. |
| NOTIFY SERVICE | **Not running** | Same — cannot run on Vercel. |
| AI BRAIN | **Non-functional in prod** | All 3 LLM providers (Gemini/HF/Groq) unconfigured in Vercel env. |

## Feature Wiring Classification

| Feature | CONNECTED | PARTIALLY CONNECTED | ORPHANED | DEAD CODE | MOCK | HARDCODED | SIMULATED | UNVERIFIED |
|---------|-----------|---------------------|----------|-----------|------|-----------|-----------|------------|
| Multi-oracle (gold/silver/FX) | ✅ | | | | | | | |
| NAV computation | | ✅ | | | | ✅ (supply, reserves) | | |
| RR computation | | ✅ | | | | ✅ | | |
| On-chain Oracle read | | | ✅ | | | | | |
| Daily proof cron | | | ✅ | | | | | |
| Mint flow | | ✅ | | | | | ✅ (DB only) | |
| Redeem flow | | ✅ | | | | | ✅ (DB only) | |
| Transfer flow | | ✅ | | | | | ✅ (DB only) | |
| Reserve verification | | | | | | ✅ | | ✅ |
| Custody | | | | | ✅ | | ✅ | |
| Rebalancing | | ✅ | | | | | ✅ | |
| Dynamic optimizer | | | ✅ | | | | | |
| Substitution engine | | | ✅ | | | | | |
| 2FA / TOTP | | | | ✅ | | | | |
| Burn fee → Takaful | | | | ✅ | | | | |
| AI Brain (prod) | | | ✅ | | | | | |
| Discord bot (prod) | | | ✅ | | | | | |
| Stress lab | | ✅ | | | | | ✅ (wrong results) | |
| Compliance (OFAC) | | ✅ | | | | | | ✅ (fails open) |
| Governance proposals | | | ✅ | | | | | |
| VaR99 / CVaR99 | | | | | | ✅ | | |
| DRQS | | | | | | ✅ | | |
| CQS state machine | | ✅ | | | | | | ✅ (no live data) |

## Key Wiring Gaps

1. **Off-chain ↔ On-chain disconnect:** The Next.js backend NEVER calls smart contracts. Mint/redeem/transfer record DB entries only. The on-chain contracts have constitutional guards (deposit proof, reserve ratio) but they're never invoked.

2. **Oracle ↔ On-chain Oracle disconnect:** The off-chain multi-oracle works. The on-chain Oracle is deployed but stale and never read in production (`MOCK_ORACLE_ADDRESS` missing from Vercel env).

3. **Compliance ↔ Financial flow disconnect:** The OFAC sanctions endpoint exists but is never called by mint/redeem/transfer routes.

4. **Governance ↔ Execution disconnect:** The Governance contract is deployed but no code submits/votes/executes proposals. `/api/governance/proposals` returns empty.

5. **Stress lab ↔ Reality disconnect:** Stress lab produces wrong-direction results due to sovereign shock bug. "20/20 pass" is invalid.

6. **DB ↔ UI disconnect:** The `reserves` table is empty. UI reserve values come from hardcoded constants in `nav-compute.ts`, not from the database.
