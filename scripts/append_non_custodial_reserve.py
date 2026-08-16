#!/usr/bin/env python3
"""
MITHQAL v25.0 — Append §V25.0 — FINAL NON-CUSTODIAL RESERVE / BANK-FUNDED
ISSUANCE RECONCILIATION section to the existing blueprint.

Idempotent — running twice makes zero changes.

Task ID: V25-0-NON-CUSTODIAL-RESERVE-ARCHITECTURE
"""
import os
import sys

BLUEPRINT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = "/home/z/my-project/docs/blueprint/_v25-non-custodial-reserve-section.md"
MARKER = "§V25.0 — FINAL NON-CUSTODIAL RESERVE / BANK-FUNDED ISSUANCE RECONCILIATION"
INDEX_MARKER = "## v24.2.1 PRESERVED SECTIONS (Full Text Below)"
OLD_END_MARKER = (
    "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION "
    "(WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION)"
)
NEW_END_MARKER = (
    "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION "
    "(WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION "
    "+ NON-CUSTODIAL RESERVE ARCHITECTURE)"
)

NEW_INDEX_ENTRY = """## v25.0 FINAL NON-CUSTODIAL RESERVE ARCHITECTURE (Added)
- [§V25.0.C.1 to §V25.0.C.31 — Final Non-Custodial Reserve / Verification / Issuance Architecture](#v250--final-non-custodial-reserve--bank-funded-issuance-reconciliation)
- 31 sub-sections covering: constitutional principle (non-custodial by default), final control matrix (5 actors), blueprint language corrections (5 mappings), final bank-mediated flow, RCAF — Reserve Control & Attestation Framework (18 required fields), AvailableBackingCertificate (16 fields, EVIDENCE not custody), 15-step issuance authorization gate, mint authority separation (3 states), 5-way reserve reconciliation, mandatory issuance veto (8 actions), bank misreporting / attestation failure handling, 4-source trust model (Bank + Custodian + MITHQAL + Independent), custody prohibitions (6 — does NOT move to MITHQAL), legal ownership matrix (5 reserve categories, all JURISDICTION_PENDING), redemption obligation profile (JURISDICTION_PENDING), redemption flow, capital model correction (7 categories), Model C re-run (4.7086% blended = same as Model B — non-custodial doesn't change math), zero-budget reality (9-stage evidence pipeline), MBG update (9 handles), security (11 controls), 7 new FV invariants (FV11-FV17), economic model (7 revenue sources), custody concentration (limits apply to actual custody providers, not to MITHQAL), canonical non-custodial statement, 22 forbidden claims + correct alternatives, version control (NO v25.1), 18 test scenarios (NC-T01..NC-T18), production gate (9 conditions), executive report generator, closing declaration
- Honest state: nonCustodialByDefault=true, mithqalHeldAssets=0 by default, 21.5432% PRESERVED for Model A, 4.7086% for Model B and Model C (same — non-custodial doesn't change math)
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

    # 2. Supersede old END_MARKER (bank-funded-era) so the new combined end
    #    marker can take its place. The section file already includes its own
    #    updated end marker.
    if original_end_marker_present and NEW_END_MARKER not in bp:
        bp = bp.replace(
            OLD_END_MARKER,
            "(superseded — see updated END marker at bottom of file)",
            1,
        )
        print(f"Superseded old END_MARKER: '{OLD_END_MARKER[:60]}...'")

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
