/**
 * RAPHAEL — Evolution Timeline content model.
 *
 * Transcribed from the portal's authoritative timeline document. Nothing in
 * this file is measured by this site: every value is a transcription of a
 * named project record, and every record is dated in the source register so a
 * reader can tell which document a claim came from.
 *
 * Two rules from the source document govern this file and are enforced by
 * tests:
 *
 *  1. The chronology is ONE project lineage. RAPHAEL 1, Sword & Shield,
 *     Rebirth, RAPHAEL 2.x and RAPHAEL v4.x are eras of one narrative, not
 *     parallel tracks and not a chain of drop-in upgrades.
 *  2. Dated status is only asserted where a source establishes it. The three
 *     origin eras carry no established date and say so; nothing is dated by
 *     guesswork.
 *
 * The deeper technical material (Docker inventory, the ten runtime stages, the
 * G0-G10 gate chain and the appendices) lives in `raphael-timeline-deep.ts`
 * so that the chronology stays readable on its own.
 */

export type DatePrecision = "exact" | "range" | "not_established";

export type EraId =
  | "origin"
  | "sword-shield"
  | "rebirth"
  | "r20"
  | "r21"
  | "v4"
  | "v41"
  | "v42"
  | "present";

/**
 * How strongly a milestone is established. These are deliberately drawn from
 * the source document's evidence vocabulary and are NOT the same axis as the
 * current-status panel: this describes the *claim*, that describes the
 * project's *state*.
 */
export type EvidenceClass =
  | "OWNER_RECALLED"
  | "DOCUMENTED_DESIGN"
  | "REPORTED_SNAPSHOT"
  | "AUDIT_FINDING"
  | "RECORDED_STATUS";

/** Visual family for an era marker. Never carries meaning by colour alone. */
export type EraAccent = "azure" | "cyan" | "violet" | "amber" | "blocked";

export interface Era {
  id: EraId;
  /** Explicit ordering key. Never derived from a display string. */
  order: number;
  /** Two-to-four word label used in the lineage strip and the mobile index. */
  shortLabel: string;
  /** Full era name used in the chronology rail and milestone chips. */
  title: string;
  /** Human date, or the explicit statement that none is established. */
  dateLabel: string;
  /**
   * Abbreviated date for the lineage strip, where nine nodes share one row
   * and the full month name would truncate. Never used to state a date the
   * records do not establish.
   */
  shortDate: string;
  undated: boolean;
  /** The "one sentence per era" summary from the source document. */
  oneSentence: string;
  accent: EraAccent;
}

export interface MilestoneDetail {
  historicalContext?: string;
  architecturalObjective?: string;
  changedFromPrevious?: string;
  components?: readonly string[];
  implementationEvidence?: string;
  verificationEvidence?: string;
  limitations?: readonly string[];
  significance: string;
  relationshipToLater?: string;
}

export interface Milestone {
  id: string;
  eraId: EraId;
  order: number;
  title: string;
  dateDisplay: string;
  datePrecision: DatePrecision;
  /** Why the date reads the way it does. Always present. */
  dateNote: string;
  summary: string;
  evidenceClass: EvidenceClass;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  /** The claim this milestone does NOT license a reader to make. */
  doesNotProve: string;
  /** Source-register ids supporting this entry. */
  sources: readonly string[];
  detail: MilestoneDetail;
}

export type SourceKind =
  | "OWNER_HISTORY"
  | "DATED_ARCHITECTURE"
  | "AUDIT"
  | "HANDOFF"
  | "ROADMAP"
  | "ASSESSMENT"
  | "PORTAL_RECORD";

export interface SourceRef {
  id: string;
  document: string;
  kind: SourceKind;
  date: string;
  role: string;
}

export const sourceRegister: readonly SourceRef[] = [
  {
    id: "timeline-doc",
    document: "RAPHAEL_EVOLUTION_TIMELINE.md",
    kind: "OWNER_HISTORY",
    date: "2026-10-19",
    role: "The lineage document this page transcribes. Combines owner-recollected history with dated architecture, audit and roadmap records.",
  },
  {
    id: "r2-arch",
    document: "RAPHAEL 2.pdf — RAPHAEL 2.0 Architecture",
    kind: "DATED_ARCHITECTURE",
    date: "2026-07-23",
    role: "State snapshot dated 23 July 2026, archived and exported 24 July 2026. Source for the original v2.0 diagram and the 14/14 Docker snapshot.",
  },
  {
    id: "audit-aug",
    document: "ARCHITECTURE_AUDITED_20260808.md",
    kind: "AUDIT",
    date: "2026-08-08",
    role: "v2.1.1 architecture illustration and module-level audit context dated 8 August 2026.",
  },
  {
    id: "roadmap-v4",
    document: "RAPHAEL_MASTER_ROADMAP_v4_DUAL_LANE.md",
    kind: "ROADMAP",
    date: "2026-09-04",
    role: "Canonical v4 architecture direction, including the single-runtime decision taken after two divergent paths were documented.",
  },
  {
    id: "handoff-v41",
    document: "RAPHAEL_HANDOFF_v4.1.md",
    kind: "HANDOFF",
    date: "2026-09-07",
    role: "Canonical runtime, the fixed ten-stage sequence, historical gate status and the known implementation limitations of the inspected lineage.",
  },
  {
    id: "roadmap-v42",
    document: "RAPHAEL_MASTER_ROADMAP_v4.2_RSI.md",
    kind: "ROADMAP",
    date: "2026-09-19",
    role: "Canonical v4.2 target, the governed-improvement design and the current-state appendix that records RSI as not started.",
  },
  {
    id: "e2e-oct",
    document: "RAPHAEL_E2E_AUDIT_20261004.md",
    kind: "AUDIT",
    date: "2026-10-04",
    role: "Environment-specific Docker, import-map, cold-start and evaluation-integrity observations for one inspected checkout.",
  },
  {
    id: "viability-oct",
    document: "RAPHAEL_VIABILITY_AND_SUCCESSOR_ASSESSMENT.md",
    kind: "ASSESSMENT",
    date: "2026-10-16",
    role: "Read-only lab/container, governance and readiness findings, using explicit VERIFIED / DOCUMENTED / PARTIAL / UNKNOWN / NOT PERFORMED categories.",
  },
  {
    id: "portal-oct",
    document: "Portal-side audit record",
    kind: "PORTAL_RECORD",
    date: "2026-10-18",
    role: "Public documentation accuracy, current blocker statements and the explicit limitation that the website cannot prove anything about Raphael's runtime.",
  },
];

