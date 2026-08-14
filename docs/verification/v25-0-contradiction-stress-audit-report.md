# MITHQAL v25.0 — Contradiction + Stress Audit Report

**Audit ID:** CONTRADICTION-STRESS-AUDIT  
**Generated:** 2026-08-14T23:36:33.854915+00:00  
**Blueprint:** `/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md` (70,345 lines)  
**Agent:** Task Agent ID `CONTRADICTION-STRESS-AUDIT`  

---

## Executive Summary

- **Contradiction patterns with real findings:** **4/10**
- **Unmarked contradiction lines (active body, not historical-flagged):** **5**
- **Stress test results:** PASS=8, FAIL=0, BDL=7 (of 15)
- **Overall risk verdict:** **AMBER — ELEVATED**

## Methodology

- Full 70,320-line blueprint scanned with regex grep for 10 known contradiction patterns.
- For each occurrence, line context (±3 lines) checked for HISTORICAL / NON-NORMATIVE / REJECTED / RETIRED / superseded markers.
- Archive-wide notices (e.g. v19 historical archive notice at line 3605+) credited as weaker marking.
- Forward-references (e.g. §V24.2.1.C2 'this section governs' at line 70035) credited as partial mitigation.
- Implementation file `src/lib/calm.ts` cross-checked against blueprint for 5-state vs 6-state consistency.
- Stress scenarios use Portfolio B (v24.2.1 default) at v25.0 strategic baseline RR=120% (NOT the rejected 102% ceiling).
- BDL scenarios declared BEFORE computation per §47 honesty rule.
- FAIL is NEVER relabeled as BDL.

---

## PART 1 — Blueprint Contradiction Audit

### Pattern Summary Table

| # | Pattern | Findings | Marked Historical? | Unmarked | Verdict |
|---|---------|----------|--------------------|----------|---------|
| 1 | CALM NORMAL=1.15 vs 1.20 | 4 | 3 marked, 1 unmarked | 1 | CONTRADICTION |
| 2 | 102% ceiling (REJECTED by v25.0) | 15 blueprint + 5 code | 15 marked, 0 unmarked | 0 | CONTRADICTION |
| 3 | Reserve ranges (silver 3-8%, gold 12-18%) | 3 | 3 marked, 0 unmarked | 0 | OK |
| 4 | Participant minting | 9 | 9 marked, 0 unmarked | 0 | OK |
| 5 | PAR anchor / 100% reserve-backed | 5 | N/A | 0 | NOT_A_CONTRADICTION |
| 6 | 6-state vs 5-state (calm.ts) | code:2 5-state / 0 6-state; active table:2 | partial | 1 | CONTRADICTION |
| 7 | Silver 3% vs 0% conditional | 11 | 11 marked, 0 unmarked | 0 | OK |
| 8 | Digital 3.5% vs 2.5% | 6 | 3 marked, 3 unmarked | 3 | CONTRADICTION |
| 9 | CBDC language | 0 suspicious (excl. 0 negated) | N/A | 0 | NOT_A_CONTRADICTION |
| 10 | BRICS language | 0 suspicious (excl. 0 negated) | N/A | 0 | NOT_A_CONTRADICTION |

**Total:** 4/10 patterns exhibit real contradictions  
**Unmarked contradiction lines (active body, no inline historical marker):** 5

### Pattern 1 — CALM NORMAL target (1.15 vs 1.20)

v24.2 set NORMAL CALM target = 1.15 (WRONG — below strategic target 1.20). v24.2.1 corrected to 1.20. Search for any remaining `NORMAL=1.15` reading as ACTIVE (not historical).

| Line | Text | In Historical Archive? | Marked Inline? | Severity |
|------|------|-----------------------|----------------|----------|
| 2077 | `| 10 | CALM RR targets | NORMAL=1.15, ELEVATED=1.20, HIGH_STRESS=1.25, CRISIS=1.` | no | yes | OK |
| 1892 | `| NORMAL | 1.15 | **1.20** | = strategic target |` | no | yes | OK |
| 1886 | `v24.2 had NORMAL CALM target = 1.15, which was BELOW the strategic target (1.20)` | no | yes | OK |
| 2106 | `| NORMAL | 16-20% | 13-17% | 3-4% | 3.5% | 55% | ALLOWED | 1.15 |` | no | NO | CONTRADICTION |

**Implementation cross-check (`src/lib/calm.ts`):**
- Line 53: `NORMAL: { rrTarget: 1.20, ... }` — implementation CORRECT (1.20).
- BUT lines 54-56 use OLD 5-state names (ELEVATED, HIGH_STRESS, CRISIS) — see Pattern 6.

**Verdict:** The blueprint ACTIVE v24.2 6-state table (around line 2106) still shows `NORMAL | 1.15`. This is the v24.2 WRONG value; v24.2.1 corrected to 1.20 (line 1892). The active body table was NOT updated in-place — it relies on the v24.2 → v24.2.1 correction table at line 1890-1897 to override. Implementation is correct (1.20), but the blueprint active table is stale.

### Pattern 2 — 102% ceiling (REJECTED by v25.0 §4)

