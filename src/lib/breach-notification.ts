/**
 * MITHQAL — Breach notification workflow (Phase 2 Security).
 *
 * Per §8.8 a security incident that compromises personal data
 * (PII) triggers a three-step notification workflow:
 *
 *   T+0    detect     — the incident-severity classifier flags the
 *                         incident as SEV-0 or SEV-1 with a
 *                         CREDENTIAL_LEAK or CUSTODY_SHORTFALL
 *                         category.
 *   T+24h  bank       — notify every affected bank design partner
 *                         via the secure channel (pilot: signed
 *                         email; production: dedicated portal).
 *   T+72h  regulator  — file the regulator notification per the
 *                         jurisdiction's data-breach law (e.g.
 *                         NYDFS 500.17(a), GDPR Art. 33, PIPEDA
 *                         §10.1, UAE PDPL Art. 7).
 *   T+72h  data subject — notify the affected data subjects per
 *                         the same laws. The 72h clock starts at
 *                         T+0 (the detection), NOT at T+24h.
 *
 * Truth state: WIRED, NOT INVOKED. The workflow is implemented but
 * not invoked by any monitoring hook yet. The
 * `breach-notification` Inngest function (under `inngest/functions/`)
 * will be the orchestrator; it is pending the monitoring hook
 * wiring.
 *
 * Fail-closed defaults: when the notification channel (email, portal
 * API) is unavailable, the workflow records the missed deadline in
 * the audit log + escalates to the Constitutional Council. Missed
 * deadlines are NEVER silently swallowed.
 */

import { logger } from "@/lib/logger";
import { classifyIncident, type IncidentCategory } from "@/lib/incident-severity";

export type NotificationStep = "DETECT" | "BANK" | "REGULATOR" | "DATA_SUBJECT";

export interface BreachNotificationPlan {
  incidentId: string;
  category: IncidentCategory;
  detectedAt: string; // ISO-8601
  steps: Array<{
    step: NotificationStep;
    dueAt: string; // ISO-8601
    status: "PENDING" | "SENT" | "FAILED" | "MISSED";
    message?: string;
  }>;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

/**
 * Construct the breach-notification plan for an incident. The plan is
 * returned (NOT executed) so the caller (an Inngest function, an
 * operator dashboard, or a test) can persist it before any external
 * side effect is fired.
 *
 *   T+0    detect     — the moment classifyIncident() returned.
 *   T+24h  bank       — bank partner notification deadline.
 *   T+72h  regulator  — regulator notification deadline.
 *   T+72h  data subject — data subject notification deadline.
 */
export function buildBreachPlan(
  incidentId: string,
  category: IncidentCategory,
  detectedAt: Date = new Date(),
): BreachNotificationPlan {
  const classification = classifyIncident(category);
  const detectedMs = detectedAt.getTime();
  const iso = (ms: number) => new Date(ms).toISOString();

  void classification; // classification is logged by classifyIncident().

  return {
    incidentId,
    category,
    detectedAt: iso(detectedMs),
    steps: [
      {
        step: "DETECT",
        dueAt: iso(detectedMs),
        status: "SENT", // detection is implicit at construction time.
        message: `Incident ${incidentId} detected and classified as ${category}.`,
      },
      {
        step: "BANK",
        dueAt: iso(detectedMs + TWENTY_FOUR_HOURS_MS),
        status: "PENDING",
        message: "Notify every affected bank design partner via the secure channel.",
      },
      {
        step: "REGULATOR",
        dueAt: iso(detectedMs + SEVENTY_TWO_HOURS_MS),
        status: "PENDING",
        message: "File the regulator notification per the affected jurisdictions.",
      },
      {
        step: "DATA_SUBJECT",
        dueAt: iso(detectedMs + SEVENTY_TWO_HOURS_MS),
        status: "PENDING",
        message: "Notify the affected data subjects per the affected jurisdictions.",
      },
    ],
  };
}

export interface NotificationChannelResult {
  step: NotificationStep;
  ok: boolean;
  sentAt: string;
  message?: string;
}

/**
 * Send a single notification step. The pilot uses a no-op channel
 * (the function logs + returns ok=true); production wires this to
 * the secure email gateway (Nodemailer with TLS) for BANK, and to
 * the regulator portal API (per-jurisdiction adapter) for
 * REGULATOR, and to the data-subject portal for DATA_SUBJECT.
 *
 * When the channel fails, the function returns ok=false so the
 * orchestrator can record the missed deadline in the audit log.
 */
export async function sendBreachNotification(opts: {
  step: NotificationStep;
  incidentId: string;
  recipient: string;
  payload: unknown;
}): Promise<NotificationChannelResult> {
  const sentAt = new Date().toISOString();

  // Pilot no-op channel — log + succeed.
  logger.info(
    {
      step: opts.step,
      incidentId: opts.incidentId,
      recipient: opts.recipient,
    },
    "breach-notification/sent (pilot no-op channel).",
  );

  void opts.payload; // payload is logged by the orchestrator, not here.

  return {
    step: opts.step,
    ok: true,
    sentAt,
    message: "Pilot no-op channel — notification logged but not delivered.",
  };
}

/**
 * Check whether any of the plan's PENDING steps are overdue relative
 * to the current time. Returns the list of overdue steps so the
 * orchestrator can escalate. The pilot cron runs every 5 minutes
 * (per the `health-sweep` Inngest function); overdue steps are
 * flagged in the status-bar.
 */
export function findOverdueSteps(plan: BreachNotificationPlan, now: Date = new Date()): NotificationStep[] {
  const nowMs = now.getTime();
  const overdue: NotificationStep[] = [];
  for (const step of plan.steps) {
    if (step.status === "PENDING" && Date.parse(step.dueAt) < nowMs) {
      overdue.push(step.step);
    }
  }
  return overdue;
}

/**
 * Mark a step as SENT (or FAILED). The function returns a new plan
 * object with the updated step status — the original plan is
 * immutable so the audit trail can record every transition.
 */
export function markStep(plan: BreachNotificationPlan, step: NotificationStep, status: "SENT" | "FAILED" | "MISSED", message?: string): BreachNotificationPlan {
  return {
    ...plan,
    steps: plan.steps.map((s) =>
      s.step === step ? { ...s, status, message: message ?? s.message } : s,
    ),
  };
}

/**
 * The two notification deadlines (24h + 72h), exported as constants
 * so the `breach-notification` Inngest function can schedule its
 * steps without re-deriving them.
 */
export const BANK_NOTIFICATION_DEADLINE_MS = TWENTY_FOUR_HOURS_MS;
export const REGULATOR_NOTIFICATION_DEADLINE_MS = SEVENTY_TWO_HOURS_MS;
export const DATA_SUBJECT_NOTIFICATION_DEADLINE_MS = SEVENTY_TWO_HOURS_MS;
