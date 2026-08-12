import { NextResponse } from "next/server";
import { computeLiveNav } from "@/lib/nav-compute";

/**
 * GET /api/reserve-verification — Reserve Verification Framework.
 *
 * v23 §Article XVII — Reserve Integrity & Verification.
 *
 * This implements the PROOF SCHEMA and ATTESTATION FRAMEWORK for reserve
 * verification. It defines what evidence is required at each level (0-4)
 * and tracks the current verification status of every reserve line item.
 *
 * Verification Levels (v23 §Article XVII.5):
 *   Level 0 — DECLARED (operator assertion only — current state)
 *   Level 1 — DOCUMENTED (bank statements, vault receipts)
 *   Level 2 — ATTESTED (independent third-party attestation)
 *   Level 3 — AUDITED (Big-4 audit, ISAE 3402 Type II)
 *   Level 4 — REAL-TIME (cryptographic proof, on-chain PoR)
 *
 * Constitutional target: Level 3+ for all reserves.
 * Current runtime state: Level 0 (declared only).
 *
 * This endpoint is FREE — it defines the framework and tracks the gap.
 * Actual verification requires engaging custodians and auditors (paid).
 *
 * POST /api/reserve-verification — submit an attestation
 *   Body: { lineItemId, level, attestorType, evidenceHash, evidenceUrl, signedBy }
 *   Records the attestation (does not auto-promote — requires governance)
 */

// ---- Verification level definitions ----

const VERIFICATION_LEVELS = {
  LEVEL_0_DECLARED: {
    level: 0,
    name: "Declared",
    description: "Operator assertion only — no independent evidence",
    constitutionalStatus: "INSUFFICIENT",
    evidenceRequired: ["Operator signed declaration"],
    reliabilityScore: 0.10,
  },
  LEVEL_1_DOCUMENTED: {
    level: 1,
    name: "Documented",
    description: "Primary documents (bank statements, vault receipts)",
    constitutionalStatus: "MINIMUM",
    evidenceRequired: [
      "Bank statement (current, <30 days old)",
      "Vault receipt (for physical bullion)",
      "Custodian confirmation letter",
    ],
    reliabilityScore: 0.40,
  },
  LEVEL_2_ATTESTED: {
    level: 2,
    name: "Attested",
    description: "Independent third-party attestation",
    constitutionalStatus: "ACCEPTABLE",
    evidenceRequired: [
      "Independent attestation report",
      "Attestor independence declaration",
      "Evidence package (Level 1 + attestation)",
    ],
    reliabilityScore: 0.70,
  },
  LEVEL_3_AUDITED: {
    level: 3,
    name: "Audited",
    description: "Big-4 audit, ISAE 3402 Type II",
    constitutionalStatus: "CONSTITUTIONAL_TARGET",
    evidenceRequired: [
      "Big-4 audit firm engagement",
      "ISAE 3402 Type II report (annual)",
      "Management representation letter",
      "Audit trail (sample testing)",
    ],
    reliabilityScore: 0.92,
  },
  LEVEL_4_REAL_TIME: {
    level: 4,
    name: "Real-Time",
    description: "Cryptographic proof, on-chain PoR",
    constitutionalStatus: "GOLD_STANDARD",
    evidenceRequired: [
      "On-chain Proof of Reserves (PoR) — Merkle root",
      "Cryptographic custody proof (signing from custodian key)",
      "Real-time oracle feed (verified)",
      "Independent node operators (decentralized verification)",
    ],
    reliabilityScore: 0.98,
  },
} as const;

// ---- Reserve line-item verification registry ----
// In production this would be a Turso table. For the framework, in-memory.

interface VerificationRecord {
  lineItemId: string;
  description: string;
  assetClass: string;
  valueUsd: number;
  currentLevel: 0 | 1 | 2 | 3 | 4;
  targetLevel: 3 | 4;
  attestations: Attestation[];
  lastVerified: string | null;
  custodian: string | null;
  evidenceHash?: string;
}

interface Attestation {
  id: string;
  level: 0 | 1 | 2 | 3 | 4;
  attestorType: "operator" | "custodian" | "auditor" | "oracle" | "regulator";
  attestorName: string;
  evidenceHash: string;
  evidenceUrl?: string;
  signedBy: string;
  submittedAt: string;
  governanceApproved: boolean;
}

const verificationRegistry: VerificationRecord[] = [];

// ---- GET handler — framework status ----

