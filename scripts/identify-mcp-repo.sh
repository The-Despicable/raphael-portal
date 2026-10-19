#!/usr/bin/env bash
REPO="The-Despicable/computer-control-mcp"

echo "=== remote package.json ==="
gh api "repos/$REPO/contents/package.json" --jq '.content' 2>/dev/null \
  | base64 -d 2>/dev/null \
  | python3 -c '
import json,sys
try:
    d = json.load(sys.stdin)
except Exception as e:
    print("  parse failed:", e); raise SystemExit
for k in ("name","version","description","repository","bin","type"):
    v = d.get(k)
    if isinstance(v, dict):
        v = json.dumps(v)
    print(f"  {k:11}: {v}")
'

echo
echo "=== remote README (first 40 lines) ==="
gh api "repos/$REPO/readme" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null | head -40

echo
echo "=== repo tree (top level) ==="
gh api "repos/$REPO/contents" --jq '.[] | "  \(.type)\t\(.name)"' 2>/dev/null | head -30