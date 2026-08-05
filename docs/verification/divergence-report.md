# MITHQAL v19.0 — Implementation Divergence Report
## Chief Constitutional Implementation Engineer · Independent Constitutional Compliance Auditor
### Task 12-a · Phase 3 — Zero-Gap Detection (Divergence Subset)
### Date: 2026-08-26

**Blueprint source of truth:** `/home/z/my-project/docs/blueprint/blueprint.txt` (28,456 lines · 56 articles · v19 evolved)

**Companion documents:**
- `implementation-compliance-matrix.md` — article-by-article traceability
- `missing-feature-report.md` — gaps with priority + effort

**Definition — Divergence:** An implementation behaviour, value, label, or structure that **conflicts with** (not merely omits) the corresponding blueprint provision. Divergences are more serious than gaps because they introduce **incorrect** behaviour rather than missing behaviour.

**Severity legend:**
- 🔴 **Critical** — Divergence from a constitutional invariant or article-level requirement; must be corrected before any institutional deployment
- 🟠 **High** — Divergence from a sub-article provision; should be corrected before mainnet
- 🟡 **Medium** — Divergence from an illustrative value or naming convention; cosmetic but should be aligned
- 🟢 **Low** — Divergence in documentation/comments only; no runtime impact

---

## D-1 · 🔴 CRITICAL — Invariant 5 Mislabeled as "No Redemption Suspension" (should be "Bullion Preservation")

**Blueprint source:** Part 2 Article I "Invariants", Invariant 5 (lines 4388-4428):
> "**Invariant 5: Bullion Preservation** — Gold reserves shall only be liquidated after all constitutionally superior liquidity tiers have been exhausted, in accordance with the Reserve Liquidation Order established by Article X (Bullion Protection Rule). The liquidation of Gold while any constitutionally superior liquidity tier remains available constitutes a constitutional breach."

**Implementation:**
- `foundry/src/MTQ.sol` line 13: `"No redemption suspension: burn always works, redemption never pauses (Invariant 5)"`
- `foundry/src/MTQ.sol` line 161: `"Burn MTQ — NEVER pausable per Constitution § Invariant 5."`
- `foundry/src/Redeem.sol` line 14: `"redemption never pauses (Invariant 5)"`
- `foundry/src/Redeem.sol` line 20: `"CONSTITUTIONAL INVARIANT (Article II, Invariant 5): Redemption is NEVER pausable..."`
- `foundry/src/Redeem.sol` lines 85, 106, 116, 132: `"Constitution Invariant 5"` (re: redemption never pausable)
- `foundry/src/Algorithm.sol` line 25: `"(Invariant 5: redemption never pauses)"`
- `foundry/src/Governance.sol` line 178: `"_SEL_SUSPEND_REDEMPTION — violates non-suspendable burn (Invariant 5)"`
- `foundry/src/Governance.sol` line 400: `"suspendRedemption() — violates non-suspendable burn (Invariant 5)"`
- `src/lib/constitution-data.ts` LAYER_2.articles[0] purpose: `"100% reserve mandate; no discretionary minting; no lending of reserves; no commingling; no redemption suspension. Absolute and permanent."`
- `foundry/test/MTQ.t.sol`, `MTQInvariant.t.sol`, `MockOracleInvariant.t.sol`, `Redeem.t.sol`: all reference "Invariant 5" as redemption-never-pausing

**Divergence:** The implementation labels "no redemption suspension" as **Invariant 5 of Article I**. In the v19 evolved blueprint, "Invariant 5 of Article I" is **Bullion Preservation**, NOT redemption-never-pausing.

The "redemption never suspends" guarantee IS in the blueprint — but at §45.2 (Redemption Rights, listed among the 21 non-amendable provisions), NOT at Article I Invariant 5.

