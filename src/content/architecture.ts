import type { ArchEdge, ArchNode, DesignPrinciple } from "@/lib/types";

/**
 * Architecture content.
 *
 * Every node's `documented` / `toVerify` split comes from the 2026-10-16
 * assessment. The assessment's own epistemic labels are preserved rather than
 * flattened, because the central point of this page is that a diagram proves
 * nothing about runtime conformance.
 */

export const canonicalChainLabel =
  "Scope → CapabilityBroker (PDP) → PEP → exec/ → SandboxResult → Evidence v1 → EvidenceGraph";

export const archNodes: readonly ArchNode[] = [
  {
    id: "scope",
    label: "Scope",
    kind: "input",
    shortDescription: "Declares the authorized boundary for an engagement before any capability is requested.",
    inputs: "Engagement objective, operator intent, explicit authorization scope.",
    outputs: "A scope object that every downstream authorization decision is evaluated against.",
    documented:
      "Scope is the head of the documented canonical chain, and a dedicated scope module is recorded as implemented.",
    toVerify:
      "Whether an out-of-scope request is refused rather than merely flagged was not established by the dated assessment.",
    sourceNote: "Assessment §2.2 canonical chain; §2.4 implementation state.",
  },
  {
    id: "broker",
    label: "CapabilityBroker",
    kind: "decision",
    shortDescription: "Deny-by-default policy decision point. Authorizes capabilities, never executes them.",
    inputs: "Requested capability, scope object, active policy configuration.",
    outputs: "An allow or deny decision plus decision provenance.",
    documented:
      "A deny-by-default broker is recorded as present and its decision pattern is described as guardrail-tested.",
    toVerify:
      "The frozen instrument digest for this component no longer matches the tree, so its historical semantics cannot be assumed to be the current code. Whether the broker is consulted on every path is not established.",
    sourceNote: "Assessment §2.2, §3.1; blueprint asset classification ADAPT.",
  },
  {
    id: "pep",
    label: "Policy Enforcement Point",
    kind: "enforcement",
    shortDescription: "Enforces the broker's decision at the boundary where an effect would actually occur.",
    inputs: "Broker decision, attempted effect.",
    outputs: "Permitted effect, or a refusal with a recorded reason.",
    documented:
      "Strict separation of broker and enforcement point is an accepted architecture decision, and a born-gated runtime is also accepted.",
    toVerify:
      "Separation of these two concerns is documented as accepted, not as independently proven at runtime. Co-location anywhere would collapse the boundary.",
    sourceNote: "Accepted decision records 003 and 004; assessment §7.",
  },
  {
    id: "exec",
    label: "exec/",
    kind: "execution",
    shortDescription: "Documented as the sole owner of process, network and file primitives.",
    inputs: "An authorized effect request.",
    outputs: "A sandbox result describing what happened.",
    documented:
      "Single-ownership of execution primitives is an accepted invariant, and a no-second-entry-point decision is accepted.",
    toVerify:
      "This is the sharpest documented-versus-implemented gap on the site. The invariant is implemented inside the canonical import closure and is contradicted if read as a repository-wide claim. A substantial number of effect files sit outside mediation, and some 'dead' code is only dead by import failure.",
    sourceNote: "Assessment §2.2 CONTRADICTED-AS-UNIVERSAL; §5 ARCH-001.",
  },
  {
    id: "sandbox",
    label: "SandboxResult",
    kind: "evidence",
    shortDescription: "Structured record of an execution attempt, produced whether or not it succeeded.",
    inputs: "Attempted effect, execution outcome, sandbox observations.",
    outputs: "A structured result suitable for evidence capture.",
    documented:
      "Structured result capture is recorded as present in the canonical chain.",
    toVerify:
      "Whether the result faithfully represents what occurred, rather than what the system intended to occur, is not established.",
    sourceNote: "Assessment §2.2 canonical chain.",
  },
  {
    id: "evidence",
    label: "Evidence v1",
    kind: "evidence",
    shortDescription: "Provenance layer that grades and labels each artifact rather than silently trusting it.",
    inputs: "Sandbox results, artifacts, digests.",
    outputs: "Labelled evidence with explicit epistemic grade.",
    documented:
      "Evidence labelling discipline and fail-closed provenance are recorded as project strengths and as design laws to carry forward.",
    toVerify:
      "Grades are self-assigned by the same system under assessment. A grade is not an independent verification.",
    sourceNote: "Assessment §7 blueprint assets; accepted decision record 009.",
  },
  {
    id: "graph",
    label: "EvidenceGraph",
    kind: "store",
    shortDescription: "Queryable structure over evidence used by evaluation and claim promotion.",
    inputs: "Labelled evidence artifacts and their digests.",
    outputs: "Queryable evidence for evaluation and promotion decisions.",
    documented:
      "The evidence graph is the documented terminus of the chain and is recorded as implemented.",
    toVerify:
      "The measurement contract built on it was adversarially reviewed and is described as strong, but no reproducible campaign result could be attributed because the dataset is missing.",
    sourceNote: "Assessment §2.2, §7 measurement contract ADAPT; §5 EVAL-001.",
  },
];

