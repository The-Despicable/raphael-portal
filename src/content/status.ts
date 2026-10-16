import type {
  Blocker,
  OpenQuestion,
  ReadinessDimension,
  StrategicOption,
  TimelineEvent,
} from "@/lib/types";

/**
 * All content below is transcribed from a single dated source:
 *
 *   RAPHAEL — Project Viability, Completion Readiness & Successor Blueprint
 *   Assessment, dated 2026-10-16.
 *
 * SECURITY / REDACTION
 * -------------------
 * Deliberately excluded from this public site and never reconstructed:
 *   - local filesystem paths and the working-copy location
 *   - git remote names and owner account handles
 *   - commit / tree object hashes
 *   - internal IP addresses, host names and container port bindings
 *   - engagement identifiers and live-target configuration
 *   - credential fingerprints or any credential material (the source records
 *     only that a small number of third-party keys were exposed and that
 *     rotation was recorded as PENDING; values are not reproduced anywhere)
 *   - named symbols of unpatched defensive defects, which are described here by
 *     category only rather than by identifier
 *
 * Everything below is either a non-sensitive aggregate, a non-sensitive
 * identifier (blocker IDs, gate IDs, ADR numbers), or a high-level
 * architectural statement the project intends to publish.
 *
 * PROVENANCE RULE
 * ---------------
 * This is a dated snapshot, not live telemetry. `ASSESSMENT` is the single
 * source of truth for "as of" language, and any statement of the form "is" must
 * be read as "was, on 2026-10-16".
 */

export const ASSESSMENT = {
  date: "2026-10-16",
  /** Re-verification has not occurred; the site must not imply otherwise. */
  revalidated: false,
  overallReadiness: "NOT_READY",
  gateDisposition: "BLOCKED at G3",
  disposition: "FREEZE RAPHAEL AND BUILD A SUCCESSOR",
  dispositionDetail:
    "Selective salvage of design assets by citation into an independent successor, which was already in progress at the time of assessment.",
  confidence: "HIGH (~0.80)",
  confidenceNote:
    "The qualitative result is robust; the weighted score is illustrative and sensitive to its weights.",
  assessorRole:
    "Independent technical auditor / software architect / project-recovery consultant / technical archivist.",
  methodLimits: [
    "The assessment was read-only. No project file, test, config, document, governance record, or report was modified.",
    "No test was executed by the assessor. All suite figures are labelled as documented rather than re-derived.",
    "One third-party suite execution exists in the corpus and is adopted as partial evidence, not as the assessor's own run.",
    "Secret-handling rules were observed: credential values were neither accessed nor reproduced.",
  ],
} as const;

