import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  architectureLastReviewed,
  architectureSources,
  currentArchitecture,
  gateStates,
  getComponent,
  knownGaps,
  legendEntryFor,
  liveProjectUrl,
  phaseSequencingRule,
  roadmapPhases,
  rsiAbsentSubstrate,
  rsiReadinessBanner,
  rsiRules,
  statusLegend,
  targetArchitecture,
  trustBoundaries,
  type ComponentStatus,
} from "@/content/raphael-architecture";
import { projects, navItems } from "@/config/site";

/**
 * ARCHITECTURE EXPLORER TESTS
 *
 * Tripwires, in the same spirit as release-gate.test.ts. The failure mode this
 * page has to defend against is specific and quiet: a diagram that looks
 * scrupulous while quietly implying that a blocked gate is nearly passed, that a
 * proposal is a deployment, or that a defect recorded in 2026-09 was fixed.
 *
 * These tests assert RELATIONSHIPS AND INVARIANTS rather than prose, so a
 * future rewrite that preserves the meaning passes and one that quietly drops the
 * caveat fails.
 */

const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

/**
 * Remove block and line comments before asserting on source text.
 *
 * Several assertions below are negative ("this pattern must not survive"). A
 * comment that QUOTES the old pattern in order to explain why it was replaced
 * would otherwise fail them, which would push a future maintainer toward
 * deleting the explanation rather than fixing the code.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/* ========================================================================== */
/* Both views exist and are separate                                            */
/* ========================================================================== */

describe("two architecture views", () => {
  it("provides a current view and a target view as separate objects", () => {
    expect(currentArchitecture.view).toBe("current");
    expect(targetArchitecture.view).toBe("target");
    // Separate objects, not one object with a flag. Sharing them is how a
    // proposal would inherit a documented snapshot's statuses.
    expect(currentArchitecture).not.toBe(targetArchitecture);
    expect(currentArchitecture.components).not.toBe(targetArchitecture.components);
  });

  it("gives every component a unique id within its own view", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      const ids = model.components.map((c) => c.id);
      expect(new Set(ids).size, `${model.view} has duplicate component ids`).toBe(ids.length);
    }
  });

  it("gives every component all four inspectable facts", () => {
    // Name, responsibility, status, invariant, limitation, required evidence.
    for (const model of [currentArchitecture, targetArchitecture]) {
      for (const c of model.components) {
        expect(c.responsibility.trim().length, `${model.view}/${c.id} responsibility`).toBeGreaterThan(10);
        expect(c.invariant.trim().length, `${model.view}/${c.id} invariant`).toBeGreaterThan(10);
        expect(c.limitation.trim().length, `${model.view}/${c.id} limitation`).toBeGreaterThan(10);
        expect(
          c.evidenceRequired.trim().length,
          `${model.view}/${c.id} evidenceRequired`,
        ).toBeGreaterThan(10);
        expect(c.sourceNote.trim().length, `${model.view}/${c.id} sourceNote`).toBeGreaterThan(5);
        expect(statusLegend.map((l) => l.status)).toContain(c.status);
      }
    }
  });

  it("resolves every edge and band to a real component", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      const ids = new Set(model.components.map((c) => c.id));
      for (const edge of model.edges) {
        expect(ids.has(edge.from), `${model.view} edge.from ${edge.from} missing`).toBe(true);
        expect(ids.has(edge.to), `${model.view} edge.to ${edge.to} missing`).toBe(true);
      }
      for (const band of model.bands) {
        for (const id of band.componentIds) {
          expect(ids.has(id), `${model.view} band ${band.id} references ${id}`).toBe(true);
        }
      }
    }
  });

  it("places every component in exactly one band", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      const placed = model.bands.flatMap((b) => [...b.componentIds]);
      expect(new Set(placed).size, `${model.view} places a component twice`).toBe(placed.length);
      expect(placed.sort()).toEqual(model.components.map((c) => c.id).sort());
    }
  });
  it("states deny-by-default as an always-visible key property in both views", () => {
    // A headline security claim must not live only behind a node click. Assert
    // the DATA carries it, then that the diagram renders keyProperties without
    // any interaction.
    for (const model of [currentArchitecture, targetArchitecture]) {
      const joined = model.keyProperties.map((p) => `${p.label} ${p.text}`).join(" ");
      expect(joined, `${model.view} must state deny-by-default`).toMatch(/deny-by-default/i);
    }
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/model\.keyProperties\.map/);
  });

  it("names deny-by-default, one execution route and evidence-never-authorizes as key properties", () => {
    const joined = currentArchitecture.keyProperties.map((p) => p.label).join(" | ");
    expect(joined).toMatch(/deny-by-default/i);
    expect(joined).toMatch(/one execution route/i);
    expect(joined).toMatch(/does not authorize/i);
    expect(joined).toMatch(/never an authorization/i);
    for (const p of currentArchitecture.keyProperties) {
      expect(p.text.trim().length).toBeGreaterThan(20);
    }
  });

  it("gives both views key properties", () => {
    expect(currentArchitecture.keyProperties.length).toBeGreaterThanOrEqual(4);
    expect(targetArchitecture.keyProperties.length).toBeGreaterThanOrEqual(4);
  });
});

/* ========================================================================== */
/* The target view must never read as implemented                              */
/* ========================================================================== */

