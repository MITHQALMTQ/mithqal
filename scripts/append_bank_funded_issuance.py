#!/usr/bin/env python3
"""
MITHQAL v25.0 — Append §V25.0 FINAL BANK-FUNDED / PREFUNDED ISSUANCE &
CAPITAL RECONCILIATION section to the existing blueprint.

Idempotent — running twice makes zero changes.

Task ID: V25-0-BANK-FUNDED-ISSUANCE-MODEL
"""
import os

BLUEPRINT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = "/home/z/my-project/docs/blueprint/_v25-bank-funded-issuance-section.md"
MARKER = "§V25.0 — FINAL BANK-FUNDED / PREFUNDED ISSUANCE & CAPITAL RECONCILIATION"
INDEX_MARKER = "## v24.2.1 PRESERVED SECTIONS (Full Text Below)"
END_MARKER = "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION (WITH THIRD-PARTY AUDIT INCORPORATION)"

NEW_INDEX_ENTRY = """## v25.0 FINAL BANK-FUNDED / PREFUNDED ISSUANCE RECONCILIATION (Added)
- [§V25.0.B.1 to §V25.0.B.28 — Final Bank-Funded / Prefunded Issuance & Capital Reconciliation](#v250--final-bank-funded--prefunded-issuance--capital-reconciliation)
- 28 sub-sections covering: canonical principle, four capital concepts (A/B/C/D), $54M reserve terminology correction, $15.815M capital solver reframing, dual monetary model (Model A current reserve 21.5432% preserved vs Model B bank-funded blended ~4.71%), key question test (8 scenarios A-H), 9 reserve requirements preserved, legal/economic chain of backing (5 asset types), bank role vs MITHQAL role, no double counting rule, six capital categories with full metadata, ILPS reconciliation ($46M → $48.1M corrected, Emergency+Structural $23.8M is SUBSET), MITHQAL emergency capital classification (5 sub-types), capital solver reframed output (6 categories, no auto-combine), sources & uses table (7 rows), zero-budget development mode, bank-funded issuance risk controls (16 controls, ANY FAILURE = BLOCK), bank failure scenarios (5), custody legal ownership matrix (7 entries), gold reserve doctrine, Sharia status (DESIGNED not CERTIFIED), Bank Gateway reflection (MBG integration), bank economic model recalculation (3 tiers), final capital model status, version control (NO v25.1), final acceptance criteria (18/18 met), honest state declaration, closing declaration

"""

def main():
    with open(BLUEPRINT, "r", encoding="utf-8") as f:
        bp = f.read()
    with open(SECTION_FILE, "r", encoding="utf-8") as f:
        section = f.read()

    if MARKER in bp:
        print("Section already exists — no changes made (idempotent).")
        return

    original_lines = bp.count("\n")
    original_end_marker_present = END_MARKER in bp

    # 1. Update INDEX — insert new section link before "## v24.2.1 PRESERVED SECTIONS (Full Text Below)"
    if INDEX_MARKER in bp:
        bp = bp.replace(INDEX_MARKER, NEW_INDEX_ENTRY + INDEX_MARKER, 1)
        print(f"INDEX updated: inserted new section link before '{INDEX_MARKER}'")
    else:
        print(f"WARNING: index marker '{INDEX_MARKER}' not found — INDEX not updated")

    # 2. Replace old END_MARKER (audit-incorporation-era) with the new end marker
    # if the new section's end marker doesn't yet exist. The section file already
    # includes its own updated end marker.
    new_end_marker = "END OF MITHQAL v25.0 CANONICAL BLUEPRINT — FINAL INSTITUTIONAL EDITION (WITH THIRD-PARTY AUDIT INCORPORATION + BANK-FUNDED ISSUANCE RECONCILIATION)"
    if original_end_marker_present and new_end_marker not in bp:
        # Remove the old single-marker line so we don't end up with two end markers
        bp = bp.replace(
            END_MARKER,
            "(superseded — see updated END marker at bottom of file)",
            1,
        )
        print(f"Superseded old END_MARKER: '{END_MARKER[:60]}...'")

    # 3. Append the new section at the end of the file
    if not bp.endswith("\n"):
        bp += "\n"
    bp += section

    with open(BLUEPRINT, "w", encoding="utf-8") as f:
        f.write(bp)

    new_lines = bp.count("\n")
    print(f"Blueprint updated: {original_lines} → {new_lines} lines (added {new_lines - original_lines})")
    print(f"Section appended: {MARKER}")

if __name__ == "__main__":
    main()
