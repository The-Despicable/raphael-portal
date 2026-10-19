/**
 * RAPHAEL Evolution Timeline — deep technical material.
 *
 * Everything here is transcribed from the portal's authoritative timeline
 * document, principally its appendices. It is deliberately kept out of
 * `raphael-timeline.ts` so that the chronology reads as a narrative and the
 * dense reference material is available on demand instead of inline.
 *
 * Two editorial rules are enforced by tests across this file:
 *
 *  - No operational detail is invented. Where the source says an image tag,
 *    digest, health check or service mapping is not recorded, this file says
 *    exactly that and nothing more.
 *  - Historical quantities are not combined. A running container count, a
 *    declared Compose service count, a named service count and a unique image
 *    count answer four different questions and are never merged into one
 *    figure or a single progress bar.
 */

import type { EraAccent } from "./raphael-timeline";

/* ========================================================================== */
/* Appendix I — historical Docker service inventory                            */
/* ========================================================================== */

export interface DockerService {
  /** 1-15 as named in the historical diagram. */
  ordinal: number;
  /** Exact service label as recorded. Never normalised or renamed. */
  name: string;
  port: number;
  /** Role described or implied by the historical diagram. */
  role: string;
  /** The evidentiary limit on reading this row as an operational claim. */
  evidenceBoundary: string;
}

export const historicalDockerServices: readonly DockerService[] = [
  {
    ordinal: 1,
    name: "raphael-api",
    port: 3900,
    role: "FastAPI API and orchestration, routing, authentication and sessions.",
    evidenceBoundary: "Historical diagram; not a present-time endpoint check.",
  },
  {
    ordinal: 2,
    name: "tor-proxy",
    port: 9050,
    role: "SOCKS5 and HTTP proxy service.",
    evidenceBoundary: "A diagrammed network dependency; policy coverage must be evaluated separately.",
  },
  {
    ordinal: 3,
    name: "neo4j",
    port: 7474,
    role: "Graph database for graph data.",
    evidenceBoundary: "Does not establish backup, restore or provenance.",
  },
  {
    ordinal: 4,
    name: "freellmapi",
    port: 3001,
    role: "Local language-model and inference service.",
    evidenceBoundary: "Exact model, quantisation and image digest are not established.",
  },
  {
    ordinal: 5,
    name: "c2-server",
    port: 3501,
    role: "Auxiliary orchestration and service component in the historical stack.",
    evidenceBoundary: "Recorded solely as historical inventory, not as current availability.",
  },
  {
    ordinal: 6,
    name: "sliver-server",
    port: 31337,
    role: "Sliver-related service in the historical diagram.",
    evidenceBoundary: "Exact image build and health evidence are not present in the inventory.",
  },
  {
    ordinal: 7,
    name: "sword",
    port: 3600,
    role: "Historical auxiliary service.",
    evidenceBoundary: "A shared name does not prove continuity with the early Sword & Shield phase.",
  },
  {
    ordinal: 8,
    name: "cloak-service",
    port: 3401,
    role: "Browser and automation service shown connected to proxying.",
    evidenceBoundary: "Does not prove all browsing requests passed through policy enforcement.",
  },
  {
    ordinal: 9,
    name: "recon-pipeline",
    port: 3503,
    role: "Reconnaissance pipeline service.",
    evidenceBoundary: "A diagrammed role, not proof of cold-start mission success.",
  },
  {
    ordinal: 10,
    name: "kali-tools",
    port: 3800,
    role: "Kali Linux tool-execution environment.",
    evidenceBoundary: "Later snapshots refer to this port, but later presence must be date-scoped.",
  },
  {
    ordinal: 11,
    name: "phishing",
    port: 3502,
    role: "Auxiliary service listed in the historical architecture.",
    evidenceBoundary: "Historical name only; not a safe or currently functional capability claim.",
  },
  {
    ordinal: 12,
    name: "caido",
    port: 48080,
    role: "Web-proxy service.",
    evidenceBoundary: "A port label is not an end-to-end test result.",
  },
  {
    ordinal: 13,
    name: "autonomous-brain",
    port: 3700,
    role: "Analysis service described for routing, memory and strategy.",
    evidenceBoundary: "A “brain” label is not proof of an effective cognitive loop.",
  },
  {
    ordinal: 14,
    name: "cai-service",
    port: 3201,
    role: "Analysis service.",
    evidenceBoundary: "A later audit found historical service path and symlink loss in the inspected environment.",
  },
  {
    ordinal: 15,
    name: "mhddos-service",
    port: 3301,
    role: "Auxiliary service named in the historical diagram.",
    evidenceBoundary: "Inventory is historical; not a current operational statement.",
  },
];

export const unmatchedDeclaredService = {
  label: "Unmatched declared service",
  port: null,
  note: "The July document states 16 Compose services while its visible diagram names 15. The identity of the sixteenth service is unresolved in the available records and must not be guessed.",
};

