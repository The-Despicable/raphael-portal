"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  datedSnapshots,
  dockerCountDiscrepancy,
  dockerReconstructionLabel,
  dockerSnapshotCaveat,
  dockerSnapshotClaims,
  historicalDockerServices,
  imageReconciliationChecklist,
  snapshotAggregationCaveat,
  unmatchedDeclaredService,
} from "@/content/raphael-timeline-deep";
import { Disclosure } from "./Disclosure";
import { Note } from "@/components/ui/primitives";

/**
 * Historical Docker era.
 *
 * The service inventory is searchable rather than dumped into the milestone
 * card, because fifteen rows plus their evidence boundaries would otherwise
 * dominate the chronology it belongs to. Filtering is client-side over a
 * static array, so the core history renders with no dependency on this
 * component being interactive.
 */
export function DockerHistory() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return historicalDockerServices;
    return historicalDockerServices.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        String(s.port).includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.evidenceBoundary.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex flex-col gap-6">
      {/* Three counts that are frequently and wrongly merged into one. */}
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Running containers", dockerCountDiscrepancy.runningContainers],
          ["Declared services", dockerCountDiscrepancy.declaredComposeServices],
          ["Named in diagram", dockerCountDiscrepancy.namedServices],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-hairline bg-void/40 px-3.5 py-3"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              {label}
            </dt>
            <dd className="mt-1 font-mono text-[13px] font-semibold text-cyan">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="max-w-[72ch] text-[12.5px] leading-relaxed text-ink-faint">
        {dockerCountDiscrepancy.note}
      </p>

      <div className="rounded-md border border-conditional/25 bg-conditional/[0.04] p-4">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-conditional">
          The unmatched sixteenth service
        </h3>
        <p className="mt-2 max-w-[72ch] text-[12.5px] leading-relaxed text-ink-muted">
          {unmatchedDeclaredService.note}
        </p>
      </div>

      <Note tone="caution">
        <span className="font-medium text-ink">A reported running stack is not a validated system. </span>
        {dockerSnapshotCaveat}
      </Note>

      {/* Service inventory */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[13px] font-semibold text-ink">
            Service inventory transcribed from the historical diagram
          </h3>
          <div className="relative">
            <label htmlFor="docker-service-search" className="sr-only">
              Search the historical service inventory
            </label>
            <Search
              aria-hidden
              size={13}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <input
              id="docker-service-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, port or role"
              className="w-full rounded-md border border-hairline bg-void/60 py-1.5 pl-8 pr-3 font-mono text-[12px] text-ink placeholder:text-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan sm:w-64"
            />
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
          {dockerReconstructionLabel}
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="table-stack w-full border-collapse text-left">
            <caption className="sr-only">
              Historical RAPHAEL 2.0 service names and ports transcribed from the
              July 2026 architecture diagram
            </caption>
            <thead>
              <tr className="border-b border-hairline">
                {["#", "Service", "Port", "Role in the diagram", "Evidence boundary"].map((h) => (
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
              {filtered.map((s) => (
                <tr key={s.name} className="border-b border-hairline/70 align-top">
                  <td data-label="#" className="px-3 py-2.5 font-mono text-[11.5px] text-ink-faint">
                    {s.ordinal}
                  </td>
                  <td data-label="Service" className="px-3 py-2.5 font-mono text-[12.5px] text-ink">
                    {s.name}
                  </td>
                  <td data-label="Port" className="px-3 py-2.5 font-mono text-[12.5px] text-cyan">
                    {s.port}
                  </td>
                  <td data-label="Role" className="max-w-[34ch] px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-muted">
                    {s.role}
                  </td>
                  <td data-label="Boundary" className="max-w-[38ch] px-3 py-2.5 text-[12px] leading-relaxed text-ink-faint">
                    {s.evidenceBoundary}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[12.5px] text-ink-faint">
                    No historical service matches that filter. The inventory
                    records only what the July diagram names, so an empty result
                    means the name is not in the record — not that it did not
                    exist.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p aria-live="polite" className="mt-2 text-[11px] text-ink-faint">
          Showing {filtered.length} of {historicalDockerServices.length} named
          services.
        </p>
      </div>

      {/* What the snapshot did and did not demonstrate */}
      <Disclosure
        summary="What the July snapshot did and did not demonstrate"
        headingLevel={3}
      >
        <ul className="flex flex-col gap-4">
          {dockerSnapshotClaims.map((c) => (
            <li key={c.claim} className="max-w-[72ch]">
              <p className="text-[13px] font-medium text-ink">{c.claim}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                <span className="text-ink-dim">Supported: </span>
                {c.supported}
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-faint">
                <span className="text-conditional">Not established: </span>
                {c.notEstablished}
              </p>
            </li>
          ))}
        </ul>
      </Disclosure>

      {/* Dated snapshots, kept separate. */}
      <Disclosure summary="Dated operational snapshots, kept separate" headingLevel={3}>
        <ul className="flex flex-col gap-3">
          {datedSnapshots.map((s) => (
            <li key={s.date} className="rounded-md border border-hairline bg-void/40 px-3.5 py-3">
              <span className="font-mono text-[12px] font-semibold text-ink">{s.date}</span>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{s.observation}</p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-faint">
                {s.representation}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[72ch] text-[12.5px] leading-relaxed text-conditional">
          {snapshotAggregationCaveat}
        </p>
      </Disclosure>

      {/* Reconciliation checklist for a future image-level claim. */}
      <Disclosure
        summary="Checklist any future image-level claim would have to satisfy"
        headingLevel={3}
      >
        <ol className="grid max-w-[72ch] list-decimal gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-muted marker:text-ink-faint">
          {imageReconciliationChecklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Disclosure>
    </div>
  );
}
