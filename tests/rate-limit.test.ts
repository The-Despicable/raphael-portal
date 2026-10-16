import { describe, expect, it } from "vitest";
import { env } from "@/lib/env";
import { consume } from "@/lib/rate-limit";

/**
 * RATE LIMIT OVERRIDES
 *
 * The assistant limit is a cost control as much as an abuse control, so it is
 * settable per-deployment. Two failure modes matter and are pinned here:
 *
 *  1. A typo or garbage value must NOT silently disable a protection. It has to
 *     fall back to the built-in default.
 *  2. `0` must mean "disabled" — allow everything — and not "block everything".
 *     Getting that backwards would silently break the assistant endpoint.
 *
 * Note: an unset variable is simulated with an EMPTY STRING rather than by
 * deleting the key, because the test runner repopulates process.env from the
 * env files and a deleted key reappears.
 */
async function withAssistantLimit<T>(
  value: string | null,
  fn: () => T | Promise<T>,
): Promise<T> {
  const original = process.env.RATE_LIMIT_ASSISTANT;
  try {
    if (value === null) process.env.RATE_LIMIT_ASSISTANT = "";
    else process.env.RATE_LIMIT_ASSISTANT = value;
    // Must await: restoring the variable in `finally` before an async body
    // finishes would make the test read the wrong limit mid-run.
    return await fn();
  } finally {
    if (original === undefined) delete process.env.RATE_LIMIT_ASSISTANT;
    else process.env.RATE_LIMIT_ASSISTANT = original;
  }
}

describe("rate limit overrides", () => {
  it("ignores unparseable values and keeps the built-in limit", async () => {
    for (const bad of ["not-a-number", "-5", "", "  "]) {
      await withAssistantLimit(bad, () => {
        expect(env.rateLimitOverride("assistant")).toBeNull();
      });
    }
  });

  it("parses a valid override", async () => {
    await withAssistantLimit("0", () => expect(env.rateLimitOverride("assistant")).toBe(0));
    await withAssistantLimit("99", () => expect(env.rateLimitOverride("assistant")).toBe(99));
  });

  it("treats a limit of 0 as disabled, not as blocking everything", async () => {
    withAssistantLimit("0", async () => {
      // Far more calls than the default of 12/min would allow.
      for (let i = 0; i < 20; i++) {
        const r = await consume("assistant", null);
        expect(r.allowed).toBe(true);
      }
    });
  });

  it("still enforces the built-in default when the variable is unset", async () => {
    await withAssistantLimit("", async () => {
      let allowed = 0;
      let denied = 0;
      for (let i = 0; i < 15; i++) {
        const r = await consume("assistant", null);
        if (r.allowed) allowed++;
        else denied++;
      }
      expect(allowed).toBe(12);
      expect(denied).toBe(3);
    });
  });

  it("fails CLOSED when no session digest and no network key are available", async () => {
    // Regression: with both identity sources unavailable the old code computed
    // Math.min(...[]) === Infinity and returned allowed:true for every call,
    // i.e. NO rate limiting at all. Outside a request context there is no
    // x-forwarded-for header, which is exactly the unidentifiable case.
    await withAssistantLimit("", async () => {
      let denied = 0;
      for (let i = 0; i < 15; i++) {
        const r = await consume("assistant", null);
        if (!r.allowed) denied++;
      }
      expect(denied).toBeGreaterThan(0);
    });
  });
});