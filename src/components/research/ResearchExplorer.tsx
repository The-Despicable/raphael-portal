"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import type { ApplicationStatus, ComponentKey, Provenance, ResearchPaper } from "@/lib/types";
import { componentLabels, provenanceMeta, researchMappings } from "@/content/research";
import {
  ApplicationChip,
  Card,
  EvidenceTag,
  ProvenanceChip,
  ToneChip,
} from "@/components/ui/primitives";

const COMPONENT_KEYS = Object.keys(componentLabels) as ComponentKey[];

const SORTS = [
  { key: "title", label: "Title (A–Z)" },
  { key: "year-desc", label: "Year (newest)" },
  { key: "provenance", label: "Provenance" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

/**
 * Research explorer.
 *
 * Filtering and search run entirely in the browser against a corpus that is
 * small and fully client-visible — there is nothing to fetch, so there is no
 * loading state to fake and no index that could disagree with the rendered page.
 */
export function ResearchExplorer({ papers }: { papers: readonly ResearchPaper[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("ALL");
  const [sort, setSort] = useState<SortKey>("title");
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo<Provenance[]>(() => {
    // Preserve declaration order and show the friendly label, never the raw
    // enum key. "Cited in Raphael" reads as a claim; "CITED_IN_RAPHAEL" does not.
    const seen = new Set<Provenance>();
    for (const p of papers) seen.add(p.provenance);
    return [...seen];
  }, [papers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = papers.filter((p) => {
      if (category !== "ALL" && p.provenance !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.authors ?? "").toLowerCase().includes(q) ||
        p.researchQuestion.toLowerCase().includes(q) ||
        p.keyFinding.toLowerCase().includes(q) ||
        p.themes.some((t) => t.toLowerCase().includes(q)) ||
        (p.arxivId ?? "").toLowerCase().includes(q)
      );
    });

    out = [...out].sort((a, b) => {
      if (sort === "year-desc") return (b.year ?? 0) - (a.year ?? 0);
      if (sort === "provenance") return a.provenance.localeCompare(b.provenance);
      return a.title.localeCompare(b.title);
    });

    return out;
  }, [papers, query, category, sort]);

  return (
    <div className="space-y-8">
      {/* ---------------- controls ---------------- */}
      <div className="surface flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
            />
            <label htmlFor="research-search" className="sr-only">
              Search papers by title, author, theme or identifier
            </label>
            <input
              id="research-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, author, theme, arXiv ID…"
              className="w-full rounded-md border border-hairline bg-abyss py-2.5 pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-faint focus:border-cyan/50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="research-sort" className="text-[12px] text-ink-dim">
              Sort
            </label>
            <select
              id="research-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-md border border-hairline bg-abyss px-2.5 py-2 text-[13px] text-ink focus:border-cyan/50 focus:outline-none"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by provenance">
          <button
            type="button"
            onClick={() => setCategory("ALL")}
            aria-pressed={category === "ALL"}
            className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
              category === "ALL"
                ? "border-cyan/45 bg-cyan/10 text-cyan"
                : "border-hairline text-ink-dim hover:text-ink"
            }`}
          >
            All ({papers.length})
          </button>
          {categories.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              aria-pressed={category === key}
              title={provenanceMeta[key].meaning}
              className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                category === key
                  ? "border-cyan/45 bg-cyan/10 text-cyan"
                  : "border-hairline text-ink-dim hover:text-ink"
              }`}
            >
              {provenanceMeta[key].label} ({papers.filter((p) => p.provenance === key).length})
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- results ---------------- */}
      {filtered.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-ink">No entries match that search.</p>
          <p className="max-w-md text-[13px] leading-relaxed text-ink-muted">
            This library is genuinely small because the accessible project records name only one
            external publication. An empty result is usually a gap in the record, not an absence of
            relevant work — which is exactly what the{" "}
            <a href="#suggest" className="text-cyan underline underline-offset-4">
              suggest-a-paper
            </a>{" "}
            form is for.
          </p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {filtered.map((paper) => {
            const mappings = researchMappings.filter((m) => m.paperId === paper.id);
            const isOpen = expanded === paper.id;

            return (
              <li key={paper.id}>
                <Card interactive className="flex h-full flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ProvenanceChip provenance={paper.provenance} />
                    <ToneChip tone="slate">{paper.publicationStatus.replaceAll("_", " ")}</ToneChip>
                    {paper.reviewStatus === "AWAITING_REVIEW" ? (
                      <ToneChip tone="amber">awaiting review</ToneChip>
                    ) : null}
                  </div>

                  <h3 className="text-[15.5px] font-semibold leading-snug text-ink">{paper.title}</h3>

                  <p className="text-[12px] text-ink-faint">
                    {paper.authors ?? "Authors not recorded"} · {paper.year ?? "Year not recorded"} ·{" "}
                    {paper.venue ?? "Venue not recorded"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                    {paper.arxivId ? (
                      <span className="font-mono text-cyan">arXiv:{paper.arxivId}</span>
                    ) : null}
                    {paper.doi ? <span className="font-mono text-cyan">doi:{paper.doi}</span> : null}
                    {!paper.arxivId && !paper.doi ? (
                      <span className="text-ink-faint">no stable identifier recorded</span>
                    ) : null}
                  </div>

                  <dl className="space-y-3 text-[13px] leading-relaxed">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                        Research question
                      </dt>
                      <dd className="mt-1 text-ink-muted">{paper.researchQuestion}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                        Key finding / method
                      </dt>
                      <dd className="mt-1 text-ink-muted">{paper.keyFinding}</dd>
                    </div>
                  </dl>

                  <div>
                    <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                      Component
                    </span>
                    <ul className="mt-1.5 flex flex-wrap gap-1.5">
                      {paper.components.map((c) => (
                        <li key={c}>
                          <ToneChip tone="slate">{componentLabels[c]}</ToneChip>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-md border border-hairline bg-abyss/50 p-3">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                      Where was this applied?
                    </span>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                      {paper.whereApplied}
                    </p>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <ApplicationChip status={paper.applicationStatus} />
                    {paper.officialUrl ? (
                      <a
                        href={paper.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow ugc"
                        className="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-[11.5px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                      >
                        Read paper
                        <ExternalLink size={11} aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="rounded-full border border-dashed border-hairline px-3 py-1.5 text-[11.5px] text-ink-faint">
                        No official link recorded
                      </span>
                    )}
                    {mappings.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : paper.id)}
                        aria-expanded={isOpen}
                        className="rounded-full border border-hairline px-3 py-1.5 text-[11.5px] text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                      >
                        {isOpen ? "Hide mapping" : "View application mapping"}
                      </button>
                    ) : null}
                  </div>

                  {paper.lastVerified ? (
                    <p className="text-[11px] text-ink-faint">Last verified {paper.lastVerified}</p>
                  ) : null}

                  {isOpen ? (
                    <ul className="space-y-3 border-t border-hairline pt-4">
                      {mappings.map((m) => (
                        <li key={`${paper.id}-${m.component}`} className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11.5px] text-cyan">
                              {componentLabels[m.component]}
                            </span>
                            <ApplicationStatusChip status={m.status} />
                          </div>
                          <p className="text-[12.5px] leading-relaxed text-ink-muted">
                            {m.whereApplied}
                          </p>
                          <p className="text-[11.5px] leading-relaxed text-ink-faint">
                            Evidence: {m.evidence}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------------- mapping matrix ---------------- */}
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">
          Research-to-implementation matrix
        </h3>
        <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-muted">
          Every row is either an internal project record with a named artifact, or an entry whose
          application status is explicitly not established. No row claims an external paper was
          implemented, because the accessible records do not support such a claim.
        </p>

        <div className="mt-5 overflow-x-auto rounded-lg border border-hairline">
          {/* min-w only from md up, so the mobile stacked-card layout is not
              forced into a 820px scroll region on a phone. */}
          <table className="table-stack w-full border-collapse text-left text-[13px] md:min-w-[820px]">
            <thead>
              <tr className="border-b border-hairline bg-abyss/60">
                {["Paper", "Core idea", "Component", "Where applied", "Evidence", "Status"].map((h) => (
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
              {researchMappings.map((m) => {
                const paper = papers.find((p) => p.id === m.paperId);
                return (
                  <tr key={`${m.paperId}-${m.component}`} className="border-b border-hairline last:border-0">
                    <td data-label="Paper" className="px-4 py-3 text-ink">
                      {paper?.title ?? m.paperId}
                    </td>
                    <td data-label="Core idea" className="px-4 py-3 text-ink-muted">
                      {m.coreIdea}
                    </td>
                    <td data-label="Component" className="px-4 py-3 text-ink-muted">
                      <span className="font-mono text-[11.5px] text-cyan">
                        {componentLabels[m.component]}
                      </span>
                    </td>
                    <td data-label="Where applied" className="px-4 py-3 text-ink-muted">
                      {m.whereApplied}
                    </td>
                    <td data-label="Evidence" className="px-4 py-3 text-ink-dim">
                      {m.evidence}
                    </td>
                    <td data-label="Status" className="px-4 py-3">
                      <ApplicationStatusChip status={m.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- component legend ---------------- */}
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-ink">Component index</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {COMPONENT_KEYS.map((key) => (
            <li key={key} className="flex items-center justify-between gap-3 rounded-md border border-hairline px-3 py-2">
              <span className="text-[12.5px] text-ink-muted">{componentLabels[key]}</span>
              <span className="font-mono text-[10.5px] text-ink-faint">{key}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ApplicationStatusChip({ status }: { status: ApplicationStatus }) {
  return <ApplicationChip status={status} />;
}

export { EvidenceTag };