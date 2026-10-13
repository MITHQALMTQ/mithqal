// POST /api/gateway/v1/outbox/dispatch
// Run one cycle of the canonical outbox dispatcher per v26.0 §6.2 step 2.
//
// v26.0 §6.2 step 2:
//   "Dispatcher safely claims pending outbox rows with concurrency/lease
//    controls, emits stable eventId and minimal payload, and records
//    attempt/result."
//
// v26.0 §6.6 — Inngest workflow requirements:
//   - Distinguish event-delivery acknowledgement from successful business
//     workflow completion.
//   - Verify live provider configuration with safe probes.
//
// This route is ADMIN-AUTHORIZED only (operator with 2FA). The dispatcher
// itself just moves events; it does NOT authorize mints. Per §3.2 the
// canonical MTQ gate is at the originating instruction-write path. The
// dispatcher also enforces defense-in-depth: MTQ-related eventTypes are
// refused when MTQ is disabled (see src/lib/outbox-dispatcher.ts).
//
// Pilot A demo-only mode: the dispatcher still runs against the OutboxEvent
// table (created by `prisma db push`). No real-value path is exercised
// because instruction writes record F0_ACCEPTED with SIMULATED status and
// consumers are read-only/advisory.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDispatcherCycle } from "@/lib/outbox-dispatcher";
import {
  getAuthoritativeBackend,
  getWriterStatusSummary,
} from "@/lib/db-authoritative";

export async function POST(req: Request) {
  // ===== Admin auth (operator with 2FA) =====
  const session = await getServerSession(authOptions).catch(() => null);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "operator") {
    return NextResponse.json(
      {
        error: "Unauthorized — operator auth required.",
        blueprint_ref: "v26.0 §7.1 — least privilege for privileged command APIs",
      },
      { status: 401 },
    );
  }

  // ===== Parse optional body (batchLimit, leaseDurationMs, leaseOwner) =====
  let body: {
    batchLimit?: number;
    leaseDurationMs?: number;
    leaseOwner?: string;
  } = {};
  try {
    const text = await req.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text) as typeof body;
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", blueprint_ref: "v26.0 §6.2 step 2" },
      { status: 400 },
    );
  }

  // Bound batchLimit + leaseDurationMs to safe maxima.
  const batchLimit = Math.max(1, Math.min(100, Number(body.batchLimit ?? 25)));
  const leaseDurationMs = Math.max(
    5_000,
    Math.min(5 * 60_000, Number(body.leaseDurationMs ?? 30_000)),
  );

  // ===== Run one dispatcher cycle =====
  let summary;
  try {
    summary = await runDispatcherCycle({
      leaseOwner: body.leaseOwner,
      leaseDurationMs,
      batchLimit,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "Dispatcher cycle failed.",
        // message may include env-name redactions only; no secret values are
        // ever read or printed here.
        detail: message.includes("DATABASE_URL")
          ? "DATABASE_URL is not set; cannot claim outbox rows."
          : message,
        authoritativeBackend: getAuthoritativeBackend(),
        blueprint_ref: "v26.0 §6.2 step 2",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      endpoint: "/gateway/v1/outbox/dispatch",
      method: "POST",
      blueprint_ref: "v26.0 §6.2 step 2 + Appendix B.3",
      summary,
      writer: {
        authoritativeBackend: getAuthoritativeBackend(),
        writerStatus: getWriterStatusSummary(),
      },
      // Per §6.10, dispatch is one step of provider harmony. The actual
      // end-to-end harmony probe lives at scripts/verify-provider-harmony.ts.
      // This route emits events; Inngest picks them up via polling.
    },
    {
      headers: {
        "X-Blueprint-Ref": "v26.0 §6.2 step 2",
        "X-Dispatcher-Owner": summary.leaseOwner,
      },
    },
  );
}

// GET endpoint for operator dashboards: returns a simple status hint.
export async function GET() {
  return NextResponse.json({
    endpoint: "/gateway/v1/outbox/dispatch",
    method: "POST",
    blueprint_ref: "v26.0 §6.2 step 2",
    description:
      "Run one cycle of the canonical outbox dispatcher. " +
      "Claims pending rows, emits stable eventId + minimal payload to Inngest, " +
      "marks results (DELIVERED / RETRYABLE_FAILED / DEAD_LETTERED).",
    auth: "operator (2FA recommended)",
    body: {
      batchLimit: "optional int (1-100, default 25)",
      leaseDurationMs: "optional int (5000-300000, default 30000)",
      leaseOwner: "optional string identifier for the dispatcher instance",
    },
  });
}
