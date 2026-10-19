"use client";

import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  type ArchitectureBand,
  type ArchitectureComponent,
  type ArchitectureDiagramModel,
  type ComponentStatus,
  type TrustRole,
  legendEntryFor,
} from "@/content/raphael-architecture";
import { motion, useReducedMotion } from "motion/react";
import { EvidenceTag } from "@/components/ui/primitives";

/**
 * Architecture explorer diagram.
 *
 * WHY THIS IS NOT AN SVG GRAPH
 * ---------------------------
 * The stages carry meaning in their ORDER, and a generated SVG layout would
 * need a layout engine to place two different topologies (a ten-stage loop plus
 * a separate legacy lane, and a twenty-stage loop plus a separate improvement
 * lane). Instead the layout is an ordered CSS grid: bands are regions, and
 * within a band the components flow in declared order. That keeps the sequence
 * legible, keeps every node a real focusable button, and adds no dependency.
 *
 * ACCESSIBILITY
 * -------------
 * - Each node is a <button>, so it is in the tab order, operable with
 *   Enter/Space, and exposes an accessible name that includes its stage.
 * - Connectors are rendered as text ("then", "yields") and as CSS borders, and
 *   are hidden from assistive technology: the order is already conveyed by the
 *   tab sequence and by the stage labels.
 * - Status is rendered as TEXT on every node, never as colour alone.
 * - The legend repeats every status as a word, so the diagram is legible
 *   without relying on the colour palette.
 *
 * RESPONSIVE BEHAVIOUR
 * --------------------
 * Bands stack vertically on narrow viewports and the component sequence stays
 * in declared order. A diagram that reordered itself on mobile would
 * misrepresent the architecture, so order is preserved at every width.
 */

/* -------------------------------------------------------------------------
 * Status styling. Each status gets BOTH a border treatment and a text label;
 * colour is decorative reinforcement only.
 * ---------------------------------------------------------------------- */

const STATUS_STYLES: Record<ComponentStatus, string> = {
  documented_in_reviewed_snapshot:
    "border-cyan/35 bg-cyan/[0.06] text-cyan",
  implemented_acceptance_pending:
    "border-azure/35 bg-azure/[0.06] text-azure",
  partial_not_yet_demonstrated:
    "border-conditional/35 bg-conditional/[0.06] text-conditional",
  known_issue_at_reviewed_snapshot:
    "border-blocked/40 bg-blocked/[0.07] text-blocked",
  current_disposition_unconfirmed:
    "border-unknown/40 bg-unknown/[0.07] text-unknown",
  not_yet_implemented:
    "border-violet/35 bg-violet/[0.06] text-violet",
};

/** Short form shown on the node itself. Never the only carrier of meaning. */
const STATUS_SHORT: Record<ComponentStatus, string> = {
  documented_in_reviewed_snapshot: "documented",
  implemented_acceptance_pending: "implemented · pending acceptance",
  partial_not_yet_demonstrated: "partial",
  known_issue_at_reviewed_snapshot: "known issue",
  current_disposition_unconfirmed: "disposition unconfirmed",
  not_yet_implemented: "not implemented",
};

/**
 * Trust role drives a small text marker, because the trust boundary is a
 * property of the ARCHITECTURE while status is a property of the EVIDENCE.
 * Conflating them would let "authorization" quietly imply "implemented".
 */
const TRUST_LABEL: Record<TrustRole, string> = {
  proposal: "proposes only",
  authorization: "authorization authority",
  enforcement: "enforcement authority",
  mechanism: "mechanism, not authority",
  evidence: "evidence, never authorization",
  evaluation: "evaluation, not a second brain",
  governance: "governance authority",
  orchestration: "sequencing only",
};

const TRUST_DOT: Record<TrustRole, string> = {
  proposal: "bg-azure/70",
  authorization: "bg-blocked/80",
  enforcement: "bg-blocked/80",
  mechanism: "bg-conditional/70",
  evidence: "bg-cyan/70",
  evaluation: "bg-violet/70",
  governance: "bg-violet/80",
  orchestration: "bg-ink-faint",
};

const BAND_STYLES: Record<ArchitectureBand["emphasis"], string> = {
  canonical: "border-hairline bg-elevated/40",
  separate: "border-hairline-strong bg-abyss/60",
  proposed: "border-violet/25 bg-violet/[0.03]",
};

