"use client";

import { useState } from "react";
import {
  currentArchitecture,
  targetArchitecture,
  type ArchitectureDiagramModel,
} from "@/content/raphael-architecture";
import { ArchitectureExplorerDiagram } from "@/components/arch/ArchitectureExplorerDiagram";

/**
 * Two-view selector + diagram.
 *
 * WHY THIS IS A SEPARATE CLIENT COMPONENT
 * --------------------------------------
 * The page itself is a Server Component: it owns the metadata, the hero and
 * every static section. Only the view selection needs state, so only this file
 * is marked "use client". Putting `useState` in the page would force the whole
 * route into the client bundle, including the hero and every gate-status string.
 *
 * WHY THE DEFAULT VIEW IS THE DOCUMENTED ONE
 * ------------------------------------------
 * A reader who lands on this page and does nothing must be shown what the
 * project's records actually describe. Selecting the blueprint is an explicit
 * act, and the blueprint is labelled proposed-and-not-implemented wherever it
 * appears.
 */
type ViewKey = "current" | "target";

const OPTIONS: readonly { key: ViewKey; label: string; sub: string }[] = [
  { key: "current", label: "Existing architecture", sub: "Documented current state" },
  {
    key: "target",
    label: "Hypothetical target",
    sub: "Blueprint v4.2 · proposed, not implemented",
  },
];

function ViewSelector({
  active,
  onSelect,
}: {
  active: ViewKey;
  onSelect: (view: ViewKey) => void;
}) {
  return (
    <div role="tablist" aria-label="Choose an architecture view" className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => {
        const selected = option.key === active;
        return (
          <button
            key={option.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(option.key)}
            className={`rounded-lg border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan motion-reduce:transition-none ${
              option.key === "target"
                ? selected
                  ? "border-violet/60 bg-violet/[0.10]"
                  : "border-violet/25 bg-violet/[0.03] hover:border-violet/45"
                : selected
                  ? "border-cyan/60 bg-cyan/[0.08]"
                  : "border-hairline bg-elevated/50 hover:border-cyan/40"
            }`}
          >
            <span
              className={`block text-[13.5px] font-semibold ${
                option.key === "target" ? "text-violet" : "text-cyan"
              }`}
            >
              {option.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-ink-faint">
              {option.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function ArchitectureViewSwitcher() {
  const [view, setView] = useState<ViewKey>("current");
  const model: ArchitectureDiagramModel =
    view === "current" ? currentArchitecture : targetArchitecture;

  return (
    <>
      <ViewSelector active={view} onSelect={setView} />
      <div className="mt-6" id="architecture-diagram">
        <ArchitectureExplorerDiagram model={model} />
      </div>
    </>
  );
}
