// GET /api/policy-registry
//
// MITHQAL v25.3.2 — Machine-Readable Policy Registry Endpoint
// Per MITHQAL-V25.3.2-REMEDIATION-LAYER.md §3 Rule 4 (Runtime Diagnostics Discipline).
//
// OVERRIDE-PREVENTION RULES (per §3):
//   - Default response: ONLY ACTIVE policies are exposed.
//   - SUPERSEDED / HISTORICAL / PENDING_VALIDATION are queryable via
//     ?include=superseded|historical|pending_validation|all (operator audit
//     only — never surfaced as "current" by runtime diagnostics).
//   - Every response carries _meta.activeModel = "v25.3.2" so callers can
//     verify they are reading from the active model.
//   - Every response carries _meta.policySource = "policy-registry" so
//     callers can verify they are reading from the registry layer.
//   - Every response carries _meta.defaultExposure documenting the override-
//     prevention rule.
//
// QUERY PARAMS:
//   ?include=active (DEFAULT)              — only ACTIVE policies
//   ?include=superseded                     — only SUPERSEDED policies
//   ?include=historical                     — only HISTORICAL policies
//   ?include=pending_validation             — only PENDING_VALIDATION policies
//   ?include=all                            — all policies (any status)
//   ?sourceLayer=1|2|3|4|5                  — filter by authority layer
//                                              (1=v25.3.2 apex, 2=Constitution,
//                                               3=policy-registry, 4=legal
//                                               evidence, 5=historical)
//   ?id=POLICY_ID                           — single policy lookup
//                                              (with include=all, returns the
//                                               policy's full history; without,
//                                               returns only the ACTIVE entry)

import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  getActivePolicies,
  getPolicies,
  getPolicyHistory,
  ACTIVE_MODEL,
  POLICY_REGISTRY_VERSION,
  POLICY_REGISTRY_SOURCE,
  type PolicyStatus,
  type SourceLayer,
} from "@/lib/policy-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const VALID_INCLUDES = new Set([
  "active",
  "superseded",
  "historical",
  "pending_validation",
  "all",
]);

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("policy-registry", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const include = (url.searchParams.get("include") || "active").toLowerCase();
  const sourceLayerParam = url.searchParams.get("sourceLayer");
  const id = url.searchParams.get("id");

  if (!VALID_INCLUDES.has(include)) {
    return NextResponse.json(
      {
        error:
          "Invalid ?include= value. Allowed: active (default), superseded, historical, pending_validation, all.",
        _meta: {
          activeModel: ACTIVE_MODEL,
          policySource: POLICY_REGISTRY_SOURCE,
          registryVersion: POLICY_REGISTRY_VERSION,
        },
      },
      { status: 400 }
    );
  }

  let sourceLayer: SourceLayer | undefined;
  if (sourceLayerParam !== null) {
    const parsed = Number.parseInt(sourceLayerParam, 10);
    if (![1, 2, 3, 4, 5].includes(parsed)) {
      return NextResponse.json(
        {
          error:
            "Invalid ?sourceLayer= value. Allowed: 1 (v25.3.2 apex), 2 (Constitution), 3 (policy-registry), 4 (legal evidence), 5 (historical).",
          _meta: {
            activeModel: ACTIVE_MODEL,
            policySource: POLICY_REGISTRY_SOURCE,
            registryVersion: POLICY_REGISTRY_VERSION,
          },
        },
        { status: 400 }
      );
    }
    sourceLayer = parsed as SourceLayer;
  }

  let policies;
  let includeParamEcho = include;

  if (id) {
    // Single policy lookup. If include=all, return the policy's full history
    // (all statuses). Otherwise return only the ACTIVE entry (if any).
    if (include === "all") {
      policies = getPolicyHistory(id);
      includeParamEcho = `all (history for id=${id})`;
    } else {
      const match = getActivePolicies().find((p) => p.id === id);
      policies = match ? [match] : [];
      includeParamEcho = `active (lookup for id=${id})`;
    }
    if (sourceLayer) {
      policies = policies.filter((p) => p.sourceLayer === sourceLayer);
    }
  } else if (include === "active") {
    policies = getActivePolicies();
    if (sourceLayer) {
      policies = policies.filter((p) => p.sourceLayer === sourceLayer);
    }
  } else if (include === "all") {
    policies = getPolicies({
      sourceLayer: sourceLayer as SourceLayer | undefined,
    });
  } else {
    // Operator-audit mode: only the requested status is returned.
    const statusFilter = include.toUpperCase() as PolicyStatus;
    policies = getPolicies({
      status: statusFilter,
      sourceLayer: sourceLayer as SourceLayer | undefined,
    });
  }

  return NextResponse.json({
    _meta: {
      activeModel: ACTIVE_MODEL,
      policySource: POLICY_REGISTRY_SOURCE,
      registryVersion: POLICY_REGISTRY_VERSION,
      includeParam: includeParamEcho,
      defaultExposure:
        "Only ACTIVE policies are exposed by default. Use ?include=superseded|historical|pending_validation|all for operator audit.",
      overridePreventionRule:
        "No historical section may silently override the active model. See MITHQAL-V25.3.2-REMEDIATION-LAYER.md §3.",
      sourceLayerFilter: sourceLayer ?? null,
    },
    count: policies.length,
    policies,
  });
}
