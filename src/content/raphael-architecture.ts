/**
 * Raphael architecture explorer content model.
 *
 * TWO VIEWS OF ONE PROJECT, AT TWO LEVELS OF MATURITY
 * ----------------------------------------------------
 * `currentArchitecture`  — a documented snapshot. Every component carries a
 *   `status` drawn from ComponentStatus, and the page renders that status as
 *   text, never as colour alone. This view describes what the project's own
 *   records describe; it does not assert that any stage was freshly re-verified
 *   against a latest checkout.
 *
 * `targetArchitecture`    — Blueprint v4.2. A proposal. Every component is
 *   `not_implemented` or `partial`, and the lane carries an explicit
 *   "proposed, not implemented" label so a reader cannot mistake a design for a
 *   deployment.
 *
 * WHY THE STATUS ENUM EXISTS
 * -------------------------
 * The two objects are separate types, and the target view's statuses are
 * constrained to non-implemented values at compile time. A future edit cannot
 * silently promote a target component to `implemented_in_snapshot` without
 * changing this module's types, which is the point.
 *
 * SOURCE PRECEDENCE
 * -----------------
 * Where project documents conflict, the roadmap's own Appendix E precedence is
 * followed: an explicit superseding ADR or governance ruling first, then the
 * canonical roadmap, then earlier roadmap wording, then repository evidence.
 * ADR-013 records one such conflict and explicitly declines to resolve it.
 *
 * NOTHING HERE IS FABRICATED. No test count, benchmark, latency, success rate,
 * endpoint, deployed service, database, or capability list appears in this file,
 * because none is established by the available evidence.
 */

/* ========================================================================== */
/* Types                                                                       */
/* ========================================================================== */

/**
 * Documented maturity of a single component.
 *
 * These are deliberately coarse. A finer vocabulary would tempt a future edit
 * to assert more precision than the evidence supports.
 */
export type ComponentStatus =
  /** Described in a reviewed project record. Not re-verified on this site. */
  | "documented_in_reviewed_snapshot"
  /** Present in the implementation, with acceptance still outstanding. */
  | "implemented_acceptance_pending"
  /** Present in part, or present without a demonstration of the full behaviour. */
  | "partial_not_yet_demonstrated"
  /** Recorded as a defect at the reviewed snapshot. */
  | "known_issue_at_reviewed_snapshot"
  /**
   * Newer evidence exists but does not settle the present-day disposition, so
   * neither "fixed" nor "still broken" is claimed.
   */
  | "current_disposition_unconfirmed"
  /** Not implemented. */
  | "not_yet_implemented";

/** Which of the two views a component belongs to. */
export type ArchitectureView = "current" | "target";

/**
 * Where a component sits in the trust model. Drives the legend and the
 * boundary colouring, and is separate from ComponentStatus: a component can be
 * an authorization boundary and be unimplemented.
 */
export type TrustRole =
  /** Proposes. Never authorizes, never executes. */
  | "proposal"
  /** The single authorization decision point. */
  | "authorization"
  /** The single execution enforcement point. */
  | "enforcement"
  /** Mechanism that constrains execution. Never an authority. */
  | "mechanism"
  /** Produces graded, provenance-bearing records. Never an authorization. */
  | "evidence"
  /** Measures. Never a second brain or a production runtime. */
  | "evaluation"
  /** Human or governance release authority. */
  | "governance"
  /** Pure sequencing / lifecycle. */
  | "orchestration";

/** One inspectable component in either view. */
export interface ArchitectureComponent {
  id: string;
  /** Display label. Keep it short; long labels break the diagram layout. */
  label: string;
  /** Optional second line, e.g. "10 · observe". */
  stageLabel?: string;
  /** One sentence: what this component IS responsible for. */
  responsibility: string;
  status: ComponentStatus;
  trustRole: TrustRole;
  /** The main security or correctness invariant this component must uphold. */
  invariant: string;
  /** What the records say is missing, partial, or unproven. */
  limitation: string;
  /** What would be required to demonstrate completion. */
  evidenceRequired: string;
  /** Where this came from. Document names only — never local paths. */
  sourceNote: string;
}

/** One directed relationship. `style` distinguishes trusted from legacy paths. */
export interface ArchitectureEdge {
  from: string;
  to: string;
  label?: string;
  /**
   * TRUSTED  — the canonical documented or proposed path.
   * LEGACY   — a noncanonical path, rendered dashed and labelled so it can
   *            never be mistaken for the canonical chain.
   * GUARDED  — a protected constraint on other components, not a data flow.
   * FEEDBACK — a return path, such as the loop closing or the halt condition.
   */
  style: "trusted" | "legacy" | "guarded" | "feedback";
}

/** A named group of components rendered as a labelled region. */
export interface ArchitectureBand {
  id: string;
  label: string;
  /** Short clarifier shown under the label inside the diagram. */
  caption?: string;
  componentIds: readonly string[];
  /** A band that must read as visibly separate from the canonical path. */
  emphasis: "canonical" | "separate" | "proposed";
}

/** One view's diagram: components, edges, bands. */
export interface ArchitectureDiagramModel {
  view: ArchitectureView;
  /** Shown as the diagram's title. */
  title: string;
  /** Rendered immediately under the title. Never optional in practice. */
  statusLabel: string;
  /** The framing sentence a reader must not be able to skip. */
  framing: string;
  /**
   * Headline security properties rendered above the diagram, without requiring
   * the reader to select a component.
   */
  keyProperties: readonly { label: string; text: string }[];
  bands: readonly ArchitectureBand[];
  components: readonly ArchitectureComponent[];
  edges: readonly ArchitectureEdge[];
}

/** A recorded gap. Deliberately not a component: gaps are not nodes. */
export interface KnownGap {
  id: string;
  title: string;
  /**
   * What the older record said. Kept separate from `currentDisposition` so the
   * page can show that a gap was once recorded WITHOUT implying it is still open
   * on that basis.
   */
  recordedAtReview: string;
  /**
   * What the newest evidence says. "Not independently confirmed" is a valid and
   * frequently correct value, and it must never be upgraded to a verdict.
   */
  currentDisposition: string;
  dispositionConfidence: "confirmed" | "unconfirmed";
  sourceNote: string;
}

/* ========================================================================== */
/* Gate and readiness state                                                    */
/* ========================================================================== */

export interface GateState {
  id: string;
  /** Verbatim recorded status. Never paraphrased into something softer. */
  recordedStatus: string;
  /** The gate's role, in plain language. */
  role: string;
  /** Why it is in this state, in one sentence. */
  note: string;
}

/**
 * The recorded gate and release state.
 *
 * Every value here is transcribed from a named project record. The strings are
 * deliberately the RECORDED words ("NOT ACCEPTED / BLOCKED") rather than a
 * softened paraphrase, because a softer string is how a blocked gate becomes
 * "nearly passed" in a reader's memory.
 */
export const gateStates: readonly GateState[] = [
  {
    id: "G3",
    recordedStatus: "NOT ACCEPTED / BLOCKED",
    role: "The major boundary for MVP claims and capability expansion.",
    note: "No gate ruling has been issued. A remediation evidence package exists as a submission for re-adjudication, and an engineering submission is not an acceptance.",
  },
  {
    id: "AM-4-R3",
    recordedStatus: "NOT EXECUTED",
    role: "The next engineering action named by the canonical roadmap.",
    note: "The roadmap records this packet as not executed, and a governance record explicitly declines to reinterpret the weld records as discharging it.",
  },
  {
    id: "Central research thesis",
    recordedStatus: "UNRESOLVED",
    role: "Whether the cognitive architecture measurably outperforms prompting.",
    note: "Self-graded. It cannot be settled by the system making the claim about itself.",
  },
  {
    id: "Source-release gate",
    recordedStatus: "CLOSED",
    role: "Gates publication of the source repository as a release artifact.",
    note: "The repository is published and linked from this site. Publication is not a release approval, and the residuals stay on the record.",
  },
  {
    id: "RSI implementation",
    recordedStatus: "NOT STARTED",
    role: "The recursive self-improvement substrate described by Blueprint v4.2.",
    note: "Forbidden before G3 passes. Designing an improvement workflow is not beginning it.",
  },
];

