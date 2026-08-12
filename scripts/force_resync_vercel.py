#!/usr/bin/env python3
"""Force re-sync specific keys: list, delete by ID, then re-create."""
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

proj = json.loads(PROJECT_FILE.read_text())
PROJECT_ID = proj["projectId"]
TEAM_ID = proj["orgId"]

TOKEN = os.environ.get("VERCEL_TOKEN", "")
if not TOKEN:
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("VERCEL_TOKEN="):
            TOKEN = line.split("=", 1)[1].strip()
            break

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
            err_body = e.read().decode()[:300] if e.fp else ""
            if e.code in (409, 429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            return e.code, err_body
        except Exception:
            if attempt < retries - 1:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    return 0, {"error": "max retries"}

FORCE_KEYS = sys.argv[1:] if len(sys.argv) > 1 else ["GROQ_API_KEY", "GITHUB_TOKEN"]
print(f"Force re-syncing: {FORCE_KEYS}")
print()

# Load values from .env
env_values = {}
for raw in ENV_FILE.read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, _, v = line.partition("=")
    k = k.strip()
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in ('"', "'"):
        v = v[1:-1]
    env_values[k] = v

# List all envs
def list_all():
    out = []
    url = f"{API}?teamId={TEAM_ID}"
    while url:
        status, body = api_call(url, "GET")
        if status != 200:
            return out
        out.extend(body.get("envs", []))
        paging = body.get("pagination", {})
        if paging.get("next"):
            url = f"{API}?teamId={TEAM_ID}&cursor={paging['next']}"
        else:
            url = None
    return out

existing = list_all()
print(f"Vercel currently has {len(existing)} env entries")

# Delete all entries with the target keys
for key in FORCE_KEYS:
    matches = [e for e in existing if e["key"] == key]
    print(f"\n=== {key}: {len(matches)} existing entries ===")
    for e in matches:
        status = api_call(f"{API}/{e['id']}?teamId={TEAM_ID}", "DELETE")[0]
        print(f"  delete {e['id']} (targets={e.get('target')}): {status}")
    # Wait briefly for delete to propagate
    time.sleep(2)

# Re-fetch in case deletions lagged
print("\nRe-fetching envs to confirm deletions...")
time.sleep(3)
existing_after = list_all()
for key in FORCE_KEYS:
    still = [e for e in existing_after if e["key"] == key]
    if still:
        print(f"  WARN: {key} still has {len(still)} entries after delete")
        # Try once more
        for e in still:
            api_call(f"{API}/{e['id']}?teamId={TEAM_ID}", "DELETE")
        time.sleep(3)

# Re-create
print("\nRe-creating...")
for key in FORCE_KEYS:
    value = env_values.get(key, "")
    if not value:
        print(f"  SKIP {key}: no value in .env")
        continue
    payload = {
        "key": key,
        "value": value,
        "type": "encrypted",
        "target": ["production", "preview", "development"],
    }
    status, body = api_call(f"{API}?teamId={TEAM_ID}", "POST", payload)
    if status in (200, 201):
        print(f"  ✓  {key}")
    else:
        # Try per-target as fallback
        ok = True
        for t in ["production", "preview", "development"]:
            payload_t = {"key": key, "value": value, "type": "encrypted", "target": [t]}
            s, b = api_call(f"{API}?teamId={TEAM_ID}", "POST", payload_t)
            if s not in (200, 201):
                ok = False
                print(f"  ✗  {key} [{t}]: {s} {str(b)[:150]}")
        if ok:
            print(f"  ✓  {key} (per-target)")

print("\nDone.")
