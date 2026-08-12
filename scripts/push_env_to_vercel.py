#!/usr/bin/env python3
"""
Push every KEY=VALUE pair from .env to Vercel (production + preview + development).

For each var:
  1. Fetch existing envs from Vercel
  2. Delete ALL existing entries with that key (across all targets)
  3. Re-create with the new value in all 3 targets, as `encrypted` (not `sensitive`,
     so they're readable but still protected at rest)

Uses the Vercel REST API directly — non-interactive, fast.
"""
import json
import os
import sys
import time
from pathlib import Path
import urllib.request
import urllib.parse
import urllib.error

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
PROJECT_FILE = ROOT / ".vercel" / "project.json"

# Load project + token
proj = json.loads(PROJECT_FILE.read_text())
PROJECT_ID = proj["projectId"]
TEAM_ID = proj["orgId"]

# Token can come from env or .env
TOKEN = os.environ.get("VERCEL_TOKEN", "")
if not TOKEN:
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("VERCEL_TOKEN="):
            TOKEN = line.split("=", 1)[1].strip()
            break
if not TOKEN:
    print("ERROR: VERCEL_TOKEN not found in env or .env", file=sys.stderr)
    sys.exit(1)

API = f"https://api.vercel.com/v9/projects/{PROJECT_ID}/env"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def api_call(url, method="GET", data=None, retries=3):
    for attempt in range(retries):
        try:
            req_data = json.dumps(data).encode() if data is not None else None
            req = urllib.request.Request(url, data=req_data, method=method, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode()
                return resp.status, json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode()[:200] if e.fp else ""
            if e.code in (409, 429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            return e.code, err_body
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    return 0, {"error": "max retries exceeded"}

def parse_env(path):
    """Yield (key, value) tuples from a .env file, skipping comments and blanks."""
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        # Strip surrounding quotes
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        if not key or not value:
            continue
        yield key, value

def list_existing():
    """Return list of {id, key, target} for all existing env vars on Vercel."""
    out = []
    url = f"{API}?teamId={TEAM_ID}"
    while url:
        status, body = api_call(url, "GET")
        if status != 200:
            print(f"  ERROR listing envs: {status} {body}", file=sys.stderr)
            return out
        for e in body.get("envs", []):
            out.append({"id": e["id"], "key": e["key"], "target": e.get("target", [])})
        # Pagination
        paging = body.get("pagination", {})
        if paging.get("next"):
            url = f"{API}?teamId={TEAM_ID}&cursor={paging['next']}"
        else:
            url = None
    return out

def delete_env(env_id):
    url = f"{API}/{env_id}?teamId={TEAM_ID}"
    status, body = api_call(url, "DELETE")
    return status

def create_env(key, value, targets):
    """Create a single env var with the given targets. type=encrypted (value hidden
    in dashboard but readable via API)."""
    url = f"{API}?teamId={TEAM_ID}"
    payload = {
        "key": key,
        "value": value,
        "type": "encrypted",
        "target": targets,
    }
    status, body = api_call(url, "POST", payload)
    return status, body

def main():
    if not ENV_FILE.exists():
        print(f"ERROR: {ENV_FILE} not found", file=sys.stderr)
        sys.exit(1)

    pairs = list(parse_env(ENV_FILE))
    print(f"Loaded {len(pairs)} vars from .env")
    print(f"Project: {proj['projectName']} ({PROJECT_ID})")
    print()

    # 1. List existing
    print("Fetching existing env vars from Vercel...")
    existing = list_existing()
    print(f"  Found {len(existing)} existing entries")
    print()

    # 2. Delete all existing entries (across all targets) — we'll re-create them
    if existing:
        print("Deleting all existing entries (will be re-created)...")
        deleted = 0
        for e in existing:
            status = delete_env(e["id"])
            if status in (200, 204):
                deleted += 1
            else:
                print(f"  WARN: failed to delete {e['key']} ({e['id']}): {status}")
        print(f"  Deleted {deleted}/{len(existing)}")
        print()

    # 3. Create new entries in all 3 targets
    print("Creating new entries (production + preview + development)...")
    targets = ["production", "preview", "development"]
    created_ok = 0
    failed = []
    for key, value in pairs:
        # Try creating with all 3 targets at once
        status, body = create_env(key, value, targets)
        if status in (200, 201):
            created_ok += 1
            print(f"  ✓  {key}")
        else:
            # Some Vercel projects reject multi-target creation. Fall back to one-by-one.
            ok_per_target = True
            for t in targets:
                s, b = create_env(key, value, [t])
                if s not in (200, 201):
                    ok_per_target = False
                    print(f"  ✗  {key} [{t}]: {s} {str(b)[:120]}")
            if ok_per_target:
                created_ok += 1
                print(f"  ✓  {key} (per-target)")
            else:
                failed.append(key)

    print()
    print("=" * 50)
    print(f"  Done: {created_ok}/{len(pairs)} vars synced")
    if failed:
        print(f"  Failed: {', '.join(failed)}")
    print("  Next: trigger a redeploy:")
    print(f"    vercel --prod --token $VERCEL_TOKEN")
    print("=" * 50)

if __name__ == "__main__":
    main()