/* ========================================================================== */
/* Roadmap spine                                                               */
/* ========================================================================== */

export interface RoadmapPhase {
  id: string;
  gate: string;
  label: string;
  /**
   * The gate's recorded disposition, or null when the record does not state one.
   * A null is rendered explicitly as "not recorded" rather than as a pass.
   */
  recordedStatus: string | null;
  /** True only where a recorded pass exists. Never inferred from design work. */
  passed: boolean;
}

export const roadmapPhases: readonly RoadmapPhase[] = [
  { id: "P0", gate: "G0", label: "Baseline and reproducibility", recordedStatus: "PASS", passed: true },
  { id: "P1", gate: "G1", label: "Architecture and migration seams", recordedStatus: "PASS", passed: true },
  { id: "P2", gate: "G2", label: "Born-gated Runtime walking skeleton", recordedStatus: "PASS", passed: true },
  { id: "P3", gate: "G3", label: "Universal Broker closure and MVP", recordedStatus: "BLOCKED", passed: false },
  { id: "P4", gate: "G4", label: "Mission, Scope and evidence depth", recordedStatus: null, passed: false },
  { id: "P5", gate: "G5", label: "Falsification, WorldModel and replanning", recordedStatus: null, passed: false },
  { id: "P6", gate: "G6", label: "Student shadow mode and bounded learning", recordedStatus: null, passed: false },
  { id: "P7", gate: "G7", label: "Arena / RedTeam parity", recordedStatus: null, passed: false },
  { id: "P8", gate: "G8", label: "Evaluation", recordedStatus: null, passed: false },
  { id: "P9", gate: "G9", label: "Consolidation and deletion", recordedStatus: null, passed: false },
  { id: "P10", gate: "G10", label: "Advanced capabilities", recordedStatus: null, passed: false },
];

/** How work actually advances. Rendered verbatim next to the phase strip. */
export const phaseSequencingRule =
  "Implementation remains sequential: task → evidence → independent audit → gate → next task. No later roadmap phase is authorized merely because its design is complete.";

/* ========================================================================== */
/* Architecture A — existing / documented current state                        */
/* ========================================================================== */

