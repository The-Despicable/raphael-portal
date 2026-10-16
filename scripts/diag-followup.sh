#!/usr/bin/env bash
# The exact payload the smoke test sends, isolated.
set -uo pipefail
curl -s -m 120 -X POST "http://127.0.0.1:4123/api/assistant" \
  -H 'Content-Type: application/json' \
  -d '{"question":"tell me in more detail","history":[{"role":"user","text":"Why is the project NOT_READY?"},{"role":"assistant","text":"Readiness is NOT_READY because the gate is BLOCKED at G3."}]}' \
| python3 -c "
import json,sys
raw=sys.stdin.read()
try: d=json.loads(raw)
except Exception: print('NON-JSON:', raw[:200]); raise SystemExit
print('mode    :', d.get('mode'))
print('sources :', len(d.get('citations') or []))
print('answer  :', (d.get('text') or '')[:260])
print('notice  :', (d.get('notice') or '')[:140])
"