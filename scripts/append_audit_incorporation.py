#!/usr/bin/env python3
"""
MITHQAL v25.0 — Append §V25.0 FINAL THIRD-PARTY AUDIT INCORPORATION section
to the existing blueprint. Idempotent — running twice makes zero changes.
"""
import os

BLUEPRINT = "/home/z/my-project/docs/blueprint/mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = "/home/z/my-project/docs/blueprint/_v25-audit-incorporation-section.md"
MARKER = "§V25.0 — FINAL THIRD-PARTY AUDIT INCORPORATION / EVIDENCE AMENDMENTS"

def main():
    with open(BLUEPRINT, "r", encoding="utf-8") as f:
        bp = f.read()
    with open(SECTION_FILE, "r", encoding="utf-8") as f:
        section = f.read()

    if MARKER in bp:
        print("Section already exists — no changes made (idempotent).")
        return

    original_lines = bp.count("\n")

    # 1. Update the INDEX — insert new section link before "## v24.2.1 PRESERVED SECTIONS"
    index_marker = "## v24.2.1 PRESERVED SECTIONS"
    new_index_entry = """## v25.0 FINAL THIRD-PARTY AUDIT INCORPORATION (Added)
- [§V25.0.A.1 to §V25.0.A.25 — Final Third-Party Audit Incorporation / Evidence Amendments](#v250--final-third-party-audit-incorporation--evidence-amendments)
- 25 sub-sections covering: core architecture preservation (21 frozen invariants), gold anchor (corrected language), SWIFT position (confirmed), Bank Gateway sidecar (kept), Foundation/JOZOUR structure (legal validation required), 21.54% model (renamed MODELED CONSTITUTIONAL RESERVE BREACH PROBABILITY), $15.815M capital (interpretation changed), capital classification (6 categories), funding probability claims (removed — replaced with 8-stage evidence pipeline), success probability claims (removed — replaced with 5-status classification), Foundation governance (9 requirements), Sharia governance (distinguished DESIGNED vs CERTIFIED), MTQ-PvP Engine (new P1 priority), CBDC bridge (status classification), PFMI (assessment required — 10 areas), market positioning (corrected), BRICS (repositioned modular optional), UAE (leading candidate — not approved), custody (6 statuses), smart contract release train (10 stages), claims/evidence discipline (6 levels), final status (unchanged), document version (frozen), audit reconciliation matrix (24 rows), closing declaration

"""
    if index_marker in bp:
        bp = bp.replace(index_marker, new_index_entry + index_marker, 1)
        print(f"INDEX updated: inserted new section link before '{index_marker}'")
    else:
        print(f"WARNING: index marker '{index_marker}' not found — INDEX not updated")

    # 2. Append the new section at the end of the file
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
