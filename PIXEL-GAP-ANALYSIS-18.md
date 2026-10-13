# 18-PIXEL-GAP-ANALYSIS — Pixel-by-Pixel Audit (5 pages vs 5 reference designs)

> Date: 2026-10-06 (system clock).
> Method: agent-browser screenshots at 1440x900 (full-page) → z-ai vision CLI multi-image comparison.
> Reference images: 5 ChatGPT Image PNGs in `/home/z/my-project/upload/`.
> Current implementation: production deployment at https://mithqal.vercel.app (HTTP 200 on all 5 routes).

## Artifacts Produced

| Page | Route | Reference Image | Current Screenshot | VLM JSON | VLM Text |
|---|---|---|---|---|---|
| HOME | `/` | `ChatGPT Image Oct 4, 2026 at 12_18_23 AM.png` | `/home/z/my-project/screenshots/current-home.png` (776 KB) | `/tmp/gap-home.json` | `/home/z/my-project/screenshots/gap-reports/gap-home.txt` |
| FEATURES | `/features` | `ChatGPT Image Oct 4, 2026 at 04_11_21 PM.png` | `/home/z/my-project/screenshots/current-features.png` (1.16 MB) | `/tmp/gap-features.json` | `/home/z/my-project/screenshots/gap-reports/gap-features.txt` |
| ECOSYSTEM | `/ecosystem` | `ChatGPT Image Oct 4, 2026 at 04_56_47 PM.png` | `/home/z/my-project/screenshots/current-ecosystem.png` (1.65 MB) | `/tmp/gap-ecosystem.json` | `/home/z/my-project/screenshots/gap-reports/gap-ecosystem.txt` |
| ROADMAP | `/roadmap` | `ChatGPT Image Oct 5, 2026 at 09_20_36 AM.png` | `/home/z/my-project/screenshots/current-roadmap.png` (1.89 MB) | `/tmp/gap-roadmap.json` | `/home/z/my-project/screenshots/gap-reports/gap-roadmap.txt` |
| ABOUT | `/about` | `ChatGPT Image Oct 5, 2026 at 03_35_17 PM.png` | `/home/z/my-project/screenshots/current-about.png` (2.44 MB) | `/tmp/gap-about.json` | `/home/z/my-project/screenshots/gap-reports/gap-about.txt` |

## Page-by-Page Gap Reports

### 1. HOME (`/`)
**Reference → Current**: dramatic hero, copy, and bottom-strip mismatch.

**Top 5 Critical Gaps**
1. **Hero background asset wrong**: Current uses an "archway" image. Reference uses a tall rectangular glowing "monolithic door/portal" structure.
2. **Hero layout wrong (structural)**: Current is a split-column (text left / image right). Reference is a **full-bleed overlay** with text + buttons sitting directly on top of the background image. The hero content block must also move **downwards** (~20–25 % from top of viewport vs current top-of-fold).
3. **Hero copy entirely wrong**:
   - Eyebrow: `MITHQAL — NEUTRAL WHOLESALE SETTLEMENT` → must become `THE INTELLIGENCE LAYER FOR A NEW ECONOMY`.
   - Headline: `A Neutral Infrastructure for a Limitless Financial Future.` → must become `Your Digital Capital. Unified. Intelligent. Limitless.` (the word "Limitless." must be gold `#D4AF37`).
   - Subheadline: long institutional text → must become `Mithqal is the next-generation platform for AI, finance, and digital ownership — built for creators, investors, and visionaries who see beyond.`
4. **Bottom feature strip replaced with cards**: Current page has a "Five Institutional Pillars" card grid + "Institutional Commitment" section. Reference has a single-row 5-icon strip overlaid on the bottom-left of the hero image, with **vertical dividers**, items:
   1. Brain / "AI-Powered" / "Smarter decisions. Greater opportunities."
   2. Coins / "DeFi & Finance" / "Build, earn, and grow with confidence."
   3. Shield / "Digital Ownership" / "Your assets. Your control."
   4. Nodes / "Global Ecosystem" / "Connect. Collaborate. Create."
   5. Lightning Bolt / "Built for the Future" / "Next-gen technology. Real-world impact."
