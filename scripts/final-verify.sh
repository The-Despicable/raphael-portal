#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal || exit 1
bash scripts/stop.sh >/dev/null 2>&1
sleep 3

echo "=== TYPECHECK ==="
npm run typecheck >/tmp/tc.log 2>&1; echo "typecheck exit=$?"

echo "=== LINT ==="
npm run lint >/tmp/lint.log 2>&1; echo "lint exit=$?"
grep -E 'problem|error|warning' /tmp/lint.log | tail -5 || echo "  clean"

echo "=== TESTS ==="
npx vitest run >/tmp/test.log 2>&1; echo "test exit=$?"
grep -E 'Test Files|Tests ' /tmp/test.log

echo "=== BUILD ==="
npm run build >/tmp/build.log 2>&1; echo "build exit=$?"
grep -E 'Compiled successfully|Failed to compile|error TS' /tmp/build.log | head -3

echo "=== SMOKE ==="
bash scripts/smoke.sh >/tmp/smoke.log 2>&1; echo "smoke exit=$?"
grep -E 'passed:|failed:' /tmp/smoke.log | tail -2
grep -E 'FAIL' /tmp/smoke.log | head -10

echo "=== SECURITY GATE ==="
bash scripts/security-gate.sh >/tmp/gate.log 2>&1; echo "gate exit=$?"
grep -E '\[FAIL\]|\[BLOCKED\]' /tmp/gate.log | head -10 || echo "  no FAIL/BLOCKED lines"
grep -cE '\[PASS\]' /tmp/gate.log

echo "=== AUDIT SCRIPTS ==="
bash scripts/audit-repo.sh 2>&1 | grep -E 'CLEAN|FAIL|HIT|REVIEW' | head -20