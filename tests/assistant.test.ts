import { describe, expect, it } from "vitest";
import { answerFromCorpus, answer, classifyModelAnswer, corpusSize, retrieve } from "@/lib/assistant";

/**
 * The assistant's central guarantee is that it cannot cite something it did not
 * retrieve. These tests pin that guarantee.
 */
describe("retrieval", () => {
  it("builds a non-trivial corpus", () => {
    expect(corpusSize).toBeGreaterThan(30);
  });

  it("finds the execution-boundary material for an exec/ question", () => {
    const hits = retrieve("Is exec/ really the only entry point for process primitives?", 4);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.docId === "arch-exec")).toBe(true);
  });

  it("finds the authority-principal blocker for an AUTH-000 question", () => {
    const hits = retrieve("What does AUTH-000 block and why is there no authority?", 4);
    expect(hits.some((h) => h.docId === "blocker-AUTH-000")).toBe(true);
  });

  it("finds the overall readiness finding", () => {
    const hits = retrieve("Why is the project NOT_READY?", 4);
    expect(hits.some((h) => /NOT_READY/.test(h.text))).toBe(true);
  });

  it("returns nothing for a question unrelated to the corpus", () => {
    const hits = retrieve("What is the weather in Osaka on Tuesday?", 4);
    expect(hits).toHaveLength(0);
  });

  it("is not fooled by a single rare but semantically empty term", () => {
    // Regression: "high" is rare enough in the corpus that IDF scored it HIGH,
    // so a bare `score > 0` filter let this question match four passages on
    // that one word. Requiring corroboration on a second content term fixes it.
    expect(retrieve("How do I bake sourdough bread at high altitude?")).toHaveLength(0);
  });

  it("keeps genuine multi-term matches that a stricter rule might discard", () => {
    const hits = retrieve("Is exec/ really the only entry point for system primitives?");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.docId === "arch-exec")).toBe(true);
  });

  it("returns nothing for an empty or stopword-only question", () => {
    expect(retrieve("", 4)).toHaveLength(0);
    expect(retrieve("the a of and", 4)).toHaveLength(0);
  });
});

describe("answerFromCorpus", () => {
  it("is retrieval-only and never claims to have generated", () => {
    const answer = answerFromCorpus("What is the canonical execution chain?");
    expect(answer.mode).toBe("RETRIEVAL_ONLY");
    expect(answer.notice).toMatch(/retrieval-only/i);
  });

  it("refuses rather than speculating when nothing matches", () => {
    const answer = answerFromCorpus("Can you recommend a restaurant in Berlin?");
    expect(answer.citations).toHaveLength(0);
    expect(answer.text).toMatch(/does not establish|No passage/i);
    expect(answer.text).toMatch(/will not speculate/i);
  });

  it("only ever returns citations drawn from the corpus", () => {
    const answer = answerFromCorpus("Why does exec/ not own every effect?");
    expect(answer.citations.length).toBeGreaterThan(0);
    for (const citation of answer.citations) {
      expect(citation.docId).toBeTruthy();
      expect(citation.docTitle).toBeTruthy();
      expect(citation.section).toBeTruthy();
      expect(["VERIFIED", "DOCUMENTED", "INFERRED", "NOT_ESTABLISHED", "NOT_PERFORMED", "CONTRADICTED", "UNKNOWN"]).toContain(
        citation.label,
      );
    }
  });

  it("does not invent a DOI or arXiv ID that is absent from the corpus", () => {
    // The corpus records no external identifier. An answer must not
    // manufacture one, so any arXiv-shaped string is a fabrication.
    const answer = answerFromCorpus("Which papers did Raphael cite?");
    const identifiers = answer.text.match(/arXiv:\d{4}\.\d{4,5}/g) ?? [];
    expect(identifiers).toHaveLength(0);
  });

  it("keeps the documented/verified distinction in quoted passages", () => {
    const answer = answerFromCorpus("What is documented about the capability broker?");
    expect(answer.text).toMatch(/\(VERIFIED\)|\(DOCUMENTED\)|\(CONTRADICTED\)/);
  });
});

