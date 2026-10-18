import type { ApplicationStatus, ComponentKey, Provenance, ResearchMapping, ResearchPaper } from "@/lib/types";

/**
 * Research library.
 *
 * ============================================================================
 * READ THIS BEFORE TRUSTING THE ENTRY COUNT
 * ============================================================================
 * The accessible project records name exactly ONE external publication:
 * Dream-RSI. Everything else in this library is either
 *   (a) an internal research/architecture record documented in the corpus, or
 *   (b) a reference index that was consulted, clearly labelled as such.
 *
 * Dream-RSI is a SOURCE OF INSPIRATION: the master roadmap records a narrow,
 * deliberate adoption of concepts (section 19.3 and appendix B.2). That is
 * conceptual adoption — no code was copied and no dependency exists. It is NOT
 * a claim that Raphael implemented the paper or reproduced its results.
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
  verifiedExternalPublications: 1,
  statement:
    "The accessible project records name exactly one external publication, Dream-RSI, which the roadmap records as a deliberately narrow source of inspiration. The historical bibliography of what influenced Raphael's development could not be established, and conceptual similarity or conceptual adoption is not evidence of historical influence or of implementation.",
  implication:
    "Do not read an empty mapping as evidence that a technique was unused. Read it as evidence that the record is missing.",
} as const;

export const researchPapers: readonly ResearchPaper[] = [
  {
    id: "dream-rsi",
    title: "Dream-RSI",
    // Author names and ordering transcribed from the arXiv record's own
    // publication metadata, which lists all 17. Recorded in full rather than
    // abbreviated, so a reader can check the list against the source instead of
    // trusting a shortened form that looks equally authoritative.
    authors:
      "Tong Zheng, Xidong Wu, Zheng Zhang, Zhankui He, Chaoyi Zhang, Benjamin Coleman, Ruoqiao Wei, Di Bai, Haolin Liu, Rui Liu, Xue Wang, Yue Zhuan, Wang-Cheng Kang, Renkai Xiang, Heng Huang, Xinwu Cheng, Yunsong Guo",
    year: 2026,
    venue: "arXiv preprint",
    doi: null,
    arxivId: "2609.14858",
    officialUrl: "https://arxiv.org/abs/2609.14858",
    publicationStatus: "PREPRINT",
    researchQuestion:
      "Whether an agent can be improved by having it re-experience its own historical discovery traces — reusing recorded exploration rather than generating fresh trials.",
    keyFinding:
      "Not established here. This site reports a structural concern recorded in the project's internal notes — that the replay is structurally one-sided — not the paper's own conclusions.",
    themes: ["Recursive self-improvement", "Trace reuse", "Exploration policy"],
    components: ["AGENT_SELF_IMPROVEMENT", "MEASUREMENT_EVALUATION"],
    provenance: "SOURCE_OF_INSPIRATION",
    applicationStatus: "REFERENCED_IN_DECISION",
    whereApplied:
      "Adopted as inspiration at the planning level, not as code. The master roadmap (section 19.3, 'Dream-RSI boundary adopted by Raphael') records a deliberately narrow adoption: improve the exploration policy rather than the protected agent/evaluator, reuse completed history as a replay world, evaluate candidate policies cheaply offline, and retain the accepted policy for a later round. No code was copied and no dependency exists.",
    supportingEvidence:
      "Adoption is recorded in the project roadmap (section 19.3, 'Dream-RSI boundary adopted by Raphael', and appendix B.2), which also lists what was explicitly NOT adopted: no copied code, no assumption that the Arena is already replay, no assumption that replay alone proves future improvement. That roadmap sits in an integrity-checked archive whose recorded audited baseline re-verifies exactly as it was recorded, so the adoption record is authenticated as a record. Separately, two supporting facts come only from unsourced internal notes — that the associated repository is empty, and Dream-RSI's absence from the public index — and they are not independently authenticated; the site's provenance record classifies them accordingly. Conceptual adoption is not implementation, and authenticating the record of adoption does not implement, validate or reproduce the paper's method.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
    featured: true,
    // Presented in the secondary "Conceptual influences" section, not the primary
    // card grid. It shaped planning — specifically the exploration policy — but no
    // code was copied and no dependency was introduced, so a full-size research
    // card would overstate it. The arXiv link is retained there.
    displayTier: "CONCEPTUAL_INFLUENCE",
  },
  {
    id: "awesome-rsi-index",
    title: "awesome-rsi — a public index of recursive self-improvement research",
    authors: null,
    year: null,
    venue: "GitHub curated list",
    doi: null,
    arxivId: null,
    officialUrl: "https://github.com/lobehub/awesome-rsi",
    publicationStatus: "UNKNOWN",
    researchQuestion:
      "Which published work concerns recursive self-improvement? Not itself a research contribution — a discovery aid.",
    keyFinding:
      "Not applicable. This entry is an index, listed so a reader can independently audit the Dream-RSI provenance claim rather than trusting this site.",
    themes: ["Recursive self-improvement", "Survey", "Discovery aid"],
    components: ["AGENT_SELF_IMPROVEMENT"],
    provenance: "REFERENCE_INDEX_CONSULTED",
    applicationStatus: "CONCEPTUALLY_RELATED",
    whereApplied:
      "Not applied, and no concept was adopted from it. Consulted as reference material while reading recursive-self-improvement literature, and used only to cross-check one recorded fact about the Dream-RSI entry.",
    supportingEvidence:
      "Project notes record this list at 226 entries with Dream-RSI not listed. Treat the entry count as recorded, not independently re-counted by this site. Being listed here as a reference index consulted is not a claim that it influenced anything.",
    lastVerified: "2026-10-16",
    reviewStatus: "REVIEWED",
    // A discovery aid consulted only to cross-check one recorded fact about the
    // Dream-RSI entry. Not an influence and not a source of an adopted concept,
    // so it is kept as a compact provenance note rather than a research card.
    displayTier: "RELATED_SOURCE",
  },

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

/** External work that shaped planning without being implemented. */
export const conceptualInfluences: readonly ResearchPaper[] = researchPapers.filter(
  (p) => p.displayTier === "CONCEPTUAL_INFLUENCE",
);

