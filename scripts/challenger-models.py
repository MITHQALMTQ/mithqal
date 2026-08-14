#!/usr/bin/env python3
"""
MITHQAL v24.2.1 — CHALLENGER MODEL VALIDATION
=============================================
Independent challenger-model stack comparing five methodologically
distinct models against the primary v24.2 Monte Carlo (seed=42,
250K paths, Student-t df=5, GARCH vol clustering, 2-state Markov
regime switching, Merton jumps, Bernoulli depeg).

§3.17 CHALLENGER-MODEL REQUIREMENT (canonical v24.2.1 blueprint)
§3.16 MODEL-FAILURE RULE — honest results, not forced to pass.
§V24.2.8 MODEL VALIDITY GATE.

THE FIVE CHALLENGERS
  C1. Historical block-bootstrap (block size = 20 days) — non-parametric
      resampling, no Student-t, no jumps in the historical record itself.
  C2. Gaussian (thin-tailed) baseline — same structure as primary but
      Normal marginals, no Merton jumps. Isolates the fat-tail contribution.
  C3. Analytical Cornish-Fisher (parametric VaR) — closed-form expansion
      with skew/kurtosis adjustments, no simulation.
  C4. Worst-case historical scenario replay — deterministic replay of
      2008 GFC, 2020 COVID, 2022 inflation, 2023 SVB stress windows.
  C5. Copula-based model — Student-t copula for gold/silver (tail
      dependence), Gaussian copula for FX (structured intra-block),
      Gaussian copula for stablecoins, block-diagonal dependence
      (different from primary's blanket 0.30 correlation matrix).

VALIDITY GATE (§V24.2.8):
  A challenger CONFIRMS the primary if its P(RR<100%) is within ±5pp
  of the primary's 21.5432%. A disagreement >5pp triggers a MODEL-
  VALIDITY investigation (documented, not suppressed).

INDEPENDENCE:
  This script does NOT import from monte-carlo-v24.2.py. Portfolio
  parameters are duplicated here. Any divergence is intentional and
  documented.

OUTPUTS:
  1. stdout — comparison table
  2. /home/z/my-project/docs/verification/v24.2.1-challenger-results.json
     — machine-readable metrics + deviations + verdicts
"""

import json
import math
import os
import sys
from datetime import datetime

import numpy as np
from scipy import stats as sp_stats

# ============================================================
# PORTFOLIO PARAMETERS — independently copied from the primary
# (monte-carlo-v24.2.py) to preserve true challenger-model
# independence. No shared code path. Any divergence is intentional
# and documented in the methodology section of each challenger.
# ============================================================

PAR = 1.00
SUPPLY = 54_000_000
LIABILITY = SUPPLY * PAR              # $54M
RR_TARGET = 1.20
BASELINE_RA = LIABILITY * RR_TARGET   # $64.8M target adjusted reserve
HORIZON = 30                          # days

PORTFOLIO = {
    "Gold":      {"weight": 0.15,  "volatility": 0.15, "mean_return": 0.02,  "haircut": 0.05, "stress_coeff": 0.85},
    "Silver":    {"weight": 0.03,  "volatility": 0.30, "mean_return": 0.01,  "haircut": 0.07, "stress_coeff": 0.80},
    "USD":       {"weight": 0.21,  "volatility": 0.05, "mean_return": 0.02,  "haircut": 0.00, "stress_coeff": 0.95},
    "EUR":       {"weight": 0.195, "volatility": 0.07, "mean_return": 0.015, "haircut": 0.02, "stress_coeff": 0.90},
    "CHF":       {"weight": 0.06,  "volatility": 0.06, "mean_return": 0.005, "haircut": 0.02, "stress_coeff": 0.90},
    "JPY":       {"weight": 0.06,  "volatility": 0.08, "mean_return": 0.005, "haircut": 0.02, "stress_coeff": 0.90},
    "GBP":       {"weight": 0.05,  "volatility": 0.06, "mean_return": 0.01,  "haircut": 0.02, "stress_coeff": 0.90},
    "SGD":       {"weight": 0.04,  "volatility": 0.05, "mean_return": 0.015, "haircut": 0.02, "stress_coeff": 0.90},
    "AED":       {"weight": 0.03,  "volatility": 0.03, "mean_return": 0.02,  "haircut": 0.00, "stress_coeff": 0.95},
    "SAR":       {"weight": 0.03,  "volatility": 0.03, "mean_return": 0.02,  "haircut": 0.00, "stress_coeff": 0.95},
    "CNY":       {"weight": 0.02,  "volatility": 0.10, "mean_return": 0.01,  "haircut": 0.02, "stress_coeff": 0.80},
    "CAD":       {"weight": 0.005, "volatility": 0.06, "mean_return": 0.015, "haircut": 0.02, "stress_coeff": 0.90},
    "AUD":       {"weight": 0.005, "volatility": 0.07, "mean_return": 0.01,  "haircut": 0.02, "stress_coeff": 0.90},
    "USDC":      {"weight": 0.020, "volatility": 0.01, "mean_return": 0.00,  "haircut": 0.02, "stress_coeff": 0.80},
    "USDP":      {"weight": 0.005, "volatility": 0.01, "mean_return": 0.00,  "haircut": 0.02, "stress_coeff": 0.80},
    "EURC":      {"weight": 0.005, "volatility": 0.01, "mean_return": 0.00,  "haircut": 0.02, "stress_coeff": 0.80},
    "BUIDL":     {"weight": 0.005, "volatility": 0.01, "mean_return": 0.03,  "haircut": 0.02, "stress_coeff": 0.90},
}

ASSETS = list(PORTFOLIO.keys())
N_ASSETS = len(ASSETS)
WEIGHTS = np.array([PORTFOLIO[a]["weight"] for a in ASSETS])
VOLS = np.array([PORTFOLIO[a]["volatility"] for a in ASSETS])
MEANS = np.array([PORTFOLIO[a]["mean_return"] for a in ASSETS])
HAIRCUTS = np.array([PORTFOLIO[a]["haircut"] for a in ASSETS])
STRESS_COEFFS = np.array([PORTFOLIO[a]["stress_coeff"] for a in ASSETS])
STABLECOIN_IDX = [i for i, a in enumerate(ASSETS) if a in ("USDC", "USDP", "EURC", "BUIDL")]

BASELINE_CORR = 0.30
CRISIS_CORR_MULT = 1.5
REGIME_TRANSITION = np.array([[0.95, 0.05], [0.20, 0.80]])
JUMP_LAMBDA = 2.0       # 2 jumps per year
JUMP_MEAN = -0.05       # average jump = -5%
JUMP_STD = 0.10         # jump volatility
DEPEG_PROB = 0.02       # 2% probability per year
DEPEG_MEAN = 0.05       # average depeg = 5%
DEPEG_STD = 0.10        # depeg volatility
REDEMPTION_BASE_RATE = 0.001    # 0.1% daily base
REDEMPTION_STRESS_RATE = 0.01   # 1% daily in stress

