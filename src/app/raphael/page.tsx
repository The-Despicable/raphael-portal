import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import {
  archEdges,
  archNodes,
  canonicalChainLabel,
  designPrinciples,
  legacyPerimeter,
  proposedArchitecture,
  verificationPrinciple,
} from "@/content/architecture";
import { ASSESSMENT } from "@/content/status";
import { researchPapers } from "@/content/research";
import { releaseReadiness } from "@/config/site";
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
  ToneChip,
} from "@/components/ui/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ArchitectureDiagram } from "@/components/arch/ArchitectureDiagram";

export const metadata: Metadata = {
  title: "Raphael",
  description:
    "What Raphael is designed to achieve, its documented architecture, the proposed target architecture, and the gap between design intent and verified implementation.",
};

export default function RaphaelPage() {
  const relatedResearch = researchPapers
    .filter((p) => p.components.some((c) => c !== "AGENT_SELF_IMPROVEMENT"))
    .slice(0, 4);

  return (
    <>
      {/* ================= 1. INTRODUCTION ================= */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(55% 55% at 30% 0%, rgba(34,211,238,0.10), transparent 70%)",
          }}
        />
        <Container>
          <div className="py-16 md:py-24">
            <Reveal>
              <Eyebrow>Project introduction</Eyebrow>
              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                An ambitious architecture for governed autonomous security research.
              </h1>
              <p className="mt-6 max-w-3xl text-[16px] leading-relaxed text-ink-muted">
                Raphael was designed as a research-grade autonomous security platform: a canonical
                cognitive runtime behind a strict authorization spine, with every effect routed through
                a deny-by-default policy decision point and every result captured as graded evidence.
              </p>
            </Reveal>

            <Reveal>
              <div className="mt-8 grid gap-5 md:grid-cols-3">
                {[
                  {
                    title: "What it was built to investigate",
                    body: "Whether an explicit cognitive architecture measurably outperforms simply prompting a model — measured under a declared, frozen evaluation protocol rather than asserted.",
                  },
                  {
                    title: "How it is structured",
                    body: "A fixed-stage runtime, a broker that authorizes but never executes, a separate enforcement point, a single-owner execution boundary, and an evidence graph that grades its own outputs.",
                  },
                  {
                    title: "Why this page is careful",
                    body: "The project is incomplete, and important architectural and evaluation claims remain unresolved. The aim is to invite technical examination, not to advertise production readiness.",
                  },
                ].map((item) => (
                  <Card key={item.title} className="h-full">
                    <h2 className="text-[14px] font-semibold text-ink">{item.title}</h2>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">{item.body}</p>
                  </Card>
                ))}
              </div>
            </Reveal>

            <Reveal>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Note tone="caution" className="max-w-2xl flex-1">
                  <span className="font-medium text-ink">Repository availability.</span>{" "}
                  {releaseReadiness.reason}
                </Note>
                <Link
                  href="/status"
                  className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
                >
                  Read the current-state report <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================= 2. ARCHITECTURE OVERVIEW ================= */}
      <Section id="architecture">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Architecture overview"
              title="The documented canonical chain"
              lede={canonicalChainLabel}
            />
          </Reveal>

          <Reveal>
            <div className="mt-8">
              <ArchitectureDiagram nodes={archNodes} edges={archEdges} />
            </div>
          </Reveal>

          <Reveal>
            <Note tone="caution" className="mt-8">
              A diagram proves that a structure is <em>described</em>. It cannot prove that the
              structure is <em>conformed to at runtime</em>. Every node below keeps those two
              questions apart, and the distinction is not decorative — the sharpest gap on this site
              sits inside this chain.
            </Note>
          </Reveal>
        </Container>
      </Section>

      {/* ================= 3. DESIGN PRINCIPLES ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section>
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Design principles"
                title="Four questions, kept separate on purpose"
                lede="For each principle: is it an accepted design decision, is it present in the implementation, has it been independently verified, and what global claim remains unproven? Conflating any two of these is how a research project talks itself into believing its own diagram."
              />
            </Reveal>

            <Stagger className="mt-10 grid gap-5 lg:grid-cols-2">
              {designPrinciples.map((p) => (
                <StaggerItem key={p.id}>
                  <Card className="flex h-full flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-semibold text-ink">{p.title}</h3>
                      <span className="font-mono text-[11px] text-ink-faint">{p.id}</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-ink-muted">{p.summary}</p>

                    <dl className="mt-1 space-y-3 border-t border-hairline pt-4 text-[13px] leading-relaxed">
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-cyan">
                          Accepted decision
                        </dt>
                        <dd className="mt-1 text-ink-muted">{p.acceptedDecision}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-azure">
                          Implementation presence
                        </dt>
                        <dd className="mt-1 text-ink-muted">{p.implementationPresence}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                          Independently verified
                        </dt>
                        <dd className="mt-1 text-ink-muted">{p.independentlyVerified}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] uppercase tracking-[0.1em] text-conditional">
                          Unverified claim
                        </dt>
                        <dd className="mt-1 text-ink-muted">{p.unverifiedClaim}</dd>
                      </div>
                    </dl>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </Section>
      </section>

      {/* ================= 4. PROPOSED / INTENDED ================= */}
      <Section id="proposed">
        <Container>
          <Reveal>
            <div className="flex items-start gap-3 rounded-lg border border-violet/25 bg-violet/[0.04] p-5">
              <Layers size={16} className="mt-0.5 shrink-0 text-violet" aria-hidden />
              <div>
                <h2 className="text-[15px] font-semibold text-ink">{proposedArchitecture.label}</h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  {proposedArchitecture.caveat}
                </p>
              </div>
            </div>
          </Reveal>

          <div className="mt-8 grid gap-8 lg:grid-cols-3 lg:gap-10">
            <Reveal className="lg:col-span-1">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                1 · Documented architecture
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                What the records say the system is intended to do — the chain above, the accepted
                decisions, the stated invariants.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
                This is the strongest claim the site can make about the architecture.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-1">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                2 · Observed implementation
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                Components found in the assessed repository. The canonical chain is statically
                present. The legacy execution plane is also present, and only partly mediated.
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
                Presence was verified. Behaviour was not, because no test was executed.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-1">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-violet">
                3 · Hypothetical / proposed
              </h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                {proposedArchitecture.relationship}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
                Nothing in this column should be read as existing in the assessed codebase.
              </p>
            </Reveal>
          </div>

          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            <StaggerItem>
              <Card className="h-full">
                <h3 className="text-[14px] font-semibold text-ink">Desired end state</h3>
                <ul className="mt-3 space-y-2.5">
                  {proposedArchitecture.goals.map((goal) => (
                    <li key={goal} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-violet" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="h-full border-blocked/20">
                <h3 className="text-[14px] font-semibold text-ink">Not implemented</h3>
                <ul className="mt-3 space-y-2.5">
                  {proposedArchitecture.unimplemented.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-blocked/70" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          </Stagger>
        </Container>
      </Section>

      {/* ================= 5. LEGACY PERIMETER ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="legacy">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Unresolved boundaries"
                title={legacyPerimeter.title}
                lede={legacyPerimeter.intro}
              />
            </Reveal>

            <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
              {legacyPerimeter.questions.map((q) => (
                <StaggerItem key={q.id}>
                  <Card className="h-full">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[14.5px] font-semibold text-ink">{q.title}</h3>
                      <EvidenceTag label={q.label as "UNKNOWN" | "CONTRADICTED" | "DOCUMENTED"} />
                    </div>
                    <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{q.body}</p>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal>
              <Note tone="caution" className="mt-8">
                These are recorded as verification questions, not as confirmed vulnerabilities. The
                source does not establish them as exploitable, and this site does not add detail that
                would help anyone try.
              </Note>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ================= verification principle ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="The most transferable idea"
              title="A verification mechanism is never self-certifying"
            />
          </Reveal>
          <Reveal>
            <blockquote className="mt-8 border-l-2 border-cyan/50 pl-5">
              <p className="text-[16px] leading-relaxed text-ink">{verificationPrinciple.statement}</p>
              <footer className="mt-3 text-[13px] text-ink-faint">
                Corollary: {verificationPrinciple.corollary}
              </footer>
            </blockquote>
          </Reveal>

          <Reveal>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <Card>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                  How the regress resolves
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
                  {verificationPrinciple.resolution}
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
                  {verificationPrinciple.framing}
                </p>
              </Card>
              <Card>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                  The claim ladder
                </h3>
                <ol className="mt-3 space-y-2.5">
                  {verificationPrinciple.claimLadder.map((l) => (
                    <li key={l.level} className="flex gap-3 text-[13px] leading-relaxed">
                      <span className="shrink-0 font-mono text-[11.5px] text-cyan">{l.level}</span>
                      <span>
                        <span className="text-ink">{l.label}</span>
                        <span className="block text-ink-dim">{l.note}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </div>
          </Reveal>
        </Container>
      </Section>

      {/* ================= 6. RESEARCH PREVIEW ================= */}
      <section className="border-t border-hairline bg-abyss/50">
        <Section id="research-preview">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Research connection"
                title="Research behind the architecture"
                lede="Each card records both the claimed relevance and the provenance of that claim, so a reader can tell a documented relationship from a thematic resemblance."
                action={
                  <Link
                    href="/research"
                    className="inline-flex items-center gap-2 text-[14px] font-medium text-cyan transition-opacity hover:opacity-80"
                  >
                    Open the research library <ArrowRight size={14} aria-hidden />
                  </Link>
                }
              />
            </Reveal>

            <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
              {relatedResearch.map((paper) => (
                <StaggerItem key={paper.id}>
                  <Card interactive className="h-full space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ProvenanceChip provenance={paper.provenance} />
                      <ToneChip tone="slate">{paper.publicationStatus.replaceAll("_", " ")}</ToneChip>
                    </div>
                    <h3 className="text-[15px] font-semibold leading-snug text-ink">{paper.title}</h3>
                    <p className="text-[13px] leading-relaxed text-ink-muted">{paper.whereApplied}</p>
                    <ApplicationChip status={paper.applicationStatus} />
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal>
              <p className="mt-8">
                <DatedSource>
                  Architecture and assessment content transcribed from the {ASSESSMENT.date} assessment
                  and cited project records. Local paths, remote names, hashes and operational detail
                  were deliberately excluded.
                </DatedSource>
              </p>
            </Reveal>
          </Container>
        </Section>
      </section>
    </>
  );
}