5. **Logo + nav + CTA mismatches**: Replace hexagon logo with stylized "M"; "Home" link must have gold underline active-state; primary CTA label `Explore the Architecture →` must become `Get Started →`; secondary CTA `View the Ecosystem` → `Explore Ecosystem` (no arrow); primary button fill colour should be muted gold/beige `≈#C5A065` not saturated yellow.

**Other Gaps**
- Floating action button (theme toggle) on right edge — not in reference → remove.
- Bottom institutional footer line `MITHQAL — Neutral Institutional Settlement Control Plane...` visible at very bottom → remove.
- Excessive empty black space above hero headline → reduce top padding.
- Hero headline font-size appears too small relative to reference (reference ≈ 64–72 px display). Increase to match.
- Reference headline width ≈ 45–50 % viewport; current column is narrower → widen.

---

### 2. FEATURES (`/features`)
**Reference → Current**: hero collapsed, card grid shrunk, workflow nodes simplified to letters.

**Top 5 Critical Gaps**
1. **Hero layout collapsed (structural)**: Reference = side-by-side (text left ~50 % / 3-D "Control Plane" graphic right ~50 %). Current = stacked vertical (text top / graphic bottom). Restore `flex-row`/grid 2-col layout.
2. **Hero graphic wrong**: Reference = complex 3-D isometric composition with central glowing "M" + floating cards labelled `Policy`, `Settlement`, `Finality`, etc. Current = static 2-D image of a golden cube with network nodes. Swap asset.
3. **Card density too low**: Reference shows 5 **large** cards with detailed custom diagrams (pyramid for Policy, timeline for Settlement, icon grid, book stack, layer stack). Current shows 5 **small compact** cards with tiny icons / no diagrams. Expand card height+width; reinstate the vector diagrams.
4. **Orchestration workflow nodes reduced to letters**: Reference = large circular icons with detailed line-art inside (Document, Checkmark, Shield, Target, Database, Nodes, Document) connected by lines+arrows. Current = small solid circles with single letters `R, V, A, F, S, R, E`. Replace letter-circles with the outlined icon set.
5. **Typography colour mismatch**: In reference, the words `Institutional Settlement.` are coloured **gold (`≈#D4A853`)**. Current headline is entirely white. Apply gold class to last 2 words of H1.

**Other Gaps**
- Body text truncated/wrapped differently → restore full sentence: `MITHQAL brings settlement orchestration, policy control, finality, reconciliation, multi-rail interoperability and audit-ready evidence into one coordinated institutional control plane.`
- Section description under "Built as One Control System" is shortened → restore full text.
- Card 05 (Evidence): reference shows Layer Stack Diagram (Identity, Provenance, etc.); current shows generic Lightning Bolt → replace.
- Background: reference dark-blue/black grid `≈#0B0F19`; current flat pure black `#000000` → add dark tech-grid background.
- "Launch App" button: reference = pill (`border-radius: 50px`), `padding ≈ 12px 24px`, with `→` arrow; current = standard small button → restyle.
- "Features" nav link gold-underline active state faint/missing → reinforce.
- Many sections in current not present in reference viewport: `Control Before Execution`, `Three-Layer Finality Control`, `Multi-Rail Interoperability` (detailed), `Reconciliation` (detailed), `Evidence Is a Control Layer`, `Designed for Failure...`, `Architecture Overview` (tree), `Optional Settlement Primitive`, footer CTA — verify design intent.

---

### 3. ECOSYSTEM (`/ecosystem`)
**Reference → Current**: hero stacked instead of split, missing section, three extra sections not in reference, footer banner wrong.