export const currentArchitecture: ArchitectureDiagramModel = {
  view: "current",
  title: "Existing architecture · Documented current state",
  statusLabel: "Documented snapshot",
  framing:
    "This is a documented snapshot taken from the project's reviewed handoff and audit records. It is not a fresh confirmation that every stage still behaves as described at the latest checkout, and it is not a demonstration of the central research claim.",

  /**
   * ALWAYS-VISIBLE PROPERTIES, rendered above the diagram in both views.
   *
   * These are the handful of security properties a reader must not have to
   * click to discover. They sit in each node's `invariant` field too, but an
   * invariant that only appears after selecting a component is an invariant most
   * readers never see — and "the broker denies by default" is precisely the
   * claim that must never be hidden behind an interaction.
   */
  keyProperties: [
    {
      label: "Authorization is deny-by-default",
      text: "The Broker is the single policy decision point, and it denies unless the request is affirmatively authorized.",
    },
    {
      label: "One execution route",
      text: "exec/ is the single policy enforcement point and the sole owner of process, network and filesystem primitives.",
    },
    {
      label: "A sandbox constrains, it does not authorize",
      text: "Sandbox mechanisms sit beneath the enforcement point and can never grant permission.",
    },
    {
      label: "Evidence is never an authorization",
      text: "Records describe what happened and on what authority. They do not permit an action.",
    },
  ],

  bands: [
    {
      id: "loop",
      label: "Documented canonical runtime · fixed ten-stage sequence",
      caption: "Stages are fixed and ordered. What each stage does is a separate question from whether it does it.",
      componentIds: [
        "op", "cli", "runtime",
        "observe", "worldmodel_read", "student", "planner",
        "broker", "pep", "sandbox", "capability", "environment",
        "receipt", "worldmodel_integrate", "contradiction", "replan",
      ],
      emphasis: "canonical",
    },
    {
      id: "legacy",
      label: "Separate legacy entry and execution paths",
      caption: "Wired, and not proven to consult the canonical Broker. Kept visually separate on purpose.",
      componentIds: ["legacy_entry", "legacy_autonomous", "legacy_clients"],
      emphasis: "separate",
    },
    {
      id: "evaluation",
      label: "Evaluation plane",
      caption: "A consumer of evidence. Not a second brain and not a second production runtime.",
      componentIds: ["arena"],
      emphasis: "separate",
    },
  ],

  components: [
    {
      id: "op",
      label: "Operator",
      stageLabel: "entry",
      responsibility: "Declares the mission and the engagement envelope from outside the system.",
      status: "documented_in_reviewed_snapshot",
      trustRole: "proposal",
      invariant: "Operator intent is an input to validation, never a bypass of the canonical Runtime.",
      limitation: "Whether operator-supplied mission data is fully validated before use is not established.",
      evidenceRequired: "A demonstration that malformed or out-of-scope mission input is refused rather than merely flagged.",
      sourceNote: "Raphael Handoff v4.1 — §2 causal chain.",
    },
    {
      id: "cli",
      label: "CLI / operator interface",
      responsibility: "The single operator-facing surface that starts a run and observes its outcome.",
      status: "documented_in_reviewed_snapshot",
      trustRole: "proposal",
      invariant: "One canonical CLI. No second operator surface may start an effect-bearing run.",
      limitation: "A legacy loop sits behind an environment flag, so the single-CLI rule coexists with a compatibility path.",
      evidenceRequired: "Static and loaded import-closure evidence that no alternate entry starts an episode.",
      sourceNote: "Raphael Handoff v4.1 — §3 frozen architecture.",
    },
    {
      id: "runtime",
      label: "RaphaelRuntime",
      stageLabel: "thin sequencer",
      responsibility: "Owns stage order, lifecycle and termination. Sequences the loop and nothing more.",
      status: "implemented_acceptance_pending",
      trustRole: "orchestration",
      invariant: "A thin sequencer, not a second cognitive model. No Runtime-wide ungated execution mode.",
      limitation: "Presence and stage count were verified statically. That the stages execute in that order on a live run was not verified.",
      evidenceRequired: "A recorded live run showing the ordered stages executing in sequence.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "observe",
      label: "Observe",
      stageLabel: "1",
      responsibility: "Collects observations about the target environment at the start of each loop iteration.",
      status: "documented_in_reviewed_snapshot",
      trustRole: "proposal",
      invariant: "Observations are inputs to reasoning and never an authorization.",
      limitation: "Observation completeness is not characterised in the records read for this page.",
      evidenceRequired: "A characterisation of what is observed, and what is deliberately not.",
      sourceNote: "Raphael Handoff v4.1 — §2 frozen stage order.",
    },
    {
      id: "worldmodel_read",
      label: "WorldModel read",
      stageLabel: "2",
      responsibility: "Reads mission-scoped belief state so later stages reason over what is believed.",
      status: "partial_not_yet_demonstrated",
      trustRole: "proposal",
      invariant: "Beliefs must be evidence-backed. Unsupported assertions must not silently become trusted state.",
      limitation: "WorldModel integration is documented as deliberately minimal.",
      evidenceRequired: "A demonstrated belief transition in which a claim is promoted only on evidence.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "student",
      label: "Student candidate",
      stageLabel: "3",
      responsibility: "Proposes candidate directions for consideration by the planner.",
      status: "partial_not_yet_demonstrated",
      trustRole: "proposal",
      invariant: "The Student never authorizes actions and never writes WorldModel beliefs directly.",
      limitation: "At the reviewed snapshot candidate output was recording-only and was not fed into planner request selection.",
      evidenceRequired: "Evidence of a bounded shadow mode in which candidate output is captured without influencing selection.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "planner",
      label: "Planner request",
      stageLabel: "4",
      responsibility: "Constructs the ActionRequest that the broker will evaluate.",
      status: "partial_not_yet_demonstrated",
      trustRole: "proposal",
      invariant: "The planner proposes and can never authorize its own proposal.",
      limitation: "At the reviewed snapshot this stage constructed a deterministic ActionRequest rather than invoking a planner decision method. A complete autonomous planning loop is not demonstrated.",
      evidenceRequired: "A recorded run showing planner-selected actions under a declared decision contract.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "broker",
      label: "CapabilityBroker",
      stageLabel: "5 · PDP",
      responsibility: "The policy decision point. Decides whether an action is authorized. Never executes it.",
      status: "implemented_acceptance_pending",
      trustRole: "authorization",
      invariant: "The single Policy Decision Point. Deny by default. Scope is a constraint at this stage, never a second decision point.",
      limitation: "A pinned instrument digest for this component drifted from the tree, so its historical semantics cannot be assumed to be the current code.",
      evidenceRequired: "Exhaustive call-graph evidence that no effect-bearing path bypasses the broker.",
      sourceNote: "Raphael Handoff v4.1 — §3 locked rules; frozen instrument drift record.",
    },
    {
      id: "pep",
      label: "exec/ PEP",
      stageLabel: "6 · PEP",
      responsibility: "The policy enforcement point, and the sole owner of process, network and filesystem primitives.",
      status: "implemented_acceptance_pending",
      trustRole: "enforcement",
      invariant:
        "A single enforcement point distinct from the decision point, and the sole owner of process, network and filesystem primitives. No second entry may reach a primitive.",
      limitation: "Single ownership holds inside the canonical import closure. A substantial number of effect files sit outside it, and some code called dead is only established as dead by import failure.",
      evidenceRequired: "A perimeter classification ruling, plus proof of zero reference before any deletion claim.",
      sourceNote: "Raphael Handoff v4.1 — §3 locked rules; architecture assessment ARCH-001.",
    },
    {
      id: "sandbox",
      label: "Sandbox",
      stageLabel: "mechanism",
      responsibility: "Constrains execution once the enforcement point has decided.",
      status: "known_issue_at_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "A sandbox is a mechanism beneath the enforcement point and is never an authorization authority.",
      limitation:
        "At the reviewed snapshot the sandbox receipt check bound only an identifier, the stored status and the target — not capability, action type, method or arguments. Newer evidence reports this as remediated; see the known-gaps panel for what that does and does not establish.",
      evidenceRequired: "An adversarial battery showing same-identifier requests with differing capability, action type, method or arguments are denied.",
      sourceNote: "Raphael Handoff v4.1 — §9 F1 defect.",
    },
    {
      id: "capability",
      label: "Capability execution",
      stageLabel: "admitted",
      responsibility: "Performs an admitted action once authorization and enforcement have both permitted it.",
      status: "documented_in_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "Only capabilities admitted by the broker and reached through the enforcement point may run.",
      limitation: "The sandboxed capability was not assembled into the full default walking-skeleton path at the reviewed snapshot.",
      evidenceRequired: "A recorded default-path run in which the admitted capability executes under mediation.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "environment",
      label: "Target environment",
      responsibility: "The environment in which an admitted capability would have its effect.",
      status: "documented_in_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "The environment is reached only through the enforcement point.",
      limitation: "Environment reachability outside the mediated path is an open perimeter question, not a settled fact.",
      evidenceRequired: "A perimeter record and an exhaustive reachability argument.",
      sourceNote: "Raphael Handoff v4.1 — §10 F2 legacy execution plane.",
    },
    {
      id: "receipt",
      label: "Receipt",
      stageLabel: "7",
      responsibility: "Mints the evidence receipt, artifact reference and provenance for what was attempted.",
      status: "implemented_acceptance_pending",
      trustRole: "evidence",
      invariant: "Evidence never grants authorization. Receipts are minted at the enforcement point, not by the capability.",
      limitation: "Implemented with an append-only bounded store and deterministic identities, but not gate-accepted.",
      evidenceRequired: "Gate acceptance of the evidence layer, including the absent evidence→authorization edge staying absent.",
      sourceNote: "Raphael Handoff v4.1 — §5 evidence v1.",
    },
    {
      id: "worldmodel_integrate",
      label: "WorldModel integration",
      stageLabel: "8",
      responsibility: "Folds evidence-backed state back into the WorldModel.",
      status: "partial_not_yet_demonstrated",
      trustRole: "evidence",
      invariant: "Only evidence-backed claims are integrated. Assertions are quarantined rather than believed.",
      limitation: "Integration is documented as deliberately minimal, and the full enforcement depth is not demonstrated.",
      evidenceRequired: "A demonstrated minimum-enforcement path in which an unbacked claim cannot enter belief state.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "contradiction",
      label: "Contradiction",
      stageLabel: "9",
      responsibility: "Detects contradiction between the belief state and newly integrated evidence.",
      status: "partial_not_yet_demonstrated",
      trustRole: "evidence",
      invariant: "Falsification is the sole mover of epistemic classes. Nothing else may promote or demote a claim.",
      limitation: "At the reviewed snapshot this was a stub or terminator pre-empting deeper falsification work.",
      evidenceRequired: "A demonstrated contradiction that changes a claim's epistemic class.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "replan",
      label: "Replan",
      stageLabel: "10",
      responsibility: "Produces the next decision when the belief state or evidence demands a different one.",
      status: "partial_not_yet_demonstrated",
      trustRole: "proposal",
      invariant: "A replan proposes a new ActionRequest and re-enters authorization rather than bypassing it.",
      limitation: "The full replan effect is recorded as not yet demonstrated; the handler terminated early at the reviewed snapshot.",
      evidenceRequired: "A recorded run where a contradiction visibly changes the next authorized action.",
      sourceNote: "Raphael Handoff v4.1 — §8 control-plane reality.",
    },
    {
      id: "legacy_entry",
      label: "API / CI / bridge entry points",
      stageLabel: "legacy",
      responsibility: "Noncanonical entry points that start execution outside the canonical runtime.",
      status: "known_issue_at_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "Every entry that can cause an effect must pass the one canonical decision point.",
      limitation:
        "A wired legacy execution plane exists that is not proven to be a second decision point and does not consult the canonical Broker. A later record implements a perimeter record only: the plane was not deleted and not refactored.",
      evidenceRequired: "An authority ruling on the perimeter, then zero-reference proof before any deletion.",
      sourceNote: "Raphael Handoff v4.1 — §10 F2; G3 remediation perimeter record.",
    },
    {
      id: "legacy_autonomous",
      label: "Autonomous mode / chains",
      stageLabel: "legacy",
      responsibility: "Chained autonomous execution reached through the legacy entry points.",
      status: "known_issue_at_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "Chained execution must not acquire authority the canonical loop does not have.",
      limitation: "Recorded as a wired execution plane outside the canonical perimeter; its mediation and disposition remain an open governance question.",
      evidenceRequired: "Deployment verification and an authority ruling recorded against the perimeter record.",
      sourceNote: "Raphael Handoff v4.1 — §10 F2 disposition.",
    },
    {
      id: "legacy_clients",
      label: "Legacy tool and execution clients",
      stageLabel: "legacy",
      responsibility: "Downstream clients of the legacy chains, including tool and process managers.",
      status: "known_issue_at_reviewed_snapshot",
      trustRole: "mechanism",
      invariant: "Clients must not be able to reach a primitive that bypasses the enforcement point.",
      limitation:
        "The records require a perimeter record and later fold or deletion at the consolidation phase. Current disposition is not independently confirmed on this site.",
      evidenceRequired: "Zero-reference proof followed by atomic delete, tests and recorded architecture checks.",
      sourceNote: "Raphael Handoff v4.1 — §18 legacy and deletion rule.",
    },
    {
      id: "arena",
      label: "Arena / RedTeam / evaluation",
      stageLabel: "evaluation",
      responsibility: "Supplies environments, scoring and measurement, and consumes evidence produced elsewhere.",
      status: "partial_not_yet_demonstrated",
      trustRole: "evaluation",
      invariant: "Arena is environment, scoring and measurement. It is never a second brain, and the canonical runtime closure stays free of it.",
      limitation: "Parity with the canonical Runtime is not proven. The measured effect could not be attributed because the dataset is missing and the instrument drifted.",
      evidenceRequired: "A reproducible campaign result on a present dataset, plus parity evidence against the canonical runtime.",
      sourceNote: "Raphael Handoff v4.1 — §3 locked rules; assessment EVAL-001.",
    },
  ],

  edges: [
    { from: "op", to: "cli", style: "trusted" },
    { from: "cli", to: "runtime", style: "trusted" },
    { from: "runtime", to: "observe", style: "trusted" },
    { from: "observe", to: "worldmodel_read", style: "trusted", label: "observations" },
    { from: "worldmodel_read", to: "student", style: "trusted", label: "belief state" },
    { from: "student", to: "planner", style: "trusted", label: "candidates (recording-only)" },
    { from: "planner", to: "broker", style: "trusted", label: "ActionRequest" },
    { from: "broker", to: "pep", style: "trusted", label: "allow / deny" },
    { from: "pep", to: "sandbox", style: "trusted" },
    { from: "sandbox", to: "capability", style: "trusted" },
    { from: "capability", to: "environment", style: "trusted" },
    { from: "environment", to: "receipt", style: "trusted", label: "outcome" },
    { from: "receipt", to: "worldmodel_integrate", style: "trusted" },
    { from: "worldmodel_integrate", to: "contradiction", style: "trusted" },
    { from: "contradiction", to: "replan", style: "trusted" },
    { from: "replan", to: "observe", style: "feedback", label: "next loop, if applicable" },
    { from: "cli", to: "legacy_entry", style: "legacy", label: "legacy path — disposition needs evidence" },
    { from: "legacy_entry", to: "legacy_autonomous", style: "legacy" },
    { from: "legacy_autonomous", to: "legacy_clients", style: "legacy" },
    { from: "receipt", to: "arena", style: "guarded", label: "evidence for evaluation" },
  ],
};

