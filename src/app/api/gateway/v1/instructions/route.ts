// POST /api/gateway/v1/instructions
// v26.0 §4.1 + §6.2 — Canonical instruction intake (F0_ACCEPTED).
//
// Pipeline:
//   1. Validate required Appendix B.1 fields.
//   2. Generate instructionId.
//   3. Compute requestHash via crypto.subtle SHA-256.
//   4. Check MTQ gate (§3.2) for MTQ-related instructions.
//   5. Compose canonical InstructionRecord + OutboxRow.
//   6. Persist (best-effort) to Neon authoritative writer.
//   7. Return F0_ACCEPTED with demoOnly flag from getAuthoritativeBackend().
import { NextResponse } from "next/server";
import { getCanonicalPrisma } from "@/lib/prisma-canonical";
import { getWriterStatusSummary } from "@/lib/db-authoritative";
import { assertMtqEnabled } from "@/lib/mtq-gate";

interface InstructionRequestBody {
  schemaVersion?: string;
  institutionId?: string;
  tenantId?: string;
  sourceSystem?: string;
  externalInstructionRef?: string | null;
  idempotencyKey?: string;
  correlationId?: string;
  causationId?: string | null;
  assetId?: string;
  amount?: string;
  debtorObligor?: string;
  beneficiaryCreditor?: string;
  purpose?: string | null;
  requestedExecutionAt?: string | null;
  dueAt?: string | null;
  fees?: string | null;
  applicableLawId?: string | null;
  settlementDomainId?: string | null;
  jurisdictionSet?: string | string[];
  corridorId?: string | null;
  contractRef?: string | null;
  authorizationScope?: string | null;
  dataClassification?: string;
  policyVersion?: string;
  policyHash?: string;
  routeCandidates?: string | string[];
  reasonCodes?: string | string[];
  expiry?: string | null;
  cancellationRules?: string | null;
  isMtqInstruction?: boolean;
}

const REQUIRED_FIELDS: ReadonlyArray<keyof InstructionRequestBody> = [
  "schemaVersion",
  "institutionId",
  "tenantId",
  "sourceSystem",
  "idempotencyKey",
  "correlationId",
  "assetId",
  "amount",
  "debtorObligor",
  "beneficiaryCreditor",
  "jurisdictionSet",
  "dataClassification",
  "policyVersion",
  "policyHash",
];

const SCHEMA_VERSION = "1.0.0";

function validateBody(
  body: InstructionRequestBody,
): { ok: true } | { ok: false; missing: string[] } {
  const missing: string[] = [];
  for (const f of REQUIRED_FIELDS) {
    const v = body[f];
    if (v === undefined || v === null || v === "") {
      missing.push(String(f));
    }
  }
  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true };
}

function normalizeStringArray(value: string | string[] | undefined | null): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(",");
  return value;
}

