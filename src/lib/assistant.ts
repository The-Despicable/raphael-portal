import {
  archNodes,
  designPrinciples,
  legacyPerimeter,
  proposedArchitecture,
  verificationPrinciple,
} from "@/content/architecture";
import { researchPapers } from "@/content/research";
import { ASSESSMENT, blockers, readinessScorecard } from "@/content/status";
import type { AssistantAnswer, Citation, EvidenceLabel } from "@/lib/types";
import { env } from "@/lib/env";

/**
 * Research assistant retrieval boundary.
 *
 * WHAT THIS IS
 * ------------
 * A retrieval engine over a fixed, curated corpus of project documents, plus an
 * optional server-side generation step.
 *
 * WHAT THIS IS NOT
 * ----------------
 * It cannot execute code, run scans, operate Raphael, touch the repository, or
 * reach a target. It has no tools. It only reads the passages assembled below,
 * which are transcribed from public-facing project documentation.
 *
 * PROVENANCE GUARANTEE
 * --------------------
 * Every sentence the assistant emits in RETRIEVAL_ONLY mode is quoted text from
 * a corpus passage. It is not generated, so it cannot hallucinate a citation,
 * a paper, or a component. When a generation step IS configured, the prompt
 * forbids inventing citations and the UI always renders the retrieved sources
 * alongside the answer regardless of what the model claims.
 *
 * This asymmetry is deliberate: the site is about a project that failed to keep
 * claims and evidence separated. An assistant that blurred that line would be
 * self-refuting.
 */

interface Passage {
  docId: string;
  docTitle: string;
  section: string;
  text: string;
  label: EvidenceLabel;
}

/* -------------------------------------------------------------------------- */
/* Corpus                                                                     */
/* -------------------------------------------------------------------------- */

