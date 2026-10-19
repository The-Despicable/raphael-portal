#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== A. which pattern matched .env.example ==="
PAT='(nvapi-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|postgres(ql)?://[^[:space:]]{4,}:[^[:space:]]{4,}@|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
grep -nEIo "$PAT" .env.example 2>/dev/null | sed 's/:\(.*\)/: matched pattern \1/' | head
echo "  --- the matching line, value masked ---"
grep -nEI "$PAT" .env.example 2>/dev/null | sed -E 's/(=|:\s*).*/\1<MASKED>/' | head -3

echo
echo "=== B. 'sow' matches: substring or standalone word? ==="
for f in package-lock.json scripts/serve.sh scripts/validate-vercel-json.cjs scripts/diag-committed-vercel.cjs; do
  [ -f "$f" ] || continue
  WORDS=$(grep -oiE '.{0,6}sow.{0,6}' "$f" 2>/dev/null | head -2 | tr '\n' ' ')
  echo "  $f -> $WORDS"
done

echo
echo "=== C. 'engagement' contexts (not secrets; showing surrounding text) ==="
for f in README.md scripts/security-gate.sh src/content/architecture.ts src/content/status.ts; do
  echo "  --- $f ---"
  grep -niE 'engagement' "$f" 2>/dev/null | head -2 | cut -c1-150
done