import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  ASSESSMENT,
  blockers,
  openQuestions,
  readinessScorecard,
  recommendedPath,
  strategicOptions,
  timeline,
  whatExistsVsProven,
} from "@/content/status";
import {
  Card,
  Container,
  DatedSource,
  EvidenceTag,
  Eyebrow,
  Note,
  Section,
  SectionHeader,
  StatusBadge,
  ToneChip,
} from "@/components/ui/primitives";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { SummaryBar } from "@/components/status/SummaryBar";
import { BlockerTable } from "@/components/status/BlockerTable";

export const metadata: Metadata = {
  title: "Project Status",
  description:
    "Where Raphael stands: the dated 2026-10-16 viability assessment, the readiness scorecard, the blocker register, the timeline, and the recommended path.",
};

const SEVERITY_TONE = {
  P0: "blocked",
  P1: "conditional",
  P2: "slate",
  P3: "slate",
} as const;

export default function StatusPage() {
  return (
    <>
      {/* ================= 1. STATUS HERO ================= */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(55% 60% at 40% 0%, rgba(251,191,36,0.06), transparent 70%)",
          }}
        />
        <Container>
          <div className="py-16 md:py-20">
            <Reveal>
              <Eyebrow>Current state</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                Where Raphael stands today.
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
                This is a transparent account of a blocked research project — what was built, what
                was proven, what is missing, and what would change the conclusion.
              </p>
            </Reveal>

            <Reveal>
              <SummaryBar />
            </Reveal>

            <Reveal>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Card className="p-5">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                    Governance gate G3
                  </span>
                  <p className="mt-2 font-mono text-lg font-semibold text-blocked">NOT ACCEPTED</p>
                </Card>
                <Card className="p-5">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                    Canonical roadmap · AM-4-R3
                  </span>
                  <p className="mt-2 font-mono text-lg font-semibold text-blocked">NOT EXECUTED</p>
                </Card>
                <Card className="p-5">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                    Central research thesis
                  </span>
                  <p className="mt-2 font-mono text-lg font-semibold text-conditional">
                    UNRESOLVED
                  </p>
                </Card>
              </div>
            </Reveal>

            <Reveal>
              <Note tone="caution" className="mt-6">
                <span className="font-medium text-ink">These are dated findings, not live telemetry.</span>{" "}
                They come from a single read-only assessment dated {ASSESSMENT.date}, which has not
                been revalidated. No newer verified assessment exists, so the historical date is shown
                rather than implying live status. Nothing here should be read as permanently current.
              </Note>
            </Reveal>

            <Reveal>
              <div className="mt-8 rounded-lg border border-hairline bg-elevated/50 p-5">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                  Recommended disposition
                </h2>
                <p className="mt-2.5 font-mono text-[15px] text-ink">{ASSESSMENT.disposition}</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
                  {ASSESSMENT.dispositionDetail} Confidence {ASSESSMENT.confidence}.
                </p>
                <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
                  {recommendedPath.notAuthorisation}
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================= 2. SCORECARD ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Completion readiness"
              title="Readiness scorecard"
              lede="Ten dimensions, each rated with the evidence behind it and the gap that remains. Status is never colour alone — every badge carries its label."
            />
          </Reveal>

          <Stagger className="mt-10 grid gap-4 lg:grid-cols-2">
            {readinessScorecard.map((d) => (
              <StaggerItem key={d.dimension}>
                <Card className="h-full">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-[14.5px] font-semibold text-ink">{d.dimension}</h3>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      <ToneChip tone="slate">{d.confidence}</ToneChip>
                    </div>
                  </div>
                  <dl className="mt-4 space-y-3 text-[13px] leading-relaxed">
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.1em] text-cyan">Evidence</dt>
                      <dd className="mt-1 text-ink-muted">{d.evidence}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.1em] text-conditional">
                        Outstanding gap
                      </dt>
                      <dd className="mt-1 text-ink-muted">{d.outstandingGap}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">
                        Consequence
                      </dt>
                      <dd className="mt-1 text-ink-muted">{d.consequence}</dd>
                    </div>
                  </dl>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </Section>

      {/* ================= 3. BLOCKERS ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="blockers">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Blocker register"
                title="Major blockers and risks"
                lede={`${blockers.length} recorded blockers, ordered by severity. Identifiers are preserved so each can be traced back to the dated assessment. Specific unpatched-defect symbols are deliberately not published.`}
              />
            </Reveal>

            <Reveal>
              <div className="mt-8 flex flex-wrap gap-2">
                {(["P0", "P1", "P2", "P3"] as const).map((sev) => (
                  <span
                    key={sev}
                    className="rounded-full border border-hairline px-3 py-1.5 text-[11.5px] text-ink-dim"
                  >
                    {sev} · {blockers.filter((b) => b.severity === sev).length}
                  </span>
                ))}
                <span className="rounded-full border border-hairline px-3 py-1.5 text-[11.5px] text-ink-dim">
                  total · {blockers.length}
                </span>
              </div>
            </Reveal>

            <div className="mt-6">
              <BlockerTable blockers={blockers} />
            </div>

            <Reveal>
              <DatedSource>
                Transcribed from the {ASSESSMENT.date} assessment. Credential values, local paths,
                remote names, hashes and operational detail were excluded by design.
              </DatedSource>
            </Reveal>
          </Container>
        </Section>
      </section>

      {/* ================= 4. EXISTS VS PROVEN ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Evidence layering"
              title="What exists versus what is proven"
              lede="These are different questions with different answers. A component existing, a behaviour being documented, a third party reporting a result, and this assessment having verified something are four separate things."
            />
          </Reveal>

          <Stagger className="mt-10 space-y-3">
            {whatExistsVsProven.map((layer) => (
              <StaggerItem key={layer.layer}>
                <div className="surface flex flex-col gap-3 p-5 md:flex-row md:items-start md:gap-6">
                  <div className="md:w-56 md:shrink-0">
                    <h3 className="text-[13.5px] font-semibold text-ink">{layer.layer}</h3>
                    <div className="mt-2">
                      <EvidenceTag label={layer.label} />
                    </div>
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-ink-muted">{layer.statement}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>

          <Reveal>
            <Note tone="caution" className="mt-6">
              A third-party test report is not the same as a test rerun by this assessment. The
              assessment executed no tests at all; its verified claims are structural and documentary.
            </Note>
          </Reveal>
        </Container>
      </Section>

      {/* ================= 5. TIMELINE ================= */}
      <section className="border-y border-hairline bg-abyss/50">
        <Section id="timeline">
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Timeline"
                title="Milestones, source-supported"
                lede="Where a date or a causal link is reconstructed rather than recorded, it is marked approximate. A VERIFIED tag means the event itself is recorded in the project's own documents — it does not mean Raphael was executed and independently validated. The dated assessment ran no tests of its own, so its verified claims are structural and documentary."
              />
            </Reveal>

            <Stagger className="mt-10 space-y-0">
              {timeline.map((event, i) => (
                <StaggerItem key={`${event.date}-${i}`}>
                  <div className="group relative flex gap-5 pb-8 pl-1 last:pb-0">
                    <div className="relative flex w-4 shrink-0 justify-center">
                      <span className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan/70 transition-shadow duration-300 group-hover:shadow-[0_0_14px_3px_rgba(34,211,238,0.45)]" />
                      {i < timeline.length - 1 ? (
                        <span className="absolute left-1/2 top-5 h-full w-px -translate-x-1/2 bg-hairline" />
                      ) : null}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[12.5px] text-cyan">{event.date}</span>
                        {event.approximate ? <ToneChip tone="slate">approximate</ToneChip> : null}
                        <EvidenceTag label={event.label} />
                      </div>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{event.event}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </Section>
      </section>

      {/* ================= 6. RECOMMENDED PATH ================= */}
      <Section>
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Strategic options"
              title="Four options, and what would change the answer"
              lede="Scores are illustrative and sensitive to their weights. The qualitative result is robust; the numbers are not."
            />
          </Reveal>

          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            {strategicOptions.map((opt) => {
              const isRecommended = opt.key === "B";
              return (
                <StaggerItem key={opt.key}>
                  <Card
                    className={`h-full ${isRecommended ? "border-cyan/40 bg-cyan/[0.03]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[15px] font-semibold text-ink">
                        <span className="mr-2 font-mono text-ink-faint">{opt.key}</span>
                        {opt.name}
                      </h3>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-[13px] text-ink-dim">
                          {opt.illustrativeScore.toFixed(1)}
                        </span>
                        <span className="text-[10.5px] text-ink-faint">/5</span>
                      </div>
                    </div>

                    {isRecommended ? (
                      <div className="mt-3">
                        <ToneChip tone="cyan">documented recommendation</ToneChip>
                      </div>
                    ) : null}

                    <dl className="mt-4 space-y-2.5 text-[12.5px] leading-relaxed">
                      <div>
                        <dt className="inline font-medium text-ink">Benefits: </dt>
                        <dd className="inline text-ink-muted">{opt.benefits}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Costs: </dt>
                        <dd className="inline text-ink-muted">{opt.costs}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Dependencies: </dt>
                        <dd className="inline text-ink-muted">{opt.criticalDependencies}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Risks: </dt>
                        <dd className="inline text-ink-muted">{opt.risks}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium text-ink">Evidence required: </dt>
                        <dd className="inline text-ink-muted">{opt.evidenceRequired}</dd>
                      </div>
                    </dl>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>

          <Reveal>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                  Why this recommendation
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {recommendedPath.rationale.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink">
                  What would change it
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {recommendedPath.wouldChange.map((r) => (
                    <li key={r} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-conditional" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-10">
              <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                Open governance questions
              </h3>
              <Stagger className="mt-5 grid gap-3 md:grid-cols-2">
                {openQuestions.map((q) => (
                  <StaggerItem key={q.id}>
                    <Card className="h-full p-4">
                      <span className="font-mono text-[11px] text-ink-faint">{q.id}</span>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink">{q.question}</p>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-dim">
                        {q.rationale}
                      </p>
                    </Card>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/community"
                className="btn-glow inline-flex items-center gap-2 rounded-md border border-cyan/40 bg-cyan/10 px-5 py-2.5 text-[14px] font-medium text-cyan"
              >
                Suggest a correction
                <ArrowRight size={14} aria-hidden />
              </Link>
              <Link
                href="/research"
                className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
              >
                Contribute research
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

export { SEVERITY_TONE };