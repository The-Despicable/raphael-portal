import Link from "next/link";
import { ASSESSMENT } from "@/content/status";
import { StatusBadge } from "@/components/ui/primitives";

/**
 * The one status summary that appears on more than one page.
 *
 * Deliberately flat and factual. NOT_READY is a real finding about a research
 * artifact, not an incident, so it is not styled as an alarm.
 */
export function SummaryBar() {
  return (
    <div className="surface mt-8 flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
          Overall assessment
        </span>
        <span className="font-mono text-3xl font-bold tracking-tight text-ink md:text-4xl">
          {ASSESSMENT.overallReadiness}
        </span>
        <span className="text-[13px] text-ink-muted">
          Gate disposition: <span className="text-ink">{ASSESSMENT.gateDisposition}</span>
        </span>
      </div>

      <div className="flex flex-col gap-4 md:items-end">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
          <div className="flex flex-col gap-1">
            <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Last assessed</dt>
            <dd className="font-mono text-ink">{ASSESSMENT.date}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Disposition</dt>
            <dd className="text-ink">{ASSESSMENT.disposition}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Confidence</dt>
            <dd className="text-ink">{ASSESSMENT.confidence}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Revalidated</dt>
            <dd>
              <StatusBadge status="NOT_VERIFIED" />
            </dd>
          </div>
        </dl>

        <Link
          href="/status"
          className="text-[13.5px] font-medium text-cyan transition-opacity hover:opacity-80"
        >
          Full status and blockers →
        </Link>
      </div>
    </div>
  );
}