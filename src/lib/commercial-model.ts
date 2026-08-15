// v25.0 Institutional Closure 3/8 — Commercial Model Restructuring
// =================================================================
// Redesigns MITHQAL economics for commercial viability at realistic adoption.
//
// CURRENT STATUS: NOT COMMERCIALLY SUSTAINABLE (break-even: 273 institutions, $13.3B/month)
// This is NOT hidden or overwritten.
//
// Implements:
//   Task 1: Three business models (A: pure wholesale, B: hybrid, C: corridor subscription)
//   Task 2-3: Bank + MITHQAL economics (9 streams each)
//   Task 4: Fixed + variable revenue (not BPS alone)
//   Task 5-6: Lean operating model (4 cost tiers, target $1-2M/month)
//   Task 7: Capital requirement (6 types, not automatic $76.8M)
//   Task 8-9: Five-year model + stress
//   Task 10-11: Minimum viable network + preferred model
// =================================================================

// ---- Task 1: Three Business Models ----

export type BusinessModel = "A_PURE_WHOLESALE" | "B_HYBRID" | "C_CORRIDOR_SUBSCRIPTION";

export interface BusinessModelConfig {
  model: BusinessModel;
  name: string;
  description: string;
  mithqalRevenueStructure: string;
  bankRevenueStructure: string;
  fixedRevenuePer: { type: string; amount: number }[];
  variableFeeBps: number;  // bps on settlement volume
  minimumAnnualCommitment: number;
}

export const BUSINESS_MODELS: Record<BusinessModel, BusinessModelConfig> = {
  A_PURE_WHOLESALE: {
    model: "A_PURE_WHOLESALE",
    name: "Pure Wholesale Infrastructure",
    description: "MITHQAL charges pure transaction fees (bps). No fixed fees. Banks charge their own fees. Lowest barrier to entry but highest volume needed for sustainability.",
    mithqalRevenueStructure: "Variable only: issuance 2bps + settlement 2bps + redemption 2bps = 6bps total on volume",
    bankRevenueStructure: "Bank charges own fees (5-8bps origination/FX/redemption + corporate account fees)",
    fixedRevenuePer: [],
    variableFeeBps: 6,
    minimumAnnualCommitment: 0,
  },
  B_HYBRID: {
    model: "B_HYBRID",
    name: "Hybrid Bank + MITHQAL Revenue",
    description: "MITHQAL charges fixed institutional connectivity + modest variable fees. Banks charge own fees. Balanced model — predictable base revenue + growth upside.",
    mithqalRevenueStructure: "Fixed: $25K/month per institution connectivity + $50K/month enterprise. Variable: 3bps on settlement volume. Plus: compliance/attestation $5K/month per institution.",
    bankRevenueStructure: "Bank charges: origination 5bps, settlement 3bps, redemption 5bps, FX 8bps, treasury $10K/month, corporate account $2.5K/month",
    fixedRevenuePer: [
      { type: "institutional_connectivity", amount: 25_000 },  // per institution/month
      { type: "enterprise_infrastructure", amount: 50_000 },     // flat/month
      { type: "compliance_attestation", amount: 5_000 },        // per institution/month
    ],
    variableFeeBps: 3,
    minimumAnnualCommitment: 360_000,  // $30K/month × 12 = $360K/year per institution
  },
  C_CORRIDOR_SUBSCRIPTION: {
    model: "C_CORRIDOR_SUBSCRIPTION",
    name: "Corridor Subscription + Variable Settlement",
    description: "MITHQAL charges per-corridor subscription + very low variable fee. Institutions subscribe to corridors. Highest fixed revenue predictability. Best for early stage.",
    mithqalRevenueStructure: "Fixed: $100K/year per corridor subscription + $50K/month enterprise. Variable: 1bp on settlement. Plus: reporting/audit $10K/month per institution.",
    bankRevenueStructure: "Bank charges own fees (same as Model B)",
    fixedRevenuePer: [
      { type: "corridor_subscription", amount: 8_333 },  // $100K/year ÷ 12 = $8.3K/month per corridor
      { type: "enterprise_infrastructure", amount: 50_000 },
      { type: "reporting_audit", amount: 10_000 },  // per institution/month
    ],
    variableFeeBps: 1,
    minimumAnnualCommitment: 500_000,  // ~$42K/month × 12
  },
};