describe("target architecture is proposed, not implemented", () => {
  it("is titled as proposed and not implemented", () => {
    expect(targetArchitecture.title).toMatch(/Blueprint v4\.2/);
    expect(targetArchitecture.title).toMatch(/Proposed, not implemented/i);
    expect(targetArchitecture.statusLabel).toMatch(/Proposed, not implemented/i);
    expect(targetArchitecture.framing).toMatch(/does not represent current production readiness/i);
  });

  it("marks NO target component as implemented or documented-in-snapshot", () => {
    // The core invariant. If a future edit promotes any target component, this
    // fails, which is the intended behaviour.
    for (const c of targetArchitecture.components) {
      expect(
        ["not_yet_implemented", "partial_not_yet_demonstrated"],
        `target component ${c.id} is ${c.status}`,
      ).toContain(c.status);
      expect(c.status).not.toBe("implemented_acceptance_pending");
      expect(c.status).not.toBe("documented_in_reviewed_snapshot");
      expect(c.status).not.toBe("known_issue_at_reviewed_snapshot");
    }
  });

  it("frames its framing text as a proposal rather than a description", () => {
    expect(targetArchitecture.framing).toMatch(/intended destination/i);
    expect(targetArchitecture.framing).toMatch(/no component on it is built/i);
  });

  it("separates the improvement workflow from the production task loop", () => {
    const loop = targetArchitecture.bands.find((b) => b.id === "task-loop");
    const improvement = targetArchitecture.bands.find((b) => b.id === "improvement");
    expect(loop).toBeDefined();
    expect(improvement).toBeDefined();
    // The two bands must not share components: the improvement workflow is a
    // separate outer loop, not part of a task episode.
    expect(loop!.componentIds.some((id) => improvement!.componentIds.includes(id))).toBe(false);
    expect(improvement!.emphasis).toBe("separate");
    expect(improvement!.caption).toMatch(/not part of the production task loop/i);
  });
});

/* ========================================================================== */
/* Current view must not overstate the documented state                        */
/* ========================================================================== */

describe("current architecture does not assert unproven capabilities", () => {
  /** The four claims the task forbids the current view from asserting. */
  it("does not claim WorldModel integration is complete", () => {
    const wm = getComponent(currentArchitecture, "worldmodel_read")!;
    const integrate = getComponent(currentArchitecture, "worldmodel_integrate")!;
    expect(wm.status).toBe("partial_not_yet_demonstrated");
    expect(integrate.status).toBe("partial_not_yet_demonstrated");
    expect(wm.limitation).toMatch(/minimal/i);
  });

  it("does not claim falsification or replanning is demonstrated", () => {
    const contradiction = getComponent(currentArchitecture, "contradiction")!;
    const replan = getComponent(currentArchitecture, "replan")!;
    expect(contradiction.status).toBe("partial_not_yet_demonstrated");
    expect(replan.status).toBe("partial_not_yet_demonstrated");
    expect(contradiction.limitation).toMatch(/stub|terminator/i);
    expect(replan.limitation).toMatch(/not yet demonstrated/i);
  });

  it("describes the Student as recording-only rather than influencing selection", () => {
    const student = getComponent(currentArchitecture, "student")!;
    expect(student.status).toBe("partial_not_yet_demonstrated");
    expect(student.limitation).toMatch(/recording-only/i);
    expect(student.limitation).toMatch(/not fed into planner request selection/i);
  });

  it("does not present the planner as a demonstrated autonomous decision loop", () => {
    const planner = getComponent(currentArchitecture, "planner")!;
    expect(planner.status).toBe("partial_not_yet_demonstrated");
    expect(planner.limitation).toMatch(/deterministic ActionRequest/i);
    expect(planner.limitation).toMatch(/not demonstrated|complete autonomous planning loop is not/i);
  });

  it("does not claim evaluation parity with the canonical runtime", () => {
    const arena = getComponent(currentArchitecture, "arena")!;
    expect(arena.status).toBe("partial_not_yet_demonstrated");
    expect(arena.trustRole).toBe("evaluation");
    expect(arena.limitation).toMatch(/parity.*not proven|not proven/i);
    // Evaluation is never an authorization or enforcement authority.
    expect(arena.trustRole).not.toBe("authorization");
    expect(arena.trustRole).not.toBe("enforcement");
  });

  it("never marks the current runtime as production ready", () => {
    const runtime = getComponent(currentArchitecture, "runtime")!;
    // Implemented, but gate acceptance is a separate governance decision, so the
    // status must stay the acceptance-pending one and never a settled "ready".
    expect(runtime.status).toBe("implemented_acceptance_pending");
    expect(runtime.limitation).toMatch(/not verified/i);
    // The framing text, not just the status, must disclaim production readiness.
    expect(currentArchitecture.framing).toMatch(/not a fresh confirmation/i);
  });
});

/* ========================================================================== */
/* Legacy paths must stay visually and structurally separate                    */
/* ========================================================================== */

