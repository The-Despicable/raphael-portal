#!/usr/bin/env bash
# Inspect the exact response shape (app parses choices[0].message.content)
# and measure warm latency. Never prints the API key.
set -uo pipefail
cd /home/yaser/raphael-portal
set -a
# shellcheck disable=SC1091
source .env.local
set +a
BASE="${MODEL_BASE_URL%/}"

M="nvidia/nemotron-3-super-120b-a12b"

echo "=== response shape ==="
curl -s -m 90 -X POST "$BASE/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MODEL_API_KEY" \
  -d "{\"model\":\"$M\",\"messages\":[{\"role\":\"user\",\"content\":\"Reply with the single word: ready\"}],\"max_tokens\":16,\"temperature\":0}" \
  -o /tmp/nim-shape.json

python3 - <<'PY'
import json
d = json.load(open("/tmp/nim-shape.json"))
print("top-level keys:", sorted(d.keys()))
ch = d.get("choices")
if isinstance(ch, list) and ch:
    msg = ch[0].get("message", {})
    print("choice keys    :", sorted(ch[0].keys()))
    print("message keys   :", sorted(msg.keys()))
    c = msg.get("content")
    print("content type   :", type(c).__name__)
    print("content        :", repr(c)[:120])
    print("content is str :", isinstance(c, str))
    print("usage          :", d.get("usage"))
else:
    print("UNEXPECTED shape:", str(d)[:300])
PY

echo
echo "=== warm latency, 3 calls ==="
for i in 1 2 3; do
  s=$(date +%s%N)
  curl -s -m 90 -o /dev/null -X POST "$BASE/chat/completions" \
    -H "Content-Type: application/json" -H "Authorization: Bearer $MODEL_API_KEY" \
    -d "{\"model\":\"$M\",\"messages\":[{\"role\":\"user\",\"content\":\"Say OK\"}],\"max_tokens\":8,\"temperature\":0}"
  e=$(date +%s%N)
  echo "  call $i: $(( (e - s) / 1000000 ))ms"
done