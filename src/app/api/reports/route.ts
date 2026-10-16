import { NextResponse } from "next/server";
import { z } from "zod";
import { getStore } from "@/lib/store";
import { readSession } from "@/lib/session";
import { consume, rateLimitHeaders } from "@/lib/rate-limit";
import { fieldErrors } from "@/lib/validation";
import { env } from "@/lib/env";


/**
 * Reporting endpoint, shared by messages, reviews and suggestions.
 *
 * Reports are stored with the REPORTER'S SESSION DIGEST only. No IP address, no
 * raw session token, no user agent, and no free-text moderation note is exposed
 * to any visitor. Reports are not published anywhere.
 */

const reportSchema = z.object({
  targetKind: z.enum(["MESSAGE", "REVIEW", "SUGGESTION"]),
  targetId: z.string().min(3).max(80),
  reason: z.string().trim().min(3, "Please give a short reason.").max(500),
});

export async function POST(request: Request) {
  const session = await readSession();

  const limit = await consume("report", session?.sessionId ?? null);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Too many reports. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const store = await getStore();
  await store.addReport({
    ...parsed.data,
    reporterDigest: session?.sessionId ?? null,
  });

  return NextResponse.json(
    {
      ok: true,
      notice: env.moderationConfigured
        ? "Report recorded. A moderator can now review it."
        : "Report recorded. Note: no moderator is currently configured for this deployment, so reports are stored but not actively triaged.",
    },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}