describe("legacy execution paths are kept separate from the canonical runtime", () => {
  it("keeps legacy components in their own band", () => {
    const legacy = currentArchitecture.bands.find((b) => b.id === "legacy")!;
    expect(legacy).toBeDefined();
    expect(legacy.emphasis).toBe("separate");
    expect(legacy.componentIds).toContain("legacy_entry");
    expect(legacy.componentIds).toContain("legacy_autonomous");
    expect(legacy.componentIds).toContain("legacy_clients");
  });

  it("keeps the canonical runtime band free of legacy components", () => {
    const canonical = currentArchitecture.bands.find((b) => b.id === "loop")!;
    const legacy = currentArchitecture.bands.find((b) => b.id === "legacy")!;
    for (const id of legacy.componentIds) {
      expect(canonical.componentIds, `${id} leaked into the canonical band`).not.toContain(id);
    }
  });

  it("draws the legacy path with a legacy edge style, not a trusted one", () => {
    const legacyEdges = currentArchitecture.edges.filter((e) => e.style === "legacy");
    expect(legacyEdges.length).toBeGreaterThan(0);
    // The dashed/legacy style must be used for the legacy chain itself.
    for (const e of legacyEdges) {
      const from = getComponent(currentArchitecture, e.from)!;
      const to = getComponent(currentArchitecture, e.to)!;
      const isLegacyNode =
        from.stageLabel === "legacy" || to.stageLabel === "legacy";
      expect(isLegacyNode, `${e.from}->${e.to} is legacy-styled but not a legacy node`).toBe(true);
    }
  });

  it("labels the legacy disposition as requiring evidence rather than resolved", () => {
    const entry = getComponent(currentArchitecture, "legacy_entry")!;
    expect(entry.status).toBe("known_issue_at_reviewed_snapshot");
    expect(entry.limitation).toMatch(/not proven to be a second decision point/i);
    expect(entry.limitation).toMatch(/perimeter record/i);
    // The connecting edge must say the disposition needs evidence.
    const edge = currentArchitecture.edges.find((e) => e.to === "legacy_entry")!;
    expect(edge.style).toBe("legacy");
    expect(edge.label).toMatch(/disposition needs evidence/i);
  });
});

/* ========================================================================== */
/* Broker / PEP / sandbox distinctions                                          */
/* ========================================================================== */

describe("authorization, enforcement and mechanism are distinct", () => {
  it("gives the broker the authorization role and the deny-by-default invariant", () => {
    const broker = getComponent(currentArchitecture, "broker")!;
    expect(broker.trustRole).toBe("authorization");
    expect(broker.invariant).toMatch(/Deny by default/i);
    expect(broker.invariant).toMatch(/never a second decision point|never a second/i);
  });

  it("gives exec/ the enforcement role and single-primitive ownership", () => {
    const pep = getComponent(currentArchitecture, "pep")!;
    expect(pep.trustRole).toBe("enforcement");
    // Sole primitive ownership is the INVARIANT, not just the description.
    expect(pep.invariant).toMatch(/sole owner of process, network and filesystem primitives/i);
    expect(pep.invariant).toMatch(/single enforcement point distinct from the decision point/i);
  });

  it("gives the sandbox a mechanism role and denies it authority", () => {
    const sandbox = getComponent(currentArchitecture, "sandbox")!;
    expect(sandbox.trustRole).toBe("mechanism");
    expect(sandbox.invariant).toMatch(/never an authorization authority/i);

    const tSandbox = getComponent(targetArchitecture, "t_sandbox")!;
    expect(tSandbox.trustRole).toBe("mechanism");
    expect(tSandbox.invariant).toMatch(/cannot grant permission/i);
  });

  it("marks the broker as the only authorization authority in either view", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      const authorities = model.components.filter((c) => c.trustRole === "authorization");
      expect(authorities, `${model.view} must have exactly one PDP`).toHaveLength(1);
      expect(authorities[0].label).toMatch(/Broker/i);
    }
  });

  it("marks the enforcement point as the only enforcement authority in either view", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      const enforcement = model.components.filter((c) => c.trustRole === "enforcement");
      expect(enforcement, `${model.view} must have exactly one PEP`).toHaveLength(1);
      expect(enforcement[0].label).toMatch(/exec\//);
    }
  });

  it("treats evidence as never itself an authorization", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      for (const c of model.components.filter((x) => x.trustRole === "evidence")) {
        expect(c.trustRole).not.toBe("authorization");
      }
    }
    expect(getComponent(currentArchitecture, "receipt")!.invariant).toMatch(
      /Evidence never grants authorization/i,
    );
    expect(getComponent(targetArchitecture, "t_receipt")!.invariant).toMatch(
      /Evidence is not authorization/i,
    );
  });

  it("treats the Student as proposal-only in both views", () => {
    expect(getComponent(currentArchitecture, "student")!.trustRole).toBe("proposal");
    const tStudent = getComponent(targetArchitecture, "t_student")!;
    expect(tStudent.trustRole).toBe("proposal");
    expect(tStudent.invariant).toMatch(/never authorizes/i);
    expect(tStudent.invariant).toMatch(/never writes trusted WorldModel beliefs/i);
  });
});

/* ========================================================================== */
/* F1 and the legacy defect: disposition discipline                             */
/* ========================================================================== */

