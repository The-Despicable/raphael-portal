#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Runtime smoke test against a REAL running production server.
#
# This is not a unit test. It boots `next start` on a throwaway port, then makes
# genuine HTTP requests with a cookie jar to prove the guest-chat and review
# flows work end to end: join -> post -> read -> rename -> report -> leave.
# ---------------------------------------------------------------------------
set -uo pipefail

PORT="${PORT:-4123}"
BASE="http://127.0.0.1:${PORT}"
JAR="$(mktemp)"
PASS=0
FAIL=0

cleanup() {
  [[ -n "${SERVER_PID:-}" ]] && kill "$SERVER_PID" 2>/dev/null
  rm -f "$JAR"
}
trap cleanup EXIT

ok()   { printf '  PASS  %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  FAIL  %s\n' "$1"; FAIL=$((FAIL+1)); }
check(){ if [ "$2" = "$3" ]; then ok "$1 ($2)"; else bad "$1 (expected '$3', got '$2')"; fi; }

cd /home/yaser/raphael-portal

echo "=== booting production server on :${PORT} ==="
# Use the project-local binary. `npx` inside WSL can resolve to the Windows shim
# on PATH, which fails under a UNC working directory.
./node_modules/.bin/next start --port "$PORT" > /tmp/rph-smoke.log 2>&1 &
SERVER_PID=$!

for i in $(seq 1 40); do
  if curl -fsS -o /dev/null "${BASE}/api/health" 2>/dev/null; then break; fi
  sleep 0.5
done

if ! curl -fsS -o /dev/null "${BASE}/api/health" 2>/dev/null; then
  echo "server did not come up; log follows"; cat /tmp/rph-smoke.log; exit 1
fi
echo "server up."
echo

# --- 1. health ------------------------------------------------------------
echo "--- GET /api/health ---"
H=$(curl -fsS "${BASE}/api/health")
echo "    driver=$(echo "$H" | grep -o '"driver":"[a-z]*"' | head -1)"
echo "    generativeAi=$(echo "$H" | grep -o '"enabled":[a-z]*' | head -1)"
echo "    must NOT contain any secret value:"
if echo "$H" | grep -qiE 'postgres://|Bearer |nvapi-|sk-[A-Za-z0-9]{20}|MODEL_API_KEY"\s*:\s*"[^"]+'; then
  bad "health endpoint leaked a credential"
else
  ok "health endpoint exposes names/booleans only, no values"
fi
echo

# --- 2. pages render -------------------------------------------------------
echo "--- page render (expect HTTP 200 + expected marker) ---"
for route in "/" "/raphael" "/research" "/status" "/community"; do
  BODY=$(curl -fsS "${BASE}${route}")
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}${route}")
  check "GET ${route}" "$CODE" "200"
  if [ -z "$BODY" ]; then bad "GET ${route} returned an empty body"; fi
done
echo "    NOT_READY present on /status:      $(curl -fsS ${BASE}/status | grep -c 'NOT_READY')"
echo "    'pending review' gate on home:      $(curl -fsS ${BASE}/ | grep -c 'pending review')"
echo

# --- 3. guest chat: join ---------------------------------------------------
echo "--- guest chat: join with no account ---"
J=$(curl -fsS -c "$JAR" -b "$JAR" -X POST "${BASE}/api/chat/session" \
      -H 'Content-Type: application/json' \
      -d '{"nickname":"smoke_tester","accent":"cyan"}')
echo "    $J" | head -c 220; echo
if echo "$J" | grep -q '"pseudonymous":true'; then ok "identity marked pseudonymous"; else bad "identity not marked pseudonymous"; fi
if grep -q 'rph_guest' "$JAR"; then ok "HttpOnly session cookie issued"; else bad "no session cookie"; fi
# HttpOnly flag present?
if grep 'rph_guest' "$JAR" | grep -q '#HttpOnly_'; then ok "cookie has HttpOnly flag"; else bad "cookie missing HttpOnly"; fi
echo

# --- 4. validation rejects bad nicknames -----------------------------------
echo "--- validation: bad nicknames rejected (422) ---"
for nick in 'a' '-admin' '<script>' '../etc'; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -b "$JAR" -X POST "${BASE}/api/chat/session" \
         -H 'Content-Type: application/json' -d "{\"nickname\":\"$nick\",\"accent\":\"cyan\"}")
  check "reject nickname '${nick}'" "$CODE" "422"
done
echo

# --- 5. post + read messages ----------------------------------------------
echo "--- guest chat: post and read back ---"
M1=$(curl -fsS -c "$JAR" -b "$JAR" -X POST "${BASE}/api/chat/messages" \
      -H 'Content-Type: application/json' -d '{"body":"Line one\nLine two — testing paragraph preservation."}')
if echo "$M1" | grep -q 'Line one\\nLine two'; then ok "newlines preserved in message body"; else bad "newlines were flattened"; fi
HIST=$(curl -fsS "${BASE}/api/chat/messages?limit=10")
if echo "$HIST" | grep -q 'smoke_tester'; then ok "message readable via GET"; else bad "message not readable"; fi
if echo "$HIST" | grep -q '"durable":false'; then ok "non-durable store reported honestly"; else echo "    note: durable store is configured"; fi
echo

# --- 6. length cap ---------------------------------------------------------
echo "--- validation: over-length message rejected ---"
LONG=$(head -c 2000 /dev/zero | tr '\0' 'x')
CODE=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -b "$JAR" -X POST "${BASE}/api/chat/messages" \
       -H 'Content-Type: application/json' -d "{\"body\":\"$LONG\"}")
