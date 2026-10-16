import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { ACCENTS, accentSchema, fieldErrors, nicknameSchema } from "@/lib/validation";
import {
  clearSessionCookie,
  forgetSession,
  issueSession,
  readSession,
  setSessionCookie,
  upsertSession,
} from "@/lib/session";
import { consume, RULES, rateLimitHeaders } from "@/lib/rate-limit";


/**
 * POST   — join the room with a chosen nickname. No registration of any kind.
 * PATCH  — change the display name on an existing session.
 * DELETE — leave the room and forget the session.
 * GET    — read the current identity, if any.
 *
 * Note: `export const dynamic` is intentionally absent. This project sets
 * `cacheComponents: true`, under which that segment option no longer exists.
 * Every handler here reads request-time state (cookies), which already forces
 * dynamic rendering.
 */

const joinSchema = z.object({
  nickname: nicknameSchema,
  accent: accentSchema,
});

const PSEUDONYMOUS_NOTICE =
  "This nickname is a pseudonym, not a verified identity. It is not reserved globally — another visitor may use the same display name from another device or after clearing their browser.";

export async function POST(request: Request) {
  const existing = await readSession();

  const limit = await consume("join", existing?.sessionId ?? null);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many join attempts. Please wait a moment before trying again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = joinSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { nickname, accent } = parsed.data;

  // Two cases:
  //  1. An established session already has a nickname -> keep the same session
  //     (and therefore the same cookie) and just update the display fields.
  //  2. No session, or a session with no nickname yet -> mint a fresh identity.
  //
  // Case 2 mints rather than re-signs because only the HMAC digest of the raw
  // token is persisted; the raw value is never recoverable server-side, by
  // design. A page refresh mid-join therefore yields a new session, which is
  // harmless because no messages were attributed to it yet.
  if (existing && existing.nickname) {
    const identity = upsertSession(existing.sessionId, existing.createdAt, nickname, accent);
    return NextResponse.json(
      {
        identity: {
          nickname: identity.nickname,
          accent: identity.accent,
          pseudonymous: true as const,
        },
        notice: PSEUDONYMOUS_NOTICE,
        limits: RULES.message,
      },
      { headers: rateLimitHeaders(limit) },
    );
  }

  const issued = issueSession();
  await setSessionCookie(issued.raw);
  const identity = upsertSession(issued.digest, issued.createdAt, nickname, accent);

  return NextResponse.json(
    {
      identity: {
        nickname: identity.nickname,
        accent: identity.accent,
        pseudonymous: true as const,
      },
      notice: PSEUDONYMOUS_NOTICE,
      limits: RULES.message,
      sessionsEphemeral: env.isProduction,
    },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}

export async function PATCH(request: Request) {
  const session = await readSession();
  if (!session?.nickname) {
    return NextResponse.json({ error: "No active guest session." }, { status: 401 });
  }

  const limit = await consume("rename", session.sessionId);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many name changes. Please wait before trying again." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = joinSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const identity = upsertSession(
    session.sessionId,
    session.createdAt,
    parsed.data.nickname,
    parsed.data.accent,
  );

  return NextResponse.json({
    identity: { nickname: identity.nickname, accent: identity.accent, pseudonymous: true as const },
  });
}

export async function GET() {
  const session = await readSession();
  if (!session?.nickname) return NextResponse.json({ identity: null });
  return NextResponse.json({
    identity: {
      nickname: session.nickname,
      accent: session.accent,
      pseudonymous: true as const,
    },
  });
}

export async function DELETE() {
  const session = await readSession();
  if (session) forgetSession(session.sessionId);
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

/** Exposed so the join panel can render the palette from one source. */
export { ACCENTS };