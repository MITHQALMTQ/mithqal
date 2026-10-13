import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  generateEvidencePackage,
  retrieveEvidencePackage,
  listEvidencePackages,
  verifyEvidencePackageIntegrity,
  INSTITUTIONAL_EVIDENCE_FABRIC_STATUS,
  INSTITUTIONAL_EVIDENCE_FABRIC_VERSION,
  INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE,
  EVIDENCE_PACKAGE_FIELD_COUNT,
  EVIDENCE_PACKAGE_FIELDS,
  type AccessLevel,
  type EvidencePackage,
} from "@/lib/institutional-evidence-fabric";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/evidence-fabric
// Query params:
//   ?transactionId=X — retrieve a specific evidence package
//   ?accessLevel=PUBLIC|INSTITUTIONAL|AUDIT — access level (default: PUBLIC)
//   ?list=true — list all transaction IDs in the store
//   ?verify=X — verify integrity of a package

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit("evidence-fabric", request, 30, 60_000);
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const transactionId = url.searchParams.get("transactionId");
  const accessLevel = (url.searchParams.get("accessLevel") || "PUBLIC") as AccessLevel;
  const list = url.searchParams.get("list") === "true";
  const verify = url.searchParams.get("verify");

  // List all packages
  if (list) {
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE,
        version: INSTITUTIONAL_EVIDENCE_FABRIC_VERSION,
        status: INSTITUTIONAL_EVIDENCE_FABRIC_STATUS,
      },
      transactionIds: listEvidencePackages(),
      count: listEvidencePackages().length,
    });
  }

  // Verify a package
  if (verify) {
    const retrieval = retrieveEvidencePackage(verify, "AUDIT");  // need full package to verify
    if (!retrieval.evidencePackage) {
      return NextResponse.json({ error: `Package ${verify} not found` }, { status: 404 });
    }
    const integrity = verifyEvidencePackageIntegrity(retrieval.evidencePackage as EvidencePackage);
    return NextResponse.json({
      _meta: { activeModel: "v25.3.2", source: INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE },
      transactionId: verify,
      integrityVerified: integrity,
    });
  }

  // Retrieve a specific package (with access-level gating)
  if (transactionId) {
    const retrieval = retrieveEvidencePackage(transactionId, accessLevel);
    if (!retrieval.accessDecision.allowed) {
      return NextResponse.json({ error: retrieval.accessDecision.reason }, { status: 403 });
    }
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE,
        version: INSTITUTIONAL_EVIDENCE_FABRIC_VERSION,
        status: INSTITUTIONAL_EVIDENCE_FABRIC_STATUS,
      },
      accessDecision: retrieval.accessDecision,
      evidencePackage: retrieval.evidencePackage,
    });
  }

  // Default: return the schema
  return NextResponse.json({
    _meta: {
      activeModel: "v25.3.2",
      source: INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE,
      version: INSTITUTIONAL_EVIDENCE_FABRIC_VERSION,
      status: INSTITUTIONAL_EVIDENCE_FABRIC_STATUS,
      overrideRule: "First-class Institutional Evidence Fabric. Every material transaction generates a portable 15-field evidence package. Retrieval is access-level gated (PUBLIC/INSTITUTIONAL/AUDIT).",
    },
    fieldCount: EVIDENCE_PACKAGE_FIELD_COUNT,
    fields: EVIDENCE_PACKAGE_FIELDS,
    accessLevels: [
      { level: "PUBLIC", description: "Only transaction ID + finality state + cryptographic commitments + minimal timestamps. No confidential information." },
      { level: "INSTITUTIONAL", description: "Full evidence package, but PII fields are hashed and signatures masked. Authorized for participating institutions." },
      { level: "AUDIT", description: "Full evidence package with raw fields. Authorized for auditors + regulators only." },
    ],
    rule: "Every material transaction must generate a portable evidence package. Use POST /api/evidence-fabric to generate. Use GET ?transactionId=X&accessLevel=Y to retrieve.",
  });
}

// POST /api/evidence-fabric
// Generates a new evidence package

export async function POST(request: Request) {
  const rateLimited = enforceRateLimit("evidence-fabric-post", request, 10, 60_000);
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    // Validate required fields
    const required = ["transactionId", "parties", "policyVersion", "complianceState", "sanctionsState", "riskResult", "liquidityDecision", "backingEvidence", "legalObligationId", "finalityState", "authorization", "reconciliationResult", "timestamps"];
    for (const field of required) {
      if (!(field in body)) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const pkg = generateEvidencePackage(body);
    return NextResponse.json({
      _meta: {
        activeModel: "v25.3.2",
        source: INSTITUTIONAL_EVIDENCE_FABRIC_SOURCE,
        version: INSTITUTIONAL_EVIDENCE_FABRIC_VERSION,
        status: INSTITUTIONAL_EVIDENCE_FABRIC_STATUS,
      },
      transactionId: pkg.transactionId,
      evidencePackage: pkg,
      integrityVerified: verifyEvidencePackageIntegrity(pkg),
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate evidence package", detail: err instanceof Error ? err.message : "unknown" }, { status: 500 });
  }
}
