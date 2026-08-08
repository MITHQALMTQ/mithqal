#!/usr/bin/env python3
"""
MITHQAL — Turso database backup.

Dumps the schema (CREATE TABLE statements) and row counts for every table
in the Turso libsql database. The output is a SQL file that can be used to
reconstruct the schema in a local SQLite database.

Usage:
    python3 scripts/backup_turso.py [output_path]

If output_path is not given, writes to backups/mithqal-<timestamp>/turso-backup.sql.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = REPO_ROOT / ".env"

def load_env():
    env = {}
    if not ENV_FILE.exists():
        return env
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def turso_call(url, token, sql):
    """Execute a SQL statement via the libsql HTTP pipeline API."""
    https_url = url.replace("libsql://", "https://")
    payload = json.dumps({
        "requests": [{"type": "execute", "stmt": {"sql": sql}}]
    }).encode()
    req = urllib.request.Request(
        f"{https_url}/v2/pipeline",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

def extract_rows(response):
    """Extract rows from a pipeline API response."""
    results = response.get("results", [])
    if not results:
        return [], []
    result = results[0].get("response", {})
    if result.get("type") != "execute":
        return [], []
    res = result.get("result", {})
    cols = [c.get("name", "") for c in res.get("cols", [])]
    rows = []
    for row in res.get("rows", []):
        row_vals = []
        for cell in row:
            if cell.get("type") == "text":
                row_vals.append(cell.get("value", ""))
            elif cell.get("type") == "integer":
                row_vals.append(int(cell.get("value", "0")))
            elif cell.get("type") == "float":
                row_vals.append(float(cell.get("value", "0")))
            elif cell.get("type") == "blob":
                row_vals.append(cell.get("value", ""))
            elif cell.get("type") == "null":
                row_vals.append(None)
            else:
                row_vals.append(cell.get("value", ""))
        rows.append(row_vals)
    return cols, rows

def main():
    env = load_env()
    url = env.get("DATABASE_URL", "")
    token = env.get("DATABASE_AUTH_TOKEN", "")
    if not url or not token:
        print("ERROR: DATABASE_URL or DATABASE_AUTH_TOKEN not set in .env", file=sys.stderr)
        sys.exit(1)

    # Output path
    if len(sys.argv) > 1:
        out_path = Path(sys.argv[1])
    else:
        backup_dir = Path("/home/z/my-project/backups")
        ts = datetime.now().strftime("%Y%m%d-%H%M%S")
        out_path = backup_dir / f"mithqal-{ts}" / "turso-backup.sql"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Backing up Turso DB to: {out_path}")

    # 1. Get schema
    try:
        resp = turso_call(url, token,
            "SELECT sql FROM sqlite_master WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'")
        _, schema_rows = extract_rows(resp)
    except Exception as e:
        print(f"  ERROR getting schema: {e}", file=sys.stderr)
        schema_rows = []

    # 2. Get table list
    try:
        resp = turso_call(url, token,
            "SELECT name FROM sqlite_master WHERE type='table' "
            "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%'")
        _, table_rows = extract_rows(resp)
        tables = [r[0] for r in table_rows if r]
    except Exception as e:
        print(f"  ERROR getting tables: {e}", file=sys.stderr)
        tables = []

    # 3. Write backup
    with open(out_path, "w") as f:
        f.write(f"-- MITHQAL Turso DB backup\n")
        f.write(f"-- Timestamp: {datetime.now().isoformat()}\n")
        f.write(f"-- Source: {url}\n")
        f.write(f"-- Tables: {len(tables)}\n\n")

        # Schema
        f.write("-- ===== SCHEMA =====\n\n")
        for row in schema_rows:
            if row and row[0]:
                f.write(f"{row[0]};\n\n")

        # Row counts
        f.write("\n-- ===== ROW COUNTS =====\n\n")
        for table in tables:
            try:
                resp = turso_call(url, token, f"SELECT COUNT(*) FROM {table}")
                _, count_rows = extract_rows(resp)
                count = count_rows[0][0] if count_rows else 0
                f.write(f"-- {table}: {count} rows\n")
            except Exception as e:
                f.write(f"-- {table}: ERROR ({e})\n")

        # Sample data (first 10 rows per table)
        f.write("\n-- ===== SAMPLE DATA (first 10 rows per table) =====\n\n")
        for table in tables:
            try:
                resp = turso_call(url, token, f"SELECT * FROM {table} LIMIT 10")
                cols, rows = extract_rows(resp)
                f.write(f"-- Table: {table} ({len(rows)} sample rows, cols: {cols})\n")
                for row in rows:
                    f.write(f"--   {row}\n")
                f.write("\n")
            except Exception as e:
                f.write(f"-- Table: {table}: ERROR ({e})\n\n")

    size = out_path.stat().st_size
    print(f"  ✓ Backup complete: {out_path} ({size} bytes)")
    print(f"  ✓ Tables: {len(tables)}")
    print(f"  ✓ Schema statements: {len(schema_rows)}")

if __name__ == "__main__":
    main()
