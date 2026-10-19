import {
  currentStatusRows,
  decisionDependencyChain,
  overallStatus,
  overallStatusMeaning,
  presentPositionSummary,
} from "@/content/raphael-timeline";
import {
  evaluationClaims,
  governanceDependencyNote,
  governanceLesson,
} from "@/content/raphael-timeline-deep";

const TONE: Record<string, string> = {
  blocked: "border-blocked/40 bg-blocked/10 text-blocked",
  caution: "border-conditional/35 bg-conditional/10 text-conditional",
  violet: "border-violet/35 bg-violet/10 text-violet",
};

const CATEGORY_LABEL: Record<string, string> = {
  GATE: "Gate",
  EVIDENCE: "Evidence",
  GOVERNANCE: "Governance",
  RESEARCH: "Research",
};

/**
 * Current state.
 *
 * Rendered twice on the page — once near the top and once near the end — so a
 * reader who lands mid-page or stops early still meets the real status. Each
 * row carries a *why*, because a bare list of labels is exactly the kind of
 * summary that lets an optimistic reading survive.
 */
export function CurrentStatusPanel({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  return (
    <div
      className={`rounded-xl border border-blocked/25 bg-blocked/[0.04] ${
        variant === "compact" ? "p-4" : "p-5 md:p-6"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold tracking-tight text-ink">
            Present position — RAPHAEL v4.x
          </h2>
          <p className="mt-2 max-w-[68ch] text-[13px] leading-relaxed text-ink-muted">
            {presentPositionSummary}
          </p>
        </div>
        <span className="chip shrink-0 border border-blocked/45 bg-blocked/12 font-mono text-blocked">
          {overallStatus}
        </span>
      </div>

      {variant === "full" ? (
        <p className="mt-4 max-w-[72ch] text-[12.5px] leading-relaxed text-ink-faint">
          {overallStatusMeaning}
        </p>
      ) : null}

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {currentStatusRows.map((row) => (
          <li
            key={row.id}
            className="flex flex-col rounded-md border border-hairline bg-void/40 px-3.5 py-3"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                {row.id}
              </span>
              <span className="chip border-hairline bg-surface/70 text-[9.5px] text-ink-dim">
                {CATEGORY_LABEL[row.category]}
              </span>
            </div>
            <span
              className={`mt-1.5 font-mono text-[13px] font-semibold ${TONE[row.tone].split(" ").pop()}`}
            >
              {row.value}
            </span>
            <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-faint">
              {row.why}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Why the blockers are blocked: the dependency chain, and the fact that the
 * first link in it is still absent.
 */
export function DecisionChain() {
  return (
    <div className="min-w-0 rounded-lg border border-hairline bg-elevated/40 p-4 md:p-5">
      <h3 className="text-[12px] font-semibold text-ink">
        The dependency chain, and why it is still blocked
      </h3>
      <ol className="mt-3 flex flex-col gap-1.5">
        {decisionDependencyChain.map((step, i) => (
          <li key={step} className="flex min-w-0 items-start gap-2.5">
            <span
              aria-hidden
              className="mt-[3px] shrink-0 font-mono text-[10.5px] text-ink-faint"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`min-w-0 text-[12.5px] leading-relaxed ${
                i === 0 ? "font-medium text-blocked" : "text-ink-muted"
              }`}
            >
              {step}
              {i === 0 ? (
                <span className="ml-2 chip border-blocked/35 bg-blocked/10 text-blocked">
                  absent
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3.5 max-w-[72ch] text-[12px] leading-relaxed text-ink-faint">
        {governanceDependencyNote}
      </p>
      <p className="mt-2 max-w-[72ch] text-[12px] leading-relaxed text-ink-faint">
        {governanceLesson}
      </p>
    </div>
  );
}

/** Appendix J — the evaluation claim ledger. */
export function EvaluationClaimLedger() {
  const blockedState = (state: string) =>
    state === "UNRESOLVED" || state.startsWith("Absent");

  return (
    <ul className="flex min-w-0 flex-col gap-3">
      {evaluationClaims.map((c) => (
        <li
          key={c.claim}
          className="min-w-0 rounded-md border border-hairline bg-void/40 px-3.5 py-3"
        >
          <p className="text-[13px] font-medium text-ink">{c.claim}</p>
          {/*
            The recorded state is a sentence, not a label. It is deliberately
            NOT rendered in a `.chip`: that component sets `white-space:
            nowrap` for short labels, and using it here gave the section a
            399px minimum content width, which forced a horizontal page scroll
            at narrow viewports.
          */}
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              State in the record:{" "}
            </span>
            <span
              className={
                blockedState(c.state)
                  ? "font-medium text-blocked"
                  : "font-medium text-ink-muted"
              }
            >
              {c.state}
            </span>
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
              Treated as:{" "}
            </span>
            {c.treatment}
          </p>
        </li>
      ))}
    </ul>
  );
}