**Top 5 Critical Gaps**
1. **Hero layout stacked (structural)**: Reference = split layout (text left ~40 %, ecosystem diagram right ~60 %). Current = stacked (text on top, graphic below, centered). Switch to `display:flex; flex-direction:row`.
2. **Hero graphic wrong**: Reference = dark globe + glowing gold **isometric cube** in center, connected by lines to **6 floating rounded rectangles** (`Banks`, `Payment Networks`, `Regulators`, `Tech Partners`, `Authorized Institutions`, `Corporate Participants`). Current = realistic Earth texture with a flat gold hexagon outline; surrounding nodes missing. Replace with Isometric Cube Network asset; recreate the 6 floating node cards.
3. **Entire "Multi-Rail Connectivity" section is missing**: Reference has this section with 3-D isometric stack of layers (SWIFT, RTGS, Tokenised Bank Money) + "View Rail Details" button + central 3-D graphic showing layered blocks connected to labels (SWIFT/ISO 20022, Domestic Payment Rails, etc.). Re-insert.
4. **Three extra sections must be removed/relocated**: `Institutional Participant Model` (vertical 4-item list — Central Bank, Regulated Commercial Bank, etc.), `Connect Without Replacing the Bank` (flowchart), `One Control Plane...` (pill buttons for rails). None of these appear in the reference → remove or move below the fold.
5. **Ecosystem Layer section mis-styled**: Reference = horizontal row of **5 items** with icon + title + desc, **no card borders/backgrounds** (clean text columns). Headline `Trusted Partners. Unified Infrastructure.` Items: Banks, Payment Networks, Authorized Institutions, Technology Partners, Regulators. Current = grid of **6** items inside **bordered boxes** with visible backgrounds. Headline text `Trusted Infrastructure. Connected Through One Control Plane.` Remove borders/backgrounds; revert headline; trim list to 5.

**Other Gaps**
- "Launch App" button: reference = pill with `border:1px solid rgba(255,255,255,0.3)`, `border-radius:9999px`, `padding:8px 24px`; current = faint text link. Apply.
- Logo: replace hexagon icon with "M" geometric icon.
- Hero headline: ensure `MITHQAL` is gold (`≈#D4AF37`).
- Hero body text: current says `MITHQAL connects participating institutions...`; reference says `MITHQAL brings together banks...`. Update copy.
- "Controlled Routing" section layout: reference = 2-column (text left, content right) with 3 horizontal list items for Primary/Secondary/Emergency rails + warning box at bottom. Current = stacked with large bordered cards in a row. Switch to 2-col grid; use compact horizontal bars.
- "Controlled Routing" icons: reference uses line icons in circles (Target for Primary, Swap-arrows for Secondary, Zap for Emergency); current uses generic icons/text → implement specific icons.
- Footer banner: reference = cityscape silhouette with golden light beams/shafts. Current = abstract blue wavy lines/particles. Swap background asset.
- Footer headline: reference `A Growing Ecosystem. A Stronger Future.` Current `A Connected Ecosystem. A Stronger Settlement Architecture.` Update text.
- Footer buttons: `Explore the Architecture` (gold fill) + `View the Roadmap` (outline) — verify positioning (inline with text or bottom-right).

---

### 4. ROADMAP (`/roadmap`)
**Reference → Current**: hero bg + layout + timeline missing, roadmap steps completely redesigned, "Platform Architecture" section absent, many extra sections, footer image wrong.

**Top 5 Critical Gaps**
1. **Hero image wrong + layout stacked**: Reference = wide cinematic landscape with glowing "M" portal gates + timeline path, in **split layout** (text left ~40–50 % / timeline right). Current = light trails over water, stacked (text top / image bottom). Replace hero bg with "Mithqal Portal" asset; switch container to CSS grid/flexbox row.
2. **Horizontal timeline visualization missing entirely**: Reference displays a horizontal connected timeline with **5 stages** (Foundation → Global Readiness) overlaid on the image, with nodes + connecting lines + labels. Current removes this. Rebuild the horizontal timeline component.
3. **Roadmap Steps completely redesigned (structural)**: Reference = horizontal flow with large circular icons (01–05), bold titles, short descriptions; step 02 title = `Pilots` ("Limited participants..."). Current = grid of cards (3×2) with small yellow headers + bulleted lists; step 02 title = `Controlled Testing` (with `Adversarial Tests`, `Failure Scenarios`, etc.). Revert to horizontal stepper layout; restore original 5 step titles + descriptions; re-integrate specific line icons (layers for Foundation, bank column for Pilots, nodes for Expansion, shield for Scale, globe for Global Readiness).
4. **"Platform Architecture" section is missing**: Reference features a central 3-D isometric graphic of layered platforms, surrounded by labels (`Participants`, `Rails`, `Settlement`) on left and `Foundational Pillars` (`Security`, `Compliance`, etc.) on right. Re-insert this section immediately after the Roadmap steps.
5. **Hero copy + secondary button label wrong**: Reference subheadline `MITHQAL's roadmap outlines a phased approach...`; current `MITHQAL evolves through controlled build...`. Reference secondary button `View the Features`; current `View the Architecture`. Update both.