v25.0 directive §4 REJECTS the 102% reserve ceiling. Old v19 Sections 29-34 use 102% as the acceptable threshold. Check if these are marked HISTORICAL.

| Line | Text | In Historical Archive? | Marked Inline? | Severity |
|------|------|-----------------------|----------------|----------|
| 2051 | `- ❌ 102% reserve ceiling (max loss before breach = 1.96% — too narrow)` | no | yes | OK |
| 2052 | `- ❌ RRmax = 102%, RRnormal = 100.5%` | no | yes | OK |
| 20909 | `>102%` | yes | NO | OK |
| 20915 | `100-102%` | yes | NO | OK |
| 20929 | `- Ratio above 102% is acceptable` | yes | NO | OK |
| 20930 | `- Ratio of 100-102% requires enhanced monitoring and minting pause` | yes | NO | OK |
| 20935 | `The Institution's reserve ratio is 105%. This is above 102% and is acceptable. I` | yes | NO | OK |
| 21608 | `>102%` | yes | NO | OK |
| 21609 | `100-102%` | yes | NO | OK |
| 21742 | `- Reserve ratio: acceptable >102%, elevated 100-102%, critical <100%` | yes | NO | OK |
| 31863 | `>102%` | yes | NO | OK |
| 35259 | `The Operations team monitors the reserve ratio in real-time. If the ratio falls ` | yes | NO | OK |
| 39327 | `Ratio <102%` | yes | NO | OK |
| 60696 | `The Institution's reserve ratio is 105%. This is above 102% and is acceptable. I` | yes | NO | OK |
| 66277 | `The Operations team monitors the reserve ratio in real-time. If the ratio falls ` | yes | NO | OK |

**Implementation cross-check (`scripts/portfolio-stress-suite.py`):**
- Line 64: `RR_CEILING = 1.02                  # §46 approved operational ceiling (the "102% ceiling")`
- Line 64: `RR_CEILING = 1.02                  # §46 approved operational ceiling (the "102% ceiling")`
- Line 67: `# Rationale for using RR_CEILING (102%) instead of RR_TARGET (120%) as the stress baseline:`
- Line 68: `# - §46 explicitly tests from the 102% "approved ceiling" to prove it is "not immune to small losses".`
- Line 70: `#   the 102% ceiling (the approved operational buffer above the 100% solvency floor).`

**Verdict:** The reference implementation still uses `RR_CEILING = 1.02` as the stress-test baseline. v25.0 directive REJECTS this ceiling. Implementation must be updated to use the strategic target RR=1.20 as the baseline (this audit does so).

**Blueprint verdict:** All 102% mentions inside the v19 historical archive (lines 20884, 21583, 21717, 31838, 35234, 39302) are covered by the archive notice at line 3605+. Mentions at lines 60671, 66252 (inside Section 57 REGENERATED content) are NOT explicitly covered by an inline marker and NOT explicitly inside the v19 archive scope (Section 57 is in the v24.2 PRESERVED area). These are POTENTIAL UNMARKED contradictions.

### Pattern 3 — Reserve ranges (silver 3-8%, gold 12-18%, stablecoin 2-8%)

v24.2 unified to Bullion 15-25%, Fiat 70-85%, Digital 0-5%. v19 used 'stablecoin 2-8%' and 'gold 12-18%, silver 3-8%'. Check if old ranges are marked historical.

| Pattern | Line | Text | In Archive? | Marked Inline? | Forward-ref? | Severity |
|---------|------|------|-------------|----------------|--------------|----------|
| silver 3-8% (v19 range) | 3007 | `- Bullion: 15-25% (gold 12-18%, silver 3-8%)` | no | NO | yes | OK |
| silver 3-8% (v19 range) | 69905 | `**Key change from v24.1**: v24.1 set silver at 5% (range 3-8` | yes | yes | yes | OK |
| gold 12-18% (v19/v24 range) | 3007 | `- Bullion: 15-25% (gold 12-18%, silver 3-8%)` | no | NO | yes | OK |

**Verdict:** Lines 2975 (silver 5% target, 3-8% range), 3007 (silver 3-8%), 3032 (75% gold / 25% silver default) are in the v24.2.1 ACTIVE body. They are NOT marked historical INLINE. A forward-reference at line 70035 (§V24.2.1.C2: 'Where any earlier section conflicts... this section governs') acknowledges the silver conflicts. This is partial mitigation — the old values are still in the active body but a later section declares itself authoritative. The gold 12-18% range is NOT a contradiction (still valid).

### Pattern 4 — Participant minting (v25.0 prohibits direct)

v25.0 prohibits direct participant minting. v19 Article I says 'participant deposits assets and mints MTQ.' Check if this is marked historical.

- v25.0 RETIRE notice at line **287**.
- Archive-wide notice at line **1172** (covers all preserved v24.2.1 content after this line).

