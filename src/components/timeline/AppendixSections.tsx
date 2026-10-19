"use client";

import {
  claimCorrections,
  editorialRules,
  evidenceCategories,
  interpretationSteps,
  notProvenIsNotFalse,
  openHistoricalResearchItems,
  scopedTestFloors,
  scopedTestFloorsCaveat,
  setbacksRationale,
  siteLimitation,
  statusVerbs,
  timelineLastReviewed,
} from "@/content/raphael-timeline-deep";
import { Disclosure } from "./Disclosure";

/**
 * Appendices.
 *
 * The source document's appendices carry most of its evidentiary detail. They
 * are surfaced here as labelled expandable sections rather than omitted, and
 * rather than inlined into the chronology where they would swamp it.
 */
export function AppendixSections() {
  return (
    <div className="flex flex-col gap-2.5">
      <Disclosure
        summary="A — Evidence categories and status verbs used throughout"
        headingLevel={3}
      >
        <div className="flex max-w-[76ch] flex-col gap-5">
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
              Evidence categories
            </h4>
            <dl className="mt-2 flex flex-col gap-2">
              {evidenceCategories.map((c) => (
                <div key={c.label} className="rounded-md border border-hairline bg-void/40 px-3 py-2.5">
                  <dt className="text-[12px] font-semibold text-ink">{c.label}</dt>
                  <dd className="mt-1 text-[12px] leading-relaxed text-ink-muted">{c.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
              Status verbs are intentionally not interchangeable
            </h4>
            <div className="mt-2 overflow-x-auto">
              <table className="table-stack w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-hairline">
                    {["Word", "Meaning here", "What it does not mean"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {statusVerbs.map((v) => (
                    <tr key={v.word} className="border-b border-hairline/70 align-top">
                      <td data-label="Word" className="px-3 py-2.5 font-mono text-[12px] text-ink">
                        {v.word}
                      </td>
                      <td data-label="Meaning" className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-muted">
                        {v.meaning}
                      </td>
                      <td data-label="Not" className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint">
                        {v.doesNotMean}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Disclosure>

      <Disclosure summary="B — Early-era phase dossiers and open research items" headingLevel={3}>
        <div className="flex max-w-[76ch] flex-col gap-4">
          <p className="text-[12.5px] leading-relaxed text-ink-muted">
            The three origin eras are preserved by name and by conceptual role
            rather than by implementation mapping. Until original artefacts are
            recovered, the page keeps their place in the sequence while leaving
            their design definition, architecture and implementation mapping
            unasserted.
          </p>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
              Open historical-research items
            </h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {openHistoricalResearchItems.map((i) => (
                <li
                  key={i}
                  className="text-[12.5px] leading-relaxed text-ink-muted"
                >
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Disclosure>

      <Disclosure summary="L — Change log of claims, not just versions" headingLevel={3}>
        <p className="mb-3 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-muted">
          The project evolved not only by adding modules, but by narrowing or
          correcting claims. These corrections are part of the technical story
          because they show where evidence changed the design or the public
          statement.
        </p>
        <div className="overflow-x-auto">
          <table className="table-stack w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {["Historical claim or assumption", "Later finding or correction", "What this page preserves"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claimCorrections.map((c) => (
                <tr key={c.historicalClaim} className="border-b border-hairline/70 align-top">
                  <td data-label="Claim" className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-muted">
                    {c.historicalClaim}
                  </td>
                  <td data-label="Finding" className="px-3 py-2.5 text-[12px] leading-relaxed text-conditional">
                    {c.laterFinding}
                  </td>
                  <td data-label="Preserved" className="px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint">
                    {c.preserve}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>

      <Disclosure summary="J — Historical test floors, each scoped to its revision" headingLevel={3}>
        <p className="mb-3 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-muted">
          These counts are recorded because the record contains them, and are
          deliberately not aggregated. A cumulative progress bar built from
          numbers that belong to different revisions, selections and
          environments would be a fabrication.
        </p>
        <ul className="grid max-w-[76ch] gap-2 sm:grid-cols-2">
          {scopedTestFloors.map((m) => (
            <li
              key={`${m.value}-${m.scope}`}
              className="rounded-md border border-hairline bg-void/40 px-3 py-2.5"
            >
              <span className="font-mono text-[13px] font-semibold text-ink">{m.value}</span>
              <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-faint">
                {m.scope}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-[76ch] text-[12px] leading-relaxed text-ink-faint">
          {scopedTestFloorsCaveat}
        </p>
      </Disclosure>

      <Disclosure summary="A.4 — Why later setbacks stay in the timeline" headingLevel={3}>
        <div className="flex max-w-[76ch] flex-col gap-3.5">
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{setbacksRationale}</p>
          <p className="text-[12.5px] leading-relaxed text-ink-muted">{notProvenIsNotFalse}</p>
          <div>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-dim">
              The intended public interpretation
            </h4>
            <ol className="mt-2 list-decimal gap-1.5 pl-5 text-[12.5px] leading-relaxed text-ink-muted marker:text-ink-faint">
              {interpretationSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        </div>
      </Disclosure>

      <Disclosure summary="Editorial rules applied to this page" headingLevel={3}>
        <ol className="flex max-w-[76ch] list-decimal flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-muted marker:text-ink-faint">
          {editorialRules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
        <p className="mt-4 max-w-[76ch] border-t border-hairline pt-3 text-[12px] leading-relaxed text-ink-faint">
          {siteLimitation} Timeline document prepared{" "}
          <span className="font-mono">{timelineLastReviewed}</span>.
        </p>
      </Disclosure>
    </div>
  );
}