describe("known gaps never silently close", () => {
  it("records F1 with both the reviewed-snapshot state and the newer evidence", () => {
    const f1 = knownGaps.find((g) => g.id === "F1")!;
    expect(f1).toBeDefined();
    expect(f1.recordedAtReview).toMatch(/unfixed|proven and unfixed/i);
    expect(f1.recordedAtReview).toMatch(/did not bind capability, action type, method or arguments/i);
    expect(f1.currentDisposition).toMatch(/reports this implemented/i);
  });

  it("keeps F1 at unconfirmed disposition despite newer remediation evidence", () => {
    // The whole point. A later self-report is not an independent confirmation, and
    // the gate that would accept it is still blocked.
    const f1 = knownGaps.find((g) => g.id === "F1")!;
    expect(f1.dispositionConfidence).toBe("unconfirmed");
    expect(f1.currentDisposition).toMatch(/not.*gate acceptance|is not gate acceptance/i);
  });

  it("records F2 as a perimeter record only, with deletion deferred", () => {
    const f2 = knownGaps.find((g) => g.id === "F2")!;
    expect(f2.dispositionConfidence).toBe("unconfirmed");
    expect(f2.currentDisposition).toMatch(/perimeter record only/i);
    expect(f2.currentDisposition).toMatch(/NOT deleted and NOT refactored/i);
  });

  it("labels every gap's present-day disposition unconfirmed where that is the truth", () => {
    for (const gap of knownGaps) {
      expect(
        ["confirmed", "unconfirmed"],
        `gap ${gap.id} has an invalid confidence`,
      ).toContain(gap.dispositionConfidence);
      expect(gap.currentDisposition.trim().length).toBeGreaterThan(20);
    }
    // As read from the available evidence, none of these are settled.
    expect(knownGaps.every((g) => g.dispositionConfidence === "unconfirmed")).toBe(true);
  });

  it("separates the recorded state from the current disposition for every gap", () => {
    // If these two were merged, an old defect could be marked fixed by rewriting
    // one field. Keeping them distinct is the mechanism.
    for (const gap of knownGaps) {
      expect(gap.recordedAtReview).not.toBe(gap.currentDisposition);
      expect(gap.recordedAtReview.trim().length).toBeGreaterThan(40);
    }
  });
});

/* ========================================================================== */
/* Gate statuses must remain visible                                            */
/* ========================================================================== */

describe("recorded gate statuses stay visible and verbatim", () => {
  it("records G3 as NOT ACCEPTED / BLOCKED", () => {
    const g3 = gateStates.find((g) => g.id === "G3")!;
    expect(g3.recordedStatus).toBe("NOT ACCEPTED / BLOCKED");
  });

  it("records AM-4-R3 as NOT EXECUTED", () => {
    expect(gateStates.find((g) => g.id === "AM-4-R3")!.recordedStatus).toBe("NOT EXECUTED");
  });

  it("records the central research thesis as UNRESOLVED", () => {
    expect(
      gateStates.find((g) => g.id === "Central research thesis")!.recordedStatus,
    ).toBe("UNRESOLVED");
  });

  it("records the source-release gate as CLOSED", () => {
    expect(gateStates.find((g) => g.id === "Source-release gate")!.recordedStatus).toBe(
      "CLOSED",
    );
  });

  it("records RSI implementation as NOT STARTED", () => {
    expect(gateStates.find((g) => g.id === "RSI implementation")!.recordedStatus).toBe(
      "NOT STARTED",
    );
  });

  it("renders every gate status through the gateStates data the panel consumes", () => {
    // The panel renders `gate.recordedStatus` from the content module, so the
    // rendered surface is bound by the DATA, not by literal text in the JSX.
    // Asserting the strings appear in the panel source would pass while the
    // panel actually rendered a hardcoded subset.
    const panels = read("src/components/arch/ArchitecturePanels.tsx");
    expect(panels).toMatch(/gateStates\.map/);
    expect(panels).toMatch(/\{gate\.recordedStatus\}/);
    // And the rendered value is exactly what the record says.
    for (const gate of gateStates) {
      expect(gate.recordedStatus).toBe(gate.recordedStatus.trim());
      expect(gate.recordedStatus.length).toBeGreaterThan(0);
    }
  });

  it("renders the blocked, not-executed and unresolved markers on the page", () => {
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).toContain("GateStatusStrip");
  });

  it("does not soften a blocked status into a hopeful paraphrase", () => {
    const g3 = gateStates.find((g) => g.id === "G3")!;
    expect(g3.recordedStatus).not.toMatch(/progress|pending|approaching|on track|nearly/i);
    expect(g3.note).toMatch(/not an acceptance/i);
  });
});

/* ========================================================================== */
/* Roadmap strip                                                               */
/* ========================================================================== */

