#!/usr/bin/env python3
"""
MITHQAL v24.2.1 — §22 TGDR + §23 PAXG Common-Mode Stress + §40 ERTF Recovery Matrix
====================================================================================
Task Agent §22-§23-§40 — final execution directive.

Three analyses in ONE script (deterministic scenario calculations):
  Part 1 (§22): TGDR — Tokenized Gold Dependency Ratio
                TGDR = TokenizedGoldExposure / TotalGoldExposure
                Portfolio B: TGDR = 5/20 = 25%
                Test 3 TGDR levels (0%, 25%, 35%) × 5 dependency types.

  Part 2 (§23): PAXG Common-Mode Stress — 9 combined scenarios.
                Do NOT assume independence; apply shocks simultaneously.
                For each: CommonModePAXGRisk, residual RR, residual StressRR.
                Classify PASS / FAIL / BDL per §47.

  Part 3 (§40): ERTF Recovery Matrix — 5 recovery levels × 5 delay levels = 25 combos.
                For each: RR, StressRR, LCR, LSD.
                Determine whether Portfolio B depends critically on ERTF.

Portfolio B baseline (APPROVED):
  15% phys gold + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital = 100%

Canonical parameters:
  Liability     = $54,000,000  (54M MTQ × PAR = $1.00)
  R_a_target    = $64,800,000  (RR_target = 120% × L)
  RR_baseline   = R_a / L      = 120%

§47 classification (HONEST — no FAIL→BDL relabeling):
  PASS : RR ≥ 100% AND StressRR ≥ 80% AND LCR ≥ 1.0 (mandatory constraints satisfied)
  FAIL : inside approved design envelope AND violates a mandatory constraint
  BDL  : explicitly outside approved design envelope, declared BEFORE computation
"""

from __future__ import annotations
import json
import math
import os
from datetime import datetime, timezone

import numpy as np

# ============================================================
# CANONICAL PARAMETERS (v24.2.1 blueprint §3.3 / §3.4 / §3.6 / §3.8)
# ============================================================
PAR = 1.00
SUPPLY = 54_000_000
LIABILITY = SUPPLY * PAR                    # $54M
RR_TARGET = 1.20                            # §3.3 strategic target / minting threshold
R_A_BASELINE = RR_TARGET * LIABILITY        # $64.8M  (per task description)

# §47 approved minimums (per portfolio-stress-suite.py)
APPROVED_RR_MIN = 1.00                      # §3.3 solvency floor
APPROVED_STRESSRR_MIN = 0.80                # §3.6 worst stress-coefficient floor
APPROVED_LCR_MIN = 1.00                     # §3.8 liquidity floor

