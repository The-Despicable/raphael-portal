#!/usr/bin/env bash
echo "=== authenticated GitHub profile (verified owner identity) ==="
gh api user --jq '{login, name, bio, blog, html_url}' 2>&1 | head -20

echo
echo "=== is there any Vesper repo under this owner? ==="
gh repo list The-Despicable --limit 100 --json name,url,visibility \
  | python3 -c '
import json,sys
repos = json.load(sys.stdin)
hits = [r for r in repos if "vesper" in r["name"].lower()]
for r in hits:
    print("  FOUND:", r["name"], r["url"], r["visibility"])
if not hits:
    print("  NO Vesper repo found under this account")
'

echo
echo "=== RupeWatch repo detail ==="
gh repo view The-Despicable/RupeWatch --json name,description,url,visibility,licenseInfo,repositoryTopics 2>&1 | head -c 700

echo
echo
echo "=== RupeWatch README (first 25 lines) ==="
gh api repos/The-Despicable/RupeWatch/readme --jq '.content' 2>/dev/null | base64 -d 2>/dev/null | head -25