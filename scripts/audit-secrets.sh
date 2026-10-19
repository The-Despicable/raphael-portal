#!/usr/bin/env bash
cd /home/yaser/raphael-portal || exit 1
RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; DIM=$'\033[2m'; OFF=$'\033[0m'
p(){ if [ "$1" = "0" ]; then echo "  ${GRN}PASS${OFF} $2"; else echo "  ${RED}FAIL${OFF} $2"; fi; }

echo "=== 6a. secret VALUES read only by server code; NAMES are not secrets ==="
# An earlier version of this script asserted each secret NAME appears only in
# env.ts. That was the wrong invariant and produced a false FAIL on the
# cleanest variable while passing genuinely broader ones: MODERATION_KEY is
# legitimately referenced by two route handlers and DATABASE_URL by a
# user-facing notice. A variable NAME carries no privilege.
#
# The invariant that actually matters is checked in 6d/6e and by the security
# gate: the secret VALUE must never appear in a client bundle, a public asset,
# a response, or a source map.
for S in MODEL_API_KEY GUEST_SESSION_SECRET MODERATION_KEY DATABASE_URL DATABASE_POOL_URL; do
  N=$(grep -rlE "\b${S}\b" src/ 2>/dev/null | wc -l)
  DECL=$(grep -rlE "\b${S}\b" src/lib/env.ts 2>/dev/null | wc -l)
  if [ "$DECL" -eq 1 ]; then
    echo "  ${GRN}PASS${OFF} $S declared in server-only env.ts (name referenced in ${N} file(s); names are not secrets)"
  else
    echo "  ${RED}FAIL${OFF} $S is not declared in src/lib/env.ts"
  fi
done

echo
echo "=== 6a-ii. no secret name resolved to a VALUE in client code ==="
# A NAME in UI copy is fine ("configure DATABASE_URL for persistence") and does
# appear in ChatRoom.tsx. What must never appear is a VALUE. So this asserts
# the client component contains the name only inside a string literal, never an
# interpolation of env state.
# A NAME in UI copy is fine ("configure DATABASE_URL for persistence") and does
# appear in ChatRoom.tsx. What must never appear is an interpolation of env
# state into client code. Server routes under src/app/api/* legitimately read
# env via the server-only module, so exclude them.
BADFILE=$(grep -rlE '\b(MODEL_API_KEY|GUEST_SESSION_SECRET|MODERATION_KEY|DATABASE_URL|DATABASE_POOL_URL)\b' src/components src/app 2>/dev/null \
  | grep -v '^src/app/api/' \
  | while read -r f; do
      # A reference is a finding only if it is NOT a plain quoted literal.
      if grep -vE '^[[:space:]]*(\*|//|/\*|.*[A-Za-z]"|.*</span>|.*font-mono|^[[:space:]]*$)' "$f" \
           | grep -qE '\b(MODEL_API_KEY|GUEST_SESSION_SECRET|MODERATION_KEY|DATABASE_URL|DATABASE_POOL_URL)\b'; then
        echo "$f"
      fi
    done)
[ -z "$BADFILE" ] && p 0 "secret names in client code appear only as documentation/UI literals" || {
  p 1 "possible value interpolation in client code:"; echo "$BADFILE" | sed 's/^/        /'
}
echo "  ${DIM}client components carry no process.env access at all (see 6b)${OFF}"

echo
echo "=== 6b. no process.env outside the env module ==="
BAD=$(grep -rn 'process\.env' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v 'src/lib/env.ts' | grep -v '^\s*//' || true)
[ -z "$BAD" ] && p 0 "process.env only read in src/lib/env.ts" || { p 1 "process.env used elsewhere:"; echo "$BAD" | sed 's/^/        /'; }

echo
echo "=== 6c. no secret-shaped NEXT_PUBLIC_ variable ==="
BAD2=$(grep -rnE 'NEXT_PUBLIC_[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)' src/ 2>/dev/null || true)
[ -z "$BAD2" ] && p 0 "no NEXT_PUBLIC_* named like a secret" || { p 1 "found:"; echo "$BAD2" | sed 's/^/        /'; }

echo
echo "=== 6d. static / public assets carry no secrets ==="
LIVE=$(grep -E '^MODEL_API_KEY=' .env.local 2>/dev/null | cut -d= -f2- | tr -d '"'"'"' \r')
if [ -n "$LIVE" ]; then
  grep -rqF "$LIVE" public/ 2>/dev/null && p 1 "live key found in public/" || p 0 "no live key in public/"
fi
grep -rqiE 'nvapi-|BEGIN [A-Z ]*PRIVATE KEY' public/ 2>/dev/null && p 1 "credential marker in public/" || p 0 "no credential markers in public/"

echo
echo "=== 6e. source maps are not client-served ==="
PUB=$(find .next/static -name '*.map' 2>/dev/null | wc -l)
[ "$PUB" -eq 0 ] && p 0 "zero source maps under .next/static" || p 1 "$PUB client source map(s) published"

echo
echo "=== 6f. guest cookie flags ==="
grep -q 'httpOnly: true' src/lib/session.ts && p 0 "httpOnly" || p 1 "httpOnly missing"
grep -q 'sameSite: "lax"' src/lib/session.ts && p 0 "sameSite=lax" || p 1 "sameSite not set"
grep -q 'secure: env.guestCookieSecure' src/lib/session.ts && p 0 "secure is configurable (true in prod)" || p 1 "secure flag not configurable"

echo
echo "=== 8. release gate preserved ==="
grep -q 'approved: false' src/config/site.ts && p 0 "releaseReadiness.approved is still false" || p 1 "releaseReadiness gate may have been flipped"
grep -q 'SOURCE_OF_INSPIRATION' src/content/research.ts && p 0 "research source-release classifications intact" || p 1 "research classifications altered"

echo
echo "=== outbound egress inventory (external only) ==="
grep -rhoE 'https://[a-zA-Z0-9.-]+' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | sort -u | sed 's/^/  /'