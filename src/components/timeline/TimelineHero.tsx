import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/primitives";
import { eras, lineageDisclaimer, overallStatus } from "@/content/raphael-timeline";

const ACCENT_TEXT: Record<string, string> = {
  azure: "text-azure",
  cyan: "text-cyan",
  violet: "text-violet",
  amber: "text-conditional",
  blocked: "text-blocked",
};

/**
 * Compact page introduction.
 *
 * Deliberately short: the chronology is the point of this page, so the header
 * spends its vertical budget on the lineage strip and the current-status tiles
 * rather than on a full-height hero.
 */
export function TimelineHero() {
  return (
    <section className="relative overflow-hidden border-b border-hairline">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(55% 55% at 22% 0%, rgba(34,211,238,0.10), transparent 70%)",
        }}
      />
      <Container>
        <div className="py-12 md:py-14">
          <Link
            href="/raphael"
            className="inline-flex items-center gap-2 text-[13px] text-ink-dim transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
          >
            <ArrowLeft size={13} aria-hidden />
            Back to Raphael
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
                RAPHAEL / PROJECT HISTORY
              </span>
              <h1 className="mt-2.5 max-w-2xl text-3xl font-bold leading-[1.12] tracking-tight text-ink md:text-[40px]">
                The Evolution of RAPHAEL
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                From the original Ultimate Skill vision to a unified, governed
                runtime — and the evidence that defines its current state.
              </p>
            </div>

            {/* The single most important value on the page, stated first and
                in words, never as colour alone. */}
            <div className="w-fit shrink-0 rounded-lg border border-blocked/30 bg-blocked/[0.05] px-4 py-3">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-dim">
                Overall readiness
              </span>
              <span className="mt-1 block font-mono text-[15px] font-semibold text-blocked">
                {overallStatus}
              </span>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-[13.5px] leading-relaxed text-ink-faint">
            This page documents both the architectural progress and the
            limitations discovered along the way. It is a documentation surface:
            the portal&rsquo;s build and tests say nothing about whether
            Raphael&rsquo;s own gates have been accepted.
          </p>

          {/* At-a-glance lineage. Vertical below `lg`, horizontal at `lg` and
              above.
              The breakpoint is deliberately `lg` rather than `md`: at 768-1023px
              nine horizontal nodes leave roughly 85px each, which truncated
              the era names and the dates. Below `lg` the vertical list has room
              to show both in full. Same data, same order, either way. */}
          <ol className="relative mt-7 flex flex-col gap-0 lg:flex-row lg:flex-wrap lg:items-stretch lg:gap-x-1.5 lg:gap-y-3">
            {/* Vertical connector behind the mobile dots, so the mobile list
                reads as a lineage rather than as nine unrelated rows. */}
            <span
              aria-hidden
              className="absolute bottom-6 left-[3px] top-6 w-px bg-gradient-to-b from-hairline-strong via-hairline-strong to-transparent lg:hidden"
            />
            {eras.map((era, i) => (
              <li
                key={era.id}
                className="flex min-w-0 items-center gap-3 lg:flex-1 lg:flex-col lg:items-stretch lg:gap-2"
              >
                <div className="flex w-full items-center gap-3 lg:block">
                  <span
                    className={`hidden font-mono text-[10px] lg:block ${ACCENT_TEXT[era.accent]}`}
                  >
                    {String(era.order).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden
                    className={`relative mt-0 size-2 shrink-0 rounded-full border lg:hidden ${
                      era.undated
                        ? "border-dashed border-azure/70 bg-abyss"
                        : era.accent === "blocked"
                          ? "border-blocked bg-blocked"
                          : era.accent === "violet"
                            ? "border-violet bg-violet/70"
                            : "border-cyan bg-cyan/70"
                    }`}
                  />
                  <span className="min-w-0 flex-1 rounded-md border border-hairline bg-surface/70 px-2.5 py-2 lg:flex lg:flex-col lg:gap-1 lg:text-center">
                    <span
                      className={`block truncate text-[12px] font-semibold lg:text-[12.5px] ${
                        era.accent === "blocked" ? "text-blocked" : "text-ink"
                      }`}
                    >
                      {era.shortLabel}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.06em] text-ink-faint lg:mt-1">
                      {era.undated ? "undated" : era.shortDate}
                    </span>
                  </span>
                </div>
                {i < eras.length - 1 ? (
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 self-center bg-hairline lg:block"
                  />
                ) : null}
              </li>
            ))}
          </ol>

          <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">
            {lineageDisclaimer}
          </p>
        </div>
      </Container>
    </section>
  );
}
