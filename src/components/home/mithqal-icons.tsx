import type { SVGProps } from "react";

/**
 * MITHQAL home — monoline institutional icon set.
 *
 * Thin-line, gold-rendered, monoline icons used by the capability rail
 * and other home-section surfaces. Each icon inherits `currentColor` so
 * the consumer controls color via CSS (the home palette paints them gold).
 *
 * These icons are decorative-only; they are marked aria-hidden by default.
 * Decorative usage: <SettlementIcon className="mithqal-capability-icon" />.
 */

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Settlement Orchestration — stacked layers with transaction pathways
 * representing coordinated settlement workflow layers.
 */
export function SettlementIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3.5" y="4" width="17" height="3.2" rx="0.6" />
      <rect x="3.5" y="10.4" width="17" height="3.2" rx="0.6" />
      <rect x="3.5" y="16.8" width="17" height="3.2" rx="0.6" />
      <path d="M12 7.2v3.2" />
      <path d="M12 13.6v3.2" />
    </svg>
  );
}

/**
 * Policy & Risk Controls — shield outline with internal verification
 * representing deterministic policy and risk enforcement.
 */
export function PolicyIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 3.2 19 6v5c0 3.8-2.9 7.3-7 8.8-4.1-1.5-7-5-7-8.8V6z" />
      <path d="M8.8 11.6 11 13.8 15.4 9.4" />
    </svg>
  );
}

/**
 * Reconciliation & Evidence — document with text lines and a
 * verification checkmark representing audit-ready evidence.
 */
export function EvidenceIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M6.5 3.2h8.2l3.3 3.3v14.3H6.5z" />
      <path d="M14.7 3.2v3.3h3.3" />
      <path d="M9 10.2h6" />
      <path d="M9 13.1h6" />
      <path d="M9 16.5 11 18.5 15 14.5" />
    </svg>
  );
}

/**
 * Multi-Rail Interoperability — four corner nodes connected to a
 * central hub representing coordination across distinct rails.
 */
export function InteroperabilityIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="5.5" cy="5.5" r="2" />
      <circle cx="18.5" cy="5.5" r="2" />
      <circle cx="5.5" cy="18.5" r="2" />
      <circle cx="18.5" cy="18.5" r="2" />
      <circle cx="12" cy="12" r="1.8" />
      <path d="M7.3 7.3 10.6 10.6" />
      <path d="M16.7 7.3 13.4 10.6" />
      <path d="M7.3 16.7 10.6 13.4" />
      <path d="M16.7 16.7 13.4 13.4" />
    </svg>
  );
}

/**
 * Continuity & Replay — a circular cycle with arrowheads representing
 * controlled recovery, replay and operational continuity.
 */
export function ContinuityIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.5 12a7.5 7.5 0 0 1 12.8-5.3" />
      <path d="M17.5 3.5v3.5h-3.5" />
      <path d="M19.5 12a7.5 7.5 0 0 1-12.8 5.3" />
      <path d="M6.5 20.5v-3.5h3.5" />
    </svg>
  );
}