export const dockerCountDiscrepancy = {
  runningContainers: "14/14 containers reported running",
  declaredComposeServices: "16 services declared in the Compose configuration",
  namedServices: "15 service names visible in the extracted diagram",
  note: "These are separate quantities. A running container count is not a Compose declaration, a named service, an image count, or a healthy-service count, and collapsing them would overstate what the July record establishes.",
};

/**
 * The caveat body only. The lead sentence "A reported running stack is not a
 * validated system." is supplied by the component as a bolded lead-in, so it
 * is deliberately NOT repeated here — duplicating it rendered the sentence
 * twice on the page.
 */
export const dockerSnapshotCaveat =
  "Container count does not establish that all intended services were healthy at application level, that API routes were usable or correctly authenticated, that each persona influenced a live decision, or that a bridge method was tested and mediated by one authorization path.";

export const dockerReconstructionLabel =
  "Transcribed from the names and port labels present in the historical RAPHAEL 2.0 architecture diagram. Image names, tags, immutable digests and health checks are not reconstructed because they are not recorded.";

export interface SnapshotClaim {
  claim: string;
  supported: string;
  notEstablished: string;
}

export const dockerSnapshotClaims: readonly SnapshotClaim[] = [
  {
    claim: "14/14 containers reported running",
    supported: "The source described all 14 counted containers as running at that capture.",
    notEstablished: "That all intended services were healthy at application level.",
  },
  {
    claim: "API on the local orchestration port",
    supported: "The diagram and document associated the API with that local port.",
    notEstablished: "That all API routes were usable or authenticated correctly.",
  },
  {
    claim: "Five active personas",
    supported: "The report described five personas as active.",
    notEstablished: "Independent proof that each influenced a live decision correctly.",
  },
  {
    claim: "Judge status passing",
    supported: "The report displayed a passing status for the Judge.",
    notEstablished: "Universal integrity, evaluation validity, or future readiness.",
  },
  {
    claim: "30+ bridge methods",
    supported: "The report described a bridge surface with more than 30 methods.",
    notEstablished: "That every method was tested, safe, or mediated by one authorization path.",
  },
  {
    claim: "Persistent knowledge bases",
    supported: "Persistence was claimed or depicted.",
    notEstablished: "Full restore, backup verification, lineage, or data quality.",
  },
  {
    claim: "16 Compose services declared",
    supported: "The overview declared the configuration count.",
    notEstablished: "The exact identity of the sixteenth service in the visible diagram.",
  },
];

/**
 * Reconciliation checklist any future image-level claim would have to
 * satisfy before the historical record could be extended.
 */
export const imageReconciliationChecklist: readonly string[] = [
  "Capture timestamp and timezone.",
  "Exact checkout, repository, branch and commit.",
  "Compose file path and selected profiles.",
  "Output of the resolved Compose configuration.",
  "Container name, Compose project, service label and image ID.",
  "Immutable image digest where available.",
  "Creation and start time, plus container state.",
  "Health-check configuration and health state.",
  "Host-published versus internal container ports.",
  "Redacted configuration provenance, with secret values excluded.",
  "The actual probe used to substantiate a healthy claim.",
  "Whether that probe exercised application behaviour or only process liveness.",
  "Mapping between the historical container count and the 16-service declaration, if recoverable.",
  "A before and after archive hash when recording inventory exports.",
];

/* ========================================================================== */
/* Appendix I.5 — dated operational snapshots, kept separate                     */
/* ========================================================================== */

export interface DatedSnapshot {
  date: string;
  observation: string;
  /** How the observation must be represented. Never merged with another row. */
  representation: string;
}

export const datedSnapshots: readonly DatedSnapshot[] = [
  {
    date: "2026-07-23",
    observation: "Historical report describes 14/14 containers running.",
    representation: "Historical reported snapshot.",
  },
  {
    date: "2026-08-08",
    observation: "Broader audited architecture illustration.",
    representation: "Architecture and audit snapshot, not a current container count.",
  },
  {
    date: "2026-10-04",
    observation: "Docker daemon available, zero containers in the inspected environment.",
    representation: "Environment-specific failure and readiness snapshot.",
  },
  {
    date: "2026-10-16",
    observation: "A tools service, a deliberately vulnerable web application and its database observed; an inference server reported on the host.",
    representation: "A smaller later local lab subset.",
  },
];

export const snapshotAggregationCaveat =
  "It would be invalid to aggregate these observations into a claim that the July containers, the August services and the October lab subset were present at one time. The dates, environments and observed scopes differ.";

/* ========================================================================== */
/* Appendix E — canonical runtime flow and the ten-stage loop                    */
/* ========================================================================== */

export interface RuntimeFlowStep {
  id: string;
  label: string;
  role: string;
  /** Concrete contract note from the source. */
  contract: string;
}

