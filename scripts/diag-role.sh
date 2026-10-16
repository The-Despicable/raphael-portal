#!/usr/bin/env bash
# Does any source record give these two a real role, or only an aspirational one?
echo "=== files mentioning Dream-RSI / 2609.14858 / awesome-rsi ==="
grep -rlI --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next \
  -i "dream-rsi\|2609\.14858\|awesome-rsi" \
  /home/yaser/raphael-viability-assessment-20261016 \
  /home/yaser/raphael-notes \
  /home/yaser/raphael-snapshots \
  /home/yaser/raphael-2.0-rbsv2r \
  2>/dev/null | head -20

echo
echo "=== assessment dir contents ==="
ls /home/yaser/raphael-viability-assessment-20261016 2>/dev/null | head -20