async function computeRequestHash(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateInstructionId(): string {
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase();
  return `MBG-INSTR-${uuid}`;
}

function generateEventId(): string {
  return `EVT-${crypto.randomUUID()}`;
}

function generateOutboxId(): string {
  return `OBX-${crypto.randomUUID()}`;
}

function generateDecisionId(): string {
  return `DEC-${crypto.randomUUID()}`;
}

export async function POST(req: Request) {
  const writerSummary = getWriterStatusSummary();
  let body: InstructionRequestBody;
  try {
    body = (await req.json()) as InstructionRequestBody;
  } catch {
    return NextResponse.json(
      {
        status: "F0_REJECTED",
        finalityState: "F0",
        reason: "Invalid JSON body.",
        honestState: writerSummary.honestState,
      },
      { status: 400, headers: { "X-Finality-State": "F0_REJECTED" } },
    );
  }

  const validation = validateBody(body);
  if (!validation.ok) {
    return NextResponse.json(
      {
        status: "F0_REJECTED",
        finalityState: "F0",
        reason: `Missing required Appendix B.1 fields: ${validation.missing.join(", ")}`,
        missing: validation.missing,
        honestState: writerSummary.honestState,
      },
      { status: 400, headers: { "X-Finality-State": "F0_REJECTED" } },
    );
  }

  // 3. Generate canonical IDs.
  const instructionId = generateInstructionId();
  const eventId = generateEventId();
  const outboxId = generateOutboxId();
  const gateDecisionId = generateDecisionId();
  const now = new Date().toISOString();

  // 4. Compute request hash (SHA-256 of the canonical request body).
  const canonicalRequest = {
    schemaVersion: body.schemaVersion,
    institutionId: body.institutionId,
    tenantId: body.tenantId,
    sourceSystem: body.sourceSystem,
    externalInstructionRef: body.externalInstructionRef ?? null,
    idempotencyKey: body.idempotencyKey,
    correlationId: body.correlationId,
    causationId: body.causationId ?? null,
    assetId: body.assetId,
    amount: body.amount,
    debtorObligor: body.debtorObligor,
    beneficiaryCreditor: body.beneficiaryCreditor,
    purpose: body.purpose ?? null,
    requestedExecutionAt: body.requestedExecutionAt ?? null,
    dueAt: body.dueAt ?? null,
    fees: body.fees ?? null,
    applicableLawId: body.applicableLawId ?? null,
    settlementDomainId: body.settlementDomainId ?? null,
    jurisdictionSet: normalizeStringArray(body.jurisdictionSet),
    corridorId: body.corridorId ?? null,
    contractRef: body.contractRef ?? null,
    authorizationScope: body.authorizationScope ?? null,
    dataClassification: body.dataClassification,
    policyVersion: body.policyVersion,
    policyHash: body.policyHash,
    routeCandidates: normalizeStringArray(body.routeCandidates),
    reasonCodes: normalizeStringArray(body.reasonCodes),
    expiry: body.expiry ?? null,
    cancellationRules: body.cancellationRules ?? null,
  };
  const requestHash = await computeRequestHash(canonicalRequest);

  // 5. MTQ gate check for MTQ-related instructions.
  let mtqGate: ReturnType<typeof assertMtqEnabled> | null = null;
  if (body.isMtqInstruction === true) {
    mtqGate = assertMtqEnabled(`instructions:${instructionId}`);
    if (mtqGate && !mtqGate.ok) {
      return NextResponse.json(
        {
          status: "F0_REJECTED",
          finalityState: "F0",
          instructionId,
          requestHash,
          mtqGate,
          reason: `MTQ gate denied: ${mtqGate.reason ?? ""}`,
          honestState: writerSummary.honestState,
        },
        { status: 403, headers: { "X-Finality-State": "F0_REJECTED", "X-MTQ-Gate": "DENIED" } },
      );
    }
  }

  // 6. Compose canonical InstructionRecord (Appendix B.1) + OutboxRow (B.3).
  const instructionRecord = {
    instructionId,
    schemaVersion: body.schemaVersion ?? SCHEMA_VERSION,
    institutionId: body.institutionId!,
    tenantId: body.tenantId!,
    sourceSystem: body.sourceSystem!,
    externalInstructionRef: body.externalInstructionRef ?? null,
    idempotencyKey: body.idempotencyKey!,
    requestHash,
    correlationId: body.correlationId!,
    causationId: body.causationId ?? null,
    assetId: body.assetId!,
    amount: body.amount!,
    debtorObligor: body.debtorObligor!,
    beneficiaryCreditor: body.beneficiaryCreditor!,
    purpose: body.purpose ?? null,
    requestedExecutionAt: body.requestedExecutionAt ?? null,
    dueAt: body.dueAt ?? null,
    fees: body.fees ?? null,
    applicableLawId: body.applicableLawId ?? null,
    settlementDomainId: body.settlementDomainId ?? null,
    jurisdictionSet: normalizeStringArray(body.jurisdictionSet),
    corridorId: body.corridorId ?? null,
    contractRef: body.contractRef ?? null,
    authorizationScope: body.authorizationScope ?? null,
    dataClassification: body.dataClassification!,
    currentState: "F0_ACCEPTED",
    stateVersion: 0,
    policyVersion: body.policyVersion!,
    policyHash: body.policyHash!,
    routeCandidates: normalizeStringArray(body.routeCandidates),
    selectedRouteId: null,
    reasonCodes: normalizeStringArray(body.reasonCodes),
    expiry: body.expiry ?? null,
    cancellationRules: body.cancellationRules ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const outboxRow = {
    outboxId,
    eventId,
    aggregateType: "Instruction",
    aggregateId: instructionId,
    aggregateVersion: 1,
    eventType: "InstructionAcceptedF0",
    schemaVersion: SCHEMA_VERSION,
    payloadRef: null,
    payloadHash: requestHash,
    createdAt: now,
    nextAttemptAt: now,
    attemptCount: 0,
    dispatchStatus: "PENDING" as const,
    leaseOwner: null,
    leaseExpiresAt: null,
    consumerDedupeKey: body.idempotencyKey!,
    traceId: body.correlationId!,
    errorCategory: null,
  };

  // 7. Persist (best-effort) to Neon. When Neon is unavailable, we
  //    still return F0_ACCEPTED because the canonical records have
  //    been composed; the projection will replay them when the
  //    authoritative writer comes back online.
  let persistence: {
    attempted: boolean;
    ok: boolean;
    error: string | null;
    instructionRowId: string | null;
    outboxRowId: string | null;
    gateDecisionRowId: string | null;
  } = {
    attempted: false,
    ok: false,
    error: null,
    instructionRowId: null,
    outboxRowId: null,
    gateDecisionRowId: null,
  };

  if (!writerSummary.demoOnly) {
    persistence.attempted = true;
    try {
      const prisma = getCanonicalPrisma();
      await prisma.instruction.create({
        data: {
          instructionId: instructionRecord.instructionId,
          schemaVersion: instructionRecord.schemaVersion,
          institutionId: instructionRecord.institutionId,
          tenantId: instructionRecord.tenantId,
          sourceSystem: instructionRecord.sourceSystem,
          externalInstructionRef: instructionRecord.externalInstructionRef,
          idempotencyKey: instructionRecord.idempotencyKey,
          requestHash: instructionRecord.requestHash,
          correlationId: instructionRecord.correlationId,
          causationId: instructionRecord.causationId,
          assetId: instructionRecord.assetId,
          amount: instructionRecord.amount,
          debtorObligor: instructionRecord.debtorObligor,
          beneficiaryCreditor: instructionRecord.beneficiaryCreditor,
          purpose: instructionRecord.purpose,
          requestedExecutionAt: instructionRecord.requestedExecutionAt,
          dueAt: instructionRecord.dueAt,
          fees: instructionRecord.fees,
          applicableLawId: instructionRecord.applicableLawId,
          settlementDomainId: instructionRecord.settlementDomainId,
          jurisdictionSet: instructionRecord.jurisdictionSet,
          corridorId: instructionRecord.corridorId,
          contractRef: instructionRecord.contractRef,
          authorizationScope: instructionRecord.authorizationScope,
          dataClassification: instructionRecord.dataClassification,
          currentState: instructionRecord.currentState,
          stateVersion: instructionRecord.stateVersion,
          policyVersion: instructionRecord.policyVersion,
          policyHash: instructionRecord.policyHash,
          routeCandidates: instructionRecord.routeCandidates,
          selectedRouteId: instructionRecord.selectedRouteId,
          reasonCodes: instructionRecord.reasonCodes,
          expiry: instructionRecord.expiry,
          cancellationRules: instructionRecord.cancellationRules,
        },
      });
      await prisma.outboxEvent.create({
        data: {
          outboxId: outboxRow.outboxId,
          eventId: outboxRow.eventId,
          aggregateType: outboxRow.aggregateType,
          aggregateId: outboxRow.aggregateId,
          aggregateVersion: outboxRow.aggregateVersion,
          eventType: outboxRow.eventType,
          schemaVersion: outboxRow.schemaVersion,
          payloadRef: outboxRow.payloadRef,
          payloadHash: outboxRow.payloadHash,
          nextAttemptAt: new Date(outboxRow.nextAttemptAt),
          attemptCount: outboxRow.attemptCount,
          dispatchStatus: outboxRow.dispatchStatus,
          leaseOwner: outboxRow.leaseOwner,
          leaseExpiresAt: outboxRow.leaseExpiresAt,
          consumerDedupeKey: outboxRow.consumerDedupeKey,
          traceId: outboxRow.traceId,
          errorCategory: outboxRow.errorCategory,
        },
      });
      await prisma.gateDecision.create({
        data: {
          decisionId: gateDecisionId,
          gateId: "G0",
          scope: `instruction:${instructionId}`,
          evidenceRefs: requestHash,
          unmetRequirements: "",
          decision: "F0_ACCEPTED",
          conditions: null,
          conditionsExpiry: null,
          approvers: "auto:F0-intake",
        },
      });
      persistence.ok = true;
      persistence.instructionRowId = instructionId;
      persistence.outboxRowId = outboxId;
      persistence.gateDecisionRowId = gateDecisionId;
    } catch (err) {
      persistence.error = err instanceof Error ? err.message : "Unknown Prisma error";
    }
  }

  return NextResponse.json(
    {
      status: "F0_ACCEPTED",
      finalityState: "F0",
      instructionId,
      requestHash,
      mtqGate,
      honestState: writerSummary.honestState,
      demoOnly: writerSummary.demoOnly,
      productionAuthorized: writerSummary.productionAuthorized,
      instruction: instructionRecord,
      outbox: outboxRow,
      persistence,
      timestamp: now,
    },
    {
      status: 201,
      headers: {
        "X-Finality-State": "F0_ACCEPTED",
        "X-Endpoint-Status": writerSummary.demoOnly ? "DEMO_ONLY" : "PILOT",
        "X-Production-Authorized": writerSummary.productionAuthorized ? "true" : "false",
      },
    },
  );
}
