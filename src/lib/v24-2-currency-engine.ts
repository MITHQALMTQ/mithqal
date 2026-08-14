// v24.2 §16-20 — Currency Structural Weight + Effective USD Exposure
// =================================================================
// New structural weight formula:
//   Base_i = 0.35×COFER_i + 0.25×FXTurnover_i + 0.20×TradeSettlement_i + 0.20×InstitutionalQuality_i
//
// Effective USD Exposure:
//   Includes direct USD + USD stablecoins + USD tokenized + pegged AED/SAR
//   Target ≤30%, Ceiling ≤35%
// =================================================================

// ---- Institutional Quality Subcomponents (§17) ----
export interface InstitutionalQualityComponents {
  creditQuality: number;      // 0-1 (sovereign rating)
  convertibility: number;     // 0-1 (capital controls risk)
  liquidity: number;          // 0-1 (market depth)
  settlementUtility: number;  // 0-1 (SWIFT/payment rail)
  custodyReliability: number; // 0-1 (banking system quality)
  legalStability: number;     // 0-1 (rule of law)
  geopoliticalRisk: number;   // 0-1 (inverted — 1 = safe, 0 = high risk)
  marketDepth: number;        // 0-1 (BIS turnover)
}

export function computeInstitutionalQuality(
  c: InstitutionalQualityComponents,
): number {
  // Equal-weighted average of 8 subcomponents
  // Each subcomponent is 0-1, result is 0-1
  return (
    c.creditQuality * 0.15 +
    c.convertibility * 0.15 +
    c.liquidity * 0.15 +
    c.settlementUtility * 0.15 +
    c.custodyReliability * 0.10 +
    c.legalStability * 0.10 +
    c.geopoliticalRisk * 0.10 +
    c.marketDepth * 0.10
  );
}

// ---- Currency Data (normalized 0-1) ----
export interface CurrencyData {
  currency: string;
  coferShare: number;       // 0-1 (IMF COFER share, normalized)
  fxTurnoverShare: number;  // 0-1 (BIS Triennial, normalized)
  tradeSettlementShare: number; // 0-1 (SWIFT/trade settlement, normalized)
  institutionalQuality: number; // 0-1 (from computeInstitutionalQuality)
  quality: number;           // CQS / 10 (0-1)
  diversificationBenefit: number; // 0-1 (correlation-based)
  liquidityFactor: number;  // 0-1
  volatilityFactor: number; // 0-1 (inverted — 1 = low vol)
  geopoliticalFactor: number; // 0-1 (inverted — 1 = safe)
  convertibilityFactor: number; // 0-1
  isUsdPegged: boolean;     // AED, SAR = true
  usdEquivalenceFactor: number; // 0-1 (1.0 for full peg, 0 for floating)
}