export function sourceDocument(id: string): string {
  return sourceRegister.find((s) => s.id === id)?.document ?? id;
}

/** Source documents for a milestone, resolved to their published filenames. */
export function sourceDocumentsFor(milestone: Milestone): readonly string[] {
  return milestone.sources.map(sourceDocument);
}

export const lineageDisclaimer =
  "A project lineage, not a chain of drop-in upgrades. Dated where the records establish a date; undated where they do not.";

export const eras: readonly Era[] = [
  {
    id: "origin",
    order: 1,
    shortLabel: "Ultimate Skill",
    title: "RAPHAEL 1 — Ultimate Skill",
    dateLabel: "date not established",
    shortDate: "undated",
    undated: true,
    oneSentence:
      "The initial ambition: one agent identity capable of combining skills and tools.",
    accent: "azure",
  },
  {
    id: "sword-shield",
    order: 2,
    shortLabel: "Sword & Shield",
    title: "Sword & Shield",
    dateLabel: "date not established",
    shortDate: "undated",
    undated: true,
    oneSentence:
      "An early named phase remembered as capability-building alongside the need for boundaries; exact mapping remains unverified.",
    accent: "azure",
  },
  {
    id: "rebirth",
    order: 3,
    shortLabel: "Rebirth",
    title: "RAPHAEL Rebirth",
    dateLabel: "date not established",
    shortDate: "undated",
    undated: true,
    oneSentence:
      "The project was reorganised toward a larger, more integrated architecture.",
    accent: "azure",
  },
  {
    id: "r20",
    order: 4,
    shortLabel: "2.0",
    title: "RAPHAEL 2.0 — the integrated orchestrator",
    dateLabel: "23 July 2026",
    shortDate: "23 Jul 2026",
    undated: false,
    oneSentence:
      "A broad orchestrator, APIs, knowledge stores and Docker service fabric were documented; a July snapshot reported 14/14 containers running.",
    accent: "cyan",
  },
  {
    id: "r21",
    order: 5,
    shortLabel: "2.1 / 2.1.1",
    title: "RAPHAEL 2.1 / 2.1.1 — cognition and evaluation",
    dateLabel: "8 August 2026",
    shortDate: "8 Aug 2026",
    undated: false,
    oneSentence:
      "The architecture story expanded around cognition, WorldModel, Student research and evaluation machinery.",
    accent: "cyan",
  },
  {
    id: "v4",
    order: 6,
    shortLabel: "v4",
    title: "RAPHAEL v4 — one canonical runtime",
    dateLabel: "4 September 2026",
    shortDate: "4 Sep 2026",
    undated: false,
    oneSentence:
      "The focus shifted to one canonical Runtime and a strict authorization and enforcement path.",
    accent: "violet",
  },
  {
    id: "v41",
    order: 7,
    shortLabel: "v4.1",
    title: "RAPHAEL v4.1 — arbitration and gate discipline",
    dateLabel: "7 September 2026",
    shortDate: "7 Sep 2026",
    undated: false,
    oneSentence:
      "Architecture invariants, legacy-path handling and sequential acceptance gates were made explicit.",
    accent: "violet",
  },
  {
    id: "v42",
    order: 8,
    shortLabel: "v4.2",
    title: "RAPHAEL v4.2 — governed recursive improvement",
    dateLabel: "19 September 2026",
    shortDate: "19 Sep 2026",
    undated: false,
    oneSentence:
      "Governed recursive improvement was defined as a future, evidence- and holdout-gated extension.",
    accent: "violet",
  },
  {
    id: "present",
    order: 9,
    shortLabel: "Present",
    title: "Present position — RAPHAEL v4.x",
    dateLabel: "4–18 October 2026",
    shortDate: "4–18 Oct 2026",
    undated: false,
    oneSentence:
      "The architecture is more precisely specified, but G3 and the research and readiness evidence remain unresolved in the latest records available here.",
    accent: "blocked",
  },
];