**Root cause:** The implementation was written against an earlier (pre-v19 evolution) version of the blueprint where Article I had only 4 invariants (100 % reserve / no discretionary minting / no lending / no commingling) and the "no redemption suspension" guarantee was informally referred to as "Invariant 5". The Task 10 v19 evolution inserted the new Bullion Preservation invariant as Invariant 5, but the implementation was never re-aligned.

**Constitutional impact:** This is a **critical semantic divergence** that will be flagged by any constitutional auditor. The "redemption-never-suspended" guarantee is correctly enforced in code (no `pause()` on `burn()`), but it is incorrectly attributed to Invariant 5.

**Required correction:**
1. Re-label all "Invariant 5" references in MTQ.sol / Redeem.sol / Algorithm.sol / Governance.sol / constitution-data.ts as "§45.2 Redemption Rights (non-amendable)" or "Redemption Rights Invariant"
2. Add a new "Invariant 5 — Bullion Preservation" comment block in MTQ.sol and Reserve.sol, with the full text from blueprint lines 4388-4428
3. Update `constitution-data.ts` LAYER_2.articles[0] purpose to read: `"100% reserve mandate (PAR-based); no discretionary minting; no lending of reserves; no commingling; bullion preservation (Gold liquidated only after all superior tiers exhausted). Absolute and permanent."`
4. Add Foundry test for Invariant 5 (Bullion Preservation) in `MTQInvariant.t.sol` or a new `ReserveInvariant.t.sol`
5. Once P0-3 (Exhaustion Certificate) is implemented, add on-chain enforcement in `Reserve.sol`

**Effort:** M (3 days for re-labelling across 6 contracts + tests + constitution-data.ts)

---

## D-2 · 🟠 HIGH — Counterparty Exposure Limits: 25 %/30 %/35 % vs. Blueprint 40 %/40 %/50 %

**Blueprint source:** Part 2 Article III "Dynamic Reserve Allocation" Reserve Range Framework (lines 5103-5110):
> "Tier 1 — Constitutional Min 25 %, Max 60 %, Policy Target 40 %"
> "Tier 2 — Constitutional Min 20 %, Max 50 %, Policy Target 35 %"
> "Tier 3 — Constitutional Min 10 %, Max 30 %, Policy Target 20 %"
> "Tier 4 — Constitutional Min 0 %, Max 10 %, Policy Target 5 %"

And Part 3 Article I "Currency Concentration Policy" (lines 4974-5001):
> "Maximum Single Currency: 50 % of reserves"
> "Maximum Single Currency in Basket: 60 % of basket"
> "Maximum Single Jurisdiction: 40 % of reserves"

And Part 3 Article I "Jurisdiction Concentration Limit" (lines 5022-5024):
> "Maximum Single Jurisdiction: 40 % of reserves"

**Implementation:** `src/lib/v19-infrastructure.ts` §10 `COUNTERPARTY_EXPOSURE_LIMITS` (lines 290-310):
- Tier 2 Per-Custodian: **25 %** (blueprint: 40 %)
- Tier 4 Per-Jurisdiction: **30 %** (blueprint: 40 %)
- Tier 6 Per-Currency: **35 %** (blueprint: 50 % of reserves; 60 % of basket)

**Divergence:** Implementation uses **tighter** concentration limits than the blueprint specifies. This is **more conservative** (safer) but is a divergence from the constitutional text.

**Constitutional impact:** Lower (tighter) concentration limits are not a *violation* — they impose stricter diversification than the blueprint minimums. However:
1. The implementation presents these as "Constitutional" limits, which is incorrect — they should be labelled "Policy Limits (stricter than Constitutional minimums)"
2. Future Council action to relax these to the blueprint's 40 %/40 %/50 % would be constitutionally permitted but blocked by the code

**Required correction:**
1. Either: rename to "Policy Limits" and add a parallel `CONSTITUTIONAL_EXPOSURE_LIMITS` table with 40 %/40 %/50 % values
2. Or: align the implementation values with the blueprint (40 %/40 %/50 %) and document the rationale for the change
3. Update `src/lib/v19-infrastructure.ts` §10 comments to clarify the constitutional vs. policy distinction

