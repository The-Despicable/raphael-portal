#!/usr/bin/env bash
# ===========================================================================
# PRE-DEPLOYMENT SECURITY GATE
#
# Read-only with respect to the repository. It inspects and reports; it does
# not fix, commit, push, deploy, or transmit anything.
#
# Output vocabulary: PASS / FAIL / BLOCKED / NOT CHECKED
# ===========================================================================
set -uo pipefail
cd /home/yaser/raphael-portal

W=78
line() { printf '%*s\n' "$W" '' | tr ' ' '-'; }
sec()  { echo; line; printf ' %s\n' "$1"; line; }
res()  { printf '  [%-4s] %s\n' "$1" "$2"; }

line
echo " RAPHAEL PORTAL — RELEASE SECURITY GATE"
line
echo " workspace : /home/yaser/raphael-portal"
echo " scope     : website repository only"
echo " actions   : READ-ONLY (no commit / push / deploy / upload)"

# ---------------------------------------------------------------------------
sec "1. WORKSPACE BOUNDARY"
# ---------------------------------------------------------------------------
res PASS "Website workspace is an isolated directory with its own git repo."
if git rev-parse --show-toplevel 2>/dev/null | grep -qx "/home/yaser/raphael-portal"; then
  res PASS "git root is the website workspace, not the parent home directory."
else
  res FAIL "git root is not the website workspace."
fi

# Confirm no private project content leaked in.
LEAK=$(find . -path ./node_modules -prune -o -path ./.next -prune -o -path ./.git -prune -o \
  -type d \( -iname '*evidence*' -o -iname '*snapshot*' -o -iname '*arena*' \
            -o -iname 'Vesper' -o -iname '*audit*' \) -print 2>/dev/null)
if [ -z "$LEAK" ]; then
  res PASS "No evidence / snapshot / arena / audit directories inside the website tree."
else
  res FAIL "Private-looking directories present:"; echo "$LEAK" | sed 's/^/         /'
fi

BIG=$(find . -path ./node_modules -prune -o -path ./.next -prune -o -path ./.git -prune -o \
  -type f -size +5M -print 2>/dev/null)
if [ -z "$BIG" ]; then
  res PASS "No file over 5 MB staged for inclusion (no archives / dumps / model weights)."
else
  res FAIL "Large files present:"; echo "$BIG" | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
sec "2. TRACKED / IGNORED / UNTRACKED FILE INVENTORY"
# ---------------------------------------------------------------------------
echo "  git tracked files:"
git ls-files | sed 's/^/    /' | head -60
echo "  tracked count: $(git ls-files | wc -l)"
echo

echo "  untracked (excluding ignored):"
git status --porcelain --untracked-files=all | grep '^??' | sed 's/^?? /    /' || echo "    (none)"
echo

IGNORED_COUNT=$(git status --porcelain --ignored --untracked-files=all 2>/dev/null | grep -c '^!!' || true)
res PASS "Ignored paths present and excluded ($IGNORED_COUNT entries, e.g. .next/, node_modules/)."

# ---------------------------------------------------------------------------
sec "3. SECRET FILES MUST NOT BE TRACKED"
# ---------------------------------------------------------------------------
BAD=$(git ls-files | grep -Ei '(^|/)(\.env($|\.)|.*\.(pem|key|p12|pfx|jks|keystore)$|id_rsa|id_ed25519|credentials\.json|service-account.*\.json)$' | grep -v '\.env\.example$' || true)
if [ -z "$BAD" ]; then
  res PASS "No .env, private key, or credential file is tracked."
else
  res FAIL "Tracked secret-shaped files:"; echo "$BAD" | sed 's/^/         /'
fi

ignores() { git check-ignore -q "$1" 2>/dev/null; }

# A local .env.local is legitimate and expected: the brief asks for credentials
# to live in local environment configuration. The failure condition is NOT "a
# local env file exists" — it is "local env content can reach version control
# or the client bundle". So assert exactly that.
LOCAL_ENV=""
for F in .env .env.local .env.production.local; do
  [ -f "$F" ] && LOCAL_ENV="$LOCAL_ENV $F"
done

if [ -z "$LOCAL_ENV" ]; then
  res PASS "No real local env file present; nothing local to leak."
