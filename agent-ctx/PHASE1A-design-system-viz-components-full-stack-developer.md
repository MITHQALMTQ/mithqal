# PHASE1A — Design System + Viz Components

**Task ID:** PHASE1A
**Agent:** full-stack-developer (design system + viz components)
**Status:** COMPLETE
**Date:** 2025-10-15

## Files Touched (within ownership list only)

| File | Action | LOC |
|---|---|---|
| `src/app/globals.css` | EDIT (dedupe + new utilities) | 870 → 906 |
| `src/components/shared/sparkline.tsx` | NEW | 196 |
| `src/components/shared/count-up.tsx` | NEW | 138 |
| `src/components/shared/stat-card.tsx` | NEW | 246 |
| `src/components/shared/page-header.tsx` | NEW (file didn't exist; created fresh with full enhanced functionality) | 168 |

## Deliverables Summary

### 1. globals.css OVERHAUL
- **Removed 4 duplicate definitions**: `.glass` (kept L266 institutional theme-aware version, removed L799 2026 Modern hardcoded version + L806 `.dark .glass` override), `.card-hover` (kept L353 premium gold-accented version, removed L820 modern basic version), `::-webkit-scrollbar` (kept L203 theme-aware version, removed L845 modern 8px gray version), `html { scroll-behavior }` (kept L793 version with `scroll-padding-top: 120px`, removed L221 basic version).
- **Added `.glass-gold`** in the Glassmorphism section (between `.glass-strong` and `.glass-card`). Task note said "another agent already added it" — verified NOT present at start; added since `globals.css` is in my ownership list.
- **Appended "State-of-the-art animation + depth utilities (PHASE1A)" section** at end of file with these utilities (all per spec):
  - `.card-lift` — spring-bounce translateY(-4px) on hover with `cubic-bezier(0.34, 1.56, 0.64, 1)`, gold-tinted box-shadow.
  - `.gold-glow-ring` — gold ring + 20px halo.
  - `.mesh-gradient` — 3-stop radial gold/reserve mesh.
  - `.shimmer-bg` — gold sweep shimmer animation. **Keyframe renamed `shimmer` → `shimmer-bg`** to avoid overriding the pre-existing `@keyframes shimmer` at L327 used by 9+ components (infrastructure.tsx, testnet.tsx, v23-metrics-panel.tsx, etc.). Documented in a comment.
  - `.scroll-progress-bar` — fixed-position 2px gold gradient bar with width transition.
  - `.stagger-in > *` — staggered fade-in with 6 explicit `nth-child` delays + `nth-child(n+7)` catch-all (0.35s).
  - `@keyframes staggerIn`
  - `.glass-depth` — 135deg gold-tinted linear gradient + 20% gold border + `blur(16px) saturate(1.2)` + 32px drop shadow + inset 1px white highlight. Used by StatCard.
  - `.pulse-dot` — 8px reserve-colored dot with `pulse-ring` keyframe.
  - `@keyframes pulse-ring`
  - **`@media (prefers-reduced-motion: reduce)` block** at the very end disabling `.card-lift:hover` transform, `.shimmer-bg` animation, `.stagger-in > *` animation, and `.pulse-dot` animation — WCAG 2.1 §2.3.3 compliance.

### 2. Sparkline Component (`src/components/shared/sparkline.tsx`)
- `"use client"`, recharts-based.
- Props: `data: number[]`, `color?: string` (default `"#f59e0b"` amber-500), `height?: number` (default 32), `width?: number` (default 80), `showArea?: boolean`, `className?: string`, `ariaLabel?: string` (default `"Trend"`).
- `<ResponsiveContainer>` wrapping `<AreaChart>` (showArea=true, with linearGradient fill via stable `useId`-derived gradient id) or `<LineChart>`.
- `type="monotone"`, `strokeWidth={2}`, `dot={false}`, `isAnimationActive={false}`. NO axes/grid/tooltip visible.
- Hidden `<YAxis domain={[min-pad, max+pad]} hide />` for tight vertical scaling (10% range padding; ±1 padding for flat single-value series).
- Empty / single-point data handled (flat baseline rendered so card layout never collapses).
- Color resolution: pure `useMemo`-based `safeColor()` — accepts hex/rgb directly, falls back to DEFAULT_COLOR for `var(--…)` strings (CSS vars can't be resolved inside SVG presentation attributes at parse time). First implementation used `useState` + `useEffect` for client-side var resolution and tripped the `react-hooks/set-state-in-effect` lint rule — refactored to remove the hook pattern entirely.
- Wrapped in `<div role="img" aria-label={ariaLabel} style={{ pointerEvents: "none" }}>` so the chart is decorative (hidden from AT).
- Exported named `Sparkline` + default.

### 3. CountUp Component (`src/components/shared/count-up.tsx`)
- `"use client"`, framer-motion-based.
- Props: `value: number`, `decimals?: number` (default 0), `prefix?: string`, `suffix?: string`, `duration?: number` (default 1.0), `format?: boolean` (default true → `toLocaleString`), `className?: string`, `as?: keyof typeof motion` (default `"span"`).
- `useMotionValue(0)` → `useTransform(mv, latest => format(latest))` → `useEffect` calls `animate(mv, value, { duration, ease: "easeOut" })` with `controls.stop()` cleanup.
- Honors `prefers-reduced-motion`: instant jump via `mv.set(value)` when `matchMedia` matches.
- MotionValue<string> passed as child of polymorphic `<MotionTag>` (motion.span by default; swappable to motion.div for block-level hero counters via `as` prop).
- `aria-label` carries the FINAL formatted value (not the in-flight one) so screen readers announce the destination immediately.
- `formatNumber` guards against `NaN`/`Infinity` by coercing to 0.
- SSR-safe: `useMotionValue(0)` means initial paint shows `$0` before hydration kicks off the tween (matches spec example `"$0" → "$4,450,000"`).
- Exported named `CountUp` + default.

### 4. StatCard Component (`src/components/shared/stat-card.tsx`)
- `"use client"`.
- Imports `Card` from `@/components/ui/card`, `cn` from `@/lib/utils`, `LucideIcon` type from lucide-react, `CountUp` from `./count-up`, `Sparkline` from `./sparkline`.
- Props: `label`, `value: string|number`, `icon?: LucideIcon`, `color?: StatColor` ("gold"|"emerald"|"amber"|"red"|"blue"|"purple"|"cyan", default "gold"), `sparklineData?: number[]`, `sub?: string`, `decimals?: number` (default 0), `prefix?`, `suffix?`, `className?`, `href?`, `onClick?`.
- `COLOR_MAP` per-color tokens — gold→#f59e0b/amber-400, emerald→#34d399/emerald-400, amber→#f59e0b/amber-400, red→#f87171/red-400, blue→#60a5fa/blue-400, purple→#c084fc/purple-400, cyan→#22d3ee/cyan-400.
- Layout: 3-section vertical stack inside `<Card className="glass-depth card-lift relative overflow-hidden p-5 flex flex-col gap-0 rounded-xl">`:
  - Top row: icon chip in tinted `rounded-lg` with `ring-1` border + uppercase label.
  - Middle row: big value left + sparkline right on `flex items-end justify-between`.
  - Optional sub-text below.
- Value: animated via `<CountUp>` when numeric; plain `<span>{prefix}{value}{suffix}</span>` when string.
- Polymorphic wrapper: `<a>` when `href`, `<button type="button">` when `onClick`, default `<Card>`.
- Inner JSX hoisted into `<>` Fragment so it can be slotted under any of the 3 wrappers.
- Sparkline defaults to `showArea=true`, `height=28`, `width=70`.
- Exported named `StatCard` + default.

### 5. PageHeader Component (`src/components/shared/page-header.tsx`)
- Server component (no `"use client"` directive — no hooks needed; scroll-progress-bar width updated externally via `document.querySelector(".scroll-progress-bar")` from a client-side hook elsewhere).
- Imports `Link` from `next/link`, `cn` from `@/lib/utils`, 6 breadcrumb primitives from `@/components/ui/breadcrumb`.
- Props: `title: string`, `description?: ReactNode`, `breadcrumbs?: { label: string; href?: string }[]`, `actions?: ReactNode`, `className?: string`, `goldTitle?: boolean` (default true → `.gold-text` gradient on h1), `headingLevel?: 1|2|3|4|5|6` (default 1 — polymorphic heading element so nested PageHeaders don't break the a11y heading tree).
- Renders `<header>` with 3 stacked sections:
  1. `<div className="scroll-progress-bar" aria-hidden="true" style={{ width: 0 }}>` — CSS in globals.css handles fixed position + gold gradient.
  2. Optional `<Breadcrumb aria-label="Breadcrumb">` (overrides shadcn's default "breadcrumb" lowercase to match task spec exactly). Contains `<BreadcrumbList>` with each crumb as `<BreadcrumbItem>` — last crumb renders as `<BreadcrumbPage>` (aria-current="page"); non-last crumbs with `href` render as `<BreadcrumbLink asChild>` wrapping Next.js `<Link>`; crumbs separated by `<BreadcrumbSeparator>/</BreadcrumbSeparator>` (overrides shadcn's default `ChevronRight` with literal `"/"` per task spec).
  3. Title + actions row: `flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between` — mobile: actions below title; sm+: actions to the right. Title rendered via polymorphic `<Heading>` (`h1` by default) with `font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl` + `.gold-text` or `text-foreground`. Description as `<div>` (ReactNode-safe) below title with `max-w-2xl text-sm text-fg-muted sm:text-base`. Actions in `flex flex-wrap items-center gap-2 sm:shrink-0` container.
- Breadcrumbs wrap on mobile via BreadcrumbList's built-in `flex flex-wrap`.
- Exported named `PageHeader` + default.

## Verification Results

- **Lint** (`bun run lint`): EXIT 0 (0 errors, 0 warnings). One intermediate error fixed: `react-hooks/set-state-in-effect` at sparkline.tsx:123 — refactored to pure `useMemo` + `safeColor()` (no state, no effect).
- **TypeScript** (`bun run tsc --noEmit`): ZERO errors in my 5 files. One intermediate error fixed: recharts doesn't export `AxisDomain` type — changed `computeYDomain` return type to `[number, number]` (assignable to recharts' `AxisDomain` tuple type). The 281 pre-existing errors in `src/shadow/*` (reserve-model*.ts files owned by another agent — NOT in my file ownership list) remain unchanged.
- **CSS brace balance**: depth=0 at end, comments closed (verified via Node script reading the entire 906-line file).
- **File presence**: All 5 owned files confirmed present.
- **No new packages installed** (used existing recharts ^2.15.4, framer-motion ^12.23.2, lucide-react ^0.525.0, next/link, shadcn/ui Card + Breadcrumb primitives).
- **No files outside ownership list touched.**

## Importable API (for parallel agents)

```ts
// Sparkline
import { Sparkline } from "@/components/shared/sparkline";
// or: import Sparkline from "@/components/shared/sparkline";

// CountUp
import { CountUp } from "@/components/shared/count-up";

// StatCard
import { StatCard } from "@/components/shared/stat-card";
import type { StatColor } from "@/components/shared/stat-card";

// PageHeader
import { PageHeader } from "@/components/shared/page-header";
import type { PageHeaderBreadcrumb } from "@/components/shared/page-header";
```

## CSS Classes Available (from globals.css PHASE1A section)

```css
.card-lift            /* spring-bounce hover translateY(-4px) + gold shadow */
.gold-glow-ring      /* gold ring + 20px halo */
.mesh-gradient       /* 3-stop radial gold/reserve mesh background */
.shimmer-bg          /* gold sweep shimmer animation */
.scroll-progress-bar /* fixed-position 2px gold gradient bar (width set by JS) */
.stagger-in > *      /* staggered fade-in (apply to parent of list) */
.glass-depth         /* 135deg gold-tinted glass + drop shadow + inset highlight */
.pulse-dot           /* 8px reserve-colored dot with pulse-ring */
.glass-gold          /* gold-tinted glassmorphism (added between .glass-strong and .glass-card) */
```

## Honest State

- BUILD_MODE = FROZEN. PRODUCTION_AUTHORIZED = false.
- Lint EXIT 0 for my files.
- TypeScript EXIT 0 for my files.
- No git operations performed (operator review).
- The `.glass-gold` task note claimed "another agent already added it" — verification FAILED at start (file did not contain it); I added a minimal definition since `globals.css` is in my ownership list.
- One spec deviation: renamed `@keyframes shimmer` → `@keyframes shimmer-bg` to avoid clobbering the pre-existing `@keyframes shimmer` at L327 used by 9+ components. Documented in code comment.
- One spec refinement: PageHeader spec said "EDIT — currently 3 LOC" but file didn't exist; created fresh with full enhanced functionality. No regression — there was no prior implementation to preserve.

NOT PRODUCTION-AUTHORIZED. BUILD_MODE = FROZEN. PHASE1A complete.
