import Link from "next/link";
import { ExternalLink, Lock, ShieldCheck, GitFork } from "lucide-react";
import type { ProjectCard as ProjectCardType } from "@/config/site";
import { ToneChip } from "@/components/ui/primitives";

const ROLE_META: Record<
  ProjectCardType["role"],
  { label: string; tone: "cyan" | "violet" | "slate"; note: string }
> = {
  primary: {
    label: "Primary project",
    tone: "cyan",
    note: "The subject of this portal.",
  },
  successor: {
    label: "Independent successor",
    tone: "violet",
    note: "Separate project. Its security properties are its own and do not transfer.",
  },
  portfolio: {
    label: "Portfolio",
    tone: "slate",
    note: "Supporting work.",
  },
};

/**
 * A project card.
 *
 * LINK POLICY
 * -----------
 * A repository link renders ONLY when `linkStatus === "verified"` AND a URL is
 * present. Otherwise the card shows an availability note that says WHY. There is
 * no fallback to a guessed URL and no "View repository" affordance that goes
 * nowhere.
 *
 * The state is read from `linkStatus`, not inferred from a null URL: a withheld
 * link ("we reviewed this and are not publishing it yet") and a missing one
 * ("we never established a URL") are different facts and must not look alike.
 */
export function ProjectCard({
  project,
  featured = false,
  staggerIndex = 0,
}: {
  project: ProjectCardType;
  featured?: boolean;
  staggerIndex?: number;
}) {
  const role = ROLE_META[project.role];
  const hasVerifiedLink = project.linkStatus === "verified" && Boolean(project.repositoryUrl);
  const hasDocsLink = project.linkStatus === "verified" && Boolean(project.docsUrl);

  return (
    <article
      className={`group relative overflow-hidden transition-[transform,border-color,background-color] duration-300 hover:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        featured
          ? "glass rounded-xl border border-cyan/30 p-6 hover:border-cyan/50"
          : "surface p-5 hover:border-hairline-strong"
      }`}
      style={{ "--sweep-delay": `${180 + staggerIndex * 260}ms` } as React.CSSProperties}
    >
      {/* One-shot light sweep when the card enters the viewport. */}
      {featured ? (
        <span aria-hidden className="sweep-host pointer-events-none absolute inset-0 rounded-xl" />
      ) : null}

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ToneChip tone={role.tone}>{role.label}</ToneChip>
        </div>
        <GitFork
          size={15}
          aria-hidden
          className="card-accent-icon shrink-0 text-ink-faint transition-colors duration-300"
        />
      </div>

      <h3 className={`relative mt-4 font-semibold tracking-tight text-ink ${featured ? "text-lg" : "text-base"}`}>
        {project.name}
      </h3>

      <p className={`relative mt-2 leading-relaxed text-ink-muted ${featured ? "text-[13.5px]" : "text-[13px]"}`}>
        {featured ? project.description : project.summary}
      </p>

      {project.caveat ? (
        <p className="relative mt-3 flex gap-2 text-[12px] leading-snug text-ink-faint">
          <ShieldCheck size={13} aria-hidden className="mt-0.5 shrink-0 text-cyan/70" />
          <span>{project.caveat}</span>
        </p>
      ) : null}

      {project.tech.length > 0 ? (
        <ul className="relative mt-4 flex flex-wrap gap-1.5">
          {project.tech.map((tech) => (
            <li key={tech}>
              <span className="rounded border border-hairline px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.06em] text-ink-dim">
                {tech}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-hairline pt-4">
        {hasVerifiedLink ? (
          <a
            href={project.repositoryUrl!}
            target="_blank"
            rel="noopener noreferrer"
            // Names the project rather than repeating "View repository" verbatim,
            // so a screen-reader user browsing links knows which project this is.
            aria-label={`View the ${project.name} repository on GitHub (opens in a new tab)`}
            className="inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-azure underline-offset-4 transition-opacity hover:opacity-80 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
          >
            View on GitHub
            <ExternalLink size={12} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <p className="flex gap-2 text-[12px] leading-snug text-ink-faint">
            <Lock size={12} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              <span className="sr-only">{`${project.name}: `}</span>
              {/* Distinguishes a link withheld by review from one never established. */}
              {project.linkStatus === "pending_review" ? "Repository pending review. " : ""}
              {project.availabilityNote ?? "No verified public link."}
            </span>
          </p>
        )}

        {hasDocsLink ? (
          <a
            href={project.docsUrl!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Documentation for ${project.name} (opens in a new tab)`}
            className="inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-ink-muted underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan"
          >
            Documentation
            <ExternalLink size={12} aria-hidden />
          </a>
        ) : null}
      </div>

      <span className="sr-only">{role.note}</span>
    </article>
  );
}

export function ProjectCardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-[13px] text-azure transition-opacity hover:opacity-80">
      {children}
    </Link>
  );
}