#!/usr/bin/env bash
set -euo pipefail
cd /home/yaser/raphael-portal

echo "=== removing 'export const runtime' (incompatible with cacheComponents) ==="
files=$(grep -rl 'export const runtime' src/ || true)
if [ -z "$files" ]; then
  echo "none found"
else
  for f in $files; do
    sed -i '/^export const runtime = "nodejs";$/d' "$f"
    echo "cleaned $f"
  done
fi

echo
echo "=== verify ==="
if grep -rn 'export const runtime' src/; then
  echo "STILL PRESENT"
  exit 1
else
  echo "clean"
fi