export const canonicalRuntimeFlow: readonly RuntimeFlowStep[] = [
  {
    id: "operator",
    label: "Operator / CLI",
    role: "Entry",
    contract: "The operator-facing surface. Its availability does not establish that downstream capabilities, stores or models are available.",
  },
  {
    id: "runtime",
    label: "RaphaelRuntime",
    role: "Thin sequencer",
    contract: "Owns sequencing and termination, not all cognition.",
  },
  {
    id: "stages",
    label: "Canonical cognitive stages",
    role: "Cognition",
    contract: "Propose and interpret. Cognitive subsystems may not create alternate execution authority.",
  },
  {
    id: "broker",
    label: "CapabilityBroker",
    role: "Policy Decision Point",
    contract: "The single authoritative decision point. Deny-by-default. A more capable planner does not get more authority by being more capable.",
  },
  {
    id: "exec",
    label: "exec/",
    role: "Policy Enforcement Point",
    contract: "Owns the canonical enforcement boundary and primitive access. A sandbox constrains a class of execution but is not itself the source of authority.",
  },
  {
    id: "sandbox",
    label: "Sandbox / capability",
    role: "Mechanism",
    contract: "An enforcement mechanism, not an authority that can approve itself.",
  },
  {
    id: "result",
    label: "Result + artifact + receipt",
    role: "Record",
    contract: "A receipt should answer who asked for what, what decision was made, what was executed, which constraints applied and what outcome was observed.",
  },
  {
    id: "worldmodel",
    label: "WorldModel / evidence",
    role: "State",
    contract: "Evidence records what happened; it does not independently grant permission.",
  },
  {
    id: "replan",
    label: "Falsification and replanning",
    role: "Correction",
    contract: "A failure or contradiction should alter the next action for a causal reason, rather than incrementing a plan identifier.",
  },
];

export interface RuntimeStage {
  n: number;
  id: string;
  name: string;
  purpose: string;
  /** What the inspected implementation actually did at the handoff snapshot. */
  inspectedImplementation: string;
  /** Evidence that would be needed before claiming the stage is mature. */
  acceptanceSignal: string;
}

