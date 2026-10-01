// src/lib/evidence-archive.ts
//
// MITHQAL v25.3.22 — NEON S3 EVIDENCE ARCHIVE (CR-2026-027 — Proposal B)
//
// Pairs with the existing Institutional Evidence Fabric
// (src/lib/institutional-evidence-fabric.ts), which produces 15-field portable
// evidence packages in-memory. The fabric's in-memory Map does NOT survive
// process restarts and is NOT shared across serverless function instances —
// this module adds DURABLE STORAGE by archiving each generated package to
// Neon S3 (S3-compatible object storage).
//
// ─── HONEST-STATE NOTE (CRITICAL — DO NOT REMOVE) ─────────────────────────
//   S3 archive is DURABLE STORAGE, not a substitute for institutional
//   validation. Archiving ≠ validation.
//
//   Uploading a 15-field EvidencePackage to S3 proves only that the package
//   was persisted at a given timestamp. It does NOT:
//     - prove the underlying transaction is institutionally authorized
//     - prove the cryptographic commitments have been independently audited
//     - prove the policy version, compliance state, sanctions state, risk
//       result, liquidity decision, backing evidence, legal obligation ID,
//       finality state, authorization, reconciliation result, or exceptions
//       have been verified by any external party
//     - constitute legal, regulatory, accounting, or audit sign-off
//
//   This module is a STORAGE layer. Validation, attestation, and
//   institutional authorization remain the responsibility of the
//   controlled-architecture-frozen Evidence Fabric + its access-gated
//   retrieval API (PUBLIC / INSTITUTIONAL / AUDIT).
// ───────────────────────────────────────────────────────────────────────────
//
// FROZEN SCHEMA BOUNDARY:
//   The EvidencePackage type is FROZEN per `controlled-architecture-freeze.ts`
//   (EVIDENCE_SCHEMA — 15 fields + 3 access levels). This module IMPORTS the
//   type from `institutional-evidence-fabric.ts` and does NOT redefine,
//   extend, or modify it. All 15 fields + access-level semantics are owned
//   by the canonical fabric module.
//
// NOT PRODUCTION-AUTHORIZED:
//   This archive module is implemented for the v25.3.22 sprint and is
//   APPROVED FOR INSTITUTIONAL ENGAGEMENT (operators, auditors,
//   regulators evaluating the MITHQAL evidence architecture). It is NOT
//   authorized for production settlement. Every successful archive()
//   response must be paired with an external validation record before the
//   underlying transaction may be considered final.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import type { EvidencePackage } from "@/lib/institutional-evidence-fabric";

// === Module identity (mirrors the pattern in institutional-evidence-fabric.ts) ===

export const EVIDENCE_ARCHIVE_STATUS: "ACTIVE" | "PENDING_VALIDATION" = "ACTIVE";
export const EVIDENCE_ARCHIVE_VERSION = "v25.3.22-CR-2026-027-1.0";
export const EVIDENCE_ARCHIVE_SOURCE = "src/lib/evidence-archive.ts";

// === Result types ===

export interface ArchiveResult {
  /** S3 object key (e.g., "evidence/<sha256>.json"). Empty string on misconfiguration. */
  s3Key: string;
  /** ISO 8601 timestamp of the successful upload. Empty string on misconfiguration. */
  archivedAt: string;
  /** Present only when the archive call degraded gracefully (S3 not configured). */
  error?: string;
  /** True iff the upload actually succeeded. False on misconfiguration OR
   *  network/S3 errors. Callers MUST inspect `error` for the reason. */
  archived: boolean;
}

// === S3 client configuration ===
//
// Neon S3 is S3-compatible and uses PATH-STYLE addressing
// (https://<endpoint>/<bucket>/<key>), so `forcePathStyle: true` is required.
// The AWS SDK reads AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION
// from the environment by default; AWS_ENDPOINT_URL_S3 overrides the
// default `https://s3.<region>.amazonaws.com` endpoint to point at Neon.

function getS3Config(): {
  endpoint: string;
  region: string;
  bucket: string;
  configured: boolean;
} {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 || "";
  const region = process.env.AWS_REGION || "";
  const bucket = process.env.AWS_S3_BUCKET || "";
  const configured = Boolean(endpoint && region && bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  return { endpoint, region, bucket, configured };
}

let cachedClient: S3Client | null = null;

function getS3Client(): S3Client | null {
  const cfg = getS3Config();
  if (!cfg.configured) return null;
  if (cachedClient) return cachedClient;
  cachedClient = new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: true,
  });
  return cachedClient;
}

// === Key derivation ===
//
// Per CR-2026-027:
//   S3 key = `evidence/{package.commitmentSha256}.json`
//
// The EvidencePackage type's canonical SHA-256 commitment is
// `cryptographicCommitments.fullPackageCommitment` (algorithm: "SHA-256" —
// see institutional-evidence-fabric.ts §15). We use that value as the
// content-addressed key so that two archives of the same package are
// idempotent (same key → same object, no duplication).
//
// If the fullPackageCommitment is somehow missing or empty, we fall back
// to the transactionIdCommitment so the archive still succeeds. This is a
// defensive fallback only — well-formed packages always carry both.

