#!/usr/bin/env bash
# Inspect raw provider output for a question, to diagnose citation parsing.
set -uo pipefail
Q="${1:-What does AUTH-000 block?}"
curl -s -m 120 -X POST "http://127.0.0.1:4123/api/assistant" \
  -H 'Content-Type: application/json' \
  -d "$(python3 -c "import json,sys;print(json.dumps({'question':sys.argv[1]}))" "$Q")" \
| python3 -c "
import json,sys
d=json.load(sys.stdin)
print('MODE :', d.get('mode'))
print('CITES:', len(d.get('citations') or []), [c.get('docId') for c in (d.get('citations') or [])])
print('TEXT :', repr(d.get('text'))[:400])
print('RAW  :', repr(d.get('__raw'))[:900])
"