/* ========================================================================== */
/* Architecture B — hypothetical complete target (Blueprint v4.2)             */
/* ========================================================================== */

/**
 * TARGET VIEW STATUS CONSTRAINT
 * -----------------------------
 * Blueprint v4.2 is a proposal. Every component below is `not_yet_implemented`
 * or `partial_not_yet_demonstrated`. Nothing in this object may claim that the
 * target design exists in the assessed system.
 */
export const targetArchitecture: ArchitectureDiagramModel = {
  view: "target",
  title: "Target architecture · Blueprint v4.2 · Proposed, not implemented",
  statusLabel: "Proposed, not implemented",
  framing:
    "This is the intended destination if every prerequisite phase and acceptance gate is completed. It does not represent current production readiness, and no component on it is built. A complete design is not an authorization to build it.",

  keyProperties: [
    {
      label: "Authorization is deny-by-default",
      text: "The Broker is the single policy decision point, and Mission, Scope and ActionSpec jointly constrain the decision.",
    },
    {
      label: "One execution route",
      text: "exec/ is the single policy enforcement point; no planner, evaluator or legacy entry point receives an alternate execution route.",
    },
    {
      label: "A sandbox constrains, it does not authorize",
      text: "Sandbox mechanisms sit beneath the enforcement point and can never grant permission.",
    },
    {
      label: "Evidence is never an authorization",
      text: "Records describe what happened and on what authority. They do not permit an action.",
    },
    {
      label: "Accepted learning is proposal-only",
      text: "It may influence evolvable proposal surfaces in a later run, and can never rewrite authorization, the Runtime, the enforcement point, evidence identity or release authority.",
    },
  ],

  bands: [
    {
      id: "task-loop",
      label: "One canonical production loop",
      caption: "Proposed. Same ten stages, with each stage's stated responsibility completed rather than stubbed.",
      componentIds: [
        "t_operator", "t_cli", "t_mission", "t_runtime",
        "t_observe", "t_read", "t_student", "t_plan", "t_pdp", "t_pep",
        "t_sandbox", "t_capability", "t_environment",
        "t_receipt", "t_ledger", "t_worldmodel", "t_falsification", "t_replan", "t_halt",
        "t_guard",
      ],
      emphasis: "proposed",
    },
    {
      id: "improvement",
      label: "Governed improvement workflow — separate outer loop",
      caption: "Proposed and NOT operational. It is not part of the production task loop.",
      componentIds: [
        "r_run", "r_evidence", "r_experience", "r_replay",
        "r_candidate", "r_eval", "r_gate", "r_human", "r_version", "r_deploy",
        "r_protected", "r_evolvable",
      ],
      emphasis: "separate",
    },
  ],

  components: [
    {
      id: "t_operator",
      label: "Operator / human oversight",
      responsibility: "Sets the objective, target envelope, allowed scope, constraints and halt conditions.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant: "Mission and plan data are inputs requiring validation, and the operator interface cannot bypass the canonical Runtime.",
      limitation: "Proposed. The reviewed records do not describe a completed mission and scope capture surface.",
      evidenceRequired: "A demonstrated mission capture path that validates input and cannot bypass the Runtime.",
      sourceNote: "Blueprint v4.2 — operator interface and mission.",
    },
    {
      id: "t_cli",
      label: "CLI / operator interface",
      responsibility: "The single surface through which a mission is declared and a run is observed.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "One canonical interface. No alternate surface may start an effect-bearing run.",
      limitation:
        "Proposed. The reviewed records describe a compatibility path behind a legacy environment flag, and the proposed design removes it in favour of a single entry.",
      evidenceRequired: "Static and loaded import-closure evidence that no alternate entry exists.",
      sourceNote: "Blueprint v4.2 — operator interface and mission.",
    },
    {
      id: "t_mission",
      label: "Mission + Scope + halt conditions",
      responsibility: "Converts operator intent into the constraints the runtime must satisfy, including when to stop.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "Scope is a constraint on authorization, never a second authorization authority.",
      limitation: "Proposed. Scope enforcement depth beyond the reviewed snapshot is not established.",
      evidenceRequired: "Demonstrated enforcement of scope and halt conditions on a live run.",
      sourceNote: "Blueprint v4.2 — Mission, Scope and halt conditions.",
    },
    {
      id: "t_runtime",
      label: "One RaphaelRuntime",
      responsibility: "Owns stage order, lifecycle, termination and stage contracts, and nothing else.",
      status: "not_yet_implemented",
      trustRole: "orchestration",
      invariant:
        "Sequence, lifecycle and termination only. A thin sequencer, not a second cognitive model, with no Runtime-wide ungated execution mode.",
      limitation:
        "Proposed. Stage ordering is documented, but the completed lifecycle and termination contract is not, and a live run showing the fixed sequence has not been demonstrated.",
      evidenceRequired: "A recorded run showing the fixed sequence and halt behaviour.",
      sourceNote: "Blueprint v4.2 — protected invariants.",
    },
    {
      id: "t_observe",
      label: "Observe",
      stageLabel: "1",
      responsibility: "Collects observations from the target environment.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "Observation is never authorization.",
      limitation:
        "Proposed. The records do not characterise what is observed, what is deliberately not observed, or how an observation reaches evidence.",
      evidenceRequired: "A recorded observation set traceable into evidence.",
      sourceNote: "Blueprint v4.2 — canonical production loop.",
    },
    {
      id: "t_read",
      label: "Read WorldModel",
      stageLabel: "2",
      responsibility: "Reads mission-scoped belief state built only from evidence-backed information.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "Only evidence-backed claims may enter belief state.",
      limitation:
        "Proposed. WorldModel integration is documented as deliberately minimal, so the belief state described here is not built.",
      evidenceRequired: "A belief state demonstrably free of unsupported assertions.",
      sourceNote: "Blueprint v4.2 — cognitive layer.",
    },
    {
      id: "t_student",
      label: "Student candidate",
      stageLabel: "3",
      responsibility: "Proposes candidate directions. Proposal only.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "The Student never authorizes actions and never writes trusted WorldModel beliefs directly.",
      limitation:
        "Proposed, and explicitly gated: bounded Student learning is forbidden before G3 passes and remains a later phase.",
      evidenceRequired: "Shadow-mode evidence that candidate output is captured without influencing selection.",
      sourceNote: "Blueprint v4.2 — cognitive layer; roadmap §37 pre-G3 prohibitions.",
    },
    {
      id: "t_plan",
      label: "Planner request",
      stageLabel: "4",
      responsibility: "Proposes an action and a plan for the decision point to evaluate.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "The planner proposes and can never authorize its own proposal.",
      limitation:
        "Proposed. The reviewed snapshot constructs a deterministic ActionRequest instead of invoking a planner decision method, and no planner-selected action is demonstrated.",
      evidenceRequired: "Planner-selected actions under a declared decision contract, distinct from deterministic construction.",
      sourceNote: "Blueprint v4.2 — cognitive layer.",
    },
    {
      id: "t_pdp",
      label: "CapabilityBroker / PDP",
      stageLabel: "5",
      responsibility: "The single Policy Decision Point. Decides; never executes.",
      status: "not_yet_implemented",
      trustRole: "authorization",
      invariant:
        "Deny by default. Mission, Scope and ActionSpec jointly constrain the decision, and no other component is a decision point.",
      limitation:
        "Proposed. A broker is documented as the canonical decision point, but exhaustive evidence that no effect-bearing path bypasses it is not established.",
      evidenceRequired: "Exhaustive call-graph evidence that no effect-bearing path bypasses the broker.",
      sourceNote: "Blueprint v4.2 — authorization and execution layer.",
    },
    {
      id: "t_pep",
      label: "exec/ PEP",
      stageLabel: "6",
      responsibility: "The single Policy Enforcement Point and sole owner of execution primitives.",
      status: "not_yet_implemented",
      trustRole: "enforcement",
      invariant:
        "No planner, verifier, evaluator, legacy entry point or cognitive component receives an alternate environment-execution route.",
      limitation:
        "Proposed. Single ownership holds inside the canonical import closure; a substantial number of effect files sit outside it and their disposition is unresolved.",
      evidenceRequired: "Perimeter classification and proof that every primitive is reached only through the enforcement point.",
      sourceNote: "Blueprint v4.2 — authorization and execution layer.",
    },
    {
      id: "t_sandbox",
      label: "Sandbox",
      responsibility: "Supplies enforcement mechanisms beneath the enforcement point.",
      status: "not_yet_implemented",
      trustRole: "mechanism",
      invariant: "A sandbox cannot grant permission. It constrains; it does not authorize.",
      limitation:
        "Proposed. A request-binding defect was recorded against the reviewed sandbox; newer evidence reports remediation that is not independently confirmed.",
      evidenceRequired: "Evidence that sandbox mechanisms cannot satisfy a request the broker denied.",
      sourceNote: "Blueprint v4.2 — authorization and execution layer.",
    },
    {
      id: "t_capability",
      label: "Admitted capability",
      responsibility: "Performs the action the decision point admitted.",
      status: "not_yet_implemented",
      trustRole: "mechanism",
      invariant: "Only broker-admitted capabilities execute, and only through the enforcement point.",
      limitation:
        "Proposed. The sandboxed capability was not assembled into the default walking-skeleton path at the reviewed snapshot.",
      evidenceRequired: "A mediated execution trace for each admitted capability class.",
      sourceNote: "Blueprint v4.2 — canonical production loop.",
    },
    {
      id: "t_environment",
      label: "Environment / target",
      responsibility: "The environment in which an admitted action takes effect.",
      status: "not_yet_implemented",
      trustRole: "mechanism",
      invariant: "Reached only through the enforcement point.",
      limitation:
        "Proposed. Reachability outside the mediated path is an open perimeter question recorded against the legacy execution plane.",
      evidenceRequired: "A reachability argument from every environment entry to the enforcement point.",
      sourceNote: "Blueprint v4.2 — canonical production loop.",
    },
    {
      id: "t_receipt",
      label: "PEP-minted receipt",
      stageLabel: "7",
      responsibility: "Mints the linked receipt, artifact reference and provenance at the enforcement point.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant: "Evidence is not authorization, and receipts are minted by the enforcement point rather than the capability.",
      limitation:
        "Proposed. An evidence layer is implemented but not gate-accepted, and the full receipt, artifact and provenance linkage described here is not demonstrated.",
      evidenceRequired: "Linked receipt, artifact and provenance records that resolve to the mission and authorization that caused them.",
      sourceNote: "Blueprint v4.2 — evidence and provenance layer.",
    },
    {
      id: "t_ledger",
      label: "Evidence records",
      responsibility: "Holds append-only, integrity-checkable records of what happened.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant:
        "Records are immutable except through an audited retirement path, and remain traceable to mission, authorization, execution and resulting claims.",
      limitation:
        "Proposed. An append-only bounded store with deterministic identities is implemented but not gate-accepted.",
      evidenceRequired: "An integrity check that fails on mutation, demonstrated on a real record set.",
      sourceNote: "Blueprint v4.2 — evidence and provenance layer.",
    },
    {
      id: "t_worldmodel",
      label: "WorldModel integration",
      stageLabel: "8",
      responsibility: "Integrates evidence-backed claims and quarantines everything else.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant: "Unsupported assertions do not silently become trusted beliefs.",
      limitation:
        "Proposed. Integration is documented as deliberately minimal, and assertion quarantine is described rather than demonstrated.",
      evidenceRequired: "A demonstration that an unbacked claim is quarantined rather than integrated.",
      sourceNote: "Blueprint v4.2 — evidence and provenance layer.",
    },
    {
      id: "t_falsification",
      label: "Contradiction / falsification",
      stageLabel: "9",
      responsibility: "Evaluates contradiction and knowledge-state transitions.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant: "Falsification is the sole epistemic promotion and demotion engine.",
      limitation: "Proposed. This is the central capability the reviewed snapshot does not demonstrate.",
      evidenceRequired: "A contradiction that demonstrably changes a claim's epistemic class.",
      sourceNote: "Blueprint v4.2 — cognitive layer.",
    },
    {
      id: "t_replan",
      label: "Deterministic replanning",
      stageLabel: "10",
      responsibility: "Produces a causally justified replan from the current evidence and contradiction state.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant: "A replan re-enters authorization as a new proposal rather than acting on the previous authorization.",
      limitation:
        "Proposed. The reviewed replan handler terminated early, and the causal justification this design requires is not demonstrated.",
      evidenceRequired: "A recorded replan whose causal justification resolves to specific evidence.",
      sourceNote: "Blueprint v4.2 — cognitive layer.",
    },
    {
      id: "t_halt",
      label: "Halt / return control",
      responsibility: "Stops the loop when stop conditions are satisfied and returns control to the operator.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant: "Stop conditions are declared in advance and honoured, not evaluated after the fact.",
      limitation:
        "Proposed. No run has been recorded halting on a declared stop condition without operator intervention.",
      evidenceRequired: "A run that halts on a declared stop condition without operator intervention.",
      sourceNote: "Blueprint v4.2 — mission halt conditions.",
    },
    {
      id: "t_guard",
      label: "Protected invariants",
      responsibility:
        "One Runtime, one loop, one decision point, one enforcement point. Evidence never authorizes. The Student never writes WorldModel beliefs.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant:
        "These constrain every runtime component and are not revisable by any candidate policy.",
      limitation:
        "Proposed. The machine-readable registry of protected surfaces that would enforce this is itself an unbuilt deliverable.",
      evidenceRequired: "A machine-readable protected-surface registry plus tests that reject modification of a protected surface.",
      sourceNote: "Blueprint v4.2 — protected vs evolvable surface.",
    },

    /* -------------------- governed improvement workflow -------------------- */
    {
      id: "r_run",
      label: "Completed task episodes",
      responsibility: "Supplies the completed episodes from which improvement work begins.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant: "Improvement input comes only from completed episodes, never from live speculative execution.",
      limitation: "Proposed, and forbidden before G3 passes.",
      evidenceRequired: "Recorded completed episodes with linked evidence.",
      sourceNote: "Blueprint v4.2 — governed improvement workflow.",
    },
    {
      id: "r_evidence",
      label: "EvidenceRecord",
      responsibility: "The execution and provenance authority. Answers what happened and on what authority.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant: "EvidenceRecord answers provenance and authority questions and is distinct from the experience model.",
      limitation: "Proposed. Distinct from ExperienceNode by design; conflating them is a recorded risk.",
      evidenceRequired: "Distinct record types whose queries cannot be satisfied by the other.",
      sourceNote: "Blueprint v4.2 — §15.2 experience model.",
    },
    {
      id: "r_experience",
      label: "ExperienceNode",
      responsibility: "Records decision history and search-tree state: which branch, from which state, with which outcome.",
      status: "not_yet_implemented",
      trustRole: "evidence",
      invariant:
        "ExperienceNode is not a replacement for EvidenceRecord. It answers decision-history and search-tree questions.",
      limitation:
        "Proposed, and explicitly forbidden before G3 passes: adding ExperienceNode infrastructure to production is a listed pre-G3 prohibition.",
      evidenceRequired: "Durable records with valid parent and child lineage and a reconstructible history.",
      sourceNote: "Blueprint v4.2 — §15.2 experience model; roadmap §37 pre-G3 prohibitions.",
    },
    {
      id: "r_replay",
      label: "Replay simulator",
      responsibility: "Reconstructs recorded state, choices and outcomes so candidate policies can be scored cheaply.",
      status: "not_yet_implemented",
      trustRole: "evaluation",
      invariant:
        "Replay presents only observations available at that prefix and returns recorded outcomes. A deterministic rerun from the same seed is explicitly not accepted as replay, and injecting historical text as prompt guidance is not equivalent to replay either.",
      limitation: "Proposed. There is no true replay world in the current records.",
      evidenceRequired: "A replay implementation demonstrably returning recorded outcomes rather than re-running the agent.",
      sourceNote: "Blueprint v4.2 — replay simulator definition.",
    },
    {
      id: "r_candidate",
      label: "Candidate ExplorationPolicy",
      responsibility: "Proposes a bounded policy over strategy parameters for evaluation.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant:
        "A first-class serialized object with a stable identity, content hash and lineage — not an implicit code path.",
      limitation: "Proposed. There is no first-class persistent ExplorationPolicy today.",
      evidenceRequired: "Serialized policies with stable identity, hash and lineage that a successor can reference.",
      sourceNote: "Blueprint v4.2 — §15.3 ExplorationPolicy contract.",
    },
    {
      id: "r_eval",
      label: "Protected evaluator",
      responsibility: "Scores candidates under matched resources, and holds the unseen holdout back.",
      status: "not_yet_implemented",
      trustRole: "evaluation",
      invariant:
        "The evaluator is protected from candidate modification. There is no candidate improvement evaluator today.",
      limitation: "Proposed. Evaluation on an unseen holdout is a later phase and requires a present dataset.",
      evidenceRequired: "An evaluator isolated from candidate modification, evaluated on unseen tasks and seeds.",
      sourceNote: "Blueprint v4.2 — protected evaluator and holdout.",
    },
    {
      id: "r_gate",
      label: "Acceptance gate",
      responsibility: "Requires independent evidence and evaluation before anything may be promoted.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant:
        "A high score on a single run is insufficient for acceptance. Promotion authority is protected and never self-modifiable.",
      limitation: "Proposed. There is no successor, promotion or rollback chain today.",
      evidenceRequired: "A recorded gate decision supported by independent evidence and evaluation.",
      sourceNote: "Blueprint v4.2 — promotion and release authority.",
    },
    {
      id: "r_human",
      label: "Human / governance release decision",
      responsibility: "Authorises promotion. Remains outside the self-modifiable surface.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant: "Human release authority is permanent and outside recursive modification.",
      limitation:
        "Proposed. No release decision has been recorded for any improvement workflow, because no such workflow exists to release.",
      evidenceRequired: "A recorded authorised decision naming the accountable authority.",
      sourceNote: "Blueprint v4.2 — §21.5 protected control surface.",
    },
    {
      id: "r_version",
      label: "Immutable policy successor",
      responsibility: "Carries hash, parent, supersedes, evidence and evaluation metadata for an accepted policy.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant: "Lineage is immutable and traceable. An accepted policy supersedes rather than overwrites.",
      limitation:
        "Proposed. No policy has ever been accepted, so no successor record exists to carry lineage.",
      evidenceRequired: "Successor records whose lineage resolves to a parent, an evaluation and an authorised decision.",
      sourceNote: "Blueprint v4.2 — ExplorationPolicy lineage.",
    },
    {
      id: "r_deploy",
      label: "Controlled deployment",
      responsibility: "Deploys an accepted policy with a known rollback target.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant: "Deployment is controlled and has a verified rollback path.",
      limitation:
        "Proposed. There is no promotion or rollback chain today, so no controlled deployment of a policy can be performed.",
      evidenceRequired: "A recorded deployment with a demonstrated rollback.",
      sourceNote: "Blueprint v4.2 — promotion and rollback chain.",
    },
    {
      id: "r_protected",
      label: "Never self-modifiable",
      responsibility:
        "Runtime, production loop, decision point, enforcement point, execution and provenance authority, WorldModel belief authority, evaluator and holdout, promotion gate, human release authority.",
      status: "not_yet_implemented",
      trustRole: "governance",
      invariant:
        "These remain outside recursive modification permanently. Any proposal to change this requires a new explicit decision record and is outside the roadmap by default.",
      limitation: "Proposed. The registry itself is protected: evolving a policy cannot rewrite the registry.",
      evidenceRequired: "A machine-readable registry and tests that reject any candidate change to a protected surface.",
      sourceNote: "Blueprint v4.2 — §15.6 and §21.5.",
    },
    {
      id: "r_evolvable",
      label: "Governed evolvable surfaces",
      responsibility:
        "ExplorationPolicy, candidate ordering, bounded strategy parameters, prompt and context assembly, knowledge weighting, experience selection.",
      status: "not_yet_implemented",
      trustRole: "proposal",
      invariant:
        "Accepted learning may influence only these surfaces. It cannot rewrite authorization rules, the Runtime, the enforcement point, evidence identity, the protected evaluator or release authority.",
      limitation:
        "Proposed. Because no policy has been accepted, no change confined to these surfaces has been demonstrated.",
      evidenceRequired: "Evidence that candidate changes are confined to the registered evolvable surfaces.",
      sourceNote: "Blueprint v4.2 — §15.6 protected vs evolvable surface.",
    },
  ],

  edges: [
    { from: "t_operator", to: "t_cli", style: "trusted" },
    { from: "t_cli", to: "t_mission", style: "trusted" },
    { from: "t_mission", to: "t_runtime", style: "trusted" },
    { from: "t_runtime", to: "t_observe", style: "trusted" },
    { from: "t_observe", to: "t_read", style: "trusted" },
    { from: "t_read", to: "t_student", style: "trusted" },
    { from: "t_student", to: "t_plan", style: "trusted" },
    { from: "t_plan", to: "t_pdp", style: "trusted", label: "proposal" },
    { from: "t_pdp", to: "t_pep", style: "trusted", label: "authorization" },
    { from: "t_pep", to: "t_sandbox", style: "trusted" },
    { from: "t_sandbox", to: "t_capability", style: "trusted" },
    { from: "t_capability", to: "t_environment", style: "trusted" },
    { from: "t_environment", to: "t_receipt", style: "trusted" },
    { from: "t_receipt", to: "t_ledger", style: "trusted" },
    { from: "t_ledger", to: "t_worldmodel", style: "trusted" },
    { from: "t_worldmodel", to: "t_falsification", style: "trusted" },
    { from: "t_falsification", to: "t_replan", style: "trusted" },
    { from: "t_replan", to: "t_observe", style: "feedback", label: "next loop" },
    { from: "t_replan", to: "t_halt", style: "feedback", label: "stop conditions satisfied" },
    { from: "t_guard", to: "t_pdp", style: "guarded", label: "constrains" },
    { from: "t_guard", to: "t_pep", style: "guarded", label: "constrains" },

    { from: "r_run", to: "r_evidence", style: "trusted" },
    { from: "r_run", to: "r_experience", style: "trusted" },
    { from: "r_experience", to: "r_replay", style: "trusted" },
    { from: "r_replay", to: "r_candidate", style: "trusted" },
    { from: "r_candidate", to: "r_eval", style: "trusted" },
    { from: "r_eval", to: "r_gate", style: "trusted" },
    { from: "r_gate", to: "r_human", style: "trusted" },
    { from: "r_human", to: "r_version", style: "trusted" },
    { from: "r_version", to: "r_deploy", style: "trusted" },
    { from: "r_deploy", to: "r_candidate", style: "feedback", label: "proposal-only influence in a later run" },
    { from: "r_candidate", to: "r_evolvable", style: "guarded", label: "must comply with" },
    { from: "r_protected", to: "r_gate", style: "guarded", label: "protected from candidate changes" },
  ],
};

