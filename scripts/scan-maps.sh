#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; OFF=$'\033[0m'

echo "=== where are the maps? (only .next/static is served to clients) ==="
find .next -name '*.map' 2>/dev/null | sed 's#/[^/]*$##' | sort | uniq -c | sort -rn | head -10 | sed 's/^/  /'

echo
echo "=== maps under .next/static (PUBLIC) ==="
PUB=$(find .next/static -name '*.map' 2>/dev/null | wc -l)
echo "  count: $PUB"
if [ "$PUB" -gt 0 ]; then
  echo "  ${YEL}these are reachable at /.next/static/**.map on the deployed site${OFF}"
else
  echo "  ${GRN}none — no client source maps published${OFF}"
fi

echo
echo "=== do client maps contain SERVER-only source? ==="
if [ "$PUB" -gt 0 ]; then
  for probe in "process.env" "modelApiKey" "MODEL_API_KEY" "rate-limit" "lib/env" "api/assistant"; do
    N=$(find .next/static -name '*.map' -exec grep -lF "$probe" {} + 2>/dev/null | wc -l)
    printf '  %-16s in %s client map(s)\n' "$probe" "$N"
  done
  echo
  echo "=== do they contain 'sourcesContent' (inline original source)? ==="
  INLINE=$(find .next/static -name '*.map' -exec grep -lF '"sourcesContent"' {} + 2>/dev/null | wc -l)
  echo "  maps embedding original source text: $INLINE"
else
  echo "  n/a"
fi