#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

echo "=== top level (excluding node_modules, .next) ==="
ls -A | grep -v node_modules | grep -v '^\.next$'

echo
echo "=== source tree ==="
find src tests db scripts -type f 2>/dev/null | sort

echo
echo "=== anything importing OUTSIDE the project root? ==="
grep -rnE 'from "(\.\./){3,}' src tests 2>/dev/null | head -10
grep -rn '/home/yaser' src tests db *.ts *.json 2>/dev/null | head -10
grep -rn 'wsl.localhost' src tests *.ts *.json 2>/dev/null | head -10
echo "(no lines above = no escaping paths)"