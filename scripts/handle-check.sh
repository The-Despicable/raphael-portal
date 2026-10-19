#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== every occurrence in src/ ==="
grep -rn 'The-Despicable' src/ || echo "  none"

echo
echo "=== occurrences NOT inside a github URL (these are the problem) ==="
BARE=$(grep -rn 'The-Despicable' src/ | grep -vE 'https://github\.com/The-Despicable' || true)
if [ -z "$BARE" ]; then echo "  none"; else echo "$BARE"; fi

echo
echo "=== occurrences in public/ db/ ==="
grep -rn 'The-Despicable' public/ db/ 2>/dev/null || echo "  none"