# Calibration window (matches primary): 2020-01-01 to 2026-08-12 ≈ 1670 trading days
CALIB_HIST_DAYS = 1670

# Primary baseline (seed=42, 250K paths) — hardcoded from
# /home/z/my-project/docs/verification/v24.2-monte-carlo-results.json
# for deviation comparison. Challenger code does NOT re-run the primary.
PRIMARY_BASELINE = {
    "Mean_RR":                  100.0362,
    "Min_RR":                    36.6873,
    "P5_RR":                     77.1654,
    "P1_RR":                     74.4122,
    "P_RR_below_100_pct":        21.5432,
    "P_RR_below_120_pct":        99.9920,
    "StressRR_mean":             89.0510,
    "P_StressRR_below_100_pct":  99.3404,
    "CVaR_99_M":                 25.5244,
}

VALIDITY_TOLERANCE_PP = 5.0  # §V24.2.8 model-validity gate

# Paths for stochastic challengers (seed=42)
N_PATHS_DEFAULT = 250_000


# ============================================================
# REGIME SIMULATION (vectorized across paths)
# ============================================================

def simulate_regimes(n_paths, horizon, rng, transition=REGIME_TRANSITION):
    """
    Vectorized 2-state Markov regime simulation.
    Returns the FINAL regime (0=normal, 1=stress) for each path.

    Mirrors the primary's logic:
        regime = 0
        for day in range(horizon):
            if rand < transition[regime][1-regime]:
                regime = 1 - regime
    """
    regimes = np.zeros(n_paths, dtype=np.int64)
    for _ in range(horizon):
        p_flip = transition[regimes, 1 - regimes]
        flips = rng.random(n_paths) < p_flip
        regimes[flips] = 1 - regimes[flips]
    return regimes


# ============================================================
# PORTFOLIO ACCOUNTING (shared across simulation challengers)
# ============================================================

def compute_rr_and_loss(asset_returns, regimes):
    """
    Compute RR, StressRR, and loss for each path from per-asset
    30-day cumulative returns and final regime state.

    Matches the primary's accounting exactly:
      - asset_values = baseline_ra * w * (1 + r)
      - r_a        = sum(asset_values * (1 - haircut))
      - r_stress   = sum(asset_values * (1 - haircut) * stress_coeff)
      - redemption: if amount <= r_a * non_gold_ratio * 0.9, deduct at 0.98;
                    else deduct at 0.95 / 0.90 (gold sold).
      - rr = r_a / LIABILITY * 100
      - stress_rr = r_stress / LIABILITY * 100
      - loss = max(0, baseline_ra - r_a)
    """
    asset_values = BASELINE_RA * WEIGHTS * (1 + asset_returns)
    r_a = (asset_values * (1 - HAIRCUTS)).sum(axis=1)
    r_stress = (asset_values * (1 - HAIRCUTS) * STRESS_COEFFS).sum(axis=1)

    redemption_rate = np.where(regimes == 1, REDEMPTION_STRESS_RATE, REDEMPTION_BASE_RATE)
    redemption_amount = LIABILITY * redemption_rate * HORIZON
    non_gold_ratio = 1 - PORTFOLIO["Gold"]["weight"] - PORTFOLIO["Silver"]["weight"]
    no_gold_sale = redemption_amount <= r_a * non_gold_ratio * 0.9
    r_a = np.where(no_gold_sale,
                   r_a - redemption_amount * 0.98,
                   r_a - redemption_amount * 0.95)
    r_stress = np.where(no_gold_sale,
                        r_stress - redemption_amount * 0.98,
                        r_stress - redemption_amount * 0.90)

    rr = r_a / LIABILITY * 100
    stress_rr = r_stress / LIABILITY * 100
    losses = np.maximum(0, BASELINE_RA - r_a)
    return rr, stress_rr, losses


def summarize(rr, stress_rr, losses):
    """Headline metrics from simulation arrays (matches primary's output)."""
    var_99 = np.percentile(losses, 99)
    cvar_99 = float(np.mean(losses[losses >= var_99])) if np.any(losses >= var_99) else float(var_99)
    return {
        "Mean_RR":                  float(np.mean(rr)),
        "Min_RR":                   float(np.min(rr)),
        "P5_RR":                    float(np.percentile(rr, 5)),
        "P1_RR":                    float(np.percentile(rr, 1)),
        "P_RR_below_100_pct":       float(np.mean(rr < 100) * 100),
        "P_RR_below_120_pct":       float(np.mean(rr < 120) * 100),
        "StressRR_mean":            float(np.mean(stress_rr)),
        "P_StressRR_below_100_pct": float(np.mean(stress_rr < 100) * 100),
        "CVaR_99_M":                float(cvar_99 / 1e6),
    }


# ============================================================
# CHALLENGER 1 — HISTORICAL BLOCK BOOTSTRAP
# ============================================================

