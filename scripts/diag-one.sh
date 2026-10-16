#!/usr/bin/env bash
# Ask one question and report the raw HTTP status plus a parsed body.
set -uo pipefail
Q="${1:-What is the role of Dream-RSI in Raphael?}"
PAYLOAD=$(python3 -c "import json,sys;print(json.dumps({'question':sys.argv[1]}))" "$Q")
code=$(curl -s -o /tmp/ask.json -w '%{http_code}' -m 120 \
  -X POST "http://127.0.0.1:4123/api/assistant" \
  -H 'Content-Type: application/json' -d "$PAYLOAD")
echo "HTTP $code"
head -c 1200 /tmp/ask.json
echo