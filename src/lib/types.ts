/**
 * Shared domain types.
 *
 * Epistemic vocabulary used across the whole site:
 *   VERIFIED          — a named source inspected the primary artifact directly.
 *   DOCUMENTED        — asserted by the project; not independently re-derived here.
 *   INFERRED          — a reasoned conclusion drawn on this site.
 *   NOT_ESTABLISHED   — no source establishes it; absence of evidence, not evidence of absence.
 *
 * Every status surfaced in the UI carries one of these labels so a reader can
 * never mistake a design intent for an observed runtime property.
 */

export type EvidenceLabel =
  | "VERIFIED"
  | "DOCUMENTED"
  | "INFERRED"
  | "NOT_ESTABLISHED"
  | "NOT_PERFORMED"
  | "CONTRADICTED"
  | "UNKNOWN";

export type StatusLevel =
  "READY" | "CONDITIONAL" | "BLOCKED" | "UNKNOWN" | "NOT_VERIFIED";

export type Severity = "P0" | "P1" | "P2" | "P3";

export type BlockerType =
  | "TECH"
  | "EVIDENCE"
  | "GOVERNANCE"
  | "HISTORICAL"
  | "RISK"
  | "DEPENDENCY"
  | "CONTRADICTION";

/** How strongly a piece of research is tied to the project. */
export type Provenance =
  | "CITED_IN_RAPHAEL"
  | "CITED_IN_VESPER"
  | "FOUNDATIONAL"
  /**
   * Read by the project owner, and specific concepts were adopted into project
   * planning. Distinct from RELATED: RELATED means a thematic tie with nothing
   * adopted, whereas SOURCE_OF_INSPIRATION means something was actually taken.
   * Adoption is conceptual unless a code-level claim is separately evidenced.
   */
  | "SOURCE_OF_INSPIRATION"
  | "REFERENCE_INDEX_CONSULTED"
  | "RELATED"
  | "CANDIDATE_SUCCESSOR"
  | "CONTRASTING";

/** Whether a research idea was actually applied, and how that is known. */
export type ApplicationStatus =
  | "IMPLEMENTED_AND_DOCUMENTED"
  | "REFERENCED_IN_DECISION"
  | "CONCEPTUALLY_RELATED"
  | "PROPOSED_FOR_FUTURE"
  | "NOT_YET_INVESTIGATED"
  | "CHALLENGING_EVIDENCE";

export type ComponentKey =
  | "RUNTIME_ORCHESTRATION"
  | "CAPABILITY_BROKER_PDP"
  | "PEP_AUTHORIZATION"
  | "EXECUTION_BOUNDARY"
  | "EVIDENCE_PROVENANCE"
  | "MEASUREMENT_EVALUATION"
  | "AGENT_SELF_IMPROVEMENT"
  | "GOVERNANCE_GATES"
  | "VESPER_SUCCESSOR";

export interface ReadinessDimension {
  dimension: string;
  status: StatusLevel;
  evidence: string;
  outstandingGap: string;
  consequence: string;
  confidence: "HIGH" | "MED-HIGH" | "MED" | "LOW";
}

export interface Blocker {
  id: string;
  severity: Severity;
  type: BlockerType;
  title: string;
  whatIsKnown: string;
  whyItMatters: string;
  evidence: string;
  needed: string;
  owner: string;
  disposition: string;
}

export interface TimelineEvent {
  date: string;
  approximate: boolean;
  event: string;
  label: EvidenceLabel;
}

export interface StrategicOption {
  key: string;
  name: string;
  benefits: string;
  costs: string;
  criticalDependencies: string;
  risks: string;
  evidenceRequired: string;
  uncertainties: string;
  conditionsForSuccess: string;
  /** Weighted, illustrative. The source states this is weight-sensitive. */
  illustrativeScore: number;
}

export interface ArchNode {
  id: string;
  label: string;
  kind:
    "input" | "decision" | "enforcement" | "execution" | "evidence" | "store";
  shortDescription: string;
  inputs: string;
  outputs: string;
  documented: string;
  toVerify: string;
  sourceNote: string;
}

