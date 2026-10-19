import Link from "next/link";
import { eras } from "@/content/raphael-timeline";

const ACCENT_TEXT: Record<string, string> = {
  azure: "text-azure",
  cyan: "text-cyan",
  violet: "text-violet",
  amber: "text-conditional",
  blocked: "text-blocked",
};

const JUMPS = [
  { href: "#gate-history", label: "Gates G0–G10" },
  { href: "#docker-era", label: "Docker era" },
  { href: "#evaluation-integrity", label: "Evaluation integrity" },
  { href: "#appendices", label: "Appendices" },
  { href: "#sources", label: "Sources" },
];

/**
 * Chronology navigation.
 *
 * Every entry is a real in-page anchor pointing at a real milestone element,
 * so the control scrolls to real content rather than only updating a
 * selection. The mobile layout is a horizontally scrollable row of era chips;
 * the desktop layout is a sticky rail.
 */
export function ChronologyRail() {
  return (
    <nav aria-label="Timeline chronology" className="lg:sticky lg:top-6">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
        Chronology
      </h2>
      <ol className="mt-3 flex gap-1.5 overflow-x-auto pb-2 scroll-thin lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
        {eras.map((era) => (
          <li key={era.id} className="shrink-0 lg:shrink">
            <Link
              href={`#era-${era.id}`}
              className="group flex items-baseline gap-2 whitespace-nowrap rounded-md border border-transparent px-2 py-1.5 transition-colors duration-200 hover:border-hairline hover:bg-elevated/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan lg:whitespace-normal lg:border-l-2 lg:border-l-transparent lg:px-2.5"
            >
              <span
                className={`font-mono text-[10.5px] ${ACCENT_TEXT[era.accent]}`}
              >
                {String(era.order).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium leading-snug text-ink">
                  {era.title}
                </span>
                <span className="mt-0.5 block font-mono text-[10.5px] text-ink-faint">
                  {era.dateLabel}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <h2 className="mt-6 hidden text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim lg:block">
        Reference
      </h2>
      <ul className="mt-3 hidden flex-col gap-1 lg:flex">
        {JUMPS.map((jump) => (
          <li key={jump.href}>
            <Link
              href={jump.href}
              className="block rounded-md px-2.5 py-1.5 text-[12px] text-ink-muted transition-colors duration-200 hover:bg-elevated/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            >
              {jump.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
