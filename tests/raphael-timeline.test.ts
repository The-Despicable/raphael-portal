import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  currentStatusRows,
  eras,
  lineageDisclaimer,
  milestoneById,
  milestones,
  milestonesByEra,
  overallStatus,
  sourceRegister,
  type Milestone,
} from "@/content/raphael-timeline";
import {
  canonicalRuntimeFlow,
  datedSnapshots,
  dockerCountDiscrepancy,
  dockerSnapshotCaveat,
  editorialRules,
  evaluationClaims,
  gateHistory,
  historicalDockerServices,
  imageReconciliationChecklist,
  runtimeInvariants,
  runtimeStages,
  scopedTestFloors,
  statusVerbs,
  unmatchedDeclaredService,
} from "@/content/raphael-timeline-deep";

/**
 * Source-grounded tests for the timeline page.
 *
 * These tests read the RENDERED page source as text as well as importing the
 * typed content modules. That combination is deliberate: it proves a fact is
 * both present in the data model and actually reaching the user, which is the
 * only way a status like NOT_READY can be guaranteed to survive a refactor.
 */

const PAGE = readFileSync(
  join(process.cwd(), "src/app/raphael/timeline/page.tsx"),
  "utf8",
);

/** Every source file that contributes rendered timeline content. */
const RENDERED_SOURCES = [
  "src/app/raphael/timeline/page.tsx",
  "src/components/timeline/TimelineHero.tsx",
  "src/components/timeline/ChronologyRail.tsx",
  "src/components/timeline/TimelineExplorer.tsx",
  "src/components/timeline/DockerHistory.tsx",
  "src/components/timeline/GateHistory.tsx",
  "src/components/timeline/CurrentStatus.tsx",
  "src/components/timeline/RuntimeFlow.tsx",
  "src/components/timeline/RsiTarget.tsx",
  "src/components/timeline/SourceRegister.tsx",
  "src/components/timeline/AppendixSections.tsx",
];

/** The typed content modules that feed the components above. */
const CONTENT_SOURCES = [
  "src/content/raphael-timeline.ts",
  "src/content/raphael-timeline-deep.ts",
];

/**
 * Everything that can put a string in front of a reader on this page:
 * the route, every timeline component, and both content modules.
 *
 * Components reference most facts by imported identifier rather than by
 * inlining them, so a presence check against component source alone would
 * report a documented status as "missing" when it is in fact rendered.
 */
const PAGE_SURFACE = [...RENDERED_SOURCES, ...CONTENT_SOURCES];

const rendered = RENDERED_SOURCES.map((p) => ({
  path: p,
  text: readFileSync(join(process.cwd(), p), "utf8"),
}));

const allRendered = PAGE_SURFACE.map((p) =>
  readFileSync(join(process.cwd(), p), "utf8"),
).join("\n");

/**
 * Whitespace-normalised view of the page surface.
 *
 * JSX wraps prose across lines, so a sentence the reader sees as one line
 * appears in source as several. Prose assertions run against this, so a
 * reflow of the markup cannot silently break a content check.
 */
const prose = allRendered.replace(/\s+/g, " ");

/* ========================================================================== */

describe("the excluded workstream is absent", () => {
  it("never mentions it in any timeline data or rendered source", () => {
    for (const file of PAGE_SURFACE) {
      const text = readFileSync(join(process.cwd(), file), "utf8");
      expect(text, `${file} must not reference the excluded workstream`)
        .not.toMatch(/IBM/i);
      expect(text, `${file} must not reference the excluded workstream`)
        .not.toMatch(/\bBOB\b/);
    }
  });

  it("declares it nowhere in the timeline data model", () => {
    const serialised = JSON.stringify({
      eras,
      milestones,
      gates: gateHistory,
      docker: historicalDockerServices,
    });
    expect(serialised).not.toMatch(/IBM/i);
    expect(serialised).not.toMatch(/\bBOB\b/);
  });
});

/* ========================================================================== */

