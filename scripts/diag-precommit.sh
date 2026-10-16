#!/usr/bin/env bash
# Pre-commit audit: what would be committed, and does any of it contain a secret?
cd /home/yaser/raphael-portal || exit 1

echo "=== files git would add (count) ==="
git add -An --dry-run . 2>/dev/null | wc -l

echo
echo "=== would .env.local be included? (must be NO) ==="
git add -An --dry-run . 2>/dev/null | grep -c '\.env\.local' | sed 's/^/  matches: /'

echo
echo "=== secret patterns anywhere git would track ==="
# nvapi- (NVIDIA), sk- (OpenAI-style), AKIA (AWS), private keys, postgres URLs
PAT='(nvapi-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?://[^[:space:]]{6,}:[^[:space:]]{4,}@)'
HITS=$(git ls-files -co --exclude-standard | grep -vE '\.png$|\.ico$|\.jpg$' | xargs grep -lEI "$PAT" 2>/dev/null || true)
if [ -z "$HITS" ]; then
  echo "  CLEAN - no credential-shaped strings in tracked files"
else
  echo "  FOUND:"
  echo "$HITS" | sed 's/^/    /'
fi

echo
echo "=== .env.local still ignored? ==="
git check-ignore -q .env.local && echo "  YES" || echo "  NO - PROBLEM"