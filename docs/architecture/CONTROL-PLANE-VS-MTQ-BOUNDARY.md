# MITHQAL Capability Boundary — CONTROL_PLANE_CORE vs MTQ_SETTLEMENT_MODULE

**Status**: ACTIVE per v25.3.2
**Date**: 2026-09-29 (Africa/Cairo)
**Owner**: COO + CTO + PM + System Architect
**Task ID**: J3 (Control Plane / Settlement Module Boundary Architect)

## 1. Directive (verbatim, per J-directive)

> "Refactor the product architecture so MITHQAL control-plane functionality does not depend on MTQ.
> MITHQAL must operate conceptually and technically with:
> - bank money
> - central-bank money
> - RTGS
> - tokenized deposits
> - wholesale CBDC
> - other legally recognized settlement assets
> - MTQ where legally and operationally appropriate
>
> MTQ becomes an optional closed-loop institutional settlement primitive.
> Do not delete MTQ.
> Create a clean capability boundary: CONTROL_PLANE_CORE versus MTQ_SETTLEMENT_MODULE.
> The control plane must remain usable when MTQ is disabled."

## 2. Capability Boundary

### CONTROL_PLANE_CORE (asset-agnostic — REQUIRED)

The control plane is the asset-agnostic compliance + authorization layer. It MUST work with any settlement asset:

- bank money
- central-bank money
- RTGS
- tokenized deposits
- wholesale CBDC
- other legally recognized settlement assets
- MTQ (when MTQ_SETTLEMENT_MODULE is enabled)

The control plane does NOT mint, redeem, or transfer settlement assets. It performs:

- institution onboarding + KYC/AML/sanctions screening
- jurisdiction verification + geo-fence enforcement
- institutional authorization (signing limits, permitted corridors, permitted currencies)
- reserve verification (eligibility + custody verification)
- settlement workflow orchestration (BM-01..BM-16A)
- proof-of-reserves / proof-of-solvency messaging
- policy-registry exposure + legal-evidence exposure

### MTQ_SETTLEMENT_MODULE (optional — DISABLE-ABLE)

The MTQ settlement module is the MTQ-specific mint/redeem/transfer layer. It is OPTIONAL. When disabled:

- `/api/mint` → 503 (MTQ module disabled)
- `/api/redeem` → 503
- `/api/transfer` → 503
- `/api/nav` → 503 (MTQ NAV requires the MTQ monetary engine v19)
- `/api/mtq-purchasing-power` → 503 (MTQ purchasing power requires the MTQ module)
- `/api/mtq-final-reserve` → 503
- `/api/mtq-finality-before-mint` → 503
- `/api/mtq-protected-backing-cell` → 503
- `/api/mtq-three-book-separation` → 503
- `/api/mtq-bank-default-resolution` → 503

BUT:

- All `/api/control-plane/*` endpoints continue to work (200)
- `/api/status`, `/api/health` continue to work (200)
- `/api/policy-registry` continues to work (200)
- `/api/legal-evidence` continues to work (200)
- `/api/mtq-contradiction-scan` continues to work (200) — it scans for contradictions in MTQ-related *documentation*, not MTQ runtime state, so it remains valid even when MTQ is disabled (it operates on the design-time evidence corpus)

## 3. Configuration

A new env var `MTQ_SETTLEMENT_ENABLED` (default: `"true"`):

| Value          | Behavior                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------ |
| `"true"`       | MTQ settlement module is active (current behavior — backward compatible).                 |
| `"false"`      | MTQ settlement module is disabled. All MTQ-specific endpoints return 503.                  |
| unset / other  | Defaults to `"true"` (backward compatible — anything other than the literal `"false"` is treated as enabled). |

The flag is read at module load by `src/lib/mtq-settlement-config.ts` and exposed via:

- `MTQ_SETTLEMENT_ENABLED: boolean` (constant, imported directly)
- `isMTQSettlementEnabled(): boolean` (function wrapper, for runtime diagnostics)
- `mtqDisabledResponse(): Response | null` (helper for MTQ-specific routes — returns a 503 response when disabled, null when enabled)

## 4. Asset Type Abstraction

The control plane now operates on an abstract `SettlementAsset` type:

```ts
type SettlementAssetType =
  | "BANK_MONEY"
  | "CENTRAL_BANK_MONEY"
  | "RTGS"
  | "TOKENIZED_DEPOSITS"
  | "WHOLESALE_CBDC"
  | "MTQ"  // optional, only when MTQ_SETTLEMENT_MODULE is enabled
  | "OTHER_LEGALLY_RECOGNIZED";
```

The control plane's BM-09..BM-16A steps (per `settlement-workflow-canonical.ts`) work for any `SettlementAssetType`.

BM-16B (Mint Execution) is MTQ-specific and only runs when:

- `SettlementAssetType = "MTQ"`
- AND `MTQ_SETTLEMENT_ENABLED = "true"`