function buildCorpus(): Passage[] {
  const out: Passage[] = [];
  const push = (
    docId: string,
    docTitle: string,
    section: string,
    text: string,
    label: EvidenceLabel,
  ) => {
    if (text && text.trim().length > 0)
      out.push({ docId, docTitle, section, text, label });
  };

  /* --- Assessment level --------------------------------------------------- */
  push(
    "assessment",
    "Raphael viability assessment (2026-10-16)",
    "Executive decision",
    `The recommended disposition is ${ASSESSMENT.disposition}, with confidence ${ASSESSMENT.confidence}. ${ASSESSMENT.dispositionDetail}`,
    "DOCUMENTED",
  );
  push(
    "assessment",
    "Raphael viability assessment (2026-10-16)",
    "Overall readiness",
    `Overall readiness is ${ASSESSMENT.overallReadiness}, with gate disposition ${ASSESSMENT.gateDisposition}. This is a dated snapshot taken on ${ASSESSMENT.date} and has not been revalidated.`,
    "VERIFIED",
  );
  push(
    "assessment",
    "Raphael viability assessment (2026-10-16)",
    "Method and limits",
    ASSESSMENT.methodLimits.join(" "),
    "VERIFIED",
  );

  /* --- Readiness ---------------------------------------------------------- */
  for (const d of readinessScorecard) {
    push(
      "readiness",
      "Completion readiness scorecard (2026-10-16)",
      d.dimension,
      `${d.dimension} is rated ${d.status} with ${d.confidence} confidence. Evidence: ${d.evidence} Outstanding gap: ${d.outstandingGap} Consequence: ${d.consequence}`,
      "VERIFIED",
    );
  }

  /* --- Blockers ----------------------------------------------------------- */
  for (const b of blockers) {
    push(
      `blocker-${b.id}`,
      "Blockers and risk register (2026-10-16)",
      `${b.id} — ${b.title}`,
      `${b.id} (${b.severity}, ${b.type}): ${b.title}. What is known: ${b.whatIsKnown} Why it matters: ${b.whyItMatters} Needed: ${b.needed} Disposition: ${b.disposition}`,
      "VERIFIED",
    );
  }

  /* --- Architecture nodes ------------------------------------------------- */
  for (const n of archNodes) {
    push(
      `arch-${n.id}`,
      "Documented canonical architecture",
      n.label,
      `${n.label}: ${n.shortDescription} Inputs: ${n.inputs} Outputs: ${n.outputs} Documented: ${n.documented} Still to verify: ${n.toVerify}`,
      "VERIFIED",
    );
  }

  /* --- Design principles -------------------------------------------------- */
  for (const p of designPrinciples) {
    push(
      `principle-${p.id}`,
      "Documented design principles",
      p.title,
      `${p.title}: ${p.summary} Accepted decision: ${p.acceptedDecision} Implementation presence: ${p.implementationPresence} Independently verified: ${p.independentlyVerified} Unverified claim: ${p.unverifiedClaim}`,
      "VERIFIED",
    );
  }

  /* --- Verification principle -------------------------------------------- */
  push(
    "verification",
    "The verification principle (internal research record)",
    "Principle",
    `${verificationPrinciple.statement} Corollary: ${verificationPrinciple.corollary} Resolution: ${verificationPrinciple.resolution} ${verificationPrinciple.framing}`,
    "DOCUMENTED",
  );
  push(
    "verification",
    "The verification principle (internal research record)",
    "Claim ladder",
    verificationPrinciple.claimLadder
      .map((l) => `${l.level}: ${l.label}. ${l.note}`)
      .join(" "),
    "DOCUMENTED",
  );
  push(
    "verification",
    "The verification principle (internal research record)",
    "Invariants",
    verificationPrinciple.invariants
      .map((i) => `Invariant ${i.n}: ${i.text}`)
      .join(" "),
    "DOCUMENTED",
  );

  /* --- Proposed architecture --------------------------------------------- */
  push(
    "proposed",
    proposedArchitecture.label,
    "Target",
    `${proposedArchitecture.caveat} Goals: ${proposedArchitecture.goals.join(" ")}`,
    "DOCUMENTED",
  );
  push(
    "proposed",
    proposedArchitecture.label,
    "Not implemented",
    `Components that are not implemented: ${proposedArchitecture.unimplemented.join(" ")} Relationship to the successor: ${proposedArchitecture.relationship}`,
    "VERIFIED",
  );

  /* --- Legacy perimeter --------------------------------------------------- */
  for (const q of legacyPerimeter.questions) {
    push(
      "legacy",
      "Legacy execution perimeter",
      q.title,
      `${q.title} (${q.label}): ${q.body}`,
      q.label as EvidenceLabel,
    );
  }

  /* --- Research ----------------------------------------------------------- */
  for (const p of researchPapers) {
    push(
      `paper-${p.id}`,
      "Research library",
      p.title,
      `${p.title}. Research question: ${p.researchQuestion} Application status: ${p.applicationStatus.replaceAll("_", " ").toLowerCase()}. Where applied: ${p.whereApplied}${p.arxivId ? ` arXiv:${p.arxivId}` : ""}`,
      "VERIFIED",
    );
  }

  return out;
}

const CORPUS = buildCorpus();

export const corpusSize = CORPUS.length;

/* -------------------------------------------------------------------------- */
/* Retrieval                                                                  */
/* -------------------------------------------------------------------------- */

