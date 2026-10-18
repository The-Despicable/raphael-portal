import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveStore } from "@/lib/store/http";
import { deliverSuggestion } from "@/lib/notify/telegram";
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

  // Two INDEPENDENT delivery paths, and neither may mask the other:
  //
  //   1. a durable record in the store   — only possible when storage is configured
  //   2. an outbound notification        — only possible when Telegram is configured
  //
  // They are deliberately not chained. This deployment has no database, so if the
  // store write gated the notification then nothing would ever be delivered — the
  // form would look broken while claiming the opposite. The notification is what
  // makes "awaiting review" true here; the store record is a convenience that
  // exists when a database does.
  //
  // Only what actually happened is reported. A storage outage is never presented
  // as a successful save.
  const resolved = await resolveStore();
  let recorded = false;
  if (resolved.ok) {
    try {
      await resolved.store.addSuggestion(parsed.data);
      recorded = true;
    } catch {
      // A mid-write failure is a storage outage, not a client error.
      recorded = false;
    }
  }

  const notified = await deliverSuggestion({
    title: parsed.data.title,
    identifier: parsed.data.identifier,
    relevance: parsed.data.relevance,
    component: String(parsed.data.component ?? "unspecified"),
    rationale: parsed.data.rationale,
  });

  // Nothing at all worked: report the storage failure verbatim when we have one,
  // otherwise a generic refusal. Either way nothing was kept or delivered.
  if (!recorded && !notified.delivered) {
    if (!resolved.ok) return resolved.response;
    return NextResponse.json(
      {
        error:
          "Could not record or deliver the suggestion. Nothing was saved or sent.",
      },
      { status: 503, headers: { "Retry-After": "30" } },
    );
  }

  const notice = notified.delivered
    ? "Delivered for review. Submissions are never merged into the verified bibliography automatically — a suggestion only becomes a cited entry after a reviewer checks it against the original publication."
    : "Recorded for review, but automatic notification is not configured on this deployment, so no alert was sent. Submissions are never merged into the verified bibliography automatically.";

  return NextResponse.json(
    { recorded, notified: notified.delivered, notice },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}

/** Minimal shape check used by tests. */
export const suggestionEnvelopeSchema = z.object({
  title: z.string().min(3),
  identifier: z.string().min(3),
});