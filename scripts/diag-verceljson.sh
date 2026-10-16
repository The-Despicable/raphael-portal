#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== 1. does next.config.ts already set headers? (would conflict with vercel.json) ==="
grep -n "headers" -A 12 next.config.ts 2>/dev/null || echo "  no headers() in next.config.ts"

echo
echo "=== 2. does the cron path in vercel.json exist? ==="
ls src/app/api/_maintenance 2>/dev/null || echo "  /api/_maintenance/sweep DOES NOT EXIST (cron would 404 if enabled)"

echo
echo "=== 3. is NEXT_PUBLIC_SITE_URL actually used in code? ==="
grep -rn "NEXT_PUBLIC_SITE_URL" src/ | head -5 || echo "  NOT referenced anywhere in src/ — build-time value is pointless"

echo
echo "=== 4. is a site URL read from env at all? ==="
grep -rn "SITE_URL\|siteUrl" src/lib/env.ts src/config/site.ts | head -8