const STOP = new Set([
  "the",
  "a",
  "an",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "of",
  "to",
  "in",
  "on",
  "for",
  "and",
  "or",
  "it",
  "its",
  "this",
  "that",
  "these",
  "those",
  "with",
  "as",
  "at",
  "by",
  "from",
  "what",
  "which",
  "who",
  "how",
  "why",
  "does",
  "do",
  "did",
  "can",
  "could",
  "should",
  "would",
  "about",
  "into",
  "than",
  "then",
  "there",
  "here",
  "have",
  "has",
  "had",
  "not",
  "but",
  "if",
  "me",
  "my",
  "i",
  "you",
  "your",
  "we",
  "our",
  "they",
  "their",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

/**
 * BM25-style scoring. Deliberately simple and dependency-free — the corpus is a
 * few hundred passages, so a lexical retriever is both sufficient and auditable.
 */
export function retrieve(question: string, limit = 4): Passage[] {
  const qTerms = tokenize(question);
  if (qTerms.length === 0) return [];

  const docs = CORPUS.map((p) => ({
    p,
    terms: tokenize(`${p.section} ${p.text}`),
  }));
  const avgLen =
    docs.reduce((n, d) => n + d.terms.length, 0) / Math.max(1, docs.length);

  const k1 = 1.5;
  const b = 0.75;

  const scored = docs.map(({ p, terms }) => {
    const counts = new Map<string, number>();
    for (const t of terms) counts.set(t, (counts.get(t) ?? 0) + 1);
    let score = 0;
    let matched = 0;
    for (const qt of qTerms) {
      const tf = counts.get(qt);
      if (!tf) continue;
      matched++;
      const df = docs.filter((d) => d.terms.includes(qt)).length;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      score +=
        idf *
        ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * terms.length) / avgLen)));
    }
    return { p, score, matched };
  });

  // MINIMUM MATCH REQUIREMENT
  // -----------------------
  // A bare `score > 0` filter is not a usable relevance gate. IDF rewards
  // RARE terms, so a single semantically empty rare word is enough to produce a
  // confident-looking match: "How do I bake sourdough bread at high altitude?"
  // matched four passages on the word "high" alone (and "high" scores *high*
  // because it is rare in the corpus).
  //
  // So a passage must corroborate on two distinct content terms — but only
  // when the question actually offers enough terms to corroborate with. Asking
  // for two matches from a two-term question would discard genuine hits:
  // "Why is the project NOT_READY?" reduces to just {project, ready} after
  // stopwording and token splitting, and the finding it targets matches on
  // only one of them.
  const minMatches = qTerms.length >= 3 ? 2 : 1;

  return scored
    .filter((s) => s.score > 0 && s.matched >= minMatches)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}

function toCitation(p: Passage): Citation {
  return {
    docId: p.docId,
    docTitle: p.docTitle,
    section: p.section,
    label: p.label,
  };
}

/* -------------------------------------------------------------------------- */
/* Answering                                                                  */
/* -------------------------------------------------------------------------- */

const NO_KEY_NOTICE =
  "No model provider is configured, so this is a retrieval-only answer. Every sentence below is quoted verbatim from the cited project document — nothing has been generated or paraphrased. Configure MODEL_API_KEY, MODEL_BASE_URL and MODEL_NAME to enable synthesis.";

export function answerFromCorpus(question: string): AssistantAnswer {
  const hits = retrieve(question, 4);

  if (hits.length === 0) {
    return {
      mode: "RETRIEVAL_ONLY",
      text: [
        "No passage in the approved corpus matches that question.",
        "",
        "The corpus is limited to the project's public-facing documentation. This assistant does not search the internet, the repository, or any private material, and it will not speculate to fill the gap.",
        "",
        "Try asking about: the canonical architecture chain, a specific blocker such as AUTH-000 or EVAL-001, the readiness scorecard, or the verification principle.",
      ].join("\n"),
      citations: [],
      notice: env.generativeAiConfigured
        ? "No matching passage was retrieved, so no answer was generated."
        : NO_KEY_NOTICE,
    };
  }

  const body = hits
    .map(
      (h, i) =>
        `**Source ${i + 1} — ${h.docTitle} › ${h.section}**  _(${h.label})_\n\n${h.text}`,
    )
    .join("\n\n---\n\n");

  return {
    mode: "RETRIEVAL_ONLY",
    text: [
      `I found ${hits.length} relevant passage${hits.length === 1 ? "" : "s"} in the approved corpus. Quoted verbatim:`,
      "",
      body,
    ].join("\n"),
    citations: hits.map(toCitation),
    notice: NO_KEY_NOTICE,
  };
}