export const readinessScorecard: readonly ReadinessDimension[] = [
  {
    dimension: "Functional completeness",
    status: "BLOCKED",
    evidence: "The canonical component chain is present; the end-to-end stack is self-declared unvalidated.",
    outstandingGap: "No reproducible end-to-end run. The demonstration scenario is the only strong positive artifact.",
    consequence: "Intended workflows cannot be demonstrated.",
    confidence: "HIGH",
  },
  {
    dimension: "Architectural integrity",
    status: "CONDITIONAL",
    evidence: "Runtime / broker / enforcement-point / execution decomposition is coherent and its decisions are accepted.",
    outstandingGap: "The legacy execution plane remains largely intact and a biplane (two-path) risk persists.",
    consequence: "Sound core, unsound perimeter.",
    confidence: "MED-HIGH",
  },
  {
    dimension: "Security & isolation",
    status: "BLOCKED",
    evidence: "Fail-closed authorization patterns are strong and published ports were loopback-bound.",
    outstandingGap: "Perimeter classes incomplete; a fail-open conditional in a human-in-the-loop guard; no compose hardening; no SBOM or license.",
    consequence: "Offensive surface remains reachable; legal exposure.",
    confidence: "HIGH",
  },
  {
    dimension: "Verification maturity",
    status: "CONDITIONAL",
    evidence: "An independent audit of one subsystem returned PASS, scope-limited; verification bundles check out.",
    outstandingGap: "No gate-level verification, no CI bound to the assessed commit, no authoritative test floor.",
    consequence: "No release-grade evidence exists.",
    confidence: "MED",
  },
  {
    dimension: "Governance readiness",
    status: "BLOCKED",
    evidence: "The freeze notice, the conflict ADR and the decision ledger are honest and unusually detailed.",
    outstandingGap: "No authority principal exists, the trusted-issuer registry is empty, G3 is unaccepted, six decisions are unratified.",
    consequence: "Everything downstream is blocked on this single dimension.",
    confidence: "HIGH",
  },
  {
    dimension: "Maintainability",
    status: "CONDITIONAL",
    evidence: "Clear module decomposition and a reviewer guide.",
    outstandingGap: "Contradictory canonical documents, broken service symlinks, stashed work, multiple remotes and branches.",
    consequence: "A new developer can read the core but cannot establish the current state.",
    confidence: "MED",
  },
  {
    dimension: "Reproducibility",
    status: "BLOCKED",
    evidence: "Two bundles verify and the environment was recorded.",
    outstandingGap: "No lockfile, the project virtualenv lacks pip, dependencies are undeclared, and the supported interpreter envelope is self-contradictory.",
    consequence: "The system is not reconstructible.",
    confidence: "HIGH",
  },
  {
    dimension: "Operational readiness",
    status: "BLOCKED",
    evidence: "The demonstration script is well designed and published ports were loopback-bound.",
    outstandingGap: "No deployment or rollback runbook, no CI at the assessed commit, weak compose isolation.",
    consequence: "Not operable as a product.",
    confidence: "HIGH",
  },
  {
    dimension: "Scope stability",
    status: "BLOCKED",
    evidence: "The roadmap itself is thorough.",
    outstandingGap: "Requirements accreted after an unaccepted gate, and a very large roadmap sits against a stalled gate.",
    consequence: "The definition of completion is unstable.",
    confidence: "HIGH",
  },
  {
    dimension: "Evidence integrity",
    status: "CONDITIONAL",
    evidence: "Exceptional epistemic discipline: evidence labels, digest pinning, fail-closed provenance.",
    outstandingGap: "The core claim is unverifiable, the pinned anchor's claim has drifted, and the weld ledger is self-contradictory.",
    consequence: "Honest, but not conclusive.",
    confidence: "HIGH",
  },
];

/**
 * Blocker register.
 *
 * Identifiers are preserved because they are stable, non-sensitive references
 * that let a reader find the corresponding entry in the dated assessment.
 * Specific unpatched-defect symbols are intentionally not reproduced.
 */