/** A connector label describing the relationship between two nodes. */
function Connector({ label, legacy }: { label: string; legacy: boolean }) {
  return (
    <li
      aria-hidden
      className="flex items-center justify-center gap-2 py-1 sm:py-0 sm:pl-1 sm:pr-1"
    >
      <span
        className={`h-px w-8 shrink-0 ${
          legacy
            ? "border-t border-dashed border-blocked/45"
            : "bg-hairline-strong"
        }`}
      />
      <span
        className={`font-mono text-[10px] uppercase tracking-[0.08em] ${
          legacy ? "text-blocked/75" : "text-ink-faint"
        }`}
      >
        {label}
      </span>
      <span
        className={`h-px w-8 shrink-0 ${
          legacy
            ? "border-t border-dashed border-blocked/45"
            : "bg-hairline-strong"
        }`}
      />
    </li>
  );
}

/** One band: a labelled region containing an ordered component sequence. */
function Band({
  band,
  components,
  activeId,
  onSelect,
}: {
  band: ArchitectureBand;
  components: readonly ArchitectureComponent[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  // Preserve declared order; drop components that are not in this band.
  const ordered = components.filter((c) => band.componentIds.includes(c.id));

  return (
    <section
      aria-label={band.label}
      className={`rounded-lg border p-4 ${BAND_STYLES[band.emphasis]}`}
    >
      <header className="mb-3">
        <h3
          className={`text-[12px] font-semibold uppercase tracking-[0.1em] ${
            band.emphasis === "proposed" ? "text-violet" : "text-ink"
          }`}
        >
          {band.label}
        </h3>
        {band.caption ? (
          <p className="mt-1 text-[11.5px] leading-snug text-ink-faint">{band.caption}</p>
        ) : null}
      </header>

      {/* The sequence. Flex column keeps declared order at every width. */}
      <ol className="flex flex-col">
        {ordered.map((component, i) => (
          <li key={component.id} className="flex flex-col">
            {i > 0 ? <Connector label="then" legacy={band.emphasis === "separate"} /> : null}
            <NodeButton
              component={component}
              isActive={activeId === component.id}
              onSelect={onSelect}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function NodeButton({
  component,
  isActive,
  onSelect,
}: {
  component: ArchitectureComponent;
  isActive: boolean;
  onSelect: (id: string) => void;
}) {
  const stage = component.stageLabel;

  return (
    <button
      type="button"
      onClick={() => onSelect(isActive ? "" : component.id)}
      aria-pressed={isActive}
      aria-label={`${component.label}${stage ? `, stage ${stage}` : ""}. ${TRUST_LABEL[component.trustRole]}. Status: ${legendEntryFor(component.status).label}. ${component.responsibility} Select for responsibility, invariant, limitation and required evidence.`}
      className={`group w-full rounded-md border px-3.5 py-2.5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan motion-reduce:transition-none ${
        STATUS_STYLES[component.status]
      } ${
        isActive
          ? "ring-1 ring-cyan/60 shadow-[0_0_24px_-10px_rgba(34,211,238,0.6)]"
          : "hover:brightness-125"
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {stage ? (
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] opacity-80">
            {stage}
          </span>
        ) : null}
        <span className="text-[13px] font-medium leading-snug text-ink">{component.label}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {/* Trust role: a dot PLUS a word. Never the dot alone. */}
        <span className="inline-flex items-center gap-1">
          <span aria-hidden className={`size-1 rounded-full ${TRUST_DOT[component.trustRole]}`} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-faint">
            {TRUST_LABEL[component.trustRole]}
          </span>
        </span>
      </div>

      {/* Status as TEXT. This is the element that guarantees status is never
          communicated by colour alone. */}
      <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.06em] opacity-90">
        {STATUS_SHORT[component.status]}
      </span>

      <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-muted">
        {component.responsibility}
      </span>
    </button>
  );
}

/** The detail panel for the selected component. */
function Inspector({
  component,
  onClose,
}: {
  component: ArchitectureComponent;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const legend = legendEntryFor(component.status);

  return (
    <motion.aside
      key={component.id}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      aria-live="polite"
      className="surface p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {component.stageLabel ? (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
              {component.stageLabel}
            </span>
          ) : null}
          <h3 className="mt-0.5 text-[16px] font-semibold tracking-tight text-ink">
            {component.label}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-hairline px-2.5 py-1 text-[12px] text-ink-dim transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          Close
        </button>
      </div>

      <dl className="mt-4 space-y-4 text-[13px] leading-relaxed">
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
            Responsibility
          </dt>
          <dd className="mt-1 text-ink-muted">{component.responsibility}</dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
            Documented status
          </dt>
          <dd className="mt-1.5 flex flex-wrap items-center gap-2">
            <span
              className={`chip ${STATUS_STYLES[component.status]} border`}
            >
              {legend.label}
            </span>
            <EvidenceTag label="DOCUMENTED" />
          </dd>
          <dd className="mt-1.5 text-ink-faint">{legend.meaning}</dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-cyan">
            Main invariant
          </dt>
          <dd className="mt-1 text-ink-muted">{component.invariant}</dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-conditional">
            Known limitation
          </dt>
          <dd className="mt-1 text-ink-muted">{component.limitation}</dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-azure">
            Evidence required to demonstrate completion
          </dt>
          <dd className="mt-1 text-ink-muted">{component.evidenceRequired}</dd>
        </div>

        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
            Trust role
          </dt>
          <dd className="mt-1 text-ink-muted">{TRUST_LABEL[component.trustRole]}</dd>
        </div>
      </dl>

      <p className="mt-5 border-t border-hairline pt-3 text-[11px] leading-relaxed text-ink-faint">
        {component.sourceNote}
      </p>
    </motion.aside>
  );
}

export function ArchitectureExplorerDiagram({ model }: { model: ArchitectureDiagramModel }) {
  const [activeId, setActiveId] = useState<string>("");

  const active = useMemo(
    () => model.components.find((c) => c.id === activeId) ?? null,
    [model.components, activeId],
  );

  const visibleStatuses = useMemo(() => {
    const set = new Set<ComponentStatus>();
    for (const c of model.components) set.add(c.status);
    return Array.from(set);
  }, [model.components]);

  return (
    <div className="space-y-6">
      {/* ---------- status line: cannot be skipped ---------- */}
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-4 py-3 ${
          model.view === "target"
            ? "border-violet/35 bg-violet/[0.05]"
            : "border-cyan/30 bg-cyan/[0.04]"
        }`}
      >
        <span
          className={`chip border ${
            model.view === "target"
              ? "border-violet/40 bg-violet/10 text-violet"
              : "border-cyan/40 bg-cyan/10 text-cyan"
          }`}
        >
          {model.statusLabel}
        </span>
        <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink-muted">
          {model.framing}
        </p>
      </div>

      {/* ---------- always-visible key properties ----------
          These headline security claims must not require a click to discover.
          Each component's invariant says the same thing in context, but an
          invariant hidden behind a selection is an invariant most readers never
          see, and "denies by default" is exactly the claim that must never be
          one click away from invisible. */}
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Key properties of this architecture">
        {model.keyProperties.map((property) => (
          <li
            key={property.label}
            className="rounded-md border border-hairline bg-elevated/40 px-3.5 py-2.5"
          >
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <ShieldCheck size={12} aria-hidden className="shrink-0 text-cyan" />
              {property.label}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-muted">{property.text}</p>
          </li>
        ))}
      </ul>

      {/* ---------- diagram ---------- */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div
          role="group"
          aria-label={`${model.title}. Components in declared sequence.`}
          className="space-y-4"
        >
          {model.bands.map((band) => (
            <Band
              key={band.id}
              band={band}
              components={model.components}
              activeId={activeId}
              onSelect={setActiveId}
            />
          ))}
        </div>

        {/* ---------- inspector ---------- */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {active ? (
            <Inspector component={active} onClose={() => setActiveId("")} />
          ) : (
            <div className="surface p-5">
              <h3 className="text-[13px] font-semibold text-ink">Component inspector</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-dim">
                Select any component to see its responsibility, documented status, main invariant,
                known limitation, and the evidence that would be required to demonstrate completion.
              </p>

              {/* Legend: every status present in THIS diagram, as words. */}
              <div className="mt-5 border-t border-hairline pt-4">
                <h4 className="text-[10.5px] uppercase tracking-[0.1em] text-ink-dim">
                  Status key for this diagram
                </h4>
                <ul className="mt-2.5 space-y-2">
                  {visibleStatuses.map((status) => {
                    const entry = legendEntryFor(status);
                    return (
                      <li key={status} className="flex flex-col gap-1">
                        <span
                          className={`chip border self-start ${STATUS_STYLES[status]}`}
                        >
                          {entry.label}
                        </span>
                        <span className="text-[11px] leading-snug text-ink-faint">
                          {entry.meaning}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
