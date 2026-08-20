"use client";

/* ============================================================
 * MITHQAL §V25.2 — Institutional Intake Form
 * ------------------------------------------------------------
 * 5-step intake form for institutional engagement inquiries.
 *
 * CRITICAL (§11): This form does NOT submit to any backend.
 * There is no database write, no API call, no SMTP. On a valid
 * submit the component prepares a NON-SENSITIVE inquiry summary
 * and composes a `mailto:` link addressed to INSTITUTIONAL_EMAIL.
 * The user is the only one who sends the email — by clicking the
 * "Open Email" button which fires `window.location.href = mailto:…`.
 *
 * Design system:
 *   • `.glass-card` for the panel surface (see globals.css).
 *   • Gold / emerald / amber accents only — no indigo/blue.
 *   • Inputs match the conventions used by faq.tsx / admin.tsx:
 *     `bg-ink border-line focus:border-gold/60 focus:ring-gold/20`.
 *
 * Accessibility:
 *   • Proper <label> + htmlFor association.
 *   • `aria-invalid` + `aria-describedby` on errored fields.
 *   • Step region is `aria-labelledby`, nav buttons are real
 *     <button type="button">, and Enter submits the current step.
 * ============================================================ */

import { useState, useMemo, useCallback, useId, type ReactNode } from "react";
import {
  INSTITUTION_TYPES,
  ENGAGEMENT_TYPES,
  TECH_CAPABILITIES,
  INSTITUTIONAL_EMAIL,
  SECURITY_NOTICE,
  DISCLAIMER,
  type InstitutionType,
  type EngagementType,
} from "@/lib/institutional/types";

/* ── Defensive helpers (S/N/Arr convention from page.tsx) ──
 * Even though our internal state is strictly typed, these guard
 * against any malformed/SSR-hydrated values and keep field rendering
 * null-safe. `N` is included for parity with the codebase convention
 * (numbers fall back to 0) though the form does not collect numerics. */
const S = (v: unknown): string => (typeof v === "string" ? v : "");
const N = (v: unknown): number =>
  typeof v === "number" && !Number.isNaN(v) ? v : 0;
function Arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
// `N` is exported for convention parity but intentionally unused by the
// form — kept here so future numeric fields inherit the same guard.
void N;

/* ── Constants ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = [
  { id: 1, key: "organization", label: "Organization" },
  { id: 2, key: "contact", label: "Contact" },
  { id: 3, key: "engagement", label: "Engagement" },
  { id: 4, key: "evaluation", label: "Evaluation" },
  { id: 5, key: "authorization", label: "Authorization" },
] as const;

const PREFERRED_CONTACT_OPTIONS = ["Email", "Phone"] as const;
const SANDBOX_OPTIONS = ["Yes", "No", "Unknown"] as const;

/* ── Form data model ──
 * Mirrors InstitutionalInquiry from types.ts but uses empty-string
 * defaults for the controlled inputs (controlled inputs must not
 * transition between undefined and string — that throws React
 * warnings). */
interface FormData {
  // Step 1 — Organization
  organizationName: string;
  institutionType: InstitutionType | "";
  country: string;
  website: string;
  regulator: string;
  regulatoryStatus: string;
  // Step 2 — Contact
  contactName: string;
  jobTitle: string;
  email: string;
  phone: string;
  preferredContact: string;
  // Step 3 — Engagement
  engagementTypes: EngagementType[];
  proposedCorridors: string;
  localCurrencies: string;
  sandboxAvailable: string;
  technicalCapabilities: string[];
  timeline: string;
  // Step 4 — Evaluation
  evaluationRequest: string;
  regulatoryQuestions: string;
  technicalQuestions: string;
  additionalNotes: string;
  // Step 5 — Authorization
  authorized: boolean;
  understandsDisclaimer: boolean;
}

const INITIAL_DATA: FormData = {
  organizationName: "",
  institutionType: "",
  country: "",
  website: "",
  regulator: "",
  regulatoryStatus: "",
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  preferredContact: "Email",
  engagementTypes: [],
  proposedCorridors: "",
  localCurrencies: "",
  sandboxAvailable: "Unknown",
  technicalCapabilities: [],
  timeline: "",
  evaluationRequest: "",
  regulatoryQuestions: "",
  technicalQuestions: "",
  additionalNotes: "",
  authorized: false,
  understandsDisclaimer: false,
};

type FieldErrors = Partial<Record<keyof FormData, string>>;

/* ── Shared styling tokens ── */
const INPUT_CLASS =
  "w-full rounded-md border border-line bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-fg-muted/50 focus:border-gold/60 focus:ring-2 focus:ring-gold/20";
const INPUT_ERROR_CLASS =
  "w-full rounded-md border border-destructive bg-ink px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-fg-muted/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20";
const LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-wider text-fg-muted mb-1.5";
const HELP_CLASS = "mt-1 text-[11px] text-fg-muted/80";

/* ── Small reusable field primitives ── */

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={LABEL_CLASS}>
      {children}
      {required ? (
        <span className="ml-1 text-gold" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1 text-[11px] font-medium text-destructive"
    >
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  );
}

/* ============================================================
 * Validation — per-step. Returns a map of field -> message.
 * Empty map = step is valid.
 * ============================================================ */
function validateStep(step: number, data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    if (!S(data.organizationName).trim())
      errors.organizationName = "Organization name is required.";
    if (!data.institutionType)
      errors.institutionType = "Please select an institution type.";
    if (!S(data.country).trim())
      errors.country = "Country / jurisdiction is required.";
  }
  if (step === 2) {
    if (!S(data.contactName).trim())
      errors.contactName = "Full name is required.";
    if (!S(data.jobTitle).trim())
      errors.jobTitle = "Job title is required.";
    if (!S(data.email).trim()) {
      errors.email = "Institutional email is required.";
    } else if (!EMAIL_RE.test(S(data.email).trim())) {
      errors.email = "Please enter a valid email address.";
    }
  }
  if (step === 3) {
    if (Arr<EngagementType>(data.engagementTypes).length === 0)
      errors.engagementTypes =
        "Select at least one engagement type to continue.";
  }
  if (step === 5) {
    if (!data.authorized)
      errors.authorized =
        "You must confirm you are authorized to submit this inquiry.";
    if (!data.understandsDisclaimer)
      errors.understandsDisclaimer =
        "You must acknowledge the disclaimer to continue.";
  }
  return errors;
}

/* ============================================================
 * Mailto builder — NON-SENSITIVE summary only.
 * ============================================================ */
function buildMailtoSubject(data: FormData): string {
  const org = S(data.organizationName).trim() || "(Organization)";
  const jur = S(data.country).trim() || "(Jurisdiction)";
  return `MITHQAL Institutional Engagement — ${org} — ${jur}`;
}

function buildMailtoBody(data: FormData): string {
  const institutionLabel =
    INSTITUTION_TYPES.find((t) => t.value === data.institutionType)?.label ??
    (S(data.institutionType) || "(not selected)");

  const engagementLabels = Arr<EngagementType>(data.engagementTypes)
    .map((t) => ENGAGEMENT_TYPES.find((e) => e.type === t)?.title ?? t)
    .join(", ");

  const techCaps = Arr<string>(data.technicalCapabilities).join(", ");

  /* Push only non-empty lines so the email reads cleanly. */
  const lines: string[] = [];
  lines.push("MITHQAL — INSTITUTIONAL ENGAGEMENT INQUIRY");
  lines.push("============================================");
  lines.push("");
  lines.push("This message was prepared by the MITHQAL intake");
  lines.push("form. It contains only non-sensitive institutional");
  lines.push("information. Do NOT include passwords, private keys,");
  lines.push("seed phrases, customer credentials, production banking");
  lines.push("credentials, or any other secrets in any reply.");
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push("§1 — ORGANIZATION");
  lines.push("--------------------------------------------");
  lines.push(`Organization Name     : ${S(data.organizationName).trim() || "—"}`);
  lines.push(`Institution Type      : ${institutionLabel}`);
  lines.push(`Country / Jurisdiction: ${S(data.country).trim() || "—"}`);
  if (S(data.website).trim())
    lines.push(`Website               : ${S(data.website).trim()}`);
  if (S(data.regulator).trim())
    lines.push(`Regulator / Authority : ${S(data.regulator).trim()}`);
  if (S(data.regulatoryStatus).trim())
    lines.push(`Regulatory Status     : ${S(data.regulatoryStatus).trim()}`);
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push("§2 — CONTACT");
  lines.push("--------------------------------------------");
  lines.push(`Full Name             : ${S(data.contactName).trim() || "—"}`);
  lines.push(`Job Title             : ${S(data.jobTitle).trim() || "—"}`);
  lines.push(`Institutional Email   : ${S(data.email).trim() || "—"}`);
  if (S(data.phone).trim())
    lines.push(`Phone                 : ${S(data.phone).trim()}`);
  if (S(data.preferredContact).trim())
    lines.push(`Preferred Contact     : ${S(data.preferredContact).trim()}`);
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push("§3 — ENGAGEMENT");
  lines.push("--------------------------------------------");
  lines.push(`Engagement Type(s)    : ${engagementLabels || "(none selected)"}`);
  if (S(data.proposedCorridors).trim())
    lines.push(`Proposed Corridor(s)  : ${S(data.proposedCorridors).trim()}`);
  if (S(data.localCurrencies).trim())
    lines.push(`Local Currency(ies)   : ${S(data.localCurrencies).trim()}`);
  lines.push(`Sandbox Available     : ${S(data.sandboxAvailable) || "Unknown"}`);
  if (techCaps) lines.push(`Tech Capabilities     : ${techCaps}`);
  if (S(data.timeline).trim())
    lines.push(`Approximate Timeline  : ${S(data.timeline).trim()}`);
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push("§4 — EVALUATION");
  lines.push("--------------------------------------------");
  lines.push("What would you like MITHQAL to evaluate?");
  lines.push(S(data.evaluationRequest).trim() || "—");
  lines.push("");
  lines.push("Regulatory / Legal Questions:");
  lines.push(S(data.regulatoryQuestions).trim() || "—");
  lines.push("");
  lines.push("Technical / Integration Questions:");
  lines.push(S(data.technicalQuestions).trim() || "—");
  lines.push("");
  lines.push("Additional Notes:");
  lines.push(S(data.additionalNotes).trim() || "—");
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push("§5 — AUTHORIZATION");
  lines.push("--------------------------------------------");
  lines.push(
    `Authorized to submit on behalf of organization: ${
      data.authorized ? "YES" : "NO"
    }`
  );
  lines.push(
    `Understands this is an expression of interest, not an approval: ${
      data.understandsDisclaimer ? "YES" : "NO"
    }`
  );
  lines.push("");
  lines.push("--------------------------------------------");
  lines.push(DISCLAIMER);
  lines.push("--------------------------------------------");

  return lines.join("\n");
}

