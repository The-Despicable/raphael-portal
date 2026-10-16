# Opencode Prompt: Push Raphael Portal to Vercel

Copy and paste this entire block into opencode (or your AI assistant) to execute the Vercel deployment.

---

You are an operations engineer. Your task is to deploy the Raphael Portal Next.js project at `/home/yaser/raphael-portal` to Vercel.

## Prerequisites (verify first)
- [ ] Git repo has at least one commit and a remote (GitHub/GitLab/Bitbucket)
- [ ] You have a Vercel account and the Vercel CLI installed (`npm i -g vercel`)
- [ ] You have rotated the NVIDIA NIM API key at build.nvidia.com (CRED-001)
- [ ] You have generated production values for GUEST_SESSION_SECRET and MODERATION_KEY

## Steps to execute

### 1. Initialize git and create first commit
```bash
cd /home/yaser/raphael-portal
git init
git add -A
git commit -m "Initial release candidate — Raphael Portal"
git branch -M main
```

### 2. Push to a Git remote
Create a repository on GitHub/GitLab/Bitbucket, then:
```bash
git remote add origin <REMOTE_URL>
git push -u origin main
```

### 3. Login to Vercel and create project
```bash
vercel login
vercel
```
Follow the interactive prompts:
- Scope: your personal/team account
- Link to existing project: No
- Project name: `raphael-portal`
- Directory: `.` (current directory)
- Override settings: No (use detected Next.js settings)

### 4. Configure environment variables in Vercel dashboard
Go to your Vercel project → Settings → Environment Variables. Add each variable below for **Production** (and Preview if desired):

| Key | Value | Source |
|-----|-------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-project.vercel.app` | Set after first deploy |
| `DATABASE_URL` | PostgreSQL connection string | Vercel Postgres or external |
| `DATABASE_POOL_URL` | Pooled connection string (optional, preferred on serverless) | Vercel Postgres or external |
| `MODEL_API_KEY` | **Rotated** NVIDIA NIM key (NOT the .env.local value) | build.nvidia.com |
| `MODEL_BASE_URL` | `https://integrate.api.nvidia.com/v1` | |
| `MODEL_NAME` | `nvidia/nemotron-3.5-lightning-30b-a3b` | |
| `GUEST_SESSION_SECRET` | 32-byte base64url random value | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `MODERATION_KEY` | 32-byte base64url random value | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `RATE_LIMIT_ASSISTANT` | `12` (or your chosen cost limit) | Default — do NOT set to `0` |

**Do NOT** add `NEXT_PUBLIC_*` for any secret. Only `NEXT_PUBLIC_SITE_URL` is safe.

### 5. Redeploy to apply environment variables
```bash
vercel --prod
```

### 6. Verify deployment
```bash
curl -s https://your-project.vercel.app/api/health | python3 -m json.tool
```
Expected: `storage: "memory"` (or "postgres" if DATABASE_URL set), `generativeAi: true/false`, `moderation: true/false`.

## What NOT to do
- Do NOT commit `.env.local` to git (it's git-ignored and contains live secrets)
- Do NOT paste secret values into `vercel.json` or any tracked file
- Do NOT set `RATE_LIMIT_ASSISTANT=0` in production (cost/abuse exposure)
- Do NOT flip `releaseReadiness.approved` to `true` in `src/config/site.ts` until owner review of: license file, credential-history remediation, offensive tooling review

## Rollback
If something breaks: `vercel rollback` or redeploy the previous deployment from the Vercel dashboard.

---

End of prompt.