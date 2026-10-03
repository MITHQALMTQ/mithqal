# HOME-PAGE-IMPL — mithqal-home-page-builder

**Task ID:** HOME-PAGE-IMPL
**Agent:** mithqal-home-page-builder
**Branch:** main
**BUILD_MODE:** FROZEN
**productionAuthorized:** false
**institutionallyValidated:** false

## Objective

Implement the MITHQAL master homepage at `src/app/page.tsx` — a
reference-faithful, institutional, cinematic marketing surface that
preserves the existing Institutional Command Center dashboard beneath a
new hero + site-header + capability-rail surface.

## Work performed

### Step 1 — Preserved the existing dashboard
- Read `src/app/page.tsx` (1554 lines, client component, "Institutional
  Command Center" with recharts, lucide-react, framer-motion).
- Copied verbatim to `src/components/institutional-dashboard.tsx`.
- Renamed the default export `Page()` → named export
  `InstitutionalDashboard()` (single `sed` substitution on line 647).
  All internal logic, hooks, and styling preserved untouched.

### Step 2 — New home components (`src/components/home/`)

**`mithqal-icons.tsx`** — 5 thin-line monoline SVG icon components,
each `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
`strokeWidth=1.6`, `aria-hidden`:
  - `SettlementIcon` — stacked layers + transaction pathways
  - `PolicyIcon` — shield + internal verification checkmark
  - `EvidenceIcon` — document + text lines + verification checkmark
  - `InteroperabilityIcon` — 4 corner nodes + central hub + connectors
  - `ContinuityIcon` — circular cycle with arrowheads (replay/continuity)

**`site-header.tsx`** — server component. Absolute dark glass header
(78px, z-20), `rgba(0,6,17,0.68)` + `backdrop-filter: blur(12px)`,
1px hairline bottom border. 3-column grid `1fr auto 1fr`:
  - Left: `Logo` client island (36×36) + wordmark "MITHQAL" (27px /
    0.27em letter-spacing).
  - Center: primary nav (Home active w/ gold underline, Features,
    Ecosystem, Roadmap, About) — 14px, 41px gap.
  - Right: outlined gold pill CTA "Explore Platform →" (999px radius,
    38px height, gold border `rgba(231,186,120,0.9)`).
  - Responsive: nav hidden <900px; CTA label hidden <620px (arrow only).
  - Keyboard-accessible (`:focus-visible` underlines, `aria-current`).

**`hero-section.tsx`** — server component. Full-screen hero
(`min-height:100svh`) over `/assets/mithqal-hero-background.png` with a
left-to-right dark gradient overlay for legibility. Left ~54% width:
  - Eyebrow: gold vertical rule + "The Institutional Settlement Control
    Plane" (CSS `text-transform:uppercase` → 12px / 600 / 0.30em / gold).
  - Headline: "Institutional Settlement. / Unified. Observable. /
    Controlled." — last word in bright gold `#F1C978`;
    `clamp(55px,5vw,78px)`, weight 400, line-height 0.98,
    letter-spacing -0.045em.
  - Description: the exact institutional positioning copy (max-width
    585px, 18px, line-height 1.62, `rgba(245,244,241,0.90)`).
  - CTAs: primary filled gold pill "Explore the Platform →" +
    secondary outlined "View Institutional Architecture".
  - Accepts `children` so the CapabilityRail can be composed in.
  - Responsive breakpoints at 1200px / 900px / 620px.

**`capability-rail.tsx`** — server component. 5-column grid anchored to
hero bottom (absolute, `bottom:39px`) on desktop with hairline vertical
dividers between cells. Each cell: gold icon + 16px title + 12.5px
description. The 5 capabilities use the exact institutional copy from
the spec. Responsive: 2 columns <900px (in-flow), 1 column <620px.

### Step 3 — New `src/app/page.tsx`
- Server component (no `"use client"`).
- Imports `SiteHeader`, `HeroSection`, `CapabilityRail` from home
  components; `InstitutionalDashboard` from the saved dashboard;
  `SiteFooter` from the existing footer.
- Composition: `<SiteHeader/>` → `<main>` → `<HeroSection><CapabilityRail/></HeroSection>`
  → `<section id="platform"><InstitutionalDashboard/></section>` →
  `</main>` → `<SiteFooter/>`.
- The "Explore the Platform →" CTA (both header and hero primary) links
  to `#platform`, scrolling to the dashboard anchor.
- Semantic HTML: `header`, `nav`, `main`, `section`, `h1`, `p`, `a`.
- Footer pinned to viewport bottom on short content via the existing
  `flex min-h-screen flex-col` wrapper in `layout.tsx` (`mt-auto`).

### Step 4 — CSS appended to `src/app/globals.css`
- Appended (did NOT overwrite) a new `:root` block with the MITHQAL
  color tokens: `--mithqal-black #000611`, `--mithqal-navy #07111f`,
  `--mithqal-navy-2 #0b1728`, `--mithqal-white #f5f4f1`,
  `--mithqal-muted #c7cbd2`, `--mithqal-gold #e7ba78`,
  `--mithqal-gold-bright #f1c978`, gold border/glow tokens,
  `--header-height 78px`, `--content-width 1380px`, and the
  institutional font stack.
- Added scoped `.mithqal-*` classes for header, hero, capability rail,
  platform section, and all responsive breakpoints + reduced-motion
  guards. No existing tokens overridden.

### Step 5 — Lint
- `bun run lint` → exit 0 (clean).

### Step 6 — Runtime verification
- Installed dependencies (`bun install` — node_modules was empty).
- Started `next dev -p 3000` (Next.js 16.1.3 Turbopack).
- `GET / 200` — 160866 bytes HTML rendered.
- Content grep confirms: "MITHQAL", "Institutional Settlement",
  "Unified. Observable.", "Controlled.", "The Institutional Settlement
  Control Plane" (eyebrow; CSS uppercases for display),
  "Settlement Orchestration", "Policy & Risk Controls",
  "Reconciliation & Evidence", "Multi-Rail Interoperability",
  "Continuity & Replay", "Explore the Platform", "Explore Platform",
  `mithqal-hero`, `mithqal-capability-rail`, `id="platform"` all
  present. Hero background image served from
  `/assets/mithqal-hero-background.png` (138KB, 1344×768).

## Files
- **New:** `src/components/home/mithqal-icons.tsx`,
  `src/components/home/site-header.tsx`,
  `src/components/home/hero-section.tsx`,
  `src/components/home/capability-rail.tsx`,
  `src/components/institutional-dashboard.tsx` (saved dashboard),
  `public/assets/mithqal-hero-background.png` (hero background).
- **Modified:** `src/app/page.tsx` (new homepage server component),
  `src/app/globals.css` (appended MITHQAL surface styles).
- **Unchanged:** all backend logic, MTQ, settlement, policy, prisma
  schema, API routes, layout.tsx, existing components.

## Constraints honored
- BUILD_MODE = FROZEN — no backend changes, no architecture changes.
- No secrets in source. No fake APIs or fake operational functionality.
- Institutional language only — no consumer/Web3 terminology
  ("DeFi", "digital ownership", "investment", "earn", "trading").
- MTQ not the primary message (homepage is settlement-control-plane
  positioning). MTQ remains disabled/optional.
- No marketing overclaims ("licensed", "bank-grade", "guaranteed
  settlement", "production ready" — none used).
- productionAuthorized = false. institutionallyValidated = false.
- Homepage functions independently from provider credentials.
- `prefers-reduced-motion` honored (transitions + smooth-scroll
  disabled).
- All decorative images `aria-hidden` / decorative bg via `role="img"`
  with descriptive `aria-label`. Logo `<img alt="Mithqal">`.
- Navigation keyboard accessible (`:focus-visible` indicators,
  `aria-current="page"` on active link).

## Status
- Lint: exit 0 (clean).
- Dev server: HTTP 200 confirmed (`GET / 200`, 160866 bytes).
- Commit: `MITHQAL-HOME-REFERENCE-FAITHFUL-UI`.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN.
