#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== build scripts ==="
node -e 'const p=require("./package.json");console.log(JSON.stringify(p.scripts,null,2))'

echo
echo "=== next.config.ts (full) ==="
cat next.config.ts

echo
echo "=== Vercel-specific APIs in source? ==="
grep -rn "from ['\"]@vercel\|next/og\|@vercel/functions" src/ | head -5 || echo "  none"

echo
echo "=== does the app need a Node server runtime? ==="
echo "  dynamic route handlers:"
grep -rl "export async function POST\|export async function GET" src/app/api | wc -l