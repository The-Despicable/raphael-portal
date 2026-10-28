import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Freeze Status — 6e2157e6",
  description:
    "Frozen runtime frame: production Docker, verified native shadow fallback, and the release-gate evidence posture for Raphael at commit 6e2157e6.",
};

export default function FreezePage() {
  return (
    <>
      <section className="border-b border-hairline px-8 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-dim">
            Red Team Freeze — commit 6e2157e6
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink md:text-3xl">
            Freeze Status
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
            The Stitch-generated audit frame below captures the frozen production
            state: twelve tagged images, ten native shadow services, a 12-rule
            consistency gate, and the attestation surface. It is served as a
            standalone technical HTML asset on the same origin and renders without
            JavaScript.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[12px]">
            <a
              href="/raphael/freeze-status.html"
              className="rounded border border-line bg-surface-2 px-4 py-1.5 font-mono uppercase tracking-wider text-ink hover:border-accent hover:text-accent"
            >
              Open standalone
            </a>
            <a
              href="https://github.com/The-Despicable/Raphael_RedTeam/tree/native-migration"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded border border-line bg-surface-2 px-4 py-1.5 font-mono uppercase tracking-wider text-ink hover:border-accent hover:text-accent"
            >
              Source (native-migration)
            </a>
          </div>
        </div>
      </section>
      <div className="w-full overflow-hidden border-b border-hairline bg-surface-0">
        <iframe
          src="/raphael/freeze-status.html"
          title="Raphael freeze status"
          className="h-[1800px] w-full border-0"
          loading="lazy"
        />
      </div>
    </>
  );
}