export const blockers: readonly Blocker[] = [
  {
    id: "AUTH-000",
    severity: "P0",
    type: "GOVERNANCE",
    title: "No authority principal exists",
    whatIsKnown:
      "The trusted-issuer registry is empty, so no delegation can confer effective authority. A machine agent issued four adoption decisions and then invalidated them, with the recorded reasoning that adoption authority was not established.",
    whyItMatters:
      "Without a principal, nothing can be ratified at all. This is upstream of every other governance blocker and is not an engineering task.",
    evidence: "Governance decision ledger and the empty trusted-issuer registry, inspected directly at assessment time.",
    needed: "Name a human or delegated authority, enroll it, and have it issue recorded rulings.",
    owner: "Operator",
    disposition: "Blocks everything",
  },
  {
    id: "GOV-001",
    severity: "P0",
    type: "GOVERNANCE",
    title: "Work landed on top of an unaccepted gate",
    whatIsKnown:
      "Gate G3 is recorded as NOT ACCEPTED, yet substantial later phase and research-subsystem work was committed afterwards.",
    whyItMatters: "No phase can legitimately advance while the gate it depends on is unaccepted.",
    evidence: "Roadmap status quoted in the conflict ADR and the freeze notice, corroborated by the commit log.",
    needed: "An authority ruling on G3, or an explicit decision to re-sequence the work.",
    owner: "Governance authority + operator",
    disposition: "Escalate / freeze (active)",
  },
  {
    id: "EVAL-001",
    severity: "P0",
    type: "EVIDENCE",
    title: "Canonical evaluation dataset is missing and the instrument drifted",
    whatIsKnown:
      "The canonical holdout dataset is absent and classified unverifiable with reconstruction not permitted. Five of nine pinned instrument digests no longer match the tree, including the canonical broker component.",
    whyItMatters:
      "Every effect size cited by the project becomes unattributable. This is why the central thesis is self-graded UNRESOLVED.",
    evidence: "Project README key-results table and the frozen-instrument drift record, read directly.",
    needed: "Either recover the dataset and re-match digests, or formally withdraw the claim and re-scope to what is verifiable.",
    owner: "Operator / governance authority",
    disposition: "Quarantine claim; do not rewrite the anchor",
  },
  {
    id: "EVAL-002",
    severity: "P0",
    type: "EVIDENCE",
    title: "Reproducibility manifest conflates two campaigns",
    whatIsKnown: "A manifest spanning two campaigns certified the wrong, quarantined dataset.",
    whyItMatters: "A gate certified results that were never admissible.",
    evidence: "Campaign reproducibility manifest, inspected at assessment time.",
    needed: "Add a cross-block consistency check to the validator.",
    owner: "Engineering + operator",
    disposition: "Validator change required",
  },
  {
    id: "GOV-002",
    severity: "P1",
    type: "GOVERNANCE",
    title: "Weld ledger is self-contradictory",
    whatIsKnown: 'The same file asserts all fifteen items welded and simultaneously records an item still owed.',
    whyItMatters: "The basis of the G3 submission is incoherent and cannot be reviewed as written.",
    evidence: "Weld ledger read directly; also disputed by a 78-file classification.",
    needed: "Reconcile into one reviewed table.",
    owner: "Engineering + governance authority",
    disposition: "Reconcile",
  },
  {
    id: "GOV-003",
    severity: "P1",
    type: "GOVERNANCE",
    title: "Operator decisions have no authority ledger",
    whatIsKnown: "Six operator decisions have no recorded mechanism establishing who made them.",
    whyItMatters: "Decisions cannot be shown to have been made.",
    evidence: "Decision register at the assessed commit.",
    needed: "Enroll decisions through the registry, seeded as PROPOSED.",
    owner: "Operator via registry",
    disposition: "Registry exists but is untracked",
  },
  {
    id: "ARCH-001",
    severity: "P1",
    type: "TECH",
    title: "Legacy execution plane is not fully mediated",
    whatIsKnown:
      "A substantial number of effect files sit outside the canonical mediation path, and some 'dead' code is only established as dead by import failure.",
    whyItMatters: "The documented single-ownership invariant holds only inside the canonical import closure, not repository-wide.",
    evidence: "Perimeter classification disputed between the weld ledger and the roadmap.",
    needed: "Complete welding and treat dead-by-import as NOT deleted.",
    owner: "Engineering + governance authority",
    disposition: "Complete welding",
  },
  {
    id: "SEC-001",
    severity: "P1",
    type: "TECH",
    title: "No dependency lockfile",
    whatIsKnown: "No lockfile of any kind is present; major-version drift is recorded and the project virtualenv lacks pip.",
    whyItMatters: "The system cannot be reconstructed, so no result can be independently reproduced.",
    evidence: "Verified absence of all common lockfile names.",
    needed: "Add a lockfile and upper bounds on dependencies.",
    owner: "Engineering",
    disposition: "Repairable",
  },
  {
    id: "SEC-003",
    severity: "P1",
    type: "RISK",
    title: "No license, and offensive tooling in-tree",
    whatIsKnown:
      "No license file exists while offensive payload modules and a volumetric-attack service remain in the tree.",
    whyItMatters: "Distribution and legal exposure, plus an unresolved authorized-use posture.",
    evidence: "Verified absence of a license; directory inventory inspected directly.",
    needed: "Choose a license, produce an SBOM, and settle an authorized-use posture.",
    owner: "Operator (human decision)",
    disposition: "Blocking for public release",
  },
  {
    id: "CRED-001",
    severity: "P1",
    type: "RISK",
    title: "Credentials exposed in repository history",
    whatIsKnown:
      "A small number of third-party API keys were found exposed. The working tree was redacted but history was not purged, and rotation was recorded as PENDING.",
    whyItMatters:
      "Credential compromise persists until the keys are rotated. Redacting the working tree alone does not remediate exposure.",
    evidence: "A credential-exposure record dated 2026-10-04 exists in the corpus. Values were deliberately not accessed or reproduced.",
    needed: "Rotate the keys first, then decide separately whether to purge history.",
    owner: "Operator",
    disposition: "Rotate, then decide on history purge",
  },
  {
    id: "EVAL-003",
    severity: "P1",
    type: "EVIDENCE",
    title: "README published results from unverifiable data",
    whatIsKnown: "The README presents campaign results that the same document grades as unverifiable.",
    whyItMatters: "A reader could be misled about the strength of the evidence.",
    evidence: "README key-results table, read directly.",
    needed: "Partially addressed by truth-sync edits that were uncommitted at assessment time.",
    owner: "Engineering",
    disposition: "Partially fixed in an uncommitted working set",
  },
  {
    id: "EVAL-004",
    severity: "P1",
    type: "EVIDENCE",
    title: "Snapshot origin binding not implemented",
    whatIsKnown: "The experiment snapshot type does not yet bind its origin.",
    whyItMatters: "A later gate is blocked by this gap.",
    evidence: "Recorded as an open evaluation defect.",
    needed: "Extend the snapshot type.",
    owner: "Engineering",
    disposition: "Open",
  },
  {
    id: "ARCH-002",
    severity: "P1",
    type: "EVIDENCE",
    title: "Nested test suite mutates tracked evidence",
    whatIsKnown: "A nested suite writes to tracked evidence and has no isolation fixture.",
    whyItMatters: "Running the suite corrupts the evidence corpus it is supposed to measure.",
    evidence: "Observed in the corpus at assessment time.",
    needed: "Add an isolation fixture.",
    owner: "Engineering",
    disposition: "Open",
  },
  {
    id: "SEC-004",
    severity: "P2",
    type: "RISK",
    title: "Weak container isolation defaults",
    whatIsKnown: "Compose configuration has no healthchecks, no read-only filesystems, and weak default credentials.",
    whyItMatters: "Isolation is weaker than the architecture implies.",
    evidence: "Compose configuration read directly.",
    needed: "Harden compose and remove default credentials.",
    owner: "Engineering",
    disposition: "Repairable",
  },
  {
    id: "GOV-004",
    severity: "P2",
    type: "GOVERNANCE",
    title: "Stale self-declared canonical state document",
    whatIsKnown:
      "A state document declares itself canonical but pins a stale commit and a test floor that contradicts the reviewer guide.",
    whyItMatters: "Readers are actively misled about the current state.",
    evidence: "State document versus reviewer guide, both read directly.",
    needed: "Regenerate or delete it.",
    owner: "Engineering",
    disposition: "Open",
  },
  {
    id: "GOV-005",
    severity: "P2",
    type: "GOVERNANCE",
    title: "Duplicate architecture decision records",
    whatIsKnown: "Two records share one identifier while covering different subjects.",
    whyItMatters: "Precedence between them is ambiguous.",
    evidence: "Decision register inspected directly.",
    needed: "Renumber one and update references.",
    owner: "Governance authority",
    disposition: "Open",
  },
  {
    id: "DOC-001",
    severity: "P2",
    type: "CONTRADICTION",
    title: "Interpreter envelope is self-contradictory",
    whatIsKnown: "The README, the dependency pin and the recorded run environments disagree on the supported interpreter range.",
    whyItMatters: "The declared envelope was never actually satisfied by a recorded run.",
    evidence: "Three-way conflict recorded at assessment time.",
    needed: "Choose a single supported floor.",
    owner: "Engineering",
    disposition: "Open",
  },
  {
    id: "COR-001",
    severity: "P2",
    type: "EVIDENCE",
    title: "Defect register incomplete",
    whatIsKnown: "Only one defect record was committed; two further records existed only in an uncommitted working set.",
    whyItMatters: "Deferred defects are hidden from review.",
    evidence: "Defect register at the assessed commit.",
    needed: "Commit the outstanding records.",
    owner: "Engineering",
    disposition: "Partially addressed in an uncommitted working set",
  },
  {
    id: "OPS-001",
    severity: "P2",
    type: "TECH",
    title: "Deployment unvalidated and no CI at the assessed commit",
    whatIsKnown: "No continuous integration is bound to the assessed commit and deployment is unvalidated.",
    whyItMatters: "Changes cannot be shown to be operable or verifiable.",
    evidence: "Recorded as an open operational defect.",
    needed: "Add CI and a deploy/rollback runbook.",
    owner: "Engineering",
    disposition: "Repairable",
  },
  {
    id: "SEC-005",
    severity: "P2",
    type: "TECH",
    title: "Tooling breaks on newer interpreters; packaging excludes service directories",
    whatIsKnown:
      "A developer tool raises at import on newer interpreter versions, and packaging configuration excludes real service directories.",
    whyItMatters: "Tooling and installs break.",
    evidence: "Recorded as an open technical defect.",
    needed: "Add an import guard and fix packaging.",
    owner: "Engineering",
    disposition: "Repairable",
  },
  {
    id: "OPS-002",
    severity: "P3",
    type: "TECH",
    title: "Scripts hardcode an absolute local path",
    whatIsKnown: "A helper script embeds a machine-specific absolute path.",
    whyItMatters: "The script fails anywhere else.",
    evidence: "Observed in the corpus.",
    needed: "Parameterise the path.",
    owner: "Engineering",
    disposition: "Repairable",
  },
  {
    id: "PERF-001",
    severity: "P3",
    type: "EVIDENCE",
    title: "Performance is uncharacterized",
    whatIsKnown: "No performance measurement of any kind exists; the corpus contains no latency percentiles at all.",
    whyItMatters: "There is no operational basis for capacity or feasibility claims.",
    evidence: "Assessed as not performed and uncharacterized.",
    needed: "Approve a benchmark protocol, then measure.",
    owner: "Engineering + operator",
    disposition: "Not started",
  },
];