**Other Gaps**
- Logo: reference = sharp geometric "M" inside hexagon/diamond; current = softer rounded hexagon without distinct "M" cutout → swap SVG/PNG asset.
- "Launch App" button: ensure `border-radius:9999px` and gold border (`≈#D4AF37`).
- "Roadmap" nav-link gold underline weight — verify ≈ 2 px solid.
- Headline font weight: reference looks `font-weight:600` or `700` (clean Sans-Serif, likely Inter or Satoshi); ensure matched.
- "A Stronger Future" section placement: reference is near bottom; current is at very bottom. Move section up.
- "A Stronger Future" background: reference = cityscape/sunset reflecting on water; current = misty mountain landscape. Swap asset.
- "A Stronger Future" buttons: reference = `Explore Ecosystem` (gold) + `View the Roadmap` (outline); current button text = `Read the Features`. Restore labels.
- Extra sections in current not in reference: `From Foundation to Institutional Readiness` (card grid), `Sequential Pilot Progression` (vertical list), `Every Expansion Has a Gate` (gate grid), `Where MITHQAL Stands` (status table), `The Gate Sequence` (flowchart), `Build Test Validate` (3 cols), `Validation Is External` (table), `Expansion Follows Evidence` (button row), `Optional Settlement Primitive` (card) — verify design intent (likely to be removed).
- Footer: reference = simple 4-column layout (Logo/Desc, Platform links, Architecture links, Legal links). Current footer appears missing or replaced by bottom-most section. Restore 4-column footer.

---

### 5. ABOUT (`/about`)
**Reference → Current**: hero stacked + wrong asset + wrong copy, Mission/Vision section replaced with a diagram block, two missing icon grids, extraneous text-heavy sections, commitment banner image wrong.

**Top 5 Critical Gaps**
1. **Hero asset wrong + layout stacked + text broken**: Reference = wide cinematic landscape with glowing rectangular portal/monolith on right; reference is **split-screen** (text left / image right ~50/50 or 60/40). Current = vertical framed archway image, stacked (text top / image bottom). Also current headline text wraps awkwardly ("for a More" on new line). Replace hero asset with wide-aspect-ratio portal image; change hero container to `display:flex` or `grid` 50/50; restore exact headline text.
2. **Mission/Vision 2-column block replaced with diagram**: Reference = two distinct side-by-side columns. Left: `Enable Institutional Settlement at Scale.` Right: `A More Connected Financial Ecosystem.` Current = one block titled `Neutral Settlement. Institutional Control.` followed by a diagram. Restore the two-column text layout and original headlines.
3. **6-item "Values" icon grid missing**: Reference shows a row of 6 items (Neutrality, Institutional Focus, Security & Control, Interoperability, Transparency, Human Oversight), with outlined stroke-style gold icons inside circles, bold white headings, smaller grey body text. Re-insert.
4. **4-column "Our Principles" section missing**: Reference shows 4 columns (Integrity, Resilience, Collaboration, Impact) with large icons above the text. Re-insert immediately after the Mission/Vision section.
5. **Commitment banner image wrong + extraneous sections**: Reference banner = full-width dark banner with cityscape/mountain horizon image; current uses the archway image again. Many extraneous text-heavy sections present in current not in reference (`Neutral Settlement...`, `A Neutral Settlement Fabric...`, `Between Monetary Systems...`, `Seven Architectural Commitments`, etc.) → remove or move below the fold.

