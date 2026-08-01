import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotificationEmail } from "@/lib/email";

/**
 * POST /api/admin/smtp-test — auth-gated SMTP connectivity probe.
 *
 * Sends a small test email to ADMIN_NOTIFY_EMAIL via the configured SMTP
 * transporter (smtp.mail.me.com:587 + STARTTLS in production). Returns a
 * structured result so the Admin console can show a clear "configured /
 * not configured / send failed" status without leaking credentials.
 *
 * Possible outcomes:
 *   { sent: true }                                       — email delivered
 *   { sent: false, configured: false }                   — SMTP env not set
 *   { sent: false, configured: true, error: "<message>" } — provider rejected
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) {
    return NextResponse.json(
      { sent: false, configured: false, error: "ADMIN_NOTIFY_EMAIL is not set" },
      { status: 500 }
    );
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = process.env.SMTP_PORT ?? "587";

  // Detect the "not yet configured" case so the UI can prompt the operator
  // to set SMTP_PASS (App-Specific Password) rather than reporting a hard failure.
  const passIsPlaceholder =
    !pass ||
    pass.startsWith("__") ||
    pass === "your-icloud-app-specific-password" ||
    pass.toLowerCase().includes("set_your") ||
    pass.toLowerCase().includes("app-specific-password");

  if (!host || !user || passIsPlaceholder) {
    return NextResponse.json(
      {
        sent: false,
        configured: false,
        error:
          "SMTP env not fully configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS " +
          "(App-Specific Password for iCloud). See .env.example.",
        host: host ?? null,
        port,
        user: user ?? null,
        passConfigured: !!pass && !passIsPlaceholder,
      },
      { status: 200 }
    );
  }

  const subject = `[Mithqal] SMTP connectivity test — ${new Date().toISOString()}`;
  const text = `This is an automated SMTP connectivity test from the Mithqal Admin console.

If you are reading this, the SMTP transporter (smtp.mail.me.com:587 + STARTTLS) is working end-to-end and Formation Committee submission notifications will be delivered to this inbox.

Operator: ${session.user?.email ?? "unknown"}
Sent at: ${new Date().toISOString()}

— Mithqal Operations`;

  const html = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #e8e6e3; padding: 32px; border: 1px solid #2a2a28;">
  <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #2a2a28;">
    <div style="font-size: 28px; font-weight: 600; color: #c9a227; letter-spacing: 0.05em;">MITHQAL</div>
    <div style="font-size: 11px; color: #8a8680; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px;">SMTP Connectivity Test</div>
  </div>
  <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
    This is an automated SMTP connectivity test from the Mithqal Admin console.
    If you are reading this, the SMTP transporter (smtp.mail.me.com:587 + STARTTLS)
    is working end-to-end and Formation Committee submission notifications will be
    delivered to this inbox.
  </p>
  <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 12px;">
    <tr><td style="padding: 4px 0; color: #8a8680; width: 120px;">Operator</td><td style="color: #e8e6e3;">${session.user?.email ?? "unknown"}</td></tr>
    <tr><td style="padding: 4px 0; color: #8a8680;">Sent at</td><td style="color: #e8e6e3;">${new Date().toISOString()}</td></tr>
  </table>
  <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #2a2a28; font-size: 12px; color: #6a6660;">
    — Mithqal Operations
  </div>
</div>`;

  const result = await sendNotificationEmail({ to, subject, text, html });
  return NextResponse.json(
    {
      sent: result.sent,
      configured: true,
      host,
      port,
      user,
      to,
      error: result.error ?? null,
    },
    { status: result.sent ? 200 : 500 }
  );
}

/**
 * GET /api/admin/smtp-test — returns the current SMTP configuration status
 * WITHOUT sending an email. Used by the Admin console to show a live "SMTP
 * configured / not configured" badge. Credentials are never exposed.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ?? "587";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL;

  const passIsPlaceholder =
    !pass ||
    pass.startsWith("__") ||
    pass === "your-icloud-app-specific-password" ||
    pass.toLowerCase().includes("set_your") ||
    pass.toLowerCase().includes("app-specific-password");

  return NextResponse.json({
    configured: !!host && !!user && !!pass && !passIsPlaceholder,
    host,
    port,
    user,
    notifyEmail,
    passConfigured: !!pass && !passIsPlaceholder,
  });
}