export const timeline: readonly TimelineEvent[] = [
  { date: "2026-08-05 → 2026-08", approximate: true, event: "Two evaluation campaigns run; the first is later quarantined.", label: "DOCUMENTED" },
  { date: "2026-08-08", approximate: false, event: "A student report artifact is produced.", label: "VERIFIED" },
  { date: "2026-09", approximate: true, event: "v2.0 to v2.1 migration; roadmap revisions v4, v4.1 and v4.2 authored.", label: "VERIFIED" },
  { date: "2026-10-04", approximate: false, event: "Clean floor established; arena contamination detected; credential exposure found during an end-to-end audit.", label: "VERIFIED" },
  { date: "2026-10-05 → 2026-10-07", approximate: true, event: "Milestone waves M1-M3; research-subsystem work begins.", label: "DOCUMENTED" },
  { date: "2026-10-09", approximate: false, event: "Blocker report; product-readiness audit returns NOT_READY; an independent subsystem audit returns scope-limited PASS; G3 remediation; research freeze notice; conflict ADR raised.", label: "VERIFIED" },
  { date: "2026-10-11", approximate: false, event: "Governance registry created; a machine agent self-adopts four decisions and the adoptions are subsequently invalidated; a weld-discrepancy commit lands.", label: "VERIFIED" },
  { date: "2026-10-12", approximate: false, event: "Snapshots, verification bundles and readiness briefs created.", label: "VERIFIED" },
  { date: "2026-10-16", approximate: false, event: "Viability and successor assessment performed; disposition recorded as freeze plus successor.", label: "VERIFIED" },
];