export const runtimeStages: readonly RuntimeStage[] = [
  {
    n: 1,
    id: "observe",
    name: "observe",
    purpose:
      "Capture the current view of the environment and make it available to the rest of the loop, as a recorded input rather than an untraceable prelude to tool use.",
    inspectedImplementation:
      "The handoff describes the stage recording the view into the evidence graph and returning the view keys. That proves a wired stage and a minimal record path, not a complete immutable capture of every raw input.",
    acceptanceSignal:
      "A reviewer can identify the originating tool and invocation, and can replay or check the observation without repeating the external action.",
  },
  {
    n: 2,
    id: "worldmodel_read",
    name: "worldmodel_read",
    purpose:
      "Read the current model of the mission so planning is informed by recorded context, prior observations and unresolved uncertainty.",
    inspectedImplementation:
      "The handoff says the WorldModel existed but the stage returned counts only. That is a minimal integration proof, not a full semantic state read.",
    acceptanceSignal:
      "The stage returns a decision-relevant state rather than a summary count, and that state demonstrably influences a later action in a testable way.",
  },
  {
    n: 3,
    id: "student_candidate",
    name: "student_candidate",
    purpose:
      "Let the learning subsystem generate a candidate strategy without bypassing the trusted planner or writing authoritative beliefs directly into the WorldModel.",
    inspectedImplementation:
      "Candidate output was recording-only and was not fed into planner request selection. That is a useful safety constraint, and also means the stage was not proof of effective learning.",
    acceptanceSignal:
      "The candidate is versioned against exact inputs, distinct from adoption, prevented from writing trusted beliefs directly, and comparable offline against a baseline.",
  },
  {
    n: 4,
    id: "planner_request",
    name: "planner_request",
    purpose:
      "Turn observations and state into a structured action request that remains a proposal until the policy decision stage approves it.",
    inspectedImplementation:
      "The stage constructed a deterministic request object instead of invoking the planner's full decision method. A significant boundary between a walking skeleton and a complete planner.",
    acceptanceSignal:
      "The request is derived from current state and goal rather than a fixed fixture, and can be reconstituted from the evidence ledger.",
  },
  {
    n: 5,
    id: "broker",
    name: "broker",
    purpose:
      "Evaluate whether the proposed action is permitted under current authorization, scope, capability and impact constraints.",
    inspectedImplementation:
      "A real broker on the canonical path was established. The October audit reported that an engagement policy artifact was present but not loaded by the inspected source, whose policy source remained the bootstrap variant — a policy file existing on disk is not policy behaviour being active.",
    acceptanceSignal:
      "The policy version actually loaded is recorded, the scope check is conjoined with broker authorization, and a denial prevents the execution primitive from running.",
  },
  {
    n: 6,
    id: "pep",
    name: "pep",
    purpose:
      "Be the boundary at which permission becomes a real execution decision, consuming the authorized request and failing closed when the pairing is inconsistent.",
    inspectedImplementation:
      "A later finding was about insufficient binding: a receipt authorized for a target was not bound to every consequential request dimension, including command material.",
    acceptanceSignal:
      "A copied action identifier with changed command material fails closed, as do stale and cross-target receipts, and the executor looks up a stored decision rather than trusting a caller-supplied object.",
  },
  {
    n: 7,
    id: "receipt",
    name: "receipt",
    purpose:
      "Record the authorization and execution relationship in a machine-checkable object.",
    inspectedImplementation:
      "Receipt infrastructure was present and the stage minted an evidence receipt, but the durable evidence substrate was not invoked on the hot receipt path at the inspected state. Correct description: receipt infrastructure present, durable hot-path integration incomplete at that snapshot.",
    acceptanceSignal:
      "The receipt is append-only and uniquely identified, hashes are computed from canonical serialisations, denial and failure receipts are produced too, and the full event chain is independently checkable.",
  },
  {
    n: 8,
    id: "worldmodel_integrate",
    name: "worldmodel_integrate",
    purpose:
      "Integrate new evidence while preserving provenance, uncertainty and contradictions. Integration is not adding a textual memory summary.",
    inspectedImplementation:
      "Minimal integration: appending an evidence item with a tool-observation trust label. There was no belief write by design in that snapshot, so integration hooks existed while full belief-state integration remained minimal.",
    acceptanceSignal:
      "An update can be traced to its receipt and source artifact, duplicate observations are detectable, prior state is preserved for replay, and an unsupported observation demonstrably does not change state.",
  },
  {
    n: 9,
    id: "contradiction",
    name: "contradiction",
    purpose:
      "Identify when the current plan, hypothesis or WorldModel conflicts with new evidence or another recorded claim.",
    inspectedImplementation:
      "The handoff describes the contradiction handler as a stub or minimal trigger before the depth work; the roadmap places falsification and replanning depth in a later gate. Its existence is not proof of robust falsification.",
    acceptanceSignal:
      "The contradictory claim is represented explicitly, evidence on both sides is identifiable, and a test distinguishes genuine contradiction handling from merely logging a failure string.",
  },
  {
    n: 10,
    id: "replan",
    name: "replan",
    purpose:
      "Use failure, contradiction or changed observations to revise the next action for a causal reason rather than an administrative change in identifier.",
    inspectedImplementation:
      "The handoff states that real falsification and replan proof had not been demonstrated, and that handlers were stubs or minimal terminators before the depth work.",
    acceptanceSignal:
      "Paired runs differ at the action level for a reason traceable to the evidence that changed, and an evaluator rules out random divergence or unrelated configuration differences.",
  },
];

/**
 * Stage-wide invariants from the source. Explicitly a TARGET CONTRACT, not a
 * list of things that all passed in the historical snapshots.
 */
export const runtimeInvariants: readonly string[] = [
  "There is one canonical runtime loop for the declared security perimeter.",
  "The stage sequence is fixed and inspectable.",
  "Planning proposes; it does not authorize.",
  "The broker makes the authoritative policy decision.",
  "The enforcement boundary owns the boundary to execution primitives.",
  "The exact request authorized is bound to the exact request executed.",
  "Evidence is recorded with provenance and does not grant authority.",
  "The WorldModel distinguishes observed facts, hypotheses and unresolved contradictions.",
  "Student output is a candidate until accepted through an independent evaluation and governance process.",
  "Replanning must be causal and demonstrated by action-level changes.",
  "A refused action remains refused; lower layers do not silently retry through a legacy path.",
  "Runtime health and end-to-end mission success are reported as separate metrics.",
];

/* ========================================================================== */
/* Appendix G — the gate chain, G0 to G10                                      */
/* ========================================================================== */

export type GateDisposition = "HISTORICAL_PASS" | "BLOCKED" | "NOT_ACCEPTED";

export interface GateRecord {
  gate: string;
  phase: string;
  /**
   * Compact gate name for the status matrix and the collapsed disclosure
   * header. Kept as data rather than derived by splitting `purpose` on
   * punctuation, which produced meaningless fragments such as "Ev…" in a
   * three-column grid.
   */
  shortName: string;
  purpose: string;
  evidenceInRecords: string;
  /** Current reading in the latest available assessment. */
  disposition: GateDisposition;
  dispositionLabel: string;
  /** Why this gate exists, and what its passing or failing constrains. */
  significance: string;
}