export const milestones: readonly Milestone[] = [
  {
    id: "origin",
    eraId: "origin",
    order: 1,
    title: "RAPHAEL 1 — “Ultimate Skill”",
    dateDisplay: "Date not established",
    datePrecision: "not_established",
    dateNote:
      "The available record does not establish the first day, month or year. This is presented as an origin-era milestone rather than an invented date.",
    summary:
      "The project begins as an ambition to be one capable, integrated agent rather than a collection of disconnected scripts.",
    evidenceClass: "OWNER_RECALLED",
    confidence: "LOW",
    doesNotProve:
      "It does not establish an original module inventory, runtime contract, Docker topology, test count or a measured success rate for this era.",
    sources: ["timeline-doc"],
    detail: {
      historicalContext:
        "RAPHAEL began with the ambition to create a highly capable, integrated agent. The name “Ultimate Skill” belongs to this origin period in the owner's recollection of the project's beginnings.",
      architecturalObjective:
        "One named agent and project identity able to combine tool use, reasoning and specialised workflows as it grows.",
      significance:
        "This is the starting point of the project's eventual separation into operational capabilities, cognitive mechanisms and control boundaries.",
      relationshipToLater:
        "Seen from the later v4 design, the origin maps to a question that became central: how can a system combine many capabilities while keeping one coherent decision path and a reliable boundary around what it may do? That is a retrospective reading of the lineage, not evidence that this era implemented the later Broker and enforcement model.",
    },
  },
  {
    id: "sword-shield",
    eraId: "sword-shield",
    order: 2,
    title: "Sword & Shield",
    dateDisplay: "Date not established",
    datePrecision: "not_established",
    dateNote:
      "Exact start and end dates are not established, and no authoritative specification of the original division of responsibilities survives in the current record.",
    summary:
      "An early named phase pairing capability with the need for the controls that govern its use.",
    evidenceClass: "OWNER_RECALLED",
    confidence: "LOW",
    doesNotProve:
      "It does not establish that “Sword” and “Shield” were formal components, modules or services, nor that the later runtime mediation model originated here.",
    sources: ["timeline-doc"],
    detail: {
      historicalContext:
        "The most conservative reading is that this period shaped thinking about two related needs: operational capability, and the controls needed around it. RAPHAEL 2.x does contain a service labelled `sword`, but a shared name is not proof of a shared implementation.",
      architecturalObjective:
        "Capability, together with an early instinct that capability needs a boundary.",
      significance:
        "It begins the architectural distinction between what a system can do and the boundaries that should govern it — a precursor to the later concerns about broker mediation, scope, authorization and evidence.",
      relationshipToLater:
        "The distinction that later becomes critical is that a capability is not permission: a command being technically executable does not make it authorized for a given target, action, method or impact budget. That distinction eventually appears in v4 as the divide between Planner and Broker.",
      limitations: [
        "What “Sword” meant in the original design — toolset, execution engine, a set of skills, or a module name — is unresolved.",
        "What “Shield” meant — policy, validation, target restriction, operator approval, or a broad safety ambition — is unresolved.",
        "Whether the two halves were separate repositories, modules, personas, or only a project name is unresolved.",
        "Which files, if any, survive from this phase is unresolved.",
      ],
    },
  },
  {
    id: "rebirth",
    eraId: "rebirth",
    order: 3,
    title: "RAPHAEL Rebirth",
    dateDisplay: "Date not established",
    datePrecision: "not_established",
    dateNote:
      "The transition date is not established. Later repository documentation references a Rebirth note and a v2.1 note, but no complete dated changelog of the transition survives.",
    summary:
      "A reorganisation of the project itself — names, responsibilities and entry point — rather than another version number.",
    evidenceClass: "OWNER_RECALLED",
    confidence: "LOW",
    doesNotProve:
      "It does not establish the precise implementation diff, a clean-room rewrite, or which early files were carried forward into the 2.x lineage.",
    sources: ["timeline-doc"],
    detail: {
      historicalContext:
        "Rebirth marks the move from the early project into the integrated RAPHAEL 2.x lineage. Later records reference documentation for this transition and for v2.1, but preserve no dated changelog explaining each decision.",
      architecturalObjective:
        "Rework the structure of the project: names, responsibilities, the entry point, how components work together, and what counts as the canonical implementation.",
      significance:
        "The useful distinction is between adding a tool and changing the shape of the system. A new tool inserts into an existing graph; a rebirth revisits what the graph is.",
      relationshipToLater:
        "By the 2.x era the project is described as a broad Python-oriented orchestration platform with a FastAPI interface, bridge methods, personas, knowledge stores and containerised services.",
      limitations: [
        "The exact transition date and commit range are unresolved.",
        "Module names retained, renamed or deleted across the transition are not established.",
        "The earliest tests exercising the new entry point are not identified in the surviving record.",
      ],
    },
  },
  {
    id: "r20",
    eraId: "r20",
    order: 4,
    title: "RAPHAEL 2.0 — the integrated orchestrator",
    dateDisplay: "July 2026",
    datePrecision: "range",
    dateNote:
      "Documented by the July 2026 architecture report. The version string `2.0.0` appears in the archived architecture PDF; the exact initial release date is not established there.",
    summary:
      "A broad integrated system: FastAPI orchestration, personas, persistent knowledge stores and a Docker service fabric.",
    evidenceClass: "REPORTED_SNAPSHOT",
    confidence: "MEDIUM",
    doesNotProve:
      "It does not establish that every listed subsystem was independently exercised, that the same configuration runs today, or that the reported research figures were validated.",
    sources: ["r2-arch", "timeline-doc"],
    detail: {
      historicalContext:
        "By this era the project had grown into a broad integrated platform rather than one executable binary: an API and orchestration layer alongside model, graph, proxy, reconnaissance, browser and auxiliary services.",
      architecturalObjective:
        "A coordinating application with multiple service boundaries, where subsystems can be packaged, configured and observed separately and an orchestration layer can route requests to specialised components.",
      components: [
        "FastAPI routes for agent execution, personas, tools, sessions and health, with the API on port 3900.",
        "Orchestration modes, agents, chains and a strategy/conductor component.",
        "Named personas including Z3R0, GHOST, STEALTH, FORGE and STUDENT.",
        "A JSON-RPC-over-stdio operator bridge exposing 30+ methods to an operator or CLI workflow.",
        "Persistent knowledge stores including a brain store, harvester store, student knowledge base, research store and growth store.",
        "A service fabric of model, graph, proxy, reconnaissance, browser and auxiliary services.",
      ],
      implementationEvidence:
        "All of the above are statements in the archived architecture report describing the documented design and the reported snapshot.",
      verificationEvidence:
        "The report records a container-level snapshot for 23 July 2026. That is a report about one capture, not a reproduction of each subsystem.",
      limitations: [
        "The exact initial release date is not established.",
        "A large service catalogue creates the appearance of broad capability, but every service adds packaging, authorization, lifecycle, logging, dependency and verification obligations.",
        "The broader shape also introduced distributed-system failure modes: startup ordering, port conflicts, service discovery, path coupling, external model connectivity, and image or version mismatch.",
      ],
      significance:
        "This is the point at which RAPHAEL became recognisably an integrated multi-service platform rather than a single agent program.",
      relationshipToLater:
        "The growth in surface area is what makes the v4 question unavoidable: with more entry points and capability adapters, it becomes harder to guarantee that the same authorization and evidence rules apply to every action.",
    },
  },
  {
    id: "docker-july",
    eraId: "r20",
    order: 5,
    title: "23 July 2026 — the memorable 14/14 Docker snapshot",
    dateDisplay: "23 July 2026",
    datePrecision: "exact",
    dateNote:
      "The architecture source was exported on 24 July 2026, one day after the state snapshot it records.",
    summary:
      "The clearest preserved point at which the original Docker stack was described as fully up.",
    evidenceClass: "REPORTED_SNAPSHOT",
    confidence: "HIGH",
    doesNotProve:
      "14 running containers do not by themselves prove that any agent workflow completed end to end, that security boundaries were enforced, or that reported research metrics were independently validated.",
    sources: ["r2-arch", "timeline-doc"],
    detail: {
      historicalContext:
        "This is the clearest preserved point at which the original Docker stack was described as fully up, and the best-known preserved “all up” snapshot in the available history.",
      implementationEvidence:
        "The source reports 14 of 14 containers running, five active personas, a passing Judge status, a bridge with 30+ methods, persistent knowledge bases and a Compose configuration said to define 16 services.",
      limitations: [
        "The source describes 16 Compose services but its visible architecture diagram names 15. The sixteenth remains unmatched.",
        "The record does not provide a complete immutable image manifest with every tag and digest.",
        "Container count, declared Compose service count, named services in the diagram and unique image count are separate quantities and must not be collapsed into one metric.",
      ],
      significance:
        "RAPHAEL reached a tangible infrastructure milestone: the architecture report recorded the complete counted container set as running at that time.",
      relationshipToLater:
        "This snapshot is not erased by the October 4 zero-container observation. The two describe different dates and different environments and cannot be combined into a single uptime claim.",
    },
  },
  {
    id: "audit-aug",
    eraId: "r21",
    order: 6,
    title: "8 August 2026 — RAPHAEL 2.1.1 architecture audit",
    dateDisplay: "8 August 2026",
    datePrecision: "exact",
    dateNote:
      "Dated by the audit material itself; the accompanying architecture illustration is an audit snapshot, not a current container count.",
    summary:
      "A richer cognitive design: D-Series Brain, S-Series Student, E-Series hands, research and evaluation components.",
    evidenceClass: "AUDIT_FINDING",
    confidence: "MEDIUM",
    doesNotProve:
      "It does not establish that every module was exercised end to end, that every service was simultaneously running, or that the full system could reliably cold-start in any environment.",
    sources: ["audit-aug", "timeline-doc"],
    detail: {
      historicalContext:
        "This record is a bridge between the broad v2.0 service diagram and the later governance-first v4 architecture. It captures the project as something needing architectural auditing, not merely feature implementation.",
      components: [
        "Planner and capability brokerage.",
        "WorldModel and world state.",
        "Hypothesis, contradiction and falsification machinery.",
        "Reflection and strategy-related mechanisms.",
        "Research Student modules for scheduling, knowledge background service, coverage-gap filling and chain synthesis.",
        "Arena/RBS-style evaluation and result artifacts.",
        "Named D-Series Brain areas, S-Series Student areas and E-Series hands.",
      ],
      implementationEvidence:
        "The audit describes substantial source code and module-level presence.",
      limitations: [
        "A dated architecture file describing the platform as v2.1.1-era does not mean every currently inspected file is exactly that version.",
        "A diagram naming particular modules does not mean all of them are installed and available in a clean checkout.",
        "Relationships drawn in the diagram describe documented design, not a graph verified through real requests.",
        "An earlier reported test count is not the live test floor at every later revision.",
      ],
      significance:
        "RAPHAEL is no longer represented only as an API plus containers. Its architecture story increasingly centres on cognition, memory, hypotheses, evidence, strategy and evaluation.",
      relationshipToLater:
        "The v4 work kept the need for planning, tool adapters, execution, evidence and an orchestration runtime, but formalised the relationships: one policy decision point, one enforcement boundary, and receipts tying decisions to outcomes.",
    },
  },
  {
    id: "evaluation-aug",
    eraId: "r21",
    order: 7,
    title: "August 2026 — evaluation and reproducibility become central",
    dateDisplay: "August 2026",
    datePrecision: "range",
    dateNote:
      "An exact cause-and-effect sequence is only partly reconstructed from surviving records.",
    summary:
      "Research and benchmark work exposed that many cognitive modules do not, on their own, demonstrate improved outcomes.",
    evidenceClass: "RECORDED_STATUS",
    confidence: "MEDIUM",
    doesNotProve:
      "It does not invalidate the earlier engineering work; it narrows which conclusions the available artifacts can support.",
    sources: ["timeline-doc"],
    detail: {
      historicalContext:
        "Research and benchmark work made the project place greater weight on controlled runs, baselines, ablations, evidence provenance, evaluation artifacts and reproducibility.",
      significance:
        "The centre of gravity began shifting from “how many capabilities and cognitive modules exist?” toward “what did the system actually do, what evidence supports the result, and can another person reproduce it?”",
      limitations: [
        "Some historical campaign records were later questioned or quarantined because datasets, instrument identity or repeatability could not be established to the required standard.",
        "The existence of a reported run, or a large test count, stopped being sufficient evidence for a broad performance claim.",
      ],
    },
  },
  {
    id: "one-runtime-decision",
    eraId: "v4",
    order: 8,
    title: "Early September 2026 — the single-Raphael architecture decision",
    dateDisplay: "September 2026",
    datePrecision: "range",
    dateNote:
      "The v4 master roadmap is dated 4 September and the v4.1 handoff is dated 7 September.",
    summary:
      "Forensic work documented two internally divergent architecture paths; the canonical direction became one Raphael, one runtime.",
    evidenceClass: "DOCUMENTED_DESIGN",
    confidence: "HIGH",
    doesNotProve:
      "It does not prove that the migration, or the removal of all legacy paths, was completed.",
    sources: ["roadmap-v4", "handoff-v41", "timeline-doc"],
    detail: {
      historicalContext:
        "Two divergent paths existed: a simpler operator-facing path described historically as a Planner to Executor to State loop, and a richer cognitive path containing more extensive planning, WorldModel, hypothesis, contradiction, falsification and broker concepts, with substantial ties to arena and benchmark execution.",
      architecturalObjective:
        "One Raphael, one Runtime, one production loop, one authorization decision point and one execution-enforcement boundary. Retain the useful operator-facing shell while taking the cognitive design from the richer architecture, under one sanctioned runtime.",
      significance:
        "This is the pivot from a capability-breadth project to a governed cognitive system.",
      limitations: [
        "This is a documented architecture decision. It must not be confused with proof that the migration and all legacy-path removal were complete.",
        "The broader structural problem it addresses: if the CLI, API, bridge, legacy chain and a test harness each have their own route to a tool, a policy correct in one route may not govern the others.",
      ],
    },
  },
  {
    id: "v4",
    eraId: "v4",
    order: 9,
    title: "RAPHAEL v4 — a controlled execution path",
    dateDisplay: "4 September 2026",
    datePrecision: "exact",
    dateNote: "Roadmap record dated 4 September 2026, with subsequent handoff material.",
    summary:
      "The design moves to an explicit trust boundary: propose, authorize, enforce, record, integrate, falsify, replan.",
    evidenceClass: "DOCUMENTED_DESIGN",
    confidence: "HIGH",
    doesNotProve:
      "A designed control plane is not a demonstrated one. Presence of a component is not proof that the components work together successfully in a complete run.",
    sources: ["roadmap-v4", "handoff-v41", "timeline-doc"],
    detail: {
      architecturalObjective:
        "A single canonical control spine from scope through authorization and execution to receipts and evidence, so that each request can be answered: who declared the scope, which policy evaluated it, which receipt authorized it, which executor consumed it, and which evidence records the outcome.",
      components: [
        "The runtime owns sequencing and termination, not all cognition.",
        "The planner proposes actions; it cannot authorize them.",
        "The broker is the single policy decision point and denies by default.",
        "The enforcement boundary owns the process, network and filesystem primitives.",
        "A sandbox is an enforcement mechanism, not an authority that can approve itself.",
        "Evidence records support findings; evidence does not grant authorization.",
        "Student outputs are proposals and must not directly write trusted WorldModel beliefs.",
        "The arena is an evaluation environment and measurement consumer, not a second production brain.",
        "Legacy execution paths require explicit perimeter, mediation and eventual deletion proof.",
      ],
      implementationEvidence:
        "A real broker on the canonical path, an enforcement boundary and fail-closed tests are described in the handoff and later audits.",
      verificationEvidence:
        "Fail-closed weld-gate sites were counted as intact in the October 4 audit, and the canonical runtime closure was described as clean in that checkout.",
      limitations: [
        "A policy file existing on disk is not policy behaviour being active: an engagement policy artifact was present but not loaded by the inspected source, whose policy source remained the bootstrap variant.",
        "A local proxy or sandbox is a mechanism, not a source of authorization.",
        "Deny-by-default held within the tested and declarative perimeter; a wired legacy execution plane remained outside the broker's reach.",
      ],
      significance:
        "The design moved toward a governed cognitive system rather than merely a larger tool-using agent.",
      relationshipToLater:
        "v4.1 turns these principles into enumerated invariants and a gate chain; v4.2 adds a governed improvement substrate on top of the same runtime.",
    },
  },
  {
    id: "v41",
    eraId: "v41",
    order: 10,
    title: "7 September 2026 — v4.1 handoff and gate-based development",
    dateDisplay: "7 September 2026",
    datePrecision: "exact",
    dateNote: "Handoff record dated 7 September 2026.",
    summary:
      "Ten canonical runtime stages and a phased road map in which every phase is gated by explicit evidence.",
    evidenceClass: "DOCUMENTED_DESIGN",
    confidence: "HIGH",
    doesNotProve:
      "It does not establish complete MVP or G3 acceptance. The handoff explicitly warns against inferring gate acceptance from commits, source presence or green tests alone.",
    sources: ["handoff-v41", "timeline-doc"],
    detail: {
      architecturalObjective:
        "Make the stage sequence an explicit, inspectable loop contract, and make “done” depend on artifacts, a consistent measurement basis, a bounded scope and an authorized acceptance decision.",
      components: [
        "A fixed ten-stage sequence from observation through replanning.",
        "A phased road map P0 to P10, each phase paired with a gate.",
        "Explicit architectural invariants covering decision, enforcement, evidence and replanning.",
      ],
      implementationEvidence:
        "The handoff records the canonical runtime, the stage order, stage handlers, a scope construct, evidence types and brain organs as implemented in the examined lineage, and records G0, G1 and G2 as historically passed.",
      verificationEvidence:
        "The historical gate record and its associated evidence packages.",
      limitations: [
        "The planner stage built a deterministic request object instead of invoking a full planner decision method.",
        "Student output was recording-only and was not fed into planner request selection.",
        "WorldModel read returned counts only; integration recorded an observation rather than writing a rich belief.",
        "Contradiction and replanning were placeholders at that snapshot; the durable evidence substrate was not invoked on the hot receipt path.",
        "A fixed sequence therefore established structure, not end-to-end cognitive efficacy.",
      ],
      significance:
        "Roadmap execution itself became evidence-gated. A task is not accepted merely because someone implemented code; the required evidence and an independent decision must also exist.",
    },
  },
  {
    id: "v42",
    eraId: "v42",
    order: 11,
    title: "19 September 2026 — v4.2 adds the governed RSI target",
    dateDisplay: "19 September 2026",
    datePrecision: "exact",
    dateNote: "Roadmap record dated 19 September 2026.",
    summary:
      "A future governed recursive-improvement substrate, defined with explicit proof requirements rather than assumed capability.",
    evidenceClass: "DOCUMENTED_DESIGN",
    confidence: "HIGH",
    doesNotProve:
      "It does not certify the system as self-improving. The roadmap defines a target design and admission tests; RSI implementation is recorded as not started.",
    sources: ["roadmap-v42", "timeline-doc"],
    detail: {
      architecturalObjective:
        "Extend the v4 and v4.1 architecture with a governed improvement substrate. It does not replace the canonical runtime with a second learner or a separate production brain.",
      components: [
        "EvidenceRecord: provenance and authority over what was observed or executed.",
        "ExperienceNode: structured decision history, branches and outcomes.",
        "Replay: reconstructing recorded states and outcomes, not merely regenerating a scenario or inserting a memory summary into a prompt.",
        "Candidate ExplorationPolicy: bounded, versioned changes to evolvable strategy surfaces.",
        "Protected evaluation: matched-resource testing and required unseen holdout evaluation before promotion.",
        "Version lineage: immutable content identity, parent and supersedes links, evaluation, acceptance, deployment and rollback records.",
        "Governance: protected components remain non-self-modifiable, and deployment requires the appropriate human or governance decision.",
      ],
      limitations: [
        "Structural recursion is not demonstrated effective improvement.",
        "The system must not claim a higher improvement level until the corresponding admission tests pass.",
        "RSI implementation is recorded as NOT STARTED in the September roadmap state.",
      ],
      significance:
        "Self-improvement became a governed research target with explicit proof requirements, not an assumption that adding a learner module makes the system recursively self-improving.",
    },
  },
  {
    id: "e2e-oct",
    eraId: "present",
    order: 12,
    title: "4 October 2026 — the original Docker environment was not present",
    dateDisplay: "4 October 2026",
    datePrecision: "exact",
    dateNote:
      "The audit is scoped to one checkout and one host environment, on a specific branch with an unclean working tree.",
    summary:
      "In the environment inspected by this audit, Docker was available but zero containers were running.",
    evidenceClass: "AUDIT_FINDING",
    confidence: "HIGH",
    doesNotProve:
      "It does not erase the July snapshot, and it does not describe every Raphael branch or every machine the project has run on.",
    sources: ["e2e-oct", "timeline-doc"],
    detail: {
      historicalContext:
        "The audit covered read-only source inspection, a test-suite run, an environment inventory and an import-map sweep of a single checkout.",
      verificationEvidence:
        "The configured suite run reported 621 passed, 0 failed, 0 skipped in 30.3 seconds in that checkout, and the roadmap's baseline test floor was reported as holding.",
      implementationEvidence:
        "The inspected fail-closed posture had 43 weld-gate sites intact, and ten deleted execution bodies remained deleted.",
      limitations: [
        "Docker was available but zero containers were running in that environment.",
        "The historical service path was absent and four symlinks dangled.",
        "The import sweep found 344 resolving and 37 failing modules out of 381; the largest issue was a package shadowing conflict that broke 14 imports including the API and agent surfaces.",
        "The environment's interpreter version did not satisfy the declared upper bound, and no virtual environment or environment file was present in the inspected checkout.",
        "One of 24 expected tools was present.",
        "Three cold-start attempts on 3 October failed during the reconnaissance phase, with no successful engagement on record in that report.",
        "A frozen 1,200-row evaluation holdout referenced in the manifest was absent from the working tree and was reported never committed on the inspected history.",
        "A test invocation rewrote 14 historical arena result directories, creating an evaluation-integrity concern.",
      ],
      significance:
        "A passing configured suite is evidence about the tests that ran, in that checkout, under that environment. It does not nullify import failures, prove a cold-start mission works, establish that a missing holdout exists, or close a gate.",
      relationshipToLater:
        "The correct reading is a sequence of snapshots, not a contradiction: July described a running stack, 4 October found zero containers in the audited environment, and 16 October observed a smaller local subset.",
    },
  },
  {
    id: "readiness-oct",
    eraId: "present",
    order: 13,
    title: "9 October 2026 — formal readiness blockers documented",
    dateDisplay: "9 October 2026",
    datePrecision: "exact",
    dateNote: "Captured by product-readiness and governance records in the available project history.",
    summary:
      "Readiness was marked NOT_READY, the gate chain remained blocked at G3, and several categories of blocker became explicit.",
    evidenceClass: "RECORDED_STATUS",
    confidence: "HIGH",
    doesNotProve:
      "These are separate categories of blocker. A source defect can be fixed by engineering; a missing artifact needs recovery or formal disposition; an unratified decision needs a valid authority.",
    sources: ["viability-oct", "portal-oct", "timeline-doc"],
    detail: {
      historicalContext:
        "Several claims that had been implicit became explicit rather than softer.",
      limitations: [
        "The trusted issuer registry was empty.",
        "Self-adopted machine-agent decisions were invalidated.",
        "The source-release gate remained closed.",
        "License, dependency-locking, authority and legacy execution-mediation issues remained unresolved.",
      ],
      significance:
        "The project had advanced in architecture and audit depth, but its public claims were narrowed to what the available evidence actually established.",
    },
  },
  {
    id: "lab-oct",
    eraId: "present",
    order: 14,
    title: "16 October 2026 — a smaller local lab subset observed running",
    dateDisplay: "16 October 2026",
    datePrecision: "exact",
    dateNote: "Read-only host assessment; it did not run a new test suite.",
    summary:
      "A later host assessment observed a smaller lab subset with loopback-bound published ports.",
    evidenceClass: "AUDIT_FINDING",
    confidence: "HIGH",
    doesNotProve:
        "It does not establish the return of the original container stack, nor that the full canonical agent loop completed an end-to-end mission.",
    sources: ["viability-oct", "timeline-doc"],
    detail: {
      verificationEvidence:
        "The assessment observed a Kali tools service bound to loopback port 3800, a deliberately vulnerable web application bound to loopback port 4280, its database service, and a locally running inference server reported as running on the host rather than as an identified container.",
      significance:
        "Some lab services were available in that inspected host environment.",
      limitations: [
        "This is a smaller observation than the historical July stack.",
        "It should be described as an inspected local lab subset at a later date, not as proof that the full container stack returned intact.",
      ],
    },
  },
  {
    id: "portal-oct",
    eraId: "present",
    order: 15,
    title: "16–18 October 2026 — public documentation, provenance and claim discipline",
    dateDisplay: "16–18 October 2026",
    datePrecision: "range",
    dateNote:
      "Exact per-change dates are recorded in the portal repository rather than reproduced here.",
    summary:
      "The communication layer started reflecting the same standards expected of the system itself.",
    evidenceClass: "RECORDED_STATUS",
    confidence: "HIGH",
    doesNotProve:
      "The public site and its architecture explorer are documentation surfaces. Their build and tests do not prove that Raphael's source, authorization boundary, cognitive loop or research thesis has passed its own gates.",
    sources: ["portal-oct", "timeline-doc"],
    detail: {
      historicalContext:
        "Portal work increasingly focused on making the public description accurate: distinguishing design influence from implementation, correcting documented status labels, keeping unresolved findings visible, and avoiding implying that the website's own passing tests validate Raphael's runtime.",
      significance:
        "The project began applying to its own public claims the standards it applies to its system: provenance, explicit uncertainty, and no invented claims of readiness.",
      relationshipToLater:
        "This page is part of that work. It is documentation of a lineage, not evidence about Raphael's runtime.",
    },
  },
];

