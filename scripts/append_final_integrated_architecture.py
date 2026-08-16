#!/usr/bin/env python3
"""
MITHQAL v25.0 — Append §V25.0.D — FINAL INTEGRATED INSTITUTIONAL / BANKING /
RESERVE / GOLD / REBALANCING ARCHITECTURE section to the existing blueprint.

Idempotent — running twice makes zero changes.

Task ID: V25-0-FINAL-INTEGRATED-ARCHITECTURE
"""
import os
import sys

BLUEPRINT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = "/home/z/my-project/docs/blueprint/_v25-final-integrated-architecture-section.md"
MARKER = "§V25.0 — FINAL INTEGRATED INSTITUTIONAL / BANKING / RESERVE / GOLD / REBALANCING ARCHITECTURE"
INDEX_MARKER = "## v24.2.1 PRESERVED SECTIONS (Full Text Below)"
OLD_END_MARKER = (
    "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION "
    "(WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION "
    "+ NON-CUSTODIAL RESERVE ARCHITECTURE)"
)
NEW_END_MARKER = (
    "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION "
    "(WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION "
    "+ NON-CUSTODIAL RESERVE ARCHITECTURE + FINAL INTEGRATED ARCHITECTURE)"
)

NEW_INDEX_ENTRY = """## v25.0 FINAL INTEGRATED ARCHITECTURE (Added)
- [§V25.0.D.A to §V25.0.D.AT — Final Integrated Institutional / Banking / Reserve / Gold / Rebalancing Architecture](#v250--final-integrated-institutional--banking--reserve--gold--rebalancing-architecture)
- 45 sub-sections covering: Version Control, 50 Reconciliation Principles, Final Corporate Structure (5 entities: Founder Shareholders, MITHQAL Holding, Operating Co, Technology Co, Foundation), Founder Economics, 7-Layer MTQ Canonical Model, Bank Integration (TRANSLATION NOT TRANSFORMATION), Bank Responsibilities (13/4/6), Operating Co Responsibilities (15 + Monetary & Reserve Control Division), Foundation Responsibilities (11 SHALL / 8 SHALL NOT / READ_ONLY), Technology Co (12 owns), Reserve Custody Principle (non-custodial by default — ref §V25.0.C), Constitutional Corridors (fiat 70-85% / bullion 15-25% / digital 0-5%), Currency Weight Engine (6-step), Bullion Weighting (gold primary / silver conditional), Operational Digital Liquidity (0-5% — not monetary anchor), Three-Layer Reserve Valuation (R_m / R_a / R_l), Gold Acquisition (16-step workflow), Reserve Acquisition Funding (6 NOTs), Rebalancing Engine (13-step + 9 preserve), No-Trade Principle, Rebalancing Example (PAR-equivalent denomination-neutral), DMCE (MIN of 8 limits), RCAF + ABC (ref §V25.0.C), Bank Minting Workflow (16 steps), Bank Backing Failure (ref §V25.0.C), Five-Way Reconciliation (ref §V25.0.C), Bank Monitoring Authority, Foundation Oversight (READ_ONLY), Gold/Reserve Revenue (6 NOT profit / 8 MAY fees), Operating Capital (7 NOT sources / 9 funds), Capital Model (6 categories + ΔCapital_min $15.815M), Nomenclature (PAR-referenced not USD-backed), Redemption (bank-mediated), Failure Scenarios (8: BANK_FAILURE/SUSPENSION/INSOLVENCY/LIQUIDITY_STRESS/GATEWAY_OUTAGE/CUSTODIAN_FAILURE/SUSPENSION/RESERVE_ASSET_DISQUALIFICATION), Technology Services (13), Data Models (16), API Endpoints (12 versioned /gateway/v1/*), FV11-FV25 (15 invariants; 8 NEW: FV18-FV25), Test Scenarios (INT-T01..INT-T35 = 35), Dashboards (Monetary 20 + Bank 6 + Foundation 7), Commercial Economics, Authority Matrix (7 actors × 17 functions), Gold/Rebalancing Authority (8 roles), No Contradictory Authority (13 phrases), Acceptance Criteria (44), Final Output Summary
- Honest state preserved throughout: 21.5432% PRESERVED for Model A, 4.7086% PRESERVED for Model B/C, ΔCapital_min $15.815M MODEL-DERIVED ADDITIONAL MONETARY PROTECTION REQUIREMENT, ILPS $48.1M corrected, nonCustodialByDefault=true, v25.0 FROZEN (no v25.1 created)
- Final status (unchanged): APPROVED CANDIDATE FOR CONTROLLED TESTING — NOT PRODUCTION-AUTHORIZED

"""


def main():
    if not os.path.exists(BLUEPRINT):
        print(f"ERROR: blueprint not found: {BLUEPRINT}")
        sys.exit(1)
    if not os.path.exists(SECTION_FILE):
        print(f"ERROR: section file not found: {SECTION_FILE}")
        sys.exit(1)

    with open(BLUEPRINT, "r", encoding="utf-8") as f:
        bp = f.read()
    with open(SECTION_FILE, "r", encoding="utf-8") as f:
        section = f.read()

    if MARKER in bp:
        print("Section already exists — no changes made (idempotent).")
        return

    original_lines = bp.count("\n")
    original_end_marker_present = OLD_END_MARKER in bp

    # 1. Update INDEX — insert new section link before
    #    "## v24.2.1 PRESERVED SECTIONS (Full Text Below)"
    if INDEX_MARKER in bp:
        bp = bp.replace(INDEX_MARKER, NEW_INDEX_ENTRY + INDEX_MARKER, 1)
        print(f"INDEX updated: inserted new section link before '{INDEX_MARKER}'")
    else:
        print(f"WARNING: index marker '{INDEX_MARKER}' not found — INDEX not updated")

    # 2. Supersede old END_MARKER (non-custodial-era) so the new combined end
    #    marker can take its place.
    if original_end_marker_present and NEW_END_MARKER not in bp:
        bp = bp.replace(
            OLD_END_MARKER,
            "(superseded — see updated END marker at bottom of file)",
            1,
        )
        print(f"Superseded old END_MARKER: '{OLD_END_MARKER[:60]}...")

    # 3. Append the new section at the end of the file
    if not bp.endswith("\n"):
        bp += "\n"
    bp += section

    with open(BLUEPRINT, "w", encoding="utf-8") as f:
        f.write(bp)

    new_lines = bp.count("\n")
    print(f"Blueprint updated: {original_lines} → {new_lines} lines "
          f"(added {new_lines - original_lines})")
    print(f"Section appended: {MARKER}")


if __name__ == "__main__":
    main()