export const gateHistory: readonly GateRecord[] = [
  {
    gate: "G0",
    shortName: "baseline reproducibility",
    phase: "P0",
    purpose: "Establish which source tree is under review, pin a baseline, reconstruct the relevant test floor and inventory known execution paths before making a change.",
    evidenceInRecords:
      "The handoff describes the canonical baseline commit, a recorded floor of 239, 17 subprocess sites across 13 files, and ten of ten historical bypasses confirmed.",
    disposition: "HISTORICAL_PASS",
    dispositionLabel: "Historically passed",
    significance:
      "Without a stable baseline a later green suite can mean the test selection changed. Baseline work makes later comparisons interpretable. It does not prove every later branch descends from that commit; the later assessment records provenance anchoring as a mandatory check.",
  },
  {
    gate: "G1",
    shortName: "architecture freeze",
    phase: "P1",
    purpose: "Define the canonical architecture and lock the single-runtime, single-decision-point, single-enforcement-boundary rule before adding more capabilities.",
    evidenceInRecords: "The handoff describes ADRs, deprecation markers, import rules, behaviour-parity seams and a deny-by-default convention.",
    disposition: "HISTORICAL_PASS",
    dispositionLabel: "Historically passed",
    significance:
      "The freeze states what is canonical and what is transitional. Without that distinction, duplicated entry points can silently become competing execution authorities. It is a decision about design and intended ownership, not proof that legacy paths were deleted.",
  },
  {
    gate: "G2",
    shortName: "born-gated Runtime skeleton",
    phase: "P2",
    purpose: "Construct the smallest runnable canonical path in which action requests begin under the gate rather than entering through an unrestricted legacy route.",
    evidenceInRecords:
      "The handoff describes the runtime loop, stages, types, policy and a safe proving capability, a real broker, the enforcement boundary and CLI-to-runtime wiring, at a recorded floor of 291.",
    disposition: "HISTORICAL_PASS",
    dispositionLabel: "Historically passed",
    significance:
      "Born-gated matters because a path that starts permissive and adds checks later creates a long-lived period in which code acts before it has a consistent authorization model. The skeleton is a bounded foundation, not the full target.",
  },
  {
    gate: "G3",
    shortName: "universal Broker closure and MVP",
    phase: "P3",
    purpose: "Prove that the declared execution perimeter is governed end to end, demonstrate the target against failure criteria and complete an adversarial bypass review.",
    evidenceInRecords:
      "A request-binding defect, a noncanonical legacy execution plane, a scope transcript rider, provenance anchoring requirements and later authority findings remain open. The prescribed next step is recorded as not executed.",
    disposition: "BLOCKED",
    dispositionLabel: "NOT ACCEPTED / BLOCKED",
    significance:
      "This gate has outsized importance because it is the major boundary before broader capability expansion, full arena activity, advanced integrations or a public claim. Marking it blocked is not paperwork; it constrains which product claims and downstream phases can be made.",
  },
  {
    gate: "G4",
    shortName: "mission, scope and durable evidence",
    phase: "P4",
    purpose: "Turn a generic action into a request tied to explicit mission intent, narrow scope, authorization context, durable receipts, artifact identity and machine-checkable evidence provenance.",
    evidenceInRecords:
      "Some later-phase work landed before this gate was accepted, which the records describe as a governance deviation rather than a silent pass.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted",
    significance:
      "The formal prerequisite is G3. “Implemented in part / out of order” is more accurate than passed, because the later assessment explicitly says nothing beyond G2 was adopted in the relevant authority record.",
  },
  {
    gate: "G5",
    shortName: "falsification and replanning",
    phase: "P5",
    purpose:
      "Demonstrate that hypotheses can be treated as falsifiable claims, evidence can revise state, contradictions can be detected, and a causally different next action can be chosen when the prior plan fails.",
    evidenceInRecords:
      "WorldModel integration was minimal and contradiction and replan handlers were stubs or minimal terminators at the handoff snapshot. The required replan proof had not been demonstrated.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted",
    significance:
      "This is where the narrative of cognition becomes an observable behavioural property rather than a claim based on module names. Strong evidence requires a paired-run experiment where the next action differs for a traceable reason.",
  },
  {
    gate: "G6",
    shortName: "bounded learning",
    phase: "P6",
    purpose:
      "Move from recording candidate strategies to controlled influence over decisions, only after independent evaluation, bounded candidate change and explicit promotion criteria.",
    evidenceInRecords: "Student output was documented as recording-only in the inspected handoff.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted",
    significance:
      "A learner does not get to adopt its own proposals. Recording-only output is evidence of a containment posture, not evidence of a working learning loop or demonstrated improvement.",
  },
  {
    gate: "G7",
    shortName: "arena parity and isolation",
    phase: "P7",
    purpose: "Ensure training and evaluation scenarios use the same canonical runtime and decision boundary rather than creating a special execution path for experiments.",
    evidenceInRecords:
      "The 4 October audit found that running the test suite rewrote 14 historical arena result directories through deterministic run-identifier collisions and write-mode output.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted",
    significance:
      "If test harnesses and production paths differ, a result can measure the harness rather than the product. No acceptance should be inferred from the mere presence of an arena directory, scenario templates or test scripts.",
  },
  {
    gate: "G8",
    shortName: "evaluation programme",
    phase: "P8",
    purpose:
      "Run a valid comparison with stable instruments and dataset, matched resources, an independent holdout, per-arm instrumentation preflight, and separate reporting of safety and efficacy.",
    evidenceInRecords:
      "The central thesis is recorded as unresolved, in part because two arms were instrument-defective. The frozen holdout file was absent in the October audit and its expected digest was unavailable; five of nine pinned instrument digests later appeared mismatched.",
    disposition: "BLOCKED",
    dispositionLabel: "Blocked — central thesis unresolved",
    significance:
      "Effect sizes cannot be treated as established results without a formal disposition or a valid recovered campaign under approved governance. No current outcome should be promoted simply because historical tables exist.",
  },
  {
    gate: "G9",
    shortName: "consolidation and deletion",
    phase: "P9",
    purpose: "Remove migration scaffolding and legacy execution paths only after zero-reference proof, perimeter review and the relevant governance decision.",
    evidenceInRecords:
      "The legacy plane disposition is perimeter documentation now and fold/delete at the consolidation phase, with deployment verification and zero-reference conditions; the phase was explicitly re-dated.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted",
    significance:
      "Premature deletion can break real callers; delayed deletion can leave ungoverned paths in place. Consolidation is treated as a measured phase with explicit prerequisites, not an untargeted cleanup task.",
  },
  {
    gate: "G10",
    shortName: "advanced capabilities and RSI admission",
    phase: "P10",
    purpose:
      "Evaluate advanced capabilities and any recursive self-improvement claim only after earlier safety, evaluation, evidence and governance gates have been accepted.",
    evidenceInRecords:
      "The v4.2 roadmap describes improvement implementation as not started, with the preceding gate blocked and the prescribed next step not executed. The roadmap defines a target design and admission tests but does not certify the system.",
    disposition: "NOT_ACCEPTED",
    dispositionLabel: "Not accepted — improvement not started",
    significance:
      "A system must not claim a higher improvement level merely because it has a learner component, a replay function or a strategy proposal mechanism. It must demonstrate bounded candidate changes, independent holdout evaluation, immutable lineage, acceptable outcomes and an explicit deployment decision.",
  },
];

