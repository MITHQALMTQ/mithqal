// GET  /api/gateway/v1/evidence
// POST /api/gateway/v1/evidence
// v26.0 §5.1 + §5.6 — Evidence Fabric API.
//
// GET supports query filters per Appendix B.4 EvidenceArtifact fields.
// POST requires auth; for Pilot A, auth is enforced via a simple
// bearer token check (EVIDENCE_FABRIC_INGEST_TOKEN env var) and the
// submission is recorded as a draft EvidenceArtifact row pending
// review (reviewStatus='PENDING_REVIEW').
import { NextResponse } from "next/server";
import { getCanonicalPrisma } from "@/lib/prisma-canonical";
import { getWriterStatusSummary } from "@/lib/db-authoritative";

function parseBoolean(v: string | null): boolean | null {
  if (v === null) return null;
  const lower = v.trim().toLowerCase();
  if (lower === "true" || lower === "1") return true;
  if (lower === "false" || lower === "0") return false;
  return null;
}

export async function GET(req: Request) {
  const writerSummary = getWriterStatusSummary();
  const url = new URL(req.url);
  const params = url.searchParams;

  const claimOrDecisionId = params.get("claimOrDecisionId");
  const reviewStatus = params.get("reviewStatus");
  const sourceKind = params.get("sourceKind");
  const classification = params.get("classification");
  const expired = parseBoolean(params.get("expired"));

  // In demo-only mode, return an empty result set rather than hitting the DB.
  if (writerSummary.demoOnly) {
    return NextResponse.json(
      {
        status: "OK",
        honestState: writerSummary.honestState,
        demoOnly: true,
        filters: { claimOrDecisionId, reviewStatus, sourceKind, classification, expired },
        evidence: [],
        count: 0,
        note: "Demo-only mode: Evidence Fabric has no persisted artifacts. Filter results are empty.",
        blueprintRef: "v26.0 §5.1 + §5.6 + Appendix B.4",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "X-Endpoint-Status": "DEMO_ONLY" } },
    );
  }

  try {
    const prisma = getCanonicalPrisma();
    const now = new Date();
    const evidence = await prisma.evidenceArtifact.findMany({
      where: {
        ...(claimOrDecisionId ? { claimOrDecisionId } : {}),
        ...(reviewStatus ? { reviewStatus } : {}),
        ...(sourceKind ? { sourceKind } : {}),
        ...(classification ? { classification } : {}),
        ...(expired === true
          ? { expiresAt: { not: null, lt: now } }
          : expired === false
            ? { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }
            : {}),
      },
      orderBy: { observedAt: "desc" },
      take: 100,
    });

    return NextResponse.json(
      {
        status: "OK",
        honestState: writerSummary.honestState,
        demoOnly: false,
        filters: { claimOrDecisionId, reviewStatus, sourceKind, classification, expired },
        evidence,
        count: evidence.length,
        blueprintRef: "v26.0 §5.1 + §5.6 + Appendix B.4",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "X-Endpoint-Status": "OK" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason: err instanceof Error ? err.message : "Unknown Prisma error",
        evidence: [],
        count: 0,
      },
      { status: 503, headers: { "X-Endpoint-Status": "BLOCKED" } },
    );
  }
}

export async function POST(req: Request) {
  const writerSummary = getWriterStatusSummary();
  if (writerSummary.demoOnly) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason: "Evidence Fabric POST is blocked in demo-only mode.",
      },
      { status: 403, headers: { "X-Endpoint-Status": "DEMO_ONLY" } },
    );
  }

  // Simple bearer-token auth for Pilot A.
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.EVIDENCE_FABRIC_INGEST_TOKEN;
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      {
        status: "UNAUTHORIZED",
        honestState: writerSummary.honestState,
        reason:
          "Evidence Fabric POST requires Authorization: Bearer <EVIDENCE_FABRIC_INGEST_TOKEN>. Pilot A does not accept anonymous submissions.",
      },
      { status: 401, headers: { "X-Endpoint-Status": "UNAUTHORIZED" } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      {
        status: "REJECTED",
        reason: "Invalid JSON body.",
        honestState: writerSummary.honestState,
      },
      { status: 400, headers: { "X-Endpoint-Status": "REJECTED" } },
    );
  }

  const requiredFields = [
    "claimOrDecisionId",
    "sourceKind",
    "provenance",
    "issuer",
    "observedAt",
    "effectiveAt",
    "contentHash",
    "scope",
    "reviewStatus",
    "classification",
  ];
  const missing = requiredFields.filter((f) => body[f] === undefined || body[f] === null || body[f] === "");
  if (missing.length > 0) {
    return NextResponse.json(
      {
        status: "REJECTED",
        reason: `Missing required EvidenceArtifact fields: ${missing.join(", ")}`,
        missing,
        honestState: writerSummary.honestState,
      },
      { status: 400, headers: { "X-Endpoint-Status": "REJECTED" } },
    );
  }

  const evidenceId = `EVD-${crypto.randomUUID()}`;
  const ingestedAt = new Date().toISOString();

  try {
    const prisma = getCanonicalPrisma();
    const created = await prisma.evidenceArtifact.create({
      data: {
        evidenceId,
        claimOrDecisionId: String(body.claimOrDecisionId),
        sourceKind: String(body.sourceKind),
        provenance: String(body.provenance),
        issuer: String(body.issuer),
        sourceSystem: body.sourceSystem ? String(body.sourceSystem) : null,
        operator: body.operator ? String(body.operator) : null,
        observedAt: new Date(String(body.observedAt)),
        effectiveAt: new Date(String(body.effectiveAt)),
        expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
        contentHash: String(body.contentHash),
        signature: body.signature ? String(body.signature) : null,
        scope: String(body.scope),
        limitations: body.limitations ? String(body.limitations) : null,
        reviewStatus: String(body.reviewStatus),
        classification: String(body.classification),
        linkedCommitSha: body.linkedCommitSha ? String(body.linkedCommitSha) : null,
        linkedPolicyHash: body.linkedPolicyHash ? String(body.linkedPolicyHash) : null,
        linkedTransactionId: body.linkedTransactionId ? String(body.linkedTransactionId) : null,
        linkedGateId: body.linkedGateId ? String(body.linkedGateId) : null,
      },
    });
    return NextResponse.json(
      {
        status: "ACCEPTED",
        honestState: writerSummary.honestState,
        evidenceId,
        record: created,
        note: "Evidence artifact recorded with reviewStatus from submission; reviewers MUST re-attest before promoting to VERIFIED_PRIMARY_DOCUMENT.",
        blueprintRef: "v26.0 §5.1 + §5.6 + Appendix B.4",
        timestamp: ingestedAt,
      },
      { status: 201, headers: { "X-Endpoint-Status": "ACCEPTED" } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "BLOCKED",
        honestState: writerSummary.honestState,
        reason: err instanceof Error ? err.message : "Unknown Prisma error",
      },
      { status: 503, headers: { "X-Endpoint-Status": "BLOCKED" } },
    );
  }
}
