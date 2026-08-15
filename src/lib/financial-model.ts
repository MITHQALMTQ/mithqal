// v25.0 Production Hardening 4/8 — Five-Year Banking, Economic, Tokenomic, Capital Model
// =================================================================
// Full institutional financial model replacing the simple $2.1M/year scenario.
//
// Implements:
//   Task 1: Three scenarios (CONSERVATIVE / BASE / AGGRESSIVE)
//   Task 2: Institution adoption (10/25/50/100/250/500)
//   Task 3: Transaction volume ($100M/$500M/$1B/$5B/$10B/$50B monthly)
//   Task 4: Revenue (5 MITHQAL + 6 Bank streams, separated)
//   Task 5: Cost model (16 categories)
//   Task 6: Capital model (7 types + runway)
//   Task 7: Break-even (institutions, volume, corridors, burn, EBITDA, FCF)
//   Task 8: Fee compression stress (25%/50%/75%)
//   Task 9: Low adoption stress (5 scenarios)
//   Task 10: Honest sustainability assessment
// =================================================================

// ---- Task 1-3: Scenarios ----

export type Scenario = "CONSERVATIVE" | "BASE" | "AGGRESSIVE";

export interface ScenarioConfig {
  name: Scenario;
  description: string;
  year1Institutions: number;
  year3Institutions: number;
  year5Institutions: number;
  year1MonthlyVolume: number;
  year3MonthlyVolume: number;
  year5MonthlyVolume: number;
  year1Corridors: number;
  year3Corridors: number;
  year5Corridors: number;
  adoptionCurve: string;
}

export const SCENARIOS: Record<Scenario, ScenarioConfig> = {
  CONSERVATIVE: {
    name: "CONSERVATIVE",
    description: "Slow adoption, low volume, few corridors. Tests downside survival.",
    year1Institutions: 3,
    year3Institutions: 8,
    year5Institutions: 15,
    year1MonthlyVolume: 50_000_000,    // $50M
    year3MonthlyVolume: 200_000_000,   // $200M
    year5MonthlyVolume: 500_000_000,   // $500M
    year1Corridors: 2,
    year3Corridors: 5,
    year5Corridors: 8,
    adoptionCurve: "3→8→15 institutions over 5 years. Realistic for a new wholesale settlement infrastructure.",
  },
  BASE: {
    name: "BASE",
    description: "Moderate adoption, growing volume, expanding corridors. Planning baseline.",
    year1Institutions: 10,
    year3Institutions: 50,
    year5Institutions: 100,
    year1MonthlyVolume: 100_000_000,   // $100M
    year3MonthlyVolume: 1_000_000_000, // $1B
    year5MonthlyVolume: 5_000_000_000, // $5B
    year1Corridors: 4,
    year3Corridors: 10,
    year5Corridors: 20,
    adoptionCurve: "10→50→100 institutions over 5 years. Achievable with strong bank partnerships.",
  },
  AGGRESSIVE: {
    name: "AGGRESSIVE",
    description: "Rapid adoption, high volume, many corridors. Best-case scenario.",
    year1Institutions: 25,
    year3Institutions: 250,
    year5Institutions: 500,
    year1MonthlyVolume: 500_000_000,   // $500M
    year3MonthlyVolume: 10_000_000_000, // $10B
    year5MonthlyVolume: 50_000_000_000,  // $50B
    year1Corridors: 8,
    year3Corridors: 30,
    year5Corridors: 50,
    adoptionCurve: "25→250→500 institutions over 5 years. Requires exceptional execution + market timing.",
  },
};

// ---- Task 4: Revenue Model ----

export interface MITHQALRevenueBreakdown {
  issuanceFee: number;       // 1 bp on issuance volume
  settlementFee: number;     // 1 bp on settlement volume
  redemptionFee: number;    // 1 bp on redemption volume
  connectivityFee: number;  // $10K/month per institution
  enterpriseFee: number;   // $50K/month flat
  total: number;
}

export interface BankRevenueBreakdown {
  originationFee: number;   // 5 bps on issuance
  fxServiceFee: number;     // 8 bps on FX volume
  settlementFee: number;    // 3 bps on settlement
  treasuryService: number;  // $10K/month per institution
  liquidityService: number; // 2 bps on liquidity provided
  corporateServices: number; // $2.5K/month per corporate account
  total: number;
}

export interface RevenueModel {
  mithqal: MITHQALRevenueBreakdown;
  bank: BankRevenueBreakdown;
  total: number;
}