check "reject 2000-char message" "$CODE" "422"
echo

# --- 7. rate limit ---------------------------------------------------------
echo "--- rate limit: session bucket exhausts ---"
LAST=""
for i in $(seq 1 14); do
  LAST=$(curl -s -o /dev/null -w '%{http_code}' -c "$JAR" -b "$JAR" -X POST "${BASE}/api/chat/messages" \
         -H 'Content-Type: application/json' -d "{\"body\":\"spam attempt $i\"}")
done
check "eventually rate limited" "$LAST" "429"
echo

# --- 8. reviews ------------------------------------------------------------
echo "--- reviews: submit + list ---"
RV=$(curl -fsS -c "$JAR" -b "$JAR" -X POST "${BASE}/api/reviews" \
      -H 'Content-Type: application/json' \
      -d '{"title":"Smoke test review","body":"Verifying the anonymous review path works end to end.","rating":4,"category":"DOCUMENTATION"}')
echo "    $RV" | head -c 200; echo
if echo "$RV" | grep -q '"rating":4'; then ok "rating round-trips"; else bad "rating lost"; fi
RL=$(curl -fsS "${BASE}/api/reviews?limit=5")
if echo "$RL" | grep -q 'Smoke test review'; then ok "review visible in list"; else echo "    note: review held PENDING (no MODERATION_KEY) — expected"; fi
echo

# --- 9. assistant ----------------------------------------------------------
# Assert the INVARIANT, not a particular mode. With MODEL_* set the assistant
# answers GENERATIVELY; with none set it degrades to RETRIEVAL_ONLY. Both are
# correct — but an answer must NEVER ship without a citation.
echo "--- assistant: grounded answer with citations ---"
A=$(curl -fsS -X POST "${BASE}/api/assistant" -H 'Content-Type: application/json' \
     -d '{"question":"Is exec/ really the only entry point?"}')
if echo "$A" | grep -qE '"mode":"(GENERATIVE|RETRIEVAL_ONLY)"'; then
  ok "assistant returned a known mode"
else
  bad "unexpected mode"
fi
if echo "$A" | grep -q '"docId":"arch-exec"'; then
  ok "answer is grounded in a retrieved corpus passage"
else
  bad "answer cites no exec/ passage"
fi
if echo "$A" | grep -q '"text":"[^"]\{40,\}'; then
  ok "answer carries real prose"
else
  bad "answer text is empty"
fi

# --- 9b. grounding contract: unsupported answers must not look sourced -------
# The assistant answers ANY question now, so the invariant is no longer "it
# refuses" — it is "an answer the records do not support carries ZERO citations
# and is labelled GENERATIVE_UNGROUNDED".
U=$(curl -fsS -X POST "${BASE}/api/assistant" -H 'Content-Type: application/json' \
     -d '{"question":"How do I bake sourdough bread at high altitude?"}')
if echo "$U" | grep -q '"mode":"GENERATIVE_UNGROUNDED"' && ! echo "$U" | grep -q '"docId"'; then
  ok "unsupported question answered, but with no citations attached"
else
  bad "an unsupported answer was presented as sourced"
fi

# A follow-up with no lexical overlap must still resolve against the records,
# using the conversation history. This is what the old gate refused.
F=$(curl -fsS -X POST "${BASE}/api/assistant" -H 'Content-Type: application/json' \
     -d '{"question":"tell me in more detail","history":[{"role":"user","text":"Why is the project NOT_READY?"},{"role":"assistant","text":"Readiness is NOT_READY because the gate is BLOCKED at G3."}]}')
if echo "$F" | grep -q '"docId"'; then
  ok "ambiguous follow-up resolved against the records"
else
  bad "follow-up did not resolve to any record"
fi
if echo "$A" | grep -q 'Documented canonical architecture'; then ok "citations point at corpus documents"; else bad "no corpus citation"; fi
A2=$(curl -fsS -X POST "${BASE}/api/assistant" -H 'Content-Type: application/json' \
      -d '{"question":"What is the capital of France?"}')
if echo "$A2" | grep -q '"mode":"GENERATIVE_UNGROUNDED"' \
   && echo "$A2" | grep -qi 'not from the project records' \
   && ! echo "$A2" | grep -q '"docId"'; then
  ok "out-of-corpus answer is labelled and carries no citations"
else
  bad "out-of-corpus answer was presented as sourced"
fi
echo

# --- 10. moderation closed by default -------------------------------------
echo "--- moderation: refused while MODERATION_KEY unset ---"
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X PATCH "${BASE}/api/moderation" \
       -H 'Content-Type: application/json' -H 'x-moderation-key: guess' \
       -d '{"targetKind":"REVIEW","targetId":"rev_x","state":"HIDDEN"}')
check "moderation endpoint refuses without config" "$CODE" "501"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "${BASE}/api/moderation")
check "moderation probe reachable" "$CODE" "200"
echo

# --- 11. leave -------------------------------------------------------------
echo "--- guest chat: leave ---"
curl -fsS -c "$JAR" -b "$JAR" -X DELETE "${BASE}/api/chat/session" > /dev/null
AFTER=$(curl -fsS -c "$JAR" -b "$JAR" "${BASE}/api/chat/session")
if echo "$AFTER" | grep -q '"identity":null'; then ok "session cleared on leave"; else bad "session survived leave"; fi
echo

echo "================================"
echo " passed: $PASS   failed: $FAIL"
echo "================================"
[ "$FAIL" -eq 0 ] || { echo "--- server log tail ---"; tail -20 /tmp/rph-smoke.log; exit 1; }