export const gateDispositionTone: Record<GateDisposition, EraAccent> = {
  HISTORICAL_PASS: "cyan",
  BLOCKED: "blocked",
  NOT_ACCEPTED: "violet",
};

/* ========================================================================== */
/* Appendix A — evidence vocabulary                                             */
/* ========================================================================== */

export interface EvidenceCategory {
  label: string;
  meaning: string;
}

export const evidenceCategories: readonly EvidenceCategory[] = [
  {
    label: "Owner-recalled milestone",
    meaning:
      "A project name or phase supplied by the owner from personal project history. Legitimate narrative, but not independently dated by the records currently available.",
  },
  {
    label: "Documented design",
    meaning:
      "A roadmap, diagram, handoff or specification describes intended behaviour. This proves it was proposed or documented, not that runtime code performed it.",
  },
  {
    label: "Source presence",
    meaning:
      "A class, module, configuration file, service directory, test or script exists in a specific checkout. Presence alone does not prove it is imported, reachable, correctly configured or safe.",
  },
  {
    label: "Wired path",
    meaning:
      "Code references a component from an entry point or canonical runtime path. Stronger than file presence, but still not proof that a complete user-visible task succeeds.",
  },
  {
    label: "Tested behaviour",
    meaning:
      "An explicitly described test was run and returned a result, tied to that revision, interpreter, dependencies, test selection and environment.",
  },
  {
    label: "Reported operational snapshot",
    meaning:
      "A dated record describes services or containers as running at a point in time. Not a claim about today or another checkout.",
  },
  {
    label: "Independently reported result",
    meaning:
      "A separate audit states that it reproduced a finding or suite. Distinct from the present document's author running the test.",
  },
  {
    label: "Gate-accepted",
    meaning:
      "The defined authority process accepted a milestone against its stated criteria. A merged commit, passing local suite or roadmap checkbox is not a substitute.",
  },
  {
    label: "Unknown / unresolved",
    meaning:
      "Records do not support a reliable assertion, or the relevant artifact is absent, drifted or not adjudicated.",
  },
];

export interface StatusVerb {
  word: string;
  meaning: string;
  doesNotMean: string;
}

