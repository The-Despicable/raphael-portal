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
 * A repository link renders ONLY when a verified URL exists AND the release gate
 * permits it. Otherwise the card shows an availability note. There is no
 * fallback to a guessed URL and no "View repository" affordance that goes
 * nowhere.
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
  const hasVerifiedLink = Boolean(project.repositoryUrl);

  return (
    <article
      className={`group relative overflow-hidden transition-[transform,border-color,background-color] duration-300 hover:-translate-y-[3px] ${
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

      <div className="relative mt-5 border-t border-hairline pt-4">
        {hasVerifiedLink ? (
          <a
            href={project.repositoryUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-azure transition-opacity hover:opacity-80"
          >
            View repository
            <ExternalLink size={12} aria-hidden />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        ) : (
          <p className="flex gap-2 text-[12px] leading-snug text-ink-faint">
            <Lock size={12} aria-hidden className="mt-0.5 shrink-0" />
            <span>{project.availabilityNote ?? "No verified public link."}</span>
          </p>
        )}
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