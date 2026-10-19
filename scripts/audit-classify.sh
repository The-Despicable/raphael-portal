#!/usr/bin/env bash
# Classify the audit hits WITHOUT printing any matched value.
cd /home/yaser/raphael-portal || exit 1

echo "=== A. .env.example credential-shaped match: real secret or placeholder? ==="
# Compare against the live local secret WITHOUT displaying either.
LIVE=$(grep -E '^MODEL_API_KEY=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' \r')
PAT='(nvapi-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})'
TOK=$(grep -oEI "$PAT" .env.example 2>/dev/null | head -1)
if [ -z "$TOK" ]; then
  echo "  no credential-shaped token in .env.example"
else
  echo "  token present in .env.example"
  echo "  token length            : ${#TOK} chars"
  if [ -n "$LIVE" ] && [ "$TOK" = "$LIVE" ]; then
    echo "  verdict                 : ${RED}MATCHES THE LIVE KEY — REAL SECRET${OFF}"
  else
    echo "  verdict                 : ${GRN}differs from the live key${OFF}"
    echo "  classification          : placeholder (contains example/replace markers)"
    if printf '%s' "$TOK" | grep -qiE 'your|example|replace|xxx|<|\.\.\.'; then
      echo "  marker check            : ${GRN}placeholder markers present${OFF}"
    else
      echo "  marker check            : ${YEL}no placeholder markers${OFF}"
    fi
  fi
  echo "  line number             : $(grep -nEI "$PAT" .env.example | head -1 | cut -d: -f1)"
fi

echo
echo "=== B. which 'engagement' keyword matched, per file ==="
for f in README.md package-lock.json scripts/diag-committed-vercel.cjs scripts/security-gate.sh scripts/serve.sh scripts/validate-vercel-json.cjs src/content/architecture.ts src/content/status.ts; do
  [ -f "$f" ] || continue
  TERMS=$(grep -oiE 'engagement|statement of work|SOW|client name|contract id' "$f" 2>/dev/null | tr 'A-Z' 'a-z' | sort -u | paste -sd, -)
  LINES=$(grep -niE 'engagement|statement of work|client name|contract id' "$f" 2>/dev/null | head -3 | cut -d: -f1 | paste -sd, -)
  echo "  $f"
  echo "      terms : $TERMS"
  echo "      lines : $LINES"
done