function buildMailtoHref(data: FormData): string {
  const subject = buildMailtoSubject(data);
  const body = buildMailtoBody(data);
  return `mailto:${INSTITUTIONAL_EMAIL}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

/* ============================================================
 * Main component
 * ============================================================ */
export function InstitutionalIntakeForm() {
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const uid = useId();

  /* ── Field setters ── */
  const setField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
      // Re-validate the current step on every change so error messages
      // clear the moment the field becomes valid.
      setErrors((prev) => {
        const next = validateStep(step, { ...data, [key]: value });
        // Preserve errors from other steps so they show on revisit.
        return { ...prev, ...next, [key]: next[key] };
      });
    },
    [step, data]
  );

  const toggleEngagement = useCallback(
    (t: EngagementType) => {
      const current = Arr<EngagementType>(data.engagementTypes);
      const next = current.includes(t)
        ? current.filter((x) => x !== t)
        : [...current, t];
      setField("engagementTypes", next);
    },
    [data.engagementTypes, setField]
  );

  const toggleTechCapability = useCallback(
    (c: string) => {
      const current = Arr<string>(data.technicalCapabilities);
      const next = current.includes(c)
        ? current.filter((x) => x !== c)
        : [...current, c];
      setField("technicalCapabilities", next);
    },
    [data.technicalCapabilities, setField]
  );

  /* ── Navigation ── */
  const goNext = useCallback(() => {
    const stepErrors = validateStep(step, data);
    // Merge just this step's errors into the running map.
    setErrors((prev) => ({ ...prev, ...stepErrors }));
    if (Object.keys(stepErrors).length > 0) {
      // Focus the first errored field for accessibility. The input ids
      // follow the `${uid}-${fieldName}` convention (see each step
      // component below); for the multi-select groups (engagementTypes)
      // there is no single input id, so the focus is a graceful no-op.
      const firstErr = Object.keys(stepErrors)[0];
      const el = document.getElementById(`${uid}-${firstErr}`);
      el?.focus();
      return;
    }
    if (step < 5) {
      setStep(step + 1);
      // Scroll to top of the form panel for orientation.
      window.requestAnimationFrame(() => {
        document
          .getElementById(`${uid}-panel`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [step, data, uid]);

  const goPrev = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
      window.requestAnimationFrame(() => {
        document
          .getElementById(`${uid}-panel`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [step, uid]);

  const handleSubmit = useCallback(() => {
    // Validate every step before showing the confirmation screen.
    const allErrors: FieldErrors = {};
    for (let s = 1; s <= 5; s++) {
      Object.assign(allErrors, validateStep(s, data));
    }
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      // Jump to the first step that has an error.
      const firstBadStep = (() => {
        if (
          allErrors.organizationName ||
          allErrors.institutionType ||
          allErrors.country
        )
          return 1;
        if (
          allErrors.contactName ||
          allErrors.jobTitle ||
          allErrors.email
        )
          return 2;
        if (allErrors.engagementTypes) return 3;
        if (allErrors.authorized || allErrors.understandsDisclaimer) return 5;
        return step;
      })();
      setStep(firstBadStep);
      return;
    }
    setSubmitted(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`${uid}-panel`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [data, step, uid]);

  const handleOpenEmail = useCallback(() => {
    const href = buildMailtoHref(data);
    // §11: this is the ONLY "submission" path — it opens the user's
    // own email client with the prepared, non-sensitive summary.
    try {
      window.location.href = href;
    } catch {
      // Defensive fallback for hardened browsers.
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }, [data]);

  const handleReset = useCallback(() => {
    setData(INITIAL_DATA);
    setErrors({});
    setSubmitted(false);
    setStep(1);
  }, []);

  const mailtoHref = useMemo(
    () => (submitted ? buildMailtoHref(data) : "#"),
    [submitted, data]
  );
  const mailtoSubject = useMemo(
    () => (submitted ? buildMailtoSubject(data) : ""),
    [submitted, data]
  );

  /* ── Render ── */
  return (
    <div
      id={`${uid}-panel`}
      className="glass-card card-hover relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl p-5 sm:p-8"
      role="region"
      aria-labelledby={`${uid}-title`}
    >
      {/* Decorative gold rule across the top */}
      <div
        className="gold-rule pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        aria-hidden="true"
      />

      <header className="mb-6 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
          MITHQAL · Institutional Engagement
        </p>
        <h2
          id={`${uid}-title`}
          className="font-display text-2xl text-foreground sm:text-3xl"
        >
          Institutional Intake Form
        </h2>
        <p className="text-sm text-fg-muted">
          A controlled, 5-step intake for institutional engagement inquiries.
          No data leaves your device until you choose to send the prepared
          email.
        </p>
      </header>

      {submitted ? (
        <ConfirmationScreen
          email={INSTITUTIONAL_EMAIL}
          subject={mailtoSubject}
          mailtoHref={mailtoHref}
          onOpenEmail={handleOpenEmail}
          onReset={handleReset}
          uid={uid}
        />
      ) : (
        <>
          <StepIndicator
            currentStep={step}
            uid={uid}
            onJump={(target) => {
              /* Allow free backward navigation. Forward navigation
               * requires passing validation, so jumps above the
               * current step are disabled at the button level. */
              if (target < step) {
                setStep(target);
                window.requestAnimationFrame(() => {
                  document
                    .getElementById(`${uid}-panel`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }
            }}
          />
          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 5) {
                goNext();
              } else {
                handleSubmit();
              }
            }}
            noValidate
          >
            {step === 1 && (
              <Step1Organization
                data={data}
                errors={errors}
                setField={setField}
                uid={uid}
              />
            )}
            {step === 2 && (
              <Step2Contact
                data={data}
                errors={errors}
                setField={setField}
                uid={uid}
              />
            )}
            {step === 3 && (
              <Step3Engagement
                data={data}
                errors={errors}
                setField={setField}
                toggleEngagement={toggleEngagement}
                toggleTechCapability={toggleTechCapability}
                uid={uid}
              />
            )}
            {step === 4 && (
              <Step4Evaluation
                data={data}
                setField={setField}
                uid={uid}
              />
            )}
            {step === 5 && (
              <Step5Authorization
                data={data}
                errors={errors}
                setField={setField}
                uid={uid}
              />
            )}

            <NavButtons
              step={step}
              onPrev={goPrev}
              onNext={goNext}
              onSubmit={handleSubmit}
              uid={uid}
            />
          </form>
        </>
      )}
    </div>
  );
}

/* ============================================================
 * Step Indicator — accessible progress with 5 segments
 * ============================================================ */
function StepIndicator({
  currentStep,
  uid,
  onJump,
}: {
  currentStep: number;
  uid: string;
  onJump: (target: number) => void;
}) {
  return (
    <nav aria-label="Form progress">
      <ol
        className="flex items-center gap-1.5 sm:gap-2"
        role="list"
      >
        {STEPS.map((s) => {
          const isDone = currentStep > s.id;
          const isCurrent = currentStep === s.id;
          const canJump = s.id < currentStep;
          return (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => canJump && onJump(s.id)}
                disabled={!canJump}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${s.id} of 5: ${s.label}${
                  isCurrent ? " (current)" : isDone ? " (done)" : ""
                }`}
                className={`group flex w-full flex-col items-start gap-1.5 rounded-lg border px-2.5 py-2 text-left transition ${
                  isCurrent
                    ? "border-gold/60 bg-gold/10 glow-gold"
                    : isDone
                    ? "border-reserve/40 bg-reserve/5 hover:border-reserve/60"
                    : "border-line bg-ink/40 opacity-60"
                } disabled:cursor-not-allowed disabled:opacity-50`}
                tabIndex={canJump ? 0 : -1}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-gold text-ink"
                        : isDone
                        ? "bg-reserve text-ink"
                        : "bg-ink-card text-fg-muted"
                    }`}
                    aria-hidden="true"
                  >
                    {isDone ? "✓" : s.id}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                    Step {s.id}
                  </span>
                </span>
                <span
                  className={`text-xs font-medium ${
                    isCurrent ? "text-gold" : "text-foreground/80"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p
        id={`${uid}-progress-text`}
        className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted"
        aria-live="polite"
      >
        Step {currentStep} of 5 — {STEPS[currentStep - 1].label}
      </p>
    </nav>
  );
}

