import type { ApplicationStatus, ComponentKey, Provenance, ResearchMapping, ResearchPaper } from "@/lib/types";

/**
 * Research library.
 *
 * ============================================================================
 * READ THIS BEFORE TRUSTING THE ENTRY COUNT
 * ============================================================================
 * Every entry in this library is an internal research/architecture record
 * documented in the corpus. No external publication is presented here as a
 * source of influence, or as something the project implemented.
 *
 * The project's own historical bibliography could NOT be established from the
 * accessible records. Rather than pad this page with plausible-looking
 * citations, the shortfall is stated plainly and the "suggest a paper" flow
 * exists to close it. That IS the finding.
 *
 * NO ENTRY ON THIS PAGE IS INVENTED. Where a field is unknown it is null or
 * says so explicitly. Where a relationship is thematic rather than historical,
 * it is labelled CONCEPTUALLY_RELATED and never "influenced".
 * ============================================================================
 */

export const bibliographyCompleteness = {
  status: "INCOMPLETE",
  verifiedExternalPublications: 0,
  statement:
    "No external publication is presented in this library. The historical bibliography of what influenced Raphael's development could not be established from the accessible records, and conceptual similarity is not evidence of historical influence or of implementation.",
  implication:
    "Do not read an empty mapping as evidence that a technique was unused. Read it as evidence that the record is missing.",
} as const;

export const researchPapers: readonly ResearchPaper[] = [

  /* ------------------------------------------------------------------ */
  /* Internal research and architecture records — documented in corpus.   */
  /* Labelled INTERNAL so they are never mistaken for external citations. */
  /* ------------------------------------------------------------------ */
  {
    id: "rec-verification-principle",
    title: "The verification principle (internal research record)",
    authors: null,
    year: 2026,
    venue: "Project internal note",
    doi: null,
    arxivId: null,
    officialUrl: null,
    publicationStatus: "INTERNAL",
    researchQuestion:
      "What keeps recurring when a verification mechanism turns out to be blind to the failure it claimed to detect?",
    keyFinding:
      "The same failure shape recurred three times: the mechanism was blind to the failure it claimed to detect, the fix relocated the trust boundary outward by one layer instead of removing it, and the new layer then needed its own identifiability test.",
    themes: ["Verification theory", "Evaluator design", "Trust boundaries"],
    components: ["MEASUREMENT_EVALUATION", "EVIDENCE_PROVENANCE"],
    provenance: "CITED_IN_RAPHAEL",
    applicationStatus: "IMPLEMENTED_AND_DOCUMENTED",
    whereApplied:
      "Directly applied as a design law. It produced the identifiability test artifacts, the positive/negative control pairs, and invariants 14-16.",
    supportingEvidence:
      "Recorded in the project's internal notes and reflected in accepted decision records and named test artifacts cited by the 2026-10-16 assessment.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
  },
  {
    id: "rec-measurement-contract",
    title: "Measurement contract: grid accounting and non-vacuity (internal record)",
    authors: null,
    year: 2026,
    venue: "Project architecture decision",
    doi: null,
    arxivId: null,
    officialUrl: null,
    publicationStatus: "INTERNAL",
    researchQuestion:
      "How can a measurement contract be designed so that it cannot manufacture authority it has not earned?",
    keyFinding:
      "Admissible denominators, explicit exclusions and a non-vacuity rule can prevent a denominator from being quietly consumed.",
    themes: ["Measurement", "Evaluation integrity", "Epistemics"],
    components: ["MEASUREMENT_EVALUATION", "EVIDENCE_PROVENANCE"],
    provenance: "CITED_IN_RAPHAEL",
    applicationStatus: "IMPLEMENTED_AND_DOCUMENTED",
    whereApplied:
      "Applied as the measurement contract underpinning the evidence graph and claim-promotion path. The assessment classified it as an asset to adapt rather than copy.",
    supportingEvidence:
      "Recorded in the 2026-10-16 assessment blueprint as adversarially reviewed within a scope-limited audit.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
  },
  {
    id: "rec-claim-ladder",
    title: "The L0-L5 claim ladder (internal record)",
    authors: null,
    year: 2026,
    venue: "Project internal note",
    doi: null,
    arxivId: null,
    officialUrl: null,
    publicationStatus: "INTERNAL",
    researchQuestion:
      "How should evidence strength be staged so a stronger claim cannot be asserted by skipping a rung?",
    keyFinding:
      "Six rungs, from evaluator correctness at the base to evidence for recursive self-improvement at the top, which is an empirical claim under a declared protocol rather than a proof of infallibility.",
    themes: ["Claim grading", "Recursive improvement", "Experimental protocol"],
    components: ["AGENT_SELF_IMPROVEMENT", "MEASUREMENT_EVALUATION"],
    provenance: "CITED_IN_RAPHAEL",
    applicationStatus: "IMPLEMENTED_AND_DOCUMENTED",
    whereApplied:
      "Applied as the project's evidence-grading spine. The assessment notes that varying data with a fixed mechanism populates a lower rung than intended.",
    supportingEvidence:
      "Recorded in project internal notes and referenced by the assessment's blueprint section as a design law to carry forward.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
  },
  {
    id: "rec-epistemic-taxonomy",
    title: "Epistemic taxonomy: verified / reported / inferred (internal record)",
    authors: null,
    year: 2026,
    venue: "Accepted architecture decision",
    doi: null,
    arxivId: null,
    officialUrl: null,
    publicationStatus: "INTERNAL",
    researchQuestion:
      "How should a system label the epistemic status of its own outputs so that a reader cannot mistake a claim for a finding?",
    keyFinding:
      "A small fixed vocabulary applied consistently — including explicit absence states — does more for honesty than a large ad-hoc one.",
    themes: ["Epistemics", "Evidence labelling", "Provenance"],
    components: ["EVIDENCE_PROVENANCE", "GOVERNANCE_GATES"],
    provenance: "CITED_IN_RAPHAEL",
    applicationStatus: "IMPLEMENTED_AND_DOCUMENTED",
    whereApplied:
      "Applied across the provenance layer, which uses explicit states for missing, unadopted-configuration and pending-ratification.",
    supportingEvidence:
      "An accepted architecture decision; classified by the assessment as a genuine methodological asset to reuse as an idea.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
  },
];