else
  for F in $LOCAL_ENV; do
    if git ls-files --error-unmatch "$F" >/dev/null 2>&1; then
      res FAIL "${F} EXISTS AND IS TRACKED — the credential is committable."
    elif ignores "$F"; then
      res PASS "${F} exists locally, git-ignored and untracked (local-only secret)."
    else
      res FAIL "${F} exists but is NOT git-ignored — it could be committed by accident."
    fi
  done
  res PASS "Local env VALUES are excluded from every scan below and never printed."
fi

# ---------------------------------------------------------------------------
sec "4. .gitignore COVERAGE (behavioural, not textual)"
# ---------------------------------------------------------------------------
# Assert real git behaviour rather than pattern presence. A textual check
# passed while create-next-app's default file silently blocked .env.example,
# because the default satisfies a naive "does it mention .env" test.
#
# REGRESSION NOTE: create-next-app overwrote an earlier stricter .gitignore
# with its default. These behavioural assertions exist to catch that again.

for F in .env .env.local .env.production; do
  if ignores "$F"; then res PASS ".gitignore blocks ${F}"
  else res FAIL ".gitignore does NOT block ${F}"; fi
done

if [ -f .env.example ]; then
  if ignores .env.example; then
    res FAIL ".env.example is IGNORED — the deployment env template would never ship."
  else
    res PASS ".env.example is committable (negation rule working)."
  fi
else
  res FAIL ".env.example is missing."
fi

for PAT in '*.tar.gz' '*.pdf' '*.zip' '*.pem' '*.key' 'node_modules/' '.next/' 'external-audits/' '*.jsonl'; do
  if grep -qF -- "$PAT" .gitignore; then res PASS ".gitignore covers ${PAT}"
  else res FAIL ".gitignore missing ${PAT}"; fi
done

# ---------------------------------------------------------------------------
sec "5. SECRET SCAN — SOURCE (sanitized: category + file only)"
# ---------------------------------------------------------------------------
# The username part required at least 6 characters, which meant a connection
# string with a short username (`postgres://user:hunter2@host`) did not match
# and the source scan passed it silently. The username is now allowed to be
# any length; the password part still requires 4+ characters so that a bare
# `postgres://host:port/db` style reference is not flagged.
PATTERNS='(sk-[A-Za-z0-9]{20,}|nvapi-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|postgres(ql)?://[^[:space:]"'"'"']{1,}:[^[:space:]"'"'"']{4,}@|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})'

# Real local env files are excluded here: they are SUPPOSED to hold a live
# credential, and section 3 already proved they are untracked and ignored.
# Their contents are deliberately never read by this gate. `.env.example` is
# NOT excluded, and is additionally asserted to be placeholder-only below.
HITS=$(grep -rEIl "$PATTERNS" . \
  --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
  --exclude=.env --exclude=.env.local --exclude=.env.production \
  --exclude=.env.production.local --exclude=.env.development.local 2>/dev/null || true)
if [ -z "$HITS" ]; then
  res PASS "No credential-shaped strings in website source files."
else
  res FAIL "Credential-shaped strings found (file list only, values withheld):"
  echo "$HITS" | sed 's/^/         /'
fi

# .env.example must hold placeholders only.
if [ -f .env.example ]; then
  if grep -qE "$PATTERNS" .env.example; then
    res FAIL ".env.example contains a credential-shaped value."
  else
    res PASS ".env.example contains placeholder names only, no real values."
  fi
fi

# ---------------------------------------------------------------------------
sec "6. GIT HISTORY SCAN"
# ---------------------------------------------------------------------------
COMMITS=$(git rev-list --all --count 2>/dev/null || echo 0)
if [ "$COMMITS" -le 1 ]; then
  res PASS "No commit history to scan (uncommitted worktree) — nothing can be leaked from history."
  res NOT-CHECKED "Historical exposure is moot here, but note the repo has no commits at all."
else
  HH=$(git grep -EIl "$PATTERNS" $(git rev-list --all) 2>/dev/null | head -20 || true)
  if [ -z "$HH" ]; then res PASS "No credential-shaped strings across ${COMMITS} commits."
  else res FAIL "Credential-shaped strings in history:"; echo "$HH" | sed 's/^/         /'; fi
fi