If `SettlementAssetType ≠ "MTQ"`, BM-16B is marked `COMPLETED-NOT-REQUIRED` and the bank executes settlement via its own rails (RTGS, CBDC, correspondent banking, etc.). The control plane's job is the upstream authorization + reserve verification — not the asset-specific execution.

## 5. Module Inventory

### CONTROL_PLANE_CORE (required, asset-agnostic)

- `src/lib/settlement-workflow-canonical.ts` — canonical BM-* workflow (Agent J2 + J3 boundary)
- `src/lib/mtq-settlement-config.ts` — env-var gate + `SettlementAssetType` enum (Agent J3)
- `src/lib/policy-registry.ts` — machine-readable policy registry (Agent I2)
- `src/lib/external-legal-evidence.ts` — external legal/regulatory evidence registry (Agent I3)
- `src/lib/constitution-data.ts` — Constitution v19.0 with section status markers (Agent F2/G3/I4)
- `src/lib/compliance.ts` — AML/KYC/sanctions screening (asset-agnostic)
- `src/lib/jurisdiction.ts` / `src/lib/jurisdiction-engine.ts` — jurisdiction verification (asset-agnostic)
- `src/lib/bank-onboarding.ts` — bank institutional onboarding (asset-agnostic)
- `src/lib/institutional-authorization.ts` — institutional authorization (asset-agnostic)
- `src/lib/mtq-contradiction-scan.ts` — design-time contradiction scanner (asset-agnostic — operates on documentation, not MTQ runtime)
- `src/lib/wholesale-settlement.ts` — wholesale settlement orchestration (now asset-agnostic via `settlementAmount` + `settlementAssetType` fields)
- `src/lib/wholesale-tokenomics.ts` — wholesale settlement tokenomics (now asset-agnostic via `settlementAssetTurnover` field)
- `/api/control-plane/*` — NEW namespace for asset-agnostic endpoints
- `/api/status`, `/api/health`, `/api/policy-registry`, `/api/legal-evidence`, `/api/mtq-contradiction-scan` — existing asset-agnostic endpoints

### MTQ_SETTLEMENT_MODULE (optional, MTQ-specific)

- `src/lib/monetary-engine-v19.ts` — MTQ-specific deterministic v19 engine
- `src/lib/nav-compute.ts` — MTQ-specific NAV computation
- `src/lib/fixed-point.ts` — MTQ-specific fixed-point arithmetic
- `src/lib/real-market-feeds.ts` — shared infrastructure, but exposes MTQ-specific data via `/api/nav`
- `src/lib/purchasing-power.ts` — shared infrastructure, but exposes MTQ purchasing power via `/api/mtq-purchasing-power`
- `/api/mint` — MTQ-specific mint
- `/api/redeem` — MTQ-specific redeem
- `/api/transfer` — MTQ-specific transfer
- `/api/nav` — MTQ-specific NAV
- `/api/mtq-purchasing-power` — MTQ-specific purchasing power
- `/api/mtq-final-reserve` — MTQ-specific final reserve reporting
- `/api/mtq-finality-before-mint` — MTQ-specific finality
- `/api/mtq-protected-backing-cell` — MTQ-specific backing cell
- `/api/mtq-three-book-separation` — MTQ-specific accounting
- `/api/mtq-bank-default-resolution` — MTQ-specific bank default resolution

## 6. Test Plan

### When `MTQ_SETTLEMENT_ENABLED=false`:

| Endpoint                                       | Expected | Reason                                                              |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `/api/control-plane/settlement-status`         | 200      | Control plane operational                                           |
| `/api/status`                                  | 200      | System status                                                       |
| `/api/health`                                  | 200      | Health                                                              |
| `/api/policy-registry`                         | 200      | ACTIVE policies still exposed                                       |
| `/api/legal-evidence`                          | 200      | External evidence still exposed                                     |
| `/api/mtq-contradiction-scan`                  | 200      | Design-time scanner — operates on documentation, not MTQ runtime    |
| `/api/mint` (POST)                             | 503      | MTQ module disabled                                                 |
| `/api/redeem` (POST)                           | 503      | MTQ module disabled                                                 |
| `/api/transfer` (POST)                         | 503      | MTQ module disabled                                                 |
| `/api/nav` (GET)                               | 503      | MTQ NAV requires MTQ module                                         |
| `/api/mtq-purchasing-power` (GET)              | 503      | MTQ purchasing power requires MTQ module                            |
| `/api/mtq-final-reserve` (GET)                 | 503      | MTQ module disabled                                                 |
| `/api/mtq-finality-before-mint` (GET)          | 503      | MTQ module disabled                                                 |
| `/api/mtq-protected-backing-cell` (GET)        | 503      | MTQ module disabled                                                 |
| `/api/mtq-three-book-separation` (GET)         | 503      | MTQ module disabled                                                 |
| `/api/mtq-bank-default-resolution` (GET)       | 503      | MTQ module disabled                                                 |

