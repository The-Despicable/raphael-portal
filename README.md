# Raphael — Open Research & Architecture Portal

An independent documentation website for **Raphael**, an ambitious and *unfinished* AI security
research project. The site's job is to make the project understandable without overstating it: what
it was designed to achieve, what the available evidence actually establishes, and how other people
can help.

It is deliberately **not** a marketing page. Raphael's central research claim is graded
`UNRESOLVED`, its governance is blocked with no authority able to unblock it, and its source
repository has not cleared release review. Every one of those facts is surfaced on the site rather
than smoothed over.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — the site runs with none of it set
npm run dev                    # http://localhost:3000
```

No credentials are required to run, build, or test the site.

### Verification

```bash
npm run verify     # typecheck → lint → tests → production build
npm run smoke      # boots a real server and exercises the guest flows over HTTP
```

| Command | Does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest |
| `npm run smoke` | End-to-end HTTP smoke test |

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Split-screen portfolio: profile left, projects right, then intro, architecture preview, research, project health, CTA |
| `/raphael` | Goals, interactive canonical-chain diagram, design principles, proposed vs observed architecture, legacy perimeter, research preview |
| `/research` | Filterable paper library, research-to-implementation matrix, Dream-RSI treatment, open questions, suggest-a-paper |
| `/status` | Dated assessment, readiness scorecard, filterable blocker register, evidence layering, timeline, strategic options |
| `/community` | Code of conduct, guest chat, reviews & feedback, moderation and privacy notes |

### API

| Endpoint | Method | Notes |
|---|---|---|
| `/api/health` | GET | Capability probe. Names and booleans only — never values |
| `/api/chat/session` | GET / POST / PATCH / DELETE | Join, rename, leave. No registration |
| `/api/chat/messages` | GET / POST | History (capped) and posting |
| `/api/reviews` | GET / POST | List and submit reviews |
| `/api/reports` | POST | Report a message, review or suggestion |
| `/api/moderation` | GET / PATCH | **Privileged.** Requires `MODERATION_KEY` |
| `/api/suggestions` | POST | Suggest a paper. Never auto-merged into the bibliography |
| `/api/assistant` | GET / POST | AI research assistant |

---

## Environment variables

Full descriptions and generation commands are in [`.env.example`](./.env.example). Summary:

| Variable | Secret? | Effect when unset |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | Absolute metadata URLs fall back to relative |
| `DATABASE_URL` | **Yes** | Falls back to the non-durable in-memory store |
| `DATABASE_POOL_URL` | **Yes** | Takes precedence over `DATABASE_URL` when set |
| `GUEST_SESSION_SECRET` | **Yes** | Per-boot random key; **all guest sessions die on restart** |
| `GUEST_COOKIE_NAME` | No | Defaults to `rph_guest` |
| `GUEST_COOKIE_SECURE` | No | Defaults to `true` in production |
| `MODEL_API_KEY` | **Yes** | Assistant runs in retrieval-only mode |
| `MODEL_BASE_URL` | **Yes** | As above |
| `MODEL_NAME` | **Yes** | As above |
| `MODEL_MAX_TOKENS` | No (`1024`) | Reasoning models need an explicit budget |
| `MODEL_DISABLE_THINKING` | No (`true`) | Set `false` to keep the model's reasoning trace |
| `MODERATION_KEY` | **Yes** | Moderation refuses all requests; reviews held `PENDING` |

> Nothing secret may ever be prefixed with `NEXT_PUBLIC_`. That prefix ships the value to the
> browser. This project contains **no** `NEXT_PUBLIC_*` secret, and a test asserts it.

### Generate a secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

---

## Database

The app works against managed PostgreSQL (Supabase, Neon, RDS, …).

```bash
psql "$DATABASE_URL" -f db/migrations/001_init.sql
```

The schema deliberately stores only what the community features need, and has **no** column for an
email address, IP address, user agent, or device fingerprint. Row-level security is enabled with
deny-all policies as defence in depth; the application connects server-side.

Retention SQL (comments in the migration) should be scheduled:

| Table | Suggested retention |
|---|---|
| `chat_messages` | 30 days |
| `reviews` | 365 days |
| `reports` | 90 days |

Adjust to your jurisdiction, and record what you chose.

### Without a database

The store falls back to an **in-memory** driver. This exists so the site is runnable and testable
with zero credentials. It is **non-durable** and **single-instance**: messages and reviews are lost
on restart and are not shared between instances. The UI says so explicitly rather than hiding it.

---

## Guest access model

**No login. No email, no password, no OAuth, no registration.**

- The server issues a random 256-bit session token, stored in an `HttpOnly`, `Secure`,
  `SameSite=Lax` cookie. Page scripts cannot read it.
- Only an HMAC **digest** of the token is persisted, so a database leak does not yield usable
  sessions.
- A nickname is a **pseudonym**. It is not verified identity and is **not globally reserved** —
  another visitor may use the same display name from another device. The UI states this everywhere
  the identity appears, and `pseudonymous: true` is returned by the API.
- Usernames are normalised to strip zero-width and bidi-override characters, which otherwise enable
  homograph impersonation in a room where names carry authority.
- No IP address is stored, logged, or returned. Rate limiting uses a **daily-rotating keyed hash** of
  the address, so a visitor cannot be correlated across days.

### Safeguards (no login ≠ no safeguards)

| Control | Implementation |
|---|---|
| Rate limiting | Per-session **and** per-network buckets, per action (`src/lib/rate-limit.ts`) |
| Validation | Zod on every field, server-side; rejects rather than truncates |
| Safe rendering | React text nodes only. **No `dangerouslySetInnerHTML` anywhere in the codebase** |
| No execution | Message content is never evaluated, templated, or passed to a tool. The endpoints have no tools |
| Reporting | Messages, reviews and suggestions are reportable in-app |
| Moderation | `PATCH /api/moderation`, requires `MODERATION_KEY`, constant-time comparison |
| Spam control | Per-session duplicate detection on reviews |

### AI assistant vs community chat

Two deliberately separate experiences:

- **Community chat** — visitors talking to each other. Messages are never sent to a model provider.
- **Raphael AI** — a research assistant over a fixed corpus of project documents, reachable from a
  global launcher.

They never mix. AI answers are not posted into the human room, and the assistant has **no tools**:
it cannot execute code, run scans, operate Raphael, reach a target, or touch a repository.

**Citation guarantee:** citations are computed server-side by retrieval and rendered regardless of
what the model outputs, so a hallucinated source cannot be displayed.

**Grounding gate:** if retrieval returns no passage, the model is **not called at all** and the
assistant returns a verbatim refusal. This is enforced structurally, not by asking the model nicely in
a system prompt — it was measured that the model answers "What is the capital of France?" from its own
knowledge even when instructed to refuse. Because the gate sits *before* the provider call, the model
can only ever rephrase content that already exists in the corpus, so it can never be the sole source
of a claim. Relatedly, a passage must match at least two distinct content terms (when the question
offers enough to corroborate) — a bare BM25 `score > 0` filter is not a safe relevance gate, because
IDF rewards rare terms and a single rare-but-empty word such as "high" otherwise matches confidently.

**Retrieval-only mode:** with no `MODEL_API_KEY`, the assistant quotes corpus passages *verbatim*
rather than generating text. This mode cannot invent a citation, because it never writes any.

### Reasoning models (NVIDIA NIM / Nemotron 3)

Nemotron 3 Super and Lightning are **reasoning** models. Left at the provider default completion
budget, the entire response can be spent on internal deliberation and `content` comes back `null` —
which a naive parser cannot distinguish from "the provider failed". Two settings prevent this:

| Variable | Default | Why |
| --- | --- | --- |
| `MODEL_MAX_TOKENS` | `1024` | Guarantees room for an answer after deliberation. |
| `MODEL_DISABLE_THINKING` | `true` | Sends `chat_template_kwargs.enable_thinking=false`, returning a direct answer in ~0.4s. |

`assistant.ts` additionally falls back to `reasoning_content` before giving up, so a null `content`
can never surface as an empty answer.

The set of models a key can reach is **per-account**. Well-known IDs are retired or unentitled, so
discover what yours can actually call rather than trusting documentation:

```bash
curl -H "Authorization: Bearer $MODEL_API_KEY" "$MODEL_BASE_URL/models"
```

---

## Deployment

Ready for Vercel once the external configuration below is supplied.

1. Provision PostgreSQL; run `db/migrations/001_init.sql`.
2. Set `DATABASE_URL` (or `DATABASE_POOL_URL`), `GUEST_SESSION_SECRET`, and optionally
   `MODEL_*` and `MODERATION_KEY`, in the Vercel project settings.
3. Deploy. No build-time secrets are required.

### Pre-release checks — all must pass before publishing

- [ ] `npm run verify` is green
- [ ] `npm run smoke` is green
- [ ] Secret scan of the repository and its history returns nothing
- [ ] Client bundles inspected for embedded credentials
- [ ] Licence decision made for the assessed project
- [ ] Credential-history remediation confirmed complete (rotation, then history decision)
- [ ] Release-readiness gate in `src/config/site.ts` deliberately re-reviewed

### Why there is no repository link

`releaseReadiness.approved` is **`false`**. While it is false the UI renders a neutral
availability notice and **never** a source link, archive, or clone affordance.

Reasons, as recorded in the 2026-10-16 assessment:

1. **No licence.** The project is not licensed for reuse.
2. **Credentials exposed in repository history**, rotation recorded as pending. Redacting the
   working tree does not remediate exposure.
3. **Unresolved offensive tooling** in-tree, with legal and ethical exposure.

Flipping the flag is an owner decision, not a code detail. `tests/release-gate.test.ts` fails if
someone enables public source access without also updating the recorded reasons.

---

## Accessibility

- `prefers-reduced-motion` fully honoured; animated variants collapse to instant renders
- Content is present on first paint — reveals never gate visibility
- Animations touch only `transform`/`opacity`, so there is no layout shift
- Status is **never colour alone**; every badge ships a text label
- Tables reflow to labelled stacked cards below 720px
- Live regions announce only newly added chat turns
- Skip link, visible focus rings, labelled controls, `aria-expanded`/`aria-pressed` throughout

---

## Content provenance

All project content is transcribed from a **single dated source** — a read-only viability assessment
dated **2026-10-16**, plus sanitised internal project notes. It is a snapshot, not live telemetry,
and the site says so on every page that reports it.

Deliberately excluded from all published content:

- local filesystem paths and the working-copy location
- git remote names, owner handles, and commit/tree hashes
- internal IP addresses, hostnames, container ports
- engagement identifiers and live-target configuration
- credential fingerprints or any credential material
- symbols of unpatched defensive defects (described by category instead)

**No citation, metric, star count, testimonial, or repository statistic on this site is invented.**
Where a value is unknown it is `null` or says so.

### The bibliography is incomplete, and says so

The accessible records name exactly **one** external publication (Dream-RSI). Rather than pad the
page with plausible-looking citations, the library declares the gap and provides a
suggest-a-paper flow that is never auto-merged. Conceptual similarity is not treated as historical
influence anywhere on the site.

---

## Tech stack

Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript strict, Tailwind CSS v4, Motion,
Lucide, Zod, `pg`, Vitest.

> **Next 16 note.** With `cacheComponents: true` the `dynamic`, `revalidate` and `runtime` segment
> options no longer exist, and `next lint` has been removed. Pages needing per-request data opt in
> via `cookies()`/`headers()`; linting runs through the ESLint CLI.

---

## Known limitations

| Limitation | Status |
|---|---|
| Chat transport is polling, not realtime | Documented fallback. No realtime credentials configured. A production deployment should attach a managed realtime channel to the same endpoints |
| Storage is in-memory by default | Non-durable until `DATABASE_URL` is set |
| Reviews are held `PENDING` | Until `MODERATION_KEY` is set. Unreviewed text is never auto-published |
| Assistant is retrieval-only | Until `MODEL_*` is set |
| Rate limits are per-instance | Move counters into Postgres for strict enforcement on serverless |
| Personal profile is placeholder text | Edit `src/config/site.ts` |
| Project links unverified | Withhold rather than guess a URL |

## Licence

See `LICENSE` if present. **The assessed Raphael project has no licence and is not licensed for
reuse.** That is a finding about that project, recorded here as a release blocker.