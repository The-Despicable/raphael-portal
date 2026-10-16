#!/usr/bin/env bash
# Verify the three fixes the user hit: short input, greetings, and clarity
# about whether the model was actually called.
set -uo pipefail
BASE="http://127.0.0.1:4123"

ask () {
  curl -s -m 90 -X POST "$BASE/api/assistant" -H 'Content-Type: application/json' \
    -d "{\"question\":$1}" \
  | python3 -c "
import json,sys
d=json.load(sys.stdin)
if 'fields' in d:
    print('  -> 422 REJECTED')
    print('     generic:', d.get('error'))
    print('     specific:', list(d.get('fields',{}).values())[0])
else:
    print('  ->', d.get('mode'), '| citations', len(d.get('citations') or []))
    print('    ', (d.get('text') or '').replace(chr(10),' ')[:150])
    if d.get('notice'): print('     notice:', d['notice'][:110])
"
}

echo "1) 'hi'  (2 chars - was a confusing 'check the highlighted fields')"
ask '"hi"'

echo "2) 'hello'  (was a bare refusal that looked like 'not connected')"
ask '"hello"'

echo "3) 'Thanks!'  (opener with punctuation)"
ask '"Thanks!"'

echo "4) opener + real question  (must NOT bypass the gate)"
ask '"hi, what is the capital of France?"'

echo "5) real question  (must reach the model)"
ask '"What does AUTH-000 block?"'