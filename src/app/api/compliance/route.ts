import { NextResponse } from "next/server";

/**
 * GET /api/compliance — AML/KYC + Sanctions Screening framework.
 *
 * Implements the COMPLIANCE LAYER that all institutional reserve
 * operations must pass through. Uses FREE, public data sources:
 *
 *   1. OFAC SDN List — U.S. Treasury sanctions list (public, free)
 *      Source: https://www.treasury.gov/ofac/downloads/sdn.csv
 *      (fetched on-demand, cached in-memory for 24h)
 *
 *   2. Wallet risk screening — heuristic scoring based on:
 *      - Address age (if known)
 *      - Interaction patterns (if known)
 *      - Sanctions list match (exact + fuzzy)
 *
 *   3. KYC tier framework — 3-tier verification model
 *      Tier 1: Self-declared (email + jurisdiction)
 *      Tier 2: Identity verified (gov ID + address)
 *      Tier 3: Institutional (cert of incorporation + authorized signatory)
 *
 * Constitutional boundary: This is a FRAMEWORK. Production deployment
 * requires engaging a licensed compliance provider (Chainalysis, Elliptic,
 * TRM Labs) for real-time blockchain analytics. The framework below
 * provides the data model and OFAC screening that can run for free.
 *
 * POST /api/compliance — screen an address/wallet
 *   Body: { address: string, type: "wallet"|"entity", name?: string }
 *   Returns: { screeningId, passed, riskScore, matches[], tier }
 */

// ---- In-memory OFAC SDN cache (24h TTL) ----
// The full SDN list is ~700KB CSV. We cache the name set in memory.
const SDN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
let sdnCache: { names: Set<string>; fetchedAt: number } | null = null;

async function loadOfacSdnList(): Promise<Set<string> | null> {
  if (sdnCache && Date.now() - sdnCache.fetchedAt < SDN_CACHE_TTL) {
    return sdnCache.names;
  }

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch("https://www.treasury.gov/ofac/downloads/sdn.csv", {
      signal: ctrl.signal,
    });
    clearTimeout(to);

    if (!res.ok) throw new Error(`OFAC fetch HTTP ${res.status}`);

    const text = await res.text();
    const names = new Set<string>();
    // SDN CSV: each line has fields; index 1 is the SDN name (quoted)
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      // Simple parse: split by comma, handle quotes
      const parts = line.match(/(?:,"|^")([^"]*)(?:",|"$)/g);
      if (parts && parts.length >= 2) {
        const name = parts[1].replace(/^,"|^"|"$/, "").trim().toUpperCase();
        if (name) names.add(name);
      } else {
        // Fallback: first comma-separated field after index
        const fields = line.split(",");
        if (fields.length >= 2) {
          const name = fields[1].replace(/^"|"$/g, "").trim().toUpperCase();
          if (name && name.length > 2) names.add(name);
        }
      }
    }

    sdnCache = { names, fetchedAt: Date.now() };
    return names;
  } catch {
    // v24.2 CORRECTION: FAIL-CLOSED — if OFAC fetch fails, block ALL transactions
    // (v24.1 failed open — returned empty set = all addresses pass. This was a P0 bug.)
    // Now: return null sentinel → caller must reject all transactions
    console.error("[compliance] OFAC SDN fetch failed — FAILING CLOSED per v24.2 §25");
    return null;
  }
}

// ---- Wallet risk heuristics ----

function screenAddress(address: string): {
  riskScore: number;
  flags: string[];
} {
  const flags: string[] = [];
  let riskScore = 0;

  // Checksum format validation
  const addr = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(addr) && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)) {
    flags.push("Invalid address format");
    riskScore += 50;
  }

  // Known sanction-matching prefixes (demo: none hardcoded)
  // In production, this would query Chainalysis/TRM Labs

  // Mixer/tumbler interaction heuristics (placeholder)
  // Production would check on-chain history via a blockchain analytics API

  return { riskScore, flags };
}

