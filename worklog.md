# Mithqal Project Worklog

Shared work log for all agents working on the Mithqal Next.js project.
Read previous sections before starting; append (never overwrite) your own.

---
Task ID: 0
Agent: main (COO/PM orchestrator)
Task: Bootstrap project — analyze the Mithqal v18 FINAL blueprint, build the strategic execution playbook, then the public institutional website + Formation Committee intake.

Work Log:
- Extracted and read the full Mithqal v18 FINAL Consolidated Implementation Specification (850k chars) from /home/z/my-project/upload/MITHQAL.docx
- Defined the strategic thesis: Mithqal's Constitution permanently forbids a token sale (anti-platform, no discretionary minting, 100% reserve). Fundraising must flow through a separate equity vehicle (Entity B), not the monetary institution.
- Built the Strategic Execution Playbook (src/components/playbook.tsx) — dark gold institutional command center with 11 sections (status, invariants, 3-entity architecture, positioning, funding sources, 5-phase roadmap, 90-day sprint, moat, risks, next actions) + print-to-PDF.
- Built the public institutional website (src/components/public-site.tsx) — 12 sections distilled from the Constitution (identity, 6 objectives, 5 invariants, anti-platform, MTQ spec, reserves, governance, lifecycle, eligibility, status board, contact form).
- Added Prisma `FormationInterest` model + POST /api/formation-interest route (server-side validation, stores to SQLite).
- Refactored src/app/page.tsx into a hydration-safe view switcher (Institution ⇄ Playbook) using useSyncExternalStore on localStorage.
- Design system: dark gold/ink palette via CSS vars in globals.css (--gold, --ink, --reserve, --fg-muted); Fraunces serif display font + Geist sans; custom scrollbar; print stylesheet overrides to light theme for PDF export.
- Verified end-to-end via Agent Browser: both views render, form submits and writes to DB (2 rows confirmed), mobile responsive, lint clean.

Stage Summary:
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite + framer-motion.
- Files of record:
  - src/app/page.tsx — view switcher shell (currently 2 views)
  - src/components/playbook.tsx — internal COO playbook
  - src/components/public-site.tsx — public institutional site
  - src/lib/playbook-data.ts, src/lib/site-data.ts — content modules
  - src/app/api/formation-interest/route.ts — Formation Committee intake API
  - src/app/globals.css — design tokens + print styles
  - prisma/schema.prisma — FormationInterest model
- Design conventions: gold = `var(--gold)`, ink backgrounds = `bg-ink`/`bg-ink-soft`/`bg-ink-card`, muted text = `text-fg-muted`, serif = `font-display` (Fraunces). Always-on dark theme. Sticky footer via `flex min-h-screen flex-col` + `mt-auto`.
- Next: building (A) MTQ testnet dashboard + (B) investor teaser deck, dispatched as parallel subagents 2-a and 2-b.

---
Task ID: 2-b
Agent: full-stack-developer (deck)
Task: Build the 10-slide investor teaser deck viewer.

Work Log:
- Read worklog.md (Task 0 context), globals.css design tokens, page.tsx view switcher, existing deck.tsx stub, and shadcn button/badge APIs.
- Created src/lib/deck-data.ts exporting `SLIDES: Slide[]` — 10 investor-grade slides (cover, thesis, problem, institution, invariants, MTQ spec table, reserves, moat, ask, status/contact). Each slide = { id, eyebrow, title, body?, bullets?, table?, footer? }. Content distilled from the v18 FINAL positioning: constitutional settlement institution, 5 invariants, Entity B fundraising, MTQ never sold, 100%+ reserves, anti-platform permanently frozen.
- Overwrote src/components/deck.tsx with `"use client"` default export `InvestorDeck`:
  - State: `useState` slide index 0–9. `useEffect` keydown listener: ArrowRight/ArrowUp → next, ArrowLeft/ArrowDown → prev, Home → first, End → last. Guards against form-input targets.
  - Sticky top bar (no-print): gold Hexagon mark + "Investor Teaser Deck" label + current slide title (truncated) + "Download PDF" button calling `window.print()`.
  - Slide stage: max-w-5xl, min-h-[70vh] sm:min-h-[78vh], rounded-2xl border-line/60 bg-ink-soft p-6 sm:p-10 lg:p-14, `grain-bg` texture, gold top rule, drop shadow. AnimatePresence (mode=wait) animates x:24→0→-24 with opacity on slide change.
  - Slide chrome bottom: eyebrow + "NN / 10" counter row, then progress dots (10, clickable, active = gold wider pill) + Prev/Next shadcn Buttons (ghost/default), 44px touch targets (h-10 min-w-11). Keyboard hint line below.
  - SlideBody component (shared by interactive + print): gold uppercase tracked eyebrow, font-display gold-text title (text-balance), muted body (max-w-2xl), bullets with gold rotated-square dots, table as dl with divide-y divider lines (responsive grid-cols-[160px_1fr] on sm+), italic muted footer. Cover + contact slides centered with larger title + corner slide counter.
  - Corner gold seal mark on every slide (Hexagon outline + serif "M" with gold-text gradient).
  - Print: root has `print-page`; interactive stage + top bar + nav/dots marked `no-print`. Separate `.print-block` stack renders all 10 slides stacked, each `print-card print:break-after-page min-h-screen` so Save-as-PDF yields one slide per page on white background (existing print CSS flips the theme).
  - Disclaimer footer (mt-auto, screen + print): "Confidential. Derived from the Mithqal v18 FINAL specification. Not an offer to sell securities or any MTQ unit. MTQ is minted exclusively against verified reserves."
  - Responsive: mobile shrinks stage padding to p-6, dots wrap (flex-wrap), buttons stay 44px, keyboard hint + counter hidden text on xs where noted.
