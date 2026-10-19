#!/usr/bin/env bash
# Boot the production server detached so it survives the launching shell.
set -uo pipefail
cd /home/yaser/raphael-portal
PORT="${PORT:-4123}"

# True only for a `next start` server that this script's own pid file points
# at. A `next dev` server is never a match, even though both are titled
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

# Kill the server this script started, and only that one.
#
# The previous `pkill -f "next-server"` swept EVERY next-server on the machine,
# including an unrelated `next dev`. That is not a harmless convenience:
# killing a dev server's next-server child makes the dev server respawn it with
# a NEW Turbopack sessionId, and Next's dev client responds to a changed
# sessionId with `window.location.reload()` — so running this script while a
# dev tab was open force-reloaded that tab for no visible reason.
if [ -f /tmp/rph-visual.pid ]; then
  PID="$(cat /tmp/rph-visual.pid)"
  if is_own_server "$PID"; then
    kill "$PID" 2>/dev/null || true
  fi
  rm -f /tmp/rph-visual.pid
fi
sleep 1

# setsid detaches from the session so the server is not reaped when this
# script's shell exits.
setsid nohup ./node_modules/.bin/next start --port "$PORT" \
  > /tmp/rph-visual.log 2>&1 < /dev/null &
echo $! > /tmp/rph-visual.pid
disown 2>/dev/null || true

for i in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/api/health" 2>/dev/null; then
    # WSL2 does not always forward the Linux loopback to the Windows host, so
    # 127.0.0.1 can be unreachable from the browser even though the server is
    # healthy inside the distro. Print the address that actually works from
    # Windows, and verify the loopback really is forwarded before claiming so.
    WSL_IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^172\.|^192\.168\.|^10\.' | head -1)
    if [ -n "$WSL_IP" ]; then
      echo "UP on 127.0.0.1:${PORT} inside WSL (pid $(cat /tmp/rph-visual.pid))"
      echo "  Open in browser:  http://${WSL_IP}:${PORT}"
    else
      echo "UP on 127.0.0.1:${PORT} (pid $(cat /tmp/rph-visual.pid))"
    fi
    exit 0
  fi
  sleep 0.5
done

echo "FAILED to start; log:"
cat /tmp/rph-visual.log
exit 1