export function computeRevenue(institutions: number, monthlyVolume: number, redemptionVolume: number, fxVolume: number, corporateAccounts: number): RevenueModel {
  // MITHQAL revenue (5 streams)
  const issuanceFee = monthlyVolume * 0.0001;      // 1 bp
  const settlementFee = monthlyVolume * 0.0001;    // 1 bp
  const redemptionFee = redemptionVolume * 0.0001; // 1 bp
  const connectivityFee = institutions * 10_000;    // $10K/month per institution
  const enterpriseFee = 50_000;                   // $50K/month flat
  const mithqalTotal = issuanceFee + settlementFee + redemptionFee + connectivityFee + enterpriseFee;

  // Bank revenue (6 streams — per-bank, summed)
  const bankOrigination = monthlyVolume * 0.0005;    // 5 bps
  const bankFx = fxVolume * 0.0008;                  // 8 bps
  const bankSettlement = monthlyVolume * 0.0003;    // 3 bps
  const bankTreasury = institutions * 10_000;        // $10K/month per institution
  const bankLiquidity = monthlyVolume * 0.10 * 0.0002; // 2 bps on 10% liquidity provided
  const bankCorporate = corporateAccounts * 2_500;  // $2.5K/month per corporate account
  const bankTotal = bankOrigination + bankFx + bankSettlement + bankTreasury + bankLiquidity + bankCorporate;

  return {
    mithqal: {
      issuanceFee: Math.round(issuanceFee),
      settlementFee: Math.round(settlementFee),
      redemptionFee: Math.round(redemptionFee),
      connectivityFee: Math.round(connectivityFee),
      enterpriseFee,
      total: Math.round(mithqalTotal),
    },
    bank: {
      originationFee: Math.round(bankOrigination),
      fxServiceFee: Math.round(bankFx),
      settlementFee: Math.round(bankSettlement),
      treasuryService: Math.round(bankTreasury),
      liquidityService: Math.round(bankLiquidity),
      corporateServices: Math.round(bankCorporate),
      total: Math.round(bankTotal),
    },
    total: Math.round(mithqalTotal + bankTotal),
  };
}

// ---- Task 5: Cost Model ----

export interface CostModel {
  personnel: number;
  cloud: number;
  cybersecurity: number;
  hsmMpc: number;
  custody: number;
  insurance: number;
  compliance: number;
  legal: number;
  regulatory: number;
  externalAudit: number;
  financialAudit: number;
  modelValidation: number;
  bankingIntegration: number;
  support: number;
  disasterRecovery: number;
  infrastructureRedundancy: number;
  total: number;
}

export function computeCosts(institutions: number, volume: number, year: number): CostModel {
  // Costs scale with institutions + volume, but have fixed minimums
  const scale = Math.max(1, institutions / 10);
  const volumeScale = Math.max(1, volume / 100_000_000);

  return {
    personnel: 500_000 + 50_000 * scale + 100_000 * (year - 1),  // $500K-$2M/year
    cloud: 50_000 + 10_000 * volumeScale,
    cybersecurity: 100_000 + 20_000 * scale,
    hsmMpc: 80_000 + 15_000 * scale,
    custody: 150_000 + 30_000 * scale,  // Custody fees (allocated)
    insurance: 200_000 + 50_000 * volumeScale,
    compliance: 150_000 + 30_000 * scale,
    legal: 200_000 + 50_000 * scale,
    regulatory: 100_000 + 20_000 * scale,
    externalAudit: 150_000,  // Big-4 audit
    financialAudit: 100_000,
    modelValidation: 80_000,
    bankingIntegration: 100_000 + 20_000 * scale,
    support: 80_000 + 15_000 * scale,
    disasterRecovery: 100_000 + 20_000 * scale,
    infrastructureRedundancy: 120_000 + 25_000 * scale,
    total: 0, // calculated below
  };
  // Note: total computed in caller
}

export function computeTotalCost(costs: Omit<CostModel, "total">): number {
  return Object.values(costs).reduce((a, b) => a + b, 0);
}

// ---- Task 6: Capital Model ----

export interface CapitalModel {
  startupCapital: number;
  regulatoryCapital: number;
  operationalReserve: number;  // 12 months operating costs
  emergencyCapital: number;   // ILPS Layer 5 equivalent
  liquidityCapital: number;   // ILPS initial funding
  minimumRequiredCapital: number;
  capitalRunwayMonths: number; // at current burn rate
}

export function computeCapitalModel(annualOperatingCost: number, monthlyRevenue: number): CapitalModel {
  const startupCapital = 5_000_000;     // $5M seed
  const regulatoryCapital = 2_000_000;   // Estimated licensing + regulatory capital
  const operationalReserve = annualOperatingCost; // 12 months
  const emergencyCapital = 5_400_000;    // 10% of $54M liability
  const liquidityCapital = 10_000_000;  // ILPS initial
  const minimumRequiredCapital = startupCapital + regulatoryCapital + operationalReserve + emergencyCapital + liquidityCapital;

  const monthlyBurn = Math.max(0, annualOperatingCost / 12 - monthlyRevenue);
  const capitalRunwayMonths = monthlyBurn > 0 ? Math.floor(minimumRequiredCapital / monthlyBurn) : Infinity;

  return {
    startupCapital,
    regulatoryCapital,
    operationalReserve,
    emergencyCapital,
    liquidityCapital,
    minimumRequiredCapital,
    capitalRunwayMonths,
  };
}

