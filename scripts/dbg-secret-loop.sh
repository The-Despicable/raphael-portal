#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
for S in MODEL_API_KEY GUEST_SESSION_SECRET MODERATION_KEY DATABASE_URL; do
  echo "--- $S ---"
  grep -rlE "\b${S}\b" src/ 2>/dev/null | sed 's/^/   /'
  echo "   (count: $(grep -rlE "\b${S}\b" src/ 2>/dev/null | wc -l))"
done
echo
echo "=== is the word also appearing via camelCase property access? ==="
grep -rn 'guestSessionSecret' src/ | sed 's/^/   /'