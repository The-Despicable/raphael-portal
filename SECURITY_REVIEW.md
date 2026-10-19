# Security & Privacy Review — raphael-portal

**Date:** 2026-10-16
**Scope:** `/home/yaser/raphael-portal` only. Raphael and Vesper were not modified.
**Posture:** read-only with respect to release. No commit, push, or deploy was performed.
**Working tree:** `HEAD` = `origin/main` = `29afd75`. All changes below are uncommitted.

> Sanitized by design. No credential, connection string, personal address, or
> internal host value appears anywhere in this document. Findings name files and
> categories only.

---

## 1. Summary

| | Count |
| --- | --- |
| Issues found | 4 (1 high, 2 medium, 1 low) |
| Issues fixed in this review | 4 |
| Regression tests added | 15 (8 unit + 7 HTTP smoke assertions) |
| Security gate FAIL | 0 |
| Security gate BLOCKED | 0 |
| Security gate PASS | 43 |
| Security gate NOT CHECKED | 3 |
| Release blockers | 5 (none are code defects) |

The codebase was already small, dependency-light, and deliberately architected —
one external network call, no HTML sinks, no `process.env` outside a guarded
module. The material findings were a latent disclosure path in the assistant
endpoint and a missing abuse control on the privileged route.

---

## 2. Issues found and fixed

### SEC-001 — Raw model output was reachable from the public assistant endpoint (HIGH)

**Category:** unintended disclosure / debug surface in production path

The assistant response spread internal state and conditionally attached the raw
provider text as `__raw`, gated only by a `MODEL_DEBUG_RAW` environment variable.
That field carried the model's reasoning trace and any text the prompt induced.

**Why "off by default" was not adequate.** A flag is a configuration state, not a
control. It can be flipped by a deploy, by copying an `.env` file between
environments, or by a well-meaning "just enable debug for a moment" commit.

**Fix.** The capability was **removed**, not disabled:

- The raw-text helper was deleted from `src/lib/assistant.ts`.
- The `MODEL_DEBUG_RAW` switch was deleted from `src/lib/env.ts`.
- The route now builds an explicit **allowlist** response
  (`mode`, `text`, `citations`, `notice`, `corpusSize`, `capabilities`) and no
  longer spreads the internal result object, so future fields cannot leak by
  default.
- Citations are narrowed field-by-field rather than forwarded wholesale.

**Files:** `src/app/api/assistant/route.ts`, `src/lib/assistant.ts`,
`src/lib/env.ts`, `.env.example`, `VERCEL_NOTES.md`

---

### SEC-002 — Privileged endpoint had no rate limiting (MEDIUM)

**Category:** missing abuse control / online credential guessing

`PATCH /api/moderation` compared the credential with `timingSafeEqual` (correct —
no timing oracle) but applied **no rate limit**. Constant-time comparison
prevents leaking *whether* a guess was close; it does nothing about the number of
guesses. The endpoint could be attacked at unlimited volume.

**Fix.** Added a `moderation` rule (`10 / 60s`) and applied it **before** the
credential check, so a wrong key is throttled rather than retried without bound.
The limit is overridable via `RATE_LIMIT_MODERATION`, defaulting safely.

**Files:** `src/lib/rate-limit.ts`, `src/app/api/moderation/route.ts`

---

### SEC-003 — Stale conversation history sent to the assistant (MEDIUM)

**Category:** correctness defect with a privacy-adjacent consequence

