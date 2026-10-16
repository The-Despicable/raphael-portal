"use client";

import { useMemo, useState } from "react";
import type { Blocker, Severity } from "@/lib/types";

const SEVERITIES: Severity[] = ["P0", "P1", "P2", "P3"];
const TYPES = [
  "GOVERNANCE",
  "EVIDENCE",
  "TECH",
  "RISK",
  "CONTRADICTION",
] as const;

/**
 * Filterable blocker register.
 *
 * Presented as an accessible table that reflows to labelled stacked cards below
 * 720px (see `.table-stack` in globals.css). Expanded rows carry the full
 * evidence and remediation text rather than hiding it behind a hover state.
 */
export function BlockerTable({ blockers }: { blockers: readonly Blocker[] }) {
  const [severity, setSeverity] = useState<Severity | "ALL">("ALL");
  const [type, setType] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      blockers.filter(
        (b) =>
          (severity === "ALL" || b.severity === severity) &&
          (type === "ALL" || b.type === type),
      ),
    [blockers, severity, type],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by severity">
          {(["ALL", ...SEVERITIES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              aria-pressed={severity === s}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                severity === s
                  ? "border-cyan/45 bg-cyan/10 text-cyan"
                  : "border-hairline text-ink-dim hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-[12px] text-ink-dim">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-md border border-hairline bg-abyss px-2.5 py-1.5 text-[12.5px] text-ink focus:border-cyan/50 focus:outline-none"
          >
            <option value="ALL">All</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <span className="text-[12px] text-ink-faint">
          {filtered.length} of {blockers.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        {/*
          min-w is applied ONLY from md up. Applying it unconditionally would
          force a 900px table on a 414px phone, so the stacked-card layout below
          720px would render off-screen.
        */}
        <table className="table-stack w-full border-collapse text-left text-[13px] md:min-w-[900px]">
          <caption className="sr-only">
            Blocker register from the {ASSESSMENT_DATE} assessment. Select a row to see full detail.
          </caption>
          <thead>
            <tr className="border-b border-hairline bg-abyss/60">
              {["ID", "Severity", "Type", "Blocker", "Disposition"].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-dim"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => {
              const isOpen = expanded === b.id;
              return (
                <>
                  <tr
                    key={b.id}
                    className="cursor-pointer border-b border-hairline transition-colors hover:bg-elevated/40"
                    onClick={() => setExpanded(isOpen ? null : b.id)}
                  >
                    <td data-label="ID" className="px-4 py-3 font-mono whitespace-nowrap text-cyan">
                      {b.id}
                    </td>
                    <td data-label="Severity" className="px-4 py-3">
                      <span
                        className={`status-pill ${
                          b.severity === "P0"
                            ? "border-blocked/40 bg-blocked/10 text-blocked"
                            : b.severity === "P1"
                              ? "border-conditional/40 bg-conditional/10 text-conditional"
                              : "border-hairline-strong bg-elevated text-ink-dim"
                        }`}
                      >
                        {b.severity}
                      </span>
                    </td>
                    <td data-label="Type" className="px-4 py-3 font-mono text-[11.5px] text-ink-dim">
                      {b.type}
                    </td>
                    <td data-label="Blocker" className="px-4 py-3 text-ink">
                      {b.title}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpanded(isOpen ? null : b.id);
                        }}
                        aria-expanded={isOpen}
                        className="ml-2 text-[11px] text-ink-faint underline underline-offset-2 hover:text-ink"
                      >
                        {isOpen ? "less" : "more"}
                      </button>
                    </td>
                    <td data-label="Disposition" className="px-4 py-3 text-ink-muted">
                      {b.disposition}
                    </td>
                  </tr>

                  {isOpen ? (
                    <tr key={`${b.id}-detail`} className="border-b border-hairline bg-abyss/40">
                      <td colSpan={5} className="px-4 py-5">
                        <div className="grid gap-5 md:grid-cols-2">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                                What is known
                              </h3>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                                {b.whatIsKnown}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                                Why it matters
                              </h3>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                                {b.whyItMatters}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                                Evidence
                              </h3>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                                {b.evidence}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-[11px] uppercase tracking-[0.1em] text-cyan">
                                What is needed
                              </h3>
                              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                                {b.needed}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-hairline pt-3 text-[12px]">
                              <span className="text-ink-dim">
                                Owner: <span className="text-ink">{b.owner}</span>
                              </span>
                              <span className="text-ink-dim">
                                Type: <span className="font-mono text-ink">{b.type}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-ink-dim">
          No blockers match that filter combination.
        </p>
      ) : null}
    </div>
  );
}

const ASSESSMENT_DATE = "2026-10-16";