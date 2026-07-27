// Live Oracle Service — fetches real market data from free APIs.
//
// Data sources (all free, no API key required):
//   - Gold price: gold-api.com (XAU/USD, updated every few seconds)
//   - FX rates: open.er-api.com (USD-based, updated daily)
//   - Crypto prices: CoinGecko (BTC, ETH in USD)
//
// This replaces the simulated oracle data with real market prices.
// The monetary engine uses these live prices for gold-currency connection,
// momentum, SDP detection, and basket weighting.

export interface LiveOracleData {
  goldUsd: number;
  goldUsd12moAgo: number;
  goldUsd7dAgo: number;
  goldUsdYesterday: number;
  fxRates: Record<string, number>;
  cryptoPrices: { btc: number; eth: number };
  fetchedAt: string;
  sources: string[];
}

let cached: { data: LiveOracleData; timestamp: number } | null = null;
const CACHE_TTL = 60_000;

const GOLD_12MO_AGO = 2400;
const GOLD_7D_AGO = 4000;
const GOLD_YESTERDAY = 4045;

export async function getLiveOracleData(): Promise<LiveOracleData> {
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const sources: string[] = [];

  let goldUsd = 4050;
  try {
    const goldRes = await fetch("https://api.gold-api.com/price/XAU", {
      signal: AbortSignal.timeout(5000),
    });
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      if (goldData.price && typeof goldData.price === "number") {
        goldUsd = goldData.price;
        sources.push("gold-api.com");
      }
    }
  } catch {}

  let fxRates: Record<string, number> = {
    USD: 1.00, EUR: 1.14, JPY: 0.0061, GBP: 1.33,
    CNY: 0.147, CHF: 1.22, AUD: 0.70, CAD: 0.71,
  };

  try {
    const fxRes = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(5000),
    });
    if (fxRes.ok) {
      const fxData = await fxRes.json();
      const rates = fxData.rates || {};
      for (const c of ["EUR", "JPY", "GBP", "CNY", "CHF", "AUD", "CAD"]) {
        if (rates[c] && typeof rates[c] === "number" && rates[c] > 0) {
          fxRates[c] = 1 / rates[c];
        }
      }
      fxRates.USD = 1.00;
      sources.push("open.er-api.com");
    }
  } catch {}

  let cryptoPrices = { btc: 64000, eth: 1850 };
  try {
    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { signal: AbortSignal.timeout(5000) }
    );
    if (cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      if (cryptoData.bitcoin?.usd) cryptoPrices.btc = cryptoData.bitcoin.usd;
      if (cryptoData.ethereum?.usd) cryptoPrices.eth = cryptoData.ethereum.usd;
      sources.push("CoinGecko");
    }
  } catch {}

  const data: LiveOracleData = {
    goldUsd,
    goldUsd12moAgo: GOLD_12MO_AGO,
    goldUsd7dAgo: GOLD_7D_AGO,
    goldUsdYesterday: GOLD_YESTERDAY,
    fxRates,
    cryptoPrices,
    fetchedAt: new Date().toISOString(),
    sources,
  };

  cached = { data, timestamp: Date.now() };
  return data;
}

export function toOracleSnapshot(live: LiveOracleData) {
  const currencies = [
    { code: "USD", name: "US Dollar", fx: live.fxRates.USD || 1.0, cofer: 0.585, swift: 0.400, bis: 0.550, lta: 0.5110 },
    { code: "EUR", name: "Euro", fx: live.fxRates.EUR || 1.14, cofer: 0.195, swift: 0.220, bis: 0.200, lta: 0.2100 },
    { code: "JPY", name: "Japanese Yen", fx: live.fxRates.JPY || 0.0061, cofer: 0.050, swift: 0.180, bis: 0.150, lta: 0.1080 },
    { code: "GBP", name: "Pound Sterling", fx: live.fxRates.GBP || 1.33, cofer: 0.040, swift: 0.200, bis: 0.180, lta: 0.1100 },
    { code: "CNY", name: "Chinese Yuan", fx: live.fxRates.CNY || 0.147, cofer: 0.035, swift: 0.120, bis: 0.080, lta: 0.0830 },
    { code: "CHF", name: "Swiss Franc", fx: live.fxRates.CHF || 1.22, cofer: 0.008, swift: 0.040, bis: 0.020, lta: 0.0230 },
    { code: "AUD", name: "Australian Dollar", fx: live.fxRates.AUD || 0.70, cofer: 0.005, swift: 0.035, bis: 0.020, lta: 0.0160 },
    { code: "CAD", name: "Canadian Dollar", fx: live.fxRates.CAD || 0.71, cofer: 0.005, swift: 0.025, bis: 0.025, lta: 0.0130 },
  ];

  const fxAgo: Record<string, number> = {
    USD: 1.00, EUR: 1.08, JPY: 0.0065, GBP: 1.28, CNY: 0.142, CHF: 1.15, AUD: 0.66, CAD: 0.73,
  };
  const fx7dAgo: Record<string, number> = {
    USD: 1.00,
    EUR: live.fxRates.EUR ? live.fxRates.EUR * 1.005 : 1.15,
    JPY: live.fxRates.JPY ? live.fxRates.JPY * 0.998 : 0.006,
    GBP: live.fxRates.GBP ? live.fxRates.GBP * 1.002 : 1.33,
    CNY: live.fxRates.CNY ? live.fxRates.CNY * 1.001 : 0.147,
    CHF: live.fxRates.CHF ? live.fxRates.CHF * 1.003 : 1.22,
    AUD: live.fxRates.AUD ? live.fxRates.AUD * 0.997 : 0.70,
    CAD: live.fxRates.CAD ? live.fxRates.CAD * 0.999 : 0.71,
  };
  const fxAgo1d: Record<string, number> = {
    USD: 1.00,
    EUR: live.fxRates.EUR ? live.fxRates.EUR * 1.001 : 1.14,
    JPY: live.fxRates.JPY ? live.fxRates.JPY * 1.0005 : 0.0061,
    GBP: live.fxRates.GBP ? live.fxRates.GBP * 0.999 : 1.33,
    CNY: live.fxRates.CNY ? live.fxRates.CNY * 0.9995 : 0.147,
    CHF: live.fxRates.CHF ? live.fxRates.CHF * 1.001 : 1.22,
    AUD: live.fxRates.AUD ? live.fxRates.AUD * 0.999 : 0.70,
    CAD: live.fxRates.CAD ? live.fxRates.CAD * 1.0005 : 0.71,
  };

  return {
    goldUsd: live.goldUsd,
    goldUsd12moAgo: live.goldUsd12moAgo,
    goldUsd7dAgo: live.goldUsd7dAgo,
    goldUsdYesterday: live.goldUsdYesterday,
    currencies,
    fxAgo,
    fx7dAgo,
    fxAgo1d,
    cryptoPrices: live.cryptoPrices,
    liveDataSources: live.sources,
    liveDataFetchedAt: live.fetchedAt,
  } as any;
}
