#!/usr/bin/env bash
# Probe which Nemotron model IDs the configured NIM endpoint actually accepts.
# NEVER prints the API key. Only prints HTTP status + a short body excerpt.
set -uo pipefail
cd /home/yaser/raphael-portal

set -a
# shellcheck disable=SC1091
source .env.local
set +a

BASE="${MODEL_BASE_URL%/}"

echo "base url : $BASE"
echo "key      : present (${#MODEL_API_KEY} chars, value not printed)"
echo

CANDIDATES=(
  "nvidia/llama-3.3-nemotron-super-120b-v1"
  "nvidia/nemotron-super-120b-v1"
  "nvidia/llama-3.3-nemotron-super-49b-v1.5"
  "nvidia/nemotron-4-340b-instruct"
  "nvidia/llama-3.1-nemotron-ultra-253b-v1"
  "meta/llama-3.3-70b-instruct"
)

for m in "${CANDIDATES[@]}"; do
  body=$(curl -s -m 45 -o /tmp/nim-body.json -w '%{http_code}' \
    -X POST "$BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MODEL_API_KEY" \
    -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"Say OK\"}],\"max_tokens\":8,\"temperature\":0}")
  if [ "$body" = "200" ]; then
    reply=$(python3 -c "import json,sys;d=json.load(open('/tmp/nim-body.json'));print(d['choices'][0]['message']['content'][:40].replace(chr(10),' '))" 2>/dev/null || echo "?")
    printf '  %-3s %-48s OK  (%s)\n' "$body" "$m" "$reply"
  else
    err=$(python3 -c "import json;d=json.load(open('/tmp/nim-body.json'));print(str(d.get('detail') or d.get('error') or d)[:90])" 2>/dev/null || head -c 90 /tmp/nim-body.json)
    printf '  %-3s %-48s %s\n' "$body" "$m" "$err"
  fi
done