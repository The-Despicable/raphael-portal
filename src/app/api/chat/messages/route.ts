import { NextResponse } from "next/server";
import { resolveStore } from "@/lib/store/http";
import { readSession } from "@/lib/session";
import { consume, rateLimitHeaders } from "@/lib/rate-limit";
import { fieldErrors, LIMITS, messageSchema } from "@/lib/validation";


/**
 * Public guest chat.
 *
 * - GET  returns visible history (capped server-side).
 * - POST accepts a message from an established guest session.
 *
 * The message body is stored as data and rendered as a React text node. It is
 * never evaluated, never interpolated into HTML, and never passed to any
 * command, template or tool. There are no tools on this endpoint at all.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = Number(url.searchParams.get("limit") ?? LIMITS.historyPageSize);
  const limit = Math.min(
    Math.max(Number.isFinite(requested) ? requested : LIMITS.historyPageSize, 1),
    LIMITS.historyHardCap,
  );

  const resolved = await resolveStore();
  if (!resolved.ok) return resolved.response;
  const { store } = resolved;
  const messages = await store.listMessages(limit);

  return NextResponse.json({
    messages,
    durable: store.durable,
    driver: store.kind,
  });
}

export async function POST(request: Request) {
  const session = await readSession();
  if (!session?.nickname) {
    return NextResponse.json(
      { error: "Choose a nickname before posting." },
      { status: 401 },
    );
  }

  const limit = await consume("message", session.sessionId);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `You are posting too quickly. Try again in ${limit.retryAfterSeconds}s.`,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(
    typeof payload === "object" && payload !== null ? (payload as { body?: unknown }).body : payload,
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const resolved = await resolveStore();
  if (!resolved.ok) return resolved.response;
  const { store } = resolved;
  const message = await store.addMessage({
    nickname: session.nickname,
    accent: session.accent ?? "cyan",
    body: parsed.data,
  });

  return NextResponse.json({ message }, { status: 201, headers: rateLimitHeaders(limit) });
}