| Line | Text | In Archive? | Marked Inline? | Via Archive Notice? | Severity |
|------|------|-------------|----------------|---------------------|----------|
| 287 | `**OLD (v24.2 — RETIRED):** "Participant deposits assets and ` | no | yes | no | OK |
| 9822 | `A participant deposits $10,000,000 in eligible reserve asset` | yes | yes | yes | OK |
| 10693 | `A participant deposits eligible assets. The deposit is verif` | yes | yes | yes | OK |
| 19537 | `A participant mints 1,000,000 MTQ at NAV of $1.00. The minti` | yes | yes | yes | OK |
| 24834 | `A participant deposits $10,000,000 in eligible reserve asset` | yes | yes | yes | OK |
| 56927 | `A participant deposits $10,000,000 in eligible reserve asset` | yes | yes | yes | OK |
| 57384 | `A participant deposits eligible assets. The deposit is verif` | yes | yes | yes | OK |
| 60087 | `A participant mints 1,000,000 MTQ at NAV of $1.00. The minti` | yes | yes | yes | OK |
| 62162 | `A participant deposits $10,000,000 in eligible reserve asset` | yes | yes | yes | OK |

**Verdict:** All occurrences of 'participant deposits ... mints MTQ' are either (a) inside the v19 historical archive (covered by archive notice) or (b) inside the v24.2.1 PRESERVED area (covered by the archive-wide notice at line 1172). NO occurrence is unmarked. However, individual mentions do NOT carry inline `[HISTORICAL]` markers — they rely entirely on the archive-wide notice. This is weaker marking than would be ideal.

### Pattern 5 — PAR anchor (100% reserve-backed vs $1.00 USD reference)

v25.0 says 'PAR=$1.00 USD reference unit, NOT USD-backed.' v19 says '100% reserve-backed.' Check for contradictions about what backs MTQ.

**Verdict:** NOT A REAL CONTRADICTION. The two statements refer to different concepts:
- 'Reserve-backed' = the asset portfolio that backs MTQ (diversified multi-currency + bullion + digital).
- 'PAR=$1.00 USD reference unit' = the unit of account (USD-denominated).

v25.0 §3.1 (line 2508) explicitly clarifies: 'PAR = $1.00 is a USD-denominated settlement unit, NOT a USD-backed monetary identity. MITHQAL is not saying MTQ is backed by USD. It is saying MTQ has a fixed accounting/redemption reference of one U.S. dollar.'

- v25.0 PAR clarifications: 4 found (lines: 2508, 2508, 2508, 202...)
- 'reserve-backed' / 'fully backed by reserves' mentions: 5 (all inside v19/v18 historical archives or consistent with v25.0).

### Pattern 6 — 6-state vs 5-state (CALM module inconsistency)

v24.2 uses 6 states (NORMAL/CAUTION/DEFENSIVE/STRESS/EMERGENCY/RECOVERY). v24.1 used 5 states (NORMAL/ELEVATED/HIGH_STRESS/CRISIS/RECOVERY). CALM module (`src/lib/calm.ts`) uses the OLD 5-state names.

**Blueprint (v24.2.1 active area):**
- 6-state machine table at lines: 2070, 2077, 2098
- Active NORMAL=1.15 stale table at lines: 1892, 2106 (should be 1.20)
- 5-state mentions in blueprint (historical): 2

**Implementation (`src/lib/calm.ts`):**
- 5-state mentions: 2 (lines: 54, 55)
- 6-state mentions: 0

**Verdict:** **REAL CONTRADICTION.** The blueprint prescribes a 6-state machine, but the implementation uses the OLD 5-state names. Additionally, the active v24.2 6-state table in the blueprint still shows NORMAL=1.15 (the v24.2 WRONG value), even though v24.2.1 corrected it to 1.20. Implementation must be refactored to use the 6-state names; blueprint active table must be updated in-place to NORMAL=1.20.

### Pattern 7 — Silver target 3% (v24.2) vs 0% conditional (v24.2.1/v25.0)

v24.2 says 3% silver. v24.2.1 says 0% silver (conditional). v25.0 confirms 0%.

| Line | Text | In Archive? | Marked Inline? | Forward-ref? | Severity |
|------|------|-------------|----------------|--------------|----------|
| 1945 | `Silver normal target = 0% (was 3% in v24.2)` | no | yes | yes | OK |
| 2068 | `| 1 | Silver strategic target | 5% | 3% | B | Reduced volati` | no | yes | yes | OK |
| 69404 | `**Operational implication**: The v24.2.1 conditional silver ` | yes | yes | yes | OK |
| 69898 | `Silver normal target      = 0%   (default; was 3% in v24.2, ` | yes | yes | yes | OK |
| 69903 | `**Key change from v24.2**: v24.2 set silver as a mandatory s` | yes | yes | yes | OK |
| 70088 | `- **v24.2**: Silver strategic target = 3% (range 3-6%). Redu` | yes | yes | no | OK |
| 70089 | `- **v24.2.1**: Silver strategic target = 0% (conditional ban` | yes | yes | no | OK |
| 2253 | `| Silver | 3% | 3-6% |` | no | NO | yes | OK |
| 1872 | `51. Silver 5% (range 3-8%) — optimal per grid test` | no | NO | yes | OK |
| 3007 | `- Bullion: 15-25% (gold 12-18%, silver 3-8%)` | no | NO | yes | OK |
| 69905 | `**Key change from v24.1**: v24.1 set silver at 5% (range 3-8` | yes | yes | yes | OK |

