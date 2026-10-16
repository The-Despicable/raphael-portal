import { NextResponse } from "next/server";
import { z } from "zod";
import { timingSafeEqual } from "node:crypto";
import { getStore } from "@/lib/store";
import { env } from "@/lib/env";
import { fieldErrors } from "@/lib/validation";

/**
 * Moderation administration.
 *
 * SEPARATE FROM /api/reports ON PURPOSE
 * -------------------------------------
 * Reporting is a public, unauthenticated action ("this message is bad").
 * Moderating is a privileged one ("hide this message"). Keeping them on
 * separate routes means the privileged surface can be audited, rate-limited
 * and locked down without touching the public path, and a mistake in one
 * cannot silently grant the other's capability.
 *
 * ACCESS CONTROL
 * --------------
 * Requires MODERATION_KEY in a header — never a query string, so it cannot
 * leak via logs, referrers or browser history. When the key is unset the
 * endpoint refuses EVERY request rather than falling back to a default
 * credential or an unauthenticated path.
 */
const moderateSchema = z.object({
  targetKind: z.enum(["REVIEW", "MESSAGE"]),
  targetId: z.string().min(3).max(80),
  state: z.enum(["VISIBLE", "HIDDEN"]),
});

function authorised(request: Request): boolean {
  if (!env.moderationConfigured) return false;
  const supplied = request.headers.get("x-moderation-key") ?? "";
  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(env.moderationKey!, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function PATCH(request: Request) {
  if (!env.moderationConfigured) {
    return NextResponse.json(
      {
        error: "Moderation administration is not configured for this deployment.",
        remediation:
          "Set MODERATION_KEY in the server environment to enable this endpoint. Until then, reviews are held as PENDING and are not publicly listed.",
      },
      { status: 501 },
    );
  }

  if (!authorised(request)) {
    return NextResponse.json({ error: "Invalid moderation credential." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = moderateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fields: fieldErrors(parsed.error) },
      { status: 422 },
    );
  }

  const store = await getStore();
  const updated = await store.setModeration(
    parsed.data.targetKind,
    parsed.data.targetId,
    parsed.data.state,
  );

  return NextResponse.json({ ok: true, updated });
}

/** Capability probe. Never returns the key, only whether one is configured. */
export async function GET() {
  return NextResponse.json({
    configured: env.moderationConfigured,
    status: env.moderationConfigured ? "ready" : "not_configured",
    note: env.moderationConfigured
      ? "Send MODERATION_KEY in the x-moderation-key header."
      : "No moderator is configured. Reviews are held as PENDING and are not publicly listed.",
  });
}