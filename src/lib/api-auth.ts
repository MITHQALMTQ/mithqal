/**
 * MITHQAL API request authentication helper (§4.2.1 step 1).
 *
 * Pilot posture: NO authentication is enforced. The MTQ gate (see
 * `src/lib/mtq-gate.ts`) is the hard boundary — `mtqDisabled=true`
 * means every write is downgraded to synthetic regardless of who
 * calls. The auth helper exists so the route handlers have a single
 * seam to harden later, when mTLS + API keys are provisioned against
 * a real bank design partner.
 *
 * Truth state: PERMISSIVE. Returns `{ valid: true, subject: "pilot" }`
 * for every request. When G2 (bank design partner) and G3 (regulatory
 * license) gates pass, this file is updated to enforce mTLS + per-bank
 * API keys against the `institutions` table.
 */

export interface AuthResult {
  valid: boolean;
  subject: string;
  message?: string;
}

export async function authenticateRequest(_request: Request): Promise<AuthResult> {
  // Pilot: every request is permitted — see mtq-gate.ts for the
  // actual write-enforcement boundary.
  return { valid: true, subject: "pilot-operator" };
}
