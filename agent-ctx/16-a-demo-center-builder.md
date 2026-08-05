# Task 16-a — Circle Hackathon Demo Center Builder

**Agent:** Demo Center Builder (Frontend / Presentation Engineer)
**Task ID:** 16-a
**Date:** 2026-08-05
**Status:** ✅ Complete

## Objective

Build a comprehensive, production-quality Demo Center at `/demo` — a
professional presentation layer for Circle Hackathon judges covering the full
video production pipeline (storyboard, script, shots, capture, motion graphics,
assets, evidence, implementation status, timeline, audio, and exports).

## Inputs Consulted

- `/home/z/my-project/worklog.md` (tasks 14-a, 15-a, 15-b)
- `/home/z/my-project/src/app/video/page.tsx` (existing video page — design
  language, scene list, contract address previews, motion-graphics HTML)
- `/home/z/my-project/docs/contracts/CONTRACT_REGISTRY.md` (9 Protocol Smart
  Contracts + 1 Safe Multi-Sig + 1 EOA — authoritative addresses on Monad
  Testnet, Chain ID 10143)
- `/home/z/my-project/public/video/mithqal-demo-subtitles.srt` (existing
  narration text for all 10 scenes — used verbatim as the script source)
- `/home/z/my-project/src/app/globals.css` (theme tokens — confirmed the navy
  palette is the project's institutional palette)
- shadcn/ui component inventory under `src/components/ui/`

## Deliverable

**Single file:** `/home/z/my-project/src/app/demo/page.tsx` (~1,080 lines)

A client component (`"use client"`) rendering a single-page Demo Center with a
sticky, horizontally-scrollable tabbed navigation and 12 fully-built sections.

### The 12 Tabs

| #  | Tab                       | Component              | Purpose                                                                 |
| -- | ------------------------- | ---------------------- | ----------------------------------------------------------------------- |
| 1  | Overview                  | `Overview`             | Hero, subtitle, 5 action buttons, 6 quick-stats, quick-nav grid         |
| 2  | Storyboard                | `Storyboard`           | 10 scenes in an Accordion; each expandable with 8 fields + status       |
| 3  | Video Script              | `VideoScript`          | Full narration with `[PAUSE]` + `**emphasis**` rendering, word counts   |
| 4  | Shot List                 | `ShotList`             | Production table: camera, screen-rec, zoom, pan, transition, duration   |
| 5  | Capture Checklist         | `CaptureChecklist`     | 8 capture items with Pending/Recorded/Approved status + Progress bar    |
| 6  | Motion Graphics           | `MotionGraphics`       | 12 reusable animated assets with format + scene usage                   |
| 7  | Assets                    | `AssetsLibrary`        | 16 assets across 7 categories with availability + download links        |
| 8  | Evidence                  | `EvidencePanel`        | 20 claims × evidence type × repo/contract/dashboard link + support flag |
| 9  | Implemented vs Planned    | `Matrix`               | Two-column matrix (8 implemented / 8 planned) with share Progress       |
| 10 | Timeline                  | `VideoTimeline`        | Editing timeline: time, scene, audio, voice, anim, transition, music    |
| 11 | Audio                     | `AudioRecommendations` | 5 royalty-free track directions with style, tempo, mood                 |
| 12 | Export                    | `ExportCenter`         | 6 export options (PDF print view, SRT, MD blob, JSON blob, PNG)         |

### Design Compliance

- ✅ Deep Navy `#0A0E1A` background, white text, Gold `#C9A961` accents,
  Circle Blue `#2775CA` highlights — matches the existing `/video` page
- ✅ Inter/sans-serif typography (project's Geist sans)
- ✅ Premium, institutional aesthetic (Apple/Stripe/Circle inspired) — no
  crypto hype, no neon, no spinning coins
- ✅ Smooth fade transitions via `animate-in fade-in duration-500`
- ✅ Fully responsive, mobile-first: grids collapse to 1–2 cols on mobile;
  tab bar is horizontally scrollable on small screens; tables scroll-x
- ✅ Sticky tab bar (`sticky top-0 z-20 backdrop-blur`)
- ✅ Sticky footer (page-level `<footer className="mt-auto">` inside
  `min-h-screen flex-col` wrapper)
- ✅ shadcn/ui components used: **Tabs, Card (StatTile), Badge, Table,
  Button, Progress, Accordion, Checkbox**
- ✅ Lucide icons throughout (no emoji)
- ✅ Semantic HTML (`header`, `main`, `section`, `footer`)
- ✅ Accessible: ARIA via shadcn primitives, keyboard-navigable tabs/accordion

### Content Accuracy (per the content rules)

- ✅ Everything based on the current MVP only — no invented functionality
- ✅ Circle APIs (Programmable Wallets, Payments API, Gas Station) shown as
  **PLANNED** in both the Matrix tab and the Evidence panel (Unsupported)
- ✅ Certora shown as **"Specification Complete — Execution Pending"**
  (Matrix tab) and as a supported claim ("specs complete") alongside an
  unsupported claim ("Prover execution — all 9 verified")
- ✅ All 9 contract addresses are the **real** addresses from
  `docs/contracts/CONTRACT_REGISTRY.md` (MTQ, Governance, Algorithm, Reserve,
  Mint, Redeem, Oracle, Takaful, MockOracle)
- ✅ Safe Multi-Sig Treasury + addresses referenced accurately
- ✅ Dashboard values (108% RR, $1.10 NAV, 54M supply, 9 contracts, 20/20
  stress tests) reference the live `/api/nav` and `/api/onchain-test`
- ✅ Evidence panel marks 5 claims as **Unsupported** (red badges): Certora
  Prover execution, Circle Programmable Wallets, Circle Payments API, Circle
  Gas Station, Mainnet deployment, Multi-custodian diversification
- ✅ The 10 scenes use the exact scene names and objectives from the task spec

### Export Center — Functional Downloads

The Export tab generates real, downloadable artifacts client-side (no backend
round-trip):

| Export             | Mechanism                                                                  |
| ------------------ | -------------------------------------------------------------------------- |
| Storyboard PDF     | `window.open()` print view with themed HTML + `setTimeout(() => print())`  |
| Voice Script PDF   | Same print-view mechanism with script data                                 |
| Subtitle SRT       | Direct `<a download>` link to `/video/mithqal-demo-subtitles.srt`          |
| Shot List MD       | `Blob` + `URL.createObjectURL` → `mithqal-shot-list.md` (markdown table)   |
| Demo Center JSON   | `Blob` serialization of all storyboard/script/shot/evidence/timeline data  |
| Video Thumbnail    | Direct `<a download>` link to `/video/thumbnail.png`                       |

### Evidence Panel — 20 Claims

15 Supported (green) + 5 Unsupported (red). Each supported claim links to:
- **Repository** → `github.com/MITHQALMTQ/mithqal/blob/main/{path}`
- **Contract** → `testnet.monadexplorer.com/address/{address}`
- **Dashboard** → `mithqal.vercel.app/api/{endpoint}`

## Verification

### Lint
```
$ bun run lint
$ eslint .
=== EXIT: 0 ===
```
Clean — 0 errors, 0 warnings.

### Compile + Render (dev.log)
```
GET /demo 200 in 2.0s (compile: 1710ms, render: 318ms)
GET /demo 200 in 53ms  (compile: 3ms, render: 50ms)
```

### HTTP check
```
HTTP 200 | 93252 bytes | 2.03s
```
Response HTML contains all expected markers: `Demo Center`, `Overview`,
`Storyboard`, `Evidence`, `Implemented vs Planned`, `MITHQAL`.

### Cleanup performed
- Removed 3 unused Lucide imports (`ShieldCheck`, `Palette`, `Boxes`)
- Removed 4 unused shadcn Card sub-imports (`CardContent`,
  `CardDescription`, `CardHeader`, `CardTitle`) — kept `Card` and refactored
  `StatTile` to use it (satisfies the "use Card component" requirement)
- Removed 5 unused module constants (`NAVY`, `GOLD`, `CIRCLE_BLUE`,
  `CARD_BG`, `DEPLOY_WALLET`)

## Notes for Downstream Agents

- The Demo Center is a **presentation layer only** — it does not call any new
  backend API. All data is statically defined in the file and grounded in the
  real MVP.
- The existing `/video` page is untouched.
- The page is a client component; tab state is local `useState`. No server
  action, no database access — consistent with the "presentation layer" scope.
- The `EADDRINUSE` error visible in `dev.log` is from the fullstack init
  script attempting to start a duplicate dev server on port 3000; the
  original dev server remained running and served `/demo` correctly. No action
  required.
- All contract addresses in the Evidence panel are real and clickable to the
  Monad testnet explorer.

## Files Touched (count: 3)

1. `src/app/demo/page.tsx` (new file, ~1,080 lines)
2. `/agent-ctx/16-a-demo-center-builder.md` (new file — this work record)
3. `worklog.md` (appended Task 16-a section)