describe("the route and its required framing", () => {
  it("is created at /raphael/timeline", () => {
    expect(
      existsSync(join(process.cwd(), "src/app/raphael/timeline/page.tsx")),
    ).toBe(true);
    const site = readFileSync(join(process.cwd(), "src/config/site.ts"), "utf8");
    expect(site).toContain('href: "/raphael/timeline"');
  });

  it("carries the required eyebrow, heading and supporting sentence", () => {
    expect(allRendered).toContain("RAPHAEL / PROJECT HISTORY");
    expect(allRendered).toContain("The Evolution of RAPHAEL");
    expect(prose).toContain(
      "From the original Ultimate Skill vision to a unified, governed runtime",
    );
    expect(prose).toContain(
      "and the evidence that defines its current state.",
    );
  });

  it("explains that the page documents limitations as well as progress", () => {
    const hero = rendered.find((r) => r.path.endsWith("TimelineHero.tsx"))!.text;
    expect(hero).toMatch(/limitations/i);
    expect(hero).toMatch(/documentation surface/i);
  });

  it("keeps the chronology reachable from the introduction", () => {
    const hero = rendered.find((r) => r.path.endsWith("TimelineHero.tsx"))!.text;
    // The lineage strip renders every era in the hero itself, so the
    // chronology is above the fold rather than many screens down.
    expect(hero).toContain("eras.map");
    expect(eras.length).toBe(9);
  });

  it("requires no authentication to render", () => {
    expect(PAGE).not.toMatch(/middleware|session|requireAuth|redirect\(/);
  });
});

/* ========================================================================== */

describe("the mandatory lineage, in chronological order", () => {
  const requiredOrder = [
    "origin",
    "sword-shield",
    "rebirth",
    "r20",
    "r21",
    "v4",
    "v41",
    "v42",
    "present",
  ];

  it("declares exactly the nine required eras", () => {
    expect(eras.map((e) => e.id)).toEqual(requiredOrder);
  });

  it("names each era from the source document", () => {
    expect(eras[0].title).toBe("RAPHAEL 1 — Ultimate Skill");
    expect(eras[1].title).toBe("Sword & Shield");
    expect(eras[2].title).toBe("RAPHAEL Rebirth");
    expect(eras[3].title).toContain("RAPHAEL 2.0");
    expect(eras[4].title).toContain("2.1");
    expect(eras[5].title).toContain("v4");
    expect(eras[6].title).toContain("v4.1");
    expect(eras[7].title).toContain("v4.2");
    expect(eras[8].title).toContain("Present position");
  });

  it("orders eras by an explicit key, not by a display string", () => {
    expect(eras.map((e) => e.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const sorted = [...eras].sort((a, b) => a.order - b.order);
    expect(sorted.map((e) => e.id)).toEqual(requiredOrder);
  });

  it("gives every era the source's one-sentence summary", () => {
    for (const era of eras) {
      expect(era.oneSentence.length).toBeGreaterThan(20);
      expect(era.oneSentence.endsWith(".")).toBe(true);
    }
  });

  it("gives every era a compact strip date that never states an unestablished date", () => {
    const hero = rendered.find((r) => r.path.endsWith("TimelineHero.tsx"))!.text;
    expect(hero).toContain("era.shortDate");
    for (const era of eras) {
      expect(era.shortDate.length).toBeGreaterThan(0);
      // An abbreviated date must still contain the year, or say "undated".
      if (era.undated) {
        expect(era.shortDate).toBe("undated");
        expect(era.shortDate).not.toMatch(/\d{4}/);
      } else {
        expect(era.shortDate).toMatch(/2026/);
      }
    }
  });

  it("uses the compact date only in the strip, and the full date in the rail", () => {
    const hero = rendered.find((r) => r.path.endsWith("TimelineHero.tsx"))!.text;
    const rail = rendered.find((r) => r.path.endsWith("ChronologyRail.tsx"))!.text;
    expect(hero).toContain("era.shortDate");
    expect(hero).not.toContain("era.dateLabel");
    expect(rail).toContain("era.dateLabel");
  });

  it("treats this as one lineage rather than parallel tracks", () => {
    expect(allRendered).not.toMatch(/TimelineTrack|trackDefinition|eventsForTrack/);
    expect(allRendered).toMatch(/One lineage/);
  });
});

/* ========================================================================== */

describe("early phases are never given invented dates", () => {
  const undated = eras.filter((e) => e.undated);

  it("marks exactly the three origin eras as undated", () => {
    expect(undated.map((e) => e.id)).toEqual(["origin", "sword-shield", "rebirth"]);
  });

  it("states 'date not established' rather than a manufactured date", () => {
    for (const era of undated) {
      expect(era.dateLabel).toBe("date not established");
      expect(era.dateLabel).not.toMatch(/\d{4}/);
    }
  });

  it("carries that statement through to the rendered milestone", () => {
    const early = milestones.filter((m) => m.datePrecision === "not_established");
    expect(early.length).toBeGreaterThanOrEqual(3);
    for (const m of early) {
      expect(m.dateDisplay).toBe("Date not established");
      expect(m.dateDisplay).not.toMatch(/\d{4}/);
      expect(m.dateNote.length).toBeGreaterThan(30);
    }
  });

  it("uses source-supported dates for every later milestone", () => {
    const dated = milestones.filter((m) => m.datePrecision !== "not_established");
    expect(dated.length).toBeGreaterThanOrEqual(10);
    for (const m of dated) {
      expect(m.dateDisplay).toMatch(/2026/);
      expect(["exact", "range"]).toContain(m.datePrecision);
    }
  });

  it("labels the exact July snapshot precisely", () => {
    const july = milestoneById("docker-july")!;
    expect(july.dateDisplay).toBe("23 July 2026");
    expect(july.datePrecision).toBe("exact");
    expect(july.dateNote).toMatch(/24 July 2026/);
  });
});

/* ========================================================================== */

describe("every milestone is a structured, qualified record", () => {
  it("gives every milestone an explicit order and era assignment", () => {
    const orders = milestones.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
    for (const m of milestones) {
      expect(eras.some((e) => e.id === m.eraId)).toBe(true);
    }
  });

  it("assigns every milestone to exactly one era bucket", () => {
    const total = eras.reduce(
      (n, era) => n + (milestonesByEra[era.id] ?? []).length,
      0,
    );
    expect(total).toBe(milestones.length);
  });

  it("gives every milestone a does-not-prove statement", () => {
    for (const m of milestones) {
      expect(m.doesNotProve.length).toBeGreaterThan(30);
    }
  });

  it("gives every milestone at least one named source record", () => {
    for (const m of milestones) {
      expect(m.sources.length).toBeGreaterThan(0);
      for (const id of m.sources) {
        expect(sourceRegister.some((s) => s.id === id)).toBe(true);
      }
    }
  });

  it("gives every milestone an evidence classification", () => {
    for (const m of milestones) {
      expect(m.evidenceClass.length).toBeGreaterThan(0);
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(m.confidence);
    }
  });

  it("does not give the undated origin eras high confidence", () => {
    for (const m of milestones.filter((x) => x.datePrecision === "not_established")) {
      expect(m.confidence).toBe("LOW");
      expect(m.evidenceClass).toBe("OWNER_RECALLED");
    }
  });

  it("varies detail depth between eras rather than padding identically", () => {
    const deep = milestones.filter((m) => (m.detail.components?.length ?? 0) > 0);
    const shallow = milestones.filter((m) => (m.detail.components?.length ?? 0) === 0);
    expect(deep.length).toBeGreaterThanOrEqual(4);
    expect(shallow.length).toBeGreaterThanOrEqual(3);
  });

  it("records a significance for every milestone", () => {
    for (const m of milestones) {
      expect(m.detail.significance.length).toBeGreaterThan(40);
    }
  });
});

/* ========================================================================== */

describe("the July 2026 Docker snapshot is a historical report, not proof", () => {
  it("reports the documented 14/14 result", () => {
    expect(dockerCountDiscrepancy.runningContainers).toContain("14/14");
    expect(allRendered).toContain("14/14");
  });

  it("keeps the three counts distinct and says they are distinct", () => {
    expect(dockerCountDiscrepancy.declaredComposeServices).toContain("16");
    expect(dockerCountDiscrepancy.namedServices).toContain("15");
    expect(dockerCountDiscrepancy.note).toMatch(/separate quantities/i);
  });

  it("records the unresolved sixteenth service instead of guessing it", () => {
    expect(unmatchedDeclaredService.port).toBeNull();
    expect(unmatchedDeclaredService.note).toMatch(/must not be guessed/i);
    expect(prose).toMatch(/[Uu]nmatched declared service/);
    expect(prose).toMatch(/sixteenth service/);
  });

  it("names only the fifteen services the historical diagram records", () => {
    expect(historicalDockerServices).toHaveLength(15);
    expect(historicalDockerServices.map((s) => s.ordinal)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1),
    );
    expect(historicalDockerServices.map((s) => s.name)).toEqual([
      "raphael-api",
      "tor-proxy",
      "neo4j",
      "freellmapi",
      "c2-server",
      "sliver-server",
      "sword",
      "cloak-service",
      "recon-pipeline",
      "kali-tools",
      "phishing",
      "caido",
      "autonomous-brain",
      "cai-service",
      "mhddos-service",
    ]);
  });

  it("records the exact ports from the source", () => {
    const ports = historicalDockerServices.map((s) => s.port);
    expect(ports).toEqual([3900, 9050, 7474, 3001, 3501, 31337, 3600, 3401, 3503, 3800, 3502, 48080, 3700, 3201, 3301]);
  });

  it("gives every inventory row an evidentiary boundary", () => {
    for (const s of historicalDockerServices) {
      expect(s.evidenceBoundary.length).toBeGreaterThan(20);
    }
  });

  it("invents no image tags, digests, health checks or status lights", () => {
    expect(allRendered).not.toMatch(/sha256:[0-9a-f]{8}/i);
    expect(allRendered).not.toMatch(/:latest\b/);
    expect(allRendered).not.toMatch(/\bhealthy:\s*(true|yes)/i);
    for (const s of historicalDockerServices) {
      expect(s.role).not.toMatch(/image|digest|tag/i);
    }
  });

  it("separates every dated operational snapshot", () => {
    expect(datedSnapshots).toHaveLength(4);
    expect(datedSnapshots.map((s) => s.date)).toEqual([
      "2026-07-23",
      "2026-08-08",
      "2026-10-04",
      "2026-10-16",
    ]);
    for (const s of datedSnapshots) {
      expect(s.representation.length).toBeGreaterThan(10);
    }
  });

  it("offers a reconciliation checklist rather than fabricating image data", () => {
    expect(imageReconciliationChecklist.length).toBeGreaterThanOrEqual(10);
    expect(imageReconciliationChecklist.join(" ")).toMatch(/Immutable image digest/);
  });

  it("states the running-stack caveat exactly once, not duplicated", () => {
    const docker = rendered.find((r) => r.path.endsWith("DockerHistory.tsx"))!.text;
    // The lead sentence is supplied by the component; the content string must
    // not repeat it, or the page renders the sentence twice.
    expect(docker).toContain("A reported running stack is not a validated system.");
    expect(dockerSnapshotCaveat).not.toMatch(/validated system/);
    expect(dockerSnapshotCaveat).toMatch(/^Container count does not establish/);
  });

  it("does not aggregate the snapshots into a single uptime claim", () => {
    const docker = rendered.find((r) => r.path.endsWith("DockerHistory.tsx"))!.text;
    expect(docker).toMatch(/It would be invalid to aggregate|didSnapshots|snapshotAggregation/);
  });
});

/* ========================================================================== */

describe("v4 and v4.1 expose the documented control spine", () => {
  it("models a single canonical runtime loop", () => {
    expect(allRendered).toContain("RaphaelRuntime");
    expect(allRendered).toContain("Canonical cognitive stages");
  });

  it("names one policy decision point and one enforcement point", () => {
    expect(allRendered).toContain("CapabilityBroker");
    expect(allRendered).toContain("Policy Decision Point");
    expect(allRendered).toContain("Policy Enforcement Point");
    expect(allRendered).toContain("exec/");
  });

  it("states that planning proposes and does not authorize", () => {
    const contracts = canonicalRuntimeFlow.map((s) => s.contract).join(" ");
    expect(contracts).toMatch(/Propose and interpret/);
    expect(contracts).toMatch(/not itself the source of authority|does not itself perform/i);
    expect(runtimeInvariants.join(" ")).toMatch(/Planning proposes; it does not authorize/);
    // The rendered flow labels the roles in words, not by colour alone.
    expect(canonicalRuntimeFlow.some((s) => s.role === "Policy Decision Point")).toBe(true);
  });

  it("states deny-by-default and evidence-does-not-grant-authority", () => {
    const contracts = allRendered;
    expect(contracts).toMatch(/Deny-by-default|deny-by-default/);
    expect(runtimeInvariants.join(" ")).toMatch(
      /Evidence is recorded with provenance and does not grant authority/,
    );
  });

  it("renders the fixed ten stages, in order", () => {
    expect(runtimeStages).toHaveLength(10);
    expect(runtimeStages.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(runtimeStages.map((s) => s.id)).toEqual([
      "observe",
      "worldmodel_read",
      "student_candidate",
      "planner_request",
      "broker",
      "pep",
      "receipt",
      "worldmodel_integrate",
      "contradiction",
      "replan",
    ]);
  });

  it("records an inspected-implementation note and an acceptance signal per stage", () => {
    for (const s of runtimeStages) {
      expect(s.inspectedImplementation.length).toBeGreaterThan(30);
      expect(s.acceptanceSignal.length).toBeGreaterThan(30);
      expect(s.purpose.length).toBeGreaterThan(30);
    }
  });

  it("surfaces the stubs, recording-only behaviour and minimal integration", () => {
    const text = runtimeStages.map((s) => s.inspectedImplementation).join(" ");
    expect(text).toMatch(/recording-only/i);
    expect(text).toMatch(/deterministic/i);
    expect(text).toMatch(/stub|minimal/i);
    expect(text).toMatch(/not loaded|bootstrap/i);
  });

  it("does not turn the design specification into an implementation claim", () => {
    expect(allRendered).toMatch(
      /A designed control spine is not a demonstrated one/,
    );
    expect(PAGE).toMatch(/Fail-closed within the tested and declarative perimeter/);
  });

  it("labels the stage-wide invariants as a target contract", () => {
    expect(runtimeInvariants.length).toBe(12);
    expect(allRendered).toMatch(/a target contract, not a pass list/i);
  });
});

/* ========================================================================== */

describe("v4.2 is presented as a governed target", () => {
  it("keeps implementation recorded as not started", () => {
    expect(allRendered).toMatch(/RSI implementation — NOT STARTED/);
    expect(allRendered).not.toMatch(/RSI implementation — (STARTED|ACTIVE|COMPLETE)/);
  });

  it("distinguishes recorded experience from faithful replay", () => {
    expect(allRendered).toContain("EvidenceRecord");
    expect(allRendered).toContain("ExperienceNode");
    expect(allRendered).toMatch(/Replay:/);
    expect(allRendered).toMatch(/not merely regenerating a scenario/);
  });

  it("separates candidate generation from accepted change", () => {
    expect(allRendered).toContain("Candidate ExplorationPolicy");
    expect(allRendered).toMatch(/Protected evaluation/);
  });

  it("states the governance preconditions: lineage, provenance, rollback", () => {
    expect(allRendered).toMatch(/Version lineage/);
    expect(allRendered).toMatch(/non-self-modifiable/);
    expect(allRendered).toMatch(/rollback/i);
  });

  it("does not claim demonstrated recursive improvement", () => {
    expect(allRendered).toMatch(/not a capability|target, not a capability/);
    expect(allRendered).not.toMatch(/recursively self-improving system/i);
  });
});

/* ========================================================================== */

describe("gate history G0 to G10", () => {
  it("declares every gate from G0 through G10", () => {
    expect(gateHistory.map((g) => g.gate)).toEqual([
      "G0",
      "G1",
      "G2",
      "G3",
      "G4",
      "G5",
      "G6",
      "G7",
      "G8",
      "G9",
      "G10",
    ]);
  });

  it("gives each gate a purpose, evidence and significance", () => {
    for (const g of gateHistory) {
      expect(g.purpose.length).toBeGreaterThan(30);
      expect(g.evidenceInRecords.length).toBeGreaterThan(20);
      expect(g.significance.length).toBeGreaterThan(40);
    }
  });

  it("gives each gate a compact name, not a fragment split out of the purpose", () => {
    for (const g of gateHistory) {
      expect(g.shortName.length).toBeGreaterThan(10);
      expect(g.shortName.length).toBeLessThan(45);
      expect(g.shortName.endsWith(".")).toBe(false);
    }
    expect(gateHistory.find((g) => g.gate === "G0")!.shortName).toMatch(/baseline/i);
    expect(gateHistory.find((g) => g.gate === "G3")!.shortName).toMatch(/broker closure/i);
    const gate = rendered.find((r) => r.path.endsWith("GateHistory.tsx"))!.text;
    expect(gate).not.toMatch(/purpose\.split/);
    expect(gate).toContain("g.shortName");
  });

  it("records G3 as not accepted and blocked", () => {
    const g3 = gateHistory.find((g) => g.gate === "G3")!;
    expect(g3.disposition).toBe("BLOCKED");
    expect(g3.dispositionLabel).toBe("NOT ACCEPTED / BLOCKED");
  });

  it("records G0 to G2 as historically passed, not as current acceptance", () => {
    for (const id of ["G0", "G1", "G2"]) {
      const g = gateHistory.find((x) => x.gate === id)!;
      expect(g.disposition).toBe("HISTORICAL_PASS");
      expect(g.dispositionLabel).toMatch(/[Hh]istorically passed/);
    }
  });

  it("refuses to infer gate acceptance from later roadmap activity", () => {
    const gate = rendered.find((r) => r.path.endsWith("GateHistory.tsx"))!.text;
    expect(gate).toMatch(/Roadmap activity downstream of a gate is not evidence/);
  });

  it("records the October findings that bear on readiness", () => {
    expect(gateHistory.find((g) => g.gate === "G7")!.evidenceInRecords).toMatch(/14 historical/i);
    expect(gateHistory.find((g) => g.gate === "G8")!.evidenceInRecords).toMatch(/holdout/i);
    expect(gateHistory.find((g) => g.gate === "G8")!.evidenceInRecords).toMatch(/five of nine/i);
  });
});

/* ========================================================================== */

describe("present state keeps every blocker visible", () => {
  const required: Array<[string, string]> = [
    ["overall", "NOT_READY"],
    ["g3", "NOT ACCEPTED / BLOCKED"],
    ["am-4-r3", "NOT EXECUTED"],
    ["thesis", "UNRESOLVED"],
    ["dataset", "MISSING"],
    ["rsi", "NOT STARTED"],
    ["source-release", "CLOSED"],
  ];

  it("records each required status with its exact source wording", () => {
    for (const [id, value] of required) {
      const row = currentStatusRows.find((r) => r.id === id);
      expect(row, `status row ${id} must exist`).toBeDefined();
      expect(row!.value).toBe(value);
    }
    expect(overallStatus).toBe("NOT_READY");
  });

  it("records instrument digest drift as unresolved", () => {
    const row = currentStatusRows.find((r) => r.id === "instrument")!;
    expect(row.value).toMatch(/DIGEST DRIFT/);
    expect(row.value).toMatch(/UNRESOLVED/);
  });

  it("records the missing authority principal", () => {
    expect(currentStatusRows.some((r) => r.value === "ABSENT")).toBe(true);
  });

  it("gives every blocker a reason, not only a label", () => {
    for (const row of currentStatusRows) {
      expect(row.why.length, `${row.id} needs a stated reason`).toBeGreaterThan(50);
    }
  });

  it("renders every status value on the page", () => {
    for (const [, value] of required) {
      expect(allRendered, `page must render ${value}`).toContain(value);
    }
  });

  it("shows the current state near the beginning and again near the end", () => {
    const uses = PAGE.match(/<CurrentStatusPanel/g) ?? [];
    expect(uses.length).toBeGreaterThanOrEqual(2);
    expect(PAGE.indexOf('id="current-state"')).toBeLessThan(PAGE.indexOf('id="present-position"'));
  });

  it("does not quietly upgrade any status value", () => {
    for (const forbidden of [
      "READY —",
      "G3 ACCEPTED",
      "AM-4-R3 EXECUTED",
      "THESIS PROVEN",
      "RSI STARTED",
      "RELEASE APPROVED",
    ]) {
      expect(allRendered).not.toContain(forbidden);
    }
  });

  it("keeps the dependency chain and marks its first link absent", () => {
    expect(allRendered).toMatch(/Valid authority principal/);
    expect(allRendered).toMatch(/absent/);
  });

  it("records the evaluation claim ledger with the thesis unresolved", () => {
    const thesis = evaluationClaims.find((c) => c.claim.includes("beats prompting"))!;
    expect(thesis.state).toBe("UNRESOLVED");
    expect(thesis.treatment).toMatch(/research question/i);
  });
});

/* ========================================================================== */

describe("sources and provenance are visible", () => {
  it("registers every source document from the source register", () => {
    expect(sourceRegister.length).toBeGreaterThanOrEqual(8);
    const docs = sourceRegister.map((s) => s.document);
    expect(docs).toContain("RAPHAEL_EVOLUTION_TIMELINE.md");
    expect(docs).toContain("ARCHITECTURE_AUDITED_20260808.md");
    expect(docs).toContain("RAPHAEL_MASTER_ROADMAP_v4_DUAL_LANE.md");
    expect(docs).toContain("RAPHAEL_HANDOFF_v4.1.md");
    expect(docs).toContain("RAPHAEL_MASTER_ROADMAP_v4.2_RSI.md");
    expect(docs).toContain("RAPHAEL_E2E_AUDIT_20261004.md");
    expect(docs).toContain("RAPHAEL_VIABILITY_AND_SUCCESSOR_ASSESSMENT.md");
  });

  it("labels each source by kind and date", () => {
    for (const s of sourceRegister) {
      expect(s.kind.length).toBeGreaterThan(0);
      expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(s.role.length).toBeGreaterThan(30);
    }
  });

  it("renders the source register on the page", () => {
    const register = rendered.find((r) => r.path.endsWith("SourceRegister.tsx"))!.text;
    expect(register).toContain("sourceRegister");
    expect(PAGE).toContain("<SourceRegister");
  });

  it("shows filenames as text rather than fabricating destinations", () => {
    const register = rendered.find((r) => r.path.endsWith("SourceRegister.tsx"))!.text;
    expect(register).not.toMatch(/href=\{/);
    expect(register).not.toMatch(/https?:\/\//);
  });

  it("publishes no local filesystem paths or object hashes", () => {
    expect(allRendered).not.toMatch(/\/home\/[a-z]/i);
    expect(allRendered).not.toMatch(/\b[0-9a-f]{40}\b/i);
    expect(allRendered).not.toMatch(/\b[0-9a-f]{7,10}\.\.\./);
  });

  it("publishes no secrets, credentials or internal addresses", () => {
    // Match credential shapes, not the word "secret": the Docker
    // reconciliation checklist legitimately says "secret values excluded".
    expect(prose).not.toMatch(/sk-[A-Za-z0-9]{16,}/);
    expect(prose).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(prose).not.toMatch(/(password|passwd|api[_-]?key|access[_-]?token)\s*[:=]\s*\S/i);
    expect(prose).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY/);
    expect(prose).not.toMatch(/192\.168\.\d+\.\d+/);
    expect(prose).not.toMatch(/\b10\.\d+\.\d+\.\d+/);
  });
});

/* ========================================================================== */

describe("no fabricated metrics or claims", () => {
  it("scopes every historical test floor instead of aggregating it", () => {
    expect(scopedTestFloors.length).toBeGreaterThanOrEqual(5);
    for (const m of scopedTestFloors) {
      expect(m.scope.length, `${m.value} must carry a scope`).toBeGreaterThan(25);
    }
  });

  it("records the specific October suite result with its scope", () => {
    const s621 = scopedTestFloors.find((m) => m.value === "621")!;
    expect(s621.scope).toMatch(/621 passed, 0 failed, 0 skipped/);
    expect(s621.scope).toMatch(/does not cover modules that failed to import/i);
  });

  it("states that no figure here was produced by running anything on this site", () => {
    expect(prose).toMatch(/documentation surface/i);
    expect(prose).toMatch(/do not prove that Raphael's source, authorization boundary, cognitive loop or research thesis has passed its own gates/i);
  });

  it("claims no current readiness and no completed self-improvement", () => {
    // "production ready" and "recursively self-improving" both appear on this
    // page only inside explicit negations, so the negation is asserted and an
    // affirmative claim is asserted absent.
    expect(prose).toMatch(/neither “nothing works” nor “production ready”/);
    expect(prose).not.toMatch(/Raphael is production[- ]ready/i);
    expect(prose).not.toMatch(/\bis now production[- ]ready/i);
    expect(prose).toMatch(
      /not an assumption that adding a learner module makes the system recursively self-improving/,
    );
    expect(prose).toMatch(/target, not a capability/);
  });

  it("states that a missing holdout blocks reproducibility", () => {
    expect(currentStatusRows.find((r) => r.id === "dataset")!.why).toMatch(
      /not a substitute for the dataset itself/i,
    );
  });

  it("states that unproven is not the same as false", () => {
    expect(prose).toMatch(/not proven true/);
    expect(prose).toMatch(/not conclusively disproven|not proven true, and not conclusively/i);
  });
});

/* ========================================================================== */

describe("the appendices are surfaced, not omitted", () => {
  it("renders the evidence categories and status verbs", () => {
    expect(statusVerbs.length).toBeGreaterThanOrEqual(8);
    expect(allRendered).toMatch(/Status verbs are intentionally not interchangeable/);
    for (const v of statusVerbs) {
      expect(v.doesNotMean.length).toBeGreaterThan(10);
    }
  });

  it("surfaces the change log of claims", () => {
    const appendix = rendered.find((r) => r.path.endsWith("AppendixSections.tsx"))!.text;
    expect(appendix).toMatch(/Change log of claims/);
  });

  it("records the open historical research items", () => {
    expect(allRendered).toMatch(/Open historical-research items|openHistoricalResearchItems/);
  });

  it("publishes the editorial rules applied to the page", () => {
    expect(editorialRules.length).toBeGreaterThanOrEqual(8);
    expect(allRendered).toMatch(/Editorial rules applied to this page/);
    expect(editorialRules.join(" ")).toMatch(/Do not invent dates/);
  });
});

/* ========================================================================== */

describe("interaction and accessibility", () => {
  it("uses a real disclosure button with expanded state and a controlled panel", () => {
    const disclosure = readFileSync(
      join(process.cwd(), "src/components/timeline/Disclosure.tsx"),
      "utf8",
    );
    expect(disclosure).toContain("aria-expanded");
    expect(disclosure).toContain("aria-controls");
    expect(disclosure).toContain('type="button"');
    expect(disclosure).toContain("useId");
  });

  it("does not rely on hover-only interaction for any control", () => {
    const interactive = RENDERED_SOURCES.map((p) =>
      readFileSync(join(process.cwd(), p), "utf8"),
    ).join("\n");
    expect(interactive).not.toMatch(/onMouseEnter/);
    expect(interactive).not.toMatch(/onMouseLeave/);
  });

  it("gives every interactive control a visible focus state", () => {
    const interactive = RENDERED_SOURCES.map((p) =>
      readFileSync(join(process.cwd(), p), "utf8"),
    ).join("\n");
    const focusableCount = (interactive.match(/focus-visible:outline/g) ?? []).length;
    expect(focusableCount).toBeGreaterThanOrEqual(6);
  });

  it("uses real buttons with pressed state for the era filter", () => {
    const explorer = rendered.find((r) => r.path.endsWith("TimelineExplorer.tsx"))!.text;
    expect(explorer).toContain("aria-pressed");
    expect(explorer).toContain('role="group"');
    expect(explorer).toContain("All eras");
  });

  it("navigates by real anchors to real sections", () => {
    const rail = rendered.find((r) => r.path.endsWith("ChronologyRail.tsx"))!.text;
    const explorer = rendered.find((r) => r.path.endsWith("TimelineExplorer.tsx"))!.text;
    // The rail builds one href per era, and the timeline renders the matching
    // element id, so every entry scrolls to a real milestone.
    expect(rail).toContain("href={`#era-${era.id}`}");
    expect(explorer).toContain('id={`era-${era.id}`}');
    // Every section the rail links to must exist as an element id on the page.
    for (const target of ["gate-history", "docker-era", "evaluation-integrity", "appendices", "sources"]) {
      expect(rail).toContain(`href: "#${target}"`);
      expect(PAGE).toContain(`id="${target}"`);
    }
  });

  it("labels the filter search input", () => {
    const docker = rendered.find((r) => r.path.endsWith("DockerHistory.tsx"))!.text;
    expect(docker).toContain("<label");
    expect(docker).toContain("sr-only");
  });

  it("reports the filtered result count politely", () => {
    const docker = rendered.find((r) => r.path.endsWith("DockerHistory.tsx"))!.text;
    expect(docker).toMatch(/aria-live="polite"/);
  });

  it("respects reduced motion through the site's motion system", () => {
    const explorer = rendered.find((r) => r.path.endsWith("TimelineExplorer.tsx"))!.text;
    // The explorer deliberately uses no bespoke animation; page reveals go
    // through the shared Reveal component, which collapses under
    // prefers-reduced-motion.
    expect(explorer).not.toMatch(/animate-\[|motion\./);
    expect(PAGE).toContain("Reveal");
  });

  it("uses semantic headings in order", () => {
    expect(PAGE).toContain("<TimelineHero");
    expect(PAGE).toContain("SectionHeader");
    const current = rendered.find((r) => r.path.endsWith("CurrentStatus.tsx"))!.text;
    expect(current).toContain("<h2");
  });

  it("never signals status by colour alone", () => {
    // Every status row renders the literal status word.
    const current = rendered.find((r) => r.path.endsWith("CurrentStatus.tsx"))!.text;
    expect(current).toContain("{row.value}");
  });
});

/* ========================================================================== */

describe("site integration is additive", () => {
  it("is linked from the primary navigation", () => {
    const site = readFileSync(join(process.cwd(), "src/config/site.ts"), "utf8");
    expect(site).toContain('href: "/raphael/timeline"');
  });

  it("is linked from the Raphael overview and cross-links the architecture page", () => {
    const raphael = readFileSync(join(process.cwd(), "src/app/raphael/page.tsx"), "utf8");
    expect(raphael).toContain("/raphael/timeline");
    expect(PAGE).toContain('href="/raphael/architecture"');
    const arch = readFileSync(
      join(process.cwd(), "src/app/raphael/architecture/page.tsx"),
      "utf8",
    );
    expect(arch).toContain("/raphael/timeline");
  });

  it("introduces no public source-release call to action while the gate is closed", () => {
    expect(PAGE).not.toMatch(/download the source|get the source|release-approved/i);
    expect(allRendered).not.toMatch(/npx |git clone/i);
  });

  it("keeps the lineage disclaimer visible on the page", () => {
    expect(lineageDisclaimer.length).toBeGreaterThan(40);
    expect(allRendered).toContain("date not established");
  });
});

/* ========================================================================== */

describe("content is separated from rendering", () => {
  it("keeps every milestone fact in the typed content modules", () => {
    const pageProse = PAGE.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    for (const m of milestones) {
      expect(pageProse).not.toContain(m.summary.slice(0, 40));
    }
  });

  it("holds the chronology in the content module, not the page component", () => {
    const content = readFileSync(
      join(process.cwd(), "src/content/raphael-timeline.ts"),
      "utf8",
    );
    expect(content).toContain("export const milestones");
    expect(content).toContain("export const eras");
    expect(PAGE).not.toMatch(/const (milestones|eras) = \[/);
  });

  it("types every milestone against a declared interface", () => {
    const typed: readonly Milestone[] = milestones;
    expect(typed.every((m) => typeof m.id === "string")).toBe(true);
  });
});
