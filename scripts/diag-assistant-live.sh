#!/usr/bin/env bash
# What mode is the RUNNING server actually returning, and is the provider
# reachable from it? Never prints the API key.
set -uo pipefail
BASE="http://127.0.0.1:4123"

echo "=== capability probe ==="
curl -s "$BASE/api/assistant" | python3 -c "import json,sys;d=json.load(sys.stdin);print(' generativeAi:',d['capabilities']['generativeAi'])"

echo
echo "=== live question (what the browser gets) ==="
curl -s -m 90 -X POST "$BASE/api/assistant" -H 'Content-Type: application/json' \
  -d '{"question":"What does AUTH-000 block?"}' \
| python3 -c "
import json,sys
d=json.load(sys.stdin)
print(' mode     :', d.get('mode'))
print(' notice   :', (d.get('notice') or '(none)')[:120])
print(' citations:', len(d.get('citations') or []))
print(' text     :', (d.get('text') or '')[:220].replace(chr(10),' '))
"

echo
echo "=== server log: provider errors? ==="
grep -iE 'provider|error|fail|429|401|403|timeout|fetch' /tmp/rph-visual.log 2>/dev/null | tail -20 || echo " (no matching log lines)"
echo
echo "=== last 12 log lines ==="
tail -12 /tmp/rph-visual.log 2>/dev/null