/* ========================================================================== */
/* Known gaps — the sharpest recorded limitations                              */
/* ========================================================================== */

/**
 * GAPS, NOT NODES.
 *
 * Each entry separates what an older record stated from what newer evidence
 * says. Where newer evidence does not settle the present-day position, the
 * disposition says so and `dispositionConfidence` is "unconfirmed". This is the
 * mechanism that stops an old defect from being silently marked fixed because
 * newer documentation exists.
 */
export const knownGaps: readonly KnownGap[] = [
  {
    id: "F1",
    title: "Sandbox request-binding defect",
    recordedAtReview:
      "The reviewed handoff recorded this as proven and unfixed at the current HEAD. The sandbox receipt check verified only that an action identifier existed, that the stored status was AUTHORIZED, and that the stored target matched the request target. It did not bind capability, action type, method or arguments, so a request reusing an identifier with different content was not distinguished from the authorized one.",
    currentDisposition:
      "A later remediation record reports this implemented and proven, with six-dimension binding and an adversarial test battery added to the floor. Engineering self-reports are not gate acceptance: the recorded gate state remains NOT ACCEPTED / BLOCKED, and this site does not treat the defect as independently closed.",
    dispositionConfidence: "unconfirmed",
    sourceNote: "Raphael Handoff v4.1 §9; G3 remediation status record.",
  },
  {
    id: "F2",
    title: "Noncanonical legacy execution plane",
    recordedAtReview:
      "A wired execution plane existed outside the canonical runtime entry: API, CI and bridge entry points reached autonomous mode and chains, which reached legacy tool and execution clients. It was not proven to be a second decision point, but it did not consult the canonical Broker.",
    currentDisposition:
      "A later record implements this as a perimeter record only. The legacy plane was explicitly NOT deleted and NOT refactored, and its fold or deletion is deferred to a later consolidation phase with zero-reference proof required first. Current mediation state is therefore not independently confirmed on this site.",
    dispositionConfidence: "unconfirmed",
    sourceNote: "Raphael Handoff v4.1 §10 and §18; G3 remediation perimeter record.",
  },
  {
    id: "WM",
    title: "WorldModel integration depth",
    recordedAtReview:
      "Integration was documented as deliberately minimal, with assertion quarantine described rather than demonstrated.",
    currentDisposition:
      "No newer evidence read for this page establishes a completed minimum-enforcement path. Recorded here as partial rather than upgraded.",
    dispositionConfidence: "unconfirmed",
    sourceNote: "Raphael Handoff v4.1 §8.",
  },
  {
    id: "FALS",
    title: "Contradiction and replanning depth",
    recordedAtReview:
      "Contradiction and replan handlers were stubs or terminators pre-empting deeper falsification work, and the real falsification and replan effect was not demonstrated.",
    currentDisposition:
      "This is the capability the central research thesis depends on, and no newer evidence read for this page demonstrates it. The thesis remains UNRESOLVED.",
    dispositionConfidence: "unconfirmed",
    sourceNote: "Raphael Handoff v4.1 §8 and §16.",
  },
  {
    id: "EVAL",
    title: "Evaluation cannot be attributed",
    recordedAtReview:
      "The measurement contract was described as adversarially reviewed and strong, but no reproducible campaign result could be attributed because the canonical dataset was missing and the instrument had drifted.",
    currentDisposition:
      "Unchanged in the records read for this page. Arena parity with the canonical Runtime is likewise not proven.",
    dispositionConfidence: "unconfirmed",
    sourceNote: "Architecture assessment EVAL-001; Raphael Handoff v4.1 §16.",
  },
];

