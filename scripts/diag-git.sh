#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
echo "commits : $(git rev-list --all --count 2>/dev/null || echo 0)"
echo "remotes : $(git remote -v 2>/dev/null | wc -l)"
echo "branch  : $(git branch --show-current 2>/dev/null || echo none)"
echo "changed : $(git status --porcelain 2>/dev/null | wc -l) files untracked/modified"
echo
echo "--- is the key safe to publish? ---"
echo ".env.local ignored : $(git check-ignore -q .env.local && echo YES || echo NO)"
echo ".env.example ignored (must be NO so it ships): $(git check-ignore -q .env.example && echo YES-BAD || echo NO-GOOD)"