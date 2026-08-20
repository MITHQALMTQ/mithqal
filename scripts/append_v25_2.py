#!/usr/bin/env python3
"""
append_v25_2.py — Idempotent append of §V25.2 to the MITHQAL v25 FINAL blueprint.

Task ID: V25-2-FINAL-RESERVE-SPEC

Appends the FINAL MTQ INSTITUTIONAL BACKING ARCHITECTURE (controlling reserve
mathematical specification) section to:
    docs/blueprint/mithqal-v25-FINAL-blueprint.md

The section documents all 50 directive sections:
  - §1-6   Institutional backing structure + 130% target
  - §7-16  Currency weight engine (full pipeline)
  - §17    Effective USD exposure
  - §18-19 Currency fall price effects
  - §20-22 Currency lifecycle + floor ladder
  - §23-29 Gold/bullion + silver + tokenized gold
  - §30-36 Digital liquidity + DRQS + state machine
  - §37-42 Reserve valuation + NAVs + RR + FSCR + LCR
  - §43-44 Rebalancing engine
  - §45    What-if scenarios
  - §46-48 Asset admission structure + USDT architecture
  - §49    Blueprint conflict reconciliation (4 conflicts)
  - §50    Final equation system

Idempotent: if the marker string is already present, the script exits
without modifying the file.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLUEPRINT = ROOT / "docs" / "blueprint" / "mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = ROOT / "docs" / "blueprint" / "_v25_2_final_reserve_spec_section.md"

MARKER = "<!-- §V25.2-START -->"
END_MARKER = "<!-- §V25.2-END -->"


def main() -> int:
    if not BLUEPRINT.exists():
        print(f"ERROR: blueprint not found at {BLUEPRINT}", file=sys.stderr)
        return 1
    if not SECTION_FILE.exists():
        print(f"ERROR: section file not found at {SECTION_FILE}", file=sys.stderr)
        return 1

    bp = BLUEPRINT.read_text(encoding="utf-8")
    if MARKER in bp:
        print("Section already exists — no changes made (idempotent).")
        return 0

    section = SECTION_FILE.read_text(encoding="utf-8")
    if MARKER not in section:
        print("ERROR: section file missing marker", file=sys.stderr)
        return 1

    # Append two trailing newlines before the section for clean separation
    if not bp.endswith("\n"):
        bp += "\n"
    bp += "\n" + section

    BLUEPRINT.write_text(bp, encoding="utf-8")
    new_lines = bp.count("\n")
    print(f"Appended §V25.2. Blueprint now {new_lines} lines.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