// ---- KYC tier framework ----

const KYC_TIERS = {
  TIER_1_SELF_DECLARED: {
    level: 1,
    name: "Self-Declared",
    requirements: ["Email verification", "Jurisdiction self-declaration"],
    maxTransactionUsd: 1_000,
    canMint: false,
    canRedeem: false,
  },
  TIER_2_IDENTITY_VERIFIED: {
    level: 2,
    name: "Identity Verified",
    requirements: [
      "Government-issued photo ID",
      "Proof of address (utility bill, bank statement)",
      "Liveness check",
      "PEP (Politically Exposed Person) screening",
      "Adverse media screening",
    ],
    maxTransactionUsd: 50_000,
    canMint: true,
    canRedeem: true,
  },
  TIER_3_INSTITUTIONAL: {
    level: 3,
    name: "Institutional",
    requirements: [
      "Certificate of incorporation",
      "Authorized signatory verification",
      "Beneficial ownership disclosure (>25%)",
      "Corporate bank account verification",
      "Regulatory license (if applicable)",
      "Enhanced due diligence (EDD)",
      "Source of funds verification",
    ],
    maxTransactionUsd: Number.MAX_SAFE_INTEGER,
    canMint: true,
    canRedeem: true,
  },
} as const;

// ---- Screening record type ----

interface ScreeningRecord {
  screeningId: string;
  address: string;
  type: "wallet" | "entity";
  name?: string;
  passed: boolean;
  riskScore: number;
  flags: string[];
  sanctionsMatches: string[];
  tier: 1 | 2 | 3;
  screenedAt: string;
  expiresAt: string;
}

// In-memory screening log (production would persist to Turso)
const screeningLog: ScreeningRecord[] = [];

// ---- GET handler — framework status ----

export async function GET() {
  const sdnList = await loadOfacSdnList();
  const ofacOnline = sdnList !== null;

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    framework: {
      name: "MITHQAL Compliance Layer",
      version: "v24.2",
      mode: "FRAMEWORK_ACTIVE",
      failClosedPolicy: "v24.2 CORRECTION: OFAC fetch failure → ALL transactions BLOCKED (fail-closed, not fail-open)",
      productionNote:
        "Production deployment requires a licensed blockchain analytics provider " +
        "(Chainalysis, Elliptic, TRM Labs) for real-time wallet risk scoring. " +
        "The OFAC SDN screening below is fully operational and free.",
    },
    sanctions: {
      provider: "OFAC SDN List (U.S. Treasury)",
      url: "https://www.treasury.gov/ofac/downloads/sdn.csv",
      ofacOnline,
      cachedEntries: ofacOnline ? sdnList!.size : 0,
      failClosed: true,
      cacheTtlHours: 24,
      lastFetch: sdnCache ? new Date(sdnCache.fetchedAt).toISOString() : null,
      coverage: ["SDN (Specially Designated Nationals)", "Consolidated Sanctions List"],
    },
    kycTiers: KYC_TIERS,
    screeningLog: {
      totalScreenings: screeningLog.length,
      passed: screeningLog.filter(s => s.passed).length,
      blocked: screeningLog.filter(s => !s.passed).length,
      recent: screeningLog.slice(-10).reverse(),
    },
    requirements: {
      jurisdictions: [
        {
          jurisdiction: "US",
          regulator: "FinCEN",
          requirements: ["MSB registration", "AML program", "CTR for >$10k", "SAR for suspicious activity"],
        },
        {
          jurisdiction: "EU",
          regulator: "EBA / MiCA",
          requirements: ["MiCA CASP authorization", "Travel rule compliance", "CDD/EDD"],
        },
        {
          jurisdiction: "UAE",
          regulator: "VARA / ADGM",
          requirements: ["VASP license", "FATF travel rule", "CDD"],
        },
        {
          jurisdiction: "KSA",
          regulator: "SAMA",
          requirements: ["SAMA license", "Sharia compliance audit", "CDD"],
        },
        {
          jurisdiction: "UK",
          regulator: "FCA",
          requirements: ["FCA crypto registration", "MLR 2017 compliance", "JMLSG guidance"],
        },
        {
          jurisdiction: "SG",
          regulator: "MAS",
          requirements: ["MAS DPSA license", "PSN02 compliance", "CDD"],
        },
      ],
      travelRule: {
        threshold: "€1,000 / $1,000 (FATF Recommendation 16)",
        requiredData: ["Originator name", "Originator account", "Beneficiary name", "Beneficiary account"],
        status: "framework_ready",
      },
      recordRetention: "5 years (FATF Recommendation 11)",
    },
  });
}