// ---- Task 4: Revenue Calculation (Fixed + Variable, not BPS alone) ----

export interface RevenueBreakdown {
  fixedRevenue: number;
  variableRevenue: number;
  total: number;
  breakdown: { source: string; amount: number; type: "FIXED" | "VARIABLE" }[];
}

export function computeRevenue(
  model: BusinessModel,
  institutions: number,
  corridors: number,
  monthlyVolume: number,
): RevenueBreakdown {
  const config = BUSINESS_MODELS[model];
  const breakdown: { source: string; amount: number; type: "FIXED" | "VARIABLE" }[] = [];
  let fixed = 0;

  for (const item of config.fixedRevenuePer) {
    let amount = item.amount;
    if (item.type === "institutional_connectivity" || item.type === "compliance_attestation" || item.type === "reporting_audit") {
      amount = item.amount * institutions;
    } else if (item.type === "corridor_subscription") {
      amount = item.amount * corridors;
    }
    fixed += amount;
    breakdown.push({ source: item.type, amount: Math.round(amount), type: "FIXED" });
  }

  const variable = monthlyVolume * (config.variableFeeBps / 10000);
  breakdown.push({ source: `variable_settlement (${config.variableFeeBps}bps)`, amount: Math.round(variable), type: "VARIABLE" });

  return { fixedRevenue: Math.round(fixed), variableRevenue: Math.round(variable), total: Math.round(fixed + variable), breakdown };
}

// ---- Task 5-6: Lean Operating Model (4 cost tiers) ----

export type CostTier = "PILOT" | "EARLY_NETWORK" | "SCALE" | "GLOBAL";

export interface CostTierConfig {
  tier: CostTier;
  description: string;
  institutions: number;
  monthlyCost: number;
  costBreakdown: { category: string; amount: number }[];
}

export function computeCosts(tier: CostTier, institutions: number, corridors: number): CostTierConfig {
  const scale = Math.max(1, institutions / 10);

  if (tier === "PILOT") {
    // LEAN: minimal team, cloud-only, no dedicated custody, no enterprise sales
    const costs = [
      { category: "personnel", amount: 200_000 },      // 2-3 people
      { category: "cloud", amount: 15_000 },
      { category: "cybersecurity", amount: 20_000 },
      { category: "compliance", amount: 30_000 },
      { category: "legal", amount: 30_000 },
      { category: "infrastructure", amount: 35_000 },
      { category: "audit", amount: 20_000 },
    ];
    return {
      tier, description: "Pilot — lean team, simulated assets, minimal infrastructure",
      institutions, monthlyCost: costs.reduce((s, c) => s + c.amount, 0), costBreakdown: costs,
    };
  }

  if (tier === "EARLY_NETWORK") {
    // 10-25 institutions, real assets, basic operations
    const costs = [
      { category: "personnel", amount: 350_000 },      // 5-7 people
      { category: "cloud", amount: 40_000 },
      { category: "cybersecurity", amount: 50_000 },
      { category: "hsm_mpc", amount: 40_000 },
      { category: "custody", amount: 50_000 },
      { category: "insurance", amount: 80_000 },
      { category: "compliance", amount: 60_000 },
      { category: "legal", amount: 80_000 },
      { category: "audit", amount: 50_000 },
      { category: "infrastructure", amount: 100_000 },
    ];
    return {
      tier, description: "Early network — real assets, 10-25 institutions, basic operations",
      institutions, monthlyCost: costs.reduce((s, c) => s + c.amount, 0), costBreakdown: costs,
    };
  }

  if (tier === "SCALE") {
    // 50-100 institutions, full operations
    const costs = [
      { category: "personnel", amount: 600_000 + 50_000 * scale },
      { category: "cloud", amount: 80_000 + 10_000 * scale },
      { category: "cybersecurity", amount: 120_000 + 20_000 * scale },
      { category: "hsm_mpc", amount: 80_000 + 15_000 * scale },
      { category: "custody", amount: 150_000 + 30_000 * scale },
      { category: "insurance", amount: 200_000 + 50_000 * scale },
      { category: "compliance", amount: 150_000 + 30_000 * scale },
      { category: "legal", amount: 200_000 + 50_000 * scale },
      { category: "audit", amount: 100_000 },
      { category: "infrastructure", amount: 200_000 + 40_000 * scale },
    ];
    return {
      tier, description: "Scale — full operations, 50-100 institutions, multi-jurisdiction",
      institutions, monthlyCost: costs.reduce((s, c) => s + c.amount, 0), costBreakdown: costs,
    };
  }

  // GLOBAL
  const costs = [
    { category: "personnel", amount: 1_500_000 + 100_000 * scale },
    { category: "cloud", amount: 200_000 + 20_000 * scale },
    { category: "cybersecurity", amount: 300_000 + 50_000 * scale },
    { category: "hsm_mpc", amount: 150_000 + 30_000 * scale },
    { category: "custody", amount: 300_000 + 50_000 * scale },
    { category: "insurance", amount: 500_000 + 100_000 * scale },
    { category: "compliance", amount: 300_000 + 50_000 * scale },
    { category: "legal", amount: 400_000 + 100_000 * scale },
    { category: "audit", amount: 200_000 },
    { category: "infrastructure", amount: 400_000 + 80_000 * scale },
  ];
  return {
    tier, description: "Global — 250+ institutions, full global operations, multi-region redundancy",
    institutions, monthlyCost: costs.reduce((s, c) => s + c.amount, 0), costBreakdown: costs,
  };
}

