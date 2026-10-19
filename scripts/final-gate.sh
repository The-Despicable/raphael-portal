#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
bash scripts/check-report-scan.sh
echo
echo "=== SECURITY GATE (full, after report added) ==="
bash scripts/security-gate.sh >/tmp/g.log 2>&1
echo "gate exit=$?"
echo "PASS lines : $(grep -cE '\[PASS\]' /tmp/g.log)"
echo "FAIL lines : $(grep -cE '\[FAIL\]' /tmp/g.log)"
echo "BLOCKED    : $(grep -cE '\[BLOCKED\]' /tmp/g.log)"
grep -E '\[FAIL\]|\[BLOCKED\]' /tmp/g.log | head
echo
echo "=== NOT CHECKED ==="
grep -E '\[NOT-CHECKED\]' /tmp/g.log | sed 's/^/  /'