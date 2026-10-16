import { NextResponse } from "next/server";
import { answer, corpusSize, type AssistantTurn } from "@/lib/assistant";
import { readSession } from "@/lib/session";
import { consume, rateLimitHeaders } from "@/lib/rate-limit";
import { assistantQuestionSchema, fieldErrors } from "@/lib/validation";
import { env } from "@/lib/env";

/**
 * AI research assistant endpoint.
 *
 * SEPARATION OF CONCERNS
 * ----------------------
 * This endpoint is completely separate from the guest community chat. No chat
 * message ever reaches it, no chat message is ever answered by it, and it holds
 * no tools. A visitor cannot use the community room to operate this assistant.
 *
 * CREDENTIALS
 * -----------
 * The model provider key is read from server-only environment variables and is
 * never present in the response, the request, or any client bundle.
 *
 * CITATIONS
 * ---------
 * Citations are computed from server-side retrieval, not from the model's own
 * output. A model that invents a source therefore cannot get it rendered.
 */

export async function POST(request: Request) {
  const session = await readSession();

  const limit = await consume("assistant", session?.sessionId ?? null);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `Too many questions. Try again in ${limit.retryAfterSeconds}s.`,
        retryAfterSeconds: limit.retryAfterSeconds,
      },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const question =
    typeof payload === "object" && payload !== null
      ? (payload as { question?: unknown }).question
      : payload;

  const parsed = assistantQuestionSchema.safeParse(question);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields.",
        fields: fieldErrors(parsed.error),
      },
      { status: 422 },
    );
  }

  // Conversation history, so follow-ups like "tell me in more detail" can be
  // resolved. It is assistant-panel history ONLY — community chat messages are
  // never read here, keeping the two strictly separate.
  const rawHistory =
    typeof payload === "object" && payload !== null
      ? (payload as { history?: unknown }).history
      : undefined;

  const history: AssistantTurn[] = Array.isArray(rawHistory)
    ? rawHistory
        .slice(-12)
        .map((t) => {
          const o = t as { role?: unknown; text?: unknown };
          return {
            role:
              o?.role === "assistant"
                ? ("assistant" as const)
                : ("user" as const),
            text: typeof o?.text === "string" ? o.text.slice(0, 1000) : "",
          };
        })
        .filter((t) => t.text.trim().length > 0)
    : [];

  // Non-streaming: correctness of attribution matters more than latency here,
  // and a fully-assembled answer lets the UI render sources and answer together.
  const result = await answer(parsed.data, history);

  return NextResponse.json(
    {
      ...result,
      corpusSize,
      capabilities: env.describeCapabilities(),
      ...(env.modelDebugRaw ? { __raw: await readRaw(parsed.data, history) } : {}),
    },
    { headers: rateLimitHeaders(limit) },
  );
}

/**
 * Debug-only second call used to inspect raw model output.
 *
 * Only reachable when MODEL_DEBUG_RAW is set in the SERVER environment. It
 * exists because citation parsing cannot be reasoned about reliably from the
 * classified result alone: an answer can be correct yet wrongly labelled, and
 * the only way to tell why is to see what the model actually emitted.
 */
async function readRaw(question: string, history: AssistantTurn[]): Promise<string> {
  try {
    const mod = await import("@/lib/assistant");
    return (await mod.__debugRaw(question, history)).slice(0, 1200);
  } catch (e) {
    return `debug unavailable: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

/** Capability probe so the UI can show an honest configuration state. */
export async function GET() {
  return NextResponse.json({
    corpusSize,
    capabilities: env.describeCapabilities(),
    guarantees: [
      "Answers are grounded in a fixed corpus of project documents.",
      "Citations are validated against the real corpus, so an invented source cannot be shown.",
      "Questions the records do not cover are still answered, but labelled as general knowledge with no citations.",
      "The assistant has no tools: it cannot execute code, scan, or operate Raphael.",
      "It is separate from the community chat and never sees chat messages.",
    ],
  });
}