**Effort:** S (1 day)

---

## D-3 · 🟠 HIGH — Reserve Layer Ranges: Combined Fiat 70-80 % vs. Blueprint Tier 1 35-45 % + Tier 2 30-40 %

**Blueprint source:** Part 3 Article I "Reserve Tier Allocation Policy" (lines 5100-5275):
> Tier 1 (Cash): Target 40 %, Range 35-45 %
> Tier 2 (Sovereign): Target 35 %, Range 30-40 %
> Tier 3 (Bullion): Target 20 %, Range 15-25 %
> Tier 4 (Stablecoin): Target 5 %, Range 2-8 %

**Implementation:** `src/lib/reserve-allocation.ts` `LAYER_RANGES` (lines 60-64):
```ts
fiat:        { min: 0.70, max: 0.80 },  // Tier 1 + Tier 2 combined
bullion:     { min: 0.15, max: 0.25 },  // Tier 3 (matches blueprint)
stablecoin:  { min: 0.02, max: 0.08 },  // Tier 4 (matches blueprint)
```

**Divergence:** The implementation collapses Tier 1 (cash) and Tier 2 (sovereign) into a single "fiat" layer with combined range 70-80 %. The blueprint treats them as separate tiers with individual ranges (35-45 % + 30-40 % = 65-85 % combined). The implementation's 70-80 % combined range is **narrower** than the blueprint's 65-85 % combined range.

**Constitutional impact:** The implementation cannot model a Tier 1 = 50 % / Tier 2 = 25 % allocation (combined 75 %), even though this is constitutionally permitted. The implementation also cannot model Tier 1 = 30 % / Tier 2 = 50 % (combined 80 %), which is also constitutionally permitted.

**Required correction:**
1. Either: split `LAYER_RANGES.fiat` into `LAYER_RANGES.cash` (35-45 %) and `LAYER_RANGES.sovereign` (30-40 %)
2. Or: document the rationale for the combined fiat layer (operational simplification) and confirm it is a Policy choice, not a Constitutional limit
3. Update `src/lib/reserve-allocation.ts` `deriveCurrentLayerWeights()` to return 4 tiers, not 3 layers

**Effort:** M (3 days)

---

## D-4 · 🟠 HIGH — Haircut Values Differ Slightly from Blueprint

**Blueprint source:** Part 2 Article III §6 (referenced) and Part 4 Article I (referenced). Blueprint specifies fixed constitutional haircuts per asset class.

**Implementation:** `src/lib/monetary-engine-v19.ts` `HAIRCUTS` (lines 209-215):
```ts
cash:       0.00,  // Tier 1
sovereign:  0.02,  // Tier 2 — 2%
sukuk:      0.02,  // Tier 2 — 2%
gold:       0.05,  // Tier 3 — 5%
silver:     0.07,  // Tier 3 — 7%
stablecoin: 0.02,  // Tier 4 — 2%
```

**Existing master-audit-report.md note:** "§6 Fixed Haircuts ✅ Exact match"

**Divergence:** The implementation values are **internally consistent** and match the blueprint's general framework, but the master audit's "exact match" claim is **not verifiable** from the blueprint text I read — the blueprint specifies the haircut framework but does not pin specific values in the lines I examined. The implementation values should be cross-checked against the blueprint's §6 specification (which I did not extract in full).

**Required action:** Cross-check `HAIRCUTS` values against blueprint §6 (Part 2 Article III or Part 4 Article I §6). If values match, document the exact blueprint line numbers. If they differ, align to blueprint.

**Effort:** S (0.5 day for verification)

---

## D-5 · 🟡 MEDIUM — Article Numbering in `constitution-data.ts` LAYER_2 (7 articles vs. blueprint 16)

**Blueprint source:** Part 2 has 16 articles (I through XVI), per the v19 Task 10 evolution that added Articles X through XVI.

