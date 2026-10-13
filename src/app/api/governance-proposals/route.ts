import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * /api/governance-proposals — Council governance proposals per
 * Constitution v19.0 §41-§44 (parameter-change / emergency-action /
 * council-nomination / constitutional-amendment). v25.8 architectural
 * model per F1 gap analysis (closes gap #1). Backed by the
 * `GovernanceProposal` libsql table created idempotently in
 * `ensureV258Schema()` of src/lib/db.ts.
 *
 * NOTE: this route is distinct from the existing /api/governance/proposals
 * which mirrors on-chain proposals via the OS indexer. This route is the
 * off-chain proposal registry — the source-of-truth for the Council's
 * multi-sig workflow before any proposal is submitted on-chain.
 *
 * GET — public, rate-limited (30 req/min per IP), list with filters:
 *   ?status=draft|proposed|active|passed|rejected|executed|expired
 *   ?proposalType=parameter-change|emergency-action|council-nomination|constitutional-amendment
 *   ?proposerAddress=<wallet-address>
 *   ?limit=50  (max 200, default 50)
 *
 * POST — operator-only (CRON_SECRET-gated, same pattern as
 *   /api/oracle/update). Creates a new proposal record. Required:
 *     - proposalType, title, description, proposerAddress, proposerRole,
 *       proposalHash (unique), actionsJson (JSON array string), validUntil
 *   Optional: status, quorumRequired, approvalRequired, maxSeverity,
 *     votingOpensAt, votingClosesAt, approvalsJson, rejectionsJson, notes.
 *
 * Returns 200 on GET (with empty array if no rows). Returns 201 on POST
 * with the created record. Returns 503 if CRON_SECRET unset; 401 if the
 * `x-cron-secret` header doesn't match. Returns 400 on invalid body.
 */

export const dynamic = "force-dynamic"; // Prisma-backed route — never statically cached
export const runtime = "nodejs"; // Prisma needs Node (not Edge)

const VALID_PROPOSAL_TYPES = new Set([
  "parameter-change",
  "emergency-action",
  "council-nomination",
  "constitutional-amendment",
]);

const VALID_STATUSES = new Set([
  "draft",
  "proposed",
  "active",
  "passed",
  "rejected",
  "executed",
  "expired",
]);

const VALID_PROPOSER_ROLES = new Set([
  "council-member",
  "operator",
  "external",
]);

const VALID_SEVERITIES = new Set(["low", "medium", "high", "critical"]);

export async function GET(req: Request) {
  const blocked = enforceRateLimit("governance-proposals-get", req, 30, 60_000);
  if (blocked) return blocked;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? undefined;
    const proposalType = url.searchParams.get("proposalType") ?? undefined;
    const proposerAddress = url.searchParams.get("proposerAddress") ?? undefined;
    const limitParam = url.searchParams.get("limit");

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: "Invalid ?status filter.",
          validValues: Array.from(VALID_STATUSES),
        },
        { status: 400 },
      );
    }
    if (proposalType && !VALID_PROPOSAL_TYPES.has(proposalType)) {
      return NextResponse.json(
        {
          error: "Invalid ?proposalType filter.",
          validValues: Array.from(VALID_PROPOSAL_TYPES),
        },
        { status: 400 },
      );
    }

    let limit = 50;
    if (limitParam) {
      const parsed = Number(limitParam);
      if (Number.isFinite(parsed) && parsed > 0) {
        limit = Math.min(Math.floor(parsed), 200);
      }
    }

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (proposalType) where.proposalType = proposalType;
    if (proposerAddress) where.proposerAddress = proposerAddress.toLowerCase();

    const [proposals, total] = await Promise.all([
      db.governanceProposal.findMany({
        where,
        orderBy: { proposedAt: "desc" },
        take: limit,
      }),
      db.governanceProposal.count({
        where: status || proposalType
          ? { status, proposalType }
          : undefined,
      }),
    ]);

    return NextResponse.json({
      governanceProposals: proposals,
      total,
      filter: Object.keys(where).length ? where : null,
      limit,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("governance-proposals list failed:", err);
    return NextResponse.json(
      {
        error: "Could not load governance proposals.",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  // CRON_SECRET gate — operator-only.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      {
        error: "Service unavailable",
        detail:
          "CRON_SECRET not configured — governance-proposal creation endpoint is disabled until the operator provisions a cron secret",
      },
      { status: 503 },
    );
  }
  if (req.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json(
      { error: "unauthorized", detail: "missing or invalid x-cron-secret header" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;

  // Required fields.
  const proposalType =
    typeof data.proposalType === "string" ? data.proposalType.trim() : "";
  if (!VALID_PROPOSAL_TYPES.has(proposalType)) {
    return NextResponse.json(
      {
        error: "Invalid proposalType.",
        validValues: Array.from(VALID_PROPOSAL_TYPES),
      },
      { status: 400 },
    );
  }
  const title = typeof data.title === "string" ? data.title.trim() : "";
  if (!title || title.length > 300) {
    return NextResponse.json(
      { error: "title is required (1-300 chars)." },
      { status: 400 },
    );
  }
  const description =
    typeof data.description === "string" ? data.description.trim() : "";
  if (!description || description.length > 10000) {
    return NextResponse.json(
      { error: "description is required (1-10000 chars)." },
      { status: 400 },
    );
  }
  const proposerAddress =
    typeof data.proposerAddress === "string" ? data.proposerAddress.trim().toLowerCase() : "";
  if (!/^0x[a-f0-9]{40}$/.test(proposerAddress) && !/^[a-z0-9]{32,64}$/.test(proposerAddress)) {
    return NextResponse.json(
      {
        error:
          "proposerAddress must be a valid EVM (0x...) or Solana (base58, 32-64 chars) address.",
      },
      { status: 400 },
    );
  }
  const proposerRole =
    typeof data.proposerRole === "string" ? data.proposerRole.trim() : "";
  if (!VALID_PROPOSER_ROLES.has(proposerRole)) {
    return NextResponse.json(
      {
        error: "Invalid proposerRole.",
        validValues: Array.from(VALID_PROPOSER_ROLES),
      },
      { status: 400 },
    );
  }
  const proposalHash =
    typeof data.proposalHash === "string" ? data.proposalHash.trim().toLowerCase() : "";
  if (!/^(0x)?[a-f0-9]{64}$/.test(proposalHash)) {
    return NextResponse.json(
      {
        error:
          "proposalHash must be a 64-char hex string (keccak256 / sha256, optional 0x prefix).",
      },
      { status: 400 },
    );
  }
  const actionsJson =
    typeof data.actionsJson === "string" ? data.actionsJson.trim() : "";
  // Validate that actionsJson is a JSON-parseable array.
  try {
    const parsed = JSON.parse(actionsJson);
    if (!Array.isArray(parsed)) {
      throw new Error("actionsJson must parse to a JSON array.");
    }
  } catch (parseErr) {
    return NextResponse.json(
      {
        error: "actionsJson must be a JSON array string.",
        detail: parseErr instanceof Error ? parseErr.message : "invalid JSON",
      },
      { status: 400 },
    );
  }
  // validUntil is required (proposal must have an expiry).
  const validUntilRaw =
    typeof data.validUntil === "string" ? data.validUntil : "";
  const validUntil = validUntilRaw ? new Date(validUntilRaw) : null;
  if (!validUntil || isNaN(validUntil.getTime())) {
    return NextResponse.json(
      { error: "validUntil is required (ISO 8601 date string)." },
      { status: 400 },
    );
  }
  if (validUntil.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "validUntil must be a future timestamp." },
      { status: 400 },
    );
  }

  // Optional fields.
  const status =
    typeof data.status === "string" && VALID_STATUSES.has(data.status)
      ? data.status
      : "draft";
  const quorumRequired =
    typeof data.quorumRequired === "number" && Number.isFinite(data.quorumRequired)
      ? Math.max(1, Math.min(Math.floor(data.quorumRequired), 21))
      : 5;
  const approvalRequired =
    typeof data.approvalRequired === "number" && Number.isFinite(data.approvalRequired)
      ? Math.max(1, Math.min(Math.floor(data.approvalRequired), 21))
      : 4;
  // approvalRequired must be ≤ quorumRequired (can't pass with fewer votes
  // than quorum).
  if (approvalRequired > quorumRequired) {
    return NextResponse.json(
      {
        error: "approvalRequired must be ≤ quorumRequired.",
        approvalRequired,
        quorumRequired,
      },
      { status: 400 },
    );
  }
  const maxSeverity =
    typeof data.maxSeverity === "string" && VALID_SEVERITIES.has(data.maxSeverity)
      ? data.maxSeverity
      : "low";
  const votingOpensAt =
    typeof data.votingOpensAt === "string" && data.votingOpensAt.trim()
      ? new Date(data.votingOpensAt)
      : null;
  const votingClosesAt =
    typeof data.votingClosesAt === "string" && data.votingClosesAt.trim()
      ? new Date(data.votingClosesAt)
      : null;
  if (votingOpensAt && isNaN(votingOpensAt.getTime())) {
    return NextResponse.json(
      { error: "votingOpensAt must be a valid ISO 8601 date string." },
      { status: 400 },
    );
  }
  if (votingClosesAt && isNaN(votingClosesAt.getTime())) {
    return NextResponse.json(
      { error: "votingClosesAt must be a valid ISO 8601 date string." },
      { status: 400 },
    );
  }
  const approvalsJson =
    typeof data.approvalsJson === "string" && data.approvalsJson.trim()
      ? data.approvalsJson
      : "[]";
  const rejectionsJson =
    typeof data.rejectionsJson === "string" && data.rejectionsJson.trim()
      ? data.rejectionsJson
      : "[]";
  const notes =
    typeof data.notes === "string" && data.notes.trim() ? data.notes.trim() : null;

  try {
    const created = await db.governanceProposal.create({
      data: {
        proposalType,
        title,
        description,
        proposerAddress,
        proposerRole,
        proposalHash,
        actionsJson,
        status,
        quorumRequired,
        approvalRequired,
        maxSeverity,
        validUntil,
        votingOpensAt,
        votingClosesAt,
        approvalsJson,
        rejectionsJson,
        notes,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        governanceProposal: created,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("governance-proposal create failed:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("UNIQUE") || msg.includes("unique")) {
      return NextResponse.json(
        {
          error:
            "A governance proposal with this proposalHash already exists.",
          detail: msg,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      {
        error: "Could not create governance proposal.",
        detail: msg,
      },
      { status: 500 },
    );
  }
}