function deriveS3Key(pkg: EvidencePackage): string {
  const commitment =
    pkg.cryptographicCommitments?.fullPackageCommitment ||
    pkg.cryptographicCommitments?.transactionIdCommitment ||
    pkg.transactionId;
  return `evidence/${commitment}.json`;
}

// === Public API ===

/**
 * Archive a 15-field EvidencePackage to Neon S3 as JSON.
 *
 * Idempotent: re-archiving the same package overwrites the same S3 key
 * (content-addressed by fullPackageCommitment).
 *
 * Graceful degradation: if AWS env vars are missing, returns
 * `{ s3Key: "", archivedAt: "", error: "S3 not configured", archived: false }`
 * — never throws. Callers MUST inspect `archived` and `error`.
 */
export async function archiveEvidencePackage(
  pkg: EvidencePackage
): Promise<ArchiveResult> {
  const cfg = getS3Config();
  if (!cfg.configured) {
    return {
      s3Key: "",
      archivedAt: "",
      error: "S3 not configured",
      archived: false,
    };
  }

  const client = getS3Client();
  if (!client) {
    // Defensive — should be unreachable given the cfg check above.
    return {
      s3Key: "",
      archivedAt: "",
      error: "S3 not configured",
      archived: false,
    };
  }

  const s3Key = deriveS3Key(pkg);
  const body = JSON.stringify(pkg, null, 2);
  const archivedAt = new Date().toISOString();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: s3Key,
        Body: body,
        ContentType: "application/json",
        Metadata: {
          "x-mithqal-archive-version": EVIDENCE_ARCHIVE_VERSION,
          "x-mithqal-evidence-transaction-id": pkg.transactionId,
          "x-mithqal-evidence-policy-version": pkg.policyVersion,
          "x-mithqal-evidence-finality-stage": pkg.finalityState?.currentStage || "",
          "x-mithqal-archived-at": archivedAt,
        },
      })
    );
    return { s3Key, archivedAt, archived: true };
  } catch (err) {
    // Network/S3 errors degrade gracefully — callers see `archived: false`.
    const message = err instanceof Error ? err.message : String(err);
    return {
      s3Key: "",
      archivedAt: "",
      error: `S3 archive failed: ${message}`,
      archived: false,
    };
  }
}

/**
 * Retrieve and parse an archived EvidencePackage from S3 by its object key.
 *
 * Returns null on: misconfiguration, missing object, parse error, or
 * network failure. Never throws.
 *
 * NOTE: This returns the FULL unredacted package. Access-level gating
 * (PUBLIC / INSTITUTIONAL / AUDIT) remains the caller's responsibility
 * via `retrieveEvidencePackage(transactionId, accessLevel)` in
 * institutional-evidence-fabric.ts.
 */
export async function retrieveEvidencePackage(
  s3Key: string
): Promise<EvidencePackage | null> {
  const cfg = getS3Config();
  if (!cfg.configured) return null;
  const client = getS3Client();
  if (!client) return null;

  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: cfg.bucket, Key: s3Key })
    );
    if (!response.Body) return null;
    const text = await response.Body.transformToString("utf-8");
    try {
      const parsed = JSON.parse(text) as EvidencePackage;
      return parsed;
    } catch {
      return null;
    }
  } catch {
    // NoSuchKey, network, or other S3 error — degrade to null.
    return null;
  }
}

/**
 * List archived evidence package S3 keys under an optional prefix.
 *
 * Defaults to the `evidence/` prefix used by `archiveEvidencePackage`.
 * Returns an empty array if S3 is not configured or the request fails.
 * Never throws.
 */
export async function listEvidencePackages(
  prefix: string = "evidence/"
): Promise<string[]> {
  const cfg = getS3Config();
  if (!cfg.configured) return [];
  const client = getS3Client();
  if (!client) return [];

  const keys: string[] = [];
  let continuationToken: string | undefined = undefined;

  // Paginate (Neon S3 ListObjectsV2 — 1000 keys/page).
  // Cap at 5 pages (5000 keys) to bound latency on cold lists.
  for (let page = 0; page < 5; page++) {
    try {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
      );
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) keys.push(obj.Key);
        }
      }
      if (!response.IsTruncated) break;
      continuationToken = response.NextContinuationToken;
      if (!continuationToken) break;
    } catch {
      // Network/S3 error — return whatever we have so far.
      break;
    }
  }

  return keys;
}

// === Verification (handy for tests + ops) ===

/**
 * Returns a configuration snapshot for ops dashboards. Never throws, never
 * secrets — only flags + endpoint host (without credentials).
 */
export function getEvidenceArchiveConfigStatus(): {
  configured: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  hasCredentials: boolean;
  version: string;
  status: string;
  source: string;
  honestState: string;
} {
  const cfg = getS3Config();
  return {
    configured: cfg.configured,
    endpoint: cfg.endpoint || "(unset)",
    region: cfg.region || "(unset)",
    bucket: cfg.bucket || "(unset)",
    hasCredentials: Boolean(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ),
    version: EVIDENCE_ARCHIVE_VERSION,
    status: EVIDENCE_ARCHIVE_STATUS,
    source: EVIDENCE_ARCHIVE_SOURCE,
    honestState:
      "S3 archive is DURABLE STORAGE, not a substitute for institutional validation. Archiving ≠ validation.",
  };
}
