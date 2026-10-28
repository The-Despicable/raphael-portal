#!/usr/bin/env bash
set -euo pipefail
cd /home/yaser/raphael-portal
git add -A
git -c user.name="The-Despicable" -c user.email="raphael-portal@users.noreply.github.com" \
  commit -m "feat(portal): add Raphael freeze-status page (Stitch design + frozen state data)"
git push origin main
git rev-parse HEAD
echo "pushed"