- v24.2.1/v25.0 confirmations of 0% silver: 11 (e.g. lines 1977, 17834, 59526, 69323, 69328...)

**Verdict:** Old 3% / 5% / 3-8% silver language persists in the active body (lines 2106 6-state table 'Silver Target 3-4%', 2975 'Silver 5% | 3-8%', 3032 '75% gold / 25% silver default'). These are NOT marked historical INLINE. They are covered by the §V24.2.1.C2 forward-reference at line 70035 ('Where any earlier section conflicts... this section governs'). Partial mitigation — but the active body still contains contradictory numeric values.

### Pattern 8 — Digital target 3.5% (v24.1) vs 2.5% (v24.2/v24.2.1)

v24.1 had 3.5% digital. v24.2 reduced to 2.5%. Check for contradictions.

| Line | Text | In Archive? | Marked Inline? | Forward-ref? | Severity |
|------|------|-------------|----------------|--------------|----------|
| 2356 | `| Policy target | 20% bullion / 76.5% fiat / 3.5% digital | ` | no | NO | no | CONTRADICTION |
| 45952 | `Numerical examples throughout this Constitution use the Cons` | yes | NO | no | OK |
| 2266 | `2. **Canonical policy target unified:** Bullion 20%, Fiat 76` | no | yes | no | OK |
| 2392 | `- Pillar C — Digital Liquidity Sleeve (Eligible stablecoins ` | no | NO | no | CONTRADICTION |
| 3575 | `Digital target = 3.5%` | no | NO | no | OK |
| 2965 | `| **C — Digital Liquidity** | Eligible stablecoins + tokeniz` | no | NO | no | CONTRADICTION |

- v24.2/v24.2.1 confirmations of 2.5% digital: 1 (e.g. lines 2255...)

**Verdict:** The active body tables at lines 2356 ('Policy target 20% bullion / 76.5% fiat / 3.5% digital'), 2392 ('Pillar C — Digital Liquidity Sleeve ... policy target 3.5%'), and 2965 ('C — Digital Liquidity | ... | 3.5% | 0-5%') still show the v24.1 value of 3.5%. v24.2 reduced the digital strategic target to 2.5% (line 2069 amendment registry; v24.2.1 Portfolio B confirms 2.5% at line 70097). UNLIKE silver (which has the §V24.2.1.C2 forward-reference at line 70035 acknowledging the conflict), there is NO equivalent forward-reference for the digital target. **UNMARKED CONTRADICTION.**

### Pattern 9 — CBDC language

v25.0 says 'CBDCs remain sovereign liabilities.' v19 may have language implying MTQ is CBDC-like.

- Suspicious 'MTQ is CBDC' mentions (after excluding negated contexts): **0**
- Negated hits excluded (e.g. 'MTQ is NOT a CBDC'): **0**
- v25.0 clarifications found: **3** (e.g. line 425: 'CBDCs remain liabilities of their issuing central banks. MTQ does not become another CBDC.')

**Verdict:** **NOT A CONTRADICTION.** No blueprint language was found AFFIRMATIVELY implying MTQ is CBDC-like or a sovereign liability. All apparent hits were in negated contexts ('MTQ is NOT a CBDC'). v25.0 §V25.0.7 explicitly states CBDCs remain sovereign liabilities and MTQ does not become another CBDC.

### Pattern 10 — BRICS language

The BRICS amendment says 'MTQ is not BRICS money.' Check if any older sections imply BRICS alignment.

- Suspicious 'MTQ is BRICS' mentions (after excluding negated contexts): **0**
- Negated hits excluded: **0**
- v25.0 clarifications found: **2** (e.g. line 1723: 'MTQ is not BRICS money.')

**Verdict:** **NOT A CONTRADICTION.** No blueprint language was found AFFIRMATIVELY claiming MTQ IS BRICS money or BRICS-aligned. The BRICS Neutrality Amendment explicitly states MTQ is NOT BRICS money and remains independently functional regardless of BRICS.

---

## PART 2 — Top-Class Stress Tests (15 Extreme Scenarios)

### Setup

- **Portfolio B** (v24.2.1 default): 15% physical gold + 5% PAXG tokenized gold + 0% silver + 77.5% fiat + 2.5% digital
- **Baseline RR:** 1.20 (v25.0 strategic target — NOT the rejected 1.02 ceiling)
- **Supply:** 54,000,000 MTQ; **Liability:** $54,000,000.0
- **Adjusted reserve baseline:** $64,800,000
- **Hard constraints (§47):** RR ≥ 1.00, StressRR ≥ 0.80, LCR ≥ 1.00
- **HQLA:** fiat + digital (bullion NOT HQLA per §3.8)
- **BDL scenarios:** declared BEFORE computation per §47 honesty rule

### Stress Test Results

