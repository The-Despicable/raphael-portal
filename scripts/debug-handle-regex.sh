#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1

HANDLE=$(grep -rn 'The-Despicable' src/ public/ db/ 2>/dev/null || true)
echo "=== raw HANDLE ==="
printf '%s\n' "$HANDLE" | sed 's/^/  /'

echo
echo "=== which lines are REJECTED as stray ==="
printf '%s\n' "$HANDLE" | grep -vE 'https://github\.com/The-Despicable(/[A-Za-z0-9._-]+)?["'"'"',]*$' | sed 's/^/  STRAY: /'

echo
echo "=== test each line individually ==="
printf '%s\n' "$HANDLE" | while IFS= read -r line; do
  if printf '%s' "$line" | grep -qE 'https://github\.com/The-Despicable(/[A-Za-z0-9._-]+)?["'"'"',]*$'; then
    echo "  OK   : $line"
  else
    echo "  STRAY: $line"
  fi
done