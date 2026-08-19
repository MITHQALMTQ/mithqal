#!/usr/bin/env python3
"""
append_v25_2_audit_closure.py — Idempotent append of §V25.2.AUDIT-CLOSURE to blueprint.
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLUEPRINT = ROOT / "docs" / "blueprint" / "mithqal-v25-FINAL-blueprint.md"
SECTION_FILE = ROOT / "docs" / "blueprint" / "_v25_2_audit_closure_section.md"
MARKER = "<!-- §V25.2.AUDIT-CLOSURE-START -->"

def main() -> int:
    bp = BLUEPRINT.read_text(encoding="utf-8")
    if MARKER in bp:
        print("Section already exists — no changes made (idempotent).")
        return 0
    section = SECTION_FILE.read_text(encoding="utf-8")
    if MARKER not in section:
        print("ERROR: section file missing marker", file=sys.stderr); return 1
    if not bp.endswith("\n"): bp += "\n"
    bp += "\n" + section
    BLUEPRINT.write_text(bp, encoding="utf-8")
    print(f"Appended §V25.2.AUDIT-CLOSURE. Blueprint now {bp.count(chr(10))} lines.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