| # | Scenario | Type | RR_after | StressRR | LCR | Class |
|---|----------|------|---------|----------|-----|-------|
| S01 | US Treasury default | BDL | 1.0999 | 0.9977 | 1.7197 | **BDL** |
| S02 | Gold market closure (30 days) | DESIGN | 1.1910 | 1.0846 | 3.2000 | **PASS** |
| S03 | PAXG issuer failure (Paxos insolvency) | BDL | 1.1400 | 1.0419 | 2.4000 | **BDL** |
| S04 | Multi-custodian failure (2 of 4) | BDL | 1.0200 | 0.9273 | 1.9200 | **BDL** |
| S05 | Stablecoin depeg cascade (USDC + USDP + EURC) | DESIGN | 1.1850 | 1.0809 | 3.1500 | **PASS** |
| S06 | Correlation collapse (rho → 1.0, all assets decline) | DESIGN | 1.1460 | 1.0448 | 3.1800 | **PASS** |
| S07 | Redemption bank run (80% in 48h) | BDL | 1.1640 | 1.0604 | 1.2000 | **BDL** |
| S08 | Oracle failure cascade (all 4 sources) | DESIGN | 1.1400 | 1.0382 | 4.5600 | **PASS** |
| S09 | Ethereum outage (7 days — PAXG chain) | DESIGN | 1.1940 | 1.0878 | 4.8000 | **PASS** |
| S10 | US JSG isolation | DESIGN | 1.1444 | 1.0400 | 4.5218 | **PASS** |
| S11 | Governance attack (4/7 council captured) | BDL | 1.2000 | 1.0929 | 6.4000 | **BDL** |
| S12 | Interest rate shock (+500bps USD) | DESIGN | 1.1791 | 1.0737 | 4.6954 | **PASS** |
| S13 | Gold crash (-50% in 7 days) | BDL | 1.0800 | 0.9846 | 3.2000 | **BDL** |
| S14 | FX crisis (all non-USD -20%) | DESIGN | 1.0696 | 0.9753 | 4.1482 | **PASS** |
| S15 | Combined black swan (gold -30% + PAXG -50% + stablecoin -50% + custody 5% + FX -15%) | BDL | 0.9942 | 0.9085 | 1.6944 | **BDL** |

### Scenario Details

#### S01 — US Treasury default

- **Type:** BDL
- **Description:** US Treasury defaults — USD sovereign holdings impaired 60%
- **Shocks:** `{'fiat_USD_sovereign': 0.4}`
- **Redemption pressure:** 50% of supply
- **RR_after:** 1.0999 (adjusted reserve $59,392,564 / liability $54,000,000.0)
- **StressRR:** 0.9977 (stress reserve $53,878,055 / liability $54,000,000.0)
- **LCR:** 1.7197 (HQLA $46,432,564 / 30-day outflows $27,000,000)
- **Classification:** **BDL**
- **Reason:** Per §47 honesty: a US sovereign default is EXPLICITLY outside the approved design envelope (the §3.6 sovereign stress coefficient assumes worst = 0.80, not 0.0). Design assumes G7 sovereigns NEVER default. Declared BDL BEFORE computation per §47.
- **BDL rationale (declared BEFORE computation per §47):** Per §47 honesty: a US sovereign default is EXPLICITLY outside the approved design envelope (the §3.6 sovereign stress coefficient assumes worst = 0.80, not 0.0). Design assumes G7 sovereigns NEVER default. Declared BDL BEFORE computation per §47.

#### S02 — Gold market closure (30 days)

