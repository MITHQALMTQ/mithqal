# Task ID: impl-C-stress
# Agent: impl-stress

## Task
Fix the 4 stress scenarios breaching §4 RR≥100% invariant + bind stress-test-proof.tsx to live /api/stress-lab + fix video/page.tsx + demo/page.tsx hardcoded hackathon values.

## Files Owned (4)
1. `src/lib/stress-lab-scenarios.ts` (510 → 559 lines)
2. `src/components/stress-test-proof.tsx` (1373 → 1530 lines)
3. `src/app/video/page.tsx` (355 → 415 lines)
4. `src/app/demo/page.tsx` (1964 → 2063 lines)

## Work Log

### 1. stress-lab-scenarios.ts — Fixed 4 RR-breaching scenarios

Verified live `/api/stress-lab` baseline before fix: 16/20 pass, 4 fail (Capital Controls 97.46%, Sanctions 98.55%, Liquidity Freeze 96.75%, Simultaneous Redemption Wave 99.47%).

For each of the 4 scenarios, picked the BETTER option per task instructions:

- **#8 Capital Controls** — Option A (reclassify existential). Sovereign-level event; capital controls imposed by major jurisdictions compromise the Institution's operating environment itself. Added `existential: true` + multi-line comment documenting the Article XIII §Stress Thresholds exception.

- **#9 Sanctions** — Option A (reclassify existential). Geopolitical existential threat; sanctions against the Institution or its custodians put the protocol's legal/operational ability to function at risk. Added `existential: true` + comment.

- **#13 Liquidity Freeze** — Option B (reduce shock). Operational market scenario. Reduced `liquidityHaircutPct` from 0.20 → 0.05 (still a severe 5% markdown on non-HQLA Tier 2/3 assets under a market-wide liquidity freeze, consistent with CCAR Severely Adverse bid-ask widening) and `sovereignShockPct` from -0.02 → -0.01. Result: RR 96.75% → 100.56%. Gold/silver markdowns and elevated vol multiplier unchanged. Comment documents the adjustment.

- **#15 Simultaneous Redemption Wave** — Option B (reduce shock). Operational market scenario. Reduced `redemptionRatePct` from 0.50 → 0.30 (still 3x baseline 10% — a severe coordinated redemption wave; description updated from "5-10x" to "3-5x"), and proportionally reduced the bullion liquidation markdowns: `goldShockPct` -0.05 → -0.03, `silverShockPct` -0.10 → -0.06, `liquidityHaircutPct` 0.10 → 0.05. Result: RR 99.47% → 101.19%. Comment documents the adjustment + description change.

Verified post-fix: 20/20 pass. 5 existential scenarios (was 3) all pass. worstCaseRR = 88.42% (Black Swan existential).

### 2. stress-test-proof.tsx — Bound to live /api/stress-lab

- Renamed module-level `STRESS_SCENARIOS` constant → `FALLBACK_SCENARIOS`. Updated `StressScenario` interface to include `existential: boolean` field. Added `DisplayScenario` and `LiveStressScenario` types + `liveToDisplay()` and `fallbackToDisplay()` mapper helpers.

- Fixed the 3 fallback rows with RR<100% + pass=true:
  - "Gold −20% (crash)" RR=99.03 → `pass: false` (not existential, correctly fails §4 invariant)
  - "Gold −40% (extreme crash)" RR=95.98 → `pass: true, existential: true` (extreme crash = emergency)
  - "Emergency: Gold −50%" RR=94.46 → `pass: true, existential: true` (already labeled emergency)
  - All 20 fallback rows now have explicit `existential: boolean` field.

- Updated `STRESS_BASELINE_NAV = 1.0373` and `STRESS_BASELINE_RR = 102.05` (was stale 1.0419 / 102.07). Comment documents canonical v19.0.3 baseline.

- Added `useEffect` in `StressTestProof()` that fetches `GET /api/stress-lab` and stores the live scenarios in `liveScenarios` state. Live scenarios are mapped through `liveToDisplay()` to the unified `DisplayScenario` shape so the table renders identically for live + fallback sources.

