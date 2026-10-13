# Task 22-ROADMAP-REWRITE — Frontend sub-agent work record

**Task ID:** 22-ROADMAP-REWRITE
**Agent:** frontend (roadmap rewrite)
**Date:** 2026-10-06
**Scope:** Rewrite `src/app/roadmap/page.tsx` to match reference design (image 5); append CSS additions to `src/app/roadmap/roadmap.css`. Only these two files were modified.

## Inputs reviewed (from prior agents)

- `/home/z/my-project/worklog.md` (last ~100 lines) — confirmed prior context is the v25.14.1 HOME page VLM match verification (Task 20). No prior agent had touched the roadmap page in this session.
- `src/app/roadmap/page.tsx` (pre-rewrite) — 9 legacy sections (stages grid, pilot flow, gates grid, status panel, critical path, BTV grid, foundation grid, validation flow, future grid, MTQ box), inline button styles, `/#about` href typo, missing horizontal timeline + platform architecture sections.
- `src/app/roadmap/roadmap.css` (pre-rewrite) — institutional design system with var() tokens (`--gold`, `--background`, `--foreground`, `--ink-card`, `--gold-soft`); `.hero-grid` already does 50/50 split; `.hero-visual` already wires `mithqal-roadmap-hero.png`; `.cta-bg` already wires `mithqal-roadmap-cta.png` + overlay; existing `.gold-text` was `color: var(--gold-soft)` only (no `!important` override).
- `/home/z/my-project/screenshots/gap-reports/gap-roadmap.txt` — full gap report listing all visual deltas vs reference.

## Outputs produced

### 1. `src/app/roadmap/page.tsx` — full rewrite

Structure (top to bottom):
1. `site-header` — kept; bare-M `MithqalLogo`, NAV_ITEMS=["Home","Features","Ecosystem","Roadmap","About"], NAV_HREFS=["/","/features","/ecosystem","/roadmap","/about"], Roadmap active, Launch App button.
2. HERO (`section.section` paddingTop 120px) — `.hero-grid` 50/50 split:
   - eyebrow "THE MITHQAL ROADMAP"
   - H1 `A Structured Path to <span className="gold-text">Institutional Evolution.</span>`
   - sub (exact text from gap report): "MITHQAL's roadmap outlines a phased approach to building neutral wholesale settlement infrastructure — from foundation through controlled expansion."
   - `.hero-actions`: primary `Read the Roadmap →` (href="#roadmap-steps"), secondary `View the Features` (href="/features")
   - right: `.hero-visual` (existing CSS, mithqal-roadmap-hero.png)
3. `<hr className="divider" />`
4. Horizontal 5-step timeline (`#roadmap-steps`):
   - eyebrow "FIVE PHASES", H2 "Foundation to Global Readiness.", sub
   - `.timeline-row` with 5 `.timeline-step`: Foundation (layers), Pilots (bank), Expansion (nodes), Scale (shield), Global Readiness (globe)
   - Each step: 64×64 outlined gold circle with lucide-style inline SVG (currentColor=--gold), STEP 0X num, bold title, short desc
5. `<hr className="divider" />`
6. Platform Architecture (`#platform-architecture`):
   - eyebrow "PLATFORM ARCHITECTURE", H2 "Built for What's Next.", sub
   - `.arch-grid` 3-col: text left (Participants/Rails/Settlement groups), centered `<IsometricArch />` SVG (3 stacked isometric layers + dashed axis), right `.arch-pillars` (Security, Compliance, Interoperability, Auditability, Neutrality)
7. CTA banner (`.cta-bg`, existing background mithqal-roadmap-cta.png):
   - eyebrow "THE ROAD AHEAD", H2 "A Stronger Future.", sub
   - `.hero-actions`: primary `Explore Ecosystem →` (gold), secondary `View the Roadmap` (outline, href="#roadmap-steps")
8. `site-footer` — kept; state line "NOT PRODUCTION-AUTHORIZED · BUILD_MODE = FROZEN · MTQ DISABLED"

Removed legacy data arrays: STAGES, PILOTS, GATES, FOUNDATION_ITEMS, VALIDATION_DOMAINS, FUTURE_ITEMS, CRITICAL_PATH.
Added: TIMELINE_STEPS, PILLARS, ARCH_LEFT_GROUPS, IsometricArch component, TimelineStep type.

### 2. `src/app/roadmap/roadmap.css` — append-only (37 lines added after line 112)

Added a `Task 22-ROADMAP-REWRITE additions` block:
- `.gold-text` `!important` override (kills gradient/background-clip leakage; forces solid var(--gold))
- `.hero-actions` (flex, gap 16px, margin-top 36px, wrap)
- Horizontal timeline: `.timeline-row` + `::before` connector line, `.timeline-step`, `.timeline-circle` (64×64 outlined gold), `.timeline-num`, `.timeline-title` (18px/600), `.timeline-desc` (13px centered max-w 200px), `@media (max-width:900px)` collapse
- Platform architecture: `.arch-grid` (3-col 1fr/1.15fr/1fr), `.arch-text`, `.arch-group`, `.arch-label`, `.arch-item`, `.arch-visual`, `.arch-pillars` (bordered gold-tinted box), `.pillar-title`, `.pillar-item`, `.pillar-bullet`, `@media (max-width:1000px)` collapse

No existing CSS rules modified. Only appended.

## Verification

- `bun run lint` — exit 0, 0 errors, 0 warnings.
- Hero image asset present: `public/assets/mithqal-roadmap-hero.png` (153 KB, verified via ls).
- CTA image asset present: `public/assets/mithqal-roadmap-cta.png` (111 KB, verified via ls).
- All 5 timeline icons rendered inline as SVG with `stroke="currentColor"` → inherits `var(--gold)` from `.timeline-circle`.
- Footer sticky behavior preserved (existing `.site-footer` rule unchanged).
- `/.gold-text` override scoped to this page (roadmap.css is imported page-locally).

## Build-mode compliance

- 0 backend changes, 0 database changes, 0 prisma schema changes.
- No git/npm/bun install/build invocations.
- Only 2 files modified (both in declared scope).
- Lint PASS.

## Handoff to next agent

- Page is structurally aligned to reference design (image 5): split hero + horizontal 5-step timeline + 3-col platform architecture + CTA banner.
- Ready for VLM pixel-compare vs reference image 5 to score match %.
- If VLM flags specific cosmetic gaps (typography weight, icon stroke weight, isometric SVG divergence), next agent should tune CSS in roadmap.css or the inline SVG paths — no other files need to change.