describe("roadmap phases and gates", () => {
  it("spans P0/G0 through P10/G10 in order", () => {
    expect(roadmapPhases.map((p) => p.id)).toEqual([
      "P0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8", "P9", "P10",
    ]);
    expect(roadmapPhases.map((p) => p.gate)).toEqual([
      "G0", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10",
    ]);
  });

  it("records the same phase labels the roadmap uses", () => {
    const labels = Object.fromEntries(roadmapPhases.map((p) => [p.id, p.label]));
    expect(labels.P0).toMatch(/baseline and reproducibility/i);
    expect(labels.P1).toMatch(/architecture and migration seams/i);
    expect(labels.P2).toMatch(/born-gated Runtime walking skeleton/i);
    expect(labels.P3).toMatch(/Universal Broker closure and MVP/i);
    expect(labels.P4).toMatch(/Mission, Scope and evidence depth/i);
    expect(labels.P5).toMatch(/falsification, WorldModel and replanning/i);
    expect(labels.P6).toMatch(/Student shadow mode and bounded learning/i);
    expect(labels.P7).toMatch(/Arena \/ RedTeam parity/i);
    expect(labels.P8).toMatch(/Evaluation/i);
    expect(labels.P9).toMatch(/Consolidation and deletion/i);
    expect(labels.P10).toMatch(/Advanced capabilities/i);
  });

  it("marks only P0-P2 as passed, and keeps P3 blocked", () => {
    expect(roadmapPhases.filter((p) => p.passed).map((p) => p.id)).toEqual(["P0", "P1", "P2"]);
    const p3 = roadmapPhases.find((p) => p.id === "P3")!;
    expect(p3.passed).toBe(false);
    expect(p3.recordedStatus).toBe("BLOCKED");
  });

  it("never infers a pass from the existence of a design", () => {
    // Every phase after the blocked gate has no recorded status and must not be
    // marked passed, however complete its design is.
    for (const phase of roadmapPhases.slice(3)) {
      expect(phase.passed, `${phase.id} must not be marked passed`).toBe(false);
    }
    for (const phase of roadmapPhases.slice(4)) {
      expect(phase.recordedStatus, `${phase.id} must be unrecorded`).toBeNull();
    }
  });

  it("states the sequencing rule so a blocked gate cannot be read as skippable", () => {
    expect(phaseSequencingRule).toMatch(/task → evidence → independent audit → gate → next task/);
    expect(phaseSequencingRule).toMatch(/No later roadmap phase is authorized merely because its design is complete/i);
  });
});

/* ========================================================================== */
/* RSI lane                                                                     */
/* ========================================================================== */

describe("governed improvement lane is not operational", () => {
  it("shows the recorded readiness banner verbatim", () => {
    expect(rsiReadinessBanner).toBe("RSI implementation: NOT STARTED");
  });

  it("renders the readiness banner in the lane", () => {
    // The lane renders the banner from the content module. Assert the binding,
    // not a literal in the JSX, so the panel cannot drift onto a subset.
    const panels = read("src/components/arch/ArchitecturePanels.tsx");
    expect(panels).toContain("rsiReadinessBanner");
    expect(panels).toMatch(/\{rsiReadinessBanner\}/);
    expect(rsiReadinessBanner).toMatch(/NOT STARTED/);
  });

  it("lists the substrate the current records explicitly do not contain", () => {
    expect(rsiAbsentSubstrate.length).toBeGreaterThanOrEqual(4);
    const joined = rsiAbsentSubstrate.join(" ").toLowerCase();
    expect(joined).toMatch(/no first-class persistent exploration policy/);
    expect(joined).toMatch(/no candidate improvement evaluator/);
    expect(joined).toMatch(/no successor, promotion or rollback chain/);
    expect(joined).toMatch(/no true replay world/);
    expect(joined).toMatch(/no structural or effective recursion evidence/);
  });

  it("marks every RSI component as unimplemented", () => {
    const rsiIds = targetArchitecture.bands
      .find((b) => b.id === "improvement")!
      .componentIds.map((id) => getComponent(targetArchitecture, id)!);
    expect(rsiIds.length).toBeGreaterThan(0);
    for (const c of rsiIds) {
      expect(
        ["not_yet_implemented", "partial_not_yet_demonstrated"],
        `RSI component ${c.id} is ${c.status}`,
      ).toContain(c.status);
    }
  });

  it("covers the seven required explanation rules", () => {
    expect(rsiRules).toHaveLength(7);
    const joined = rsiRules.map((r) => `${r.title} ${r.body}`).join(" ").toLowerCase();
    expect(joined).toMatch(/experiencenode/);
    expect(joined).toMatch(/not a replacement for evidencerecord/);
    expect(joined).toMatch(/deterministic scenario rerun .*not accepted|not accepted as a replay simulator/);
    expect(joined).toMatch(/high score on a single run is insufficient/);
    expect(joined).toMatch(/unseen holdout/);
    expect(joined).toMatch(/cannot rewrite authorization rules/);
    expect(joined).toMatch(/no recursion level may be claimed merely because an improvement workflow has been designed/);
  });

  it("draws the deployed policy back only as proposal-only influence", () => {
    const edge = targetArchitecture.edges.find((e) => e.from === "r_deploy")!;
    expect(edge.style).toBe("feedback");
    expect(edge.label).toMatch(/proposal-only influence in a later run/i);
  });

  it("states the proposal-only rule in the lane, not only inside the target diagram", () => {
    // The target view is behind a click. A reader who never selects it must
    // still be told that accepted learning returns only as a proposal, so the
    // rule has to appear in the lane rules AND the lane's closing note.
    const rule = rsiRules.find((r) => r.id === "RSI-6")!;
    expect(rule.body).toMatch(/proposal-only influence in a later run/i);

    const panels = read("src/components/arch/ArchitecturePanels.tsx");
    expect(panels).toMatch(/never self-modifiable/i);
    expect(panels).toMatch(/proposal-only influence in a later run/i);
  });
});