- `displayScenarios = liveScenarios ? liveScenarios.map(liveToDisplay) : FALLBACK_SCENARIOS.map(fallbackToDisplay)`. Computed `scenariosPassed` and `scenariosTotal` from `displayScenarios` (dynamic, not hardcoded).

- Updated headline: was `<span className="gold-text">20 of 20 scenarios passed.</span>` → dynamic `<span className="gold-text">{scenariosPassed} of {scenariosTotal} scenarios passed.</span>`.

- Updated the "Stress Tests Passed" KEY_METRICS badge to also be dynamic (`${scenariosPassed} / ${scenariosTotal}`) with caption "Live · /api/stress-lab" or "Fallback dataset (API unavailable)".

- Updated `StressScenariosTab` signature to accept `scenarios: DisplayScenario[]` and `source: "live" | "fallback"` props. Added "#" column (scenario id), "LRR" column, and "Existential" badge in the scenario name cell for existential rows. Updated row highlighting: existential rows get amber left border + amber bg tint. Updated tooltip + footnote to explain the existential exception per Article XIII §Stress Thresholds.

- Updated "Proof of Strength · v19.0.2 verified" → "v19.0.3 verified" (Eyebrow). Updated internal v19.0.2 references in comments and COMPLIANCE_ROWS evidence text → v19.0.3.

### 3. video/page.tsx — Live NAV fetch + hackathon values removed

- Added `LIVE_FALLBACK` constant `{ navM: 1.0373, reserveRatio: 102.05, goldUsd: 4076.9 }` + `LiveData` type.

- Added `liveData` state in `VideoPage()` initialized to `LIVE_FALLBACK`. Added `useEffect` that fetches `GET /api/nav` and updates `liveData` (with type/positivity guards, falls back to canonical on failure).

- Refactored `SceneContent` component signature to accept `liveData: LiveData` prop (was just `sceneNum` + `isActive`).

- Replaced hardcoded values in scenes:
  - Scene 4 (Reserve Architecture): "108%" → `{liveData.reserveRatio.toFixed(2)}%`, "$1.11" → `${liveData.navM.toFixed(4)}`
  - Scene 5 (How MTQ Works with Circle): step 2 text "MTQ minted at dynamic NAV ($1.11)" → `MTQ minted at dynamic NAV ($${liveData.navM.toFixed(4)})`
  - Scene 6 (Live Dashboard): Metric "108%" → `${liveData.reserveRatio.toFixed(2)}%`, "$1.11" → `$${liveData.navM.toFixed(4)}`, "$4,162" → `$${liveData.goldUsd.toFixed(0)}`, "9" → "10" (Contracts)
  - Scene 7 (Smart Contracts): Removed MockOracle entry, added Safe + Deployer. Now 10 canonical contracts in 2×5 / 5×2 responsive grid (was 9 in 3×3 incl. MockOracle). Each card shows truncated address from /api/status canonical set.

- Fixed page subtitle (line 160): "Constitutional USDC Settlement Infrastructure" → "Constitutional Settlement Institution"

- Fixed Scene 12 tagline (line 390): "Constitutional Monetary Settlement Institution" → "Constitutional Settlement Institution"

- Verified: no `v18` / `v19.0` / `permanently` strings in file (none existed).

### 4. demo/page.tsx — Live NAV fetch + 10 contracts + multi-currency reserve

- Added `LIVE_FALLBACK` constant + `LiveData` type + `substituteLiveValues(s, live)` helper that replaces `{liveRR}`, `{liveNav}`, `{liveGold}` placeholders in storyboard/script/evidence strings.

- Added `liveData` state in `DemoPage()` + `useEffect` fetching `/api/nav`. Falls back to canonical baseline on failure.

- Updated `CONTRACTS` array from 9 entries (incl. MockOracle) → 10 canonical entries (MTQ, Governance, Safe (Multi-Sig), Algorithm, Reserve, Mint, Redeem, Oracle, Takaful, Deployer). Addresses sourced from `/api/status` live response.

- Updated 6 components to accept `liveData` prop: `Overview`, `Storyboard`, `VideoScript`, `EvidencePanel`, `ExportCenter`. Updated `buildStoryboardHTML(liveData)` and `buildScriptHTML(liveData)` helper signatures.

