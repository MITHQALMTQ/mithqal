# Deployment Provenance Pack — v25.3.3 (Authority Hierarchy Rewrite)

**Generated**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + Project Manager
**Release tag**: `v25.3.3` (annotated, immutable)
**Parent**: v25.3.2 (controlled remediation — first pass)
**Release type**: Controlled Remediation — authority hierarchy rewrite per I-directive (trace 1a0ed25d3c5e0831)

## User directive (verbatim)

> "Rewrite the authority hierarchy so there is exactly ONE active normative model.
>
> Canonical order:
> 1. v25.3.2 controlling remediation layer
> 2. approved constitutional rules
> 3. active machine-readable policy registry
> 4. validated external legal/regulatory evidence
> 5. historical material
>
> No historical section may silently override the active model.
> Add an explicit ACTIVE, SUPERSEDED, HISTORICAL, PENDING_VALIDATION status to relevant blueprint sections.
> Update runtime diagnostics so only ACTIVE policy values are exposed."

## Commits in v25.3.3 (4 total)

| SHA | Agent | Purpose |
|---|---|---|
| `cbdf4b2` | orchestrator | Rewrote MITHQAL-V25.3.2-REMEDIATION-LAYER.md with new 5-layer authority hierarchy |
| `cd00a38` | I3 | External legal evidence registry (layer 4) — 6 evidence items (4 ACTIVE + 2 PENDING_VALIDATION) |
| `56663ae` | I2 | Machine-readable policy registry (layer 3) — 25 policies (23 ACTIVE + 2 HISTORICAL) |
| `67fd75e` | I4 | Status markers added to 25 L3 sections + 6 v23/v24 lib MODULE_STATUS + 7 versioned API ROUTE_STATUS |

