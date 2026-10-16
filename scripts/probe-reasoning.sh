#!/usr/bin/env bash
# Determine how to get a real `content` string out of this reasoning model.
# Never prints the API key.
set -uo pipefail
cd /home/yaser/raphael-portal
set -a
# shellcheck disable=SC1091
source .env.local
set +a
BASE="${MODEL_BASE_URL%/}"
M="nvidia/nemotron-3-super-120b-a12b"

probe () {
  local label="$1"; shift
  local extra="$1"; shift
  local maxtok="$1"; shift
  curl -s -m 90 -X POST "$BASE/chat/completions" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $MODEL_API_KEY" \
    -d "{\"model\":\"$M\",\"messages\":[{\"role\":\"user\",\"content\":\"What is the capital of France? Answer in three words.\"}],\"max_tokens\":$maxtok,\"temperature\":0$extra}" \
    -o /tmp/nim-p.json
  python3 - "$label" <<'PY'
import json, sys
label = sys.argv[1]
try:
    d = json.load(open("/tmp/nim-p.json"))
except Exception as e:
    print(f"  {label:<34} parse error: {e}"); raise SystemExit
if "choices" not in d:
    print(f"  {label:<34} ERROR: {str(d)[:110]}"); raise SystemExit
m = d["choices"][0]["message"]
c, r = m.get("content"), m.get("reasoning_content")
u = d.get("usage", {})
print(f"  {label:<34} content={type(c).__name__}/{(len(c) if isinstance(c,str) else 0):<4} "
      f"reasoning={len(r) if isinstance(r,str) else 0:<5} "
      f"reason_tok={u.get('completion_tokens_details',{}).get('reasoning_tokens')}")
if isinstance(c, str) and c.strip():
    print(f"      content -> {c.strip()[:90]!r}")
PY
}

echo "=== how to get real content ==="
probe "max_tokens=16 (current)"        ""                                              16
probe "max_tokens=1024"                 ""                                              1024
probe "max_tokens=1024 + no-think"      ',"chat_template_kwargs":{"enable_thinking":false}' 1024
probe "max_tokens=512 + no-think"       ',"chat_template_kwargs":{"enable_thinking":false}' 512
probe "max_tokens=2048 + no-think"      ',"chat_template_kwargs":{"enable_thinking":false}' 2048