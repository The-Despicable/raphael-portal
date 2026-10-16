#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal || exit 1
git add -A
git -c user.name="Raphael Portal" -c user.email="noreply@anthropic.com" commit -q -F - <<'MSG'
Fix vercel.json config version

Vercel's schema constrains `version` to exactly 2 (minimum 2, maximum 2).
Version 3 fails the build with 400 config-json-parse-error.

Validated against https://openapi.vercel.sh/vercel.json
MSG
git push -q origin main
echo "pushed: $(git rev-parse --short HEAD)"
echo "origin: $(git rev-parse --short origin/main)"