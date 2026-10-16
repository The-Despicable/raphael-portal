import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Bot, ArrowRight } from "lucide-react";
import { conductSummary } from "@/config/site";
import { Card, Container, Eyebrow, Note, Section, SectionHeader, ToneChip } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/motion";
import { ChatRoom } from "@/components/community/ChatRoom";
import { Reviews } from "@/components/community/Reviews";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Discuss the research, challenge the assumptions, and leave feedback. Guest chat and reviews with no email, password or account required.",
};

/**
 * Community page.
 *
 * TWO DISTINCT EXPERIENCES, DELIBERATELY SEPARATE
 * -----------------------------------------------
 *  1. The public guest chat below — visitors conversing with each other.
 *  2. The AI research assistant, opened from the global launcher.
 *
 * They are not connected. AI answers are never posted into the human chat, and
 * chat messages are never sent to a model provider. The two entry points are
 * labelled separately so nobody has to guess which one they are talking to.
 */
export default function CommunityPage() {
  return (
    <>
      {/* ================= 1. HEADER ================= */}
      <section className="relative overflow-hidden border-b border-hairline">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style={{
            background:
              "radial-gradient(55% 55% at 50% 0%, rgba(34,211,238,0.09), transparent 70%)",
          }}
        />
        <Container>
          <div className="py-16 md:py-20">
            <Reveal>
              <Eyebrow>Community</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                Discuss the research. Challenge the assumptions. Help improve the project.
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
                Researchers, developers, students and interested visitors are welcome. No account, no
                email, no password — choose a nickname and read or post.
              </p>
            </Reveal>

            {/* two entry points, clearly distinct */}
            <Reveal>
              <div className="mt-9 grid gap-4 md:grid-cols-2">
                <Card className="border-cyan/25 bg-cyan/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare size={16} className="text-cyan" aria-hidden />
                    <h2 className="text-[14.5px] font-semibold text-ink">Join the community chat</h2>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
                    A public room where visitors talk to each other about the architecture, the
                    evidence, and the research. This is the human conversation — further down this
                    page.
                  </p>
                  <a
                    href="#chat"
                    className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-cyan transition-opacity hover:opacity-80"
                  >
                    Go to the room <ArrowRight size={13} aria-hidden />
                  </a>
                </Card>

                <Card className="border-violet/25 bg-violet/[0.03]">
                  <div className="flex items-center gap-2.5">
                    <Bot size={16} className="text-violet" aria-hidden />
                    <h2 className="text-[14.5px] font-semibold text-ink">Ask Raphael AI</h2>
                    <ToneChip tone="violet">separate service</ToneChip>
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
                    A research assistant that answers questions about Raphael&apos;s published material
                    and cites a named document for every answer. It is not a person, it is not in the
                    room above, and it cannot execute code or operate the project.
                  </p>
                  <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
                    Open it with the <span className="text-ink-dim">Ask Raphael AI</span> button, fixed
                    in the corner of every page.
                  </p>
                </Card>
              </div>
            </Reveal>

            <Reveal>
              <Note tone="caution" className="mt-6">
                <span className="font-medium text-ink">No login, but not no safeguards.</span> Guest
                access means you can participate without an account. It is backed by a server-issued
                session, rate limits, server-side validation, reporting, and a moderation queue.
              </Note>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================= 2–3. CODE OF CONDUCT + CHAT ================= */}
      <Section id="conduct">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Code of conduct"
              title="Short, and enforced"
              lede="This is a technical discussion space. Being rigorous about evidence matters more here than being agreeable."
            />
          </Reveal>

          <Reveal>
            <ul className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {conductSummary.map((rule) => (
                <li key={rule} className="surface flex gap-2.5 p-4">
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                  <span className="text-[13px] leading-relaxed text-ink-muted">{rule}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <div id="chat" className="mt-14">
            <Reveal>
              <SectionHeader
                eyebrow="Live chat"
                title="Public guest chat"
                lede="Messages are plain text. They are never interpreted as markup, never executed, and never passed to any tool."
              />
            </Reveal>
            <div className="mt-8">
              <Reveal>
                <ChatRoom />
              </Reveal>
            </div>
          </div>
        </Container>
      </Section>

      {/* ================= 4. REVIEWS ================= */}
      <section className="border-y border-hairline bg-abyss/50" id="reviews">
        <Section>
          <Container>
            <Reveal>
              <SectionHeader
                eyebrow="Reviews & feedback"
                title="Say what is wrong"
                lede="The most useful feedback on a documentation site is specific and negative: which claim is unsupported, which citation is wrong, which status is overstated."
              />
            </Reveal>
            <div className="mt-10">
              <Reveal>
                <Reviews />
              </Reveal>
            </div>
          </Container>
        </Section>
      </section>

      {/* ================= 5. MODERATION + PRIVACY ================= */}
      <Section id="privacy">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <Reveal>
              <Card className="h-full">
                <h2 className="text-[14px] font-semibold text-ink">Moderation</h2>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    Every message and review can be reported in-app.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    Message length, nickname format and character classes are validated server-side.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    Rate limits apply per session and per network, on joining, posting and reviewing.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    No HTML, no scripts, no file uploads, no attachments, no tool invocation.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                    {`If no moderator is configured for this deployment, reviews are held as PENDING and are not publicly listed rather than being published unreviewed.`}
                  </li>
                </ul>
              </Card>
            </Reveal>

            <Reveal dir="right">
              <Card className="h-full">
                <h2 className="text-[14px] font-semibold text-ink">Privacy</h2>
                <ul className="mt-3 space-y-2.5">
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                    Guest usernames are <span className="text-ink">pseudonyms</span>. Nothing links one
                    to a real person, and none is reserved globally.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                    Session tokens live in an HttpOnly cookie and are never readable by page scripts.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                    No IP address is stored, displayed or returned. Rate limiting uses a daily-rotating
                    keyed hash instead.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                    Community messages are never sent to an AI provider or any analytics service.
                  </li>
                  <li className="flex gap-2.5 text-[13px] leading-relaxed text-ink-muted">
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan" />
                    Only the fields needed to operate the room are retained. Moderation notes and
                    reports are never public.
                  </li>
                </ul>
              </Card>
            </Reveal>
          </div>

          <Reveal>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/research#suggest"
                className="btn-glow inline-flex items-center gap-2 rounded-md border border-cyan/40 bg-cyan/10 px-5 py-2.5 text-[14px] font-medium text-cyan"
              >
                Suggest a paper <ArrowRight size={14} aria-hidden />
              </Link>
              <Link
                href="/status#blockers"
                className="inline-flex items-center gap-2 rounded-md border border-hairline px-5 py-2.5 text-[14px] font-medium text-ink-muted transition-colors hover:border-hairline-strong hover:text-ink"
              >
                Review the blockers
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}