// ---- Current v24.2 Currency Data ----
export const V24_2_CURRENCY_DATA: Record<string, CurrencyData> = {
  USD: {
    currency: "USD",
    coferShare: 0.584, fxTurnoverShare: 0.88, tradeSettlementShare: 0.42,
    institutionalQuality: 0.82, quality: 0.85, diversificationBenefit: 0.60,
    liquidityFactor: 1.0, volatilityFactor: 0.85, geopoliticalFactor: 0.70,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 1.0,
  },
  EUR: {
    currency: "EUR",
    coferShare: 0.20, fxTurnoverShare: 0.31, tradeSettlementShare: 0.32,
    institutionalQuality: 0.80, quality: 0.83, diversificationBenefit: 0.75,
    liquidityFactor: 0.95, volatilityFactor: 0.80, geopoliticalFactor: 0.75,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  CHF: {
    currency: "CHF",
    coferShare: 0.002, fxTurnoverShare: 0.05, tradeSettlementShare: 0.03,
    institutionalQuality: 0.95, quality: 0.90, diversificationBenefit: 0.85,
    liquidityFactor: 0.70, volatilityFactor: 0.90, geopoliticalFactor: 0.95,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  JPY: {
    currency: "JPY",
    coferShare: 0.055, fxTurnoverShare: 0.17, tradeSettlementShare: 0.08,
    institutionalQuality: 0.78, quality: 0.78, diversificationBenefit: 0.70,
    liquidityFactor: 0.90, volatilityFactor: 0.70, geopoliticalFactor: 0.80,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  GBP: {
    currency: "GBP",
    coferShare: 0.048, fxTurnoverShare: 0.13, tradeSettlementShare: 0.07,
    institutionalQuality: 0.80, quality: 0.80, diversificationBenefit: 0.72,
    liquidityFactor: 0.85, volatilityFactor: 0.78, geopoliticalFactor: 0.78,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  SGD: {
    currency: "SGD",
    coferShare: 0.002, fxTurnoverShare: 0.03, tradeSettlementShare: 0.04,
    institutionalQuality: 0.92, quality: 0.88, diversificationBenefit: 0.80,
    liquidityFactor: 0.60, volatilityFactor: 0.88, geopoliticalFactor: 0.92,
    convertibilityFactor: 0.90, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  AED: {
    currency: "AED",
    coferShare: 0.001, fxTurnoverShare: 0.01, tradeSettlementShare: 0.03,
    institutionalQuality: 0.75, quality: 0.75, diversificationBenefit: 0.40,
    liquidityFactor: 0.50, volatilityFactor: 0.95, geopoliticalFactor: 0.80,
    convertibilityFactor: 0.85, isUsdPegged: true, usdEquivalenceFactor: 1.0,
  },
  SAR: {
    currency: "SAR",
    coferShare: 0.001, fxTurnoverShare: 0.01, tradeSettlementShare: 0.02,
    institutionalQuality: 0.73, quality: 0.73, diversificationBenefit: 0.40,
    liquidityFactor: 0.50, volatilityFactor: 0.95, geopoliticalFactor: 0.75,
    convertibilityFactor: 0.85, isUsdPegged: true, usdEquivalenceFactor: 1.0,
  },
  CNY: {
    currency: "CNY",
    coferShare: 0.025, fxTurnoverShare: 0.07, tradeSettlementShare: 0.05,
    institutionalQuality: 0.55, quality: 0.46, diversificationBenefit: 0.85,
    liquidityFactor: 0.55, volatilityFactor: 0.75, geopoliticalFactor: 0.50,
    convertibilityFactor: 0.40, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  CAD: {
    currency: "CAD",
    coferShare: 0.027, fxTurnoverShare: 0.05, tradeSettlementShare: 0.03,
    institutionalQuality: 0.88, quality: 0.82, diversificationBenefit: 0.65,
    liquidityFactor: 0.70, volatilityFactor: 0.82, geopoliticalFactor: 0.88,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
  AUD: {
    currency: "AUD",
    coferShare: 0.017, fxTurnoverShare: 0.03, tradeSettlementShare: 0.02,
    institutionalQuality: 0.85, quality: 0.79, diversificationBenefit: 0.68,
    liquidityFactor: 0.65, volatilityFactor: 0.78, geopoliticalFactor: 0.88,
    convertibilityFactor: 1.0, isUsdPegged: false, usdEquivalenceFactor: 0.0,
  },
};

// ---- v24.2 Structural Weight Formula ----
export function computeStructuralBase(data: CurrencyData): number {
  // §16: Base_i = 0.35×COFER + 0.25×FXTurnover + 0.20×TradeSettlement + 0.20×InstitutionalQuality
  // BUT §16 also says: "InstitutionalQuality MUST NOT be multiplied a second time later"
  return (
    0.35 * data.coferShare +
    0.25 * data.fxTurnoverShare +
    0.20 * data.tradeSettlementShare +
    0.20 * data.institutionalQuality
  );
}

// ---- v24.2 Currency Weight Pipeline (§19) ----
export interface CurrencyWeightResult {
  currency: string;
  structuralBase: number;
  rawWeight: number;
  finalWeight: number;
  effectiveUsdExposure: number;
  isUsdPegged: boolean;
  lifecycleState: string;
}

export function computeCurrencyWeights(
  currencyWeights: Record<string, number>, // current allocation weights
): CurrencyWeightResult[] {
  const results: CurrencyWeightResult[] = [];
  let totalRawWeight = 0;

  // Compute raw weight for each currency
  for (const [ccy, data] of Object.entries(V24_2_CURRENCY_DATA)) {
    const base = computeStructuralBase(data);

    // §19: RawWeight = Base × Quality × DiversificationBenefit × Liquidity × Volatility × Geopolitical × Convertibility
    // NOTE: InstitutionalQuality is NOT multiplied again (§16 warning)
    const rawWeight =
      base *
      data.quality *
      data.diversificationBenefit *
      data.liquidityFactor *
      data.volatilityFactor *
      data.geopoliticalFactor *
      data.convertibilityFactor;

    results.push({
      currency: ccy,
      structuralBase: Math.round(base * 1e6) / 1e6,
      rawWeight: Math.round(rawWeight * 1e6) / 1e6,
      finalWeight: 0, // filled after normalization
      effectiveUsdExposure: 0, // filled below
      isUsdPegged: data.isUsdPegged,
      lifecycleState: "NORMAL",
    });

    totalRawWeight += rawWeight;
  }

  // Normalize to sum to 1.0 (fiat pillar)
  for (const r of results) {
    r.finalWeight = totalRawWeight > 0
      ? Math.round((r.rawWeight / totalRawWeight) * 1e8) / 1e8
      : 0;
  }

  return results.sort((a, b) => b.finalWeight - a.finalWeight);
}

// ---- Effective USD Exposure (§20) ----
export interface EffectiveUsdExposureResult {
  totalExposure: number;       // as fraction of total reserve (0-1)
  totalExposurePct: number;    // as percentage
  breakdown: {
    directUsdCash: number;
    directUsdSovereign: number;
    usdStablecoins: number;
    usdTokenized: number;
    peggedAed: number;
    peggedSar: number;
  };
  target: number;              // 30%
  ceiling: number;             // 35%
  withinTarget: boolean;
  withinCeiling: boolean;
  recommendation: string;
}

export function computeEffectiveUsdExposure(
  usdCashPct: number,        // USD cash as % of total reserve
  usdSovereignPct: number,   // USD sovereign as % of total reserve
  usdcPct: number,           // USDC as % of total reserve
  usdpPct: number,           // USDP as % of total reserve
  buidlPct: number,          // BUIDL as % of total reserve
  aedPct: number,            // AED (cash+sovereign) as % of total reserve
  sarPct: number,            // SAR (cash+sovereign) as % of total reserve
): EffectiveUsdExposureResult {
  // All inputs are in percentage (e.g., 27.0 for 27%)
  const directUsd = usdCashPct + usdSovereignPct;
  const usdStablecoins = usdcPct + usdpPct;
  const usdTokenized = buidlPct;
  const peggedAed = aedPct * 1.0;  // 100% USD-equivalent (pegged at 3.6725)
  const peggedSar = sarPct * 1.0;  // 100% USD-equivalent (pegged at 3.75)

  const totalExposure = directUsd + usdStablecoins + usdTokenized + peggedAed + peggedSar;

  const target = 30;
  const ceiling = 35;
  const withinTarget = totalExposure <= target;
  const withinCeiling = totalExposure <= ceiling;

  let recommendation = "Within target";
  if (!withinCeiling) {
    recommendation = `CRITICAL: Effective USD Exposure ${totalExposure.toFixed(1)}% exceeds 35% ceiling — reduce USD/pegged exposure immediately`;
  } else if (!withinTarget) {
    recommendation = `Effective USD Exposure ${totalExposure.toFixed(1)}% exceeds 30% target — consider reducing USD direct or pegged allocation`;
  }

  return {
    totalExposure: Math.round(totalExposure * 100) / 100,
    totalExposurePct: Math.round(totalExposure * 100) / 100,
    breakdown: {
      directUsdCash: usdCashPct,
      directUsdSovereign: usdSovereignPct,
      usdStablecoins,
      usdTokenized,
      peggedAed,
      peggedSar,
    },
    target,
    ceiling,
    withinTarget,
    withinCeiling,
    recommendation,
  };
}

// ---- v24.2 Strategic Reference Portfolio ----
export const V24_2_STRATEGIC_REFERENCE = {
  gold: 0.15,
  silver: 0.03,
  fiat: 0.795,
  digital: 0.025,
  total: 1.00,
};