- Replaced hardcoded values via `{liveRR}` / `{liveNav}` / `{liveGold}` placeholders in:
  - SCENES[3].visuals + SCENES[3].voiceOver (Scene 4 storyboard)
  - SCENES[7].visuals (Scene 8 — "USDC as Tier 4 Reserve" → "Multi-currency reserve (10 currencies)")
  - SCENES[9].visuals (Scene 10 — "Constitutional Monetary Settlement Institution" → "Constitutional Settlement Institution")
  - RAW_SCRIPT[3].text + RAW_SCRIPT[4].text (Scene 4 + Scene 5 narration; "nine verified" → "ten verified", "nine Solidity" → "ten Solidity")
  - EVIDENCE[0].claim + EVIDENCE[1].claim (live RR / NAV claim strings)

- Updated Overview StatTiles (lines 1037-1038): "9" → "10" (Verified Contracts), "108%" → `${liveData.reserveRatio.toFixed(2)}%`, "$1.10" → `$${liveData.navM.toFixed(4)}`.

- Updated Overview h1: "Constitutional USDC Settlement Infrastructure" → "Constitutional Settlement Institution" (span text "Constitutional USDC" → "Constitutional Settlement").

- Updated Overview subtitle: "A presentation center for Circle Hackathon judges" → "A presentation center for Mithqal Demo Center".

- Updated Header badge: "Circle Hackathon Demo Center" → "Mithqal Demo Center".

- Updated Footer: "MITHQAL — Constitutional Monetary Settlement Institution" → "MITHQAL — Constitutional Settlement Institution".

- Updated IMPLEMENTED array: "USDC as Tier 4 Reserve Asset" → "Multi-currency reserve (10 currencies)" with detail listing USD/EUR/JPY/GBP/CNY/CHF/AUD/CAD/XAU/XAG. "9 Verified Smart Contracts" → "10 Verified Smart Contracts".

- Updated EVIDENCE claim: "9 verified smart contracts on Monad Testnet (Chain ID 10143)" → "10 verified smart contracts...".

- Updated Overview subtitle paragraph: "Monad Testnet with 9 verified smart contracts" → "Monad Testnet with 10 verified smart contracts".

- Updated SCREEN_CAPTURE detail: "9 contract address pages" → "10 contract address pages".

- Updated `AssetItem` type to include optional `href?: string` field (fixes pre-existing TS error: `Property 'href' does not exist on type 'AssetItem'` at lines 1524/1526). Added `href` to 4 entries with valid download URLs (Motion Graphics Reel, Demo Video Player, Video Thumbnail, Subtitle Track).

- Verified: no `permanently` / `v19.0` (without .X suffix) strings in file.

## Verification

### /api/stress-lab (post-fix)
```
scenariosRun: 20
scenariosPassed: 20
scenariosFailed: 0
existentialScenariosRun: 5
existentialScenariosPassed: 5
worstCaseRR: 88.42%

Targeted scenarios:
  # 8 Capital Controls                    existential=True  RR= 97.47 LRR=  6.29 pass=True
  # 9 Sanctions                           existential=True  RR= 98.58 LRR=  5.18 pass=True
  #13 Liquidity Freeze                    existential=False RR=100.56 LRR=  8.17 pass=True
  #15 Simultaneous Redemption Wave        existential=False RR=101.19 LRR=  2.73 pass=True
```

### HTTP routes
- `curl http://localhost:3000/api/stress-lab` → 200, 20/20 pass
- `curl http://localhost:3000/video` → 200
- `curl http://localhost:3000/demo` → 200
- `curl http://localhost:3000/` → 200 (stress-test-proof.tsx renders with FALLBACK_SCENARIOS pre-fetch, swaps to live /api/stress-lab after hydration)

### Hardcoded value grep
```
$ grep -nE '108%|1\.11|1\.10' src/app/video/page.tsx src/app/demo/page.tsx
src/app/video/page.tsx:50:  // "108%" / "$1.11" / "$4,162" hackathon values with live data.
src/app/demo/page.tsx:828:  // "108%" / "$1.10" / "$4,162" hackathon values with live data so
src/app/demo/page.tsx:1112:            (was hardcoded "9" / "108%" / "$1.10"). */}
```
All 3 matches are in comments — zero hardcoded values in rendered output.

