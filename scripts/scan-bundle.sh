#!/usr/bin/env bash
# Independent scan of BUILT artefacts. Does not rely on the security gate.
cd /home/yaser/raphael-portal || exit 1
RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; OFF=$'\033[0m'

echo "=== built artefact inventory ==="
echo "  client chunks (.next/static/**/*.js): $(find .next/static -name '*.js' 2>/dev/null | wc -l)"
echo "  source maps  (.next/**/*.map)       : $(find .next -name '*.map' 2>/dev/null | wc -l)"
echo "  static files (public/)             : $(find public -type f 2>/dev/null | wc -l)"

# Needle from the live local env, compared but NEVER printed.
LIVE=$(grep -E '^MODEL_API_KEY=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' \r')
SESSION=$(grep -E '^GUEST_SESSION_SECRET=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' \r')
MOD=$(grep -E '^MODERATION_KEY=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' \r')

check_needle () {
  local label="$1" needle="$2"
  [ -z "$needle" ] && { echo "  ${YEL}SKIP${OFF} $label (not set locally)"; return; }
  local hits
  hits=$(grep -rlF "$needle" .next public 2>/dev/null | head -5)
  if [ -z "$hits" ]; then echo "  ${GRN}ABSENT${OFF} $label"; else
    echo "  ${RED}PRESENT${OFF} $label in:"; echo "$hits" | sed 's/^/        /'
  fi
}

echo
echo "=== live secret values must be ABSENT from build output ==="
check_needle "MODEL_API_KEY value"        "$LIVE"
check_needle "GUEST_SESSION_SECRET value" "$SESSION"
check_needle "MODERATION_KEY value"       "$MOD"

echo
echo "=== provider / credential markers in client bundles ==="
PAT='(nvapi-|Authorization["'"'"']?\s*[:=]|Bearer |sk-[A-Za-z0-9]{20,}|postgres(ql)?://|chat_template_kwargs|reasoning_content|__raw)'
H=$(grep -rlEI "$PAT" .next/static public 2>/dev/null | head -10)
[ -z "$H" ] && echo "  ${GRN}CLEAN${OFF} — no provider/credential markers in client output" || {
  echo "$H" | sed "s/^/  ${RED}HIT${OFF}: /"
}

echo
echo "=== NEXT_PUBLIC_* in client bundle (values are public by design; names listed) ==="
grep -rhoE 'NEXT_PUBLIC_[A-Z0-9_]+' .next/static 2>/dev/null | sort -u | sed 's/^/  /' || echo "  none"
echo "  ${DIM}(expected: at most NEXT_PUBLIC_SITE_URL; any *_KEY/SECRET/TOKEN here is a finding)${OFF}"

echo
echo "=== source maps: do they embed server files or env? ==="
if [ "$(find .next -name '*.map' 2>/dev/null | wc -l)" -eq 0 ]; then
  echo "  ${GRN}NONE EMITTED${OFF} — no source maps published"
else
  SM=$(find .next -name '*.map' | head -40)
  SMH=$(echo "$SM" | xargs grep -lEI "$PAT" 2>/dev/null | head -5)
  [ -z "$SMH" ] && echo "  ${GRN}CLEAN${OFF} — no secrets in sampled maps" || {
    echo "$SMH" | sed "s/^/  ${RED}HIT${OFF}: /"
  }
fi