/** References consulted to audit another entry. Not a source of any concept. */
export const relatedSources: readonly ResearchPaper[] = researchPapers.filter(
  (p) => p.displayTier === "RELATED_SOURCE",
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
 * with a named artifact, or Dream-RSI with an explicit "not established".
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
  {
    paperId: "dream-rsi",
    coreIdea: "Reusing an agent's own historical discovery traces to drive further exploration.",
    component: "AGENT_SELF_IMPROVEMENT",
    // CORRECTED 2026-10-18. This row previously read "NOT APPLIED. No
    // development record establishes that Raphael used this work" with status
    // NOT_YET_INVESTIGATED, which contradicted researchPapers[dream-rsi]
    // (SOURCE_OF_INSPIRATION / REFERENCED_IN_DECISION), the dreamRsiFeature
    // block, and the roadmap record — and both renderings were visible on this
    // page at once. The paper-level record is the correct one: concepts were
    // adopted into planning, and no code was ever copied.
    whereApplied:
      "CONCEPTUALLY ADOPTED IN PLANNING, NOT IMPLEMENTED. The master roadmap (section 19.3 and appendix B.2) records a deliberately narrow adoption of specific ideas into the exploration policy. No code was copied and no dependency exists.",
    evidence:
      "Recorded adoption in the project roadmap, section 19.3 and appendix B.2, which also lists what was explicitly not adopted. The source is an arXiv preprint; no independent verification of its method, and none of any claimed adoption, was performed.",
    status: "REFERENCED_IN_DECISION",
  },
  {
    paperId: "awesome-rsi-index",
    coreIdea: "A public index of recursive-self-improvement work, used here as an independent audit trail.",
    component: "AGENT_SELF_IMPROVEMENT",
    whereApplied: "Used only to cross-check one recorded fact about the Dream-RSI entry.",
    evidence:
      "Internal notes record the list at 226 entries with Dream-RSI absent. The absence was checked directly against the published index and confirmed. Treat the entry count as recorded, not independently re-counted by this site.",
    status: "CONCEPTUALLY_RELATED",
  },
];

export const dreamRsiFeature = {
  treatment: "SOURCE OF INSPIRATION / CONCEPTUALLY ADOPTED, NOT IMPLEMENTED",
  headline:
    "Dream-RSI is the one external publication the records name — adopted as inspiration at the planning level, never as code",
  honestyNote:
    "The master roadmap records a deliberately narrow adoption: the exploration policy became an explicit meta-level improvement target, and completed discovery history was adopted as a replay world. No code was copied and no dependency exists, so this is not a claim that Raphael implemented the paper or reproduced its findings.",
  adoptedConcepts: [
    "Improve the exploration policy, not the protected agent/evaluator.",
    "Reuse completed history as a replay world.",
    "Evaluate many candidate policies cheaply offline.",
    "Retain the accepted policy for a later round.",
  ],
  notAdopted: [
    "No code copied, and no dependency on the published artifact.",
    "No assumption that Raphael's Arena already constitutes replay.",
    "No assumption that replay alone proves future improvement.",
    "No assumption that Raphael should make the full agent or evaluator self-modifiable.",
  ],
  structuralConcern: {
    summary: "A one-sided replay, recorded in the project's internal notes",
    detail:
      "The notes record that the associated repository was empty with no code ever committed, and that the published replay is structurally one-sided: child selection returns the earliest-created child, and replay hard-caps the width and resource counters at the values recorded in the trace. On that description the replay can reward a policy for spending less while remaining largely blind to discovering more.",
    caveat:
      "This is a reading recorded in internal project notes, not a peer-reviewed critique, and this site has not independently re-derived it against the published artifact. It is offered as a hypothesis to check, which is the appropriate epistemic status for a concern about a preprint. Note that the roadmap's replay-as-world adoption and this one-sidedness concern are the same design decision seen from two sides.",
  },
  openDirections: [
    "Reusing historical discovery traces — does trace reuse add information, or does it only re-weight what the trace already recorded?",
    "Evaluating alternative exploration policies — can a replay distinguish a policy that found more from one that spent less?",
    "Recursive improvement of agent behaviour — does the mechanism itself change, or only the data? The internal notes warn that varying data with a fixed mechanism populates a lower rung of the claim ladder than intended.",
    "Independent validation of claimed improvement — who holds the seal on the held-out family? If the same lane both seals it and reports transfer to it, it controls its own measurement.",
    "Avoiding self-evaluation bias and evidence contamination — can the evaluator be independent of the thing it evaluates?",
  ],
  note:
    "Do not state that Raphael implemented Dream-RSI or reproduced its findings. Neither is supported by the accessible records. The accurate claim is narrower: specific concepts were adopted into planning.",
} as const;

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
  {
    id: "RQ-6",
    question: "Can a replay distinguish a policy that found more from one that spent less?",
    rationale:
      "Raised by the recorded concern about Dream-RSI's replay, and by the same shape appearing in the project's own selector evaluation. A replay that cannot tell those apart cannot support a recursive-improvement claim.",
  },
];