// ---- Task 7: Capital Requirement (6 types, NOT automatic $76.8M) ----

export interface CapitalRequirement {
  pilotCapital: number;           // Capital to reach pilot
  operationalCapital: number;     // Working capital for early operations
  regulatoryCapital: number;      // Licensing + regulatory capital
  liquidityCapital: number;      // ILPS initial funding
  emergencyCapital: number;      // Emergency reserve
  scaleCapital: number;          // Capital to scale (growth)
  totalByPhase: {
    pilot: number;               // pilot + operational (12 months)
    early: number;               // + regulatory + liquidity + emergency
    scale: number;               // + scale capital
  };
}

export function computeCapital(phase: "PILOT" | "EARLY" | "SCALE", monthlyCost: number): CapitalRequirement {
  const pilotCapital = 500_000;             // $500K seed for pilot setup
  const operationalCapital = monthlyCost * 12;  // 12 months runway
  const regulatoryCapital = phase === "PILOT" ? 0 : 500_000;  // Licensing (phase-dependent)
  const liquidityCapital = phase === "PILOT" ? 0 : 5_400_000;  // 10% of $54M (phase-dependent)
  const emergencyCapital = phase === "PILOT" ? 100_000 : 2_000_000;
  const scaleCapital = phase === "SCALE" ? 5_000_000 : 0;

  const totalPilot = pilotCapital + operationalCapital;
  const totalEarly = totalPilot + regulatoryCapital + liquidityCapital + emergencyCapital;
  const totalScale = totalEarly + scaleCapital;

  return {
    pilotCapital, operationalCapital, regulatoryCapital, liquidityCapital, emergencyCapital, scaleCapital,
    totalByPhase: { pilot: totalPilot, early: totalEarly, scale: totalScale },
  };
}

// ---- Task 8-9: Five-Year Model + Stress ----

export interface FiveYearScenario {
  model: BusinessModel;
  year: number;
  institutions: number;
  corridors: number;
  monthlyVolume: number;
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyBurn: number;
  annualRevenue: number;
  annualCost: number;
  ebitda: number;
  isBreakEven: boolean;
}