export const archEdges: readonly ArchEdge[] = [
  { from: "scope", to: "broker", label: "declares authorized boundary" },
  { from: "broker", to: "pep", label: "allow / deny + provenance" },
  { from: "pep", to: "exec", label: "enforced effect" },
  { from: "exec", to: "sandbox", label: "execution outcome" },
  { from: "sandbox", to: "evidence", label: "artifact + digest" },
  { from: "evidence", to: "graph", label: "graded record" },
];

export const designPrinciples: readonly DesignPrinciple[] = [
  {
    id: "P-01",
    title: "Runtime and orchestration",
    summary: "A single canonical runtime drives a fixed, ordered stage sequence rather than ad-hoc control flow.",
    acceptedDecision: "A canonical runtime with a defined stage order is documented as the system's spine.",
    implementationPresence: "The runtime and its ordered stage list are recorded as statically present.",
    independentlyVerified: "Presence and stage count were verified statically at assessment time.",
    unverifiedClaim:
      "That the ordered stages actually execute in that order on a live run was not verified. The end-to-end stack is self-declared unvalidated.",
    component: "RUNTIME_ORCHESTRATION",
  },
  {
    id: "P-02",
    title: "Capability authorization",
    summary: "A deny-by-default broker decides; it never executes. Separation of decision from effect is the core invariant.",
    acceptedDecision: "Strict broker / enforcement-point separation is an accepted decision.",
    implementationPresence: "The broker is recorded as present with guardrail tests.",
    independentlyVerified:
      "Presence was verified. The pinned digest for the component has since drifted, so its historical semantics are not the current code.",
    unverifiedClaim:
      "That the broker is consulted on every path that can produce an effect outside the canonical closure.",
    component: "CAPABILITY_BROKER_PDP",
  },
  {
    id: "P-03",
    title: "Policy enforcement",
    summary: "The enforcement point is where an effect is actually permitted or refused, and refusals are recorded.",
    acceptedDecision: "An enforcement point distinct from the broker is an accepted decision.",
    implementationPresence: "The boundary is documented and reflected in the accepted decision set.",
    independentlyVerified: "Not independently verified at runtime by the dated assessment.",
    unverifiedClaim: "Global mediation. A perimeter classification dispute remains open.",
    component: "PEP_AUTHORIZATION",
  },
  {
    id: "P-04",
    title: "Controlled execution boundary",
    summary: "One component owns process, network and file primitives; no second entry point may exist.",
    acceptedDecision: "Single ownership of primitives, plus a no-second-entry-point decision, are both accepted.",
    implementationPresence:
      "Holds inside the canonical import closure. A substantial number of effect files sit outside it.",
    independentlyVerified:
      "Contradicted as a universal claim. Some code called dead is only established as dead by import failure.",
    unverifiedClaim:
      "That no effect can occur outside the mediated path anywhere in the repository.",
    component: "EXECUTION_BOUNDARY",
  },
  {
    id: "P-05",
    title: "Evidence capture and provenance",
    summary: "Every artifact is graded and digest-pinned, and an absent or drifted artifact is labelled rather than silently accepted.",
    acceptedDecision: "Fail-closed provenance and an epistemic taxonomy are design laws to carry forward.",
    implementationPresence:
      "Recorded as a genuine project strength, with explicit states for missing, unadopted and pending-ratification.",
    independentlyVerified:
      "The discipline is visible and was directly inspected. Its subject matter is not independently attested.",
    unverifiedClaim:
      "A grade produced by the system under assessment is not a third-party verification of that same system.",
    component: "EVIDENCE_PROVENANCE",
  },
  {
    id: "P-06",
    title: "Evidence graph and evaluation",
    summary: "A measurement contract with grid accounting and a non-vacuity rule that cannot manufacture authority.",
    acceptedDecision: "The measurement contract is accepted and was described as adversarially reviewed.",
    implementationPresence: "Implemented and reviewed within one subsystem's audit scope.",
    independentlyVerified: "Scope-limited third-party review only.",
    unverifiedClaim:
      "No reproducible campaign effect size can be attributed, because the canonical dataset is missing and the instrument drifted.",
    component: "MEASUREMENT_EVALUATION",
  },
  {
    id: "P-07",
    title: "Fail-closed behaviour",
    summary: "Absence of evidence, absence of an issuer, or an unratified decision must block, never default to allow.",
    acceptedDecision: "Fail-closed is stated as a design law.",
    implementationPresence: "Fail-closed states are visible throughout the provenance layer.",
    independentlyVerified:
      "A fail-open conditional in a human-in-the-loop guard was recorded as an open defect. Described by category here; the symbol is deliberately not published.",
    unverifiedClaim: "That fail-closed holds uniformly across all guards and all paths.",
    component: "PEP_AUTHORIZATION",
  },
  {
    id: "P-08",
    title: "Separation of claims from verified outcomes",
    summary:
      "A verification mechanism is never self-certifying. Each trust boundary needs an independent test of whether it can observe the failure it exists to catch.",
    acceptedDecision: "Falsification as claim promotion is an accepted decision.",
    implementationPresence:
      "Identifiability tests and positive/negative control pairs are present as named artifacts in the research subsystem.",
    independentlyVerified:
      "The principle is the project's most transferable asset and is recorded as such.",
    unverifiedClaim:
      "That the identifiability tests themselves have been shown to fail against a planted failure. That is exactly what the principle demands and is not established.",
    component: "MEASUREMENT_EVALUATION",
  },
];