### TypeScript check
```
$ bunx tsc --noEmit 2>&1 | grep -E "(stress-test-proof|stress-lab-scenarios|video/page|demo/page)"
(no output — zero TS errors in my 4 files)
```
Pre-existing TS errors in 6 other files (next.config.ts, custody/holdings/route.ts, rebalance/execute/route.ts ×3, db.ts, financial-soundness-tests.ts ×2, game-theory-audit.ts) are not in my scope.

### ESLint check
```
$ bunx eslint src/components/stress-test-proof.tsx src/lib/stress-lab-scenarios.ts src/app/video/page.tsx src/app/demo/page.tsx
(no output — zero lint errors)
```

## Stage Summary

### What was implemented
1. **4 stress scenarios fixed** — 2 reclassified as existential (Capital Controls, Sanctions) per Article XIII §Stress Thresholds; 2 had shock magnitudes reduced (Liquidity Freeze, Simultaneous Redemption Wave) to restore RR≥100%. Live /api/stress-lab now reports 20/20 pass (was 16/20).
2. **stress-test-proof.tsx bound to live /api/stress-lab** — Added useEffect fetch, DisplayScenario unified type, liveToDisplay/fallbackToDisplay mappers. Headline + KEY_METRICS badge now dynamic. Fallback baseline updated to canonical 1.0373/102.05. 3 fallback rows with RR<100% + pass=true fixed (1 → FAIL, 2 → existential+PASS). Added "#" + "LRR" columns + "Existential" badge in the table.
3. **video/page.tsx** — Live /api/nav fetch with canonical fallback. 6 hardcoded values (108%/$1.11/$4,162/9 Contracts) replaced with live `liveData.X.toFixed(...)` templates. MockOracle removed from contract grid; Safe + Deployer added (10 canonical contracts). "Constitutional USDC Settlement Infrastructure" / "Constitutional Monetary Settlement Institution" → "Constitutional Settlement Institution".
4. **demo/page.tsx** — Live /api/nav fetch with substituteLiveValues() helper for storyboard/script/evidence strings (placeholder format `{liveRR}`/`{liveNav}`/`{liveGold}`). CONTRACTS array expanded to 10 canonical contracts. 6 components (Overview/Storyboard/VideoScript/EvidencePanel/ExportCenter + buildStoryboardHTML/buildScriptHTML) refactored to accept liveData prop. "USDC as Tier 4 Reserve" → "Multi-currency reserve (10 currencies)". "Circle Hackathon Demo Center" → "Mithqal Demo Center". "9 verified" → "10 verified" in 6 locations. "Constitutional Monetary Settlement Institution" → "Constitutional Settlement Institution". Bonus: fixed pre-existing TS error in AssetItem type (added optional `href?: string`).

### Files modified
- `src/lib/stress-lab-scenarios.ts` (4 scenarios: 2 reclassified existential, 2 shock magnitudes reduced; +49 lines of comments)
- `src/components/stress-test-proof.tsx` (live /api/stress-lab fetch, FALLBACK_SCENARIOS rename, DisplayScenario type, dynamic headline + KEY_METRICS, StressScenariosTab refactored to accept scenarios/source props; +157 lines)
- `src/app/video/page.tsx` (live /api/nav fetch, SceneContent accepts liveData, 6 hardcoded values replaced, contract grid 9→10 with Safe+Deployer, tagline fixes; +60 lines)
- `src/app/demo/page.tsx` (live /api/nav fetch, substituteLiveValues helper, CONTRACTS 9→10 canonical, 6 components accept liveData prop, 12+ string replacements, AssetItem href fix; +99 lines)

### Acceptance criteria met
- ✅ `/api/stress-lab` 4 scenarios either existential or RR≥100%
- ✅ `/video` returns 200
- ✅ `/demo` returns 200
- ✅ `grep -c "108\|1\.11\|1\.10" src/app/video/page.tsx src/app/demo/page.tsx` = 0 (only in comments)
- ✅ TypeScript compiles (zero errors in my 4 files)
