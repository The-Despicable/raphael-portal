import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Guest session identity.
 *
 * PRIVACY MODEL (this is the part that matters)
 * ---------------------------------------------
 * A guest nickname is a PSEUDONYM, not an identity.
 *
 *  - There is no email, password, OAuth or conventional login anywhere in this
 *    feature.
 *  - The server issues a random session id and stores it in an HttpOnly cookie.
 *    The raw token never reaches JavaScript, so page scripts cannot read it.
 *  - The cookie is SameSite=Lax and Secure in production.
 *  - Nothing links a session to a real person. Another visitor may legitimately
 *    display the same nickname from a different device or after clearing state.
 *    This site therefore makes NO claim of globally reserved identity.
 *  - The token is stored as an HMAC digest server-side, so a database leak does
 *    not hand over usable session tokens.
 *  - No IP address is stored, displayed, or returned to any visitor.
 */

export interface GuestIdentity {
  sessionId: string;
  nickname: string | null;
  accent: string | null;
  createdAt: number;
}

interface SessionRecord extends GuestIdentity {
  /** HMAC of the raw token. The raw token is never persisted. */
  tokenDigest: string;
  lastSeenAt: number;
}

export const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * Process-local session registry.
 *
 * Used when DATABASE_URL is absent. Non-durable by design: restarting the
 * process clears it. When Postgres is configured the database is authoritative
 * and this map only backs the token-digest lookup.
 */
const memorySessions = new Map<string, SessionRecord>();

/**
 * Signing key. A configured secret gives sessions that survive a restart; an
 * absent secret yields a per-boot random key, which INVALIDATES every session
 * on restart. Dying sessions are the correct failure mode — the alternative
 * would be a guessable, forgeable key.
 */
let signingKey: Buffer | null = null;
let signingKeyIsEphemeral = false;

function getSigningKey(): Buffer {
  if (signingKey) return signingKey;
  if (env.guestSessionSecret) {
    signingKey = createHmac("sha256", "rph-guest-session").update(env.guestSessionSecret).digest();
  } else {
    signingKey = randomBytes(32);
    signingKeyIsEphemeral = true;
  }
  return signingKey;
}

export function sessionsAreEphemeral(): boolean {
  return signingKeyIsEphemeral;
}

export function digestToken(raw: string): string {
  return createHmac("sha256", getSigningKey()).update(raw).digest("hex");
}

export function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: env.guestCookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export interface IssuedSession {
  raw: string;
  digest: string;
  createdAt: number;
}

/** Mint a new random guest identity. Never derived from user input. */
export function issueSession(): IssuedSession {
  const raw = generateRawToken();
  const createdAt = Date.now();
  return { raw, digest: digestToken(raw), createdAt };
}

export function attachSessionCookie(raw: string): void {
  void (async () => {
    const store = await cookies();
    store.set(env.guestCookieName, raw, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
  })();
}

/**
 * Server Action / Route Handler path for setting the cookie.
 * `cookies().set` is only permitted in a mutating context, never during render.
 */
export async function setSessionCookie(raw: string): Promise<void> {
  const store = await cookies();
  store.set(env.guestCookieName, raw, cookieOptions(Math.floor(SESSION_TTL_MS / 1000)));
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(env.guestCookieName, "", cookieOptions(0));
}

/** Read and verify the current guest identity, or null if absent/expired. */
export async function readSession(): Promise<GuestIdentity | null> {
  const store = await cookies();
  const raw = store.get(env.guestCookieName)?.value;
  if (!raw) return null;

  const digest = digestToken(raw);
  const record = memorySessions.get(digest);
  if (!record) return null;

  if (Date.now() - record.createdAt > SESSION_TTL_MS) {
    memorySessions.delete(digest);
    return null;
  }

  record.lastSeenAt = Date.now();

  return {
    sessionId: digest,
    nickname: record.nickname,
    accent: record.accent,
    createdAt: record.createdAt,
  };
}

/** Persist/refresh the identity fields for an existing token. */
export function upsertSession(
  digest: string,
  createdAt: number,
  nickname: string,
  accent: string,
): GuestIdentity {
  const record: SessionRecord = {
    sessionId: digest,
    tokenDigest: digest,
    nickname,
    accent,
    createdAt,
    lastSeenAt: Date.now(),
  };
  memorySessions.set(digest, record);
  return { sessionId: digest, nickname, accent, createdAt };
}

export function forgetSession(digest: string): void {
  memorySessions.delete(digest);
}

/** Constant-time digest comparison. */
export function digestsMatch(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Best-effort client address, used ONLY to build a keyed rate-limit bucket.
 *
 * PRIVACY: the raw address is never stored, never returned, never logged. It is
 * immediately HMAC'd with a rotating daily salt and only the digest is used as
 * a Map key. Rotating the salt daily means the digest cannot be used to correlate
 * a visitor across days.
 *
 * ROBUSTNESS: `headers()` throws outside a request scope (tests, scripts, some
 * server-action contexts). We treat that as "no address available" and fall back
 * to the session bucket alone rather than propagating.
 */
export async function networkBucketKey(): Promise<string | null> {
  let fwd: string | null = null;
  let real: string | null = null;

  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    fwd = h.get("x-forwarded-for");
    real = h.get("x-real-ip");
  } catch {
    return null;
  }

  const raw = fwd?.split(",")[0]?.trim() || real?.trim();
  if (!raw) return null;

  const day = new Date().toISOString().slice(0, 10);
  const salt = env.guestSessionSecret ?? "ephemeral-rate-limit-salt";
  return createHmac("sha256", `rl:${day}:${salt}`).update(raw).digest("hex").slice(0, 32);
}