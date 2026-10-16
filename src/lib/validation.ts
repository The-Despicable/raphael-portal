import { z } from "zod";

/**
 * Server-side input validation and normalisation.
 *
 * Defence in depth, in layers:
 *   1. React escapes by default, so we never use dangerouslySetInnerHTML.
 *   2. Every user string is normalised and length-capped here, server-side.
 *   3. Control characters and zero-width/bidi-override characters are stripped,
 *      because they enable homograph and direction-spoofing impersonation in a
 *      room where identities are already pseudonymous.
 *   4. Schema parsing rejects rather than silently truncates, so the client can
 *      show a real validation message instead of storing something unintended.
 */

/** Characters that enable visual impersonation in a nickname room. */
const INVISIBLE_RE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;

/**
 * Same, but preserving TAB (U+0009) and LINE FEED (U+000A).
 *
 * This distinction matters: the single-line variant must collapse newlines, while
 * the multiline variant must keep paragraph structure. Stripping \n in both would
 * silently flatten every chat message and review body onto one line.
 */
const INVISIBLE_MULTILINE_RE =
  /[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff]/g;

/** Collapse runs of whitespace and trim. Applied after control-char stripping. */
export function normalizeText(input: string): string {
  return input
    .replace(INVISIBLE_RE, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Newline-preserving variant, for message and review bodies. */
export function normalizeMultiline(input: string): string {
  return input
    .replace(INVISIBLE_MULTILINE_RE, "")
    .replace(/\r\n/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const LIMITS = {
  nicknameMin: 2,
  nicknameMax: 24,
  messageMin: 1,
  messageMax: 800,
  reviewTitleMin: 3,
  reviewTitleMax: 120,
  reviewBodyMin: 10,
  reviewBodyMax: 4000,
  suggestionTitleMax: 200,
  suggestionIdentifierMax: 200,
  suggestionRelevanceMax: 1000,
  suggestionRationaleMax: 2000,
  assistantQuestionMax: 1000,
  /** Server page size for message history. */
  historyPageSize: 50,
  /** Max retained history returned in one response. */
  historyHardCap: 200,
} as const;

const NICKNAME_RE = /^[A-Za-z0-9][A-Za-z0-9 _.-]*$/;

export const nicknameSchema = z
  .string()
  .transform(normalizeText)
  .pipe(
    z
      .string()
      .min(LIMITS.nicknameMin, "Nickname must be at least 2 characters.")
      .max(LIMITS.nicknameMax, `Nickname must be ${LIMITS.nicknameMax} characters or fewer.`)
      .regex(
        NICKNAME_RE,
        "Use letters, numbers, spaces, dots, hyphens and underscores only. Must start with a letter or number.",
      ),
  );

export const messageSchema = z
  .string()
  .transform(normalizeMultiline)
  .pipe(
    z
      .string()
      .min(LIMITS.messageMin, "Message cannot be empty.")
      .max(LIMITS.messageMax, `Message must be ${LIMITS.messageMax} characters or fewer.`),
  );

export const reviewSchema = z.object({
  title: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(LIMITS.reviewTitleMin, "Title must be at least 3 characters.")
        .max(LIMITS.reviewTitleMax, `Title must be ${LIMITS.reviewTitleMax} characters or fewer.`),
    ),
  body: z
    .string()
    .transform(normalizeMultiline)
    .pipe(
      z
        .string()
        .min(LIMITS.reviewBodyMin, "Please write at least 10 characters.")
        .max(LIMITS.reviewBodyMax, `Review must be ${LIMITS.reviewBodyMax} characters or fewer.`),
    ),
  rating: z
    .union([z.number().int().min(1).max(5), z.null()])
    .optional()
    .transform((v) => (v === undefined ? null : v)),
  category: z.enum([
    "PROJECT_OVERVIEW",
    "ARCHITECTURE",
    "RESEARCH_LIBRARY",
    "DOCUMENTATION",
    "CONTRIBUTION_EXPERIENCE",
    "OTHER",
  ]),
  component: z
    .enum([
      "RUNTIME_ORCHESTRATION",
      "CAPABILITY_BROKER_PDP",
      "PEP_AUTHORIZATION",
      "EXECUTION_BOUNDARY",
      "EVIDENCE_PROVENANCE",
      "MEASUREMENT_EVALUATION",
      "AGENT_SELF_IMPROVEMENT",
      "GOVERNANCE_GATES",
      "VESPER_SUCCESSOR",
    ])
    .nullable()
    .optional()
    .transform((v) => (v === undefined ? null : v)),
});

export const suggestionSchema = z.object({
  title: z
    .string()
    .transform(normalizeText)
    .pipe(z.string().min(3, "Title must be at least 3 characters.").max(LIMITS.suggestionTitleMax)),
  identifier: z
    .string()
    .transform(normalizeText)
    .pipe(
      z
        .string()
        .min(3, "Provide a DOI, arXiv ID, or an official URL.")
        .max(LIMITS.suggestionIdentifierMax),
    ),
  relevance: z
    .string()
    .transform(normalizeMultiline)
    .pipe(z.string().min(10, "Describe the proposed relevance.").max(LIMITS.suggestionRelevanceMax)),
  component: reviewSchema.shape.component,
  rationale: z
    .string()
    .transform(normalizeMultiline)
    .pipe(z.string().min(10, "Explain the reasoning.").max(LIMITS.suggestionRationaleMax)),
});

export const assistantQuestionSchema = z
  .string()
  .transform(normalizeMultiline)
  .pipe(
    z
      .string()
      .min(3, "Question must be at least 3 characters.")
      .max(
        LIMITS.assistantQuestionMax,
        `Question must be ${LIMITS.assistantQuestionMax} characters or fewer.`,
      ),
  );

/** Flatten a ZodError into `{ field: firstMessage }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/**
 * Colour choices for the abstract avatar. Restricted to a fixed palette so a
 * guest cannot inject arbitrary style strings.
 */
export const ACCENTS = ["cyan", "violet", "azure", "emerald", "amber", "rose"] as const;
export type Accent = (typeof ACCENTS)[number];

export const accentSchema = z.enum(ACCENTS).catch("cyan");