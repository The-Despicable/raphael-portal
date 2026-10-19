import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import {
  architectureLastReviewed,
  architectureSources,
  liveProjectUrl,
} from "@/content/raphael-architecture";
import { Container, Note, Section, SectionHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/motion";
import { ArchitectureViewSwitcher } from "@/components/arch/ArchitectureViewSwitcher";
import {
  ArchitectureSourcesPanel,
  GateStatusStrip,
  GovernedImprovementLane,
  KnownGapsPanel,
  RoadmapStrip,
  TrustBoundariesPanel,
} from "@/components/arch/ArchitecturePanels";

export const metadata: Metadata = {
  title: "Raphael Architecture Explorer",
  description:
    "Two views of one project at two levels of maturity: a documented current snapshot of the recorded architecture, and the Blueprint v4.2 target that is proposed and not implemented.",
};

/**
 * This route is a Server Component. Only the two-view selector and the diagram
 * need client state, and both live in ArchitectureViewSwitcher, so the hero,
 * every gate status and every roadmap entry are rendered on the server and
 * never enter the client bundle.
 */
export default function ArchitectureExplorerPage() {
  return (
    <>
      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(55% 55% at 30% 0%, rgba(167,139,250,0.12), transparent 70%)",
          }}
        />
        <Container>
          <div className="py-16 md:py-20">
            <Reveal>
              <Link
                href="/raphael"
                className="inline-flex items-center gap-2 text-[13px] text-ink-dim transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
              >
                <ArrowLeft size={13} aria-hidden />
                Back to Raphael
              </Link>

              <span className="mt-6 block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
                Architecture explorer
              </span>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                Raphael Architecture Explorer
              </h1>
              <p className="mt-5 max-w-3xl text-[16px] leading-relaxed text-ink-muted">
                This page separates two things that are easy to confuse. The{" "}
                <strong className="font-medium text-ink">existing architecture</strong> is what the
                project&rsquo;s own records describe today, including where they are incomplete. The{" "}
                <strong className="font-medium text-violet">hypothetical target</strong> is the
                blueprint-defined destination if every prerequisite gate is passed. They are two views
                of one project at two levels of maturity — not two deployed systems.
              </p>
            </Reveal>

            {/* ============ 2. STATUS LINE ============ */}
            <Reveal>
              <div className="mt-10">
                <GateStatusStrip />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ============ 3 + 4. VIEW SELECTOR AND DIAGRAM ============ */}
      <Section id="views">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Two views"
              title="Documented snapshot, or blueprint target"
              lede="The page opens on the documented view. Selecting the target view is an explicit act, and the target view is labelled proposed and not implemented everywhere it appears."
            />
          </Reveal>

          <Reveal>
            <div className="mt-8">
              <ArchitectureViewSwitcher />
            </div>
          </Reveal>

          <Reveal>
            <Note tone="caution" className="mt-8">
              <span className="font-medium text-ink">A diagram proves that a structure is described.</span>{" "}
              It cannot prove that the structure is conformed to at runtime. Every component keeps its
              documented status, its invariant and its known limitation visible separately, and the
              evidence that would be required to demonstrate completion is named for each one.
            </Note>
          </Reveal>
        </Container>
      </Section>

      {/* ============ 5 + 6. TRUST BOUNDARIES ============ */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="trust-boundaries">
          <Container>
            <Reveal>
              <TrustBoundariesPanel />
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ============ 7. KNOWN GAPS ============ */}
      <Section id="known-gaps">
        <Container>
          <Reveal>
            <KnownGapsPanel />
          </Reveal>
        </Container>
      </Section>

      {/* ============ 8. GOVERNED IMPROVEMENT LANE ============ */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="improvement">
          <Container>
            <Reveal>
              <GovernedImprovementLane />
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ============ 9. ROADMAP ============ */}
      <Section id="roadmap">
        <Container>
          <Reveal>
            <RoadmapStrip />
          </Reveal>
        </Container>
      </Section>

      {/* ============ 10. SOURCES AND LIMITATIONS ============ */}
      <section className="border-t border-hairline bg-abyss/50">
        <Section id="sources">
          <Container>
            <Reveal>
              <ArchitectureSourcesPanel
                sources={architectureSources}
                lastReviewed={architectureLastReviewed}
              />
            </Reveal>

            <Reveal>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/raphael/timeline"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  See the evolution timeline
                  <ArrowRight size={14} aria-hidden />
                </Link>
                <a
                  href={liveProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  Open the live project
                  <ExternalLink size={13} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <Link
                  href="/status"
                  className="text-[14px] text-ink-muted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  Read the current-state report
                </Link>
              </div>
            </Reveal>
          </Container>
        </Section>
      </section>
    </>
  );
}