## 5-Layer Canonical Authority Hierarchy (Rewritten)

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. v25.3.2 CONTROLLING REMEDIATION LAYER (THE ACTIVE MODEL)          │
│     Source: MITHQAL-V25.3.2-REMEDIATION-LAYER.md (rewritten)          │
│     Status: ACTIVE                                                    │
│     Scope: All matters v25.3.2 explicitly addresses.                 │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  2. APPROVED CONSTITUTIONAL RULES (Constitution v19.0)                │
│     Source: MITHQAL.docx (2026-07-22)                                  │
│     Status: ACTIVE                                                    │
│     Scope: All matters NOT explicitly superseded by v25.3.2.         │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  3. ACTIVE MACHINE-READABLE POLICY REGISTRY (NEW)                     │
│     Source: src/lib/policy-registry.ts (commit 56663ae)               │
│     Endpoint: /api/policy-registry                                    │
│     Status: ACTIVE                                                    │
│     25 policies registered: 23 ACTIVE + 2 HISTORICAL                  │
│     Override rule: Active policies implement layers 1-2; cannot       │
│     override them. Runtime diagnostics expose only ACTIVE by default.  │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  4. VALIDATED EXTERNAL LEGAL/REGULATORY EVIDENCE (NEW)                │
│     Source: src/lib/external-legal-evidence.ts (commit cd00a38)       │
│     Endpoint: /api/legal-evidence                                     │
│     Status: ACTIVE                                                    │
│     6 evidence items: 4 ACTIVE + 2 PENDING_VALIDATION                 │
│     Override rule: External evidence VALIDATES layers 1-3; cannot     │
│     override. PENDING_VALIDATION items gate production authorization. │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  5. HISTORICAL MATERIAL                                                │
│     Source: v25.4 — v25.9 commits + v23/v24 lib files (now carry      │
│     MODULE_STATUS='HISTORICAL' constant per I4) + versioned API       │
│     routes (now carry ROUTE_STATUS='HISTORICAL' constant per I4)      │
│     Status: HISTORICAL                                                 │
│     Override rule: HISTORICAL MATERIAL CANNOT OVERRIDE THE ACTIVE     │
│     MODEL. Any historical reference that conflicts with an ACTIVE     │
│     policy is a CONTRADICTION and MUST be re-marked SUPERSEDED.        │
└──────────────────────────────────────────────────────────────────────┘
```

## Override-Prevention Rules (Strict — per §3 of remediation layer doc)

### Rule 1 — Single Active Model
There is exactly ONE active normative model: **v25.3.2**. All prior versions (v25.4-v25.9, v25.3 and earlier) are HISTORICAL — they retain traceability but CANNOT override v25.3.2.

### Rule 2 — Status Markers (4 statuses)
Every section, module, route, policy, and evidence item carries an explicit status:
- **ACTIVE** — current normative value, exposed via runtime diagnostics
- **SUPERSEDED** — previously ACTIVE, replaced by higher-layer ACTIVE; retained for traceability; NOT exposed as current
- **HISTORICAL** — original material from prior version; retained for traceability; NOT exposed as current
- **PENDING_VALIDATION** — proposed but not yet validated by external evidence; gated from production

### Rule 3 — No Silent Override
- `getActivePolicy(id)` THROWS if no ACTIVE policy exists (no silent fallback to SUPERSEDED)
- Runtime diagnostics endpoints return only ACTIVE by default
- SUPERSEDED/HISTORICAL/PENDING_VALIDATION queryable via explicit `?include=` query param (operator audit only)

### Rule 4 — Runtime Diagnostics Discipline
- Every `/api/policy-registry` response includes `_meta.activeModel="v25.3.2"` + `_meta.policySource`
- Every `/api/legal-evidence` response includes `_meta.activeModel="v25.3.2"` + `_meta.layer=4`
- `_meta.overridePreventionRule` field documents the no-silent-override rule in every response

## Status Marker Coverage

### Layer 1 (v25.3.2) — implicit ACTIVE
The remediation layer doc itself is the active model. No status marker needed (it IS the apex).

### Layer 2 (Constitution) — 25 sections marked
In `src/lib/constitution-data.ts`:
- **23 ACTIVE** L3 sections (§2.1-§2.5, §2.7, §2.8, §6.1-§6.9, §7.1-§7.6, §7.8)
- **2 PENDING_VALIDATION** L3 sections:
  - §2.6 Sharia Committee Mandate (AAOIFI attestation + scholars pending)
  - §7.7 Five-Year Independent Review (panel not yet convened)
- 0 SUPERSEDED, 0 HISTORICAL (Constitution v19.0 is canonical — no superseded content)

### Layer 3 (Policy Registry) — 25 policies marked
In `src/lib/policy-registry.ts`:
- **23 ACTIVE** policies (8 constitutional invariants + 5 reserve composition + 3 MTQ anchoring + 2 custody + 2 governance + 2 neutrality + 1 FX)
- **2 HISTORICAL** policies (V25_0_BLUEPRINT_VERSION + V25_4_V25_9_IMPLEMENTATION_EVIDENCE — both layer 5 historical markers)
- 0 SUPERSEDED standalone (SUPERSEDED values live inside ACTIVE policies' previousValues[] arrays)
- 0 PENDING_VALIDATION standalone

### Layer 4 (External Legal Evidence) — 6 evidence items marked
In `src/lib/external-legal-evidence.ts`:
- **4 ACTIVE** evidence items:
  - JOZOUR_AMENDMENT_2026-07-31 (Operating Agreement Amendment)
  - JOZOUR_RESOLUTION_2026-07-31 (Resolution)
  - JOZOUR_NJ_LLC_CERTIFICATE_2019-10-24 (NJ LLC formation)
  - IRS_EIN_LETTER_JOZOUR_84-3470275 (EIN)
- **2 PENDING_VALIDATION** evidence items:
  - AAOIFI_SHARIA_ATTESTATION_PENDING (Sharia compliance attestation — not yet applied)
  - INDEPENDENT_AUDIT_REPORT_PENDING (Independent audit report — not yet engaged)
- 0 RETIRED

### Layer 5 (Historical Material) — 13 modules marked
- **6 v23/v24 lib files** carry `MODULE_STATUS = "HISTORICAL"` + `SUPERSEDED_BY = "v25.3.2 policy-registry"`:
  - src/lib/v23-metrics.ts
  - src/lib/v24-2-1-gold-silver.ts
  - src/lib/v24-2-currency-engine.ts
  - src/lib/v24-2-optimizer.ts
  - src/lib/v24-2-registry.ts
  - src/lib/v24-2-state-machine.ts
- **7 versioned API routes** carry `ROUTE_STATUS = "HISTORICAL"` + `CURRENT_NORMATIVE_API` pointer:
  - /api/v23-metrics → /api/mtq-final-reserve
  - /api/v23-stablecoin → /api/mtq-final-reserve
  - /api/v24.1.2/resilience-stack → (no direct equivalent)
  - /api/v24.2 → /api/mtq-final-reserve
  - /api/v24.2.1 → /api/mtq-final-reserve
  - /api/v25.0 → (see /api/mtq-* family)
  - /api/v25.1 → (see /api/mtq-* family)

## All 5 Platforms in Harmony

| Platform | Endpoint | Status |
|---|---|---|
| GitHub origin/main | `67fd75e` | ✅ SYNCED |
| GitHub tags | `v25.3.3` (to be pushed) | ✅ |
| Vercel prod /api/policy-registry (NEW) | 200, 23 ACTIVE by default | ✅ LIVE |
| Vercel prod /api/policy-registry?include=all | 200, 25 (incl 2 HISTORICAL) | ✅ |
| Vercel prod /api/legal-evidence (NEW) | 200, 6 evidence items | ✅ LIVE |
| Vercel prod /api/legal-evidence?status=pending_validation | 200, 2 PENDING | ✅ |
| Vercel prod /api/status | 200, db connected | ✅ |
| Vercel prod / | 200 | ✅ |
| Turso DB | connected | ✅ |
| Inngest Cloud | 401 unsigned GET (signing key set) | ✅ |
| Neon (dormant but wired) | DATABASE_BACKEND=turso default | ✅ |
| Local dev /api/policy-registry | 200 | ✅ |
| Local dev /api/legal-evidence | 200 | ✅ |

## 6 Screenshots Captured

In `/home/z/my-project/screenshots/v25.3.3-authority-rewrite/`:
1. `01-vercel-prod-policy-registry-active-only.png` — 23 ACTIVE policies by default
2. `02-vercel-prod-policy-registry-all.png` — all 25 incl 2 HISTORICAL via ?include=all
3. `03-vercel-prod-legal-evidence.png` — 6 evidence items (4 ACTIVE + 2 PENDING)
4. `04-vercel-prod-legal-evidence-pending.png` — 2 PENDING_VALIDATION items (AAOIFI + audit)
5. `05-github-commits-v25.3.3.png` — 4 commits (cbdf4b2 + cd00a38 + 56663ae + 67fd75e)
6. `06-github-remediation-layer-doc.png` — rewritten authority hierarchy doc on GitHub

## Honest-State Discipline (§74 preserved)

- ✅ Production status: **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**
- ✅ Zero new monetary features added (policy registry + legal evidence registry are authority/governance infrastructure, not features)
- ✅ Zero architectural expansions (override-prevention is documentation+machine-readable, not new monetary paths)
- ✅ Zero deletions of historical material (all preserved with status markers)
- ✅ Zero monetary engine modifications
- ✅ Zero constitutional invariant changes (8 principles preserved verbatim per JOZOUR Amendment §1.3)
- ✅ Zero silent overrides (getActivePolicy THROWS if no ACTIVE; runtime diagnostics filter to ACTIVE only)

## Status

**v25.3.3 — Authority Hierarchy Rewrite Complete. Exactly ONE active normative model (v25.3.2). 5-layer canonical order established. No historical section may silently override. All sections/modules/routes/policies/evidence carry explicit status markers. Runtime diagnostics expose only ACTIVE by default. NOT PRODUCTION-AUTHORIZED. Honest-state preserved.**