export async function GET() {
  const nav = await computeLiveNav();

  // Initialize registry from current NAV composition (if empty)
  if (verificationRegistry.length === 0) {
    for (const asset of nav.reserveAssets) {
      verificationRegistry.push({
        lineItemId: asset.id,
        description: asset.name,
        assetClass: asset.assetClass,
        valueUsd: asset.quantity * asset.priceUsd,
        currentLevel: 0,
        targetLevel: asset.assetClass === "gold" || asset.assetClass === "silver" ? 4 : 3,
        attestations: [],
        lastVerified: null,
        custodian: null,
      });
    }
  }

  // Compute aggregate verification metrics
  const totalValue = verificationRegistry.reduce((s, r) => s + r.valueUsd, 0);
  const weightedLevel = verificationRegistry.reduce(
    (s, r) => s + (r.currentLevel / 4) * r.valueUsd,
    0,
  ) / totalValue;
  const verifiedValueLevel3Plus = verificationRegistry
    .filter(r => r.currentLevel >= 3)
    .reduce((s, r) => s + r.valueUsd, 0);
  const verifiedPctLevel3 = (verifiedValueLevel3Plus / totalValue) * 100;

  // Gap analysis
  const gaps = verificationRegistry
    .filter(r => r.currentLevel < r.targetLevel)
    .map(r => ({
      lineItemId: r.lineItemId,
      description: r.description,
      assetClass: r.assetClass,
      valueUsd: r.valueUsd,
      currentLevel: r.currentLevel,
      targetLevel: r.targetLevel,
      gap: r.targetLevel - r.currentLevel,
      nextSteps: getNextSteps(r.currentLevel, r.targetLevel, r.assetClass),
    }));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    framework: {
      name: "MITHQAL Reserve Verification Framework",
      version: "v23.1",
      constitutionalReference: "Article XVII.5 — Reserve Integrity & Verification",
      targetLevel: "Level 3+ (Audited) for all reserves; Level 4 (Real-Time) for bullion",
      currentAggregateLevel: Math.round(weightedLevel * 100) / 100,
      verifiedValuePctLevel3: Math.round(verifiedPctLevel3 * 100) / 100,
      status: verifiedPctLevel3 >= 99
        ? "CONSTITUTIONAL_TARGET_MET"
        : verifiedPctLevel3 >= 50
          ? "PARTIAL_VERIFICATION"
          : "VERIFICATION_REQUIRED",
    },
    levels: VERIFICATION_LEVELS,
    registry: verificationRegistry.map(r => ({
      lineItemId: r.lineItemId,
      description: r.description,
      assetClass: r.assetClass,
      valueUsd: Math.round(r.valueUsd * 100) / 100,
      shareOfTotal: totalValue > 0 ? (r.valueUsd / totalValue) * 100 : 0,
      currentLevel: r.currentLevel,
      currentLevelName: (VERIFICATION_LEVELS as Record<string, { name: string }>)[
        `LEVEL_${r.currentLevel}_${["DECLARED", "DOCUMENTED", "ATTESTED", "AUDITED", "REAL_TIME"][r.currentLevel]}`
      ]?.name ?? "Unknown",
      targetLevel: r.targetLevel,
      lastVerified: r.lastVerified,
      custodian: r.custodian,
      attestationCount: r.attestations.length,
      governanceApprovedAttestations: r.attestations.filter(a => a.governanceApproved).length,
    })),
    gaps,
    custodianEligibility: {
      tiers: [
        {
          tier: "Tier 1 — Official-Sector",
          examples: "Central banks (where legally eligible)",
          status: "NOT_ENGAGED",
        },
        {
          tier: "Tier 2 — Regulated Institutional",
          examples: "JP Morgan, BNY Mellon, State Street",
          status: "NOT_ENGAGED",
        },
        {
          tier: "Tier 3 — Specialized Vault",
          examples: "Brink's, Loomis, Malca-Amit (LBMA Good Delivery)",
          status: "NOT_ENGAGED",
        },
        {
          tier: "Tier 4 — Contingency",
          examples: "Pre-approved backup custodians",
          status: "NOT_DESIGNATED",
        },
      ],
      concentrationLimits: {
        perCustodian: "25% (§XVII.12 binding cap)",
        perJurisdiction: "30%",
        perVault: "30%",
        perBankingGroup: "25%",
      },
    },
    auditFirms: {
      target: "Big-4 (Deloitte, PwC, EY, KPMG) or qualified specialist (RSM, BDO, Grant Thornton)",
      status: "NOT_ENGAGED",
      targetStandard: "ISAE 3402 Type II (annual)",
      interimStandard: "ISAE 3000 (limited assurance, quarterly)",
    },
    roadmap: [
      {
        phase: "Phase 1 — Documentation (Level 0→1)",
        duration: "30-60 days",
        cost: "FREE (internal documentation)",
        status: "READY_TO_START",
        deliverables: ["Bank statements", "Vault receipts", "Custodian letters"],
      },
      {
        phase: "Phase 2 — Attestation (Level 1→2)",
        duration: "60-90 days",
        cost: "$15k-50k (regional attestor)",
        status: "BLOCKED_BY_BUDGET",
        deliverables: ["Independent attestation report", "Attestor independence declaration"],
      },
      {
        phase: "Phase 3 — Audit (Level 2→3)",
        duration: "90-180 days",
        cost: "$75k-250k (Big-4)",
        status: "BLOCKED_BY_BUDGET",
        deliverables: ["ISAE 3402 Type II report", "Annual audit cycle established"],
      },
      {
        phase: "Phase 4 — Real-Time PoR (Level 3→4)",
        duration: "180-365 days",
        cost: "$50k-150k (PoR infrastructure)",
        status: "BLOCKED_BY_BUDGET",
        deliverables: ["On-chain Merkle PoR", "Decentralized node verification"],
      },
    ],
    honestAssessment:
      "Current state: ALL reserves are Level 0 (Declared). No custodian engaged, " +
      "no audit performed, no attestation obtained. The framework is fully specified " +
      "and ready for execution. Actual verification requires institutional engagement " +
      "and budget — this is the primary gap between the v23 specification and " +
      "institutional readiness.",
  });
}

