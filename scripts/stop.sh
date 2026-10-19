#!/usr/bin/env bash
# Stop the detached preview server started by serve.sh.
#
# Scope: the exact PID recorded in the pid file, and only if it is still a
# `next start` server. The previous `pkill -f "next-server"` swept every
# next-server on the machine — including a `next dev` server. Killing a dev
# server's next-server child makes it respawn with a new Turbopack sessionId,
# and Next's dev client then calls window.location.reload() in every open tab.
set -uo pipefail

# True only for a `next start` server that the pid file points at. A
# `next dev` server is never a match, even though both are titled
# "next-server" once running.
is_own_server() {
  local pid="${1:-}"
  [ -n "$pid" ] || return 1
  [ -r "/proc/$pid/cmdline" ] || return 1
  tr '\0' ' ' < "/proc/$pid/cmdline" 2>/dev/null | grep -q 'next-server' || return 1
  local ppid
  ppid="$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')"
  if [ -n "$ppid" ] && [ -r "/proc/$ppid/cmdline" ]; then
    if tr '\0' ' ' < "/proc/$ppid/cmdline" 2>/dev/null | grep -q 'next dev'; then
      return 1
    fi
  fi
  return 0
}

if [ -f /tmp/rph-visual.pid ]; then
  PID="$(cat /tmp/rph-visual.pid)"
  if is_own_server "$PID"; then
    kill "$PID" 2>/dev/null && echo "stopped pid $PID" || echo "pid $PID already gone"
  else
    echo "pid $PID is not a preview server (refusing to kill it)"
  fi
  rm -f /tmp/rph-visual.pid
else
  echo "no pid file"
fi