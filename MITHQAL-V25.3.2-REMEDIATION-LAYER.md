# MITHQAL v25.3.2 — REMEDIATION LAYER (Canonical Authority Hierarchy — Revised)

**Status**: APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED
**Release type**: Controlled Remediation (NOT a feature release)
**Date**: 2026-09-29 (Africa/Cairo) — revised per I-directive (trace 1a0ed25d3c5e0831)
**Owner**: COO + Project Manager

## 1. Purpose

Per the COO + Project Manager directive (2026-09-29, v2):

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

This is a **controlled remediation layer**, NOT a feature release. It does NOT:
- Add new monetary features
- Expand the monetary architecture
- Modify the deterministic v19 monetary engine
- Change constitutional invariants (the 8 principles remain verbatim per JOZOUR Amendment §1.3)
- Delete any historical material

It DOES:
- Establish a single active normative authority (v25.3.2)
- Build a machine-readable policy registry exposing only ACTIVE policies
- Register external legal evidence (JOZOUR Amendment, JOZOUR Resolution, NJ LLC, EIN)
- Add explicit ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION status to every blueprint + constitution section
- Update runtime diagnostics to expose only ACTIVE policy values (SUPERSEDED/HISTORICAL/PENDING_VALIDATION values are queryable for traceability but NOT exposed as "current")

## 2. Canonical Authority Hierarchy (Rewritten per I-directive)

There is exactly ONE active normative model: **v25.3.2**. The hierarchy below is the **canonical order of precedence** — every Mithqal decision, code path, and policy lookup MUST consult these layers in order, and the FIRST layer that has an ACTIVE policy on the matter controls. Lower layers CANNOT override higher layers.

