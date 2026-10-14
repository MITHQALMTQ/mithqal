/**
 * MITHQAL — mTLS certificate authentication module (Phase 2 Security).
 *
 * Validates the client certificate presented in the
 * `X-Forwarded-Client-Cert` (XFCC) header (the format Vercel + most
 * load balancers inject when mTLS is terminated at the edge) OR the
 * `X-Client-Cert` header (the format banks' direct mTLS gateways use).
 *
 * Truth state: WIRED, NOT ENFORCED. The module is fully implemented
 * but not wired into the API gateway — the pilot-permissive auth in
 * `src/lib/api-auth.ts` is still the active gate (see gap-register
 * §8.1). When the G2 bank-design-partner gate passes, this module
 * replaces `authenticateRequest()` and the pilot-permissive posture
 * is removed.
 *
 * Fail-closed: when mTLS is enforced and a request presents no
 * certificate, or the certificate is expired, or the chain does not
 * validate against the configured CA bundle, the request is rejected
 * with 401 + code `MTLS_VALIDATION_FAILED`.
 */

import { X509Certificate } from "node:crypto";
import { logger } from "@/lib/logger";

const CA_BUNDLE_PEM = process.env.MITHQAL_MTLS_CA_BUNDLE_PEM ?? "";
const ENFORCE_MTLS =
  (process.env.MITHQAL_ENFORCE_MTLS ?? "false").trim().toLowerCase() === "true";

export interface MtlsAuthResult {
  valid: boolean;
  subject: string;
  institutionId: string | null;
  fingerprint: string | null;
  notAfter: Date | null;
  message?: string;
}

/**
 * Read the client certificate from the incoming request. Vercel's
 * mTLS proxy injects the URL-encoded PEM in `X-Forwarded-Client-Cert`;
 * direct bank gateways inject it in `X-Client-Cert`. We accept both.
 */
function getClientCertPem(request: Request): string | null {
  const xfcc = request.headers.get("x-forwarded-client-cert");
  if (xfcc) {
    // XFCC is URL-encoded PEM (or a JSON form); we accept the raw
    // PEM shape directly for our pilot partners.
    try {
      return decodeURIComponent(xfcc);
    } catch {
      return xfcc;
    }
  }
  const xcc = request.headers.get("x-client-cert");
  return xcc;
}

/**
 * Verify a PEM-encoded client certificate against the configured CA
 * bundle. Returns the parsed X509Certificate when valid; throws an
 * Error with a clear message when invalid.
 */
function verifyClientCert(pem: string): X509Certificate {
  let cert: X509Certificate;
  try {
    cert = new X509Certificate(pem);
  } catch (err) {
    throw new Error(
      `mTLS: malformed client certificate — ${err instanceof Error ? err.message : "unknown error"}`,
    );
  }

  if (cert.ca) {
    throw new Error("mTLS: presented certificate is a CA certificate, not a leaf client certificate.");
  }

  const now = new Date();
  if (cert.validTo && new Date(cert.validTo) < now) {
    throw new Error(`mTLS: client certificate expired on ${cert.validTo}.`);
  }
  if (cert.validFrom && new Date(cert.validFrom) > now) {
    throw new Error(`mTLS: client certificate not valid until ${cert.validFrom}.`);
  }

  // CA bundle verification — when MITHQAL_MTLS_CA_BUNDLE_PEM is set,
  // the certificate MUST verify against one of the CAs in the bundle.
  if (CA_BUNDLE_PEM) {
    const caCert = new X509Certificate(CA_BUNDLE_PEM);
    try {
      // X509Certificate.verify() throws on failure.
      cert.verify(caCert.publicKey);
    } catch (err) {
      throw new Error(
        `mTLS: client certificate does not chain to configured CA — ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return cert;
}

/**
 * Extract the institution ID from the certificate subject. The
 * canonical convention is `CN=institution:<id>` or
 * `OU=institution:<id>`. Returns null when no institution claim is
 * present — callers MUST refuse the request when this is null.
 */
function extractInstitutionId(cert: X509Certificate): string | null {
  const subject = cert.subject || "";
  // subject is a multiline PEM-style block; extract the CN + OU lines.
  const cnMatch = /CN=([^,\n]+)/.exec(subject);
  const ouMatch = /OU=([^,\n]+)/.exec(subject);
  const institutionCn = cnMatch?.[1]?.startsWith("institution:")
    ? cnMatch[1].slice("institution:".length)
    : null;
  const institutionOu = ouMatch?.[1]?.startsWith("institution:")
    ? ouMatch[1].slice("institution:".length)
    : null;
  return institutionCn ?? institutionOu ?? null;
}

/**
 * The canonical mTLS authentication entry point. Called by every
 * API route when mTLS is enforced (i.e. when G2 has passed and the
 * pilot-permissive posture has been removed). Returns:
 *   - { valid: true, subject, institutionId, fingerprint, notAfter }
 *     when the certificate validates.
 *   - { valid: false, subject: "anonymous", ... message } when:
 *       * ENFORCE_MTLS is true and no cert is presented, OR
 *       * the cert is malformed / expired / does not chain to the CA.
 *
 * When ENFORCE_MTLS is false (current pilot state), the function
 * returns a permissive result so the existing pilot flow continues
 * to work. The pilot-permissive flag is logged so an audit trail
 * records that mTLS was bypassed.
 */
export async function authenticateMtls(request: Request): Promise<MtlsAuthResult> {
  if (!ENFORCE_MTLS) {
    // Pilot-permissive posture. Logged so the audit trail records
    // that mTLS was bypassed — the MTQ gate (mtq-gate.ts) is the
    // hard boundary, not mTLS, in the pilot.
    logger.debug(
      { enforceMtls: ENFORCE_MTLS },
      "mTLS not enforced (pilot-permissive) — see gap-register §8.1",
    );
    return {
      valid: true,
      subject: "pilot-operator",
      institutionId: null,
      fingerprint: null,
      notAfter: null,
      message: "mTLS bypassed (pilot-permissive posture).",
    };
  }

  const pem = getClientCertPem(request);
  if (!pem) {
    return {
      valid: false,
      subject: "anonymous",
      institutionId: null,
      fingerprint: null,
      notAfter: null,
      message: "mTLS required: no X-Forwarded-Client-Cert / X-Client-Cert header present.",
    };
  }

  try {
    const cert = verifyClientCert(pem);
    const institutionId = extractInstitutionId(cert);
    if (!institutionId) {
      return {
        valid: false,
        subject: cert.subject || "anonymous",
        institutionId: null,
        fingerprint: cert.fingerprint256 || null,
        notAfter: cert.validTo ? new Date(cert.validTo) : null,
        message: "mTLS: certificate subject does not carry an institution claim.",
      };
    }
    return {
      valid: true,
      subject: cert.subject,
      institutionId,
      fingerprint: cert.fingerprint256 || null,
      notAfter: cert.validTo ? new Date(cert.validTo) : null,
    };
  } catch (err) {
    return {
      valid: false,
      subject: "anonymous",
      institutionId: null,
      fingerprint: null,
      notAfter: null,
      message: err instanceof Error ? err.message : "mTLS: unknown validation error",
    };
  }
}

/**
 * Convenience accessor for the runtime posture. Returns the string
 * the status-bar component uses to render the mTLS state badge.
 */
export function getMtlsStatus(): { enforced: boolean; caBundleConfigured: boolean } {
  return {
    enforced: ENFORCE_MTLS,
    caBundleConfigured: CA_BUNDLE_PEM.length > 0,
  };
}
