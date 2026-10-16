#!/usr/bin/env bash
# Prove the assistant limit is actually lifted: 16 rapid questions in a row,
# no 429s. Well above the old 12/min ceiling.
set -uo pipefail
BASE="http://127.0.0.1:4123"
ok=0; limited=0
for i in $(seq 1 16); do
  code=$(curl -s -o /tmp/rl.json -w '%{http_code}' -m 120 -X POST "$BASE/api/assistant" \
    -H 'Content-Type: application/json' -d '{"question":"What does AUTH-000 block?"}')
  if [ "$code" = "200" ]; then ok=$((ok+1)); else limited=$((limited+1)); echo "  call $i -> HTTP $code"; fi
done
echo "  200 OK      : $ok"
echo "  rate-limited: $limited"
if [ "$limited" -eq 0 ]; then echo "  PASS: limit lifted (16 > old ceiling of 12)"; else echo "  FAIL: still limited"; fi
rm -f /tmp/rl.json