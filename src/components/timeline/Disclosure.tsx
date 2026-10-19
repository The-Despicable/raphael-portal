"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Accessible disclosure.
 *
 * A real <button> with `aria-expanded` / `aria-controls`, so the open state is
 * announced rather than only visual. The panel is always present in the DOM
 * and hidden with `hidden`, which keeps content reachable by in-page find and
 * avoids the height animation that causes layout shift.
 */
export function Disclosure({
  summary,
  meta,
  children,
  defaultOpen = false,
  accent = "default",
  headingLevel = 3,
  className = "",
}: {
  summary: ReactNode;
  /** Optional compact metadata row rendered under the summary. */
  meta?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  accent?: "default" | "cyan" | "violet" | "blocked";
  headingLevel?: 3 | 4;
  /** Extra classes on the wrapper, used to tint a specific milestone card. */
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `disclosure-${id}`;
  const Heading = headingLevel === 3 ? "h3" : "h4";

  const accents = {
    default: "border-hairline bg-surface/60 hover:border-hairline-strong",
    cyan: "border-cyan/25 bg-cyan/[0.035] hover:border-cyan/40",
    violet: "border-violet/25 bg-violet/[0.035] hover:border-violet/40",
    blocked: "border-blocked/25 bg-blocked/[0.035] hover:border-blocked/40",
  } as const;

  return (
    <div
      className={`rounded-lg border transition-colors duration-200 ${accents[accent]} ${className}`}
    >
      <Heading className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-elevated/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold leading-snug text-ink">
              {summary}
            </span>
            {meta ? (
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">{meta}</span>
            ) : null}
          </span>
          <ChevronDown
            aria-hidden
            size={15}
            className={`mt-0.5 shrink-0 text-ink-dim transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </Heading>
      <div id={panelId} hidden={!open} className="border-t border-hairline px-4 py-4">
        {children}
      </div>
    </div>
  );
}