/**
 * Primary research cards.
 *
 * The project's own research and architecture records. External work that only
 * influenced planning, and reference lists consulted to audit an entry, are
 * deliberately excluded: they are presented in the secondary "Conceptual
 * influences" section instead, where a full card cannot imply that they are
 * records of the same kind as the internal entries.
 */
export const primaryResearchPapers: readonly ResearchPaper[] = researchPapers.filter(
  (p) => (p.displayTier ?? "PRIMARY") === "PRIMARY",
);


export const provenanceMeta: Record<
  Provenance,
  { label: string; tone: "cyan" | "violet" | "azure" | "slate"; meaning: string }
> = {
  CITED_IN_RAPHAEL: {
    label: "Cited in Raphael",
    tone: "cyan",
    meaning: "A development record in Raphael's corpus explicitly references this work or record.",
  },
  CITED_IN_VESPER: {
    label: "Cited in Vesper",
    tone: "azure",
    meaning: "A development record in the independent successor explicitly references this work.",
  },
  FOUNDATIONAL: {
    label: "Foundational",
    tone: "violet",
    meaning: "Background literature a reader should know, with no claim of direct influence.",
  },
  SOURCE_OF_INSPIRATION: {
    label: "Source of inspiration",
    tone: "cyan",
    meaning:
      "Read by the project owner, and specific concepts were adopted into project planning. Conceptual adoption only — not a claim that code was copied or the work implemented.",
  },
  REFERENCE_INDEX_CONSULTED: {
    label: "Reference index consulted",
    tone: "slate",
    meaning:
      "A curated list or index read while surveying the field. Listed so a reader can audit a claim independently. No concept was adopted from it.",
  },
  RELATED: {
    label: "Related",
    tone: "violet",
    meaning: "Topically related. Relationship is conceptual unless a development record says otherwise.",
  },
  CANDIDATE_SUCCESSOR: {
    label: "Candidate for successor",
    tone: "slate",
    meaning: "Proposed for investigation in follow-on work. Not yet established as used.",
  },
  CONTRASTING: {
    label: "Contrasting / critical",
    tone: "violet",
    meaning: "Challenges a design assumption or exposes a methodological weakness.",
  },
};

export const applicationStatusMeta: Record<
  ApplicationStatus,
  { label: string; tone: "cyan" | "violet" | "slate" | "amber" }
> = {
  IMPLEMENTED_AND_DOCUMENTED: { label: "Implemented & documented", tone: "cyan" },
  REFERENCED_IN_DECISION: { label: "Referenced in a decision", tone: "cyan" },
  CONCEPTUALLY_RELATED: { label: "Conceptually related — application not established", tone: "slate" },
  PROPOSED_FOR_FUTURE: { label: "Proposed for future work", tone: "violet" },
  NOT_YET_INVESTIGATED: { label: "Not yet investigated", tone: "slate" },
  CHALLENGING_EVIDENCE: { label: "Challenging evidence", tone: "violet" },
};

