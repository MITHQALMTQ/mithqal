# Agent I2 — Policy Registry Architect (full-stack-developer)

**Task ID**: I2
**Date**: 2026-09-29 (Africa/Cairo)
**Release**: v25.3.2 (controlled remediation — authority normalization, layer 3)
**Commit**: `56663aea7de6161c5ee2a5cf87649e306f2761d6` on `main`

## Scope

Build the machine-readable policy registry (layer 3 of the canonical authority hierarchy) per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §2 + §3. Only ACTIVE values exposed by default; SUPERSEDED/HISTORICAL/PENDING_VALIDATION queryable via `?include=` for operator audit.

## Files Created (2 — zero modifications to existing files)

1. `src/lib/policy-registry.ts` (432 LOC) — machine-readable registry + override-prevention API.
2. `src/app/api/policy-registry/route.ts` (138 LOC) — Next.js App Router GET handler.

## Policies Registered (25)

| Layer | Count | Status | Policies |
|---|---|---|---|
| 1 (v25.3.2 apex) | 3 | ACTIVE | MTQ_ANCHOR=gold, MTQ_ISSUANCE_MODE=verified-deposit, MTQ_RETAIL=false |
| 2 (Constitution) | 19 | ACTIVE | RESERVE_REQUIREMENT_100_PERCENT, NO_DISCRETIONARY_MINTING, NO_LENDING_OF_RESERVES, NO_COMMINGLING, DETERMINISTIC_MONETARY_ENGINE, INSTITUTIONAL_NEUTRALITY, FULL_REDEEMABILITY, GOLD_AS_CONSTITUTIONAL_ANCHOR, RESERVE_RATIO_MINIMUM=1.0, MIN_GOLD_WEIGHT=0.18, MIN_SILVER_WEIGHT=0.05, MAX_STABLECOIN_WEIGHT=0.30, MIN_SOVEREIGN_WEIGHT=0.50, MITHQAL_CUSTODIES_BACKING=false, BANK_CUSTODY_REQUIRED=true, COUNCIL_QUORUM=5, COUNCIL_APPROVAL_THRESHOLD="4-of-7", NO_POLITICAL_ALIGNMENT=true, NO_JURISDICTION_ALIGNMENT=true |
| 3 (policy-registry) | 1 | ACTIVE | FX_LIVE_SOURCE="open.er-api.com + FRED" |
| 5 (historical) | 2 | HISTORICAL | V25_0_BLUEPRINT_VERSION, V25_4_V25_9_IMPLEMENTATION_EVIDENCE |
| **TOTAL** | **25** | **23 ACTIVE + 2 HISTORICAL** | |

## Override-Prevention API

- `getActivePolicies()` — returns ONLY ACTIVE.
- `getActivePolicy(id)` — THROWS if no ACTIVE policy exists (no silent fallback to SUPERSEDED; error cites §3 Rule 3).
- `getPolicyHistory(id)` — full history (audit only).
- `getPolicies({status?, sourceLayer?})` — filtered query.

## Endpoint Behavior (verified live)

- DEFAULT: 23 ACTIVE policies, `_meta.activeModel="v25.3.2"` in every response.
- `?include=all`: 25 policies (23 ACTIVE + 2 HISTORICAL).
- `?include=historical`: 2 (V25_0_BLUEPRINT_VERSION, V25_4_V25_9_IMPLEMENTATION_EVIDENCE).
- `?include=superseded`: 0 standalone entries — by design, SUPERSEDED values live inside ACTIVE policies' `previousValues[]` arrays. Use `?id=POLICY_ID&include=all` to audit them.
- `?include=pending_validation`: 0 in this release.
- `?id=RESERVE_RATIO_MINIMUM`: single ACTIVE policy returned.
- `?id=MTQ_ANCHOR&include=all`: full history with previousValues exposed.
- `?include=invalid`: HTTP 400 with allowed-values list.
- `?sourceLayer=2`: 19 ACTIVE Constitution-layer policies.
- Rate-limited 30 req/min per IP via `enforceRateLimit`.

## Lint

`bun run lint` → EXIT 0. Zero errors, zero warnings.

## Verification curls (all passed)

```
curl -s http://localhost:3000/api/policy-registry                                    # 23 ACTIVE
curl -s "http://localhost:3000/api/policy-registry?include=all"                       # 25 total
curl -s "http://localhost:3000/api/policy-registry?id=RESERVE_RATIO_MINIMUM"          # single
curl -s "http://localhost:3000/api/policy-registry?id=MTQ_ANCHOR&include=all"         # history
curl -s "http://localhost:3000/api/policy-registry?include=historical"               # 2
curl -s "http://localhost:3000/api/policy-registry?include=superseded"               # 0 (by design)
curl -s "http://localhost:3000/api/policy-registry?include=pending_validation"       # 0
curl -s "http://localhost:3000/api/policy-registry?include=invalid"                 # 400
curl -s "http://localhost:3000/api/policy-registry?sourceLayer=2"                    # 19 ACTIVE
```

## Honest Caveats

1. Did NOT touch concurrent agents' in-flight modifications (MITHQAL-V25.3.2-REMEDIATION-LAYER.md, constitution-data.ts, v23-metrics.ts, v24-2-*.ts, external-legal-evidence.ts). Only 2 new files added.
2. `?include=superseded` returns 0 — by design (Policy interface models supersession via `previousValues[]`, not standalone entries).
3. RESERVE_REQUIREMENT_100_PERCENT (boolean invariant) + RESERVE_RATIO_MINIMUM (numeric value 1.0) are intentionally two distinct entries — same for INSTITUTIONAL_NEUTRALITY (umbrella) vs NO_POLITICAL_ALIGNMENT + NO_JURISDICTION_ALIGNMENT (facets).
4. Policy `value` typed as `unknown` per spec template — supports booleans, numbers, strings, arrays.
5. No tests written (per project rules).
6. GitHub Dependabot (1 high) returned on push — pre-existing, NOT introduced by I2.
7. Dev server was alive (curl /api/status → 200) — did NOT restart.

## Worklog

Appended to `/home/z/my-project/worklog.md` under `## Task ID: I2` (section header). Worklog now ~9,650 lines.