**Other Gaps**
- Button styling: "Explore the Architecture" should be solid gold/yellow (`≈#E5B86D`); "View the Ecosystem" outline with thin border (`1px solid #E5B86D`) and transparent background. Verify border thickness.
- Logo spacing: reference has more breathing room; current feels cramped/has different font weight.
- "About" nav-link gold underline active state — verify it exists.
- Footer content: reference has links for `Platform, Features, Ecosystem, Roadmap, About` (col 1), `Architecture, Evidence, Contact` (col 2), `Legal/Status, Terms, Privacy, Disclosures` (col 3). Current footer appears cut off or replaced. Implement the 3-column link list.
- Commitment banner buttons: reference = `Explore Ecosystem` (Gold) + `View Roadmap` (Outline) — verify alignment.

---

## Consolidated Priority List — Top 15 Fixes Across All Pages

> Ranked by visual-impact × breadth-of-application.

| # | Fix | Pages affected | Visual impact |
|---|---|---|---|
| 1 | **Swap hero assets** to the exact reference PNG/SVG (portal/monolith for HOME, isometric cube network for ECOSYSTEM, 3-D control plane for FEATURES, "Mithqal Portal" gates for ROADMAP, wide portal for ABOUT) | ALL 5 | Critical |
| 2 | **Restore split hero layout** (`display:flex; flex-direction:row`, text left ~40–50 %, graphic right ~50–60 %); HOME is the exception (full-bleed overlay text on image) | FEATURES, ECOSYSTEM, ROADMAP, ABOUT | Critical |
| 3 | **Standardize background colour** `#0B0F19` (deep navy-black) instead of pure black `#000000`; add the dark tech-grid background pattern across all hero sections | ALL 5 | High |
| 4 | **Standardize primary gold** across the site to `≈#D4A853 / #C5A059` (muted institutional gold); apply to: eyebrow text, key headline words ("Limitless.", "Institutional Settlement.", "MITHQAL.", "Institutional Evolution."), nav active underline, primary CTA fill, button borders | ALL 5 | High |
| 5 | **Restyle "Launch App" button** to pill (`border-radius:9999px`, `padding:8px 24px`, `border:1px solid rgba(255,255,255,0.3)` or gold border, with `→` arrow icon) | ALL 5 | High |
| 6 | **Swap logo asset** from current hexagon shield icon to the sharp geometric "M" cutout inside hexagon/diamond | ALL 5 | High |
| 7 | **Re-enforce nav active state** (gold underline ≈ 2 px solid) on the relevant page link | ALL 5 | Medium |
| 8 | **Restore correct hero copy** verbatim per reference (eyebrow, headline, subheadline) — current copy is heavily rewritten, especially HOME and ROADMAP | ALL 5 | Critical |
| 9 | **Restore standard 3–4 column footer** with link columns: Platform/Features/Ecosystem/Roadmap/About, Architecture/Evidence/Contact, Legal/Status/Terms/Privacy/Disclosures | ECOSYSTEM, ROADMAP, ABOUT | Medium |
| 10 | **Re-design bottom CTA banner** ("A Stronger Future" / "A Growing Ecosystem") with the cityscape/skyline reflective water background asset, correct headline text, and the correct gold+outline button pair | ECOSYSTEM, ROADMAP, ABOUT | High |
| 11 | **Re-insert missing sections per reference**: Multi-Rail Connectivity (ECOSYSTEM), Platform Architecture (ROADMAP), 4-column Principles (ABOUT), 6-item Values grid (ABOUT), 5-icon bottom strip (HOME) | 4 of 5 | Critical |
| 12 | **Remove extraneous sections not in reference** (Institutional Participant Model / Connect Without Replacing the Bank / One Control Plane... on ECOSYSTEM; From Foundation to Institutional Readiness / Sequential Pilot Progression / Every Expansion Has a Gate / Where MITHQAL Stands / The Gate Sequence / Build Test Validate / Validation Is External / Expansion Follows Evidence / Optional Settlement Primitive on ROADMAP; Neutral Settlement... / A Neutral Settlement Fabric... / Between Monetary Systems... / Seven Architectural Commitments on ABOUT; Control Before Execution / Three-Layer Finality Control / Multi-Rail Interoperability detailed / Reconciliation detailed / Evidence Is a Control Layer / Designed for Failure... / Architecture Overview tree / Optional Settlement Primitive on FEATURES) | 4 of 5 | High |
| 13 | **Restore detailed card diagrams** on FEATURES (pyramid, timeline, icon grid, book stack, layer stack) instead of tiny generic icons; expand card dimensions | FEATURES | Critical |
| 14 | **Restore circular outlined icons + connecting arrows** in workflow/roadmap timelines instead of letter-circles (FEATURES orchestration R/V/A/F/S/R/E → icons; ROADMAP stepper → icons) | FEATURES, ROADMAP | High |
| 15 | **Restore horizontal stepper** on ROADMAP (5 nodes with line icons — layers, bank column, nodes, shield, globe — instead of 3×2 card grid with bulleted lists) | ROADMAP | Critical |

