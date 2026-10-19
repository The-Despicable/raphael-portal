"use client";

import { useState } from "react";
import type { ArchNode } from "@/lib/types";
import { EvidenceTag } from "@/components/ui/primitives";
import { motion } from "motion/react";
import { useReducedMotionPreference } from "@/components/ui/reduced-motion";

/**
 * Interactive architecture diagram.
 *
 * ACCESSIBILITY
 * -------------
 * Implemented as real <button> elements in a labelled flow rather than a
 * decorative SVG, so each node is in the tab order, has an accessible name that
 * includes its position, and is operable with Enter/Space. Connectors are
 * decorative and hidden from assistive technology.
 *
 * RESPONSIVE BEHAVIOUR
 * --------------------
 * The chain wraps into a vertical flow below the sm breakpoint. Node order is
 * preserved and announced, because the sequence IS the meaning — a diagram that
 * silently reordered itself on mobile would misrepresent the architecture.
 */

const KIND_LABEL: Record<ArchNode["kind"], string> = {
  input: "input",
  decision: "policy decision",
  enforcement: "enforcement",
  execution: "execution",
  evidence: "evidence",
  store: "store",
};

export function ArchitectureDiagram({
  nodes,
  edges,
}: {
  nodes: readonly ArchNode[];
  edges: readonly { from: string; to: string; label: string }[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const reduced = useReducedMotionPreference();

  const active = nodes.find((n) => n.id === activeId) ?? null;
  const activeIndex = active ? nodes.findIndex((n) => n.id === active.id) : -1;

  const edgeLabel = (from: string) => edges.find((e) => e.from === from)?.label;

  return (
    <div className="space-y-6">
      {/* ---------------- flow ---------------- */}
      <div
        role="group"
        aria-label="Documented canonical execution chain, in order"
        className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0"
      >
        {nodes.map((node, i) => {
          const isActive = node.id === activeId;
          const isAdjacent = activeIndex >= 0 && Math.abs(i - activeIndex) === 1;
          const dimmed = activeIndex >= 0 && !isActive && !isAdjacent;

          return (
            <div key={node.id} className="flex flex-col sm:flex-1 sm:flex-row sm:items-stretch">
              <button
                type="button"
                onClick={() => setActiveId(isActive ? null : node.id)}
                aria-pressed={isActive}
                aria-label={`${node.label}, step ${i + 1} of ${nodes.length}. ${KIND_LABEL[node.kind]}. ${node.shortDescription}`}
                className={`group relative flex flex-1 flex-col rounded-lg border px-4 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? "border-cyan/70 bg-cyan/[0.08] shadow-[0_0_28px_-8px_rgba(34,211,238,0.55)]"
                    : "border-hairline bg-elevated/70 hover:border-cyan/40 hover:bg-elevated"
                } ${dimmed ? "opacity-45" : "opacity-100"}`}
              >
                <span className="block font-mono text-[12.5px] font-medium text-cyan">{node.label}</span>
                <span className="mt-1 block text-[11px] uppercase tracking-[0.08em] text-ink-faint">
                  {KIND_LABEL[node.kind]}
                </span>
                <span className="mt-1.5 block text-[11.5px] leading-snug text-ink-dim">
                  {node.shortDescription}
                </span>
                <span className="mt-auto block pt-2 text-[10.5px] text-ink-faint">
                  {isActive ? "Selected — details below" : "Select for detail"}
                </span>
              </button>

              {i < nodes.length - 1 ? (
                <div
                  aria-hidden
                  className="flex shrink-0 items-center justify-center px-1 py-1 sm:px-1.5 sm:py-0"
                >
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" className="sm:[writing-mode:vertical-rl]">
                    <line
                      x1="2"
                      y1="8"
                      x2="16"
                      y2="8"
                      stroke={isAdjacent ? "rgba(34,211,238,0.75)" : "rgba(148,163,184,0.28)"}
                      strokeWidth="1.25"
                      style={{ transition: "stroke 300ms ease" }}
                    />
                    <path
                      d="M15 4.5L19.5 8L15 11.5"
                      stroke={isAdjacent ? "rgba(34,211,238,0.9)" : "rgba(148,163,184,0.42)"}
                      strokeWidth="1.25"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      style={{ transition: "stroke 300ms ease" }}
                    />
                  </svg>
                  <span className="sr-only">then</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {activeIndex >= 0 && edgeLabel(nodes[Math.max(0, activeIndex - 1)]?.id) ? null : null}

      {/* ---------------- detail panel ---------------- */}
      {active ? (
        <motion.div
          key={active.id}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="surface p-6"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="font-mono text-[13px] text-cyan">{active.label}</span>
              <h3 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                {active.shortDescription}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="rounded border border-hairline px-2.5 py-1 text-[12px] text-ink-dim transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Inputs</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-ink-muted">{active.inputs}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.1em] text-ink-dim">Outputs</dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-ink-muted">{active.outputs}</dd>
            </div>
          </dl>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-cyan/25 bg-cyan/[0.04] p-4">
              <EvidenceTag label="VERIFIED" />
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">
                <span className="font-medium text-ink">What is documented.</span> {active.documented}
              </p>
            </div>
            <div className="rounded-lg border border-conditional/25 bg-conditional/[0.04] p-4">
              <span className="chip border-conditional/35 bg-conditional/10 text-conditional">
                to verify
              </span>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink-muted">{active.toVerify}</p>
            </div>
          </div>

          <p className="mt-5 border-t border-hairline pt-4 text-[11.5px] leading-relaxed text-ink-faint">
            {active.sourceNote}
          </p>
        </motion.div>
      ) : (
        <p className="text-[12.5px] text-ink-faint">
          Select any node to see its inputs, outputs, what is documented, and what remains unverified.
        </p>
      )}
    </div>
  );
}