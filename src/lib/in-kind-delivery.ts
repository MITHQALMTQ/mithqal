// v24.1.2 Layer 7 — In-Kind Emergency Reserve Delivery
// =================================================================
// Emergency mechanism for formally defined resolution / extraordinary
// liquidity events.
//
// Normal: Cash / Approved Digital / Sovereign
// Emergency: Pro-Rata Reserve Delivery
//
// CRITICAL: In-kind delivery preserves ownership of proportional
// reserve assets. It does NOT guarantee par value after market losses.
//
//   InKindValue = MarketValue(DeliveredAssets)
//   NOT: InKindValue = PAR
//
// Unless actual reserve value equals PAR, in-kind delivery delivers
// less than $1.00 per MTQ. This is mathematically honest.
//
// MiCA recognizes redemption against the value of referenced reserve
// assets and, for asset-referenced tokens, allows redemption through
// delivery of referenced assets in specified circumstances.
// =================================================================

export interface ReserveAssetSlice {
  asset: string;
  weight: number;      // pro-rata weight (0-1)
  marketValueUsd: number;
  deliveryEligible: boolean;
  deliveryForm: string;
}

export interface InKindDeliveryInput {
  mtqAmount: number;
  par: number;
  totalReserveValueUsd: number;
  totalSupply: number;
  assets: ReserveAssetSlice[];
  reserveState: string;
}

export interface InKindDeliveryResult {
  available: boolean;
  mtqAmount: number;
  parValueUsd: number;         // what PAR says it's worth: mtqAmount × PAR
  marketValueUsd: number;      // what the pro-rata assets are actually worth
  discountToPar: number;       // (parValue - marketValue) / parValue — can be positive
  premiumToPar: number;        // (marketValue - parValue) / parValue — if reserves > PAR
  deliveredAssets: Array<{
    asset: string;
    weight: number;
    deliveryForm: string;
    marketValueUsd: number;
    percentageOfDelivery: number;
  }>;
  reserveState: string;
  activationConditions: string[];
  legalDisclaimer: string;
  timestamp: string;
}

export function computeInKindDelivery(input: InKindDeliveryInput): InKindDeliveryResult {
  // Pro-rata share of reserves
  const proRataShare = input.totalSupply > 0 ? input.mtqAmount / input.totalSupply : 0;

  // What PAR says the MTQ is worth
  const parValueUsd = input.mtqAmount * input.par;

  // What the pro-rata reserve assets are actually worth
  const marketValueUsd = input.totalReserveValueUsd * proRataShare;

  const discountToPar = parValueUsd > 0
    ? Math.max(0, (parValueUsd - marketValueUsd) / parValueUsd)
    : 0;
  const premiumToPar = parValueUsd > 0
    ? Math.max(0, (marketValueUsd - parValueUsd) / parValueUsd)
    : 0;

  // Build delivery basket (only eligible assets)
  const eligibleAssets = input.assets.filter(a => a.deliveryEligible);
  const totalEligibleWeight = eligibleAssets.reduce((s, a) => s + a.weight, 0);

  const deliveredAssets = eligibleAssets.map(a => ({
    asset: a.asset,
    weight: totalEligibleWeight > 0 ? a.weight / totalEligibleWeight : 0,
    deliveryForm: a.deliveryForm,
    marketValueUsd: Math.round(marketValueUsd * (totalEligibleWeight > 0 ? a.weight / totalEligibleWeight : 0) * 100) / 100,
    percentageOfDelivery: totalEligibleWeight > 0 ? Math.round((a.weight / totalEligibleWeight) * 10000) / 100 : 0,
  }));

  // Available only in CRISIS or RECOVERY states (formally defined resolution events)
  const available = input.reserveState === "CRISIS" || input.reserveState === "HIGH_STRESS";

  const activationConditions = [
    "Formally declared resolution or extraordinary liquidity event",
    "Cash/stablecoin redemption unavailable or insufficient",
    "4-of-5 institutional governance approval",
    "Transparent valuation at time of delivery (mark-to-market)",
    "Pro-rata allocation across all eligible reserve assets",
    "In-kind delivery does NOT guarantee PAR — delivers market value",
  ];

  return {
    available,
    mtqAmount: input.mtqAmount,
    parValueUsd: Math.round(parValueUsd * 100) / 100,
    marketValueUsd: Math.round(marketValueUsd * 100) / 100,
    discountToPar: Math.round(discountToPar * 10000) / 100,
    premiumToPar: Math.round(premiumToPar * 10000) / 100,
    deliveredAssets,
    reserveState: input.reserveState,
    activationConditions,
    legalDisclaimer:
      "In-kind delivery preserves ownership of proportional reserve assets. " +
      "It does NOT guarantee par value after market losses. " +
      "InKindValue = MarketValue(DeliveredAssets), NOT InKindValue = PAR. " +
      "MiCA allows redemption through delivery of referenced assets in specified circumstances, " +
      "but requires stressed-redemption procedures and transparent valuation.",
    timestamp: new Date().toISOString(),
  };
}