export function runFiveYear(
  model: BusinessModel,
  yearInstitutions: number[],
  yearVolumes: number[],
  yearCorridors: number[],
): FiveYearScenario[] {
  const results: FiveYearScenario[] = [];

  for (let year = 0; year < 5; year++) {
    const inst = yearInstitutions[year] ?? yearInstitutions[yearInstitutions.length - 1];
    const vol = yearVolumes[year] ?? yearVolumes[yearVolumes.length - 1];
    const corr = yearCorridors[year] ?? yearCorridors[yearCorridors.length - 1];

    const revenue = computeRevenue(model, inst, corr, vol);
    const costTier: CostTier = inst <= 5 ? "PILOT" : inst <= 25 ? "EARLY_NETWORK" : inst <= 100 ? "SCALE" : "GLOBAL";
    const costs = computeCosts(costTier, inst, corr);

    const monthlyBurn = Math.max(0, costs.monthlyCost - revenue.total);
    const annualRevenue = revenue.total * 12;
    const annualCost = costs.monthlyCost * 12;
    const ebitda = annualRevenue - annualCost;

    results.push({
      model, year: year + 1, institutions: inst, corridors: corr, monthlyVolume: vol,
      monthlyRevenue: revenue.total, monthlyCost: costs.monthlyCost, monthlyBurn,
      annualRevenue, annualCost, ebitda, isBreakEven: revenue.total >= costs.monthlyCost,
    });
  }

  return results;
}

export interface StressResult {
  scenario: string;
  model: BusinessModel;
  institutions: number;
  monthlyVolume: number;
  revenueAfter: number;
  costAfter: number;
  isBreakEven: boolean;
  survives: boolean;
}

export function runStress(
  model: BusinessModel,
  baseInstitutions: number,
  baseVolume: number,
  baseCorridors: number,
  baseCost: number,
): StressResult[] {
  const results: StressResult[] = [];

  // Fee compression
  for (const pct of [0.25, 0.50, 0.75]) {
    const baseRev = computeRevenue(model, baseInstitutions, baseCorridors, baseVolume);
    const revAfter = baseRev.total * (1 - pct);
    results.push({
      scenario: `${pct * 100}% fee compression`,
      model, institutions: baseInstitutions, monthlyVolume: baseVolume,
      revenueAfter: Math.round(revAfter), costAfter: baseCost,
      isBreakEven: revAfter >= baseCost, survives: revAfter >= baseCost * 0.7,
    });
  }

  // Low adoption
  const lowAdoption = [
    { name: "Slow adoption (3 inst)", inst: 3, vol: 20_000_000 },
    { name: "Regulatory delay (1 inst)", inst: 1, vol: 5_000_000 },
    { name: "One bank exits", inst: baseInstitutions - 1, vol: baseVolume * 0.8 },
    { name: "One corridor fails", inst: baseInstitutions, vol: baseVolume * 0.85 },
    { name: "Low velocity", inst: baseInstitutions, vol: baseVolume * 0.3 },
    { name: "High settlement demand", inst: baseInstitutions, vol: baseVolume * 1.5 },
  ];

  for (const la of lowAdoption) {
    const rev = computeRevenue(model, la.inst, Math.max(1, Math.floor(la.inst / 5)), la.vol);
    results.push({
      scenario: la.name, model, institutions: la.inst, monthlyVolume: la.vol,
      revenueAfter: rev.total, costAfter: baseCost,
      isBreakEven: rev.total >= baseCost, survives: rev.total >= baseCost * 0.5,
    });
  }

  return results;
}

// ---- Task 10-11: Minimum Viable Network + Preferred Model ----

export interface MinimumViableNetwork {
  model: BusinessModel;
  minInstitutions: number;
  minCorridors: number;
  minMonthlyVolume: number;
  monthlyRevenue: number;
  monthlyCost: number;
  isViable: boolean;
  reasoning: string;
}