export const strategicOptions: readonly StrategicOption[] = [
  {
    key: "A",
    name: "Complete Raphael",
    benefits: "Preserves all work. If the authority and the dataset materialise, a finished platform.",
    costs: "Approximately 6-12 person-weeks, or 1-3 person-months if the campaign must be rerun. Governance burden is unbounded.",
    criticalDependencies: "An authority principal (AUTH-000) and the missing dataset (EVAL-001).",
    risks: "High. Unlicensed offensive surface plus unmediated files.",
    evidenceRequired: "Full gate re-verification including a recovered dataset.",
    uncertainties: "Can the authority ever rule? Can the dataset be recovered?",
    conditionsForSuccess: "Authority defined and ruling, accepted unverifiability, and licensing resolved.",
    illustrativeScore: 2.3,
  },
  {
    key: "B",
    name: "Freeze Raphael and build the successor",
    benefits: "Clean baseline. Low marginal cost, because the successor was already in progress.",
    costs: "Salvage labour to carry design laws across by citation.",
    criticalDependencies: "Continued discipline in the successor project.",
    risks: "Low to medium. Clean-room, resettable.",
    evidenceRequired: "The successor's own gate evidence.",
    uncertainties: "Whether the successor reaches its own live-brain milestone.",
    conditionsForSuccess: "Maintained successor discipline.",
    illustrativeScore: 3.9,
  },
  {
    key: "C",
    name: "Selective salvage",
    benefits: "Keeps only components that pass explicit criteria. Bounded scope.",
    costs: "Medium. Accepts some legacy debt.",
    criticalDependencies: "Explicit acceptance criteria per component.",
    risks: "Medium. Residual legacy exposure.",
    evidenceRequired: "Per-component verification.",
    uncertainties: "Which components actually pass their criteria.",
    conditionsForSuccess: "Rigorous acceptance tests.",
    illustrativeScore: 2.8,
  },
  {
    key: "D",
    name: "Archive and defer",
    benefits: "Zero further cost. The truth is preserved.",
    costs: "Forgone value. The project is frozen as-is.",
    criticalDependencies: "None.",
    risks: "Lowest immediate. The risk is parked, not removed.",
    evidenceRequired: "None beyond archiving.",
    uncertainties: "When or whether requirements ever clarify.",
    conditionsForSuccess: "None.",
    illustrativeScore: 3.5,
  },
];