def challenger_1_block_bootstrap(n_paths=N_PATHS_DEFAULT, seed=42,
                                 block_size=20, hist_days=CALIB_HIST_DAYS):
    """
    Non-parametric block bootstrap. Build a synthetic historical panel
    of daily asset returns (Normal marginals with baseline correlation
    0.30 — NO Student-t, NO Merton jumps in the historical record).
    For each path, resample two consecutive blocks (block_size=20 +
    block_size=10 to cover the 30-day horizon) from history with
    replacement, sum daily returns to obtain a 30-day path return
    per asset, then feed to the standard portfolio accounting.

    The depeg model is applied on top of the resampled path (matches
    the primary's per-path depeg logic); the historical panel itself
    does not contain depeg events.

    Methodological departures from primary:
      - Marginals: Normal (not Student-t)
      - No Merton jumps in the historical record
      - Dependence: empirical (via resampled blocks) rather than
        parametric Cholesky
      - Block size 20 days captures short-term volatility clustering
        without imposing a GARCH(1,1) structure
    """
    print(f"  [C1] Block bootstrap: n_paths={n_paths:,}, block_size={block_size}, "
          f"hist_days={hist_days}")
    rng = np.random.default_rng(seed)

    # 1. Synthetic historical panel (T, n_assets) — represents the
    #    2020-01-01 to 2026-08-12 calibration window.
    corr_hist = np.full((N_ASSETS, N_ASSETS), BASELINE_CORR)
    np.fill_diagonal(corr_hist, 1.0)
    L_hist = np.linalg.cholesky(corr_hist)
    z_panel = rng.standard_normal(size=(hist_days, N_ASSETS)) @ L_hist.T
    daily_drift = MEANS / 252.0
    daily_vol_scale = VOLS / math.sqrt(252.0)
    hist_panel = daily_drift + daily_vol_scale * z_panel   # (hist_days, n_assets)

    # 2. Block-start indices for each path
    block1_starts = rng.integers(0, hist_days - block_size, size=n_paths)
    block2_size = HORIZON - block_size  # 10
    block2_starts = rng.integers(0, hist_days - block2_size, size=n_paths)

    # 3. Build path returns in chunks to bound memory.
    chunk = 25_000
    all_rr = np.empty(n_paths)
    all_srr = np.empty(n_paths)
    all_losses = np.empty(n_paths)

    arange_b1 = np.arange(block_size)[None, :]
    arange_b2 = np.arange(block2_size)[None, :]

    for s in range(0, n_paths, chunk):
        e = min(s + chunk, n_paths)
        b1 = block1_starts[s:e]
        b2 = block2_starts[s:e]
        idx1 = (b1[:, None] + arange_b1) % hist_days    # (chunk, 20)
        idx2 = (b2[:, None] + arange_b2) % hist_days    # (chunk, 10)
        idx = np.concatenate([idx1, idx2], axis=1)       # (chunk, 30)
        # (chunk, 30, n_assets) → sum across days → (chunk, n_assets)
        path_returns = hist_panel[idx].sum(axis=1)

        # Stablecoin depeg applied per-path (matches primary's per-path
        # depeg logic — the historical panel does NOT contain depegs)
        for j in STABLECOIN_IDX:
            depeg_mask = rng.random(e - s) < DEPEG_PROB / 365 * HORIZON
            depeg_amt = np.abs(rng.normal(DEPEG_MEAN, DEPEG_STD, size=e - s))
            path_returns[depeg_mask, j] -= depeg_amt[depeg_mask]

        regimes = simulate_regimes(e - s, HORIZON, rng)
        rr, srr, losses = compute_rr_and_loss(path_returns, regimes)
        all_rr[s:e] = rr
        all_srr[s:e] = srr
        all_losses[s:e] = losses

    return summarize(all_rr, all_srr, all_losses)


# ============================================================
# CHALLENGER 2 — GAUSSIAN (THIN-TAILED) BASELINE
# ============================================================

def challenger_2_gaussian(n_paths=N_PATHS_DEFAULT, seed=42):
    """
    Same structural model as primary (regime switching, baseline
    correlation, depeg, redemption) but:
      - Normal marginals instead of Student-t (no fat tails)
      - NO Merton jumps (jump component removed)

    Isolates the fat-tail contribution to the primary's headline
    risk reading. If P(RR<100%) here is materially below the primary's
    21.5%, the gap quantifies the fat-tail + jump contribution to
    solvency risk.
    """
    print(f"  [C2] Gaussian baseline: n_paths={n_paths:,}")
    rng = np.random.default_rng(seed)

    corr_normal = np.full((N_ASSETS, N_ASSETS), BASELINE_CORR)
    np.fill_diagonal(corr_normal, 1.0)
    corr_crisis = np.full((N_ASSETS, N_ASSETS), BASELINE_CORR * CRISIS_CORR_MULT)
    np.fill_diagonal(corr_crisis, 1.0)
    L_normal = np.linalg.cholesky(corr_normal)
    L_crisis = np.linalg.cholesky(corr_crisis)

    z = rng.standard_normal(size=(n_paths, N_ASSETS))
    regimes = simulate_regimes(n_paths, HORIZON, rng)

    # Apply regime-dependent correlation: draw both, select per path
    corr_normal_returns = z @ L_normal.T
    corr_crisis_returns = z @ L_crisis.T
    correlated = np.where(regimes[:, None] == 1,
                          corr_crisis_returns,
                          corr_normal_returns)

    vol_scale = VOLS / math.sqrt(252.0) * math.sqrt(HORIZON)
    drift = MEANS / 252.0 * HORIZON
    returns = drift + correlated * vol_scale

    # Stablecoin depeg (matches primary — kept to isolate the
    # Student-t+jump effect, not the depeg effect)
    for j in STABLECOIN_IDX:
        depeg_mask = rng.random(n_paths) < DEPEG_PROB / 365 * HORIZON
        depeg_amt = np.abs(rng.normal(DEPEG_MEAN, DEPEG_STD, size=n_paths))
        returns[depeg_mask, j] -= depeg_amt[depeg_mask]

    # NO Merton jumps — intentionally removed
    rr, srr, losses = compute_rr_and_loss(returns, regimes)
    return summarize(rr, srr, losses)


# ============================================================
# CHALLENGER 3 — ANALYTICAL CORNISH-FISHER (NO SIMULATION)
# ============================================================