**Implementation:** `src/lib/constitution-data.ts` LAYER_2 (lines 268-276) contains only **7 articles** (I through VII):
- Article I: Invariants
- Article II: Monetary Objectives
- Article III: Reserve Principles
- Article IV: Monetary Metals
- Article V: Currency Framework
- Article VI: Monetary Engine
- Article VII: Proof of Reserves

**Missing from LAYER_2 in `constitution-data.ts`:**
- Article VIII: Yield Separation
- Article IX: Sharia Compliance
- Article X: Bullion Protection Rule (v19 NEW)
- Article XI: Constitutional Risk Engineering (v19 NEW)
- Article XII: Constitutional Model Validation Framework (v19 NEW)
- Article XIII: Liquidity Readiness Ratio (v19 NEW)
- Article XIV: Reverse Stress Testing (v19 NEW)
- Article XV: Constitutional Stress Laboratory (v19 NEW)
- Article XVI: Constitutional Assumptions Register (v19 NEW)

**Divergence:** The UI-displayed constitution has only 47 articles (17 + 7 + 8 + 8 + 7) instead of the v19 blueprint's 56 articles (17 + 16 + 8 + 8 + 7). The 9 missing articles in LAYER_2 are the v19 Phase 3-14 additions.

**Note:** The v19 articles ARE partially implemented elsewhere:
- Article VIII (Yield Separation): `src/lib/site-data.ts` (Entity B documented)
- Article IX (Sharia): `src/lib/v19-infrastructure.ts` §49 + `foundry/src/Takaful.sol`
- Article X (Bullion Protection): `src/lib/v19-infrastructure.ts` §34.2 + `src/components/transparency.tsx`
- Articles XI-XVI: partially in `src/lib/tests/constitutional-stress-engine.ts`

But they are **not surfaced** in the Constitution UI component (`src/components/constitution.tsx`), which reads from `constitution-data.ts`.

**Constitutional impact:** Users navigating the Constitution page see an incomplete Layer 2 — missing 9 articles that are part of the supreme constitutional text. This is a transparency divergence.

**Required correction:** Add 9 new entries to `LAYER_2.articles` in `src/lib/constitution-data.ts` (lines 269-276 → extend to 16 entries). Each entry should include `id`, `number`, `title`, `purpose` per the blueprint text. Update `ALL_ARTICLES` derived flat list (line 347).

**Effort:** S (1 day)

---

## D-6 · 🟡 MEDIUM — `LAYER_POLICY_TARGETS` Combined Fiat 75 % vs. Blueprint 40+35=75 % (matches but loses granularity)

**Blueprint source:** Part 3 Article I — Tier 1 target 40 %, Tier 2 target 35 % (combined 75 %).

**Implementation:** `src/lib/reserve-allocation.ts` `LAYER_POLICY_TARGETS` (lines 70-74):
```ts
fiat:        0.75,  // = Tier 1 (40%) + Tier 2 (35%)
bullion:     0.20,  // matches Tier 3
stablecoin:  0.05,  // matches Tier 4
```

**Divergence:** Combined fiat target (75 %) matches the blueprint's sum (40+35=75 %), but the **sub-allocation** between cash and sovereign (2/3 cash + 1/3 sovereign per `FIAT_CASH_SHARE = 0.667` and `FIAT_SOVEREIGN_SHARE = 0.333`) gives cash = 50 % and sovereign = 25 % — which **does not match** the blueprint's 40 % cash + 35 % sovereign.

**Root cause:** The implementation uses a 2/3 : 1/3 split within the fiat layer, which gives 50 % cash + 25 % sovereign (combined 75 %). The blueprint specifies 40 % cash + 35 % sovereign (combined 75 %) — a 53.3 % : 46.7 % split.

