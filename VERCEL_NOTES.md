# vercel.json notes

`vercel.json` itself is **strict JSON with no comments**. Vercel's parser rejects
the file otherwise with:

```
400 config-json-parse-error: Invalid vercel.json file provided
```

Two mistakes cost real deploy cycles here. Both are recorded so they are not
repeated:

1. **`"version": 3`.** Vercel's published schema
   (https://openapi.vercel.sh/vercel.json) constrains this field to exactly 2:

   ```json
   "version": { "type": "integer", "minimum": 2, "maximum": 2 }
   ```

   The schema also sets `additionalProperties: false`, so any unrecognised
   top-level key is also rejected.

2. **`//` comments.** Even though Vercel historically tolerated JSONC in this
   file, the API's config parser does not. Validating with a comment-stripping
   step hides the problem — it proves the file is valid JSON *after* you remove
   the comments Vercel will choke on. Validate with a strict `JSON.parse`.

   `scripts/strict-parse.cjs` does exactly that.

   The earlier `"NEXT_PUBLIC_SITE_URL": "@next_public_site_url"` placeholder was
   a third bug, independent of the two above: Vercel takes `build.env` values
   literally, so `layout.tsx` would have run `new URL("@next_public_site_url")`
   and thrown at build time.

Validate any future change with:

```bash
node scripts/strict-parse.cjs        # must pass with comments PRESENT check false
node scripts/validate-vercel-json.cjs # checks version + keys against the schema
```

---

## Environment variables

Set these in Vercel project settings. **Never** in this file.

### Required for full functionality

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Without it chat and reviews use a non-durable in-memory store and are **lost on every cold start**. |
| `MODEL_API_KEY` | NVIDIA NIM key. Use a **rotated** key, not the value from `.env.local`. |
| `MODEL_BASE_URL` | `https://integrate.api.nvidia.com/v1` |
| `MODEL_NAME` | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| `GUEST_SESSION_SECRET` | 32-byte base64url. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `MODERATION_KEY` | 32-byte base64url, same command. Without it, `PATCH /api/reviews` refuses and reviews sit `PENDING` forever. |

### Optional

| Variable | Default |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | unset |
| `MODEL_MAX_TOKENS` | `1024` |
| `MODEL_DISABLE_THINKING` | `true` |
| `RATE_LIMIT_ASSISTANT` | `12` |

### Notes

- The local `.env.local` sets `RATE_LIMIT_ASSISTANT=0` for testing. That file is
  git-ignored and does **not** reach the deployment, so production keeps the
  built-in default of 12/min. Verify this after the first deploy.
- Only `NEXT_PUBLIC_*` values are baked into the client bundle. Never set one to
  a secret. `NEXT_PUBLIC_SITE_URL` is read at `src/app/layout.tsx` for
  `metadataBase` and is the only one intended for the client.

---

## Headers

Six are set. The `Content-Security-Policy` is the **highest-risk line in this
file**: it defends the guest chat and the model-rendered answers against
injected script, and it has not been tested against a real browser under
Vercel's header injection. It permits `'unsafe-inline'` for scripts because
Next.js inlines hydration payloads, and omits `'unsafe-eval'` because production
does not need it.

**If deployed pages render blank or stop responding to clicks, widen the CSP
first** — not the build.

---

## Crons

Intentionally empty. An earlier version documented
`/api/_maintenance/sweep`, which does not exist in this codebase and would 404.

---

## Rollback

Redeploy a previous deployment from the Vercel dashboard, or `vercel rollback`.