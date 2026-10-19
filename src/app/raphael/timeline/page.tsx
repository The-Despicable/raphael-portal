import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import {
  closingStatement,
  eras,
  milestonesByEra,
} from "@/content/raphael-timeline";
import { liveProjectUrl } from "@/content/raphael-architecture";
import { Container, Note, Section, SectionHeader } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/motion";
import { TimelineHero } from "@/components/timeline/TimelineHero";
import { ChronologyRail } from "@/components/timeline/ChronologyRail";
import { TimelineExplorer } from "@/components/timeline/TimelineExplorer";
import { DockerHistory } from "@/components/timeline/DockerHistory";
import { GateHistory } from "@/components/timeline/GateHistory";
import { RuntimeFlow, StageSequence } from "@/components/timeline/RuntimeFlow";
import { RsiTarget } from "@/components/timeline/RsiTarget";
import { SourceRegister } from "@/components/timeline/SourceRegister";
import { AppendixSections } from "@/components/timeline/AppendixSections";
import {
  CurrentStatusPanel,
  DecisionChain,
  EvaluationClaimLedger,
} from "@/components/timeline/CurrentStatus";

export const metadata: Metadata = {
  title: "The Evolution of RAPHAEL",
  description:
    "RAPHAEL's lineage from the Ultimate Skill vision through Sword & Shield, Rebirth, the RAPHAEL 2 Docker era and the governed v4.x architecture — with the evidence, sources and unresolved blockers that define its current state.",
};

/**
 * Server Component.
 *
 * Only the interactive pieces are client components: the era filter and
 * disclosures inside the timeline, the service search, and the expandable
 * appendices. The hero, the chronology rail, the current-status panel, the
 * runtime diagram and the source register all render on the server, so the
 * core history is present in the initial HTML and readable with scripting
 * unavailable.
 */
export default function RaphaelTimelinePage() {
  return (
    <>
      <TimelineHero />

      {/* Status is stated near the top, not only at the end. */}
      <Section id="current-state">
        <Container>
          <Reveal>
            <CurrentStatusPanel />
          </Reveal>
        </Container>
      </Section>

      {/* Chronology + timeline in a two-column region on desktop. */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="timeline">
          <Container>
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
              <aside className="lg:w-[236px] lg:shrink-0">
                <Reveal dir="left">
                  <ChronologyRail />
                </Reveal>
              </aside>

              <div className="min-w-0 flex-1">
                <Reveal>
                  <SectionHeader
                    eyebrow="Chronology"
                    title="One lineage, from origin to present position"
                    lede="The project grew from a capability-focused idea into a large integrated platform, then into a tightly governed design. These are eras of one narrative, not parallel tracks and not a chain of drop-in upgrades. Select any entry to expand its recorded detail."
                  />
                </Reveal>
                <Reveal>
                  <div className="mt-8">
                    <TimelineExplorer eras={eras} milestonesByEra={milestonesByEra} />
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </Section>
      </section>

      {/* Historical Docker era */}
      <Section id="docker-era">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Historical Docker era"
              title="The 14/14 snapshot, and everything it does not establish"
              lede="The clearest preserved point at which the original Docker stack was described as fully up — recorded as a historical report, with its own service inventory, count discrepancies and evidentiary limits."
            />
          </Reveal>
          <Reveal>
            <div className="mt-8">
              <DockerHistory />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* v4 / v4.1 technical evolution */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="v4-architecture">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="v4 and v4.1"
                title="One runtime, one decision point, one enforcement boundary"
                lede="Why v4 differed from the earlier integrated architecture: the design moved from capability breadth to an explicit, inspectable control path. Each stage below records what the inspected implementation actually did, separately from what the target contract requires."
              />
            </Reveal>
            <Reveal>
              <div className="mt-8">
                <RuntimeFlow />
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-6">
                <Note tone="caution">
                  <span className="font-medium text-ink">
                    Fail-closed within the tested and declarative perimeter.
                  </span>{" "}
                  That is the strongest reading the evidence supports. A local
                  proxy or sandbox is a mechanism, not a source of authorization,
                  and audits identified an out-of-perimeter legacy execution
                  plane, so a universal “all execution is mediated” statement
                  would overstate what was demonstrated.
                </Note>
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-8">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.11em] text-ink-dim">
                  The fixed ten-stage sequence, stage by stage
                </h3>
                <div className="mt-4">
                  <StageSequence />
                </div>
              </div>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* Gate history */}
      <Section id="gate-history">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Gate history"
              title="G0 to G10 — what “done” was required to mean"
              lede="Roadmap execution itself became evidence-gated. Three gates were historically accepted in the handoff record, one is blocked, and the rest are not accepted. Later source work does not imply a gate was accepted."
            />
          </Reveal>
          <Reveal>
            <div className="mt-8">
              <GateHistory />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* v4.2 RSI target */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="v42-target">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="v4.2"
                title="Governed recursive improvement — a target, not a capability"
                lede="v4.2 adds a governed improvement substrate on top of the same canonical runtime. The source is explicit that structural recursion is not demonstrated effective improvement, and that the system must not claim a higher level until the admission tests pass."
              />
            </Reveal>
            <Reveal>
              <div className="mt-8">
                <RsiTarget />
              </div>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* Evaluation integrity */}
      <Section id="evaluation-integrity">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Evaluation integrity"
              title="Why the research claim is unresolved rather than answered"
              lede="The central thesis is an empirical question. It cannot be established by architectural elegance, test volume, the presence of a planner or a successful demo; it needs a valid instrument and comparable experimental arms."
            />
          </Reveal>
          <Reveal>
            <div className="mt-8 grid min-w-0 gap-5 lg:grid-cols-2">
              <EvaluationClaimLedger />
              <DecisionChain />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Present state, again, at the end of the chronology. */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="present-position">
          <Container>
            <Reveal>
              <CurrentStatusPanel variant="compact" />
            </Reveal>
            <Reveal>
              <blockquote className="mt-6 border-l-2 border-cyan/50 pl-4">
                <p className="max-w-[72ch] text-[14px] leading-relaxed text-ink">
                  {closingStatement}
                </p>
              </blockquote>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* Appendices */}
      <Section id="appendices">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Appendices"
              title="The evidentiary detail behind the chronology"
              lede="Evidence categories, the status verbs that are deliberately not interchangeable, the corrections that changed public claims, scoped historical test floors and the editorial rules applied to this page."
            />
          </Reveal>
          <Reveal>
            <div className="mt-8">
              <AppendixSections />
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* Sources */}
      <section className="border-t border-hairline bg-abyss/50">
        <Section id="sources">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Sources and provenance"
                title="What this timeline was built from"
                lede="Every dated claim on this page is transcribed from one of the records below."
              />
            </Reveal>
            <Reveal>
              <div className="mt-8">
                <SourceRegister />
              </div>
            </Reveal>
            <Reveal>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/raphael/architecture"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  Open the architecture explorer <ArrowRight size={14} aria-hidden />
                </Link>
                <a
                  href={liveProjectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-ink-muted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  Open the live project
                  <ExternalLink size={13} aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <Link
                  href="/raphael"
                  className="text-[14px] text-ink-muted underline-offset-4 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
                >
                  Back to the Raphael overview
                </Link>
              </div>
            </Reveal>
          </Container>
        </Section>
      </section>
    </>
  );
}