/* ========================================================================== */
/* RSI lane — governing rules                                                  */
/* ========================================================================== */

/**
 * The seven required explanations for the governed improvement workflow.
 *
 * These are rules the design must satisfy, not a description of a working
 * system. Each is a constraint on a future implementation.
 */
export const rsiRules: readonly { id: string; title: string; body: string }[] = [
  {
    id: "RSI-1",
    title: "Episodes supply evidence and experience",
    body: "Completed task episodes provide both evidence and structured experience. Nothing else may seed the improvement workflow.",
  },
  {
    id: "RSI-2",
    title: "EvidenceRecord and ExperienceNode are distinct",
    body: "EvidenceRecord answers provenance and authority questions. ExperienceNode records decision history and search-tree state — which branch, from which state, with which outcome. ExperienceNode is not a replacement for EvidenceRecord.",
  },
  {
    id: "RSI-3",
    title: "Replay is not regeneration, and not prompt injection",
    body: "Replay reconstructs recorded state and outcomes, presenting only the observations available at that prefix. A deterministic scenario rerun from the same seed is explicitly not accepted as a replay simulator, and inserting historical text as guidance is also not equivalent to replay.",
  },
  {
    id: "RSI-4",
    title: "One strong run does not earn acceptance",
    body: "Candidate policies may be proposed and evaluated, but a high score on a single run is insufficient for acceptance. Promotion requires protected evaluation and the required unseen holdout.",
  },
  {
    id: "RSI-5",
    title: "Promotion is a governed chain",
    body: "Promotion requires protected evaluation, the required unseen holdout, immutable version and lineage metadata, an authorized human decision, a controlled deployment, and a verified rollback path.",
  },
  {
    id: "RSI-6",
    title: "Learning may only touch evolvable surfaces",
    body: "Accepted learning can influence only explicitly evolvable proposal surfaces, and only as proposal-only influence in a later run. It cannot rewrite authorization rules, the Runtime, the enforcement point, evidence identity, the protected evaluator, or release authority.",
  },
  {
    id: "RSI-7",
    title: "Structure is not effective recursion",
    body: "Structural recursion and effective recursion require separate evidence. No recursion level may be claimed merely because an improvement workflow has been designed.",
  },
];

