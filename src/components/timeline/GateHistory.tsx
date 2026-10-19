import {
  gateHistory,
  gateDispositionTone,
} from "@/content/raphael-timeline-deep";
import { Disclosure } from "./Disclosure";

const TONE: Record<string, string> = {
  cyan: "border-cyan/35 bg-cyan/10 text-cyan",
  violet: "border-violet/35 bg-violet/10 text-violet",
  blocked: "border-blocked/40 bg-blocked/10 text-blocked",
};

/**
 * G0 to G10 gate history.
 *
 * Rendered as a compact status matrix first and an expandable record per gate
 * second, so a reader can see the shape of the chain — three historical passes,
 * one hard block, the rest not accepted — without opening eleven panels.
 */
export function GateHistory() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-dim">
          Gate status matrix
        </h3>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {gateHistory.map((g) => (
            <li
              key={g.gate}
              className={`flex min-w-0 items-baseline justify-between gap-2 rounded-md border border-hairline bg-void/40 px-3 py-2 ${
                g.disposition === "BLOCKED" ? "border-blocked/30 bg-blocked/[0.05]" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="font-mono text-[12px] font-semibold text-ink">
                  {g.gate}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-ink-faint">
                  {g.shortName}
                </span>
              </span>
              <span className={`chip shrink-0 ${TONE[gateDispositionTone[g.disposition]]}`}>
                {g.dispositionLabel}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-[72ch] text-[12px] leading-relaxed text-ink-faint">
          Roadmap activity downstream of a gate is not evidence that the gate
          itself was accepted. The later assessment explicitly says nothing
          beyond G2 was adopted in the relevant authority record.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {gateHistory.map((g) => (
          <Disclosure
            key={g.gate}
            headingLevel={3}
            defaultOpen={g.disposition === "BLOCKED"}
            accent={g.disposition === "BLOCKED" ? "blocked" : "default"}
            summary={`${g.gate} · ${g.phase} — ${g.shortName}`}
            meta={
              <span className={`chip ${TONE[gateDispositionTone[g.disposition]]}`}>
                {g.dispositionLabel}
              </span>
            }
          >
            <div className="flex max-w-[72ch] flex-col gap-4">
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Purpose
                </h4>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">{g.purpose}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Evidence in the records
                </h4>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">
                  {g.evidenceInRecords}
                </p>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
                  Why it matters
                </h4>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-ink-muted">
                  {g.significance}
                </p>
              </div>
            </div>
          </Disclosure>
        ))}
      </div>
    </div>
  );
}