- **Type:** DESIGN
- **Description:** Gold market closes for 30 days; physical redemption blocked
- **Shocks:** `{}`
- **Redemption pressure:** 30% of supply
- **RR_after:** 1.1910 (adjusted reserve $64,314,000 / liability $54,000,000.0)
- **StressRR:** 1.0846 (stress reserve $58,567,999 / liability $54,000,000.0)
- **LCR:** 3.2000 (HQLA $51,840,000 / 30-day outflows $16,200,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1910 >= 1.00, StressRR=1.0846 >= 0.80, LCR=3.2000 >= 1.00

#### S03 — PAXG issuer failure (Paxos insolvency)

- **Type:** BDL
- **Description:** Paxos insolvency — 5% tokenized gold sleeve impaired 100%
- **Shocks:** `{'tokenized_gold_paxg': 0.0}`
- **Redemption pressure:** 40% of supply
- **RR_after:** 1.1400 (adjusted reserve $61,560,000 / liability $54,000,000.0)
- **StressRR:** 1.0419 (stress reserve $56,261,119 / liability $54,000,000.0)
- **LCR:** 2.4000 (HQLA $51,840,000 / 30-day outflows $21,600,000)
- **Classification:** **BDL**
- **Reason:** Per §47: full PAXG tokenized-gold impairment is the §3.6 BDL example. The 5% PAXG sleeve is uninsured against full issuer failure; design assumes max 50% impairment, not 100%. Declared BDL BEFORE computation per §47 honesty rule.
- **BDL rationale (declared BEFORE computation per §47):** Per §47: full PAXG tokenized-gold impairment is the §3.6 BDL example. The 5% PAXG sleeve is uninsured against full issuer failure; design assumes max 50% impairment, not 100%. Declared BDL BEFORE computation per §47 honesty rule.

#### S04 — Multi-custodian failure (2 of 4)

- **Type:** BDL
- **Description:** Brinks + Loomis fail simultaneously — 60% of physical gold lost
- **Shocks:** `{'physical_gold': 0.0}`
- **Redemption pressure:** 50% of supply
- **RR_after:** 1.0200 (adjusted reserve $55,080,000 / liability $54,000,000.0)
- **StressRR:** 0.9273 (stress reserve $50,072,719 / liability $54,000,000.0)
- **LCR:** 1.9200 (HQLA $51,840,000 / 30-day outflows $27,000,000)
- **Classification:** **BDL**
- **Reason:** Per §47: simultaneous failure of 2 of 4 custodians breaches the §11 single-custodian concentration cap (25%); the §3.6 stress coefficient assumes worst = single-custodian failure (5% loss). Two simultaneous custodian failures = ~60% bullion loss is EXPLICITLY beyond design. Declared BDL BEFORE computation.
- **BDL rationale (declared BEFORE computation per §47):** Per §47: simultaneous failure of 2 of 4 custodians breaches the §11 single-custodian concentration cap (25%); the §3.6 stress coefficient assumes worst = single-custodian failure (5% loss). Two simultaneous custodian failures = ~60% bullion loss is EXPLICITLY beyond design. Declared BDL BEFORE computation.

#### S05 — Stablecoin depeg cascade (USDC + USDP + EURC)

- **Type:** DESIGN
- **Description:** All 3 stablecoin issuers depeg simultaneously for 48h
- **Shocks:** `{'digital': 0.5}`
- **Redemption pressure:** 30% of supply
- **RR_after:** 1.1850 (adjusted reserve $63,990,000 / liability $54,000,000.0)
- **StressRR:** 1.0809 (stress reserve $58,367,119 / liability $54,000,000.0)
- **LCR:** 3.1500 (HQLA $51,030,000 / 30-day outflows $16,200,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1850 >= 1.00, StressRR=1.0809 >= 0.80, LCR=3.1500 >= 1.00

#### S06 — Correlation collapse (rho → 1.0, all assets decline)

- **Type:** DESIGN
- **Description:** All asset correlations converge to 1.0; everything declines 20%
- **Shocks:** `{'physical_gold': 0.8, 'tokenized_gold_paxg': 0.8, 'silver': 0.8, 'fiat': 0.8, 'digital': 0.8}`
- **Redemption pressure:** 30% of supply
- **RR_after:** 1.1460 (adjusted reserve $61,884,000 / liability $54,000,000.0)
- **StressRR:** 1.0448 (stress reserve $56,416,639 / liability $54,000,000.0)
- **LCR:** 3.1800 (HQLA $51,516,000 / 30-day outflows $16,200,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1460 >= 1.00, StressRR=1.0448 >= 0.80, LCR=3.1800 >= 1.00

#### S07 — Redemption bank run (80% in 48h)

- **Type:** BDL
- **Description:** 80% of MTQ supply redeemed in 48 hours
- **Shocks:** `{}`
- **Redemption pressure:** 80% of supply
- **RR_after:** 1.1640 (adjusted reserve $62,856,000 / liability $54,000,000.0)
- **StressRR:** 1.0604 (stress reserve $57,260,659 / liability $54,000,000.0)
- **LCR:** 1.2000 (HQLA $51,840,000 / 30-day outflows $43,200,000)
- **Classification:** **BDL**
- **Reason:** Per §47: §3.8 LCR design assumes worst 30-day net outflows = 30% of supply. 80% in 48h is 2.67x beyond design and triggers fire-sale losses on illiquid bullion. Declared BDL BEFORE computation.
- **BDL rationale (declared BEFORE computation per §47):** Per §47: §3.8 LCR design assumes worst 30-day net outflows = 30% of supply. 80% in 48h is 2.67x beyond design and triggers fire-sale losses on illiquid bullion. Declared BDL BEFORE computation.

#### S08 — Oracle failure cascade (all 4 sources)

- **Type:** DESIGN
- **Description:** All 4 oracle sources fail simultaneously — system falls back to last-known-good prices
- **Shocks:** `{}`
- **Redemption pressure:** 20% of supply
- **RR_after:** 1.1400 (adjusted reserve $61,560,000 / liability $54,000,000.0)
- **StressRR:** 1.0382 (stress reserve $56,064,363 / liability $54,000,000.0)
- **LCR:** 4.5600 (HQLA $49,248,000 / 30-day outflows $10,800,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1400 >= 1.00, StressRR=1.0382 >= 0.80, LCR=4.5600 >= 1.00

#### S09 — Ethereum outage (7 days — PAXG chain)

- **Type:** DESIGN
- **Description:** Ethereum mainnet down 7 days — PAXG sleeve illiquid
- **Shocks:** `{}`
- **Redemption pressure:** 20% of supply
- **RR_after:** 1.1940 (adjusted reserve $64,476,000 / liability $54,000,000.0)
- **StressRR:** 1.0878 (stress reserve $58,739,719 / liability $54,000,000.0)
- **LCR:** 4.8000 (HQLA $51,840,000 / 30-day outflows $10,800,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1940 >= 1.00, StressRR=1.0878 >= 0.80, LCR=4.8000 >= 1.00

#### S10 — US JSG isolation

- **Type:** DESIGN
- **Description:** US Jurisdictional Settlement Gateway isolated — USD leg frozen, rest of network operates
- **Shocks:** `{'fiat_USD': 0.5}`
- **Redemption pressure:** 20% of supply
- **RR_after:** 1.1444 (adjusted reserve $61,795,869 / liability $54,000,000.0)
- **StressRR:** 1.0400 (stress reserve $56,161,195 / liability $54,000,000.0)
- **LCR:** 4.5218 (HQLA $48,835,869 / 30-day outflows $10,800,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1444 >= 1.00, StressRR=1.0400 >= 0.80, LCR=4.5218 >= 1.00

#### S11 — Governance attack (4/7 council captured)

- **Type:** BDL
- **Description:** Malicious council captures 4/7 seats — attempts to subvert invariants
- **Shocks:** `{}`
- **Redemption pressure:** 15% of supply
- **RR_after:** 1.2000 (adjusted reserve $64,800,000 / liability $54,000,000.0)
- **StressRR:** 1.0929 (stress reserve $59,015,119 / liability $54,000,000.0)
- **LCR:** 6.4000 (HQLA $51,840,000 / 30-day outflows $8,100,000)
- **Classification:** **BDL**
- **Reason:** Per §47: governance attack by supermajority is outside the approved risk envelope. The §25 invariants (no-discretionary-minting, no-lending, reserve-segregation) are CONSTITUTIONAL INVARIANTS that even a 4/7 council CANNOT override. However, a captured council could ATTEMPT to: (a) approve in-kind redemptions in distressed asset categories, (b) reclassify eligible assets, (c) trigger emergency mode. The MATHEMATICAL outflow under invariant preservation is bounded but the GOVERNANCE-PROCESS damage is unbounded. Declared BDL because §47 covers 'governance capture' scenarios.
- **BDL rationale (declared BEFORE computation per §47):** Per §47: governance attack by supermajority is outside the approved risk envelope. The §25 invariants (no-discretionary-minting, no-lending, reserve-segregation) are CONSTITUTIONAL INVARIANTS that even a 4/7 council CANNOT override. However, a captured council could ATTEMPT to: (a) approve in-kind redemptions in distressed asset categories, (b) reclassify eligible assets, (c) trigger emergency mode. The MATHEMATICAL outflow under invariant preservation is bounded but the GOVERNANCE-PROCESS damage is unbounded. Declared BDL because §47 covers 'governance capture' scenarios.

#### S12 — Interest rate shock (+500bps USD)

- **Type:** DESIGN
- **Description:** USD rates rise 500bps — sovereign bond MTM impact
- **Shocks:** `{}`
- **Redemption pressure:** 20% of supply
- **RR_after:** 1.1791 (adjusted reserve $63,670,050 / liability $54,000,000.0)
- **StressRR:** 1.0737 (stress reserve $57,979,608 / liability $54,000,000.0)
- **LCR:** 4.6954 (HQLA $50,710,050 / 30-day outflows $10,800,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.1791 >= 1.00, StressRR=1.0737 >= 0.80, LCR=4.6954 >= 1.00

#### S13 — Gold crash (-50% in 7 days)

- **Type:** BDL
- **Description:** Gold drops 50% in 7 days
- **Shocks:** `{'physical_gold': 0.5, 'tokenized_gold_paxg': 0.5}`
- **Redemption pressure:** 30% of supply
- **RR_after:** 1.0800 (adjusted reserve $58,320,000 / liability $54,000,000.0)
- **StressRR:** 0.9846 (stress reserve $53,166,919 / liability $54,000,000.0)
- **LCR:** 3.2000 (HQLA $51,840,000 / 30-day outflows $16,200,000)
- **Classification:** **BDL**
- **Reason:** Per §47 + §3.6: §3.6 worst-eligible gold stress coefficient = 0.92 (i.e., gold -8% under stress). The §45 §1 gold shock library defines max = -50% as the boundary scenario, but v25.0 directive §4 REJECTS the 102% ceiling specifically because max loss before breach = 1.96% is too narrow. A -50% gold move at RR_baseline=120% (Portfolio B with 20% bullion) implies 10% reserve loss = RR drops from 120% to 108% (likely still PASS). However the v24.2.1 design envelope max is -25%. Declared BDL because it exceeds the design envelope (-25%).
- **BDL rationale (declared BEFORE computation per §47):** Per §47 + §3.6: §3.6 worst-eligible gold stress coefficient = 0.92 (i.e., gold -8% under stress). The §45 §1 gold shock library defines max = -50% as the boundary scenario, but v25.0 directive §4 REJECTS the 102% ceiling specifically because max loss before breach = 1.96% is too narrow. A -50% gold move at RR_baseline=120% (Portfolio B with 20% bullion) implies 10% reserve loss = RR drops from 120% to 108% (likely still PASS). However the v24.2.1 design envelope max is -25%. Declared BDL because it exceeds the design envelope (-25%).

#### S14 — FX crisis (all non-USD -20%)

- **Type:** DESIGN
- **Description:** All non-USD currencies drop 20% vs USD simultaneously
- **Shocks:** `{'fiat_non_USD': 0.8}`
- **Redemption pressure:** 20% of supply
- **RR_after:** 1.0696 (adjusted reserve $57,760,131 / liability $54,000,000.0)
- **StressRR:** 0.9753 (stress reserve $52,664,500 / liability $54,000,000.0)
- **LCR:** 4.1482 (HQLA $44,800,131 / 30-day outflows $10,800,000)
- **Classification:** **PASS**
- **Reason:** RR_after=1.0696 >= 1.00, StressRR=0.9753 >= 0.80, LCR=4.1482 >= 1.00

#### S15 — Combined black swan (gold -30% + PAXG -50% + stablecoin -50% + custody 5% + FX -15%)

- **Type:** BDL
- **Description:** Multi-factor tail: gold -30%, PAXG -50%, stablecoin -50%, custody 5%, FX -15%
- **Shocks:** `{'physical_gold': 0.7, 'tokenized_gold_paxg': 0.5, 'digital': 0.5, 'fiat_non_USD': 0.85}`
- **Redemption pressure:** 50% of supply
- **RR_after:** 0.9942 (adjusted reserve $53,687,952 / liability $54,000,000.0)
- **StressRR:** 0.9085 (stress reserve $49,058,289 / liability $54,000,000.0)
- **LCR:** 1.6944 (HQLA $45,750,098 / 30-day outflows $27,000,000)
- **Classification:** **BDL**
- **Reason:** Per §47: this is the EXPLICIT BDL example named in the directive. Multi-factor tail event combining 5 simultaneous shocks; by construction outside any single-asset design envelope. Declared BDL BEFORE computation per §47 honesty rule.
- **BDL rationale (declared BEFORE computation per §47):** Per §47: this is the EXPLICIT BDL example named in the directive. Multi-factor tail event combining 5 simultaneous shocks; by construction outside any single-asset design envelope. Declared BDL BEFORE computation per §47 honesty rule.

### Stress Test Summary

- **PASS:** 8 / 15
- **FAIL:** 0 / 15
- **BDL (declared BEFORE computation per §47):** 7 / 15

**Honest interpretation:**

- 7 scenarios are EXPLICITLY outside the v25.0 design envelope (declared BDL up-front per §47). This reflects the HONEST acknowledgment that the protocol's design cannot guarantee survival against truly extreme events (sovereign default, full PAXG failure, multi-custodian failure, 80% bank run, governance capture, combined black swan). These are NOT failures of implementation — they are explicit design boundaries. The §47 honesty rule (never relabel FAIL as BDL) is honored.


- 8 scenarios PASSED — the design envelope held.

---

## Overall Risk Verdict

### **AMBER — ELEVATED**

- **Contradictions:** 4/10 patterns exhibit real contradictions; 5 unmarked lines in active body.
- **Stress:** 8 PASS, 0 FAIL, 7 BDL of 15.

### Recommended Next Actions

1. **Update blueprint active 6-state table at line 2106**: change NORMAL RR from `1.15` to `1.20` (per v24.2.1 directive). Add inline `[HISTORICAL — superseded by v24.2.1 §5]` marker on the original v24.2 table for traceability.
2. **Refactor `src/lib/calm.ts`** to use the v24.2 6-state names (NORMAL/CAUTION/DEFENSIVE/STRESS/EMERGENCY/RECOVERY) instead of the legacy 5-state names (NORMAL/ELEVATED/HIGH_STRESS/CRISIS/RECOVERY).
3. **Update `scripts/portfolio-stress-suite.py`** to use the v25.0 strategic baseline RR=1.20 (NOT the rejected `RR_CEILING = 1.02`). The 102% ceiling is REJECTED per v25.0 directive §4.
4. **Add inline historical markers** on lines 2975, 3007, 3032, 2356, 2965 (old silver 3-8% / 5%, digital 3.5%, 75/25 gold-silver default) referencing §V24.2.1.C2 for silver and a NEW §V24.2.1.C3-style forward-reference for digital. Don't rely solely on forward-references — make the conflict visible at the point of contradiction.
5. **Investigate Section 57 (Institutional Continuity Framework)** at lines 50934+ for the 102% mentions at 60671, 66252 — determine if these are duplicate v19 content that should be marked historical or moved to the v19 archive.
6. **Acknowledge the 5 BDL scenarios** in the institutional risk register as explicit design boundaries — these are NOT failures but acknowledge the protocol's survival limits under extreme events (sovereign default, PAXG issuer failure, multi-custodian failure, bank run, governance capture, combined black swan).
7. **Address any FAIL scenarios** — if any DESIGN-envelope scenario failed, this indicates a real implementation gap that must be closed before mainnet authorization.

### Files Produced

- Script: `scripts/contradiction-stress-audit.py`
- JSON: `docs/verification/v25-0-contradiction-stress-audit.json`
- Report: `docs/verification/v25-0-contradiction-stress-audit-report.md`

---

*End of report — generated 2026-08-14T23:36:33.855460+00:00*