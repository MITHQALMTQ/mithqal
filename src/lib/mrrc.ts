// v24.1.1 MRRC — Marginal Reserve Risk Contribution
// =================================================================
// Implements MRRC per §12 of the Institutional Dynamic Reserve
// Rebalancing specification.
//
// MRRC_i = CVaR(W) - CVaR(W with marginal reduction in currency i)
//
// The rebalancer reduces currencies with excessive marginal
// contribution to portfolio tail risk.
//
// Uses finite-difference approximation with a simplified CVaR model.
// =================================================================

export interface AssetPosition {
  name: string;
  weight: number;      // portfolio weight (0-1)
  volatility: number;  // annualized volatility (0-1)
  expectedReturn: number; // expected return (can be 0 for risk-neutral)
}

export interface MrrcResult {
  asset: string;
  mrrc: number;        // marginal risk contribution
  weight: number;
  volatility: number;
  riskContributionPct: number; // % of total portfolio risk
}

export interface MrrcReport {
  cvar95: number;       // portfolio CVaR at 95%
  cvar99: number;       // portfolio CVaR at 99%
  totalRisk: number;
  results: MrrcResult[];
  timestamp: string;
}

/**
 * Simplified CVaR calculation using a normal approximation.
 * In production, this would use historical simulation or Monte Carlo.
 * CVaR_alpha ≈ -mean + z_alpha * sigma / (1-alpha)
 * where z_alpha is the z-score for the tail.
 */
function portfolioCVaR(
  positions: AssetPosition[],
  correlationMatrix: number[][],
  alpha: number = 0.05,
): number {
  const n = positions.length;
  if (n === 0) return 0;

  // Portfolio variance: W' × Σ × W
  // Simplified: use average correlation = 0.3 (moderate)
  const avgCorr = 0.3;
  let portfolioVariance = 0;

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const corr = i === j ? 1.0 : (correlationMatrix[i]?.[j] ?? avgCorr);
      portfolioVariance += positions[i].weight * positions[j].weight *
        positions[i].volatility * positions[j].volatility * corr;
    }
  }

  const portfolioSigma = Math.sqrt(Math.max(0, portfolioVariance));
  const portfolioMean = positions.reduce((s, p) => s + p.weight * p.expectedReturn, 0);

  // CVaR for normal distribution: -mean + (phi(z_alpha) / alpha) * sigma
  // phi(z_0.05) ≈ 1.645, phi(z_0.01) ≈ 2.326
  const z = alpha === 0.05 ? 1.645 : 2.326;
  const pdfZ = alpha === 0.05 ? 0.1031 : 0.0266;
  const cvar = -portfolioMean + (pdfZ / alpha) * portfolioSigma;

  return cvar;
}

/**
 * Compute MRRC for each asset using finite-difference.
 * MRRC_i = CVaR(W) - CVaR(W - epsilon_i)
 * where epsilon_i is a marginal reduction in asset i.
 */
export function computeMRRC(
  positions: AssetPosition[],
  correlationMatrix?: number[][],
): MrrcReport {
  const n = positions.length;
  if (n === 0) {
    return { cvar95: 0, cvar99: 0, totalRisk: 0, results: [], timestamp: new Date().toISOString() };
  }

  // Build default correlation matrix if not provided (average corr = 0.3)
  const corr = correlationMatrix || Array(n).fill(0).map((_, i) =>
    Array(n).fill(0).map((_, j) => i === j ? 1.0 : 0.3)
  );

  // Base CVaR
  const cvar95 = portfolioCVaR(positions, corr, 0.05);
  const cvar99 = portfolioCVaR(positions, corr, 0.01);

  // Compute MRRC for each asset
  const results: MrrcResult[] = [];
  const epsilon = 0.01; // 1% marginal reduction

  for (let i = 0; i < n; i++) {
    // Create reduced portfolio
    const reducedPositions = positions.map((p, j) => ({
      ...p,
      weight: j === i ? Math.max(0, p.weight - epsilon) : p.weight,
    }));

    // Renormalize weights to sum to 1
    const totalWeight = reducedPositions.reduce((s, p) => s + p.weight, 0);
    if (totalWeight > 0) {
      reducedPositions.forEach(p => { p.weight /= totalWeight; });
    }

    const reducedCvar95 = portfolioCVaR(reducedPositions, corr, 0.05);
    const mrrc = cvar95 - reducedCvar95; // positive = reducing this asset reduces risk

    results.push({
      asset: positions[i].name,
      mrrc: Math.round(mrrc * 1e8) / 1e8,
      weight: Math.round(positions[i].weight * 1e6) / 1e6,
      volatility: positions[i].volatility,
      riskContributionPct: 0, // filled below
    });
  }

  // Normalize to get % contribution
  const totalMrrc = results.reduce((s, r) => s + Math.max(0, r.mrrc), 0);
  for (const r of results) {
    r.riskContributionPct = totalMrrc > 0
      ? Math.round((Math.max(0, r.mrrc) / totalMrrc) * 10000) / 100
      : 0;
  }

  // Sort by MRRC descending (highest risk contributors first)
  results.sort((a, b) => b.mrrc - a.mrrc);

  return {
    cvar95: Math.round(cvar95 * 1e6) / 1e6,
    cvar99: Math.round(cvar99 * 1e6) / 1e6,
    totalRisk: Math.round(cvar95 * 1e6) / 1e6,
    results,
    timestamp: new Date().toISOString(),
  };
}
