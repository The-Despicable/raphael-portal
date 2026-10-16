#!/usr/bin/env bash
# Boot the production server detached so it survives the launching shell.
set -uo pipefail
cd /home/yaser/raphael-portal
PORT="${PORT:-4123}"

# Kill anything already on the port.
if [ -f /tmp/rph-visual.pid ]; then
  kill "$(cat /tmp/rph-visual.pid)" 2>/dev/null || true
  rm -f /tmp/rph-visual.pid
fi
pkill -f "next-server" 2>/dev/null || true
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