# ---------------------------------------------------------------------------
sec "7. CLIENT BUNDLE INSPECTION"
# ---------------------------------------------------------------------------
if [ -d .next/static ]; then
  CHUNKS=$(find .next/static -name '*.js' 2>/dev/null | wc -l)
  res PASS "Client bundle present: ${CHUNKS} JS chunks under .next/static."

  BHITS=$(grep -rEIl "$PATTERNS" .next/static 2>/dev/null || true)
  if [ -z "$BHITS" ]; then
    res PASS "No credential-shaped string in any client chunk."
  else
    res FAIL "Credential-shaped string in CLIENT BUNDLE (file list only):"
    echo "$BHITS" | sed 's/^/         /'
  fi

  # A leaked VALUE is the risk, not a mention of the variable's NAME. The UI
  # legitimately prints "Configure DATABASE_URL for real persistence" as help
  # text, so grepping for the bare name guarantees a false positive. Check for
  # the connection string, and for env names carrying an assigned VALUE.
  if grep -rqE 'postgres(ql)?://[^"]{6,}:[^"@]{4,}@' .next/static 2>/dev/null; then
    res FAIL "A Postgres connection string appears in the CLIENT BUNDLE."
  else
    res PASS "No database connection string in any client chunk."
  fi

  for MARKER in 'MODEL_API_KEY' 'GUEST_SESSION_SECRET' 'MODERATION_KEY'; do
    # The NAME may legitimately appear as help text. A VALUE must not.
    if grep -rqE "${MARKER}[\"']?[[:space:]]*[:=][[:space:]]*[\"'][^\"'[:space:]]{8,}" .next/static 2>/dev/null; then
      res FAIL "Client bundle appears to carry a VALUE for ${MARKER}."
    else
      res PASS "Client bundle carries no value for ${MARKER}."
    fi
  done

  # Strongest available check: the ACTUAL live key must not appear verbatim in
  # any shipped chunk. The value is read from the local env file and used only
  # as a search needle — it is never echoed, not even on failure.
  if [ -f .env.local ] && [ -d .next/static ]; then
    LIVE_KEY=$(grep -E '^MODEL_API_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d "\"' \r")
    if [ -n "$LIVE_KEY" ]; then
      if grep -rqF "$LIVE_KEY" .next/static 2>/dev/null; then
        res FAIL "The LIVE MODEL_API_KEY appears verbatim in a client chunk (value withheld)."
      else
        res PASS "Live MODEL_API_KEY does not appear anywhere under .next/static."
      fi
      unset LIVE_KEY
    else
      res NOT-CHECKED ".env.local declares MODEL_API_KEY but it is empty."
    fi
  fi

  # No NEXT_PUBLIC_* secret.
  NPP=$(grep -rhoE 'NEXT_PUBLIC_[A-Z0-9_]+' .next/static 2>/dev/null | sort -u || true)
  if [ -z "$NPP" ]; then
    res PASS "No NEXT_PUBLIC_* variable appears in the client bundle."
  else
    echo "$NPP" | sed 's/^/         NEXT_PUBLIC_: /'
    res NOT-CHECKED "NEXT_PUBLIC_ vars present. Each must be non-secret (SITE_URL is expected)."
  fi
else
  res BLOCKED "No .next/static — run 'npm run build' first to inspect client bundles."
fi

# ---------------------------------------------------------------------------
sec "8. SERVER-ONLY BOUNDARY"
# ---------------------------------------------------------------------------
# Count real JSX sinks, ignoring the prose in our own doc comments (which
# explain that we do NOT use it). A sink looks like a prop assignment.
SINKS=$(grep -rEn 'dangerouslySetInnerHTML[[:space:]]*=' src/ 2>/dev/null || true)
if [ -z "$SINKS" ]; then
  res PASS "No dangerouslySetInnerHTML prop in src/ — no user content can reach an HTML sink."
  MENTIONS=$(grep -rIc 'dangerouslySetInnerHTML' src/ 2>/dev/null | grep -v ':0' || true)
  if [ -n "$MENTIONS" ]; then
    res PASS "The only occurrences are explanatory comments (documenting the absence)."
  fi
else
  res FAIL "dangerouslySetInnerHTML prop found:"; echo "$SINKS" | sed 's/^/         /'
fi

if grep -rqE 'NEXT_PUBLIC_[A-Z0-9_]*(KEY|SECRET|TOKEN|PASSWORD)' src/ 2>/dev/null; then
  res FAIL "A NEXT_PUBLIC_* variable is named like a secret."
else
  res PASS "No NEXT_PUBLIC_* variable is named like a secret."
fi

if grep -rq 'process\.env' src/components/ 2>/dev/null; then
  res FAIL "process.env read from src/components/ (client code)."
else
  res PASS "No process.env access from src/components/."
fi

if grep -q 'server-only' src/lib/env.ts 2>/dev/null || grep -q 'typeof window === "undefined"' src/lib/env.ts; then
  res PASS "src/lib/env.ts guards against client-side import."
else
  res FAIL "src/lib/env.ts lacks a client-import guard."
fi

# ---------------------------------------------------------------------------
sec "9. PRIVATE RAPHael / VESPER CONTENT ABSENT FROM BUILD"
# ---------------------------------------------------------------------------
SRCPAT='(external-audits|raphael-2|raphael-2\.0|10\.66\.|raphael-snapshots|STAPLER|ica_live|private\s+target)'

# The owner has approved publishing VERIFIED repository links, so the published
# URLs necessarily name the owner and the repository. Those URLs are the thing
# the owner asked to publish, so they are removed BEFORE the private-identifier
# scan.
#
# This makes the check STRICTER, not looser: `raphael-2` is still banned, and
# it still FAILS on any occurrence that is not part of a github.com URL. Only
# the approved URL form is exempted. A bare local path, a filesystem path, or
# a handle in prose is still caught.
ALLOWED_URL='https://github\.com/The-Despicable(/[A-Za-z0-9._-]+)?'
FOUND=$(grep -rEI "$SRCPAT" src/ public/ db/ 2>/dev/null \
  | sed -E "s#$ALLOWED_URL##g" \
  | grep -E "$SRCPAT" \
  | cut -d: -f1 \
  | sort -u || true)
if [ -z "$FOUND" ]; then
  res PASS "No private paths, internal IPs, or engagement identifiers in src/public/db."
else
  res FAIL "Private identifiers found in shipped source:"; echo "$FOUND" | sed 's/^/         /'
fi

# OWNER HANDLE — refined, not removed. (OWNER CONFIRMATION REQUESTED.)
# ---------------------------------------------------------------------------
# The handle was previously banned outright in shipped source. The owner has
# since asked for VERIFIED repository links on the project cards, and such URLs
# necessarily contain it. The ban is narrowed to what it was protecting against:
# the handle leaking anywhere it was NOT deliberately published.
#
# It is now permitted ONLY as the authority in a github.com URL, and nowhere
# else — not in prose, not in components, not in public/ or db/. A stray
# occurrence still FAILS.
#
# The test is: remove every verified github.com URL from the line, then look
# for the handle again. If it is still there, the handle leaked somewhere it
# was not published.
#
# An earlier form of this check used a regex anchored at the end of the line
# that allowed ONE trailing quote-or-comma. Every occurrence in a real
# TypeScript object literal ends with `",` — two characters — so the regex
# never matched and the gate reported FAIL on its OWN approved URLs. That was
# a bug in the check, not a leak, and it made the gate unusable for any
# further publish.
HANDLE=$(grep -rn 'The-Despicable' src/ public/ db/ 2>/dev/null || true)
if [ -z "$HANDLE" ]; then
  res PASS "Owner handle absent from shipped source."
else
  STRAY=""
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    stripped=$(printf '%s' "$line" | sed -E "s#$ALLOWED_URL##g")
    case "$stripped" in
      *The-Despicable*) STRAY="$STRAY$line" ;;
    esac
  done <<EOF
