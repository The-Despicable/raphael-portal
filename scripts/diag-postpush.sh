#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
echo "commits  : $(git rev-list --all --count)"
echo "remote   : $(git remote get-url origin)"
echo "uncommitted changes : $(git status --porcelain | wc -l)"
echo "branch tracked     : $(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo 'not tracking')"
echo "local  HEAD : $(git rev-parse --short HEAD)"
echo "origin HEAD : $(git rev-parse --short origin/main 2>/dev/null || echo 'n/a')"