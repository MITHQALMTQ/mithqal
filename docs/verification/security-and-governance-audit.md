# MITHQAL — Security and Governance Audit

**Audit Date:** 2026-08-12
**Production Commit:** `ab84451`

## Security Findings

### P0 — Critical

1. **Deployer private key committed to public GitHub**
   - `scripts/update-onchain-oracle.sh:17` — plaintext private key
   - Controls ALL contracts on BOTH chains (minter, pauser, admin, oracle provider, Safe 1-of-1 owner)
   - Anyone can: mint unlimited MTQ, pause all transfers AND burns, set NAV to any value, update Oracle prices, drain deployer wallet

2. **2FA is dead code**
   - `verify2FA()` in `auth.ts:155-180` is never called from any route
   - Admin endpoints check `if (!session)` only — single-factor auth
   - `OPERATOR_TOTP_SECRET` set in .env but unused

3. **OFAC compliance fails open**
   - `compliance/route.ts:75-82` — if OFAC fetch fails, returns empty set → all addresses pass
   - Production MUST fail closed

4. **OFAC compliance not wired into financial flow**
   - No mint/redeem/transfer route calls `/api/compliance`
   - Sanctions screening is a standalone endpoint, not a gate

5. **Financial endpoints accept unverified txHashes**
   - `/api/mint`, `/api/redeem`, `/api/transfer` validate only `0x[a-fA-F0-9]{64}` regex
   - Never calls `eth_getTransactionReceipt`
   - Anyone can pollute the transaction ledger with fake entries

6. **`/api/testnet/mint` and `/api/testnet/redeem` have NO rate limit and NO auth**
   - Anyone can mint/redeem testnet MTQ at unlimited rate

7. **SQL injection in storeDailySnapshot**
   - `live-oracle.ts:64-66` — interpolates `fxJson` (external oracle data) directly into SQL string

8. **No HSM, no key management**
   - Deployer private key in `.env` + committed to repo

### P1 — High

9. **`.env.encrypted` committed to public repo**
   - AES-256-CBC encrypted, key = SHA-256(GitHub token)
   - If GitHub token leaks → ALL secrets compromised (Turso, NEXTAUTH, SMTP, API keys, deployer key)

10. **Rate limiter is process-local (ineffective on Vercel)**
    - `rate-limit.ts:8-12` — each Vercel instance has own Map
    - Effective limit = max × instance_count

11. **CSP allows `unsafe-inline` + `unsafe-eval`**
    - `next.config.ts:25` — weak XSS protection

12. **Audit trail is local-file only (ephemeral on Vercel)**
    - `execution-engine.ts:414` — `appendFileSync` to `logs/rebalance-audit.jsonl`
    - Lost on cold starts

13. **CRON_SECRET comparison NOT timing-safe**
    - `proofs/publish/route.ts:53` — `!==` comparison despite comment claiming "constant-time-ish"

14. **No timelock on role changes**
    - All contracts: `grantRole`/`revokeRole` callable instantly by admin

## Governance Findings

### Safe Multi-Sig — REALITY CHECK

**On-chain verified via `cast` on BOTH chains:**
```
Safe address: 0xE71869C662733642bfBb262B8c6bad8B0fBfA7D0
VERSION(): "1.4.1" (real Gnosis Safe)
getThreshold(): 1  (NOT 3, NOT 4, NOT 5)
getOwners(): [0x3C3932F865892EFabE45892f453f81B64f6c8d8c]  (deployer EOA, sole owner)
nonce(): 0  (NO transactions ever executed through Safe)
```

**Verdict: 1-of-1 deployer-controlled placeholder. Direct Article IV violation (requires 3-of-5).**

### Monetary Council — NOT DEPLOYED

- Source (`foundry/src/Governance.sol:78-80`): `COUNCIL_SIZE = 7`, `SUPERMAJORITY_THRESHOLD = 6`, `STANDARD_THRESHOLD = 4`
- Deployed bytecode: `councilMemberCount()`, `councilMembers(i)`, `emergencyCustodian()` ALL REVERT
- The 7-member Council with 6-of-7 supermajority exists ONLY in source code — never deployed

### 4-of-5 Approval — THEATRICAL

- Source (`execution-engine.ts:1332-1337`): `SEVERITY_APPROVAL_THRESHOLDS = { low: 2, medium: 3, high: 4, critical: 5 }`
- SIMULATION mode (default): auto-approves with all 5 roles + `reason: "SIMULATION mode auto-approval"`
- SHADOW/LIVE mode: single operator submits ALL 5 role approvals in one POST:
  ```
  POST /api/rebalance/approve
  { "approvals": [
    {"role":"treasury_authority","approved":true},
    {"role":"risk_authority","approved":true},
    {"role":"constitutional_authority","approved":true},
    {"role":"operations_authority","approved":true},
    {"role":"independent_oversight","approved":true}
  ]}
  ```
