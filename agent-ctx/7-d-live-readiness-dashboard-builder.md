# Task 7-d — Live-Readiness Dashboard Builder

## Task
Create `/home/z/my-project/src/components/live-readiness-dashboard.tsx` — a `'use client'`
component presenting the complete live-readiness picture synthesized from the three Task-7
test suites (crypto-economic 7-a, financial soundness 7-b, adversarial 7-c) plus the
existing stress + E2E suites. Mount it on the public site right after `<E2EScenarios />`.

## Work Records (shared with subsequent agents)

### Files Created
1. `/home/z/my-project/src/components/live-readiness-dashboard.tsx` (~770 lines) — the
   `<LiveReadinessDashboard />` section.

### Files Modified
2. `/home/z/my-project/src/components/public-site.tsx` — added import (line 65) +
   `<LiveReadinessDashboard />` mount point right after `<E2EScenarios />` (line 1875)
   and before `<Governance />`.

### Verification Status
- `bun run lint` → exit 0 ✅ (no eslint errors)
- `dev.log` shows `✓ Compiled in 557ms` with no errors, `GET / 200` responses ✅
- TypeScript strict-typed throughout; no `any` types; all `LucideIcon` references
  use `typeof ShieldCheck` parameterization.

### Component Architecture
- `'use client'` React component using shadcn/ui Card + Badge + Table + Progress +
  19 Lucide icons (`ShieldCheck`, `ShieldAlert`, `TrendingUp`, `AlertTriangle`,
  `CheckCircle2`, `Swords`, `Activity`, `Gauge`, `Scale`, `Landmark`, `Coins`,
  `Zap`, `Target`, `Bug`, `Vote`, `Waves`, `Boxes`, `Sparkles`, `ArrowRight`,
  `Cpu`, `Flame`, `CircleDollarSign`, `Lock`, `AlertOctagon`, `Building2`,
  `TrendingDown`, `XCircle`).
- Standalone `Reveal` (framer-motion) + `Eyebrow` helpers — no dependency on
  other section components.
- Institutional palette tokens only (NO indigo/blue): `--gold`, `--reserve`,
  `--ink-soft`, `--ink-card`, `--line`, `--fg-muted`, `--foreground`.
- Status colors: green (reserve) for verified, amber for monitored/conditional,
  rose for failures, gold for reference/highlight.
- Mobile-first responsive (`grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` etc.).
- `tabular-nums` on every number; `font-mono` on metric values.

### Section Layout (7 sections)
- §1 **HeaderSection** — Eyebrow + h2 headline + subtitle + overall verdict
  badge ("CONDITIONALLY READY FOR LIVE DEPLOYMENT" in amber/gold gradient card
  with ShieldAlert icon) + 5-stat summary strip (165 tests · 154 passed · 11
  findings · 0 critical · 0 high).
- §2 **SuiteSection** — 6-card grid (5 suites + 1 Aggregate). Each card shows
  icon, suite name, verdict badge (READY/CONDITIONAL), pass/total headline,
  progress bar, and bullet-list detail. Aggregate card fills 6th slot with
  93.3% overall pass rate.
- §3 **MetricsSection** — sticky-header Table with 16 financial metrics (NAV,
  Supply, Reserve Ratio, R_m/R_a/R_l, VaR 1d 95%/99%, 10d 99%, CVaR, LCR
  baseline + bank-run, duration, break-even, fee revenue, reverse-stress
  break-point). Status dot per row (green/amber/gold).
- §4 **DefenseSection** — 9-card grid of attack categories with progress bars
  colored by defense rate (green ≥100%, amber 67-99%, rose <67%). Shows
  defended/total + percentage + note. Categories: Oracle 6/6, Front-running
  5/5, Bank run 6/6, Death spiral 5/5, Governance 3/3, Smart contract 5/6,
  Market manipulation 4/4, Systemic crisis 4/6, Edge cases 4/5.
- §5 **FindingsSection** — Table listing the 5 material findings with #,
  finding name, severity badge (all amber "Material"), current value,
  target, and recommendation. Footer banner: "Single recommendation ·
  raise §4 over-collateralization buffer from 2% → 3%".
- §6 **ChecklistSection** — Two-column grid: Verified (15 items, green) and
  Monitored (3 items, amber). Each item has a check/warning icon + label +
  detail. Monitored column ends with a callout: "Pre-mainnet action: raise
  buffer 2% → 3%".
- §7 **RecommendationSection** — Closing COO/CTO statement in a gold-to-reserve
  gradient card. Three pills: "Testnet deployment: READY NOW" (green),
  "Mainnet readiness: 1 FIX AWAY" (amber), "Pre-mainnet action: Buffer
  2% → 3%" (gold). Footer strip with 4 compliance badges (0 Critical, 0
  High, sovereign yield covers ops, Basel III / IFRS-9 / Sharia §49
  compliant).

### Data Provenance
All figures are the EXACT outputs of the three Task-7 test runs (see
`/home/z/my-project/worklog.md` §7-a/7-b/7-c). They are not recomputed
client-side because the engine depends on the live `monetary-engine-v19` +
oracle pipeline (server-side).

### Mount Position
On the Institution view (`public-site.tsx`):
- After `<StressTestProof />` (stability proof — 20/20 scenarios passed)
- After `<E2EScenarios />` (real-world utility proof — 5/5 E2E scenarios)
- **Then `<LiveReadinessDashboard />`** (consolidated Task-7 readiness board)
- Before `<Governance />`

Reader's mental flow: "proof it can't break" → "here's what real users do"
→ "here is the consolidated readiness verdict for live deployment".
