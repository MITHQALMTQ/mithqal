import nodemailer from "nodemailer";

/**
 * Email notification service.
 *
 * Sends a notification email to the operator (ADMIN_NOTIFY_EMAIL) when a
 * Formation Committee submission is received. Uses SMTP credentials from env
 * if configured; falls back to a console log if not (so the flow never
 * breaks in dev / before SMTP is provisioned).
 *
 * To enable real email delivery, set in .env:
 *   SMTP_HOST=smtp.gmail.com (or your provider)
 *   SMTP_PORT=465
 *   SMTP_USER=...
 *   SMTP_PASS=...
 *   SMTP_FROM="Mithqal <noreply@mithqal.io>"
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export interface NotificationEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendNotificationEmail(
  email: NotificationEmail
): Promise<{ sent: boolean; error?: string }> {
  const t = getTransporter();
  const from = process.env.SMTP_FROM ?? "Mithqal <noreply@mithqal.io>";

  if (!t) {
    // No SMTP configured — log to server console so it's visible in dev
    // logs and Vercel function logs. The flow still succeeds.
    console.log(
      `[email] (SMTP not configured — logging only)\n  To: ${email.to}\n  Subject: ${email.subject}\n  ---\n  ${email.text}\n  ---`
    );
    return { sent: false, error: "SMTP not configured" };
  }

  try {
    await t.sendMail({
      from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Send a Formation Committee submission notification to the operator.
 */
export async function notifyNewSubmission(input: {
  fullName: string;
  email: string;
  org?: string | null;
  role: string;
  message?: string | null;
  submissionId: string;
}): Promise<void> {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return;

  const roleLabel: Record<string, string> = {
    investor: "Investor",
    advisor: "Advisor",
    anchor: "Anchor participant",
    "council-nominee": "Council nominee",
    partner: "Partner",
    other: "Other",
  };

  const subject = `[Mithqal] New ${roleLabel[input.role] ?? "submission"}: ${input.fullName}`;
  const text = `New Formation Committee submission received.

Name: ${input.fullName}
Email: ${input.email}
Organisation: ${input.org || "—"}
Role: ${roleLabel[input.role] ?? input.role}

Message:
${input.message || "—"}

Submission ID: ${input.submissionId}

Review and follow up via the Admin console at https://mithqal.vercel.app/?view=admin

— Mithqal Formation Committee`;

  const html = `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #e8e6e3; padding: 32px; border: 1px solid #2a2a28;">
  <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #2a2a28;">
    <div style="font-size: 28px; font-weight: 600; color: #c9a227; letter-spacing: 0.05em;">MITHQAL</div>
    <div style="font-size: 11px; color: #8a8680; text-transform: uppercase; letter-spacing: 0.2em; margin-top: 4px;">Formation Committee</div>
  </div>
  <h2 style="color: #c9a227; font-size: 18px; margin: 0 0 16px;">New submission received</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 6px 0; color: #8a8680; width: 120px;">Name</td><td style="padding: 6px 0; color: #e8e6e3;">${input.fullName}</td></tr>
    <tr><td style="padding: 6px 0; color: #8a8680;">Email</td><td style="padding: 6px 0;"><a href="mailto:${input.email}" style="color: #c9a227;">${input.email}</a></td></tr>
    <tr><td style="padding: 6px 0; color: #8a8680;">Organisation</td><td style="padding: 6px 0; color: #e8e6e3;">${input.org || "—"}</td></tr>
    <tr><td style="padding: 6px 0; color: #8a8680;">Role</td><td style="padding: 6px 0; color: #e8e6e3;">${roleLabel[input.role] ?? input.role}</td></tr>
  </table>
  ${input.message ? `<div style="margin-top: 20px; padding: 12px 16px; background: #161616; border-left: 3px solid #c9a227; font-size: 13px; color: #b8b4ae;">${input.message}</div>` : ""}
  <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #2a2a28; font-size: 12px; color: #6a6660;">
    Submission ID: ${input.submissionId}<br/>
    <a href="https://mithqal.vercel.app/?view=admin" style="color: #c9a227;">Review in the Admin console →</a>
  </div>
</div>`;

  await sendNotificationEmail({ to, subject, text, html });
}
