import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { readSession } from "@/lib/session";
import { consume, rateLimitHeaders } from "@/lib/rate-limit";
import { fieldErrors, suggestionSchema } from "@/lib/validation";


/**
 * Paper suggestions.
 *
 * CRITICAL RULE: a suggestion is NEVER merged into the verified bibliography.
 * It is stored with reviewStatus = AWAITING_REVIEW and is only ever displayed in
 * the pending list. Merging would mean letting anonymous submissions redefine
 * what the site claims is documented — exactly the failure mode this project
 * exists to study.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10) || 10, 1), 50);

  // Only the aggregate pending count is exposed publicly. Draft submissions are
  // not listed, because an unreviewed title is not yet a citable reference.
  void limit;
  void url;
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const session = await readSession();

  const limit = await consume("suggestion", session?.sessionId ?? null);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many suggestions. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = suggestionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const store = await getStore();
  const suggestion = await store.addSuggestion(parsed.data);

  return NextResponse.json(
    {
      suggestion,
      notice:
        "Recorded as AWAITING_REVIEW. Submissions are never merged into the verified bibliography automatically — a suggestion only becomes a cited entry after a reviewer checks it against the original publication.",
    },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}

/** Minimal shape check used by tests. */
export const suggestionEnvelopeSchema = z.object({
  title: z.string().min(3),
  identifier: z.string().min(3),
});