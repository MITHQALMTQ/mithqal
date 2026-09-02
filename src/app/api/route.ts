import { NextResponse } from "next/server";

/**
 * Root API discovery endpoint.
 * Returns a structured catalog of all API versions and key module endpoints
 * available on the MITHQAL platform. This is the entry point for programmatic
 * discovery of the API surface.
 */
export async function GET() {
  return NextResponse.json({
    name: "MITHQAL API",
    version: "v25.2",
    description:
      "Constitutional settlement infrastructure API. §V25.2 Final Reserve Mathematical Specification.",
    honestState: {
      productionAuthorized: false,
      institutionalGatesPassed: "0/20",
      finalityLayersEnforced: "7/7",
      validatedJurisdictions: 0,
      licensesObtained: 0,
      legalOpinionsObtained: 0,
      legalObligationRegisterSeeded: 117,
    },
    versions: [
      { id: "v25.2", status: "CURRENT", path: "/api/mtq-final-reserve" },
      { id: "v25.1", status: "ACTIVE", path: "/api/v25.1" },
      { id: "v25.0", status: "ACTIVE", path: "/api/v25.0" },
      { id: "v24.2.1", status: "ACTIVE", path: "/api/v24.2.1" },
      { id: "v24.2", status: "ACTIVE", path: "/api/v24.2" },
      { id: "v24.1.2", status: "ACTIVE", path: "/api/v24.1.2/resilience-stack" },
      { id: "v23", status: "LEGACY", path: "/api/v23-metrics" },
    ],
    modules: {
      core: [
        { id: "mtq-final-reserve", path: "/api/mtq-final-reserve", description: "§V25.2 Final Reserve Mathematical Specification" },
        { id: "mtq-finality-before-mint", path: "/api/mtq-finality-before-mint", description: "§54 7-layer finality enforcement + 10 bypass tests" },
        { id: "mtq-implementation-status", path: "/api/mtq-implementation-status", description: "§87 implementation status report" },
        { id: "mtq-os", path: "/api/mtq-os", description: "MTQ Operating System — issuance pipeline + bank integration + ISO 20022" },
        { id: "nav", path: "/api/nav", description: "Live NAV + reserve ratio + gold price + FX rates" },
        { id: "oracle", path: "/api/oracle", description: "Multi-oracle consensus (gold + FX + stablecoin)" },
      ],
      p1Frameworks: [
        { id: "mtq-protected-backing-cell", path: "/api/mtq-protected-backing-cell", description: "§47 Protected Backing Cell" },
        { id: "mtq-bank-default-resolution", path: "/api/mtq-bank-default-resolution", description: "§48 Bank Default & Resolution" },
        { id: "mtq-legal-liability-framework", path: "/api/mtq-legal-liability-framework", description: "§49 Legal Liability Framework" },
        { id: "legal-obligation-register", path: "/api/legal-obligation-register", description: "§49 Legal Obligation Register (9 jurisdictions × 13 obligation types = 117 entries, registerOpinion intake)" },
        { id: "mtq-licensing-entity-matrix", path: "/api/mtq-licensing-entity-matrix", description: "§50 Licensing Matrix (9 activities × 8 jurisdictions)" },
        { id: "mtq-three-book-separation", path: "/api/mtq-three-book-separation", description: "§51 Three-Book Separation" },
        { id: "mtq-systemic-exposure-engine", path: "/api/mtq-systemic-exposure-engine", description: "§52 Systemic Exposure Engine" },
        { id: "mtq-contradiction-scan", path: "/api/mtq-contradiction-scan", description: "§77 Contradiction Scan" },
      ],
      simulators: [
        { id: "reserve-simulator", path: "/api/reserve-simulator", description: "Monte Carlo reserve simulator (250K iterations, seed=42)" },
        { id: "corridor", path: "/api/corridor", description: "AED↔SGD cross-border corridor simulator" },
        { id: "tokenization", path: "/api/tokenization", description: "RWA + digital coin tokenization reference" },
        { id: "institutional-stress-tests", path: "/api/institutional-stress-tests", description: "10 real historical crisis stress tests (2008, 2020, 2022, 2023, etc.)" },
      ],
      governance: [
        { id: "governance-proposals", path: "/api/governance/proposals", description: "Governance proposals" },
        { id: "final-pilot-activation-gate", path: "/api/final-pilot-activation-gate", description: "Final pilot activation gate" },
        { id: "final-integrated-architecture", path: "/api/final-integrated-architecture", description: "Final integrated architecture" },
      ],
      transparency: [
        { id: "transparency", path: "/api/transparency", description: "Live transparency dashboard data" },
        { id: "proofs/latest", path: "/api/proofs/latest", description: "Latest proof-of-reserves / proof-of-liabilities" },
        { id: "reserve-verification", path: "/api/reserve-verification", description: "Reserve verification" },
      ],
    },
    totalEndpoints: 149,
    documentation: "/api-docs",
    openapi: "/openapi.json",
    disclaimer:
      "CONTROLLED INSTITUTIONAL DOCUMENT · NOT A LICENSE · NOT A LEGAL OPINION. Production not authorized. All data is SIMULATED for institutional review.",
  });
}
