# Task 5-A — UI/UX Remediation Sub-agent

**Task ID:** 5-A
**Agent:** Sub-agent (general-purpose) — UI/UX Remediation
**Started:** 2026-09-28
**Status:** ✅ COMPLETE

## Mission

Fix the visual + accessibility defects identified by audit 2-A: mobile horizontal overflow on `/`, missing `<h1>` on `/`, missing `<main>` + `<footer>` on `/api-docs`, missing `<footer>` on `/video`, heading hierarchy violations on `/demo` and `/video`, cosmetic text spacing on `/demo`, and missing raw 0x contract addresses on `/status`.

## Files Modified (5)

| File | Defects Addressed | Lines Changed |
| --- | --- | --- |
| `src/app/page.tsx` | 1, 2 | ~30 lines added/edited across currency-weight table wrapper, mobile-nav layout, hero sr-only h1, corridor-simulator step-row overflow fix |
| `src/app/api-docs/page.tsx` | 3 | ~15 lines added (main wrapper + footer element) |
| `src/app/video/page.tsx` | 4, 6 | ~31 lines added (footer element + sr-only h1 + visible h1→h2 demotion) |
| `src/app/demo/page.tsx` | 5, 7 | ~19 lines edited (sr-only h1 + h1→h2 demotion + \u00A0 explicit spaces) |
| `src/app/status/page.tsx` | 8 | +210 lines (ContractAddressesSection + ContractCard + ContractRow + imports) |

## Defects Closed (8/8)

| # | Route | Severity | Defect | Fix | Verified |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | MAJOR | Mobile horizontal overflow: scrollWidth=2091px on 375px viewport | Wrapped currency-weight table in `overflow-x-auto`; changed parent flex to `flex-col lg:flex-row`; added `w-full` to mobile nav; wrapped corridor-sim step rows | scrollWidth = 375 ✓ |
| 2 | `/` | MAJOR | Zero `<h1>` elements | Added `<h1 className="sr-only">Mithqal — §V25.3 Institutional Command Center</h1>` at top of main | h1 count = 1 ✓ |
| 3 | `/api-docs` | MAJOR | NO `<footer>` + NO `<main>` landmark | Wrapped content in `<main className="flex-1">`; converted footer div to `<footer>`; root div upgraded to `flex min-h-screen flex-col` | main+footer count = 2 ✓ |
| 4 | `/video` | MAJOR | NO `<footer>` (61px gap on tall viewports) | Added `<footer className="mt-auto border-t border-[#C9A961]/15 …">` | footer count = 1 ✓ |
| 5 | `/demo` | MAJOR | Heading hierarchy H2 → H1 → H3 (WCAG 1.3.1) | Added sr-only `<h1>Mithqal Demo Center</h1>` at top of main; demoted visible hero h1 to h2 | Order: H1→H2→H2→H3 ✓ |
| 6 | `/video` | MAJOR | Heading hierarchy H2 → H1 | Same pattern: sr-only h1 at top of main; demoted visible MITHQAL h1 to h2 | Order: H1→H2→H2 ✓ |
| 7 | `/demo` | COSMETIC | "MITHQAL —Constitutional SettlementInstitution" missing spaces | Replaced fragile JSX `{" "}` with `\u00A0` non-breaking spaces | textContent = `MITHQAL — Constitutional Settlement Institution` ✓ |
| 8 | `/status` | COSMETIC | No raw 0x contract addresses on page | Added ContractAddressesSection reading CHAINS + SOLANA_NETWORKS from src/lib/chains.ts (single source of truth); 22 addresses total with copy-to-clipboard shadcn Buttons | 22 addresses + 22 copy buttons rendered ✓ |

## Verification Output (live, captured via agent-browser)

```
$ agent-browser set viewport 375 667
$ agent-browser open http://localhost:3000/ --load networkidle
$ agent-browser eval "document.documentElement.scrollWidth"
375                                                # was 2091
$ agent-browser eval "document.querySelectorAll('h1').length"
1                                                  # was 0

$ agent-browser open http://localhost:3000/api-docs
$ agent-browser eval "document.querySelectorAll('main, footer').length"
2                                                  # was 0

$ agent-browser open http://localhost:3000/video
$ agent-browser eval "document.querySelectorAll('footer').length"
1                                                  # was 0
$ agent-browser eval "Array.from(document.querySelectorAll('h1,h2,h3')).map(e=>e.tagName+':'+e.textContent.slice(0,30)).join(' | ')"
"H1:MITHQAL — Constitutional Settl | H2:Cross-border settlement remain | H2:MITHQAL"   # was H2 → H1

$ agent-browser open http://localhost:3000/demo
$ agent-browser eval "Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(e=>e.tagName+':'+e.textContent.slice(0,30)).join(' | ')"
"H1:Mithqal Demo Center | H2:Overview | H2:MITHQAL — Constitutional Settl | H3:Explore the Demo Center"   # was H2 → H1 → H3
```