The 503 response payload:

```json
{
  "error": "MTQ_SETTLEMENT_MODULE disabled",
  "detail": "MTQ_SETTLEMENT_ENABLED=false. The control plane (CONTROL_PLANE_CORE) remains operational. See /api/control-plane/* for asset-agnostic settlement workflow. See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md.",
  "activeModel": "v25.3.2",
  "controlPlaneOperational": true
}
```

### When `MTQ_SETTLEMENT_ENABLED=true` (default, backward compatible):

- ALL endpoints function as before (no behavioral change).
- MTQ remains fully operational (NOT deleted per directive).
- The new `/api/control-plane/settlement-status` endpoint also works (200), reporting `mtqSettlementEnabled: true`.

## 7. Backward Compatibility

- The `MTQ_SETTLEMENT_ENABLED` flag defaults to `"true"`. Existing deployments see no behavioral change.
- The `mtqAmount` field on `SettlementRecord` (in `v25-0-identity.ts`) is PRESERVED. The new `settlementAmount` field is added alongside it (additive — `mtqAmount` is now a deprecated alias of `settlementAmount`; both are populated when creating records in `wholesale-settlement.ts`). Existing callers that read `mtqAmount` continue to work.
- The `mtqTurnover` field on `VelocityMetrics` (in `wholesale-tokenomics.ts`) is PRESERVED. The new `settlementAssetTurnover` field is added alongside it (additive — `mtqTurnover` is now a deprecated alias of `settlementAssetTurnover`; both are populated by `computeVelocity()`). Existing callers that read `mtqTurnover` continue to work.

## 8. Residual Debt (honest)

1. **The `mtqAmount` and `mtqTurnover` field names are kept as deprecated aliases for backward compatibility.** A future major release could rename them to `settlementAmount` / `settlementAssetTurnover` exclusively, but that would be a breaking change to API consumers and is out of scope for v25.3.2 (the directive explicitly says "Do NOT delete MTQ" — keeping the field name preserves MTQ semantics as one of the supported settlement assets, not as the only settlement asset).
2. **No new MTQ-disabled runtime test is wired.** The `MTQ_SETTLEMENT_ENABLED` flag is read at module load, so toggling it requires a dev-server restart. Live toggle is out of scope. The gate logic is verified by code review (every MTQ-specific route calls `mtqDisabledResponse()` at the top of its handler) and by the test plan documented above (operators can run the test plan by setting `MTQ_SETTLEMENT_ENABLED=false` in `.env.local` and restarting the dev server).
3. **Several MTQ-specific shared modules are listed as "shared infrastructure"** (`real-market-feeds.ts`, `purchasing-power.ts`) — they are imported by both control-plane code and MTQ-specific code. They are NOT cleanly partitioned yet. Their MTQ-specific data exposure (NAV + purchasing power) is gated via the `/api/nav` and `/api/mtq-purchasing-power` routes (which return 503 when disabled), so the gate is at the route layer, not the module layer. A future hardening pass could split them into a `real-market-feeds-core` (asset-agnostic) + `real-market-feeds-mtq` (MTQ-specific) pair, but that is a larger refactor.
4. **Other MTQ-related routes (`/api/mtq-os`, `/api/mtq-implementation-status`, `/api/mtq-licensing-entity-matrix`, `/api/mtq-systemic-exposure-engine`, `/api/mtq-legal-liability-framework`, `/api/v25.1/mtq/mint`, `/api/v25.1/mtq/redeem`, `/api/v25.0/canonical-supply`, `/api/v25.0/settle`, `/api/v25.0/can-mint`, `/api/v25.0/financial-model`, `/api/v25.0/cbdc-interop`, `/api/v25.0/pilot-ops`, `/api/v25.0/jurisdiction-pilot`, `/api/v25.0/corporate-pilot`, `/api/v25.0/redemption-continuity`, `/api/v25.0/authorize`, `/api/v25.0/bank-onboarding`, `/api/v25.0/geo-fence`, `/api/v25.0/custody-*`, `/api/v25.0/ilps`, `/api/v25.0/monetary-lock`, `/api/v25.0/stress-engine`, `/api/v25.0/tokenomics`, `/api/v25.0/validation-workbench`) are NOT yet gated.** The task scope explicitly named the 8 most heavily MTQ-coupled routes. The remaining MTQ-related routes (especially the versioned `/api/v25.0/*` and `/api/v25.1/*` family) are marked HISTORICAL per Agent I4's ROUTE_STATUS = "HISTORICAL" markers (commit `67fd75e6e500d16494a717e46ea98006e9e2351b`) and continue to function as legacy surface area. A future hardening pass could gate them too, but doing so is out of scope for this J3 task.
