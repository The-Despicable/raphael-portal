import Link from "next/link";
import { navItems, releaseReadiness } from "@/config/site";
import { Container, Divider } from "@/components/ui/primitives";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-hairline bg-abyss">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span aria-hidden className="size-2 rounded-full bg-cyan" />
              <span className="text-[15px] font-semibold tracking-tight text-ink">RAPHAEL</span>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-dim">
              An independent research portal documenting an ambitious, unfinished AI security research
              project — its architecture, its evidence, and its unresolved questions.
            </p>
            <p className="max-w-sm text-[12px] leading-relaxed text-ink-faint">
              Findings shown here come from a dated assessment and have not been continuously
              revalidated. Nothing on this site constitutes production-readiness, an independent
              verification, or an official project position.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
              Pages
            </span>
            <ul className="flex flex-col gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[13px] text-ink-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
              Repository
            </span>
            {releaseReadiness.approved ? (
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-ink-muted transition-colors hover:text-ink"
              >
                GitHub ↗
              </a>
            ) : (
              <p className="text-[13px] leading-relaxed text-ink-faint">
                Source availability pending release review. No repository link is published, because
                the project has no license and credential-history remediation is outstanding.
              </p>
            )}
            <Link
              href="/community"
              className="text-[13px] text-ink-muted transition-colors hover:text-ink"
            >
              Contact
            </Link>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
              Release review: {releaseReadiness.reviewedOn}
            </p>
          </div>
        </div>

        <Divider />

        <div className="flex flex-col gap-2 py-6 text-[11.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <span>Raphael Research Portal — independent documentation project.</span>
          <span className="font-mono">No affiliation with, or endorsement by, the assessed project.</span>
        </div>
      </Container>
    </footer>
  );
}