## Honest Assessment

- **Page with MOST gaps**: **ROADMAP** — 8+ structural deviations including: hero bg swap + layout flip + horizontal timeline missing (3 separate big-ticket items); **entire Roadmap Steps section redesigned** from horizontal stepper to 3×2 card grid; **"Platform Architecture" section completely missing**; many extra sections to evaluate for removal; "Stronger Future" section background image wrong and misplaced; footer absent. This is the most labour-intensive page to remediate.

- **Page with FEWEST gaps**: **HOME** — primarily a swap-set (hero asset, copy, layout-to-overlay, replace bottom card grid with 5-icon strip, restyle logo, swap CTA labels). No major sections need to be re-inserted from scratch; no major sections need to be removed beyond the "Five Institutional Pillars" + "Institutional Commitment" + floating theme-toggle button. Most direct path to parity.

- **Close runners-up**:
  - **ECOSYSTEM** (2nd most gaps) — hero split layout + asset swap + missing Multi-Rail Connectivity section + 3 extra sections to remove + Ecosystem Layer restructure (cards → borderless columns) + Controlled Routing layout flip + footer banner swap.
  - **ABOUT** (3rd) — hero swap + Mission/Vision restore + Principles grid re-insert + Values grid re-insert + extraneous-section cull + commitment banner swap.
  - **FEATURES** (4th) — hero layout + asset + cards density + workflow nodes + headline colorize; but has many "extra sections in current not in reference" to evaluate.

- **Cross-cutting truth**: The current implementation diverged from the reference designs in 3 systematic ways that recur on every page:
  1. **Hero layouts collapsed from split-screen to stacked vertical** (4 of 5 pages — FEATURES, ECOSYSTEM, ROADMAP, ABOUT).
  2. **Hero background assets replaced** with different images in all 5 pages (archway/Earth+hexagon/cube/light-trails/archway vs the reference portal/monolith/isometric-cube-network).
  3. **Many extra "institutional" sections added** beyond the reference viewport — these add length but dilute the visual identity. The reference pages are intentionally tight; the implementation has bloat.

- **Recommended execution order for a developer**: tackle cross-cutting fixes first (#3 background colour, #4 gold hex, #5 Launch-App pill, #6 logo, #9 footer) since they touch shared layout/header/footer components; then attack HOME (fewest gaps, fastest win) → FEATURES → ABOUT → ECOSYSTEM → ROADMAP (largest scope, last).

---

## Honest Notes / Limitations

- The agent-browser successfully reached https://mithqal.vercel.app on all 5 routes (no network sandboxing this time — unlike the localhost dev server that was blocked in earlier worklog tasks).
- All 5 reference images existed in `/home/z/my-project/upload/` per the project context.
- All 5 current screenshots were captured at viewport 1440×900 with `--full` (full-page) — they include content beyond the fold, which is why file sizes range 776 KB → 2.44 MB.
- VLM model returned structured numbered lists with hex/pixel/font-weight guidance where possible. The model could not pixel-measure exactly (no DOM access) but provided actionable visual-direction guidance.
- No source code was modified in this task. This is an **audit-only** task. The fixes identified above are the input spec for the next implementation task.
- BUILD_MODE = FROZEN. PRODUCTION_AUTHORIZED = false. No commits, no pushes.