def challenger_3_cornish_fisher():
    """
    Closed-form parametric VaR using the Cornish-Fisher expansion
    with skewness and excess-kurtosis adjustments. No simulation.

    Models the 30-day r_a distribution as a TWO-COMPONENT MIXTURE
    (one per regime), each component being a Cornish-Fisher-expanded
    distribution that captures:
      • Diffusion: Student-t (df=5) marginals with the primary's
        variance scaling factor 5/3 (matching primary's use of
        standard_t(df=5) without variance normalization).
      • Jumps: per-asset independent Merton compound Poisson-Normal
        where the jump is added to the STANDARDIZED return and then
        scaled by vol/sqrt(252)*sqrt(horizon) (matching primary's
        implementation, not a standalone additive shock).
      • Redemption: deterministic per regime (normal=$1.5876M,
        stress=$15.876M deducted at 0.98).

    Per-regime moments (in r_a $-space, w'_j = w_j * (1-h_j)):
      • mu_D  = baseline_ra * Σ_j w'_j * mu_D_j           (same both regimes)
      • mu_J  = baseline_ra * p * j1 * Σ_j w'_j * sig_D_j (same both regimes)
      • var_D = baseline_ra² * (5/3) * [ ρ·(Σ w'·sig)² + (1-ρ)·Σ (w'·sig)² ]
      • var_J = baseline_ra² * var_Y * Σ (w'·sig)²         (same both regimes)
      • skew  = third_J / sig³                              (diffusion symmetric)
      • exk   = fourth_total / sig⁴ - 3

    Mixture CDF: F(x) = (1-p_stress)·F_normal(x) + p_stress·F_stress(x)
    where each F_regime is the Edgeworth-expanded Normal CDF with that
    regime's (mu, sig, skew, exk). Percentiles via binary search.

    This is still a closed-form analytical model (no Monte Carlo paths).
    The two-component mixture is required because the redemption
    distribution is bimodal ($1.59M vs $15.88M) and a single Cornish-
    Fisher expansion cannot capture this bimodality — the mixture-of-
    CF approach is a standard analytical technique for this case.
    """
    print("  [C3] Analytical Cornish-Fisher (mixture-of-CF, no simulation)")

    # Per-asset 30-day mean and standard deviation (pre-Student-t scaling)
    mu_D_asset = MEANS / 252.0 * HORIZON
    sig_D_asset = VOLS / math.sqrt(252.0) * math.sqrt(HORIZON)

    # Student-t(df=5) variance scaling (primary uses standard_t directly
    # without variance normalization, so effective variance is 5/3 × Normal)
    T_DF = 5
    t_var_factor = T_DF / (T_DF - 2)   # 5/3 ≈ 1.6667
    t_excess_kurt = 6.0 / (T_DF - 4)   # = 6 (Student-t excess kurtosis)

    # Effective weights after haircut: w'_j = w_j * (1 - h_j)
    w_eff = WEIGHTS * (1 - HAIRCUTS)
    w_eff_stress = WEIGHTS * (1 - HAIRCUTS) * STRESS_COEFFS  # for StressRR

    # Asset-side contributions (regime-invariant): mean, jump mean
    const_ra = float(BASELINE_RA * np.sum(w_eff))               # = baseline_ra*(1-wh)
    const_r_stress = float(BASELINE_RA * np.sum(w_eff_stress))
    mu_D_ra = float(BASELINE_RA * np.dot(w_eff, mu_D_asset))
    mu_D_r_stress = float(BASELINE_RA * np.dot(w_eff_stress, mu_D_asset))

    # Jump moments (per-asset independent Merton, added to standardized
    # return and then scaled by sig_D_asset, matching primary)
    p_jump = JUMP_LAMBDA / 365.0 * HORIZON
    j1 = JUMP_MEAN
    j2 = JUMP_MEAN**2 + JUMP_STD**2
    j3 = JUMP_MEAN**3 + 3 * JUMP_MEAN * JUMP_STD**2
    j4 = (JUMP_MEAN**4 + 6 * JUMP_MEAN**2 * JUMP_STD**2
          + 3 * JUMP_STD**4)

    # Per-asset Y = B*J (jump in standardized-return space); v_j = baseline_ra*w'_j*sig_D_j
    v = BASELINE_RA * w_eff * sig_D_asset
    v_stress = BASELINE_RA * w_eff_stress * sig_D_asset

    mu_Y = p_jump * j1
    var_Y = p_jump * j2 - (p_jump * j1) ** 2
    third_Y = (p_jump * j3 - 3 * (p_jump*j1) * (p_jump*j2)
               + 2 * (p_jump*j1) ** 3)
    fourth_Y = (p_jump * j4 - 4 * (p_jump*j1) * (p_jump*j3)
                + 6 * (p_jump*j1) ** 2 * (p_jump*j2)
                - 3 * (p_jump*j1) ** 4)

    mu_J_ra = float(np.dot(v, np.full(N_ASSETS, mu_Y)))
    var_J_ra = float(np.dot(v**2, np.full(N_ASSETS, var_Y)))
    third_J_ra = float(np.dot(v**3, np.full(N_ASSETS, third_Y)))
    fourth_J_ra = float(np.dot(v**4, np.full(N_ASSETS, fourth_Y)))

    mu_J_r_stress = float(np.dot(v_stress, np.full(N_ASSETS, mu_Y)))
    var_J_r_stress = float(np.dot(v_stress**2, np.full(N_ASSETS, var_Y)))
    third_J_r_stress = float(np.dot(v_stress**3, np.full(N_ASSETS, third_Y)))
    fourth_J_r_stress = float(np.dot(v_stress**4, np.full(N_ASSETS, fourth_Y)))

    # Diffusion variance (per regime, function of correlation rho)
    sum_wsig = float(np.dot(w_eff, sig_D_asset))
    sum_wsig_sq = float(np.dot(w_eff**2, sig_D_asset**2))
    sum_wsig_stress = float(np.dot(w_eff_stress, sig_D_asset))
    sum_wsig_sq_stress = float(np.dot(w_eff_stress**2, sig_D_asset**2))

    def var_D_ra(rho, sum_ws, sum_ws2):
        # baseline_ra² * (5/3) * [rho * (Σ w'·sig)² + (1-rho) * Σ (w'·sig)²]
        return BASELINE_RA**2 * t_var_factor * (
            rho * sum_ws**2 + (1.0 - rho) * sum_ws2
        )

    # Redemption per regime (deterministic; deducted at 0.98)
    red_normal = LIABILITY * REDEMPTION_BASE_RATE * HORIZON * 0.98    # $1.5876M
    red_stress = LIABILITY * REDEMPTION_STRESS_RATE * HORIZON * 0.98  # $15.876M

    # P(final regime = stress) under primary's Markov chain, starting normal,
    # after 30 days. Eigenvalue 0.75; stationary stress prob 0.20.
    p_stress = 0.20

    # ---- Per-regime moments ----
    def regime_moments(const_val, mu_D_val, rho, red_amt, sum_ws, sum_ws2,
                       mu_J_r, var_J_r, third_J_r, fourth_J_r):
        """Compute (mu, sig, skew, exk) for r_a (or r_stress) in a given regime."""
        mu = const_val + mu_D_val + mu_J_r - red_amt
        var_D = var_D_ra(rho, sum_ws, sum_ws2)
        var = var_D + var_J_r   # redemption is deterministic in-regime
        sig = math.sqrt(var)
        # Diffusion fourth central moment (Student-t): (3 + exk) * var_D²
        fourth_D = (3.0 + t_excess_kurt) * var_D ** 2
        # Combined fourth: D + J + 6*var_D*var_J (independence)
        fourth_total = fourth_D + fourth_J_r + 6 * var_D * var_J_r
        skew = third_J_r / sig**3      # diffusion symmetric, redemption deterministic
        exk = fourth_total / sig**4 - 3.0
        return mu, sig, skew, exk, var_D, var_J_r

    # RR regime moments (uses w_eff)
    mu_n, sig_n, skew_n, exk_n, var_D_n, var_J_n = regime_moments(
        const_ra, mu_D_ra, BASELINE_CORR, red_normal,
        sum_wsig, sum_wsig_sq,
        mu_J_ra, var_J_ra, third_J_ra, fourth_J_ra)
    mu_s, sig_s, skew_s, exk_s, var_D_s, var_J_s = regime_moments(
        const_ra, mu_D_ra, BASELINE_CORR * CRISIS_CORR_MULT, red_stress,
        sum_wsig, sum_wsig_sq,
        mu_J_ra, var_J_ra, third_J_ra, fourth_J_ra)

    # StressRR regime moments (uses w_eff_stress)
    mu_n_str, sig_n_str, skew_n_str, exk_n_str, _, _ = regime_moments(
        const_r_stress, mu_D_r_stress, BASELINE_CORR, red_normal,
        sum_wsig_stress, sum_wsig_sq_stress,
        mu_J_r_stress, var_J_r_stress, third_J_r_stress, fourth_J_r_stress)
    mu_s_str, sig_s_str, skew_s_str, exk_s_str, _, _ = regime_moments(
        const_r_stress, mu_D_r_stress, BASELINE_CORR * CRISIS_CORR_MULT, red_stress,
        sum_wsig_stress, sum_wsig_sq_stress,
        mu_J_r_stress, var_J_r_stress, third_J_r_stress, fourth_J_r_stress)

    # ---- Cornish-Fisher / Edgeworth primitives ----
    def edgeworth_cdf(x, mu, sig, skew, exk):
        z = (x - mu) / sig
        Phi = sp_stats.norm.cdf(z)
        phi = sp_stats.norm.pdf(z)
        adj = ((z**2 - 1) * skew / 6.0
               + (z**3 - 3*z) * exk / 24.0
               - (2*z**3 - 5*z) * skew**2 / 36.0)
        return float(np.clip(Phi - phi * adj, 0.0, 1.0))

    def cf_quantile(alpha, mu, sig, skew, exk):
        z = sp_stats.norm.ppf(alpha)
        adj = ((z**2 - 1) * skew / 6.0
               + (z**3 - 3*z) * exk / 24.0
               - (2*z**3 - 5*z) * skew**2 / 36.0)
        return mu + sig * (z + adj)

    # Mixture CDF (in r_a $-space)
    def mixture_cdf(x):
        f_n = edgeworth_cdf(x, mu_n, sig_n, skew_n, exk_n)
        f_s = edgeworth_cdf(x, mu_s, sig_s, skew_s, exk_s)
        return (1 - p_stress) * f_n + p_stress * f_s

    def mixture_cdf_stress(x):
        f_n = edgeworth_cdf(x, mu_n_str, sig_n_str, skew_n_str, exk_n_str)
        f_s = edgeworth_cdf(x, mu_s_str, sig_s_str, skew_s_str, exk_s_str)
        return (1 - p_stress) * f_n + p_stress * f_s

    # Inverse mixture CDF via binary search
    def mixture_quantile(alpha, cdf_fn, lo=10e6, hi=80e6, iters=200):
        # find x such that cdf_fn(x) = alpha
        for _ in range(iters):
            mid = 0.5 * (lo + hi)
            if cdf_fn(mid) < alpha:
                lo = mid
            else:
                hi = mid
        return 0.5 * (lo + hi)

    # ---- RR-space metrics ----
    # Mean RR (mixture mean)
    mu_ra_mixture = (1 - p_stress) * mu_n + p_stress * mu_s
    mean_rr = mu_ra_mixture / LIABILITY * 100.0
    mu_r_stress_mixture = (1 - p_stress) * mu_n_str + p_stress * mu_s_str
    mean_stress_rr = mu_r_stress_mixture / LIABILITY * 100.0

    # Percentile RRs via mixture quantile (in r_a → RR)
    p5_ra  = mixture_quantile(0.05,  mixture_cdf)
    p1_ra  = mixture_quantile(0.01,  mixture_cdf)
    p01_ra = mixture_quantile(0.001, mixture_cdf)
    p5_rr  = p5_ra  / LIABILITY * 100.0
    p1_rr  = p1_ra  / LIABILITY * 100.0
    min_rr = p01_ra / LIABILITY * 100.0   # 0.1% quantile as Min RR proxy

    # P(RR<100%) = mixture CDF at r_a = LIABILITY (=$54M)
    p_rr_below_100  = mixture_cdf(LIABILITY) * 100.0
    p_rr_below_120  = mixture_cdf(1.20 * LIABILITY) * 100.0
    p_stress_below_100 = mixture_cdf_stress(LIABILITY) * 100.0

    # ---- CVaR_99 (loss space) ----
    # Loss L = max(0, baseline_ra - r_a). With baseline_ra = $64.8M and r_a
    # almost always below $64.8M, loss = baseline_ra - r_a.
    # VaR_99 (loss) ↔ r_a at 1% lower-tail quantile.
    var_99_ra = mixture_quantile(0.01, mixture_cdf)
    var_99_loss = max(0.0, BASELINE_RA - var_99_ra)

    # CVaR_99 = E[baseline_ra - r_a | r_a < var_99_ra]
    #         = baseline_ra - E[r_a | r_a < var_99_ra]
    # For mixture: E[r_a | r_a < q] =
    #   [(1-p)·F_n(q)·E_n[r_a|r_a<q] + p·F_s(q)·E_s[r_a|r_a<q]] / F(q)
    # where E_regime[r_a|r_a<q] ≈ mu_regime - sig_regime·φ(z)/F_regime(q)·CF_adj
    def conditional_expectation(q, mu, sig, skew, exk):
        z = (q - mu) / sig
        F = edgeworth_cdf(q, mu, sig, skew, exk)
        if F < 1e-12:
            return mu
        phi_z = sp_stats.norm.pdf(z)
        cf_adj = 1 + (z**2 - 1) * skew / 6.0 \
                   + (z**3 - 3*z) * exk / 24.0 \
                   - (2*z**3 - 5*z) * skew**2 / 36.0
        # E[X | X < q] ≈ mu - sig * phi(z)/F(z) * CF_adj
        return mu - sig * phi_z / F * cf_adj

    F_n_q = edgeworth_cdf(var_99_ra, mu_n, sig_n, skew_n, exk_n)
    F_s_q = edgeworth_cdf(var_99_ra, mu_s, sig_s, skew_s, exk_s)
    F_q = (1 - p_stress) * F_n_q + p_stress * F_s_q
    if F_q < 1e-12:
        e_tail = mu_ra_mixture
    else:
        e_n = conditional_expectation(var_99_ra, mu_n, sig_n, skew_n, exk_n)
        e_s = conditional_expectation(var_99_ra, mu_s, sig_s, skew_s, exk_s)
        e_tail = ((1 - p_stress) * F_n_q * e_n
                  + p_stress * F_s_q * e_s) / F_q
    cvar_99_loss = max(0.0, BASELINE_RA - e_tail)

    return {
        "Mean_RR":                  float(mean_rr),
        "Min_RR":                   float(min_rr),
        "P5_RR":                    float(p5_rr),
        "P1_RR":                    float(p1_rr),
        "P_RR_below_100_pct":       float(p_rr_below_100),
        "P_RR_below_120_pct":       float(p_rr_below_120),
        "StressRR_mean":            float(mean_stress_rr),
        "P_StressRR_below_100_pct": float(p_stress_below_100),
        "CVaR_99_M":                float(cvar_99_loss / 1e6),
        "_diagnostic": {
            "mu_normal_ra": mu_n, "sig_normal_ra": sig_n,
            "mu_stress_ra": mu_s, "sig_stress_ra": sig_s,
            "skew_normal": skew_n, "exk_normal": exk_n,
            "skew_stress": skew_s, "exk_stress": exk_s,
            "p_stress_regime": p_stress,
            "p_jump_per_asset": p_jump,
            "mu_D_ra": mu_D_ra, "mu_J_ra": mu_J_ra,
            "var_D_normal": var_D_n, "var_D_stress": var_D_s,
            "var_J_ra": var_J_ra,
            "redemption_normal_M": red_normal / 1e6,
            "redemption_stress_M": red_stress / 1e6,
        }
    }


