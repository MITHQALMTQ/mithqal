# Mithqal Blueprint Documentation

This directory contains the **single canonical blueprint** for MITHQAL.

## Canonical Document

### `mithqal-canonical-blueprint.md`

**Version:** 24.2.1-FINAL
**Date:** 2026-08-13
**Status:** CANONICAL — sole source of truth for all monetary, reserve, governance, legal, technical, and operational requirements.

This is the ONLY blueprint document. All prior versions (v18, v19, v20, v21, v22, v23, v24, v24.1, v24.2) have been removed. Historical text from those versions is retained as non-normative archive within the canonical document itself.

## Key Contents

- **Institutional Constitution** — 17 Articles (identity, neutrality, governance)
- **Monetary Constitution** — 9 Articles (PAR, RR, reserve principles, monetary metals)
- **Policy Framework** — 8 Articles (dynamic ranges, fees, sanctions, risk tolerances)
- **Technical Framework** — 8 Articles (smart contracts, oracles, security, formal verification)
- **Operations** — 7 Articles (reserve management, transactions, compliance, vendor management)

## v24.2.1 Amendments (Active)

1. CALM correction (NORMAL=1.20, monotonically increasing)
2. Tokenized Allocated Gold (TGRS/TGLS/TGBS, 13-point eligibility gate)
3. Conditional Silver (SDC_Ag, 0% normal target, 0-3% conditional band)
4. φ_t rewrite (gold mandatory dominant, silver conditional)
5. BRI revision (GoldResilienceIndex + ConditionalMetalDiversificationIndex)
6. Liquidation order (tokenized gold before physical gold)
7. Subsystem state reconciliation (7 subsystems, global ≥ highest)
8. A/B/C/D/E portfolio comparison (common random numbers)
9. Separated oracle architecture (GoldNAV ≠ PAXG market)
10. Anti-double-counting formal proof (32/32 PASS)

## Selected Portfolio

**Portfolio B — APPROVED CANDIDATE:**
- Physical Gold = 15% (allocated vault)
- Tokenized Gold = 5% (PAXG only — TGRS 9.00)
- Silver = 0% (conditional, SDC_Ag-negative)
- Fiat = 77.5% (10-currency basket)
- Digital = 2.5% (USDC/USDP/EURC/BUIDL)

## Validation

6-task validation cycle complete. 17/22 acceptance gates satisfied. See Appendix V24.2.1-V in the blueprint for full results.

## Governance Status

APPROVED CANDIDATE — PENDING INDEPENDENT INSTITUTIONAL VALIDATION.
NOT production-certified. NOT regulator-approved. NOT risk-free.

## For More Information

- **GitHub:** https://github.com/MITHQALMTQ/mithqal
- **Blueprint:** https://github.com/MITHQALMTQ/mithqal/blob/main/docs/blueprint/mithqal-canonical-blueprint.md