- Signatures are simulated: `signature: "sim-sig-${role}-${Date.now()}"` — NO cryptographic signatures
- No real institutional signers — `initializeSimulatedSigners()` creates fake signers with fake public keys

**Verdict: 4-of-5 approval is NOT technically enforced. It is theatrical.**

### Timelocks — NOT DEPLOYED

- Source (`Governance.sol:83-84`): `TIMELOCK_DELAY = 90 days` (constitutional), `POLICY_TIMELOCK_DELAY = 7 days`
- Deployed bytecode does not match — no timelock enforced

### Anti-Platform Clause — NOT DEPLOYED

- Source (`Governance.sol:128-202`): permanently frozen prohibitions (LENDING, EXCHANGE, BROKERAGE, ASSET_MANAGEMENT, DEFI, PLATFORM_SERVICES) + 15 forbidden function selectors
- Deployed bytecode: `checkInvariant(uint8)` REVERTS — not deployed

### Constitutional Invariants — NOT DEPLOYED

Source code defines but NONE is deployed on-chain:
- 100% reserve mandate (`MTQ.sol:135` `require(reserveDepositedUsd >= amount)`)
- No discretionary minting (`Mint.sol:130-177` requires depositProof)
- Redemption never pauses (`MTQ.sol:164` burn has no pause modifier)
- Reserve ratio auto-pause (`MTQ.sol:285-294`)
- Attestation drift guard (`MTQ.sol:231-267` ±10% per hour)
- Article X sequential liquidation (gold LAST)

### Role Concentration

A single private key (`0xdbe17f8db...`, committed to GitHub) holds:
- MTQ DEFAULT_ADMIN_ROLE + MINTER_ROLE + PAUSER_ROLE (both chains)
- Reserve ADMIN_ROLE (both chains)
- Algorithm ADMIN_ROLE — can `setNAV()` to any value (both chains)
- Takaful ADMIN_ROLE + DEFAULT_ADMIN_ROLE (both chains)
- Oracle ORACLE_PROVIDER_ROLE + DEFAULT_ADMIN_ROLE (Arc)
- Safe 1-of-1 owner (both chains)

## Sharia Architecture Findings

**Verdict: CANNOT BE CERTIFIED. REQUIRES SCHOLAR REVIEW.**

### Sharia Claims vs Reality

| Claim | Source | Reality |
|-------|--------|---------|
| "Sharia-Compliant by Design" | `docs/whitepaper.md:64` | ❌ No SSB seated |
| "AAOIFI review submitted" | `docs/whitepaper.md:73` | ❌ No AAOIFI certification |
| "Sharia Committee planned" | `docs/whitepaper.md:73` | ❌ Not formed |
| §46 forbidden-words list | `v19-infrastructure.ts:1672-1694` | ⚠️ Self-defined, not AAOIFI |

### Riba (Interest) Exposure — REQUIRES SCHOLAR REVIEW

- **US T-bills** — included in sovereign tier (75% of reserves). Conventional T-bills pay interest (discount yield). Mainstream scholars consider this haram.
- **BUIDL** — BlackRock tokenized US T-bills (0.5% allocation). Same riba concern.
- **USDC** — reserves include US Treasuries (interest-bearing). 2.0% allocation.
- **USDT excluded** — for DRQS reasons, not Sharia.

### Gharar (Uncertainty) — REQUIRES SCHOLAR REVIEW

- PAR = $1.00 fixed ✅ (settles redemption-value uncertainty)
- Dynamic NAV = R_m/S — redemption value floats with reserve mark-to-market
- Bullion haircuts (gold 5%, silver 7%) add further uncertainty

### Maysir / Speculation — ARCHITECTURALLY CONSISTENT (with caveats)

- Anti-platform clause: source-coded but NOT deployed
- No derivatives, no leverage, no short-selling in architecture
- Token is freely transferable (ERC-20) — could be traded on speculative secondary markets

### Takaful — NOT DEPLOYED

Source code (`foundry/src/Takaful.sol`) is structurally close to Takaful:
- Tabarru' (donation) principle ✅
- Mudaraba (profit-sharing) ✅ (but surplus distribution not enforced on-chain)
- Sharia Board role ✅ (but held by deployer)
- Claim verification ✅

**BUT:**
- Deployed bytecode does NOT match source (all source functions REVERT on-chain)
- Zero pool balance, zero contributions, zero claims
- No Sharia Supervisory Board seated
- Investment restriction not enforced (contract holds MTQ only, no investment logic)
- Surplus calculation is a heuristic (10% of pool), not actual surplus