/** Shown wherever the RSI lane appears as current readiness information. */
export const rsiReadinessBanner = "RSI implementation: NOT STARTED";

/**
 * Substrate the current records explicitly do NOT contain. Rendered beside the
 * RSI lane so the absence is visible rather than inferred.
 */
export const rsiAbsentSubstrate: readonly string[] = [
  "No first-class persistent exploration policy",
  "No candidate improvement evaluator",
  "No successor, promotion or rollback chain",
  "No true replay world",
  "No structural or effective recursion evidence",
];

/* ========================================================================== */
/* Trust boundaries                                                            */
/* ========================================================================== */

export interface TrustBoundary {
  id: string;
  label: string;
  rule: string;
}

export const trustBoundaries: readonly TrustBoundary[] = [
  {
    id: "proposal",
    label: "Proposal",
    rule: "The planner, the Student and any candidate policy propose. None of them can authorize an action.",
  },
  {
    id: "authorization",
    label: "Authorization",
    rule: "The Broker is the single decision point, and it denies by default.",
  },
  {
    id: "execution",
    label: "Execution",
    rule: "The enforcement point is the single route to a process, network or filesystem primitive. A sandbox constrains execution; it cannot grant permission.",
  },
  {
    id: "evidence",
    label: "Evidence",
    rule: "Evidence records what happened and on what authority. Evidence is never itself an authorization.",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    rule: "Arena and RedTeam measure and consume evidence. They are never a second brain and never an alternate production runtime.",
  },
  {
    id: "governance",
    label: "Governance",
    rule: "Human release authority and the promotion gate are permanent, and lie outside every self-modifiable surface.",
  },
];