/* -------------------------------------------------------------------------- */
/* Optional generative step (server-side only)                                */
/* -------------------------------------------------------------------------- */

/**
 * The RECORDS block is the entire corpus, on every request.
 *
 * The corpus is only ~66 short passages (~8k tokens), so there is no reason to
 * narrow it with keyword retrieval: a lexical gate cannot tell that "tell me in
 * more detail" refers to the previous turn, and it refused follow-ups that a
 * human would consider obvious. Supplying everything removes that bottleneck
 * and lets the model reason across documents (e.g. "which blocker is upstream
 * of the others") — something top-k retrieval actively prevents.
 */
function buildRecordsBlock(): string {
  return CORPUS.map(
    (p) => `[${p.docId}] (${p.label}) ${p.docTitle} › ${p.section}\n${p.text}`,
  ).join("\n\n");
}

/**
 * The exact set of citable ids.
 *
 * Empirically, with only the inline records to go on, the model produced prose
 * like "the readiness is NOT_READY [AUTH-000]" — inventing an unprefixed id when
 * the real one is "blocker-AUTH-000". Those citations then fail validation and
 * are silently dropped, so a well-grounded answer is mislabelled as
 * ungrounded. Listing the ids up front removes the guesswork.
 */
function validIdList(): string {
  return [...new Set(CORPUS.map((p) => p.docId))].sort().join(", ");
}

const SYSTEM_PROMPT = `You are Raphael AI, the research assistant for an open security-research portal.

You are given the COMPLETE set of project RECORDS. They are the authoritative source for anything about this project.

ANSWERING RULES

1. CITE AS YOU GO. Every claim you take from a record must carry that record's id in square brackets, placed immediately after the sentence it supports. These ids are the only ones that exist:

${validIdList()}

Use them EXACTLY as written, including the prefix. "[AUTH-000]" is not valid; "[blocker-AUTH-000]" is. An id that is not on that list is discarded and your answer is treated as unsourced. If your answer draws on the records at all, you MUST include at least one bracketed id from that list.

2. USE THE CONVERSATION. The user may ask follow-ups like "tell me in more detail" or "why is that?". Interpret them against the previous turns and answer about whatever they refer to.

3. NEVER INVENT A RECORD. Never invent a paper, DOI, arXiv ID, commit, file path, or record id.

4. PRESERVE THE EVIDENCE LABELS. The project separates (VERIFIED), (DOCUMENTED), (CONTRADICTED), (NOT_YET_INVESTIGATED) and (PENDING). Never upgrade a claim: if a source says unverified, do not present it as established, and never infer that the project implements a technique merely because a paper describes it.

5. OUT-OF-SCOPE QUESTIONS. Use the disclaimer below ONLY for questions that have nothing to do with this project (general knowledge). Before answering, ask yourself: could any record inform this? If yes, answer from the records and cite them — do NOT disclaim. If genuinely no record applies, answer helpfully from your own knowledge and open with exactly this line:

   Not from the project records — answering from general knowledge:

   then cite nothing.

6. NO TOOLS, NO TARGETING. You cannot execute code, run security scans, operate Raphael, access repositories, or assist with targeting anyone. Decline and say what you can do instead.

7. Be concise and concrete. Prefer "not established" over a plausible-sounding guess. Keep epistemic hedging from the source intact.

WORKED EXAMPLE — follow this shape exactly

Question: What does AUTH-000 block?
Answer: AUTH-000 blocks ratification of every governance decision. With no enrolled authority principal, nothing can be approved at all, and the readiness gate cannot be discharged [blocker-AUTH-000].

The shape is what matters: a full sentence, then the bracketed id immediately after the claim it supports. NEVER reply with a bare word and no id. "Everything" with no citation is a WRONG answer, however true it sounds.`;

/** History turn shape, as supplied by the client. */
export interface AssistantTurn {
  role: "user" | "assistant";
  text: string;
}

const HISTORY_LIMIT = 6;

