"use client";

import { useState } from "react";
import type { Era, EraAccent, Milestone } from "@/content/raphael-timeline";
import { Disclosure } from "./Disclosure";

const ACCENT: Record<EraAccent, { node: string; chip: string; card: string }> = {
  azure: {
    node: "border-azure bg-transparent",
    chip: "border-azure/35 bg-azure/10 text-azure",
    card: "",
  },
  cyan: {
    node: "border-cyan bg-cyan",
    chip: "border-cyan/35 bg-cyan/10 text-cyan",
    card: "border-cyan/25 bg-cyan/[0.035]",
  },
  violet: {
    node: "border-violet bg-violet",
    chip: "border-violet/35 bg-violet/10 text-violet",
    card: "border-violet/25 bg-violet/[0.035]",
  },
  amber: {
    node: "border-conditional bg-conditional",
    chip: "border-conditional/35 bg-conditional/10 text-conditional",
    card: "",
  },
  blocked: {
    node: "border-blocked bg-blocked",
    chip: "border-blocked/35 bg-blocked/10 text-blocked",
    card: "border-blocked/25 bg-blocked/[0.035]",
  },
};

const EVIDENCE_LABEL: Record<Milestone["evidenceClass"], string> = {
  OWNER_RECALLED: "Owner-recalled",
  DOCUMENTED_DESIGN: "Documented design",
  REPORTED_SNAPSHOT: "Reported snapshot",
  AUDIT_FINDING: "Audit finding",
  RECORDED_STATUS: "Recorded status",
};

/**
 * A labelled prose block inside an expanded milestone.
 *
 * Consistent block styling so long technical prose stays scannable without
 * the page collapsing into a wall of undifferentiated text.
 */
function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="max-w-[68ch]">
      <h4 className="text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-dim">
        {label}
      </h4>
      <div className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">{children}</div>
    </div>
  );
}

