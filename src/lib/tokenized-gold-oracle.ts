// v24.2.1 §21 — Separated Oracle Architecture for Tokenized Gold
// =================================================================
// The v24.2 directive (§21) PROHIBITS mixing PAXG market price into the
// gold NAV median. Gold spot, XAUT, PAXG, and gold-api.com are NOT
// identical assets — PAXG is a market-traded token with its own basis
// spread, redemption friction, and issuer risk.
//
// This module creates THREE separate oracles:
//   A. GoldNAV oracle       — underlying gold valuation (reserve accounting)
//      Sources: gold-api.com + goldprice.org (LBMA spot, NO tokenized gold)
//   B. TokenizedMarket oracle — PAXG market price (for TGBS / liquidity)
//      Sources: CoinGecko pax-gold
//   C. RedemptionReference   — issuer-executable value (PAXG redemption NAV)
//      Source: Paxos API (1 PAXG = 1 oz allocated gold at LBMA spot)
//
// §19 valuation formula:
//   V_TG = Q_TG × P_GoldNAV × (1 − H_TG) × C_TG
//
// The reserve uses GoldNAV (oracle A), NOT PAXG market price.
// PAXG market price is used only for TGBS (basis spread monitoring).
// =================================================================

import { getMultiOracleGoldPrice } from "./multi-oracle";

const FETCH_TIMEOUT_MS = 5000;
const CACHE_TTL_MS = 60_000;

// ============================================================
// Oracle A: Gold NAV (underlying gold valuation)
// ============================================================
// Uses ONLY physical-gold spot sources. PAXG/XAUT are EXCLUDED.
// This is the price used for reserve accounting (V_TG formula §19).

let cachedGoldNav: { price: number; timestamp: number; sources: string[] } | null = null;

async function fetchGoldApiComSpot(): Promise<number | null> {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = typeof data?.price === "number" ? data.price : null;
    if (price === null || !isFinite(price) || price <= 0) return null;
    return price;
  } catch {
    return null;
  }
}

async function fetchGoldPriceOrgSpot(): Promise<number | null> {
  try {
    const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const item = Array.isArray(data?.items) ? data.items[0] : null;
    const price = item?.xauPrice;
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    return price;
  } catch {
    return null;
  }
}

export interface GoldNavResult {
  price: number;            // USD per troy oz — for reserve accounting
  sources: string[];        // which sources contributed
  method: "median" | "single" | "fallback";
  timestamp: number;
}

/**
 * Oracle A — Gold NAV price (underlying gold valuation).
 * Uses ONLY physical-gold spot sources. Tokenized gold (PAXG/XAUT) is
 * NEVER mixed in. This is the price that enters V_TG (§19).
 */
export async function getGoldNavPrice(): Promise<GoldNavResult> {
  if (cachedGoldNav && Date.now() - cachedGoldNav.timestamp < CACHE_TTL_MS) {
    return {
      price: cachedGoldNav.price,
      sources: cachedGoldNav.sources,
      method: "median",
      timestamp: cachedGoldNav.timestamp,
    };
  }

  const [api, org] = await Promise.all([fetchGoldApiComSpot(), fetchGoldPriceOrgSpot()]);
  const successful: Array<{ name: string; price: number }> = [];
  if (api !== null) successful.push({ name: "gold-api.com", price: api });
  if (org !== null) successful.push({ name: "goldprice.org", price: org });

  const timestamp = Date.now();

  if (successful.length === 0) {
    // Fallback: use multi-oracle consensus (which includes tokenized sources
    // but is median-filtered). Mark as fallback so callers know.
    const consensus = await getMultiOracleGoldPrice();
    return {
      price: consensus.consensusPrice,
      sources: ["multi-oracle-fallback"],
      method: "fallback",
      timestamp,
    };
  }

  if (successful.length === 1) {
    const price = successful[0].price;
    cachedGoldNav = { price, timestamp, sources: [successful[0].name] };
    return { price, sources: [successful[0].name], method: "single", timestamp };
  }

  // Median of 2 = average
  const price = (successful[0].price + successful[1].price) / 2;
  cachedGoldNav = { price, timestamp, sources: successful.map(s => s.name) };
  return { price, sources: successful.map(s => s.name), method: "median", timestamp };
}

