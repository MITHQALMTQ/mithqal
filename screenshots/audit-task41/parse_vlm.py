import json, os, re, sys

BASE = "/home/z/my-project/screenshots/audit-task41"
PAGES = ["home", "features", "architecture", "evidence", "contact"]

results = {}
for p in PAGES:
    path = os.path.join(BASE, f"vlm-{p}.json")
    with open(path) as f:
        d = json.load(f)
    content = d["choices"][0]["message"]["content"]
    # strip markdown code fence if present
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```\s*$", "", content)
    try:
        j = json.loads(content)
        results[p] = j
    except Exception as e:
        print(f"PARSE ERROR for {p}: {e}")
        print(content[:500])
        sys.exit(1)

# scorecard table
print()
print("="*100)
print("VLM SCORECARD (raw model output)")
print("="*100)
dims = ["visual_design","information_architecture","visual_hierarchy","color_contrast",
        "typography","spacing_layout","interactivity_engagement","brand_consistency","overall"]
header = f"{'DIMENSION':<28s}" + "".join(f"{p:>12s}" for p in PAGES) + "    AVG"
print(header)
print("-"*len(header))
for dim in dims:
    row = f"{dim:<28s}"
    scores = []
    for p in PAGES:
        s = results[p].get(dim, {}).get("score", "?")
        scores.append(s if isinstance(s,int) else 0)
        row += f"{str(s):>12s}"
    avg = sum(scores)/len(scores) if scores else 0
    row += f"    {avg:.1f}"
    print(row)
print("="*100)
print()

# notes per page
for p in PAGES:
    print()
    print(f"### {p.upper()} ###")
    for dim in dims:
        v = results[p].get(dim, {})
        score = v.get("score","?")
        note = v.get("note") or v.get("verdict","")
        label = dim.upper().replace("_"," ")
        print(f"  {label:<26s} {str(score):>4s}  {note}")
print()

# save consolidated json
with open(os.path.join(BASE,"vlm-consolidated.json"),"w") as f:
    json.dump(results, f, indent=2)
print(f"\nConsolidated JSON saved: {BASE}/vlm-consolidated.json")