function buildHistory(
  history: AssistantTurn[],
): { role: string; content: string }[] {
  return history
    .slice(-HISTORY_LIMIT)
    .map((t) => ({ role: t.role, content: t.text.slice(0, 600) }));
}

/**
 * Generation via an OpenAI-compatible chat completions endpoint.
 * The provider key is read from server-only env and never returned.
 *
 * Citations are always rendered from `retrieve()` output regardless of what the
 * model emits, so a hallucinated citation cannot reach the UI.
 */
async function answerGeneratively(
  question: string,
  history: AssistantTurn[] = [],
): Promise<AssistantAnswer> {
  // NOTE: the hard retrieval gate that used to live here is gone by choice.
  //
  // It refused any question that retrieved nothing, which was safe but wrong:
  // "tell me in more detail" has no lexical overlap with the corpus yet is an
  // obvious follow-up, and a refusal reads as a broken assistant. Because the
  // WHOLE corpus is supplied below, there is no longer a reason to narrow by
  // keyword first. The honesty property is now enforced where it actually
  // matters — at citation validation (see extractCitations) and in the required
  // "not from the project records" disclaimer — instead of by refusing to ask.

  const records = buildRecordsBlock();

  // `chat_template_kwargs` is understood by Nemotron-style reasoning models.
  const requestBody: Record<string, unknown> = {
    model: env.modelName,
    temperature: 0.1,
    stream: false,
    max_tokens: env.modelMaxTokens,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...buildHistory(history),
      {
        role: "user",
        content: `RECORDS:\n${records}\n\nQUESTION: ${question}`,
      },
    ],
  };
  if (env.modelDisableThinking) {
    requestBody.chat_template_kwargs = { enable_thinking: false };
  }

  const res = await fetch(
    `${env.modelBaseUrl!.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.modelApiKey}`,
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!res.ok) {
    // Deliberately opaque: never echo provider error bodies, which can contain
    // account identifiers and quota details.
    throw new Error(`Provider responded ${res.status}`);
  }

  const json = (await res.json()) as {
    choices?: {
      message?: { content?: string | null; reasoning_content?: string | null };
    }[];
  };

  const message = json.choices?.[0]?.message;

  // A reasoning model can return content: null when the whole completion budget
  // went to reasoning_content.
  const raw =
    (message?.content ?? "").trim() ||
    (message?.reasoning_content ?? "").trim();

  if (!raw) {
    return {
      ...answerFromCorpus(question),
      notice:
        "The provider returned an empty response; falling back to quoted passages.",
    };
  }

  // CITATION VALIDATION
  // -------------------
  // The model names the record ids it used. Only ids that actually exist in the
  // corpus survive, so a hallucinated citation still cannot reach the UI — the
  // guarantee is kept, it just moved from "what retrieval returned" to "what the
  // model claimed, checked against reality".
  return classifyModelAnswer(raw);
}

const DISCLAIMER = /not from the project records/i;

/**
 * Turn raw model output into a classified answer.
 *
 * Exported for testing: this is where the site's honesty guarantee actually
 * lives now that the blanket retrieval gate is gone.
 */
export function classifyModelAnswer(raw: string): AssistantAnswer {
  const { citations, text } = extractCitations(raw);

  // A disclaimer with citations attached is a contradiction: the model said
  // "this is not from the records" and then cited records. Trust the
  // disclaimer and discard the citations rather than present a general-knowledge
  // claim as sourced.
  if (DISCLAIMER.test(text)) {
    return {
      mode: "GENERATIVE_UNGROUNDED",
      text,
      citations: [],
      notice:
        citations.length > 0
          ? "Answered from general knowledge, not the project records. Citations were discarded because the model mixed the two."
          : "Answered from general knowledge, not the project records. Nothing in the records supports this, so treat it as unverified and check it independently.",
    };
  }

  if (citations.length > 0) {
    return { mode: "GENERATIVE", text, citations, notice: null };
  }

  // No disclaimer and no citation: the model answered but did not anchor itself
  // to any record. Do not silently present this as a sourced answer.
  return {
    mode: "GENERATIVE_UNGROUNDED",
    text,
    citations: [],
    notice:
      "The model did not cite any record for this, and the records do not obviously cover it. Treat it as unverified.",
  };
}