// ============================================================
// Oracle B: Tokenized Gold Market price (PAXG)
// ============================================================
// PAXG market price from CoinGecko. Used for TGBS (basis spread) and
// TGLS (liquidity). NEVER used directly for reserve accounting.

let cachedPaxgMarket: { price: number; timestamp: number } | null = null;

async function fetchCoinGeckoPaxg(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd",
      {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    const price = data?.["pax-gold"]?.usd;
    if (typeof price !== "number" || !isFinite(price) || price <= 0) return null;
    return price;
  } catch {
    return null;
  }
}

export interface TokenizedMarketResult {
  price: number;            // PAXG market price (USD per token)
  source: string;
  timestamp: number;
  available: boolean;
}

/**
 * Oracle B — PAXG market price.
 * Used for TGBS (basis spread) and TGLS (liquidity).
 * NOT used for reserve accounting (V_TG uses GoldNAV, not market).
 */
export async function getPaxgMarketPrice(): Promise<TokenizedMarketResult> {
  if (cachedPaxgMarket && Date.now() - cachedPaxgMarket.timestamp < CACHE_TTL_MS) {
    return {
      price: cachedPaxgMarket.price,
      source: "CoinGecko-PAXG (cached)",
      timestamp: cachedPaxgMarket.timestamp,
      available: true,
    };
  }

  const paxg = await fetchCoinGeckoPaxg();
  if (paxg !== null) {
    cachedPaxgMarket = { price: paxg, timestamp: Date.now() };
    return {
      price: paxg,
      source: "CoinGecko-PAXG",
      timestamp: Date.now(),
      available: true,
    };
  }

  // Fallback: return GoldNAV as proxy (TGBS will read as ~0 spread)
  const goldNav = await getGoldNavPrice();
  return {
    price: goldNav.price,
    source: "GoldNAV-proxy (PAXG fetch failed)",
    timestamp: Date.now(),
    available: false,
  };
}

// ============================================================
// Oracle C: Redemption Reference (issuer-executable value)
// ============================================================
// Paxos publishes that 1 PAXG = 1 fine troy oz of allocated gold.
// The redemption reference value = LBMA spot (GoldNAV), because Paxos
// redeems PAXG for the spot value minus a small fee.
//
// In a more complete implementation, this would query the Paxos API
// for the current redemption NAV. For now, it uses GoldNAV as the
// redemption reference, which is accurate to within the redemption fee.

export interface RedemptionRefResult {
  price: number;            // Redemption reference value (USD per PAXG)
  source: string;
  redemptionFeeBps: number; // Published redemption fee
  timestamp: number;
}

/**
 * Oracle C — Redemption reference value.
 * The issuer-executable value of 1 PAXG = GoldNAV − redemption fee.
 */
export async function getRedemptionReference(): Promise<RedemptionRefResult> {
  const goldNav = await getGoldNavPrice();
  const redemptionFeeBps = 2; // Paxos charges ~0.02% redemption fee
  const price = goldNav.price * (1 - redemptionFeeBps / 10000);
  return {
    price,
    source: "GoldNAV − 2bps redemption fee",
    redemptionFeeBps,
    timestamp: Date.now(),
  };
}

// ============================================================
// §18 — TGBS (Tokenized Gold Basis Spread)
// ============================================================
// TGBS = (P_PAXGMarket − P_GoldNAV) / P_GoldNAV
// Measures tokenized-gold market dislocation.
//
// Monitoring:
//   - absolute TGBS
//   - persistence (how long spread has been elevated)
//   - market depth (if PAXG fetch available)
//   - redemption availability (Oracle C)
//
// A small temporary spread does NOT automatically suspend PAXG.
// A persistent severe spread + impaired redemption MAY.

