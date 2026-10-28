#!/usr/bin/env bash
set -e
cd /home/yaser/raphael-portal
git add -A
git -c user.name="The-Despicable" -c user.email="raphael-portal@users.noreply.github.com" \
  commit -m "chore: remove temp scripts accidentally committed"
git push origin main
git rev-parse HEAD
git status --porcelain | wc -l
