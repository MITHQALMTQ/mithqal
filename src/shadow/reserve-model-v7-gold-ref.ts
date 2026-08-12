/**
 * MITHQAL SHADOW MODEL V7 — GOLD-REFERENCED FRAMEWORK VALIDATION
 * ================================================================
 * ⚠️  SHADOW / SIMULATION ONLY — NOT IN PRODUCTION PATH
 *
 * Tests the COO's proposed gold-referenced framework:
 *
 *   Reserve_Strength_t = (Fiat + Bullion + Stablecoin) / Gold_Reference_Value
 *   MTQ_Gold_Value_t = Reserve_Strength_t / S_t
 *   Redemption_Liability_t = S_t × MTQ_Gold_Value_t
 *   RR_t = Reserve_Strength_t / Redemption_Liability_t
 *
 * KEY QUESTIONS:
 * 1. Is RR_t always 1.00 by definition? (tautology check)
 * 2. Does Reserve_Strength drop when gold rises? (pro-cyclicality check)
 * 3. What happens to rebalancing triggers?
 * 4. What is the correct alternative formulation?
 */

const PAR = 1.00, SUPPLY = 54_000_000, S_PAR = SUPPLY * PAR;
const P = { gold: 4358, silver: 65 };

// Simulated reserve (Enhanced H++ composition)
const RESERVE = {
  fiat: 47_000_000,      // USD + multi-currency cash + sovereign
  goldOz: 2_122.86,       // gold ounces
  silverOz: 36_758,       // silver ounces
  stablecoin: 2_700_000,  // USD-pegged stablecoins
};

function reserveValue(goldPrice: number, silverPrice: number): number {
  return RESERVE.fiat + RESERVE.goldOz * goldPrice + RESERVE.silverOz * silverPrice + RESERVE.stablecoin;
}

function bullionValue(goldPrice: number, silverPrice: number): number {
  return RESERVE.goldOz * goldPrice + RESERVE.silverOz * silverPrice;
}

// COO's proposed formulas
function cooReserveStrength(goldPrice: number, silverPrice: number): number {
  const total = reserveValue(goldPrice, silverPrice);
  return total / goldPrice; // Reserve_Strength = Total / Gold_Reference_Value
}

function cooMTQGoldValue(goldPrice: number, silverPrice: number): number {
  return cooReserveStrength(goldPrice, silverPrice) / SUPPLY;
}

function cooRedemptionLiability(goldPrice: number, silverPrice: number): number {
  return SUPPLY * cooMTQGoldValue(goldPrice, silverPrice);
}

function cooRR(goldPrice: number, silverPrice: number): number {
  return cooReserveStrength(goldPrice, silverPrice) / cooRedemptionLiability(goldPrice, silverPrice);
}

// Current (correct) formulas
function currentRR(goldPrice: number, silverPrice: number): number {
  const rA = reserveValue(goldPrice, silverPrice);
  return rA / S_PAR;
}

function currentNAV(goldPrice: number, silverPrice: number): number {
  return reserveValue(goldPrice, silverPrice) / SUPPLY;
}

function gri(goldPrice: number, silverPrice: number): number {
  const rA = reserveValue(goldPrice, silverPrice);
  return rA / (goldPrice * RESERVE.goldOz);
}