export function computeMVN(model: BusinessModel, monthlyCost: number): MinimumViableNetwork {
  const config = BUSINESS_MODELS[model];

  // Calculate minimum institutions for fixed revenue to cover costs
  let fixedPerInstitution = 0;
  for (const item of config.fixedRevenuePer) {
    if (item.type !== "enterprise_infrastructure" && item.type !== "corridor_subscription") {
      fixedPerInstitution += item.amount;
    }
  }

  const enterpriseFee = config.fixedRevenuePer.find(f => f.type === "enterprise_infrastructure")?.amount ?? 0;
  const corridorFee = config.fixedRevenuePer.find(f => f.type === "corridor_subscription")?.amount ?? 0;

  // Min institutions: (cost - enterprise - corridor_revenue) / (per_institution + variable_per_inst)
  // Assume each institution brings ~$5M/month volume initially
  const assumedVolumePerInst = 5_000_000;
  const variablePerInst = assumedVolumePerInst * (config.variableFeeBps / 10000);

  const minInst = Math.ceil(Math.max(1, (monthlyCost - enterpriseFee) / (fixedPerInstitution + variablePerInst + corridorFee * 0.4)));
  const minCorridors = Math.max(1, Math.ceil(minInst / 5));
  const minVolume = minInst * assumedVolumePerInst;

  const revenue = computeRevenue(model, minInst, minCorridors, minVolume);
  const isViable = revenue.total >= monthlyCost;

  const reasoning = `Model ${model}: ${minInst} institutions × $${fixedPerInstitution.toLocaleString()}/month fixed + $${assumedVolumePerInst.toLocaleString()} × ${config.variableFeeBps}bps variable = $${revenue.total.toLocaleString()}/month revenue vs $${monthlyCost.toLocaleString()}/month cost. ${isViable ? 'VIABLE' : 'NOT VIABLE at this cost level.'}`;

  return {
    model, minInstitutions: minInst, minCorridors, minMonthlyVolume: minVolume,
    monthlyRevenue: revenue.total, monthlyCost, isViable, reasoning,
  };
}

// ---- Preferred Model Selection ----

export interface ModelSelection {
  preferred: BusinessModel;
  reasoning: string;
  comparison: { model: BusinessModel; mvn: MinimumViableNetwork }[];
}

export function selectPreferredModel(monthlyCost: number): ModelSelection {
  const comparison = (Object.keys(BUSINESS_MODELS) as BusinessModel[]).map(m => ({
    model: m, mvn: computeMVN(m, monthlyCost),
  }));

  // Select the model with the LOWEST minimum viable institutions
  // (most achievable at realistic adoption)
  const preferred = comparison.reduce((best, current) =>
    current.mvn.minInstitutions < best.mvn.minInstitutions ? current : best
  ).model;

  const preferredMVN = comparison.find(c => c.model === preferred)!.mvn;

  const reasoning = `
PREFERRED MODEL: ${BUSINESS_MODELS[preferred].name}

SELECTION CRITERIA: Lowest minimum viable institutions (most achievable at realistic adoption).

COMPARISON:
${comparison.map(c => `- ${c.model}: ${c.mvn.minInstitutions} institutions needed (revenue $${c.mvn.monthlyRevenue.toLocaleString()} vs cost $${c.mvn.monthlyCost.toLocaleString()}) → ${c.mvn.isViable ? 'VIABLE' : 'NOT VIABLE'}`).join('\n')}

WHY ${BUSINESS_MODELS[preferred].name}:
- Lowest barrier to viability (${preferredMVN.minInstitutions} institutions)
- Fixed revenue provides predictability (not dependent on volume alone)
- Corridor subscription model aligns with institutional onboarding (banks subscribe to corridors they use)
- Variable fee is minimal (1bp) — does not discourage settlement volume
- Most resilient to fee compression (fixed revenue floor)
- Most resilient to low velocity (fixed revenue does not depend on velocity)

HONEST ASSESSMENT:
- At $${monthlyCost.toLocaleString()}/month cost: ${preferredMVN.isViable ? 'VIABLE' : 'NOT VIABLE YET'}
- Minimum viable network: ${preferredMVN.minInstitutions} institutions, ${preferredMVN.minCorridors} corridors, $${preferredMVN.minMonthlyVolume.toLocaleString()}/month volume
- ${preferredMVN.isViable ? 'The selected model IS commercially viable at this cost level.' : 'The selected model requires cost reduction or higher adoption to be viable.'}
`;

  return { preferred, reasoning, comparison };
}