export const verificationPrinciple = {
  statement:
    "A verification mechanism is never self-certifying. Every trust boundary needs an independent test of whether it can observe the failure it exists to catch, and that test must itself be validated against a planted failure before the mechanism is trusted.",
  corollary: "A test that has never been shown to fail has not been shown to pass.",
  resolution:
    "The verification chain terminates in an explicit trusted base. Beyond that base, verification depth is a bounded assurance resource.",
  framing:
    "Verification depth is a budget you spend, not a property you prove. The mistake would be pretending the chain has no axioms.",
  claimLadder: [
    { level: "L0", label: "Evaluator correctness", note: "Identifiability tests sit here. This is the axiom base." },
    { level: "L1", label: "Candidate-family identifiability", note: "Requires an independent adjudicator, not the implementer." },
    { level: "L2", label: "Externally measured improvement", note: "Must be measured outside the system claiming improvement." },
    { level: "L3", label: "Cross-family transfer", note: "Transfer to a family the system did not generate." },
    { level: "L4", label: "Repeated transferable improvement", note: "Repetition. Note that varying data with a fixed mechanism populates L4, not L5." },
    { level: "L5", label: "Evidence for recursive self-improvement", note: "An empirical claim under a declared protocol, not a proof of infallibility." },
  ],
  invariants: [
    { n: "14", text: "Independent identifiability before selection, adjudicated by an independent auditor rather than the implementer." },
    { n: "15", text: "Raw evidence is immutable except via an audited retirement record." },
    { n: "16", text: "The external objective and evaluation contract are immutable to the learner." },
  ],
} as const;

export const proposedArchitecture = {
  label: "Proposed / Intended Architecture",
  caveat:
    "This layer is a target the project's own assessment argues for. It is NOT verified implementation, and nothing here should be read as existing in the assessed codebase.",
  goals: [
    "A single governed runtime, with no path to an effect that does not pass through one authorization decision.",
    "Fail-closed authorization that is provably uniform, demonstrated by an exhaustive call-graph argument rather than by inspection of a preferred path.",
    "Controlled execution primitives behind a single owner, with any legacy path either welded or explicitly retired on the record.",
    "Machine-checkable evidence provenance: every promoted claim resolves to an artifact whose digest still matches the tree that produced it.",
    "An authority loop that actually exists, so a decision can be ratified by someone with standing.",
  ],
  unimplemented: [
    "A named, enrolled authority principal. This is the blocking prerequisite and it is a human decision, not code.",
    "Uniform mediation across the legacy execution plane.",
    "A reproducible evaluation dataset, or a formal decision to re-scope the research claim to what is verifiable.",
    "A dependency lock, a license, and an SBOM.",
  ],
  relationship:
    "The successor project is independent and was built clean-room from Raphael's design ideas, not from its code. Its security properties are its own and do not transfer.",
} as const;

export const legacyPerimeter = {
  title: "Legacy execution perimeter and unresolved boundaries",
  intro:
    "The canonical chain above may be present and coherent while the repository still contains effect paths that do not pass through it. These are recorded as open verification questions, not as confirmed vulnerabilities, and are described by category rather than by identifier.",
  questions: [
    {
      id: "Q-MED",
      title: "Is mediation complete?",
      body:
        "A perimeter classification places a substantial number of effect files outside the mediated path, and the classification is itself disputed between two project documents. An independent audit noted that 'no bypass found' should be read as unknown, not as a pass, absent exhaustive call-graph analysis.",
      label: "UNKNOWN",
    },
    {
      id: "Q-DEAD",
      title: "Is dead code actually deleted?",
      body:
        "Some code classified as dead is established only by import failure. Import failure is not deletion, and the distinction matters because the invariant is about what can run, not about what is referenced.",
      label: "CONTRADICTED",
    },
    {
      id: "Q-LOOP",
      title: "Does any second cognitive loop exist?",
      body:
        "Whether a second loop or an unmediated production path exists is recorded as unknown. It was not answered by the dated assessment.",
      label: "UNKNOWN",
    },
    {
      id: "Q-FENCE",
      title: "Where are the containment boundaries now?",
      body:
        "Offline payload modules, a denial-of-service service and legacy bridge paths were all identified as requiring containment or quarantine. This site does not reproduce operational detail for any of them.",
      label: "DOCUMENTED",
    },
  ],
} as const;