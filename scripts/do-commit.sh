#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal || exit 1

git add -A

git -c user.name="Raphael Portal" -c user.email="noreply@anthropic.com" commit -q -F - <<'MSG'
Initial release: Raphael research portal

Research portal for the Raphael project, with a grounded AI assistant over a
fixed corpus of project documents.

- Next.js 16 app: home, raphael, research, status, community
- Guest chat, reviews, moderation, paper suggestions, health probe
- Assistant grounded in a fixed corpus; out-of-scope answers are labelled and
  carry no citations
- Security gate, unit tests, smoke tests
MSG

echo "commit: $(git log --oneline -1)"
echo "files : $(git ls-files | wc -l)"