function MilestoneDetail({ milestone }: { milestone: Milestone }) {
  const d = milestone.detail;
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Date", milestone.dateDisplay],
          ["Evidence", EVIDENCE_LABEL[milestone.evidenceClass]],
          ["Confidence", milestone.confidence],
          ["Sequence", `Era ${milestone.eraId}`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {k}
            </dt>
            <dd className="mt-1 font-mono text-[12px] text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      {d.historicalContext ? (
        <DetailBlock label="Historical context">{d.historicalContext}</DetailBlock>
      ) : null}
      {d.architecturalObjective ? (
        <DetailBlock label="Architectural objective">{d.architecturalObjective}</DetailBlock>
      ) : null}
      {d.changedFromPrevious ? (
        <DetailBlock label="What changed">{d.changedFromPrevious}</DetailBlock>
      ) : null}
      {d.components && d.components.length > 0 ? (
        <DetailBlock label="Modules, services and interfaces">
          <ul className="flex flex-col gap-1.5">
            {d.components.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-faint" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}
      {d.implementationEvidence ? (
        <DetailBlock label="Evidence of implementation">{d.implementationEvidence}</DetailBlock>
      ) : null}
      {d.verificationEvidence ? (
        <DetailBlock label="Evidence of verification">{d.verificationEvidence}</DetailBlock>
      ) : null}
      {d.limitations && d.limitations.length > 0 ? (
        <DetailBlock label="Known limitations and unresolved detail">
          <ul className="flex flex-col gap-1.5">
            {d.limitations.map((c) => (
              <li key={c} className="flex gap-2">
                <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-conditional/70" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </DetailBlock>
      ) : null}
      <DetailBlock label="Why this phase mattered">{d.significance}</DetailBlock>
      {d.relationshipToLater ? (
        <DetailBlock label="Relationship to later milestones">{d.relationshipToLater}</DetailBlock>
      ) : null}

      <div className="max-w-[68ch] border-t border-hairline pt-4">
        <p className="text-[12.5px] leading-relaxed text-ink-faint">
          <span className="font-medium text-ink-muted">What this does not prove: </span>
          {milestone.doesNotProve}
        </p>
      </div>
    </div>
  );
}

/**
 * The chronological timeline.
 *
 * Ordering is taken from the explicit `order` key on the content objects, not
 * from the rendered date string, so the three undated origin eras sort to the
 * front without any of them needing a manufactured date.
 */
export function TimelineExplorer({
  eras,
  milestonesByEra,
}: {
  eras: readonly Era[];
  milestonesByEra: Record<string, readonly Milestone[]>;
}) {
  const [eraFilter, setEraFilter] = useState<string | null>(null);

  return (
    <div>
      {/* Era filter. Real buttons with pressed state, so the current selection
          is exposed to assistive technology rather than only to the eye. */}
      <div
        role="group"
        aria-label="Filter timeline by era"
        className="flex flex-wrap items-center gap-1.5"
      >
        <button
          type="button"
          aria-pressed={eraFilter === null}
          onClick={() => setEraFilter(null)}
          className={`chip transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
            eraFilter === null
              ? "border-cyan/45 bg-cyan/12 text-cyan"
              : "border-hairline bg-surface/60 text-ink-muted hover:border-hairline-strong hover:text-ink"
          }`}
        >
          All eras
        </button>
        {eras.map((era) => (
          <button
            key={era.id}
            type="button"
            aria-pressed={eraFilter === era.id}
            onClick={() => setEraFilter((cur) => (cur === era.id ? null : era.id))}
            className={`chip transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
              eraFilter === era.id
                ? ACCENT[era.accent].chip
                : "border-hairline bg-surface/60 text-ink-muted hover:border-hairline-strong hover:text-ink"
            }`}
          >
            {String(era.order).padStart(2, "0")} {era.shortLabel}
          </button>
        ))}
      </div>

      <div className="mt-7 flex flex-col gap-10">
        {eras
          .filter((era) => eraFilter === null || eraFilter === era.id)
          .map((era) => {
            const list = milestonesByEra[era.id] ?? [];
            if (list.length === 0) return null;
            const accent = ACCENT[era.accent];
            return (
              <section
                key={era.id}
                id={`era-${era.id}`}
                aria-labelledby={`era-${era.id}-heading`}
                className="scroll-mt-6"
              >
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3
                    id={`era-${era.id}-heading`}
                    className="text-[15px] font-semibold tracking-tight text-ink"
                  >
                    {era.title}
                  </h3>
                  <span className={`chip ${accent.chip}`}>
                    {String(era.order).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[11px] text-ink-faint">
                    {era.dateLabel}
                  </span>
                </header>
                <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-ink-muted">
                  {era.oneSentence}
                </p>

                {/* The vertical rail. It sits behind the node markers and runs
                    the full height of the era's milestones. */}
                <ol className="relative mt-5 flex flex-col gap-4 pl-8 md:pl-10">
                  <span
                    aria-hidden
                    className="absolute bottom-3 left-[11px] top-3 w-0.5 rounded-full bg-gradient-to-b from-hairline-strong via-hairline-strong to-transparent md:left-[15px]"
                  />
                  {list.map((milestone) => {
                    const mAccent = ACCENT[era.accent];
                    return (
                      <li key={milestone.id} className="relative">
                        <span
                          aria-hidden
                          className={`absolute -left-8 top-4 size-3.5 rounded-full border-2 md:-left-10 ${mAccent.node} ${
                            era.undated ? "border-dashed" : ""
                          }`}
                        />
                        <Disclosure
                          accent={era.accent === "blocked" ? "blocked" : era.accent === "cyan" ? "cyan" : era.accent === "violet" ? "violet" : "default"}
                          summary={milestone.title}
                          meta={
                            <>
                              <span
                                className={`chip ${
                                  milestone.datePrecision === "not_established"
                                    ? "border-hairline bg-void/40 text-ink-faint"
                                    : "border-hairline bg-void/40 font-mono text-ink-muted"
                                }`}
                              >
                                {milestone.dateDisplay}
                              </span>
                              <span className={`chip ${mAccent.chip}`}>
                                {EVIDENCE_LABEL[milestone.evidenceClass]}
                              </span>
                              {milestone.sources.map((s) => (
                                <span
                                  key={s}
                                  className="chip border-hairline bg-void/40 font-mono text-[10px] text-ink-faint"
                                >
                                  {s}
                                </span>
                              ))}
                            </>
                          }
                        >
                          <MilestoneDetail milestone={milestone} />
                        </Disclosure>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
      </div>
    </div>
  );
}