/**
 * STRUCTURAL GROUNDING GATE
 *
 * These run with NO provider configured, so `answer()` takes the retrieval-only
 * path. The point being pinned is the gate itself: an unanswerable question
 * must never reach a model, so the model can never become the sole source of a
 * claim. This is enforced by refusing to call the provider, not by asking the
 * model politely in a system prompt.
 */
describe("grounding gate", () => {
  it("refuses general-knowledge questions that retrieve nothing", async () => {
    const res = await answer("What is the capital of France?");
    expect(res.mode).toBe("RETRIEVAL_ONLY");
    expect(res.citations).toHaveLength(0);
    expect(res.text).toMatch(/will not speculate|No passage/i);
    // The specific failure this gate exists to prevent.
    expect(res.text).not.toMatch(/Paris/i);
  });

  it("refuses questions with no corpus overlap at all", async () => {
    // Deliberately shares no vocabulary with any corpus passage. A question
    // that merely mentions e.g. "broker" WOULD retrieve, and answering it
    // grounded is the correct behaviour, not a leak.
    const res = await answer("How do I bake sourdough bread at high altitude?");
    expect(res.citations).toHaveLength(0);
    expect(res.text).toMatch(/will not speculate|No passage/i);
  });
});

/**
 * CITATION VALIDATION
 *
 * The blanket "refuse anything that retrieves nothing" gate was removed on
 * purpose: it refused follow-ups like "tell me in more detail" that a human
 * reads as obvious, and that made the assistant look broken. The honesty
 * guarantee moved to citation validation, which is what these tests pin.
 *
 * With a provider configured the model may now answer ANY question, so the
 * property that matters is: a citation shown to the user must correspond to a
 * record that actually exists, and an answer the model disclaimed must never
 * carry citations.
 */
