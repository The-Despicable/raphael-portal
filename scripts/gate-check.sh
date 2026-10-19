#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
bash scripts/security-gate.sh >/tmp/g2.log 2>&1
echo "gate exit=$?"
echo "PASS=$(grep -c '\[PASS\]' /tmp/g2.log)  FAIL=$(grep -c '\[FAIL\]' /tmp/g2.log)  BLOCKED=$(grep -c '\[BLOCKED\]' /tmp/g2.log)"
echo
echo "--- handle-related lines ---"
grep -iE 'handle|\[FAIL\]' /tmp/g2.log | sed 's/^/  /'