// ---- Task 7: Break-Even ----

export interface BreakEvenAnalysis {
  breakEvenInstitutions: number;
  breakEvenMonthlyVolume: number;
  breakEvenCorridors: number;
  monthlyBurn: number;
  annualCashFlow: number;
  ebitda: number;
  freeCashFlow: number;
  isBreakEven: boolean;
}

export function computeBreakEven(
  monthlyRevenue: number,
  monthlyCost: number,
  institutions: number,
  corridors: number,
  capitalExpenditure: number,
): BreakEvenAnalysis {
  const monthlyBurn = Math.max(0, monthlyCost - monthlyRevenue);
  const annualRevenue = monthlyRevenue * 12;
  const annualCost = monthlyCost * 12;
  const ebitda = annualRevenue - annualCost;
  const freeCashFlow = ebitda - capitalExpenditure;

  // Break-even: revenue ≥ cost
  const isBreakEven = monthlyRevenue >= monthlyCost;

  // Estimate break-even institutions (linear approximation)
  const revenuePerInstitution = institutions > 0 ? monthlyRevenue / institutions : 0;
  const costPerInstitution = institutions > 0 ? monthlyCost / institutions : 0;
  const breakEvenInstitutions = revenuePerInstitution > 0
    ? Math.ceil(monthlyCost / revenuePerInstitution)
    : Infinity;

  // Break-even volume (at fixed institutions)
  const variableRevenueRate = 0.0003; // 3 bps total variable (1+1+1 MITHQAL)
  const fixedRevenue = institutions * 10_000 + 50_000;
  const breakEvenMonthlyVolume = Math.max(0, (monthlyCost - fixedRevenue) / variableRevenueRate);

  const breakEvenCorridors = Math.ceil(breakEvenInstitutions / 5); // ~5 institutions per corridor

  return {
    breakEvenInstitutions,
    breakEvenMonthlyVolume: Math.round(breakEvenMonthlyVolume),
    breakEvenCorridors,
    monthlyBurn: Math.round(monthlyBurn),
    annualCashFlow: Math.round(ebitda),
    ebitda: Math.round(ebitda),
    freeCashFlow: Math.round(freeCashFlow),
    isBreakEven,
  };
}

// ---- Task 8: Fee Compression Stress ----

export interface FeeCompressionResult {
  compressionPct: number;
  mithqalRevenueBefore: number;
  mithqalRevenueAfter: number;
  bankRevenueBefore: number;
  bankRevenueAfter: number;
  isBreakEven: boolean;
  verdict: string;
}

export function stressFeeCompression(revenue: RevenueModel, monthlyCost: number, compressionPct: number): FeeCompressionResult {
  const factor = 1 - compressionPct;
  const mithqalAfter = revenue.mithqal.total * factor;
  const bankAfter = revenue.bank.total * factor;
  const isBreakEven = mithqalAfter >= monthlyCost;

  return {
    compressionPct,
    mithqalRevenueBefore: revenue.mithqal.total,
    mithqalRevenueAfter: Math.round(mithqalAfter),
    bankRevenueBefore: revenue.bank.total,
    bankRevenueAfter: Math.round(bankAfter),
    isBreakEven,
    verdict: isBreakEven
      ? `SUSTAINABLE at ${compressionPct * 100}% fee compression`
      : `UNSUSTAINABLE at ${compressionPct * 100}% fee compression — MITHQAL revenue $${Math.round(mithqalAfter).toLocaleString()} < cost $${Math.round(monthlyCost).toLocaleString()}`,
  };
}

// ---- Task 9: Low Adoption Stress ----

export interface LowAdoptionScenario {
  scenario: string;
  description: string;
  institutions: number;
  monthlyVolume: number;
  mithqalRevenue: number;
  monthlyCost: number;
  monthlyBurn: number;
  runwayMonths: number;
  survives: boolean;
}

