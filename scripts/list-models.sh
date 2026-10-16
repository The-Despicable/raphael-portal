#!/usr/bin/env bash
# List models the configured NIM endpoint exposes to this key.
# Never prints the API key.
set -uo pipefail
cd /home/yaser/raphael-portal
set -a
# shellcheck disable=SC1091
source .env.local
set +a
BASE="${MODEL_BASE_URL%/}"

echo "=== GET $BASE/models ==="
code=$(curl -s -m 60 -o /tmp/nim-models.json -w '%{http_code}' \
  -H "Authorization: Bearer $MODEL_API_KEY" \
  "$BASE/models")
echo "http $code"
echo

python3 - <<'PY'
import json
try:
    d = json.load(open("/tmp/nim-models.json"))
except Exception as e:
    print("could not parse:", e)
    raise SystemExit

items = d.get("data") or d.get("models") or []
if not items:
    print("no model list returned. Body keys:", list(d)[:10])
    print(str(d)[:400])
    raise SystemExit

names = []
for it in items:
    if isinstance(it, str):
        names.append(it)
    elif isinstance(it, dict):
        names.append(it.get("id") or it.get("name") or it.get("model") or str(it)[:60])

nem = sorted(n for n in names if "nemotron" in n.lower())
print(f"total models exposed: {len(names)}")
print(f"nemotron matches   : {len(nem)}")
print()
for n in nem:
    print("  ", n)
print()
others = sorted(n for n in names if "nemotron" not in n.lower())
print("non-nemotron (first 30):")
for n in others[:30]:
    print("  ", n)
PY