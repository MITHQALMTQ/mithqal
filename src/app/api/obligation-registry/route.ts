import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  registerObligation,
  getObligation,
  listObligations,
  getObligationsBySettlementAsset,
  getObligationsByBeneficiary,
  getObligationsByLegalObligor,
  validateObligation,
  OBLIGATION_REGISTRY_STATUS,
  OBLIGATION_REGISTRY_VERSION,
  OBLIGATION_REGISTRY_SOURCE,
  OBLIGATION_FIELD_COUNT,
  OBLIGATION_FIELDS,
  NO_LEGAL_OBLIGOR_RULE,
  SUPPORTED_SETTLEMENT_ASSET_TYPES,
  type InstitutionalSettlementObligation,
} from "@/lib/institutional-settlement-obligation-registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/obligation-registry
// Query params:
//   ?obligationId=X       — retrieve a specific obligation
//   ?list=true            — list all obligation IDs
//   ?settlementAsset=MTQ — filter by settlement asset type (MTQ-independent)
//   ?beneficiary=X       — filter by beneficiary entity ID
//   ?legalObligor=X      — filter by legal obligor entity ID
// (no params)            — return the 13-field schema + enforcement rule

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("obligation-registry", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const obligationId = url.searchParams.get("obligationId");
  const list = url.searchParams.get("list") === "true";
  const settlementAsset = url.searchParams.get("settlementAsset");
  const beneficiary = url.searchParams.get("beneficiary");
  const legalObligor = url.searchParams.get("legalObligor");

  if (obligationId) {
    const obligation = getObligation(obligationId);
    if (!obligation) {
      return NextResponse.json(
        { error: `Obligation ${obligationId} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
      },
      obligation,
    });
  }

  if (list) {
    const ids = listObligations();
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
      },
      obligationIds: ids,
      count: ids.length,
    });
  }

  if (settlementAsset) {
    const obligations = getObligationsBySettlementAsset(settlementAsset);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
        filter: `settlementAsset=${settlementAsset}`,
      },
      obligations,
      count: obligations.length,
    });
  }

  if (beneficiary) {
    const obligations = getObligationsByBeneficiary(beneficiary);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
        filter: `beneficiary=${beneficiary}`,
      },
      obligations,
      count: obligations.length,
    });
  }

  if (legalObligor) {
    const obligations = getObligationsByLegalObligor(legalObligor);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
        filter: `legalObligor=${legalObligor}`,
      },
      obligations,
      count: obligations.length,
    });
  }

  // Default: return schema + enforcement rule
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      registrySource: OBLIGATION_REGISTRY_SOURCE,
      registryVersion: OBLIGATION_REGISTRY_VERSION,
      status: OBLIGATION_REGISTRY_STATUS,
      overrideRule:
        "Canonical Institutional Settlement Obligation Registry. 13 fields per obligation. NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION enforced. MTQ-independent (works for any settlement asset type).",
      enforcementRule: NO_LEGAL_OBLIGOR_RULE,
    },
    fieldCount: OBLIGATION_FIELD_COUNT,
    fields: OBLIGATION_FIELDS,
    supportedSettlementAssetTypes: SUPPORTED_SETTLEMENT_ASSET_TYPES,
    rule: "Each obligation has 13 fields. If legalObligor is null, empty, or SUPERSEDED, the obligation CANNOT be registered (NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION). Registry is MTQ-independent — filter by ?settlementAsset=BANK_MONEY|CENTRAL_BANK_MONEY|RTGS|TOKENIZED_DEPOSITS|WHOLESALE_CBDC|MTQ|OTHER_LEGALLY_RECOGNIZED.",
    queries: {
      retrieveObligation: "?obligationId=OBL-2026-001",
      listAllObligationIds: "?list=true",
      filterBySettlementAsset: "?settlementAsset=MTQ",
      filterByBeneficiary: "?beneficiary=BANK_AE_FAB",
      filterByLegalObligor: "?legalObligor=BANK_CN_ICBC",
    },
    honestState: {
      storeType: "in-memory (Map)",
      scope: "v25.3.9 controlled-test release. Production deployment requires a durable database table (e.g., a Prisma model InstitutionalSettlementObligation). DO NOT use the in-memory store for production settlement — it does not survive process restarts and is not shared across serverless function instances.",
      doesNotSurviveProcessRestarts: true,
      notSharedAcrossServerlessInstances: true,
    },
  });
}

// POST /api/obligation-registry
// Registers a new obligation. Enforces NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION.

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit(
    "obligation-registry-post",
    request,
    10,
    60_000
  );
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();

    // Validate the obligation (enforces NO_LEGAL_OBLIGOR -> NO_INSTITUTIONAL_OBLIGATION)
    const validation = validateObligation(body);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Obligation validation failed",
          validation,
          rule: NO_LEGAL_OBLIGOR_RULE,
        },
        { status: 400 }
      );
    }

    // Register the obligation
    const result = registerObligation(body as InstitutionalSettlementObligation);
    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          validation: result.validation,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: OBLIGATION_REGISTRY_SOURCE,
        version: OBLIGATION_REGISTRY_VERSION,
      },
      obligationId: result.obligationId,
      registered: true,
      enforcementRule: NO_LEGAL_OBLIGOR_RULE,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to register obligation",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}