export const recommendedPath = {
  disposition: ASSESSMENT.disposition,
  hybrid: "Selective salvage of design assets by citation into the independent successor.",
  rationale: [
    "Not 'complete': completion is gated on an authority loop that does not exist and on a dataset that appears unrecoverable, while the central claim is self-graded UNRESOLVED. Completing would mean standing up governance to certify results that cannot be certified.",
    "Not 'archive and defer' alone: deferral would waste the fact that a disciplined successor already existed and was advancing.",
    "Salvage is folded in as citation of design laws into the successor, not continued operation of code whose provenance is no longer attributable.",
  ],
  wouldChange: [
    "Recovery of the canonical holdout dataset together with re-matched instrument digests would make the research claim testable again.",
    "A named authority principal enrolled and issuing a recorded G3 ruling would unlock the gate chain.",
    "Abandonment or stagnation of the successor would make pure archive-and-defer the honest fallback.",
    "A decision to operate the canonical runtime only, as an internal tool with the campaign dropped, makes scoped salvage viable.",
  ],
  notAuthorisation:
    "This is a technical recommendation by an independent assessor. It is not an official governance decision, not an authorisation to implement changes, and not a gate acceptance.",
} as const;

export const preservedDesignLaws: readonly string[] = [
  "Broker / enforcement-point separation",
  "Born-gated runtime",
  "No second entry point",
  "Epistemic taxonomy",
  "Falsification as claim promotion",
  "Fail-closed provenance",
  "Evidence-labelling discipline",
  "Measurement contract (grid accounting)",
  "Guardrail-test patterns",
];

export const doNotCarryForward: readonly string[] = [
  "Offensive payload modules",
  "Volumetric-attack (denial-of-service) service",
  "In-source credential anti-patterns",
  "The large result-corpus whose provenance is questionable and which a test suite mutates",
  "The unisolated nested test suite",
  "The stale self-declared canonical state document",
  "The oversized roadmap as a process model",
];

export const whatExistsVsProven: readonly {
  layer: string;
  statement: string;
  label: "VERIFIED" | "DOCUMENTED" | "NOT_ESTABLISHED";
}[] = [
  {
    layer: "Components present in source",
    statement:
      "The canonical runtime, broker, enforcement point, execution boundary and evidence components are statically present in the tree.",
    label: "VERIFIED",
  },
  {
    layer: "Behaviour documented by the project",
    statement:
      "The project documents an intended end-to-end workflow and a single-owner execution invariant.",
    label: "DOCUMENTED",
  },
  {
    layer: "Results reported by previous audits",
    statement:
      "A third-party subsystem audit reported a passing suite at a frozen commit, and a product-readiness audit returned NOT_READY.",
    label: "DOCUMENTED",
  },
  {
    layer: "Properties independently verified in the dated assessment",
    statement:
      "The assessment executed no tests of its own. Its verified claims are structural and documentary: identity, digests, absent artifacts, contradictions between documents, and governance state.",
    label: "VERIFIED",
  },
  {
    layer: "Work not performed",
    statement:
      "Full suite execution, reproduction of reported import failures, any performance measurement, and any audit of environment-file contents.",
    label: "NOT_ESTABLISHED",
  },
];

export const openQuestions: readonly OpenQuestion[] = [
  {
    id: "Q1",
    question: "Which design principles measurably improve agent reliability?",
    rationale:
      "The project treats several principles as laws, but a law that cannot be falsified cannot be shown to help.",
  },
  {
    id: "Q2",
    question: "How can evidence provenance prevent unsupported promotion of claims?",
    rationale:
      "The central thesis failed partly because a pinned anchor's claim outlived the tree it described.",
  },
  {
    id: "Q3",
    question: "How can evaluation remain reproducible when the system under evaluation evolves?",
    rationale:
      "An evaluator that changes with its subject is not a measuring instrument.",
  },
  {
    id: "Q4",
    question: "How can authorization remain fail-closed across every relevant execution path?",
    rationale:
      "A fail-closed property proven only inside the canonical closure does not hold repository-wide.",
  },
  {
    id: "Q5",
    question: "What evidence would justify adopting a particular paper's technique?",
    rationale:
      "Conceptual similarity is currently the weakest link between the literature and the implementation.",
  },
];