**Constitutional impact:** Cash allocation is **higher** than blueprint (50 % vs. 40 %); sovereign allocation is **lower** (25 % vs. 35 %). Both are within constitutional ranges (Tier 1: 25-60 %, Tier 2: 20-50 %), so this is a Policy-level divergence, not a Constitutional violation.

**Required correction:** Either:
1. Set `FIAT_CASH_SHARE = 0.533` (40/75) and `FIAT_SOVEREIGN_SHARE = 0.467` (35/75) to match the blueprint's exact 40 %/35 % targets
2. Or: split `LAYER_POLICY_TARGETS` into 4 separate tier targets (cash 40 %, sovereign 35 %, bullion 20 %, stablecoin 5 %)

**Effort:** S (0.5 day)

---

## D-7 · 🟡 MEDIUM — `FIXED_CASH_USD` 8 % Buffer Comment Without Code Enforcement

**Blueprint source:** Part 3 Article I "Minimum Constitutional Buffer", lines 5410-5480:
> "The Institution shall maintain a Minimum Constitutional Buffer of not less than 8 % above the constitutional reserve requirement... Reserve Value ≥ Supply × PAR × 1.08 at all times."

**Implementation:** `src/lib/reserve-allocation.ts` line 107 and `src/lib/nav-compute.ts` line 46:
```ts
export const FIXED_CASH_USD = 32_450_000; // v19.0.9: raised to 8% buffer (constitutional Monte Carlo optimal — 99% survival)
```

**Divergence:** The code **comment** claims an 8 % buffer is "constitutional Monte Carlo optimal", but:
1. There is NO `MIN_CONSTITUTIONAL_BUFFER = 0.08` constant
2. There is NO `bufferCompliant: boolean` field in `ReserveRatioResult`
3. There is NO ratchet mechanism (Council may increase but never decrease)
4. The 8 % buffer is implicit in the chosen `FIXED_CASH_USD` value but is not enforced as a floor — if `FIXED_CASH_USD` were changed to `$29,250,000` (the prior value, ≈ 4.5 % buffer), nothing in the code would block it

**Constitutional impact:** The 8 % Minimum Constitutional Buffer is a **constitutional floor** per Part 3 Article I, but the implementation treats it as a Policy choice. This is a divergence between constitutional text and code-level enforcement.

**Required correction:** Add `MIN_CONSTITUTIONAL_BUFFER = 0.08` constant; add `bufferCompliant: boolean` to `ReserveRatioResult`; add ratchet check in `setMinConstitutionalBuffer()` (only Council can increase, never decrease); add on-chain enforcement in `foundry/src/Reserve.sol`.

**Effort:** M (3 days)

---

## D-8 · 🟡 MEDIUM — Constitution UI Label "Constitutional Strategic Capital" missing for Gold

**Blueprint source:** Part 2 Article X "Constitutional Liquidity Ladder", lines 7458-7481:
> "Constitutional Strategic Capital — Allocated Gold (Tier 3) — the asset of last resort, to be liquidated only when all superior tiers are exhausted. Gold is designated Constitutional Strategic Capital. Gold is not classified as liquidity; it is classified as capital."

**Implementation:** `src/components/transparency.tsx` line 281-284 (correctly labels Gold as "constitutional"), but `src/lib/reserve-allocation.ts` `deriveCurrentLayerWeights()` (lines 393-413) treats gold and silver together as "bullion" — does not separate Gold as "Constitutional Strategic Capital".

**Divergence:** The implementation correctly labels Gold as constitutional in the UI text, but the underlying **data model** treats Gold as part of the "bullion" layer alongside Silver. The blueprint requires Gold to be **reported separately as capital**, not as liquidity.

**Required correction:**
1. Add a 4th weight category `constitutionalCapital` (gold only) in `deriveCurrentLayerWeights()`
2. Update `src/components/transparency.tsx` Reserve Ladder visualization to show 4 tiers (Immediate / Operational / Strategic / Constitutional Strategic Capital)
3. Update `/api/transparency` response to include `reserveLadder` object with 4 tiers