export const statusVerbs: readonly StatusVerb[] = [
  { word: "Proposed", meaning: "A design or action was suggested.", doesNotMean: "It was implemented or authorized." },
  { word: "Documented", meaning: "The claim appears in a source record.", doesNotMean: "It was independently verified." },
  { word: "Present", meaning: "An artifact exists in a particular source tree or archive.", doesNotMean: "It is operational." },
  { word: "Wired", meaning: "A caller or execution path connects to a component.", doesNotMean: "The entire workflow succeeds." },
  { word: "Exercised", meaning: "A test or run reached the relevant behaviour.", doesNotMean: "It passed all acceptance criteria." },
  { word: "Passed", meaning: "The specified test or check passed in its stated scope.", doesNotMean: "Every feature or path is safe." },
  { word: "Accepted", meaning: "The relevant gate or adjudication accepted the evidence.", doesNotMean: "Future versions retain that status automatically." },
  { word: "Frozen", meaning: "A bounded state or artifact is preserved as a reference.", doesNotMean: "It is release-ready." },
  { word: "Reproducible", meaning: "A documented procedure and pinned inputs can recreate a result.", doesNotMean: "The result is meaningful if the instrument is defective." },
  { word: "Not ready", meaning: "Required operational, evaluation or governance criteria remain unmet.", doesNotMean: "No useful engineering work was completed." },
];

/* ========================================================================== */
/* Appendix L — the change log of claims, not just versions                     */
/* ========================================================================== */

export interface ClaimCorrection {
  historicalClaim: string;
  laterFinding: string;
  preserve: string;
}

export const claimCorrections: readonly ClaimCorrection[] = [
  {
    historicalClaim: "A large service graph implies end-to-end integration.",
    laterFinding: "Later audits recorded missing services and failed cold starts.",
    preserve: "An architecture diagram and live-operational proof are distinct.",
  },
  {
    historicalClaim: "A policy file is active because it exists.",
    laterFinding: "An engagement policy artifact was reported unwired in the October checkout.",
    preserve: "The loader and decision behaviour must be verified, not assumed.",
  },
  {
    historicalClaim: "A receipt keyed by action identifier is enough.",
    laterFinding: "A finding recorded missing binding between the receipt and the executed command.",
    preserve: "The exact authorized request must match the executed request.",
  },
  {
    historicalClaim: "A declared maximum-impact cap is enforced because the API has the field.",
    laterFinding: "A scope audit found no comparison; a fix was later recorded.",
    preserve: "Test the actual boundary, not its schema or documentation.",
  },
  {
    historicalClaim: "A new plan identifier proves the system replanned.",
    laterFinding: "Replan criteria require an action-level causal change.",
    preserve: "Replanning is a behavioural claim requiring paired-run evidence.",
  },
  {
    historicalClaim: "Student module presence shows learning.",
    laterFinding: "Student output was recording-only at the handoff snapshot.",
    preserve: "Candidate generation and adopted improvement are different.",
  },
  {
    historicalClaim: "A passing configured suite proves all modules import.",
    laterFinding: "An October import sweep found 37 failures out of 381 modules.",
    preserve: "Suite scope, static import closure and runtime entry-point reachability are separate.",
  },
  {
    historicalClaim: "A test floor is a timeless project-wide number.",
    laterFinding: "Floors varied across source revisions, test scopes and environments.",
    preserve: "Every metric needs an exact revision and suite scope.",
  },
  {
    historicalClaim: "Historical effect sizes are valid because result files exist.",
    laterFinding: "The dataset was absent and five instrument digests had drifted.",
    preserve: "Experimental conclusions remain unresolved absent a valid disposition.",
  },
  {
    historicalClaim: "A roadmap task being implemented means its gate passed.",
    laterFinding: "One gate remained not accepted while later work existed in source.",
    preserve: "Implementation and governance acceptance are separate.",
  },
  {
    historicalClaim: "An agent can adopt decisions by asserting authority.",
    laterFinding: "Self-adoptions were invalidated for lack of trusted authority.",
    preserve: "Authority is an external trust root, not a model-generated claim.",
  },
  {
    historicalClaim: "A successful container start means a healthy application.",
    laterFinding: "The October audit observed zero containers and failed cold starts.",
    preserve: "Record health checks and end-to-end outcomes separately.",
  },
];

/**
 * Historical test floors. Each figure is scoped to a specific revision and
 * test selection. They are deliberately NOT aggregated: a cumulative progress
 * bar built from these numbers would be a fabrication.
 */
export interface ScopedMetric {
  value: string;
  scope: string;
}

export const scopedTestFloors: readonly ScopedMetric[] = [
  { value: "239", scope: "Canonical P0 baseline recorded in the v4.1 handoff." },
  { value: "291", scope: "Recorded final floor at the organ-wiring point for the G2 skeleton." },
  { value: "316", scope: "An intermediate scope from a later source revision." },
  { value: "334", scope: "An intermediate scope from a later source revision." },
  { value: "357", scope: "An intermediate scope from a later source revision." },
  {
    value: "621",
    scope:
      "The configured suite run in the 4 October audited checkout: 621 passed, 0 failed, 0 skipped. It does not cover modules that failed to import, nor the environment needed for a full mission.",
  },
  { value: "1,452", scope: "Separately reported, on a different scope and not reconciled with the series above." },
];