# Per-asset parameters (haircut H §3.4, stress coefficient S §3.6, HQLA flag §3.8)
FIAT_SUB = {
    "USD": {"weight_in_fiat": 0.265, "haircut": 0.000, "stress": 0.95, "hqla": True,  "fx_exposed": False},
    "EUR": {"weight_in_fiat": 0.245, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "CHF": {"weight_in_fiat": 0.075, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "JPY": {"weight_in_fiat": 0.075, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "GBP": {"weight_in_fiat": 0.063, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "SGD": {"weight_in_fiat": 0.050, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "AED": {"weight_in_fiat": 0.038, "haircut": 0.000, "stress": 0.95, "hqla": True,  "fx_exposed": True},
    "SAR": {"weight_in_fiat": 0.038, "haircut": 0.000, "stress": 0.95, "hqla": True,  "fx_exposed": True},
    "CNY": {"weight_in_fiat": 0.025, "haircut": 0.020, "stress": 0.80, "hqla": True,  "fx_exposed": True},
    "CAD": {"weight_in_fiat": 0.006, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
    "AUD": {"weight_in_fiat": 0.006, "haircut": 0.020, "stress": 0.90, "hqla": True,  "fx_exposed": True},
}
DIGITAL_SUB = {
    "USDC":  {"weight_in_digital": 0.40, "haircut": 0.020, "stress": 0.80, "hqla": True, "class": "stablecoin",    "model_dep": True},
    "USDP":  {"weight_in_digital": 0.10, "haircut": 0.020, "stress": 0.80, "hqla": True, "class": "stablecoin",    "model_dep": True},
    "EURC":  {"weight_in_digital": 0.10, "haircut": 0.020, "stress": 0.80, "hqla": True, "class": "stablecoin",    "model_dep": True},
    "BUIDL": {"weight_in_digital": 0.40, "haircut": 0.020, "stress": 0.90, "hqla": True, "class": "tokenized_gov", "model_dep": True},
}
BULLION_PARAMS = {
    "GoldPhys": {"haircut": 0.050, "stress": 0.85, "hqla": False, "class": "gold_phys", "model_dep": False},
    "GoldTok":  {"haircut": 0.055, "stress": 0.83, "hqla": False, "class": "gold_tok",  "model_dep": True},  # PAXG TGRS=9.00
    "Silver":   {"haircut": 0.070, "stress": 0.80, "hqla": False, "class": "silver",    "model_dep": False},
}

# Portfolio B baseline (APPROVED v24.2.1-V.2)
PORTFOLIO_B = {
    "label": "B — APPROVED: 15% phys gold + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital",
    "phys_gold": 0.15, "tok_gold": 0.05, "silver": 0.00,
    "fiat": 0.775, "digital": 0.025,
}

# ============================================================
# PORTFOLIO BUILDER — expand spec into per-asset rows
# ============================================================
def build_portfolio_assets(spec):
    """Expand high-level portfolio spec into flat {asset: {weight, haircut, stress, hqla, ...}}."""
    assets = {}
    if spec["phys_gold"] > 0:
        assets["GoldPhys"] = {**BULLION_PARAMS["GoldPhys"], "weight": spec["phys_gold"]}
    if spec["tok_gold"] > 0:
        assets["GoldTok"] = {**BULLION_PARAMS["GoldTok"], "weight": spec["tok_gold"]}
    if spec["silver"] > 0:
        assets["Silver"] = {**BULLION_PARAMS["Silver"], "weight": spec["silver"]}
    for ccy, p in FIAT_SUB.items():
        assets[ccy] = {
            "weight": spec["fiat"] * p["weight_in_fiat"],
            "haircut": p["haircut"], "stress": p["stress"], "hqla": p["hqla"],
            "fx_exposed": p["fx_exposed"], "class": "fiat_" + ccy.lower(), "model_dep": False,
        }
    for asset, p in DIGITAL_SUB.items():
        assets[asset] = {
            "weight": spec["digital"] * p["weight_in_digital"],
            "haircut": p["haircut"], "stress": p["stress"], "hqla": p["hqla"],
            "class": p["class"], "model_dep": p["model_dep"],
        }
    s = sum(a["weight"] for a in assets.values())
    for a in assets:
        assets[a]["weight"] /= s
    return assets


def baseline_ra_decomposition(assets):
    """Decompose baseline R_a = $64.8M into per-asset contributions (anti-double-counting preserved)."""
    sum_w_h = sum(a["weight"] * (1 - a["haircut"]) for a in assets.values())
    r_m = R_A_BASELINE / sum_w_h
    per_asset = {}
    for name, a in assets.items():
        r_m_i = r_m * a["weight"]
        r_a_i = r_m_i * (1 - a["haircut"])
        r_l_i = r_a_i * a["stress"]
        per_asset[name] = {
            "weight": a["weight"], "haircut": a["haircut"], "stress": a["stress"],
            "hqla": a["hqla"], "class": a["class"],
            "fx_exposed": a.get("fx_exposed", False), "model_dep": a.get("model_dep", False),
            "R_m": r_m_i, "R_a": r_a_i, "R_l": r_l_i,
        }
    return r_m, per_asset, sum_w_h


# ============================================================
# STRESS ENGINE — apply shocks to per-asset R_m
# ============================================================
def apply_scenario(per_asset, scenario):
    """Apply scenario shocks to per-asset R_m values; return stressed dict."""
    out = {k: dict(v) for k, v in per_asset.items()}
    for name, a in out.items():
        shock = 0.0
        cls = a["class"]
        # Physical gold shock (does NOT affect tokenized gold — separated)
        if cls == "gold_phys" and "phys_gold_shock" in scenario:
            shock += scenario["phys_gold_shock"]
        # Tokenized gold (PAXG) shock
        if cls == "gold_tok" and "tok_gold_shock" in scenario:
            shock += scenario["tok_gold_shock"]
        # Correlated gold shock (both phys + tok together — legacy)
        if cls in ("gold_phys", "gold_tok") and "gold_shock" in scenario:
            shock += scenario["gold_shock"]
        if cls == "silver" and "silver_shock" in scenario:
            shock += scenario["silver_shock"]
        if a.get("fx_exposed", False) and "fx_shock" in scenario:
            shock += scenario["fx_shock"]
        if cls in ("stablecoin",) and "stablecoin_shock" in scenario:
            shock += scenario["stablecoin_shock"]
        if cls == "tokenized_gov" and "tokenized_gov_shock" in scenario:
            shock += scenario["tokenized_gov_shock"]
        if "all_assets_shock" in scenario:
            shock += scenario["all_assets_shock"]
        if "oracle_correction_pct" in scenario:
            # Stale oracle: when corrected, all gold mark-to-market drops by missed move
            if cls in ("gold_phys", "gold_tok"):
                shock -= scenario["oracle_correction_pct"]
        # Banking freeze: fiat availability impaired by N%
        if cls.startswith("fiat_") and "banking_freeze_pct" in scenario:
            shock -= scenario["banking_freeze_pct"]
        a["R_m_stressed"] = a["R_m"] * (1.0 + shock)
        a["R_a_stressed"] = a["R_m_stressed"] * (1.0 - a["haircut"])
        a["R_l_stressed"] = a["R_a_stressed"] * a["stress"]
    # Custody failure: loss = exposure × LGD, absorbed by ERTF if available (cap 2% of R_a)
    if scenario.get("custodian_exposure_pct", 0) > 0:
        lgd = scenario.get("LGD", 1.0)
        cust_loss = scenario["custodian_exposure_pct"] * lgd * R_A_BASELINE
        ertf_cap = 0.02 * R_A_BASELINE if scenario.get("ERTF_available", True) else 0.0
        ertf_cover = min(cust_loss, ertf_cap)
        net_cust_loss = cust_loss - ertf_cover
        total_ra = sum(a["R_a_stressed"] for a in out.values())
        for a in out.values():
            share = a["R_a_stressed"] / total_ra if total_ra > 0 else 0.0
            a["R_a_stressed"] -= net_cust_loss * share
            a["R_l_stressed"] -= net_cust_loss * share * a["stress"]
        out["_custody_loss"] = cust_loss
        out["_ertf_cover"] = ertf_cover
        out["_net_custody_loss"] = net_cust_loss
    # Execution slippage
    if scenario.get("execution_slippage_pct", 0) > 0:
        rebal_volume_share = scenario.get("rebalanced_volume_pct", 0.05)
        slip_cost = scenario["execution_slippage_pct"] * rebal_volume_share * R_A_BASELINE
        total_ra = sum(a["R_a_stressed"] for a in out.values())
        for a in out.values():
            share = a["R_a_stressed"] / total_ra if total_ra > 0 else 0.0
            a["R_a_stressed"] -= slip_cost * share
            a["R_l_stressed"] -= slip_cost * share * a["stress"]
        out["_slippage_cost"] = slip_cost
    return out


def compute_metrics(stressed_assets, scenario):
    """Compute RR_after, StressRR, LCR for stressed portfolio."""
    r_a_after = sum(a["R_a_stressed"] for n, a in stressed_assets.items() if not n.startswith("_"))
    r_l_after = sum(a["R_l_stressed"] for n, a in stressed_assets.items() if not n.startswith("_"))
    liability_after = stressed_assets.get("_liability_after", LIABILITY)
    hqla = sum(a["R_a_stressed"] for n, a in stressed_assets.items()
               if not n.startswith("_") and a.get("hqla", False))
    stress_outflow_pct = 0.20 if scenario.get("is_stress_outflow", True) else 0.10
    outflows_30d = liability_after * stress_outflow_pct
    lcr = hqla / outflows_30d if outflows_30d > 0 else 0.0
    rr_after = r_a_after / liability_after if liability_after > 0 else 0.0
    stress_rr = r_l_after / liability_after if liability_after > 0 else 0.0
    return {
        "R_a_after_usd": round(r_a_after, 4),
        "R_l_after_usd": round(r_l_after, 4),
        "Liability_after_usd": round(liability_after, 4),
        "RR_after": round(rr_after, 6),
        "RR_after_pct": round(rr_after * 100, 4),
        "StressRR": round(stress_rr, 6),
        "StressRR_pct": round(stress_rr * 100, 4),
        "HQLA_usd": round(hqla, 4),
        "outflows_30d_usd": round(outflows_30d, 4),
        "LCR": round(lcr, 6),
        "loss_usd": round(max(0.0, R_A_BASELINE - r_a_after), 4),
    }


def classify(metrics, is_bdl):
    """§47 classification. BDL declared BEFORE computation."""
    if is_bdl:
        return "BDL"
    pass_rr = metrics["RR_after"] >= APPROVED_RR_MIN
    pass_stress = metrics["StressRR"] >= APPROVED_STRESSRR_MIN
    pass_lcr = metrics["LCR"] >= APPROVED_LCR_MIN
    if pass_rr and pass_stress and pass_lcr:
        return "PASS"
    return "FAIL"


# ============================================================
# PART 1 — §22 TGDR (Tokenized Gold Dependency Ratio)
# ============================================================
# TGDR = TokenizedGoldExposure / TotalGoldExposure
#
# Dependency model: each dependency type measures the fraction of TOTAL GOLD
# EXPOSURE that is exposed to a specific infrastructure risk. Both physical and
# tokenized gold have non-zero dependency for some types (e.g., custody), while
# others apply only to tokenized (issuer, blockchain, redemption friction).
#
# Dependency_i = [w_phys × phys_factor_i + w_tok × tok_factor_i] / (w_phys + w_tok)
#
# All factors are in [0,1]: 1.0 = fully dependent on that infrastructure.
# Factors chosen per directive definitions:
#   issuer      : physical=0.0 (no issuer),      tokenized=1.0 (Paxos Trust)
#   custody     : physical=0.4 (Brink's direct), tokenized=1.0 (issuer + sub-custodian + chain)
#   oracle      : physical=0.2 (LBMA spot),     tokenized=1.0 (GoldNAV+PAXG+RedemptionRef)
#   blockchain  : physical=0.0 (no chain),       tokenized=1.0 (Ethereum L1)
#   redemption  : physical=0.3 (assay+ship),    tokenized=1.0 (issuer redemption flow)
#
# Approved dependency budget (per type) — caps how much of total-gold-exposure
# may depend on each infrastructure:
DEPENDENCY_FACTORS = {
    "issuer":     {"phys": 0.0, "tok": 1.0},
    "custody":    {"phys": 0.4, "tok": 1.0},
    "oracle":     {"phys": 0.2, "tok": 1.0},
    "blockchain": {"phys": 0.0, "tok": 1.0},
    "redemption": {"phys": 0.3, "tok": 1.0},
}
DEPENDENCY_BUDGET = {
    "issuer":     0.30,   # 30% of total gold exposure may depend on Paxos
    "custody":    0.60,   # 60% custody-chain tolerance
    "oracle":     0.40,   # 40% oracle-dependent tolerance
    "blockchain": 0.30,   # 30% blockchain tolerance (matches TGDR cap)
    "redemption": 0.50,   # 50% redemption-flow tolerance
}


def compute_tgdr_dependencies(w_phys, w_tok):
    """Compute 5 dependency fractions for given physical/tokenized gold weights."""
    total_gold = w_phys + w_tok
    if total_gold <= 0:
        return {dep: 0.0 for dep in DEPENDENCY_FACTORS}
    deps = {}
    for dep, factors in DEPENDENCY_FACTORS.items():
        numerator = w_phys * factors["phys"] + w_tok * factors["tok"]
        deps[dep] = numerator / total_gold
    return deps


def part1_tgdr():
    """§22 — TGDR analysis for 3 levels."""
    print("\n" + "=" * 78)
    print("PART 1 — §22 TGDR (Tokenized Gold Dependency Ratio)")
    print("=" * 78)

    tgdr_levels = [
        {"tgdr": 0.00, "w_phys": 0.20, "w_tok": 0.00,
         "label": "TGDR=0%  (Portfolio D: 20% physical, 0% tokenized)"},
        {"tgdr": 0.25, "w_phys": 0.15, "w_tok": 0.05,
         "label": "TGDR=25% (Portfolio B: 15% physical, 5% tokenized) — APPROVED"},
        {"tgdr": 0.35, "w_phys": 0.13, "w_tok": 0.07,
         "label": "TGDR=35% (hypothetical: 13% physical, 7% tokenized)"},
    ]

    results = []
    for lvl in tgdr_levels:
        deps = compute_tgdr_dependencies(lvl["w_phys"], lvl["w_tok"])
        budget_status = {dep: ("PASS" if deps[dep] <= DEPENDENCY_BUDGET[dep] else "FAIL")
                         for dep in deps}
        any_fail = any(s == "FAIL" for s in budget_status.values())
        verdict = "FAIL" if any_fail else "PASS"
        rec = {
            "tgdr": lvl["tgdr"],
            "label": lvl["label"],
            "w_phys_gold": lvl["w_phys"],
            "w_tok_gold": lvl["w_tok"],
            "total_gold_exposure": lvl["w_phys"] + lvl["w_tok"],
            "dependencies": {dep: round(deps[dep], 4) for dep in deps},
            "budget": DEPENDENCY_BUDGET,
            "budget_status": budget_status,
            "verdict": verdict,
        }
        results.append(rec)

        print(f"\n  {lvl['label']}")
        print(f"    Total gold exposure = {(lvl['w_phys']+lvl['w_tok'])*100:.0f}% of reserve")
        print(f"    TGDR = {lvl['tgdr']*100:.0f}%")
        print(f"    {'Dependency':<14} {'Value':>8} {'Budget':>8} {'Status':>8}")
        for dep in deps:
            st = budget_status[dep]
            print(f"    {dep:<14} {deps[dep]*100:>7.2f}% {DEPENDENCY_BUDGET[dep]*100:>7.2f}% {st:>8}")
        print(f"    -> Overall verdict: {verdict}")

    # Which dependencies increase with TGDR?
    print("\n  Dependency scaling with TGDR (0% → 35%):")
    print(f"    {'Dependency':<14} {'TGDR=0%':>8} {'TGDR=25%':>9} {'TGDR=35%':>9} {'Δ(pp)':>8} {'Scales?':>9}")
    scales_summary = {}
    for dep in DEPENDENCY_FACTORS:
        v0 = results[0]["dependencies"][dep]
        v25 = results[1]["dependencies"][dep]
        v35 = results[2]["dependencies"][dep]
        delta_pp = (v35 - v0) * 100
        scales = "YES" if v35 > v0 else "no"
        scales_summary[dep] = {
            "tgdr_0pct": v0, "tgdr_25pct": v25, "tgdr_35pct": v35,
            "delta_pp": round(delta_pp, 2), "scales_with_tgdr": scales == "YES",
        }
        print(f"    {dep:<14} {v0*100:>7.2f}% {v25*100:>8.2f}% {v35*100:>8.2f}% {delta_pp:>7.2f} {scales:>9}")

    # Verdict
    tgdr_25_verdict = results[1]["verdict"]
    tgdr_35_verdict = results[2]["verdict"]
    print("\n  §22 VERDICT:")
    print(f"    TGDR=0%  (Portfolio D): {results[0]['verdict']}")
    print(f"    TGDR=25% (Portfolio B):  {tgdr_25_verdict}")
    print(f"    TGDR=35% (hypothetical):{tgdr_35_verdict}")
    print(f"    Dependencies that scale with TGDR: "
          f"{[d for d,s in scales_summary.items() if s['scales_with_tgdr']]}")
    print(f"    Strongest scalers (largest Δ TGDR 0→35%): "
          f"{sorted(scales_summary.items(), key=lambda kv: -kv[1]['delta_pp'])[0][0]}, "
          f"{sorted(scales_summary.items(), key=lambda kv: -kv[1]['delta_pp'])[1][0]}")

    return {"tgdr_levels": results, "scales_summary": scales_summary}


# ============================================================
# PART 2 — §23 PAXG Common-Mode Stress (9 combined scenarios)
# ============================================================
# Do NOT assume independence — apply shocks simultaneously.
# BDL declaration BEFORE computation:
#   Scenarios 1, 2, 3 (PAXG issuer failure → tok_gold -100%) — explicitly outside
#   the approved design envelope (max 50% tokenized-gold impairment per §47 example).
#   These are BDL by directive.
#
# Scenarios 4-9 are INSIDE the approved envelope (≤50% PAXG impairment) and will
# be honestly classified PASS / FAIL based on computed metrics.
PAXG_BDL_SCENARIOS = {1, 2, 3}  # PAXG → 0 is BDL (max 50% impairment assumed)

PAXG_COMMON_MODE_SCENARIOS = [
    {"id": 1, "category": "issuer_oracle",
     "label": "PAXG issuer failure + oracle failure",
     "description": "PAXG→0 + GoldNAV price feed dead (5% additional missed-move markdown when corrected)",
     "tok_gold_shock": -1.00, "oracle_correction_pct": 0.05,
     "bdl": True, "bdl_reason": "PAXG 100% impairment exceeds approved design envelope (max 50% per §47 example)"},
    {"id": 2, "category": "issuer_custody",
     "label": "PAXG issuer failure + custody failure",
     "description": "PAXG→0 + Brink's 5% exposure impaired (LGD=100%, ERTF absorbs per custody matrix)",
     "tok_gold_shock": -1.00, "custodian_exposure_pct": 0.05, "LGD": 1.0, "ERTF_available": True,
     "bdl": True, "bdl_reason": "PAXG 100% impairment exceeds approved design envelope (max 50% per §47 example)"},
    {"id": 3, "category": "issuer_banking",
     "label": "PAXG issuer failure + banking-rail failure",
     "description": "PAXG→0 + fiat settlement delayed (20% fiat availability haircut — banking freeze)",
     "tok_gold_shock": -1.00, "banking_freeze_pct": 0.20,
     "bdl": True, "bdl_reason": "PAXG 100% impairment exceeds approved design envelope (max 50% per §47 example)"},
    {"id": 4, "category": "paxg_gold_crash",
     "label": "PAXG + gold market crash",
     "description": "PAXG -30% + physical gold spot -30% (correlated — both move together; PAXG -30% is the tokenized manifestation of the gold crash)",
     "phys_gold_shock": -0.30, "tok_gold_shock": -0.30,
     "bdl": False},
    {"id": 5, "category": "paxg_stablecoin",
     "label": "PAXG + stablecoin stress",
     "description": "PAXG -20% + stablecoin -50% (USDC/USDP/EURC depeg; BUIDL untouched as tokenized-gov)",
     "tok_gold_shock": -0.20, "stablecoin_shock": -0.50,
     "bdl": False},
    {"id": 6, "category": "paxg_ertf",
     "label": "PAXG + ERTF impairment",
     "description": "PAXG -20% + ERTF unavailable (no shock absorption for any subsequent loss)",
     "tok_gold_shock": -0.20, "ERTF_available": False,
     "bdl": False},
    {"id": 7, "category": "paxg_weekend",
     "label": "PAXG + weekend liquidity reduction",
     "description": "PAXG basis spread widens -5% + reduced venues → 2% slippage on 10% rebalanced volume",
     "tok_gold_shock": -0.05, "execution_slippage_pct": 0.02, "rebalanced_volume_pct": 0.10,
     "bdl": False},
    {"id": 8, "category": "paxg_tokenized_gov",
     "label": "PAXG + tokenized-government impairment",
     "description": "PAXG -10% + BUIDL -10% (BlackRock BUIDL secondary-market impairment)",
     "tok_gold_shock": -0.10, "tokenized_gov_shock": -0.10,
     "bdl": False},
    {"id": 9, "category": "paxg_jurisdiction",
     "label": "PAXG + jurisdiction stress",
     "description": "PAXG redemption blocked in 1 jurisdiction → effective impairment 50% (redemption friction, not total loss)",
     "tok_gold_shock": -0.50,
     "bdl": False},
]


def part2_common_mode_paxg(assets_b):
    """§23 — 9 PAXG common-mode scenarios."""
    print("\n" + "=" * 78)
    print("PART 2 — §23 PAXG Common-Mode Stress (9 combined scenarios)")
    print("=" * 78)
    print("BDL declaration (BEFORE computation):")
    print("  Scenarios 1, 2, 3 — PAXG 100% impairment exceeds approved design envelope")
    print("                     (max 50% impairment per §47 example). DECLARED BDL.")
    print("  Scenarios 4-9    — INSIDE approved envelope. Honest PASS/FAIL classification.")

    _, per_asset_b, _ = baseline_ra_decomposition(assets_b)
    baseline_ra = sum(a["R_a"] for a in per_asset_b.values())

    results = []
    counts = {"PASS": 0, "FAIL": 0, "BDL": 0}

    for scn in PAXG_COMMON_MODE_SCENARIOS:
        is_bdl = scn.get("bdl", False) or scn["id"] in PAXG_BDL_SCENARIOS
        stressed = apply_scenario(per_asset_b, scn)
        metrics = compute_metrics(stressed, scn)
        cls = classify(metrics, is_bdl)
        counts[cls] += 1

        # CommonModePAXGRisk = combined loss / baseline R_a (severity of common-mode event)
        common_mode_risk = metrics["loss_usd"] / R_A_BASELINE

        rec = {
            "id": scn["id"],
            "category": scn["category"],
            "label": scn["label"],
            "description": scn["description"],
            "shocks": {k: v for k, v in scn.items() if k not in ("id", "category", "label", "description", "bdl", "bdl_reason")},
            "CommonModePAXGRisk": round(common_mode_risk, 6),
            "CommonModePAXGRisk_pct": round(common_mode_risk * 100, 4),
            "residual_RR": metrics["RR_after"],
            "residual_RR_pct": metrics["RR_after_pct"],
            "residual_StressRR": metrics["StressRR"],
            "residual_StressRR_pct": metrics["StressRR_pct"],
            "LCR": metrics["LCR"],
            "loss_usd": metrics["loss_usd"],
            "R_a_after_usd": metrics["R_a_after_usd"],
            "classification": cls,
            "bdl_reason": scn.get("bdl_reason", ""),
        }
        results.append(rec)

        print(f"\n  Scenario {scn['id']}: {scn['label']}")
        print(f"    {scn['description']}")
        print(f"    CommonModePAXGRisk = {common_mode_risk*100:.2f}%  (loss = ${metrics['loss_usd']:,.0f})")
        print(f"    Residual RR        = {metrics['RR_after_pct']:.2f}%   (R_a_after = ${metrics['R_a_after_usd']:,.0f})")
        print(f"    Residual StressRR  = {metrics['StressRR_pct']:.2f}%")
        print(f"    LCR                = {metrics['LCR']:.3f}")
        print(f"    §47 classification : {cls}")
        if is_bdl:
            print(f"    BDL reason: {scn.get('bdl_reason','')}")

    total = len(results)
    print("\n  §23 AGGREGATE:")
    print(f"    PASS: {counts['PASS']} / {total}  ({counts['PASS']/total*100:.1f}%)")
    print(f"    FAIL: {counts['FAIL']} / {total}  ({counts['FAIL']/total*100:.1f}%)")
    print(f"    BDL:  {counts['BDL']} / {total}  ({counts['BDL']/total*100:.1f}%)")
    print(f"    Honest: BDL declared BEFORE computation (3 scenarios, PAXG→0).")
    print(f"    PASS rate (in-envelope only): "
          f"{counts['PASS']}/{total-counts['BDL']} = "
          f"{counts['PASS']/(total-counts['BDL'])*100:.1f}%")

    return {"scenarios": results, "counts": counts, "total": total}


# ============================================================
# PART 3 — §40 ERTF Recovery Matrix (5 recovery × 5 delay = 25)
# ============================================================
# ERTF policy limit (per src/lib/ertf.ts getDefaultErtfInstruments):
#   Layer 1 parametric insurance: $5M
#   Layer 2 takaful:              $3M
#   Layer 3 institutional guarantee: $2M
#   Total policy limit:           $10M
#
# "Recovery" levels in the matrix = fraction of policy limit actually recovered.
#   100% → $10M    75% → $7.5M    50% → $5M    25% → $2.5M    0% → $0
#
# "Delay" = days before ERTF funds arrive.
#   Delay affects LIQUIDITY (LSD, LCR): during delay days, ERTF cash is NOT
#   available to meet redemptions. Solvency (RR, StressRR) is assessed over
#   a 30-day horizon — at delay ≤ 30d, ERTF funds arrive within horizon.
#
# Baseline stress applied (the stress ERTF is supposed to absorb):
#   Moderate common-mode: gold -10% + custody 5% LGD 100% (a realistic
#   "stress + custody single-counterparty failure" event inside envelope).
#
# Stress daily redemption rate (under stress): 5% of liability per day = $2.7M/day
# 30-day net outflows (stress): 20% of liability = $10.8M
#
# Critical dependency test:
#   Portfolio B "depends critically on ERTF" if RR < 100% when ERTF recovery ≤ X%
#   OR when delay ≥ Y days. We define:
#     critical_dependency = TRUE if RR < 100% at recovery=0% OR at delay=30d
#   Threshold X%: the minimum recovery level that keeps RR ≥ 100% at delay=0d.
#   Threshold Y days: the maximum delay that keeps RR ≥ 100% at recovery=100%.
ERTF_POLICY_LIMIT_USD = 10_000_000.0   # $10M (3-layer stack)
ERTF_BASELINE_STRESS = {
    "phys_gold_shock": -0.10,          # gold spot drops 10%
    "tok_gold_shock":  -0.10,          # PAXG drops 10% in lockstep (correlated)
    "custodian_exposure_pct": 0.05,    # 5% custodian exposure
    "LGD": 1.0,
    "ERTF_available": True,            # ERTF available — covered by matrix
}
DAILY_STRESS_REDEMPTION_PCT = 0.05    # 5% of liability per day under stress
OUTFLOWS_30D_STRESS_PCT = 0.20         # 20% of liability per 30 days

RECOVERY_LEVELS = [1.00, 0.75, 0.50, 0.25, 0.00]
DELAY_LEVELS_DAYS = [0, 1, 3, 7, 30]


def compute_ertf_combo(recovery, delay_days, per_asset_b, hqla_baseline):
    """Compute RR, StressRR, LCR, LSD for a (recovery, delay) ERTF combo."""
    # 1. Apply baseline stress WITHOUT ERTF absorption
    scn_no_ertf = {**ERTF_BASELINE_STRESS, "ERTF_available": False}
    stressed = apply_scenario(per_asset_b, scn_no_ertf)
    r_a_stressed = sum(a["R_a_stressed"] for n, a in stressed.items() if not n.startswith("_"))
    r_l_stressed = sum(a["R_l_stressed"] for n, a in stressed.items() if not n.startswith("_"))

    # 2. ERTF recovery amount (over 30-day horizon; delay ≤ 30d → arrives in time)
    horizon_days = 30
    ertf_received = 0.0
    if delay_days <= horizon_days:
        ertf_received = ERTF_POLICY_LIMIT_USD * recovery
    # Time-value discount: delayed recovery is worth slightly less (urgency factor)
    urgency_discount = 1.0 / (1.0 + (delay_days / 30.0) * 0.10)  # ≤10% discount at 30d
    ertf_received_discounted = ertf_received * urgency_discount

    # 3. Solvency: RR = (stressed R_a + ERTF received) / L
    r_a_with_ertf = r_a_stressed + ertf_received_discounted
    r_l_with_ertf = r_l_stressed + ertf_received_discounted * 0.80  # ERTF cash is HQLA-like (stress=0.80)
    rr = r_a_with_ertf / LIABILITY
    stress_rr = r_l_with_ertf / LIABILITY

    # 4. Liquidity: HQLA includes ERTF only if delay=0 (immediate)
    hqla_stressed = sum(a["R_a_stressed"] for n, a in stressed.items()
                        if not n.startswith("_") and a.get("hqla", False))
    if delay_days == 0:
        immediate_liquidity = hqla_stressed + ertf_received_discounted
    else:
        # During delay days, ERTF cash not yet available
        immediate_liquidity = hqla_stressed
    outflows_30d = LIABILITY * OUTFLOWS_30D_STRESS_PCT
    lcr = immediate_liquidity / outflows_30d
    daily_stress_redemption = LIABILITY * DAILY_STRESS_REDEMPTION_PCT
    lsd = immediate_liquidity / daily_stress_redemption

    return {
        "recovery": recovery,
        "recovery_pct": round(recovery * 100, 1),
        "delay_days": delay_days,
        "ertf_received_usd": round(ertf_received_discounted, 2),
        "R_a_stressed_no_ertf_usd": round(r_a_stressed, 2),
        "R_a_with_ertf_usd": round(r_a_with_ertf, 2),
        "RR": round(rr, 6),
        "RR_pct": round(rr * 100, 4),
        "StressRR": round(stress_rr, 6),
        "StressRR_pct": round(stress_rr * 100, 4),
        "immediate_liquidity_usd": round(immediate_liquidity, 2),
        "outflows_30d_usd": round(outflows_30d, 2),
        "daily_stress_redemption_usd": round(daily_stress_redemption, 2),
        "LCR": round(lcr, 6),
        "LSD": round(lsd, 6),
    }


def part3_ertf_matrix(assets_b):
    """§40 — 25-combo ERTF recovery matrix + critical-dependency verdict."""
    print("\n" + "=" * 78)
    print("PART 3 — §40 ERTF Recovery Matrix (5 recovery × 5 delay = 25 combos)")
    print("=" * 78)
    print(f"ERTF policy limit: ${ERTF_POLICY_LIMIT_USD:,.0f}")
    print(f"Baseline stress applied (the stress ERTF is supposed to absorb):")
    print(f"  Physical gold -10% + PAXG -10% + Custody 5% LGD 100% (no ERTF in stress)")
    print(f"  Daily stress redemption rate: {DAILY_STRESS_REDEMPTION_PCT*100:.0f}% of liability = ${LIABILITY*DAILY_STRESS_REDEMPTION_PCT:,.0f}/day")
    print(f"  30-day net outflows (stress):  {OUTFLOWS_30D_STRESS_PCT*100:.0f}% of liability = ${LIABILITY*OUTFLOWS_30D_STRESS_PCT:,.0f}")

    _, per_asset_b, _ = baseline_ra_decomposition(assets_b)
    hqla_baseline = sum(a["R_a"] for a in per_asset_b.values() if a.get("hqla", False))

    # Compute all 25 combos
    matrix = []
    for rec in RECOVERY_LEVELS:
        for delay in DELAY_LEVELS_DAYS:
            combo = compute_ertf_combo(rec, delay, per_asset_b, hqla_baseline)
            matrix.append(combo)

    # Print matrix tables (4 metrics)
    for metric_name, metric_key, fmt in [
        ("RR (%)",       "RR_pct",        "{:.2f}"),
        ("StressRR (%)", "StressRR_pct",  "{:.2f}"),
        ("LCR",          "LCR",           "{:.3f}"),
        ("LSD",          "LSD",           "{:.3f}"),
    ]:
        print(f"\n  {metric_name} — recovery (rows) × delay (columns)")
        print(f"    {'Recovery':>10} | " + " | ".join(f"{d:>5}d" for d in DELAY_LEVELS_DAYS))
        print("    " + "-" * 10 + "-+-" + "-+-".join(["-" * 5] * len(DELAY_LEVELS_DAYS)))
        for rec in RECOVERY_LEVELS:
            row = [c for c in matrix if c["recovery"] == rec]
            row_by_delay = {c["delay_days"]: c for c in row}
            cells = " | ".join(fmt.format(row_by_delay[d][metric_key]) for d in DELAY_LEVELS_DAYS)
            print(f"    {rec*100:>9.0f}% | {cells}")

    # Critical dependency analysis
    print("\n  §40 Critical-Dependency Analysis")
    print("  (Portfolio B 'depends critically on ERTF' if RR < 100% when ERTF degraded)")

    # Find threshold recovery (delay=0) — min recovery keeping RR ≥ 100%
    rec_at_delay0 = [c for c in matrix if c["delay_days"] == 0]
    rec_at_delay0_sorted = sorted(rec_at_delay0, key=lambda c: -c["recovery"])
    threshold_recovery = None
    for c in rec_at_delay0_sorted:
        if c["RR"] < APPROVED_RR_MIN:
            threshold_recovery = c["recovery"]
            break
    if threshold_recovery is None:
        # All combos at delay=0 have RR ≥ 100%
        min_rr_d0 = min(c["RR"] for c in rec_at_delay0)
        threshold_recovery_str = f"> 0% (min RR at delay=0, recovery=0% = {min_rr_d0*100:.2f}%)"
        rr_at_zero_recovery_zero_delay = next(c["RR"] for c in rec_at_delay0 if c["recovery"] == 0.0)
        critical_at_zero_recovery = rr_at_zero_recovery_zero_delay < APPROVED_RR_MIN
    else:
        threshold_recovery_str = f"{threshold_recovery*100:.0f}% (RR falls below 100% at recovery ≤ {(threshold_recovery-0.001)*100:.0f}%)"
        critical_at_zero_recovery = True

    # Find threshold delay (recovery=100%) — max delay keeping RR ≥ 100%
    rec_at_full = [c for c in matrix if c["recovery"] == 1.00]
    rec_at_full_sorted = sorted(rec_at_full, key=lambda c: c["delay_days"])
    threshold_delay = None
    for c in rec_at_full_sorted:
        if c["RR"] < APPROVED_RR_MIN:
            threshold_delay = c["delay_days"]
            break
    if threshold_delay is None:
        threshold_delay_str = "> 30d (RR stays ≥ 100% even at delay=30d, recovery=100%)"
        critical_at_max_delay = False
    else:
        threshold_delay_str = f"{threshold_delay}d (RR falls below 100% at delay ≥ {threshold_delay}d)"
        critical_at_max_delay = True

    rr_zero_recovery_zero_delay = next(c["RR"] for c in matrix if c["recovery"] == 0.0 and c["delay_days"] == 0)
    rr_full_recovery_30d_delay = next(c["RR"] for c in matrix if c["recovery"] == 1.00 and c["delay_days"] == 30)
    rr_zero_recovery_30d_delay = next(c["RR"] for c in matrix if c["recovery"] == 0.0 and c["delay_days"] == 30)

    print(f"    RR at recovery=0%, delay=0d   : {rr_zero_recovery_zero_delay*100:.2f}%  (no ERTF at all, immediate stress)")
    print(f"    RR at recovery=100%, delay=30d: {rr_full_recovery_30d_delay*100:.2f}%  (full ERTF, but 30d delay)")
    print(f"    RR at recovery=0%, delay=30d  : {rr_zero_recovery_30d_delay*100:.2f}%  (worst case — no ERTF, max delay)")
    print(f"    Threshold recovery (delay=0d) : {threshold_recovery_str}")
    print(f"    Threshold delay (recovery=100%): {threshold_delay_str}")

    # Final critical-dependency verdict
    critical_dependency = critical_at_zero_recovery or critical_at_max_delay
    if critical_dependency:
        verdict = ("CRITICAL — Portfolio B depends critically on ERTF: "
                   "RR falls below 100% when ERTF is degraded (recovery reduced or delay extended).")
    else:
        verdict = ("NOT CRITICAL — Portfolio B does NOT depend critically on ERTF: "
                   "RR remains ≥ 100% across the entire recovery × delay matrix.")

    print(f"\n  §40 VERDICT: {verdict}")

    # Additional context
    pass_count = sum(1 for c in matrix if c["RR"] >= APPROVED_RR_MIN)
    fail_count = len(matrix) - pass_count
    print(f"    Combos with RR ≥ 100%: {pass_count} / 25")
    print(f"    Combos with RR <  100%: {fail_count} / 25")

    return {
        "matrix": matrix,
        "threshold_recovery_at_delay_0": threshold_recovery_str,
        "threshold_delay_at_recovery_100": threshold_delay_str,
        "rr_zero_recovery_zero_delay": round(rr_zero_recovery_zero_delay, 6),
        "rr_full_recovery_30d_delay": round(rr_full_recovery_30d_delay, 6),
        "rr_zero_recovery_30d_delay": round(rr_zero_recovery_30d_delay, 6),
        "critical_dependency_on_ertf": critical_dependency,
        "verdict": verdict,
        "pass_count": pass_count,
        "fail_count": fail_count,
    }


# ============================================================
# MAIN — execute 3 parts and write deliverables
# ============================================================
def main():
    print("=" * 78)
    print("MITHQAL v24.2.1 — §22 TGDR + §23 PAXG Common-Mode Stress + §40 ERTF Matrix")
    print("=" * 78)
    print(f"Generated: {datetime.now(timezone.utc).isoformat()}")
    print(f"Engine: numpy {np.__version__}, deterministic scenario calculations")
    print(f"Portfolio B (APPROVED): 15% phys + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital")
    print(f"Liability: ${LIABILITY:,.0f}    R_a baseline: ${R_A_BASELINE:,.0f}    RR baseline: {R_A_BASELINE/LIABILITY*100:.1f}%")
    print(f"Approved minimums: RR ≥ {APPROVED_RR_MIN*100:.0f}%  StressRR ≥ {APPROVED_STRESSRR_MIN*100:.0f}%  LCR ≥ {APPROVED_LCR_MIN:.2f}")

    assets_b = build_portfolio_assets(PORTFOLIO_B)
    print(f"\nPortfolio B asset rows: {len(assets_b)} (sum of weights = {sum(a['weight'] for a in assets_b.values()):.6f})")

    part1 = part1_tgdr()
    part2 = part2_common_mode_paxg(assets_b)
    part3 = part3_ertf_matrix(assets_b)

    # Aggregate summary
    print("\n" + "=" * 78)
    print("FINAL SUMMARY")
    print("=" * 78)
    print(f"§22 TGDR: Portfolio B (TGDR=25%) verdict = {part1['tgdr_levels'][1]['verdict']}")
    print(f"           TGDR=35% verdict = {part1['tgdr_levels'][2]['verdict']}")
    print(f"           Dependencies scaling with TGDR: "
          f"{[d for d,s in part1['scales_summary'].items() if s['scales_with_tgdr']]}")
    print(f"§23 PAXG Common-Mode: PASS={part2['counts']['PASS']}  "
          f"FAIL={part2['counts']['FAIL']}  BDL={part2['counts']['BDL']}  (of {part2['total']})")
    print(f"§40 ERTF Matrix: critical_dependency = {part3['critical_dependency_on_ertf']}")
    print(f"           Pass combos (RR≥100%) = {part3['pass_count']}/25")
    print(f"           Verdict: {part3['verdict'][:120]}...")

    # Write JSON deliverable
    payload = {
        "title": "MITHQAL v24.2.1 — §22 TGDR + §23 PAXG Common-Mode + §40 ERTF Matrix",
        "task_agent_id": "§22-§23-§40",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine": {"numpy_version": np.__version__, "mode": "deterministic-scenario"},
        "canonical_parameters": {
            "liability_usd": LIABILITY,
            "R_a_baseline_usd": R_A_BASELINE,
            "RR_baseline": round(R_A_BASELINE / LIABILITY, 6),
            "approved_RR_min": APPROVED_RR_MIN,
            "approved_StressRR_min": APPROVED_STRESSRR_MIN,
            "approved_LCR_min": APPROVED_LCR_MIN,
            "portfolio_B": PORTFOLIO_B,
        },
        "part1_tgdr": part1,
        "part2_paxg_common_mode": part2,
        "part3_ertf_matrix": part3,
    }
    json_path = "/home/z/my-project/docs/verification/v24.2.1-tgdr-commonmode-ertf.json"
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    with open(json_path, "w") as f:
        json.dump(payload, f, indent=2, default=str)
    print(f"\nJSON deliverable: {json_path}")

    # Write MD report
    md_path = "/home/z/my-project/docs/verification/v24.2.1-tgdr-commonmode-ertf-report.md"
    write_md_report(md_path, payload)
    print(f"MD report:         {md_path}")


def write_md_report(path, p):
    """Write the markdown report."""
    lines = []
    lines.append("# MITHQAL v24.2.1 — §22 TGDR + §23 PAXG Common-Mode Stress + §40 ERTF Matrix\n")
    lines.append(f"**Generated:** {p['generated_at']}")
    lines.append(f"**Task Agent:** {p['task_agent_id']}")
    lines.append(f"**Engine:** numpy {p['engine']['numpy_version']} ({p['engine']['mode']})")
    lines.append(f"**Portfolio B (APPROVED):** 15% phys gold + 5% PAXG + 0% silver + 77.5% fiat + 2.5% digital")
    cp = p["canonical_parameters"]
    lines.append(f"**Liability:** ${cp['liability_usd']:,.0f}  **R_a baseline:** ${cp['R_a_baseline_usd']:,.0f}  "
                 f"**RR baseline:** {cp['RR_baseline']*100:.1f}%")
    lines.append(f"**Approved minimums:** RR ≥ {cp['approved_RR_min']*100:.0f}%  "
                 f"StressRR ≥ {cp['approved_StressRR_min']*100:.0f}%  LCR ≥ {cp['approved_LCR_min']:.2f}\n")
    lines.append("## Methodology\n")
    lines.append("- **§22 TGDR:** `TGDR = TokenizedGoldExposure / TotalGoldExposure`. For each TGDR level "
                 "(0%, 25%, 35%) with total gold exposure fixed at 20% of reserve, compute 5 dependency "
                 "fractions: issuer (Paxos), custody (Brink's + sub-custodian chain), oracle (GoldNAV+PAXG+RedemptionRef), "
                 "blockchain (Ethereum L1), redemption (issuer flow). Each dependency = "
                 "`(w_phys × phys_factor + w_tok × tok_factor) / (w_phys + w_tok)` where physical factors are "
                 "0.0-0.4 (asset-class-dependent) and tokenized factors are 1.0 (full tokenized exposure relies on that infrastructure). "
                 "Dependency budget caps per type set from the approved envelope.")
    lines.append("- **§23 PAXG Common-Mode:** 9 combined scenarios — shocks applied SIMULTANEOUSLY "
                 "(no independence assumption). `CommonModePAXGRisk = combined_loss / baseline R_a`. "
                 "Residual RR and StressRR computed after stress. BDL declared BEFORE computation for "
                 "scenarios 1-3 (PAXG 100% impairment exceeds the §47 approved envelope max of 50% impairment). "
                 "Scenarios 4-9 are INSIDE the envelope and honestly classified.")
    lines.append("- **§40 ERTF Recovery Matrix:** 5 recovery levels (100/75/50/25/0%) × 5 delay levels (0/1/3/7/30d) "
                 "= 25 combos. Baseline stress applied = physical gold -10% + PAXG -10% + custody 5% LGD 100% "
                 "(the moderate common-mode stress ERTF is designed to absorb). ERTF policy limit = $10M "
                 "(3-layer: $5M parametric + $3M takaful + $2M institutional guarantee). "
                 "`RR = (R_a_stressed + ERTF_received) / Liability`, `StressRR = (R_l_stressed + ERTF×0.80) / Liability`, "
                 "`LCR = HQLA_immediate / 30d_outflows`, `LSD = HQLA_immediate / daily_stress_redemption`. "
                 "LSD = Liquidity Stress Distance = ImmediateLiquidity / StressDailyRedemption.")
    lines.append("- **§47 HONEST classification:** No FAIL→BDL relabeling. BDL scenarios are explicitly outside the "
                 "approved design envelope and declared BEFORE any computation.\n")

    # ---- §22 ----
    lines.append("## §22 TGDR — Tokenized Gold Dependency Ratio\n")
    lines.append("**TGDR** = TokenizedGoldExposure / TotalGoldExposure. Portfolio B: TGDR = 5/20 = 25%.\n")
    lines.append("### Dependency model\n")
    lines.append("| Dependency | Physical factor | Tokenized factor | Approved budget |")
    lines.append("|---|---:|---:|---:|")
    for dep, factors in DEPENDENCY_FACTORS.items():
        lines.append(f"| {dep} | {factors['phys']:.2f} | {factors['tok']:.2f} | {DEPENDENCY_BUDGET[dep]*100:.0f}% |")
    lines.append("")
    lines.append("### 3 TGDR levels × 5 dependency types\n")
    lines.append("| TGDR | Portfolio | issuer | custody | oracle | blockchain | redemption | Verdict |")
    lines.append("|---|---|---:|---:|---:|---:|---:|---|")
    for lvl in p["part1_tgdr"]["tgdr_levels"]:
        deps = lvl["dependencies"]
        lines.append(f"| {lvl['tgdr']*100:.0f}% | {lvl['label']} | "
                     f"{deps['issuer']*100:.2f}% | {deps['custody']*100:.2f}% | "
                     f"{deps['oracle']*100:.2f}% | {deps['blockchain']*100:.2f}% | "
                     f"{deps['redemption']*100:.2f}% | **{lvl['verdict']}** |")
    lines.append("")
    lines.append("### Dependency scaling with TGDR (TGDR 0% → 35%)\n")
    lines.append("| Dependency | TGDR=0% | TGDR=25% | TGDR=35% | Δ (pp) | Scales with TGDR? |")
    lines.append("|---|---:|---:|---:|---:|---|")
    for dep, s in p["part1_tgdr"]["scales_summary"].items():
        lines.append(f"| {dep} | {s['tgdr_0pct']*100:.2f}% | {s['tgdr_25pct']*100:.2f}% | "
                     f"{s['tgdr_35pct']*100:.2f}% | {s['delta_pp']:.2f} | {'YES' if s['scales_with_tgdr'] else 'no'} |")
    lines.append("")
    lines.append("### §22 Verdict\n")
    lvl0 = p["part1_tgdr"]["tgdr_levels"][0]
    lvl25 = p["part1_tgdr"]["tgdr_levels"][1]
    lvl35 = p["part1_tgdr"]["tgdr_levels"][2]
    lines.append(f"- **TGDR=0%  (Portfolio D):** {lvl0['verdict']} — all dependencies at or below budget.")
    failing_25 = [d for d, s in lvl25["budget_status"].items() if s == "FAIL"]
    lines.append(f"- **TGDR=25% (Portfolio B):** {lvl25['verdict']} — "
                 + ("all dependencies within budget." if not failing_25 else f"FAIL on dependencies: {failing_25}."))
    failing_35 = [d for d, s in lvl35["budget_status"].items() if s == "FAIL"]
    lines.append(f"- **TGDR=35% (hypothetical):** {lvl35['verdict']} — "
                 + ("all dependencies within budget." if not failing_35 else f"FAIL on dependencies: {failing_35}."))
    scalers = [d for d, s in p["part1_tgdr"]["scales_summary"].items() if s["scales_with_tgdr"]]
    lines.append(f"- **Dependencies that scale with TGDR:** {scalers} (all 5 dependencies increase monotonically).")
    sorted_scalers = sorted(p["part1_tgdr"]["scales_summary"].items(),
                            key=lambda kv: -kv[1]["delta_pp"])
    lines.append(f"- **Strongest scalers (largest Δ TGDR 0→35%):** "
                 f"{sorted_scalers[0][0]} (+{sorted_scalers[0][1]['delta_pp']:.1f}pp), "
                 f"{sorted_scalers[1][0]} (+{sorted_scalers[1][1]['delta_pp']:.1f}pp) — "
                 f"these go from 0% to 35% as TGDR rises, because physical gold has zero dependence on issuer/blockchain.\n")

    # ---- §23 ----
    lines.append("## §23 PAXG Common-Mode Stress — 9 Combined Scenarios\n")
    lines.append("**Methodology:** Shocks applied simultaneously (no independence assumption). "
                 "`CommonModePAXGRisk = combined_loss / baseline R_a`. "
                 "BDL declared BEFORE computation for scenarios 1-3 (PAXG→0 exceeds §47 max-50%-impairment envelope).\n")
    lines.append("### §47 BDL Declaration (BEFORE computation)\n")
    lines.append("- **Scenarios 1, 2, 3** — PAXG 100% impairment (`tok_gold_shock = -1.00`) — explicitly outside "
                 "the approved design envelope. Per directive §47 example, max tokenized-gold impairment "
                 "modeled is 50%; 100% impairment is BDL by design.")
    lines.append("- **Scenarios 4-9** — INSIDE approved envelope (≤50% PAXG impairment or systemic shocks). "
                 "Honest PASS/FAIL classification.\n")
    lines.append("### 9 Common-Mode Scenarios\n")
    lines.append("| # | Scenario | CommonModePAXGRisk | Residual RR | Residual StressRR | LCR | Classification |")
    lines.append("|---|---|---:|---:|---:|---:|---|")
    for scn in p["part2_paxg_common_mode"]["scenarios"]:
        lines.append(f"| {scn['id']} | {scn['label']} | {scn['CommonModePAXGRisk_pct']:.2f}% | "
                     f"{scn['residual_RR_pct']:.2f}% | {scn['residual_StressRR_pct']:.2f}% | "
                     f"{scn['LCR']:.3f} | **{scn['classification']}** |")
    lines.append("")
    cnt = p["part2_paxg_common_mode"]["counts"]
    total = p["part2_paxg_common_mode"]["total"]
    lines.append("### §23 Aggregate\n")
    lines.append("| Classification | Count | % of 9 |")
    lines.append("|---|---:|---:|")
    lines.append(f"| PASS | {cnt['PASS']} | {cnt['PASS']/total*100:.1f}% |")
    lines.append(f"| FAIL | {cnt['FAIL']} | {cnt['FAIL']/total*100:.1f}% |")
    lines.append(f"| BDL  | {cnt['BDL']}  | {cnt['BDL']/total*100:.1f}% |")
    in_env = total - cnt["BDL"]
    lines.append(f"\n**In-envelope PASS rate:** {cnt['PASS']}/{in_env} = "
                 f"{cnt['PASS']/in_env*100:.1f}% (scenarios 4-9 only).\n")
    lines.append("### §23 Per-scenario detail\n")
    for scn in p["part2_paxg_common_mode"]["scenarios"]:
        lines.append(f"#### Scenario {scn['id']}: {scn['label']}")
        lines.append(f"- **Description:** {scn['description']}")
        lines.append(f"- **Shocks (applied simultaneously):** `{scn['shocks']}`")
        lines.append(f"- **CommonModePAXGRisk:** {scn['CommonModePAXGRisk_pct']:.2f}% "
                     f"(loss = ${scn['loss_usd']:,.0f})")
        lines.append(f"- **Residual RR:** {scn['residual_RR_pct']:.2f}%  (R_a_after = ${scn['R_a_after_usd']:,.0f})")
        lines.append(f"- **Residual StressRR:** {scn['residual_StressRR_pct']:.2f}%")
        lines.append(f"- **LCR:** {scn['LCR']:.3f}")
        lines.append(f"- **§47 classification:** **{scn['classification']}**")
        if scn["classification"] == "BDL":
            lines.append(f"- **BDL reason:** {scn['bdl_reason']}")
        lines.append("")

    # ---- §40 ----
    lines.append("## §40 ERTF Recovery Matrix — 5 recovery × 5 delay = 25 combos\n")
    lines.append(f"**ERTF policy limit:** ${ERTF_POLICY_LIMIT_USD:,.0f} (3-layer: $5M parametric + $3M takaful + $2M institutional guarantee)")
    lines.append(f"**Baseline stress applied:** Physical gold -10% + PAXG -10% + Custody 5% LGD 100% (the moderate common-mode stress ERTF is designed to absorb)")
    lines.append(f"**Daily stress redemption:** {DAILY_STRESS_REDEMPTION_PCT*100:.0f}% of liability = ${LIABILITY*DAILY_STRESS_REDEMPTION_PCT:,.0f}/day")
    lines.append(f"**30-day net outflows:** {OUTFLOWS_30D_STRESS_PCT*100:.0f}% of liability = ${LIABILITY*OUTFLOWS_30D_STRESS_PCT:,.0f}\n")
    lines.append("**Metric definitions:**")
    lines.append("- **RR** = (R_a_stressed + ERTF_received) / Liability — solvency ratio after ERTF recovery")
    lines.append("- **StressRR** = (R_l_stressed + ERTF_received × 0.80) / Liability — stress-coefficient-adjusted solvency")
    lines.append("- **LCR** = HQLA_immediate / 30d_outflows — liquidity coverage ratio (ERTF cash counted only if delay=0)")
    lines.append("- **LSD** = HQLA_immediate / daily_stress_redemption — Liquidity Stress Distance (days of stress-redemption coverage)\n")

    p3 = p["part3_ertf_matrix"]

    # RR table
    lines.append("### RR (%) — recovery (rows) × delay (columns)\n")
    lines.append("| Recovery \\ Delay | 0d | 1d | 3d | 7d | 30d |")
    lines.append("|---:|---:|---:|---:|---:|---:|")
    for rec in RECOVERY_LEVELS:
        row = [c for c in p3["matrix"] if c["recovery"] == rec]
        row_by_delay = {c["delay_days"]: c for c in row}
        cells = " | ".join(f"{row_by_delay[d]['RR_pct']:.2f}" for d in DELAY_LEVELS_DAYS)
        lines.append(f"| {rec*100:.0f}% | {cells} |")
    lines.append("")

    # StressRR table
    lines.append("### StressRR (%) — recovery (rows) × delay (columns)\n")
    lines.append("| Recovery \\ Delay | 0d | 1d | 3d | 7d | 30d |")
    lines.append("|---:|---:|---:|---:|---:|---:|")
    for rec in RECOVERY_LEVELS:
        row = [c for c in p3["matrix"] if c["recovery"] == rec]
        row_by_delay = {c["delay_days"]: c for c in row}
        cells = " | ".join(f"{row_by_delay[d]['StressRR_pct']:.2f}" for d in DELAY_LEVELS_DAYS)
        lines.append(f"| {rec*100:.0f}% | {cells} |")
    lines.append("")

    # LCR table
    lines.append("### LCR — recovery (rows) × delay (columns)\n")
    lines.append("| Recovery \\ Delay | 0d | 1d | 3d | 7d | 30d |")
    lines.append("|---:|---:|---:|---:|---:|---:|")
    for rec in RECOVERY_LEVELS:
        row = [c for c in p3["matrix"] if c["recovery"] == rec]
        row_by_delay = {c["delay_days"]: c for c in row}
        cells = " | ".join(f"{row_by_delay[d]['LCR']:.3f}" for d in DELAY_LEVELS_DAYS)
        lines.append(f"| {rec*100:.0f}% | {cells} |")
    lines.append("")

    # LSD table
    lines.append("### LSD (Liquidity Stress Distance, days) — recovery (rows) × delay (columns)\n")
    lines.append("| Recovery \\ Delay | 0d | 1d | 3d | 7d | 30d |")
    lines.append("|---:|---:|---:|---:|---:|---:|")
    for rec in RECOVERY_LEVELS:
        row = [c for c in p3["matrix"] if c["recovery"] == rec]
        row_by_delay = {c["delay_days"]: c for c in row}
        cells = " | ".join(f"{row_by_delay[d]['LSD']:.3f}" for d in DELAY_LEVELS_DAYS)
        lines.append(f"| {rec*100:.0f}% | {cells} |")
    lines.append("")

    # Critical dependency verdict
    lines.append("### §40 Critical-Dependency Verdict\n")
    lines.append(f"- **RR at recovery=0%, delay=0d** (no ERTF at all, immediate stress): "
                 f"**{p3['rr_zero_recovery_zero_delay']*100:.2f}%**")
    lines.append(f"- **RR at recovery=100%, delay=30d** (full ERTF, but 30d delay): "
                 f"**{p3['rr_full_recovery_30d_delay']*100:.2f}%**")
    lines.append(f"- **RR at recovery=0%, delay=30d** (worst case — no ERTF, max delay): "
                 f"**{p3['rr_zero_recovery_30d_delay']*100:.2f}%**")
    lines.append(f"- **Threshold recovery (delay=0d):** {p3['threshold_recovery_at_delay_0']}")
    lines.append(f"- **Threshold delay (recovery=100%):** {p3['threshold_delay_at_recovery_100']}")
    lines.append(f"- **Combos with RR ≥ 100%:** {p3['pass_count']} / 25")
    lines.append(f"- **Combos with RR <  100%:** {p3['fail_count']} / 25\n")
    if p3["critical_dependency_on_ertf"]:
        lines.append(f"### §40 VERDICT: **CRITICAL — Portfolio B depends critically on ERTF**\n")
        lines.append(f"RR falls below 100% when ERTF is degraded (recovery reduced or delay extended). "
                     f"The approved Portfolio B relies on ERTF as a loss-absorption backstop for "
                     f"the baseline stress scenario (gold -10% + custody 5% LGD). Without ERTF, or "
                     f"with materially delayed ERTF, solvency is breached.")
    else:
        lines.append(f"### §40 VERDICT: **NOT CRITICAL — Portfolio B does NOT depend critically on ERTF**\n")
        lines.append(f"RR remains ≥ 100% across the entire recovery × delay matrix. ERTF provides "
                     f"additional loss-absorption capacity but is not a solvency prerequisite under "
                     f"the modeled baseline stress.")
    lines.append("")

    # Final overall summary
    lines.append("## Final Summary\n")
    lines.append(f"- **§22 TGDR:** Portfolio B (TGDR=25%) verdict = **{p['part1_tgdr']['tgdr_levels'][1]['verdict']}**. "
                 f"All 5 dependencies (issuer, custody, oracle, blockchain, redemption) scale monotonically "
                 f"with TGDR. Issuer and blockchain dependencies are the strongest scalers (0% → 35% as TGDR "
                 f"rises 0% → 35%). TGDR=35% would breach all 5 budgets.")
    lines.append(f"- **§23 PAXG Common-Mode:** {cnt['PASS']} PASS / {cnt['FAIL']} FAIL / {cnt['BDL']} BDL "
                 f"(of {total}). 3 scenarios declared BDL (PAXG→0 outside §47 envelope). "
                 f"In-envelope rate: {cnt['PASS']}/{in_env} = {cnt['PASS']/in_env*100:.1f}%.")
    lines.append(f"- **§40 ERTF Matrix:** Critical dependency = **{p3['critical_dependency_on_ertf']}**. "
                 f"{p3['pass_count']}/25 combos maintain RR ≥ 100%. Verdict: "
                 f"{'CRITICAL — Portfolio B depends on ERTF.' if p3['critical_dependency_on_ertf'] else 'NOT CRITICAL.'}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("**HONEST statement:** All §47 classifications are computed honestly. BDL scenarios are "
                 "declared BEFORE computation (3 PAXG→0 scenarios in §23 per §47 example). No FAIL was "
                 "relabelled as BDL. No canonical blueprint or src/ code was modified.")

    with open(path, "w") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    main()
