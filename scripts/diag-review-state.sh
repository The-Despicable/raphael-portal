#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
echo "HEAD        : $(git rev-parse --short HEAD)"
echo "origin/main : $(git rev-parse --short origin/main)"
echo "commits     : $(git rev-list --all --count)"
echo
echo "=== modified tracked files (NOT committed) ==="
git diff --stat | tail -25
echo
echo "=== untracked (NOT committed) ==="
git status --porcelain | grep '^??' | sed 's/^?? //'
echo
echo "=== confirm nothing was committed or pushed by this review ==="
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ]; then
  echo "  local HEAD == origin/main  -> no push, no new commit"
else
  echo "  DIVERGED - investigate"
fi