export const scopedTestFloorsCaveat =
  "These counts belong to different test sets, revisions and environments. A unit suite can establish the properties those tests assert in the environment where they ran; it cannot substitute for a missing holdout dataset, correct a mismatched benchmark instrument, or resolve whether two experimental arms used equivalent measurement.";

/* ========================================================================== */
/* Appendix J/K — evaluation integrity and governance                           */
/* ========================================================================== */

export interface EvaluationClaim {
  claim: string;
  state: string;
  treatment: string;
}

export const evaluationClaims: readonly EvaluationClaim[] = [
  {
    claim: "Explicit architecture beats prompting alone.",
    state: "UNRESOLVED",
    treatment: "A research question, not a conclusion.",
  },
  {
    claim: "Historical reported effect sizes.",
    state: "Dataset and instrument provenance problems remain.",
    treatment: "Retained as historical claims only; not promoted to a validated result.",
  },
  {
    claim: "The frozen holdout was available in the October checkout.",
    state: "Absent in the audit.",
    treatment: "A missing-artifact blocker.",
  },
  {
    claim: "Instrument digests match the pinned state.",
    state: "Five of nine appeared mismatched.",
    treatment: "Byte-level drift is documented; behavioural impact is not inferred without evidence.",
  },
  {
    claim: "A green unit suite resolves evaluation concerns.",
    state: "Does not follow.",
    treatment: "An incorrect inference; test correctness stays separate from measurement validity.",
  },
  {
    claim: "Recursive improvement effectiveness is established.",
    state: "Implementation not started; no admission result.",
    treatment: "Not established.",
  },
];

export const governanceDependencyNote =
  "This chain describes documented dependency logic, not a claim that the steps occurred. The first dependency is still absent in the cited assessment, so the chain remains blocked at the time of the latest available record.";

export const governanceLesson =
  "An agent cannot create a trusted authority principal by declaring itself to hold a role, and its own assertion that a decision is accepted does not satisfy the project's trust model. Where the project defines an authority decision as a prerequisite for an action, implementation cannot validly bypass that prerequisite because code is ready.";

/* ========================================================================== */
/* Appendix A.4/A.5 — why the history is presented this way                     */
/* ========================================================================== */

export const setbacksRationale =
  "A timeline containing only new features implies monotonically increasing capability. The actual record includes successful architecture work, failed integrations, fail-closed remediation, missing environment dependencies, evaluation-data loss and governance blockers. Those are not side notes: they changed which claims the project could responsibly make and which work could proceed.";

export const notProvenIsNotFalse =
  "If the evidence does not establish that a feature works, it should be marked unproven or unresolved rather than claimed to be false. The July container snapshot is not erased by an October zero-container snapshot; they are different points in time. The central thesis is unresolved — not proven true, and not conclusively disproven by the missing artifacts alone.";

export const openHistoricalResearchItems: readonly string[] = [
  "Recover the original RAPHAEL 1 / Ultimate Skill records.",
  "Recover original Sword & Shield notes.",
  "Recover the dated Rebirth transition artifacts.",
  "With those recovered, add exact early dates, detailed version boundaries and a verifiable map from the early names to later source modules.",
];

export const interpretationSteps: readonly string[] = [
  "The project began as a capability-focused idea.",
  "It grew into a large, integrated multi-service platform.",
  "The growing surface exposed the need for explicit execution and authorization boundaries.",
  "v4 made those boundaries central to the design.",
  "Formal evaluations and audits discovered gaps between architectural intention, implementation, execution and acceptance.",
  "The present status is a research and engineering state with meaningful assets, but not a release-ready or thesis-validated system.",
];

/* ========================================================================== */
/* Editorial rules — the source's own guidance for this page                    */
/* ========================================================================== */

export const editorialRules: readonly string[] = [
  "Never collapse all versions into one implementation. These are historical eras, not proof of one immutable codebase.",
  "Do not invent dates for the early phases. Use “date not established” until original notes, repository dates or commits are recovered.",
  "Preserve the Docker milestone as a reported snapshot, with its source and qualification.",
  "Show later setbacks honestly. Different dated snapshots are not a benchmark of identical checkouts.",
  "Keep the research story honest. The presence of a cognitive component does not prove it influenced runtime decisions or improved outcomes.",
  "Separate design from adoption. A roadmap can define the target without making the feature operational or authorizing the next phase.",
  "Keep the current blockers visible unless newer authoritative evidence changes them.",
  "Do not present the portal's own tests as tests of Raphael. The website validates the site.",
];

export const siteLimitation =
  "This page is a documentation surface. Its build and tests do not prove that Raphael's source, authorization boundary, cognitive loop or research thesis has passed its own gates.";

export const timelineLastReviewed = "2026-10-19";
