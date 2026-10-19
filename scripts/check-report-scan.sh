#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
PAT='(nvapi-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{20,}|postgres(ql)?://[^[:space:]]{4,}:[^[:space:]]{4,}@|-----BEGIN [A-Z ]*PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,})'
echo "=== does SECURITY_REVIEW.md itself trip the secret scanner? ==="
H=$(grep -nEIo "$PAT" SECURITY_REVIEW.md 2>/dev/null | head -5)
if [ -z "$H" ]; then echo "  CLEAN"; else
  echo "  TRIPS SCANNER (line numbers only):"
  echo "$H" | cut -d: -f1 | sed 's/^/    line /'
fi