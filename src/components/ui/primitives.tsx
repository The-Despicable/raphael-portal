import type { ReactNode } from "react";
import type { EvidenceLabel, StatusLevel } from "@/lib/types";
import { provenanceMeta, applicationStatusMeta } from "@/content/research";
import type { ApplicationStatus, Provenance } from "@/lib/types";

/* ========================================================================== */
/* Layout                                                                     */
/* ========================================================================== */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`container-page ${className}`}>{children}</div>;
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

/** Small uppercase label above a heading. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lede,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const alignCls = align === "center" ? "items-center text-center mx-auto" : "";
  return (
    <div className={`flex flex-col gap-4 ${alignCls}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink md:text-4xl">
        {title}
      </h2>
      {lede ? <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">{lede}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/* ========================================================================== */
/* Surfaces                                                                   */
/* ========================================================================== */

export function Card({
  children,
  className = "",
  interactive = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "section" | "li";
}) {
  return (
    <Tag
      className={`surface p-6 ${interactive ? "card-interactive" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}

export function Divider({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div
        aria-hidden
        className="hidden w-px shrink-0 self-stretch bg-gradient-to-b from-transparent via-hairline-strong to-transparent lg:block"
      />
    );
  }
  return <div aria-hidden className="h-px w-full bg-hairline" />;
}

/* ========================================================================== */
/* Status                                                                     */
/* ========================================================================== */

const STATUS_STYLES: Record<StatusLevel, string> = {
  READY: "border-ready/35 bg-ready/10 text-ready",
  CONDITIONAL: "border-conditional/35 bg-conditional/10 text-conditional",
  BLOCKED: "border-blocked/35 bg-blocked/10 text-blocked",
  UNKNOWN: "border-unknown/30 bg-unknown/10 text-unknown",
  NOT_VERIFIED: "border-unverified/35 bg-unverified/10 text-unverified",
};

/**
 * Status is never colour alone: the label is always rendered as text.
 */
export function StatusBadge({ status, className = "" }: { status: StatusLevel; className?: string }) {
  return (
    <span className={`status-pill ${STATUS_STYLES[status]} ${className}`}>
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

const LABEL_STYLES: Record<EvidenceLabel, string> = {
  VERIFIED: "border-cyan/35 bg-cyan/10 text-cyan",
  DOCUMENTED: "border-violet/35 bg-violet/10 text-violet",
  INFERRED: "border-azure/35 bg-azure/10 text-azure",
  NOT_ESTABLISHED: "border-unverified/35 bg-unverified/10 text-unverified",
  NOT_PERFORMED: "border-unverified/35 bg-unverified/10 text-unverified",
  CONTRADICTED: "border-blocked/35 bg-blocked/10 text-blocked",
  UNKNOWN: "border-unknown/30 bg-unknown/10 text-unknown",
};

/** Epistemic label. Visually distinct from StatusBadge on purpose. */
export function EvidenceTag({ label, className = "" }: { label: EvidenceLabel; className?: string }) {
  return <span className={`chip ${LABEL_STYLES[label]} ${className}`}>{label.replace(/_/g, " ")}</span>;
}

const TONE_CLASSES = {
  cyan: "border-cyan/35 bg-cyan/10 text-cyan",
  violet: "border-violet/35 bg-violet/10 text-violet",
  azure: "border-azure/35 bg-azure/10 text-azure",
  slate: "border-unverified/35 bg-unverified/10 text-unverified",
  amber: "border-conditional/35 bg-conditional/10 text-conditional",
} as const;

export function ToneChip({
  tone,
  children,
  className = "",
  title,
}: {
  tone: keyof typeof TONE_CLASSES;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span className={`chip ${TONE_CLASSES[tone]} ${className}`} title={title}>
      {children}
    </span>
  );
}

export function ProvenanceChip({
  provenance,
  className = "",
}: {
  provenance: Provenance;
  className?: string;
}) {
  const meta = provenanceMeta[provenance];
  return (
    <ToneChip tone={meta.tone} className={className} title={meta.meaning}>
      {meta.label}
    </ToneChip>
  );
}

export function ApplicationChip({
  status,
  className = "",
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  const meta = applicationStatusMeta[status];
  return (
    <ToneChip tone={meta.tone} className={className}>
      {meta.label}
    </ToneChip>
  );
}

/* ========================================================================== */
/* Notes                                                                      */
/* ========================================================================== */

/**
 * A boxed caveat. Used wherever the site must not let an optimistic reading
 * survive — release gating, dated snapshots, unverified claims.
 */
export function Note({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "caution" | "positive";
  className?: string;
}) {
  const tones = {
    neutral: "border-hairline bg-elevated/60 text-ink-muted",
    caution: "border-conditional/30 bg-conditional/[0.06] text-ink-muted",
    positive: "border-cyan/30 bg-cyan/[0.06] text-ink-muted",
  } as const;
  return (
    <div className={`rounded-lg border px-4 py-3 text-[13px] leading-relaxed ${tones[tone]} ${className}`}>
      {children}
    </div>
  );
}

/** Dated-provenance footer for any section reporting assessment findings. */
export function DatedSource({ children, date = "2026-10-16" }: { children: ReactNode; date?: string }) {
  return (
    <p className="text-[11px] leading-relaxed text-ink-faint">
      <span className="font-mono">Source</span> · dated assessment · last assessed {date} ·{" "}
      {children}
    </p>
  );
}

/* ========================================================================== */
/* Metrics                                                                    */
/* ========================================================================== */

export function Stat({
  value,
  label,
  hint,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xl font-semibold tracking-tight text-ink">{value}</span>
      <span className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">{label}</span>
      {hint ? <span className="text-[12px] leading-snug text-ink-faint">{hint}</span> : null}
    </div>
  );
}

/** Monospace identifier / path fragment. */
export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[12.5px] ${className}`}>{children}</span>;
}

/** External link with an explicit indicator, opened safely. */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      className={`inline-flex items-center gap-1 text-azure underline-offset-4 hover:underline ${className}`}
    >
      {children}
      <span aria-hidden className="text-[10px]">
        ↗
      </span>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}