export const milestonesByEra: Record<EraId, readonly Milestone[]> = eras.reduce(
  (acc, era) => {
    acc[era.id] = milestones.filter((m) => m.eraId === era.id);
    return acc;
  },
  {} as Record<EraId, readonly Milestone[]>,
);

export function eraById(id: EraId): Era | undefined {
  return eras.find((e) => e.id === id);
}

export function milestoneById(id: string): Milestone | undefined {
  return milestones.find((m) => m.id === id);
}

/** Total count of eras, used by the chronology rail heading. */
export const eraCount = eras.length;

/* ========================================================================== */
/* Current state                                                               */
/* ========================================================================== */

export type BlockerCategory = "GATE" | "EVIDENCE" | "GOVERNANCE" | "RESEARCH";

export interface CurrentStatusRow {
  id: string;
  /** Verbatim status value from the source record. */
  value: string;
  /** Severity family, drives the badge tone. Never the only signal. */
  tone: "blocked" | "caution" | "violet";
  category: BlockerCategory;
  /** Why this blocks, rather than a bare label. */
  why: string;
}

export const overallStatus = "NOT_READY" as const;

export const overallStatusMeaning =
  "The defensible summary in the latest available records. This is neither “nothing works” nor “production ready”: the canonical runtime skeleton exists and the broker and enforcement boundary were implemented in the recorded lineage, but required operational, evaluation and governance criteria remain unmet.";

