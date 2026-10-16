#!/usr/bin/env bash
# Measure citation compliance for a clearly-grounded question, repeated.
set -uo pipefail
BASE="http://127.0.0.1:4123"
for i in 1 2 3 4; do
  curl -s -m 120 -X POST "$BASE/api/assistant" -H 'Content-Type: application/json' \
    -d '{"question":"What does AUTH-000 block?"}' \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(' run: mode=%-24s citations=%-3s text=%s' % (d.get('mode'), len(d.get('citations') or []), (d.get('text') or '')[:70].replace(chr(10),' ')))
"
  sleep 10
done