describe("protected surfaces and proposal-only influence", () => {
  it("names every protected surface", () => {
    const protectedComp = getComponent(targetArchitecture, "r_protected")!;
    const text = `${protectedComp.responsibility} ${protectedComp.invariant}`;
    for (const surface of [
      "Runtime",
      "production loop",
      "decision point",
      "enforcement point",
      "provenance authority",
      "WorldModel belief authority",
      "evaluator",
      "holdout",
      "promotion gate",
      "human release authority",
    ]) {
      expect(text, `protected surface missing: ${surface}`).toContain(surface);
    }
  });

  it("names every evolvable surface", () => {
    const evolvable = getComponent(targetArchitecture, "r_evolvable")!;
    for (const surface of [
      "ExplorationPolicy",
      "candidate ordering",
      "bounded strategy parameters",
      "prompt and context assembly",
      "knowledge weighting",
      "experience selection",
    ]) {
      expect(evolvable.responsibility, `evolvable surface missing: ${surface}`).toContain(surface);
    }
  });

  it("constrains candidates to the evolvable surfaces and protects them from the gate", () => {
    const toEvolvable = targetArchitecture.edges.find(
      (e) => e.from === "r_candidate" && e.to === "r_evolvable",
    )!;
    expect(toEvolvable.style).toBe("guarded");
    expect(toEvolvable.label).toMatch(/must comply with/i);

    const protectedEdge = targetArchitecture.edges.find(
      (e) => e.from === "r_protected" && e.to === "r_gate",
    )!;
    expect(protectedEdge.style).toBe("guarded");
    expect(protectedEdge.label).toMatch(/protected from candidate changes/i);
  });

  it("keeps EvidenceRecord and ExperienceNode distinct", () => {
    const evidence = getComponent(targetArchitecture, "r_evidence")!;
    const experience = getComponent(targetArchitecture, "r_experience")!;
    expect(evidence.id).not.toBe(experience.id);
    expect(evidence.responsibility).toMatch(/provenance and authority|execution and provenance authority/i);
    expect(experience.responsibility).toMatch(/decision history and search-tree/i);
    expect(experience.invariant).toMatch(/not a replacement for EvidenceRecord/i);
  });

  it("refuses the two substitute definitions of replay", () => {
    const replay = getComponent(targetArchitecture, "r_replay")!;
    // Deterministic rerun from a seed is explicitly not replay...
    expect(replay.invariant).toMatch(
      /deterministic rerun from the same seed is explicitly not accepted/i,
    );
    // ...and neither is injecting historical text as guidance.
    expect(replay.invariant).toMatch(
      /injecting historical text as prompt guidance.*not equivalent to replay/i,
    );
  });

  it("requires a high score on one run to be insufficient for acceptance", () => {
    const gate = getComponent(targetArchitecture, "r_gate")!;
    expect(gate.invariant).toMatch(/high score on a single run is insufficient/i);
    expect(gate.trustRole).toBe("governance");
  });
});

/* ========================================================================== */
/* Trust boundaries                                                             */
/* ========================================================================== */

describe("trust boundaries are explained", () => {
  it("covers all six boundary kinds", () => {
    expect(trustBoundaries.map((b) => b.id)).toEqual([
      "proposal",
      "authorization",
      "execution",
      "evidence",
      "evaluation",
      "governance",
    ]);
  });

  it("states that a sandbox cannot grant permission at the execution boundary", () => {
    const execution = trustBoundaries.find((b) => b.id === "execution")!;
    expect(execution.rule).toMatch(/cannot grant permission|single route/i);
    expect(execution.rule).toMatch(/constrains execution/i);
  });

  it("states that evaluation is never a second brain", () => {
    const evaluation = trustBoundaries.find((b) => b.id === "evaluation")!;
    expect(evaluation.rule).toMatch(/never a second brain/i);
    expect(evaluation.rule).toMatch(/alternate production runtime/i);
  });

  it("states that evidence is never itself an authorization", () => {
    expect(trustBoundaries.find((b) => b.id === "evidence")!.rule).toMatch(
      /never itself an authorization/i,
    );
  });
});

/* ========================================================================== */
/* Legend and status vocabulary                                                 */
/* ========================================================================== */

describe("status vocabulary is closed and labelled", () => {
  it("has a legend entry for every declared status", () => {
    const declared: ComponentStatus[] = [
      "documented_in_reviewed_snapshot",
      "implemented_acceptance_pending",
      "partial_not_yet_demonstrated",
      "known_issue_at_reviewed_snapshot",
      "current_disposition_unconfirmed",
      "not_yet_implemented",
    ];
    for (const status of declared) {
      expect(statusLegend.map((l) => l.status), `no legend for ${status}`).toContain(status);
    }
    expect(statusLegend).toHaveLength(declared.length);
  });

  it("gives every legend entry a human label and a meaning", () => {
    for (const entry of statusLegend) {
      expect(entry.label.trim().length).toBeGreaterThan(3);
      expect(entry.meaning.trim().length).toBeGreaterThan(15);
      // Labels are written for a reader, not for a machine.
      expect(entry.label).not.toMatch(/_/);
    }
  });

  it("resolves a legend entry for any status present in either view", () => {
    for (const model of [currentArchitecture, targetArchitecture]) {
      for (const c of model.components) {
        expect(() => legendEntryFor(c.status)).not.toThrow();
      }
    }
  });

  it("renders status as text on the node, not only as colour", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    // A short text label is rendered inside the node button for every status.
    expect(diagram).toMatch(/STATUS_SHORT/);
    expect(diagram).toMatch(/legendEntryFor\(component\.status\)\.label/);
  });
});

/* ========================================================================== */
/* Route, navigation and preserved URL                                         */
/* ========================================================================== */