/* ============================================================
 * STEP 1 — Organization
 * ============================================================ */
function Step1Organization({
  data,
  errors,
  setField,
  uid,
}: {
  data: FormData;
  errors: FieldErrors;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  uid: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Organization Information
      </legend>

      <div>
        <FieldLabel htmlFor={`${uid}-organizationName`} required>
          Organization Name
        </FieldLabel>
        <input
          id={`${uid}-organizationName`}
          type="text"
          value={data.organizationName}
          onChange={(e) => setField("organizationName", e.target.value)}
          placeholder="e.g. Bank of Example"
          aria-required="true"
          aria-invalid={!!errors.organizationName}
          aria-describedby={
            errors.organizationName ? `${uid}-err-organizationName` : undefined
          }
          className={errors.organizationName ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
        <FieldError
          id={`${uid}-err-organizationName`}
          message={errors.organizationName}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-institutionType`} required>
          Institution Type
        </FieldLabel>
        <select
          id={`${uid}-institutionType`}
          value={data.institutionType}
          onChange={(e) =>
            setField(
              "institutionType",
              (e.target.value || "") as InstitutionType | ""
            )
          }
          aria-required="true"
          aria-invalid={!!errors.institutionType}
          aria-describedby={
            errors.institutionType ? `${uid}-err-institutionType` : undefined
          }
          className={
            errors.institutionType
              ? INPUT_ERROR_CLASS + " pr-8"
              : INPUT_CLASS + " pr-8"
          }
        >
          <option value="">Select an institution type…</option>
          {INSTITUTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <FieldError
          id={`${uid}-err-institutionType`}
          message={errors.institutionType}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-country`} required>
          Country / Jurisdiction
        </FieldLabel>
        <input
          id={`${uid}-country`}
          type="text"
          value={data.country}
          onChange={(e) => setField("country", e.target.value)}
          placeholder="e.g. United Arab Emirates"
          aria-required="true"
          aria-invalid={!!errors.country}
          aria-describedby={
            errors.country ? `${uid}-err-country` : undefined
          }
          className={errors.country ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
        <FieldError id={`${uid}-err-country`} message={errors.country} />
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-website`}>Website</FieldLabel>
        <input
          id={`${uid}-website`}
          type="url"
          value={data.website}
          onChange={(e) => setField("website", e.target.value)}
          placeholder="https://"
          className={INPUT_CLASS}
        />
        <p className={HELP_CLASS}>Optional.</p>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-regulator`}>
          Regulator / Supervisory Authority
        </FieldLabel>
        <input
          id={`${uid}-regulator`}
          type="text"
          value={data.regulator}
          onChange={(e) => setField("regulator", e.target.value)}
          placeholder="e.g. Central Bank of the UAE"
          className={INPUT_CLASS}
        />
        <p className={HELP_CLASS}>Optional.</p>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-regulatoryStatus`}>
          Regulatory Status / License Description
        </FieldLabel>
        <textarea
          id={`${uid}-regulatoryStatus`}
          value={data.regulatoryStatus}
          onChange={(e) => setField("regulatoryStatus", e.target.value)}
          rows={3}
          placeholder="Brief, non-sensitive description (e.g. 'Licensed as a Category 1 bank under [Law]')."
          className={INPUT_CLASS + " resize-y"}
        />
        <p className={HELP_CLASS}>
          Optional. Do NOT include license numbers, account numbers or any
          confidential identifiers.
        </p>
      </div>
    </fieldset>
  );
}

/* ============================================================
 * STEP 2 — Contact
 * ============================================================ */
function Step2Contact({
  data,
  errors,
  setField,
  uid,
}: {
  data: FormData;
  errors: FieldErrors;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  uid: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Contact Information
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-contactName`} required>
            Full Name
          </FieldLabel>
          <input
            id={`${uid}-contactName`}
            type="text"
            value={data.contactName}
            onChange={(e) => setField("contactName", e.target.value)}
            placeholder="Full name"
            aria-required="true"
            aria-invalid={!!errors.contactName}
            aria-describedby={
              errors.contactName ? `${uid}-err-contactName` : undefined
            }
            className={errors.contactName ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError
            id={`${uid}-err-contactName`}
            message={errors.contactName}
          />
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-jobTitle`} required>
            Job Title
          </FieldLabel>
          <input
            id={`${uid}-jobTitle`}
            type="text"
            value={data.jobTitle}
            onChange={(e) => setField("jobTitle", e.target.value)}
            placeholder="e.g. Head of Treasury"
            aria-required="true"
            aria-invalid={!!errors.jobTitle}
            aria-describedby={
              errors.jobTitle ? `${uid}-err-jobTitle` : undefined
            }
            className={errors.jobTitle ? INPUT_ERROR_CLASS : INPUT_CLASS}
          />
          <FieldError id={`${uid}-err-jobTitle`} message={errors.jobTitle} />
        </div>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-email`} required>
          Institutional Email
        </FieldLabel>
        <input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          value={data.email}
          onChange={(e) => setField("email", e.target.value)}
          placeholder="name@institution.example"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? `${uid}-err-email` : undefined}
          className={errors.email ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
        <FieldError id={`${uid}-err-email`} message={errors.email} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-phone`}>Phone</FieldLabel>
          <input
            id={`${uid}-phone`}
            type="tel"
            autoComplete="tel"
            value={data.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="Optional"
            className={INPUT_CLASS}
          />
          <p className={HELP_CLASS}>Optional.</p>
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-preferredContact`}>
            Preferred Contact Method
          </FieldLabel>
          <select
            id={`${uid}-preferredContact`}
            value={data.preferredContact}
            onChange={(e) => setField("preferredContact", e.target.value)}
            className={INPUT_CLASS + " pr-8"}
          >
            {PREFERRED_CONTACT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <p className={HELP_CLASS}>Optional.</p>
        </div>
      </div>
    </fieldset>
  );
}

