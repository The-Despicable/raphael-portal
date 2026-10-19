import {
  canonicalRuntimeFlow,
  runtimeInvariants,
  runtimeStages,
} from "@/content/raphael-timeline-deep";
import { Disclosure } from "./Disclosure";

/**
 * Canonical runtime control spine.
 *
 * Rendered as real DOM rather than an image: every node is selectable text,
 * the sequence is announced in order, and it survives zoom, high-contrast mode
 * and a screen reader. Colour distinguishes decision and enforcement points
 * but never carries the meaning alone — each node also states its role in
 * words.
 */
export function RuntimeFlow() {
  return (
    <div className="rounded-lg border border-hairline bg-elevated/40 p-4 md:p-5">
      <ol className="flex flex-col">
        {canonicalRuntimeFlow.map((step, i) => {
          const isDecision = step.role === "Policy Decision Point";
          const isEnforcement = step.role === "Policy Enforcement Point";

          return (
            <li key={step.id} className="relative flex gap-3 pb-3 last:pb-0">
              {/* Rail segment between nodes. */}
              {i < canonicalRuntimeFlow.length - 1 ? (
                <span
                  aria-hidden
                  className="absolute left-[13px] top-7 h-[calc(100%-1rem)] w-px bg-hairline-strong"
                />
              ) : null}
              <span
                aria-hidden
                className={`relative z-10 mt-[3px] flex size-[27px] shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${
                  isDecision
                    ? "border-violet bg-violet/15 text-violet"
                    : isEnforcement
                      ? "border-cyan bg-cyan/15 text-cyan"
                      : "border-hairline-strong bg-surface text-ink-dim"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[13px] font-semibold text-ink">{step.label}</span>
                  <span
                    className={`chip ${
                      isDecision
                        ? "border-violet/35 bg-violet/10 text-violet"
                        : isEnforcement
                          ? "border-cyan/35 bg-cyan/10 text-cyan"
                          : "border-hairline bg-surface/70 text-ink-dim"
                    }`}
                  >
                    {step.role}
                  </span>
                </div>
                <p className="mt-1 max-w-[70ch] text-[12.5px] leading-relaxed text-ink-muted">
                  {step.contract}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 max-w-[72ch] border-t border-hairline pt-3 text-[12px] leading-relaxed text-ink-faint">
        A designed control spine is not a demonstrated one. Presence of a
        component is not proof that the components work together successfully in
        a complete run.
      </p>
    </div>
  );
}

/** The fixed ten-stage sequence, stage by stage. */
export function StageSequence() {
  return (
    <div className="flex flex-col gap-5">
      <ol className="flex flex-wrap items-center gap-1.5">
        {runtimeStages.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className="chip border-hairline bg-surface/70 font-mono text-[10.5px] text-ink-muted">
              {s.n}. {s.name}
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-2.5">
        {runtimeStages.map((s) => (
          <Disclosure
            key={s.id}
            headingLevel={4}
            defaultOpen={s.n === 5}
            summary={`${s.n}. ${s.name}`}
            meta={
              <span className="chip border-hairline bg-void/40 text-[9.5px] text-ink-faint">
                inspected implementation recorded
              </span>
            }
          >
            <div className="flex max-w-[72ch] flex-col gap-3.5">
              <div>
                <h5 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Purpose
                </h5>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">{s.purpose}</p>
              </div>
              <div>
                <h5 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Inspected implementation note
                </h5>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">
                  {s.inspectedImplementation}
                </p>
              </div>
              <div>
                <h5 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Evidence that would be required to call this stage mature
                </h5>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-faint">
                  {s.acceptanceSignal}
                </p>
              </div>
            </div>
          </Disclosure>
        ))}
      </div>

      <details className="rounded-lg border border-hairline bg-surface/50 p-4">
        <summary className="cursor-pointer text-[13px] font-semibold text-ink marker:text-ink-faint">
          Stage-wide invariants — a target contract, not a pass list
        </summary>
        <ol className="mt-3 grid max-w-[76ch] list-decimal gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-muted marker:text-ink-faint">
          {runtimeInvariants.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      </details>
    </div>
  );
}
