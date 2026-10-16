#!/usr/bin/env bash
# Verify the new design end-to-end: full corpus + conversation memory +
# validated citations. Never prints the API key.
set -uo pipefail
BASE="http://127.0.0.1:4123"

ask () {
  curl -s -m 120 -X POST "$BASE/api/assistant" -H 'Content-Type: application/json' -d "$1" \
  | python3 -c "
import json,sys
raw = sys.stdin.read()
try:
    d = json.loads(raw)
except Exception:
    print('   NON-JSON RESPONSE:', raw[:150]); raise SystemExit
if 'error' in d and 'mode' not in d:
    print('   ERROR:', d.get('error')); raise SystemExit
print('   mode    :', d.get('mode'))
print('   sources :', len(d.get('citations') or []))
print('   answer  :', (d.get('text') or '').replace(chr(10),' ')[:200])
if d.get('notice'): print('   notice  :', d['notice'][:120])
print()
"
  sleep 8
}

echo "A) project question  (must be GENERATIVE + real citations)"
ask '{"question":"Why is the project NOT_READY?"}'

echo "B) THE FOLLOW-UP THAT BROKE BEFORE  (retrieved nothing lexically)"
ask '{"question":"Why is the project NOT_READY?","history":[{"role":"user","text":"Why is the project NOT_READY?"},{"role":"assistant","text":"Overall readiness is NOT_READY with gate disposition BLOCKED at G3."}]}'

echo "C) general knowledge  (must answer, but NOT be presented as sourced)"
ask '{"question":"Explain how a TLS handshake works in simple terms."}'

echo "D) cross-document reasoning (hard for top-k retrieval)"
ask '{"question":"Which blocker is upstream of all the others, and why?"}'

echo "E) opener still handled"
ask '{"question":"hello"}'