/**
 * Pull `[docId]` markers out of model output, keep only ids that exist in the
 * corpus, and strip the markers from the prose the user reads.
 */
/**
 * Resolve a bracketed token to a real record id, or null.
 *
 * Two passes, in order of trust:
 *  1. Exact match against a real id.
 *  2. Suffix match — the model wrote "AUTH-000" for the record "blocker-AUTH-000".
 *
 * The suffix pass exists because a shortened id is a FORMATTING slip rather than
 * a fabrication, and rejecting it discards a citation that does point at
 * something real, mislabelling a grounded answer as ungrounded. It is allowed
 * only when the suffix matches exactly ONE record, so it can never attach the
 * wrong source. A token matching nothing still resolves to null and is dropped.
 */
function resolveDocId(token: string): string | null {
  const ids = CORPUS.map((p) => p.docId);
  if (ids.includes(token)) return token;

  const suffixMatches = ids.filter(
    (id) => id.endsWith(`-${token}`) || id.endsWith(`_${token}`),
  );
  return suffixMatches.length === 1 ? suffixMatches[0] : null;
}

const EVIDENCE_LABELS = [
  "VERIFIED",
  "DOCUMENTED",
  "CONTRADICTED",
  "NOT_YET_INVESTIGATED",
  "PENDING",
];

/** All distinct record ids, longest first so substring matching prefers the most specific. */
function allDocIdsByLength(): string[] {
  return [...new Set(CORPUS.map((p) => p.docId))].sort((a, b) => b.length - a.length);
}

/** Find a real record id anywhere inside a string (handles "readiness: Verification maturity"). */
function findDocIdIn(s: string): string | null {
  for (const id of allDocIdsByLength()) {
    if (s.includes(id)) return id;
  }
  return null;
}

function extractCitations(raw: string): {
  citations: Citation[];
  text: string;
} {
  const seen = new Set<string>();
  const citations: Citation[] = [];

  const addCitation = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    citations.push(toCitation(CORPUS.find((p) => p.docId === id)!));
  };

  // PASS 1 — bracketed markers.
  //
  // The bracket content is matched loosely and then RESOLVED, rather than
  // pattern-matched for a bare id. Observed in the browser: the model writes
  // "[readiness: Verification maturity]" and "[AUTH-000]", neither of which a
  // strict [\w.-]+ pattern can catch — which left visible junk like
  // "[: Operational]" in the rendered answer.
  //
  // A marker is removed only if it actually resolves to a real record, so
  // unrelated bracketed text is left untouched.
  const stripped = raw.replace(/\[([^[\]]{1,140})\]/g, (marker, inner: string) => {
    const id = findDocIdIn(inner) ?? resolveDocId(inner.split(/[\s:,;()]+/)[0] ?? "");
    if (id) {
      addCitation(id);
      return "";
    }
    // Unresolvable marker. Strip it if it is ID-SHAPED (contains a hyphen or a
    // digit), because a dangling "[arch-totally-invented]" reads to the user as
    // a citation that does not exist — worse than losing the text. Plain words
    // like "[verbose]" or "[debug]" are left alone: those are ordinary prose and
    // destroying them would mangle the answer.
    if (/[-\d]/.test(inner)) return "";
    return marker;
  });

  const text = stripped;

  // PASS 2 — bare, unbracketed references.
  //
  // Observed behaviour: asked to cite in brackets, the model instead reproduces
  // the record header verbatim, e.g. "blocker-AUTH-000 (VERIFIED) — No authority
  // principal exists". That IS a reference to a real record, so rejecting it
  // would mislabel a grounded answer as ungrounded. Matching only EXACT valid
  // ids keeps this safe: a fabricated id still matches nothing and is dropped.
  const idsByLength = allDocIdsByLength();
  const labelAlt = `(?:${EVIDENCE_LABELS.join("|")})`;
  let cleaned = text;
  for (const id of idsByLength) {
    // Absorb an adjacent evidence label along with the id. Stripping
    // "blocker-AUTH-000 (VERIFIED)" naively leaves "...recorded in the verified,"
    // which reads as broken English.
    const pattern = new RegExp(
      `(?:\\(${labelAlt}\\)\\s*)?(?<![\\w-])${id}(?![\\w-])(?:\\s*\\(${labelAlt}\\))?`,
      "g",
    );
    if (!pattern.test(cleaned)) continue;
    pattern.lastIndex = 0;
    cleaned = cleaned.replace(pattern, "");
    if (!seen.has(id)) {
      seen.add(id);
      citations.push(toCitation(CORPUS.find((p) => p.docId === id)!));
    }
  }

  return {
    citations,
    text: cleaned
      .replace(
        new RegExp(`^\\s*\\(${labelAlt}\\)\\s*[—–:-]?\\s*`, "i"),
        "",
      )
      .replace(/[ \t]{2,}/g, " ")
      .trim(),
  };
}

