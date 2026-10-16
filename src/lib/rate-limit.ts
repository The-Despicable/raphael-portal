import { env } from "./env";
import { networkBucketKey } from "./session";

/**
 * Rate limiting and abuse controls.
 *
 * PRIVACY NOTE
 * ------------
 * Buckets are keyed by the guest session digest and by a DAILY-ROTATING keyed
 * hash of the client address. The raw address is never stored, logged or
 * returned. Rotating the salt daily prevents cross-day correlation of a
 * visitor through their bucket key.
 *
 * STORAGE NOTE
 * ------------
 * Buckets are in-process. On serverless they are per-instance and therefore
 * approximate. For strict enforcement, point the database at a managed
 * PostgreSQL and move the counters into a table with an upsert. The interface
 * below is deliberately narrow so that swap is a one-file change.
 */

export interface RateLimitRule {
  /** Max actions allowed inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export const RULES = {
  join: { limit: 5, windowMs: 60_000 },
  rename: { limit: 5, windowMs: 60_000 },
  message: { limit: 8, windowMs: 30_000 },
  review: { limit: 3, windowMs: 10 * 60_000 },
  suggestion: { limit: 3, windowMs: 60 * 60_000 },
  assistant: { limit: 12, windowMs: 60_000 },
  report: { limit: 5, windowMs: 10 * 60_000 },
} as const satisfies Record<string, RateLimitRule>;

export type RuleName = keyof typeof RULES;

/**
 * Per-rule limit override, read from the SERVER environment.
 *
 * WHY THIS EXISTS
 * ---------------
 * The assistant limit is now also a COST control, not just an abuse control:
 * every question sends the whole corpus to a paid model. That makes the number
 * a deployment decision rather than a constant, so it must be settable without
 * a code change.
 *
 * Set `RATE_LIMIT_<RULE>=0` to disable that rule entirely. The DEFAULT is left
 * unchanged on purpose — an unset variable must never silently expose a public
 * deployment to unbounded spend or spam.
 */
function ruleLimit(ruleName: RuleName): number {
  const raw = env.rateLimitOverride(ruleName);
  if (raw === null) return RULES[ruleName].limit;
  return raw;
}

/** A resolved rule, with a disabled limit reported honestly to callers. */
function resolveRule(ruleName: RuleName): RateLimitRule {
  return { limit: ruleLimit(ruleName), windowMs: RULES[ruleName].windowMs };
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Best-effort cleanup so the Map cannot grow without bound. */
function sweep(now: number): void {
  if (buckets.size < 4096) return;
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Consume one unit from both the session bucket and the network bucket.
 * A request is allowed only if BOTH allow it.
 */
export async function consume(
  ruleName: RuleName,
  sessionDigest?: string | null,
): Promise<RateLimitResult> {
  const rule = resolveRule(ruleName);
  const now = Date.now();
  sweep(now);

  // limit === 0 means "disabled". Report it as allowed with no remaining count
  // rather than blocking everything, and skip bucket bookkeeping entirely so
  // the Map does not fill with unbounded traffic.
  if (rule.limit <= 0) {
    return { allowed: true, remaining: -1, retryAfterSeconds: 0 };
  }

  const results: RateLimitResult[] = [];

  if (sessionDigest) {
    results.push(consumeOne(`s:${ruleName}:${sessionDigest}`, rule, now));
  }

  const netKey = await networkBucketKey();
  if (netKey) {
    results.push(consumeOne(`n:${ruleName}:${netKey}`, rule, now));
  }

  // FAIL-OPEN BUG, FIXED
  // ---------------------
  // If neither a session digest nor a network key can be derived, `results` is
  // empty. The old code then returned
  //     Math.min(...[]) === Infinity
  // and `allowed: true` — so the limiter silently permitted EVERYTHING.
  //
  // That is reachable in production: a first-time visitor has no guest session
  // cookie, and a deployment behind a proxy that does not forward
  // x-forwarded-for / x-real-ip supplies no network key either. Such a request
  // got no rate limiting at all, which is precisely the case the control exists
  // to stop.
  //
  // Fall back to a single shared bucket so the limit is still enforced. This is
  // deliberately conservative: unidentified callers share one budget, which can
  // under-count for them, but it fails closed rather than open.
  if (results.length === 0) {
    results.push(consumeOne(`anon:${ruleName}`, rule, now));
  }

  const denied = results.find((r) => !r.allowed);
  if (denied) return denied;

  return {
    allowed: true,
    remaining: Math.min(...results.map((r) => r.remaining)),
    retryAfterSeconds: 0,
  };
}

function consumeOne(key: string, rule: RateLimitRule, now: number): RateLimitResult {
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: rule.limit - existing.count, retryAfterSeconds: 0 };
}

/** Advisory duplicate detection for reviews, scoped to a session. */
const recentSubmissions = new Map<string, { title: string; body: string; at: number }>();

const DUPLICATE_WINDOW_MS = 60 * 60_000;

export function isDuplicateSubmission(sessionDigest: string, title: string, body: string): boolean {
  const now = Date.now();
  const prior = recentSubmissions.get(sessionDigest);
  if (!prior || now - prior.at > DUPLICATE_WINDOW_MS) return false;
  return prior.title === title && prior.body === body;
}

export function recordSubmission(sessionDigest: string, title: string, body: string): void {
  recentSubmissions.set(sessionDigest, { title, body, at: Date.now() });
}

/** Standard JSON headers for a rate-limited response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "Retry-After": String(result.retryAfterSeconds),
    "X-RateLimit-Remaining": String(result.remaining),
  };
}

/**
 * Reports default to PENDING review when no moderator is configured. This is
 * deliberate: with no moderation operator, silent auto-publish would be worse
 * than a visible holding state.
 */
export function defaultReviewState(): "VISIBLE" | "PENDING" {
  return env.moderationConfigured ? "VISIBLE" : "PENDING";
}