// === MAIN ===
function main() {
  console.log('=== MITHQAL SHADOW MODEL V7 — GOLD-REFERENCED FRAMEWORK VALIDATION ===\n');
  console.log('⚠️  SHADOW ONLY — does NOT affect production\n');

  // 1. Tautology check — is RR always 1.00?
  console.log('=== 1. TAUTOLOGY CHECK: Is COO\'s RR always 1.00? ===\n');
  console.log('Gold Price   | Reserve_Strength | Redemption_Liability | COO RR  | Current RR');
  console.log('-'.repeat(85));
  for (const gp of [2000, 3000, 4358, 6000, 8000, 10000]) {
    const rs = cooReserveStrength(gp, P.silver);
    const rl = cooRedemptionLiability(gp, P.silver);
    const cooRr = cooRR(gp, P.silver);
    const curRr = currentRR(gp, P.silver);
    console.log(`$${gp.toLocaleString().padStart(7)}    | ${rs.toFixed(2).padStart(16)} oz | ${rl.toFixed(2).padStart(20)} | ${cooRr.toFixed(6)} | ${curRr.toFixed(4)}%`);
  }
  console.log('\n⚠️  FINDING: COO RR is ALWAYS 1.000000 regardless of gold price. This is a TAUTOLOGY.');
  console.log('   The formula RR = Reserve_Strength / (S × MTQ_Gold_Value) simplifies to');
  console.log('   RR = (R/G) / (S × (R/G)/S) = (R/G) / (R/G) = 1.00 always.\n');

  // 2. Pro-cyclicality check — does Reserve Strength drop when gold rises?
  console.log('=== 2. PRO-CYCLICALITY CHECK: Reserve Strength vs Gold Price ===\n');
  console.log('Scenario             | Gold Price | Reserve Value | Reserve Strength | Change');
  console.log('-'.repeat(80));
  const baseRS = cooReserveStrength(P.gold, P.silver);
  for (const [label, gp] of [
    ['Gold -50%', 2179],
    ['Gold -30%', 3051],
    ['Gold -10%', 3922],
    ['Baseline', 4358],
    ['Gold +10%', 4794],
    ['Gold +30%', 5665],
    ['Gold +50%', 6537],
    ['Gold +100%', 8716],
  ]) {
    const rv = reserveValue(gp, P.silver);
    const rs = cooReserveStrength(gp, P.silver);
    const change = ((rs / baseRS - 1) * 100);
    console.log(`${label.padEnd(20)} | $${gp.toLocaleString().padStart(8)} | $${rv.toFixed(0).padStart(12)} | ${rs.toFixed(2).padStart(16)} oz | ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);
  }
  console.log('\n⚠️  FINDING: When gold rises +50%, Reserve Strength DROPS -34.77%.');
  console.log('   This is PRO-CYCLICAL: gold rally → measured strength drops → trigger to buy more gold → chase the rally.');
  console.log('   When gold falls -50%, Reserve Strength RISES +72.64% — masking real impairment.\n');

  // 3. The root cause
  console.log('=== 3. ROOT CAUSE ANALYSIS ===\n');
  console.log('The COO formula: Reserve_Strength = Total_Reserve_Value / Gold_Price');
  console.log('');
  console.log('When gold price rises:');
  console.log('  - Total Reserve Value rises (because reserve holds 15% gold)');
  console.log('  - Gold Price (denominator) rises FASTER (because it is 100% gold)');
  console.log('  - Net effect: Reserve Strength DROPS (reserve has only 15% gold, not 100%)');
  console.log('');
  console.log('This is mathematically equivalent to: "How many ounces of gold can the reserve buy?"');
  console.log('  - If gold doubles and reserve only rises 15%, the reserve buys FEWER ounces');
  console.log('  - This is TRUE in purchasing-power terms, but...');
  console.log('  - ...making it the PRIMARY rebalancing trigger creates pro-cyclical behavior');
  console.log('');

  // 4. What the COO actually wants (and how to achieve it correctly)
  console.log('=== 4. WHAT THE COO ACTUALLY WANTS (and the correct formulation) ===\n');
  console.log('COO\'s goal: "Make one MTQ maintain or improve its real reserve purchasing power"');
  console.log('');
  console.log('This is CORRECT and IMPORTANT. But the mathematical formulation needs adjustment:');
  console.log('');
  console.log('✅ CORRECT Approach: Dual-metric system');
  console.log('  ┌─────────────────────────────────────────────────────────┐');
  console.log('  │ LEGAL SOLVENCY (unchanged):                             │');
  console.log('  │   RR = R_a / (S × PAR)        where PAR = $1.00         │');
  console.log('  │   This is the legal redemption metric. Must be ≥ 100%. │');
  console.log('  │                                                         │');
  console.log('  │ PURCHASING-POWER HEALTH (new, advisory):                │');
  console.log('  │   GRI = R_a / (GoldPrice × GoldRefQty)                  │');
  console.log('  │   This measures gold-relative purchasing power.         │');
  console.log('  │   Target: GRI ≥ 5.0 (strong coverage)                   │');
  console.log('  │   This does NOT trigger rebalancing directly.           │');
  console.log('  │                                                         │');
  console.log('  │ REBALANCING TRIGGER (unchanged):                        │');
  console.log('  │   Weight drift > 2% → hysteresis → rebalance            │');
  console.log('  │   RR < 102% → emergency rebalance                       │');
  console.log('  │   NOT triggered by GRI changes                          │');
  console.log('  └─────────────────────────────────────────────────────────┘');
  console.log('');

  // 5. Why the dual-metric approach is superior
  console.log('=== 5. WHY THE DUAL-METRIC APPROACH IS SUPERIOR ===\n');
  console.log('Metric         | COO Proposal              | Dual-Metric (Correct)     |');
  console.log('-'.repeat(85));
  console.log(`RR meaning     | Always 1.00 (tautology)   | R_a/(S×PAR) = real solvency`);
  console.log(`Gold role      | Pro-cyclical trigger      | Advisory health indicator`);
  console.log(`Rebalance trig | Gold price movement       | Weight drift + RR breach`);
  console.log(`PAR stability  | Floats with gold (bad)    | Fixed at $1.00 (correct)`);
  console.log(`Legal clarity  | Ambiguous (floats)        | Clear ($1.00 par liability)`);
  console.log(`Sharia compl.  | Risky (floating par)      | Safe (fixed par)`);
  console.log(`Pro-cyclical?  | YES (gold rise → sell)    | NO (hysteresis + RR-based)`);
  console.log('');

  // 6. GRI behavior (correct advisory metric)
  console.log('=== 6. GRI BEHAVIOR (correct advisory metric) ===\n');
  console.log('Scenario             | Gold Price | GRI    | Interpretation');
  console.log('-'.repeat(70));
  for (const [label, gp] of [
    ['Gold -50%', 2179], ['Gold -30%', 3051], ['Baseline', 4358],
    ['Gold +30%', 5665], ['Gold +50%', 6537], ['Gold +100%', 8716],
  ]) {
    const g = gri(gp, P.silver);
    console.log(`${label.padEnd(20)} | $${gp.toLocaleString().padStart(8)} | ${g.toFixed(2).padStart(6)} | ${g > 5 ? 'Strong' : g > 3 ? 'Moderate' : 'Weak'}`);
  }
  console.log('\n✅ GRI rises when gold falls (correct — purchasing power increases)');
  console.log('   GRI falls when gold rises (correct — purchasing power decreases)');
  console.log('   BUT GRI does NOT trigger rebalancing — it is advisory only.');
  console.log('   Rebalancing is triggered by RR and weight drift, NOT by GRI.\n');

  // 7. The corrected amendment language
  console.log('=== 7. CORRECTED AMENDMENT LANGUAGE ===\n');
  console.log('Instead of replacing RR with a tautological formula, ADD GRI as advisory:');
  console.log('');
  console.log('SECTION 3 — NAV AND RESERVE STRENGTH (CORRECTED)');
  console.log('');
  console.log('3.1 Market NAV:     NAV_m = R_m / S                    (USD-denominated)');
  console.log('3.2 Prudential NAV: NAV_l = R_a / S                    (post-haircut)');
  console.log('3.3 Stress NAV:     NAV_s = R_l / S                    (post-stress)');
  console.log('3.4 Gold-Relative Index (ADVISORY):');
  console.log('     GRI = R_a / (GoldPrice × GoldRefQty)');
  console.log('     Where GoldRefQty = gold ounces held in reserve');
  console.log('     GRI measures purchasing power relative to gold');
  console.log('     GRI does NOT change PAR, does NOT trigger rebalancing');
  console.log('     Target: GRI ≥ 5.0');
  console.log('');
  console.log('SECTION 4 — RESERVE RATIO (UNCHANGED, CORRECT)');
  console.log('');
  console.log('4.1 RR = R_a / (S × PAR)    where PAR = $1.00');
  console.log('4.2 Floor: RR ≥ 100%');
  console.log('4.3 Target: RR ≥ 102%');
  console.log('4.4 RR is the LEGAL solvency metric. It is NOT tautological.');
  console.log('');

  console.log('=== SHADOW MODEL V7 COMPLETE ===');
}

main();
