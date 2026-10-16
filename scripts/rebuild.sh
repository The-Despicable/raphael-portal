#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal
echo "=== build ==="
npm run build 2>&1 | grep -E "Compiled|error|Failed|Finished TypeScript" | head -6
echo "=== serve ==="
bash scripts/serve.sh
echo "=== min-width on blocker table (should be md:min-w only) ==="
curl -s "http://127.0.0.1:4123/status" | grep -o 'table-stack[^"]*' | head -2