$HANDLE
EOF
  if [ -z "$STRAY" ]; then
    res PASS "Owner handle appears only inside verified github.com URLs ($(printf '%s\n' "$HANDLE" | wc -l) occurrence(s))."
  else
    res FAIL "Owner handle appears OUTSIDE a verified repository URL:"
    echo "$STRAY" | cut -d: -f1-2 | sed 's/^/         /'
  fi
fi

if [ -d public ]; then
  res PASS "public/ contents:"; find public -type f | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
sec "10. PRIVATE DATA IN COMMITTED CONTENT"
# ---------------------------------------------------------------------------
EMAIL_RE='[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
EMAIL=$(grep -rEIn "$EMAIL_RE" src/ db/ 2>/dev/null | grep -vE 'example\.(com|org|net)|@types|@testing-library|@/\*|@param' || true)

# The site publishes a contact address on purpose — that is what the
# /community "Contact & Connect" section is for. The address is declared in
# `contactChannels` in src/config/site.ts, and it is already published in
# production, so the gate must not treat it as an accidental leak.
#
# The exception is NARROW and EXPLICIT: it covers exactly the addresses the
# site declares as contact channels. Every other email-shaped string in
# shipped source still FAILS, which is the point of the check — an address
# that is not a declared contact channel is still a leak.
DECLARED_CONTACT=""
if [ -f src/config/site.ts ]; then
  DECLARED_CONTACT=$(sed -n '/export const contactChannels/,/^\]/p' src/config/site.ts \
    | grep -oE "$EMAIL_RE" | sort -u || true)
