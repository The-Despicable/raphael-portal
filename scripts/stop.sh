#!/usr/bin/env bash
# Stop the detached preview server started by serve.sh.
set -uo pipefail
if [ -f /tmp/rph-visual.pid ]; then
  PID="$(cat /tmp/rph-visual.pid)"
  kill "$PID" 2>/dev/null && echo "stopped pid $PID" || echo "pid $PID already gone"
  rm -f /tmp/rph-visual.pid
else
  echo "no pid file"
fi
pkill -f "next-server" 2>/dev/null && echo "swept any remaining next-server" || true