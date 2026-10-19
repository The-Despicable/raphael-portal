#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
PAT='(external-audits|raphael-2|raphael-2\.0|10\.66\.|raphael-snapshots|STAPLER|ica_live|private[[:space:]]+target)'
echo "=== files matching the private-identifier pattern ==="
grep -rEIl "$PAT" src/ public/ db/ 2>/dev/null || echo "  none"

echo
echo "=== which line matches ==="
grep -rnE "$PAT" src/ public/ db/ 2>/dev/null | head -10