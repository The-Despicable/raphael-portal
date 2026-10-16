#!/usr/bin/env bash
cd /home/yaser/raphael-portal
echo "--- framing statements that depend on these papers ---"
grep -rn "exactly one external" src/ | head -10
echo
grep -rn "one external publication" src/ | head -10
echo
echo "--- total papers in the library ---"
grep -c "status:" src/content/research.ts
echo
echo "--- release-gate tests touching them ---"
sed -n '60,85p' tests/release-gate.test.ts