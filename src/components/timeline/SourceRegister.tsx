import { sourceRegister, type SourceKind } from "@/content/raphael-timeline";

const KIND_LABEL: Record<SourceKind, string> = {
  OWNER_HISTORY: "Owner-recalled historical account",
  DATED_ARCHITECTURE: "Dated architecture document",
  AUDIT: "Repository architecture audit",
  HANDOFF: "Current-state handoff",
  ROADMAP: "Roadmap or governance record",
  ASSESSMENT: "Viability / readiness assessment",
  PORTAL_RECORD: "Portal documentation record",
};

const KIND_TONE: Record<SourceKind, string> = {
  OWNER_HISTORY: "border-azure/35 bg-azure/10 text-azure",
  DATED_ARCHITECTURE: "border-cyan/35 bg-cyan/10 text-cyan",
  AUDIT: "border-conditional/35 bg-conditional/10 text-conditional",
  HANDOFF: "border-violet/35 bg-violet/10 text-violet",
  ROADMAP: "border-violet/35 bg-violet/10 text-violet",
  ASSESSMENT: "border-blocked/35 bg-blocked/10 text-blocked",
  PORTAL_RECORD: "border-hairline bg-surface/70 text-ink-muted",
};

/**
 * Source register.
 *
 * Filenames are shown as text rather than links. The portal deliberately does
 * not publish repository paths, remote names or object hashes, and no
 * destination URL for these documents has been established, so an anchor here
 * would either point nowhere or point at something unverified.
 */
export function SourceRegister() {
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid min-w-0 gap-2.5 md:grid-cols-2">
        {sourceRegister.map((s) => (
          <li
            key={s.id}
            className="flex min-w-0 flex-col rounded-lg border border-hairline bg-elevated/40 p-4"
          >
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              {/* Document filenames are long unbreakable tokens, so they are
                  allowed to break rather than forcing the card wider than the
                  viewport. */}
              <span className="min-w-0 break-all font-mono text-[12.5px] font-semibold text-ink">
                {s.document}
              </span>
              <span className="shrink-0 font-mono text-[10.5px] text-ink-faint">{s.date}</span>
            </div>
            <span className={`chip mt-2 ${KIND_TONE[s.kind]}`}>{KIND_LABEL[s.kind]}</span>
            <p className="mt-2.5 text-[12px] leading-relaxed text-ink-muted">{s.role}</p>
          </li>
        ))}
      </ul>
      <p className="max-w-[72ch] text-[11.5px] leading-relaxed text-ink-faint">
        Document titles and their role only. Filenames are shown as text because
        no public destination for these records has been established; this
        portal does not publish local paths, remote names or object hashes.
      </p>
    </div>
  );
}