**Effort:** M (2 days)

---

## D-9 · 🟡 MEDIUM — `PAR_VALUE` Constant Present but not Cross-Referenced to §4

**Blueprint source:** Part 2 Article I Invariant 1, line 4295: "Reserve Value ≥ Supply × PAR at all times (PAR = $1.00, face value)."

**Implementation:** `src/lib/monetary-engine-v19.ts` line 122: `export const PAR_VALUE = 1.00;`

**Divergence:** The `PAR_VALUE` constant is correctly defined as $1.00, but the implementation does not cross-reference the constitutional section (§4 or Part 2 Article I Invariant 1) in the constant's documentation. The `CONSTITUTIONAL_CONSTANTS` registry (line 637) lists `RR_min = 1.00` (non-amendable) but does NOT list `PAR_VALUE` as a separate non-amendable constant.

**Constitutional impact:** Low — the value is correct; the documentation is incomplete.

**Required correction:**
1. Add `PAR_VALUE` to `CONSTITUTIONAL_CONSTANTS` array with `modifiable: false, modificationRule: "Constitutional Invariant (§45 / Part 2 Article I Invariant 1)"`
2. Add `PAR_VALUE: 1.00` to `CONSTANTS_REGISTRY.constants`
3. Update `PAR_VALUE` JSDoc to reference Part 2 Article I Invariant 1

**Effort:** S (0.5 day)

---

## D-10 · 🟢 LOW — Documentation Tone: "Mathematical Certainty" Should Be "Mathematical Certainty Subject to Cryptographic Assumptions"

**Blueprint source:** Part 2 Article VII §1 (Cryptographic Verification), lines 6226-6241 — v19 Phase 15 softened over-absolute claims:
> "Under the cryptographic assumptions underlying the chosen proof system, the proof cannot be forged without detection"
> "Cryptographic proof provides mathematical certainty subject to those assumptions"

**Implementation:** `src/app/api/proofs/publish/route.ts` line 25: `"the daily PoR fingerprint"` (correctly hedged); but `src/lib/v19-infrastructure.ts` §37 `ASSURANCE_FRAMEWORK` purposes use absolute language:
- `"Verify reserve existence"` (should be: "Verify reserve existence subject to cryptographic assumptions")
- `"Verify reserve sufficiency"` (should be: "Verify reserve sufficiency subject to cryptographic assumptions")

**Divergence:** The blueprint v19 Phase 15 explicitly softened "mathematical certainty" to "mathematical certainty subject to cryptographic assumptions". The implementation's `ASSURANCE_FRAMEWORK` purposes use the pre-softening absolute language.

**Constitutional impact:** Low — language-level divergence; no runtime impact.

**Required correction:** Update `ASSURANCE_FRAMEWORK` purposes in `src/lib/v19-infrastructure.ts` to use the softened language.

**Effort:** S (0.5 day)

---

## D-11 · 🟢 LOW — `EWMA_LAMBDA = 0.94` Matches RiskMetrics but Blueprint Specifies §17 λ

**Blueprint source:** Part 2 Article VI §17 (Shock Absorber) specifies EWMA decay factor λ.

**Implementation:** `src/lib/monetary-engine-v19.ts` line 144: `export const EWMA_LAMBDA = 0.94; // §17 RiskMetrics decay factor`

