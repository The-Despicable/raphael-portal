"use client";

import { useCallback, useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog.
 *
 * The portal had no dialog primitive, so this adds one rather than shipping an
 * ad-hoc overlay on a single page. It follows the WAI-ARIA dialog pattern:
 *
 *  - `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, so assistive
 *    technology announces what the surface is before its contents.
 *  - Focus moves to the dialog on open and is RESTORED to the trigger on close,
 *    so keyboard users are not dropped at the top of the document.
 *  - Tab is trapped inside the dialog while it is open.
 *  - Escape and a backdrop click both close it; neither is the only way out,
 *    and a visible close button is always present.
 *  - Body scroll is locked while open, without a layout shift.
 *  - Nothing animates under `prefers-reduced-motion`.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "wide",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "wide" | "full";
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  // Escape closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Move focus in on open, restore it on close.
  useEffect(() => {
    if (open) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else {
      restoreRef.current?.focus?.();
      restoreRef.current = null;
    }
  }, [open]);

  // Tab trap.
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const root = panelRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el.tagName === "IFRAME",
    );
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === root)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Lock background scroll without shifting layout.
  useEffect(() => {
    if (!open) return;
    const { body, documentElement } = document;
    const scrollbar = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  if (!open) return null;

  const maxW = size === "full" ? "max-w-[1600px]" : "max-w-6xl";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-3 sm:p-6"
      style={{ backgroundColor: "rgba(2, 5, 10, 0.82)" }}
      onMouseDown={(e) => {
        // Backdrop click closes. Guarded so a drag that started inside the
        // panel and ended on the backdrop does not close it.
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className={`mt-2 w-full ${maxW} rounded-xl border border-hairline-strong bg-abyss shadow-2xl outline-none sm:mt-6`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold tracking-tight text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="shrink-0 rounded-md border border-hairline p-2 text-ink-muted transition-colors duration-200 hover:border-hairline-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          >
            <X size={16} aria-hidden />
          </button>
        </header>

        {children}
      </div>
    </div>
  );
}
