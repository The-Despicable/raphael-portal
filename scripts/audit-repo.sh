#!/usr/bin/env bash
# Repository + history audit. SANITIZED OUTPUT ONLY:
# reports file locations and categories, never values.
cd /home/yaser/raphael-portal || exit 1

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; DIM=$'\033[2m'; OFF=$'\033[0m'

echo "=== 1. CREDENTIAL-SHAPED STRINGS (values withheld) ==="
PAT='(nvapi-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?://[^[:space:]]{4,}:[^[:space:]]{4,}@|AIza[0-9A-Za-z_-]{30,})'
# .env.example legitimately documents a placeholder DSN of the form
# postgres://USER:PASSWORD@host, which is credential-SHAPED but not a secret.
# Exclude it from the "HIT" verdict and report it separately so the result is
# not quietly inflated by a known-good pattern.
HITS=$(git ls-files | grep -v '^\.env\.example$' | xargs grep -lEI "$PAT" 2>/dev/null || true)
EX=$(git ls-files | grep '^\.env\.example$' | xargs grep -lEI "$PAT" 2>/dev/null || true)
if [ -z "$HITS" ]; then echo "  ${GRN}CLEAN${OFF} — no matches in tracked files"; else
  echo "$HITS" | sed "s/^/  ${RED}HIT${OFF} (file only): /"
fi
[ -n "$EX" ] && echo "  ${DIM}note: credential-shaped placeholder in .env.example (documented DSN) — not a secret${OFF}"

echo
echo "=== 2. CREDENTIALS ACROSS FULL GIT HISTORY ==="
COMMITS=$(git rev-list --all --count)
if [ "$COMMITS" -le 1 ]; then
  echo "  ${DIM}N/A — ${COMMITS} commit(s); history is the working tree already scanned${OFF}"
else
  # .env.example is excluded for the same reason as section 1: it documents a
  # placeholder DSN by design. Including it would report a known-benign hit on
  # every run and train the reader to ignore this section.
  HH=$(git grep -lEI "$PAT" $(git rev-list --all) 2>/dev/null \
        | sed 's/^[^:]*://' | grep -v '^\.env\.example$' | sort -u || true)
  if [ -z "$HH" ]; then
    echo "  ${GRN}CLEAN${OFF} across ${COMMITS} commits (excluding the documented .env.example placeholder)"
  else
    echo "$HH" | sed "s/^/  ${RED}HIT${OFF} (file only): /"
  fi
fi

echo
echo "=== 3. SECRET-SHAPED FILES TRACKED ==="
BAD=$(git ls-files | grep -Ei '(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx|keystore)$|id_rsa|id_ed25519|credentials\.json$|service-account.*\.json$)' | grep -v '\.env\.example$' || true)
[ -z "$BAD" ] && echo "  ${GRN}CLEAN${OFF}" || echo "$BAD" | sed "s/^/  ${RED}TRACKED${OFF}: /"

echo
echo "=== 4. PERSONAL INFORMATION (emails, phones) ==="
EM=$(git ls-files '*.ts' '*.tsx' '*.md' '*.json' '*.sql' | xargs grep -oEI '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' 2>/dev/null | grep -vE '@(example|vercel|anthropic|openai|github|npmjs|tailwindcss|nextjs|react|types|nodejs)\.' | sort -u || true)
[ -z "$EM" ] && echo "  ${GRN}CLEAN${OFF} — no personal addresses" || echo "  ${YEL}REVIEW${OFF}: $(echo "$EM" | wc -l) distinct non-vendor address(es) — values withheld"

echo
echo "=== 5. RAPH / VESPER SOURCE INCLUSIONS ==="
RJ=$(git ls-files | grep -Ei 'raphael-2\.0|vesper|_bundle_work|raphael-snapshots' || true)
[ -z "$RJ" ] && echo "  ${GRN}CLEAN${OFF} — no third-party project sources vendored" || echo "$RJ" | sed "s/^/  ${RED}INCLUDED${OFF}: /"

echo
echo "=== 6. INTERNAL HOST DETAILS ==="
HOSTS=$(git ls-files '*.ts' '*.tsx' '*.md' '*.json' | xargs grep -oIE '\b(10\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.[0-9]{1,3}\.[0-9]{1,3}|192\.168\.[0-9]{1,3}\.[0-9]{1,3})\b' 2>/dev/null | sort -u || true)
[ -z "$HOSTS" ] && echo "  ${GRN}CLEAN${OFF} — no RFC1918 addresses in tracked content" || echo "  ${YEL}REVIEW${OFF}: $(echo "$HOSTS" | wc -l) private-range address(es) — values withheld"

echo
echo "=== 7. ENGAGEMENT / CLIENT IDENTIFIERS ==="
# Word boundaries are required: without \b, "sow" matches "hasOwnProperty" and
# "disown", which produced false positives in an earlier run of this script.
# "engagement" is also legitimate product vocabulary here (authorised boundary
# for an engagement), so only CLIENT-IDENTIFYING terms are treated as findings.
ENG=$(git ls-files | xargs grep -liE '\b(engagement[-_ ]?(id|ident|ref)|statement of work|\bSOW\b|client[-_ ]?(name|id)|contract[-_ ]?id)\b' 2>/dev/null || true)
[ -z "$ENG" ] && echo "  ${GRN}CLEAN${OFF} — no client/engagement-identifying metadata" || echo "$ENG" | sed "s/^/  ${RED}REVIEW${OFF}: /"
echo "  ${DIM}(the word 'engagement' alone is product vocabulary and is not a finding)${OFF}"

echo
echo "=== 8. LARGE / ARCHIVE FILES TRACKED ==="
git ls-files | while read -r f; do
  [ -f "$f" ] || continue
  sz=$(stat -c%s "$f" 2>/dev/null || echo 0)
  [ "$sz" -gt 2000000 ] && echo "  ${YEL}LARGE${OFF}: $f ($((sz/1024/1024))MB)"
done
echo "  (none listed = none over 2MB)"