**Divergence:** Value matches the standard RiskMetrics λ=0.94 and is recorded as §17 in `CONSTITUTIONAL_CONSTANTS`. **No divergence** — but the documentation should clarify whether λ=0.94 is the constitutionally-mandated value or a Policy choice (per the blueprint's §53.2 amendment rule for modifiable constants).

**Required action:** Confirm λ=0.94 is the blueprint-specified value; document the blueprint line reference in the JSDoc.

**Effort:** S (0.25 day)

---

## D-12 · 🟢 LOW — `OPERATIONAL_CAPITAL_MONTHS = 12` Lacks On-Chain Enforcement

**Blueprint source:** Part 2 Article VI §41 (Operational Capital Buffer): "Operational Capital ≥ 12 months of forward-looking operating expenses."

**Implementation:** `src/lib/v19-infrastructure.ts` line 657: `export const OPERATIONAL_CAPITAL_MONTHS = 12;` and `checkOperationalCapital()` function (lines 666-678).

**Divergence:** The constant is correctly defined and the check function exists, but:
1. `checkOperationalCapital()` is not called by any runtime API (only available as a library function)
2. No on-chain enforcement in `foundry/src/MTQ.sol` or `Reserve.sol`
3. No daily attestation in `/api/proofs/publish`

**Constitutional impact:** The check is available but not enforced — an Institution with < 12 months of operational capital would not be flagged.

**Required correction:**
1. Add `operational_capital` proof type to `/api/proofs/publish`
2. Add `checkOperationalCapital()` call to `/api/transparency` and `/api/infrastructure`
3. Add on-chain enforcement (optional) in a new `OperationalCapital.sol` contract

**Effort:** M (2 days)

---

## SUMMARY

| ID | Severity | Title | Effort |
|---|---|---|---|
| D-1 | 🔴 Critical | Invariant 5 mislabeled (Bullion Preservation vs. Redemption Suspension) | M (3d) |
| D-2 | 🟠 High | Counterparty exposure limits tighter than blueprint (25/30/35 vs. 40/40/50) | S (1d) |
| D-3 | 🟠 High | Reserve layer ranges combined (fiat 70-80%) vs. blueprint separate tiers | M (3d) |
| D-4 | 🟠 High | Haircut values: master-audit's "exact match" claim unverified against blueprint §6 | S (0.5d) |
| D-5 | 🟡 Medium | `constitution-data.ts` LAYER_2 has 7 articles (blueprint: 16) — 9 v19 articles missing from UI | S (1d) |
| D-6 | 🟡 Medium | `FIAT_CASH_SHARE = 0.667` produces 50%/25% cash/sovereign (blueprint: 40%/35%) | S (0.5d) |
| D-7 | 🟡 Medium | 8 % Minimum Constitutional Buffer comment without code enforcement | M (3d) |
| D-8 | 🟡 Medium | Gold not separated as "Constitutional Strategic Capital" in data model | M (2d) |
| D-9 | 🟡 Medium | `PAR_VALUE` not cross-referenced to §4 in constants registry | S (0.5d) |
| D-10 | 🟢 Low | "Mathematical certainty" language not softened per v19 Phase 15 | S (0.5d) |
| D-11 | 🟢 Low | `EWMA_LAMBDA = 0.94` blueprint line reference not documented | S (0.25d) |
| D-12 | 🟢 Low | `OPERATIONAL_CAPITAL_MONTHS = 12` lacks runtime enforcement | M (2d) |

**Total divergences: 12** (1 critical, 3 high, 5 medium, 3 low)

**Total remediation effort: ~17 engineer-days** (excluding overlap with P0/P1 gap closures)

### Top 3 highest-leverage divergences to fix first:

1. **D-1 (Invariant 5 mislabel)** — 3 days; semantic correctness; required for auditor sign-off
2. **D-5 (Constitution UI missing 9 articles)** — 1 day; transparency; required for participant-facing constitution page accuracy
3. **D-7 (8 % Minimum Constitutional Buffer not enforced)** — 3 days; constitutional floor; required for Part 3 Article I compliance

### Divergences that overlap with P0/P1 gap closures:

- D-1 (Invariant 5) overlaps with P0-7 (Invariant 5 re-labelling)
- D-7 (8 % MCB) overlaps with P1-4 (Minimum Constitutional Buffer)
- D-8 (Gold as Capital) overlaps with P0-4 (Reserve Ladder disclosure)

Closing these shared items once will resolve both the divergence and the corresponding gap.