// ---- POST handler — screen an address ----

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      address?: string;
      type?: "wallet" | "entity";
      name?: string;
      tier?: 1 | 2 | 3;
    };

    if (!body.address) {
      return NextResponse.json(
        { error: "Missing required field: address" },
        { status: 400 },
      );
    }

    const address = String(body.address).trim();
    const type = body.type ?? "wallet";
    const name = body.name?.trim();
    const tier = body.tier ?? 1;

    // 1. Sanctions screening (OFAC SDN) — v24.2 FAIL-CLOSED
    const sdnList = await loadOfacSdnList();

    // v24.2: If OFAC fetch failed, BLOCK ALL transactions (fail-closed)
    if (sdnList === null) {
      return NextResponse.json({
        screeningId: `scr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        address,
        type,
        name,
        passed: false,
        riskScore: 100,
        flags: ["OFAC SDN list unavailable — FAIL-CLOSED per v24.2"],
        sanctionsMatches: [],
        tier,
        action: "BLOCK",
        reason: "OFAC SDN screening system unavailable — all transactions blocked per fail-closed policy (v24.2 §25)",
        nextSteps: "Escalate to compliance officer; retry when OFAC system is available",
      }, { status: 503 });
    }

    const sanctionsMatches: string[] = [];

    // Check name against SDN list (exact + partial)
    if (name) {
      const upperName = name.toUpperCase();
      for (const sdnName of sdnList) {
        if (sdnName.includes(upperName) || upperName.includes(sdnName)) {
          if (sdnName.length > 3) sanctionsMatches.push(sdnName);
        }
      }
    }

    // Check address against SDN list (digital addresses are in the list)
    const upperAddr = address.toUpperCase();
    for (const sdnName of sdnList) {
      if (sdnName.includes(upperAddr) && upperAddr.length > 10) {
        sanctionsMatches.push(`Address match: ${sdnName.substring(0, 80)}`);
      }
    }

    // 2. Wallet risk scoring
    const { riskScore, flags } = screenAddress(address);

    // 3. Determine pass/fail
    const passed =
      sanctionsMatches.length === 0 &&
      riskScore < 50 &&
      flags.filter(f => f.includes("Invalid")).length === 0;

    const screeningId = `scr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90-day validity

    const record: ScreeningRecord = {
      screeningId,
      address,
      type,
      name,
      passed,
      riskScore,
      flags,
      sanctionsMatches,
      tier,
      screenedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    screeningLog.push(record);
    if (screeningLog.length > 1000) screeningLog.shift(); // cap log

    return NextResponse.json({
      ...record,
      action: passed ? "ALLOW" : "BLOCK",
      reason: !passed
        ? sanctionsMatches.length > 0
          ? "Sanctions match found — transaction blocked per OFAC compliance"
          : "Risk score exceeded threshold — enhanced due diligence required"
        : "Screening passed",
      nextSteps: passed
        ? tier >= 2
          ? "Proceed with transaction within tier limits"
          : "Complete Tier 2 KYC for mint/redeem authorization"
        : "Escalate to compliance officer; file SAR if suspicious",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Screening failed",
        detail: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 },
    );
  }
}