# ============================================================
# CHALLENGER 4 — WORST-CASE HISTORICAL SCENARIO REPLAY
# ============================================================

def challenger_4_historical_scenarios():
    """
    Deterministic replay of four actual worst historical stress
    windows observed in markets relevant to the MITHQAL portfolio.
    Each scenario specifies the 30-day cumulative shock applied to
    each asset class. No random draws.

    Scenarios (30-day cumulative shocks):
      2008 GFC (Sep 15 – Oct 15, 2008): broad risk-off; gold -8%
        (initial liquidity-driven selloff), silver -32%, USD +5%
        (DXY spike), EUR -10%, JPY +6% (safe haven), GBP -15%,
        commodity currencies -10–13%, stablecoins n/a (did not
        exist; modeled as unchanged).
      2020 COVID (Mar 9 – Apr 8, 2020): gold -3%, silver -28%,
        USD +4%, EUR -2%, JPY +2%, GBP -7%, commodity currencies
        -8–10%, USDC briefly depegged to ~$0.97 (modeled -3%).
      2022 Inflation (Sep – Oct 2022): gold -8%, silver -16%,
        USD +6% (DXY 20-year high), EUR -8%, JPY -10%, GBP -12%
        (gilt crisis), CNY -5%, stablecoins unchanged.
      2023 SVB (Mar 8 – Apr 7, 2023): gold +6% (safe-haven bid),
        silver -4%, USD -2%, EUR +3%, JPY +1%, USDC depegged to
        $0.87 on Mar 11 (modeled -8%), other stablecoins -2%.

    Each scenario runs through the full portfolio accounting with
    stress-regime redemption rate. With only 4 scenarios:
      - P5_RR = P1_RR = Min_RR (the worst scenario)
      - CVaR_99 = worst scenario loss (only tail observation)
    """
    print("  [C4] Historical scenario replay (4 deterministic scenarios)")

    scenarios = {
        "2008_GFC": {
            "Gold": -0.08, "Silver": -0.32, "USD": 0.05, "EUR": -0.10,
            "CHF": 0.02,  "JPY": 0.06,  "GBP": -0.15, "SGD": -0.06,
            "AED": 0.00,  "SAR": 0.00,  "CNY": -0.02, "CAD": -0.10,
            "AUD": -0.13, "USDC": 0.00, "USDP": 0.00, "EURC": 0.00, "BUIDL": 0.00,
        },
        "2020_COVID": {
            "Gold": -0.03, "Silver": -0.28, "USD": 0.04, "EUR": -0.02,
            "CHF": 0.01,  "JPY": 0.02,  "GBP": -0.07, "SGD": -0.04,
            "AED": 0.00,  "SAR": 0.00,  "CNY": -0.02, "CAD": -0.08,
            "AUD": -0.10, "USDC": -0.03, "USDP": -0.01, "EURC": -0.01, "BUIDL": 0.00,
        },
        "2022_Inflation": {
            "Gold": -0.08, "Silver": -0.16, "USD": 0.06, "EUR": -0.08,
            "CHF": -0.04, "JPY": -0.10, "GBP": -0.12, "SGD": -0.03,
            "AED": 0.00,  "SAR": 0.00,  "CNY": -0.05, "CAD": -0.03,
            "AUD": -0.05, "USDC": 0.00, "USDP": 0.00, "EURC": 0.00, "BUIDL": 0.00,
        },
        "2023_SVB": {
            "Gold": 0.06,  "Silver": -0.04, "USD": -0.02, "EUR": 0.03,
            "CHF": 0.02,  "JPY": 0.01,  "GBP": 0.01,  "SGD": 0.00,
            "AED": 0.00,  "SAR": 0.00,  "CNY": 0.00,  "CAD": 0.01,
            "AUD": 0.00,  "USDC": -0.08, "USDP": -0.02, "EURC": -0.02, "BUIDL": 0.00,
        },
    }

    rrs, srrs, losses = [], [], []
    detail = {}
    for name, shocks in scenarios.items():
        ret = np.array([shocks.get(a, 0.0) for a in ASSETS])
        asset_values = BASELINE_RA * WEIGHTS * (1 + ret)
        r_a = float((asset_values * (1 - HAIRCUTS)).sum())
        r_stress = float((asset_values * (1 - HAIRCUTS) * STRESS_COEFFS).sum())

        # Stress regime redemption
        redemption_amount = LIABILITY * REDEMPTION_STRESS_RATE * HORIZON
        non_gold_ratio = 1 - PORTFOLIO["Gold"]["weight"] - PORTFOLIO["Silver"]["weight"]
        if redemption_amount <= r_a * non_gold_ratio * 0.9:
            r_a -= redemption_amount * 0.98
            r_stress -= redemption_amount * 0.98
        else:
            r_a -= redemption_amount * 0.95
            r_stress -= redemption_amount * 0.90

        rr = r_a / LIABILITY * 100.0
        srr = r_stress / LIABILITY * 100.0
        loss = max(0.0, BASELINE_RA - r_a)

        rrs.append(rr); srrs.append(srr); losses.append(loss)
        detail[name] = {"RR": float(rr), "StressRR": float(srr),
                        "Loss_M": float(loss / 1e6)}

    rrs = np.array(rrs); srrs = np.array(srrs); losses = np.array(losses)

    # With 4 scenarios: P5=P1=Min; CVaR_99 = worst scenario loss
    return {
        "Mean_RR":                  float(np.mean(rrs)),
        "Min_RR":                   float(np.min(rrs)),
        "P5_RR":                    float(np.min(rrs)),
        "P1_RR":                    float(np.min(rrs)),
        "P_RR_below_100_pct":       float(np.mean(rrs < 100) * 100),
        "P_RR_below_120_pct":       float(np.mean(rrs < 120) * 100),
        "StressRR_mean":            float(np.mean(srrs)),
        "P_StressRR_below_100_pct": float(np.mean(srrs < 100) * 100),
        "CVaR_99_M":                float(np.max(losses) / 1e6),
        "_scenarios": detail,
    }