- Ran `bun run lint` — zero errors in my files. dev.log shows my deck compiles successfully (the only remaining error is `@/components/testnet` which belongs to parallel task 2-a, not in scope here).

Stage Summary:
- Files created/overwritten:
  - src/lib/deck-data.ts (new — 10 slide content objects)
  - src/components/deck.tsx (overwrote stub — full viewer)
- Key decisions:
  - Shared SlideBody component reused for both interactive and print rendering to guarantee content parity.
  - Print stack is a separate `.print-block` block (hidden on screen via the `display:none` rule in globals.css, shown only in print) rather than trying to make the single-slide interactive stage expand — keeps interactive animations and print layout cleanly decoupled.
  - Cover (slide 1) and contact (slide 10) get a centered "feature" layout with larger title; all other slides are left-aligned content slides.
  - Bullets use a rotated gold square (diamond) marker rather than checkmarks — matches the institutional seal aesthetic.
  - Table on slide 6 uses semantic <dl>/<dt>/<dd> with divide-y for clean spec/value rows.
- No backend, no Prisma, no API — pure client component as required.
- Did NOT touch globals.css, page.tsx, prisma, or any other component (only deck.tsx + deck-data.ts).

---
Task ID: 2-a
Agent: main (built directly after subagent timeout)
Task: Build the MTQ testnet dashboard — reserve simulator with mint/redeem/PoR/NAV/tiers + API.

Work Log:
- Added Prisma TestnetOperation ledger model (append-only) — schema already pushed by main.
- Built src/lib/testnet-engine.ts: pure reserve mechanics deriving state from the ledger. 4-tier basket (60/25/10/5% targets), deterministic per-op price drift (±0.4%, mean-reverting, LCG-seeded so reproducible), NAV = reserveValue/supply, reserveRatio = reserveValue/(supply*par)*100, PoR hash via djb2 over canonical string. Mint guard enforces 100% floor; redemption never refused, 0.05% fee.
- API routes: GET /api/testnet (derived state + last 25 ops), POST /api/testnet/mint (validates, guards on ratio, persists NAV/ratio/PoR on the op), POST /api/testnet/redeem (proportional claim minus 0.05% fee), POST /api/testnet/seed (idempotent genesis $50M deposit).
- Built src/components/testnet.tsx: hero, 4-KPI strip (Supply/Reserve/NAV/Ratio with tone), paused-warning banner, empty-state seed button, Proof-of-Reserves card, 4-tier reserve composition with share-vs-target bars + price drift, mint + redeem simulator forms, and a scrollable operation ledger table (sticky header, custom scrollbar). Uses useToast for feedback, framer-motion reveals, Skeleton loaders.

Stage Summary:
- Files: src/lib/testnet-engine.ts, src/app/api/testnet/{route,mint/route,redeem/route,seed/route}.ts, src/components/testnet.tsx.
- Smoke test passed: seed→state (49M supply, 100% ratio, NAV $1.00, tiers with drifting prices); mint $2M→51M supply, ratio held 100%; redeem 500K MTQ→net $499,750 (fee $250 = 0.05%); PoR hash changes per op.
- Lint clean.

---
Task ID: 3 (both)
Agent: main
Task: Build the public Constitution docs site (citable v18 reference) + the Admin Formation Committee pipeline console.

Work Log:
- Mapped the full v18 blueprint structure: 4 layers + 1 operations layer, ~47 articles (Layer 1 Institutional I–XVII, Layer 2 Monetary I–VII, Layer 3 Governance & Policy I–VIII, Layer 4 Technical I–VIII, Layer 5 Operations I–VII).
- Extended page.tsx toggle from 4→6 views (added Constitution + Admin) with ScrollText / LayoutDashboard icons. useSyncExternalStore + localStorage persists view.
- Constitution docs: src/lib/constitution-data.ts (5 layers, 47 articles; detailed sections for Layer 1 core articles I–V + XIV; index entries for the rest). src/components/constitution.tsx: sticky sidebar TOC grouped by layer (mobile hamburger + backdrop), search filter, Preamble view (identity/mission/humility/not), ArticleView with frozen badges + provisions, prev/next nav, citation footer.
- Admin: GET /api/admin/interests (overall totals + byRole always unfiltered; ?role= filter applies only to rows; returns filtered count). src/components/admin.tsx: 5 stat cards (total/investors/advisors/anchors/nominees), role filter pills with counts, scrollable table (time/name/org/role-badge/contact-mailto/message-clamped), CSV export (Blob download), refresh. Stats stay stable across filters.

Stage Summary:
- Files: src/lib/constitution-data.ts, src/components/constitution.tsx, src/app/api/admin/interests/route.ts, src/components/admin.tsx; page.tsx updated to 6 views.
- Verified via Agent Browser: all 6 views toggle cleanly, zero errors. Constitution: 47 articles in sidebar, search works (cryptography→1 match, x→19), Article V shows "Permanently frozen" badge, prev/next nav works, mobile hamburger opens sidebar. Admin: loads real DB data (2 submissions — Omar investor, Amira anchor), stats stable [2,1,0,1,0] across filters, filter to Investor→1 row, CSV export present, mobile table scrolls horizontally.
- Lint clean. Dev log shows GET /api/admin/interests 200 with Prisma groupBy + count queries.