function getNextSteps(
  current: number,
  target: number,
  assetClass: string,
): string[] {
  const steps: string[] = [];
  if (current < 1) {
    steps.push("Obtain current bank statement (<30 days) or vault receipt");
    if (assetClass === "gold" || assetClass === "silver") {
      steps.push("Obtain LBMA Good Delivery vault receipt with bar serial numbers");
    }
    steps.push("Obtain custodian confirmation letter on letterhead");
  }
  if (current < 2 && target >= 2) {
    steps.push("Engage independent attestor (regional CPA firm)");
    steps.push("Attestor performs procedures on reserve balances");
    steps.push("Issue attestation report with independence declaration");
  }
  if (current < 3 && target >= 3) {
    steps.push("Engage Big-4 audit firm (Deloitte, PwC, EY, or KPMG)");
    steps.push("Establish ISAE 3402 Type II engagement (annual cycle)");
    steps.push("Complete management representation letter");
    steps.push("Audit firm performs sample testing and issues report");
  }
  if (current < 4 && target >= 4) {
    steps.push("Deploy on-chain Proof of Reserves (Merkle tree)");
    steps.push("Establish cryptographic custody proof (custodian key signing)");
    steps.push("Onboard independent node operators for decentralized verification");
    steps.push("Integrate real-time oracle feed (verified)");
  }
  return steps;
}

// ---- POST handler — submit an attestation ----

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      lineItemId?: string;
      level?: 0 | 1 | 2 | 3 | 4;
      attestorType?: "operator" | "custodian" | "auditor" | "oracle" | "regulator";
      attestorName?: string;
      evidenceHash?: string;
      evidenceUrl?: string;
      signedBy?: string;
    };

    if (!body.lineItemId || body.level === undefined || !body.attestorName || !body.evidenceHash) {
      return NextResponse.json(
        { error: "Missing required fields: lineItemId, level, attestorName, evidenceHash" },
        { status: 400 },
      );
    }

    const record = verificationRegistry.find(r => r.lineItemId === body.lineItemId);
    if (!record) {
      return NextResponse.json(
        { error: `Line item ${body.lineItemId} not found in registry` },
        { status: 404 },
      );
    }

    const attestation: Attestation = {
      id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      level: body.level,
      attestorType: body.attestorType ?? "operator",
      attestorName: body.attestorName,
      evidenceHash: body.evidenceHash,
      evidenceUrl: body.evidenceUrl,
      signedBy: body.signedBy ?? body.attestorName,
      submittedAt: new Date().toISOString(),
      governanceApproved: false, // requires governance approval to promote
    };

    record.attestations.push(attestation);

    return NextResponse.json({
      attestationId: attestation.id,
      status: "SUBMITTED",
      message:
        "Attestation submitted. Level promotion requires governance approval " +
        "(4-of-5 Monetary Council) per §Article XVII.5.4. The line item's " +
        "currentLevel will not change until governance approves.",
      attestation,
      nextSteps: [
        "Governance reviews attestation",
        "If 4-of-5 Council approves, currentLevel is promoted",
        "Promotion is recorded in the constitutional audit trail",
      ],
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to submit attestation",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