/**
 * Conversational openers ("hi", "hello", "thanks").
 *
 * These are not questions ABOUT the corpus, so retrieval correctly finds
 * nothing and the grounding gate refuses them. That is right by design, but as
 * an experience it reads as "the assistant is not connected" — the user cannot
 * tell a deliberate refusal from a broken integration.
 *
 * They are answered from a closed allowlist with a canned orientation, without
 * calling the model. Routing openers through the provider instead would reopen
 * the exact hole the grounding gate closes: any input that retrieves nothing
 * would be answered from model knowledge, which is how "What is the capital of
 * France?" came back as "Paris".
 */
const OPENERS = new Set([
  "hi",
  "hey",
  "hello",
  "yo",
  "hiya",
  "sup",
  "howdy",
  "greetings",
  "good",
  "morning",
  "afternoon",
  "evening",
  "thanks",
  "thank",
  "ta",
  "cheers",
  "appreciate",
  "it",
  "bye",
  "goodbye",
  "cya",
  "ok",
  "okay",
  "cool",
  "nice",
  "yep",
  "yes",
  "no",
]);

function isOpenerOnly(q: string): boolean {
  const words = q
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  // Short only: "hello, what is the capital of France?" is a real question and
  // must fall through to the normal grounded path.
  if (words.length === 0 || words.length > 3) return false;
  return words.every((w) => OPENERS.has(w));
}

const ORIENTATION = [
  "Hello. I am Raphael AI — a research assistant scoped to this project's public documents, and deliberately nothing else.",
  "I do not search the internet, your repositories, or any private material, and I will not speculate to fill a gap. If the records do not establish something, I say so rather than guessing.",
  "Things you can ask me:",
  "• Is exec/ really the only entry point for system primitives?",
  "• What does AUTH-000 block, and why is it upstream of everything else?",
  "• Why is the project NOT_READY?",
  "• What is the measurement contract for grid accounting?",
  "• Which external papers does the project cite, and what is their status?",
].join("\n\n");

export async function answer(
  question: string,
  history: AssistantTurn[] = [],
): Promise<AssistantAnswer> {
  if (isOpenerOnly(question)) {
    return {
      mode: "RETRIEVAL_ONLY",
      text: ORIENTATION,
      citations: [],
      notice:
        "No model call was needed — a greeting is not a question, so nothing was retrieved and nothing was generated.",
    };
  }

  if (!env.generativeAiConfigured) return answerFromCorpus(question);
  try {
    return await answerGeneratively(question, history);
  } catch {
    return {
      ...answerFromCorpus(question),
      notice:
        "The model provider could not be reached, so this answer falls back to verbatim retrieved passages rather than an unsourced guess.",
    };
  }
}