describe("route and navigation", () => {
  it("creates the /raphael/architecture route", () => {
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).toMatch(/export default function ArchitectureExplorerPage/);
    expect(page).toMatch(/Raphael Architecture Explorer/);
  });

  it("offers both views from the page", () => {
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).toMatch(/Existing architecture|ArchitectureViewSwitcher/);
    expect(page).toContain("ArchitectureViewSwitcher");
    // The two content objects are chosen in the client switcher, not inlined.
    const switcher = read("src/components/arch/ArchitectureViewSwitcher.tsx");
    expect(switcher).toContain("currentArchitecture");
    expect(switcher).toContain("targetArchitecture");
    expect(switcher).toMatch(/Existing architecture/);
    expect(switcher).toMatch(/Hypothetical target/);
  });

  it("opens on the documented view rather than the blueprint", () => {
    // A reader who lands and does nothing must see what is recorded, not the
    // proposal. The target requires an explicit click.
    const switcher = read("src/components/arch/ArchitectureViewSwitcher.tsx");
    expect(switcher).toMatch(/useState<ViewKey>\("current"\)/);
  });

  it("keeps the page a Server Component and confines client state to the switcher", () => {
    // The page owns the metadata and every gate/roadmap string, so it must not
    // import useState. Marking it "use client" would pull the whole route into
    // the client bundle for one piece of selector state.
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).not.toMatch(/^"use client"/);
    expect(page).not.toMatch(/import \{ useState \}/);
    expect(read("src/components/arch/ArchitectureViewSwitcher.tsx")).toMatch(/^"use client"/);
  });

  it("links from the Raphael page", () => {
    const page = read("src/app/raphael/page.tsx");
    expect(page).toContain('href="/raphael/architecture"');
    expect(page).toMatch(/architecture explorer/i);
  });

  it("links from the homepage Raphael card only", () => {
    const raphael = projects.find((p) => p.id === "raphael")!;
    expect(raphael.internalPath).toBe("/raphael/architecture");
    expect(raphael.internalLinkLabel).toBe("Architecture");

    const others = projects.filter((p) => p.id !== "raphael");
    for (const p of others) {
      expect(p.internalPath, `${p.id} must not get an architecture link`).toBeNull();
      expect(p.internalLinkLabel).toBeNull();
    }
  });

  it("renders the internal link as a client-side route, not an external destination", () => {
    const card = read("src/components/home/ProjectCard.tsx");
    expect(card).toMatch(/internalPath/);
    // A local route must not carry new-tab/external semantics.
    const internalBlock = card.slice(card.indexOf("hasInternalLink ?"));
    expect(internalBlock).toMatch(/<Link/);
    expect(internalBlock).not.toMatch(/target="_blank"/);
  });

  it("is reachable from the primary navigation", () => {
    const arch = navItems.find((n) => n.href === "/raphael/architecture");
    expect(arch).toBeDefined();
    expect(arch!.label).toBe("Architecture");
  });

  it("marks exactly one nav item active on the nested route", () => {
    // Regression guard: a bare startsWith(href) would activate BOTH /raphael and
    // /raphael/architecture, and the shared layoutId bar would animate between two
    // elements. Assert on executable code only: the doc comment legitimately
    // quotes the old pattern while explaining why it was replaced.
    const nav = read("src/components/shell/NavBar.tsx");
    const code = stripComments(nav);
    expect(code).toMatch(/moreSpecific/);
    // No bare prefix match survives in executable code.
    expect(code).not.toMatch(/pathname\.startsWith\(href\)/);
    // The specificity check is actually applied before returning true.
    expect(code).toMatch(/return !moreSpecific/);
  });
});

/* ========================================================================== */
/* Preserved destination and release-gate compatibility                          */
/* ========================================================================== */

describe("project destination and release gate", () => {
  it("preserves the supplied live project URL exactly", () => {
    expect(liveProjectUrl).toBe("https://the-despicable-raphael-portal.vercel.app/");
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).toContain("liveProjectUrl");
    // It must not be replaced by the repository URL.
    expect(page).not.toMatch(/github\.com\/The-Despicable\/raphael-2\.0-rbsv2r/);
  });

  it("introduces no source-download or source-release CTA", () => {
    const files = [
      "src/app/raphael/architecture/page.tsx",
      "src/components/arch/ArchitectureExplorerDiagram.tsx",
      "src/components/arch/ArchitecturePanels.tsx",
      "src/content/raphael-architecture.ts",
    ];
    const blob = files.map(read).join("\n");
    expect(blob).not.toMatch(/clone the repo|download the source|get the source code/i);
    expect(blob).not.toMatch(/clone\b.*\bgit\b/i);
    // The closed source-release gate must still be stated, not contradicted.
    expect(blob).toMatch(/CLOSED/);
  });

  it("does not link to the Raphael core source repository from this route", () => {
    const page = read("src/app/raphael/architecture/page.tsx");
    expect(page).not.toMatch(/github\.com/i);
  });
});

/* ========================================================================== */
/* No fabricated metrics or claims                                             */
/* ========================================================================== */