export interface ArchEdge {
  from: string;
  to: string;
  label: string;
}

export interface DesignPrinciple {
  id: string;
  title: string;
  summary: string;
  acceptedDecision: string;
  implementationPresence: string;
  independentlyVerified: string;
  unverifiedClaim: string;
  component: ComponentKey;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string | null;
  year: number | null;
  venue: string | null;
  /** Stable, checkable identifier. Null when genuinely unknown — never invented. */
  doi: string | null;
  arxivId: string | null;
  officialUrl: string | null;
  publicationStatus: "PEER_REVIEWED" | "PREPRINT" | "INTERNAL" | "UNKNOWN";
  researchQuestion: string;
  keyFinding: string;
  themes: readonly string[];
  components: readonly ComponentKey[];
  provenance: Provenance;
  applicationStatus: ApplicationStatus;
  /** Where the concept is documented as applied. Never a similarity claim. */
  whereApplied: string;
  supportingEvidence: string | null;
  lastVerified: string | null;
  reviewStatus: "REVIEWED" | "AWAITING_REVIEW";
  featured?: boolean;
  /**
   * Editorial placement on the research page. Undefined is treated as "PRIMARY"
   * so the internal records keep rendering as full cards unchanged.
   *
   * CONCEPTUAL_INFLUENCE marks external work that shaped planning without being
   * implemented. It belongs in the secondary influences section rather than the
   * primary grid, because a full-size card beside the project's own records
   * would imply a standing the evidence does not support.
   *
   * RELATED_SOURCE marks a reference consulted to audit another entry, not a
   * source of any adopted concept.
   */
  displayTier?: "PRIMARY" | "CONCEPTUAL_INFLUENCE" | "RELATED_SOURCE";
}

export interface ResearchMapping {
  paperId: string;
  coreIdea: string;
  component: ComponentKey;
  whereApplied: string;
  evidence: string;
  status: ApplicationStatus;
}

export interface OpenQuestion {
  id: string;
  question: string;
  rationale: string;
}

/* -------------------------------------------------------------------------- */
/* Community                                                                  */
/* -------------------------------------------------------------------------- */

export type ModerationState = "VISIBLE" | "PENDING" | "HIDDEN";

export interface GuestSessionPublic {
  nickname: string;
  accent: string;
  /** True when the nickname was chosen by the visitor; never a verified identity. */
  pseudonymous: true;
}

export interface ChatMessagePublic {
  id: string;
  nickname: string;
  accent: string;
  body: string;
  createdAt: string;
  moderation: ModerationState;
}

export type ReviewCategory =
  | "PROJECT_OVERVIEW"
  | "ARCHITECTURE"
  | "RESEARCH_LIBRARY"
  | "DOCUMENTATION"
  | "CONTRIBUTION_EXPERIENCE"
  | "OTHER";

export interface ReviewPublic {
  id: string;
  nickname: string | null;
  accent: string | null;
  rating: number | null;
  title: string;
  body: string;
  category: ReviewCategory;
  component: ComponentKey | null;
  createdAt: string;
  moderation: ModerationState;
}

export interface PaperSuggestion {
  id: string;
  title: string;
  identifier: string;
  relevance: string;
  component: ComponentKey | null;
  rationale: string;
  createdAt: string;
  reviewStatus: "AWAITING_REVIEW";
}

export interface Citation {
  docId: string;
  docTitle: string;
  section: string;
  label: EvidenceLabel;
}

export interface AssistantAnswer {
  text: string;
  citations: Citation[];
  /**
   * RETRIEVAL_ONLY  — no model provider configured; verbatim excerpts only.
   * GENERATIVE       — model answered, and cited records that were validated
   *                   against the real corpus.
   * GENERATIVE_UNGROUNDED — model answered from general knowledge. Deliberately
   *                   carries NO citations and is labelled in the UI, so an
   *                   unsupported claim can never be mistaken for a sourced one.
   */
  mode: "RETRIEVAL_ONLY" | "GENERATIVE" | "GENERATIVE_UNGROUNDED";
  notice: string | null;
}