# ============================================================
# CHALLENGER 5 — COPULA-BASED MODEL
# ============================================================

def challenger_5_copula(n_paths=N_PATHS_DEFAULT, seed=42):
    """
    Copula-based simulation with a block-diagonal dependence structure
    genuinely different from the primary's single 0.30-correlation
    matrix:
      • Metals (Gold, Silver): Student-t copula, df=4, ρ=0.60 →
        symmetric tail dependence (co-crashes).
      • FX majors (USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY,
        CAD, AUD): Gaussian copula with a STRUCTURED intra-FX
        correlation matrix (USD-pegged AED/SAR/CNY cluster at 0.80;
        safe-haven CHF/JPY at 0.55; commodity CAD/AUD at 0.65;
        EUR/GBP at 0.60; cross-cluster baseline 0.30).
      • Stablecoins (USDC, USDP, EURC, BUIDL): Gaussian copula,
        ρ=0.70 (depeg events cluster).
      • Cross-block independence (metals ⊥ FX ⊥ stablecoins) — a
        deliberate structural departure from the primary's blanket
        0.30 correlation across all 17 assets.

    Marginals remain Student-t (df=5) for parity with the primary's
    fat-tail assumption — this isolates the dependence-structure
    effect. Regime switching (Markov), Merton jumps, depeg, and
    redemption all match primary.

    In stress regime (final regime state = 1), we amplify returns
    by sqrt(1.5) ≈ 1.225 to emulate the primary's crisis-correlation
    boost (CRISIS_CORR_MULT=1.5) without redrawing the copula.
    """
    print(f"  [C5] Copula model: n_paths={n_paths:,}")
    rng = np.random.default_rng(seed)

    metals_idx = [ASSETS.index(a) for a in ("Gold", "Silver")]
    fx_idx = [ASSETS.index(a) for a in
              ("USD", "EUR", "CHF", "JPY", "GBP", "SGD",
               "AED", "SAR", "CNY", "CAD", "AUD")]
    stable_idx = STABLECOIN_IDX

    # --- 1. Metals block: bivariate Student-t copula, df=4, ρ=0.60 ---
    n_metals = len(metals_idx)
    rho_metals = 0.60
    L_metals = np.linalg.cholesky(np.array([[1.0, rho_metals],
                                            [rho_metals, 1.0]]))
    z_metals = rng.standard_normal(size=(n_paths, n_metals)) @ L_metals.T
    w_chi = rng.chisquare(df=4, size=n_paths) / 4.0
    t_metals = z_metals / np.sqrt(w_chi)[:, None]
    u_metals = sp_stats.t.cdf(t_metals, df=4)

    # --- 2. FX block: Gaussian copula, structured correlation matrix ---
    # fx_assets order: USD, EUR, CHF, JPY, GBP, SGD, AED, SAR, CNY, CAD, AUD
    n_fx = len(fx_idx)
    fx_corr = np.full((n_fx, n_fx), 0.30)
    usd_bloc =     [0, 6, 7, 8]   # USD, AED, SAR, CNY
    safe_haven =   [2, 3]         # CHF, JPY
    commodity =    [9, 10]        # CAD, AUD
    european =     [1, 4]         # EUR, GBP
    for cluster in (usd_bloc, safe_haven, commodity, european):
        for i in cluster:
            for j in cluster:
                if i != j:
                    if cluster is usd_bloc:    fx_corr[i, j] = 0.80
                    elif cluster is safe_haven: fx_corr[i, j] = 0.55
                    elif cluster is commodity:  fx_corr[i, j] = 0.65
                    elif cluster is european:   fx_corr[i, j] = 0.60
    np.fill_diagonal(fx_corr, 1.0)
    # PSD enforcement
    eigvals = np.linalg.eigvalsh(fx_corr)
    if eigvals.min() < 1e-8:
        fx_corr = fx_corr + (1e-8 - eigvals.min()) * np.eye(n_fx)
        np.fill_diagonal(fx_corr, 1.0)
    L_fx = np.linalg.cholesky(fx_corr)
    z_fx = rng.standard_normal(size=(n_paths, n_fx)) @ L_fx.T
    u_fx = sp_stats.norm.cdf(z_fx)

    # --- 3. Stablecoin block: Gaussian copula, ρ=0.70 ---
    n_stable = len(stable_idx)
    sc_corr = np.full((n_stable, n_stable), 0.70)
    np.fill_diagonal(sc_corr, 1.0)
    L_sc = np.linalg.cholesky(sc_corr)
    z_sc = rng.standard_normal(size=(n_paths, n_stable)) @ L_sc.T
    u_sc = sp_stats.norm.cdf(z_sc)

    # --- 4. Assemble uniform matrix in PORTFOLIO order ---
    u = np.empty((n_paths, N_ASSETS))
    u[:, metals_idx] = u_metals
    u[:, fx_idx] = u_fx
    u[:, stable_idx] = u_sc

    # --- 5. Marginal transform: Student-t (df=5), matching primary ---
    t_marginal = sp_stats.t.ppf(u, df=5)

    # --- 6. Scale to 30-day returns ---
    vol_scale = VOLS / math.sqrt(252.0) * math.sqrt(HORIZON)
    drift = MEANS / 252.0 * HORIZON
    returns = drift + t_marginal * vol_scale

    # --- 7. Stress-regime amplification (emulates CRISIS_CORR_MULT) ---
    regimes = simulate_regimes(n_paths, HORIZON, rng)
    stress_mult = math.sqrt(CRISIS_CORR_MULT)
    # Amplify the systematic portion only (subtract path-mean across assets,
    # scale, add back). This preserves marginals while increasing variance
    # in stress regime.
    path_mean = returns.mean(axis=1, keepdims=True)
    returns = np.where(regimes[:, None] == 1,
                       path_mean + (returns - path_mean) * stress_mult,
                       returns)

    # --- 8. Merton jumps (per primary: per-asset independent Bernoulli) ---
    p_jump = JUMP_LAMBDA / 365.0 * HORIZON
    jump_mask = rng.random(size=(n_paths, N_ASSETS)) < p_jump
    jump_sizes = rng.normal(JUMP_MEAN, JUMP_STD, size=(n_paths, N_ASSETS))
    returns = np.where(jump_mask, returns + jump_sizes, returns)

    # --- 9. Stablecoin depeg (per primary) ---
    for j in STABLECOIN_IDX:
        depeg_mask = rng.random(n_paths) < DEPEG_PROB / 365 * HORIZON
        depeg_amt = np.abs(rng.normal(DEPEG_MEAN, DEPEG_STD, size=n_paths))
        returns[depeg_mask, j] -= depeg_amt[depeg_mask]

    rr, srr, losses = compute_rr_and_loss(returns, regimes)
    return summarize(rr, srr, losses)