export const currentStatusRows: readonly CurrentStatusRow[] = [
  {
    id: "overall",
    value: "NOT_READY",
    tone: "blocked",
    category: "GATE",
    why: "Required operational, evaluation and governance criteria remain unmet. The label reflects unfinished acceptance obligations, not the absence of useful engineering work.",
  },
  {
    id: "g3",
    value: "NOT ACCEPTED / BLOCKED",
    tone: "blocked",
    category: "GATE",
    why: "The canonical runtime and gate components exist in source and the earlier gates were historically accepted, but full acceptance and MVP proof are not established. A request-binding defect, a noncanonical legacy execution plane and provenance concerns remain open.",
  },
  {
    id: "am-4-r3",
    value: "NOT EXECUTED",
    tone: "caution",
    category: "GATE",
    why: "The prescribed next step in the v4.2 current-state record remains unresolved there. Because G3 evidence and adjudication depend on it, the gate chain cannot advance past its current position.",
  },
  {
    id: "thesis",
    value: "UNRESOLVED",
    tone: "blocked",
    category: "RESEARCH",
    why: "The central thesis comparing explicit architecture against prompting and baseline arms cannot be established from the available record, in part because two arms were instrument-defective. Unresolved means neither proven nor disproven by the missing artifacts alone.",
  },
  {
    id: "dataset",
    value: "MISSING",
    tone: "blocked",
    category: "EVIDENCE",
    why: "The frozen evaluation dataset was absent from the audited records and is not permitted to be casually reconstructed. A manifest describing a missing dataset is not a substitute for the dataset itself, so evaluation claims cannot be treated as reproducibly settled.",
  },
  {
    id: "instrument",
    value: "DIGEST DRIFT — UNRESOLVED",
    tone: "caution",
    category: "EVIDENCE",
    why: "Material digest drift against the pinned instrument state is documented, and its disposition remains unresolved. Drift establishes that the bytes differ from the anchor; it does not by itself prove which behaviour changed or that every historical number is wrong.",
  },
  {
    id: "rsi",
    value: "NOT STARTED",
    tone: "violet",
    category: "RESEARCH",
    why: "The governed recursive-improvement layer is a documented target, not a running capability. The roadmap explicitly does not certify the system as self-improving.",
  },
  {
    id: "authority",
    value: "ABSENT",
    tone: "blocked",
    category: "GOVERNANCE",
    why: "No valid authority principal could ratify the required decisions; the trusted issuer registry was empty and earlier machine-agent adoptions were invalidated. An agent cannot create a trusted authority by declaring itself to hold a role.",
  },
  {
    id: "source-release",
    value: "CLOSED",
    tone: "blocked",
    category: "GOVERNANCE",
    why: "The source-release gate is closed, so no page, timeline or demo can describe the research and implementation as release-approved. Public documentation cannot supply the missing authority, dataset or gate acceptance.",
  },
];

export const presentPositionSummary =
  "The v4.x line is the canonical architecture and governance direction. The v4.2 roadmap is the latest target specification found in the available record, but a target specification is not a completed implementation. The statuses below are documentary, transcribed from the newest supplied records; they are not a fresh live interrogation of Raphael's host, repository or governance channel.";

export const closingStatement =
  "The architecture is now more precisely specified than at any earlier point in the project's history. Acceptance has not followed that precision, and the honest reading of the latest record is a research and engineering state with meaningful assets that is not release-ready and has not validated its central thesis.";

/**
 * Dependency chain from the source document. This is documented dependency
 * logic, NOT a record that the steps occurred; the first dependency is still
 * absent in the cited assessment, so the chain is blocked.
 */
export const decisionDependencyChain: readonly string[] = [
  "Valid authority principal",
  "Authority able to ratify required decisions",
  "Disposition of missing or drifted evaluation evidence",
  "Prescribed execution, or a formally accepted alternative ruling",
  "G3 evidence package and adjudication",
  "Acceptance or refusal of G3",
  "Only then, eligible downstream gate work",
];
