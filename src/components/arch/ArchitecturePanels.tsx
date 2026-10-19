import type { ReactNode } from "react";
import { AlertTriangle, Lock, ShieldCheck } from "lucide-react";
import {
  gateStates,
  knownGaps,
  phaseSequencingRule,
  roadmapPhases,
  rsiAbsentSubstrate,
  rsiReadinessBanner,
  rsiRules,
  trustBoundaries,
  type GateState,
  type KnownGap,
  type RoadmapPhase,
} from "@/content/raphael-architecture";
import { Card, Note, SectionHeader } from "@/components/ui/primitives";

/* ========================================================================== */
/* Gate and release status line                                                */
/* ========================================================================== */

/**
 * The recorded gate state, rendered VERBATIM.
 *
 * These strings are the project's own recorded words. They are never softened
 * into a paraphrase, because "nearly passed" is how a blocked gate becomes
 * "nearly passed" in a reader's memory.
 */
export function GateStatusStrip() {
  return (
    <div className="rounded-lg border border-hairline-strong bg-abyss/60 p-5">
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-ink">
        Recorded gate and release status
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">
        Transcribed from the project&rsquo;s own records. A status is a governance decision, not
        something a diagram, a test run or a code review can establish.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {gateStates.map((gate) => (
          <li key={gate.id} className="rounded-md border border-hairline bg-elevated/50 p-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
              <span className="font-mono text-[11.5px] text-ink-dim">{gate.id}</span>
              <span className="chip border border-blocked/40 bg-blocked/10 text-blocked">
                {gate.recordedStatus}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-snug text-ink-muted">{gate.role}</p>
            <p className="mt-1.5 text-[11.5px] leading-snug text-ink-faint">{gate.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========================================================================== */
/* Known gaps                                                                  */
/* ========================================================================== */

/**
 * Known gaps, with the older record and the newer evidence kept apart.
 *
 * The separation is the whole point of this panel: a defect recorded at an
 * earlier snapshot must not be silently marked fixed merely because newer
 * documentation exists. Where newer evidence does not settle the position, the
 * panel says "not independently confirmed" rather than choosing a side.
 */
export function KnownGapsPanel() {
  return (
    <div>
      <SectionHeader
        eyebrow="Known gaps and evidence"
        title="What the records do not settle"
        lede="Each entry separates what an earlier record stated from what later evidence says. Where the later evidence does not settle the present-day position, that is what this page says — a single run of tests is an engineering report, and a gate is a governance decision."
      />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {knownGaps.map((gap) => (
          <GapCard key={gap.id} gap={gap} />
        ))}
      </div>

      <Note tone="caution" className="mt-6">
        <span className="font-medium text-ink">These are recorded limitations, not aspirations.</span>{" "}
        The evaluation gap in particular is the reason the central research thesis cannot be settled:
        a measurement whose dataset is missing cannot establish a result.
      </Note>
    </div>
  );
}

function GapCard({ gap }: { gap: KnownGap }) {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-[14px] font-semibold text-ink">{gap.title}</h3>
        <span className="font-mono text-[11px] text-ink-faint">{gap.id}</span>
      </div>

      <div className="mt-3 space-y-3 text-[12.5px] leading-relaxed">
        <div>
          <h4 className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
            <AlertTriangle size={11} aria-hidden />
            At the reviewed snapshot
          </h4>
          <p className="mt-1 text-ink-muted">{gap.recordedAtReview}</p>
        </div>

        <div className="border-t border-hairline pt-3">
          <h4 className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
            Newer evidence
          </h4>
          <p className="mt-1 text-ink-muted">{gap.currentDisposition}</p>
        </div>
      </div>

      <p
        className={`mt-auto pt-4 text-[11px] font-medium leading-relaxed ${
          gap.dispositionConfidence === "unconfirmed" ? "text-unknown" : "text-cyan"
        }`}
      >
        Current disposition not independently confirmed.
      </p>

      <p className="mt-2 text-[10.5px] leading-relaxed text-ink-faint">{gap.sourceNote}</p>
    </Card>
  );
}

/* ========================================================================== */
/* Trust boundaries                                                            */
/* ========================================================================== */

export function TrustBoundariesPanel() {
  return (
    <div>
      <SectionHeader
        eyebrow="Trust boundaries"
        title="Who proposes, who decides, who executes, who measures"
        lede="A boundary is a place where authority changes hands. These six are the places where it is allowed to change hands — and nowhere else."
      />

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {trustBoundaries.map((boundary) => (
          <li key={boundary.id} className="rounded-lg border border-hairline bg-elevated/40 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck size={13} aria-hidden className="shrink-0 text-cyan" />
              <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-ink">
                {boundary.label}
              </h3>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">{boundary.rule}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ========================================================================== */
/* Governed improvement lane                                                   */
/* ========================================================================== */

/**
 * The RSI lane.
 *
 * Rendered so it cannot be mistaken for an operating subsystem: the readiness
 * banner is a fixed string from the roadmap, and the absent-substrate list
 * shows what does not exist yet. Both are rendered unconditionally rather than
 * being hidden behind a disclosure, because hiding them is how a hypothetical
 * becomes an implied capability.
 */
export function GovernedImprovementLane() {
  return (
    <div className="rounded-lg border border-violet/25 bg-violet/[0.03] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            Governed improvement workflow · hypothetical
          </h2>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-muted">
            A separate outer loop that would improve the exploration policy over time. It is not part
            of the production task loop, and it is not available: the roadmap forbids implementing it
            until the current gate passes.
          </p>
        </div>
        <span className="chip shrink-0 border border-blocked/40 bg-blocked/10 text-blocked">
          {rsiReadinessBanner}
        </span>
      </div>

      {/* What does not exist. Rendered, not hidden. */}
      <div className="mt-5 rounded-md border border-hairline bg-abyss/50 p-4">
        <h3 className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
          <Lock size={11} aria-hidden />
          The current records contain none of this
        </h3>
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {rsiAbsentSubstrate.map((item) => (
            <li key={item} className="flex gap-2 text-[12px] leading-snug text-ink-muted">
              <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-blocked/70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* The seven rules the design would have to satisfy. */}
      <ol className="mt-5 grid gap-3 lg:grid-cols-2">
        {rsiRules.map((rule) => (
          <li key={rule.id} className="rounded-md border border-hairline bg-elevated/40 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-[12.5px] font-semibold text-ink">{rule.title}</h4>
              <span className="shrink-0 font-mono text-[10.5px] text-violet">{rule.id}</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">{rule.body}</p>
          </li>
        ))}
      </ol>

      <Note tone="caution" className="mt-5">
        <span className="font-medium text-ink">Protected surfaces are never self-modifiable.</span> The
        Runtime, the production loop, the decision point, the enforcement point, execution and
        provenance authority, WorldModel belief authority, the evaluator and holdout, the promotion
        gate and human release authority all remain outside recursive modification. Changing any of
        them requires a new explicit decision record and is outside the roadmap by default. The
        registry itself is protected: evolving a policy cannot rewrite the registry. An accepted
        policy therefore returns only as proposal-only influence in a later run.
      </Note>
    </div>
  );
}

/* ========================================================================== */
/* Roadmap strip                                                               */
/* ========================================================================== */

/**
 * The phase spine.
 *
 * A future gate is rendered "not recorded", never as passed. The blocked gate is
 * rendered with its recorded status so the strip cannot be scanned optimistically.
 */
export function RoadmapStrip() {
  return (
    <div>
      <SectionHeader
        eyebrow="Roadmap gates"
        title="Phases are sequential and gated"
        lede={phaseSequencingRule}
      />

      <ol className="mt-8 flex flex-wrap gap-2" aria-label="Roadmap phases and gates in order">
        {roadmapPhases.map((phase) => (
          <li key={phase.id}>
            <PhasePill phase={phase} />
          </li>
        ))}
      </ol>

      <Note tone="caution" className="mt-6">
        <span className="font-medium text-ink">A blocked gate stops the sequence.</span> Phases after
        the current blocker are not authorized, and the fact that their design is complete is not an
        authorization to build them.
      </Note>
    </div>
  );
}

function PhasePill({ phase }: { phase: RoadmapPhase }) {
  // Never "pass" by default. Only an explicit recorded pass reads as passed.
  const passed = phase.passed;
  const recorded = phase.recordedStatus ?? "not recorded";

  return (
    <div
      className={`min-w-[8.5rem] rounded-md border px-3 py-2.5 ${
        passed
          ? "border-ready/30 bg-ready/[0.05]"
          : recorded === "BLOCKED"
            ? "border-blocked/40 bg-blocked/[0.06]"
            : "border-hairline bg-elevated/40"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-ink">{phase.id}</span>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.06em] ${
            passed ? "text-ready" : recorded === "BLOCKED" ? "text-blocked" : "text-ink-faint"
          }`}
        >
          {phase.gate} {recorded}
        </span>
      </div>
      <p className="mt-1 text-[11.5px] leading-snug text-ink-muted">{phase.label}</p>
    </div>
  );
}

/* ========================================================================== */
/* Sources                                                                     */
/* ========================================================================== */

export function ArchitectureSourcesPanel({
  sources,
  lastReviewed,
}: {
  sources: readonly { document: string; role: string }[];
  lastReviewed: string;
}) {
  return (
    <div>
      <SectionHeader
        eyebrow="Evidence and limitations"
        title="What these diagrams were built from"
        lede="Document names and their role only. Local file paths, remote names, commit identifiers and operational detail are deliberately not published."
      />

      <ul className="mt-8 space-y-3">
        {sources.map((source) => (
          <li key={source.document} className="rounded-lg border border-hairline bg-elevated/40 p-4">
            <h3 className="text-[13px] font-semibold text-ink">{source.document}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{source.role}</p>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-[11.5px] leading-relaxed text-ink-faint">
        <span className="font-mono">Limitations</span> · The existing-architecture view is a
        documented snapshot. It is not a fresh confirmation that every stage still behaves as
        described, and this page does not independently verify any runtime capability. The
        target-architecture view is a proposal that has not been implemented.
      </p>

      <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
        <span className="font-mono">Source</span> · project records · last reviewed {lastReviewed}
      </p>
    </div>
  );
}

/** Small helper so callers can compose panel headings consistently. */
export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <SectionHeader
      eyebrow="Architecture"
      title={children}
      align="center"
    />
  );
}

export type { GateState };