## Desktop Regression Check (1280×800)

```
$ agent-browser set viewport 1280 800
$ agent-browser open http://localhost:3000/
$ agent-browser eval "document.documentElement.scrollWidth"
1280                            # no horizontal overflow on desktop ✓
$ agent-browser eval "Array.from(document.querySelectorAll('nav[aria-label=\"Section navigation\"]')).filter(n => n.getBoundingClientRect().width > 0).map(n => Math.round(n.getBoundingClientRect().width))"
[224]                            # desktop sidebar nav (w-56 = 224px) correctly visible on lg+
```

## Lint Check

```
$ cd /home/z/my-project && bun run lint 2>&1 | tail -5
✖ 29 problems (29 errors, 0 warnings)
error: script "lint" exited with code 1
```

Baseline (before my changes, verified via `git stash && bun run lint`):
```
✖ 29 problems (29 errors, 0 warnings)
```

→ My changes introduced **ZERO new lint errors**. All 29 errors are pre-existing in `src/hooks/use-mobile.ts`, `src/lib/use-wallet.ts`, existing `useEffect` blocks in `src/app/page.tsx` DynamicReserveSimulator/CorridorSimulator, the existing `setMounted(true)` in `src/app/status/page.tsx` line 207, and 8 unrelated dashboard components.

## Screenshots (in `/home/z/my-project/screenshots/audit-v25.4-fixed/`)

- `home-mobile.png` — 375×667 viewport, full page (post-fix)
- `home-desktop.png` — 1280×800 viewport, full page (regression check)
- `api-docs.png` — full page (post-fix, footer visible at bottom)
- `video.png` — full page (post-fix, footer visible at bottom)
- `demo.png` — full page (post-fix, MITHQAL hero with proper spacing)
- `status.png` — full page (post-fix, Contract Addresses section visible)

## Dev Server Recovery Notes

The dev server (PID 15020 parent init) crashed twice during the audit — same memory-pressure pattern documented in audit 2-B DEFECT-1 (sandbox cgroup memory limit). Re-spawned twice via the `setsid -f` pattern documented in `start-dev.sh`. The keep-alive ping loop (PID 15022) continued pinging throughout. Final state at end of audit: PID 19373 alive on port 3000, all routes 200 OK.

No `bun run build` was invoked (per task constraints). No business logic was modified — only UI/UX layer (HTML landmark elements, headings, overflow containers, copy-to-clipboard component).

## Notes for the Operator

1. **The sr-only `<h1>` strategy**: Defects 2, 5, and 6 were all fixed by adding a sr-only `<h1>` at the top of `<main>` and (where applicable) demoting the existing visible `<h1>` to `<h2>`. This preserves the visual design while satisfying WCAG 1.3.1 heading-order requirements and giving screen-reader users a top-level page heading.
2. **Single source of truth for contract addresses (Defect 8)**: The new `ContractAddressesSection` reads `CHAINS` and `SOLANA_NETWORKS` directly from `src/lib/chains.ts` — the same module `/api/contract/info` and `/api/status` consume. The displayed addresses cannot drift from the canonical registry. Local Anvil chain is intentionally hidden (dev-only).
3. **The mobile-nav flex layout fix (Defect 1, deeper root cause)**: Audit 2-A blamed the currency-weight TABLE for the overflow (right=2458px). After wrapping that table in `overflow-x-auto`, scrollWidth dropped from 2091 → 407. Further investigation revealed the remaining 407px was caused by the 17 shrink-0 buttons in the mobile horizontal-scroll nav being laid out as flex-row siblings of `<main>` (instead of stacked above). Changing the parent flex container to `flex-col lg:flex-row` (and adding `w-full` to the mobile nav) brought scrollWidth down to 375. A final 32px phantom overflow from the Corridor Simulator's step rows (long text like "Atomic MTQ mint (1,000,000)") was eliminated by wrapping each row in `overflow-x-auto` + adding `min-w-0 truncate` to the long step-name span.
4. **Pre-existing lint errors (informational)**: 29 pre-existing errors remain in `src/hooks/use-mobile.ts`, `src/lib/use-wallet.ts`, and 11 other files — all from React 19's new effect-state rules. None are caused by my changes. These should be cleaned up in a separate remediation task.