describe("citation validation", () => {
  it("keeps a citation that maps to a real record", () => {
    const res = classifyModelAnswer("Ratification is blocked. [blocker-AUTH-000]");
    expect(res.mode).toBe("GENERATIVE");
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].docId).toBe("blocker-AUTH-000");
  });

  it("DROPS an id that only looks like a real one", () => {
    // Regression: the real ids are prefixed (blocker-AUTH-000). The system prompt
    // once showed "[AUTH-000]" as an example, which validated to nothing — those
    // citations were silently discarded, making grounded answers look ungrounded.
    const res = classifyModelAnswer("Blocked. [not-a-real-record]");
    expect(res.citations).toHaveLength(0);
    expect(res.mode).toBe("GENERATIVE_UNGROUNDED");
  });

  it("resolves a shortened id to the single record it can refer to", () => {
    // "[AUTH-000]" is a formatting slip for "[blocker-AUTH-000]", not a
    // fabrication. Ambiguous suffixes must still be rejected.
    const res = classifyModelAnswer("Blocked. [AUTH-000]");
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].docId).toBe("blocker-AUTH-000");
    expect(res.mode).toBe("GENERATIVE");
  });

  it("DROPS a hallucinated record id", () => {
    const res = classifyModelAnswer("It is defined in [arch-totally-invented].");
    expect(res.citations).toHaveLength(0);
    expect(res.mode).toBe("GENERATIVE_UNGROUNDED");
    // The fake marker must not survive into visible text either.
    expect(res.text).not.toMatch(/arch-totally-invented/);
  });

  it("keeps the real ids and drops the fake ones from a mixed answer", () => {
    const res = classifyModelAnswer(
      "exec/ owns the primitives [arch-exec] while [paper-does-not-exist] allegedly contradicts it.",
    );
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].docId).toBe("arch-exec");
    expect(res.text).not.toMatch(/paper-does-not-exist/);
  });

  it("strips citation markers from the prose the user reads", () => {
    const res = classifyModelAnswer("Blocked because there is no principal [blocker-AUTH-000].");
    expect(res.text).not.toMatch(/\[/);
    expect(res.text).toContain("no principal");
  });

  it("discards citations when the model disclaims them", () => {
    const res = classifyModelAnswer(
      "Not from the project records — answering from general knowledge:\n\nTLS uses a handshake. [blocker-AUTH-000]",
    );
    expect(res.mode).toBe("GENERATIVE_UNGROUNDED");
    expect(res.citations).toHaveLength(0);
    expect(res.notice).toMatch(/discarded/i);
  });

  it("treats a self-disclaimed answer as ungrounded even with no citations", () => {
    const res = classifyModelAnswer(
      "Not from the project records — answering from general knowledge:\n\nThe capital of France is Paris.",
    );
    expect(res.mode).toBe("GENERATIVE_UNGROUNDED");
    expect(res.citations).toHaveLength(0);
  });

  it("does not present an unanchored answer as sourced", () => {
    const res = classifyModelAnswer("Probably because the reviewer disagreed.");
    expect(res.mode).toBe("GENERATIVE_UNGROUNDED");
    expect(res.notice).toBeTruthy();
  });

  it("de-duplicates repeated citations", () => {
    const res = classifyModelAnswer(
      "First [blocker-AUTH-000]. Also [blocker-AUTH-000]. Again [blocker-AUTH-000].",
    );
    expect(res.citations).toHaveLength(1);
  });

  it("recognises an UNBRACKETED reference to a real record", () => {
    // Observed: the model reproduces the record header instead of citing, e.g.
    // "blocker-AUTH-000 (VERIFIED) — No authority principal exists". That is a
    // real reference and must not be mislabelled as unsourced.
    const res = classifyModelAnswer(
      "blocker-AUTH-000 (VERIFIED) — No authority principal exists.",
    );
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].docId).toBe("blocker-AUTH-000");
    expect(res.mode).toBe("GENERATIVE");
    expect(res.text).not.toMatch(/blocker-AUTH-000/);
  });

  it("does not treat an invented bare id as a citation", () => {
    const res = classifyModelAnswer("Defined in blocker-AUTH-999 somewhere.");
    expect(res.citations).toHaveLength(0);
  });

  it("strips a marker containing spaces and a label", () => {
    // Observed in the browser: the model emits "[readiness: Verification
    // maturity]", which a strict [\w.-] bracket pattern cannot match, so it
    // survived into the rendered answer as visible junk.
    const res = classifyModelAnswer(
      "Verification maturity is weak [readiness: Verification maturity] overall.",
    );
    expect(res.citations).toHaveLength(1);
    expect(res.citations[0].docId).toBe("readiness");
    expect(res.text).not.toMatch(/\[/);
  });

  it("leaves unrelated bracketed text alone", () => {
    const res = classifyModelAnswer("Set the flag to [verbose] and retry [debug].");
    expect(res.text).toContain("[verbose]");
    expect(res.text).toContain("[debug]");
    expect(res.citations).toHaveLength(0);
  });
});

/**
 * Conversational openers.
 *
 * "hi"/"hello" retrieve nothing, so the grounding gate refuses them — which is
 * correct, but indistinguishable from a broken integration to the user. They get
 * a canned orientation instead. The critical property is that this is a CLOSED
 * allowlist: an opener plus a real question must still fall through to the
 * normal grounded path, otherwise this becomes a bypass around the gate.
 */
describe("conversational openers", () => {
  it("answers a bare greeting with orientation rather than a refusal", async () => {
    const res = await answer("hello");
    expect(res.text).toMatch(/Raphael AI/);
    expect(res.text).toMatch(/will not speculate/);
    expect(res.citations).toHaveLength(0);
  });

  it("handles greetings with punctuation and casing", async () => {
    for (const q of ["Hi!", "HEY", "hello.", "thanks", "  hello  "]) {
      const res = await answer(q);
      expect(res.text).toMatch(/Raphael AI/);
    }
  });

  it("does NOT let an opener smuggle a real question past the gate", async () => {
    // The dangerous case: "hi what is the capital of France" must be refused,
    // not oriented, and must never be answered from model knowledge.
    const res = await answer("hi, what is the capital of France?");
    expect(res.text).not.toMatch(/Paris/);
  });

  it("still answers a real question that happens to start with an opener", async () => {
    const res = await answer("What does AUTH-000 block?");
    expect(res.text).not.toMatch(/^Hello\./);
  });
});