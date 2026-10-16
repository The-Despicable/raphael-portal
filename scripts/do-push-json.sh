#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal || exit 1

git add -A
git -c user.name="Raphael Portal" -c user.email="noreply@anthropic.com" commit -q -F - <<'MSG'
Make vercel.json strict JSON (no comments)

Vercel's config parser rejects // comments with 400 config-json-parse-error.
The file previously carried extensive inline documentation, which validated
only after a comment-stripping step that Vercel does not perform.

Documentation moved to VERCEL_NOTES.md.

Validate future changes with:
  node scripts/strict-parse.cjs
  node scripts/validate-vercel-json.cjs
MSG

git push -q origin main
echo "pushed: $(git rev-parse --short HEAD)  origin: $(git rev-parse --short origin/main)"