import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db";

// Public Formation Committee interest capture.
// This is the credibility-layer intake: investors, advisors, anchor
// participants and Council nominees. POST only; no listing endpoint to
// avoid leaking submissions.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const fullName = typeof data.fullName === "string" ? data.fullName.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const org = typeof data.org === "string" ? data.org.trim() : null;
  const role = typeof data.role === "string" ? data.role.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : null;

  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: "A valid name is required." }, { status: 400 });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  const allowedRoles = [
    "investor",
    "advisor",
    "anchor",
    "council-nominee",
    "partner",
    "other",
  ];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Select a valid role." }, { status: 400 });
  }
  if (message && message.length > 4000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  try {
    await ensureSchema();
    const record = await db.formationInterest.create({
      data: {
        fullName,
        email,
        org,
        role,
        message,
      },
      select: { id: true, createdAt: true },
    });

    // Notify the operator in real time via the notification mini-service
    // (port 3003). Fire-and-forget — a failed notification must never block
    // the public submission.
    try {
      await fetch("http://localhost:3003/emit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "submission:new",
          payload: {
            id: record.id,
            fullName,
            role,
            org,
            createdAt: record.createdAt.toISOString(),
          },
        }),
        // Don't let this hang the response.
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      /* notification service unavailable — submission still succeeds */
    }

    return NextResponse.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("formation-interest create failed", err);
    return NextResponse.json(
      { error: "Could not record your submission. Please try again." },
      { status: 500 }
    );
  }
}
