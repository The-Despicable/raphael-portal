import { milestonesByEra } from "@/content/raphael-timeline";

/**
 * v4.2 recursive-improvement target.
 *
 * The source's own distinction is between a *target* and an *admitted*
 * improvement, so this panel presents the concepts as definitions and keeps
 * the recorded implementation status attached to the whole section rather
 * than letting the vocabulary imply a running capability.
 */
export function RsiTarget() {
  const milestone = milestonesByEra.v42[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-violet/25 bg-violet/[0.04] p-4">
        <p className="max-w-[62ch] text-[13px] leading-relaxed text-ink-muted">
          {milestone.summary}
        </p>
        <span className="chip shrink-0 border border-violet/35 bg-violet/10 font-mono text-violet">
          RSI implementation — NOT STARTED
        </span>
      </div>

      <dl className="grid gap-2.5 sm:grid-cols-2">
        {milestone.detail.components?.map((c) => {
          const [term, ...rest] = c.split(":");
          return (
            <div
              key={c}
              className="rounded-md border border-hairline bg-void/40 px-3.5 py-3"
            >
              <dt className="font-mono text-[12px] font-semibold text-ink">{term}</dt>
              <dd className="mt-1.5 text-[12px] leading-relaxed text-ink-muted">
                {rest.join(":").trim()}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="rounded-lg border border-conditional/25 bg-conditional/[0.04] p-4">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-conditional">
          Recorded limitations
        </h3>
        <ul className="mt-2.5 flex flex-col gap-1.5">
          {milestone.detail.limitations?.map((l) => (
            <li
              key={l}
              className="max-w-[72ch] text-[12.5px] leading-relaxed text-ink-muted"
            >
              {l}
            </li>
          ))}
        </ul>
      </div>

      <p className="max-w-[72ch] text-[12.5px] leading-relaxed text-ink-faint">
        {milestone.detail.significance}
      </p>
    </div>
  );
}