```
┌──────────────────────────────────────────────────────────────────────┐
│  1. v25.3.2 CONTROLLING REMEDIATION LAYER (THE ACTIVE MODEL)          │
│     Source: MITHQAL-V25.3.2-REMEDIATION-LAYER.md (this document)      │
│     Status: ACTIVE                                                    │
│     Scope: All matters v25.3.2 explicitly addresses.                 │
│     Override rule: v25.3.2 controls over v25.3 (parent) and ALL      │
│     lower layers where v25.3.2 explicitly supersedes.                │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  2. APPROVED CONSTITUTIONAL RULES (Constitution v19.0)                │
│     Source: MITHQAL.docx (Constitutional Monetary Infrastructure     │
│     Specification, 2026-07-22)                                        │
│     Status: ACTIVE                                                    │
│     Scope: All matters NOT explicitly superseded by v25.3.2.         │
│     Override rule: Constitution v19.0 controls over the policy       │
│     registry where a constitutional rule exists on the matter.       │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  3. ACTIVE MACHINE-READABLE POLICY REGISTRY                           │
│     Source: src/lib/policy-registry.ts                                │
│     Status: ACTIVE                                                    │
│     Scope: Machine-queryable policy values (e.g.,                    │
│     RESERVE_RATIO_MINIMUM, MAX_INSTITUTIONAL_CONCENTRATION, etc.).   │
│     Each policy has status ACTIVE | SUPERSEDED | HISTORICAL |        │
│     PENDING_VALIDATION. Only ACTIVE values are exposed via            │
│     runtime diagnostics. SUPERSEDED/HISTORICAL/PENDING_VALIDATION    │
│     values are retained for traceability but NOT exposed as "current".│
│     Override rule: Active policies cannot override layer 1 or 2;     │
│     they implement the operational values those layers authorize.    │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  4. VALIDATED EXTERNAL LEGAL/REGULATORY EVIDENCE                       │
│     Source: src/lib/external-legal-evidence.ts                        │
│     Status: ACTIVE                                                    │
│     Scope: JOZOUR LLC Operating Agreement Amendment (July 31, 2026), │
│     JOZOUR Resolution (July 31, 2026), NJ LLC Certificate of         │
│     Formation (Oct 24, 2019, EIN 84-3470275),                        │
│     AAOIFI Sharia-compliance attestations (pending),                  │
│     Independent auditor reports (pending).                            │
│     Each evidence has status ACTIVE | PENDING_VALIDATION | RETIRED.   │
│     Override rule: External evidence cannot override layers 1-3;      │
│     it VALIDATES them. An ACTIVE v25.3.2 rule with no ACTIVE          │
│     external evidence is marked PENDING_VALIDATION in the registry.   │
└──────────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────────┐
│  5. HISTORICAL MATERIAL                                                │
│     Source: v25.4 — v25.9 commits, v23/v24 lib modules (marked        │
│     HISTORICAL/SUPERSEDED per R4 of v25.3.2), versioned API routes  │
│     (v23-metrics, v23-stablecoin, v24.1.2, v24.2, v24.2.1, v25.0,    │
│     v25.1 — marked VERSIONED API ROUTE per R5 of v25.3.2).           │
│     Status: HISTORICAL                                                 │
│     Scope: Traceability only.                                          │
│     Override rule: HISTORICAL MATERIAL CANNOT OVERRIDE THE ACTIVE     │
│     MODEL. No historical section may silently override layers 1-4.    │
│     Any historical reference in source code that conflicts with an    │
│     ACTIVE policy is a CONTRADICTION and MUST be resolved by          │
│     re-marking the historical reference with status SUPERSEDED + a    │
│     pointer to the ACTIVE replacement.                                │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Override-Prevention Rules (Strict)

### Rule 1 — Single Active Model
There is exactly ONE active normative model at any time. As of 2026-09-29, that is **v25.3.2**. All prior versions (v25.4 through v25.9, plus v25.3 and earlier) are HISTORICAL — they retain traceability but CANNOT override v25.3.2.

### Rule 2 — Status Markers
Every section in:
- the Constitution (Constitution v19.0 L1/L2/L3/L4 articles)
- the v25.3 Master Blueprint sections
- the policy registry
- the external legal evidence registry

MUST carry an explicit status marker:
- **ACTIVE** — current normative value, exposed via runtime diagnostics
- **SUPERSEDED** — previously ACTIVE, replaced by a higher-layer ACTIVE policy; retained for traceability; NOT exposed as current
- **HISTORICAL** — original material from a prior version; retained for traceability; NOT exposed as current
- **PENDING_VALIDATION** — proposed but not yet validated by external legal/regulatory evidence; NOT exposed as current; gated from production

### Rule 3 — No Silent Override
No historical section may silently override the active model. Implementation:
- Every code path that reads a policy value MUST query the policy registry's `getActivePolicy(id)` function — never reads a SUPERSEDED/HISTORICAL value directly
- Every runtime diagnostic endpoint (e.g., `/api/policy-registry`) MUST filter to ACTIVE values only by default
- SUPERSEDED/HISTORICAL values are queryable via explicit `?include=superseded|historical|pending_validation` query param (for operator audit, not runtime use)

### Rule 4 — Runtime Diagnostics Discipline
Runtime diagnostics (any `/api/*` endpoint that returns a policy value) MUST:
- Return only ACTIVE policy values in the default response
- Include a `_meta.activeModel: "v25.3.2"` field in every response
- Include a `_meta.policySource: "policy-registry"` field
- Mark any value that came from a SUPERSEDED policy with `status: "SUPERSEDED — do not use"` if it must appear for backward compatibility
- Refuse to expose PENDING_VALIDATION values unless the operator passes `?include=pending_validation` (audit mode only)

## 4. Constitutional Invariants (unchanged — preserved per JOZOUR Amendment §1.3)

The 8 constitutional invariants remain the bedrock. They are now marked ACTIVE in the policy registry:

1. **100%+ Reserve Requirement** — Reserve Value ≥ Supply Value at all times — **ACTIVE**
2. **No Discretionary Minting** — Minting only upon verified deposit of equivalent value — **ACTIVE**
3. **No Lending of Reserves** — No leverage, no fractional reserve, no rehypothecation — **ACTIVE**
4. **No Commingling** — Yield assets never mix with settlement reserves — **ACTIVE**
5. **Deterministic Monetary Engine** — Identical inputs produce identical outputs — **ACTIVE**
6. **Institutional Neutrality** — No political, economic, or jurisdictional alignment — **ACTIVE**
7. **Full Redeemability** — Every unit is redeemable on demand — **ACTIVE**
8. **Gold as Constitutional Anchor** — Gold remains the permanent constitutional monetary anchor — **ACTIVE**

## 5. NOT PRODUCTION-AUTHORIZED (preserved)

This release maintains the NOT PRODUCTION-AUTHORIZED status per the v25.3 master blueprint. The institutional validation gates (per §74 honest-state) are NOT yet passed. The release prepares MITHQAL for institutionalization but does NOT authorize production deployment.

## 6. Honest-State Discipline (§74 preserved)

- ✅ Production status: **APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED**
- ✅ This is a controlled remediation layer, not a feature release
- ✅ Zero new monetary features added
- ✅ Zero architectural expansions
- ✅ Zero deletions of historical material
- ✅ Zero monetary engine modifications
- ✅ Zero constitutional invariant changes
- ✅ All 8 constitutional principles preserved verbatim (per JOZOUR Amendment §1.3)

## 7. Implementation Artifacts

This remediation layer introduces the following machine-readable artifacts (NEW — but they implement authority normalization, not new features):

| Artifact | Path | Purpose |
|---|---|---|
| Policy Registry | `src/lib/policy-registry.ts` | Machine-readable registry of all Mithqal policies with ACTIVE/SUPERSEDED/HISTORICAL/PENDING_VALIDATION status |
| External Legal Evidence | `src/lib/external-legal-evidence.ts` | Registry of validated external legal/regulatory evidence (JOZOUR docs, NJ LLC, EIN, AAOIFI pending) |
| Policy Registry Endpoint | `src/app/api/policy-registry/route.ts` | Public API exposing only ACTIVE policy values (with operator-audit `?include=` query param) |
| Section Status Markers | `src/lib/constitution-data.ts` (extended) | Every L3/L4 section now carries `status: ACTIVE\|SUPERSEDED\|HISTORICAL\|PENDING_VALIDATION` |
| Runtime Diagnostic Update | All `/api/*` endpoints that return policy values | Each now includes `_meta.activeModel` + `_meta.policySource` fields |

## 8. Verification

After remediation:
- Re-run contradiction scanner → must still show ZERO true contradictions
- Lint must show ZERO new errors
- All 15 routes must still return 200 (no behavioral changes)
- `/api/policy-registry` returns only ACTIVE policies by default
- All `/api/*` endpoints include `_meta.activeModel: "v25.3.2"` field
- All 5 platforms remain in harmony (GitHub + Vercel + Inngest + Turso + Neon)
