#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== is vercel.json in the PUSHED commit? ==="
if git show origin/main:vercel.json > /tmp/committed-vercel.json 2>/dev/null; then
  echo "  YES - present in origin/main"
else
  echo "  NO - vercel.json is NOT in origin/main"
  exit 0
fi

echo
echo "=== placeholder bug still present in the COMMITTED file? ==="
if grep -q '@next_public_site_url' /tmp/committed-vercel.json; then
  echo "  YES - BUG STILL THERE"
else
  echo "  NO - placeholder absent, build will not crash on new URL()"
fi

echo
echo "=== header keys in the COMMITTED file ==="
grep -oE '"key": "[A-Za-z-]+"' /tmp/committed-vercel.json | sed 's/"key": //' | tr -d '"'

echo
echo "=== does it parse? ==="
node -e '
const raw = require("fs").readFileSync("/tmp/committed-vercel.json","utf8");
const stripped = raw.replace(/^\s*\/\/.*$/gm,"").replace(/\/\*[\s\S]*?\*\//g,"").replace(/,(\s*[}\]])/g,"$1");
try { const o = JSON.parse(stripped); console.log("  valid JSON, headers:", o.headers.length); }
catch(e){ console.log("  INVALID:", e.message); }'