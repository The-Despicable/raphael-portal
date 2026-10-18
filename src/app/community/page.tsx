import type { Metadata } from "next";
import { Mail, Send, AtSign, MessageCircle, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { contactChannels } from "@/config/site";
import { Container, Eyebrow, Note } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/motion";

export const metadata: Metadata = {
  title: "Contact & Connect",
  description:
    "Have something useful to share? Ideas, useful information, feedback, and collaboration opportunities are welcome. Reach out through any of the channels below.",
};

/**
 * Channel icons are mapped here rather than stored in the config, which stays
 * plain data so it can be asserted in tests without rendering anything.
 *
 * Lucide 1.x no longer ships brand marks (Instagram, Twitter/X and the rest were
 * removed upstream), so each platform gets a generic glyph. The platform NAME is
 * always rendered as text beside the icon and repeated in the link's accessible
 * name, so the glyph is decoration and never the only signal.
 */
const CHANNEL_ICONS: Record<string, LucideIcon> = {
  email: Mail,
  telegram: Send,
  instagram: AtSign,
  x: MessageCircle,
};

/**
 * Contact & Connect.
 *
 * The URL stays `/community` so existing links and bookmarks keep working, but
 * the page is now purely a directory of direct contact links. There is no chat,
 * no review form, and no account of any kind — every channel is an ordinary
 * link, so the page renders identically for every visitor.
 *
 * Nothing here is inferred. Each channel's displayed handle and its destination
 * come from the owner and are kept in separate fields, so a link cannot silently
 * disagree with the text beside it.
 */
export default function ContactPage() {
  return (
    <>
      {/* ================= HEADER ================= */}
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
              <Eyebrow>Contact &amp; Connect</Eyebrow>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
                Contact &amp; Connect
              </h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-ink-muted">
                Have something useful to share? Ideas, useful information, feedback, and collaboration
                opportunities are welcome. Reach out through any of the channels below.
              </p>
            </Reveal>

            <Reveal>
              <Note tone="positive" className="mt-8 max-w-2xl">
                No account, no sign-in, no form. Every channel below is a direct link, so you can reach
                out without creating anything or telling this site who you are.
              </Note>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ================= CHANNELS ================= */}
      <section className="py-16 md:py-20">
        <Container>
          <ul className="grid gap-4 md:grid-cols-2">
            {contactChannels.map((channel) => {
              const Icon = CHANNEL_ICONS[channel.id] ?? AtSign;
              return (
                <li key={channel.id}>
                  <a
                    href={channel.href}
                    {...(channel.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    aria-label={
                      channel.external
                        ? `${channel.platform}: ${channel.display} (opens in a new tab)`
                        : `${channel.platform}: ${channel.display}`
                    }
                    className="group glass block h-full rounded-xl border border-cyan/25 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-[3px] hover:border-cyan/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/[0.06] text-cyan">
                        <Icon size={17} aria-hidden />
                      </span>
                      <h2 className="text-[14.5px] font-semibold text-ink">{channel.platform}</h2>
                    </div>

                    {/* Shown verbatim. break-all keeps long handles inside the card
                        on narrow viewports instead of overflowing it. */}
                    <p className="mt-4 font-mono text-[14px] break-all text-ink-muted transition-colors group-hover:text-ink">
                      {channel.display}
                    </p>

                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-cyan">
                      {channel.external ? "Open channel" : "Write an email"}
                      <ArrowUpRight
                        size={13}
                        aria-hidden
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          <Reveal>
            <p className="mt-12 text-[15px] leading-relaxed text-ink-muted">
              Looking forward to hearing from you.
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}