describe("no unsupported metrics or success claims", () => {
  const published = JSON.stringify({
    currentArchitecture,
    targetArchitecture,
    knownGaps,
    roadmapPhases,
    gateStates,
    rsiRules,
  });

  it("states no test count, benchmark, latency or success rate", () => {
    expect(published).not.toMatch(/\b\d+\s*(passed|tests?|failing|skipped)\b/i);
    expect(published).not.toMatch(/\b\d+(\.\d+)?\s*(ms|s|seconds?|minutes?)\b/i);
    expect(published).not.toMatch(/\b\d+\s*%/);
    expect(published).not.toMatch(/\b(benchmark|throughput|latency|p9[59])\b/i);
  });

  it("claims no production readiness for either view", () => {
    expect(published).not.toMatch(/production[- ]ready(?!.*(not|does not|no ))/i);
    expect(published).not.toMatch(/\bready for production\b/i);
    expect(currentArchitecture.framing).toMatch(/not a fresh confirmation/i);
  });

  it("never asserts the central research claim is established", () => {
    expect(published).not.toMatch(/measurably outperforms(?!.*not)/i);
    expect(published).not.toMatch(/research claim (is )?(established|proven)/i);
    expect(gateStates.find((g) => g.id === "Central research thesis")!.recordedStatus).toBe(
      "UNRESOLVED",
    );
  });

  it("publishes no private infrastructure detail", () => {
    // Document names and roles only: no local paths, no hashes, no credentials.
    expect(published).not.toMatch(/\/home\/[a-z0-9_-]+\//i);
    expect(published).not.toMatch(/\b[0-9a-f]{40}\b/);
    expect(published).not.toMatch(/nvapi-|sk-[A-Za-z0-9]{20}|BEGIN [A-Z ]*PRIVATE KEY/i);
    expect(published).not.toMatch(/\b\d{7,}\b/);
    expect(published).not.toMatch(/\b(10|192\.168)\.\d{1,3}\.\d{1,3}/);
  });

  it("names its source documents without exposing paths", () => {
    expect(architectureSources.length).toBeGreaterThanOrEqual(3);
    const names = architectureSources.map((s) => s.document).join(" ");
    expect(names).toMatch(/Handoff v4\.1/);
    expect(names).toMatch(/Master Roadmap v4\.2/);
    expect(names).toMatch(/assessment/i);
    for (const source of architectureSources) {
      expect(source.role.trim().length).toBeGreaterThan(40);
      expect(source.document).not.toMatch(/\/home\/|\.md$/);
    }
  });

  it("records the last-reviewed date", () => {
    expect(architectureLastReviewed).toBe("2026-10-16");
  });
});

/* ========================================================================== */
/* Accessibility contracts                                                      */
/* ========================================================================== */

describe("accessibility contracts", () => {
  it("renders every component as a real button in the tab order", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/<button/);
    expect(diagram).toMatch(/type="button"/);
    expect(diagram).toMatch(/aria-pressed=\{isActive\}/);
  });

  it("gives every node an accessible name carrying its stage and status", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/aria-label=/);
    expect(diagram).toMatch(/stage \$\{stage\}/);
    expect(diagram).toMatch(/Status: \$\{legendEntryFor\(component\.status\)\.label\}/);
  });

  it("declares the diagram as a labelled group and the selector as a tablist", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/role="group"/);
    expect(diagram).toMatch(/aria-label=/);

    const switcher = read("src/components/arch/ArchitectureViewSwitcher.tsx");
    expect(switcher).toMatch(/role="tablist"/);
    expect(switcher).toMatch(/aria-selected=\{selected\}/);
  });

  it("announces the inspector politely", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/aria-live="polite"/);
  });

  it("hides decorative connectors from assistive technology", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/aria-hidden/);
  });

  it("respects reduced motion", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/useReducedMotion/);
    expect(diagram).toMatch(/motion-reduce:transition-none/);
  });

  it("gives visible focus states", () => {
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    expect(diagram).toMatch(/focus-visible:outline-2/);
  });

  it("uses semantic headings on the page", () => {
    const page = read("src/app/raphael/architecture/page.tsx");
    // One h1 for the page, authored directly.
    expect(page).toMatch(/<h1/);
    // Section headings come from the shared primitive, which owns the h2. Assert
    // the primitive is used AND that the primitive emits a real h2, rather than
    // requiring a literal <h2 in the page file.
    expect(page).toMatch(/SectionHeader/);
    const primitives = read("src/components/ui/primitives.tsx");
    expect(primitives).toMatch(/<h2/);
  });
});

/* ========================================================================== */
/* Content separation                                                           */
/* ========================================================================== */

describe("architecture content is separated from rendering", () => {
  it("keeps every architecture fact in the typed content module", () => {
    // The page and the diagram component must not inline architecture copy.
    const page = read("src/app/raphael/architecture/page.tsx");
    const diagram = read("src/components/arch/ArchitectureExplorerDiagram.tsx");
    // The page may reference selectors and titles, but no component prose.
    expect(page).not.toMatch(/responsibility|evidenceRequired|recordedAtReview/);
    expect(diagram).not.toMatch(/recordedAtReview|currentDisposition/);
  });

  it("keeps the two content objects separate in the module", () => {
    const content = read("src/content/raphael-architecture.ts");
    expect(content).toMatch(/export const currentArchitecture/);
    expect(content).toMatch(/export const targetArchitecture/);
    expect(content).toMatch(/export const gateStates/);
    expect(content).toMatch(/export const knownGaps/);
  });

  it("documents the precedence rule it follows", () => {
    const content = read("src/content/raphael-architecture.ts");
    expect(content).toMatch(/Appendix E precedence|precedence/i);
  });
});
