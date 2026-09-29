// GET /api/control-plane/settlement-status
// =====================================================================
// Returns the control-plane settlement workflow status — asset-agnostic.
//
// Per J-directive: "The control plane must remain usable when MTQ is
// disabled." This endpoint is the canonical entry point for the
// CONTROL_PLANE_CORE capability boundary:
//
//   - Always returns 200 (whether or not the MTQ settlement module is
//     enabled) — the control plane is ALWAYS operational.
//   - Reports the canonical BM-* settlement workflow split into:
//       * controlPlaneWorkflow: BM-01..BM-16A (asset-agnostic — always
//         ACTIVE)
//       * mtqSettlementWorkflow: BM-16B (MTQ-specific — ACTIVE when
//         MTQ_SETTLEMENT_ENABLED = true, COMPLETED-NOT-REQUIRED otherwise)
//   - Reports the supported settlement asset types (7 when MTQ enabled,
//     6 when MTQ disabled — MTQ is removed from the list when the
//     MTQ settlement module is disabled).
//   - Reports the master MTQ_SETTLEMENT_ENABLED flag.
//
// This endpoint does NOT mint, redeem, or transfer MTQ. It does NOT
// call into the MTQ monetary engine v19, NAV compute, or purchasing
// power compute. It is purely an asset-agnostic introspection endpoint.
//
// Rate-limited to 30 requests per minute per IP (asset-agnostic
// introspection — generous for institutional use, prevents abuse).

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  CANONICAL_SETTLEMENT_WORKFLOW,
  getControlPlaneWorkflow,
  getMTQSettlementWorkflow,
  type CanonicalBMStep,
} from "@/lib/settlement-workflow-canonical";
import {
  isMTQSettlementEnabled,
  SUPPORTED_SETTLEMENT_ASSETS,
  DEFAULT_SETTLEMENT_ASSET,
  MTQ_SETTLEMENT_ENABLED,
  type SettlementAssetType,
} from "@/lib/mtq-settlement-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  // Rate limit: 30 req/min per IP — generous for institutional use.
  const rateLimited = enforceRateLimit(
    "control-plane-settlement-status",
    request,
    30,
    60_000
  );
  if (rateLimited) return rateLimited;

  const mtqEnabled = isMTQSettlementEnabled();
  const controlPlaneWorkflow = getControlPlaneWorkflow(); // BM-01..BM-16A
  const mtqSettlementWorkflow = getMTQSettlementWorkflow(); // BM-16B

  // Build a compact step summary for both halves.
  const summarizeStep = (s: CanonicalBMStep) => ({
    id: s.id,
    name: s.name,
    phase: s.phase,
    capability: s.capability,
    status: s.status,
    ...(s.optional ? { optional: true } : {}),
    ...(s.description ? { description: s.description } : {}),
  });

  return NextResponse.json(
    {
      _meta: {
        activeModel: "v25.3.2",
        capability: "CONTROL_PLANE_CORE",
        endpoint: "/api/control-plane/settlement-status",
        mtqSettlementEnabled: mtqEnabled,
        mtqSettlementEnabledEnvVar:
          process.env.MTQ_SETTLEMENT_ENABLED ?? "(unset — defaults to enabled)",
        supportedSettlementAssets: SUPPORTED_SETTLEMENT_ASSETS,
        defaultSettlementAsset: DEFAULT_SETTLEMENT_ASSET,
        overrideRule:
          "Control plane is asset-agnostic. MTQ is one of 7 supported settlement assets, not the only one. The control plane remains usable when MTQ is disabled.",
        boundaryDoc: "docs/architecture/CONTROL-PLANE-VS-MTQ-BOUNDARY.md",
      },
      // BM-01..BM-16A — asset-agnostic, always ACTIVE
      controlPlaneWorkflow: controlPlaneWorkflow.map(summarizeStep),
      controlPlaneWorkflowCount: controlPlaneWorkflow.length,
      // BM-16B — MTQ-specific. When MTQ disabled, returned with
      // status="COMPLETED-NOT-REQUIRED" (still in the canonical workflow
      // definition, but won't execute).
      mtqSettlementWorkflow: mtqSettlementWorkflow.map(summarizeStep),
      mtqSettlementWorkflowCount: mtqSettlementWorkflow.length,
      // Full canonical workflow (combined) — for callers that want the
      // entire list in one shot.
      canonicalSettlementWorkflow: CANONICAL_SETTLEMENT_WORKFLOW.map(
        summarizeStep
      ),
      canonicalSettlementWorkflowCount: CANONICAL_SETTLEMENT_WORKFLOW.length,
      assetAgnostic: true,
      notes:
        "Control plane operates on SettlementAssetType. MTQ is optional. When MTQ_SETTLEMENT_ENABLED=false, BM-16B is marked COMPLETED-NOT-REQUIRED and the bank executes settlement via its own rails (RTGS, CBDC, correspondent banking, etc.).",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "X-Capability": "CONTROL_PLANE_CORE",
        "X-MTQ-Settlement-Enabled": mtqEnabled ? "true" : "false",
        "X-Active-Model": "v25.3.2",
      },
    }
  );
}

// Helper export for callers that want to inspect the canonical workflow
// programmatically (not just via the HTTP endpoint). Mirrors the
// shape returned by the GET handler.
export type SettlementStatusResponse = {
  _meta: {
    activeModel: string;
    capability: "CONTROL_PLANE_CORE";
    mtqSettlementEnabled: boolean;
    supportedSettlementAssets: SettlementAssetType[];
    defaultSettlementAsset: SettlementAssetType;
  };
  controlPlaneWorkflow: CanonicalBMStep[];
  mtqSettlementWorkflow: CanonicalBMStep[];
};

// Re-export MTQ_SETTLEMENT_ENABLED for callers that want the constant
// directly (without invoking the function form).
export { MTQ_SETTLEMENT_ENABLED };