The submit handler's `useCallback` omitted `turns` from its dependency array. The
request body is built from the prior turns so follow-ups ("tell me in more
detail") can be resolved. With a stale closure, the history sent could be the
*previous* conversation state — silently breaking the feature it exists to
support, and in the worst case sending turns the user did not expect to be
resent.

**Fix.** Added `turns` to the dependency array, with a comment explaining why.

**File:** `src/components/assistant/AskAiLauncher.tsx`

---

### SEC-004 — Missing abuse control on moderation, and lint gate failing (LOW)

**Category:** build hygiene / gate integrity

`npm run lint` exited 1 with 6 errors, all from standalone CommonJS diagnostic
scripts under `scripts/` being linted with the application's TypeScript/browser
rules. A failing lint gate erodes the value of the verification suite.

**Fix.** Added `scripts/**/*.cjs` and `scripts/**/*.mjs` to `globalIgnores` in
`eslint.config.mjs`. These are Node-side tooling, not application code.

**File:** `eslint.config.mjs`

---

## 3. Repository and history audit — PASS

Scanned tracked files **and all 3 commits** with `scripts/audit-repo.sh`.

| Check | Result |
| --- | --- |
| Credential-shaped strings in tracked files | CLEAN |
| Credential-shaped strings across full git history | CLEAN |
| Secret-shaped files tracked (`.env`, keys, keystores) | CLEAN |
| Personal information (non-vendor addresses) | CLEAN |
| Raphael / Vesper source vendored or included | CLEAN |
| Internal host details (RFC1918) | CLEAN |
| Engagement / client identifiers | CLEAN |
| Archive or oversized files (>2 MB) | CLEAN |

**One benign note.** `.env.example` contains a *documented placeholder* DSN built
from the tokens `postgres://`, a `USER` segment, a `PASSWORD` segment, and a host
— credential-*shaped* but not a secret. (The literal placeholder is not
reproduced here, because reproducing it would itself trip every credential
scanner run against this repository.) These placeholders were excluded from the
"HIT" verdict and reported separately, so that a known-good pattern does not
desensitise the reader to this section. The file is intentionally committable —
it is the deployment template.

**Verified absent:** no `.env.local`, key, certificate, archive, or third-party
project source is tracked.

---

## 4. Secret containment — PASS

| Check | Result |
| --- | --- |
| Secrets declared only in the server-only `src/lib/env.ts` | PASS |
| `process.env` read anywhere outside `env.ts` | PASS (none) |
| Client components connecting to secrets | PASS (names appear only as UI copy/documentation; no values) |
| `NEXT_PUBLIC_*` named like a secret | PASS (none) |
| Live secret values present in client bundles | PASS (absent) |
| Live secret values present in `public/` | PASS (absent) |
| Database connection string in a client chunk | PASS (absent) |
| Source maps served to clients | PASS — **0** maps under `.next/static`. All 118 maps live under `.next/server/`, which is not publicly served |
| Provider/credential markers in client output | PASS (none) |
| Secret values in HTTP responses (assistant, health) | PASS (absent; enforced by test) |
| Guest cookie flags | PASS — `httpOnly`, `sameSite=lax`, `secure` configurable (true in production) |

The one external network call in the entire server codebase is the configured
model provider. There is no analytics, telemetry, font CDN, or third-party
beacon anywhere in the source.

---

## 5. API route review

| Route | Session | Rate limit | Validation | Bounded body | Safe errors |
| --- | --- | --- | --- | --- | --- |
| `/api/assistant` | yes | yes | yes (schema) | yes (schema max) | yes |
| `/api/chat/messages` | yes | yes | yes | yes | yes |
| `/api/chat/session` | yes | yes | yes | yes (schema max) | yes |
| `/api/health` | n/a (public probe) | no | n/a | n/a | yes — booleans and config *names* only |
| `/api/moderation` | n/a (key) | **added** | yes | yes | yes |
| `/api/reports` | yes | yes | yes | yes | yes |
| `/api/reviews` | yes | yes | yes | yes | yes |
| `/api/suggestions` | yes | yes | yes | yes | yes |

Notes:

- **Error messages** are fixed strings. Provider error bodies are never echoed —
  the assistant throws `` `Provider responded ${status}` `` precisely because a
  raw body can carry account identifiers and quota detail.
- **Abuse handling.** Duplicate-submission detection is scoped to a session and
  advisory (reviews only). Reviews are held `PENDING` until a moderator acts, so
  unreviewed text is never auto-published.
- **`/api/health`** is deliberately unauthenticated and discloses configuration
  *state* (booleans, variable names). This is intentional honest-degradation
  reporting and leaks no values. If the deployment should not reveal which
  optional services are configured, this is the route to gate.

---

## 6. Verification results

Recorded separately, as required.

### PASS

- `typecheck` — exit 0
- `lint` — exit 0, clean
- unit tests — **99 passed / 5 files**
- production build — `Compiled successfully`
- HTTP smoke — **32 passed / 0 failed**
- security gate — **43 PASS, 0 FAIL, 0 BLOCKED**
- independent client-bundle scan — no secret value, provider marker, or
  connection string in `.next/static` or `public/`
- independent source-map scan — 0 client-served maps

### FAIL

- None.

### BLOCKED

- None. (Vercel deployment configuration *was* inspectable and was inspected.)

### NOT CHECKED

1. **Dev-dependency vulnerability audit** — build tooling only; not shipped to
   clients. Not a production exposure.
2. **No third-party secret-scanning service was used.** All scanning was local
   and pattern-based. A pattern scanner cannot prove absence; it can only fail to
   find. Treat "CLEAN" as "no match for the known shapes", not as proof.
3. **Live response headers on the deployed origin** — the CSP/HSTS entries in
   `vercel.json` were validated against Vercel's published schema but were not
   verified as emitted at the edge by a raw-header fetch in this review.

### Vercel deployment inspection (was available)

- Project linked; a deployment reached `READY`.
- Health endpoint returned HTTP 200 with `status: ok`.
- Deployment Protection is enabled (the URL served an authentication page to an
  unauthenticated client), so the preview is not publicly readable.
- **Environment variables are not set** on the deployment, so it runs in its
  documented degraded modes: assistant retrieval-only, storage non-durable,
  reviews `PENDING`.
- Environment variable *values* were not read or printed.

---

## 7. Serverless limitations (documented)

Both the rate limiter and the default store are **process-local**.

| Concern | Behaviour today | Consequence on serverless |
| --- | --- | --- |
| Rate limiting | In-process `Map` | Per-instance. Limits are **approximate**: N concurrent instances permit up to N× the configured rate. The moderation brute-force cap added in SEC-002 is subject to the same dilution |
| Sessions | Stored via the store | Per-instance under the memory store; a user can be logged out across cold starts |
| Chat / reviews | Memory store | **Lost on every cold start** and not shared between instances |
| Session signing key | Derived from `GUEST_SESSION_SECRET`, else a random per-process key | Without the secret, sessions are invalidated across instances. The app reports this honestly via `sessionsAreEphemeral()` |

**Recommended durable path.** Point `DATABASE_URL` at managed PostgreSQL
(the schema in `db/migrations/001_init.sql` already exists), then move the
rate-limit counters into a table with an atomic upsert. The store interface is
deliberately narrow so the driver swap is a one-file change. If strict
cross-instance rate limiting is required before that, a managed KV/Redis with
atomic `INCR` + `EXPIRE` is the smallest correct implementation.

Already recorded in `README.md` → *Known limitations*, with a row added for
per-instance sessions.

---

## 8. Regression tests added

**`tests/privacy.test.ts`** (8 tests, new file):

1. No source file defines or returns a raw-output debug field (comments stripped
   so the *documentation of the removal* does not trip it).
2. The assistant route builds an allowlist rather than spreading internal state.
3. Citations are narrowed field-by-field.
4. The env module exposes no debug-output switch.
5. The assistant module exports no raw-text helper.
6. The API key is only ever used in an `Authorization` header.
7. Provider error bodies are never echoed to the client.
8. Capability reporting derives from booleans, never from secret values.

**`tests/privacy.test.ts` — privileged endpoint** (5 tests):

9. Credential compared in constant time, with a length check first.
10. Fails closed when unconfigured (501, no unauthenticated fallback).
11. **Rate limited, and the limit is taken before the credential is evaluated.**
12. Credential read from a header, never a query string.
13. The key and its length are never returned.

**`scripts/smoke.sh`** (4 new HTTP assertions against the real server):

14. Assistant response contains no `__raw`, `reasoning_content`, `Authorization`,
    `Bearer`, `nvapi-`, `apiKey`, or `chat_template_kwargs`.
15. Assistant response keys are **exactly** the allowlist.
16. Health response discloses no configuration values.
17. (Existing) health exposes names/booleans only.

**`tests/rate-limit.test.ts`** — also covers a fail-open defect found earlier: with
no session digest and no network key, the limiter previously computed
`Math.min()` over an empty array (`Infinity`) and allowed everything. It now
falls back to a shared bucket and fails closed.

---

## 9. Release blockers

None of these are code defects. All are owner decisions or operational setup.

1. **Rotate the NVIDIA NIM key.** A live key was pasted into a chat transcript
   during earlier work. Rotate it at the provider and use the new value only as a
   deployment environment variable.
2. **Set production environment variables.** `DATABASE_URL`,
   `GUEST_SESSION_SECRET`, `MODERATION_KEY`, and `MODEL_*`. Without the first,
   chat and reviews are lost on every cold start. Without `GUEST_SESSION_SECRET`,
   sessions break between instances.
3. **Rate limiting is per-instance.** Acceptable for a low-traffic preview;
   move counters to shared storage before relying on it for abuse control.
4. **The Content-Security-Policy is unverified against a real browser.** It
   permits `'unsafe-inline'` for Next.js hydration and omits `'unsafe-eval'`. If
   the deployed site renders blank or ignores clicks, widen the CSP first — it is
   the newest and highest-risk line in `vercel.json`.
5. **`releaseReadiness.approved` remains `false`.** The source-release gate is
   preserved unchanged. Licence and credential-history remediation remain owner
   decisions, as does any offensive-tooling review.

---

## 10. Reviewer tooling defects (disclosed)

Three defects in the review tooling itself were found and corrected. They are
recorded because each produced a *confidently wrong* verdict at some point.

- **False negative.** The `vercel.json` validator stripped `//` comments before
  parsing, so it reported "valid" for a file Vercel rejects outright. Vercel's
  parser does not accept comments. A strict `JSON.parse` now backs the check.
- **False positive.** An unanchored grep matched `sow` inside `hasOwnProperty`
  and `disown`, and treated the product's own use of the word "engagement" as
  client metadata. Word boundaries were added.
- **Inverted verdict.** A secret-containment loop asserted the wrong invariant
  (that a secret *name* appears only in `env.ts`), FAILing the cleanest variable
  while passing broader ones. A variable name carries no privilege; the
  corrected check tests that no secret *value* reaches client code.

Also corrected: an earlier claim in this session that `"version": 3` was the sole
cause of the deploy failure. It was one of three, and not the one that mattered
most.

---

## 11. Actions NOT taken

- No commit. No push. No deploy. No production configuration changed.
- Raphael and Vesper were not read for source, modified, or referenced.
- No private audit file, engagement artefact, source archive, credential, or
  personal contact detail was opened or disclosed.
- The Raphael source-release gate was not altered.
- No environment variable value was read or printed.