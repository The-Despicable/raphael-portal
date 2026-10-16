#!/usr/bin/env bash
# Verify the two requested Nemotron models and report latency.
# Never prints the API key.
set -uo pipefail
cd /home/yaser/raphael-portal
set -a
# shellcheck disable=SC1091
source .env.local
set +a
BASE="${MODEL_BASE_URL%/}"

for m in "nvidia/nemotron-3.5-lightning-30b-a3b" "nvidia/nemotron-3-super-120b-a12b"; do
  start=$(date +%s%N)
  code=$(curl -s -m 90 -o /tmp/nim-t.json -w '%{http_code}' \
    -X POST "$BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MODEL_API_KEY" \
    -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with the single word: ready\"}],\"max_tokens\":16,\"temperature\":0}")
  end=$(date +%s%N)
  ms=$(( (end - start) / 1000000 ))
  if [ "$code" = "200" ]; then
    txt=$(python3 -c "import json;d=json.load(open('/tmp/nim-t.json'));print(d['choices'][0]['message']['content'][:50].replace(chr(10),' '))" 2>/dev/null || echo "?")
    printf '  %-3s %-40s %6sms  -> %s\n' "$code" "$m" "$ms" "$txt"
  else
    err=$(python3 -c "import json;d=json.load(open('/tmp/nim-t.json'));print(str(d.get('detail') or d.get('error') or d)[:100])" 2>/dev/null || head -c 100 /tmp/nim-t.json)
    printf '  %-3s %-40s %6sms  -> %s\n' "$code" "$m" "$ms" "$err"
  fi
done