export const componentLabels: Record<ComponentKey, string> = {
  RUNTIME_ORCHESTRATION: "Runtime / orchestration",
  CAPABILITY_BROKER_PDP: "CapabilityBroker (PDP)",
  PEP_AUTHORIZATION: "PEP and authorization",
  EXECUTION_BOUNDARY: "Execution boundary",
  EVIDENCE_PROVENANCE: "Evidence provenance",
  MEASUREMENT_EVALUATION: "Measurement / evaluation",
  AGENT_SELF_IMPROVEMENT: "Agent planning & self-improvement",
  GOVERNANCE_GATES: "Governance gates",
  VESPER_SUCCESSOR: "Vesper (successor) research",
};

/**
 * The research-to-implementation matrix.
 *
 * Note the shape of this table: every row is either an INTERNAL project record
 * with a named artifact, or with an explicit "not established".
 * There is no row claiming an external paper was implemented, because the
 * accessible records do not support such a claim.
 */
export const researchMappings: readonly ResearchMapping[] = [
  {
    paperId: "rec-verification-principle",
    coreIdea: "A verification mechanism is never self-certifying; each trust boundary needs a planted-failure test.",
    component: "MEASUREMENT_EVALUATION",
    whereApplied: "Direct design law. Produced the identifiability test artifacts and the positive/negative control pairs.",
    evidence: "Internal research record plus accepted decision records; artifacts cited by the 2026-10-16 assessment.",
    status: "IMPLEMENTED_AND_DOCUMENTED",
  },
  {
    paperId: "rec-measurement-contract",
    coreIdea: "Grid accounting, admissible denominators and a non-vacuity rule that cannot manufacture authority.",
    component: "MEASUREMENT_EVALUATION",
    whereApplied: "Underpins the evidence graph and the claim-promotion path.",
    evidence: "Assessment blueprint classifies it as adversarially reviewed and an asset to adapt.",
    status: "IMPLEMENTED_AND_DOCUMENTED",
  },
  {
    paperId: "rec-claim-ladder",
    coreIdea: "Six graded rungs so a stronger claim cannot be asserted by skipping a weaker one.",
    component: "AGENT_SELF_IMPROVEMENT",
    whereApplied: "The project's evidence-grading spine across the research subsystem.",
    evidence: "Internal record referenced by the assessment blueprint.",
    status: "IMPLEMENTED_AND_DOCUMENTED",
  },
  {
    paperId: "rec-epistemic-taxonomy",
    coreIdea: "A small fixed label vocabulary, including explicit absence states.",
    component: "EVIDENCE_PROVENANCE",
    whereApplied: "Provenance layer states for missing, unadopted-configuration and pending-ratification.",
    evidence: "Accepted architecture decision; assessed as a genuine methodological asset.",
    status: "IMPLEMENTED_AND_DOCUMENTED",
  },
];


/**
 * Open research questions for this library.
 *
 * Labeled PROPOSED, not established. Each one restates a question the project's
 * own record raises, without pretending any of them has been answered.
 */
export const openResearchQuestions: readonly {
  id: string;
  question: string;
  rationale: string;
}[] = [
  {
    id: "RQ-1",
    question: "Which design principles measurably improve agent reliability?",
    rationale:
      "Several principles are recorded as laws, but a law that cannot be falsified cannot be shown to help. The ladder's base rung was, by the project's own account, already failed twice — invisibly to the tests meant to catch it.",
  },
  {
    id: "RQ-2",
    question: "How can evidence provenance prevent unsupported promotion of claims?",
    rationale:
      "The central thesis failed in part because a pinned anchor's claim outlived the tree it described. The anchor's bytes stayed intact; the meaning did not.",
  },
  {
    id: "RQ-3",
    question: "How can evaluation remain reproducible when the system under evaluation evolves?",
    rationale:
      "An evaluator that changes alongside its subject is not a measuring instrument. This is the question that produced the frozen-instrument drift finding.",
  },
  {
    id: "RQ-4",
    question: "How can authorization remain fail-closed across every relevant execution path?",
    rationale:
      "A fail-closed property proven only inside the canonical closure does not hold repository-wide, and the difference is exactly where the legacy plane lives.",
  },
  {
    id: "RQ-5",
    question: "What evidence would justify adopting a particular paper's technique?",
    rationale:
      "Conceptual similarity is currently the weakest link between the literature and the implementation — which is why the mapping matrix has so many rows reading 'not established'.",
  },
];