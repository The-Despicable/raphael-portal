import type { Metadata } from "next";
import {
  bibliographyCompleteness,
  dreamRsiFeature,
  openResearchQuestions,
  researchPapers,
} from "@/content/research";
import {
  Card,
  Container,
  EvidenceTag,
  Eyebrow,
  Note,
  Section,
  SectionHeader,
  ToneChip,
} from "@/components/ui/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ResearchExplorer } from "@/components/research/ResearchExplorer";
import { SuggestPaperForm } from "@/components/research/SuggestPaperForm";

export const metadata: Metadata = {
  title: "Research Library",
  description:
    "Papers and internal research records related to Raphael, with provenance classification and an explicit research-to-implementation mapping.",
};

export default function ResearchPage() {
  return (
    <>
      {/* ================= 1. HEADER ================= */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(55% 55% at 70% 0%, rgba(167,139,250,0.09), transparent 70%)",
          }}
        />
        <Container>
          <div className="py-16 md:py-20">
            <Reveal>
              <Eyebrow>Research library</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                The research behind the architecture.
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
                Trace technical ideas from published research to design decisions, implementation
                evidence, open questions, and future experiments.
              </p>
            </Reveal>

            <Reveal>
              <div className="mt-8 max-w-3xl rounded-lg border border-conditional/30 bg-conditional/[0.05] p-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="chip border-conditional/40 bg-conditional/10 text-conditional">
                    bibliography {bibliographyCompleteness.status}
                  </span>
                  <span className="font-mono text-[12px] text-ink-dim">
                    {bibliographyCompleteness.verifiedExternalPublications} verified external
                    publication{researchPapers.length > 4 ? "" : ""}
                  </span>
                </div>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-muted">
                  {bibliographyCompleteness.statement}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
                  {bibliographyCompleteness.implication}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================= 2–4. EXPLORER ================= */}
      <Section>
        <Container>
          <ResearchExplorer papers={researchPapers} />
        </Container>
      </Section>

      {/* ================= 5. DREAM-RSI ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="dream-rsi">
          <Container>
            <Reveal>
              <div className="flex flex-wrap items-center gap-2.5">
                <ToneChip tone="slate">{dreamRsiFeature.treatment}</ToneChip>
                <EvidenceTag label="DOCUMENTED" />
              </div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-ink md:text-4xl">
                {dreamRsiFeature.headline}
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-muted">
                {dreamRsiFeature.honestyNote}
              </p>
            </Reveal>

<div className="mt-10 grid gap-6 lg:grid-cols-2">
              <Reveal>
                <Card className="h-full border-cyan/25">
                  <h3 className="text-[14px] font-semibold text-ink">
                    What the roadmap adopted
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {dreamRsiFeature.adoptedConcepts.map((c) => (
                      <li key={c} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-muted">
                        <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 rounded-md border border-hairline bg-abyss/60 p-3.5">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                      Explicitly not adopted
                    </span>
                    <ul className="mt-1.5 space-y-1">
                      {dreamRsiFeature.notAdopted.map((c) => (
                        <li key={c} className="text-[12.5px] leading-relaxed text-ink-dim">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </Reveal>

              <Reveal dir="right">
                <Card className="h-full border-violet/25">
                  <h3 className="text-[14px] font-semibold text-ink">
                    {dreamRsiFeature.structuralConcern.summary}
                  </h3>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-ink-muted">
                    {dreamRsiFeature.structuralConcern.detail}
                  </p>
                  <div className="mt-4 rounded-md border border-hairline bg-abyss/60 p-3.5">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                      Epistemic status
                    </span>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">
                      {dreamRsiFeature.structuralConcern.caveat}
                    </p>
                  </div>
                </Card>
              </Reveal>
            </div>

            <div className="mt-6">
              <Reveal>
                <Card className="h-full">
                  <h3 className="text-[14px] font-semibold text-ink">
                    Open directions
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {dreamRsiFeature.openDirections.map((d) => (
                      <li key={d} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                        <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-violet" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            </div>

            <Reveal>
              <Note tone="caution" className="mt-6">
                {dreamRsiFeature.note}
              </Note>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ================= 6. OPEN QUESTIONS ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Open research questions"
              title="Proposed questions, not established findings"
              lede="These are questions the project's own record raises. None of them has an answer, and presenting any of them as a conclusion would be the exact error this portal exists to avoid."
            />
          </Reveal>

          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            {openResearchQuestions.map((q) => (
              <StaggerItem key={q.id}>
                <Card className="h-full">
                  <span className="font-mono text-[11px] text-ink-faint">{q.id}</span>
                  <h3 className="mt-2 text-[14.5px] font-semibold leading-snug text-ink">
                    {q.question}
                  </h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">{q.rationale}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* ================= 7. SUGGEST A PAPER ================= */}
      <section id="suggest" className="border-t border-hairline bg-abyss/50">
        <Section>
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
              <Reveal>
                <SectionHeader
                  eyebrow="Contribute"
                  title="Suggest a paper"
                  lede="If the bibliography is incomplete, help close it. Suggestions are stored as AWAITING_REVIEW and are never merged into the verified bibliography automatically — a suggestion becomes a cited entry only after a reviewer checks it against the original publication."
                />
                <Note tone="caution" className="mt-6">
                  This matters more than it might seem. A portal that lets anonymous submissions
                  silently redefine what is &ldquo;documented&rdquo; would reproduce the exact
                  failure this project is about.
                </Note>
              </Reveal>

              <Reveal dir="right">
                <SuggestPaperForm />
              </Reveal>
            </div>
          </Container>
        </Section>
      </section>
    </>
  );
}