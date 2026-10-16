import { describe, expect, it } from "vitest";
import {
  LIMITS,
  accentSchema,
  fieldErrors,
  messageSchema,
  nicknameSchema,
  normalizeMultiline,
  normalizeText,
  reviewSchema,
  suggestionSchema,
} from "@/lib/validation";

/**
 * These tests matter because every one of them guards a public, unauthenticated
 * endpoint. A regression here is directly exploitable by any visitor.
 */
describe("normalizeText", () => {
  it("strips zero-width and bidi-override characters used for impersonation", () => {
    // RLO + text + PDF can visually reverse a nickname.
    const spoof = "admi\u202Enistrator\u202C";
    expect(normalizeText(spoof)).toBe("administrator");
  });

  it("strips zero-width joiners and BOM", () => {
    expect(normalizeText("ev\u200baluator\uFEFF")).toBe("evaluator");
  });

  it("strips control characters", () => {
    expect(normalizeText("he\u0000llo\u0007 world")).toBe("hello world");
  });

  it("collapses whitespace runs", () => {
    expect(normalizeText("  a   b  ")).toBe("a b");
  });
});

describe("normalizeMultiline", () => {
  it("preserves paragraph breaks but caps them at two", () => {
    expect(normalizeMultiline("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("normalises CRLF", () => {
    expect(normalizeMultiline("a\r\nb")).toBe("a\nb");
  });
});

describe("nicknameSchema", () => {
  it("accepts a reasonable nickname", () => {
    expect(nicknameSchema.parse("evaluator_01").length).toBeGreaterThan(0);
  });

  it("rejects too-short names", () => {
    expect(nicknameSchema.safeParse("a").success).toBe(false);
  });

  it("rejects names over the cap", () => {
    expect(nicknameSchema.safeParse("x".repeat(LIMITS.nicknameMax + 1)).success).toBe(false);
  });

  it("rejects names starting with punctuation", () => {
    expect(nicknameSchema.safeParse("-admin").success).toBe(false);
  });

  it("rejects angle brackets and other markup characters", () => {
    expect(nicknameSchema.safeParse("<script>").success).toBe(false);
    expect(nicknameSchema.safeParse("a>b").success).toBe(false);
  });

  it("rejects slashes and path separators", () => {
    expect(nicknameSchema.safeParse("../etc").success).toBe(false);
  });
});

describe("messageSchema", () => {
  it("accepts ordinary prose", () => {
    expect(messageSchema.parse("The weld ledger contradicts itself — worth a look.")).toContain("weld");
  });

  it("rejects an empty message", () => {
    expect(messageSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects a message over the cap", () => {
    expect(messageSchema.safeParse("x".repeat(LIMITS.messageMax + 1)).success).toBe(false);
  });

  it("stores markup as inert text rather than throwing it away", () => {
    // React escapes on render, so the value is safe to keep verbatim. What must
    // never happen is this string reaching an HTML sink.
    const parsed = messageSchema.parse("<img src=x onerror=alert(1)>");
    expect(parsed).toContain("<img");
  });
});

describe("reviewSchema", () => {
  const valid = {
    title: "Architecture page is clear",
    body: "The documented-versus-verified split made this much easier to audit.",
    category: "ARCHITECTURE" as const,
  };

  it("accepts a valid review with no rating", () => {
    const parsed = reviewSchema.parse(valid);
    expect(parsed.rating).toBeNull();
    expect(parsed.component).toBeNull();
  });

  it("accepts an optional rating at both bounds", () => {
    expect(reviewSchema.parse({ ...valid, rating: 1 }).rating).toBe(1);
    expect(reviewSchema.parse({ ...valid, rating: 5 }).rating).toBe(5);
  });

  it("rejects a rating outside 1-5", () => {
    expect(reviewSchema.safeParse({ ...valid, rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(reviewSchema.safeParse({ ...valid, category: "EVERYTHING_IS_GREAT" }).success).toBe(false);
  });

  it("rejects a body below the minimum", () => {
    expect(reviewSchema.safeParse({ ...valid, body: "no" }).success).toBe(false);
  });

  it("rejects an over-long body", () => {
    expect(reviewSchema.safeParse({ ...valid, body: "x".repeat(LIMITS.reviewBodyMax + 1) }).success).toBe(false);
  });
});

describe("suggestionSchema", () => {
  it("requires a resolvable identifier so entries stay checkable", () => {
    const base = {
      title: "A relevant paper",
      relevance: "It addresses evaluator identifiability.",
      rationale: "Worth checking against the measurement contract.",
    };
    expect(suggestionSchema.safeParse({ ...base, identifier: "" }).success).toBe(false);
    expect(suggestionSchema.safeParse({ ...base, identifier: "2301.00001" }).success).toBe(true);
  });
});

describe("accentSchema", () => {
  it("falls back to cyan for an unknown value instead of accepting it", () => {
    // An unvalidated accent string would become an inline style. The palette is
    // closed so that cannot happen.
    expect(accentSchema.parse("chartreuse")).toBe("cyan");
    expect(accentSchema.parse("violet")).toBe("violet");
  });
});

describe("fieldErrors", () => {
  it("flattens issues to a single message per field", () => {
    const result = reviewSchema.safeParse({ title: "", body: "", category: "NOPE" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = fieldErrors(result.error);
      expect(Object.keys(fields).length).toBeGreaterThan(0);
      for (const message of Object.values(fields)) {
        expect(typeof message).toBe("string");
      }
    }
  });
});