/* ============================================================
 * STEP 3 — Engagement
 * ============================================================ */
function Step3Engagement({
  data,
  errors,
  setField,
  toggleEngagement,
  toggleTechCapability,
  uid,
}: {
  data: FormData;
  errors: FieldErrors;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  toggleEngagement: (t: EngagementType) => void;
  toggleTechCapability: (c: string) => void;
  uid: string;
}) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Engagement Details
      </legend>

      {/* Engagement types — multi-select checkboxes */}
      <fieldset className="space-y-2">
        <legend className={LABEL_CLASS}>
          Engagement Type(s)
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        </legend>
        <p className={HELP_CLASS}>
          Select all that apply. At least one is required to continue.
        </p>
        <div
          role="group"
          aria-label="Engagement types"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          id={`${uid}-err-engagementTypes-anchor`}
        >
          {ENGAGEMENT_TYPES.map((e) => {
            const checked = data.engagementTypes.includes(e.type);
            return (
              <label
                key={e.type}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  checked
                    ? "border-gold/60 bg-gold/10"
                    : "border-line bg-ink/40 hover:border-gold/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleEngagement(e.type)}
                  className="mt-0.5 h-4 w-4 accent-[color:var(--gold)]"
                  aria-label={e.title}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-foreground">
                    {e.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-fg-muted">
                    {e.purpose}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <FieldError
          id={`${uid}-err-engagementTypes`}
          message={errors.engagementTypes}
        />
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-proposedCorridors`}>
            Proposed Corridor(s)
          </FieldLabel>
          <input
            id={`${uid}-proposedCorridors`}
            type="text"
            value={data.proposedCorridors}
            onChange={(e) => setField("proposedCorridors", e.target.value)}
            placeholder="e.g. UAE → KSA"
            className={INPUT_CLASS}
          />
          <p className={HELP_CLASS}>Optional.</p>
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-localCurrencies`}>
            Local Currency / Currencies
          </FieldLabel>
          <input
            id={`${uid}-localCurrencies`}
            type="text"
            value={data.localCurrencies}
            onChange={(e) => setField("localCurrencies", e.target.value)}
            placeholder="e.g. AED, SAR"
            className={INPUT_CLASS}
          />
          <p className={HELP_CLASS}>Optional.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor={`${uid}-sandboxAvailable`}>
            Sandbox Available?
          </FieldLabel>
          <select
            id={`${uid}-sandboxAvailable`}
            value={data.sandboxAvailable}
            onChange={(e) => setField("sandboxAvailable", e.target.value)}
            className={INPUT_CLASS + " pr-8"}
          >
            {SANDBOX_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor={`${uid}-timeline`}>
            Approximate Timeline
          </FieldLabel>
          <input
            id={`${uid}-timeline`}
            type="text"
            value={data.timeline}
            onChange={(e) => setField("timeline", e.target.value)}
            placeholder="e.g. Q3 2025"
            className={INPUT_CLASS}
          />
          <p className={HELP_CLASS}>Optional.</p>
        </div>
      </div>

      {/* Technical capabilities — multi-select checkboxes */}
      <fieldset className="space-y-2">
        <legend className={LABEL_CLASS}>
          Technical Integration Capabilities
        </legend>
        <p className={HELP_CLASS}>Select all that apply. Optional.</p>
        <div
          role="group"
          aria-label="Technical integration capabilities"
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {TECH_CAPABILITIES.map((c) => {
            const checked = data.technicalCapabilities.includes(c);
            return (
              <label
                key={c}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition ${
                  checked
                    ? "border-reserve/50 bg-reserve/10 text-foreground"
                    : "border-line bg-ink/40 hover:border-reserve/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTechCapability(c)}
                  className="h-3.5 w-3.5 accent-[color:var(--reserve)]"
                  aria-label={c}
                />
                <span>{c}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </fieldset>
  );
}

/* ============================================================
 * STEP 4 — Evaluation
 * ============================================================ */
function Step4Evaluation({
  data,
  setField,
  uid,
}: {
  data: FormData;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  uid: string;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Evaluation Requests &amp; Questions
      </legend>

      <div>
        <FieldLabel htmlFor={`${uid}-evaluationRequest`}>
          What would you like MITHQAL to evaluate?
        </FieldLabel>
        <textarea
          id={`${uid}-evaluationRequest`}
          value={data.evaluationRequest}
          onChange={(e) => setField("evaluationRequest", e.target.value)}
          rows={4}
          placeholder="Architecture review scope, integration assessment, corridor feasibility, etc."
          className={INPUT_CLASS + " resize-y"}
        />
        <p className={HELP_CLASS}>
          Optional. Keep to non-sensitive institutional information.
        </p>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-regulatoryQuestions`}>
          Regulatory / Legal Questions
        </FieldLabel>
        <textarea
          id={`${uid}-regulatoryQuestions`}
          value={data.regulatoryQuestions}
          onChange={(e) => setField("regulatoryQuestions", e.target.value)}
          rows={3}
          placeholder="Classification, licensing perimeter, liability, governing law…"
          className={INPUT_CLASS + " resize-y"}
        />
        <p className={HELP_CLASS}>Optional.</p>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-technicalQuestions`}>
          Technical / Integration Questions
        </FieldLabel>
        <textarea
          id={`${uid}-technicalQuestions`}
          value={data.technicalQuestions}
          onChange={(e) => setField("technicalQuestions", e.target.value)}
          rows={3}
          placeholder="API, ISO 20022, host-to-host, SFTP, treasury…"
          className={INPUT_CLASS + " resize-y"}
        />
        <p className={HELP_CLASS}>Optional.</p>
      </div>

      <div>
        <FieldLabel htmlFor={`${uid}-additionalNotes`}>
          Additional Notes
        </FieldLabel>
        <textarea
          id={`${uid}-additionalNotes`}
          value={data.additionalNotes}
          onChange={(e) => setField("additionalNotes", e.target.value)}
          rows={3}
          placeholder="Any other non-sensitive context you would like to share."
          className={INPUT_CLASS + " resize-y"}
        />
        <p className={HELP_CLASS}>Optional.</p>
      </div>
    </fieldset>
  );
}

/* ============================================================
 * STEP 5 — Authorization
 * ============================================================ */
function Step5Authorization({
  data,
  errors,
  setField,
  uid,
}: {
  data: FormData;
  errors: FieldErrors;
  setField: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  uid: string;
}) {
  return (
    <fieldset className="space-y-5">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        Authorization &amp; Acknowledgement
      </legend>

      {/* Security notice — prominent */}
      <aside
        role="note"
        className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4"
        aria-labelledby={`${uid}-security-title`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 text-amber-300"
            aria-hidden="true"
          >
            ⚠
          </span>
          <div className="flex-1">
            <p
              id={`${uid}-security-title`}
              className="text-[11px] font-bold uppercase tracking-wider text-amber-300"
            >
              Security Notice
            </p>
            <p className="mt-1 text-xs text-amber-100/90">
              {SECURITY_NOTICE}
            </p>
          </div>
        </div>
      </aside>

      {/* Authorization checkbox 1 */}
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
          data.authorized
            ? "border-gold/60 bg-gold/10"
            : errors.authorized
            ? "border-destructive bg-destructive/5"
            : "border-line bg-ink/40 hover:border-gold/30"
        }`}
      >
        <input
          id={`${uid}-authorized`}
          type="checkbox"
          checked={data.authorized}
          onChange={(e) => setField("authorized", e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[color:var(--gold)]"
          aria-required="true"
          aria-invalid={!!errors.authorized}
          aria-describedby={
            errors.authorized ? `${uid}-err-authorized` : undefined
          }
        />
        <span className="flex-1 text-sm text-foreground">
          I confirm that I am authorized to submit this institutional inquiry
          on behalf of the organization.
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        </span>
      </label>
      <FieldError id={`${uid}-err-authorized`} message={errors.authorized} />

      {/* Authorization checkbox 2 */}
      <label
        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
          data.understandsDisclaimer
            ? "border-gold/60 bg-gold/10"
            : errors.understandsDisclaimer
            ? "border-destructive bg-destructive/5"
            : "border-line bg-ink/40 hover:border-gold/30"
        }`}
      >
        <input
          id={`${uid}-understandsDisclaimer`}
          type="checkbox"
          checked={data.understandsDisclaimer}
          onChange={(e) =>
            setField("understandsDisclaimer", e.target.checked)
          }
          className="mt-0.5 h-4 w-4 accent-[color:var(--gold)]"
          aria-required="true"
          aria-invalid={!!errors.understandsDisclaimer}
          aria-describedby={
            errors.understandsDisclaimer
              ? `${uid}-err-understandsDisclaimer`
              : undefined
          }
        />
        <span className="flex-1 text-sm text-foreground">
          I understand that this submission is an expression of institutional
          interest and does not constitute an approval, partnership, license,
          commitment or institutional validation.
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        </span>
      </label>
      <FieldError
        id={`${uid}-err-understandsDisclaimer`}
        message={errors.understandsDisclaimer}
      />

      <aside
        role="note"
        className="rounded-lg border border-line bg-ink/40 p-3 text-center"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          {DISCLAIMER}
        </p>
      </aside>
    </fieldset>
  );
}

/* ============================================================
 * Navigation buttons
 * ============================================================ */
function NavButtons({
  step,
  onPrev,
  onNext,
  onSubmit,
  uid,
}: {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
  uid: string;
}) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={step === 1}
        className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-ink px-4 text-sm font-medium text-foreground transition hover:border-gold/40 hover:bg-ink-card disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Previous step"
      >
        ← Previous
      </button>

      <div className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted sm:hidden">
        Step {step} of 5
      </div>

      {step < 5 ? (
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-10 items-center justify-center rounded-md bg-gold px-5 text-sm font-semibold text-ink transition hover:bg-gold/90 glow-gold"
        >
          Next →
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex h-10 items-center justify-center rounded-md bg-gold px-5 text-sm font-semibold text-ink transition hover:bg-gold/90 glow-gold"
        >
          Review Inquiry →
        </button>
      )}
    </div>
  );
}

/* ============================================================
 * Confirmation Screen — §11
 * ============================================================ */
function ConfirmationScreen({
  email,
  subject,
  mailtoHref,
  onOpenEmail,
  onReset,
  uid,
}: {
  email: string;
  subject: string;
  mailtoHref: string;
  onOpenEmail: () => void;
  onReset: () => void;
  uid: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-5"
    >
      {/* Success header */}
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-reserve/15 text-reserve"
          aria-hidden="true"
        >
          ✓
        </span>
        <div>
          <h3 className="font-display text-xl text-foreground sm:text-2xl">
            Your institutional inquiry has been prepared.
          </h3>
          <p className="mt-1 text-sm text-fg-muted">
            Nothing has been sent yet. Review the prepared summary below and
            open your email client to send it to{" "}
            <a
              href={`mailto:${email}`}
              className="font-medium text-gold underline-offset-2 hover:underline"
            >
              {email}
            </a>
            .
          </p>
        </div>
      </div>

      {/* Prepared email preview */}
      <div className="rounded-lg border border-line bg-ink/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Prepared subject
        </p>
        <p className="mt-1 break-words font-mono text-xs text-foreground">
          {subject}
        </p>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          Recipient
        </p>
        <p className="mt-1 break-words font-mono text-xs text-foreground">
          {email}
        </p>
      </div>

      {/* Prominent Open Email button */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onOpenEmail}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-gold px-6 text-sm font-bold text-ink transition hover:bg-gold/90 glow-gold-lg"
        >
          <span aria-hidden="true">✉</span>
          Open Email
        </button>
        <a
          href={mailtoHref}
          className="inline-flex h-11 items-center justify-center rounded-md border border-line bg-ink px-5 text-sm font-medium text-foreground transition hover:border-gold/40 hover:bg-ink-card"
          // The mailto link also works as a plain hyperlink for users
          // who prefer right-click → open in mail app.
          aria-label="Open email client (direct link)"
        >
          Open in new tab ↗
        </a>
      </div>

      {/* Prominent security notice */}
      <aside
        role="note"
        className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4"
      >
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-amber-300" aria-hidden="true">
            ⚠
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Security Notice
            </p>
            <p className="mt-1 text-xs text-amber-100/90">{SECURITY_NOTICE}</p>
          </div>
        </div>
      </aside>

      {/* Reset / start over */}
      <div className="flex items-center justify-between border-t border-line pt-4">
        <p className="text-[11px] text-fg-muted">
          No data has been stored. Closing this panel discards the prepared
          inquiry.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-fg-muted underline-offset-2 hover:text-foreground hover:underline"
        >
          Start over
        </button>
      </div>

      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
        {DISCLAIMER}
      </p>
    </div>
  );
}

export default InstitutionalIntakeForm;
