#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== TYPECHECK ==="
npm run typecheck >/tmp/tc.log 2>&1; echo "exit=$?"
tail -3 /tmp/tc.log

echo
echo "=== LINT ==="
npm run lint >/tmp/lint.log 2>&1; echo "exit=$?"
grep -E 'problem|error|warning' /tmp/lint.log | tail -4 || echo "  clean"

echo
echo "=== UNIT TESTS ==="
npx vitest run >/tmp/test.log 2>&1; echo "exit=$?"
grep -E 'Test Files|Tests ' /tmp/test.log

echo
echo "=== PRODUCTION BUILD ==="
npm run build >/tmp/build.log 2>&1; echo "exit=$?"
grep -E 'Compiled successfully|Failed to compile|error TS' /tmp/build.log | head -3