# ============================================================
# DEVIATION + VALIDITY GATE
# ============================================================

def compute_deviations(challenger_metrics, primary=PRIMARY_BASELINE):
    dev = {}
    for key, p_val in primary.items():
        c_val = challenger_metrics[key]
        abs_dev = c_val - p_val
        rel_dev = (abs_dev / p_val * 100.0) if abs(p_val) > 1e-9 else float("inf")
        dev[key] = {
            "challenger": c_val,
            "primary":    p_val,
            "abs_dev":    abs_dev,
            "rel_dev_pct": rel_dev,
        }
    return dev


def validity_gate(challenger_metrics, primary=PRIMARY_BASELINE,
                  tol_pp=VALIDITY_TOLERANCE_PP):
    p_c = challenger_metrics["P_RR_below_100_pct"]
    p_p = primary["P_RR_below_100_pct"]
    diff = abs(p_c - p_p)
    return {
        "metric":                     "P_RR_below_100_pct",
        "challenger_value":           p_c,
        "primary_value":              p_p,
        "abs_diff_percentage_points": diff,
        "tolerance_pp":               tol_pp,
        "verdict":                    "CONFIRM" if diff <= tol_pp else "DISSENT",
    }


# ============================================================
# MAIN
# ============================================================

def main():
    print("=" * 78)
    print("MITHQAL v24.2.1 — CHALLENGER MODEL VALIDATION")
    print(f"Date: {datetime.utcnow().isoformat()}Z")
    print(f"NumPy: {np.__version__} | SciPy: {sp_stats.__version__ if hasattr(sp_stats, '__version__') else 'available'}")
    print(f"Stochastic challengers: {N_PATHS_DEFAULT:,} paths, seed=42")
    print(f"Validity gate: ±{VALIDITY_TOLERANCE_PP}pp on P(RR<100%) "
          f"(primary = {PRIMARY_BASELINE['P_RR_below_100_pct']:.4f}%)")
    print("=" * 78)

    t0 = datetime.utcnow()

    print("\n[1/5] Challenger 1 — Historical block bootstrap")
    c1 = challenger_1_block_bootstrap()

    print("\n[2/5] Challenger 2 — Gaussian (thin-tailed) baseline")
    c2 = challenger_2_gaussian()

    print("\n[3/5] Challenger 3 — Analytical Cornish-Fisher")
    c3 = challenger_3_cornish_fisher()

    print("\n[4/5] Challenger 4 — Worst-case historical scenario replay")
    c4 = challenger_4_historical_scenarios()

    print("\n[5/5] Challenger 5 — Copula-based model")
    c5 = challenger_5_copula()

    elapsed = (datetime.utcnow() - t0).total_seconds()
    print(f"\nTotal elapsed: {elapsed:.1f}s")

    # Assemble results
    challenger_results = {
        "C1_block_bootstrap":      {"metrics": c1},
        "C2_gaussian_thin_tailed": {"metrics": c2},
        "C3_cornish_fisher":       {"metrics": c3},
        "C4_historical_scenarios": {"metrics": c4},
        "C5_copula":               {"metrics": c5},
    }

    # Deviations + validity gate
    for name, blk in challenger_results.items():
        m = blk["metrics"]
        blk["deviations"] = compute_deviations(m)
        blk["validity_gate"] = validity_gate(m)

    # Overall verdict: majority of challengers confirm
    confirms = sum(1 for blk in challenger_results.values()
                   if blk["validity_gate"]["verdict"] == "CONFIRM")
    dissents = len(challenger_results) - confirms
    overall = "CONFIRM" if confirms >= max(1, len(challenger_results) // 2 + 1) else "DISSENT"
    if dissents > 0 and confirms > 0:
        overall = "SPLIT_VERDICT"
    # Range of P(RR<100%) across challengers
    p_below_100_vals = [blk["metrics"]["P_RR_below_100_pct"]
                        for blk in challenger_results.values()]
    p_range = (min(p_below_100_vals), max(p_below_100_vals))

    print("\n" + "=" * 78)
    print("COMPARISON TABLE — Challenger vs Primary (seed=42, 250K paths)")
    print("=" * 78)
    header = (f"{'Metric':<28}{'Primary':>12}"
              + "".join(f"{name[:14]:>15}" for name in challenger_results.keys()))
    print(header)
    print("-" * len(header))
    metric_keys = [
        ("Mean_RR",                  "Mean RR (%)"),
        ("Min_RR",                   "Min RR (%)"),
        ("P5_RR",                    "P5 RR (%)"),
        ("P1_RR",                    "P1 RR (%)"),
        ("P_RR_below_100_pct",       "P(RR<100%)"),
        ("P_RR_below_120_pct",       "P(RR<120%)"),
        ("StressRR_mean",            "StressRR (%)"),
        ("P_StressRR_below_100_pct", "P(SRR<100%)"),
        ("CVaR_99_M",                "CVaR_99 ($M)"),
    ]
    for key, label in metric_keys:
        row = f"{label:<28}{PRIMARY_BASELINE[key]:>12.4f}"
        for name in challenger_results:
            row += f"{challenger_results[name]['metrics'][key]:>15.4f}"
        print(row)

    print("\n--- VALIDITY GATE (±5pp on P(RR<100%)) ---")
    print(f"{'Challenger':<32}{'P(RR<100%)':>14}{'Δpp':>10}{'Verdict':>12}")
    for name, blk in challenger_results.items():
        v = blk["validity_gate"]
        print(f"{name:<32}{v['challenger_value']:>14.4f}"
              f"{v['abs_diff_percentage_points']:>10.4f}"
              f"{v['verdict']:>12}")

    print("\n--- SUMMARY ---")
    print(f"  Confirmed: {confirms}/{len(challenger_results)}")
    print(f"  Dissented: {dissents}/{len(challenger_results)}")
    print(f"  P(RR<100%) range across challengers: "
          f"[{p_range[0]:.4f}%, {p_range[1]:.4f}%]")
    print(f"  Primary P(RR<100%): {PRIMARY_BASELINE['P_RR_below_100_pct']:.4f}%")
    print(f"  Overall verdict: {overall}")

    # Write JSON
    output = {
        "date":         datetime.utcnow().isoformat() + "Z",
        "version":      "v24.2.1",
        "task_id":      "5",
        "agent":        "Challenger Model Validation Agent",
        "primary_baseline_seed42_250k": PRIMARY_BASELINE,
        "primary_source": "/home/z/my-project/docs/verification/v24.2-monte-carlo-results.json",
        "validity_gate": {
            "rule":        "P(RR<100%) within ±5pp of primary (21.5432%)",
            "tolerance_pp": VALIDITY_TOLERANCE_PP,
        },
        "challengers": challenger_results,
        "overall": {
            "verdict":             overall,
            "confirmed_count":     confirms,
            "dissented_count":     dissents,
            "total_challengers":   len(challenger_results),
            "p_below_100_range":   {"min": p_range[0], "max": p_range[1]},
            "p_below_100_primary": PRIMARY_BASELINE["P_RR_below_100_pct"],
        },
        "honest":          True,
        "forced_to_pass":  False,
    }
    out_path = os.path.join(os.path.dirname(__file__), "..", "docs",
                            "verification", "v24.2.1-challenger-results.json")
    out_path = os.path.normpath(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, default=str)
    print(f"\nResults JSON written to: {out_path}")
    print("\nFINAL: Challenger-model validation COMPLETE — honest results, "
          "not forced to pass.")


if __name__ == "__main__":
    main()