export function stressLowAdoption(baseCost: number, capital: number): LowAdoptionScenario[] {
  const scenarios: LowAdoptionScenario[] = [];

  const configs = [
    { name: "Slow Adoption", desc: "Only 2 institutions after Year 1", inst: 2, vol: 20_000_000 },
    { name: "Pilot Delay", desc: "Pilot delayed 12 months — 0 institutions", inst: 0, vol: 0 },
    { name: "Regulatory Delay", desc: "Licensing delayed — 1 institution, limited volume", inst: 1, vol: 5_000_000 },
    { name: "Corridor Delay", desc: "Only 1 corridor active — 3 institutions, low volume", inst: 3, vol: 30_000_000 },
    { name: "One-Bank Exit", desc: "Largest bank exits — lose 30% volume", inst: 7, vol: 70_000_000 },
  ];

  for (const c of configs) {
    const fixedRev = c.inst * 10_000 + 50_000;
    const varRev = c.vol * 0.0003;
    const totalRev = fixedRev + varRev;
    const burn = Math.max(0, baseCost - totalRev);
    const runway = burn > 0 ? Math.floor(capital / burn) : Infinity;

    scenarios.push({
      scenario: c.name,
      description: c.desc,
      institutions: c.inst,
      monthlyVolume: c.vol,
      mithqalRevenue: Math.round(totalRev),
      monthlyCost: Math.round(baseCost),
      monthlyBurn: Math.round(burn),
      runwayMonths: runway,
      survives: runway >= 18, // Need at least 18 months runway
    });
  }

  return scenarios;
}

// ---- Task 10: Honest Sustainability Assessment ----

export interface SustainabilityAssessment {
  revenueExceedsCost: boolean;
  requiredCapitalFunded: boolean;
  liquidityRequirementsFunded: boolean;
  adoptionAssumptionsRealistic: boolean;
  downsideCaseSurvives: boolean;
  minimumViableNetwork: { institutions: number; monthlyVolume: number; corridors: number };
  overallVerdict: "COMMERCIALLY SUSTAINABLE" | "MARGINALLY SUSTAINABLE" | "NOT COMMERCIALLY SUSTAINABLE";
  honestStatement: string;
}

export function assessSustainability(
  baseRevenue: number,
  baseCost: number,
  conservativeRevenue: number,
  conservativeCost: number,
  minimumRequiredCapital: number,
  capitalRaised: number,
  liquidityCapital: number,
  liquidityFunded: boolean,
  downsideRunway: number,
  breakEvenInstitutions: number,
  breakEvenVolume: number,
  breakEvenCorridors: number,
): SustainabilityAssessment {
  const revenueExceedsCost = baseRevenue >= baseCost;
  const requiredCapitalFunded = capitalRaised >= minimumRequiredCapital;
  const liquidityRequirementsFunded = liquidityFunded;
  const adoptionAssumptionsRealistic = breakEvenInstitutions <= 25; // ≤25 institutions is achievable
  const downsideCaseSurvives = downsideRunway >= 18;

  const passCount = [revenueExceedsCost, requiredCapitalFunded, liquidityRequirementsFunded, adoptionAssumptionsRealistic, downsideCaseSurvives].filter(Boolean).length;

  const overallVerdict = passCount === 5 ? "COMMERCIALLY SUSTAINABLE"
    : passCount >= 3 ? "MARGINALLY SUSTAINABLE"
    : "NOT COMMERCIALLY SUSTAINABLE";

  return {
    revenueExceedsCost,
    requiredCapitalFunded,
    liquidityRequirementsFunded,
    adoptionAssumptionsRealistic,
    downsideCaseSurvives,
    minimumViableNetwork: {
      institutions: breakEvenInstitutions,
      monthlyVolume: breakEvenVolume,
      corridors: breakEvenCorridors,
    },
    overallVerdict,
    honestStatement: `
HONEST ASSESSMENT:
- Base case revenue ($${Math.round(baseRevenue).toLocaleString()}/month) ${revenueExceedsCost ? "EXCEEDS" : "DOES NOT EXCEED"} cost ($${Math.round(baseCost).toLocaleString()}/month).
- Required capital ($${minimumRequiredCapital.toLocaleString()}) ${requiredCapitalFunded ? "IS" : "IS NOT"} funded (raised: $${capitalRaised.toLocaleString()}).
- Liquidity capital ($${liquidityCapital.toLocaleString()}) ${liquidityRequirementsFunded ? "IS" : "IS NOT"} funded.
- Break-even network: ${breakEvenInstitutions} institutions, $${breakEvenVolume.toLocaleString()}/month volume, ${breakEvenCorridors} corridors.
- Downside case runway: ${downsideRunway} months ${downsideCaseSurvives ? "(SURVIVES ≥18 months)" : "(DOES NOT SURVIVE 18 months)"}.
- Overall: ${overallVerdict}.
- ${overallVerdict === "COMMERCIALLY SUSTAINABLE" ? "The system is commercially sustainable. Revenue exceeds cost, capital is funded, downside survives." : overallVerdict === "MARGINALLY SUSTAINABLE" ? "The system is MARGINALLY sustainable. Some criteria not met. Address before production." : "The system is NOT commercially sustainable at current assumptions. Capital injection or cost reduction required."}
`,
  };
}