/* ========================================================================== */
/* Legend                                                                      */
/* ========================================================================== */

export interface LegendEntry {
  status: ComponentStatus;
  label: string;
  meaning: string;
}

/**
 * Every legend entry is a TEXT label as well as a colour. The page renders both,
 * so status is never communicated by colour alone.
 */
export const statusLegend: readonly LegendEntry[] = [
  {
    status: "documented_in_reviewed_snapshot",
    label: "Documented in reviewed snapshot",
    meaning: "Described in a reviewed project record. Not re-verified on this site.",
  },
  {
    status: "implemented_acceptance_pending",
    label: "Implemented, acceptance pending",
    meaning: "Present in the implementation. Gate acceptance is a separate governance decision.",
  },
  {
    status: "partial_not_yet_demonstrated",
    label: "Partial / not yet demonstrated",
    meaning: "Present in part, or present without a demonstration of the full behaviour.",
  },
  {
    status: "known_issue_at_reviewed_snapshot",
    label: "Known issue at reviewed snapshot",
    meaning: "Recorded as a defect at the reviewed snapshot. See the known-gaps panel for current disposition.",
  },
  {
    status: "current_disposition_unconfirmed",
    label: "Current disposition unconfirmed",
    meaning: "Newer evidence exists but does not settle the present-day status. Neither fixed nor still broken is claimed.",
  },
  {
    status: "not_yet_implemented",
    label: "Not yet implemented",
    meaning: "Not implemented. On the target view this describes every component.",
  },
];

/* ========================================================================== */
/* Sources                                                                     */
/* ========================================================================== */

export interface ArchitectureSource {
  document: string;
  role: string;
}

/**
 * The documents these diagrams were built from.
 *
 * Document NAMES and their role only. No local filesystem paths, remote names,
 * commit hashes or operational detail are published here — the site renders
 * this list verbatim.
 */
export const architectureSources: readonly ArchitectureSource[] = [
  {
    document: "Raphael Handoff v4.1",
    role: "Current-state handoff. Source for the documented runtime, the fixed ten-stage sequence, the recorded implementation gaps and the security-boundary findings shown in the existing architecture view.",
  },
  {
    document: "Raphael Master Roadmap v4.2 — Dual-Lane Execution and RSI Amendment",
    role: "Canonical target. Source for the blueprint architecture, the governed improvement workflow, the protected and evolvable surfaces, the phase and gate spine, and the recorded operating state.",
  },
  {
    document: "Architecture and viability assessment",
    role: "Readiness and gate evidence. Source for the recorded gate statuses, the blocked central research thesis and the evaluation findings that keep the current-state view qualified.",
  },
];

/** Date of the review that produced this content model. */
export const architectureLastReviewed = "2026-10-16";

/** The live project destination, preserved exactly as supplied. */
export const liveProjectUrl = "https://the-despicable-raphael-portal.vercel.app/";

/* ========================================================================== */
/* Derived helpers                                                             */
/* ========================================================================== */

export function getComponent(
  model: ArchitectureDiagramModel,
  id: string,
): ArchitectureComponent | undefined {
  return model.components.find((c) => c.id === id);
}

export function legendEntryFor(status: ComponentStatus): LegendEntry {
  const entry = statusLegend.find((l) => l.status === status);
  // Exhaustiveness at compile time: adding a status without a legend entry is a
  // type error rather than a silently unlabelled colour at runtime.
  if (!entry) throw new Error(`No legend entry for status: ${status}`);
  return entry;
}
