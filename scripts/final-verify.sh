#!/usr/bin/env bash
set -uo pipefail
cd /home/yaser/raphael-portal

echo "############ TYPECHECK ############"
npm run typecheck 2>&1 | tail -3
echo "typecheck exit=$?"

echo
echo "############ LINT ############"
npm run lint 2>&1 | tail -5
echo "lint exit=$?"

echo
echo "############ TESTS ############"
npx vitest run 2>&1 | grep -E "Test Files|Tests |FAIL"

echo
echo "############ BUILD ############"
npm run build 2>&1 | grep -E "Compiled|Finished TypeScript|error|Route|^[├└┌]" | head -20

echo
echo "############ SMOKE (real HTTP) ############"
bash scripts/smoke.sh 2>&1 | tail -4

echo
echo "############ SECURITY GATE ############"
bash scripts/security-gate.sh 2>&1 | grep -E "\[FAIL\]|\[BLOCKED\]|Confirmed:|FINAL RULE" 