import { NextResponse } from "next/server";
import {
  CONSTITUTIONAL_INVARIANTS,
  CONSTITUTIONAL_CONSTANTS,
  ASSURANCE_FRAMEWORK,
  PROOF_CONTENTS,
  REDEMPTION_HIERARCHY,
  SETTLEMENT_PIPELINE,
  MINT_LIFECYCLE,
  REDEEM_LIFECYCLE,
  SUPPLY_INVARIANTS,
  US_REGULATORY_FRAMEWORK,
  INTERNATIONAL_FRAMEWORKS,
  SHARIA_REQUIREMENTS,
  STRESS_SCENARIOS,
  OPERATIONAL_CAPITAL_MONTHS,
  type ConstitutionalConstant,
  type ConstitutionalInvariant,
  type ConstitutionalProof,
} from "@/lib/v19-infrastructure";

// GET /api/infrastructure — public, unauthenticated. Returns the complete
// v19.0 Constitutional Infrastructure: invariants, constants registry,
// assurance framework, redemption hierarchy, settlement pipeline, supply
// lifecycle, regulatory framework, Sharia governance, and stress scenarios.
export async function GET() {
  return NextResponse.json({
    specVersion: "v19.0",
    // §45 Constitutional Invariants (21 non-amendable provisions)
    invariants: CONSTITUTIONAL_INVARIANTS,
    // §53 Constitutional Constants Registry
    constants: CONSTITUTIONAL_CONSTANTS,
    // §37 Assurance Framework (7 proofs)
    assuranceFramework: ASSURANCE_FRAMEWORK,
    // §37.3 Proof Contents
    proofContents: PROOF_CONTENTS,
    // §34 Redemption Hierarchy
    redemptionHierarchy: REDEMPTION_HIERARCHY,
    // §35 Settlement Pipeline (6 stages)
    settlementPipeline: SETTLEMENT_PIPELINE,
    // §36 Supply Lifecycle
    mintLifecycle: MINT_LIFECYCLE,
    redeemLifecycle: REDEEM_LIFECYCLE,
    supplyInvariants: SUPPLY_INVARIANTS,
    // §48 US Regulatory Framework
    usRegulatory: US_REGULATORY_FRAMEWORK,
    internationalFrameworks: INTERNATIONAL_FRAMEWORKS,
    // §49 Sharia Governance
    shariaRequirements: SHARIA_REQUIREMENTS,
    // §40 Stress Testing Scenarios
    stressScenarios: STRESS_SCENARIOS,
    // §41 Operational Capital Buffer
    operationalCapitalMonths: OPERATIONAL_CAPITAL_MONTHS,
    generatedAt: new Date().toISOString(),
  });
}
