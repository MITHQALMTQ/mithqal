import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  BANK_FACING_COUNTERPARTY_ENTITY,
  getBankFacingCounterpartyEntity,
  getBankFacingCounterpartyEntityId,
  getCanonicalFields,
  getInternalSeparation,
  INSTITUTIONAL_OPERATING_MODEL_STATUS,
  INSTITUTIONAL_OPERATING_MODEL_VERSION,
  INSTITUTIONAL_OPERATING_MODEL_SOURCE,
} from "@/lib/institutional-operating-model";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("institutional-operating-model", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      modelSource: INSTITUTIONAL_OPERATING_MODEL_SOURCE,
      modelVersion: INSTITUTIONAL_OPERATING_MODEL_VERSION,
      status: INSTITUTIONAL_OPERATING_MODEL_STATUS,
      overrideRule: "Banks see exactly ONE external contractual counterparty. Internal separation preserved. PENDING_LEGAL_VERIFICATION where instruments not available.",
      mDirectiveTrace: "1a0ee14af343a085",
      crossReferences: {
        economicDefinition: "src/lib/mtq-economic-definition.ts (v25.3.5 / Agent K2)",
        institutionalOperator: "JOZOUR Amendment §1.6 (two-entity architecture)",
        capabilityBoundary: "src/lib/control-plane-boundary.ts (v25.3.4 / Agent J3)",
        reserveDomains: "src/lib/reserve-domains.ts (v25.3.6 / Agent K4)",
        pilot1Config: "src/lib/pilot-1-config.ts (v25.3.6 / Agent K5)",
        commercialGovernance: "src/lib/commercial-governance.ts (4 PLANNED entities — preserved for traceability)",
      },
    },
    bankFacingCounterpartyEntityId: getBankFacingCounterpartyEntityId(),
    bankFacingCounterpartyEntity: getBankFacingCounterpartyEntity(),
    canonicalFields: getCanonicalFields(),
    internalSeparation: getInternalSeparation(),
    rule: "Banks must see exactly ONE external contractual counterparty for MITHQAL services. All 8 canonical fields resolve to the bankFacingCounterpartyEntity. Internal separation between Holding, Operating, Technology, and independent oversight is PRESERVED where legally appropriate.",
  });
}