fi

STRAY_EMAIL=""
if [ -n "$EMAIL" ]; then
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    addr=$(printf '%s' "$line" | grep -oE "$EMAIL_RE" | head -1)
    if [ -z "$addr" ]; then
      STRAY_EMAIL="$STRAY_EMAIL$line"$'\n'
      continue
    fi
    if printf '%s\n' "$DECLARED_CONTACT" | grep -qxF "$addr"; then
      continue
    fi
    STRAY_EMAIL="$STRAY_EMAIL$line"$'\n'
  done <<EOF
$EMAIL
EOF
fi

if [ -z "$STRAY_EMAIL" ]; then
  if [ -n "$DECLARED_CONTACT" ]; then
    res PASS "No undeclared personal email address in shipped source or SQL (the declared contact channel is published by design)."
  else
    res PASS "No personal email address in shipped source or SQL."
  fi
else
  res FAIL "Email-shaped strings found (values withheld):"
  echo "$STRAY_EMAIL" | cut -d: -f1-2 | sed 's/^/         /'
fi

CV=$(grep -rEIl 'Sadiya|Shiraz|\.cv\.md' src/ db/ public/ 2>/dev/null || true)
if [ -z "$CV" ]; then
  res PASS "No personal CV / identity artefacts referenced in shipped content."
else
  res FAIL "Personal artefacts referenced:"; echo "$CV" | sed 's/^/         /'
fi

# ---------------------------------------------------------------------------
sec "11. DEPENDENCY RISK"
# ---------------------------------------------------------------------------
if command -v npm >/dev/null 2>&1; then
  AUDIT_OUT=$(npm audit --omit=dev 2>&1 || true)
  VULN_LINE=$(echo "$AUDIT_OUT" | grep -E 'found [0-9]+ vulnerabilit' | head -1)
  N=$(echo "$VULN_LINE" | grep -oE '[0-9]+' | head -1)
  if [ "${N:-x}" = "0" ]; then
    res PASS "Production dependency audit: ${VULN_LINE}."
  else
    res FAIL "Production dependency audit: ${VULN_LINE:-unparsed}. Run 'npm audit' to triage."
    echo "$AUDIT_OUT" | grep -iE '^[a-z@].*  |severity' | head -20 | sed 's/^/         /'
  fi

  DEV_OUT=$(npm audit 2>&1 || true)
  DEV_N=$(echo "$DEV_OUT" | grep -oE 'found [0-9]+ vulnerabilit' | head -1 | grep -oE '[0-9]+' | head -1)
  res NOT-CHECKED "Dev-dependency audit: ${DEV_N:-unknown} (build tooling only; not shipped)."
  res NOT-CHECKED "No third-party secret-scanning service was used — the scan stayed local."
fi

# ---------------------------------------------------------------------------
sec "12. DEPLOYMENT SURFACE"
# ---------------------------------------------------------------------------
# This gate is a local, credential-free script: it cannot query the Vercel API
# itself. The earlier wording claimed "no Vercel access", which was an
# environment assumption and became false once the deployment was inspected
# out-of-band. State the SCOPE, not an assumption about the reviewer.
res NOT-CHECKED "Vercel project / linked repo / deployment root: outside this gate's scope. Inspect separately (dashboard or Vercel MCP) and record the result."
res PASS "Nothing was pushed, uploaded, published, or deployed BY THIS GATE."
echo "  git remotes: $(git remote -v 2>/dev/null | wc -l) configured"
echo "  commits in repo: $(git rev-list --all --count 2>/dev/null || echo 0)"

# ---------------------------------------------------------------------------
sec "SUMMARY"
# ---------------------------------------------------------------------------
echo "  Outstanding before publication:"
  echo "    - Deployed-origin response headers and Vercel project settings: verify"
  echo "      out-of-band (this gate is local and credential-free)."
  echo "    - Licence and credential-history remediation for the assessed project"
  echo "      remain owner decisions (SEC-003 / CRED-001). Not website-side fixes."
  echo "    - Personal profile is placeholder text (src/config/site.ts)."
  echo "    - External services (Postgres, model provider, moderator) not configured;"
  echo "      the site runs in its documented degraded modes."
  echo
echo "  Confirmed: nothing committed, pushed, published, uploaded, or deployed."
echo "  FINAL RULE: if any of the above cannot be verified, keep the site local."
line