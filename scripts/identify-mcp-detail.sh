#!/usr/bin/env bash
REPO="The-Despicable/computer-control-mcp"

echo "=== README (lines 40-130) ==="
gh api "repos/$REPO/readme" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null | sed -n '40,130p'

echo
echo "=== dependencies / scripts ==="
gh api "repos/$REPO/contents/package.json" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null \
  | python3 -c '
import json,sys
d = json.load(sys.stdin)
print("  scripts:", json.dumps(d.get("scripts") or {}, indent=None)[:300])
print("  deps   :", json.dumps(d.get("dependencies") or {}, indent=None)[:300])
print("  devDeps:", json.dumps(d.get("devDependencies") or {}, indent=None)[:300])
print("  engines:", json.dumps(d.get("engines") or {}))
print("  license:", d.get("license"))
'

echo
echo "=== languages ==="
gh api "repos/$REPO/languages" 2>/dev/null | head -c 300

echo
echo
echo "=== license file present? ==="
gh api "repos/$REPO/license" --jq '.license.spdx_id' 2>/dev/null || echo "  none"

echo
echo "=== src + tests layout ==="
gh api "repos/$REPO/contents/src" --jq '.[] | "  src/\(.name)"' 2>/dev/null | head -20
gh api "repos/$REPO/contents/tests" --jq '.[] | "  tests/\(.name)"' 2>/dev/null | head -20