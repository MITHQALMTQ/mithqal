# Task ID: GAP2-INSTITUTIONAL-CLOSURE-DASHBOARD
## Agent: Institutional Closure Dashboard Builder
## Date: 2025

## Objective
Build a single unified UI dashboard component covering all 15 v25.0
institutional closure modules that previously lacked UI representation.
The dashboard fetches from multiple API endpoints and renders them in a
single multi-tab component.

## Previous Agent Work Reviewed
Read `/agent-ctx/GAP1-GATEWAY-V1-ENDPOINTS-gateway-v1-endpoints-builder.md`
to understand the gateway endpoint pattern (SIMULATED status, X-Endpoint-Status
header). The institutional closure dashboard follows the same honest-state
discipline: every tab surfaces a PILOT-READY (AMBER) / PRODUCTION-BLOCKED
declaration regardless of upstream payload.

Also reviewed the two pattern dashboards:
- `src/components/mbg-dashboard.tsx` — institutional palette tokens,
  typed report interface, fetch-on-mount via useEffect.
- `src/components/final-integrated-architecture-dashboard.tsx` —
  status badge helper, emerald/amber/red color discipline, collapsible
  JSON-ready report structure.

## Deliverable
Created ONE component file:

**`/home/z/my-project/src/components/institutional-closure-dashboard.tsx`**

## Implementation Summary

### Structure
- `"use client"` directive
- 15-tab registry (`TABS`) covering the 8-prompt institutional closure
  series + 9 supporting modules:
  1. 1/8 Monetary Lock         → `/api/v25.0/monetary-lock`
  2. 2/8 Custody               → `/api/v25.0/custody-execution`
  3. 3/8 Commercial Model       → `/api/v25.0/financial-model`
  4. 4/8 Bank Onboarding       → `/api/v25.0/bank-onboarding`
  5. 5/8 External Validation    → `/api/v25.0/validation-workbench`
  6. 6/8 Jurisdiction Pilot    → `/api/v25.0/jurisdiction-pilot`
  7. ILPS Liquidity            → `/api/v25.0/ilps`
  8. Redemption Continuity     → `/api/v25.0/redemption-continuity`
  9. Stress Engine             → `/api/v25.0/stress-engine`
  10. Tokenomics               → `/api/v25.0/tokenomics`
  11. Canonical Supply         → `/api/v25.0/canonical-supply`
  12. Corporate Pilot          → `/api/v25.0/corporate-pilot`
  13. Custody Hardening        → `/api/v25.0/custody-hardening`
  14. Custody Concentration    → `/api/v25.0/custody-concentration`
  15. Pilot Operations         → `/api/v25.0/pilot-ops`

### Component behavior
1. Horizontal scrollable tab bar with 15 buttons (icons + status pips).
2. Lazy fetch on tab activation; results cached so re-selection doesn't refetch.
3. Loading spinner card while fetching.
4. Honest "Endpoint Unavailable" error card on failure (with retry button)
   — clearly distinguishes HTTP 404 (endpoint not deployed yet) from
   other errors. No silent fallbacks.
5. Success state renders:
   - Module name + version (extracted from common keys).
   - Module status badge with tone detection (amber/red/emerald/gray).
   - Key Metrics grid (top-level scalar fields).
   - Response Structure summary (array/object counts).
   - Honest State Declaration banner (always shows PILOT-READY (AMBER) +
     PRODUCTION-BLOCKED; additionally surfaces honest/productionAuthorized/
     forcedToPass fields if present).
   - Collapsible JSON viewer (`<pre>` with line count + byte size).

### Color palette (NO indigo/blue)
- amber = PILOT-READY / conditional / integration-ready
- emerald = passed / verified / honest=TRUE
- red = blocked / fail / production-blocked / forcedToPass=TRUE
- gray = muted / neutral

### Mount
Mounted in `src/components/public-site.tsx`:
- Import at line 76.
- Rendered at line 1960, immediately after `<FinalPilotGateDashboard />`.

## Code Quality
- TypeScript strict — generic `unknown` data shape with type-guarded
  extractors (`isObject`, `pickKey`, `extractScalars`, `extractCounts`,
  `extractHonestState`).
- shadcn/ui components: Card, Badge, Progress, Table, Collapsible.
- lucide-react icons (Lock, Shield, Building2, TrendingUp, FileCheck,
  Globe, Cpu, Activity, AlertTriangle, CheckCircle2, RefreshCw, Layers,
  Coins, ArrowRight, Scale, Boxes, ChevronDown, Loader2, XCircle,
  Server, Database, Hash).
- framer-motion: section header reveal + active-tab content transition +
  animated active-tab underline (`layoutId`).
- Custom scrollbar styling on the tab bar (thin, amber-tinted).

## Lint Result
```
$ bun run lint
$ eslint .
(0 errors, 0 warnings)
```

## Metrics
- Component file: 991 lines (exceeds ~500 target — more thorough generic
  rendering for unknown API shapes).
- Tabs: 15 (8-prompt series + 9 supporting modules).
- API integrations: 15 (one per tab).
- 0 lint errors, 0 warnings.
- Mounted in public-site.tsx after FinalPilotGateDashboard.

## Next-Agent Notes
- The 15 v25.0 API endpoints (`/api/v25.0/*`) are referenced by the
  dashboard but not all are deployed yet. The dashboard degrades
  gracefully — each missing endpoint shows an honest "Endpoint
  Unavailable" card with the endpoint path and a retry button. No UI
  changes will be required when the endpoints come online.
- Honest-state discipline preserved: productionAuthorized=false and
  pilotReady=AMBER are declared unconditionally in the HonestStateBanner,
  independent of upstream payload. This prevents any future endpoint
  from accidentally displaying a false PRODUCTION-AUTHORIZED claim.
