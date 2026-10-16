import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { readSession } from "@/lib/session";
import { consume, isDuplicateSubmission, rateLimitHeaders, recordSubmission } from "@/lib/rate-limit";
import { fieldErrors, reviewSchema } from "@/lib/validation";
import { env } from "@/lib/env";


/**
 * Public reviews and feedback.
 *
 * PROVENANCE RULE
 * ---------------
 * Reviews are USER-GENERATED. They are never presented as scientific
 * validation, an official position, or an endorsement. The UI labels every
 * review as visitor feedback, and no aggregate score is ever computed and shown
 * as if it were a project metric.
 *
 * MODERATION STATE
 * ----------------
 * With MODERATION_KEY configured, submissions publish immediately and can be
 * hidden later. Without it, submissions are held as PENDING and are not publicly
 * listed, because publishing unreviewed text with no operator to remove it
 * would be the worse failure.
 */

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 10) || 10, 1), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? 0) || 0, 0);

  const store = await getStore();
  const page = await store.listReviews(limit, offset, true);

  return NextResponse.json({
    ...page,
    moderationConfigured: env.moderationConfigured,
    notice: env.moderationConfigured
      ? null
      : "No moderator is configured, so submissions are held for review and not publicly listed yet.",
  });
}

export async function POST(request: Request) {
  const session = await readSession();

  const limit = await consume("review", session?.sessionId ?? null);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many submissions. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const { title, body, rating, category, component } = parsed.data;

  // Duplicate control is scoped to the guest session when one exists, so two
  // different visitors may legitimately submit identical wording.
  if (session?.sessionId && isDuplicateSubmission(session.sessionId, title, body)) {
    return NextResponse.json(
      { error: "You have already submitted this exact review. Edit it rather than duplicating." },
      { status: 409 },
    );
  }

  const store = await getStore();
  const moderation = env.moderationConfigured ? "VISIBLE" : "PENDING";

  const review = await store.addReview({
    // The guest's nickname is shown only where they are told it will be.
    nickname: session?.nickname ?? null,
    accent: session?.accent ?? null,
    rating,
    title,
    body,
    category,
    component,
    moderation,
  });

  if (session?.sessionId) recordSubmission(session.sessionId, title, body);

  return NextResponse.json(
    {
      review,
      moderation,
      published: moderation === "VISIBLE",
      notice:
        moderation === "VISIBLE"
          ? "Thanks — your review is published. It is labelled as visitor feedback, not validation."
          : "Thanks — your review has been received and is awaiting moderation. It is not publicly visible yet, because no moderator is configured for this deployment.",
    },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}

export const reportSchema = z.object({
  targetKind: z.enum(["MESSAGE", "REVIEW", "SUGGESTION"]),
  targetId: z.string().min(3).max(80),
  reason: z.string().min(3).max(500),
});