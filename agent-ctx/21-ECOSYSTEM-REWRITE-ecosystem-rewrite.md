# Task ID 21 — ECOSYSTEM-REWRITE · Senior Frontend Developer

## Mission

Rewrite `src/app/ecosystem/page.tsx` to match the approved MITHQAL reference
design (image 4). Apply all 7 fixes from the gap report at
`/home/z/my-project/screenshots/gap-reports/gap-ecosystem.txt`.

## Inputs reviewed

1. `worklog.md` — prior agents (Task 19, Task 20) established the v25.15
   institutional design system on home/features pages and verified
   `.gold-text` override + bare-M monogram + `.hero-actions` work end-to-end
   on `/features`. Used the same conventions for consistency.
2. `src/app/ecosystem/page.tsx` (pre-rewrite) — contained 7 sections,
   including 3 divergent ones (`Institutional Participant Model`,
   `Connect Without Replacing the Bank`, `One Control Plane` pill grid)
   that are NOT in the reference image and had to be removed.
3. `src/app/ecosystem/ecosystem.css` — pre-existing institutional design
   system with `var(--gold)`, `var(--ink-card)`, `var(--background)`,
   `.section`, `.hero-grid`, `.hero-visual`, `.eyebrow`, `.hero-title`,
   `.body-text`, `.section-title`, `.section-sub`, `.btn`, `.btn-primary`,
   `.btn-secondary`, `.divider`, `.site-header`, `.site-footer`. Did NOT
   have `.gold-text` override, `.hero-actions`, `.cta-section`, or any
   classes for the new Multi-Rail 3D stack / Controlled Routing list.
4. `src/app/features/features.css` + `src/app/features/page.tsx` — the
   sibling page already had the v25.15 additions (`.gold-text` override,
   `.hero-actions`, `.cta-section`, `.cta-title`, `.cta-sub`,
   `.cta-actions`, `.capabilities-grid`, `.cap-card`). Mirrored the same
   class names on the ecosystem page for cross-page consistency.

## Decisions

- **CSS strategy:** Appended a single v25.15 block to `ecosystem.css`
  rather than reusing `features.css` classes (because the two pages have
  different CTA layouts — features uses a centered text CTA, ecosystem uses
  a background-image CTA banner). Kept the original `.cta-bg` /
  `.cta-content` classes intact so the old page can be diffed if needed;
  added `.cta-section` as a new class per the gap-report requirement.
- **3D layered stack:** Implemented as 4 absolutely-positioned
  `.rail-3d-layer` slabs inside a `.rail-3d-stack` container with
  `perspective: 1400px`. Each slab is rotated `rotateX(58deg) rotateZ(-32deg)`
  and translated by `±30 / ±90` px on Y to produce the isometric "stacked
  layers" look from the reference. The bottom slab is gold-tinted to
  indicate `Tokenised Bank Money` as the on-chain terminal layer.
- **Borderless 5-col row:** Used `.eco-row` (5-col grid, `gap:0`,
  `background:transparent`, `border:none`) + `.eco-item` (`border:none`) so
  the participants render as clean text columns without card chrome, per
  the gap report's explicit "remove card borders" requirement.
- **Controlled Routing layout:** 2-col using existing `.two-col` class.
  Left = eyebrow + headline + description; right = `<ul className="route-list">`
  with three `.route-list-item` rows (each with a 44 px circular gold icon
  + name/title/desc). Warning box full-width below. Compact list style
  (not large bordered cards) per gap report.
- **NAV_HREFS:** Corrected from `["/", "/features", "/ecosystem", "/#roadmap", "/#about"]`
  to `["/", "/features", "/ecosystem", "/roadmap", "/about"]` to match
  the sibling pages and the requirement.
- **Icons:** All inline SVGs sized 22–32 px with `aria-hidden="true"`.
  `TargetIcon`, `SwapIcon`, `ZapIcon` match the gap report's "Target for
  Primary, Swap arrows for Secondary, Zap for Emergency" spec.
- **`role="img"` + `aria-label`:** Added to the hero-visual and rail-3d-stack
  decorative graphics for accessibility.

## Files written (2)

- `/home/z/my-project/src/app/ecosystem/page.tsx` — full rewrite, ~205
  lines, 5 sections (Hero / Ecosystem Layer / Multi-Rail Connectivity /
  Controlled Routing / CTA Banner) + shared header/footer.
- `/home/z/my-project/src/app/ecosystem/ecosystem.css` — appended v25.15
  additions block (~90 lines): `.gold-text` override, `.hero-actions`,
  `.eco-row`/`.eco-item`, `.rail-section`/`.rail-3d-stack`/`.rail-3d-layer`,
  `.rail-list`/`.rail-list-item`, `.route-list`/`.route-list-item`,
  `.cta-section`/`.cta-content`/`.cta-title`/`.cta-sub`/`.cta-actions`,
  plus responsive overrides at 1200/900/620 px breakpoints.

## Verification

- `bun run lint` — passes with zero errors/warnings.
- No git operations, no build, no backend changes.
- `BUILD_MODE = FROZEN` honored.

## Hand-off

Next agent should run a VLM pixel-compare between the deployed `/ecosystem`
page and reference image 4 (target ≥ 80 % match). If divergences remain,
likely culprits are: (1) the 3D layered stack geometry may need tuning to
match the reference's exact isometric angle/depth; (2) the hero image may
need regeneration to depict "dark globe background with glowing gold
isometric cube in the center, connected by lines to 6 floating rounded
rectangles"; (3) the cityscape CTA image may need regeneration to depict
"a cityscape silhouette with golden light beams/shafts emanating upwards"
rather than the abstract blue wavy particles in the current asset.
