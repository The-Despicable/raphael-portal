import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ExternalLink, Lock } from "lucide-react";
import { profile, projects, releaseReadiness } from "@/config/site";
import { ASSESSMENT, readinessScorecard } from "@/content/status";
import { canonicalChainLabel, archNodes } from "@/content/architecture";
import { researchPapers } from "@/content/research";
import {
  ApplicationChip,
  Card,
  Container,
  DatedSource,
  EvidenceTag,
  Eyebrow,
  Note,
  ProvenanceChip,
  Section,
  SectionHeader,
  StatusBadge,
  ToneChip,
} from "@/components/ui/primitives";
import { AmbientGlow, HeroItem, HeroStagger, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ProjectCard } from "@/components/home/ProjectCard";
import { SummaryBar } from "@/components/status/SummaryBar";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Portfolio and project overview for an independent documentation portal covering the Raphael AI security research project.",
};

export default function HomePage() {
  // Prefer explicitly-featured entries, then fill the row from the strongest
  // documented provenance so a 3-column grid is not left with one card.
  const featured = [
    ...researchPapers.filter((p) => p.featured),
    ...researchPapers.filter((p) => !p.featured && p.provenance === "CITED_IN_RAPHAEL"),
    ...researchPapers.filter(
      (p) => !p.featured && p.provenance !== "CITED_IN_RAPHAEL" && p.provenance !== "RELATED",
    ),
  ].slice(0, 3);
  const topDimensions = readinessScorecard.slice(0, 5);

  return (
    <>
      {/* ================= HERO: two-column split ================= */}
      {/* NOTE: deliberately NOT `overflow-hidden` on this section.
          `overflow: hidden` (or `overflow-x: hidden`) turns the element into a
          scroll container, which silently disables `position: sticky` on every
          descendant — the profile column below would never stick. Decorative
          layers are clipped by their own inner wrapper instead. */}
      <section className="relative border-b border-hairline">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <AmbientGlow />
          <div className="absolute inset-0 bg-grid opacity-60" />
        </div>

        <Container>
          <div className="flex flex-col gap-10 py-14 lg:flex-row lg:items-stretch lg:gap-0 lg:py-20">
            {/* ---------- LEFT: profile ---------- */}
            {/* Sticky on desktop: the project column is much taller than the
                profile, so a non-sticky left column leaves a tall void beneath
                it. Sticking keeps the introduction in view while the reader
                scrolls the project list. */}
            <div className="flex flex-1 flex-col justify-start lg:sticky lg:top-[6rem] lg:self-start lg:pr-14">
              <HeroStagger>
                <HeroItem dir="left">
                  <Eyebrow>Research portfolio</Eyebrow>
                </HeroItem>
                <HeroItem dir="left">
                  <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-ink md:text-5xl">
                    Security research,
                    <br />
                    <span className="text-gradient-ink">governance, and evidence</span>
                  </h1>
                </HeroItem>
                <HeroItem dir="left">
                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-muted">
                    {profile.bio}
                  </p>
                </HeroItem>

                <HeroItem dir="left">
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {profile.focusAreas.map((area) => (
                      <li key={area}>
                        <ToneChip tone="slate">{area}</ToneChip>
                      </li>
                    ))}
                  </ul>
                </HeroItem>

                <HeroItem dir="left">
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                    {profile.githubProfileUrl ? (
                      <a
                        href={profile.githubProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-ink-muted transition-colors hover:text-ink"
                      >
                        GitHub <ExternalLink size={12} aria-hidden />
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 text-ink-faint"
                        title="No verified GitHub profile URL configured"
                      >
                        GitHub <Lock size={12} aria-hidden /> <span className="text-[11px]">not configured</span>
                      </span>
                    )}
                    {profile.contactUrl ? (
                      <a
                        href={profile.contactUrl}
                        className="text-ink-muted transition-colors hover:text-ink"
                      >
                        {profile.contactLabel}
                      </a>
                    ) : (
                      <span className="text-ink-faint">{profile.contactLabel} · not configured</span>
                    )}
                  </div>
                </HeroItem>

                <HeroItem dir="left">
                  <p className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-dim">
                    <span aria-hidden className="size-1.5 rounded-full bg-cyan" />
                    <span className="font-medium text-ink-muted">Current focus</span>
                    <span>{profile.currentFocus}</span>
                  </p>
                </HeroItem>

                <HeroItem dir="left">
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      href="/raphael"
                      className="btn-glow group inline-flex items-center gap-2 rounded-md border border-cyan/40 bg-cyan/10 px-5 py-2.5 text-[14px] font-medium text-cyan"
                    >
                      Explore Raphael
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                    <a
                      href="#projects"
                      className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                    >
                      View projects
                    </a>
                  </div>
                </HeroItem>
              </HeroStagger>
            </div>

            {/* ---------- divider ---------- */}
            <div aria-hidden className="relative hidden lg:block lg:w-px lg:shrink-0">
              <div className="absolute inset-y-6 left-0 w-px bg-gradient-to-b from-transparent via-cyan/25 to-transparent" />
            </div>

            {/* ---------- RIGHT: projects ---------- */}
            <div id="projects" className="flex flex-1 flex-col justify-start lg:pl-14">
              <HeroStagger>
                <HeroItem dir="right">
                  <div className="flex items-center justify-between gap-4">
                    <Eyebrow>Selected projects</Eyebrow>
                    <span className="text-[11px] text-ink-faint">config-driven</span>
                  </div>
                </HeroItem>

                <div className="mt-5 space-y-4">
                  {projects.map((project, i) => (
                    <HeroItem key={project.id} dir="right">
                      <ProjectCard project={project} featured={project.role === "primary"} staggerIndex={i} />
                    </HeroItem>
                  ))}
                </div>

                <HeroItem dir="right">
                  <p className="mt-4 text-[11.5px] leading-relaxed text-ink-faint">
                    Repository counts, star counts and download figures are deliberately omitted. No
                    live GitHub statistics are fabricated anywhere on this site.
                  </p>
                </HeroItem>
              </HeroStagger>
            </div>
          </div>
        </Container>
      </section>

      {/* ================= INTRO ================= */}
      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <Reveal>
              <SectionHeader
                eyebrow="What this project is"
                title="An ambitious architecture for governed autonomous security research."
                lede="Raphael was designed as a research-grade autonomous security platform: a canonical cognitive runtime behind a strict authorization spine, with every effect routed through a deny-by-default policy decision point and every result captured as graded evidence."
              />
              <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                It is also <span className="text-ink">incomplete</span>. An independent assessment dated{" "}
                {ASSESSMENT.date} found the central research claim unverifiable, governance blocked with
                no authority able to unblock it, and a legacy execution plane that is not fully
                mediated. This portal exists so that can be examined rather than smoothed over.
              </p>
              <Link
                href="/raphael"
                className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
              >
                Read the architecture <ArrowRight size={14} aria-hidden />
              </Link>
            </Reveal>

            <Reveal dir="right">
              <Card className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <Eyebrow>Release readiness</Eyebrow>
                  <EvidenceTag label="VERIFIED" />
                </div>
                <ul className="space-y-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                  {releaseReadiness.outstanding.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-conditional" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Note tone="caution">
                  Because release review has not passed, no source link, archive or clone affordance
                  is published on this site.
                </Note>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* ================= ARCHITECTURE PREVIEW ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section>
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Documented architecture"
                title="The canonical chain, as documented"
                lede={canonicalChainLabel}
              />
            </Reveal>

            <Stagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {archNodes.map((node) => (
                <StaggerItem key={node.id}>
                  <div className="surface h-full p-4">
                    <p className="font-mono text-[12px] text-cyan">{node.label}</p>
                    <p className="mt-2 text-[12px] leading-snug text-ink-dim">
                      {node.shortDescription}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal>
              <p className="mt-6 text-[13px] leading-relaxed text-ink-dim">
                A diagram shows intended structure. It is not evidence of runtime conformance, and
                the sharpest gap on this site is inside this very chain: the execution boundary is
                documented as the sole owner of system primitives, but that holds only within the
                canonical import closure.
              </p>
              <Link
                href="/raphael#architecture"
                className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
              >
                Open the interactive diagram <ArrowRight size={14} aria-hidden />
              </Link>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ================= RESEARCH PREVIEW ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Research"
              title="Research behind the architecture"
              lede="Trace technical ideas from published research to design decisions, implementation evidence, and open questions. Provenance is shown on every card — including when the answer is 'not established'."
              action={
                <Link
                  href="/research"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
                >
                  View the research library <ArrowRight size={14} aria-hidden />
                </Link>
              }
            />
          </Reveal>

          <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
            {featured.map((paper) => (
              <StaggerItem key={paper.id}>
                <Card interactive className="flex h-full flex-col gap-3">
                  <ProvenanceChip provenance={paper.provenance} />
                  <h3 className="text-[15px] font-semibold leading-snug text-ink">{paper.title}</h3>
                  <p className="text-[12.5px] text-ink-faint">
                    {paper.year ?? "Year not recorded"} · {paper.venue ?? "Venue not recorded"}
                  </p>
                  <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">
                    {paper.researchQuestion}
                  </p>
                  <ApplicationChip status={paper.applicationStatus} />
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal>
            <div className="mt-8">
              <Note tone="caution">
                The accessible project records name exactly <span className="text-ink">one</span>{" "}
                external publication. The historical bibliography could not be established — so this
                library is honest about its own gap rather than padded with plausible citations.
              </Note>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ================= PROJECT HEALTH ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section>
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Project health"
                title="An honest status snapshot"
                lede="A dated assessment, not live telemetry. Nothing here refreshes on its own, and no finding should be read as permanently current."
              />
            </Reveal>

            <Reveal>
              <SummaryBar />
            </Reveal>

            <Stagger className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {topDimensions.map((d) => (
                <StaggerItem key={d.dimension}>
                  <Card className="h-full p-4">
                    <p className="text-[12.5px] font-medium leading-snug text-ink-muted">
                      {d.dimension}
                    </p>
                    <div className="mt-3">
                      <StatusBadge status={d.status} />
                    </div>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <DatedSource>
                  Overall readiness <span className="text-ink-dim">{ASSESSMENT.overallReadiness}</span>,
                  gate disposition{" "}
                  <span className="text-ink-dim">{ASSESSMENT.gateDisposition}</span>.
                </DatedSource>
                <Link
                  href="/status"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
                >
                  See every blocker <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ================= CTA ================= */}
      <Section>
        <Container>
          <Reveal>
            <div className="surface relative overflow-hidden p-10 text-center md:p-14">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(50% 60% at 50% 0%, rgba(34,211,238,0.09), transparent 70%)",
                }}
              />
              <div className="relative flex flex-col items-center gap-4">
                <Eyebrow>Contribute</Eyebrow>
                <h2 className="max-w-2xl text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  Challenge the assumptions. Cite your sources. Help make the record honest.
                </h2>
                <p className="max-w-xl text-[15px] leading-relaxed text-ink-muted">
                  This project has more unverified claims than verified ones. Reviewing the evidence,
                  checking a citation, or reporting an error is genuinely useful here.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Link
                    href="/community"
                    className="btn-glow inline-flex items-center gap-2 rounded-md border border-cyan/40 bg-cyan/10 px-5 py-2.5 text-[14px] font-medium text-cyan"
                  >
                    Join the community
                    <ArrowRight size={14} aria-hidden />
                  </Link>
                  <Link
                    href="/research#suggest"
                    className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
                  >
                    Suggest a paper
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}