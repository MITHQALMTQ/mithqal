// src/lib/mtq-settlement-config.ts
//
// MITHQAL v25.3.2 — MTQ Settlement Module Configuration
// =====================================================================
// Per J-directive: "The control plane must remain usable when MTQ is
// disabled." This module exposes the MTQ_SETTLEMENT_ENABLED flag.
//
// When MTQ_SETTLEMENT_ENABLED = "false":
//   - All MTQ-specific endpoints (/api/mint, /api/redeem, /api/transfer,
//     /api/nav, /api/mtq-purchasing-power, /api/mtq-final-reserve,
//     /api/mtq-finality-before-mint, /api/mtq-protected-backing-cell,
//     /api/mtq-three-book-separation, /api/mtq-bank-default-resolution)
//     return 503.
//   - The control plane (/api/control-plane/*, /api/status, /api/health,
//     /api/policy-registry, /api/legal-evidence, /api/mtq-contradiction-scan)
//     continues to work.
//
// When MTQ_SETTLEMENT_ENABLED = "true" (default, backward compatible):
//   - ALL endpoints function as before (no behavioral change).
//   - MTQ remains fully operational (NOT deleted per directive).
//
// Default: anything other than the literal string "false" = enabled.
// This makes the flag opt-out (backward compatible — existing deployments
// that don't set the env var continue to see MTQ operational).
//
// See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md for the full
// capability boundary spec.

/**
 * Master flag: is the MTQ settlement module enabled?
 *
 * Reads `process.env.MTQ_SETTLEMENT_ENABLED` at module load. The flag
 * is treated as ENABLED unless the env var is set to the literal string
 * "false" (case-sensitive). This means:
 *   - unset / undefined  → enabled
 *   - "true"             → enabled
 *   - "false"            → DISABLED
 *   - any other value    → enabled (defensive — avoids accidentally
 *                          disabling MTQ due to a typo)
 */
export const MTQ_SETTLEMENT_ENABLED: boolean =
  process.env.MTQ_SETTLEMENT_ENABLED !== "false";

/**
 * Runtime helper: returns true iff the MTQ settlement module is enabled.
 * Use this in non-route modules that need a function-style accessor
 * (e.g., shared lib code that conditionally calls into MTQ modules).
 */
export function isMTQSettlementEnabled(): boolean {
  return MTQ_SETTLEMENT_ENABLED;
}

/**
 * Helper for MTQ-specific routes — returns a 503 Response if MTQ is
 * disabled, or null if MTQ is enabled (caller should proceed).
 *
 * Usage at the top of an MTQ-specific route handler:
 *
 *   export async function GET(request: Request) {
 *     const mtqDisabled = mtqDisabledResponse();
 *     if (mtqDisabled) return mtqDisabled;
 *     // ... existing handler code
 *   }
 *
 * The 503 response payload includes:
 *   - error: "MTQ_SETTLEMENT_MODULE disabled"
 *   - detail: human-readable explanation + pointer to the control-plane
 *     namespace and the boundary doc
 *   - activeModel: "v25.3.2"
 *   - controlPlaneOperational: true (signals to callers that the control
 *     plane is still operational; only MTQ-specific functionality is
 *     disabled)
 */
export function mtqDisabledResponse(): Response | null {
  if (!MTQ_SETTLEMENT_ENABLED) {
    return new Response(
      JSON.stringify({
        error: "MTQ_SETTLEMENT_MODULE disabled",
        detail:
          "MTQ_SETTLEMENT_ENABLED=false. The control plane (CONTROL_PLANE_CORE) remains operational. See /api/control-plane/* for asset-agnostic settlement workflow. See docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md.",
        activeModel: "v25.3.2",
        controlPlaneOperational: true,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  return null;
}

/**
 * Settlement asset type enumeration (CONTROL_PLANE_CORE is asset-agnostic).
 *
 * The control plane operates on this abstract type. MTQ is one of 7
 * supported settlement assets. When MTQ_SETTLEMENT_ENABLED = false, MTQ
 * is removed from SUPPORTED_SETTLEMENT_ASSETS (so callers can no longer
 * request MTQ as a settlement asset type via the control plane).
 */
export type SettlementAssetType =
  | "BANK_MONEY"
  | "CENTRAL_BANK_MONEY"
  | "RTGS"
  | "TOKENIZED_DEPOSITS"
  | "WHOLESALE_CBDC"
  | "MTQ" // only valid when MTQ_SETTLEMENT_ENABLED = true
  | "OTHER_LEGALLY_RECOGNIZED";

/**
 * The list of supported settlement assets, dynamically computed based
 * on whether the MTQ settlement module is enabled.
 *
 * When MTQ is enabled: 7 asset types (includes MTQ).
 * When MTQ is disabled: 6 asset types (excludes MTQ).
 */
export const SUPPORTED_SETTLEMENT_ASSETS: SettlementAssetType[] =
  MTQ_SETTLEMENT_ENABLED
    ? [
        "BANK_MONEY",
        "CENTRAL_BANK_MONEY",
        "RTGS",
        "TOKENIZED_DEPOSITS",
        "WHOLESALE_CBDC",
        "MTQ",
        "OTHER_LEGALLY_RECOGNIZED",
      ]
    : [
        "BANK_MONEY",
        "CENTRAL_BANK_MONEY",
        "RTGS",
        "TOKENIZED_DEPOSITS",
        "WHOLESALE_CBDC",
        "OTHER_LEGALLY_RECOGNIZED",
      ];

/**
 * Default settlement asset type used by legacy callers that don't specify
 * one explicitly. Set to "MTQ" when the MTQ module is enabled (backward
 * compat with all pre-v25.3.2 callers), or "BANK_MONEY" when MTQ is
 * disabled (a safe default that doesn't require the disabled module).
 */
export const DEFAULT_SETTLEMENT_ASSET: SettlementAssetType =
  MTQ_SETTLEMENT_ENABLED ? "MTQ" : "BANK_MONEY";

/**
 * Validate that a settlement asset type is supported given the current
 * MTQ_SETTLEMENT_ENABLED state. Returns true if the asset type is in
 * SUPPORTED_SETTLEMENT_ASSETS; false otherwise.
 *
 * Specifically, when MTQ is disabled, "MTQ" returns false.
 */
export function isSupportedSettlementAsset(
  asset: SettlementAssetType
): boolean {
  return SUPPORTED_SETTLEMENT_ASSETS.includes(asset);
}
