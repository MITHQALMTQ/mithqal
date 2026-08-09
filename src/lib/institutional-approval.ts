/**
 * MITHQAL — Institutional Approval / Multisignature Abstraction
 *
 * Per §14: Prepare the architecture for institutional multisignature authorization.
 * Target: 3-of-5 institutional approval.
 *
 * Roles (not individuals):
 *   - Treasury Authority
 *   - Risk Authority
 *   - Constitutional Authority
 *   - Operations Authority
 *   - Independent Oversight Authority
 *
 * The final signatories are determined during institutional formation.
 * Do NOT hard-code individuals.
 *
 * Per §28: Every execution request must be idempotent. Replay protection.
 *
 * Phase 7 of the institutional execution architecture implementation.
 * Status: SIMULATED — auto-approves in SIMULATION mode.
 */

import type { ApprovalRole } from "./execution-engine";

// ============================================================
// Types
// ============================================================

export interface InstitutionalSigner {
  role: ApprovalRole;
  signerId: string;       // institutional identifier (not a personal name)
  publicKey: string;      // cryptographic public key (simulated)
  active: boolean;
  activatedAt: string;
}

export interface ApprovalRequest {
  requestId: string;
  proposalId: string;
  requiredApprovals: number;  // 3-of-5
  approvalsReceived: number;
  approvals: Array<{
    role: ApprovalRole;
    signerId: string;
    approved: boolean;
    timestamp: string;
    signature: string;
    reason?: string;
  }>;
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  expiresAt: string;
}

// ============================================================
// Constants
// ============================================================

const REQUIRED_APPROVALS = 3;  // 3-of-5
const TOTAL_ROLES = 5;
const APPROVAL_TIMEOUT_HOURS = 48;  // approvals expire after 48h

const ALL_ROLES: ApprovalRole[] = [
  "treasury_authority",
  "risk_authority",
  "constitutional_authority",
  "operations_authority",
  "independent_oversight",
];

// ============================================================
// Institutional Signer Registry (SIMULATED)
// ============================================================

let signerRegistry: Map<ApprovalRole, InstitutionalSigner> = new Map();

/**
 * Initialize simulated institutional signers.
 * In production: real signers are registered during institutional formation.
 */
export function initializeSimulatedSigners(): void {
  if (signerRegistry.size === 0) {
    const now = new Date().toISOString();
    for (const role of ALL_ROLES) {
      signerRegistry.set(role, {
        role,
        signerId: `sim-signer-${role}`,
        publicKey: `sim-pubkey-${role}-${Date.now()}`,
        active: true,
        activatedAt: now,
      });
    }
  }
}

/**
 * Get all registered signers.
 */
export function getSigners(): InstitutionalSigner[] {
  initializeSimulatedSigners();
  return Array.from(signerRegistry.values());
}

/**
 * Get a signer by role.
 */
export function getSignerByRole(role: ApprovalRole): InstitutionalSigner | null {
  initializeSimulatedSigners();
  return signerRegistry.get(role) ?? null;
}

// ============================================================
// Approval Request Management
// ============================================================

const approvalRequests = new Map<string, ApprovalRequest>();

/**
 * Create an approval request for a proposal.
 */
export function createApprovalRequest(proposalId: string): ApprovalRequest {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + APPROVAL_TIMEOUT_HOURS * 3600_000);

  const request: ApprovalRequest = {
    requestId: `appr-${proposalId}-${Date.now()}`,
    proposalId,
    requiredApprovals: REQUIRED_APPROVALS,
    approvalsReceived: 0,
    approvals: [],
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  approvalRequests.set(request.requestId, request);
  return request;
}

/**
 * Submit an approval signature.
 * Per §28: idempotent — duplicate submissions from the same role are ignored.
 */
export function submitApproval(
  requestId: string,
  role: ApprovalRole,
  approved: boolean,
  reason?: string
): ApprovalRequest {
  const request = approvalRequests.get(requestId);
  if (!request) throw new Error(`Approval request ${requestId} not found`);
  if (request.status !== "pending") throw new Error(`Approval request ${requestId} is ${request.status}`);

  // Check expiry
  if (new Date() > new Date(request.expiresAt)) {
    request.status = "expired";
    approvalRequests.set(requestId, request);
    throw new Error(`Approval request ${requestId} has expired`);
  }

  // Idempotency: check if this role already submitted
  const existing = request.approvals.find((a) => a.role === role);
  if (existing) {
    // Already submitted — return without change (idempotent)
    return request;
  }

  const signer = getSignerByRole(role);
  if (!signer || !signer.active) {
    throw new Error(`No active signer for role ${role}`);
  }

  request.approvals.push({
    role,
    signerId: signer.signerId,
    approved,
    timestamp: new Date().toISOString(),
    signature: `sim-sig-${role}-${request.proposalId}-${Date.now()}`,
    reason,
  });

  if (approved) {
    request.approvalsReceived++;
  }

  // Check if threshold reached
  if (request.approvalsReceived >= REQUIRED_APPROVALS) {
    request.status = "approved";
  } else {
    // Check if rejection is definitive (more than TOTAL_ROLES - REQUIRED_APPROVALS rejections)
    const rejections = request.approvals.filter((a) => !a.approved).length;
    if (rejections > TOTAL_ROLES - REQUIRED_APPROVALS) {
      request.status = "rejected";
    }
  }

  approvalRequests.set(requestId, request);
  return request;
}

/**
 * Get an approval request.
 */
export function getApprovalRequest(requestId: string): ApprovalRequest | null {
  return approvalRequests.get(requestId) ?? null;
}

/**
 * Get all approval requests.
 */
export function getAllApprovalRequests(): ApprovalRequest[] {
  return Array.from(approvalRequests.values());
}

/**
 * Check if a proposal has been approved.
 */
export function isProposalApproved(proposalId: string): boolean {
  for (const request of approvalRequests.values()) {
    if (request.proposalId === proposalId && request.status === "approved") {
      return true;
    }
  }
  return false;
}

/**
 * Get the required approval threshold (3-of-5).
 */
export function getApprovalThreshold(): { required: number; total: number } {
  return { required: REQUIRED_APPROVALS, total: TOTAL_ROLES };
}