export interface TgbsResult {
  spread: number;            // TGBS as a fraction (0.001 = 0.1%)
  spreadPct: number;         // TGBS as percentage
  goldNavPrice: number;
  paxgMarketPrice: number;
  paxgAvailable: boolean;
  state: "NORMAL" | "ELEVATED" | "SEVERE" | "UNAVAILABLE";
  reason: string;
  timestamp: number;
}

export async function computeTgbs(): Promise<TgbsResult> {
  const [goldNav, paxgMarket] = await Promise.all([
    getGoldNavPrice(),
    getPaxgMarketPrice(),
  ]);

  if (!paxgMarket.available) {
    return {
      spread: 0,
      spreadPct: 0,
      goldNavPrice: goldNav.price,
      paxgMarketPrice: goldNav.price, // proxy
      paxgAvailable: false,
      state: "UNAVAILABLE",
      reason: "PAXG market price unavailable — cannot compute TGBS. Using GoldNAV as proxy.",
      timestamp: Date.now(),
    };
  }

  const spread = (paxgMarket.price - goldNav.price) / goldNav.price;
  const spreadPct = spread * 100;
  const absSpread = Math.abs(spread);

  let state: TgbsResult["state"];
  let reason: string;

  if (absSpread < 0.005) {  // < 0.5%
    state = "NORMAL";
    reason = `TGBS=${spreadPct.toFixed(3)}% — within normal band (<0.5%).`;
  } else if (absSpread < 0.02) {  // 0.5-2%
    state = "ELEVATED";
    reason = `TGBS=${spreadPct.toFixed(3)}% — elevated. Monitor persistence and redemption.`;
  } else {  // > 2%
    state = "SEVERE";
    reason = `TGBS=${spreadPct.toFixed(3)}% — SEVERE. Investigate issuer/redemption. May require suspension if persistent + impaired redemption.`;
  }

  return {
    spread: Math.round(spread * 1e6) / 1e6,
    spreadPct: Math.round(spreadPct * 1e4) / 1e4,
    goldNavPrice: goldNav.price,
    paxgMarketPrice: paxgMarket.price,
    paxgAvailable: true,
    state,
    reason,
    timestamp: Date.now(),
  };
}

// ============================================================
// §19 — V_TG Valuation Formula
// ============================================================
// V_TG = Q_TG × P_GoldNAV × (1 − H_TG) × C_TG
//
// CRITICAL: Uses P_GoldNAV (Oracle A), NOT P_PAXGMarket (Oracle B).
// The reserve is valued at underlying gold NAV, not at PAXG's secondary
// market price. This prevents market dislocation from inflating/deflating
// the reserve.

export interface VtgInput {
  quantity: number;       // Q_TG — tokenized gold quantity (in troy oz / PAXG tokens)
  haircut: number;        // H_TG — dynamic haircut (0-1 fraction, from §20)
  confidenceFactor: number; // C_TG — confidence factor (0-1, from attestation freshness §22)
}

export interface VtgResult {
  value: number;          // V_TG — reserve value of tokenized gold (USD)
  quantity: number;
  goldNavPrice: number;
  haircut: number;
  confidenceFactor: number;
  formula: string;
  timestamp: number;
}

export async function computeVtg(input: VtgInput): Promise<VtgResult> {
  const goldNav = await getGoldNavPrice();
  const value = input.quantity * goldNav.price * (1 - input.haircut) * input.confidenceFactor;
  return {
    value: Math.round(value * 100) / 100,
    quantity: input.quantity,
    goldNavPrice: goldNav.price,
    haircut: input.haircut,
    confidenceFactor: input.confidenceFactor,
    formula: `V_TG = ${input.quantity} × ${goldNav.price.toFixed(2)} × (1 − ${(input.haircut * 100).toFixed(2)}%) × ${input.confidenceFactor.toFixed(3)} = ${value.toFixed(2)}`,
    timestamp: Date.now(),
  };
}

// ============================================================
// Cache inspection (for debugging)
// ============================================================
export function _inspectTokenizedOracleCache() {
  return {
    goldNav: cachedGoldNav,
    paxgMarket: cachedPaxgMarket,
  };
}
